(function () {
  var lessons = window.curriculum || [];
  var detailedLesson = window.lesson5Detailed || null;
  var pageSize = 4;
  var state = { query: '', filter: 'all', page: 1, activeLesson: 1, completed: JSON.parse(localStorage.getItem('social-curriculum-progress') || '{}') };
  var $ = function (selector) { return document.querySelector(selector); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]; }); };
  var text = function (value) { return value ? '<p>' + esc(value) + '</p>' : ''; };
  function markdownLite(value) {
    if (!value) return '';
    var normalized = String(value).replace(/\r/g, '').replace(/\s+(?=###\s)/g, '\n').replace(/\s+(?=\*\*)/g, '\n');
    var blocks = normalized.split(/\n+/).map(function (block) { return block.trim(); }).filter(Boolean);
    return blocks.map(function (block) {
      var safe = esc(block).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (/^###\s*/.test(block)) return '<h4>' + safe.replace(/^###\s*/, '') + '</h4>';
      if (/^##\s*/.test(block)) return '<h3>' + safe.replace(/^##\s*/, '') + '</h3>';
      if (/^-\s+/.test(block)) return '<ul><li>' + safe.replace(/^-\s+/, '') + '</li></ul>';
      return '<p>' + safe.replace(/\s+-\s+/g, '<br>• ') + '</p>';
    }).join('');
  }
  var list = function (items) { var values = Array.isArray(items) ? items : (items ? [items] : []); return values.length ? '<ul>' + values.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>' : ''; };
  var save = function () { localStorage.setItem('social-curriculum-progress', JSON.stringify(state.completed)); };
  var updateProgress = function () { $('#progress').textContent = '已完成 ' + Object.keys(state.completed).filter(function (key) { return state.completed[key]; }).length + ' / ' + lessons.length + ' 課'; };
  var matches = function (lesson) { var haystack = JSON.stringify(lesson).toLowerCase(); return (state.filter === 'all' || lesson.phase === state.filter) && (!state.query || haystack.indexOf(state.query.toLowerCase()) >= 0); };
  function renderToc(items) {
    $('#toc').innerHTML = items.map(function (lesson, index) { return '<button class="toc-link ' + (state.completed[lesson.lesson] ? 'done ' : '') + (state.activeLesson === lesson.lesson ? 'active' : '') + '" data-jump="lesson-' + lesson.lesson + '" data-page="' + (Math.floor(index / pageSize) + 1) + '"><span>第 ' + lesson.lesson + ' 課</span><b>' + esc(lesson.title) + '</b></button>'; }).join('') || '<p class="empty">找不到符合條件的課程。</p>';
  }
  function optionAnalysis(options, answer) {
    return '<div class="rich-options">' + options.map(function (option) { var correct = !!option.correct || option.label === answer; return '<div class="rich-option ' + (correct ? 'correct' : 'wrong') + '"><strong>' + (correct ? '✅ ' : '❌ ') + esc(option.label) + ' ' + esc(option.text) + '</strong><p>' + esc(option.analysis || '') + '</p></div>'; }).join('') + '</div>';
  }
  function comparisonTable(rows) {
    return '<div class="table-wrap"><table class="comparison-table"><thead><tr><th>概念</th><th>核心問題</th><th>理解方式</th><th>例子</th></tr></thead><tbody>' + rows.map(function (row) { return '<tr><th>' + esc(row.concept) + '</th><td>' + esc(row.question) + '</td><td>' + esc(row.explanation) + '</td><td>' + esc(row.example) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function detailedLessonCard(lesson) {
    var done = !!state.completed[lesson.lesson];
    var concepts = lesson.concepts.map(function (concept, index) { return '<section class="rich-section"><h3>核心觀念 ' + String.fromCharCode(65 + index) + '｜' + esc(concept.title.replace(/^一、|^二、|^三、|^四、/, '')) + '</h3>' + text(concept.body) + '<h4>生活與考題例子</h4>' + list(concept.examples) + '<div class="exam-tip"><strong>學測常考方式</strong>' + text(concept.exam) + '</div></section>'; }).join('');
    var historical = lesson.historical.map(function (item) { return '<article class="exam-analysis"><div class="exam-kicker">' + item.year + ' 學測第 ' + item.number + ' 題｜官方答案 ' + esc(item.answer) + '</div><h4>題目</h4>' + text(item.prompt) + '<h4>這題在考什麼</h4>' + text(item.focus || item.reasoning) + '<h4>題幹關鍵</h4>' + text(item.clues) + '<h4>為什麼正解對</h4>' + text(item.reasoning) + '<h4>選項逐項分析</h4>' + optionAnalysis(item.options, item.answer) + '<div class="takeaway"><strong>考前帶走</strong>' + text(item.takeaway) + '</div></article>'; }).join('');
    var originals = lesson.original.map(function (item, index) { return '<article class="original-question"><div class="exam-kicker">原創題 ' + (index + 1) + '｜' + esc(item.type) + '｜答案 ' + esc(item.answer) + '</div><h4>' + esc(item.title) + '</h4><div class="material"><strong>題目材料</strong>' + text(item.material) + '</div><h4>問題</h4>' + text(item.question) + optionAnalysis(item.options, item.answer) + '<details class="answer-details"><summary>查看完整詳解</summary><div class="answer-box"><strong>完整詳解</strong>' + text(item.explanation) + '</div></details></article>'; }).join('');
    var c = lesson.constructed;
    return '<article class="lesson detailed-lesson ' + (done ? 'is-done' : '') + '" id="lesson-' + lesson.lesson + '"><div class="lesson-head"><div><span class="unit">第 ' + lesson.lesson + ' 課｜' + esc(lesson.phase) + '｜完整重寫示範</span><h2>' + esc(lesson.title) + '</h2><p class="focus">' + esc(lesson.lead) + '</p></div><label class="done"><input type="checkbox" data-complete="' + lesson.lesson + '" ' + (done ? 'checked' : '') + '> 已讀完本課</label></div><section class="lesson-map"><h3>1. 先建立觀念地圖</h3>' + list(lesson.map) + '</section><section class="rich-section"><h3>2～5. 核心觀念教學</h3>' + concepts + '</section><section class="rich-section"><h3>6. 概念比較表</h3>' + comparisonTable(lesson.comparison) + '</section><section class="rich-section"><h3>7. 學測常考情境</h3>' + list(lesson.scenarios) + '</section><section class="rich-section"><h3>8. 歷屆題精講</h3>' + historical + '</section><section class="rich-section"><h3>9～10. 類題與學測實戰練習</h3>' + originals + '</section><section class="rich-section constructed-guide"><h3>11. 非選短答：把概念寫成得分句</h3><div class="material"><strong>題目要求｜' + esc(c.wordLimit) + '</strong>' + text(c.prompt) + '</div><h4>考場怎麼作答</h4><p>🖊 ' + esc(c.instrument) + '</p><h4>官方採分邏輯</h4>' + list(c.points) + '<h4>滿分答案</h4><div class="answer-box">' + text(c.fullCredit) + '</div><h4>可接受替代說法</h4>' + list(c.alternatives) + '<h4>常見失分寫法</h4>' + list(c.pitfalls) + '<h4>考生實戰滿分版</h4><div class="answer-box highlight">' + text(c.examReady) + '</div></section><section class="rich-section"><h3>12. 考前一頁整理</h3>' + list(lesson.lastMinute) + '</section></article>';
  }
  function legacyLessonCard(lesson) {
    var done = !!state.completed[lesson.lesson];
    return '<article class="lesson ' + (done ? 'is-done' : '') + '" id="lesson-' + lesson.lesson + '"><div class="lesson-head"><div><span class="unit">第 ' + lesson.lesson + ' 課｜' + esc(lesson.phase) + '</span><h2>' + esc(lesson.title) + '</h2><p class="focus">' + esc(Array.isArray(lesson.remember) ? lesson.remember.join('、') : lesson.remember) + '</p></div><label class="done"><input type="checkbox" data-complete="' + lesson.lesson + '" ' + (done ? 'checked' : '') + '> 已讀完</label></div><section class="legacy-section"><h3>本課先掌握</h3>' + text(lesson.understand) + '</section><section class="legacy-section"><h3>核心觀念教學</h3>' + text(lesson.lecture) + '</section><section class="legacy-section example"><h3>歷屆題精講</h3>' + markdownLite(lesson.example) + markdownLite(lesson.explanation) + '</section><section class="legacy-section practice"><h3>類題示範與練習題</h3>' + markdownLite(lesson.practice) + '<details class="answer-details"><summary>查看練習詳解</summary>' + markdownLite(lesson.practiceAnswers) + '</details></section><section class="legacy-section quick-review"><h3>考前速記</h3>' + list(lesson.keyPoints && lesson.keyPoints.length ? lesson.keyPoints : lesson.remember) + '</section></article>';
  }
  function lessonCard(lesson) { return detailedLesson && lesson.lesson === 5 ? detailedLessonCard(detailedLesson) : legacyLessonCard(lesson); }
  function render() {
    var filtered = lessons.filter(matches); var pages = Math.max(1, Math.ceil(filtered.length / pageSize)); state.page = Math.min(Math.max(1, state.page), pages); var visible = filtered.slice((state.page - 1) * pageSize, state.page * pageSize); if (!visible.some(function (lesson) { return lesson.lesson === state.activeLesson; })) state.activeLesson = visible.length ? visible[0].lesson : null;
    renderToc(filtered); $('#lessons').innerHTML = visible.map(lessonCard).join('') || '<div class="empty-box">找不到符合條件的課程。</div>'; $('#pager').innerHTML = filtered.length ? '<button data-page="prev" ' + (state.page === 1 ? 'disabled' : '') + '>上一頁</button><span>第 ' + state.page + ' / ' + pages + ' 頁</span><button data-page="next" ' + (state.page === pages ? 'disabled' : '') + '>下一頁</button>' : ''; updateProgress();
  }
  $('#search').addEventListener('input', function (event) { state.query = event.target.value.trim(); state.page = 1; render(); });
  $('#filter').addEventListener('change', function (event) { state.filter = event.target.value; state.page = 1; render(); });
  $('#toc').addEventListener('click', function (event) { var button = event.target.closest('[data-jump]'); if (!button) return; state.activeLesson = Number(button.dataset.jump.replace('lesson-', '')); state.page = Number(button.dataset.page); render(); requestAnimationFrame(function () { var target = document.getElementById(button.dataset.jump); if (target) target.scrollIntoView({ behavior: 'smooth' }); }); });
  $('#pager').addEventListener('click', function (event) { var button = event.target.closest('[data-page]'); if (!button || button.disabled) return; state.page += button.dataset.page === 'next' ? 1 : -1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#lessons').addEventListener('change', function (event) { if (!event.target.dataset.complete) return; state.completed[event.target.dataset.complete] = event.target.checked; save(); render(); });
  $('#collapseBtn').addEventListener('click', function (event) { var details = Array.prototype.slice.call(document.querySelectorAll('details')); var open = details.some(function (detail) { return detail.open; }); details.forEach(function (detail) { detail.open = !open; }); event.target.textContent = open ? '展開補充內容' : '收合補充內容'; });
  $('#topBtn').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  render();
}());
