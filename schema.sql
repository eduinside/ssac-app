-- ssac-app D1 스키마
-- 호스팅 DB: edu-link-db (binding: EDULINK_DB)
-- edu-link-db에는 edu-link 서비스 자체 테이블(notices, urls 등)이 있으므로
-- ssac-app 테이블은 모두 ssac_ 접두사를 사용해 충돌을 방지한다.
--
-- 적용:
--   npx wrangler d1 execute edu-link-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS ssac_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS ssac_shares (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ssac_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ssac_events_kind_ref ON ssac_events(kind, ref);
