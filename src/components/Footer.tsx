"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide footer on typing page to keep it single-screen (100vh)
  if (pathname === "/type" || pathname === "/test") {
    return null;
  }

  return (
    <footer className="w-full bg-card border-t border-border-hairline py-12 px-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-muted text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-primary font-serif text-lg font-semibold">✦ JustType</span>
          <span className="text-muted-soft">| AI-Enhanced Keyboarding</span>
        </div>
        <div className="flex space-x-6">
          <Link href="/type" className="hover:text-foreground transition-colors">Type</Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Analytics</Link>
          <Link href="/ai-coach" className="hover:text-foreground transition-colors">AI Coach</Link>
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        </div>
        <div>
          <p>&copy; {mounted ? new Date().getFullYear() : "2024"} JustType. Built with premium design precision.</p>
        </div>
      </div>
    </footer>
  );
}
