#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORDS_FILE = path.join(__dirname, '../public/data/vocab/grade1/words.json');

function readJsonFile(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');
  if (data.charCodeAt(0) === 0xFEFF) {
    data = data.slice(1);
  }
  return JSON.parse(data);
}

function writeJsonFile(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, '﻿' + json, 'utf8');
}

const improvements = {
  'v-g1-031': {
    word: '부호',
    definition: '일정한 뜻을 나타내기 위해 따로 정하여 쓰는 기호',
    examples: ['더하기 부호 +', '빼기 부호 -'],
    meetPrompt: '다양한 부호들을 찾아보세요.',
    thinkOptions: ['더하기 부호(+)', '빼기 부호(-)', '곱하기 부호(×)', '나누기 부호(÷)'],
    thinkCorrectIndex: 0,
  },
  'v-g1-032': {
    word: '분리배출',
    definition: '쓰레기를 재활용 가능한 것과 아닌 것으로 나누어 버리기',
    examples: ['쓰레기를 분리배출하여 환경을 보호하다.'],
    meetPrompt: '환경을 지키기 위해 분리배출해 봅시다.',
    thinkOptions: ['종류별로 쓰레기를 나누어 버리기', '모든 쓰레기를 함께 버리기', '쓰레기를 버리지 않기', '쓰레기를 모으기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-033': {
    word: '붙이다',
    definition: '무언가를 다른 것에 달거나 접착시키다',
    examples: ['종이를 벽에 붙이다.', '스티커를 책에 붙이다.'],
    meetPrompt: '물건을 다른 곳에 붙이는 모습을 보세요.',
    thinkOptions: ['다른 것에 달거나 접착시키다', '떼어내다', '분리하다', '던지다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-034': {
    word: '실다',
    definition: '바늘에 실을 끼우거나 물건을 줄에 꿰어 연결하기',
    examples: ['바늘에 실을 실다.', '구슬을 실에 꿰어 목걸이를 만들다.'],
    meetPrompt: '바늘에 실을 끼워 무언가를 만들어요.',
    thinkOptions: ['바늘에 실을 끼우거나 물건을 연결하기', '실을 자르기', '실을 풀기', '깎기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-035': {
    word: '샛',
    definition: '여러 가지 색깔의 물품이나 여러 종류의 것',
    examples: ['다양한 색의 샛 펜을 사용하다.'],
    meetPrompt: '여러 가지 색의 물품들을 봅시다.',
    thinkOptions: ['여러 가지 종류의 것', '한 가지 종류', '없는 것', '깨진 것'],
    thinkCorrectIndex: 0,
  },
  'v-g1-036': {
    word: '썰다',
    definition: '칼로 음식을 잘게 자르다',
    examples: ['당근을 얇게 썰다.', '양파를 동그랗게 썰다.'],
    meetPrompt: '음식을 칼로 썰어 요리를 준비해요.',
    thinkOptions: ['칼로 음식을 자르기', '음식을 익히기', '그릇에 담기', '맛보기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-037': {
    word: '소리내다',
    definition: '말이나 음성을 내어 표현하기',
    examples: ['크게 소리내어 말하다.', '종이가 소리내며 구겨지다.'],
    meetPrompt: '큰 소리를 내고 있어요.',
    thinkOptions: ['음성을 내어 표현하기', '음성을 멈추기', '조용해지기', '듣기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-038': {
    word: '솟다',
    definition: '어떤 곳에서 높이 올라오다',
    examples: ['연기가 하늘로 솟다.', '산이 높이 솟아있다.'],
    meetPrompt: '해가 동쪽에서 솟아오르고 있어요.',
    thinkOptions: ['높이 올라오다', '내려가다', '흩어지다', '멈추다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-039': {
    word: '심다',
    definition: '씨앗을 흙에 심거나 나무를 심다',
    examples: ['봄에 씨앗을 심다.', '정원에 꽃을 심다.'],
    meetPrompt: '땅에 씨앗을 심고 있어요.',
    thinkOptions: ['씨앗이나 나무를 땅에 심기', '수확하기', '물주기', '제초하기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-040': {
    word: '쓰기',
    definition: '펜이나 붓으로 글자나 그림을 표현하기',
    examples: ['종이에 글자를 쓰다.', '일기를 쓰다.'],
    meetPrompt: '손으로 글자를 쓰고 있어요.',
    thinkOptions: ['펜으로 글자를 표현하기', '말하기', '읽기', '지우기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-041': {
    word: '아우르다',
    definition: '여러 것을 포함하여 가슴에 안다',
    examples: ['모든 사람을 아우르는 사랑', '여러 분야를 아우르는 지식'],
    meetPrompt: '여러 것을 모두 포함하는 모습을 봅시다.',
    thinkOptions: ['여러 것을 포함하기', '제외하기', '분리하기', '버리기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-042': {
    word: '억시',
    definition: '특정 시간이나 때를 강조하여 이르는 말',
    examples: ['정확히 억시(정확한 시간)에 만나다.'],
    meetPrompt: '정확한 시간을 나타내는 표현입니다.',
    thinkOptions: ['정확한 때를 나타내기', '대략적인 시간', '과거의 시간', '미래의 시간'],
    thinkCorrectIndex: 0,
  },
  'v-g1-043': {
    word: '여기다',
    definition: '무언가가 어떤 상태인지 생각하거나 여기다',
    examples: ['그것을 좋은 것으로 여기다.', '소중하게 여기다.'],
    meetPrompt: '어떤 것을 어떻게 생각하거나 인정하는 모습입니다.',
    thinkOptions: ['어떤 것으로 생각하기', '부정하기', '무시하기', '잊기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-044': {
    word: '이야기',
    definition: '전하려는 말이나 사건의 내용',
    examples: ['재미있는 이야기를 듣다.', '할머니의 옛날 이야기'],
    meetPrompt: '흥미로운 이야기를 나누고 있어요.',
    thinkOptions: ['말해주는 내용', '침묵', '소음', '그림'],
    thinkCorrectIndex: 0,
  },
  'v-g1-045': {
    word: '있을',
    definition: '존재하거나 위치하다는 의미의 동사',
    examples: ['책상 위에 책이 있다.', '나는 학교에 있었다.'],
    meetPrompt: '무언가가 특정한 장소에 존재합니다.',
    thinkOptions: ['어딘가에 존재하거나 위치하다', '없어지다', '이동하다', '사라지다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-046': {
    word: '직접',
    definition: '자기가 몸소 또는 그 자리에서 직접',
    examples: ['직접 손으로 만들다.', '직접 가서 확인하다.'],
    meetPrompt: '스스로 몸으로 직접 하고 있어요.',
    thinkOptions: ['자신이 몸소 하기', '남에게 시키기', '함께하기', '대신하기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-047': {
    word: '진정하다',
    definition: '격정이나 화를 진정시키거나 가라앉히기',
    examples: ['아이의 울음을 진정하다.', '분노를 진정하다.'],
    meetPrompt: '흥분한 감정을 진정하고 있어요.',
    thinkOptions: ['격정을 가라앉히기', '화나게 하기', '자극하기', '흥분시키기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-048': {
    word: '징징거리다',
    definition: '자꾸 끈질기게 불평하거나 징징대다',
    examples: ['아이가 계속 징징거리다.', '작은 일로 징징거리다.'],
    meetPrompt: '끈질기게 자꾸 투정을 부리고 있어요.',
    thinkOptions: ['자꾸 불평하거나 투정하기', '즐거워하기', '참기', '웃기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-049': {
    word: '차곡차곡',
    definition: '층층이 또는 차례차례 정리하거나 쌓기',
    examples: ['책을 차곡차곡 정리하다.', '물건을 차곡차곡 쌓다.'],
    meetPrompt: '물건들을 정렬하여 차곡차곡 정리하고 있어요.',
    thinkOptions: ['층층이 정리하여 쌓기', '흐트러뜨리기', '분산시키기', '던지기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-050': {
    word: '차별',
    definition: '다른 것을 구별하여 다르게 대하기',
    examples: ['사람을 차별하지 말아야 한다.', '좋은 차별은 구분이다.'],
    meetPrompt: '사람들을 차별하지 않고 같이 지내야 합니다.',
    thinkOptions: ['다르게 구분하여 대하기', '같게 대하기', '무시하기', '칭찬하기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-051': {
    word: '책임',
    definition: '어떤 일을 책임지고 해야 할 의무',
    examples: ['숙제할 책임이 있다.', '학생의 책임을 다하다.'],
    meetPrompt: '해야 할 일에 대한 책임을 다하고 있어요.',
    thinkOptions: ['해야 할 의무와 책임', '자유로움', '회피', '무시'],
    thinkCorrectIndex: 0,
  },
  'v-g1-052': {
    word: '종소리',
    definition: '종이 울릴 때 나는 소리',
    examples: ['학교 종소리가 울리다.', '종의 종소리가 아름답다.'],
    meetPrompt: '종이 울릴 때의 소리를 들어봅시다.',
    thinkOptions: ['종이 울릴 때의 소리', '사람의 목소리', '새의 울음', '바람소리'],
    thinkCorrectIndex: 0,
  },
  'v-g1-053': {
    word: '조금해하다',
    definition: '불편해하거나 어려워하다',
    examples: ['낯선 사람을 조금해하다.', '새로운 상황을 조금해하다.'],
    meetPrompt: '낯선 상황에서 불편해하고 있어요.',
    thinkOptions: ['불편해하거나 어려워하기', '편해하기', '좋아하기', '즐거워하기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-054': {
    word: '탑돌',
    definition: '탑을 중심으로 도는 종교 의식',
    examples: ['절에서 탑돌을 한다.'],
    meetPrompt: '탑 주위를 도는 종교 의식입니다.',
    thinkOptions: ['탑 주위를 도는 의식', '건축물 짓기', '그림 그리기', '책 읽기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-055': {
    word: '텀벙이다',
    definition: '물에 자꾸 빠지거나 풍덩거리며 뛰어드는 모양',
    examples: ['아이들이 물에 텀벙이다.', '개가 연못에 텀벙 뛰어든다.'],
    meetPrompt: '물에 풍덩거리며 뛰어드는 모습입니다.',
    thinkOptions: ['물에 풍덩거리며 들어가기', '천천히 들어가기', '물을 피하기', '헤엄치기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-056': {
    word: '통쾌하다',
    definition: '마음이 시원하고 상쾌하다',
    examples: ['시원한 음료가 통쾌하다.', '문제를 해결해서 기분이 통쾌하다.'],
    meetPrompt: '마음이 시원하고 상쾌한 기분입니다.',
    thinkOptions: ['마음이 시원하고 상쾌하다', '답답하다', '불편하다', '화난다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-057': {
    word: '음식',
    definition: '먹을 수 있도록 만든 음식물',
    examples: ['맛있는 음식', '건강한 음식을 먹다.'],
    meetPrompt: '다양한 음식을 준비하고 있어요.',
    thinkOptions: ['먹을 수 있는 음식물', '마실 것', '약', '옷'],
    thinkCorrectIndex: 0,
  },
  'v-g1-058': {
    word: '예절',
    definition: '상황에 맞게 지켜야 할 올바른 행동과 태도',
    examples: ['밥 먹을 때의 예절', '인사의 예절을 배우다.'],
    meetPrompt: '올바른 예절을 실천하고 있어요.',
    thinkOptions: ['지켜야 할 올바른 태도와 행동', '무례함', '자유로움', '규칙 없음'],
    thinkCorrectIndex: 0,
  },
  'v-g1-059': {
    word: '용감',
    definition: '두려움 없이 용기 있게 행동하는 태도',
    examples: ['용감한 사람', '위험 속에서도 용감하게 행동하다.'],
    meetPrompt: '용감한 친구들의 모습입니다.',
    thinkOptions: ['두려움 없이 용기 있는 태도', '두려워하기', '겁내기', '피하기'],
    thinkCorrectIndex: 0,
  },
  'v-g1-060': {
    word: '흰색',
    definition: '햇빛이나 눈처럼 밝고 맑은 색',
    examples: ['흰색 구름', '흰색 눈이 소복이 내렸다.'],
    meetPrompt: '밝은 흰색을 표현합니다.',
    thinkOptions: ['밝고 맑은 색', '어두운 색', '붉은 색', '초록색'],
    thinkCorrectIndex: 0,
  },
};

function main() {
  console.log('📖 Updating vocabulary items 31-60...\n');

  const data = readJsonFile(WORDS_FILE);
  const wordsMap = {};
  data.words.forEach(w => {
    wordsMap[w.id] = w;
  });

  let updatedCount = 0;

  Object.entries(improvements).forEach(([wordId, improvement]) => {
    const wordItem = wordsMap[wordId];
    if (!wordItem) {
      console.log(`❌ ${wordId} not found`);
      return;
    }

    if (improvement.word) wordItem.word = improvement.word;
    if (improvement.definition) wordItem.definition = improvement.definition;
    if (improvement.examples) wordItem.examples = improvement.examples;

    const meetSection = wordItem.sections.find(s => s.type === 'meet');
    if (meetSection && improvement.meetPrompt) {
      meetSection.prompt = improvement.meetPrompt;
    }

    const thinkSection = wordItem.sections.find(s => s.type === 'think');
    if (thinkSection && improvement.thinkOptions) {
      thinkSection.activity.options = improvement.thinkOptions;
      thinkSection.activity.correctIndex = improvement.thinkCorrectIndex;
    }

    updatedCount++;
    console.log(`✅ ${wordId}: ${improvement.word}`);
  });

  writeJsonFile(WORDS_FILE, data);
  console.log(`\n✨ Successfully updated ${updatedCount} items!`);
}

main();
