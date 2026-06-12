"use client";

import React, { useState, useRef } from "react";
import { useTypography } from "@/hooks/useTypography";
import { Upload, Trash2, FileText, Info } from "lucide-react";

export default function LocalFont() {
  const { localFonts, addLocalFont, removeLocalFont } = useTypography();
  const [fontName, setFontName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ttf", "woff", "woff2", "otf"].includes(ext)) {
      setError("Unsupported format. Use TTF, WOFF, WOFF2, or OTF.");
      return;
    }

    const defaultName = file.name.substring(0, file.name.lastIndexOf("."));
    const name = fontName.trim() || defaultName;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          await addLocalFont(name, file.name, dataUrl);
          setFontName("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch {
          setError("Failed to store custom font in IndexedDB.");
        }
      }
    };
    reader.onerror = () => setError("Error reading file.");
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Upload Box */}
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="Custom Font Display Name (Optional)"
          value={fontName}
          onChange={(e) => setFontName(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-background border border-border-hairline rounded-[6px] outline-none font-mono text-foreground placeholder:text-muted-soft focus:border-primary/50"
        />

        {/* Dash border Uploader Card (Height: 120) */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-[6px] h-[120px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors w-full select-none ${
            dragActive
              ? "border-primary bg-primary/5 text-primary"
              : "border-border-hairline hover:border-primary/30 text-muted hover:text-foreground"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.woff,.woff2,.otf"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className="w-4 h-4 opacity-70" />
          <div className="text-center font-mono">
            <p className="text-[11px] font-bold">Drag & drop font file here</p>
            <p className="text-[9.5px] text-muted-soft mt-0.5">
              or <span className="text-primary underline">browse files</span> (TTF, WOFF, WOFF2, OTF)
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-[10px] text-error font-mono">{error}</p>}

      {/* Info Label */}
      <div className="flex items-start gap-1.5 p-2.5 bg-card/10 border border-border-hairline/30 rounded-[6px] text-muted-soft font-mono text-[9px] w-full">
        <Info className="w-3.5 h-3.5 shrink-0 text-muted" />
        <p className="leading-tight">
          Custom fonts are stored locally in IndexedDB and never uploaded to any server.
        </p>
      </div>

      {/* Registered custom fonts */}
      {localFonts.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border-hairline/20 pt-3 w-full">
          <span className="text-[9px] font-bold text-muted-soft font-mono uppercase tracking-wider block mb-0.5">
            Registered Fonts
          </span>
          <div className="flex flex-col gap-1 w-full">
            {localFonts.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between p-2 bg-card border border-border-hairline rounded-[6px] font-mono text-xs w-full"
              >
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  <FileText className="w-3.5 h-3.5 text-muted-soft shrink-0" />
                  <span className="font-bold text-foreground truncate">{f.name}</span>
                  <span className="text-[9px] text-muted-soft truncate">({f.filename})</span>
                </div>

                {/* Font Live Preview */}
                <div 
                  className="hidden sm:block text-[11px] px-2.5 py-0.5 bg-background border border-border-hairline/60 rounded shrink-0 select-none mr-2"
                  style={{ fontFamily: `'${f.name}', sans-serif` }}
                >
                  clarity focus rhythm
                </div>

                <button
                  onClick={() => removeLocalFont(f.name)}
                  className="p-1 hover:text-error text-muted-soft transition-colors cursor-pointer shrink-0"
                  title="Remove local font"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
