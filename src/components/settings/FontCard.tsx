"use client";

import React, { useEffect } from "react";
import { FontDef } from "@/lib/fontRegistry";
import { loadFont } from "@/lib/fontLoader";

interface FontCardProps {
  font: FontDef;
  selected: boolean;
  onClick: () => void;
}

function getCategoryPreviewWord(category: string) {
  switch (category) {
    case "mono":
      return "typing";
    case "sans":
      return "speed";
    case "readable":
      return "focus";
    default:
      return "precision";
  }
}

const FontCard: React.FC<FontCardProps> = ({ font, selected, onClick }) => {
  // Load font unconditionally on mount to display actual typography immediately
  useEffect(() => {
    loadFont(font);
  }, [font]);

  const previewWord = getCategoryPreviewWord(font.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-40 h-[72px] rounded-[10px] border flex flex-col justify-between p-2.5 transition-colors cursor-pointer select-none text-left outline-none ${
        selected
          ? "border-primary bg-card/60 font-medium border-2"
          : "border-border-hairline/60 bg-card/20 hover:border-primary/45 hover:border-2"
      }`}
    >
      {/* Top: preview word in actual font */}
      <span
        className="text-[16px] leading-tight truncate w-full"
        style={{ fontFamily: font.family }}
      >
        {previewWord}
      </span>

      {/* Bottom: font name and category */}
      <div className="flex items-baseline justify-between w-full mt-auto">
        <span className="text-[11px] text-foreground font-normal truncate max-w-[70%]">
          {font.name}
        </span>
        <span className="text-[8.5px] font-mono text-muted-soft uppercase tracking-wider shrink-0">
          {font.category}
        </span>
      </div>
    </button>
  );
};

export default React.memo(FontCard);
