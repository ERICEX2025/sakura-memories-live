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
import { TATSUMI_INTERRUPTS } from "../game/chapters";
import { FAIL_AFFECTION, paintedOf, personaFor, ROUTES, startBeat, type Beat, type Route } from "./story";

// The story layer over the live call.
//
// After each reply from the heroine, the latest exchange goes to the Gemini
// director (/api/director), which moves her affection and says whether the
// current beat's goal is met. Meeting it advances the story: the live call
// gets the next scene's persona through `update_call`, and a stage direction
// tells her where she is now. Affection falling to FAIL_AFFECTION ends the
// route badly; clearing the last beat ends it well.

export type Mood = "happy" | "neutral" | "pout" | "surprise" | "embarrassed";
export type Ending = "good" | "bad" | "hungup" | null;

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
  /** Tatsumi-sensei's interruption, while it is on screen. */
  tatsumi: (typeof TATSUMI_INTERRUPTS)[number] | null;
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

// Reference images must be public URLs: on localhost, use the deployed copy.
const PUBLIC_ORIGIN = "https://sakura-memories-live.vercel.app";
function publicUrl(path: string): string {
  const local = typeof window === "undefined" || /^(localhost|127\.|\[::1\])/.test(window.location.hostname);
  return `${local ? PUBLIC_ORIGIN : window.location.origin}${path}`;
}

export function DirectorProvider({ children }: { children: ReactNode }) {
  const { photo, phase, status, transcript, cue, updatePersona, setScene, interrupt } = useSession();
  const character = CHARACTERS.find((c) => c.id === photo?.key) ?? null;
  const route = character ? (ROUTES[character.id] ?? null) : null;

  const [beatIndex, setBeatIndex] = useState(startBeat);
  const [affection, setAffection] = useState(0);
  const [mood, setMood] = useState<Mood>("neutral");
  const [aside, setAside] = useState<string | null>(null);
  const [ending, setEnding] = useState<Ending>(null);
  const [thinking, setThinking] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [turn, setTurn] = useState(0);
  const [tatsumi, setTatsumi] = useState<DirectorValue["tatsumi"]>(null);
  const interruptedRef = useRef(-1);

  // Read inside the async judge without re-creating it.
  const stateRef = useRef({ beatIndex, affection, ending, facts, turn });
  stateRef.current = { beatIndex, affection, ending, facts, turn };
  const judgedRef = useRef(0);
  const inflightRef = useRef(false);

  // A new call, or a new heroine, starts the route over.
  const heroineKey = photo?.key;
  useEffect(() => {
    if (phase !== "starting" && phase !== "avatar_ready" && heroineKey === undefined) return;
    setBeatIndex(Math.min(startBeat(), (route?.beats.length ?? 1) - 1));
    setAffection(0);
    setMood("neutral");
    setAside(null);
    setEnding(null);
    setChoices([]);
    setFacts([]);
    setTurn(0);
    interruptedRef.current = -1;
    judgedRef.current = 0;
  }, [phase === "starting" || phase === "avatar_ready", heroineKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Put her in the scene: its painted background and her outfit, through
  // set_reference_images on the live call.
  const applyScene = useCallback(
    (beat: Beat | undefined) => {
      if (!beat) return;
      const images: { url: string; id: string; kind: "background" | "garment"; text: string }[] = [
        {
          url: publicUrl(paintedOf(beat.background)),
          id: `scene-${beat.id}`,
          kind: "background" as const,
          text: beat.title.replace(/^Chapter \d+ · /, ""),
        },
      ];
      if (beat.outfit) {
        images.push({
          url: publicUrl(beat.outfit),
          id: `outfit-${beat.id}`,
          kind: "garment" as const,
          text: "Her date outfit",
        });
      }
      void setScene(images);
    },
    [setScene],
  );

  // She hangs up: Vidu ends the call (and the session) on a hostile message.
  // A call that drops soon after the player spoke is her hanging up on them.
  const lastSpokeRef = useRef(0);
  useEffect(() => {
    if (transcript[transcript.length - 1]?.speaker === "user") lastSpokeRef.current = Date.now();
  }, [transcript]);
  const wasActiveRef = useRef(false);
  useEffect(() => {
    const isActive = status === "ready" && (phase === "live" || phase === "warming_up" || phase === "starting");
    const dropped = wasActiveRef.current && !isActive && phase !== "ending" && phase !== "ended";
    if (dropped && !stateRef.current.ending && Date.now() - lastSpokeRef.current < 25_000) {
      setEnding("hungup");
      setChoices([]);
    }
    wasActiveRef.current = isActive;
  }, [phase, status]);

  const wasLiveRef = useRef(false);
  useEffect(() => {
    const isLive = phase === "live";
    if (isLive && !wasLiveRef.current && route) applyScene(route.beats[stateRef.current.beatIndex]);
    wasLiveRef.current = isLive;
  }, [phase, route, applyScene]);

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
        if (!verdict.goal_met || beat.walk) {
          // Stalling on campus: Tatsumi-sensei walks in.
          if (beat.school && played + 1 >= MAX_TURNS - 2 && interruptedRef.current !== index) {
            interruptedRef.current = index;
            const line = TATSUMI_INTERRUPTS[index % 3];
            setTatsumi(line);
            setTimeout(() => setTatsumi(null), 6000);
            interrupt();
            cue(`Tatsumi-sensei glares at you both from the doorway: "${line.en}"`);
          }
          return;
        }
        await advanceFrom(index, learned);
      } finally {
        inflightRef.current = false;
        setThinking(false);
      }
    },
    [character, route, cue, updatePersona, interrupt],
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
        applyScene(route.beats[following]);
        cue(route.beats[following].narration);
      } else {
        setEnding("good");
        cue("The day is coming to an end. Say a warm, slightly shy goodbye.");
      }
    },
    [character, route, cue, updatePersona, applyScene],
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
      tatsumi,
      skipBeat,
    }),
    [character, route, beatIndex, affection, mood, aside, ending, thinking, choices, facts, tatsumi, skipBeat],
  );

  return <DirectorContext.Provider value={value}>{children}</DirectorContext.Provider>;
}
