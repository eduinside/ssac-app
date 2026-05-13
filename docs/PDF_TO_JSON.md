# PDF → JSON 파이프라인 설계

> 어휘싹 교재 PDF를 앱 데이터 JSON + 이미지 에셋으로 변환하는 전 과정 문서.  
> 작업 시간 단축 전략 포함.

---

## 1. 파이프라인 전체 흐름

```
PDF 원본
  │
  ▼
[Step 1] PDF → 페이지별 PNG (고해상도)
  │
  ▼
[Step 2] 페이지 종류 판별 (단어 / 다섯고개 / 기타)
  │
  ├─▶ 단어 페이지
  │     │
  │     ├─▶ [Step 3a] 텍스트 추출 (Claude Vision)
  │     │       → word, definition, examples, sections 텍스트
  │     │
  │     ├─▶ [Step 3b] 만나기 이미지 크롭 → WebP 변환
  │     │       → public/images/vocab/grade{N}/{id}-meet.webp
  │     │
  │     └─▶ [Step 3c] 짐작하기 이미지 크롭 → WebP 변환 (수작업 또는 자동)
  │               → public/images/vocab/grade{N}/{id}-think.webp
  │
  └─▶ 다섯고개 페이지
        │
        └─▶ [Step 4] 텍스트 추출 (Claude Vision)
                → title, coversPages, quizzes (hint / answer)
  │
  ▼
[Step 5] JSON 조립 + 수작업 검수
  │
  ▼
[Step 6] public/data/vocab/grade{N}/words.json + reviews.json 저장
```

---

## 2. 섹션 이미지 처리

### 2-0. 이미지를 포함하는 섹션

| 섹션 | 이미지 역할 | 파일명 규칙 | 추출 방식 |
|------|------------|------------|----------|
| **만나기** (meet) | 단어가 쓰인 장면 삽화 | `{id}-meet.webp` | 자동 (PDF 내장 이미지) |
| **짐작하기** (think) | 문제 보기 또는 보조 삽화 | `{id}-think.webp` | 수작업 첨부 |
| **익히기** (practice) | 활동 지시문 보조 삽화 | `{id}-practice.webp` | 수작업 첨부 |

세 섹션 모두 `Section.imageUrl` 필드에 경로를 저장. 이미지가 없으면 필드 생략.

---

### 2-1. 개요 (만나기)

만나기 섹션에는 단어가 사용된 짧은 삽화(캐릭터 대화 또는 장면 이미지)가 있음.  
이미지 위치는 페이지마다 텍스트 양에 따라 달라지므로 **고정 좌표를 쓸 수 없음**.

두 가지 방법을 우선순위 순서로 시도:

| 방법 | 원리 | 적합한 경우 |
|------|------|------------|
| **A. PDF 내장 이미지 추출** | PDF가 이미지를 XObject로 내장하므로 위치 계산 없이 직접 꺼냄 | 삽화가 래스터 이미지로 삽입된 경우 (대부분) |
| **B. Claude Vision bbox 판별** | 페이지 전체 이미지를 Claude에 보내 삽화 영역 좌표를 물어봄 | A로 추출이 안 되거나 벡터 그래픽인 경우 |

---

### 2-2. 방법 A — PDF 내장 이미지 직접 추출

PDF 내부에는 이미지가 위치 정보(bbox)와 함께 저장됨. PyMuPDF로 꺼내면 크롭 좌표 계산 불필요.

