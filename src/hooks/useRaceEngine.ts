"use client";

import { useCallback, useEffect, useState } from "react";

function calcCorrectChars(typed: string, words: string[]): number {
  if (!typed) return 0;
  const tw = typed.split(" ");
  let cc = 0;
  for (let w = 0; w < tw.length; w++) {
    const t = tw[w];
    const o = words[w] || "";
    for (let i = 0; i < Math.min(t.length, o.length); i++) {
      if (t[i] === o[i]) cc++;
    }
    if (w < tw.length - 1 && t === o) cc++;
  }
  return cc;
}

export function useRaceEngine(words: string[]) {
  const [typedInput, setTypedInput] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);

  const [startTime, setStartTime] = useState(0);

  const calcMetrics = useCallback((input: string) => {
    const cc = calcCorrectChars(input, words);
    const total = input.length;
    const acc = total > 0 ? Math.round((cc / total) * 100) : 100;
    const elapsed = startTime > 0
      ? (Date.now() - startTime) / 1000 / 60
      : 0.01;
    const w = Math.round((cc / 5) / Math.max(elapsed, 0.01));
    const totalChars = words.join(" ").length;
    const p = totalChars > 0 ? cc / totalChars : 0;
    return { wpm: w, accuracy: acc, progress: p };
  }, [words, startTime]);

  const handleInput = useCallback((val: string) => {
    if (!startTime) setStartTime(Date.now());

    const metrics = calcMetrics(val);
    setTypedInput(val);
    setWpm(metrics.wpm);
    setAccuracy(metrics.accuracy);
    setProgress(metrics.progress);

    return metrics;
  }, [calcMetrics, startTime]);

  const reset = useCallback(() => {
    setTypedInput("");
    setWpm(0);
    setAccuracy(100);
    setProgress(0);
    setStartTime(0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reset]);

  const typedWords = typedInput ? typedInput.split(" ") : [];
  const completedWords = typedWords.filter((w, i) => w === words[i]).length;
  const isComplete = completedWords >= words.length && words.length > 0;

  return {
    typedInput,
    setTypedInput,
    wpm,
    accuracy,
    progress,
    isComplete,
    handleInput,
    reset,
  };
}
