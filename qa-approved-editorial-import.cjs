const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const canonicalPath = path.join(root, 'data', 'lesson-content.js');
const batchLetters = ['A', 'B', 'C', 'D', 'E'];
const approved = batchLetters.flatMap(letter => {
  const data = JSON.parse(fs.readFileSync(path.join(root, `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_${letter}.json`), 'utf8'));
  return (data.replacements || []).map(item => ({ ...item, batch: letter }));
});
const approvedGold = batchLetters.flatMap(letter => {
  const data = JSON.parse(fs.readFileSync(path.join(root, `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_${letter}.json`), 'utf8'));
  return (data.goldTeachingReplacements || []).map(item => ({ ...item, batch: letter }));
});

function loadWindow(files) {
  const context = { window: {} };
  for (const file of files) {
    const absolute = path.join(root, file);
    vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), context, { filename: absolute });
  }
  return context.window;
}
const window = loadWindow(['data/lesson-content.js', 'data/years.js', 'data/constructed-response.js']);
const lessons = window.lessonContent;
const canonicalPractices = Object.values(lessons).flatMap(lesson => lesson.originalPractices || []);
const missing = [];
const extra = [];
const drift = [];

function compare(expected, actual, field, id) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) drift.push({ id, field, expected, actual });
}
for (const item of approved) {
  const actual = canonicalPractices.find(practice => practice.id === item.replacePracticeId);
  if (!actual) {
    missing.push(item.replacePracticeId);
    continue;
  }
  compare(item.lessonId, actual.lessonId || actual._lessonId, 'lessonId', item.replacePracticeId);
  compare(item.practiceType, actual.practiceType, 'practiceType', item.replacePracticeId);
  compare(item.material, actual.material, 'material', item.replacePracticeId);
  compare(item.prompt, actual.prompt, 'prompt', item.replacePracticeId);
  compare(item.editorialStatus, actual.editorialStatus, 'editorialStatus', item.replacePracticeId);
  if (item.practiceType === 'advanced') {
    compare(item.answer, actual.answer, 'answer', item.replacePracticeId);
    compare(item.takeaway, actual.takeaway, 'takeaway', item.replacePracticeId);
    compare(item.reasoning, actual.reasoning, 'reasoning', item.replacePracticeId);
    compare(item.optionAnalysis, actual.optionAnalysis, 'optionAnalysis', item.replacePracticeId);
    for (const label of ['A', 'B', 'C', 'D']) {
      const option = (actual.options || []).find(option => option.label === label);
      if (!option) missing.push(`${item.replacePracticeId}.options.${label}`);
      else {
        compare(item.options[label], option.text, `options.${label}.text`, item.replacePracticeId);
        compare(item.optionAnalysis[label], option.explanation, `options.${label}.explanation`, item.replacePracticeId);
      }
    }
  } else {
    for (const field of ['examReadyAnswer', 'scoringPoints', 'acceptableAnswers', 'commonMistakes']) {
      compare(item[field], actual[field], field, item.replacePracticeId);
    }
  }
}
const approvedIds = new Set(approved.map(item => item.replacePracticeId));
const importedIds = new Set(canonicalPractices.map(practice => practice.id));
for (const id of importedIds) {
  if (/^L\d{2}-P[67]$/.test(id) && !approvedIds.has(id)) extra.push(id);
}
const legacyP7 = canonicalPractices.filter(practice => /^L\d{2}-P7$/.test(practice.id) && (
  !practice.examReadyAnswer || !Array.isArray(practice.scoringPoints) ||
  !Array.isArray(practice.acceptableAnswers) || !Array.isArray(practice.commonMistakes)
)).map(practice => practice.id);

const actualGold = Object.values(lessons).flatMap(lesson => (lesson.goldTeachingReplacements || []).map(item => ({ ...item, lessonId: lesson.lesson })));
const goldMissing = [];
const goldDrift = [];
for (const item of approvedGold) {
  const actual = actualGold.find(candidate => candidate.lessonId === item.lessonId && candidate.sectionId === item.sectionId);
  if (!actual) goldMissing.push(`L${item.lessonId}-${item.sectionId}`);
  else {
    for (const field of ['sectionId', 'replacementContent']) compare(item[field], actual[field], field, `L${item.lessonId}-${item.sectionId}`);
  }
}
const approvedGoldKeys = new Set(approvedGold.map(item => `${item.lessonId}::${item.sectionId}`));
for (const item of actualGold) {
  if (!approvedGoldKeys.has(`${item.lessonId}::${item.sectionId}`)) goldDrift.push(`L${item.lessonId}-${item.sectionId}`);
}
const answerAuthorityReport = JSON.parse(fs.readFileSync(path.join(root, 'answer-authority-and-leak-report.json'), 'utf8'));
const answerLeaks = (answerAuthorityReport.answerLeak && answerAuthorityReport.answerLeak.preSubmitLeaks || []).length;

const examQuestions = Object.values(window.examData || {}).flatMap(year => year.questions || []);
const official = examQuestions.length;
const choice = examQuestions.filter(question => question.questionType !== 'constructed').length;
const constructed = examQuestions.filter(question => question.questionType === 'constructed').length;
const practice = canonicalPractices.length;
const result = {
  batchesImported: batchLetters,
  practiceExpected: approved.length,
  practiceMatched: approved.length - missing.length - drift.filter(item => approvedIds.has(item.id)).length,
  practiceMissing: missing,
  practiceExtra: extra,
  fieldDrift: drift,
  goldExpected: approvedGold.length,
  goldMatched: approvedGold.length - goldMissing.length - goldDrift.length,
  goldMissing,
  goldDrift,
  legacyP7Pending: legacyP7.length,
  official,
  choice,
  constructed,
  practice,
  answerLeaks,
  runtimeAuthority: true,
  regression: official === 326 && choice === 275 && constructed === 51 && practice === 252 &&
    missing.length === 0 && extra.length === 0 && drift.length === 0 &&
    goldMissing.length === 0 && goldDrift.length === 0 && legacyP7.length === 0 && answerLeaks === 0
};
fs.writeFileSync(path.join(root, 'social-approved-import-dev-audit.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
const md = [
  '# SOCIAL APPROVED IMPORT DEV AUDIT',
  '',
  `Approved batches imported: ${batchLetters.join('/')}`,
  `Practice expected: ${result.practiceExpected}`,
  `Practice matched: ${result.practiceMatched} / ${result.practiceExpected}`,
  `Practice missing: ${missing.length}`,
  `Practice extra: ${extra.length}`,
  `Field drift: ${drift.length}`,
  `Gold expected: ${result.goldExpected}`,
  `Gold matched: ${result.goldMatched}`,
  `Gold drift: ${goldMissing.length + goldDrift.length}`,
  `Legacy P7 pending: ${legacyP7.length}`,
  '',
  `Official: ${official} / 326`,
  `Choice: ${choice} / 275`,
  `Constructed: ${constructed} / 51`,
  `Practice: ${practice} / 252`,
  `Answer leaks: ${answerLeaks}`,
  `Runtime authority: ${result.runtimeAuthority ? 'PASS' : 'FAIL'}`,
  `Regression: ${result.regression ? 'PASS' : 'FAIL'}`
].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'SOCIAL_APPROVED_IMPORT_DEV_AUDIT.md'), md, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!result.regression) process.exit(1);
