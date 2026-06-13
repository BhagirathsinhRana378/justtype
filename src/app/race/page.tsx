"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Zap, Trophy, Shield, Rocket, Flame, Users, Plus, ArrowRight, Play, Eye, Volume2, Gamepad2 } from "lucide-react";

const CARS = [
  { id: "sports", name: "Cyber Racer", color: "#cc785c", desc: "Balanced performance, neon copper highlights" },
  { id: "f1", name: "F1 Prototype", color: "#5db8a6", desc: "Ultra aerodynamic, mint teal energy lines" },
  { id: "muscle", name: "Neon Charger", color: "#e8a55a", desc: "Raw power, glowing amber exhaust trails" },
  { id: "hyper", name: "Frost Apex", color: "#58a6ff", desc: "Lightweight carbon, ice-blue underglow" },
  { id: "phantom", name: "Midnight Shadow", color: "#b34cff", desc: "Stealth composite, deep violet vapor trails" }
];

const MODES = [
  { id: "sprint", name: "Sprint", desc: "Standard straight race to the end of the text. Fastest player wins.", icon: Flame },
  { id: "circuit", name: "Circuit (3 Rounds)", desc: "Type across three consecutive rounds. Highest total score wins.", icon: Gamepad2 },
  { id: "marathon", name: "Marathon", desc: "Endurance typing on an extra-long text. Focus and consistency are key.", icon: Rocket },
  { id: "elimination", name: "Elimination", desc: "The slowest typing racer is eliminated every 15 seconds. Survive to win.", icon: Shield },
  { id: "battle-royale", name: "Battle Royale", desc: "Mistakes deal damage to your shield. Last player standing wins.", icon: Trophy },
  { id: "ai-boss", name: "AI Boss Race", desc: "Race against a neural typing boss with adjustable speed parameters.", icon: Users }
];

const BOSSES = [
  { name: "Keystroke Kestrel", wpm: 60, desc: "A steady typing assistant. Good for beginners." },
  { name: "Syntax Viper", wpm: 90, desc: "Fast and clean transitions. A challenging opponent." },
  { name: "Neural Overlord", wpm: 125, desc: "Flawless mechanical cadence. Types at lightning speeds." }
];

