"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Keyboard, BarChart3, Sparkles, Trophy, User, Settings, Menu, X } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Test", href: "/test", icon: Keyboard },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "AI Coach", href: "/ai-coach", icon: Sparkles },
    { name: "Leaderboard", href: "/leaderboards", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="w-full bg-background border-b border-border-hairline sticky top-0 z-50 transition-all-smooth">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 text-foreground hover:opacity-90">
              <span className="text-primary font-serif text-2xl font-bold tracking-tight">✦ JustType</span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all-smooth ${
                      isActive
                        ? "text-primary bg-card border-b-2 border-primary"
                        : "text-muted hover:text-foreground hover:bg-card"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="h-6 w-px bg-border-hairline" />
            <ThemeSwitcher />
          </div>

          {/* Mobile Right Cluster */}
          <div className="flex items-center space-x-4 md:hidden">
            <ThemeSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-foreground hover:bg-card focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? "block animate-fadeIn" : "hidden"} md:hidden bg-background border-t border-border-hairline`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? "text-primary bg-card"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
