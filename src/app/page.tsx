"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Star, ChevronDown, Lock, ArrowRight, Play } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ToastProvider } from "@/components/ui/Toast";

const GRADES = [
  { grade: 1, color: "meet",    words: 28, reviews: 7,  done: 0, total: 35 },
  { grade: 2, color: "guess",   words: 30, reviews: 8,  done: 5, total: 38 },
  { grade: 3, color: "explore", words: 32, reviews: 9,  done: 0, total: 41 },
  { grade: 4, color: "apply",   words: 9,  reviews: 2,  done: 3, total: 11 },
  { grade: 5, color: "meet",    words: 34, reviews: 10, done: 0, total: 44 },
  { grade: 6, color: "guess",   words: 30, reviews: 8,  done: 0, total: 38 },
] as const;

const SECTION_COLORS: Record<string, { soft: string; ink: string; line: string; bg: string }> = {
  meet:    { soft: "var(--section-meet-soft)",    ink: "var(--section-meet-ink)",    line: "var(--section-meet-line)",    bg: "var(--section-meet-bg)" },
  guess:   { soft: "var(--section-guess-soft)",   ink: "var(--section-guess-ink)",   line: "var(--section-guess-line)",   bg: "var(--section-guess-bg)" },
  explore: { soft: "var(--section-explore-soft)", ink: "var(--section-explore-ink)", line: "var(--section-explore-line)", bg: "var(--section-explore-bg)" },
  apply:   { soft: "var(--section-apply-soft)",   ink: "var(--section-apply-ink)",   line: "var(--section-apply-line)",   bg: "var(--section-apply-bg)" },
};

const SIBLINGS = [
  { key: "concept", label: "개념싹", tag: "교과 개념을 익혀요", mark: "💡", bg: "var(--brand-concept-bg)", ink: "var(--brand-concept-ink)" },
  { key: "reading", label: "독해싹", tag: "글을 읽고 익혀요",    mark: "📖", bg: "var(--brand-reading-bg)", ink: "var(--brand-reading-ink)" },
  { key: "english", label: "영어싹", tag: "영상으로 배워요",      mark: "🔤", bg: "var(--brand-english-bg)", ink: "var(--brand-english-ink)" },
];

