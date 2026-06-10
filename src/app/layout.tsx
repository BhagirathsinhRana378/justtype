import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
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
        
        {/* Footer */}
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
              <p>&copy; {new Date().getFullYear()} JustType. Built with premium design precision.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

