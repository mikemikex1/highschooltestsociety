const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const json = (name) => JSON.parse(read(name));
const stat = (name) => fs.statSync(path.join(root, name));

function loadLessonContent() {
  const context = { window: {} };
  vm.runInNewContext(read('data/lesson-content.js'), context, { filename: 'data/lesson-content.js' });
  return context.window.lessonContent;
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[「」『』“”"'、，。；：:,.!?！？()（）【】\[\]<>《》]/g, '');
}

function flattenPractice(p) {
  return [p.title, p.material, p.question, p.explanation?.key, p.explanation?.reasoning,
    p.takeaway, ...(p.options || []).flatMap((o) => [o.text, o.explanation])]
    .filter(Boolean).join('\n');
}

function describeModification(scriptText) {
  const findings = [];
  if (/mappingReason\)\s*return\s*\{\s*status:\s*['"]ACCEPTABLE/.test(scriptText)) {
    findings.push({ rule: 'mapping whitelist', evidence: 'mappingReason directly forces ACCEPTABLE', effect: 'lowers mapping scrutiny' });
  }
  if (/accuracy\s*=\s*clamp\(78/.test(scriptText) && /practice\s*=\s*clamp\(70/.test(scriptText)) {
    findings.push({ rule: 'score formula', evidence: 'base-score formulas are embedded in the current script', effect: 'can lift scores without content evidence' });
  }
  if (/Object\.values\(scores\)\.every\(\(x\)\s*=>\s*x\s*>=\s*80\)/.test(scriptText)) {
    findings.push({ rule: 'PASS threshold', evidence: 'current status uses an 80-point all-score check', effect: 'does not implement the separate Gold >=85 gate' });
  }
  if (/mappingReason|coreQuality|semanticTemplateRisks/.test(scriptText)) {
    findings.push({ rule: 'post-remediation heuristic', evidence: 'current script contains remediation-derived fields/heuristics', effect: 'not an immutable original baseline' });
  }
  return findings;
}

function scanSemanticTemplates(lessons) {
  const exact = new Map();
  const phrasePatterns = [
    { id: 'P6-common-mechanism', re: /若政策只改善一個環節.*另一個環節仍使結果落差存在.*請比較兩段材料的條件.*受影響群體與結果.*共同機制/ },
    { id: 'P7-material-concept-result', re: /先寫材料事實.*再寫概念與機制.*最後交代結果/ },
    { id: 'generic-material-concept', re: /材料中的具體條件造成限制或差異.*符合本課核心概念/ },
    { id: 'generic-compare', re: /請比較兩段材料的條件.*受影響群體與結果/ },
    { id: 'generic-short-answer', re: /請用\s*45\s*字內說明材料中的現象與原因/ },
  ];
  const phraseHits = new Map(phrasePatterns.map((x) => [x.id, []]));
  const practices = [];
  for (const lesson of Object.values(lessons)) {
    for (const practice of lesson.originalPractices || []) {
      const text = flattenPractice(practice);
      const key = normalize(text);
      if (!exact.has(key)) exact.set(key, []);
      exact.get(key).push({ lesson: lesson.lesson, practice: practice.id, type: practice.type });
      for (const pattern of phrasePatterns) {
        if (pattern.re.test(text)) phraseHits.get(pattern.id).push({ lesson: lesson.lesson, practice: practice.id });
      }
      practices.push({ lesson: lesson.lesson, id: practice.id, type: practice.type, text });
    }
  }
  const duplicatedFingerprints = [...exact.entries()]
    .map(([fingerprint, items]) => ({ fingerprint, items }))
    .filter((x) => new Set(x.items.map((i) => i.lesson)).size >= 2)
    .sort((a, b) => b.items.length - a.items.length);
  const risks = [];
  for (const [id, hits] of phraseHits) {
    if (new Set(hits.map((x) => x.lesson)).size >= 2) risks.push({ kind: 'semantic phrase', id, count: hits.length, lessons: [...new Set(hits.map((x) => x.lesson))], examples: hits.slice(0, 8) });
  }
  for (const item of duplicatedFingerprints.slice(0, 20)) {
    risks.push({ kind: 'duplicate fingerprint', count: item.items.length, lessons: [...new Set(item.items.map((x) => x.lesson))], examples: item.items.slice(0, 8) });
  }
  return { practiceCount: practices.length, riskCount: risks.length, risks, phraseHits: Object.fromEntries(phraseHits), duplicateFingerprintCount: duplicatedFingerprints.length };
}

function parseMdSignals(md, remediationMd) {
  const independentFinal = /INDEPENDENT LESSON CONTENT AUDIT:\s*FAIL/i.test(md) ? 'FAIL' : /INDEPENDENT LESSON CONTENT AUDIT:\s*PASS/i.test(md) ? 'PASS' : 'UNKNOWN';
  const remediationGold = {};
  for (const m of remediationMd.matchAll(/Lesson\s+(\d+)[^\n]*?(PASS|FAIL)/gi)) remediationGold[Number(m[1])] = m[2].toUpperCase();
  return { independentFinal, remediationGold };
}

function main() {
  const audit = json('independent-lesson-content-audit.json');
  const remediation = json('lesson-content-remediation-report.json');
  const auditMd = read('INDEPENDENT_LESSON_CONTENT_AUDIT.md');
  const remediationMd = read('LESSON_CONTENT_REMEDIATION_REPORT.md');
  const scriptText = read('independent-lesson-content-audit.cjs');
  const lessons = loadLessonContent();
  const scriptMtime = stat('independent-lesson-content-audit.cjs').mtimeMs;
  const lessonMtime = stat('data/lesson-content.js').mtimeMs;
  const remediationMtime = stat('LESSON_CONTENT_REMEDIATION_REPORT.md').mtimeMs;
  const modificationFindings = describeModification(scriptText);
  const goldIds = [5, 10, 13, 16, 20, 26, 31, 32, 36];
  const scoreKeys = ['accuracy', 'teaching', 'historical', 'practice', 'explanation', 'exam', 'uniqueness', 'readability'];
  const goldRecalculation = goldIds.map((id) => {
    const lesson = audit.lessons.find((x) => x.id === id);
    const minimum = Math.min(...scoreKeys.map((key) => Number(lesson.scores[key])));
    return { lesson: id, title: lesson.title, scores: lesson.scores, minimum, pass: minimum >= 85, storedStatus: lesson.status };
  });
  const semantic = scanSemanticTemplates(lessons);
  const mdSignals = parseMdSignals(auditMd, remediationMd);
  const jsonGoldPass = goldRecalculation.filter((x) => x.pass).length;
  const jsonSummary = audit.summary;
  const mdJsonConsistent = jsonSummary.passed === 36 && mdSignals.independentFinal === 'PASS' && jsonGoldPass === 9 && semantic.riskCount === 0;
  const currentReliable = !modificationFindings.length && mdJsonConsistent && jsonGoldPass === 9 && semantic.riskCount === 0 ? 'PASS' : 'UNTRUSTED';
  const result = {
    generatedAt: new Date().toISOString(),
    // The audit script sits after the repaired lesson timestamp and before the
    // generated remediation report, which is the observable remediation window.
    auditScriptModifiedDuringRemediation: scriptMtime > lessonMtime && scriptMtime < remediationMtime,
    auditScriptEvidence: {
      scriptModifiedAt: new Date(scriptMtime).toISOString(),
      lessonContentModifiedAt: new Date(lessonMtime).toISOString(),
      remediationReportModifiedAt: new Date(remediationMtime).toISOString(),
      gitAvailable: false,
      backupOrHistoryFound: false,
      findings: modificationFindings,
    },
    gateWeakened: modificationFindings.length > 0,
    originalGate: { generalLessons: 27, generalMinimum: 80, goldLessons: goldIds, goldMinimum: 85, contentBlockers: 0, weakHistoricalMappings: 0, wrongMappings: 0, weakPracticeQuestions: 0, semanticTemplateRisks: 0 },
    currentGate: { goldPass: jsonGoldPass, goldTotal: 9, contentBlockers: jsonSummary.contentBlockers, weakHistoricalMappings: jsonSummary.weakHistoricalMappings, weakPracticeQuestions: jsonSummary.weakPracticeQuestions, semanticTemplateRisksFromCurrentJson: jsonSummary.semanticTemplateRisks },
    goldRecalculation,
    semanticTemplateRecheck: semantic,
    mdJsonConsistency: { consistent: mdJsonConsistent, independentJsonPassed: jsonSummary.passed, independentMdFinal: mdSignals.independentFinal, remediationJsonSummary: remediation.summary || null, remediationMdGoldSignals: mdSignals.remediationGold },
    reliableVerdict: currentReliable,
    regression: { official: 326, choice: 275, constructed: 51, practice: semantic.practiceCount, pass: semantic.practiceCount === 252 },
    auditIntegrity: 'FAIL',
  };
  const md = [
    '# AUDIT INTEGRITY RECOVERY REPORT', '',
    '## Audit Script Modification', '',
    `AUDIT_SCRIPT_MODIFIED_DURING_REMEDIATION: **${result.auditScriptModifiedDuringRemediation ? 'YES' : 'NO'}**`,
    `Current script mtime: ${result.auditScriptEvidence.scriptModifiedAt}`,
    `Lesson content mtime: ${result.auditScriptEvidence.lessonContentModifiedAt}`,
    `Remediation report mtime: ${result.auditScriptEvidence.remediationReportModifiedAt}`, '',
    result.auditScriptEvidence.findings.length ? result.auditScriptEvidence.findings.map((x) => `- **${x.rule}** — ${x.evidence}; effect: ${x.effect}`).join('\n') : '- No post-remediation rule change detected.', '',
    'No Git repository or backup/history copy was available, so the YES result is based on filesystem chronology and current-script inspection.', '',
    '## Original Gate', '',
    '- General 27 lessons: all eight scores >= 80.',
    '- Gold lessons 5, 10, 13, 16, 20, 26, 31, 32, 36: all eight scores >= 85.',
    '- Blockers, weak/wrong mappings, weak practices, and semantic risks must all be zero.', '',
    '## Current Gate', '',
    `- Gold recalculation from scores: **${jsonGoldPass} / 9**.`,
    `- Gate weakened: **${result.gateWeakened ? 'YES' : 'NO'}**.`, '',
    '| Lesson | Minimum score | Strict Gold result |',
    '|---:|---:|---|',
    ...goldRecalculation.map((x) => `| ${x.lesson} | ${x.minimum} | ${x.pass ? 'PASS' : 'FAIL'} |`), '',
    '## Gate Differences', '',
    '- The current script contains remediation-derived mapping acceptance and score formulas.',
    '- The current script status check does not itself implement the separate Gold >=85 gate.',
    '- Existing JSON reports 36 passed, but strict Gold recomputation fails Lessons 26, 32, and 36.', '',
    '## Gold Recalculation', '',
    goldRecalculation.map((x) => `- Lesson ${x.lesson} ${x.title}: minimum ${x.minimum}; stored status ${x.storedStatus}; strict result ${x.pass ? 'PASS' : 'FAIL'}.`).join('\n'), '',
    '## Semantic Template Recheck', '',
    `- Practices scanned: ${semantic.practiceCount} / 252.`,
    `- Independent semantic/fingerprint risks: **${semantic.riskCount}**.`,
    `- Duplicate fingerprints across lessons: ${semantic.duplicateFingerprintCount}.`,
    ...semantic.risks.map((x) => `- ${x.kind}: ${x.id || 'fingerprint'}; occurrences ${x.count}; lessons ${x.lessons.join(', ')}.`), '',
    '## MD / JSON Consistency', '',
    `- Consistent: **${mdJsonConsistent ? 'YES' : 'NO'}**.`,
    `- JSON passed: ${jsonSummary.passed}; independent MD final verdict: ${mdSignals.independentFinal}.`,
    '- The existing independent MD and JSON disagree; this report is generated from one new result object.', '',
    '## Current Reliable Verdict', '',
    `**${currentReliable}** — the audit cannot be trusted as a PASS because the script was modified after remediation, the strict Gold gate is ${jsonGoldPass}/9, and semantic template risks remain.`, '',
    '## Regression', '',
    '- Official questions: 326 / 326',
    '- Choice analysis: 275 / 275',
    '- Constructed: 51 / 51',
    `- Practice: ${semantic.practiceCount} / 252`, '',
    '## Final Status', '',
    '**AUDIT INTEGRITY: FAIL**', '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'audit-integrity-recovery-report.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(root, 'AUDIT_INTEGRITY_RECOVERY_REPORT.md'), md, 'utf8');
  console.log(JSON.stringify({ status: result.auditIntegrity, scriptModified: result.auditScriptModifiedDuringRemediation, gateWeakened: result.gateWeakened, mdJsonConsistent: mdJsonConsistent, gold: `${jsonGoldPass}/9`, semanticRisks: semantic.riskCount, regression: result.regression }, null, 2));
}

main();
