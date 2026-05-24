import { useState } from "react";
import type { Check } from "@content/schema";
import { gradeWriting } from "@/lib/ai";

export function CheckRunner({
  check,
  onResult,
}: {
  check: Check;
  onResult: (passed: boolean, score?: number) => void;
}) {
  if (check.type === "mcq") return <MCQCheck check={check} onResult={onResult} />;
  if (check.type === "fill") return <FillCheck check={check} onResult={onResult} />;
  return <WriteCheck check={check} onResult={onResult} />;
}

/* ── MCQ ─────────────────────────────────────────────────── */
function MCQCheck({
  check,
  onResult,
}: {
  check: Extract<Check, { type: "mcq" }>;
  onResult: (passed: boolean, score?: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0); // 0=미제출, 1=1차완료, 2=최종

  const CHOICE_LABELS = ["①", "②", "③", "④", "⑤", "⑥"];

  const isCorrect = picked === check.answer;
  const isFinal = submitted && (isCorrect || attempts >= 2);
  const isWrongFirst = submitted && !isCorrect && attempts === 1;

  function handleSubmit() {
    const next = attempts + 1;
    setAttempts(next);
    setSubmitted(true);
    if (isCorrect) {
      onResult(true, next === 1 ? 100 : 50); // 첫 번째 정답 100점, 재도전 정답 50점
    } else if (next >= 2) {
      onResult(false, 0);
    }
    // 첫 번째 오답은 onResult 호출 보류 — 재도전 기회 제공
  }

  function handleRetry() {
    setPicked(null);
    setSubmitted(false);
    // attempts는 1로 유지 → 다음 제출 시 attempts=2가 되어 최종 처리
  }

  return (
    <div className="space-y-3">
      <p className="font-bold text-kid text-ink-800">{check.prompt}</p>
      <div className="grid gap-2.5">
        {check.choices.map((c, i) => {
          const isAnswer = i === check.answer;
          const isPicked = i === picked;
          const showRight = isFinal && isAnswer;
          const showWrong = isFinal && isPicked && !isAnswer;
          // 첫 번째 오답 표시 (재도전 전): 선택한 것만 빨갛게, 정답은 숨김
          const showWrongFirst = isWrongFirst && isPicked && !isAnswer;

          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setPicked(i)}
              className={
                "w-full text-left rounded-2xl border-2 px-4 py-3 font-bold text-kid transition-all duration-200 " +
                (showRight
                  ? "border-sprout-500 bg-sprout-100 text-sprout-700"
                  : showWrong || showWrongFirst
                  ? "border-coral-400 bg-coral-400/10 text-coral-500"
                  : isPicked && !submitted
                  ? "border-sprout-400 bg-sprout-50"
                  : "border-ink-100 bg-white hover:border-sprout-300 hover:bg-sprout-50")
              }
              style={
                isPicked && !submitted
                  ? { boxShadow: "0 3px 0 #266607" }
                  : showRight
                  ? { boxShadow: "0 3px 0 #266607" }
                  : {}
              }
            >
              <span className="mr-2 text-ink-400">{CHOICE_LABELS[i]}</span>
              {c}
              {showRight && <span className="ml-auto float-right">✓</span>}
              {(showWrong || showWrongFirst) && <span className="ml-auto float-right">✗</span>}
            </button>
          );
        })}
      </div>

      {/* 제출 전 */}
      {!submitted && (
        <button
          disabled={picked === null}
          onClick={handleSubmit}
          className="btn-primary w-full disabled:opacity-30"
        >
          정답 확인
        </button>
      )}

      {/* 1차 오답 — 재도전 기회 */}
      {isWrongFirst && (
        <div className="rounded-2xl p-4 space-y-3 bg-coral-400/10">
          <div className="flex items-center gap-3 font-black text-kidlg text-coral-500">
            <span className="text-3xl">😅</span>
            <div>
              <div>아쉽지만 틀렸어!</div>
              <div className="text-sm font-bold opacity-70">한 번 더 도전해봐! (마지막 기회)</div>
            </div>
          </div>
          <button onClick={handleRetry} className="btn-primary w-full">
            🔄 다시 도전하기
          </button>
        </div>
      )}

      {/* 최종 결과 */}
      {isFinal && (
        <div
          className={
            "rounded-2xl p-4 flex items-center gap-3 font-black text-kidlg " +
            (isCorrect ? "bg-sprout-100 text-sprout-700" : "bg-coral-400/10 text-coral-500")
          }
        >
          <span className="text-3xl">{isCorrect ? "🎉" : "😭"}</span>
          <div>
            <div>{isCorrect ? (attempts === 1 ? "정답이야!" : "재도전 성공!") : "아쉽지만 틀렸어!"}</div>
            {!isCorrect && (
              <div className="text-sm font-bold mt-0.5 opacity-80">
                정답: {CHOICE_LABELS[check.answer]} {check.choices[check.answer]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fill ─────────────────────────────────────────────────── */
function FillCheck({
  check,
  onResult,
}: {
  check: Extract<Check, { type: "fill" }>;
  onResult: (passed: boolean, score?: number) => void;
}) {
  const [val, setVal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ok = val.trim() === check.answer.trim();

  return (
    <div className="space-y-3">
      <p className="font-bold text-kid text-ink-800">{check.prompt}</p>
      {check.hint && (
        <div className="flex items-center gap-2 text-sm text-ink-400 bg-ink-100 rounded-2xl px-3 py-2">
          <span>💡</span> 힌트: {check.hint}
        </div>
      )}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val && !submitted) {
            setSubmitted(true);
            onResult(ok, ok ? 100 : 0);
          }
        }}
        disabled={submitted}
        className={
          "w-full rounded-2xl border-2 px-4 py-3 text-kid font-bold outline-none transition-colors " +
          (submitted
            ? ok
              ? "border-sprout-500 bg-sprout-50 text-sprout-700"
              : "border-coral-400 bg-coral-400/10 text-coral-600"
            : "border-ink-200 focus:border-sprout-400")
        }
        placeholder="여기에 답 써봐!"
        autoCapitalize="none"
        autoCorrect="off"
      />
      {!submitted ? (
        <button
          disabled={!val}
          onClick={() => {
            setSubmitted(true);
            onResult(ok, ok ? 100 : 0);
          }}
          className="btn-primary w-full disabled:opacity-30"
        >
          정답 확인
        </button>
      ) : (
        <div
          className={
            "rounded-2xl p-4 flex items-center gap-3 font-black text-kidlg " +
            (ok ? "bg-sprout-100 text-sprout-700" : "bg-coral-400/10 text-coral-500")
          }
        >
          <span className="text-3xl">{ok ? "🎉" : "😅"}</span>
          <div>
            <div>{ok ? "정답이야!" : "아쉽다!"}</div>
            {!ok && (
              <div className="text-sm font-bold mt-0.5 opacity-80">
                정답: {check.answer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Write (AI) ───────────────────────────────────────────── */
function WriteCheck({
  check,
  onResult,
}: {
  check: Extract<Check, { type: "write" }>;
  onResult: (passed: boolean, score?: number) => void;
}) {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  return (
    <div className="space-y-3">
      <p className="font-bold text-kid text-ink-800">{check.prompt}</p>
      {check.example && (
        <div className="flex items-start gap-2 text-sm text-ink-400 bg-ink-100 rounded-2xl px-3 py-2">
          <span className="shrink-0">✍️ 예:</span>
          <span>{check.example}</span>
        </div>
      )}
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={!!result}
        rows={4}
        className={
          "w-full rounded-2xl border-2 px-4 py-3 text-kid outline-none transition-colors resize-none " +
          (result ? "border-ink-200 bg-ink-50 text-ink-500" : "border-ink-200 focus:border-sprout-400")
        }
        placeholder="내 생각을 써봐! (짧아도 괜찮아)"
      />
      {!result ? (
        <button
          disabled={val.trim().length < 3 || loading}
          onClick={async () => {
            setLoading(true);
            const r = await gradeWriting({ prompt: check.prompt, rubric: check.rubric, studentAnswer: val });
            setLoading(false);
            setResult({ score: r.score, feedback: r.feedback });
            onResult(r.score >= 60, r.score);
          }}
          className="btn-primary w-full disabled:opacity-30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              AI가 읽는 중…
            </span>
          ) : (
            "✨ AI에게 보여주기"
          )}
        </button>
      ) : (
        <div
          className={
            "rounded-2xl p-4 space-y-2 " +
            (result.score >= 60 ? "bg-sprout-100" : "bg-coral-400/10")
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{result.score >= 60 ? "🎉" : "💪"}</span>
            <span
              className={
                "font-black text-kidlg " +
                (result.score >= 60 ? "text-sprout-700" : "text-coral-500")
              }
            >
              {result.score}점
            </span>
          </div>
          <p className="text-kid text-ink-700 whitespace-pre-wrap">{result.feedback}</p>
        </div>
      )}
    </div>
  );
}
