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
    narration: {
      type: "STRING",
      description:
        "Optional one-line visual-novel narration of her inner reaction, e.g. '(Akari's cheeks turn pink.)'. Empty string if nothing notable happened.",
    },
  },
  required: ["affection_delta", "mood", "goal_met", "narration"],
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
Current affection: ${body.affection}

Recent conversation (last line is newest):
${lines}

Judge only the PLAYER's most recent turn(s). Mark goal_met true only when the conversation has clearly achieved the goal. Be a fair but fun game master: kindness, humor and attentiveness raise affection; rudeness, laziness and ignoring her lower it.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
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
