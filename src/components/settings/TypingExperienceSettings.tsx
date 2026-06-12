"use client";

import React, { useState, useEffect } from "react";
import SettingRow from "./SettingRow";
import { SegmentedControl } from "./TestExperienceSettings";

interface TypingExperienceSettingsProps {
  searchQuery: string;
}

export default function TypingExperienceSettings({ searchQuery }: TypingExperienceSettingsProps) {
  const [layout, setLayout] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("justtype_config_layout") || "qwerty";
    }
    return "qwerty";
  });
  const [caret, setCaret] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("justtype_config_caret") || "smooth";
    }
    return "smooth";
  });

  // Sync state if localStorage changes (e.g. from reset)
  useEffect(() => {
    const handleStorageChange = () => {
      setLayout(localStorage.getItem("justtype_config_layout") || "qwerty");
      setCaret(localStorage.getItem("justtype_config_caret") || "smooth");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLayoutChange = (newLayout: string) => {
    setLayout(newLayout);
    localStorage.setItem("justtype_config_layout", newLayout);
    // Dispatch storage event to sync other components
    window.dispatchEvent(new Event("storage"));
  };

  const handleCaretChange = (newCaret: string) => {
    setCaret(newCaret);
    localStorage.setItem("justtype_config_caret", newCaret);
    // Dispatch storage event to sync other components
    window.dispatchEvent(new Event("storage"));
  };

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "Keyboard Layout",
      description: "Select the visual key mapping layout displayed on the test board.",
      component: (
        <SegmentedControl
          selected={layout}
          onChange={handleLayoutChange}
          options={[
            { value: "qwerty", label: "QWERTY" },
            { value: "dvorak", label: "Dvorak" },
            { value: "colemak", label: "Colemak" },
          ]}
        />
      )
    },
    {
      title: "Indicator Caret Style",
      description: "Choose the visual rendering style of the active typing cursor caret.",
      component: (
        <SegmentedControl
          selected={caret}
          onChange={handleCaretChange}
          options={[
            { value: "smooth", label: "Line" },
            { value: "block", label: "Block" },
            { value: "underline", label: "Underline" },
            { value: "hidden", label: "Hidden" },
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
