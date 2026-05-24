import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { availableFor, loadVocab } from "@/lib/content";
import type { VocabBook } from "@content/schema";
import { getAllProgress, getProfile, getRecent, type ItemProgress } from "@/lib/storage";

export default function VocabIndex() {
  const params = useParams();
  const nav = useNavigate();
  const [grade, setGrade] = useState<number | null>(
    params.grade ? Number(params.grade) : null
  );
  const [book, setBook] = useState<VocabBook | null>(null);
  const [profileGrade, setProfileGrade] = useState<number>(1);
  const [progress, setProgress] = useState<Record<string, ItemProgress>>({});
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getProfile().then((p) => setProfileGrade(p?.grade ?? 1));
  }, []);

  useEffect(() => {
    if (!grade) return;
    loadVocab(grade).then(setBook).catch(() => setBook({ grade, words: [], reviews: [] }));
    getAllProgress("vocab").then(setProgress);
    getRecent().then((entries) => {
      const ids = new Set(
        entries
          .filter((e) => e.subject === "vocab" && e.grade === grade)
          .map((e) => e.itemId)
      );
      setRecentIds(ids);
    });
  }, [grade]);

  const tabs = useMemo(() => availableFor(profileGrade, "vocab"), [profileGrade]);

  // ── Grade select ──────────────────────────────────────────────────
  if (!grade) {
    return (
      <section className="space-y-5 animate-slide-up">
        <h1 className="font-black text-kidxl text-ink-900">
          <span className="text-sprout-500">🌱</span> 어휘싹
        </h1>
        <p className="text-ink-500">체계적인 어휘력 향상 프로그램으로 어휘력을 키워봐요!</p>
        <div className="grid grid-cols-2 gap-3">
          {tabs.map((t) => (
            <button
              key={t.grade}
              onClick={() => {
                if (t.dimmed) return;
                setGrade(t.grade);
                nav(`/vocab/${t.grade}`);
              }}
              className={
                "relative rounded-4xl p-5 text-left transition-all duration-150 " +
                (t.dimmed
                  ? "dim cursor-not-allowed"
                  : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer")
              }
              style={{
                background: t.dimmed
                  ? "linear-gradient(135deg, #e0e0e0, #bdbdbd)"
                  : "linear-gradient(135deg, #4ab50f 0%, #8fe558 100%)",
                boxShadow: t.dimmed ? "0 5px 0 #9e9e9e" : "0 7px 0 #266607",
              }}
            >
              <div className="text-4xl mb-2">🌱</div>
              <div className="font-black text-kidlg text-white">{t.label}</div>
              <div className="text-white/70 text-sm">60개 낱말</div>
              {t.dimmed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/80 rounded-full px-3 py-1 text-sm font-black text-ink-500">
                    🔒 준비 중
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
        <Link to="/" className="btn-soft w-full">← 홈으로</Link>
      </section>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">🌱</div>
        <p className="text-ink-500">불러오는 중…</p>
      </div>
    );
  }

  const total = book.words.length || 60;
  const done = book.words.filter((w) => progress[w.id]?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setGrade(null); nav("/vocab"); }}
          className="text-2xl"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-black text-kidxl text-ink-900">
          🌱 어휘싹 <span className="text-sprout-500">{grade}학년</span>
        </h1>
      </div>

      {/* Progress card */}
      <div
        className="rounded-4xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)",
          boxShadow: "0 6px 0 #0d3b7a",
        }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-white/80 text-sm">완료한 낱말</div>
            <div className="font-black text-kid2xl leading-none">{done}</div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm">목표</div>
            <div className="font-black text-kidxl leading-none">{total}</div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke="white" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.7s ease" }}
              />
            </svg>
            <span className="absolute text-white font-black text-xs">{pct}%</span>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 그룹별 낱말 목록 */}
      {book.words.length === 0 ? (
        <div className="card-bordered text-center py-10">
          <div className="text-4xl mb-3">🚧</div>
          <p className="text-ink-500">아직 자료를 준비 중이에요.<br />admin에서 낱말을 추가해 주세요.</p>
          {import.meta.env.DEV && (
            <Link to="/admin/vocab" className="btn-primary mt-4 inline-flex">
              ⚙️ 어휘 관리
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {book.reviews.map((review, gi) => {
            const startIdx = review.afterIndex - 3;
            const groupWords = book.words.slice(startIdx, review.afterIndex);
            const allDone = groupWords.every((w) => !!progress[w.id]?.done);
            const reviewDone = !!progress[`review-${review.afterIndex}`]?.done;

            return (
              /* 낱말 3개 + 다섯고개 한 행 */
              <div key={review.afterIndex} className="grid grid-cols-4 gap-2">
                {groupWords.map((w, i) => {
                  const p = progress[w.id];
                  const isDone = !!p?.done;
                  const isStarred = !!p?.starred;
                  const isRecent = recentIds.has(w.id);
                  return (
                    <Link
                      key={w.id}
                      to={`/vocab/${grade}/${w.id}`}
                      className={
                        "relative rounded-3xl flex flex-col items-center justify-center " +
                        "text-center px-1 py-3 font-black transition-all duration-150 " +
                        (isDone
                          ? "text-white hover:scale-105"
                          : isRecent
                            ? "bg-white text-ink-700 border-2 border-sun-400 hover:scale-105"
                            : "bg-white text-ink-700 border-2 border-ink-100 hover:border-sprout-400 hover:scale-105")
                      }
                      style={
                        isDone
                          ? { background: "linear-gradient(135deg, #4ab50f, #8fe558)", boxShadow: "0 4px 0 #266607" }
                          : isRecent
                            ? { boxShadow: "0 3px 0 #c67a00" }
                            : { boxShadow: "0 3px 0 rgba(0,0,0,0.08)" }
                      }
                    >
                      <span className="absolute top-1 left-1.5 text-[9px] font-bold opacity-40">
                        {startIdx + i + 1}
                      </span>
                      {isStarred && (
                        <span className="absolute top-0.5 right-1 text-[10px]">⭐</span>
                      )}
                      {isDone && (
                        <span className="absolute bottom-0.5 right-1.5 text-[9px] opacity-60">✓</span>
                      )}
                      <span className="leading-tight text-xs sm:text-sm">{w.word}</span>
                    </Link>
                  );
                })}

                {/* 다섯고개 — 같은 행 4번째 칸 */}
                <Link
                  to={`/vocab/${grade}/review/${review.afterIndex}`}
                  className={
                    "relative rounded-3xl flex flex-col items-center justify-center " +
                    "text-center px-1 py-3 font-black transition-all duration-150 " +
                    (reviewDone
                      ? "text-white hover:scale-105"
                      : "text-sky2-700 bg-sky2-400/10 border-2 border-sky2-400/30 hover:border-sky2-400 hover:scale-105")
                  }
                  style={
                    reviewDone
                      ? { background: "linear-gradient(135deg, #1e88e5, #42a5f5)", boxShadow: "0 4px 0 #0d47a1" }
                      : { boxShadow: "0 3px 0 rgba(0,0,0,0.06)" }
                  }
                >
                  <span className="text-base mb-0.5">🎬</span>
                  <span className="leading-tight text-[10px] sm:text-[11px]">
                    다섯고개{"\n"}{gi + 1}
                  </span>
                  {reviewDone && (
                    <span className="absolute bottom-0.5 right-1.5 text-[9px] opacity-70">✓</span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>
    </section>
  );
}
