# 교재 PDF → JSON 데이터 변환 가이드

> Vision LLM(Claude, GPT-4o 등)을 이용해 초등 어휘 교재 PDF를 `words.json` / `reviews.json` 스키마에 맞게 변환하는 절차

---

## 1. 준비 사항

| 항목 | 내용 |
|---|---|
| 입력 | 교재 PDF (학년별 1권, 또는 단원별 분할) |
| 출력 | `words.json`, `reviews.json` (ssac-app 스키마) |
| 권장 모델 | Claude claude-sonnet-4-6 (Vision), GPT-4o |
| 비용 절감 팁 | PDF를 10~20쪽 단위로 분할하여 배치 처리 |

---

## 2. 단계별 처리 흐름

```
PDF 파일
  │
  ▼
[1] PDF → 이미지 변환 (페이지별 PNG/JPEG)
  │
  ▼
[2] Vision LLM 구조화 추출 (페이지 단위)
  │   → 단어, 뜻, 품사, 예시문, 섹션 활동 등 추출
  ▼
[3] 결과 병합 & 순번 부여
  │   → 여러 페이지 결과를 하나의 배열로 합침
  ▼
[4] 스키마 검증 (수동 또는 Zod 스크립트)
  │
  ▼
[5] public/data/vocab/gradeN/words.json 저장
```

---

## 3. Vision LLM 프롬프트

### 3.1 단어 페이지 추출 프롬프트

```
다음 교재 이미지는 초등 {N}학년 어휘 교재입니다.
이 페이지에 있는 **모든 어휘 항목**을 아래 JSON 배열 형식으로 추출해 주세요.

규칙:
1. "word": 표제어 (한국어). 활용형이 아닌 사전 표제어 형태로 통일 (예: "가르치다" ← "가르쳐요" X)
2. "pos": 품사 (동사 / 명사 / 형용사 / 부사 / 조사 등). 교재에 표시가 없으면 문맥으로 판단.
3. "definition": 교재에 나온 뜻풀이를 그대로 입력. 없으면 표준국어대사전 뜻을 짧게 작성.
4. "examples": 교재에 나온 예시 문장 배열. 없으면 빈 배열 [].
5. "similarWords": 교재에 나온 유의어/관련어 배열. 없으면 빈 배열 [].
6. "page": 이 단어가 등장하는 교재 쪽수 (이미지 하단 쪽 번호 기준).
7. "sections": 이 단어에 연결된 학습 활동 섹션 배열. 섹션 구조는 아래 참고.
8. 페이지에 단어가 없으면 빈 배열 []을 반환.

섹션 타입:
- "meet" (만나기): 단어를 처음 만나는 대화/지문. "dialogue" 필드에 발화 배열.
- "think" (짐작하기): 4지선다 퀴즈. "activity.kind": "multipleChoice"
- "learn" (더 알아보기): 단어 정보 요약. 별도 activity 없음.
- "practice" (익히기): 빈칸 채우기 또는 자유 서술. "activity.kind": "fillBlank" | "freeWrite"

출력 형식:
[
  {
    "word": "가르치다",
    "pos": "동사",
    "definition": "지식이나 기술을 알게 하거나 익히게 하다.",
    "examples": ["선생님이 수학을 가르치다."],
    "similarWords": ["교육하다"],
    "page": 1,
    "sections": [
      {
        "type": "meet",
        "title": "만나기",
        "prompt": "다음 대화를 읽고 '가르치다'의 의미를 짐작해 봐요.",
        "dialogue": ["민준: 선생님, 저 이 문제 모르겠어요.", "선생님: 제가 가르쳐 드릴게요."]
      },
      {
        "type": "think",
        "title": "짐작하기",
        "activity": {
          "kind": "multipleChoice",
          "prompt": "'가르치다'의 뜻으로 알맞은 것은?",
          "options": ["배우다", "알려 주다", "만들다", "찾다"],
          "correctIndex": 1
        }
      },
      { "type": "learn", "title": "더 알아보기" },
      {
        "type": "practice",
        "title": "익히기",
        "activity": {
          "kind": "fillBlank",
          "prompt": "빈칸에 알맞은 말을 써 보세요.",
          "blanks": ["선생님이 나에게 피아노를 ___."],
          "answers": ["가르쳐 주었다"]
        }
      }
    ]
  }
]

JSON 외 다른 텍스트 없이 배열만 출력하세요.
```

