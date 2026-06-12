"use client";

import React, { useMemo, useRef } from "react";
import { ALL_FONTS } from "@/lib/fontRegistry";
import { useTypography } from "@/hooks/useTypography";
import { Upload } from "lucide-react";
import { loadFont } from "@/lib/fontLoader";

export default function FontPicker() {
  const { fontFamily, updateFontFamily, localFonts, addLocalFont } = useTypography();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine standard registry and custom fonts, then sort alphabetically by name
  const sortedFonts = useMemo(() => {
    const registryFonts = [...ALL_FONTS];
    
    // Add uploaded custom fonts to the registry list
    const customUploadedFonts = localFonts.map((f) => ({
      name: f.name,
      family: `'${f.name}', sans-serif`,
      category: "sans" as const,
      source: "system" as const,
    }));

    const combined = [...registryFonts, ...customUploadedFonts];
    combined.sort((a, b) => a.name.localeCompare(b.name));
    return combined;
  }, [localFonts]);

  // Load all fonts in memory so they render in their true typefaces in the grid
  React.useEffect(() => {
    sortedFonts.forEach((f) => {
      try {
        loadFont(f);
      } catch (err) {
        console.error("Failed to load font", f.name, err);
      }
    });
  }, [sortedFonts]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["ttf", "woff", "woff2", "otf"].includes(ext)) {
        alert("Unsupported format. Use TTF, WOFF, WOFF2, or OTF.");
        return;
      }

      // Generate a display name
      const name = file.name
        .substring(0, file.name.lastIndexOf("."))
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          try {
            await addLocalFont(name, file.name, dataUrl);
            updateFontFamily(name);
          } catch {
            alert("Failed to store custom font.");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomClick = () => {
    if (localFonts.length > 0) {
      // Select the first uploaded font
      updateFontFamily(localFonts[0].name);
    } else {
      // Prompt upload if none uploaded
      fileInputRef.current?.click();
    }
  };

  const isCustomSelected = useMemo(() => {
    // If the active font is one of the custom fonts
    return localFonts.some((lf) => lf.name === fontFamily);
  }, [localFonts, fontFamily]);

  return (
    <div className="flex flex-col w-full select-none">
      {/* 1. Header (Description left, local upload button right) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="text-muted-soft text-[13px] font-mono leading-relaxed max-w-2xl">
          Change the font family used by the website. Using a local font will override your choice.
          <div className="mt-1 text-[11px] opacity-75">
            Note: Local fonts are not sent to the server and will not persist across devices.
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-card/25 border border-border-hairline hover:border-primary/40 text-foreground font-mono text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>use local font</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.woff,.woff2,.otf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 2. Or divider line */}
      <div className="relative flex items-center justify-center my-6 w-full select-none">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-hairline/20"></div>
        </div>
        <span className="relative flex justify-center text-[12px] font-mono bg-background px-3 text-muted-soft">
          or
        </span>
      </div>

      {/* 3. Grid of alphabetically sorted fonts + custom at the end */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 w-full">
        {sortedFonts.map((font) => {
          const isSelected = fontFamily === font.name;
          return (
            <button
              key={font.name}
              type="button"
              onClick={() => updateFontFamily(font.name)}
              className={`py-2 text-[12.5px] rounded-[6px] border text-center transition-colors cursor-pointer truncate px-2 select-none ${
                isSelected
                  ? "bg-primary text-background border-primary font-semibold"
                  : "bg-card/20 border-border-hairline/40 text-foreground/80 hover:text-foreground hover:border-primary/30"
              }`}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </button>
          );
        })}

        {/* Special custom button at the end */}
        <button
          type="button"
          onClick={handleCustomClick}
          className={`py-2 text-[12.5px] rounded-[6px] border text-center font-mono transition-colors cursor-pointer select-none ${
            isCustomSelected
              ? "bg-primary text-background border-primary font-semibold"
              : "bg-card/20 border-border-hairline/40 text-foreground/80 hover:text-foreground hover:border-primary/30"
          }`}
        >
          {isCustomSelected ? fontFamily : "custom"}
        </button>
      </div>
    </div>
  );
}
