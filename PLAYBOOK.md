# Sakura Memories Live: 3-hour playbook

Timebox: it is about 12:15 now. Feature freeze is **2:30 PM**. From 2:30 to 3:15 you record the backup video, submit and post.

---

## 1. Will the avatars look uncanny?

**Verdict:** this is a real risk, but you can manage it. Most of it comes from your current inputs, not from the anime style itself.

Reactor's docs only talk about photos of people. Nothing confirms or rules out anime input, and no outside tests exist ([overview](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar)). The researchers found three problems in your current images:

- **Akari's sprite has her mouth wide open, with teeth showing.** The model treats the source mouth as her resting state, so she will look stuck open or grow invented teeth. This is the most likely cause of uncanniness.
- **Each JPG puts a cel-shaded character on a blurred real-photo classroom.** Mixing realism levels in one frame makes things look worse. The Render-Me-Real study supports this, but it was cited from memory and not re-checked.
- **Tsukiko is off-centre and her head is tilted.** The docs ask for front-facing or three-quarter views ([prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)).

**First fixes, in order:**
1. **Close Akari's mouth** with Nano Banana (`gemini-3.1-flash-image` or `gemini-nano-banana-2.1`). Prompt: *"Edit only the mouth: closed gentle smile, keep exact line art, colors, hair, eyes, and style unchanged."* Use `aspect_ratio:"3:4"`.
2. **Re-centre and straighten Tsukiko**, either by cropping or with a "face camera, head upright" edit.
3. **Replace the photo backgrounds** with a flat pastel gradient or an anime-painted classroom. Show the real VN background in the web page around the video instead of baking it into the image.
4. **Use a mid-chest-up crop at 864x1152**, with the face taking about 35–45% of the width.
5. **Re-create the avatars and hard-code the three `avatar_id`s.** Avatars are kept for 90 days. At demo time call only `attach_avatar`, never `create_avatar`.
   - Never send a transparent PNG.
   - If you get `AVATAR_TIMEOUT`, retry once. The schema gives it no cause and `retryable` defaults to false ([schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema)).
   - Leave unset fields out. A field sent as `null` silently drops the whole command.
6. **A/B test** the old and new Akari in one call each. Pick whichever heroine looks best as the live demo heroine.

**Contradiction: line art or painterly?** The uncanny report guesses that clean thick line art holds up better. The Gemini report guesses a slightly painterly version tracks better on a photo-trained model. Both are unverified. Settle it with the A/B in step 6, and if the cel version looks bad, try option C below.

**If it still looks off, go down this list and stop when it looks good:**

