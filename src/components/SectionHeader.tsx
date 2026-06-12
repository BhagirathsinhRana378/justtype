"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-hairline">
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-foreground leading-none tracking-tight">
            {title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans max-w-2xl">
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex-shrink-0 self-start md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
}
