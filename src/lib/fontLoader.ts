import { FontDef } from "./fontRegistry";

const loadedFontIds = new Set<string>();

export function loadFont(fontDef: FontDef) {
  if (fontDef.source === "system") return;

  const id = `font-link-${fontDef.name.replace(/ /g, "-").toLowerCase()}`;
  if (loadedFontIds.has(id) || (typeof document !== "undefined" && document.getElementById(id))) {
    loadedFontIds.add(id);
    return;
  }

  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";

  if (fontDef.source === "google") {
    const googleName = fontDef.name.replace(/ /g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@300;400;500;600;700&display=swap`;
  } else if (fontDef.source === "fontsource" && fontDef.fontsourcePkg) {
    link.href = `https://cdn.jsdelivr.net/npm/@fontsource/${fontDef.fontsourcePkg}/index.css`;
  }

  document.head.appendChild(link);
  loadedFontIds.add(id);
}

export function loadLocalFont(name: string, dataUrl: string) {
  if (typeof document === "undefined") return;

  const id = `font-local-${name.replace(/ /g, "-").toLowerCase()}`;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @font-face {
      font-family: '${name}';
      src: url('${dataUrl}') format('woff2'),
           url('${dataUrl}') format('woff'),
           url('${dataUrl}') format('truetype'),
           url('${dataUrl}') format('opentype');
      font-weight: 300 800;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

export function preloadAllFonts(fonts: FontDef[]) {
  if (typeof document === "undefined") return;

  // 1. Preload Google Fonts in optimized chunks of max 5 families each
  const googleFonts = fonts.filter((f) => f.source === "google");
  const CHUNK_SIZE = 5;
  for (let i = 0; i < googleFonts.length; i += CHUNK_SIZE) {
    const chunk = googleFonts.slice(i, i + CHUNK_SIZE);
    const id = `google-fonts-preloaded-bundle-${i}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      const familyParams = chunk
        .map((f) => `family=${f.name.replace(/ /g, "+")}:wght@300;400;500;600;700`)
        .join("&");
      link.href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
      document.head.appendChild(link);
    }
    // Mark these fonts as loaded so loadFont doesn't trigger individual link appends
    chunk.forEach((f) => {
      const fontId = `font-link-${f.name.replace(/ /g, "-").toLowerCase()}`;
      loadedFontIds.add(fontId);
    });
  }

  // 2. Preload Fontsource fonts
  const fontsourceFonts = fonts.filter((f) => f.source === "fontsource");
  fontsourceFonts.forEach((f) => {
    loadFont(f);
  });
}

