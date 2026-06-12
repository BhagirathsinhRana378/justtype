"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ResultsChartProps {
  history: { time: number; wpm: number; accuracy: number }[];
  errorsPerSecond: Record<number, number>;
  elapsedTime: number;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload && payload.errors > 0) {
    return (
      <svg
        x={cx - 4}
        y={cy - 4}
        width={8}
        height={8}
        viewBox="0 0 10 10"
        className="overflow-visible"
      >
        <path
          d="M1 1L9 9M9 1L1 9"
          stroke="var(--error)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border-hairline rounded-lg p-2.5 font-mono text-[11px] shadow-lg flex flex-col gap-1 select-none text-foreground">
        <div className="text-muted-soft font-semibold border-b border-border-hairline/40 pb-1 mb-1">
          Time: {label}s
        </div>
        <div className="flex items-center gap-6 justify-between">
          <span className="text-primary font-medium">wpm:</span>
          <span className="font-bold">{data.wpm}</span>
        </div>
        <div className="flex items-center gap-6 justify-between">
          <span className="text-muted-soft">raw:</span>
          <span className="font-semibold">{data.rawWpm}</span>
        </div>
        {data.errors > 0 && (
          <div className="flex items-center gap-6 justify-between">
            <span className="text-error font-medium">errors:</span>
            <span className="text-error font-bold">{data.errors}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ResultsChart({
  history,
  errorsPerSecond,
  elapsedTime,
}: ResultsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Ensure we start at 1s if history starts later
    return history.map((h) => {
      const rawWpm =
        h.accuracy > 0 ? Math.round((h.wpm * 100) / h.accuracy) : h.wpm;
      return {
        time: h.time,
        wpm: h.wpm,
        rawWpm: Math.min(250, rawWpm), // cap to avoid spikes
        errors: errorsPerSecond[h.time] || 0,
      };
    });
  }, [history, errorsPerSecond]);

  const maxWpm = useMemo(() => {
    if (chartData.length === 0) return 80;
    const maxVal = Math.max(...chartData.map((p) => Math.max(p.wpm, p.rawWpm)));
    return Math.max(80, Math.ceil((maxVal + 10) / 20) * 20); // round up to nearest 20
  }, [chartData]);

  if (!isMounted || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-muted-soft">
        Generating chart data...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[220px] relative font-mono text-[9px] select-none">
      {/* Background Gradients definitions */}
      <div className="hidden">
        <svg>
          <defs>
            <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={chartData}
          margin={{ top: 15, right: 15, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border-hairline)"
            strokeOpacity={0.15}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="var(--muted-soft)"
            strokeOpacity={0.3}
            tickFormatter={(tick) => `${tick}s`}
            style={{ fontSize: "8px", fill: "var(--muted-soft)" }}
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            domain={[0, maxWpm]}
            stroke="var(--muted-soft)"
            strokeOpacity={0.3}
            style={{ fontSize: "8px", fill: "var(--muted-soft)" }}
            tickLine={false}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-hairline)", strokeWidth: 1, strokeDasharray: "2 2" }} />
          
          {/* Raw WPM dashed line */}
          <Line
            type="monotone"
            dataKey="rawWpm"
            stroke="var(--muted-soft)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            strokeOpacity={0.35}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--muted-soft)" }}
          />

          {/* Actual WPM Area with gradient fill */}
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorWpm)"
            dot={<CustomDot />}
            activeDot={{ r: 5, strokeWidth: 0, fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
