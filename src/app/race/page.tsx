"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Cpu, ArrowRight, Loader2, Timer, FileText, ShieldAlert, Award, AlignLeft, Settings } from "lucide-react";

const DURATIONS = [
  { id: "15", label: "15s" },
  { id: "30", label: "30s" },
  { id: "60", label: "60s" },
  { id: "120", label: "120s" },
  { id: "unlimited", label: "Unlimited" },
];

const WORD_COUNTS = [
  { id: "10", label: "10" },
  { id: "25", label: "25" },
  { id: "50", label: "50" },
  { id: "100", label: "100" },
  { id: "custom", label: "Custom" },
];

const TEXT_TYPES = [
  { id: "random", label: "Random", desc: "Mixed standard typing words" },
  { id: "common", label: "Common", desc: "Top 100 most frequent words" },
  { id: "quotes", label: "Quotes", desc: "Famous inspiring sentences" },
  { id: "code", label: "Code", desc: "Programming language code snippets" },
  { id: "numbers", label: "Numbers", desc: "Random number sequence blocks" },
  { id: "custom", label: "Custom Text", desc: "Type or paste your own text" },
];

const STRICTNESS_LEVELS = [
  { id: "relaxed", label: "Relaxed", desc: "Mistakes do not block spacebar" },
  { id: "strict", label: "Strict", desc: "Must correct typos to proceed" },
];

const AI_DIFFICULTIES = [
  { id: "easy", label: "Easy", wpm: "35–45 WPM", desc: "Relaxed pace" },
  { id: "medium", label: "Medium", wpm: "55–70 WPM", desc: "Balanced challenge" },
  { id: "hard", label: "Hard", wpm: "80–100 WPM", desc: "Fast and demanding" },
  { id: "adaptive", label: "Adaptive", wpm: "Dynamic", desc: "AI adapts to your WPM" },
];

const GOALS = [
  { id: "finish", label: "First Finish", desc: "Classic race to the end" },
  { id: "accuracy", label: "Highest Accuracy", desc: "Fewest mistakes wins" },
  { id: "balanced", label: "Balanced Score", desc: "Score = WPM * Accuracy" },
];

