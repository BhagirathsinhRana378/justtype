export interface ThemePreview {
  background: string;
  surface: string;
  text: string;
  primary: string;
  muted: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  appearance: "light" | "dark";
  preview: ThemePreview;
}

export const THEME_STORAGE_KEY = "justtype_config_theme";
export const DEFAULT_THEME_ID = "cream";

export const THEMES: ThemeMeta[] = [
  {
    id: "cream",
    name: "Claude Cream",
    description: "Warm canvas editorial style",
    appearance: "light",
    preview: {
      background: "#faf9f5",
      surface: "#efe9de",
      text: "#141413",
      primary: "#cc785c",
      muted: "#8e8b82",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal Dark",
    description: "Monochrome carbon style",
    appearance: "dark",
    preview: {
      background: "#121110",
      surface: "#1a1917",
      text: "#faf9f5",
      primary: "#cc785c",
      muted: "#6c6a64",
    },
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    description: "Deep saturated night tones",
    appearance: "dark",
    preview: {
      background: "#020617",
      surface: "#0f172a",
      text: "#f1f5f9",
      primary: "#60a5fa",
      muted: "#64748b",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Refined dark evergreen",
    appearance: "dark",
    preview: {
      background: "#052e16",
      surface: "#064e3b",
      text: "#f0fdf4",
      primary: "#4ade80",
      muted: "#6ee7b7",
    },
  },
];

export function applyTheme(themeId: string) {
  if (typeof window === "undefined") return;
  const validTheme = THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID;
  localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  document.documentElement.setAttribute("data-theme", validTheme);
}
