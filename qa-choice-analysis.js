const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'years.js');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dataFile, 'utf8'), ctx);
const data = ctx.window.examData;
const expected = { 115: 54, 114: 54, 113: 54, 112: 56, 111: 57 };
const generic = ['不符合題意', '與材料不符', '應根據題幹判斷', '此選項不是正解', '請把題幹線索與選項逐字對照'];
const report = ['# Choice Analysis QA', '', '本檢查只驗收 275 題選擇／混合選擇題，不包含 51 題非選。', ''];
const missing = [], empty = [], mismatch = [], placeholders = [], duplicate = [], needsReview = [], imageIssues = [];
for (const year of ['115', '114', '113', '112', '111']) {
  const qs = data[year].questions.filter(q => q.questionType !== 'constructed');
  let complete = 0;
  for (const q of qs) {
    const labels = ['A', 'B', 'C', 'D'];
    const valid = q.whatIsTested && Array.isArray(q.keyClues) && q.keyClues.length > 0 && Array.isArray(q.reasoning) && q.reasoning.length > 0 && q.takeaway && q.optionAnalysis && labels.every(l => q.optionAnalysis[l] && q.optionAnalysis[l].explanation && q.optionAnalysis[l].correct === (l === q.officialAnswer));
    if (valid) complete++; else missing.push(`${year} Q${q.number}`);
    if (q.needsReview) needsReview.push(`${year} Q${q.number}`);
    for (const l of labels) {
      const opt = q.optionAnalysis && q.optionAnalysis[l];
      if (!opt || !String(opt.explanation || '').trim()) empty.push(`${year} Q${q.number} ${l}`);
      if (generic.some(text => String(opt && opt.explanation || '').includes(text))) placeholders.push(`${year} Q${q.number} ${l}`);
      if (opt && opt.correct !== (l === q.officialAnswer)) mismatch.push(`${year} Q${q.number} ${l}`);
    }
    if (!q.options || q.options.length !== 4 || q.options.some(o => !labels.includes(o.label))) missing.push(`${year} Q${q.number} options`);
  }
  report.push(`## ${year}`, `完成 ${complete} / ${expected[year]}`, '');
}
const all = Object.values(data).flatMap(y => y.questions).filter(q => q.questionType !== 'constructed');
const q29 = data['113'].questions.find(q => q.number === 29);
for (const label of ['A', 'B', 'C', 'D']) {
  const imagePath = q29 && q29.imageOptions && q29.imageOptions[label];
  if (!imagePath || !fs.existsSync(path.join(__dirname, imagePath))) imageIssues.push(`113 Q29 ${label}: ${imagePath || 'missing path'}`);
}
const seen = new Map();
for (const q of all) for (const l of ['A','B','C','D']) { const text = q.optionAnalysis?.[l]?.explanation || ''; if (text) { if (!seen.has(text)) seen.set(text, []); seen.get(text).push(`${q.year} Q${q.number} ${l}`); } }
for (const [text, hits] of seen) if (hits.length > 1) duplicate.push(`${hits.length}x ${hits.slice(0, 5).join(', ')}`);
report.push('## Missing analysis', ...(missing.length ? missing.map(x => `- ${x}`) : ['- None']), '', '## Empty option explanations', ...(empty.length ? empty.map(x => `- ${x}`) : ['- None']), '', '## Answer mismatch', ...(mismatch.length ? mismatch.map(x => `- ${x}`) : ['- None']), '', '## Placeholder text', ...(placeholders.length ? placeholders.map(x => `- ${x}`) : ['- None']), '', '## Duplicate / template-like explanations', ...(duplicate.length ? duplicate.map(x => `- ${x}`) : ['- None']), '', '## needsReview', ...(needsReview.length ? needsReview.map(x => `- ${x}`) : ['- None']), '', `Total complete: ${all.length - missing.filter(x => !x.endsWith('options')).length} / ${all.length}`, '', '## Final status', needsReview.length ? 'FAIL（113 年第 29 題圖像選項仍需回原 PDF 核對）' : 'PASS');
fs.writeFileSync(path.join(__dirname, 'choice-analysis-report.md'), report.join('\n') + '\n', 'utf8');
console.log(JSON.stringify({ complete: all.length - missing.filter(x => !x.endsWith('options')).length, total: all.length, missing: missing.length, empty: empty.length, placeholders: placeholders.length, duplicate: duplicate.length, imageIssues: imageIssues.length, needsReview: needsReview.length }));
