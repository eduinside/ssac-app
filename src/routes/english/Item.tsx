import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadEnglish } from "@/lib/content";
import { getProgress, patchProgress, pushRecent } from "@/lib/storage";
import { CheckRunner } from "@/components/Check";
import type { EnglishItem } from "@content/schema";

export default function EnglishItemPage() {
  const { grade: g, itemId } = useParams();
  const grade = Number(g);
  const nav = useNavigate();

  const [item, setItem] = useState<EnglishItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    loadEnglish(grade).then((book) => {
      const found = book.items.find((it) => it.id === itemId) ?? null;
      setItem(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [grade, itemId]);

  useEffect(() => {
    if (!itemId) return;
    getProgress("english", itemId).then((p) => setDone(!!p?.done));
  }, [itemId]);

  useEffect(() => {
    if (item) {
      pushRecent({ subject: "english", itemId: item.id, label: item.title, grade });
    }
  }, [item, grade]);

  async function markDone() {
    if (!itemId) return;
    await patchProgress("english", itemId, { done: true });
    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">🅰️</div>
        <p className="text-ink-500 font-bold">불러오는 중…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card text-center py-10 space-y-4">
        <div className="text-4xl">😅</div>
        <p className="text-ink-500 font-bold">항목을 찾을 수 없어요.</p>
        <button onClick={() => nav(`/english/${grade}`)} className="btn-soft">목록으로</button>
      </div>
    );
  }

  return (
    <article className="space-y-5 animate-slide-up pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/english/${grade}`} className="text-2xl text-ink-400 hover:text-ink-700 transition" aria-label="뒤로">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-ink-400 bg-ink-100 rounded-full px-3 py-1 inline-block mb-1">
            🅰️ {grade}학년 영어싹
          </div>
          <h1 className="font-black text-kidlg text-ink-900 leading-tight">{item.title}</h1>
        </div>
        {done && (
          <div className="chip font-black shrink-0 text-white border-pink-700"
            style={{ background: "#e91e8c" }}>
            ✓ 완료
          </div>
        )}
      </div>

      {/* Video */}
      {item.videoUrl ? (
        <div className="rounded-4xl overflow-hidden" style={{ boxShadow: "0 6px 0 #880e4f" }}>
          <video
            src={item.videoUrl}
            controls
            className="w-full"
            style={{ background: "#000" }}
          />
        </div>
      ) : (
        <div
          className="rounded-4xl p-8 text-center space-y-3"
          style={{ background: "linear-gradient(135deg, #e91e8c, #f48fb1)", boxShadow: "0 6px 0 #880e4f" }}
        >
          <div className="text-5xl">🎬</div>
          <div className="font-black text-kidlg text-white">영상 준비 중</div>
          <p className="text-white/80 text-sm">곧 영상이 추가될 거예요!</p>
        </div>
      )}

      {/* Quiz */}
      {item.quiz && (
        <div className="card space-y-3">
          <div className="font-black text-kid text-ink-700">✍️ 확인 문제</div>
          <CheckRunner
            check={item.quiz}
            onResult={(passed) => {
              setQuizPassed(passed);
              if (passed) markDone();
            }}
          />
        </div>
      )}

      {/* Complete button (no quiz case) */}
      {!item.quiz && !done && item.videoUrl && (
        <button
          onClick={markDone}
          className="btn-primary w-full py-3"
          style={{ background: "#e91e8c", boxShadow: "0 4px 0 #880e4f" }}
        >
          ✅ 영상 시청 완료
        </button>
      )}

      {done && (
        <div
          className="rounded-4xl p-6 text-center space-y-2"
          style={{ background: "#fce4ec", border: "3px solid #f48fb1" }}
        >
          <div className="text-4xl">🎉</div>
          <div className="font-black text-kidlg" style={{ color: "#e91e8c" }}>완료!</div>
        </div>
      )}

      <Link to={`/english/${grade}`} className="btn-soft w-full text-center py-2.5">
        ← 목록으로 돌아가기
      </Link>
    </article>
  );
}
