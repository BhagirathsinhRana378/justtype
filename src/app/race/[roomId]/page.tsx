"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Zap, Trophy, Shield, Volume2, VolumeX, Eye, ArrowLeft, 
  RotateCcw, Sparkles, AlertTriangle, Play, HelpCircle, 
  Focus, Radio, MessageSquare, Users, Award, ShieldAlert,
  Timer, Gauge, Percent, Activity
} from "lucide-react";
import RaceTrackCanvas from "@/components/race/RaceTrackCanvas";
import MinimalProgressView from "@/components/race/MinimalProgressView";
import VoiceRoom from "@/components/race/VoiceRoom";
import EmojiSelector from "@/components/race/EmojiSelector";
import ReplayViewer from "@/components/race/ReplayViewer";
import Word from "@/components/Word";
import { useRaceStore } from "@/store/useRaceStore";
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
  finishTime?: number;
  rank?: number;
}

const calculateCorrectChars = (typed: string, targetWords: string[]): number => {
  if (!typed) return 0;
  const typedWords = typed.split(" ");
  let correctCharsCount = 0;
  
  for (let w = 0; w < typedWords.length; w++) {
    const typedWord = typedWords[w];
    const targetWord = targetWords[w] || "";
    
    const minLength = Math.min(typedWord.length, targetWord.length);
    for (let i = 0; i < minLength; i++) {
      if (typedWord[i] === targetWord[i]) {
        correctCharsCount++;
      }
    }
    
    if (w < typedWords.length - 1 && typedWord === targetWord) {
      correctCharsCount++;
    }
  }
  
  return correctCharsCount;
};

