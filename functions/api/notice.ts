/**
 * /api/notice — 공지사항 관리
 *
 * 데이터는 edu-link-db의 ssac_notices 테이블에 저장한다 (binding: EDULINK_DB).
 * 스키마는 schema.sql 참고.
 *
 * 공지 추가 예시:
 *   npx wrangler d1 execute edu-link-db --remote --command \
 *     "INSERT INTO ssac_notices (title, body) VALUES ('업데이트 안내', '새로운 기능이 추가되었어요!');"
 */

interface Env { EDULINK_DB: D1Database; }

type Notice = { id: number; title: string; body: string; created_at: number };

// GET /api/notice — 가장 최근 활성 공지 반환
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.EDULINK_DB) return json(null);

  try {
    const row = await env.EDULINK_DB
      .prepare("SELECT id, title, body, created_at FROM ssac_notices WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
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
