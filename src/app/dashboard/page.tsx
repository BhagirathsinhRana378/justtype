"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  AlertTriangle,
  History,
  Award,
  Zap,
  Percent,
  Activity,
  BrainCircuit,
  Flame,
  Trophy,
  Clock,
  CalendarDays,
  Waves,
  TrendingUp,
} from "lucide-react";
import { analyzeWeakKeys, calculateFocusScore, predictGrowthTrend } from "@/utils/aiEngine";
import { useSessions, dayIndex } from "@/hooks/useSessions";
import VirtualKeyboard, { KeyboardLayoutType } from "@/components/VirtualKeyboard";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

type RangeKey = "10" | "30" | "all";

interface ChartPoint {
  index: number;
  label: string;
  wpm: number;
  accuracy: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartPoint }>;
}) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card border border-border-hairline rounded-md shadow-lg px-3 py-2 text-xs font-mono">
      <p className="text-muted-soft text-[10px] uppercase tracking-wider mb-1">{p.label}</p>
      <p className="text-foreground">
        <span className="text-primary font-bold">{p.wpm}</span> WPM
      </p>
      <p className="text-foreground">
        <span className="text-accent-teal font-bold">{p.accuracy}%</span> accuracy
      </p>
    </div>
  );
}

const DAY_MS = 86_400_000;

