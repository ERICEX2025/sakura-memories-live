# 桜メモリー Sakura Memories Live

My 2023 anime visual novel, rebuilt so its hand-drawn heroines video-call you live. Built at the Reactor × Google DeepMind World Model Hackathon (NYC, Oct 8 2026).

**Play:** https://sakura-memories-live.vercel.app · **Just the world model:** https://sakura-memories-live.vercel.app/walk

## What it is

- **The original game, intact.** Chapters 1–2 play as classic VN scenes from the original Ren'Py script, with its sprites, backgrounds, music and choices. The text is bilingual (Japanese and English). Tatsumi-sensei and the narrator speak in voices designed with Gemini TTS.
- **Then you pick a partner, and she calls you.** Each heroine is a live Reactor **Vidu S2-Avatar** built from her original sprite. She hears you, sees you through your camera, and stays in character.
- **A Gemini director runs the story.** After every exchange, Gemini 3.8 Flash scores affection, mood and the chapter goal (taken from the original script), and offers choice buttons. When you meet the goal, it rewrites her persona mid-call (`update_call`) and changes her scene and outfit (`set_reference_images`). Stall in class and Tatsumi-sensei walks in (`interrupt`). Be cruel and she hangs up.
- **Saturday is a world model.** You walk to the mall together through a **LingBot World 2** world generated from the original street background, using WASD and the arrow keys. Akari walks beside you, live. Mentioning the sunset, rain or night reshapes the world (`setPrompt`).
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
