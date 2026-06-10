"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CaretType, KeyboardLayoutType } from "@/hooks/useTypingTest";
import VirtualKeyboard from "./VirtualKeyboard";

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

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Auto-focus input on mount or whenever the user clicks the area
  useEffect(() => {
    focusInput();
  }, []);

  // Keyboard listeners for focusing, shortcut restart (Tab key) and pressed keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus when user starts typing on any normal alphanumeric key
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

      // Tab key restarts the test
      if (e.key === "Tab") {
        e.preventDefault();
        restartTest();
        focusInput();
      }

      // Track keydown state for virtual keyboard
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
      // User deleted characters
      const diff = currentLength - nextLength;
      for (let i = 0; i < diff; i++) {
        registerKeystroke("Backspace");
      }
    } else {
      // User added character(s)
      const newChar = val[val.length - 1];
      registerKeystroke(newChar);
    }
  };

  const currentInputLength = typedInput.length;

  // Render text layout character by character
  // Group by words to ensure proper CSS text wrapping behavior
  let charCounter = 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Test Interactive Wrapper */}
      <div
        ref={containerRef}
        onClick={focusInput}
        className="w-full max-w-4xl min-h-[160px] bg-card border border-border-hairline rounded-lg p-6 relative cursor-text select-none outline-none focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all-smooth"
      >
        {/* Unfocused overlay prompt */}
        {!isFocused && status !== "completed" && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center rounded-lg z-10 animate-fadeIn pointer-events-none">
            <span className="text-primary text-lg font-serif italic">
              ✦ Click here or press any key to focus and start typing...
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

        {/* Text board render */}
        <div className="font-mono text-xl md:text-2xl leading-relaxed text-muted-soft flex flex-wrap tracking-wide">
          {words.map((word, wordIndex) => {
            const wordChars = word.split("");
            const isLastWord = wordIndex === words.length - 1;

            return (
              <span key={wordIndex} className="inline-flex mr-[0.55em] mb-3 relative">
                {wordChars.map((char, charIndex) => {
                  const absoluteIndex = charCounter++;
                  let charClass = "text-muted-soft";
                  const isCurrent = absoluteIndex === currentInputLength;

                  if (absoluteIndex < currentInputLength) {
                    const typedChar = typedInput[absoluteIndex];
                    if (typedChar === char) {
                      charClass = "text-foreground font-semibold"; // Correct
                    } else {
                      charClass = "text-error border-b border-error"; // Mistake
                    }
                  }

                  return (
                    <span key={charIndex} className="relative inline-block">
                      {/* Smooth custom carets */}
                      {isCurrent && isFocused && caretType !== "hidden" && (
                        <span
                          className={`absolute ${
                            caretType === "block"
                              ? "w-[0.6em] h-[1.2em] bg-primary/80 -z-10 rounded-[2px]"
                              : caretType === "underline"
                              ? "w-[0.6em] h-[3px] bg-primary bottom-0"
                              : "w-[2px] h-[1.25em] bg-primary" // smooth line
                          } top-[0.1em] caret-blink transition-all duration-75`}
                        />
                      )}
                      <span className={`${charClass}`}>{char}</span>
                    </span>
                  );
                })}

                {/* Handle space character at the end of word (except the last word) */}
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

      {/* Dynamic Virtual Keyboard */}
      {status !== "completed" && (
        <div className="w-full max-w-2xl mt-8 animate-fadeIn">
          <VirtualKeyboard layout={layout} pressedKeys={pressedKeys} />
        </div>
      )}

      {/* Restart Info Panel */}
      <div className="mt-6 flex items-center gap-6 text-sm text-muted">
        <button
          onClick={() => {
            restartTest();
            focusInput();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-elevated border border-border-hairline rounded-md text-foreground hover:text-primary transition-all-smooth focus:outline-none cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Restart Test</span>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-soft">
          <kbd className="px-1.5 py-0.5 bg-card border border-border-hairline rounded-sm text-muted">Tab</kbd>
          <span>to restart</span>
        </div>
      </div>
    </div>
  );
}
