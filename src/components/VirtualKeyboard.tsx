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
      return "bg-primary text-white scale-[0.97] border-primary shadow-inner";
    }

    if (heatmapMode === "none" || !heatmapData[normalizedKey]) {
      return "bg-card border-border-hairline text-muted-soft hover:border-primary/50 hover:text-foreground";
    }

    const keyStats = heatmapData[normalizedKey];

    if (heatmapMode === "errors" && keyStats.errorRate !== undefined) {
      // Color key based on error rate (up to 100% error rate = deep red)
      const err = keyStats.errorRate;
      if (err === 0) return "bg-success/10 text-success border-success/30";
      if (err < 0.1) return "bg-error/10 text-foreground border-error/20";
      if (err < 0.25) return "bg-error/30 text-foreground border-error/40";
      if (err < 0.5) return "bg-error/50 text-white border-error/60";
      return "bg-error text-white border-error shadow-md";
    }

    if (heatmapMode === "latency" && keyStats.avgLatency !== undefined) {
      // Color key based on delay (120ms to 400ms scale = light orange to dark orange/amber)
      const delay = keyStats.avgLatency;
      if (delay < 120) return "bg-success/15 text-foreground border-success/20";
      if (delay < 180) return "bg-accent-amber/15 text-foreground border-accent-amber/20";
      if (delay < 280) return "bg-accent-amber/40 text-foreground border-accent-amber/50";
      if (delay < 450) return "bg-accent-amber/70 text-white border-accent-amber/80";
      return "bg-[#e8a55a] text-white border-[#e8a55a] shadow-md";
    }

    return "bg-card border-border-hairline text-muted-soft";
  };

  const formatKeyLabel = (key: string) => {
    if (key === "space") return "Spacebar";
    return key.toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-1.5 p-4 bg-background border border-border-hairline rounded-lg select-none">
      {keyboardRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-center gap-1.5 w-full"
          style={{
            paddingLeft: rowIndex === 1 ? "1.5rem" : rowIndex === 2 ? "3rem" : "0",
          }}
        >
          {row.map((key) => {
            const styleClass = getKeyStyle(key);
            const isSpace = key === "space";

            return (
              <div
                key={key}
                className={`h-11 sm:h-12 flex items-center justify-center font-mono text-xs sm:text-sm font-medium border rounded transition-all duration-75 shadow-xs ${
                  isSpace ? "w-64 sm:w-80" : "w-10 sm:w-12"
                } ${styleClass}`}
              >
                {formatKeyLabel(key)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
