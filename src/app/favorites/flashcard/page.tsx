"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { storage } from "@/lib/storage";
import { loadWord, gradeFromId } from "@/lib/content";

interface FlashCard {
  id: string;
  word: string;
  pos: string;
  definition: string;
  examples: string[];
  grade: number;
}

const GRADE_COLORS: Record<number, { soft: string; ink: string; line: string; bg: string }> = {
  1: { soft: "var(--section-meet-soft)",    ink: "var(--section-meet-ink)",    line: "var(--section-meet-line)",    bg: "var(--section-meet-bg)" },
  2: { soft: "var(--section-guess-soft)",   ink: "var(--section-guess-ink)",   line: "var(--section-guess-line)",   bg: "var(--section-guess-bg)" },
  3: { soft: "var(--section-explore-soft)", ink: "var(--section-explore-ink)", line: "var(--section-explore-line)", bg: "var(--section-explore-bg)" },
  4: { soft: "var(--section-apply-soft)",   ink: "var(--section-apply-ink)",   line: "var(--section-apply-line)",   bg: "var(--section-apply-bg)" },
  5: { soft: "var(--section-meet-soft)",    ink: "var(--section-meet-ink)",    line: "var(--section-meet-line)",    bg: "var(--section-meet-bg)" },
  6: { soft: "var(--section-guess-soft)",   ink: "var(--section-guess-ink)",   line: "var(--section-guess-line)",   bg: "var(--section-guess-bg)" },
};

