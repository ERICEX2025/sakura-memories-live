# Demo-Craft Report: Sakura Memories Live

## 1. What the research turned up (and what it didn't)

- **No past Reactor hackathon winners are published anywhere I could find.** Reactor co-hosted "Inception" (Bengaluru, $1.5k prize pool, models LingBot, Helios and LongLive 2.0) and "Inception II" (Aug 22-23, 2026). Neither page lists judging criteria or winners ([luma.com/51ycy57g](https://luma.com/51ycy57g), [allai.events](https://allai.events/event/inception-world-model-hackathon-ii)). I also couldn't find a public page for today's Reactor x DeepMind NYC event. **Unverified:** Reactor's X/LinkedIn showcase posts, since reactor.inc came back empty when fetched.
- **Reactor's own framing** (use it in the copy): "developer platform for real-time generative video" / "real-time AI worlds". It came out of stealth May 28, 2026 with $59M led by Lightspeed ([kyodonewsprwire](https://kyodonewsprwire.jp/release/202605289947), [pulse2](https://pulse2.com/reactor-59-million-raised-to-build-platform-for-real-time-ai-worlds/amp/)).
- **What Google judges have praised before** (Gemini API Developer Competition, [Google Developers Blog](https://developers.googleblog.com/en/announcing-the-winners-of-the-gemini-api-developer-competition/)):
  - Outdraw AI won "Most Creative" for gameplay "only possible with AI".
  - Pen Apple won "Best Game" because Gemini generated content "with minimal development effort".
  - Everies brought everyday objects to life "in an innovative and fun way".
  - **What this means for us:** frame the game as *only possible with a realtime world model*, not as "a chatbot with a face".
- **Common demo advice** ([PostHog, 24 tips](https://newsletter.posthog.com/p/how-to-demo), [AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/), [Reskilll](https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/)):
  - Open with a hook and keep background to 1-2 sentences.
  - **Show before vs after.** Without a reference point the audience can't judge your result.
  - Pre-load or cache the slow parts so there's no dead air.
  - Zoom the browser to 125-150% and turn off notifications.
  - Bookmark the URL instead of typing it.
  - Have one person drive while the other narrates.
  - Record the backup video ahead of time, keep it stored offline, and narrate over it live if you need it.
  - Don't apologize, end with a clear closing line, and never go over time.
- **Audio in a loud room:** a laptop mic picks up room noise at about the same level as your voice. Use a wired headset mic about an inch from the corner of your mouth. Push-to-talk beats always-on VAD. Show the live transcript on screen so judges can see what the system heard ([AmiVoice](https://acp.amivoice.com/en/blog/2024_05_02/), [Sennheiser](https://newsroom.sennheiser.com/how-to-presentation-microphones-2-head-worn-and-lavalier-microphones)).
- **SDK facts that matter for staging** ([docs.reactor.inc vidu-s2-avatar](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar)):
  - `say {text}` makes the avatar speak typed text, which is a reliable fallback when voice input fails.
  - `interrupt` stops the avatar mid-sentence.
  - Avatars are saved for 90 days, so create all three ahead of time and `attach_avatar` at demo time instead of calling `create_avatar` live.
  - Billing runs from `ready` until disconnect, and calls end on an idle timeout of unstated length. Start the session about 30s before you go on.
  - The docs say nothing about support for anime-style input. That's a risk to state openly, not hide.

## 2. Turning the "uncanny" worry into the pitch

Don't hide it. Make the 2023-to-2026 jump the story. The VN heroines were frozen drawings with 4 expressions, and tonight they look back at you and answer. Things that help:

- **Frame the video.** Put the avatar inside the original VN UI (namebox, text box, background swap) so it reads as *the game came alive*, not as a deepfake.
- **Keep replies short.** `llm.max_tokens` at about 50 means less mouth motion on screen and quicker turns.
- **Lead with the strongest heroine.** Pick the sprite that animated best for the live segment.

## 3. Two-minute demo script

Two people: **A** narrates, **B** drives and speaks to the avatar wearing the headset.

| Time | On screen | What A says |
|---|---|---|
| 0:00-0:15 | Original 2023 Ren'Py VN: Akari sprite, static text box, click-to-advance | "In 2023 I made a dating sim for my Japanese class. Three heroines, hand-drawn, and they could only say what I wrote." |
| 0:15-0:25 | Hard cut: same art, same background, but Akari blinks, looks up and speaks her greeting | "Today they talk back. Same sprite, now a live avatar on Reactor's Vidu S2." |
| 0:25-1:05 | B talks to Akari live, aiming for one funny or rude line. The affection meter moves, the mood tag updates and the transcript is visible | "Nothing is scripted. Gemini 3.8 Flash runs as the director. It scores every exchange for affection, mood and whether the story goal was met." |
| 1:05-1:30 | Goal met → chapter beat fires: the background swaps (classroom → mall), `update_call` changes the persona live, and Akari's tone shifts | "When you hit a story beat, the director rewrites her persona mid-call, live. No reload. The world model keeps the same face while the story moves." |
| 1:30-1:45 | Quick switch to Miyuki or Tsukiko, plus one line from Tatsumi-sensei if it's ready | "Each heroine keeps her original personality, now one you can actually talk to." |
| 1:45-2:00 | Title card: "Sakura Memories Live", the stack (Reactor Vidu S2-Avatar + Gemini director), QR/URL | "An old visual novel turned into a live game. Thank you." Stop there. |

**If voice fails:** B types into a text box that sends `say`/LLM input. A keeps talking without comment. **If the session dies:** play the backup video from 0:25 and narrate over it.

## 4. One-liner (for the submission)

> **Sakura Memories Live: my 2023 anime visual novel, rebuilt so its hand-drawn heroines answer you live as Reactor avatars while a Gemini director scores every line and rewrites the story mid-call.**

Shorter: *"A 2023 anime dating sim whose heroines now talk back, live on Reactor with a Gemini director."*

## 5. Draft X post

> In 2023 I made an anime dating sim for my Japanese class. Today at the @ReactorInc x @GoogleDeepMind World Model Hackathon, the heroines talk back.
>
> Same hand-drawn sprites, now live realtime avatars (Vidu S2), with a Gemini 3.8 Flash "director" that scores your lines and rewrites the persona mid-call.
>
> [video] #WorldModels #Gemini

**Unverified:** the handles. Check Reactor's real X handle before posting. Attach a before/after split clip of 15s or less.

## 6. Draft LinkedIn post

> Three years ago I built "Sakura Memories", a Ren'Py visual novel for my Japanese 400 class: three heroines, a strict sensei, a group-project premise, every line hand-scripted.
>
> Today at the Reactor x Google DeepMind World Model Hackathon in NYC, we brought it back to life:
> • Each original sprite is a live, talking avatar on Reactor's Vidu S2-Avatar model
> • A Gemini 3.8 Flash "director" judges every exchange (affection, mood, story goals)
> • When you hit a story beat, it calls update_call to rewrite the character's persona mid-conversation and changes the scene
>
> The hardest part was making hand-drawn anime art work with a model built for photos (an AVATAR_TIMEOUT on transparent PNGs forced us to flatten the sprites onto the backgrounds).
>
> Thanks to Reactor and Google DeepMind for hosting. Demo video below.
> #WorldModels #GenerativeAI #Gemini #GameDev #Hackathon

## 7. Pre-demo checklist

**Next 2 hours**
- [ ] Choose the hero heroine (best animation) and a 3-turn path that reliably hits `goal_met`. Rehearse it 5 times.
- [ ] Pre-create all avatars and save their IDs, so demo time only needs `attach_avatar`.
- [ ] Add on-screen HUD elements: the live transcript, an affection meter, a "Chapter 2" banner when a beat fires, and the persona change visibly logged.
- [ ] Add a text-input fallback that sends typed lines.
- [ ] Add a demo-mode hotkey that forces the next beat in case the director stalls.
- [ ] Record the backup video by 2:30 PM (two takes), put the before/after cut first, and save it on the desktop and on a phone.

**Before going on stage**
- [ ] Wired headset mic, input device selected, test it in the room. Use push-to-talk or tight VAD.
- [ ] Laptop audio out to the venue system or a speaker. Confirm the avatar is audible from the back row.
- [ ] Browser at 125-150%, Do Not Disturb on, every other tab closed, demo URL bookmarked.
- [ ] Phone hotspot ready if the Wi-Fi drops. Charger plugged in.
- [ ] Start the session about 30s before your slot, and `end_call` afterward (billing keeps running until disconnect).
- [ ] The Ren'Py build (or a screenshot of it) is open in a second window for the 0:00 "before" shot.
- [ ] Timer running, closing line memorized.

**Submission**
- [ ] One-liner, repo link, video link, and the model and commands used (`create_avatar`, `start_call`, `update_call`, `say`, `interrupt`) listed for the "technical use" criterion.
- [ ] Track: **Interactive Narrative** is the closest fit, with Best Avatar as second choice if you can pick more than one.
- [ ] Post on X and LinkedIn for the extra credit, and include the post links in the submission.