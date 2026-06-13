"use client";

import { useState, useEffect, useCallback } from "react";
import { applyTheme } from "@/utils/themes";
import { resetTypography } from "./useTypography";

export interface SystemSettings {
  // Visual Preferences
  flipColors: boolean;
  colorfulMode: boolean;
  focusMode: boolean;
  minimalUi: boolean;
  hideStatistics: boolean;
  reduceMotion: boolean;
  blurBackground: boolean;
  compactControls: boolean;

  // Test Experience
  showKeyTips: boolean;
  showCapsWarning: boolean;
  showFocusWarning: boolean;
  showAverage: "speed" | "accuracy" | "both" | "off";
  showLiveKeyboard: "off" | "static" | "reactive";

  // Performance
  animationLimit: "native" | "60" | "120" | "240" | "custom";
  memoryMode: "balanced" | "performance" | "maximum";

  // Accessibility
  highContrast: boolean;
  dyslexiaMode: boolean;
  largeControls: boolean;
  keyboardNavigation: boolean;
  cursorThickness: "1.5px" | "3px" | "5px" | "8px";
  cursorSpeed: "instant" | "smooth" | "lazy";

  // Experimental
  subMsWpm: boolean;
  digraphHeatmap: boolean;
  aiSuggestions: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  flipColors: false,
  colorfulMode: false,
  focusMode: false,
  minimalUi: false,
  hideStatistics: false,
  reduceMotion: false,
  blurBackground: false,
  compactControls: false,

  showKeyTips: true,
  showCapsWarning: true,
  showFocusWarning: true,
  showAverage: "both",
  showLiveKeyboard: "reactive",

  animationLimit: "native",
  memoryMode: "balanced",

  highContrast: false,
  dyslexiaMode: false,
  largeControls: false,
  keyboardNavigation: true,
  cursorThickness: "1.5px",
  cursorSpeed: "smooth",

  subMsWpm: false,
  digraphHeatmap: false,
  aiSuggestions: false,
};

// Module-level global state
let globalSettings: SystemSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function applySettingsClasses(settings: SystemSettings) {
  if (typeof document === "undefined") return;

  const docEl = document.documentElement;

  // Toggle visual preferences classes
  docEl.classList.toggle("visual-flip-colors", settings.flipColors);
  docEl.classList.toggle("visual-colorful-mode", settings.colorfulMode);
  docEl.classList.toggle("visual-focus-mode", settings.focusMode);
  docEl.classList.toggle("visual-minimal-ui", settings.minimalUi);
  docEl.classList.toggle("visual-hide-stats", settings.hideStatistics);
  docEl.classList.toggle("visual-reduce-motion", settings.reduceMotion);
  docEl.classList.toggle("visual-blur-bg", settings.blurBackground);
  docEl.classList.toggle("visual-compact-controls", settings.compactControls);

  // Toggle accessibility preferences classes
  docEl.classList.toggle("accessibility-high-contrast", settings.highContrast);
  docEl.classList.toggle("accessibility-dyslexia", settings.dyslexiaMode);
  docEl.classList.toggle("accessibility-large-controls", settings.largeControls);
  docEl.classList.toggle("accessibility-keyboard-nav", settings.keyboardNavigation);

  // Apply cursor variables
  docEl.style.setProperty("--cursor-thickness", settings.cursorThickness);
  
  let caretDuration = "0.04s"; // smooth (default 40ms)
  if (settings.cursorSpeed === "instant") {
    caretDuration = "0s";
  } else if (settings.cursorSpeed === "lazy") {
    caretDuration = "0.08s"; // 80ms
  }
  docEl.style.setProperty("--cursor-speed", caretDuration);

  // Apply performance framerate limit variable
  let fpsLimit = "none";
  if (settings.animationLimit === "60") fpsLimit = "60";
  else if (settings.animationLimit === "120") fpsLimit = "120";
  else if (settings.animationLimit === "240") fpsLimit = "240";
  docEl.style.setProperty("--fps-limit", fpsLimit);
}

// Initial boot initialization on the client side
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("justtype_system_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      globalSettings = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to parse settings from localStorage", e);
  }
  applySettingsClasses(globalSettings);
  isInitialized = true;
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(globalSettings);

  useEffect(() => {
    const handler = () => {
      setSettings({ ...globalSettings });
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    globalSettings[key] = value;
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_system_settings", JSON.stringify(globalSettings));
      applySettingsClasses(globalSettings);
    }
    emit();
  }, []);

  const resetAllSettings = useCallback(() => {
    globalSettings = { ...DEFAULT_SETTINGS };
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_system_settings", JSON.stringify(globalSettings));
      applySettingsClasses(globalSettings);
      // Reset theme and layout configurations as well
      localStorage.removeItem("justtype_config_theme");
      localStorage.removeItem("justtype_config_layout");
      localStorage.removeItem("justtype_config_caret");
      localStorage.removeItem("justtype_config_font");
      
      resetTypography();
      applyTheme("cream");
    }
    emit();
  }, []);

  const importSettings = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed !== "object" || parsed === null) return false;

      // Extract only matching settings keys
      const updated: Partial<SystemSettings> = {};
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        if (key in parsed) {
          updated[key as keyof SystemSettings] = parsed[key];
        }
      });

      globalSettings = { ...globalSettings, ...updated };
      if (typeof window !== "undefined") {
        localStorage.setItem("justtype_system_settings", JSON.stringify(globalSettings));
        applySettingsClasses(globalSettings);
      }
      emit();
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportSettings = useCallback((): string => {
    return JSON.stringify(globalSettings, null, 2);
  }, []);

  return {
    settings,
    updateSetting,
    resetAllSettings,
    importSettings,
    exportSettings,
    isInitialized
  };
}
