"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="bg-card border border-border-hairline rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-sm my-6">
      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mb-1">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans max-w-md mx-auto">
          {description}
        </p>
      </div>
      <Link
        href={ctaHref}
        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-sans text-xs font-semibold rounded-md shadow-xs transition-all duration-200 cursor-pointer inline-flex items-center gap-2 mt-2 group"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </Link>
    </div>
  );
}
