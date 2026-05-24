import { useState } from "react";

type Q = { chosung: string; answer: string; hint?: string };

export function ChosungQuiz({
  items,
  onComplete,
}: {
  items: Q[];
  onComplete: () => void;
}) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle");
  const [attempts, setAttempts] = useState(0);
  const q = items[i];

  function submit() {
    if (val.trim() === q.answer.trim()) {
      setStatus("right");
      setTimeout(() => {
        if (i + 1 >= items.length) {
          onComplete();
        } else {
          setI(i + 1);
          setVal("");
          setStatus("idle");
          setAttempts(0);
        }
      }, 700);
    } else {
      setStatus("wrong");
      setAttempts((a) => a + 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex gap-2 justify-center">
        {items.map((_, idx) => (
          <div
            key={idx}
            className={
              "w-3 h-3 rounded-full transition-all " +
              (idx < i
                ? "bg-sprout-500"
                : idx === i
                ? "bg-sprout-500 animate-pulse-dot"
                : "bg-ink-200")
            }
          />
        ))}
      </div>

      <p className="text-center text-sm text-ink-500 font-bold">
        {i + 1} / {items.length} 문제
      </p>

      {/* Chosung display */}
      <div
        className="rounded-3xl p-8 text-center"
        style={{ background: "linear-gradient(135deg, #4ab50f, #1e88e5)" }}
      >
        <div className="text-white/70 text-sm mb-2">초성을 보고 낱말을 맞혀봐!</div>
        <div className="font-black text-kid2xl text-white tracking-[0.3em]">{q.chosung}</div>
        {(q.hint || attempts >= 2) && (
          <div className="mt-3 text-white/80 text-sm bg-white/15 rounded-2xl px-3 py-2">
            💡 {q.hint ?? `정답: ${q.answer.length}글자`}
          </div>
        )}
      </div>

      <input
        autoFocus
        value={val}
        onChange={(e) => { setVal(e.target.value); setStatus("idle"); }}
        onKeyDown={(e) => e.key === "Enter" && val && submit()}
        className={
          "w-full rounded-2xl border-2 px-4 py-4 text-kidlg font-black text-center outline-none transition-all " +
          (status === "wrong"
            ? "border-coral-400 bg-coral-400/10 text-coral-600 animate-wiggle"
            : status === "right"
            ? "border-sprout-500 bg-sprout-50 text-sprout-700"
            : "border-ink-200 focus:border-sprout-400")
        }
        placeholder="여기 입력!"
        autoCapitalize="none"
        autoCorrect="off"
      />

      <button
        onClick={submit}
        disabled={!val || status === "right"}
        className="btn-primary w-full text-kidlg disabled:opacity-30"
      >
        {status === "right" ? "✓ 정답!" : "확인"}
      </button>

      {status === "wrong" && (
        <div className="rounded-2xl bg-coral-400/10 px-4 py-3 text-coral-500 font-bold text-center">
          😅 아쉽다! 다시 한번!
        </div>
      )}
      {status === "right" && (
        <div className="rounded-2xl bg-sprout-100 px-4 py-3 text-sprout-700 font-black text-center text-kidlg">
          🎉 맞았어!
        </div>
      )}
    </div>
  );
}
