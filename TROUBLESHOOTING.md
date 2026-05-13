# 트러블슈팅 기록

> ssac-app 개발 중 발생한 오류와 해결책 모음. 향후 동일 문제 재발 시 참고용.

---

## 1. Cloudflare Pages 배포 오류

### 1-1. 동적 라우트에 edge runtime 선언 누락

**증상**
```
⚡️ ERROR: Failed to produce a Cloudflare Pages build from the project.
⚡️     The following routes were not configured to run with the Edge Runtime:
⚡️       - /vocab/grade/[grade]
⚡️       - /vocab/review/[id]
⚡️       - /vocab/word/[id]
```

**원인**  
`@cloudflare/next-on-pages`는 모든 동적 라우트 페이지에 `export const runtime = 'edge'`가 있어야 함.

**해결**  
각 동적 라우트의 `page.tsx` 최상단에 추가:
```typescript
export const runtime = 'edge';
```
대상 파일:
- `src/app/vocab/grade/[grade]/page.tsx`
- `src/app/vocab/review/[id]/page.tsx`
- `src/app/vocab/word/[id]/page.tsx`

---

### 1-2. `idb` (IndexedDB) 패키지와 edge runtime 충돌

**증상**  
개발 서버에서는 정상 동작하지만 Cloudflare Pages 빌드 또는 edge runtime 환경에서:
```
TypeError: Cannot read properties of undefined (reading 'default')
```
또는 sandbox.js에서 런타임 오류 발생.

**원인**  
`idb`는 브라우저 전용 패키지(IndexedDB API 사용). `storage.ts`에서 최상단에 정적 import하면 edge worker가 모듈을 로드하는 시점에 실행을 시도하여 오류 발생.

```typescript
// 문제가 된 코드
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
```

**해결**  
`type` import는 그대로 두고, 값(`openDB`)만 `getDB()` 내부에서 동적 import로 변경:

```typescript
// storage.ts
import type { DBSchema, IDBPDatabase } from "idb"; // type-only: 런타임 코드 없음

async function getDB() {
  if (!dbPromise) {
    const { openDB } = await import("idb"); // 브라우저에서만 실행
    dbPromise = openDB<EduDB>("ssac-app", 1, { ... });
  }
  return dbPromise;
}
```

**핵심**  
`import type`은 컴파일 후 흔적이 없으므로 edge runtime에서 안전. 값(함수/클래스)을 사용하는 브라우저 전용 패키지는 반드시 동적 import 사용.

---

### 1-3. TypeScript 빌드 오류 — `flatMap` 콜백 타입 추론 실패

**증상**  
Cloudflare 빌드 로그에서:
```
Type error: Argument of type '(p: ...) => RecentItem[] | never[]' is not assignable
to parameter of type '(value: ...) => readonly unknown[]'
```

**원인**  
`flatMap` 콜백에서 분기 반환(`return []` vs `return [{ ... }]`)이 있을 때 TypeScript가 반환 타입을 `never[] | RecentItem[]`로 추론하지 못하는 경우 발생.

**해결**  
콜백에 명시적 반환 타입 어노테이션 추가:

```typescript
// 오류
const recent = withView.flatMap((p) => { ... });

// 수정
const recent: RecentItem[] = withView.flatMap((p): RecentItem[] => { ... });
```

---

## 2. Next.js 개발 서버 오류

### 2-1. `__webpack_modules__[moduleId] is not a function`

**증상**  
개발 중 코드 수정 후 브라우저에서:
```
TypeError: __webpack_modules__[moduleId] is not a function
```

**원인**  
Next.js dev 모드의 RSC(React Server Component) HMR 캐시가 코드 변경 후 오염됨.

**해결**  
`.next` 디렉토리 삭제 후 재시작:
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

### 2-2. `Cannot find module './vendor-chunks/tailwind-merge.js'`

**증상**  
개발 서버 실행 중 또는 재시작 시 위 오류와 함께 페이지 로드 실패.

**원인**  
`.next` 빌드 캐시가 stale 상태.

**해결**  
동일: `.next` 디렉토리 삭제 후 재시작.

---

### 2-3. 코드 변경이 브라우저에 반영되지 않음

**증상**  
`npm run dev`를 실행했는데 이전 버전 화면이 계속 보임.

**원인**  
이전에 실행한 Node.js 프로세스가 같은 포트에서 여전히 살아있는 경우. 터미널에서 `npm run dev`를 다시 실행해도 실제로는 기존 프로세스가 요청을 처리 중.

