// Chapter 1 and the opening of Chapter 2, translated from original/script.rpy.
// `voice` paths point at pre-rendered Gemini TTS lines in /public/voice.
import type { Chapter } from "./types";

const BG_STREET = "/bg/brown_street.png";
const BG_CLASS = "/bg/classroom_1.png";

const AKARI_NEUTRAL = "/vn/akari_neutral.png";
const AKARI_SURPRISE = "/vn/akari_surprise.png";
const MIYUKI_NEUTRAL = "/vn/miyuki_neutral.png";
const TSUKIKO_NEUTRAL = "/vn/tsukiko_neutral.png";
const TATSUMI = "/vn/tatsumi.png";

export const CHAPTER_1: Chapter = {
  id: "chapter-1",
  title: { jp: "第一章", en: "Chapter 1 · Spring Semester" },
  nodes: [
    { kind: "scene", bg: BG_STREET, music: "/audio/another_day.mp3" },
    {
      kind: "line",
      speaker: "narrator", voice: "/voice/chapter-1-1.mp3",
      jp: "もう四月だ。徐々に、天気は暖かくなってきて、もうすぐ桜は満開になる。",
      en: "It's already April. Little by little the weather is warming up, and soon the cherry blossoms will be in full bloom.",
    },
    {
      kind: "line",
      speaker: "narrator", voice: "/voice/chapter-1-2.mp3",
      jp: "新学期の初日、君は最初のクラスへ歩いている、でも不意に . . .",
      en: "It's the first day of the new semester, and you're walking to your first class, when suddenly . . .",
    },
    { kind: "scene", bg: BG_STREET, music: null, sfx: "/audio/book_crash.wav" },
    { kind: "line", speaker: "unknown", jp: "遅刻遅刻, キャ––", en: "I'm late, I'm late— kyaa!" },
    { kind: "line", speaker: "unknown", jp: "いたたた~", en: "Ow ow ow~" },
    { kind: "cg", image: "/vn/akari_ch1.png", music: "/audio/akari_theme.mp3" },
    {
      kind: "menu",
      options: [
        {
          jp: "ごっごめん、大丈夫？",
          en: "S-sorry! Are you okay?",
          nodes: [
            { kind: "line", speaker: "unknown", jp: "平気平気、ごめんね〜 君は？", en: "I'm fine, I'm fine, sorry about that~ What about you?" },
            { kind: "scene", bg: BG_STREET },
            { kind: "line", speaker: "you", sprite: AKARI_NEUTRAL, jp: "大丈夫、大丈夫、気をつけてね", en: "I'm okay, I'm okay. Be careful, alright?" },
            { kind: "line", speaker: "unknown", sprite: AKARI_SURPRISE, jp: "よかった...あっやば、遅れちゃった、じゃね〜", en: "Phew, good... ah, yabai, I'm late! See ya~" },
          ],
        },
        {
          jp: "注意しろよ！",
          en: "Watch where you're going!",
          nodes: [
            { kind: "line", speaker: "unknown", jp: "ごめん、ごめん！ケガはない？", en: "Sorry, sorry! You're not hurt, are you?" },
            { kind: "scene", bg: BG_STREET },
            { kind: "line", speaker: "you", sprite: AKARI_NEUTRAL, jp: "大丈夫、気にすんな", en: "I'm fine. Don't worry about it." },
            { kind: "line", speaker: "unknown", sprite: AKARI_SURPRISE, jp: "あっ、よかった...あっやば、遅れちゃった、じゃね〜", en: "Oh, good... ah, yabai, I'm late! See ya~" },
          ],
        },
      ],
    },
    { kind: "line", speaker: "you", sprite: null, jp: "...", en: "..." },
    { kind: "line", speaker: "akari", sprite: AKARI_NEUTRAL, jp: "あっ、忘れてた、あかりだよ！", en: "Oh, I almost forgot — I'm Akari!" },
    { kind: "name", prompt: { jp: "君の名は？", en: "What's your name?" } },
    { kind: "line", speaker: "you", jp: "僕 {name} だ", en: "I'm {name}." },
    { kind: "line", speaker: "akari", jp: "またね、{name}くん！", en: "See you around, {name}-kun!" },
    { kind: "scene", bg: BG_STREET, music: null },
    { kind: "line", speaker: "narrator", voice: "/voice/chapter-1-14.mp3", sprite: null, jp: "それで、君もクラスに走る。", en: "And so, you run off to class too." },
    { kind: "scene", bg: BG_CLASS, music: "/audio/another_day.mp3" },
    {
      kind: "line",
      speaker: "narrator", voice: "/voice/chapter-1-16.mp3",
      jp: "すぐに教室に入った。幸いなことに、授業はまだ始まっていない。席を探している時、誰かが君に手を振る。",
      en: "You slip into the classroom just in time. Luckily, class hasn't started yet. As you look for a seat, someone waves at you.",
    },
    { kind: "line", speaker: "akari", sprite: AKARI_NEUTRAL, jp: "{name}くん、{name}くん!", en: "{name}-kun, {name}-kun!" },
    {
      kind: "line",
      speaker: "narrator", voice: "/voice/chapter-1-18.mp3",
      sprite: null,
      jp: "答える前に、先生は話し始める。急いで空いている席に着く。",
      en: "Before you can answer, the teacher starts talking. You hurry into an empty seat.",
    },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-1-19.mp3",
      sprite: TATSUMI,
      jp: "皆さんこんにちは、たつみと言います。たつみ先生と呼んでください。今学期は日本語４００の先生です。",
      en: "Good afternoon, everyone. My name is Tatsumi. Please call me Tatsumi-sensei. I'll be teaching Japanese 400 this semester.",
    },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-1-20.mp3",
      jp: "私はヨガの先生のようではなく、コーチに似ています。つまり、厳しいですから、皆さん今学期はがんばってください。",
      en: "I'm less like a yoga instructor and more like a coach. In other words, I'm strict — so all of you, give it your best this semester.",
    },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-1-21.mp3",
      jp: "じゃはじめましょう。まず、隣のクラスメイトと自己紹介をしてください、どうぞ。",
      en: "Well then, let's begin. First, introduce yourself to the classmate next to you. Go ahead.",
    },
    {
      kind: "line",
      speaker: "narrator", voice: "/voice/chapter-1-22.mp3",
      sprite: null,
      jp: "先生と話した後で、君は隣のクラスメイトに顔を向ける。",
      en: "When the teacher finishes, you turn to face the classmate beside you.",
    },
    { kind: "cg", image: "/vn/miyuki_ch1.png", music: "/audio/miyuki_theme.mp3" },
    {
      kind: "line",
      speaker: "miyuki",
      jp: "初めまして、清水みゆきです。みゆきと呼んでください。どうぞよろしくお願いします。",
      en: "Nice to meet you. I'm Miyuki Shimizu. Please call me Miyuki. I look forward to working with you.",
    },
    {
      kind: "menu",
      options: [
        {
          jp: "(小さい声で) 可愛い…",
          en: "(under your breath) Cute…",
          nodes: [
            { kind: "line", speaker: "miyuki", jp: "えっ、何て言いましたか？", en: "Huh? What did you say?" },
            {
              kind: "line",
              speaker: "you",
              jp: "いえ、いえ、なんでもない。{name} です、こちらこそよろしく。",
              en: "N-no, no, nothing! I'm {name}. Likewise, nice to meet you.",
            },
          ],
        },
        {
          jp: "...",
          en: "...",
          nodes: [
            { kind: "line", speaker: "miyuki", jp: "えっと、君のお名前は？", en: "Um… and what's your name?" },
            { kind: "line", speaker: "you", jp: "あっ{name}です、こちらこそよろしく。", en: "Oh! I'm {name}. Likewise, nice to meet you." },
          ],
        },
      ],
    },
    {
      kind: "line",
      speaker: "miyuki",
      jp: "いい名前ですね。今学期は一緒にがんばりましょう。",
      en: "What a nice name. Let's do our best together this semester.",
    },
    { kind: "scene", bg: BG_CLASS, music: "/audio/another_day.mp3" },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-1-28.mp3",
      sprite: TATSUMI,
      jp: "じゃ皆、そろそろ自己紹介は終わりですね、では、授業を始めましょう。",
      en: "All right, everyone, that should be enough introductions. Now, let's start the lesson.",
    },
    { kind: "scene", bg: null },
    { kind: "card", text: { jp: "授業中…", en: "Class in session…" } },
    { kind: "scene", bg: BG_CLASS, music: null, sfx: "/audio/schoolbell.mp3" },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-1-32.mp3",
      sprite: TATSUMI,
      jp: "じゃ今日はここで終わります、また明日。",
      en: "That's all for today. See you tomorrow.",
    },
    { kind: "scene", bg: BG_CLASS, music: "/audio/another_day.mp3" },
    { kind: "line", speaker: "miyuki", sprite: MIYUKI_NEUTRAL, jp: "えっと、{name}さん、また明日ね。", en: "Um, {name}-san, see you tomorrow." },
    {
      kind: "line",
      speaker: "akari",
      sprite: AKARI_NEUTRAL,
      jp: "ねぇねぇ、{name}くん、偶然じゃない？まじやばくない。",
      en: "Hey, hey, {name}-kun, what a coincidence, right? Isn't that totally yabai?",
    },
    { kind: "line", speaker: "akari", sprite: AKARI_SURPRISE, jp: "あっ、しまった、今何時？", en: "Ah, shoot! What time is it?" },
    { kind: "line", speaker: "you", jp: "十一時五分だよ。", en: "It's 11:05." },
    {
      kind: "line",
      speaker: "akari",
      jp: "やばい、また遅れちゃう、早く行かなきゃ、じゃこれからよろしくね、バイバイ！",
      en: "Yabai, I'm gonna be late again! Gotta run — looking forward to this semester, bye-bye!",
    },
    {
      kind: "line",
      speaker: "you",
      sprite: null,
      jp: "『私も行こうかな、もう誰もいないし…じゃなくて。』",
      en: "(Maybe I should head out too, there's nobody left… wait, no.)",
    },
    { kind: "line", speaker: "narrator", voice: "/voice/chapter-1-40.mp3", jp: "窓のそばの席に誰かいる。", en: "Someone is still sitting in the seat by the window." },
    { kind: "cg", image: "/vn/tsukiko_ch1.png", music: "/audio/tsukiko_theme.mp3" },
    { kind: "scene", bg: BG_CLASS },
    {
      kind: "menu",
      options: [
        {
          jp: "あの、すみませんが、クラスもう終わりますよ~",
          en: "Um, excuse me, but class is already over~",
          nodes: [
            { kind: "line", speaker: "tsukiko", sprite: TSUKIKO_NEUTRAL, jp: "うん…どうも。", en: "Mm… thanks." },
            { kind: "line", speaker: "you", jp: "えっと、私は{name}です、よろしく。", en: "Um, I'm {name}. Nice to meet you." },
            { kind: "line", speaker: "tsukiko", jp: "月子…青木つきこです…よろしく。", en: "Tsukiko… Tsukiko Aoki… nice to meet you." },
          ],
        },
        {
          jp: "...",
          en: "...",
          nodes: [
            { kind: "line", speaker: "tsukiko", sprite: TSUKIKO_NEUTRAL, jp: "どうしたの?", en: "What is it?" },
            {
              kind: "line",
              speaker: "you",
              jp: "なんでもないし、クラスがもう終わったところで…えっと…私は {name}です、よろしく。",
              en: "Nothing, it's just that class already ended, so… um… I'm {name}. Nice to meet you.",
            },
            { kind: "line", speaker: "tsukiko", jp: "月子…青木つきこです…よろしく。", en: "Tsukiko… Tsukiko Aoki… nice to meet you." },
            { kind: "line", speaker: "you", jp: "じゃ、また明日。", en: "Well, see you tomorrow." },
            { kind: "line", speaker: "tsukiko", jp: "うん、また。", en: "Mm. See you." },
          ],
        },
      ],
    },
    { kind: "scene", bg: BG_STREET },
    {
      kind: "line",
      speaker: "you",
      sprite: null,
      jp: "『今日会った子たちはなかなか面白いね、漫画で会える女の子みたいだし…まさか！いやいや、むりむり…夢じゃない、だろう？とにかく、食堂に食べに行こう。』",
      en: "(The girls I met today are pretty interesting… like girls straight out of a manga… no way! Nah, nah, impossible… this isn't a dream, right? Anyway, let's go grab something at the dining hall.)",
    },
    { kind: "scene", bg: null, music: null },
  ],
};

