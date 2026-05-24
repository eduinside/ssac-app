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
  const [attempts, setAttempts] = useState(0); // 0=미제출, 1=1차완료, 2=최종
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const exactOk = val.trim() === check.answer.trim();
  const isCorrect = submitted && (exactOk || (aiResult !== null && aiResult.score >= 60));
  const isFinal = submitted && (isCorrect || (attempts >= 2 && !isRetrying));
  const isWrongFirst = submitted && !isCorrect && attempts === 1;

  async function handleSubmit() {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setIsRetrying(false);

    if (exactOk) {
      setSubmitted(true);
      onResult(true, nextAttempts === 1 ? 100 : 50);
    } else {
      // 정확히 일치하지 않는 경우 (1차, 2차 불문) 바로 AI 채점 실행
      setLoading(true);
      try {
        const r = await gradeWriting({
          prompt: check.prompt,
          rubric: `정답은 "${check.answer}" 입니다. 학생의 답이 이 정답 단어와 실질적으로 같은 뜻을 가진 단어/표현이거나, 빈칸 문맥에 들어가기에 적절한 유사답안(예: 조사 유무, 유의어 등)이라면 너그럽게 정답(60점 이상)으로 평가해 주세요. 초등학생 수준임을 감안해 주세요.`,
          studentAnswer: val,
        });
        setAiResult({ score: r.score, feedback: r.feedback });
        setSubmitted(true);
        const aiPassed = r.score >= 60;
        
        if (aiPassed) {
          onResult(true, nextAttempts === 1 ? 100 : 50);
        } else if (nextAttempts >= 2) {
          onResult(false, 0);
        }
        // 1차 오답 시에는 onResult 보류하고 재도전 제공
      } catch {
        // AI 평가 실패 시 최종 오답 처리 (2차 시도 시) 또는 1차 시도인 경우 바로 실패 처리하지 않고 비상 제출 처리
        setSubmitted(true);
        if (nextAttempts >= 2) {
          onResult(false, 0);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  function handleRetry() {
    setIsRetrying(true);
  }

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
          if (e.key === "Enter" && val && (!submitted || isRetrying) && !loading) {
            handleSubmit();
          }
        }}
        disabled={loading || (submitted && !isRetrying)}
        className={
          "w-full rounded-2xl border-2 px-4 py-3 text-kid font-bold outline-none transition-colors " +
          (submitted && !isRetrying
            ? isCorrect
              ? "border-sprout-500 bg-sprout-50 text-sprout-700"
              : "border-coral-400 bg-coral-400/10 text-coral-600"
            : "border-ink-200 focus:border-sprout-400")
        }
        placeholder="여기에 답 써봐!"
        autoCapitalize="none"
        autoCorrect="off"
      />

      {/* 제출 전 버튼 (결과가 없거나 재도전 중일 때 노출) */}
      {(!submitted || isRetrying) && (
        <button
          disabled={!val || loading}
          onClick={handleSubmit}
          className="btn-primary w-full disabled:opacity-30"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              AI가 확인하는 중…
            </span>
          ) : (
            "정답 확인"
          )}
        </button>
      )}

      {/* 1차 오답 피드백 및 재도전 버튼 */}
      {isWrongFirst && (
        <div className="space-y-3">
          {aiResult && (
            <div className="rounded-2xl p-4 space-y-2 bg-coral-400/10 text-coral-500">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💪</span>
                <span className="font-black text-kidlg">{aiResult.score}점</span>
              </div>
              <p className="text-kid text-ink-700 whitespace-pre-wrap">{aiResult.feedback}</p>
            </div>
          )}

          {!isRetrying && (
            <div className="rounded-2xl p-4 space-y-3 bg-coral-400/10">
              <div className="flex items-center gap-3 font-black text-kidlg text-coral-500">
                <span className="text-3xl">😅</span>
                <div>
                  <div>조금 더 다듬어볼까?</div>
                  <div className="text-sm font-bold opacity-70">한 번 더 도전해봐! (마지막 기회)</div>
                </div>
              </div>
              <button onClick={handleRetry} className="btn-primary w-full">
                🔄 다시 도전하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 최종 결과 */}
      {isFinal && (
        <div
          className={
            "rounded-2xl p-4 space-y-2 " +
            (isCorrect ? "bg-sprout-100 text-sprout-700" : "bg-coral-400/10 text-coral-500")
          }
        >
          <div className="flex items-center gap-3 font-black text-kidlg">
            <span className="text-3xl">{isCorrect ? "🎉" : "😭"}</span>
            <div>
              <div>{isCorrect ? (attempts === 1 ? "정답이야!" : "재도전 성공!") : "아쉽지만 틀렸어!"}</div>
              {!isCorrect && (
                <div className="text-sm font-bold mt-0.5 opacity-80">
                  정답: {check.answer}
                </div>
              )}
            </div>
          </div>
          {aiResult && (
            <p className="text-kid text-ink-700 border-t border-ink-100/20 pt-2 whitespace-pre-wrap">
              {aiResult.feedback}
            </p>
          )}
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
  const [attempts, setAttempts] = useState(0); // 0=미제출, 1=1차완료, 2=최종
  const [isRetrying, setIsRetrying] = useState(false);

  const isCorrect = result !== null && result.score >= 60;
  const isFinal = result !== null && (isCorrect || (attempts >= 2 && !isRetrying));
  const isWrongFirst = result !== null && !isCorrect && attempts === 1;

  async function handleSubmit() {
    setLoading(true);
    try {
      const r = await gradeWriting({ prompt: check.prompt, rubric: check.rubric, studentAnswer: val });
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setResult({ score: r.score, feedback: r.feedback });
      setIsRetrying(false); // 제출이 완료되면 재도전 모드 해제

      if (r.score >= 60) {
        onResult(true, r.score);
      } else if (nextAttempts >= 2) {
        onResult(false, r.score);
      }
    } catch {
      // 에러 발생 시
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setIsRetrying(true);
  }

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
        disabled={loading || (result !== null && !isRetrying)}
        rows={4}
        className={
          "w-full rounded-2xl border-2 px-4 py-3 text-kid outline-none transition-colors resize-none " +
          (result !== null && !isRetrying ? "border-ink-200 bg-ink-50 text-ink-500" : "border-ink-200 focus:border-sprout-400")
        }
        placeholder="내 생각을 써봐! (짧아도 괜찮아)"
      />

      {/* 제출 버튼 (결과가 없거나 재도전 모드일 때 노출) */}
      {(!result || isRetrying) && (
        <button
          disabled={val.trim().length < 3 || loading}
          onClick={handleSubmit}
          className="btn-primary w-full disabled:opacity-30"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              AI가 읽는 중…
            </span>
          ) : (
            "✨ AI에게 보여주기"
          )}
        </button>
      )}

      {/* 1차 오답 피드백 영역 */}
      {isWrongFirst && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 space-y-2 bg-coral-400/10 text-coral-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <span className="font-black text-kidlg">{result.score}점</span>
            </div>
            <p className="text-kid text-ink-700 whitespace-pre-wrap">{result.feedback}</p>
          </div>

          {/* 재도전 모드가 아닐 때만 다시 도전하기 상자가 나옵니다 */}
          {!isRetrying && (
            <div className="rounded-2xl p-4 space-y-3 bg-coral-400/10">
              <div className="flex items-center gap-3 font-black text-kidlg text-coral-500">
                <span className="text-3xl">😅</span>
                <div>
                  <div>조금 더 다듬어볼까?</div>
                  <div className="text-sm font-bold opacity-70">한 번 더 도전해봐! (마지막 기회)</div>
                </div>
              </div>
              <button onClick={handleRetry} className="btn-primary w-full">
                🔄 다시 써보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 최종 결과 피드백 */}
      {isFinal && (
        <div
          className={
            "rounded-2xl p-4 space-y-2 " +
            (isCorrect ? "bg-sprout-100 text-sprout-700" : "bg-coral-400/10 text-coral-500")
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isCorrect ? "🎉" : "😭"}</span>
            <span
              className={
                "font-black text-kidlg " +
                (isCorrect ? "text-sprout-700" : "text-coral-500")
              }
            >
              {isCorrect ? (attempts === 1 ? "정답이야!" : "재도전 성공!") : "아쉽지만 틀렸어!"} ({result.score}점)
            </span>
          </div>
          <p className="text-kid text-ink-700 whitespace-pre-wrap">{result.feedback}</p>
        </div>
      )}
    </div>
  );
}
