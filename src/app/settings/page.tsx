"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldAlert, Check, Sparkles, Volume2, MousePointerClick, Type } from "lucide-react";
import { KeyboardLayoutType } from "@/hooks/useTypingTest";

const THEMES = [
  { id: "cream", name: "Claude Cream", desc: "Warm canvas editorial style", bg: "bg-[#faf9f5]", text: "text-[#141413]", primary: "bg-[#cc785c]" },
  { id: "charcoal", name: "Charcoal Dark", desc: "Monochrome carbon style", bg: "bg-[#121110]", text: "text-[#faf9f5]", primary: "bg-[#cc785c]" },
  { id: "cyberpunk", name: "Cyberpunk Neon", desc: "High contrast hacker mode", bg: "bg-[#0b0712]", text: "text-[#00f0ff]", primary: "bg-[#ff007f]" },
  { id: "matrix", name: "Matrix Green", desc: "Classic digital rain terminal", bg: "bg-[#000000]", text: "text-[#00ff00]", primary: "bg-[#00ff00]" },
  { id: "sakura", name: "Sakura Blush", desc: "Soft pastel cherry bloom", bg: "bg-[#fdf5f6]", text: "text-[#5c3539]", primary: "bg-[#d67b84]" },
  { id: "deepsea", name: "Deep Sea Trench", desc: "Calming ocean depth tones", bg: "bg-[#0b132b]", text: "text-[#e0e1dd]", primary: "bg-[#5bc0be]" }
];

export default function SettingsPage() {
  const [theme, setTheme] = useState("cream");
  const [layout, setLayout] = useState<KeyboardLayoutType>("qwerty");
  const [sound, setSound] = useState("click");
  const [caret, setCaret] = useState("smooth");
  const [font, setFont] = useState("sans");

  // Load configs on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTheme(localStorage.getItem("justtype_config_theme") || "cream");
      setLayout((localStorage.getItem("justtype_config_layout") || "qwerty") as KeyboardLayoutType);
      setSound(localStorage.getItem("justtype_config_sound") || "click");
      setCaret(localStorage.getItem("justtype_config_caret") || "smooth");
      setFont(localStorage.getItem("justtype_config_font") || "sans");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("justtype_config_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLayoutChange = (newLayout: KeyboardLayoutType) => {
    setLayout(newLayout);
    localStorage.setItem("justtype_config_layout", newLayout);
  };

  const handleSoundChange = (newSound: string) => {
    setSound(newSound);
    localStorage.setItem("justtype_config_sound", newSound);
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
    classes.forEach(c => {
      if (c.startsWith("font-setting-")) {
        document.documentElement.classList.remove(c);
      }
    });
    document.documentElement.classList.add(`font-setting-${newFont}`);
  };

  const handleResetData = () => {
    if (confirm("Are you absolutely sure? This will wipe out all local typing history, analytics, and preference configs!")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-hairline pb-6">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-serif text-foreground">Control Center</h1>
            <p className="text-sm text-muted">Customize typography, sounds, carets, and color themes. Persisted locally.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Settings Left Column */}
          <div className="md:col-span-2 flex flex-col gap-8">
            
            {/* Theme section */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4">
              <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Visual Themes</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex items-center justify-between p-3 rounded-md border text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      theme === t.id
                        ? "border-primary bg-background shadow-xs"
                        : "border-border-hairline bg-card hover:bg-card-elevated"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{t.name}</span>
                      <span className="text-[11px] text-muted">{t.desc}</span>
                    </div>
                    
                    {/* Visual Color swatches */}
                    <div className="flex items-center gap-1.5 border border-border-hairline p-1 rounded bg-background">
                      <span className={`w-3.5 h-3.5 rounded-full ${t.bg}`} />
                      <span className={`w-3.5 h-3.5 rounded-full ${t.primary}`} />
                      {theme === t.id && <Check className="w-3.5 h-3.5 text-primary ml-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout, Audio & Caret Options */}
            <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-6">
              
              {/* Keyboard Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Keyboard Layout</h3>
                  <p className="text-xs text-muted">Toggle mapping layout displayed on the test board.</p>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded">
                  {["qwerty", "dvorak", "colemak"].map((lay) => (
                    <button
                      key={lay}
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

              {/* Sound settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Acoustic Feedback</h3>
                    <p className="text-xs text-muted">Tactile key stroke synthesizer clicks.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded">
                  {[
                    { id: "click", label: "Click" },
                    { id: "mechanical", label: "Clack" },
                    { id: "bubble", label: "Bubble" },
                    { id: "silent", label: "Mute" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSoundChange(s.id)}
                      className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-all ${
                        sound === s.id ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caret selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-muted" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Indicator Caret</h3>
                    <p className="text-xs text-muted">Styling of the active input cursor.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded">
                  {[
                    { id: "smooth", label: "Line" },
                    { id: "block", label: "Block" },
                    { id: "underline", label: "Underline" },
                    { id: "hidden", label: "Hidden" }
                  ].map((c) => (
                    <button
                      key={c.id}
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
                  <Type className="w-4 h-4 text-muted" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Main Typography Face</h3>
                    <p className="text-xs text-muted">Changes the global application UI typeface.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 bg-background p-1 border border-border-hairline rounded">
                  {[
                    { id: "sans", label: "Sans" },
                    { id: "serif", label: "Serif" },
                    { id: "mono", label: "Mono" }
                  ].map((f) => (
                    <button
                      key={f.id}
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
              <h3 className="text-sm font-serif font-semibold text-foreground">Sandbox Preview</h3>
              <p className="text-xs text-muted">Interactive typography and color swatch preview.</p>
              
              <div className="p-4 bg-background border border-border-hairline rounded font-mono text-xs flex flex-col gap-2">
                <p className="text-muted-soft">{"/* Current config swatch */"}</p>
                <p className="text-foreground">Theme: <span className="text-primary font-bold">{theme}</span></p>
                <p className="text-foreground">Font: <span className="text-accent-teal">{font}</span></p>
                <p className="text-foreground">Sound: <span className="text-accent-amber">{sound}</span></p>
                <div className="mt-2 pt-2 border-t border-border-hairline text-[11px] leading-relaxed text-muted">
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#c64545]/5 border border-[#c64545]/20 rounded-lg p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-error">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-serif font-bold">Danger Zone</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Wiping local storage data clears all your WPM stats, digraph latency profiles, and resets configurations.
              </p>
              <button
                onClick={handleResetData}
                className="w-full py-2 bg-error hover:bg-error/90 text-white font-mono text-xs font-medium rounded-md transition-all-smooth cursor-pointer shadow-xs"
              >
                Clear Typing History
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
