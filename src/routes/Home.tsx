import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SubjectCard, type SubjectKey } from "@/components/SubjectCard";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { NoticeModal, isNoticeRead } from "@/components/NoticeModal";
import { SUBJECTS, loadVocab, loadConcept, loadReading, loadEnglish } from "@/lib/content";
import {
  getActiveStudent,
  getRecent,
  getAllProgress,
  getBadges,
  nukeAndReload,
  type Student,
  type RecentEntry,
} from "@/lib/storage";
import { BADGES } from "@/lib/badges";

type Notice = { id: number; title: string; body: string; created_at: number };

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
  const [dbError, setDbError] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  async function loadAll() {
    setDbError(false);

    // IndexedDB가 응답하지 않으면 6초 후 오류 처리
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; }, 6000);

    try {
      const [s, r, map, conceptMap, readingMap, englishMap, badges] = await Promise.all([
        getActiveStudent(),
        getRecent(),
        getAllProgress("vocab"),
        getAllProgress("concept"),
        getAllProgress("reading"),
        getAllProgress("english"),
        getBadges(),
      ]);

      clearTimeout(timer);
      if (timedOut) { setDbError(true); setStudent(null); return; }

      setStudent(s);
      setRecent(r);

      // Vocab — most recently studied grade
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

      // Concept — most recent grade/semester
      const conceptRecent = r.find((rr) => rr.subject === "concept");
      if (conceptRecent?.semester) {
        const { grade: cg, semester: cs } = conceptRecent as { grade: number; semester: number };
        setConceptActive({ grade: cg, semester: cs });
        const books = await Promise.allSettled(
          ["social", "math", "science"].map((sub) => loadConcept(cg, cs, sub))
        );
        const total = books.reduce((acc, r) =>
          r.status === "fulfilled" ? acc + r.value.keywords.length : acc, 0);
        const allKeywordIds = new Set(
          books.flatMap((r) =>
            r.status === "fulfilled" ? r.value.keywords.map((k) => k.id) : []
          )
        );
        const done = Object.entries(conceptMap).filter(([id, v]) => allKeywordIds.has(id) && v.done).length;
        setConceptProgress({ done, total });
      } else {
        setConceptActive(null);
        setConceptProgress({ done: 0, total: 0 });
      }

      // Reading — most recent grade
      const readingRecent = r.find((rr) => rr.subject === "reading");
      if (readingRecent) {
        const rg = readingRecent.grade;
        setReadingActiveGrade(rg);
        try {
          const book = await loadReading(rg);
          setReadingProgress({ done: book.topics.filter((t) => readingMap[t.id]?.done).length, total: book.topics.length });
        } catch {
          setReadingProgress({ done: 0, total: 0 });
        }
      } else {
        setReadingActiveGrade(null);
        setReadingProgress({ done: 0, total: 0 });
      }

      // English — most recent grade
      const englishRecent = r.find((rr) => rr.subject === "english");
      if (englishRecent) {
        const eg = englishRecent.grade;
        setEnglishActiveGrade(eg);
        try {
          const book = await loadEnglish(eg);
          setEnglishProgress({ done: book.items.filter((it) => englishMap[it.id]?.done).length, total: book.items.length });
        } catch {
          setEnglishProgress({ done: 0, total: 0 });
        }
      } else {
        setEnglishActiveGrade(null);
        setEnglishProgress({ done: 0, total: 0 });
      }

      // Starred items — vocab + english + reading
      const allStarred: StarredItem[] = [];

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
    } catch {
      clearTimeout(timer);
      setStudent(null);
      setDbError(true);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // 공지사항 fetch — 읽지 않은 공지가 있으면 자동 팝업
  useEffect(() => {
    fetch("/api/notice")
      .then((r) => r.ok ? r.json() as Promise<Notice | null> : null)
      .then((data) => {
        if (data && !isNoticeRead(data.id)) {
          setNotice(data);
          setShowNotice(true);
        } else if (data) {
          setNotice(data); // 읽었어도 배너용으로는 보존
        }
      })
      .catch(() => { /* 오프라인 등 무시 */ });
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (student === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-5xl animate-float-slow">🌱</div>
      </div>
    );
  }

  // ── DB 오류 복구 화면 ──────────────────────────────────────────────
  if (dbError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center px-4">
        <div className="text-6xl">😵</div>
        <div>
          <p className="font-black text-kidlg text-ink-800 mb-1">데이터를 불러올 수 없어요</p>
          <p className="text-sm text-ink-500">저장 공간에 문제가 생겼을 수 있어요.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => { setDbError(false); setStudent("loading"); loadAll(); }}
            className="btn-soft w-full"
          >
            🔄 다시 시도하기
          </button>
          <button
            onClick={() => {
              if (confirm("데이터를 초기화하면 학습 기록이 모두 삭제돼요. 계속할까요?")) {
                nukeAndReload();
              }
            }}
            className="w-full rounded-2xl px-6 py-3.5 font-extrabold text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 transition"
          >
            🗑️ 데이터 초기화 후 재시작
          </button>
        </div>
      </div>
    );
  }

  // ── 첫 방문 — 온보딩 ────────────────────────────────────────────────
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

  // Recent — subject당 1개, 최신순
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
            <div className="text-white font-jua text-kidxl leading-tight whitespace-pre-line">
              {timeGreeting(student.name)}
            </div>
            <div className="mt-1 text-white/60 text-xs">{grade}학년</div>
          </div>
          <img src="/app-icon.png" alt="" className="w-24 h-24 animate-float-slow select-none drop-shadow-md" />
        </div>
      </section>

      {/* ── Recent + Starred ── */}
      <div className="grid grid-cols-2 gap-3 items-start">
        {/* 최근 활동 */}
        <section className="min-w-0">
          <h2 className="font-black text-kidlg text-ink-800 mb-2">⏰ 최근 활동</h2>
          {recentDeduped.length === 0 ? (
            <div className="card-bordered text-center py-6">
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
                  className="card flex-shrink-0 snap-start w-28 hover:scale-[1.02] transition-transform"
                >
                  <div className="text-[10px] text-ink-300 font-bold leading-tight">
                    {SUBJECT_LABEL[r.subject] ?? r.subject}<br />{r.grade}학년
                  </div>
                  <div className="mt-1 font-black text-xs text-ink-800 line-clamp-2 leading-tight">{r.label}</div>
                  <div className="text-[10px] text-ink-300 mt-1">→ 이어하기</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 즐겨찾기 */}
        <section className="min-w-0">
          <h2 className="font-black text-kidlg text-ink-800 mb-2">⭐ 즐겨찾기</h2>
          {starredItems.length === 0 ? (
            <div className="card-bordered text-center py-6">
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
                    className="flex-shrink-0 snap-start w-28 rounded-2xl p-3 hover:scale-[1.02] transition-transform flex flex-col justify-between"
                    style={{
                      background: "linear-gradient(135deg, #fff9c4, #ffd54f)",
                      boxShadow: "0 3px 0 #c67a00",
                    }}
                  >
                    <div>
                      <div className="text-[10px] text-amber-700 font-bold leading-tight">
                        {subjectEmoji} {SUBJECT_LABEL[item.subject]}<br />{item.grade}학년
                      </div>
                      <div className="mt-1 font-black text-xs text-ink-900 leading-tight line-clamp-2">{item.label}</div>
                    </div>
                    <div className="text-[10px] text-amber-600 mt-1">→ 바로가기</div>
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
          <div className="grid grid-cols-5 gap-2">
            {earnedBadges.map((code) => {
              const b = BADGES[code];
              if (!b) return null;
              return (
                <div
                  key={code}
                  className="flex flex-col items-center justify-center rounded-2xl py-3 px-1 text-center"
                  style={{
                    background: "linear-gradient(135deg, #fff9c4, #ffd54f)",
                    boxShadow: "0 3px 0 #c67a00",
                  }}
                >
                  <div className="text-2xl mb-0.5">{b.emoji}</div>
                  <div className="font-black text-[10px] text-ink-900 leading-tight">{b.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 공지사항 ── */}
      {notice && (
        <section>
          <button
            onClick={() => setShowNotice(true)}
            className="w-full text-left rounded-3xl px-5 py-4 flex items-center gap-3 hover:scale-[1.01] transition-transform"
            style={{
              background: "linear-gradient(135deg, #e8f5e9, #e3f2fd)",
              boxShadow: "0 3px 0 #b0bec5",
            }}
          >
            <span className="text-2xl">📢</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-ink-400 mb-0.5">공지사항</div>
              <div className="font-black text-sm text-ink-800 leading-tight truncate">{notice.title}</div>
            </div>
            <span className="text-ink-300 text-sm">›</span>
          </button>
        </section>
      )}

      {/* ── NoticeModal ── */}
      {showNotice && notice && (
        <NoticeModal notice={notice} onClose={() => setShowNotice(false)} />
      )}
    </div>
  );
}
