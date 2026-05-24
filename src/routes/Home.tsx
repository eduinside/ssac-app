import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SubjectCard, type SubjectKey } from "@/components/SubjectCard";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { SUBJECTS, loadVocab, loadConcept, loadReading, loadEnglish } from "@/lib/content";
import {
  getActiveStudent,
  getRecent,
  getAllProgress,
  getBadges,
  type Student,
  type RecentEntry,
} from "@/lib/storage";
import { BADGES } from "@/lib/badges";

type StarredItem = { id: string; label: string; grade: number; subject: "vocab" | "english" | "reading" };

const SUBJECT_LABEL: Record<string, string> = {
  vocab: "어휘싹", concept: "개념싹", reading: "독해싹", english: "영어싹",
};

export default function Home() {
  const [student, setStudent] = useState<Student | null | "loading">("loading");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [vocabActiveGrade, setVocabActiveGrade] = useState<number | null>(null);
  const [vocabProgress, setVocabProgress] = useState({ done: 0, total: 0 });
  const [conceptActive, setConceptActive] = useState<{ grade: number; semester: number } | null>(null);
  const [conceptProgress, setConceptProgress] = useState({ done: 0, total: 0 });
  const [readingActiveGrade, setReadingActiveGrade] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState({ done: 0, total: 0 });
  const [englishActiveGrade, setEnglishActiveGrade] = useState<number | null>(null);
  const [englishProgress, setEnglishProgress] = useState({ done: 0, total: 0 });
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  async function loadAll() {
    const [s, r, map, conceptMap, readingMap, englishMap, badges] = await Promise.all([
      getActiveStudent(),
      getRecent(),
      getAllProgress("vocab"),
      getAllProgress("concept"),
      getAllProgress("reading"),
      getAllProgress("english"),
      getBadges(),
    ]);
    setStudent(s);
    setRecent(r);

    // Find the most recently studied vocab grade
    const vocabGrade = r.find((rr) => rr.subject === "vocab")?.grade ?? null;
    setVocabActiveGrade(vocabGrade);
    if (vocabGrade !== null) {
      const prefix = `g${vocabGrade}-`;
      const gradeEntries = Object.entries(map).filter(([id]) => id.startsWith(prefix));
      const totalWords = (vocabGrade === 3 || vocabGrade === 4) ? 42 : 60;
      setVocabProgress({ done: gradeEntries.filter(([, v]) => v.done).length, total: totalWords });
    } else {
      setVocabProgress({ done: 0, total: 0 });
    }

    // Concept active grade/semester from most recent entry
    const conceptRecent = r.find((rr) => rr.subject === "concept");
    if (conceptRecent?.semester) {
      const { grade: cg, semester: cs } = conceptRecent as { grade: number; semester: number };
      setConceptActive({ grade: cg, semester: cs });
      const books = await Promise.allSettled(
        ["social", "math", "science"].map((sub) => loadConcept(cg, cs, sub))
      );
      const total = books.reduce((acc, r) =>
        r.status === "fulfilled"
          ? acc + r.value.units.flatMap((u) => u.videos).length
          : acc, 0);
      const allVideoIds = new Set(
        books.flatMap((r) =>
          r.status === "fulfilled" ? r.value.units.flatMap((u) => u.videos.map((v) => v.id)) : []
        )
      );
      const done = Object.entries(conceptMap).filter(([id, v]) => allVideoIds.has(id) && v.done).length;
      setConceptProgress({ done, total });
    } else {
      setConceptActive(null);
      setConceptProgress({ done: 0, total: 0 });
    }

    // Reading active grade from most recent entry
    const readingRecent = r.find((rr) => rr.subject === "reading");
    if (readingRecent) {
      const rg = readingRecent.grade;
      setReadingActiveGrade(rg);
      try {
        const book = await loadReading(rg);
        const total = book.topics.length;
        const done = book.topics.filter((t) => readingMap[t.id]?.done).length;
        setReadingProgress({ done, total });
      } catch {
        setReadingProgress({ done: 0, total: 0 });
      }
    } else {
      setReadingActiveGrade(null);
      setReadingProgress({ done: 0, total: 0 });
    }

    // English active grade from most recent entry
    const englishRecent = r.find((rr) => rr.subject === "english");
    if (englishRecent) {
      const eg = englishRecent.grade;
      setEnglishActiveGrade(eg);
      try {
        const book = await loadEnglish(eg);
        const total = book.items.length;
        const done = book.items.filter((it) => englishMap[it.id]?.done).length;
        setEnglishProgress({ done, total });
      } catch {
        setEnglishProgress({ done: 0, total: 0 });
      }
    } else {
      setEnglishActiveGrade(null);
      setEnglishProgress({ done: 0, total: 0 });
    }

    // Starred items across vocab, english, reading
    const allStarred: StarredItem[] = [];

    // Vocab starred
    const starredVocab = Object.entries(map).filter(([, v]) => v.starred);
    if (starredVocab.length > 0) {
      const grades = [...new Set(starredVocab.map(([id]) => parseInt(id.match(/^g(\d+)-/)?.[1] ?? "1")))];
      const books = await Promise.all(grades.map((g) => loadVocab(g).catch(() => null)));
      const wordMap: Record<string, { word: string; grade: number }> = {};
      books.forEach((b) => b?.words.forEach((w) => { wordMap[w.id] = { word: w.word, grade: b.grade }; }));
      starredVocab.forEach(([id]) => {
        const info = wordMap[id];
        if (info) allStarred.push({ id, label: info.word, grade: info.grade, subject: "vocab" });
      });
    }

    // English starred
    const starredEnglish = Object.entries(englishMap).filter(([, v]) => v.starred);
    if (starredEnglish.length > 0) {
      const grades = [...new Set(starredEnglish.map(([id]) => parseInt(id.split("-")[0]) || 3))];
      const engBooks = await Promise.all(grades.map((g) => loadEnglish(g).catch(() => null)));
      const engItemMap: Record<string, { title: string; grade: number }> = {};
      engBooks.forEach((b) => b?.items.forEach((it) => { engItemMap[it.id] = { title: it.title, grade: b.grade }; }));
      starredEnglish.forEach(([id]) => {
        const info = engItemMap[id];
        if (info) allStarred.push({ id, label: info.title, grade: info.grade, subject: "english" });
      });
    }

    // Reading starred (top-level topics only)
    const starredReading = Object.entries(readingMap).filter(([id, v]) => !id.includes("-apply-") && v.starred);
    if (starredReading.length > 0) {
      const grades = [...new Set(starredReading.map(([id]) => parseInt(id.match(/^g(\d+)-/)?.[1] ?? "2")))];
      const readBooks = await Promise.all(grades.map((g) => loadReading(g).catch(() => null)));
      const readTopicMap: Record<string, { title: string; grade: number }> = {};
      readBooks.forEach((b) => b?.topics.forEach((t) => { readTopicMap[t.id] = { title: t.title, grade: b.grade }; }));
      starredReading.forEach(([id]) => {
        const info = readTopicMap[id];
        if (info) allStarred.push({ id, label: info.title, grade: info.grade, subject: "reading" });
      });
    }

    setStarredItems(allStarred);

    setEarnedBadges(badges);
  }

  useEffect(() => { loadAll(); }, []);

  // Still checking IndexedDB
  if (student === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-5xl animate-float-slow">🌱</div>
      </div>
    );
  }

  // First visit — onboarding
  if (!student) {
    return <OnboardingFlow onDone={() => loadAll()} />;
  }

  const grade = student.grade;

  function timeGreeting(name: string) {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return `${name} 친구야,\n아침부터 열심히!`;
    if (h >= 10 && h < 12) return `${name} 친구야,\n오늘도 함께 공부하자!`;
    if (h >= 12 && h < 14) return `${name} 친구야,\n점심 먹고 공부 시작!`;
    if (h >= 14 && h < 18) return `${name} 친구야,\n오후에도 화이팅!`;
    if (h >= 18 && h < 22) return `${name} 친구야,\n저녁에도 열심히!`;
    return `${name} 친구야,\n밤에도 공부하는구나!`;
  }

  // Recent — one entry per subject, most recent first
  const recentDeduped = recent.reduce<RecentEntry[]>((acc, r) => {
    if (!acc.some((x) => x.subject === r.subject)) acc.push(r);
    return acc;
  }, []);

  const subjectAvailable = (k: string) => {
    if (k === "vocab") return grade >= 1;
    if (k === "concept") return grade >= 3;
    if (k === "reading") return grade >= 2;
    if (k === "english") return grade >= 3;
    return true;
  };

  return (
    <div className="space-y-7 animate-slide-up">
      {/* ── Hero ── */}
      <section
        className="relative rounded-4xl overflow-hidden p-6"
        style={{
          background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)",
          boxShadow: "0 8px 0 #0d3b7a",
        }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-sm font-bold mb-0.5">오늘도 한 발짝!</div>
            <div className="text-white font-black text-kidxl leading-tight whitespace-pre-line">
              {timeGreeting(student.name)}
            </div>
            <div className="mt-1 text-white/60 text-xs">{grade}학년</div>
          </div>
          <div className="text-7xl animate-float-slow select-none">🌱</div>
        </div>
      </section>

      {/* ── Recent + Starred (나란히) ── */}
      <div className="grid grid-cols-2 gap-3 items-start">
        {/* 최근 활동 */}
        <section className="min-w-0">
          <h2 className="font-black text-kidlg text-ink-800 mb-2">⏰ 최근 활동</h2>
          {recentDeduped.length === 0 ? (
            <div className="card-bordered text-center h-[116px] flex flex-col items-center justify-center p-4">
              <div className="text-3xl mb-1">👆</div>
              <p className="text-ink-500 text-xs">아래에서 골라봐!</p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {recentDeduped.map((r) => (
                <Link
                  key={r.subject}
                  to={
                    r.subject === "concept"
                      ? `/concept/${r.grade}/video/${r.itemId}`
                      : `/${r.subject}/${r.grade}/${r.itemId}`
                  }
                  className="card flex-shrink-0 snap-start w-28 h-[116px] p-3.5 flex flex-col justify-between hover:scale-[1.02] transition-transform"
                  style={{
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="text-[10px] text-ink-300 font-bold leading-tight">
                    {SUBJECT_LABEL[r.subject] ?? r.subject}<br />{r.grade}학년
                  </div>
                  <div className="mt-0.5 font-black text-xs text-ink-800 line-clamp-2 leading-tight">{r.label}</div>
                  <div className="text-[10px] text-ink-300">→ 이어하기</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 즐겨찾기 */}
        <section className="min-w-0">
          <h2 className="font-black text-kidlg text-ink-800 mb-2">⭐ 즐겨찾기</h2>
          {starredItems.length === 0 ? (
            <div className="card-bordered text-center h-[116px] flex flex-col items-center justify-center p-4">
              <div className="text-3xl mb-1">⭐</div>
              <p className="text-ink-500 text-xs">별표한 항목이 여기 모여!</p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {starredItems.map((item) => {
                const to =
                  item.subject === "vocab"
                    ? `/vocab/${item.grade}/${item.id}`
                    : item.subject === "english"
                    ? `/english/${item.grade}/${item.id}`
                    : `/reading/${item.grade}/${item.id}`;
                const subjectEmoji =
                  item.subject === "vocab" ? "📝" : item.subject === "english" ? "🅰️" : "📖";
                return (
                  <Link
                    key={`${item.subject}-${item.id}`}
                    to={to}
                    className="flex-shrink-0 snap-start w-28 h-[116px] rounded-4xl p-3.5 text-center flex flex-col justify-between hover:scale-[1.02] transition-transform"
                    style={{
                      background: "linear-gradient(135deg, #fff9c4, #ffd54f)",
                      boxShadow: "0 3px 0 #c67a00, 0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="text-sm">{subjectEmoji}</div>
                    <div className="font-black text-xs text-ink-900 leading-tight line-clamp-2">{item.label}</div>
                    <div className="text-[10px] text-ink-500">{item.grade}학년</div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Subject cards ── */}
      <section>
        <h2 className="font-black text-kidlg text-ink-800 mb-3">📚 오늘은 어떤 공부를 해 볼래?</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {SUBJECTS.map((s) => {
            const isVocabActive = s.key === "vocab" && vocabActiveGrade !== null;
            const isConceptActive = s.key === "concept" && conceptActive !== null;
            const isReadingActive = s.key === "reading" && readingActiveGrade !== null;
            const isEnglishActive = s.key === "english" && englishActiveGrade !== null;
            const isActive = isVocabActive || isConceptActive || isReadingActive || isEnglishActive;
            return (
              <SubjectCard
                key={s.key}
                to={`/${s.key}`}
                title={
                  isVocabActive
                    ? `어휘싹 ${vocabActiveGrade}학년 공부 중`
                    : isConceptActive
                    ? `개념싹 ${conceptActive.grade}학년 ${conceptActive.semester}학기 공부 중`
                    : isReadingActive
                    ? `독해싹 ${readingActiveGrade}학년 공부 중`
                    : isEnglishActive
                    ? `영어싹 ${englishActiveGrade}학년 공부 중`
                    : s.title
                }
                emoji={s.emoji}
                tag={isActive ? "계속 공부하기 →" : s.tag}
                subjectKey={s.key as SubjectKey}
                recommended={!s.comingSoon && subjectAvailable(s.key)}
                comingSoon={s.comingSoon}
                progress={
                  isVocabActive ? vocabProgress
                  : isConceptActive ? conceptProgress
                  : isReadingActive ? readingProgress
                  : isEnglishActive ? englishProgress
                  : undefined
                }
                color={s.color}
              />
            );
          })}
        </div>
      </section>

      {/* ── Badges ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-kidlg text-ink-800">🏅 나의 뱃지</h2>
          <Link to="/badges" className="text-sm font-bold text-sprout-600 hover:text-sprout-700 transition">
            더보기 →
          </Link>
        </div>
        {earnedBadges.length === 0 ? (
          <div className="card-bordered text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-ink-500 text-kid">공부를 하면 뱃지를 받을 수 있어!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {earnedBadges.map((code) => {
              const b = BADGES[code];
              if (!b) return null;
              return (
                <div
                  key={code}
                  className="flex flex-col items-center justify-center rounded-3xl py-4 px-2 text-center"
                  style={{
                    background: "linear-gradient(135deg, #fff9c4, #ffd54f)",
                    boxShadow: "0 4px 0 #c67a00",
                  }}
                >
                  <div className="text-3xl mb-1">{b.emoji}</div>
                  <div className="font-black text-xs text-ink-900 leading-tight">{b.name}</div>
                  <div className="text-[10px] text-ink-500 mt-0.5 leading-tight">{b.desc}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
