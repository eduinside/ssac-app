import type { Subject, VocabBook } from "@content/schema";

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
        dimmed: g > grade,
      }));
    }
    case "english": {
      return [3, 4, 5, 6].map((g) => ({
        label: `${g}학년`,
        grade: g,
        dimmed: g > grade,
      }));
    }
    case "concept": {
      const items: GateItem[] = [];
      for (let g = 3; g <= 6; g++) {
        for (const s of [1, 2] as const) {
          items.push({ label: `${g}-${s}`, grade: g, semester: s, dimmed: g > grade });
        }
      }
      return items;
    }
  }
}

export async function loadVocab(grade: number): Promise<VocabBook> {
  const mod = await import(`@content/vocab/grade-${grade}.json`);
  return mod.default as VocabBook;
}

export const SUBJECTS: { key: Subject; title: string; emoji: string; tag: string; color: string }[] =
  [
    { key: "vocab", title: "어휘싹", emoji: "🌱", tag: "낱말 키우기", color: "bg-sprout-100" },
    { key: "concept", title: "개념싹", emoji: "💡", tag: "수·사·과 개념", color: "bg-sun-400/30" },
    { key: "reading", title: "독해싹", emoji: "📖", tag: "문해력 쑥쑥", color: "bg-sky2-400/20" },
    { key: "english", title: "영어싹", emoji: "🅰️", tag: "영어 영상", color: "bg-coral-400/20" },
  ];
