const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const load = (name, key) => { const context = { window: {} }; vm.runInNewContext(read(name), context, { filename: name }); return context.window[key]; };
const examData = load('data/years.js', 'examData');
const expected = load('data/years.js', 'EXPECTED_COUNTS');
const expectedConstructed = load('data/years.js', 'EXPECTED_CONSTRUCTED');
const constructed = load('data/constructed-response.js', 'constructedResponseData');
const lessons = load('data/lesson-content.js', 'lessonContent');
const app = read('app.js');
const report = {
  generatedAt: new Date().toISOString(),
  authority: { officialAnswerMismatches: [], missingAnswer: [], missingStem: [], malformedOptions: [] },
  constructed: { checked: 0, unresolved: [], missingFields: [], missingSources: [] },
  originalPractice: { checked: 0, missingStems: [], missingAnswers: [], multipleValidAnswers: [], answerNotInOptions: [], explanationConflicts: [], missingConstructedFields: [] },
  answerLeak: { preSubmitLeaks: [], postSubmitReveal: 'FAIL', resetHidesAnswer: 'FAIL', staticEvidence: [] },
  regression: { official: 0, choice: 0, constructed: 0, practice: 0 },
  legacyP7SchemaPending: 36,
};

for (const [year, data] of Object.entries(examData)) {
  const questions = data.questions || [];
  report.regression.official += questions.length;
  report.regression.choice += questions.filter((q) => q.questionType !== 'constructed').length;
  const seen = new Set();
  for (const q of questions) {
    const id = `${year}-q${q.number}`;
    if (seen.has(q.number)) report.authority.missingStem.push({ id, reason: 'duplicate question number' });
    seen.add(q.number);
    if (!q.prompt || q.prompt.trim().length < 12) report.authority.missingStem.push({ id, reason: 'empty or too-short prompt' });
    if (q.questionType !== 'constructed') {
      const options = q.options || [];
      const labels = options.map((o) => o.label);
      if (labels.join('') !== 'ABCD' || options.length !== 4) report.authority.malformedOptions.push({ id, labels });
      if (!q.officialAnswer) report.authority.missingAnswer.push(id);
      const correct = options.filter((o) => o.correct).map((o) => o.label);
      if (correct.length !== 1 || correct[0] !== q.officialAnswer) report.authority.officialAnswerMismatches.push({ id, officialAnswer: q.officialAnswer, flaggedCorrect: correct });
    }
  }
  if (questions.length !== expected[year]) report.authority.missingStem.push({ year: Number(year), reason: `count ${questions.length}/${expected[year]}` });
}
for (const [year, items] of Object.entries(constructed)) {
  report.constructed.checked += items.length;
  if (items.length !== expectedConstructed[year]) report.constructed.unresolved.push({ year: Number(year), reason: `count ${items.length}/${expectedConstructed[year]}` });
  for (const q of items) {
    const required = ['questionRequirement', 'officialAnswer', 'scoringPoints', 'partialCredit', 'zeroCreditConditions', 'answerTool', 'answerAction', 'answerSheetInstruction', 'examReadyAnswer', 'commonWrongAnswers'];
    for (const field of required) if (q[field] == null || (Array.isArray(q[field]) && q[field].length === 0) || (typeof q[field] === 'string' && !q[field].trim())) report.constructed.missingFields.push({ id: `${year}-q${q.number}`, field });
    if (!q.sourceRefs || ['questionPdf', 'rubricPdf', 'answerSheetPdf', 'answerPdf'].some((field) => !q.sourceRefs[field])) report.constructed.missingSources.push(`${year}-q${q.number}`);
    if (q.needsReview || q.officialVerification?.status !== 'verified') report.constructed.unresolved.push({ id: `${year}-q${q.number}`, reason: 'official verification flag' });
  }
}
for (const lesson of Object.values(lessons)) for (const p of lesson.originalPractices || []) {
  report.originalPractice.checked += 1;
  const id = p.id;
  const isConstructed = String(p.type || '').includes('非選');
  if (!p.material || !p.question || p.question.trim().length < 12) report.originalPractice.missingStems.push(id);
  if (!p.answer) report.originalPractice.missingAnswers.push(id);
  if (p.options && p.options.length) {
    const correct = p.options.filter((o) => o.correct).map((o) => o.label);
    if (correct.length > 1) report.originalPractice.multipleValidAnswers.push({ id, correct });
    if (!p.options.some((o) => o.label === p.answer)) report.originalPractice.answerNotInOptions.push(id);
    if (correct.length === 1 && correct[0] !== p.answer) report.originalPractice.explanationConflicts.push({ id, reason: 'answer differs from correct option flag' });
  } else if (!isConstructed) report.originalPractice.missingStems.push({ id, reason: 'no A/B/C/D options' });
  if (isConstructed || p.answer == null) for (const field of ['examReadyAnswer', 'scoringPoints', 'acceptableAnswers', 'commonMistakes']) if (!p[field]) report.originalPractice.missingConstructedFields.push({ id, field });
}
report.regression.constructed = report.constructed.checked;
report.regression.practice = report.originalPractice.checked;

