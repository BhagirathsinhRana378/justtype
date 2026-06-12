"use client";

export interface KeyTelemetry {
  key: string;         // target character
  typedKey: string;    // typed character
  timestamp: number;   // millisecond timestamp
  latency: number;     // time since last keystroke in ms
  isCorrect: boolean;
}

export interface TypingSession {
  id: string;
  timestamp: number;
  wpm: number;
  accuracy: number;
  duration: number; // in seconds
  mode: string;     // 'time' | 'words' | 'quote' | 'custom'
  telemetry: KeyTelemetry[];
  layout?: string;
}

export interface WeakKeyAnalysis {
  key: string;
  errorRate: number;
  avgLatency: number;
  latencyStdDev: number;
  score: number; // Combined weakness score (0 - 100)
}

export interface GrowthPrediction {
  currentAverage: number;
  slope: number; // WPM gain per session
  predictedWPM10: number; // Predicted WPM after 10 more sessions
  predictedWPM30: number; // Predicted WPM after 30 more sessions
  predictedWPM60: number; // Predicted WPM after 60 more sessions
  r2: number; // Coefficient of determination
}

export interface BigramAnalysis {
  bigram: string;
  avgLatency: number;
  errorRate: number;
  count: number;
}

export interface MistakePattern {
  type: "transposition" | "double_letter" | "repetition" | "substitution" | "unknown";
  description: string;
  count: number;
  examples: string[];
}

// --- SELF-LEARNER PROFILE INTERFACES ---

export interface AILearnerProfile {
  sessionCount: number;
  keyMastery: Record<string, number>; // key -> percentage (0-100)
  bigramMastery: Record<string, number>; // bigram -> percentage (0-100)
  handImbalance: {
    leftLatency: number;
    rightLatency: number;
    leftErrorRate: number;
    rightErrorRate: number;
    balanceStatus: "balanced" | "left_weak" | "right_weak";
  };
  learningVelocity: number; // rolling WPM slope or recent improvement delta
  cognitiveSweetSpotWPM: number;
  historyWpm: number[];
  historyAccuracy: number[];
  activeWorkout: string;
}

export interface TutorRecommendation {
  id: string;
  title: string;
  description: string;
  actionPlan: string;
  priority: "high" | "medium" | "low";
  category: "accuracy" | "speed" | "rhythm" | "hand_balance" | "weak_keys";
}

export interface TutorReport {
  cognitiveSweetSpotWPM: number;
  learningVelocity: number;
  masteryRank: string;
  weakestKeys: { key: string; mastery: number }[];
  weakestBigrams: { bigram: string; mastery: number }[];
  handImbalanceStatus: "balanced" | "left_weak" | "right_weak";
  criticalRecommendations: TutorRecommendation[];
  recommendedWorkout: string;
}

const COMMON_WORDS_LIST = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

// Helper to get sessions from localStorage
export function getSavedSessions(): TypingSession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("justtype_sessions");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load sessions from localStorage", e);
    return [];
  }
}

// Create a default empty profile
const DEFAULT_KEYS = "abcdefghijklmnopqrstuvwxyz.,;'!?- ";
export function createDefaultProfile(): AILearnerProfile {
  const keyMastery: Record<string, number> = {};
  for (const char of DEFAULT_KEYS) {
    keyMastery[char] = 75; // start at 75% mastery baseline
  }
  return {
    sessionCount: 0,
    keyMastery,
    bigramMastery: {},
    handImbalance: {
      leftLatency: 180,
      rightLatency: 180,
      leftErrorRate: 0.05,
      rightErrorRate: 0.05,
      balanceStatus: "balanced"
    },
    learningVelocity: 0,
    cognitiveSweetSpotWPM: 40,
    historyWpm: [],
    historyAccuracy: [],
    activeWorkout: "all_rounder"
  };
}

// Safely get profile from localStorage
export function getAILearnerProfile(): AILearnerProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  try {
    const data = localStorage.getItem("justtype_ai_profile");
    if (!data) return createDefaultProfile();
    const profile = JSON.parse(data);
    
    // Merge baseline and loaded profiles to prevent missing properties
    const defaultProfile = createDefaultProfile();
    return {
      ...defaultProfile,
      ...profile,
      keyMastery: { ...defaultProfile.keyMastery, ...profile.keyMastery },
      bigramMastery: { ...profile.bigramMastery },
      handImbalance: { ...defaultProfile.handImbalance, ...profile.handImbalance }
    };
  } catch (e) {
    console.error("Failed to load AI profile", e);
    return createDefaultProfile();
  }
}

// Save profile to localStorage
export function saveAILearnerProfile(profile: AILearnerProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("justtype_ai_profile", JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save AI profile", e);
  }
}

