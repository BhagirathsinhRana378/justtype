"use client";

import React, { useState, useRef } from "react";
import { useTypography } from "@/hooks/useTypography";
import { Upload, Trash2, FileText } from "lucide-react";

export default function LocalFont() {
  const { localFonts, addLocalFont, removeLocalFont } = useTypography();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ttf", "woff", "woff2", "otf"].includes(ext)) {
      setError("Use TTF, WOFF, WOFF2, or OTF format.");
      return;
    }

    // Auto-generate name from filename
    const defaultName = file.name
      .substring(0, file.name.lastIndexOf("."))
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          await addLocalFont(defaultName, file.name, dataUrl);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch {
          setError("Failed to store custom font.");
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

  return (
    <div className="flex flex-col gap-2 w-full max-w-lg">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-[10px] h-20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors w-full select-none ${
          dragActive
            ? "border-primary bg-primary/5 text-primary"
            : "border-border-hairline hover:border-primary/30 text-muted-soft hover:text-foreground"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.woff,.woff2,.otf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
          }}
          className="hidden"
        />
        <Upload className="w-4 h-4 opacity-70" />
        <div className="text-center font-mono">
          <p className="text-[11px] font-medium">
            Drag & drop font here or <span className="text-primary underline">browse</span>
          </p>
        </div>
      </div>

      {error && <p className="text-[10px] text-error font-mono">{error}</p>}

      {localFonts.length > 0 && (
        <div className="flex flex-col gap-1 mt-1.5 w-full">
          {localFonts.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between p-2 bg-card/10 border border-border-hairline/60 rounded-[10px] font-mono text-xs w-full"
            >
              <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                <FileText className="w-3.5 h-3.5 text-muted-soft shrink-0" />
                <span className="font-semibold text-foreground truncate">{f.name}</span>
              </div>

              {/* Preview */}
              <div
                className="hidden sm:block text-[11px] px-2 py-0.5 text-muted-soft shrink-0 mr-3 truncate max-w-[120px]"
                style={{ fontFamily: `'${f.name}', sans-serif` }}
              >
                speed typing
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeLocalFont(f.name)}
                className="p-1 hover:text-error text-muted-soft transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
