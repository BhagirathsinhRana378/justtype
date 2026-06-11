"use client";

import { useState, useEffect, useMemo } from "react";
import { useTypingTest, KeyboardLayoutType, CaretType } from "@/hooks/useTypingTest";
import TypingTestArea from "@/components/TypingTestArea";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import { Clock, FileText, Quote, Sparkles, Keyboard } from "lucide-react";
import { calculateFocusScore, getSavedSessions } from "@/utils/aiEngine";

// SVG Line Chart Component for score display
interface ChartProps {
  history: { time: number; wpm: number; accuracy: number }[];
  errorsPerSecond: Record<number, number>;
  elapsedTime: number;
}

const getSvgCoords = (
  time: number,
  wpmValue: number,
  maxWpm: number,
  elapsedTime: number,
  svgWidth: number,
  svgHeight: number,
  paddingX: number,
  paddingY: number
) => {
  const x = paddingX + ((time - 1) / Math.max(1, elapsedTime - 1)) * (svgWidth - 2 * paddingX);
  const y = svgHeight - paddingY - (wpmValue / maxWpm) * (svgHeight - 2 * paddingY);
  return { x, y };
};

const ScoreChart: React.FC<ChartProps> = ({ history, errorsPerSecond, elapsedTime }) => {
  const points = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    return history.map(h => {
      // Calculate raw WPM mathematically: raw = wpm / accuracy
      const rawWpm = h.accuracy > 0 ? Math.round((h.wpm * 100) / h.accuracy) : h.wpm;
      return {
        time: h.time,
        wpm: h.wpm,
        rawWpm: Math.min(250, rawWpm), // cap to avoid crazy spikes
        errors: errorsPerSecond[h.time] || 0
      };
    });
  }, [history, errorsPerSecond]);

  const maxWpm = useMemo(() => {
    if (points.length === 0) return 80;
    const maxVal = Math.max(...points.map(p => Math.max(p.wpm, p.rawWpm)));
    return Math.max(80, Math.ceil((maxVal + 10) / 20) * 20); // round up to nearest 20
  }, [points]);

  const svgWidth = 700;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;

  const wpmPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, idx) => {
      const { x, y } = getSvgCoords(p.time, p.wpm, maxWpm, elapsedTime, svgWidth, svgHeight, paddingX, paddingY);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }, [points, maxWpm, elapsedTime]);

  const rawWpmPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, idx) => {
      const { x, y } = getSvgCoords(p.time, p.rawWpm, maxWpm, elapsedTime, svgWidth, svgHeight, paddingX, paddingY);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }, [points, maxWpm, elapsedTime]);

  return (
    <div className="w-full h-[200px] relative font-mono text-[9px] text-muted-soft/40 select-none">
      {/* Y-Axis Labels */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between items-end pr-2 text-[8px] pointer-events-none py-[16px]">
        <span>{maxWpm}</span>
        <span>{Math.round(maxWpm * 0.75)}</span>
        <span>{Math.round(maxWpm * 0.5)}</span>
        <span>{Math.round(maxWpm * 0.25)}</span>
        <span>0</span>
      </div>

      {/* SVG Container */}
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
        {/* Horizontal Dotted Gridlines */}
        {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
          const y = paddingY + (1 - ratio) * (svgHeight - 2 * paddingY);
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={svgWidth - paddingX}
              y2={y}
              stroke="var(--border-hairline)"
              strokeOpacity="0.15"
              strokeDasharray="3 3"
            />
          );
        })}

        {points.length > 1 && (
          <>
            {/* Raw WPM path (dashed gray) */}
            <path
              d={rawWpmPath}
              fill="none"
              stroke="var(--muted-soft)"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* WPM path (solid yellow/primary) */}
            <path
              d={wpmPath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Error markers (red 'x') */}
        {points.map((p) => {
          if (p.errors > 0) {
            const { x, y } = getSvgCoords(p.time, p.rawWpm, maxWpm, elapsedTime, svgWidth, svgHeight, paddingX, paddingY);
            return (
              <g key={p.time} className="text-error">
                <line x1={x - 2.5} y1={y - 2.5} x2={x + 2.5} y2={y + 2.5} stroke="currentColor" strokeWidth="1.5" />
                <line x1={x - 2.5} y1={y + 2.5} x2={x + 2.5} y2={y - 2.5} stroke="currentColor" strokeWidth="1.5" />
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* X-Axis labels */}
      <div className="absolute left-[40px] right-[40px] bottom-0 flex justify-between text-[8px] pointer-events-none">
        <span>1s</span>
        <span>{Math.round(elapsedTime / 2)}s</span>
        <span>{elapsedTime}s</span>
      </div>
    </div>
  );
};

export default function TypePage() {
  const {
    mode,
    limit,
    caretType,
    layout,
    words,
    typedInput,
    status,
    timeLeft,
    elapsedTime,
    wpm,
    accuracy,
    history,
    getTelemetry,
    setMode,
    setLimit,
    setCaretType,
    setLayout,
    restartTest,
    registerKeystroke
  } = useTypingTest();

  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, { errorRate: number; avgLatency: number; score: number }>>({});

  // Compute focus score at the end of the test
  const finalFocusScore = status === "completed" 
    ? calculateFocusScore({
        id: "",
        timestamp: 0,
        wpm,
        accuracy,
        duration: elapsedTime,
        mode,
        telemetry: getTelemetry()
      })
    : 100;

  // Keyboard listeners for pressed keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (status === "completed") return;

      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => prev.filter((k) => k !== key));
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
    };
  }, [status]);

  // Load telemetry stats for keyboard heatmap overlay
  useEffect(() => {
    try {
      const sessions = getSavedSessions();
      interface HeatmapAccumulator {
        total: number;
        errors: number;
        latencies: number[];
      }
      const acc: Record<string, HeatmapAccumulator> = {};
      
      sessions.forEach(session => {
        if (!session.telemetry) return;
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
      setTimeout(() => setHeatmapData(data), 0);
    } catch (e) {
      console.error("Failed to compile keyboard heatmap stats", e);
    }
  }, [status]);

  // Calculate the next character to type for the keyboard finger hint
  const nextChar = useMemo(() => {
    if (status === "completed" || !words || words.length === 0) return "";
    const targetText = words.join(" ");
    return targetText[typedInput.length] || "";
  }, [words, typedInput.length, status]);

  const isFocusMode = status === "typing";

  // Group errors by second from telemetry data
  const errorsPerSecond = useMemo(() => {
    const telemetry = getTelemetry();
    if (telemetry.length === 0) return {};
    const start = telemetry[0].timestamp;
    const errorMap: Record<number, number> = {};
    telemetry.forEach((t) => {
      if (!t.isCorrect) {
        const sec = Math.min(
          elapsedTime || 1,
          Math.max(1, Math.round((t.timestamp - start) / 1000))
        );
        errorMap[sec] = (errorMap[sec] || 0) + 1;
      }
    });
    return errorMap;
  }, [getTelemetry, elapsedTime]);

  // Calculate correct, incorrect, extra, and missed character counts
  const charStats = useMemo(() => {
    const telemetry = getTelemetry();
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    
    telemetry.forEach((t) => {
      if (t.isCorrect) {
        correct++;
      } else {
        if (t.key === "") {
          extra++;
        } else {
          incorrect++;
        }
      }
    });

    const targetText = words.join(" ");
    let missed = 0;
    if (status === "completed") {
      for (let i = typedInput.length; i < targetText.length; i++) {
        if (targetText[i] !== " ") {
          missed++;
        }
      }
    }

    return { correct, incorrect, extra, missed };
  }, [getTelemetry, words, typedInput.length, status]);

  return (
    <div className="w-full flex-1 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between items-center bg-background relative select-none px-4 sm:px-6 py-6 md:py-8 z-10">
      
      {status !== "completed" ? (
        <>
          {/* 1. COMPACT CONTROLS TOOLBAR */}
          <div 
            className={`w-full max-w-[850px] flex items-center justify-between bg-card/25 border border-border-hairline rounded-[12px] px-6 h-[52px] font-mono text-sm text-muted gap-4 overflow-x-auto whitespace-nowrap scrollbar-none transition-all duration-300 shrink-0 ${
              isFocusMode ? "opacity-15 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Left: Mode Selector */}
            <div className="flex items-center bg-background/20 p-0.5 rounded-lg border border-border-hairline/40 shrink-0">
              <button
                onClick={() => setMode("time")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "time" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>time</span>
              </button>
              <button
                onClick={() => setMode("words")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "words" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>words</span>
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "quote" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>quote</span>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  mode === "custom" ? "text-primary bg-primary/10" : "hover:text-foreground text-muted-soft"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>zen</span>
              </button>
            </div>

            {/* Center: Limit / Duration Options */}
            <div className="flex-1 flex justify-center border-x border-border-hairline/30 px-4">
              {mode === "time" && (
                <div className="flex items-center gap-1">
                  {[15, 30, 60, 120].map((t, i, arr) => (
                    <div key={t} className="flex items-center">
                      <button
                        onClick={() => setLimit(t)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === t 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {t}s
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mode === "words" && (
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((w, i, arr) => (
                    <div key={w} className="flex items-center">
                      <button
                        onClick={() => setLimit(w)}
                        className={`px-2.5 py-1 rounded-md text-[13px] transition-all duration-200 cursor-pointer font-medium ${
                          limit === w 
                            ? "text-primary bg-primary/10" 
                            : "hover:text-foreground text-muted-soft hover:bg-card/40"
                        }`}
                      >
                        {w}
                      </button>
                      {i < arr.length - 1 && (
                        <span className="mx-0.5 text-muted-soft/20 select-none">·</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Layout & Caret Dropdowns (No Sound Section) */}
            <div className="flex items-center space-x-3 pl-2 shrink-0">
              {/* Layout */}
              <div className="flex items-center space-x-1 font-sans">
                <Keyboard className="w-3.5 h-3.5 text-muted-soft" />
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as KeyboardLayoutType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1"
                >
                  <option value="qwerty" className="bg-card">QWERTY</option>
                  <option value="dvorak" className="bg-card">Dvorak</option>
                  <option value="colemak" className="bg-card">Colemak</option>
                </select>
              </div>

              {/* Caret */}
              <div className="flex items-center space-x-1 font-sans">
                <span className="text-[12.5px] text-muted-soft">|</span>
                <select
                  value={caretType}
                  onChange={(e) => setCaretType(e.target.value as CaretType)}
                  className="bg-transparent text-muted hover:text-foreground text-[12.5px] outline-none border-none cursor-pointer pr-1 ml-0.5"
                >
                  <option value="smooth" className="bg-card">Line</option>
                  <option value="block" className="bg-card">Block</option>
                  <option value="underline" className="bg-card">Under</option>
                  <option value="hidden" className="bg-card">Hide</option>
                </select>
              </div>
            </div>

          </div>

          {/* 2. CENTERED EXPERIENCE BLOCK */}
          <div 
            className="w-full flex-1 flex flex-col justify-center items-center py-2 transition-all duration-300 ease-in-out"
            style={{
              maxWidth: isFocusMode ? "1080px" : "850px",
            }}
          >
            {/* Live stats HUD - Minimal design */}
            <div 
              className={`flex items-center gap-6 font-mono text-[11px] text-muted-soft h-6 select-none transition-opacity duration-300 mb-[16px] shrink-0 ${
                isFocusMode ? "opacity-45" : "opacity-90"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>time:</span>
                <span className="text-foreground font-semibold">
                  {status === "typing"
                    ? (mode === "time" ? `${timeLeft}s` : `${elapsedTime}s`)
                    : (mode === "time" ? `${limit}s` : `--`)}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>wpm:</span>
                <span className="text-primary font-semibold">{status === "typing" ? wpm : `--`}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-hairline" />
              <div className="flex items-center gap-1.5">
                <span>acc:</span>
                <span className="text-success font-semibold">{status === "typing" ? `${accuracy}%` : `100%`}</span>
              </div>
            </div>

            {/* Word board wrapper */}
            <div className="w-full">
              <TypingTestArea
                words={words}
                typedInput={typedInput}
                status={status}
                caretType={caretType}
                layout={layout}
                registerKeystroke={registerKeystroke}
                restartTest={restartTest}
              />
            </div>

            {/* Restart Info row */}
            <div 
              className={`mt-4 flex items-center gap-3 text-[11px] text-muted-soft select-none font-mono transition-opacity duration-300 ${
                isFocusMode ? "opacity-15 hover:opacity-50" : "opacity-80"
              }`}
            >
              <button
                onClick={() => {
                  restartTest();
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                {/* Circular Restart arrow SVG */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 9.5a2.5 2.5 0 115 0" />
                </svg>
                <span>Restart</span>
              </button>
              <span>•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-card border border-border-hairline rounded text-[9px] text-muted select-none">Tab</kbd>
                <span>quick reset</span>
              </div>
            </div>

          </div>

          {/* 3. FIXED BOTTOM SECTION: Virtual Keyboard */}
          <div 
            className={`w-full max-w-[740px] transition-all duration-300 shrink-0 select-none ${
              isFocusMode 
                ? "translate-y-4 pointer-events-none" 
                : "translate-y-0"
            }`}
          >
            <VirtualKeyboard 
              layout={layout} 
              pressedKeys={pressedKeys} 
              heatmapMode="none"
              heatmapData={heatmapData}
              interactive={false}
              nextChar={nextChar}
              isFocusMode={isFocusMode}
            />
          </div>
        </>
      ) : (
        /* Finished Test Scorecard exactly matching the reference Monkeytype image */
        <div className="w-full flex-1 flex flex-col items-center justify-center max-w-[960px] py-4 animate-fadeIn font-mono">
          <div className="w-full flex flex-col md:flex-row items-stretch gap-6 mb-6">
            
            {/* Left Column: WPM and Accuracy stacked vertically */}
            <div className="flex flex-col justify-center items-start md:w-[180px] gap-6 pl-4 select-none shrink-0">
              <div>
                <span className="text-muted-soft text-lg font-mono tracking-wide block mb-0.5">wpm</span>
                <span className="text-[64px] md:text-[76px] font-bold text-primary leading-none block">{wpm}</span>
              </div>
              <div>
                <span className="text-muted-soft text-lg font-mono tracking-wide block mb-0.5">acc</span>
                <span className="text-[64px] md:text-[76px] font-bold text-primary leading-none block">{accuracy}%</span>
              </div>
            </div>

            {/* Right Column: Custom SVG Score Chart */}
            <div className="flex-1 min-h-[220px] bg-background/20 border border-border-hairline/20 rounded-xl p-4 flex items-center justify-center">
              <ScoreChart 
                history={history} 
                errorsPerSecond={errorsPerSecond} 
                elapsedTime={elapsedTime} 
              />
            </div>

          </div>

          {/* Score Details Row */}
          <div className="w-full grid grid-cols-2 md:grid-cols-6 gap-6 text-left border-t border-border-hairline/10 pt-5 px-4 select-none">
            
            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">test type</p>
              <p className="text-base font-semibold text-primary">{mode} {limit}</p>
              <p className="text-[9px] text-muted-soft/50">english</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">other</p>
              <p className="text-base font-semibold text-primary">
                {accuracy < 85 ? "invalid (accuracy)" : "none"}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">raw</p>
              <p className="text-base font-semibold text-primary">
                {accuracy > 0 ? Math.round((wpm * 100) / accuracy) : wpm}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">characters</p>
              <p className="text-base font-semibold text-primary">
                {charStats.correct}/{charStats.incorrect}/{charStats.extra}/{charStats.missed}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">consistency</p>
              <p className="text-base font-semibold text-primary">{finalFocusScore}%</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-soft tracking-wider mb-0.5">time</p>
              <p className="text-base font-semibold text-primary">{elapsedTime}s</p>
              <p className="text-[9px] text-muted-soft/50">00:00:{elapsedTime < 10 ? `0${elapsedTime}` : elapsedTime} session</p>
            </div>

          </div>

          {/* Toolbar Buttons Row */}
          <div className="w-full flex justify-center items-center gap-8 mt-10 mb-5">
            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Next test"
            >
              {/* Chevron right SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Restart test"
            >
              {/* Reset circular arrow SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 9.5a2.5 2.5 0 115 0" />
              </svg>
            </button>

            <button
              className="p-2 rounded-lg text-muted-soft/30 hover:text-muted-soft transition-colors cursor-not-allowed"
              title="Error info"
              disabled
            >
              {/* Warning exclamation SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>

            <button
              className="p-2 rounded-lg text-muted-soft/30 hover:text-muted-soft transition-colors cursor-not-allowed"
              title="Text view"
              disabled
            >
              {/* Lines list SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={restartTest}
              className="p-2 rounded-lg text-muted-soft hover:text-foreground hover:bg-card/40 transition-colors cursor-pointer"
              title="Back"
            >
              {/* Back double chevron SVG */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <p className="text-[10px] text-muted-soft/30 select-none">
            Sign in to save your result
          </p>

        </div>
      )}

    </div>
  );
}
