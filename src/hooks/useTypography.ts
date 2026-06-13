import { useState, useEffect, useCallback } from "react";
import { FONT_MAP, ALL_FONTS } from "@/lib/fontRegistry";
import { loadFont, loadLocalFont, preloadAllFonts } from "@/lib/fontLoader";
import { getLocalFontsDb, saveLocalFontDb, deleteLocalFontDb, LocalFontData } from "@/lib/localFontDb";

// Module-level global state to sync across hook instances
let globalFontSize = 1.0;
let globalFontFamily = "Roboto Mono";
let globalLocalFonts: LocalFontData[] = [];
let dbLoaded = false;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function applyTypographyStyles(size: number, family: string) {
  if (typeof document === "undefined") return;

  const docEl = document.documentElement;
  
  // Scale dynamically relative to responsive base size
  docEl.style.setProperty("--typing-font-size", `calc(${size} * var(--typing-font-size-base))`);
  
  // Resolve the actual font family CSS value
  const fontDef = FONT_MAP.get(family);
  const familyValue = fontDef ? fontDef.family : `'${family}', sans-serif`;
  docEl.style.setProperty("--typing-font-family", familyValue);

  // Apply original scaling parameters
  docEl.style.setProperty("--typing-word-gap", "0.3em");
  docEl.style.setProperty("--typing-line-height", "1.7");
  docEl.style.setProperty("--typing-cursor-height", "1.22em");
  docEl.style.setProperty("--typing-letter-spacing", "normal");

  // Asynchronously trigger loading the font
  if (fontDef) {
    loadFont(fontDef);
  }
}

// Initial sync on client boot
if (typeof window !== "undefined") {
  const savedSize = localStorage.getItem("justtype_font_size");
  if (savedSize) {
    const parsed = parseFloat(savedSize);
    // Migrate old default (1.55) or values set in absolute rems to 1.0 baseline
    if (parsed === 1.55 || parsed > 2.0) {
      globalFontSize = 1.0;
      localStorage.setItem("justtype_font_size", "1.0");
    } else {
      globalFontSize = parsed;
    }
  } else {
    globalFontSize = 1.0;
  }
  
  const savedFamily = localStorage.getItem("justtype_font_family");
  if (savedFamily) globalFontFamily = savedFamily;

  applyTypographyStyles(globalFontSize, globalFontFamily);
  
  // Preload all registry fonts
  preloadAllFonts(ALL_FONTS);
  
  // Load custom local fonts from IndexedDB
  getLocalFontsDb().then((fonts) => {
    globalLocalFonts = fonts;
    dbLoaded = true;
    fonts.forEach((f) => {
      loadLocalFont(f.name, f.dataUrl);
    });
    applyTypographyStyles(globalFontSize, globalFontFamily);
    emit();
  }).catch(() => {
    dbLoaded = true;
  });
}

export function resetTypography() {
  globalFontSize = 1.0;
  globalFontFamily = "Roboto Mono";
  if (typeof window !== "undefined") {
    localStorage.removeItem("justtype_font_size");
    localStorage.removeItem("justtype_font_family");
    applyTypographyStyles(globalFontSize, globalFontFamily);
  }
  emit();
}

export function useTypography() {
  const [fontSize, setFontSizeState] = useState(globalFontSize);
  const [fontFamily, setFontFamilyState] = useState(globalFontFamily);
  const [localFonts, setLocalFontsState] = useState(globalLocalFonts);

  useEffect(() => {
    const handler = () => {
      setFontSizeState(globalFontSize);
      setFontFamilyState(globalFontFamily);
      setLocalFontsState([...globalLocalFonts]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const updateFontSize = useCallback((size: number) => {
    globalFontSize = parseFloat(size.toFixed(2));
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_font_size", globalFontSize.toString());
      applyTypographyStyles(globalFontSize, globalFontFamily);
    }
    emit();
  }, []);

  const updateFontFamily = useCallback((family: string) => {
    globalFontFamily = family;
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_font_family", family);
      applyTypographyStyles(globalFontSize, globalFontFamily);
    }
    emit();
  }, []);

  const addLocalFont = useCallback(async (name: string, filename: string, dataUrl: string) => {
    await saveLocalFontDb(name, filename, dataUrl);
    loadLocalFont(name, dataUrl);
    
    const fonts = await getLocalFontsDb();
    globalLocalFonts = fonts;
    emit();
  }, []);

  const removeLocalFont = useCallback(async (name: string) => {
    await deleteLocalFontDb(name);
    if (typeof document !== "undefined") {
      const id = `font-local-${name.replace(/ /g, "-").toLowerCase()}`;
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    
    if (globalFontFamily === name) {
      updateFontFamily("Roboto Mono");
    }

    const fonts = await getLocalFontsDb();
    globalLocalFonts = fonts;
    emit();
  }, [updateFontFamily]);

  return {
    fontSize,
    fontFamily,
    localFonts,
    updateFontSize,
    updateFontFamily,
    addLocalFont,
    removeLocalFont,
    dbLoaded
  };
}
