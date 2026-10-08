"use client";

/* eslint-disable @next/next/no-img-element -- full-bleed VN art, sized by CSS */

import { useCallback, useEffect, useRef, useState } from "react";
import { CAST, DEFAULT_NAME } from "./cast";
import type { Chapter, Node } from "./types";
import type { useAudio } from "./useAudio";

// Plays one chapter the way Ren'Py did: scene and music changes run through
// on their own, lines wait for a click (the first click finishes the
// typewriter, the second advances), menus splice the chosen option's nodes in
// after themselves, and a CG holds the screen until clicked.

type Audio = ReturnType<typeof useAudio>;
type LineNode = Extract<Node, { kind: "line" }>;

const TYPE_MS = 22;

export function VNPlayer({
  chapter,
  name,
  setName,
  audio,
  onDone,
}: {
  chapter: Chapter;
  name: string;
  setName: (name: string) => void;
  audio: Audio;
  onDone: () => void;
}) {
  const [queue, setQueue] = useState<Node[]>(chapter.nodes);
  const [index, setIndex] = useState(-1);
  const [bg, setBg] = useState<string | null>(null);
  const [cg, setCg] = useState<string | null>(null);
  const [sprite, setSprite] = useState<string | null>(null);
  const [line, setLine] = useState<LineNode | null>(null);
  const [typed, setTyped] = useState(0);
  const [waiting, setWaiting] = useState<Node | null>(null);
  const [showTitle, setShowTitle] = useState(true);
  const nameInput = useRef<HTMLInputElement>(null);

  const fill = useCallback((text: string) => text.replaceAll("{name}", name || DEFAULT_NAME), [name]);

  // New chapter: start over with its title card.
  useEffect(() => {
    setQueue(chapter.nodes);
    setIndex(-1);
    setShowTitle(true);
    setCg(null);
    setLine(null);
    const timer = setTimeout(() => {
      setShowTitle(false);
      setIndex(0);
    }, 1800);
    return () => clearTimeout(timer);
  }, [chapter]);

  // Run the node at `index`: automatic ones advance immediately, the rest
  // park in `waiting` until the player acts.
  useEffect(() => {
    if (index < 0) return;
    const node = queue[index];
    if (!node) {
      audio.playVoice(null);
      onDone();
      return;
    }
    switch (node.kind) {
      case "scene":
        setCg(null);
        setBg(node.bg);
        if (node.music !== undefined) audio.playMusic(node.music);
        if (node.sfx) audio.playSfx(node.sfx);
        setLine(null);
        setIndex((i) => i + 1);
        return;
      case "cg":
        setCg(node.image);
        setSprite(null);
        setLine(null);
        if (node.music !== undefined) audio.playMusic(node.music);
        if (node.sfx) audio.playSfx(node.sfx);
        setWaiting(node);
        return;
      case "line":
        setCg(null);
        if (node.sprite !== undefined) setSprite(node.sprite);
        setLine(node);
        setTyped(0);
        audio.playVoice(node.voice ?? null);
        setWaiting(node);
        return;
      case "card":
      case "name":
      case "menu":
        setLine(null);
        setWaiting(node);
        if (node.kind === "card") {
          const timer = setTimeout(() => {
            setWaiting(null);
            setIndex((i) => i + 1);
          }, 2200);
          return () => clearTimeout(timer);
        }
        return;
    }
  }, [index, queue, audio, onDone]);

  // Typewriter.
  const fullText = line ? fill(line.jp).length : 0;
  useEffect(() => {
    if (!line || typed >= fullText) return;
    const timer = setTimeout(() => setTyped((t) => t + 1), TYPE_MS);
    return () => clearTimeout(timer);
  }, [line, typed, fullText]);

  const advance = useCallback(() => {
    if (!waiting) return;
    if (waiting.kind === "line" && typed < fullText) {
      setTyped(fullText);
      return;
    }
    if (waiting.kind === "line" || waiting.kind === "cg") {
      setWaiting(null);
      setIndex((i) => i + 1);
    }
  }, [waiting, typed, fullText]);

  const choose = useCallback(
    (nodes: Node[]) => {
      setWaiting(null);
      setQueue((q) => [...q.slice(0, index + 1), ...nodes, ...q.slice(index + 1)]);
      setIndex((i) => i + 1);
    },
    [index],
  );

  // Space / Enter advance, like a desktop VN.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  useEffect(() => {
    if (waiting?.kind === "name") nameInput.current?.focus();
  }, [waiting]);

  const plate = line ? CAST[line.speaker] : null;

  return (
    <div className="vn-stage" onClick={advance}>
      {bg && <img key={bg} src={bg} alt="" className="vn-layer vn-fade object-cover" />}
      {!bg && <div className="vn-layer bg-black" />}
      {sprite && !cg && (
        <img key={sprite} src={sprite} alt="" className="vn-sprite vn-fade" />
      )}
      {cg && <img key={cg} src={cg} alt="" className="vn-layer vn-fade object-cover" />}

      {showTitle && (
        <div className="vn-layer vn-fade flex flex-col items-center justify-center gap-2 bg-black/85">
          <div className="font-vn text-4xl tracking-[0.3em] text-pink-200">{chapter.title.jp}</div>
          <div className="text-sm tracking-widest text-zinc-300 uppercase">{chapter.title.en}</div>
        </div>
      )}

      {waiting?.kind === "card" && (
        <div className="vn-layer vn-fade flex flex-col items-center justify-center gap-2 bg-black">
          <div className="font-vn text-3xl text-zinc-100">{waiting.text.jp}</div>
          <div className="text-sm text-zinc-400">{waiting.text.en}</div>
        </div>
      )}

      {line && (
        <div className="vn-textbox">
          {plate && (
            <div className="vn-plate" style={{ background: plate.color }}>
              {plate.jp}
              <span className="ml-2 text-[0.7em] font-normal opacity-80">{plate.en}</span>
            </div>
          )}
          <p className={`font-vn text-[clamp(16px,2.1vw,26px)] leading-snug ${line.speaker === "narrator" ? "italic text-zinc-200" : "text-white"}`}>
            {fill(line.jp).slice(0, typed)}
          </p>
          <p className={`mt-1 text-[clamp(12px,1.35vw,17px)] text-pink-100/75 transition-opacity ${typed >= fullText ? "opacity-100" : "opacity-0"}`}>
            {fill(line.en)}
          </p>
          {typed >= fullText && <span className="vn-next">▼</span>}
        </div>
      )}

      {waiting?.kind === "menu" && (
        <div className="vn-layer flex flex-col items-center justify-center gap-3 bg-black/30" onClick={(e) => e.stopPropagation()}>
          {waiting.prompt && (
            <div className="mb-2 rounded-lg bg-black/60 px-4 py-2 text-center">
              <div className="font-vn text-lg text-white">{fill(waiting.prompt.jp)}</div>
              <div className="text-xs text-pink-100/70">{fill(waiting.prompt.en)}</div>
            </div>
          )}
          {waiting.options.map((option, i) => (
            <button key={i} className="vn-choice" onClick={() => choose(option.nodes)}>
              <span className="font-vn text-[clamp(15px,1.8vw,22px)]">{fill(option.jp)}</span>
              <span className="block text-xs text-zinc-600">{fill(option.en)}</span>
            </button>
          ))}
        </div>
      )}

      {waiting?.kind === "name" && (
        <form
          className="vn-layer flex flex-col items-center justify-center gap-3 bg-black/50"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            const value = nameInput.current?.value.trim() || DEFAULT_NAME;
            setName(value);
            setWaiting(null);
            setIndex((i) => i + 1);
          }}
        >
          <div className="font-vn text-2xl text-white">{waiting.prompt.jp}</div>
          <div className="text-sm text-pink-100/70">{waiting.prompt.en}</div>
          <input
            ref={nameInput}
            id="player-name"
            maxLength={32}
            placeholder={DEFAULT_NAME}
            className="w-64 rounded-lg border border-pink-300/50 bg-black/60 px-4 py-2 text-center text-lg text-white outline-none focus:border-pink-300"
          />
          <button className="vn-choice !w-40">OK</button>
        </form>
      )}
    </div>
  );
}