---

### 3.2 다섯고개(복습) 페이지 추출 프롬프트

```
다음 교재 이미지는 초등 {N}학년 어휘 교재의 **다섯고개(복습)** 페이지입니다.
아래 JSON 형식으로 추출해 주세요.

규칙:
1. "title": 다섯고개 회차 제목 (예: "다섯고개 01")
2. "page": 이 복습 페이지의 쪽수
3. "coversPages": 복습 범위 설명 (예: "1쪽~12쪽")
4. "coversItems": 이 복습에서 다루는 단어 ID 배열 (형식: "v-gN-XXX").
   ID를 모르면 빈 배열 []로 두고 나중에 수동 매핑.
5. "videoUrl": 영상 URL (교재에 QR 또는 URL이 있으면 입력, 없으면 "")
6. "quizzes": 초성 퀴즈 배열
   - "hint": 초성 (예: "ㄱㄹㅊㄷ")
   - "answer": 정답 단어
   - "relatedItemId": 해당 단어의 ID (모르면 "" 빈 문자열)

출력 형식:
[
  {
    "title": "다섯고개 01",
    "page": 13,
    "coversPages": "1쪽~12쪽",
    "coversItems": [],
    "videoUrl": "",
    "quizzes": [
      { "hint": "ㄱㄹㅊㄷ", "answer": "가르치다", "relatedItemId": "" },
      { "hint": "ㄱㅅㅎㄷ", "answer": "감상하다", "relatedItemId": "" }
    ]
  }
]

JSON 외 다른 텍스트 없이 배열만 출력하세요.
```

---

## 4. ID 자동 부여 스크립트 (Node.js)

추출 후 아래 스크립트로 ID와 order 필드를 자동 부여합니다.

```js
// scripts/assign-ids.js
const fs = require("fs");

const GRADE = 4; // 처리할 학년
const raw = JSON.parse(fs.readFileSync(`raw_grade${GRADE}.json`, "utf8"));

const words = raw.map((word, i) => ({
  id: `v-g${GRADE}-${String(i + 1).padStart(3, "0")}`,
  grade: GRADE,
  order: i + 1,
  ...word,
  itemType: undefined, // 저장 파일엔 불필요
}));

const output = {
  version: "2026.1",
  contentType: "vocab",
  grade: GRADE,
  words,
};

fs.writeFileSync(
  `public/data/vocab/grade${GRADE}/words.json`,
  JSON.stringify(output, null, 2),
  "utf8"
);
console.log(`✓ ${words.length}개 단어 저장 완료`);
```

---

## 5. 다섯고개 ID 매핑 스크립트

```js
// scripts/map-review-ids.js
// words.json을 읽어 단어명 → ID 매핑 테이블 생성 후 reviews에 자동 삽입

const fs = require("fs");
const GRADE = 4;

const wordsData = JSON.parse(
  fs.readFileSync(`public/data/vocab/grade${GRADE}/words.json`, "utf8")
);
const wordMap = Object.fromEntries(wordsData.words.map((w) => [w.word, w.id]));

const reviewsData = JSON.parse(
  fs.readFileSync(`raw_reviews_grade${GRADE}.json`, "utf8")
);

let reviewIdx = 1;
const reviews = reviewsData.map((review) => ({
  id: `v-g${GRADE}-r${String(reviewIdx++).padStart(2, "0")}`,
  grade: GRADE,
  order: reviewIdx - 1,
  ...review,
  quizzes: review.quizzes.map((q) => ({
    ...q,
    relatedItemId: wordMap[q.answer] ?? "",
  })),
  coversItems: review.quizzes
    .map((q) => wordMap[q.answer])
    .filter(Boolean),
}));

const output = {
  version: "2026.1",
  contentType: "vocab-review",
  grade: GRADE,
  reviews,
};

fs.writeFileSync(
  `public/data/vocab/grade${GRADE}/reviews.json`,
  JSON.stringify(output, null, 2),
  "utf8"
);
console.log(`✓ ${reviews.length}개 다섯고개 저장 완료`);
```

