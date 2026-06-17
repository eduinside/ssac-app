interface Env {
  EDULINK_DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.EDULINK_DB) return new Response("{}", { status: 200 });
  let body: { kind?: string; ref?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("{}", { status: 400 });
  }
  if (!body.kind || !body.ref) return new Response("{}", { status: 400 });
  await env.EDULINK_DB.prepare("INSERT INTO ssac_events (kind, ref, ts) VALUES (?, ?, ?)")
    .bind(body.kind, body.ref, Date.now())
    .run();
  return new Response("{}", { status: 200 });
};
