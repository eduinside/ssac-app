import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { findConceptVideo, loadConcept } from "@/lib/content";
import type { ConceptBook, ConceptVideo } from "@content/schema";
import { getProgress, patchProgress, pushRecent } from "@/lib/storage";
import { evaluateConceptBadges, BADGES } from "@/lib/badges";

export default function ConceptVideoLearn() {
  const { grade: g, videoId } = useParams();
  const grade = Number(g);
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    book: ConceptBook;
    video: ConceptVideo;
    semester: number;
    subject: string;
  } | null>(null);

  const [done, setDone] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // Load video and book details
  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    findConceptVideo(grade, videoId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [grade, videoId]);

  // Load progress
  useEffect(() => {
    if (!videoId) return;
    getProgress("concept", videoId).then((p) => {
      setDone(!!p?.done);
    });
  }, [videoId]);

  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 3500);
    return () => clearTimeout(t);
  }, [newBadges]);

  // Push to recent history when video is loaded
  useEffect(() => {
    if (data?.video) {
      pushRecent({
        subject: "concept",
        itemId: data.video.id,
        label: data.video.title,
        grade,
        semester: data.semester,
      });
    }
  }, [data, grade]);

  // Find next/prev video in the same book
  const navVideos = useMemo(() => {
    if (!data) return { prev: null, next: null };
    const allVideos = data.book.units.flatMap((u) => u.videos);
    const idx = allVideos.findIndex((v) => v.id === data.video.id);
    return {
      prev: allVideos[idx - 1] ?? null,
      next: allVideos[idx + 1] ?? null,
    };
  }, [data]);

  // Helper to detect if URL is an MP4 video file
  const isMp4 = useMemo(() => {
    if (!data?.video.youtubeUrl) return false;
    const url = data.video.youtubeUrl.toLowerCase();
    return url.endsWith(".mp4") || url.includes(".mp4?") || url.includes("commondatastorage");
  }, [data]);

  // Helper to extract YouTube embed URL
  const youtubeEmbedUrl = useMemo(() => {
    if (!data?.video.youtubeUrl || isMp4) return "";
    const url = data.video.youtubeUrl;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null;
  }, [data, isMp4]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">💡</div>
        <p className="text-ink-500 font-bold">영상 로딩 중…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-10 space-y-4">
        <div className="text-4xl">😅</div>
        <p className="text-ink-500 font-bold">이 영상을 찾을 수 없어요.</p>
        <button onClick={() => nav("/concept")} className="btn-soft">
          개념싹 홈으로
        </button>
      </div>
    );
  }

  const { video, semester, subject, book } = data;
  const quizzes = video.quiz ?? [];
  const currentQuiz = quizzes[currentQuizIdx];

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

  const handleNextQuiz = async () => {
    setSelectedAnswer(null);
    setSubmitted(false);

    if (currentQuizIdx + 1 < quizzes.length) {
      setCurrentQuizIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      setDone(true);
      await patchProgress("concept", video.id, { done: true });
      const added = await evaluateConceptBadges();
      if (added.length) setNewBadges(added);
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
          {subject === "social" ? "사회 🗺️" : subject === "math" ? "수학 🔢" : "과학 🧪"} · {grade}학년 {semester}학기
        </div>
      </div>

      {/* Video Title */}
      <h1 className="font-black text-kidlg text-ink-900 leading-snug">
        🎥 {video.title}
      </h1>

      {/* Video Player Area — only shown when a valid URL is present */}
      {(isMp4 || youtubeEmbedUrl) && (
        <div
          className="relative aspect-video rounded-3xl overflow-hidden bg-black border-4 border-white"
          style={{ boxShadow: "0 8px 0 rgba(0,0,0,0.08)" }}
        >
          {isMp4 ? (
            <video
              src={video.youtubeUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          ) : (
            <iframe
              src={youtubeEmbedUrl!}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      )}

      {/* Concept Definition Cards (Eohwi-ssac styled) */}
      <section className="space-y-3">
        <h2 className="font-black text-kidlg text-ink-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-sun-100 flex items-center justify-center text-lg">💡</span>
          핵심 개념 싹! 틔우기
        </h2>
        <div className="grid gap-3">
          {video.concepts.map((concept, idx) => (
            <div
              key={concept.term}
              className="relative rounded-4xl p-5 overflow-hidden text-white"
              style={{
                background:
                  idx % 2 === 0
                    ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                    : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                boxShadow: idx % 2 === 0 ? "0 6px 0 #065f46" : "0 6px 0 #92400e",
              }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative z-10 space-y-1">
                <div className="font-black text-kidlg leading-tight flex items-center gap-2">
                  <span>✨</span> {concept.term}
                </div>
                <p className="text-white/90 text-sm font-medium leading-relaxed">
                  {concept.meaning}
                </p>
                {concept.example && (
                  <div className="flex items-start gap-1.5 text-xs text-white/80 bg-white/10 rounded-2xl px-3 py-1.5 mt-2">
                    <span className="font-black shrink-0">예</span>
                    <span className="font-bold">{concept.example}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OX Quiz Runner */}
      {quizzes.length > 0 && (
        <section className="card space-y-4">
          <h2 className="font-black text-kidlg text-ink-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sprout-100 flex items-center justify-center text-lg">✍️</span>
            OX 개념 확인 퀴즈!
          </h2>

          {!quizFinished ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-ink-400">
                <span>질문 {currentQuizIdx + 1} / {quizzes.length}</span>
                {done && <span className="text-sprout-600">✓ 완료한 영상</span>}
              </div>

              {/* Quiz Prompt */}
              <div className="bg-ink-50 p-4 rounded-3xl min-h-[4rem] flex items-center justify-center text-center">
                <p className="font-bold text-kid text-ink-800">
                  {currentQuiz.prompt}
                </p>
              </div>

              {/* OX Selection Buttons */}
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

              {/* Submit / Feedback */}
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
                  {/* Explanation card */}
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
                        {selectedAnswer !== currentQuiz.answer && (
                          <span className="block mt-1 text-ink-500">
                            동영상에서 설명한 개념들을 다시 한번 꼼꼼하게 읽어보자!
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuiz}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {currentQuizIdx + 1 < quizzes.length ? "다음 퀴즈로 →" : "퀴즈 완료하기 ✓"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Celebration Card */
            <div className="rounded-3xl p-6 text-center space-y-4 bg-sprout-50 border-4 border-sprout-200 animate-bounce-in">
              <div className="text-6xl animate-wiggle">🏆</div>
              <h3 className="font-black text-kidlg text-sprout-700">
                개념 복습 완료!
              </h3>
              <p className="text-ink-600 text-sm">
                영상을 보고 {quizzes.length}개의 OX 퀴즈를 모두 완료했어!<br />
                개념을 내 것으로 만든 너의 열정을 칭찬해 👏
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
                  단원 목록으로
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Prev / Next video Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navVideos.prev && nav(`/concept/${grade}/video/${navVideos.prev.id}`)}
          disabled={!navVideos.prev}
          className="btn-soft flex-1 disabled:opacity-30 py-3 text-xs"
        >
          ← 이전 영상
        </button>
        <button
          onClick={() => {
            if (navVideos.next) {
              nav(`/concept/${grade}/video/${navVideos.next.id}`);
            } else {
              nav(`/concept/${grade}/${semester}`);
            }
          }}
          className="btn-primary flex-1 py-3 text-xs"
          style={{ boxShadow: "0 4px 0 #0d3b7a" }}
        >
          {navVideos.next ? "다음 영상 →" : "단원 목록으로 ✓"}
        </button>
      </div>

      <Link to={`/concept/${grade}/${semester}`} className="btn-soft w-full text-center py-2.5">
        ← 다른 주제 보기 (목록으로)
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
