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
    <div className="w-full flex-1 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-start items-center bg-background relative select-none px-4 sm:px-6 pt-[36px]">
      
      {/* 1. COMPACT CONTROLS TOOLBAR (Visible when not completed) */}
      {status !== "completed" ? (
        <div className="w-full flex flex-col items-center mt-2">
          {/* Filters Bar */}
          <div className="w-full max-w-[min(1080px,86vw)] flex items-center justify-between bg-card/40 border border-border-hairline/60 rounded-[14px] px-6 h-[50px] font-mono text-sm text-muted shadow-xs gap-6 overflow-x-auto whitespace-nowrap scrollbar-none animate-fadeIn mb-[8px] transition-all-smooth">
            
            {/* Mode Selector */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === "time" ? "text-primary bg-primary/10 font-semibold border border-primary/15 shadow-[0_2px_8px_color-mix(in_srgb,var(--primary)_15%,transparent)]" : "hover:text-foreground hover:bg-card/70"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === "words" ? "text-primary bg-primary/10 font-semibold border border-primary/15 shadow-[0_2px_8px_color-mix(in_srgb,var(--primary)_15%,transparent)]" : "hover:text-foreground hover:bg-card/70"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === "quote" ? "text-primary bg-primary/10 font-semibold border border-primary/15 shadow-[0_2px_8px_color-mix(in_srgb,var(--primary)_15%,transparent)]" : "hover:text-foreground hover:bg-card/70"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === "custom" ? "text-primary bg-primary/10 font-semibold border border-primary/15 shadow-[0_2px_8px_color-mix(in_srgb,var(--primary)_15%,transparent)]" : "hover:text-foreground hover:bg-card/70"
                }`}
                title="AI custom word list targeting weak keys"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coach</span>
              </button>
            </div>

            {/* Limit / Duration Options */}
            {mode === "time" && (
              <div className="flex items-center space-x-2 border-l border-border-hairline/60 pl-4 shrink-0">
                <span className="text-[11px] text-muted-soft uppercase tracking-wider mr-1">Secs:</span>
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setLimit(t)}
                    className={`px-2 py-0.5 rounded text-sm transition-all duration-200 cursor-pointer ${
                      limit === t ? "text-primary font-semibold underline underline-offset-4 decoration-2" : "hover:text-foreground"
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            )}

            {mode === "words" && (
              <div className="flex items-center space-x-2 border-l border-border-hairline/60 pl-4 shrink-0">
                <span className="text-[11px] text-muted-soft uppercase tracking-wider mr-1">Count:</span>
                {[10, 25, 50, 100].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLimit(w)}
                    className={`px-2 py-0.5 rounded text-sm transition-all duration-200 cursor-pointer ${
                      limit === w ? "text-primary font-semibold underline underline-offset-4 decoration-2" : "hover:text-foreground"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}

            {/* Layout, Sound & Caret Dropdowns */}
            <div className="flex items-center space-x-4 border-l border-border-hairline/60 pl-4 shrink-0">
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

          {/* 2. MIDDLE TYPING ZONE */}
          <div className="w-full flex flex-col items-center">
            
            {/* Live stats HUD - Minimal design */}
            <div className="flex items-center gap-6 font-mono text-xs text-muted-soft h-6 select-none transition-opacity duration-200 mb-[8px]">
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
            <div className="w-full max-w-[min(1080px,86vw)]">
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

      {/* spacer or simple placeholder for keyboard alignment */}
      <div className="h-2" />

    </div>
  );
}
