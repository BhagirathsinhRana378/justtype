import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
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
  metadataBase: new URL("https://justtype.io"),
  title: "Typing Test | JustType - Free Online Typing Speed Test & AI Coach",
  description: "Take a free online typing test to measure your WPM speed and accuracy. JustType is the best typing website featuring an AI typing coach, real-time analytics, and personalized typing practice to help you improve typing speed and keyboard skills.",
  keywords: [
    "typing test", 
    "free typing test", 
    "online typing test", 
    "typing speed test", 
    "typing practice", 
    "typing trainer", 
    "typing website", 
    "typing accuracy test", 
    "words per minute test", 
    "WPM test", 
    "typing improvement", 
    "AI typing coach", 
    "typing challenge", 
    "fast typing test", 
    "keyboard typing test", 
    "typing skills", 
    "typing analytics", 
    "typing performance", 
    "typing practice online", 
    "typing tracker", 
    "improve typing speed", 
    "typing game", 
    "real time typing test", 
    "typing statistics", 
    "typing benchmark", 
    "typing test online"
  ],
  openGraph: {
    title: "Typing Test | JustType - Professional Typing Speed Test",
    description: "Measure your typing speed (WPM) and accuracy with our advanced typing test. Get AI-powered insights and personalized practice lessons to master the keyboard.",
    url: "https://justtype.io",
    siteName: "JustType",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "JustType - AI-Powered Typing Test",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Test | JustType - Free Online Typing Speed Test",
    description: "Improve your typing speed with our AI-driven typing test. Analyze your keystrokes and get custom lessons to boost your WPM.",
    images: ["/web-app-manifest-512x512.png"],
  },
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
      <body 
        className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-white transition-colors duration-300"
        suppressHydrationWarning
      >
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
