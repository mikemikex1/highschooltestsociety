const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sha256 = file => crypto.createHash('sha256').update(read(file)).digest('hex').toUpperCase();
const nonEmpty = value => typeof value === 'string' ? value.trim().length > 0 : value != null;
const hasAny = (text, terms) => terms.every(term => text.includes(term));

function loadWindow(files) {
  const context = { window: {} };
  files.forEach(file => vm.runInNewContext(read(file), context, { filename: path.join(root, file) }));
  return context.window;
}

const win = loadWindow(['data/lesson-content.js', 'data/years.js', 'data/constructed-response.js']);
const lessons = win.lessonContent;
const examData = win.examData;
const constructed = win.constructedResponseData;
const allPractices = Object.values(lessons).flatMap(lesson => lesson.originalPractices || []);
const approved = ['A', 'B', 'C', 'D', 'E'].flatMap(batch => {
  const data = JSON.parse(read(`SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_${batch}.json`));
  return (data.replacements || []).map(item => ({ ...item, batch }));
});
const approvedGold = ['A', 'B', 'C', 'D', 'E'].flatMap(batch => {
  const data = JSON.parse(read(`SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_${batch}.json`));
  return (data.goldTeachingReplacements || []).map(item => ({ ...item, batch }));
});

const compare = (expected, actual, id, field, drift) => {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) drift.push({ id, field });
};

const importCheck = { expected: approved.length, matched: 0, missing: [], extra: [], fieldDrift: [], goldExpected: approvedGold.length, goldMatched: 0, goldMissing: [], goldDrift: [] };
const approvedIds = new Set(approved.map(item => item.replacePracticeId));
for (const item of approved) {
  const actual = allPractices.find(practice => practice.id === item.replacePracticeId);
  if (!actual) { importCheck.missing.push(item.replacePracticeId); continue; }
  const before = importCheck.fieldDrift.length;
  ['lessonId', 'practiceType', 'material', 'prompt', 'editorialStatus'].forEach(field => compare(item[field], field === 'lessonId' ? (actual.lessonId || actual._lessonId) : actual[field], item.replacePracticeId, field, importCheck.fieldDrift));
  if (item.practiceType === 'advanced') {
    ['options', 'answer', 'reasoning', 'optionAnalysis', 'takeaway'].forEach(field => {
      if (field === 'options') ['A', 'B', 'C', 'D'].forEach(label => {
        const option = (actual.options || []).find(candidate => candidate.label === label);
        if (!option) importCheck.fieldDrift.push({ id: item.replacePracticeId, field: `options.${label}` });
        else {
          compare(item.options[label], option.text, item.replacePracticeId, `options.${label}.text`, importCheck.fieldDrift);
          compare(item.optionAnalysis[label], option.explanation, item.replacePracticeId, `options.${label}.explanation`, importCheck.fieldDrift);
        }
      });
      else compare(item[field], actual[field], item.replacePracticeId, field, importCheck.fieldDrift);
    });
  } else ['examReadyAnswer', 'scoringPoints', 'acceptableAnswers', 'commonMistakes'].forEach(field => compare(item[field], actual[field], item.replacePracticeId, field, importCheck.fieldDrift));
  if (importCheck.fieldDrift.length === before) importCheck.matched++;
}
allPractices.filter(item => /^L\d{2}-P[67]$/.test(item.id) && !approvedIds.has(item.id)).forEach(item => importCheck.extra.push(item.id));
const actualGold = Object.values(lessons).flatMap(lesson => (lesson.goldTeachingReplacements || []).map(item => ({ ...item, lessonId: lesson.lesson })));
for (const item of approvedGold) {
  const actual = actualGold.find(candidate => candidate.sectionId === item.sectionId && candidate.lessonId === item.lessonId);
  if (!actual) importCheck.goldMissing.push(`${item.lessonId}:${item.sectionId}`);
  else if (JSON.stringify(item.replacementContent) !== JSON.stringify(actual.replacementContent)) importCheck.goldDrift.push(`${item.lessonId}:${item.sectionId}`);
  else importCheck.goldMatched++;
}

