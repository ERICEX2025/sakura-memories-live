"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

// One looping music channel, one-shot sound effects, and one voice channel
// that a new line cuts off, like Ren'Py's music/sound/voice channels.
export function useAudio() {
  const music = useRef<HTMLAudioElement | null>(null);
  const musicSrc = useRef<string | null>(null);
  const voice = useRef<HTMLAudioElement | null>(null);

  const playMusic = useCallback((src: string | null, volume = 0.45) => {
    if (src === musicSrc.current) return;
    const previous = music.current;
    if (previous) fadeOut(previous);
    musicSrc.current = src;
    music.current = null;
    if (!src) return;
    const next = new Audio(src);
    next.loop = true;
    next.volume = 0;
    void next.play().catch(() => {
      // Autoplay blocked (e.g. the title screen before any click): start on
      // the first click or key press instead.
      const resume = () => {
        if (music.current === next) void next.play().catch(() => {});
      };
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
    });
    fadeTo(next, volume);
    music.current = next;
  }, []);

  const playSfx = useCallback((src: string, volume = 0.7) => {
    const sound = new Audio(src);
    sound.volume = volume;
    void sound.play().catch(() => {});
  }, []);

  const playVoice = useCallback((src: string | null) => {
    voice.current?.pause();
    voice.current = null;
    if (!src) return;
    const line = new Audio(src);
    line.volume = 1;
    void line.play().catch(() => {});
    voice.current = line;
  }, []);

  const duckMusic = useCallback((volume: number) => {
    if (music.current) fadeTo(music.current, volume);
  }, []);

  useEffect(
    () => () => {
      music.current?.pause();
      voice.current?.pause();
    },
    [],
  );

  return useMemo(
    () => ({ playMusic, playSfx, playVoice, duckMusic }),
    [playMusic, playSfx, playVoice, duckMusic],
  );
}

// One fade per element at a time: a newer fade cancels the older one.
const fades = new WeakMap<HTMLAudioElement, number>();

function fadeTo(audio: HTMLAudioElement, target: number, ms = 1200) {
  const start = audio.volume;
  const began = performance.now();
  const token = (fades.get(audio) ?? 0) + 1;
  fades.set(audio, token);
  const step = (now: number) => {
    if (fades.get(audio) !== token) return;
    const t = Math.min(1, (now - began) / ms);
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function fadeOut(audio: HTMLAudioElement) {
  fadeTo(audio, 0, 1500);
  setTimeout(() => audio.pause(), 1600);
}
