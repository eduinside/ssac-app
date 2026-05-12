export type SectionType = "meet" | "think" | "learn" | "practice";

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface Section {
  type: SectionType;
  title: string;
  prompt?: string;
  dialogue?: string[];
  definition?: string;
  examples?: string[];
  sentences?: string[];
  activity?: Activity;
}

export type ActivityKind =
  | "wordGrid"
  | "multipleChoice"
  | "freeWrite"
  | "fillBlank"
  | "initialSound"
  | "matchPairs";

export interface Activity {
  kind: ActivityKind;
  prompt?: string;
  options?: string[];
  correctIndex?: number;
  grid?: string[][];
  gridAnswers?: string[];
  blanks?: string[];
  answers?: string[];
  hint?: string;
}

export interface Word {
  id: string;
  word: string;
  grade: number;
  order: number;
  page: number;
  definition: string;
  pos?: string; // 품사 (동사, 명사 등)
  examples: string[];
  similarWords?: string[];
  sections: Section[];
  itemType: "word";
}

export interface QuizItem {
  kind: "initialSound";
  hint: string;
  answer: string;
  relatedItemId: string;
}

export interface Review {
  id: string;
  grade: number;
  order: number;
  page: number;
  title: string;
  coversPages: string;
  coversItems: string[];
  videoUrl: string;
  quizzes: QuizItem[];
  itemType: "review";
}

export type ListItem = Word | Review;

export interface Progress {
  id: string;
  favorite: boolean;
  completed: boolean;
  completedAt?: string;
  lastViewedAt?: string;
}