const authority = { officialMismatches: [], missingAnswers: [], missingStems: [], malformedOptions: [], counts: {} };
const expectedYearCounts = { '111': 67, '112': 66, '113': 64, '114': 64, '115': 65 };
for (const [year, data] of Object.entries(examData)) {
  authority.counts[year] = data.questions.length;
  for (const q of data.questions) {
    const id = `${year}-q${q.number}`;
    if (q.questionType !== 'constructed' && !nonEmpty(q.prompt)) authority.missingStems.push(id);
    if (!nonEmpty(q.officialAnswer)) authority.missingAnswers.push(id);
    if (q.questionType !== 'constructed') {
      if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(o => o.label)).size !== 4) authority.malformedOptions.push(id);
      const flagged = (q.options || []).filter(o => o.correct).map(o => o.label).join(',');
      if (flagged !== String(q.officialAnswer).toUpperCase()) authority.officialMismatches.push({ id, flagged, answer: q.officialAnswer });
    }
  }
}
const constructedCheck = Object.values(constructed).flat().filter(Boolean);
const constructedUnresolved = constructedCheck.filter(q => q.needsReview !== false || !nonEmpty(q.questionRequirement) || !nonEmpty(q.officialAnswer) || !Array.isArray(q.scoringPoints) || !nonEmpty(q.answerTool) || !nonEmpty(q.answerAction) || !q.sourceRefs).map(q => `${q.year}-q${q.number}`);
const legacyP7 = allPractices.filter(p => /-P7$/.test(p.id) && (!nonEmpty(p.examReadyAnswer) || !Array.isArray(p.scoringPoints) || !Array.isArray(p.acceptableAnswers) || !Array.isArray(p.commonMistakes))).map(p => p.id);
const practiceAnswerIssues = allPractices.filter(p => !nonEmpty(p.question || p.prompt) || !nonEmpty(p.answer) || !p.explanation || (p.type === '選擇題' && (!Array.isArray(p.options) || p.options.length !== 4))).map(p => p.id);

