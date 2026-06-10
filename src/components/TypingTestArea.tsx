"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, MousePointerClick } from "lucide-react";
import { CaretType, KeyboardLayoutType } from "@/hooks/useTypingTest";

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
  registerKeystroke,
  restartTest,
}: TypingTestAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevTopRef = useRef<number>(0);
  
  const [caretStyle, setCaretStyle] = useState<React.CSSProperties>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  
  const [disableCaretTransition, setDisableCaretTransition] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Reset word refs on words list update
  useEffect(() => {
    wordRefs.current = [];
    setTranslateY(0);
    prevTopRef.current = 0;
  }, [words]);

  // Focus on mount
  useEffect(() => {
    focusInput();
  }, []);

  // Keyboard listeners for focusing, Tab shortcut
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
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isFocused, restartTest]);

  // Keep track of active typing state to pause caret blinking
  useEffect(() => {
    if (typedInput.length === 0) {
      setIsTyping(false);
      return;
    }
    
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [typedInput]);

  // Measure and update the caret position relative to the words-board
  useEffect(() => {
    if (status === "completed") {
      setCaretStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    const activeEl = container.querySelector(".active-char") as HTMLElement;
    if (activeEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const boardEl = container.querySelector(".words-board") as HTMLElement;
      if (boardEl) {
        const boardRect = boardEl.getBoundingClientRect();
        
        const left = activeRect.left - boardRect.left;
        const top = activeRect.top - boardRect.top;
        const width = activeRect.width;
        const height = activeRect.height;
        
        const prevTop = prevTopRef.current;
        // If line changed, disable transition to prevent diagonal slide
        if (prevTop > 0 && Math.abs(top - prevTop) > 10) {
          setDisableCaretTransition(true);
          const t = setTimeout(() => {
            setDisableCaretTransition(false);
          }, 40);
          prevTopRef.current = top;
          setCaretStyle({
            left,
            top: caretType === "underline" ? top + height - 3.5 : (caretType === "smooth" ? top + (height - height * 0.82) / 2 : top),
            width: caretType === "smooth" ? 2.5 : width,
            height: caretType === "smooth" ? height * 0.82 : (caretType === "underline" ? 3.5 : height),
            opacity: 1,
          });
          return () => clearTimeout(t);
        }
        
        prevTopRef.current = top;

        let caretWidth = width;
        let caretHeight = height;
        let caretTop = top;
        let caretLeft = left;

        if (caretType === "smooth") {
          caretWidth = 2.5;
          caretHeight = height * 0.82;
          caretTop = top + (height - caretHeight) / 2;
        } else if (caretType === "underline") {
          caretHeight = 3.5;
          caretTop = top + height - 3.5;
        }

        setCaretStyle({
          left: caretLeft,
          top: caretTop,
          width: caretWidth,
          height: caretHeight,
          opacity: 1,
        });
      }
    } else {
      setCaretStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [typedInput, isFocused, status, caretType, words]);

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
      // We want Y to be at position H (the middle line)
      // So Y + translateY = H => translateY = H - Y
      if (Y >= H) {
        setTranslateY(H - Y);
      } else {
        setTranslateY(0);
      }
    }
  }, [activeWordIndex]);

  // Recalculate translateY on window resize
  useEffect(() => {
    const handleResize = () => {
      const activeWordEl = wordRefs.current[activeWordIndex];
      if (activeWordEl) {
        const Y = activeWordEl.offsetTop;
        const H = activeWordEl.offsetHeight;
        if (Y >= H) {
          setTranslateY(H - Y);
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
        className="w-full relative cursor-text select-none outline-none overflow-hidden"
        style={{
          width: "min(1500px, 98vw)",
          height: "calc(3 * 1.7 * clamp(34px, 2.8vw, 46px) + 48px)", // Increased height and line-height slightly
          borderRadius: "16px",
          padding: "24px 0",
          background: "transparent",
          border: "none",
        }}
      >
        {/* Unfocused overlay */}
        {!isFocused && status !== "completed" && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fadeIn pointer-events-none transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <MousePointerClick className="w-5 h-5 text-primary/80 animate-bounce" />
              <span className="text-primary/70 text-lg font-serif italic select-none tracking-wide">
                ✦ click to focus
              </span>
            </div>
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
          className="w-full relative transition-transform duration-[400ms] cubic-bezier(0.25, 1, 0.5, 1) words-board"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {/* 1. SINGLE ABSOLUTE SMOOTH MOVING CARET */}
          {status !== "completed" && isFocused && caretType !== "hidden" && (
            <span
              className={`absolute pointer-events-none rounded-[1px] ${
                disableCaretTransition ? "transition-none" : "transition-all duration-[110ms] cubic-bezier(0.165, 0.84, 0.44, 1)"
              } ${
                isTyping ? "caret-active" : "caret-blink"
              } ${
                caretType === "block"
                  ? "bg-primary/15 rounded-[4px] -z-10"
                  : "bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
              }`}
              style={caretStyle}
            />
          )}

          <div 
            className="font-mono text-muted-soft/60 flex flex-wrap tracking-tight px-4"
            style={{
              fontSize: "clamp(34px, 2.8vw, 46px)",
              lineHeight: "1.7",
            }}
          >
            {words.map((word, wordIndex) => {
              const wordChars = word.split("");
              const isLastWord = wordIndex === words.length - 1;
              const distance = wordIndex - activeWordIndex;
              const isActiveWord = distance === 0;

              return (
                <span 
                  key={wordIndex} 
                  ref={el => { wordRefs.current[wordIndex] = el; }}
                  className={`inline-flex relative transition-all duration-300 rounded-md ${isActiveWord ? "z-10" : ""}`}
                  style={{ 
                    marginRight: "0.3em",
                    padding: "0 0.05em",
                  }}
                >
                  {wordChars.map((char, charIndex) => {
                    const absoluteIndex = charCounter++;
                    const isCurrent = absoluteIndex === currentInputLength;
                    let charClass = "";

                    if (status === "idle") {
                      // Upcoming
                      charClass = "text-muted-soft/60";
                    } else if (absoluteIndex < currentInputLength) {
                      // Typed
                      const typedChar = typedInput[absoluteIndex];
                      if (typedChar === char) {
                        charClass = "text-muted transition-colors duration-200";
                      } else {
                        charClass = "text-error border-b-2 border-error/50 font-bold bg-error/5 rounded-sm";
                      }
                    } else if (isCurrent && isFocused) {
                      // Active next character
                      charClass = "text-foreground font-bold transition-colors duration-150";
                    } else if (isActiveWord && absoluteIndex > currentInputLength) {
                        // Remaining chars in active word
                        charClass = "text-muted-soft/90";
                    } else {
                      // Future words/chars
                      charClass = "text-muted-soft/70";
                    }

                    return (
                      <span 
                        key={charIndex} 
                        className={`relative inline-block ${isCurrent ? "active-char" : ""}`}
                      >
                        <span className={`${charClass} char-transition`}>{char}</span>
                      </span>
                    );
                  })}

                  {/* Spaces */}
                  {!isLastWord && (() => {
                    const spaceAbsoluteIndex = charCounter++;
                    const isCurrent = spaceAbsoluteIndex === currentInputLength;
                    let spaceClass = "";

                    if (status === "idle") {
                      spaceClass = "text-muted-soft/40";
                    } else if (spaceAbsoluteIndex < currentInputLength) {
                      const typedChar = typedInput[spaceAbsoluteIndex];
                      if (typedChar === " ") {
                        spaceClass = "text-muted/40";
                      } else {
                        spaceClass = "bg-error/20 text-error rounded-[2px]";
                      }
                    } else if (isCurrent && isFocused) {
                      spaceClass = "text-foreground/80";
                    } else {
                      spaceClass = "text-muted-soft/40";
                    }

                    return (
                      <span 
                        className={`relative inline-block ${isCurrent ? "active-char" : ""}`}
                      >
                        <span className={`${spaceClass} px-[0.1em] char-transition`}>&nbsp;</span>
                      </span>
                    );
                  })()}
                </span>
              );
            })}
          </div>
        </div>

      </div>

      {/* Restart Info row (Spacious margins below typing area) */}
      {status !== "completed" && (
        <div className="mt-8 flex items-center gap-4 text-xs text-muted-soft select-none font-mono">
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
