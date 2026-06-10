"use client";

import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import { Clock, FileText, Quote, Sparkles, Volume2, MousePointerClick, CheckCircle, RefreshCw, BarChart3, Keyboard } from "lucide-react";
import { calculateFocusScore } from "@/utils/aiEngine";
import Link from "next/link";

export default function TestPage() {
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
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif text-foreground">Tactile Workbench</h1>
          <p className="text-sm text-muted">Configure your typing parameters and begin typing instantly. Key strokes are captured on load.</p>
        </div>

        {/* Configuration Tool Bar (Visible when not completed) */}
        {status !== "completed" && (
          <div className="w-full flex flex-wrap gap-4 items-center justify-between bg-card border border-border-hairline rounded-md p-3 sm:px-6">
            
            {/* Mode Select */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  mode === "time" ? "text-foreground bg-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  mode === "words" ? "text-foreground bg-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  mode === "quote" ? "text-foreground bg-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  mode === "custom" ? "text-foreground bg-primary" : "text-muted hover:text-foreground"
                }`}
                title="AI custom word list targeting weak keys"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coach</span>
              </button>
            </div>

            {/* Limit Select (conditional on mode) */}
            {mode === "time" && (
              <div className="flex items-center space-x-2 border-l border-border-hairline pl-4">
                <span className="text-[11px] font-mono text-muted-soft uppercase tracking-wider">Secs:</span>
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setLimit(t)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                      limit === t && mode === "time" ? "text-primary bg-background border border-primary/30" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            )}

            {mode === "words" && (
              <div className="flex items-center space-x-2 border-l border-border-hairline pl-4">
                <span className="text-[11px] font-mono text-muted-soft uppercase tracking-wider">Words:</span>
                {[10, 25, 50, 100].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLimit(w)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                      limit === w && mode === "words" ? "text-primary bg-background border border-primary/30" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}

            {/* Quick sound toggle & caret toggle */}
            <div className="flex items-center flex-wrap gap-4 border-l border-border-hairline pl-4">
              {/* Layout Select */}
              <div className="flex items-center space-x-1">
                <Keyboard className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                  className="bg-transparent text-muted hover:text-foreground text-xs font-mono outline-none border-none cursor-pointer"
                >
                  <option value="qwerty" className="bg-card">QWERTY</option>
                  <option value="dvorak" className="bg-card">Dvorak</option>
                  <option value="colemak" className="bg-card">Colemak</option>
                </select>
              </div>

              {/* Sound Select */}
              <div className="flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as "mechanical" | "click" | "bubble" | "silent")}
                  className="bg-transparent text-muted hover:text-foreground text-xs font-mono outline-none border-none cursor-pointer"
                >
                  <option value="click" className="bg-card">Click</option>
                  <option value="mechanical" className="bg-card">Clack</option>
                  <option value="bubble" className="bg-card">Bubble</option>
                  <option value="silent" className="bg-card">Mute</option>
                </select>
              </div>

              {/* Caret Select */}
              <div className="flex items-center space-x-1">
                <MousePointerClick className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as CaretType)}
                  className="bg-transparent text-muted hover:text-foreground text-xs font-mono outline-none border-none cursor-pointer"
                >
                  <option value="smooth" className="bg-card">Line</option>
                  <option value="block" className="bg-card">Block</option>
                  <option value="underline" className="bg-card">Underscore</option>
                  <option value="hidden" className="bg-card">Hidden</option>
                </select>
              </div>
            </div>

          </div>
        )}

        {/* Live Metrics HUD */}
        {status === "typing" && (
          <div className="flex items-center justify-center gap-10 bg-card border border-border-hairline rounded-md py-2 px-6 w-fit mx-auto font-mono text-sm shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-soft">Time:</span>
              <span className="text-foreground font-semibold">
                {mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-soft">WPM:</span>
              <span className="text-primary font-semibold">{wpm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-soft">Acc:</span>
              <span className="text-success font-semibold">{accuracy}%</span>
            </div>
          </div>
        )}

        {/* Test Typing Board Area */}
        {status !== "completed" ? (
          <div className="flex flex-col gap-4">
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
        ) : (
          /* Finished Test Scorecard */
          <div className="w-full bg-card border border-border-hairline rounded-lg p-8 animate-fadeIn flex flex-col gap-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-hairline pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-success" />
                <h2 className="text-xl font-serif text-foreground">Session Complete</h2>
              </div>
              <button
                onClick={restartTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-mono rounded shadow transition-all-smooth cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Workbench</span>
              </button>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              
              <div className="bg-background border border-border-hairline p-4 rounded-md">
                <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Speed</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-primary">{wpm}</p>
                <p className="text-[10px] font-mono text-muted-soft mt-0.5">Words Per Min</p>
              </div>

              <div className="bg-background border border-border-hairline p-4 rounded-md">
                <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Accuracy</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-success">{accuracy}%</p>
                <p className="text-[10px] font-mono text-muted-soft mt-0.5">Correct Keys</p>
              </div>

              <div className="bg-background border border-border-hairline p-4 rounded-md">
                <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Focus Score</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-accent-teal">{finalFocusScore}%</p>
                <p className="text-[10px] font-mono text-muted-soft mt-0.5">Cadence Steadiness</p>
              </div>

              <div className="bg-background border border-border-hairline p-4 rounded-md">
                <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Mistakes</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-error">{rawMistakes}</p>
                <p className="text-[10px] font-mono text-muted-soft mt-0.5">Incorrect Keys</p>
              </div>

            </div>

            {/* Quick Analytics Redirection Prompt */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-background border border-border-hairline rounded-md p-4 gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-primary/10 text-primary rounded">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Detailed Latency Heatmap</h3>
                  <p className="text-xs text-muted">Inspect standard deviations and identify exact letters that slow your transition flow.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center px-4 py-2 border border-border-hairline hover:border-primary/50 text-xs font-mono rounded text-foreground hover:text-primary transition-all-smooth"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/ai-coach"
                  className="flex-1 text-center px-4 py-2 bg-primary/15 text-primary hover:bg-primary-hover/20 border border-primary/35 text-xs font-mono rounded transition-all-smooth"
                >
                  Consult AI Coach
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
