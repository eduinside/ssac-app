interface Env {
  SHORT_IO_API_KEY: string;
  SHORT_IO_DOMAIN: string;
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

  const apiKey = env.SHORT_IO_API_KEY;
  const domain = env.SHORT_IO_DOMAIN;
  if (!apiKey) return json({ error: "SHORT_IO_API_KEY not configured" }, 500);
  if (!domain) return json({ error: "SHORT_IO_DOMAIN not configured" }, 500);

  try {
    const res = await fetch("https://api.short.io/links", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalURL: url,
        domain,
      }),
    });

    const data = await res.json() as { shortURL?: string; message?: string };
    if (!res.ok) return json({ error: data.message ?? "단축 URL 생성 실패" }, res.status);

    return json({ shortURL: data.shortURL });
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
