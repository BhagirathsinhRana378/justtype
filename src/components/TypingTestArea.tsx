"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CaretType, KeyboardLayoutType } from "@/hooks/useTypingTest";
import VirtualKeyboard from "./VirtualKeyboard";
import { getSavedSessions } from "@/utils/aiEngine";

interface TypingTestAreaProps {
  words: string[];
  typedInput: string;
  status: "idle" | "typing" | "completed";
  caretType: CaretType;
  layout: KeyboardLayoutType;
  registerKeystroke: (char: string) => void;
  restartTest: () => void;
}

export default function TypingTestArea({
  words,
  typedInput,
  status,
  caretType,
  layout,
  registerKeystroke,
  restartTest,
}: TypingTestAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [translateY, setTranslateY] = useState(0);
  const [heatmapData, setHeatmapData] = useState<Record<string, { errorRate: number; avgLatency: number; score: number }>>({});
  
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Reset word refs on words list update
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    wordRefs.current = [];
    setTranslateY(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [words]);

  // Load telemetry stats for keyboard heatmap overlay
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
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
      setHeatmapData(data);
    } catch (e) {
      console.error("Failed to compile keyboard heatmap stats", e);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [status]);

  // Focus on mount
  useEffect(() => {
    focusInput();
  }, []);

  // Keyboard listeners for focusing, Tab shortcut and pressed keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        !isFocused &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        inputRef.current
      ) {
        inputRef.current.focus();
      }

      if (e.key === "Tab") {
        e.preventDefault();
        restartTest();
        focusInput();
      }

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
  }, [isFocused, restartTest]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentLength = typedInput.length;
    const nextLength = val.length;

    if (nextLength < currentLength) {
      const diff = currentLength - nextLength;
      for (let i = 0; i < diff; i++) {
        registerKeystroke("Backspace");
      }
    } else {
      const newChar = val[val.length - 1];
      registerKeystroke(newChar);
    }
  };

  const currentInputLength = typedInput.length;

  // Active word index derived from space counts in typedInput
  const getActiveWordIndex = () => {
    let spaceCount = 0;
    for (let i = 0; i < currentInputLength; i++) {
      if (typedInput[i] === " ") {
        spaceCount++;
      }
    }
    return spaceCount;
  };
  const activeWordIndex = getActiveWordIndex();

  // Center the active word's line in the middle of the viewport
  useEffect(() => {
    const activeWordEl = wordRefs.current[activeWordIndex];
    if (activeWordEl) {
      const Y = activeWordEl.offsetTop;
      const H = activeWordEl.offsetHeight;
      if (Y > H) {
        setTranslateY(-(Y - H));
      } else {
        setTranslateY(0);
      }
    }
  }, [activeWordIndex]);

  // Recalculate translateY on window resize (which might wrap lines)
  useEffect(() => {
    const handleResize = () => {
      const activeWordEl = wordRefs.current[activeWordIndex];
      if (activeWordEl) {
        const Y = activeWordEl.offsetTop;
        const H = activeWordEl.offsetHeight;
        if (Y > H) {
          setTranslateY(-(Y - H));
        } else {
          setTranslateY(0);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeWordIndex]);

  let charCounter = 0;

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Viewport container with virtual scroll window */}
      <div
        ref={containerRef}
        onClick={focusInput}
        className="w-full relative cursor-text select-none outline-none focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all-smooth border border-border-hairline/80 bg-card/25 rounded-lg py-2 md:py-3 lg:py-4 px-4 overflow-hidden h-[4.5rem] md:h-[7.5rem] lg:h-[10rem]"
      >
        {/* Unfocused overlay */}
        {!isFocused && status !== "completed" && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center rounded-lg z-10 animate-fadeIn pointer-events-none">
            <span className="text-primary text-sm font-serif italic select-none">
              ✦ Click here or press any key to focus...
            </span>
          </div>
        )}

        {/* Hidden Input field */}
        <input
          ref={inputRef}
          type="text"
          value={typedInput}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={status === "completed"}
        />

        {/* Translated words board */}
        <div 
          className="w-full relative transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          <div className="font-mono text-xl md:text-2xl lg:text-3xl leading-[1.75rem] md:leading-[2rem] lg:leading-[2.5rem] text-muted-soft flex flex-wrap tracking-wide">
            {words.map((word, wordIndex) => {
              const wordChars = word.split("");
              const isLastWord = wordIndex === words.length - 1;

              return (
                <span 
                  key={wordIndex} 
                  ref={el => { wordRefs.current[wordIndex] = el; }}
                  className="inline-flex mr-[0.55em] mb-3 relative"
                >
                  {wordChars.map((char, charIndex) => {
                    const absoluteIndex = charCounter++;
                    let charClass = "text-muted-soft";
                    const isCurrent = absoluteIndex === currentInputLength;

                    if (absoluteIndex < currentInputLength) {
                      const typedChar = typedInput[absoluteIndex];
                      if (typedChar === char) {
                        charClass = "text-foreground font-semibold";
                      } else {
                        charClass = "text-error border-b border-error";
                      }
                    }

                    return (
                      <span key={charIndex} className="relative inline-block">
                        {isCurrent && isFocused && caretType !== "hidden" && (
                          <span
                            className={`absolute ${
                              caretType === "block"
                                ? "w-[0.6em] h-[1.2em] bg-primary/80 -z-10 rounded-[2px]"
                                : caretType === "underline"
                                ? "w-[0.6em] h-[3px] bg-primary bottom-0"
                                : "w-[2px] h-[1.25em] bg-primary"
                            } top-[0.1em] caret-blink transition-all duration-75`}
                          />
                        )}
                        <span className={`${charClass}`}>{char}</span>
                      </span>
                    );
                  })}

                  {/* Spaces */}
                  {!isLastWord && (() => {
                    const spaceAbsoluteIndex = charCounter++;
                    let spaceClass = "text-muted-soft";
                    const isCurrent = spaceAbsoluteIndex === currentInputLength;

                    if (spaceAbsoluteIndex < currentInputLength) {
                      const typedChar = typedInput[spaceAbsoluteIndex];
                      if (typedChar === " ") {
                        spaceClass = "text-foreground";
                      } else {
                        spaceClass = "bg-error/20 text-error";
                      }
                    }

                    return (
                      <span className="relative inline-block">
                        {isCurrent && isFocused && caretType !== "hidden" && (
                          <span
                            className={`absolute ${
                              caretType === "block"
                                ? "w-[0.4em] h-[1.2em] bg-primary/80 -z-10 rounded-[2px]"
                                : caretType === "underline"
                                ? "w-[0.4em] h-[3px] bg-primary bottom-0"
                                : "w-[2px] h-[1.25em] bg-primary"
                            } top-[0.1em] caret-blink transition-all duration-75`}
                          />
                        )}
                        <span className={`${spaceClass} px-[0.1em]`}>&nbsp;</span>
                      </span>
                    );
                  })()}
                </span>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. FIXED BOTTOM SECTION: Virtual Keyboard (Heatmap enabled) */}
      {status !== "completed" && (
        <div className="w-full max-w-xl mt-6 animate-fadeIn">
          <VirtualKeyboard 
            layout={layout} 
            pressedKeys={pressedKeys} 
            heatmapMode="latency"
            heatmapData={heatmapData}
          />
        </div>
      )}

      {/* Restart Info row (Compact footer) */}
      {status !== "completed" && (
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-soft select-none font-mono">
          <button
            onClick={() => {
              restartTest();
              focusInput();
            }}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restart</span>
          </button>
          <span>•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 bg-card border border-border-hairline rounded text-[10px] text-muted select-none">Tab</kbd>
            <span>quick reset</span>
          </div>
        </div>
      )}

    </div>
  );
}
