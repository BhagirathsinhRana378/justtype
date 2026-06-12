import { ALL_NEW_THEMES } from "./all_themes_collection";

export interface ThemePreview {
  background: string;
  surface: string;
  text: string;
  primary: string;
  muted: string;
  success?: string;
  error?: string;
  warning?: string;
  ink?: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  appearance: "light" | "dark" | "midnight" | "forest" | "retro" | "minimal" | "special";
  preview: ThemePreview;
}

export const THEME_STORAGE_KEY = "justtype_config_theme";
export const DEFAULT_THEME_ID = "cream";

/**
 * HELPER: Adjust hex color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  // Ensure we have a valid hex
  if (!hex || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const resR = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  const resG = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  const resB = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

  return `#${resR.toString(16).padStart(2, "0")}${resG.toString(16).padStart(2, "0")}${resB.toString(16).padStart(2, "0")}`;
}

/**
 * HELPER: Convert Hex to RGB string
 */
function hexToRgb(hex: string): string {
  if (!hex) return "0, 0, 0";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return isNaN(r) ? "0,0,0" : `${r}, ${g}, ${b}`;
}

// Signature Themes (The official Landing + Loader identity system)
export const SIGNATURE_THEME_IDS = [
  "cream", "archive-404", "velvet-eclipse", "phantom-titanium", 
  "solar-ash", "frost-protocol", "deep-moss", "neon-cathedral", "ivory-operator"
];

const HERITAGE_THEMES: ThemeMeta[] = [
  {
    id: "cream",
    name: "Claude Cream",
    description: "Premium • Warm • Editorial • Quiet Luxury",
    appearance: "light",
    preview: {
      background: "#F7F3EB",
      surface: "#FFFDF8",
      text: "#2A241F",
      primary: "#C9794D",
      muted: "#776C63",
      success: "#5db872",
      error: "#c64545",
      warning: "#E8D7C5",
      ink: "#2A241F"
    },
  },
  {
    id: "archive-404",
    name: "Archive 404",
    description: "Classified future system • Default Dark",
    appearance: "dark",
    preview: {
      background: "#06070A",
      surface: "#0E1320",
      text: "#F3F5FF",
      primary: "#4E7BFF",
      muted: "#475569",
      error: "#FF445C"
    },
  },
  {
    id: "velvet-eclipse",
    name: "Velvet Eclipse",
    description: "Luxury + cinematic dark",
    appearance: "dark",
    preview: {
      background: "#09070B",
      surface: "#151018",
      text: "#F6F0F2",
      primary: "#D37B92",
      muted: "#7B68EE"
    },
  },
  {
    id: "phantom-titanium",
    name: "Phantom Titanium",
    description: "Precision machine aesthetic",
    appearance: "dark",
    preview: {
      background: "#0C1016",
      surface: "#141A22",
      text: "#EDF4FF",
      primary: "#7AB6FF",
      muted: "#475569"
    },
  },
  {
    id: "solar-ash",
    name: "Solar Ash",
    description: "Premium craftsmanship and warmth",
    appearance: "dark",
    preview: {
      background: "#0D0C0A",
      surface: "#181613",
      text: "#FFF3D9",
      primary: "#D4A653",
      muted: "#776C63"
    },
  },
  {
    id: "frost-protocol",
    name: "Frost Protocol",
    description: "Laboratory minimal clean",
    appearance: "light",
    preview: {
      background: "#EEF3FA",
      surface: "#FFFFFF",
      text: "#14213A",
      primary: "#58A6FF",
      muted: "#94a3b8"
    },
  },
  {
    id: "deep-moss",
    name: "Deep Moss",
    description: "Focused forest industrial",
    appearance: "dark",
    preview: {
      background: "#08110D",
      surface: "#102019",
      text: "#E8FFF0",
      primary: "#65D995",
      muted: "#588157"
    },
  },
  {
    id: "neon-cathedral",
    name: "Neon Cathedral",
    description: "Elegant cyber gothic",
    appearance: "dark",
    preview: {
      background: "#05060A",
      surface: "#0B0E17",
      text: "#F8FCFF",
      primary: "#00D9FF",
      muted: "#B34CFF"
    },
  },
  {
    id: "ivory-operator",
    name: "Ivory Operator",
    description: "Luxury notebook editorial",
    appearance: "light",
    preview: {
      background: "#F6F2EA",
      surface: "#FFFDF8",
      text: "#25211D",
      primary: "#B06B42",
      muted: "#776C63"
    },
  }
];

