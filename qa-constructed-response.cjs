const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const expected = { 115: 11, 114: 10, 113: 10, 112: 10, 111: 10 };
const required = [
  'year', 'number', 'subject', 'topic', 'questionRequirement',
  'officialAnswer', 'scoringPoints', 'partialCredit', 'zeroCreditConditions',
  'wordLimit', 'answerTool', 'answerAction', 'answerSheetInstruction',
  'examReadyAnswer', 'commonWrongAnswers', 'sourceRefs', 'needsReview'
];
const sourceKeys = ['questionPdf', 'rubricPdf', 'answerSheetPdf', 'answerPdf'];
const placeholderPatterns = [
  /TODO/i, /待核對/, /尚待/, /待補/, /placeholder/i, /未確認/
];

function loadConstructed() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data', 'constructed-response.js'), 'utf8'), context);
  return context.window.constructedResponseData;
}

function asText(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '';
}

function isNonEmpty(value) {
  if (Array.isArray(value)) return value.length > 0 && value.every((item) => asText(item).trim());
  return asText(value).trim().length > 0;
}

function hasPlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(asText(value)));
}

function relativeExists(relativePath) {
  return typeof relativePath === 'string' && fs.existsSync(path.resolve(root, relativePath));
}

function auditQuestion(item, errors) {
  const label = `${item.year} Q${item.number}`;
  for (const field of required) {
    if (!(field in item)) errors.missingFields.push(`${label}: ${field}`);
  }
  for (const field of ['officialAnswer', 'questionRequirement', 'answerTool', 'answerAction', 'answerSheetInstruction', 'examReadyAnswer']) {
    if (!isNonEmpty(item[field])) errors.missingFields.push(`${label}: empty ${field}`);
  }
  for (const field of ['scoringPoints', 'partialCredit', 'zeroCreditConditions', 'commonWrongAnswers']) {
    if (!isNonEmpty(item[field])) errors.missingFields.push(`${label}: empty ${field}`);
  }
  if (!(item.wordLimit === null || item.wordLimit === undefined || isNonEmpty(item.wordLimit))) {
    errors.missingFields.push(`${label}: invalid wordLimit`);
  }
  if (!item.sourceRefs || typeof item.sourceRefs !== 'object') {
    errors.missingSourceRefs.push(`${label}: sourceRefs`);
  } else {
    for (const key of sourceKeys) {
      if (!item.sourceRefs[key]) errors.missingSourceRefs.push(`${label}: ${key}`);
      else if (!relativeExists(item.sourceRefs[key])) errors.missingSourceRefs.push(`${label}: missing file ${item.sourceRefs[key]}`);
    }
    for (const key of ['questionPage', 'rubricPage', 'answerSheetPage']) {
      if (!Number.isInteger(item.sourceRefs[key]) || item.sourceRefs[key] < 1) {
        errors.missingSourceRefs.push(`${label}: ${key}`);
      }
    }
  }
  if (item.officialVerification?.status !== 'verified') errors.missingSourceRefs.push(`${label}: officialVerification.status`);
  if (item.needsReview === true) errors.needsReview.push(`${label}${item.reviewReason ? `: ${item.reviewReason}` : ''}`);
  if (item.needsReview !== false) errors.needsReview.push(`${label}: needsReview is not false`);
  if (hasPlaceholder(item)) errors.placeholderText.push(label);
  if (item.drawingVerification && !isNonEmpty(item.drawingVerification)) errors.imageDrawing.push(`${label}: drawingVerification empty`);
  if (item.drawingVerification && (!item.sourceRefs || !item.sourceRefs.questionPage || !item.sourceRefs.rubricPage || !item.sourceRefs.answerSheetPage)) {
    errors.imageDrawing.push(`${label}: drawing page reference incomplete`);
  }
  if (asText(item.partialCredit).includes('不確定') || asText(item.partialCredit).includes('待')) errors.partialCredit.push(label);
  if (asText(item.zeroCreditConditions).includes('不確定') || asText(item.zeroCreditConditions).includes('待')) errors.zeroCredit.push(label);
}

