import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { findConceptKeyword } from "@/lib/content";
import type { ConceptBook, ConceptKeyword } from "@content/schema";
import { getProgress, patchProgress, pushRecent } from "@/lib/storage";
import { evaluateConceptBadges, BADGES } from "@/lib/badges";

export default function ConceptKeywordLearn() {
  const { grade: g, kid } = useParams();
  const grade = Number(g);
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    book: ConceptBook;
    keyword: ConceptKeyword;
    semester: number;
    subject: string;
  } | null>(null);

  const [done, setDone] = useState(false);
  const [starred, setStarred] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!kid) return;
    setLoading(true);
    findConceptKeyword(grade, kid)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [grade, kid]);

  useEffect(() => {
    if (!kid) return;
    getProgress("concept", kid).then((p) => {
      setDone(!!p?.done);
      setStarred(!!p?.starred);
    });
    // reset quiz state when keyword changes
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setQuizFinished(false);
  }, [kid]);

  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 3500);
    return () => clearTimeout(t);
  }, [newBadges]);

  useEffect(() => {
    if (data?.keyword) {
      pushRecent({
        subject: "concept",
        itemId: data.keyword.id,
        label: data.keyword.term,
        grade,
        semester: data.semester,
      });
    }
  }, [data, grade]);

  const navKeywords = useMemo(() => {
    if (!data) return { prev: null, next: null };
    const all = data.book.keywords;
    const idx = all.findIndex((k) => k.id === data.keyword.id);
    return {
      prev: all[idx - 1] ?? null,
      next: all[idx + 1] ?? null,
    };
  }, [data]);

  const isMp4 = useMemo(() => {
    if (!data?.keyword.youtubeUrl) return false;
    const url = data.keyword.youtubeUrl.toLowerCase();
    return url.endsWith(".mp4") || url.includes(".mp4?") || url.includes("commondatastorage");
  }, [data]);

  const isMp4_2 = useMemo(() => {
    if (!data?.keyword.youtubeUrl2) return false;
    const url = data.keyword.youtubeUrl2.toLowerCase();
    return url.endsWith(".mp4") || url.includes(".mp4?") || url.includes("commondatastorage");
  }, [data]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!data?.keyword.youtubeUrl || isMp4) return "";
    const url = data.keyword.youtubeUrl;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null;
  }, [data, isMp4]);

  const youtubeEmbedUrl2 = useMemo(() => {
    if (!data?.keyword.youtubeUrl2 || isMp4_2) return "";
    const url = data.keyword.youtubeUrl2;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null;
  }, [data, isMp4_2]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">💡</div>
        <p className="text-ink-500 font-bold">불러오는 중…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-10 space-y-4">
        <div className="text-4xl">😅</div>
        <p className="text-ink-500 font-bold">이 개념어를 찾을 수 없어요.</p>
        <button onClick={() => nav("/concept")} className="btn-soft">
          개념싹 홈으로
        </button>
      </div>
    );
  }

  async function toggleStar() {
    if (!kid) return;
    const v = !starred;
    setStarred(v);
    await patchProgress("concept", kid, { starred: v });
  }

  const { keyword, semester, subject } = data;
  const quizzes = keyword.quiz ?? [];
  const currentQuiz = quizzes[currentQuizIdx];
  const hasVideo = !!(isMp4 || youtubeEmbedUrl);
  const hasVideo2 = !!(isMp4_2 || youtubeEmbedUrl2);
  const orderStr = String(keyword.order).padStart(2, "0");

  const handleAnswerSelect = (ans: boolean) => {
    if (submitted) return;
    setSelectedAnswer(ans);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selectedAnswer === currentQuiz.answer;
    if (isCorrect) {
      setQuizScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    }
  };

  const completeKeyword = async () => {
    setDone(true);
    await patchProgress("concept", keyword.id, { done: true });
    const added = await evaluateConceptBadges();
    if (added.length) setNewBadges(added);
  };

  const handleNextQuiz = async () => {
    setSelectedAnswer(null);
    setSubmitted(false);

    if (currentQuizIdx + 1 < quizzes.length) {
      setCurrentQuizIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      await completeKeyword();
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setQuizFinished(false);
    setQuizScore({ correct: 0, total: quizzes.length });
  };

  return (
    <article className="space-y-4 animate-slide-up pb-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/concept/${grade}/${semester}`}
          className="text-2xl text-ink-400 hover:text-ink-700 transition"
          aria-label="뒤로"
        >
          ←
        </Link>
        <div className="text-xs font-bold text-ink-500 bg-ink-100 rounded-full px-3 py-1">
          {subject === "social" ? "사회 🗺️" : subject === "math" ? "수학 🔢" : "과학 🧪"} · {grade}-{semester}
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
      </div>

      {/* Keyword Title */}
      <h1 className="font-black text-kidxl text-ink-900 leading-snug flex items-baseline gap-2">
        <span className="text-sun-500">{orderStr}.</span> {keyword.term}
      </h1>

      {/* Video(s) */}
      {hasVideo && (
        <div
          className="relative aspect-video rounded-3xl overflow-hidden bg-black border-4 border-white"
          style={{ boxShadow: "0 8px 0 rgba(0,0,0,0.08)" }}
        >
          {isMp4 ? (
            <video src={keyword.youtubeUrl} controls className="w-full h-full object-contain" playsInline />
          ) : (
            <iframe
              src={youtubeEmbedUrl!}
              title={keyword.term}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      )}
      {hasVideo2 && (
        <div
          className="relative aspect-video rounded-3xl overflow-hidden bg-black border-4 border-white"
          style={{ boxShadow: "0 8px 0 rgba(0,0,0,0.08)" }}
        >
          {isMp4_2 ? (
            <video src={keyword.youtubeUrl2} controls className="w-full h-full object-contain" playsInline />
          ) : (
            <iframe
              src={youtubeEmbedUrl2!}
              title={keyword.term}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      )}

      {/* Concept Definition(s) */}
      <section className="space-y-3">
        <h2 className="font-black text-kidlg text-ink-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-sun-100 flex items-center justify-center text-lg">💡</span>
          핵심 개념 싹! 틔우기
        </h2>
        {keyword.defs && keyword.defs.length > 0 ? (
          <div className="space-y-2">
            {keyword.defs.map((def, i) => (
              <div
                key={i}
                className="relative rounded-4xl p-5 overflow-hidden text-white"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 6px 0 #065f46",
                }}
              >
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                <div className="relative z-10 space-y-1">
                  <div className="font-black text-kidlg leading-tight flex items-center gap-2">
                    <span>✨</span> {def.term}
                  </div>
                  <p className="text-white/90 text-sm font-medium leading-relaxed">{def.meaning}</p>
                  {def.example && (
                    <div className="flex items-start gap-1.5 text-xs text-white/80 bg-white/10 rounded-2xl px-3 py-1.5 mt-2">
                      <span className="font-black shrink-0">예</span>
                      <span className="font-bold">{def.example}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="relative rounded-4xl p-5 overflow-hidden text-white"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
              boxShadow: "0 6px 0 #065f46",
            }}
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-10 space-y-1">
              <div className="font-black text-kidlg leading-tight flex items-center gap-2">
                <span>✨</span> {keyword.term}
              </div>
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                {keyword.meaning}
              </p>
              {keyword.example && (
                <div className="flex items-start gap-1.5 text-xs text-white/80 bg-white/10 rounded-2xl px-3 py-1.5 mt-2">
                  <span className="font-black shrink-0">예</span>
                  <span className="font-bold">{keyword.example}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* OX Quiz */}
      {quizzes.length > 0 ? (
        <section className="card space-y-4">
          <h2 className="font-black text-kidlg text-ink-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sprout-100 flex items-center justify-center text-lg">✍️</span>
            OX 개념 확인 퀴즈!
          </h2>

          {!quizFinished ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-ink-400">
                <span>질문 {currentQuizIdx + 1} / {quizzes.length}</span>
                {done && <span className="text-sprout-600">✓ 완료한 개념어</span>}
              </div>

              <div className="bg-ink-50 p-4 rounded-3xl min-h-[4rem] flex items-center justify-center text-center">
                <p className="font-bold text-kid text-ink-800">
                  {currentQuiz.prompt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={submitted}
                  onClick={() => handleAnswerSelect(true)}
                  className={
                    "rounded-3xl flex flex-col items-center justify-center py-4 font-black transition-all duration-150 " +
                    (selectedAnswer === true
                      ? "bg-emerald-500 text-white hover:scale-100"
                      : "bg-white text-emerald-500 border-4 border-ink-100 hover:border-emerald-200 hover:scale-[1.02] active:scale-[0.98]")
                  }
                  style={
                    selectedAnswer === true
                      ? { boxShadow: "0 6px 0 #065f46" }
                      : { boxShadow: "0 3px 0 rgba(0,0,0,0.05)" }
                  }
                >
                  <span className="text-5xl mb-1">O</span>
                  <span className="text-xs font-black">그렇다</span>
                </button>

                <button
                  disabled={submitted}
                  onClick={() => handleAnswerSelect(false)}
                  className={
                    "rounded-3xl flex flex-col items-center justify-center py-4 font-black transition-all duration-150 " +
                    (selectedAnswer === false
                      ? "bg-coral-500 text-white hover:scale-100"
                      : "bg-white text-coral-500 border-4 border-ink-100 hover:border-coral-200 hover:scale-[1.02] active:scale-[0.98]")
                  }
                  style={
                    selectedAnswer === false
                      ? { boxShadow: "0 6px 0 #991b1b" }
                      : { boxShadow: "0 3px 0 rgba(0,0,0,0.05)" }
                  }
                >
                  <span className="text-5xl mb-1">X</span>
                  <span className="text-xs font-black">아니다</span>
                </button>
              </div>

              {!submitted ? (
                <button
                  disabled={selectedAnswer === null}
                  onClick={handleCheckAnswer}
                  className="btn-primary w-full disabled:opacity-30 py-3 text-sm"
                >
                  정답 확인하기
                </button>
              ) : (
                <div className="space-y-3">
                  <div
                    className={
                      "rounded-3xl p-4 flex items-start gap-3 font-bold text-sm " +
                      (selectedAnswer === currentQuiz.answer
                        ? "bg-sprout-100 text-sprout-700"
                        : "bg-coral-400/10 text-coral-500")
                    }
                  >
                    <span className="text-3xl">
                      {selectedAnswer === currentQuiz.answer ? "🎉" : "😭"}
                    </span>
                    <div>
                      <div className="text-base font-black">
                        {selectedAnswer === currentQuiz.answer ? "정답이야! 훌륭해!" : "아쉬워! 틀렸어."}
                      </div>
                      <p className="text-xs mt-1 text-ink-700 leading-relaxed">
                        정답은 <span className="font-black">"{currentQuiz.answer ? "O (그렇다)" : "X (아니다)"}"</span> 입니다.
                      </p>
                    </div>
                  </div>

                  <button onClick={handleNextQuiz} className="btn-primary w-full py-3 text-sm">
                    {currentQuizIdx + 1 < quizzes.length ? "다음 퀴즈로 →" : "퀴즈 완료하기 ✓"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl p-6 text-center space-y-4 bg-sprout-50 border-4 border-sprout-200 animate-bounce-in">
              <div className="text-6xl animate-wiggle">🏆</div>
              <h3 className="font-black text-kidlg text-sprout-700">
                개념어 학습 완료!
              </h3>
              <p className="text-ink-600 text-sm">
                {quizzes.length}개 퀴즈를 모두 풀었어!<br />
                <span className="font-black">{keyword.term}</span> 개념을 내 것으로 만들었어 👏
              </p>
              <div className="flex gap-2">
                <button onClick={handleResetQuiz} className="btn-soft text-xs flex-1">
                  🔄 다시 풀기
                </button>
                <Link
                  to={`/concept/${grade}/${semester}`}
                  className="btn-primary text-xs flex-1 flex items-center justify-center"
                  style={{ boxShadow: "0 4px 0 #266607" }}
                >
                  목록으로
                </Link>
              </div>
            </div>
          )}
        </section>
      ) : (
        // No quiz — single complete button
        <button
          onClick={async () => { await completeKeyword(); }}
          disabled={done}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50"
        >
          {done ? "✓ 학습 완료" : "학습 완료로 표시"}
        </button>
      )}

      {/* Prev / Next keyword */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navKeywords.prev && nav(`/concept/${grade}/keyword/${navKeywords.prev.id}`)}
          disabled={!navKeywords.prev}
          className="btn-soft flex-1 disabled:opacity-30 py-3 text-xs"
        >
          ← 이전 개념어
        </button>
        <button
          onClick={() => {
            if (navKeywords.next) {
              nav(`/concept/${grade}/keyword/${navKeywords.next.id}`);
            } else {
              nav(`/concept/${grade}/${semester}`);
            }
          }}
          className="btn-primary flex-1 py-3 text-xs"
          style={{ boxShadow: "0 4px 0 #0d3b7a" }}
        >
          {navKeywords.next ? "다음 개념어 →" : "목록으로 ✓"}
        </button>
      </div>

      <Link to={`/concept/${grade}/${semester}`} className="btn-soft w-full text-center py-2.5">
        ← 다른 개념어 보기 (목록으로)
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
