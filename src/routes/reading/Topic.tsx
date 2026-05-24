import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadReading } from "@/lib/content";
import type { ReadingTopic as TopicType } from "@content/schema";
import { getProgress, patchProgress, pushRecent } from "@/lib/storage";
import { CheckRunner } from "@/components/Check";
import { evaluateReadingBadges, BADGES } from "@/lib/badges";

type Phase = "main" | "apply";

export default function ReadingTopic() {
  const { grade: g, topicId } = useParams();
  const grade = Number(g);
  const nav = useNavigate();

  const [topic, setTopic] = useState<TopicType | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [starred, setStarred] = useState(false);
  const [phase, setPhase] = useState<Phase>("main");
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // activities: track which are passed
  const [actPassed, setActPassed] = useState<boolean[]>([]);

  // apply: text values + submitted flags
  const [applyTexts, setApplyTexts] = useState<Record<string, string>>({});
  const [applyDone, setApplyDone] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  // Load topic
  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    loadReading(grade).then((book) => {
      const t = book.topics.find((x) => x.id === topicId) ?? null;
      setTopic(t);
      setLoading(false);
      if (t) {
        setActPassed(new Array(t.activities.length).fill(false));
      }
    }).catch(() => setLoading(false));
  }, [grade, topicId]);

  // Load persisted progress
  useEffect(() => {
    if (!topicId) return;
    getProgress("reading", topicId).then((p) => {
      setDone(!!p?.done);
      setStarred(!!p?.starred);
    });
  }, [topicId]);

  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 3500);
    return () => clearTimeout(t);
  }, [newBadges]);

  // Load saved apply texts
  useEffect(() => {
    if (!topic) return;
    const load = async () => {
      const texts: Record<string, string> = {};
      const dones: Record<string, boolean> = {};
      for (const item of topic.apply) {
        const p = await getProgress("reading", `${topicId}-apply-${item.id}`);
        texts[item.id] = p?.text ?? "";
        dones[item.id] = !!p?.done;
      }
      setApplyTexts(texts);
      setApplyDone(dones);
      if (topic.apply.length > 0 && topic.apply.every((it) => dones[it.id])) {
        setPhase("apply");
      }

    };
    load();
  }, [topic, topicId]);

  // Push recent
  useEffect(() => {
    if (topic) {
      pushRecent({ subject: "reading", itemId: topic.id, label: topic.title, grade });
    }
  }, [topic, grade]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  async function toggleStar() {
    if (!topicId) return;
    const v = !starred;
    setStarred(v);
    await patchProgress("reading", topicId, { starred: v });
  }

  const allApplyFilled = topic?.apply.every((it) => (applyTexts[it.id] ?? "").trim().length >= 3) ?? false;
  const allApplySubmitted = topic?.apply.every((it) => applyDone[it.id]) ?? false;

  async function saveApplyText(id: string, text: string) {
    setApplyTexts((prev) => ({ ...prev, [id]: text }));
    await patchProgress("reading", `${topicId}-apply-${id}`, { text });
  }

  async function handleSubmitApply() {
    if (!topic || !allApplyFilled) return;
    setSubmitting(true);
    for (const item of topic.apply) {
      await patchProgress("reading", `${topicId}-apply-${item.id}`, {
        text: applyTexts[item.id] ?? "",
        done: true,
      });
      setApplyDone((prev) => ({ ...prev, [item.id]: true }));
    }
    await patchProgress("reading", topicId!, { done: true });
    setDone(true);
    setSubmitting(false);
    const added = await evaluateReadingBadges();
    if (added.length) setNewBadges(added);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl animate-float-slow">📖</div>
        <p className="text-ink-500 font-bold">불러오는 중…</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="card text-center py-10 space-y-4">
        <div className="text-4xl">😅</div>
        <p className="text-ink-500 font-bold">주제를 찾을 수 없어요.</p>
        <button onClick={() => nav(`/reading/${grade}`)} className="btn-soft">
          목록으로
        </button>
      </div>
    );
  }

  // If no content yet
  if (!topic.read && topic.activities.length === 0 && topic.apply.length === 0) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <Link to={`/reading/${grade}`} className="text-2xl text-ink-400 hover:text-ink-700 transition">←</Link>
          <h1 className="font-black text-kidlg text-ink-900 flex-1">{topic.title}</h1>
        </div>
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">🚧</div>
          <p className="font-black text-kidlg text-ink-600">준비 중이에요</p>
          <p className="text-ink-400 text-sm">곧 내용이 추가될 거예요!</p>
        </div>
        <Link to={`/reading/${grade}`} className="btn-soft w-full text-center">← 목록으로</Link>
      </div>
    );
  }

  const hasActivities = topic.activities.length > 0;
  const hasApply = topic.apply.length > 0;

  return (
    <article className="space-y-5 animate-slide-up pb-8" ref={topRef}>
      {/* Navigation & header */}
      <div className="flex items-center gap-3">
        <Link to={`/reading/${grade}`} className="text-2xl text-ink-400 hover:text-ink-700 transition" aria-label="뒤로">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-ink-400 bg-ink-100 rounded-full px-3 py-1 inline-block mb-1">
            📖 {grade}학년 독해싹
          </div>
          <h1 className="font-black text-kidlg text-ink-900 leading-tight">{topic.title}</h1>
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
          <div className="chip bg-sky2-100 text-sky2-700 border-sky2-200 font-black shrink-0">✓ 완료</div>
        )}
      </div>

      {/* Phase tabs */}
      {hasApply && (
        <div className="flex gap-2">
          {[
            { key: "main" as Phase, label: "📄 읽기 · 활동하기" },
            { key: "apply" as Phase, label: "✨ 적용하기" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setPhase(key); scrollTop(); }}
              className={
                "flex-1 rounded-2xl py-2.5 font-black text-sm transition-all " +
                (phase === key
                  ? "bg-sky2-500 text-white"
                  : "bg-ink-100 text-ink-500 hover:bg-sky2-100 hover:text-sky2-700")
              }
              style={phase === key ? { boxShadow: "0 4px 0 #0d47a1" } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── 읽기 + 활동하기 ── */}
      {phase === "main" && (
        <section className="space-y-5">
          <div
            className="rounded-4xl p-6 space-y-4 bg-white border-2 border-ink-100"
            style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.05)" }}
          >
            <h2 className="font-black text-kidlg text-center text-ink-900 border-b-2 border-ink-100 pb-4">
              {topic.title}
            </h2>
            <div className="text-kid text-ink-800 leading-relaxed whitespace-pre-line font-medium">
              {topic.read}
            </div>
          </div>

          {hasActivities && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky2-100 flex items-center justify-center text-lg">✍️</span>
                <h2 className="font-black text-kidlg text-ink-800">활동하기</h2>
              </div>
              {topic.activities.map((act, i) => (
                <div key={i} className="card space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm shrink-0 " +
                        (actPassed[i] ? "bg-sky2-500 text-white" : "bg-sky2-100 text-sky2-600")
                      }
                    >
                      {actPassed[i] ? "✓" : i + 1}
                    </span>
                    <span className="text-xs font-black text-ink-400">문제 {i + 1}</span>
                  </div>
                  <CheckRunner
                    key={`${topic.id}-act-${i}`}
                    check={act}
                    onResult={(passed) => {
                      setActPassed((prev) => {
                        const next = [...prev];
                        next[i] = passed;
                        return next;
                      });
                    }}
                  />
                </div>
              ))}
            </>
          )}

          {hasApply && (
            <button
              onClick={() => { setPhase("apply"); scrollTop(); }}
              className="btn-primary w-full py-3"
              style={{ boxShadow: "0 4px 0 #0d47a1" }}
            >
              적용하기 →
            </button>
          )}
        </section>
      )}

      {/* ── 적용하기 ── */}
      {phase === "apply" && hasApply && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky2-100 flex items-center justify-center text-lg">✨</span>
            <h2 className="font-black text-kidlg text-ink-800">적용하기</h2>
          </div>

          {done || allApplySubmitted ? (
            /* 완료 상태 — 저장된 내용 읽기 전용 표시 */
            <div className="space-y-4">
              <div className="rounded-4xl p-6 text-center space-y-3 bg-sky2-50 border-4 border-sky2-200 animate-bounce-in">
                <div className="text-6xl animate-wiggle">🎉</div>
                <h3 className="font-black text-kidlg text-sky2-700">독해 완료!</h3>
                <p className="text-ink-600 text-sm">
                  글을 읽고 내 생각을 잘 표현했어. 정말 훌륭해! 👏
                </p>
              </div>
              {topic.apply.map((item) => (
                <div key={item.id} className="card space-y-2">
                  {item.label && (
                    <div className="font-black text-xs text-sky2-600 bg-sky2-50 rounded-xl px-3 py-1.5 inline-block">
                      {item.label}
                    </div>
                  )}
                  <p className="font-bold text-kid text-ink-700">{item.prompt}</p>
                  <div className="rounded-2xl bg-ink-50 px-4 py-3 text-kid text-ink-700 whitespace-pre-line">
                    {applyTexts[item.id] || "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 입력 폼 */
            <div className="space-y-4">
              {topic.apply.map((item) => (
                <div key={item.id} className="card space-y-3">
                  {item.label && (
                    <div className="font-black text-xs text-sky2-600 bg-sky2-50 rounded-xl px-3 py-1.5 inline-block">
                      {item.label}
                    </div>
                  )}
                  <p className="font-bold text-kid text-ink-800">{item.prompt}</p>
                  {item.example && (
                    <div className="flex items-start gap-2 text-sm text-ink-400 bg-ink-100 rounded-2xl px-3 py-2">
                      <span className="shrink-0">✍️ 예:</span>
                      <span>{item.example}</span>
                    </div>
                  )}
                  <textarea
                    value={applyTexts[item.id] ?? ""}
                    onChange={(e) => saveApplyText(item.id, e.target.value)}
                    rows={item.example ? 5 : 3}
                    className="w-full rounded-2xl border-2 border-ink-200 focus:border-sky2-400 px-4 py-3 text-kid outline-none transition-colors resize-none"
                    placeholder="내 생각을 써봐! (짧아도 괜찮아)"
                  />
                </div>
              ))}

              <button
                disabled={!allApplyFilled || submitting}
                onClick={handleSubmitApply}
                className="btn-primary w-full py-3 disabled:opacity-30"
                style={{ boxShadow: "0 4px 0 #0d47a1" }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    저장 중…
                  </span>
                ) : (
                  "✅ 제출하고 완료하기"
                )}
              </button>
            </div>
          )}
        </section>
      )}

      <Link to={`/reading/${grade}`} className="btn-soft w-full text-center py-2.5">
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
