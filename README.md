# 개념튼튼 ON싹

초등 1~6학년 학습 사이트. **어휘싹 / 개념싹 / 독해싹 / 영어싹** 4과목.

| 항목 | 내용 |
|---|---|
| 학생 기록 | IndexedDB (로컬, 계정 없음) |
| 다중 학생 | 기기 공유 — 학생 프로필 전환 지원 |
| 공유 링크 | base64url URL 인코딩, D1 fallback |
| AI 채점 | Gemini `gemini-flash-lite-latest` (CF Function) |
| 콘텐츠 | `content/**/*.json` (git 관리) |
| 호스팅 | Cloudflare Pages + D1 (`ssac-app`) |

## 빠른 시작

```bash
npm install
npm run dev          # Vite dev server (UI만, :5299)
```

AI 채점(`/api/grade`)까지 테스트하려면:

```bash
cp .dev.vars.example .dev.vars   # GEMINI_API_KEY 입력
npm run pages:dev                 # wrangler로 Functions 포함 실행
```

## 배포

D1 DB는 이미 생성되어 있음 (`ssac-app`, `wrangler.toml`에 UUID 기입 완료).

첫 배포 시 D1 스키마 적용:

```bash
npx wrangler d1 execute ssac-app --file=./schema.sql --remote
```

환경 변수 설정:

```bash
npx wrangler pages secret put GEMINI_API_KEY
```

수동 배포:

```bash
npm run deploy
```

> Cloudflare Pages에서 GitHub 저장소 연결 시 자동 배포됩니다.

## 디렉터리

```
src/
  routes/         페이지 컴포넌트
    vocab/        Index · Word · Review
    concept/      Index (스켈레톤)
    reading/      Index (스켈레톤)
    english/      Index (스켈레톤)
    admin/        Data · Vocab (PIN 게이트 / dev 전용)
  components/     AppShell · Check · ChosungQuiz · SubjectCard 등
  lib/            storage · content · badges · share · ai
content/
  vocab/          grade-1.json ~ grade-4.json (60단어 × 4학년)
  schema.ts       Zod 타입 정의
functions/api/    Cloudflare Pages Functions (grade · share · track)
docs/             개발 문서
schema.sql        D1 초기 스키마
```

## 문서

- [개발 현황](docs/개발현황.md) — 구현된 기능·미완료 항목
- [콘텐츠 추가 가이드](docs/콘텐츠추가가이드.md) — JSON 입력 방법