export default function FlashcardPage() {
  const router = useRouter();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knows, setKnows] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    storage.getFavorites("v-").then(async (list) => {
      const wordFavs = list.filter((p) => !p.id.includes("-r"));
      const resolved = await Promise.all(
        wordFavs.map(async (p) => {
          const grade = gradeFromId(p.id);
          const w = await loadWord(grade, p.id);
          if (!w) return null;
          return {
            id: p.id,
            word: w.word,
            pos: w.pos ?? "",
            definition: w.definition,
            examples: w.examples,
            grade,
          };
        })
      );
      setCards(resolved.filter(Boolean) as FlashCard[]);
      setLoading(false);
    });
  }, []);

  const card = cards[current];
  const c = card ? (GRADE_COLORS[card.grade] ?? GRADE_COLORS[4]) : GRADE_COLORS[4];

  function handleFlip() {
    if (!flipped) setFlipped(true);
  }

  function handleResult(know: boolean) {
    if (know) setKnows((k) => k + 1);
    const next = current + 1;
    if (next >= cards.length) {
      setDone(true);
    } else {
      // key={current}로 인해 새 카드가 자동으로 unflipped 상태로 마운트됨
      setFlipped(false);
      setCurrent(next);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setFlipped(false);
    setKnows(0);
    setDone(false);
  }

  /* ── 로딩 ── */
  if (loading) {
    return (
      <PhoneShell>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--ink-400)" }}>
          불러오는 중...
        </div>
      </PhoneShell>
    );
  }

  /* ── 카드 없음 ── */
  if (cards.length === 0) {
    return (
      <PhoneShell>
        <div className="flex flex-col flex-1 items-center justify-center gap-4 px-8 text-center">
          <span className="text-[52px]">📚</span>
          <p className="text-lg font-bold" style={{ color: "var(--ink-900)" }}>즐겨찾기한 단어가 없어요</p>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>
            어휘 목록에서 ☆을 눌러<br />단어를 즐겨찾기에 추가해 보세요
          </p>
          <button
            onClick={() => router.back()}
            className="h-10 px-6 rounded-full text-sm font-bold text-white mt-2"
            style={{ background: "var(--color-primary-500)" }}
          >
            즐겨찾기로 돌아가기
          </button>
        </div>
      </PhoneShell>
    );
  }

  /* ── 완료 화면 ── */
  if (done) {
    const pct = Math.round((knows / cards.length) * 100);
    return (
      <PhoneShell>
        <div className="flex flex-col flex-1 items-center justify-center gap-6 px-6 text-center">
          <span className="text-[64px]">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📖"}</span>
          <div>
            <p className="text-[26px] font-extrabold" style={{ color: "var(--ink-900)", letterSpacing: "-.025em" }}>
              학습 완료!
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--ink-500)" }}>
              총 {cards.length}개 단어를 학습했어요
            </p>
          </div>

          {/* Score */}
          <div
            className="w-full rounded-[20px] p-5 flex justify-around"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--ink-200)", boxShadow: "var(--shadow-1)" }}
          >
            <div className="text-center">
              <p className="text-[34px] font-extrabold leading-none" style={{ color: "var(--color-primary-500)" }}>{knows}</p>
              <p className="text-xs font-bold mt-1.5" style={{ color: "var(--ink-500)" }}>알아요 ✓</p>
            </div>
            <div className="w-px self-stretch" style={{ background: "var(--ink-200)" }} />
            <div className="text-center">
              <p className="text-[34px] font-extrabold leading-none" style={{ color: "var(--color-danger)" }}>{cards.length - knows}</p>
              <p className="text-xs font-bold mt-1.5" style={{ color: "var(--ink-500)" }}>몰라요 😅</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button
              onClick={handleRestart}
              className="h-13 rounded-full font-bold text-white text-[15px] transition-transform active:scale-[.98]"
              style={{ background: "var(--color-primary-500)", boxShadow: "0 3px 0 var(--color-primary-700)" }}
            >
              다시 학습하기
            </button>
            <button
              onClick={() => router.back()}
              className="h-12 rounded-full font-semibold text-[14px] transition-transform active:scale-[.98]"
              style={{ background: "var(--bg-muted)", color: "var(--ink-700)" }}
            >
              즐겨찾기로
            </button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  /* ── 플래시카드 메인 ── */
  const progressPct = Math.round((current / cards.length) * 100);

  return (
    <PhoneShell>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full grid place-items-center transition-transform active:scale-90"
          style={{ background: "var(--bg-muted)", color: "var(--ink-700)" }}
          aria-label="닫기"
        >
          <X size={17} strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <p className="text-[14px] font-bold" style={{ color: "var(--ink-900)" }}>플래시카드</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--ink-400)" }}>
            {current + 1} / {cards.length}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-4 mb-1">
        <ProgressBar value={progressPct} height={4} />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full flashcard-wrap" style={{ height: "min(380px, 54dvh)" }}>
          <div
            key={current}
            className={`flashcard-inner rounded-[28px] cursor-pointer select-none${flipped ? " is-flipped" : ""}`}
            style={{ boxShadow: "var(--shadow-3)" }}
            onClick={handleFlip}
          >
            {/* Front */}
            <div
              className="flashcard-face flex flex-col items-center justify-center rounded-[28px] p-8 gap-3"
              style={{
                background: `linear-gradient(140deg, ${c.soft}, #ffffff)`,
                border: `1.5px solid ${c.line}`,
              }}
            >
              <span
                className="text-[11px] font-bold uppercase tracking-[.1em]"
                style={{ color: c.ink, opacity: 0.6 }}
              >
                {card.grade}학년
              </span>
              <span
                className="text-[42px] font-extrabold leading-tight text-center"
                style={{ color: c.ink, letterSpacing: "-.03em" }}
              >
                {card.word}
              </span>
              <span
                className="text-[12px] font-semibold mt-auto"
                style={{ color: c.ink, opacity: 0.35 }}
              >
                탭하여 확인
              </span>
            </div>

            {/* Back */}
            <div
              className="flashcard-face flashcard-back flex flex-col rounded-[28px] p-6 gap-3 overflow-y-auto"
              style={{ background: "var(--bg-surface)", border: "1.5px solid var(--ink-200)" }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {card.pos && (
                  <span
                    className="h-[22px] px-2.5 rounded-full text-[11px] font-bold inline-flex items-center"
                    style={{ background: c.bg, color: c.ink }}
                  >
                    {card.pos}
                  </span>
                )}
                <span
                  className="h-[22px] px-2 rounded-full text-[11px] font-semibold inline-flex items-center"
                  style={{ background: "var(--bg-muted)", color: "var(--ink-500)" }}
                >
                  {card.grade}학년
                </span>
              </div>
              <p
                className="text-[28px] font-extrabold leading-tight"
                style={{ color: "var(--ink-900)", letterSpacing: "-.025em" }}
              >
                {card.word}
              </p>
              <p className="text-[14px] leading-relaxed flex-1" style={{ color: "var(--ink-700)" }}>
                {card.definition}
              </p>
              {card.examples.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: "var(--ink-100)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[.08em] mb-1.5" style={{ color: "var(--ink-400)" }}>
                    예시
                  </p>
                  <p className="text-[13px] font-medium" style={{ color: "var(--ink-600)" }}>
                    {card.examples[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-8 pt-5" style={{ minHeight: "104px" }}>
        {flipped ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleResult(false)}
              className="flex-1 h-14 rounded-[16px] font-bold text-[15px] transition-transform active:scale-95"
              style={{
                background: "var(--section-meet-soft)",
                border: "1.5px solid var(--section-meet-line)",
                color: "var(--section-meet-ink)",
              }}
            >
              몰라요 😅
            </button>
            <button
              onClick={() => handleResult(true)}
              className="flex-1 h-14 rounded-[16px] font-bold text-[15px] text-white transition-transform active:scale-95"
              style={{
                background: "var(--color-primary-500)",
                boxShadow: "0 3px 0 var(--color-primary-700)",
              }}
            >
              알아요 ✓
            </button>
          </div>
        ) : (
          <p className="text-center text-[12px] font-semibold pt-2" style={{ color: "var(--ink-300)" }}>
            카드를 탭하면 뜻이 보여요
          </p>
        )}
      </div>
    </PhoneShell>
  );
}
