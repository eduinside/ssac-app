"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Link2, Star, Check, Play, AlertCircle } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { showToast, ToastProvider } from "@/components/ui/Toast";
import { loadReview, gradeFromId } from "@/lib/content";
import { useProgress } from "@/hooks/useProgress";
import type { Review, QuizItem } from "@/types/vocab";

type QuizStatus = "pending" | "correct" | "wrong";

interface QuizState {
  value: string;
  status: QuizStatus;
  showHint: boolean;
}

interface Props {
  id: string;
}

export default function ReviewClient({ id }: Props) {
  const router = useRouter();
  const grade = gradeFromId(id);
  const { progress, toggleFavorite, toggleCompleted } = useProgress(id);

  const [review, setReview] = useState<Review | null>(null);
  const [quizStates, setQuizStates] = useState<QuizState[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    loadReview(grade, id).then((r) => {
      if (r) {
        setReview(r);
        setQuizStates(r.quizzes.map(() => ({ value: "", status: "pending", showHint: false })));
      }
    });
  }, [id, grade]);

  function handleInput(index: number, value: string) {
    setQuizStates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value, status: "pending" };
      return next;
    });
    if (checked) setChecked(false);
  }

  function checkAnswers() {
    if (!review) return;
    setChecked(true);
    setQuizStates((prev) =>
      prev.map((qs, i) => ({
        ...qs,
        status: qs.value.trim() === review.quizzes[i].answer ? "correct" : "wrong",
      }))
    );
  }

  function showHint(index: number) {
    setQuizStates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], showHint: true };
      return next;
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    showToast("링크를 복사했어요!");
  }

  const answeredCount = quizStates.filter((s) => s.value.trim()).length;
  const correctCount = quizStates.filter((s) => s.status === "correct").length;
  const allCorrect = checked && review && correctCount === review.quizzes.length;

  if (!review) {
    return (
      <PhoneShell>
        <div className="flex items-center justify-center flex-1 text-sm" style={{ color: "var(--ink-400)" }}>
          불러오는 중...
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <ToastProvider />

      {/* Top nav */}
      <nav className="flex items-center justify-between gap-2 px-3.5 py-2 pb-2.5">
        <IconButton onClick={() => router.back()} aria-label="뒤로">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </IconButton>
        <div className="flex gap-1.5">
          <IconButton onClick={copyLink} aria-label="링크 복사">
            <Link2 size={18} strokeWidth={2.2} />
          </IconButton>
          <IconButton
            variant={progress.favorite ? "fav" : "default"}
            onClick={toggleFavorite}
            aria-label={progress.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
          >
            <Star size={18} strokeWidth={2} fill={progress.favorite ? "currentColor" : "none"} />
          </IconButton>
          <IconButton
            variant={progress.completed ? "done" : "default"}
            onClick={toggleCompleted}
            aria-label={progress.completed ? "완료 취소" : "완료 표시"}
          >
            <Check size={18} strokeWidth={2.6} />
          </IconButton>
        </div>
      </nav>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-[18px] pb-28 flex flex-col gap-[18px]">

        {/* Title block */}
        <header className="flex flex-col gap-1.5 pt-1">
          <span
            className="self-start inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-[.06em]"
            style={{ background: "var(--section-explore-bg)", color: "var(--section-explore-ink)" }}
          >
            <Play size={11} fill="currentColor" /> 다섯고개 · 복습
          </span>
          <h1 className="text-[26px] font-extrabold leading-tight" style={{ letterSpacing: "-.025em" }}>
            {review.title}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--ink-500)" }}>
            {review.coversPages} 다시보기 · {grade}학년 어휘싹
          </p>
        </header>

        {/* Video placeholder */}
        <div
          className="relative aspect-video rounded-[20px] overflow-hidden cursor-pointer"
          style={{
            background: "linear-gradient(140deg, #1f8554 0%, #16785f 50%, #1c4a4a 100%)",
            boxShadow: "var(--shadow-2)",
          }}
          role="button"
          tabIndex={0}
          aria-label="영상 재생"
        >
          {/* film strip texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 2px, transparent 2px 12px)" }}
          />
          <span
            className="absolute left-3.5 top-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.06em] text-white px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,.32)", backdropFilter: "blur(6px)" }}
          >
            <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="12" rx="2"/>
              <path d="M10 9l5 3-5 3z" fill="currentColor"/>
            </svg>
            영상 보기
          </span>
          <span
            className="absolute right-3.5 top-3 text-[11px] font-bold text-white px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,.32)", backdropFilter: "blur(6px)", fontVariantNumeric: "tabular-nums" }}
          >
            04:32
          </span>
          {/* Play button */}
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full grid place-items-center bg-white/95"
            style={{ color: "var(--section-explore-ink)", boxShadow: "0 14px 36px rgba(0,0,0,.30)" }}
          >
            <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />
          </span>
          {/* Caption */}
          <div className="absolute left-3.5 bottom-3 right-3.5 flex items-center justify-between text-white text-[12px] font-semibold">
            <span className="opacity-90 truncate">
              {review.coversItems.slice(0, 4).join(" · ")}
            </span>
            <span className="flex items-center gap-1 opacity-85">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#b8f0d8", boxShadow: "0 0 8px rgba(184,240,216,.8)" }} />
              HD
            </span>
          </div>
        </div>

        {/* Quiz section */}
        <div className="flex items-baseline justify-between pt-1.5">
          <h2 className="text-[17px] font-bold" style={{ letterSpacing: "-.015em" }}>초성 퀴즈</h2>
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-500)" }}>
            {review.quizzes.length} / {review.quizzes.length} 문제
          </span>
        </div>
        <p className="text-[13px] -mt-4" style={{ color: "var(--ink-500)", lineHeight: 1.55 }}>
          초성을 보고 어휘를 떠올려 적어 보세요. 정답 확인 버튼을 누르면 한 번에 채점돼요.
        </p>

        {/* Quiz cards */}
        {review.quizzes.map((quiz: QuizItem, idx: number) => {
          const qs = quizStates[idx];
          if (!qs) return null;
          const isCorrect = qs.status === "correct";
          const isWrong = qs.status === "wrong";

          return (
            <article
              key={idx}
              className="rounded-[20px] p-4 pb-3.5 flex flex-col gap-3 transition-all duration-200"
              style={{
                background: isCorrect
                  ? "linear-gradient(180deg, #fff 0%, var(--color-primary-50) 100%)"
                  : isWrong
                  ? "linear-gradient(180deg, #fff 0%, #fff3ef 100%)"
                  : "var(--bg-surface)",
                border: `1px solid ${isCorrect ? "var(--color-primary-300)" : isWrong ? "#f0b3a4" : "var(--ink-200)"}`,
                boxShadow: "var(--shadow-1)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-[26px] h-[26px] rounded-[8px] grid place-items-center text-[13px] font-extrabold"
                    style={{ background: "var(--section-explore-bg)", color: "var(--section-explore-ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: "var(--ink-500)" }}>문제 {idx + 1}</span>
                </div>
                <span
                  className="w-7 h-7 rounded-full grid place-items-center"
                  style={{
                    background: isCorrect ? "var(--color-primary-100)" : isWrong ? "#ffe1da" : "var(--bg-muted)",
                    color: isCorrect ? "var(--color-primary-700)" : isWrong ? "var(--color-danger)" : "var(--ink-400)",
                    boxShadow: (!isCorrect && !isWrong) ? "inset 0 0 0 1px var(--ink-200)" : "none",
                  }}
                >
                  {isCorrect ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isWrong ? (
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Chosung display */}
              <div
                className="flex items-center justify-center gap-3.5 py-4 px-2 rounded-[14px]"
                style={{
                  background: "radial-gradient(120% 100% at 50% 0%, var(--section-explore-soft) 0%, transparent 70%), var(--bg-muted)",
                  border: "1px dashed var(--section-explore-line)",
                }}
                aria-label={`초성: ${quiz.hint}`}
              >
                {quiz.hint.split("").map((ch, ci) => (
                  <span
                    key={ci}
                    className="text-[40px] font-extrabold leading-none"
                    style={{ letterSpacing: "-.02em", color: "var(--ink-900)" }}
                  >
                    {ch}
                  </span>
                ))}
              </div>

              {/* Input */}
              <input
                type="text"
                value={qs.value}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") checkAnswers(); }}
                placeholder="어휘를 입력해 보세요"
                className="w-full h-[50px] px-4 rounded-[14px] text-[18px] font-semibold outline-none transition-all duration-200"
                style={{
                  border: `1.5px solid ${isCorrect ? "var(--color-primary-300)" : isWrong ? "#f0b3a4" : "var(--ink-200)"}`,
                  background: isCorrect ? "var(--color-primary-50)" : isWrong ? "#fff3ef" : "var(--bg-surface)",
                  color: isCorrect ? "var(--color-primary-700)" : isWrong ? "var(--color-danger)" : "var(--ink-900)",
                  fontFamily: "var(--font-sans)",
                }}
                readOnly={isCorrect}
                aria-label={`문제 ${idx + 1} 답`}
              />

              {/* Helper text */}
              <div className="flex items-center gap-1.5 text-[12px] font-semibold min-h-[16px]"
                style={{ color: isCorrect ? "var(--color-primary-700)" : isWrong ? "var(--color-danger)" : "var(--ink-500)" }}>
                {isCorrect && (
                  <>
                    <Check size={12} strokeWidth={2.4} />
                    잘했어요! 정답이에요.
                  </>
                )}
                {isWrong && (
                  <>
                    <AlertCircle size={12} strokeWidth={2.4} />
                    비슷하지만 다른 어휘예요.{" "}
                    {!qs.showHint ? (
                      <button
                        onClick={() => showHint(idx)}
                        className="underline underline-offset-[2px] font-bold cursor-pointer border-0 bg-transparent p-0"
                        style={{ color: "var(--section-explore-ink)", fontFamily: "inherit" }}
                      >
                        힌트 보기
                      </button>
                    ) : (
                      <span style={{ color: "var(--section-explore-ink)" }}>정답: {quiz.answer}</span>
                    )}
                  </>
                )}
                {qs.status === "pending" && !qs.value && (
                  <span>
                    {quiz.answer.length}글자 어휘
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {allCorrect && (
          <div
            className="rounded-[20px] p-4 text-center"
            style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-200)" }}
          >
            <p className="text-[18px] font-extrabold" style={{ color: "var(--color-primary-700)" }}>🎉 모두 정답!</p>
            <p className="text-[14px] mt-1" style={{ color: "var(--color-primary-600)" }}>이번 다섯고개를 완료했어요</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="absolute left-0 right-0 bottom-0 px-[18px] pb-6 pt-3.5"
        style={{ background: "linear-gradient(180deg, rgba(251,250,247,0) 0%, var(--bg-app) 30%)" }}
      >
        <button
          onClick={checkAnswers}
          className="w-full h-[56px] rounded-full text-white font-bold text-base flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
          style={{
            background: "var(--section-explore-ink)",
            boxShadow: "0 4px 0 #0e5949, var(--shadow-pop)",
            fontFamily: "var(--font-sans)",
          }}
        >
          정답 확인
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold"
            style={{ background: "rgba(255,255,255,.18)", fontVariantNumeric: "tabular-nums" }}
          >
            {answeredCount} / {review.quizzes.length}
          </span>
        </button>
      </div>
    </PhoneShell>
  );
}
