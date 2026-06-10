"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { playKeySound } from "@/utils/audio";
import { saveSession, TypingSession, KeyTelemetry, calculateFocusScore, generateAdaptiveWords, getSavedSessions, analyzeWeakKeys } from "@/utils/aiEngine";

const DEFAULT_WORDS = [
  "about", "above", "across", "action", "activity", "actor", "add", "address", "admit", "adopt",
  "advice", "affect", "after", "again", "against", "age", "agency", "agent", "agree", "agreement",
  "ahead", "air", "all", "allow", "almost", "alone", "along", "already", "also", "although",
  "always", "american", "among", "amount", "analysis", "analyst", "analyze", "ancient", "and", "animal",
  "another", "answer", "anxiety", "any", "anybody", "anyone", "anything", "anyway", "anywhere", "apart",
  "apartment", "apparent", "appeal", "appear", "appearance", "apply", "approach", "appropriate", "area", "argue",
  "argument", "arise", "arm", "army", "around", "arrive", "art", "article", "artist", "as",
  "ask", "aspect", "assault", "assert", "assess", "assessment", "asset", "assign", "assignment", "assist",
  "assistance", "assistant", "associate", "association", "assume", "assumption", "assure", "at", "athlete", "athletic",
  "atmosphere", "attach", "attack", "attempt", "attend", "attendance", "attention", "attitude", "attorney", "attract",
  "attractive", "attribute", "audience", "author", "authority", "auto", "available", "average", "avoid", "award",
  "aware", "awareness", "away", "baby", "back", "background", "bad", "badly", "bag", "bake",
  "balance", "ball", "ban", "band", "bank", "bar", "barely", "barrel", "barrier", "base",
  "baseball", "basic", "basically", "basis", "basket", "basketball", "cat", "dog", "computer", "program",
  "code", "design", "interface", "developer", "learning", "engine", "analytics", "focus", "speed", "accuracy"
];

const PRESET_QUOTES = [
  "Simplicity is the ultimate sophistication. Leonardo da Vinci on design and elegance.",
  "Move fast and break things. Unless you are breaking things, you are not moving fast enough.",
  "First, solve the problem. Then, write the code. John Johnson on programming discipline.",
  "Talk is cheap. Show me the code. Linus Torvalds, the creator of Linux.",
  "Design is not just what it looks like and feels like. Design is how it works. Steve Jobs.",
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
  "Premature optimization is the root of all evil in programming. Donald Knuth.",
  "Make it simple, but significant. Don Draper on clarity and impact."
];

export type TestMode = "time" | "words" | "quote" | "custom";
export type CaretType = "block" | "smooth" | "underline" | "hidden";