function auditRegression() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data', 'years.js'), 'utf8'), context);
  const examData = context.window.examData || {};
  const counts = Object.fromEntries(Object.entries(examData).map(([year, value]) => [year, Array.isArray(value.questions) ? value.questions.length : 0]));
  const expectedCounts = { 115: 65, 114: 64, 113: 64, 112: 66, 111: 67 };
  const questionCount = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const expectedTotals = Object.values(expectedCounts).reduce((sum, value) => sum + value, 0);
  const pass = questionCount === expectedTotals && Object.entries(expectedCounts).every(([year, count]) => counts[year] === count);
  return { counts, questionCount, expectedCounts, expectedTotals, pass };
}

function main() {
  const data = loadConstructed();
  const errors = {
    missingFields: [], missingSourceRefs: [], imageDrawing: [], partialCredit: [],
    zeroCredit: [], needsReview: [], placeholderText: [], duplicateQuestions: []
  };
  const all = [];
  const perYear = {};
  for (const year of [115, 114, 113, 112, 111]) {
    const items = Array.isArray(data[year]) ? data[year] : [];
    perYear[year] = { expected: expected[year], actual: items.length, complete: 0, needsReview: 0 };
    const seen = new Set();
    for (const item of items) {
      const key = `${item.year}-${item.number}`;
      if (seen.has(key)) errors.duplicateQuestions.push(key);
      seen.add(key);
      auditQuestion(item, errors);
      if (item.needsReview === false && !errors.missingFields.some((x) => x.startsWith(`${year} Q${item.number}:`)) && !errors.missingSourceRefs.some((x) => x.startsWith(`${year} Q${item.number}:`))) perYear[year].complete += 1;
      if (item.needsReview) perYear[year].needsReview += 1;
      all.push(item);
    }
  }
  const regression = auditRegression();
  const totalExpected = Object.values(expected).reduce((sum, value) => sum + value, 0);
  const pass = all.length === totalExpected && Object.values(perYear).every((v) => v.actual === v.expected && v.complete === v.expected) && Object.values(errors).every((list) => list.length === 0) && regression.pass;
  const report = {
    generatedAt: new Date().toISOString(),
    status: pass ? 'PASS' : 'BLOCKED',
    perYear,
    total: { expected: totalExpected, actual: all.length, complete: Object.values(perYear).reduce((sum, value) => sum + value.complete, 0) },
    errors,
    regression
  };
  fs.writeFileSync(path.join(root, 'constructed-response-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  const lines = [
    '# CONSTRUCTED RESPONSE QA', '',
    `Generated: ${report.generatedAt}`, '',
    ...[115, 114, 113, 112, 111].flatMap((year) => [
      `## ${year}`,
      `complete ${perYear[year].complete} / ${perYear[year].expected}`,
      `needsReview ${perYear[year].needsReview}`, ''
    ]),
    '## Missing Fields', ...((errors.missingFields.length ? errors.missingFields : ['None'])), '',
    '## Missing Source References', ...((errors.missingSourceRefs.length ? errors.missingSourceRefs : ['None'])), '',
    '## Image / Drawing Review', ...((errors.imageDrawing.length ? errors.imageDrawing : ['All drawing/map entries have official page references.'])), '',
    '## Partial Credit Unclear', ...((errors.partialCredit.length ? errors.partialCredit : ['None'])), '',
    '## Zero Credit Unclear', ...((errors.zeroCredit.length ? errors.zeroCredit : ['None'])), '',
    '## needsReview', ...((errors.needsReview.length ? errors.needsReview : ['None'])), '',
    '## Placeholder Text', ...((errors.placeholderText.length ? errors.placeholderText : ['None'])), '',
    '## Duplicate Questions', ...((errors.duplicateQuestions.length ? errors.duplicateQuestions : ['None'])), '',
    '## Regression',
    `Constructed responses: ${report.total.actual} / ${report.total.expected}`,
    `Official question records in data/years.js: ${regression.questionCount} / ${regression.expectedTotals}`,
    `Choice/official question regression: ${regression.pass ? 'PASS' : 'FAIL'}`, '',
    '## Final Status',
    report.status
  ];
  fs.writeFileSync(path.join(root, 'constructed-response-report.md'), lines.join('\n') + '\n', 'utf8');
  console.log(`CONSTRUCTED RESPONSE STATUS: ${report.status}`);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = pass ? 0 : 1;
}

main();
