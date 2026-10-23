const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = __dirname;
const canonicalPath = path.join(root, 'data', 'lesson-content.js');
const approvedFiles = ['A', 'B', 'C', 'D', 'E'].map(letter =>
  path.join(root, `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_${letter}.json`)
);

function loadLessonContent() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(canonicalPath, 'utf8'), context, { filename: canonicalPath });
  if (!context.window.lessonContent) throw new Error('canonical lessonContent not found');
  return context.window.lessonContent;
}

function loadApproved() {
  return approvedFiles.flatMap(file => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.editorialStatus !== 'APPROVED') throw new Error(`batch not approved: ${path.basename(file)}`);
    return data.replacements.map(item => ({ ...item, _batchFile: path.basename(file) }));
  });
}

function asOptionArray(item) {
  return ['A', 'B', 'C', 'D'].map(label => ({
    label,
    text: item.options[label],
    correct: String(item.answer).toUpperCase().split(/[,\s]+/).includes(label),
    explanation: item.optionAnalysis[label]
  }));
}

function importPractice(lesson, approved) {
  const practices = lesson.originalPractices || [];
  const index = practices.findIndex(item => item.id === approved.replacePracticeId);
  if (index < 0) throw new Error(`missing canonical practice: ${approved.replacePracticeId}`);
  const old = practices[index];
  const reasoningText = Array.isArray(approved.reasoning) ? approved.reasoning.join('；') : String(approved.reasoning || '');

  if (approved.practiceType === 'advanced') {
    practices[index] = {
      ...old,
      id: approved.replacePracticeId,
      lessonId: approved.lessonId,
      practiceType: approved.practiceType,
      editorialStatus: approved.editorialStatus,
      material: approved.material,
      prompt: approved.prompt,
      question: approved.prompt.length < 12 ? `${approved.prompt} ${approved.material}` : approved.prompt,
      options: asOptionArray(approved),
      answer: approved.answer,
      reasoning: approved.reasoning,
      optionAnalysis: approved.optionAnalysis,
      takeaway: approved.takeaway,
      explanation: {
        key: Array.isArray(approved.reasoning) ? (approved.reasoning[0] || approved.prompt) : (approved.reasoning || approved.prompt),
        reasoning: reasoningText
      }
    };
  } else if (approved.practiceType === 'constructed') {
    practices[index] = {
      ...old,
      id: approved.replacePracticeId,
      lessonId: approved.lessonId,
      practiceType: approved.practiceType,
      editorialStatus: approved.editorialStatus,
      material: approved.material,
      prompt: approved.prompt,
      question: approved.prompt,
      examReadyAnswer: approved.examReadyAnswer,
      scoringPoints: approved.scoringPoints,
      acceptableAnswers: approved.acceptableAnswers,
      commonMistakes: approved.commonMistakes,
      // Legacy renderer compatibility; all values are direct mappings from approved fields.
      answer: approved.examReadyAnswer,
      explanation: {
        full: approved.examReadyAnswer,
        keywords: approved.scoringPoints,
        acceptable: approved.acceptableAnswers.join('；'),
        commonWrong: approved.commonMistakes.join('；')
      }
    };
  } else {
    throw new Error(`unsupported practice type: ${approved.practiceType}`);
  }
}

const lessonContent = loadLessonContent();
const replacements = loadApproved();
const ids = replacements.map(item => item.replacePracticeId);
if (replacements.length !== 72) throw new Error(`expected 72 replacements, got ${replacements.length}`);
if (new Set(ids).size !== 72) throw new Error('duplicate replacement IDs');
for (const item of replacements) {
  const lesson = lessonContent[String(item.lessonId)];
  if (!lesson) throw new Error(`missing lesson ${item.lessonId}`);
  importPractice(lesson, item);
}

const gold = approvedFiles.flatMap(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (data.goldTeachingReplacements || []).map(item => ({ ...item, _batchFile: path.basename(file) }));
});
const goldByLesson = new Map();
for (const item of gold) {
  if (![26, 32, 36].includes(item.lessonId)) throw new Error(`unexpected Gold lesson ${item.lessonId}`);
  if (!goldByLesson.has(item.lessonId)) goldByLesson.set(item.lessonId, []);
  goldByLesson.get(item.lessonId).push({
    lessonId: item.lessonId,
    sectionId: item.sectionId,
    currentContent: item.currentContent,
    requiredReplacement: item.requiredReplacement,
    replacementContent: item.replacementContent,
    editorialStatus: item.editorialStatus
  });
}
for (const [lessonId, items] of goldByLesson) {
  const lesson = lessonContent[String(lessonId)];
  lesson.goldTeachingReplacements = items;
  const map = new Map(items.map(item => [item.sectionId, item.replacementContent]));
  const sectionMap = lessonId === 26
    ? new Map([
        ['洋務運動與改革深度', 0],
        ['甲午戰爭後的政治選擇', 1],
        ['戊戌變法、義和團與清末新政的時序', 1],
        ['革命派與改革／革命差異', 2]
      ])
    : lessonId === 32
      ? new Map([
          ['天氣、氣候與降雨—逕流機制', 0],
          ['Hazard、Exposure、Vulnerability 與坡地災害', 1],
          ['水文與都市淹水判讀', 1],
          ['災害風險與減災', 2]
        ])
      : new Map([
          ['GIS 圖層與空間操作', 0],
          ['Suitability 與多條件選址', 2],
          ['解析度、資料品質與尺度', 0],
          ['永續決策與總整合', 2]
        ]);
  for (const [sectionId, coreIndex] of sectionMap) {
    if (!map.has(sectionId)) throw new Error(`missing Gold section: L${lessonId} ${sectionId}`);
    lesson.core[coreIndex].what = map.get(sectionId);
  }
}

fs.writeFileSync(canonicalPath, `window.lessonContent = ${JSON.stringify(lessonContent, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({
  replacements: replacements.length,
  gold: gold.length,
  canonicalPath,
  importedIds: ids
}, null, 2));
