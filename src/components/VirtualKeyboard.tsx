"use client";

import { useMemo } from "react";

export type KeyboardLayoutType = "qwerty" | "dvorak" | "colemak";

interface VirtualKeyboardProps {
  layout?: KeyboardLayoutType;
  pressedKeys?: string[]; // array of characters that are currently down
  heatmapMode?: "none" | "errors" | "latency";
  heatmapData?: Record<string, { errorRate?: number; avgLatency?: number; score?: number }>;
  interactive?: boolean;
}

export default function VirtualKeyboard({
  layout = "qwerty",
  pressedKeys = [],
  heatmapMode = "none",
  heatmapData = {},
}: VirtualKeyboardProps) {
  // Define layout structures
  const keyboardRows = useMemo(() => {
    const qwertyRows = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
      ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
      ["space"],
    ];

    const dvorakRows = [
      ["'", ",", ".", "p", "y", "f", "g", "c", "r", "l", "/", "=", "\\"],
      ["a", "o", "e", "u", "i", "d", "h", "t", "n", "s", "-"],
      [";", "q", "j", "k", "x", "b", "m", "w", "v", "z"],
      ["space"],
    ];

    const colemakRows = [
      ["q", "w", "f", "p", "g", "j", "l", "u", "y", ";", "[", "]", "\\"],
      ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o", "'"],
      ["z", "x", "c", "v", "b", "k", "m", ",", ".", "/"],
      ["space"],
    ];

    switch (layout) {
      case "dvorak":
        return dvorakRows;
      case "colemak":
        return colemakRows;
      case "qwerty":
      default:
        return qwertyRows;
    }
  }, [layout]);

  // Clean pressed keys to lower-case for matching
  const activePressedSet = useMemo(() => {
    return new Set(pressedKeys.map((k) => k.toLowerCase()));
  }, [pressedKeys]);

  // Calculate key colors for heatmaps
  const getKeyStyle = (key: string) => {
    const normalizedKey = key.toLowerCase();
    
    // Check if key is currently pressed
    const isPressed = activePressedSet.has(normalizedKey) || 
      (normalizedKey === "space" && activePressedSet.has(" "));
      
    if (isPressed) {
      return "bg-primary text-white border border-primary border-b-[1px] translate-y-[1.5px] scale-[0.98] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_0_12px_color-mix(in_srgb,var(--primary)_25%,transparent)] transition-none";
    }

    const isSpace = normalizedKey === "space";

    if (heatmapMode === "none" || !heatmapData[normalizedKey]) {
      return isSpace
        ? "bg-card border border-border-hairline border-b-[2.5px] border-b-border/75 text-muted hover:text-foreground hover:bg-card/95 hover:-translate-y-0.5 hover:border-b-[3px] shadow-[0_1.5px_3px_rgba(0,0,0,0.03)]"
        : "bg-card border border-border-hairline border-b-[2.5px] border-b-border/75 text-muted hover:text-foreground hover:bg-card/95 hover:-translate-y-0.5 hover:border-b-[3px] shadow-[0_1.5px_3px_rgba(0,0,0,0.03)]";
    }

    const keyStats = heatmapData[normalizedKey];

    if (heatmapMode === "errors" && keyStats.errorRate !== undefined) {
      const err = keyStats.errorRate;
      if (err === 0) return "bg-success/15 border border-success/45 border-b-[2.5px] border-b-success/60 text-success/90 hover:bg-success/25 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (err < 0.1) return "bg-error/10 border border-error/35 border-b-[2.5px] border-b-error/45 text-foreground hover:bg-error/20 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (err < 0.25) return "bg-error/20 border border-error/45 border-b-[2.5px] border-b-error/55 text-foreground hover:bg-error/30 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (err < 0.5) return "bg-error/40 border border-error/60 border-b-[2.5px] border-b-error/75 text-white hover:bg-error/50 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      return "bg-error/80 border border-error text-white shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
    }

    if (heatmapMode === "latency" && keyStats.avgLatency !== undefined) {
      const delay = keyStats.avgLatency;
      if (delay < 120) return "bg-success/15 border border-success/45 border-b-[2.5px] border-b-success/60 text-success/90 hover:bg-success/25 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (delay < 180) return "bg-accent-amber/10 border border-accent-amber/35 border-b-[2.5px] border-b-accent-amber/45 text-accent-amber hover:bg-accent-amber/20 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (delay < 280) return "bg-accent-amber/25 border border-accent-amber/50 border-b-[2.5px] border-b-accent-amber/65 text-accent-amber hover:bg-accent-amber/35 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      if (delay < 450) return "bg-accent-amber/50 border border-accent-amber/70 border-b-[2.5px] border-b-accent-amber/80 text-white hover:bg-accent-amber/60 shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
      return "bg-accent-amber/80 border border-accent-amber text-white shadow-[0_1.5px_3px_rgba(0,0,0,0.01)]";
    }

    return "bg-card border border-border-hairline border-b-[2.5px] border-b-border/75 text-muted shadow-[0_1.5px_3px_rgba(0,0,0,0.02)]";
  };

  const formatKeyLabel = (key: string) => {
    if (key === "space") return "Spacebar";
    return key.toUpperCase();
  };

  return (
    <div className="w-full bg-card/45 backdrop-blur-md border border-border-hairline/55 rounded-[22px] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.015)] select-none">
      <div className="w-full flex flex-col gap-[6px] [--key-width:32px] sm:[--key-width:40px]">
        {keyboardRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center gap-1.5 w-full"
            style={{
              paddingLeft: rowIndex === 1 ? "calc(var(--key-width) / 2)" : rowIndex === 2 ? "var(--key-width)" : "0",
            }}
          >
            {row.map((key) => {
              const styleClass = getKeyStyle(key);
              const isSpace = key === "space";

              return (
                <div
                  key={key}
                  className={`flex items-center justify-center font-mono text-[9px] sm:text-[11.5px] font-semibold border rounded-[8px] transition-all duration-100 ${styleClass}`}
                  style={{
                    width: isSpace ? "calc(var(--key-width) * 5.8)" : "var(--key-width)",
                    height: "var(--key-width)",
                  }}
                >
                  {formatKeyLabel(key)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
