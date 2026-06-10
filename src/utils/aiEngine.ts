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
  } catch (e) {
    console.error("Failed to save session to localStorage", e);
  }
}

// Helper to clear sessions
export function clearAllSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("justtype_sessions");
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
  // Predict for Session (n-1) + k
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

// 4. Generate Adaptive Word Lists
export function generateAdaptiveWords(weakKeys: string[], count: number = 30): string[] {
  // If there are no weak keys, return a selection of common english words
  if (weakKeys.length === 0) {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * COMMON_WORDS_LIST.length);
      list.push(COMMON_WORDS_LIST[idx]);
    }
    return list;
  }

  // Top 3 weakest keys
  const targetKeys = weakKeys.slice(0, 3).map(k => k.toLowerCase());
  
  // Find words in common words that contain the weak keys
  const matchingCommon = COMMON_WORDS_LIST.filter(word => 
    targetKeys.some(k => word.toLowerCase().includes(k))
  );

  const results: string[] = [];

  // Syllable/n-gram builder targeting transitions
  // e.g. for weak keys 'k' and 'e', build tokens like 'ke', 'ek', 'ack', 'oke'
  const prefixes = ["th", "re", "in", "he", "an", "ar", "co", "de", "le", "ti"];
  const suffixes = ["nd", "er", "on", "at", "es", "ed", "te", "st", "nt", "al"];
  const middleVowels = ["a", "e", "i", "o", "u", "ou", "ee", "ai", "ea"];

  while (results.length < count) {
    // 40% chance of selecting a matching common word
    if (matchingCommon.length > 0 && Math.random() < 0.4) {
      const w = matchingCommon[Math.floor(Math.random() * matchingCommon.length)];
      results.push(w);
    } else {
      // 60% chance of generating a synthetic phonetic word containing the key
      const key = targetKeys[Math.floor(Math.random() * targetKeys.length)];
      const structureType = Math.floor(Math.random() * 3);

      let word = "";
      if (structureType === 0) {
        // prefix + key + suffix
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        word = p + key + s;
      } else if (structureType === 1) {
        // key + middleVowel + suffix
        const m = middleVowels[Math.floor(Math.random() * middleVowels.length)];
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        word = key + m + s;
      } else {
        // prefix + middleVowel + key
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const m = middleVowels[Math.floor(Math.random() * middleVowels.length)];
        word = p + m + key;
      }

      // Cleanup consecutive identical letters if more than 2, or weird formatting
      word = word.replace(/(.)\1{2,}/g, "$1$1");
      
      if (word.length >= 3 && word.length <= 8) {
        results.push(word);
      }
    }
  }

  return results;
}
