"use client";

import React, { useMemo } from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";
import { SegmentedControl } from "./TestExperienceSettings";

interface PerformanceSettingsProps {
  searchQuery: string;
}

export default function PerformanceSettings({ searchQuery }: PerformanceSettingsProps) {
  const { settings, updateSetting } = useSettings();

  const query = searchQuery.toLowerCase().trim();

  // Dynamically calculate the performance and memory footprint details
  const performanceImpact = useMemo(() => {
    let cpuText = "Normal";
    let ramText = "Balanced";
    let desc = "Standard telemetry and hardware rendering active.";

    if (settings.animationLimit === "60") {
      cpuText = "Extremely Low";
      desc = "Limits typing rendering frames to 60fps, saving significant laptop battery.";
    } else if (settings.animationLimit === "120" || settings.animationLimit === "240") {
      cpuText = "Moderate";
      desc = "Demands high GPU refresh rates for sub-millisecond typing cursor updates.";
    }

    if (settings.memoryMode === "performance") {
      ramText = "Compressed";
      desc += " Truncates deep analysis keystroke buffers during long typing tests.";
    } else if (settings.memoryMode === "maximum") {
      ramText = "Ultra Low (Wiped)";
      desc = "Forces aggressive garbage collection, disables all optional typing animations, and wipes history logging.";
    }

    return { cpuText, ramText, desc };
  }, [settings.animationLimit, settings.memoryMode]);

  const allRows = [
    {
      title: "Framerate Animation Limit",
      description: "Select the maximum frame rate target for the typing test caret and character transition updates.",
      component: (
        <SegmentedControl
          selected={settings.animationLimit}
          onChange={(val) => updateSetting("animationLimit", val)}
          options={[
            { value: "native", label: "Native" },
            { value: "60", label: "60 FPS" },
            { value: "120", label: "120 FPS" },
            { value: "240", label: "240 FPS" },
            { value: "custom", label: "Custom" },
          ]}
        />
      )
    },
    {
      title: "Memory Logging Mode",
      description: "Configure how aggressively the app collects garbage, caches test history, and clears telemetry logs.",
      component: (
        <SegmentedControl
          selected={settings.memoryMode}
          onChange={(val) => updateSetting("memoryMode", val)}
          options={[
            { value: "balanced", label: "Balanced" },
            { value: "performance", label: "Performance" },
            { value: "maximum", label: "Max Power" },
          ]}
        />
      )
    },
    {
      title: "Performance Impact Profile",
      description: "Calculated CPU/RAM telemetry footprint based on current framerate and logging configurations.",
      component: (
        <div className="flex flex-col gap-2 bg-card/25 border border-border-hairline rounded-lg p-3 font-mono text-[11px] w-full max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-soft">CPU Rendering Overhead:</span>
            <span className={`font-bold ${
              performanceImpact.cpuText === "Extremely Low" ? "text-success" : "text-primary"
            }`}>
              {performanceImpact.cpuText}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-soft">RAM Memory Footprint:</span>
            <span className={`font-bold ${
              performanceImpact.ramText.includes("Low") ? "text-success" : "text-primary"
            }`}>
              {performanceImpact.ramText}
            </span>
          </div>
          <div className="mt-1 pt-1.5 border-t border-border-hairline/60 text-[10px] text-muted-soft leading-snug">
            {performanceImpact.desc}
          </div>
        </div>
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
