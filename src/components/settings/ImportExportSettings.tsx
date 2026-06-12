"use client";

import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import SettingRow from "./SettingRow";
import { Clipboard, Download, Upload } from "lucide-react";

interface ImportExportSettingsProps {
  searchQuery: string;
}

export default function ImportExportSettings({ searchQuery }: ImportExportSettingsProps) {
  const { exportSettings, importSettings } = useSettings();
  const exportJson = exportSettings();
  const [importJson, setImportJson] = useState("");
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([exportJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "justtype_settings.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download", err);
    }
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      setImportStatus({ type: "error", message: "Paste JSON configuration first." });
      return;
    }

    try {
      const parsed = JSON.parse(importJson);
      if (typeof parsed !== "object" || parsed === null) {
        setImportStatus({ type: "error", message: "Must be a JSON object." });
        return;
      }

      const success = importSettings(importJson);
      if (success) {
        setImportStatus({ type: "success", message: "Settings imported!" });
        setImportJson("");
        setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
      } else {
        setImportStatus({ type: "error", message: "Invalid settings format." });
      }
    } catch (e) {
      const error = e as Error;
      setImportStatus({ type: "error", message: `Syntax error: ${error.message || "parsing error"}` });
    }
  };

  const query = searchQuery.toLowerCase().trim();

  const allRows = [
    {
      title: "Export Configuration",
      description: "Copy settings JSON or download it as a local configuration backup file.",
      component: (
        <div className="flex flex-col gap-2 w-full max-w-lg font-mono">
          {/* JSON preview (compact height-20 textarea) */}
          <textarea
            readOnly
            value={exportJson}
            className="w-full h-20 p-2 text-[11px] bg-card border border-border-hairline rounded-[6px] outline-none text-muted-soft resize-none select-all focus:border-primary/50"
            placeholder="JSON Preview"
          />
          <div className="flex gap-2 self-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-primary text-background rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer font-mono"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-card border border-border-hairline hover:border-primary/30 rounded-[6px] transition-colors cursor-pointer font-mono text-foreground"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      )
    },
    {
      title: "Import Configuration",
      description: "Paste a configuration JSON to instantly overwrite all current browser settings.",
      component: (
        <div className="flex flex-col gap-2 w-full max-w-lg font-mono">
          <textarea
            placeholder='Paste settings JSON here (e.g. { "flipColors": true })'
            value={importJson}
            onChange={(e) => {
              setImportJson(e.target.value);
              setImportStatus({ type: null, message: "" });
            }}
            className="w-full h-20 p-2 text-[11px] bg-card border border-border-hairline rounded-[6px] outline-none text-foreground placeholder:text-muted-soft resize-none focus:border-primary/50"
          />
          <div className="flex items-center justify-between gap-4 mt-0.5">
            <div className="text-[10px] flex-1">
              {importStatus.type === "success" && (
                <span className="text-success font-semibold">{importStatus.message}</span>
              )}
              {importStatus.type === "error" && (
                <span className="text-error font-semibold">{importStatus.message}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold bg-card border border-border-hairline hover:border-primary/40 text-foreground rounded-[6px] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
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