const questionStart = app.indexOf('function questionCard');
const questionEnd = app.indexOf('function filteredQuestions');
const questionSource = questionStart >= 0 && questionEnd > questionStart ? app.slice(questionStart, questionEnd) : '';
const preSubmitQuestionSource = questionSource.split('var revealed = current.submitted ?')[0];
const practiceStart = app.indexOf('function originalPracticeCard');
const practiceEnd = app.indexOf('function richLessonCard');
const practiceSource = practiceStart >= 0 && practiceEnd > practiceStart ? app.slice(practiceStart, practiceEnd) : '';
const leakRules = [
  { id: 'OFFICIAL_ANSWER_VISIBLE_INITIAL', matched: /question\.officialAnswer/.test(preSubmitQuestionSource), evidence: 'officialAnswer is referenced before the submitted branch.' },
  { id: 'ANSWER_GUIDE_INITIAL', matched: /answerGuide\(question\)/.test(preSubmitQuestionSource), evidence: 'answerGuide is called while constructing the pre-submit card.' },
  { id: 'ORIGINAL_PRACTICE_ANSWER_STATE_INITIAL', matched: /option\.correct \? 'correct' : 'wrong'/.test(practiceSource), evidence: 'original practice renders correct/wrong state before submit.' },
  { id: 'NO_SUBMIT_FLOW', matched: !/data-quiz-submit|data-practice-submit/.test(app), evidence: 'quiz submit flow is missing.' },
  { id: 'NO_RESET_FLOW', matched: !/data-quiz-reset|data-practice-reset/.test(app), evidence: 'quiz reset flow is missing.' },
];
for (const rule of leakRules) if (rule.matched) { report.answerLeak.preSubmitLeaks.push({ id: rule.id, evidence: rule.evidence }); report.answerLeak.staticEvidence.push(rule.evidence); }
report.answerLeak.postSubmitReveal = /current\.submitted[\s\S]*answerGuide\(question\)/.test(questionSource) && /current\.submitted[\s\S]*practiceExplanation\(item\)/.test(practiceSource) ? 'PASS' : 'FAIL';
report.answerLeak.resetHidesAnswer = /questionState\[button\.dataset\.quizReset\] = \{ selected: null, submitted: false \}/.test(app) && /practiceState\[button\.dataset\.practiceReset\] = \{ selected: null, submitted: false \}/.test(app) ? 'PASS' : 'FAIL';
const overall = report.authority.officialAnswerMismatches.length === 0 && report.authority.missingAnswer.length === 0 && report.authority.missingStem.length === 0 && report.constructed.unresolved.length === 0 && report.originalPractice.missingAnswers.length === 0 && report.originalPractice.multipleValidAnswers.length === 0 && report.originalPractice.answerNotInOptions.length === 0 && report.originalPractice.explanationConflicts.length === 0 && report.answerLeak.preSubmitLeaks.length === 0 && report.answerLeak.postSubmitReveal === 'PASS' && report.answerLeak.resetHidesAnswer === 'PASS';
report.finalStatus = overall ? 'PASS' : 'FAIL';
fs.writeFileSync(path.join(root, 'answer-authority-and-leak-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
const md = ['# ANSWER AUTHORITY AND LEAK REPORT', '', '## Official Answer Authority', '', ...Object.entries(examData).map(([year, data]) => `${year}: ${data.questions.length} / ${expected[year]}`), '', `Official answer mismatches: ${report.authority.officialAnswerMismatches.length}`, `Missing official answers: ${report.authority.missingAnswer.length}`, `Missing stems: ${report.authority.missingStem.length}`, `Malformed options: ${report.authority.malformedOptions.length}`, '', '## Constructed', '', `Constructed checked: ${report.constructed.checked} / 51`, `Unresolved: ${report.constructed.unresolved.length}`, `Missing fields: ${report.constructed.missingFields.length}`, `Missing source references: ${report.constructed.missingSources.length}`, '', '## Original Practice', '', `Original practice checked: ${report.originalPractice.checked} / 252`, `Missing stems: ${report.originalPractice.missingStems.length}`, `Missing answers: ${report.originalPractice.missingAnswers.length}`, `Multiple valid answers: ${report.originalPractice.multipleValidAnswers.length}`, `Answer/explanation conflicts: ${report.originalPractice.explanationConflicts.length}`, `Missing constructed fields: ${report.originalPractice.missingConstructedFields.length}`, '', '## Answer Leak', '', `Pre-submit leaks: **${report.answerLeak.preSubmitLeaks.length}**`, ...report.answerLeak.preSubmitLeaks.map((x) => `- ${x.id}: ${x.evidence}`), `Post-submit reveal: **${report.answerLeak.postSubmitReveal}**`, `Reset hides answer: **${report.answerLeak.resetHidesAnswer}**`, `Legacy P7 schema pending: **${report.legacyP7SchemaPending}**`, '', '## Regression', '', `- Official: ${report.regression.official} / 326`, `- Choice: ${report.regression.choice} / 275`, `- Constructed: ${report.regression.constructed} / 51`, `- Practice: ${report.regression.practice} / 252`, '', '## Final Status', '', `**ANSWER AUTHORITY & LEAK GATE: ${report.finalStatus}**`, ''].join('\n');
fs.writeFileSync(path.join(root, 'ANSWER_AUTHORITY_AND_LEAK_REPORT.md'), md, 'utf8');
console.log(JSON.stringify({ status: report.finalStatus, mismatches: report.authority.officialAnswerMismatches.length, missingStems: report.authority.missingStem.length, missingAnswers: report.authority.missingAnswer.length, leaks: report.answerLeak.preSubmitLeaks.length, postSubmit: report.answerLeak.postSubmitReveal, reset: report.answerLeak.resetHidesAnswer, regression: report.regression }, null, 2));
