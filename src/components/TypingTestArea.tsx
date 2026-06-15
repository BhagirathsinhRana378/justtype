"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { CaretType, KeyboardLayoutType } from "@/hooks/useTypingTest";
import Word from "./Word";

interface TypingTestAreaProps {
  words: string[];
  typedInput: string;
  status: "idle" | "typing" | "paused" | "completed";
  caretType: CaretType;
  layout: KeyboardLayoutType;
  registerKeystroke: (char: string) => void;
  restartTest: () => void;
  resumeTest?: () => void;
  showFocusWarning?: boolean;
  keyboardNavigation?: boolean;
}

export default function TypingTestArea({
  words,
  typedInput,
  status,
  caretType,
  registerKeystroke,
  restartTest,
  resumeTest,
  showFocusWarning = true,
  keyboardNavigation = true,
}: TypingTestAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastValRef = useRef(typedInput);

  // Sync ref with typedInput state (e.g. on restart)
  useEffect(() => {
    lastValRef.current = typedInput;
  }, [typedInput]);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const [prevWords, setPrevWords] = useState(words);

  // Reset translation on words list change
  if (words !== prevWords) {
    setPrevWords(words);
    setTranslateY(0);
  }

  // Safely reset ref array after render
  useEffect(() => {
    wordRefs.current = [];
  }, [words]);

  // Initial focus on mount
  useEffect(() => {
    focusInput();
  }, []);

  // Keyboard shortcut listener (Tab for restart, auto-focus on regular character keys)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contenteditable element
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) {
        // Do not intercept keystrokes or steal focus if typing in an input or textarea
        return;
      }

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

      if (keyboardNavigation && e.key === "Tab") {
        e.preventDefault();
        restartTest();
        focusInput();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isFocused, restartTest, keyboardNavigation]);

  // Split typedInput into words
  const typedWords = useMemo(() => {
    return typedInput.split(" ");
  }, [typedInput]);

  const activeWordIndex = useMemo(() => {
    return Math.max(0, typedWords.length - 1);
  }, [typedWords]);

  // Scroll active line into center of viewport on active word change
  useEffect(() => {
    const activeWordEl = wordRefs.current[activeWordIndex];
    if (activeWordEl) {
      const Y = activeWordEl.offsetTop;
      const H = activeWordEl.offsetHeight;
      
      // If we are past the first line, shift the view up to center the active line
      if (Y >= H) {
        setTranslateY(H - Y);
      } else {
        setTranslateY(0);
      }
    }
  }, [activeWordIndex]);

  // Adjust scroll position on window resize
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

  // Handle typing inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const prevVal = lastValRef.current;
    
    let commonPrefixLength = 0;
    const minLength = Math.min(prevVal.length, val.length);
    while (
      commonPrefixLength < minLength &&
      prevVal[commonPrefixLength] === val[commonPrefixLength]
    ) {
      commonPrefixLength++;
    }

    const backspacesNeeded = prevVal.length - commonPrefixLength;
    for (let i = 0; i < backspacesNeeded; i++) {
      registerKeystroke("Backspace");
    }

    const charsToAdd = val.substring(commonPrefixLength);
    for (let i = 0; i < charsToAdd.length; i++) {
      registerKeystroke(charsToAdd[i]);
    }

    lastValRef.current = val;
  };

  return (
    <div className="w-full flex flex-col items-center select-none relative">
      {/* Scrollable viewport for typing area */}
      <div
        ref={containerRef}
        onClick={focusInput}
        className="w-full relative cursor-text select-none outline-none overflow-hidden py-4"
        style={{
          height: "calc(3 * var(--typing-font-size) * var(--typing-line-height) + 2rem)",
        }}
      >
        {/* Simple physical click-to-focus overlay */}
        {!isFocused && status !== "completed" && status !== "paused" && showFocusWarning && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 transition-opacity duration-200">
            <span className="text-muted-soft text-sm font-mono tracking-widest select-none bg-background px-5 py-2.5 border border-border-hairline rounded-md shadow-xs">
              [ click to focus ]
            </span>
          </div>
        )}

        {/* Paused Overlay */}
        {status === "paused" && (
          <div 
            onClick={() => {
              if (resumeTest) resumeTest();
              focusInput();
            }}
            className="absolute inset-0 bg-background/75 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all duration-200 cursor-pointer"
          >
            <span className="text-primary text-sm font-mono tracking-widest select-none bg-card px-6 py-3 border border-primary/20 rounded-md shadow-md hover:bg-card-elevated transition-colors duration-200 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              [ paused - click to continue ]
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
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={status === "completed"}
        />

        {/* Moving words board */}
        <div
          className="w-full relative transition-transform duration-300 cubic-bezier(0.25, 1, 0.5, 1)"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          <div 
            className="flex flex-wrap"
            style={{
              fontFamily: "var(--typing-font-family)",
              fontSize: "var(--typing-font-size)",
              lineHeight: "var(--typing-line-height)",
              letterSpacing: "var(--typing-letter-spacing)",
            }}
          >
            {words.map((word, wordIndex) => {
              const isActive = wordIndex === activeWordIndex;
              const isPast = wordIndex < activeWordIndex;

              return (
                <span
                  key={wordIndex}
                  ref={(el) => {
                    wordRefs.current[wordIndex] = el;
                  }}
                  className="inline-flex"
                >
                  <Word
                    word={word}
                    wordIndex={wordIndex}
                    isActive={isActive}
                    isPast={isPast}
                    typed={typedWords[wordIndex]}
                    caretType={caretType}
                    isFocused={isFocused}
                  />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
