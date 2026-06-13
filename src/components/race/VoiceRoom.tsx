"use client";

import { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Mic, MicOff, Shield, Radio, Check, Loader2 } from "lucide-react";

interface VoiceRoomProps {
  roomId: string;
  myPlayerName: string;
}

interface PeerAudioState {
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  activeLevel: number;
}

export default function VoiceRoom({ roomId, myPlayerName }: VoiceRoomProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  // Microphone level analyzer state
  const [myVolumeLevel, setMyVolumeLevel] = useState(0);
  
  // Simulated Peers
  const [peers, setPeers] = useState<PeerAudioState[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize simulated peers
  useEffect(() => {
    setPeers([
      { name: "Keystroke Kestrel", isMuted: false, isSpeaking: false, activeLevel: 0 },
      { name: "F1 Prototype", isMuted: true, isSpeaking: false, activeLevel: 0 }
    ]);

    // Periodically fluctuate peer speaking states for realism
    const interval = setInterval(() => {
      setPeers(prev =>
        prev.map(p => {
          if (p.isMuted) return p;
          const isSpeaking = Math.random() < 0.25;
          return {
            ...p,
            isSpeaking,
            activeLevel: isSpeaking ? Math.floor(Math.random() * 8) + 2 : 0
          };
        })
      );
    }, 1200);

    return () => {
      clearInterval(interval);
      cleanupMicrophone();
    };
  }, []);

  // Set up microphone capture for local audio visualization
  const setupMicrophone = async () => {
    try {
      setConnectionState("connecting");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      setConnectionState("connected");
      setIsMuted(false);

      // Start visualization loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Compute average frequency strength
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / bufferLength;
        
        // Scale to 0-10 level range
        const scaled = Math.min(10, Math.round(average / 15));
        setMyVolumeLevel(scaled);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("Microphone access denied: ", err);
      // Fallback to connection success without active microphone input
      setConnectionState("connected");
      setIsMuted(true);
    }
  };

  const cleanupMicrophone = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMyVolumeLevel(0);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (connectionState === "disconnected") {
      setupMicrophone();
    } else {
      if (isMuted) {
        setIsMuted(false);
        // Resume streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => (t.enabled = true));
        }
      } else {
        setIsMuted(true);
        setMyVolumeLevel(0);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => (t.enabled = false));
        }
      }
    }
  };

  const disconnectVoice = () => {
    cleanupMicrophone();
    setConnectionState("disconnected");
    setIsMuted(true);
  };

  return (
    <div className="w-full bg-card border border-border-hairline rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-md animate-fadeIn select-none">
      
      {/* Left Details */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            connectionState === "connected"
              ? "bg-success/10 border-success text-success animate-pulse"
              : "bg-background border-border-hairline text-muted"
          }`}>
            <Radio className="w-4.5 h-4.5" />
          </div>
          {connectionState === "connected" && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
          )}
        </div>
        
        <div>
          <span className="text-xs font-bold block">
            Grid Spatial Voice
          </span>
          <span className="text-[10px] text-muted-soft capitalize">
            Room Code: {roomId} • {connectionState === "connected" ? "RTC Connected" : "P2P Disconnected"}
          </span>
        </div>
      </div>

      {/* Center Voice Visualizer Waves */}
      <div className="flex items-center gap-4 py-2 px-4 bg-background border border-border-hairline/60 rounded-xl flex-grow max-w-sm justify-center">
        {connectionState === "disconnected" && (
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Audio Chat Idle
          </span>
        )}
        {connectionState === "connecting" && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Establishing WebRTC Handshake...
          </div>
        )}
        {connectionState === "connected" && (
          <div className="flex items-center gap-3.5 w-full justify-between">
            {/* My Mic Level indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase text-muted-soft">You:</span>
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4, 5].map((i) => {
                  const active = !isMuted && myVolumeLevel >= i * 2;
                  return (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full transition-all duration-75 ${
                        active ? "bg-primary" : "bg-border-hairline"
                      }`}
                      style={{
                        height: active ? `${30 + i * 14}%` : "15%"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Peer indicators */}
            <div className="flex items-center gap-4">
              {peers.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-[9px] font-semibold text-muted-soft">
                  <span className="max-w-16 truncate">{p.name}</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    {[1, 2, 3].map((i) => {
                      const active = !p.isMuted && p.isSpeaking && p.activeLevel >= i * 3;
                      return (
                        <div
                          key={i}
                          className={`w-0.5 rounded-full ${
                            active ? "bg-success" : "bg-border-hairline"
                          }`}
                          style={{
                            height: active ? `${30 + i * 20}%` : "20%"
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {connectionState === "disconnected" ? (
          <button
            onClick={setupMicrophone}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all cursor-pointer flex items-center gap-1"
          >
            <Mic className="w-3.5 h-3.5" /> Connect Voice
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? "bg-error/15 border-error/30 text-error hover:bg-error/20"
                  : "bg-background border-border-hairline text-muted hover:text-foreground"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={disconnectVoice}
              className="px-3 py-2 border border-border-hairline text-[10px] uppercase font-bold text-muted hover:text-foreground rounded-xl hover:border-error hover:text-error transition-all cursor-pointer"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
