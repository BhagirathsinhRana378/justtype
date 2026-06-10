"use client";

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export type SoundType = "mechanical" | "click" | "bubble" | "ink" | "wooden" | "metal" | "silent";

export function playKeySound(type: SoundType) {
  if (type === "silent") return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const time = ctx.currentTime;
  
  try {
    if (type === "click") {
      // Sharp, ultra-fast click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, time);
      osc.frequency.exponentialRampToValueAtTime(400, time + 0.015);
      
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      osc.start(time);
      osc.stop(time + 0.015);
    } else if (type === "mechanical") {
      // Balanced mechanical switch - combination of low thump and high click
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(150, time);
      osc1.frequency.linearRampToValueAtTime(40, time + 0.04);
      gain1.gain.setValueAtTime(0.12, time);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1800, time);
      osc2.frequency.exponentialRampToValueAtTime(1000, time + 0.01);
      gain2.gain.setValueAtTime(0.04, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.04);
      osc2.stop(time + 0.01);
    } else if (type === "bubble") {
      // Softer, rounder water droplet
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, time);
      osc.frequency.exponentialRampToValueAtTime(900, time + 0.1);
      
      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === "ink") {
      // Soft brush-like paper friction
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2500, time);
      filter.Q.setValueAtTime(1.5, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.03, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(time);
      whiteNoise.stop(time + 0.03);
    } else if (type === "wooden") {
      // Hollow wood-block knock
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    } else if (type === "metal") {
      // Crisp metallic chime/ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, time);
      osc.frequency.exponentialRampToValueAtTime(2200, time + 0.02);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.08);
    }
  } catch (e) {
    console.error("Audio trigger failed", e);
  }
}
