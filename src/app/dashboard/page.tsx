"use client";

import { useEffect, useState, useMemo } from "react";
import { getSavedSessions, TypingSession, analyzeWeakKeys, WeakKeyAnalysis, clearAllSessions, predictGrowthTrend } from "@/utils/aiEngine";
import { BarChart3, AlertTriangle, History, Award, Zap, Percent, Activity, BrainCircuit } from "lucide-react";
import Link from "next/link";
import VirtualKeyboard, { KeyboardLayoutType } from "@/components/VirtualKeyboard";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [weakKeys, setWeakKeys] = useState<WeakKeyAnalysis[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState<"errors" | "latency">("latency");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const data = getSavedSessions();
    setSessions(data);
    setWeakKeys(analyzeWeakKeys(data));
    /* eslint-enable react-hooks/set-state-in-effect */
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

  // Last layout typed
  const lastLayout = useMemo(() => {
    if (sessions.length === 0) return "qwerty" as KeyboardLayoutType;
    return (sessions[sessions.length - 1].layout || "qwerty") as KeyboardLayoutType;
  }, [sessions]);

  // Heatmap dataset mapping
  const heatmapData = useMemo(() => {
    interface HeatmapAccumulator {
      total: number;
      errors: number;
      latencies: number[];
    }
    const acc: Record<string, HeatmapAccumulator> = {};
    
    sessions.forEach(session => {
      session.telemetry.forEach(t => {
        if (t.key.length !== 1) return;
        const k = t.key.toLowerCase();
        if (!acc[k]) {
          acc[k] = { total: 0, errors: 0, latencies: [] };
        }
        const item = acc[k];
        item.total += 1;
        if (!t.isCorrect) {
          item.errors += 1;
        } else {
          item.latencies.push(t.latency);
        }
      });
    });

    const data: Record<string, { errorRate: number; avgLatency: number; score: number }> = {};
    Object.keys(acc).forEach(k => {
      const item = acc[k];
      const errorRate = item.total > 0 ? item.errors / item.total : 0;
      const sumLatency = item.latencies.reduce((a: number, b: number) => a + b, 0);
      const avgLatency = item.latencies.length > 0 ? sumLatency / item.latencies.length : 0;
      
      const errorPoints = errorRate * 60;
      const latencyRef = Math.max(0, avgLatency - 120);
      const latencyPoints = Math.min(40, (latencyRef / 280) * 40);
      const score = Math.round(errorPoints + latencyPoints);
      
      data[k] = { errorRate, avgLatency, score };
    });

    return data;
  }, [sessions]);

  // AI Growth Trend predictor
  const growthPrediction = useMemo(() => {
    return predictGrowthTrend(sessions);
  }, [sessions]);

  // Custom SVG Chart Generator
  const renderWpmChart = () => {
    if (sessions.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center border border-border-hairline bg-background rounded text-muted-soft text-xs font-mono">
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
      <div className="w-full bg-background border border-border-hairline rounded-md p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted font-mono">
          <span>Speed Performance Over Time (WPM)</span>
          <span className="text-primary font-semibold">Peak: {maxWpm} WPM</span>
        </div>
        <div className="relative w-full h-[160px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Gridlines */}
            <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="var(--card)" strokeWidth={1} />
            <line x1={padding} y1={padding + graphHeight / 2} x2={chartWidth - padding} y2={padding + graphHeight / 2} stroke="var(--card)" strokeWidth={1} />
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="var(--border-hairline)" strokeWidth={1} />

            {/* Gradient area */}
            <path d={fillPath} fill="url(#chartGradient)" />

            {/* Main line */}
            <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="var(--background)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  className="cursor-pointer hover:r-6 transition-all duration-100"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-hairline pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-serif text-foreground">Telemetry Dashboard</h1>
            <p className="text-sm text-muted">Keystroke analytics, latency heatmaps, and progress predictions compiled locally.</p>
          </div>
          {totalTests > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 border border-error/30 hover:border-error text-xs font-mono text-error rounded-md transition-all-smooth bg-error/5 hover:bg-error/15 focus:outline-none cursor-pointer"
            >
              Reset Session Logs
            </button>
          )}
        </div>

        {totalTests === 0 ? (
          /* Empty State */
          <div className="w-full bg-card border border-border-hairline rounded-lg p-16 text-center flex flex-col items-center gap-6 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-foreground">No Telemetry Logs Yet</h2>
            <p className="text-muted text-sm max-w-sm">
              Complete typing tests to compile metrics on keyboard latency, accuracy variance, and custom growth analytics.
            </p>
            <Link
              href="/test"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all-smooth"
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
                <div className="bg-card border border-border-hairline p-4 rounded-md">
                  <div className="flex items-center justify-between text-muted mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Avg Speed</span>
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground">{avgWpm}</p>
                  <p className="text-[10px] font-mono text-muted-soft">Words Per Min</p>
                </div>

                <div className="bg-card border border-border-hairline p-4 rounded-md">
                  <div className="flex items-center justify-between text-muted mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Accuracy</span>
                    <Percent className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground">{avgAccuracy}%</p>
                  <p className="text-[10px] font-mono text-muted-soft">Overall Ratio</p>
                </div>

                <div className="bg-card border border-border-hairline p-4 rounded-md">
                  <div className="flex items-center justify-between text-muted mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Total Tests</span>
                    <Award className="w-4 h-4 text-accent-teal" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground">{totalTests}</p>
                  <p className="text-[10px] font-mono text-muted-soft">Completed Runs</p>
                </div>
              </div>

              {/* Progress Line Chart */}
              {renderWpmChart()}

              {/* Interactive Telemetry Heatmap Section */}
              <div className="bg-card border border-border-hairline rounded-md p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-hairline pb-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-serif font-semibold">Keystroke Heatmap</span>
                  </div>
                  
                  {/* Heatmap switcher */}
                  <div className="flex gap-1 bg-background p-1 border border-border-hairline rounded text-[11px] font-mono">
                    <button
                      onClick={() => setHeatmapMode("latency")}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        heatmapMode === "latency" ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Latency
                    </button>
                    <button
                      onClick={() => setHeatmapMode("errors")}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        heatmapMode === "errors" ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Error Rate
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Visual mapping of your digraph keys based on average hesitation delay (Amber scale) or raw input errors (Red scale). Layout: <span className="font-mono text-primary uppercase font-bold">{lastLayout}</span>
                </p>

                <div className="w-full">
                  <VirtualKeyboard layout={lastLayout} heatmapMode={heatmapMode} heatmapData={heatmapData} />
                </div>
              </div>

              {/* Chronological History Log */}
              <div className="bg-card border border-border-hairline rounded-md p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-hairline pb-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <History className="w-4 h-4 text-primary" />
                    <span className="font-serif">Chronological Runs</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-soft">Showing latest {sessions.length} runs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-muted-soft border-b border-border-hairline pb-2 uppercase tracking-wider">
                        <th className="py-2 font-normal">Date / Time</th>
                        <th className="py-2 font-normal text-right">Speed</th>
                        <th className="py-2 font-normal text-right">Accuracy</th>
                        <th className="py-2 font-normal text-right">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-hairline text-muted">
                      {[...sessions].reverse().map((s, idx) => (
                        <tr key={idx} className="hover:text-foreground transition-colors">
                          <td className="py-2.5">
                            {new Date(s.timestamp).toLocaleDateString()} at {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 text-right font-bold text-primary">{s.wpm} WPM</td>
                          <td className="py-2.5 text-right text-success">{s.accuracy}%</td>
                          <td className="py-2.5 text-right capitalize">{s.mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (Weak Keys, Regression & Recommendations) */}
            <div className="flex flex-col gap-8">
              
              {/* AI Regression Growth Forecaster */}
              {totalTests >= 3 && (
                <div className="bg-card border border-border-hairline rounded-md p-6 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm border-b border-border-hairline pb-3">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    <span className="font-serif text-foreground font-semibold">AI Growth Forecaster</span>
                  </div>
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Learning Slope:</span>
                      <span className="font-mono text-foreground font-bold">{growthPrediction.slope > 0 ? `+${growthPrediction.slope}` : growthPrediction.slope} WPM/run</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Regression Fit ($R^2$):</span>
                      <span className="font-mono text-foreground font-bold">
                        {Math.round(growthPrediction.r2 * 100)}% ({growthPrediction.r2 > 0.6 ? "High Confidence" : "Awaiting Data"})
                      </span>
                    </div>
                    <div className="border-t border-border-hairline pt-3 flex flex-col gap-2 mt-1">
                      <p className="text-[10px] font-mono uppercase text-muted-soft tracking-wider">Projected Speed Milestones</p>
                      <div className="flex justify-between bg-background p-2 rounded border border-border-hairline">
                        <span className="text-muted">After 10 sessions:</span>
                        <span className="font-mono text-primary font-bold">{growthPrediction.predictedWPM10} WPM</span>
                      </div>
                      <div className="flex justify-between bg-background p-2 rounded border border-border-hairline">
                        <span className="text-muted">After 30 sessions:</span>
                        <span className="font-mono text-primary font-bold">{growthPrediction.predictedWPM30} WPM</span>
                      </div>
                      <div className="flex justify-between bg-background p-2 rounded border border-border-hairline">
                        <span className="text-muted">After 60 sessions:</span>
                        <span className="font-mono text-primary font-bold">{growthPrediction.predictedWPM60} WPM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weak Keys analysis */}
              <div className="bg-card border border-border-hairline rounded-md p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm border-b border-border-hairline pb-3">
                  <AlertTriangle className="w-4 h-4 text-accent-amber" />
                  <span className="font-serif text-foreground font-semibold">Tactile Weak Spots</span>
                </div>

                {weakKeys.length === 0 ? (
                  <p className="text-xs text-muted leading-relaxed">
                    Complete tests containing letters with different keystroke speeds to map error frequency distributions.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-muted leading-relaxed">
                      Keys scored by incorrect inputs (60% weight) and transition hesitation delay (40% weight).
                    </p>
                    <div className="flex flex-col gap-3">
                      {weakKeys.slice(0, 5).map((w, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-background border border-border-hairline p-2.5 rounded">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-card border border-border-hairline rounded flex items-center justify-center font-mono font-bold text-primary text-sm shadow-xs">
                              {w.key.toUpperCase()}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-mono text-muted">Error Rate</span>
                              <span className="text-[12px] font-mono font-semibold text-foreground">
                                {Math.round(w.errorRate * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-mono block text-muted">Avg Delay</span>
                            <span className="text-[12px] font-mono text-foreground">
                              {Math.round(w.avgLatency)}ms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Link
                      href="/ai-coach"
                      className="w-full text-center py-2.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-xs font-mono text-primary rounded transition-all-smooth mt-2 cursor-pointer font-semibold"
                    >
                      Build Remediation Plan
                    </Link>
                  </div>
                )}
              </div>

              {/* Pro Tips / Heuristics Card */}
              <div className="bg-card border border-border-hairline rounded-md p-6 flex flex-col gap-3 shadow-sm">
                <h3 className="font-serif text-sm text-foreground font-semibold">AI Analytics Advisor</h3>
                <div className="space-y-3 text-xs text-muted">
                  <p className="leading-relaxed">
                    💡 <strong className="text-foreground">Steady rhythm beats bursts:</strong> Typists with low latency standard deviations (under 80ms) maintain 15% fewer errors on average.
                  </p>
                  <p className="leading-relaxed">
                    💡 <strong className="text-foreground">Buffer key transitions:</strong> Most pauses happen when passing from vowel clusters (&apos;ou&apos;, &apos;ea&apos;) to hard consonants. Ensure regular wrist pivots.
                  </p>
                  <p className="leading-relaxed">
                    💡 <strong className="text-foreground">Practice offline daily:</strong> Committing 10 minutes a day to weak key sequences builds reflex consolidation inside the motor cortex.
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
