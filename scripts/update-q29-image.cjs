const fs = require('fs');
const vm = require('vm');

const file = require('path').join(__dirname, '..', 'data', 'years.js');
const source = fs.readFileSync(file, 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const q = context.window.examData['113'].questions.find(item => item.number === 29);
if (!q) throw new Error('113 Q29 not found');

const explanations = {
  A: {
    correct: false,
    text: 'A 圖：甲在西南歐（西班牙）、丙在東南歐；甲、丙對調。',
    explanation: '表 3 中甲的人均 GDP 為 13,772 美元，出口含電氣機械、礦物燃料，應對應東歐；丙的人均 GDP 為 29,350 美元，出口含食品、菸草、化學品，應對應南歐。A 把甲放到西班牙、把丙放到東南歐，正好把兩者的區域位置對調。',
    errorType: '空間位置錯誤'
  },
  B: {
    correct: true,
    text: 'B 圖：甲東南歐、乙西歐、丙西南歐、丁北歐。',
    explanation: '表 3 的乙 GDP 4,072.2 十億美元且人均 GDP 48,432 美元，出口機械、運輸設備、醫藥與航空產品，符合西歐的德國型經濟；丁人均 GDP 55,873 美元、GDP 585.9 十億美元，符合北歐的瑞典型經濟；丙的食品、菸草、化學品出口與人均 GDP 29,350 美元符合西南歐；甲的低人均 GDP 與電氣機械、礦物燃料出口則符合東南歐。因此 B 的四個區域位置與表 3 的經濟資料一致。',
    errorType: ''
  },
  C: {
    correct: false,
    text: 'C 圖：乙在北歐、丁在西歐；甲、丙的位置亦與表 3 不符。',
    explanation: '乙的高 GDP 與機械、運輸設備、醫藥及航空產品出口應對應西歐，不是圖中的北歐；丁的人均 GDP 55,873 美元、GDP 585.9 十億美元才較符合北歐，不是圖中的西歐。此外，C 把甲放在西南歐、丙放在東南歐，也將甲與丙對調。',
    errorType: '區域判讀錯誤'
  },
  D: {
    correct: false,
    text: 'D 圖：乙在北歐、丁在西歐；甲、丙位置正確。',
    explanation: 'D 的甲位於東南歐、丙位於西南歐，符合兩者的資料；但乙與丁互換。乙的 GDP 4,072.2 十億美元及多項高附加價值出口應對應西歐，丁的 GDP 585.9 十億美元與最高人均 GDP 應對應北歐，因此 D 的北歐／西歐位置判斷錯誤。',
    errorType: '區域判讀錯誤'
  }
};

q.subject = '地理';
q.topic = '歐洲區域經濟資料與空間位置判讀';
q.subtopics = ['區域地理', '國際分工', '人均 GDP 與出口結構', '地圖判讀'];
q.imageOptions = {
  A: 'assets/113/q29/113-q29-A.png',
  B: 'assets/113/q29/113-q29-B.png',
  C: 'assets/113/q29/113-q29-C.png',
  D: 'assets/113/q29/113-q29-D.png'
};
q.options = ['A', 'B', 'C', 'D'].map(label => ({
  label,
  correct: explanations[label].correct,
  text: explanations[label].text,
  explanation: explanations[label].explanation,
  errorType: explanations[label].errorType
}));
q.optionAnalysis = Object.fromEntries(['A', 'B', 'C', 'D'].map(label => [label, {
  correct: explanations[label].correct,
  explanation: explanations[label].explanation,
  errorType: explanations[label].errorType
}]));
q.whatIsTested = '把人均 GDP、GDP 總量與出口品項連到歐洲次區域，再判斷甲、乙、丙、丁的空間位置。';
q.keyClues = [
  '甲人均 GDP 13,772 美元，出口含電氣機械、礦物燃料，較符合東南歐。',
  '乙 GDP 4,072.2 十億美元、人均 GDP 48,432 美元，出口機械、運輸設備與醫藥，較符合西歐。',
  '丙人均 GDP 29,350 美元，出口食品、菸草與化學品，較符合西南歐。',
  '丁人均 GDP 55,873 美元、GDP 585.9 十億美元，較符合北歐。'
];
q.reasoning = [
  '先用人均 GDP 與 GDP 總量區分四國的發展程度與國家規模，再用出口結構確認區域特徵。',
  '乙的高總量與多元高附加價值製造出口對應西歐；丁的人均 GDP 最高但總量較小，對應北歐。',
  '丙的食品、菸草與化學品出口及中等人均 GDP 對應西南歐；甲的較低人均 GDP 與礦物燃料、電氣機械出口對應東南歐。',
  '所以只有 B 圖呈現「甲東南歐、乙西歐、丙西南歐、丁北歐」的完整配置。'
];
q.correctReasoning = [
  '題目在考什麼：將表 3 的經濟指標與出口結構，轉換成歐洲次區域的空間位置。',
  '圖像核對：B 圖將甲放在東南歐、乙放在西歐、丙放在西南歐、丁放在北歐。',
  ...q.reasoning
];
q.takeaway = '低人均 GDP 的甲在東南歐；高總量乙在西歐；丙西南歐；最高人均 GDP 的丁在北歐。';
q.trap = '只看單一人均 GDP，忽略 GDP 總量、出口結構與四個區域的相對位置。';
q.needsReview = false;
q.verifiedAgainst = '05-113學測社會科試題定稿.pdf 第 7–8 頁（表 3 與第 29 題四個原始圖像選項）及官方答案 PDF';

function findQuestionObject(text) {
  const marker = '{"year":113,"number":29';
  const start = text.indexOf(marker);
  if (start < 0) throw new Error('Q29 object marker not found');
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return { start, end: i + 1 };
  }
  throw new Error('Q29 object end not found');
}

const range = findQuestionObject(source);
const updated = source.slice(0, range.start) + JSON.stringify(q) + source.slice(range.end);
fs.writeFileSync(file, updated, 'utf8');
console.log('Updated only 113 Q29');
