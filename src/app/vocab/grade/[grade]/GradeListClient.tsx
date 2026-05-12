"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Check, Star, ChevronRight, Play, ArrowRight } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { loadVocabGrade, gradeColor } from "@/lib/content";
import { storage } from "@/lib/storage";
import type { ListItem, Word, Review, Progress } from "@/types/vocab";

const SECTION_COLORS: Record<string, { soft: string; ink: string; line: string; bg: string }> = {
  meet:    { soft: "var(--section-meet-soft)",    ink: "var(--section-meet-ink)",    line: "var(--section-meet-line)",    bg: "var(--section-meet-bg)" },
  guess:   { soft: "var(--section-guess-soft)",   ink: "var(--section-guess-ink)",   line: "var(--section-guess-line)",   bg: "var(--section-guess-bg)" },
  explore: { soft: "var(--section-explore-soft)", ink: "var(--section-explore-ink)", line: "var(--section-explore-line)", bg: "var(--section-explore-bg)" },
  apply:   { soft: "var(--section-apply-soft)",   ink: "var(--section-apply-ink)",   line: "var(--section-apply-line)",   bg: "var(--section-apply-bg)" },
};

interface Props {
  grade: number;
}

export default function GradeListClient({ grade }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ListItem[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  const color = gradeColor(grade);
  const c = SECTION_COLORS[color];

  useEffect(() => {
    loadVocabGrade(grade)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [grade]);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);
    Promise.all(ids.map((id) => storage.getProgress(id))).then((results) => {
      const map: Record<string, Progress> = {};
      results.forEach((p, i) => {
        if (p) map[ids[i]] = p;
      });
      setProgress(map);
    });
  }, [items]);

  async function toggleFavorite(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const cur = progress[id];
    const next = !cur?.favorite;
    setProgress((p) => ({ ...p, [id]: { id, favorite: next, completed: cur?.completed ?? false } }));
    await storage.setProgress(id, { favorite: next });
  }

  async function toggleCompleted(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const cur = progress[id];
    const next = !cur?.completed;
    setProgress((p) => ({ ...p, [id]: { id, completed: next, favorite: cur?.favorite ?? false } }));
    await storage.setProgress(id, { completed: next, completedAt: next ? new Date().toISOString() : undefined });
  }

  const words = items.filter((i): i is Word => i.itemType === "word");
  const reviews = items.filter((i): i is Review => i.itemType === "review");
  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // find first incomplete word for "continue" button
  const nextIncomplete = words.find((w) => !progress[w.id]?.completed);

  return (
    <PhoneShell>
      {/* Top nav */}
      <nav className="grid items-center gap-2 px-4 py-2" style={{ gridTemplateColumns: "40px 1fr 40px" }}>
        <IconButton onClick={() => router.back()} aria-label="뒤로">
          <ChevronLeft size={20} strokeWidth={2.4} />
        </IconButton>
        <p className="text-center text-[17px] font-bold" style={{ letterSpacing: "-.02em", color: c.ink }}>
          {grade}학년 어휘싹
        </p>
        <Link href="/search">
          <IconButton aria-label="검색"><Search size={19} strokeWidth={2.2} /></IconButton>
        </Link>
      </nav>

      {/* Progress hero */}
      <section
        className="mx-4 mb-3.5 rounded-[28px] p-[18px] pb-4 relative overflow-hidden"
        style={{
          background: `radial-gradient(140% 100% at 100% 0%, ${c.line}44 0%, transparent 55%), linear-gradient(160deg, #fff 0%, ${c.soft} 100%)`,
          border: `1px solid ${c.line}`,
          boxShadow: "var(--shadow-1)",
        }}
      >
        <span className="absolute right-[-40px] top-[-40px] w-[140px] h-[140px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${c.bg}44, transparent 70%)` }} />
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: c.ink }}>학습 진도</span>
          <div className="flex items-baseline gap-1" style={{ color: c.ink }}>
            <b className="text-[26px] font-extrabold leading-none" style={{ letterSpacing: "-.03em" }}>{completedCount}</b>
            <span className="text-[14px] font-bold opacity-65">/ {totalCount}</span>
          </div>
        </div>
        <ProgressBar value={pct} height={10} color={c.ink} bgColor="rgba(255,255,255,.7)" />
        <div className="flex justify-between items-baseline mt-2" style={{ fontSize: "12px", color: "var(--ink-700)", fontWeight: 600 }}>
          <span>어휘 {words.length} · 다섯고개 {reviews.length}</span>
          <span style={{ color: c.ink }}>{pct}% 완료</span>
        </div>
      </section>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-24 flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--ink-400)" }}>
            불러오는 중...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2 px-1">
              <h2 className="text-[13px] font-bold uppercase tracking-[.04em]" style={{ color: "var(--ink-500)" }}>교재 순서</h2>
            </div>

            {items.map((item) => {
              const p = progress[item.id];
              const isDone = p?.completed ?? false;
              const isFav = p?.favorite ?? false;

              if (item.itemType === "review") {
                return (
                  <Link key={item.id} href={`/vocab/review/${item.id}`} className="no-underline">
                    <div
                      className="grid items-center gap-3 p-2.5 pr-3.5 rounded-[14px] cursor-pointer transition-all duration-[120ms] active:scale-[.995]"
                      style={{
                        gridTemplateColumns: "56px 1fr auto",
                        background: "linear-gradient(120deg, var(--section-explore-soft) 0%, #fff 100%)",
                        border: "1px solid var(--section-explore-line)",
                        boxShadow: "var(--shadow-1)",
                      }}
                    >
                      {/* Thumb */}
                      <div
                        className="w-14 h-14 rounded-[14px] grid place-items-center text-white relative"
                        style={{
                          background: "linear-gradient(135deg, var(--section-explore-line), var(--section-explore-ink))",
                          boxShadow: "0 2px 6px rgba(22,120,95,.25)",
                        }}
                      >
                        <Play size={22} fill="currentColor" />
                        <span className="absolute inset-1 rounded-[10px] border border-dashed border-white/40 pointer-events-none" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-[.04em]" style={{ color: "var(--section-explore-ink)" }}>
                          다섯고개 · 복습
                        </span>
                        <span className="text-[16px] font-bold" style={{ color: "var(--ink-900)", letterSpacing: "-.01em" }}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--section-explore-ink)" }}>
                          <span>{item.quizzes.length}문항</span>
                          <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--section-explore-line)" }} />
                          <span>약 {Math.ceil(item.quizzes.length * 1.5)}분</span>
                          <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--section-explore-line)" }} />
                          <span>{item.page}쪽</span>
                        </div>
                      </div>
                      <span style={{ color: "var(--section-explore-ink)", opacity: .7 }}>
                        <ChevronRight size={18} strokeWidth={2.4} />
                      </span>
                    </div>
                  </Link>
                );
              }

              // Word row
              const wordItem = item as Word;
              return (
                <Link key={item.id} href={`/vocab/word/${item.id}`} className="no-underline">
                  <div
                    className="grid items-center gap-3 min-h-[64px] px-3.5 py-2.5 rounded-[14px] cursor-pointer transition-all duration-[120ms] active:scale-[.995]"
                    style={{
                      gridTemplateColumns: "36px 1fr auto",
                      background: isDone ? "var(--color-primary-50)" : "var(--bg-surface)",
                      border: `1px solid ${isDone ? "var(--color-primary-200)" : "var(--ink-200)"}`,
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    {/* Number */}
                    <div
                      className="w-8 h-8 rounded-[10px] grid place-items-center text-[14px] font-bold"
                      style={{
                        background: isDone ? "var(--color-primary-100)" : "var(--bg-muted)",
                        color: isDone ? "var(--color-primary-700)" : "var(--ink-700)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {wordItem.order}
                    </div>
                    {/* Body */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-[17px] font-bold leading-tight"
                        style={{ letterSpacing: "-.015em", color: isDone ? "var(--ink-700)" : "var(--ink-900)" }}
                      >
                        {wordItem.word}
                      </span>
                      <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
                        <span
                          className="inline-flex items-center gap-0.5 h-[22px] px-2 rounded-full text-[11px] font-semibold"
                          style={{ background: "var(--bg-muted)", color: "var(--ink-700)", fontVariantNumeric: "tabular-nums" }}
                        >
                          {wordItem.page}쪽
                        </span>
                        {isDone && (
                          <>
                            <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--ink-300)" }} />
                            <span style={{ color: "var(--color-primary-700)", fontWeight: 600 }}>4단계 완료</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Check button */}
                      <button
                        onClick={(e) => toggleCompleted(item.id, e)}
                        className="w-8 h-8 rounded-full grid place-items-center cursor-pointer border-0 transition-all duration-[120ms] active:scale-90 shrink-0"
                        aria-label={isDone ? "완료 취소" : "완료 표시"}
                        style={
                          isDone
                            ? {
                                background: "var(--color-primary-500)",
                                boxShadow: "0 2px 8px rgba(46,162,104,.4)",
                              }
                            : {
                                background: "transparent",
                                outline: "2px solid var(--ink-200)",
                                outlineOffset: "-2px",
                              }
                        }
                      >
                        {isDone && <Check size={15} strokeWidth={3} color="white" />}
                      </button>
                      {/* Favorite button */}
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className="w-8 h-8 rounded-[10px] grid place-items-center cursor-pointer border-0 bg-transparent transition-all duration-[120ms] active:scale-90"
                        aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기"}
                        style={{ color: isFav ? "var(--color-secondary-500)" : "var(--ink-300)" }}
                      >
                        <Star size={17} strokeWidth={2} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Floating CTA */}
      {nextIncomplete && (
        <Link
          href={`/vocab/word/${nextIncomplete.id}`}
          className="absolute right-4 bottom-6 no-underline"
        >
          <button
            className="h-12 px-4 pl-4 rounded-full text-white font-bold text-[14px] inline-flex items-center gap-2 transition-transform active:translate-y-0.5"
            style={{
              background: c.ink,
              boxShadow: `var(--shadow-pop), 0 4px 0 ${c.bg}`,
            }}
          >
            이어서 학습
            <ArrowRight size={16} strokeWidth={2.6} />
          </button>
        </Link>
      )}
    </PhoneShell>
  );
}