export default function DashboardPage() {
  const { sessions, stats, loaded, clear } = useSessions();
  const [heatmapMode, setHeatmapMode] = useState<"errors" | "latency">("latency");
  const [range, setRange] = useState<RangeKey>("30");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const weakKeys = useMemo(() => analyzeWeakKeys(sessions), [sessions]);
  const growthPrediction = useMemo(() => predictGrowthTrend(sessions), [sessions]);

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

    sessions.forEach((session) => {
      session.telemetry.forEach((t) => {
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
    Object.keys(acc).forEach((k) => {
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

  // Chart data filtered by selected range
  const chartData = useMemo<ChartPoint[]>(() => {
    const sliced = range === "all" ? sessions : sessions.slice(-parseInt(range, 10));
    return sliced.map((s, i) => ({
      index: i + 1,
      label: new Date(s.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      wpm: s.wpm,
      accuracy: s.accuracy,
    }));
  }, [sessions, range]);

  // Insight: consistency score trend (avg focus of last 5 vs previous 5)
  const consistencyTrend = useMemo(() => {
    if (sessions.length === 0) return null;
    const scores = sessions.map((s) => calculateFocusScore(s));
    const recent = scores.slice(-5);
    const prev = scores.slice(-10, -5);
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const recentAvg = avg(recent);
    const delta = prev.length > 0 ? recentAvg - avg(prev) : 0;
    return { recentAvg, delta };
  }, [sessions]);

  // Insight: best time of day by average WPM
  const bestTimeOfDay = useMemo(() => {
    if (sessions.length === 0) return null;
    const buckets: Record<string, { sum: number; count: number }> = {
      Morning: { sum: 0, count: 0 },
      Afternoon: { sum: 0, count: 0 },
      Evening: { sum: 0, count: 0 },
      Night: { sum: 0, count: 0 },
    };
    sessions.forEach((s) => {
      const h = new Date(s.timestamp).getHours();
      const name = h >= 5 && h < 12 ? "Morning" : h >= 12 && h < 17 ? "Afternoon" : h >= 17 && h < 22 ? "Evening" : "Night";
      buckets[name].sum += s.wpm;
      buckets[name].count += 1;
    });
    let bestName = "";
    let bestAvg = 0;
    Object.entries(buckets).forEach(([name, b]) => {
      if (b.count === 0) return;
      const a = b.sum / b.count;
      if (a > bestAvg) {
        bestAvg = a;
        bestName = name;
      }
    });
    return bestName ? { name: bestName, avg: Math.round(bestAvg) } : null;
  }, [sessions]);

  // Insight: last-30-day activity dots
  const calendarDots = useMemo(() => {
    const tested = new Set(sessions.map((s) => dayIndex(s.timestamp)));
    const today = dayIndex(Date.now());
    const dots: { day: number; active: boolean }[] = [];
    for (let offset = 29; offset >= 0; offset--) {
      const day = today - offset;
      dots.push({ day, active: tested.has(day) });
    }
    return dots;
  }, [sessions]);

  // Insight: avg WPM this week vs previous week
  const weekDelta = useMemo(() => {
    const now = Date.now();
    const week = 7 * DAY_MS;
    const cur = sessions.filter((s) => now - s.timestamp < week);
    const prev = sessions.filter((s) => now - s.timestamp >= week && now - s.timestamp < 2 * week);
    if (cur.length === 0) return null;
    const avg = (arr: typeof sessions) => arr.reduce((a, b) => a + b.wpm, 0) / arr.length;
    const curAvg = Math.round(avg(cur));
    if (prev.length === 0) return { curAvg, delta: null as number | null };
    return { curAvg, delta: curAvg - Math.round(avg(prev)) };
  }, [sessions]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  if (!loaded) {
    return (
      <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <SectionHeader
          icon={BarChart3}
          title="Telemetry Dashboard"
          subtitle="Keystroke analytics, latency heatmaps, and progress predictions compiled locally."
          actions={
            stats.totalTests > 0 ? (
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-4 py-2 border border-error/30 hover:border-error text-xs font-mono text-error rounded-md transition-all-smooth bg-error/5 hover:bg-error/15 cursor-pointer"
              >
                Reset Session Logs
              </button>
            ) : undefined
          }
        />

        {stats.totalTests === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No Telemetry Logs Yet"
            description="Complete typing tests to compile metrics on keyboard latency, accuracy variance, and custom growth analytics."
            ctaLabel="Launch Core Workbench"
            ctaHref="/type"
          />
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
            {/* Hero stats row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Avg Speed" value={stats.avgWpm} sub="Words Per Min" icon={Zap} />
              <StatCard label="Peak Speed" value={stats.peakWpm} sub="Personal Best" icon={Trophy} iconClassName="text-accent-amber" />
              <StatCard label="Accuracy" value={`${stats.avgAccuracy}%`} sub="Overall Ratio" icon={Percent} iconClassName="text-success" />
              <StatCard label="Total Tests" value={stats.totalTests} sub="Completed Runs" icon={Award} iconClassName="text-accent-teal" />
              <StatCard
                label="Streak"
                value={stats.currentStreak}
                sub={`Best: ${stats.bestStreak} days`}
                icon={Flame}
                iconClassName="text-accent-amber"
                className="col-span-2 sm:col-span-1"
              />
            </motion.div>

            {/* Insight cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border-hairline rounded-lg p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Consistency</span>
                  <Waves className="w-4 h-4 text-accent-teal" aria-hidden="true" />
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">{consistencyTrend?.recentAvg ?? "--"}%</p>
                {consistencyTrend && consistencyTrend.delta !== 0 && (
                  <p className={`text-[10px] font-mono font-semibold ${consistencyTrend.delta > 0 ? "text-success" : "text-error"}`}>
                    {consistencyTrend.delta > 0 ? "+" : ""}
                    {consistencyTrend.delta} vs previous 5 runs
                  </p>
                )}
                {consistencyTrend && consistencyTrend.delta === 0 && (
                  <p className="text-[10px] font-mono text-muted-soft">Steady rhythm trend</p>
                )}
              </div>

              <div className="bg-card border border-border-hairline rounded-lg p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Best Time of Day</span>
                  <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">{bestTimeOfDay?.name ?? "--"}</p>
                <p className="text-[10px] font-mono text-muted-soft">
                  {bestTimeOfDay ? `Avg ${bestTimeOfDay.avg} WPM in this window` : "Not enough data"}
                </p>
              </div>

              <div className="bg-card border border-border-hairline rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Last 30 Days</span>
                  <CalendarDays className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <div className="flex flex-wrap gap-1" aria-label={`Active on ${calendarDots.filter((d) => d.active).length} of the last 30 days`}>
                  {calendarDots.map((dot) => (
                    <span
                      key={dot.day}
                      className={`w-2 h-2 rounded-full ${dot.active ? "bg-primary" : "bg-background border border-border-hairline"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-muted-soft">
                  {calendarDots.filter((d) => d.active).length} active days · {stats.currentStreak} day streak
                </p>
              </div>

              <div className="bg-card border border-border-hairline rounded-lg p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-mono uppercase tracking-wider">This Week</span>
                  <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">{weekDelta ? `${weekDelta.curAvg} WPM` : "--"}</p>
                {weekDelta?.delta !== null && weekDelta?.delta !== undefined ? (
                  <p className={`text-[10px] font-mono font-semibold ${weekDelta.delta >= 0 ? "text-success" : "text-error"}`}>
                    {weekDelta.delta >= 0 ? "+" : ""}
                    {weekDelta.delta} WPM vs last week
                  </p>
                ) : (
                  <p className="text-[10px] font-mono text-muted-soft">No sessions last week to compare</p>
                )}
              </div>
            </motion.div>

            {/* Performance chart */}
            <motion.div variants={itemVariants} className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-hairline pb-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="font-serif font-normal text-lg">Performance Over Time</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-muted-soft">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-[3px] rounded-full bg-primary" aria-hidden="true" /> WPM
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-[3px] rounded-full bg-accent-teal" aria-hidden="true" /> Accuracy
                    </span>
                  </div>
                  <div className="flex gap-1 bg-background p-1 border border-border-hairline rounded text-[11px] font-mono" role="tablist" aria-label="Chart time range">
                    {(["10", "30", "all"] as RangeKey[]).map((r) => (
                      <button
                        key={r}
                        role="tab"
                        aria-selected={range === r}
                        onClick={() => setRange(r)}
                        className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                          range === r ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                        }`}
                      >
                        {r === "all" ? "All" : `Last ${r}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {chartData.length < 2 ? (
                <div className="h-56 flex items-center justify-center text-muted-soft text-xs font-mono">
                  Complete at least 2 sessions to render historical trends.
                </div>
              ) : (
                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border-hairline)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--muted-soft)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border-hairline)" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="wpm"
                        tick={{ fill: "var(--muted-soft)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <YAxis yAxisId="acc" orientation="right" domain={[0, 100]} hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-hairline)" }} />
                      <Area
                        yAxisId="wpm"
                        type="monotone"
                        dataKey="wpm"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#wpmFill)"
                        isAnimationActive={!reduceMotion}
                      />
                      <Line
                        yAxisId="acc"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="var(--accent-teal)"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        isAnimationActive={!reduceMotion}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Two-column: heatmap + weak keys */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-border-hairline pb-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="font-serif font-normal text-lg">Keystroke Heatmap</span>
                  </div>

                  <div className="flex gap-1 bg-background p-1 border border-border-hairline rounded text-[11px] font-mono" role="tablist" aria-label="Heatmap mode">
                    <button
                      role="tab"
                      aria-selected={heatmapMode === "latency"}
                      onClick={() => setHeatmapMode("latency")}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        heatmapMode === "latency" ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Latency
                    </button>
                    <button
                      role="tab"
                      aria-selected={heatmapMode === "errors"}
                      onClick={() => setHeatmapMode("errors")}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        heatmapMode === "errors" ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Error Rate
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Keys shaded by {heatmapMode === "latency" ? "average hesitation delay" : "raw input error rate"} using the
                  theme accent. Layout:{" "}
                  <span className="font-mono text-primary uppercase font-bold">{lastLayout}</span>
                </p>

                <motion.div
                  key={heatmapMode}
                  initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  <VirtualKeyboard layout={lastLayout} heatmapMode={heatmapMode} heatmapData={heatmapData} heatmapStyle="primary" />
                </motion.div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-soft">
                  <span>{heatmapMode === "latency" ? "Fast" : "Clean"}</span>
                  <span
                    className="flex-1 max-w-[200px] h-2 rounded-full border border-border-hairline"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(var(--primary-rgb), 0.08), rgba(var(--primary-rgb), 0.8))",
                    }}
                    aria-hidden="true"
                  />
                  <span>{heatmapMode === "latency" ? "Hesitant" : "Error-prone"}</span>
                </div>
              </motion.div>

              {/* Right column: weak keys + growth */}
              <div className="flex flex-col gap-8">
                <motion.div variants={itemVariants} className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm border-b border-border-hairline pb-3">
                    <AlertTriangle className="w-4 h-4 text-accent-amber" aria-hidden="true" />
                    <span className="font-serif font-normal text-lg text-foreground">Tactile Weak Spots</span>
                  </div>

                  {weakKeys.length === 0 ? (
                    <p className="text-xs text-muted leading-relaxed">
                      Complete tests containing letters with different keystroke speeds to map error frequency distributions.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {weakKeys.slice(0, 5).map((w) => (
                        <div key={w.key} className="flex items-center justify-between bg-background border border-border-hairline p-2.5 rounded">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-card border border-border-hairline rounded flex items-center justify-center font-mono font-bold text-primary text-sm">
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
                            <span className="text-[12px] font-mono text-foreground">{Math.round(w.avgLatency)}ms</span>
                          </div>
                        </div>
                      ))}
                      <Link
                        href="/ai-coach"
                        className="w-full text-center py-2.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-xs font-mono text-primary rounded transition-all-smooth font-semibold"
                      >
                        Build Remediation Plan
                      </Link>
                    </div>
                  )}
                </motion.div>

                {stats.totalTests >= 3 && (
                  <motion.div variants={itemVariants} className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-sm border-b border-border-hairline pb-3">
                      <BrainCircuit className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="font-serif font-normal text-lg text-foreground">Growth Forecaster</span>
                    </div>
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Learning Slope:</span>
                        <span className="font-mono text-foreground font-bold">
                          {growthPrediction.slope > 0 ? `+${growthPrediction.slope}` : growthPrediction.slope} WPM/run
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Regression Fit:</span>
                        <span className="font-mono text-foreground font-bold">
                          {Math.round(growthPrediction.r2 * 100)}% ({growthPrediction.r2 > 0.6 ? "High Confidence" : "Awaiting Data"})
                        </span>
                      </div>
                      <div className="border-t border-border-hairline pt-3 flex flex-col gap-2 mt-1">
                        <p className="text-[10px] font-mono uppercase text-muted-soft tracking-wider">Projected Speed Milestones</p>
                        {[
                          { label: "After 10 sessions", value: growthPrediction.predictedWPM10 },
                          { label: "After 30 sessions", value: growthPrediction.predictedWPM30 },
                          { label: "After 60 sessions", value: growthPrediction.predictedWPM60 },
                        ].map((m) => (
                          <div key={m.label} className="flex justify-between bg-background p-2 rounded border border-border-hairline">
                            <span className="text-muted">{m.label}:</span>
                            <span className="font-mono text-primary font-bold">{m.value} WPM</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Recent sessions table */}
            <motion.div variants={itemVariants} className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-hairline pb-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <History className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="font-serif font-normal text-lg">Recent Sessions</span>
                </div>
                <Link href="/profile" className="text-[11px] font-mono text-primary hover:underline">
                  View full history →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-muted-soft border-b border-border-hairline uppercase tracking-wider">
                      <th className="py-2 font-normal">Date / Time</th>
                      <th className="py-2 font-normal text-right">Speed</th>
                      <th className="py-2 font-normal text-right">Accuracy</th>
                      <th className="py-2 font-normal text-right">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline text-muted">
                    {[...sessions].reverse().slice(0, 10).map((s) => (
                      <tr key={s.id} className="hover:text-foreground transition-colors">
                        <td className="py-2.5">
                          {new Date(s.timestamp).toLocaleDateString()} at{" "}
                          {new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2.5 text-right font-bold text-primary">{s.wpm} WPM</td>
                        <td className="py-2.5 text-right text-success">{s.accuracy}%</td>
                        <td className="py-2.5 text-right capitalize">{s.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="Clear all session history?"
        description="This permanently deletes every typing session log, including telemetry used for heatmaps and AI coaching. This cannot be undone."
        confirmLabel="Clear history"
        cancelLabel="Keep my logs"
        onConfirm={() => {
          clear();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
