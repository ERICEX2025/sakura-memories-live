import { NextResponse } from "next/server";

// The Gemini director. It reads the latest exchange between the player and
// the heroine and judges it against the current story beat: how her
// affection moves, what mood she is in, and whether the beat's goal is met.
// The live avatar does the talking; this only decides where the story goes.

const MODEL = "gemini-3.8-flash";

interface DirectorRequest {
  heroine: string;
  beatTitle: string;
  situation: string;
  goal: string;
  affection: number;
  turn: number;
  maxTurns: number;
  facts: string[];
  transcript: { speaker: "user" | "character"; text: string }[];
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    affection_delta: {
      type: "INTEGER",
      description: "-3 (rude, dismissive) to +3 (genuinely touching). 0 for small talk.",
    },
    mood: {
      type: "STRING",
      enum: ["happy", "neutral", "pout", "surprise", "embarrassed"],
    },
    goal_met: { type: "BOOLEAN" },
    reason: { type: "STRING", description: "<= 12 words, shown to the player, e.g. 'She loves that you offered boba.'" },
    new_facts: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "0-2 short facts the player revealed or promised (e.g. 'promised brown-sugar boba'). Empty if none.",
    },
    choices: {
      type: "ARRAY",
      description: "Exactly 3 short things the PLAYER could say next (max 12 words each, first person, natural spoken English), each a different tone, at least one moving toward the goal.",
      items: {
        type: "OBJECT",
        properties: {
          tone: { type: "STRING", enum: ["sincere", "tease", "flirty", "awkward", "rude"] },
          text: { type: "STRING" },
        },
        required: ["tone", "text"],
      },
    },
    narration: {
      type: "STRING",
      description:
        "Optional one-line visual-novel narration of her inner reaction, e.g. '(Akari's cheeks turn pink.)'. Empty string if nothing notable happened.",
    },
  },
  required: ["affection_delta", "mood", "goal_met", "reason", "new_facts", "choices", "narration"],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY_BACKUP;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }
  const body = (await request.json()) as DirectorRequest;
  const lines = body.transcript
    .map((line) => `${line.speaker === "user" ? "PLAYER" : body.heroine.toUpperCase()}: ${line.text}`)
    .join("\n");

  const prompt = `You are the hidden director of a dating-sim visual novel, "Sakura Memories". The player is talking live with ${body.heroine}.

Scene: ${body.beatTitle}
Situation: ${body.situation}
Goal for this scene: ${body.goal}
Current affection: ${body.affection} (fails at -4)
Turn ${body.turn} of about ${body.maxTurns} for this scene.
Known facts: ${body.facts.join("; ") || "none"}

Recent conversation (last line is newest):
${lines}

Judge only the PLAYER's most recent turn(s). Mark goal_met true only when the conversation has clearly achieved the goal (if the turn limit is reached, be a little more lenient). Be a fair but fun game master with ${body.heroine}'s own taste: kindness, humor, playing along and attentiveness raise affection; rudeness, laziness, lecturing and ignoring her lower it. LLM judges drift positive: give 0 for plain small talk.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
        },
      }),
    },
  );
  if (!response.ok) {
    return NextResponse.json(
      { error: `Gemini ${response.status}: ${await response.text()}` },
      { status: 502 },
    );
  }
  const data = await response.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Empty director reply" }, { status: 502 });
  return NextResponse.json(JSON.parse(text));
}
