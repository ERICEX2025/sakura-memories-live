# Gemini API research report: tools for Sakura Memories Live (Oct 2026)

Every fact below was checked against ai.google.dev unless it is marked **[UNVERIFIED]**.

## 0. Key finding: the docs now use the Interactions API

Every current doc page uses **`POST https://generativelanguage.googleapis.com/v1beta/interactions`** with the header `x-goog-api-key`. None of them show `models/{m}:generateContent` examples ([text-generation](https://ai.google.dev/gemini-api/docs/text-generation)). The response shape is the same for text, audio, image and video: look in `steps[]` for the item with `type=="model_output"`, then read its `content[]` (`text`, or `data` as base64 plus `mime_type`). If your director already works on `generateContent`, leave it alone. Whether `generateContent` is still supported for 3.8 models is **[UNVERIFIED]**; no page said either way.

```ts
// lib/gemini.ts  (server-only)
const BASE = "https://generativelanguage.googleapis.com/v1beta";
export async function gem(path: string, body: unknown) {
  const r = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
export function lastOutput(j: any, type: "text" | "audio" | "image" | "video") {
  const items = (j.steps ?? []).filter((s: any) => s.type === "model_output")
    .flatMap((s: any) => s.content ?? []).filter((c: any) => c.type === type);
  return items.at(-1); // {text} or {data, mime_type}
}
```

## 1. TTS and voice design: Tatsumi-sensei and the narrator

- **Models:** `gemini-3.8-flash-tts` (supports voice design) and `gemini-3.8-flash-lite-tts`, which is faster. Both are stable and both list **Japanese** as supported. The language is detected automatically and there is no language field. The legacy `gemini-3.1-flash-tts-preview` and the 2.5 TTS models do **not** support voice design ([speech-generation](https://ai.google.dev/gemini-api/docs/speech-generation)).
- **Output:** unary requests return **WAV** (RIFF header, 24 kHz mono 16-bit), so the result can go straight into `<audio>`. Streaming requests return raw L16 PCM.
- **Voice design** ([voice-design](https://ai.google.dev/gemini-api/docs/voice-design)):
  - Call `POST /v1beta/voices` with `store:true`, `voice.type:"prompted"` and `voice.prompted.input` (the description).
  - It returns `id: "voice_..."` and `sample_audio {mime_type:"audio/wav", data}`.
  - Limits: 200 per project, with a 1-year TTL.
  - Put permanent traits (age, timbre, accent) in the description, in 1–2 sentences. Use the short `style` annotation per line for emotion.
  - Docs examples use only `en-US`/`en-GB`, so whether `language_code:"ja-JP"` is accepted is **[UNVERIFIED]**.
  - Pricing for voice design is not listed.
- **Inline tags** use angle brackets, for example `<sigh>`, `<short pause>`, `<cough>`.
- **Price:** about $0.00225 per 10 s of audio, with a free tier ([pricing](https://ai.google.dev/gemini-api/docs/pricing)).

```ts
// app/api/voice/route.ts — run ONCE per character, save the id to .env
export async function POST(req: Request) {
  const { name, description, gender = "male", language_code = "en-US" } = await req.json();
  const j = await gem("voices", { store: true, voice: {
    model: "gemini-3.8-flash-tts", type: "prompted", display_name: name, gender, language_code,
    prompted: { input: description } } });
  return Response.json({ id: j.id, sample: j.sample_audio?.data }); // sample = base64 wav
}
// Tatsumi: "A stern Japanese high-school teacher in his 50s, low gravelly baritone, clipped precise diction, speaks English with a light Japanese accent and drops Japanese phrases."
// Narrator: "A warm, nostalgic young woman narrating an anime visual novel, soft breathy mid pitch, gentle unhurried pacing."
```

```ts
// app/api/tts/route.ts
export async function POST(req: Request) {
  const { text, voice, style } = await req.json(); // voice = "voice_..." or "Kore"
  const j = await gem("interactions", {
    model: "gemini-3.8-flash-tts",
    input: [{ type: "user_input", content: [{ type: "text", text,
      ...(style && { annotations: [{ type: "speech_metadata", style }] }) }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice }] },
  });
  const a = lastOutput(j, "audio");
  return new Response(Buffer.from(a.data, "base64"), { headers: { "Content-Type": "audio/wav" } });
}
```

The docs say a `voice_...` id goes in the same `voice` field as the prebuilt names. The page does not show an example of that, but the [philschmid walkthrough](https://www.philschmid.de/gemini-3-8-tts) confirms it.

Using a Gemini voice inside Vidu `start_call` is **[UNVERIFIED]**: Vidu takes voices from its own `list_voices`. Use Gemini TTS for the characters that are not avatars, such as Tatsumi's classroom lines shown as a sprite with audio, and the narrator.

## 2. Image generation and editing in the original art style

Source for this section: [image-generation](https://ai.google.dev/gemini-api/docs/image-generation).

**Models:**

| Model id | Name | Notes |
|---|---|---|
| `gemini-nano-banana-2.1` | Nano Banana 2.1 | Recommended for new projects. About $0.034 per 1K image |
| `gemini-3.1-flash-image` | Nano Banana 2 | |
| `gemini-3-pro-image` | Nano Banana Pro | About $0.134 per image. The only model that takes **style reference images** (up to 3) |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | Weak at multiple references and multi-turn editing |

There is **no free tier for images**.

**Reference limits:**
- 2.1 and 2: up to 10 object images and **5 character references**.
- Pro: 6 object images and 3 style references, but no character references.
- Total across all images: 14.

**Output options:** `response_format:{type:"image", mime_type, aspect_ratio, image_size:"1K"|"2K"|"4K"}`. The K must be uppercase. **Use `aspect_ratio:"3:4"` to match Vidu's 864x1152 frame.** Other uses:
- `16:9` for backgrounds.
- Iterate on an image by passing `previous_interaction_id`.
- Write constraints into the prompt, for example "do not change anything else".

**How to use it here:**
- **New backgrounds:** use `gemini-3-pro-image` with 2–3 original BG JPGs as style references.
- **Ending CG:** use `gemini-nano-banana-2.1` with the heroine's sprite as a character reference plus a BG.
- **Outfit image for Vidu `set_reference_images(kind:"garment")`:** "isolate this school uniform as a flat product shot on white".

```ts
// app/api/image/route.ts
export async function POST(req: Request) {
  const { prompt, refs = [], model = "gemini-nano-banana-2.1", aspect_ratio = "3:4" } = await req.json();
  // refs: [{data: base64, mime_type: "image/png"}]
  const j = await gem("interactions", {
    model,
    input: [{ type: "text", text: prompt }, ...refs.map((r: any) => ({ type: "image", ...r }))],
    response_format: { type: "image", mime_type: "image/png", aspect_ratio, image_size: "1K" },
  });
  const img = lastOutput(j, "image");
  return Response.json({ dataUrl: `data:${img.mime_type};base64,${img.data}`, id: j.id });
}
```

Example prompt: "Match the exact hand-drawn 2023 anime visual-novel style of the reference images: flat cel shading, same line weight and palette. Draw the school rooftop at sunset with cherry blossoms, no characters."

**Possible fix for the uncanny look [UNVERIFIED; your call to test]:** generate a slightly more painterly, front-facing, mouth-closed, evenly lit "avatar-friendly" version of each sprite at 3:4 with Nano Banana 2.1, using the sprite as the character reference. Then send that to `create_avatar`. It may track better with a photoreal talking-head model than flat cel art.

## 3. Live and Omni

- **Live:** the model is `gemini-3.8-live`, which is stable, defaults to low latency and has no reasoning delay ([models](https://ai.google.dev/gemini-api/docs/models)).
  - Transport: WebSocket. Audio in is 16 kHz PCM16, audio out is 24 kHz.
  - It supports Japanese (`ja`) and switches language mid-conversation. It supports function calling.
  - Audio sessions last up to 15 min. Browsers should use ephemeral tokens ([live](https://ai.google.dev/gemini-api/docs/live), [live-guide](https://ai.google.dev/gemini-api/docs/live-guide)).
  - The docs do not give the WS URL or whether custom `voice_` ids work in Live **[UNVERIFIED]**.
  - Verdict: Vidu already handles the conversation, so this does not fit the 3-hour window. The one possible use is a Tatsumi "pop quiz" side character.
- **Omni:** `gemini-omni-1.1-flash` (the model card says stable; the models list says preview) does image-to-video with native audio, 3–10 s clips (extendable to 40 s), 16:9 or 9:16, 360p–4K ([omni](https://ai.google.dev/gemini-api/docs/omni.md.txt)).
  - It is synchronous unary: read `steps[] → content type:"video"` as base64 mp4.
  - **Use it to pre-render a 5–8 s animated ending CG** from the Nano Banana ending still before the demo. Generation time is undocumented, so do not call it live.

```ts
await gem("interactions", { model: "gemini-omni-1.1-flash",
  input: [{ type: "image", data: b64, mime_type: "image/png" },
          { type: "text", text: "Keep the 2D anime cel style exactly. Gentle camera push-in, sakura petals drifting, her hair sways, she smiles. No style change." }],
  generation_config: { video_config: { task: "image_to_video" } },
  response_format: { aspect_ratio: "16:9", resolution: "720p" } });
// then: Buffer.from(lastOutput(j,"video").data,"base64") -> public/ending.mp4
```

## 4. The per-turn judge (director)

- **No `gemini-3.8-flash-lite` model exists.** The Lite models available are `gemini-3.5-flash-lite` ($0.30 in / $2.50 out per 1M tokens) and `gemini-3.1-flash-lite` ($0.25 / $1.50). `gemini-3.8-flash` costs $0.75 / $3.75 ([pricing](https://ai.google.dev/gemini-api/docs/pricing)).
- **Thinking on `gemini-3.8-flash`:** only `low`, `medium` and `high` are allowed. The default is **medium**, and `minimal` returns an error ([thinking](https://ai.google.dev/gemini-api/docs/thinking), [3.8 flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)).
  - **Set `thinking_level:"low"`.** If the judge is still slow, switch to `gemini-3.5-flash-lite`.
  - The docs give no latency numbers **[UNVERIFIED]**. Time both models yourself.
  - Use `thinking_level` rather than `max_output_tokens` to cut latency; capping output tokens can truncate the JSON.
- **Structured output** ([structured-output](https://ai.google.dev/gemini-api/docs/structured-output)):
  - Use `response_format:{type:"text", mime_type:"application/json", schema}`.
  - Supported: `enum`, `minimum`/`maximum`, `required`, `additionalProperties`, and nullable type arrays.
  - Keep the schema flat and give each field a `description`.
  - Still validate and clamp the values in code.

```ts
// app/api/judge/route.ts
const schema = { type: "object", additionalProperties: false,
  required: ["affection_delta", "mood", "goal_met", "reason"],
  properties: {
    affection_delta: { type: "integer", minimum: -3, maximum: 3, description: "Change in heroine's affection from the player's last line" },
    mood: { type: "string", enum: ["happy", "shy", "annoyed", "sad", "excited", "neutral"] },
    goal_met: { type: "boolean", description: "Did the player satisfy the current beat goal?" },
    reason: { type: "string", description: "<=15 words" } } };
export async function POST(req: Request) {
  const { heroine, beatGoal, transcript } = await req.json();
  const j = await gem("interactions", {
    model: "gemini-3.8-flash",
    system_instruction: `You are the director of an anime dating sim. Judge ONLY the latest player turn for ${heroine}. Beat goal: ${beatGoal}`,
    input: transcript.slice(-6).map((t: any) => `${t.who}: ${t.text}`).join("\n"),
    generation_config: { thinking_level: "low" },
    response_format: { type: "text", mime_type: "application/json", schema },
  });
  const v = JSON.parse(lastOutput(j, "text").text);
  v.affection_delta = Math.max(-3, Math.min(3, v.affection_delta | 0));
  return Response.json(v);
}
```

Latency tips:
- Send only the last few turns.
- Run the judge without awaiting it, in parallel with the avatar's reply, so it never blocks Vidu.
- Precompute all backgrounds, CGs and TTS before the demo.

## Unverified items

- Whether `generateContent` is still supported for 3.8 models.
- Whether voice design accepts `ja-JP`.
- Whether a Gemini voice can be used in Vidu or Live.
- Real latency numbers for the judge models.
- Live WebSocket URL.
- How long Omni generation takes.
- Whether `response_format` for video is a single object, as in the snippet; the docs only show partial fragments.

Lyria (`lyria-3.5`, `lyria-3-clip-preview`) exists but was not researched. You already have the original music.