export default function RaceArena() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (params.roomId as string).toUpperCase();

  // URL configs
  const isCreate = searchParams.get("create") === "true";
  const startMode = searchParams.get("mode") || "sprint";
  const isBossRoom = startMode === "ai-boss";
  const bossName = searchParams.get("bossName") || "";
  const bossWpm = parseInt(searchParams.get("bossWpm") || "0");

  // Zustand Store binding
  const {
    playerName,
    playerCar,
    roomStatus,
    players,
    textToType,
    myPlayerId,
    isHost,
    isSpectator,
    gameMode,
    results,
    replays,
    viewMode,
    countdownSeconds,
    setProfile,
    setRoomId,
    setRoomStatus,
    setPlayers,
    setTextToType,
    setMyPlayerId,
    setIsHost,
    setIsSpectator,
    setGameMode,
    setResults,
    setReplays,
    setViewMode,
    setCountdownSeconds,
    resetRoom
  } = useRaceStore();

  // Local connection states
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectingMsg, setConnectingMsg] = useState("Connecting to typing grid...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [latency, setLatency] = useState(0);
  const [raceElapsed, setRaceElapsed] = useState(0);

  // Replays and Results
  const [showReplay, setShowReplay] = useState(false);
  const [circuitStandings, setCircuitStandings] = useState<any[]>([]);
  const [circuitRound, setCircuitRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);

  // Transient game notifications (overtakes, etc.)
  const [notification, setNotification] = useState<string | null>(null);

  // --- TYPING ENGINE STATE ---
  const [typedInput, setTypedInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [rawKeystrokes, setRawKeystrokes] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  // Split text & inputs into words list
  const words = useMemo(() => {
    return textToType ? textToType.split(" ") : [];
  }, [textToType]);

  const typedWords = useMemo(() => {
    return typedInput.split(" ");
  }, [typedInput]);

  const activeWordIndex = useMemo(() => {
    return Math.max(0, typedWords.length - 1);
  }, [typedWords]);

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const telemetryRef = useRef<any[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Voice Chat & Reactions
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [reactionOverlay, setReactionOverlay] = useState<any[]>([]);

  // Load User Configuration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("justtype_racer_name") || "Racer";
      const savedCar = localStorage.getItem("justtype_racer_car") || "sports";
      setProfile(savedName, savedCar);
      setRoomId(roomId);
    }
  }, [roomId, setProfile, setRoomId]);

  // Latency ping-pong sync
  useEffect(() => {
    if (roomStatus !== "racing") return;
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping", t: Date.now() }));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomStatus]);

  // Running race elapsed timer
  useEffect(() => {
    if (roomStatus !== "racing") {
      setRaceElapsed(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setRaceElapsed(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [roomStatus]);

  // Connect WebSockets
  useEffect(() => {
    if (!playerName) return;

    const wsUrl = "ws://127.0.0.1:3001";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setIsReconnecting(false);

      // Join/Create
      if (isCreate) {
        ws.send(JSON.stringify({
          type: "create_room",
          roomId,
          name: playerName,
          carType: playerCar,
          gameMode: startMode,
          bossName: isBossRoom ? bossName : undefined,
          bossWpm: isBossRoom ? bossWpm : undefined
        }));
      } else {
        ws.send(JSON.stringify({
          type: "join_room",
          roomId,
          name: playerName,
          carType: playerCar
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "pong":
            setLatency(Math.max(0, Math.round((Date.now() - msg.t) / 2)));
            break;

          case "room_created":
          case "room_joined":
            setMyPlayerId(msg.player.id);
            setTextToType(msg.text);
            setPlayers(msg.players);
            setRoomStatus("waiting");
            setGameMode(msg.gameMode);
            setIsSpectator(false);
            const hostPlayer = msg.players[0];
            const currentMyPlayerId = useRaceStore.getState().myPlayerId;
            if (hostPlayer && hostPlayer.id === currentMyPlayerId) {
              setIsHost(true);
            }
            break;

          case "spectate_joined":
            setTextToType(msg.text);
            setPlayers(msg.players);
            setRoomStatus(msg.status);
            setGameMode(msg.gameMode);
            setIsSpectator(true);
            break;

          case "player_joined":
          case "player_left":
          case "player_ready":
            setPlayers(msg.players);
            const activeHost = msg.players[0];
            const activeMyId = useRaceStore.getState().myPlayerId;
            if (activeHost && activeHost.id === activeMyId) {
              setIsHost(true);
            }
            break;

          case "countdown_start":
            setRoomStatus("countdown");
            setCountdownSeconds(msg.seconds);
            sound.playCountdown();
            
            let t = msg.seconds;
            const timer = setInterval(() => {
              t -= 1;
              if (t <= 0) {
                clearInterval(timer);
              } else {
                setCountdownSeconds(t);
                sound.playCountdown();
              }
            }, 1000);
            break;

          case "race_start":
            setRoomStatus("racing");
            setTypedInput("");
            setStreak(0);
            setAccuracy(100);
            setRawKeystrokes(0);
            setErrorsCount(0);
            setTranslateX(0);
            telemetryRef.current = [];
            lastKeyTimeRef.current = Date.now();
            sound.playStart();
            setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
            }, 100);
            break;

          case "tick":
            setPlayers(msg.players);
            break;

          case "overtake": {
            sound.playOvertake();
            const currentMyPlayerId = useRaceStore.getState().myPlayerId;
            if (msg.playerId === currentMyPlayerId) {
              triggerNotification(`Overtook ${msg.overtookName}! ⚡`);
            } else if (msg.overtookId === currentMyPlayerId) {
              triggerNotification(`${msg.name} overtook you! 💥`);
            }
            break;
          }

          case "player_finished": {
            const currentMyPlayerId = useRaceStore.getState().myPlayerId;
            if (msg.playerId === currentMyPlayerId) {
              sound.playFinish();
            }
            triggerNotification(`🏁 ${msg.name} Finished! WPM: ${msg.wpm}`);
            break;
          }

          case "player_eliminated":
            sound.playElimination();
            triggerNotification(`💥 ${msg.name} Eliminated!`);
            break;

          case "baton_passed":
            triggerNotification(`🏃 Team ${msg.team.toUpperCase()} passed baton!`);
            break;

          case "game_finished":
            setRoomStatus("finished");
            setResults(msg.players);
            setReplays(msg.replays || []);
            if (msg.isCircuit) {
              setCircuitStandings(msg.standings || []);
              setCircuitRound(msg.circuitRound);
              setMaxRounds(msg.maxRounds);
            }
            break;

          case "rematch_triggered":
            setRoomStatus("waiting");
            setTextToType(msg.text);
            setPlayers(msg.players);
            setTypedInput("");
            setStreak(0);
            setTranslateX(0);
            setResults([]);
            setReplays([]);
            setShowReplay(false);
            if (msg.isCircuit) {
              setCircuitRound(msg.circuitRound);
            }
            break;

          case "reaction_broadcast":
            triggerFloatingEmoji(msg.emoji, msg.name);
            break;

          case "error":
            setErrorMsg(msg.message);
            break;
        }
      } catch (err) {
        console.error("WS error: ", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setIsReconnecting(true);
      setConnectingMsg("Grid link lost. Attempting reconnect...");
    };

    return () => {
      ws.close();
    };
  }, [playerName, playerCar, roomId, isCreate, startMode, isBossRoom, bossName, bossWpm]);

  // Center scroll active word carousel calculation
  useEffect(() => {
    const activeWordEl = wordRefs.current[activeWordIndex];
    const container = containerRef.current;
    if (activeWordEl && container) {
      const containerWidth = container.offsetWidth;
      const wordLeft = activeWordEl.offsetLeft;
      const wordWidth = activeWordEl.offsetWidth;
      // translation to center the active word horizontally
      const targetTranslateX = containerWidth / 2 - wordLeft - wordWidth / 2;
      setTranslateX(targetTranslateX);
    }
  }, [activeWordIndex, words]);

  // Overtake chimes / alerts
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification(prev => (prev === text ? null : prev));
    }, 2500);
  };

  // Emojis reaction broadcast
  const triggerFloatingEmoji = (emoji: string, senderName: string) => {
    const id = Math.random().toString();
    const x = 20 + Math.random() * 60;
    const y = 80;
    setReactionOverlay(prev => [...prev, { id, emoji, senderName, x, y }]);
    setTimeout(() => {
      setReactionOverlay(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const sendEmojiReaction = (emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reaction", emoji }));
    }
  };

  // Controls triggers
  const readyUp = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ready" }));
    }
  };

  const triggerRematch = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "rematch" }));
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/race/${roomId}`;
    navigator.clipboard.writeText(link);
    triggerNotification("Copied room invite link! 🔗");
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Tab focus keyboard event
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) return;

      if (!isInputFocused && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isInputFocused]);

  // Helper values for active player
  const myPlayer = useMemo(() => {
    return players.find(p => p.id === myPlayerId);
  }, [players, myPlayerId]);

  // Team Relay Locker logic
  const relayStatus = useMemo(() => {
    if (gameMode !== "team-relay" || !myPlayer) return { isLocked: false, message: "", mySegmentStart: 0, mySegmentEnd: words.length };
    
    // Find teammates
    const teammates = players.filter(p => p.team === myPlayer.team);
    const myTeamPos = teammates.indexOf(myPlayer);
    
    // Determine active index from teammates who finished
    const activeIdx = teammates.filter(t => t.status === "completed").length;
    const isLocked = myTeamPos !== activeIdx;

    const segmentSize = Math.floor(words.length / teammates.length);
    const mySegmentStart = myTeamPos * segmentSize;
    const mySegmentEnd = myTeamPos === teammates.length - 1 ? words.length : (myTeamPos + 1) * segmentSize;

    let message = "";
    if (isLocked) {
      const currentRunner = teammates[activeIdx]?.name || "Teammate";
      message = `LOCKED: Teammate ${currentRunner} is currently typing!`;
    } else {
      message = "YOUR TURN! Type your segment highlighted below!";
    }

    return { isLocked, message, mySegmentStart, mySegmentEnd };
  }, [gameMode, players, myPlayer, words]);

  // --- TELEMETRY CALCULATIONS ---
  const myRank = useMemo(() => {
    if (!players || players.length === 0 || !myPlayer) return 1;
    const sorted = [...players].sort((a, b) => {
      if (a.status === "completed" && b.status === "completed") return a.finishTime! - b.finishTime!;
      if (a.status === "completed") return -1;
      if (b.status === "completed") return 1;
      return b.progress - a.progress;
    });
    return sorted.findIndex(p => p.id === myPlayerId) + 1;
  }, [players, myPlayer, myPlayerId]);

  const deltaText = useMemo(() => {
    if (players.length < 2 || !myPlayer) return "---";
    const sorted = [...players].sort((a, b) => b.progress - a.progress);
    const myIndex = sorted.findIndex(p => p.id === myPlayerId);
    if (myIndex === -1) return "---";
    
    if (myIndex === 0) {
      // Leading
      const runnerUp = sorted[1];
      const dist = (myPlayer.progress - runnerUp.progress) * 100;
      return `+${Math.round(dist)}m lead`;
    } else {
      // Behind
      const leader = sorted[myIndex - 1];
      const dist = (leader.progress - myPlayer.progress) * 100;
      return `-${Math.round(dist)}m behind`;
    }
  }, [players, myPlayer, myPlayerId]);

  const speedKph = useMemo(() => {
    if (!myPlayer) return 0;
    const baseSpeed = myPlayer.wpm * 1.6;
    const boostMult = myPlayer.nitroActive ? 1.5 : myPlayer.inSlipstream ? 1.15 : 1.0;
    return Math.round(baseSpeed * boostMult);
  }, [myPlayer]);

  const currentTypedWord = useMemo(() => {
    return typedWords[activeWordIndex] || "";
  }, [typedWords, activeWordIndex]);

  const currentTargetWord = useMemo(() => {
    return words[activeWordIndex] || "";
  }, [words, activeWordIndex]);

  const isCurrentWordMistake = useMemo(() => {
    if (!currentTypedWord) return false;
    return !currentTargetWord.startsWith(currentTypedWord);
  }, [currentTypedWord, currentTargetWord]);

  const nitroPercent = useMemo(() => {
    return Math.min(100, (streak / 100) * 100);
  }, [streak]);

  // Word-by-Word keystroke capture
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomStatus !== "racing" || isSpectator || relayStatus.isLocked) return;

    const val = e.target.value;
    const now = Date.now();
    const latency = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    setRawKeystrokes(prev => prev + 1);

    // Compute active word parameters
    const typedWordSplit = val.split(" ").slice(-1)[0] || "";
    
    const activeSegmentIndex = gameMode === "team-relay" 
      ? relayStatus.mySegmentStart + val.split(" ").length - 1
      : activeWordIndex;

    const targetWord = words[activeSegmentIndex] || "";
    
    const targetChar = targetWord[typedWordSplit.length - 1] || "";
    const typedChar = typedWordSplit[typedWordSplit.length - 1] || "";
    const isCorrect = typedChar === targetChar;

    if (typedChar && !isCorrect) {
      setErrorsCount(prev => prev + 1);
      setStreak(0);
      sound.playError();
    } else if (typedChar && isCorrect) {
      setStreak(prev => prev + 1);
      sound.playKey();

      if (streak + 1 === 100) {
        sound.playNitro();
      }
    }

    const telemetryEntry = {
      key: targetChar,
      typedKey: typedChar,
      timestamp: now,
      latency: latency,
      isCorrect
    };
    telemetryRef.current = [...telemetryRef.current.slice(-20), telemetryEntry];

    setTypedInput(val);

    const correctChars = calculateCorrectChars(val, words.slice(gameMode === "team-relay" ? relayStatus.mySegmentStart : 0));

    const newAcc = val.length > 0
      ? Math.round((correctChars / val.length) * 100)
      : 100;
    setAccuracy(newAcc);

    wsRef.current?.send(JSON.stringify({
      type: "progress",
      index: correctChars,
      typed: typedChar,
      accuracy: newAcc,
      streak: isCorrect ? streak + 1 : 0,
      keyTelemetry: telemetryRef.current,
      isMistake: !isCorrect
    }));
  };

  if (errorMsg) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-error mb-4" />
        <h1 className="text-2xl font-bold mb-2">Race Grid Error</h1>
        <p className="text-muted mb-6 max-w-sm">{errorMsg}</p>
        <button
          onClick={() => router.push("/race")}
          className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg cursor-pointer hover:bg-primary-hover transition-all"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  if (!connected && !isReconnecting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-lg font-mono text-muted">{connectingMsg}</h1>
        <button
          onClick={() => router.push("/race")}
          className="mt-6 text-xs text-muted hover:text-primary transition-all flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0d0711] text-foreground flex flex-col items-center py-6 px-4 sm:px-6 relative overflow-hidden select-none">
      
      {/* Reconnect Banner */}
      {isReconnecting && (
        <div className="w-full bg-error text-white text-center py-2 px-4 flex items-center justify-center gap-2 text-xs font-bold font-mono animate-pulse z-50">
          <ShieldAlert className="w-4 h-4" /> {connectingMsg}
        </div>
      )}

      {/* TOP HUD LAYER */}
      <div className="w-full max-w-5xl bg-card/45 border border-border-hairline rounded-2xl p-4 mb-6 z-20 backdrop-blur-md shadow-md flex flex-col gap-4">
        
        {/* Upper Row: Status and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-hairline/40 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/race")}
              className="p-2 rounded-xl bg-card border border-border-hairline hover:border-primary/50 text-muted hover:text-foreground cursor-pointer transition-all"
              title="Leave Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] text-muted-soft uppercase font-bold tracking-widest font-mono leading-none">
                Lobby: {roomId}
              </span>
              <div className="text-xs font-semibold text-primary capitalize mt-0.5 flex items-center gap-1.5">
                <span>Mode: {gameMode.replace("-", " ")}</span>
                {gameMode === "circuit" && (
                  <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-sm">
                    Round {circuitRound}/{maxRounds}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Large Center Digital Timer / Status */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-background/50 border border-border-hairline">
            <Timer className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-mono text-sm font-bold min-w-[3rem] text-center">
              {roomStatus === "racing" ? (
                `${Math.floor(raceElapsed / 60)}:${(raceElapsed % 60).toString().padStart(2, "0")}`
              ) : roomStatus === "countdown" ? (
                `0:0${countdownSeconds}`
              ) : (
                "00:00"
              )}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {connected && (
              <span className="text-[10px] font-mono text-muted-soft mr-2 flex items-center gap-1">
                <Activity className="w-3 h-3 text-success" />
                RTT: {latency}ms
              </span>
            )}

            <button
              onClick={() => setVoiceOpen(!voiceOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] uppercase font-bold transition-all cursor-pointer ${
                voiceOpen
                  ? "bg-success/10 border-success text-success"
                  : "bg-card border-border-hairline text-muted hover:text-foreground"
              }`}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Voice Room</span>
            </button>

            <div className="flex bg-card border border-border-hairline rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("race")}
                className={`px-3 py-1 rounded-lg text-[9px] uppercase font-bold transition-all cursor-pointer ${
                  viewMode === "race"
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Track
              </button>
              <button
                onClick={() => setViewMode("minimal")}
                className={`px-3 py-1 rounded-lg text-[9px] uppercase font-bold transition-all cursor-pointer ${
                  viewMode === "minimal"
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Minimal
              </button>
            </div>
          </div>
        </div>

        {/* Lower Row: Racing Telemetry Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-center">
          
          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Live Rank</span>
            <span className="text-base font-black text-primary font-mono">
              {myPlayer?.status === "completed" ? `#${myPlayer.rank}` : `#${myRank}`}
            </span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Delta</span>
            <span className="text-xs font-bold font-mono text-success truncate">{deltaText}</span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Speed</span>
            <span className="text-sm font-bold font-mono flex items-center justify-center gap-0.5">
              <Gauge className="w-3.5 h-3.5 text-muted-soft" />
              {speedKph} <span className="text-[9px] text-muted-soft">KPH</span>
            </span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">WPM</span>
            <span className="text-sm font-bold font-mono text-primary">{myPlayer?.wpm || 0}</span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Accuracy</span>
            <span className="text-sm font-bold font-mono">{accuracy}%</span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Combo</span>
            <span className="text-sm font-bold font-mono text-success">🔥 x{streak}</span>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center gap-1">
            <span className="text-[9px] uppercase font-bold text-muted-soft block">Nitro Charge</span>
            <div className="w-full h-1.5 bg-card rounded-full overflow-hidden border border-border-hairline/80">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-background/40 border border-border-hairline/60 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold text-muted-soft block mb-0.5">Completion</span>
            <span className="text-xs font-bold font-mono flex items-center justify-center gap-0.5 text-primary">
              <Percent className="w-3 h-3" />
              {Math.round((myPlayer?.progress || 0) * 100)}%
            </span>
          </div>

        </div>

      </div>

      {/* Floating notifications */}
      {notification && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-card/90 border border-primary/20 backdrop-blur-md rounded-xl px-5 py-2.5 text-xs font-bold text-primary shadow-xl z-50 animate-fadeIn flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          {notification}
        </div>
      )}

      {/* CENTER LIVE RACE AREA */}
      <div className="w-full max-w-5xl flex flex-col gap-6 z-10 flex-grow">
        
        <div className="bg-card border border-border-hairline rounded-2xl overflow-hidden shadow-lg min-h-60 relative backdrop-blur-md">
          {viewMode === "race" ? (
            <RaceTrackCanvas players={players} myPlayerId={myPlayerId} />
          ) : (
            <MinimalProgressView players={players} myPlayerId={myPlayerId} />
          )}

          {/* Flying Emoji Reaction Screen Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {reactionOverlay.map((r) => (
              <div
                key={r.id}
                className="absolute text-4xl animate-float transition-all duration-[3000ms] flex flex-col items-center"
                style={{
                  left: `${r.x}%`,
                  bottom: `calc(100% - ${r.y}%)`,
                  opacity: 0,
                  transform: "scale(0.8)",
                  animation: "floatUp 3s ease-out forwards"
                }}
              >
                <span>{r.emoji}</span>
                <span className="text-[9px] bg-background/80 text-muted px-1.5 py-0.5 rounded-full border border-border-hairline mt-1">
                  {r.senderName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM TYPING / PLAY AREA */}
        <div className="bg-card border border-border-hairline rounded-2xl p-6 relative flex flex-col justify-center min-h-64 shadow-lg backdrop-blur-md">
          
          {/* Room State: Lobby waiting */}
          {roomStatus === "waiting" && (
            <div className="flex flex-col items-center py-6 text-center animate-fadeIn">
              <Users className="w-12 h-12 text-primary mb-3" />
              <h2 className="text-xl font-bold mb-1">Pre-Race Grid</h2>
              <p className="text-xs text-muted mb-6 max-w-sm leading-relaxed">
                Invite friends using the room code or click "Ready Up" to begin. All human players must be ready.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={copyInviteLink}
                  className="px-5 py-3 border border-border-hairline text-xs font-bold rounded-xl hover:border-primary hover:text-primary transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Share Room Invite
                </button>
                <button
                  onClick={readyUp}
                  className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm transition-all duration-300 ${
                    myPlayer?.status === "ready"
                      ? "bg-success/20 text-success border border-success/30 cursor-default"
                      : "bg-primary text-on-primary hover:bg-primary-hover"
                  }`}
                >
                  {myPlayer?.status === "ready" ? "Ready & Waiting" : "Ready Up"}
                </button>
              </div>

              {/* Lobby Players List */}
              <div className="w-full max-w-md mt-8 border-t border-border-hairline pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-soft mb-3 text-left">
                  Drivers in Room ({players.length})
                </h3>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-background border border-border-hairline rounded-xl px-3 py-2 text-xs"
                    >
                      <span className="font-bold flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.isBoss ? "#ff0055" : "#5db872" }} />
                        {p.name}
                        {p.isBoss && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded-sm">Boss</span>}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${p.status === "ready" ? "text-success" : "text-muted"}`}>
                        {p.status === "ready" ? "Ready" : "Grid"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Room State: Countdown */}
          {roomStatus === "countdown" && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-pulse">
              <span className="text-muted-soft text-xs uppercase font-bold tracking-widest font-mono mb-2">
                Engines Revving
              </span>
              <div className="text-7xl font-serif font-black text-primary font-mono tracking-tighter">
                {countdownSeconds}
              </div>
              <span className="text-muted text-xs mt-3 leading-none uppercase tracking-wider">
                Hold focus, race starting...
              </span>
            </div>
          )}

          {/* Room State: Racing */}
          {roomStatus === "racing" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Team Relay Status Locking bar */}
              {gameMode === "team-relay" && (
                <div className={`text-center py-2 px-4 rounded-xl border text-xs font-bold ${
                  relayStatus.isLocked 
                    ? "bg-error/10 border-error/30 text-error animate-pulse"
                    : "bg-success/10 border-success/30 text-success"
                }`}>
                  {relayStatus.message}
                </div>
              )}

              {/* Premium Word Carousel Typing Area */}
              <div
                ref={containerRef}
                onClick={focusInput}
                className={`w-full relative cursor-text select-none outline-none overflow-hidden py-6 border rounded-2xl bg-background/80 px-6 transition-all duration-200 ${
                  relayStatus.isLocked ? "opacity-35 pointer-events-none" : ""
                } ${isCurrentWordMistake ? "border-error/50 shadow-md shadow-error/10 animate-shake" : "border-border-hairline focus-within:border-primary/50"}`}
                style={{
                  height: "90px",
                }}
              >
                {/* Left & Right Fade Mask overlays */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#17121c] to-transparent pointer-events-none z-10" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#17121c] to-transparent pointer-events-none z-10" />

                {/* Click to focus warning overlay */}
                {!isInputFocused && !isSpectator && !relayStatus.isLocked && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20 transition-opacity duration-200 backdrop-blur-[1px]">
                    <span className="text-muted-soft text-xs font-mono tracking-widest bg-card px-4 py-2 border border-border-hairline rounded-md shadow-xs">
                      [ click to focus ]
                    </span>
                  </div>
                )}

                {/* Scrolling Horizontal Words Carousel */}
                <div
                  className="flex flex-row items-center absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate3d(${translateX}px, -50%, 0)`,
                    lineHeight: "1",
                    fontSize: "24px",
                  }}
                >
                  {words.map((word, index) => {
                    const isRelayMode = gameMode === "team-relay";
                    const isMySegment = !isRelayMode || (index >= relayStatus.mySegmentStart && index < relayStatus.mySegmentEnd);
                    
                    const typedVal = isMySegment 
                      ? typedWords[isRelayMode ? index - relayStatus.mySegmentStart : index]
                      : undefined;

                    const activeIndexLocal = isRelayMode 
                      ? activeWordIndex + relayStatus.mySegmentStart
                      : activeWordIndex;

                    const isActive = index === activeIndexLocal;
                    const isPast = index < activeIndexLocal;

                    // Calculate opacity fade based on distance
                    const distance = Math.abs(index - activeIndexLocal);
                    let opacity = 1.0;
                    if (!isMySegment) {
                      opacity = 0.1;
                    } else if (index !== activeIndexLocal) {
                      opacity = Math.max(0.12, 0.85 - distance * 0.22);
                    }

                    return (
                      <span
                        key={index}
                        ref={(el) => {
                          wordRefs.current[index] = el;
                        }}
                        className="inline-flex transition-opacity duration-200"
                        style={{ opacity }}
                      >
                        <Word
                          word={word}
                          wordIndex={index}
                          isActive={isActive && !relayStatus.isLocked}
                          isPast={isPast}
                          typed={typedVal}
                          caretType="smooth"
                          isFocused={isInputFocused}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Hidden text capture input */}
              {!isSpectator && !relayStatus.isLocked && (
                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={handleInputChange}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="absolute left-[-9999px] top-[-9999px] opacity-0"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}

              {/* Spectator Indicator */}
              {isSpectator && (
                <div className="text-center py-3 text-xs text-muted-soft border border-dashed border-border-hairline rounded-lg">
                  Spectator Mode active. Observing racers...
                </div>
              )}
            </div>
          )}

          {/* Room State: Finished / Results Screen */}
          {roomStatus === "finished" && (
            <div className="flex flex-col items-center py-4 animate-fadeIn">
              <Trophy className="w-12 h-12 text-primary mb-2" />
              <h2 className="text-2xl font-bold font-serif mb-1">
                {gameMode === "circuit" && circuitRound === maxRounds ? "Circuit Completed!" : "Race Complete"}
              </h2>
              <p className="text-xs text-muted mb-6">Standard rankings verified by server authoritative engine.</p>

              {/* Circuit Standings Table (if Circuit mode) */}
              {gameMode === "circuit" && circuitStandings.length > 0 ? (
                <div className="w-full max-w-xl border border-border-hairline rounded-xl overflow-hidden bg-background mb-6 shadow-md">
                  <div className="grid grid-cols-12 bg-card border-b border-border-hairline px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-4 text-left">Driver</div>
                    <div className="col-span-2 text-center">WPM</div>
                    <div className="col-span-2 text-center">Pts Added</div>
                    <div className="col-span-2 text-center">Total Pts</div>
                  </div>

                  <div className="flex flex-col divide-y divide-border-hairline">
                    {circuitStandings.map((p, idx) => {
                      const isMe = p.id === myPlayerId;
                      const isGrandChampion = circuitRound === maxRounds && idx === 0;
                      return (
                        <div
                          key={p.id}
                          className={`grid grid-cols-12 px-4 py-3 text-xs items-center ${
                            isMe ? "bg-primary/5 font-bold" : ""
                          }`}
                        >
                          <div className="col-span-2 text-center text-sm font-mono text-primary font-bold">
                            #{idx + 1}
                          </div>
                          <div className="col-span-4 text-left flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            {p.name}
                            {isGrandChampion && <Award className="w-3.5 h-3.5 text-accent-amber animate-bounce" />}
                            {isMe && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded-sm">You</span>}
                          </div>
                          <div className="col-span-2 text-center font-mono">{p.wpm}</div>
                          <div className="col-span-2 text-center font-mono text-success">+{p.roundPoints}</div>
                          <div className="col-span-2 text-center font-mono text-primary font-bold">{p.totalPoints}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Standard Results Table */
                <div className="w-full max-w-xl border border-border-hairline rounded-xl overflow-hidden bg-background mb-6 shadow-md">
                  <div className="grid grid-cols-12 bg-card border-b border-border-hairline px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-5 text-left">Driver</div>
                    <div className="col-span-3 text-center">WPM</div>
                    <div className="col-span-2 text-center">Accuracy</div>
                  </div>

                  <div className="flex flex-col divide-y divide-border-hairline">
                    {results.map((p, idx) => {
                      const isMe = p.id === myPlayerId;
                      return (
                        <div
                          key={p.id}
                          className={`grid grid-cols-12 px-4 py-3 text-xs items-center ${
                            isMe ? "bg-primary/5 font-bold" : ""
                          }`}
                        >
                          <div className="col-span-2 text-center text-sm font-mono text-primary font-bold">
                            #{idx + 1}
                          </div>
                          <div className="col-span-5 text-left flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            {p.name}
                            {isMe && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded-sm">You</span>}
                            {p.status === "eliminated" && (
                              <span className="text-[8px] bg-error/10 text-error px-1 rounded-sm uppercase">DNF</span>
                            )}
                          </div>
                          <div className="col-span-3 text-center font-mono text-sm">{p.wpm}</div>
                          <div className="col-span-2 text-center font-mono">{p.accuracy}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowReplay(true)}
                  className="px-5 py-3 border border-border-hairline text-xs font-bold rounded-xl hover:border-primary hover:text-primary transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Watch Replay
                </button>
                {isHost && (
                  <button
                    onClick={triggerRematch}
                    className="px-8 py-3 bg-primary text-on-primary hover:bg-primary-hover font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> 
                    {gameMode === "circuit" && circuitRound < maxRounds ? `Next Round (${circuitRound + 1}/${maxRounds})` : "Challenge Rematch"}
                  </button>
                )}
                {!isHost && (
                  <div className="text-xs text-muted-soft font-medium flex items-center py-3 px-4 bg-background border border-border-hairline rounded-xl">
                    Waiting for host to trigger next action...
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Reaction Bar */}
        {roomStatus === "racing" && (
          <div className="flex justify-center z-20">
            <EmojiSelector onSelectEmoji={sendEmojiReaction} />
          </div>
        )}

        {/* Voice Room Panel */}
        {voiceOpen && (
          <div className="z-30">
            <VoiceRoom roomId={roomId} myPlayerName={playerName} />
          </div>
        )}

        {/* Replay Overlay */}
        {showReplay && (
          <ReplayViewer
            text={textToType}
            players={players}
            events={replays}
            onClose={() => setShowReplay(false)}
          />
        )}

      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateY(0) scale(1.1);
          }
          90% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.9);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 2;
        }
      `}</style>
    </div>
  );
}
