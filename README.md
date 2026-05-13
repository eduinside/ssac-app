# 싹 앱 (ssac-app)

초등학생을 위한 어휘 학습 PWA. **어휘싹**을 시작으로 개념싹·독해싹·영어싹으로 확장 가능한 멀티 콘텐츠 구조.

---

## 빠른 시작

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | Tailwind CSS v4 + CSS Variables |
| 아이콘 | Lucide React |
| 로컬 저장 | IndexedDB (idb) |
| 검색 | MiniSearch (클라이언트) |
| 폰트 | Pretendard Variable |
| 호스팅 | Cloudflare Pages |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 홈 (모듈 선택 + 학년 그리드)
│   ├── search/page.tsx           # 어휘 검색
│   ├── favorites/page.tsx        # 즐겨찾기
│   └── vocab/
│       ├── grade/[grade]/        # 학년 목록 (어휘 + 다섯고개)
│       ├── word/[id]/            # 단어 상세 (4섹션 카드)
│       └── review/[id]/          # 다섯고개 (영상 + 초성 퀴즈)
├── components/ui/
│   ├── PhoneShell.tsx            # 430px 모바일 프레임
│   ├── IconButton.tsx            # 아이콘 버튼 (default/fav/done)
│   ├── ProgressBar.tsx           # 진도 바
│   ├── Chip.tsx                  # 필터 칩
│   ├── BottomSheet.tsx           # 바텀시트 오버레이
│   └── Toast.tsx                 # 토스트 알림
├── lib/
│   ├── content.ts                # JSON 데이터 로더
│   ├── storage.ts                # IndexedDB API
│   └── utils.ts                  # cn() 유틸
├── hooks/
│   └── useProgress.ts            # 완료/즐겨찾기 상태 훅
└── types/
    └── vocab.ts                  # 어휘싹 타입 정의

public/
├── data/
│   ├── manifest.json             # 전체 콘텐츠 메타
│   └── vocab/
│       └── grade{N}/             # N = 1~4 (현재 배포)
│           ├── words.json        # 단어 데이터
│           └── reviews.json      # 다섯고개 데이터
└── images/
    └── vocab/
        └── grade{N}/
            ├── {id}-meet.webp     # 만나기 삽화 (자동 추출)
            ├── {id}-think.webp    # 짐작하기 이미지 (수작업)
            └── {id}-practice.webp # 익히기 이미지 (수작업)
