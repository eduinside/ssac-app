import type { Subject, VocabBook, ConceptBook, ConceptVideo, ReadingBook } from "@content/schema";

export type GateItem = { label: string; grade: number; semester?: 1 | 2; dimmed: boolean };

export function availableFor(grade: number, subject: Subject): GateItem[] {
  switch (subject) {
    case "vocab": {
      // 데이터가 있는 학년(1~4)은 학생 학년에 관계없이 모두 선택 가능
      return [1, 2, 3, 4].map((g) => ({
        label: `${g}학년`,
        grade: g,
        dimmed: false,
      }));
    }
    case "reading": {
      return [2, 3, 4].map((g) => ({
        label: `${g}학년`,
        grade: g,
        dimmed: false,
      }));
    }
    case "english": {
      return [3, 4, 5, 6].map((g) => ({
        label: `${g}학년`,
        grade: g,
        dimmed: false,
      }));
    }
    case "concept": {
      const items: GateItem[] = [];
      for (let g = 3; g <= 6; g++) {
        for (const s of [1, 2] as const) {
          items.push({ label: `${g}-${s}`, grade: g, semester: s, dimmed: false });
        }
      }
      return items;
    }
  }
}

export async function loadVocab(grade: number): Promise<VocabBook> {
  const mod = await import(`../../content/vocab/grade-${grade}.json`);
  return mod.default as VocabBook;
}

export async function loadReading(grade: number): Promise<ReadingBook> {
  const mod = await import(`../../content/reading/grade-${grade}.json`);
  return mod.default as ReadingBook;
}

export async function loadEnglish(grade: number): Promise<import("@content/schema").EnglishBook> {
  const mod = await import(`../../content/english/grade-${grade}.json`);
  return mod.default as import("@content/schema").EnglishBook;
}

export async function loadConcept(grade: number, semester: number, subject: string): Promise<ConceptBook> {
  const mod = await import(`../../content/concept/grade-${grade}-${semester}-${subject}.json`);
  return mod.default as ConceptBook;
}

export async function findConceptVideo(
  grade: number,
  videoId: string
): Promise<{ book: ConceptBook; video: ConceptVideo; semester: number; subject: string } | null> {
  for (const s of [1, 2] as const) {
    for (const sub of ["social", "math", "science"] as const) {
      try {
        const book = await loadConcept(grade, s, sub);
        for (const unit of book.units) {
          const video = unit.videos.find((v) => v.id === videoId);
          if (video) {
            return { book, video, semester: s, subject: sub };
          }
        }
      } catch {
        // Skip if file doesn't exist
      }
    }
  }
  return null;
}

export const SUBJECTS: { key: Subject; title: string; emoji: string; tag: string; color: string; comingSoon?: boolean }[] =
  [
    { key: "vocab", title: "어휘싹", emoji: "🌱", tag: "어휘력 키우기", color: "bg-sprout-100" },
    { key: "concept", title: "개념싹", emoji: "💡", tag: "교과 문해력 기르기", color: "bg-sun-400/30" },
    { key: "reading", title: "독해싹", emoji: "📖", tag: "독해력 기르기", color: "bg-sky2-400/20" },
    { key: "english", title: "영어싹", emoji: "🅰️", tag: "영어 표현력 기르기", color: "bg-coral-400/20" },
  ];

