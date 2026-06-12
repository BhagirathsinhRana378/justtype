"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName = "text-primary",
  className = "",
}: StatCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? {} : { y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-card border border-border-hairline rounded-lg p-4 flex flex-col gap-1 transition-all duration-200 hover:border-primary/40 hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between text-muted">
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${iconClassName}`} aria-hidden="true" />
      </div>
      <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground leading-none mt-1">
        {value}
      </p>
      <p className="text-[10px] font-mono text-muted-soft">
        {sub}
      </p>
    </motion.div>
  );
}
