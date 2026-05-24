import { availableFor, loadConcept } from "@/lib/content";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, getAllProgress } from "@/lib/storage";

interface SubjectStat {
  done: number;
  total: number;
}
interface SemesterStat {
  social: SubjectStat;
  math: SubjectStat;
  science: SubjectStat;
}

export default function ConceptIndex() {
  const [grade, setGrade] = useState(3);
  const nav = useNavigate();
  const [stats, setStats] = useState<Record<string, SemesterStat>>({});

  useEffect(() => {
    getProfile().then((p) => setGrade(p?.grade ?? 3));
  }, []);

  const tabs = useMemo(() => availableFor(grade, "concept"), [grade]);

  useEffect(() => {
    if (!grade) return;

    getAllProgress("concept").then(async (p) => {
      const newStats: Record<string, SemesterStat> = {};

      for (const t of tabs) {
        if (t.dimmed) continue;

        const key = `${t.grade}-${t.semester}`;
        newStats[key] = {
          social: { done: 0, total: 0 },
          math: { done: 0, total: 0 },
          science: { done: 0, total: 0 },
        };

        const subjects = ["social", "math", "science"] as const;
        await Promise.all(
          subjects.map(async (sub) => {
            try {
              const book = await loadConcept(t.grade, t.semester as any, sub);
              if (book) {
                const total = book.units.reduce((acc, u) => acc + u.videos.length, 0);
                const done = book.units.reduce((acc, u) => {
                  return acc + u.videos.filter((v) => !!p[v.id]?.done).length;
                }, 0);
                newStats[key][sub] = { done, total };
              }
            } catch {
              // Ignore missing files
            }
          })
        );
      }

      setStats(newStats);
    });
  }, [grade, tabs]);

  return (
    <section className="space-y-5 animate-slide-up">
      <h1 className="font-black text-kidxl text-ink-900">
        <span className="text-sun-500">💡</span> 개념싹
      </h1>
      <p className="text-ink-500">쉬운 뜻풀이와 클립영상으로 교과 문해력을 높여요!</p>

      <div className="grid grid-cols-2 gap-3">
        {tabs.map((t) => {
          const key = `${t.grade}-${t.semester}`;
          const semesterStat = stats[key];

          return (
            <button
              key={t.label}
              disabled={t.dimmed}
              onClick={() => {
                if (t.dimmed) return;
                nav(`/concept/${t.grade}/${t.semester}`);
              }}
              className={
                "relative rounded-4xl p-5 text-left transition-all duration-150 overflow-hidden " +
                (t.dimmed
                  ? "dim cursor-not-allowed"
                  : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer")
              }
              style={{
                background: t.dimmed
                  ? "linear-gradient(135deg, #e0e0e0, #bdbdbd)"
                  : "linear-gradient(135deg, #f9a825 0%, #ffe082 100%)",
                boxShadow: t.dimmed ? "0 5px 0 #9e9e9e" : "0 7px 0 #b36b00",
              }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15" />
              <div className="text-3xl mb-2">💡</div>
              <div className="font-black text-kidlg text-ink-900">
                {t.grade}학년 {t.semester}학기
              </div>

              {!t.dimmed && semesterStat ? (
                <div className="text-[10px] text-ink-700 mt-1 font-bold space-y-0.5 text-left">
                  {(["social", "math", "science"] as const).map((sub) => {
                    const sStat = semesterStat[sub];
                    if (sStat.total === 0) return null;
                    const label = sub === "social" ? "사회" : sub === "math" ? "수학" : "과학";
                    const isStarted = sStat.done > 0;
                    return (
                      <div key={sub} className="leading-tight">
                        • {label} {isStarted ? `${sStat.done}/${sStat.total} 주제` : `${sStat.total}개 주제`}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-ink-600 mt-1 font-bold">사·수·과</div>
              )}

              {t.dimmed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                  <span className="bg-white/80 rounded-full px-3 py-1 text-xs font-black text-ink-500">
                    🔒 준비 중
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <Link to="/" className="btn-soft w-full">← 홈으로</Link>
    </section>
  );
}
