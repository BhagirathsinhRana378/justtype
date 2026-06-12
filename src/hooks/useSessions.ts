"use client";

import { useState, useEffect, useMemo } from "react";
import { getSavedSessions, clearAllSessions, TypingSession } from "@/utils/aiEngine";

export function dayIndex(timestamp: number): number {
  const date = new Date(timestamp);
  const localTime = timestamp - date.getTimezoneOffset() * 60 * 1000;
  return Math.floor(localTime / (24 * 60 * 60 * 1000));
}

export interface SessionStats {
  totalTests: number;
  avgWpm: number;
  peakWpm: number;
  avgAccuracy: number;
  currentStreak: number;
  bestStreak: number;
}

export function useSessions() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    const saved = getSavedSessions();
    const currentNow = Date.now();
    Promise.resolve().then(() => {
      setSessions(saved);
      setLoaded(true);
      setNow(currentNow);
    });
  }, []);

  const clear = () => {
    clearAllSessions();
    setSessions([]);
  };

  const stats = useMemo<SessionStats>(() => {
    if (sessions.length === 0 || now === 0) {
      return {
        totalTests: 0,
        avgWpm: 0,
        peakWpm: 0,
        avgAccuracy: 0,
        currentStreak: 0,
        bestStreak: 0,
      };
    }

    const totalTests = sessions.length;
    const sumWpm = sessions.reduce((acc, s) => acc + s.wpm, 0);
    const avgWpm = Math.round(sumWpm / totalTests);
    
    const peakWpm = Math.max(...sessions.map(s => s.wpm));
    
    const sumAccuracy = sessions.reduce((acc, s) => acc + s.accuracy, 0);
    const avgAccuracy = Math.round(sumAccuracy / totalTests);

    // Calculate streaks from unique local day indices sorted ascending
    const dayIndices = Array.from(
      new Set(sessions.map(s => dayIndex(s.timestamp)))
    ).sort((a, b) => a - b);
    
    const today = dayIndex(now);
    
    let bestStreak = 0;
    let currentRun = 0;
    let prevDay = -999999;
    
    for (const day of dayIndices) {
      if (day === prevDay + 1) {
        currentRun++;
      } else if (day !== prevDay) {
        currentRun = 1;
      }
      prevDay = day;
      if (currentRun > bestStreak) {
        bestStreak = currentRun;
      }
    }

    let currentStreak = 0;
    if (dayIndices.length > 0) {
      const lastDay = dayIndices[dayIndices.length - 1];
      if (lastDay === today || lastDay === today - 1) {
        let expectedDay = lastDay;
        let idx = dayIndices.length - 1;
        while (idx >= 0 && dayIndices[idx] === expectedDay) {
          currentStreak++;
          expectedDay--;
          idx--;
        }
      }
    }

    return {
      totalTests,
      avgWpm,
      peakWpm,
      avgAccuracy,
      currentStreak,
      bestStreak,
    };
  }, [sessions, now]);

  return {
    sessions,
    stats,
    loaded,
    clear,
  };
}
