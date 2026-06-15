"use client";

import React from "react";

interface SettingRowProps {
  title: string;
  description: string | React.ReactNode;
  children: React.ReactNode;
}

export default function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-4 lg:gap-6 px-1 xs:px-2 sm:px-0 py-4 lg:py-3 min-h-[64px] border-b border-border-hairline/30 items-center w-full overflow-hidden">
      {/* LEFT: Setting info (45%) */}
      <div className="flex flex-col w-full pr-0 lg:pr-4">
        <h4 className="text-[15px] font-medium text-foreground leading-snug">
          {title}
        </h4>
        <div className="text-[13px] text-muted-soft leading-normal font-normal mt-0.5">
          {description}
        </div>
      </div>

      {/* RIGHT: Controls (55%) */}
      <div className="w-full flex items-center justify-start lg:justify-end min-w-0 text-[14px]">
        {children}
      </div>
    </div>
  );
}