**해결**  
기존 프로세스 종료 후 재시작:
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :3001

# PID 확인 후 종료
Stop-Process -Id <PID> -Force

# 재시작
npm run dev
```

---

## 3. Tailwind CSS v4 관련

### 3-1. Pretendard 폰트 `@import` 순서

**증상**  
Pretendard 폰트가 적용되지 않거나, CSS 빌드 오류 발생.

**원인**  
Tailwind CSS v4는 `@import "tailwindcss"`가 파일 최상단에 위치해야 하는 것으로 알고 있으나, 실제로는 `@import url(...)` 형태의 외부 폰트 import가 반드시 `@import "tailwindcss"` **앞**에 와야 함.

**해결**  
`globals.css` 최상단 순서 유지:
```css
@import url("https://cdn.jsdelivr.net/...pretendard.min.css"); /* 1순위 */
@import "tailwindcss";                                          /* 2순위 */
```

---

### 3-2. CSS 변수 이중 선언 필요

**원인**  
Tailwind v4의 `@theme inline { }` 블록은 Tailwind 유틸리티 클래스에서 CSS 변수를 참조하기 위한 것. `style={{ }}` 인라인 스타일에서 직접 `var(--foo)` 참조 시에는 `:root { }` 선언만 있어도 되지만, `bg-primary-500` 같은 유틸리티 클래스 사용 시에는 `@theme` 선언 필요.

**해결**  
`:root { }` 와 `@theme inline { }` 양쪽에 변수 정의 유지.

---

## 4. 모바일 UI 오류

### 4-1. 뷰포트 폭 초과 시 배경색 튀는 현상

**증상**  
모바일에서 앱 영역 외 사이드(또는 데스크탑에서 430px 프레임 바깥)에 `--bg-sunken` 색상이 노출됨.

**원인**  
`phone-shell-outer`의 배경색이 `var(--bg-app)`이 아닌 다른 색으로 설정되어 있었음.

**해결**  
`globals.css`에서 `phone-shell-outer` 배경색을 앱 배경과 동일하게:
```css
.phone-shell-outer {
  background: var(--bg-app); /* 수정 전: radial-gradient(...) var(--bg-sunken) */
}
```

---

## 5. 데이터 / 콘텐츠 관련

### 5-1. 삭제한 학년 데이터가 홈에 계속 표시

**원인**  
`src/app/page.tsx`의 `GRADES` 상수 배열에 하드코딩된 학년 목록이 파일 삭제와 독립적으로 존재함. `public/data/` 파일을 지워도 코드에서 제거하지 않으면 카드가 계속 렌더링됨.

**해결**  
데이터 파일 삭제 시 다음을 함께 수정:
- `src/app/page.tsx` — `GRADES` 배열에서 해당 학년 제거
- `public/data/manifest.json` — 해당 학년 항목 제거 또는 `enabled: false`
- `src/components/ui/Sidebar.tsx` — `hasData` 조건 업데이트

### 5-2. PDF → JSON 추출 시 유의사항

> 실제 추출 과정에서 발생한 문제는 추후 추가 예정.

현재 확인된 구조적 주의사항:

- **초성 퀴즈 `hint` 필드**: 초성만 포함해야 하며 공백 없이 연속 작성 (`"ㄱㄹㅊㄷ"`). 공백 포함 시 UI에서 글자 간격이 깨짐.
- **`answer` 필드**: 정답 텍스트와 사용자 입력을 `===` 비교하므로 띄어쓰기·특수문자 완전 일치 필요. 복수 정답이 필요한 경우 별도 처리 로직 추가해야 함.
- **`videoUrl` 필드**: 비워두면(`""` 또는 필드 없음) 플레이스홀더 표시. 실제 mp4 직링크 입력 시 `<video>` 태그로 자동 교체됨.
- **`page` 필드**: 교재 쪽수 기준으로 단어와 다섯고개가 혼합 정렬되므로 정확한 값 입력 필요.

---

## 6. 환경 설정 체크리스트

Cloudflare Pages 대시보드에서 확인할 항목:

| 항목 | 올바른 값 |
|------|-----------|
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |
| NODE_VERSION (환경 변수) | `20` (Next.js 15는 18.18+ 요구) |
| `wrangler.toml` compatibility_flags | `["nodejs_compat"]` |

---
