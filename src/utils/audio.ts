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

export type SoundType = "natural" | "signature" | "typeist" | "silent";

export function playKeySound(type: SoundType, key: string = "default", isCorrect: boolean = true) {
  if (type === "silent") return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const time = ctx.currentTime;
  
  // Natural variation: slightly randomize pitch and gain for a non-robotic feel
  const pitchVar = (Math.random() - 0.5) * 0.04; // +/- 4%
  const gainVar = (Math.random() - 0.5) * 0.015;

  // Handle Mistakes with a subtle, informative texture
  if (!isCorrect) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220 * (1 + pitchVar), time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.02);
    
    gain.gain.setValueAtTime(0.05 + gainVar, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.02);
    return;
  }

  const isSpace = key === " ";

  try {
    if (type === "natural") {
      // Natural: Neutral, soft, realistic (Everyday premium)
      const baseFreq = isSpace ? 800 : 950;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * (1 + pitchVar), time);
      osc.frequency.exponentialRampToValueAtTime((baseFreq * 0.5) * (1 + pitchVar), time + 0.02);
      
      gain.gain.setValueAtTime((isSpace ? 0.04 : 0.06) + gainVar, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.02);
    } 
    else if (type === "signature") {
      // Signature: Deep thock, expensive custom keyboard feel
      const baseFreq = isSpace ? 110 : 135;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(baseFreq * (1 + pitchVar), time);
      osc1.frequency.exponentialRampToValueAtTime((baseFreq * 0.7) * (1 + pitchVar), time + 0.05);
      
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(isSpace ? 350 : 500, time);
      lp.Q.setValueAtTime(4, time);
      
      gain1.gain.setValueAtTime((isSpace ? 0.15 : 0.12) + gainVar, time);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      osc1.connect(lp);
      lp.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(time);
      osc1.stop(time + 0.05);
    } 
    else if (type === "typeist") {
      // Typeist: Real typewriter feel, crisp mechanical strikes
      const baseFreq = isSpace ? 2000 : 2500;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const bp = ctx.createBiquadFilter();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * (1 + pitchVar), time);
      osc.frequency.exponentialRampToValueAtTime((baseFreq * 0.9) * (1 + pitchVar), time + 0.015);
      
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(baseFreq, time);
      bp.Q.setValueAtTime(12, time);
      
      gain.gain.setValueAtTime((isSpace ? 0.03 : 0.045) + gainVar, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      osc.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.015);
    }
  } catch (e) {
    console.error("Audio trigger failed", e);
  }
}
