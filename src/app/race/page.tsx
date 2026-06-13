"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Cpu, ArrowRight, Loader2 } from "lucide-react";

const DIFFICULTIES = [
  { id: "easy", label: "Easy", wpm: "35–45 WPM", desc: "Relaxed pace, good for warmup" },
  { id: "medium", label: "Medium", wpm: "55–70 WPM", desc: "Balanced challenge" },
  { id: "hard", label: "Hard", wpm: "80–100 WPM", desc: "Fast and demanding" },
];

export default function RaceLobby() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("justtype_racer_name");
    if (saved) setName(saved);
    else setName(`Racer_${Math.floor(Math.random() * 900) + 100}`);
  }, []);

  const saveName = (v: string) => {
    setName(v);
    localStorage.setItem("justtype_racer_name", v);
  };

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    router.push(`/race/friend/${id}?host=true&name=${encodeURIComponent(name)}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    router.push(`/race/friend/${code}?name=${encodeURIComponent(name)}`);
  };

  const startAI = () => {
    router.push(`/race/ai?name=${encodeURIComponent(name)}&diff=${difficulty}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground flex flex-col items-center py-8 px-4 select-none">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-2">Race Mode</h1>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            Type against friends or race the AI. First to finish the text wins.
          </p>
        </div>

        <div className="bg-card border border-border-hairline rounded-xl p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-soft block mb-1">
            Your Name
          </label>
          <input
            type="text"
            maxLength={16}
            value={name}
            onChange={(e) => saveName(e.target.value)}
            className="w-full bg-background border border-border-hairline rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="bg-card border border-border-hairline rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Friend Race</h2>
          </div>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Create a room and share the code. Minimum 2 players required.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={createRoom}
              className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Create Room
            </button>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-border-hairline" />
              <span className="text-[10px] text-muted-soft uppercase font-bold">or join</span>
              <div className="flex-1 border-t border-border-hairline" />
            </div>

            <form onSubmit={joinRoom} className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="flex-1 bg-background border border-border-hairline rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-widest uppercase text-center outline-none focus:border-primary transition-colors"
                placeholder="CODE"
              />
              <button
                type="submit"
                disabled={joining || !roomCode.trim()}
                className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
              >
                {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowRight className="w-3 h-3" /> Join</>}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-card border border-border-hairline rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">AI Race</h2>
          </div>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Race against an AI opponent. Configure the difficulty below.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  difficulty === d.id
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border-hairline hover:border-muted"
                }`}
              >
                <div className="text-xs font-bold">{d.label}</div>
                <div className="text-[9px] text-primary font-mono mt-0.5">{d.wpm}</div>
              </button>
            ))}
          </div>

          <button
            onClick={startAI}
            className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4" /> Start AI Race
          </button>
        </div>
      </div>
    </div>
  );
}
