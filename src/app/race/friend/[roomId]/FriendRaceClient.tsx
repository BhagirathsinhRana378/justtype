"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRaceStore } from "@/store/useRaceStore";
import { useRaceEngine } from "@/hooks/useRaceEngine";
import RaceCanvas from "@/components/race/RaceCanvas";
import Word from "@/components/Word";
import { AlertTriangle, ArrowLeft, Copy, Users, Trophy, RotateCcw, Timer, Activity, Loader2, Target, CheckCircle2 } from "lucide-react";

export default function FriendRaceClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (params.roomId as string).toUpperCase();
  const urlName = searchParams.get("name") || "Player";
  const isHost = searchParams.get("host") === "true";

  const store = useRaceStore();
  const { playerName, roomStatus, players, words, myPlayerId } = store;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [raceElapsed, setRaceElapsed] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [focused, setFocused] = useState(false);
  const lastProgressSentRef = useRef({ time: 0, index: -1 });

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    typedInput, wpm, accuracy, progress, handleInput, reset: resetEngine,
  } = useRaceEngine(words);

  const typedWords = useMemo(() => typedInput.split(" "), [typedInput]);
  const activeWordIndex = useMemo(() => Math.max(0, typedWords.length - 1), [typedWords]);

  const handleWSMessage = useCallback((msg: Record<string, any>) => {
    switch (msg.type) {
      case "room_created":
      case "room_joined":
        store.setMyPlayerId(msg.player.id);
        store.setTextToType(msg.text);
        store.setPlayers(msg.players);
        store.setRoomStatus("waiting");
        store.setIsHost(msg.players[0]?.id === msg.player.id);
        setError(null);
        break;
      case "room_reset":
        store.setTextToType(msg.text);
        store.setPlayers(msg.players);
        store.setRoomStatus("waiting");
        setResults([]);
        resetEngine();
        setError(null);
        break;
      case "player_joined":
      case "player_ready":
      case "player_disconnected":
      case "player_left":
        if (msg.players) store.setPlayers(msg.players);
        if (msg.roomStatus) store.setRoomStatus(msg.roomStatus);
        break;
      case "countdown_start":
        store.setRoomStatus("countdown");
        let t = msg.seconds;
        setCountdown(t);
        const ci = setInterval(() => { t -= 1; if (t <= 0) clearInterval(ci); else setCountdown(t); }, 1000);
        break;
      case "race_start":
        store.setRoomStatus("racing");
        resetEngine();
        setRaceElapsed(0);
        setResults([]);
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
      case "tick":
        if (msg.players) store.setPlayers(msg.players);
        break;
      case "player_finished":
        if (msg.players) store.setPlayers(msg.players);
        break;
      case "game_finished":
        store.setRoomStatus("finished");
        setResults(msg.players);
        break;
      case "error":
        if (msg.message === "Room not found" && !isHost) {
          setError(`Room "${roomId}" not found. Ask the host to create the room first.`);
        } else {
          setError(msg.message);
        }
        setConnecting(false);
        break;
    }
  }, [isHost, roomId, resetEngine, store]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnecting(true);
    setError(null);

    const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const wsUrl = envWsUrl || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:3001`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      const name = useRaceStore.getState().playerName || urlName;
      ws.send(JSON.stringify({
        type: isHost ? "create_room" : "join_room",
        roomId,
        name,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      wsRef.current = null;
      const currentStatus = useRaceStore.getState().roomStatus;
      if (currentStatus !== "finished") {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      setConnecting(false);
    };
  }, [roomId, urlName, isHost, handleWSMessage]);

  useEffect(() => {
    store.setPlayerName(urlName);
    store.setRoomId(roomId);
    connect();
    return () => {
      if (reconnectTimer.current) { window.clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (roomStatus !== "racing") { setRaceElapsed(0); return; }
    const start = Date.now();
    const iv = setInterval(() => setRaceElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [roomStatus]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomStatus !== "racing") return;
    const val = e.target.value;
    const metrics = handleInput(val);
    const idx = val.length;

    const lastProgressSent = lastProgressSentRef.current;
    const now = Date.now();
    const textLength = words.join(" ").length;
    const isFinished = val.length >= textLength;
    const isSpace = val.endsWith(" ");

    if (
      isFinished || 
      isSpace || 
      now - lastProgressSent.time > 150 || 
      lastProgressSent.index === -1
    ) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "progress",
          index: idx,
          accuracy: metrics.accuracy,
          wpm: metrics.wpm,
        }));
        lastProgressSentRef.current = { time: now, index: idx };
      }
    }
  };

  useEffect(() => {
    if (roomStatus !== "racing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.activeElement;
        const editable = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
        if (!editable) inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [roomStatus]);

  const readyUp = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ready" }));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
  };

  const rematch = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "play_again" }));
    }
  };

  const myPlayer = useMemo(() => players.find(p => p.id === myPlayerId), [players, myPlayerId]);

  const sortedResults = useMemo(() => {
    const completed = [...results].filter((p: any) => p.status === "completed");
    const others = [...results].filter((p: any) => p.status !== "completed");
    completed.sort((a: any, b: any) => (a.finishTime || Infinity) - (b.finishTime || Infinity));
    return [...completed, ...others];
  }, [results]);

  const position = useMemo(() => {
    if (!myPlayer) return 0;
    const ahead = players.filter(p =>
      p.id !== myPlayerId &&
      (p.status === "completed" || p.progress > myPlayer.progress)
    ).length;
    return ahead + 1;
  }, [players, myPlayer, myPlayerId]);

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    wordRefs.current = [];
  }, [words]);

  useEffect(() => {
    const activeWordEl = wordRefs.current[activeWordIndex];
    if (activeWordEl) {
      const Y = activeWordEl.offsetTop;
      const H = activeWordEl.offsetHeight;
      if (Y >= H) {
        setTranslateY(H - Y);
      } else {
        setTranslateY(0);
      }
    }
  }, [activeWordIndex]);

  const renderedWords = useMemo(() => {
    return words.map((word, wordIndex) => {
      const isActive = wordIndex === activeWordIndex;
      const isPast = wordIndex < activeWordIndex;

      return (
        <span
          key={wordIndex}
          ref={(el) => {
            wordRefs.current[wordIndex] = el;
          }}
          className="inline-flex"
        >
          <Word
            word={word}
            wordIndex={wordIndex}
            isActive={isActive}
            isPast={isPast}
            typed={typedWords[wordIndex]}
            caretType="smooth"
            isFocused={focused}
          />
        </span>
      );
    });
  }, [words, activeWordIndex, typedWords, focused]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-14 h-14 text-error mb-3" />
        <h1 className="text-xl font-bold mb-1">Error</h1>
        <p className="text-sm text-muted mb-5">{error}</p>
        <button onClick={() => router.push("/race")} className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg cursor-pointer hover:bg-primary-hover">
          Back
        </button>
      </div>
    );
  }

  if (connecting && !connected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h1 className="text-lg font-bold mb-1">Connecting to Room {roomId}</h1>
        <p className="text-sm text-muted">Establishing connection to race server…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0d0711] text-foreground flex flex-col select-none">
      <div className="flex flex-col gap-2 p-3 max-w-5xl mx-auto w-full flex-1">
        <div className="bg-card/40 border border-border-hairline rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/race")} className="p-1 rounded-lg bg-card border border-border-hairline hover:border-primary/50 text-muted hover:text-foreground cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="text-[9px] text-muted-soft uppercase font-bold tracking-wider font-mono">Room {roomId}</div>
              <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" /> {players.length} player{players.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {roomStatus === "racing" && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/50 border border-border-hairline">
                <Timer className="w-3 h-3 text-primary" />
                <span className="font-mono text-xs font-bold">{Math.floor(raceElapsed / 60)}:{(raceElapsed % 60).toString().padStart(2, "0")}</span>
              </div>
            )}
            <span className="text-[8px] text-muted-soft font-mono flex items-center gap-1">
              <Activity className={`w-2 h-2 ${connected ? "text-success" : "text-muted-soft"}`} />
              {connected ? "Live" : "Offline"}
            </span>
            <button onClick={copyCode} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border-hairline text-[10px] font-bold hover:border-primary hover:text-primary cursor-pointer transition-all">
              <Copy className="w-3 h-3" /> {roomId}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border-hairline rounded-xl overflow-hidden shadow-lg flex-1 min-h-[240px] relative backdrop-blur-md">
          {roomStatus === "racing" || roomStatus === "finished" ? (
            <RaceCanvas players={players} myPlayerId={myPlayerId} isRacing={roomStatus === "racing"} />
          ) : (
            <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-card/30">
              <div className="text-center px-4">
                <Users className="w-10 h-10 text-primary/40 mx-auto mb-2" />
                <p className="text-[11px] text-muted-soft">Race track will appear here</p>
              </div>
            </div>
          )}
        </div>

        <div className={`bg-card border rounded-xl relative backdrop-blur-md transition-all duration-300 ${focused ? "border-primary/40 shadow-[0_0_20px_rgba(204,120,92,0.08)] bg-card/75" : "border-border-hairline"}`}>
          {roomStatus === "waiting" && (
            <div className="flex flex-col items-center py-5 px-4 animate-fadeIn">
              <h2 className="text-base font-bold mb-0.5">Waiting for Players</h2>
              <p className="text-[11px] text-muted mb-3 text-center">Minimum 2 players needed. All players must ready up.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={readyUp}
                  className={`px-6 py-2 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    myPlayer?.status === "ready"
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-primary text-on-primary hover:bg-primary-hover"
                  }`}
                >
                  {myPlayer?.status === "ready" ? "✓ Ready!" : "Ready Up"}
                </button>
              </div>
              <div className="w-full max-w-sm">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-2">Players ({players.length})</div>
                <div className="flex flex-col gap-1">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-background border border-border-hairline rounded-lg px-3 py-2 text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === "ready" ? "bg-success" : "bg-muted-soft"}`} />
                        {p.name} {p.id === myPlayerId && <span className="text-[8px] text-primary/60 ml-0.5">(you)</span>}
                      </span>
                      <span className={`text-[9px] font-bold ${p.status === "ready" ? "text-success" : "text-muted"}`}>
                        {p.status === "ready" ? "✓ Ready" : "Waiting"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {roomStatus === "countdown" && (
            <div className="flex flex-col items-center justify-center py-8 animate-pulse">
              <span className="text-[10px] text-muted-soft uppercase font-bold tracking-wider mb-1">Race starting</span>
              <div className="text-6xl font-serif font-black text-primary font-mono tracking-tighter race-countdown-number">{countdown}</div>
            </div>
          )}

          {roomStatus === "racing" && (
            <div className="flex flex-col">
              <div className="grid grid-cols-4 gap-2 p-2.5 bg-[#0d0711]/60 border-b border-border-hairline/30">
                {[
                  { label: "Position", value: `#${position}`, icon: <Trophy className="w-3.5 h-3.5 text-accent-amber" />, c: "text-accent-amber font-extrabold" },
                  { label: "Speed", value: `${wpm} WPM`, icon: <Activity className="w-3.5 h-3.5 text-primary" />, c: "text-primary font-bold" },
                  { label: "Accuracy", value: `${accuracy}%`, icon: <Target className="w-3.5 h-3.5 text-success" />, c: "text-success font-bold" },
                  { label: "Progress", value: `${Math.round(progress * 100)}%`, icon: <CheckCircle2 className="w-3.5 h-3.5 text-muted-soft" />, c: "text-foreground font-bold" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center justify-center py-1.5 px-1 bg-card/25 border border-border-hairline/25 rounded-lg backdrop-blur-xs">
                    <div className="flex items-center gap-1 mb-1">
                      {s.icon}
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-muted-soft">{s.label}</span>
                    </div>
                    <div className={`text-sm sm:text-base font-black font-mono tracking-tight leading-none ${s.c}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div 
                ref={containerRef} 
                onClick={() => inputRef.current?.focus()} 
                className="relative cursor-text select-none overflow-hidden py-6 px-6" 
                style={{ 
                  height: "calc(3 * var(--typing-font-size) * var(--typing-line-height) + 2rem)",
                  minHeight: "180px"
                }}
              >
                {!focused && (
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-20 backdrop-blur-[1px]">
                    <span className="text-muted-soft text-xs font-mono bg-card px-4 py-2 border border-border-hairline rounded shadow-md">[ click to focus ]</span>
                  </div>
                )}
                <div
                  className="w-full relative transition-transform duration-300 ease-out"
                  style={{ transform: `translateY(${translateY}px)` }}
                >
                  <div 
                    className="flex flex-wrap text-left"
                    style={{
                      fontFamily: "var(--typing-font-family)",
                      fontSize: "var(--typing-font-size)",
                      lineHeight: "var(--typing-line-height)",
                      letterSpacing: "var(--typing-letter-spacing)",
                    }}
                  >
                    {renderedWords}
                  </div>
                </div>
              </div>
              <input ref={inputRef} type="text" value={typedInput} onChange={onChange}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </div>
          )}

          {roomStatus === "finished" && (
            <div className="flex flex-col items-center py-5 px-4 animate-fadeIn">
              <Trophy className="w-10 h-10 text-primary mb-1" />
              <h2 className="text-lg font-bold font-serif mb-1">Race Complete</h2>
              <p className="text-xs text-muted mb-4">
                {sortedResults[0]?.id === myPlayerId ? "You won!" : `${sortedResults[0]?.name} wins!`}
              </p>
              <div className="w-full max-w-sm border border-border-hairline rounded-lg overflow-hidden bg-background mb-4">
                <div className="grid grid-cols-12 bg-card border-b border-border-hairline px-3 py-1.5 text-[9px] font-bold text-muted-soft">
                  <span className="col-span-2 text-center">#</span>
                  <span className="col-span-5">Player</span>
                  <span className="col-span-3 text-center">WPM</span>
                  <span className="col-span-2 text-center">Acc</span>
                </div>
                {sortedResults.map((p: any, idx: number) => (
                  <div key={p.id} className={`grid grid-cols-12 px-3 py-2 text-xs items-center ${p.id === myPlayerId ? "bg-primary/5 font-bold" : ""}`}>
                    <span className="col-span-2 text-center font-mono text-primary font-bold">#{idx + 1}</span>
                    <span className="col-span-5 flex items-center gap-1 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "completed" ? "bg-success" : "bg-error"} shrink-0`} />
                      {p.name} {p.id === myPlayerId && <span className="text-[7px] bg-primary/15 text-primary px-1 rounded-sm">You</span>}
                    </span>
                    <span className="col-span-3 text-center font-mono">{Math.round(p.wpm)}</span>
                    <span className="col-span-2 text-center font-mono">{Math.round(p.accuracy)}%</span>
                  </div>
                ))}
              </div>
              <button onClick={rematch} className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary-hover cursor-pointer flex items-center gap-1.5 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Race Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes countdown-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .race-countdown-number { animation: countdown-pulse 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

