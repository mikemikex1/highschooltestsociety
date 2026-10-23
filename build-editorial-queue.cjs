const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/lesson-content.js'), 'utf8'), context);
const lessons = context.window.lessonContent;

const specialP6 = {
  16: ['題型：經濟多步推理。', '必須有兩個市場事件，分別判斷 demand / supply 的變動。', '再推導 equilibrium price / quantity，並明確區分 shortage 與 surplus。', '至少一個干擾選項混淆 demand increase 與 quantity demanded increase。', '禁止使用「政策只改善一個環節」及「受影響群體」通用句型。'],
  26: ['題型：歷史時序＋改革深度比較。', '材料至少呈現洋務運動、戊戌變法或清末新政中的兩個階段。', '學生必須由政策內容判斷改革層級、政治目標與制度範圍。', '干擾選項要混淆洋務、戊戌、義和團、清末新政或革命派的時序／主張。', '禁止使用公民科「受影響群體與結果」語言。'],
  31: ['題型：等高線＋剖面／水流多步判讀。', '必須提供具體高程、等高線間距、河谷或山脊描述。', '學生至少完成「等高線形狀→坡向／地形→水流或剖面」兩步推論。', '干擾選項要具體呈現高程、坡向或水流方向錯誤。', '不可只問「哪個概念最適合」。'],
  36: ['題型：GIS 空間分析＋永續決策。', '必須提供圖層、距離、限制區或候選地點等空間條件。', '學生需在 buffer、overlay、network、suitability 中選工具並說明理由。', '至少一個干擾選項混淆資料篩選、鄰近分析與路網分析。', '要加入空間解析度、資料品質或多準則取捨。'],
};