export function useTypingTest() {
  const [mode, setMode] = useState<TestMode>("time");
  const [limit, setLimit] = useState<number>(30); // 30s or 25 words by default
  const [soundType, setSoundType] = useState<"mechanical" | "click" | "bubble" | "silent">("click");
  const [caretType, setCaretType] = useState<CaretType>("smooth");
  
  const [words, setWords] = useState<string[]>([]);
  const [typedInput, setTypedInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "typing" | "completed">("idle");
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
      const savedSound = localStorage.getItem("justtype_config_sound") as any;
      const savedCaret = localStorage.getItem("justtype_config_caret") as CaretType;

      if (savedMode) setMode(savedMode);
      if (savedLimit) setLimit(parseInt(savedLimit));
      if (savedSound) setSoundType(savedSound);
      if (savedCaret) setCaretType(savedCaret);
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

  const updateSoundType = (newSound: "mechanical" | "click" | "bubble" | "silent") => {
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

  // Generate words based on mode
  const generateWordsList = useCallback(() => {
    if (mode === "quote") {
      const quote = PRESET_QUOTES[Math.floor(Math.random() * PRESET_QUOTES.length)];
      return quote.split(" ");
    }
    
    if (mode === "custom") {
      // AI Coach generated words targeting weak keys
      const sessions = getSavedSessions();
      const weakKeysAnalysis = analyzeWeakKeys(sessions);
      const weakKeys = weakKeysAnalysis.map(a => a.key);
      return generateAdaptiveWords(weakKeys, 25);
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
    restartTest();
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
      telemetry: telemetryRef.current
    };
    
    saveSession(session);
  }, [words, mode]);

  // Handle typing key presses
  const registerKeystroke = useCallback((char: string) => {
    if (status === "completed") return;
    
    const targetText = words.join(" ");
    const now = Date.now();
    
    // Play synthesizer audio feedback click
    playKeySound(soundType);

    // Initial state trigger
    if (status === "idle") {
      setStatus("typing");
      startTimeRef.current = now;
      lastKeyTimeRef.current = now;
      
      if (mode === "time") {
        setTimeLeft(limit);
        
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            const nextTime = prev - 1;
            setElapsedTime((el) => {
              const nextEl = el + 1;
              
              // Calculate dynamic middle WPM to draw real-time chart history
              setWpm((currentWpm) => {
                // Compute current correct character count
                // Get typed input at this instant (using useRef/state is tricky, we read it from state)
                return currentWpm; // Handled in state effect below
              });
              
              if (nextTime <= 0) {
                // Complete test
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
        }, 1000);
      } else {
        // Words, Quote or Custom modes: Count-up timer
        timerIntervalRef.current = setInterval(() => {
          setElapsedTime((el) => el + 1);
        }, 1000);
      }
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
    if (char.length !== 1) return; // Prevent modifiers (Shift, Control, etc.)

    setTypedInput((prev) => {
      const nextInput = prev + char;
      const targetChar = targetText[prev.length] || "";
      const isCorrect = char === targetChar;

      // Telemetry mapping
      const latency = lastKeyTimeRef.current > 0 ? (now - lastKeyTimeRef.current) : 0;
      
      const keystrokeTelemetry: KeyTelemetry = {
        key: targetChar,
        typedKey: char,
        timestamp: now,
        latency,
        isCorrect
      };
      
      telemetryRef.current.push(keystrokeTelemetry);
      lastKeyTimeRef.current = now;

      if (!isCorrect) {
        setRawMistakes((m) => m + 1);
      }

      // Check if words/quote test completes (user typed all text)
      if (mode !== "time" && nextInput.length >= targetText.length) {
        // Run on next tick
        setTimeout(() => {
          setElapsedTime((el) => {
            completeTest(nextInput, el);
            return el;
          });
        }, 0);
      }

      return nextInput;
    });
  }, [status, words, mode, limit, soundType, completeTest]);

  // Periodic calculator for live graph history (every second)
  useEffect(() => {
    if (status !== "typing" || elapsedTime <= 0) return;
    
    const targetText = words.join(" ");
    let correctCount = 0;
    for (let i = 0; i < typedInput.length; i++) {
      if (typedInput[i] === targetText[i]) correctCount++;
    }
    
    const minutes = elapsedTime / 60;
    const currentWpm = Math.round((correctCount / 5) / minutes);
    const currentAccuracy = typedInput.length > 0 
      ? Math.round((correctCount / typedInput.length) * 100) 
      : 100;
      
    setWpm(currentWpm);
    setAccuracy(currentAccuracy);
    
    // Add data point to history chart data
    setHistory((prev) => [...prev, { time: elapsedTime, wpm: currentWpm, accuracy: currentAccuracy }]);
  }, [elapsedTime, typedInput, words, status]);

  return {
    mode,
    limit,
    soundType,
    caretType,
    words,
    typedInput,
    status,
    timeLeft,
    elapsedTime,
    rawMistakes,
    wpm,
    accuracy,
    history,
    telemetry: telemetryRef.current,
    
    // Setters / Actions
    setMode: updateMode,
    setLimit: updateLimit,
    setSoundType: updateSoundType,
    setCaretType: updateCaretType,
    restartTest,
    registerKeystroke
  };
}
