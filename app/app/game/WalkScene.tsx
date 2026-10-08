"use client";

/* eslint-disable @next/next/no-img-element -- the world's anchor image */

import {
  LingbotWorld2MainVideoView,
  LingbotWorld2Provider,
  useLingbotWorld2,
} from "@reactor-models/lingbot-world-2";
import { useEffect, useRef, useState } from "react";
import { fetchToken } from "../ViduApp";

// Saturday's walk to the mall, as a world you walk through: Reactor's
// LingBot World 2 starts a generated world from the original game's street
// (repainted as anime background art, cherry blossoms prompted in) and the
// player drives it with WASD and the arrow keys. It runs as a second Reactor
// session beside the heroine's call, which keeps going in the corner.

const ANCHOR = "/bg/painted/way_to_mall_1.jpg";
const PROMPT =
  "Anime visual novel background art, a College Hill sidewalk in Providence, Rhode Island on a sunny spring Saturday, old New England houses, rows of cherry blossom trees in full bloom, pink petals drifting through the air, soft warm afternoon light, walking downhill toward Providence Place mall, painterly Makoto Shinkai style, gentle walking pace";
const AUTO_CONNECT = { autoConnect: true };
// Things said during the walk reshape the world: a word in the conversation
// picks a mood, and the mood is appended to the prompt.
export const WORLD_MOODS: { id: string; label: string; words: RegExp; prompt: string }[] = [
  { id: "sunset", label: "🌇 The sky turns to sunset", words: /sunset|evening|dusk|orange sky|yuuhi|夕/i, prompt: "golden hour sunset, the sky glowing orange and pink, long warm shadows" },
  { id: "night", label: "🌙 Night falls, lanterns glow", words: /night|stars|moon|lantern|yoru|夜/i, prompt: "night time, paper lanterns glowing along the street, stars in a deep blue sky, cherry blossoms lit softly" },
  { id: "rain", label: "☔ A spring rain begins", words: /rain|umbrella|ame|雨/i, prompt: "gentle spring rain, wet glistening pavement reflecting pink blossoms, soft grey sky" },
  { id: "petals", label: "🌸 A sakura snowstorm", words: /petal|sakura snow|snowstorm|hanafubuki|花吹雪|blossoms? (are )?falling/i, prompt: "a blizzard of pink cherry blossom petals swirling through the air, hanafubuki" },
  { id: "festival", label: "🏮 A festival appears", words: /festival|matsuri|food stall|yatai|祭/i, prompt: "a lively spring festival street with red lanterns and food stalls under the cherry trees" },
];

// Seconds of walking forward to reach the mall.
const WALK_SECONDS = 12;

export function WalkScene({
  onArrive,
  endless = false,
  mood = null,
  anchor = ANCHOR,
  prompt = PROMPT,
  controls = true,
}: {
  onArrive: () => void;
  endless?: boolean;
  /** A WORLD_MOODS id picked from the conversation. */
  mood?: string | null;
  /** The painted image the world starts from; a new one re-anchors it. */
  anchor?: string;
  prompt?: string;
  /** WASD walking and the walk HUD; off for a living scene you only watch. */
  controls?: boolean;
}) {
  return (
    <LingbotWorld2Provider jwtToken={fetchToken} connectOptions={AUTO_CONNECT}>
      <World
        onArrive={onArrive}
        endless={endless}
        mood={mood}
        anchor={anchor}
        basePrompt={prompt}
        controls={controls}
      />
    </LingbotWorld2Provider>
  );
}

type Move = "idle" | "forward" | "back";
type Strafe = "idle" | "strafe_left" | "strafe_right";
type Look = "idle" | "left" | "right";

