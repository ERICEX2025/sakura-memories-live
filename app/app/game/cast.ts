import type { Speaker } from "./types";

// Name plates, in the colors the original Ren'Py script gave each character.
export const CAST: Record<Speaker, { jp: string; en: string; color: string } | null> = {
  narrator: null,
  you: { jp: "君", en: "You", color: "#e9ff6b" },
  akari: { jp: "明莉", en: "Akari", color: "#ff839a" },
  miyuki: { jp: "海雪", en: "Miyuki", color: "#ffa73c" },
  tsukiko: { jp: "月子", en: "Tsukiko", color: "#69a7f8" },
  tatsumi: { jp: "立見先生", en: "Tatsumi-sensei", color: "#9fff7c" },
  unknown: { jp: "???", en: "???", color: "#a2a2a2" },
};

export const DEFAULT_NAME = "Eren";
