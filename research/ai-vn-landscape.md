# AI-Native Narrative and Dating Sims: Landscape and Design Principles (Oct 2026)

## 1. Landscape: what worked, what failed

| Title | What made it compelling | What failed or what to watch | Lesson for us |
|---|---|---|---|
| **Façade** (Mateas & Stern, 2005) | A drama manager picks short, interruptible "beats". Each beat has preconditions and effects, and the next one is chosen to fit an authored tension arc. The parser avoids "I don't understand" replies by mapping what the player types onto a small set of discourse acts. | Critics called the language understanding "broad and shallow" and said the player had little global agency. | Our Gemini director should work like Façade's beat manager: a fixed set of authored beats, each with preconditions and effects, and an arc to follow. The LLM performs a beat; it does not plot the story. [Wikipedia](https://en.wikipedia.org/wiki/Fa%C3%A7ade_(video_game)), [Stern on EBR](https://electronicbookreview.com/essay/andrew-sterns-response-excerpt/), [Mateas thesis](https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-02-206.pdf), [IDSwiki critique](https://tecfalabs.unige.ch/mediawiki-narrative/index.php/Facade) |
| **Suck Up!** (Proxima, 2023/2025) | One clear goal per NPC: talk your way through the door. A hidden "trust system" handles difficulty without boxing the LLM in, so unscripted moments still happen. Costumes change how NPCs react. Police patrols add pressure. It became a streaming and meme hit. | Latency: 1–2 s per reply, and 5–10 s when they needed retries to stop hallucinations. They designed prompts around streaming. | A binary win condition is very readable. A hidden numeric meter plus a free-talking LLM is a proven pattern. Props and context the player chooses (the outfit) change how the NPC reacts. [Dev post](https://community.openai.com/t/vampire-game-where-you-convince-llm-to-let-you-in/604295), [Steam](https://store.steampowered.com/app/2726370/Suck_Up/) |
| **1001 Nights** (Yuqian Sun / Ada Eden) | "Language as reality": when the King says a keyword in the story you are telling ("sword"), it turns into a real item for the battle phase. Talking produces something you can use. | It is a research prototype, and the loop is narrow. | Turn conversation results into concrete game objects. [arXiv](https://arxiv.org/abs/2308.12915v2), [AIIDE](https://ojs.aaai.org/index.php/AIIDE/article/view/27539), [IGF](https://igf.com/entry/2024/1001-nights), [KrASIA](https://kr-asia.com/how-book-of-infinity-1001-nights-uses-ai-to-let-players-tell-their-own-stories) |
| **Vaudeville** (Bumblebee, 2023) | You question suspects freely, by voice. It produced clip-worthy moments. | Game8 scored it 40/100: NPCs went off on wild, unrelated tangents, there was little real detective work, and the models looked "peak uncanny valley". Characters forgot earlier conversations and contradicted themselves. The developer slowed the story to make the AI more reliable. | Free talk with no structure and no mechanical payoff gives you rambling, not a game. Uncanny visuals were called out directly. [Game8](https://game8.co/articles/reviews/vaudeville-review), [KeenGamer](https://keengamer.com/articles/previews/vaudeville-preview-the-ai-questioning-to-nowhere/), [Pre-mortem](https://www.gamedeveloper.com/press-release/vaudeville-a-pre-mortem) |
| **NVIDIA ACE / Inworld "Covert Protocol"** (GDC 2024) | A hands-on writer called it "the most fun I've had in a game for ages". | About 3 s latency with push-to-talk, and voice and lip sync that looked "robotic". It never showed real gameplay value. | Latency and talking-head quality are what players criticize first. Hide them or make them part of the fiction. [SI hands-on](https://videogames.si.com/features/covert-protocol-hands-on), [TechRadar](https://www.techradar.com/gaming/a-new-nvidia-tech-demo-features-real-time-ai-characters-that-react-to-player-decisions) |
| **Whispers from the Star** (Anuttacon, 2025) | This is the closest commercial match to our idea: one heroine (Stella) you talk to live by voice, with no dialogue trees. The "you're on a call across light-years" framing explains the medium inside the story. It launched "Very Positive" on Steam, with recent reviews reported as mixed. | AI backlash split players. Content filters existed but could still be steered around. | Make the video feed part of the story (a call or a transmission). That lowers expectations of perfect realism and covers lag. [Notebookcheck](https://www.notebookcheck.net/Steam-launch-New-interactive-fiction-game-debuts-to-Very-Positive-reviews-may-divide-gamers-over-heavy-AI-integration.1087821.0.html), [Steam](https://store.steampowered.com/app/3730100/_/) |
| **AI Dungeon** | Unlimited freedom. | Memory drift. Story Cards only load into context when their keyword comes up, so characters lose their traits. Latitude's own docs say play is "more consistent" with always-on Plot Essentials. | Put core persona facts and current beat state in the always-on persona text. Never depend on retrieval for them. [Story Cards/Context](https://latitudegames.notion.site/How-do-I-manage-my-Context-302105b8a63280dca963e53200a40a2b), [Plot Components](https://help.aidungeon.io/faq/plot-components), [intfiction thread](https://intfiction.org/t/does-anyone-use-ai-game-masters-for-solo-storytelling-curious-about-long-term-coherence/77309) |
| **Replika / Character.ai** | Always available, and they mirror the user's emotions. | Sycophancy: a 2026 study found that low-sycophancy companions gave better support and better retention. Replika drew criticism for manipulative and paywalled flirting, and Italy banned it in 2023. Users complain about poor memory. Nothing is at stake and there is no goal. | A heroine who always agrees is not a game. She must be able to say no. [T&F 2026](https://tandfonline.com/doi/full/10.1080/10447318.2026.2626809), [Museum of Failure](https://museumoffailure.com/exhibition/replika-ai) |
| **Hidden Door** | Tuned "the right level of surprise" inside authored worlds and licensed IP. | I found only 2022-era material, so this is not verified for 2025–26. | Authored world plus generated surface text. [PC Gamer](https://pcgamer.com/hidden-door-ai-game-narrative-rpg), [TechCrunch](https://techcrunch.com/2022/10/27/hidden-door-wants-to-turn-fiction-into-immersive-roleplaying-experiences) |

The pattern across all of these: the hits (Suck Up!, 1001 Nights, Façade) pair a free-talking AI with a hard authored goal and a hidden state machine. The flops (Vaudeville, raw companions) gave the AI open talk and nothing to win.

## 2. Top 8 design principles for a live-talking-heroine dating sim

**1. Every scene has one stated goal and a timer (Suck Up! door logic).**
Show the objective on screen and limit the scene to a few exchanges or a short clock.
- *Library:* "Get Akari to agree to boba after the session. 5 exchanges." `goal_met` must flip within the limit, otherwise the scene fails.

**2. A hidden meter with readable tells (Suck Up! trust, classic VN affection).**
Keep the affection number hidden. Show its changes every turn in ways the player can read: a sakura-petal burst or a heart tick for +, a gray "…" or the music ducking for −. The background tint or the BGM stem can follow mood.
- Tie the meter to Akari's authored tastes. Rock music and the mall give +. Lecturing her about being late gives −. Pretending you like her band and then failing her follow-up question gives a large −.

**3. Real fail states and branching ends (fixing the companion problem).**
She can leave. If affection drops below a threshold, or if you are boring, rude, or off-topic three times, the director calls `say` with an exit line, then `end_call`, and the screen shows "Akari left. ♡ Route lost." There is a retry button.
- Saturday mall ends in three tiers: the confession, "let's just be bandmates", or she stands you up (a callback to her always running late).
- The persona must tell her she is allowed to be annoyed, to refuse, and to disagree. Studies suggest a less sycophantic companion is the better one.

**4. The director, not the actor, owns the plot (Façade beat manager).**
Gemini picks the next beat from an authored list with preconditions and effects, for example:
- `boba_unlocked` requires `library.goal_met && aff>=X`
- `tatsumi_interrupt` has a 30% chance if the player stalls in the library

It then rewrites the persona with `update_call`. Inside each beat, Vidu's LLM only improvises. Keep `max_tokens` low (the default is 50). Short lines stop the rambling that sank Vaudeville and keep latency down.

**5. What you say turns into items and memories you can use later (1001 Nights).**
The director pulls out facts and promises the player made and turns them into inventory or "memory" cards:
- At Tiger Sugar, saying you'll order her favorite brown-sugar boba becomes a "Promise: brown-sugar boba" card. Telling her about your band becomes "Knows you play guitar."
- At the mall, a card unlocks a special line, and keeping or breaking the promise is scored. This makes memory visible and gives it weight, which solves the AI Dungeon forgetting problem.

**6. Keep canon in the always-on persona, not in history.**
Every `update_call` sends the full persona block:
- the fixed character bible from the 2023 script
- current beat, goal, and limit
- facts the player has revealed
- 2–3 lines of the original VN dialogue as voice anchors

Never rely on long conversation history alone. Vidu's persona limit is 50k characters, so there is plenty of room.

**7. Interrupts and NPC pressure create stakes (Façade's interruptible beats, Suck Up!'s police).**
Use `interrupt` plus a scripted `say` when the player rambles or stalls:
- Tatsumi-sensei in the library: "Akari-san, quiet." She grins, and you get one chance to recover.
- At the mall, her bandmate texts. Then Miyuki or Tsukiko appears, which creates a jealousy beat and teases the other routes.

These make the live AI response the centerpiece of the demo.

**8. Make the video part of the fiction, and stay anime (answering the uncanny worry).**
Players and reviewers attack uncanny faces and robotic lip sync first (Vaudeville, Covert Protocol). Whispers from the Star turned its medium into a story device. So present the avatar as Akari **video-calling you on her phone** (a LINE-style call UI, slight compression, a "connecting…" stall that hides latency), or as a polaroid-framed "Memory". Keep the original hand-drawn sprites and backgrounds around the feed, so the VN's art direction carries the scene. Start with a static sprite and text box for the authored beat openers, then switch to the live call. That way the live avatar is a special event, not something the player stares at for the whole demo.

## 3. Akari route as a playable loop (demo-ready)

| Beat | Goal shown | Fail | Item earned |
|---|---|---|---|
| Library (Japanese 400 project) | "Convince Akari to commit to the group project and grab boba" | Sensei interrupts twice, or affection drops below the floor, and she leaves | "Study buddy" card |
| Tiger Sugar | "Find out what she's actually nervous about" (her late habit / band gig) | Off-topic or pushy x3 and she checks her phone, ending the call | Promise card (e.g. "Come to my gig") |
| Saturday mall | "Make it a date without saying the word date" | Broken promise, low affection, or she stands you up | Ending: Confession / Friends / Stood up |

In the 2-minute pitch: say the goal, show the meter reacting live, trigger one interrupt, show one fail-and-retry, and end on the confession.

## Unverified items
- I couldn't confirm Suck Up!'s exact release timeline (2023 early version versus a 2025 full release).
- I found no current (2025–26) material on Hidden Door's guardrails.
- I found no official post-mortem for Covert Protocol; that row comes from press hands-ons.
- Whispers from the Star's recent mixed rating comes from reseller pages only.
- I found no published reviews of any LLM dating sim with an affection meter. Itch.io titles like Auralyn exist but have no reviews.