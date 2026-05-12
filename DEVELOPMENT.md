# 개발 문서 (DEVELOPMENT.md)

> ssac-app — 어휘싹 구현 기록 및 확장 가이드  
> 마지막 업데이트: 2026-05-12

---

## 1. 아키텍처 결정 사항

### 1.1 Next.js App Router 라우트 구성

| 경로 | 방식 | 설명 |
|---|---|---|
| `/` | Static | 홈 (학년 카드 그리드) |
| `/vocab/grade/[grade]` | Dynamic | 학년별 단어·복습 목록 |
| `/vocab/word/[id]` | Dynamic | 단어 상세 (4섹션) |
| `/vocab/review/[id]` | Dynamic | 다섯고개 복습 |
| `/search` | Static | 실시간 어휘 검색 |
| `/favorites` | Static | 즐겨찾기 목록 |
| `/favorites/flashcard` | Static | 플래시카드 학습 모드 |
| `/api/grade` | Edge Function | AI 채점 (Gemini) |

클라이언트 상태(진도·즐겨찾기)는 IndexedDB에 저장, SSR과 완전히 분리.

### 1.2 데이터 구조 원칙

- **백엔드 없음**: 모든 콘텐츠는 `public/data/` 정적 JSON
- **ID prefix**: `v-`(어휘싹) `c-`(개념싹) `r-`(독해싹) `e-`(영어싹) — IndexedDB 저장 시 타입 구분
- **ID 형식**: `v-g4-001`(단어), `v-g4-r01`(다섯고개) — `-r`이 포함되면 복습
- **page 기준 정렬**: 단어·다섯고개를 교재 쪽수 순서로 혼합 렌더

### 1.3 디자인 시스템

- CSS Variables → `@theme inline` 블록으로 Tailwind utility 노출 (`tailwind.config.ts` 없음)
- 4개 섹션 컬러(meet·guess·explore·apply)가 학년 카드, 섹션 배지, 플래시카드에 공통 사용
- **CSS `@import` 순서 고정**: Pretendard CDN import → `@import "tailwindcss"` 순으로 배치 (역순 시 CSS 파싱 오류)

### 1.4 반응형 레이아웃

모바일(< 768px)과 태블릿/데스크탑(≥ 768px)을 CSS 클래스로 분기.

```
mobile                          tablet+ (768px+)
┌──────────────────┐            ┌──────────┬──────────────────────┐
│   PhoneShell     │            │ Sidebar  │   PhoneShell          │
│   (430px 프레임) │            │ (260px)  │   (max-width 720px)  │
└──────────────────┘            └──────────┴──────────────────────┘
```

| CSS 클래스 | 역할 |
|---|---|
| `.app-shell` | 모바일: block / 태블릿: `grid-cols-[260px_1fr]` |
| `.app-shell-sidebar` | 모바일: hidden / 태블릿: sticky sidebar |
| `.phone-shell-outer` | 모바일: 그라디언트 centering wrapper |
| `.phone-shell-inner` | 모바일: max-width 430px / 태블릿: max-width 720px |

---

## 2. 주요 컴포넌트

### AppShell / Sidebar

```tsx
// layout.tsx에서 전체 wrap
<AppShell>
  {children}   {/* Sidebar는 AppShell 내부에서 자동 렌더 */}
</AppShell>
```

`Sidebar`는 Client Component (`usePathname`으로 active 상태 처리).  
현재 grade4만 데이터가 있으므로 나머지 학년은 "준비중" 배지 표시.

### PhoneShell

```tsx
<PhoneShell>
  {/* 모바일: 430px 프레임 / 태블릿+: 720px 투명 확장 */}
</PhoneShell>
```

inline style 대신 `.phone-shell-outer` / `.phone-shell-inner` CSS 클래스 사용.

### useProgress(id)

```tsx
const { progress, toggleFavorite, toggleCompleted, markViewed } = useProgress("v-g4-001");
```

낙관적 업데이트: UI 즉시 반영 → IndexedDB 비동기 저장.

### storage.ts