// Set active workout and save
export function setActiveWorkout(workout: string) {
  const profile = getAILearnerProfile();
  profile.activeWorkout = workout;
  saveAILearnerProfile(profile);
  if (typeof window !== "undefined") {
    localStorage.setItem("justtype_workout_type", workout);
  }
}

// Update profile metrics with reinforcement learning rules (EMA updates)
export function updateAILearnerProfile(session: TypingSession): AILearnerProfile {
  const profile = getAILearnerProfile();
  profile.sessionCount += 1;

  // 1. Update rolling histories (last 20)
  profile.historyWpm.push(session.wpm);
  profile.historyAccuracy.push(session.accuracy);
  if (profile.historyWpm.length > 20) {
    profile.historyWpm.shift();
    profile.historyAccuracy.shift();
  }

  // 2. Compute learning velocity
  if (profile.historyWpm.length >= 4) {
    const half = Math.floor(profile.historyWpm.length / 2);
    const recent = profile.historyWpm.slice(-half);
    const prev = profile.historyWpm.slice(0, -half);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length;
    profile.learningVelocity = parseFloat((avgRecent - avgPrev).toFixed(2));
  } else {
    profile.learningVelocity = 0;
  }

  // 3. Compute cognitive sweet spot (Avg WPM of runs where accuracy was >= 96%)
  const sessions = getSavedSessions();
  const highAccSessions = sessions.filter(s => s.accuracy >= 96);
  if (highAccSessions.length > 0) {
    const sumWpm = highAccSessions.reduce((a, b) => a + b.wpm, 0);
    profile.cognitiveSweetSpotWPM = Math.round(sumWpm / highAccSessions.length);
  } else {
    const overallAvg = sessions.reduce((sum, s) => sum + s.wpm, 0) / Math.max(1, sessions.length);
    profile.cognitiveSweetSpotWPM = Math.round(overallAvg * 0.9);
  }

  // 4. Update Mastery values on keys
  const LEFT_HAND_KEYS = new Set("qwertasyfgzxcvb12345");
  let leftLatencySum = 0, leftLatencyCount = 0;
  let rightLatencySum = 0, rightLatencyCount = 0;
  let leftErrors = 0, rightErrors = 0;
  let leftTotal = 0, rightTotal = 0;

  session.telemetry.forEach((t, index) => {
    if (t.key.length !== 1) return;
    const key = t.key.toLowerCase();
    
    // Hand mapping
    const isLeft = LEFT_HAND_KEYS.has(key);
    if (isLeft) {
      leftTotal++;
      if (!t.isCorrect) leftErrors++;
      else {
        leftLatencySum += t.latency;
        leftLatencyCount++;
      }
    } else {
      rightTotal++;
      if (!t.isCorrect) rightErrors++;
      else {
        rightLatencySum += t.latency;
        rightLatencyCount++;
      }
    }

    if (profile.keyMastery[key] === undefined) {
      profile.keyMastery[key] = 75;
    }

    const currentMastery = profile.keyMastery[key];
    let newMastery = currentMastery;

    if (t.isCorrect) {
      if (t.latency < 250) {
        // Correct & fast: reinforce muscle memory
        newMastery = currentMastery + (100 - currentMastery) * 0.08;
      } else if (t.latency > 400) {
        // Correct but slow: drop slightly
        newMastery = currentMastery - (currentMastery - 30) * 0.05;
      } else {
        // Baseline correct: minor increase
        newMastery = currentMastery + (100 - currentMastery) * 0.02;
      }
    } else {
      // Mistake: severe drop
      newMastery = currentMastery - currentMastery * 0.12;
    }
    profile.keyMastery[key] = Math.max(10, Math.min(100, Math.round(newMastery)));

    // 5. Update Bigram Mastery
    if (index > 0) {
      const prevT = session.telemetry[index - 1];
      if (prevT.key.length === 1 && /[a-zA-Z0-9]/.test(prevT.key) && /[a-zA-Z0-9]/.test(t.key)) {
        const bigram = (prevT.key + t.key).toLowerCase();
        if (profile.bigramMastery[bigram] === undefined) {
          profile.bigramMastery[bigram] = 75;
        }
        const currentBgMastery = profile.bigramMastery[bigram];
        let newBgMastery = currentBgMastery;
        if (t.isCorrect) {
          if (t.latency < 280) {
            newBgMastery = currentBgMastery + (100 - currentBgMastery) * 0.08;
          } else if (t.latency > 450) {
            newBgMastery = currentBgMastery - (currentBgMastery - 30) * 0.05;
          } else {
            newBgMastery = currentBgMastery + (100 - currentBgMastery) * 0.02;
          }
        } else {
          newBgMastery = currentBgMastery - currentBgMastery * 0.15;
        }
        profile.bigramMastery[bigram] = Math.max(10, Math.min(100, Math.round(newBgMastery)));
      }
    }
  });

  // 6. Update Hand Imbalances
  const leftAvg = leftLatencyCount > 0 ? leftLatencySum / leftLatencyCount : 180;
  const rightAvg = rightLatencyCount > 0 ? rightLatencySum / rightLatencyCount : 180;
  const leftErr = leftTotal > 0 ? leftErrors / leftTotal : 0.05;
  const rightErr = rightTotal > 0 ? rightErrors / rightTotal : 0.05;

  profile.handImbalance.leftLatency = Math.round(profile.handImbalance.leftLatency * 0.7 + leftAvg * 0.3);
  profile.handImbalance.rightLatency = Math.round(profile.handImbalance.rightLatency * 0.7 + rightAvg * 0.3);
  profile.handImbalance.leftErrorRate = parseFloat((profile.handImbalance.leftErrorRate * 0.7 + leftErr * 0.3).toFixed(4));
  profile.handImbalance.rightErrorRate = parseFloat((profile.handImbalance.rightErrorRate * 0.7 + rightErr * 0.3).toFixed(4));

  const latDiff = profile.handImbalance.leftLatency - profile.handImbalance.rightLatency;
  const errRatio = profile.handImbalance.leftErrorRate / Math.max(0.01, profile.handImbalance.rightErrorRate);

  if (latDiff > 35 || errRatio > 1.5) {
    profile.handImbalance.balanceStatus = "left_weak";
  } else if (latDiff < -35 || errRatio < 0.6) {
    profile.handImbalance.balanceStatus = "right_weak";
  } else {
    profile.handImbalance.balanceStatus = "balanced";
  }

  saveAILearnerProfile(profile);
  return profile;
}

