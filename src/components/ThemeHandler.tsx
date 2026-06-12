"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncThemeContext } from "@/utils/themes";

export default function ThemeHandler() {
  const pathname = usePathname();

  useEffect(() => {
    syncThemeContext(pathname);
  }, [pathname]);

  return null; // This component doesn't render anything
}
