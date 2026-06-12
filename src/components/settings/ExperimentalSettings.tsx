"use client";

import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";
import { ToggleSwitch } from "./VisualPreferencesSettings";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExperimentalSettingsProps {
  searchQuery: string;
}

export default function ExperimentalSettings({ searchQuery }: ExperimentalSettingsProps) {
  const { settings, updateSetting } = useSettings();
  const [expanded, setExpanded] = useState(false);

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "Sub-Millisecond WPM Telemetry",
      description: "Tracks keystroke latency timing in milliseconds rather than seconds for ultra-precise WPM stats calculation.",
      component: (
        <ToggleSwitch
          active={settings.subMsWpm}
          onChange={() => updateSetting("subMsWpm", !settings.subMsWpm)}
        />
      )
    },
    {
      title: "Digraph Heatmap Tracker",
      description: "Records and maps typing speeds between pairs of letters (digraphs) to pinpoint fingers weaknesses.",
      component: (
        <ToggleSwitch
          active={settings.digraphHeatmap}
          onChange={() => updateSetting("digraphHeatmap", !settings.digraphHeatmap)}
        />
      )
    },
    {
      title: "AI Typing Suggestions",
      description: "Enables on-screen context suggestions for pacing rhythms and correction patterns.",
      component: (
        <ToggleSwitch
          active={settings.aiSuggestions}
          onChange={() => updateSetting("aiSuggestions", !settings.aiSuggestions)}
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

  // If there's an active search query, auto-expand to show matching rows!
  const isCurrentlyExpanded = expanded || !!query;

  if (filteredRows.length === 0) return null;

  return (
    <div className="flex flex-col w-full select-none">
      {/* Accordion header button */}
      {!query && (
        <div className="flex justify-end pt-2 pb-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-mono bg-card border border-border-hairline rounded-[6px] hover:border-primary/30 transition-colors cursor-pointer text-foreground"
          >
            {isCurrentlyExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-muted-soft" />
                <span>Collapse Features</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-muted-soft" />
                <span>Expand Features</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Experimental Rows */}
      {isCurrentlyExpanded && (
        <div className="flex flex-col w-full mt-2">
          {filteredRows.map((row) => (
            <SettingRow key={row.title} title={row.title} description={row.description}>
              {row.component}
            </SettingRow>
          ))}
        </div>
      )}
    </div>
  );
}