---

## 6. 검증 체크리스트

추출 후 아래 항목을 확인합니다.

### 단어(words.json)

- [ ] 모든 단어에 `id`, `word`, `grade`, `order`, `page`, `definition` 존재
- [ ] `id` 형식: `v-gN-XXX` (N=학년, XXX=3자리 순번)
- [ ] `order`가 `page` 순서와 일치
- [ ] `sections` 배열에 `meet`, `think`, `learn`, `practice` 4종 모두 포함
- [ ] `multipleChoice` 활동의 `correctIndex`가 0~3 범위
- [ ] `fillBlank` 활동의 `blanks`와 `answers` 배열 길이 일치
- [ ] 특수문자 이스케이프: `"`, `\` 등 JSON 유효성 확인

### 다섯고개(reviews.json)

- [ ] 모든 항목에 `id`, `title`, `page`, `quizzes` 존재
- [ ] `id` 형식: `v-gN-rXX`
- [ ] 각 퀴즈의 `hint`가 정답 단어의 초성과 일치
- [ ] `relatedItemId`가 words.json의 실제 ID를 가리킴
- [ ] `coversItems`가 해당 다섯고개에서 다루는 단어 ID를 모두 포함

---

## 7. 자주 발생하는 오류 & 대처

| 오류 | 원인 | 대처 |
|---|---|---|
| 단어가 누락됨 | PDF 이미지 해상도 낮음 | 300 DPI 이상으로 재변환 |
| `definition`이 엉뚱한 문장 | 대화문을 뜻으로 혼동 | 프롬프트에 "뜻풀이 문장만" 명시 |
| `pos`가 비어 있음 | 교재에 품사 미표기 | 표준국어대사전 API로 보완 |
| 초성 `hint` 오류 | LLM이 받침 처리 실수 | 스크립트로 자동 초성 추출하여 교차 검증 |
| sections 누락 | 단원 구조 파악 실패 | 단원 첫 페이지 이미지를 추가로 제공 |
| JSON 파싱 오류 | 마크다운 코드블록 포함 | 응답에서 ` ```json ... ``` ` 제거 후 파싱 |

---

## 8. 배치 처리 권장 흐름

```bash
# 1. PDF → 이미지 변환 (ImageMagick 또는 pdf2pic)
magick -density 200 grade4.pdf -quality 90 pages/page_%03d.png

# 2. 페이지별 추출 (Node.js + Anthropic SDK)
node scripts/extract-pages.js --grade 4 --start 1 --end 80

# 3. ID 부여
node scripts/assign-ids.js

# 4. 리뷰 ID 매핑
node scripts/map-review-ids.js

# 5. 앱에 복사 및 manifest.json 업데이트
cp public/data/vocab/grade4/words.json ssac-app/public/data/vocab/grade4/words.json
```

---

## 9. manifest.json 업데이트

새 학년 추가 후 `public/data/manifest.json`을 업데이트합니다.

```json
{
  "vocab": {
    "enabled": true,
    "groups": [
      {
        "key": "grade1",
        "label": "1학년",
        "grade": 1,
        "wordCount": 28,
        "reviewCount": 7,
        "files": ["vocab/grade1/words.json", "vocab/grade1/reviews.json"]
      }
    ]
  }
}
```

---

## 10. 초성 자동 추출 유틸 (검증용)

```js
// scripts/utils/hangul.js
function getChosung(str) {
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : "";
    })
    .join("");
}

module.exports = { getChosung };
// 예: getChosung("가르치다") → "ㄱㄹㅊㄷ"
```
