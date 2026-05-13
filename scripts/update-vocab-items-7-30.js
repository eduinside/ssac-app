#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORDS_FILE = path.join(__dirname, '../public/data/vocab/grade1/words.json');

// Helper function to handle BOM
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

// Improvements mapping based on textbook pages 10-34
const improvements = {
  'v-g1-007': {
    word: '꾸러미',
    definition: '한 데 묶거나 꾸러 쓴 물건',
    examples: ['엄마가 꾸러미를 들고 있어요.'],
    meetPrompt: '여러 물건을 한 데 묶은 꾸러미를 보고 있어요.',
    thinkOptions: ['한 데 묶거나 꾼 물건', '책상 위에 놓인 물건', '나무 위의 새둥지', '집안의 가구'],
    thinkCorrectIndex: 0,
  },
  'v-g1-008': {
    word: '꿰매다',
    definition: '옷이나 물건의 구멍을 바늘로 깁거나 막다',
    examples: ['할머니께서 찢어진 옷을 꿰매주셨다.', '인형의 구멍을 꿰매었다.'],
    meetPrompt: '찢어진 인형을 바늘로 꿰매고 있어요.',
    thinkOptions: ['구멍을 바늘로 깁다', '구멍을 크게 하다', '옷을 벗다', '옷을 입다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-009': {
    word: '낚다',
    definition: '낚시로 물고기를 잡다',
    examples: ['강에서 물고기를 낚다.'],
    meetPrompt: '낚시로 물고기를 잡고 있어요.',
    thinkOptions: ['낚시로 물고기를 잡다', '새를 잡다', '나무를 자르다', '음식을 먹다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-010': {
    word: '낭송',
    definition: '큰 목소리로 시를 읽거나 외우는 것',
    examples: ['학생들이 시를 낭송했다.'],
    meetPrompt: '시인이 시를 큰 목소리로 낭송하고 있어요.',
    thinkOptions: ['큰 목소리로 시를 읽다', '작은 목소리로 읽다', '조용히 생각하다', '음악을 듣다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-011': {
    word: '낱개',
    definition: '여럿 가운데 따로따로인 한 개',
    examples: ['사탕을 낱개로 포장했다.'],
    meetPrompt: '여러 개가 묶여있지 않고 하나씩 따로 있는 것을 낱개라고 해요.',
    thinkOptions: ['한 개 한 개 따로 있는 것', '많이 묶여있는 것', '색깔이 다양한 것', '매우 큰 것'],
    thinkCorrectIndex: 0,
  },
  'v-g1-012': {
    word: '낱말',
    definition: '뜻을 가진 가장 작은 말의 단위',
    examples: ['\"집\"은 낱말이다.'],
    meetPrompt: '음식을 보고 떠오르는 낱말을 말해 보세요.',
    thinkOptions: ['뜻을 가진 가장 작은 말', '길게 이어진 문장', '영어 단어', '외국말'],
    thinkCorrectIndex: 0,
  },
  'v-g1-013': {
    word: '누리다',
    definition: '생활 속에서 마음껏 즐기거나 맛보다',
    examples: ['자연의 아름다움을 누리다.', '맛있는 음식을 누리다.'],
    meetPrompt: '자연 속에서 기쁨을 누리고 있어요.',
    thinkOptions: ['마음껏 즐기거나 맛보다', '일하거나 공부하다', '걷거나 뛰다', '자고 쉬다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-014': {
    word: '눈여겨보다',
    definition: '자세히 살펴보거나 주의 깊게 보다',
    examples: ['나는 그 옷을 눈여겨보고 있다.'],
    meetPrompt: '마음에 드는 옷을 눈여겨보고 있어요.',
    thinkOptions: ['자세히 살펴보다', '빠르게 본다', '눈을 감다', '외면하다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-015': {
    word: '다듬다',
    definition: '손질하거나 깔끔하게 정리하다',
    examples: ['머리를 다듬다.', '방을 다듬다.'],
    meetPrompt: '옷을 다듬어 깔끔하게 정리하고 있어요.',
    thinkOptions: ['손질하거나 정리하다', '더럽히다', '버리다', '찢다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-016': {
    word: '단위',
    definition: '길이, 무게, 시간 따위를 수자로 나타낼 때 기준이 되는 것',
    examples: ['미터는 길이의 단위다.', '킬로그램은 무게의 단위다.'],
    meetPrompt: '다양한 단위를 알아보세요.',
    thinkOptions: ['수량을 나타내는 기준', '사람의 크기', '과일의 종류', '날짜를 세는 방법'],
    thinkCorrectIndex: 0,
  },
  'v-g1-017': {
    word: '닳다',
    definition: '오래 써서 낡아지거나 그 크기·두께가 줄어들다',
    examples: ['신발의 밑창이 닳았다.', '동전이 닳아서 글자가 안 보인다.'],
    meetPrompt: '오래 사용해서 닳은 신발을 보고 있어요.',
    thinkOptions: ['오래 써서 낡아지다', '새로워지다', '자라나다', '사라지다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-018': {
    word: '닿다',
    definition: '어떤 물체가 다른 물체에 접하다, 또는 소식이 전달되다',
    examples: ['손이 벽에 닿다.', '소식이 집에 닿다.'],
    meetPrompt: '손이 다른 물체에 닿고 있어요.',
    thinkOptions: ['물체가 다른 것에 접하다', '멀어지다', '내려간다', '올라간다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-019': {
    word: '떠기',
    definition: '뜨거운 물이나 수증기로 인해 떠오르거나 흩어지는 모양',
    examples: ['김이 떠기한다.'],
    meetPrompt: '물에서 떠오르는 모습을 보고 있어요.',
    thinkOptions: ['떠오르거나 흩어지다', '가라앉다', '흘러가다', '모이다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-020': {
    word: '대섯',
    definition: '여섯 개를 세는 다른 말',
    examples: ['대섯 명이 모였다.'],
    meetPrompt: '여섯을 나타내는 모습을 보고 있어요.',
    thinkOptions: ['여섯을 나타내는 말', '다섯을 나타내는 말', '일곱을 나타내는 말', '여덟을 나타내는 말'],
    thinkCorrectIndex: 0,
  },
  'v-g1-021': {
    word: '대피하다',
    definition: '위험한 곳에서 안전한 곳으로 옮기다',
    examples: ['불이 나면 빨리 대피해야 한다.'],
    meetPrompt: '불이 났을 때 안전한 곳으로 대피하고 있어요.',
    thinkOptions: ['위험한 곳에서 안전한 곳으로 가다', '계속 머물다', '앞으로 가다', '위로 올라가다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-022': {
    word: '덮혀있다',
    definition: '무언가로 덮여 있는 상태',
    examples: ['책상이 먼지로 덮혀있다.'],
    meetPrompt: '뭔가로 덮혀있는 모습을 보고 있어요.',
    thinkOptions: ['뭔가로 덮혀있다', '열려있다', '닫혀있다', '열린다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-023': {
    word: '닭혀있다',
    definition: '문이나 뚜껑이 닫혀 있는 상태',
    examples: ['문이 닭혀있다.', '상자가 닭혀있다.'],
    meetPrompt: '문이 닭혀있는 모습을 보고 있어요.',
    thinkOptions: ['닫혀있다', '열려있다', '반쯤 열려있다', '부러져있다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-024': {
    word: '도라다',
    definition: '동전이 회전하거나 뱅글뱅글 도는 모양',
    examples: ['동전이 도라다.'],
    meetPrompt: '동전이 빙글빙글 도는 모습을 보고 있어요.',
    thinkOptions: ['회전하거나 돌다', '굴러가다', '멈추다', '떨어지다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-025': {
    word: '없었다',
    definition: '존재하지 않았던 상태, 과거에 없었다',
    examples: ['그런 일은 없었다.'],
    meetPrompt: '황소의 등에서 파리가 없었던 상황을 보고 있어요.',
    thinkOptions: ['존재하지 않았다', '있었다', '나타났다', '사라졌다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-026': {
    word: '머쓱하다',
    definition: '마음이 불편하거나 민망해서 어쩔 줄 모르다',
    examples: ['그 일이 부끄러워 머쓱했다.'],
    meetPrompt: '민망한 상황에서 머쓱해하는 모습을 보고 있어요.',
    thinkOptions: ['불편하고 민망하다', '기쁘다', '화난다', '슬프다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-027': {
    word: '반직여다',
    definition: '무언가를 반으로 직여서 펼쳐놓다',
    examples: ['옷을 반직여 놓다.'],
    meetPrompt: '옷을 반으로 접어 펼쳐놓는 모습을 보고 있어요.',
    thinkOptions: ['반으로 직여 펼치다', '완전히 접다', '말다', '구겨지다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-028': {
    word: '배열',
    definition: '일정한 순서나 간격에 따라 벌여 놓음',
    examples: ['글자를 가나다라 순서대로 배열하다.'],
    meetPrompt: '물건들을 순서대로 배열하는 모습을 보고 있어요.',
    thinkOptions: ['순서대로 벌여놓다', '무작위로 놓다', '쌓다', '숨기다'],
    thinkCorrectIndex: 0,
  },
  'v-g1-029': {
    word: '일상',
    definition: '매일 반복되는 일상적인 생활',
    examples: ['일상 속에서 배움이 있다.'],
    meetPrompt: '매일의 일상 속에서 일어나는 일들을 보고 있어요.',
    thinkOptions: ['매일의 일상', '특별한 날', '휴일', '축제'],
    thinkCorrectIndex: 0,
  },
  'v-g1-030': {
    word: '별명',
    definition: '사람의 외모나 성격의 특징을 바탕으로 지어진 이름',
    examples: ['형은 키가 커서 \"키다리\"라는 별명이 있다.'],
    meetPrompt: '친구들의 별명을 생각해 보세요.',
    thinkOptions: ['외모나 성격의 특징으로 지어진 이름', '본래의 이름', '이름을 바꾸는 것', '별명을 없애는 것'],
    thinkCorrectIndex: 0,
  },
};

function main() {
  console.log('📖 Updating vocabulary items 7-30...\n');

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

    // Update basic info
    if (improvement.word) wordItem.word = improvement.word;
    if (improvement.definition) wordItem.definition = improvement.definition;
    if (improvement.examples) wordItem.examples = improvement.examples;

    // Update meet section
    const meetSection = wordItem.sections.find(s => s.type === 'meet');
    if (meetSection && improvement.meetPrompt) {
      meetSection.prompt = improvement.meetPrompt;
    }

    // Update think section
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
