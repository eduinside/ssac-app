interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return new Response("{}", { status: 200 });
  let body: { kind?: string; ref?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("{}", { status: 400 });
  }
  if (!body.kind || !body.ref) return new Response("{}", { status: 400 });
  await env.DB.prepare("INSERT INTO events (kind, ref, ts) VALUES (?, ?, ?)")
    .bind(body.kind, body.ref, Date.now())
    .run();
  return new Response("{}", { status: 200 });
};
