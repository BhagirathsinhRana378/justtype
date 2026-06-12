export interface ThemePreview {
  background: string;
  surface: string;
  text: string;
  primary: string;
  muted: string;
  success?: string;
  error?: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  appearance: "light" | "dark" | "midnight" | "forest";
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
      success: "#5db872",
      error: "#c64545"
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
      success: "#5db872",
      error: "#c64545"
    },
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    description: "Deep saturated night tones",
    appearance: "midnight",
    preview: {
      background: "#020617",
      surface: "#0f172a",
      text: "#f1f5f9",
      primary: "#60a5fa",
      muted: "#64748b",
      success: "#4ade80",
      error: "#f43f5e"
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Refined dark evergreen",
    appearance: "forest",
    preview: {
      background: "#052e16",
      surface: "#064e3b",
      text: "#f0fdf4",
      primary: "#4ade80",
      muted: "#6ee7b7",
      success: "#22c55e",
      error: "#ef4444"
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    description: "Sleek tactical grey",
    appearance: "dark",
    preview: {
      background: "#161616",
      surface: "#262626",
      text: "#f4f4f4",
      primary: "#f5a623",
      muted: "#8d8d8d",
      success: "#43b581",
      error: "#f04747"
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Vampire dark cyber tones",
    appearance: "dark",
    preview: {
      background: "#282a36",
      surface: "#1e1f29",
      text: "#f8f8f2",
      primary: "#bd93f9",
      muted: "#6272a4",
      success: "#50fa7b",
      error: "#ff5555"
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Retro terminal digital green",
    appearance: "dark",
    preview: {
      background: "#000000",
      surface: "#111111",
      text: "#00ff00",
      primary: "#00ff00",
      muted: "#004d00",
      success: "#00ff00",
      error: "#ff0000"
    },
  },
  {
    id: "retro",
    name: "Retro Gold",
    description: "Classic warm amber paper",
    appearance: "light",
    preview: {
      background: "#ece3d4",
      surface: "#dfd5c6",
      text: "#403a35",
      primary: "#d2543e",
      muted: "#857d74",
      success: "#529964",
      error: "#b54242"
    },
  }
];

export function applyTheme(themeId: string) {
  if (typeof window === "undefined") return;

  const docEl = document.documentElement;

  // Handle custom theme overrides
  if (themeId === "custom") {
    localStorage.setItem(THEME_STORAGE_KEY, "custom");
    docEl.setAttribute("data-theme", "custom");
    const customConfig = localStorage.getItem("justtype_custom_theme_colors");
    if (customConfig) {
      try {
        const colors = JSON.parse(customConfig);
        Object.entries(colors).forEach(([key, val]) => {
          docEl.style.setProperty(`--${key}`, val as string);
          // Set support variables
          if (key === "primary") {
            // Hex to rgb conversion for hover states
            const hex = (val as string).replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
              docEl.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`);
            }
          }
        });
      } catch (err) {
        console.error("Failed to apply custom theme colors", err);
      }
    }
    return;
  }

  // Clear inline overrides from custom theme
  const customVariables = [
    "background", "foreground", "card", "card-elevated", "primary",
    "primary-rgb", "muted", "muted-soft", "border-hairline", "success", "warning", "error"
  ];
  customVariables.forEach((key) => {
    docEl.style.removeProperty(`--${key}`);
  });

  const validTheme = THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID;
  localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  docEl.setAttribute("data-theme", validTheme);
}
