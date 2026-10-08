/* eslint-disable @next/next/no-img-element -- static showcase art, sized by CSS */
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import "./about.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About · Sakura Memories Live",
  description:
    "My 2023 visual novel about Brown University, rebuilt so its heroines video-call you live from inside living worlds of Providence.",
};

const GITHUB = "https://github.com/ERICEX2025/sakura-memories-live";

const HOW_TO_PLAY: { icon: string; text: React.ReactNode }[] = [
  { icon: "🎧", text: <>Put on <b>headphones</b>.</> },
  {
    icon: "🎙️",
    text: (
      <>
        Allow <b>mic + camera</b> so she can hear and see you. Or just type: the text box works too.
      </>
    ),
  },
  {
    icon: "📞",
    text: (
      <>
        <b>Skip to the call</b> on the title screen jumps straight to choosing a heroine.
      </>
    ),
  },
  {
    icon: "⌨️",
    text: (
      <>
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> / arrow keys explore every scene.
      </>
    ),
  },
  {
    icon: "⏭️",
    text: (
      <>
        <kbd>]</kbd> skips a chapter.
      </>
    ),
  },
  {
    icon: "🔁",
    text: <>If the world-model GPUs are busy, it retries automatically. Hang tight.</>,
  },
];

const PILLARS = [
  {
    accent: "#ff839a",
    role: "The heroine",
    model: "Reactor Vidu S2-Avatar",
    points: [
      "Built from her original hand-drawn sprite.",
      "Hears you and sees you through your camera, and stays in character.",
      "Sprite mode: hand-drawn keyframes lip-synced to her live Reactor voice. No uncanny valley.",
    ],
    cmds: [
      "create_avatar",
      "attach_avatar",
      "start_call (video)",
      "update_call",
      "set_reference_images",
      "say",
      "interrupt",
    ],
  },
  {
    accent: "#69a7f8",
    role: "The world",
    model: "Reactor LingBot World 2",
    points: [
      "Every chapter is a live world generated from the original game's real photos of Brown and Providence: the Rock, Tiger Sugar on Thayer, College Hill → State House → Providence Place, the SciLi, Steinert, the John Hay Library. All repainted as anime art.",
      "One persistent session re-anchors to each scene in ~4s.",
      "Conversation keywords (sunset, rain, night, petals, festival) reshape the world live.",
    ],
    cmds: ["setImage", "setPrompt", "setMove*", "setLook*"],
  },
  {
    accent: "#ffa73c",
    role: "The director + craft",
    model: "Google Gemini",
    points: [
      "Gemini 3.8 Flash judges every exchange (affection, mood, goal, choices) and drives both models.",
      "Gemini 3.8 TTS voice design for Tatsumi-sensei and the narrator.",
      "Nano Banana Pro for closed-mouth sprite frames, painted backgrounds, and the Sakura Memory ending polaroid.",
    ],
    cmds: ["3.8 Flash", "3.8 TTS", "Nano Banana Pro"],
  },
];

const PLACES = [
  { src: "/bg/painted/rock_room.jpg", cap: "The Rock" },
  { src: "/bg/painted/tiger_sugar.jpg", cap: "Tiger Sugar, Thayer St" },
  { src: "/bg/painted/way_to_mall_2.jpg", cap: "State House" },
  { src: "/bg/painted/mall_1.jpg", cap: "Providence Place" },
];

const HEROINES = [
  { src: "/characters/sakura/akari_avatar.jpg", name: "Akari", jp: "あかり", color: "#ff839a" },
  { src: "/characters/sakura/miyuki_avatar.jpg", name: "Miyuki", jp: "みゆき", color: "#ffa73c" },
  { src: "/characters/sakura/tsukiko_avatar.jpg", name: "Tsukiko", jp: "月子", color: "#69a7f8" },
];