// Helper to save sessions to localStorage
export function saveSession(session: TypingSession) {
  if (typeof window === "undefined") return;
  try {
    const sessions = getSavedSessions();
    sessions.push(session);
    // Limit history to last 100 sessions to avoid space issues
    if (sessions.length > 100) {
      sessions.shift();
    }
    localStorage.setItem("justtype_sessions", JSON.stringify(sessions));
    
    // Incrementally update learner profile
    updateAILearnerProfile(session);
  } catch (e) {
    console.error("Failed to save session to localStorage", e);
  }
}

// Helper to clear sessions
export function clearAllSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("justtype_sessions");
  localStorage.removeItem("justtype_ai_profile");
}

// 1. Identify weak keys
export function analyzeWeakKeys(sessions: TypingSession[]): WeakKeyAnalysis[] {
  if (sessions.length === 0) return [];

  const keyData: Record<string, {
    key: string;
    total: number;
    errors: number;
    latencies: number[];
  }> = {};

  // Aggregate telemetry across all sessions
  sessions.forEach(session => {
    session.telemetry.forEach(t => {
      // Ignore control characters or keys that are not single letters/symbols
      if (t.key.length !== 1) return;

      const k = t.key.toLowerCase();
      if (!keyData[k]) {
        keyData[k] = { key: k, total: 0, errors: 0, latencies: [] };
      }

      keyData[k].total += 1;
      if (!t.isCorrect) {
        keyData[k].errors += 1;
      } else {
        // Only collect latency for correct typed keys to avoid mistake noise
        keyData[k].latencies.push(t.latency);
      }
    });
  });

  const analysis: WeakKeyAnalysis[] = [];

  Object.values(keyData).forEach(data => {
    const errorRate = data.total > 0 ? data.errors / data.total : 0;
    
    // Average Latency
    const sumLatency = data.latencies.reduce((a, b) => a + b, 0);
    const avgLatency = data.latencies.length > 0 ? sumLatency / data.latencies.length : 0;

    // Standard Deviation of Latency
    let latencyStdDev = 0;
    if (data.latencies.length > 1) {
      const squareDiffs = data.latencies.map(l => {
        const diff = l - avgLatency;
        return diff * diff;
      });
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
      latencyStdDev = Math.sqrt(avgSquareDiff);
    }

    // Combined weakness score calculation (0 - 100)
    // Weighted: 60% error rate, 40% latency metric (penalizes slow keys or inconsistent latencies)
    // Scale error rate (0% = 0, 100% = 60 points)
    const errorPoints = errorRate * 60;
    // Scale latency: anything above 150ms gets scaled (up to 400ms = 40 points)
    const latencyRef = Math.max(0, avgLatency - 120);
    const latencyPoints = Math.min(40, (latencyRef / 280) * 40);
    
    const score = Math.round(errorPoints + latencyPoints);

    if (data.total >= 5) { // Only analyze if there's enough samples
      analysis.push({
        key: data.key,
        errorRate,
        avgLatency,
        latencyStdDev,
        score
      });
    }
  });

  // Sort descending by score (weakest keys first)
  return analysis.sort((a, b) => b.score - a.score);
}

