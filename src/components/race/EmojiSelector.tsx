"use client";

import { Flame, Star, Zap, Award, ThumbsUp } from "lucide-react";

interface EmojiSelectorProps {
  onSelectEmoji: (emoji: string) => void;
}

const REACTION_EMOJIS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "👑", label: "Crown" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "💩", label: "Poop" },
  { emoji: "😮", label: "Gasp" }
];

export default function EmojiSelector({ onSelectEmoji }: EmojiSelectorProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card/90 border border-border-hairline/80 backdrop-blur-md rounded-2xl shadow-lg animate-fadeIn select-none">
      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-soft font-mono mr-1.5 hidden sm:inline">
        React:
      </span>
      <div className="flex items-center gap-1.5">
        {REACTION_EMOJIS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectEmoji(item.emoji)}
            className="w-10 h-10 rounded-xl bg-background border border-border-hairline hover:border-primary/50 text-xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150"
            title={item.label}
          >
            {item.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
