"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CHARACTERS, type Character } from "./characters";
import { useSession, type Line } from "./session";
import { FAIL_AFFECTION, personaFor, ROUTES, type Beat, type Route } from "./story";

// The story layer over the live call.
//
// After each reply from the heroine, the latest exchange goes to the Gemini
// director (/api/director), which moves her affection and says whether the
// current beat's goal is met. Meeting it advances the story: the live call
// gets the next scene's persona through `update_call`, and a stage direction
// tells her where she is now. Affection falling to FAIL_AFFECTION ends the
// route badly; clearing the last beat ends it well.

export type Mood = "happy" | "neutral" | "pout" | "surprise" | "embarrassed";
export type Ending = "good" | "bad" | null;

export interface Choice {
  tone: string;
  text: string;
}

interface Verdict {
  affection_delta: number;
  mood: Mood;
  goal_met: boolean;
  reason: string;
  new_facts: string[];
  choices: Choice[];
  narration: string;
}

interface DirectorValue {
  character: Character | null;
  route: Route | null;
  beat: Beat | null;
  beatIndex: number;
  affection: number;
  mood: Mood;
  aside: string | null;
  ending: Ending;
  thinking: boolean;
  choices: Choice[];
  facts: string[];
  /** Demo control: jump to the next beat now. */
  skipBeat: () => void;
}

const DirectorContext = createContext<DirectorValue | null>(null);

export function useDirector(): DirectorValue {
  const value = useContext(DirectorContext);
  if (!value) throw new Error("useDirector used outside DirectorProvider");
  return value;
}

// Enough context for the director to judge the latest turn.
const WINDOW = 6;
// Player turns per beat before the director gets lenient.
const MAX_TURNS = 6;
// Wait for her reply to settle: transcripts arrive a sentence at a time.
const SETTLE_MS = 900;

export function DirectorProvider({ children }: { children: ReactNode }) {
  const { photo, phase, transcript, cue, updatePersona } = useSession();
  const character = CHARACTERS.find((c) => c.id === photo?.key) ?? null;
  const route = character ? (ROUTES[character.id] ?? null) : null;

  const [beatIndex, setBeatIndex] = useState(0);
  const [affection, setAffection] = useState(0);
  const [mood, setMood] = useState<Mood>("neutral");
  const [aside, setAside] = useState<string | null>(null);
  const [ending, setEnding] = useState<Ending>(null);
  const [thinking, setThinking] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [turn, setTurn] = useState(0);

  // Read inside the async judge without re-creating it.
  const stateRef = useRef({ beatIndex, affection, ending, facts, turn });
  stateRef.current = { beatIndex, affection, ending, facts, turn };
  const judgedRef = useRef(0);
  const inflightRef = useRef(false);

  // A new call, or a new heroine, starts the route over.
  useEffect(() => {
    if (phase !== "starting") return;
    setBeatIndex(0);
    setAffection(0);
    setMood("neutral");
    setAside(null);
    setEnding(null);
    setChoices([]);
    setFacts([]);
    setTurn(0);
    judgedRef.current = 0;
  }, [phase, photo?.key]);

  const judge = useCallback(
    async (lines: Line[]) => {
      if (!character || !route) return;
      const {
        beatIndex: index,
        affection: current,
        ending: ended,
        facts: known,
        turn: played,
      } = stateRef.current;
      const beat = route.beats[index];
      if (!beat || ended) return;
      inflightRef.current = true;
      setThinking(true);
      try {
        const response = await fetch("/api/director", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            heroine: character.name,
            beatTitle: beat.title,
            situation: beat.situation,
            goal: beat.goal,
            affection: current,
            turn: played + 1,
            maxTurns: MAX_TURNS,
            facts: known,
            transcript: lines
              .filter((line) => line.speaker !== "narrator")
              .slice(-WINDOW),
          }),
        });
        if (!response.ok) return;
        const verdict = (await response.json()) as Verdict;
        const delta = Math.max(-3, Math.min(3, Math.round(verdict.affection_delta)));
        const next = current + delta;
        const learned = [...known, ...(verdict.new_facts ?? [])].slice(-8);
        setAffection(next);
        setMood(verdict.mood);
        setFacts(learned);
        setTurn(played + 1);
        setChoices((verdict.choices ?? []).slice(0, 3));
        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        setAside(
          [delta !== 0 && verdict.reason ? `${sign} ♥ ${verdict.reason}` : null, verdict.narration || null]
            .filter(Boolean)
            .join("  ") || null,
        );

        if (next <= FAIL_AFFECTION) {
          setEnding("bad");
          setChoices([]);
          await updatePersona(
            `${personaFor(character, index, learned)}\n\nNOW: The player has disappointed you. You are hurt and want to leave. Politely but coolly say goodbye in one sentence.`,
          );
          cue(`${character.name} has had enough.`);
          return;
        }
        if (!verdict.goal_met) return;
        await advanceFrom(index, learned);
      } finally {
        inflightRef.current = false;
        setThinking(false);
      }
    },
    [character, route, cue, updatePersona],
  );

  const advanceFrom = useCallback(
    async (index: number, learned: string[]) => {
      if (!character || !route) return;
      const following = index + 1;
      setChoices([]);
      setTurn(0);
      if (following < route.beats.length) {
        setBeatIndex(following);
        await updatePersona(personaFor(character, following, learned));
        cue(route.beats[following].narration);
      } else {
        setEnding("good");
        cue("The day is coming to an end. Say a warm, slightly shy goodbye.");
      }
    },
    [character, route, cue, updatePersona],
  );

  const skipBeat = useCallback(() => {
    const { beatIndex: index, ending: ended, facts: known } = stateRef.current;
    if (!ended) void advanceFrom(index, known);
  }, [advanceFrom]);

  // Judge after each reply from her that follows something the player said,
  // once her reply has settled.
  useEffect(() => {
    if (inflightRef.current || transcript.length <= judgedRef.current) return;
    const last = transcript[transcript.length - 1];
    if (last.speaker !== "character") return;
    const fresh = transcript.slice(judgedRef.current);
    if (!fresh.some((line) => line.speaker === "user")) return;
    const timer = setTimeout(() => {
      judgedRef.current = transcript.length;
      void judge(transcript);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [transcript, judge, thinking]);

  const value = useMemo<DirectorValue>(
    () => ({
      character,
      route,
      beat: route?.beats[beatIndex] ?? null,
      beatIndex,
      affection,
      mood,
      aside,
      ending,
      thinking,
      choices,
      facts,
      skipBeat,
    }),
    [character, route, beatIndex, affection, mood, aside, ending, thinking, choices, facts, skipBeat],
  );

  return <DirectorContext.Provider value={value}>{children}</DirectorContext.Provider>;
}
