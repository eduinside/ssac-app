import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadVocab } from "@/lib/content";
import type { VocabBook, VocabWord as VW } from "@content/schema";
import { CheckRunner } from "@/components/Check";
import { evaluateVocabBadges, evaluateStarBadge, BADGES } from "@/lib/badges";
import { patchProgress, pushRecent, getProgress } from "@/lib/storage";

export default function VocabWord() {
  const { grade: g, wordId } = useParams();
  const grade = Number(g);
  const nav = useNavigate();
  const [book, setBook] = useState<VocabBook | null>(null);
  const [done, setDone] = useState(false);
  const [starred, setStarred] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    loadVocab(grade).then(setBook).catch(() => null);
  }, [grade]);

  useEffect(() => {
    if (!wordId) return;
    getProgress("vocab", wordId).then((p) => {
      setDone(!!p?.done);
      setStarred(!!p?.starred);
    });
  }, [wordId]);

  const idx = useMemo(
    () => (book && wordId ? book.words.findIndex((w) => w.id === wordId) : -1),
    [book, wordId]
  );
  const w: VW | undefined = idx >= 0 ? book!.words[idx] : undefined;

  useEffect(() => {
    if (w) pushRecent({ subject: "vocab", itemId: w.id, label: w.word, grade });
  }, [w, grade]);

  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 3500);
    return () => clearTimeout(t);
  }, [newBadges]);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">🌱</div>
        <p className="text-ink-500">불러오는 중…</p>
      </div>
    );
  }
  if (!w) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-3">😅</div>
        <p className="text-ink-500">이 낱말을 찾을 수 없어요.</p>
        <Link to={`/vocab/${grade}`} className="btn-soft mt-4">
          목록으로
        </Link>
      </div>
    );
  }

  const next = book.words[idx + 1];
  const prev = book.words[idx - 1];
  const total = book.words.length;

  async function toggleStar() {
    const v = !starred;
    setStarred(v);
    await patchProgress("vocab", w!.id, { starred: v });
    if (v) {
      const added = await evaluateStarBadge();
      if (added.length) setNewBadges(added);
    }
  }

  // 이 낱말 다음에 다섯고개 리뷰가 있는지 확인 (idx는 0-based, afterIndex는 1-based)
  const nextReview = book?.reviews.find((r) => r.afterIndex === idx + 1);

  async function complete(passed: boolean, s?: number) {
    if (passed) {
      setDone(true);
      await patchProgress("vocab", w!.id, { done: true, score: s });
      const added = await evaluateVocabBadges(grade);
      if (added.length) setNewBadges(added);
    } else {
      await patchProgress("vocab", w!.id, { score: s });
    }
  }

  return (
    <article className="space-y-4 animate-slide-up">
      {/* Progress bar + back */}
      <div className="flex items-center gap-3">
        <Link to={`/vocab/${grade}`} className="text-2xl text-ink-400 hover:text-ink-700 transition">
          ←
        </Link>
        <div className="flex-1 progress-track">
          <div className="progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-ink-500 shrink-0">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Word card */}
      <div
        className="relative rounded-4xl overflow-hidden p-6"
        style={{
          background: "linear-gradient(135deg, #4ab50f 0%, #1e88e5 100%)",
          boxShadow: "0 8px 0 #0d3b7a",
        }}
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
        <button
          onClick={toggleStar}
          className={
            "absolute top-2 right-2 w-14 h-14 flex items-center justify-center rounded-2xl text-3xl transition-all duration-200 active:scale-95 " +
            (starred ? "scale-110" : "grayscale opacity-50 hover:opacity-80 hover:grayscale-0")
          }
          aria-label="별표"
        >
          ⭐
        </button>

        <div className="relative z-10">
          <div className="font-black text-kid2xl text-white leading-tight mb-1">{w.word}</div>
          {done && (
            <span className="inline-flex items-center gap-1 text-xs font-black bg-white/20 rounded-full px-3 py-1 text-white mb-2">
              ✓ 완료!
            </span>
          )}
          <p className="text-white/90 text-kidlg leading-relaxed">{w.meaning}</p>
          {w.examples.length > 0 && (
            <ul className="mt-4 space-y-2">
              {w.examples.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-white/80 text-kid bg-white/10 rounded-2xl px-3 py-2"
                >
                  <span className="text-white/60 text-xs mt-1">예</span>
                  {ex}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Check module */}
      <div className="card">
        <h2 className="font-black text-kidlg text-ink-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-sprout-100 flex items-center justify-center text-lg">✍️</span>
          확인해 볼까?
        </h2>
        <CheckRunner key={wordId} check={w.check} onResult={complete} />
      </div>

      {/* Nav buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => prev && nav(`/vocab/${grade}/${prev.id}`)}
          disabled={!prev}
          className="btn-soft flex-1 disabled:opacity-30"
        >
          ← 이전
        </button>
        <button
          onClick={() => {
            if (nextReview) {
              nav(`/vocab/${grade}/review/${nextReview.afterIndex}`);
            } else if (next) {
              nav(`/vocab/${grade}/${next.id}`);
            } else {
              nav(`/vocab/${grade}`);
            }
          }}
          className="flex-1 btn-primary"
        >
          {nextReview ? "🎬 다섯고개 풀기" : next ? "다음 →" : "목록으로 ✓"}
        </button>
      </div>
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>

      {/* Badge toast */}
      {newBadges.length > 0 && (
        <div
          className="fixed bottom-24 sm:bottom-6 inset-x-4 max-w-sm mx-auto rounded-4xl p-4 z-50 animate-bounce-in"
          style={{
            background: "linear-gradient(135deg, #f9a825, #ffd54f)",
            boxShadow: "0 8px 0 #c67a00, 0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl animate-wiggle">🏅</div>
            <div>
              <div className="font-black text-ink-900">뱃지 획득!</div>
              <div className="text-sm text-ink-700">
                {newBadges.map((c) => `${BADGES[c]?.emoji ?? ""} ${BADGES[c]?.name ?? c}`).join("  ")}
              </div>
            </div>
            <button
              onClick={() => setNewBadges([])}
              className="ml-auto text-ink-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

