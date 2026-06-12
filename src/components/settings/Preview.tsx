"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";

export default function Preview() {
  const { fontFamily, fontSize } = useTypography();

  return (
    <div className="bg-card border border-border-hairline rounded-xl p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between w-full">
        <h4 className="text-xs font-bold font-mono text-muted-soft uppercase tracking-wider">
          Typing Preview
        </h4>
        <span className="text-[10px] font-mono text-muted-soft bg-background px-2.5 py-1 rounded-lg border border-border-hairline">
          {fontFamily} @ {fontSize.toFixed(2)}×
        </span>
      </div>

      <div 
        className="p-8 bg-background border border-border-hairline/80 rounded-xl flex items-center justify-center overflow-hidden min-h-[130px] select-none w-full"
        style={{
          fontFamily: "var(--typing-font-family)",
          fontSize: "var(--typing-font-size)",
          lineHeight: "var(--typing-line-height)",
          letterSpacing: "var(--typing-letter-spacing)",
        }}
      >
        <div className="flex flex-wrap items-center justify-center text-center w-full">
          {/* Typed Word: "speed" (Normal Contrast) */}
          <span 
            className="inline-flex text-foreground"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            speed
          </span>

          {/* Active Word: "focus" (Accent Cursor inside) */}
          <span 
            className="inline-flex relative"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            {/* Typed part of active word */}
            <span className="text-foreground">fo</span>
            
            {/* Accent Cursor (Caret) positioned exactly after 'fo' using font-relative ch units */}
            <span 
              className="absolute bg-primary"
              style={{
                left: "2ch",
                width: "2px",
                height: "var(--typing-cursor-height)",
                top: "calc(50% - var(--typing-cursor-height) / 2)",
                zIndex: 10,
              }}
            />

            {/* Upcoming part of active word */}
            <span className="text-muted-soft/85">cus</span>
          </span>

          {/* Future Word: "precision" (Muted) */}
          <span 
            className="inline-flex text-muted-soft/60"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            precision
          </span>

          {/* Future Word: "rhythm" (Muted) */}
          <span className="inline-flex text-muted-soft/60">
            rhythm
          </span>
        </div>
      </div>
    </div>
  );
}
