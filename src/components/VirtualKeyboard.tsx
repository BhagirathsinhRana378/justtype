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
      return "bg-primary text-white border border-primary border-b-[0.5px] translate-y-[2px] scale-[0.97] shadow-[inset_0_1.5px_3.5px_rgba(0,0,0,0.12)] transition-none";
    }

    const isSpace = normalizedKey === "space";

    if (heatmapMode === "none" || !heatmapData[normalizedKey]) {
      return "bg-[color-mix(in_srgb,var(--card-elevated)_82%,var(--muted)_18%)] border border-[color-mix(in_srgb,var(--border-hairline)_70%,var(--muted)_30%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_40%,var(--muted)_60%)] text-[color-mix(in_srgb,var(--muted)_85%,var(--foreground)_15%)] hover:text-foreground hover:bg-[color-mix(in_srgb,var(--card-elevated)_92%,var(--foreground)_8%)] hover:-translate-y-0.5 hover:border-b-[3px] shadow-[0_1px_1px_rgba(0,0,0,0.01)] transition-all duration-150";
    }

    const keyStats = heatmapData[normalizedKey];

    if (heatmapMode === "errors" && keyStats.errorRate !== undefined) {
      const err = keyStats.errorRate;
      if (err === 0) return "bg-[color-mix(in_srgb,var(--card-elevated)_82%,var(--success)_18%)] border border-[color-mix(in_srgb,var(--border-hairline)_65%,var(--success)_35%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_35%,var(--success)_65%)] text-success hover:bg-success/20 shadow-xs";
      if (err < 0.1) return "bg-[color-mix(in_srgb,var(--card-elevated)_88%,var(--error)_12%)] border border-[color-mix(in_srgb,var(--border-hairline)_70%,var(--error)_30%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_45%,var(--error)_55%)] text-foreground hover:bg-error/15 shadow-xs";
      if (err < 0.25) return "bg-[color-mix(in_srgb,var(--card-elevated)_78%,var(--error)_22%)] border border-[color-mix(in_srgb,var(--border-hairline)_60%,var(--error)_40%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_30%,var(--error)_70%)] text-foreground hover:bg-error/25 shadow-xs";
      if (err < 0.5) return "bg-[color-mix(in_srgb,var(--card-elevated)_65%,var(--error)_35%)] border border-[color-mix(in_srgb,var(--border-hairline)_50%,var(--error)_50%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_20%,var(--error)_80%)] text-white hover:bg-error/45 shadow-xs";
      return "bg-[color-mix(in_srgb,var(--card-elevated)_40%,var(--error)_60%)] border border-[color-mix(in_srgb,var(--border-hairline)_20%,var(--error)_80%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_10%,var(--error)_90%)] text-white shadow-xs";
    }

    if (heatmapMode === "latency" && keyStats.avgLatency !== undefined) {
      const delay = keyStats.avgLatency;
      if (delay < 120) return "bg-[color-mix(in_srgb,var(--card-elevated)_82%,var(--success)_18%)] border border-[color-mix(in_srgb,var(--border-hairline)_65%,var(--success)_35%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_35%,var(--success)_65%)] text-success hover:bg-success/20 shadow-xs";
      if (delay < 180) return "bg-[color-mix(in_srgb,var(--card-elevated)_86%,var(--accent-amber)_14%)] border border-[color-mix(in_srgb,var(--border-hairline)_65%,var(--accent-amber)_35%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_35%,var(--accent-amber)_65%)] text-accent-amber hover:bg-accent-amber/18 shadow-xs";
      if (delay < 280) return "bg-[color-mix(in_srgb,var(--card-elevated)_78%,var(--accent-amber)_22%)] border border-[color-mix(in_srgb,var(--border-hairline)_60%,var(--accent-amber)_40%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_30%,var(--accent-amber)_70%)] text-accent-amber hover:bg-accent-amber/30 shadow-xs";
      if (delay < 450) return "bg-[color-mix(in_srgb,var(--card-elevated)_60%,var(--accent-amber)_40%)] border border-[color-mix(in_srgb,var(--border-hairline)_45%,var(--accent-amber)_55%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_20%,var(--accent-amber)_80%)] text-white hover:bg-accent-amber/50 shadow-xs";
      return "bg-[color-mix(in_srgb,var(--card-elevated)_35%,var(--accent-amber)_65%)] border border-[color-mix(in_srgb,var(--border-hairline)_20%,var(--accent-amber)_80%)] border-b-[2.5px] border-b-[color-mix(in_srgb,var(--border-hairline)_10%,var(--accent-amber)_90%)] text-white shadow-xs";
    }

    return "bg-card-elevated border border-border-hairline border-b-[2px] border-b-border/40 text-muted shadow-xs";
  };

  const formatKeyLabel = (key: string) => {
    if (key === "space") return "Spacebar";
    return key.toUpperCase();
  };

  return (
    <div className="w-[115%] -mx-[7.5%] bg-[color-mix(in_srgb,var(--card-elevated)_25%,#0a0a09_75%)] border border-white/10 rounded-[32px] p-8 shadow-2xl select-none backdrop-blur-2xl ring-1 ring-white/5">
      <div className="w-full flex flex-col gap-[12px] [--key-width:46px] sm:[--key-width:62px]">
        {keyboardRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center gap-2.5 w-full"
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
                  className={`flex items-center justify-center font-mono text-[11px] sm:text-[14px] font-extrabold border rounded-[12px] transition-all duration-250 ease-out shadow-md ${styleClass}`}
                  style={{
                    width: isSpace ? "calc(var(--key-width) * 6.8)" : "var(--key-width)",
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
