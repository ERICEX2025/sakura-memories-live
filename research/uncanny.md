# Track: making the anime avatars not look uncanny (Vidu S2-Avatar)

## Bottom line
Anime input is probably accepted, but Reactor's docs never confirm it and no outside tests exist. The things that most reduce uncanniness are a **mouth-closed source image**, an **anime-consistent background**, and **framing that makes the stylization look deliberate**. Build the cheap fallback (PNGTuber-style mouth flaps over the original sprites) in parallel. It is about 45 minutes of work and removes the demo risk.

## 0. What I found in the current inputs
I looked at `/Users/eko/dev/google-reactor-hackathon/app/public/characters/sakura/{akari,miyuki,tsukiko}_avatar.jpg`. All are 864x1152, which matches the output size.
- **Akari's mouth is wide open, with teeth and tongue showing.** `original/images/akari_neutral.png` is open-mouthed too. Talking-head models have to close a mouth that is open in the source. That gives a "stuck open" mouth or invented teeth, which is the most likely cause of uncanniness. Miyuki and Tsukiko have slightly parted lips, which is acceptable.
- **The backgrounds are blurred real-photo classrooms behind cel-shaded characters.** A realism mismatch inside one frame raises the uncanny effect (see section 1).
- **Tsukiko's face is off-centre (right third) and her head is tilted.** The docs ask for "front-facing or three-quarter". A tilt is a risk.
- Face width is about 30–40% of frame width, which is good for a half-body shot.

