"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SoundType } from "@/utils/audio";
import { saveSession, TypingSession, KeyTelemetry, generateAdaptiveWords, getSavedSessions } from "@/utils/aiEngine";

const DEFAULT_WORDS = [
  // --- EASY WORDS (2-4 letters, highly common, fast alternating keystrokes) ---
  "the", "and", "of", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be",
  "this", "have", "from", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "use",
  "an", "each", "she", "do", "how", "if", "will", "up", "out", "many", "then", "them", "so", "some", "her", "make", "like", "him", "into",
  "time", "has", "look", "two", "more", "go", "see", "no", "way", "my", "than", "call", "who", "oil", "its", "now", "find", "long",
  "down", "day", "did", "get", "come", "made", "may", "part", "new", "take", "get", "place", "made", "live", "back", "give", "most", "very",
  "after", "thing", "our", "just", "name", "good", "sent", "help", "line", "turn", "cause", "much", "mean", "same", "look", "only", "here",

  // --- MEDIUM WORDS (5-7 letters, common vocabulary, finger transitions) ---
  "about", "above", "across", "action", "actor", "admit", "adopt", "advice", "affect", "agency", "agent", "agree", "ahead", "allow",
  "almost", "alone", "along", "animal", "answer", "anxiety", "anyway", "apart", "appeal", "appear", "apply", "argue", "arise", "around",
  "arrive", "artist", "aspect", "assert", "assess", "assets", "assign", "assist", "assume", "assure", "athlete", "attach", "attack",
  "attend", "author", "better", "faster", "typing", "science", "measure", "latency", "rhythm", "cadence", "neural", "engine", "growth",
  "privacy", "sprint", "consult", "tactile", "memory", "mistake", "remedy", "routine", "program", "develop", "complex", "elegant",
  "minimal", "builder", "layout", "control", "command", "trigger", "resolve", "warning", "optimal", "systems", "digital", "product",
  "network", "service", "dynamic", "latency", "balance", "perfect", "profile", "numbers", "context", "history", "support", "process",

  // --- HARD WORDS (8+ letters, complex hand movement, rare letters [q,z,x,j], double letters) ---
  "mechanical", "optimization", "synchronous", "asynchronous", "configuration", "biometric", "encapsulation", "polymorphism",
  "telemetry", "analytical", "regression", "coefficients", "forecaster", "consistency", "performance", "hesitation", "calibration",
  "fingerprint", "sophistication", "discipline", "premature", "compatibility", "permissions", "vulnerability", "cryptography",
  "consequences", "transposition", "remediation", "metronome", "fluctuation", "acceleration", "inefficient", "juxtaposition",
  "extraordinary", "unprecedented", "revolutionary", "implementation", "unpredictable", "questionnaire", "xenophobia", "equilibrium",
  "characteristic", "acknowledgement", "infrastructure", "representative", "procrastinate", "misunderstanding", "satisfactorily"
];

const PRESET_QUOTES = [
  // --- EASY / SHORT QUOTES (Common punctuation, steady cadence) ---
  "Simplicity is the ultimate sophistication.",
  "Make it simple, but significant.",
  "If you cannot do great things, do small things in a great way.",
  "Knowledge is power. Information is liberating. Education is the premise of progress.",
  "Choose a job you love, and you will never have to work a day in your life.",

  // --- MEDIUM QUOTES (Standard punctuation, syntax, capital letters) ---
  "Design is not just what it looks like and feels like. Design is how it works. Steve Jobs.",
  "Move fast and break things. Unless you are breaking things, you are not moving fast enough.",
  "First, solve the problem. Then, write the code. John Johnson on programming discipline.",
  "Talk is cheap. Show me the code. Linus Torvalds, the creator of Linux.",
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
  "Premature optimization is the root of all evil in programming. Donald Knuth.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Winston Churchill.",

  // --- HARD / COMPLEX QUOTES (Pangrams, rare characters, symbols, numbers) ---
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
  "JavaScript's asynchronous event-loop: callbacks, promises, and async/await syntax!",
  "To juxtapose high-fidelity telemetry profiles, run: WPM >= 120 && ErrorRate <= 0.02.",
  "Programs must be written for people to read, and only incidentally for machines to execute.",
  "Cryptographic SHA-256 protocols encrypt bit-stream handshakes (AES-256-GCM verification).",
  "Do, or do not. There is no try. Yoda's famous advice on focus and determination.",
  "Can you type 100% correctly? Try: 123 + 456 = 579, WPM (words per minute), and W&M!"
];

