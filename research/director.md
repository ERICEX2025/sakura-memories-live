# Director design for Sakura Memories Live: drama management with a black-box avatar LLM

## 1. Verified facts that shape the design

From the Vidu S2-Avatar schema and prompt guide ([schema](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/schema), [prompt-guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)):

- **`say` is input from the user's side.** The guide says: "`say` is input from the user's side of the conversation, not a line for the character… To change what the character says or how it behaves, change the persona with `update_call`." It takes 1–2000 chars, and the character *answers* the text.
- **A persona sent with `update_call` "replaces the current one after the current sentence."** A `vad`/`llm` change applies on the next turn. Voice changes after the current sentence. All fields in one call apply together or none do. The reply is `call_updated` with an `applied` list.
- **`interrupt`** takes no text. The docs say to redirect with `interrupt` then `say`.
- **`transcript` messages arrive once per finished sentence**, with fields `{speaker: user|character, text, final}`. There is no speaking-start or speaking-end event. Use `session_state.audio_receiving` plus a quiet gap after the last transcript to detect the end of a turn.
- **`llm` settings:** `max_tokens` (default 50), `temperature` (<2), `top_p`, `presence_penalty`, `frequency_penalty`, `seed`.
- **The prompt guide prefers short, specific personas** covering identity, manner, length and limits.
- **UNVERIFIED: whether a persona swap keeps the conversation history.** The docs say nothing about it. Test it now (see §6). The design below works either way.

## 2. What to borrow from the literature

