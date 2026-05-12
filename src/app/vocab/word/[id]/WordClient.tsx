"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Link2, Star, Check } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { showToast, ToastProvider } from "@/components/ui/Toast";
import { loadWord, loadVocabGrade, gradeFromId } from "@/lib/content";
import { useProgress } from "@/hooks/useProgress";
import type { Word, Section } from "@/types/vocab";

const SECTION_STYLE: Record<string, { bg: string; line: string; ink: string; soft: string; label: string }> = {
  meet:     { bg: "var(--section-meet-bg)",    line: "var(--section-meet-line)",    ink: "var(--section-meet-ink)",    soft: "var(--section-meet-soft)",    label: "만나기" },
  think:    { bg: "var(--section-guess-bg)",   line: "var(--section-guess-line)",   ink: "var(--section-guess-ink)",   soft: "var(--section-guess-soft)",   label: "짐작하기" },
  learn:    { bg: "var(--section-explore-bg)", line: "var(--section-explore-line)", ink: "var(--section-explore-ink)", soft: "var(--section-explore-soft)", label: "더 알아보기" },
  practice: { bg: "var(--section-apply-bg)",   line: "var(--section-apply-line)",   ink: "var(--section-apply-ink)",   soft: "var(--section-apply-soft)",   label: "익히기" },
};

interface Props {
  id: string;
}

type GradeResult = { result: "correct" | "partial" | "incorrect"; feedback: string };

const GRADE_LABEL: Record<GradeResult["result"], string> = {
  correct: "잘 썼어요! 🎉",
  partial: "아쉬워요 💡",
  incorrect: "다시 생각해 봐요 📖",
};
const GRADE_STYLE: Record<GradeResult["result"], { bg: string; border: string; ink: string }> = {
  correct:   { bg: "var(--color-primary-50)", border: "var(--color-primary-200)", ink: "var(--color-primary-700)" },
  partial:   { bg: "#fffbe6",                border: "#ffe57f",                  ink: "#7a5b00" },
  incorrect: { bg: "#fff0ed",                border: "#ffb3a4",                  ink: "var(--color-danger)" },
};