function World({
  onArrive,
  endless,
  mood,
  anchor,
  basePrompt,
  controls,
}: {
  onArrive: () => void;
  endless: boolean;
  mood: string | null;
  anchor: string;
  basePrompt: string;
  controls: boolean;
}) {
  const moodDef = WORLD_MOODS.find((m) => m.id === mood) ?? null;
  const prompt = moodDef ? `${basePrompt}, ${moodDef.prompt}` : basePrompt;
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const promptRef = useRef(prompt);
  promptRef.current = prompt;
  const lw2 = useLingbotWorld2();
  const lw2Ref = useRef(lw2);
  lw2Ref.current = lw2;
  const [stage, setStage] = useState<"connecting" | "building" | "walking" | "failed">("connecting");
  const [progress, setProgress] = useState(0);
  const [video, setVideo] = useState(false);
  const startedRef = useRef(false);
  const movingRef = useRef<Move>("idle");
  const arrivedRef = useRef(false);

  // The provider connects on mount; if it is still disconnected a few
  // seconds later, ask again.
  useEffect(() => {
    if (lw2.status !== "disconnected" || startedRef.current) return;
    const timer = setTimeout(() => {
      void lw2Ref.current.connect().catch(() => setStage("failed"));
    }, 3000);
    return () => clearTimeout(timer);
  }, [lw2.status]);

  // Build the world from the anchor once the session is ready, and rebuild it
  // in place (same session, so seconds instead of a fresh connect) whenever
  // the scene moves to a new anchor.
  const builtRef = useRef<string | null>(null);
  useEffect(() => {
    if (lw2.status !== "ready" || builtRef.current === anchor) return;
    const rebuild = builtRef.current !== null;
    builtRef.current = anchor;
    startedRef.current = true;
    setStage("building");
    setVideo(false);
    (async () => {
      try {
        const api = lw2Ref.current;
        if (rebuild) await api.reset();
        const blob = await (await fetch(anchor)).blob();
        const ref = await api.uploadFile(new File([blob], "scene.jpg", { type: blob.type }));
        await api.setImage({ image: ref });
        await api.setPrompt({ prompt: promptRef.current });
        await api.setRotationSpeedDeg({ rotation_speed_deg: 1.5 });
        await api.start();
        if (builtRef.current === anchor) setStage("walking");
      } catch {
        setStage("failed");
      }
    })();
  }, [lw2.status, anchor]);

  // First frames: show the video instead of the still.
  useEffect(() => {
    if (stage !== "walking") return;
    const timer = setTimeout(() => setVideo(true), 1500);
    return () => clearTimeout(timer);
  }, [stage]);

  // WASD to walk, arrow keys to look around.
  useEffect(() => {
    const held = new Set<string>();
    const sync = () => {
      const api = lw2Ref.current;
      if (api.status !== "ready") return;
      const move: Move = held.has("w") ? "forward" : held.has("s") ? "back" : "idle";
      const strafe: Strafe = held.has("a") ? "strafe_left" : held.has("d") ? "strafe_right" : "idle";
      const look: Look = held.has("arrowleft") ? "left" : held.has("arrowright") ? "right" : "idle";
      const pitch = held.has("arrowup") ? "up" : held.has("arrowdown") ? "down" : "idle";
      movingRef.current = move;
      void api.setMoveLongitudinal({ move_longitudinal: move });
      void api.setMoveLateral({ move_lateral: strafe });
      void api.setLookHorizontal({ look_horizontal: look });
      void api.setLookVertical({ look_vertical: pitch });
    };
    const keys = ["w", "a", "s", "d", "arrowleft", "arrowright", "arrowup", "arrowdown"];
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || !controlsRef.current) return;
      const key = event.key.toLowerCase();
      if (!keys.includes(key) || held.has(key)) return;
      event.preventDefault();
      held.add(key);
      sync();
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!held.delete(key)) return;
      sync();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Walking forward brings the mall closer, measured in real time (timers
  // are throttled when the window is in the background).
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;
  useEffect(() => {
    let walked = 0;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (movingRef.current === "forward" && !arrivedRef.current && controlsRef.current) walked += (now - last) / 1000;
      last = now;
      const next = Math.min(1, walked / WALK_SECONDS);
      setProgress(next);
      if (next >= 1 && !arrivedRef.current && !endless) {
        arrivedRef.current = true;
        setTimeout(() => onArriveRef.current(), 600);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [endless]);

  // World models drift on long walks: keep reminding it of the street (and
  // of whatever the conversation turned it into).
  useEffect(() => {
    if (stage !== "walking") return;
    const timer = setInterval(() => {
      void lw2Ref.current.setPrompt({ prompt: promptRef.current });
    }, 5000);
    return () => clearInterval(timer);
  }, [stage]);

  // A new mood from the conversation: reshape the world right away.
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (stage !== "walking" || !moodDef) return;
    void lw2Ref.current.setPrompt({ prompt: promptRef.current });
    setToast(moodDef.label);
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [mood, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const arrive = () => {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    onArriveRef.current();
  };

  return (
    <div className="walk-root">
      <img key={anchor} src={anchor} alt="" className={`walk-layer object-cover transition-opacity duration-700 ${video ? "opacity-0" : "opacity-100"}`} />
      <LingbotWorld2MainVideoView
        videoObjectFit="cover"
        className={`walk-layer transition-opacity duration-700 ${video ? "opacity-100" : "opacity-0"}`}
      />
      {toast && <div className="walk-toast vn-fade font-vn">{toast}</div>}
      {!controls && (
        <div className="world-badge">
          <span className={`h-1.5 w-1.5 rounded-full ${stage === "walking" && video ? "bg-emerald-400" : "bg-amber-300"}`} />
          {stage === "walking" && video ? "Live world · LingBot World 2" : "Generating the scene…"}
        </div>
      )}
      {controls && (
      <div className="walk-hud">
        <div className="font-vn text-lg text-white">土曜日 · モールへ</div>
        <div className="text-xs tracking-widest text-pink-100/80 uppercase">Saturday · Walk to the mall</div>
        <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-pink-400 transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-1 text-[11px] text-zinc-300">
          {stage === "connecting"
            ? lw2.status === "waiting"
              ? "Waiting for a world-model GPU…"
              : `Opening the world… ${lw2.lastError ? `(${lw2.lastError.message})` : ""}`
            : stage === "building"
              ? "Generating the street…"
              : stage === "failed"
                ? "The world model is busy. Take the shortcut →"
                : "W to walk · A/D to step aside · ← → to look around"}
        </div>
        <button className="call-btn mt-2" onClick={arrive}>
          {stage === "failed" ? "Arrive at the mall" : "Skip ahead →"}
        </button>
      </div>
      )}
    </div>
  );
}
