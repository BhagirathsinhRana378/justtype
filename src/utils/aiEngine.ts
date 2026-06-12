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

// 4. Generate Adaptive Word Lists (Dynamic, self-learning transition workouts)
export function generateAdaptiveWords(
  sessionsOrWeakKeys: TypingSession[] | string[],
  count: number = 30
): string[] {
  let weakKeys: string[] = [];
  let weakBigrams: string[] = [];
  let leftHandWeak = false;
  let rightHandWeak = false;

  if (Array.isArray(sessionsOrWeakKeys) && sessionsOrWeakKeys.length > 0) {
    if (typeof sessionsOrWeakKeys[0] === "string") {
      weakKeys = (sessionsOrWeakKeys as string[]).map(k => k.toLowerCase());
    } else {
      const sessions = sessionsOrWeakKeys as TypingSession[];
      // 1. Analyze weak keys
      const weakKeysAnalysis = analyzeWeakKeys(sessions);
      weakKeys = weakKeysAnalysis.map(a => a.key.toLowerCase());
      
      // 2. Analyze weak bigram transitions
      const bigramsAnalysis = analyzeBigrams(sessions);
      weakBigrams = bigramsAnalysis.slice(0, 5).map(b => b.bigram.toLowerCase());
      
      // 3. Analyze hand bias latency and error patterns
      let leftLatencySum = 0, leftLatencyCount = 0;
      let rightLatencySum = 0, rightLatencyCount = 0;
      let leftErrors = 0, rightErrors = 0;
      let leftTotal = 0, rightTotal = 0;
      
      const LEFT_HAND_KEYS = new Set("qwertasyfgzxcvb12345");
      
      sessions.forEach(s => {
        s.telemetry.forEach(t => {
          if (t.key.length !== 1) return;
          const k = t.key.toLowerCase();
          const isLeft = LEFT_HAND_KEYS.has(k);
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
        });
      });
      
      const leftAvg = leftLatencyCount > 0 ? leftLatencySum / leftLatencyCount : 150;
      const rightAvg = rightLatencyCount > 0 ? rightLatencySum / rightLatencyCount : 150;
      const leftErrRate = leftTotal > 0 ? leftErrors / leftTotal : 0;
      const rightErrRate = rightTotal > 0 ? rightErrors / rightTotal : 0;
      
      // If one hand is 15% slower or has 50% more error rate, flag it as weak to trigger focal workouts
      if (leftAvg > rightAvg * 1.15 || leftErrRate > rightErrRate * 1.5) {
        leftHandWeak = true;
      } else if (rightAvg > leftAvg * 1.15 || rightErrRate > leftErrRate * 1.5) {
        rightHandWeak = true;
      }
    }
  }

  // Fallback to general words if no profile data exists
  if (weakKeys.length === 0) {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * COMMON_WORDS_LIST.length);
      list.push(COMMON_WORDS_LIST[idx]);
    }
    return list;
  }

  const results: string[] = [];
  
  // Custom Adaptive Recipe:
  // 1. Weak keys and bigrams remediation (40%)
  // 2. Alternating flow words (20%)
  // 3. Double-letter drills (20%)
  // 4. Weak hand training (10%)
  // 5. Rare letter drills (10%)
  
  const targetKeys = weakKeys.slice(0, 3);
  const targetBigrams = weakBigrams.slice(0, 3);
  
  // Score helper to match words against user's specific weak targets
  const getRemediationScore = (word: string): number => {
    let score = 0;
    const w = word.toLowerCase();
    targetKeys.forEach((key, index) => {
      if (w.includes(key)) {
        score += (3 - index) * 10;
      }
    });
    targetBigrams.forEach((bg, index) => {
      if (w.includes(bg)) {
        score += (3 - index) * 25;
      }
    });
    return score;
  };

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
  
  const alternatingPool = ALTERNATING_WORDS;
  const doubleLetterPool = DOUBLE_LETTER_WORDS;
  const leftHandPool = LEFT_HAND_WORDS;
  const rightHandPool = RIGHT_HAND_WORDS;
  const rareLetterPool = RARE_LETTER_WORDS;
  
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

  const used = new Set<string>();

  // 1. Weak keys and bigrams remediation (40%)
  const nRemediation = Math.max(1, Math.round(count * 0.40));
  results.push(...takeRandom(remediationPool.length > 0 ? remediationPool : uniqueVocab, nRemediation, used));

  // 2. Alternating flow words (20%)
  const nAlternating = Math.max(1, Math.round(count * 0.20));
  results.push(...takeRandom(alternatingPool, nAlternating, used));

  // 3. Double-letter drills (20%)
  const nDouble = Math.max(1, Math.round(count * 0.20));
  results.push(...takeRandom(doubleLetterPool, nDouble, used));

  // 4. Hand imbalance training (10%)
  const nHand = Math.max(1, Math.round(count * 0.10));
  if (leftHandWeak) {
    results.push(...takeRandom(leftHandPool, nHand, used));
  } else if (rightHandWeak) {
    results.push(...takeRandom(rightHandPool, nHand, used));
  } else {
    results.push(...takeRandom(uniqueVocab, nHand, used));
  }

  // 5. Rare letter drills (10%)
  const nRare = Math.max(1, Math.round(count * 0.10));
  results.push(...takeRandom(rareLetterPool, nRare, used));

  // Remainder padding
  while (results.length < count) {
    const extra = takeRandom(uniqueVocab, 1, used);
    if (extra.length === 0) break;
    results.push(extra[0]);
  }

  // Final shuffle of generated list to prevent repetitive patterns
  return results.slice(0, count).sort(() => Math.random() - 0.5);
}