// 1.1 Analyze Bigrams (Letter pairs)
export function analyzeBigrams(sessions: TypingSession[]): BigramAnalysis[] {
  if (sessions.length === 0) return [];

  const bigramData: Record<string, {
    bigram: string;
    total: number;
    errors: number;
    latencies: number[];
  }> = {};

  sessions.forEach(session => {
    for (let i = 1; i < session.telemetry.length; i++) {
      const prev = session.telemetry[i - 1];
      const curr = session.telemetry[i];

      // Only look at alphanumeric transitions
      if (prev.key.length !== 1 || curr.key.length !== 1) continue;
      if (!/[a-zA-Z0-9]/.test(prev.key) || !/[a-zA-Z0-9]/.test(curr.key)) continue;

      const bg = (prev.key + curr.key).toLowerCase();
      if (!bigramData[bg]) {
        bigramData[bg] = { bigram: bg, total: 0, errors: 0, latencies: [] };
      }

      bigramData[bg].total += 1;
      if (!curr.isCorrect) {
        bigramData[bg].errors += 1;
      } else {
        bigramData[bg].latencies.push(curr.latency);
      }
    }
  });

  const analysis: BigramAnalysis[] = [];
  Object.values(bigramData).forEach(data => {
    if (data.total < 3) return;
    const sumLatency = data.latencies.reduce((a, b) => a + b, 0);
    analysis.push({
      bigram: data.bigram,
      avgLatency: data.latencies.length > 0 ? sumLatency / data.latencies.length : 0,
      errorRate: data.errors / data.total,
      count: data.total
    });
  });

  // Sort by highest latency first
  return analysis.sort((a, b) => b.avgLatency - a.avgLatency);
}

// 1.2 Identify Mistake Patterns
export function identifyMistakePatterns(sessions: TypingSession[]): MistakePattern[] {
  const patterns: Record<string, MistakePattern> = {
    transposition: { type: "transposition", description: "Swapped adjacent letters", count: 0, examples: [] },
    double_letter: { type: "double_letter", description: "Missing or extra double letters", count: 0, examples: [] },
    substitution: { type: "substitution", description: "Replaced one letter with another", count: 0, examples: [] },
  };

  sessions.forEach(session => {
    session.telemetry.forEach((t, i) => {
      if (t.isCorrect) return;

      const next = session.telemetry[i + 1];
      // Check for transposition: typed 'ei' instead of 'ie'
      if (next && !next.isCorrect && next.typedKey === t.key && t.typedKey === next.key) {
        patterns.transposition.count++;
        if (patterns.transposition.examples.length < 3) {
          patterns.transposition.examples.push(`${t.key}${next.key} → ${t.typedKey}${next.typedKey}`);
        }
      } 
      // Check for double letter issues
      else if (t.key === session.telemetry[i - 1]?.key && t.typedKey !== t.key) {
        patterns.double_letter.count++;
        if (patterns.double_letter.examples.length < 3) {
          patterns.double_letter.examples.push(`${t.key}${t.key} → ${t.key}${t.typedKey}`);
        }
      }
      // Default to substitution
      else {
        patterns.substitution.count++;
        if (patterns.substitution.examples.length < 3) {
          patterns.substitution.examples.push(`${t.key} → ${t.typedKey}`);
        }
      }
    });
  });

  return Object.values(patterns).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
}

// 2. Calculate Focus Score
export function calculateFocusScore(session: TypingSession): number {
  const telemetry = session.telemetry.filter(t => t.isCorrect && t.key.length === 1);
  if (telemetry.length < 5) return 100;

  // WPM consistency: calculate latency variance
  const latencies = telemetry.map(t => t.latency);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  
  const squareDiffs = latencies.map(l => {
    const diff = l - avgLatency;
    return diff * diff;
  });
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(variance);

  // Pauses: latency > 1500ms
  const pauseCount = session.telemetry.filter(t => t.latency > 1500).length;

  // Base score 100.
  // Deduct based on standard deviation (high deviation = irregular rhythm = lower focus)
  // Normal stdDev is around 50ms to 150ms. Deduct 1 point for every 8ms of stdDev above 80ms.
  const deviationDeduction = Math.max(0, (stdDev - 80) / 8);
  
  // Deduct 5 points per pause
  const pauseDeduction = pauseCount * 5;

  const focusScore = Math.max(20, Math.round(100 - deviationDeduction - pauseDeduction));
  return focusScore;
}

