# Reactor integration cheat-sheet for Sakura Memories Live

## TL;DR
- **Two models in one page works.** Each `new Reactor({modelName})` is its own session, and the SDK keeps no global state (I checked `@reactor-team/js-sdk` 3.0.2 `dist/index.js`: no globals, just `createContext(void 0)` per provider). Two things you must do:
  1. Add every model to the token's `authorization_details[].resources.models.match` in `app/api/reactor/token/route.ts`. The FAQ says one JWT can cover several models.
  2. Stay under the quota: **5 concurrent sessions per account**, **10 new sessions per minute**, and **no more than 3 created back to back** ([rate-limits](https://docs.reactor.inc/resources/rate-limits)).
- **The biggest fix for the uncanny look:** feed the avatar's `main_video` into SANA-Streaming or Vidu S2-Editing to restyle it as anime. Both models take a `camera` track, and the official SANA template already publishes a `<video>.captureStream()` track as `camera`.
- **Your token route has a session cap.** It sets `MAX_SESSIONS = 10`, and closed sessions still count against it. Switch heroines inside one session (`end_call` → `attach_avatar` → `start_call`) instead of reconnecting.

## Prices (live from https://api.reactor.inc/pricing, 10,000 credits = $1)
| Model slug | $/min | Billing |
|---|---|---|
| `reactor/vidu-s2-avatar` | 0.42 | Charged per session-minute from `ready`, **including time between calls** |
| `reactor/vidu-s2-editing` | 0.42 | Same |
| `reactor/sana-streaming` | 0.10 | Same |
| `reactor/lingbot-world-2` | 0.42 | Same |
| `reactor/ltx2` | 1.80 | Same |
| `reactor/fast-h3` | 2.10 | Same |

## Per-model cheat-sheet

### Vidu S2-Avatar: `reactor/vidu-s2-avatar` (`@reactor-models/vidu-s2-avatar`)
Docs: [schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema), [prompt-guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)

- **Tracks.** `mic` and `webcam` are send-only; `main_video` and `main_audio` (48 kHz mono) are receive-only. Declare all four, including `webcam` even for an audio call.
- **Phases.** `idle` → `preparing_avatar` → `avatar_ready` → `starting` → `warming_up` → `live` → `ending` → `ended` (or `failed`). Only enable controls when `phase==="live" && control_ready`.
- **One session, several heroines.** A session holds one avatar and one call at a time. `create_avatar` and `attach_avatar` are accepted whenever no call is active, so you can swap heroines without opening a new session. Avatars are kept for 90 days, so cache the three `avatar_id`s and `attach_avatar` them. That skips `preparing_avatar` during the demo.
- **`create_avatar` image rules.** PNG, JPG, WebP or HEIC, under 20 MB and 50 MP. The guide asks for one person, half or full body, face visible, front or three-quarter view, even light. It says nothing about anime art or transparency, so the cause of your `AVATAR_TIMEOUT` is **unverified**. Flattening onto a background (your JPG approach) fits the guide.
- **`start_call` fields:**
  - `persona` (max 50k characters, but the docs say short and specific works better)
  - `voice` (pick from `list_voices`; each entry has `.system[].voice`, `description` and `accent`)
  - `greeting` (max 200 characters; it is an *instruction*, e.g. "Wave and say ohayo")
  - `language` (free string, max 40 characters, default English; whether "English mixed with Japanese" works is **unverified**)
  - `call_mode` `audio|video` (fixed for the call; `video` forwards the player's webcam to the heroine)
  - `transcripts` (default true)
  - `persona_enhance` (default false; use it only for short personas, and leave it off for your hand-written ones)
  - `vad {type: server|semantic, threshold 0.5, silence_duration_ms 200–6000 (default 400)}`
  - `llm {max_tokens 50, temperature, top_p, top_k, frequency_penalty, presence_penalty, seed}`
- **Live commands:**
  - `say {text ≤2000}` is input *from the user's side*. It does not put words in the heroine's mouth. To change what she says, change the persona.
  - `interrupt {}` takes no text, so send `interrupt` and then `say` to redirect her.
  - `update_call` changes voice, persona, vad or llm. It is atomic, applies after the current sentence, and replies `call_updated.applied`.
  - `set_reference_images {images:[{image_url (public URL only, uploads not accepted), image_id, kind: object|garment|background, text ≤200}]}`. Up to 3 images. It does not interrupt speech and replies `reference_images_applied`. Use plain backgrounds for objects and garments.
  - `clear_reference_images {image_ids?}`.
- **Gotchas:**
  - A field sent as `null` silently drops the whole command, so leave optional fields out instead.
  - Reference image URLs must be publicly fetchable. **`localhost/public` will not work**, so deploy to Vercel or use a tunnel or Blob storage.
  - `transcript` events have `{speaker: user|character, text, final}`. Feed the final ones to the Gemini director.
  - `end_reason` values to handle: `content_policy`, `media_lost`, and the rest listed in the schema.

### Vidu S2-Editing: `reactor/vidu-s2-editing` (`@reactor-models/vidu-s2-editing` 0.3.0)
Docs: [schema](https://docs.reactor.inc/model-api-reference/vidu-s2-editing/schema)

- **Tracks.** `camera` in, `main_video` out at about 952×544 (7:4). No audio.
- **Commands.** `start_edit {reference_image | reference_image_url, editing_type}`, `switch_reference` (switch takes "a few seconds"), `end_edit`, `get_state`.
- **Edit types.** `style_transfer` (the default), `virtual_tryon`, `subject_replacement`, `background_replacement`. There is no text prompt; the reference image is the whole control.
- **Phases.** Same pattern as the avatar model. The session has an `edit_max_seconds` limit.
- **Use for us.** Pipe the avatar video in and run `style_transfer` with an original sprite or CG as the reference, so the output matches your art style. Or run `subject_replacement` on the *player's webcam* with the protagonist sprite, so the player appears in the VN as an anime character.

### SANA-Streaming: `reactor/sana-streaming` (`@reactor-models/sana-streaming` 2.2.1)
Docs: [schema](https://docs.reactor.inc/model-api-reference/sana-streaming/schema)

- **Tracks.** `camera` in (the only source), `main_video` out at 1280×704. It reads 24-frame chunks, so latency is about one chunk (around 1 s). A new prompt lands at the next chunk boundary, about a second later.
- **Commands.** `set_prompt`, `set_seed`, `set_anchor_interval` (re-grounds every N chunks to limit drift), `start`, `pause`, `resume`, `reset`.
- **Must do:** set `track.contentHint="detail"` before publishing. A resolution change in the middle of a chunk **crashes the session**.

### LTX: `reactor/ltx2` (`@reactor-models/ltx2` 5.0.2)
- **Output.** 640×352 at 24 fps with joint 48 kHz stereo audio. Takes run 4–300 s and are generated in 20 s windows that overlap.
- **Commands.** `set_avatar_image {avatar_image: FileRef}` (upload only), `set_script ≤10k`, `set_prompt ≤800` (scene and delivery), `set_wpm 80–220`, `set_duration_seconds`, `set_seed`, `start`, `pause`, `resume`, `stop`, `reset`. State arrives as `state_update` with `valid_commands`.
- **Verdict.** Scripted, not conversational, low resolution and expensive. Use it only for a pre-rendered "confession scene" take. It is a photoreal-portrait model, so anime fidelity is **unverified**.

### LingBot World 2: `reactor/lingbot-world-2`
- **Output.** No input tracks; `main_video` at 1664×960, 48 fps.
- **Commands.** `set_image` (FileRef, required), `set_prompt` (hot-swappable), `set_move_longitudinal` (forward/back), `set_move_lateral` (strafe), `set_look_horizontal`, `set_look_vertical`, `set_rotation_speed_deg`, `start`, `pause`, `resume`, `reset`.
- **Use for us.** A "walk to the date spot" interlude anchored on the VN backgrounds (mall, music room, library). The cookbook's [world-model-arcade](https://github.com/reactor-team/reactor-cookbook/tree/main/examples/world-model-arcade) example has the input and re-anchoring code.

### FastH3: `reactor/fast-h3`
- **Output.** 24 fps clips with joint audio, no input tracks.
- **Commands.** `enqueue {prompt, starting_frame, ending_frame, continue_from_clip_id, seconds}`, `play`, `set_autoplay`, `set_canvas` (16:9, 1:1, 9:16 or 4:3).
- **Use for us.** At $2.10/min, only for a cinematic opening or ending clip. Low priority.

## Running two models in one page
```ts
// route.ts
resources: { models: { match: ["reactor/vidu-s2-avatar","reactor/sana-streaming"] } }
// client: keep ViduS2AvatarProvider for the avatar; drive the second model with the base class
const fx = new Reactor({ modelName:"reactor/sana-streaming", modelTracks:[
  {name:"camera",kind:"video",direction:"sendonly"},{name:"main_video",kind:"video",direction:"recvonly"}]});
await fx.connect(jwt);
```
- Hooks bind to the **nearest** provider, so drive the second model through the base class or a sibling provider. Don't nest it inside the avatar provider.
- You can also adopt a running session from another device (for example a judge's phone as a spectator) with `connect({sessionId})` ([sessions](https://docs.reactor.inc/concepts/sessions#multiple-connections-per-session)).

## Ready-made code to borrow
The templates `create-reactor-app` scaffolds live at https://github.com/reactor-team/create-reactor-app/tree/main/templates:
- `vidu-s2-editing`: `ReferencePicker`, `SourcePicker`, `lib/edit.ts`
- `sana-streaming`: `VideoSource.tsx` uses `captureStream` + `contentHint`; also `WebcamSource`
- `ltx2`: `CropModal`, `TakePanel`
- `lingbot-world-2`
- Cookbook: https://github.com/reactor-team/reactor-cookbook

Your app already has `SnapClip.tsx`. Recordings work through `reactor.requestClip(N)` (default cap 5 min) and `requestRecording()` ([recordings](https://docs.reactor.inc/concepts/recordings)).

## Top 3 features for the "Technical use of the Reactor SDK" score

### 1. "Anime Lens": chain the avatar through a restyling model (about 75–90 min)
This tackles the uncanny worry directly and uses two models in sequence.
- Draw the classroom background and the avatar `<video>` onto a 1280×720 canvas.
- Publish `canvas.captureStream(25).getVideoTracks()[0]` as `camera`, with `contentHint="detail"`, to one of:
  - SANA with a prompt like "2D anime cel-shading, flat colors, clean thick lineart, soft pastel, visual novel CG", plus `set_anchor_interval(4)`; or
  - Vidu S2-Editing with `style_transfer` and an original CG as the reference.
- Delay `main_audio` by about 1 s with a Web Audio `DelayNode` to keep lip sync.
- Add a toggle so judges can flip between raw and anime.

Unverified: whether the output looks good, whether SANA keeps lip movement, and the exact end-to-end latency. Republishing the remote track directly may also work, but the canvas route is the safe one. Build a 10-minute smoke test first.

### 2. Director-driven `set_reference_images` with in-model scene and outfit changes (about 30–45 min)
- On a chapter beat, the Gemini director sends a `background` image (mall, music room, library) and a `garment` (school uniform → date outfit).
- Gifts become `object` images: sheet music for Miyuki, a novel for Tsukiko, a guitar pick for Akari. Add `text` like "She holds up the sheet music, blushing."
- Combine with `update_call {persona, llm:{temperature}}` for mood, and `interrupt` + `say` for Tatsumi-sensei cutting in.
- Images must be on public URLs (deploy first).

### 3. Webcam-aware heroine plus a memory album (about 30–40 min)
- Use `call_mode:"video"` and publish the webcam, so the heroine can react to the player ("you look tired, did you study?"). Pair it with `vad:{type:"semantic"}` for natural interruptions.
- At the end, use `requestClip(10)` at each high-affection beat to build a downloadable "Sakura Memories" album.
- Optional: a judge's phone joins through `sessionId`.

**Honorable mention:** a LingBot World 2 walk between chapters, anchored on a VN background (about 45–60 min).

## Not verified
- The real cause of the `AVATAR_TIMEOUT` and whether anime input is supported. The docs only describe photos of people.
- Whether Vidu S2-Avatar keeps anime styling in its output.
- How Vidu S2-Editing and SANA handle portrait 864×1152 input; the canvas compositor sidesteps this.
- Whether `language` accepts a mixed string like "English with Japanese phrases".
- Reported latencies: SANA about 1 s (documented), Vidu S2-Editing "a few seconds" for a switch. Neither was measured.

My downloaded doc copies are in `/private/tmp/claude-501/-Users-eko-dev-google-reactor-hackathon/fc7823c7-fca5-4f89-98cb-9b28302b246e/scratchpad/rdocs/`.