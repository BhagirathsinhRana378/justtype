import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Link from "next/link";

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
  keywords: ["typing test", "wpm tracker", "typing accuracy", "keyboard layout training", "AI coach"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('justtype_config_theme') || 'cream';
                  document.documentElement.setAttribute('data-theme', theme);
                  
                  const font = localStorage.getItem('justtype_config_font') || 'sans';
                  document.documentElement.className = document.documentElement.className + ' font-setting-' + font;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-white transition-colors duration-300">
        <NavBar />
        <main className="flex-1 flex flex-col w-full bg-background text-foreground transition-colors duration-300">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

