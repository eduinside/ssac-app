"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star, ChevronDown, Lock, Check, Play } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ToastProvider } from "@/components/ui/Toast";
import { storage } from "@/lib/storage";
import { loadVocabGrade, gradeFromId } from "@/lib/content";
import type { ListItem } from "@/types/vocab";

const GRADES = [
  { grade: 1, color: "meet", words: 63, reviews: 20, total: 83 },
  { grade: 2, color: "guess", words: 60, reviews: 15, total: 75 },
  { grade: 3, color: "explore", words: 43, reviews: 8, total: 51 },
  { grade: 4, color: "apply", words: 43, reviews: 7, total: 50 },
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

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  completed: boolean;
  itemType: "word" | "review";
}

export default function HomePage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completedByGrade, setCompletedByGrade] = useState<Record<number, number>>({});
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    storage.getAllProgress().then(async (allProgress) => {
      // 학년별 완료 수
      const counts: Record<number, number> = {};
      for (const p of allProgress) {
        if (p.completed) {
          const g = gradeFromId(p.id);
          counts[g] = (counts[g] ?? 0) + 1;
        }
      }
      setCompletedByGrade(counts);

      // 가장 최근 완료 1개 + 가장 최근 미완료 방문 1개
      const lastCompleted = allProgress
        .filter((p) => p.completed && p.completedAt)
        .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))[0];
      const lastViewed = allProgress
        .filter((p) => !p.completed && p.lastViewedAt)
        .sort((a, b) => (b.lastViewedAt! > a.lastViewedAt! ? 1 : -1))[0];
      const withView = [lastCompleted, lastViewed].filter(Boolean) as typeof allProgress;

      if (withView.length === 0) return;

      const grades = [...new Set(withView.map((p) => gradeFromId(p.id)))];
      const vocabByGrade: Record<number, ListItem[]> = {};
      await Promise.all(
        grades.map(async (g) => {
          try { vocabByGrade[g] = await loadVocabGrade(g); } catch {}
        })
      );

      const recent: RecentItem[] = withView.flatMap((p): RecentItem[] => {
        const g = gradeFromId(p.id);
        const item = (vocabByGrade[g] ?? []).find((i) => i.id === p.id);
        if (!item) return [];
        if (item.itemType === "word") {
          return [{ id: p.id, title: item.word, subtitle: item.definition, href: `/vocab/word/${p.id}`, completed: p.completed, itemType: "word" }];
        }
        return [{ id: p.id, title: item.title, subtitle: item.coversPages, href: `/vocab/review/${p.id}`, completed: p.completed, itemType: "review" }];
      });

      setRecentItems(recent);
    });
  }, []);

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
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-10 flex flex-col gap-6">

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

        {/* Recent history */}
        {recentItems.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3" style={{ letterSpacing: "-.015em" }}>최근 학습</h2>
            <div className="flex flex-col gap-2">
              {recentItems.map((item) => (
                <Link key={item.id} href={item.href} className="no-underline">
                  <div
                    className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] transition-all duration-[120ms] active:scale-[.995]"
                    style={{
                      background: item.completed ? "var(--color-primary-50)" : "var(--bg-surface)",
                      border: `1px solid ${item.completed ? "var(--color-primary-200)" : "var(--ink-200)"}`,
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    {/* Icon */}
                    <span
                      className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                      style={{
                        background: item.itemType === "review" ? "var(--section-explore-bg)" : item.completed ? "var(--color-primary-100)" : "var(--bg-muted)",
                        color: item.itemType === "review" ? "var(--section-explore-ink)" : item.completed ? "var(--color-primary-700)" : "var(--ink-500)",
                      }}
                    >
                      {item.itemType === "review"
                        ? <Play size={14} fill="currentColor" />
                        : item.completed
                          ? <Check size={14} strokeWidth={2.8} />
                          : <span className="text-[12px] font-bold">가</span>
                      }
                    </span>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--ink-900)", letterSpacing: "-.01em" }}>
                        {item.title}
                      </p>
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--ink-500)" }}>
                        {item.subtitle}
                      </p>
                    </div>
                    {item.completed && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
                        완료
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grade grid */}
        <section>
          <h2 className="text-[17px] font-bold mb-3" style={{ letterSpacing: "-.015em" }}>학년 선택</h2>
          <div className="flex flex-col gap-3">
            {GRADES.map((g) => {
              const c = SECTION_COLORS[g.color];
              const done = completedByGrade[g.grade] ?? 0;
              const pct = g.total > 0 ? Math.round((done / g.total) * 100) : 0;
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
                        {done > 0 && (
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
                        <span>{done} / {g.total} 완료</span><span>{pct}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

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
