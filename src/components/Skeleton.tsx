"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-card-elevated rounded-lg ${className}`}
      role="status"
      aria-live="polite"
      aria-hidden="false"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
