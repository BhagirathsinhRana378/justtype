import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "JustType | AI-Powered Premium Typing Test",
  description: "An elegant, AI-driven typing test platform that detects weak keys, predicts typing growth, and designs custom coach lessons to boost your word-per-minute speed.",
  keywords: ["typing test", "wpm tracker", "typing accuracy", "keyboard training", "AI coach"],
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "JustType",
  },
};

export default function Root({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-white transition-colors duration-300">
        <Script
          id="theme-strategy"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('justtype_config_theme') || 'cream';
                  document.documentElement.setAttribute('data-theme', theme);
                  
                  const font = localStorage.getItem('justtype_config_font') || 'sans';
                  document.documentElement.classList.add('font-setting-' + font);
                } catch (e) {}
              })();
            `,
          }}
        />
        <NavBar />
        <main className="flex-1 flex flex-col w-full bg-background text-foreground transition-colors duration-300">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
