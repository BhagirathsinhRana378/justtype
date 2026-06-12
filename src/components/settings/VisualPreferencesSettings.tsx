"use client";

import React from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";

export const ToggleSwitch = ({ active, onChange }: { active: boolean; onChange: () => void }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative select-none ${
        active ? "bg-primary" : "bg-card border border-border-hairline/60"
      }`}
    >
      <span 
        className={`block w-3.5 h-3.5 rounded-full transition-transform duration-100 ${
          active ? "translate-x-4 bg-background" : "translate-x-0 bg-muted"
        }`}
      />
    </button>
  );
};

interface VisualPreferencesSettingsProps {
  searchQuery: string;
}

export default function VisualPreferencesSettings({ searchQuery }: VisualPreferencesSettingsProps) {
  const { settings, updateSetting } = useSettings();

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "Flip Test Colors",
      description: "Swaps correct and incorrect character colors on the typing test board.",
      component: (
        <ToggleSwitch
          active={settings.flipColors}
          onChange={() => updateSetting("flipColors", !settings.flipColors)}
        />
      )
    },
    {
      title: "Colorful Mode",
      description: "Correctly typed characters display in the primary accent color rather than standard foreground.",
      component: (
        <ToggleSwitch
          active={settings.colorfulMode}
          onChange={() => updateSetting("colorfulMode", !settings.colorfulMode)}
        />
      )
    },
    {
      title: "Focus Mode",
      description: "Fades out everything except the typing board (hiding navbar, footer, and stats) during active typing sessions.",
      component: (
        <ToggleSwitch
          active={settings.focusMode}
          onChange={() => updateSetting("focusMode", !settings.focusMode)}
        />
      )
    },
    {
      title: "Minimal UI",
      description: "Simplifies the interface by hiding unnecessary helper texts, layouts, and page borders.",
      component: (
        <ToggleSwitch
          active={settings.minimalUi}
          onChange={() => updateSetting("minimalUi", !settings.minimalUi)}
        />
      )
    },
    {
      title: "Hide Live Stats",
      description: "Hides the real-time speed (WPM) and accuracy counters while typing.",
      component: (
        <ToggleSwitch
          active={settings.hideStatistics}
          onChange={() => updateSetting("hideStatistics", !settings.hideStatistics)}
        />
      )
    },
    {
      title: "Reduce Motion",
      description: "Disables carets smooth transitions, character fades, and other interface animations.",
      component: (
        <ToggleSwitch
          active={settings.reduceMotion}
          onChange={() => updateSetting("reduceMotion", !settings.reduceMotion)}
        />
      )
    },
    {
      title: "Blur Inactive Elements",
      description: "Applies a subtle backdrop blur overlay on background page components.",
      component: (
        <ToggleSwitch
          active={settings.blurBackground}
          onChange={() => updateSetting("blurBackground", !settings.blurBackground)}
        />
      )
    },
    {
      title: "Compact Controls spacing",
      description: "Reduces the padding and spacing gaps of control tabs and menu lists.",
      component: (
        <ToggleSwitch
          active={settings.compactControls}
          onChange={() => updateSetting("compactControls", !settings.compactControls)}
        />
      )
    }
  ];

  const filteredRows = allRows.filter(
    (row) =>
      !query ||
      row.title.toLowerCase().includes(query) ||
      row.description.toLowerCase().includes(query)
  );

  if (filteredRows.length === 0) return null;

  return (
    <div className="flex flex-col w-full select-none">
      {filteredRows.map((row) => (
        <SettingRow key={row.title} title={row.title} description={row.description}>
          {row.component}
        </SettingRow>
      ))}
    </div>
  );
}
