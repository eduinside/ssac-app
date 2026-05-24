import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { loadReading } from "@/lib/content";
import { getActiveStudent, getAllProgress } from "@/lib/storage";
import type { ReadingTopic } from "@content/schema";

const GRADE_COLORS = [
  { bg: "from-sky2-400 to-sky2-500", shadow: "#0d47a1", badge: "bg-sky2-100 text-sky2-700" },
  { bg: "from-sky2-400 to-sky2-500", shadow: "#0d47a1", badge: "bg-sky2-100 text-sky2-700" },
  { bg: "from-sky2-400 to-sky2-500", shadow: "#0d47a1", badge: "bg-sky2-100 text-sky2-700" },
  { bg: "from-sky2-400 to-sky2-500", shadow: "#0d47a1", badge: "bg-sky2-100 text-sky2-700" },
];

export default function ReadingIndex() {
  const { grade: gradeParam } = useParams();
  const nav = useNavigate();
  const [grade, setGrade] = useState(4);
  const [topics, setTopics] = useState<ReadingTopic[]>([]);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveStudent().then((s) => {
      const g = gradeParam ? Number(gradeParam) : (s?.grade ?? 4);
      const clamped = Math.min(Math.max(g, 2), 4);
      setGrade(clamped);
    });
  }, [gradeParam]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReading(grade), getAllProgress("reading")]).then(([book, prog]) => {
      setTopics(book.topics);
      setDoneSet(new Set(Object.entries(prog).filter(([, v]) => v.done).map(([k]) => k)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [grade]);

  const done = topics.filter((t) => doneSet.has(t.id)).length;
  const total = topics.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const hasContent = (t: ReadingTopic) => t.read.trim().length > 0 || t.activities.length > 0 || t.apply.length > 0;

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-kidxl text-ink-900">
          <span className="text-sky2-500">📖</span> 독해싹
        </h1>
        <div className="flex gap-2">
          {[2, 3, 4].map((g) => (
            <button
              key={g}
              onClick={() => nav(`/reading/${g}`)}
              className={
                "chip font-black transition-all " +
                (grade === g
                  ? "bg-sky2-500 text-white border-sky2-600"
                  : "bg-ink-100 text-ink-500 border-ink-200 hover:bg-sky2-100")
              }
            >
              {g}학년
            </button>
          ))}
        </div>
      </div>

      {/* Progress banner */}
      {!loading && total > 0 && (
        <div
          className="rounded-4xl p-5"
          style={{ background: "linear-gradient(135deg, #1e88e5, #5ab8ff)", boxShadow: "0 6px 0 #0d47a1" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-white text-kidlg">{grade}학년 독해싹</span>
            <span className="font-black text-white/90 text-sm">{done}/{total} 완료</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-white/80 text-xs mt-1.5 font-bold">{pct}%</div>
        </div>
      )}

      {/* Topic list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-5xl animate-float-slow">📖</div>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((t, i) => {
            const isDone = doneSet.has(t.id);
            const ready = hasContent(t);
            return (
              <Link
                key={t.id}
                to={ready ? `/reading/${grade}/${t.id}` : "#"}
                onClick={(e) => { if (!ready) e.preventDefault(); }}
                className={
                  "flex items-center gap-4 rounded-3xl px-5 py-4 transition-all " +
                  (ready
                    ? "bg-white border-2 border-ink-100 hover:border-sky2-300 hover:shadow-sm active:scale-[0.99]"
                    : "bg-ink-50 border-2 border-ink-100 opacity-60 cursor-default")
                }
                style={ready ? { boxShadow: "0 3px 0 rgba(0,0,0,0.05)" } : {}}
              >
                <div
                  className={
                    "w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 " +
                    (isDone
                      ? "bg-sky2-500 text-white"
                      : ready
                      ? "bg-sky2-100 text-sky2-600"
                      : "bg-ink-200 text-ink-400")
                  }
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={"font-black text-kid truncate " + (isDone ? "text-sky2-700" : ready ? "text-ink-900" : "text-ink-400")}>
                    {t.title}
                  </div>
                  {!ready && (
                    <div className="text-xs text-ink-400 font-bold mt-0.5">준비 중</div>
                  )}
                </div>
                {isDone && <span className="text-sky2-400 text-lg shrink-0">✓</span>}
                {ready && !isDone && <span className="text-ink-300 text-lg shrink-0">→</span>}
              </Link>
            );
          })}
        </div>
      )}

      <Link to="/" className="btn-soft w-full text-center">← 홈으로</Link>
    </section>
  );
}