```python
# scripts/extract/extract_meet_images.py
import fitz  # PyMuPDF
from PIL import Image
import io, pathlib

def extract_meet_image(pdf_path: str, page_num: int, word_id: str, grade: int) -> str | None:
    doc = fitz.open(pdf_path)
    page = doc[page_num]

    # 페이지에 내장된 이미지 목록 (xref, smask, width, height, bpc, colorspace, ...)
    image_list = page.get_images(full=True)
    if not image_list:
        return None

    # 가장 큰 이미지 = 만나기 삽화 (아이콘·배경 제외 기준)
    # 너비 100px 미만은 UI 장식 요소로 간주하고 제외
    candidates = [img for img in image_list if img[2] >= 100 and img[3] >= 100]
    if not candidates:
        return None

    # 면적 기준 최대 이미지 선택
    target = max(candidates, key=lambda img: img[2] * img[3])
    xref = target[0]

    # 이미지 바이너리 추출
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # WebP 저장
    out_dir = pathlib.Path(f"public/images/vocab/grade{grade}")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{word_id}-meet.webp"
    img.save(out_path, "WEBP", quality=85)

    return f"/images/vocab/grade{grade}/{word_id}-meet.webp"
```

**한계**: 하나의 페이지에 여러 래스터 이미지가 있거나, 삽화가 벡터(SVG)로 그려진 경우 오판 가능 → 방법 B로 보완.

---

### 2-3. 방법 B — Claude Vision에 bbox 판별 위임

방법 A가 실패하거나 결과가 의심스러울 때 페이지 전체 이미지를 Claude에 전송해 삽화 영역 좌표를 받아 크롭.

```python
import fitz, anthropic, base64, json
from PIL import Image
import io, pathlib

client = anthropic.Anthropic()

BBOX_PROMPT = """이 이미지는 초등 어휘 교재의 단어 학습 페이지입니다.
'만나기' 섹션에 있는 삽화(캐릭터 그림 또는 장면 이미지) 영역의 좌표를 알려주세요.
텍스트 박스·제목·배경은 제외하고 삽화 이미지만 해당합니다.

다음 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{"x": 왼쪽픽셀, "y": 위픽셀, "width": 너비픽셀, "height": 높이픽셀}

삽화가 없으면: {"x": null}"""

def get_meet_bbox_from_claude(page_png_bytes: bytes) -> dict | None:
    image_data = base64.standard_b64encode(page_png_bytes).decode()
    msg = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=128,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_data}},
                {"type": "text", "text": BBOX_PROMPT}
            ]
        }]
    )
    result = json.loads(msg.content[0].text.strip())
    if result.get("x") is None:
        return None
    return result

def extract_meet_image_via_claude(pdf_path: str, page_num: int, word_id: str, grade: int) -> str | None:
    doc = fitz.open(pdf_path)
    page = doc[page_num]

    # 페이지를 PNG로 렌더링 (150dpi)
    mat = fitz.Matrix(150 / 72, 150 / 72)
    pix = page.get_pixmap(matrix=mat)
    page_png = pix.tobytes("png")

    bbox = get_meet_bbox_from_claude(page_png)
    if not bbox:
        return None

    img = Image.open(io.BytesIO(page_png)).convert("RGB")
    cropped = img.crop((bbox["x"], bbox["y"], bbox["x"] + bbox["width"], bbox["y"] + bbox["height"]))

    out_dir = pathlib.Path(f"public/images/vocab/grade{grade}")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{word_id}-meet.webp"
    cropped.save(out_path, "WEBP", quality=85)

    return f"/images/vocab/grade{grade}/{word_id}-meet.webp"
```

**비용 주의**: Claude API 호출이 페이지당 1회 추가되므로, 방법 A 실패 건에만 B를 적용하는 것이 효율적.

---

### 2-4. 통합 실행 흐름

```python
def get_meet_image(pdf_path, page_num, word_id, grade) -> str | None:
    # 방법 A 먼저 시도
    url = extract_meet_image(pdf_path, page_num, word_id, grade)
    if url:
        return url
    # 실패 시 방법 B
    print(f"  [{word_id}] A 실패 → Claude bbox 판별 시도")
    return extract_meet_image_via_claude(pdf_path, page_num, word_id, grade)
```

**의존 패키지**
```
pip install pymupdf pillow anthropic
```

---

### 2-5. JSON 스키마 변경

