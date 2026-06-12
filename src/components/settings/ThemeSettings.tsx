"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { THEMES, applyTheme, ThemeMeta, ThemePreview } from "@/utils/themes";
import { Star, Clock, Palette, Search, Shuffle, Sparkles, Trash2, Copy, Plus, Edit3, Download, Upload } from "lucide-react";

interface ThemeSettingsProps {
  searchQuery: string;
}

const CUSTOM_COLOR_KEYS = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text Color" },
  { key: "card", label: "Surface Card" },
  { key: "primary", label: "Accent Color" },
  { key: "muted", label: "Muted Text" },
  { key: "ink", label: "Ink (Solid Text)" },
  { key: "success", label: "Success Color" },
  { key: "warning", label: "Warning Color" },
  { key: "error", label: "Error Color" }
];const getPreviewColorKey = (key: string): keyof ThemePreview => {
  if (key === "foreground") return "text";
  if (key === "card") return "surface";
  return key as keyof ThemePreview;
};

export default function ThemeSettings({ searchQuery: parentSearchQuery }: ThemeSettingsProps) {
  const [activeThemeId, setActiveThemeId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("justtype_config_theme") || "cream";
    }
    return "cream";
  });
  const [activeCategory, setActiveCategory] = useState<"all" | "light" | "dark" | "midnight" | "forest" | "retro" | "minimal" | "special" | "favorites" | "custom">("all");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  
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

  // Custom themes list state
  const [customThemesList, setCustomThemesList] = useState<ThemeMeta[]>(() => {
    if (typeof window !== "undefined") {
      const listRaw = localStorage.getItem("justtype_custom_themes_list");
      if (listRaw) {
        try { return JSON.parse(listRaw); } catch {}
      }
    }
    return [];
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccessId, setExportSuccessId] = useState<string | null>(null);
  const [showImportBox, setShowImportBox] = useState(false);

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

      const customListRaw = localStorage.getItem("justtype_custom_themes_list");
      if (customListRaw) {
        try { setCustomThemesList(JSON.parse(customListRaw)); } catch {}
      } else {
        setCustomThemesList([]);
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

  const activeQuery = (localSearchQuery || parentSearchQuery || "").toLowerCase().trim();

  // Helper to get theme by ID (supports custom theme metadata representation)
  const getThemeMeta = useCallback((id: string): ThemeMeta => {
    if (id.startsWith("custom-")) {
      const match = customThemesList.find((t) => t.id === id);
      if (match) return match;
    }
    // Legacy support
    if (id === "custom") {
      return {
        id: "custom",
        name: "Legacy Custom",
        description: "Your custom colors override",
        appearance: "dark",
        preview: {
          background: "#121110",
          surface: "#1a1917",
          text: "#faf9f5",
          primary: "#cc785c",
          muted: "#6c6a64",
          success: "#5db872",
          error: "#c64545"
        }
      };
    }
    return THEMES.find((t) => t.id === id) || THEMES[0];
  }, [customThemesList]);

  const filteredThemes = useMemo(() => {
    // Combine standard presets and custom list
    const allPresets = [...THEMES, ...customThemesList];

    const filtered = allPresets.filter((theme) => {
      // Category filter checks
      if (activeCategory !== "all") {
        if (activeCategory === "favorites") {
          if (!favorites.includes(theme.id)) return false;
        } else if (activeCategory === "custom") {
          return theme.id.startsWith("custom-") || theme.id === "custom";
        } else if (theme.appearance !== activeCategory && theme.id !== activeCategory) {
          if (activeCategory === "midnight" && theme.id === "midnight") return true;
          if (activeCategory === "forest" && theme.id === "forest") return true;
          return false;
        }
      }

      // Search query checks
      if (activeQuery) {
        return (
          theme.name.toLowerCase().includes(activeQuery) ||
          theme.description.toLowerCase().includes(activeQuery)
        );
      }

      return true;
    });

    // Pinned sorting order:
    // 1. Current active theme pinned first
    // 2. Recently used list items next (excluding the current theme)
    // 3. Alphabetical sorting for the rest
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
  }, [activeCategory, activeQuery, favorites, activeThemeId, recentlyUsed, customThemesList]);

  const handleMouseEnter = useCallback((id: string) => {
    applyTheme(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    applyTheme(activeThemeId);
  }, [activeThemeId]);

  const handleSelectTheme = useCallback((id: string) => {
    setActiveThemeId(id);
    applyTheme(id);

    let recent = [...recentlyUsed];
    recent = recent.filter((r) => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 3);
    setRecentlyUsed(recent);

    localStorage.setItem("justtype_config_theme", id);
    localStorage.setItem("justtype_theme_recently_used", JSON.stringify(recent));

    window.dispatchEvent(new Event("storage"));
  }, [recentlyUsed]);

  const handleCustomColorChange = useCallback((key: string, value: string) => {
    const previewKey = getPreviewColorKey(key);
    if (!activeThemeId.startsWith("custom-")) {
      const id = `custom-${Date.now()}`;
      const activeMeta = getThemeMeta(activeThemeId);
      const newTheme: ThemeMeta = {
        id,
        name: `Modified ${activeMeta.name}`,
        description: `Customized variant of ${activeMeta.name}`,
        appearance: activeMeta.appearance,
        preview: {
          ...activeMeta.preview,
          [previewKey]: value
        }
      };
      const updated = [...customThemesList, newTheme];
      setCustomThemesList(updated);
      localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
      handleSelectTheme(id);
      setActiveCategory("custom");
      return;
    }

    const updatedList = customThemesList.map((t) => {
      if (t.id === activeThemeId) {
        return {
          ...t,
          preview: {
            ...t.preview,
            [previewKey]: value
          }
        };
      }
      return t;
    });
    setCustomThemesList(updatedList);
    localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updatedList));
    applyTheme(activeThemeId);
  }, [activeThemeId, customThemesList, getThemeMeta, handleSelectTheme]);

  // Custom Theme Creation helper
  const handleCreateCustomTheme = useCallback(() => {
    const id = `custom-${Date.now()}`;
    const newTheme: ThemeMeta = {
      id,
      name: `Custom Theme ${customThemesList.length + 1}`,
      description: "User created custom theme",
      appearance: "dark",
      preview: {
        background: "#121110",
        surface: "#1a1917",
        text: "#faf9f5",
        primary: "#cc785c",
        muted: "#6c6a64",
        success: "#5db872",
        error: "#c64545"
      }
    };
    const updated = [...customThemesList, newTheme];
    setCustomThemesList(updated);
    localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
    handleSelectTheme(id);
    setActiveCategory("custom");
  }, [customThemesList, handleSelectTheme]);

  // Custom theme operations
  const handleDuplicateTheme = useCallback((themeIdToDup: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetMeta = getThemeMeta(themeIdToDup);
    const id = `custom-${Date.now()}`;
    const newTheme: ThemeMeta = {
      ...targetMeta,
      id,
      name: `${targetMeta.name} Copy`,
      description: `Copy of ${targetMeta.name}`
    };
    const updated = [...customThemesList, newTheme];
    setCustomThemesList(updated);
    localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
    handleSelectTheme(id);
    setActiveCategory("custom");
  }, [customThemesList, getThemeMeta, handleSelectTheme]);

  const handleDeleteCustomTheme = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customThemesList.filter((t) => t.id !== id);
    setCustomThemesList(updated);
    localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
    
    if (activeThemeId === id) {
      handleSelectTheme("cream");
    }
  }, [customThemesList, activeThemeId, handleSelectTheme]);

  const handleStartRename = useCallback((theme: ThemeMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(theme.id);
    setRenameText(theme.name);
  }, []);

  const handleSaveRename = useCallback((id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameText.trim()) return;

    const updated = customThemesList.map((t) => {
      if (t.id === id) {
        return { ...t, name: renameText };
      }
      return t;
    });
    setCustomThemesList(updated);
    localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
    setRenamingId(null);
    window.dispatchEvent(new Event("storage"));
  }, [customThemesList, renameText]);

  const handleExportCustomTheme = useCallback((theme: ThemeMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dataStr = JSON.stringify({
        name: theme.name,
        appearance: theme.appearance,
        description: theme.description,
        preview: theme.preview
      }, null, 2);
      navigator.clipboard.writeText(dataStr);
      setExportSuccessId(theme.id);
      setTimeout(() => setExportSuccessId(null), 2000);
    } catch (err) {
      console.error("Failed to export theme", err);
    }
  }, []);

  const handleImportCustomTheme = useCallback(() => {
    try {
      const parsed = JSON.parse(importJson);
      if (typeof parsed !== "object" || parsed === null) {
        setImportError("Invalid JSON format");
        return;
      }
      if (!parsed.name || !parsed.preview || !parsed.preview.background || !parsed.preview.text || !parsed.preview.primary) {
        setImportError("Missing required colors");
        return;
      }
      const id = `custom-${Date.now()}`;
      const newTheme: ThemeMeta = {
        id,
        name: parsed.name,
        description: parsed.description || "Imported theme",
        appearance: parsed.appearance || "dark",
        preview: parsed.preview
      };
      const updated = [...customThemesList, newTheme];
      setCustomThemesList(updated);
      localStorage.setItem("justtype_custom_themes_list", JSON.stringify(updated));
      handleSelectTheme(id);
      setImportJson("");
      setImportError("");
      setImportSuccess(true);
      setShowImportBox(false);
      setActiveCategory("custom");
      setTimeout(() => setImportSuccess(false), 2500);
    } catch {
      setImportError("Syntax error parsing JSON");
    }
  }, [customThemesList, importJson, handleSelectTheme]);

  // Smart selection helpers
  const handleRandomTheme = useCallback(() => {
    const pool = filteredThemes.length > 0 ? filteredThemes : THEMES;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    handleSelectTheme(chosen.id);
  }, [filteredThemes, handleSelectTheme]);

  const handleShuffleTheme = useCallback(() => {
    let count = 0;
    const interval = setInterval(() => {
      const pool = THEMES;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIndex];
      applyTheme(chosen.id);
      count++;
      if (count >= 6) {
        clearInterval(interval);
        handleSelectTheme(chosen.id);
      }
    }, 100);
  }, [handleSelectTheme]);

  const isCustomTab = activeCategory === "custom";
  const activeCustomTheme = activeThemeId.startsWith("custom-") ? getThemeMeta(activeThemeId) : null;

  return (
    <div className="flex flex-col w-full select-none gap-3 font-sans">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col gap-0.5 select-none pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-foreground font-mono font-medium text-[13px]">
            <Palette className="w-4 h-4 text-primary" />
            <span>Themes</span>
            <span className="ml-1 text-[10.5px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold font-mono">
              {filteredThemes.length}
            </span>
          </div>

          {/* Smart Features Control Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomTheme}
              className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] bg-card border border-border-hairline hover:border-primary/40 text-foreground font-mono rounded-[6px] transition-colors cursor-pointer"
              title="Apply a random theme from filtered list"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Random</span>
            </button>
            <button
              type="button"
              onClick={handleShuffleTheme}
              className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] bg-card border border-border-hairline hover:border-primary/40 text-foreground font-mono rounded-[6px] transition-colors cursor-pointer"
              title="Shuffle cycle through all presets"
            >
              <Shuffle className="w-3 h-3 text-primary animate-[spin_5s_linear_infinite]" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-soft">
          Browse presets, manage custom schemes, and preview instantly.
        </p>
      </div>

      {/* 2. TOP CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 w-full relative border-b border-border-hairline/25 pb-2.5">
        {/* Left: Category Navigation (10 Categories) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full">
          {([
            "all", "light", "dark", "midnight", "forest", "retro", "minimal", "special", "favorites", "custom"
          ] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-[6px] text-[10.5px] font-mono capitalize cursor-pointer transition-colors leading-none shrink-0 ${
                  isActive
                    ? "bg-primary text-background font-medium"
                    : "bg-card border border-border-hairline/40 text-muted hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full md:w-[180px] shrink-0 h-7">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-soft pointer-events-none" />
          <input
            type="text"
            placeholder="Search themes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full h-full pl-7 pr-2 text-[10.5px] bg-card border border-border-hairline/60 rounded-[6px] outline-none text-foreground placeholder:text-muted-soft focus:border-primary/50 font-mono"
          />
        </div>
      </div>

      {/* 3. PRESET / CUSTOM SEGMENTED LINK & Multi-Custom Controls */}
      <div className="flex items-center justify-between w-full mt-0.5 select-none">
        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-muted-soft leading-none">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`hover:text-foreground transition-colors cursor-pointer ${!isCustomTab ? "text-primary font-medium" : ""}`}
          >
            presets
          </button>
          <span className="opacity-30">/</span>
          <button
            type="button"
            onClick={() => setActiveCategory("custom")}
            className={`hover:text-foreground transition-colors cursor-pointer ${isCustomTab ? "text-primary font-medium" : ""}`}
          >
            custom
          </button>
        </div>

        {/* Custom Actions (Create/Import) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCreateCustomTheme}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-card border border-border-hairline hover:border-primary/45 rounded-[6px] transition-colors cursor-pointer text-foreground"
          >
            <Plus className="w-2.5 h-2.5 text-primary" />
            <span>New Custom</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-card border border-border-hairline hover:border-primary/45 rounded-[6px] transition-colors cursor-pointer text-foreground"
          >
            <Upload className="w-2.5 h-2.5 text-primary" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Import Textbox Overlay drawer */}
      {showImportBox && (
        <div className="flex flex-col gap-2 p-2.5 bg-card/45 border border-border-hairline/70 rounded-[8px] font-mono mt-1 select-none">
          <span className="text-[10px] text-muted-soft">Paste exported theme JSON configuration below:</span>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full h-16 p-2 text-[10px] bg-background border border-border-hairline/60 rounded-[6px] outline-none text-foreground font-mono resize-none focus:border-primary/50"
            placeholder='e.g. { "name": "Theme", "preview": { "background": "#000", "text": "#fff", "primary": "#f00" } }'
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-error">{importError}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImportBox(false)}
                className="px-2 py-1 text-[9.5px] border border-border-hairline rounded-[6px] hover:bg-card/50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCustomTheme}
                className="px-2.5 py-1 text-[9.5px] bg-primary text-background font-semibold rounded-[6px] cursor-pointer"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {importSuccess && (
        <div className="text-[10.5px] font-mono text-success">
          ✓ Theme imported successfully!
        </div>
      )}

      {/* 4. THEME GRID (5 cols desktop, 4 tablet, 2 mobile, 10px gap, tiles 36px height) */}
      {filteredThemes.length > 0 ? (
        <div 
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full select-none mt-1"
          onMouseLeave={handleMouseLeave}
        >
          {filteredThemes.map((theme) => {
            const isSelected = activeThemeId === theme.id;
            const isFav = favorites.includes(theme.id);
            const isRecent = recentlyUsed.includes(theme.id) && theme.id !== activeThemeId;
            const isCustom = theme.id.startsWith("custom-");
            const isRenaming = renamingId === theme.id;

            const colors = theme.preview;
            const tileStyle = {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: isSelected ? colors.primary : `${colors.muted}18`
            };

            return (
              <div
                key={theme.id}
                onMouseEnter={() => handleMouseEnter(theme.id)}
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: "auto 36px"
                } as React.CSSProperties}
                className="relative group w-full"
              >
                {/* Tile Button */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  style={tileStyle}
                  className={`w-full h-9 px-2.5 rounded-[8px] flex items-center justify-between select-none relative cursor-pointer transition-all duration-150 ${
                    isSelected 
                      ? "border-2 shadow-xs" 
                      : "border hover:brightness-[1.06] hover:shadow-2xs"
                  }`}
                >
                  {/* Left: Icons & Theme Name */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Star favorite toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(theme.id, e)}
                      className={`transition-opacity cursor-pointer shrink-0 ${
                        isFav 
                          ? "opacity-100" 
                          : "opacity-0 group-hover:opacity-60 hover:opacity-100"
                      }`}
                      style={{ color: colors.primary }}
                    >
                      <Star 
                        className={`w-3 h-3 ${isFav ? "fill-current" : ""}`} 
                      />
                    </button>

                    {/* Selected checkmark or recently used clock icon */}
                    {isRecent && !isSelected && (
                      <Clock className="w-2.5 h-2.5 shrink-0 opacity-40" style={{ color: colors.muted }} />
                    )}

                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={() => handleSaveRename(theme.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-background/50 border border-border-hairline rounded px-1 text-[10px] text-foreground font-mono outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-[11px] font-mono truncate select-none leading-none">
                        {theme.name}
                      </span>
                    )}
                  </div>

                  {/* Right Side: Action toolbar overlay on hover for custom themes, otherwise color dots */}
                  {isCustom && !isRenaming ? (
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1.5 bg-inherit pr-0.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(theme, e)}
                        className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                        title="Rename Theme"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicateTheme(theme.id, e)}
                        className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                        title="Duplicate Theme"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleExportCustomTheme(theme, e)}
                        className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                        title="Copy Theme JSON to clipboard"
                      >
                        <Download className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                        className="p-0.5 hover:text-error transition-colors cursor-pointer"
                        title="Delete Theme"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : null}

                  {/* Standard palette dots (hidden on custom hover so actions display) */}
                  <div className={`flex items-center gap-[3px] shrink-0 ml-1.5 select-none ${isCustom ? "group-hover:hidden" : ""}`} aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-full border border-black/5" style={{ backgroundColor: colors.background }} />
                    <span className="w-1.5 h-1.5 rounded-full border border-black/5" style={{ backgroundColor: colors.text }} />
                    <span className="w-1.5 h-1.5 rounded-full border border-black/5" style={{ backgroundColor: colors.primary }} />
                  </div>
                </button>

                {/* Export success toast overlay */}
                {exportSuccessId === theme.id && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-background font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm z-50">
                    Copied!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-20 w-full flex items-center justify-center font-mono text-[11px] text-muted-soft border border-dashed border-border-hairline/40 rounded-[8px] mt-1">
          No matching themes
        </div>
      )}

      {/* 5. COMPACT CUSTOM THEME COLOR EDITOR */}
      {activeCustomTheme && (
        <div className="flex flex-col gap-3 border-t border-border-hairline/25 pt-3 mt-1.5 w-full font-mono select-none">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px] uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Editing Custom Theme: {activeCustomTheme.name}</span>
            </div>

            {/* In-editor custom commands */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDuplicateTheme(activeCustomTheme.id)}
                className="flex items-center gap-1 px-2 py-0.5 text-[9.5px] border border-border-hairline hover:border-primary/40 rounded-[6px] text-foreground transition-colors cursor-pointer"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Clone</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteCustomTheme(activeCustomTheme.id, e)}
                className="flex items-center gap-1 px-2 py-0.5 text-[9.5px] border border-error/40 hover:bg-error/5 text-error rounded-[6px] transition-colors cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
            {CUSTOM_COLOR_KEYS.map((item) => {
              const previewKey = getPreviewColorKey(item.key);
              return (
                <div 
                  key={item.key}
                  className="flex items-center justify-between px-2.5 bg-card/25 border border-border-hairline/60 rounded-[8px] gap-2.5 h-9"
                >
                  <span className="text-[11px] font-medium text-foreground truncate max-w-[50%]">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="color"
                      value={activeCustomTheme.preview[previewKey] || "#ffffff"}
                      onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                      className="w-6 h-4.5 p-0 border-0 bg-transparent rounded cursor-pointer outline-none shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={activeCustomTheme.preview[previewKey] || ""}
                      onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                      className="w-15 h-4.5 bg-background border border-border-hairline/40 rounded px-1 text-[9.5px] text-center text-foreground uppercase outline-none focus:border-primary/50 font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
