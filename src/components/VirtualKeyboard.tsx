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
      return "bg-primary text-white border border-primary border-b-[0px] translate-y-[2.5px] scale-[0.95] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15),0_0_16px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-none";
    }

    const isSpace = normalizedKey === "space";

    if (heatmapMode === "none" || !heatmapData[normalizedKey]) {
      return isSpace
        ? "bg-card border border-border-hairline border-b-[2.5px] border-b-muted/30 text-muted hover:text-foreground hover:bg-card-elevated hover:-translate-y-0.5 hover:border-b-[3px] shadow-sm transition-all duration-150"
        : "bg-card border border-border-hairline border-b-[2.5px] border-b-muted/30 text-muted hover:text-foreground hover:bg-card-elevated hover:-translate-y-0.5 hover:border-b-[3px] shadow-sm transition-all duration-150";
    }

    const keyStats = heatmapData[normalizedKey];

    if (heatmapMode === "errors" && keyStats.errorRate !== undefined) {
      const err = keyStats.errorRate;
      if (err === 0) return "bg-success/12 border border-success/40 border-b-[2.5px] border-b-success/50 text-success hover:bg-success/20 shadow-sm";
      if (err < 0.1) return "bg-error/8 border border-error/30 border-b-[2.5px] border-b-error/40 text-foreground hover:bg-error/15 shadow-sm";
      if (err < 0.25) return "bg-error/18 border border-error/45 border-b-[2.5px] border-b-error/55 text-foreground hover:bg-error/25 shadow-sm";
      if (err < 0.5) return "bg-error/35 border border-error/60 border-b-[2.5px] border-b-error/70 text-white hover:bg-error/45 shadow-sm";
      return "bg-error/70 border border-error/90 border-b-[2.5px] border-b-error/95 text-white shadow-sm";
    }

    if (heatmapMode === "latency" && keyStats.avgLatency !== undefined) {
      const delay = keyStats.avgLatency;
      if (delay < 120) return "bg-success/12 border border-success/40 border-b-[2.5px] border-b-success/50 text-success hover:bg-success/20 shadow-sm";
      if (delay < 180) return "bg-accent-amber/10 border border-accent-amber/35 border-b-[2.5px] border-b-accent-amber/40 text-accent-amber hover:bg-accent-amber/18 shadow-sm";
      if (delay < 280) return "bg-accent-amber/20 border border-accent-amber/50 border-b-[2.5px] border-b-accent-amber/60 text-accent-amber hover:bg-accent-amber/30 shadow-sm";
      if (delay < 450) return "bg-accent-amber/40 border border-accent-amber/65 border-b-[2.5px] border-b-accent-amber/75 text-white hover:bg-accent-amber/50 shadow-sm";
      return "bg-accent-amber/70 border border-accent-amber/90 border-b-[2.5px] border-b-accent-amber/95 text-white shadow-sm";
    }

    return "bg-card/50 border border-border-hairline/75 border-b-[2px] border-b-border/40 text-muted shadow-[0_1px_2px_rgba(0,0,0,0.015)]";
  };

  const formatKeyLabel = (key: string) => {
    if (key === "space") return "Spacebar";
    return key.toUpperCase();
  };

  return (
    <div className="w-full bg-card/20 backdrop-blur-xs border border-border-hairline/30 rounded-[22px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.01)] select-none">
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
                  className={`flex items-center justify-center font-mono text-[9px] sm:text-[11.5px] font-semibold border rounded-[8px] transition-all duration-150 ease-out ${styleClass}`}
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
