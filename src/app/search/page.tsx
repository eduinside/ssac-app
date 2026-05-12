"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, X, Check, ChevronDown } from "lucide-react";
import { PhoneShell } from "@/components/ui/PhoneShell";
import { IconButton } from "@/components/ui/IconButton";
import { Chip } from "@/components/ui/Chip";

interface WordDoc {
  id: string;
  word: string;
  definition: string;
  grade: number;
  page: number;
  pos?: string;
  completed?: boolean;
}

const GRADE_BADGE_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: "var(--section-meet-bg)",    color: "var(--section-meet-ink)" },
  2: { bg: "var(--section-guess-bg)",   color: "var(--section-guess-ink)" },
  3: { bg: "var(--section-explore-bg)", color: "var(--section-explore-ink)" },
  4: { bg: "var(--section-apply-bg)",   color: "var(--section-apply-ink)" },
  5: { bg: "var(--color-primary-100)",  color: "var(--color-primary-700)" },
  6: { bg: "var(--color-secondary-100)",color: "var(--color-secondary-700)" },
};

function highlight(text: string, query: string, bgColor: string, inkColor: string) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: bgColor,
              color: inkColor,
              padding: "0 2px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [docs, setDocs] = useState<WordDoc[]>([]);
  const [filterGrade, setFilterGrade] = useState<number | null>(null);

  // Load all words from available grades via manifest
  useEffect(() => {
    fetch("/data/manifest.json")
      .then((r) => r.json())
      .then(async (manifest) => {
        const groups: { grade: number; files: string[] }[] = manifest.contents?.vocab?.groups ?? [];
        const allDocs: WordDoc[] = [];
        await Promise.all(
          groups.map(async (g) => {
            const wordsFile = g.files.find((f: string) => f.endsWith("words.json"));
            if (!wordsFile) return;
            const res = await fetch(`/data/${wordsFile}`);
            if (!res.ok) return;
            const data = await res.json();
            data.words.forEach((w: { id: string; word: string; definition: string; grade: number; page: number; pos?: string }) => {
              allDocs.push({ id: w.id, word: w.word, definition: w.definition, grade: w.grade, page: w.page, pos: w.pos });
            });
          })
        );
        allDocs.sort((a, b) => a.grade - b.grade || a.page - b.page);
        setDocs(allDocs);
      });
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return docs.filter(
      (d) =>
        d.word.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q)
    );
  }, [debouncedQuery, docs]);

  const filteredResults = useMemo(() => {
    if (!filterGrade) return results;
    return results.filter((r) => r.grade === filterGrade);
  }, [results, filterGrade]);

  // Count per grade
  const countByGrade = useMemo(() => {
    const map: Record<number, number> = {};
    results.forEach((r) => {
      map[r.grade] = (map[r.grade] ?? 0) + 1;
    });
    return map;
  }, [results]);

  // Group by grade
  const grouped = useMemo(() => {
    const map = new Map<number, WordDoc[]>();
    filteredResults.forEach((r) => {
      if (!map.has(r.grade)) map.set(r.grade, []);
      map.get(r.grade)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredResults]);

  const presentGrades = useMemo(() => Object.keys(countByGrade).map(Number).sort(), [countByGrade]);

  return (
    <PhoneShell>
      {/* Search bar */}
      <div className="flex items-center gap-2.5 px-3.5 pt-2 pb-3">
        <IconButton onClick={() => router.back()} aria-label="뒤로">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </IconButton>
        <div className="flex-1 relative flex items-center">
          <span
            className="absolute left-3.5 grid place-items-center pointer-events-none"
            style={{ color: "var(--color-primary-600)" }}
          >
            <Search size={18} strokeWidth={2.4} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어휘 또는 뜻 검색"
            className="flex-1 h-12 rounded-full outline-none text-[15px] font-semibold"
            style={{
              padding: "0 44px 0 42px",
              border: `1.5px solid ${query ? "var(--color-primary-400)" : "var(--ink-200)"}`,
              background: "var(--bg-surface)",
              color: "var(--ink-900)",
              boxShadow: query ? "0 0 0 4px var(--color-primary-100)" : "none",
              transition: "box-shadow 200ms, border-color 200ms",
              fontFamily: "var(--font-sans)",
            }}
            aria-label="어휘 또는 뜻 검색"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 w-7 h-7 rounded-full grid place-items-center cursor-pointer border-0"
              style={{ background: "var(--ink-200)", color: "var(--ink-700)" }}
              aria-label="지우기"
            >
              <X size={12} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>

      {/* Grade filter chips */}
      {results.length > 0 && (
        <div className="flex gap-1.5 px-3.5 pb-3 overflow-x-auto scrollbar-hide">
          <Chip
            active={!filterGrade}
            count={results.length}
            onClick={() => setFilterGrade(null)}
          >
            전체
          </Chip>
          {presentGrades.map((g) => (
            <Chip
              key={g}
              active={filterGrade === g}
              count={countByGrade[g]}
              onClick={() => setFilterGrade(filterGrade === g ? null : g)}
            >
              {g}학년
            </Chip>
          ))}
        </div>
      )}

      {/* Result strip */}
      {filteredResults.length > 0 && (
        <div className="flex items-baseline justify-between gap-3 px-[18px] pb-2" style={{ fontSize: "13px", color: "var(--ink-500)", fontWeight: 600 }}>
          <span className="overflow-hidden text-ellipsis">
            <b style={{ color: "var(--color-primary-700)", fontWeight: 800 }}>{filteredResults.length}</b>
            개의 어휘 · &ldquo;
            <b style={{ color: "var(--ink-900)", fontWeight: 700 }}>{debouncedQuery}</b>&rdquo; 검색
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap" style={{ color: "var(--ink-700)" }}>
            교재 순서 <ChevronDown size={12} strokeWidth={2.4} />
          </span>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3.5 pb-6 flex flex-col gap-2">
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--ink-400)" }}>
            <Search size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">어휘나 뜻을 검색해 보세요</p>
          </div>
        )}

        {query.trim() && filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--ink-400)" }}>
            <p className="text-sm font-medium">&ldquo;{query}&rdquo; 검색 결과가 없어요</p>
          </div>
        )}

        {grouped.map(([grade, items]) => (
          <div key={grade}>
            {/* Group header */}
            <div className="flex items-center gap-2 py-2.5 px-1" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-500)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              <span>{grade}학년 어휘싹</span>
              <span className="flex-1 h-px" style={{ background: "var(--ink-200)" }} />
            </div>

            {items.map((item) => {
              const badge = GRADE_BADGE_STYLE[item.grade] ?? GRADE_BADGE_STYLE[4];
              return (
                <Link key={item.id} href={`/vocab/word/${item.id}`} className="no-underline block mb-2">
                  <article
                    className="grid gap-x-3 gap-y-1 px-4 py-3.5 rounded-[14px] cursor-pointer transition-all duration-[120ms] active:scale-[.995]"
                    style={{
                      gridTemplateColumns: "1fr auto",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--ink-200)",
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    <div className="text-[18px] font-extrabold leading-tight" style={{ letterSpacing: "-.02em", color: "var(--ink-900)" }}>
                      {highlight(item.word, debouncedQuery, "var(--color-primary-100)", "var(--color-primary-700)")}
                    </div>
                    <span
                      className="h-6 px-2.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 self-start shrink-0"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
                      {item.grade}학년
                    </span>
                    <p
                      className="col-span-2 text-[13px] leading-relaxed overflow-hidden"
                      style={{
                        color: "var(--ink-700)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {highlight(item.definition, debouncedQuery, "var(--section-guess-bg)", "var(--section-guess-ink)")}
                    </p>
                    <div className="col-span-2 flex items-center gap-2.5 flex-wrap mt-1" style={{ fontSize: "11px", color: "var(--ink-500)", fontWeight: 600 }}>
                      <span>{item.page}쪽</span>
                      {item.pos && (
                        <>
                          <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--ink-300)" }} />
                          <span>{item.pos}</span>
                        </>
                      )}
                      {item.completed && (
                        <>
                          <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--ink-300)" }} />
                          <span className="inline-flex items-center gap-0.5" style={{ color: "var(--color-primary-700)" }}>
                            <Check size={11} strokeWidth={2.6} /> 완료
                          </span>
                        </>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
