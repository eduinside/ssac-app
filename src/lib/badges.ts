import { addBadge, getBadges, getAllProgress, getActiveStudentId } from "./storage";

export const BADGES: Record<string, { name: string; emoji: string; desc: string }> = {
  first_word:   { name: "첫 낱말",   emoji: "🌱", desc: "어휘 1개 완료" },
  ten_words:    { name: "열 낱말",   emoji: "🌿", desc: "어휘 10개 완료" },
  thirty_words: { name: "서른 낱말", emoji: "🌳", desc: "어휘 30개 완료" },
  sixty_words:  { name: "예순 낱말", emoji: "🏆", desc: "한 학년 모두 완료" },
  first_review: { name: "복습 시작", emoji: "🎬", desc: "다섯고개 1회 통과" },
  five_stars:   { name: "별 모으기", emoji: "⭐", desc: "별표 5개" },
};

export async function evaluateVocabBadges(grade: number, studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  const [map, existing] = await Promise.all([
    getAllProgress("vocab", sid),
    getBadges(sid),
  ]);
  const inGrade = Object.entries(map).filter(([id]) => id.startsWith(`g${grade}-`));
  const done  = inGrade.filter(([, v]) => v.done).length;
  const stars = Object.values(map).filter((v) => v.starred).length;

  const earned: string[] = [];
  if (done >= 1)  earned.push("first_word");
  if (done >= 10) earned.push("ten_words");
  if (done >= 30) earned.push("thirty_words");
  if (done >= 60) earned.push("sixty_words");
  if (stars >= 5) earned.push("five_stars");

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }
  return added;
}

export async function evaluateStarBadge(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  const map = await getAllProgress("vocab", sid);
  const stars = Object.values(map).filter((v) => v.starred).length;
  if (stars >= 5) {
    const next = await addBadge("five_stars", sid);
    if (next.includes("five_stars")) return ["five_stars"];
  }
  return [];
}

export async function markReviewPassed(studentId?: string) {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  return addBadge("first_review", sid);
}
