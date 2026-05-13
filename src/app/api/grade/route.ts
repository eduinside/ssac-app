import { NextRequest, NextResponse } from "next/server";

const MODEL = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GradeResult {
  result: "correct" | "partial" | "incorrect";
  feedback: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { result: "incorrect", feedback: "채점 서비스가 설정되지 않았어요." } satisfies GradeResult,
      { status: 500 }
    );
  }

  const { word, definition, prompt, answer, grade } = await req.json();

  if (!word || !answer?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const gradingPrompt = `당신은 초등학교 ${grade}학년 어휘 학습을 돕는 다정한 선생님입니다.
학생이 단어를 사용해 문장을 썼습니다. 최대한 관대하게 평가해 주세요.

[단어] ${word}
[뜻] ${definition}
[문제] ${prompt || `'${word}'를 사용하여 문장을 써 보세요.`}
[학생 답변] ${answer}

평가 원칙:
- 단어의 핵심 의미를 어느 정도 이해했다면 correct로 판단하세요.
- 문법이 조금 어색하거나 맞춤법이 틀려도 의미가 통하면 correct입니다.
- 단어를 포함하되 뜻과 전혀 다른 맥락이면 partial입니다.
- incorrect는 단어 자체를 완전히 엉뚱하게 쓰거나 답변이 없는 경우만 해당합니다.
- 되도록 correct나 partial을 주세요. incorrect는 정말 어쩔 수 없을 때만 사용하세요.

피드백 원칙:
- 항상 먼저 잘한 점을 찾아 칭찬하세요.
- 개선할 점은 "이렇게 써 보면 더 좋을 것 같아요!" 처럼 긍정적으로 제안하세요.
- 초등학생에게 말하듯 따뜻하고 격려하는 말투로 1~2문장만 쓰세요.

아래 JSON 형식으로만 응답하세요 (다른 텍스트 금지):
{"result":"correct","feedback":"여기에 피드백"}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: gradingPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 250,
          temperature: 0.2,
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { result: "incorrect", feedback: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요." } satisfies GradeResult
    );
  }

  if (!geminiRes.ok) {
    return NextResponse.json(
      { result: "incorrect", feedback: "채점 중 오류가 발생했어요." } satisfies GradeResult
    );
  }

  const data = await geminiRes.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    const parsed: GradeResult = JSON.parse(text);
    if (parsed.result && parsed.feedback) {
      return NextResponse.json(parsed);
    }
    throw new Error("Unexpected shape");
  } catch {
    return NextResponse.json(
      { result: "incorrect", feedback: "채점 결과를 처리할 수 없었어요." } satisfies GradeResult
    );
  }
}
