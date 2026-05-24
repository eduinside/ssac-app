interface Env {
  DB: D1Database;
}

function nanoid(n = 8) {
  const alphabet = "0123456789abcdefghijkmnpqrstuvwxyz";
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  let s = "";
  for (let i = 0; i < n; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "DB not bound" }, 500);
  const body = await request.text();
  if (body.length > 50_000) return json({ error: "too large" }, 413);
  const id = nanoid();
  await env.DB.prepare("INSERT INTO shares (id, payload, created_at) VALUES (?, ?, ?)")
    .bind(id, body, Date.now())
    .run();
  return json({ id });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "DB not bound" }, 500);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "missing id" }, 400);
  const row = await env.DB.prepare("SELECT payload FROM shares WHERE id = ?")
    .bind(id)
    .first<{ payload: string }>();
  if (!row) return json({ error: "not found" }, 404);
  return new Response(row.payload, {
    headers: { "content-type": "application/json" },
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
