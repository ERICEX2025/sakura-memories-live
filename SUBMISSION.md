# Sakura Memories Live: submission kit

**Live:** https://sakura-memories-live.vercel.app (local: http://localhost:3000; debug console at /dev)
**Due:** 3:15 PM ET, through the Google Form.

## Form fields

- **Team name:** ERIC_EX (or your pick)
- **Teammates:** Eric Ko, ericko110702@gmail.com
- **One-line description:**
  > My 2023 anime visual novel, rebuilt so its hand-drawn heroines video-call you live: Reactor Vidu S2 avatars that see and hear you, with a Gemini director that scores every line and rewrites the story mid-call.
- **Demo link:** backup video URL (YouTube unlisted or Drive), plus the live URL above
- **Repo:** push to GitHub first, then paste the link (optional)
- **Social post link:** X or LinkedIn (worth +1 extra credit)

**Tracks:** Interactive Narrative is the primary fit. Best Avatar Use Case is the secondary fit.

## What uses Reactor (for the technical score)

**Vidu S2-Avatar commands:**
- `create_avatar` / `attach_avatar`: each heroine's original sprite is made into an avatar once and its ID cached, so later loads reattach instantly.
- `start_call` with `call_mode: "video"`: she sees your face, expression and room, and reacts to them.
- `update_call`: for every story beat, the Gemini director rewrites her persona mid-call. The persona has three parts:
  - IDENTITY: who she is
  - MEMORY: facts the player revealed
  - NOW: the scene goal and tactic
- `set_reference_images`: on each beat change, she is put in the scene's painted background (`kind: background`), and for Akari's mall date, her date outfit (`kind: garment`).
- `say`: choice buttons, typed input, and bracketed stage events such as `[Tatsumi-sensei glares from the doorway…]`.
- `interrupt`: cuts her off when Tatsumi-sensei walks in.
- `list_voices`, plus the transcript events that drive the director.

**Google AI Studio:**
- **Gemini 3.8 Flash** judges each exchange and returns:
  - affection change and reason
  - mood
  - whether the goal is met
  - 3 tone-tagged reply choices
  - memory facts
- **Gemini 3.8 Flash TTS voice design:** a designed voice for Tatsumi-sensei (speaking Japanese) and one for the narrator (speaking English). There are 20 pre-rendered lines.
- **Nano Banana Pro image editing** fixed the uncanny-avatar problem:
  - closed the heroines' mouths (the avatar model treats the source mouth as her resting face)
  - painted anime-style backgrounds in place of the photo ones
  - straightened Tsukiko's head
  - repainted every route scene from the original photos into anime background art

## 2-minute demo script

Pre-record the 0:00 clip of the original Ren'Py build.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:12 | Original 2023 Ren'Py game: static sprite, click-to-advance | "In 2023 I made a dating sim for my Japanese class. Three hand-drawn heroines who could only say what I wrote." |
| 0:12–0:25 | Title, then Chapter 1: Tatsumi speaks in his Gemini-designed voice. Press `]` to skip, then pick Akari. | "Today it's the same game, same art, same script, until you pick your partner…" |
| 0:25–0:35 | The phone rings and you click Answer. Akari picks up in the library. | "…and she picks up. A live Reactor avatar made from the original sprite. She can see me." |
| 0:35–1:05 | Two exchanges: tease her, then offer boba. Hearts and reasons pop. | "Nothing is scripted. A Gemini director scores every line against the goal from my original script." |
| 1:05–1:20 | Goal met. The scene changes to Tiger Sugar, her persona updates, and the background changes inside the avatar. | "Hit the goal and the director rewrites her persona and scene mid-call with update_call and set_reference_images." |
| 1:20–1:35 | Optional: stall on purpose in the library so Tatsumi slides in. | "Stall and the world pushes back." |
| 1:35–1:55 | Mall: she notices your outfit on camera, says "do we look like a couple? …just kidding". Ending card. | "A visual novel that actually hears you, sees you, and remembers." |
| 1:55–2:00 | Title card | "Sakura Memories Live. Thank you." |

**Demo controls:**
- `]` skips ahead: the next VN chapter, or the next call chapter if the director stalls.
- The text box and choice buttons work when the mic fails in a noisy room.

## Backup recording plan (do by 2:40)

1. Use a wired headset. Set browser zoom to 110–125% and turn on Do Not Disturb.
2. Record the screen with QuickTime (⌘⇧5, "Record Entire Screen", Options → your mic) so her audio and your voice are both captured.
   - QuickTime doesn't capture system audio. Either record with a tool like OBS or Loom, which can capture tab audio, or play her audio through your speakers next to the mic.
3. Take 1: the full flow at real speed, about 2.5 minutes. Take 2: the call only.
4. Trim to under 2:00, upload unlisted to YouTube or Loom, and paste the link into the form.
5. Save a copy on the desktop to play offline if the venue Wi-Fi fails.

## X post

> In 2023 I made an anime dating sim for my Japanese class. Today at the Reactor × Google DeepMind World Model Hackathon, the heroines call you back 📞🌸
>
> Same hand-drawn sprites, now live @reactor_inc Vidu S2 avatars that see & hear you, with a Gemini director rewriting the story mid-call.
>
> [clip]

Check Reactor's real X handle before posting.

## LinkedIn post

> Three years ago I built "Sakura Memories", a Ren'Py visual novel for my Japanese 400 class: three heroines, a strict sensei, every line hand-scripted.
>
> Today at the Reactor × Google DeepMind World Model Hackathon in NYC, I brought it back as Sakura Memories Live:
> • The scripted chapters still play like the original, with Tatsumi-sensei and the narrator in Gemini-designed TTS voices.
> • When you pick your partner, she video-calls you. Each heroine is a live Reactor Vidu S2 avatar built from the original sprite. She sees your face and reacts to it.
> • A Gemini 3.8 Flash director scores every exchange against goals from the original script. When you hit a goal, it rewrites her persona and scene mid-call (update_call + set_reference_images).
>
> The hardest part was making hand-drawn anime art look right on a photo-trained avatar model. Closed-mouth edits and painted backgrounds made by Nano Banana fixed most of the uncanny valley.
>
> Original art by Benson (jassbernil), costumes by Yeowon.
> #WorldModels #Gemini #GameDev #Hackathon
