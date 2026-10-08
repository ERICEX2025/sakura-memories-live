import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// "Sakura Memory": an anime event CG of the player and the heroine together at
// the route's final location, generated with Gemini image models.
export const maxDuration = 120;
export const runtime = "nodejs";

const MODELS = ["nano-banana-pro-preview", "gemini-3.1-flash-image"];
const HEROINES = new Set(["akari", "miyuki", "tsukiko"]);
const NAMES: Record<string, string> = { akari: "Akari", miyuki: "Miyuki", tsukiko: "Tsukiko" };

interface Body {
  heroine?: string;
  location?: string;
  /** Optional webcam frame, raw base64 or a data: URL. */
  player?: string | null;
  /** Optional ending text to colour the moment. */
  scene?: string;
}

const PUBLIC = path.join(process.cwd(), "public");

/** Read a /public file safely (no traversal, strip ?v= cache busters). */
async function readPublic(url: string): Promise<{ mime: string; data: string } | null> {
  const clean = url.split("?")[0]!;
  const full = path.normalize(path.join(PUBLIC, clean));
  if (!full.startsWith(PUBLIC + path.sep)) return null;
  try {
    const buf = await readFile(full);
    const mime = full.endsWith(".png") ? "image/png" : "image/jpeg";
    return { mime, data: buf.toString("base64") };
  } catch {
    return null;
  }
}

function prompt(name: string, hasPlayer: boolean, scene?: string): string {
  const player = hasPlayer
    ? "the player — redraw the real person from the third image (the webcam photo) as an anime character in the same art style, keeping their hairstyle, hair colour, glasses (if any) and clothes recognizable"
    : "the player, a college student, seen from behind or from the side so their face is not shown";
  return [
    `Draw a warm, nostalgic anime visual-novel event CG (a "memory" illustration) in the EXACT art style of the first image: same line art, cel shading, colour palette and character design for ${name}.`,
    `The scene: ${name} (the girl from the first image — keep her face, hair, eyes and outfit identical) and ${player}, together at the location shown in the second image (keep its landmarks and layout recognizable, repainted in the same anime background style).`,
    `A candid, happy moment that fits a good romance-route ending — close together, ${name} smiling warmly, like a cherished photo of a day you never want to forget.`,
    scene ? `Story context for the moment: "${scene}"` : "",
    "Soft golden light, gentle bloom, a few drifting cherry blossom petals. Full-color illustration, landscape composition.",
    "No text, no letters, no captions, no watermark, no UI, no speech bubbles. Exactly two people.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY_BACKUP;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const heroine = body.heroine ?? "";
  if (!HEROINES.has(heroine)) return NextResponse.json({ error: "unknown heroine" }, { status: 400 });

  const ref = await readPublic(`/characters/sakura/${heroine}_avatar.jpg`);
  if (!ref) return NextResponse.json({ error: "missing heroine reference" }, { status: 500 });
  const loc = body.location?.startsWith("/bg/painted/") ? await readPublic(body.location) : null;

  let player: { mime: string; data: string } | null = null;
  if (body.player) {
    const m = /^data:([^;]+);base64,(.*)$/.exec(body.player);
    player = m ? { mime: m[1]!, data: m[2]! } : { mime: "image/jpeg", data: body.player };
  }

  const parts: unknown[] = [{ text: prompt(NAMES[heroine]!, Boolean(player), body.scene?.slice(0, 600)) }];
  parts.push({ inline_data: { mime_type: ref.mime, data: ref.data } });
  if (loc) parts.push({ inline_data: { mime_type: loc.mime, data: loc.data } });
  if (player) parts.push({ inline_data: { mime_type: player.mime, data: player.data } });

  const payload = JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:3" } },
  });

  let lastError = "no image returned";
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: payload,
        },
      );
      if (!res.ok) {
        lastError = `${model}: ${res.status} ${(await res.text()).slice(0, 300)}`;
        continue;
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
      };
      const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (img?.data) {
        return NextResponse.json({ image: `data:${img.mimeType ?? "image/jpeg"};base64,${img.data}`, model });
      }
      lastError = `${model}: no image in response`;
    } catch (err) {
      lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  return NextResponse.json({ error: lastError }, { status: 502 });
}
