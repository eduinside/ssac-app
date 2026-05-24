interface Env {
  GEMINI_API_KEY: string;
}

const MODEL = "gemini-flash-lite-latest";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GEMINI_API_KEY) {
    return json({ ok: false, score: 0, feedback: "서버 키가 설정되지 않았어요." }, 500);
  }
  let body: { prompt?: string; rubric?: string; studentAnswer?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, score: 0, feedback: "요청을 읽을 수 없어요." }, 400);
  }
  const { prompt, rubric, studentAnswer } = body;
  if (!prompt || !rubric || !studentAnswer) {
    return json({ ok: false, score: 0, feedback: "입력이 부족해요." }, 400);
  }

  const sys = `너는 초등학생의 짧은 문장 쓰기 과제를 채점하는 친절한 선생님이야.
  다음 채점 기준에 따라 0~100 사이 점수를 매기고, 어린이 눈높이에서 한두 문장으로 칭찬+개선점을 함께 알려줘.
  학생의 답안이 채점 기준(rubric)과 완벽하게 일치하지 않더라도, 핵심 단어가 포함되어 있거나 문맥상 의도가 통하는 유사답안이라면 정답 처리(60점 이상)를 해주어야 해. 초등학생 수준에 맞춰 너그럽게 채점하고, 엄격하게 꼬투리를 잡기보다 칭찬과 격려를 많이 해줘.
  반드시 다음 JSON 형식으로만 답해. 다른 말은 절대 쓰지 마.
  {"score": <정수>, "feedback": "<한국어 한두 문장>"}`;

  const user = `과제: ${prompt}
채점 기준: ${rubric}
학생 답: ${studentAnswer}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: sys + "\n\n" + user }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return json(
        { ok: false, score: 0, feedback: "AI 호출에 실패했어요.", detail: t },
        502
      );
    }
    const data = (await res.json()) as any;
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // try to salvage
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          parsed = {};
        }
      }
    }
    const score = Math.max(0, Math.min(100, Number(parsed.score ?? 0)));
    const feedback = String(parsed.feedback ?? "잘 했어! 다음에도 도전해보자.");
    return json({ ok: true, score, feedback });
  } catch (e) {
    return json({ ok: false, score: 0, feedback: "지금은 AI에 닿을 수 없어요." }, 502);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