```ts
await storage.getProgress(id)
await storage.setProgress(id, { completed: true, completedAt: "..." })
await storage.getFavorites("v-")     // prefix 필터
await storage.getCompleted("v-g4-")  // 특정 학년만
```

---

## 3. 섹션 타입 & 활동 타입

### 섹션 타입

| type | 화면 | 색상 테마 |
|---|---|---|
| `meet` | 만나기 | 분홍 (section-meet) |
| `think` | 짐작하기 | 노랑 (section-guess) |
| `learn` | 더 알아보기 | 민트 (section-explore) |
| `practice` | 익히기 | 보라 (section-apply) |

### 활동(activity) kind

| kind | 설명 | 동작 |
|---|---|---|
| `multipleChoice` | 4지선다 | 오답 시 재선택 허용, **정답 선택 전까지 "다음" 버튼 잠금** |
| `freeWrite` | 자유 서술 textarea | **Gemini AI 채점** (관대한 기준, 긍정적 피드백) |
| `fillBlank` | 빈칸 채우기 | `___` 위치에 인라인 `<input>` 렌더, "확인" 버튼으로 즉시 채점 |
| `initialSound` | 초성 퀴즈 (다섯고개) | 힌트 공개 + 배치 채점 |
| `wordGrid` | 단어 격자 찾기 | 미구현 |
| `matchPairs` | 선 잇기 매칭 | 미구현 |

### multipleChoice 흐름

```
선택 안 함  →  [다음 버튼 비활성 "정답을 먼저 선택해요"]
오답 선택   →  빨간 하이라이트 + 🤔 메시지  →  재선택 가능
정답 선택   →  초록 하이라이트 + 🎉 메시지  →  [다음 버튼 활성화]
```

### freeWrite AI 채점

```
사용자 입력 → POST /api/grade → Gemini gemini-flash-lite-latest
                              → { result: "correct"|"partial"|"incorrect", feedback: string }
```

- API 키: `.env.local`의 `GEMINI_API_KEY`
- Edge Runtime (`export const runtime = "edge"`)
- 채점 기준: 핵심 의미 이해 여부 중심, 문법·맞춤법 오류 관대하게 처리
- 피드백: 항상 칭찬 먼저 → 개선 제안은 긍정적 어조

---

## 4. 학습 완료 플로우

```
익히기(마지막 섹션) 도달
        ↓
  [학습 완료] 클릭
        ↓
  completed = true 저장
        ↓
  다음 단어 있음?  →  [다음 어휘 →]  →  /vocab/word/{nextId}
  마지막 단어?    →  [목록으로 →]   →  /vocab/grade/{grade}
```

- "완료됨" 토글(취소) 없음 — 완료는 단방향
- `loadVocabGrade`로 같은 학년 단어 목록을 조회해 다음 ID를 계산

---

## 5. 즐겨찾기 & 플래시카드

### 즐겨찾기 목록 (`/favorites`)

- `storage.getFavorites("v-")` → ID 배열
- 각 ID에 대해 `gradeFromId()` + `loadWord()` / `loadReview()` 병렬 조회
- 단어: 단어명 + 품사(pos) + 학년 배지
- 다섯고개: 제목 + "다섯고개 · N문항" + 학년 배지

### 플래시카드 모드 (`/favorites/flashcard`)

```
즐겨찾기 단어만 대상 (다섯고개 제외)
        ↓
카드 탭  →  CSS 3D flip 애니메이션  →  뒷면(뜻+예시) 공개
        ↓
  [알아요 ✓]  /  [몰라요 😅]
        ↓
전체 완료  →  결과 화면 (알아요 N / 몰라요 N)
```

**CSS 플립 구현** (`globals.css`):
```css
.flashcard-wrap  { perspective: 1200px; }
.flashcard-inner { transform-style: preserve-3d; transition: transform 0.42s; }
.flashcard-inner.is-flipped { transform: rotateY(180deg); }
.flashcard-face  { backface-visibility: hidden; }
.flashcard-back  { transform: rotateY(180deg); }
```

