"use client";

import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import { Clock, FileText, Quote, Sparkles, Volume2, MousePointerClick, CheckCircle, RefreshCw, BarChart3, Keyboard } from "lucide-react";
import { calculateFocusScore } from "@/utils/aiEngine";
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

  return (
    <div className="w-full h-[calc(100vh-3rem)] min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col justify-between items-center py-4 px-4 sm:px-6 bg-background relative select-none">
      
      {/* 1. COMPACT CONTROLS TOOLBAR (Visible when not completed) */}
      {status !== "completed" ? (
        <div className="w-full max-w-[75ch] flex items-center justify-between bg-card/40 border border-border-hairline rounded-lg px-4 py-1.5 font-mono text-xs text-muted shadow-xs gap-4 overflow-x-auto whitespace-nowrap scrollbar-none animate-fadeIn">
          
          {/* Mode Selector */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setMode("time")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "time" ? "text-primary bg-primary/10 font-semibold" : "hover:text-foreground"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Time</span>
            </button>
            <button
              onClick={() => setMode("words")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "words" ? "text-primary bg-primary/10 font-semibold" : "hover:text-foreground"
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Words</span>
            </button>
            <button
              onClick={() => setMode("quote")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "quote" ? "text-primary bg-primary/10 font-semibold" : "hover:text-foreground"
              }`}
            >
              <Quote className="w-3 h-3" />
              <span>Quote</span>
            </button>
            <button
              onClick={() => setMode("custom")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "custom" ? "text-primary bg-primary/10 font-semibold" : "hover:text-foreground"
              }`}
              title="AI custom word list targeting weak keys"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Coach</span>
            </button>
          </div>

          {/* Limit / Duration Options */}
          {mode === "time" && (
            <div className="flex items-center space-x-1 border-l border-border-hairline/60 pl-3 shrink-0">
              <span className="text-[10px] text-muted-soft uppercase tracking-wider mr-1">Secs:</span>
              {[15, 30, 60, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setLimit(t)}
                  className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    limit === t ? "text-primary font-semibold underline underline-offset-4 decoration-2" : "hover:text-foreground"
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          )}

          {mode === "words" && (
            <div className="flex items-center space-x-1 border-l border-border-hairline/60 pl-3 shrink-0">
              <span className="text-[10px] text-muted-soft uppercase tracking-wider mr-1">Count:</span>
              {[10, 25, 50, 100].map((w) => (
                <button
                  key={w}
                  onClick={() => setLimit(w)}
                  className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    limit === w ? "text-primary font-semibold underline underline-offset-4 decoration-2" : "hover:text-foreground"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {/* Layout, Sound & Caret Dropdowns */}
          <div className="flex items-center space-x-3 border-l border-border-hairline/60 pl-3 shrink-0">
            {/* Layout */}
            <div className="flex items-center space-x-1">
              <Keyboard className="w-3.5 h-3.5 text-muted-soft" />
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                className="bg-transparent text-muted hover:text-foreground text-[11px] outline-none border-none cursor-pointer pr-1"
              >
                <option value="qwerty" className="bg-card">QWERTY</option>
                <option value="dvorak" className="bg-card">Dvorak</option>
                <option value="colemak" className="bg-card">Colemak</option>
              </select>
            </div>

            {/* Sound */}
            <div className="flex items-center space-x-1">
              <Volume2 className="w-3.5 h-3.5 text-muted-soft" />
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as "mechanical" | "click" | "bubble" | "silent")}
                className="bg-transparent text-muted hover:text-foreground text-[11px] outline-none border-none cursor-pointer pr-1"
              >
                <option value="click" className="bg-card">Click</option>
                <option value="mechanical" className="bg-card">Clack</option>
                <option value="bubble" className="bg-card">Bubble</option>
                <option value="silent" className="bg-card">Mute</option>
              </select>
            </div>

            {/* Caret */}
            <div className="flex items-center space-x-1">
              <MousePointerClick className="w-3.5 h-3.5 text-muted-soft" />
              <select
                value={caretType}
                onChange={(e) => setCaretType(e.target.value as CaretType)}
                className="bg-transparent text-muted hover:text-foreground text-[11px] outline-none border-none cursor-pointer pr-1"
              >
                <option value="smooth" className="bg-card">Line</option>
                <option value="block" className="bg-card">Block</option>
                <option value="underline" className="bg-card">Under</option>
                <option value="hidden" className="bg-card">Hide</option>
              </select>
            </div>
          </div>

        </div>
      ) : (
        <div className="h-6" /> // spacer to align top when scorecard is active
      )}

      {/* 2. MIDDLE TYPING ZONE (Centered vertically) */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {status !== "completed" ? (
          <div className="w-full flex flex-col items-center gap-3">
            
            {/* Live stats HUD - Minimal design */}
            <div className="flex items-center gap-6 font-mono text-xs text-muted-soft h-6 select-none transition-opacity duration-200">
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
            <div className="w-full max-w-[75ch]">
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
        ) : (
          /* Finished Test Scorecard */
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
        )}
      </div>

      {/* spacer or simple placeholder for keyboard alignment */}
      <div className="h-2" />

    </div>
  );
}
