var examData = window.examData;
var curriculum = window.curriculum;
var lessonContent = window.lessonContent || {};
var socialSupplement = window.socialSupplement || { items: [], historyCompleteness: {}, visuals: {} };

var app = document.querySelector('#app');
var modeTabs = document.querySelector('#modeTabs');
var state = { mode: 'curriculum', year: '115', subject: 'all', type: 'all', query: '', unreadOnly: false, page: 1, curriculumPhase: '解題底層', curriculumPage: 1, examQuestion: 1, examGroup: null, supplementQuery: '', supplementCategory: 'all' };
var questionState = Object.create(null);
var practiceState = Object.create(null);
var singleView = { lesson: 1, unit: 0, menuOpen: false };
var pageSize = 10;
var curriculumPageSize = 8;
var savedTheme = localStorage.getItem('social-theme');
var currentTheme = savedTheme === 'dark' ? 'dark' : 'light';

function applyTheme(theme) {
  currentTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = currentTheme;
  var toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', currentTheme === 'dark' ? 'true' : 'false');
  toggle.textContent = currentTheme === 'dark' ? '☀ 淺色模式' : '☾ 深色模式';
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}
function list(items) {
  var values = Array.isArray(items) ? items : (items ? [items] : []);
  return values.length ? '<ul>' + values.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>' : '<p class="muted">本課沒有另列清單。</p>';
}
function textBlock(value) {
  return value ? '<p class="course-text">' + esc(value).replace(/\r?\n/g, '<br>') + '</p>' : '<p class="muted">本課沒有另列內容。</p>';
}
function courseBox(title, content) {
  return '<div class="lesson-detail-box"><h5>' + esc(title) + '</h5>' + content + '</div>';
}
function getState(store, id) {
  if (!store[id]) store[id] = { selected: null, submitted: false };
  return store[id];
}
function answerSet(value) {
  return String(value == null ? '' : value).split(/[,，、\s]+/).filter(Boolean).map(function (item) { return item.toUpperCase(); }).sort();
}
function sameAnswerSet(left, right) {
  var a = answerSet(left); var b = answerSet(right);
  return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
}
function isMultiAnswer(value) { return answerSet(value).length > 1; }
function hasSelection(value) { return Array.isArray(value) ? value.length > 0 : Boolean(String(value == null ? '' : value).trim()); }
function selectionHas(value, label) { return Array.isArray(value) ? value.indexOf(label) >= 0 : value === label; }
function toggleSelection(current, label, multiple) {
  if (!multiple) { current.selected = label; return; }
  var values = Array.isArray(current.selected) ? current.selected.slice() : [];
  var index = values.indexOf(label);
  if (index >= 0) values.splice(index, 1); else values.push(label);
  current.selected = values.sort();
}
function practiceExplanation(item) {
  if (!item.explanation) return '';
  return item.explanation.full ? '<p><strong>滿分示範：</strong>' + esc(item.explanation.full) + '</p><p><strong>採分關鍵詞：</strong>' + esc((item.explanation.keywords || []).join('、')) + '</p><p><strong>可接受寫法：</strong>' + esc(item.explanation.acceptable) + '</p><p><strong>常見失分：</strong>' + esc(item.explanation.commonWrong) + '</p>' : '<p><strong>題幹關鍵：</strong>' + esc(item.explanation.key) + '</p><p><strong>推理：</strong>' + esc(item.explanation.reasoning) + '</p>';
}
function originalPracticeOptions(item, current) {
  if (!item.options || !item.options.length) return '';
  var submitted = current.submitted;
  return '<div class="options">' + item.options.map(function (option) {
    var selected = selectionHas(current.selected, option.label);
    var correct = answerSet(item.answer).indexOf(String(option.label).toUpperCase()) >= 0;
    var className = 'option quiz-option' + (selected && !submitted ? ' selected' : '');
    var mark = '';
    var feedback = '';
    if (submitted) {
      className += correct ? ' correct' : (selected ? ' wrong' : '');
      mark = correct ? '✅ ' : (selected ? '❌ ' : '');
      feedback = '<small>' + esc(option.explanation) + '</small>';
    }
    return '<button type="button" class="' + className + '" data-practice-option="' + esc(item.id) + '" data-option="' + esc(option.label) + '" data-multiple="' + (isMultiAnswer(item.answer) ? 'true' : 'false') + '"' + (submitted ? ' disabled' : '') + '><span class="option-badge">' + mark + esc(option.label) + '</span><span class="option-text">' + esc(option.text) + '</span>' + feedback + '</button>';
  }).join('') + '</div>';
}
function originalPracticeCard(item, index) {
  var id = item.id || ('practice-' + index);
  var current = getState(practiceState, id);
  var isChoice = Boolean(item.options && item.options.length);
  var answer = current.submitted ? '<details class="practice-reference-answer" open><summary>顯示／收合參考答案與解析</summary><div class="quiz-feedback answer-box"><p><strong>' + (sameAnswerSet(item.answer, current.selected) ? '✅ 作答正確' : '❌ 作答結果') + '</strong>｜官方答案：' + esc(item.answer) + '</p>' + practiceExplanation(item) + '<p><strong>本題帶走：</strong>' + esc(item.takeaway) + '</p></div></details>' : '';
  var constructedInput = !isChoice ? '<label class="constructed-input"><span>作答區</span><textarea data-practice-input="' + esc(id) + '" rows="4" placeholder="完成作答後按「確認作答」">' + esc(current.selected || '') + '</textarea></label>' : '';
  var action = '<div class="quiz-actions"><button type="button" class="button" data-practice-submit="' + esc(id) + '"' + ((!isChoice && !hasSelection(current.selected)) || (isChoice && !hasSelection(current.selected)) || current.submitted ? ' disabled' : '') + '>' + (isChoice ? '確認答案' : '確認作答') + '</button>' + (current.submitted ? '<button type="button" class="button secondary" data-practice-reset="' + esc(id) + '">重新作答</button>' : '') + '</div>';
  return '<article class="original-question" id="' + esc(id) + '"><div class="exam-kicker">原創練習 ' + (index + 1) + '｜' + esc(item.type) + '</div><h4>' + esc(item.title) + '</h4><p class="material">' + esc(item.material) + '</p><p><strong>問題：</strong>' + esc(item.question) + '</p>' + originalPracticeOptions(item, current) + constructedInput + action + answer + '</article>';
}
function richLessonCard(item, spec) {
  var official = (spec.officialRefs || []).map(function (ref) {
    var yearData = examData[String(ref[0])];
    var q = yearData && yearData.questions.find(function (question) { return question.number === ref[1]; });
    return q ? questionCard(q) : '<p class="muted">找不到 canonical 題目 ' + ref[0] + '-q' + ref[1] + '。</p>';
  }).join('');
  var constructed = (spec.constructedRefs || []).map(function (ref) {
    var yearData = examData[String(ref[0])];
    var q = yearData && yearData.questions.find(function (question) { return question.number === ref[1]; });
    return q ? questionCard(q) : '';
  }).join('');
  var cores = spec.core.map(function (core, index) {
    return '<section class="rich-section beginner-core"><h4>' + (index + 1) + '. ' + esc(core.name) + '</h4><div class="beginner-grid"><div><strong>生活例子</strong><p>' + esc(core.example) + '</p></div><div><strong>白話解釋</strong><p>' + esc(core.what) + '</p></div><div><strong>正式名詞</strong><p>' + esc(core.name) + '</p></div><div><strong>學測怎麼考</strong><p>' + esc(core.packaging) + '</p></div><div><strong>判斷線索</strong><p>' + esc(core.judge) + '</p></div><div><strong>常見錯誤</strong><p>' + esc(core.mistake) + '</p></div></div></section>';
  }).join('');
  var comparisons = spec.comparisons && spec.comparisons.length ? renderComparison(spec.comparisons) : '';
  return '<article class="lesson lesson-rich" id="lesson-' + item.lesson + '">' +
    '<div class="lesson-head"><div><span class="unit">第 ' + item.lesson + ' 課｜' + esc(spec.phase) + '</span><h2>' + esc(spec.title) + '</h2></div><label class="done"><input type="checkbox" data-complete="' + item.lesson + '"> 標記已學</label></div>' +
    '<section class="rich-section lesson-summary"><h3>30 秒先懂</h3>' + list(spec.summary) + '</section>' +
    '<section class="rich-section"><h3>核心能力與概念</h3>' + cores + '</section>' +
    (comparisons ? '<section class="rich-section"><h3>必要概念比較</h3>' + comparisons + '</section>' : '') +
    '<section class="rich-section"><h3>歷屆真題精講（canonical 題庫）</h3><p class="muted">以下題目直接引用封版題庫，不在課程資料中複製另一份答案。</p>' + official + '</section>' +
    (constructed ? '<section class="rich-section constructed-guide"><h3>非選整合（canonical 評分資料）</h3>' + constructed + '</section>' : '') +
    '<section class="rich-section"><h3>易錯陷阱</h3>' + list(spec.traps) + '</section>' +
    '<section class="rich-section"><h3>原創練習（共 ' + spec.originalPractices.length + ' 題）</h3>' + spec.originalPractices.map(originalPracticeCard).join('') + '</section>' +
    '<section class="rich-section"><h3>考場 SOP</h3><p class="exam-sop">' + esc(spec.sop) + '</p></section>' +
    '<section class="rich-section quick-review"><h3>考前一頁</h3>' + list(spec.quick) + '</section>' +
    '</article>';
}
function lessonDetails(item) {
  return '<details class="lesson-details"><summary>展開完整課程內容</summary>' +
    '<div class="lesson-detail-grid">' +
      courseBox('本課定位', textBlock(item.understand)) +
      courseBox('老師實際講解', textBlock(item.lecture)) +
      courseBox('這些一定要會', list(item.keyPoints.length ? item.keyPoints : item.remember)) +
      courseBox('解題流程', list(item.method)) +
    '</div>' +
    '<div class="lesson-practice"><h5>歷屆例題（官方題）</h5>' + textBlock(item.example) + '<h5>例題詳解</h5>' + textBlock(item.explanation) + '</div>' +
    '<div class="lesson-detail-grid">' +
      courseBox('課堂練習（原創）', textBlock(item.practice)) +
      courseBox('練習答案與解析', textBlock(item.practiceAnswers)) +
    '</div>' +
    '<div class="lesson-practice"><h5>考前 30 秒速記</h5>' + list(item.lastMinute) + '<h5>網站內容標記</h5>' + list(item.sourceNotes) + '</div>' +
  '</details>';
}
function typeLabel(type) {
  return ({ single: '單選', 'mixed-choice': '混合單選', constructed: '非選' }[type] || type);
}
function lessonSpec(lessonNumber) {
  return lessonContent[lessonNumber] || lessonContent[String(lessonNumber)] || null;
}
function canonicalQuestion(ref) {
  var yearData = examData[String(ref[0])];
  return yearData && yearData.questions.find(function (question) { return question.number === ref[1]; });
}
function sharedMaterialLength(left, right) {
  var a = String(left && left.prompt || '');
  var b = String(right && right.prompt || '');
  var limit = Math.min(a.length, b.length);
  var index = 0;
  while (index < limit && a.charAt(index) === b.charAt(index)) index += 1;
  return index;
}
function buildQuestionUnits(refs, kind) {
  var questions = (refs || []).map(canonicalQuestion).filter(Boolean);
  var units = [];
  var i = 0;
  while (i < questions.length) {
    var group = [questions[i]];
    while (i + group.length < questions.length && sharedMaterialLength(group[group.length - 1], questions[i + group.length]) >= 80) {
      group.push(questions[i + group.length]);
    }
    units.push({ id: kind + '-' + group[0].year + '-q' + group[0].number, type: kind, title: group.length > 1 ? '題組：' + group[0].year + ' 年第 ' + group[0].number + '–' + group[group.length - 1].number + ' 題' : group[0].year + ' 年第 ' + group[0].number + ' 題', payload: { questions: group } });
    i += group.length;
  }
  return units;
}
function buildLessonUnits(lessonNumber) {
  var spec = lessonSpec(lessonNumber);
  if (!spec) return [];
  var units = [{ id: 'intro', type: 'intro', title: '30 秒先懂', payload: { summary: spec.summary || [] } }];
  (spec.core || []).forEach(function (core, index) { units.push({ id: 'core-' + (index + 1), type: 'core', title: core.name || ('核心觀念 ' + (index + 1)), payload: core }); });
  if (spec.comparisons && spec.comparisons.length) units.push({ id: 'comparisons', type: 'method', title: '必要概念比較', payload: { comparisons: spec.comparisons } });
  units = units.concat(buildQuestionUnits(spec.officialRefs, 'historicalQuestion'));
  units = units.concat(buildQuestionUnits(spec.constructedRefs, 'constructedPractice'));
  (spec.originalPractices || []).forEach(function (practice, index) {
    units.push({ id: practice.id || 'practice-' + (index + 1), type: practice.options && practice.options.length ? 'originalPractice' : 'constructedPractice', title: practice.title || ('原創練習 ' + (index + 1)), payload: { practice: practice, index: index } });
  });
  units.push({ id: 'traps', type: 'method', title: '易錯陷阱', payload: { heading: '這課最容易失分的地方', items: spec.traps || [] } });
  units.push({ id: 'sop', type: 'method', title: '考場 SOP', payload: { heading: '考場第一步做什麼？', text: spec.sop || '' } });
  units.push({ id: 'final-review', type: 'finalReview', title: '考前一頁', payload: { items: spec.quick || [] } });
  return units;
}
function buildExamUnits(year) {
  var data = examData[String(year)];
  if (!data) return [];
  return buildQuestionUnits(data.questions.map(function (question) { return [String(year), question.number]; }), 'exam');
}
function findLessonRefs(question) {
  return curriculum.filter(function (item) {
    var spec = lessonSpec(item.lesson) || {};
    return (spec.officialRefs || []).some(function (ref) { return Number(ref[0]) === Number(question.year) && Number(ref[1]) === Number(question.number); }) ||
      (spec.constructedRefs || []).some(function (ref) { return Number(ref[0]) === Number(question.year) && Number(ref[1]) === Number(question.number); });
  });
}
function examUnitForState() {
  var units = buildExamUnits(state.year);
  var index = state.examGroup == null ? -1 : Number(state.examGroup);
  if (index < 0 || index >= units.length || !units[index].payload.questions.some(function (question) { return question.number === Number(state.examQuestion); })) {
    index = units.findIndex(function (unit) { return unit.payload.questions.some(function (question) { return question.number === Number(state.examQuestion); }); });
  }
  if (index < 0) index = 0;
  state.examGroup = index;
  return { units: units, index: index, unit: units[index] || { payload: { questions: [] } } };
}
function renderComparison(rows) {
  return '<div class="comparison-cards" aria-label="概念比較卡片">' + rows.map(function (row) {
    return '<article class="comparison-card"><div class="comparison-card-grid"><div class="comparison-card-side"><span class="comparison-label">概念 A</span><h4>' + esc(row.left) + '</h4></div><div class="comparison-card-side"><span class="comparison-label">概念 B</span><h4>' + esc(row.right) + '</h4></div></div><div class="comparison-judgment"><strong>判斷區</strong><p><b>差別：</b>' + esc(row.distinction) + '</p><p><b>判斷線索：</b>' + esc(row.cue) + '</p></div></article>';
  }).join('') + '</div>';
}
function renderVisual(visual) {
  if (!visual) return '';
  return '<figure class="visual-teaching visual-' + esc(visual.kind || 'flow') + '"><figcaption><strong>' + esc(visual.title) + '</strong><span>' + esc(visual.note) + '</span></figcaption><div class="visual-flow">' + (visual.nodes || []).map(function (node, index) {
    return (index ? '<span class="visual-arrow" aria-hidden="true">→</span>' : '') + '<div class="visual-node">' + esc(node) + '</div>';
  }).join('') + '</div></figure>';
}
function lessonVisual(lessonNumber) {
  var number = Number(lessonNumber);
  var subject = number <= 4 ? 'civics' : (number >= 9 && number <= 14) ? 'civics' : (number <= 18) ? 'economics' : number <= 30 ? 'history' : 'geography';
  return socialSupplement.visuals[subject] && socialSupplement.visuals[subject][number];
}
function historyFrame(lessonNumber) {
  return socialSupplement.historyCompleteness[String(lessonNumber)] || socialSupplement.historyCompleteness[lessonNumber];
}
function renderSupplementary() {
  var categories = { A: '公民', B: '經濟', C: '歷史', D: '地理' };
  var query = String(state.supplementQuery || '').trim().toLowerCase();
  var filtered = socialSupplement.items.filter(function (item) {
    var history = item.history || {};
    var searchable = [item.term, item.child, item.plain, item.formal, item.example, item.use, item.examUse].concat(item.aliases || []).concat([history.time, history.actors, history.opponents, history.event, history.impact]);
    return (state.supplementCategory === 'all' || item.category === state.supplementCategory) && (!query || searchable.join(' ').toLowerCase().indexOf(query) >= 0);
  }).map(function (item) {
    if (!query) return { item: item, score: 0 };
    var q = query;
    var term = String(item.term || '').toLowerCase();
    var aliases = (item.aliases || []).map(function (alias) { return String(alias).toLowerCase(); });
    var score = 10;
    if (term === q) score = 1000;
    else if (aliases.indexOf(q) >= 0) score = 900;
    else if (term.indexOf(q) === 0) score = 800;
    else if (aliases.some(function (alias) { return alias.indexOf(q) === 0; })) score = 700;
    else if (aliases.some(function (alias) { return alias.indexOf(q) >= 0; })) score = 500;
    return { item: item, score: score };
  }).sort(function (a, b) { return b.score - a.score || String(a.item.term).localeCompare(String(b.item.term), 'zh-Hant'); }).map(function (entry) { return entry.item; });
  var categoryOptions = '<option value="all">全部分類</option>' + Object.keys(categories).map(function (key) { return '<option value="' + key + '" ' + (state.supplementCategory === key ? 'selected' : '') + '>' + key + ' ' + categories[key] + '</option>'; }).join('');
  return '<section id="supplementary" class="supplementary-toolbox"><div class="section-title"><span class="eyebrow">🧰 社會科補充教材</span><h2>考前工具箱</h2></div><p class="supplement-intro">不熟的概念可用分類、搜尋或快速跳轉複習；每個條目都附小孩版、正式解釋、例子與學測用法。</p><div class="supplement-controls"><label>搜尋概念<input type="search" data-supplement-search value="' + esc(state.supplementQuery || '') + '" placeholder="搜尋名詞、別名、例子或考法"></label><label>分類<select data-supplement-category>' + categoryOptions + '</select></label><div class="supplement-jumps">' + Object.keys(categories).map(function (key) { return '<button type="button" class="button secondary" data-supplement-jump="' + key + '">' + key + ' ' + categories[key] + '</button>'; }).join('') + '</div></div><div class="supplement-items">' + (filtered.length ? filtered.map(function (item) { var history = item.history || {}; var historyBlock = history.time ? '<dl class="supplement-history"><div><dt>時間</dt><dd>' + esc(history.time) + '</dd></div><div><dt>主要人物／國家</dt><dd>' + esc(history.actors || '') + '</dd></div><div><dt>對立方</dt><dd>' + esc(history.opponents || '') + '</dd></div><div><dt>發生什麼</dt><dd>' + esc(history.event || '') + '</dd></div><div><dt>結果／影響</dt><dd>' + esc(history.impact || '') + '</dd></div></dl>' : ''; return '<details class="supplement-item" data-supplement-item><summary><span class="badge">' + item.category + ' ' + categories[item.category] + '</span><strong>' + esc(item.term) + '</strong></summary><div class="supplement-item-body"><p><b>小孩版：</b>' + esc(item.child || item.plain || '') + '</p><p><b>正式解釋：</b>' + esc(item.formal || item.plain || '') + '</p><p><b>例子／背景：</b>' + esc(item.example || '') + '</p><p><b>學測怎麼用：</b>' + esc(item.use || item.examUse || '') + '</p>' + (item.aliases && item.aliases.length ? '<p><b>搜尋別名：</b>' + esc(item.aliases.join('、')) + '</p>' : '') + historyBlock + '</div></details>'; }).join('') : '<p class="muted">找不到符合的補充條目。</p>') + '</div></section>';
}
function supplementarySection() {
  return '<section class="supplementary-mode"><div class="section-title"><span class="eyebrow">🧰 社會科補充教材</span><h2>考前工具箱</h2></div><p class="curriculum-intro">這是獨立的補充教材頁面；可搜尋、分類與快速跳轉，返回時會保留上一個課綱或歷屆試題狀態。</p>' + renderSupplementary() + '</section>';
}
function renderSingleUnit(unit) {
  var payload = unit.payload || {};
  if (unit.type === 'intro') return '<section class="single-unit-body intro-unit"><h3>先掌握這一課</h3>' + list(payload.summary) + '<p class="beginner-hint">讀法：先看生活例子，再對照白話解釋、正式名詞、學測考法與判斷線索。</p></section>';
  if (unit.type === 'core') return '<section class="single-unit-body core-unit beginner-core"><div class="beginner-grid"><div><strong>生活例子</strong>' + textBlock(payload.example) + '</div><div><strong>白話解釋</strong>' + textBlock(payload.what) + '</div><div><strong>正式名詞</strong><p class="course-text">' + esc(payload.name) + '</p></div><div><strong>學測怎麼考</strong>' + textBlock(payload.packaging) + '</div><div><strong>判斷線索</strong>' + textBlock(payload.judge) + '</div><div><strong>常見錯誤</strong>' + textBlock(payload.mistake) + '</div></div><a class="supplement-link" href="#mode=supplementary">不熟這個概念？看補充教材</a></section>';
  if (unit.id === 'comparisons') return '<section class="single-unit-body"><h3>必要概念比較</h3>' + renderComparison(payload.comparisons || []) + '</section>';
  if (unit.type === 'historicalQuestion' || unit.type === 'constructedPractice') {
    return '<section class="single-unit-body question-unit"><p class="unit-label">' + (unit.type === 'historicalQuestion' ? '歷屆真題精講（canonical 題庫）' : '非選整合／題組') + '</p>' + (payload.questions || []).map(questionCard).join('') + '</section>';
  }
  if (unit.type === 'originalPractice') return '<section class="single-unit-body practice-unit"><p class="unit-label">原創練習</p>' + originalPracticeCard(payload.practice, payload.index) + '</section>';
  if (unit.id === 'traps') return '<section class="single-unit-body"><h3>' + esc(payload.heading) + '</h3>' + list(payload.items) + '</section>';
  if (unit.id === 'sop') return '<section class="single-unit-body"><h3>' + esc(payload.heading) + '</h3>' + textBlock(payload.text) + '</section>';
  return '<section class="single-unit-body final-review"><h3>最後幾天只看這些</h3>' + list(payload.items) + '</section>';
}
function setLessonUnit(lessonNumber, unitIndex, replace) {
  var units = buildLessonUnits(lessonNumber);
  singleView.lesson = Math.min(36, Math.max(1, Number(lessonNumber) || 1));
  singleView.unit = Math.min(Math.max(0, Number(unitIndex) || 0), Math.max(0, units.length - 1));
  state.mode = 'curriculum';
  var hash = '#mode=curriculum&lesson=' + singleView.lesson + '&unit=' + singleView.unit;
  if (replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash);
}
function parseLessonHash() {
  var hash = location.hash;
  var curriculumMatch = hash.match(/^#mode=curriculum&lesson=(\d+)&unit=(\d+)$/);
  if (curriculumMatch) {
    var lessonNumber = Number(curriculumMatch[1]);
    if (!lessonSpec(lessonNumber)) { setLessonUnit(1, 0, true); return true; }
    state.mode = 'curriculum';
    singleView.lesson = lessonNumber;
    var units = buildLessonUnits(lessonNumber);
    singleView.unit = Math.min(Math.max(0, Number(curriculumMatch[2]) || 0), Math.max(0, units.length - 1));
    return true;
  }
  var legacyLesson = hash.match(/^#lesson=(\d+)&unit=(\d+)$/);
  if (legacyLesson) { setLessonUnit(Number(legacyLesson[1]), Number(legacyLesson[2]), true); return true; }
  return false;
}
function parseSupplementaryHash() {
  if (location.hash.indexOf('#mode=supplementary') !== 0) return false;
  var raw = location.hash.slice('#mode=supplementary'.length);
  var params = new URLSearchParams(raw.charAt(0) === '&' ? raw.slice(1) : raw);
  var category = params.get('category') || 'all';
  state.mode = 'supplementary';
  state.supplementQuery = params.get('q') || '';
  state.supplementCategory = /^(?:all|A|B|C|D)$/.test(category) ? category : 'all';
  return true;
}
function setSupplementaryState(query, category, replace) {
  state.mode = 'supplementary';
  state.supplementQuery = query || '';
  state.supplementCategory = /^(?:all|A|B|C|D)$/.test(category || 'all') ? (category || 'all') : 'all';
  var hash = '#mode=supplementary';
  if (state.supplementQuery) hash += '&q=' + encodeURIComponent(state.supplementQuery);
  if (state.supplementCategory !== 'all') hash += '&category=' + state.supplementCategory;
  if (replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash);
}
function setMode(mode, replace) {
  state.mode = mode === 'exam' ? 'exam' : 'curriculum';
  if (state.mode === 'exam') setExamState(state.year, state.examQuestion || 1, state.examGroup, true);
  else setLessonUnit(singleView.lesson, singleView.unit, true);
  if (!replace) render();
}
function setExamState(year, questionNumber, groupIndex, replace) {
  var validYear = examData[year] ? String(year) : '115';
  var units = buildExamUnits(validYear);
  var targetQuestion = Number(questionNumber) || 1;
  var unitIndex = units.findIndex(function (unit) { return unit.payload.questions.some(function (question) { return question.number === targetQuestion; }); });
  if (unitIndex < 0) { unitIndex = 0; targetQuestion = units[0] && units[0].payload.questions[0] ? units[0].payload.questions[0].number : 1; }
  state.mode = 'exam';
  state.year = validYear;
  state.examQuestion = targetQuestion;
  state.examGroup = groupIndex == null ? unitIndex : Math.min(Math.max(0, Number(groupIndex) || 0), Math.max(0, units.length - 1));
  var actualGroup = units[state.examGroup] || units[unitIndex];
  if (actualGroup && !actualGroup.payload.questions.some(function (question) { return question.number === targetQuestion; })) {
    state.examGroup = unitIndex;
  }
  var hash = '#mode=exam&year=' + state.year + '&group=' + state.examGroup + '&question=' + state.examQuestion;
  if (replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash);
}
function parseExamHash() {
  var match = location.hash.match(/^#mode=exam&year=(\d{3})(?:&group=(\d+))?&question=(\d+)$/);
  if (!match) return false;
  var year = examData[match[1]] ? match[1] : '115';
  setExamState(year, Number(match[3]), match[2] == null ? null : Number(match[2]), true);
  return true;
}
function curriculumSection() {
  var currentItem = curriculum.find(function (item) { return item.lesson === singleView.lesson; }) || curriculum[0];
  if (!currentItem) return '<section id="curriculum" class="curriculum"><p class="empty">找不到課程資料。</p></section>';
  var spec = lessonSpec(currentItem.lesson) || {};
  var units = buildLessonUnits(currentItem.lesson);
  singleView.unit = Math.min(singleView.unit, Math.max(0, units.length - 1));
  var currentUnit = units[singleView.unit] || units[0];
  var groups = [{ name: 'A 解題底層', min: 1, max: 4 }, { name: 'B 公民經濟', min: 5, max: 18 }, { name: 'C 歷史', min: 19, max: 30 }, { name: 'D 地理', min: 31, max: 36 }];
  var sidebar = groups.map(function (group) {
    var items = curriculum.filter(function (item) { return item.lesson >= group.min && item.lesson <= group.max; });
    return '<section class="lesson-sidebar-group"><h3>' + esc(group.name) + '</h3>' + items.map(function (item) { return '<button type="button" class="lesson-sidebar-button ' + (item.lesson === currentItem.lesson ? 'active' : '') + '" data-lesson-select="' + item.lesson + '"><span>第 ' + item.lesson + ' 課</span><strong>' + esc(item.title) + '</strong></button>'; }).join('') + '</section>';
  }).join('');
  var percent = Math.round(((singleView.unit + 1) / units.length) * 100);
  var unitList = units.map(function (unit, index) { return '<option value="' + index + '" ' + (index === singleView.unit ? 'selected' : '') + '>' + (index + 1) + '. ' + esc(unit.title) + '</option>'; }).join('');
  var refs = (spec.officialRefs || []).slice(0, 6).map(function (ref) { return '<a href="#mode=exam&year=' + ref[0] + '&question=' + ref[1] + '" data-cross-exam="' + ref[0] + '-q' + ref[1] + '">' + ref[0] + ' 第 ' + ref[1] + ' 題</a>'; }).join('、');
  var related = refs ? '<section class="related-exams"><h3>相關歷屆題</h3><p>' + refs + '</p></section>' : '';
  var frame = historyFrame(currentItem.lesson);
  var frameHtml = frame ? '<section class="beginner-history-frame"><h3>這課的五格定位</h3><div class="beginner-grid"><div><strong>何時</strong><p>' + esc(frame.when) + '</p></div><div><strong>有誰</strong><p>' + esc(frame.who) + '</p></div><div><strong>為什麼</strong><p>' + esc(frame.why) + '</p></div><div><strong>發生什麼</strong><p>' + esc(frame.what) + '</p></div><div><strong>結果／影響</strong><p>' + esc(frame.result) + '</p></div></div></section>' : '';
  return '<section id="curriculum" class="curriculum single-view-section"><div class="section-title"><span class="eyebrow">🧠 課綱複習</span><h2>36 課單元閱讀</h2></div><p class="curriculum-intro">一次只讀一個學習單位；題組材料、圖表與題目會維持在同一單元，答案仍依原本的送出後揭露流程。</p>' + related + '<div class="single-view-shell"><aside class="single-view-sidebar ' + (singleView.menuOpen ? 'open' : '') + '"><button type="button" class="single-view-menu" data-sidebar-toggle>☰ 課綱目錄</button><nav aria-label="36 課課綱目錄">' + sidebar + '</nav></aside><main class="single-view-main"><header class="single-view-header"><div><span class="unit">第 ' + currentItem.lesson + ' 課｜' + esc(spec.phase || currentItem.phase) + '</span><h2>' + esc(spec.title || currentItem.title) + '</h2></div><div class="single-view-progress"><strong>Lesson ' + currentItem.lesson + '｜Unit ' + (singleView.unit + 1) + ' / ' + units.length + '</strong><span>' + percent + '%</span><div class="progress-track"><i style="width:' + percent + '%"></i></div></div></header><nav class="single-unit-nav" aria-label="課內單元導覽"><label>目前單元<select data-unit-select>' + unitList + '</select></label></nav><article class="single-view-unit" id="lesson-' + currentItem.lesson + '-unit-' + singleView.unit + '"><h2>' + esc(currentUnit.title) + '</h2>' + frameHtml + renderVisual(lessonVisual(currentItem.lesson)) + renderSingleUnit(currentUnit) + '</article><footer class="single-unit-footer"><button type="button" class="button secondary" data-unit-prev ' + (singleView.unit === 0 ? 'disabled' : '') + '>‹ 上一單元</button><span>第 ' + (singleView.unit + 1) + ' / ' + units.length + ' 單元</span><button type="button" class="button" data-unit-next ' + (singleView.unit === units.length - 1 ? 'disabled' : '') + '>下一單元 ›</button></footer></main></div></section>';
}
function studyOverview(data) {
  var subjects = ['公民', '歷史', '地理', '跨科'];
  var cards = subjects.map(function (subject) {
    var list = data.questions.filter(function (q) { return q.subject === subject; });
    return '<article class="study-card"><h3>' + esc(subject) + '</h3><p><strong>' + list.length + ' 題</strong>｜選擇 ' + list.filter(function (q) { return q.questionType !== 'constructed'; }).length + ' 題・非選 ' + list.filter(function (q) { return q.questionType === 'constructed'; }).length + ' 題</p><a href="#questions" data-subject-link="' + esc(subject) + '">查看本年度 ' + esc(subject) + ' 題目</a></article>';
  }).join('');
  return '<section class="study-overview"><div class="section-title"><span class="eyebrow">📚 年度總覽</span><h2>依科目快速進入</h2></div><div class="study-grid">' + cards + '</div>' +
    '<div id="answer-reminder" class="answer-reminder"><h3>📝 答題紙與作答提醒</h3><p>選擇題依各年度官方答題卷使用 2B 鉛筆劃記；非選題依題目與答題卷指定，以黑色墨水筆書寫、勾選或作圖。每題卡片內會標示目前資料中的作答工具與操作方式；遇到「需要複核」請以該年度官方答題卷為準。</p></div></section>';
}
function pagination(total) {
  var pages = Math.max(1, Math.ceil(total / pageSize));
  var buttons = [];
  for (var i = 1; i <= pages; i += 1) {
    buttons.push('<button class="page-button ' + (i === state.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>');
  }
  return '<nav class="pagination" aria-label="題目分頁"><button class="page-button" data-page="prev" ' + (state.page === 1 ? 'disabled' : '') + '>上一頁</button>' + buttons.join('') + '<button class="page-button" data-page="next" ' + (state.page === pages ? 'disabled' : '') + '>下一頁</button><span>第 ' + state.page + ' / ' + pages + ' 頁</span></nav>';
}
function renderTabs() {
  tabs.innerHTML = ['115', '114', '113', '112', '111'].map(function (year) {
    return '<button class="tab ' + (year === state.year ? 'active' : '') + '" data-year="' + year + '">' + year + '年</button>';
  }).join('');
}
function answerGuide(question) {
  if (question.questionType === 'constructed') {
    return '<div class="constructed"><h4>📝 非選答題指南</h4>' +
      '<p><strong>官方滿分答案：</strong>' + esc(question.constructedAnswer.fullCreditAnswer) + '</p>' +
      '<h5>官方採分點</h5>' + list(question.constructedAnswer.scoringPoints) +
      '<h5>部分給分</h5>' + list(question.constructedAnswer.partialCredit) +
      '<h5>零分條件</h5>' + list(question.constructedAnswer.zeroCredit) +
      '<p><strong>考生實戰版：</strong>' + esc(question.constructedAnswer.examReadyAnswer) + '</p></div>';
  }
  return '<div class="options">' + question.options.map(function (option) {
    return '<div class="option ' + (option.correct ? 'correct' : 'wrong') + '">' +
      '<strong>' + (option.correct ? '✅' : '❌') + ' ' + esc(option.label) + '</strong>' +
      (question.imageOptions && question.imageOptions[option.label] ? '<img src="' + esc(question.imageOptions[option.label]) + '" alt="113年第29題選項' + esc(option.label) + '" style="display:block;max-width:100%;height:auto;margin:10px 0;border:1px solid #d7dee8;border-radius:8px">' : '') +
      '<span>' + esc(option.text) + '</span>' +
      '<small>' + esc(option.explanation) + (option.errorType ? '（' + esc(option.errorType) + '）' : '') + '</small></div>';
  }).join('') + '</div>';
}
function questionChoiceOptions(question, current) {
  var submitted = current.submitted;
  return '<div class="options">' + (question.options || []).map(function (option) {
    var selected = selectionHas(current.selected, option.label);
    var correct = answerSet(question.officialAnswer).indexOf(String(option.label).toUpperCase()) >= 0;
    var className = 'option quiz-option' + (selected && !submitted ? ' selected' : '');
    var mark = '';
    var feedback = '';
    if (submitted) {
      className += correct ? ' correct' : (selected ? ' wrong' : '');
      mark = correct ? '✅ ' : (selected ? '❌ ' : '');
      feedback = '<small>' + esc(option.explanation) + (option.errorType ? '（' + esc(option.errorType) + '）' : '') + '</small>';
    }
    var image = question.imageOptions && question.imageOptions[option.label] ? '<img src="' + esc(question.imageOptions[option.label]) + '" alt="' + esc(question.year + '年第' + question.number + '題選項' + option.label) + '" style="display:block;max-width:100%;height:auto;margin:10px 0;border:1px solid #d7dee8;border-radius:8px">' : '';
    return '<button type="button" class="' + className + '" data-quiz-option="' + esc(question.year + '-q' + question.number) + '" data-option="' + esc(option.label) + '" data-multiple="' + (isMultiAnswer(question.officialAnswer) ? 'true' : 'false') + '"' + (submitted ? ' disabled' : '') + '><span class="option-badge">' + mark + esc(option.label) + '</span>' + image + '<span class="option-text">' + esc(option.text) + '</span>' + feedback + '</button>';
  }).join('') + '</div>';
}
function questionCard(question) {
  var id = question.year + '-q' + question.number;
  var current = getState(questionState, id);
  var isRead = localStorage.getItem(id) === 'read';
  var firstReason = question.correctReasoning && question.correctReasoning[0] ? question.correctReasoning[0] : (question.whatIsTested || question.prompt || '請回看官方題目與評分資料。');
  var isConstructed = question.questionType === 'constructed';
  var input = isConstructed ? '<label class="constructed-input"><span>作答區</span><textarea data-constructed-input="' + esc(id) + '" rows="5" placeholder="完成作答後按「確認作答」">' + esc(current.selected || '') + '</textarea></label>' : questionChoiceOptions(question, current);
  var submit = '<div class="quiz-actions"><button type="button" class="button" data-quiz-submit="' + esc(id) + '"' + ((!isConstructed && !hasSelection(current.selected)) || (isConstructed && !hasSelection(current.selected)) || current.submitted ? ' disabled' : '') + '>' + (isConstructed ? '查看答案／確認作答' : '確認答案') + '</button>' + (current.submitted ? '<button type="button" class="button secondary" data-quiz-reset="' + esc(id) + '">重新作答</button>' : '') + '</div>';
  var revealed = current.submitted ? '<div class="quiz-feedback answer-box"><div class="answer-line">官方答案：<strong>' + esc(question.officialAnswer) + '</strong></div>' +
    '<details open><summary>展開解答與解析</summary><div class="reasoning">' +
    '<h4>🔍 題目與判斷</h4>' +
    (question.whatIsTested ? '<p><strong>這題在考什麼：</strong>' + esc(question.whatIsTested) + '</p>' : '') +
    (question.keyClues ? '<p><strong>題幹關鍵：</strong></p>' + list(question.keyClues) : '') +
    '<div class="answer-question">' + esc(firstReason) + '</div>' + list(question.reasoning || (question.correctReasoning ? question.correctReasoning.slice(1) : [])) + answerGuide(question) + curriculumLinks(question) +
    '<div class="mini-grid"><div><h4>⏱ 考前一句話</h4><p>' + esc(question.takeaway) + '</p></div><div><h4>⚠️ 最容易錯在哪</h4><p>' + esc(question.trap) + '</p></div><div><h4>✏️ 考場怎麼作答</h4><p>' + (question.answerSheet && question.answerSheet.instrument === '2B' ? '✏️ 2B 鉛筆' : '🖊 黑色墨水筆') + '｜' + esc(question.answerSheet ? question.answerSheet.instruction : '依官方答題卷與題目指定作答。') + '</p></div></div>' +
    '<p class="source">來源：' + esc(question.sourcePdf) + '；題目文字：' + esc(question.sourceMarkdown) + '</p></div></details></div>' : '';
  return '<article class="question-card ' + (isRead ? 'is-read' : '') + '" id="' + id + '">' +
    '<div class="q-head"><div><span class="q-year">' + question.year + ' 年</span><h3>第 ' + question.number + ' 題</h3></div>' +
    '<div><span class="badge">' + esc(question.subject) + '</span> <span class="badge">' + typeLabel(question.questionType) + '</span></div>' +
    '<button class="read-btn" data-read="' + id + '">' + (isRead ? '取消已讀' : '標為已讀') + '</button></div>' +
    '<p class="topic">🧠 ' + esc(question.topic) + '</p>' +
    '<div class="prompt"><strong>題目：</strong>' + esc(question.prompt) + '</div>' +
    '<div class="quiz-shell">' + input + submit + revealed + '</div>' + '</article>';
}
function curriculumLinks(question) {
  var refs = findLessonRefs(question);
  if (!refs.length) return '';
  return '<div class="related-curriculum"><strong>對應課綱：</strong>' + refs.map(function (item) { return '<a href="#mode=curriculum&lesson=' + item.lesson + '&unit=0" data-cross-curriculum="' + item.lesson + '">L' + String(item.lesson).padStart(2, '0') + ' ' + esc(item.title) + '</a>'; }).join('、') + '</div>';
}
function filteredQuestions(data) {
  return data.questions.filter(function (question) {
    var haystack = (question.number + ' ' + question.subject + ' ' + question.topic + ' ' + question.prompt + ' ' + question.officialAnswer).toLowerCase();
    return (state.subject === 'all' || question.subject === state.subject) &&
      (state.type === 'all' || question.questionType === state.type) &&
      (!state.unreadOnly || localStorage.getItem(question.year + '-q' + question.number) !== 'read') &&
      (!state.query || haystack.indexOf(state.query.toLowerCase()) >= 0);
  });
}
function renderModeSwitch() {
  modeTabs.innerHTML = '<a class="mode-tab ' + (state.mode === 'curriculum' ? 'active' : '') + '" aria-current="' + (state.mode === 'curriculum' ? 'page' : 'false') + '" href="#mode=curriculum&lesson=' + singleView.lesson + '&unit=' + singleView.unit + '" data-mode="curriculum">課綱複習</a>' +
    '<a class="mode-tab ' + (state.mode === 'exam' ? 'active' : '') + '" aria-current="' + (state.mode === 'exam' ? 'page' : 'false') + '" href="#mode=exam&year=' + state.year + '&group=' + (state.examGroup == null ? 0 : state.examGroup) + '&question=' + state.examQuestion + '" data-mode="exam">歷屆試題</a>' +
    '<a class="mode-tab ' + (state.mode === 'supplementary' ? 'active' : '') + '" aria-current="' + (state.mode === 'supplementary' ? 'page' : 'false') + '" href="#mode=supplementary" data-mode="supplementary">補充教材</a>';
}
function examSidebar() {
  return ['115', '114', '113', '112', '111'].map(function (year) {
    var units = buildExamUnits(year);
    var active = year === state.year;
    return '<section class="exam-sidebar-year ' + (active ? 'active' : '') + '"><h3>' + year + ' 學測</h3><div class="exam-sidebar-groups">' + units.map(function (unit, index) {
      var questions = unit.payload.questions;
      var selected = active && index === state.examGroup;
      var first = questions[0];
      var last = questions[questions.length - 1];
      return '<button type="button" class="exam-sidebar-item ' + (selected ? 'active' : '') + '" data-exam-group="' + index + '" data-exam-year="' + year + '" data-exam-question="' + first.number + '"><span>' + (questions.length > 1 ? '題組 ' + first.number + '–' + last.number : '第 ' + first.number + ' 題') + '</span><strong>' + esc(typeLabel(first.questionType)) + '</strong></button>';
    }).join('') + '</div></section>';
  }).join('');
}
function examSection() {
  var current = examUnitForState();
  var data = examData[state.year];
  var questions = data.questions;
  var currentQuestion = current.unit.payload.questions.find(function (question) { return question.number === Number(state.examQuestion); }) || current.unit.payload.questions[0];
  var questionIndex = questions.findIndex(function (question) { return question.number === currentQuestion.number; });
  var previous = current.index > 0 ? current.units[current.index - 1] : null;
  var next = current.index < current.units.length - 1 ? current.units[current.index + 1] : null;
  return '<section class="exam-mode"><div class="mode-layout"><aside class="mode-sidebar exam-sidebar"><button type="button" class="single-view-menu" data-exam-sidebar-toggle>☰ 歷屆試題目錄</button><nav aria-label="歷屆試題目錄">' + examSidebar() + '</nav></aside><main class="mode-main"><header class="exam-header"><div><span class="eyebrow">歷屆試題</span><h2>' + state.year + ' 學測｜第 ' + currentQuestion.number + ' 題</h2><p>' + esc(typeLabel(currentQuestion.questionType)) + '｜' + (questionIndex + 1) + ' / ' + questions.length + '</p></div><div class="exam-progress"><strong>Year ' + state.year + '</strong><span>Question ' + (questionIndex + 1) + ' / ' + questions.length + '</span><div class="progress-track"><i style="width:' + Math.round(((questionIndex + 1) / questions.length) * 100) + '%"></i></div></div></header><nav class="exam-unit-nav" aria-label="歷屆題目導覽"><button type="button" class="button secondary" data-exam-prev ' + (!previous ? 'disabled' : '') + '>‹ 上一題組</button><span>' + (current.unit.payload.questions.length > 1 ? '題組共用材料保留' : '單題') + '</span><button type="button" class="button secondary" data-exam-next ' + (!next ? 'disabled' : '') + '>下一題組 ›</button></nav><section class="exam-atomic-group" aria-label="目前歷屆題目">' + current.unit.payload.questions.map(questionCard).join('') + '</section></main></div></section>';
}
function render() {
  renderModeSwitch();
  if (state.mode === 'exam') app.innerHTML = examSection();
  else if (state.mode === 'supplementary') app.innerHTML = supplementarySection();
  else app.innerHTML = curriculumSection();
  bind();
}
function bind() {
  document.querySelector('[data-exam-sidebar-toggle]')?.addEventListener('click', function () {
    this.closest('.exam-sidebar')?.classList.toggle('open');
  });
  document.querySelectorAll('[data-mode]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (link.dataset.mode === 'exam') setExamState(state.year, state.examQuestion || 1, state.examGroup, false);
      else if (link.dataset.mode === 'supplementary') setSupplementaryState(state.supplementQuery, state.supplementCategory, false);
      else setLessonUnit(singleView.lesson, singleView.unit, false);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  document.querySelectorAll('[data-exam-group]').forEach(function (button) {
    button.addEventListener('click', function () {
      setExamState(button.dataset.examYear, Number(button.dataset.examQuestion), Number(button.dataset.examGroup), false);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  document.querySelector('[data-exam-prev]')?.addEventListener('click', function () {
    var current = examUnitForState();
    if (current.index <= 0) return;
    var target = current.units[current.index - 1].payload.questions[0];
    setExamState(state.year, target.number, current.index - 1, false);
    render();
  });
  document.querySelector('[data-exam-next]')?.addEventListener('click', function () {
    var current = examUnitForState();
    if (current.index >= current.units.length - 1) return;
    var target = current.units[current.index + 1].payload.questions[0];
    setExamState(state.year, target.number, current.index + 1, false);
    render();
  });
  document.querySelector('#search')?.addEventListener('input', function (event) { state.query = event.target.value; state.page = 1; render(); });
  document.querySelector('#subject')?.addEventListener('change', function (event) { state.subject = event.target.value; state.page = 1; render(); });
  document.querySelector('#type')?.addEventListener('change', function (event) { state.type = event.target.value; state.page = 1; render(); });
  document.querySelector('#unread')?.addEventListener('click', function () { state.unreadOnly = !state.unreadOnly; render(); });
  document.querySelector('#expand')?.addEventListener('click', function () { document.querySelectorAll('details').forEach(function (detail) { detail.open = true; }); });
  document.querySelector('#collapse')?.addEventListener('click', function () { document.querySelectorAll('details').forEach(function (detail) { detail.open = false; }); });
  document.querySelector('[data-sidebar-toggle]')?.addEventListener('click', function () {
    singleView.menuOpen = !singleView.menuOpen;
    render();
  });
  document.querySelectorAll('[data-lesson-select]').forEach(function (button) {
    button.addEventListener('click', function () {
      setLessonUnit(Number(button.dataset.lessonSelect), 0, false);
      singleView.menuOpen = false;
      render();
      document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelector('[data-unit-select]')?.addEventListener('change', function (event) {
    setLessonUnit(singleView.lesson, Number(event.target.value), false);
    render();
    document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
  });
  document.querySelector('[data-supplement-search]')?.addEventListener('input', function (event) {
    state.supplementQuery = event.target.value;
    if (state.mode === 'supplementary') setSupplementaryState(state.supplementQuery, state.supplementCategory, true);
    render();
  });
  document.querySelector('[data-supplement-category]')?.addEventListener('change', function (event) {
    state.supplementCategory = event.target.value;
    if (state.mode === 'supplementary') setSupplementaryState(state.supplementQuery, state.supplementCategory, true);
    render();
  });
  document.querySelectorAll('[data-supplement-jump]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.supplementCategory = button.dataset.supplementJump;
      state.supplementQuery = '';
      if (state.mode === 'supplementary') setSupplementaryState('', state.supplementCategory, true);
      render();
      document.querySelector('#supplementary')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-unit-prev]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (singleView.unit <= 0) return;
      setLessonUnit(singleView.lesson, singleView.unit - 1, false);
      render();
      document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-unit-next]').forEach(function (button) {
    button.addEventListener('click', function () {
      var units = buildLessonUnits(singleView.lesson);
      if (singleView.unit >= units.length - 1) return;
      setLessonUnit(singleView.lesson, singleView.unit + 1, false);
      render();
      document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-curriculum-phase]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.curriculumPhase = button.dataset.curriculumPhase;
      state.curriculumPage = 1;
      render();
      document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-curriculum-page]').forEach(function (button) {
    button.addEventListener('click', function () {
      var phaseItems = curriculum.filter(function (item) { return item.phase === state.curriculumPhase; });
      var totalPages = Math.max(1, Math.ceil(phaseItems.length / curriculumPageSize));
      var target = button.dataset.curriculumPage;
      if (target === 'prev') state.curriculumPage -= 1;
      else if (target === 'next') state.curriculumPage += 1;
      else state.curriculumPage = Number(target);
      state.curriculumPage = Math.min(Math.max(1, state.curriculumPage), totalPages);
      render();
      document.querySelector('#curriculum')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-page]').forEach(function (button) {
    button.addEventListener('click', function () {
      var data = examData[state.year];
      var totalPages = Math.max(1, Math.ceil(filteredQuestions(data).length / pageSize));
      var target = button.dataset.page;
      if (target === 'prev') state.page -= 1;
      else if (target === 'next') state.page += 1;
      else state.page = Number(target);
      state.page = Math.min(Math.max(1, state.page), totalPages);
      render();
      document.querySelector('#questions')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-subject-link]').forEach(function (link) {
    link.addEventListener('click', function () {
      state.subject = link.dataset.subjectLink;
      render();
      document.querySelector('#questions')?.scrollIntoView({ block: 'start' });
    });
  });
  document.querySelectorAll('[data-read]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.dataset.read;
      localStorage.setItem(id, localStorage.getItem(id) === 'read' ? 'unread' : 'read');
      render();
    });
  });
  document.querySelectorAll('[data-quiz-option]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.dataset.quizOption;
      var current = getState(questionState, id);
      if (current.submitted) return;
      toggleSelection(current, button.dataset.option, button.dataset.multiple === 'true');
      render();
    });
  });
  document.querySelectorAll('[data-quiz-submit]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.dataset.quizSubmit;
      var current = getState(questionState, id);
      if (!hasSelection(current.selected)) return;
      current.submitted = true;
      render();
    });
  });
  document.querySelectorAll('[data-quiz-reset]').forEach(function (button) {
    button.addEventListener('click', function () {
      questionState[button.dataset.quizReset] = { selected: null, submitted: false };
      render();
    });
  });
  document.querySelectorAll('[data-constructed-input]').forEach(function (input) {
    input.addEventListener('input', function () {
      getState(questionState, input.dataset.constructedInput).selected = input.value;
      var submit = document.querySelector('[data-quiz-submit="' + input.dataset.constructedInput + '"]');
      if (submit) submit.disabled = !input.value.trim();
    });
  });
  document.querySelectorAll('[data-practice-option]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.dataset.practiceOption;
      var current = getState(practiceState, id);
      if (current.submitted) return;
      toggleSelection(current, button.dataset.option, button.dataset.multiple === 'true');
      render();
    });
  });
  document.querySelectorAll('[data-practice-submit]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.dataset.practiceSubmit;
      var current = getState(practiceState, id);
      if (!hasSelection(current.selected)) return;
      current.submitted = true;
      render();
    });
  });
  document.querySelectorAll('[data-practice-reset]').forEach(function (button) {
    button.addEventListener('click', function () {
      practiceState[button.dataset.practiceReset] = { selected: null, submitted: false };
      render();
    });
  });
  document.querySelectorAll('[data-practice-input]').forEach(function (input) {
    input.addEventListener('input', function () {
      getState(practiceState, input.dataset.practiceInput).selected = input.value;
      var submit = document.querySelector('[data-practice-submit="' + input.dataset.practiceInput + '"]');
      if (submit) submit.disabled = !input.value.trim();
    });
  });
}
applyTheme(currentTheme);
document.querySelector('#themeToggle').addEventListener('click', function () {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  localStorage.setItem('social-theme', currentTheme);
});
document.querySelector('#quickMode').addEventListener('click', function () {
  document.body.classList.toggle('quick-mode');
  if (state.mode === 'curriculum') {
    var quickUnits = buildLessonUnits(singleView.lesson);
    var quickIndex = quickUnits.findIndex(function (unit) { return unit.id === 'final-review'; });
    if (quickIndex >= 0) {
      setLessonUnit(singleView.lesson, quickIndex, false);
      render();
      document.querySelector('.single-view-unit')?.scrollIntoView({ block: 'start' });
    }
  } else {
    document.querySelector('.exam-mode')?.scrollIntoView({ block: 'start' });
  }
});
document.querySelector('#printPage').addEventListener('click', function () { window.print(); });
document.querySelector('#backTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
window.addEventListener('hashchange', function () {
  if (parseSupplementaryHash() || parseExamHash() || parseLessonHash()) { render(); return; }
  setLessonUnit(1, 0, true);
  render();
});
window.addEventListener('popstate', function () {
  if (parseSupplementaryHash() || parseExamHash() || parseLessonHash()) render();
});
if (!parseSupplementaryHash() && !parseExamHash() && !parseLessonHash()) setLessonUnit(1, 0, true);
render();
