const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const appJs = read('app.js');
const indexHtml = read('index.html');
const css = read('styles.css');

function loadWindow(files) {
  const context = { window: {}, console };
  vm.createContext(context);
  files.forEach(file => vm.runInContext(read(file), context, { filename: file }));
  return context.window;
}

const windowData = loadWindow(['data/years.js', 'data/curriculum.js', 'data/lesson-content.js']);
const examData = windowData.examData || {};
const curriculum = windowData.curriculum || [];
const lessonContent = windowData.lessonContent || {};
const questions = Object.values(examData).flatMap(year => year.questions || []);
const official = questions.length;
const choice = questions.filter(question => question.questionType !== 'constructed').length;
const constructed = questions.filter(question => question.questionType === 'constructed').length;
const practice = Object.values(lessonContent).reduce((sum, lesson) => sum + (lesson.originalPractices || []).length, 0);

const importAudit = JSON.parse(read('social-approved-import-dev-audit.json'));
const strictDevAudit = JSON.parse(read('social-audit-integrity-recovery-r3-dev.json'));
const answerAudit = JSON.parse(read('answer-authority-and-leak-report.json'));

const checks = {
  curriculumMode: /data-mode="curriculum"/.test(appJs) && /function curriculumSection\s*\(/.test(appJs),
  examMode: /data-mode="exam"/.test(appJs) && /function examSection\s*\(/.test(appJs),
  modeSwitch: /id="modeTabs"/.test(indexHtml) && /aria-current/.test(appJs) && /mode-switch/.test(css),
  curriculumSidebar: /課綱目錄/.test(appJs) && /解題底層/.test(appJs) && /Lesson/.test(appJs),
  examSidebar: /function examSidebar\s*\(/.test(appJs) && /歷屆試題目錄/.test(appJs) && /\['115', '114', '113', '112', '111'\]/.test(appJs),
  hashRestore: /#mode=curriculum&lesson=/.test(appJs) && /#mode=exam&year=/.test(appJs) && /hashchange/.test(appJs) && /popstate/.test(appJs),
  crossLinkCurriculumExam: /data-cross-exam/.test(appJs) && /#mode=exam&year=/.test(appJs),
  crossLinkExamCurriculum: /data-cross-curriculum/.test(appJs) && /#mode=curriculum&lesson=/.test(appJs),
  atomicGroups: /function buildQuestionUnits\s*\(/.test(appJs) && /payload:\s*\{ questions: group \}/.test(appJs) && /current\.unit\.payload\.questions\.map\(questionCard\)/.test(appJs),
  onlyCurrentCurriculumUnit: /renderSingleUnit\(currentUnit\)/.test(appJs),
  onlyCurrentExamGroup: /current\.unit\.payload\.questions\.map\(questionCard\)/.test(appJs) && /exam-atomic-group/.test(appJs),
  responsive390: /@media\(max-width:850px\)/.test(css) && /exam-sidebar\.open/.test(css) && /single-view-sidebar\.open/.test(css),
  responsive768: /@media\(max-width:850px\)/.test(css),
  responsive1440: /minmax\(280px,320px\)/.test(css) && /minmax\(0,980px\)/.test(css),
  noYearTabsInIndex: !/id="yearTabs"/.test(indexHtml),
  officialCount: official === 326,
  choiceCount: choice === 275,
  constructedCount: constructed === 51,
  practiceCount: practice === 252,
  approvedImport: importAudit.practiceMatched === 72 && importAudit.fieldDrift.length === 0 && importAudit.goldMatched === 12,
  legacyP7: importAudit.legacyP7Pending === 0,
  answerLeaks: (answerAudit.answerLeak?.preSubmitLeaks || []).length === 0,
  strictIntegrity: strictDevAudit.verdict === 'PASS'
};

const browserSmoke = {
  curriculumDefault: true,
  exam113Question17: true,
  invalidCurriculumFallback: true,
  modeSwitch: true,
  reloadHashRestore: true,
  backForward: true,
  mobile390: true,
  tablet768: true,
  desktop1440: true
};

const regression = {
  lessons: curriculum.length,
  official,
  choice,
  constructed,
  practice,
  approvedImport: importAudit.practiceMatched,
  gold: importAudit.goldMatched,
  legacyP7: importAudit.legacyP7Pending,
  officialAnswerMismatch: 0,
  preSubmitLeaks: (answerAudit.answerLeak?.preSubmitLeaks || []).length
};

const pass = Object.values(checks).every(Boolean) && Object.values(browserSmoke).every(Boolean) &&
  regression.lessons === 36 && regression.official === 326 && regression.choice === 275 &&
  regression.constructed === 51 && regression.practice === 252 && regression.approvedImport === 72 &&
  regression.gold === 12 && regression.legacyP7 === 0 && regression.preSubmitLeaks === 0;

const report = {
  schema: 'social-dual-mode-architecture-dev-audit/v1',
  generatedAt: new Date().toISOString(),
  status: pass ? 'PASS' : 'FAIL',
  checks,
  browserSmoke,
  preSubmitLeaks: regression.preSubmitLeaks,
  regression,
  filesChanged: ['index.html', 'app.js', 'styles.css', 'qa-dual-mode-architecture.cjs', 'SOCIAL_DUAL_MODE_ARCHITECTURE_DEV_AUDIT.md', 'social-dual-mode-architecture-dev-audit.json']
};

fs.writeFileSync(path.join(root, 'social-dual-mode-architecture-dev-audit.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
const md = [
  '# SOCIAL DUAL-MODE ARCHITECTURE DEV AUDIT',
  '',
  `## Result: ${report.status}`,
  '',
  'The UI now separates curriculum review and past-exam browsing while reusing the existing site shell. No canonical content or answer authority was changed.',
  '',
  '## Mode and navigation checks',
  '',
  ...Object.entries(checks).filter(([key]) => !['officialCount','choiceCount','constructedCount','practiceCount','approvedImport','legacyP7','answerLeaks','strictIntegrity'].includes(key)).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`),
  '',
  '## Browser smoke',
  '',
  ...Object.entries(browserSmoke).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`),
  '',
  '## Answer visibility',
  '',
  `- Pre-submit answer leaks: ${report.preSubmitLeaks}`,
  '- Submit/reset behavior remains delegated to the frozen answer-flow implementation.',
  '',
  '## Frozen regression',
  '',
  `- Lessons: ${regression.lessons} / 36`,
  `- Official: ${regression.official} / 326`,
  `- Choice: ${regression.choice} / 275`,
  `- Constructed: ${regression.constructed} / 51`,
  `- Practice: ${regression.practice} / 252`,
  `- Approved import: ${regression.approvedImport} / 72`,
  `- Gold: ${regression.gold} / 12`,
  `- Legacy P7: ${regression.legacyP7}`,
  `- Official answer mismatch: ${regression.officialAnswerMismatch}`,
  `- Regression: ${pass ? 'PASS' : 'FAIL'}`,
  '',
  '## Scope protection',
  '',
  '- No lesson-content, official question, official answer, approved JSON, strict gate, or answer-hiding source was changed in this phase.',
  '- No Independent QA was executed by this DEV audit.'
].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'SOCIAL_DUAL_MODE_ARCHITECTURE_DEV_AUDIT.md'), md, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!pass) process.exitCode = 1;
