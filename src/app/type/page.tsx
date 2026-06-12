"use client";

import { useState, useEffect, useMemo } from "react";
import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import { 
  Clock, 
  FileText, 
  Quote, 
  Sparkles, 
  Keyboard,
  BookOpen,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  TrendingUp,
  HandMetal,
  Info
} from "lucide-react";
import { calculateFocusScore, getSavedSessions } from "@/utils/aiEngine";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const ResultsChart = dynamic(() => import("@/components/ResultsChart"), {
  ssr: false,
});

const FINGER_MAPPING: Record<string, { hand: "left" | "right"; finger: "pinky" | "ring" | "middle" | "index" | "thumb" }> = {
  q: { hand: "left", finger: "pinky" },
  a: { hand: "left", finger: "pinky" },
  z: { hand: "left", finger: "pinky" },
  '1': { hand: "left", finger: "pinky" },
  w: { hand: "left", finger: "ring" },
  s: { hand: "left", finger: "ring" },
  x: { hand: "left", finger: "ring" },
  '2': { hand: "left", finger: "ring" },
  e: { hand: "left", finger: "middle" },
  d: { hand: "left", finger: "middle" },
  c: { hand: "left", finger: "middle" },
  '3': { hand: "left", finger: "middle" },
  r: { hand: "left", finger: "index" },
  f: { hand: "left", finger: "index" },
  v: { hand: "left", finger: "index" },
  t: { hand: "left", finger: "index" },
  g: { hand: "left", finger: "index" },
  b: { hand: "left", finger: "index" },
  '4': { hand: "left", finger: "index" },
  '5': { hand: "left", finger: "index" },
  y: { hand: "right", finger: "index" },
  u: { hand: "right", finger: "index" },
  h: { hand: "right", finger: "index" },
  j: { hand: "right", finger: "index" },
  n: { hand: "right", finger: "index" },
  m: { hand: "right", finger: "index" },
  '6': { hand: "right", finger: "index" },
  '7': { hand: "right", finger: "index" },
  i: { hand: "right", finger: "middle" },
  k: { hand: "right", finger: "middle" },
  ',': { hand: "right", finger: "middle" },
  '8': { hand: "right", finger: "middle" },
  o: { hand: "right", finger: "ring" },
  l: { hand: "right", finger: "ring" },
  '.': { hand: "right", finger: "ring" },
  '9': { hand: "right", finger: "ring" },
  p: { hand: "right", finger: "pinky" },
  ';': { hand: "right", finger: "pinky" },
  '/': { hand: "right", finger: "pinky" },
  '[': { hand: "right", finger: "pinky" },
  ']': { hand: "right", finger: "pinky" },
  "'": { hand: "right", finger: "pinky" },
  '-': { hand: "right", finger: "pinky" },
  '=': { hand: "right", finger: "pinky" },
  '0': { hand: "right", finger: "pinky" },
  ' ': { hand: "right", finger: "thumb" },
};

const getAiCoachFeedback = (wpm: number, accuracy: number, focus: number, misspelledCount: number, weakest: string | null) => {
  if (accuracy === 100) {
    return {
      title: "Perfect Accuracy!",
      message: `Outstanding performance! You completed the test at ${wpm} WPM with flawless 100% accuracy. Your pace consistency (Focus: ${focus}%) was exceptional. Keep typing with this superb precision!`,
      badge: "Flawless Master",
      badgeColor: "text-success bg-success/10 border-success/20 border"
    };
  }
  
  if (accuracy < 85) {
    return {
      title: "Control Over Speed",
      message: `You reached a speed of ${wpm} WPM, but accuracy fell to ${accuracy}%. Try slowing down by 10-15% to reinforce correct muscle memory. Accuracy is the foundation of high-speed typing!`,
      badge: "Focus on Control",
      badgeColor: "text-error bg-error/10 border-error/20 border"
    };
  }
  
  if (focus < 70) {
    return {
      title: "Smoothing Out Your Rhythm",
      message: `Your typing speed is solid at ${wpm} WPM, but your cadence is a bit uneven (Focus: ${focus}%). Try typing to a steady internal beat, letting your fingers move in a smooth flow without abrupt pauses.`,
      badge: "Pacing Alert",
      badgeColor: "text-warning bg-warning/10 border-warning/20 border"
    };
  }
  
  let msg = `Excellent work! You achieved ${wpm} WPM with a strong accuracy of ${accuracy}% and a focus index of ${focus}%.`;
  if (weakest) {
    msg += ` You experienced a slight slowdown or error-prone moments on the '${weakest.toUpperCase()}' key. Practice some adaptive words containing '${weakest}' to build confidence.`;
  } else {
    msg += ` Your rhythm was solid and keystrokes were precise. You are building excellent typing habits.`;
  }
  
  return {
    title: "Solid Session!",
    message: msg,
    badge: wpm > 85 ? "Elite Typist" : wpm > 55 ? "Steady Pace" : "Rising Star",
    badgeColor: "text-primary bg-primary/10 border-primary/20 border"
  };
};

