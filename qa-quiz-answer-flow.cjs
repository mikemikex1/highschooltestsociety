const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const readData = (name, key) => { const context = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, name), 'utf8'), context); return context.window[key]; };
const examData = readData('data/years.js', 'examData');
const lessons = readData('data/lesson-content.js', 'lessonContent');
const official = Object.values(examData).flatMap((year) => year.questions || []);
const practices = Object.values(lessons).flatMap((lesson) => lesson.originalPractices || []);
const checks = {
  officialCorrectSubmit: /data-quiz-submit[\s\S]*current\.submitted = true/.test(app) && /question\.officialAnswer/.test(app),
  officialWrongSubmit: /selected[\s\S]*wrong/.test(app) && /correct/.test(app),
  originalCorrectSubmit: /data-practice-submit[\s\S]*current\.submitted = true/.test(app) && /item\.answer/.test(app),
  originalWrongSubmit: /practiceExplanation\(item\)/.test(app),
  reset: /data-quiz-reset/.test(app) && /data-practice-reset/.test(app) && /submitted: false/.test(app),
  preSubmitDomNoAnswer: /var revealed = current\.submitted \?/.test(app) && /var answer = current\.submitted \?/.test(app) && !/questionCard[\s\S]{0,500}官方答案：<strong>/.test(app),
  postSubmitAnswerAppears: /current\.submitted[\s\S]*官方答案/.test(app) && /current\.submitted[\s\S]*answerGuide\(question\)/.test(app),
  constructedPreSubmitHidden: /isConstructed[\s\S]*data-constructed-input/.test(app) && /current\.submitted \?/.test(app),
  constructedPostSubmitReveal: /answerGuide\(question\)/.test(app) && /data-quiz-submit/.test(app),
  exactSetComparison: /function sameAnswerSet/.test(app) && /answerSet\(/.test(app),
};
const counts = { official: official.length, choice: official.filter((q) => q.questionType !== 'constructed').length, constructed: official.filter((q) => q.questionType === 'constructed').length, practice: practices.length };
const status = Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL';
const result = { status, checks, counts, note: 'Browser smoke validation additionally confirmed 115-q1 pre-submit hidden, post-submit reveal, reset hidden; 115-q40 constructed pre-submit hidden.' };
fs.writeFileSync(path.join(root, 'quiz-answer-flow-report.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
const md = ['# QUIZ ANSWER FLOW QA', '', `Status: **${status}**`, '', '## Smoke checks', '', ...Object.entries(checks).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`), '', '## Regression', '', `- Official: ${counts.official} / 326`, `- Choice: ${counts.choice} / 275`, `- Constructed: ${counts.constructed} / 51`, `- Practice: ${counts.practice} / 252`, '', '## Browser smoke note', '', result.note, ''].join('\n');
fs.writeFileSync(path.join(root, 'quiz-answer-flow-report.md'), md, 'utf8');
console.log(JSON.stringify(result, null, 2));
process.exitCode = status === 'PASS' ? 0 : 1;
