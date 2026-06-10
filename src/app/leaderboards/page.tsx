"use client";

import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, Flame, Star, Play, ChevronRight, Check } from "lucide-react";
import { getSavedSessions, TypingSession } from "@/utils/aiEngine";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  name: string;
  wpm: number;
  accuracy: number;
  layout: string;
  isUser?: boolean;
}

const PRESET_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Virtuoso_Keys", wpm: 154, accuracy: 100, layout: "dvorak" },
  { rank: 2, name: "Colemak_King", wpm: 147, accuracy: 99, layout: "colemak" },
  { rank: 3, name: "Carbon_Clicker", wpm: 138, accuracy: 100, layout: "qwerty" },
  { rank: 5, name: "Garamond_Pro", wpm: 126, accuracy: 98, layout: "dvorak" },
  { rank: 6, name: "Syntax_Scorcher", wpm: 121, accuracy: 97, layout: "qwerty" },
  { rank: 7, name: "HomeRow_Hero", wpm: 115, accuracy: 99, layout: "colemak" },
  { rank: 8, name: "Tactile_Typist", wpm: 108, accuracy: 100, layout: "qwerty" },
  { rank: 9, name: "Laser_Fingers", wpm: 99, accuracy: 98, layout: "qwerty" }
];

export default function LeaderboardsPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userNickname, setUserNickname] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSessions(getSavedSessions());
    if (typeof window !== "undefined") {
      setUserNickname(localStorage.getItem("justtype_config_nickname") || "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Get user's personal best
  const personalBest = useMemo(() => {
    if (sessions.length === 0) return null;
    const peak = sessions.reduce((prev, current) => (prev.wpm > current.wpm ? prev : current));
    return peak;
  }, [sessions]);

  // Combined leaderboard
  const combinedLeaderboard = useMemo(() => {
    const list = [...PRESET_GLOBAL_LEADERBOARD];

    const currentNickname = userNickname || username || "You";

    if (personalBest) {
      const userEntry: LeaderboardEntry = {
        rank: 0, // Calculated below
        name: `${currentNickname} (PB)`,
        wpm: personalBest.wpm,
        accuracy: personalBest.accuracy,
        layout: personalBest.layout || "qwerty",
        isUser: true
      };
      list.push(userEntry);
    }

    // Sort descending by WPM, then accuracy
    list.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);

    // Apply ranks
    return list.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));
  }, [personalBest, userNickname, username]);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("justtype_config_nickname", username);
    setUserNickname(username);
    setSubmitted(true);
  };

  const startDailyChallenge = () => {
    if (typeof window !== "undefined") {
      // Set to quote mode for daily challenge emulations
      localStorage.setItem("justtype_config_mode", "quote");
    }
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-hairline pb-6">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-serif text-foreground">World Leaderboards</h1>
            <p className="text-sm text-muted">Daily challenges, local score registry, and global typing speeds benchmarks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Leaderboard Table) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Leaderboard panel */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" />
                <span>Tactile High Scores</span>
              </h2>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-muted-soft border-b border-border-hairline pb-2 uppercase tracking-wider">
                      <th className="py-2 font-normal w-12 text-center">Rank</th>
                      <th className="py-2 font-normal">Typist</th>
                      <th className="py-2 font-normal text-right">Speed</th>
                      <th className="py-2 font-normal text-right">Accuracy</th>
                      <th className="py-2 font-normal text-right">Layout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline text-muted">
                    {combinedLeaderboard.map((entry) => (
                      <tr
                        key={entry.name}
                        className={`transition-colors ${
                          entry.isUser 
                            ? "bg-primary/5 text-primary font-bold hover:bg-primary/10" 
                            : "hover:text-foreground"
                        }`}
                      >
                        <td className="py-3 text-center">
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                        </td>
                        <td className="py-3 flex items-center gap-2">
                          <span>{entry.name}</span>
                          {entry.isUser && <span className="text-[10px] font-mono uppercase bg-primary/20 px-1.5 py-0.5 rounded text-primary font-semibold">You</span>}
                        </td>
                        <td className="py-3 text-right font-bold">{entry.wpm} WPM</td>
                        <td className="py-3 text-right">{entry.accuracy}%</td>
                        <td className="py-3 text-right capitalize">{entry.layout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (Daily Challenge & Submit score) */}
          <div className="flex flex-col gap-8">
            
            {/* Daily Challenge card */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="w-5 h-5 animate-bounce" />
                <h3 className="text-sm font-serif font-bold">Daily challenge</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Type today&apos;s featured quote to score on the daily challenge leaderboard and consolidate your home row pivots.
              </p>
              
              <div className="bg-background border border-border-hairline p-3 rounded text-[11px] leading-relaxed text-muted font-mono select-none">
                💡 &quot;Design is not just what it looks like and feels like. Design is how it works.&quot;
              </div>

              <Link
                href="/type"
                onClick={startDailyChallenge}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md shadow transition-all-smooth cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Type Challenge</span>
                <Play className="w-3.5 h-3.5 fill-white" />
              </Link>
            </div>

            {/* Submit registry panel */}
            {personalBest && !userNickname && (
              <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-serif text-foreground font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span>Register Your Score</span>
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  You scored a personal best of <strong className="text-primary">{personalBest.wpm} WPM</strong>! Enter a nickname to submit it to the local leaderboard.
                </p>

                <form onSubmit={handleNicknameSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter nickname..."
                    maxLength={14}
                    className="flex-1 bg-background border border-border-hairline rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-hover cursor-pointer font-semibold flex items-center gap-1"
                  >
                    <span>Register</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {submitted && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-5 flex items-start gap-3 shadow-xs">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <div className="flex flex-col text-xs">
                  <span className="font-serif font-bold text-foreground">Score Registered Successfully</span>
                  <span className="text-muted leading-normal mt-0.5">Your record has been published. You are now placed on the scoreboard!</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
