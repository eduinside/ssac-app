import { useState } from "react";
import type { VocabBook, VocabWord, VocabReview, Check } from "@content/schema";
// VocabWord/VocabReview are both zod schemas and TypeScript types (same name)
import { VocabBook as VocabBookSchema } from "@content/schema";

const EMPTY_WORD = (g: number, n: number): VocabWord => ({
  id: `g${g}-${String(n).padStart(3, "0")}`,
  word: "",
  meaning: "",
  examples: [],
  check: { type: "mcq", prompt: "", choices: ["", ""], answer: 0 },
});

export default function AdminVocab() {
  const [grade, setGrade] = useState(1);
  const [book, setBook] = useState<VocabBook>({ grade: 1, words: [], reviews: [] });
  const [error, setError] = useState<string | null>(null);

  function addWord() {
    setBook((b) => ({ ...b, words: [...b.words, EMPTY_WORD(b.grade, b.words.length + 1)] }));
  }
  function updateWord(i: number, patch: Partial<VocabWord>) {
    setBook((b) => ({ ...b, words: b.words.map((w, j) => (i === j ? { ...w, ...patch } : w)) }));
  }
  function updateCheck(i: number, patch: Partial<Check>) {
    setBook((b) => ({
      ...b,
      words: b.words.map((w, j) =>
        i === j ? { ...w, check: { ...w.check, ...patch } as Check } : w
      ),
    }));
  }
  function setCheckType(i: number, type: Check["type"]) {
    const fresh: Check =
      type === "mcq"
        ? { type, prompt: "", choices: ["", ""], answer: 0 }
        : type === "fill"
        ? { type, prompt: "", answer: "" }
        : { type, prompt: "", rubric: "" };
    setBook((b) => ({
      ...b,
      words: b.words.map((w, j) => (i === j ? { ...w, check: fresh } : w)),
    }));
  }
  function removeWord(i: number) {
    setBook((b) => ({ ...b, words: b.words.filter((_, j) => j !== i) }));
  }
  function addReview() {
    setBook((b) => ({
      ...b,
      reviews: [
        ...b.reviews,
        {
          afterIndex: b.reviews.length * 3 + 3,
          title: `다섯고개 ${b.reviews.length + 1}`,
          chosungQuiz: [{ chosung: "", answer: "" }],
        },
      ],
    }));
  }
  function updateReview(i: number, patch: Partial<VocabReview>) {
    setBook((b) => ({ ...b, reviews: b.reviews.map((r, j) => (i === j ? { ...r, ...patch } : r)) }));
  }

  function download() {
    const result = VocabBookSchema.safeParse({ ...book, grade });
    if (!result.success) {
      setError(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
      return;
    }
    setError(null);
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grade-${grade}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadExisting() {
    try {
      const mod = await import(`@content/vocab/grade-${grade}.json`);
      setBook(mod.default);
    } catch {
      setBook({ grade, words: [], reviews: [] });
    }
  }

  return (
    <section className="space-y-5">
      <h1 className="text-kidlg font-extrabold">🛠 Admin · 어휘싹</h1>
      <p className="text-xs text-ink-300">
        이 화면은 로컬 개발에서만 열려요. 작성 후 JSON을 다운로드해 <code>content/vocab/</code>에 덮어쓰세요.
      </p>

      <div className="card flex items-center gap-3 flex-wrap">
        <label className="font-bold">학년</label>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="rounded-xl border-2 border-sprout-200 px-3 py-2"
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
        <button className="btn-soft" onClick={loadExisting}>
          기존 JSON 불러오기
        </button>
        <button className="btn-primary ml-auto" onClick={download}>
          JSON 다운로드
        </button>
      </div>
      {error && (
        <pre className="card bg-coral-400/20 whitespace-pre-wrap text-sm text-coral-500">
          {error}
        </pre>
      )}

      <div className="space-y-3">
        <h2 className="font-extrabold">낱말 ({book.words.length})</h2>
        {book.words.map((w, i) => (
          <div key={i} className="card bg-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-300">#{i + 1}</span>
              <input
                value={w.id}
                onChange={(e) => updateWord(i, { id: e.target.value })}
                className="text-xs px-2 py-1 rounded border"
              />
              <input
                placeholder="낱말"
                value={w.word}
                onChange={(e) => updateWord(i, { word: e.target.value })}
                className="font-bold px-3 py-2 rounded-xl border-2 border-sprout-200 flex-1"
              />
              <button onClick={() => removeWord(i)} className="text-coral-500 text-sm">
                삭제
              </button>
            </div>
            <textarea
              placeholder="뜻"
              value={w.meaning}
              onChange={(e) => updateWord(i, { meaning: e.target.value })}
              className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2"
              rows={2}
            />
            <textarea
              placeholder="예시 (한 줄에 하나)"
              value={w.examples.join("\n")}
              onChange={(e) =>
                updateWord(i, { examples: e.target.value.split("\n").filter(Boolean) })
              }
              className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-2 items-center">
              <span className="text-xs">유형:</span>
              {(["mcq", "fill", "write"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCheckType(i, t)}
                  className={
                    "chip " + (w.check.type === t ? "bg-sprout-500 text-white" : "bg-sprout-100")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              placeholder="문제"
              value={w.check.prompt}
              onChange={(e) => updateCheck(i, { prompt: e.target.value } as any)}
              className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2"
            />
            {w.check.type === "mcq" && (
              <div className="space-y-1">
                {w.check.choices.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={w.check.type === "mcq" && w.check.answer === ci}
                      onChange={() => updateCheck(i, { answer: ci } as any)}
                    />
                    <input
                      value={c}
                      onChange={(e) => {
                        const choices = [...(w.check as any).choices];
                        choices[ci] = e.target.value;
                        updateCheck(i, { choices } as any);
                      }}
                      className="flex-1 rounded-xl border-2 border-sprout-200 px-3 py-1"
                    />
                  </div>
                ))}
                <button
                  className="text-sm underline"
                  onClick={() =>
                    updateCheck(i, {
                      choices: [...(w.check as any).choices, ""],
                    } as any)
                  }
                >
                  + 보기 추가
                </button>
              </div>
            )}
            {w.check.type === "fill" && (
              <input
                placeholder="정답"
                value={(w.check as any).answer}
                onChange={(e) => updateCheck(i, { answer: e.target.value } as any)}
                className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2"
              />
            )}
            {w.check.type === "write" && (
              <textarea
                placeholder="채점 기준 (rubric)"
                value={(w.check as any).rubric}
                onChange={(e) => updateCheck(i, { rubric: e.target.value } as any)}
                className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2 text-sm"
                rows={2}
              />
            )}
          </div>
        ))}
        <button className="btn-soft" onClick={addWord}>
          + 낱말 추가
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="font-extrabold">다섯고개 ({book.reviews.length})</h2>
        {book.reviews.map((r, i) => (
          <div key={i} className="card bg-white space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={r.afterIndex}
                onChange={(e) => updateReview(i, { afterIndex: Number(e.target.value) })}
                className="w-24 rounded-xl border-2 border-sprout-200 px-3 py-2"
              />
              <input
                value={r.title}
                onChange={(e) => updateReview(i, { title: e.target.value })}
                className="flex-1 rounded-xl border-2 border-sprout-200 px-3 py-2"
              />
            </div>
            <input
              placeholder="영상 URL (mp4)"
              value={r.videoUrl ?? ""}
              onChange={(e) => updateReview(i, { videoUrl: e.target.value || undefined })}
              className="w-full rounded-xl border-2 border-sprout-200 px-3 py-2 text-sm"
            />
            {r.chosungQuiz.map((q, qi) => (
              <div key={qi} className="flex gap-2">
                <input
                  placeholder="ㅊㅅ"
                  value={q.chosung}
                  onChange={(e) => {
                    const cq = [...r.chosungQuiz];
                    cq[qi] = { ...q, chosung: e.target.value };
                    updateReview(i, { chosungQuiz: cq });
                  }}
                  className="w-24 rounded-xl border-2 border-sprout-200 px-3 py-2"
                />
                <input
                  placeholder="정답"
                  value={q.answer}
                  onChange={(e) => {
                    const cq = [...r.chosungQuiz];
                    cq[qi] = { ...q, answer: e.target.value };
                    updateReview(i, { chosungQuiz: cq });
                  }}
                  className="flex-1 rounded-xl border-2 border-sprout-200 px-3 py-2"
                />
              </div>
            ))}
            <button
              className="text-sm underline"
              onClick={() =>
                updateReview(i, { chosungQuiz: [...r.chosungQuiz, { chosung: "", answer: "" }] })
              }
            >
              + 초성 문항 추가
            </button>
          </div>
        ))}
        <button className="btn-soft" onClick={addReview}>
          + 다섯고개 추가
        </button>
      </div>
    </section>
  );
}