// ScoreChart placeholder removed since we use dynamic ResultsChart component

export default function TypePage() {
  const {
    mode,
    limit,
    caretType,
    layout,
    words,
    typedInput,
    status,
    timeLeft,
    elapsedTime,
    wpm,
    accuracy,
    history,
    getTelemetry,
    setMode,
    setLimit,
    setCaretType,
    setLayout,
    restartTest,
    registerKeystroke
  } = useTypingTest();

  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, { errorRate: number; avgLatency: number; score: number }>>({});

  // Unique Killer Metrics: Acceleration Profile
  const accelerationProfile = useMemo(() => {
    if (status !== "completed" || history.length < 3) {
      return {
        title: "Stable Pace",
        description: "A steady pace. Keep pushing limits to check speed acceleration.",
        badge: "Cruiser",
        color: "text-muted-soft border-border-hairline bg-card/25"
      };
    }
    
    const speeds = history.map(h => h.wpm);
    const peakWpm = Math.max(...speeds);
    const peakIndex = speeds.indexOf(peakWpm);
    const peakTime = history[peakIndex]?.time || 0;
    
    const lastThird = Math.floor(speeds.length * 2 / 3);
    
    if (peakTime <= 4) {
      return {
        title: "Sprint Start",
        description: `Explosive start peaking at ${peakWpm} WPM in the first ${peakTime}s, then stabilizing.`,
        badge: "Sprint Start",
        color: "text-primary border-primary/20 bg-primary/5"
      };
    } else if (peakIndex >= lastThird) {
      return {
        title: "Strong Finish",
        description: `Built consistent momentum throughout, peaking at ${peakWpm} WPM in the final seconds.`,
        badge: "Strong Finish",
        color: "text-success border-success/20 bg-success/5"
      };
    } else {
      const avgWpm = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const variance = speeds.reduce((acc, val) => acc + Math.pow(val - avgWpm, 2), 0) / speeds.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev < 4) {
        return {
          title: "Steady Pace",
          description: `Metronome consistency! Maintained speed near ${Math.round(avgWpm)} WPM with very low variance.`,
          badge: "Steady Pace",
          color: "text-accent-teal border-accent-teal/20 bg-accent-teal/5"
        };
      } else {
        return {
          title: "Mid-test Surge",
          description: `Hit your stride mid-session, peaking at ${peakWpm} WPM before stabilizing.`,
          badge: "Mid Surge",
          color: "text-warning border-warning/20 bg-warning/5"
        };
      }
    }
  }, [history, status]);

  // Unique Killer Metrics: Finger Fatigue / Heatmap Hint
  const fingerFatigue = useMemo(() => {
    if (status !== "completed") return null;
    const telemetry = getTelemetry();
    if (telemetry.length === 0) return null;
    
    const fingerErrors: Record<string, number> = {};
    const fingerSlowdowns: Record<string, { count: number; totalLatency: number }> = {};
    let totalErrors = 0;
    
    telemetry.forEach(t => {
      const keyLower = t.key.toLowerCase();
      const mapping = FINGER_MAPPING[keyLower];
      if (!mapping) return;
      
      const fingerId = `${mapping.hand}_${mapping.finger}`;
      
      if (!t.isCorrect) {
        fingerErrors[fingerId] = (fingerErrors[fingerId] || 0) + 1;
        totalErrors++;
      }
      
      if (t.isCorrect && t.latency > 250) {
        if (!fingerSlowdowns[fingerId]) {
          fingerSlowdowns[fingerId] = { count: 0, totalLatency: 0 };
        }
        fingerSlowdowns[fingerId].count++;
        fingerSlowdowns[fingerId].totalLatency += t.latency;
      }
    });
    
    let worstFingerForErrors = "";
    let maxErrors = 0;
    Object.entries(fingerErrors).forEach(([finger, count]) => {
      if (count > maxErrors) {
        maxErrors = count;
        worstFingerForErrors = finger;
      }
    });
    
    let worstFingerForSlowdowns = "";
    let maxAvgSlowdown = 0;
    Object.entries(fingerSlowdowns).forEach(([finger, data]) => {
      const avg = data.totalLatency / data.count;
      if (avg > maxAvgSlowdown) {
        maxAvgSlowdown = avg;
        worstFingerForSlowdowns = finger;
      }
    });
    
    const formatFingerName = (id: string) => {
      if (!id) return "";
      const [hand, finger] = id.split("_");
      return `${hand.charAt(0).toUpperCase() + hand.slice(1)} ${finger.charAt(0).toUpperCase() + finger.slice(1)}`;
    };
    
    if (worstFingerForErrors && totalErrors > 0) {
      const errorPct = Math.round((maxErrors / totalErrors) * 100);
      const fingerName = formatFingerName(worstFingerForErrors);
      return {
        title: "Finger Fatigue",
        description: `Your ${fingerName} caused ${errorPct}% of errors. Adjust wrist posture to relax fingers.`,
        badge: "Fatigue Alert",
        color: "text-error border-error/20 bg-error/5"
      };
    } else if (worstFingerForSlowdowns) {
      const fingerName = formatFingerName(worstFingerForSlowdowns);
      return {
        title: "Rhythm Lag",
        description: `Your ${fingerName} registered the highest lag (avg ${Math.round(maxAvgSlowdown)}ms latency).`,
        badge: "Slowdown Alert",
        color: "text-warning border-warning/20 bg-warning/5"
      };
    }
    
    return {
      title: "Balanced Hands",
      description: "Excellent rhythm! Load was distributed evenly across all fingers.",
      badge: "Perfect Balance",
      color: "text-success border-success/20 bg-success/5"
    };
  }, [getTelemetry, status]);



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

  // Reconstruct misspelled words for the current session
  const misspelledWords = useMemo(() => {
    if (status !== "completed") return [];
    const targetWords = words;
    const typedWords = typedInput.trim().split(/\s+/);
    
    const list = [];
    for (let i = 0; i < Math.min(targetWords.length, typedWords.length); i++) {
      if (targetWords[i] !== typedWords[i]) {
        list.push({
          index: i,
          correct: targetWords[i],
          typed: typedWords[i] || ""
        });
      }
    }
    return list;
  }, [words, typedInput, status]);

  // Analyze current session telemetry
  const sessionAnalytics = useMemo(() => {
    if (status !== "completed") return { weakKeys: [], fastestKeys: [], mistakePatterns: [], coach: null };
    
    const telemetry = getTelemetry();
    const keyStats: Record<string, { key: string; total: number; errors: number; latencies: number[] }> = {};
    
    telemetry.forEach(t => {
      if (t.key.length !== 1) return;
      const k = t.key.toLowerCase();
      if (!keyStats[k]) {
        keyStats[k] = { key: k, total: 0, errors: 0, latencies: [] };
      }
      keyStats[k].total++;
      if (!t.isCorrect) {
        keyStats[k].errors++;
      } else {
        keyStats[k].latencies.push(t.latency);
      }
    });
    
    // 1. Weak keys
    const weakKeys = Object.values(keyStats)
      .map(data => {
        const errorRate = data.total > 0 ? data.errors / data.total : 0;
        const avgLatency = data.latencies.length > 0 ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length : 0;
        const score = Math.round(errorRate * 70 + Math.min(30, (avgLatency / 400) * 30));
        return { key: data.key, errorRate, avgLatency, score, total: data.total, errors: data.errors };
      })
      .filter(item => item.total >= 1)
      .sort((a, b) => b.score - a.score);
      
    // 2. Fastest keys
    const fastestKeys = Object.values(keyStats)
      .map(data => {
        const avgLatency = data.latencies.length > 0 ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length : 9999;
        return { key: data.key, avgLatency, total: data.total };
      })
      .filter(item => item.total >= 1 && item.avgLatency < 9999)
      .sort((a, b) => a.avgLatency - b.avgLatency);
      
    // 3. Mistake patterns
    const patterns = {
      transposition: { type: "transposition", description: "Swapped adjacent letters", count: 0, examples: [] as string[] },
      double_letter: { type: "double_letter", description: "Double letter mistakes", count: 0, examples: [] as string[] },
      substitution: { type: "substitution", description: "Substitution errors", count: 0, examples: [] as string[] },
    };
    
    telemetry.forEach((t, i) => {
      if (t.isCorrect) return;
      const next = telemetry[i + 1];
      if (next && !next.isCorrect && next.typedKey === t.key && t.typedKey === next.key) {
        patterns.transposition.count++;
        if (patterns.transposition.examples.length < 2) {
          patterns.transposition.examples.push(`'${t.key}${next.key}' typed '${t.typedKey}${next.typedKey}'`);
        }
      } else if (t.key === telemetry[i - 1]?.key && t.typedKey !== t.key) {
        patterns.double_letter.count++;
        if (patterns.double_letter.examples.length < 2) {
          patterns.double_letter.examples.push(`'${t.key}${t.key}' typed '${t.key}${t.typedKey}'`);
        }
      } else {
        patterns.substitution.count++;
        if (patterns.substitution.examples.length < 2) {
          patterns.substitution.examples.push(`'${t.key}' typed '${t.typedKey}'`);
        }
      }
    });
    
    const mistakePatterns = Object.values(patterns).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

    // 4. Coach Comments
    const weakest = weakKeys.length > 0 ? weakKeys[0].key : null;
    const coach = getAiCoachFeedback(wpm, accuracy, finalFocusScore, misspelledWords.length, weakest);
    
    return { weakKeys, fastestKeys, mistakePatterns, coach };
  }, [getTelemetry, status, wpm, accuracy, finalFocusScore, misspelledWords]);

  const totalPatternCount = useMemo(() => {
    return sessionAnalytics.mistakePatterns.reduce((sum, p) => sum + p.count, 0) || 1;
  }, [sessionAnalytics.mistakePatterns]);

  // Helper to highlight word differences in typo review
  const getWordDiff = (correct: string, typed: string) => {
    const elements: React.ReactNode[] = [];
    const maxLen = Math.max(correct.length, typed.length);
    for (let i = 0; i < maxLen; i++) {
      const cLetter = correct[i];
      const tLetter = typed[i];
      if (cLetter === tLetter) {
        elements.push(<span key={i} className="text-muted-soft">{cLetter}</span>);
      } else {
        if (tLetter === undefined) {
          elements.push(
            <span key={i} className="text-warning/70 underline" title={`Missed '${cLetter}'`}>
              {cLetter}
            </span>
          );
        } else if (cLetter === undefined) {
          elements.push(
            <span key={i} className="text-error bg-error/10 line-through">
              {tLetter}
            </span>
          );
        } else {
          elements.push(
            <span key={i} className="text-error bg-error/15 line-through decoration-wavy" title={`Typed '${tLetter}' instead of '${cLetter}'`}>
              {tLetter}
            </span>
          );
        }
      }
    }
    return elements;
  };

  // Keyboard listeners for pressed keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (status === "completed") return;

      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => prev.filter((k) => k !== key));
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
    };
  }, [status]);

  // Load telemetry stats for keyboard heatmap overlay
  useEffect(() => {
    try {
      const sessions = getSavedSessions();
      interface HeatmapAccumulator {
        total: number;
        errors: number;
        latencies: number[];
      }
      const acc: Record<string, HeatmapAccumulator> = {};
      
      sessions.forEach(session => {
        if (!session.telemetry) return;
        session.telemetry.forEach(t => {
          if (t.key.length !== 1) return;
          const k = t.key.toLowerCase();
          if (!acc[k]) {
            acc[k] = { total: 0, errors: 0, latencies: [] };
          }
          const item = acc[k];
          item.total += 1;
          if (!t.isCorrect) {
            item.errors += 1;
          } else {
            item.latencies.push(t.latency);
          }
        });
      });

      const data: Record<string, { errorRate: number; avgLatency: number; score: number }> = {};
      Object.keys(acc).forEach(k => {
        const item = acc[k];
        const errorRate = item.total > 0 ? item.errors / item.total : 0;
        const sumLatency = item.latencies.reduce((a: number, b: number) => a + b, 0);
        const avgLatency = item.latencies.length > 0 ? sumLatency / item.latencies.length : 0;
        
        const errorPoints = errorRate * 60;
        const latencyRef = Math.max(0, avgLatency - 120);
        const latencyPoints = Math.min(40, (latencyRef / 280) * 40);
        const score = Math.round(errorPoints + latencyPoints);
        
        data[k] = { errorRate, avgLatency, score };
      });
      setTimeout(() => setHeatmapData(data), 0);
    } catch (e) {
      console.error("Failed to compile keyboard heatmap stats", e);
    }
  }, [status]);

  // Calculate the next character to type for the keyboard finger hint
  const nextChar = useMemo(() => {
    if (status === "completed" || !words || words.length === 0) return "";
    const targetText = words.join(" ");
    return targetText[typedInput.length] || "";
  }, [words, typedInput.length, status]);

  const isFocusMode = status === "typing";

  // Group errors by second from telemetry data
  const errorsPerSecond = useMemo(() => {
    const telemetry = getTelemetry();
    if (telemetry.length === 0) return {};
    const start = telemetry[0].timestamp;
    const errorMap: Record<number, number> = {};
    telemetry.forEach((t) => {
      if (!t.isCorrect) {
        const sec = Math.min(
          elapsedTime || 1,
          Math.max(1, Math.round((t.timestamp - start) / 1000))
        );
        errorMap[sec] = (errorMap[sec] || 0) + 1;
      }
    });
    return errorMap;
  }, [getTelemetry, elapsedTime]);

  // Calculate correct, incorrect, extra, and missed character counts
  const charStats = useMemo(() => {
    const telemetry = getTelemetry();
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    
    telemetry.forEach((t) => {
      if (t.isCorrect) {
        correct++;
      } else {
        if (t.key === "") {
          extra++;
        } else {
          incorrect++;
        }
      }
    });

    const targetText = words.join(" ");
    let missed = 0;
    if (status === "completed") {
      for (let i = typedInput.length; i < targetText.length; i++) {
        if (targetText[i] !== " ") {
          missed++;
        }
      }
    }

    return { correct, incorrect, extra, missed };
  }, [getTelemetry, words, typedInput.length, status]);

  return (
    <div className={`w-full flex-1 flex flex-col items-center bg-background relative select-none px-4 sm:px-6 py-6 md:py-8 z-10 ${
      status === "completed"
        ? "min-h-[calc(100vh-4rem)] h-auto overflow-y-auto"
        : "min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden justify-between"
    }`}>
      
      {status !== "completed" ? (
        <>
          {/* 1. COMPACT CONTROLS TOOLBAR */}
          <div 
            className={`w-full max-w-[850px] flex items-center justify-between bg-card/25 border border-border-hairline rounded-[12px] px-6 h-[52px] font-mono text-sm text-muted gap-4 overflow-x-auto whitespace-nowrap scrollbar-none transition-all duration-300 shrink-0 ${
              isFocusMode ? "opacity-15 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Left: Mode Selector */}
            <div className="flex items-center bg-background/20 p-0.5 rounded-lg border border-border-hairline/40 shrink-0">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "time" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "words" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "quote" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "custom" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>zen</span>
              </button>
            </div>

            {/* Center: Limit / Duration Options */}
            <div className="flex-1 flex justify-center border-x border-border-hairline/30 px-4">
              {mode === "time" && (
                <div className="flex items-center gap-1">
                  {[15, 30, 60, 120].map((t, i, arr) => (
                    <div key={t} className="flex items-center">
                      <button
                        onClick={() => setLimit(t)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === t 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {t}s
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mode === "words" && (
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((w, i, arr) => (
                    <div key={w} className="flex items-center">
                      <button
                        onClick={() => setLimit(w)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === w 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {w}
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Layout & Caret Dropdowns (No Sound Section) */}
            <div className="flex items-center space-x-3 pl-2 shrink-0">
              {/* Layout */}
              <div className="flex items-center space-x-1 font-sans">
                <Keyboard className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="qwerty" className="bg-card">QWERTY</option>
                  <option value="dvorak" className="bg-card">Dvorak</option>
                  <option value="colemak" className="bg-card">Colemak</option>
                </select>
              </div>

              {/* Caret */}
              <div className="flex items-center space-x-1 font-sans">
                <span className="text-[12.5px] text-muted-soft">|</span>
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as CaretType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1 ml-0.5"
                >
                  <option value="smooth" className="bg-card">Line</option>
                  <option value="block" className="bg-card">Block</option>
                  <option value="underline" className="bg-card">Under</option>
                  <option value="hidden" className="bg-card">Hide</option>
                </select>
              </div>
            </div>

          </div>

          {/* 2. CENTERED EXPERIENCE BLOCK */}
          <div 
            className="w-full flex-1 flex flex-col justify-center items-center py-2 transition-all duration-300 ease-in-out"
            style={{
              maxWidth: isFocusMode ? "1300px" : "850px",
            }}
          >
            {/* Live stats HUD - Minimal design */}
            <div 
              className={`flex items-center gap-6 font-mono text-[11px] text-muted-soft h-6 select-none transition-opacity duration-300 mb-[16px] shrink-0 ${
                isFocusMode ? "opacity-45" : "opacity-90"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>time:</span>
                <span className="text-foreground font-semibold">
                  {status === "typing"
                    ? (mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`)
                    : (mode === "time" ? `${limit}s` : `--`)}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>wpm:</span>
                <span className="text-primary font-semibold">{status === "typing" ? wpm : `--`}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>acc:</span>
                <span className="text-success font-semibold">{status === "typing" ? `${accuracy}%` : `100%`}</span>
              </div>
            </div>

            {/* Word board wrapper */}
            <div className="w-full">
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

            {/* Restart Info row */}
            <div 
              className={`mt-4 flex items-center gap-3 text-[11px] text-muted-soft select-none font-mono transition-opacity duration-300 ${
                isFocusMode ? "opacity-15 hover:opacity-50" : "opacity-80"
              }`}
            >
              <button
                onClick={() => {
                  restartTest();
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                {/* Circular Restart arrow SVG */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 9.5a2.5 2.5 0 115 0" />
                </svg>
                <span>Restart</span>
              </button>
              <span>•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-card border border-border-hairline rounded text-[9px] text-muted select-none">Tab</kbd>
                <span>quick reset</span>
              </div>
            </div>

          </div>

          {/* 3. FIXED BOTTOM SECTION: Virtual Keyboard */}
          <div 
            className={`w-full max-w-[740px] transition-all duration-300 shrink-0 select-none ${
              isFocusMode 
                ? "translate-y-4 pointer-events-none" 
                : "translate-y-0"
            }`}
          >
            <VirtualKeyboard 
              layout={layout} 
              pressedKeys={pressedKeys} 
              heatmapMode="none"
              heatmapData={heatmapData}
              interactive={false}
              nextChar={nextChar}
              isFocusMode={isFocusMode}
            />
          </div>
        </>
      ) : (
        /* Finished Test Scorecard exactly matching the reference Monkeytype image */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full flex-1 flex flex-col items-center justify-center max-w-[960px] py-4 font-mono"
        >
          <div className="w-full flex flex-col md:flex-row items-stretch gap-6 mb-6">
            
            {/* Left Column: WPM and Accuracy stacked vertically */}
            <div className="flex flex-col justify-center items-start md:w-[185px] gap-6 pl-4 select-none shrink-0 text-left">
              <div>
                <span className="text-muted-soft text-xs font-sans tracking-widest uppercase font-bold block mb-0.5">wpm</span>
                <span className="text-[68px] md:text-[84px] font-black text-primary leading-none block tracking-tighter">{wpm}</span>
              </div>
              <div>
                <span className="text-muted-soft text-xs font-sans tracking-widest uppercase font-bold block mb-0.5">acc</span>
                <span className="text-[68px] md:text-[84px] font-black text-primary leading-none block tracking-tighter">{accuracy}%</span>
              </div>
            </div>

            {/* Right Column: Custom Recharts Score Chart */}
            <div className="flex-1 min-h-[320px] bg-background/20 border border-border-hairline/20 rounded-xl p-4 flex items-center justify-center">
              <ResultsChart 
                history={history} 
                errorsPerSecond={errorsPerSecond} 
                elapsedTime={elapsedTime} 
                telemetry={getTelemetry()}
              />
            </div>

          </div>

          {/* Score Details Row */}
          <div className="w-full grid grid-cols-2 md:grid-cols-6 gap-6 text-left border-t border-border-hairline/10 pt-5 px-4 select-none">
            
            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">test type</p>
              <p className="text-base font-semibold text-primary">{mode} {limit}</p>
              <p className="text-[9px] text-muted-soft/50">english</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">other</p>
              <p className="text-base font-semibold text-primary">
                {accuracy < 85 ? "invalid (accuracy)" : "none"}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">raw</p>
              <p className="text-base font-semibold text-primary">
                {accuracy > 0 ? Math.round((wpm * 100) / accuracy) : wpm}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">characters</p>
              <p className="text-base font-semibold text-primary">
                {charStats.correct}/{charStats.incorrect}/{charStats.extra}/{charStats.missed}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">consistency</p>
              <p className="text-base font-semibold text-primary">{finalFocusScore}%</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">time</p>
              <p className="text-base font-semibold text-primary">{elapsedTime}s</p>
              <p className="text-[9px] text-muted-soft/50">00:00:{elapsedTime < 10 ? `0${elapsedTime}` : elapsedTime} session</p>
            </div>

          </div>

          {/* Coach & Insights Grid Section */}
          <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 text-left select-none">
            {/* Left: AI Coach Recommendation */}
            <div className="md:col-span-7 flex flex-col justify-between border border-border-hairline/15 rounded-xl bg-card/10 p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2 font-sans tracking-wide uppercase">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span>AI Coach Recommendation</span>
                  </h4>
                  {sessionAnalytics.coach && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${sessionAnalytics.coach.badgeColor}`}>
                      {sessionAnalytics.coach.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed font-sans mt-2">
                  {sessionAnalytics.coach ? sessionAnalytics.coach.message : "Excellent typing session."}
                </p>
              </div>
              {misspelledWords.length > 0 && (
                <div className="text-[10px] text-muted-soft mt-4 flex items-center gap-1.5 font-sans border-t border-border-hairline/10 pt-3">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Practice the custom Zen Mode in the home toolbar to auto-generate words targeting your errors!</span>
                </div>
              )}
            </div>

            {/* Right: Acceleration Profile & Finger Fatigue */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* Acceleration Profile */}
              <div className="border border-border-hairline/15 rounded-xl bg-card/10 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-soft font-sans font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span>Acceleration Profile</span>
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono border ${accelerationProfile.color}`}>
                    {accelerationProfile.badge}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-foreground mt-0.5 font-sans">{accelerationProfile.title}</h5>
                <p className="text-[11px] text-muted leading-relaxed font-sans">{accelerationProfile.description}</p>
              </div>

              {/* Finger Fatigue Hint */}
              {fingerFatigue && (
                <div className="border border-border-hairline/15 rounded-xl bg-card/10 p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-soft font-sans font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <HandMetal className="w-3.5 h-3.5 text-primary" />
                      <span>Finger Telemetry</span>
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono border ${fingerFatigue.color}`}>
                      {fingerFatigue.badge}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground mt-0.5 font-sans">{fingerFatigue.title}</h5>
                  <p className="text-[11px] text-muted leading-relaxed font-sans">{fingerFatigue.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Cards Grid */}
          <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left select-none">
            
            {/* Card 1: Weakest Keys */}
            <div className="border border-border-hairline/15 rounded-xl bg-card/10 p-5 shadow-sm flex flex-col">
              <h5 className="text-[11px] font-bold text-error/85 tracking-widest font-sans uppercase mb-4 flex items-center gap-2 pb-2 border-b border-border-hairline/10">
                <AlertCircle className="w-3.5 h-3.5 text-error animate-pulse" />
                <span>WEAKEST KEYS</span>
              </h5>
              
              {sessionAnalytics.weakKeys.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                  {sessionAnalytics.weakKeys.slice(0, 3).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1 px-1">
                      {/* Visual keycap */}
                      <div className="flex items-center justify-center w-7 h-7 font-sans text-xs font-black text-foreground bg-gradient-to-b from-card-elevated to-card border border-border-hairline/80 rounded-md shadow-[0_2.5px_0_rgba(255,255,255,0.05),0_3.5px_0_rgba(0,0,0,0.25)] select-none shrink-0">
                        {item.key.toUpperCase()}
                      </div>
                      {/* Impact Bar */}
                      <div className="flex-1 ml-3.5 flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center text-[10px] text-muted-soft">
                          <span>Slowdown Impact</span>
                          <span className="font-mono text-error font-semibold">{item.score}%</span>
                        </div>
                        <div className="w-full h-1 bg-card/40 rounded-full overflow-hidden border border-border-hairline/10 mt-1">
                          <div 
                            className="h-full bg-gradient-to-r from-warning to-error transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(10, item.score))}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-muted-soft/60 font-mono mt-1 leading-none">
                          <span>{item.errors} error{item.errors !== 1 ? 's' : ''}</span>
                          <span>{Math.round(item.avgLatency)}ms latency</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-soft/60 italic font-sans py-4">No weak keys detected this session.</p>
              )}
            </div>

            {/* Card 2: Mistake Patterns */}
            <div className="border border-border-hairline/15 rounded-xl bg-card/10 p-5 shadow-sm flex flex-col">
              <h5 className="text-[11px] font-bold text-primary/85 tracking-widest font-sans uppercase mb-4 flex items-center gap-2 pb-2 border-b border-border-hairline/10">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                <span>MISTAKE PATTERNS</span>
              </h5>
              
              {sessionAnalytics.mistakePatterns.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {sessionAnalytics.mistakePatterns.map((p) => {
                    const frequency = Math.round((p.count / totalPatternCount) * 100);
                    let severityLabel = "Low";
                    let severityTagClass = "text-muted-soft bg-card/45 border border-border-hairline/30";
                    let barColorClass = "bg-muted-soft";
                    
                    if (p.type === "substitution") {
                      severityLabel = "High";
                      severityTagClass = "text-error bg-error/10 border border-error/20";
                      barColorClass = "bg-error";
                    } else if (p.type === "transposition") {
                      severityLabel = "Medium";
                      severityTagClass = "text-warning bg-warning/10 border border-warning/20";
                      barColorClass = "bg-warning";
                    }
                    
                    return (
                      <div key={p.type} className="flex flex-col gap-1 text-[11px] p-2.5 rounded-lg bg-card/20 border border-border-hairline/10">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-foreground">{p.description}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded leading-none ${severityTagClass}`}>
                              {severityLabel}
                            </span>
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded-full font-mono leading-none">
                              {p.count}x
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-card/50 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full ${barColorClass} transition-all duration-500`}
                            style={{ width: `${frequency}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px] text-muted-soft/60 mt-1 leading-none">
                          <span>Frequency: {frequency}%</span>
                          {p.examples.length > 0 && (
                            <span className="font-mono text-right italic truncate max-w-[120px]">
                              e.g. {p.examples.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-6 h-6 text-success mb-2" />
                  <p className="text-[11px] text-muted-soft/60 italic font-sans">Perfect typing! No mistake patterns detected.</p>
                </div>
              )}
            </div>

            {/* Card 3: Typo Review */}
            <div className="border border-border-hairline/15 rounded-xl bg-card/10 p-5 shadow-sm flex flex-col">
              <h5 className="text-[11px] font-bold text-success/85 tracking-widest font-sans uppercase mb-4 flex items-center gap-2 pb-2 border-b border-border-hairline/10">
                <BookOpen className="w-3.5 h-3.5 text-success" />
                <span>TYPO REVIEW ({misspelledWords.length})</span>
              </h5>
              
              {misspelledWords.length > 0 ? (
                <div className="flex flex-col flex-1 justify-between gap-3">
                  <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto scrollbar-none pr-1">
                    {misspelledWords.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/25 border border-border-hairline/10 font-mono text-[11px] hover:border-border-hairline/20 transition-colors"
                      >
                        <span className="text-success font-semibold border-r border-border-hairline/20 pr-2 block">
                          {item.correct}
                        </span>
                        <div className="flex items-center font-semibold">
                          {getWordDiff(item.correct, item.typed)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
                  <CheckCircle2 className="w-8 h-8 text-success mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-foreground">Flawless Session!</p>
                  <p className="text-[10px] text-muted-soft/60 mt-0.5 font-sans">No typos were made.</p>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar Buttons Row */}
          <div className="w-full flex justify-center items-center gap-8 mt-10 mb-5">
            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Next test"
            >
              {/* Chevron right SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Restart test"
            >
              {/* Reset circular arrow SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 9.5a2.5 2.5 0 115 0" />
              </svg>
            </button>

            <button
              className="p-2 rounded-lg text-muted-soft/30 hover:text-muted-soft transition-colors cursor-not-allowed"
              title="Error info"
              disabled
            >
              {/* Warning exclamation SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>

            <button
              className="p-2 rounded-lg text-muted-soft/30 hover:text-muted-soft transition-colors cursor-not-allowed"
              title="Text view"
              disabled
            >
              {/* Lines list SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Back"
            >
              {/* Back double chevron SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <p className="text-[10px] text-muted-soft/30 select-none">
            Sign in to save your result
          </p>

        </motion.div>
      )}

    </div>
  );
}
