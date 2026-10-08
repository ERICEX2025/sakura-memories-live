"use client";

/* eslint-disable @next/next/no-img-element -- VN art, sized by CSS */

import { useEffect, useMemo, useRef, useState } from "react";
import { callActive, callLive, callStartable, clock, phaseLine } from "../lib/call";
import { useDirector } from "../lib/director";
import { ViduS2AvatarMainVideoView } from "../lib/model";
import { useSession } from "../lib/session";
import { paintedOf } from "../lib/story";
import { CAST } from "./cast";
import { SpriteAvatar } from "./SpriteAvatar";
import type { HeroineId } from "./types";
import type { useAudio } from "./useAudio";

// The heroine's route: a live Vidu S2-Avatar call framed as a phone call
// inside the visual novel. The scene's background fills the screen behind
// the phone, her latest line sits in a VN textbox, and the director's
// chapter, hearts and goal ride along on the left.

const HEARTS = 5;
const MOOD = {
  happy: "♪ happy",
  neutral: "· calm",
  pout: "💢 pouting",
  surprise: "! surprised",
  embarrassed: "/// flustered",
} as const;

export function CallScreen({
  heroine,
  audio,
  onExit,
}: {
  heroine: HeroineId;
  audio: ReturnType<typeof useAudio>;
  onExit: () => void;
}) {
  const session = useSession();
  const { phase, snapshot, busy, photo, transcript, micMuted, webcam, notice } = session;
  const director = useDirector();
  const { character, route, beat, beatIndex, affection, mood, aside, ending, thinking, choices, tatsumi } =
    director;
  const [draft, setDraft] = useState("");
  // Hand-drawn keyframes driven by her live voice, or Reactor's raw video.
  const [view, setView] = useState<"sprite" | "video">("sprite");
  const self = useRef<HTMLVideoElement>(null);
  const plate = CAST[heroine]!;

  const active = callActive(phase);
  const live = callLive(snapshot);
  const showVideo = active && snapshot?.video_receiving === true;
  const startable = callStartable(phase) && busy === null;

  useEffect(() => {
    if (self.current) self.current.srcObject = webcam;
  }, [webcam, active]);

  // Her theme plays while the phone rings, and fades out when she picks up.
  useEffect(() => {
    if (ending) {
      audio.playMusic(`/audio/${heroine}_theme.mp3`, 0.35);
    } else if (active) {
      audio.playMusic(null);
    } else {
      audio.playMusic(`/audio/${heroine}_theme.mp3`, 0.3);
    }
  }, [active, ending, heroine, audio]);

  // Tatsumi-sensei's voice when he walks in.
  useEffect(() => {
    if (tatsumi) audio.playVoice(tatsumi.voice);
  }, [tatsumi, audio]);

  // After an ending, give her a moment to say goodbye, then hang up.
  // (endCall through a ref: the session value changes every second.)
  const endCallRef = useRef(session.endCall);
  endCallRef.current = session.endCall;
  useEffect(() => {
    if (!ending || !active) return;
    const timer = setTimeout(() => void endCallRef.current(), 12_000);
    return () => clearTimeout(timer);
  }, [ending, active]);

  const herLine = useMemo(
    () => [...transcript].reverse().find((line) => line.speaker === "character"),
    [transcript],
  );
  const lastNarration = useMemo(() => {
    const last = transcript[transcript.length - 1];
    return last?.speaker === "narrator" ? last.text : null;
  }, [transcript]);
  const yourLine = useMemo(
    () => [...transcript].reverse().find((line) => line.speaker === "user"),
    [transcript],
  );

  const filled = Math.max(0, Math.min(HEARTS, Math.round((affection + 2) / 2)));
  const elapsed = snapshot?.call_elapsed_seconds ?? 0;
  const caption =
    busy === "connecting"
      ? "Connecting…"
      : phase === "preparing_avatar" || busy === "preparing"
        ? `Preparing ${plate.en}…`
        : !showVideo && active
          ? phaseLine(snapshot)
          : null;

  function send(text: string) {
    if (!text.trim() || !live) return;
    session.say(text);
    setDraft("");
  }

  return (
    <div className="call-root">
      {beat && (
        <img
          key={beat.background}
          src={paintedOf(beat.background)}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(".png")) e.currentTarget.src = beat.background;
          }}
          alt=""
          className="call-bg vn-fade"
        />
      )}

      <div className="call-grid">
        {/* Story */}
        <aside className="call-panel">
          {route && beat && (
            <>
              <div className="text-[11px] tracking-widest text-pink-300/90 uppercase">
                {plate.en}&apos;s route · {beatIndex + 1}/{route.beats.length}
              </div>
              <div className="font-vn text-xl text-white">{beat.title}</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl tracking-wider text-pink-400" title={`Affection ${affection}`}>
                  {"♥".repeat(filled)}
                  <span className="text-white/20">{"♥".repeat(HEARTS - filled)}</span>
                </span>
                <span className="text-xs text-zinc-300">{thinking ? "…" : MOOD[mood]}</span>
              </div>
              <div className="rounded-lg bg-black/35 p-3 text-sm text-pink-50/90">
                <div className="mb-1 text-[10px] tracking-widest text-pink-300/80 uppercase">Goal</div>
                {beat.goal}
              </div>
              {aside && <p className="font-vn text-sm text-pink-100/90 italic">{aside}</p>}
            </>
          )}
          {notice && <p className="text-xs text-amber-300">{notice}</p>}
        </aside>

        {/* The phone */}
        <div className="call-phone">
          {session.status === "ready" && (
            <ViduS2AvatarMainVideoView
              audioTrack="main_audio"
              videoObjectFit="cover"
              className={`absolute inset-0 h-full w-full ${showVideo && view === "video" ? "" : "invisible"}`}
            />
          )}
          {showVideo && view === "sprite" && <SpriteAvatar heroine={heroine} />}
          {!showVideo && photo && (
            <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="call-status">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-red-500" : "bg-zinc-400"}`} />
            <span className="font-vn">{plate.jp}</span>
            <span className="opacity-70">{live ? `LIVE ${clock(elapsed)}` : active ? "Connecting" : "Calling"}</span>
          </div>
          {caption && <div className="call-caption">{caption}</div>}
          {notice && !active && busy === null && character && (
            <button className="call-btn absolute top-12 left-1/2 -translate-x-1/2" onClick={() => session.chooseCharacter(character)}>
              ↻ Retry
            </button>
          )}
          {!active && !ending && (
            <button
              className="call-answer"
              disabled={!startable}
              onClick={() => void session.startCall()}
            >
              {startable ? "📞 Answer" : "…"}
            </button>
          )}
          {webcam && active && (
            <video ref={self} autoPlay muted playsInline className="call-self" />
          )}
        </div>

        {/* Controls */}
        <aside className="call-panel justify-end">
          {active && (
            <div className="flex flex-wrap gap-2">
              <button className="call-btn" onClick={session.toggleMic}>
                {micMuted ? "🎙️ Unmute" : "🎙️ Mute"}
              </button>
              <button className="call-btn" onClick={session.interrupt}>✋ Interrupt</button>
              <button className="call-btn" onClick={() => setView((v) => (v === "sprite" ? "video" : "sprite"))}>
                {view === "sprite" ? "🎞️ Live video" : "✏️ Sprite"}
              </button>
              <button className="call-btn !border-red-400/60 !text-red-200" onClick={() => void session.endCall()}>
                Hang up
              </button>
            </div>
          )}
          <button className="call-btn self-start" onClick={onExit}>
            ← Title
          </button>
        </aside>
      </div>

      {tatsumi && (
        <div className="call-tatsumi">
          <img src="/vn/tatsumi.png" alt="Tatsumi-sensei" />
          <div className="call-tatsumi-line">
            <div className="vn-plate !static !transform-none mb-1 inline-block" style={{ background: CAST.tatsumi!.color }}>
              {CAST.tatsumi!.jp}
            </div>
            <p className="font-vn text-lg text-white">{tatsumi.jp}</p>
            <p className="text-xs text-pink-100/75">{tatsumi.en}</p>
          </div>
        </div>
      )}

      {/* VN textbox */}
      <div className="call-textbox">
        <div className="vn-plate" style={{ background: plate.color }}>
          {plate.jp}
          <span className="ml-2 text-[0.7em] font-normal opacity-80">{plate.en}</span>
        </div>
        {lastNarration ? (
          <p className="font-vn text-lg text-pink-100/90 italic">{lastNarration}</p>
        ) : (
          <p className="font-vn text-[clamp(16px,1.7vw,22px)] leading-snug text-white">
            {herLine?.text ?? (active ? "…" : character?.greeting ?? "")}
          </p>
        )}
        {yourLine && <p className="mt-1 truncate text-xs text-zinc-400">You: {yourLine.text}</p>}

        {live && !ending && choices.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {choices.map((choice) => (
              <button key={choice.text} className="call-choice" onClick={() => send(choice.text)}>
                <span className="mr-1 text-[10px] tracking-wider text-pink-500 uppercase">{choice.tone}</span>
                {choice.text}
              </button>
            ))}
          </div>
        )}
        {live && !ending && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <input
              id="call-say"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Talk out loud, or type here…"
              className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white outline-none focus:border-pink-300/70"
            />
            <button className="call-btn">Say</button>
          </form>
        )}
      </div>

      {ending && !active && route && (
        <div className="call-ending vn-fade">
          <div className="font-vn text-5xl">{ending === "good" ? "🌸" : "🥀"}</div>
          <p className="font-vn max-w-2xl text-center text-2xl leading-relaxed text-white">
            {ending === "good" ? route.goodEnding : route.badEnding}
          </p>
          <div className="text-sm tracking-widest text-pink-200/80 uppercase">
            {ending === "good" ? `${plate.en}'s ending` : "Route lost"}
          </div>
          <div className="flex gap-3">
            <button className="vn-choice !w-48" onClick={() => void session.startCall()}>
              Call again
            </button>
            <button className="vn-choice !w-48" onClick={onExit}>
              Title
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