| # | Option | Time | Notes |
|---|---|---|---|
| A | Fix the inputs (above) | 20 min | Biggest expected gain |
| B | Presentation layer (rung 2 of the build ladder) | 30 min | Do this whatever happens |
| C | **2.5D re-render.** Nano Banana prompt: "same character, semi-realistic 2.5D anime render (modern gacha 3D), same outfit/colors, closed neutral mouth, front-facing". Keep the original sprite as the textbox portrait. | 15 min + test | Closer to what the model was trained on |
| D | **Hybrid with a PNGTuber layer.** Vidu stays live for the heroine you are calling. Everyone else is the original sprite with 2–3 Nano Banana mouth frames, driven by the volume of Gemini TTS audio (Web Audio `AnalyserNode`: open fast, close slowly), plus a blink frame and a slight breathing scale. | 45 min | Never uncanny. Sources: [amplitude lip-sync](https://ftp6.gwdg.de/pub/linux/misc/gazette/181/brownss.html), [UPF](https://repositori.upf.edu/handle/10230/28139) |
| E | **"Anime Lens".** Run the avatar video through SANA-Streaming or Vidu S2-Editing `style_transfer` (details under stretch rungs) | 75–90 min | Only after a 10-minute smoke test passes |
| F | LTX | — | Not recommended: 640x352 landscape, $1.80/min, a scripted model and not a conversation ([LTX](https://docs.reactor.inc/model-api-reference/ltx)) |

**Contradiction: is Anime Lens the biggest fix?** The Reactor-surface report calls it the biggest fix. I disagree for today. It is the highest-scoring Reactor technique, but it is also the riskiest:
- Nobody knows whether lip movement survives the restyle.
- It adds about 1 s of latency, so you would need an audio delay.
- It uses a second session against your quota.

Do input fixes and framing first. Anime Lens is a stretch rung.

---

## 2. Build ladder

Each rung works as a demo on its own. Commit at the end of each rung so you can always demo the last good one.

### Rung 0: smoke tests and stability (12:15–12:30, 15 min)
- **Goal:** settle the unknowns before building on them.
- **What to do:**
  1. In `app/api/reactor/token/route.ts`, check `MAX_SESSIONS = 10`. Closed sessions still count toward it, so raise it or reset it. Switch heroines inside one session (`end_call` → `attach_avatar` → `start_call`) instead of reconnecting.
  2. **History test:** say "My favorite band is Radwimps", then `update_call` with a persona that has no MEMORY block, then ask "What's my favorite band?" This tells you whether a persona swap keeps the conversation.
  3. **Bracket test:** send `say("[The bell rings.]")` and check that she reacts to it as an event, not as something the player said.
  4. Call `list_voices` and pick a higher-pitched, anime-appropriate voice for each heroine.
- **Scores:** none directly, but it removes the risk under every rung below.
- **Account limits** ([rate-limits](https://docs.reactor.inc/resources/rate-limits)): 5 concurrent sessions, 10 new sessions per minute, at most 3 created back to back.

### Rung 1: input fix and pre-created avatars (12:30–12:50, 20 min)
- Work through section 1, steps 1–6.
- **Models:** Nano Banana for the edits, Vidu `create_avatar` once, then `attach_avatar` from then on.
- **Scores:** Presentation goes up a lot because the uncanny problem is the main thing to fix. Reactor technical: low.

### Rung 2: a phone call inside the VN (12:50–1:20, 30 min)
- **Goal:** make the video feed part of the story, and make the style look deliberate. *Whispers from the Star* did this with its "call across light-years" premise ([Notebookcheck](https://www.notebookcheck.net/Steam-launch-New-interactive-fiction-game-debuts-to-Very-Positive-reviews-may-divide-gamers-over-heavy-AI-integration.1087821.0.html)). Players criticize uncanny faces and robotic lip-sync before anything else (see the reviews of [Vaudeville](https://game8.co/articles/reviews/vaudeville-review) and [Covert Protocol](https://videogames.si.com/features/covert-protocol-hands-on)).
- **What to build:**
  - The real VN background fills the page.
  - The 864x1152 video sits in the middle inside a phone or LINE-style call frame: rounded corners, a status bar, an "Akari ● LIVE 00:42" pill, and a "connecting…" state that hides warm-up time.
  - A Ren'Py-style name plate and textbox cover the bottom third of the frame, showing the live transcript with a typewriter effect. This also hides hands and torso, where the video drifts most.
  - CSS on the `<video>`: `filter: saturate(1.15) contrast(1.05)`, a vignette, and a paper-grain overlay with `mix-blend-mode: multiply`. Add a sakura-petal layer on top.
  - **Optional, 15 min:** an "animate on twos" canvas at 12 fps using `requestVideoFrameCallback`. Check that lip-sync still reads before keeping it.
- **Scores:** Creativity goes up because "your 2023 heroine FaceTimes you" is a clear concept. Presentation goes up a lot.

### Rung 3: Director v2 with goals, meter, choices and fail states (1:20–1:55, 35 min)
- **Goal:** turn the open chat into a game. The pattern that works (*Suck Up!*, Façade, 1001 Nights) is a free-talking AI plus a hard authored goal plus a hidden meter.
- **What to build** (full spec in section 3):
  - A beat table with goals and turn limits.
  - Judge JSON that includes a `reason` and choice buttons.
  - A "+2 honest" heart popup.
  - A goal banner, for example "Get Akari to commit: 5 exchanges".
  - Choice buttons send `say(choice.text)`.
  - A fail state ("Akari hung up. Route lost." with a Retry button).
  - Detection of her exit line.
  - A hidden demo hotkey that forces the next beat.
- **APIs:** Gemini 3.8 Flash with `thinking_level:"low"` and structured output ([structured-output](https://ai.google.dev/gemini-api/docs/structured-output), [thinking](https://ai.google.dev/gemini-api/docs/thinking)); Vidu `update_call` and `say`.
- **Scores:** Creativity and Interactive Narrative go up a lot. Reactor technical goes up because you use `update_call` live.

### Rung 4: interrupts and Tatsumi-sensei (1:55–2:15, 20 min)
- **Goal:** pressure from another character, and a second AI surface.
- **What to build:**
  - If the player stalls or `beatTurn` reaches `maxTurns - 1`, the director sends `interrupt` and then `say("[Tatsumi-sensei glares from the doorway: 'Hoshino-san. Quiet.']")`.
  - At the same moment, Tatsumi's sprite slides in with a line spoken by `gemini-3.8-flash-tts` in a voice you design. Pre-render his 3–4 lines as WAV files ahead of time ([voice-design](https://ai.google.dev/gemini-api/docs/voice-design), [speech-generation](https://ai.google.dev/gemini-api/docs/speech-generation)).
  - Animate his mouth from the audio volume (the PNGTuber technique, option D).
- **Scores:** Creativity goes up. Presentation goes up because this is a visible "unscripted moment".

### Rung 5: in-model scene and gift changes (2:15–2:30, 15 min, only if deployed)
- **Goal:** the world model reacts to the story, not only the UI.
- **What to build:** on a beat change, `set_reference_images` with:
  - `kind:"object"`: a guitar pick for Akari, sheet music for Miyuki, a novel for Tsukiko, with `text` such as "She holds up the guitar pick, grinning."
  - optionally `kind:"garment"`: the date outfit at the mall.
- **Requirement:** the image URLs must be public, so deploy to Vercel or Blob storage first. `localhost` will not work.
- **Scores:** Reactor technical goes up a lot, because few teams will use this command.
- If you are not deployed by 2:15, skip this rung and spend the time rehearsing.

### Stretch rungs (only if you are ahead; skip otherwise)
- **Anime Lens:**
  1. Draw the avatar video onto a 1280x720 canvas.
  2. Publish `canvas.captureStream(25)` as `camera` with `contentHint="detail"`.
  3. Send it to SANA-Streaming ($0.10/min). Prompt: "2D anime cel-shading, flat colors, clean thick lineart, visual novel CG". Use `set_anchor_interval(4)`.
  4. Delay `main_audio` by about 1 s with a `DelayNode` so lips stay in sync.
  5. Add a raw/anime toggle.
  6. Add both models to the token's `models.match`.

  Do a 10-minute smoke test before committing ([sana schema](https://docs.reactor.inc/model-api-reference/sana-streaming/schema)).
- **Memory album:** call `requestClip(10)` at high-affection beats ([recordings](https://docs.reactor.inc/concepts/recordings)).
- **Webcam-aware heroine:** `call_mode:"video"`. This is risky in a noisy hall.
- **Ending CG:** render a still with Nano Banana, then animate it with Gemini Omni into a 5–8 s clip, all before the demo.
- **LingBot World 2 walk between scenes:** low priority.

### Freeze (2:30–3:15)
1. Record two backup takes, with the before/after cut first.
2. Write the submission text.
3. Post on social.
4. Set up the room: wired headset, browser zoom at 125%, Do Not Disturb on.

---

## 3. Director and persona upgrades

**Architecture:**
- The avatar always replies immediately.
- The judge runs without blocking anything, about 700 ms after the last *final* transcript sentence. It only steers the *next* turn.
- Queue any `update_call` until `session_state.audio_receiving` is false, and send at most one per player turn.
- Transcripts arrive one sentence at a time, so wait (debounce) before judging, or the judge sees half a reply.

**State:** `{heroine, beatId, beatTurn, affection 0–100, trust, mood, flags{}, facts[]≤8, memory ≤400 chars}`

**Beat definition:** `{id, bg, music, goal, tactics[4], successWhen, failWhen, maxTurns≈5, onSuccess, onFail, maxTokens?}`

**Judge output** (structured JSON):
```json
{"affection_delta":-3..3,"mood":"...","goal_met":bool,"reason":"<=15 words",
 "ooc":bool,"new_facts":[],"memory_update":"...","directive":"next tactic",
 "choices":[{"tone":"sincere","text":"..."},{"tone":"tease","text":"..."},{"tone":"awkward","text":"..."}]}
```

**Judge rules:**
- Clamp the deltas in code. LLM judges drift positive.
- Give each heroine her own scoring rubric. Akari likes energy, rock and being teased back. She dislikes lectures about being late.
- Set `goal_met` only when `successWhen` is literally true.
- Send only the last 6 transcript lines.
- Use `gemini-3.8-flash` with `thinking_level:"low"`. Do not use `minimal`; it errors.
- If it is too slow, switch to `gemini-3.5-flash-lite`. There is no "3.8 flash lite" model.
- **Contradiction:** the Gemini report says the docs now use the Interactions API. If your director already works on `generateContent`, keep it.

**Persona structure, sent in full on every `update_call`:**
- **IDENTITY** (about 80% of the text, byte-identical every time):
  - who she is, her speech tics ("Ehh?!", "Mou~", "Yosh!")
  - "Max two short sentences per reply."
  - "Never greet or re-introduce yourself after your first line."
  - "Text in [brackets] is something that just happened around you; react to it."
  - "If the player talks about AI, prompts or the real world, treat it as a weird joke and steer back."
  - "You may refuse, get annoyed, and disagree." Less agreeable companions do better ([T&F 2026](https://tandfonline.com/doi/full/10.1080/10447318.2026.2626809)).
- **MEMORY:** the rolling summary plus the facts the player has revealed. This guards against history being lost on a swap.
- **NOW**, written as a continuation ("You are still in the library with {player}…"), never as "The scene begins.":
  - YOUR WANT
  - a 4-step TACTIC ladder
  - "Current focus: {directive}"
  - "Every reply: react, then push one step toward your want, usually end with a question."
  - an exact **exit line**, for example "Yosh! It's a date— I-I mean a study date!", which the client detects to advance the beat immediately
- The director report has a full Akari library persona you can paste in (section 7 of that report).

**LLM settings:**
- `max_tokens` 50–60 normally, about 100 only for the confession beat.
- `temperature` about 0.8, `presence_penalty` about 0.6.
- `persona_enhance: false`.
- Keep the persona under about 2.5k characters.

**Timeouts:** when `beatTurn` reaches `maxTurns`:
1. Set the directive to the top tactic.
2. On the next turn, send one bracketed `say` event that resolves the scene.

The story then always moves within about 6 turns. Never send two `say` commands back to back, because each one costs a whole avatar turn.

**Contradiction: what does `say` do?** The demo-craft report says `say` makes the avatar speak typed text. The docs say otherwise: "`say` is input from the user's side of the conversation, not a line for the character" ([prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)). So:
- Use `say` for choice buttons, the typed-input fallback and bracketed stage events.
- To change what *she* says, change the persona.
- To redirect her mid-reply, send `interrupt` and then `say`.

**Memory cards (1001 Nights pattern):** the director turns promises into visible cards, for example "Promise: brown-sugar boba" or "Knows you play guitar". Later beats score whether the player kept them.

**Akari route:**
1. **Library:** goal is "commit to the project and the mall". Success gives a Study Buddy card.
2. **Tiger Sugar:** goal is "find out what she's nervous about". Success gives a Promise card.
3. **Mall:** goal is "make it a date without saying date". There are three endings: Confession, Bandmates, or Stood up.

---

## 4. Demo script, one-liner and social posts

**Contradiction: two presenters?** The demo-craft script assumes two people. You are solo, so drive with the choice buttons plus a headset mic, and narrate between turns. Pre-record the 0:00 "before" clip.

| Time | On screen | You say |
|---|---|---|
| 0:00–0:15 | Clip of the 2023 Ren'Py build: Akari's static sprite and click-to-advance text | "In 2023 I made a dating sim for my Japanese class. Three hand-drawn heroines who could only say what I wrote." |
| 0:15–0:25 | Hard cut to the same sprite inside the phone-call frame. Akari picks up. | "Today she picks up the phone. Same sprite, now a live avatar on Reactor's Vidu S2." |
| 0:25–1:00 | Goal banner. Two live exchanges: one sincere, one teasing. Hearts pop with reasons. | "Nothing is scripted. A Gemini director scores every line and picks her next tactic." |
| 1:00–1:15 | Stall on purpose, so Tatsumi-sensei interrupts with his TTS voice | "Stall, and the world pushes back." |
| 1:15–1:40 | Exit line, then `update_call` fires: the background changes to the mall, the music changes, a reference-image gift appears, and her tone shifts | "Hit the goal and the director rewrites her persona mid-call. Same face, the story moves." |
| 1:40–2:00 | Ending card or memory cards, then the title card with the stack and a QR code | "An old visual novel, now a live game. Thank you." Stop there. |

**Fallbacks during the demo:**
- If your voice is not picked up, use the choice buttons or the text box (both go through `say`). Do not comment on it.
- If the session dies, play the backup video from 0:25 and narrate over it.
- Start the session about 30 s before your slot. Billing runs from `ready` until you disconnect.

**One-liner:** *Sakura Memories Live: my 2023 anime visual novel, rebuilt so its hand-drawn heroines video-call you live as Reactor avatars while a Gemini director scores every line and rewrites the story mid-call.*

**X post:** check the handles first; they are unverified.
> In 2023 I made an anime dating sim for my Japanese class. Today at the @ReactorInc x @GoogleDeepMind World Model Hackathon, the heroines call you back. Same hand-drawn sprites, now live Vidu S2 avatars, with a Gemini director that scores your lines and rewrites her persona mid-call. [15s before/after clip]

**LinkedIn post:** use the demo-craft draft, adding the phone-call framing and the fix for the anime-on-a-photo-model problem: closed-mouth edits and stylized backgrounds instead of the transparent PNGs that failed with `AVATAR_TIMEOUT`.

**Tracks:**
- **Interactive Narrative** is the closest fit.
- **Best Avatar** is the second choice.
- In the submission, list the commands you used: `create_avatar`, `attach_avatar`, `start_call`, `update_call`, `say`, `interrupt`, `set_reference_images`.

---

## 5. Risks and unverified claims

**Risks:**
- Your token route's `MAX_SESSIONS = 10` cap counts closed sessions, so you can lock yourself out mid-demo.
- `update_call` sent mid-reply can split her tone inside one answer.
- The judge can lag a turn behind. Show the previous choices greyed out until the new ones arrive.
- Room noise: use a wired headset. Show the transcript on screen so judges see what the system heard.
- Reference images fail on `localhost`; they need public URLs.
- Billing runs between calls too ($0.42/min per Vidu session), so `end_call` and disconnect when you are done.

**Unverified:**
- Vidu officially supporting anime input. A search summary mentions "human, anime, or pet" on Vidu's own site, but the page was not found.
- The cause of `AVATAR_TIMEOUT`.
- Whether a persona swap keeps the conversation history (rung 0 test).
- Whether brackets are reliably treated as events (rung 0 test).
- Whether `language` accepts a mixed string like "English with Japanese phrases".
- Line art versus painterly input.
- The Render-Me-Real citation, and Versu, both from memory.
- Gemini voice design accepting `ja-JP`.
- Whether `generateContent` still works for 3.8 models.
- Real latencies for the judge, SANA and Omni.
- Whether SANA preserves lip movement.
- Reactor's X handle.
- Suck Up!'s timeline, and the recent mixed rating for Whispers from the Star.

**Not decided by the reports:**
- Push-to-talk versus server VAD. Muting the mic track is one untested way to do push-to-talk. Otherwise use `vad.silence_duration_ms` around 600 with `type:"semantic"`.