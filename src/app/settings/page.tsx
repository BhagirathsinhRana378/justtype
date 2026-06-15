"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";

import TypographySettings from "@/components/settings/TypographySettings";
import ThemeSettings from "@/components/settings/ThemeSettings";
import TypingExperienceSettings from "@/components/settings/TypingExperienceSettings";
import AccessibilitySettings from "@/components/settings/AccessibilitySettings";
import VisualPreferencesSettings from "@/components/settings/VisualPreferencesSettings";
import TestExperienceSettings from "@/components/settings/TestExperienceSettings";
import PerformanceSettings from "@/components/settings/PerformanceSettings";
import ImportExportSettings from "@/components/settings/ImportExportSettings";
import ExperimentalSettings from "@/components/settings/ExperimentalSettings";
import DangerZoneSettings from "@/components/settings/DangerZoneSettings";

interface SettingsSectionProps {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function SettingsSection({ id, title, subtitle, children }: SettingsSectionProps) {
  if (!children) return null;
  return (
    <div id={id} className="flex flex-col w-full overflow-hidden select-none mb-[72px] last:mb-0">
      {/* ────────────────── SECTION TITLE & DESCRIPTION ────────────────── */}
      <div className="border-t border-border-hairline/30 pt-4 pb-2">
        <h2 className="text-[18px] font-semibold text-foreground uppercase tracking-wider font-mono">
          {title}
        </h2>
        <p className="text-[13px] text-muted-soft leading-normal mt-0.5">
          {subtitle}
        </p>
      </div>
      <div className="border-t border-border-hairline/30 flex flex-col w-full mt-1.5">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  const query = searchQuery.toLowerCase().trim();


  const handleThemeToggle = () => {
    if (typeof window !== "undefined") {
      const current = localStorage.getItem("justtype_config_theme") || "cream";
      const next = current === "cream" ? "charcoal" : "cream";
      localStorage.setItem("justtype_config_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Evaluate matches for each section to determine if its header should render
  const showFonts = useMemo(() => {
    return (
      !query ||
      [
        "font size", "control typing scale and readability. affects typing zone only.",
        "font family", "select typography for typing. previews display real letterforms for each typeface.",
        "local upload", "upload custom font files (.ttf, .woff, .woff2, .otf) to cache locally in indexeddb.",
        "live preview", "preview of past, active, and upcoming words in your current configuration."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showThemes = useMemo(() => {
    return (
      !query ||
      [
        "theme palette",
        "customize the color palette of the interface. hover to temporarily preview, click to apply.",
        "claude cream", "charcoal dark", "midnight navy", "forest green",
        "carbon", "dracula", "matrix", "retro", "custom"
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showTypingExperience = useMemo(() => {
    return (
      !query ||
      [
        "keyboard layout", "select the visual key mapping layout displayed on the test board.",
        "indicator caret style", "choose the visual rendering style of the active typing cursor caret."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showAccessibility = useMemo(() => {
    return (
      !query ||
      [
        "high contrast mode", "increases color contrast across the user interface for better visibility.",
        "dyslexia mode", "overrides the font family across the platform to opendyslexic to aid reading.",
        "reduced motion", "disables interface animations and smooth caret transitions to prevent motion sickness.",
        "large controls scale", "slightly increases the touch and click targets of form buttons and controls.",
        "keyboard navigation shortcuts", "enables fully focusable elements and custom accessibility keyboard shortcuts.",
        "cursor thickness", "adjust the visual width of the typing test indicator caret.",
        "cursor speed", "adjust the transition physics speed of the typing caret."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showVisualPreferences = useMemo(() => {
    return (
      !query ||
      [
        "flip test colors", "swaps correct and incorrect character colors on the typing test board.",
        "colorful mode", "correctly typed characters display in the primary accent color rather than standard foreground.",
        "focus mode", "fades out everything except the typing board (hiding navbar, footer, and stats) during active typing sessions.",
        "minimal ui", "simplifies the interface by hiding unnecessary helper texts, layouts, and page borders.",
        "hide live stats", "hides the real-time speed (wpm) and accuracy counters while typing.",
        "reduce motion", "disables carets smooth transitions, character fades, and other interface animations.",
        "blur inactive elements", "applies a subtle backdrop blur overlay on background page components.",
        "compact controls spacing", "reduces the padding and spacing gaps of control tabs and menu lists."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showTestExperience = useMemo(() => {
    return (
      !query ||
      [
        "show key tips", "displays shortcut key tips (e.g. [tab] to restart) at the bottom of the test area.",
        "show caps warning", "triggers a noticeable alert if you start typing a test while caps lock is turned on.",
        "show focus warning", "locks the interface and displays a blurry click-to-focus layer when the typing zone loses cursor focus.",
        "show average chart line", "select what metrics to display on the chart or analytics board as average benchmarks.",
        "live keyboard visualizer", "displays a virtual mechanical keyboard showing reactive key presses during the test."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showPerformance = useMemo(() => {
    return (
      !query ||
      [
        "framerate animation limit", "select the maximum frame rate target for the typing test caret and character transition updates.",
        "memory logging mode", "configure how aggressively the app collects garbage, caches test history, and clears telemetry logs.",
        "performance impact profile", "calculated cpu/ram telemetry footprint based on current framerate and logging configurations."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showImportExport = useMemo(() => {
    return (
      !query ||
      [
        "export configuration", "copy your current settings json object to backup or share your preferences.",
        "import configuration", "paste a valid justtype preferences json file below to instantly override settings."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showExperimental = useMemo(() => {
    return (
      !query ||
      [
        "sub-millisecond wpm telemetry", "tracks keystroke latency timing in milliseconds rather than seconds for ultra-precise wpm stats calculation.",
        "digraph heatmap tracker", "records and maps typing speeds between pairs of letters (digraphs) to pinpoint fingers weaknesses.",
        "ai typing suggestions", "enables on-screen context suggestions for pacing rhythms and correction patterns."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  const showDangerZone = useMemo(() => {
    return (
      !query ||
      [
        "reset configuration", "restores all settings, theme overrides, and typing scale preferences to their default states.",
        "clear custom fonts", "permanently deletes all locally uploaded font family files from browser indexeddb storage.",
        "clear theme favorites", "wipes all favorited theme shortcuts and resets active appearance to claude cream."
      ].some((text) => text.includes(query))
    );
  }, [query]);

  if (!mounted) {
    return (
      <div className="flex-1 w-full bg-background pb-24 overflow-hidden flex items-center justify-center min-h-[calc(100vh-4rem)] font-mono text-xs text-muted-soft">
        Initializing settings dashboard...
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background pb-24 overflow-hidden">
      {/* ──────────────────────── STICKY UTILITY BAR ──────────────────────── */}
      <div className="sticky top-0 z-50 bg-background/95 border-b border-border-hairline h-auto min-h-16 flex items-center justify-between mb-[48px] overflow-hidden py-3 sm:py-0">
        <div className="max-w-[1400px] w-[90%] sm:w-[85%] mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between h-full">
          {/* Search Box (320px) */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border-hairline rounded-[6px] outline-none font-mono text-foreground placeholder:text-muted-soft focus:border-primary/50"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-2 shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("import-export-section");
                if (el) el.scrollIntoView({ behavior: "auto" });
              }}
              className="px-2.5 py-1.5 border border-border-hairline hover:border-primary/30 rounded text-foreground transition-colors cursor-pointer"
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("import-export-section");
                if (el) el.scrollIntoView({ behavior: "auto" });
              }}
              className="px-2.5 py-1.5 border border-border-hairline hover:border-primary/30 rounded text-foreground transition-colors cursor-pointer"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("danger-zone-section");
                if (el) el.scrollIntoView({ behavior: "auto" });
              }}
              className="px-2.5 py-1.5 border border-border-hairline hover:border-error/30 hover:text-error rounded text-foreground transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleThemeToggle}
              className="px-2.5 py-1.5 bg-primary text-background font-semibold rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              Theme Switch
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="max-w-[1400px] w-[90%] sm:w-[85%] mx-auto flex flex-col">
        <SettingsSection
          id="fonts-section"
          title="1. Fonts"
          subtitle="Configure the typing font scale, select typing typography registry, or upload custom local webfonts."
        >
          {showFonts && <TypographySettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="themes-section"
          title="2. Themes"
          subtitle="Browse appearance presets, toggle favorite lists, and preview colors in real-time."
        >
          {showThemes && <ThemeSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="typing-experience-section"
          title="3. Typing Experience"
          subtitle="Select keyboard mapping layout and configure active test cursor options."
        >
          {showTypingExperience && <TypingExperienceSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="accessibility-section"
          title="4. Accessibility"
          subtitle="Toggle high contrast, dyslexia fonts, large controls, reduced animations, and cursor parameters."
        >
          {showAccessibility && <AccessibilitySettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="visual-preferences-section"
          title="5. Visual Preferences"
          subtitle="Customise focus zones, layout elements, stat visibility, and spacing densities."
        >
          {showVisualPreferences && <VisualPreferencesSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="test-experience-section"
          title="6. Test Behavior"
          subtitle="Configure shortcut labels, caps lock alerts, loss-of-focus warning overlay, and averages tracking."
        >
          {showTestExperience && <TestExperienceSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="performance-section"
          title="7. Performance"
          subtitle="Set maximum rendering refresh rates and telemetry memory footprint profiles."
        >
          {showPerformance && <PerformanceSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="import-export-section"
          title="8. Import / Export"
          subtitle="Copy preferences configuration JSON string or paste existing swatches to replicate settings."
        >
          {showImportExport && <ImportExportSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="experimental-section"
          title="9. Experimental Features"
          subtitle="Enable new features, high resolution timing metrics, and advanced user analytics."
        >
          {showExperimental && <ExperimentalSettings searchQuery={searchQuery} />}
        </SettingsSection>

        <SettingsSection
          id="danger-zone-section"
          title="10. Danger Zone"
          subtitle="Wipe configurations, clean local files, and reset active custom properties."
        >
          {showDangerZone && <DangerZoneSettings searchQuery={searchQuery} />}
        </SettingsSection>
      </div>
    </div>
  );
}
