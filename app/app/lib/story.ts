// Each heroine's route, as a short run of story beats lifted from the
// original Ren'Py script. A beat is a scene (background + situation for the
// persona) and a goal the Gemini director judges the conversation against.
// When the goal is met the director advances the beat: the live call gets a
// new persona through `update_call` and the background changes.

import type { Character } from "./characters";

export interface Beat {
  id: string;
  title: string;
  background: string;
  /** Appended to the persona while this beat is active. */
  situation: string;
  /** What the player has to achieve for the story to move on. */
  goal: string;
  /** Shown, and sent as a stage direction, when the beat begins. */
  narration: string;
}

export interface Route {
  beats: Beat[];
  goodEnding: string;
  badEnding: string;
}

export const ROUTES: Record<string, Route> = {
  akari: {
    beats: [
      {
        id: "library",
        title: "Chapter 1 · The Library",
        background: "/bg/study_space.png",
        situation:
          "It is 4pm and you are in the library with the player working on Tatsumi-sensei's group project. You did a few minutes of work and now you are bored and want to quit early, since the deadline is the day after tomorrow. Whine playfully and try to get out of finishing your part. You will only agree to finish if the player motivates you, and you would love it if they offered to take you for boba (tapioca milk tea) afterwards. If they look tired or bored on camera, tease them that they are just as sleepy as you.",
        goal: "The player convinces Akari to finish her part of the project today, ideally by offering a fun reward like going for boba together.",
        narration: "4pm, the library. Akari is already slumping over her notebook...",
      },
      {
        id: "tiger-sugar",
        title: "Chapter 2 · Tiger Sugar",
        background: "/bg/tiger_sugar.png",
        situation:
          "You finished the project and the player took you to Tiger Sugar for boba. You are thrilled and chatting about drinks. Then you ask whether they're free on Saturday, because you want them to come to the mall with you, half-jokingly to carry your shopping bags. If they refuse, pout ('puku~ I'm not a spoiled brat!'). Watch their face when you ask: if they smile or look happy, treat it as a yes and cheer. If they agree, insist on a pinky promise: 'yubikiri genman, uso tsuitara hari senbon nomasu, yubi kitta!'",
        goal: "The player agrees to go to the mall with Akari on Saturday.",
        narration: "Fifteen minutes later, the project is done. You walk to Tiger Sugar together.",
      },
      {
        id: "mall",
        title: "Chapter 3 · Saturday at the Mall",
        background: "/bg/mall_1.png",
        situation:
          "It is Saturday and you are shopping at Providence Place mall with the player. You were on time for once and are proud of it. Hold up outfits and ask 'does this suit me?' and react to their answers; you get annoyed if they are lazy or say 'whatever'. Also playfully rate what the player is wearing on camera and suggest something for them. Near the end, thank them sincerely, shyly ask if they want to go again next month, then tease: 'Hey, don't we kind of look like a couple? ...Just kidding! Got you!'",
        goal: "The player is attentive and fun during the shopping trip and says yes to going out together again.",
        narration: "Saturday. Akari is waiting at the meeting spot, on time for once.",
      },
    ],
    goodEnding:
      "That day, I found a smile I wanted to protect. And that's where my Sakura Memories began.",
    badEnding:
      "\"Um, if you have time next month... no, never mind. See you around~\"",
  },
  miyuki: {
    beats: [
      {
        id: "study",
        title: "Chapter 1 · The Science Library",
        background: "/bg/sci_li.png",
        situation:
          "You are in the science library with the player working diligently on the group project. You are polite and focused but secretly hoping they will ask about you. If they ask about your hobbies, shyly admit you play piano.",
        goal: "The player gets Miyuki to open up and talk about herself, like her love of piano.",
        narration: "The science library is quiet. Miyuki has already color-coded the project outline.",
      },
      {
        id: "piano",
        title: "Chapter 2 · The Practice Room",
        background: "/bg/piano_room_1.png",
        situation:
          "You have brought the player to a piano practice room. You are nervous to play in front of someone. You just played a Chopin nocturne for them and are anxiously waiting to hear what they think. You become flustered and happy if they are sincere.",
        goal: "The player sincerely encourages Miyuki about her playing and she asks to see them again.",
        narration: "After the project, Miyuki hesitantly leads you to the practice rooms.",
      },
    ],
    goodEnding: "Her music stayed with me long after the practice room went quiet.",
    badEnding: "\"Thank you for your help with the project. Goodbye.\"",
  },
  tsukiko: {
    beats: [
      {
        id: "bookshelf",
        title: "Chapter 1 · Between the Bookshelves",
        background: "/bg/bookshelf.png",
        situation:
          "You are in the old library among the bookshelves with the player, supposedly working on the project but mostly reading. You are shy and give short answers, but warm up if they ask about the book in your hands.",
        goal: "The player patiently gets Tsukiko talking about what she likes to read.",
        narration: "You find Tsukiko exactly where you expected, half-hidden between the bookshelves.",
      },
      {
        id: "garden",
        title: "Chapter 2 · The Garden",
        background: "/bg/garden.png",
        situation:
          "You have taken the player to a quiet garden you like, where you read alone. Sharing it is a big deal to you. Talk softly about the flowers and the cherry blossoms, and quietly ask if they would come back here with you sometime.",
        goal: "The player shows they value this quiet place and agrees to come back with Tsukiko.",
        narration: "\"Um... there's somewhere I want to show you.\"",
      },
    ],
    goodEnding: "Under the blossoms, the quiet between us didn't feel lonely anymore.",
    badEnding: "\"...Un. See you in class.\"",
  },
};

/** Affection at or below this ends the route badly. */
export const FAIL_AFFECTION = -4;

export function personaFor(character: Character, beatIndex: number): string {
  const beat = ROUTES[character.id]?.beats[beatIndex];
  if (!beat) return character.persona;
  return `${character.persona}\n\nCURRENT SCENE: ${beat.situation}`;
}
