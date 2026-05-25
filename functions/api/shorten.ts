interface Env {
  EDULINK_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let url: string | undefined;
  try {
    const body = await request.json() as { url?: string };
    url = body.url;
  } catch {
    return json({ error: "요청 파싱 실패" }, 400);
  }

  if (!url) return json({ error: "url 필드가 필요합니다." }, 400);

  const apiKey = env.EDULINK_API_KEY;
  if (!apiKey) return json({ error: "EDULINK_API_KEY not configured" }, 500);

  try {
    const res = await fetch("https://dgedu.link/api/v1/shorten", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ original_url: url, is_public: false }),
    });

    const data = await res.json() as { success?: boolean; short_url?: string; error?: string };
    if (!res.ok || !data.success) return json({ error: data.error ?? "단축 URL 생성 실패" }, res.status);

    return json({ shortURL: data.short_url });
  } catch {
    return json({ error: "외부 API 연결 실패" }, 502);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
