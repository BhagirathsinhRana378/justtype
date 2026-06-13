"use client";

import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { CaretType } from "@/hooks/useTypingTest";

interface WordProps {
  word: string;
  wordIndex: number;
  isActive: boolean;
  isPast: boolean;
  typed: string | undefined; // typed characters for this word
  caretType: CaretType;
  isFocused: boolean;
}

const Word: React.FC<WordProps> = ({
  word,
  isActive,
  isPast,
  typed = "",
  caretType,
  isFocused,
}) => {
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretLeft, setCaretLeft] = useState(0);
  const [prevTyped, setPrevTyped] = useState(typed);
  const [isTyping, setIsTyping] = useState(false);

  // Synchronously set typing state when typed characters change
  if (typed !== prevTyped) {
    setPrevTyped(typed);
    if (isActive && typed.length > 0) {
      setIsTyping(true);
    }
  }

  // Timer to clear the typing active state after a pause
  useEffect(() => {
    if (!isTyping) return;
    
    const t = setTimeout(() => {
      setIsTyping(false);
    }, 450);

    return () => {
      clearTimeout(t);
    };
  }, [isTyping, typed]);

  const typedLength = typed.length;

  // Track caret positioning relative to character spans
  useLayoutEffect(() => {
    if (isActive && isFocused) {
      const activeEl = charRefs.current[typedLength];
      if (activeEl) {
        setCaretLeft(activeEl.offsetLeft);
      }
    }
  }, [isActive, isFocused, typedLength]);

  // Construct display characters list (target characters + any extra typed characters)
  const displayChars = React.useMemo(() => {
    const list = [];
    // Target word chars
    for (let i = 0; i < word.length; i++) {
      list.push({
        char: word[i],
        isExtra: false,
        index: i,
      });
    }
    // Extra typed chars (capped to avoid massive overflow rendering)
    if (typed.length > word.length) {
      const extraCount = Math.min(typed.length - word.length, 10);
      for (let i = 0; i < extraCount; i++) {
        const idx = word.length + i;
        list.push({
          char: typed[idx],
          isExtra: true,
          index: idx,
        });
      }
    }
    return list;
  }, [word, typed]);

  return (
    <span
      className="inline-flex relative select-none py-[1px] px-[2px]"
      style={{
        marginRight: "var(--typing-word-gap)",
        letterSpacing: "var(--typing-letter-spacing)",
        fontFamily: "var(--typing-font-family)",
      }}
    >
      {/* Absolute positioned mechanical caret */}
      {isActive && isFocused && caretType !== "hidden" && (
        <span
          className="absolute pointer-events-none bg-primary opacity-100"
          style={{
            left: `${caretLeft}px`,
            width: caretType === "smooth" ? "var(--cursor-thickness, 1.5px)" : "0.62em",
            height: caretType === "underline" ? "3px" : "var(--typing-cursor-height)",
            top: caretType === "underline" ? "90%" : "12%",
            transition: "left var(--cursor-speed, 40ms) linear",
            zIndex: caretType === "block" ? -1 : 10,
            animation: !isTyping ? "blink 1s step-end infinite" : "none",
          }}
        />
      )}

      {/* Render each character */}
      {displayChars.map((item, i) => {
        let charClass = "";
        const isCharTyped = item.index < typedLength;

        if (isPast) {
          // Completed words: remain solid white, do NOT fade
          if (item.isExtra) {
            charClass = "text-error";
          } else {
            const typedChar = typed[item.index];
            if (typedChar === item.char) {
              charClass = "text-foreground";
            } else {
              charClass = "text-error";
            }
          }
        } else if (isActive) {
          // Active word being typed
          if (isCharTyped) {
            if (item.isExtra) {
              charClass = "text-error";
            } else {
              const typedChar = typed[item.index];
              if (typedChar === item.char) {
                charClass = "text-foreground font-semibold"; // Transition immediately to solid white
              } else {
                charClass = "text-error"; // Soft muted red
              }
            }
          } else {
            // Untyped part of active word: slightly brighter
            charClass = "text-muted-soft/85";
          }
        } else {
          // Future words: medium gray with 55-60% opacity
          charClass = "text-muted-soft/60";
        }

        return (
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
            className={`inline-block relative ${charClass}`}
          >
            {item.char}
          </span>
        );
      })}

      {/* End marker span to measure caret position when at the end of word */}
      {isActive && (
        <span
          ref={(el) => {
            charRefs.current[displayChars.length] = el;
          }}
          className="w-0 inline-block"
        />
      )}
    </span>
  );
};

export default React.memo(Word);
