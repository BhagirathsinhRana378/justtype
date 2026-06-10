"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  Keyboard, 
  Sparkles, 
  BarChart3, 
  ChevronRight, 
  Zap, 
  Activity, 
  Target, 
  MousePointer2,
  Trophy,
  History,
  Timer
} from "lucide-react";

export default function Home() {
  useEffect(() => {
    document.documentElement.classList.add("is-landing-page");
    return () => {
      document.documentElement.classList.remove("is-landing-page");
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Floating Telemetry Elements */}
      <div className="absolute inset-0 pointer-events-none select-none z-10 hidden lg:block">
        {/* WPM Chip */}
        <div className="absolute top-[20%] right-[12%] animate-float-slow">
          <div className="bg-card border border-border-hairline rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Current Speed</div>
              <div className="text-2xl font-serif font-bold text-foreground">84 <span className="text-sm font-sans font-normal text-muted">WPM</span></div>
            </div>
          </div>
        </div>

        {/* Accuracy Chip */}
        <div className="absolute bottom-[25%] left-[8%] animate-float" style={{ animationDelay: '-2s' }}>
          <div className="bg-card border border-border-hairline rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Precision</div>
              <div className="text-xl font-serif font-bold text-foreground">98.4%</div>
            </div>
          </div>
        </div>

        {/* Rabbit/Speed Icon */}
        <div className="absolute top-[45%] right-[5%] animate-pulse-slow">
          <div className="flex flex-col items-center gap-1 opacity-20 grayscale">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <path d="M13 21H3.4a1.4 1.4 0 0 1-1.3-1.4c0-1.2.7-2.3 1.9-2.5l5.5-1.1c.5-.1 1-.4 1.3-.8l1.4-1.9c.4-.5.9-.9 1.5-1h6.6c1.1 0 2 .9 2 2v2.5a1.5 1.5 0 0 1-1.5 1.5H18" />
              <path d="M17 12V5a2 2 0 0 0-2-2h-3c-1.1 0-2 .9-2 2v2.5" />
              <path d="M9 3v4" />
              <path d="M13 3v4" />
            </svg>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Velocitas</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 max-w-6xl mx-auto w-full flex flex-col items-center text-center gap-10 z-20">
        <div className="flex flex-col items-center gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border-hairline text-xs text-primary font-medium tracking-wide uppercase shadow-sm">
            <Activity className="w-3.5 h-3.5" /> AI-Driven Performance
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground leading-[1.1] tracking-tight">
            The art of <span className="italic font-normal text-primary">speed</span> & <br className="hidden md:block" />
            mechanical <span className="font-normal italic">precision.</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-xl leading-relaxed font-sans">
            Beyond the words-per-minute. JustType analyzes your rhythmic cadence to build a unique mechanical profile of your typing.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full sm:w-auto mt-4">
            <Link
              href="/type"
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              <span>Begin Training</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/ai-coach"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-card hover:bg-card-elevated border border-border-hairline text-foreground font-semibold rounded-xl transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Consult Coach</span>
            </Link>
          </div>
        </div>

        {/* Visual Keyboard Illustration */}
        <div className="w-full max-w-5xl mt-8 relative group">
          <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative bg-card border border-border-hairline rounded-[2rem] p-4 md:p-8 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-error/20" />
                <div className="w-3 h-3 rounded-full bg-warning/20" />
                <div className="w-3 h-3 rounded-full bg-success/20" />
              </div>
              <div className="text-[10px] font-mono text-muted-soft tracking-widest uppercase">Telemetry Stream v4.0.2</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-success">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
                </div>
              </div>
            </div>

            {/* Keyboard Grid Mockup */}
            <div className="grid grid-cols-10 gap-2 md:gap-3 mb-8 opacity-60">
              {Array.from({ length: 30 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg border border-border-hairline flex items-center justify-center text-xs font-mono transition-all duration-500
                    ${i === 12 || i === 15 || i === 22 ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] scale-110 z-10' : 'bg-background/50 text-muted-soft'}
                  `}
                >
                  {String.fromCharCode(65 + (i % 26))}
                </div>
              ))}
            </div>

            {/* Bottom Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border-hairline pt-6">
              {[
                { label: "Burst Speed", val: "114", unit: "wpm", icon: Zap },
                { label: "Stability", val: "94.2", unit: "%", icon: Activity },
                { label: "Heat Map", val: "Active", unit: "", icon: MousePointer2 },
                { label: "Growth", val: "+12", unit: "%", icon: Trophy }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center md:items-start gap-1">
                  <div className="flex items-center gap-2 text-muted-soft">
                    <stat.icon className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground">
                    {stat.val}<span className="text-xs font-sans font-normal text-muted ml-1">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with better spacing */}
      <section className="relative border-t border-border-hairline bg-card/30 backdrop-blur-md px-6 py-24 md:py-32 z-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
                Refining the <span className="italic">tactile</span> connection.
              </h2>
              <p className="text-muted text-lg leading-relaxed">
                Standard tests tell you how fast you type. JustType tells you how you improve by identifying the micro-patterns in your muscle memory.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full border border-border-hairline flex items-center justify-center text-muted hover:text-primary transition-colors cursor-help">
                <History className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 rounded-full border border-border-hairline flex items-center justify-center text-muted hover:text-primary transition-colors cursor-help">
                <Timer className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group p-8 rounded-[2rem] bg-background border border-border-hairline hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Keyboard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">Keystroke Latency</h3>
              <p className="text-muted leading-relaxed">
                Tracks precise intervals between each letter input to pin down slow transitions and sluggish finger response times.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-[2rem] bg-background border border-border-hairline hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">Adaptive AI Coach</h3>
              <p className="text-muted leading-relaxed">
                Generates phonetically readable practice combinations focusing exactly on your target weak letters to patch mistakes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-[2rem] bg-background border border-border-hairline hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4">Regression Modeling</h3>
              <p className="text-muted leading-relaxed">
                Applies standard trend regressions over your historical logs to map accuracy gains and forecast future typing speed benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section with high impact */}
      <section className="px-6 py-24 md:py-40 max-w-4xl mx-auto text-center flex flex-col items-center gap-8 relative z-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-primary/[0.02] rounded-full blur-[100px] pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-serif text-foreground leading-tight">
          Ready to break your <br /> <span className="italic text-primary">limitations?</span>
        </h2>
        <p className="text-muted max-w-md text-lg leading-relaxed">
          Run your first test offline. Your data is stored locally in your browser to maintain total privacy.
        </p>
        <Link
          href="/type"
          className="group relative px-10 py-5 bg-foreground text-background hover:bg-primary hover:text-white font-bold rounded-2xl transition-all duration-500 overflow-hidden"
        >
          <span className="relative z-10">Begin Free Test</span>
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </Link>
      </section>
    </div>
  );
}



