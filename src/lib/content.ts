import type { Word, Review, ListItem } from "@/types/vocab";

export async function loadVocabGrade(grade: number): Promise<ListItem[]> {
  const [wordsRes, reviewsRes] = await Promise.all([
    fetch(`/data/vocab/grade${grade}/words.json`),
    fetch(`/data/vocab/grade${grade}/reviews.json`),
  ]);

  if (!wordsRes.ok) throw new Error(`words.json not found for grade ${grade}`);
  if (!reviewsRes.ok) throw new Error(`reviews.json not found for grade ${grade}`);

  const wordsData = await wordsRes.json();
  const reviewsData = await reviewsRes.json();

  const words: Word[] = wordsData.words.map((w: Omit<Word, "itemType">) => ({
    ...w,
    itemType: "word" as const,
  }));

  const reviews: Review[] = reviewsData.reviews.map((r: Omit<Review, "itemType">) => ({
    ...r,
    itemType: "review" as const,
  }));

  const combined: ListItem[] = [...words, ...reviews];
  combined.sort((a, b) => a.page - b.page);
  return combined;
}

export async function loadWord(grade: number, id: string): Promise<Word | null> {
  const res = await fetch(`/data/vocab/grade${grade}/words.json`);
  if (!res.ok) return null;
  const data = await res.json();
  const word = data.words.find((w: Word) => w.id === id);
  return word ? { ...word, itemType: "word" as const } : null;
}

export async function loadReview(grade: number, id: string): Promise<Review | null> {
  const res = await fetch(`/data/vocab/grade${grade}/reviews.json`);
  if (!res.ok) return null;
  const data = await res.json();
  const review = data.reviews.find((r: Review) => r.id === id);
  return review ? { ...review, itemType: "review" as const } : null;
}

/** ID에서 학년 파싱: "v-g4-001" → 4 */
export function gradeFromId(id: string): number {
  const m = id.match(/v-g(\d+)-/);
  return m ? parseInt(m[1]) : 4;
}

export const GRADE_SECTION_COLOR = [
  "meet",   // 1학년
  "guess",  // 2학년
  "explore",// 3학년
  "apply",  // 4학년
  "meet",   // 5학년
  "guess",  // 6학년
] as const;

export type SectionColor = (typeof GRADE_SECTION_COLOR)[number];

export function gradeColor(grade: number): SectionColor {
  return GRADE_SECTION_COLOR[(grade - 1) % GRADE_SECTION_COLOR.length];
}
