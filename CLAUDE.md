# ssac-app (개념튼튼 ON싹)

초등 1~6학년 학습 사이트 (어휘싹/개념싹/독해싹/영어싹). Vite + CF Pages + D1(`ssac-app`).
학생 기록은 IndexedDB 로컬(계정 없음), AI 채점은 Gemini(CF Function).

## 명령
- `npm run dev` — UI만 (:5299)
- `npm run pages:dev` — Functions 포함 (`.dev.vars`에 GEMINI_API_KEY 필요)
- `npm run deploy` — build + wrangler pages deploy

## 규칙
- 콘텐츠는 `content/**/*.json` (git 관리) — 스키마 임의 변경 금지.
- 계정·개인정보 없는 설계 유지. 공유는 base64url 인코딩 + D1 fallback.
- 학생 대상 — 초등 눈높이 한국어 UI.
