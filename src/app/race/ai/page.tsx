import { Suspense } from "react";
import AIClient from "./AIClient";

export default function AIPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    }>
      <AIClient />
    </Suspense>
  );
}
