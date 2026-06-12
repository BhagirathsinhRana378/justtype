"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";
import FontPicker from "./FontPicker";
import LocalFont from "./LocalFont";

export default function TypographySettings() {
  const { fontSize, updateFontSize } = useTypography();

  return (
    <div className="flex flex-col w-full overflow-hidden select-none">
      {/* Row 1: Font Size */}
      <div className="grid grid-cols-1 lg:grid-cols-[26fr_74fr] gap-10 py-6 border-b border-border-hairline/40 w-full overflow-hidden">
        <div className="flex flex-col gap-1 w-full">
          <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
          <p className="text-xs text-muted leading-relaxed">
            Control typing scale and readability. Affects typing zone only.
          </p>
        </div>
        <div className="flex flex-col gap-2 justify-center w-full min-w-0">
          <div className="flex items-center justify-between font-mono text-[11px] w-full">
            <span className="text-muted-soft">Range: 0.80 – 2.50</span>
            <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {fontSize.toFixed(2)}×
            </span>
          </div>
          <div className="flex items-center w-full">
            <input
              type="range"
              min="0.80"
              max="2.50"
              step="0.05"
              value={fontSize}
              onChange={(e) => updateFontSize(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary border border-border-hairline/60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Font Family Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-[26fr_74fr] gap-10 py-6 border-b border-border-hairline/40 w-full overflow-hidden">
        <div className="flex flex-col gap-1 w-full">
          <h3 className="text-sm font-semibold text-foreground">Font Family</h3>
          <p className="text-xs text-muted leading-relaxed">
            Select typography for typing. Previews display real letterforms for each typeface.
          </p>
        </div>
        <div className="w-full min-w-0">
          <FontPicker />
        </div>
      </div>

      {/* Row 3: Local Font */}
      <div className="grid grid-cols-1 lg:grid-cols-[26fr_74fr] gap-10 py-6 w-full overflow-hidden">
        <div className="flex flex-col gap-1 w-full">
          <h3 className="text-sm font-semibold text-foreground">Local Font</h3>
          <p className="text-xs text-muted leading-relaxed">
            Upload custom font files (.ttf, .woff, .woff2, .otf) to cache locally in IndexedDB.
          </p>
        </div>
        <div className="w-full min-w-0">
          <LocalFont />
        </div>
      </div>
    </div>
  );
}