`meet` 및 `think` 섹션에 `imageUrl` 필드 추가 (선택적):

```json
{
  "type": "meet",
  "title": "만나기",
  "prompt": "강아지가 길을 가로질러 달려갑니다.",
  "imageUrl": "/images/vocab/grade1/v-g1-001-meet.webp",
  "dialogue": []
}
```

```json
{
  "type": "think",
  "title": "짐작하기",
  "imageUrl": "/images/vocab/grade1/v-g1-001-think.webp",
  "activity": {
    "kind": "multipleChoice",
    "prompt": "'가로지르다'의 뜻으로 알맞은 것은?",
    "options": ["①번", "②번", "③번", "④번"],
    "correctIndex": 0
  }
}
```

```json
{
  "type": "practice",
  "title": "익히기",
  "imageUrl": "/images/vocab/grade1/v-g1-001-practice.webp",
  "activity": {
    "kind": "freeWrite",
    "prompt": "빈칸에 알맞은 말을 써 보세요."
  }
}
```

이미지가 없으면 `imageUrl` 필드 생략.  
앱 코드에서 `section.imageUrl`이 있을 때만 `<img>` 렌더링하도록 처리.

### 2-6. 이미지 파일 경로 규칙

```
public/
└── images/
    └── vocab/
        └── grade{N}/
            ├── v-g1-001-meet.webp      ← 만나기 삽화 (자동 추출)
            ├── v-g1-001-think.webp     ← 짐작하기 이미지 (수작업 첨부)
            ├── v-g1-001-practice.webp  ← 익히기 이미지 (수작업 첨부)
            ├── v-g1-002-meet.webp
            └── ...
```

**수작업 첨부 절차 (짐작하기 / 익히기)**:
1. PDF에서 해당 페이지 이미지 영역 직접 크롭
2. `public/images/vocab/grade{N}/{id}-{섹션}.webp` 로 저장 (WebP, quality=85)
   - 짐작하기: `{id}-think.webp`
   - 익히기: `{id}-practice.webp`
3. 해당 단어의 섹션에 `"imageUrl": "/images/vocab/grade{N}/{id}-{섹션}.webp"` 추가

---

## 3. 텍스트 추출 (Claude Vision)

### 3-1. 프롬프트 전략

페이지 종류별로 **구조화된 JSON 출력**을 요청하면 후처리 비용이 줄어듦.

**단어 페이지 프롬프트 (예시)**

```
이 이미지는 초등 어휘 교재의 단어 학습 페이지입니다.
아래 JSON 형식으로 정보를 추출해 주세요. 없는 필드는 null로 두세요.

{
  "word": "단어",
  "pos": "품사(동사/명사/부사 등)",
  "definition": "뜻풀이",
  "examples": ["예문1", "예문2"],
  "similarWords": ["유사어1", "유사어2"],
  "page": 페이지번호(정수),
  "sections": {
    "meet": { "prompt": "만나기 본문 텍스트", "dialogue": ["대사1", "대사2"] },
    "think": {
      "kind": "multipleChoice",
      "prompt": "문제 텍스트",
      "options": ["①번", "②번", "③번", "④번"],
      "correctIndex": 정답번호(0부터)
    },
    "practice": {
      "kind": "fillBlank",
      "prompt": "빈칸 포함 문장 (___ 로 표기)",
      "answers": ["정답어"]
    }
  }
}
```

**다섯고개 페이지 프롬프트 (예시)**

```
이 이미지는 초등 어휘 교재의 '다섯고개' 복습 페이지입니다.
아래 JSON 형식으로 추출해 주세요.

{
  "title": "다섯고개 XX",
  "coversPages": "X쪽~X쪽",
  "page": 페이지번호(정수),
  "quizzes": [
    { "hint": "ㄱㄷ", "answer": "가르치다" }
  ]
}

hint는 초성만 포함하며 공백 없이 연속 작성합니다.
```

