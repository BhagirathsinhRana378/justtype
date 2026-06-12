"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { THEMES, applyTheme, ThemeMeta } from "@/utils/themes";
import { Star, Check, Clock, Palette } from "lucide-react";

interface ThemeSettingsProps {
  searchQuery: string;
}

const CUSTOM_COLOR_KEYS = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text Color" },
  { key: "card", label: "Surface Card" },
  { key: "primary", label: "Accent Color" },
  { key: "muted", label: "Muted Text" },
  { key: "success", label: "Success Accent" },
  { key: "error", label: "Error Accent" }
];

export default function ThemeSettings({ searchQuery: parentSearchQuery }: ThemeSettingsProps) {
  const [activeThemeId, setActiveThemeId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("justtype_config_theme") || "cream";
    }
    return "cream";
  });
  const [activeCategory, setActiveCategory] = useState<"all" | "light" | "dark" | "midnight" | "forest" | "favorites" | "custom">("all");
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const favsRaw = localStorage.getItem("justtype_theme_favorites");
      if (favsRaw) {
        try { return JSON.parse(favsRaw); } catch {}
      }
    }
    return [];
  });

  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const recentRaw = localStorage.getItem("justtype_theme_recently_used");
      if (recentRaw) {
        try { return JSON.parse(recentRaw); } catch {}
      }
    }
    return [];
  });

  const [customColors, setCustomColors] = useState<Record<string, string>>(() => {
    const defaultColors = {
      background: "#121110",
      foreground: "#faf9f5",
      card: "#1a1917",
      primary: "#cc785c",
      muted: "#6c6a64",
      success: "#5db872",
      error: "#c64545"
    };
    if (typeof window !== "undefined") {
      const customColorsRaw = localStorage.getItem("justtype_custom_theme_colors");
      if (customColorsRaw) {
        try { return { ...defaultColors, ...JSON.parse(customColorsRaw) }; } catch {}
      }
    }
    return defaultColors;
  });

  // Sync state if storage updates (e.g. from reset action)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("justtype_config_theme") || "cream";
      setActiveThemeId(saved);

      const favsRaw = localStorage.getItem("justtype_theme_favorites");
      if (favsRaw) {
        try { setFavorites(JSON.parse(favsRaw)); } catch { setFavorites([]); }
      } else {
        setFavorites([]);
      }

      const recentRaw = localStorage.getItem("justtype_theme_recently_used");
      if (recentRaw) {
        try { setRecentlyUsed(JSON.parse(recentRaw)); } catch { setRecentlyUsed([]); }
      } else {
        setRecentlyUsed([]);
      }

      const customColorsRaw = localStorage.getItem("justtype_custom_theme_colors");
      if (customColorsRaw) {
        try { setCustomColors(JSON.parse(customColorsRaw)); } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("justtype_theme_favorites", JSON.stringify(updated));
  };

  const activeQuery = parentSearchQuery !== undefined ? parentSearchQuery : "";

  // Helper to get theme by ID (supports custom theme metadata representation)
  const getThemeMeta = useCallback((id: string): ThemeMeta => {
    if (id === "custom") {
      return {
        id: "custom",
        name: "Custom Theme",
        description: "Your custom colors override",
        appearance: "dark",
        preview: {
          background: customColors.background,
          surface: customColors.card,
          text: customColors.foreground,
          primary: customColors.primary,
          muted: customColors.muted,
          success: customColors.success,
          error: customColors.error
        }
      };
    }
    return THEMES.find((t) => t.id === id) || THEMES[0];
  }, [customColors]);

  const filteredThemes = useMemo(() => {
    // Generate theme list with custom included if active or custom tab selected
    const allPresets = [...THEMES];
    if (activeThemeId === "custom" || activeCategory === "custom") {
      allPresets.push(getThemeMeta("custom"));
    }

    const filtered = allPresets.filter((theme) => {
      // Category filter checks
      if (activeCategory !== "all") {
        if (activeCategory === "favorites") {
          if (!favorites.includes(theme.id)) return false;
        } else if (activeCategory === "custom") {
          return theme.id === "custom";
        } else if (theme.appearance !== activeCategory && theme.id !== activeCategory) {
          if (activeCategory === "midnight" && theme.id === "midnight") return true;
          if (activeCategory === "forest" && theme.id === "forest") return true;
          return false;
        }
      }

      // Search query checks
      if (activeQuery.trim()) {
        const query = activeQuery.toLowerCase();
        return (
          theme.name.toLowerCase().includes(query) ||
          theme.description.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Pinned sorting order:
    // 1. Current active theme pinned first
    // 2. Recently used list items next (excluding the current theme)
    // 3. Pinned custom themes
    // 4. Standard alphabetical sorting for the rest
    filtered.sort((a, b) => {
      if (a.id === activeThemeId) return -1;
      if (b.id === activeThemeId) return 1;

      const idxA = recentlyUsed.indexOf(a.id);
      const idxB = recentlyUsed.indexOf(b.id);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [activeCategory, activeQuery, favorites, activeThemeId, recentlyUsed, getThemeMeta]);

  const handleMouseEnter = (id: string) => {
    applyTheme(id);
  };

  const handleMouseLeave = () => {
    applyTheme(activeThemeId);
  };

  const handleSelectTheme = (id: string) => {
    setActiveThemeId(id);
    applyTheme(id);

    // Track recently used theme IDs
    let recent = [...recentlyUsed];
    recent = recent.filter((r) => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 3);
    setRecentlyUsed(recent);

    localStorage.setItem("justtype_config_theme", id);
    localStorage.setItem("justtype_theme_recently_used", JSON.stringify(recent));

    window.dispatchEvent(new Event("storage"));
  };

  const handleCustomColorChange = (key: string, value: string) => {
    const updated = { ...customColors, [key]: value };
    setCustomColors(updated);
    localStorage.setItem("justtype_custom_theme_colors", JSON.stringify(updated));
    applyTheme("custom");
  };

  const isCustomTab = activeCategory === "custom";

  return (
    <div className="flex flex-col w-full select-none gap-4">
      {/* Top Toolbar Navigation Row */}
      <div className="flex items-center justify-between gap-2 h-9 w-full relative">
        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center h-full">
          <div className="flex items-center gap-1.5">
            {(["all", "light", "dark", "midnight", "forest", "favorites", "custom"] as const).map((cat) => {
              const count = cat === "all"
                ? THEMES.length
                : cat === "favorites"
                  ? favorites.length
                  : cat === "custom"
                    ? (activeThemeId === "custom" ? 1 : 0)
                    : THEMES.filter(t => t.appearance === cat || t.id === cat).length;

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
      </div>

      {/* Themes Grid (5 cols desktop, 3 tablet, 2 mobile, 10px gap, tiles 48px height) */}
      {filteredThemes.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full select-none"
          onMouseLeave={handleMouseLeave}
        >
          {filteredThemes.map((theme) => {
            const isSelected = activeThemeId === theme.id;
            const isFav = favorites.includes(theme.id);
            const isRecent = recentlyUsed.includes(theme.id) && theme.id !== activeThemeId;

            // Compute inline visual styling using the theme colors directly
            const colors = theme.preview;
            const tileStyle = {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: isSelected ? colors.primary : `${colors.muted}25`
            };

            return (
              <button
                key={theme.id}
                type="button"
                onMouseEnter={() => handleMouseEnter(theme.id)}
                onClick={() => handleSelectTheme(theme.id)}
                style={tileStyle}
                className={`h-12 px-3 rounded-[10px] border flex items-center justify-between select-none relative group transition-colors cursor-pointer ${
                  isSelected ? "border-2" : "border"
                }`}
              >
                {/* Left side name and indicators */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Star favorites toggle */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(theme.id, e)}
                    className="opacity-45 hover:opacity-100 hover:text-primary transition-opacity cursor-pointer shrink-0"
                    style={{ color: colors.primary }}
                  >
                    <Star 
                      className={`w-3.5 h-3.5 ${isFav ? "fill-current opacity-100" : "opacity-45"}`} 
                    />
                  </button>

                  {/* Selected checkmark or recently used clock icon */}
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: colors.primary }} />
                  ) : isRecent ? (
                    <Clock className="w-3 h-3 shrink-0 opacity-40" style={{ color: colors.muted }} />
                  ) : null}

                  <span className="text-[12.5px] font-medium truncate select-none leading-none">
                    {theme.name}
                  </span>
                </div>

                {/* Right side color palette dots (5 colors) */}
                <div className="flex items-center gap-1 shrink-0 ml-1.5 select-none" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: colors.background }} />
                  <span className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: colors.text }} />
                  <span className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: colors.primary }} />
                  <span className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: colors.success || "#5db872" }} />
                  <span className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: colors.error || "#c64545" }} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="h-[100px] w-full flex items-center justify-center font-mono text-xs text-muted-soft border border-dashed border-border-hairline/40 rounded-[10px]">
          No matching themes
        </div>
      )}

      {/* Collapsible Custom Theme Color Editor */}
      {isCustomTab && (
        <div className="flex flex-col gap-4 border-t border-border-hairline/30 pt-4 mt-2 w-full font-mono select-none">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
            <Palette className="w-4 h-4 text-primary" />
            <span>Custom Color Theme Editor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {CUSTOM_COLOR_KEYS.map((item) => (
              <div 
                key={item.key}
                className="flex items-center justify-between p-2.5 bg-card/20 border border-border-hairline rounded-[10px] gap-4 h-11"
              >
                <span className="text-[11.5px] font-medium text-foreground truncate max-w-[60%]">
                  {item.label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="color"
                    value={customColors[item.key] || "#ffffff"}
                    onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                    className="w-7 h-5 p-0 border-0 bg-transparent rounded cursor-pointer outline-none shrink-0"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={customColors[item.key] || ""}
                    onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                    className="w-16 h-5 bg-background border border-border-hairline/50 rounded px-1 text-[10px] text-center text-foreground uppercase outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