export default function AboutPage() {
  const hasGif = fs.existsSync(path.join(process.cwd(), "public/about/walkthrough.gif"));

  return (
    <div className="about">
      {/* ── Hero ── */}
      <header className="about-hero">
        <img className="about-hero-bg" src="/vn/start_screen.png" alt="" />
        <div className="about-hero-shade" />
        <div className="about-wrap about-hero-inner">
          <p className="about-eyebrow">Reactor × Google DeepMind World Model Hackathon · NYC</p>
          <h1 className="about-title">
            <span className="about-title-jp">桜メモリー</span>
            <span className="about-title-en">
              Sakura Memories <em>Live</em>
            </span>
          </h1>
          <p className="about-lede">
            My 2023 visual novel about Brown University, rebuilt so its heroines video-call you
            live from inside living worlds of Providence.
          </p>
          <div className="about-ctas">
            <a className="btn btn-primary" href="/">
              ▶ Play
            </a>
            <a className="btn btn-ghost" href="/walk">
              🌸 Walk the world
            </a>
            <a className="btn btn-ghost" href={GITHUB} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Pitch ── */}
        <section className="about-wrap about-pitch">
          <p>
            Two Reactor models, one story: <span style={{ color: "#ff839a" }}>she lives in the avatar</span>,{" "}
            <span style={{ color: "#69a7f8" }}>the world lives in LingBot</span>, and{" "}
            <span style={{ color: "#ffa73c" }}>the conversation connects them</span>.
          </p>
        </section>

        {/* ── Heroines ── */}
        <section className="about-wrap">
          <div className="about-heroines">
            {HEROINES.map((h) => (
              <figure key={h.name} className="about-heroine" style={{ "--c": h.color } as React.CSSProperties}>
                <img src={h.src} alt={`${h.name}, avatar built from her original sprite`} loading="lazy" />
                <figcaption>
                  <span className="font-vn">{h.jp}</span> {h.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── How to play ── */}
        <section className="about-wrap about-section">
          <h2 className="about-h2">
            How to play <span>5 min</span>
          </h2>
          <ul className="about-steps">
            {HOW_TO_PLAY.map((s, i) => (
              <li key={i}>
                <span className="about-step-icon" aria-hidden="true">
                  {s.icon}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Walkthrough (optional) ── */}
        {hasGif && (
          <section className="about-wrap about-section">
            <div className="about-gif-card">
              <h2 className="about-h3">Walkthrough (sped up)</h2>
              <img src="/about/walkthrough.gif" alt="Sped-up walkthrough of Sakura Memories Live" />
            </div>
          </section>
        )}

        {/* ── How it works ── */}
        <section className="about-wrap about-section">
          <h2 className="about-h2">How it works</h2>
          <div className="about-pillars">
            {PILLARS.map((p, i) => (
              <article key={p.model} className="about-pillar" style={{ "--c": p.accent } as React.CSSProperties}>
                <div className="about-pillar-num">{i + 1}</div>
                <p className="about-pillar-role">{p.role}</p>
                <h3 className="about-pillar-model">{p.model}</h3>
                <ul>
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <div className="about-cmds">
                  {p.cmds.map((c) => (
                    <code key={c}>{c}</code>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="about-flow">
            <span style={{ color: "#ffa73c" }}>Gemini</span> listens to the call →{" "}
            rewrites <span style={{ color: "#ff839a" }}>her persona</span> mid-call →{" "}
            moves and repaints <span style={{ color: "#69a7f8" }}>the world</span>
          </p>
        </section>

        {/* ── Gallery ── */}
        <section className="about-section">
          <div className="about-wrap">
            <h2 className="about-h2">Real places, repainted</h2>
            <p className="about-sub">
              Painted from the original game&apos;s photos of Brown and Providence. Each one becomes a
              LingBot world you can walk around in.
            </p>
          </div>
          <div className="about-gallery">
            {PLACES.map((p) => (
              <figure key={p.src}>
                <img src={p.src} alt={p.cap} loading="lazy" />
                <figcaption>{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── Ending polaroid ── */}
        <section className="about-wrap about-section about-memory">
          <figure className="about-polaroid">
            <img src="/about/memory.jpg" alt="Polaroid-style ending CG of the player and Akari" loading="lazy" />
            <figcaption>A Sakura Memory, generated at the end of Akari&apos;s route</figcaption>
          </figure>
          <div className="about-memory-text">
            <h2 className="about-h2">The ending is a memory</h2>
            <p>
              On a good ending, a webcam frame of you and her sprite go to Nano Banana Pro, which
              draws a polaroid of the two of you at the place you just walked through together.
            </p>
            <a className="btn btn-primary" href="/">
              ▶ Make yours
            </a>
          </div>
        </section>
      </main>

      {/* ── Credits ── */}
      <footer className="about-footer">
        <div className="about-wrap">
          <p>
            Original{" "}
            <a href="https://eric-ex.itch.io/sakuramemories" target="_blank" rel="noreferrer">
              <i>Sakura Memories</i>
            </a>{" "}
            by ERIC_EX · Illustrations &amp; music by Benson (jassbernil) · Costume design by Yeowon
          </p>
          <p className="about-footer-dim">
            Built at the Reactor × Google DeepMind World Model Hackathon, NYC, Oct 8 2026 ·{" "}
            <a href={GITHUB} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
