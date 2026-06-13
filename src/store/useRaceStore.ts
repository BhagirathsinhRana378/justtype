"use client";

import { create } from "zustand";

export type RoomStatus = "idle" | "waiting" | "countdown" | "racing" | "finished";
export type PlayerStatus = "waiting" | "ready" | "racing" | "completed" | "disconnected";

export interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  status: PlayerStatus;
  finishTime?: number;
}

interface RaceStore {
  playerName: string;
  roomId: string;
  roomStatus: RoomStatus;
  players: Player[];
  textToType: string;
  words: string[];
  myPlayerId: string;
  isHost: boolean;
  raceSettings: {
    gameMode: string;
    countdownDuration: number;
  };

  setPlayerName: (name: string) => void;
  setRoomId: (id: string) => void;
  setRoomStatus: (status: RoomStatus) => void;
  setPlayers: (players: Player[]) => void;
  setTextToType: (text: string) => void;
  setMyPlayerId: (id: string) => void;
  setIsHost: (v: boolean) => void;

  updatePlayer: (id: string, updates: Partial<Player>) => void;
  resetRoom: () => void;
}

export const useRaceStore = create<RaceStore>((set) => ({
  playerName: "",
  roomId: "",
  roomStatus: "idle",
  players: [],
  textToType: "",
  words: [],
  myPlayerId: "",
  isHost: false,
  raceSettings: {
    gameMode: "friend",
    countdownDuration: 5,
  },

  setPlayerName: (name) => set({ playerName: name }),
  setRoomId: (id) => set({ roomId: id }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayers: (players) => set({ players }),
  setTextToType: (text) => set({ textToType: text, words: text ? text.split(" ") : [] }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setIsHost: (v) => set({ isHost: v }),

  updatePlayer: (id, updates) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  resetRoom: () =>
    set({
      roomStatus: "idle",
      players: [],
      textToType: "",
      words: [],
      isHost: false,
    }),
}));
