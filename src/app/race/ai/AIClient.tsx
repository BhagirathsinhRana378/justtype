"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRaceEngine } from "@/hooks/useRaceEngine";
import RaceCanvas from "@/components/race/RaceCanvas";
import Word from "@/components/Word";
import { ArrowLeft, Trophy, RotateCcw, Timer, Activity, Cpu, Users, Target, CheckCircle2, AlertTriangle } from "lucide-react";

const AI_WORDS = [
  "the","and","of","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","at","be",
  "this","have","from","one","had","by","word","but","not","what","all","were","we","when","your","can","said","use",
  "an","each","she","do","how","if","will","up","out","many","then","them","so","some","her","make","like","him","into",
  "time","has","look","two","more","go","see","no","way","my","than","call","who","oil","its","now","find","long",
  "down","day","did","get","come","made","may","part","new","take","get","place","made","live","back","give","most","very",
  "about","above","across","action","answer","around","better","faster","typing","science","measure","rhythm","cadence",
  "engine","growth","sprint","memory","mistake","routine","program","develop","complex","elegant","minimal","builder",
  "layout","control","command","trigger","resolve","warning","optimal","systems","digital","product","network","service",
  "dynamic","balance","perfect","profile","numbers","context","history","support","process",
  "people","number","water","sound","years","thing","think","great","every","under","found","still","between","never",
  "start","another","course","family","always","country","system","school","group","during","without","before","study",
  "almost","change","design","manage","project","simple","active","future","nature","modern","focus","custom","device",
  "visual","source","output","create","import","render","client","server","button","screen","canvas","header","footer",
  "border","shadow","margin","padding","height","width","window","object","string","cursor"
];

const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

const QUOTES = [
  "To be or not to be, that is the question.",
  "All that glitters is not gold.",
  "A journey of a thousand miles begins with a single step.",
  "In the middle of difficulty lies opportunity.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
  "The only way to do great work is to love what you do.",
  "Strive not to be a success, but rather to be of value.",
  "Do not go where the path may lead, go instead where there is no path and leave a trail.",
  "Life is what happens when you're busy making other plans.",
  "The future belongs to those who believe in the beauty of their dreams."
];

const CODE_SNIPPETS = [
  "const [state, setState] = useState(initial);",
  "function add(a, b) { return a + b; }",
  "import React, { useEffect } from 'react';",
  "const result = items.filter(x => x.active);",
  "export default function App() { return <div />; }",
  "const elapsed = (Date.now() - startTime) / 1000;",
  "const wpm = Math.round((correctChars / 5) / elapsed);",
  "try { await fetchData(); } catch (err) { console.error(err); }",
  "if (user.isAdmin) { showDashboard(); } else { redirect(); }",
  "const promise = new Promise((resolve) => setTimeout(resolve, 100));"
];

function genNumbersText(len: number) {
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push(Math.floor(Math.random() * 9000 + 1000).toString());
  }
  return out.join(" ");
}

