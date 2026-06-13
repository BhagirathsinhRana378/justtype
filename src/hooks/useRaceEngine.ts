"use client";

import { useCallback, useState, useMemo, useRef } from "react";

export function useRaceEngine(words: string[], options?: { strict?: boolean }) {
  const [completedWordsHistory, setCompletedWordsHistory] = useState<string[]>([]);
  const [currentWordInput, setCurrentWordInput] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const [wpm, setWpm] = useState(0);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<"none" | "correct" | "error" | "blocked">("none");

  const lastKeystrokeTimeRef = useRef(0);

  const accuracy = useMemo(() => {
    if (totalKeystrokes > 0) {
      return Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100));
    }
    return 100;
  }, [correctKeystrokes, totalKeystrokes]);

  const typedInput = useMemo(() => {
    if (completedWordsHistory.length === 0) return currentWordInput;
    return completedWordsHistory.join(" ") + (currentWordIndex < words.length ? " " + currentWordInput : "");
  }, [completedWordsHistory, currentWordInput, currentWordIndex, words.length]);

  const reset = useCallback(() => {
    setCompletedWordsHistory([]);
    setCurrentWordInput("");
    setCurrentWordIndex(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setStartTime(0);
    setWpm(0);
    setProgress(0);
    setFeedback("none");
    lastKeystrokeTimeRef.current = 0;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInput = useCallback((val: string, nativeEvent?: any) => {
    // 1. INPUT SECURITY Checks
    if (nativeEvent) {
      // Reject synthetic events (bot protection)
      if (nativeEvent.isTrusted === false) {
        setFeedback("blocked");
        return { wpm, accuracy, progress, isError: true, totalKeystrokes };
      }

      // Reject paste events
      if (nativeEvent.inputType === "insertFromPaste") {
        setFeedback("blocked");
        return { wpm, accuracy, progress, isError: true, totalKeystrokes };
      }
    }

    if (!startTime) setStartTime(Date.now());

    const totalWordsCount = words.length;
    const activeIdx = completedWordsHistory.length;

    if (activeIdx >= totalWordsCount) {
      return { wpm, accuracy, progress: 1, isError: false, totalKeystrokes };
    }

    const targetWord = words[activeIdx];
    const expectedPrefix = completedWordsHistory.length > 0 
      ? completedWordsHistory.join(" ") + " " 
      : "";

    // Lock past words: must start with the validated history prefix
    if (!val.startsWith(expectedPrefix)) {
      return { wpm, accuracy, progress, isError: true, totalKeystrokes };
    }

    const activePart = val.substring(expectedPrefix.length);

    // Keystroke counting for accuracy (only increment on typing additions)
    const prevFullLength = completedWordsHistory.join(" ").length + (completedWordsHistory.length > 0 ? 1 : 0) + currentWordInput.length;
    const isAddition = val.length > prevFullLength;

    // Timing check for additions (prevent synthetic spam)
    if (nativeEvent && isAddition) {
      const now = Date.now();
      if (lastKeystrokeTimeRef.current > 0 && now - lastKeystrokeTimeRef.current < 5) {
        return { wpm, accuracy, progress, isError: true, totalKeystrokes };
      }
      lastKeystrokeTimeRef.current = now;
    } else if (nativeEvent) {
      // Still update last keystroke time for deletions to keep timing track correct
      lastKeystrokeTimeRef.current = Date.now();
    }

    let nextKeystrokes = totalKeystrokes;
    if (isAddition) {
      const diff = val.length - prevFullLength;
      nextKeystrokes = totalKeystrokes + diff;
      setTotalKeystrokes(nextKeystrokes);
    }

    if (activePart.includes(" ")) {
      // Space submission attempt
      const parts = activePart.split(" ");
      const wordAttempt = parts[0];

      if (wordAttempt === "") {
        // Ignore repeating or leading spaces
        return { wpm, accuracy, progress, isError: true, totalKeystrokes };
      }

      if (options?.strict) {
        if (wordAttempt !== targetWord) {
          setFeedback("blocked");
          return { wpm, accuracy, progress, isError: true, totalKeystrokes };
        }
      }

      // Add the word to history (whether correct or not)
      const newHistory = [...completedWordsHistory, wordAttempt];
      setCompletedWordsHistory(newHistory);
      setCurrentWordIndex(activeIdx + 1);
      setCurrentWordInput("");

      const isWordCorrect = wordAttempt === targetWord;
      setFeedback(isWordCorrect ? "correct" : "error");
      if (isWordCorrect) {
        // Clear correct pulse after a brief delay
        setTimeout(() => setFeedback("none"), 350);
      }

      // Calculate new correct keystrokes
      const correctCh = newHistory.reduce((acc, w, i) => {
        return w === words[i] ? acc + words[i].length + 1 : acc;
      }, 0);
      setCorrectKeystrokes(correctCh);

      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const newWpm = Math.round((correctCh / 5) / Math.max(elapsed, 0.01));
      setWpm(newWpm);

      const newProgress = totalWordsCount > 0 ? (activeIdx + 1) / totalWordsCount : 0;
      setProgress(newProgress);

      const nextAccuracy = nextKeystrokes > 0
        ? Math.min(100, Math.round((correctCh / nextKeystrokes) * 100))
        : 100;

      return { wpm: newWpm, accuracy: nextAccuracy, progress: newProgress, isError: false, totalKeystrokes: nextKeystrokes };
    } else {
      // Character typing within active word
      setCurrentWordInput(activePart);

      const isCorrect = targetWord.startsWith(activePart);
      if (isCorrect) {
        setFeedback("none");
      } else {
        setFeedback("error");
      }

      // Check if this is the last word and we've typed the full length of it
      const isLastWord = activeIdx === totalWordsCount - 1;
      const shouldAutoSubmitLastWord = isLastWord && activePart.length >= targetWord.length;

      const newHistory = shouldAutoSubmitLastWord
        ? [...completedWordsHistory, activePart]
        : completedWordsHistory;

      const nextActiveIdx = shouldAutoSubmitLastWord ? activeIdx + 1 : activeIdx;

      if (shouldAutoSubmitLastWord) {
        setCompletedWordsHistory(newHistory);
        setCurrentWordIndex(nextActiveIdx);
        setCurrentWordInput("");
      }

      // Recalculate WPM and correctKeystrokes using reduce to prevent mutation warnings
      const correctChFromHistory = newHistory.reduce((acc, w, i) => {
        return w === words[i] ? acc + words[i].length + 1 : acc;
      }, 0);

      const activeWordCh = (!shouldAutoSubmitLastWord && targetWord && targetWord.startsWith(activePart))
        ? activePart.length
        : 0;

      const correctCh = correctChFromHistory + activeWordCh;
      setCorrectKeystrokes(correctCh);

      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const newWpm = Math.round((correctCh / 5) / Math.max(elapsed, 0.01));
      setWpm(newWpm);

      const newProgress = totalWordsCount > 0 ? nextActiveIdx / totalWordsCount : 0;
      setProgress(newProgress);

      const nextAccuracy = nextKeystrokes > 0
        ? Math.min(100, Math.round((correctCh / nextKeystrokes) * 100))
        : 100;

      return { wpm: newWpm, accuracy: nextAccuracy, progress: newProgress, isError: false, totalKeystrokes: nextKeystrokes };
    }
  }, [words, completedWordsHistory, startTime, accuracy, progress, wpm, currentWordInput, totalKeystrokes, options?.strict]);

  const isComplete = completedWordsHistory.length >= words.length && words.length > 0;

  return {
    typedInput,
    wpm,
    accuracy,
    progress,
    isComplete,
    handleInput,
    reset,
    feedback,
    setFeedback,
    currentWordIndex,
    currentWordInput,
    totalKeystrokes,
    completedWordsHistory,
  };
}