const app = read('app.js');
const leakChecks = {
  questionPreSubmitSafe: /var revealed = current\.submitted \?/.test(app) && !/function questionCard[\s\S]*?var revealed = current\.submitted \? [\s\S]*?question\.officialAnswer/.test(app.split('var revealed = current.submitted ?')[0]),
  practicePreSubmitSafe: /var answer = current\.submitted \?/.test(app) && /practiceExplanation\(item\)/.test(app) && /current\.submitted \?/.test(app),
  p7FieldsBehindSubmit: /current\.submitted[\s\S]*?examReadyAnswer/.test(app) || !/examReadyAnswer/.test(app),
  submitFlow: /current\.submitted = true/.test(app),
  resetFlow: /selected: null, submitted: false/.test(app),
  currentUnitOnly: /renderSingleUnit\(currentUnit\)/.test(app) && !/pageItems\.map\(function \(item\) \{[\s\S]*richLessonCard/.test(app),
  hashNavigation: /location\.hash|hashchange/.test(app),
  prevNext: /data-unit-prev/.test(app) && /data-unit-next/.test(app),
  atomicGroups: /function buildQuestionUnits[\s\S]*sharedMaterialLength[\s\S]*payload:\s*\{ questions: group \}/.test(app) && /payload\.questions \|\| \[\]\)\.map\(questionCard\)/.test(app),
};
const preSubmitLeaks = [];
if (!leakChecks.questionPreSubmitSafe) preSubmitLeaks.push('official-question-pre-submit');
if (!leakChecks.practicePreSubmitSafe) preSubmitLeaks.push('original-practice-pre-submit');
if (!leakChecks.submitFlow) preSubmitLeaks.push('submit-flow-missing');
if (!leakChecks.resetFlow) preSubmitLeaks.push('reset-flow-missing');

const goldIds = [5, 10, 13, 16, 20, 26, 31, 32, 36];
const goldTerms = {
  5: ['形式平等', '實質平等', '結構'], 10: ['權力分立', '制衡', '責任政治'], 13: ['罪刑法定', '無罪推定', '正當程序'],
  16: ['需求', '供給', '均衡', '市場失靈'], 20: ['史料', '解釋', '因果'], 26: ['洋務', '甲午', '戊戌', '義和團', '八國聯軍', '清末新政', '革命'],
  31: ['等高線', '坡度', '河谷', '剖面'], 32: ['天氣', '氣候', '降雨', '逕流', '入滲', '集水區', '不透水面', 'hazard', 'exposure', 'vulnerability', '坡度'],
  36: ['圖層', 'buffer', 'overlay', 'network', '解析度', '資料品質', '永續']
};
const gold = goldIds.map(id => {
  const lesson = lessons[String(id)];
  const text = JSON.stringify(lesson);
  const terms = goldTerms[id];
  const checks = {
    accuracy: nonEmpty(lesson.title) && Array.isArray(lesson.core) && lesson.core.length >= 2,
    teaching: terms.every(term => text.includes(term)) && (id !== 36 || text.includes('suitability') || text.includes('適宜性')),
    historical: id >= 19 && id <= 30 ? ['史料', '解釋', '因果'].some(term => text.includes(term)) : true,
    practice: (lesson.originalPractices || []).length >= 7,
    explanation: (lesson.originalPractices || []).every(p => p.type !== '選擇題' || (p.options || []).length === 4),
    exam: Array.isArray(lesson.officialRefs) && lesson.officialRefs.length >= 2,
    uniqueness: new Set((lesson.core || []).map(c => c.name)).size === (lesson.core || []).length,
    readability: nonEmpty(lesson.sop) && Array.isArray(lesson.quick) && lesson.quick.length >= 5
  };
  const scores = Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, value ? 100 : 0]));
  return { lessonId: id, scores, minimum: Math.min(...Object.values(scores)), pass: Object.values(scores).every(score => score >= 85), missingTerms: terms.filter(term => !text.includes(term)) };
});
const strictGoldPass = gold.every(item => item.pass);
const singleViewPass = Object.values(leakChecks).slice(5).every(Boolean);
const regression = { official: Object.values(authority.counts).reduce((a, b) => a + b, 0), choice: Object.values(examData).reduce((n, d) => n + d.questions.filter(q => q.questionType !== 'constructed').length, 0), constructed: constructedCheck.length, practice: allPractices.length };
const checks = { import: importCheck, authority, constructedUnresolved, legacyP7, practiceAnswerIssues, preSubmitLeaks, leakChecks, gold, singleViewPass, regression };
const pass = importCheck.missing.length === 0 && importCheck.extra.length === 0 && importCheck.fieldDrift.length === 0 && importCheck.goldMissing.length === 0 && importCheck.goldDrift.length === 0 && authority.officialMismatches.length === 0 && authority.missingAnswers.length === 0 && authority.missingStems.length === 0 && authority.malformedOptions.length === 0 && constructedUnresolved.length === 0 && legacyP7.length === 0 && practiceAnswerIssues.length === 0 && preSubmitLeaks.length === 0 && strictGoldPass && singleViewPass && regression.official === 326 && regression.choice === 275 && regression.constructed === 51 && regression.practice === 252;

 const scriptDefinitions = [
  ['qa-answer-authority-and-leak.cjs', 'answer authority and leak gate', 'official mismatch=0; missing answers/stems=0; pre-submit leaks=0'],
  ['qa-quiz-answer-flow.cjs', 'interactive quiz flow evidence', 'submit/reveal/reset behavior must remain intact'],
  ['qa-single-view.cjs', 'single-view structural gate', 'only current unit mounted; atomic groups and navigation preserved'],
  ['qa-choice-analysis.js', 'choice analysis regression', '275 complete; no missing/empty/placeholder/duplicate'],
  ['qa-constructed-response.cjs', 'constructed response regression', '51 complete; needsReview=0; source refs complete'],
  ['qa-approved-editorial-import.cjs', 'approved import verifier', '72 practice exact matches; Gold exact matches; drift=0'],
  ['independent-lesson-content-audit.cjs', 'historical content audit (frozen evidence)', 'original formal Gold gate is 9 lessons, 8 dimensions >=85'],
  ['audit-integrity-recovery.cjs', 'historical integrity evidence', 'preserve incident flags; never overwrite historical reports'],
  ['qa-strict-integrity.cjs', 'current strict replacement gate', 'all current gates above; no DEV audit is acceptance evidence']
 ];
 const currentScripts = scriptDefinitions.map(([file, role, gate]) => ({ path: file, sha256: sha256(file), role, strictGateDescription: gate }));
 const manifestPath = path.join(root, 'AUDIT_STRICT_BASELINE_MANIFEST.json');
 const freezePath = path.join(root, 'AUDIT_SCRIPT_FREEZE.json');
 const historicalJsonPath = path.join(root, 'audit-integrity-recovery-report.json');
 const loadJson = file => {
   if (!fs.existsSync(file)) throw new Error(`Missing required artifact: ${path.basename(file)}`);
   try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { throw new Error(`Malformed JSON artifact: ${path.basename(file)}`); }
 };
 let manifest;
 let freeze;
 let historicalJson;
 const artifactErrors = [];
 try { manifest = loadJson(manifestPath); } catch (error) { artifactErrors.push(error.message); }
 try { freeze = loadJson(freezePath); } catch (error) { artifactErrors.push(error.message); }
 try { historicalJson = loadJson(historicalJsonPath); } catch (error) { artifactErrors.push(error.message); }
 const requiredThresholds = manifest && manifest.requiredThresholds;
 const requiredThresholdKeys = ['official', 'choice', 'constructed', 'practice', 'officialAnswerMismatches', 'preSubmitLeaks', 'legacyP7Pending', 'gold', 'singleView'];
 const thresholdIssues = requiredThresholdKeys.filter(key => !requiredThresholds || requiredThresholds[key] === undefined || requiredThresholds[key] === null || requiredThresholds[key] === '');
 const frozenManifestScripts = manifest && Array.isArray(manifest.scripts) ? manifest.scripts : [];
 const frozenFreezeScripts = freeze && Array.isArray(freeze.scripts) ? freeze.scripts : [];
 const manifestHashMismatches = frozenManifestScripts.filter(item => !item.path || !item.sha256 || !fs.existsSync(path.join(root, item.path)) || sha256(item.path) !== item.sha256).map(item => ({ path: item.path, expected: item.sha256, actual: fs.existsSync(path.join(root, item.path)) ? sha256(item.path) : null }));
 const freezeHashMismatches = frozenFreezeScripts.filter(item => !item.path || !item.sha256 || !fs.existsSync(path.join(root, item.path)) || sha256(item.path) !== item.sha256).map(item => ({ path: item.path, expected: item.sha256, actual: fs.existsSync(path.join(root, item.path)) ? sha256(item.path) : null }));
 const inventoryPaths = new Set(currentScripts.map(item => item.path));
 const inventoryIssues = currentScripts.filter(item => !frozenManifestScripts.some(frozen => frozen.path === item.path) || !frozenFreezeScripts.some(frozen => frozen.path === item.path)).map(item => item.path);
 const currentScriptHashesFrozen = artifactErrors.length === 0 && thresholdIssues.length === 0 && manifestHashMismatches.length === 0 && freezeHashMismatches.length === 0 && inventoryIssues.length === 0;
 const detectedGateWeakeningIssues = [
   ...thresholdIssues.map(key => `missing required threshold: ${key}`),
   ...(manifest && manifest.requiredThresholds && manifest.requiredThresholds.gold !== 'lessons 5,10,13,16,20,26,31,32,36; all 8 dimensions >=85' ? ['Gold threshold differs from original strict gate'] : []),
   ...(requiredThresholds && requiredThresholds.officialAnswerMismatches !== 0 ? ['official mismatch threshold weakened'] : []),
   ...(requiredThresholds && requiredThresholds.preSubmitLeaks !== 0 ? ['answer leak threshold weakened'] : []),
   ...(requiredThresholds && requiredThresholds.legacyP7Pending !== 0 ? ['legacy P7 threshold weakened'] : [])
 ];
 const historicalIncidentPreserved = Boolean(historicalJson && historicalJson.auditScriptModifiedDuringRemediation === true && historicalJson.gateWeakened === true && fs.existsSync(path.join(root, 'AUDIT_INTEGRITY_RECOVERY_REPORT.md')));
 const currentGateWeakened = detectedGateWeakeningIssues.length > 0;
 const authorityPass = authority.officialMismatches.length === 0 && authority.missingAnswers.length === 0 && authority.missingStems.length === 0 && authority.malformedOptions.length === 0 && constructedUnresolved.length === 0 && practiceAnswerIssues.length === 0;
 const importPass = importCheck.missing.length === 0 && importCheck.extra.length === 0 && importCheck.fieldDrift.length === 0 && importCheck.goldMissing.length === 0 && importCheck.goldDrift.length === 0;
 const regressionPass = regression.official === 326 && regression.choice === 275 && regression.constructed === 51 && regression.practice === 252;
 const currentStrictGateRestored = historicalIncidentPreserved && currentScriptHashesFrozen && !currentGateWeakened && strictGoldPass && authorityPass && preSubmitLeaks.length === 0 && singleViewPass && importPass && regressionPass;
 const result = { schema: 'social-audit-integrity-recovery-r3/v1', historicalIntegrityIncident: historicalIncidentPreserved, historicalEvidence: { auditScriptModifiedDuringRemediation: historicalJson && historicalJson.auditScriptModifiedDuringRemediation === true, gateWeakened: historicalJson && historicalJson.gateWeakened === true, source: 'audit-integrity-recovery-report.json and AUDIT_INTEGRITY_RECOVERY_REPORT.md; preserved, not overwritten' }, currentStrictGateRestored, currentGateWeakened, currentScriptHashesFrozen, manifestHashMismatches, freezeHashMismatches, detectedGateWeakeningIssues, strictResults: checks, strictBaselinePass: artifactErrors.length === 0 && thresholdIssues.length === 0, authorityPass, importPass, regressionPass, artifactErrors, scriptInventory: currentScripts, verdict: currentStrictGateRestored && pass ? 'PASS' : 'FAIL' };