export default function RaceLobby() {
  const router = useRouter();
  
  // Player Profile State
  const [name, setName] = useState("");
  const [selectedCar, setSelectedCar] = useState("sports");
  
  // Custom Room Selection States
  const [selectedMode, setSelectedMode] = useState("sprint");
  const [bossIndex, setBossIndex] = useState(0);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  
  // Matchmaking Queue States
  const [inQueue, setInQueue] = useState(false);
  const [queueTimer, setQueueTimer] = useState(0);
  
  // Active Server Rooms List
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const queueIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Name from Local Storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("justtype_racer_name");
      if (savedName) {
        setName(savedName);
      } else {
        const randNum = Math.floor(Math.random() * 900) + 100;
        setName(`Racer_${randNum}`);
      }
      
      const savedCar = localStorage.getItem("justtype_racer_car");
      if (savedCar) setSelectedCar(savedCar);
    }
  }, []);

  // Connect to WS Lobby to view live rooms list
  useEffect(() => {
    const wsUrl = "ws://127.0.0.1:3001";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_lobby" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "lobby_info") {
          setActiveRooms(msg.activeRooms || []);
        } else if (msg.type === "matchmaking_queued") {
          setInQueue(true);
        } else if (msg.type === "matchmaking_found") {
          cleanupQueue();
          router.push(`/race/${msg.roomId}`);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Poll lobby info periodically
    const pollInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "join_lobby" }));
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      ws.close();
    };
  }, [router]);

  // Handle Nickname Save
  const handleNameChange = (val: string) => {
    setName(val);
    localStorage.setItem("justtype_racer_name", val);
  };

  // Handle Car Change
  const selectCarSkin = (id: string) => {
    setSelectedCar(id);
    localStorage.setItem("justtype_racer_car", id);
  };

  // Matchmaking Trigger
  const toggleMatchmaking = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (inQueue) {
      wsRef.current.send(JSON.stringify({ type: "cancel_matchmaking" }));
      cleanupQueue();
    } else {
      wsRef.current.send(JSON.stringify({
        type: "search_matchmaking",
        name,
        carType: selectedCar
      }));
      setInQueue(true);
      setQueueTimer(0);
      queueIntervalRef.current = setInterval(() => {
        setQueueTimer(prev => prev + 1);
      }, 1000);
    }
  };

  const cleanupQueue = () => {
    setInQueue(false);
    if (queueIntervalRef.current) {
      clearInterval(queueIntervalRef.current);
      queueIntervalRef.current = null;
    }
  };

  // Create Room
  const createRoom = () => {
    // Connect to room using router. The room page itself handles creating/joining logic
    // But to store settings, we pass query params or create here
    const bossParams = selectedMode === "ai-boss" 
      ? `&boss=true&bossName=${encodeURIComponent(BOSSES[bossIndex].name)}&bossWpm=${BOSSES[bossIndex].wpm}` 
      : "";
    
    // Generate a temporary seed ID locally and redirect
    const tempRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/race/${tempRoomId}?create=true&mode=${selectedMode}${bossParams}`);
  };

  // Join Room by Code
  const joinRoomByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    router.push(`/race/${roomCodeInput.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground relative flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-teal/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-5xl flex flex-col gap-8 z-10">
        
        {/* Cinematic Title */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3 animate-[pulse_2s_infinite]">
            <Zap className="w-3.5 h-3.5" /> Real-time Multiplayer Arena
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight mb-2">
            JustType <span className="text-primary">Race Mode</span>
          </h1>
          <p className="text-muted max-w-lg text-sm sm:text-base leading-relaxed">
            Typing is the input, racing is the experience. Accelerate through perfect streaks, utilize slipstreams, and ignite nitros to overtake opponents.
          </p>
        </div>

        {/* Lobby Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Vehicle Selection */}
          <div className="lg:col-span-1 bg-card border border-border-hairline rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Driver Profile
              </h2>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-soft block mb-1">
                Nickname
              </label>
              <input
                type="text"
                maxLength={18}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-background border border-border-hairline hover:border-primary/50 focus:border-primary focus:outline-none rounded-xl px-4 py-3 text-sm transition-colors font-medium"
                placeholder="Enter nickname..."
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-soft block mb-3">
                Select Vehicle Skin
              </h3>
              <div className="flex flex-col gap-2.5">
                {CARS.map((car) => {
                  const isSelected = selectedCar === car.id;
                  return (
                    <button
                      key={car.id}
                      onClick={() => selectCarSkin(car.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs"
                          : "bg-background border-border-hairline hover:border-muted"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: car.color }} />
                          {car.name}
                        </span>
                        <span className="text-[11px] text-muted-soft mt-0.5 leading-snug">{car.desc}</span>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-border-hairline flex items-center justify-center">
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column: Create Room & Matchmaking */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Matchmaking Banner */}
            <div className="bg-card border border-border-hairline rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                    <Rocket className="w-5 h-5 text-primary" /> Public Matchmaking
                  </h2>
                  <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">
                    Queue up and race against live typing enthusiasts worldwide. Match triggers once 2+ players enter.
                  </p>
                </div>

                <button
                  onClick={toggleMatchmaking}
                  className={`px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase cursor-pointer flex items-center gap-2 transition-all duration-300 ${
                    inQueue
                      ? "bg-error text-white hover:bg-error/90 animate-pulse"
                      : "bg-primary text-on-primary hover:bg-primary-hover shadow-md hover:scale-[1.02]"
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {inQueue ? `Finding Match... (${queueTimer}s)` : "Join Quick Race"}
                </button>
              </div>
            </div>

            {/* Custom Room Creator */}
            <div className="bg-card border border-border-hairline rounded-2xl p-6 backdrop-blur-md flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Create Custom Lobby
                </h2>
                <p className="text-xs text-muted mb-4">
                  Configure custom room styles and invite friends via secret room links.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-primary/5 border-primary"
                            : "bg-background border-border-hairline hover:border-muted"
                        }`}
                      >
                        <span className="text-sm font-bold flex items-center gap-2 mb-1">
                          <ModeIcon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted"}`} />
                          {mode.name}
                        </span>
                        <p className="text-[11px] text-muted-soft leading-relaxed">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boss Selector (If AI Boss is Selected) */}
              {selectedMode === "ai-boss" && (
                <div className="bg-background border border-border-hairline rounded-xl p-4 animate-fadeIn">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-soft block mb-3">
                    Choose Opponent Boss
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {BOSSES.map((boss, idx) => {
                      const isSelected = bossIndex === idx;
                      return (
                        <button
                          key={boss.name}
                          onClick={() => setBossIndex(idx)}
                          className={`p-3 rounded-lg border cursor-pointer text-center flex flex-col justify-center transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-card border-border-hairline hover:border-muted"
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{boss.name}</span>
                          <span className="text-[10px] text-primary font-mono mt-1 font-semibold">{boss.wpm} WPM</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-soft mt-2.5 text-center leading-relaxed">
                    {BOSSES[bossIndex].desc}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2 border-t border-border-hairline">
                {/* Join by Code Form */}
                <form onSubmit={joinRoomByCode} className="w-full sm:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-28 uppercase text-center bg-background border border-border-hairline hover:border-primary/50 focus:border-primary focus:outline-none rounded-xl px-2 py-2.5 text-xs font-semibold tracking-widest font-mono"
                    placeholder="CODE"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl border border-border-hairline text-xs font-bold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Join Code <ArrowRight className="w-3 h-3" />
                  </button>
                </form>

                {/* Create Room Submit */}
                <button
                  onClick={createRoom}
                  className="w-full sm:w-auto px-6 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Start Room
                </button>
              </div>

            </div>

            {/* Active Rooms Watch List */}
            <div className="bg-card border border-border-hairline rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Active Matches
              </h2>
              {activeRooms.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-soft border border-dashed border-border-hairline rounded-xl bg-background/50">
                  No active rooms. Create one and invite your friends!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {activeRooms.map((r) => (
                    <div
                      key={r.id}
                      className="bg-background border border-border-hairline rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Room {r.id}
                        </span>
                        <span className="text-[10px] text-muted-soft mt-1 leading-none capitalize">
                          {r.mode} • Host: {r.host}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/race/${r.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        {r.status === "racing" ? "Spectate" : "Join"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
