"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";

export default function Preview() {
  useTypography();

  return (
    <div className="w-full max-w-lg">
      <div 
        className="w-full h-40 border border-border-hairline/60 rounded-[10px] bg-card/15 flex items-center justify-center overflow-hidden select-none"
        style={{
          fontFamily: "var(--typing-font-family)",
          fontSize: "var(--typing-font-size)",
          lineHeight: "var(--typing-line-height)",
          letterSpacing: "var(--typing-letter-spacing)",
        }}
      >
        <div className="flex items-center justify-center text-center w-full px-4">
          {/* Past word: "speed" (Normal color) */}
          <span 
            className="text-foreground/80 font-normal"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            speed
          </span>

          {/* Current word: "focus" (Accent caret) */}
          <span 
            className="relative inline-flex"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            <span className="text-foreground">fo</span>
            <span 
              className="absolute bg-primary"
              style={{
                left: "2ch",
                width: "var(--cursor-thickness, 2px)",
                height: "var(--typing-cursor-height)",
                top: "calc(50% - var(--typing-cursor-height) / 2)",
                zIndex: 10,
              }}
            />
            <span className="text-muted-soft">cus</span>
          </span>

          {/* Future words: "precision", "typing" (Muted color) */}
          <span 
            className="text-muted-soft/50"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            precision
          </span>
          <span className="text-muted-soft/50">
            typing
          </span>
        </div>
      </div>
    </div>
  );
}