function getAIText(textType: string, wordCount: number, customText?: string) {
  if (textType === "custom" && customText) {
    return customText.trim().replace(/\s+/g, " ");
  }
  if (textType === "quotes") {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
  if (textType === "code") {
    return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  }
  if (textType === "numbers") {
    return genNumbersText(wordCount);
  }
  
  const wordList = textType === "common" ? COMMON_WORDS : AI_WORDS;
  const out = [];
  for (let i = 0; i < wordCount; i++) {
    out.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return out.join(" ");
}

const DIFFICULTY_CONFIG = {
  easy: { targetWpm: 40, variance: 0.15 },
  medium: { targetWpm: 60, variance: 0.15 },
  hard: { targetWpm: 90, variance: 0.15 },
  adaptive: { targetWpm: 60, variance: 0.15 },
};

export default function AIClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const playerName = searchParams.get("name") || "AI Racer";
  const diffKey = (searchParams.get("diff") || "medium") as keyof typeof DIFFICULTY_CONFIG;
  const diff = DIFFICULTY_CONFIG[diffKey] || DIFFICULTY_CONFIG.medium;
  const durationParam = searchParams.get("duration") || "unlimited";
  const durationSec = durationParam !== "unlimited" ? parseInt(durationParam) : null;
  const strictnessParam = searchParams.get("strictness") || "relaxed";
  const goalParam = searchParams.get("goal") || "finish";

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
  const [revertTrigger, setRevertTrigger] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiProgressRef = useRef(0);
  const aiFinishedRef = useRef(false);
  const startTimeRef = useRef(0);
  const finishTimeRef = useRef(0);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    typedInput, wpm, accuracy, progress, handleInput, reset: resetEngine, feedback, totalKeystrokes, isComplete, completedWordsHistory,
  } = useRaceEngine(words, { strict: strictnessParam === "strict" });

  const typedWords = useMemo(() => typedInput.split(" "), [typedInput]);
  const activeWordIndex = useMemo(() => Math.max(0, typedWords.length - 1), [typedWords]);

  // Keep a ref of player WPM to feed to the Adaptive AI without recreating the interval
  const playerWpmRef = useRef(wpm);
  useEffect(() => {
    playerWpmRef.current = wpm;
  }, [wpm]);

  const startRace = () => {
    const textTypeParam = searchParams.get("textType") || "random";
    const wordCountParam = parseInt(searchParams.get("wordCount") || "25") || 25;
    const customTextParam = searchParams.get("customText") || "";
    
    const t = getAIText(textTypeParam, wordCountParam, customTextParam);
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

    if (inputRef.current) {
      inputRef.current.value = "";
    }

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
      let targetWpm = diff.targetWpm;
      if (diffKey === "adaptive") {
        targetWpm = Math.max(30, playerWpmRef.current + (Math.random() > 0.55 ? 3 : -1));
      }
      
      const baseCharsPerMin = targetWpm * 5;
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
  }, [phase, text, diff, diffKey]);

  // Timer & Duration limit
  useEffect(() => {
    if (phase !== "racing") { setRaceElapsed(0); return; }
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setRaceElapsed(elapsed);
      if (durationSec && elapsed >= durationSec) {
        clearInterval(iv);
        finishTimeRef.current = Date.now();
        setPhase("finished");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, durationSec]);

  // Detect finish
  useEffect(() => {
    if (phase !== "racing") return;
    if (isComplete && !finishTimeRef.current) {
      finishTimeRef.current = Date.now();
      setPhase("finished");
    }
    if (aiFinishedRef.current && finishTimeRef.current) {
      setPhase("finished");
    }
  }, [isComplete, phase]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (feedback === "error" || feedback === "blocked") {
      el.classList.remove("animate-shake", "animate-red-flash", "animate-green-pulse");
      void el.offsetWidth; // force reflow
      el.classList.add("animate-shake", "animate-red-flash");
    } else if (feedback === "correct") {
      el.classList.remove("animate-shake", "animate-red-flash", "animate-green-pulse");
      void el.offsetWidth; // force reflow
      el.classList.add("animate-green-pulse");
    }
  }, [feedback, totalKeystrokes]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "racing") return;
    let val = e.target.value;

    // Sanitize mobile keyboard auto-capitalization on completed history prefix
    const expectedPrefix = completedWordsHistory && completedWordsHistory.length > 0 
      ? completedWordsHistory.join(" ") + " " 
      : "";
    if (expectedPrefix && val.length >= expectedPrefix.length) {
      const valPrefix = val.substring(0, expectedPrefix.length);
      if (valPrefix.toLowerCase() === expectedPrefix.toLowerCase() && valPrefix !== expectedPrefix) {
        val = expectedPrefix + val.substring(expectedPrefix.length);
        e.target.value = val;
      }
    }

    const metrics = handleInput(val, e.nativeEvent);

    if (metrics.isError) {
      e.target.value = typedInput;
      setRevertTrigger(prev => prev + 1);
      return;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase !== "racing") return;

    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const players = useMemo(() => {
    const myDone = phase === "finished" && finishTimeRef.current > 0;
    return [
      { id: "me", name: playerName, progress, wpm, accuracy, status: (myDone ? "completed" : "racing") as "racing" | "completed", finishTime: myDone ? finishTimeRef.current : 0 },
      { id: "ai", name: "AI", progress: aiProgress, wpm: aiWpm, accuracy: aiAccuracy, status: aiStatus, finishTime: aiFinishedRef.current && finishTimeRef.current ? finishTimeRef.current + 2000 : 0 },
    ];
  }, [playerName, progress, wpm, accuracy, phase, aiProgress, aiWpm, aiAccuracy, aiStatus]);

  const sortedResults = useMemo(() => {
    const completed = [...players].filter((p: any) => p.status === "completed");
    const others = [...players].filter((p: any) => p.status !== "completed");
    
    if (goalParam === "accuracy") {
      completed.sort((a: any, b: any) => b.accuracy - a.accuracy || b.wpm - a.wpm);
    } else if (goalParam === "balanced") {
      const score = (p: any) => p.wpm * (p.accuracy / 100);
      completed.sort((a: any, b: any) => score(b) - score(a));
    } else {
      completed.sort((a: any, b: any) => (a.finishTime || Infinity) - (b.finishTime || Infinity));
    }
    
    return [...completed, ...others];
  }, [players, goalParam]);

  const position = useMemo(() => {
    const me = players[0];
    if (!me) return 0;
    const ahead = players.filter(p => p.id !== "me" && (p.status === "completed" || p.progress > me.progress)).length;
    return ahead + 1;
  }, [players]);

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    wordRefs.current = [];
    setTranslateY(0);
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

  const renderedWords = useMemo(() => {
    return words.map((word, wordIndex) => {
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
            typed={typedWords[wordIndex]}
            caretType="smooth"
            isFocused={focused}
          />
        </span>
      );
    });
  }, [words, activeWordIndex, typedWords, focused]);

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
                <Cpu className="w-3 h-3" /> {diffKey} · {diffKey === "adaptive" ? "Adaptive WPM" : `${diff.targetWpm} WPM`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === "racing" && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/50 border border-border-hairline">
                <Timer className="w-3 h-3 text-primary animate-pulse" />
                <span className="font-mono text-xs font-bold">
                  {durationSec 
                    ? `${Math.max(0, durationSec - raceElapsed)}s left` 
                    : `${Math.floor(raceElapsed / 60)}:${(raceElapsed % 60).toString().padStart(2, "0")}`}
                </span>
              </div>
            )}
            <span className="text-[8px] text-muted-soft font-mono flex items-center gap-1">
              <Activity className="w-2 h-2 text-success" /> Offline
            </span>
          </div>
        </div>

        <div className="bg-card border border-border-hairline rounded-xl overflow-hidden shadow-lg flex-1 min-h-[190px] relative backdrop-blur-md">
          {phase === "racing" || phase === "finished" ? (
            <RaceCanvas players={players} myPlayerId="me" isRacing={phase === "racing"} />
          ) : (
            <div className="w-full h-full min-h-[190px] flex items-center justify-center bg-card/30">
              <div className="text-center px-4">
                <Users className="w-10 h-10 text-primary/40 mx-auto mb-2" />
                <p className="text-[11px] text-muted-soft">Race track will appear here</p>
              </div>
            </div>
          )}
        </div>

        <div ref={containerRef} className={`bg-card border rounded-xl relative backdrop-blur-md transition-all duration-300 ${focused ? "border-primary/40 shadow-[0_0_20px_rgba(204,120,92,0.08)] bg-card/75" : "border-border-hairline"}`}>
          {phase === "countdown" && (
            <div className="flex flex-col items-center justify-center py-8 animate-pulse">
              <span className="text-[10px] text-muted-soft uppercase font-bold tracking-wider mb-1">Race starting</span>
              <div className="text-6xl font-serif font-black text-primary font-mono tracking-tighter race-countdown-number">{countdown}</div>
            </div>
          )}

          {phase === "racing" && (
            <div className="flex flex-col">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[#0d0711]/60 border-b border-border-hairline/30">
                {[
                  { label: "Position", value: `#${position}`, icon: <Trophy className="w-3.5 h-3.5 text-accent-amber" />, c: "text-accent-amber font-extrabold" },
                  { label: "Speed", value: `${wpm} WPM`, icon: <Activity className="w-3.5 h-3.5 text-primary" />, c: "text-primary font-bold" },
                  { label: "Accuracy", value: `${accuracy}%`, icon: <Target className="w-3.5 h-3.5 text-success" />, c: "text-success font-bold" },
                  { label: "Progress", value: `${Math.round(progress * 100)}%`, icon: <CheckCircle2 className="w-3.5 h-3.5 text-muted-soft" />, c: "text-foreground font-bold" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center justify-center py-1.5 px-1 bg-card/25 border border-border-hairline/25 rounded-lg backdrop-blur-xs">
                    <div className="flex items-center gap-1 mb-1">
                      {s.icon}
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-muted-soft">{s.label}</span>
                    </div>
                    <div className={`text-xs xs:text-sm sm:text-base font-black font-mono tracking-tight leading-none ${s.c}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div 
                onClick={() => inputRef.current?.focus()} 
                className="relative cursor-text select-none overflow-hidden py-6 px-6" 
                style={{ 
                  height: "calc(3.5 * var(--typing-font-size) * var(--typing-line-height) + 2rem)",
                  minHeight: "240px"
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
                    {renderedWords}
                  </div>
                </div>
              </div>
              
              {feedback === "blocked" && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-error/95 text-on-error px-4 py-1.5 rounded-lg border border-error-border shadow-lg flex items-center gap-1.5 text-[10px] font-bold font-mono tracking-wide z-30 animate-bounce">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-amber animate-pulse" />
                  <span>Finish this word to continue</span>
                </div>
              )}

              <input ref={inputRef} type="text" defaultValue="" onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                onPaste={(e) => e.preventDefault()}
                data-revert={revertTrigger}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
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
                  <span className="col-span-2 text-center">#</span>
                  <span className="col-span-4">Player</span>
                  <span className="col-span-3 text-center">
                    {goalParam === "accuracy" ? "Accuracy" : goalParam === "balanced" ? "Score" : "WPM"}
                  </span>
                  <span className="col-span-3 text-center">
                    {goalParam === "finish" ? "Time" : "WPM"}
                  </span>
                </div>
                {sortedResults.map((p: any, idx: number) => {
                  const scoreVal = Math.round(p.wpm * (p.accuracy / 100));
                  return (
                    <div key={p.id} className={`grid grid-cols-12 px-3 py-2 text-xs items-center ${p.id === "me" ? "bg-primary/5 font-bold" : ""}`}>
                      <span className="col-span-2 text-center font-mono text-primary font-bold">#{idx + 1}</span>
                      <span className="col-span-4 flex items-center gap-1 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === "completed" ? "bg-success" : "bg-error"} shrink-0`} />
                        {p.name}
                      </span>
                      <span className="col-span-3 text-center font-mono">
                        {goalParam === "accuracy" ? `${Math.round(p.accuracy)}%` : goalParam === "balanced" ? scoreVal : Math.round(p.wpm)}
                      </span>
                      <span className="col-span-3 text-center font-mono">
                        {goalParam === "finish" 
                          ? (p.finishTime ? `${(p.finishTime / 1000).toFixed(1)}s` : "-")
                          : Math.round(p.wpm)
                        }
                      </span>
                    </div>
                  );
                })}
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.25s ease-in-out;
        }

        @keyframes red-flash {
          0% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
          50% { border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); }
          100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-red-flash {
          animation: red-flash 0.4s ease-in-out;
        }

        @keyframes green-pulse {
          0% { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
          50% { border-color: rgba(16, 185, 129, 0.8); box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
          100% { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-green-pulse {
          animation: green-pulse 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