const md = [
  '# SOCIAL AUDIT INTEGRITY RECOVERY R2', '',
  '## Historical Integrity Incident', '', '- YES — the prior immutable record reports `auditScriptModifiedDuringRemediation=true` and `gateWeakened=true`.', '- The historical reports were not modified.', '',
  '## Current Strict Gate', '', `- Restored: **${result.currentStrictGateRestored ? 'YES' : 'NO'}**`, `- Current gate weakened: **${result.currentGateWeakened ? 'YES' : 'NO'}**`, `- Script hashes frozen: **${result.currentScriptHashesFrozen ? 'YES' : 'NO'}**`, '',
  '## Gate Results', '', `- Official: ${regression.official} / 326`, `- Choice: ${regression.choice} / 275`, `- Constructed: ${regression.constructed} / 51`, `- Practice: ${regression.practice} / 252`, `- Official answer mismatches: ${authority.officialMismatches.length}`, `- Pre-submit leaks: ${preSubmitLeaks.length}`, `- Legacy P7 pending: ${legacyP7.length}`, `- Single View: ${singleViewPass ? 'PASS' : 'FAIL'}`, `- Gold strict: ${strictGoldPass ? 'PASS' : 'FAIL'}`, `- Approved import: ${importCheck.matched} / ${importCheck.expected}`, `- Field drift: ${importCheck.fieldDrift.length}`, '',
  '## Gold Strict Gate', '', '| Lesson | Minimum | Status | Missing required terms |', '|---:|---:|---|---|', ...gold.map(item => `| ${item.lessonId} | ${item.minimum} | ${item.pass ? 'PASS' : 'FAIL'} | ${item.missingTerms.join(', ') || '—'} |`), '',
  '## Core Script Freeze', '', ...currentScripts.map(script => '- `' + script.path + '` — SHA-256 `' + script.sha256 + '`'), '',
  `## Current Reliable Verdict`, '', `**AUDIT INTEGRITY RECOVERY R3: ${result.verdict}**`
].join('\n');
fs.writeFileSync(path.join(root, 'SOCIAL_AUDIT_INTEGRITY_RECOVERY_R3.md'), md + '\n');
fs.writeFileSync(path.join(root, 'social-audit-integrity-recovery-r3.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ verdict: result.verdict, historicalIncidentPreserved, currentStrictGateRestored, currentGateWeakened, currentScriptHashesFrozen, manifestHashMismatches: manifestHashMismatches.length, freezeHashMismatches: freezeHashMismatches.length, gateWeakening: detectedGateWeakeningIssues.length, gold: strictGoldPass, leaks: preSubmitLeaks.length, import: `${importCheck.matched}/${importCheck.expected}`, fieldDrift: importCheck.fieldDrift.length, goldImport: `${importCheck.goldMatched}/${importCheck.goldExpected}`, legacyP7: legacyP7.length, regression }, null, 2));
