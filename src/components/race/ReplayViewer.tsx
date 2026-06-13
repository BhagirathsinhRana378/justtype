"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Play, Pause, X, RotateCcw, ShieldAlert, Sparkles, ChevronRight } from "lucide-react";

interface ReplayEvent {
  t: number; // millisecond timestamp since race start
  playerId: string;
  type: "key" | "mistake" | "boost" | "finish";
  wpm: number;
  acc: number;
  pos: number;
}

interface PlayerData {
  id: string;
  name: string;
  carType: string;
}

interface ReplayViewerProps {
  text: string;
  players: PlayerData[];
  events: ReplayEvent[];
  onClose: () => void;
}

export default function ReplayViewer({ text, players, events, onClose }: ReplayViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Player state computed at current time
  // id -> { progress, wpm, acc, activeStatus }
  const [currentStates, setCurrentStates] = useState<Map<string, { progress: number; wpm: number; acc: number; status: string }>>(new Map());

  // Replay Time Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 2x, 4x

  // Find max time of events
  const maxTime = useMemo(() => {
    if (events.length === 0) return 1000;
    return Math.max(...events.map(e => e.t));
  }, [events]);

  // Compute milestones on the timeline (mistakes, boosts)
  const timelineMilestones = useMemo(() => {
    return events.filter(e => e.type === "mistake" || e.type === "boost");
  }, [events]);

  // Handle Playhead loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let animationId: number;

    const tick = (now: number) => {
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      setCurrentTime(prev => {
        const nextTime = prev + delta * speed;
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return nextTime;
      });

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, speed, maxTime]);

  // Re-calculate positions whenever currentTime changes
  useEffect(() => {
    const states = new Map<string, { progress: number; wpm: number; acc: number; status: string }>();

    // Initial state for all players
    players.forEach(p => {
      states.set(p.id, { progress: 0, wpm: 0, acc: 100, status: "racing" });
    });

    // Sort events by time
    const sortedEvents = [...events].sort((a, b) => a.t - b.t);

    // Apply events up to currentTime
    sortedEvents.forEach(e => {
      if (e.t <= currentTime) {
        const state = states.get(e.playerId);
        if (state) {
          state.progress = e.pos;
          state.wpm = e.wpm;
          state.acc = e.acc;
          if (e.type === "finish") {
            state.status = "completed";
          }
        }
      }
    });

    setCurrentStates(states);
  }, [currentTime, players, events]);

  // Draw Replay Canvas Track
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    width = canvas.width;
    height = canvas.height;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const scaleWidth = width / window.devicePixelRatio;
    const scaleHeight = height / window.devicePixelRatio;

    const styles = getComputedStyle(document.documentElement);
    const primaryHex = styles.getPropertyValue("--primary").trim() || "#cc785c";
    const mutedHex = styles.getPropertyValue("--muted").trim() || "#7b68ee";
    const inkHex = styles.getPropertyValue("--foreground").trim() || "#f6f0f2";
    const successHex = styles.getPropertyValue("--success").trim() || "#5db872";

    const laneCount = Math.max(2, players.length);
    const laneHeight = scaleHeight / laneCount;

    // Render static grid lines
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, scaleWidth, scaleHeight);

    for (let i = 0; i < laneCount; i++) {
      const laneY = i * laneHeight;
      if (i > 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(scaleWidth, laneY);
        ctx.stroke();
      }
    }

    const trackPaddingStart = 60;
    const trackPaddingEnd = 100;
    const startX = trackPaddingStart;
    const finishX = scaleWidth - trackPaddingEnd;

    // Checkered banner
    ctx.strokeStyle = successHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(finishX, 0);
    ctx.lineTo(finishX, scaleHeight);
    ctx.stroke();

    // Draw Cars at their computed states
    players.forEach((player, idx) => {
      const laneY = idx * laneHeight + laneHeight / 2;
      const state = currentStates.get(player.id) || { progress: 0, wpm: 0, acc: 100, status: "racing" };

      const x = startX + state.progress * (finishX - startX);

      // Color scheme
      let color = primaryHex;
      if (player.carType === "f1") color = "#5db8a6";
      else if (player.carType === "muscle") color = "#e8a55a";
      else if (player.carType === "hyper") color = "#58a6ff";
      else if (player.carType === "phantom") color = "#b34cff";

      // Draw car body
      ctx.fillStyle = color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.roundRect(x - 14, laneY - 5, 20, 10, [2, 4, 4, 2]);
      ctx.fill();

      // Cabin Glass
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.roundRect(x - 7, laneY - 3, 8, 6, 1);
      ctx.fill();

      // Tag
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${player.name} (${Math.round(state.wpm)} WPM)`, x - 4, laneY - 10);
    });
  }, [players, currentStates]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value));
  };

  const resetReplay = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fadeIn">
      <div className="bg-card border border-border-hairline rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-background border border-border-hairline text-muted hover:text-foreground cursor-pointer transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 flex flex-col gap-6">
          {/* Header */}
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary font-mono block">
              Telemetry Replay Suite
            </span>
            <h2 className="text-xl font-bold font-serif mt-1">Typing Speed & Cadence Scrub</h2>
          </div>

          {/* Replay track view */}
          <div className="border border-border-hairline rounded-xl overflow-hidden bg-background">
            <canvas ref={canvasRef} className="w-full h-40 block" />
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col gap-4">
            
            {/* Timeline Scrubbing Line */}
            <div className="relative flex items-center w-full">
              <input
                type="range"
                min={0}
                max={maxTime}
                value={currentTime}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-background border border-border-hairline rounded-lg appearance-none cursor-pointer accent-primary"
              />

              {/* Milestones markers on Timeline */}
              {timelineMilestones.map((m, idx) => {
                const markerPos = (m.t / maxTime) * 100;
                const isMistake = m.type === "mistake";
                return (
                  <div
                    key={idx}
                    className="absolute w-2 h-2 rounded-full -translate-x-1/2 pointer-events-none"
                    style={{
                      left: `${markerPos}%`,
                      backgroundColor: isMistake ? "#FF445C" : "#cc785c",
                      boxShadow: `0 0 4px ${isMistake ? "#FF445C" : "#cc785c"}`
                    }}
                    title={isMistake ? "Mistake skid" : "Nitro Charge"}
                  />
                );
              })}
            </div>

            {/* Sub-HUD Metrics */}
            <div className="flex items-center justify-between text-xs text-muted-soft font-mono">
              <span>Time: {(currentTime / 1000).toFixed(2)}s / {(maxTime / 1000).toFixed(2)}s</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Mistakes</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Nitro Boosts</span>
              </div>
            </div>

            {/* Playhead buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-hairline">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-hover shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={resetReplay}
                  className="p-3 rounded-xl border border-border-hairline text-muted hover:text-foreground cursor-pointer transition-all"
                  title="Restart Replay"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Multipliers */}
              <div className="flex bg-background border border-border-hairline rounded-xl p-0.5">
                {[0.5, 1, 2, 4].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setSpeed(sp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      speed === sp
                        ? "bg-primary text-on-primary"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Player stats list at currentTime */}
          <div className="border border-border-hairline rounded-xl p-4 bg-background">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-soft mb-3 text-left">
              Driver Telemetry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((p) => {
                const state = currentStates.get(p.id) || { progress: 0, wpm: 0, acc: 100, status: "racing" };
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-card border border-border-hairline rounded-xl p-3 text-xs"
                  >
                    <span className="font-bold truncate">{p.name}</span>
                    <div className="flex gap-4 font-mono text-[10px] text-muted-soft">
                      <span>WPM: {Math.round(state.wpm)}</span>
                      <span>Acc: {state.acc}%</span>
                      <span>Prog: {Math.round(state.progress * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