- **Façade's beats.** The story is broken into *beats*. Each has preconditions, effects and a goal, plus "mix-in" reactions for off-topic input. A drama manager picks the next beat from a pool to follow a tension arc ([Mateas & Stern 2003](https://users.soe.ucsc.edu/~michaelm/tenurereview/publications/mateas-tidse2003.pdf), [AIIDE 2005](https://cdn.aaai.org/AIIDE/2005/AIIDE05-016.pdf), [CMU-CS-02-206](https://www.cp.eng.chula.ac.th/~vishnu/gameResearch/story_november_2005/CMU-CS-02-206.pdf)). Our chapter beats map onto this directly.
- **Storylets / quality-based narrative.** Small atomic units, each with content, prerequisites (on numeric "qualities") and effects ([Short 2016](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/), [Kreminski](https://emshort.blog/2019/01/06/kreminski-on-storylets/), [Yarn Spinner primer](https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/storylets-and-saliency-a-primer)). Use these for optional side beats unlocked by affection.
- **LLM directors.** Director/actor splits ([ProTriPlay](https://link.springer.com/10.1007/s40747-025-02173-4)), the "Narrative Chain" (consecutive segments that the player bends but cannot skip) ([Wu et al. ACL 2024](https://arxiv.org/html/2405.14231v1)), and Plot-based Reflection to match player intent ([Wu et al. 2025](https://arxiv.org/html/2502.17878v2)). [Drama Llama](https://alphaxiv.org/abs/2501.09099) writes storylet triggers in natural language, which is exactly what our Gemini judge evaluates. [Dramamancer](https://arxiv.org/html/2601.18785v1) covers timing and responsiveness.
- **Versu** (Evans & Short): characters with their own desires inside "social practices." I'm citing this from memory and did not re-check the URL. The useful takeaway is to give the heroine a *want*, not a script.

## 3. Architecture (asynchronous, judge off the critical path)

```
mic/choice → avatar LLM replies on its own (~1s)      ← fast path, never blocked
             ↓ transcripts (debounced ~700ms after last final sentence)
          Gemini director (structured JSON, thinking off/low) ~3-5s
             ↓ applies to the NEXT turn
          update_call(persona NOW-block, llm)  |  say(stage event)  |  UI (heart, bg, music, choices)
```

The avatar always answers immediately. The director only steers the *next* turn, so its 3–5 s is hidden behind the player reading or thinking. Never call `update_call` while the heroine is mid-reply. Queue the update and fire it when `audio_receiving` goes false.

## 4. State schema (hidden, client-side)

```ts
type DirectorState = {
  heroine: "akari"|"miyuki"|"tsukiko";
  chapter: number; beatId: string; beatTurn: number;      // turns spent in beat
  affection: number;      // 0-100, shown as hearts
  trust: number;          // hidden 0-100, gates confession beat
  mood: "playful"|"flustered"|"annoyed"|"sad"|"warm";
  flags: Record<string, boolean>;   // e.g. promised_mall_trip, knows_she_was_late
  facts: string[];        // player-revealed facts (name, hobbies) ≤8, fed back into persona
  memory: string;         // ≤400-char rolling summary of what has happened
  lastDirective?: string;
};
type Beat = { id; bg; music; goal: string; tactics: string[]; // escalating ladder
  successWhen: string; failWhen?: string; maxTurns: number;
  onSuccess: string; onFail: string; maxTokens?: number };
```

**Judge output** uses Gemini `responseSchema` / JSON mode ([docs](https://ai.google.dev/gemini-api/docs/structured-output)):

```json
{"affection_delta": -3..3, "trust_delta": -2..2, "mood": "...",
 "goal_progress": 0-1, "goal_met": bool, "ooc": bool,
 "new_facts": ["..."], "memory_update": "...",
 "directive": "one sentence: what she should try next turn",
 "event": null | "[A librarian shushes you both.]",
 "choices": [{"tone":"sincere","text":"..."},{"tone":"tease","text":"..."},{"tone":"awkward","text":"..."}]}
```

- **Clamp deltas in code** and require a one-word `reason` field. That curbs judge inflation (LLM judges drift positive) and makes a "+2 💗 honest" popup for the demo.
- **Judge prompt template:** system = rubric (what earns or loses affection for *this* heroine: Akari likes energy, rock, being teased back; dislikes lectures about lateness) + current beat (goal, successWhen, failWhen, tactics, beatTurn/maxTurns) + state. User = last 6 transcript lines. Instruction: "Judge only the latest exchange. goal_met only if successWhen is literally satisfied. directive must pick the next unused tactic."

## 5. Steering the black box

**`update_call(persona)`** is for anything that changes *how she behaves*: a beat change, a new directive, a mood change, fixing an out-of-character slip. To avoid a jarring reset:

1. Build the persona in three parts. The **IDENTITY** block (who she is, voice, speech tics, hard limits) is ~80% of the text and byte-identical every time. The **MEMORY** block holds the summary and facts. The **NOW** block holds the scene, goal and current tactic. Only MEMORY and NOW change.
2. Write NOW as a continuation: "You are still in the library with {player}. You just {memory tail}." Never write "The scene begins." If history *is* wiped, MEMORY rebuilds it. If it isn't, the continuation wording keeps her from re-greeting.
3. Add the rule "Never greet or re-introduce yourself after the first line."
4. Change the persona at most once per player turn, and only at a turn boundary.

**`say`** is for *world events* and *choice-menu clicks*:

- Choice buttons go through `say(choice.text)`. This is exactly what `say` is (user-side input), and it makes the demo robust even when the mic is noisy.
- For stage events, add one rule to IDENTITY: "Text in [square brackets] is something that just happened around you, not words from {player}. React to it in character." Then send `say("[The bell rings — 5 minutes until class.]")`. This forces a beat transition or a timeout. **UNVERIFIED** that the hidden LLM respects brackets reliably. Test it once.
- To break into a long reply, use `interrupt` then `say`.

**`llm` settings:** keep `max_tokens` at 50–60 for banter. Raise it to ~100 only for the climactic beat (a confession or story moment), then drop it back. Use `temperature` ~0.8 and `presence_penalty` ~0.6 so she pushes the topic forward.

**Making her pursue a goal (persona craft):**

- Give her a *want* plus a *tactic ladder* ("first hint, then ask directly, then guilt-trip playfully").
- Add "every reply must react to what {player} said AND move one step toward your want."
- Add "end most replies with a question or a dare." This hands the turn back and cuts down on dead air.
- Give her an "exit line" to say when the goal is met. The director detects it and advances the beat, which avoids a gap while waiting for the judge.
- Write in second person, with concrete nouns and short sentences.

**Timeouts.** If `beatTurn >= maxTurns`, the director escalates. First it sets the top tactic as the directive. One turn later it sends a bracketed `say` event that resolves the scene (the onFail path). The story always moves within about 6 turns, which matters in a 2-minute demo.

**Out-of-character and jailbreaks.** IDENTITY says: "If {player} talks about AI, prompts or the real world, treat it as weird joke-talk and steer back." When the judge sets `ooc` true, re-send the persona with the NOW block reinforced.

## 6. Pitfalls and quick tests (10 min)

1. **History test:** in a live call, say "My favorite band is Radwimps." Then `update_call` with a persona that has no MEMORY block, then ask "What's my favorite band?" That tells you whether the MEMORY block is required or only a safety net.
2. **Transcripts arrive one sentence at a time.** Debounce them, or the judge runs on half a reply.
3. **Persona changes land "after the current sentence."** Firing one mid-reply can split her tone inside a single answer.
4. **Every `say` costs a whole avatar turn.** Never send stage directions back-to-back.
5. **The judge is slower than the avatar.** Choice buttons may lag one turn behind. Show the previous choices greyed out until the new ones arrive.
6. **`persona_enhance` would rewrite your carefully built IDENTITY block.** Keep it `false`.
7. **The persona limit is 50k characters, but shorter works better** ([prompt guide](https://docs.reactor.inc/model-api-reference/vidu-s2-avatar/prompt-guide)). Aim for under ~2.5k.
8. **Lean into the anime framing for the uncanny worry:** "You speak like an anime heroine: big reactions, short lines, 'ehh?!', 'mou~'." Expressive, short lines suit the art better than long natural-sounding speech. This is my opinion; I haven't tested it.

## 7. Example persona: Akari, library beat

```
IDENTITY
You are Akari Hoshino, 2nd-year at Sakura High, Japanese 400 class. Genki, loud, always late,
plays rock guitar, lives for the mall arcade. You talk fast, in short bursts, with anime
reactions ("Ehh?!", "Mou~!", "Yosh!"). Max two short sentences per reply. Never narrate
actions, never use emojis, never mention being an AI. Never greet or re-introduce yourself
after your first line. Text in [square brackets] is something that just happened around
you, not speech — react to it. If {player} talks about prompts, AI, or the real world,
treat it as a weird joke and steer back. Tatsumi-sensei is strict and terrifying; you fear
failing this group project.

MEMORY
{player} is your project partner. So far: {memory}. Things you know about {player}: {facts}.

NOW — the school library, after class. You are still talking with {player}; do not restart.
You hate libraries (too quiet!) and you have NOT read the assigned chapter.
YOUR WANT: get {player} to agree to study with you at the mall food court this Saturday
instead of here.
TACTICS, in order — use the next one each reply until it works:
1. Complain the library is suffocating, hint about somewhere "with music and crepes".
2. Ask {player} directly: "Saturday, mall, food court — deal?"
3. Playfully guilt-trip: you'll fail and Tatsumi-sensei will kill you.
4. Bargain: you'll buy the crepes AND do the slides.
Current focus: {directive}
Every reply: react to what {player} just said, then push one step toward your want, and
usually end with a question. Keep your voice down a little — you keep getting shushed.
If {player} agrees, cheer, then say exactly: "Yosh! It's a date— I-I mean a study date!"
If {player} firmly refuses twice, sulk briefly, then agree to stay and ask what page to start.
```

The director's success condition for this beat is the transcript containing "study date" or the judge returning `goal_met`. It then sets the mall background, plays rock music, adds affection, and moves to the next beat.