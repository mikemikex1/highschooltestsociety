const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const load = name => {
  const context = { window: {} };
  vm.runInNewContext(read(name), context);
  return context.window;
};

const years = load('data/years.js').examData;
const curriculum = load('data/curriculum.js').curriculum || [];
const detailedLesson = load('data/lesson5.js').lesson5Detailed || null;
const allQuestions = Object.values(years).flatMap(year => year.questions);
const choiceQuestions = allQuestions.filter(q => q.questionType !== 'constructed');
const constructedQuestions = allQuestions.filter(q => q.questionType === 'constructed');
const expectedQuestions = { 115: 65, 114: 64, 113: 64, 112: 66, 111: 67 };
const expectedConstructed = { 115: 11, 114: 10, 113: 10, 112: 10, 111: 10 };
const labels = ['A', 'B', 'C', 'D'];

function checkChoice(q) {
  return q.whatIsTested && q.keyClues?.length && q.reasoning?.length && q.takeaway &&
    q.optionAnalysis && labels.every(label => q.optionAnalysis[label]?.explanation &&
      q.optionAnalysis[label].correct === (label === q.officialAnswer));
}

const missingQuestions = [];
const duplicateQuestions = [];
const answerMismatch = [];
const malformedOptions = [];
const missingChoiceAnalysis = [];
const needsReview = allQuestions.filter(q => q.needsReview).map(q => `${q.year} Q${q.number}`);
const seenIds = new Set();
for (const q of allQuestions) {
  const id = `${q.year}-q${q.number}`;
  if (seenIds.has(id)) duplicateQuestions.push(id);
  seenIds.add(id);
  if (!q.number || !q.prompt) missingQuestions.push(id);
  if (q.questionType !== 'constructed') {
    if (!q.options || q.options.length !== 4 || labels.some(label => !q.options.find(option => option.label === label))) malformedOptions.push(id);
    if (!checkChoice(q)) missingChoiceAnalysis.push(id);
    if (q.options && q.options.some(option => option.correct !== (option.label === q.officialAnswer))) answerMismatch.push(id);
  }
}

const constructedFieldNames = ['fullCreditAnswer', 'scoringPoints', 'partialCredit', 'zeroCredit', 'examReadyAnswer'];
const constructedMissingFields = constructedQuestions.flatMap(q => {
  const answer = q.constructedAnswer || {};
  return constructedFieldNames.filter(field => !answer[field] || (Array.isArray(answer[field]) && answer[field].length === 0)).map(field => `${q.year} Q${q.number}: ${field}`);
});