// 3. Predict Growth Trend
export function predictGrowthTrend(sessions: TypingSession[]): GrowthPrediction {
  const n = sessions.length;
  const currentAverage = n > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / n) 
    : 0;

  if (n < 3) {
    return {
      currentAverage,
      slope: 0,
      predictedWPM10: currentAverage,
      predictedWPM30: currentAverage,
      predictedWPM60: currentAverage,
      r2: 0
    };
  }

  // Simple linear regression: y = mx + c
  // x = session index, y = wpm
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  sessions.forEach((s, i) => {
    const x = i;
    const y = s.wpm;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R2
  const yMean = sumY / n;
  let ssTot = 0; // Total sum of squares
  let ssRes = 0; // Residual sum of squares
  
  sessions.forEach((s, i) => {
    const x = i;
    const y = s.wpm;
    const f = slope * x + intercept;
    ssTot += (y - yMean) * (y - yMean);
    ssRes += (y - f) * (y - f);
  });

  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  // Predictions
  const lastIndex = n - 1;
  const predictedWPM10 = Math.round(Math.max(15, slope * (lastIndex + 10) + intercept));
  const predictedWPM30 = Math.round(Math.max(15, slope * (lastIndex + 30) + intercept));
  const predictedWPM60 = Math.round(Math.max(15, slope * (lastIndex + 60) + intercept));

  return {
    currentAverage,
    slope: parseFloat(slope.toFixed(3)),
    predictedWPM10,
    predictedWPM30,
    predictedWPM60,
    r2: parseFloat(r2.toFixed(3))
  };
}

// Generate Tutor Reports based on persistent profiles
export function getTutorReport(sessions: TypingSession[]): TutorReport {
  const profile = getAILearnerProfile();
  
  // 1. Get weakest keys (lowest mastery scores)
  const sortedKeys = Object.entries(profile.keyMastery)
    .map(([key, mastery]) => ({ key, mastery }))
    .sort((a, b) => a.mastery - b.mastery);
  const weakestKeys = sortedKeys.slice(0, 5);

  // 2. Get weakest bigrams
  const sortedBigrams = Object.entries(profile.bigramMastery)
    .map(([bigram, mastery]) => ({ bigram, mastery }))
    .sort((a, b) => a.mastery - b.mastery);
  const weakestBigrams = sortedBigrams.slice(0, 5);

  // 3. Overall average statistics
  let wpmAvg = 30;
  let accAvg = 95;
  if (sessions.length > 0) {
    wpmAvg = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
    accAvg = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  }
  
  let masteryRank = "Tactile Apprentice";
  if (wpmAvg >= 100 && accAvg >= 98) masteryRank = "Grandmaster Typist";
  else if (wpmAvg >= 80 && accAvg >= 97) masteryRank = "Master Typist";
  else if (wpmAvg >= 60 && accAvg >= 96) masteryRank = "Expert Typist";
  else if (wpmAvg >= 45 && accAvg >= 95) masteryRank = "Adept Typist";
  else if (accAvg < 90) masteryRank = "Speed Demon (Accuracy Gaps)";

  // 4. Compile tutor diagnostics
  const recs: TutorRecommendation[] = [];

  // A. Accuracy Rule
  if (accAvg < 95) {
    recs.push({
      id: "accuracy_focus",
      title: "Slow Down for Precision",
      description: `Your average accuracy is ${Math.round(accAvg)}%, which is below the target threshold of 97%. premature speed bursts cause muscle memory deterioration.`,
      actionPlan: "Slow down your pacing by 10 WPM. Focus entirely on clean, error-free typing without using backspace.",
      priority: "high",
      category: "accuracy"
    });
  }

  // B. Weak Keys Rule
  if (weakestKeys.length > 0 && weakestKeys[0].mastery < 70) {
    const keyList = weakestKeys.slice(0, 3).map(k => k.key.toUpperCase()).join(", ");
    recs.push({
      id: "weak_keys_drill",
      title: `Remediate Weak Keys: [${keyList}]`,
      description: `Your motor response is struggling with keys ${keyList} (mastery under ${weakestKeys[0].mastery}%).`,
      actionPlan: "Launch a custom 'Weak-Key Workout' from the drill panel to target these letters in real vocabulary.",
      priority: weakestKeys[0].mastery < 50 ? "high" : "medium",
      category: "weak_keys"
    });
  }

  // C. Hand Imbalance Rule
  if (profile.handImbalance.balanceStatus === "left_weak") {
    recs.push({
      id: "left_hand_workout",
      title: "Correct Left-Hand Hesitation",
      description: `Your left hand is noticeably slower (${profile.handImbalance.leftLatency}ms vs ${profile.handImbalance.rightLatency}ms right hand) or has a higher error rate.`,
      actionPlan: "Run the custom 'Left-Hand Heavy Workout' to train and calibrate finger transitions on the left side of the keyboard.",
      priority: "medium",
      category: "hand_balance"
    });
  } else if (profile.handImbalance.balanceStatus === "right_weak") {
    recs.push({
      id: "right_hand_workout",
      title: "Correct Right-Hand Hesitation",
      description: `Your right hand is slower (${profile.handImbalance.rightLatency}ms vs ${profile.handImbalance.leftLatency}ms left hand) or has a higher error rate.`,
      actionPlan: "Run the custom 'Right-Hand Heavy Workout' to train and calibrate finger transitions on the right side of the keyboard.",
      priority: "medium",
      category: "hand_balance"
    });
  }

  // D. Rhythm Consistency Rule
  let avgFocus = 85;
  if (sessions.length > 0) {
    avgFocus = sessions.reduce((sum, s) => sum + calculateFocusScore(s), 0) / sessions.length;
  }
  if (avgFocus < 80) {
    recs.push({
      id: "rhythm_steady",
      title: "Stabilize Typist Rhythm",
      description: `Your key transition consistency is irregular (Focus Score: ${Math.round(avgFocus)}%). Typing in sporadic bursts causes errors.`,
      actionPlan: "Try typing to a steady internal beat. Select the 'Steady Rhythm' workout to practice fluid, alternating-hand keystrokes.",
      priority: "low",
      category: "rhythm"
    });
  }

  // Fallback Rule
  if (recs.length === 0) {
    recs.push({
      id: "speed_booster",
      title: "Push Your Speed Boundary",
      description: "Your accuracy is excellent and your typing rhythm is highly consistent! You are ready to increase your speed ceiling.",
      actionPlan: "Select the 'Speed Booster Workout' to practice highly common, fast words and push your sustained WPM.",
      priority: "low",
      category: "speed"
    });
  }

  // Workout Suggestion Rule
  let recommendedWorkout = "all_rounder";
  if (accAvg < 94) {
    recommendedWorkout = "weak_keys";
  } else if (profile.handImbalance.balanceStatus !== "balanced") {
    recommendedWorkout = profile.handImbalance.balanceStatus === "left_weak" ? "left_hand" : "right_hand";
  } else if (weakestKeys.length > 0 && weakestKeys[0].mastery < 65) {
    recommendedWorkout = "weak_keys";
  } else if (weakestBigrams.length > 0 && weakestBigrams[0].mastery < 60) {
    recommendedWorkout = "bigrams";
  } else if (avgFocus < 82) {
    recommendedWorkout = "rhythm_steady";
  } else {
    recommendedWorkout = "speed_booster";
  }

  return {
    cognitiveSweetSpotWPM: profile.cognitiveSweetSpotWPM,
    learningVelocity: profile.learningVelocity,
    masteryRank,
    weakestKeys,
    weakestBigrams,
    handImbalanceStatus: profile.handImbalance.balanceStatus,
    criticalRecommendations: recs,
    recommendedWorkout
  };
}

// --- INTELLIGENT REMEDIATION WORD DATABASES (REAL English Words) ---

const ALTERNATING_WORDS = [
  "and", "the", "for", "with", "hand", "work", "form", "city", "lake", "make", 
  "name", "burn", "half", "plan", "kept", "turn", "span", "sign", "dial", "zone",
  "dismay", "island", "authentic", "audible", "skeptic", "proficient", "meltdown", "heights",
  "problems", "auditor", "signals", "element", "cadence", "tactile", "visual", "balance"
];

const DOUBLE_LETTER_WORDS = [
  "add", "all", "see", "too", "good", "look", "keep", "feet", "book", "tree", 
  "cool", "door", "free", "seed", "tool", "feed", "week", "meet", "deep", "peel",
  "accrue", "balloon", "success", "running", "override", "committee", "possession", "millennium",
  "suppress", "cappuccino", "narrative", "illustrate", "innovative", "coefficient", "coordinate"
];

const LEFT_HAND_WORDS = [
  "cat", "dog", "bed", "red", "car", "get", "far", "set", "sad", "fast", 
  "care", "date", "fact", "gave", "rate", "safe", "test", "west", "step", "crew",
  "stress", "dread", "carter", "database", "sweater", "streets", "desperado", "reverberate",
  "decimate", "defended", "assertive", "creative", "abstract", "batteries", "excessive"
];

const RIGHT_HAND_WORDS = [
  "you", "him", "look", "only", "its", "kill", "mill", "poly", "monk", "pink", 
  "link", "union", "onion", "plump", "pupil", "monopoly", "polyphony", "opinion", "million",
  "minim", "implore", "noil", "lollipop", "homonym", "unholy", "limply", "phylon", "nylon"
];

const RARE_LETTER_WORDS = [
  "zero", "quiz", "zone", "joke", "jump", "size", "lazy", "wave", "next",
  "exact", "fixed", "mixed", "index", "pixel", "extra", "exile", "expert", "matrix", "vertex",
  "quartz", "exquisite", "juxtapose", "frenzy", "blizzard", "hazard", "oxygen", "maximize",
  "jealous", "unzip", "jacket", "squeeze", "question", "executive", "objective", "projects"
];

const GENERAL_VOCABULARY = [
  "about", "other", "many", "then", "them", "these", "some", "would", "make", "like", 
  "into", "time", "look", "more", "write", "number", "people", "first", "water", "called",
  "find", "down", "come", "made", "part", "sound", "place", "years", "back", "give",
  "most", "very", "after", "thing", "our", "just", "name", "sentence", "man", "think",
  "say", "great", "where", "help", "through", "much", "before", "line", "right", "too",
  "mean", "old", "any", "same", "tell", "boy", "follow", "came", "want", "show",
  "around", "form", "three", "small", "set", "put", "end", "does", "another", "well",
  "large", "must", "big", "even", "such", "because", "turn", "here", "why", "ask",
  "went", "men", "read", "need", "land", "different", "home", "us", "move", "try",
  "kind", "hand", "picture", "again", "change", "off", "play", "spell", "air", "away",
  "animal", "house", "point", "page", "letter", "mother", "answer", "found", "study", "still",
  "learn", "should", "america", "world", "high", "every", "near", "add", "food", "between",
  "own", "below", "country", "plant", "last", "school", "father", "keep", "tree", "never",
  "start", "city", "earth", "eye", "light", "thought", "head", "under", "story", "saw",
  "left", "don't", "few", "while", "along", "might", "close", "something", "seem", "next",
  "hard", "open", "example", "begin", "life", "always", "those", "both", "paper", "together",
  "got", "group", "often", "run", "important", "until", "children", "side", "feet", "car",
  "mile", "night", "walk", "white", "sea", "began", "grow", "took", "river", "four",
  "carry", "state", "once", "book", "hear", "stop", "without", "second", "late", "miss",
  "idea", "enough", "eat", "face", "watch", "far", "really", "almost", "let", "above"
];

// Generate Adaptive Word Lists based on selected workout type
export function generateAdaptiveWords(
  sessionsOrWeakKeys: TypingSession[] | string[],
  count: number = 30,
  workoutType?: string
): string[] {
  let weakKeys: string[] = [];
  let weakBigrams: string[] = [];
  let leftHandWeak = false;
  let rightHandWeak = false;

  const profile = getAILearnerProfile();
  // Workout priority: passed arg -> profile activeWorkout -> fallback all_rounder
  const activeWorkout = workoutType || profile.activeWorkout || "all_rounder";

  if (Array.isArray(sessionsOrWeakKeys) && sessionsOrWeakKeys.length > 0) {
    if (typeof sessionsOrWeakKeys[0] === "string") {
      weakKeys = (sessionsOrWeakKeys as string[]).map(k => k.toLowerCase());
    } else {
      const sessions = sessionsOrWeakKeys as TypingSession[];
      
      // Load keys with lowest mastery levels in learner profile
      const sortedProfileKeys = Object.entries(profile.keyMastery)
        .map(([key, mastery]) => ({ key, score: 100 - mastery }))
        .sort((a, b) => b.score - a.score);
      
      if (sortedProfileKeys.length > 0) {
        weakKeys = sortedProfileKeys.map(k => k.key);
      } else {
        const weakKeysAnalysis = analyzeWeakKeys(sessions);
        weakKeys = weakKeysAnalysis.map(a => a.key.toLowerCase());
      }
      
      // Load slow bigram transitions
      const sortedProfileBigrams = Object.entries(profile.bigramMastery)
        .map(([bigram, mastery]) => ({ bigram, score: 100 - mastery }))
        .sort((a, b) => b.score - a.score);
      
      if (sortedProfileBigrams.length > 0) {
        weakBigrams = sortedProfileBigrams.slice(0, 8).map(b => b.bigram);
      } else {
        const bigramsAnalysis = analyzeBigrams(sessions);
        weakBigrams = bigramsAnalysis.slice(0, 8).map(b => b.bigram.toLowerCase());
      }
      
      leftHandWeak = profile.handImbalance.balanceStatus === "left_weak";
      rightHandWeak = profile.handImbalance.balanceStatus === "right_weak";
    }
  }

  // Fallback to general list if no keys loaded
  if (weakKeys.length === 0) {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * COMMON_WORDS_LIST.length);
      list.push(COMMON_WORDS_LIST[idx]);
    }
    return list;
  }

  const results: string[] = [];
  const used = new Set<string>();

  const alternatingPool = ALTERNATING_WORDS;
  const doubleLetterPool = DOUBLE_LETTER_WORDS;
  const leftHandPool = LEFT_HAND_WORDS;
  const rightHandPool = RIGHT_HAND_WORDS;
  const rareLetterPool = RARE_LETTER_WORDS;
  const speedPool = COMMON_WORDS_LIST;

  const allVocab = [
    ...COMMON_WORDS_LIST,
    ...ALTERNATING_WORDS,
    ...DOUBLE_LETTER_WORDS,
    ...LEFT_HAND_WORDS,
    ...RIGHT_HAND_WORDS,
    ...RARE_LETTER_WORDS,
    ...GENERAL_VOCABULARY
  ];
  
  const uniqueVocab = Array.from(new Set(allVocab));

  const targetKeys = weakKeys.slice(0, 5);
  const targetBigrams = weakBigrams.slice(0, 5);
  
  // Scorer to select words that practice user's weakest keys and bigrams
  const getRemediationScore = (word: string): number => {
    let score = 0;
    const w = word.toLowerCase();
    targetKeys.forEach((key, index) => {
      if (w.includes(key)) {
        score += (5 - index) * 10;
      }
    });
    targetBigrams.forEach((bg, index) => {
      if (w.includes(bg)) {
        score += (5 - index) * 25;
      }
    });
    return score;
  };

  const remediationPool = uniqueVocab
    .map(w => ({ word: w, score: getRemediationScore(w) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.word);

  const takeRandom = (pool: string[], n: number, usedSet: Set<string>) => {
    const list: string[] = [];
    const available = pool.filter(w => !usedSet.has(w));
    const source = available.length > 0 ? available : pool;
    
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(n, shuffled.length); i++) {
      list.push(shuffled[i]);
      usedSet.add(shuffled[i]);
    }
    return list;
  };

  // Build list matching active workout
  if (activeWorkout === "weak_keys") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(remediationPool.length > 0 ? remediationPool : uniqueVocab, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "bigrams") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    const bigramRemediationPool = uniqueVocab
      .map(w => {
        let sc = 0;
        const wl = w.toLowerCase();
        targetBigrams.forEach((bg, index) => {
          if (wl.includes(bg)) sc += (5 - index) * 30;
        });
        return { word: w, score: sc };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.word);

    results.push(...takeRandom(bigramRemediationPool.length > 0 ? bigramRemediationPool : uniqueVocab, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "left_hand") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(leftHandPool, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "right_hand") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(rightHandPool, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "double_letters") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(doubleLetterPool, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "rhythm_steady") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(alternatingPool, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else if (activeWorkout === "speed_booster") {
    const nDrill = Math.max(1, Math.round(count * 0.8));
    results.push(...takeRandom(speedPool, nDrill, used));
    results.push(...takeRandom(uniqueVocab, count - results.length, used));
  } 
  else {
    // default balanced 'all_rounder' workout recipe
    const nRemediation = Math.max(1, Math.round(count * 0.40));
    results.push(...takeRandom(remediationPool.length > 0 ? remediationPool : uniqueVocab, nRemediation, used));

    const nAlternating = Math.max(1, Math.round(count * 0.20));
    results.push(...takeRandom(alternatingPool, nAlternating, used));

    const nDouble = Math.max(1, Math.round(count * 0.20));
    results.push(...takeRandom(doubleLetterPool, nDouble, used));

    const nHand = Math.max(1, Math.round(count * 0.10));
    if (leftHandWeak) {
      results.push(...takeRandom(leftHandPool, nHand, used));
    } else if (rightHandWeak) {
      results.push(...takeRandom(rightHandPool, nHand, used));
    } else {
      results.push(...takeRandom(uniqueVocab, nHand, used));
    }

    const nRare = Math.max(1, Math.round(count * 0.10));
    results.push(...takeRandom(rareLetterPool, nRare, used));
  }

  // Remainder padding
  while (results.length < count) {
    const extra = takeRandom(uniqueVocab, 1, used);
    if (extra.length === 0) break;
    results.push(extra[0]);
  }

  // Shuffle output words to keep typing fresh
  return results.slice(0, count).sort(() => Math.random() - 0.5);
}