function SectionContent({
  section,
  word,
  onCorrect,
}: {
  section: Section;
  word: Word;
  onCorrect?: () => void;
}) {
  const style = SECTION_STYLE[section.type] ?? SECTION_STYLE.meet;
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fwAnswer, setFwAnswer] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [blankResults, setBlankResults] = useState<boolean[] | null>(null);

  const correctIdx = section.activity?.correctIndex ?? -1;
  const answeredCorrectly = selected === correctIdx && correctIdx >= 0;

  function checkBlanks() {
    const answers = section.activity?.answers ?? [];
    setBlankResults(
      answers.map((ans, i) =>
        (blankAnswers[i] ?? "").trim().replace(/\s+/g, "") ===
        ans.trim().replace(/\s+/g, "")
      )
    );
  }

  async function handleGrade() {
    if (!fwAnswer.trim() || isGrading) return;
    setIsGrading(true);
    setGradeResult(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.word,
          definition: word.definition,
          prompt: section.activity?.prompt ?? "",
          answer: fwAnswer,
          grade: word.grade,
        }),
      });
      setGradeResult(await res.json());
    } catch {
      setGradeResult({ result: "incorrect", feedback: "채점 중 오류가 발생했어요. 다시 시도해 주세요." });
    } finally {
      setIsGrading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Eyebrow */}
      <div className="flex items-center gap-2">
        <span
          className="h-6 px-3 rounded-full text-[11px] font-bold uppercase tracking-[.06em]"
          style={{ background: style.bg, color: style.ink }}
        >
          {section.title}
        </span>
      </div>

      {/* Prompt */}
      {section.prompt && (
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-700)" }}>{section.prompt}</p>
      )}

      {/* Dialogue */}
      {section.dialogue && (
        <div className="flex flex-col gap-2">
          {section.dialogue.map((line, i) => (
            <div
              key={i}
              className="px-4 py-3 rounded-[14px] text-[14px] leading-relaxed"
              style={{ background: style.soft, border: `1px solid ${style.line}`, color: style.ink }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Learn section */}
      {section.type === "learn" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-[14px]" style={{ background: style.soft, border: `1px solid ${style.line}` }}>
            <p className="text-[15px] font-bold mb-2" style={{ color: style.ink }}>뜻</p>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-700)" }}>{word.definition}</p>
          </div>
          {word.examples.length > 0 && (
            <div className="p-4 rounded-[14px]" style={{ background: "var(--bg-muted)" }}>
              <p className="text-[13px] font-bold mb-2" style={{ color: "var(--ink-500)" }}>예문</p>
              {word.examples.map((ex, i) => (
                <p key={i} className="text-[14px] leading-relaxed" style={{ color: "var(--ink-700)" }}>· {ex}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity: multipleChoice */}
      {section.activity?.kind === "multipleChoice" && section.activity.options && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink-700)" }}>{section.activity.prompt}</p>
          {section.activity.options.map((opt, i) => {
            const isCorrect = i === correctIdx;
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => {
                  if (answeredCorrectly) return; // 정답 확정 후 잠금
                  setSelected(i);
                  if (isCorrect) onCorrect?.();
                }}
                className="w-full px-4 py-3 rounded-[14px] text-left text-[14px] font-semibold transition-all duration-150"
                style={{
                  background: isSelected
                    ? isCorrect ? "var(--color-primary-100)" : "#ffe1da"
                    : "var(--bg-surface)",
                  border: `1.5px solid ${
                    isSelected
                      ? isCorrect ? "var(--color-primary-400)" : "#f0b3a4"
                      : "var(--ink-200)"
                  }`,
                  color: isSelected
                    ? isCorrect ? "var(--color-primary-700)" : "var(--color-danger)"
                    : "var(--ink-700)",
                  opacity: answeredCorrectly && !isSelected ? 0.45 : 1,
                  fontFamily: "var(--font-sans)",
                  cursor: answeredCorrectly ? "default" : "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}

          {/* 정오답 피드백 */}
          {selected !== null && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-[14px] mt-0.5"
              style={
                answeredCorrectly
                  ? { background: "var(--color-primary-50)", border: "1px solid var(--color-primary-200)" }
                  : { background: "#fff0ed", border: "1px solid #ffb3a4" }
              }
            >
              <span className="text-[20px] leading-none mt-0.5">{answeredCorrectly ? "🎉" : "🤔"}</span>
              <div className="flex flex-col gap-0.5">
                <p
                  className="text-[13px] font-bold"
                  style={{ color: answeredCorrectly ? "var(--color-primary-700)" : "var(--color-danger)" }}
                >
                  {answeredCorrectly ? "정답이에요!" : "아쉬워요, 다시 골라 보세요"}
                </p>
                {!answeredCorrectly && (
                  <p className="text-[12px]" style={{ color: "var(--ink-600)" }}>
                    다른 보기를 눌러 다시 시도해 보세요.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity: freeWrite + AI 채점 */}
      {section.activity?.kind === "freeWrite" && (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink-700)" }}>{section.activity.prompt}</p>
          <textarea
            className="w-full p-4 rounded-[14px] text-[15px] resize-none outline-none transition-colors"
            rows={4}
            placeholder="여기에 자유롭게 써 보세요..."
            value={fwAnswer}
            onChange={(e) => { setFwAnswer(e.target.value); setGradeResult(null); }}
            disabled={isGrading}
            style={{
              border: `1.5px solid ${gradeResult ? GRADE_STYLE[gradeResult.result].border : "var(--ink-200)"}`,
              background: "var(--bg-surface)",
              color: "var(--ink-900)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.6,
            }}
          />

          {/* 채점 결과 */}
          {gradeResult && (
            <div
              className="flex gap-3 items-start px-4 py-3 rounded-[14px]"
              style={{
                background: GRADE_STYLE[gradeResult.result].bg,
                border: `1px solid ${GRADE_STYLE[gradeResult.result].border}`,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-bold" style={{ color: GRADE_STYLE[gradeResult.result].ink }}>
                  {GRADE_LABEL[gradeResult.result]}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
                  {gradeResult.feedback}
                </p>
              </div>
            </div>
          )}

          {/* 채점 버튼 */}
          <button
            onClick={handleGrade}
            disabled={!fwAnswer.trim() || isGrading}
            className="self-start h-10 px-5 rounded-full text-[13px] font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: style.ink, color: "white", fontFamily: "var(--font-sans)" }}
          >
            {isGrading ? "채점 중..." : "AI 채점하기"}
          </button>
        </div>
      )}

      {/* Activity: fillBlank — ___ 위치에 인라인 입력 */}
      {section.activity?.kind === "fillBlank" && (() => {
        const act = section.activity!;
        // blanks 필드가 없으면 prompt를 빈칸 문장으로 사용
        const hasBlanks = (act.blanks?.length ?? 0) > 0;
        const sentences: string[] = hasBlanks
          ? act.blanks!
          : act.prompt?.includes("___") ? [act.prompt] : [];
        if (sentences.length === 0) return null;
        return (
        <div className="flex flex-col gap-3">
          {/* blanks 필드가 있을 때만 prompt를 문맥 레이블로 표시 */}
          {hasBlanks && act.prompt && (
            <p className="text-[14px] font-semibold" style={{ color: "var(--ink-700)" }}>{act.prompt}</p>
          )}
          {sentences.map((blank, i) => {
            const parts = blank.split("___");
            const isChecked = blankResults !== null;
            const isCorrect = blankResults?.[i] ?? false;
            return (
              <div
                key={i}
                className="px-4 py-3.5 rounded-[14px]"
                style={{
                  background: style.soft,
                  border: `1.5px solid ${isChecked ? (isCorrect ? "var(--color-primary-300)" : "#f0b3a4") : style.line}`,
                }}
              >
                <p className="text-[15px] leading-loose flex flex-wrap items-baseline" style={{ color: "var(--ink-700)" }}>
                  {parts.map((part, pi) => (
                    <span key={pi}>
                      {part}
                      {pi < parts.length - 1 && (
                        <input
                          className="outline-none text-center font-bold bg-transparent"
                          style={{
                            width: `${Math.max(5, (blankAnswers[i]?.length ?? 0) + 3)}ch`,
                            borderBottom: `2px solid ${isChecked ? (isCorrect ? "var(--color-primary-500)" : "var(--color-danger)") : style.ink}`,
                            color: style.ink,
                            fontFamily: "var(--font-sans)",
                            fontSize: "15px",
                            margin: "0 2px",
                          }}
                          value={blankAnswers[i] ?? ""}
                          onChange={(e) => {
                            const next = [...blankAnswers];
                            next[i] = e.target.value;
                            setBlankAnswers(next);
                            setBlankResults(null);
                          }}
                          placeholder="　　　"
                        />
                      )}
                    </span>
                  ))}
                </p>
                {isChecked && (
                  <p className="text-[12px] font-bold mt-1.5" style={{ color: isCorrect ? "var(--color-primary-700)" : "var(--color-danger)" }}>
                    {isCorrect ? "🎉 정답이에요!" : "🤔 아쉬워요, 다시 써 보세요"}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2">
            <button
              onClick={checkBlanks}
              disabled={!blankAnswers.some((a) => a.trim())}
              className="h-9 px-4 rounded-full text-[13px] font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: style.ink, color: "white", fontFamily: "var(--font-sans)" }}
            >
              확인
            </button>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="h-9 px-4 rounded-full text-[13px] font-bold transition-all"
              style={{
                background: showAnswer ? style.bg : "var(--bg-muted)",
                color: showAnswer ? style.ink : "var(--ink-500)",
                border: "0",
                fontFamily: "var(--font-sans)",
              }}
            >
              {showAnswer ? "답 숨기기" : "예시 답 보기"}
            </button>
          </div>

          {showAnswer && section.activity.answers && (
            <div className="p-4 rounded-[14px]" style={{ background: style.bg, border: `1px solid ${style.line}` }}>
              <p className="text-[12px] font-bold mb-1" style={{ color: style.ink }}>예시 답</p>
              {section.activity.answers.map((ans, i) => (
                <p key={i} className="text-[14px] font-semibold" style={{ color: style.ink }}>{ans}</p>
              ))}
            </div>
          )}
        </div>
        );
      })()}

      {/* Similar words */}
      {section.type === "learn" && word.similarWords && word.similarWords.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold" style={{ color: "var(--ink-500)" }}>비슷한 말</p>
          <div className="flex flex-wrap gap-2">
            {word.similarWords.map((sw) => (
              <span
                key={sw}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold"
                style={{ background: style.bg, color: style.ink }}
              >
                {sw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WordClient({ id }: Props) {
  const router = useRouter();
  const grade = gradeFromId(id);
  const { progress, toggleFavorite, toggleCompleted, markViewed } = useProgress(id);

  const [word, setWord] = useState<Word | null>(null);
  const [step, setStep] = useState(0);
  const [answeredSteps, setAnsweredSteps] = useState<Set<number>>(new Set());
  const [nextId, setNextId] = useState<string | null>(null);

  function needsAnswer(idx: number, secs: Word["sections"]): boolean {
    const s = secs[idx];
    return s?.type === "think" && s.activity?.kind === "multipleChoice";
  }

  function canAdvance(idx: number, secs: Word["sections"]): boolean {
    return !needsAnswer(idx, secs) || answeredSteps.has(idx);
  }

  useEffect(() => {
    loadWord(grade, id).then((w) => {
      if (w) { setWord(w); markViewed(); }
    });
    loadVocabGrade(grade).then((items) => {
      const words = items.filter((i) => i.itemType === "word");
      const idx = words.findIndex((w) => w.id === id);
      setNextId(idx !== -1 && idx < words.length - 1 ? words[idx + 1].id : null);
    });
  }, [id, grade, markViewed]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    showToast("링크를 복사했어요!");
  }

  if (!word) {
    return (
      <PhoneShell>
        <div className="flex items-center justify-center flex-1 text-sm" style={{ color: "var(--ink-400)" }}>
          불러오는 중...
        </div>
      </PhoneShell>
    );
  }

  const sections = word.sections;
  const currentSection = sections[step] as Section | undefined;
  const sectionStyle = currentSection ? (SECTION_STYLE[currentSection.type] ?? SECTION_STYLE.meet) : SECTION_STYLE.meet;

  return (
    <PhoneShell>
      <ToastProvider />

      {/* Top nav */}
      <nav className="flex items-center justify-between gap-2 px-3.5 py-2">
        <IconButton onClick={() => router.back()} aria-label="뒤로">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </IconButton>
        <span className="text-[15px] font-bold" style={{ color: "var(--ink-500)" }}>{grade}학년</span>
        <div className="flex gap-1.5">
          <IconButton onClick={copyLink} aria-label="링크 복사">
            <Link2 size={18} strokeWidth={2.2} />
          </IconButton>
          <IconButton variant={progress.favorite ? "fav" : "default"} onClick={toggleFavorite} aria-label={progress.favorite ? "즐겨찾기 해제" : "즐겨찾기"}>
            <Star size={18} strokeWidth={2} fill={progress.favorite ? "currentColor" : "none"} />
          </IconButton>
          <IconButton variant={progress.completed ? "done" : "default"} onClick={toggleCompleted} aria-label={progress.completed ? "완료 취소" : "완료 표시"}>
            <Check size={18} strokeWidth={2.6} />
          </IconButton>
        </div>
      </nav>

      {/* Word headline */}
      <div className="px-5 pb-4 pt-1 text-center flex flex-col gap-1">
        <h1 className="text-[36px] font-extrabold leading-none" style={{ letterSpacing: "-.03em" }}>{word.word}</h1>
        <p className="text-[14px] leading-snug px-4" style={{ color: "var(--ink-500)" }}>{word.definition}</p>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 pb-4">
        {sections.map((_, i) => {
          const s = SECTION_STYLE[sections[i].type] ?? SECTION_STYLE.meet;
          const blocked = i > step && !canAdvance(step, sections);
          return (
            <button
              key={i}
              onClick={() => { if (!blocked) setStep(i); }}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i === step ? s.ink : "var(--ink-200)",
                opacity: blocked ? 0.35 : 1,
                cursor: blocked ? "not-allowed" : "pointer",
              }}
              aria-label={`${i + 1}번째 섹션`}
            />
          );
        })}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-28">
        {currentSection && (
          <SectionContent
            section={currentSection}
            word={word}
            onCorrect={
              needsAnswer(step, sections)
                ? () => setAnsweredSteps((prev) => new Set([...prev, step]))
                : undefined
            }
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-3.5 flex gap-3"
        style={{ background: "linear-gradient(180deg, rgba(251,250,247,0) 0%, var(--bg-app) 30%)" }}
      >
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-[52px] flex-1 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{
            background: "var(--bg-surface)",
            border: "1.5px solid var(--ink-200)",
            color: "var(--ink-700)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} /> 이전
        </button>
        {step < sections.length - 1 ? (
          <button
            onClick={() => { if (canAdvance(step, sections)) setStep((s) => s + 1); }}
            disabled={!canAdvance(step, sections)}
            className="h-[52px] flex-1 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canAdvance(step, sections) ? sectionStyle.ink : "var(--ink-300)",
              color: "white",
              fontFamily: "var(--font-sans)",
            }}
          >
            {canAdvance(step, sections) ? (
              <>다음 <ChevronRight size={18} strokeWidth={2.4} /></>
            ) : (
              <>정답을 먼저 선택해요</>
            )}
          </button>
        ) : progress.completed ? (
          // 완료 후 → 다음 어휘 or 목록으로
          nextId ? (
            <button
              onClick={() => router.push(`/vocab/word/${nextId}`)}
              className="h-[52px] flex-1 rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
              style={{
                background: "var(--color-primary-500)",
                boxShadow: "0 4px 0 var(--color-primary-700)",
                fontFamily: "var(--font-sans)",
              }}
            >
              다음 어휘 <ChevronRight size={18} strokeWidth={2.4} />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/vocab/grade/${grade}`)}
              className="h-[52px] flex-1 rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
              style={{
                background: "var(--color-primary-500)",
                boxShadow: "0 4px 0 var(--color-primary-700)",
                fontFamily: "var(--font-sans)",
              }}
            >
              목록으로 <ChevronRight size={18} strokeWidth={2.4} />
            </button>
          )
        ) : (
          <button
            onClick={toggleCompleted}
            className="h-[52px] flex-1 rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
            style={{
              background: "var(--color-primary-500)",
              boxShadow: "0 4px 0 var(--color-primary-700)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Check size={18} strokeWidth={2.6} /> 학습 완료
          </button>
        )}
      </div>
    </PhoneShell>
  );
}