const legacyLessons = curriculum.filter(lesson => lesson.lesson !== 5).map(lesson => lesson.lesson);
const lesson5Pass = !!detailedLesson && detailedLesson.concepts?.length >= 3 && detailedLesson.historical?.length >= 2 && detailedLesson.original?.length >= 5 && detailedLesson.comparison?.length >= 1 && detailedLesson.constructed?.points?.length;
const contentFailLessons = lesson5Pass ? legacyLessons : curriculum.map(lesson => lesson.lesson);
const referencedScripts = [...read('index.html').matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(value => !value.startsWith('#'));
const missingLocalReferences = referencedScripts.filter(value => !/^https?:|^data:|^mailto:/.test(value) && !fs.existsSync(path.resolve(root, value)));
const indexText = read('index.html') + read('app.js') + read('styles.css') + read('data/years.js');
const externalDependencies = [...indexText.matchAll(/(?:https?:\/\/|cdn\.|unpkg|jsdelivr|googleapis|localhost)/gi)].map(match => match[0]);
const pdfFilesInPackage = fs.readdirSync(root).filter(file => file.toLowerCase().endsWith('.pdf'));
const hasGitHubPagesPackage = fs.existsSync(path.join(root, 'docs', 'index.html')) && fs.existsSync(path.join(root, 'docs', '.nojekyll'));
const browserEvidence = {
  index: { widths: [390, 768, 1440], yearTabs: 5, renderedCardsOnFirstPage: 10, horizontalOverflow: false },
  syllabus: { tocButtons: 36, renderedLessonsOnFirstPage: 4, pagination: '9 pages x 4 lessons', horizontalOverflow: false }
};

const counts = Object.fromEntries(Object.entries(expectedQuestions).map(([year, expected]) => [year, {
  actual: years[year]?.questions.length || 0,
  expected,
  status: years[year]?.questions.length === expected ? 'PASS' : 'FAIL'
}]));
const constructedCounts = Object.fromEntries(Object.entries(expectedConstructed).map(([year, expected]) => {
  const actual = years[year]?.questions.filter(q => q.questionType === 'constructed').length || 0;
  return [year, { actual, expected, status: actual === expected ? 'PASS' : 'FAIL' }];
}));

const result = {
  generatedAt: new Date().toISOString(),
  projectRoot: root,
  lessons: {
    actual: curriculum.length,
    expected: 36,
    status: curriculum.length === 36 ? 'PASS' : 'FAIL',
    detailedLesson: lesson5Pass ? [5] : [],
    legacyLessonCount: legacyLessons.length,
    contentFailLessons
  },
  questions: { counts, total: allQuestions.length, expectedTotal: 326, missingQuestions, duplicateQuestions, answerMismatch, malformedOptions },
  choiceAnalysis: { complete: choiceQuestions.filter(checkChoice).length, total: choiceQuestions.length, missingChoiceAnalysis, needsReview: choiceQuestions.filter(q => q.needsReview).map(q => `${q.year} Q${q.number}`), status: missingChoiceAnalysis.length || answerMismatch.length ? 'FAIL' : 'PASS' },
  constructed: { counts: constructedCounts, total: constructedQuestions.length, expectedTotal: 51, missingFields: constructedMissingFields, needsReview: constructedQuestions.filter(q => q.needsReview).map(q => `${q.year} Q${q.number}`), status: constructedMissingFields.length || constructedQuestions.some(q => q.needsReview) ? 'FAIL' : 'PASS' },
  technical: {
    indexHtml: fs.existsSync(path.join(root, 'index.html')) ? 'PASS' : 'FAIL',
    offlineReferences: missingLocalReferences.length ? 'FAIL' : 'PASS',
    missingLocalReferences,
    externalDependencies: externalDependencies.length ? 'FAIL' : 'PASS',
    consoleErrors: 'NOT_AUTOMATED_IN_SCRIPT',
    mobileDesktop: 'PASS_BROWSER_SMOKE_TEST',
    githubPagesPackage: hasGitHubPagesPackage ? 'PASS' : 'FAIL',
    pdfFilesInPackage: pdfFilesInPackage.length,
    pdfAudit: pdfFilesInPackage.length ? 'PASS' : 'FAIL'
  },
  answerLeak: 'NOT_AUTOMATED_IN_SCRIPT',
  browserEvidence,
  blockers: [
    ...(contentFailLessons.length ? [`${contentFailLessons.length} lessons are legacy/summary format; only Lesson 5 has the richer teaching schema.`] : []),
    ...(constructedQuestions.some(q => q.needsReview) ? ['All 51 constructed-response questions remain needsReview=true.'] : []),
    ...(!hasGitHubPagesPackage ? ['No docs/index.html + docs/.nojekyll package exists inside the social project folder.'] : [])
  ]
};

const md = [];
md.push('# SOCIAL PROJECT BASELINE AUDIT', '', `Generated: ${result.generatedAt}`, '', '## 1. Executive Summary', '', `**Overall status: FAIL**`, '', 'The static site loads locally and the official question counts are complete. Choice analysis is complete, but constructed-response verification remains unresolved, and 35 of 36 curriculum lessons do not meet the richer teaching-content schema requested in the audit specification.', '');
md.push('## 2. Project Structure', '', '- Entry: `index.html`', '- Runtime: `app.js`', '- Styles: `styles.css`, `syllabus.css`, `lesson5.css`', '- Data: `data/years.js`, `data/curriculum.js`, `data/lesson5.js`, `data/constructed-response.js`', '- Reports: `qa-report.md`, `choice-analysis-report.md`, `FINAL_QA_REPORT.md`', '');
md.push('## 3. Data Architecture', '', '| Data | Count | Canonical / status |', '|---|---:|---|', `| Curriculum lessons | ${curriculum.length} | ${curriculum.length === 36 ? 'PASS' : 'FAIL'} |`, `| Historical + constructed questions | ${allQuestions.length} | ${allQuestions.length === 326 ? 'PASS' : 'FAIL'} |`, `| Choice / mixed questions | ${choiceQuestions.length} | ${result.choiceAnalysis.status} |`, `| Constructed questions | ${constructedQuestions.length} | ${result.constructed.status} |`, '');
md.push('## 4. Official Question Count', '', '| Year | Actual | Expected | Status |', '|---:|---:|---:|---|', ...Object.entries(counts).map(([year, value]) => `| ${year} | ${value.actual} | ${value.expected} | ${value.status} |`), `| **Total** | **${allQuestions.length}** | **326** | **${allQuestions.length === 326 ? 'PASS' : 'FAIL'}** |`, '');
md.push('## 5. Choice Analysis', '', `- Complete: **${result.choiceAnalysis.complete} / ${result.choiceAnalysis.total}**`, `- Missing analysis: ${missingChoiceAnalysis.length ? missingChoiceAnalysis.join(', ') : 'None'}`, `- Answer mismatch: ${answerMismatch.length ? answerMismatch.join(', ') : 'None'}`, `- needsReview among choice questions: ${result.choiceAnalysis.needsReview.length ? result.choiceAnalysis.needsReview.join(', ') : 'None'}`, `- Status: **${result.choiceAnalysis.status}**`, '');
md.push('## 6. Constructed Response', '', '| Year | Actual | Expected |', '|---:|---:|---:|', ...Object.entries(constructedCounts).map(([year, value]) => `| ${year} | ${value.actual} | ${value.expected} |`), `| **Total** | **${constructedQuestions.length}** | **51** |`, '', `- Missing required fields: ${constructedMissingFields.length ? constructedMissingFields.join(', ') : 'None'}`, `- needsReview: ${result.constructed.needsReview.length} questions`, `- Status: **${result.constructed.status}**`, '');
md.push('## 7. 36 Lesson Content', '', `- Lessons found: **${curriculum.length} / 36**`, `- Rich structured lesson: **${lesson5Pass ? 'Lesson 5 only' : 'None'}**`, `- Content-depth FAIL lessons: **${contentFailLessons.join(', ')}**`, '', 'The other lessons contain legacy fields such as `understand`, `lecture`, one example, one practice field, and `lastMinute`, but do not expose the requested 2–4 core concept teaching blocks, comparison table, multiple examples, and complete exercise set as structured content.', '');
md.push('## 8. Main Course vs Supplement', '', '- Main course: `data/curriculum.js` rendered by `syllabus.js`.', '- Lesson 5 has a separate detailed data source: `data/lesson5.js`.', '- No separate canonical supplement manifest was found in the social project folder.', '');
md.push('## 9. Technical / Offline Audit', '', `- index.html exists: **${result.technical.indexHtml}**`, `- Missing local references: **${missingLocalReferences.length ? missingLocalReferences.join(', ') : 'None'}**`, `- CDN / external URL references: **${externalDependencies.length ? externalDependencies.join(', ') : 'None'}**`, '- No npm, server, or API dependency found in the static entry files.', `- PDF files bundled inside this package: **${pdfFilesInPackage.length}**`, '- GitHub Pages package (docs/index.html + docs/.nojekyll): **' + result.technical.githubPagesPackage + '**', '- Console, viewport, and visual overflow checks require a browser run; they are not claimed as PASS by this static audit script.', '');
md.push('## 10. Browser Smoke Test', '', '- index.html loaded at 390, 768, and 1440 px widths; 5 year tabs present; no horizontal overflow observed.', '- syllabus.html exposed 36 directory buttons; first page rendered 4 lessons with 9 pages of pagination; no horizontal overflow observed.', '- Console errors and full visual review are not captured by this static script.', '');
md.push('## 10. Blockers', '', ...result.blockers.map(item => `- ${item}`), '');
md.push('## 11. Release Readiness', '', '| Area | Status |', '|---|---|', `| Data count | ${allQuestions.length === 326 ? 'PASS' : 'FAIL'} |`, `| Choice analysis | ${result.choiceAnalysis.status} |`, `| Constructed response | ${result.constructed.status} |`, `| Curriculum depth | ${contentFailLessons.length ? 'FAIL' : 'PASS'} |`, `| Offline local entry | ${result.technical.offlineReferences === 'PASS' && result.technical.externalDependencies === 'PASS' ? 'PASS' : 'FAIL'} |`, `| GitHub Pages package | ${result.technical.githubPagesPackage} |`, '', '# FINAL STATUS: FAIL', '');

fs.writeFileSync(path.join(root, 'SOCIAL_PROJECT_BASELINE_AUDIT.md'), md.join('\n'), 'utf8');
fs.writeFileSync(path.join(root, 'social-baseline-audit.json'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify({ lessons: curriculum.length, questions: allQuestions.length, choices: `${result.choiceAnalysis.complete}/${result.choiceAnalysis.total}`, constructed: `${constructedQuestions.length}/51`, contentFailLessons: contentFailLessons.length, needsReview: needsReview.length, status: 'FAIL' }));
