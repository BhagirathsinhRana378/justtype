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
import { KeyTelemetry } from "@/utils/aiEngine";

interface ResultsChartProps {
  history: { time: number; wpm: number; accuracy: number }[];
  errorsPerSecond: Record<number, number>;
  elapsedTime: number;
  telemetry?: KeyTelemetry[];
}

interface CustomErrorDotProps {
  cx?: number;
  cy?: number;
  value?: number;
}

// Custom error marker for the Right Y-Axis (small red 'x' marks matching Monkeytype)
const CustomErrorDot = (props: CustomErrorDotProps) => {
  const { cx, cy, value } = props;
  if (cx === undefined || cy === undefined) return null;
  if (value && value > 0) {
    return (
      <g className="animate-fadeIn">
        <path
          d={`M${cx - 2} ${cy - 2} L${cx + 2} ${cy + 2} M${cx + 2} ${cy - 2} L${cx - 2} ${cy + 2}`}
          stroke="var(--error)"
          strokeWidth="1.0"
          strokeOpacity={0.85}
          strokeLinecap="round"
        />
      </g>
    );
  }
  return null;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      time: number;
      wpm: number;
      rawWpm: number;
      errors: number;
      exactMs: number;
    };
  }>;
}

// Polished Tooltip Component
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timeFormatted = `${data.time}s`;

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border-hairline rounded-xl p-3.5 font-mono text-[11px] shadow-2xl flex flex-col gap-1.5 select-none text-foreground min-w-[140px] border-primary/10 transition-all duration-200">
        <div className="text-muted-soft font-bold border-b border-border-hairline/40 pb-1.5 mb-1 flex items-center justify-between gap-3">
          <span>Time</span>
          <span className="text-primary font-semibold">{timeFormatted}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-primary font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            wpm:
          </span>
          <span className="font-bold text-foreground text-xs">{data.wpm}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-soft flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-soft/40" />
            raw:
          </span>
          <span className="font-semibold text-muted-soft">{data.rawWpm}</span>
        </div>
        {data.errors > 0 ? (
          <div className="flex items-center justify-between gap-4 border-t border-border-hairline/25 pt-1.5 mt-0.5">
            <span className="text-error font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              errors:
            </span>
            <span className="text-error font-black text-xs font-mono">{data.errors}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 border-t border-border-hairline/25 pt-1.5 mt-0.5 text-[10px] text-success/80">
            <span className="flex items-center gap-1">✓ No errors</span>
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
  telemetry,
}: ResultsChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted(true);
    });
    
    const handleResize = () => {
      setResizeKey((prev) => prev + 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartData = useMemo(() => {
    // Fallback to second-based history if telemetry is empty
    if (!telemetry || telemetry.length === 0) {
      if (!history || history.length === 0) return [];

      return history.map((h) => {
        const rawWpm = h.accuracy > 0 ? Math.round((h.wpm * 100) / h.accuracy) : h.wpm;
        return {
          time: h.time,
          wpm: Math.min(250, h.wpm),
          rawWpm: Math.min(250, rawWpm),
          errors: errorsPerSecond[h.time] || 0,
          exactMs: h.time * 1000,
        };
      });
    }

    // Build second-by-second timeline from telemetry
    const startTime = telemetry[0].timestamp - telemetry[0].latency;
    
    // Group telemetry events by second
    const secondsMap: Record<number, { correct: number; total: number; errors: number }> = {};
    
    telemetry.forEach((t) => {
      const elapsedMs = Math.max(0, t.timestamp - startTime);
      const sec = Math.max(1, Math.round(elapsedMs / 1000));
      
      if (!secondsMap[sec]) {
        secondsMap[sec] = { correct: 0, total: 0, errors: 0 };
      }
      
      secondsMap[sec].total++;
      if (t.isCorrect) {
        secondsMap[sec].correct++;
      } else {
        secondsMap[sec].errors++;
      }
    });

    const maxSec = Math.max(1, Math.round(elapsedTime));
    const points = [];
    
    let runningCorrect = 0;
    let runningTotal = 0;

    for (let s = 1; s <= maxSec; s++) {
      const data = secondsMap[s] || { correct: 0, total: 0, errors: 0 };
      runningCorrect += data.correct;
      runningTotal += data.total;
      
      const timeInMin = s / 60;
      const wpmVal = timeInMin > 0 ? Math.round((runningCorrect / 5) / timeInMin) : 0;
      const rawWpmVal = timeInMin > 0 ? Math.round((runningTotal / 5) / timeInMin) : 0;
      
      points.push({
        time: s,
        wpm: Math.min(250, wpmVal),
        rawWpm: Math.min(250, rawWpmVal),
        errors: data.errors,
        exactMs: s * 1000,
      });
    }
    
    // Append final decimal second data point if it extends beyond the last round second
    if (elapsedTime > maxSec && elapsedTime - maxSec > 0.1) {
      const timeInMin = elapsedTime / 60;
      const wpmVal = timeInMin > 0 ? Math.round((runningCorrect / 5) / timeInMin) : 0;
      const rawWpmVal = timeInMin > 0 ? Math.round((runningTotal / 5) / timeInMin) : 0;
      
      let tailErrors = 0;
      telemetry.forEach((t) => {
        const elapsedMs = Math.max(0, t.timestamp - startTime);
        const elapsedSec = elapsedMs / 1000;
        if (elapsedSec > maxSec && !t.isCorrect) {
          tailErrors++;
        }
      });

      points.push({
        time: Math.round(elapsedTime * 100) / 100,
        wpm: Math.min(250, wpmVal),
        rawWpm: Math.min(250, rawWpmVal),
        errors: tailErrors,
        exactMs: Math.round(elapsedTime * 1000),
      });
    }

    return points;
  }, [history, errorsPerSecond, telemetry, elapsedTime]);

  const maxWpm = useMemo(() => {
    if (chartData.length === 0) return 80;
    // Filter out the first 2 seconds of the test to avoid startup spikes distorting the graph scale
    const activePoints = chartData.filter((p) => p.time > 2);
    const pointsToUse = activePoints.length > 0 ? activePoints : chartData;
    
    const maxVal = Math.max(...pointsToUse.map((p) => Math.max(p.wpm, p.rawWpm)));
    return Math.max(80, Math.ceil((maxVal + 10) / 20) * 20); // round up to nearest 20
  }, [chartData]);

  const maxErrors = useMemo(() => {
    const errorCounts = Object.values(errorsPerSecond);
    if (errorCounts.length === 0) return 2;
    const maxVal = Math.max(...errorCounts);
    return Math.max(2, maxVal);
  }, [errorsPerSecond]);

  if (!isMounted || chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center font-mono text-xs text-muted-soft">
        Generating high-fidelity chart...
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] relative font-mono text-[9px] select-none">
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="wpmGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--primary)" floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>

      <ResponsiveContainer key={resizeKey} width="100%" height={300} minWidth={0}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 15, left: -25, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid
            stroke="var(--border-hairline)"
            strokeOpacity={0.05}
            strokeDasharray="4 4"
            vertical={false}
          />
          
          <XAxis
            type="number"
            dataKey="time"
            domain={[1, "dataMax"]}
            stroke="var(--muted-soft)"
            strokeOpacity={0.2}
            tickFormatter={(tick) => tick.toString()}
            style={{ fontSize: "9px", fill: "var(--muted-soft)", opacity: 0.8 }}
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />

          {/* Left Y Axis for WPM speed lines (scaling 0 to maxWpm) */}
          <YAxis
            yAxisId="left"
            domain={[0, maxWpm]}
            stroke="var(--muted-soft)"
            strokeOpacity={0.2}
            style={{ fontSize: "9px", fill: "var(--muted-soft)", opacity: 0.8 }}
            tickLine={false}
            axisLine={false}
            tickCount={5}
          />

          {/* Right Y Axis for discrete Errors (ticks 1, 2, etc.) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, maxErrors]}
            allowDecimals={false}
            stroke="var(--muted-soft)"
            strokeOpacity={0.2}
            style={{ fontSize: "8px", fill: "var(--muted-soft)", opacity: 0.7 }}
            tickLine={false}
            axisLine={false}
            tickCount={3}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: "var(--border-hairline)", strokeWidth: 1.2, strokeDasharray: "3 3", strokeOpacity: 0.3 }} 
          />
          
          {/* Raw WPM dashed line (natural cubic spline) */}
          <Line
            yAxisId="left"
            type="natural"
            dataKey="rawWpm"
            stroke="var(--muted-soft)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeOpacity={0.35}
            dot={false}
            activeDot={false}
          />

          {/* WPM Area gradient fill (natural cubic spline) */}
          <Area
            yAxisId="left"
            type="natural"
            dataKey="wpm"
            stroke="none"
            fillOpacity={1}
            fill="url(#colorWpm)"
            dot={false}
            activeDot={false}
          />

          {/* WPM Main Line with soft glow filter (natural cubic spline) */}
          <Line
            yAxisId="left"
            type="natural"
            dataKey="wpm"
            stroke="var(--primary)"
            strokeWidth={3}
            filter="url(#wpmGlow)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: "var(--primary)" }}
          />

          {/* Discrete Error markers plotted precisely on Right Y Axis */}
          <Line
            yAxisId="right"
            type="natural"
            dataKey="errors"
            stroke="transparent"
            dot={<CustomErrorDot />}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
