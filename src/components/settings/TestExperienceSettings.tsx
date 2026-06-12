"use client";

import React from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";
import { ToggleSwitch } from "./VisualPreferencesSettings";

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex bg-background border border-border-hairline p-0.5 rounded-lg font-mono text-[11.5px] select-none">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-[6px] text-[11.5px] font-semibold cursor-pointer transition-colors capitalize select-none ${
              isActive
                ? "bg-primary text-background font-bold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface TestExperienceSettingsProps {
  searchQuery: string;
}

export default function TestExperienceSettings({ searchQuery }: TestExperienceSettingsProps) {
  const { settings, updateSetting } = useSettings();

  const query = searchQuery.toLowerCase().trim();

  const groups = [
    {
      name: "Visual",
      rows: [
        {
          title: "Show Key Tips",
          description: "Displays shortcut key tips (e.g. [tab] to restart) at the bottom of the test area.",
          component: (
            <ToggleSwitch
              active={settings.showKeyTips}
              onChange={() => updateSetting("showKeyTips", !settings.showKeyTips)}
            />
          )
        }
      ]
    },
    {
      name: "Warnings",
      rows: [
        {
          title: "Show Caps Warning",
          description: "Triggers a noticeable alert if you start typing a test while Caps Lock is turned on.",
          component: (
            <ToggleSwitch
              active={settings.showCapsWarning}
              onChange={() => updateSetting("showCapsWarning", !settings.showCapsWarning)}
            />
          )
        },
        {
          title: "Show Focus Warning",
          description: "Locks the interface and displays a blurry click-to-focus layer when the typing zone loses cursor focus.",
          component: (
            <ToggleSwitch
              active={settings.showFocusWarning}
              onChange={() => updateSetting("showFocusWarning", !settings.showFocusWarning)}
            />
          )
        }
      ]
    },
    {
      name: "Keyboard",
      rows: [
        {
          title: "Live Keyboard Visualizer",
          description: "Displays a virtual mechanical keyboard showing reactive key presses during the test.",
          component: (
            <SegmentedControl
              selected={settings.showLiveKeyboard}
              onChange={(val) => updateSetting("showLiveKeyboard", val)}
              options={[
                { value: "off", label: "Off" },
                { value: "static", label: "Static" },
                { value: "reactive", label: "Reactive" },
              ]}
            />
          )
        }
      ]
    },
    {
      name: "Charts",
      rows: [
        {
          title: "Show Average Chart Line",
          description: "Select what metrics to display on the chart or analytics board as average benchmarks.",
          component: (
            <SegmentedControl
              selected={settings.showAverage}
              onChange={(val) => updateSetting("showAverage", val)}
              options={[
                { value: "speed", label: "Speed" },
                { value: "accuracy", label: "Accuracy" },
                { value: "both", label: "Both" },
                { value: "off", label: "Off" },
              ]}
            />
          )
        }
      ]
    }
  ];

  // Apply search query filtering within groups
  const filteredGroups = groups
    .map((group) => {
      const matchingRows = group.rows.filter(
        (row) =>
          !query ||
          row.title.toLowerCase().includes(query) ||
          row.description.toLowerCase().includes(query)
      );
      return { ...group, rows: matchingRows };
    })
    .filter((group) => group.rows.length > 0);

  if (filteredGroups.length === 0) return null;

  return (
    <div className="flex flex-col w-full select-none gap-4">
      {filteredGroups.map((group) => (
        <div key={group.name} className="flex flex-col w-full">
          {/* Subheading */}
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted-soft pt-3 pb-1 border-b border-border-hairline/20">
            {group.name}
          </div>
          {group.rows.map((row) => (
            <SettingRow key={row.title} title={row.title} description={row.description}>
              {row.component}
            </SettingRow>
          ))}
        </div>
      ))}
    </div>
  );
}
