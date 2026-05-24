import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadEnglish } from "@/lib/content";
import { getProgress, patchProgress, pushRecent } from "@/lib/storage";
import { CheckRunner } from "@/components/Check";
import { evaluateEnglishBadges, BADGES } from "@/lib/badges";
import type { EnglishItem } from "@content/schema";

export default function EnglishItemPage() {
  const { grade: g, itemId } = useParams();
  const grade = Number(g);
  const nav = useNavigate();

  const [item, setItem] = useState<EnglishItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [starred, setStarred] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

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
    getProgress("english", itemId).then((p) => {
      setDone(!!p?.done);
      setStarred(!!p?.starred);
    });
  }, [itemId]);

  useEffect(() => {
    if (item) {
      pushRecent({ subject: "english", itemId: item.id, label: item.title, grade });
    }
  }, [item, grade]);

  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 3500);
    return () => clearTimeout(t);
  }, [newBadges]);

  async function toggleStar() {
    if (!itemId) return;
    const v = !starred;
    setStarred(v);
    await patchProgress("english", itemId, { starred: v });
  }

  async function markDone() {
    if (!itemId) return;
    await patchProgress("english", itemId, { done: true });
    setDone(true);
    const added = await evaluateEnglishBadges();
    if (added.length) setNewBadges(added);
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
        <button
          onClick={toggleStar}
          className={
            "w-12 h-12 flex items-center justify-center rounded-2xl text-2xl transition-all duration-200 active:scale-95 " +
            (starred ? "scale-110" : "grayscale opacity-50 hover:opacity-80 hover:grayscale-0")
          }
          aria-label="별표"
        >
          ⭐
        </button>
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

      {/* Badge toast */}
      {newBadges.length > 0 && (
        <div
          className="fixed bottom-24 sm:bottom-6 inset-x-4 max-w-sm mx-auto rounded-4xl p-4 z-50 animate-bounce-in"
          style={{
            background: "linear-gradient(135deg, #f9a825, #ffd54f)",
            boxShadow: "0 8px 0 #c67a00, 0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl animate-wiggle">🏅</div>
            <div>
              <div className="font-black text-ink-900">뱃지 획득!</div>
              <div className="text-sm text-ink-700">
                {newBadges.map((c) => `${BADGES[c]?.emoji ?? ""} ${BADGES[c]?.name ?? c}`).join("  ")}
              </div>
            </div>
            <button
              onClick={() => setNewBadges([])}
              className="ml-auto text-ink-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
