import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadConcept } from "@/lib/content";
import type { ConceptBook } from "@content/schema";
import { getAllProgress } from "@/lib/storage";

const SUBJECTS_CONFIG = [
  { key: "social", label: "사회 🗺️", color: "bg-emerald-500", shadow: "#0d5332", activeBg: "linear-gradient(135deg, #10b981, #34d399)" },
  { key: "math", label: "수학 🔢", color: "bg-orange-500", shadow: "#7c2d12", activeBg: "linear-gradient(135deg, #f97316, #fb923c)" },
  { key: "science", label: "과학 🧪", color: "bg-cyan-500", shadow: "#083344", activeBg: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
];

export default function ConceptBookView() {
  const { grade: g, semester: s } = useParams();
  const grade = Number(g);
  const semester = Number(s) as 1 | 2;
  const nav = useNavigate();

  const [activeSubject, setActiveSubject] = useState("social");
  const [book, setBook] = useState<ConceptBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, { done: boolean }>>({});
  
  const [subjectStats, setSubjectStats] = useState<Record<string, { done: number; total: number }>>({
    social: { done: 0, total: 0 },
    math: { done: 0, total: 0 },
    science: { done: 0, total: 0 },
  });

  // 1. Initial Load of Progress, Stats, and Smart Tab Default
  useEffect(() => {
    getAllProgress("concept").then(async (p) => {
      setProgress(p as any);

      const stats: Record<string, { done: number; total: number }> = {
        social: { done: 0, total: 0 },
        math: { done: 0, total: 0 },
        science: { done: 0, total: 0 },
      };

      const subjects = ["social", "math", "science"] as const;
      await Promise.all(
        subjects.map(async (sub) => {
          try {
            const b = await loadConcept(grade, semester, sub);
            if (b) {
              const total = b.units.reduce((acc, u) => acc + u.videos.length, 0);
              const done = b.units.reduce((acc, u) => {
                return acc + u.videos.filter((v) => !!p[v.id]?.done).length;
              }, 0);
              stats[sub] = { done, total };
            }
          } catch {
            // Ignore missing files
          }
        })
      );

      setSubjectStats(stats);

      // Smart default tab selection:
      // - If "social" is done -> default to "math"
      // - If both "social" and "math" are done -> default to "science"
      const socialDone = stats.social.total > 0 && stats.social.done === stats.social.total;
      const mathDone = stats.math.total > 0 && stats.math.done === stats.math.total;

      let defaultSub = "social";
      if (socialDone) {
        if (mathDone) {
          defaultSub = "science";
        } else {
          defaultSub = "math";
        }
      }
      setActiveSubject(defaultSub);
    });
  }, [grade, semester]);

  // 2. Load Book for Active Subject
  useEffect(() => {
    setLoading(true);
    loadConcept(grade, semester, activeSubject)
      .then((b) => {
        setBook(b);
        setLoading(false);
      })
      .catch(() => {
        setBook(null);
        setLoading(false);
      });
  }, [grade, semester, activeSubject]);

  // 3. Keep Progress Up-to-Date when activeSubject or book changes
  useEffect(() => {
    getAllProgress("concept").then((p) => {
      setProgress(p as any);
      
      setSubjectStats((prev) => {
        const next = { ...prev };
        if (book) {
          const total = book.units.reduce((acc, u) => acc + u.videos.length, 0);
          const done = book.units.reduce((acc, u) => {
            return acc + u.videos.filter((v) => !!p[v.id]?.done).length;
          }, 0);
          next[activeSubject] = { done, total };
        }
        return next;
      });
    });
  }, [activeSubject, book]);

  const totalVideos = useMemo(() => {
    if (!book) return 0;
    return book.units.reduce((acc, u) => acc + u.videos.length, 0);
  }, [book]);

  const doneVideos = useMemo(() => {
    if (!book) return 0;
    return book.units.reduce((acc, u) => {
      return acc + u.videos.filter((v) => !!progress[v.id]?.done).length;
    }, 0);
  }, [book, progress]);

  const progressPct = useMemo(() => {
    if (totalVideos === 0) return 0;
    return Math.round((doneVideos / totalVideos) * 100);
  }, [doneVideos, totalVideos]);

  const activeConf = useMemo(() => {
    return SUBJECTS_CONFIG.find((sub) => sub.key === activeSubject) ?? SUBJECTS_CONFIG[0];
  }, [activeSubject]);

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

      {/* Subject Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {SUBJECTS_CONFIG.map((sub) => {
          const isActive = sub.key === activeSubject;
          const stats = subjectStats[sub.key];
          const hasStats = stats && stats.total > 0;
          return (
            <button
              key={sub.key}
              onClick={() => setActiveSubject(sub.key)}
              className={
                "rounded-3xl py-2.5 font-black text-xs sm:text-sm text-center transition-all duration-150 flex flex-col items-center justify-center " +
                (isActive
                  ? "text-white hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-white text-ink-600 border-2 border-ink-100 hover:bg-ink-50")
              }
              style={
                isActive
                  ? { background: sub.activeBg, boxShadow: `0 4px 0 ${sub.shadow}` }
                  : { boxShadow: "0 3px 0 rgba(0,0,0,0.05)" }
              }
            >
              <div>{sub.label}</div>
              {hasStats && (
                <div className={"text-[10px] font-bold mt-0.5 " + (isActive ? "text-white/80" : "text-ink-400")}>
                  {stats.done}/{stats.total}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-5xl animate-float-slow">💡</div>
          <p className="text-ink-500 font-bold">불러오는 중…</p>
        </div>
      ) : !book || book.units.length === 0 ? (
        /* Empty State */
        <div className="card-bordered text-center py-16 space-y-4">
          <div className="text-5xl">🚧</div>
          <div className="font-black text-kidlg text-ink-800">콘텐츠 준비 중</div>
          <p className="text-ink-500 text-sm max-w-xs mx-auto">
            {activeConf.label.split(" ")[0]} 과목은 준비 중이에요. 조금만 기다려주세요!
          </p>
          <button
            onClick={() => setActiveSubject("social")}
            className="btn-soft text-xs"
          >
            사회 학습하러 가기
          </button>
        </div>
      ) : (
        /* Content List */
        <div className="space-y-6">
          {/* Progress Card */}
          <div
            className="rounded-4xl p-5 text-white"
            style={{
              background: activeConf.activeBg,
              boxShadow: `0 6px 0 ${activeConf.shadow}`,
            }}
          >
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-white/80 text-sm font-bold">학습한 영상</div>
                <div className="font-black text-kid2xl leading-none">{doneVideos}</div>
              </div>
              <div className="text-right">
                <div className="text-white/80 text-sm font-bold">전체 영상</div>
                <div className="font-black text-kidxl leading-none">{totalVideos}</div>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke="white" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                  />
                </svg>
                <span className="absolute text-white font-black text-xs">{progressPct}%</span>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Unit List */}
          <div className="space-y-6">
            {book.units.map((unit) => (
              <div key={unit.id} className="space-y-3">
                <h3 className="font-extrabold text-kidlg text-ink-900 border-l-4 border-sprout-500 pl-2.5">
                  {unit.title}
                </h3>
                <div className="grid gap-3">
                  {unit.videos.map((video) => {
                    const isDone = !!progress[video.id]?.done;
                    return (
                      <button
                        key={video.id}
                        onClick={() => nav(`/concept/${grade}/video/${video.id}`)}
                        className={
                          "card p-5 text-left transition-all duration-150 flex items-center justify-between " +
                          "hover:scale-[1.01] hover:border-sprout-300"
                        }
                        style={{
                          boxShadow: "0 4px 0 rgba(0,0,0,0.06)",
                        }}
                      >
                        <div className="space-y-2 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            {isDone ? (
                              <span className="bg-sprout-500 text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                                ✓ 완료
                              </span>
                            ) : (
                              <span className="bg-ink-100 text-ink-500 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                학습 전
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-kid text-ink-800 leading-snug">
                            {video.title}
                          </h4>
                          {/* Related Concepts */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {video.concepts.map((concept) => (
                              <span
                                key={concept.term}
                                className="bg-sprout-50 text-sprout-700 text-xs font-bold px-2 py-0.5 rounded-full border border-sprout-100"
                              >
                                {concept.term}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <div
                          className={
                            "w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 " +
                            (isDone ? "bg-sprout-100 text-sprout-600" : "bg-ink-50 text-ink-400")
                          }
                        >
                          ▶
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/concept" className="btn-soft w-full">← 학기 선택으로</Link>
    </section>
  );
}
