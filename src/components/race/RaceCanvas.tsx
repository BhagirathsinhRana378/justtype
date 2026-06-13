"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Player } from "@/store/useRaceStore";

const TRACK_LEN = 3000;
const PLAYER_ANCHOR = 0.35;
const LANE_H = 80;

interface RaceCanvasProps {
  players: Player[];
  myPlayerId: string;
  isRacing: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export default function RaceCanvas({ players, myPlayerId, isRacing }: RaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });

  const playersRef = useRef(players);
  const myPlayerIdRef = useRef(myPlayerId);
  const isRacingRef = useRef(isRacing);
  const particlesRef = useRef<Particle[]>([]);

  // Update refs on state change so the render loop can read current data
  useEffect(() => {
    playersRef.current = players;
    myPlayerIdRef.current = myPlayerId;
    isRacingRef.current = isRacing;
  }, [players, myPlayerId, isRacing]);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (r.width === 0 || r.height === 0) return;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    dimsRef.current = { w: r.width, h: r.height, dpr };
    const ctx = c.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // ResizeObserver only registers once on mount
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(c);
    return () => ro.disconnect();
  }, [resize]);

  // Main rendering loop (Runs once on mount, runs at 60fps)
  useEffect(() => {
    let lastT = 0;
    let animId = 0;

    const draw = (ts: number) => {
      const dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0.016;
      lastT = ts;

      const c = canvasRef.current;
      if (!c) {
        animId = requestAnimationFrame(draw);
        return;
      }
      const ctx = c.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(draw);
        return;
      }

      const { w, h } = dimsRef.current;
      if (!w || !h) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Clear the canvas area
      ctx.clearRect(0, 0, w, h);

      // Deep space grid canvas background
      ctx.fillStyle = "rgba(13, 7, 17, 0.4)";
      ctx.fillRect(0, 0, w, h);

      const currentPlayers = playersRef.current;
      const currentMyPlayerId = myPlayerIdRef.current;
      const currentIsRacing = isRacingRef.current;

      const myPlayer = currentPlayers.find(p => p.id === currentMyPlayerId);
      const myProgress = myPlayer?.progress || 0;
      const camX = PLAYER_ANCHOR * w;
      const scrollX = myProgress * TRACK_LEN;
      const laneCount = Math.max(1, currentPlayers.length);
      const totalH = laneCount * LANE_H;
      const startY = (h - totalH) / 2;

      // Draw horizontal scrolling cyberpunk grids
      const gridSize = 40;
      ctx.strokeStyle = "rgba(204, 120, 92, 0.018)";
      ctx.lineWidth = 1;
      const gridOffsetX = -(scrollX % gridSize);
      for (let x = gridOffsetX; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw lane areas
      for (let i = 0; i < laneCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, startY + i * LANE_H, w, LANE_H);
      }

      // Draw lane dividers and speed indicator lines
      for (let i = 0; i <= laneCount; i++) {
        const ly = startY + i * LANE_H;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
        
        // Glowing orange dashed line overlay (scrolls backwards)
        ctx.strokeStyle = "rgba(204, 120, 92, 0.12)";
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([12, 28]);
        ctx.moveTo(-(scrollX % 40), ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Finish Line
      const fx = TRACK_LEN - scrollX + camX;
      if (fx > -50 && fx < w + 50) {
        // Neon green glow behind finish line
        ctx.fillStyle = "rgba(93, 184, 114, 0.07)";
        ctx.fillRect(fx - 15, startY, 30, totalH);

        // High-tech checkered poles
        const colW = 6;
        const rowH = 8;
        for (let y = startY; y < startY + totalH; y += rowH * 2) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillRect(fx - colW, y, colW, rowH);
          ctx.fillStyle = "rgba(13, 7, 17, 0.85)";
          ctx.fillRect(fx - colW, y + rowH, colW, rowH);

          ctx.fillStyle = "rgba(13, 7, 17, 0.85)";
          ctx.fillRect(fx, y, colW, rowH);
          ctx.fillStyle = "#5db872";
          ctx.fillRect(fx, y + rowH, colW, rowH);
        }

        // Green boundary lines with glow
        ctx.strokeStyle = "#5db872";
        ctx.lineWidth = 2;
        ctx.save();
        ctx.shadowColor = "#5db872";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(fx - colW, startY);
        ctx.lineTo(fx - colW, startY + totalH);
        ctx.moveTo(fx + colW, startY);
        ctx.lineTo(fx + colW, startY + totalH);
        ctx.stroke();
        ctx.restore();
      }

      // Generate particles
      currentPlayers.forEach((p, idx) => {
        const laneY = startY + idx * LANE_H + LANE_H / 2;
        const px = p.progress * TRACK_LEN - scrollX + camX;
        const isMe = p.id === currentMyPlayerId;
        const isCompleted = p.status === "completed";

        // Exhaust smoke for active racing cars
        if (p.status === "racing" && currentIsRacing && p.wpm > 5) {
          const trailColor = isMe ? "#cc785c" : "#58a6ff";
          particlesRef.current.push({
            x: px - 16,
            y: laneY + (Math.random() * 4 - 2),
            vx: -80 - Math.random() * 60,
            vy: Math.random() * 12 - 6,
            alpha: 1.0,
            size: 2.2 + Math.random() * 1.8,
            color: trailColor
          });
        }

        // Celebrate finished players with sparkles
        if (isCompleted && Math.random() < 0.22) {
          particlesRef.current.push({
            x: px,
            y: laneY + (Math.random() * 12 - 6),
            vx: (Math.random() * 50 - 25),
            vy: (Math.random() * 50 - 25),
            alpha: 1.0,
            size: 1.5 + Math.random() * 2,
            color: "#5db872"
          });
        }
      });

      // Update and Draw active particles
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha -= dt * 2.2; // particles fade in ~0.45s

        if (pt.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      particlesRef.current = particlesRef.current.filter(pt => pt.alpha > 0);

      // Draw Cars
      currentPlayers.forEach((p, idx) => {
        const laneY = startY + idx * LANE_H + LANE_H / 2;
        const px = p.progress * TRACK_LEN - scrollX + camX;
        const isMe = p.id === currentMyPlayerId;
        const isCompleted = p.status === "completed";

        // Offscreen indicator left
        if (px < -60 && p.status === "racing") {
          ctx.fillStyle = isMe ? "#cc785c" : "rgba(255,255,255,0.3)";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`◀ ${p.name}`, 8, laneY + 3);
          return;
        }
        // Offscreen indicator right
        if (px > w + 60 && p.status === "racing") {
          ctx.fillStyle = "rgba(88, 166, 255, 0.75)";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`${p.name} ▶`, w - 8, laneY + 3);
          return;
        }

        const color = isMe ? "#cc785c" : (isCompleted ? "#5db872" : "#58a6ff");

        ctx.save();
        ctx.translate(px, laneY);

        // Neon underglow
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.fillRect(-10, -4, 20, 8);
        ctx.shadowBlur = 0; // reset shadow

        // Sleek aerodynamic aerodynamic chassis
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(10, -6);
        ctx.lineTo(15, -3);
        ctx.lineTo(15, 3);
        ctx.lineTo(10, 6);
        ctx.lineTo(-14, 6);
        ctx.closePath();
        ctx.fill();

        // Futuristic Spoiler Wing
        ctx.fillStyle = isMe ? "#e8a55a" : (isCompleted ? "#a2e0b1" : "#8bc3ff"); // contrasting wing
        ctx.fillRect(-17, -8, 3, 16); // Wing blade
        ctx.fillStyle = "rgba(18, 18, 22, 0.8)";
        ctx.fillRect(-15, -6, 2, 12); // mounts

        // Neon headlights
        ctx.fillStyle = "rgba(255, 248, 180, 0.85)";
        ctx.fillRect(13, -4, 2, 1.5);
        ctx.fillRect(13, 2.5, 2, 1.5);

        // Neon tail lights
        ctx.fillStyle = "rgba(255, 40, 40, 0.95)";
        ctx.fillRect(-15, -5, 1, 1.5);
        ctx.fillRect(-15, 3.5, 1, 1.5);

        // Windshield / cockpit glass
        ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
        ctx.beginPath();
        ctx.moveTo(-3, -3);
        ctx.lineTo(6, -2);
        ctx.lineTo(6, 2);
        ctx.lineTo(-3, 3);
        ctx.closePath();
        ctx.fill();

        // Wheels with rims
        ctx.fillStyle = "#121214";
        const wheelCoords = [
          { x: -9, y: -7.5 },
          { x: -9, y: 5 },
          { x: 5, y: -7.5 },
          { x: 5, y: 5 }
        ];
        wheelCoords.forEach(wh => {
          ctx.fillRect(wh.x, wh.y, 4, 2.5);
          // Neon hubcap dot
          ctx.fillStyle = color;
          ctx.fillRect(wh.x + 1.5, wh.y + 0.75, 1, 1);
          ctx.fillStyle = "#121214";
        });

        ctx.restore();

        // Glassmorphism name badge
        const labelText = `${p.name} (${Math.round(p.wpm)} WPM)`;
        ctx.font = isMe ? "bold 10px sans-serif" : "9px sans-serif";
        const tw = ctx.measureText(labelText).width;

        // Badge background
        ctx.fillStyle = "rgba(13, 7, 17, 0.7)";
        ctx.strokeStyle = isMe ? "rgba(204, 120, 92, 0.45)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - tw/2 - 6, laneY - 26, tw + 12, 15, 4);
        ctx.fill();
        ctx.stroke();

        // Badge text
        ctx.fillStyle = isMe ? "#ffffff" : "rgba(255, 255, 255, 0.65)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, px, laneY - 18.5);

        if (isCompleted) {
          ctx.fillStyle = "#5db872";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("✓ FINISHED", px, laneY + 20);
        }
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      lastT = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block rounded-xl"
      style={{ background: "var(--card, #151018)", minHeight: "260px", maxHeight: "400px" }}
    />
  );
}
