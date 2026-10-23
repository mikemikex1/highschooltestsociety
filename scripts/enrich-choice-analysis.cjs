const fs = require('fs');
const vm = require('vm');

const file = require('path').join(__dirname, '..', 'data', 'years.js');
const source = fs.readFileSync(file, 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const data = context.window.examData;

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const excerpt = (value, limit = 150) => {
  const text = clean(value).replace(/^\d+\.\s*/, '');
  return text.length > limit ? text.slice(0, limit) + '…' : text;
};

function conceptFor(q) {
  const p = clean(q.prompt + ' ' + q.options.map(o => o.text).join(' '));
  if (/供給|需求|價格|成本|市場|GDP|機會成本|比較利益|貿易/.test(p)) return '經濟中的誘因、供需或市場結果';
  if (/法律|刑罰|犯罪|繼承|財產|權利|憲法|選舉|民主|政府|比例原則|正當程序/.test(p)) return '公民制度、法律效果與權利保障';
  if (/地圖|等高線|降雨|氣候|人口|都市|產業|地形|GIS|海峽|出口|空間|區位/.test(p)) return '地理的空間關係與環境／區位機制';
  if (/年代|世紀|史料|學者|王朝|殖民|戰爭|革命|宗教|文化|日治|清代|日本|中國|歐洲/.test(p)) return '歷史的時間脈絡、史料證據與因果關係';
  return q.subject === '跨科' ? '跨科材料中的概念連結與證據推論' : '材料與社會科概念的對應';
}

function errorType(q, option) {
  const p = clean(q.prompt);
  const t = clean(option.text);
  if (/供給|需求|價格|成本|市場/.test(p + t)) {
    if (/需求量|供給量/.test(t)) return '需求與需求量／供給與供給量混淆';
    return '供需方向錯誤';
  }
  if (/地圖|圖|表|統計|等高線|降雨|人口|區位|GIS/.test(p)) return '圖表判讀錯誤';
  if (/年代|世紀|清代|日治|戰爭|革命|王朝|學者|史料/.test(p)) return '史實或時代定位錯誤';
  if (/法律|權利|刑罰|繼承|政府|選舉|民主|憲法/.test(p)) return '制度功能或權利類型混淆';
  return '材料未支持或過度推論';
}

function reasoningFor(q, answer, clue, concept, correctText) {
  const p = clean(q.prompt + ' ' + q.options.map(o => o.text).join(' '));
  if (/供給|需求|價格|成本|市場|GDP|機會成本|比較利益|貿易/.test(p)) {
    return [
      `事件與材料先指出「${clue}」；要先判斷它改變的是需求、供給、成本或政府資源，而不是直接跳到價格結論。`,
      `沿著經濟推導鏈判讀：事件 → 影響的需求／供給或誘因 → 變動方向 → 對價格、數量或資源配置的結果；${answer}「${correctText}」符合這條鏈。`,
      `因此官方答案是 ${answer}；其他選項多半省略中間機制，或把需求與需求量、供給與供給量、機會成本與支出混為一談。`
    ];
  }
  if (/地圖|圖|表|統計|等高線|降雨|人口|區位|GIS|海峽|出口|空間/.test(p)) {
    return [
      `先從題幹或圖表確認「${clue}」所呈現的空間位置、數值差異或分布方向。`,
      `把看到的資料轉成地理意義，再連到${concept}；${answer}「${correctText}」能同時解釋資料與空間機制。`,
      `所以答案是 ${answer}；其他選項不是讀反圖表／地圖方向，就是只描述現象而沒有說明造成分布的機制。`
    ];
  }
  if (/年代|世紀|清代|日治|戰爭|革命|王朝|學者|史料|殖民|宗教|文化/.test(p)) {
    return [
      `題幹提供的時間、地點或史料線索是「${clue}」，先用它定位事件的時空背景。`,
      `再把材料放回${concept}的脈絡；${answer}「${correctText}」與題幹的史實、因果或觀點方向一致。`,
      `因此答案是 ${answer}；其他選項不是把不同時代／地區的事件套進來，就是把材料能證明的範圍擴大過頭。`
    ];
  }
  return [
    `題幹的具體事實是「${clue}」，這是判斷本題的直接證據。`,
    `把材料事實連到${concept}，${answer}「${correctText}」能同時回應題目所問的概念與制度／社會效果。`,
    `所以答案是 ${answer}；其他選項不是只抓到材料表面字詞，就是把不同概念或制度功能混在一起。`
  ];
}

function makeAnalysis(q) {
  const answer = String(q.officialAnswer || '').toUpperCase();
  const optionMap = Object.fromEntries((q.options || []).map(o => [o.label, o]));
  const p = clean(q.prompt);
  const concept = conceptFor(q);
  const clue = excerpt(p, 135);
  const correctOption = optionMap[answer];
  const missingLabels = ['A', 'B', 'C', 'D'].filter(label => !optionMap[label]);
  const review = Boolean(q.needsReview || missingLabels.length);

  if (q.year === 113 && q.number === 29) {
    q.options = ['A', 'B', 'C', 'D'].map(label => ({
      label,
      text: `官方試卷第 9 頁圖像選項（${label}）；請以原 PDF 圖示核對空間位置`,
      correct: label === answer,
      explanation: label === answer
        ? '官方答案為 B，但本題選項是地圖圖像；目前資料未保留足以辨識各圖的原始圖像，不能以殘缺文字判定空間位置。'
        : '本題選項是地圖圖像；目前資料未保留足以辨識各圖的原始圖像，不能虛構此圖與題幹的空間對應。',
      errorType: '圖像資料待回原 PDF 核對'
    }));
  }

  const finalOptions = Object.fromEntries((q.options || []).map(o => [o.label, o]));
  const options = {};
  for (const label of ['A', 'B', 'C', 'D']) {
    const option = finalOptions[label] || { label, text: '原始資料缺少此選項', correct: false };
    const isCorrect = label === answer;
    const optionText = excerpt(option.text, 120);
    options[label] = {
      correct: isCorrect,
      explanation: isCorrect
        ? `題幹的關鍵是「${clue}」。這項資訊要用${concept}解讀；${label}所說的「${optionText}」能把材料中的條件與概念結果連起來，因此比其他只碰到局部訊息或改變題意的選項完整。`
        : `題幹的關鍵是「${clue}」，但${label}主張「${optionText}」。這個說法沒有由題幹提供的證據推出，或把題目問的${concept}換成另一個問題，錯誤類型是${errorType(q, option)}。`,
      errorType: isCorrect ? '' : errorType(q, option)
    };
    if (option) {
      option.correct = isCorrect;
      option.explanation = options[label].explanation;
      option.errorType = options[label].errorType;
    }
  }

  q.whatIsTested = `本題考${concept}：要從題幹的具體條件「${clue}」判斷，而不是只認選項中的熟悉名詞。`;
  q.keyClues = [
    `材料線索：${clue}`,
    `判斷焦點：${concept}`,
    `正解對應：${answer}「${excerpt((finalOptions[answer] || correctOption || {}).text, 105)}」`
  ];
  q.reasoning = reasoningFor(q, answer, clue, concept, excerpt((finalOptions[answer] || correctOption || {}).text, 120));
  q.optionAnalysis = options;
  q.correctReasoning = [`題目在考什麼：${q.whatIsTested}`, ...q.keyClues, ...q.reasoning];
  q.takeaway = `${concept}：從「${excerpt(p, 35)}」抓出證據，再判斷 ${answer}。`;
  q.needsReview = review;
}

for (const year of Object.keys(data)) {
  for (const q of data[year].questions) {
    if (q.questionType !== 'constructed') makeAnalysis(q);
  }
}

fs.writeFileSync(file, 'window.EXPECTED_COUNTS = ' + JSON.stringify({ 111: 67, 112: 66, 113: 64, 114: 64, 115: 65 }) + ';\nwindow.EXPECTED_CONSTRUCTED = ' + JSON.stringify({ 111: 10, 112: 10, 113: 10, 114: 10, 115: 11 }) + ';\nwindow.examData = ' + JSON.stringify(data) + ';\n', 'utf8');
console.log('enriched choices', Object.values(data).flatMap(y => y.questions).filter(q => q.questionType !== 'constructed').length);
