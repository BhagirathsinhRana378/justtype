import Link from "next/link";
import { Keyboard, Sparkles, BarChart3, ChevronRight, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-[#121110]">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1917] border border-[#2a2926] text-xs text-[#cc785c] font-medium tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" /> Next-Gen Keyboarding
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-light text-[#faf9f5] leading-tight tracking-tight">
            Tactile precision, <br />
            <span className="text-[#cc785c] font-normal italic">enhanced by AI.</span>
          </h1>
          <p className="text-[#8e8b82] text-lg max-w-lg leading-relaxed font-sans">
            JustType measures millisecond-level key transition latencies, scores your cadence consistency, and shapes custom training lists targeting your weakest letters.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full sm:w-auto">
            <Link
              href="/test"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all-smooth text-center"
            >
              <span>Start Typing Test</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ai-coach"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1917] hover:bg-[#252320] border border-[#2a2926] text-[#faf9f5] font-medium rounded-md transition-all-smooth text-center"
            >
              <Sparkles className="w-4 h-4 text-[#cc785c]" />
              <span>Consult AI Coach</span>
            </Link>
          </div>
        </div>

        {/* Hero Illustration Mockup */}
        <div className="flex-1 w-full flex items-center justify-center relative">
          <div className="w-full max-w-md bg-[#1a1917] border border-[#2a2926] rounded-lg p-6 font-mono text-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2a2926] pb-3 text-xs text-[#8e8b82]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cc785c]" />
                <span>telemetry_engine.ts</span>
              </div>
              <span>Status: Active</span>
            </div>
            <div className="text-xs text-[#8e8b82] space-y-1.5">
              <p className="text-[#5db8a6]">{"// Analyzing keystroke cadence"}</p>
              <p><span className="text-[#cc785c]">const</span> userProfile = {"{"}</p>
              <p>&nbsp;&nbsp;avgWpm: <span className="text-[#e8a55a]">92</span>,</p>
              <p>&nbsp;&nbsp;weakKeys: [<span className="text-[#5db872]">&apos;k&apos;</span>, <span className="text-[#5db872]">&apos;q&apos;</span>, <span className="text-[#5db872]">&apos;z&apos;</span>],</p>
              <p>&nbsp;&nbsp;cadenceFocus: <span className="text-[#e8a55a]">94%</span></p>
              <p>{"};"}</p>
              <p className="pt-2 text-[#cc785c]">{"// Generated weak-key word practice"}</p>
              <p className="text-[#faf9f5] font-sans text-base tracking-wide bg-[#121110] px-3 py-2 rounded border border-[#2a2926]">
                quick skill kicker packed sketch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-[#2a2926] bg-[#1a1917] px-6 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-[#faf9f5] mb-4">
              Why JustType?
            </h2>
            <p className="text-[#8e8b82] text-sm">
              Standard tests tell you how fast you type. JustType tells you how you improve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#121110] border border-[#2a2926] p-6 rounded-lg flex flex-col items-start gap-4">
              <div className="p-3 bg-[#cc785c]/10 text-[#cc785c] rounded-md">
                <Keyboard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-[#faf9f5]">Keystroke Latency</h3>
              <p className="text-[#8e8b82] text-sm leading-relaxed">
                Tracks precise intervals between each letter input to pin down slow transitions and sluggish finger response times.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#121110] border border-[#2a2926] p-6 rounded-lg flex flex-col items-start gap-4">
              <div className="p-3 bg-[#cc785c]/10 text-[#cc785c] rounded-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-[#faf9f5]">Adaptive AI Coach</h3>
              <p className="text-[#8e8b82] text-sm leading-relaxed">
                Generates phonetically readable practice combinations focusing exactly on your target weak letters to patch mistakes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#121110] border border-[#2a2926] p-6 rounded-lg flex flex-col items-start gap-4">
              <div className="p-3 bg-[#cc785c]/10 text-[#cc785c] rounded-md">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-[#faf9f5]">Regression Modeling</h3>
              <p className="text-[#8e8b82] text-sm leading-relaxed">
                Applies standard trend regressions over your historical logs to map accuracy gains and forecast future typing speed benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="text-3xl font-serif text-[#faf9f5]">
          Ready to discover your typing constraints?
        </h2>
        <p className="text-[#8e8b82] max-w-md text-sm">
          Run your first test offline. Your data is stored locally in your browser to maintain total privacy.
        </p>
        <Link
          href="/test"
          className="px-8 py-3 bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium rounded-md transition-all-smooth"
        >
          Begin Free Test
        </Link>
      </section>
    </div>
  );
}

