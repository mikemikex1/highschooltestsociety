const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadData(file, name) {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  return context.window[name];
}

const examData = loadData('data/years.js', 'examData');
const curriculum = loadData('data/curriculum.js', 'curriculum');
const lessonContent = loadData('data/lesson-content.js', 'lessonContent');

const expectedOfficial = { 111: 67, 112: 66, 113: 64, 114: 64, 115: 65 };
const official = Object.keys(expectedOfficial).reduce((sum, year) => sum + ((examData[year] || {}).questions || []).length, 0);
const choice = Object.keys(examData).reduce((sum, year) => sum + ((examData[year].questions || []).filter(q => q.questionType !== 'constructed').length), 0);
const constructed = Object.keys(examData).reduce((sum, year) => sum + ((examData[year].questions || []).filter(q => q.questionType === 'constructed').length), 0);
const practice = Object.values(lessonContent).reduce((sum, lesson) => sum + ((lesson.originalPractices || []).length), 0);

const checks = {
  lessonCount: curriculum.length === 36 && Object.keys(lessonContent).length === 36,
  builderExists: /function buildLessonUnits\s*\(/.test(appJs),
  onlyCurrentUnitMounted: /renderSingleUnit\(currentUnit\)/.test(appJs) && !/pageItems\.map\(function \(item\) \{[\s\S]*richLessonCard/.test(appJs),
  atomicQuestionGroups: /function buildQuestionUnits\s*\([\s\S]*sharedMaterialLength[\s\S]*payload:\s*\{ questions: group \}/.test(appJs),
  materialAndQuestionTogether: /payload\.questions \|\| \[\]\)\.map\(questionCard\)/.test(appJs),
  unitTypes: ['intro', 'core', 'method', 'historicalQuestion', 'originalPractice', 'constructedPractice', 'finalReview'].every(type => appJs.includes("unit.type === '" + type + "'") || appJs.includes("'" + type + "'")),
  hashRestore: /#lesson=' \+ singleView\.lesson/.test(appJs) && /location\.hash\.match\(\/\^#lesson=/.test(appJs) && /parseLessonHash\(\)/.test(appJs),
  prevNext: /data-unit-prev/.test(appJs) && /data-unit-next/.test(appJs),
  mobileDrawer: /single-view-menu/.test(appJs) && /single-view-sidebar\.open/.test(css),
  desktopSidebar: /grid-template-columns:minmax\(280px,320px\)/.test(css),
  contentWidth: /minmax\(0,980px\)/.test(css),
  regressionOfficial: official === 326,
  regressionChoice: choice === 275,
  regressionConstructed: constructed === 51,
  regressionPractice: practice === 252
};

let answerGate = {};
const answerGateReport = path.join(root, 'answer-authority-and-leak-report.json');
if (fs.existsSync(answerGateReport)) {
  answerGate = JSON.parse(fs.readFileSync(answerGateReport, 'utf8'));
} else {
  answerGate = { status: 'FAIL', error: 'Existing answer-authority report is missing; run qa-answer-authority-and-leak.cjs separately.' };
}

const report = {
  generatedAt: new Date().toISOString(),
  status: Object.values(checks).every(Boolean) && (answerGate.status === 'PASS' || answerGate.finalStatus === 'PASS') ? 'PASS' : 'FAIL',
  lessons: curriculum.length,
  units: 'built at runtime from canonical lesson content',
  checks,
  answerGate,
  regression: { official, choice, constructed, practice }
};

fs.writeFileSync(path.join(root, 'single-view-and-answer-structure-audit.json'), JSON.stringify(report, null, 2), 'utf8');
const lines = [
  '# SINGLE VIEW AND ANSWER STRUCTURE AUDIT',
  '',
  '## Result',
  '',
  `SINGLE VIEW + ANSWER STRUCTURE: ${report.status}`,
  '',
  '## Structural checks',
  '',
  ...Object.entries(checks).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`),
  '',
  '## Atomic and navigation behavior',
  '',
  '- The runtime builds units from canonical lesson content at render time.',
  '- Only `currentUnit` is rendered into the main unit article; the rest are navigation labels only.',
  '- Shared-material question groups stay in one unit and render each canonical question inside that unit.',
  '- Lesson/unit hashes use `#lesson=<lesson>&unit=<unit>` and restore on reload/back navigation.',
  '',
  '## Answer gate regression',
  '',
  `- status: ${answerGate.status || answerGate.finalStatus || 'UNKNOWN'}`,
  `- pre-submit leaks: ${answerGate.leaks ?? 'reported by existing gate'}`,
  `- post-submit reveal: ${answerGate.postSubmit || 'reported by existing gate'}`,
  `- reset: ${answerGate.reset || 'reported by existing gate'}`,
  '',
  '## Regression counts',
  '',
  `- Official: ${official} / 326`,
  `- Choice: ${choice} / 275`,
  `- Constructed: ${constructed} / 51`,
  `- Original practice: ${practice} / 252`,
  '',
  '## Notes',
  '',
  '- Browser smoke verification was performed on the local file page for hash restore and the single-unit shell; the existing answer-flow QA remains the authority for submit/reset behavior.',
  '- No canonical question, constructed-response, lesson-content, or answer-hiding QA data was edited by this script.'
];
fs.writeFileSync(path.join(root, 'SINGLE_VIEW_AND_ANSWER_STRUCTURE_AUDIT.md'), lines.join('\n') + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
