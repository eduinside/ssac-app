/**
 * /api/notice — 공지사항 관리
 *
 * D1 테이블 생성 (최초 1회):
 *   npx wrangler d1 execute ssac-app --command \
 *     "CREATE TABLE IF NOT EXISTS notices (
 *        id INTEGER PRIMARY KEY AUTOINCREMENT,
 *        title TEXT NOT NULL,
 *        body TEXT NOT NULL,
 *        is_active INTEGER NOT NULL DEFAULT 1,
 *        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
 *      );"
 *
 * 공지 추가 예시:
 *   npx wrangler d1 execute ssac-app --command \
 *     "INSERT INTO notices (title, body) VALUES ('업데이트 안내', '새로운 기능이 추가되었어요!');"
 */

interface Env { DB: D1Database; }

type Notice = { id: number; title: string; body: string; created_at: number };

// GET /api/notice — 가장 최근 활성 공지 반환
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return json(null);

  try {
    const row = await env.DB
      .prepare("SELECT id, title, body, created_at FROM notices WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
      .first<Notice>();
    return json(row ?? null);
  } catch {
    return json(null);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
