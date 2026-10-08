"use client";

import { useDirector } from "../lib/director";

// The visual-novel chrome over the call: which chapter we are in, how she
// feels about you, and the director's narration.

const MOOD_LABEL = {
  happy: "♪ happy",
  neutral: "· calm",
  pout: "💢 pouting",
  surprise: "! surprised",
  embarrassed: "/// flustered",
} as const;

const HEARTS = 5;

export function StoryPanel() {
  const { character, route, beat, beatIndex, affection, mood, aside, ending, thinking } =
    useDirector();
  if (!character || !route || !beat) return null;

  const filled = Math.max(0, Math.min(HEARTS, Math.round((affection + 2) / 2)));

  return (
    <section className="rounded-xl border border-pink-900/60 bg-zinc-900/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-pink-300/80">
            {character.name}&apos;s route · {beatIndex + 1}/{route.beats.length}
          </div>
          <div className="text-sm font-medium text-zinc-100">{beat.title}</div>
        </div>
        <div className="text-right">
          <div className="text-base tracking-wide text-pink-400" title={`Affection ${affection}`}>
            {"♥".repeat(filled)}
            <span className="text-zinc-700">{"♥".repeat(HEARTS - filled)}</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            {thinking ? "…" : MOOD_LABEL[mood]}
          </div>
        </div>
      </div>
      {ending ? (
        <p className="mt-2 text-xs italic text-pink-200">
          {ending === "good" ? `🌸 ${route.goodEnding}` : `🥀 ${route.badEnding}`}
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] text-zinc-500">Goal: {beat.goal}</p>
          {aside && <p className="mt-1 text-xs italic text-zinc-300">{aside}</p>}
        </>
      )}
    </section>
  );
}