export default function RaceLobby() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Custom filters state
  const [duration, setDuration] = useState("unlimited");
  const [wordCount, setWordCount] = useState("25");
  const [customWordCount, setCustomWordCount] = useState(30);
  const [textType, setTextType] = useState("random");
  const [customText, setCustomText] = useState("");
  const [strictness, setStrictness] = useState("relaxed");
  const [difficulty, setDifficulty] = useState("medium");
  const [goal, setGoal] = useState("finish");

  useEffect(() => {
    const saved = localStorage.getItem("justtype_racer_name");
    if (saved) setName(saved);
    else setName(`Racer_${Math.floor(Math.random() * 900) + 100}`);
  }, []);

  const saveName = (v: string) => {
    setName(v);
    localStorage.setItem("justtype_racer_name", v);
  };

  const getParams = () => {
    const finalWordsCount = wordCount === "custom" ? customWordCount : wordCount;
    return new URLSearchParams({
      name: name,
      duration,
      wordCount: String(finalWordsCount),
      textType,
      strictness,
      goal,
      customText: textType === "custom" ? customText.trim().replace(/\s+/g, " ") : "",
    });
  };

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const params = getParams();
    params.set("host", "true");
    params.set("aiDiff", difficulty); // fallback for bot players
    router.push(`/race/friend/${id}?${params.toString()}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    router.push(`/race/friend/${code}?name=${encodeURIComponent(name)}`);
  };

  const startAI = () => {
    const params = getParams();
    params.set("diff", difficulty);
    router.push(`/race/ai?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0d0711] text-foreground flex flex-col items-center py-8 px-4 select-none">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-1">Race Mode Lobby</h1>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Configure your custom settings, invite friends to join your room, or challenge the AI racer.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border-hairline rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-soft block mb-1">
              Racer Name
            </label>
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => saveName(e.target.value)}
              className="w-full max-w-xs bg-background border border-border-hairline rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="bg-[#150e1d]/50 border border-border-hairline/50 rounded-lg p-2.5 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary animate-spin-slow" />
            <span className="text-[10px] text-muted-soft leading-tight">Host settings are applied to all room participants.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuration deck */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Filters Deck Container */}
            <div className="bg-card border border-border-hairline rounded-xl p-5 flex flex-col gap-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border-hairline pb-2 mb-1">
                <Settings className="w-4 h-4" /> Customize Race Settings
              </h2>

              {/* 1. Duration */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-soft flex items-center gap-1 mb-2">
                  <Timer className="w-3.5 h-3.5 text-primary" /> 1. Duration
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        duration === d.id
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-background border-border-hairline hover:border-muted text-muted"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Word Count */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-soft flex items-center gap-1 mb-2">
                  <FileText className="w-3.5 h-3.5 text-primary" /> 2. Word Count
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1.5">
                    {WORD_COUNTS.map((wc) => (
                      <button
                        key={wc.id}
                        onClick={() => setWordCount(wc.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          wordCount === wc.id
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-background border-border-hairline hover:border-muted text-muted"
                        }`}
                      >
                        {wc.label}
                      </button>
                    ))}
                  </div>

                  {wordCount === "custom" && (
                    <input
                      type="number"
                      min={5}
                      max={150}
                      value={customWordCount}
                      onChange={(e) => setCustomWordCount(Math.max(5, Math.min(150, parseInt(e.target.value) || 25)))}
                      className="w-20 bg-background border border-border-hairline rounded-lg px-2 py-1.5 text-xs text-center font-bold text-primary outline-none focus:border-primary"
                    />
                  )}
                </div>
              </div>

              {/* 3. Text Type */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-soft flex items-center gap-1 mb-2">
                  <AlignLeft className="w-3.5 h-3.5 text-primary" /> 3. Text Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEXT_TYPES.map((tt) => (
                    <button
                      key={tt.id}
                      onClick={() => setTextType(tt.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-[64px] ${
                        textType === tt.id
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border-hairline hover:border-muted"
                      }`}
                    >
                      <div className={`text-xs font-bold ${textType === tt.id ? "text-primary" : "text-foreground"}`}>{tt.label}</div>
                      <div className="text-[9px] text-muted-soft line-clamp-1 leading-none">{tt.desc}</div>
                    </button>
                  ))}
                </div>

                {textType === "custom" && (
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter or paste custom text for the race..."
                    className="w-full mt-3 bg-background border border-border-hairline rounded-lg p-2.5 text-xs font-medium outline-none focus:border-primary resize-y min-h-[75px]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 4. Strictness */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-soft flex items-center gap-1 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-primary" /> 4. Strictness
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {STRICTNESS_LEVELS.map((sl) => (
                      <button
                        key={sl.id}
                        onClick={() => setStrictness(sl.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col ${
                          strictness === sl.id
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border-hairline hover:border-muted"
                        }`}
                      >
                        <div className={`text-xs font-bold ${strictness === sl.id ? "text-primary" : "text-foreground"}`}>{sl.label}</div>
                        <div className="text-[9px] text-muted-soft mt-0.5 leading-none">{sl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Race Goal */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-soft flex items-center gap-1 mb-2">
                    <Award className="w-3.5 h-3.5 text-primary" /> 5. Race Goal
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col ${
                          goal === g.id
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border-hairline hover:border-muted"
                        }`}
                      >
                        <div className={`text-xs font-bold ${goal === g.id ? "text-primary" : "text-foreground"}`}>{g.label}</div>
                        <div className="text-[9px] text-muted-soft mt-0.5 leading-none">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action panels */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Friend Race Action */}
            <div className="bg-card border border-border-hairline rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Friend Race</h2>
              </div>
              <p className="text-[11px] text-muted mb-4 leading-relaxed">
                Create a customized room and share the room code. Minimum 2 players required.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={createRoom}
                  disabled={textType === "custom" && !customText.trim()}
                  className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary-hover disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/10"
                >
                  <Users className="w-4 h-4" /> Create Room
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 border-t border-border-hairline/40" />
                  <span className="text-[9px] text-muted-soft uppercase font-bold">or join room</span>
                  <div className="flex-1 border-t border-border-hairline/40" />
                </div>

                <form onSubmit={joinRoom} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-background border border-border-hairline rounded-lg px-3 py-2 text-xs font-mono font-bold tracking-widest uppercase text-center outline-none focus:border-primary transition-all"
                    placeholder="CODE"
                  />
                  <button
                    type="submit"
                    disabled={joining || !roomCode.trim()}
                    className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ArrowRight className="w-3.5 h-3.5" /> Join</>}
                  </button>
                </form>
              </div>
            </div>

            {/* AI Race Action */}
            <div className="bg-card border border-border-hairline rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider">AI Race</h2>
              </div>
              <p className="text-[11px] text-muted mb-4 leading-relaxed">
                Start an offline training session against an AI opponent.
              </p>

              {/* AI Difficulty Selector */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-soft">
                  AI Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        difficulty === d.id
                          ? "bg-primary/20 border-primary"
                          : "bg-background border-border-hairline hover:border-muted"
                      }`}
                    >
                      <div className={`text-xs font-bold ${difficulty === d.id ? "text-primary" : "text-foreground"}`}>{d.label}</div>
                      <div className="text-[9px] text-muted-soft mt-0.5 line-clamp-1 leading-none">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startAI}
                disabled={textType === "custom" && !customText.trim()}
                className="w-full py-3 bg-[#150e1d] border border-primary/40 text-primary font-bold text-xs rounded-lg hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" /> Start AI Race
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
