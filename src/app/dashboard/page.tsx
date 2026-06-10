"use client";

import { useEffect, useState } from "react";
import { getSavedSessions, TypingSession, analyzeWeakKeys, WeakKeyAnalysis, clearAllSessions } from "@/utils/aiEngine";
import { BarChart3, TrendingUp, AlertTriangle, History, RefreshCw, Award, Zap, Percent } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [weakKeys, setWeakKeys] = useState<WeakKeyAnalysis[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const data = getSavedSessions();
    setSessions(data);
    setWeakKeys(analyzeWeakKeys(data));
  }, [reloadTrigger]);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all typing session history? This cannot be undone.")) {
      clearAllSessions();
      setReloadTrigger(prev => prev + 1);
    }
  };

  // Compute overall stats
  const totalTests = sessions.length;
  const avgWpm = totalTests > 0 
    ? Math.round(sessions.reduce((a, b) => a + b.wpm, 0) / totalTests) 
    : 0;
  const avgAccuracy = totalTests > 0 
    ? Math.round(sessions.reduce((a, b) => a + b.accuracy, 0) / totalTests) 
    : 0;
  const maxWpm = totalTests > 0 
    ? Math.max(...sessions.map(s => s.wpm)) 
    : 0;

  // Custom SVG Chart Generator
  const renderWpmChart = () => {
    if (sessions.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center border border-[#2a2926] bg-[#121110] rounded text-[#6c6a64] text-xs font-mono">
          Complete at least 2 sessions to render historical trends.
        </div>
      );
    }

    const chartWidth = 600;
    const chartHeight = 160;
    const padding = 20;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    const wpms = sessions.map(s => s.wpm);
    const minVal = Math.max(0, Math.min(...wpms) - 10);
    const maxVal = Math.max(...wpms) + 10;
    const valRange = maxVal - minVal || 1;

    // Build SVG path points
    const points = sessions.map((s, idx) => {
      const x = padding + (idx / (sessions.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((s.wpm - minVal) / valRange) * graphHeight;
      return { x, y, wpm: s.wpm };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    // Gradient fill path
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

    return (
      <div className="w-full bg-[#121110] border border-[#2a2926] rounded-md p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#8e8b82] font-mono">
          <span>Speed Performance Over Time (WPM)</span>
          <span className="text-[#cc785c] font-semibold">Peak: {maxWpm} WPM</span>
        </div>
        <div className="relative w-full h-[160px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cc785c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#cc785c" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Gridlines */}
            <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#1a1917" strokeWidth={1} />
            <line x1={padding} y1={padding + graphHeight / 2} x2={chartWidth - padding} y2={padding + graphHeight / 2} stroke="#1a1917" strokeWidth={1} />
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#2a2926" strokeWidth={1} />

            {/* Gradient area */}
            <path d={fillPath} fill="url(#chartGradient)" />

            {/* Main line */}
            <path d={linePath} fill="none" stroke="#cc785c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="#121110"
                  stroke="#cc785c"
                  strokeWidth={2}
                  className="cursor-pointer hover:r-6 transition-all duration-100"
                />
                {/* Tooltip hint text (only on end/peak points sometimes, or keep simple) */}
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-[#121110] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2926] pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-serif text-[#faf9f5]">Telemetry Dashboard</h1>
            <p className="text-sm text-[#8e8b82]">Keystroke analytics, latency heatmaps, and progress predictions compiled locally.</p>
          </div>
          {totalTests > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 border border-[#c64545]/30 hover:border-[#c64545] text-xs font-mono text-[#c64545] rounded-md transition-all-smooth bg-[#c64545]/5 hover:bg-[#c64545]/15 focus:outline-none"
            >
              Reset Session Logs
            </button>
          )}
        </div>

        {totalTests === 0 ? (
          /* Empty State */
          <div className="w-full bg-[#1a1917] border border-[#2a2926] rounded-lg p-16 text-center flex flex-col items-center gap-6">
            <div className="p-4 bg-[#cc785c]/10 text-[#cc785c] rounded-full">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-[#faf9f5]">No Telemetry Logs Yet</h2>
            <p className="text-[#8e8b82] text-sm max-w-sm">
              Complete typing tests to compile metrics on keyboard latency, accuracy variance, and custom growth analytics.
            </p>
            <Link
              href="/test"
              className="px-6 py-3 bg-[#cc785c] hover:bg-[#a9583e] text-white text-sm font-medium rounded-md transition-all-smooth"
            >
              Launch Core Workbench
            </Link>
          </div>
        ) : (
          /* Main Dashboard Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column (Stats & Visualizations) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1917] border border-[#2a2926] p-4 rounded-md">
                  <div className="flex items-center justify-between text-[#8e8b82] mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Avg Speed</span>
                    <Zap className="w-4 h-4 text-[#cc785c]" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-[#faf9f5]">{avgWpm}</p>
                  <p className="text-[10px] font-mono text-[#6c6a64]">Words Per Min</p>
                </div>

                <div className="bg-[#1a1917] border border-[#2a2926] p-4 rounded-md">
                  <div className="flex items-center justify-between text-[#8e8b82] mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Accuracy</span>
                    <Percent className="w-4 h-4 text-[#5db872]" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-[#faf9f5]">{avgAccuracy}%</p>
                  <p className="text-[10px] font-mono text-[#6c6a64]">Overall Ratio</p>
                </div>

                <div className="bg-[#1a1917] border border-[#2a2926] p-4 rounded-md">
                  <div className="flex items-center justify-between text-[#8e8b82] mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Total Tests</span>
                    <Award className="w-4 h-4 text-[#5db8a6]" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-[#faf9f5]">{totalTests}</p>
                  <p className="text-[10px] font-mono text-[#6c6a64]">Completed Runs</p>
                </div>
              </div>

              {/* Progress Line Chart */}
              {renderWpmChart()}

              {/* Chronological History Log */}
              <div className="bg-[#1a1917] border border-[#2a2926] rounded-md p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#2a2926] pb-3">
                  <div className="flex items-center gap-2 text-sm text-[#faf9f5]">
                    <History className="w-4 h-4 text-[#cc785c]" />
                    <span className="font-serif">Chronological Runs</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6c6a64]">Showing latest {sessions.length} runs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-[#6c6a64] border-b border-[#2a2926] pb-2 uppercase tracking-wider">
                        <th className="py-2 font-normal">Date / Time</th>
                        <th className="py-2 font-normal text-right">Speed</th>
                        <th className="py-2 font-normal text-right">Accuracy</th>
                        <th className="py-2 font-normal text-right">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1e1b] text-[#8e8b82]">
                      {[...sessions].reverse().map((s, idx) => (
                        <tr key={idx} className="hover:text-[#faf9f5] transition-colors">
                          <td className="py-2.5">
                            {new Date(s.timestamp).toLocaleDateString()} at {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 text-right font-bold text-[#cc785c]">{s.wpm} WPM</td>
                          <td className="py-2.5 text-right text-[#5db872]">{s.accuracy}%</td>
                          <td className="py-2.5 text-right capitalize">{s.mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (Weak Keys & Recommendations) */}
            <div className="flex flex-col gap-8">
              
              {/* Weak Keys analysis */}
              <div className="bg-[#1a1917] border border-[#2a2926] rounded-md p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm border-b border-[#2a2926] pb-3">
                  <AlertTriangle className="w-4 h-4 text-[#e8a55a]" />
                  <span className="font-serif text-[#faf9f5]">Tactile Weak Spots</span>
                </div>

                {weakKeys.length === 0 ? (
                  <p className="text-xs text-[#8e8b82] leading-relaxed">
                    Complete tests containing letters with different keystroke speeds to map error frequency distributions.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-[#8e8b82] leading-relaxed">
                      Keys scored by incorrect inputs (60% weight) and transition hesitation delay (40% weight).
                    </p>
                    <div className="flex flex-col gap-3">
                      {weakKeys.slice(0, 5).map((w, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#121110] border border-[#2a2926] p-2.5 rounded">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-[#1a1917] border border-[#2a2926] rounded flex items-center justify-center font-mono font-bold text-[#cc785c] text-sm shadow">
                              {w.key.toUpperCase()}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-mono text-[#8e8b82]">Error Rate</span>
                              <span className="text-[12px] font-mono font-semibold text-[#faf9f5]">
                                {Math.round(w.errorRate * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-mono block text-[#8e8b82]">Avg Delay</span>
                            <span className="text-[12px] font-mono text-[#faf9f5]">
                              {Math.round(w.avgLatency)}ms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Link
                      href="/ai-coach"
                      className="w-full text-center py-2.5 bg-[#cc785c]/10 border border-[#cc785c]/30 hover:bg-[#cc785c]/20 text-xs font-mono text-[#cc785c] rounded transition-all-smooth mt-2"
                    >
                      Build Remediation Plan
                    </Link>
                  </div>
                )}
              </div>

              {/* Pro Tips / Heuristics Card */}
              <div className="bg-[#1a1917] border border-[#2a2926] rounded-md p-6 flex flex-col gap-3">
                <h3 className="font-serif text-sm text-[#faf9f5]">AI Analytics Advisor</h3>
                <div className="space-y-3 text-xs text-[#8e8b82]">
                  <p className="leading-relaxed">
                    💡 <strong className="text-[#faf9f5]">Steady rhythm beats bursts:</strong> Typists with low latency standard deviations (under 80ms) maintain 15% fewer errors on average.
                  </p>
                  <p className="leading-relaxed">
                    💡 <strong className="text-[#faf9f5]">Buffer key transitions:</strong> Most pauses happen when passing from vowel clusters (&apos;ou&apos;, &apos;ea&apos;) to hard constants. Ensure regular wrist pivots.
                  </p>
                  <p className="leading-relaxed">
                    💡 <strong className="text-[#faf9f5]">Practice offline daily:</strong> Committing 10 minutes a day to weak key sequences builds reflex consolidation inside the motor cortex.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
