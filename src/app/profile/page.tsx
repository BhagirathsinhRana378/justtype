"use client";

import { useEffect, useState, useMemo } from "react";
import { User, Trophy, Award, Shield, Keyboard, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getSavedSessions, TypingSession, calculateFocusScore } from "@/utils/aiEngine";
import Link from "next/link";

interface Achievement {
  id: string;
  name: string;
  desc: string;
  criteria: string;
  unlocked: boolean;
}

export default function ProfilePage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSessions(getSavedSessions());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Compute profile metrics
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalRuns = sessions.length;
    const peakWpm = Math.max(...sessions.map((s) => s.wpm));
    const avgWpm = Math.round(sessions.reduce((a, b) => a + b.wpm, 0) / totalRuns);
    const avgAcc = Math.round(sessions.reduce((a, b) => a + b.accuracy, 0) / totalRuns);

    // Calculate total keys typed from telemetry
    let totalKeys = 0;
    sessions.forEach((s) => {
      totalKeys += s.telemetry.length;
    });

    // XP calculation: 1 key typed = 2 XP.
    const xp = totalKeys * 2;
    // Level formula: Level = floor(sqrt(xp / 100)) + 1
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    // XP to next level
    const nextLevelXp = Math.pow(level, 2) * 100;
    const prevLevelXp = Math.pow(level - 1, 2) * 100;
    const progressPercent = Math.min(
      100,
      Math.round(((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)
    );

    // Layout distribution mapping
    const layouts: Record<string, number> = {};
    sessions.forEach((s) => {
      const lay = s.layout || "qwerty";
      layouts[lay] = (layouts[lay] || 0) + 1;
    });

    return {
      totalRuns,
      peakWpm,
      avgWpm,
      avgAcc,
      totalKeys,
      xp,
      level,
      progressPercent,
      layouts,
    };
  }, [sessions]);

  // Check achievements dynamically based on actual logs
  const achievements = useMemo(() => {
    const list: Achievement[] = [
      {
        id: "speed_demon",
        name: "Speed Demon",
        desc: "Break WPM threshold",
        criteria: "Type above 100 WPM on any session",
        unlocked: sessions.some((s) => s.wpm >= 100),
      },
      {
        id: "laser_precision",
        name: "Laser Precision",
        desc: "Total absolute accuracy",
        criteria: "Type with 100% accuracy on any session",
        unlocked: sessions.some((s) => s.accuracy === 100),
      },
      {
        id: "steady_hand",
        name: "Steady Hand",
        desc: "Perfect flow consistency",
        criteria: "Achieve a Focus Score above 95%",
        unlocked: sessions.some((s) => calculateFocusScore(s) >= 95),
      },
      {
        id: "routine",
        name: "Consolidated Routine",
        desc: "Typing discipline",
        criteria: "Complete 10 typing workbench tests",
        unlocked: sessions.length >= 10,
      },
      {
        id: "custom_warrior",
        name: "Custom Warrior",
        desc: "Remediation student",
        criteria: "Complete 5 tests in AI Coach custom mode",
        unlocked: sessions.filter((s) => s.mode === "zen" || s.mode === "custom").length >= 5,
      },
      {
        id: "night_owl",
        name: "Night Owl",
        desc: "Under moonlight",
        criteria: "Complete a test between midnight and 4:00 AM",
        unlocked: sessions.some((s) => {
          const hours = new Date(s.timestamp).getHours();
          return hours >= 0 && hours < 4;
        }),
      },
    ];

    return list;
  }, [sessions]);

  // Filter history runs
  const filteredSessions = useMemo(() => {
    let runs = [...sessions].reverse();
    if (search.trim()) {
      const q = search.toLowerCase();
      runs = runs.filter(
        (s) =>
          s.mode.toLowerCase().includes(q) ||
          (s.layout || "qwerty").toLowerCase().includes(q)
      );
    }
    return runs;
  }, [sessions, search]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, page]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-hairline pb-6">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-serif text-foreground">Tactile Profile</h1>
            <p className="text-sm text-muted">Review leveling milestones, badges achieved, and detailed logs of your typing workbench history.</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          /* Empty state */
          <div className="w-full bg-card border border-border-hairline rounded-lg p-16 text-center flex flex-col items-center gap-6 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-foreground">No Profile History</h2>
            <p className="text-muted text-sm max-w-sm">
              Your level status and accomplishments logs compile as you run test sessions. Try launching a test session first!
            </p>
            <Link
              href="/type"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all-smooth"
            >
              Start Typing
            </Link>
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column (User card, leveling, stats summary) */}
              <div className="flex flex-col gap-8">
                
                {/* Level progression Card */}
                <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-serif text-2xl font-bold text-primary">
                      {stats.level}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-serif font-bold text-foreground">Keyboard Apprentice</span>
                      <span className="text-xs text-muted">Level {stats.level} · {stats.xp} Total XP</span>
                    </div>
                  </div>

                  {/* Level progress bar */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex justify-between text-[10px] font-mono text-muted-soft">
                      <span>XP Progression</span>
                      <span>{stats.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-background border border-border-hairline rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${stats.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lifetime Metrics Summary */}
                <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                  <h3 className="text-sm font-serif text-foreground font-semibold">Tactile Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-background border border-border-hairline p-3 rounded">
                      <span className="text-[10px] font-mono text-muted uppercase block">Tests Run</span>
                      <span className="text-xl font-mono font-bold text-foreground">{stats.totalRuns}</span>
                    </div>
                    <div className="bg-background border border-border-hairline p-3 rounded">
                      <span className="text-[10px] font-mono text-muted uppercase block">Peak WPM</span>
                      <span className="text-xl font-mono font-bold text-primary">{stats.peakWpm}</span>
                    </div>
                    <div className="bg-background border border-border-hairline p-3 rounded">
                      <span className="text-[10px] font-mono text-muted uppercase block">Average WPM</span>
                      <span className="text-xl font-mono font-bold text-foreground">{stats.avgWpm}</span>
                    </div>
                    <div className="bg-background border border-border-hairline p-3 rounded">
                      <span className="text-[10px] font-mono text-muted uppercase block">Accuracy</span>
                      <span className="text-xl font-mono font-bold text-success">{stats.avgAcc}%</span>
                    </div>
                  </div>

                  {/* Layout choices */}
                  <div className="border-t border-border-hairline pt-4 flex flex-col gap-2">
                    <p className="text-[10px] font-mono uppercase text-muted-soft tracking-wider">Layout choice runs</p>
                    <div className="flex flex-col gap-1.5 text-xs text-muted">
                      {Object.entries(stats.layouts).map(([layout, count]) => (
                        <div key={layout} className="flex justify-between font-mono">
                          <span className="capitalize">{layout}</span>
                          <span className="text-foreground">{count} runs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Middle/Right Columns (Achievements & Logs) */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {/* Badges Grid */}
                <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                  <h3 className="text-sm font-serif text-foreground font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Unlocked Accomplishments</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`border rounded p-3 flex items-start gap-3 transition-all ${
                          a.unlocked
                            ? "border-primary/45 bg-primary/[0.03] shadow-xs"
                            : "border-border-hairline bg-card opacity-50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded mt-0.5 ${
                            a.unlocked ? "bg-primary/10 text-primary" : "bg-background text-muted-soft"
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-serif font-bold ${a.unlocked ? "text-foreground" : "text-muted"}`}>
                            {a.name}
                          </span>
                          <span className="text-[10px] text-muted leading-tight mt-0.5">{a.desc}</span>
                          <span className="text-[9px] text-muted-soft font-mono mt-1">{a.criteria}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Searchable Chronological Logs Table */}
                <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-hairline pb-4">
                    <h3 className="text-sm font-serif text-foreground font-semibold flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-primary" />
                      <span>History Session Logs</span>
                    </h3>
                    
                    {/* Search field */}
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1); // Reset page to 1 on search
                        }}
                        placeholder="Search by mode or layout..."
                        className="w-full bg-background border border-border-hairline rounded pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {filteredSessions.length === 0 ? (
                    <p className="text-xs text-muted text-center py-6 font-mono">No matching runs found.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className="text-muted-soft border-b border-border-hairline pb-2 uppercase tracking-wider">
                              <th className="py-2 font-normal">Date</th>
                              <th className="py-2 font-normal text-right">Speed</th>
                              <th className="py-2 font-normal text-right">Accuracy</th>
                              <th className="py-2 font-normal text-right">Mode</th>
                              <th className="py-2 font-normal text-right hidden sm:table-cell">Layout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-hairline text-muted">
                            {paginatedSessions.map((s, idx) => (
                              <tr key={idx} className="hover:text-foreground transition-colors">
                                <td className="py-2">
                                  {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2 text-right font-bold text-primary">{s.wpm} WPM</td>
                                <td className="py-2 text-right text-success">{s.accuracy}%</td>
                                <td className="py-2 text-right capitalize">{s.mode}</td>
                                <td className="py-2 text-right capitalize hidden sm:table-cell">{s.layout || "qwerty"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border-hairline pt-4 font-mono text-xs">
                          <span className="text-muted-soft">Page {page} of {totalPages}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handlePrevPage}
                              disabled={page === 1}
                              className="p-1 border border-border-hairline hover:border-primary text-muted hover:text-foreground rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleNextPage}
                              disabled={page === totalPages}
                              className="p-1 border border-border-hairline hover:border-primary text-muted hover:text-foreground rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>

              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
}
