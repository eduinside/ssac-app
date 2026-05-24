export type GradeResult = {
  ok: boolean;
  score: number; // 0-100
  feedback: string;
};

export async function gradeWriting(args: {
  prompt: string;
  rubric: string;
  studentAnswer: string;
}): Promise<GradeResult> {
  try {
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as GradeResult;
  } catch (e) {
    return {
      ok: false,
      score: 0,
      feedback: "지금은 자동 채점이 어려워요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
