"use client";

import React, { useState, useMemo } from "react";
import { ALL_FONTS, FontDef } from "@/lib/fontRegistry";
import { useTypography } from "@/hooks/useTypography";
import FontCard from "./FontCard";
import { Search } from "lucide-react";

export default function FontPicker() {
  const { fontFamily, updateFontFamily, localFonts } = useTypography();
  const [activeCategory, setActiveCategory] = useState<"all" | "mono" | "sans" | "readable" | "display" | "custom">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const formattedLocalFonts = useMemo<FontDef[]>(() => {
    return localFonts.map((f) => ({
      name: f.name,
      family: `'${f.name}', sans-serif`,
      category: "sans", // Fallback category mapping for query checks
      source: "system"
    }));
  }, [localFonts]);

  const fontsToFilter = useMemo<FontDef[]>(() => {
    return [...ALL_FONTS, ...formattedLocalFonts];
  }, [formattedLocalFonts]);

  const filteredFonts = useMemo(() => {
    return fontsToFilter.filter((f) => {
      // Category filter check
      if (activeCategory !== "all") {
        if (activeCategory === "custom") {
          const isLocal = localFonts.some((lf) => lf.name === f.name);
          if (!isLocal) return false;
        } else {
          const isLocal = localFonts.some((lf) => lf.name === f.name);
          if (isLocal || f.category !== activeCategory) return false;
        }
      }
      
      // Search query check: font name only
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [fontsToFilter, activeCategory, searchQuery, localFonts]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Bar Row (Height: 36px, Gap: 8) */}
      <div className="flex items-center justify-between gap-2 h-9 w-full relative">
        {/* Left Scrollable Pills Container */}
        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center h-full">
          <div className="flex items-center gap-2">
            {(["all", "mono", "sans", "readable", "display", "custom"] as const).map((cat) => {
              const count = cat === "all" 
                ? fontsToFilter.length 
                : cat === "custom" 
                  ? localFonts.length 
                  : fontsToFilter.filter(f => f.category === cat && !localFonts.some(lf => lf.name === f.name)).length;
              
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-[6px] text-xs font-semibold capitalize cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-background font-bold"
                      : "bg-card border border-border-hairline/60 text-muted hover:border-primary/45 hover:text-foreground"
                  }`}
                >
                  {cat} <span className="opacity-55 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Search Input (Fixed Right) */}
        <div className="shrink-0 relative w-36 sm:w-48 h-full flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-soft" />
          <input
            type="text"
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-[30px] pr-2.5 h-7 text-[11px] bg-card border border-border-hairline rounded-[6px] outline-none font-mono text-foreground placeholder:text-muted-soft focus:border-primary/50"
          />
        </div>
      </div>

      {/* Font Matrix Grid (Gap: 10, Desktop: 6 cols, Tablet: 4, Mobile: 2) */}
      {filteredFonts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-[10px] select-none w-full">
          {filteredFonts.map((f) => (
            <FontCard
              key={f.name}
              font={f}
              selected={fontFamily === f.name}
              onClick={() => updateFontFamily(f.name)}
            />
          ))}
        </div>
      ) : (
        <div className="h-[100px] w-full flex items-center justify-center font-mono text-xs text-muted-soft border border-dashed border-border-hairline/40 rounded-[6px]">
          No matching fonts
        </div>
      )}
    </div>
  );
}
