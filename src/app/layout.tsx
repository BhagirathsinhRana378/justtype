import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

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
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#121110] text-[#faf9f5] font-sans selection:bg-[#cc785c] selection:text-white">
        <NavBar />
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="w-full bg-[#121110] border-t border-[#2a2926] py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[#8e8b82] text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-[#cc785c] font-serif text-lg font-semibold">✦ JustType</span>
              <span className="text-[#6c6a64]">| AI-Enhanced Keyboarding</span>
            </div>
            <div className="flex space-x-6">
              <a href="/test" className="hover:text-[#faf9f5] transition-colors">Test</a>
              <a href="/dashboard" className="hover:text-[#faf9f5] transition-colors">Analytics</a>
              <a href="/ai-coach" className="hover:text-[#faf9f5] transition-colors">AI Coach</a>
              <a href="/settings" className="hover:text-[#faf9f5] transition-colors">Settings</a>
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