`key={current}` 를 `.flashcard-inner`에 적용 → 카드 전환 시 즉시 교체(애니메이션 없음), 탭 시 flip 애니메이션.

---

## 6. 환경 변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | AI 채점 사용 시 | Google AI Studio에서 발급 |

`.env.local` 파일(git 제외):
```
GEMINI_API_KEY=your_key_here
```

---

## 7. 향후 확장 가이드

### 7.1 새 학년 데이터 추가

1. `public/data/vocab/gradeN/words.json` · `reviews.json` 생성 (`PDF_TO_JSON_GUIDE.md` 참고)
2. `public/data/manifest.json`에 학년 항목 추가
3. `Sidebar.tsx`의 `hasData` 조건 업데이트 (`g.grade === 4` → 실제 보유 학년 배열)
4. `search/page.tsx`의 grade 배열 확장

현재 그레이드 색상 배정:

| 학년 | 섹션 컬러 |
|---|---|
| 1·5 | meet (분홍) |
| 2·6 | guess (노랑) |
| 3 | explore (민트) |
| 4 | apply (보라) |

### 7.2 새 콘텐츠 타입 추가 (예: 개념싹)

1. `public/data/concept/` 데이터 구조 설계 (todo.md 3.4.2 참고)
2. `manifest.json`에서 `concept.enabled: true`
3. `src/lib/content.ts`에 `loadConceptGroup()` 추가
4. `src/app/concept/` 라우트 추가
5. `Sidebar.tsx` 모듈 뱃지 + 홈 카드 활성화

### 7.3 검색 인덱스 확장

현재 grade4 데이터만 검색 인덱싱. 다중 학년 대응 시:

```ts
// manifest의 enabled 학년을 순회해 병렬 fetch
const allItems = await Promise.all(
  enabledGrades.map(g => loadVocabGrade(g))
).then(arr => arr.flat());
```

단어 수가 많아지면 MiniSearch 사전 빌드 인덱스 (`scripts/build-search-index.js`) 도입.

### 7.4 PWA 추가

```bash
npm install next-pwa
```

`public/manifest.webmanifest` 추가, Pretendard 폰트와 `/data/` 폴더 precache 포함.

### 7.5 스와이프 제스처 (섹션 이동)

```bash
npm install @use-gesture/react
```

`WordClient.tsx` 섹션 컨테이너에 `useDrag` 훅 적용. 현재는 하단 이전/다음 버튼만 제공.

---

## 8. 알려진 제한 사항

| 항목 | 현황 | 해결 방향 |
|---|---|---|
| 4학년 데이터만 존재 | 9단어 + 2다섯고개 | 나머지 학년 JSON 추가 (`PDF_TO_JSON_GUIDE.md`) |
| 검색이 grade4만 인덱싱 | `search/page.tsx` 하드코딩 | manifest 기반 동적 로딩 |
| 영상 URL 없음 | `videoUrl` 빈 문자열 | 실제 영상 URL 매핑 후 교체 |
| wordGrid·matchPairs 미구현 | activity 타입 미지원 | v2 개발 시 추가 |
| fillBlank 채점이 단순 문자열 비교 | 띄어쓰기 정규화만 적용 | AI 채점 또는 유사도 비교로 개선 가능 |

---

## 9. 파일 참고 순서 (신규 개발자용)

1. `todo.md` — 전체 설계 의도 및 스키마
2. `design_handoff/README.md` — 디자인 토큰 및 화면 설명
3. `src/app/globals.css` — CSS 변수 + 레이아웃 클래스 전체
4. `src/types/vocab.ts` — 모든 타입 정의
5. `src/lib/content.ts` — 데이터 로딩 패턴
6. `src/lib/storage.ts` — IndexedDB API
7. `src/components/ui/AppShell.tsx` + `Sidebar.tsx` — 레이아웃 구조
8. `src/app/page.tsx` — 홈 화면 (구조 참고용)
9. `src/app/api/grade/route.ts` — AI 채점 API
10. `PDF_TO_JSON_GUIDE.md` — 교재 데이터 변환 절차
