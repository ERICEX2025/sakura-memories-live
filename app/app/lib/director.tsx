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

interface Verdict {
  affection_delta: number;
  mood: Mood;
  goal_met: boolean;
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
}

const DirectorContext = createContext<DirectorValue | null>(null);

export function useDirector(): DirectorValue {
  const value = useContext(DirectorContext);
  if (!value) throw new Error("useDirector used outside DirectorProvider");
  return value;
}

// Enough context for the director to judge the latest turn.
const WINDOW = 10;

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

  // Read inside the async judge without re-creating it.
  const stateRef = useRef({ beatIndex, affection, ending });
  stateRef.current = { beatIndex, affection, ending };
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
    judgedRef.current = 0;
  }, [phase, photo?.key]);

  const judge = useCallback(
    async (lines: Line[]) => {
      if (!character || !route) return;
      const { beatIndex: index, affection: current, ending: ended } = stateRef.current;
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
            transcript: lines
              .filter((line) => line.speaker !== "narrator")
              .slice(-WINDOW),
          }),
        });
        if (!response.ok) return;
        const verdict = (await response.json()) as Verdict;
        const next = current + verdict.affection_delta;
        setAffection(next);
        setMood(verdict.mood);
        if (verdict.narration) setAside(verdict.narration);

        if (next <= FAIL_AFFECTION) {
          setEnding("bad");
          await updatePersona(
            `${character.persona}\n\nCURRENT SCENE: The player has disappointed you. You are hurt and want to leave. Politely but coolly wrap up the conversation.`,
          );
          cue(`${character.name} has had enough. ${route.badEnding}`);
          return;
        }
        if (!verdict.goal_met) return;

        const following = index + 1;
        if (following < route.beats.length) {
          setBeatIndex(following);
          setAside(null);
          await updatePersona(personaFor(character, following));
          cue(route.beats[following].narration);
        } else {
          setEnding("good");
          cue("The day is coming to an end. Say a warm, slightly shy goodbye.");
        }
      } finally {
        inflightRef.current = false;
        setThinking(false);
      }
    },
    [character, route, cue, updatePersona],
  );

  // Judge after each reply from her that follows something the player said.
  useEffect(() => {
    if (inflightRef.current || transcript.length <= judgedRef.current) return;
    const last = transcript[transcript.length - 1];
    if (last.speaker !== "character") return;
    const fresh = transcript.slice(judgedRef.current);
    if (!fresh.some((line) => line.speaker === "user")) return;
    judgedRef.current = transcript.length;
    void judge(transcript);
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
    }),
    [character, route, beatIndex, affection, mood, aside, ending, thinking],
  );

  return <DirectorContext.Provider value={value}>{children}</DirectorContext.Provider>;
}
