"use client";

import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, Flame, Star, Play, ChevronRight, Check, Lock, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { TypingSession } from "@/utils/aiEngine";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardsPage() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userNickname, setUserNickname] = useState("");

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Auth Form State
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [direction, setDirection] = useState(1);

  // Leaderboard Data State
  interface LeaderboardEntry {
    rank: number;
    username: string;
    wpm: number;
    accuracy: number;
    layout: string;
    timestamp: number;
  }
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getApiUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return "http://localhost:3001";
  };

  const syncAndFetchLeaderboard = async (username: string, token: string) => {
    setIsLoading(true);
    const API_BASE = getApiUrl();
    try {
      // 1. Gather local sessions to sync
      const userSessionsRaw = localStorage.getItem(`justtype_sessions_${username}`);
      let localSessions: TypingSession[] = [];
      if (userSessionsRaw) {
        try {
          localSessions = JSON.parse(userSessionsRaw);
        } catch {
          localSessions = [];
        }
      }
      
      const globalSessionsRaw = localStorage.getItem("justtype_sessions");
      let globalSessions: TypingSession[] = [];
      if (globalSessionsRaw) {
        try {
          globalSessions = JSON.parse(globalSessionsRaw);
        } catch {
          globalSessions = [];
        }
      }

      // Merge local sessions
      const combined = [...localSessions];
      const existingIds = new Set(combined.map(s => s.id || s.timestamp.toString()));
      for (const s of globalSessions) {
        const sId = s.id || s.timestamp.toString();
        if (!existingIds.has(sId)) {
          combined.push(s);
        }
      }

      // 2. POST to /api/sync-sessions
      const syncRes = await fetch(`${API_BASE}/api/sync-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ sessions: combined })
      });

      let syncedSessions = combined;
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.success && Array.isArray(syncData.sessions)) {
          syncedSessions = syncData.sessions;
          localStorage.setItem(`justtype_sessions_${username}`, JSON.stringify(syncedSessions));
          // Clear global sessions to prevent double syncing
          localStorage.setItem("justtype_sessions", JSON.stringify([]));
        }
      }
      setSessions(syncedSessions);

      // 3. GET /api/leaderboard
      const lbRes = await fetch(`${API_BASE}/api/leaderboard`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        if (lbData.success) {
          setLeaderboardData(lbData.leaderboard);
        }
      } else if (lbRes.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to sync/fetch leaderboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Checking auth status and loading sessions
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    if (typeof window !== "undefined") {
      const loggedInUser = localStorage.getItem("justtype_logged_in_user");
      const token = localStorage.getItem("justtype_auth_token");
      if (loggedInUser && token) {
        setIsLoggedIn(true);
        setCurrentUser(loggedInUser);
        setUserNickname(loggedInUser);
        syncAndFetchLeaderboard(loggedInUser, token);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setSessions([]);
        setUserNickname("");
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get user's personal best
  const personalBest = useMemo(() => {
    if (sessions.length === 0) return null;
    const peak = sessions.reduce((prev, current) => (prev.wpm > current.wpm ? prev : current));
    return peak;
  }, [sessions]);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("justtype_config_nickname", username);
    setUserNickname(username);
    setSubmitted(true);
  };

  const startDailyChallenge = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_mode", "quote");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const trimmedUser = authUsername.trim();
    if (!trimmedUser || !authPassword) {
      setAuthError("All fields are required");
      setShakeTrigger(prev => prev + 1);
      return;
    }
    if (trimmedUser.length < 3) {
      setAuthError("Username must be at least 3 characters");
      setShakeTrigger(prev => prev + 1);
      return;
    }

    const API_BASE = getApiUrl();
    try {
      const endpoint = authTab === "signup" ? "/api/signup" : "/api/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: trimmedUser, password: authPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Authentication failed");
        setShakeTrigger(prev => prev + 1);
        return;
      }

      localStorage.setItem("justtype_logged_in_user", data.username);
      localStorage.setItem("justtype_auth_token", data.token);
      localStorage.setItem("justtype_config_nickname", data.username);

      setCurrentUser(data.username);
      setUserNickname(data.username);
      setIsLoggedIn(true);

      syncAndFetchLeaderboard(data.username, data.token);

    } catch (err) {
      console.error("Auth submit error:", err);
      setAuthError("Could not connect to authentication server");
      setShakeTrigger(prev => prev + 1);
    }
  };

  function handleLogout() {
    localStorage.removeItem("justtype_logged_in_user");
    localStorage.removeItem("justtype_auth_token");
    localStorage.removeItem("justtype_config_nickname");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSessions([]);
    setLeaderboardData([]);
    setUserNickname("");
    setAuthUsername("");
    setAuthPassword("");
    setAuthError(null);
  }

  if (!mounted) {
    return (
      <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-16rem)] font-mono text-xs text-muted-soft">
        Initializing leaderboard...
      </div>
    );
  }

  // Form stagger animation variants
  const handleTabChange = (tab: "login" | "signup") => {
    if (tab === authTab) return;
    setDirection(tab === "signup" ? 1 : -1);
    setAuthTab(tab);
    setAuthError(null);
  };

  const cardVariants: any = {
    hidden: { opacity: 0, scale: 0.98, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 24
      }
    }
  };

  const formSlideVariants: any = {
    hidden: (dir: number) => ({
      opacity: 0,
      x: dir * 24,
      filter: "blur(4px)",
    }),
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: -dir * 24,
      filter: "blur(4px)",
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    })
  };

  const rowVariants: any = {
    hidden: { opacity: 0, y: 8 },
    visible: (idx: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: Math.min(idx * 0.025, 0.2),
        duration: 0.2,
        ease: "easeOut"
      }
    })
  };

  const formItemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  const ShimmerRow = () => (
    <tr className="animate-pulse border-b border-border-hairline">
      <td className="py-4 text-center w-12">
        <div className="h-4 w-4 bg-muted/15 rounded mx-auto" />
      </td>
      <td className="py-4 flex items-center gap-2">
        <div className="h-4 w-28 bg-muted/15 rounded" />
      </td>
      <td className="py-4">
        <div className="h-4 w-14 bg-muted/15 rounded ml-auto" />
      </td>
      <td className="py-4">
        <div className="h-4 w-10 bg-muted/15 rounded ml-auto" />
      </td>
      <td className="py-4 text-right pr-4">
        <div className="h-4 w-16 bg-muted/15 rounded ml-auto" />
      </td>
    </tr>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-16rem)] relative overflow-hidden">
        {/* Ambient background blur elements for shock-factor high design */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-[8s]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-teal/5 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-[12s]" />

        {/* Beautiful Authentication Card */}
        <motion.div
          layout
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{
            layout: { type: "spring", stiffness: 350, damping: 32 }
          }}
          className="max-w-md w-full bg-card/85 backdrop-blur-md border border-border-hairline rounded-xl p-8 shadow-2xl flex flex-col gap-6 relative z-10"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={authTab}
                initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={`p-3.5 rounded-full ring-4 transition-all duration-300 ${
                  authTab === "login" 
                    ? "bg-primary/10 text-primary ring-primary/5" 
                    : "bg-accent-teal/10 text-accent-teal ring-accent-teal/5"
                }`}
              >
                {authTab === "login" ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={authTab}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <h1 className="text-2xl font-serif text-foreground font-semibold tracking-tight">
                  {authTab === "login" ? "Sign In to Leaderboard" : "Create Local Account"}
                </h1>
                <p className="text-xs text-muted max-w-xs leading-relaxed">
                  {authTab === "login" 
                    ? "Welcome back! Enter your credentials to access your session registry." 
                    : "New here? Set up a local username and password to track your speeds."
                  }
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Segmented Control Pill Switcher */}
          <div className="bg-background border border-border-hairline rounded-xl p-1 flex relative z-10 select-none">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer relative text-center focus:outline-none"
            >
              <span className={`relative z-20 transition-colors duration-300 ${authTab === "login" ? "text-white font-bold" : "text-muted hover:text-foreground"}`}>
                Sign In
              </span>
              {authTab === "login" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-primary rounded-lg z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer relative text-center focus:outline-none"
            >
              <span className={`relative z-20 transition-colors duration-300 ${authTab === "signup" ? "text-white font-bold" : "text-muted hover:text-foreground"}`}>
                Create Account
              </span>
              {authTab === "signup" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-primary rounded-lg z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          </div>

          {/* Animated Form container */}
          <div className="relative overflow-hidden min-h-[220px] flex flex-col justify-start">
            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key={authTab}
                custom={direction}
                onSubmit={handleAuthSubmit}
                variants={formSlideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-4 w-full"
              >
                {authError && (
                  <motion.div
                    key={shakeTrigger}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      x: [0, -8, 8, -8, 8, -4, 4, 0] 
                    }}
                    transition={{ 
                      x: { duration: 0.4 },
                      default: { type: "spring", stiffness: 300, damping: 25 }
                    }}
                    className="p-3.5 bg-error/10 border border-error/20 rounded-lg text-xs text-error font-mono flex items-center gap-2 shadow-sm"
                  >
                    <span className="text-base">⚠️</span>
                    <span>{authError}</span>
                  </motion.div>
                )}

                <motion.div variants={formItemVariants} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-muted font-semibold">Username</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Enter username..."
                    maxLength={14}
                    className="bg-background border border-border-hairline rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono w-full transition-all duration-200 focus:ring-1 focus:ring-primary/25"
                  />
                </motion.div>

                <motion.div variants={formItemVariants} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-muted font-semibold">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={authTab === "login" ? "Enter your password..." : "Choose a secure password..."}
                    className="bg-background border border-border-hairline rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono w-full transition-all duration-200 focus:ring-1 focus:ring-primary/25"
                  />
                </motion.div>

                <motion.div variants={formItemVariants} className="mt-2">
                  <motion.button
                    whileHover={{ scale: 1.01, translateY: -1 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className={`w-full py-2.5 text-white text-xs font-semibold rounded-lg shadow-md transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                      authTab === "login"
                        ? "bg-primary hover:bg-primary-hover shadow-primary/10 hover:shadow-primary/20"
                        : "bg-accent-teal hover:bg-accent-teal/90 shadow-accent-teal/10 hover:shadow-accent-teal/20"
                    }`}
                  >
                    {authTab === "login" ? (
                      <>
                        <span>Sign In</span>
                        <LogIn className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <UserPlus className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-hairline pb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-serif text-foreground">
                {currentUser ? `${currentUser}'s Leaderboard` : "Tactile Leaderboard"}
              </h1>
              <p className="text-sm text-muted">Your session registry, local milestones, and typing speed progress.</p>
            </div>
          </div>
          
          {/* User Profile & Log Out */}
          {currentUser && (
            <div className="flex items-center gap-3 bg-card border border-border-hairline px-4 py-2 rounded-md font-mono text-xs shadow-xs">
              <User className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-muted-soft text-[10px] uppercase font-semibold">Logged in as</span>
                <span className="text-foreground font-bold">{currentUser}</span>
              </div>
              <div className="h-6 w-px bg-border-hairline mx-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-muted hover:text-error transition-colors cursor-pointer font-semibold py-1 px-2 hover:bg-error/5 rounded"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
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
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => <ShimmerRow key={idx} />)
                    ) : (
                      leaderboardData.map((entry, idx) => {
                        const isSelf = entry.username === currentUser;
                        return (
                          <motion.tr
                            key={entry.username || idx}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={isSelf ? { scale: 1.002 } : { x: 3, scale: 1.002 }}
                            transition={{ type: "spring", stiffness: 450, damping: 28 }}
                            className={`transition-all duration-150 relative border-b border-border-hairline ${
                              isSelf
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:text-foreground hover:bg-muted/5"
                            }`}
                          >
                            <td className={`py-3 text-center ${isSelf ? "border-l-4 border-primary pl-1 font-bold animate-pulse" : ""}`}>
                              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                            </td>
                            <td className="py-3 flex items-center gap-2">
                              <span>{entry.username}</span>
                              {isSelf && (
                                <span className="text-[10px] font-mono uppercase bg-primary/20 px-1.5 py-0.5 rounded text-primary font-semibold">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right font-bold">
                              {`${entry.wpm} WPM`}
                            </td>
                            <td className="py-3 text-right">
                              {`${entry.accuracy}%`}
                            </td>
                            <td className="py-3 text-right capitalize">{entry.layout}</td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isLoading && leaderboardData.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-4 text-center text-muted-soft font-mono text-xs border border-dashed border-border-hairline p-8 rounded bg-background/50 flex flex-col items-center gap-2"
                >
                  <span>No scores recorded yet.</span>
                  <Link href="/test" className="text-primary hover:underline font-bold flex items-center gap-1">
                    <span>Complete tests to appear on leaderboard</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              )}

              {!isLoading && leaderboardData.length > 0 && isLoggedIn && !leaderboardData.some(e => e.username === currentUser) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-4 text-center text-muted-soft font-mono text-xs border border-dashed border-primary/30 p-4 rounded bg-primary/5 flex flex-col items-center gap-1 shadow-sm"
                >
                  <span>You haven&apos;t completed any tests yet.</span>
                  <Link href="/test" className="text-primary hover:underline font-bold">
                    Complete tests to appear on leaderboard
                  </Link>
                </motion.div>
              )}
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
