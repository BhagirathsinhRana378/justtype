"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Palette, Sun, Moon, Cloud, TreePine, Check } from "lucide-react";

const THEMES = [
  { id: "cream", name: "Light", icon: Sun, desc: "Claude Cream" },
  { id: "charcoal", name: "Dark", icon: Moon, desc: "Charcoal" },
  { id: "midnight", name: "Midnight", icon: Cloud, desc: "Deep Navy" },
  { id: "forest", name: "Forest", icon: TreePine, desc: "Evergreen" },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("cream");
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  useEffect(() => {
    const savedTheme = localStorage.getItem("justtype_config_theme") || "cream";
    Promise.resolve().then(() => {
      setCurrentTheme(savedTheme);
    });
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeChange = (id: string) => {
    setCurrentTheme(id);
    localStorage.setItem("justtype_config_theme", id);
    document.documentElement.setAttribute("data-theme", id);
    setIsOpen(false);
  };

  const filteredThemes = isLandingPage 
    ? THEMES.filter(t => ["cream", "charcoal"].includes(t.id))
    : THEMES;

  // Determine what name to show in the button
  const displayThemeName = isLandingPage && ["midnight", "forest"].includes(currentTheme)
    ? "Dark"
    : THEMES.find(t => t.id === currentTheme)?.name || currentTheme;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border-hairline hover:border-primary/50 text-muted hover:text-foreground transition-all duration-200 cursor-pointer"
        aria-label="Switch theme"
      >
        <Palette className="w-4 h-4" />
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
