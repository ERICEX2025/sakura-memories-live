"use client";

/* eslint-disable @next/next/no-img-element -- VN art, sized by CSS */

import { useCallback, useEffect, useState } from "react";
import { fetchToken } from "../ViduApp";
import { CHARACTERS } from "../lib/characters";
import { DirectorProvider, useDirector } from "../lib/director";
import { ViduS2AvatarProvider } from "../lib/model";
import { SessionProvider, useSession } from "../lib/session";
import { setPlayerName } from "../lib/story";
import { CallScreen } from "./CallScreen";
import { CAST, DEFAULT_NAME } from "./cast";
import { CHAPTER_1, CHAPTER_2_INTRO } from "./chapters";
import type { HeroineId } from "./types";
import { useAudio } from "./useAudio";
import { VNPlayer } from "./VNPlayer";

// The whole game: title → Chapter 1 → Chapter 2 → choose a partner → her
// route as a live call. The Reactor session lives above every screen, so
// choosing a partner starts building her avatar while the transition plays.

const CHAPTERS = [CHAPTER_1, CHAPTER_2_INTRO];

type Screen = "title" | "vn" | "choose" | "call";

export function Game() {
  return (
    <ViduS2AvatarProvider jwtToken={fetchToken}>
      <SessionProvider>
        <DirectorProvider>
          <GameFlow />
        </DirectorProvider>
      </SessionProvider>
    </ViduS2AvatarProvider>
  );
}

function GameFlow() {
  const audio = useAudio();
  const { chooseCharacter, endSession } = useSession();
  const { skipBeat } = useDirector();
  const [screen, setScreen] = useState<Screen>("title");
  const [chapter, setChapter] = useState(0);
  const [name, setName] = useState("");
  const [heroine, setHeroine] = useState<HeroineId | null>(null);

  const rename = useCallback((next: string) => {
    setName(next);
    setPlayerName(next);
  }, []);

  const start = useCallback(() => {
    audio.playSfx("/audio/sakura-memory-intro.mp3", 0.8);
    setChapter(0);
    setScreen("vn");
  }, [audio]);

  const chapterDone = useCallback(() => {
    setChapter((c) => {
      if (c + 1 < CHAPTERS.length) return c + 1;
      setScreen("choose");
      return c;
    });
  }, []);

  const pick = useCallback(
    (id: HeroineId) => {
      if (!name) rename(DEFAULT_NAME);
      const character = CHARACTERS.find((c) => c.id === id);
      if (!character) return;
      audio.playSfx("/audio/schoolbell.mp3", 0.35);
      setHeroine(id);
      chooseCharacter(character);
      setScreen("call");
    },
    [audio, chooseCharacter, name, rename],
  );

  const toTitle = useCallback(() => {
    void endSession();
    setHeroine(null);
    setScreen("title");
  }, [endSession]);

  // Title music.
  useEffect(() => {
    if (screen === "title") audio.playMusic("/audio/theme.mp3", 0.4);
  }, [screen, audio]);

  // Demo hotkeys: "]" skips ahead (next VN chapter, or next call beat).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.key !== "]") return;
      if (screen === "vn") chapterDone();
      if (screen === "call") skipBeat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, chapterDone, skipBeat]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black">
      {screen === "title" && (
        <div className="vn-stage" onClick={start}>
          <img src="/vn/start_screen.png" alt="" className="vn-layer object-cover" />
          <div className="vn-layer flex flex-col items-center justify-end gap-4 bg-gradient-to-t from-black/70 via-transparent to-transparent pb-[7%]">
            <div className="rounded-full bg-pink-500/90 px-4 py-1 text-[clamp(11px,1.2vw,15px)] font-bold tracking-[0.4em] text-white uppercase shadow-lg">
              ● Live
            </div>
            <div className="mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button className="vn-choice !w-56" onClick={start}>
                <span className="font-vn">はじめる</span>
                <span className="block text-xs text-zinc-600">Start</span>
              </button>
              <a className="vn-choice !w-56" href="/walk">
                <span className="font-vn">散歩する</span>
                <span className="block text-xs text-zinc-600">Walk the world</span>
              </a>
              <button className="vn-choice !w-56" onClick={() => setScreen("choose")}>
                <span className="font-vn">電話する</span>
                <span className="block text-xs text-zinc-600">Skip to the call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "vn" && (
        <VNPlayer
          chapter={CHAPTERS[chapter]}
          name={name}
          setName={rename}
          audio={audio}
          onDone={chapterDone}
        />
      )}

      {screen === "choose" && <ChoosePartner onPick={pick} />}

      {screen === "call" && heroine && (
        <CallScreen heroine={heroine} audio={audio} onExit={toTitle} />
      )}
    </main>
  );
}

// Chapter 2's partner menu, with the three heroines on stage.
function ChoosePartner({ onPick }: { onPick: (id: HeroineId) => void }) {
  const heroines: HeroineId[] = ["akari", "miyuki", "tsukiko"];
  return (
    <div className="vn-stage cursor-default">
      <img src="/bg/classroom_1.png" alt="" className="vn-layer object-cover" />
      <div className="vn-layer bg-black/35" />
      <div className="vn-layer flex flex-col items-center justify-center gap-[3%]">
        <div className="rounded-xl bg-black/60 px-5 py-2 text-center">
          <div className="font-vn text-[clamp(16px,2vw,26px)] text-white">誰がいいかな、ちょっと知ってる人なら…</div>
          <div className="text-[clamp(11px,1.2vw,15px)] text-pink-100/75">
            Who should I pick? Someone I know a little…
          </div>
        </div>
        <div className="flex h-[62%] items-end gap-[2%]">
          {heroines.map((id) => (
            <button key={id} className="choose-card" onClick={() => onPick(id)}>
              <img src={`/vn/${id}_neutral.png`} alt={CAST[id]!.en} className="h-full w-auto object-contain object-bottom" />
              <span className="choose-name" style={{ background: CAST[id]!.color }}>
                <span className="font-vn">{CAST[id]!.jp}</span> {CAST[id]!.en}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