export type TestMode = "time" | "words" | "quote" | "custom";
export type CaretType = "block" | "smooth" | "underline" | "hidden";
export type KeyboardLayoutType = "qwerty" | "dvorak" | "colemak";

export function useTypingTest() {
  const [mode, setMode] = useState<TestMode>("time");
  const [limit, setLimit] = useState<number>(30); // 30s or 25 words by default
  const [soundType, setSoundType] = useState<SoundType>("natural");
  const [caretType, setCaretType] = useState<CaretType>("smooth");
  const [layout, setLayout] = useState<KeyboardLayoutType>("qwerty");
  
  const [words, setWords] = useState<string[]>([]);
  const [typedInput, setTypedInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "typing" | "paused" | "completed">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [rawMistakes, setRawMistakes] = useState<number>(0);
  
  // Stats tracking
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [history, setHistory] = useState<{ time: number; wpm: number; accuracy: number }[]>([]);
  
  const telemetryRef = useRef<KeyTelemetry[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("justtype_config_mode") as TestMode;
      const savedLimit = localStorage.getItem("justtype_config_limit");
      const savedSound = localStorage.getItem("justtype_config_sound") as SoundType;
      const savedCaret = localStorage.getItem("justtype_config_caret") as CaretType;
      const savedLayout = localStorage.getItem("justtype_config_layout") as KeyboardLayoutType;

      Promise.resolve().then(() => {
        if (savedMode) setMode(savedMode);
        if (savedLimit) setLimit(parseInt(savedLimit));
        if (savedSound) setSoundType(savedSound);
        if (savedCaret) setCaretType(savedCaret);
        if (savedLayout) setLayout(savedLayout);
      });
    }
  }, []);

  // Sync config changes to localStorage
  const updateMode = (newMode: TestMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_mode", newMode);
    }
  };

  const updateLimit = (newLimit: number) => {
    setLimit(newLimit);
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_limit", newLimit.toString());
    }
  };

  const updateSoundType = (newSound: SoundType) => {
    setSoundType(newSound);
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_sound", newSound);
    }
  };

  const updateCaretType = (newCaret: CaretType) => {
    setCaretType(newCaret);
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_caret", newCaret);
    }
  };

  const updateLayout = (newLayout: KeyboardLayoutType) => {
    setLayout(newLayout);
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_layout", newLayout);
    }
  };

  // Generate words based on mode
  const generateWordsList = useCallback(() => {
    if (mode === "quote") {
      const quote = PRESET_QUOTES[Math.floor(Math.random() * PRESET_QUOTES.length)];
      return quote.split(" ");
    }
    
    if (mode === "custom") {
      // AI Coach generated words targeting weak keys and bigram transitions
      const sessions = getSavedSessions();
      return generateAdaptiveWords(sessions, 25);
    }

    // Default 'time' or 'words' mode
    const count = mode === "words" ? limit : 60; // Generate plenty of words for time mode
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * DEFAULT_WORDS.length);
      list.push(DEFAULT_WORDS[idx]);
    }
    return list;
  }, [mode, limit]);

  // Restart Test
  const restartTest = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    const newWords = generateWordsList();
    setWords(newWords);
    setTypedInput("");
    setStatus("idle");
    setRawMistakes(0);
    setWpm(0);
    setAccuracy(100);
    setHistory([]);
    telemetryRef.current = [];
    lastKeyTimeRef.current = 0;
    
    if (mode === "time") {
      setTimeLeft(limit);
      setElapsedTime(0);
    } else {
      setTimeLeft(0);
      setElapsedTime(0);
    }
  }, [mode, limit, generateWordsList]);

  // Load initial words
  useEffect(() => {
    Promise.resolve().then(() => {
      restartTest();
    });
  }, [mode, limit, restartTest]);

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // End test and save session
  const completeTest = useCallback((finalInput: string, finalElapsedTime: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setStatus("completed");
    
    // Final metric calculations
    const timeInMinutes = finalElapsedTime > 0 ? (finalElapsedTime / 60) : 0.01;
    
    const targetText = words.join(" ");
    let correctCharsCount = 0;
    for (let i = 0; i < finalInput.length; i++) {
      if (finalInput[i] === targetText[i]) {
        correctCharsCount++;
      }
    }
    
    const finalWpm = Math.round((correctCharsCount / 5) / timeInMinutes);
    const finalAccuracy = finalInput.length > 0 
      ? Math.round((correctCharsCount / finalInput.length) * 100) 
      : 100;
      
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    // Save typing session
    const session: TypingSession = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      wpm: finalWpm,
      accuracy: finalAccuracy,
      duration: finalElapsedTime,
      mode: mode,
      telemetry: telemetryRef.current,
      layout: layout
    };
    
    saveSession(session);
  }, [words, mode, layout]);

  const startTimerInterval = useCallback((initialStartTime?: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    if (initialStartTime) {
      startTimeRef.current = initialStartTime;
    }

    timerIntervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      // Pause if inactive for 3 seconds (3000ms)
      if (currentTime - lastKeyTimeRef.current >= 3000) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setStatus("paused");
        return;
      }

      if (mode === "time") {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          setElapsedTime((el) => {
            const nextEl = el + 1;
            if (nextTime <= 0) {
              setTypedInput((input) => {
                completeTest(input, nextEl);
                return input;
              });
              return nextEl;
            }
            return nextEl;
          });
          return nextTime;
        });
      } else {
        setElapsedTime((el) => el + 1);
      }
    }, 1000);
  }, [mode, completeTest]);

  const pauseTest = useCallback(() => {
    if (status !== "typing") return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setStatus("paused");
  }, [status]);

  const resumeTest = useCallback(() => {
    if (status !== "paused") return;
    setStatus("typing");
    const now = Date.now();
    lastKeyTimeRef.current = now;
    startTimerInterval();
  }, [status, startTimerInterval]);

  // Handle typing key presses
  const registerKeystroke = useCallback((char: string) => {
    if (status === "completed") return;
    
    const targetText = words.join(" ");
    const now = Date.now();
    
    // Initial state trigger or resume
    if (status === "idle") {
      setStatus("typing");
      startTimeRef.current = now;
      lastKeyTimeRef.current = now;
      if (mode === "time") {
        setTimeLeft(limit);
      }
      startTimerInterval(now);
    } else if (status === "paused") {
      setStatus("typing");
      lastKeyTimeRef.current = now;
      startTimerInterval();
    }

    // Backspace logic
    if (char === "Backspace") {
      setTypedInput((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(0, -1);
      });
      lastKeyTimeRef.current = now;
      return;
    }

    // Normal typing entry
    if (char.length !== 1) return;

    setTypedInput((prev) => {
      const nextInput = prev + char;
      const targetChar = targetText[prev.length] || "";
      const isCorrect = char === targetChar;

      const latency = lastKeyTimeRef.current > 0 ? (now - lastKeyTimeRef.current) : 0;
      telemetryRef.current.push({ key: targetChar, typedKey: char, timestamp: now, latency, isCorrect });
      lastKeyTimeRef.current = now;

      if (!isCorrect) setRawMistakes((m) => m + 1);

      if (mode !== "time" && nextInput.length >= targetText.length) {
        setTimeout(() => {
          setElapsedTime((el) => {
            completeTest(nextInput, el);
            return el;
          });
        }, 0);
      }

      return nextInput;
    });
  }, [status, words, mode, limit, completeTest, startTimerInterval]);

  // Periodic calculator for live graph history (every second)
  useEffect(() => {
    if (status !== "typing" || elapsedTime <= 0) return;
    const targetText = words.join(" ");
    let correctCount = 0;
    for (let i = 0; i < typedInput.length; i++) {
      if (typedInput[i] === targetText[i]) correctCount++;
    }
    const currentWpm = Math.round((correctCount / 5) / (elapsedTime / 60 || 0.01));
    const currentAccuracy = typedInput.length > 0 ? Math.round((correctCount / typedInput.length) * 100) : 100;
    
    Promise.resolve().then(() => {
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
      setHistory((prev) => [...prev, { time: elapsedTime, wpm: currentWpm, accuracy: currentAccuracy }]);
    });
  }, [elapsedTime, typedInput, words, status]);

  return {
    mode, limit, soundType, caretType, layout, words, typedInput, status, timeLeft, elapsedTime, rawMistakes, wpm, accuracy, history,
    getTelemetry: () => telemetryRef.current,
    setMode: updateMode, setLimit: updateLimit, setSoundType: updateSoundType, setCaretType: updateCaretType, setLayout: updateLayout, restartTest, registerKeystroke,
    pauseTest, resumeTest
  };
}
