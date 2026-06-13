"use client";

import { useEffect, useRef } from "react";
import { sound } from "@/utils/audio";

interface PlayerData {
  id: string;
  name: string;
  index: number;
  progress: number;
  wpm: number;
  accuracy: number;
  streak: number;
  nitroActive: boolean;
  inSlipstream: boolean;
  status: "waiting" | "ready" | "racing" | "completed" | "eliminated";
  shield: number;
  carType: string;
  isBoss?: boolean;
  team?: "red" | "blue";
}

interface RaceTrackCanvasProps {
  players: PlayerData[];
  myPlayerId: string;
}

export default function RaceTrackCanvas({ players, myPlayerId }: RaceTrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // High-frequency physics values kept in refs to bypass React render loops
  // id -> { visualProgress, velocity, crashTimer, spinAngle, shakeOffset }
  const physicsMap = useRef<Map<string, { 
    progress: number; 
    velocity: number; 
    crashTimer: number; 
    spinAngle: number;
    shakeOffset: number;
  }>>(new Map());

  // Streak tracking to detect mistakes
  const prevStreaksRef = useRef<Map<string, number>>(new Map());

  // Finish trigger state to launch confetti once
  const finishedRef = useRef<Map<string, boolean>>(new Map());

  // Particles: exhaust, nitro fire, speed lines, sparks, confetti
  const particlesRef = useRef<any[]>([]);
  const confettiRef = useRef<any[]>([]);

  // Track-locked skid marks (scrolls with track)
  const skidsRef = useRef<any[]>([]);

  // Checkpoint tracking
  const checkpointsRef = useRef({ p25: false, p50: false, p75: false });

  // Floating notification banners on canvas
  const bannerRef = useRef<{ text: string; timer: number } | null>(null);

  const lastFrameTimeRef = useRef(0);
  const cameraZoomRef = useRef(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width;
    let height = canvas.height;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      width = canvas.width;
      height = canvas.height;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize/Update physics map for players
    players.forEach(p => {
      if (!physicsMap.current.has(p.id)) {
        physicsMap.current.set(p.id, {
          progress: p.progress,
          velocity: 0,
          crashTimer: 0,
          spinAngle: 0,
          shakeOffset: 0
        });
      }
    });

    const render = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const dt = Math.min(0.1, (timestamp - lastFrameTimeRef.current) / 1000); // clamp dt to avoid giant leaps
      lastFrameTimeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      const styles = getComputedStyle(document.documentElement);
      const bgHex = styles.getPropertyValue("--card").trim() || "#151018";
      const primaryHex = styles.getPropertyValue("--primary").trim() || "#cc785c";
      const mutedHex = styles.getPropertyValue("--muted").trim() || "#7b68ee";
      const inkHex = styles.getPropertyValue("--foreground").trim() || "#f6f0f2";
      const successHex = styles.getPropertyValue("--success").trim() || "#5db872";
      const errorHex = styles.getPropertyValue("--error").trim() || "#FF445C";

      const scaleWidth = width / window.devicePixelRatio;
      const scaleHeight = height / window.devicePixelRatio;

      // Draw horizontal track lanes
      const laneCount = Math.max(2, players.length);
      const laneHeight = scaleHeight / laneCount;

      // Track parameters
      const trackLength = 2200; // Visual length of track in pixels
      const cameraFixedX = scaleWidth * 0.25; // Lock player's car at 25% of screen width

      // Update Physics & Streaks for all players
      players.forEach(player => {
        const prevStreak = prevStreaksRef.current.get(player.id) ?? 0;
        prevStreaksRef.current.set(player.id, player.streak);

        let phys = physicsMap.current.get(player.id);
        if (!phys) {
          physicsMap.current.set(player.id, {
            progress: player.progress,
            velocity: 0,
            crashTimer: 0,
            spinAngle: 0,
            shakeOffset: 0
          });
          phys = physicsMap.current.get(player.id)!;
        }

        // Mistake / Crash Detection: Streak dropped from a positive number to 0
        if (prevStreak > 0 && player.streak === 0 && player.status === "racing") {
          phys.crashTimer = 0.7; // 700ms spinout
          phys.shakeOffset = 7;
          if (player.id === myPlayerId) {
            sound.playError();
          }
        }

        // Target velocity based on gameplay telemetry (WPM, Accuracy, Boosts)
        const speedBoost = player.nitroActive ? 1.6 : player.inSlipstream ? 1.18 : 1.0;
        const targetVelocity = (player.wpm / 60) * (player.accuracy / 100) * speedBoost;

        // Accelerate or Brake
        if (phys.crashTimer > 0) {
          phys.velocity += (0 - phys.velocity) * 0.22; // deceleration drag
          phys.crashTimer -= dt;
          phys.shakeOffset = Math.max(0, phys.shakeOffset - dt * 10);
          phys.spinAngle += dt * 12; // Spin effect
        } else {
          phys.spinAngle = 0;
          phys.shakeOffset = 0;
          
          // Smooth acceleration and drag integration
          const accelRate = player.nitroActive ? 0.12 : 0.07;
          phys.velocity += (targetVelocity - phys.velocity) * accelRate;
        }

        // Visual position integration and synchronization with server authority
        phys.progress += phys.velocity * dt * 0.04;
        phys.progress = phys.progress * 0.88 + player.progress * 0.12; // lerp reconciliation
      });

      const myPhys = physicsMap.current.get(myPlayerId);
      const myData = players.find(p => p.id === myPlayerId);
      
      const myProgress = myPhys ? myPhys.progress : 0;
      const myWpm = myData ? myData.wpm : 0;
      const isRacing = myData ? myData.status === "racing" : false;

      const trackScrollX = myProgress * trackLength;

      // --- DYNAMIC CAMERA ZOOM & SHAKE ---
      if (myPhys) {
        // Zoom out at high speed or during nitro to increase speed sensation
        const targetZoom = myData?.nitroActive ? 0.90 : myPhys.velocity > 1.3 ? 0.94 : 1.0;
        cameraZoomRef.current += (targetZoom - cameraZoomRef.current) * 0.04;
      }

      ctx.save();
      
      // Apply Camera Zoom centered around player
      const camCenterX = cameraFixedX;
      const camCenterY = scaleHeight / 2;
      ctx.translate(camCenterX, camCenterY);
      ctx.scale(cameraZoomRef.current, cameraZoomRef.current);
      ctx.translate(-camCenterX, -camCenterY);

      // Apply Global screen shake when player crashes or goes nitro
      if (myPhys && myPhys.shakeOffset > 0) {
        const shakeX = (Math.random() - 0.5) * myPhys.shakeOffset;
        const shakeY = (Math.random() - 0.5) * myPhys.shakeOffset;
        ctx.translate(shakeX, shakeY);
      }

      // Draw background horizontal lines / grid
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, scaleWidth, scaleHeight);

      // Road texture lanes
      for (let i = 0; i < laneCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.12)";
        ctx.fillRect(0, i * laneHeight, scaleWidth, laneHeight);
      }

      // Scrolling Grid Lines (gives continuous speed sensation)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const gridSpacing = 60;
      const gridOffset = trackScrollX % gridSpacing;
      for (let x = -gridOffset; x < scaleWidth + gridSpacing; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, scaleHeight);
        ctx.stroke();
      }

      // Lane Separators (moving with trackScrollX for scrolling sensation)
      for (let i = 0; i <= laneCount; i++) {
        const laneY = i * laneHeight;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1.5;
        
        ctx.save();
        ctx.beginPath();
        // Moving dashed lanes
        const dashOffset = trackScrollX % 24;
        ctx.setLineDash([12, 12]);
        ctx.moveTo(-dashOffset, laneY);
        ctx.lineTo(scaleWidth, laneY);
        ctx.stroke();
        ctx.restore();
      }

      // Checkpoints (25%, 50%, 75%)
      const checkpoints = [0.25, 0.5, 0.75];
      checkpoints.forEach(cp => {
        const cpX = cp * trackLength - trackScrollX + cameraFixedX;
        
        // Render checkpoint gate if visible
        if (cpX > -50 && cpX < scaleWidth + 50) {
          // Neon checkpoint structure
          const gradient = ctx.createLinearGradient(cpX, 0, cpX, scaleHeight);
          gradient.addColorStop(0, "rgba(0, 217, 255, 0.8)");
          gradient.addColorStop(0.5, "rgba(0, 217, 255, 0.2)");
          gradient.addColorStop(1, "rgba(0, 217, 255, 0.8)");
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cpX, 0);
          ctx.lineTo(cpX, scaleHeight);
          ctx.stroke();

          // Gate Header Panel
          ctx.fillStyle = "rgba(0, 217, 255, 0.25)";
          ctx.fillRect(cpX - 30, 8, 60, 16);
          ctx.strokeStyle = "#00d9ff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cpX - 30, 8, 60, 16);
          
          ctx.fillStyle = "#00d9ff";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`CHK ${cp * 100}%`, cpX, 19);
        }

        // Local checkpoint pass triggers audio & banner
        if (myData && myProgress >= cp && !checkpointsRef.current[`p${cp * 100}` as keyof typeof checkpointsRef.current]) {
          (checkpointsRef.current as any)[`p${cp * 100}`] = true;
          sound.playOvertake();
          bannerRef.current = { text: `CHECKPOINT PASSED ${cp * 100}%! 🏁`, timer: 1.5 };
        }
      });

      // Finish Checkered Gate
      const finishLineX = trackLength - trackScrollX + cameraFixedX;
      if (finishLineX < scaleWidth + 200) {
        // Sci-Fi Finish Arch
        const gradient = ctx.createLinearGradient(finishLineX, 0, finishLineX, scaleHeight);
        gradient.addColorStop(0, successHex);
        gradient.addColorStop(0.5, "rgba(93, 184, 114, 0.2)");
        gradient.addColorStop(1, successHex);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(finishLineX, 0);
        ctx.lineTo(finishLineX, scaleHeight);
        ctx.stroke();

        // Banner Checkerboard pattern next to gate
        const boxSize = 8;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        for (let y = 0; y < scaleHeight; y += boxSize * 2) {
          ctx.fillRect(finishLineX, y, boxSize, boxSize);
          ctx.fillRect(finishLineX + boxSize, y + boxSize, boxSize, boxSize);
        }
      }

      // Draw Scrolling Skid Marks
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      skidsRef.current.forEach(s => {
        const skidX = s.trackPos - trackScrollX + cameraFixedX;
        if (skidX > -20 && skidX < scaleWidth + 20) {
          const skidY = s.lane * laneHeight + laneHeight / 2 + 5;
          ctx.fillRect(skidX, skidY, 14, 1.2);
          ctx.fillRect(skidX, skidY - 10, 14, 1.2);
        }
      });

      // Update and Draw Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay || 0.04;
        p.size = Math.max(0.1, p.size - 0.1);

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.alpha > 0 && p.size > 0.1;
      });

      // Update and Draw Confetti (Finish line explosions)
      confettiRef.current = confettiRef.current.filter(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.08; // gravity
        c.alpha -= c.decay || 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, c.alpha);
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
        ctx.restore();

        return c.alpha > 0;
      });

      // Speed lines warp effect at high speeds
      if (isRacing && myWpm > 70) {
        const lineCount = Math.round(myWpm / 18);
        for (let j = 0; j < lineCount; j++) {
          if (Math.random() < 0.15) {
            particlesRef.current.push({
              x: scaleWidth + 10,
              y: Math.random() * scaleHeight,
              size: Math.random() * 1.6 + 0.6,
              color: myData?.nitroActive ? "rgba(0, 217, 255, 0.25)" : "rgba(255, 255, 255, 0.12)",
              alpha: 0.8,
              vx: -10 - Math.random() * 8,
              vy: 0,
              decay: 0.018
            });
          }
        }
      }

      // Draw Players & Simulated Vehicles
      players.forEach((player, idx) => {
        const laneIdx = idx;
        const laneY = laneIdx * laneHeight + laneHeight / 2;

        const phys = physicsMap.current.get(player.id);
        if (!phys) return;

        // Position on screen relative to local player scroll position
        const currentX = phys.progress * trackLength - trackScrollX + cameraFixedX;
        const isMe = player.id === myPlayerId;

        // Trigger Finish Confetti Burst
        if (player.status === "completed" && !finishedRef.current.get(player.id)) {
          finishedRef.current.set(player.id, true);
          
          const burstX = isMe ? cameraFixedX : currentX;
          for (let c = 0; c < 45; c++) {
            confettiRef.current.push({
              x: burstX,
              y: laneY,
              vx: (Math.random() - 0.5) * 7 - 3,
              vy: (Math.random() - 0.5) * 5 - 2,
              size: Math.random() * 3.5 + 2,
              color: `hsl(${Math.random() * 360}, 90%, 60%)`,
              alpha: 1.0,
              decay: Math.random() * 0.02 + 0.01
            });
          }
        }

        // Exhaust smoke particles
        if (player.status === "racing" && Math.random() < 0.38) {
          particlesRef.current.push({
            x: currentX - 16,
            y: laneY + (Math.random() * 4 - 2),
            size: Math.random() * 3.5 + 2.2,
            color: player.isBoss ? "rgba(255, 20, 60, 0.35)" : "rgba(255, 255, 255, 0.14)",
            alpha: 0.5,
            vx: -2.0 - Math.random() * 2.0,
            vy: Math.random() * 0.4 - 0.2,
            decay: 0.028
          });
        }

        // Nitro Flame Trails
        if (player.nitroActive && player.status === "racing") {
          for (let k = 0; k < 5; k++) {
            particlesRef.current.push({
              x: currentX - 22,
              y: laneY + (Math.random() * 6 - 3),
              size: Math.random() * 5.0 + 3.0,
              color: isMe ? primaryHex : "#00d9ff",
              alpha: 1.0,
              vx: -6 - Math.random() * 3,
              vy: Math.random() * 1.2 - 0.6,
              decay: 0.06
            });
          }
        }

        // Skid Marks during crash spinout
        if (player.status === "racing" && phys.crashTimer > 0 && Math.random() < 0.4) {
          skidsRef.current.push({
            trackPos: phys.progress * trackLength,
            lane: laneIdx
          });
          if (skidsRef.current.length > 200) skidsRef.current.shift();
        }

        // Slipstream trail
        if (player.inSlipstream && player.status === "racing") {
          ctx.strokeStyle = isMe ? "rgba(204, 120, 92, 0.35)" : "rgba(93, 184, 166, 0.35)";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          const timeOffset = Date.now() * 0.03;
          ctx.moveTo(currentX - 45, laneY - 6 + Math.sin(timeOffset) * 2.5);
          ctx.bezierCurveTo(
            currentX - 22, laneY - 12,
            currentX - 10, laneY + 12,
            currentX + 12, laneY
          );
          ctx.stroke();
        }

        // Render Marker if offscreen
        const isOffscreenLeft = currentX < -30;
        const isOffscreenRight = currentX > scaleWidth + 30;

        if (isOffscreenLeft && player.status === "racing") {
          ctx.fillStyle = isMe ? primaryHex : "rgba(255, 255, 255, 0.4)";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`◀ ${player.name} (${Math.round((myProgress - phys.progress) * 100)}m)`, 10, laneY + 3);
        } else if (isOffscreenRight && player.status === "racing") {
          ctx.fillStyle = "rgba(0, 217, 255, 0.8)";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`(${Math.round((phys.progress - myProgress) * 100)}m) ${player.name} ▶`, scaleWidth - 10, laneY + 3);
        } else {
          // Draw Vehicle inside world coordinates
          ctx.save();
          
          let color = primaryHex;
          if (player.isBoss) {
            color = "#ff0055";
          } else if (!isMe) {
            if (player.carType === "f1") color = "#5db8a6";
            else if (player.carType === "muscle") color = "#e8a55a";
            else if (player.carType === "hyper") color = "#58a6ff";
            else if (player.carType === "phantom") color = "#b34cff";
            else color = mutedHex;
          }

          let drawX = currentX;
          let drawY = laneY;

          // Apply local shake offset
          if (phys.shakeOffset > 0) {
            drawX += Math.random() * phys.shakeOffset - phys.shakeOffset / 2;
            drawY += Math.random() * phys.shakeOffset - phys.shakeOffset / 2;
          }

          ctx.translate(drawX, drawY);
          if (phys.spinAngle > 0) {
            ctx.rotate(phys.spinAngle);
          }

          // Draw the car model
          if (player.status === "eliminated") {
            ctx.fillStyle = "rgba(65,65,65,0.7)";
            ctx.strokeStyle = "rgba(100,100,100,0.6)";
            ctx.fillRect(-12, -5, 24, 10);
            ctx.strokeRect(-12, -5, 24, 10);
            ctx.fillStyle = errorHex;
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("DNF", 0, 3);
          } else {
            ctx.fillStyle = color;
            ctx.shadowBlur = player.nitroActive ? 14 : 2;
            ctx.shadowColor = color;

            if (player.isBoss) {
              // Boss Spaceship Saucer
              ctx.beginPath();
              ctx.ellipse(0, 0, 15, 6.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.beginPath();
              ctx.arc(0, -2.5, 3.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (player.carType === "f1") {
              // Formula One Racer
              ctx.fillRect(-12, -3.5, 21, 7);
              ctx.fillStyle = "#121212";
              ctx.fillRect(-10, -7.5, 4.5, 2.0);
              ctx.fillRect(-10, 5.5, 4.5, 2.0);
              ctx.fillRect(2, -8.5, 5.5, 2.8);
              ctx.fillRect(2, 5.5, 5.5, 2.8);
              
              ctx.fillStyle = color;
              ctx.fillRect(-15, -6.5, 3, 13); // Front wing
              ctx.fillRect(5, -7.5, 3, 15); // Rear spoiler
            } else {
              // Sports Car
              ctx.beginPath();
              ctx.roundRect(-13, -5.5, 25, 11, [2.5, 5.5, 5.5, 2.5]);
              ctx.fill();

              ctx.fillStyle = "#121212";
              ctx.fillRect(-9, -7.5, 4.5, 2.0);
              ctx.fillRect(-9, 5.5, 4.5, 2.0);
              ctx.fillRect(1.5, -7.5, 4.5, 2.0);
              ctx.fillRect(1.5, 5.5, 4.5, 2.0);

              ctx.fillStyle = "rgba(255,255,255,0.48)";
              ctx.beginPath();
              ctx.roundRect(-6.5, -3.2, 8.5, 6.4, 1.8);
              ctx.fill();
            }
          }
          ctx.restore();

          // Player Name HUD above vehicle
          ctx.fillStyle = isMe ? inkHex : "rgba(255, 255, 255, 0.62)";
          ctx.font = isMe ? "bold 9.5px sans-serif" : "8.5px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            `${player.name} (${Math.round(player.wpm)} WPM)`,
            currentX,
            laneY - 14
          );

          // Finish banner indicator
          if (player.status === "completed") {
            ctx.fillStyle = successHex;
            ctx.font = "bold 8.5px sans-serif";
            ctx.fillText("FINISH", currentX, laneY + 17);
          }
        }
      });

      // Draw active milestone banner overlay if present
      if (bannerRef.current) {
        bannerRef.current.timer -= dt;
        if (bannerRef.current.timer <= 0) {
          bannerRef.current = null;
        } else {
          ctx.fillStyle = "rgba(0, 217, 255, 0.18)";
          ctx.fillRect(scaleWidth / 2 - 120, 15, 240, 26);
          ctx.strokeStyle = "rgba(0, 217, 255, 0.4)";
          ctx.strokeRect(scaleWidth / 2 - 120, 15, 240, 26);
          
          ctx.fillStyle = "#00d9ff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(bannerRef.current.text, scaleWidth / 2, 31);
        }
      }

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [players, myPlayerId]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-60 bg-[#120d15] block rounded-xl overflow-hidden"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
