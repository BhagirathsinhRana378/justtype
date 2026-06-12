export interface FontDef {
  name: string;
  family: string;
  category: "mono" | "sans" | "readable" | "display";
  source: "google" | "fontsource" | "system";
  fontsourcePkg?: string; // package name on Fontsource
}

export const MONO_FONTS: FontDef[] = [
  { name: "Roboto Mono", family: "'Roboto Mono', monospace", category: "mono", source: "google" },
  { name: "IBM Plex Mono", family: "'IBM Plex Mono', monospace", category: "mono", source: "google" },
  { name: "JetBrains Mono", family: "'JetBrains Mono', monospace", category: "mono", source: "google" },
  { name: "Cascadia Mono", family: "'Cascadia Mono', monospace", category: "mono", source: "fontsource", fontsourcePkg: "cascadia-code" },
  { name: "Fira Code", family: "'Fira Code', monospace", category: "mono", source: "google" },
  { name: "Source Code Pro", family: "'Source Code Pro', monospace", category: "mono", source: "google" },
  { name: "Hack", family: "'Hack', monospace", category: "mono", source: "fontsource", fontsourcePkg: "hack" },
  { name: "Geist Mono", family: "'Geist Mono', monospace", category: "mono", source: "google" },
  { name: "Ubuntu Mono", family: "'Ubuntu Mono', monospace", category: "mono", source: "google" },
  { name: "CommitMono", family: "'CommitMono', monospace", category: "mono", source: "fontsource", fontsourcePkg: "commitmono" },
  { name: "Courier", family: "'Courier New', Courier, monospace", category: "mono", source: "system" },
  { name: "Iosevka", family: "'Iosevka', monospace", category: "mono", source: "fontsource", fontsourcePkg: "iosevka" },
  { name: "Inconsolata", family: "'Inconsolata', monospace", category: "mono", source: "google" }
];

export const SANS_FONTS: FontDef[] = [
  { name: "Inter Tight", family: "'Inter Tight', sans-serif", category: "sans", source: "google" },
  { name: "Helvetica", family: "Helvetica, Arial, sans-serif", category: "sans", source: "system" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif", category: "sans", source: "google" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", category: "sans", source: "google" },
  { name: "Lato", family: "'Lato', sans-serif", category: "sans", source: "google" },
  { name: "Roboto", family: "'Roboto', sans-serif", category: "sans", source: "google" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif", category: "sans", source: "google" },
  { name: "Titillium", family: "'Titillium Web', sans-serif", category: "sans", source: "google" },
  { name: "Nunito", family: "'Nunito', sans-serif", category: "sans", source: "google" },
  { name: "Oxygen", family: "'Oxygen', sans-serif", category: "sans", source: "google" },
  { name: "Geist", family: "'Geist', sans-serif", category: "sans", source: "google" }
];

export const READABLE_FONTS: FontDef[] = [
  { name: "Atkinson Hyperlegible", family: "'Atkinson Hyperlegible', sans-serif", category: "readable", source: "google" },
  { name: "Lexend Deca", family: "'Lexend Deca', sans-serif", category: "readable", source: "google" },
  { name: "Open Dyslexic", family: "'OpenDyslexic', sans-serif", category: "readable", source: "fontsource", fontsourcePkg: "opendyslexic" },
  { name: "Comfortaa", family: "'Comfortaa', sans-serif", category: "readable", source: "google" },
  { name: "Kanit", family: "'Kanit', sans-serif", category: "readable", source: "google" }
];

export const DISPLAY_FONTS: FontDef[] = [
  { name: "Georgia", family: "Georgia, serif", category: "display", source: "system" },
  { name: "Proto", family: "'Proto', sans-serif", category: "display", source: "fontsource", fontsourcePkg: "proto" },
  { name: "Mononoki", family: "'mononoki', monospace", category: "display", source: "fontsource", fontsourcePkg: "mononoki" },
  { name: "Sarabun", family: "'Sarabun', sans-serif", category: "display", source: "google" },
  { name: "Boon", family: "'Boon', sans-serif", category: "display", source: "fontsource", fontsourcePkg: "boon" }
];

export const ALL_FONTS: FontDef[] = [
  ...MONO_FONTS,
  ...SANS_FONTS,
  ...READABLE_FONTS,
  ...DISPLAY_FONTS
];

export const FONT_MAP = new Map<string, FontDef>(
  ALL_FONTS.map(f => [f.name, f])
);