### 3-2. 배치 처리

Claude API를 직접 호출하는 스크립트로 페이지 전체를 순차 또는 병렬 처리:

```python
# scripts/extract/run_extraction.py
import anthropic, base64, json, pathlib
from concurrent.futures import ThreadPoolExecutor

client = anthropic.Anthropic()

def extract_page(image_path: pathlib.Path, prompt: str) -> dict:
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    
    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_data}},
                {"type": "text", "text": prompt}
            ]
        }]
    )
    # JSON 파싱
    text = message.content[0].text
    return json.loads(text[text.find("{"):text.rfind("}")+1])

def batch_extract(image_dir: str, page_type: str, max_workers: int = 4):
    images = sorted(pathlib.Path(image_dir).glob("*.png"))
    prompt = PROMPTS[page_type]
    
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(extract_page, img, prompt): img for img in images}
        for future in futures:
            try:
                results.append(future.result())
            except Exception as e:
                print(f"오류: {futures[future]} — {e}")
    return results
```

---

## 4. 작업 시간 단축 전략

### 4-1. 페이지 종류 자동 판별

파일명 또는 OCR 키워드로 페이지를 자동 분류하여 프롬프트를 자동 선택:

```python
def detect_page_type(text: str) -> str:
    if "다섯고개" in text:
        return "review"
    if any(kw in text for kw in ["만나기", "짐작하기", "익히기"]):
        return "word"
    return "other"
```

### 4-2. 증분 처리

이미 추출 완료된 ID는 건너뛰어 재작업 방지:

```python
def get_existing_ids(words_json_path: str) -> set:
    with open(words_json_path) as f:
        data = json.load(f)
    return {w["id"] for w in data.get("words", [])}

existing = get_existing_ids("public/data/vocab/grade1/words.json")
pages_to_process = [p for p in all_pages if derive_id(p) not in existing]
```

### 4-3. 검수 자동화

추출 결과에 대해 기본 검증 스크립트를 돌려 수작업 검수 범위를 최소화:

```python
def validate_word(w: dict) -> list[str]:
    errors = []
    if not w.get("word"):              errors.append("word 없음")
    if not w.get("definition"):        errors.append("definition 없음")
    if not w.get("page"):              errors.append("page 없음")
    meet = next((s for s in w.get("sections", []) if s["type"] == "meet"), None)
    if not meet:                       errors.append("meet 섹션 없음")
    practice = next((s for s in w.get("sections", []) if s["type"] == "practice"), None)
    if practice and not practice.get("activity", {}).get("answers"):
        errors.append("practice 정답 없음")
    return errors

for w in extracted_words:
    errs = validate_word(w)
    if errs:
        print(f"[{w.get('id', '?')}] {', '.join(errs)}")
```

### 4-4. 작업 분담 구조 (권장)

| 단계 | 담당 | 예상 소요 |
|------|------|-----------|
| PDF → 페이지 PNG 변환 | 스크립트 (자동) | 학년당 수 분 |
| 페이지 판별 + Claude 추출 | 스크립트 (자동) | 학년당 10~30분 |
| 만나기 이미지 크롭 | 스크립트 (자동) | 학년당 수 분 |
| JSON 자동 검증 | 스크립트 (자동) | 즉시 |
| 오류 항목 수작업 수정 | 사람 | 오류 건수에 비례 |
| 최종 검수 (샘플링) | 사람 | 학년당 30분 내외 |

**목표**: 수작업 구간을 "오류 수정"과 "최종 샘플 검수"로만 한정.

### 4-5. 기타 팁

- **해상도**: 150dpi면 OCR 정확도와 파일 크기의 균형이 좋음. 초성처럼 작은 글자가 많으면 200dpi 사용.
- **WebP 품질**: `quality=85`로 시각적 손실 없이 PNG 대비 40~60% 용량 절감.
- **병렬 처리**: Claude API 호출은 `ThreadPoolExecutor(max_workers=4)` 수준이 Rate Limit 안전권.
- **오류 격리**: 단일 페이지 실패가 전체 배치를 중단하지 않도록 `try/except`로 개별 처리 후 실패 목록만 재처리.

