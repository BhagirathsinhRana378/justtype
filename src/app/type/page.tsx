"use client";

import { useState, useEffect, useMemo } from "react";
import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import { Clock, FileText, Quote, Sparkles, Volume2, CheckCircle, RefreshCw, BarChart3, Keyboard } from "lucide-react";
import { calculateFocusScore, getSavedSessions } from "@/utils/aiEngine";
import Link from "next/link";

export default function TypePage() {
  const {
    mode,
    limit,
    soundType,
    caretType,
    layout,
    words,
    typedInput,
    status,
    timeLeft,
    elapsedTime,
    rawMistakes,
    wpm,
    accuracy,
    getTelemetry,
    setMode,
    setLimit,
    setSoundType,
    setCaretType,
    setLayout,
    restartTest,
    registerKeystroke
  } = useTypingTest();

  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, { errorRate: number; avgLatency: number; score: number }>>({});

  // Compute focus score at the end of the test
  const finalFocusScore = status === "completed" 
    ? calculateFocusScore({
        id: "",
        timestamp: 0,
        wpm,
        accuracy,
        duration: elapsedTime,
        mode,
        telemetry: getTelemetry()
      })
    : 100;

  // Keyboard listeners for pressed keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (status === "completed") return;

      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => prev.filter((k) => k !== key));
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
    };
  }, [status]);

  // Load telemetry stats for keyboard heatmap overlay
  useEffect(() => {
    try {
      const sessions = getSavedSessions();
      interface HeatmapAccumulator {
        total: number;
        errors: number;
        latencies: number[];
      }
      const acc: Record<string, HeatmapAccumulator> = {};
      
      sessions.forEach(session => {
        if (!session.telemetry) return;
        session.telemetry.forEach(t => {
          if (t.key.length !== 1) return;
          const k = t.key.toLowerCase();
          if (!acc[k]) {
            acc[k] = { total: 0, errors: 0, latencies: [] };
          }
          const item = acc[k];
          item.total += 1;
          if (!t.isCorrect) {
            item.errors += 1;
          } else {
            item.latencies.push(t.latency);
          }
        });
      });

      const data: Record<string, { errorRate: number; avgLatency: number; score: number }> = {};
      Object.keys(acc).forEach(k => {
        const item = acc[k];
        const errorRate = item.total > 0 ? item.errors / item.total : 0;
        const sumLatency = item.latencies.reduce((a: number, b: number) => a + b, 0);
        const avgLatency = item.latencies.length > 0 ? sumLatency / item.latencies.length : 0;
        
        const errorPoints = errorRate * 60;
        const latencyRef = Math.max(0, avgLatency - 120);
        const latencyPoints = Math.min(40, (latencyRef / 280) * 40);
        const score = Math.round(errorPoints + latencyPoints);
        
        data[k] = { errorRate, avgLatency, score };
      });
      setTimeout(() => setHeatmapData(data), 0);
    } catch (e) {
      console.error("Failed to compile keyboard heatmap stats", e);
    }
  }, [status]);

  // Calculate the next character to type for the keyboard finger hint
  const nextChar = useMemo(() => {
    if (status === "completed" || !words || words.length === 0) return "";
    const targetText = words.join(" ");
    return targetText[typedInput.length] || "";
  }, [words, typedInput.length, status]);

  const isFocusMode = status === "typing";

  return (
    <div className="w-full flex-1 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between items-center bg-background relative select-none px-4 sm:px-6 py-6 md:py-8 z-10">
      
      {status !== "completed" ? (
        <>
          {/* 1. COMPACT CONTROLS TOOLBAR */}
          <div 
            className={`w-full max-w-[850px] flex items-center justify-between bg-card/25 border border-border-hairline rounded-[12px] px-6 h-[52px] font-mono text-sm text-muted gap-4 overflow-x-auto whitespace-nowrap scrollbar-none transition-all duration-300 shrink-0 ${
              isFocusMode ? "opacity-20 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Left: Mode Selector */}
            <div className="flex items-center bg-background/20 p-0.5 rounded-lg border border-border-hairline/40 shrink-0">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "time" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "words" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "quote" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "custom" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>zen</span>
              </button>
            </div>

            {/* Center: Limit / Duration Options */}
            <div className="flex-1 flex justify-center border-x border-border-hairline/30 px-4">
              {mode === "time" && (
                <div className="flex items-center gap-1">
                  {[15, 30, 60, 120].map((t, i, arr) => (
                    <div key={t} className="flex items-center">
                      <button
                        onClick={() => setLimit(t)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === t 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {t}s
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mode === "words" && (
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((w, i, arr) => (
                    <div key={w} className="flex items-center">
                      <button
                        onClick={() => setLimit(w)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === w 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {w}
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Layout, Sound & Caret Dropdowns */}
            <div className="flex items-center space-x-3 pl-2 shrink-0">
              {/* Layout */}
              <div className="flex items-center space-x-1 font-sans">
                <Keyboard className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="qwerty" className="bg-card">QWERTY</option>
                  <option value="dvorak" className="bg-card">Dvorak</option>
                  <option value="colemak" className="bg-card">Colemak</option>
                </select>
              </div>

              {/* Sound */}
              <div className="flex items-center space-x-1 font-sans">
                <Volume2 className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as Parameters<typeof setSoundType>[0])}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="natural" className="bg-card">Natural</option>
                  <option value="signature" className="bg-card">Signature</option>
                  <option value="typeist" className="bg-card">Typeist</option>
                  <option value="silent" className="bg-card">Silent</option>
                </select>
              </div>

              {/* Caret */}
              <div className="flex items-center space-x-1 font-sans">
                <span className="text-[12.5px] text-muted-soft">|</span>
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as CaretType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1 ml-0.5"
                >
                  <option value="smooth" className="bg-card">Line</option>
                  <option value="block" className="bg-card">Block</option>
                  <option value="underline" className="bg-card">Under</option>
                  <option value="hidden" className="bg-card">Hide</option>
                </select>
              </div>
            </div>

          </div>

          {/* 2. CENTERED EXPERIENCE BLOCK */}
          <div 
            className="w-full flex-1 flex flex-col justify-center items-center py-2 transition-all duration-300 ease-in-out"
            style={{
              maxWidth: isFocusMode ? "1550px" : "850px",
            }}
          >
            {/* Live stats HUD - Minimal design */}
            <div 
              className={`flex items-center gap-6 font-mono text-[11px] text-muted-soft h-6 select-none transition-opacity duration-300 mb-[16px] shrink-0 ${
                isFocusMode ? "opacity-45" : "opacity-90"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>time:</span>
                <span className="text-foreground font-semibold">
                  {status === "typing"
                    ? (mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`)
                    : (mode === "time" ? `${limit}s` : `--`)}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>wpm:</span>
                <span className="text-primary font-semibold">{status === "typing" ? wpm : `--`}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>acc:</span>
                <span className="text-success font-semibold">{status === "typing" ? `${accuracy}%` : `100%`}</span>
              </div>
            </div>

            {/* Word board wrapper */}
            <div className="w-full">
              <TypingTestArea
                words={words}
                typedInput={typedInput}
                status={status}
                caretType={caretType}
                layout={layout}
                registerKeystroke={registerKeystroke}
                restartTest={restartTest}
              />
            </div>

            {/* Restart Info row */}
            <div 
              className={`mt-4 flex items-center gap-3 text-[11px] text-muted-soft select-none font-mono transition-opacity duration-300 ${
                isFocusMode ? "opacity-15 hover:opacity-50" : "opacity-80"
              }`}
            >
              <button
                onClick={() => {
                  restartTest();
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restart</span>
              </button>
              <span>•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-card border border-border-hairline rounded text-[9px] text-muted select-none">Tab</kbd>
                <span>quick reset</span>
              </div>
            </div>

          </div>

          {/* 3. FIXED BOTTOM SECTION: Virtual Keyboard */}
          <div 
            className={`w-full max-w-[740px] transition-all duration-300 shrink-0 select-none ${
              isFocusMode 
                ? "opacity-15 translate-y-6 pointer-events-none" 
                : "opacity-100 translate-y-0"
            }`}
          >
            <VirtualKeyboard 
              layout={layout} 
              pressedKeys={pressedKeys} 
              heatmapMode="none"
              heatmapData={heatmapData}
              interactive={false}
              nextChar={nextChar}
            />
          </div>
        </>
      ) : (
        /* Finished Test Scorecard Centered Vertically */
        <div className="w-full flex-1 flex items-center justify-center animate-fadeIn">
          <div className="w-full max-w-[75ch] bg-card/40 border border-border-hairline rounded-lg p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-hairline/80 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <h2 className="text-base font-serif text-foreground">Session Complete</h2>
              </div>
              <button
                onClick={restartTest}
                className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary/90 text-white text-xs font-mono rounded transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              
              <div className="bg-background/50 border border-border-hairline/60 p-3 rounded-md">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Speed</p>
                <p className="text-2xl font-mono font-bold text-primary">{wpm}</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">WPM</p>
              </div>

              <div className="bg-background/50 border border-border-hairline/60 p-3 rounded-md">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Accuracy</p>
                <p className="text-2xl font-mono font-bold text-success">{accuracy}%</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">correct keys</p>
              </div>

              <div className="bg-background/50 border border-border-hairline/60 p-3 rounded-md">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Focus</p>
                <p className="text-2xl font-mono font-bold text-accent-teal">{finalFocusScore}%</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">consistency</p>
              </div>

              <div className="bg-background/50 border border-border-hairline/60 p-3 rounded-md">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Mistakes</p>
                <p className="text-2xl font-mono font-bold text-error">{rawMistakes}</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">incorrect keys</p>
              </div>

            </div>

            {/* Redirection Prompt */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-background/30 border border-border-hairline rounded-md p-3.5 gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-primary/10 text-primary rounded shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Detailed Latency Heatmap</h3>
                  <p className="text-[11px] text-muted leading-tight">Inspect standard deviations and identify exact letters that slow your transition flow.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0 font-mono">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center px-3 py-1.5 border border-border-hairline hover:border-primary/50 text-xs rounded text-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  href="/ai-coach"
                  className="flex-1 text-center px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 text-xs rounded transition-colors whitespace-nowrap"
                >
                  AI Coach
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
