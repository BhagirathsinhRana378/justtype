"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";
import FontPicker from "./FontPicker";
import Preview from "./Preview";
import SettingRow from "./SettingRow";

interface TypographySettingsProps {
  searchQuery: string;
}

export default function TypographySettings({ searchQuery }: TypographySettingsProps) {
  const { fontSize, updateFontSize } = useTypography();

  const query = searchQuery.toLowerCase().trim();

  // Determine row visibility based on search query
  const showFontSize = !query || "font size".includes(query) || "control typing scale".includes(query);
  const showFontFamily = !query || "font family".includes(query) || "change the font family".includes(query) || "local font".includes(query) || "custom".includes(query);
  const showLivePreview = !query || "live preview".includes(query) || "preview of past, active".includes(query);

  if (!showFontSize && !showFontFamily && !showLivePreview) return null;

  return (
    <div className="flex flex-col w-full overflow-hidden select-none">
      {/* Row 1: Font Size */}
      {showFontSize && (
        <SettingRow
          title="Font Size"
          description="Control typing scale and readability. Affects typing zone only."
        >
          <div className="flex flex-col gap-1 w-full max-w-lg font-mono">
            <div className="flex items-center justify-between text-[11px] text-muted-soft mb-1">
              <span>Scale multiplier</span>
              <span className="bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {fontSize.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.05"
              value={fontSize}
              onChange={(e) => updateFontSize(parseFloat(e.target.value))}
              className="w-full h-1 bg-border-hairline rounded appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-muted-soft mt-1.5 px-0.5">
              <span>0.8×</span>
              <span>1.0×</span>
              <span>1.5×</span>
              <span>2.0×</span>
            </div>
          </div>
        </SettingRow>
      )}

      {/* Row 2: Font Family & Upload Panel (Full width block) */}
      {showFontFamily && (
        <div className="py-4 border-b border-border-hairline/30 w-full overflow-hidden">
          <FontPicker />
        </div>
      )}

      {/* Row 3: Live Preview */}
      {showLivePreview && (
        <SettingRow
          title="Live Preview"
          description="Preview of past, active, and upcoming words in your current configuration."
        >
          <div className="w-full min-w-0">
            <Preview />
          </div>
        </SettingRow>
      )}
    </div>
  );
}