export const SIGNATURE_THEME_STORAGE_KEY = "justtype_signature_theme";

// Combine Heritage with the massive new collection
export const THEMES: ThemeMeta[] = [
  ...HERITAGE_THEMES,
  ...ALL_NEW_THEMES.filter(t => !HERITAGE_THEMES.some(h => h.id === t.id))
];

export function applyTheme(themeId: string) {
  if (typeof window === "undefined") return;

  const docEl = document.documentElement;

  // 1. Find the theme configuration
  let activeTheme: ThemeMeta | undefined;
  
  if (themeId.startsWith("custom-")) {
    const customConfigRaw = localStorage.getItem("justtype_custom_themes_list");
    if (customConfigRaw) {
      try {
        const list = JSON.parse(customConfigRaw);
        activeTheme = list.find((t: ThemeMeta) => t.id === themeId);
      } catch (err) {
        console.error("Failed to parse custom theme list", err);
      }
    }
  } else {
    activeTheme = THEMES.find((t) => t.id === themeId);
  }

  if (!activeTheme) {
    activeTheme = THEMES[0]; // fallback
  }

  // 2. Save active theme ID to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, activeTheme.id);
  docEl.setAttribute("data-theme", activeTheme.id);

  // 3. IF this is a signature theme, save it as the landing fallback
  if (SIGNATURE_THEME_IDS.includes(activeTheme.id)) {
    localStorage.setItem(SIGNATURE_THEME_STORAGE_KEY, activeTheme.id);
  }

  // 4. Apply its colors as inline CSS variables
  const c = activeTheme.preview;
  
  // Base Colors
  docEl.style.setProperty("--background", c.background);
  docEl.style.setProperty("--foreground", c.text);
  docEl.style.setProperty("--card", c.surface);
  
  // Calculate elevated card (slightly lighter or darker based on appearance)
  const isDark = activeTheme.appearance !== "light";
  const elevated = adjustBrightness(c.surface, isDark ? 15 : -8);
  docEl.style.setProperty("--card-elevated", elevated);
  
  // Primary & Variants
  docEl.style.setProperty("--primary", c.primary);
  docEl.style.setProperty("--primary-rgb", hexToRgb(c.primary));
  docEl.style.setProperty("--primary-hover", adjustBrightness(c.primary, -15));
  docEl.style.setProperty("--primary-disabled", isDark ? adjustBrightness(c.surface, 10) : adjustBrightness(c.surface, -10));
  
  // Typography
  docEl.style.setProperty("--ink", c.ink || c.text);
  docEl.style.setProperty("--muted", c.muted);
  docEl.style.setProperty("--muted-soft", adjustBrightness(c.muted, isDark ? -15 : 15));
  
  // Hairline Border (muted color at low opacity)
  docEl.style.setProperty("--border-hairline", `${c.muted}25`);
  
  // Status Accents
  docEl.style.setProperty("--success", c.success || "#5db872");
  docEl.style.setProperty("--error", c.error || "#c64545");
  docEl.style.setProperty("--warning", c.warning || "#d4a017");

  // Secondary Accents (Defaults if not specified)
  docEl.style.setProperty("--accent-teal", isDark ? "#2dd4bf" : "#5db8a6");
  docEl.style.setProperty("--accent-amber", isDark ? "#fbbf24" : "#e8a55a");
}

/**
 * Ensures the correct theme is applied based on the current page context.
 * Landing page and Loader only show Signature Themes.
 */
export function syncThemeContext(pathname: string) {
  if (typeof window === "undefined") return;

  const currentThemeId = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  const signatureThemeId = localStorage.getItem(SIGNATURE_THEME_STORAGE_KEY) || DEFAULT_THEME_ID;

  const isLanding = pathname === "/" || pathname === "";

  if (isLanding) {
    // Force signature theme on landing page
    // If the active theme is already a signature one, it will naturally match.
    // If not, we fallback to the last signature theme selected.
    if (!SIGNATURE_THEME_IDS.includes(currentThemeId)) {
      applyTheme(signatureThemeId);
    } else {
      applyTheme(currentThemeId);
    }
  } else {
    // App pages use the full selected theme
    applyTheme(currentThemeId);
  }
}

// Client side boot auto-loader execution block
if (typeof window !== "undefined") {
  const activeThemeId = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  applyTheme(activeThemeId);
}
