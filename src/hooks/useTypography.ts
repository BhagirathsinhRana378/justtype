import { useState, useEffect, useCallback } from "react";
import { FONT_MAP, ALL_FONTS } from "@/lib/fontRegistry";
import { loadFont, loadLocalFont, preloadAllFonts } from "@/lib/fontLoader";
import { getLocalFontsDb, saveLocalFontDb, deleteLocalFontDb, LocalFontData } from "@/lib/localFontDb";

// Module-level global state to sync across hook instances
let globalFontSize = 1.55;
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
  docEl.style.setProperty("--typing-font-size", `${size}rem`);
  
  // Resolve the actual font family CSS value
  const fontDef = FONT_MAP.get(family);
  const familyValue = fontDef ? fontDef.family : `'${family}', sans-serif`;
  docEl.style.setProperty("--typing-font-family", familyValue);

  // Apply scaling formulas
  docEl.style.setProperty("--typing-word-gap", `${(size * 0.45).toFixed(3)}rem`);
  docEl.style.setProperty("--typing-line-height", `${(size * 1.55).toFixed(3)}rem`);
  docEl.style.setProperty("--typing-cursor-height", `${(size * 1.03).toFixed(3)}rem`);
  docEl.style.setProperty("--typing-letter-spacing", "-0.015em");

  // Asynchronously trigger loading the font
  if (fontDef) {
    loadFont(fontDef);
  }
}

// Initial sync on client boot
if (typeof window !== "undefined") {
  const savedSize = localStorage.getItem("justtype_font_size");
  if (savedSize) globalFontSize = parseFloat(savedSize);
  
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
    // Reapply theme typography in case active font is custom local font
    applyTypographyStyles(globalFontSize, globalFontFamily);
    emit();
  }).catch(() => {
    dbLoaded = true;
  });
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