## 1. Input image properties (ranked by impact)
1. **Neutral or soft-smile expression with the mouth closed or barely parted.** Talking-head models treat the source mouth as the rest state. Fix Akari with gemini-3.1-flash-image / nano-banana-pro: *"Edit only the mouth: closed gentle smile, keep exact line art, colors, hair, eyes, and style unchanged."* About 10 minutes for all three. Hedra and similar guides ask for "clear, unobstructed faces with visible mouths" in front-facing shots ([Magic Hour Hedra guide](https://magichour.ai/blog/guide-to-hedra-ai), third-party).
2. **Match the background's realism to the character.** Replace the blurred photo with a flat or soft pastel gradient, or a strongly stylized background (Nano Banana: "anime-style painted classroom, soft focus"). Then put the real VN background in the web page behind or around the video frame instead of baking it into the avatar. The background is static in this class of model anyway ([Hedra notes via Magic Hour](https://magichour.ai/blog/guide-to-hedra-ai)). Rationale: the Render-Me-Real study (McDonnell et al., SIGGRAPH 2012) found that mixing realism levels causes the discomfort, not stylization itself. I did not re-fetch that paper this session.
3. **Front-facing, centred, upright head, one person, even light.** These are the only official image rules ([Vidu prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)). Re-centre and de-tilt Tsukiko, by crop or with a Nano Banana "face camera" edit.
4. **Bust framing (head and shoulders, face about 35–45% of width).** Docs allow "full-body or half-body" ([prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)). Tighter framing gives the model more face pixels, but also makes mouth artifacts larger. A crop from mid-chest up is the sweet spot.
5. **Clean, thick line art and flat cel shading are probably better than painterly rendering.** This is not verified. My reasoning: diffusion models smear fine detail when it moves, so bold outlines survive better. Upscale to at least 864 px wide before flattening. Your sprites are 800x1080, so a 1.08x upscale is fine.
6. **Format and limits:** PNG, JPG, WebP or HEIC, under 20 MB and at most 50 MP ([schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema)).

**AVATAR_TIMEOUT.** The schema gives it the same meaning as AVATAR_FAILED ("The image could not become an avatar"). It gives no time limit or cause, and `retryable` defaults to false ([schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema)). Practical rules:
- Never send transparent PNGs. Flatten them, as you already do.
- Retry the same image once. It may have been a capacity problem, but that is unverified.
- Save the `avatar_id` and reuse it with `attach_avatar` (avatars are kept 90 days), so you never create an avatar live on stage.
- Omit unset fields. "A command that carries an explicit `null` is dropped whole, without a `command_error`" ([schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema)).
- **Pre-create all three avatars now** and hard-code the IDs.

## 2. Is anime input known to work with Vidu?
- **Reactor docs:** they say "turns a photo of one person into a character" and describe only photos ([overview](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar)). There is nothing on stylized input either way.
- **Vendor and press:** a search summary says Vidu's own site lets users pick a "human, anime, or pet" image for S1/S2 characters. **I could not find that page directly**, so treat it as unverified. Neurohive's S2 write-up mentions anime only as an output style for S2-Editing ([Neurohive](https://neurohive.io/en/ai-apps/vidu-s2-the-model-generates-video-avatars-at-720p-and-25-42-fps-and-edits-streams-in-real-time/)). Weights are closed and there are no independent tests.
- **Comparable models:** Hedra Character-3 animates cartoons. Users say results are "surprisingly good" with rare glitches, but lip-sync is less natural than on photos ([Magic Hour](https://magichour.ai/blog/guide-to-hedra-ai)). I found no published anime evaluations for LivePortrait, Sonic, Hallo or EchoMimic. LivePortrait needed a separate fine-tune for animals and is keypoint-based ([arXiv 2407.03168](https://arxiv.org/abs/2407.03168)).
- **Verdict:** the fastest way to settle this is to test one fixed image yourself in about 5 minutes.

## 3. Presentation tricks that make the stylization look intentional (cheap, high impact)
1. **Phone or video-call frame.** Put the 864x1152 stream (3:4 portrait) inside a phone mockup: rounded corners, a status bar, a "Akari ● LIVE 00:42" pill, and the player's own webcam PiP in the corner. Viewers forgive artifacts in video calls. It also fits the Avatar track story: "your VN heroine FaceTimes you."
2. **VN textbox overlay.** Put a Ren'Py-style name plate and textbox under or over the bottom third, with a typewriter effect on the transcript. This hides the torso and hands, where diffusion drift is worst. Neurohive notes competitors drifting on hands and body ([Neurohive](https://neurohive.io/en/ai-apps/vidu-s2-the-model-generates-video-avatars-at-720p-and-25-42-fps-and-edits-streams-in-real-time/)).
3. **Real VN background outside the frame.** Use the CSS background-swap the director already does, with the video framed like a polaroid or window. The world stays fully anime and the avatar sits inside it.
4. **Subtle CSS stylization on the `<video>` to unify the look:** `filter: saturate(1.15) contrast(1.05)`, a soft vignette, and a light paper-grain or halftone overlay (`mix-blend-mode: multiply`). Add a sakura-petal particle layer on top. Avoid heavy blur, because it hides the line art.
5. **Lower perceived frame rate ("animating on twos", 12 fps).** Draw the video to a canvas every other frame to get the anime limited-animation look, which also masks diffusion shimmer. It is about 15 lines of code: `requestVideoFrameCallback` plus a frame counter. Test lip-sync perception after.
6. **Keep replies short.** Use `llm.max_tokens` around 50 (the default) and say in the persona "1–2 short sentences". Shorter shots mean less drift. The docs recommend brevity ([prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)).
7. **Set the voice to match the art.** Use a higher-pitched, anime-appropriate voice from `list_voices`. A voice that doesn't fit the character's look reads as uncanny even when the visuals are fine.
8. **Demo framing line:** "The original 2023 sprites are now alive." The before/after reveal turns stylization into the point of the demo.

## 4. Fallback ladder (try in order, stop when it looks good)
| # | Option | Effort | Notes |
|---|---|---|---|
| A | Fix inputs (section 1: closed mouth, stylized or flat background, centred) and re-create avatars | 20 min | Highest expected gain |
| B | Keep Vidu, add the presentation layer (section 3) | 30–45 min | Do this regardless |
| C | **2.5D version:** Nano Banana, "same character, semi-realistic 2.5D anime render (like a modern gacha 3D model), same outfit and colors, neutral closed mouth, front-facing" | 15 min + test | Closer to what the model was trained on. Costs some VN authenticity. Show the original sprite in the textbox portrait. |
| D | **PNGTuber or Live2D-lite in the browser:** the original sprites plus 2–3 Nano-Banana-edited mouth frames (closed, half, open). Drive them by RMS of the TTS audio through a Web Audio `AnalyserNode` with hysteresis (fast open, slow close). Add an idle blink frame and a sine-wave breathing scale (1.0→1.01). Use gemini-3.8-flash-tts for the voice. | about 45 min | Never uncanny, and on-style for a VN. It is well-established technique ([amplitude lip-sync overview](https://ftp6.gwdg.de/pub/linux/misc/gazette/181/brownss.html), [UPF web lip-sync paper](https://repositori.upf.edu/handle/10230/28139)). Loses Reactor "technical" points, so use it for the non-hero characters (Tatsumi-sensei) or as an "offline mode". |
| E | Reactor **LTX** (photo + script, joint audio and video) | 30 min | 640x352 landscape at 24 fps ([LTX docs](https://docs.reactor.inc/model-api-reference/ltx)). Lower resolution, wrong aspect ratio, no anime guidance. Weak fallback. |

**Hybrid that scores well on judging:** Vidu live avatar for the heroine you're calling (the Reactor showcase), PNGTuber sprites for everyone else, all inside the VN UI.

## Do now (priority order)
1. Nano Banana: close Akari's mouth, and re-centre and de-tilt Tsukiko.
2. Re-flatten all three onto a stylized or flat background, create the avatars, and hard-code the `avatar_id`s.
3. Build the phone-call frame, textbox and CSS grade.
4. Optional: the 12 fps canvas.
5. Build the PNGTuber fallback for Tatsumi-sensei.

## Not verified
- That Vidu officially supports anime input.
- The cause of AVATAR_TIMEOUT.
- My claim that line art beats painterly rendering.
- The Render-Me-Real citation (from memory).

Local image working copies are in `/private/tmp/claude-501/-Users-eko-dev-google-reactor-hackathon/fc7823c7-fca5-4f89-98cb-9b28302b246e/scratchpad/u/`.