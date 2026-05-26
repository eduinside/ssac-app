import {
  addBadge,
  getBadges,
  getAllProgress,
  getActiveStudentId,
  getStudents,
  getReviewWatchCount,
  incrementReviewWatchCount,
} from "./storage";
import { loadVocab, loadConcept, loadReading, loadEnglish } from "./content";

export const BADGES: Record<string, { name: string; emoji: string; desc: string }> = {
  first_word:         { name: "첫 낱말",   emoji: "🌱", desc: "어휘 1개 완료" },
  ten_words:          { name: "열 낱말",   emoji: "🌿", desc: "어휘 10개 완료" },
  thirty_words:       { name: "서른 낱말", emoji: "🌳", desc: "어휘 30개 완료" },
  sixty_words:        { name: "예순 낱말", emoji: "🏆", desc: "한 학년 모두 완료" },
  first_review:       { name: "복습 시작", emoji: "🎬", desc: "다섯고개 1회 통과" },
  five_stars:         { name: "별 모으기", emoji: "⭐", desc: "별표 5개" },
  first_concept:      { name: "개념 첫걸음", emoji: "💡", desc: "개념싹 1개 완료" },
  ten_concepts:       { name: "개념 탐험가", emoji: "🔭", desc: "개념싹 10개 완료" },
  concept_master:     { name: "개념 마스터", emoji: "🧠", desc: "개념싹 30개 완료" },
  concept_legend:     { name: "개념 전설",   emoji: "🏰", desc: "개념싹 100개 완료" },
  first_english:      { name: "영어 첫걸음", emoji: "🅰️", desc: "영어싹 1개 완료" },
  ten_english:        { name: "영어 탐험가", emoji: "🌏", desc: "영어싹 10개 완료" },
  english_master:     { name: "영어 마스터", emoji: "🗣️", desc: "영어싹 20개 완료" },
  first_reading:      { name: "독해 첫걸음", emoji: "📖", desc: "독해싹 1개 완료" },
  ten_reading:        { name: "독해 탐험가", emoji: "📚", desc: "독해싹 10개 완료" },
  reading_master:     { name: "독해 마스터", emoji: "✍️", desc: "독해싹 20개 완료" },
  review_grade_clear: { name: "복습 마스터", emoji: "🎞️", desc: "한 학년 다섯고개 모두 완료" },
  review_100:         { name: "다섯고개 백편", emoji: "🚀", desc: "다섯고개 100회 통과" },
  grade_all_clear:    { name: "그랜드 마스터", emoji: "👑", desc: "설정 학년 모든 과목 완료" },
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

  const targetDone = (grade === 3 || grade === 4) ? 42 : 60;
  if (done >= targetDone) earned.push("sixty_words");

  if (stars >= 5) earned.push("five_stars");

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }

  const allClear = await evaluateGradeAllClear(sid);
  added.push(...allClear);

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

export async function markReviewPassed(grade: number, studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  await incrementReviewWatchCount(sid);

  const [vocabProgress, existing, watchCount] = await Promise.all([
    getAllProgress("vocab", sid),
    getBadges(sid),
    getReviewWatchCount(sid),
  ]);

  const earned: string[] = [];
  earned.push("first_review");

  // check 100 reviews watched
  const doneCount = Object.entries(vocabProgress).filter(([id, v]) => id.includes("review-") && v.done).length;
  if (watchCount >= 100 || doneCount >= 100) {
    earned.push("review_100");
  }

  // check if all reviews for any grade are done
  let reviewGradeClear = false;
  for (let g = 1; g <= 4; g++) {
    try {
      const book = await loadVocab(g);
      if (book && book.reviews && book.reviews.length > 0) {
        const allDone = book.reviews.every(r =>
          vocabProgress[`g${g}-review-${r.afterIndex}`]?.done ||
          (g === grade && vocabProgress[`review-${r.afterIndex}`]?.done)
        );
        if (allDone) {
          reviewGradeClear = true;
          break;
        }
      }
    } catch {
      // ignore
    }
  }
  if (reviewGradeClear) {
    earned.push("review_grade_clear");
  }

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }

  const allClear = await evaluateGradeAllClear(sid);
  added.push(...allClear);

  return added;
}

export async function evaluateConceptBadges(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  const [map, existing] = await Promise.all([
    getAllProgress("concept", sid),
    getBadges(sid),
  ]);
  const done = Object.values(map).filter((v) => v.done).length;

  const earned: string[] = [];
  if (done >= 1)  earned.push("first_concept");
  if (done >= 10) earned.push("ten_concepts");
  if (done >= 30) earned.push("concept_master");
  if (done >= 100) earned.push("concept_legend");

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }

  const allClear = await evaluateGradeAllClear(sid);
  added.push(...allClear);

  return added;
}

