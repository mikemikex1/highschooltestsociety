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
// Visuals are attached to concrete unit ids, never to an entire lesson.
// A lesson may have many units without a visual; those units intentionally
// render only their own text, questions, or practice surface.
var visualPlacement = {
  1: { 'core-1': 1 }, 2: { 'core-1': 2 }, 3: { 'core-1': 3 }, 4: { 'core-1': 4 },
  5: { 'core-1': 5 }, 6: { 'core-1': 6 }, 7: { 'core-1': 7 }, 8: { 'core-1': 8 },
  9: { 'core-1': 9 }, 10: { 'core-1': 10 }, 11: { 'core-1': 11 }, 12: { 'core-1': 12 },
  13: { 'core-1': 13 }, 14: { 'core-1': 14 }, 15: { 'core-1': 15 }, 16: { 'core-2': 16 },
  17: { 'core-1': 17 }, 18: { 'core-1': 18 }, 19: { 'core-1': 19 }, 20: { 'core-1': 20 },
  21: { 'core-1': 21 }, 22: { 'core-1': 22 }, 23: { 'core-1': 23 }, 24: { 'core-1': 24 },
  25: { 'core-1': 25 }, 26: { 'core-1': 26 }, 27: { 'core-1': 27 }, 28: { 'core-1': 28 },
  29: { 'core-1': 29 }, 30: { 'core-1': 'L30-WWI', 'core-2': 'L30-WWII', 'core-3': 'L30-COLD-WAR' }, 31: { 'core-1': 31 }, 32: { 'core-1': 32 },
  33: { 'core-1': 33 }, 34: { 'core-1': 34 }, 35: { 'core-1': 35 }, 36: { 'core-1': 36 }
};
function bindVisualPlacement(lessonNumber, units) {
  var placement = visualPlacement[Number(lessonNumber)] || {};
  return units.map(function (unit) {
    return Object.assign({}, unit, { visualKey: placement[unit.id] || null });
  });
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
  return bindVisualPlacement(lessonNumber, units);
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
function authenticVisuals() {
  var arrow = '<marker id="visual-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1d5f75"/></marker>';
  var base = {
    6: { kind: 'scene', title: '沉沒成本：已付出的票錢不能決定今天', alt: '雨天演唱會情境圖：已買票的人在家與出門之間比較未來的成本與效益', note: '這張圖要看的是：已經付出的票錢不會因今天的選擇消失，真正要比較的是今天還要付出的成本與得到的效益。', svg: '<svg viewBox="0 0 760 260" role="img" aria-label="沉沒成本生活情境圖"><defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#bfe4f3"/><stop offset="1" stop-color="#f7fbfd"/></linearGradient></defs><rect width="760" height="260" rx="16" fill="url(#sky)"/><path d="M0 210 Q180 175 380 215 T760 200 V260 H0Z" fill="#8fbf8b"/><g stroke="#5b87a0" stroke-width="3" opacity=".65"><path d="M80 20v120M145 8v140M220 28v120M310 0v140M400 22v120M490 6v140M585 25v115M670 4v140"/><path d="M55 50h70M120 95h70M190 45h70M280 90h70M370 40h70M455 100h70M550 55h70M635 95h70"/></g><rect x="35" y="42" width="280" height="115" rx="12" fill="#fff" stroke="#1d5f75" stroke-width="3"/><text x="55" y="72" font-size="22" font-weight="700" fill="#17324d">已買演唱會票</text><text x="55" y="106" font-size="18" fill="#17324d">票錢：已經付出</text><text x="55" y="136" font-size="16" fill="#8b3a2f">不能因選擇而拿回</text><path d="M330 100H430" stroke="#1d5f75" stroke-width="4" marker-end="url(#visual-arrow)"/><rect x="450" y="28" width="275" height="72" rx="12" fill="#fff" stroke="#3d8a57" stroke-width="3"/><text x="470" y="58" font-size="18" font-weight="700" fill="#17324d">出門：比較今天的效益</text><text x="470" y="84" font-size="15" fill="#17324d">交通、時間、演出體驗</text><rect x="450" y="125" width="275" height="72" rx="12" fill="#fff" stroke="#b8752a" stroke-width="3"/><text x="470" y="155" font-size="18" font-weight="700" fill="#17324d">不出門：比較今天的效益</text><text x="470" y="181" font-size="15" fill="#17324d">休息、替代活動、少付成本</text><text x="35" y="238" font-size="16" font-weight="700" fill="#17324d">判斷線索：沉沒成本不應再影響現在的邊際選擇</text></svg>' },
    10: { kind: 'relationship', title: '權力分立：誰監督、誰制衡誰？', alt: '立法、行政、司法三權互相監督制衡的關係圖', note: '這張圖要看的是：權力不是排成單一路徑，而是由不同機關互相牽制，避免權力集中。', svg: '<svg viewBox="0 0 760 300" role="img" aria-label="立法行政司法三權互相監督制衡關係圖"><defs>' + arrow + '</defs><rect width="760" height="300" rx="16" fill="#f7fbfe"/><rect x="300" y="28" width="160" height="62" rx="12" fill="#d8edf4" stroke="#1d5f75" stroke-width="3"/><text x="380" y="66" text-anchor="middle" font-size="24" font-weight="700" fill="#17324d">立法</text><text x="380" y="84" text-anchor="middle" font-size="13" fill="#17324d">制定法律、監督行政</text><rect x="80" y="188" width="180" height="62" rx="12" fill="#e5f2df" stroke="#3d8a57" stroke-width="3"/><text x="170" y="226" text-anchor="middle" font-size="24" font-weight="700" fill="#17324d">行政</text><text x="170" y="244" text-anchor="middle" font-size="13" fill="#17324d">執行政策、依法行政</text><rect x="500" y="188" width="180" height="62" rx="12" fill="#fff0d8" stroke="#b8752a" stroke-width="3"/><text x="590" y="226" text-anchor="middle" font-size="24" font-weight="700" fill="#17324d">司法</text><text x="590" y="244" text-anchor="middle" font-size="13" fill="#17324d">審判、保障權利</text><path d="M292 90L225 182" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="220" y="130" font-size="14" fill="#17324d">監督預算</text><path d="M468 90L535 182" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="500" y="130" font-size="14" fill="#17324d">審查合法性</text><path d="M260 218H490" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="375" y="210" text-anchor="middle" font-size="14" fill="#17324d">行政爭訟／制衡</text><text x="380" y="282" text-anchor="middle" font-size="16" font-weight="700" fill="#17324d">三權分工，但彼此不能完全不受監督</text></svg>' },
    14: { kind: 'relationship', title: '民事法律關係：契約如何連到責任？', alt: '契約成立、履行、違約與民事責任的關係圖', note: '這張圖要看的是：誰對誰有權利義務，發生不履行或侵害時，才進入民事責任。', svg: '<svg viewBox="0 0 760 250" role="img" aria-label="契約成立履行違約民事責任關係圖"><defs>' + arrow + '</defs><rect width="760" height="250" rx="16" fill="#fffaf3"/><g font-size="18" font-weight="700" fill="#17324d" text-anchor="middle"><rect x="35" y="75" width="145" height="64" rx="12" fill="#e5f2df" stroke="#3d8a57" stroke-width="3"/><text x="107" y="113">雙方當事人</text><rect x="220" y="75" width="145" height="64" rx="12" fill="#d8edf4" stroke="#1d5f75" stroke-width="3"/><text x="292" y="113">法律行為／契約</text><rect x="405" y="75" width="145" height="64" rx="12" fill="#e9e0f5" stroke="#7653a8" stroke-width="3"/><text x="477" y="113">權利與義務</text><rect x="590" y="28" width="135" height="58" rx="12" fill="#ffe4d6" stroke="#b45b3a" stroke-width="3"/><text x="657" y="63">履行</text><rect x="590" y="142" width="135" height="58" rx="12" fill="#ffe4d6" stroke="#b45b3a" stroke-width="3"/><text x="657" y="177">違約／侵權</text></g><path d="M180 107H215M365 107H400M550 93H580" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/><path d="M550 121H580" stroke="#b45b3a" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="380" y="228" text-anchor="middle" font-size="16" font-weight="700" fill="#17324d">結果可能是損害賠償、返還或其他民事責任</text></svg>' },
    16: { kind: 'chart', title: '供需曲線：均衡、短缺與剩餘', alt: '價格縱軸、數量橫軸的供給曲線與需求曲線，標示均衡點與短缺剩餘區域', note: '這張圖要看的是：曲線交點是均衡；價格低於均衡會出現短缺，高於均衡會出現剩餘。', svg: '<svg viewBox="0 0 760 360" role="img" aria-label="供需曲線圖"><defs>' + arrow + '</defs><rect width="760" height="360" rx="16" fill="#fff"/><path d="M90 300V35M90 300H710" stroke="#17324d" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="42" y="55" font-size="18" fill="#17324d">價格</text><text x="680" y="332" font-size="18" fill="#17324d">數量</text><path d="M145 265L630 75" fill="none" stroke="#b45b3a" stroke-width="5"/><path d="M145 80L630 270" fill="none" stroke="#3d8a57" stroke-width="5"/><text x="585" y="90" font-size="18" font-weight="700" fill="#b45b3a">需求 D</text><text x="585" y="268" font-size="18" font-weight="700" fill="#3d8a57">供給 S</text><circle cx="385" cy="171" r="8" fill="#17324d"/><line x1="385" y1="171" x2="385" y2="300" stroke="#17324d" stroke-dasharray="6 5"/><line x1="90" y1="171" x2="385" y2="171" stroke="#17324d" stroke-dasharray="6 5"/><text x="397" y="163" font-size="17" font-weight="700" fill="#17324d">均衡 E</text><text x="135" y="120" font-size="15" fill="#8b3a2f">價格高：剩餘</text><text x="135" y="250" font-size="15" fill="#3d6d48">價格低：短缺</text><text x="380" y="342" text-anchor="middle" font-size="16" font-weight="700" fill="#17324d">沿曲線移動 ≠ 曲線本身移動</text></svg>' },
    17: { kind: 'chart', title: 'GDP：算入與不算入的對照', alt: 'GDP判斷圖：本期境內新生產的最終商品與服務算入，二手交易與移轉支付不直接算入', note: '這張圖要看的是：先判斷是不是本期、境內、最終的新生產，再判斷是否計入 GDP。', svg: '<svg viewBox="0 0 760 300" role="img" aria-label="GDP算入與不算入對照圖"><rect width="760" height="300" rx="16" fill="#f7fbfe"/><rect x="35" y="35" width="330" height="220" rx="14" fill="#e5f2df" stroke="#3d8a57" stroke-width="3"/><rect x="395" y="35" width="330" height="220" rx="14" fill="#fff0e8" stroke="#b45b3a" stroke-width="3"/><text x="200" y="72" text-anchor="middle" font-size="23" font-weight="700" fill="#235f3b">計入 GDP</text><text x="560" y="72" text-anchor="middle" font-size="23" font-weight="700" fill="#8b3a2f">不直接計入</text><g font-size="17" fill="#17324d"><text x="60" y="115">✓ 本期新生產的麵包</text><text x="60" y="150">✓ 境內提供的演出服務</text><text x="60" y="185">✓ 新造的機器設備</text><text x="60" y="220">✓ 仲介／服務費</text><text x="420" y="115">× 二手商品本身</text><text x="420" y="150">× 政府移轉性支付</text><text x="420" y="185">× 重複計算中間品</text><text x="420" y="220">× 境外生產本身</text></g><text x="380" y="282" text-anchor="middle" font-size="16" font-weight="700" fill="#17324d">GDP = 境內 × 一定期間 × 最終商品與服務的市場價值</text></svg>' },
    30: { kind: 'map', title: '世界大戰與冷戰：陣營地圖＋時間軸', alt: '一戰、二戰與冷戰的簡化世界區域圖，標示主要陣營與重要地點', note: '這張圖要看的是：同一個「陣營」在不同戰爭中成員不同，必須同時看時間、空間與對立關係。', svg: '<svg viewBox="0 0 820 520" role="img" aria-label="一戰二戰冷戰陣營示意地圖與時間軸"><rect width="820" height="520" rx="16" fill="#f7fbfe"/><g font-size="18" font-weight="700" fill="#17324d"><text x="25" y="35">一戰 1914–1918：同盟國 vs 協約國</text><text x="25" y="205">二戰 1939–1945：軸心國 vs 同盟國</text><text x="25" y="375">冷戰：約 1947–1991：美國／北約 vs 蘇聯／華沙公約</text></g><g stroke="#b7c9d7" stroke-width="2"><path d="M30 70 Q150 45 270 78 T510 72 T780 80 L780 165 Q620 145 500 160 T250 150 T30 165Z" fill="#d9edf2"/><path d="M30 240 Q150 215 270 248 T510 242 T780 250 L780 335 Q620 315 500 330 T250 320 T30 335Z" fill="#d9edf2"/><path d="M30 410 Q150 385 270 418 T510 412 T780 420 L780 505 Q620 485 500 500 T250 490 T30 505Z" fill="#d9edf2"/></g><g font-size="15" fill="#17324d"><text x="110" y="110" fill="#9a3f2f">同盟國：德國、奧匈、鄂圖曼、保加利亞</text><text x="110" y="135" fill="#2d6b4a">協約國：英國、法國、俄國；後期美國等</text><circle cx="365" cy="100" r="6" fill="#b45b3a"/><text x="375" y="104">塞拉耶佛</text><line x1="185" y1="145" x2="540" y2="145" stroke="#b45b3a" stroke-width="4"/><text x="550" y="149">西線</text><text x="110" y="280" fill="#9a3f2f">軸心國：德國、義大利、日本</text><text x="110" y="305" fill="#2d6b4a">同盟國：英國、蘇聯、美國、中國等</text><text x="110" y="450" fill="#2f5f99">美國／北約：西方陣營</text><text x="110" y="480" fill="#9a3f2f">蘇聯／華沙公約：東方陣營</text><path d="M430 450H690" stroke="#2f5f99" stroke-width="8"/><path d="M430 480H690" stroke="#9a3f2f" stroke-width="8"/></g><g stroke="#17324d" stroke-width="3"><line x1="40" y1="180" x2="760" y2="180"/><line x1="40" y1="350" x2="760" y2="350"/></g><text x="680" y="510" font-size="15" fill="#17324d">時間由上到下：一戰 → 二戰 → 冷戰</text></svg>' },
    31: { kind: 'terrain', title: 'V 型河谷與稜線：地景和等高線對照', alt: '左側為寫實風格 V 型河谷與河流地景，右側為等高線圖，標示上游下游高低處與稜線', note: '這張圖要看的是：地景的高低起伏會在等高線上留下形狀；河谷向上游呈 V 形，稜線是分水的高處。', svg: '<svg viewBox="0 0 820 430" role="img" aria-label="V型河谷寫實地景與等高線對照圖"><defs><linearGradient id="mountain" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#9bbf91"/><stop offset="1" stop-color="#456f5c"/></linearGradient><linearGradient id="water" x1="0" x2="1"><stop stop-color="#4f9fc1"/><stop offset="1" stop-color="#b7e6ef"/></linearGradient></defs><rect width="820" height="430" rx="16" fill="#f7fbfe"/><rect x="20" y="25" width="370" height="330" rx="14" fill="#d8edf4"/><path d="M20 325 L20 180 L90 110 L150 160 L220 80 L300 160 L390 105 L390 355Z" fill="url(#mountain)"/><path d="M20 280 Q100 245 160 265 Q220 290 290 250 Q340 225 390 245 V355 H20Z" fill="#658b62"/><path d="M205 105 Q215 150 195 190 Q175 230 205 350" fill="none" stroke="url(#water)" stroke-width="12"/><text x="40" y="55" font-size="20" font-weight="700" fill="#17324d">寫實地景</text><text x="255" y="95" font-size="16" fill="#17324d">高處／稜線</text><text x="220" y="350" font-size="16" fill="#17324d">河流</text><text x="45" y="245" font-size="16" fill="#17324d">上游</text><text x="300" y="300" font-size="16" fill="#17324d">下游</text><rect x="410" y="25" width="390" height="330" rx="14" fill="#fff" stroke="#1d5f75" stroke-width="2"/><text x="430" y="55" font-size="20" font-weight="700" fill="#17324d">等高線對照</text><g fill="none" stroke="#7c9eb2" stroke-width="2"><path d="M430 90 Q485 65 540 95 T650 90 T780 105"/><path d="M430 125 Q485 95 540 130 T650 120 T780 145"/><path d="M430 160 Q490 125 545 165 T650 155 T780 185"/><path d="M430 195 Q495 150 550 200 T655 190 T780 225"/><path d="M430 230 Q500 175 555 235 T660 225 T780 270"/><path d="M430 265 Q505 200 560 270 T665 260 T780 310"/></g><path d="M515 75 Q585 160 610 300" fill="none" stroke="#3f8fb0" stroke-width="6"/><path d="M465 100 Q535 185 565 310" fill="none" stroke="#3f8fb0" stroke-width="3" stroke-dasharray="6 5"/><text x="620" y="110" font-size="15" fill="#17324d">稜線：高處</text><text x="625" y="205" font-size="15" fill="#17324d">V 形尖端指向上游</text><text x="625" y="295" font-size="15" fill="#17324d">河谷：等高線向上游彎</text><text x="410" y="390" font-size="16" font-weight="700" fill="#17324d">判讀：線越密坡越陡；先找高低，再找水流方向</text></svg>' },
    36: { kind: 'gis', title: 'GIS：Layer、Buffer、Overlay 的空間關係', alt: 'GIS示意圖：道路 layer、學校 500 公尺 buffer 與坡度 overlay 疊合找出適合區域', note: '這張圖要看的是：GIS 把不同空間資料放在同一座標上，再用 buffer 與 overlay 找出同時符合條件的區域。', svg: '<svg viewBox="0 0 820 400" role="img" aria-label="GIS layer buffer overlay空間關係圖"><rect width="820" height="400" rx="16" fill="#f7fbfe"/><text x="25" y="35" font-size="21" font-weight="700" fill="#17324d">同一張地圖上的三個圖層</text><g stroke="#c5d5df" stroke-width="2"><path d="M30 70H790M30 130H790M30 190H790M30 250H790M30 310H790"/><path d="M100 55V350M200 55V350M300 55V350M400 55V350M500 55V350M600 55V350M700 55V350"/></g><path d="M70 330 Q220 250 340 285 T560 190 T770 90" fill="none" stroke="#3d8a57" stroke-width="12"/><text x="60" y="360" font-size="16" fill="#2d6b4a">Layer：道路／河流</text><circle cx="420" cy="210" r="105" fill="#5c9ec8" fill-opacity=".18" stroke="#2f6f9b" stroke-width="3" stroke-dasharray="8 6"/><circle cx="420" cy="210" r="10" fill="#b45b3a"/><text x="440" y="215" font-size="16" fill="#8b3a2f">學校</text><text x="420" y="105" text-anchor="middle" font-size="16" fill="#2f6f9b">Buffer：500 m</text><path d="M520 115 L735 115 L735 300 L520 300Z" fill="#d3e6be" fill-opacity=".55" stroke="#6b8c49" stroke-width="3"/><text x="625" y="145" text-anchor="middle" font-size="16" fill="#4c6c2e">Layer：低坡度區</text><path d="M340 175 Q420 135 505 175 L535 245 Q440 285 350 250Z" fill="#f5c76b" fill-opacity=".7" stroke="#b8752a" stroke-width="3"/><text x="430" y="270" text-anchor="middle" font-size="16" fill="#8b5a17">Overlay：同時符合條件</text><text x="30" y="390" font-size="16" font-weight="700" fill="#17324d">輸出：在學校 500m 內、低坡度且可由道路到達的區域</text></svg>' }
  };
  function makeVisual(kind, title, alt, note, body, viewBox) {
    return { kind: kind, title: title, alt: alt, note: note, svg: '<svg viewBox="' + (viewBox || '0 0 760 260') + '" role="img" aria-label="' + alt + '"><defs>' + arrow + '</defs><rect width="100%" height="100%" rx="16" fill="#f7fbfe"/>' + body + '</svg>' };
  }
  var extras = {
    1: makeVisual('chart', '題型分布：先看題目要你做什麼', '選擇題、題組與非選題的題型分布示意圖', '這張圖要看的是：先辨認題型，再選擇讀材料、比選項或寫採分點的策略。', '<g font-size="20" font-weight="700" fill="#17324d"><text x="80" y="62">選擇題</text><text x="80" y="122">題組</text><text x="80" y="182">非選題</text></g><g><rect x="190" y="35" width="430" height="35" rx="10" fill="#83b9c9"/><rect x="190" y="95" width="330" height="35" rx="10" fill="#9acb9f"/><rect x="190" y="155" width="220" height="35" rx="10" fill="#efbe78"/></g><text x="190" y="232" font-size="17" fill="#17324d">題幹 → 證據 → 作答形式</text>'),
    2: makeVisual('annotation', '長題幹標記：把資訊分成三層', '長題幹中背景、關鍵證據與問題要求的標記示意圖', '這張圖要看的是：背景先略讀，證據要圈出，最後回頭確認問題問哪一層。', '<rect x="55" y="45" width="650" height="120" rx="12" fill="#fff" stroke="#9cb8c6" stroke-width="3"/><text x="80" y="82" font-size="18" fill="#7d8e99">背景：時間、地點、人物……</text><rect x="75" y="95" width="390" height="28" rx="7" fill="#ffe29b"/><text x="85" y="116" font-size="18" fill="#17324d">證據：材料中的關鍵變化</text><rect x="480" y="95" width="200" height="28" rx="7" fill="#bce5c5"/><text x="495" y="116" font-size="18" fill="#17324d">問題要求</text><text x="80" y="215" font-size="19" font-weight="700" fill="#17324d">讀法：背景定位 → 證據判讀 → 對準問題</text>'),
    3: makeVisual('chart', '圖表閱讀：先找座標、趨勢與例外', '折線圖閱讀示範，標出座標、趨勢與例外點', '這張圖要看的是：不要只看最高點；先讀單位，再找整體趨勢與反常點。', '<path d="M100 210V45M100 210H690" stroke="#17324d" stroke-width="3"/><path d="M130 180 L240 160 L350 125 L460 140 L570 85 L660 100" fill="none" stroke="#2f7690" stroke-width="6"/><circle cx="460" cy="140" r="8" fill="#b45b3a"/><text x="112" y="55" font-size="17" fill="#17324d">數值</text><text x="625" y="235" font-size="17" fill="#17324d">時間</text><text x="475" y="132" font-size="16" fill="#8b3a2f">例外點</text><text x="130" y="275" font-size="19" font-weight="700" fill="#17324d">判讀順序：單位 → 趨勢 → 例外 → 原因</text>'),
    4: makeVisual('diagram', '非選採分點：把答案拆成可檢查的零件', '非選題答案由主張、證據、解釋與結論組成的拆解圖', '這張圖要看的是：非選不是寫越長越好，而是每個採分點都要有主張與材料證據。', '<g font-size="19" font-weight="700" text-anchor="middle" fill="#17324d"><rect x="55" y="75" width="145" height="70" rx="12" fill="#d8edf4"/><text x="127" y="117">主張</text><rect x="225" y="75" width="145" height="70" rx="12" fill="#e5f2df"/><text x="297" y="117">證據</text><rect x="395" y="75" width="145" height="70" rx="12" fill="#fff0d8"/><text x="467" y="117">解釋</text><rect x="565" y="75" width="145" height="70" rx="12" fill="#e9e0f5"/><text x="637" y="117">結論</text></g><path d="M200 110H220M370 110H390M540 110H560" stroke="#1d5f75" stroke-width="4" marker-end="url(#visual-arrow)"/><text x="380" y="205" text-anchor="middle" font-size="18" fill="#17324d">每一段都回答：所以呢？為什麼？</text>', '0 0 760 250'),
    5: makeVisual('scene', '社會不平等：同一條起跑線真的一樣嗎？', '不同資源起點造成機會差異的生活情境圖', '這張圖要看的是：不平等不只在結果，也可能發生在資源、機會與制度入口。', '<path d="M70 210H690" stroke="#17324d" stroke-width="6"/><g fill="#d8edf4" stroke="#1d5f75" stroke-width="3"><circle cx="160" cy="120" r="32"/><circle cx="380" cy="120" r="32"/><circle cx="600" cy="120" r="32"/></g><path d="M130 155L105 205M190 155L215 205M350 155L350 205M410 155L410 205M570 155L520 205M630 155L680 205" stroke="#17324d" stroke-width="7"/><text x="160" y="55" text-anchor="middle" font-size="18" fill="#17324d">資源較少</text><text x="380" y="55" text-anchor="middle" font-size="18" fill="#17324d">制度支持</text><text x="600" y="55" text-anchor="middle" font-size="18" fill="#17324d">資源較多</text><text x="380" y="242" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">看差異來源，不只比較最後名次</text>'),
    7: makeVisual('comparison', '規範判斷：法律、道德、習俗分開看', '法律規範、道德規範與習俗規範的三欄比較圖', '這張圖要看的是：違反後由誰處理、是否有國家強制力，是分辨法律的重要線索。', '<g font-size="19" text-anchor="middle" fill="#17324d"><rect x="55" y="50" width="195" height="140" rx="12" fill="#d8edf4"/><rect x="282" y="50" width="195" height="140" rx="12" fill="#e5f2df"/><rect x="509" y="50" width="195" height="140" rx="12" fill="#fff0d8"/><text x="152" y="85" font-weight="700">法律</text><text x="152" y="125">國家制定</text><text x="152" y="158">可強制執行</text><text x="380" y="85" font-weight="700">道德</text><text x="380" y="125">良心／社會評價</text><text x="380" y="158">不一定有公權力</text><text x="607" y="85" font-weight="700">習俗</text><text x="607" y="125">群體慣例</text><text x="607" y="158">因地方而不同</text></g>'),
    8: makeVisual('network', '假訊息傳播：轉發前先停一下', '訊息從來源經由社群轉發到大眾的傳播網絡圖', '這張圖要看的是：來源不等於證據；轉發越多也不代表內容越真。', '<g fill="#d8edf4" stroke="#1d5f75" stroke-width="3"><circle cx="110" cy="120" r="40"/><circle cx="330" cy="75" r="35"/><circle cx="330" cy="170" r="35"/><circle cx="570" cy="55" r="30"/><circle cx="570" cy="135" r="30"/><circle cx="570" cy="215" r="30"/></g><text x="110" y="126" text-anchor="middle" font-size="17" fill="#17324d">來源</text><text x="330" y="81" text-anchor="middle" font-size="16" fill="#17324d">轉發 A</text><text x="330" y="176" text-anchor="middle" font-size="16" fill="#17324d">轉發 B</text><text x="570" y="61" text-anchor="middle" font-size="15" fill="#17324d">群組</text><text x="570" y="141" text-anchor="middle" font-size="15" fill="#17324d">朋友</text><text x="570" y="221" text-anchor="middle" font-size="15" fill="#17324d">大眾</text><path d="M150 105L292 82M150 135L292 163M365 75L540 55M365 90L540 135M365 180L540 215" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/><text x="380" y="245" text-anchor="middle" font-size="18" font-weight="700" fill="#8b3a2f">查來源、日期、證據，再分享</text>'),
    9: makeVisual('relationship', '公民參與：從表達到共同決策', '投票、公共討論、提案與監督等公民參與方式圖', '這張圖要看的是：公民參與不只有投票，也包含形成意見、提出方案與監督執行。', '<circle cx="380" cy="130" r="75" fill="#d8edf4" stroke="#1d5f75" stroke-width="3"/><text x="380" y="137" text-anchor="middle" font-size="23" font-weight="700" fill="#17324d">公共決策</text><g font-size="18" text-anchor="middle" fill="#17324d"><text x="380" y="35">投票</text><text x="675" y="137">監督</text><text x="380" y="245">提案</text><text x="85" y="137">討論</text></g><path d="M380 55V75M455 130H600M380 205V185M305 130H160" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/>'),
    11: makeVisual('chart', '選舉制度：票數如何轉成席次', '單一選區與比例代表席次轉換示意圖', '這張圖要看的是：選票被轉成席次的規則不同，會影響代表性與政黨競爭。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="55" y="55" width="290" height="135" rx="12" fill="#d8edf4"/><text x="200" y="90" font-weight="700">單一選區</text><text x="200" y="130">一區一席</text><text x="200" y="165">最高票者當選</text><rect x="415" y="55" width="290" height="135" rx="12" fill="#e5f2df"/><text x="560" y="90" font-weight="700">比例代表</text><text x="560" y="130">政黨票分配</text><text x="560" y="165">席次較貼近票率</text></g><text x="380" y="235" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">判讀：代表性與治理穩定的取捨</text>'),
    12: makeVisual('scene', '基本權：抽象權利要落在生活裡', '受教育、表意與人身自由等基本權生活情境卡', '這張圖要看的是：先辨認國家限制的是哪一項權利，再檢查限制是否有法律依據與必要性。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="55" y="55" width="195" height="125" rx="14" fill="#d8edf4"/><text x="152" y="95" font-weight="700">表意自由</text><text x="152" y="135">發表意見</text><rect x="282" y="55" width="195" height="125" rx="14" fill="#e5f2df"/><text x="380" y="95" font-weight="700">受教權</text><text x="380" y="135">接受基本教育</text><rect x="509" y="55" width="195" height="125" rx="14" fill="#fff0d8"/><text x="607" y="95" font-weight="700">人身自由</text><text x="607" y="135">不被任意拘束</text></g><text x="380" y="230" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">權利名稱 → 生活情境 → 合法限制</text>'),
    13: makeVisual('diagram', '比例原則：限制權利要過三關', '比例原則適當性、必要性與衡量性的判斷圖', '這張圖要看的是：國家限制權利時，手段要有用、不能有更小侵害，利益也要值得。', '<g font-size="19" font-weight="700" text-anchor="middle" fill="#17324d"><rect x="60" y="70" width="180" height="80" rx="12" fill="#d8edf4"/><text x="150" y="118">適當性</text><rect x="290" y="70" width="180" height="80" rx="12" fill="#e5f2df"/><text x="380" y="118">必要性</text><rect x="520" y="70" width="180" height="80" rx="12" fill="#fff0d8"/><text x="610" y="118">衡量性</text></g><path d="M240 110H280M470 110H510" stroke="#1d5f75" stroke-width="4" marker-end="url(#visual-arrow)"/><text x="380" y="205" text-anchor="middle" font-size="18" fill="#17324d">有用 → 最小侵害 → 利益與代價相稱</text>'),
    15: makeVisual('scene', '機會成本：選了這個，就放棄下一個最好的', '學生在讀書、打工與休息之間做選擇的機會成本情境圖', '這張圖要看的是：機會成本不是所有放棄的東西，而是放棄選項中價值最高的那一個。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="55" y="65" width="180" height="110" rx="14" fill="#d8edf4"/><text x="145" y="105" font-weight="700">讀書</text><text x="145" y="145">得到成績</text><rect x="290" y="65" width="180" height="110" rx="14" fill="#e5f2df"/><text x="380" y="105" font-weight="700">打工</text><text x="380" y="145">得到收入</text><rect x="525" y="65" width="180" height="110" rx="14" fill="#fff0d8"/><text x="615" y="105" font-weight="700">休息</text><text x="615" y="145">得到恢復</text></g><path d="M235 120H275M470 120H510" stroke="#b45b3a" stroke-width="3" stroke-dasharray="8 5"/><text x="380" y="225" text-anchor="middle" font-size="18" font-weight="700" fill="#8b3a2f">若選讀書，機會成本看打工或休息中較好的選項</text>'),
    18: makeVisual('chart', '比較利益：專業化後再交換', '兩地生產選擇與交換利益示意圖', '這張圖要看的是：比較利益看機會成本，不是只看誰做得比較快。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="55" y="55" width="250" height="125" rx="12" fill="#d8edf4"/><text x="180" y="90" font-weight="700">甲地</text><text x="180" y="125">米：機會成本低</text><text x="180" y="155">專業化生產米</text><rect x="455" y="55" width="250" height="125" rx="12" fill="#e5f2df"/><text x="580" y="90" font-weight="700">乙地</text><text x="580" y="125">布：機會成本低</text><text x="580" y="155">專業化生產布</text></g><path d="M315 118H445" stroke="#1d5f75" stroke-width="5" marker-end="url(#visual-arrow)"/><text x="380" y="220" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">交換後：兩地都能消費更多</text>'),
    19: makeVisual('sources', '史料種類：誰留下了什麼證據？', '文字、圖像、器物與口述史料的分類圖', '這張圖要看的是：不同史料能回答的問題不同，不能把單一來源當成全部真相。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="50" y="65" width="145" height="115" rx="12" fill="#d8edf4"/><text x="122" y="105" font-weight="700">文字</text><text x="122" y="145">公文、日記</text><rect x="220" y="65" width="145" height="115" rx="12" fill="#e5f2df"/><text x="292" y="105" font-weight="700">圖像</text><text x="292" y="145">照片、地圖</text><rect x="390" y="65" width="145" height="115" rx="12" fill="#fff0d8"/><text x="462" y="105" font-weight="700">器物</text><text x="462" y="145">遺址、工具</text><rect x="560" y="65" width="145" height="115" rx="12" fill="#e9e0f5"/><text x="632" y="105" font-weight="700">口述</text><text x="632" y="145">記憶、訪談</text></g>'),
    20: makeVisual('comparison', '同一事件：不同位置會看見不同重點', '政府、居民與後來研究者對同一事件的觀點比較圖', '這張圖要看的是：史觀不同不代表誰一定錯，而要回到立場、材料與時代脈絡。', '<g font-size="18" text-anchor="middle" fill="#17324d"><circle cx="380" cy="125" r="58" fill="#d8edf4" stroke="#1d5f75" stroke-width="3"/><text x="380" y="132">同一事件</text><rect x="55" y="55" width="190" height="80" rx="12" fill="#fff0d8"/><text x="150" y="103">政府：秩序</text><rect x="515" y="55" width="190" height="80" rx="12" fill="#e5f2df"/><text x="610" y="103">居民：生活</text><rect x="285" y="205" width="190" height="55" rx="12" fill="#e9e0f5"/><text x="380" y="240">研究者：比較證據</text></g><path d="M245 95L320 115M515 95L440 115M380 183V200" stroke="#1d5f75" stroke-width="3" marker-end="url(#visual-arrow)"/>'),
    21: makeVisual('map', '臺灣史：政權更替與海上位置', '臺灣島與政權時序的歷史地圖時間軸', '這張圖要看的是：臺灣位在東亞海域交通線上，政權變動常和海上貿易與區域競爭連在一起。', '<path d="M230 55 Q300 30 350 80 Q390 145 335 215 Q285 250 245 185 Q200 120 230 55Z" fill="#d8edf4" stroke="#1d5f75" stroke-width="4"/><text x="280" y="140" font-size="22" font-weight="700" fill="#17324d">臺灣</text><path d="M430 75H700" stroke="#1d5f75" stroke-width="5"/><g font-size="17" fill="#17324d"><text x="430" y="55">史前</text><text x="490" y="55">荷治／西治</text><text x="585" y="55">鄭氏</text><text x="650" y="55">清領</text><text x="430" y="115">位置：東亞海域的島嶼節點</text><text x="430" y="160">重點：政權、貿易、族群互動</text></g>'),
    22: makeVisual('map', '日治臺灣：殖民治理與空間分區', '日治臺灣南北縱貫交通線與治理空間示意圖', '這張圖要看的是：殖民統治同時改變行政、交通與產業空間，也伴隨不平等的權力關係。', '<path d="M180 40 Q240 25 275 85 L250 220 Q205 260 175 190Z" fill="#d8edf4" stroke="#1d5f75" stroke-width="4"/><path d="M220 55L215 215" stroke="#b45b3a" stroke-width="6"/><text x="150" y="285" font-size="18" fill="#17324d">縱貫線：治理與物資運輸</text><g font-size="18" fill="#17324d"><text x="355" y="80">北部：行政與港口</text><text x="355" y="135">中部：農業與交通</text><text x="355" y="190">南部：糖業與港運</text></g>'),
    23: makeVisual('timeline', '戰後臺灣：接收、戒嚴到民主化', '1945、二二八、戒嚴、解嚴與民主化的時間軸', '這張圖要看的是：戰後政治變化不是單一事件，而是接收、威權、社會運動與制度改革的長期過程。', '<path d="M100 130H680" stroke="#1d5f75" stroke-width="6"/><g fill="#fff" stroke="#1d5f75" stroke-width="4"><circle cx="150" cy="130" r="14"/><circle cx="285" cy="130" r="14"/><circle cx="420" cy="130" r="14"/><circle cx="555" cy="130" r="14"/><circle cx="665" cy="130" r="14"/></g><g font-size="17" text-anchor="middle" fill="#17324d"><text x="150" y="85">1945 接收</text><text x="285" y="190">1947 二二八</text><text x="420" y="85">戒嚴</text><text x="555" y="190">1987 解嚴</text><text x="665" y="85">民主化</text></g>'),
    24: makeVisual('diagram', '中國制度演變：中央如何管理地方？', '秦漢到後世中央集權與地方制度的比較圖', '這張圖要看的是：制度題先問權力集中在哪裡，再比較中央與地方的分工。', '<g font-size="18" text-anchor="middle" fill="#17324d"><rect x="55" y="55" width="190" height="125" rx="12" fill="#d8edf4"/><text x="150" y="92" font-weight="700">郡縣</text><text x="150" y="130">中央任命地方官</text><text x="150" y="160">集權較強</text><rect x="285" y="55" width="190" height="125" rx="12" fill="#e5f2df"/><text x="380" y="92" font-weight="700">分封</text><text x="380" y="130">親族／諸侯治理</text><text x="380" y="160">地方自主較多</text><rect x="515" y="55" width="190" height="125" rx="12" fill="#fff0d8"/><text x="610" y="92" font-weight="700">科舉官僚</text><text x="610" y="130">考試選任人才</text><text x="610" y="160">制度化治理</text></g>'),
    25: makeVisual('map', '人口與經濟重心：由北向南、由內向海', '中國歷史人口與經濟重心南移的地圖箭頭示意', '這張圖要看的是：人口、稻作、河運與商業條件會一起推動經濟重心移動。', '<path d="M120 65 Q250 35 370 80 Q480 40 620 95 L650 210 Q450 255 250 225 L115 180Z" fill="#d8edf4" stroke="#1d5f75" stroke-width="3"/><path d="M250 85 Q370 125 520 190" stroke="#b45b3a" stroke-width="8" fill="none" marker-end="url(#visual-arrow)"/><text x="175" y="75" font-size="18" fill="#17324d">較早重心</text><text x="520" y="225" font-size="18" fill="#17324d">江南／沿海</text><text x="350" y="285" font-size="18" font-weight="700" fill="#17324d">水利、稻作、交通與市場共同作用</text>'),
    26: makeVisual('timeline', '清末變局：外力與改革交疊', '鴉片戰爭、洋務、甲午、戊戌、辛亥革命的時間軸', '這張圖要看的是：清末不是一次改革就改變，而是外力衝擊與內部改革反覆累積。', '<path d="M80 135H700" stroke="#1d5f75" stroke-width="6"/><g font-size="16" text-anchor="middle" fill="#17324d"><circle cx="125" cy="135" r="12" fill="#b45b3a"/><text x="125" y="95">1840 鴉片戰爭</text><circle cx="260" cy="135" r="12" fill="#3d8a57"/><text x="260" y="190">洋務</text><circle cx="395" cy="135" r="12" fill="#b45b3a"/><text x="395" y="95">1894 甲午</text><circle cx="530" cy="135" r="12" fill="#3d8a57"/><text x="530" y="190">戊戌</text><circle cx="665" cy="135" r="12" fill="#b45b3a"/><text x="665" y="95">1911 辛亥</text></g>'),
    27: makeVisual('map', '宗教與文明交流：沿著路線擴散', '佛教、伊斯蘭與基督宗教沿陸路與海路擴散的示意地圖', '這張圖要看的是：宗教傳播不是憑空跳躍，而是跟商路、帝國與人口流動一起移動。', '<path d="M85 170 Q220 75 380 145 T690 100" fill="none" stroke="#b45b3a" stroke-width="7" marker-end="url(#visual-arrow)"/><path d="M90 205 Q260 245 430 190 T690 210" fill="none" stroke="#2f7690" stroke-width="7" marker-end="url(#visual-arrow)"/><g font-size="18" fill="#17324d"><text x="80" y="125">起源地</text><text x="250" y="105">陸路商道</text><text x="470" y="135">城市</text><text x="555" y="245">海路港口</text></g><text x="380" y="285" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">交流 = 人、貨物、信仰與技術同時流動</text>'),
    28: makeVisual('map', '殖民帝國與貿易航線：海洋連起世界', '歐洲殖民帝國與大西洋、印度洋、太平洋貿易航線示意圖', '這張圖要看的是：殖民不只佔領土地，也重組資源、勞動與全球貿易路線。', '<path d="M90 180 Q250 90 420 170 T690 110" fill="none" stroke="#b45b3a" stroke-width="7" marker-end="url(#visual-arrow)"/><path d="M120 230 Q320 245 500 205 T700 235" fill="none" stroke="#2f7690" stroke-width="7" marker-end="url(#visual-arrow)"/><g fill="#d8edf4" stroke="#1d5f75" stroke-width="3"><circle cx="120" cy="150" r="32"/><circle cx="390" cy="165" r="32"/><circle cx="670" cy="110" r="32"/></g><g font-size="17" text-anchor="middle" fill="#17324d"><text x="120" y="155">歐洲</text><text x="390" y="170">非洲／印度洋</text><text x="670" y="115">亞洲</text></g>'),
    29: makeVisual('timeline', '革命與權利：從主張到制度', '美國獨立、法國革命、民族主義與人權主張的時間軸', '這張圖要看的是：革命把權力正當性從君主逐步拉向人民、憲法與公民權利。', '<path d="M90 135H690" stroke="#1d5f75" stroke-width="6"/><g font-size="17" text-anchor="middle" fill="#17324d"><circle cx="145" cy="135" r="13" fill="#b45b3a"/><text x="145" y="92">美國獨立</text><circle cx="320" cy="135" r="13" fill="#b45b3a"/><text x="320" y="190">法國革命</text><circle cx="495" cy="135" r="13" fill="#3d8a57"/><text x="495" y="92">民族主義</text><circle cx="650" cy="135" r="13" fill="#3d8a57"/><text x="650" y="190">公民權利</text></g>'),
    32: makeVisual('hydrology', '氣候與流域：水從高處往低處走', '山地、降雨、河流與洪水風險的剖面示意圖', '這張圖要看的是：降雨落在集水區後，會沿坡面匯入河道；地形與土地利用一起影響災害。', '<path d="M40 220 L180 95 L300 220 L420 125 L540 220 L680 75 L740 220Z" fill="#c4ddbd" stroke="#3d6d48" stroke-width="3"/><path d="M80 55 Q250 20 420 60 T720 45" fill="none" stroke="#5c9ec8" stroke-width="5"/><path d="M300 120 Q340 175 380 220" stroke="#3f8fb0" stroke-width="10" fill="none"/><path d="M380 220 Q500 190 650 215" stroke="#3f8fb0" stroke-width="10" fill="none"/><text x="85" y="65" font-size="18" fill="#17324d">降雨</text><text x="390" y="155" font-size="18" fill="#17324d">集水區</text><text x="510" y="250" font-size="18" fill="#17324d">下游洪水風險</text>'),
    33: makeVisual('chart', '人口金字塔：年齡結構會說話', '人口金字塔與人口遷移箭頭示意圖', '這張圖要看的是：底部寬表示年輕人口多，頂部變寬代表高齡化；遷移會改變地方的年齡結構。', '<path d="M380 45V230M380 55H130M380 55H630" stroke="#17324d" stroke-width="3"/><g fill="#83b9c9"><rect x="220" y="70" width="160" height="25"/><rect x="175" y="100" width="205" height="25"/><rect x="125" y="130" width="255" height="25"/><rect x="85" y="160" width="295" height="25"/></g><g fill="#9acb9f"><rect x="380" y="70" width="145" height="25"/><rect x="380" y="100" width="190" height="25"/><rect x="380" y="130" width="230" height="25"/><rect x="380" y="160" width="270" height="25"/></g><text x="380" y="265" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">人口結構 + 遷移 = 地方需求改變</text>'),
    34: makeVisual('map', '產業區位：成本與市場把工廠拉到不同地方', '農業、工業與服務業區位條件比較圖', '這張圖要看的是：區位不是只看距離，還要比較原料、勞動、運輸、土地與市場。', '<g fill="#d8edf4" stroke="#1d5f75" stroke-width="3"><circle cx="150" cy="125" r="55"/><circle cx="380" cy="125" r="55"/><circle cx="610" cy="125" r="55"/></g><g font-size="18" text-anchor="middle" fill="#17324d"><text x="150" y="120" font-weight="700">農業</text><text x="150" y="150">土地／水</text><text x="380" y="120" font-weight="700">工業</text><text x="380" y="150">原料／運輸</text><text x="610" y="120" font-weight="700">服務</text><text x="610" y="150">市場／人口</text></g><path d="M205 125H325M435 125H555" stroke="#1d5f75" stroke-width="4" marker-end="url(#visual-arrow)"/>'),
    35: makeVisual('map', '地緣政治：航道與節點會改變權力', '海上航道、港口節點與國家勢力範圍示意圖', '這張圖要看的是：控制港口、海峽與航道，常會影響貿易安全與國際政治。', '<path d="M65 75 Q220 45 350 125 T700 80" fill="none" stroke="#2f7690" stroke-width="10"/><g fill="#d8edf4" stroke="#1d5f75" stroke-width="3"><circle cx="180" cy="85" r="28"/><circle cx="410" cy="145" r="28"/><circle cx="635" cy="95" r="28"/></g><g font-size="17" text-anchor="middle" fill="#17324d"><text x="180" y="90">港口 A</text><text x="410" y="150">海峽 B</text><text x="635" y="100">港口 C</text></g><path d="M110 210H650" stroke="#b45b3a" stroke-width="8"/><text x="380" y="250" text-anchor="middle" font-size="18" font-weight="700" fill="#17324d">節點越重要，競爭與合作越集中</text>'),
    30: makeVisual('map', '世界大戰與冷戰：地理位置不能混淆', '一戰、二戰與冷戰三張地理區域地圖，標示主要國家與陣營', '這張圖要看的是：先看國家在哪裡，再看它在不同年代加入哪個陣營。', '<g font-size="16" fill="#17324d"><rect x="20" y="25" width="250" height="205" rx="12" fill="#eef6f8" stroke="#9cb8c6"/><rect x="285" y="25" width="250" height="205" rx="12" fill="#eef6f8" stroke="#9cb8c6"/><rect x="550" y="25" width="250" height="205" rx="12" fill="#eef6f8" stroke="#9cb8c6"/></g><g fill="#b45b3a" stroke="#8b3a2f" stroke-width="2"><path d="M55 90L95 65L140 75L170 110L135 145L85 135Z"/><circle cx="112" cy="105" r="7"/><path d="M320 90L360 70L405 80L445 120L420 150L360 140Z"/><path d="M585 80L635 55L675 75L700 120L670 155L610 140Z"/></g><g fill="#3d8a57" stroke="#2d6b4a" stroke-width="2"><path d="M180 70L215 80L240 115L210 150L175 125Z"/><path d="M455 75L500 85L520 125L480 155L445 130Z"/><path d="M710 65L760 80L785 125L750 160L705 135Z"/></g><g font-size="16" font-weight="700" fill="#17324d"><text x="35" y="52">一戰 1914–1918</text><text x="45" y="185">紅：同盟國／綠：協約國</text><text x="300" y="52">二戰 1939–1945</text><text x="300" y="185">紅：軸心國／綠：同盟國</text><text x="565" y="52">冷戰 約 1947–1991</text><text x="565" y="185">紅：華沙公約／綠：NATO</text></g><g font-size="14" fill="#17324d"><text x="70" y="165">德國、奧匈</text><text x="160" y="165">英法俄</text><text x="335" y="165">德義日</text><text x="440" y="165">美蘇中英</text><text x="600" y="210">美國／北約</text><text x="600" y="225">蘇聯／華沙公約</text></g>', '0 0 820 260'),
    31: makeVisual('terrain', 'V 型河谷：照片與等高線對照', '本地 CC BY-SA V 型河谷照片與等高線 V 字對照，標示上游下游河流高低處', '這張圖要看的是：先從照片找河流與高低，再用等高線的 V 字尖端判斷上游方向。', '<image href="assets/visuals/l31-v-shaped-valley.jpg" x="20" y="25" width="360" height="205" preserveAspectRatio="xMidYMid slice"/><text x="35" y="52" font-size="20" font-weight="700" fill="#fff">真實 V 型河谷照片</text><text x="70" y="220" font-size="16" font-weight="700" fill="#fff">河流／下游</text><text x="300" y="90" font-size="16" font-weight="700" fill="#fff">高處</text><rect x="405" y="25" width="375" height="205" rx="12" fill="#fff" stroke="#1d5f75" stroke-width="3"/><g fill="none" stroke="#7c9eb2" stroke-width="3"><path d="M430 65 Q500 35 560 65 T760 70"/><path d="M430 100 Q500 65 560 100 T760 110"/><path d="M430 135 Q500 95 560 135 T760 155"/><path d="M430 170 Q500 125 560 170 T760 205"/></g><path d="M520 50 Q595 125 625 215" stroke="#3f8fb0" stroke-width="8" fill="none"/><text x="585" y="55" font-size="16" fill="#17324d">高／稜線</text><text x="650" y="145" font-size="16" fill="#17324d">V 尖端→上游</text><text x="430" y="260" font-size="18" font-weight="700" fill="#17324d">等高線密：坡陡；河流：高處流向低處</text>', '0 0 820 300'),
    32: makeVisual('hydrology', '氣候與流域：水從高處往低處走', '山地、降雨、河流與洪水風險的剖面示意圖', '這張圖要看的是：降雨落在集水區後，會沿坡面匯入河道；地形與土地利用一起影響災害。', '<path d="M40 220 L180 95 L300 220 L420 125 L540 220 L680 75 L740 220Z" fill="#c4ddbd" stroke="#3d6d48" stroke-width="3"/><path d="M80 55 Q250 20 420 60 T720 45" fill="none" stroke="#5c9ec8" stroke-width="5"/><path d="M300 120 Q340 175 380 220" stroke="#3f8fb0" stroke-width="10" fill="none"/><path d="M380 220 Q500 190 650 215" stroke="#3f8fb0" stroke-width="10" fill="none"/><text x="85" y="65" font-size="18" fill="#17324d">降雨</text><text x="390" y="155" font-size="18" fill="#17324d">集水區</text><text x="510" y="250" font-size="18" fill="#17324d">下游洪水風險</text>'),
     36: base[36]
  };
  extras[16] = base[16];
  extras[17] = base[17];
  extras[36] = base[36];
  extras[16].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-chart-card"><h4>手機版供需曲線</h4><svg class="mobile-chart" viewBox="0 0 360 260" role="img" aria-label="手機版供需曲線，標示價格、數量、供給 S、需求 D 與均衡 E"><path d="M48 218V24M48 218H340" stroke="#17324d" stroke-width="3"/><path d="M85 190L300 48" fill="none" stroke="#b45b3a" stroke-width="5"/><path d="M85 58L300 194" fill="none" stroke="#3d8a57" stroke-width="5"/><circle cx="192" cy="120" r="7" fill="#17324d"/><path d="M192 120V218M48 120H192" stroke="#17324d" stroke-dasharray="6 5"/><text x="22" y="34" font-size="18" fill="#17324d">價格</text><text x="300" y="246" font-size="18" fill="#17324d">數量</text><text x="300" y="52" font-size="19" font-weight="700" fill="#b45b3a">D 需求</text><text x="300" y="198" font-size="19" font-weight="700" fill="#3d8a57">S 供給</text><text x="201" y="112" font-size="18" font-weight="700" fill="#17324d">E 均衡</text></svg><p>交點 E 是均衡；價格低於均衡容易短缺，高於均衡容易剩餘。</p></section></div>';
  extras[17].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-gdp-card include"><h4>計入 GDP</h4><p>本期、境內、新生產的最終商品與服務。</p><ul><li>新做好的麵包</li><li>本地演出服務</li><li>新造的機器</li></ul></section><section class="visual-gdp-card exclude"><h4>不直接計入 GDP</h4><p>不是本期境內新生產，或會重複計算的項目。</p><ul><li>二手商品本身</li><li>移轉性支付</li><li>中間產品重複價值</li></ul></section></div>';
  extras[36].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-spatial-card"><h4>Layer｜圖層</h4><svg class="mobile-spatial" viewBox="0 0 340 120" role="img" aria-label="GIS 道路與河流圖層"><path d="M20 100 Q100 65 170 78 T320 25" fill="none" stroke="#3d8a57" stroke-width="11"/><path d="M30 20L300 105" stroke="#b45b3a" stroke-width="4" stroke-dasharray="8 6"/><text x="20" y="116" font-size="18" fill="#17324d">道路／河流</text></svg><p>先把道路、河流、學校等資料分成不同圖層。</p></section><section class="visual-spatial-card"><h4>Buffer｜環域</h4><svg class="mobile-spatial" viewBox="0 0 340 120" role="img" aria-label="GIS 學校五百公尺環域"><circle cx="170" cy="60" r="45" fill="#5c9ec8" fill-opacity=".2" stroke="#2f6f9b" stroke-width="4" stroke-dasharray="8 6"/><circle cx="170" cy="60" r="9" fill="#b45b3a"/><text x="135" y="66" font-size="17" fill="#17324d">學校</text><text x="220" y="48" font-size="17" fill="#2f6f9b">500 m</text></svg><p>用距離畫出「學校周邊 500 公尺」範圍。</p></section><section class="visual-spatial-card"><h4>Overlay｜疊圖</h4><svg class="mobile-spatial" viewBox="0 0 340 120" role="img" aria-label="GIS 環域與低坡度區疊圖"><rect x="35" y="22" width="175" height="78" fill="#d3e6be" stroke="#6b8c49" stroke-width="3"/><circle cx="185" cy="62" r="45" fill="#5c9ec8" fill-opacity=".35" stroke="#2f6f9b" stroke-width="3"/><text x="52" y="50" font-size="17" fill="#4c6c2e">低坡度區</text><text x="150" y="106" font-size="17" fill="#17324d">共同區域</text></svg><p>最後找出同時符合多個條件的共同區域。</p></section></div>';
  extras[30] = makeVisual('map', '世界大戰與冷戰：可辨識地理位置的陣營地圖', '一戰、二戰與冷戰的簡化地理位置地圖，標示主要國家、陣營與重要地點', '這張圖要看的是：先用國家相對位置定位，再比較不同年代的陣營。', '<g font-family="sans-serif"><rect x="18" y="18" width="784" height="224" rx="12" fill="#eef6f8" stroke="#9cb8c6"/><path d="M40 162 Q100 72 190 86 Q235 26 330 70 Q430 26 520 76 Q610 30 770 74 L770 176 Q650 154 540 178 Q420 151 320 178 Q190 148 40 190Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><path d="M36 60H780M36 112H780M36 164H780M140 24V228M260 24V228M380 24V228M500 24V228M620 24V228" stroke="#b7c9d7" stroke-width="1" stroke-dasharray="4 5"/><text x="32" y="40" font-size="19" font-weight="700" fill="#17324d">一戰 1914–1918｜Central vs Allies</text><g font-size="14" font-weight="700"><circle cx="236" cy="97" r="7" fill="#b45b3a"/><text x="246" y="101" fill="#8b3a2f">德國</text><circle cx="264" cy="119" r="7" fill="#b45b3a"/><text x="274" y="123" fill="#8b3a2f">奧匈</text><circle cx="314" cy="142" r="7" fill="#b45b3a"/><text x="324" y="146" fill="#8b3a2f">鄂圖曼</text><circle cx="124" cy="88" r="7" fill="#3d8a57"/><text x="134" y="92" fill="#2d6b4a">英國</text><circle cx="188" cy="126" r="7" fill="#3d8a57"/><text x="198" y="130" fill="#2d6b4a">法國</text><circle cx="446" cy="78" r="7" fill="#3d8a57"/><text x="456" y="82" fill="#2d6b4a">俄國</text><circle cx="245" cy="163" r="7" fill="#3d8a57"/><text x="255" y="167" fill="#2d6b4a">義大利</text><circle cx="270" cy="137" r="5" fill="#7653a8"/><text x="280" y="141" fill="#7653a8">塞拉耶佛</text><path d="M170 150H270" stroke="#b45b3a" stroke-width="4"/><text x="172" y="184" font-size="14" fill="#17324d">西線</text><text x="560" y="210" font-size="14" fill="#8b3a2f">紅：Central</text><text x="650" y="210" font-size="14" fill="#2d6b4a">綠：Allies</text></g><rect x="18" y="260" width="784" height="224" rx="12" fill="#eef6f8" stroke="#9cb8c6"/><path d="M40 404 Q100 314 190 328 Q235 268 330 312 Q430 268 520 318 Q610 272 770 316 L770 418 Q650 396 540 420 Q420 393 320 420 Q190 390 40 432Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><path d="M36 292H780M36 344H780M36 396H780M140 266V488M260 266V488M380 266V488M500 266V488M620 266V488" stroke="#b7c9d7" stroke-width="1" stroke-dasharray="4 5"/><text x="32" y="282" font-size="19" font-weight="700" fill="#17324d">二戰 1939–1945｜Axis vs Allies</text><g font-size="14" font-weight="700"><circle cx="236" cy="331" r="7" fill="#b45b3a"/><text x="246" y="335" fill="#8b3a2f">德國</text><circle cx="245" cy="374" r="7" fill="#b45b3a"/><text x="255" y="378" fill="#8b3a2f">義大利</text><circle cx="675" cy="358" r="7" fill="#b45b3a"/><text x="685" y="362" fill="#8b3a2f">日本</text><circle cx="124" cy="322" r="7" fill="#3d8a57"/><text x="134" y="326" fill="#2d6b4a">英國</text><circle cx="535" cy="320" r="7" fill="#3d8a57"/><text x="545" y="324" fill="#2d6b4a">蘇聯</text><circle cx="748" cy="390" r="7" fill="#3d8a57"/><text x="690" y="414" fill="#2d6b4a">中國</text><circle cx="620" cy="450" r="7" fill="#3d8a57"/><text x="630" y="454" fill="#2d6b4a">美國</text><circle cx="190" cy="350" r="7" fill="#3d8a57"/><text x="200" y="354" fill="#2d6b4a">法國</text><text x="520" y="468" font-size="14" fill="#8b3a2f">紅：Axis</text><text x="610" y="468" font-size="14" fill="#2d6b4a">綠：Allies</text></g></g><rect x="18" y="502" width="784" height="130" rx="12" fill="#eef6f8" stroke="#9cb8c6"/><text x="32" y="526" font-size="19" font-weight="700" fill="#17324d">冷戰 約 1947–1991｜NATO vs Warsaw Pact</text><path d="M55 588H760" stroke="#b7c9d7" stroke-width="2"/><path d="M120 560 Q170 535 220 560 T300 570" fill="none" stroke="#789a86" stroke-width="28"/><path d="M410 555 Q505 535 730 562" fill="none" stroke="#789a86" stroke-width="28"/><circle cx="145" cy="554" r="7" fill="#3d8a57"/><text x="158" y="558" font-size="15" fill="#2d6b4a">美國</text><circle cx="470" cy="555" r="7" fill="#3d8a57"/><text x="483" y="559" font-size="15" fill="#2d6b4a">西歐／NATO</text><circle cx="560" cy="585" r="7" fill="#b45b3a"/><text x="573" y="589" font-size="15" fill="#8b3a2f">蘇聯</text><circle cx="650" cy="585" r="7" fill="#b45b3a"/><text x="663" y="589" font-size="15" fill="#8b3a2f">東歐／Warsaw Pact</text></g>', '0 0 820 650');
  extras[30].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-map-card"><h4>一戰：歐洲相對位置</h4><svg class="geo-mini-map" viewBox="0 0 360 220" role="img" aria-label="一戰歐洲地理位置與陣營"><path d="M18 150 Q75 55 140 80 Q190 25 255 70 Q300 45 342 92 L342 175 Q250 155 190 178 Q90 150 18 190Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><path d="M20 55H340M20 105H340M20 155H340M100 20V205M180 20V205M260 20V205" stroke="#b7c9d7" stroke-dasharray="4 5"/><circle cx="142" cy="88" r="6" fill="#b45b3a"/><text x="151" y="92" font-size="16">德國</text><circle cx="165" cy="110" r="6" fill="#b45b3a"/><text x="174" y="114" font-size="16">奧匈</text><circle cx="205" cy="132" r="6" fill="#b45b3a"/><text x="214" y="136" font-size="16">鄂圖曼</text><circle cx="70" cy="78" r="6" fill="#3d8a57"/><text x="79" y="82" font-size="16">英國</text><circle cx="115" cy="123" r="6" fill="#3d8a57"/><text x="124" y="127" font-size="16">法國</text><circle cx="275" cy="68" r="6" fill="#3d8a57"/><text x="284" y="72" font-size="16">俄國</text><circle cx="153" cy="155" r="6" fill="#3d8a57"/><text x="162" y="159" font-size="16">義大利</text><text x="22" y="205" font-size="16" fill="#8b3a2f">紅 Central／綠 Allies；紫點＝塞拉耶佛</text></svg><p>看國家相對位置，再定位中歐與西線。</p></section><section class="visual-map-card"><h4>二戰：歐亞與北美位置</h4><svg class="geo-mini-map" viewBox="0 0 360 220" role="img" aria-label="二戰主要國家地理位置與陣營"><path d="M18 150 Q75 55 140 80 Q190 25 255 70 Q300 45 342 92 L342 175 Q250 155 190 178 Q90 150 18 190Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><path d="M20 55H340M20 105H340M20 155H340M100 20V205M180 20V205M260 20V205" stroke="#b7c9d7" stroke-dasharray="4 5"/><g font-size="16"><circle cx="142" cy="88" r="6" fill="#b45b3a"/><text x="151" y="92">德國</text><circle cx="150" cy="135" r="6" fill="#b45b3a"/><text x="159" y="139">義大利</text><circle cx="300" cy="125" r="6" fill="#b45b3a"/><text x="309" y="129">日本</text><circle cx="70" cy="78" r="6" fill="#3d8a57"/><text x="79" y="82">英國</text><circle cx="265" cy="72" r="6" fill="#3d8a57"/><text x="274" y="76">蘇聯</text><circle cx="330" cy="155" r="6" fill="#3d8a57"/><text x="238" y="178">中國</text><circle cx="55" cy="160" r="6" fill="#3d8a57"/><text x="64" y="164">美國</text><circle cx="110" cy="118" r="6" fill="#3d8a57"/><text x="119" y="122">法國</text><text x="20" y="205" fill="#8b3a2f">紅 Axis／綠 Allies</text></g></svg><p>二戰軸心國與同盟國，不能沿用一戰名單。</p></section><section class="visual-map-card"><h4>冷戰：跨大西洋對峙</h4><svg class="geo-mini-map" viewBox="0 0 360 180" role="img" aria-label="冷戰美國西歐與蘇聯東歐地理位置"><path d="M18 105 Q55 55 108 75 L125 135 Q70 150 18 130Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><path d="M170 78 Q235 38 338 65 L338 140 Q245 125 170 145Z" fill="#d9e8d8" stroke="#789a86" stroke-width="2"/><circle cx="65" cy="100" r="7" fill="#3d8a57"/><text x="78" y="105" font-size="17">美國</text><circle cx="205" cy="92" r="7" fill="#3d8a57"/><text x="218" y="97" font-size="17">西歐/NATO</text><circle cx="287" cy="108" r="7" fill="#b45b3a"/><text x="300" y="113" font-size="17">蘇聯</text><text x="190" y="137" font-size="17" fill="#8b3a2f">東歐／Warsaw Pact</text></svg><p>西方 NATO 與東方 Warsaw Pact 的地理分界。</p></section><p class="visual-reflow-timeline">時間：一戰 → 二戰 → 冷戰</p></div>';
  extras[31].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-photo-card"><img src="assets/visuals/l31-v-shaped-valley.jpg" alt="V 型河谷真實照片：河流位於谷底，兩側為高處"/><h4>真實照片：先找地景</h4><p>河流在谷底；沿河往下游地勢降低，兩側山稜是高處。</p></section><section class="visual-contour-card"><h4>等高線 V 字對照</h4><svg viewBox="0 0 360 210" role="img" aria-label="V 型河谷等高線圖"><g fill="none" stroke="#6b8da0" stroke-width="3"><path d="M15 35 Q80 10 135 42 T345 35"/><path d="M15 75 Q80 35 135 78 T345 75"/><path d="M15 115 Q80 60 135 115 T345 120"/><path d="M15 155 Q80 85 135 155 T345 170"/></g><path d="M100 25 Q165 100 200 195" fill="none" stroke="#3f8fb0" stroke-width="8"/><text x="220" y="55" font-size="16" fill="#17324d">高處／稜線</text><text x="205" y="130" font-size="16" fill="#17324d">V 尖端→上游</text><text x="30" y="198" font-size="16" fill="#17324d">河流→下游</text></svg></section></div>';
  /* L30 R5: geographic basemap override. The silhouettes are self-authored
     simplified country outlines with real relative positions; no grid/dot map. */
  function l30MapSvg(mode) {
    var title = mode === 'wwi' ? '一戰：Central vs Allies' : mode === 'wwii' ? '二戰：Axis vs Allies' : '冷戰：NATO vs Warsaw Pact';
    var europe = '<path d="M28 136L16 112 27 82 51 65 71 74 84 57 104 64 115 88 105 111 121 130 110 154 84 162 58 155Z" fill="#b7d9c2"/><text x="31" y="54">英國</text><path d="M120 137L138 99 190 91 220 112 207 151 163 163 126 153Z" fill="#b7d9c2"/><text x="150" y="130">法國</text><path d="M220 94L253 83 281 101 278 138 253 151 215 137Z" fill="#d89986"/><text x="230" y="117">德國</text><path d="M280 139L318 130 362 144 382 173 354 195 309 181 282 158Z" fill="#d89986"/><text x="298" y="166">奧匈</text><path d="M244 157L263 180 270 210 259 231 246 203 230 179Z" fill="#b7d9c2"/><text x="228" y="247">義大利</text><path d="M286 83L310 54 385 42 458 55 523 78 560 108 542 143 470 135 412 124 365 108 326 103Z" fill="#e8d49d"/><text x="405" y="79">俄國</text><path d="M385 170L427 151 476 163 510 190 480 217 426 211 391 196Z" fill="#d89986"/><text x="420" y="190">鄂圖曼</text><path d="M30 167C135 188 215 199 292 193C370 187 437 205 526 220" fill="none" stroke="#b45b3a" stroke-width="5" stroke-dasharray="10 6"/><text x="132" y="216" fill="#8b3a2f">西線</text><circle cx="347" cy="171" r="6" fill="#17324d"/><text x="356" y="168">塞拉耶佛</text>';
    var asia = '<path d="M28 136L16 112 27 82 51 65 71 74 84 57 104 64 115 88 105 111 121 130 110 154 84 162 58 155Z" fill="#b7d9c2"/><text x="31" y="54">英國</text><path d="M120 137L138 99 190 91 220 112 207 151 163 163 126 153Z" fill="#b7d9c2"/><text x="150" y="130">法國</text><path d="M220 94L253 83 281 101 278 138 253 151 215 137Z" fill="#d89986"/><text x="230" y="117">德國</text><path d="M286 83L310 54 458 55 523 78 560 108 542 143 470 135 412 124 365 108 326 103Z" fill="#e8d49d"/><text x="405" y="79">蘇聯</text><path d="M422 170L470 151 520 166 534 197 494 219 440 207Z" fill="#b7d9c2"/><text x="459" y="192">中國</text><path d="M545 140L581 121 611 136 622 168 604 195 568 185 548 163Z" fill="#d89986"/><text x="614" y="151">日本</text><path d="M650 84L687 67 721 82 733 119 714 151 677 159 649 133Z" fill="#b7d9c2"/><text x="674" y="107">美國</text>';
    var cold = '<path d="M28 136L16 112 27 82 51 65 71 74 84 57 104 64 115 88 105 111 121 130 110 154 84 162 58 155Z" fill="#b7d9c2"/><text x="31" y="54">西歐</text><path d="M150 143L176 106 242 95 291 115 310 153 278 180 214 176 163 164Z" fill="#b7d9c2"/><text x="210" y="139">西歐</text><path d="M309 98L356 73 464 66 571 83 631 113 613 166 525 160 445 139 370 136Z" fill="#d89986"/><text x="445" y="108">蘇聯</text><path d="M302 142L358 142 408 161 397 196 338 201 298 177Z" fill="#d89986"/><text x="331" y="177">東歐</text><path d="M650 84L687 67 721 82 733 119 714 151 677 159 649 133Z" fill="#b7d9c2"/><text x="674" y="107">美國</text><path d="M105 231C220 211 301 225 405 234" fill="none" stroke="#2f6f9b" stroke-width="5"/><path d="M430 234C535 214 640 222 750 232" fill="none" stroke="#2f6f9b" stroke-width="5"/><text x="30" y="261" fill="#2f6f9b">NATO：美國＋西歐</text><text x="452" y="261" fill="#8b3a2f">Warsaw Pact：蘇聯＋東歐</text>';
    var labels = mode === 'wwi' ? '<text x="590" y="82" fill="#8b3a2f">Central：德、奧匈、鄂圖曼</text><text x="590" y="108" fill="#2d6b4a">Allies：英、法、俄、義</text>' : mode === 'wwii' ? '<text x="590" y="220" fill="#8b3a2f">Axis：德、義、日</text><text x="590" y="246" fill="#2d6b4a">Allies：英、法、蘇、美、中</text>' : '';
    return '<svg class="geo-mini-map" viewBox="0 0 780 285" role="img" aria-label="' + title + ' 地理位置圖"><rect width="780" height="285" rx="14" fill="#edf6f8" stroke="#9cb8c6"/><text x="20" y="28" font-size="20" font-weight="700" fill="#17324d">' + title + '</text><g transform="translate(16 38)" font-family="sans-serif" font-size="15" fill="#17324d" stroke="#6b8791" stroke-width="2" stroke-linejoin="round">' + (mode === 'wwi' ? europe : mode === 'wwii' ? asia : cold) + '</g><g font-family="sans-serif" font-size="15" stroke="none">' + labels + '</g></svg>';
  }
  extras[30] = makeVisual('map', '世界大戰與冷戰：可辨識地理位置的陣營地圖', '以歐洲、亞洲與北美相對位置呈現一戰、二戰、冷戰陣營的簡化地理地圖', '這張圖要看的是：先用國家相對位置定位，再比較不同年代的陣營。', '<g>' + l30MapSvg('wwi').replace('<svg ', '<svg x="0" y="0" ') + l30MapSvg('wwii').replace('<svg ', '<svg x="0" y="285" ') + l30MapSvg('cold').replace('<svg ', '<svg x="0" y="570" ') + '</g>', '0 0 780 855');
  extras[30].reflowHtml = '<div class="visual-reflow-stack">' + l30MapSvg('wwi') + l30MapSvg('wwii') + l30MapSvg('cold') + '</div>';
  function makeBasemapVisual(title, alt, note, image, labels) {
    return makeVisual('map', title, alt, note,
      '<image href="assets/maps/' + image + '" x="24" y="48" width="752" height="370" preserveAspectRatio="xMidYMid meet" opacity=".9"/><g font-family="sans-serif" font-size="16" font-weight="700" stroke="#17324d" stroke-width="1" paint-order="stroke" fill="#17324d">' + labels + '</g>',
      '0 0 800 450');
  }
  extras['L30-WWI'] = makeBasemapVisual('L30-WWI｜Europe basemap：Central Powers vs Allies', 'Public-domain Europe basemap with WWI countries, Sarajevo, and the Western Front annotated', '這張圖要看的是：先用真正的歐洲國界定位國家，再判斷 Central Powers 與 Allies。', 'europe-blank-map.svg',
    '<text x="44" y="78" fill="#8b3a2f">Central Powers</text><text x="640" y="78" fill="#2d6b4a">Allies</text><text x="210" y="140">United Kingdom 英國</text><text x="270" y="282">France 法國</text><text x="390" y="192">Germany 德國</text><text x="446" y="302">Austria-Hungary 奧匈</text><text x="380" y="382">Italy 義大利</text><text x="590" y="146">Russia 俄國</text><text x="560" y="370">Ottoman Empire 鄂圖曼</text><circle cx="467" cy="325" r="7" fill="#7653a8"/><text x="480" y="330">Sarajevo 塞拉耶佛</text><path d="M270 300L430 250" fill="none" stroke="#b45b3a" stroke-width="5" stroke-dasharray="12 7"/><text x="285" y="320" fill="#8b3a2f">Western Front 西線</text>');
  extras['L30-WWII'] = makeBasemapVisual('L30-WWII｜Europe + Asia + North America basemap', 'Public-domain world basemap with WWII Axis and Allied countries annotated in their geographic regions', '這張圖要看的是：歐洲、亞洲與北美分開定位，不能把日本、中國、美國塞進歐洲圖。', 'world-blank-map.svg',
    '<text x="36" y="78" fill="#8b3a2f">Axis</text><text x="700" y="78" fill="#2d6b4a">Allies</text><text x="330" y="170">United States 美國</text><text x="352" y="242">United Kingdom 英國</text><text x="420" y="278">France 法國</text><text x="490" y="205">Germany 德國</text><text x="518" y="315">Italy 義大利</text><text x="578" y="150">Soviet Union 蘇聯</text><text x="608" y="294">China 中國</text><text x="690" y="224">Japan 日本</text><text x="315" y="410" fill="#8b3a2f">Axis：Germany／Italy／Japan</text><text x="545" y="410" fill="#2d6b4a">Allies：UK／France／USSR／China／USA</text>');
  extras['L30-COLD-WAR'] = makeBasemapVisual('L30-COLD-WAR｜World basemap：NATO vs Warsaw Pact', 'Public-domain world basemap with USA, Western Europe, USSR, Eastern Europe, NATO, and Warsaw Pact annotated', '這張圖要看的是：冷戰是跨大西洋的西方與歐亞東方陣營對峙。', 'world-blank-map.svg',
    '<text x="36" y="78" fill="#2d6b4a">NATO</text><text x="690" y="78" fill="#8b3a2f">Warsaw Pact</text><text x="320" y="190">USA 美國</text><text x="410" y="250">Western Europe 西歐</text><text x="565" y="160">USSR 蘇聯</text><text x="590" y="280">Eastern Europe 東歐</text><path d="M360 215C440 190 500 205 548 220" fill="none" stroke="#2f6f9b" stroke-width="6"/><path d="M548 220C590 230 640 250 680 270" fill="none" stroke="#b45b3a" stroke-width="6"/><text x="266" y="410" fill="#2d6b4a">West：USA + Western Europe</text><text x="535" y="410" fill="#8b3a2f">East：USSR + Eastern Europe</text>');
  extras['L30-WWI'].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-map-card"><h4>WWI｜Europe basemap</h4><img src="assets/maps/europe-blank-map.svg" alt="Europe basemap annotated for WWI"/><p>Central Powers：Germany、Austria-Hungary、Ottoman Empire。Allies：United Kingdom、France、Russia、Italy。Sarajevo 與 Western Front 以標記指出。</p></section></div>';
  extras['L30-WWII'].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-map-card"><h4>WWII｜Europe + Asia + North America</h4><img src="assets/maps/world-blank-map.svg" alt="World basemap annotated for WWII"/><p>Axis：Germany、Italy、Japan。Allies：United Kingdom、France、Soviet Union、China、United States。</p></section></div>';
  extras['L30-COLD-WAR'].reflowHtml = '<div class="visual-reflow-stack"><section class="visual-map-card"><h4>Cold War｜NATO vs Warsaw Pact</h4><img src="assets/maps/world-blank-map.svg" alt="World basemap annotated for Cold War"/><p>西側：USA、Western Europe、NATO；東側：USSR、Eastern Europe、Warsaw Pact。</p></section></div>';
  return Object.assign(base, extras);
}
function renderVisual(visual) {
  if (!visual) return '';
  if (visual.svg) return '<figure class="visual-teaching visual-authentic visual-' + esc(visual.kind || 'diagram') + '"><figcaption><strong>' + esc(visual.title) + '</strong><span>' + esc(visual.note) + '</span></figcaption>' + (visual.reflowHtml ? '<div class="visual-art visual-art-wide" role="img" aria-label="' + esc(visual.alt || visual.title) + '">' + visual.svg + '</div><div class="visual-art visual-art-reflow" aria-label="' + esc(visual.alt || visual.title) + '">' + visual.reflowHtml + '</div>' : '<div class="visual-art" role="img" aria-label="' + esc(visual.alt || visual.title) + '">' + visual.svg + '</div>') + '</figure>';
  return '';
}
function lessonVisual(lessonNumber, unit) {
  if (!unit || unit.visualKey == null) return null;
  return authenticVisuals()[unit.visualKey] || null;
}
function historyFrame(lessonNumber) {
  return socialSupplement.historyCompleteness[String(lessonNumber)] || socialSupplement.historyCompleteness[lessonNumber];
}
function positioningFrame(lessonNumber, unitIndex) {
  if (Number(unitIndex) !== 0) return '';
  var frame = historyFrame(lessonNumber);
  if (!frame) return '';
  var lesson = Number(lessonNumber);
  var subject = lesson <= 4 ? '解題策略' : lesson <= 14 ? '公民' : lesson <= 18 ? '經濟' : lesson <= 30 ? '歷史' : '地理';
  var labels = subject === '歷史' ? [['何時', frame.when], ['有誰', frame.who], ['為什麼', frame.why], ['發生什麼', frame.what], ['結果／影響', frame.result]] :
    subject === '公民' ? [['議題', frame.when], ['角色', frame.who], ['規則', frame.what], ['衝突', frame.why], ['怎麼判斷', frame.result]] :
    subject === '經濟' ? [['情境', frame.when], ['變數', frame.who], ['關係', frame.why], ['圖表', frame.what], ['學測怎麼用', frame.result]] :
    subject === '地理' ? [['位置', frame.when], ['尺度', frame.who], ['自然條件', frame.why], ['人文條件', frame.what], ['判讀重點', frame.result]] : null;
  if (!labels || labels.some(function (item) { return !item[1]; })) return '';
  return '<section class="beginner-history-frame subject-frame subject-' + subject + '"><h3>本課定位</h3><div class="beginner-grid">' + labels.map(function (item) { return '<div><strong>' + esc(item[0]) + '</strong><p>' + esc(item[1]) + '</p></div>'; }).join('') + '</div></section>';
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
  var frameHtml = positioningFrame(currentItem.lesson, singleView.unit);
  return '<section id="curriculum" class="curriculum single-view-section"><div class="section-title"><span class="eyebrow">🧠 課綱複習</span><h2>36 課單元閱讀</h2></div><p class="curriculum-intro">一次只讀一個學習單位；題組材料、圖表與題目會維持在同一單元，答案仍依原本的送出後揭露流程。</p>' + related + '<div class="single-view-shell"><aside class="single-view-sidebar ' + (singleView.menuOpen ? 'open' : '') + '"><button type="button" class="single-view-menu" data-sidebar-toggle>☰ 課綱目錄</button><nav aria-label="36 課課綱目錄">' + sidebar + '</nav></aside><main class="single-view-main"><header class="single-view-header"><div><span class="unit">第 ' + currentItem.lesson + ' 課｜' + esc(spec.phase || currentItem.phase) + '</span><h2>' + esc(spec.title || currentItem.title) + '</h2></div><div class="single-view-progress"><strong>Lesson ' + currentItem.lesson + '｜Unit ' + (singleView.unit + 1) + ' / ' + units.length + '</strong><span>' + percent + '%</span><div class="progress-track"><i style="width:' + percent + '%"></i></div></div></header><nav class="single-unit-nav" aria-label="課內單元導覽"><label>目前單元<select data-unit-select>' + unitList + '</select></label></nav><article class="single-view-unit" id="lesson-' + currentItem.lesson + '-unit-' + singleView.unit + '"><h2>' + esc(currentUnit.title) + '</h2>' + frameHtml + renderVisual(lessonVisual(currentItem.lesson, currentUnit)) + renderSingleUnit(currentUnit) + '</article><footer class="single-unit-footer"><button type="button" class="button secondary" data-unit-prev ' + (singleView.unit === 0 ? 'disabled' : '') + '>‹ 上一單元</button><span>第 ' + (singleView.unit + 1) + ' / ' + units.length + ' 單元</span><button type="button" class="button" data-unit-next ' + (singleView.unit === units.length - 1 ? 'disabled' : '') + '>下一單元 ›</button></footer></main></div></section>';
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
