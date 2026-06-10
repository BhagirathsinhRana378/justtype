"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CaretType } from "@/hooks/useTypingTest";

interface TypingTestAreaProps {
  words: string[];
  typedInput: string;
  status: "idle" | "typing" | "completed";
  caretType: CaretType;
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

  // Auto-focus input on mount or whenever the user clicks the area
  useEffect(() => {
    focusInput();
  }, []);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard listeners for focusing and shortcut restart (Tab key)
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
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
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

  // Construct target joined string
  const targetText = words.join(" ");
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
        className="w-full max-w-4xl min-h-[160px] bg-[#1a1917] border border-[#2a2926] rounded-lg p-6 relative cursor-text select-none outline-none focus-within:ring-1 focus-within:ring-[#cc785c]/30 focus-within:border-[#cc785c] transition-all-smooth"
      >
        {/* Unfocused overlay prompt */}
        {!isFocused && status !== "completed" && (
          <div className="absolute inset-0 bg-[#121110]/80 backdrop-blur-xs flex items-center justify-center rounded-lg z-10 animate-fadeIn pointer-events-none">
            <span className="text-[#cc785c] text-lg font-serif italic">
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
        <div className="font-mono text-xl md:text-2xl leading-relaxed text-[#6c6a64] flex flex-wrap tracking-wide">
          {words.map((word, wordIndex) => {
            const wordChars = word.split("");
            const isLastWord = wordIndex === words.length - 1;

            return (
              <span key={wordIndex} className="inline-flex mr-[0.55em] mb-3 relative">
                {wordChars.map((char, charIndex) => {
                  const absoluteIndex = charCounter++;
                  let charClass = "text-[#6c6a64]";
                  let isCurrent = absoluteIndex === currentInputLength;
                  let isMistake = false;

                  if (absoluteIndex < currentInputLength) {
                    const typedChar = typedInput[absoluteIndex];
                    if (typedChar === char) {
                      charClass = "text-[#faf9f5]"; // Correct
                    } else {
                      charClass = "text-[#c64545] border-b border-[#c64545]"; // Mistake
                      isMistake = true;
                    }
                  }

                  return (
                    <span key={charIndex} className="relative inline-block">
                      {/* Smooth custom carets */}
                      {isCurrent && isFocused && caretType !== "hidden" && (
                        <span
                          className={`absolute ${
                            caretType === "block"
                              ? "w-[0.6em] h-[1.2em] bg-[#cc785c]/80 -z-10 rounded-[2px]"
                              : caretType === "underline"
                              ? "w-[0.6em] h-[3px] bg-[#cc785c] bottom-0"
                              : "w-[2px] h-[1.25em] bg-[#cc785c]" // smooth line
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
                  let spaceClass = "text-[#6c6a64]";
                  let isCurrent = spaceAbsoluteIndex === currentInputLength;
                  let isSpaceMistake = false;

                  if (spaceAbsoluteIndex < currentInputLength) {
                    const typedChar = typedInput[spaceAbsoluteIndex];
                    if (typedChar === " ") {
                      spaceClass = "text-[#faf9f5]";
                    } else {
                      spaceClass = "bg-[#c64545]/20 text-[#c64545]";
                      isSpaceMistake = true;
                    }
                  }

                  return (
                    <span className="relative inline-block">
                      {isCurrent && isFocused && caretType !== "hidden" && (
                        <span
                          className={`absolute ${
                            caretType === "block"
                              ? "w-[0.4em] h-[1.2em] bg-[#cc785c]/80 -z-10 rounded-[2px]"
                              : caretType === "underline"
                              ? "w-[0.4em] h-[3px] bg-[#cc785c] bottom-0"
                              : "w-[2px] h-[1.25em] bg-[#cc785c]"
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

      {/* Restart Info Panel */}
      <div className="mt-6 flex items-center gap-6 text-sm text-[#8e8b82]">
        <button
          onClick={() => {
            restartTest();
            focusInput();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1917] hover:bg-[#252320] border border-[#2a2926] rounded-md text-[#faf9f5] hover:text-[#cc785c] transition-all-smooth focus:outline-none"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Restart Test</span>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[#6c6a64]">
          <kbd className="px-1.5 py-0.5 bg-[#1a1917] border border-[#2a2926] rounded-sm text-[#8e8b82]">Tab</kbd>
          <span>to restart</span>
        </div>
      </div>
    </div>
  );
}
