"use client";

import { useState, useEffect } from "react";
import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import { Clock, FileText, Quote, Sparkles, Volume2, MousePointerClick, CheckCircle, RefreshCw, BarChart3, Keyboard } from "lucide-react";
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
      // Don't register virtual pressed keys if test is complete
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
      setHeatmapData(data);
    } catch (e) {
      console.error("Failed to compile keyboard heatmap stats", e);
    }
  }, [status]);

  return (
    <div className="w-full flex-1 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between items-center bg-background relative select-none px-4 sm:px-6 py-8">
      
      {status !== "completed" ? (
        <>
          {/* 1. COMPACT CONTROLS TOOLBAR (Filters stay exactly at the top) */}
          <div className="w-full max-w-[min(1400px,95vw)] flex items-center justify-between bg-card/60 border-2 border-primary/20 rounded-[18px] px-8 h-[64px] font-mono text-sm text-muted shadow-lg gap-6 overflow-x-auto whitespace-nowrap scrollbar-none animate-fadeIn transition-all-smooth shrink-0">
            
            {/* Left: Mode Selector */}
            <div className="flex items-center bg-background/40 p-1 rounded-xl border border-border-hairline/50 shrink-0">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === "time" ? "text-primary bg-primary/15 shadow-sm" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === "words" ? "text-primary bg-primary/15 shadow-sm" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === "quote" ? "text-primary bg-primary/15 shadow-sm" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Quote className="w-4 h-4" />
                <span>quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === "custom" ? "text-primary bg-primary/15 shadow-sm" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>zen</span>
              </button>
            </div>

            {/* Center: Limit / Duration Options (Centered in the bar) */}
            <div className="flex-1 flex justify-center border-x border-border-hairline/60 px-6">
              {mode === "time" && (
                <div className="flex items-center gap-1">
                  {[15, 30, 60, 120].map((t) => (
                    <button
                      key={t}
                      onClick={() => setLimit(t)}
                      className={`min-w-[50px] px-4 py-1.5 rounded-lg text-base transition-all duration-200 cursor-pointer font-bold ${
                        limit === t 
                          ? "text-primary bg-primary/10 ring-1 ring-primary/30" 
                          : "hover:text-foreground text-muted-soft hover:bg-card/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-muted-soft/60 uppercase tracking-tighter">seconds</span>
                </div>
              )}

              {mode === "words" && (
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((w) => (
                    <button
                      key={w}
                      onClick={() => setLimit(w)}
                      className={`min-w-[50px] px-4 py-1.5 rounded-lg text-base transition-all duration-200 cursor-pointer font-bold ${
                        limit === w 
                          ? "text-primary bg-primary/10 ring-1 ring-primary/30" 
                          : "hover:text-foreground text-muted-soft hover:bg-card/80"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-muted-soft/60 uppercase tracking-tighter">words</span>
                </div>
              )}
            </div>

            {/* Right: Layout, Sound & Caret Dropdowns */}
            <div className="flex items-center space-x-4 pl-4 shrink-0">
              {/* Layout */}
              <div className="flex items-center space-x-1.5">
                <Keyboard className="w-4 h-4 text-muted-soft" />
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                  className="bg-transparent text-muted hover:text-foreground text-[13.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="qwerty" className="bg-card">QWERTY</option>
                  <option value="dvorak" className="bg-card">Dvorak</option>
                  <option value="colemak" className="bg-card">Colemak</option>
                </select>
              </div>

              {/* Sound */}
              <div className="flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-muted-soft" />
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as "mechanical" | "click" | "bubble" | "silent")}
                  className="bg-transparent text-muted hover:text-foreground text-[13.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="click" className="bg-card">Click</option>
                  <option value="mechanical" className="bg-card">Clack</option>
                  <option value="bubble" className="bg-card">Bubble</option>
                  <option value="silent" className="bg-card">Mute</option>
                </select>
              </div>

              {/* Caret */}
              <div className="flex items-center space-x-1.5">
                <MousePointerClick className="w-4 h-4 text-muted-soft" />
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as CaretType)}
                  className="bg-transparent text-muted hover:text-foreground text-[13.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="smooth" className="bg-card">Line</option>
                  <option value="block" className="bg-card">Block</option>
                  <option value="underline" className="bg-card">Under</option>
                  <option value="hidden" className="bg-card">Hide</option>
                </select>
              </div>
            </div>

          </div>

          {/* 2. CENTERED EXPERIENCE BLOCK (Stats HUD & Word board exactly in center of remaining space) */}
          <div className="w-full flex-1 flex flex-col justify-center items-center py-4">
            
            {/* Live stats HUD - Minimal design */}
            <div className="flex items-center gap-6 font-mono text-xs text-muted-soft h-6 select-none transition-opacity duration-200 mb-[24px] shrink-0">
              <div className="flex items-center gap-1">
                <span>time:</span>
                <span className="text-foreground font-semibold">
                  {status === "typing"
                    ? (mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`)
                    : (mode === "time" ? `${limit}s` : `--`)}
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1">
                <span>wpm:</span>
                <span className="text-primary font-semibold">{status === "typing" ? wpm : `--`}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1">
                <span>acc:</span>
                <span className="text-success font-semibold">{status === "typing" ? `${accuracy}%` : `100%`}</span>
              </div>
            </div>

            {/* Word board wrapper */}
            <div className="w-full max-w-[min(1500px,98vw)]">
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

          </div>

          {/* 3. FIXED BOTTOM SECTION: Virtual Keyboard near the bottom of viewport */}
          <div className="w-full max-w-[740px] pb-2 animate-fadeIn shrink-0">
            <VirtualKeyboard 
              layout={layout} 
              pressedKeys={pressedKeys} 
              heatmapMode="latency"
              heatmapData={heatmapData}
            />
          </div>
        </>
      ) : (
        /* Finished Test Scorecard Centered Vertically */
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-full max-w-[75ch] bg-card border border-border-hairline rounded-lg p-6 animate-fadeIn flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <h2 className="text-lg font-serif text-foreground">Session Complete</h2>
              </div>
              <button
                onClick={restartTest}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs font-mono rounded shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset workbench</span>
              </button>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              
              <div className="bg-background border border-border-hairline p-3 rounded">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Speed</p>
                <p className="text-2xl font-mono font-bold text-primary">{wpm}</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">WPM</p>
              </div>

              <div className="bg-background border border-border-hairline p-3 rounded">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Accuracy</p>
                <p className="text-2xl font-mono font-bold text-success">{accuracy}%</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">correct keys</p>
              </div>

              <div className="bg-background border border-border-hairline p-3 rounded">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Focus</p>
                <p className="text-2xl font-mono font-bold text-accent-teal">{finalFocusScore}%</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">consistency</p>
              </div>

              <div className="bg-background border border-border-hairline p-3 rounded">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Mistakes</p>
                <p className="text-2xl font-mono font-bold text-error">{rawMistakes}</p>
                <p className="text-[9px] font-mono text-muted-soft leading-none">incorrect keys</p>
              </div>

            </div>

            {/* Redirection Prompt */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-background border border-border-hairline rounded p-3 gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-primary/10 text-primary rounded shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Detailed Latency Heatmap</h3>
                  <p className="text-[11px] text-muted leading-tight">Inspect standard deviations and identify exact letters that slow your transition flow.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center px-3 py-1.5 border border-border-hairline hover:border-primary/50 text-xs font-mono rounded text-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  href="/ai-coach"
                  className="flex-1 text-center px-3 py-1.5 bg-primary/15 text-primary hover:bg-primary-hover/20 border border-primary/35 text-xs font-mono rounded transition-colors whitespace-nowrap"
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
