"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";

export default function Preview() {
  useTypography();

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Live typing board rendering with active font variables */}
      <div 
        className="p-6 bg-card/45 border border-border-hairline/40 rounded-[6px] flex items-center justify-center overflow-hidden min-h-[110px] select-none w-full"
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

          {/* Active Word: "focus" (Accent Cursor) */}
          <span 
            className="inline-flex relative"
            style={{ marginRight: "var(--typing-word-gap)" }}
          >
            <span className="text-foreground">fo</span>
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
