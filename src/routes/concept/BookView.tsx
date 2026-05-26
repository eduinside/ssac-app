import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadConcept } from "@/lib/content";
import type { ConceptBook } from "@content/schema";
import { getAllProgress } from "@/lib/storage";

const SUBJECTS_CONFIG = [
  { key: "social",  label: "사회 🗺️", gradient: "linear-gradient(135deg, #10b981, #34d399)", shadow: "#065f46", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "math",    label: "수학 🔢", gradient: "linear-gradient(135deg, #f97316, #fb923c)", shadow: "#7c2d12", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  { key: "science", label: "과학 🧪", gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)", shadow: "#083344", chip: "bg-cyan-50 text-cyan-700 border-cyan-200" },
] as const;

export default function ConceptBookView() {
  const { grade: g, semester: s } = useParams();
  const grade = Number(g);
  const semester = Number(s) as 1 | 2;
  const nav = useNavigate();

  const [books, setBooks] = useState<Record<string, ConceptBook | null>>({ social: null, math: null, science: null });
  const [progress, setProgress] = useState<Record<string, { done?: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all(
      SUBJECTS_CONFIG.map(async (sub) => {
        try {
          const b = await loadConcept(grade, semester, sub.key);
          return [sub.key, b] as const;
        } catch {
          return [sub.key, null] as const;
        }
      })
    ).then((rows) => {
      if (!alive) return;
      setBooks(Object.fromEntries(rows));
      setLoading(false);
    });
    getAllProgress("concept").then((p) => {
      if (!alive) return;
      setProgress(p as any);
    });
    return () => { alive = false; };
  }, [grade, semester]);

  const totalDone = SUBJECTS_CONFIG.reduce((acc, sub) => {
    const b = books[sub.key];
    if (!b) return acc;
    return acc + b.keywords.filter((k) => !!progress[k.id]?.done).length;
  }, 0);
  const totalAll = SUBJECTS_CONFIG.reduce((acc, sub) => {
    const b = books[sub.key];
    return acc + (b?.keywords.length ?? 0);
  }, 0);
  const totalPct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => nav("/concept")}
          className="text-2xl text-ink-400 hover:text-ink-700 transition"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-black text-kidxl text-ink-900">
          💡 개념싹 <span className="text-sun-500">{grade}-{semester}</span>
        </h1>
      </div>

      {/* Overall Progress Card */}
      <div
        className="rounded-4xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #f9a825 0%, #ffb74d 100%)",
          boxShadow: "0 6px 0 #b36b00",
        }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-white/80 text-sm font-bold">학습한 개념어</div>
            <div className="font-black text-kid2xl leading-none">{totalDone}</div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm font-bold">전체 개념어</div>
            <div className="font-black text-kidxl leading-none">{totalAll}</div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke="white" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - totalPct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.7s ease" }}
              />
            </svg>
            <span className="absolute text-white font-black text-xs">{totalPct}%</span>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${totalPct}%` }} />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-5xl animate-float-slow">💡</div>
          <p className="text-ink-500 font-bold">불러오는 중…</p>
        </div>
      ) : (
        <div className="space-y-7">
          {SUBJECTS_CONFIG.map((sub) => {
            const book = books[sub.key];
            const keywords = book?.keywords ?? [];
            const done = keywords.filter((k) => !!progress[k.id]?.done).length;
            const total = keywords.length;

            return (
              <section key={sub.key} className="space-y-3">
                {/* Section header */}
                <div
                  className="rounded-3xl px-4 py-3 text-white flex items-center justify-between"
                  style={{ background: sub.gradient, boxShadow: `0 4px 0 ${sub.shadow}` }}
                >
                  <h2 className="font-black text-kidlg">{sub.label}</h2>
                  <div className="text-xs font-bold text-white/90">
                    {total === 0 ? "준비 중" : `${done}/${total}`}
                  </div>
                </div>

                {/* Grid */}
                {total === 0 ? (
                  <div className="card-bordered text-center py-8 text-sm text-ink-500 font-bold">
                    🚧 콘텐츠 준비 중
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {keywords.map((k) => {
                      const isDone = !!progress[k.id]?.done;
                      const orderStr = String(k.order).padStart(2, "0");
                      return (
                        <button
                          key={k.id}
                          onClick={() => nav(`/concept/${grade}/keyword/${k.id}`)}
                          className={
                            "rounded-2xl p-3 text-left transition-all duration-150 border-2 " +
                            "hover:scale-[1.02] active:scale-[0.98] " +
                            (isDone ? "bg-sprout-50 border-sprout-200" : "bg-white border-ink-100")
                          }
                          style={{ boxShadow: "0 3px 0 rgba(0,0,0,0.05)" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-ink-400">
                              {grade}-{semester} {sub.label.split(" ")[0]}
                            </span>
                            {isDone && (
                              <span className="text-sprout-600 text-xs font-black">✓</span>
                            )}
                          </div>
                          <div className="font-black text-ink-900 text-sm leading-tight">
                            {orderStr}. {k.term}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Link to="/concept" className="btn-soft w-full">← 학기 선택으로</Link>
    </section>
  );
}
