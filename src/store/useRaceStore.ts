import { create } from "zustand";

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

interface ReplayEvent {
  t: number;
  playerId: string;
  type: "key" | "mistake" | "boost" | "finish";
  wpm: number;
  acc: number;
  pos: number;
}

interface RaceStoreState {
  playerName: string;
  playerCar: string;
  roomId: string;
  roomStatus: "waiting" | "countdown" | "racing" | "finished";
  players: PlayerData[];
  textToType: string;
  myPlayerId: string;
  isHost: boolean;
  isSpectator: boolean;
  gameMode: string;
  results: any[];
  replays: ReplayEvent[];
  viewMode: "race" | "minimal";
  countdownSeconds: number;

  // Actions
  setProfile: (name: string, car: string) => void;
  setRoomId: (id: string) => void;
  setRoomStatus: (status: "waiting" | "countdown" | "racing" | "finished") => void;
  setPlayers: (players: PlayerData[]) => void;
  setTextToType: (text: string) => void;
  setMyPlayerId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  setIsSpectator: (isSpectator: boolean) => void;
  setGameMode: (mode: string) => void;
  setResults: (results: any[]) => void;
  setReplays: (replays: ReplayEvent[]) => void;
  setViewMode: (mode: "race" | "minimal") => void;
  setCountdownSeconds: (sec: number) => void;
  resetRoom: () => void;
}

export const useRaceStore = create<RaceStoreState>((set) => ({
  playerName: "Racer",
  playerCar: "sports",
  roomId: "",
  roomStatus: "waiting",
  players: [],
  textToType: "",
  myPlayerId: "",
  isHost: false,
  isSpectator: false,
  gameMode: "sprint",
  results: [],
  replays: [],
  viewMode: "race",
  countdownSeconds: 5,

  setProfile: (name, car) => set({ playerName: name, playerCar: car }),
  setRoomId: (id) => set({ roomId: id }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayers: (players) => set({ players }),
  setTextToType: (text) => set({ textToType: text }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setIsSpectator: (isSpectator) => set({ isSpectator }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setResults: (results) => set({ results }),
  setReplays: (replays) => set({ replays }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCountdownSeconds: (sec) => set({ countdownSeconds: sec }),
  resetRoom: () => set({
    roomStatus: "waiting",
    players: [],
    textToType: "",
    results: [],
    replays: [],
    countdownSeconds: 5
  })
}));
