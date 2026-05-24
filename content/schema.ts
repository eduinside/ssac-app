import { z } from "zod";

export const Subject = z.enum(["vocab", "concept", "reading", "english"]);
export type Subject = z.infer<typeof Subject>;

export const CheckMCQ = z.object({
  type: z.literal("mcq"),
  prompt: z.string(),
  choices: z.array(z.string()).min(2).max(6),
  answer: z.number().int().min(0),
});
export const CheckFill = z.object({
  type: z.literal("fill"),
  prompt: z.string(),
  answer: z.string(),
  hint: z.string().optional(),
});
export const CheckWrite = z.object({
  type: z.literal("write"),
  prompt: z.string(),
  rubric: z.string(),
  example: z.string().optional(),
});
export const Check = z.discriminatedUnion("type", [CheckMCQ, CheckFill, CheckWrite]);
export type Check = z.infer<typeof Check>;

export const VocabWord = z.object({
  id: z.string(),
  word: z.string(),
  meaning: z.string(),
  examples: z.array(z.string()).default([]),
  check: Check,
});
export type VocabWord = z.infer<typeof VocabWord>;

export const ChosungQuiz = z.object({
  chosung: z.string(),
  answer: z.string(),
  hint: z.string().optional(),
});

export const VocabReview = z.object({
  afterIndex: z.number().int().positive(),
  title: z.string(),
  videoUrl: z.string().url().optional(),
  chosungQuiz: z.array(ChosungQuiz).min(1),
});
export type VocabReview = z.infer<typeof VocabReview>;

export const VocabBook = z.object({
  grade: z.number().int().min(1).max(6),
  words: z.array(VocabWord),
  reviews: z.array(VocabReview).default([]),
});
export type VocabBook = z.infer<typeof VocabBook>;

export const ConceptVideo = z.object({
  id: z.string(),
  title: z.string(),
  youtubeUrl: z.string().optional().default(""),
  concepts: z.array(z.object({ term: z.string(), meaning: z.string(), example: z.string().optional() })),
  quiz: z
    .array(z.object({ type: z.literal("ox"), prompt: z.string(), answer: z.boolean() }))
    .default([]),
});
export type ConceptVideo = z.infer<typeof ConceptVideo>;

export const ConceptBook = z.object({
  grade: z.number().int().min(3).max(6),
  semester: z.union([z.literal(1), z.literal(2)]),
  subject: z.string().optional(),
  units: z
    .array(z.object({ id: z.string(), title: z.string(), videos: z.array(ConceptVideo) }))
    .default([]),
});
export type ConceptBook = z.infer<typeof ConceptBook>;

export const ReadingTopic = z.object({
  id: z.string(),
  title: z.string(),
  meet: z.string(),
  read: z.string(),
  activities: z.array(Check).default([]),
  apply: z.string(),
});
export const ReadingBook = z.object({
  grade: z.number().int().min(2).max(6),
  topics: z.array(ReadingTopic).default([]),
});

export const EnglishItem = z.object({
  id: z.string(),
  title: z.string(),
  videoUrl: z.string(),
});
export const EnglishBook = z.object({
  grade: z.number().int().min(3).max(6),
  items: z.array(EnglishItem).default([]),
});