export async function evaluateEnglishBadges(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  const [map, existing] = await Promise.all([
    getAllProgress("english", sid),
    getBadges(sid),
  ]);
  const done = Object.values(map).filter((v) => v.done).length;

  const earned: string[] = [];
  if (done >= 1)  earned.push("first_english");
  if (done >= 10) earned.push("ten_english");
  if (done >= 20) earned.push("english_master");

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }

  const allClear = await evaluateGradeAllClear(sid);
  added.push(...allClear);

  return added;
}

export async function evaluateReadingBadges(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  const [map, existing] = await Promise.all([
    getAllProgress("reading", sid),
    getBadges(sid),
  ]);
  const done = Object.entries(map).filter(([id, v]) => !id.includes("-apply-") && v.done).length;

  const earned: string[] = [];
  if (done >= 1)  earned.push("first_reading");
  if (done >= 10) earned.push("ten_reading");
  if (done >= 20) earned.push("reading_master");

  const added: string[] = [];
  for (const code of earned) {
    if (!existing.includes(code)) {
      await addBadge(code, sid);
      added.push(code);
    }
  }

  const allClear = await evaluateGradeAllClear(sid);
  added.push(...allClear);

  return added;
}

export async function evaluateGradeAllClear(studentId?: string): Promise<string[]> {
  const sid = studentId ?? (await getActiveStudentId()) ?? undefined;
  if (!sid) return [];

  const students = await getStudents();
  const s = students.find((x) => x.id === sid);
  if (!s) return [];
  const grade = s.grade;

  // 1. Check Vocab
  let vocabDone = false;
  try {
    const vocabProgress = await getAllProgress("vocab", sid);
    const inGrade = Object.entries(vocabProgress).filter(([id]) => id.startsWith(`g${grade}-`));
    const doneCount = inGrade.filter(([, v]) => v.done).length;
    const targetDone = (grade === 3 || grade === 4) ? 42 : 60;
    if (doneCount >= targetDone) {
      vocabDone = true;
    }
  } catch {
    if (grade >= 5) vocabDone = true;
  }

  // 2. Check Concept
  let conceptDone = false;
  if (grade < 3) {
    conceptDone = true;
  } else {
    try {
      const conceptProgress = await getAllProgress("concept", sid);
      const subjects = ["social", "math", "science"];
      const semesters = [1, 2];
      let totalKeywords = 0;
      let completedKeywords = 0;

      for (const sem of semesters) {
        for (const sub of subjects) {
          try {
            const book = await loadConcept(grade, sem, sub);
            if (book && book.keywords) {
              totalKeywords += book.keywords.length;
              for (const kw of book.keywords) {
                if (conceptProgress[kw.id]?.done) {
                  completedKeywords++;
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }

      if (totalKeywords > 0 && completedKeywords >= totalKeywords) {
        conceptDone = true;
      }
    } catch {
      conceptDone = true;
    }
  }

  // 3. Check English
  let englishDone = false;
  if (grade < 3) {
    englishDone = true;
  } else {
    try {
      const englishProgress = await getAllProgress("english", sid);
      const book = await loadEnglish(grade);
      if (book && book.items) {
        const totalItems = book.items.length;
        const doneItems = book.items.filter(it => englishProgress[it.id]?.done).length;
        if (totalItems > 0 && doneItems >= totalItems) {
          englishDone = true;
        }
      } else {
        englishDone = true;
      }
    } catch {
      englishDone = true;
    }
  }

  // 4. Check Reading
  let readingDone = false;
  if (grade < 2) {
    readingDone = true;
  } else {
    try {
      const readingProgress = await getAllProgress("reading", sid);
      const book = await loadReading(grade);
      if (book && book.topics) {
        const totalTopics = book.topics.length;
        const doneTopics = book.topics.filter(t => readingProgress[t.id]?.done).length;
        if (totalTopics > 0 && doneTopics >= totalTopics) {
          readingDone = true;
        }
      } else {
        readingDone = true;
      }
    } catch {
      readingDone = true;
    }
  }

  if (vocabDone && conceptDone && englishDone && readingDone) {
    const existing = await getBadges(sid);
    if (!existing.includes("grade_all_clear")) {
      await addBadge("grade_all_clear", sid);
      return ["grade_all_clear"];
    }
  }

  return [];
}
