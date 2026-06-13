"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Palette, Sun, Zap, Sparkles, Rocket, Ghost, Shield, Leaf, Heart, BookOpen, Check } from "lucide-react";
import { applyTheme, THEME_STORAGE_KEY, DEFAULT_THEME_ID, SIGNATURE_THEME_IDS, SIGNATURE_THEME_STORAGE_KEY } from "@/utils/themes";

const QUICK_THEMES = [
  { id: "cream", name: "Cream", icon: Sun, desc: "Claude Cream" },
  { id: "archive-404", name: "Archive", icon: Ghost, desc: "Default Dark" },
  { id: "velvet-eclipse", name: "Velvet", icon: Heart, desc: "Velvet Eclipse" },
  { id: "phantom-titanium", name: "Phantom", icon: Shield, desc: "Phantom Titanium" },
  { id: "solar-ash", name: "Solar", icon: Zap, desc: "Solar Ash" },
  { id: "frost-protocol", name: "Frost", icon: Sparkles, desc: "Frost Protocol" },
  { id: "deep-moss", name: "Moss", icon: Leaf, desc: "Deep Moss" },
  { id: "neon-cathedral", name: "Neon", icon: Rocket, desc: "Neon Cathedral" },
  { id: "ivory-operator", name: "Ivory", icon: BookOpen, desc: "Ivory Operator" },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME_ID);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === "/" || pathname === "";

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
    const signatureTheme = localStorage.getItem(SIGNATURE_THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
    
    // If we are on landing, we reflect the signature theme in the UI
    const targetTheme = isLandingPage && !SIGNATURE_THEME_IDS.includes(savedTheme)
      ? signatureTheme
      : savedTheme;

    Promise.resolve().then(() => {
      setCurrentTheme(targetTheme);
    });
  }, [isLandingPage, pathname]);

  const handleThemeChange = (id: string) => {
    setCurrentTheme(id);
    applyTheme(id);
    setIsOpen(false);
    window.dispatchEvent(new Event("storage"));
  };

  const filteredThemes = QUICK_THEMES;

  // Find matching theme object for display
  const activeThemeMeta = QUICK_THEMES.find(t => t.id === currentTheme);
  const displayThemeName = activeThemeMeta?.name || currentTheme;
  const ActiveIcon = activeThemeMeta?.icon || Palette;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border-hairline hover:border-primary/50 text-muted hover:text-foreground transition-all duration-200 cursor-pointer"
        aria-label="Switch theme"
      >
        <ActiveIcon className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline capitalize">{displayThemeName}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border-hairline rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
            <div className="p-2 flex flex-col gap-1">
              {filteredThemes.map((theme) => {
                const Icon = theme.icon;
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-soft"}`} />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-semibold">{theme.name}</span>
                        <span className="text-[10px] opacity-70">{theme.desc}</span>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
