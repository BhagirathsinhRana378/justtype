"use client";

import React, { useEffect } from "react";
import { FontDef } from "@/lib/fontRegistry";
import { loadFont } from "@/lib/fontLoader";

interface FontCardProps {
  font: FontDef;
  selected: boolean;
  onClick: () => void;
}

const FontCard: React.FC<FontCardProps> = ({ font, selected, onClick }) => {
  // Load font on mount to render its actual font family immediately
  useEffect(() => {
    loadFont(font);
  }, [font]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[40px] px-3 w-full rounded-[6px] border text-center transition-colors cursor-pointer select-none flex items-center justify-center font-medium ${
        selected
          ? "border-transparent bg-primary text-background font-semibold"
          : "border-border-hairline bg-card/45 text-muted hover:bg-card hover:text-foreground"
      }`}
      style={{
        fontFamily: font.family,
        fontSize: "14px",
      }}
    >
      <span className="truncate max-w-full block whitespace-nowrap">
        {font.name}
      </span>
    </button>
  );
};

export default React.memo(FontCard);