---

## 5. 검증 체크리스트

### words.json

- [ ] 모든 단어에 `id`, `word`, `grade`, `order`, `page`, `definition` 존재
- [ ] `id` 형식: `v-gN-XXX` (N=학년, XXX=3자리 순번)
- [ ] `order`가 `page` 순서와 일치
- [ ] `sections` 배열에 `meet`, `think`, `learn`, `practice` 4종 모두 포함
- [ ] `think`·`practice` 섹션에 `imageUrl: ""` 필드 존재 (수작업 이미지 첨부 자리)
- [ ] `multipleChoice` 활동의 `correctIndex`가 0~3 범위
- [ ] `fillBlank` 활동의 `blanks`와 `answers` 배열 길이 일치
- [ ] JSON 유효성: `"`, `\` 등 특수문자 이스케이프 확인

### reviews.json

- [ ] 모든 항목에 `id`, `title`, `page`, `quizzes` 존재
- [ ] `id` 형식: `v-gN-rXX`
- [ ] 각 퀴즈의 `hint`가 정답 단어의 초성과 일치
- [ ] `relatedItemId`가 words.json의 실제 ID를 가리킴
- [ ] `coversItems`가 해당 다섯고개에서 다루는 단어 ID를 모두 포함

---

## 6. 자주 발생하는 오류 & 대처

| 오류 | 원인 | 대처 |
|------|------|------|
| 단어가 누락됨 | PDF 이미지 해상도 낮음 | 200 DPI 이상으로 재변환 |
| `definition`이 엉뚱한 문장 | 대화문을 뜻으로 혼동 | 프롬프트에 "뜻풀이 문장만" 명시 |
| `meet.prompt`가 `"활동 설명"` 리터럴 | 프롬프트 예시를 LLM이 그대로 복사 | 예시 값을 `<...>` placeholder 형태로 변경 |
| `pos`가 비어 있음 | 교재에 품사 미표기 | 표준국어대사전 API로 보완 |
| 초성 `hint` 오류 | LLM이 받침 처리 실수 | 아래 초성 유틸로 자동 교차 검증 |
| `sections` 누락 | 단원 구조 파악 실패 | 단원 첫 페이지 이미지를 추가 제공 |
| JSON 파싱 오류 | 응답에 마크다운 코드블록 포함 | ` ```json ... ``` ` 제거 후 파싱 |
| 이미지 추출 0건 | `get_image_rects` 반환 없음 | PyMuPDF 버전 확인, `full=True` 옵션 사용 |

---

## 7. 알려진 주의사항

- `answer` 필드는 사용자 입력과 `===` 비교되므로 띄어쓰기·받침 완전 일치 필요.
- `hint` 초성은 공백 없이 연속 (`"ㄱㄹㅊㄷ"`). 공백 포함 시 UI 글자 간격 깨짐.
- `imageUrl`이 빈 문자열(`""`)이면 이미지 렌더링 안 함. 삽화 없는 경우 그대로 둘 것.
- `page` 필드는 목록 혼합 정렬 기준이므로 교재 실제 쪽수와 정확히 일치해야 함.
- 복수 정답이 필요한 `fillBlank`는 `answers` 배열로 관리하되, 현재 앱 코드는 첫 번째 항목만 비교하므로 코드 수정 필요 시 별도 작업.

---

## 8. 초성 자동 추출 유틸 (검증용)

`hint` 필드 검증 시 사용:

```js
// cho-ssac-lab/scripts/utils/hangul.js
function getChosung(str) {
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : "";
    })
    .join("");
}
// 예: getChosung("가르치다") → "ㄱㄹㅊㄷ"
```
