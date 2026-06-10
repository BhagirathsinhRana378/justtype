"use client";

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playKeySound(type: "mechanical" | "click" | "bubble" | "silent") {
  if (type === "silent") return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const time = ctx.currentTime;
  
  try {
    if (type === "click") {
      // Sharp fast click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.02);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      
      osc.start(time);
      osc.stop(time + 0.02);
    } else if (type === "mechanical") {
      // Deeper keyboard switch clack
      const osc = ctx.createOscillator();
      const bandpass = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.linearRampToValueAtTime(50, time + 0.05);
      
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(350, time);
      bandpass.Q.setValueAtTime(4, time);
      
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      osc.start(time);
      osc.stop(time + 0.05);
    } else if (type === "bubble") {
      // Water droplet / bubble sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(250, time);
      osc.frequency.exponentialRampToValueAtTime(650, time + 0.08);
      
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      osc.start(time);
      osc.stop(time + 0.08);
    }
  } catch (e) {
    // Silence audio errors (e.g. state issues)
    console.error("Audio trigger failed", e);
  }
}
