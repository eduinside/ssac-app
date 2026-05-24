import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadEnglish } from "@/lib/content";
import { getActiveStudent, getAllProgress } from "@/lib/storage";
import type { EnglishItem } from "@content/schema";

export default function EnglishIndex() {
  const { grade: gradeParam } = useParams();
  const nav = useNavigate();
  const [grade, setGrade] = useState(3);
  const [items, setItems] = useState<EnglishItem[]>([]);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveStudent().then((s) => {
      const g = gradeParam ? Number(gradeParam) : (s?.grade ?? 3);
      const clamped = Math.min(Math.max(g, 3), 6);
      setGrade(clamped);
    });
  }, [gradeParam]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEnglish(grade), getAllProgress("english")]).then(([book, prog]) => {
      setItems(book.items);
      setDoneSet(new Set(Object.entries(prog).filter(([, v]) => v.done).map(([k]) => k)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [grade]);

  const done = items.filter((it) => doneSet.has(it.id)).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-kidxl text-ink-900">
          <span>🅰️</span> 영어싹
        </h1>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((g) => (
            <button
              key={g}
              onClick={() => nav(`/english/${g}`)}
              className={
                "chip font-black transition-all " +
                (grade === g
                  ? "text-white border-pink-700"
                  : "bg-ink-100 text-ink-500 border-ink-200 hover:bg-pink-100")
              }
              style={grade === g ? { background: "#e91e8c", boxShadow: "0 3px 0 #880e4f" } : {}}
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
          style={{ background: "linear-gradient(135deg, #e91e8c, #f48fb1)", boxShadow: "0 6px 0 #880e4f" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-white text-kidlg">{grade}학년 영어싹</span>
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

      {/* Item list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-5xl animate-float-slow">🅰️</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const isDone = doneSet.has(item.id);
            const hasVideo = !!item.videoUrl;
            return (
              <Link
                key={item.id}
                to={`/english/${grade}/${item.id}`}
                className="flex items-center gap-4 rounded-3xl px-5 py-4 transition-all bg-white border-2 border-ink-100 hover:border-pink-300 hover:shadow-sm active:scale-[0.99]"
                style={{ boxShadow: "0 3px 0 rgba(0,0,0,0.05)" }}
              >
                <div
                  className={
                    "w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 " +
                    (isDone ? "text-white" : "text-pink-600")
                  }
                  style={isDone
                    ? { background: "#e91e8c" }
                    : { background: "#fce4ec" }}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={"font-black text-kid truncate " + (isDone ? "text-pink-700" : "text-ink-900")}>
                    {item.title}
                  </div>
                  {!hasVideo && (
                    <div className="text-xs text-ink-400 font-bold mt-0.5">영상 준비 중</div>
                  )}
                </div>
                {isDone
                  ? <span className="text-pink-400 text-lg shrink-0">✓</span>
                  : <span className="text-ink-300 text-lg shrink-0">→</span>
                }
              </Link>
            );
          })}
        </div>
      )}

      <Link to="/" className="btn-soft w-full text-center">← 홈으로</Link>
    </section>
  );
}
