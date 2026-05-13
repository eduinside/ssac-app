"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star } from "lucide-react";

const GRADES = [
  { grade: 1, ink: "var(--section-meet-ink)",    bg: "var(--section-meet-soft)",    line: "var(--section-meet-line)" },
  { grade: 2, ink: "var(--section-guess-ink)",   bg: "var(--section-guess-soft)",   line: "var(--section-guess-line)" },
  { grade: 3, ink: "var(--section-explore-ink)", bg: "var(--section-explore-soft)", line: "var(--section-explore-line)" },
  { grade: 4, ink: "var(--section-apply-ink)",   bg: "var(--section-apply-soft)",   line: "var(--section-apply-line)" },
  { grade: 5, ink: "var(--section-meet-ink)",    bg: "var(--section-meet-soft)",    line: "var(--section-meet-line)" },
  { grade: 6, ink: "var(--section-guess-ink)",   bg: "var(--section-guess-soft)",   line: "var(--section-guess-line)" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-shell-sidebar">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-7 no-underline">
        <span
          className="w-9 h-9 rounded-xl grid place-items-center text-white font-extrabold text-lg shrink-0"
          style={{
            background: "linear-gradient(140deg, var(--color-primary-400), var(--color-primary-600))",
            boxShadow: "var(--shadow-pop)",
            letterSpacing: "-.02em",
          }}
        >
          싹
        </span>
        <span className="text-[17px] font-bold" style={{ letterSpacing: "-.02em", color: "var(--ink-900)" }}>
          어휘싹
        </span>
      </Link>

      {/* Grade navigation */}
      <nav className="flex flex-col gap-0.5 flex-1 min-h-0">
        <span
          className="text-[10px] font-bold uppercase tracking-[.1em] px-3 mb-1.5"
          style={{ color: "var(--ink-400)" }}
        >
          학년
        </span>

        {GRADES.map((g) => {
          const active =
            pathname === `/vocab/grade/${g.grade}` ||
            pathname.startsWith(`/vocab/word/v-g${g.grade}`) ||
            pathname.startsWith(`/vocab/review/v-g${g.grade}`);
          const hasData = g.grade >= 1 && g.grade <= 4;

          const inner = (
            <>
              <span
                className="w-7 h-7 rounded-[8px] grid place-items-center text-[13px] font-extrabold shrink-0"
                style={{
                  background: active ? "rgba(255,255,255,.72)" : "var(--ink-100)",
                  color: active ? g.ink : "var(--ink-500)",
                }}
              >
                {g.grade}
              </span>
              <span className="text-[13px] font-semibold flex-1">{g.grade}학년</span>
              {!hasData && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--ink-100)", color: "var(--ink-400)" }}
                >
                  준비중
                </span>
              )}
            </>
          );

          return hasData ? (
            <Link
              key={g.grade}
              href={`/vocab/grade/${g.grade}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] no-underline transition-all duration-[120ms]"
              style={active ? { background: g.bg, border: `1px solid ${g.line}`, color: g.ink } : { color: "var(--ink-700)" }}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={g.grade}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px]"
              style={{ color: "var(--ink-400)" }}
            >
              {inner}
            </div>
          );
        })}

        <div className="h-px my-3" style={{ background: "var(--ink-200)" }} />

        {/* Search & Favorites */}
        {(
          [
            { href: "/search",    label: "검색",    icon: <Search size={15} strokeWidth={2.2} /> },
            { href: "/favorites", label: "즐겨찾기", icon: <Star size={15} strokeWidth={2} /> },
          ] as const
        ).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] no-underline transition-all duration-[120ms]"
              style={
                active
                  ? { background: "var(--bg-muted)", color: "var(--ink-900)" }
                  : { color: "var(--ink-500)" }
              }
            >
              <span
                className="w-7 h-7 rounded-[8px] grid place-items-center shrink-0"
                style={{ background: active ? "var(--bg-sunken)" : "var(--ink-100)" }}
              >
                {item.icon}
              </span>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Module badge */}
      <div className="mt-4 px-1">
        <div
          className="px-3 py-2.5 rounded-[12px]"
          style={{ background: "var(--brand-vocab-soft)", border: "1px solid var(--brand-vocab-bg)" }}
        >
          <span className="block text-[11px] font-bold" style={{ color: "var(--brand-vocab-ink)" }}>
            🌱 어휘싹 학습 중
          </span>
          <span className="block text-[10px] mt-0.5" style={{ color: "var(--ink-500)" }}>
            개념싹 · 독해싹 · 영어싹 준비중
          </span>
        </div>
      </div>
    </aside>
  );
}
