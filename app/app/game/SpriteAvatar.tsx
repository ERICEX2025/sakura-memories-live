"use client";

/* eslint-disable @next/next/no-img-element -- keyframes swapped every frame */

import { useEffect, useRef, useState } from "react";
import { useViduS2AvatarTrack } from "../lib/model";
import type { HeroineId } from "./types";

// The heroine as hand-drawn keyframes instead of generated video, the way a
// VN or a PNGTuber does it. Reactor still runs her: her voice arrives on the
// live `main_audio` track, and its loudness picks the mouth frame (closed,
// half, open), opening fast and closing slowly so speech reads as speech.
// She blinks every few seconds and breathes. Nothing here can go uncanny.

type Frame = "closed" | "half" | "open" | "blink";
const FRAMES: Frame[] = ["closed", "half", "open", "blink"];

// RMS thresholds on the voice, 0..1.
const HALF_AT = 0.018;
const OPEN_AT = 0.06;
const CLOSE_HOLD_MS = 90;

export function SpriteAvatar({
  heroine,
  background,
  className = "",
}: {
  heroine: HeroineId;
  /** The chapter's painted scene, shown behind her cut-out frames. */
  background?: string;
  className?: string;
}) {
  const voice = useViduS2AvatarTrack("main_audio");
  const [frame, setFrame] = useState<Frame>("closed");
  const [talking, setTalking] = useState(false);
  const mouthRef = useRef<Frame>("closed");
  const blinkingRef = useRef(false);

  // Mouth from voice loudness.
  useEffect(() => {
    if (!voice) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(new MediaStream([voice]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let lastOpen = 0;
    let raf = 0;
    const tick = (now: number) => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const rms = Math.sqrt(sum / samples.length);
      let mouth: Frame = rms > OPEN_AT ? "open" : rms > HALF_AT ? "half" : "closed";
      if (mouth !== "closed") lastOpen = now;
      else if (now - lastOpen < CLOSE_HOLD_MS) mouth = mouthRef.current === "open" ? "half" : mouthRef.current;
      if (mouth !== mouthRef.current) {
        mouthRef.current = mouth;
        if (!blinkingRef.current) setFrame(mouth);
      }
      setTalking(now - lastOpen < 400);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Autoplay rules may start the context suspended; the call began with a click.
    void context.resume().catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void context.close();
    };
  }, [voice]);

  // Blink every 2.5-5.5 s, only while the mouth is closed.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let step = 0;
    const schedule = () => {
      step += 1;
      timer = setTimeout(() => {
        if (mouthRef.current === "closed") {
          blinkingRef.current = true;
          setFrame("blink");
          setTimeout(() => {
            blinkingRef.current = false;
            setFrame(mouthRef.current);
          }, 130);
        }
        schedule();
      }, 2500 + ((step * 1733) % 3000));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`sprite-scene ${className}`}>
      {background && <img key={background} src={background} alt="" className="sprite-bg vn-fade" />}
      <div className={`sprite-avatar ${talking ? "is-talking" : ""}`}>
      {FRAMES.map((name) => (
        <img
          key={name}
          src={`/characters/sakura/frames/${heroine}_${name}.webp`}
          alt=""
          className={name === frame ? "opacity-100" : "opacity-0"}
          draggable={false}
        />
      ))}
      </div>
    </div>
  );
}
