"use client";

import { useEffect, useRef, useState } from "react";
import { CAST } from "./cast";
import type { HeroineId } from "./types";

// "Sakura Memory": on a GOOD ending, snap the player's webcam while the call is
// still live, then have Gemini paint the two of them together as an event CG.

export type MemoryResult =
  | { status: "idle"; image: null }
  | { status: "loading"; image: null }
  | { status: "ready"; image: string }
  | { status: "error"; image: null };

/** Grab one frame of a MediaStream as a JPEG (null if no usable video). */
export async function captureFrame(stream: MediaStream | null): Promise<Blob | null> {
  if (!stream || stream.getVideoTracks().every((t) => t.readyState !== "live")) return null;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
    if (video.readyState < 2 || !video.videoWidth) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("timeout")), 3000);
        video.onloadeddata = () => {
          clearTimeout(t);
          resolve();
        };
      });
    }
    const scale = Math.min(1, 768 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  } finally {
    video.pause();
    video.srcObject = null;
  }
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Starts capture + generation the moment `ending` becomes "good". */
export function useMemoryCG(
  ending: string | null | undefined,
  heroine: HeroineId,
  location: string | undefined,
  webcam: MediaStream | null,
  scene?: string,
): MemoryResult {
  const [result, setResult] = useState<MemoryResult>({ status: "idle", image: null });
  const started = useRef(false);
  // Latest values, read once at trigger time without re-running the effect.
  const latest = useRef({ heroine, location, webcam, scene });
  latest.current = { heroine, location, webcam, scene };

  useEffect(() => {
    if (ending !== "good") {
      if (!ending) {
        started.current = false;
        setResult({ status: "idle", image: null });
      }
      return;
    }
    if (started.current) return;
    started.current = true;
    setResult({ status: "loading", image: null });
    const { heroine, location, webcam, scene } = latest.current;
    void (async () => {
      try {
        const frame = await captureFrame(webcam);
        const player = frame ? await toDataUrl(frame) : null;
        const res = await fetch("/api/memory", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ heroine, location, player, scene }),
        });
        const json = (await res.json()) as { image?: string };
        if (!res.ok || !json.image) throw new Error("no image");
        setResult({ status: "ready", image: json.image });
      } catch {
        setResult({ status: "error", image: null });
      }
    })();
  }, [ending]);

  return result;
}

export function MemoryCard({ result, heroine }: { result: MemoryResult; heroine: HeroineId }) {
  if (result.status === "idle" || result.status === "error") return null;
  const name = CAST[heroine]?.en ?? heroine;
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="memory-polaroid">
      {result.status === "loading" ? (
        <div className="memory-photo memory-shimmer">
          <span className="font-vn">Developing your memory… 📸</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="memory-photo" src={result.image} alt={`A memory with ${name}`} />
      )}
      <div className="memory-caption font-vn">
        <span>桜メモリー · {name}&apos;s route</span>
        <span className="memory-date">{date}</span>
      </div>
      {result.status === "ready" && (
        <a className="memory-save" href={result.image} download={`sakura-memory-${heroine}.jpg`}>
          Save
        </a>
      )}
    </div>
  );
}
