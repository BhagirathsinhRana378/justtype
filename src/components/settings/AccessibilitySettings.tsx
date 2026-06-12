"use client";

import React from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";
import { ToggleSwitch } from "./VisualPreferencesSettings";
import { SegmentedControl } from "./TestExperienceSettings";

interface AccessibilitySettingsProps {
  searchQuery: string;
}

export default function AccessibilitySettings({ searchQuery }: AccessibilitySettingsProps) {
  const { settings, updateSetting } = useSettings();

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "High Contrast Mode",
      description: "Increases color contrast across the user interface for better visibility.",
      component: (
        <ToggleSwitch
          active={settings.highContrast}
          onChange={() => updateSetting("highContrast", !settings.highContrast)}
        />
      )
    },
    {
      title: "Dyslexia Mode",
      description: "Overrides the font family across the platform to OpenDyslexic to aid reading.",
      component: (
        <ToggleSwitch
          active={settings.dyslexiaMode}
          onChange={() => updateSetting("dyslexiaMode", !settings.dyslexiaMode)}
        />
      )
    },
    {
      title: "Reduced Motion",
      description: "Disables interface animations and smooth caret transitions to prevent motion sickness.",
      component: (
        <ToggleSwitch
          active={settings.reduceMotion}
          onChange={() => updateSetting("reduceMotion", !settings.reduceMotion)}
        />
      )
    },
    {
      title: "Large Controls scale",
      description: "Slightly increases the touch and click targets of form buttons and controls.",
      component: (
        <ToggleSwitch
          active={settings.largeControls}
          onChange={() => updateSetting("largeControls", !settings.largeControls)}
        />
      )
    },
    {
      title: "Keyboard Navigation shortcuts",
      description: "Enables fully focusable elements and custom accessibility keyboard shortcuts.",
      component: (
        <ToggleSwitch
          active={settings.keyboardNavigation}
          onChange={() => updateSetting("keyboardNavigation", !settings.keyboardNavigation)}
        />
      )
    },
    {
      title: "Cursor Thickness",
      description: "Adjust the visual width of the typing test indicator caret.",
      component: (
        <SegmentedControl
          selected={settings.cursorThickness}
          onChange={(val) => updateSetting("cursorThickness", val)}
          options={[
            { value: "1.5px", label: "Thin (1.5px)" },
            { value: "3px", label: "Medium (3px)" },
            { value: "5px", label: "Thick (5px)" },
            { value: "8px", label: "Block (8px)" },
          ]}
        />
      )
    },
    {
      title: "Cursor Speed",
      description: "Adjust the transition physics speed of the typing caret.",
      component: (
        <SegmentedControl
          selected={settings.cursorSpeed}
          onChange={(val) => updateSetting("cursorSpeed", val)}
          options={[
            { value: "instant", label: "Instant" },
            { value: "smooth", label: "Smooth" },
            { value: "lazy", label: "Lazy" },
          ]}
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