export default function HomePage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <PhoneShell>
      <ToastProvider />

      {/* App header */}
      <header
        className="flex items-center justify-between px-5 pt-2 pb-3.5 relative z-10"
        style={{ background: "var(--bg-app)" }}
      >
        <button
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full cursor-pointer hover:bg-black/[.04] active:scale-[.97] transition-all duration-[120ms]"
          aria-label="학습 모듈 선택"
        >
          <span
            className="w-9 h-9 rounded-xl grid place-items-center text-white font-extrabold text-lg"
            style={{
              background: "linear-gradient(140deg, var(--color-primary-400), var(--color-primary-600))",
              boxShadow: "var(--shadow-pop)",
              letterSpacing: "-.02em",
            }}
          >
            싹
          </span>
          <span className="text-xl font-bold" style={{ letterSpacing: "-.02em" }}>어휘싹</span>
          <span
            className="w-5 h-5 rounded-full grid place-items-center"
            style={{ background: "var(--ink-100)", color: "var(--ink-500)" }}
          >
            <ChevronDown size={11} strokeWidth={2.4} />
          </span>
        </button>

        <div className="flex gap-1.5">
          <Link href="/search">
            <IconButton aria-label="검색"><Search size={19} strokeWidth={2.2} /></IconButton>
          </Link>
          <Link href="/favorites">
            <IconButton aria-label="즐겨찾기"><Star size={19} strokeWidth={2} /></IconButton>
          </Link>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-28 flex flex-col gap-6">

        {/* Welcome */}
        <section className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--color-primary-700)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-primary-500)", boxShadow: "0 0 0 4px var(--color-primary-100)" }} />
            오늘도 새로운 어휘 한 입!
          </span>
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ letterSpacing: "-.025em" }}>
            오늘은 어떤 어휘를{" "}
            <em className="not-italic" style={{ color: "var(--color-primary-600)" }}>만나볼까?</em>
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>학년을 선택해 어휘 학습을 시작해요</p>
        </section>

        {/* Continue card */}
        <Link href="/vocab/word/v-g4-003" className="no-underline">
          <div
            className="rounded-[28px] p-[18px] flex flex-col gap-3 overflow-hidden relative cursor-pointer"
            style={{
              background: "radial-gradient(140% 100% at 100% 0%, var(--color-primary-100) 0%, transparent 55%), linear-gradient(160deg, #fff 0%, var(--color-primary-50) 100%)",
              border: "1px solid var(--color-primary-200)",
              boxShadow: "var(--shadow-2)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: "var(--color-primary-700)" }}>
                이어서 학습하기
              </span>
              <span
                className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-semibold"
                style={{ background: "white", border: "1px solid var(--color-primary-200)", color: "var(--color-primary-700)" }}
              >
                <Play size={9} fill="currentColor" /> 4학년
              </span>
            </div>
            <div>
              <p className="text-[28px] font-extrabold leading-none" style={{ letterSpacing: "-.03em" }}>감상하다</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--ink-700)" }}>예술 작품을 이해하고 즐기며 평가하다.</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold" style={{ color: "var(--ink-700)" }}>
                  <span>3 / 11 완료</span><span>27%</span>
                </div>
                <ProgressBar value={27} height={6} />
              </div>
              <button
                className="shrink-0 h-10 px-4 rounded-full text-white font-bold text-[13px] inline-flex items-center gap-1.5 transition-transform active:translate-y-0.5"
                style={{ background: "var(--color-primary-500)", boxShadow: "0 3px 0 var(--color-primary-700)" }}
              >
                계속 <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </Link>

        {/* Grade grid */}
        <section>
          <h2 className="text-[17px] font-bold mb-3" style={{ letterSpacing: "-.015em" }}>학년 선택</h2>
          <div className="flex flex-col gap-3">
            {GRADES.map((g) => {
              const c = SECTION_COLORS[g.color];
              const pct = g.total > 0 ? Math.round((g.done / g.total) * 100) : 0;
              return (
                <Link key={g.grade} href={`/vocab/grade/${g.grade}`} className="no-underline">
                  <div
                    className="relative rounded-[20px] p-5 pb-4 grid cursor-pointer overflow-hidden transition-transform duration-200"
                    style={{
                      gridTemplateColumns: "auto 1fr",
                      columnGap: "18px",
                      rowGap: "10px",
                      alignItems: "center",
                      background: c.soft,
                      border: `1px solid ${c.line}`,
                      color: c.ink,
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    <span className="absolute right-[-36px] bottom-[-36px] w-[150px] h-[150px] rounded-full pointer-events-none" style={{ background: c.bg, opacity: .42 }} />
                    <div
                      className="row-span-2 w-16 h-16 rounded-[20px] grid place-items-center"
                      style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,0,0,.06)", backdropFilter: "blur(4px)" }}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <b className="text-[30px] font-extrabold" style={{ letterSpacing: "-.03em" }}>{g.grade}</b>
                        <span className="text-[11px] font-bold opacity-75">학년</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[18px] font-extrabold" style={{ letterSpacing: "-.02em" }}>{g.grade}학년 어휘싹</span>
                        {g.done > 0 && (
                          <span className="h-[22px] px-2 rounded-full text-[11px] font-bold inline-flex items-center shrink-0"
                            style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,0,0,.06)" }}>
                            {pct}% 완료
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-semibold opacity-85">어휘 {g.words} · 다섯고개 {g.reviews}</p>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <ProgressBar value={pct} height={5} color={c.ink} bgColor="rgba(255,255,255,.6)" />
                      <div className="flex justify-between text-[11px] font-semibold mt-1.5 opacity-80">
                        <span>{g.done} / {g.total} 완료</span><span>{pct}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Family strip */}
        <section>
          <h2 className="text-[17px] font-bold mb-3" style={{ letterSpacing: "-.015em" }}>어휘싹 가족</h2>
          <div className="flex flex-col gap-2.5">
            {SIBLINGS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSheetOpen(true)}
                className="grid items-center gap-3 p-3 pr-3.5 rounded-[14px] border border-dashed cursor-pointer text-left transition-all active:scale-[.99]"
                style={{ gridTemplateColumns: "44px 1fr auto", background: "var(--bg-surface)", borderColor: "var(--ink-200)" }}
              >
                <span className="w-11 h-11 rounded-[14px] grid place-items-center text-lg font-extrabold" style={{ background: s.bg, color: s.ink }}>{s.mark}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold" style={{ color: "var(--ink-900)" }}>{s.label}</span>
                  <span className="block text-[11px] font-semibold" style={{ color: "var(--ink-500)" }}>{s.tag}</span>
                </span>
                <span className="inline-flex items-center gap-1 h-[22px] px-2.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                  style={{ background: "var(--bg-muted)", color: "var(--ink-500)" }}>
                  <Lock size={11} /> 곧 만나요
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-3.5 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(251,250,247,0) 0%, var(--bg-app) 30%)" }}>
        <Link href="/vocab/grade/4" className="pointer-events-auto block">
          <button
            className="w-full h-[52px] rounded-full text-white font-bold text-base flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
            style={{ background: "var(--color-primary-500)", boxShadow: "0 4px 0 var(--color-primary-700), var(--shadow-pop)" }}
          >
            <Play size={16} fill="currentColor" />
            4학년 이어서 학습
          </button>
        </Link>
      </div>

      {/* Module switcher bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="학습을 골라요" subtitle="학년은 그대로 따라가요">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-[14px]"
            style={{ background: "var(--brand-vocab-soft)", border: "1.5px solid var(--brand-vocab-bg)" }}>
            <span className="w-11 h-11 rounded-[14px] grid place-items-center text-xl font-extrabold" style={{ background: "var(--brand-vocab-bg)", color: "var(--brand-vocab-ink)" }}>🌱</span>
            <span className="flex-1">
              <span className="block text-[15px] font-bold" style={{ color: "var(--ink-900)" }}>어휘싹</span>
              <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>단어를 익혀요</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--brand-vocab-bg)", color: "var(--brand-vocab-ink)" }}>현재 학습 중</span>
          </div>
          {SIBLINGS.map((s) => (
            <div key={s.key} className="flex items-center gap-3 p-3 rounded-[14px] opacity-60" style={{ background: "var(--bg-muted)" }}>
              <span className="w-11 h-11 rounded-[14px] grid place-items-center text-xl font-extrabold" style={{ background: s.bg, color: s.ink }}>{s.mark}</span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "var(--ink-900)" }}>{s.label}</span>
                <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>{s.tag}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--bg-sunken)", color: "var(--ink-500)" }}>
                <Lock size={10} /> 출시 예정
              </span>
            </div>
          ))}
        </div>
        <button className="w-full h-12 rounded-full border-dashed border text-sm font-semibold" style={{ borderColor: "var(--ink-300)", color: "var(--ink-500)" }}>
          새 모듈 알림 받기
        </button>
      </BottomSheet>
    </PhoneShell>
  );
}
