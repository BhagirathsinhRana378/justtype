"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRaceEngine } from "@/hooks/useRaceEngine";
import RaceCanvas from "@/components/race/RaceCanvas";
import Word from "@/components/Word";
import { ArrowLeft, Trophy, RotateCcw, Timer, Activity, Cpu, Users } from "lucide-react";

const AI_WORDS = [
  "the","and","of","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","at","be",
  "this","have","from","one","had","by","word","but","not","what","all","were","we","when","your","can","said","use",
  "an","each","she","do","how","if","will","up","out","many","then","them","so","some","her","make","like","him","into",
  "time","has","look","two","more","go","see","no","way","my","than","call","who",
];

function genAIText(len = 25) {
  const out = [];
  for (let i = 0; i < len; i++) out.push(AI_WORDS[Math.floor(Math.random() * AI_WORDS.length)]);
  return out.join(" ");
}

const DIFFICULTY_CONFIG = {
  easy: { targetWpm: 40, variance: 0.2 },
  medium: { targetWpm: 62, variance: 0.2 },
  hard: { targetWpm: 90, variance: 0.2 },
};

export default function AIClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "AI Racer";
  const diffKey = (searchParams.get("diff") || "medium") as keyof typeof DIFFICULTY_CONFIG;
  const diff = DIFFICULTY_CONFIG[diffKey] || DIFFICULTY_CONFIG.medium;

  const [phase, setPhase] = useState<"idle" | "countdown" | "racing" | "finished">("idle");
  const [countdown, setCountdown] = useState(0);
  const [raceElapsed, setRaceElapsed] = useState(0);
  const [text, setText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiWpm, setAiWpm] = useState(0);
  const [aiAccuracy, setAiAccuracy] = useState(100);
  const [aiStatus, setAiStatus] = useState<"racing" | "completed">("racing");
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiProgressRef = useRef(0);
  const aiFinishedRef = useRef(false);
  const startTimeRef = useRef(0);
  const finishTimeRef = useRef(0);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    typedInput, wpm, accuracy, progress, handleInput, reset: resetEngine,
  } = useRaceEngine(words);

  const startRace = () => {
    const t = genAIText(25);
    setText(t);
    setWords(t.split(" "));
    setPhase("countdown");
    setCountdown(3);
    resetEngine();
    setAiProgress(0);
    setAiWpm(0);
    setAiAccuracy(100);
    setAiStatus("racing");
    aiProgressRef.current = 0;
    aiFinishedRef.current = false;
    startTimeRef.current = 0;

    let cd = 3;
    const ci = setInterval(() => {
      cd -= 1;
      if (cd <= 0) {
        clearInterval(ci);
        setPhase("racing");
        setCountdown(0);
        startTimeRef.current = Date.now();
        finishTimeRef.current = 0;
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        setCountdown(cd);
      }
    }, 1000);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startRace(); }, []);

  // AI tick
  useEffect(() => {
    if (phase !== "racing") {
      if (aiIntervalRef.current) { window.clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
      return;
    }

    aiIntervalRef.current = setInterval(() => {
      const baseCharsPerMin = diff.targetWpm * 5;
      const charsPerTick = (baseCharsPerMin / 600) * (1 + (Math.random() - 0.5) * diff.variance);
      aiProgressRef.current = Math.min(1, aiProgressRef.current + charsPerTick / text.length);

      const elapsed = startTimeRef.current > 0
        ? (Date.now() - startTimeRef.current) / 1000 / 60
        : 0.01;
      const aiW = Math.round((aiProgressRef.current * text.length / 5) / Math.max(elapsed, 0.01));
      setAiWpm(aiW);
      setAiProgress(aiProgressRef.current);
      setAiAccuracy(Math.round(98 - Math.random() * 3));

      if (aiProgressRef.current >= 1 && !aiFinishedRef.current) {
        aiFinishedRef.current = true;
        setAiStatus("completed");
        if (aiIntervalRef.current) { window.clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
      }
    }, 100);

    return () => {
      if (aiIntervalRef.current) { window.clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    };
  }, [phase, text, diff]);

  // Timer
  useEffect(() => {
    if (phase !== "racing") { setRaceElapsed(0); return; }
    const start = Date.now();
    const iv = setInterval(() => setRaceElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Detect finish
  useEffect(() => {
    if (phase !== "racing") return;
    const myDone = typedInput.length >= text.length && text.length > 0;
    if (myDone && !finishTimeRef.current) {
      finishTimeRef.current = Date.now();
      setPhase("finished");
    }
    if (aiFinishedRef.current && finishTimeRef.current) {
      setPhase("finished");
    }
  }, [typedInput, text, phase]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "racing") return;
    handleInput(e.target.value);
  };

  const players = useMemo(() => {
    const myDone = phase === "finished" && finishTimeRef.current > 0;
    return [
      { id: "me", name: playerName, progress: text.length ? typedInput.length / text.length : 0, wpm, accuracy, status: (myDone ? "completed" : "racing") as "racing" | "completed", finishTime: myDone ? finishTimeRef.current : 0 },
      { id: "ai", name: "AI", progress: aiProgress, wpm: aiWpm, accuracy: aiAccuracy, status: aiStatus, finishTime: aiFinishedRef.current && finishTimeRef.current ? finishTimeRef.current + 2000 : 0 },
    ];
  }, [playerName, typedInput, text, wpm, accuracy, phase, aiProgress, aiWpm, aiAccuracy, aiStatus]);

  const sortedResults = useMemo(() => {
    const completed = [...players].filter((p: any) => p.status === "completed");
    const others = [...players].filter((p: any) => p.status !== "completed");
    completed.sort((a: any, b: any) => (a.finishTime || Infinity) - (b.finishTime || Infinity));
    return [...completed, ...others];
  }, [players]);

  const position = useMemo(() => {
    const me = players[0];
    if (!me) return 0;
    const ahead = players.filter(p => p.id !== "me" && (p.status === "completed" || p.progress > me.progress)).length;
    return ahead + 1;
  }, [players]);

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const activeWordIndex = useMemo(() => Math.max(0, typedInput.split(" ").length - 1), [typedInput]);

  useEffect(() => {
    wordRefs.current = [];
  }, [words]);

  useEffect(() => {
    const activeWordEl = wordRefs.current[activeWordIndex];
    if (activeWordEl) {
      const Y = activeWordEl.offsetTop;
      const H = activeWordEl.offsetHeight;
      if (Y >= H) {
        setTranslateY(H - Y);
      } else {
        setTranslateY(0);
      }
    }
  }, [activeWordIndex]);

  const rematch = () => {
    resetEngine();
    startRace();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0d0711] text-foreground flex flex-col select-none">
      <div className="flex flex-col gap-2 p-3 max-w-5xl mx-auto w-full flex-1">
        <div className="bg-card/40 border border-border-hairline rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/race")} className="p-1 rounded-lg bg-card border border-border-hairline hover:border-primary/50 text-muted hover:text-foreground cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="text-[9px] text-muted-soft uppercase font-bold tracking-wider font-mono">AI Race</div>
              <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <Cpu className="w-3 h-3" /> {diffKey} · {diff.targetWpm} WPM target
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === "racing" && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/50 border border-border-hairline">
                <Timer className="w-3 h-3 text-primary" />
                <span className="font-mono text-xs font-bold">{Math.floor(raceElapsed / 60)}:{(raceElapsed % 60).toString().padStart(2, "0")}</span>
              </div>
            )}
            <span className="text-[8px] text-muted-soft font-mono flex items-center gap-1">
              <Activity className="w-2 h-2 text-success" /> Offline
            </span>
          </div>
        </div>

        <div className="bg-card border border-border-hairline rounded-xl overflow-hidden shadow-lg flex-1 min-h-[240px] relative backdrop-blur-md">
          {phase === "racing" || phase === "finished" ? (
            <RaceCanvas players={players} myPlayerId="me" isRacing={phase === "racing"} />
          ) : (
            <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-card/30">
              <div className="text-center px-4">
                <Users className="w-10 h-10 text-primary/40 mx-auto mb-2" />
                <p className="text-[11px] text-muted-soft">Race track will appear here</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border-hairline rounded-xl relative backdrop-blur-md">
          {phase === "countdown" && (
            <div className="flex flex-col items-center justify-center py-8 animate-pulse">
              <span className="text-[10px] text-muted-soft uppercase font-bold tracking-wider mb-1">Race starting</span>
              <div className="text-6xl font-serif font-black text-primary font-mono tracking-tighter race-countdown-number">{countdown}</div>
            </div>
          )}

          {phase === "racing" && (
            <div className="flex flex-col">
              <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-background/30 border-b border-border-hairline/30">
                {[
                  { label: "Pos", value: `#${position}`, c: "text-primary font-bold" },
                  { label: "WPM", value: `${wpm}`, c: "" },
                  { label: "Acc", value: `${accuracy}%`, c: "text-success" },
                  { label: "Done", value: `${Math.round(progress * 100)}%`, c: "" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-[8px] uppercase font-bold text-muted-soft">{s.label}</div>
                    <div className={`text-xs font-bold font-mono ${s.c}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div 
                ref={containerRef} 
                onClick={() => inputRef.current?.focus()} 
                className="relative cursor-text select-none overflow-hidden py-6 px-6" 
                style={{ 
                  height: "calc(3 * var(--typing-font-size) * var(--typing-line-height) + 2rem)",
                  minHeight: "180px"
                }}
              >
                {!focused && (
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-20 backdrop-blur-[1px]">
                    <span className="text-muted-soft text-xs font-mono bg-card px-4 py-2 border border-border-hairline rounded shadow-md">[ click to focus ]</span>
                  </div>
                )}
                <div
                  className="w-full relative transition-transform duration-300 ease-out"
                  style={{ transform: `translateY(${translateY}px)` }}
                >
                  <div 
                    className="flex flex-wrap text-left"
                    style={{
                      fontFamily: "var(--typing-font-family)",
                      fontSize: "var(--typing-font-size)",
                      lineHeight: "var(--typing-line-height)",
                      letterSpacing: "var(--typing-letter-spacing)",
                    }}
                  >
                    {words.map((word, wordIndex) => {
                      const isActive = wordIndex === activeWordIndex;
                      const isPast = wordIndex < activeWordIndex;

                      return (
                        <span
                          key={wordIndex}
                          ref={(el) => {
                            wordRefs.current[wordIndex] = el;
                          }}
                          className="inline-flex"
                        >
                          <Word
                            word={word}
                            wordIndex={wordIndex}
                            isActive={isActive}
                            isPast={isPast}
                            typed={typedInput.split(" ")[wordIndex]}
                            caretType="smooth"
                            isFocused={focused}
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <input ref={inputRef} type="text" value={typedInput} onChange={onChange}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </div>
          )}

          {phase === "finished" && (
            <div className="flex flex-col items-center py-5 px-4 animate-fadeIn">
              <Trophy className="w-10 h-10 text-primary mb-1" />
              <h2 className="text-lg font-bold font-serif mb-1">Race Complete</h2>
              <p className="text-xs text-muted mb-4">
                {sortedResults[0]?.id === "me" ? "You won!" : "AI wins this time!"}
              </p>
              <div className="w-full max-w-sm border border-border-hairline rounded-lg overflow-hidden bg-background mb-4">
                <div className="grid grid-cols-12 bg-card border-b border-border-hairline px-3 py-1.5 text-[9px] font-bold text-muted-soft">
                  <span className="col-span-4 text-center">#</span>
                  <span className="col-span-4">Player</span>
                  <span className="col-span-4 text-center">WPM</span>
                </div>
                {sortedResults.map((p: any, idx: number) => (
                  <div key={p.id} className={`grid grid-cols-12 px-3 py-2 text-xs items-center ${p.id === "me" ? "bg-primary/5 font-bold" : ""}`}>
                    <span className="col-span-4 text-center font-mono text-primary font-bold">#{idx + 1}</span>
                    <span className="col-span-4 flex items-center gap-1 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "completed" ? "bg-success" : "bg-error"} shrink-0`} />
                      {p.name}
                    </span>
                    <span className="col-span-4 text-center font-mono">{Math.round(p.wpm)}</span>
                  </div>
                ))}
              </div>
              <button onClick={rematch} className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary-hover cursor-pointer flex items-center gap-1.5 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Race Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes countdown-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .race-countdown-number { animation: countdown-pulse 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