```

---

## URL 구조

```
/                          홈 (학년 선택 + 모듈 스위처)
/vocab/grade/[grade]       학년 어휘 목록
/vocab/word/[id]           단어 상세 (만나기→짐작하기→더알아보기→익히기)
/vocab/review/[id]         다섯고개 (영상 + 초성 퀴즈)
/search                    통합 검색
/favorites                 즐겨찾기
```

---

## 데이터 추가 방법

### 현재 배포 학년

| 학년 | 단어 | 다섯고개 |
|------|------|---------|
| 1학년 | 63 | 20 |
| 2학년 | 60 | 15 |
| 3학년 | 43 | 8 |
| 4학년 | 43 | 7 |

데이터는 `cho-ssac-lab/scripts/` 파이프라인으로 PDF에서 추출. 상세 절차는 [`docs/PDF_TO_JSON.md`](docs/PDF_TO_JSON.md) 참고.

**학년 활성화 정책**
- `src/app/page.tsx`의 `GRADES` 배열에 등재된 학년만 홈 화면 그리드에 노출
- `src/components/ui/Sidebar.tsx`의 `hasData` 조건(`grade >= 1 && grade <= 4`)을 만족하는 학년만 사이드바에서 링크로 동작. 그 외 학년(현재 5·6학년)은 클릭 불가 `<div>`로 렌더링
- 새 학년 데이터 배포 시 두 파일의 조건을 함께 업데이트할 것

### 새 학년 추가

1. `public/data/vocab/grade{N}/words.json` 생성
2. `public/data/vocab/grade{N}/reviews.json` 생성
3. `public/data/manifest.json`의 `vocab.groups`에 항목 추가:

```json
{
  "key": "grade3",
  "label": "3학년",
  "grade": 3,
  "wordCount": 32,
  "reviewCount": 9,
  "files": ["vocab/grade3/words.json", "vocab/grade3/reviews.json"]
}
```

### words.json 스키마

```json
{
  "version": "2026.1",
  "contentType": "vocab",
  "grade": 4,
  "words": [
    {
      "id": "v-g4-001",
      "word": "가르치다",
      "grade": 4,
      "order": 1,
      "page": 1,
      "pos": "동사",
      "definition": "지식이나 기술을 알게 하거나 익히게 하다.",
      "examples": ["선생님이 수학을 가르치다."],
      "similarWords": ["교육하다", "지도하다"],
      "sections": [
        { "type": "meet",     "title": "만나기",    "prompt": "...", "imageUrl": "/images/vocab/grade{N}/{id}-meet.webp", "dialogue": [...] },
        { "type": "think",    "title": "짐작하기",  "imageUrl": "",  "activity": { "kind": "multipleChoice", ... } },
        { "type": "learn",    "title": "더 알아보기" },
        { "type": "practice", "title": "익히기",    "imageUrl": "",  "activity": { "kind": "freeWrite", ... } }
      ]
    }
  ]
}
```

### reviews.json 스키마

```json
{
  "version": "2026.1",
  "contentType": "vocab-review",
  "grade": 4,
  "reviews": [
    {
      "id": "v-g4-r01",
      "grade": 4,
      "order": 1,
      "page": 13,
      "title": "다섯고개 01",
      "coversPages": "1쪽~12쪽",
      "coversItems": ["v-g4-001", "v-g4-002"],
      "videoUrl": "https://example.com/video.mp4",
      "quizzes": [
        { "kind": "initialSound", "hint": "ㄱㄹㅊㄷ", "answer": "가르치다", "relatedItemId": "v-g4-001" }
      ]
    }
  ]
}
```

---

## ID 체계

| 콘텐츠 | 패턴 | 예시 |
|---|---|---|
| 어휘싹 단어 | `v-g{학년}-{3자리}` | `v-g4-001` |
| 어휘싹 다섯고개 | `v-g{학년}-r{2자리}` | `v-g4-r01` |
| 개념싹 (예정) | `c-g{학년}-{학기}-{교과}-{3자리}` | `c-g3-1-soc-001` |
| 독해싹 (예정) | `r-{학년대}-{3자리}` | `r-low-028` |
| 영어싹 (예정) | `e-g{학년}-{3자리}` | `e-g3-001` |

---

## 빌드 & 배포

```bash
# 빌드
npm run build

# Cloudflare Pages 배포
npm run pages:build   # @cloudflare/next-on-pages
# → Cloudflare Dashboard 또는 wrangler pages deploy
```

---

## 로컬 저장 (IndexedDB)

DB: `ssac-app` / ObjectStore: `progress`, `settings`

```ts
import { storage } from "@/lib/storage";

// 진도 조회
await storage.getProgress("v-g4-001");

// 완료 표시
await storage.setProgress("v-g4-001", { completed: true });

// 즐겨찾기 목록
await storage.getFavorites("v-");   // 어휘싹 전체
```

---

## 디자인 토큰

`src/app/globals.css`의 `:root { }` 참고.

주요 CSS 변수:

| 변수 | 값 | 용도 |
|---|---|---|
| `--color-primary-500` | `#2ea268` | 새싹 그린 (CTA) |
| `--color-secondary-500` | `#f59e3c` | 오렌지 (즐겨찾기) |
| `--section-meet-ink` | `#c43a64` | 만나기 (분홍) |
| `--section-guess-ink` | `#946a05` | 짐작하기 (노랑) |
| `--section-explore-ink` | `#16785f` | 탐구하기 (민트) |
| `--section-apply-ink` | `#5b3fb0` | 활용하기 (보라) |
| `--bg-app` | `#fbfaf7` | 앱 배경 |

---

## 섹션 이미지 첨부 (수작업)

짐작하기·익히기 섹션 이미지는 수작업으로 첨부:

1. PDF에서 해당 영역 크롭 → WebP(quality=85)로 저장
2. `public/images/vocab/grade{N}/{id}-think.webp` 또는 `{id}-practice.webp`
3. `words.json` 해당 섹션의 `imageUrl` 필드에 경로 입력

`imageUrl`이 빈 문자열(`""`)이면 이미지를 렌더링하지 않음.
