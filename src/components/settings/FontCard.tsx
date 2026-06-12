"use client";

import React, { useEffect, useState } from "react";
import { FontDef } from "@/lib/fontRegistry";
import { loadFont } from "@/lib/fontLoader";

interface FontCardProps {
  font: FontDef;
  selected: boolean;
  onClick: () => void;
}

const FontCard: React.FC<FontCardProps> = ({ font, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);

  // Lazy load font on hover/selected
  useEffect(() => {
    if (selected || hovered) {
      loadFont(font);
    }
  }, [selected, hovered, font]);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      className={`h-[40px] px-3 w-full rounded-[6px] border text-center transition-colors cursor-pointer select-none flex items-center justify-center font-medium ${
        selected
          ? "border-transparent bg-primary text-background font-semibold"
          : "border-border-hairline bg-card/45 text-muted hover:bg-card-elevated hover:text-foreground hover:-translate-y-[0.5px]"
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
