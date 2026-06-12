"use client";

import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTypography } from "@/hooks/useTypography";
import SettingRow from "./SettingRow";

type ActionType = "reset" | "fonts" | "themes";

interface DangerZoneSettingsProps {
  searchQuery: string;
}

export default function DangerZoneSettings({ searchQuery }: DangerZoneSettingsProps) {
  const { resetAllSettings } = useSettings();
  const { localFonts, removeLocalFont } = useTypography();

  const [activeModal, setActiveModal] = useState<ActionType | null>(null);

  const handleConfirm = () => {
    if (activeModal === "reset") {
      resetAllSettings();
    } else if (activeModal === "fonts") {
      localFonts.forEach((f) => {
        removeLocalFont(f.name);
      });
    } else if (activeModal === "themes") {
      localStorage.removeItem("justtype_theme_favorites");
      localStorage.setItem("justtype_config_theme", "cream");
      if (typeof window !== "undefined") {
        document.documentElement.setAttribute("data-theme", "cream");
        window.dispatchEvent(new Event("storage"));
      }
    }
    setActiveModal(null);
  };

  const getModalInfo = (action: ActionType) => {
    switch (action) {
      case "reset":
        return {
          title: "Reset Configuration?",
          description: "This will permanently restore all settings, theme overrides, and typing scale preferences to their system default configurations. Your history analytics remain untouched.",
          confirmText: "Reset Config",
        };
      case "fonts":
        return {
          title: "Clear Custom Fonts?",
          description: "This will permanently delete all locally uploaded font family caches from your browser's IndexedDB storage. Active custom fonts will revert to system defaults.",
          confirmText: "Clear Fonts",
        };
      case "themes":
        return {
          title: "Clear Theme Favorites?",
          description: "This will wipe all favorited theme bookmarks and reset the interface theme to Claude Cream.",
          confirmText: "Clear Themes",
        };
    }
  };

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "Reset Configuration",
      description: "Restores all settings, theme overrides, and typing scale preferences to their default states.",
      component: (
        <button
          type="button"
          onClick={() => setActiveModal("reset")}
          className="px-4 py-2 border border-error/50 hover:border-error text-error hover:bg-error/5 bg-transparent rounded-[6px] font-mono text-xs font-semibold transition-colors cursor-pointer select-none"
        >
          Reset Config
        </button>
      )
    },
    {
      title: "Clear Custom Fonts",
      description: "Permanently deletes all locally uploaded font family files from browser IndexedDB storage.",
      component: (
        <button
          type="button"
          onClick={() => setActiveModal("fonts")}
          className="px-4 py-2 border border-error/50 hover:border-error text-error hover:bg-error/5 bg-transparent rounded-[6px] font-mono text-xs font-semibold transition-colors cursor-pointer select-none"
        >
          Clear Fonts
        </button>
      )
    },
    {
      title: "Clear Theme Favorites",
      description: "Wipes all favorited theme shortcuts and resets active appearance to Claude Cream.",
      component: (
        <button
          type="button"
          onClick={() => setActiveModal("themes")}
          className="px-4 py-2 border border-error/50 hover:border-error text-error hover:bg-error/5 bg-transparent rounded-[6px] font-mono text-xs font-semibold transition-colors cursor-pointer select-none"
        >
          Clear Themes
        </button>
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

  const modalInfo = activeModal ? getModalInfo(activeModal) : null;

  return (
    <div className="flex flex-col w-full select-none">
      {/* Visual Confirm Dialog Overlay */}
      {activeModal && modalInfo && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-hairline rounded-[12px] p-5 max-w-sm w-full flex flex-col gap-4 font-mono shadow-xl">
            <h3 className="text-sm font-bold text-error uppercase tracking-wider">
              {modalInfo.title}
            </h3>
            <p className="text-[12px] text-muted-soft leading-relaxed">
              {modalInfo.description}
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 border border-border-hairline hover:bg-card/50 text-foreground text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-3.5 py-1.5 bg-error text-white text-xs font-bold rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer"
              >
                {modalInfo.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredRows.map((row) => (
        <SettingRow key={row.title} title={row.title} description={row.description}>
          {row.component}
        </SettingRow>
      ))}
    </div>
  );
}
