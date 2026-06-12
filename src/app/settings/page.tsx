"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldAlert, Check, Sparkles, MousePointerClick, Type } from "lucide-react";
import { KeyboardLayoutType } from "@/hooks/useTypingTest";
import { THEMES, ThemeMeta, applyTheme, DEFAULT_THEME_ID, THEME_STORAGE_KEY } from "@/utils/themes";
import SectionHeader from "@/components/SectionHeader";
import ConfirmDialog from "@/components/ConfirmDialog";

import TypographySettings from "@/components/settings/TypographySettings";

function ThemePreviewCard({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeMeta;
  active: boolean;
  onSelect: () => void;
}) {
  const p = theme.preview;
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Activate ${theme.name} theme`}
      className={`relative rounded-lg border text-left overflow-hidden transition-all duration-200 cursor-pointer ${
        active ? "border-primary ring-2 ring-primary" : "border-border-hairline hover:border-primary/40"
      }`}
    >
      {/* Live mini mockup of a typing line rendered in the theme's actual colors */}
      <div className="p-3" style={{ backgroundColor: p.background }} aria-hidden="true">
        <div
          className="rounded-md p-2.5 border"
          style={{ backgroundColor: p.surface, borderColor: `${p.muted}33` }}
        >
          <p className="font-mono text-[11px] leading-relaxed whitespace-nowrap overflow-hidden">
            <span style={{ color: p.text }}>the quick </span>
            <span style={{ color: p.primary }}>brown</span>
            <span style={{ color: p.muted }}> fox jumps</span>
            <span
              className="inline-block w-[2px] h-[11px] ml-[1px] align-middle caret-blink"
              style={{ backgroundColor: p.primary }}
            />
          </p>
          <div className="flex gap-1 mt-2">
            <span className="h-1 w-8 rounded-full" style={{ backgroundColor: p.primary }} />
            <span className="h-1 w-4 rounded-full" style={{ backgroundColor: `${p.muted}66` }} />
          </div>
        </div>
      </div>
      <div className="px-3 py-2.5 bg-card border-t border-border-hairline flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-foreground">{theme.name}</span>
          <span className="text-[10px] text-muted truncate">{theme.description}</span>
        </div>
        {active && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const [theme, setTheme] = useState(DEFAULT_THEME_ID);
  const [layout, setLayout] = useState<KeyboardLayoutType>("qwerty");
  const [caret, setCaret] = useState("smooth");
  const [font, setFont] = useState("sans");
  const [resetOpen, setResetOpen] = useState(false);

  // Load configs on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTheme(localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID);
      setLayout((localStorage.getItem("justtype_config_layout") || "qwerty") as KeyboardLayoutType);
      setCaret(localStorage.getItem("justtype_config_caret") || "smooth");
      setFont(localStorage.getItem("justtype_config_font") || "sans");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLayoutChange = (newLayout: KeyboardLayoutType) => {
    setLayout(newLayout);
    localStorage.setItem("justtype_config_layout", newLayout);
  };



  const handleCaretChange = (newCaret: string) => {
    setCaret(newCaret);
    localStorage.setItem("justtype_config_caret", newCaret);
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    localStorage.setItem("justtype_config_font", newFont);
    // Replace font-setting classes
    const classes = Array.from(document.documentElement.classList);
    classes.forEach((c) => {
      if (c.startsWith("font-setting-")) {
        document.documentElement.classList.remove(c);
      }
    });
    document.documentElement.classList.add(`font-setting-${newFont}`);
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const lightThemes = THEMES.filter((t) => t.appearance === "light");
  const darkThemes = THEMES.filter((t) => t.appearance === "dark");

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1344px] mx-auto flex flex-col gap-10">
        <SectionHeader
          icon={Settings}
          title="Control Center"
          subtitle="Customize typography, carets, and color themes. Persisted locally."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Settings Left Column */}
          <div className="md:col-span-2 flex flex-col gap-8">
            {/* Theme section */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-5">
              <h2 className="text-lg font-serif font-normal text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                <span>Visual Themes</span>
              </h2>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted-soft">Light</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lightThemes.map((t) => (
                    <ThemePreviewCard key={t.id} theme={t} active={theme === t.id} onSelect={() => handleThemeChange(t.id)} />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted-soft">Dark</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {darkThemes.map((t) => (
                    <ThemePreviewCard key={t.id} theme={t} active={theme === t.id} onSelect={() => handleThemeChange(t.id)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Typography Font System */}
            <TypographySettings />

            {/* Layout, Audio & Caret Options */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-6">
              {/* Keyboard Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Keyboard Layout</h3>
                  <p className="text-xs text-muted">Toggle mapping layout displayed on the test board.</p>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded" role="radiogroup" aria-label="Keyboard layout">
                  {["qwerty", "dvorak", "colemak"].map((lay) => (
                    <button
                      key={lay}
                      role="radio"
                      aria-checked={layout === lay}
                      onClick={() => handleLayoutChange(lay as KeyboardLayoutType)}
                      className={`px-3 py-1.5 text-xs font-mono rounded capitalize cursor-pointer transition-all ${
                        layout === lay ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {lay}
                    </button>
                  ))}
                </div>
              </div>



              {/* Caret selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-muted" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Indicator Caret</h3>
                    <p className="text-xs text-muted">Styling of the active input cursor.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded" role="radiogroup" aria-label="Caret style">
                  {[
                    { id: "smooth", label: "Line" },
                    { id: "block", label: "Block" },
                    { id: "underline", label: "Underline" },
                    { id: "hidden", label: "Hidden" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      role="radio"
                      aria-checked={caret === c.id}
                      onClick={() => handleCaretChange(c.id)}
                      className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-all ${
                        caret === c.id ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Face */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Main Typography Face</h3>
                    <p className="text-xs text-muted">Changes the global application UI typeface.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded" role="radiogroup" aria-label="Typeface">
                  {[
                    { id: "sans", label: "Sans" },
                    { id: "serif", label: "Serif" },
                    { id: "mono", label: "Mono" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      role="radio"
                      aria-checked={font === f.id}
                      onClick={() => handleFontChange(f.id)}
                      className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-all ${
                        font === f.id ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Right Column (Danger zone / info) */}
          <div className="flex flex-col gap-6">
            {/* Live Preview Card */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-3">
              <h3 className="text-sm font-serif font-normal text-foreground">Sandbox Preview</h3>
              <p className="text-xs text-muted">Interactive typography and color swatch preview.</p>

              <div className="p-4 bg-background border border-border-hairline rounded font-mono text-xs flex flex-col gap-2">
                <p className="text-muted-soft">{"/* Current config swatch */"}</p>
                <p className="text-foreground">
                  Theme: <span className="text-primary font-bold">{theme}</span>
                </p>
                <p className="text-foreground">
                  Font: <span className="text-accent-teal">{font}</span>
                </p>

                <div className="mt-2 pt-2 border-t border-border-hairline text-[11px] leading-relaxed text-muted">
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-error/5 border border-error/20 rounded-lg p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-error">
                <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                <h3 className="text-sm font-serif font-normal">Danger Zone</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Wiping local storage data clears all your WPM stats, digraph latency profiles, and resets configurations.
              </p>
              <button
                onClick={() => setResetOpen(true)}
                className="w-full py-2 bg-error hover:bg-error/90 text-white font-mono text-xs font-medium rounded-md transition-all-smooth cursor-pointer"
              >
                Clear Typing History
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        danger
        title="Wipe all local data?"
        description="This will permanently delete all typing history, analytics, and preference configs stored in this browser. This cannot be undone."
        confirmLabel="Wipe everything"
        cancelLabel="Keep my data"
        onConfirm={handleResetData}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