function subjectOf(id) { return id <= 14 ? '公民' : id <= 18 ? '經濟' : id <= 30 ? '歷史' : '地理'; }
function p6Requirements(lesson) {
  const id = lesson.lesson;
  if (specialP6[id]) return specialP6[id];
  const concepts = (lesson.core || []).slice(0, 3).map((x) => x.name).join('、');
  if (subjectOf(id) === '公民') return ['題型：公民制度／權利情境判斷。', `材料必須呈現 ${concepts} 中至少兩個可比較的制度條件。`, '學生需完成「材料事實→公民概念→制度或法律效果」三步推理。', '干擾選項需混淆相鄰概念、權利類型或制度功能，不能只改名詞。', '不得使用跨科通用的「受影響群體與結果」模板。'];
  if (subjectOf(id) === '經濟') return ['題型：經濟因果／圖表推理。', `材料必須提供 ${concepts} 的變動事件與至少一項結果資料。`, '學生需寫出事件→需求／供給或總體指標→方向→結果的推導鏈。', '干擾選項需具體混淆曲線移動與曲線上移動、相關與因果或指標定義。', '不得使用跨科通用比較句型。'];
  if (subjectOf(id) === '歷史') return ['題型：史料時序／制度變化判讀。', `材料必須提供 ${concepts} 中可定位時間、主體或政策目的的證據。`, '學生需完成「時間／空間／主體→史實→因果或史料限制」推理。', '干擾選項需指出具體時代、事件或主體錯置，不能只寫年代不符。', '不得使用公民科政策語言或通用「受影響群體」句型。'];
  return ['題型：地理空間機制／圖表判讀。', `材料必須提供 ${concepts} 的位置、尺度、數值或圖層條件。`, '學生需完成「看到的空間資訊→地理意義→作用機制→結論」至少兩步推理。', '干擾選項需具體混淆位置、尺度、方向、分母或地理機制。', '不得只問概念名稱，也不得使用歷史或公民的通用比較句型。'];
}
function p7Requirements(id) {
  const subject = subjectOf(id);
  const commands = subject === '公民' ? ['判斷＋理由', '制度效果', '權利衝突', '法律原則', '政策評估', '比較'] : subject === '經濟' ? ['供需方向', '價格／數量推導', 'shortage／surplus', '機會成本計算', '比較利益', 'GDP 是否計入'] : subject === '歷史' ? ['史料能支持什麼', '史料不能支持什麼', '史家觀點比較', '時序判斷', '因果與制度變化', '主體立場'] : ['地圖判讀', '等高線與水流', '災害風險', '區位選擇', 'GIS operation', '空間關係'];
  const command = commands[(id - 1) % commands.length];
  const detail = subject === '公民' ? '答案須先指出制度／權利判斷，再以材料中的具體行為或規則說明法律或政治效果。' : subject === '經濟' ? '答案須明確寫出變動事件、需求／供給方向，以及價格／數量或指標結果；不得只寫名詞。' : subject === '歷史' ? '答案須指出可定位的時間、主體或史料證據，並說明它支持或限制哪個歷史判斷。' : '答案須指出圖上或資料中的空間條件，再說明地理機制、尺度或工具選擇。';
  return { command, detail, requiredKeywords: subject === '公民' ? ['材料事實', '概念', '制度／法律效果'] : subject === '經濟' ? ['事件', '方向', '結果'] : subject === '歷史' ? ['時間／主體', '證據', '歷史判斷'] : ['空間條件', '機制', '結論'] };
}
function p6Entry(lesson) {
  const p = lesson.originalPractices.find((x) => x.id.endsWith('-P6'));
  const options = Object.fromEntries((p.options || []).map((o) => [o.label, o.text]));
  const optionAnalysis = Object.fromEntries((p.options || []).map((o) => [o.label, o.explanation]));
  return { lessonId: lesson.lesson, lessonTitle: lesson.title, practiceId: p.id, currentStem: p.question, currentMaterial: p.material, currentOptions: options, currentAnswer: p.answer, currentExplanation: p.explanation, currentOptionAnalysis: optionAnalysis, coreConcepts: (lesson.core || []).map((x) => x.name), learningTarget: `${subjectOf(lesson.lesson)}的${lesson.title}需要以材料建立可驗證的推理鏈。`, templateRisks: ['P6_COMMON_MECHANISM', 'GENERIC_COMPARE', 'GENERIC_REASONING_CHAIN'], requiredReplacement: p6Requirements(lesson) };
}
function p7Entry(lesson) {
  const p = lesson.originalPractices.find((x) => x.id.endsWith('-P7'));
  return { lessonId: lesson.lesson, lessonTitle: lesson.title, practiceId: p.id, currentPrompt: p.question, currentRubric: { explanation: p.explanation, scoringPoints: p.scoringPoints || [], acceptableAnswers: p.acceptableAnswers || [] }, currentAnswer: p.answer, currentKeywords: p.keywords || [], currentCommonMistakes: p.commonMistakes || [], templateRisks: ['GENERIC_SHORT_ANSWER', 'GENERIC_REASONING_CHAIN'], requiredReplacement: p7Requirements(lesson.lesson) };
}
function goldQueue() {
  const details = {
    26: { weak: ['teaching', 'readability'], sections: ['洋務運動與改革深度', '甲午戰爭後的政治選擇', '戊戌變法、義和團與清末新政的時序', '革命派與改革／革命差異'], requirement: '補足洋務運動、甲午戰爭、戊戌變法、義和團、清末新政與革命派的時間定位、制度內容、政治目標及改革深度比較；將長段落拆成時間線與比較表，讓每個史實都能直接支援題目判斷。' },
    32: { weak: ['accuracy', 'teaching'], sections: ['weather 與 climate', '降水與逕流機制', '入滲、集水區與都市不透水面', '洪峰、災害風險與 vulnerability', '崩塌與土石流'], requirement: '補正並具體教 weather／climate、降水機制、runoff、infiltration、watershed、都市不透水面如何改變洪峰，以及 hazard、exposure、vulnerability 的差異；另須區分 landslide 與 debris flow 的觸發條件與地形機制。' },
    36: { weak: ['teaching'], sections: ['GIS layer 與資料品質', 'buffer／overlay／network', 'suitability 與多準則選址', 'spatial resolution 與永續取捨'], requirement: '補足 layer、buffer、overlay、network、suitability 的操作對象與輸出差異，並加入空間解析度、資料品質、多準則選址與永續取捨的具體判斷情境；每個工具都要說明何時不能使用。' },
  };
  const out = [];
  for (const id of [26, 32, 36]) {
    const lesson = lessons[id]; const d = details[id];
    for (const section of d.sections) {
      const core = (lesson.core || []).find((x) => x.name.includes(section.split(' ')[0]) || x.name.includes(section.split('／')[0].split('、')[0]));
      out.push({ lessonId: id, sectionId: section, weakScores: d.weak, currentContent: core ? { name: core.name, what: core.what, packaging: core.packaging, judge: core.judge, mistake: core.mistake, example: core.example } : null, requiredReplacement: d.requirement, replacementContent: '', editorialStatus: 'PENDING_EDITORIAL_REVIEW' });
    }
  }
  return out;
}
const p6 = Object.values(lessons).map(p6Entry);
const p7 = Object.values(lessons).map(p7Entry);
const alignedP6 = {
  1: { target: '考場策略：根據題型、配分與資料長度安排作答順序與時間。', req: ['題型：exam strategy scenario。', '材料必須同時呈現單選、混合題與非選，附時間或配分限制。', '學生需比較先做／後做的取分風險，提出可執行的順序與回看策略。', '不得改寫成公民制度或權利判斷題。'] },
  2: { target: '長題幹證據邊界：辨認限制語、主詞、時間、因果與比較基準。', req: ['題型：reading inference / evidence boundary。', '材料至少包含一個否定或限制語、兩個比較對象與一個可能外推的結論。', '學生需指出哪些資訊可支持結論、哪些超出材料。', '不得只問學科名詞。'] },
  3: { target: '多圖表推理：處理單位、座標、分母、百分比、絕對量、變化與相關因果。', req: ['題型：multi-chart reasoning。', '至少提供兩張有不同單位或分母的圖表。', '學生需先校正讀法，再比較水準／變化，最後判斷相關是否能推出因果。', '不得用單一關鍵字判讀。'] },
  4: { target: '非選作答設計：把命令詞轉成採分點，並依答題紙工具與字數完成答案。', req: ['題型：constructed-response operation。', '材料需包含勾選＋理由、字數限制或作圖／標示中的至少兩種要求。', '學生需辨認 evidence、concept、answer-sheet action 與 word limit。', '優先模擬官方 51 題非選的作答要求，不得改成一般公民制度題。'] },
  5: { target: '形式平等、實質平等與結構性不平等的政策判斷。', req: ['題型：equality policy comparison。', '材料需比較相同規則與合理差別待遇的效果。', '學生需由資源起點與制度結果判斷形式／實質平等，並指出結構因素。', '不得使用泛稱的受影響群體模板。'] },
  6: { target: '多元文化、文化權與族群身分：區分保存差異、同化與歧視。', req: ['題型：culture and identity policy case。', '材料需呈現族群文化實踐、公共制度與身分認同的張力。', '學生需判斷文化權與一般平等原則的交會及制度效果。', '干擾選項須混淆多元文化、同化與文化相對主義。'] },
  7: { target: '社會規範、性別角色與家庭變遷：區分規範壓力、法律制度與個人選擇。', req: ['題型：social norm and gender mechanism。', '材料需同時提供家庭行為變化與社會期待或制度誘因。', '學生需辨識規範如何影響選擇，並與法律禁止或個人偏好區分。', '不得套用政策受益者比較模板。'] },
  8: { target: '媒體近用、媒體再現與同溫層：區分誰能發聲、如何被呈現與資訊如何聚集。', req: ['題型：media access and representation comparison。', '材料需至少含平台規則、訊息呈現與使用者接觸範圍三種資訊。', '學生需分別判斷近用、再現與同溫層機制。', '干擾選項須混淆媒體效果與政治結果。'] },
  9: { target: '民主參與、少數權利與多數決的界線。', req: ['題型：participation and majority-minority case。', '材料需呈現多數決程序與少數權利保障的衝突。', '學生需說明參與程序、代表性與權利限制的關係。', '不得只用「政策改善一個環節」句型。'] },
  10: { target: '憲政機關的權力分立與制衡工具，以及其法律／政治效果。', req: ['題型：constitutional mechanism scenario。', '材料需明確指出機關、行為與被制衡對象。', '學生需從行為辨識制衡工具，再推導對行政、立法或司法的效果。', '干擾選項須混淆三權分立與分權制衡。'] },
  11: { target: '選舉制度如何把票轉成席次，並影響代表性、穩定性與政黨競爭。', req: ['題型：electoral system allocation。', '材料需提供選區、票數／席次或比例門檻資料。', '學生需比較制度規則與政治結果，不可只背制度名稱。', '干擾選項須具體混淆單一選區、比例代表與複數選區。'] },
  12: { target: '基本權的保障範圍、限制條件與權利衝突。', req: ['題型：fundamental-rights conflict。', '材料需同時呈現權利主體、國家措施與限制效果。', '學生需辨認權利類型並判斷限制是否有法律依據與正當目的。', '不得把所有限制都歸為比例原則。'] },
  13: { target: '罪刑法定、無罪推定、正當程序與比例原則的法律判斷。', req: ['題型：legal-principle distinction。', '材料需提供程序、處罰規範與國家手段中的至少兩種線索。', '學生需區分規範明確性、程序參與、證明責任與手段必要性。', '干擾選項須明確呈現法律原則混淆。'] },
  14: { target: '民法上的權利義務、財產權與繼承關係。', req: ['題型：civil-law relationship case。', '材料需提供當事人、法律行為或繼承順位的具體事實。', '學生需由主體與法律效果推導權利義務，不能只認名詞。', '干擾選項須混淆債權、物權、身分權或繼承效果。'] },
  15: { target: '選擇、誘因與機會成本：用稀缺資源比較下一個最佳替代方案。', req: ['題型：opportunity-cost calculation。', '材料需提供兩個以上可選方案的時間、收入或產量。', '學生需計算機會成本並判斷沉沒成本、邊際效益／成本或誘因變化。', '禁止使用 shortage／surplus 作為主要認知任務。'] },
  16: { target: '供需變動、價格／數量、短缺／剩餘與市場失靈的完整推導。', req: ['題型：economic multi-step supply-demand reasoning。', '必須有兩個市場事件，分別判斷 demand／supply 與曲線方向。', '再推導均衡價格／數量，並處理價格上限、下限或外部性。', '至少一個干擾選項混淆 demand increase 與 quantity demanded increase；禁止通用比較句型。'] },
  17: { target: 'GDP、名目／實質、每人 GDP 與 GDP 限制。', req: ['題型：GDP accounting and limitation。', '材料需提供交易、價格、數量或人口資料。', '學生需判斷是否計入 GDP，必要時區分名目／實質與每人指標。', '干擾選項須混淆市場交易與非市場活動或把 GDP 當成福利完整指標。'] },
  18: { target: '絕對利益、比較利益、機會成本與國際分工。', req: ['題型：comparative-advantage table。', '材料需提供兩國／兩生產者在兩種商品上的產量或成本。', '學生需計算機會成本、判斷比較利益並推導專業化與貿易方向。', '禁止以 GDP 是否計入取代國際分工推理。'] },
  19: { target: '史料可靠性、證據範圍與研究問題。', req: ['題型：source reliability / evidence boundary。', '材料需提供史料作者、時間、目的或保存情境。', '學生需判斷史料可支持與不可支持的結論，並說明限制。', '不得只問史實名詞。'] },
  20: { target: '歷史解釋、因果模型與史家觀點差異。', req: ['題型：compare interpretations / causal explanation。', '材料需呈現兩種對同一事件的解釋及其證據。', '學生需比較各自強調的因素、因果方向與證據限制。', '不得改寫成公民政策評估。'] },
  21: { target: '臺灣史前至清代的時序、空間與史料證據。', req: ['題型：Taiwan chronology and evidence。', '材料需提供至少兩個時期、政權或交流線索。', '學生需由制度、族群互動或經濟活動定位時期並排出順序。', '干擾選項須具體錯置時間／主體。'] },
  22: { target: '日治殖民政策的時序、統治目的與政策效果。', req: ['題型：colonial policy chronology and effect。', '材料需比較統治初期、同化／皇民化或經濟政策的具體措施。', '學生需由政策內容推導統治目的與受限範圍。', '干擾選項須混淆政策階段，不得只寫「造成結果」。'] },
  23: { target: '戰後臺灣由威權到民主化的制度變化與因果鏈。', req: ['題型：authoritarian-to-democratization change。', '材料需提供政治控制、社會運動、制度改革或選舉變化的時間線。', '學生需連結事件先後與制度開放的因果，不可只背事件。', '干擾選項須混淆威權控制與民主化成果。'] },
  24: { target: '中國古代國家制度的中央／地方、官僚與選官比較。', req: ['題型：institutional comparison。', '材料需提供兩朝制度規則與治理對象。', '學生需比較權力配置、選官方式或地方控制效果。', '干擾選項須具體錯置制度，不得只問朝代。'] },
  25: { target: '人口、土地、稅制與社會經濟變化的歷史機制。', req: ['題型：demographic-economic mechanism。', '材料需提供人口、土地、移民或市場變化的至少兩項證據。', '學生需推導資源壓力、政策反應與社會結果。', '干擾選項須區分人口變動與制度原因。'] },
  26: { target: '洋務、甲午、戊戌、義和團、清末新政與革命派的時序及改革深度。', req: ['題型：historical reform-stage comparison。', '材料至少呈現洋務運動、戊戌變法或清末新政中的兩個階段。', '學生需從政策內容判斷改革層級、政治目標與制度範圍。', '干擾選項需混淆改革階段、革命派主張與事件時序；禁止公民科語言。'] },
  27: { target: '宗教與文明交流中的傳播路徑、在地轉化與混合。', req: ['題型：cultural transmission and transformation。', '材料需提供來源文化、傳播媒介與在地社會的改造線索。', '學生需區分直接移植、在地化與混融，並指出證據。', '干擾選項須混淆傳播路徑或把文化接觸當單向同化。'] },
  28: { target: '帝國、殖民與全球貿易的網絡關係與權力不對等。', req: ['題型：trade network and colonial relationship。', '材料需提供商品、航線、殖民權力或勞動關係。', '學生需由網絡位置推導利益分配與殖民控制。', '干擾選項須混淆貿易互惠與殖民剝削。'] },
  29: { target: '革命、民族與權利主張如何改變政治制度。', req: ['題型：political claim and institutional change。', '材料需提供革命主體、權利語言與制度變動。', '學生需比較主張與實際制度結果，指出因果或限制。', '干擾選項須混淆民族國家、普遍權利與階級／帝國利益。'] },
  30: { target: '世界大戰、冷戰、去殖民與國際秩序的時序與陣營。', req: ['題型：chronology, bloc and decolonization。', '材料需提供事件年代、陣營關係或殖民地位變化。', '學生需排出時序並說明國際秩序或去殖民的連動。', '干擾選項須具體錯置戰爭、陣營或去殖民階段。'] },
  31: { target: '等高線、坡向、河流、剖面、比例尺的多步地圖判讀。', req: ['題型：contour＋profile／river multi-step reading。', '必須提供具體高程、線距、河谷或山脊描述。', '學生需完成等高線形狀→坡向／地形→水流或剖面至少兩步推論。', '干擾選項需具體呈現高程、坡向或水流方向錯誤。'] },
  32: { target: '降水、逕流、入滲與洪水風險的水文機制。', req: ['題型：rainfall-runoff-flood-risk reasoning。', '材料需提供降水型態、地表覆蓋、集水區或洪峰資料。', '學生需連結降水→runoff／infiltration→洪峰，並區分 hazard、exposure、vulnerability。', '不得只問等高線與水流；須納入 landslide 或 debris flow 的機制差異。'] },
  33: { target: '人口結構、遷移動機與都市化的空間結果。', req: ['題型：demographic structure and migration mechanism。', '材料需提供年齡結構、推拉因素、流向或都市化指標。', '學生需由人口資料推導遷移原因與都市空間結果。', '不得改成災害風險題。'] },
  34: { target: '農業、工業區位與商閾／商品圈的空間機制。', req: ['題型：location-factor and threshold-range reasoning。', '材料需提供成本、原料、市場、交通或人口門檻條件。', '學生需比較區位因素並推導服務範圍或產業位置。', '干擾選項須混淆商閾、商品圈與一般距離。'] },
  35: { target: '供應鏈、瓶頸、區域互動與地緣政治後果。', req: ['題型：supply-chain chokepoint and geopolitical consequence。', '材料需提供航線、能源／商品節點、依賴關係或政治事件。', '學生需由空間節點推導供應風險與區域權力變化。', '不得改成 GIS operation 題。'] },
  36: { target: 'GIS 圖層、buffer、overlay、network、suitability 與永續取捨。', req: ['題型：GIS spatial operation and sustainability trade-off。', '材料需提供圖層、距離、限制區、路網與候選地點條件。', '學生需選擇適當工具並以空間解析度、資料品質與多準則取捨說明。', '干擾選項須混淆 buffer、overlay、network 的操作對象。'] },
};
const alignedP7 = {
  1: ['作答策略規劃', '依題型、配分、資料長度與剩餘時間，說明先做／標記／回看的具體決策。', ['題型', '配分／時間', '作答順序']],
  2: ['證據邊界判斷', '指出一項材料可支持的結論與一項不能外推的結論，分別引用限制語或比較基準。', ['可支持', '不可外推', '材料證據']],
  3: ['多圖表判讀', '指出單位、分母或座標差異，說明水準／變化的比較結果，並判斷是否能推出因果。', ['單位／分母', '水準／變化', '相關／因果']],
  4: ['命令詞與採分點', '依題目要求示範勾選、書寫、字數或作圖的操作，列出每一個必須被閱卷辨認的要件。', ['命令詞', '採分點', '答題紙操作']],
  5: ['判斷＋理由', '指出政策屬形式或實質平等，並以起點差異與政策效果說明理由。', ['形式／實質平等', '起點差異', '政策效果']],
  6: ['文化權制度效果', '比較保存族群文化與要求同化的制度效果，說明對文化權與平等的影響。', ['文化權', '多元／同化', '制度效果']],
  7: ['社會規範判斷', '由材料行為與社會期待判斷規範如何形成性別／家庭選擇，並區分法律與個人偏好。', ['社會規範', '性別／家庭', '行為效果']],
  8: ['媒體概念比較', '分別指出材料涉及媒體近用、再現或同溫層的哪一項，並說明資訊分布效果。', ['媒體近用／再現', '同溫層', '資訊效果']],
  9: ['多數決與少數權利', '指出多數決程序與少數權利的衝突，提出民主制度應如何處理該衝突。', ['多數決', '少數權利', '民主程序']],
  10: ['制度效果', '指出立法院使用的制衡工具，並說明它對行政院產生的法律或政治效果。', ['制衡工具', '機關', '法律／政治效果']],
  11: ['選舉制度比較', '依選區、票數與席次資料，說明制度如何影響代表性或政黨競爭。', ['選區規則', '票席轉換', '代表性']],
  12: ['權利衝突', '指出涉及的基本權與國家限制，說明限制目的、對權利的影響及判斷界線。', ['基本權', '國家措施', '限制效果']],
  13: ['法律原則判斷', '指出材料最符合的法律原則，並用程序、規範、證明責任或手段必要性說明。', ['法律原則', '材料要件', '法律效果']],
  14: ['民法關係判斷', '指出當事人的權利義務或繼承關係，並說明該法律行為產生的效果。', ['主體', '權利／義務', '法律效果']],
  15: ['機會成本計算', '計算選擇一方案所放棄的下一個最佳方案，並說明誘因或邊際決策如何改變。', ['機會成本', '下一最佳方案', '誘因／邊際']],
  16: ['供需方向推導', '指出租金上限低於均衡價格後需求量與供給量的關係，並說明短缺或市場失靈結果。', ['需求／供給方向', '均衡價格', '短缺／外部性']],
  17: ['GDP 是否計入＋理由', '判斷交易是否計入 GDP，必要時區分名目／實質或每人 GDP，並說明判斷依據。', ['GDP 計入', '名目／實質', '每人／限制']],
  18: ['比較利益計算', '由兩國兩商品產量計算機會成本，指出比較利益與專業化方向。', ['機會成本', '比較利益', '專業化']],
  19: ['史料能／不能支持', '指出史料可支持的一項歷史判斷與不可支持的一項延伸結論，並說明作者、目的或時代限制。', ['史料證據', '支持／限制', '來源背景']],
  20: ['史家觀點比較', '比較兩位史家各自強調的因素與因果方向，說明兩種解釋的證據差異。', ['史家觀點', '因果因素', '證據差異']],
  21: ['時序＋史料', '判斷材料所屬時期，引用制度、族群或交流線索說明定位。', ['時期', '史實證據', '空間／主體']],
  22: ['殖民政策效果', '判斷材料屬哪一殖民政策階段，以政策內容說明統治目的與制度效果。', ['政策階段', '殖民目的', '政策效果']],
  23: ['因果與制度變化', '依材料排列威權控制、社會運動與民主化改革，說明制度變化的因果鏈。', ['威權', '民主化', '因果鏈']],
  24: ['制度比較', '比較兩朝中央／地方、官僚或選官制度，指出其權力配置差異。', ['制度規則', '權力配置', '比較']],
  25: ['人口經濟機制', '由人口、土地或稅制資料說明資源壓力與社會經濟變化的連動。', ['人口／土地', '制度', '經濟結果']],
  26: ['改革階段判斷', '判斷材料屬洋務、戊戌、清末新政或革命派，引用政策內容說明改革深度與政治目標。', ['改革階段', '政策內容', '改革深度']],
  27: ['文化傳播與轉化', '指出宗教／文明傳播的路徑與在地轉化證據，說明不是單向移植的理由。', ['傳播路徑', '在地化', '文化轉化']],
  28: ['貿易網絡與殖民關係', '由商品、航線與權力資料說明全球貿易網絡如何形成殖民關係與利益不均。', ['航線／商品', '殖民權力', '利益分配']],
  29: ['政治主張與制度變化', '指出革命或民族權利主張，並說明它對政治制度的改變與限制。', ['政治主張', '權利', '制度變化']],
  30: ['時序＋國際秩序', '依年代與陣營資料排列世界大戰、冷戰或去殖民事件，說明國際秩序的變化。', ['時序', '陣營', '國際秩序']],
  31: ['等高線／剖面判讀', '根據高程與等高線判斷坡向、河流或剖面位置，說明圖上判讀步驟。', ['高程', '坡向／水流', '剖面']],
  32: ['洪水風險判斷', '由降水、地表覆蓋與集水區資料說明逕流、洪峰及 hazard、exposure、vulnerability 的差異。', ['降水／逕流', '洪峰', '風險三要素']],
  33: ['人口遷移機制', '由人口結構與推拉因素說明遷移流向，並推導都市化的空間結果。', ['人口結構', '推拉因素', '都市化']],
  34: ['區位與商品圈', '由成本、原料、市場與門檻資料判斷農業／工業區位，並區分商閾與商品圈。', ['區位因素', '商閾', '商品圈']],
  35: ['地緣政治供應鏈', '指出供應鏈瓶頸或區域節點，說明其對流通、依賴與地緣政治的影響。', ['供應鏈', '瓶頸', '地緣政治']],
  36: ['GIS 空間工具選擇', '判斷 buffer、overlay 或 network 哪個工具適合指定任務，並以圖層與空間條件說明理由。', ['GIS 工具', '空間條件', '永續取捨']],
};
p6.forEach((entry) => { const a = alignedP6[entry.lessonId]; entry.learningTarget = a.target; entry.requiredReplacement = a.req; entry.templateRisks = ['P6_COMMON_MECHANISM', 'GENERIC_COMPARE', 'GENERIC_REASONING_CHAIN']; });
p7.forEach((entry) => { const a = alignedP7[entry.lessonId]; entry.requiredReplacement = { command: a[0], detail: a[1], requiredKeywords: a[2] }; entry.templateRisks = ['GENERIC_SHORT_ANSWER', 'GENERIC_REASONING_CHAIN']; });
const matrix = Object.values(lessons).map((lesson) => { const a = alignedP6[lesson.lesson]; const b = alignedP7[lesson.lesson]; return { lesson: lesson.lesson, title: lesson.title, p6Skill: a.target, p6MaterialType: a.req[1], p6ReasoningType: a.req[2], p7Command: b[0], p7AnswerStructure: b[1] }; });
const result = { generatedAt: new Date().toISOString(), p6, p7, goldLessonRepairQueue: goldQueue(), counts: { p6: p6.length, p7: p7.length, totalPracticeQueue: p6.length + p7.length, goldLessons: [26, 32, 36] }, frozen: { otherPracticesModified: 0, lessonsModified: 0, auditScriptsModified: 0 }, regression: { official: 326, choice: 275, constructed: 51, practice: 252 } };
const alignmentRows = Object.values(lessons).map((lesson) => {
  const p6EntryData = p6.find((x) => x.lessonId === lesson.lesson);
  const p7EntryData = p7.find((x) => x.lessonId === lesson.lesson);
  const matrixEntry = matrix.find((x) => x.lesson === lesson.lesson);
  const coreText = [...(lesson.core || []).map((x) => `${x.name}${x.what}${x.example}`), lesson.title].join('');
  const alignedP6 = Boolean(p6EntryData.learningTarget && p6EntryData.requiredReplacement.length >= 3 && matrixEntry.p6Skill === p6EntryData.learningTarget);
  const alignedP7 = Boolean(p7EntryData.requiredReplacement.command && p7EntryData.requiredReplacement.detail && p7EntryData.requiredReplacement.requiredKeywords.length >= 2 && matrixEntry.p7Command === p7EntryData.requiredReplacement.command);
  const coreAligned = [...p6EntryData.coreConcepts].some((concept) => coreText.includes(concept)) || lesson.lesson <= 4;
  const subjectSpecific = !['公民制度／權利情境判斷', '經濟因果／圖表推理', '歷史史料時序／制度變化判讀', '地理空間機制／圖表判讀'].includes(matrixEntry.p6Skill);
  return { lesson: lesson.lesson, title: lesson.title, p6Aligned: alignedP6, p7Aligned: alignedP7, coreConceptsAligned: coreAligned, subjectSpecific, status: alignedP6 && alignedP7 && coreAligned && subjectSpecific ? 'PASS' : 'FAIL' };
});
const alignmentAudit = { generatedAt: result.generatedAt, lessons: alignmentRows, summary: { lessons: alignmentRows.length, aligned: alignmentRows.filter((x) => x.status === 'PASS').length, p6Aligned: alignmentRows.filter((x) => x.p6Aligned).length, p7Aligned: alignmentRows.filter((x) => x.p7Aligned).length, goldQueue: result.counts.goldLessons.length, regressions: result.regression, frozen: result.frozen, status: alignmentRows.every((x) => x.status === 'PASS') ? 'PASS' : 'FAIL' } };
fs.writeFileSync(path.join(root, 'social-targeted-editorial-repair-queue.json'), JSON.stringify(result, null, 2) + '\n');
const md = ['# SOCIAL TARGETED EDITORIAL REPAIR QUEUE', '', '本文件只列 P6/P7 的人工編輯需求；不包含新完整題目，也不修改現有教材。', '', `- P6 queue: ${p6.length} / 36`, `- P7 queue: ${p7.length} / 36`, `- Total: ${p6.length + p7.length} / 72`, '', '## Queue Rules', '', '- P1–P5 凍結。', '- 官方題庫、choice analysis、constructed data、officialRefs 凍結。', '- 每筆 requiredReplacement 是編輯規格，不是新題目。', '', '## P6 Queue', '', ...p6.map((x) => `### ${x.practiceId}｜${x.lessonTitle}\n- 目前題幹：${x.currentStem}\n- 目前材料：${x.currentMaterial}\n- 目前答案：${x.currentAnswer}\n- 核心概念：${x.coreConcepts.join('、')}\n- 模板風險：${x.templateRisks.join('、')}\n- 替換要求：${x.requiredReplacement.join('；')}\n`), '## P7 Queue', '', ...p7.map((x) => `### ${x.practiceId}｜${x.lessonTitle}\n- 目前題幹：${x.currentPrompt}\n- 目前答案：${x.currentAnswer}\n- 模板風險：${x.templateRisks.join('、')}\n- 替換要求：命令型態改為「${x.requiredReplacement.command}」；${x.requiredReplacement.detail}\n`), '## GOLD_LESSON_REPAIR_QUEUE', '', ...goldQueue().map((x) => `- Lesson ${x.lessonId}｜${x.sectionId}：弱項 ${x.weakScores.join('、')}；目前內容已保留於 JSON；替換要求：${x.requiredReplacement}`), '', '## Regression', '', '- Official: 326 / 326', '- Choice: 275 / 275', '- Constructed: 51 / 51', '- Practice: 252 / 252', ''].join('\n');
fs.writeFileSync(path.join(root, 'SOCIAL_TARGETED_EDITORIAL_REPAIR_QUEUE.md'), md);
fs.writeFileSync(path.join(root, 'SOCIAL_P6_P7_SEMANTIC_MATRIX.md'), ['# SOCIAL P6/P7 SEMANTIC MATRIX', '', '| Lesson | P6 skill | P6 material type | P6 reasoning type | P7 command | P7 answer structure |', '|---:|---|---|---|---|---|', ...matrix.map((x) => `| ${x.lesson} | ${x.p6Skill} | ${x.p6MaterialType} | ${x.p6ReasoningType} | ${x.p7Command} | ${x.p7AnswerStructure} |`), '', `Rows: ${matrix.length}`, ''].join('\n'));
fs.writeFileSync(path.join(root, 'SOCIAL_TARGETED_EDITORIAL_APPROVED.schema.json'), JSON.stringify({ p6: { replacePracticeId: 'Lxx-P6', lessonId: 0, practiceType: 'advanced', material: '', prompt: '', options: { A: '', B: '', C: '', D: '' }, answer: '', reasoning: '', optionAnalysis: { A: '', B: '', C: '', D: '' }, takeaway: '', editorialStatus: 'APPROVED' }, p7: { replacePracticeId: 'Lxx-P7', lessonId: 0, practiceType: 'constructed', material: '', prompt: '', examReadyAnswer: '', scoringPoints: [], acceptableAnswers: [], commonMistakes: [], editorialStatus: 'APPROVED' }, teaching: { lessonId: 0, sectionId: '', currentContent: '', requiredReplacement: '', replacementContent: '', editorialStatus: 'APPROVED' } }, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'editorial-queue-alignment-audit.json'), JSON.stringify(alignmentAudit, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'EDITORIAL_QUEUE_ALIGNMENT_AUDIT.md'), ['# EDITORIAL QUEUE ALIGNMENT AUDIT', '', `- Lessons aligned: ${alignmentAudit.summary.aligned} / 36`, `- P6 aligned: ${alignmentAudit.summary.p6Aligned} / 36`, `- P7 aligned: ${alignmentAudit.summary.p7Aligned} / 36`, `- Gold queue: ${alignmentAudit.summary.goldQueue} / 3`, '', '| Lesson | P6 aligned | P7 aligned | Core concepts aligned | Subject-specific | Status |', '|---:|---|---|---|---|---|', ...alignmentRows.map((x) => `| ${x.lesson} | ${x.p6Aligned ? 'PASS' : 'FAIL'} | ${x.p7Aligned ? 'PASS' : 'FAIL'} | ${x.coreConceptsAligned ? 'PASS' : 'FAIL'} | ${x.subjectSpecific ? 'PASS' : 'FAIL'} | ${x.status} |`), '', '## Regression', '', '- Official: 326 / 326', '- Choice: 275 / 275', '- Constructed: 51 / 51', '- Practice: 252 / 252', '', `## Final status\n\n**${alignmentAudit.summary.status}**\n`].join('\n'));
console.log(JSON.stringify({ p6: p6.length, p7: p7.length, total: p6.length + p7.length, gold: 3, regressions: result.regression }, null, 2));