export const CHAPTER_2_INTRO: Chapter = {
  id: "chapter-2",
  title: { jp: "第二章", en: "Chapter 2 · Partners" },
  nodes: [
    { kind: "scene", bg: BG_CLASS, music: "/audio/another_day.mp3" },
    { kind: "line", speaker: "narrator", voice: "/voice/chapter-2-1.mp3", jp: "翌日、君はクラスに戻る", en: "The next day, you head back to class." },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-2-2.mp3",
      sprite: TATSUMI,
      jp: "おはようございます、今日は最初のグループの宿題を説明します。じゃ、まず…",
      en: "Good morning. Today I'll explain your first group assignment. Now, first of all…",
    },
    { kind: "line", speaker: "narrator", voice: "/voice/chapter-2-3.mp3", jp: "先生はプロジェクトを説明している。", en: "The teacher walks everyone through the project." },
    {
      kind: "line",
      speaker: "tatsumi", voice: "/voice/chapter-2-4.mp3",
      sprite: TATSUMI,
      jp: "では、パートナーを探しましょう。",
      en: "Now then, let's find partners.",
    },
  ],
};

/** Short pre-voiced Tatsumi-sensei interruptions (Gemini designed voice). */
export const TATSUMI_INTERRUPTS = [
  { jp: "そこ！静かにしなさい。", en: "You there! Quiet down.", voice: "/voice/tatsumi-interrupt-1.mp3" },
  { jp: "おしゃべりはそこまで。集中しなさい。", en: "That is enough chatter. Focus.", voice: "/voice/tatsumi-interrupt-2.mp3" },
  { jp: "時間は待ってくれませんよ。", en: "Time waits for no one.", voice: "/voice/tatsumi-interrupt-3.mp3" },
  { jp: "はい、続けて。", en: "All right, carry on.", voice: "/voice/tatsumi-interrupt-4.mp3" },
];
