// The visual-novel script format.
//
// A chapter is a flat list of nodes played in order, the same shape as the
// original Ren'Py labels. `{name}` in any text is replaced with the player's
// name. Images live under /vn (sprites, CGs) and /bg (backgrounds); audio
// under /audio; pre-rendered Gemini TTS lines under /voice.

export type Speaker =
  | "narrator"
  | "you"
  | "akari"
  | "miyuki"
  | "tsukiko"
  | "tatsumi"
  | "unknown";

export type HeroineId = "akari" | "miyuki" | "tsukiko";

export interface Bilingual {
  jp: string;
  en: string;
}

export type Node =
  /** Change the background (and optionally the music / play a sound). */
  | {
      kind: "scene";
      bg: string | null; // null = black
      music?: string | null; // undefined = keep, null = stop
      sfx?: string;
    }
  /** A full-screen event illustration, e.g. /vn/akari_ch1.png. */
  | { kind: "cg"; image: string; music?: string | null; sfx?: string }
  /** One line in the textbox. `sprite` undefined keeps the current one, null hides it. */
  | ({
      kind: "line";
      speaker: Speaker;
      sprite?: string | null;
      /** /voice/<id>.wav when the line is pre-voiced. */
      voice?: string;
    } & Bilingual)
  /** Ask the player for their name (stored as {name}). */
  | { kind: "name"; prompt: Bilingual }
  /** A choice; each option plays its own nodes, then the chapter continues. */
  | {
      kind: "menu";
      prompt?: Bilingual;
      options: ({ nodes: Node[] } & Bilingual)[];
    }
  /** Title card between chapters, e.g. "授業中…". */
  | { kind: "card"; text: Bilingual };

export interface Chapter {
  id: string;
  title: Bilingual;
  nodes: Node[];
}
