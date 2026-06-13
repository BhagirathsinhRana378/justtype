"use client";

import { useMemo, useState } from "react";
import { Focus, Eye, Target, Zap } from "lucide-react";

interface PlayerData {
  id: string;
  name: string;
  index: number;
  progress: number;
  wpm: number;
  accuracy: number;
  streak: number;
  nitroActive: boolean;
  inSlipstream: boolean;
  status: "waiting" | "ready" | "racing" | "completed" | "eliminated";
  shield: number;
  carType: string;
  isBoss?: boolean;
}

interface MinimalProgressViewProps {
  players: PlayerData[];
  myPlayerId: string;
}

export default function MinimalProgressView({ players, myPlayerId }: MinimalProgressViewProps) {
  const [focusMode, setFocusMode] = useState(false);

  // Sort players by progress descending for ranking
  const sortedRankings = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.status === "completed" && b.status === "completed") return 0;
      if (a.status === "completed") return -1;
      if (b.status === "completed") return 1;
      if (a.status === "eliminated") return 1;
      if (b.status === "eliminated") return -1;
      return b.progress - a.progress;
    });
  }, [players]);

  const CAR_COLORS: Record<string, string> = {
    sports: "#cc785c",
    f1: "#5db8a6",
    muscle: "#e8a55a",
    hyper: "#58a6ff",
    phantom: "#b34cff",
    boss_ship: "#ff0055"
  };

  return (
    <div className="w-full p-6 bg-background/40 flex flex-col gap-6 backdrop-blur-md relative select-none">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-border-hairline/60 pb-3">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-soft font-mono">
          Minimal Progress Hub
        </span>
        <button
          onClick={() => setFocusMode(!focusMode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold transition-all cursor-pointer ${
            focusMode
              ? "bg-primary/10 border-primary text-primary"
              : "bg-card border-border-hairline text-muted hover:text-foreground"
          }`}
        >
          <Focus className="w-3 h-3" />
          <span>{focusMode ? "Focus Active" : "Focus Mode"}</span>
        </button>
      </div>

      {/* Progress Tracks list */}
      <div className="flex flex-col gap-4">
        {players.map((p) => {
          const isMe = p.id === myPlayerId;
          const color = CAR_COLORS[p.carType] || "#cc785c";
          const progressPercent = Math.min(100, Math.max(0, p.progress * 100));

          // In focus mode, only show current player and DNF details
          if (focusMode && !isMe) return null;

          return (
            <div key={p.id} className="flex flex-col gap-1.5">
              
              {/* Stat HUD above progress line */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>
                    {p.name} {isMe && <span className="text-[9px] text-primary">(You)</span>}
                  </span>
                  {p.status === "completed" && (
                    <span className="text-[8px] bg-success/15 text-success px-1 rounded-sm uppercase font-bold">
                      Done
                    </span>
                  )}
                  {p.status === "eliminated" && (
                    <span className="text-[8px] bg-error/15 text-error px-1 rounded-sm uppercase font-bold">
                      DNF
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 font-mono text-muted-soft text-[10px]">
                  <span>{Math.round(p.wpm)} WPM</span>
                  {p.nitroActive && p.status === "racing" && (
                    <span className="text-primary font-bold flex items-center gap-0.5 animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" /> NITRO
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Line Bar track */}
              <div className="w-full h-2 bg-card border border-border-hairline rounded-full relative overflow-hidden">
                {/* Progress bar fill */}
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out opacity-80"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: color,
                    boxShadow: p.nitroActive ? `0 0 8px ${color}` : "none"
                  }}
                />
                
                {/* Live ghost cursor comparison marker */}
                {progressPercent > 0 && progressPercent < 100 && (
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-4 rounded-sm transition-all duration-300 ease-out"
                    style={{
                      left: `calc(${progressPercent}% - 3px)`,
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}`
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rankings HUD (hidden in focus mode) */}
      {!focusMode && (
        <div className="border-t border-border-hairline/60 pt-4 flex flex-col gap-2.5 animate-fadeIn">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-soft font-mono">
            Leaderboard Grid
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sortedRankings.map((p, index) => {
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border bg-background/50 ${
                    isMe ? "border-primary/40 bg-primary/5" : "border-border-hairline"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate text-xs">
                    <span className="font-mono font-bold text-primary">#{index + 1}</span>
                    <span className="font-semibold truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-soft">
                    <span>{Math.round(p.wpm)} WPM</span>
                    <span>{p.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
