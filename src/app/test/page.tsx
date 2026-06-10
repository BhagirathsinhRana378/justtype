"use client";

import { useTypingTest } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import { Clock, FileText, Quote, Sparkles, Volume2, CursorClick, CheckCircle, AlertCircle, RefreshCw, BarChart3, Settings } from "lucide-react";
import { calculateFocusScore, TypingSession } from "@/utils/aiEngine";
import Link from "next/link";

export default function TestPage() {
  const {
    mode,
    limit,
    soundType,
    caretType,
    words,
    typedInput,
    status,
    timeLeft,
    elapsedTime,
    rawMistakes,
    wpm,
    accuracy,
    history,
    telemetry,
    setMode,
    setLimit,
    setSoundType,
    setCaretType,
    restartTest,
    registerKeystroke
  } = useTypingTest();

  // Compute focus score at the end of the test
  const finalFocusScore = status === "completed" 
    ? calculateFocusScore({
        id: "",
        timestamp: Date.now(),
        wpm,
        accuracy,
        duration: elapsedTime,
        mode,
        telemetry
      })
    : 100;

  return (
    <div className="flex-1 w-full bg-[#121110] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif text-[#faf9f5]">Tactile Workbench</h1>
          <p className="text-sm text-[#8e8b82]">Configure your typing parameters and begin typing instantly. Key strokes are captured on load.</p>
        </div>

        {/* Configuration Tool Bar (Visible when not completed) */}
        {status !== "completed" && (
          <div className="w-full flex flex-wrap gap-4 items-center justify-between bg-[#1a1917] border border-[#2a2926] rounded-md p-3 sm:px-6">
            
            {/* Mode Select */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  mode === "time" ? "text-[#faf9f5] bg-[#cc785c]" : "text-[#8e8b82] hover:text-[#faf9f5]"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  mode === "words" ? "text-[#faf9f5] bg-[#cc785c]" : "text-[#8e8b82] hover:text-[#faf9f5]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  mode === "quote" ? "text-[#faf9f5] bg-[#cc785c]" : "text-[#8e8b82] hover:text-[#faf9f5]"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  mode === "custom" ? "text-[#faf9f5] bg-[#cc785c]" : "text-[#8e8b82] hover:text-[#faf9f5]"
                }`}
                title="AI custom word list targeting weak keys"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coach</span>
              </button>
            </div>

            {/* Limit Select (conditional on mode) */}
            {mode === "time" && (
              <div className="flex items-center space-x-2 border-l border-[#2a2926] pl-4">
                <span className="text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider">Secs:</span>
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setLimit(t)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                      limit === t && mode === "time" ? "text-[#cc785c] bg-[#121110] border border-[#cc785c]/30" : "text-[#8e8b82] hover:text-[#faf9f5]"
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            )}

            {mode === "words" && (
              <div className="flex items-center space-x-2 border-l border-[#2a2926] pl-4">
                <span className="text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider">Words:</span>
                {[10, 25, 50, 100].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLimit(w)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                      limit === w && mode === "words" ? "text-[#cc785c] bg-[#121110] border border-[#cc785c]/30" : "text-[#8e8b82] hover:text-[#faf9f5]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}

            {/* Quick sound toggle & caret toggle */}
            <div className="flex items-center space-x-4 border-l border-[#2a2926] pl-4">
              {/* Sound Select */}
              <div className="flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-[#6c6a64]" />
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as any)}
                  className="bg-transparent text-[#8e8b82] hover:text-[#faf9f5] text-xs font-mono outline-none border-none cursor-pointer"
                >
                  <option value="click" className="bg-[#1a1917]">Click</option>
                  <option value="mechanical" className="bg-[#1a1917]">Clack</option>
                  <option value="bubble" className="bg-[#1a1917]">Bubble</option>
                  <option value="silent" className="bg-[#1a1917]">Mute</option>
                </select>
              </div>

              {/* Caret Select */}
              <div className="flex items-center space-x-1">
                <CursorClick className="w-3.5 h-3.5 text-[#6c6a64]" />
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as any)}
                  className="bg-transparent text-[#8e8b82] hover:text-[#faf9f5] text-xs font-mono outline-none border-none cursor-pointer"
                >
                  <option value="smooth" className="bg-[#1a1917]">Line</option>
                  <option value="block" className="bg-[#1a1917]">Block</option>
                  <option value="underline" className="bg-[#1a1917]">Underscore</option>
                  <option value="hidden" className="bg-[#1a1917]">Hidden</option>
                </select>
              </div>
            </div>

          </div>
        )}

        {/* Live Metrics HUD */}
        {status === "typing" && (
          <div className="flex items-center justify-center gap-10 bg-[#1a1917] border border-[#2a2926] rounded-md py-2 px-6 w-fit mx-auto font-mono text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[#6c6a64]">Time:</span>
              <span className="text-[#faf9f5] font-semibold">
                {mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6c6a64]">WPM:</span>
              <span className="text-[#cc785c] font-semibold">{wpm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6c6a64]">Acc:</span>
              <span className="text-[#5db872] font-semibold">{accuracy}%</span>
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
              registerKeystroke={registerKeystroke}
              restartTest={restartTest}
            />
          </div>
        ) : (
          /* Finished Test Scorecard */
          <div className="w-full bg-[#1a1917] border border-[#2a2926] rounded-lg p-8 animate-fadeIn flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-[#2a2926] pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[#5db872]" />
                <h2 className="text-xl font-serif text-[#faf9f5]">Session Complete</h2>
              </div>
              <button
                onClick={restartTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono rounded shadow transition-all-smooth"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Workbench</span>
              </button>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              
              <div className="bg-[#121110] border border-[#2a2926] p-4 rounded-md">
                <p className="text-xs font-mono text-[#8e8b82] uppercase tracking-wider mb-1">Speed</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-[#cc785c]">{wpm}</p>
                <p className="text-[10px] font-mono text-[#6c6a64] mt-0.5">Words Per Min</p>
              </div>

              <div className="bg-[#121110] border border-[#2a2926] p-4 rounded-md">
                <p className="text-xs font-mono text-[#8e8b82] uppercase tracking-wider mb-1">Accuracy</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-[#5db872]">{accuracy}%</p>
                <p className="text-[10px] font-mono text-[#6c6a64] mt-0.5">Correct Keys</p>
              </div>

              <div className="bg-[#121110] border border-[#2a2926] p-4 rounded-md">
                <p className="text-xs font-mono text-[#8e8b82] uppercase tracking-wider mb-1">Focus Score</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-[#5db8a6]">{finalFocusScore}%</p>
                <p className="text-[10px] font-mono text-[#6c6a64] mt-0.5">Cadence Steadiness</p>
              </div>

              <div className="bg-[#121110] border border-[#2a2926] p-4 rounded-md">
                <p className="text-xs font-mono text-[#8e8b82] uppercase tracking-wider mb-1">Mistakes</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-[#c64545]">{rawMistakes}</p>
                <p className="text-[10px] font-mono text-[#6c6a64] mt-0.5">Incorrect Keys</p>
              </div>

            </div>

            {/* Quick Analytics Redirection Prompt */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-[#121110] border border-[#2a2926] rounded-md p-4 gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-[#cc785c]/10 text-[#cc785c] rounded">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#faf9f5]">Detailed Latency Heatmap</h3>
                  <p className="text-xs text-[#8e8b82]">Inspect standard deviations and identify exact letters that slow your transition flow.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center px-4 py-2 border border-[#2a2926] hover:border-[#cc785c]/50 text-xs font-mono rounded text-[#faf9f5] hover:text-[#cc785c] transition-all-smooth"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/ai-coach"
                  className="flex-1 text-center px-4 py-2 bg-[#cc785c]/15 text-[#cc785c] hover:bg-[#cc785c]/25 border border-[#cc785c]/35 text-xs font-mono rounded transition-all-smooth"
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
