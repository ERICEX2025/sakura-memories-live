# 桜メモリー Sakura Memories Live

My 2023 anime visual novel about Brown University in Providence, rebuilt so its hand-drawn heroines video-call you live from inside living worlds. Built at the Reactor × Google DeepMind World Model Hackathon (NYC, Oct 8 2026).

> **Two Reactor models, one story:** she lives in the avatar (Vidu S2-Avatar), the world lives in LingBot World 2, and the conversation connects them.

**Play:** https://sakura-memories-live.vercel.app · **Just the world model:** https://sakura-memories-live.vercel.app/walk

## What it is

- **The original game, intact.** Chapters 1–2 play as classic VN scenes from the original Ren'Py script, with its sprites, backgrounds, music and choices. The text is bilingual (Japanese and English). Tatsumi-sensei and the narrator speak in voices designed with Gemini TTS.
- **Then you pick a partner, and she calls you.** Each heroine is a live Reactor **Vidu S2-Avatar** built from her original sprite. She hears you, sees you through your camera, and stays in character.
- **A Gemini director runs the story.** After every exchange, Gemini 3.8 Flash scores affection, mood and the chapter goal (taken from the original script), and offers choice buttons. When you meet the goal, it rewrites her persona mid-call (`update_call`) and changes her scene and outfit (`set_reference_images`). Stall in class and Tatsumi-sensei walks in (`interrupt`). Be cruel and she hangs up.
- **Every scene is a living world.** Each chapter plays inside a **LingBot World 2** world generated from the original game's real photos of Brown and Providence, repainted as anime background art: the Rock, Tiger Sugar on Thayer, College Hill, Providence Place, the SciLi, Steinert, the John Hay Library. One world session lasts the whole route and re-anchors to each new location in about 4 seconds, while she stays on the call in a window beside it.
- **You walk the world yourself on Saturday.** You walk to Providence Place with WASD and the arrow keys while she chats with you.
- **The conversation shapes the world.** When either of you mentions the sunset, rain, night, the petals or a festival, a new `setPrompt` goes to LingBot and the scene changes live.
- **The ending is a Sakura Memory.** On a good ending, a webcam frame of you and her sprite go to Nano Banana, which draws a polaroid-style CG of the two of you at that place.
- **No uncanny valley.** In sprite mode she appears as hand-drawn keyframes (closed-mouth, open-mouth and blink frames made with Nano Banana from the original art), and her live Reactor voice drives the lip-sync. One click switches to Reactor's raw video.

## Stack

- Next.js
- `@reactor-models/vidu-s2-avatar` and `@reactor-models/lingbot-world-2` (`@reactor-team/js-sdk` 3)
- Gemini API: 3.8 Flash as the director, 3.8 Flash TTS for voice design, and Nano Banana Pro for image edits and painted backgrounds

## Run locally

```bash
cd app
cp .env.example .env.local   # REACTOR_API_KEY=rk_..., GEMINI_API_KEY=...
pnpm install && pnpm dev     # http://localhost:3000  (/dev = debug console, ?typed = no mic)
```

**Keys:** `]` skips to the next chapter.

## Credits

- Original *Sakura Memories* by ERIC_EX ([itch.io](https://eric-ex.itch.io/sakuramemories))
- Illustrations and music by Benson (jassbernil)
- Costume design by Yeowon
