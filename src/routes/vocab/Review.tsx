import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadVocab } from "@/lib/content";
import type { VocabBook } from "@content/schema";
import { ChosungQuiz } from "@/components/ChosungQuiz";
import { markReviewPassed, BADGES } from "@/lib/badges";
import { patchProgress } from "@/lib/storage";

export default function VocabReview() {
  const { grade: g, afterIndex: ai } = useParams();
  const grade = Number(g);
  const afterIndex = Number(ai);
  const nav = useNavigate();
  const [book, setBook] = useState<VocabBook | null>(null);
  const [phase, setPhase] = useState<"video" | "quiz" | "done">("video");
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    loadVocab(grade).then(setBook).catch(() => null);
  }, [grade]);

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

  const review = book.reviews.find((r) => r.afterIndex === afterIndex);
  const nextWord = book.words[afterIndex]; // afterIndex는 1-based, words는 0-based이므로 다음 그룹 첫 번째 낱말

  if (!review) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-3">😅</div>
        <p className="text-ink-500">복습 세션을 찾을 수 없어요.</p>
        <Link to={`/vocab/${grade}`} className="btn-soft mt-4">목록으로</Link>
      </div>
    );
  }

  async function handleQuizComplete() {
    setPhase("done");
    await patchProgress("vocab", `g${grade}-review-${afterIndex}`, { done: true });
    const added = await markReviewPassed(grade);
    if (added.length > 0) {
      setNewBadges(added);
    }
  }

  async function handleDone() {
    if (nextWord) {
      nav(`/vocab/${grade}/${nextWord.id}`);
    } else {
      nav(`/vocab/${grade}`);
    }
  }

  // 이 복습에 해당하는 낱말 그룹 (3개)
  const groupWords = book.words.slice(afterIndex - 3, afterIndex);

  return (
    <article className="space-y-4 animate-slide-up">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link to={`/vocab/${grade}`} className="text-2xl text-ink-400 hover:text-ink-700 transition">←</Link>
        <div>
          <h1 className="font-black text-kidxl text-ink-900">🎬 {review.title}</h1>
          <p className="text-sm text-ink-400">
            {groupWords.map((w) => w.word).join(" · ")}
          </p>
        </div>
      </div>

      {/* 영상 영역 */}
      <div
        className="w-full aspect-video rounded-4xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #1e88e5 0%, #4ab50f 100%)",
          boxShadow: "0 8px 0 #0d3b7a",
        }}
      >
        {review.videoUrl ? (
          <video src={review.videoUrl} controls className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <div className="text-5xl opacity-60">📹</div>
            <p className="text-white/70 font-bold text-center">영상을 준비 중이에요<br />
              <span className="text-white/50 text-sm font-normal">추후 업데이트 예정</span>
            </p>
          </div>
        )}
      </div>

      {/* 복습 낱말 뱃지 */}
      <div className="flex flex-wrap gap-2">
        {groupWords.map((w) => (
          <span
            key={w.id}
            className="px-3 py-1.5 rounded-2xl text-sm font-black bg-sprout-100 text-sprout-700"
            style={{ boxShadow: "0 2px 0 #266607" }}
          >
            {w.word}
          </span>
        ))}
      </div>

      {/* 초성 퀴즈로 전환 버튼 */}
      {phase === "video" && (
        <button
          className="btn-primary w-full text-kidlg"
          onClick={() => setPhase("quiz")}
        >
          초성 퀴즈 시작 →
        </button>
      )}

      {/* 초성 퀴즈 */}
      {phase === "quiz" && (
        <div className="card">
          <h2 className="font-black text-kidlg text-ink-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky2-400/20 flex items-center justify-center text-lg">✍️</span>
            초성 퀴즈
          </h2>
          <ChosungQuiz items={review.chosungQuiz} onComplete={handleQuizComplete} />
        </div>
      )}

      {/* 완료 */}
      {phase === "done" && (
        <div className="card text-center space-y-4 py-6">
          <div className="text-7xl animate-bounce-in">🎉</div>
          <div className="font-black text-kidxl text-ink-900">다섯고개 통과!</div>
          <p className="text-ink-500">대단해! 계속 열심히 하자!</p>
          <button className="btn-primary w-full text-kidlg" onClick={handleDone}>
            {nextWord ? "계속 공부하기 →" : "목록으로 ✓"}
          </button>
        </div>
      )}
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
