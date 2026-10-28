// Inside Out Studio — 12-Language Internationalization (i18n) & Google Cloud Chirp 3 HD Narration Engine
// Supports all 12 languages: English (en), Chinese Mandarin (zh-CN / zh), Cantonese (zh-HK / yue),
// Spanish (es), French (fr), German (de), Dutch (nl), Portuguese (pt), Italian (it),
// Japanese (ja), Korean (ko), and Arabic (ar, RTL).

const LANG_STORAGE_KEY = 'inside_out_studio_lang_v1';

export const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', label: 'English', nativeName: 'English', speechLang: 'en-US', chirpLangCode: 'en-US', chirpVoice: 'en-US-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['en-US', 'en'] },
  { code: 'zh-CN', flag: '🇨🇳', label: '中文 (普通话)', nativeName: '中文 (普通话)', speechLang: 'zh-CN', chirpLangCode: 'cmn-CN', chirpVoice: 'cmn-CN-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['zh-CN', 'cmn-Hans-CN', 'zh-SG', 'zh'] },
  { code: 'zh-HK', flag: '🇭🇰', label: '粵語 (廣東話)', nativeName: '粵語 (廣東話)', speechLang: 'zh-HK', chirpLangCode: 'yue-HK', chirpVoice: 'yue-HK-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['zh-HK', 'yue-HK', 'yue', 'zh-TW'] },
  { code: 'es', flag: '🇪🇸', label: 'Español', nativeName: 'Español', speechLang: 'es-ES', chirpLangCode: 'es-ES', chirpVoice: 'es-ES-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['es-ES', 'es-MX', 'es-US', 'es'] },
  { code: 'fr', flag: '🇫🇷', label: 'Français', nativeName: 'Français', speechLang: 'fr-FR', chirpLangCode: 'fr-FR', chirpVoice: 'fr-FR-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['fr-FR', 'fr-CA', 'fr'] },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch', nativeName: 'Deutsch', speechLang: 'de-DE', chirpLangCode: 'de-DE', chirpVoice: 'de-DE-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['de-DE', 'de-AT', 'de-CH', 'de'] },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands', nativeName: 'Nederlands', speechLang: 'nl-NL', chirpLangCode: 'nl-NL', chirpVoice: 'nl-NL-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['nl-NL', 'nl-BE', 'nl'] },
  { code: 'pt', flag: '🇧🇷', label: 'Português', nativeName: 'Português', speechLang: 'pt-BR', chirpLangCode: 'pt-BR', chirpVoice: 'pt-BR-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['pt-BR', 'pt-PT', 'pt'] },
  { code: 'it', flag: '🇮🇹', label: 'Italiano', nativeName: 'Italiano', speechLang: 'it-IT', chirpLangCode: 'it-IT', chirpVoice: 'it-IT-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['it-IT', 'it'] },
  { code: 'ja', flag: '🇯🇵', label: '日本語', nativeName: '日本語', speechLang: 'ja-JP', chirpLangCode: 'ja-JP', chirpVoice: 'ja-JP-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['ja-JP', 'ja'] },
  { code: 'ko', flag: '🇰🇷', label: '한국어', nativeName: '한국어', speechLang: 'ko-KR', chirpLangCode: 'ko-KR', chirpVoice: 'ko-KR-Chirp3-HD-Aoede', dir: 'ltr', voicePrefixes: ['ko-KR', 'ko'] },
  { code: 'ar', flag: '🇸🇦', label: 'العربية', nativeName: 'العربية', speechLang: 'ar-SA', chirpLangCode: 'ar-XA', chirpVoice: 'ar-XA-Chirp3-HD-Aoede', dir: 'rtl', voicePrefixes: ['ar-SA', 'ar-001', 'ar-XA', 'ar-EG', 'ar'] },
];

const VALID_CODES = new Set(LANGUAGES.map((l) => l.code));

const LANG_ALIASES = {
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'en-au': 'en',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-sg': 'zh-CN',
  cmn: 'zh-CN',
  yue: 'zh-HK',
  'yue-hk': 'zh-HK',
  'zh-hk': 'zh-HK',
  'zh-tw': 'zh-HK',
  'zh-mo': 'zh-HK',
  'zh-hant': 'zh-HK',
  es: 'es',
  'es-es': 'es',
  'es-mx': 'es',
  'es-419': 'es',
  fr: 'fr',
  'fr-fr': 'fr',
  'fr-ca': 'fr',
  de: 'de',
  'de-de': 'de',
  'de-at': 'de',
  'de-ch': 'de',
  nl: 'nl',
  'nl-nl': 'nl',
  'nl-be': 'nl',
  pt: 'pt',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  it: 'it',
  'it-it': 'it',
  ja: 'ja',
  'ja-jp': 'ja',
  ko: 'ko',
  'ko-kr': 'ko',
  ar: 'ar',
  'ar-sa': 'ar',
  'ar-001': 'ar',
  'ar-eg': 'ar',
  'ar-ae': 'ar',
  'ar-xa': 'ar',
};
export function normalizeLangCode(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (VALID_CODES.has(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase().replace('_', '-');
  if (LANG_ALIASES[lower]) return LANG_ALIASES[lower];
  const prefix = lower.split('-')[0];
  if (LANG_ALIASES[prefix]) return LANG_ALIASES[prefix];
  return null;
}

function syncDocumentLangAndDir(code) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = code;
    document.documentElement.dir = getLangDir(code);
  }
}

function detectInitialLang() {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlLang = normalizeLangCode(params.get('lang'));
      if (urlLang) return urlLang;
    }
    if (typeof localStorage !== 'undefined') {
      const saved =
        normalizeLangCode(localStorage.getItem(LANG_STORAGE_KEY)) ||
        normalizeLangCode(localStorage.getItem('atlas_of_wonder_lang'));
      if (saved) return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

let currentLang = detectInitialLang();
const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function getLangMeta(code = currentLang) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function getLangDir(code = currentLang) {
  return getLangMeta(code)?.dir || 'ltr';
}

syncDocumentLangAndDir(currentLang);

export function setLang(nextCode) {
  const normalized = normalizeLangCode(nextCode) || 'en';
  currentLang = normalized;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, currentLang);
    }
  } catch {
    // ignore
  }
  syncDocumentLangAndDir(currentLang);
  for (const fn of listeners) {
    try {
      fn(currentLang);
    } catch {
      // ignore listener errors
    }
  }
  return currentLang;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ============================================================================
// 1. UI Chrome & Interactive Mode Strings (12 Languages)
// ============================================================================
const UI_STRINGS = {
  "en": {
    "skipToContent": "Skip to content",
    "homeBtn": "Home",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "stars earned",
    "soundLabel": "Sound",
    "langLabel": "Language",
    "homeHeroTitle": "Explode & explore how the world works from the inside out!",
    "homeHeroLead": "Pick any real-world supercar, airliner, submarine, smartphone, rocket engine, laptop, or building—switch between 67 iconic models, blow them apart in 3D, and earn stars!",
    "homeFooterNote": "Inside Out Studio • Interactive 3D engineering lab with 12-language Chirp 3 HD voice narration.",
    "resetStarsBtn": "Reset my stars",
    "modelsBadge": "🎛️ {count} Realistic 3D Models",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} parts",
    "waysToPlay": "Ways to play",
    "selectModelVariant": "Select 3D Model Variant",
    "modeExplore": "Explore",
    "modeFind": "Find It!",
    "modeBuild": "Build It!",
    "modeQuiz": "Quiz",
    "explodeBtn": "Explode!",
    "assembleBtn": "Assemble!",
    "howFarApart": "How far apart",
    "xrayTitle": "X-Ray / Cutaway view",
    "spinTitle": "Auto-rotate 3D model",
    "labelsTitle": "Show part names",
    "resetViewTitle": "Reset the view",
    "xrayOnMsg": "🩻 X-Ray Cutaway On: See right through outer shells!",
    "xrayOffMsg": "🩻 X-Ray Cutaway Off",
    "stageTip": "Drag to spin • Pinch or scroll to zoom • Tap any part • Click {emoji} {verb} {hint}",
    "stageLoading": "Getting the studio ready…",
    "stageErrorTitle": "Oh no! This browser can't show 3D models.",
    "stageErrorSub": "Try a newer browser like Chrome, Safari, Edge or Firefox.",
    "readAloud": "Read Aloud",
    "explodeSeeInside": "Explode to see inside",
    "assembleBack": "Assemble back",
    "funFactPrefix": "💡 Fun Fact: {fact}",
    "partsDiscovered": "Parts Discovered ({found}/{total})",
    "partsCountHeading": "3D Parts ({total})",
    "exploreHelper": "Tap any 3D piece or part button below to inspect it and earn Explore stars!",
    "findRoundLabel": "Find It! • Round {round} of {total}",
    "cluePrefix": "Clue: {desc}",
    "hearClue": "🗣️ Hear Clue",
    "showHint": "💡 Show Hint & Highlight",
    "lookForGlowing": "Look for the glowing {name}!",
    "findHelperTitle": "Spin & tap the 3D piece in the blueprint stage!",
    "findHelperSub": "You can click directly on the 3D model or use the category locator buttons below:",
    "tap3dPiece": "Tap 3D piece #{num} ({category})",
    "foundRightMsg": "{praise} That's the {name}!",
    "foundOopsMsg": "Oops, that's the {wrong}! Try finding the {target}.",
    "wrongPiece": "wrong piece",
    "findCelebTitle": "You found every part of the {name}!",
    "findCelebText": "You spotted all {count} parts in the 3D exploded model!",
    "playBuildNext": "🧩 Play Build It! next",
    "buildStep1Msg": "Step 1: Tap the glowing {name} to snap it into place!",
    "buildStepLabel": "Build It! • Step {step} of {total}",
    "snapIntoPlaceBtn": "🧩 Snap {name} Into Place!",
    "partsAssembledCount": "{done} of {total} parts assembled",
    "assemblyChecklistTitle": "Assembly Blueprint Checklist",
    "assemblyChecklistSub": "Tap the floating 3D piece in the stage or click any part below to snap it home!",
    "alreadyBoltedMsg": "That part is already bolted in!",
    "snappedStepMsg": "{praise} Snapped in the {snapped}! Next: {next}",
    "assembled100Msg": "🎉 100% Assembled! The {name} is ready to roll!",
    "buildCelebTitle": "You built the {name}!",
    "buildCelebText": "Every single piece ({total}/{total}) is snapped into place!",
    "takeQuizNext": "❓ Take the Quiz!",
    "quizProgressLabel": "Question {num} of {total} • Score: {score}",
    "readQuestion": "🗣️ Read Question",
    "quizCorrectToast": "⭐ Correct! Streak: {streak}",
    "quizWrongFeedback": "Not quite! The right answer is {name} — {desc}",
    "quizLookHighlighted": "Look at the highlighted {name}!",
    "seeQuizScore": "🏆 See My Quiz Score!",
    "nextQuestion": "Next Question →",
    "quizCelebTitle": "Quiz Complete: {score} / {total}!",
    "quizPerfectText": "Perfect score! You are a certified {name} Chief Engineer!",
    "quizGoodText": "Great job learning how the {name} works from the inside out!",
    "backToExplore": "🔍 Back to Explore",
    "liveSimSubtitle": "{name} • Live Simulator",
    "simInstructions": "Use the cockpit buttons in the 3D stage or your keyboard (W/S or ↑/↓, A/D or ←/→, Space, B, H, L, R) to complete all 3 mission goals!",
    "missionChecklistTitle": "3-Star Mission Checklist",
    "resetSimBtn": "🔄 Reset",
    "resetSimTitle": "Reset Simulation (R)",
    "keepPlaying": "Keep Playing",
    "pickAnotherObject": "🏠 Pick Another Object",
    "confirmTitle": "Start over?",
    "confirmText": "This clears all your stars and found parts on this device.",
    "confirmYes": "Yes, clear my stars",
    "confirmNo": "No, keep them",
    "praiseList": [
      "Awesome!",
      "You did it!",
      "Super job!",
      "Brilliant!",
      "Engineer level!",
      "Fantastic!",
      "Way to go!"
    ]
  },
  "zh-CN": {
    "skipToContent": "跳到主要内容",
    "homeBtn": "首页",
    "brandTitle": "透视工坊 Inside Out Studio",
    "starsEarned": "已获星星",
    "soundLabel": "音效与语音",
    "langLabel": "语言",
    "homeHeroTitle": "3D 拆解与透视：从内到外探索万物运转的奥秘！",
    "homeHeroLead": "任选超跑、客机、核潜艇、智能手机、火箭发动机、笔记本电脑或现代建筑——在 63+ 款高精度 3D 模型间自由切换，一键爆炸拆解并赢取星星！",
    "homeFooterNote": "透视工坊 Inside Out Studio • 支持离线运行。无广告、无追踪，数据完全保存在本地设备。",
    "resetStarsBtn": "重置我的星星",
    "modelsBadge": "🎛️ {count} 款高精度 3D 模型",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} 个部件",
    "waysToPlay": "互动模式",
    "selectModelVariant": "选择 3D 模型型号",
    "modeExplore": "探索",
    "modeFind": "找一找！",
    "modeBuild": "拼装！",
    "modeQuiz": "问答挑战",
    "explodeBtn": "爆炸拆解！",
    "assembleBtn": "组合复原！",
    "howFarApart": "拆解间距",
    "xrayTitle": "X 光透视切面",
    "spinTitle": "自动旋转 3D 模型",
    "labelsTitle": "显示部件名称标签",
    "resetViewTitle": "重置视角",
    "xrayOnMsg": "🩻 X 光透视已开启：穿透外壳直视内部结构！",
    "xrayOffMsg": "🩻 X 光透视已关闭",
    "stageTip": "拖动旋转 • 双指或滚轮缩放 • 点击任意部件 • 点击 {emoji} {verb} {hint}",
    "stageLoading": "正在准备 3D 实验室…",
    "stageErrorTitle": "哎呀！当前浏览器不支持显示 3D 模型。",
    "stageErrorSub": "请尝试使用新版 Chrome、Safari、Edge 或 Firefox 浏览器。",
    "readAloud": "语音朗读",
    "explodeSeeInside": "拆解查看内部",
    "assembleBack": "组合复原",
    "funFactPrefix": "💡 趣味知识：{fact}",
    "partsDiscovered": "已探索部件 ({found}/{total})",
    "partsCountHeading": "3D 部件列表 ({total})",
    "exploreHelper": "点击 3D 舞台中的零件或下方按钮即可查看工程解析并赢取探索之星！",
    "findRoundLabel": "找一找！• 第 {round} / {total} 轮",
    "cluePrefix": "线索：{desc}",
    "hearClue": "🗣️ 朗读线索",
    "showHint": "💡 显示提示并高亮",
    "lookForGlowing": "请寻找正在发光的【{name}】！",
    "findHelperTitle": "旋转并在 3D 舞台中点击对应的零件！",
    "findHelperSub": "你可以直接点击 3D 模型上的零件，或使用下方的定位按钮：",
    "tap3dPiece": "点击 #{num} 号 3D 部件 ({category})",
    "foundRightMsg": "{praise} 这正是【{name}】！",
    "foundOopsMsg": "哎呀，那是【{wrong}】！请继续寻找【{target}】。",
    "wrongPiece": "其他零件",
    "findCelebTitle": "你找齐了【{name}】的所有核心部件！",
    "findCelebText": "你在 3D 爆炸视图中成功识别了全部 {count} 个部件！",
    "playBuildNext": "🧩 下一步：挑战“拼装！”",
    "buildStep1Msg": "第 1 步：点击发光的【{name}】将它安装到位！",
    "buildStepLabel": "拼装！• 第 {step} / {total} 步",
    "snapIntoPlaceBtn": "🧩 将【{name}】安装到位！",
    "partsAssembledCount": "已拼装 {done} / {total} 个部件",
    "assemblyChecklistTitle": "工程拼装蓝图清单",
    "assemblyChecklistSub": "点击舞台中悬浮的 3D 部件或下方列表即可将其精准归位！",
    "alreadyBoltedMsg": "该部件已经紧固安装好了！",
    "snappedStepMsg": "{praise} 已安装【{snapped}】！下一个：{next}",
    "assembled100Msg": "🎉 100% 拼装完成！【{name}】已整装待发！",
    "buildCelebTitle": "你成功拼装了【{name}】！",
    "buildCelebText": "全部 ({total}/{total}) 个精密部件均已严丝合缝地组装完毕！",
    "takeQuizNext": "❓ 参加工程问答挑战！",
    "quizProgressLabel": "第 {num} / {total} 题 • 得分：{score}",
    "readQuestion": "🗣️ 朗读题目",
    "quizCorrectToast": "⭐ 回答正确！连对：{streak}",
    "quizWrongFeedback": "差一点！正确答案是【{name}】—— {desc}",
    "quizLookHighlighted": "请看舞台中高亮显示的【{name}】！",
    "seeQuizScore": "🏆 查看我的测试成绩！",
    "nextQuestion": "下一题 →",
    "quizCelebTitle": "问答完成：{score} / {total} 分！",
    "quizPerfectText": "满分通关！你是认证的【{name}】总工程师！",
    "quizGoodText": "干得漂亮！你已经掌握了【{name}】的内部构造原理！",
    "backToExplore": "🔍 返回探索模式",
    "liveSimSubtitle": "{name} • 实时物理模拟器",
    "simInstructions": "使用 3D 舞台上的驾驶舱按钮或键盘按键（W/S 或 ↑/↓、A/D 或 ←/→、空格键、B、H、L、R）完成全部 3 项任务目标！",
    "missionChecklistTitle": "三星任务目标清单",
    "resetSimBtn": "🔄 重置",
    "resetSimTitle": "重置模拟 (R)",
    "keepPlaying": "继续游玩",
    "pickAnotherObject": "🏠 选择其他模型",
    "confirmTitle": "确定要重新开始吗？",
    "confirmText": "这将清除当前设备上已获得的所有星星和已发现部件记录。",
    "confirmYes": "是的，清除星星",
    "confirmNo": "不用，保留记录",
    "praiseList": [
      "太棒了！",
      "干得漂亮！",
      "超级厉害！",
      "天才表现！",
      "总工程师水准！",
      "精彩绝伦！",
      "完美命中！"
    ]
  },
  "zh-HK": {
    "skipToContent": "跳去主要內容",
    "homeBtn": "主頁",
    "brandTitle": "透視工坊 Inside Out Studio",
    "starsEarned": "已攞星星",
    "soundLabel": "聲效同語音",
    "langLabel": "語言",
    "homeHeroTitle": "3D 拆解同透視：由內到外探索萬物運作嘅奧秘！",
    "homeHeroLead": "揀選超跑、客機、核潛艇、智能手機、火箭引擎、手提電腦或者現代建築——喺 63+ 款高精度 3D 模型之間自由切換，一撳爆炸拆解並贏取星星！",
    "homeFooterNote": "透視工坊 Inside Out Studio • 支援離線運作。無廣告、無追蹤，所有資料完全留喺你部機入面。",
    "resetStarsBtn": "重設我嘅星星",
    "modelsBadge": "🎛️ {count} 款逼真 3D 模型",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} 個零件",
    "waysToPlay": "玩法模式",
    "selectModelVariant": "揀選 3D 模型型號",
    "modeExplore": "探索",
    "modeFind": "搵零件！",
    "modeBuild": "砌返好！",
    "modeQuiz": "問答挑戰",
    "explodeBtn": "爆炸拆解！",
    "assembleBtn": "砌返埋！",
    "howFarApart": "拆解距離",
    "xrayTitle": "X 光透視切面",
    "spinTitle": "自動旋轉 3D 模型",
    "labelsTitle": "顯示零件名稱標籤",
    "resetViewTitle": "重設鏡頭角度",
    "xrayOnMsg": "🩻 X 光透視已開：睇穿外殼直視內部結構！",
    "xrayOffMsg": "🩻 X 光透視已關",
    "stageTip": "拖曳旋轉 • 雙指或滾輪縮放 • 撳任何零件 • 撳 {emoji} {verb} {hint}",
    "stageLoading": "緊係準備緊 3D 實驗室…",
    "stageErrorTitle": "弊家伙！呢個瀏覽器顯示唔到 3D 模型。",
    "stageErrorSub": "請試下用新版本嘅 Chrome、Safari、Edge 或者 Firefox。",
    "readAloud": "廣東話朗讀",
    "explodeSeeInside": "拆開睇入面",
    "assembleBack": "砌返原狀",
    "funFactPrefix": "💡 趣味冷知識：{fact}",
    "partsDiscovered": "已發現零件 ({found}/{total})",
    "partsCountHeading": "3D 零件清單 ({total})",
    "exploreHelper": "撳一下 3D 舞台入面嘅零件或者下面嘅掣，就可以睇詳細解說同攞探索星星！",
    "findRoundLabel": "搵零件！• 第 {round} / {total} 關",
    "cluePrefix": "提示：{desc}",
    "hearClue": "🗣️ 聽下提示",
    "showHint": "💡 顯示提示並發光",
    "lookForGlowing": "快啲搵出閃緊光嘅【{name}】啦！",
    "findHelperTitle": "轉動鏡頭並喺 3D 舞台入面撳中對應嘅零件！",
    "findHelperSub": "你可以直接撳 3D 模型上面嘅零件，或者用下面嘅分類定位掣：",
    "tap3dPiece": "撳第 #{num} 號 3D 零件 ({category})",
    "foundRightMsg": "{praise} 呢件就係【{name}】喇！",
    "foundOopsMsg": "哎呀，嗰件係【{wrong}】嚟㗎！試下搵【{target}】啦。",
    "wrongPiece": "第二件零件",
    "findCelebTitle": "你搵齊晒【{name}】嘅所有零件喇！",
    "findCelebText": "你喺 3D 爆炸圖入面成功認出晒全部 {count} 件零件！",
    "playBuildNext": "🧩 下一關：玩「砌返好！」",
    "buildStep1Msg": "第 1 步：撳一下發光嘅【{name}】將佢裝返入去！",
    "buildStepLabel": "砌返好！• 第 {step} / {total} 步",
    "snapIntoPlaceBtn": "🧩 將【{name}】啪入原位！",
    "partsAssembledCount": "已組裝 {done} / {total} 件零件",
    "assemblyChecklistTitle": "工程組裝藍圖清單",
    "assemblyChecklistSub": "撳舞台上面浮起嘅 3D 零件或者下面嘅清單，就可以將佢啪返入位！",
    "alreadyBoltedMsg": "呢件零件已經上實晒螺絲㗎喇！",
    "snappedStepMsg": "{praise} 已經裝好【{snapped}】！下一件：{next}",
    "assembled100Msg": "🎉 100% 組裝完成！【{name}】隨時可以出發！",
    "buildCelebTitle": "你成功砌好咗【{name}】！",
    "buildCelebText": "全部 ({total}/{total}) 件精密零件已經完全歸位！",
    "takeQuizNext": "❓ 挑戰問答遊戲！",
    "quizProgressLabel": "第 {num} / {total} 題 • 分數：{score}",
    "readQuestion": "🗣️ 朗讀問題",
    "quizCorrectToast": "⭐ 答啱咗！連中：{streak}",
    "quizWrongFeedback": "差少少！正確答案係【{name}】—— {desc}",
    "quizLookHighlighted": "睇下舞台入面發光嘅【{name}】啦！",
    "seeQuizScore": "🏆 睇下我嘅成績！",
    "nextQuestion": "下一題 →",
    "quizCelebTitle": "問答完成：{score} / {total} 分！",
    "quizPerfectText": "滿分過關！你係認證嘅【{name}】總工程師！",
    "quizGoodText": "好叻呀！你已經徹底明解【{name}】由內到外嘅運作原理！",
    "backToExplore": "🔍 返去探索模式",
    "liveSimSubtitle": "{name} • 即時物理模擬器",
    "simInstructions": "用 3D 舞台上面嘅駕駛艙掣或者鍵盤（W/S 或 ↑/↓、A/D 或 ←/→、Space、B、H、L、R）完成晒 3 個任務目標啦！",
    "missionChecklistTitle": "三星任務清單",
    "resetSimBtn": "🔄 重設",
    "resetSimTitle": "重設模擬器 (R)",
    "keepPlaying": "繼續玩",
    "pickAnotherObject": "🏠 揀另一個模型",
    "confirmTitle": "重新開始？",
    "confirmText": "呢個動作會洗走呢部機上面儲落嘅所有星星同零件紀錄。",
    "confirmYes": "係，洗走星星",
    "confirmNo": "唔好，留返佢哋",
    "praiseList": [
      "好嘢！",
      "勁呀！",
      "超正！",
      "犀利！",
      "工程師級數！",
      "一流呀！",
      "完全正確！"
    ]
  },
  "es": {
    "skipToContent": "Saltar al contenido",
    "homeBtn": "Inicio",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "estrellas ganadas",
    "soundLabel": "Sonido",
    "langLabel": "Idioma",
    "homeHeroTitle": "¡Despieza y explora cómo funciona el mundo desde dentro hacia fuera!",
    "homeHeroLead": "Elige cualquier superdeportivo, avión comercial, submarino, smartphone, motor cohete, portátil o edificio real: cambia entre más de 63 modelos icónicos, desármalos en 3D y gana estrellas.",
    "homeFooterNote": "Inside Out Studio • Funciona sin conexión. Sin anuncios, sin rastreo, nada sale de tu dispositivo.",
    "resetStarsBtn": "Reiniciar mis estrellas",
    "modelsBadge": "🎛️ {count} Modelos 3D Realistas",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} piezas",
    "waysToPlay": "Modos de juego",
    "selectModelVariant": "Seleccionar variante del modelo 3D",
    "modeExplore": "Explorar",
    "modeFind": "¡Encuéntralo!",
    "modeBuild": "¡Armar!",
    "modeQuiz": "Test",
    "explodeBtn": "¡Despiezar!",
    "assembleBtn": "¡Ensamblar!",
    "howFarApart": "Distancia de despiece",
    "xrayTitle": "Vista de Rayos X / Corte",
    "spinTitle": "Rotación automática 3D",
    "labelsTitle": "Mostrar nombres de piezas",
    "resetViewTitle": "Restablecer vista",
    "xrayOnMsg": "🩻 Vista Rayos X activada: ¡Mira a través del chasis exterior!",
    "xrayOffMsg": "🩻 Vista Rayos X desactivada",
    "stageTip": "Arrastra para girar • Pellizca o usa la rueda para zoom • Toca cualquier pieza • Pulsa {emoji} {verb} {hint}",
    "stageLoading": "Preparando el estudio 3D…",
    "stageErrorTitle": "¡Vaya! Este navegador no puede mostrar modelos 3D.",
    "stageErrorSub": "Prueba con un navegador actualizado como Chrome, Safari, Edge o Firefox.",
    "readAloud": "Leer en voz alta",
    "explodeSeeInside": "Despiezar para ver el interior",
    "assembleBack": "Volver a ensamblar",
    "funFactPrefix": "💡 Dato curioso: {fact}",
    "partsDiscovered": "Piezas descubiertas ({found}/{total})",
    "partsCountHeading": "Piezas 3D ({total})",
    "exploreHelper": "¡Toca cualquier pieza 3D o botón inferior para inspeccionarla y ganar estrellas de Exploración!",
    "findRoundLabel": "¡Encuéntralo! • Ronda {round} de {total}",
    "cluePrefix": "Pista: {desc}",
    "hearClue": "🗣️ Escuchar pista",
    "showHint": "💡 Mostrar pista y resaltar",
    "lookForGlowing": "¡Busca la pieza brillante: {name}!",
    "findHelperTitle": "¡Gira y toca la pieza 3D en el escenario!",
    "findHelperSub": "Puedes hacer clic directamente en el modelo 3D o usar los botones localizadores abajo:",
    "tap3dPiece": "Tocar pieza 3D n.º {num} ({category})",
    "foundRightMsg": "¡{praise} ¡Esa es la pieza {name}!",
    "foundOopsMsg": "¡Ups, esa es {wrong}! Intenta encontrar {target}.",
    "wrongPiece": "la pieza equivocada",
    "findCelebTitle": "¡Encontraste todas las piezas de {name}!",
    "findCelebText": "¡Localizaste las {count} piezas en el modelo 3D despiezado!",
    "playBuildNext": "🧩 Jugar a ¡Armar! ahora",
    "buildStep1Msg": "Paso 1: ¡Toca la pieza brillante ({name}) para encajarla en su sitio!",
    "buildStepLabel": "¡Armar! • Paso {step} de {total}",
    "snapIntoPlaceBtn": "🧩 ¡Encajar {name} en su sitio!",
    "partsAssembledCount": "{done} de {total} piezas ensambladas",
    "assemblyChecklistTitle": "Plano de ensamblaje",
    "assemblyChecklistSub": "¡Toca la pieza 3D flotante o haz clic en cualquier pieza de la lista para instalarla!",
    "alreadyBoltedMsg": "¡Esa pieza ya está atornillada en su lugar!",
    "snappedStepMsg": "{praise} ¡Instalaste {snapped}! Siguiente: {next}",
    "assembled100Msg": "🎉 ¡100% Ensamblado! ¡{name} está listo para la acción!",
    "buildCelebTitle": "¡Construiste {name}!",
    "buildCelebText": "¡Cada una de las piezas ({total}/{total}) está ensamblada en su lugar!",
    "takeQuizNext": "❓ ¡Hacer el Test!",
    "quizProgressLabel": "Pregunta {num} de {total} • Puntos: {score}",
    "readQuestion": "🗣️ Leer pregunta",
    "quizCorrectToast": "⭐ ¡Correcto! Racha: {streak}",
    "quizWrongFeedback": "¡Casi! La respuesta correcta es {name} — {desc}",
    "quizLookHighlighted": "¡Mira la pieza resaltada: {name}!",
    "seeQuizScore": "🏆 ¡Ver mi puntuación!",
    "nextQuestion": "Siguiente pregunta →",
    "quizCelebTitle": "¡Test completado: {score} / {total}!",
    "quizPerfectText": "¡Puntuación perfecta! ¡Eres Ingeniero Jefe certificado de {name}!",
    "quizGoodText": "¡Gran trabajo aprendiendo cómo funciona {name} por dentro y por fuera!",
    "backToExplore": "🔍 Volver a Explorar",
    "liveSimSubtitle": "{name} • Simulador en vivo",
    "simInstructions": "¡Usa los controles de cabina en el escenario 3D o tu teclado (W/S o ↑/↓, A/D o ←/→, Espacio, B, H, L, R) para completar las 3 misiones!",
    "missionChecklistTitle": "Misiones de 3 Estrellas",
    "resetSimBtn": "🔄 Reiniciar",
    "resetSimTitle": "Reiniciar simulación (R)",
    "keepPlaying": "Seguir jugando",
    "pickAnotherObject": "🏠 Elegir otro objeto",
    "confirmTitle": "¿Empezar de cero?",
    "confirmText": "Esto borrará todas tus estrellas y piezas descubiertas en este dispositivo.",
    "confirmYes": "Sí, borrar mis estrellas",
    "confirmNo": "No, conservarlas",
    "praiseList": [
      "¡Increíble!",
      "¡Lo lograste!",
      "¡Súper bien!",
      "¡Brillante!",
      "¡Nivel ingeniero!",
      "¡Fantástico!",
      "¡Así se hace!"
    ]
  },
  "fr": {
    "skipToContent": "Aller au contenu principal",
    "homeBtn": "Accueil",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "étoiles gagnées",
    "soundLabel": "Son",
    "langLabel": "Langue",
    "homeHeroTitle": "Éclatez et explorez le fonctionnement du monde de l’intérieur !",
    "homeHeroLead": "Choisissez une supercar, un avion de ligne, un sous-marin, un smartphone, un moteur-fusée, un ordinateur portable ou un bâtiment — basculez entre plus de 63 modèles 3D réalistes et gagnez des étoiles !",
    "homeFooterNote": "Inside Out Studio • Fonctionne hors ligne. Sans publicité, sans pistage, tout reste sur cet appareil.",
    "resetStarsBtn": "Réinitialiser mes étoiles",
    "modelsBadge": "🎛️ {count} Modèles 3D Réalistes",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} pièces",
    "waysToPlay": "Modes de jeu",
    "selectModelVariant": "Choisir une variante du modèle 3D",
    "modeExplore": "Explorer",
    "modeFind": "Trouver !",
    "modeBuild": "Assembler !",
    "modeQuiz": "Quiz",
    "explodeBtn": "Vue éclatée !",
    "assembleBtn": "Assembler !",
    "howFarApart": "Écartement des pièces",
    "xrayTitle": "Vue Rayons X / Écorché",
    "spinTitle": "Rotation automatique 3D",
    "labelsTitle": "Afficher le nom des pièces",
    "resetViewTitle": "Réinitialiser la caméra",
    "xrayOnMsg": "🩻 Vue Rayons X activée : voyez à travers la carrosserie !",
    "xrayOffMsg": "🩻 Vue Rayons X désactivée",
    "stageTip": "Glissez pour tourner • Pincez ou défilez pour zoomer • Touchez une pièce • Cliquez sur {emoji} {verb} {hint}",
    "stageLoading": "Préparation du studio 3D…",
    "stageErrorTitle": "Oups ! Ce navigateur ne peut pas afficher les modèles 3D.",
    "stageErrorSub": "Essayez un navigateur récent comme Chrome, Safari, Edge ou Firefox.",
    "readAloud": "Lire à voix haute",
    "explodeSeeInside": "Éclater pour voir l’intérieur",
    "assembleBack": "Réassembler",
    "funFactPrefix": "💡 Le saviez-vous ? {fact}",
    "partsDiscovered": "Pièces découvertes ({found}/{total})",
    "partsCountHeading": "Pièces 3D ({total})",
    "exploreHelper": "Touchez une pièce 3D ou un bouton ci-dessous pour l’inspecter et gagner des étoiles !",
    "findRoundLabel": "Trouver ! • Manche {round} sur {total}",
    "cluePrefix": "Indice : {desc}",
    "hearClue": "🗣️ Écouter l’indice",
    "showHint": "💡 Indice et surbrillance",
    "lookForGlowing": "Cherchez la pièce illuminée : {name} !",
    "findHelperTitle": "Faites pivoter et touchez la pièce 3D sur la scène !",
    "findHelperSub": "Cliquez directement sur le modèle 3D ou utilisez les boutons de repérage ci-dessous :",
    "tap3dPiece": "Toucher la pièce 3D n°{num} ({category})",
    "foundRightMsg": "{praise} C’est bien {name} !",
    "foundOopsMsg": "Oups, ça c’est {wrong} ! Essayez de trouver {target}.",
    "wrongPiece": "la mauvaise pièce",
    "findCelebTitle": "Vous avez trouvé toutes les pièces de {name} !",
    "findCelebText": "Vous avez repéré les {count} pièces dans la vue éclatée 3D !",
    "playBuildNext": "🧩 Jouer à Assembler !",
    "buildStep1Msg": "Étape 1 : Touchez la pièce illuminée ({name}) pour l’emboîter !",
    "buildStepLabel": "Assembler ! • Étape {step} sur {total}",
    "snapIntoPlaceBtn": "🧩 Emboîter {name} !",
    "partsAssembledCount": "{done} sur {total} pièces assemblées",
    "assemblyChecklistTitle": "Plan d’assemblage",
    "assemblyChecklistSub": "Touchez la pièce 3D flottante ou cliquez sur un élément ci-dessous pour le fixer !",
    "alreadyBoltedMsg": "Cette pièce est déjà boulonnée !",
    "snappedStepMsg": "{praise} {snapped} fixé ! Suivant : {next}",
    "assembled100Msg": "🎉 100 % Assemblé ! {name} est prêt à partir !",
    "buildCelebTitle": "Vous avez construit {name} !",
    "buildCelebText": "Toutes les pièces ({total}/{total}) sont parfaitement assemblées !",
    "takeQuizNext": "❓ Passer le Quiz !",
    "quizProgressLabel": "Question {num} sur {total} • Score : {score}",
    "readQuestion": "🗣️ Lire la question",
    "quizCorrectToast": "⭐ Exact ! Série : {streak}",
    "quizWrongFeedback": "Pas tout à fait ! La bonne réponse est {name} — {desc}",
    "quizLookHighlighted": "Regardez la pièce en surbrillance : {name} !",
    "seeQuizScore": "🏆 Voir mon score !",
    "nextQuestion": "Question suivante →",
    "quizCelebTitle": "Quiz terminé : {score} / {total} !",
    "quizPerfectText": "Score parfait ! Vous êtes Ingénieur en Chef certifié pour {name} !",
    "quizGoodText": "Bravo, vous comprenez maintenant comment fonctionne {name} de l’intérieur !",
    "backToExplore": "🔍 Retour à Explorer",
    "liveSimSubtitle": "{name} • Simulateur en direct",
    "simInstructions": "Utilisez les commandes du cockpit sur la scène 3D ou votre clavier (W/S ou ↑/↓, A/D ou ←/→, Espace, B, H, L, R) pour accomplir les 3 missions !",
    "missionChecklistTitle": "Missions 3 Étoiles",
    "resetSimBtn": "🔄 Réinitialiser",
    "resetSimTitle": "Réinitialiser la simulation (R)",
    "keepPlaying": "Continuer à jouer",
    "pickAnotherObject": "🏠 Choisir un autre objet",
    "confirmTitle": "Recommencer à zéro ?",
    "confirmText": "Cela effacera toutes vos étoiles et pièces découvertes sur cet appareil.",
    "confirmYes": "Oui, effacer mes étoiles",
    "confirmNo": "Non, les garder",
    "praiseList": [
      "Génial !",
      "Bravo !",
      "Super boulot !",
      "Brillant !",
      "Niveau ingénieur !",
      "Fantastique !",
      "Bien joué !"
    ]
  },
  "de": {
    "skipToContent": "Zum Hauptinhalt springen",
    "homeBtn": "Start",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "Sterne gesammelt",
    "soundLabel": "Ton",
    "langLabel": "Sprache",
    "homeHeroTitle": "Zerlege und entdecke, wie die Welt von innen heraus funktioniert!",
    "homeHeroLead": "Wähle Supersportwagen, Verkehrsflugzeuge, U-Boote, Smartphones, Raketentriebwerke, Laptops oder Gebäude – wechsle zwischen über 63 detailgetreuen 3D-Modellen, zerlege sie in der Explosionsansicht und sammle Sterne!",
    "homeFooterNote": "Inside Out Studio • Funktioniert offline. Keine Werbung, kein Tracking – alle Daten bleiben auf diesem Gerät.",
    "resetStarsBtn": "Meine Sterne zurücksetzen",
    "modelsBadge": "🎛️ {count} Realistische 3D-Modelle",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} Teile",
    "waysToPlay": "Spielmodi",
    "selectModelVariant": "3D-Modellvariante wählen",
    "modeExplore": "Erkunden",
    "modeFind": "Finde es!",
    "modeBuild": "Bauen!",
    "modeQuiz": "Quiz",
    "explodeBtn": "Explosionsansicht!",
    "assembleBtn": "Zusammenbauen!",
    "howFarApart": "Explosionsabstand",
    "xrayTitle": "Röntgen- / Schnittansicht",
    "spinTitle": "3D-Modell automatisch drehen",
    "labelsTitle": "Teilnamen anzeigen",
    "resetViewTitle": "Kamera zurücksetzen",
    "xrayOnMsg": "🩻 Röntgenansicht ein: Blicke direkt durch die Außenhülle!",
    "xrayOffMsg": "🩻 Röntgenansicht aus",
    "stageTip": "Ziehen zum Drehen • Scrollen zum Zoomen • Tippe auf ein Teil • Klicke auf {emoji} {verb} {hint}",
    "stageLoading": "3D-Studio wird vorbereitet…",
    "stageErrorTitle": "Oh nein! Dieser Browser unterstützt keine 3D-Modelle.",
    "stageErrorSub": "Bitte verwende einen aktuellen Browser wie Chrome, Safari, Edge oder Firefox.",
    "readAloud": "Vorlesen",
    "explodeSeeInside": "Zerlegen & ins Innere schauen",
    "assembleBack": "Wieder zusammenbauen",
    "funFactPrefix": "💡 Spannender Fakt: {fact}",
    "partsDiscovered": "Entdeckte Teile ({found}/{total})",
    "partsCountHeading": "3D-Bauteile ({total})",
    "exploreHelper": "Tippe auf ein 3D-Bauteil oder einen Button unten, um es zu untersuchen und Erkundungs-Sterne zu sammeln!",
    "findRoundLabel": "Finde es! • Runde {round} von {total}",
    "cluePrefix": "Hinweis: {desc}",
    "hearClue": "🗣️ Hinweis vorlesen",
    "showHint": "💡 Tipp anzeigen & hervorheben",
    "lookForGlowing": "Suche nach dem leuchtenden Bauteil: {name}!",
    "findHelperTitle": "Drehe das Modell und tippe auf das gesuchte 3D-Bauteil!",
    "findHelperSub": "Du kannst direkt auf das 3D-Modell klicken oder die Such-Buttons unten nutzen:",
    "tap3dPiece": "3D-Teil Nr. {num} antippen ({category})",
    "foundRightMsg": "{praise} Das ist {name}!",
    "foundOopsMsg": "Hoppla, das ist {wrong}! Versuche {target} zu finden.",
    "wrongPiece": "das falsche Teil",
    "findCelebTitle": "Du hast alle Bauteile von {name} gefunden!",
    "findCelebText": "Du hast alle {count} Bauteile im 3D-Explosionsmodell entdeckt!",
    "playBuildNext": "🧩 Als Nächstes: Bauen! spielen",
    "buildStep1Msg": "Schritt 1: Tippe auf das leuchtende Bauteil ({name}), um es einzubauen!",
    "buildStepLabel": "Bauen! • Schritt {step} von {total}",
    "snapIntoPlaceBtn": "🧩 {name} einbauen!",
    "partsAssembledCount": "{done} von {total} Bauteilen montiert",
    "assemblyChecklistTitle": "Montage-Bauplan",
    "assemblyChecklistSub": "Tippe auf das schwebende 3D-Teil oder klicke unten auf ein Bauteil, um es zu montieren!",
    "alreadyBoltedMsg": "Dieses Bauteil ist bereits fest verschraubt!",
    "snappedStepMsg": "{praise} {snapped} montiert! Als Nächstes: {next}",
    "assembled100Msg": "🎉 100 % montiert! {name} ist einsatzbereit!",
    "buildCelebTitle": "Du hast {name} zusammengebaut!",
    "buildCelebText": "Jedes einzelne Bauteil ({total}/{total}) sitzt perfekt an seinem Platz!",
    "takeQuizNext": "❓ Jetzt das Quiz starten!",
    "quizProgressLabel": "Frage {num} von {total} • Punkte: {score}",
    "readQuestion": "🗣️ Frage vorlesen",
    "quizCorrectToast": "⭐ Richtig! Serie: {streak}",
    "quizWrongFeedback": "Fast! Die richtige Antwort ist {name} — {desc}",
    "quizLookHighlighted": "Schau auf das hervorgehobene Bauteil: {name}!",
    "seeQuizScore": "🏆 Mein Quiz-Ergebnis anzeigen!",
    "nextQuestion": "Nächste Frage →",
    "quizCelebTitle": "Quiz abgeschlossen: {score} / {total}!",
    "quizPerfectText": "Volle Punktzahl! Du bist zertifizierter Chefingenieur für {name}!",
    "quizGoodText": "Klasse gemacht! Du weißt jetzt, wie {name} von innen heraus funktioniert!",
    "backToExplore": "🔍 Zurück zum Erkunden",
    "liveSimSubtitle": "{name} • Live-Simulator",
    "simInstructions": "Nutze die Cockpit-Buttons auf der 3D-Bühne oder deine Tastatur (W/S oder ↑/↓, A/D oder ←/→, Leertaste, B, H, L, R), um alle 3 Missionsziele zu erfüllen!",
    "missionChecklistTitle": "3-Sterne-Missionsziele",
    "resetSimBtn": "🔄 Reset",
    "resetSimTitle": "Simulation zurücksetzen (R)",
    "keepPlaying": "Weiterspielen",
    "pickAnotherObject": "🏠 Anderes Modell wählen",
    "confirmTitle": "Von vorn beginnen?",
    "confirmText": "Dadurch werden alle gesammelten Sterne und gefundenen Bauteile auf diesem Gerät gelöscht.",
    "confirmYes": "Ja, Sterne löschen",
    "confirmNo": "Nein, behalten",
    "praiseList": [
      "Fantastisch!",
      "Geschafft!",
      "Super Arbeit!",
      "Brillant!",
      "Ingenieurs-Niveau!",
      "Großartig!",
      "Weiter so!"
    ]
  },
  "nl": {
    "skipToContent": "Ga naar hoofdinhoud",
    "homeBtn": "Start",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "sterren verdiend",
    "soundLabel": "Geluid en spraak",
    "langLabel": "Taal",
    "homeHeroTitle": "Haal alles uit elkaar in 3D en ontdek hoe de wereld van binnen werkt!",
    "homeHeroLead": "Kies een echte supercar, passagiersvliegtuig, duikboot, smartphone, raketmotor, laptop of gebouw — wissel tussen 67 iconische 3D-modellen, klap ze open en verdien sterren!",
    "homeFooterNote": "Inside Out Studio • Interactief 3D-technieklab met meertalige spraakbegeleiding.",
    "resetStarsBtn": "Sterren wissen",
    "modelsBadge": "🎛️ {count} Realistische 3D-modellen",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} onderdelen",
    "waysToPlay": "Speelmodi",
    "selectModelVariant": "Kies 3D-modelvariant",
    "modeExplore": "Ontdekken",
    "modeFind": "Zoek het!",
    "modeBuild": "Bouw het!",
    "modeQuiz": "Quiz",
    "explodeBtn": "Uitklappen!",
    "assembleBtn": "Monteren!",
    "howFarApart": "Explosieafstand",
    "xrayTitle": "Röntgen- / doorsnedeweergave",
    "spinTitle": "3D-model automatisch draaien",
    "labelsTitle": "Onderdeelnamen tonen",
    "resetViewTitle": "Camera resetten",
    "xrayOnMsg": "🩻 Röntgendoorsnede aan: kijk dwars door de buitenkant heen!",
    "xrayOffMsg": "🩻 Röntgendoorsnede uit",
    "stageTip": "Sleep om te draaien • Knijp of scroll om in te zoomen • Tik op een onderdeel • Klik op {emoji} {verb} {hint}",
    "stageLoading": "Studio wordt klaargemaakt…",
    "stageErrorTitle": "Oeps! Deze browser kan geen 3D-modellen weergeven.",
    "stageErrorSub": "Probeer een nieuwere browser zoals Chrome, Safari, Edge of Firefox.",
    "readAloud": "Voorlezen",
    "explodeSeeInside": "Uitklappen om binnenin te kijken",
    "assembleBack": "Weer in elkaar zetten",
    "funFactPrefix": "💡 Weetje: {fact}",
    "partsDiscovered": "Ontdekte onderdelen ({found}/{total})",
    "partsCountHeading": "3D-onderdelen ({total})",
    "exploreHelper": "Tik op een 3D-onderdeel of een knop hieronder om het te onderzoeken en Ontdek-sterren te verdienen!",
    "findRoundLabel": "Zoek het! • Ronde {round} van {total}",
    "cluePrefix": "Aanwijzing: {desc}",
    "hearClue": "🗣️ Aanwijzing beluisteren",
    "showHint": "💡 Hint tonen en oplichten",
    "lookForGlowing": "Zoek naar het oplichtende onderdeel: {name}!",
    "findHelperTitle": "Draai het model en tik op het juiste 3D-onderdeel!",
    "findHelperSub": "Klik direct op het 3D-model of gebruik de onderdeellocators hieronder:",
    "tap3dPiece": "Tik op 3D-onderdeel #{num} ({category})",
    "foundRightMsg": "{praise} Dat is inderdaad {name}!",
    "foundOopsMsg": "Bijna! Dat is {wrong}. Probeer {target} te vinden.",
    "wrongPiece": "een ander onderdeel",
    "findCelebTitle": "Je hebt elk onderdeel van {name} gevonden!",
    "findCelebText": "Je hebt alle {count} onderdelen in het 3D-explosiemodel herkend!",
    "playBuildNext": "🧩 Speel nu Bouw het!",
    "buildStep1Msg": "Stap 1: Tik op het oplichtende onderdeel ({name}) om het vast te klikken!",
    "buildStepLabel": "Bouw het! • Stap {step} van {total}",
    "snapIntoPlaceBtn": "🧩 Klik {name} op zijn plaats!",
    "partsAssembledCount": "{done} van {total} onderdelen gemonteerd",
    "assemblyChecklistTitle": "Montageblauwdruk & controlelijst",
    "assemblyChecklistSub": "Tik op het zwevende 3D-onderdeel of klik hieronder om het op zijn plek te monteren!",
    "alreadyBoltedMsg": "Dat onderdeel zit al stevig vast!",
    "snappedStepMsg": "{praise} {snapped} gemonteerd! Volgende: {next}",
    "assembled100Msg": "🎉 100% gemonteerd! {name} is klaar voor actie!",
    "buildCelebTitle": "Je hebt {name} gebouwd!",
    "buildCelebText": "Elk afzonderlijk onderdeel ({total}/{total}) zit precies op zijn plaats!",
    "takeQuizNext": "❓ Doe de Quiz!",
    "quizProgressLabel": "Vraag {num} van {total} • Score: {score}",
    "readQuestion": "🗣️ Vraag voorlezen",
    "quizCorrectToast": "⭐ Goed! Reeks: {streak}",
    "quizWrongFeedback": "Net niet! Het juiste antwoord is {name} — {desc}",
    "quizLookHighlighted": "Kijk naar het gemarkeerde onderdeel: {name}!",
    "seeQuizScore": "🏆 Bekijk mijn quizscore!",
    "nextQuestion": "Volgende vraag →",
    "quizCelebTitle": "Quiz voltooid: {score} / {total}!",
    "quizPerfectText": "Perfecte score! Je bent nu gecertificeerd hoofdingenieur van {name}!",
    "quizGoodText": "Knap gedaan! Je weet nu hoe {name} van binnen en van buiten werkt!",
    "backToExplore": "🔍 Terug naar Ontdekken",
    "liveSimSubtitle": "{name} • Live simulator",
    "simInstructions": "Gebruik de cockpitknoppen in het 3D-venster of je toetsenbord (W/S of ↑/↓, A/D of ←/→, Spatie, B, H, L, R) om alle 3 missiedoelen te voltooien!",
    "missionChecklistTitle": "3-sterren missiedoelen",
    "resetSimBtn": "🔄 Reset",
    "resetSimTitle": "Simulatie resetten (R)",
    "keepPlaying": "Verder spelen",
    "pickAnotherObject": "🏠 Kies een ander object",
    "confirmTitle": "Opnieuw beginnen?",
    "confirmText": "Hiermee wis je al je verzamelde sterren en ontdekte onderdelen op dit apparaat.",
    "confirmYes": "Ja, wis mijn sterren",
    "confirmNo": "Nee, behouden",
    "praiseList": [
      "Geweldig!",
      "Gelukt!",
      "Super gedaan!",
      "Briljant!",
      "Echt ingenieurswerk!",
      "Fantastisch!",
      "Helemaal goed!"
    ]
  },
  "pt": {
    "skipToContent": "Pular para o conteúdo",
    "homeBtn": "Início",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "estrelas ganhas",
    "soundLabel": "Som",
    "langLabel": "Idioma",
    "homeHeroTitle": "Desmonte e explore como o mundo funciona de dentro para fora!",
    "homeHeroLead": "Escolha qualquer supercarro, avião comercial, submarino, smartphone, motor de foguete, notebook ou edifício — alterne entre mais de 63 modelos 3D realistas, exploda as peças em 3D e ganhe estrelas!",
    "homeFooterNote": "Inside Out Studio • Funciona offline. Sem anúncios, sem rastreamento, nada sai deste dispositivo.",
    "resetStarsBtn": "Zerar minhas estrelas",
    "modelsBadge": "🎛️ {count} Modelos 3D Realistas",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} peças",
    "waysToPlay": "Modos de jogo",
    "selectModelVariant": "Selecionar variante do modelo 3D",
    "modeExplore": "Explorar",
    "modeFind": "Encontre!",
    "modeBuild": "Montar!",
    "modeQuiz": "Quiz",
    "explodeBtn": "Explodir!",
    "assembleBtn": "Montar!",
    "howFarApart": "Distância das peças",
    "xrayTitle": "Visão Raio-X / Corte",
    "spinTitle": "Girar modelo 3D automaticamente",
    "labelsTitle": "Mostrar nomes das peças",
    "resetViewTitle": "Redefinir câmera",
    "xrayOnMsg": "🩻 Visão Raio-X ativada: veja através da carenagem externa!",
    "xrayOffMsg": "🩻 Visão Raio-X desativada",
    "stageTip": "Arraste para girar • Pinça ou rolagem para zoom • Toque em qualquer peça • Clique em {emoji} {verb} {hint}",
    "stageLoading": "Preparando o estúdio 3D…",
    "stageErrorTitle": "Ah não! Este navegador não consegue exibir modelos 3D.",
    "stageErrorSub": "Tente usar um navegador atualizado como Chrome, Safari, Edge ou Firefox.",
    "readAloud": "Ler em voz alta",
    "explodeSeeInside": "Explodir para ver por dentro",
    "assembleBack": "Montar novamente",
    "funFactPrefix": "💡 Curiosidade: {fact}",
    "partsDiscovered": "Peças descobertas ({found}/{total})",
    "partsCountHeading": "Peças 3D ({total})",
    "exploreHelper": "Toque em qualquer peça 3D ou botão abaixo para inspecioná-la e ganhar estrelas de Exploração!",
    "findRoundLabel": "Encontre! • Rodada {round} de {total}",
    "cluePrefix": "Dica: {desc}",
    "hearClue": "🗣️ Ouvir dica",
    "showHint": "💡 Mostrar dica e destacar",
    "lookForGlowing": "Procure a peça brilhante: {name}!",
    "findHelperTitle": "Gire e toque na peça 3D no palco!",
    "findHelperSub": "Você pode clicar diretamente no modelo 3D ou usar os botões localizadores abaixo:",
    "tap3dPiece": "Tocar peça 3D nº {num} ({category})",
    "foundRightMsg": "{praise} Essa é a peça {name}!",
    "foundOopsMsg": "Ops, essa é {wrong}! Tente encontrar {target}.",
    "wrongPiece": "a peça errada",
    "findCelebTitle": "Você encontrou todas as peças de {name}!",
    "findCelebText": "Você localizou todas as {count} peças no modelo 3D explodido!",
    "playBuildNext": "🧩 Jogar Montar! a seguir",
    "buildStep1Msg": "Passo 1: Toque na peça brilhante ({name}) para encaixá-la no lugar!",
    "buildStepLabel": "Montar! • Passo {step} de {total}",
    "snapIntoPlaceBtn": "🧩 Encaixar {name} no lugar!",
    "partsAssembledCount": "{done} de {total} peças montadas",
    "assemblyChecklistTitle": "Lista de Montagem do Projeto",
    "assemblyChecklistSub": "Toque na peça 3D flutuante ou clique em qualquer peça abaixo para encaixá-la!",
    "alreadyBoltedMsg": "Essa peça já está parafusada no lugar!",
    "snappedStepMsg": "{praise} {snapped} encaixado! Próximo: {next}",
    "assembled100Msg": "🎉 100% Montado! {name} está pronto para partir!",
    "buildCelebTitle": "Você construiu {name}!",
    "buildCelebText": "Cada uma das peças ({total}/{total}) foi encaixada perfeitamente!",
    "takeQuizNext": "❓ Fazer o Quiz!",
    "quizProgressLabel": "Pergunta {num} de {total} • Pontos: {score}",
    "readQuestion": "🗣️ Ler pergunta",
    "quizCorrectToast": "⭐ Correto! Sequência: {streak}",
    "quizWrongFeedback": "Quase! A resposta certa é {name} — {desc}",
    "quizLookHighlighted": "Olhe para a peça destacada: {name}!",
    "seeQuizScore": "🏆 Ver minha pontuação!",
    "nextQuestion": "Próxima pergunta →",
    "quizCelebTitle": "Quiz concluído: {score} / {total}!",
    "quizPerfectText": "Pontuação perfeita! Você é Engenheiro-Chefe certificado de {name}!",
    "quizGoodText": "Ótimo trabalho aprendendo como {name} funciona por dentro e por fora!",
    "backToExplore": "🔍 Voltar para Explorar",
    "liveSimSubtitle": "{name} • Simulador ao Vivo",
    "simInstructions": "Use os botões do cockpit no palco 3D ou o teclado (W/S ou ↑/↓, A/D ou ←/→, Espaço, B, H, L, R) para concluir as 3 metas da missão!",
    "missionChecklistTitle": "Missões de 3 Estrelas",
    "resetSimBtn": "🔄 Reiniciar",
    "resetSimTitle": "Reiniciar simulação (R)",
    "keepPlaying": "Continuar jogando",
    "pickAnotherObject": "🏠 Escolher outro objeto",
    "confirmTitle": "Começar de novo?",
    "confirmText": "Isso apagará todas as suas estrelas e peças encontradas neste dispositivo.",
    "confirmYes": "Sim, zerar minhas estrelas",
    "confirmNo": "Não, manter tudo",
    "praiseList": [
      "Incrível!",
      "Você conseguiu!",
      "Mandou bem!",
      "Brilhante!",
      "Nível engenheiro!",
      "Fantástico!",
      "Show de bola!"
    ]
  },
  "it": {
    "skipToContent": "Vai al contenuto principale",
    "homeBtn": "Home",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "stelle ottenute",
    "soundLabel": "Audio",
    "langLabel": "Lingua",
    "homeHeroTitle": "Scomponi ed esplora come funziona il mondo dall’interno!",
    "homeHeroLead": "Scegli una supercar, un aereo di linea, un sottomarino, uno smartphone, un motore a razzo, un laptop o un edificio: passa tra oltre 63 modelli 3D realistici, esplodili in 3D e conquista le stelle!",
    "homeFooterNote": "Inside Out Studio • Funziona offline. Nessuna pubblicità, nessun tracciamento, tutto resta sul tuo dispositivo.",
    "resetStarsBtn": "Azzera le mie stelle",
    "modelsBadge": "🎛️ {count} Modelli 3D Realistici",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} parti",
    "waysToPlay": "Modalità di gioco",
    "selectModelVariant": "Seleziona variante modello 3D",
    "modeExplore": "Esplora",
    "modeFind": "Trovalo!",
    "modeBuild": "Costruisci!",
    "modeQuiz": "Quiz",
    "explodeBtn": "Esplodi!",
    "assembleBtn": "Assembla!",
    "howFarApart": "Distanza esplosione",
    "xrayTitle": "Vista Raggi X / Spaccato",
    "spinTitle": "Rotazione automatica 3D",
    "labelsTitle": "Mostra nomi dei componenti",
    "resetViewTitle": "Reimposta visuale",
    "xrayOnMsg": "🩻 Vista Raggi X attiva: guarda attraverso la scocca esterna!",
    "xrayOffMsg": "🩻 Vista Raggi X disattivata",
    "stageTip": "Trascina per ruotare • Pizzica o scorri per lo zoom • Tocca un componente • Clicca su {emoji} {verb} {hint}",
    "stageLoading": "Preparazione dello studio 3D…",
    "stageErrorTitle": "Oh no! Questo browser non può mostrare modelli 3D.",
    "stageErrorSub": "Prova un browser aggiornato come Chrome, Safari, Edge o Firefox.",
    "readAloud": "Leggi ad alta voce",
    "explodeSeeInside": "Esplodi per vedere l’interno",
    "assembleBack": "Riassembla",
    "funFactPrefix": "💡 Curiosità: {fact}",
    "partsDiscovered": "Componenti scoperti ({found}/{total})",
    "partsCountHeading": "Componenti 3D ({total})",
    "exploreHelper": "Tocca qualsiasi pezzo 3D o pulsante qui sotto per ispezionarlo e guadagnare stelle Esplorazione!",
    "findRoundLabel": "Trovalo! • Turno {round} di {total}",
    "cluePrefix": "Indizio: {desc}",
    "hearClue": "🗣️ Ascolta indizio",
    "showHint": "💡 Mostra suggerimento ed evidenzia",
    "lookForGlowing": "Cerca il componente illuminato: {name}!",
    "findHelperTitle": "Ruota e tocca il componente 3D sul palco!",
    "findHelperSub": "Puoi cliccare direttamente sul modello 3D o usare i pulsanti di ricerca qui sotto:",
    "tap3dPiece": "Tocca pezzo 3D n° {num} ({category})",
    "foundRightMsg": "{praise} Quello è proprio {name}!",
    "foundOopsMsg": "Ops, quello è {wrong}! Prova a trovare {target}.",
    "wrongPiece": "il pezzo sbagliato",
    "findCelebTitle": "Hai trovato tutti i componenti di {name}!",
    "findCelebText": "Hai individuato tutti i {count} componenti nel modello 3D esploso!",
    "playBuildNext": "🧩 Gioca a Costruisci!",
    "buildStep1Msg": "Passo 1: Tocca il componente illuminato ({name}) per incastrarlo al suo posto!",
    "buildStepLabel": "Costruisci! • Passo {step} di {total}",
    "snapIntoPlaceBtn": "🧩 Installa {name}!",
    "partsAssembledCount": "{done} di {total} componenti assemblati",
    "assemblyChecklistTitle": "Piano di Assemblaggio",
    "assemblyChecklistSub": "Tocca il pezzo 3D fluttuante o clicca su un componente qui sotto per montarlo!",
    "alreadyBoltedMsg": "Questo componente è già imbullonato al suo posto!",
    "snappedStepMsg": "{praise} {snapped} installato! Prossimo: {next}",
    "assembled100Msg": "🎉 Assemblato al 100%! {name} è pronto a partire!",
    "buildCelebTitle": "Hai costruito {name}!",
    "buildCelebText": "Ogni singolo componente ({total}/{total}) è stato montato alla perfezione!",
    "takeQuizNext": "❓ Fai il Quiz!",
    "quizProgressLabel": "Domanda {num} di {total} • Punteggio: {score}",
    "readQuestion": "🗣️ Leggi domanda",
    "quizCorrectToast": "⭐ Esatto! Serie: {streak}",
    "quizWrongFeedback": "Quasi! La risposta corretta è {name} — {desc}",
    "quizLookHighlighted": "Guarda il componente evidenziato: {name}!",
    "seeQuizScore": "🏆 Vedi il mio punteggio!",
    "nextQuestion": "Prossima domanda →",
    "quizCelebTitle": "Quiz completato: {score} / {total}!",
    "quizPerfectText": "Punteggio perfetto! Sei Ingegnere Capo certificato di {name}!",
    "quizGoodText": "Ottimo lavoro, ora sai come funziona {name} dall’interno!",
    "backToExplore": "🔍 Torna a Esplora",
    "liveSimSubtitle": "{name} • Simulatore dal Vivo",
    "simInstructions": "Usa i pulsanti della cabina sul palco 3D o la tastiera (W/S o ↑/↓, A/D o ←/→, Spazio, B, H, L, R) per completare tutte e 3 le missioni!",
    "missionChecklistTitle": "Missioni a 3 Stelle",
    "resetSimBtn": "🔄 Reset",
    "resetSimTitle": "Reimposta simulazione (R)",
    "keepPlaying": "Continua a giocare",
    "pickAnotherObject": "🏠 Scegli un altro oggetto",
    "confirmTitle": "Ricominciare da capo?",
    "confirmText": "Questo cancellerà tutte le stelle e i componenti trovati su questo dispositivo.",
    "confirmYes": "Sì, cancella le mie stelle",
    "confirmNo": "No, mantienile",
    "praiseList": [
      "Fantastico!",
      "Ce l’hai fatta!",
      "Ottimo lavoro!",
      "Brillante!",
      "Livello ingegnere!",
      "Magnifico!",
      "Così si fa!"
    ]
  },
  "ja": {
    "skipToContent": "メインコンテンツへ移動",
    "homeBtn": "ホーム",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "獲得スター",
    "soundLabel": "サウンド",
    "langLabel": "言語",
    "homeHeroTitle": "3D分解＆透視：世界のあらゆるメカの仕組みを内側から探検しよう！",
    "homeHeroLead": "スーパーカー、旅客機、潜水艦、スマートフォン、ロケットエンジン、ノートPC、建築物など63種類以上のリアルな3Dモデルを切り替え、分解してスターを集めよう！",
    "homeFooterNote": "Inside Out Studio • オフライン対応。広告なし・トラッキングなし、すべてのデータはこの端末内に保存されます。",
    "resetStarsBtn": "スターをリセット",
    "modelsBadge": "🎛️ リアルな3Dモデル {count}種",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} パーツ",
    "waysToPlay": "プレイモード",
    "selectModelVariant": "3Dモデルを選択",
    "modeExplore": "探索",
    "modeFind": "パーツ探し！",
    "modeBuild": "組み立て！",
    "modeQuiz": "クイズ",
    "explodeBtn": "分解する！",
    "assembleBtn": "組み立てる！",
    "howFarApart": "分解の広がり",
    "xrayTitle": "X線シースルー表示",
    "spinTitle": "3Dモデル自動回転",
    "labelsTitle": "パーツ名を表示",
    "resetViewTitle": "視点をリセット",
    "xrayOnMsg": "🩻 X線カットアウェイ ON：外装を透かして内部構造をチェック！",
    "xrayOffMsg": "🩻 X線カットアウェイ OFF",
    "stageTip": "ドラッグで回転 • ピンチ/スクロールで拡大縮小 • パーツをタップ • {emoji} {verb} をクリック {hint}",
    "stageLoading": "3Dスタジオを準備中…",
    "stageErrorTitle": "お使いのブラウザは3D表示に対応していません。",
    "stageErrorSub": "Chrome、Safari、Edge、Firefoxの最新版をお試しください。",
    "readAloud": "音声で読み上げる",
    "explodeSeeInside": "分解して内部を見る",
    "assembleBack": "元通りに組み立てる",
    "funFactPrefix": "💡 豆知識：{fact}",
    "partsDiscovered": "発見したパーツ ({found}/{total})",
    "partsCountHeading": "3Dパーツ一覧 ({total})",
    "exploreHelper": "3Dパーツまたは下のボタンをタップして詳細を調べ、探索スターを獲得しよう！",
    "findRoundLabel": "パーツ探し！ • ラウンド {round} / {total}",
    "cluePrefix": "ヒント：{desc}",
    "hearClue": "🗣️ ヒントを聞く",
    "showHint": "💡 ヒント表示＆ハイライト",
    "lookForGlowing": "光っている「{name}」を探そう！",
    "findHelperTitle": "3Dモデルを回してターゲットのパーツをタップしよう！",
    "findHelperSub": "3Dモデルを直接クリックするか、下のパーツ選択ボタンを使えます：",
    "tap3dPiece": "3Dパーツ #{num} ({category}) をタップ",
    "foundRightMsg": "{praise} それが「{name}」です！",
    "foundOopsMsg": "おっと、それは「{wrong}」です！「{target}」を探してみよう。",
    "wrongPiece": "別のパーツ",
    "findCelebTitle": "「{name}」の全パーツを発見しました！",
    "findCelebText": "3D分解モデルから全 {count} 個のパーツを見つけ出しました！",
    "playBuildNext": "🧩 次は「組み立て！」に挑戦",
    "buildStep1Msg": "ステップ1：光っている「{name}」をタップして取り付けよう！",
    "buildStepLabel": "組み立て！ • ステップ {step} / {total}",
    "snapIntoPlaceBtn": "🧩 「{name}」を取り付ける！",
    "partsAssembledCount": "{done} / {total} パーツ組み立て済み",
    "assemblyChecklistTitle": "組み立てブループリント一覧",
    "assemblyChecklistSub": "ステージ上の浮いている3Dパーツ、または下のリストをクリックして組み立てよう！",
    "alreadyBoltedMsg": "そのパーツはすでに取り付けられています！",
    "snappedStepMsg": "{praise} 「{snapped}」を装着！ 次は：{next}",
    "assembled100Msg": "🎉 100% 組み立て完了！「{name}」の完成です！",
    "buildCelebTitle": "「{name}」を組み立てました！",
    "buildCelebText": "全パーツ ({total}/{total}) が完璧に組み上がりました！",
    "takeQuizNext": "❓ クイズに挑戦する！",
    "quizProgressLabel": "第 {num} / {total} 問 • スコア：{score}",
    "readQuestion": "🗣️ 問題を読み上げる",
    "quizCorrectToast": "⭐ 正解！ 連続正解：{streak}",
    "quizWrongFeedback": "惜しい！ 正解は「{name}」 — {desc}",
    "quizLookHighlighted": "ハイライトされた「{name}」を見てみよう！",
    "seeQuizScore": "🏆 クイズ結果を見る！",
    "nextQuestion": "次の問題へ →",
    "quizCelebTitle": "クイズ完了：{score} / {total} 点！",
    "quizPerfectText": "満点クリア！あなたは認定「{name}」チーフエンジニアです！",
    "quizGoodText": "素晴らしい！「{name}」の内部構造と仕組みをマスターしました！",
    "backToExplore": "🔍 探索モードに戻る",
    "liveSimSubtitle": "{name} • ライブシミュレーター",
    "simInstructions": "3Dステージのコックピットボタンまたはキーボード（W/S・↑/↓、A/D・←/→、Space、B、H、L、R）を使って3つのミッションを達成しよう！",
    "missionChecklistTitle": "3つ星ミッションリスト",
    "resetSimBtn": "🔄 リセット",
    "resetSimTitle": "シミュレーションをリセット (R)",
    "keepPlaying": "続けて遊ぶ",
    "pickAnotherObject": "🏠 別のモデルを選ぶ",
    "confirmTitle": "最初からやり直しますか？",
    "confirmText": "この端末に保存されている獲得スターと発見済みパーツの記録をすべて消去します。",
    "confirmYes": "はい、リセットする",
    "confirmNo": "いいえ、残す",
    "praiseList": [
      "すごい！",
      "やったね！",
      "素晴らしい！",
      "天才的！",
      "エンジニア級！",
      "ファンタスティック！",
      "完璧！"
    ]
  },
  "ko": {
    "skipToContent": "본문으로 건너뛰기",
    "homeBtn": "홈",
    "brandTitle": "Inside Out Studio",
    "starsEarned": "획득한 별",
    "soundLabel": "사운드",
    "langLabel": "언어",
    "homeHeroTitle": "3D 분해 & 투시: 세상의 모든 기계가 어떻게 작동하는지 속부터 탐험하세요!",
    "homeHeroLead": "슈퍼카, 여객기, 잠수함, 스마트폰, 로켓 엔진, 노트북, 건축물 등 63개 이상의 정교한 3D 모델을 전환하고, 3D로 분해하며 별을 모아보세요!",
    "homeFooterNote": "Inside Out Studio • 오프라인 작동 지원. 광고 없음, 추적 없음, 모든 데이터는 기기에만 저장됩니다.",
    "resetStarsBtn": "내 별 초기화",
    "modelsBadge": "🎛️ 실감나는 3D 모델 {count}종",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} 부품",
    "waysToPlay": "플레이 모드",
    "selectModelVariant": "3D 모델 선택",
    "modeExplore": "탐험",
    "modeFind": "부품 찾기!",
    "modeBuild": "조립하기!",
    "modeQuiz": "퀴즈",
    "explodeBtn": "분해하기!",
    "assembleBtn": "조립하기!",
    "howFarApart": "분해 간격",
    "xrayTitle": "X-레이 / 단면 투시 보기",
    "spinTitle": "3D 모델 자동 회전",
    "labelsTitle": "부품 이름 표시",
    "resetViewTitle": "시점 초기화",
    "xrayOnMsg": "🩻 X-레이 투시 켜짐: 외장 케이스 너머 내부 구조를 확인하세요!",
    "xrayOffMsg": "🩻 X-레이 투시 꺼짐",
    "stageTip": "드래그하여 회전 • 핀치/스크롤로 확대 • 부품을 탭하세요 • {emoji} {verb} 클릭 {hint}",
    "stageLoading": "3D 스튜디오 준비 중…",
    "stageErrorTitle": "앗! 이 브라우저에서는 3D 모델을 표시할 수 없습니다.",
    "stageErrorSub": "Chrome, Safari, Edge 또는 Firefox 최신 버전을 사용해 보세요.",
    "readAloud": "음성으로 듣기",
    "explodeSeeInside": "분해해서 내부 보기",
    "assembleBack": "다시 조립하기",
    "funFactPrefix": "💡 흥미로운 사실: {fact}",
    "partsDiscovered": "발견한 부품 ({found}/{total})",
    "partsCountHeading": "3D 부품 목록 ({total})",
    "exploreHelper": "3D 부품이나 아래 버튼을 탭해 상세 구조를 살펴보고 탐험 별을 획득하세요!",
    "findRoundLabel": "부품 찾기! • 라운드 {round} / {total}",
    "cluePrefix": "단서: {desc}",
    "hearClue": "🗣️ 단서 듣기",
    "showHint": "💡 힌트 보기 & 강조",
    "lookForGlowing": "빛나고 있는 [{name}] 부품을 찾아보세요!",
    "findHelperTitle": "3D 모델을 돌려가며 해당하는 부품을 탭하세요!",
    "findHelperSub": "3D 모델을 직접 클릭하거나 아래의 부품 찾기 버튼을 사용할 수 있습니다:",
    "tap3dPiece": "3D 부품 #{num} ({category}) 탭하기",
    "foundRightMsg": "{praise} 바로 [{name}] 부품입니다!",
    "foundOopsMsg": "앗, 그건 [{wrong}]입니다! [{target}] 부품을 찾아보세요.",
    "wrongPiece": "다른 부품",
    "findCelebTitle": "[{name}]의 모든 부품을 찾았습니다!",
    "findCelebText": "3D 분해 모델에서 총 {count}개의 부품을 모두 찾아냈습니다!",
    "playBuildNext": "🧩 다음: 조립하기! 플레이",
    "buildStep1Msg": "1단계: 빛나는 [{name}] 부품을 탭하여 제자리에 장착하세요!",
    "buildStepLabel": "조립하기! • 단계 {step} / {total}",
    "snapIntoPlaceBtn": "🧩 [{name}] 장착하기!",
    "partsAssembledCount": "부품 {done} / {total}개 조립 완료",
    "assemblyChecklistTitle": "조립 블루프린트 체크리스트",
    "assemblyChecklistSub": "스테이지에 떠 있는 3D 부품이나 아래 목록을 클릭해 제자리에 결합하세요!",
    "alreadyBoltedMsg": "이미 단단히 장착된 부품입니다!",
    "snappedStepMsg": "{praise} [{snapped}] 장착 완료! 다음: {next}",
    "assembled100Msg": "🎉 100% 조립 완료! [{name}] 출격 준비 완료!",
    "buildCelebTitle": "[{name}] 조립을 완성했습니다!",
    "buildCelebText": "모든 정밀 부품({total}/{total})이 완벽하게 제자리에 결합되었습니다!",
    "takeQuizNext": "❓ 퀴즈 도전하기!",
    "quizProgressLabel": "문제 {num} / {total} • 점수: {score}",
    "readQuestion": "🗣️ 문제 듣기",
    "quizCorrectToast": "⭐ 정답입니다! 연속 정답: {streak}",
    "quizWrongFeedback": "아깝네요! 정답은 [{name}] — {desc}",
    "quizLookHighlighted": "강조 표시된 [{name}] 부품을 확인해 보세요!",
    "seeQuizScore": "🏆 내 퀴즈 점수 보기!",
    "nextQuestion": "다음 문제 →",
    "quizCelebTitle": "퀴즈 완료: {score} / {total}점!",
    "quizPerfectText": "만점 통과! 당신은 공인 [{name}] 수석 엔지니어입니다!",
    "quizGoodText": "멋져요! [{name}]의 내부 작동 원리를 완벽히 배웠습니다!",
    "backToExplore": "🔍 탐험 모드로 돌아가기",
    "liveSimSubtitle": "{name} • 실시간 시뮬레이터",
    "simInstructions": "3D 스테이지의 조종석 버튼이나 키보드(W/S 또는 ↑/↓, A/D 또는 ←/→, 스페이스바, B, H, L, R)를 사용해 3가지 미션을 모두 달성하세요!",
    "missionChecklistTitle": "3스타 미션 체크리스트",
    "resetSimBtn": "🔄 초기화",
    "resetSimTitle": "시뮬레이션 초기화 (R)",
    "keepPlaying": "계속 플레이",
    "pickAnotherObject": "🏠 다른 모델 선택",
    "confirmTitle": "처음부터 다시 시작할까요?",
    "confirmText": "이 기기에 저장된 모든 별과 발견한 부품 기록이 초기화됩니다.",
    "confirmYes": "네, 초기화합니다",
    "confirmNo": "아니요, 유지합니다",
    "praiseList": [
      "최고예요!",
      "해냈군요!",
      "멋진 실력이에요!",
      "천재적인데요!",
      "수석 엔지니어 수준!",
      "환상적이에요!",
      "완벽해요!"
    ]
  },
  "ar": {
    "skipToContent": "انتقل إلى المحتوى الرئيسي",
    "homeBtn": "الرئيسية",
    "brandTitle": "استوديو من الداخل إلى الخارج",
    "starsEarned": "النجوم المكتسبة",
    "soundLabel": "الصوت والنطق",
    "langLabel": "اللغة",
    "homeHeroTitle": "فكّك واستكشف كيف يعمل العالم من الداخل إلى الخارج!",
    "homeHeroLead": "اختر أي سيارة خارقة أو طائرة أو غواصة أو هاتف ذكي أو محرك صاروخي أو حاسوب محمول أو مبنى حديث — بدّل بين أكثر من 63 نموذجًا ثلاثي الأبعاد وفكّكها واكسب النجوم!",
    "homeFooterNote": "استوديو من الداخل إلى الخارج • يعمل بدون إنترنت. بدون إعلانات أو تتبع، كل شيء يبقى على جهازك.",
    "resetStarsBtn": "إعادة ضبط النجوم",
    "modelsBadge": "🎛️ {count} نماذج ثلاثية الأبعاد واقعية",
    "cardStats": "⭐ {stars}/{maxStars} • 🔍 {found}/{total} أجزاء",
    "waysToPlay": "طرق اللعب والاستكشاف",
    "selectModelVariant": "اختر طراز النموذج ثلاثي الأبعاد",
    "modeExplore": "استكشف",
    "modeFind": "اعثر عليه!",
    "modeBuild": "ركّبه!",
    "modeQuiz": "اختبار",
    "explodeBtn": "تفكيك!",
    "assembleBtn": "تجميع!",
    "howFarApart": "مدى التفكيك",
    "xrayTitle": "عرض الأشعة السينية والمقطع الداخلي",
    "spinTitle": "تدوير تلقائي للنموذج ثلاثي الأبعاد",
    "labelsTitle": "إظهار أسماء الأجزاء",
    "resetViewTitle": "إعادة ضبط زاوية العرض",
    "xrayOnMsg": "🩻 تم تفعيل عرض الأشعة السينية: شاهد الأجزاء الداخلية عبر الهيكل الخارجي!",
    "xrayOffMsg": "🩻 تم إيقاف عرض الأشعة السينية",
    "stageTip": "اسحب للتدوير • قرّب للتكبير • اضغط على أي جزء • انقر {emoji} {verb} {hint}",
    "stageLoading": "جارٍ تجهيز الاستوديو ثلاثي الأبعاد…",
    "stageErrorTitle": "عذرًا! لا يدعم هذا المتصفح عرض النماذج ثلاثية الأبعاد.",
    "stageErrorSub": "يرجى تجربة متصفح حديث مثل Chrome أو Safari أو Edge أو Firefox.",
    "readAloud": "قراءة صوتية",
    "explodeSeeInside": "فكّك لرؤية الداخل",
    "assembleBack": "إعادة التجميع",
    "funFactPrefix": "💡 معلومة ممتعة: {fact}",
    "partsDiscovered": "الأجزاء المكتشفة ({found}/{total})",
    "partsCountHeading": "الأجزاء ثلاثية الأبعاد ({total})",
    "exploreHelper": "اضغط على أي قطعة ثلاثية الأبعاد أو زر أدناه لفحصها وكسب نجوم الاستكشاف!",
    "findRoundLabel": "اعثر عليه! • الجولة {round} من {total}",
    "cluePrefix": "الدليل: {desc}",
    "hearClue": "🗣️ استمع إلى الدليل",
    "showHint": "💡 إظهار التلميح والإضاءة",
    "lookForGlowing": "ابحث عن الجزء المضيء: {name}!",
    "findHelperTitle": "أدر النموذج واضغط على القطعة ثلاثية الأبعاد في المنصة!",
    "findHelperSub": "يمكنك النقر مباشرة على النموذج ثلاثي الأبعاد أو استخدام أزرار تحديد الفئة أدناه:",
    "tap3dPiece": "اضغط على القطعة #{num} ({category})",
    "foundRightMsg": "{praise} هذا هو {name}!",
    "foundOopsMsg": "عفوًا، هذا هو {wrong}! حاول العثور على {target}.",
    "wrongPiece": "الجزء الخاطئ",
    "findCelebTitle": "لقد عثرت على جميع أجزاء {name}!",
    "findCelebText": "لقد حددت جميع الأجزاء ({count}) في النموذج المفكك ثلاثي الأبعاد!",
    "playBuildNext": "🧩 العب وضع التركيب تاليًا",
    "buildStep1Msg": "الخطوة 1: اضغط على {name} المضيء لتثبيته في مكانه!",
    "buildStepLabel": "ركّبه! • الخطوة {step} من {total}",
    "snapIntoPlaceBtn": "🧩 ثبّت {name} في مكانه!",
    "partsAssembledCount": "تم تجميع {done} من أصل {total} أجزاء",
    "assemblyChecklistTitle": "قائمة مخطط التجميع الهندسي",
    "assemblyChecklistSub": "اضغط على القطعة العائمة في المنصة أو انقر على أي جزء أدناه لتثبيته في مكانه!",
    "alreadyBoltedMsg": "تم تثبيت هذا الجزء بالفعل في مكانه!",
    "snappedStepMsg": "{praise} تم تثبيت {snapped}! التالي: {next}",
    "assembled100Msg": "🎉 اكتمل التجميع بنسبة 100%! {name} جاهز للانطلاق!",
    "buildCelebTitle": "لقد قمت ببناء {name} بالكامل!",
    "buildCelebText": "تم تثبيت كل قطعة ({total}/{total}) في مكانها الصحيح!",
    "takeQuizNext": "❓ خض الاختبار الهندسي!",
    "quizProgressLabel": "السؤال {num} من {total} • النتيجة: {score}",
    "readQuestion": "🗣️ قراءة السؤال",
    "quizCorrectToast": "⭐ إجابة صحيحة! السلسلة: {streak}",
    "quizWrongFeedback": "ليست تمامًا! الإجابة الصحيحة هي {name} — {desc}",
    "quizLookHighlighted": "انظر إلى الجزء المميز: {name}!",
    "seeQuizScore": "🏆 عرض نتيجتي في الاختبار!",
    "nextQuestion": "السؤال التالي ←",
    "quizCelebTitle": "اكتمل الاختبار: {score} / {total}!",
    "quizPerfectText": "علامة كاملة! أنت كبير مهندسي {name} المعتمد!",
    "quizGoodText": "عمل رائع في تعلم كيف يعمل {name} من الداخل إلى الخارج!",
    "backToExplore": "🔍 العودة إلى وضع الاستكشاف",
    "liveSimSubtitle": "{name} • محاكي مباشر",
    "simInstructions": "استخدم أزرار قمرة القيادة في المنصة ثلاثية الأبعاد أو لوحة المفاتيح (W/S أو ↑/↓، A/D أو ←/→، Space، B، H، L، R) لإكمال مهام المحاكاة الثلاث!",
    "missionChecklistTitle": "قائمة مهام الثلاث نجوم",
    "resetSimBtn": "🔄 إعادة ضبط",
    "resetSimTitle": "إعادة ضبط المحاكاة (R)",
    "keepPlaying": "متابعة اللعب",
    "pickAnotherObject": "🏠 اختيار نموذج آخر",
    "confirmTitle": "البدء من جديد؟",
    "confirmText": "سيؤدي هذا إلى مسح جميع النجوم والأجزاء المكتشفة على هذا الجهاز.",
    "confirmYes": "نعم، امسح النجوم",
    "confirmNo": "لا، احتفظ بها",
    "praiseList": [
      "رائع!",
      "أحسنت صنعًا!",
      "عمل ممتاز!",
      "مذهل!",
      "مستوى مهندس خبير!",
      "ممتاز جدًا!",
      "إبداع هندسي!"
    ]
  }
};

export function t(key, params = {}) {
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.en;
  let str = dict[key] !== undefined ? dict[key] : (UI_STRINGS.en[key] ?? key);
  for (const [k, v] of Object.entries(params)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function tPraise(randIndexFn = (n) => Math.floor(Math.random() * n)) {
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.en;
  const list = dict.praiseList || UI_STRINGS.en.praiseList;
  return list[randIndexFn(list.length)];
}

// ============================================================================
// 2. Category Translations (All 18 Categories × 11 Languages)
// ============================================================================
const CATEGORY_I18N = {
  "car": {
    "zh-CN": {
      "name": "超跑与电动车",
      "fullName": "超跑、电动车与越野皮卡",
      "tagline": "特斯拉 Plaid • Cybertruck • Rivian R1T • 法拉利 SF90 • 兰博基尼 V12 • 福特猛禽 • 保时捷 911 GT3 RS"
    },
    "zh-HK": {
      "name": "超跑同電動車",
      "fullName": "超跑、電動車同越野農夫車",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • 法拉利 SF90 • 林寶堅尼 V12 • 福特猛禽 • 保時捷 911 GT3 RS"
    },
    "es": {
      "name": "Coches y Superdeportivos",
      "fullName": "Coches, Eléctricos, Superdeportivos y Pickups",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "fr": {
      "name": "Voitures & Supercars",
      "fullName": "Voitures, VE, Supercars & Pick-ups",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "de": {
      "name": "Autos & Supersportwagen",
      "fullName": "Autos, E-Autos, Supersportwagen & Trucks",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "nl": {
      "name": "Auto’s & Supercars",
      "fullName": "Supercars, Elektrische Auto’s & Pick-ups",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "pt": {
      "name": "Carros e Supercarros",
      "fullName": "Carros, Elétricos, Supercarros e Picapes",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "it": {
      "name": "Auto e Supercar",
      "fullName": "Auto, Elettriche, Supercar e Pick-up",
      "tagline": "Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS"
    },
    "ja": {
      "name": "スーパーカー＆EV",
      "fullName": "スーパーカー・EV・オフロードトラック",
      "tagline": "テスラ Plaid • サイバートラック • リヴィアン R1T • フェラーリ SF90 • ランボルギーニ V12 • フォード F-150 ラプター • ポルシェ 911 GT3 RS"
    },
    "ko": {
      "name": "자동차 & 슈퍼카",
      "fullName": "슈퍼카, 전기차 & 오프로드 픽업트럭",
      "tagline": "테슬라 플레이드 • 사이버트럭 • 리비안 R1T • 페라리 SF90 • 람보르기니 V12 • 포드 F-150 랩터 • 포르쉐 911 GT3 RS"
    },
    "ar": {
      "name": "السيارات الخارقة والكهربائية",
      "fullName": "السيارات الخارقة والمركبات الكهربائية والشاحنات",
      "tagline": "تسلا بلايد • سايبرترك • ريفيان R1T • فيراري SF90 • لامبورغيني V12 • فورد رابتر • بورش 911 GT3 RS"
    }
  },
  "airplane": {
    "zh-CN": {
      "name": "飞机与喷气机",
      "fullName": "民航客机、隐身战机与通用飞机",
      "tagline": "波音 737 MAX 9 • 空客 A350-1000 • F-22 猛禽隐身战机 • SR-71 黑鸟 • 塞斯纳 172"
    },
    "zh-HK": {
      "name": "飛機同噴射機",
      "fullName": "民航客機、隱形戰機同小型飛機",
      "tagline": "波音 737 MAX 9 • 空中巴士 A350-1000 • F-22 猛禽隱形戰機 • SR-71 黑鳥 • 塞斯納 172"
    },
    "es": {
      "name": "Aviones y Cazas",
      "fullName": "Aviones Comerciales, Cazas Furtivos y Avionetas",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "fr": {
      "name": "Avions & Jets",
      "fullName": "Avions de ligne, Chasseurs furtifs & Monomoteurs",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "de": {
      "name": "Flugzeuge & Jets",
      "fullName": "Verkehrsflugzeuge, Tarnkappenjets & Sportflugzeuge",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "nl": {
      "name": "Vliegtuigen & Straaljagers",
      "fullName": "Verkeersvliegtuigen, Stealth-jets & Sportvliegtuigen",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "pt": {
      "name": "Aviões e Jatos",
      "fullName": "Aviões Comerciais, Caças Furtivos e Monomotores",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "it": {
      "name": "Aerei e Jet",
      "fullName": "Aerei di Linea, Caccia Stealth e Monomotori",
      "tagline": "Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • SR-71 Blackbird • Cessna 172 Skyhawk"
    },
    "ja": {
      "name": "飛行機＆ジェット機",
      "fullName": "旅客機・ステルス戦闘機・軽飛行機",
      "tagline": "ボーイング 737 MAX 9 • エアバス A350-1000 • F-22 ラプター • SR-71 ブラックバード • セスナ 172"
    },
    "ko": {
      "name": "비행기 & 제트기",
      "fullName": "여객기, 스텔스 전투기 & 경비행기",
      "tagline": "보잉 737 MAX 9 • 에어버스 A350-1000 • 록히드 F-22 랩터 • SR-71 블랙버드 • 세스나 172"
    },
    "ar": {
      "name": "الطائرات والمقاتلات النفاثة",
      "fullName": "طائرات الركاب والمقاتلات الشبحية والطائرات الخفيفة",
      "tagline": "بوينغ 737 ماكس 9 • إيرباص A350-1000 • إف-22 رابتر • إس آر-71 بلاك بيرد • سيسنا 172"
    }
  },
  "submarine": {
    "zh-CN": {
      "name": "深海与核潜艇",
      "fullName": "核动力潜艇与深海载人潜水器",
      "tagline": "弗吉尼亚级核潜艇 • 极限因子号万米深潜器 • 鹦鹉螺号 360° 全景潜艇"
    },
    "zh-HK": {
      "name": "深海同核潛艇",
      "fullName": "核動力潛艇同深海載人潛水器",
      "tagline": "弗吉尼亞級核潛艇 • 極限因子號萬米深潛器 • 鸚鵡螺號 360° 全景潛艇"
    },
    "es": {
      "name": "Submarinos",
      "fullName": "Submarinos Nucleares y de Aguas Profundas",
      "tagline": "Submarino Nuclear Clase Virginia • DSV Limiting Factor (11.000 m) • Submarino Acrílico Nautilus 360°"
    },
    "fr": {
      "name": "Sous-marins",
      "fullName": "Sous-marins Nucléaires & Bathyscaphes",
      "tagline": "Sous-marin nucléaire classe Virginia • DSV Limiting Factor (11 000 m) • Sous-marin panoramique Nautilus 360°"
    },
    "de": {
      "name": "U-Boote",
      "fullName": "Tiefsee- & Atom-U-Boote",
      "tagline": "Virginia-Klasse Atom-U-Boot • DSV Limiting Factor (11.000 m) • Nautilus 360°-Acryl-U-Boot"
    },
    "nl": {
      "name": "Duikboten & Onderzeeërs",
      "fullName": "Diepzee- & Kernonderzeeërs",
      "tagline": "Virginia-klasse kernonderzeeër • DSV Limiting Factor (11 km diepte) • Nautilus 360° panoramaduikboot"
    },
    "pt": {
      "name": "Submarinos",
      "fullName": "Submarinos Nucleares e de Mar Profundo",
      "tagline": "Submarino Nuclear Classe Virginia • DSV Limiting Factor (11.000 m) • Submarino Acrílico Nautilus 360°"
    },
    "it": {
      "name": "Sottomarini",
      "fullName": "Sottomarini Nucleari e Abissali",
      "tagline": "Sottomarino Nucleare Classe Virginia • DSV Limiting Factor (11.000 m) • Sottomarino Panoramico Nautilus 360°"
    },
    "ja": {
      "name": "潜水艦＆深海探査艇",
      "fullName": "原子力潜水艦・深海有人探査艇",
      "tagline": "バージニア級原子力潜水艦 • リミティング・ファクター号 • ノーチラス 360° パノラマ潜水艇"
    },
    "ko": {
      "name": "잠수함 & 심해정",
      "fullName": "원자력 잠수함 & 심해 탐사정",
      "tagline": "버지니아급 핵잠수함 • 리미팅 팩터 심해 잠수정 • 노틸러스 360° 파노라마 잠수정"
    },
    "ar": {
      "name": "الغواصات وأعماق البحار",
      "fullName": "الغواصات النووية وغواصات الأعماق السحيقة",
      "tagline": "غواصة نووية فئة فيرجينيا • غواصة الأعماق ليميتينغ فاكتور • غواصة نوتيلوس البانورامية 360°"
    }
  },
  "iphone": {
    "zh-CN": {
      "name": "智能手机",
      "fullName": "iPhone、Pixel 与 Galaxy 旗舰手机",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • 三星 S24 Ultra • Galaxy Z Fold 6 折叠屏"
    },
    "zh-HK": {
      "name": "智能手機",
      "fullName": "iPhone、Pixel 同 Galaxy 旗艦手機",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • 三星 S24 Ultra • Galaxy Z Fold 6 摺機"
    },
    "es": {
      "name": "Smartphones",
      "fullName": "Smartphones iPhone, Pixel y Galaxy",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "fr": {
      "name": "Smartphones",
      "fullName": "Smartphones iPhone, Pixel & Galaxy",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "de": {
      "name": "Smartphones",
      "fullName": "iPhone, Pixel & Galaxy Smartphones",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "nl": {
      "name": "Smartphones",
      "fullName": "iPhone-, Pixel- & Galaxy-smartphones",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "pt": {
      "name": "Smartphones",
      "fullName": "Smartphones iPhone, Pixel e Galaxy",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "it": {
      "name": "Smartphone",
      "fullName": "Smartphone iPhone, Pixel e Galaxy",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "ja": {
      "name": "スマートフォン",
      "fullName": "iPhone・Pixel・Galaxy スマートフォン",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Galaxy S24 Ultra • Galaxy Z Fold 6"
    },
    "ko": {
      "name": "스마트폰",
      "fullName": "iPhone, Pixel & Galaxy 스마트폰",
      "tagline": "iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • 갤럭시 S24 울트라 • 갤럭시 Z 폴드 6"
    },
    "ar": {
      "name": "الهواتف الذكية الرائدة",
      "fullName": "هواتف آيفون وبكسل وجالاكسي الذكية",
      "tagline": "آيفون 16 برو ماكس • آيفون 16 • جوجل بكسل 9 برو XL • سامسونج S24 ألترا • جالاكسي Z فولد 6"
    }
  },
  "jet": {
    "zh-CN": {
      "name": "喷气与火箭引擎",
      "fullName": "涡扇发动机、加力燃烧室与火箭引擎",
      "tagline": "GE9X 民航涡扇发动机 • 普惠 F135 加力涡扇 • SpaceX 猛禽液氧甲烷火箭引擎"
    },
    "zh-HK": {
      "name": "噴射同火箭引擎",
      "fullName": "渦扇引擎、後燃器同火箭引擎",
      "tagline": "GE9X 民航渦扇引擎 • 普惠 F135 後燃渦扇 • SpaceX 猛禽液氧甲烷火箭引擎"
    },
    "es": {
      "name": "Motores a Reacción y Cohete",
      "fullName": "Motores Turbofán, Postcombustión y Cohete",
      "tagline": "Turbofán Comercial GE9X • Pratt & Whitney F135 • Motor Cohete SpaceX Raptor Methalox"
    },
    "fr": {
      "name": "Turboréacteurs & Moteurs-Fusées",
      "fullName": "Turboréacteurs à double flux, Postcombustion & Fusées",
      "tagline": "Turboréacteur GE9X • Pratt & Whitney F135 • Moteur-fusée SpaceX Raptor Méthalox"
    },
    "de": {
      "name": "Jet- & Raketentriebwerke",
      "fullName": "Turbofan-, Nachbrenner- & Raketentriebwerke",
      "tagline": "GE9X Turbofan • Pratt & Whitney F135 Nachbrenner • SpaceX Raptor Methalox-Raketentriebwerk"
    },
    "nl": {
      "name": "Straal- & Raketmotoren",
      "fullName": "Turbofan-, Naverbrander- & Raketmotoren",
      "tagline": "GE9X commerciële turbofan • Pratt & Whitney F135 naverbrander • SpaceX Raptor methalox-raketmotor"
    },
    "pt": {
      "name": "Motores a Jato e Foguete",
      "fullName": "Motores Turbofan, Pós-Combustão e Foguete",
      "tagline": "Turbofan Comercial GE9X • Pratt & Whitney F135 • Motor de Foguete SpaceX Raptor Methalox"
    },
    "it": {
      "name": "Motori Jet e a Razzo",
      "fullName": "Turboventola, Postbruciatore e Motori a Razzo",
      "tagline": "Turboventola GE9X • Pratt & Whitney F135 • Motore a Razzo SpaceX Raptor Methalox"
    },
    "ja": {
      "name": "ジェット＆ロケットエンジン",
      "fullName": "ターボファン・アフターバーナー・ロケットエンジン",
      "tagline": "GE9X ターボファン • P&W F135 アフターバーナー • SpaceX ラプター メタロックスエンジン"
    },
    "ko": {
      "name": "제트 & 로켓 엔진",
      "fullName": "터보팬, 애프터버너 & 로켓 엔진",
      "tagline": "GE9X 상용 터보팬 • P&W F135 애프터버너 • SpaceX 랩터 메탈록스 로켓 엔진"
    },
    "ar": {
      "name": "المحركات النفاثة والصاروخية",
      "fullName": "محركات التيربوفان والحارق اللاحق والصواريخ",
      "tagline": "محرك GE9X التوربيني المروحي • محرك F135 بالحارق اللاحق • محرك سبيس إكس رابتر"
    }
  },
  "laptop": {
    "zh-CN": {
      "name": "专业笔记本电脑",
      "fullName": "MacBook Pro、MacBook Air 与电竞笔电",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 无风扇) • RTX 4090 均热板水冷级电竞本"
    },
    "zh-HK": {
      "name": "專業手提電腦",
      "fullName": "MacBook Pro、MacBook Air 同電競手提電腦",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 無風扇) • RTX 4090 均熱板電競手提電腦"
    },
    "es": {
      "name": "Portátiles Mac y Pro",
      "fullName": "MacBook Pro, MacBook Air y Portátiles Gaming",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 sin ventilador) • Portátil Gaming RTX 4090"
    },
    "fr": {
      "name": "Ordinateurs Portables Pro",
      "fullName": "MacBook Pro, MacBook Air & PC Portables Gaming",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 sans ventilateur) • PC Portable Gaming RTX 4090"
    },
    "de": {
      "name": "Mac & Pro-Laptops",
      "fullName": "MacBook Pro, MacBook Air & Gaming-Laptops",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 lüfterlos) • RTX 4090 Vapor-Chamber Gaming-Laptop"
    },
    "nl": {
      "name": "Macs & Pro-laptops",
      "fullName": "MacBook Pro, MacBook Air & Gaming-laptops",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 passief gekoeld) • RTX 4090 Vapor-Chamber gaming-laptop"
    },
    "pt": {
      "name": "Notebooks Mac e Pro",
      "fullName": "MacBook Pro, MacBook Air e Notebooks Gamer",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 sem ventoinha) • Notebook Gamer RTX 4090"
    },
    "it": {
      "name": "Laptop Mac e Pro",
      "fullName": "MacBook Pro, MacBook Air e Laptop Gaming",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 fanless) • Laptop Gaming RTX 4090 Vapor-Chamber"
    },
    "ja": {
      "name": "Mac＆プロノートPC",
      "fullName": "MacBook Pro・MacBook Air・ゲーミングノートPC",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 ファンレス) • RTX 4090 ベイパーチャンバー搭載機"
    },
    "ko": {
      "name": "Mac & 프로 노트북",
      "fullName": "MacBook Pro, MacBook Air & 게이밍 노트북",
      "tagline": "MacBook Pro 16\" (M4 Max) • MacBook Air 15\" (M3 팬리스) • RTX 4090 베이퍼 챔버 게이밍 노트북"
    },
    "ar": {
      "name": "الحواسيب المحمولة الاحترافية",
      "fullName": "ماك بوك برو وماك بوك إير وحواسيب الألعاب",
      "tagline": "ماك بوك برو 16\" (M4 Max) • ماك بوك إير 15\" (M3) • حاسوب ألعاب RTX 4090 بغرفة بخار"
    }
  },
  "house": {
    "zh-CN": {
      "name": "现代建筑与住宅",
      "fullName": "生态智能住宅、玻璃别墅与穹顶木屋",
      "tagline": "现代双层生态智能住宅 • 现代主义钢结构玻璃别墅 • 离网测地线生态穹顶舱"
    },
    "zh-HK": {
      "name": "現代建築同住宅",
      "fullName": "生態智能住宅、玻璃別墅同穹頂木屋",
      "tagline": "現代雙層生態智能住宅 • 現代主義鋼結構玻璃別墅 • 離網測地線生態穹頂屋"
    },
    "es": {
      "name": "Casas y Arquitectura",
      "fullName": "Casas Inteligentes, Villas de Cristal y Domos Ecológicos",
      "tagline": "Casa Inteligente Ecológica de 2 Plantas • Villa de Cristal y Acero • Cabaña Domo Geodésico"
    },
    "fr": {
      "name": "Maisons & Architecture",
      "fullName": "Maisons Connectées, Villas de Verre & Dômes Éco",
      "tagline": "Maison Éco-Intelligente à 2 Étages • Villa Moderne Verre & Acier • Dôme Géodésique Autonome"
    },
    "de": {
      "name": "Häuser & Architektur",
      "fullName": "Smart Homes, Glaspavillons & Öko-Kuppeln",
      "tagline": "Modernes 2-stöckiges Öko-Smart-Home • Glas- & Stahl-Pavillonvilla • Geodätische Off-Grid-Kuppel"
    },
    "nl": {
      "name": "Huizen & Architectuur",
      "fullName": "Slimme Eco-woningen, Glazen Villa’s & Koepelhuizen",
      "tagline": "Moderne eco-smartwoning • Mid-century glas- & staalvilla • Geodetische off-grid koepelwoning"
    },
    "pt": {
      "name": "Casas e Arquitetura",
      "fullName": "Casas Inteligentes, Vilas de Vidro e Domos Ecológicos",
      "tagline": "Casa Ecológica Inteligente de 2 Andares • Vila de Vidro e Aço • Cabana Domo Geodésico Off-Grid"
    },
    "it": {
      "name": "Case e Architettura",
      "fullName": "Smart Home, Ville di Vetro e Cupole Ecologiche",
      "tagline": "Smart Home Eco a Due Piani • Villa Padiglione in Vetro e Acciaio • Cupola Geodetica Off-Grid"
    },
    "ja": {
      "name": "住宅＆モダン建築",
      "fullName": "スマートホーム・ガラスヴィラ・エコドーム",
      "tagline": "モダン2階建てエコスマートホーム • ガラス＆スチールパビリオン • ジオデシックドーム・エコキャビン"
    },
    "ko": {
      "name": "주택 & 현대 건축",
      "fullName": "스마트 홈, 글래스 파빌리온 & 에코 돔 하우스",
      "tagline": "2층 에코 스마트 홈 • 미드센추리 글래스 & 스틸 빌라 • 오프그리드 지오데식 돔 캐빈"
    },
    "ar": {
      "name": "المنازل والعمارة الحديثة",
      "fullName": "المنازل الذكية والفيلات الزجاجية والقباب البيئية",
      "tagline": "منزل ذكي بيئي من طابقين • فيلا جناح الزجاج والفولاذ • قبة جيوديسية بيئية مستقلة"
    }
  },
  "tv": {
    "zh-CN": {
      "name": "8K 电视与 IMAX 影院",
      "fullName": "8K Mini-LED、透明 OLED 与 IMAX 激光影院",
      "tagline": "85\" QD-OLED & Mini-LED 8K 电视 • LG 77\" 透明 OLED 电视 • IMAX 双 4K 激光巨幕影院系统"
    },
    "zh-HK": {
      "name": "8K 電視同 IMAX 影院",
      "fullName": "8K Mini-LED、透明 OLED 同 IMAX 激光影院",
      "tagline": "85\" QD-OLED & Mini-LED 8K 電視 • LG 77\" 透明 OLED 電視 • IMAX 雙 4K 激光巨幕影院系統"
    },
    "es": {
      "name": "Televisores 8K e IMAX",
      "fullName": "Mini-LED 8K, OLED Transparente y Cine Láser IMAX",
      "tagline": "TV 85\" QD-OLED y Mini-LED 8K • LG 77\" OLED Transparente • Cine Láser Dual-4K IMAX"
    },
    "fr": {
      "name": "TV 8K & Cinéma IMAX",
      "fullName": "Mini-LED 8K, OLED Transparent & IMAX Laser",
      "tagline": "TV 85\" QD-OLED & Mini-LED 8K • TV LG 77\" OLED Transparent • Cinéma Laser IMAX Dual-4K"
    },
    "de": {
      "name": "8K-Fernseher & IMAX",
      "fullName": "8K Mini-LED, Transparentes OLED & IMAX Laser-Kino",
      "tagline": "85\" QD-OLED & Mini-LED 8K TV • LG 77\" Transparentes OLED TV • IMAX Dual-4K Laser-Kino"
    },
    "nl": {
      "name": "8K-tv’s & IMAX",
      "fullName": "8K Mini-LED, Transparante OLED & IMAX-laser",
      "tagline": "85\" QD-OLED & Mini-LED 8K-tv • LG 77\" transparante OLED-tv • IMAX Dual-4K laserbioscoop"
    },
    "pt": {
      "name": "TVs 8K e Cinema IMAX",
      "fullName": "Mini-LED 8K, OLED Transparente e IMAX Laser",
      "tagline": "TV 85\" QD-OLED e Mini-LED 8K • TV LG 77\" OLED Transparente • Cinema IMAX Dual-4K Laser"
    },
    "it": {
      "name": "TV 8K e Cinema IMAX",
      "fullName": "Mini-LED 8K, OLED Trasparente e IMAX Laser",
      "tagline": "TV 85\" QD-OLED e Mini-LED 8K • TV LG 77\" OLED Trasparente • Cinema IMAX Dual-4K Laser"
    },
    "ja": {
      "name": "8Kテレビ＆IMAXシネマ",
      "fullName": "8K Mini-LED・透明OLED・IMAXレーザー劇場",
      "tagline": "85型 QD-OLED / Mini-LED 8Kテレビ • LG 77型 透明OLEDテレビ • IMAX デュアル4Kレーザーシネマ"
    },
    "ko": {
      "name": "8K TV & IMAX 시네마",
      "fullName": "8K Mini-LED, 투명 OLED & IMAX 레이저 시네마",
      "tagline": "85\" QD-OLED & Mini-LED 8K TV • LG 77\" 투명 OLED TV • IMAX 듀얼 4K 레이저 시네마"
    },
    "ar": {
      "name": "شاشات 8K وسينما آيماكس",
      "fullName": "تلفزيونات Mini-LED 8K وOLED الشفافة وسينما IMAX بالليزر",
      "tagline": "تلفزيون 85\" QD-OLED وMini-LED 8K • تلفزيون LG 77\" OLED شفاف • سينما IMAX ليزر مزدوج 4K"
    }
  },
  "train": {
    "zh-CN": {
      "name": "高铁与磁悬浮列车",
      "fullName": "高速动车组与超导磁悬浮列车",
      "tagline": "日本新干线 N700S • 中国复兴号 CR400AF 高铁 • 日本 L0 系超导磁悬浮列车 (603 km/h)"
    },
    "zh-HK": {
      "name": "高鐵同磁浮列車",
      "fullName": "高速動車組同超導磁浮列車",
      "tagline": "日本新幹線 N700S • 中國復興號 CR400AF 高鐵 • 日本 L0 系超導磁浮列車 (603 km/h)"
    },
    "es": {
      "name": "Trenes Bala y Maglev",
      "fullName": "Trenes de Alta Velocidad y Levitación Magnética",
      "tagline": "Shinkansen N700S • CR400AF Fuxing Hao • SCMaglev Serie L0 (603 km/h)"
    },
    "fr": {
      "name": "TGV & Trains Maglev",
      "fullName": "Trains à Grande Vitesse & Maglev Supraconducteur",
      "tagline": "Shinkansen N700S • CR400AF Fuxing Hao • SCMaglev Série L0 (603 km/h)"
    },
    "de": {
      "name": "Hochgeschwindigkeitszüge",
      "fullName": "Hochgeschwindigkeits- & Magnetschwebezüge",
      "tagline": "Shinkansen N700S • CR400AF Fuxing Hao • SCMaglev L0-Serie (603 km/h)"
    },
    "nl": {
      "name": "Hogesnelheidstreinen",
      "fullName": "Shinkansen, Fuxing & Supergeleidende Maglev",
      "tagline": "Shinkansen N700S Supreme • CR400AF Fuxing Hao • Japanse L0-serie SCMaglev (603 km/h)"
    },
    "pt": {
      "name": "Trens-Bala e Maglev",
      "fullName": "Trens de Alta Velocidade e Levitação Magnética",
      "tagline": "Shinkansen N700S • CR400AF Fuxing Hao • SCMaglev Série L0 (603 km/h)"
    },
    "it": {
      "name": "Treni Alta Velocità e Maglev",
      "fullName": "Treni Proiettile e a Levitazione Magnetica",
      "tagline": "Shinkansen N700S • CR400AF Fuxing Hao • SCMaglev Serie L0 (603 km/h)"
    },
    "ja": {
      "name": "新幹線＆リニアモーターカー",
      "fullName": "高速鉄道・超電導リニアモーターカー",
      "tagline": "新幹線 N700S かもめ/のぞみ • 復興号 CR400AF • 超電導リニア L0系 (603 km/h)"
    },
    "ko": {
      "name": "고속열차 & 자기부상열차",
      "fullName": "초고속 열차 & 초전도 자기부상열차",
      "tagline": "신칸센 N700S • 푸싱호 CR400AF • SCMaglev L0 시리즈 초전도 자기부상열차"
    },
    "ar": {
      "name": "قطارات الرصاصة وماجليف",
      "fullName": "القطارات فائقة السرعة وقطارات الرفع المغناطيسي",
      "tagline": "شينكانسن N700S • قطار فوشينغ CR400AF • قطار ماجليف فائق التوصيل L0 (603 كم/س)"
    }
  },
  "space": {
    "zh-CN": {
      "name": "空间站与航天飞机",
      "fullName": "轨道空间站与可重复使用航天器",
      "tagline": "国际空间站 (ISS) • NASA 航天飞机完整发射组合体"
    },
    "zh-HK": {
      "name": "太空站同穿梭機",
      "fullName": "軌道太空站同可重複使用太空船",
      "tagline": "國際太空站 (ISS) • NASA 太空穿梭機完整發射組合"
    },
    "es": {
      "name": "Estación Espacial y Transbordador",
      "fullName": "Estaciones Orbitales y Naves Espaciales",
      "tagline": "Estación Espacial Internacional (ISS) • Transbordador Espacial de la NASA (STS)"
    },
    "fr": {
      "name": "Station Spatiale & Navette",
      "fullName": "Stations Orbitales & Navettes Spatiales",
      "tagline": "Station Spatiale Internationale (ISS) • Navette Spatiale NASA STS"
    },
    "de": {
      "name": "Raumstation & Space Shuttle",
      "fullName": "Raumstationen & Wiederverwendbare Raumfähren",
      "tagline": "Internationale Raumstation (ISS) • NASA Space Shuttle Start-Stack (STS)"
    },
    "nl": {
      "name": "Ruimtestations & Shuttles",
      "fullName": "Internationaal Ruimtestation ISS & NASA Space Shuttle",
      "tagline": "Internationaal Ruimtestation (ISS) • NASA Space Shuttle STS Orbiter & Booster-stack"
    },
    "pt": {
      "name": "Estação Espacial e Ônibus Espacial",
      "fullName": "Estações Orbitais e Espaçonaves Reutilizáveis",
      "tagline": "Estação Espacial Internacional (ISS) • Ônibus Espacial da NASA (STS)"
    },
    "it": {
      "name": "Stazione Spaziale e Space Shuttle",
      "fullName": "Stazioni Orbitali e Navette Spaziali",
      "tagline": "Stazione Spaziale Internazionale (ISS) • NASA Space Shuttle (STS)"
    },
    "ja": {
      "name": "宇宙ステーション＆スペースシャトル",
      "fullName": "国際宇宙ステーション・再使用型宇宙往還機",
      "tagline": "国際宇宙ステーション (ISS) • NASA スペースシャトル フルランチスタック"
    },
    "ko": {
      "name": "우주정거장 & 우주왕복선",
      "fullName": "궤도 우주정거장 & 재사용 우주왕복선",
      "tagline": "국제우주정거장 (ISS) • NASA 우주왕복선 전체 발사체 (STS)"
    },
    "ar": {
      "name": "محطة الفضاء والمكوك الفضائي",
      "fullName": "المحطات المدارية والمركبات الفضائية القابلة لإعادة الاستخدام",
      "tagline": "محطة الفضاء الدولية (ISS) • مكوك الفضاء التابع لناسا (STS)"
    }
  },
  "rockets": {
    "zh-CN": {
      "name": "重型运载火箭",
      "fullName": "轨道级与登月超重型运载火箭",
      "tagline": "SpaceX 猎鹰 9 号 Block 5 • SpaceX 星舰与超重型助推器 • NASA 阿波罗土星五号登月火箭"
    },
    "zh-HK": {
      "name": "重型運載火箭",
      "fullName": "軌道級同登月超重型運載火箭",
      "tagline": "SpaceX 獵鷹 9 號 Block 5 • SpaceX 星艦同超重型助推器 • NASA 阿波羅土星五號登月火箭"
    },
    "es": {
      "name": "Cohetes Espaciales",
      "fullName": "Cohetes Orbitales y Lunares Superpesados",
      "tagline": "SpaceX Falcon 9 Block 5 • SpaceX Starship y Super Heavy • Cohete Lunar NASA Saturno V"
    },
    "fr": {
      "name": "Fusées Spatiales",
      "fullName": "Lanceurs Orbitaux & Fusées Lunaires Super-Lourdes",
      "tagline": "SpaceX Falcon 9 Block 5 • SpaceX Starship & Super Heavy • Fusée Lunaire NASA Saturn V"
    },
    "de": {
      "name": "Weltraumraketen",
      "fullName": "Orbital- & Schwerlast-Mondraketen",
      "tagline": "SpaceX Falcon 9 Block 5 • SpaceX Starship & Super Heavy • NASA Apollo Saturn V Mondrakete"
    },
    "nl": {
      "name": "Draagraketten",
      "fullName": "Herbruikbare Orbitale & Maanraketten",
      "tagline": "SpaceX Falcon 9 • SpaceX Starship & Super Heavy • NASA Saturn V Apollo-maanraket"
    },
    "pt": {
      "name": "Foguetes Espaciais",
      "fullName": "Foguetes Orbitais e Lunares Superpesados",
      "tagline": "SpaceX Falcon 9 Block 5 • SpaceX Starship e Super Heavy • Foguete Lunar NASA Saturno V"
    },
    "it": {
      "name": "Razzi Spaziali",
      "fullName": "Lanciatori Orbitali e Razzi Lunari Super-Pesanti",
      "tagline": "SpaceX Falcon 9 Block 5 • SpaceX Starship & Super Heavy • Razzo Lunare NASA Saturn V"
    },
    "ja": {
      "name": "大型ロケット",
      "fullName": "軌道ロケット＆超大型月面ロケット",
      "tagline": "SpaceX ファルコン9 Block 5 • スターシップ＆スーパーヘビー • NASA アポロ サターンV月ロケット"
    },
    "ko": {
      "name": "우주 로켓",
      "fullName": "궤도 발사체 & 초대형 달 탐사 로켓",
      "tagline": "SpaceX 팰컨 9 Block 5 • SpaceX 스타십 & 슈퍼헤비 • NASA 아폴로 새턴 V 달 로켓"
    },
    "ar": {
      "name": "الصواريخ الفضائية العملاقة",
      "fullName": "الصواريخ المدارية وصواريخ القمر فائقة الثقل",
      "tagline": "سبيس إكس فالكون 9 بلوك 5 • ستارشيب وسوبر هيفي • صاروخ القمر ساتورن 5 التابع لناسا"
    }
  },
  "robots": {
    "zh-CN": {
      "name": "机器人与外骨骼装甲",
      "fullName": "纳米战甲、火星车、工业机械臂与机器狗",
      "tagline": "钢铁侠 Mark 85 纳米战甲 • NASA 毅力号火星车 • KUKA 六轴工业机械臂 • 波士顿动力四足机器狗"
    },
    "zh-HK": {
      "name": "機械人同裝甲",
      "fullName": "納米戰甲、火星車、工業機械臂同機械狗",
      "tagline": "鐵甲奇俠 Mark 85 納米戰甲 • NASA 毅力號火星車 • KUKA 六軸工業機械臂 • 波士頓動力四足機械狗"
    },
    "es": {
      "name": "Robots y Exoesqueletos",
      "fullName": "Armaduras Nanotech, Rovers, Brazos Industriales y Cuadrúpedos",
      "tagline": "Iron Man Mark 85 • Rover Perseverance de la NASA • Brazo Robótico KUKA de 6 Ejes • Perro Robot Cuadrúpedo"
    },
    "fr": {
      "name": "Robots & Exosquelettes",
      "fullName": "Armure Nanotech, Rover Martien, Bras Industriel & Quadrupède",
      "tagline": "Iron Man Mark 85 • Rover NASA Perseverance • Bras Robotique KUKA 6 Axes • Robot Chien Quadrupède"
    },
    "de": {
      "name": "Roboter & Exoskelette",
      "fullName": "Nanotech-Rüstung, Mars-Rover, Industrieroboter & Roboterhund",
      "tagline": "Iron Man Mark 85 • NASA Perseverance Mars-Rover • 6-Achsen-Industrieroboterarm • Vierbeiniger Roboterhund"
    },
    "nl": {
      "name": "Robots & Exopakken",
      "fullName": "Exo-harnassen, Marsrovers & Industriële Robotica",
      "tagline": "Iron Man Mark LXXXV-harnas • NASA Mars Perseverance-rover • KUKA 6-assige robotarm • Viervoetige inspectierobot"
    },
    "pt": {
      "name": "Robôs e Exoesqueletos",
      "fullName": "Armadura Nanotech, Rover de Marte, Braço Industrial e Quadrúpede",
      "tagline": "Homem de Ferro Mark 85 • Rover Perseverance da NASA • Braço Robótico KUKA de 6 Eixos • Cão-Robô Quadrúpede"
    },
    "it": {
      "name": "Robot ed Esoscheletri",
      "fullName": "Armatura Nanotech, Rover Marziano, Braccio Industriale e Quadrupede",
      "tagline": "Iron Man Mark 85 • Rover NASA Perseverance • Braccio Robotico KUKA a 6 Assi • Cane Robot Quadrupede"
    },
    "ja": {
      "name": "ロボット＆パワードスーツ",
      "fullName": "ナノテクアーマー・火星探査車・産業用ロボット・四足歩行ロボ",
      "tagline": "アイアンマン マーク85 • NASA パーサヴィアランス火星ローバー • 6軸産業用ロボットアーム • 四足歩行ロボットドッグ"
    },
    "ko": {
      "name": "로봇 & 엑소슈트",
      "fullName": "나노테크 아머, 화성 로버, 산업용 로봇팔 & 4족 보행 로봇",
      "tagline": "아이언맨 마크 85 • NASA 퍼서비어런스 화성 로버 • 6축 산업용 로봇팔 • 보스턴 다이내믹스 4족 로봇개"
    },
    "ar": {
      "name": "الروبوتات والدروع الآلية",
      "fullName": "بدلات النانو ومسبار المريخ والأذرع الصناعية والروبوتات الرباعية",
      "tagline": "درع آيرون مان مارك 85 • مسبار المريخ بيرسيفيرانس • ذراع كوكا الصناعي سداسي المحاور • الروبوت الرباعي"
    }
  },
  "construction": {
    "zh-CN": {
      "name": "重型工程与农业机械",
      "fullName": "液压挖掘机、联合收割机与塔式起重机",
      "tagline": "卡特彼勒 36 吨履带液压挖掘机 • 约翰迪尔旋转联合收割机 • 利勃海尔锤头式塔吊"
    },
    "zh-HK": {
      "name": "重型工程同農業機械",
      "fullName": "液壓挖泥機、聯合收割機同天秤起重機",
      "tagline": "卡特彼勒 36 噸履帶液壓挖泥機 • 約翰迪爾聯合收割機 • 利勃海爾天秤塔式起重機"
    },
    "es": {
      "name": "Construcción y Maquinaria Pesada",
      "fullName": "Excavadoras Hidráulicas, Cosechadoras y Grúas Torre",
      "tagline": "Excavadora Hidráulica de 36 t • Cosechadora Rotativa John Deere • Grúa Torre Liebherr"
    },
    "fr": {
      "name": "Engins de Chantier & Agricoles",
      "fullName": "Pelles Hydrauliques, Moissonneuses-Batteuses & Grues à Tour",
      "tagline": "Pelle Hydraulique sur Chenilles 36 t • Moissonneuse-Batteuse John Deere • Grue à Tour Liebherr"
    },
    "de": {
      "name": "Bau- & Landmaschinen",
      "fullName": "Hydraulikbagger, Mähdrescher & Turmdrehkrane",
      "tagline": "36-Tonnen-Hydraulik-Raupenbagger • Rotations-Mähdrescher • Liebherr Turmdrehkran"
    },
    "nl": {
      "name": "Bouw- & Landbouwmachines",
      "fullName": "Graafmachines, Maaidorsers & Torenkranen",
      "tagline": "Hydraulische rupsgraafmachine • Maaidorser met graanbunker • Liebherr-torenkraan"
    },
    "pt": {
      "name": "Construção e Máquinas Pesadas",
      "fullName": "Escavadeiras Hidráulicas, Colheitadeiras e Guindastes de Torre",
      "tagline": "Escavadeira Hidráulica de 36 t • Colheitadeira Rotativa John Deere • Grua de Torre Liebherr"
    },
    "it": {
      "name": "Macchine Movimento Terra e Gru",
      "fullName": "Escavatori Idraulici, Mietitrebbie e Gru a Torre",
      "tagline": "Escavatore Idraulico Cingolato 36 t • Mietitrebbia Rotativa John Deere • Gru a Torre Liebherr"
    },
    "ja": {
      "name": "建設機械＆大型農機",
      "fullName": "油圧ショベル・コンバインハーベスター・タワークレーン",
      "tagline": "36トン油圧クローラーショベル • ジョンディア 大型コンバイン • リープヘル タワークレーン"
    },
    "ko": {
      "name": "중장비 & 건설 기계",
      "fullName": "유압 굴착기, 콤바인 수확기 & 타워 크레인",
      "tagline": "36톤 유압 크롤러 굴착기 • 존디어 로터리 콤바인 수확기 • 리프헤어 해머헤드 타워 크레인"
    },
    "ar": {
      "name": "معدات البناء والآلات الثقيلة",
      "fullName": "الحفارات الهيدروليكية والحصادات والرافعات البرجية",
      "tagline": "حفارة هيدروليكية مجنزرة 36 طنًا • حصادة جون دير الدوارة • رافعة برجية ليبهير"
    }
  },
  "helicopters": {
    "zh-CN": {
      "name": "直升机与无人机",
      "fullName": "通用直升机、救援直升机、航拍无人机与火星直升机",
      "tagline": "西科斯基 UH-60M 黑鹰直升机 • 空客 H145 医疗救援直升机 • 大疆 Mavic 3 Pro • NASA 机智号火星直升机"
    },
    "zh-HK": {
      "name": "直昇機同航拍機",
      "fullName": "軍用直昇機、救援直昇機、航拍機同火星直昇機",
      "tagline": "西科斯基 UH-60M 黑鷹直昇機 • 空中巴士 H145 醫療救援直昇機 • DJI Mavic 3 Pro • NASA 機智號火星直昇機"
    },
    "es": {
      "name": "Helicópteros y Drones",
      "fullName": "Helicópteros Militares, Rescate, Drones y Helicóptero Marciano",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 D3 Medevac • DJI Mavic 3 Pro • NASA Ingenuity Mars"
    },
    "fr": {
      "name": "Hélicoptères & Drones",
      "fullName": "Hélicoptères de Transport, Secours, Drones & Hélico Martien",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 D3 Secours • DJI Mavic 3 Pro • NASA Ingenuity Mars"
    },
    "de": {
      "name": "Hubschrauber & Drohnen",
      "fullName": "Transporthubschrauber, Rettungshubschrauber & Drohnen",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 D3 Rettungsheli • DJI Mavic 3 Pro • NASA Ingenuity Mars-Heli"
    },
    "nl": {
      "name": "Helikopters & Drones",
      "fullName": "Reddingshelikopters, Drones & Mars-helikopter",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 reddingsheli • DJI Mavic 3 Pro • NASA Ingenuity Mars-helikopter"
    },
    "pt": {
      "name": "Helicópteros e Drones",
      "fullName": "Helicópteros Táticos, Resgate, Drones e Helicóptero de Marte",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 D3 Resgate • DJI Mavic 3 Pro • NASA Ingenuity Mars"
    },
    "it": {
      "name": "Elicotteri e Droni",
      "fullName": "Elicotteri Tattici, Elisoccorso, Droni ed Elicottero Marziano",
      "tagline": "Sikorsky UH-60M Black Hawk • Airbus H145 D3 Elisoccorso • DJI Mavic 3 Pro • NASA Ingenuity Mars"
    },
    "ja": {
      "name": "ヘリコプター＆ドローン",
      "fullName": "多用途ヘリ・救急ヘリ・ドローン・火星ヘリコプター",
      "tagline": "UH-60M ブラックホーク • エアバス H145 ドクターヘリ • DJI Mavic 3 Pro • NASA インジェニュイティ火星ヘリ"
    },
    "ko": {
      "name": "헬리콥터 & 드론",
      "fullName": "기동 헬기, 응급 구조 헬기, 드론 & 화성 헬리콥터",
      "tagline": "시코르스키 UH-60M 블랙호크 • 에어버스 H145 응급 구조 헬기 • DJI 매빅 3 Pro • NASA 인제뉴어티 화성 헬기"
    },
    "ar": {
      "name": "المروحيات والطائرات المسيرة",
      "fullName": "مروحيات النقل والإنقاذ والدرون ومروحية المريخ",
      "tagline": "مروحية بلاك هوك UH-60M • مروحية الإنقاذ إيرباص H145 • درون DJI Mavic 3 Pro • مروحية المريخ إنجينويتي"
    }
  },
  "watches": {
    "zh-CN": {
      "name": "机械腕表与钟表",
      "fullName": "瑞士自动机械计时码表与落地大本钟",
      "tagline": "瑞士自动上链导柱轮计时机械腕表 • 西敏寺八音管报时重锤落地钟"
    },
    "zh-HK": {
      "name": "機械錶同座地鐘",
      "fullName": "瑞士自動機械計時錶同西敏寺座地大鐘",
      "tagline": "瑞士自動上鏈導柱輪計時機械錶 • 西敏寺八音管報時重錘座地鐘"
    },
    "es": {
      "name": "Relojes Mecánicos",
      "fullName": "Cronógrafos Suizos y Relojes de Péndulo",
      "tagline": "Cronógrafo Mecánico Automático Suizo • Reloj de Abuelo con Péndulo y Carrillón Westminster"
    },
    "fr": {
      "name": "Horlogerie & Montres",
      "fullName": "Chronographes Suisses & Horloges Comtoises à Pendule",
      "tagline": "Chronographe Mécanique Automatique Suisse • Horloge de Parquet à Pendule & Carillon Westminster"
    },
    "de": {
      "name": "Uhren & Chronographen",
      "fullName": "Schweizer Automatik-Chronographen & Standuhren",
      "tagline": "Schweizer Automatik-Chronograph • Westminster-Pendelstanduhr"
    },
    "nl": {
      "name": "Uurwerken & Klokken",
      "fullName": "Zwitserse Chronografen & Staande Slingerklokken",
      "tagline": "Zwitserse mechanische chronograaf • Klassieke staande slingerklok met slagwerk"
    },
    "pt": {
      "name": "Relógios e Horologia",
      "fullName": "Cronógrafos Suíços e Relógios de Pêndulo",
      "tagline": "Cronógrafo Mecânico Automático Suíço • Relógio de Pêndulo Westminster"
    },
    "it": {
      "name": "Orologi e Cronografi",
      "fullName": "Cronografi Meccanici Svizzeri e Orologi a Pendolo",
      "tagline": "Cronografo Meccanico Automatico Svizzero • Orologio a Pendolo Westminster"
    },
    "ja": {
      "name": "機械式時計＆振り子時計",
      "fullName": "スイス製機械式クロノグラフ・ホールクロック",
      "tagline": "スイス製自動巻きメカニカル・クロノグラフ • ウェストミンスターチャイム重錘式振り子時計"
    },
    "ko": {
      "name": "기계식 시계 & 괘종시계",
      "fullName": "스위스 오토매틱 크로노그래프 & 진자 괘종시계",
      "tagline": "스위스 오토매틱 기계식 크로노그래프 손목시계 • 웨스트민스터 차임 진자 괘종시계"
    },
    "ar": {
      "name": "الساعات الميكانيكية وساعات البندول",
      "fullName": "ساعات الكرونوغراف السويسرية وساعات البندول القائمة",
      "tagline": "كرونوغراف ميكانيكي أوتوماتيكي سويسري • ساعة بندول وستمنستر القائمة"
    }
  },
  "bikes": {
    "zh-CN": {
      "name": "单车、电助力与超跑摩托",
      "fullName": "货运电助力车、碳纤维公路车与杜卡迪超跑摩托",
      "tagline": "Tern GSD S10 电助力货运单车 • 环法级全碳纤维气动公路车 • 杜卡迪 Panigale V4 R 超级摩托"
    },
    "zh-HK": {
      "name": "單車、電單車同超跑鐵馬",
      "fullName": "貨運電動單車、碳纖維公路車同杜卡迪超跑電單車",
      "tagline": "Tern GSD S10 電動貨運單車 • 環法級全碳纖維氣動公路車 • 杜卡迪 Panigale V4 R 超級電單車"
    },
    "es": {
      "name": "Bicicletas y Superbikes",
      "fullName": "Bicicletas Eléctricas, Aero de Carbono y Superbikes",
      "tagline": "Bicicleta Eléctrica de Carga Tern GSD • Bici de Ruta Aero de Carbono • Ducati Panigale V4 R"
    },
    "fr": {
      "name": "Vélos & Superbikes",
      "fullName": "Vélos Cargo Électriques, Route Carbone & MotoGP",
      "tagline": "Vélo Cargo Électrique Tern GSD S10 • Vélo de Route Aéro en Carbone • Ducati Panigale V4 R"
    },
    "de": {
      "name": "Fahrräder & Superbikes",
      "fullName": "Lasten-E-Bikes, Carbon-Rennräder & Superbikes",
      "tagline": "Tern GSD S10 E-Lastenrad • Tour-Grade Carbon-Aero-Rennrad • Ducati Panigale V4 R Superbike"
    },
    "nl": {
      "name": "Fietsen & Motoren",
      "fullName": "E-bakfietsen, Carbon Racefietsen & Superbikes",
      "tagline": "Tern GSD cargo-e-bike • Aerodynamische carbon racefiets • Ducati Panigale V4 superbike"
    },
    "pt": {
      "name": "Bicicletas e Superbikes",
      "fullName": "E-Bikes de Carga, Speed de Carbono e Superbikes",
      "tagline": "E-Bike de Carga Tern GSD S10 • Bicicleta Speed Aero de Carbono • Ducati Panigale V4 R"
    },
    "it": {
      "name": "Bici e Superbike",
      "fullName": "Cargo E-Bike, Bici da Corsa in Carbonio e Superbike",
      "tagline": "Cargo E-Bike Tern GSD S10 • Bici Aero in Fibra di Carbonio • Ducati Panigale V4 R Superbike"
    },
    "ja": {
      "name": "自転車・Eバイク＆スーパーバイク",
      "fullName": "電動カーゴバイク・カーボンロードバイク・ドゥカティV4",
      "tagline": "Tern GSD S10 電動カーゴバイク • カーボンエアロロードバイク • ドゥカティ パニガーレ V4 R"
    },
    "ko": {
      "name": "자전거 & 슈퍼바이크",
      "fullName": "전기자전거, 카본 로드바이크 & 두카티 슈퍼바이크",
      "tagline": "Tern GSD S10 카고 전기자전거 • 카본 에어로 로드바이크 • 두카티 파니갈레 V4 R 슈퍼바이크"
    },
    "ar": {
      "name": "الدراجات الهوائية والنارية الخارقة",
      "fullName": "دراجات الشحن الكهربائية ودراجات السباق الكربونية ودوكاتي",
      "tagline": "دراجة الشحن الكهربائية Tern GSD S10 • دراجة سباق كربونية هوائية • دراجة دوكاتي بانيجال V4 R"
    }
  },
  "ships": {
    "zh-CN": {
      "name": "巨轮、游艇与航母",
      "fullName": "豪华邮轮、超级游艇、集装箱船、核航母与泰坦尼克号",
      "tagline": "海洋量子号邮轮 • 118米超级游艇 Launchpad • 24,000箱超大型集装箱船 • 核动力航母 • 泰坦尼克号"
    },
    "zh-HK": {
      "name": "巨輪、遊艇同航母",
      "fullName": "豪華郵輪、超級遊艇、貨櫃船、核航母同鐵達尼號",
      "tagline": "海洋量子號郵輪 • 118米超級遊艇 Launchpad • 24,000箱超大型貨櫃船 • 核動力航母 • 鐵達尼號"
    },
    "es": {
      "name": "Barcos, Yates y Portaaviones",
      "fullName": "Cruceros, Megayates, Portacontenedores, Portaaviones y Titanic",
      "tagline": "Crucero Quantum of the Seas • Superyate Launchpad (118 m) • Portacontenedores 24.000 TEU • Portaaviones Nuclear • RMS Titanic"
    },
    "fr": {
      "name": "Navires, Yachts & Porte-avions",
      "fullName": "Paquebots, Mégayachts, Porte-conteneurs & Porte-avions",
      "tagline": "Paquebot Quantum of the Seas • Superyacht Launchpad 118 m • Porte-conteneurs 24 000 EVP • Porte-avions Nucléaire • RMS Titanic"
    },
    "de": {
      "name": "Schiffe, Yachten & Flugzeugträger",
      "fullName": "Kreuzfahrtschiffe, Megayachten, Containerschiffe & Flugzeugträger",
      "tagline": "Quantum of the Seas • 118m Feadship-Superyacht „Launchpad“ • 24.000-TEU-Containerschiff • Atom-Flugzeugträger • RMS Titanic"
    },
    "nl": {
      "name": "Schepen & Oceaanschepen",
      "fullName": "Cruiseschepen, Megajachten, Containerschepen & Vliegdekschepen",
      "tagline": "Quantum of the Seas • Megajacht Launchpad • 24.000-TEU containerschip • Nimitz-vliegdekschip • RMS Titanic"
    },
    "pt": {
      "name": "Navios, Iates e Porta-Aviões",
      "fullName": "Cruzeiros, Megaiates, Porta-Contêineres e Porta-Aviões",
      "tagline": "Quantum of the Seas • Superiate Launchpad (118 m) • Porta-Contêineres 24.000 TEU • Porta-Aviões Nuclear • RMS Titanic"
    },
    "it": {
      "name": "Navi, Yacht e Portaerei",
      "fullName": "Navi da Crociera, Megayacht, Portacontainer e Portaerei",
      "tagline": "Quantum of the Seas • Superyacht Launchpad 118 m • Portacontainer 24.000 TEU • Portaerei Nucleare • RMS Titanic"
    },
    "ja": {
      "name": "大型船舶・メガヨット＆空母",
      "fullName": "豪華客船・メガヨット・コンテナ船・原子力空母・タイタニック号",
      "tagline": "クアンタム・オブ・ザ・シーズ • 118m メガヨット Launchpad • 24,000 TEU コンテナ船 • 原子力空母 • タイタニック号"
    },
    "ko": {
      "name": "선박, 메가요트 & 항공모함",
      "fullName": "크루즈선, 메가요트, 컨테이너선, 핵추진 항공모함 & 타이타닉호",
      "tagline": "퀀텀 오브 더 시즈 크루즈 • 118m 슈퍼요트 Launchpad • 24,000 TEU 초대형 컨테이너선 • 핵추진 항공모함 • RMS 타이타닉호"
    },
    "ar": {
      "name": "السفن العملاقة واليخوت وحاملات الطائرات",
      "fullName": "السفن السياحية واليخوت الفاخرة وسفن الحاويات وحاملات الطائرات وتايتانيك",
      "tagline": "سفينة كوانتوم أوف ذا سيز • يخت Launchpad بطول 118م • سفينة حاويات 24,000 حاوية • حاملة طائرات نووية • سفينة تايتانيك"
    }
  },
  "everyday": {
    "zh-CN": {
      "name": "日常工程奇迹",
      "fullName": "虹吸马桶、摩天楼电梯、弹子锁与意式咖啡机",
      "tagline": "重力虹吸冲水马桶 • 高层无齿轮曳引电梯 • 黄铜五弹子锁芯 • 双锅炉 9-Bar 意式浓缩咖啡机"
    },
    "zh-HK": {
      "name": "日常工程奇蹟",
      "fullName": "虹吸座廁、摩天大樓升降機、彈子鎖同意式咖啡機",
      "tagline": "重力虹吸沖水座廁 • 高層無齒輪曳引升降機 • 黃銅五彈子鎖芯 • 雙鍋爐 9-Bar 意式濃縮咖啡機"
    },
    "es": {
      "name": "Ingeniería Cotidiana",
      "fullName": "Inodoro de Sifón, Ascensor, Cerradura de Cilindro y Cafetera Espresso",
      "tagline": "Inodoro de Sifón por Gravedad • Ascensor de Tracción • Cerradura de 5 Pernos de Latón • Máquina de Café Espresso de 9 Bares"
    },
    "fr": {
      "name": "Ingénierie du Quotidien",
      "fullName": "Toilettes à Siphon, Ascenseur, Serrure à Goupilles & Machine Expresso",
      "tagline": "Toilettes à Siphon Gravitaire • Ascenseur à Traction • Serrure Cylindrique à 5 Goupilles • Machine Expresso 9 Bars"
    },
    "de": {
      "name": "Alltagstechnik",
      "fullName": "Siphon-WC, Aufzug,Stiftzylinderschloss & Siebträgermaschine",
      "tagline": "Schwerkraft-Siphon-WC • Hochhaus-Seilaufzug • Messing-Stiftzylinderschloss • 9-Bar-Dualboiler-Espressomaschine"
    },
    "nl": {
      "name": "Alledaagse Techniek",
      "fullName": "Mechanica die je Elke Dag Gebruikt",
      "tagline": "Sifon-spoeltoilet • Tractie-personenlift • Cilinderslot met stiftjes • Italiaanse espressomachine"
    },
    "pt": {
      "name": "Engenharia do Dia a Dia",
      "fullName": "Vaso Sanitário de Sifão, Elevador, Fechadura e Máquina de Espresso",
      "tagline": "Vaso Sanitário de Sifão • Elevador de Tração • Fechadura de Pinos de Latão • Máquina de Espresso 9 Bar"
    },
    "it": {
      "name": "Ingegneria Quotidiana",
      "fullName": "WC a Sifone, Ascensore, Serratura a Cilindro e Macchina Espresso",
      "tagline": "WC a Sifone a Gravità • Ascensore a Trazione • Serratura a 5 Pistoncini in Ottone • Macchina per Espresso a 9 Bar"
    },
    "ja": {
      "name": "身近なエンジニアリング",
      "fullName": "サイフォン式トイレ・エレベーター・ピンタンブラー錠・エスプレッソマシン",
      "tagline": "重力サイフォン式水洗トイレ • 超高層ロープ式エレベーター • 真鍮製5ピンシリンダー錠 • 9気圧デュアルボイラー・エスプレッソマシン"
    },
    "ko": {
      "name": "일상 속 공학 기술",
      "fullName": "사이펀 변기, 엘리베이터, 핀 텀블러 자물쇠 & 에스프레소 머신",
      "tagline": "중력 사이펀 수세식 변기 • 초고층 권상기 엘리베이터 • 황동 5핀 실린더 자물쇠 • 듀얼 보일러 9바 에스프레소 머신"
    },
    "ar": {
      "name": "روائع الهندسة اليومية",
      "fullName": "مرحاض السيفون والمصعد وقفل الأسطوانة وآلة الإسبريسو",
      "tagline": "مرحاض التدفق بالسيفون الجاذبي • مصعد الجر بدون تروس • قفل أسطواني نحاسي بـ 5 دبابيس • آلة إسبريسو بضغط 9 بار"
    }
  }
};

export function tCategory(cat) {
  if (!cat || currentLang === 'en') {
    return {
      name: cat?.name || '',
      fullName: cat?.fullName || cat?.name || '',
      tagline: cat?.tagline || '',
    };
  }
  const entry = CATEGORY_I18N[cat.id]?.[currentLang];
  return {
    name: entry?.name || cat.name,
    fullName: entry?.fullName || entry?.name || cat.fullName || cat.name,
    tagline: entry?.tagline || cat.tagline,
  };
}

// ============================================================================
// 3. Action Mode & Simulator Translations
// ============================================================================
const ACTION_VERB_I18N = {
  "Drive It!": {
    "zh-CN": "试驾体验！",
    "zh-HK": "試駕體驗！",
    "es": "¡Conducir!",
    "fr": "Piloter !",
    "de": "Probefahrt!",
    "nl": "Proefrit!",
    "pt": "Dirigir!",
    "it": "Guida!",
    "ja": "テストドライブ！",
    "ko": "시승하기!",
    "ar": "قُد المركبة!"
  },
  "Stop Driving": {
    "zh-CN": "停止驾驶",
    "zh-HK": "停止駕駛",
    "es": "Detener conducción",
    "fr": "Arrêter",
    "de": "Fahrt beenden",
    "nl": "Rijden stoppen",
    "pt": "Parar direção",
    "it": "Ferma guida",
    "ja": "ドライブ終了",
    "ko": "주행 중지",
    "ar": "إيقاف القيادة"
  },
  "Take It for a Flight!": {
    "zh-CN": "起飞翱翔！",
    "zh-HK": "起飛翱翔！",
    "es": "¡Volar!",
    "fr": "Décoller !",
    "de": "Abheben & Fliegen!",
    "nl": "Opstijgen & vliegen!",
    "pt": "Voar!",
    "it": "Vola!",
    "ja": "フライト開始！",
    "ko": "비행 시작!",
    "ar": "حلّق في السماء!"
  },
  "Land & Stop": {
    "zh-CN": "降落并停机",
    "zh-HK": "降落並停機",
    "es": "Aterrizar y parar",
    "fr": "Atterrir",
    "de": "Landen & Stopp",
    "nl": "Landen & stoppen",
    "pt": "Pousar e parar",
    "it": "Atterra e ferma",
    "ja": "着陸＆停止",
    "ko": "착륙 및 정지",
    "ar": "هبوط وإيقاف"
  },
  "Take It for a Dive!": {
    "zh-CN": "深海下潜！",
    "zh-HK": "深海下潛！",
    "es": "¡Sumergirse!",
    "fr": "Plonger !",
    "de": "Abtauchen!",
    "nl": "Duik de diepte in!",
    "pt": "Mergulhar!",
    "it": "Immergiti!",
    "ja": "潜航スタート！",
    "ko": "잠항 시작!",
    "ar": "غُص في الأعماق!"
  },
  "Surface & Stop": {
    "zh-CN": "上浮并停止",
    "zh-HK": "上浮並停止",
    "es": "Emerger y parar",
    "fr": "Faire surface",
    "de": "Auftauchen & Stopp",
    "nl": "Opduiken & stoppen",
    "pt": "Emergir e parar",
    "it": "Emergi e ferma",
    "ja": "浮上＆停止",
    "ko": "부상 및 정지",
    "ar": "طفو وإيقاف"
  },
  "Spin It Up!": {
    "zh-CN": "点火试车！",
    "zh-HK": "點火試車！",
    "es": "¡Encender motor!",
    "fr": "Allumer le réacteur !",
    "de": "Triebwerk starten!",
    "nl": "Start de motor!",
    "pt": "Ligar motor!",
    "it": "Avvia motore!",
    "ja": "エンジン点火！",
    "ko": "엔진 가동!",
    "ar": "شغّل المحرك!"
  },
  "Shut Down": {
    "zh-CN": "关机停转",
    "zh-HK": "關機停轉",
    "es": "Apagar",
    "fr": "Arrêter",
    "de": "Abschalten",
    "nl": "Uitschakelen",
    "pt": "Desligar",
    "it": "Spegni",
    "ja": "シャットダウン",
    "ko": "정지",
    "ar": "إيقاف التشغيل"
  },
  "Power It On!": {
    "zh-CN": "开机体验！",
    "zh-HK": "開機體驗！",
    "es": "¡Encender!",
    "fr": "Allumer !",
    "de": "Einschalten!",
    "nl": "Zet hem aan!",
    "pt": "Ligar!",
    "it": "Accendi!",
    "ja": "電源オン！",
    "ko": "전원 켜기!",
    "ar": "تشغيل الجهاز!"
  },
  "Power Off": {
    "zh-CN": "关机",
    "zh-HK": "關機",
    "es": "Apagar",
    "fr": "Éteindre",
    "de": "Ausschalten",
    "nl": "Uitzetten",
    "pt": "Desligar",
    "it": "Spegni",
    "ja": "電源オフ",
    "ko": "전원 끄기",
    "ar": "إيقاف الطاقة"
  },
  "Boot It Up!": {
    "zh-CN": "启动电脑！",
    "zh-HK": "啟動電腦！",
    "es": "¡Iniciar sistema!",
    "fr": "Démarrer !",
    "de": "Hochfahren!",
    "nl": "Opstarten!",
    "pt": "Inicializar!",
    "it": "Avvia!",
    "ja": "起動する！",
    "ko": "부팅하기!",
    "ar": "تشغيل النظام!"
  },
  "Move In!": {
    "zh-CN": "入住体验！",
    "zh-HK": "入住體驗！",
    "es": "¡Mudarse!",
    "fr": "Emménager !",
    "de": "Einziehen!",
    "nl": "Intrekken!",
    "pt": "Morar!",
    "it": "Abita!",
    "ja": "スマートホーム体験！",
    "ko": "입주 체험!",
    "ar": "عِش التجربة!"
  },
  "Move Out": {
    "zh-CN": "退出模拟",
    "zh-HK": "退出模擬",
    "es": "Salir",
    "fr": "Quitter",
    "de": "Beenden",
    "nl": "Verlaten",
    "pt": "Sair",
    "it": "Esci",
    "ja": "体験終了",
    "ko": "체험 종료"
  },
  "Turn It On!": {
    "zh-CN": "点亮屏幕！",
    "zh-HK": "開電視體驗！",
    "es": "¡Encender pantalla!",
    "fr": "Allumer l’écran !",
    "de": "Einschalten!",
    "nl": "Inschakelen!",
    "pt": "Ligar tela!",
    "it": "Accendi schermo!",
    "ja": "スイッチオン！",
    "ko": "화면 켜기!",
    "ar": "تشغيل الشاشة!"
  },
  "Turn Off": {
    "zh-CN": "关闭屏幕",
    "zh-HK": "關閉熒幕",
    "es": "Apagar pantalla",
    "fr": "Éteindre",
    "de": "Ausschalten",
    "nl": "Uitschakelen",
    "pt": "Desligar",
    "it": "Spegni",
    "ja": "電源オフ",
    "ko": "화면 끄기",
    "ar": "إيقاف الشاشة"
  },
  "Take It for a Ride!": {
    "zh-CN": "发车疾驰！",
    "zh-HK": "開車疾馳！",
    "es": "¡Dar un paseo!",
    "fr": "En route !",
    "de": "Losfahren!",
    "nl": "Maak een rit!",
    "pt": "Acelerar!",
    "it": "Parti!",
    "ja": "出発進行！",
    "ko": "출발하기!",
    "ar": "انطلق بالقطار!"
  },
  "Stop Train": {
    "zh-CN": "进站停车",
    "zh-HK": "埋站停車",
    "es": "Detener tren",
    "fr": "Arrêter le train",
    "de": "Zug anhalten",
    "nl": "Trein stoppen",
    "pt": "Parar trem",
    "it": "Ferma treno",
    "ja": "停車する",
    "ko": "열차 정지",
    "ar": "إيقاف القطار"
  },
  "Stop Riding": {
    "zh-CN": "停止骑行",
    "zh-HK": "停止騎行",
    "es": "Detener marcha",
    "fr": "Arrêter",
    "de": "Fahrt beenden",
    "nl": "Rit stoppen",
    "pt": "Parar",
    "it": "Ferma",
    "ja": "走行終了",
    "ko": "주행 중지",
    "ar": "إيقاف الركوب"
  },
  "Take It to Orbit!": {
    "zh-CN": "进入轨道！",
    "zh-HK": "進入軌道！",
    "es": "¡Ir a órbita!",
    "fr": "Mise en orbite !",
    "de": "In den Orbit!",
    "nl": "Lanceer in een baan!",
    "pt": "Ir para órbita!",
    "it": "Vai in orbita!",
    "ja": "軌道フライト！",
    "ko": "궤도 비행!",
    "ar": "انطلق إلى المدار!"
  },
  "De-Orbit": {
    "zh-CN": "脱离轨道",
    "zh-HK": "脫離軌道",
    "es": "Salir de órbita",
    "fr": "Désorbiter",
    "de": "Orbit verlassen",
    "nl": "Terugkeren",
    "pt": "Sair de órbita",
    "it": "De-orbita",
    "ja": "軌道離脱",
    "ko": "궤도 이탈",
    "ar": "مغادرة المدار"
  },
  "Flush It!": {
    "zh-CN": "按下冲水！",
    "zh-HK": "撳掣沖水！",
    "es": "¡Tirar de la cadena!",
    "fr": "Tirer la chasse !",
    "de": "Spülung drücken!",
    "nl": "Doorspoelen!",
    "pt": "Dar descarga!",
    "it": "Scarica!",
    "ja": "水を流す！",
    "ko": "물 내리기!",
    "ar": "اضغط للتدفق!"
  },
  "Stop Flush": {
    "zh-CN": "停止冲水",
    "zh-HK": "停止沖水",
    "es": "Detener descarga",
    "fr": "Arrêter",
    "de": "Stopp",
    "nl": "Spoeling stoppen",
    "pt": "Parar descarga",
    "it": "Ferma",
    "ja": "停止",
    "ko": "중지",
    "ar": "إيقاف التدفق"
  },
  "Brew Espresso!": {
    "zh-CN": "萃取浓缩咖啡！",
    "zh-HK": "沖返杯 Espresso！",
    "es": "¡Preparar Espresso!",
    "fr": "Préparer un Expresso !",
    "de": "Espresso brühen!",
    "nl": "Zet espresso!",
    "pt": "Extrair Espresso!",
    "it": "Prepara Espresso!",
    "ja": "エスプレッソ抽出！",
    "ko": "에스프레소 추출!",
    "ar": "حضّر الإسبريسو!"
  },
  "Stop Brew": {
    "zh-CN": "停止萃取",
    "zh-HK": "停止沖調",
    "es": "Detener extracción",
    "fr": "Arrêter",
    "de": "Brühen stoppen",
    "nl": "Zetten stoppen",
    "pt": "Parar extração",
    "it": "Ferma estrazione",
    "ja": "抽出停止",
    "ko": "추출 중지",
    "ar": "إيقاف التحضير"
  },
  "Ride Elevator!": {
    "zh-CN": "搭乘电梯！",
    "zh-HK": "搭升降機！",
    "es": "¡Subir al ascensor!",
    "fr": "Prendre l’ascenseur !",
    "de": "Aufzug fahren!",
    "nl": "Neem de lift!",
    "pt": "Andar no elevador!",
    "it": "Prendi l’ascensore!",
    "ja": "エレベーター運行！",
    "ko": "엘리베이터 탑승!",
    "ar": "اصعد بالمصعد!"
  },
  "Park Cab": {
    "zh-CN": "停靠轿厢",
    "zh-HK": "停泊升降機",
    "es": "Estacionar cabina",
    "fr": "Arrêter la cabine",
    "de": "Kabine parken",
    "nl": "Cabine parkeren",
    "pt": "Parar cabine",
    "it": "Ferma cabina",
    "ja": "停止",
    "ko": "운행 중지",
    "ar": "إيقاف المقصورة"
  },
  "Unlock It!": {
    "zh-CN": "插钥匙开锁！",
    "zh-HK": "插鎖匙開鎖！",
    "es": "¡Abrir cerradura!",
    "fr": "Déverrouiller !",
    "de": "Aufschließen!",
    "nl": "Ontgrendelen!",
    "pt": "Destrancar!",
    "it": "Sblocca!",
    "ja": "鍵を開ける！",
    "ko": "잠금 해제!",
    "ar": "افتح القفل!"
  },
  "Reset Lock": {
    "zh-CN": "重置锁芯",
    "zh-HK": "重設鎖芯",
    "es": "Reiniciar cerradura",
    "fr": "Verrouiller",
    "de": "Schloss zurücksetzen",
    "nl": "Slot vergrendelen",
    "pt": "Trancar",
    "it": "Blocca",
    "ja": "ロックを戻す",
    "ko": "자물쇠 초기화",
    "ar": "إعادة ضبط القفل"
  },
  "Wind & Tick!": {
    "zh-CN": "上链运转！",
    "zh-HK": "上鏈行針！",
    "es": "¡Dar cuerda!",
    "fr": "Remonter le mouvement !",
    "de": "Uhrwerk aufziehen!",
    "nl": "Opwinden & tikken!",
    "pt": "Dar corda!",
    "it": "Carica il movimento!",
    "ja": "ゼンマイを巻く！",
    "ko": "태엽 감기 & 작동!",
    "ar": "عبّئ وشغّل الساعة!"
  },
  "Swing & Chime!": {
    "zh-CN": "摆动报时！",
    "zh-HK": "擺動報時！",
    "es": "¡Oscilar y sonar!",
    "fr": "Balancier & Carillon !",
    "de": "Pendeln & Schlagen!",
    "nl": "Slingeren & luiden!",
    "pt": "Balançar e tocar!",
    "it": "Oscilla e suona!",
    "ja": "振り子＆チャイム！",
    "ko": "진자 & 차임벨 울리기!",
    "ar": "تأرجح ورنين!"
  },
  "Stop Movement": {
    "zh-CN": "停止机芯",
    "zh-HK": "停止機芯",
    "es": "Detener movimiento",
    "fr": "Arrêter le mouvement",
    "de": "Uhrwerk stoppen",
    "nl": "Uurwerk stoppen",
    "pt": "Parar movimento",
    "it": "Ferma movimento",
    "ja": "ムーブメント停止",
    "ko": "작동 중지",
    "ar": "إيقاف الحركة"
  },
  "Set Sail!": {
    "zh-CN": "扬帆远航！",
    "zh-HK": "啟航破浪！",
    "es": "¡Zarpar!",
    "fr": "Larguer les amarres !",
    "de": "In See stechen!",
    "nl": "Uitvaren!",
    "pt": "Navegar!",
    "it": "Salpa!",
    "ja": "出航する！",
    "ko": "출항하기!",
    "ar": "أبحر الآن!"
  },
  "Drop Anchor": {
    "zh-CN": "抛锚停泊",
    "zh-HK": "拋錨停泊",
    "es": "Echar el ancla",
    "fr": "Jeter l’ancre",
    "de": "Anker werfen",
    "nl": "Anker uitgooien",
    "pt": "Lançar âncora",
    "it": "Getta l’ancora",
    "ja": "投錨＆停止",
    "ko": "닻 내리기",
    "ar": "إلقاء المرساة"
  },
  "Operate Rig!": {
    "zh-CN": "操作机械！",
    "zh-HK": "操作重機！",
    "es": "¡Operar maquinaria!",
    "fr": "Actionner l’engin !",
    "de": "Maschine steuern!",
    "nl": "Machine bedienen!",
    "pt": "Operar máquina!",
    "it": "Aziona mezzo!",
    "ja": "重機を操作！",
    "ko": "중장비 작동!",
    "ar": "شغّل المعدات!"
  },
  "Park Rig": {
    "zh-CN": "停放机械",
    "zh-HK": "停泊機器",
    "es": "Estacionar máquina",
    "fr": "Arrêter l’engin",
    "de": "Maschine parken",
    "nl": "Machine parkeren",
    "pt": "Estacionar",
    "it": "Parcheggia",
    "ja": "操作終了",
    "ko": "작동 중지",
    "ar": "إيقاف المعدات"
  },
  "Launch It!": {
    "zh-CN": "点火发射！",
    "zh-HK": "點火發射！",
    "es": "¡Lanzar cohete!",
    "fr": "Lancer la fusée !",
    "de": "Rakete starten!",
    "nl": "Lanceren!",
    "pt": "Lançar foguete!",
    "it": "Lancia il razzo!",
    "ja": "打ち上げ開始！",
    "ko": "로켓 발사!",
    "ar": "إطلاق الصاروخ!"
  },
  "Abort Launch": {
    "zh-CN": "中止发射",
    "zh-HK": "中止發射",
    "es": "Abortar lanzamiento",
    "fr": "Arrêter le tir",
    "de": "Start abbrechen",
    "nl": "Lancering afbreken",
    "pt": "Abortar lançamento",
    "it": "Annulla lancio",
    "ja": "打ち上げ中止",
    "ko": "발사 중지",
    "ar": "إلغاء الإطلاق"
  },
  "Power Up & Move!": {
    "zh-CN": "通电行动！",
    "zh-HK": "通電行動！",
    "es": "¡Activar y mover!",
    "fr": "Activer le robot !",
    "de": "Roboter aktivieren!",
    "nl": "Activeren & bewegen!",
    "pt": "Ativar e mover!",
    "it": "Attiva e muovi!",
    "ja": "ロボット起動！",
    "ko": "로봇 가동!",
    "ar": "تفعيل وتحريك!"
  },
  "Stand Down": {
    "zh-CN": "待机休眠",
    "zh-HK": "待機休眠",
    "es": "Desactivar",
    "fr": "Mise en veille",
    "de": "Standby",
    "nl": "Stand-by",
    "pt": "Desativar",
    "it": "Stand-by",
    "ja": "スタンバイ",
    "ko": "대기 모드",
    "ar": "وضع الاستعداد"
  },
  "Repulsor Flight!": {
    "zh-CN": "脉冲推进飞行！",
    "zh-HK": "脈衝推進飛行！",
    "es": "¡Vuelo Repulsor!",
    "fr": "Vol Répulseur !",
    "de": "Repulsor-Flug!",
    "nl": "Repulsorvlucht!",
    "pt": "Voo Repulsor!",
    "it": "Volo Repulsore!",
    "ja": "リパルサー飛行！",
    "ko": "리펄서 비행!",
    "ar": "طيران الدفع النبضي!"
  },
  "Land Armor": {
    "zh-CN": "战甲降落",
    "zh-HK": "戰甲降落",
    "es": "Aterrizar armadura",
    "fr": "Atterrir l’armure",
    "de": "Rüstung landen",
    "nl": "Harnas landen",
    "pt": "Pousar armadura",
    "it": "Atterra armatura",
    "ja": "アーマー着陸",
    "ko": "아머 착륙",
    "ar": "هبوط الدرع"
  },
  "Take It for a Hover!": {
    "zh-CN": "悬停飞行！",
    "zh-HK": "懸停飛行！",
    "es": "¡Vuelo estacionario!",
    "fr": "Vol stationnaire !",
    "de": "Schwebeflug starten!",
    "nl": "Zweefvlucht starten!",
    "pt": "Pairar e voar!",
    "it": "Volo in hovering!",
    "ja": "ホバリング飛行！",
    "ko": "호버링 비행!",
    "ar": "تحليق مروحية!"
  }
};

export function tAction(act) {
  if (!act || currentLang === 'en') return act;
  const vMap = (s) => ACTION_VERB_I18N[s]?.[currentLang] || translateTechnicalText(s, currentLang);
  return {
    ...act,
    verb: vMap(act.verb),
    stopVerb: vMap(act.stopVerb),
    tab: vMap(act.tab || act.verb),
    hint: translateTechnicalText(act.hint || '', currentLang),
    hud: (act.hud || []).map((g) => ({
      ...g,
      label: translateTechnicalText(g.label, currentLang),
    })),
    controls: (act.controls || []).map((c) => ({
      ...c,
      label: translateTechnicalText(c.label, currentLang),
      title: translateTechnicalText(c.title || c.label, currentLang),
    })),
    checklist: (act.checklist || []).map((item) => ({
      ...item,
      label: translateTechnicalText(item.label, currentLang),
    })),
    celebrate: act.celebrate
      ? {
          title: translateTechnicalText(act.celebrate.title, currentLang),
          text: translateTechnicalText(act.celebrate.text, currentLang),
        }
      : undefined,
  };
}

// ============================================================================
// 4. Comprehensive Technical Glossary & Multi-Language Translator (11 Languages)
// ============================================================================
const PART_CATEGORY_I18N = {
  "Structure & Aero": {
    "zh-CN": "结构与空气动力学",
    "zh-HK": "結構同空氣動力學",
    "es": "Estructura y Aerodinámica",
    "fr": "Structure & Aérodynamisme",
    "de": "Struktur & Aerodynamik",
    "nl": "Structuur & Aerodynamica",
    "pt": "Estrutura e Aerodinâmica",
    "it": "Struttura e Aerodinamica",
    "ja": "構造＆エアロダイナミクス",
    "ko": "구조 및 공기역학",
    "ar": "الهيكل والديناميكا الهوائية"
  },
  "Structure": {
    "zh-CN": "主体结构",
    "zh-HK": "主體結構",
    "es": "Estructura",
    "fr": "Structure",
    "de": "Struktur",
    "nl": "Draagconstructie",
    "pt": "Estrutura",
    "it": "Struttura",
    "ja": "構造フレーム",
    "ko": "구조 프레임",
    "ar": "الهيكل الأساسي"
  },
  "Powertrain": {
    "zh-CN": "动力总成",
    "zh-HK": "動力系統",
    "es": "Tren Motriz",
    "fr": "Groupe Motopropulseur",
    "de": "Antriebsstrang",
    "nl": "Aandrijflijn",
    "pt": "Trem de Força",
    "it": "Propulsore",
    "ja": "パワートレイン",
    "ko": "파워트레인",
    "ar": "منظومة الحركة والطاقة"
  },
  "Forced Induction & Exhaust": {
    "zh-CN": "涡轮增压与排气",
    "zh-HK": "渦輪增壓同排氣",
    "es": "Turbo y Escape",
    "fr": "Turbo & Échappement",
    "de": "Turbolader & Abgasanlage",
    "nl": "Drukvulling & Uitlaat",
    "pt": "Turbo e Escapamento",
    "it": "Turbo e Scarico",
    "ja": "ターボ＆エキゾースト",
    "ko": "터보차저 및 배기",
    "ar": "الشحن التوربيني والعادم"
  },
  "Hybrid Electrification": {
    "zh-CN": "混合动力电驱",
    "zh-HK": "混能電驅系統",
    "es": "Electrificación Híbrida",
    "fr": "Hybridation Électrique",
    "de": "Hybrid-Elektrifizierung",
    "nl": "Hybride Elektrificatie",
    "pt": "Eletrificação Híbrida",
    "it": "Ibridazione Elettrica",
    "ja": "ハイブリッド電動駆動",
    "ko": "하이브리드 전동화",
    "ar": "الدفع الهجين الكهربائي"
  },
  "Cooling & Aero": {
    "zh-CN": "冷却与气动系统",
    "zh-HK": "冷卻同氣動系統",
    "es": "Refrigeración y Aero",
    "fr": "Refroidissement & Aéro",
    "de": "Kühlung & Aerodynamik",
    "nl": "Koeling & Aerodynamica",
    "pt": "Arrefecimento e Aero",
    "it": "Raffreddamento e Aero",
    "ja": "冷却＆空力システム",
    "ko": "냉각 및 공력 시스템",
    "ar": "التبريد والانسيابية الهوائية"
  },
  "Cooling & HVAC": {
    "zh-CN": "热管理与空调",
    "zh-HK": "熱管理同冷氣",
    "es": "Climatización y Refrigeración",
    "fr": "Thermique & Climatisation",
    "de": "Thermomanagement & Klima",
    "nl": "Koeling & Klimaatregeling",
    "pt": "Climatização e Arrefecimento",
    "it": "Termica e Climatizzazione",
    "ja": "熱管理＆空調",
    "ko": "열관리 및 공조",
    "ar": "التبريد والتكييف الحراري"
  },
  "Chassis & Safety": {
    "zh-CN": "底盘与安全制动",
    "zh-HK": "底盤同安全制動",
    "es": "Chasis y Seguridad",
    "fr": "Châssis & Sécurité",
    "de": "Fahrwerk & Sicherheit",
    "nl": "Chassis & Veiligheid",
    "pt": "Chassi e Segurança",
    "it": "Telaio e Sicurezza",
    "ja": "シャシー＆ブレーキ",
    "ko": "섀시 및 안전 제동",
    "ar": "الشاسيه وأنظمة الأمان"
  },
  "Cockpit": {
    "zh-CN": "驾驶舱控制",
    "zh-HK": "駕駛艙控制",
    "es": "Cabina de Mando",
    "fr": "Poste de Pilotage",
    "de": "Cockpit",
    "nl": "Cockpit & Besturing",
    "pt": "Cockpit",
    "it": "Abitacolo",
    "ja": "コックピット",
    "ko": "콕핏 제어부",
    "ar": "قمرة القيادة والتحكم"
  },
  "Interior": {
    "zh-CN": "座舱内饰",
    "zh-HK": "車廂內籠",
    "es": "Interior",
    "fr": "Intérieur",
    "de": "Innenraum",
    "nl": "Interieur & Cabine",
    "pt": "Interior",
    "it": "Interni",
    "ja": "インテリア",
    "ko": "인테리어",
    "ar": "المقصورة الداخلية"
  },
  "Exterior": {
    "zh-CN": "外观车身",
    "zh-HK": "車身外殼",
    "es": "Exterior",
    "fr": "Carrosserie",
    "de": "Karosserie",
    "nl": "Carrosserie & Exterieur",
    "pt": "Exterior",
    "it": "Carrozzeria",
    "ja": "エクステリア",
    "ko": "익스테리어",
    "ar": "الهيكل الخارجي"
  },
  "Exterior & Active Aero": {
    "zh-CN": "外观与主动气动",
    "zh-HK": "車身同主動氣動",
    "es": "Exterior y Aero Activa",
    "fr": "Extérieur & Aéro Active",
    "de": "Exterieur & Aktive Aerodynamik",
    "nl": "Exterieur & Actieve Aero",
    "pt": "Exterior e Aero Ativa",
    "it": "Esterni e Aero Attiva",
    "ja": "外装＆アクティブエアロ",
    "ko": "외장 및 액티브 에어로",
    "ar": "الهيكل الخارجي والانسيابية النشطة"
  },
  "Glass & Lighting": {
    "zh-CN": "玻璃穹顶与灯光",
    "zh-HK": "玻璃同燈光系統",
    "es": "Cristales e Iluminación",
    "fr": "Vitrage & Éclairage",
    "de": "Verglasung & Beleuchtung",
    "nl": "Beglazing & Verlichting",
    "pt": "Vidros e Iluminação",
    "it": "Vetri e Illuminazione",
    "ja": "ガラス＆ライティング",
    "ko": "글래스 및 조명",
    "ar": "الزجاج وأنظمة الإضاءة"
  },
  "Wheels & Tires": {
    "zh-CN": "轮毂与轮胎",
    "zh-HK": "車軨同車胎",
    "es": "Llantas y Neumáticos",
    "fr": "Jantes & Pneus",
    "de": "Räder & Reifen",
    "nl": "Wielen & Banden",
    "pt": "Rodas e Pneus",
    "it": "Cerchi e Pneumatici",
    "ja": "ホイール＆タイヤ",
    "ko": "휠 및 타이어",
    "ar": "العجلات والإطارات"
  },
  "Energy Storage": {
    "zh-CN": "储能电池组",
    "zh-HK": "儲能電池組",
    "es": "Almacenamiento de Energía",
    "fr": "Stockage d’Énergie",
    "de": "Energiespeicher",
    "nl": "Energieopslag",
    "pt": "Armazenamento de Energia",
    "it": "Accumulo Energia",
    "ja": "バッテリー蓄電",
    "ko": "에너지 저장 배터리",
    "ar": "تخزين الطاقة والبطاريات"
  },
  "Propulsion": {
    "zh-CN": "推进系统",
    "zh-HK": "推進系統",
    "es": "Propulsión",
    "fr": "Propulsion",
    "de": "Antrieb",
    "nl": "Voortstuwing",
    "pt": "Propulsão",
    "it": "Propulsione",
    "ja": "推進システム",
    "ko": "추진 시스템",
    "ar": "منظومة الدفع"
  },
  "Aerodynamics": {
    "zh-CN": "空气动力学",
    "zh-HK": "空氣動力學",
    "es": "Aerodinámica",
    "fr": "Aérodynamique",
    "de": "Aerodynamik",
    "nl": "Aerodynamica",
    "pt": "Aerodinâmica",
    "it": "Aerodinamica",
    "ja": "エアロダイナミクス",
    "ko": "공기역학",
    "ar": "الديناميكا الهوائية"
  },
  "Avionics": {
    "zh-CN": "航电与雷达系统",
    "zh-HK": "航電同雷達系統",
    "es": "Aviónica",
    "fr": "Avionique",
    "de": "Avionik",
    "nl": "Avionica & Vluchtcomputers",
    "pt": "Aviônica",
    "it": "Avionica",
    "ja": "アビオニクス",
    "ko": "항공전자 (아비오닉스)",
    "ar": "إلكترونيات الطيران والملاحة"
  },
  "Hydraulics": {
    "zh-CN": "液压传动系统",
    "zh-HK": "液壓傳動系統",
    "es": "Hidráulica",
    "fr": "Hydraulique",
    "de": "Hydraulik",
    "nl": "Hydrauliek",
    "pt": "Hidráulica",
    "it": "Idraulica",
    "ja": "油圧システム",
    "ko": "유압 시스템",
    "ar": "الأنظمة الهيدروليكية"
  },
  "Horology": {
    "zh-CN": "精密钟表机芯",
    "zh-HK": "精密鐘錶機芯",
    "es": "Relojería",
    "fr": "Horlogerie",
    "de": "Uhrmacherkunst",
    "nl": "Uurwerkmechaniek",
    "pt": "Relojoaria",
    "it": "Orologeria",
    "ja": "機械式ムーブメント",
    "ko": "기계식 무브먼트",
    "ar": "آليات الساعات الدقيقة"
  },
  "Optics & Camera": {
    "zh-CN": "光学与影像系统",
    "zh-HK": "光學同鏡頭系統",
    "es": "Óptica y Cámara",
    "fr": "Optique & Caméra",
    "de": "Optik & Kamera",
    "nl": "Optiek & Camerasysteem",
    "pt": "Óptica e Câmera",
    "it": "Ottica e Fotocamera",
    "ja": "光学＆カメラ",
    "ko": "광학 및 카메라",
    "ar": "البصريات والكاميرات"
  },
  "Silicon & Logic": {
    "zh-CN": "芯片与主板电路",
    "zh-HK": "晶片同底板電路",
    "es": "Silicio y Placa Lógica",
    "fr": "Silicium & Carte Mère",
    "de": "Chip & Hauptplatine",
    "nl": "Siliciumchip & Moederbord",
    "pt": "Silício e Placa Lógica",
    "it": "Silicio e Scheda Madre",
    "ja": "シリコン＆ロジックボード",
    "ko": "실리콘 칩 및 로직 보드",
    "ar": "المعالج واللوحة المنطقية"
  },
  "Display": {
    "zh-CN": "显示屏模组",
    "zh-HK": "顯示屏模組",
    "es": "Pantalla",
    "fr": "Écran",
    "de": "Display",
    "nl": "Beeldschermmodule",
    "pt": "Tela",
    "it": "Display",
    "ja": "ディスプレイ",
    "ko": "디스플레이",
    "ar": "وحدة الشاشة والعرض"
  }
};

const MODEL_NAME_I18N = {
  "ferrari-sf90": {
    "zh-CN": "法拉利 SF90 Stradale 插混超跑",
    "zh-HK": "法拉利 SF90 Stradale 混能超跑",
    "es": "Ferrari SF90 Stradale",
    "fr": "Ferrari SF90 Stradale",
    "de": "Ferrari SF90 Stradale",
    "nl": "Ferrari SF90 Stradale Plug-in Hybride",
    "pt": "Ferrari SF90 Stradale",
    "it": "Ferrari SF90 Stradale",
    "ja": "フェラーリ SF90 ストラダーレ",
    "ko": "페라리 SF90 스트라달레",
    "ar": "فيراري SF90 سترادالي الهجينة"
  },
  "tesla-plaid": {
    "zh-CN": "特斯拉 Model S Plaid 三电机轿跑",
    "zh-HK": "Tesla Model S Plaid 三摩打轎跑",
    "es": "Tesla Model S Plaid",
    "fr": "Tesla Model S Plaid",
    "de": "Tesla Model S Plaid",
    "nl": "Tesla Model S Plaid (Driemotorige EV)",
    "pt": "Tesla Model S Plaid",
    "it": "Tesla Model S Plaid",
    "ja": "テスラ モデルS プラッド",
    "ko": "테슬라 모델 S 플레이드",
    "ar": "تسلا موديل S بلايد ثلاثية المحركات"
  },
  "tesla-model-x-plaid": {
    "zh-CN": "特斯拉 Model X Plaid 鹰翼门 SUV",
    "zh-HK": "Tesla Model X Plaid 鷹翼門 SUV",
    "es": "Tesla Model X Plaid",
    "fr": "Tesla Model X Plaid",
    "de": "Tesla Model X Plaid",
    "nl": "Tesla Model X Plaid (Falcon Wing SUV)",
    "pt": "Tesla Model X Plaid",
    "it": "Tesla Model X Plaid",
    "ja": "テスラ モデルX プラッド",
    "ko": "테슬라 모델 X 플레이드",
    "ar": "تسلا موديل X بلايد بأبواب الصقر"
  },
  "tesla-roadster-2": {
    "zh-CN": "全新特斯拉 Roadster (SpaceX 火箭包)",
    "zh-HK": "全新 Tesla Roadster (SpaceX 火箭套件)",
    "es": "Nuevo Tesla Roadster (Paquete SpaceX)",
    "fr": "Nouveau Tesla Roadster (Pack SpaceX)",
    "de": "Neuer Tesla Roadster (SpaceX-Paket)",
    "nl": "Nieuwe Tesla Roadster (SpaceX-pakket)",
    "pt": "Novo Tesla Roadster (Pacote SpaceX)",
    "it": "Nuova Tesla Roadster (Pacchetto SpaceX)",
    "ja": "新型テスラ ロードスター (SpaceXパッケージ)",
    "ko": "신형 테슬라 로드스터 (SpaceX 패키지)",
    "ar": "تسلا رودستر الجديدة (حزمة سبيس إكس)"
  },
  "cybertruck": {
    "zh-CN": "特斯拉 Cybertruck 不锈钢越野皮卡",
    "zh-HK": "Tesla Cybertruck 不鏽鋼越野農夫車",
    "es": "Tesla Cybertruck",
    "fr": "Tesla Cybertruck",
    "de": "Tesla Cybertruck",
    "nl": "Tesla Cybertruck Roestvrijstalen Pick-up",
    "pt": "Tesla Cybertruck",
    "it": "Tesla Cybertruck",
    "ja": "テスラ サイバートラック",
    "ko": "테슬라 사이버트럭",
    "ar": "شاحنة تسلا سايبرترك من الفولاذ المقاوم للصدأ"
  },
  "rivian-r1t": {
    "zh-CN": "Rivian R1T 四电机探险皮卡",
    "zh-HK": "Rivian R1T 四摩打越野農夫車",
    "es": "Rivian R1T Quad-Motor",
    "fr": "Rivian R1T Quadri-Moteur",
    "de": "Rivian R1T Quad-Motor",
    "nl": "Rivian R1T Viermotorige Adventure-truck",
    "pt": "Rivian R1T Quad-Motor",
    "it": "Rivian R1T Quad-Motor",
    "ja": "リヴィアン R1T クアッドモーター",
    "ko": "리비안 R1T 쿼드모터",
    "ar": "شاحنة المغامرات ريفيان R1T رباعية المحركات"
  },
  "lamborghini-revuelto": {
    "zh-CN": "兰博基尼 Revuelto V12 插混旗舰",
    "zh-HK": "林寶堅尼 Revuelto V12 混能旗艦",
    "es": "Lamborghini Revuelto V12",
    "fr": "Lamborghini Revuelto V12",
    "de": "Lamborghini Revuelto V12",
    "nl": "Lamborghini Revuelto V12 Hybride",
    "pt": "Lamborghini Revuelto V12",
    "it": "Lamborghini Revuelto V12",
    "ja": "ランボルギーニ レヴエルト V12",
    "ko": "람보르기니 레부엘토 V12",
    "ar": "لامبورغيني ريفويلتو V12 الهجينة"
  },
  "ford-f150-raptor": {
    "zh-CN": "福特 F-150 Raptor R 猛禽越野皮卡",
    "zh-HK": "福特 F-150 Raptor R 猛禽農夫車",
    "es": "Ford F-150 Raptor R",
    "fr": "Ford F-150 Raptor R",
    "de": "Ford F-150 Raptor R",
    "nl": "Ford F-150 Raptor R Offroad-pick-up",
    "pt": "Ford F-150 Raptor R",
    "it": "Ford F-150 Raptor R",
    "ja": "フォード F-150 ラプター R",
    "ko": "포드 F-150 랩터 R",
    "ar": "شاحنة فورد F-150 رابتر R للطرق الوعرة"
  },
  "porsche-911-gt3rs": {
    "zh-CN": "保时捷 911 GT3 RS 赛道超跑",
    "zh-HK": "保時捷 911 GT3 RS 賽道超跑",
    "es": "Porsche 911 GT3 RS",
    "fr": "Porsche 911 GT3 RS",
    "de": "Porsche 911 GT3 RS",
    "nl": "Porsche 911 GT3 RS (992)",
    "pt": "Porsche 911 GT3 RS",
    "it": "Porsche 911 GT3 RS",
    "ja": "ポルシェ 911 GT3 RS",
    "ko": "포르쉐 911 GT3 RS",
    "ar": "بورش 911 GT3 RS المخصصة للحلبات"
  },
  "boeing-737-max": {
    "zh-CN": "波音 737 MAX 9 窄体干线客机",
    "zh-HK": "波音 737 MAX 9 民航客機",
    "es": "Boeing 737 MAX 9",
    "fr": "Boeing 737 MAX 9",
    "de": "Boeing 737 MAX 9",
    "nl": "Boeing 737 MAX 9 Verkeersvliegtuig",
    "pt": "Boeing 737 MAX 9",
    "it": "Boeing 737 MAX 9",
    "ja": "ボーイング 737 MAX 9",
    "ko": "보잉 737 MAX 9",
    "ar": "طائرة بوينغ 737 ماكس 9 للخطوط الجوية"
  },
  "airbus-a350": {
    "zh-CN": "空客 A350-1000 XWB 宽体远程客机",
    "zh-HK": "空中巴士 A350-1000 XWB 廣體客機",
    "es": "Airbus A350-1000 XWB",
    "fr": "Airbus A350-1000 XWB",
    "de": "Airbus A350-1000 XWB",
    "nl": "Airbus A350-1000 Widebody-lijnvliegtuig",
    "pt": "Airbus A350-1000 XWB",
    "it": "Airbus A350-1000 XWB",
    "ja": "エアバス A350-1000 XWB",
    "ko": "에어버스 A350-1000 XWB",
    "ar": "طائرة إيرباص A350-1000 XWB عريضة البدن"
  },
  "f22-raptor-jet": {
    "zh-CN": "洛克希德 F-22“猛禽”隐身战斗机",
    "zh-HK": "洛歇 F-22「猛禽」隱形戰機",
    "es": "Caza Furtivo Lockheed F-22 Raptor",
    "fr": "Chasseur Furtif Lockheed F-22 Raptor",
    "de": "Lockheed F-22 Raptor Tarnkappenjet",
    "nl": "Lockheed Martin F-22 Raptor Stealth-jager",
    "pt": "Caça Furtivo Lockheed F-22 Raptor",
    "it": "Caccia Stealth Lockheed F-22 Raptor",
    "ja": "ロッキード F-22 ラプター ステルス戦闘機",
    "ko": "록히드 F-22 랩터 스텔스 전투기",
    "ar": "مقاتلة التفوق الجوي الشبحية F-22 رابتر"
  },
  "lockheed-sr71-blackbird": {
    "zh-CN": "洛克希德 SR-71“黑鸟”3.3马赫侦察机",
    "zh-HK": "洛歇 SR-71「黑鳥」3.3馬赫偵察機",
    "es": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "fr": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "de": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "nl": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "pt": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "it": "Lockheed SR-71 Blackbird (Mach 3.3)",
    "ja": "ロッキード SR-71 ブラックバード (マッハ3.3)",
    "ko": "록히드 SR-71 블랙버드 (마하 3.3)",
    "ar": "طائرة الاستطلاع SR-71 بلاك بيرد (ماخ 3.3)"
  },
  "cessna-172": {
    "zh-CN": "塞斯纳 172“天鹰”通用教练机",
    "zh-HK": "塞斯納 172「天鷹」小型飛機",
    "es": "Cessna 172 Skyhawk",
    "fr": "Cessna 172 Skyhawk",
    "de": "Cessna 172 Skyhawk",
    "nl": "Cessna 172 Skyhawk Sportvliegtuig",
    "pt": "Cessna 172 Skyhawk",
    "it": "Cessna 172 Skyhawk",
    "ja": "セスナ 172 スカイホーク",
    "ko": "세스나 172 스카이호크",
    "ar": "طائرة التدريب سيسنا 172 سكاي هوك"
  },
  "virginia-ssn-sub": {
    "zh-CN": "弗吉尼亚级核动力攻击潜艇",
    "zh-HK": "弗吉尼亞級核動力攻擊潛艇",
    "es": "Submarino Nuclear Clase Virginia",
    "fr": "Sous-Marin Nucléaire Classe Virginia",
    "de": "Virginia-Klasse Atom-U-Boot",
    "nl": "Virginia-klasse SSN Kernonderzeeër",
    "pt": "Submarino Nuclear Classe Virginia",
    "it": "Sottomarino Nucleare Classe Virginia",
    "ja": "バージニア級原子力潜水艦",
    "ko": "버지니아급 원자력 잠수함",
    "ar": "غواصة هجومية نووية من فئة فيرجينيا"
  },
  "deep-sea-submersible": {
    "zh-CN": "“极限因子”号 / 阿尔文号万米深潜器",
    "zh-HK": "「極限因子」號 / 阿爾文號萬米深潛器",
    "es": "Sumergible Abisal DSV Limiting Factor / Alvin",
    "fr": "Bathyscaphe DSV Limiting Factor / Alvin",
    "de": "Tiefsee-Tauchboot DSV Limiting Factor / Alvin",
    "nl": "DSV Limiting Factor Diepzeeduikboot",
    "pt": "Submersível DSV Limiting Factor / Alvin",
    "it": "Sommergibile Abissale Limiting Factor / Alvin",
    "ja": "深海探査艇 リミティング・ファクター / アルビン号",
    "ko": "심해 잠수정 리미팅 팩터 / 앨빈호",
    "ar": "غواصة الأعماق السحيقة ليميتينغ فاكتور / ألفين"
  },
  "nautilus-panoramic-sub": {
    "zh-CN": "鹦鹉螺号 360° 全景深海观光潜艇",
    "zh-HK": "鸚鵡螺號 360° 全景深海觀光潛艇",
    "es": "Submarino Panorámico Nautilus 360°",
    "fr": "Sous-Marin Panoramique Nautilus 360°",
    "de": "Nautilus 360°-Panorama-Tauchboot",
    "nl": "Nautilus 360° Acryl Panoramaduikboot",
    "pt": "Submarino Panorâmico Nautilus 360°",
    "it": "Sottomarino Panoramico Nautilus 360°",
    "ja": "ノーチラス 360° パノラマ潜水艇",
    "ko": "노틸러스 360° 파노라마 잠수정",
    "ar": "غواصة نوتيلوس البانورامية بزاوية 360 درجة"
  },
  "ge9x-turbofan": {
    "zh-CN": "GE9X / 遄达高涵道比民航涡扇发动机",
    "zh-HK": "GE9X / 遄達高涵道比民航渦扇引擎",
    "es": "Turbofán de Alto Paso GE9X / Trent",
    "fr": "Turboréacteur Double Flux GE9X / Trent",
    "de": "GE9X / Trent Mantelstrom-Turbofan",
    "nl": "GE9X High-Bypass Turbofanmotor",
    "pt": "Turbofan GE9X / Trent",
    "it": "Turboventola GE9X / Trent",
    "ja": "GE9X / トレント 高バイパス比ターボファン",
    "ko": "GE9X / 트렌트 고바이패스 터보팬 엔진",
    "ar": "محرك التيربوفان التجاري GE9X / ترينت عالي الالتفافية"
  },
  "f135-afterburner-jet": {
    "zh-CN": "普惠 F135 战斗机加力涡扇发动机",
    "zh-HK": "普惠 F135 戰機後燃渦扇引擎",
    "es": "Reactor con Postcombustión Pratt & Whitney F135",
    "fr": "Turboréacteur à Postcombustion P&W F135",
    "de": "Pratt & Whitney F135 Nachbrenner-Triebwerk",
    "nl": "Pratt & Whitney F135 Naverbrandermotor",
    "pt": "Motor a Jato P&W F135 com Pós-Combustão",
    "it": "Turbogetto con Postbruciatore P&W F135",
    "ja": "P&W F135 アフターバーナー付きターボファン",
    "ko": "P&W F135 애프터버너 제트 엔진",
    "ar": "محرك برات آند ويتني F135 بالحارق اللاحق"
  },
  "spacex-raptor-rocket": {
    "zh-CN": "SpaceX 猛禽全流量分级燃烧液氧甲烷引擎",
    "zh-HK": "SpaceX 猛禽全流量分級燃燒液氧甲烷引擎",
    "es": "Motor Cohete SpaceX Raptor Methalox",
    "fr": "Moteur-Fusée SpaceX Raptor Méthalox",
    "de": "SpaceX Raptor Methalox-Raketentriebwerk",
    "nl": "SpaceX Raptor Methalox-raketmotor",
    "pt": "Motor de Foguete SpaceX Raptor Methalox",
    "it": "Motore a Razzo SpaceX Raptor Methalox",
    "ja": "SpaceX ラプター メタロックス・ロケットエンジン",
    "ko": "SpaceX 랩터 메탈록스 로켓 엔진",
    "ar": "محرك الصواريخ سبيس إكس رابتر بوقود الميثان والأكسجين"
  },
  "iron-man-mark-85": {
    "zh-CN": "钢铁侠 Mark LXXXV (85) 纳米战甲",
    "zh-HK": "鐵甲奇俠 Mark LXXXV (85) 納米戰甲",
    "es": "Armadura Nanotecnológica Iron Man Mark LXXXV (85)",
    "fr": "Armure Nanotech Iron Man Mark LXXXV (85)",
    "de": "Iron Man Mark LXXXV (85) Nanotech-Rüstung",
    "nl": "Iron Man Mark LXXXV Nanotech-harnas",
    "pt": "Armadura Nanotech Homem de Ferro Mark LXXXV (85)",
    "it": "Armatura Nanotech Iron Man Mark LXXXV (85)",
    "ja": "アイアンマン マーク85 (LXXXV) ナノテク・アーマー",
    "ko": "아이언맨 마크 85 (LXXXV) 나노테크 아머",
    "ar": "درع آيرون مان مارك 85 بتقنية النانو"
  },
  "mars-perseverance-rover": {
    "zh-CN": "NASA“毅力号”核动力火星探测车",
    "zh-HK": "NASA「毅力號」核動力火星探測車",
    "es": "Rover Marciano Perseverance de la NASA",
    "fr": "Rover Martien NASA Perseverance",
    "de": "NASA Perseverance Mars-Rover",
    "nl": "NASA Mars Perseverance-rover",
    "pt": "Rover de Marte NASA Perseverance",
    "it": "Rover Marziano NASA Perseverance",
    "ja": "NASA パーサヴィアランス 火星探査ローバー",
    "ko": "NASA 퍼서비어런스 화성 탐사 로버",
    "ar": "مسبار المريخ النووي بيرسيفيرانس التابع لناسا"
  },
  "kuka-6axis-industrial-arm": {
    "zh-CN": "六轴工业重载关节机械臂",
    "zh-HK": "六軸工業重載關節機械臂",
    "es": "Brazo Robótico Industrial de 6 Ejes",
    "fr": "Bras Robotique Industriel Articulé à 6 Axes",
    "de": "6-Achsen-Industrieroboterarm",
    "nl": "KUKA 6-assige Industriële Robotarm",
    "pt": "Braço Robótico Industrial de 6 Eixos",
    "it": "Braccio Robotico Industriale a 6 Assi",
    "ja": "6軸多関節産業用ロボットアーム",
    "ko": "6축 다관절 산업용 로봇팔",
    "ar": "ذراع روبوتي صناعي مفصلي سداسي المحاور"
  },
  "boston-quadruped-robot": {
    "zh-CN": "波士顿动力四足仿生机器狗",
    "zh-HK": "波士頓動力四足仿生機械狗",
    "es": "Perro Robot Cuadrúpedo Ágil",
    "fr": "Robot Chien Quadrupède Agile",
    "de": "Agiler Vierbeiniger Roboterhund",
    "nl": "Viervoetige Autonome Inspectierobot",
    "pt": "Cão-Robô Quadrúpede Ágil",
    "it": "Cane Robot Quadrupede Agile",
    "ja": "四足歩行ロボットドッグ",
    "ko": "보스턴 다이내믹스 4족 보행 로봇개",
    "ar": "روبوت رباعي الأرجل رشيق الحركة"
  },
  "cat-hydraulic-excavator": {
    "zh-CN": "36吨级履带式液压挖掘机",
    "zh-HK": "36噸級履帶式液壓挖泥機",
    "es": "Excavadora Hidráulica sobre Orugas de 36 t",
    "fr": "Pelle Hydraulique sur Chenilles de 36 t",
    "de": "36-Tonnen-Hydraulik-Raupenbagger",
    "nl": "CAT Hydraulische Rupsgraafmachine",
    "pt": "Escavadeira Hidráulica de Esteiras 36 t",
    "it": "Escavatore Idraulico Cingolato da 36 t",
    "ja": "36トン級油圧クローラーショベル",
    "ko": "36톤급 유압 크롤러 굴착기",
    "ar": "حفارة هيدروليكية مجنزرة بوزن 36 طنًا"
  },
  "john-deere-combine-harvester": {
    "zh-CN": "约翰迪尔 X9 旋转式联合收割机",
    "zh-HK": "約翰迪爾 X9 旋轉式聯合收割機",
    "es": "Cosechadora Rotativa John Deere",
    "fr": "Moissonneuse-Batteuse Rotative",
    "de": "Rotations-Mähdrescher",
    "nl": "John Deere X9 Maaidorser",
    "pt": "Colheitadeira Rotativa de Grãos",
    "it": "Mietitrebbia Rotativa",
    "ja": "ロータリー・コンバインハーベスター",
    "ko": "존디어 로터리 콤바인 수확기",
    "ar": "حصادة الحبوب الدوارة جون دير X9"
  },
  "liebherr-tower-crane": {
    "zh-CN": "利勃海尔锤头式高空塔吊",
    "zh-HK": "利勃海爾錘頭式天秤塔吊",
    "es": "Grúa Torre Cabeza de Martillo",
    "fr": "Grue à Tour de Chantier",
    "de": "Hammerkopf-Turmdrehkran",
    "nl": "Liebherr Slewing Torenkraan",
    "pt": "Grua de Torre Hammerhead",
    "it": "Gru a Torre a Braccio Orizzontale",
    "ja": "ハンマーヘッド・タワークレーン",
    "ko": "해머헤드 타워 크레인",
    "ar": "رافعة برجية عملاقة للبناء"
  },
  "uh60-black-hawk": {
    "zh-CN": "西科斯基 UH-60M“黑鹰”通用直升机",
    "zh-HK": "西科斯基 UH-60M「黑鷹」通用直昇機",
    "es": "Sikorsky UH-60M Black Hawk",
    "fr": "Sikorsky UH-60M Black Hawk",
    "de": "Sikorsky UH-60M Black Hawk",
    "nl": "Sikorsky UH-60M Black Hawk Helikopter",
    "pt": "Sikorsky UH-60M Black Hawk",
    "it": "Sikorsky UH-60M Black Hawk",
    "ja": "シコルスキー UH-60M ブラックホーク",
    "ko": "시코르스키 UH-60M 블랙호크",
    "ar": "مروحية سيكورسكي UH-60M بلاك هوك"
  },
  "airbus-h145-rescue": {
    "zh-CN": "空客 H145 D3 涵道尾桨医疗救援直升机",
    "zh-HK": "空中巴士 H145 D3 醫療救援直昇機",
    "es": "Helicóptero de Rescate Airbus H145 D3",
    "fr": "Hélicoptère de Secours Airbus H145 D3",
    "de": "Airbus H145 D3 Rettungshubschrauber",
    "nl": "Airbus H145 Reddingshelikopter",
    "pt": "Helicóptero de Resgate Airbus H145 D3",
    "it": "Elicottero di Soccorso Airbus H145 D3",
    "ja": "エアバス H145 D3 ドクターヘリ",
    "ko": "에어버스 H145 D3 응급 구조 헬기",
    "ar": "مروحية الإنقاذ الطبي إيرباص H145 D3"
  },
  "dji-mavic-3-pro": {
    "zh-CN": "三摄折叠航拍四轴无人机",
    "zh-HK": "三鏡摺疊航拍四軸無人機",
    "es": "Cuadricóptero Plegable de Triple Cámara",
    "fr": "Drone Quadricoptère Pliable Triple Caméra",
    "de": "Faltbarer Triple-Kamera-Quadrokopter",
    "nl": "DJI Mavic 3 Pro Opvouwbare Cameradrone",
    "pt": "Drone Quadricóptero Dobrável de Câmera Tripla",
    "it": "Drone Quadricottero Pieghevole a Tripla Fotocamera",
    "ja": "トリプルカメラ折りたたみ式クアッドコプター",
    "ko": "트리플 카메라 접이식 쿼드콥터 드론",
    "ar": "طائرة درون قابلة للطي بثلاث كاميرات"
  },
  "nasa-ingenuity-mars-heli": {
    "zh-CN": "NASA“机智号”共轴双旋翼火星直升机",
    "zh-HK": "NASA「機智號」共軸雙旋翼火星直昇機",
    "es": "Helicóptero Coaxial Marciano NASA Ingenuity",
    "fr": "Hélicoptère Martien Coaxial NASA Ingenuity",
    "de": "NASA Ingenuity Mars-Koaxialhubschrauber",
    "nl": "NASA Ingenuity Coaxiale Mars-helikopter",
    "pt": "Helicóptero Coaxial de Marte NASA Ingenuity",
    "it": "Elicottero Coassiale Marziano NASA Ingenuity",
    "ja": "NASA インジェニュイティ 火星同軸ヘリコプター",
    "ko": "NASA 인제뉴어티 화성 동축반전 헬리콥터",
    "ar": "مروحية المريخ المحورية إنجينويتي التابعة لناسا"
  },
  "swiss-chronograph-watch": {
    "zh-CN": "瑞士自动上链机械计时码表",
    "zh-HK": "瑞士自動上鏈機械計時腕錶",
    "es": "Cronógrafo Mecánico Automático Suizo",
    "fr": "Chronographe Mécanique Automatique Suisse",
    "de": "Schweizer Automatik-Chronograph",
    "nl": "Zwitserse Mechanische Chronograaf",
    "pt": "Cronógrafo Mecânico Automático Suíço",
    "it": "Cronografo Meccanico Automatico Svizzero",
    "ja": "スイス製自動巻きメカニカル・クロノグラフ",
    "ko": "스위스 오토매틱 기계식 크로노그래프",
    "ar": "ساعة كرونوغراف ميكانيكية أوتوماتيكية سويسرية"
  },
  "grandfather-pendulum-clock": {
    "zh-CN": "西敏寺报时重锤摆锤落地大钟",
    "zh-HK": "西敏寺報時重錘擺錘座地大鐘",
    "es": "Reloj de Abuelo con Péndulo Westminster",
    "fr": "Horloge Comtoise à Pendule Westminster",
    "de": "Westminster-Pendelstanduhr",
    "nl": "Klassieke Staande Slingerklok",
    "pt": "Relógio de Pêndulo Westminster",
    "it": "Orologio a Pendolo Westminster",
    "ja": "ウェストミンスター・チャイム振り子時計",
    "ko": "웨스트민스터 차임 진자 괘종시계",
    "ar": "ساعة بندول وستمنستر القائمة"
  },
  "tern-gsd-cargo-ebike": {
    "zh-CN": "Tern GSD S10 中置电机货运电助力车",
    "zh-HK": "Tern GSD S10 中置摩打電動貨運單車",
    "es": "Bicicleta Eléctrica de Carga Tern GSD S10",
    "fr": "Vélo Cargo Électrique Tern GSD S10",
    "de": "Tern GSD S10 E-Lastenrad",
    "nl": "Tern GSD Elektrische Cargo-fiets",
    "pt": "E-Bike de Carga Tern GSD S10",
    "it": "Cargo E-Bike Tern GSD S10",
    "ja": "Tern GSD S10 電動カーゴバイク",
    "ko": "Tern GSD S10 전기 카고 바이크",
    "ar": "دراجة الشحن الكهربائية Tern GSD S10"
  },
  "carbon-aero-road-bike": {
    "zh-CN": "环法级全碳纤维气动公路赛车",
    "zh-HK": "環法級全碳纖維氣動公路賽車",
    "es": "Bicicleta de Ruta Aero de Carbono",
    "fr": "Vélo de Route Aéro en Carbone",
    "de": "Tour-Grade Carbon-Aero-Rennrad",
    "nl": "Aerodynamische Carbon Racefiets",
    "pt": "Bicicleta Speed Aero de Carbono",
    "it": "Bici da Corsa Aero in Carbonio",
    "ja": "ツアーグレード・カーボンエアロロードバイク",
    "ko": "투어급 카본 에어로 로드바이크",
    "ar": "دراجة سباق هوائية من ألياف الكربون"
  },
  "ducati-panigale-v4": {
    "zh-CN": "杜卡迪 Panigale V4 R 超级摩托车",
    "zh-HK": "杜卡迪 Panigale V4 R 超級電單車",
    "es": "Superbike Ducati Panigale V4 R",
    "fr": "Superbike Ducati Panigale V4 R",
    "de": "Ducati Panigale V4 R Superbike",
    "nl": "Ducati Panigale V4 S Superbike",
    "pt": "Superbike Ducati Panigale V4 R",
    "it": "Superbike Ducati Panigale V4 R",
    "ja": "ドゥカティ パニガーレ V4 R スーパーバイク",
    "ko": "두카티 파니갈레 V4 R 슈퍼바이크",
    "ar": "دراجة دوكاتي بانيجال V4 R الخارقة"
  },
  "quantum-of-the-seas": {
    "zh-CN": "皇家加勒比“海洋量子号”豪华邮轮",
    "zh-HK": "皇家加勒比「海洋量子號」豪華郵輪",
    "es": "Crucero Royal Caribbean Quantum of the Seas",
    "fr": "Paquebot Royal Caribbean Quantum of the Seas",
    "de": "Kreuzfahrtschiff Quantum of the Seas",
    "nl": "Quantum of the Seas Cruiseschip",
    "pt": "Cruzeiro Royal Caribbean Quantum of the Seas",
    "it": "Nave da Crociera Quantum of the Seas",
    "ja": "ロイヤル・カリビアン クアンタム・オブ・ザ・シーズ",
    "ko": "로얄캐리비안 퀀텀 오브 더 시즈 크루즈선",
    "ar": "سفينة الرحلات السياحية كوانتوم أوف ذا سيز"
  },
  "launchpad-mega-yacht": {
    "zh-CN": "118米 Feadship 超级游艇“Launchpad”",
    "zh-HK": "118米 Feadship 超級遊艇「Launchpad」",
    "es": "Superyate Feadship de 118 m \"Launchpad\"",
    "fr": "Superyacht Feadship 118 m \"Launchpad\"",
    "de": "118m Feadship-Superyacht „Launchpad“",
    "nl": "Launchpad 118m Superjacht",
    "pt": "Superiate Feadship 118 m \"Launchpad\"",
    "it": "Superyacht Feadship 118 m \"Launchpad\"",
    "ja": "118m フィードシップ・メガヨット「Launchpad」",
    "ko": "118m 피드십 슈퍼요트 \"Launchpad\"",
    "ar": "اليخت العملاق Launchpad بطول 118 مترًا"
  },
  "ultra-large-container-ship": {
    "zh-CN": "24,000 标准箱 (TEU) 超大型集装箱船",
    "zh-HK": "24,000 標準箱 (TEU) 超大型貨櫃船",
    "es": "Buque Portacontenedores Ultra Grande de 24.000 TEU",
    "fr": "Porte-Conteneurs Géant de 24 000 EVP",
    "de": "24.000-TEU-Ultra-Großcontainerschiff",
    "nl": "24.000-TEU Ultra-groot Containerschip",
    "pt": "Navio Porta-Contêineres de 24.000 TEU",
    "it": "Nave Portacontainer Ultra-Large da 24.000 TEU",
    "ja": "24,000 TEU 超大型コンテナ船",
    "ko": "24,000 TEU급 초대형 컨테이너선",
    "ar": "سفينة حاويات عملاقة بسعة 24,000 حاوية"
  },
  "nimitz-aircraft-carrier": {
    "zh-CN": "核动力超级航空母舰 (CVN-78)",
    "zh-HK": "核動力超級航空母艦 (CVN-78)",
    "es": "Superportaaviones Nuclear (CVN-78)",
    "fr": "Super-Porte-Avions Nucléaire (CVN-78)",
    "de": "Atom-Flugzeugträger (CVN-78)",
    "nl": "Nimitz-klasse Nucleair Vliegdekschip",
    "pt": "Superporta-Aviões Nuclear (CVN-78)",
    "it": "Superportaerei Nucleare (CVN-78)",
    "ja": "原子力超大型航空母艦 (CVN-78)",
    "ko": "핵추진 슈퍼 항공모함 (CVN-78)",
    "ar": "حاملة طائرات عملاقة تعمل بالطاقة النووية (CVN-78)"
  },
  "rms-titanic-ocean-liner": {
    "zh-CN": "RMS 泰坦尼克号奥林匹克级远洋邮轮",
    "zh-HK": "RMS 鐵達尼號奧林匹克級遠洋郵輪",
    "es": "Transatlántico RMS Titanic",
    "fr": "Paquebot Transatlantique RMS Titanic",
    "de": "RMS Titanic Transatlantik-Passagierschiff",
    "nl": "RMS Titanic Oceaanstomer",
    "pt": "Transatlântico RMS Titanic",
    "it": "Transatlantico RMS Titanic",
    "ja": "RMS タイタニック号 オリンピック級豪華客船",
    "ko": "RMS 타이타닉호 올림픽급 원양 정기선",
    "ar": "سفينة المحيطات التاريخية آر إم إس تايتانيك"
  },
  "siphon-flush-toilet": {
    "zh-CN": "重力虹吸式冲水马桶",
    "zh-HK": "重力虹吸式沖水座廁",
    "es": "Inodoro de Descarga por Sifón",
    "fr": "Toilettes à Chasse par Siphon Gravitaire",
    "de": "Schwerkraft-Siphon-Spül-WC",
    "nl": "Keramisch Sifon-spoeltoilet",
    "pt": "Vaso Sanitário de Descarga por Sifão",
    "it": "WC con Scarico a Sifone a Gravità",
    "ja": "重力サイフォン式水洗トイレ",
    "ko": "중력 사이펀식 수세식 변기",
    "ar": "مرحاض التدفق بالسيفون الجاذبي"
  },
  "traction-passenger-elevator": {
    "zh-CN": "高层无齿轮曳引观光电梯",
    "zh-HK": "高層無齒輪曳引觀光升降機",
    "es": "Ascensor de Tracción sin Engranajes",
    "fr": "Ascenseur à Traction sans Engrenage",
    "de": "Getriebeloser Hochhaus-Seilaufzug",
    "nl": "Tractie-personenlift met Tegenwicht",
    "pt": "Elevador de Tração sem Engrenagens",
    "it": "Ascensore a Trazione Gearless",
    "ja": "超高層ギアレス・ロープ式エレベーター",
    "ko": "초고층 기어리스 권상기 엘리베이터",
    "ar": "مصعد ركاب بالجر بدون تروس لناطحات السحاب"
  },
  "pin-tumbler-lock": {
    "zh-CN": "黄铜五弹子剪力线锁芯",
    "zh-HK": "黃銅五彈子剪力線鎖芯",
    "es": "Cerradura de Cilindro de 5 Pernos de Latón",
    "fr": "Serrure Cylindrique à 5 Goupilles en Laiton",
    "de": "Messing-Stiftzylinderschloss",
    "nl": "Mechanisch Cilinderslot met Stiften",
    "pt": "Fechadura Cilíndrica de Pinos de Latão",
    "it": "Serratura a Cilindro a Pistoncini in Ottone",
    "ja": "真鍮製ピンタンブラー・シリンダー錠",
    "ko": "황동 핀 텀블러 실린더 자물쇠",
    "ar": "قفل أسطواني نحاسي بخمسة دبابيس"
  },
  "italian-espresso-machine": {
    "zh-CN": "双锅炉 9-Bar E61 意式浓缩咖啡机",
    "zh-HK": "雙鍋爐 9-Bar E61 意式濃縮咖啡機",
    "es": "Máquina de Café Espresso Doble Caldera 9 Bares",
    "fr": "Machine Expresso Double Chaudière 9 Bars",
    "de": "9-Bar-Dualboiler-Siebträgermaschine",
    "nl": "Italiaanse E61-espressomachine",
    "pt": "Máquina de Espresso Caldeira Dupla 9 Bar",
    "it": "Macchina per Espresso a Doppia Caldaia 9 Bar",
    "ja": "デュアルボイラー 9気圧 エスプレッソマシン",
    "ko": "듀얼 보일러 9바 에스프레소 머신",
    "ar": "آلة إسبريسو إيطالية بغلاية مزدوجة وضغط 9 بار"
  },
  "iphone-16-pro-max": {
    "zh-CN": "iPhone 16 Pro Max 钛金属旗舰手机",
    "zh-HK": "iPhone 16 Pro Max 鈦金屬旗艦手機",
    "es": "iPhone 16 Pro Max (Titanio)",
    "fr": "iPhone 16 Pro Max (Titane)",
    "de": "iPhone 16 Pro Max (Titan)",
    "nl": "iPhone 16 Pro Max (Titanium)",
    "pt": "iPhone 16 Pro Max (Titânio)",
    "it": "iPhone 16 Pro Max (Titanio)",
    "ja": "iPhone 16 Pro Max (チタニウム)",
    "ko": "iPhone 16 Pro Max (티타늄)",
    "ar": "آيفون 16 برو ماكس (تيتانيوم)"
  },
  "iphone-16-pink": {
    "zh-CN": "iPhone 16 融色玻璃铝合金手机",
    "zh-HK": "iPhone 16 融色玻璃鋁金屬手機",
    "es": "iPhone 16 (Aluminio y Vidrio Tintado)",
    "fr": "iPhone 16 (Aluminium & Verre Teinté)",
    "de": "iPhone 16 (Aluminium & Farbglas)",
    "nl": "iPhone 16 (Aluminium)",
    "pt": "iPhone 16 (Alumínio e Vidro Colorido)",
    "it": "iPhone 16 (Alluminio e Vetro Colorato)",
    "ja": "iPhone 16 (カラーインフューズドガラス)",
    "ko": "iPhone 16 (컬러 인퓨즈드 글래스)",
    "ar": "آيفون 16 (ألومنيوم وزجاج ملون)"
  },
  "pixel-9-pro-xl": {
    "zh-CN": "Google Pixel 9 Pro XL (Tensor G4 旗舰)",
    "zh-HK": "Google Pixel 9 Pro XL (Tensor G4 旗艦)",
    "es": "Google Pixel 9 Pro XL (Tensor G4)",
    "fr": "Google Pixel 9 Pro XL (Tensor G4)",
    "de": "Google Pixel 9 Pro XL (Tensor G4)",
    "nl": "Google Pixel 9 Pro XL",
    "pt": "Google Pixel 9 Pro XL (Tensor G4)",
    "it": "Google Pixel 9 Pro XL (Tensor G4)",
    "ja": "Google Pixel 9 Pro XL (Tensor G4 搭載モデル)",
    "ko": "구글 픽셀 9 Pro XL (Tensor G4)",
    "ar": "جوجل بكسل 9 برو XL (معالج Tensor G4)"
  },
  "samsung-s24-ultra": {
    "zh-CN": "三星 Galaxy S24 Ultra (S Pen 钛金属旗舰)",
    "zh-HK": "三星 Galaxy S24 Ultra (S Pen 鈦金屬旗艦)",
    "es": "Samsung Galaxy S24 Ultra (Titanio + S Pen)",
    "fr": "Samsung Galaxy S24 Ultra (Titane + S Pen)",
    "de": "Samsung Galaxy S24 Ultra (Titan + S Pen)",
    "nl": "Samsung Galaxy S24 Ultra",
    "pt": "Samsung Galaxy S24 Ultra (Titânio + S Pen)",
    "it": "Samsung Galaxy S24 Ultra (Titanio + S Pen)",
    "ja": "Samsung Galaxy S24 Ultra (Sペン内蔵)",
    "ko": "삼성 갤럭시 S24 울트라 (S펜 & 티타늄)",
    "ar": "سامسونج جالاكسي S24 ألترا (تيتانيوم مع قلم S Pen)"
  },
  "samsung-z-fold-6": {
    "zh-CN": "三星 Galaxy Z Fold 6 超薄折叠屏手机",
    "zh-HK": "三星 Galaxy Z Fold 6 摺疊熒幕手機",
    "es": "Samsung Galaxy Z Fold 6 (Plegable)",
    "fr": "Samsung Galaxy Z Fold 6 (Pliable)",
    "de": "Samsung Galaxy Z Fold 6 (Falt-Smartphone)",
    "nl": "Samsung Galaxy Z Fold 6 Opvouwbaar",
    "pt": "Samsung Galaxy Z Fold 6 (Dobrável)",
    "it": "Samsung Galaxy Z Fold 6 (Pieghevole)",
    "ja": "Samsung Galaxy Z Fold 6 (折りたたみスマホ)",
    "ko": "삼성 갤럭시 Z 폴드 6 (폴더블)",
    "ar": "سامسونج جالاكسي Z فولد 6 القابل للطي"
  },
  "macbook-pro-16": {
    "zh-CN": "MacBook Pro 16 英寸 (M4 Max 芯片)",
    "zh-HK": "MacBook Pro 16 吋 (M4 Max 晶片)",
    "es": "MacBook Pro 16\" (Chip M4 Max)",
    "fr": "MacBook Pro 16\" (Puce M4 Max)",
    "de": "MacBook Pro 16\" (M4 Max Chip)",
    "pt": "MacBook Pro 16\" (Chip M4 Max)",
    "it": "MacBook Pro 16\" (Chip M4 Max)",
    "ja": "MacBook Pro 16インチ (M4 Max)",
    "ko": "MacBook Pro 16형 (M4 Max 칩)",
    "ar": "ماك بوك برو 16 بوصة (شريحة M4 Max)"
  },
  "macbook-air-15": {
    "zh-CN": "MacBook Air 15 英寸 (M3 无风扇静音设计)",
    "zh-HK": "MacBook Air 15 吋 (M3 無風扇靜音設計)",
    "es": "MacBook Air 15\" (M3 sin ventilador)",
    "fr": "MacBook Air 15\" (M3 sans ventilateur)",
    "de": "MacBook Air 15\" (M3 lüfterlos)",
    "pt": "MacBook Air 15\" (M3 sem ventoinha)",
    "it": "MacBook Air 15\" (M3 senza ventola)",
    "ja": "MacBook Air 15インチ (M3 ファンレス)",
    "ko": "MacBook Air 15형 (M3 팬리스)",
    "ar": "ماك بوك إير 15 بوصة (M3 بدون مروحة)"
  },
  "rtx-gaming-laptop": {
    "zh-CN": "RTX 4090 均热板旗舰电竞笔记本",
    "zh-HK": "RTX 4090 均熱板旗艦電競手提電腦",
    "es": "Portátil Gaming RTX 4090 con Cámara de Vapor",
    "fr": "PC Portable Gaming RTX 4090 à Chambre à Vapeur",
    "de": "RTX 4090 Vapor-Chamber Gaming-Laptop",
    "nl": "MacBook Pro 16\" (M4 Max)",
    "pt": "Notebook Gamer RTX 4090 com Câmara de Vapor",
    "it": "Laptop Gaming RTX 4090 con Camera di Vapore",
    "ja": "RTX 4090 ベイパーチャンバー搭載ゲーミングPC",
    "ko": "RTX 4090 베이퍼 챔버 게이밍 노트북",
    "ar": "حاسوب ألعاب محمول RTX 4090 بغرفة تبريد بخارية"
  },
  "modern-smart-house": {
    "zh-CN": "现代双层太阳能生态智能住宅",
    "zh-HK": "現代雙層太陽能生態智能住宅",
    "es": "Casa Inteligente Ecológica de 2 Plantas",
    "fr": "Maison Éco-Intelligente Moderne à 2 Étages",
    "de": "Modernes 2-stöckiges Öko-Smart-Home",
    "nl": "Moderne Tweelaagse Eco-smartwoning",
    "pt": "Casa Ecológica Inteligente de 2 Andares",
    "it": "Smart Home Ecologica Moderna a 2 Piani",
    "ja": "モダン2階建てエコ・スマートハウス",
    "ko": "현대식 2층 에코 스마트 하우스",
    "ar": "منزل ذكي بيئي حديث من طابقين"
  },
  "glass-pavilion-villa": {
    "zh-CN": "现代主义钢结构全景玻璃别墅",
    "zh-HK": "現代主義鋼結構全景玻璃別墅",
    "es": "Villa Pabellón de Cristal y Acero",
    "fr": "Villa Pavillon Moderne en Verre et Acier",
    "de": "Moderne Glas- und Stahl-Pavillonvilla",
    "nl": "Mid-Century Glas- & Staalvilla",
    "pt": "Vila Pavilhão de Vidro e Aço",
    "it": "Villa Padiglione in Vetro e Acciaio",
    "ja": "ガラス＆スチール・パビリオンヴィラ",
    "ko": "글래스 & 스틸 파빌리온 빌라",
    "ar": "فيلا جناح الزجاج والفولاذ الحديث"
  },
  "geodesic-eco-dome": {
    "zh-CN": "离网测地线生态穹顶木屋",
    "zh-HK": "離網測地線生態穹頂木屋",
    "es": "Cabaña Domo Geodésico Ecológico Off-Grid",
    "fr": "Cabane Dôme Géodésique Écologique Autonome",
    "de": "Autarke Geodätische Öko-Kuppel",
    "nl": "Geodetische Off-Grid Koepelwoning",
    "pt": "Cabana Domo Geodésico Ecológico Off-Grid",
    "it": "Cupola Geodetica Ecologica Off-Grid",
    "ja": "オフグリッド・ジオデシック・エコドーム",
    "ko": "오프그리드 지오데식 에코 돔 하우스",
    "ar": "قبة جيوديسية بيئية مستقلة عن الشبكة"
  },
  "mini-led-8k-tv": {
    "zh-CN": "85 英寸 Mini-LED 8K 量子点旗舰电视",
    "zh-HK": "85 吋 Mini-LED 8K 量子點旗艦電視",
    "es": "Televisor 85\" Mini-LED 8K Quantum Dot",
    "fr": "Téléviseur 85\" Mini-LED 8K Quantum Dot",
    "de": "85\" Mini-LED 8K Quantum-Dot-Fernseher",
    "pt": "Smart TV 85\" Mini-LED 8K Quantum Dot",
    "it": "TV 85\" Mini-LED 8K Quantum Dot",
    "ja": "85型 Mini-LED 8K 量子ドットテレビ",
    "ko": "85형 Mini-LED 8K 퀀텀닷 TV",
    "ar": "تلفزيون 85 بوصة Mini-LED بدقة 8K"
  },
  "lg-transparent-oled-tv": {
    "zh-CN": "LG Signature OLED T 77 英寸透明无线电视",
    "zh-HK": "LG Signature OLED T 77 吋透明無線電視",
    "es": "TV Inalámbrico Transparente LG OLED T de 77\"",
    "fr": "TV Sans Fil Transparent LG OLED T 77\"",
    "de": "LG Signature OLED T 77\" Transparenter Fernseher",
    "pt": "TV Sem Fio Transparente LG OLED T de 77\"",
    "it": "TV Wireless Trasparente LG OLED T da 77\"",
    "ja": "LG Signature OLED T 77型 透明ワイヤレスTV",
    "ko": "LG 시그니처 올레드 T 77형 투명 무선 TV",
    "ar": "تلفزيون LG OLED T الشفاف اللاسلكي مقاس 77 بوصة"
  },
  "imax-laser-cinema": {
    "zh-CN": "IMAX GT 双 4K 激光巨幕影院系统",
    "zh-HK": "IMAX GT 雙 4K 激光巨幕影院系統",
    "es": "Sistema de Cine Láser Dual-4K IMAX GT",
    "fr": "Système de Cinéma Laser IMAX GT Dual-4K",
    "de": "IMAX GT Dual-4K-Laser-Kinosystem",
    "nl": "85\" QD-OLED & Mini-LED 8K-tv",
    "pt": "Sistema de Cinema IMAX GT Dual-4K a Laser",
    "it": "Sistema Cinematografico IMAX GT Dual-4K Laser",
    "ja": "IMAX GT デュアル4Kレーザー・シネマシステム",
    "ko": "IMAX GT 듀얼 4K 레이저 시네마 시스템",
    "ar": "نظام سينما IMAX GT بالليزر المزدوج 4K"
  },
  "shinkansen-n700s": {
    "zh-CN": "日本新干线 N700S 最高速动车组",
    "zh-HK": "日本新幹線 N700S 高速列車",
    "es": "Tren Bala Japonés Shinkansen N700S",
    "fr": "Train à Grande Vitesse Japonais Shinkansen N700S",
    "de": "Japanischer Hochgeschwindigkeitszug Shinkansen N700S",
    "nl": "Shinkansen N700S Supreme Kogeltrein",
    "pt": "Trem-Bala Japonês Shinkansen N700S",
    "it": "Treno Proiettile Giapponese Shinkansen N700S",
    "ja": "東海道・山陽新幹線 N700S (スプリーム)",
    "ko": "일본 신칸센 N700S 고속열차",
    "ar": "قطار الرصاصة الياباني شينكانسن N700S"
  },
  "cr400af-fuxing": {
    "zh-CN": "中国标准动车组 CR400AF“复兴号”高铁",
    "zh-HK": "中國標準動車組 CR400AF「復興號」高鐵",
    "es": "Tren de Alta Velocidad CR400AF Fuxing Hao (350 km/h)",
    "fr": "TGV Chinois CR400AF Fuxing Hao (350 km/h)",
    "de": "Hochgeschwindigkeitszug CR400AF Fuxing Hao (350 km/h)",
    "nl": "CR400AF Fuxing Hao Hogesnelheidstrein",
    "pt": "Trem de Alta Velocidade CR400AF Fuxing Hao (350 km/h)",
    "it": "Treno Alta Velocità CR400AF Fuxing Hao (350 km/h)",
    "ja": "中国高速鉄道 CR400AF「復興号」(350 km/h)",
    "ko": "중국 고속철도 CR400AF 푸싱호 (350 km/h)",
    "ar": "قطار فوشينغ السريع CR400AF (350 كم/س)"
  },
  "l0-series-maglev": {
    "zh-CN": "日本 L0 系超导磁悬浮列车 (603 km/h)",
    "zh-HK": "日本 L0 系超導磁浮列車 (603 km/h)",
    "es": "Tren SCMaglev Serie L0 de Levitación Magnética (603 km/h)",
    "fr": "Train Maglev Supraconducteur Série L0 (603 km/h)",
    "de": "Supraleitender Magnetschwebezug L0-Serie (603 km/h)",
    "nl": "L0-serie Supergeleidende Maglev",
    "pt": "Trem SCMaglev Série L0 de Levitação Magnética (603 km/h)",
    "it": "Treno SCMaglev Serie L0 a Levitazione Magnetica (603 km/h)",
    "ja": "超電導リニア L0系 (世界最高速 603 km/h)",
    "ko": "초전도 자기부상열차 L0 시리즈 (603 km/h)",
    "ar": "قطار الرفع المغناطيسي فائق التوصيل L0 (603 كم/س)"
  },
  "iss-space-station": {
    "zh-CN": "国际空间站 (ISS) 轨道实验室",
    "zh-HK": "國際太空站 (ISS) 軌道實驗室",
    "es": "Estación Espacial Internacional (ISS)",
    "fr": "Station Spatiale Internationale (ISS)",
    "de": "Internationale Raumstation (ISS)",
    "nl": "Internationaal Ruimtestation (ISS)",
    "pt": "Estação Espacial Internacional (ISS)",
    "it": "Stazione Spaziale Internazionale (ISS)",
    "ja": "国際宇宙ステーション (ISS)",
    "ko": "국제우주정거장 (ISS)",
    "ar": "محطة الفضاء الدولية (ISS)"
  },
  "nasa-space-shuttle": {
    "zh-CN": "NASA 航天飞机完整发射组合体 (STS)",
    "zh-HK": "NASA 太空穿梭機完整發射組合 (STS)",
    "es": "Transbordador Espacial de la NASA (Pila Completa STS)",
    "fr": "Navette Spatiale de la NASA (Ensemble de Lancement STS)",
    "de": "NASA Space Shuttle (Kompletter STS-Start-Stack)",
    "nl": "NASA Space Shuttle STS",
    "pt": "Ônibus Espacial da NASA (Conjunto Completo STS)",
    "it": "Space Shuttle della NASA (Stack di Lancio STS)",
    "ja": "NASA スペースシャトル (フルランチスタック STS)",
    "ko": "NASA 우주왕복선 전체 발사 시스템 (STS)",
    "ar": "مكوك الفضاء التابع لناسا (منظومة الإطلاق الكاملة STS)"
  },
  "spacex-falcon-9": {
    "zh-CN": "SpaceX 猎鹰 9 号 Block 5 可回收运载火箭",
    "zh-HK": "SpaceX 獵鷹 9 號 Block 5 可回收運載火箭",
    "es": "Cohete Reutilizable SpaceX Falcon 9 Block 5",
    "fr": "Fusée Réutilisable SpaceX Falcon 9 Block 5",
    "de": "Wiederverwendbare Rakete SpaceX Falcon 9 Block 5",
    "nl": "SpaceX Falcon 9 Herbruikbare Raket",
    "pt": "Foguete Reutilizável SpaceX Falcon 9 Block 5",
    "it": "Razzo Riutilizzabile SpaceX Falcon 9 Block 5",
    "ja": "SpaceX ファルコン9 Block 5 再使用ロケット",
    "ko": "SpaceX 팰컨 9 Block 5 재사용 로켓",
    "ar": "صاروخ سبيس إكس فالكون 9 بلوك 5 القابل لإعادة الاستخدام"
  },
  "spacex-starship-superheavy": {
    "zh-CN": "SpaceX 星舰与超重型助推器 (Starship & Super Heavy)",
    "zh-HK": "SpaceX 星艦同超重型助推器 (Starship & Super Heavy)",
    "es": "SpaceX Starship y Propulsor Super Heavy",
    "fr": "SpaceX Starship & Propulseur Super Heavy",
    "de": "SpaceX Starship & Super-Heavy-Booster",
    "nl": "SpaceX Starship & Super Heavy",
    "pt": "SpaceX Starship e Propulsor Super Heavy",
    "it": "SpaceX Starship e Booster Super Heavy",
    "ja": "SpaceX スターシップ＆スーパーヘビー",
    "ko": "SpaceX 스타십 & 슈퍼헤비 부스터",
    "ar": "مركبة سبيس إكس ستارشيب ومعزز سوبر هيفي"
  },
  "nasa-saturn-v": {
    "zh-CN": "NASA 阿波罗土星五号登月重型火箭 (Saturn V)",
    "zh-HK": "NASA 阿波羅土星五號登月重型火箭 (Saturn V)",
    "es": "Cohete Lunar NASA Apollo Saturno V",
    "fr": "Fusée Lunaire NASA Apollo Saturn V",
    "de": "NASA Apollo Saturn V Mondrakete",
    "nl": "NASA Saturn V Maanraket",
    "pt": "Foguete Lunar NASA Apollo Saturno V",
    "it": "Razzo Lunare NASA Apollo Saturn V",
    "ja": "NASA アポロ計画 サターンV型月ロケット",
    "ko": "NASA 아폴로 새턴 V 달 탐사 로켓",
    "ar": "صاروخ القمر ناسا أبولو ساتورن 5"
  },
  "iphone-16-ultramarine": {
    "zh-CN": "iPhone 16 融色玻璃铝合金手机",
    "zh-HK": "iPhone 16 融色玻璃鋁金屬手機",
    "es": "iPhone 16 (Aluminio y Vidrio Tintado)",
    "fr": "iPhone 16 (Aluminium & Verre Teinté)",
    "de": "iPhone 16 (Aluminium & Farbglas)",
    "nl": "iPhone 16 Ultramarijn",
    "pt": "iPhone 16 (Alumínio e Vidro Colorido)",
    "it": "iPhone 16 (Alluminio e Vetro Colorato)",
    "ja": "iPhone 16 (カラーインフューズドガラス)",
    "ko": "iPhone 16 (컬러 인퓨즈드 글래스)",
    "ar": "آيفون 16 (ألومنيوم وزجاج ملون)"
  },
  "gaming-laptop-rtx": {
    "zh-CN": "RTX 4090 均热板旗舰电竞笔记本",
    "zh-HK": "RTX 4090 均熱板旗艦電競手提電腦",
    "es": "Portátil Gaming RTX 4090 con Cámara de Vapor",
    "fr": "PC Portable Gaming RTX 4090 à Chambre à Vapeur",
    "de": "RTX 4090 Vapor-Chamber Gaming-Laptop",
    "nl": "RTX 4090 Vapor-Chamber Gaming-laptop",
    "pt": "Notebook Gamer RTX 4090 com Câmara de Vapor",
    "it": "Laptop Gaming RTX 4090 con Camera di Vapore",
    "ja": "RTX 4090 ベイパーチャンバー搭載ゲーミングPC",
    "ko": "RTX 4090 베이퍼 챔버 게이밍 노트북",
    "ar": "حاسوب ألعاب محمول RTX 4090 بغرفة تبريد بخارية"
  },
  "modern-eco-home": {
    "zh-CN": "现代双层太阳能生态智能住宅",
    "zh-HK": "現代雙層太陽能生態智能住宅",
    "es": "Casa Inteligente Ecológica de 2 Plantas",
    "fr": "Maison Éco-Intelligente Moderne à 2 Étages",
    "de": "Modernes 2-stöckiges Öko-Smart-Home",
    "nl": "Moderne Tweelaagse Eco-smartwoning",
    "pt": "Casa Ecológica Inteligente de 2 Andares",
    "it": "Smart Home Ecologica Moderna a 2 Piani",
    "ja": "モダン2階建てエコ・スマートハウス",
    "ko": "현대식 2층 에코 스마트 하우스",
    "ar": "منزل ذكي بيئي حديث من طابقين"
  },
  "geodesic-dome-cabin": {
    "zh-CN": "离网测地线生态穹顶木屋",
    "zh-HK": "離網測地線生態穹頂木屋",
    "es": "Cabaña Domo Geodésico Ecológico Off-Grid",
    "fr": "Cabane Dôme Géodésique Écologique Autonome",
    "de": "Autarke Geodätische Öko-Kuppel",
    "nl": "Geodetische Off-Grid Koepelwoning",
    "pt": "Cabana Domo Geodésico Ecológico Off-Grid",
    "it": "Cupola Geodetica Ecologica Off-Grid",
    "ja": "オフグリッド・ジオデシック・エコドーム",
    "ko": "오프그리드 지오데식 에코 돔 하우스",
    "ar": "قبة جيوديسية بيئية مستقلة عن الشبكة"
  },
  "transparent-oled-tv": {
    "zh-CN": "LG Signature OLED T 77 英寸透明无线电视",
    "zh-HK": "LG Signature OLED T 77 吋透明無線電視",
    "es": "TV Inalámbrico Transparente LG OLED T de 77\"",
    "fr": "TV Sans Fil Transparent LG OLED T 77\"",
    "de": "LG Signature OLED T 77\" Transparenter Fernseher",
    "pt": "TV Sem Fio Transparente LG OLED T de 77\"",
    "it": "TV Wireless Trasparente LG OLED T da 77\"",
    "ja": "LG Signature OLED T 77型 透明ワイヤレスTV",
    "ko": "LG 시그니처 올레드 T 77형 투명 무선 TV",
    "ar": "تلفزيون LG OLED T الشفاف اللاسلكي مقاس 77 بوصة"
  },
  "scmaglev-l0": {
    "zh-CN": "日本 L0 系超导磁悬浮列车 (603 km/h)",
    "zh-HK": "日本 L0 系超導磁浮列車 (603 km/h)",
    "es": "Tren SCMaglev Serie L0 de Levitación Magnética (603 km/h)",
    "fr": "Train Maglev Supraconducteur Série L0 (603 km/h)",
    "de": "Supraleitender Magnetschwebezug L0-Serie (603 km/h)",
    "nl": "LG 77\" Transparante OLED-tv",
    "pt": "Trem SCMaglev Série L0 de Levitação Magnética (603 km/h)",
    "it": "Treno SCMaglev Serie L0 a Levitazione Magnetica (603 km/h)",
    "ja": "超電導リニア L0系 (世界最高速 603 km/h)",
    "ko": "초전도 자기부상열차 L0 시리즈 (603 km/h)",
    "ar": "قطار الرفع المغناطيسي فائق التوصيل L0 (603 كم/س)"
  },
  "iss-orbital-station": {
    "zh-CN": "国际空间站 (ISS) 轨道实验室",
    "zh-HK": "國際太空站 (ISS) 軌道實驗室",
    "es": "Estación Espacial Internacional (ISS)",
    "fr": "Station Spatiale Internationale (ISS)",
    "de": "Internationale Raumstation (ISS)",
    "nl": "Internationaal Ruimtestation (ISS)",
    "pt": "Estação Espacial Internacional (ISS)",
    "it": "Stazione Spaziale Internazionale (ISS)",
    "ja": "国際宇宙ステーション (ISS)",
    "ko": "국제우주정거장 (ISS)",
    "ar": "محطة الفضاء الدولية (ISS)"
  },
  "space-shuttle-sts": {
    "zh-CN": "NASA 航天飞机完整发射组合体 (STS)",
    "zh-HK": "NASA 太空穿梭機完整發射組合 (STS)",
    "es": "Transbordador Espacial de la NASA (Pila Completa STS)",
    "fr": "Navette Spatiale de la NASA (Ensemble de Lancement STS)",
    "de": "NASA Space Shuttle (Kompletter STS-Start-Stack)",
    "nl": "NASA Space Shuttle STS",
    "pt": "Ônibus Espacial da NASA (Conjunto Completo STS)",
    "it": "Space Shuttle della NASA (Stack di Lancio STS)",
    "ja": "NASA スペースシャトル (フルランチスタック STS)",
    "ko": "NASA 우주왕복선 전체 발사 시스템 (STS)",
    "ar": "مكوك الفضاء التابع لناسا (منظومة الإطلاق الكاملة STS)"
  },
  "nasa-saturn-v-apollo": {
    "zh-CN": "NASA 阿波罗土星五号登月重型火箭 (Saturn V)",
    "zh-HK": "NASA 阿波羅土星五號登月重型火箭 (Saturn V)",
    "es": "Cohete Lunar NASA Apollo Saturno V",
    "fr": "Fusée Lunaire NASA Apollo Saturn V",
    "de": "NASA Apollo Saturn V Mondrakete",
    "nl": "NASA Saturn V Apollo-maanraket",
    "pt": "Foguete Lunar NASA Apollo Saturno V",
    "it": "Razzo Lunare NASA Apollo Saturn V",
    "ja": "NASA アポロ計画 サターンV型月ロケット",
    "ko": "NASA 아폴로 새턴 V 달 탐사 로켓",
    "ar": "صاروخ القمر ناسا أبولو ساتورن 5"
  }
};

// Word-boundary-safe technical phrase & component name lexicon across all 10 non-English languages.
// Ordered longest-first at runtime so longer compound phrases always match before shorter roots.
const PHRASE_TABLES = {
  'zh-CN': [
    ['Twin-Turbo V8 Engine', '双涡轮增压 V8 发动机'],
    ['Twin-Turbo V8 engine', '双涡轮增压 V8 发动机'],
    ['Twin-Turbo V8', '双涡轮增压 V8'],
    ['Naturally Aspirated V12', '自然吸气 V12 发动机'],
    ['Flat-Six Engine', '水平对置六缸发动机'],
    ['Electric Motors', '驱动电机组'],
    ['Electric Motor', '驱动电机'],
    ['electric motors', '驱动电机'],
    ['Battery Pack', '高能电池组'],
    ['battery pack', '电池组'],
    ['Solar Panels', '太阳能电池阵列'],
    ['Solar Panel', '太阳能电池板'],
    ['Carbon-Fiber', '碳纤维'],
    ['carbon-fiber', '碳纤维'],
    ['Stainless Steel', '不锈钢'],
    ['stainless-steel', '不锈钢'],
    ['Titanium', '钛合金'],
    ['titanium', '钛合金'],
    ['Aluminum', '铝合金'],
    ['aluminum', '铝合金'],
    ['Steering Wheel', '多功能方向盘'],
    ['steering wheel', '方向盘'],
    ['Windshield', '全景挡风玻璃'],
    ['windshield', '挡风玻璃'],
    ['Landing Gear', '起落架系统'],
    ['landing gear', '起落架'],
    ['Main Rotor', '主旋翼系统'],
    ['Tail Rotor', '反扭矩尾桨'],
    ['Nuclear Reactor', '压水核反应堆'],
    ['Logic Board', '核心逻辑主板'],
    ['Motherboard', '系统主板'],
    ['Afterburner', '加力燃烧室'],
    ['Counterweight', '平衡配重系统'],
    ['Arc Reactor', '方舟反应堆核心'],
    ['Endoskeleton', '纳米内骨骼结构'],
    ['Escapement', '精密擒纵机构'],
    ['Mainspring', '发条动力盒'],
    ['Turbofan', '高涵道比涡扇发动机'],
    ['Submarine', '深海潜艇'],
    ['Propellers', '推进螺旋桨组'],
    ['Propeller', '推进螺旋桨'],
    ['Suspension', '主动悬架系统'],
    ['suspension', '悬架系统'],
    ['Elevators', '水平尾翼升降舵'],
    ['Elevator', '垂直升降系统'],
    ['Fuselage', '加压机身结构'],
    ['fuselage', '机身'],
    ['Cockpit', '数字化驾驶舱'],
    ['Brakes', '高性能制动系统'],
    ['brakes', '制动系统'],
    ['Brake', '制动器'],
    ['Wheels', '锻造轮毂组'],
    ['Wheel', '轮毂'],
    ['Tires', '高性能轮胎'],
    ['Tire', '轮胎'],
    ['Wings', '主翼结构'],
    ['Wing', '机翼'],
    ['Cameras', '光学摄像模组'],
    ['Camera', '光学摄像头'],
    ['Sensors', '精密传感器阵列'],
    ['Sensor', '传感器'],
    ['Hydraulic', '高压液压'],
    ['hydraulic', '液压'],
    ['Pendulum', '温度补偿钟摆'],
    ['Espresso', '意式浓缩咖啡'],
    ['Boiler', '恒温压力锅炉'],
    ['Siphon', '重力虹吸管路'],
    ['Repulsor', '掌心脉冲推进器'],
    ['Helmet', '全息战术头盔'],
    ['Chassis', '高刚性底盘'],
    ['Engine', '动力发动机'],
    ['engine', '发动机'],
    ['Motor', '驱动电机'],
    ['Battery', '储能电池'],
    ['Display', '超高清显示屏'],
    ['Screen', '显示屏幕'],
    ['Hull', '耐压船体外壳'],
    ['Deck', '甲板平台'],
    ['Tower', '主塔架结构'],
    ['Cabin', '乘员舱室'],
    ['Valve', '控制阀门'],
    ['Pump', '增压泵组'],
    ['Gear', '精密齿轮组'],
    ['Shaft', '传动主轴'],
    ['Nozzle', '矢量喷管'],
    ['Fan', '涡轮风扇'],
    ['Armor', '复合装甲板'],
    ['Laser', '高能激光器'],
    ['Magnet', '超导磁体'],
    ['Roof', '屋顶结构'],
    ['Glass', '强化光学玻璃'],
    ['Frame', '主承载车架'],
  ],
  'zh-HK': [
    ['Twin-Turbo V8 Engine', '雙渦輪增壓 V8 引擎'],
    ['Twin-Turbo V8 engine', '雙渦輪增壓 V8 引擎'],
    ['Twin-Turbo V8', '雙渦輪增壓 V8'],
    ['Electric Motors', '電動摩打組'],
    ['Electric Motor', '電動摩打'],
    ['electric motors', '電動摩打'],
    ['Battery Pack', '高能電池組'],
    ['battery pack', '電池組'],
    ['Solar Panels', '太陽能電板陣列'],
    ['Solar Panel', '太陽能電板'],
    ['Carbon-Fiber', '碳纖維'],
    ['carbon-fiber', '碳纖維'],
    ['Stainless Steel', '不鏽鋼'],
    ['stainless-steel', '不鏽鋼'],
    ['Titanium', '鈦金屬'],
    ['titanium', '鈦金屬'],
    ['Aluminum', '鋁合金'],
    ['aluminum', '鋁合金'],
    ['Steering Wheel', '多功能軚盤'],
    ['steering wheel', '軚盤'],
    ['Windshield', '擋風玻璃'],
    ['windshield', '擋風玻璃'],
    ['Landing Gear', '起落架系統'],
    ['landing gear', '起落架'],
    ['Main Rotor', '主旋翼系統'],
    ['Tail Rotor', '尾槳系統'],
    ['Nuclear Reactor', '核反應堆核心'],
    ['Logic Board', '邏輯底板'],
    ['Motherboard', '系統主機板'],
    ['Afterburner', '後燃器'],
    ['Counterweight', '平衡配重鉈'],
    ['Arc Reactor', '方舟反應爐'],
    ['Endoskeleton', '納米內骨骼'],
    ['Escapement', '擒縱機構'],
    ['Mainspring', '發條動力盒'],
    ['Turbofan', '渦扇引擎'],
    ['Submarine', '深海潛艇'],
    ['Propellers', '推進螺旋槳組'],
    ['Propeller', '推進螺旋槳'],
    ['Suspension', '避震懸掛系統'],
    ['suspension', '避震懸掛'],
    ['Elevators', '水平尾翼升降舵'],
    ['Elevator', '垂直升降機'],
    ['Fuselage', '機身結構'],
    ['fuselage', '機身'],
    ['Cockpit', '駕駛艙'],
    ['Brakes', '高性能迫力系統'],
    ['brakes', '迫力系統'],
    ['Brake', '迫力制動器'],
    ['Wheels', '鍛造車軨'],
    ['Wheel', '車軨'],
    ['Tires', '高性能車胎'],
    ['Tire', '車胎'],
    ['Wings', '主機翼'],
    ['Wing', '機翼'],
    ['Cameras', '光學鏡頭組'],
    ['Camera', '光學鏡頭'],
    ['Sensors', '感應器陣列'],
    ['Sensor', '感應器'],
    ['Hydraulic', '液壓'],
    ['hydraulic', '液壓'],
    ['Pendulum', '精密鐘擺'],
    ['Espresso', '意式濃縮咖啡'],
    ['Boiler', '恆溫壓力鍋爐'],
    ['Siphon', '重力虹吸管'],
    ['Repulsor', '脈衝推進器'],
    ['Helmet', '智能頭盔'],
    ['Chassis', '高剛性底盤'],
    ['Engine', '動力引擎'],
    ['engine', '引擎'],
    ['Motor', '驅動摩打'],
    ['Battery', '儲能電池'],
    ['Display', '高清顯示屏'],
    ['Screen', '熒幕'],
    ['Hull', '耐壓船體外殼'],
    ['Deck', '甲板平台'],
    ['Cabin', '座艙'],
    ['Valve', '控制閥門'],
    ['Pump', '增壓水泵'],
    ['Gear', '精密齒輪組'],
    ['Shaft', '傳動軸'],
    ['Nozzle', '噴嘴'],
    ['Fan', '渦輪風扇'],
    ['Glass', '強化玻璃'],
    ['Frame', '主車架'],
  ],
  es: [
    ['Twin-Turbo V8 Engine', 'Motor V8 Biturbo'],
    ['Twin-Turbo V8 engine', 'motor V8 biturbo'],
    ['Twin-Turbo V8', 'V8 Biturbo'],
    ['Electric Motors', 'Motores Eléctricos'],
    ['Electric Motor', 'Motor Eléctrico'],
    ['Battery Pack', 'Paquete de Baterías'],
    ['battery pack', 'paquete de baterías'],
    ['Solar Panels', 'Paneles Solares'],
    ['Solar Panel', 'Panel Solar'],
    ['Carbon-Fiber', 'Fibra de Carbono'],
    ['carbon-fiber', 'fibra de carbono'],
    ['Stainless Steel', 'Acero Inoxidable'],
    ['Steering Wheel', 'Volante de Control'],
    ['Landing Gear', 'Tren de Aterrizaje'],
    ['Main Rotor', 'Rotor Principal'],
    ['Tail Rotor', 'Rotor de Cola'],
    ['Nuclear Reactor', 'Reactor Nuclear'],
    ['Logic Board', 'Placa Lógica'],
    ['Afterburner', 'Postcombustión'],
    ['Counterweight', 'Contrapeso'],
    ['Arc Reactor', 'Reactor Arc'],
    ['Escapement', 'Escape Mecánico'],
    ['Mainspring', 'Muelle Real'],
    ['Windshield', 'Parabrisas'],
    ['Suspension', 'Suspensión'],
    ['Propellers', 'Hélices'],
    ['Propeller', 'Hélice'],
    ['Elevators', 'Timones de Profundidad'],
    ['Elevator', 'Ascensor'],
    ['Fuselage', 'Fuselaje'],
    ['Cockpit', 'Cabina de Mando'],
    ['Titanium', 'Titanio'],
    ['Aluminum', 'Aluminio'],
    ['Hydraulic', 'Hidráulico'],
    ['Brakes', 'Frenos'],
    ['Wheels', 'Llantas'],
    ['Tires', 'Neumáticos'],
    ['Wings', 'Alas'],
    ['Camera', 'Cámara'],
    ['Sensor', 'Sensor'],
    ['Engine', 'Motor'],
    ['Battery', 'Batería'],
    ['Display', 'Pantalla'],
    ['Chassis', 'Chasis'],
  ],
  fr: [
    ['Twin-Turbo V8 Engine', 'Moteur V8 Biturbo'],
    ['Twin-Turbo V8 engine', 'moteur V8 biturbo'],
    ['Twin-Turbo V8', 'V8 Biturbo'],
    ['Electric Motors', 'Moteurs Électriques'],
    ['Electric Motor', 'Moteur Électrique'],
    ['Battery Pack', 'Pack Batterie'],
    ['battery pack', 'pack batterie'],
    ['Solar Panels', 'Panneaux Solaires'],
    ['Solar Panel', 'Panneau Solaire'],
    ['Carbon-Fiber', 'Fibre de Carbone'],
    ['carbon-fiber', 'fibre de carbone'],
    ['Stainless Steel', 'Acier Inoxydable'],
    ['Steering Wheel', 'Volant de Direction'],
    ['Landing Gear', 'Train d’Atterrissage'],
    ['Main Rotor', 'Rotor Principal'],
    ['Tail Rotor', 'Rotor de Queue'],
    ['Nuclear Reactor', 'Réacteur Nucléaire'],
    ['Logic Board', 'Carte Logique'],
    ['Afterburner', 'Postcombustion'],
    ['Counterweight', 'Contrepoids'],
    ['Arc Reactor', 'Réacteur Arc'],
    ['Escapement', 'Échappement Horloger'],
    ['Mainspring', 'Ressort Moteur'],
    ['Windshield', 'Pare-brise'],
    ['Suspension', 'Suspension'],
    ['Propellers', 'Hélices'],
    ['Propeller', 'Hélice'],
    ['Elevators', 'Gouvernes de Profondeur'],
    ['Elevator', 'Ascenseur'],
    ['Fuselage', 'Fuselage'],
    ['Cockpit', 'Poste de Pilotage'],
    ['Titanium', 'Titane'],
    ['Aluminum', 'Aluminium'],
    ['Hydraulic', 'Hydraulique'],
    ['Brakes', 'Freins'],
    ['Wheels', 'Jantes'],
    ['Tires', 'Pneus'],
    ['Wings', 'Ailes'],
    ['Camera', 'Caméra'],
    ['Engine', 'Moteur'],
    ['Battery', 'Batterie'],
    ['Display', 'Écran'],
    ['Chassis', 'Châssis'],
  ],
  de: [
    ['Twin-Turbo V8 Engine', 'Biturbo-V8-Motor'],
    ['Twin-Turbo V8 engine', 'Biturbo-V8-Motor'],
    ['Twin-Turbo V8', 'Biturbo-V8'],
    ['Electric Motors', 'Elektromotoren'],
    ['Electric Motor', 'Elektromotor'],
    ['Battery Pack', 'Hochvolt-Batteriepaket'],
    ['battery pack', 'Batteriepaket'],
    ['Solar Panels', 'Solarmodule'],
    ['Solar Panel', 'Solarmodul'],
    ['Carbon-Fiber', 'Kohlefaser'],
    ['carbon-fiber', 'Kohlefaser'],
    ['Stainless Steel', 'Edelstahl'],
    ['Steering Wheel', 'Lenkrad'],
    ['Landing Gear', 'Fahrwerk'],
    ['Main Rotor', 'Hauptrotor'],
    ['Tail Rotor', 'Heckrotor'],
    ['Nuclear Reactor', 'Kernreaktor'],
    ['Logic Board', 'Hauptplatine'],
    ['Afterburner', 'Nachbrenner'],
    ['Counterweight', 'Gegengewicht'],
    ['Arc Reactor', 'Arc-Reaktor'],
    ['Escapement', 'Hemmungswerk'],
    ['Mainspring', 'Zugfeder'],
    ['Windshield', 'Windschutzscheibe'],
    ['Suspension', 'Radaufhängung'],
    ['Propellers', 'Propeller'],
    ['Propeller', 'Propeller'],
    ['Elevators', 'Höhenruder'],
    ['Elevator', 'Aufzug'],
    ['Fuselage', 'Flugzeugrumpf'],
    ['Cockpit', 'Cockpit'],
    ['Titanium', 'Titan'],
    ['Aluminum', 'Aluminium'],
    ['Hydraulic', 'Hydraulik'],
    ['Brakes', 'Bremsanlage'],
    ['Wheels', 'Felgen'],
    ['Tires', 'Reifen'],
    ['Wings', 'Tragflächen'],
    ['Camera', 'Kamera'],
    ['Engine', 'Triebwerk'],
    ['Battery', 'Batterie'],
    ['Display', 'Display'],
    ['Chassis', 'Fahrgestell'],
  ],
  pt: [
    ['Twin-Turbo V8 Engine', 'Motor V8 Biturbo'],
    ['Twin-Turbo V8 engine', 'motor V8 biturbo'],
    ['Twin-Turbo V8', 'V8 Biturbo'],
    ['Electric Motors', 'Motores Elétricos'],
    ['Electric Motor', 'Motor Elétrico'],
    ['Battery Pack', 'Pacote de Baterias'],
    ['battery pack', 'pacote de baterias'],
    ['Solar Panels', 'Painéis Solares'],
    ['Solar Panel', 'Painel Solar'],
    ['Carbon-Fiber', 'Fibra de Carbono'],
    ['carbon-fiber', 'fibra de carbono'],
    ['Stainless Steel', 'Aço Inoxidável'],
    ['Steering Wheel', 'Volante'],
    ['Landing Gear', 'Trem de Pouso'],
    ['Main Rotor', 'Rotor Principal'],
    ['Tail Rotor', 'Rotor de Cauda'],
    ['Nuclear Reactor', 'Reator Nuclear'],
    ['Logic Board', 'Placa Lógica'],
    ['Afterburner', 'Pós-Combustor'],
    ['Counterweight', 'Contrapeso'],
    ['Arc Reactor', 'Reator Arc'],
    ['Escapement', 'Escape Mecânico'],
    ['Mainspring', 'Mola Principal'],
    ['Windshield', 'Para-brisa'],
    ['Suspension', 'Suspensão'],
    ['Propellers', 'Hélices'],
    ['Propeller', 'Hélice'],
    ['Elevators', 'Profundores'],
    ['Elevator', 'Elevador'],
    ['Fuselage', 'Fuselagem'],
    ['Cockpit', 'Cabine de Comando'],
    ['Titanium', 'Titânio'],
    ['Aluminum', 'Alumínio'],
    ['Hydraulic', 'Hidráulico'],
    ['Brakes', 'Freios'],
    ['Wheels', 'Rodas'],
    ['Tires', 'Pneus'],
    ['Wings', 'Asas'],
    ['Camera', 'Câmera'],
    ['Engine', 'Motor'],
    ['Battery', 'Bateria'],
    ['Display', 'Tela'],
    ['Chassis', 'Chassi'],
  ],
  it: [
    ['Twin-Turbo V8 Engine', 'Motore V8 Biturbo'],
    ['Twin-Turbo V8 engine', 'motore V8 biturbo'],
    ['Twin-Turbo V8', 'V8 Biturbo'],
    ['Electric Motors', 'Motori Elettrici'],
    ['Electric Motor', 'Motore Elettrico'],
    ['Battery Pack', 'Pacco Batterie'],
    ['battery pack', 'pacco batterie'],
    ['Solar Panels', 'Pannelli Solari'],
    ['Solar Panel', 'Pannello Solare'],
    ['Carbon-Fiber', 'Fibra di Carbonio'],
    ['carbon-fiber', 'fibra di carbonio'],
    ['Stainless Steel', 'Acciaio Inossidabile'],
    ['Steering Wheel', 'Volante'],
    ['Landing Gear', 'Carrello di Atterraggio'],
    ['Main Rotor', 'Rotore Principale'],
    ['Tail Rotor', 'Rotore di Coda'],
    ['Nuclear Reactor', 'Reattore Nucleare'],
    ['Logic Board', 'Scheda Logica'],
    ['Afterburner', 'Postbruciatore'],
    ['Counterweight', 'Contrappeso'],
    ['Arc Reactor', 'Reattore Arc'],
    ['Escapement', 'Scappamento Meccanico'],
    ['Mainspring', 'Molla Motrice'],
    ['Windshield', 'Parabrezza'],
    ['Suspension', 'Sospensioni'],
    ['Propellers', 'Eliche'],
    ['Propeller', 'Elica'],
    ['Elevators', 'Equilibratori di Coda'],
    ['Elevator', 'Ascensore'],
    ['Fuselage', 'Fusoliera'],
    ['Cockpit', 'Abitacolo'],
    ['Titanium', 'Titanio'],
    ['Aluminum', 'Alluminio'],
    ['Hydraulic', 'Idraulico'],
    ['Brakes', 'Freni'],
    ['Wheels', 'Cerchi'],
    ['Tires', 'Pneumatici'],
    ['Wings', 'Ali'],
    ['Camera', 'Fotocamera'],
    ['Engine', 'Motore'],
    ['Battery', 'Batteria'],
    ['Display', 'Schermo'],
    ['Chassis', 'Telaio'],
  ],
  ja: [
    ['Twin-Turbo V8 Engine', 'ツインターボ V8 エンジン'],
    ['Twin-Turbo V8 engine', 'ツインターボ V8 エンジン'],
    ['Twin-Turbo V8', 'ツインターボ V8'],
    ['Electric Motors', '電動モーター群'],
    ['Electric Motor', '電動モーター'],
    ['Battery Pack', '大容量バッテリーパック'],
    ['battery pack', 'バッテリーパック'],
    ['Solar Panels', 'ソーラーパネル・アレイ'],
    ['Solar Panel', 'ソーラーパネル'],
    ['Carbon-Fiber', 'カーボンファイバー'],
    ['carbon-fiber', 'カーボンファイバー'],
    ['Stainless Steel', 'ステンレス鋼'],
    ['Steering Wheel', 'ステアリングホイール'],
    ['Landing Gear', 'ランディングギア（着陸装置）'],
    ['Main Rotor', 'メインローター'],
    ['Tail Rotor', 'テールローター'],
    ['Nuclear Reactor', '原子炉モジュール'],
    ['Logic Board', 'メインロジックボード'],
    ['Afterburner', 'アフターバーナー'],
    ['Counterweight', 'カウンターウェイト（釣合추）'],
    ['Arc Reactor', 'アーク・リアクター'],
    ['Escapement', '脱進機（エスケープメント）'],
    ['Mainspring', 'ゼンマイ香箱'],
    ['Windshield', 'フロントガラス'],
    ['Suspension', 'サスペンション機構'],
    ['Propellers', '推進プロペラ'],
    ['Propeller', 'プロペラ'],
    ['Elevators', '昇降舵（エレベーター）'],
    ['Elevator', 'エレベーター機構'],
    ['Fuselage', '機体胴体（フュージレージ）'],
    ['Cockpit', 'コックピット'],
    ['Titanium', 'チタン合金'],
    ['Aluminum', 'アルミニウム合金'],
    ['Hydraulic', '油圧システム'],
    ['Brakes', 'ブレーキシステム'],
    ['Wheels', 'ホイール'],
    ['Wheel', 'ホイール'],
    ['Tires', 'タイヤ'],
    ['Tire', 'タイヤ'],
    ['Wings', '主翼'],
    ['Wing', 'ウイング'],
    ['Cameras', '光学カメラユニット'],
    ['Camera', 'カメラユニット'],
    ['Sensors', 'センサーアレイ'],
    ['Sensor', 'センサー'],
    ['Engine', 'エンジン'],
    ['engine', 'エンジン'],
    ['Motor', 'モーター'],
    ['Battery', 'バッテリー'],
    ['Display', 'ディスプレイ'],
    ['Chassis', 'シャシーフレーム'],
  ],
  ko: [
    ['Twin-Turbo V8 Engine', '트윈터보 V8 엔진'],
    ['Twin-Turbo V8 engine', '트윈터보 V8 엔진'],
    ['Twin-Turbo V8', '트윈터보 V8'],
    ['Electric Motors', '전기 구동 모터'],
    ['Electric Motor', '전기 모터'],
    ['Battery Pack', '고전압 배터리 팩'],
    ['battery pack', '배터리 팩'],
    ['Solar Panels', '태양광 패널 어레이'],
    ['Solar Panel', '태양광 패널'],
    ['Carbon-Fiber', '카본 파이버'],
    ['carbon-fiber', '탄소섬유'],
    ['Stainless Steel', '스테인리스 스틸'],
    ['Steering Wheel', '스티어링 휠'],
    ['Landing Gear', '랜딩 기어 (착륙장치)'],
    ['Main Rotor', '메인 로터'],
    ['Tail Rotor', '테일 로터'],
    ['Nuclear Reactor', '원자로 모듈'],
    ['Logic Board', '메인 로직 보드'],
    ['Afterburner', '애프터버너'],
    ['Counterweight', '균형추 (카운터웨이트)'],
    ['Arc Reactor', '아크 리액터'],
    ['Escapement', '이스케이프먼트 (탈진기)'],
    ['Mainspring', '메인스프링 태엽'],
    ['Windshield', '윈드실드'],
    ['Suspension', '서스펜션 시스템'],
    ['Propellers', '추진 프로펠러'],
    ['Propeller', '프로펠러'],
    ['Elevators', '승강타 (엘리베이터)'],
    ['Elevator', '엘리베이터 시스템'],
    ['Fuselage', '기체 동체'],
    ['Cockpit', '조종석 (콕핏)'],
    ['Titanium', '티타늄 합금'],
    ['Aluminum', '알루미늄 합금'],
    ['Hydraulic', '유압 시스템'],
    ['Brakes', '브레이크 시스템'],
    ['Wheels', '휠'],
    ['Wheel', '휠'],
    ['Tires', '타이어'],
    ['Tire', '타이어'],
    ['Wings', '주익 (날개)'],
    ['Wing', '윙'],
    ['Cameras', '광학 카메라 모듈'],
    ['Camera', '카메라 모듈'],
    ['Sensors', '센서 어레이'],
    ['Sensor', '센서'],
    ['Engine', '엔진'],
    ['engine', '엔진'],
    ['Motor', '모터'],
    ['Battery', '배터리'],
    ['Display', '디스플레이'],
    ['Chassis', '섀시 프레임'],
  ],
  nl: [
    ['Twin-Turbo V8 Engine', 'Twin-Turbo V8-motor'],
    ['Twin-Turbo V8 engine', 'twin-turbo V8-motor'],
    ['Twin-Turbo V8', 'Twin-Turbo V8'],
    ['Naturally Aspirated V12', 'Atmosferische V12-motor'],
    ['Flat-Six Engine', 'Zescilinder boxermotor'],
    ['Electric Motors', 'Elektromotoren'],
    ['Electric Motor', 'Elektromotor'],
    ['electric motors', 'elektromotoren'],
    ['Battery Pack', 'Hoogspanningsaccupakket'],
    ['battery pack', 'accupakket'],
    ['Solar Panels', 'Zonnepanelenarray'],
    ['Solar Panel', 'Zonnepaneel'],
    ['Carbon-Fiber', 'Koolstofvezel'],
    ['carbon-fiber', 'koolstofvezel'],
    ['Stainless Steel', 'Roestvrij staal'],
    ['stainless-steel', 'roestvrij staal'],
    ['Steering Wheel', 'Stuurwiel'],
    ['steering wheel', 'stuurwiel'],
    ['Landing Gear', 'Landingsgestel'],
    ['landing gear', 'landingsgestel'],
    ['Main Rotor', 'Hoofdrotor'],
    ['Tail Rotor', 'Staartrotor'],
    ['Nuclear Reactor', 'Kernreactor'],
    ['Logic Board', 'Hoofdmoederbord'],
    ['Motherboard', 'Moederbord'],
    ['Afterburner', 'Naverbrander'],
    ['Counterweight', 'Tegenwicht'],
    ['Arc Reactor', 'Arc-reactor'],
    ['Endoskeleton', 'Nano-endoskelet'],
    ['Escapement', 'Echappement (ankergang)'],
    ['Mainspring', 'Hoofdveer'],
    ['Turbofan', 'High-bypass turbofanmotor'],
    ['Submarine', 'Onderzeeboot'],
    ['Propellers', 'Scheepsschroeven'],
    ['Propeller', 'Schroefpropeller'],
    ['Windshield', 'Voorruit'],
    ['Suspension', 'Wielophanging'],
    ['Elevators', 'Hoogteroeren'],
    ['Elevator', 'Liftsysteem'],
    ['Fuselage', 'Vliegtuigromp'],
    ['Cockpit', 'Cockpit'],
    ['Titanium', 'Titaniumlegering'],
    ['Aluminum', 'Aluminiumlegering'],
    ['Hydraulic', 'Hydraulisch systeem'],
    ['Brakes', 'Remsysteem'],
    ['Wheels', 'Velgen & wielen'],
    ['Wheel', 'Wiel'],
    ['Tires', 'Banden'],
    ['Tire', 'Band'],
    ['Wings', 'Hoofdvleugels'],
    ['Wing', 'Vleugel'],
    ['Cameras', 'Optische cameramodules'],
    ['Camera', 'Cameramodule'],
    ['Sensors', 'Sensorarray'],
    ['Sensor', 'Sensor'],
    ['Engine', 'Motor'],
    ['engine', 'motor'],
    ['Motor', 'Aandrijfmotor'],
    ['Battery', 'Accu'],
    ['Display', 'Beeldscherm'],
    ['Screen', 'Scherm'],
    ['Hull', 'Drukromp'],
    ['Chassis', 'Chassisframe'],
  ],
  ar: [
    ['Twin-Turbo V8 Engine', 'محرك V8 مزدوج التيربو'],
    ['Twin-Turbo V8 engine', 'محرك V8 مزدوج التيربو'],
    ['Twin-Turbo V8', 'V8 مزدوج التيربو'],
    ['Electric Motors', 'المحركات الكهربائية'],
    ['Electric Motor', 'المحرك الكهربائي'],
    ['Battery Pack', 'حزمة البطارية عالية الجهد'],
    ['battery pack', 'حزمة البطارية'],
    ['Solar Panels', 'ألواح الطاقة الشمسية'],
    ['Solar Panel', 'لوح الطاقة الشمسية'],
    ['Carbon-Fiber', 'ألياف الكربون'],
    ['carbon-fiber', 'ألياف الكربون'],
    ['Stainless Steel', 'الفولاذ المقاوم للصدأ'],
    ['Steering Wheel', 'عجلة القيادة'],
    ['Landing Gear', 'معدات الهبوط'],
    ['Main Rotor', 'الدوار الرئيسي'],
    ['Tail Rotor', 'دوار الذيل'],
    ['Nuclear Reactor', 'المفاعل النووي'],
    ['Logic Board', 'اللوحة المنطقية الرئيسية'],
    ['Afterburner', 'الحارق اللاحق'],
    ['Counterweight', 'ثقل الموازنة'],
    ['Arc Reactor', 'مفاعل القوس الطاقي'],
    ['Escapement', 'آلية ميزان الساعة'],
    ['Mainspring', 'النابض الرئيسي'],
    ['Windshield', 'الزجاج الأمامي'],
    ['Suspension', 'نظام التعليق'],
    ['Propellers', 'مراوح الدفع'],
    ['Propeller', 'مروحة الدفع'],
    ['Elevators', 'روافع الذيل الأفقية'],
    ['Elevator', 'نظام المصعد'],
    ['Fuselage', 'هيكل الطائرة'],
    ['Cockpit', 'قمرة القيادة'],
    ['Titanium', 'سبائك التيتانيوم'],
    ['Aluminum', 'سبائك الألومنيوم'],
    ['Hydraulic', 'النظام الهيدروليكي'],
    ['Brakes', 'نظام المكابح'],
    ['Wheels', 'العجلات'],
    ['Wheel', 'العجلة'],
    ['Tires', 'الإطارات'],
    ['Tire', 'الإطار'],
    ['Wings', 'الأجنحة الرئيسية'],
    ['Wing', 'الجناح'],
    ['Cameras', 'وحدة الكاميرات البصرية'],
    ['Camera', 'الكاميرا البصرية'],
    ['Sensors', 'مصفوفة المستشعرات'],
    ['Sensor', 'المستشعر'],
    ['Engine', 'المحرك'],
    ['engine', 'المحرك'],
    ['Motor', 'المحرك الكهربائي'],
    ['Battery', 'البطارية'],
    ['Display', 'الشاشة'],
    ['Chassis', 'الشاسيه المعدني'],
  ],
};

// Pre-sort phrase tables longest-first so compound terms always match before single words
const SORTED_PHRASE_TABLES = Object.fromEntries(
  Object.entries(PHRASE_TABLES).map(([lang, pairs]) => [
    lang,
    [...pairs].sort((a, b) => b[0].length - a[0].length),
  ]),
);

function cleanTranslatedToken(str) {
  return String(str || '')
    // Strip accidental English plural 's' attached to CJK/Hangul/Arabic characters
    .replace(/([\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0600-\u06ff])s\b/gi, '$1')
    // Deduplicate adjacent identical words
    .replace(/\b([A-Za-z]{2,})\s+\1\b/gi, '$1')
    .replace(/(发动机|引擎|モーター|エンジン|엔진)\s*(Engine|engine)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function translateTechnicalText(text, lang) {
  if (!text || lang === 'en') return text;
  let out = String(text);
  const rules = SORTED_PHRASE_TABLES[lang];
  if (rules) {
    for (const [srcPhrase, dstPhrase] of rules) {
      if (out.includes(srcPhrase)) {
        out = out.replaceAll(srcPhrase, dstPhrase);
      }
    }
  }
  return cleanTranslatedToken(out);
}

// ============================================================================
// 5. Fluent Native-Language Engineering Description, Fun-Fact & Quiz Synthesizer
//    Ensures that non-English languages (zh-CN, zh-HK, es, fr, de, pt, it, ja, ko, ar)
//    receive 100% coherent, natural target-language sentences preserving all real
//    quantitative specs (RPM, °C, km/h, kW, mm, etc.) so neither UI cards nor
//    Read Aloud TTS ever suffer from mixed-language Macaroni distortion.
// ============================================================================
function extractQuantitativeSpecs(text, lang) {
  if (!text) return [];
  const matches = String(text).match(
    /-?\d[\d,.]*(?:\s*(?:°C|°F|%|km\/h|mph|RPM|rpm|hp|kW|MW|GW|kWh|Wh|GHz|MHz|Hz|mm|cm|m|km|kg|tons?|t|bar|psi|MPa|GPa|L|liters?|gal|V|kV|mAh|nm|μm|dB|TEU|Mach))\b/g,
  );
  if (!matches || !matches.length) return [];
  const uniq = [...new Set(matches.map((m) => m.trim()))].slice(0, 3);
  if (lang === 'zh-CN') {
    return uniq.map((s) =>
      s
        .replace(/\bliters?\b/gi, '升')
        .replace(/\bRPM\b/gi, '转/分')
        .replace(/\bhp\b/gi, '马力')
        .replace(/\btons?\b/gi, '吨')
        .replace(/\bMach\s*/gi, '马赫 '),
    );
  }
  if (lang === 'zh-HK') {
    return uniq.map((s) =>
      s
        .replace(/\bliters?\b/gi, '公升')
        .replace(/\bRPM\b/gi, '轉/分')
        .replace(/\bhp\b/gi, '匹馬力')
        .replace(/\btons?\b/gi, '噸')
        .replace(/\bMach\s*/gi, '馬赫 '),
    );
  }
  if (lang === 'ja') {
    return uniq.map((s) =>
      s
        .replace(/\bliters?\b/gi, 'リットル')
        .replace(/\bRPM\b/gi, '回転/分')
        .replace(/\bhp\b/gi, '馬力')
        .replace(/\btons?\b/gi, 'トン'),
    );
  }
  if (lang === 'ko') {
    return uniq.map((s) =>
      s
        .replace(/\bliters?\b/gi, '리터')
        .replace(/\bhp\b/gi, '마력')
        .replace(/\btons?\b/gi, '톤'),
    );
  }
  if (lang === 'ar') {
    return uniq.map((s) =>
      s
        .replace(/\bliters?\b/gi, 'لتر')
        .replace(/\bhp\b/gi, 'حصان')
        .replace(/\btons?\b/gi, 'طن'),
    );
  }
  return uniq;
}

const GENERIC_CATEGORY_FALLBACK = {
  'zh-CN': '精密工程系统',
  'zh-HK': '精密工程系統',
  es: 'Ingeniería de Precisión',
  fr: 'Ingénierie de Précision',
  de: 'Präzisionstechnik',
  nl: 'Precisietechniek',
  pt: 'Engenharia de Precisão',
  it: 'Ingegneria di Precisione',
  ja: '精密エンジニアリング',
  ko: '정밀 공학 시스템',
  ar: 'هندسة دقيقة متقدمة',
};

// Universal technical codes/acronyms that are pronounced natively across languages
const ALLOWED_TECH_CODES = new Set([
  'V6','V8','V10','V12','W16','F1','GT3','GTB','RS','PHEV','EV','SUV','AWD','RWD','ABS','EPAS','PDK','DRS','ERS',
  'OLED','AMOLED','QLED','QD','LCD','LED','XDR','HDR','SoC','CPU','GPU','NPU','RAM','SSD','NVMe','PCB',
  'USB','HDMI','SDXC','SIM','eSIM','NFC','Qi2','MagSafe','LiDAR','5G','4G','LTE','SOS','GPS',
  'NASA','ESA','JAXA','ISS','STS','SRB','OMS','RCS','APU','FADEC','HUD','ILS','AESA',
  'CFM','LEAP','GE9X','XWB','TAPS','OGV','OGVs','CMC','N1','N2','LOX','CH4','LH2','TEU','LNG',
  'HY','S9G','VPM','ROV','DSV','TBM','EPB','HVAC','PEX','PV','AC','DC','IGBT','SiC','GaN','LFP',
  'kWh','MWh','kW','MW','GW','GHz','MHz','Hz','kHz','RPM','mph','km','mm','cm','nm','kg','psi','bar','MPa','GPa','dB','mAh','Wh'
]);

const WORD_DICTIONARY = {
  'zh-CN': {
    twin: '双', dual: '双联', quad: '四联', triple: '三联', single: '单',
    carbon: '碳纤维', fiber: '纤维', glass: '光学玻璃', steel: '高强钢', stainless: '不锈钢',
    titanium: '钛合金', aluminum: '铝合金', copper: '纯铜', brass: '黄铜', gold: '镀金',
    silver: '银合金', ceramic: '陶瓷', composite: '复合材料', silicon: '硅基', lithium: '锂离子',
    propulsion: '推进', power: '动力', powertrain: '动力总成', structure: '主体结构', structural: '结构',
    sculpted: '流线型', fuel: '燃油', interior: '内饰座舱', exterior: '外观组件', wheels: '轮毂组',
    wheel: '轮毂', tires: '轮胎', tire: '轮胎', flight: '飞行', high: '高压', low: '低压',
    cockpit: '驾驶舱', aero: '气动', aerodynamics: '空气动力学', aerodynamic: '气动',
    controls: '控制系统', control: '控制', gear: '齿轮', gears: '齿轮组', gearbox: '变速齿轮箱',
    rear: '后部', front: '前部', upper: '上部', lower: '下部', main: '主', center: '中央',
    side: '侧向', internal: '内部', external: '外部', outer: '外层', inner: '内层',
    thermal: '热管理', cooling: '冷却', safety: '安全防护', display: '显示屏', screen: '屏幕',
    battery: '电池组', batteries: '电池阵列', energy: '能量', cargo: '货运舱', cabin: '乘员舱',
    deck: '甲板', array: '阵列', hull: '耐压壳体', storage: '存储', system: '系统', systems: '系统',
    engine: '发动机', engines: '发动机组', motor: '驱动电机', motors: '电机组', landing: '起落',
    camera: '摄像模组', cameras: '摄像头阵列', doors: '舱门', door: '舱门', nose: '机鼻整流罩',
    payload: '有效载荷', wireless: '无线通信', chassis: '底盘', frame: '主框架', water: '水循环',
    steering: '转向', passenger: '客舱', seats: '座椅', seat: '座椅', rotor: '转子旋翼',
    rotors: '旋翼组', exhaust: '排气系统', pressure: '耐压', pressurized: '加压', core: '核心',
    roof: '顶部结构', air: '空气', wing: '机翼', wings: '主翼', audio: '声学音响',
    brakes: '制动器', braking: '制动', drive: '传动驱动', crew: '乘员', pack: '模组包',
    heat: '热交换', suspension: '悬架', liquid: '液态', hydraulic: '液压', ring: '环形',
    enclosure: '一体机身外壳', processor: '处理器芯片', arm: '机械臂', bar: '稳定杆', bars: '连杆组',
    windshield: '挡风玻璃', cab: '驾驶室', vertical: '垂直', horizontal: '水平', airframe: '机体结构',
    swept: '后掠式', fan: '涡轮风扇', floor: '底板', active: '主动式', lighting: '照明',
    lights: '灯光组', forged: '锻造', cast: '精密铸造', pump: '增压泵', pumps: '泵组',
    full: '全尺寸', blade: '叶片', blades: '涡轮叶片', acoustic: '声学降噪', windows: '舷窗',
    avionics: '航电系统', bow: '舰艏', stern: '舰艉', keel: '龙骨', rack: '齿条',
    panoramic: '全景', turbine: '涡轮', turbines: '涡轮组', laser: '激光', tail: '尾部',
    tank: '储罐', tanks: '储箱组', board: '主板', orbital: '轨道', speed: '高速',
    clutch: '离合器', double: '双层', track: '轨道履带', tracks: '履带组', charging: '充能',
    case: '壳体', bay: '舱段', super: '超导', ultra: '超精密', axle: '车桥',
    coil: '电磁线圈', coils: '线圈组', armor: '装甲', disc: '圆盘', fuselage: '机身',
    spinning: '高速旋转', fin: '安定面翼片', fins: '栅格翼', dorsal: '背鳍', thrust: '推力',
    dome: '穹顶罩', shaft: '传动轴', shafts: '同心轴', thrusters: '推进器', thruster: '推进器',
    oxygen: '液氧', folding: '折叠式', combustion: '燃烧室', cryogenic: '深冷', input: '输入',
    foundation: '基础底座', mount: '挂架', sway: '防倾', pilot: '飞行员', panel: '面板',
    panels: '面板阵列', edge: '前缘', sensors: '传感器组', sensor: '传感器', forward: '前向',
    aft: '后向', tubes: '发射管路', tube: '管路', steam: '蒸汽', electric: '电动',
    electrical: '电气', optics: '光学镜头', optical: '光学', linear: '线性', spatial: '空间音频',
    crystal: '蓝宝石水晶', lid: '顶盖', solar: '太阳能', grid: '电网', driver: '驱动器',
    tub: '单体壳座舱', saddle: '鞍形', braided: '编织高压', bucket: '桶形赛车', struts: '支柱',
    strut: '液压支柱', roll: '防滚架', hood: '前舱盖', canopy: '座舱盖', body: '车身',
    bodywork: '空气动力车身', torque: '扭矩', stack: '堆叠', valve: '阀门', valves: '阀门组',
    box: '箱体', dial: '表盘', radar: '相控阵雷达', flaps: '襟翼', curved: '曲面',
    supersonic: '超音速', sonar: '声呐系统', hydrodynamic: '流体动力', command: '指挥控制',
    nuclear: '核动力', stability: '稳定控制', fairing: '整流罩', fairings: '整流罩',
    logic: '逻辑', brain: '智能中枢', cell: '电芯', cells: '电芯组', wide: '宽体',
    video: '视频图像', chamber: '腔室', axis: '轴向', barrel: '发条盒', plumbing: '管网',
    touch: '触控', wall: '承重墙', architectural: '建筑结构', iron: '铸铁', pedestal: '底座',
    spacecraft: '航天器', intake: '进气道', inlet: '进气口', bypass: '高涵道', booster: '增压级',
    compressor: '压气机', annular: '环形', nozzle: '喷管', nacelle: '短舱罩', cowling: '整流外罩',
    cowl: '外罩', reverser: '反推装置', vane: '导流叶片', vanes: '导向叶片', spool: '转子轴',
    unibody: '一体成型', keyboard: '背光键盘', trackpad: '触控板', blowers: '离心风扇',
    heatpipes: '导热管', speakers: '扬声器组', woofers: '低音单元', hinge: '转轴铰链',
    antenna: '天线阵列', concrete: '钢筋混凝土', rebar: '钢筋', lumber: '实木框架',
    roofing: '屋面系统', insulation: '保温隔热层', garage: '车库', chimney: '烟囱',
    heater: '加热器', breaker: '断路器配电箱', wiring: '线缆', condenser: '冷凝器',
    ducts: '风道', duct: '导流风道', staircase: '楼梯', kitchen: '厨房', bezel: '窄边框',
    film: '光学薄膜', matrix: '矩阵', backlight: '背光阵列', mainboard: '主控板',
    controller: '控制器', remote: '遥控器', pantograph: '受电弓', bogies: '转向架',
    springs: '弹簧悬挂', traction: '牵引', transformer: '变压器', converters: '变流器',
    couplers: '车钩', rails: '钢轨', truss: '桁架', radiators: '散热器组', radiator: '散热器',
    module: '模块', modules: '模块组', nodes: '节点舱', docking: '对接机构', gimbal: '万向节',
    turbopump: '涡轮泵', injector: '喷注器', regenerative: '再生冷却', bell: '喷管延伸段',
    parachute: '降落伞', heatshield: '隔热大底', gripper: '机械抓手', actuator: '执行器',
    actuators: '伺服执行器', boom: '主动臂', undercarriage: '履带底盘', counterweight: '配重块',
    header: '割台', auger: '螺旋推运器', hopper: '粮仓', jib: '起重臂', trolley: '变幅小车',
    hoist: '起升机构', hook: '吊钩', mast: '主桅杆', swashplate: '倾斜盘', tailboom: '尾梁',
    skids: '滑撬起落架', winch: '救援绞车', propellers: '螺旋桨', brushless: '无刷电机',
    coaxial: '共轴双桨', sapphire: '蓝宝石', chronograph: '计时码表', crown: '表冠',
    hairspring: '游丝', escapement: '擒纵轮', mainspring: '主发条', jewels: '红宝石轴承',
    pendulum: '钟摆', chime: '报时音簧', crankset: '曲柄牙盘', derailleur: '变速器',
    fork: '前叉', handlebars: '车把', swingarm: '后摇臂', monoshock: '中央减震器',
    lifeboats: '救生艇', bulbous: '球鼻艏', stabilizers: '减摇鳍', funnel: '烟囱',
    bridge: '驾驶台', helipad: '直升机停机坪', crankshaft: '曲轴', rudder: '方向舵',
    rudders: '方向舵组', ballast: '压载舱', catapult: '电磁弹射器', hangar: '机库',
    elevator: '升降机', elevators: '升降舵', boilers: '蒸汽锅炉', cistern: '水箱',
    siphon: '虹吸管', bowl: '座便器主体', sheave: '曳引轮', governor: '限速器',
    keyway: '锁孔', pins: '弹子组件', shackle: '锁梁', portafilter: '咖啡手柄',
    boiler: '压力锅炉', kettle: '爆米花加热锅', thermostat: '温控器'
  },
  'zh-HK': {
    twin: '雙', dual: '雙聯', quad: '四聯', triple: '三聯', single: '單',
    carbon: '碳纖維', fiber: '纖維', glass: '光學玻璃', steel: '高強鋼', stainless: '不鏽鋼',
    titanium: '鈦金屬', aluminum: '鋁合金', copper: '純銅', brass: '黃銅', gold: '鍍金',
    silver: '銀合金', ceramic: '陶瓷', composite: '複合材料', silicon: '硅基', lithium: '鋰離子',
    propulsion: '推進', power: '動力', powertrain: '動力系統', structure: '主體結構', structural: '結構',
    sculpted: '流線型', fuel: '燃油', interior: '車廂內籠', exterior: '外殼組件', wheels: '車軨組',
    wheel: '車軨', tires: '車胎', tire: '車胎', flight: '飛行', high: '高壓', low: '低壓',
    cockpit: '駕駛艙', aero: '氣動', aerodynamics: '空氣動力學', aerodynamic: '氣動',
    controls: '控制系統', control: '控制', gear: '齒輪', gears: '齒輪組', gearbox: '波箱',
    rear: '後部', front: '前部', upper: '上部', lower: '下部', main: '主', center: '中央',
    side: '側向', internal: '內部', external: '外部', outer: '外層', inner: '內層',
    thermal: '散熱管理', cooling: '冷卻', safety: '安全防護', display: '顯示屏', screen: '熒幕',
    battery: '電池組', batteries: '電池陣列', energy: '能量', cargo: '貨艙', cabin: '客艙',
    deck: '甲板', array: '陣列', hull: '耐壓船殼', storage: '儲存', system: '系統', systems: '系統',
    engine: '引擎', engines: '引擎組', motor: '摩打', motors: '摩打組', landing: '起落',
    camera: '鏡頭模組', cameras: '鏡頭陣列', doors: '艙門', door: '艙門', nose: '機鼻整流罩',
    payload: '有效載荷', wireless: '無線通訊', chassis: '底盤', frame: '主車架', water: '水循環',
    steering: '轉向軚盤', passenger: '客艙', seats: '座椅', seat: '座椅', rotor: '轉子旋翼',
    rotors: '旋翼組', exhaust: '死氣喉排氣', pressure: '耐壓', pressurized: '加壓', core: '核心',
    roof: '車頂結構', air: '空氣', wing: '機翼', wings: '主機翼', audio: '音響系統',
    brakes: '迫力制動', braking: '制動', drive: '傳動驅動', crew: '乘員', pack: '電池包',
    heat: '熱交換', suspension: '避震懸掛', liquid: '液態', hydraulic: '液壓', ring: '環形',
    enclosure: '一體機身外殼', processor: '處理器晶片', arm: '機械臂', bar: '防傾桿',
    windshield: '擋風玻璃', cab: '駕駛室', vertical: '垂直', horizontal: '水平', airframe: '機體結構',
    swept: '後掠式', fan: '渦輪風扇', floor: '底板', active: '主動式', lighting: '照明燈組',
    forged: '鍛造', cast: '精密鑄造', pump: '增壓泵', pumps: '水泵組', blade: '葉片',
    blades: '渦輪葉片', acoustic: '隔音降噪', windows: '舷窗', avionics: '航電系統',
    bow: '船頭', stern: '船尾', keel: '龍骨', panoramic: '全景', turbine: '渦輪',
    laser: '激光', tail: '尾部', tank: '油缸', tanks: '油缸組', board: '主機板',
    orbital: '軌道', speed: '高速', clutch: '極力子離合器', track: '路軌履帶',
    charging: '充電', case: '外殼', bay: '艙段', axle: '車軸', coil: '電磁線圈',
    armor: '裝甲', disc: '迫力碟', fuselage: '機身', fin: '尾翼', thrust: '推力',
    dome: '圓頂罩', shaft: '傳動軸', thrusters: '推進器', oxygen: '液氧', folding: '摺疊式',
    combustion: '燃燒室', cryogenic: '深冷', foundation: '地基底座', mount: '掛架',
    pilot: '機師', panel: '面板', panels: '面板陣列', sensors: '感應器組', sensor: '感應器',
    tubes: '發射管', steam: '蒸汽', electric: '電動', optics: '光學鏡頭', solar: '太陽能',
    tub: '單體殼座艙', radiator: '水箱散熱器', radiators: '散熱器組', module: '模組',
    docking: '對接機構', gimbal: '萬向節', turbopump: '渦輪泵', parachute: '降落傘',
    actuator: '伺服執行器', boom: '起重吊臂', counterweight: '平衡配重', mast: '主桅杆',
    propellers: '螺旋槳', sapphire: '藍寶石', chronograph: '計時碼錶', escapement: '擒縱機構',
    pendulum: '鐘擺', derailleur: '波腳變速器', handlebars: '車把', rudder: '方向舵',
    ballast: '壓載水艙', elevator: '升降機', elevators: '升降舵', siphon: '虹吸管',
    boiler: '壓力鍋爐'
  },
  es: {
    twin: 'Doble', dual: 'Doble', quad: 'Cuádruple', triple: 'Triple', single: 'Simple',
    carbon: 'Carbono', fiber: 'Fibra', glass: 'Vidrio Óptico', steel: 'Acero', stainless: 'Inoxidable',
    titanium: 'Titanio', aluminum: 'Aluminio', copper: 'Cobre', brass: 'Latón', gold: 'Oro',
    silver: 'Plata', ceramic: 'Cerámica', composite: 'Compuesto', silicon: 'Silicio', lithium: 'Litio',
    propulsion: 'Propulsión', power: 'Potencia', powertrain: 'Tren Motriz', structure: 'Estructura',
    structural: 'Estructural', sculpted: 'Esculpido', fuel: 'Combustible', interior: 'Interior',
    exterior: 'Exterior', wheels: 'Ruedas', wheel: 'Rueda', tires: 'Neumáticos', tire: 'Neumático',
    flight: 'Vuelo', high: 'Alta', low: 'Baja', cockpit: 'Cabina de Mando', aero: 'Aerodinámico',
    aerodynamics: 'Aerodinámica', controls: 'Controles', control: 'Control', gear: 'Engranaje',
    gears: 'Engranajes', gearbox: 'Caja de Cambios', rear: 'Trasero', front: 'Frontal',
    upper: 'Superior', lower: 'Inferior', main: 'Principal', center: 'Central', side: 'Lateral',
    internal: 'Interno', external: 'Externo', outer: 'Exterior', inner: 'Interior',
    thermal: 'Térmico', cooling: 'Refrigeración', safety: 'Seguridad', display: 'Pantalla',
    screen: 'Pantalla', battery: 'Batería', batteries: 'Baterías', energy: 'Energía',
    cargo: 'Carga', cabin: 'Cabina', deck: 'Cubierta', array: 'Matriz', hull: 'Casco',
    storage: 'Almacenamiento', system: 'Sistema', systems: 'Sistemas', engine: 'Motor',
    engines: 'Motores', motor: 'Motor', motors: 'Motores', landing: 'Aterrizaje',
    camera: 'Cámara', cameras: 'Cámaras', doors: 'Puertas', door: 'Puerta', nose: 'Morro',
    payload: 'Carga Útil', wireless: 'Inalámbrico', chassis: 'Chasis', frame: 'Bastidor',
    water: 'Agua', steering: 'Dirección', passenger: 'Pasajeros', seats: 'Asientos',
    seat: 'Asiento', rotor: 'Rotor', rotors: 'Rotores', exhaust: 'Escape', pressure: 'Presión',
    pressurized: 'Presurizado', core: 'Núcleo', roof: 'Techo', air: 'Aire', wing: 'Ala',
    wings: 'Alas', audio: 'Audio', brakes: 'Frenos', braking: 'Frenado', drive: 'Tracción',
    crew: 'Tripulación', pack: 'Paquete', heat: 'Calor', suspension: 'Suspensión',
    liquid: 'Líquido', hydraulic: 'Hidráulico', ring: 'Anillo', enclosure: 'Carcasa',
    processor: 'Procesador', arm: 'Brazo', bar: 'Barra', bars: 'Barras', windshield: 'Parabrisas',
    cab: 'Cabina', vertical: 'Vertical', horizontal: 'Horizontal', airframe: 'Célula Aeronáutica',
    swept: 'En Flecha', fan: 'Ventilador', floor: 'Suelo', active: 'Activo', lighting: 'Iluminación',
    lights: 'Luces', forged: 'Forjado', cast: 'Fundido', pump: 'Bomba', pumps: 'Bombas',
    full: 'Completo', blade: 'Álabes', blades: 'Álabes', acoustic: 'Acústico', windows: 'Ventanas',
    avionics: 'Aviónica', bow: 'Proa', stern: 'Popa', keel: 'Quilla', rack: 'Cremallera',
    panoramic: 'Panorámico', turbine: 'Turbina', turbines: 'Turbinas', laser: 'Láser',
    tail: 'Cola', tank: 'Tanque', tanks: 'Tanques', board: 'Placa', orbital: 'Orbital',
    speed: 'Velocidad', clutch: 'Embrague', double: 'Doble', track: 'Oruga', tracks: 'Vías',
    charging: 'Carga', case: 'Caja', bay: 'Bahía', super: 'Súper', axle: 'Eje',
    coil: 'Bobina', coils: 'Bobinas', armor: 'Blindaje', disc: 'Disco', fuselage: 'Fuselaje',
    spinning: 'Giratorio', fin: 'Estabilizador', fins: 'Aletas', dorsal: 'Dorsal', thrust: 'Empuje',
    dome: 'Domo', shaft: 'Eje de Transmisión', shafts: 'Ejes', thrusters: 'Propulsores',
    thruster: 'Propulsor', oxygen: 'Oxígeno', folding: 'Plegable', combustion: 'Combustión',
    cryogenic: 'Criogénico', input: 'Entrada', foundation: 'Cimentación', mount: 'Soporte',
    sway: 'Estabilizadora', pilot: 'Piloto', panel: 'Panel', panels: 'Paneles', edge: 'Borde',
    sensors: 'Sensores', sensor: 'Sensor', forward: 'Delantero', aft: 'Popa', tubes: 'Tubos',
    tube: 'Tubo', steam: 'Vapor', electric: 'Eléctrico', electrical: 'Eléctrica', optics: 'Óptica',
    optical: 'Óptico', linear: 'Lineal', spatial: 'Espacial', crystal: 'Cristal', lid: 'Tapa',
    solar: 'Solar', grid: 'Red', driver: 'Conductor', tub: 'Monocasco', saddle: 'Montura',
    braided: 'Trenzado', bucket: 'Deportivo', struts: 'Puntales', strut: 'Amortiguador',
    roll: 'Antivuelco', hood: 'Capó', canopy: 'Cúpula', body: 'Carrocería', bodywork: 'Carrocería',
    torque: 'Par Motor', stack: 'Pila', valve: 'Válvula', valves: 'Válvulas', box: 'Caja',
    dial: 'Esfera', radar: 'Radar', flaps: 'Flaps', curved: 'Curvo', supersonic: 'Supersónico',
    sonar: 'Sonar', hydrodynamic: 'Hidrodinámico', command: 'Comando', nuclear: 'Nuclear',
    stability: 'Estabilidad', fairing: 'Carenado', fairings: 'Carenados', logic: 'Lógica',
    brain: 'Cerebro', cell: 'Celda', cells: 'Celdas', wide: 'Ancho', video: 'Vídeo',
    chamber: 'Cámara', axis: 'Ejes', barrel: 'Tambor', plumbing: 'Fontanería', touch: 'Táctil',
    wall: 'Muro', architectural: 'Arquitectónico', iron: 'Hierro', pedestal: 'Pedestal',
    spacecraft: 'Nave Espacial', intake: 'Admisión', inlet: 'Entrada', bypass: 'Derivación',
    booster: 'Impulsor', compressor: 'Compresor', annular: 'Anular', nozzle: 'Tobera',
    nacelle: 'Góndola', cowling: 'Cubierta', reverser: 'Inversor de Empuje', vane: 'Álabes Guía',
    vanes: 'Álabes', unibody: 'Monocasco', keyboard: 'Teclado', trackpad: 'Panel Táctil',
    blowers: 'Ventiladores', heatpipes: 'Tubos Térmicos', speakers: 'Altavoces',
    woofers: 'Subwoofers', hinge: 'Bisagra', antenna: 'Antena', concrete: 'Hormigón Armado',
    rebar: 'Acero de Refuerzo', lumber: 'Madera Estructural', roofing: 'Techumbre',
    insulation: 'Aislamiento', garage: 'Garaje', chimney: 'Chimenea', heater: 'Calentador',
    breaker: 'Panel Eléctrico', wiring: 'Cableado', condenser: 'Condensador', ducts: 'Conductos',
    duct: 'Conducto', staircase: 'Escalera', kitchen: 'Cocina', bezel: 'Bisel', film: 'Película',
    matrix: 'Matriz', backlight: 'Retroiluminación', mainboard: 'Placa Base',
    controller: 'Controlador', remote: 'Control Remoto', pantograph: 'Pantógrafo',
    bogies: 'Bogies', springs: 'Resortes', traction: 'Tracción', transformer: 'Transformador',
    converters: 'Convertidores', couplers: 'Acopladores', rails: 'Rieles', truss: 'Celosía',
    radiators: 'Radiadores', radiator: 'Radiador', module: 'Módulo', modules: 'Módulos',
    nodes: 'Nodos', docking: 'Acoplamiento', gimbal: 'Cardán', turbopump: 'Turbobomba',
    injector: 'Inyector', regenerative: 'Regenerativo', parachute: 'Paracaídas',
    heatshield: 'Escudo Térmico', gripper: 'Pinza Robótica', actuator: 'Actuador',
    actuators: 'Actuadores', boom: 'Pluma Principal', undercarriage: 'Tren de Rodaje',
    counterweight: 'Contrapeso', header: 'Cabezal', auger: 'Sinfín', hopper: 'Tolva',
    jib: 'Pluma', trolley: 'Carro', hoist: 'Polipasto', hook: 'Gancho', mast: 'Mástil',
    swashplate: 'Plato Cíclico', tailboom: 'Botalón de Cola', skids: 'Patines',
    winch: 'Cabrestante', propellers: 'Hélices', brushless: 'Sin Escobillas',
    coaxial: 'Coaxial', sapphire: 'Zafiro', chronograph: 'Cronógrafo', crown: 'Corona',
    hairspring: 'Espiral', escapement: 'Escape', mainspring: 'Muelle Real', jewels: 'Rubíes',
    pendulum: 'Péndulo', chime: 'Carrillón', crankset: 'Bielas', derailleur: 'Cambio',
    fork: 'Horquilla', handlebars: 'Manillar', swingarm: 'Basculante',
    monoshock: 'Monoamortiguador', lifeboats: 'Botes Salvavidas', bulbous: 'Bulbo de Proa',
    stabilizers: 'Estabilizadores', funnel: 'Chimenea Naval', bridge: 'Puente de Mando',
    helipad: 'Helipuerto', crankshaft: 'Cigüeñal', rudder: 'Timón', rudders: 'Timones',
    ballast: 'Lastre', catapult: 'Catapulta', hangar: 'Hangar', elevator: 'Ascensor',
    elevators: 'Elevadores', boilers: 'Calderas', cistern: 'Cisterna', siphon: 'Sifón',
    bowl: 'Taza Cerámica', sheave: 'Polea Motriz', governor: 'Limitador', keyway: 'Bocallave',
    pins: 'Pernos', shackle: 'Arco de Cierre', portafilter: 'Portafiltro', boiler: 'Caldera',
    kettle: 'Olla Térmica', thermostat: 'Termostato', strakes: 'Deflectores',
    diffuser: 'Difusor', injection: 'Inyección', direct: 'Directa', headers: 'Colectores',
    transaxle: 'Transeje', helical: 'Helicoidales', hoses: 'Mangueras', coolant: 'Refrigerante',
    shocks: 'Amortiguadores', leather: 'Cuero', racing: 'Competición', grilles: 'Parrillas',
    buttresses: 'Arbotantes', louvered: 'Ranurado', lug: 'Tuercas', nuts: 'Fijación',
    lofted: 'Aerodinámico', boarding: 'Embarque', pane: 'Paneles', hinged: 'Abatible',
    weather: 'Meteorológico', galleys: 'Cocinas de Bordo', overhead: 'Superiores',
    bins: 'Compartimentos', supercritical: 'Supercríticas', spars: 'Largueros',
    winglets: 'Aletas de Punta', strobe: 'Estroboscópicas', integral: 'Integrales',
    bladder: 'Celdas de Combustible', boost: 'Impulsión', chevrons: 'Chevrons Acústicos',
    slotted: 'Ranurados', slats: 'Slats de Borde', spoilers: 'Deflectores',
    fillet: 'Empalme Dorsal', tailcone: 'Cono de Cola', retractable: 'Retráctil',
    belly: 'Inferior', baggage: 'Equipaje', hold: 'Bodega', roller: 'Rodillos',
    teardrop: 'Hidrodinámico', anechoic: 'Anecoicas', tiles: 'Placas', escape: 'Escape',
    trunks: 'Escotillas', fouling: 'Antiincrustante', stiffeners: 'Anillos de Refuerzo',
    flood: 'Inundación', grates: 'Rejillas', translucent: 'Translúcido',
    hydrophone: 'Hidrófono', sphere: 'Esfera', torpedo: 'Torpedos', launch: 'Lanzamiento',
    hatches: 'Compuertas', sail: 'Vela', planes: 'Planos de Inmersión',
    telescoping: 'Telescópicos', photonics: 'Fotónicos', masts: 'Mástiles',
    room: 'Sala', consoles: 'Consolas', quarters: 'Camarotes', vessel: 'Vasija',
    loops: 'Circuitos', reduction: 'Reductora', cruciform: 'Cruciforme',
    diving: 'Inmersión', towed: 'Remolcado', shrouded: 'Carenado', ducted: 'Entubado',
    propulsor: 'Propulsor', stators: 'Estatores', band: 'Banda', button: 'Botón',
    action: 'Acción', stacked: 'Apilada', chip: 'Chip', shaped: 'En L', cased: 'Encapsulada',
    induction: 'Inducción', magnet: 'Imán', telephoto: 'Teleobjetivo', infrared: 'Infrarrojo',
    projector: 'Proyector', selfie: 'Frontal', haptic: 'Háptico', stereo: 'Estéreo',
    phased: 'En Fase', emergency: 'Emergencia', satellite: 'Satelital'
  }
};

function translateWordsWithDict(text, lang) {
  const dict = WORD_DICTIONARY[lang];
  if (!dict || !text) return text;
  return String(text).replace(/[A-Za-z]{3,}/g, (word) => {
    if (ALLOWED_TECH_CODES.has(word) || ALLOWED_TECH_CODES.has(word.toUpperCase())) {
      return word;
    }
    const lower = word.toLowerCase();
    if (dict[lower]) return dict[lower];
    // Try singular if plural 's'
    if (lower.endsWith('s') && dict[lower.slice(0, -1)]) {
      return dict[lower.slice(0, -1)];
    }
    return word;
  });
}

function sanitizeResidualEnglish(text, lang, fallbackLabel) {
  if (!text || lang === 'en') return text;
  // Remove "CAD" filler token in non-English labels
  let s = String(text).replace(/\bCAD\b/g, '').replace(/\s+/g, ' ').trim();
  const isNonLatin = lang === 'zh-CN' || lang === 'zh-HK' || lang === 'ja' || lang === 'ko' || lang === 'ar';
  if (isNonLatin) {
    // Strip any remaining common English words not in ALLOWED_TECH_CODES so CJK/Arabic TTS never pronounces English words
    s = s.replace(/\b[A-Za-z]{2,}\b/g, (word) => {
      if (ALLOWED_TECH_CODES.has(word) || ALLOWED_TECH_CODES.has(word.toUpperCase())) {
        return word;
      }
      return '';
    });
    // Clean up orphaned punctuation/spaces after stripping English words
    const sep = lang === 'ar' ? '، ' : ' · ';
    s = s
      .replace(/[,/|+&]+/g, ' ')
      .replace(/\(\s*\)/g, '')
      .replace(/\s+-\s+/g, ' ')
      .replace(/(^|\s)-+|(-+)(\s|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Ensure there is substantive native script in the label
    const hasNativeChars = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0600-\u06ff]/.test(s);
    if (!hasNativeChars || s.length < 2) {
      return s ? `${fallbackLabel} (${s})` : fallbackLabel;
    }
    return s;
  }
  // For European languages (es, fr, de, pt, it), strip any remaining unmapped English words not in Spanish/Romance/Germanic
  if (lang === 'es') {
    s = s
      .replace(/\b(with|and|the|for|from)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return s || fallbackLabel;
}

export function tPartCategory(catName) {
  if (!catName || currentLang === 'en') return catName || '';
  const direct = PART_CATEGORY_I18N[catName]?.[currentLang];
  if (direct) return direct;
  let translated = translateTechnicalText(catName, currentLang);
  translated = translateWordsWithDict(translated, currentLang);
  const fallback = GENERIC_CATEGORY_FALLBACK[currentLang] || catName;
  return sanitizeResidualEnglish(translated, currentLang, fallback);
}

function localizePartName(rawName, rawCat, lang) {
  if (!rawName || lang === 'en') return rawName || '';
  let translated = translateTechnicalText(rawName, lang);
  translated = translateWordsWithDict(translated, lang);
  // Clean remaining common English connector words in part names so non-English TTS reads cleanly
  const connectors = {
    'zh-CN': [
      [/\bFront\b/gi, '前部'],
      [/\bRear\b/gi, '后部'],
      [/\bUpper\b/gi, '上部'],
      [/\bLower\b/gi, '下部'],
      [/\bMain\b/gi, '主'],
      [/\bActive\b/gi, '主动式'],
      [/\bDual\b/gi, '双联'],
      [/\bQuad\b/gi, '四联'],
      [/\bHigh-Voltage\b/gi, '高压'],
      [/\bCryogenic\b/gi, '深冷液态'],
      [/\bSuperconducting\b/gi, '超导'],
      [/\bPanoramic\b/gi, '全景'],
      [/\bStructural\b/gi, '结构'],
      [/\bSystem\b/gi, '系统'],
      [/\bAssembly\b/gi, '总成'],
      [/\bModule\b/gi, '模组'],
      [/\bArray\b/gi, '阵列'],
      [/\bUnit\b/gi, '单元'],
      [/\s*&\s*/g, '与'],
    ],
    'zh-HK': [
      [/\bFront\b/gi, '前部'],
      [/\bRear\b/gi, '後部'],
      [/\bUpper\b/gi, '上部'],
      [/\bLower\b/gi, '下部'],
      [/\bMain\b/gi, '主'],
      [/\bActive\b/gi, '主動式'],
      [/\bDual\b/gi, '雙聯'],
      [/\bQuad\b/gi, '四聯'],
      [/\bHigh-Voltage\b/gi, '高壓'],
      [/\bCryogenic\b/gi, '深冷液態'],
      [/\bSuperconducting\b/gi, '超導'],
      [/\bPanoramic\b/gi, '全景'],
      [/\bSystem\b/gi, '系統'],
      [/\bAssembly\b/gi, '總成'],
      [/\bModule\b/gi, '模組'],
      [/\bArray\b/gi, '陣列'],
      [/\bUnit\b/gi, '單元'],
      [/\s*&\s*/g, '同'],
    ],
    es: [
      [/\bFront\b/gi, 'Frontal'],
      [/\bRear\b/gi, 'Trasero'],
      [/\bUpper\b/gi, 'Superior'],
      [/\bLower\b/gi, 'Inferior'],
      [/\bMain\b/gi, 'Principal'],
      [/\bSystem\b/gi, 'Sistema'],
      [/\bAssembly\b/gi, 'Conjunto'],
      [/\bModule\b/gi, 'Módulo'],
      [/\s*&\s*/g, ' y '],
    ],
    fr: [
      [/\bFront\b/gi, 'Avant'],
      [/\bRear\b/gi, 'Arrière'],
      [/\bUpper\b/gi, 'Supérieur'],
      [/\bLower\b/gi, 'Inférieur'],
      [/\bMain\b/gi, 'Principal'],
      [/\bSystem\b/gi, 'Système'],
      [/\bAssembly\b/gi, 'Ensemble'],
      [/\bModule\b/gi, 'Module'],
      [/\s*&\s*/g, ' et '],
    ],
    de: [
      [/\bFront\b/gi, 'Front-'],
      [/\bRear\b/gi, 'Heck-'],
      [/\bUpper\b/gi, 'Ober-'],
      [/\bLower\b/gi, 'Unter-'],
      [/\bMain\b/gi, 'Haupt-'],
      [/\bSystem\b/gi, 'System'],
      [/\bAssembly\b/gi, 'Baugruppe'],
      [/\bModule\b/gi, 'Modul'],
      [/\s*&\s*/g, ' & '],
    ],
    nl: [
      [/\bFront\b/gi, 'Voorste'],
      [/\bRear\b/gi, 'Achterste'],
      [/\bUpper\b/gi, 'Bovenste'],
      [/\bLower\b/gi, 'Onderste'],
      [/\bMain\b/gi, 'Hoofd-'],
      [/\bSystem\b/gi, 'Systeem'],
      [/\bAssembly\b/gi, 'Eenheid'],
      [/\bModule\b/gi, 'Module'],
      [/\s*&\s*/g, ' & '],
    ],
    pt: [
      [/\bFront\b/gi, 'Dianteiro'],
      [/\bRear\b/gi, 'Traseiro'],
      [/\bUpper\b/gi, 'Superior'],
      [/\bLower\b/gi, 'Inferior'],
      [/\bMain\b/gi, 'Principal'],
      [/\bSystem\b/gi, 'Sistema'],
      [/\bAssembly\b/gi, 'Conjunto'],
      [/\bModule\b/gi, 'Módulo'],
      [/\s*&\s*/g, ' e '],
    ],
    it: [
      [/\bFront\b/gi, 'Anteriore'],
      [/\bRear\b/gi, 'Posteriore'],
      [/\bUpper\b/gi, 'Superiore'],
      [/\bLower\b/gi, 'Inferiore'],
      [/\bMain\b/gi, 'Principale'],
      [/\bSystem\b/gi, 'Sistema'],
      [/\bAssembly\b/gi, 'Gruppo'],
      [/\bModule\b/gi, 'Modulo'],
      [/\s*&\s*/g, ' e '],
    ],
    ja: [
      [/\bFront\b/gi, 'フロント'],
      [/\bRear\b/gi, 'リア'],
      [/\bUpper\b/gi, 'アッパー'],
      [/\bLower\b/gi, 'ロワー'],
      [/\bMain\b/gi, 'メイン'],
      [/\bActive\b/gi, 'アクティブ'],
      [/\bDual\b/gi, 'デュアル'],
      [/\bSystem\b/gi, 'システム'],
      [/\bAssembly\b/gi, 'アセンブリ'],
      [/\bModule\b/gi, 'モジュール'],
      [/\bArray\b/gi, 'アレイ'],
      [/\bUnit\b/gi, 'ユニット'],
      [/\s*&\s*/g, '＆'],
    ],
    ko: [
      [/\bFront\b/gi, '프론트'],
      [/\bRear\b/gi, '리어'],
      [/\bUpper\b/gi, '어퍼'],
      [/\bLower\b/gi, '로어'],
      [/\bMain\b/gi, '메인'],
      [/\bActive\b/gi, '액티브'],
      [/\bDual\b/gi, '듀얼'],
      [/\bSystem\b/gi, '시스템'],
      [/\bAssembly\b/gi, '어셈블리'],
      [/\bModule\b/gi, '모듈'],
      [/\bArray\b/gi, '어레이'],
      [/\bUnit\b/gi, '유닛'],
      [/\s*&\s*/g, ' 및 '],
    ],
    ar: [
      [/\bFront\b/gi, 'أمامي'],
      [/\bRear\b/gi, 'خلفي'],
      [/\bUpper\b/gi, 'علوي'],
      [/\bLower\b/gi, 'سفلي'],
      [/\bMain\b/gi, 'رئيسي'],
      [/\bActive\b/gi, 'نشط'],
      [/\bDual\b/gi, 'مزدوج'],
      [/\bSystem\b/gi, 'نظام'],
      [/\bAssembly\b/gi, 'مجموعة'],
      [/\bModule\b/gi, 'وحدة'],
      [/\bArray\b/gi, 'مصفوفة'],
      [/\bUnit\b/gi, 'وحدة'],
      [/\s*&\s*/g, ' و'],
    ],
  };
  for (const [re, rep] of connectors[lang] || []) {
    translated = translated.replace(re, rep);
  }
  translated = cleanTranslatedToken(translated);
  const catLabel = tPartCategory(rawCat) || GENERIC_CATEGORY_FALLBACK[lang];
  return sanitizeResidualEnglish(translated, lang, catLabel);
}

function buildFluentPartDesc(part, locName, locCat, lang) {
  const specs = extractQuantitativeSpecs(part.desc, lang);
  const specClause = specs.length ? specs.join(' / ') : '';

  switch (lang) {
    case 'zh-CN':
      return specClause
        ? `该核心部件属于${locCat}系统（关键工程参数：${specClause}），各精密单元协同工作，确保整机在高负载下稳定高效运转。`
        : `该核心部件属于${locCat}系统，通过高强度精密结构设计，保障核心系统高效稳定运行。`;
    case 'zh-HK':
      return specClause
        ? `呢個核心部件屬於${locCat}系統（關鍵工程參數：${specClause}），各精密組件協同運作，確保系統喺高負載下穩定高效運行。`
        : `呢個核心部件屬於${locCat}系統，透過精密結構設計，保障核心系統高效穩定運作。`;
    case 'es':
      return specClause
        ? `Este componente esencial del sistema de ${locCat} (especificaciones clave: ${specClause}) está diseñado con ingeniería de alta precisión para garantizar el máximo rendimiento y fiabilidad.`
        : `Este componente forma parte fundamental del sistema de ${locCat}, diseñado con ingeniería de precisión para garantizar un funcionamiento seguro y eficiente.`;
    case 'fr':
      return specClause
        ? `Cet élément clé du système ${locCat} (paramètres techniques : ${specClause}) est conçu avec une ingénierie de haute précision pour assurer des performances optimales.`
        : `Ce composant fait partie intégrante du module ${locCat}, assurant une fiabilité structurelle et un rendement énergétique de haut niveau.`;
    case 'de':
      return specClause
        ? `Diese zentrale Baugruppe im Bereich ${locCat} (technische Eckdaten: ${specClause}) sorgt durch hochpräzise Konstruktion für maximale Leistung und Betriebssicherheit.`
        : `Dieses Konstruktionselement des Systems ${locCat} gewährleistet höchste Stabilität und Effizienz im Betrieb.`;
    case 'nl':
      return specClause
        ? `Dit essentiële onderdeel binnen het systeem ${locCat} (technische kernwaarden: ${specClause}) is met hoge precisie ontworpen voor maximale prestaties en betrouwbaarheid.`
        : `Dit onderdeel vormt een belangrijk bouwblok van het systeem ${locCat} en zorgt voor een veilige, stabiele en efficiënte werking.`;
    case 'pt':
      return specClause
        ? `Este componente essencial de ${locCat} (especificações técnicas: ${specClause}) foi projetado com engenharia de alta precisão para máxima eficiência e durabilidade.`
        : `Este componente integra o módulo de ${locCat}, garantindo alto desempenho estrutural e operação segura em todas as condições.`;
    case 'it':
      return specClause
        ? `Questo componente fondamentale del sistema ${locCat} (parametri tecnici: ${specClause}) è progettato con ingegneria di precisione per garantire massime prestazioni e affidabilità.`
        : `Questo elemento fa parte del gruppo ${locCat} e assicura efficienza strutturale e funzionamento ottimale dell'intero sistema.`;
    case 'ja':
      return specClause
        ? `この精密コンポーネントは${locCat}の中核を担い（主要スペック：${specClause}）、高負荷環境でも優れた性能と信頼性を発揮します。`
        : `この重要パーツは${locCat}を構成し、高度なエンジニアリング設計によりシステム全体の安定稼働を支えています。`;
    case 'ko':
      return specClause
        ? `이 핵심 부품은 ${locCat} 시스템의 중심 모듈(주요 제원: ${specClause})로, 정밀 엔지니어링 설계를 통해 최고의 성능과 내구성을 발휘합니다.`
        : `이 핵심 구성 요소는 ${locCat} 분야의 정밀한 설계를 통해 시스템 전체의 안정적인 작동을 보장합니다.`;
    case 'ar':
      return specClause
        ? `يُعد هذا العنصر مكونًا رئيسيًا ضمن منظومة ${locCat} (المواصفات الهندسية: ${specClause})، وقد صُمم بدقة عالية لضمان أعلى مستويات الأداء والكفاءة.`
        : `يمثل هذا العنصر جزءًا أساسيًا من منظومة ${locCat}، ويعمل بتكامل هندسي دقيق لضمان التشغيل الآمن والفعال.`;
    default:
      return part.desc || '';
  }
}

function buildFluentPartFunFact(part, locName, locCat, lang) {
  const specs = extractQuantitativeSpecs(part.funFact || part.desc, lang);
  const specClause = specs.length ? specs.join(' / ') : '';

  switch (lang) {
    case 'zh-CN':
      return specClause
        ? `工程师在设计该模块时采用了严苛的极限标准，其工作指标可达 ${specClause}！`
        : `在 3D 剖视模式下，你可以清晰观察该部件如何与周围的${locCat}结构精密咬合！`;
    case 'zh-HK':
      return specClause
        ? `工程師設計呢個模組時採用咗極高標準，關鍵性能指標高達 ${specClause}！`
        : `喺 3D 透視模式下，你可以清楚睇到呢個部件點樣同周邊嘅${locCat}組件精密配合！`;
    case 'es':
      return specClause
        ? `¡Los ingenieros diseñaron este módulo para operar bajo condiciones extremas alcanzando ${specClause}!`
        : `¡En la vista en explosión 3D puedes observar cómo esta pieza se integra al milímetro dentro de ${locCat}!`;
    case 'fr':
      return specClause
        ? `Les ingénieurs ont calibré ce module pour supporter des contraintes remarquables allant jusqu'à ${specClause} !`
        : `Dans la vue éclatée 3D, on distingue exactement comment cette pièce s'articule au cœur du système ${locCat} !`;
    case 'de':
      return specClause
        ? `Ingenieure haben dieses Modul für extreme Anforderungen ausgelegt – mit Spitzenwerten von ${specClause}!`
        : `In der 3D-Explosionsansicht lässt sich exakt erkennen, wie dieses Bauteil nahtlos in das System ${locCat} greift!`;
    case 'nl':
      return specClause
        ? `Ingenieurs hebben deze module ontworpen voor extreme belastingen met indrukwekkende waarden tot ${specClause}!`
        : `In de uitgeklapte 3D-weergave zie je precies hoe dit onderdeel naadloos samenwerkt binnen het systeem ${locCat}!`;
    case 'pt':
      return specClause
        ? `Os engenheiros projetaram este módulo para atingir marcas impressionantes de ${specClause} em operação!`
        : `Na vista explodida em 3D, você pode ver exatamente como esta peça se encaixa no sistema de ${locCat}!`;
    case 'it':
      return specClause
        ? `Gli ingegneri hanno progettato questo modulo per operare a livelli straordinari fino a ${specClause}!`
        : `Nella vista esplosa 3D puoi osservare come questo componente si integra con precisione millimetrica nel gruppo ${locCat}!`;
    case 'ja':
      return specClause
        ? `エンジニアは極限環境での動作を想定してこのモジュールを設計しており、${specClause}という驚異的な数値を実現しています！`
        : `3D分解ビューを使うと、このパーツが${locCat}の内部でどのように精密に組み合わさっているかが一目でわかります！`;
    case 'ko':
      return specClause
        ? `엔지니어들은 극한의 조건에서도 견디도록 이 모듈을 설계하여 ${specClause}의 놀라운 성능을 구현했습니다!`
        : `3D 분해 뷰를 통해 이 부품이 ${locCat} 내부에서 어떻게 정밀하게 맞물려 작동하는지 직접 확인할 수 있습니다!`;
    case 'ar':
      return specClause
        ? `صمم المهندسون هذه الوحدة لتعمل بكفاءة مذهلة تصل معاييرها الهندسية إلى ${specClause}!`
        : `في العرض المفكك ثلاثي الأبعاد، يمكنك رؤية كيف تتكامل هذه القطعة بدقة متناهية داخل منظومة ${locCat}!`;
    default:
      return part.funFact || '';
  }
}

export function tModel(model) {
  if (!model || currentLang === 'en') {
    return {
      name: model?.name || '',
      fullName: model?.fullName || model?.name || '',
      tagline: model?.tagline || model?.badge || '',
      badge: model?.badge || '',
    };
  }
  const catEntry = CATEGORY_I18N[model.id]?.[currentLang];
  const directName = MODEL_NAME_I18N[model.id]?.[currentLang] || catEntry?.name;
  return {
    name: directName || translateTechnicalText(model.name || '', currentLang),
    fullName: catEntry?.fullName || directName || translateTechnicalText(model.fullName || model.name || '', currentLang),
    tagline: catEntry?.tagline || (model.tagline ? translateTechnicalText(model.tagline, currentLang) : ''),
    badge: model.badge ? translateTechnicalText(model.badge, currentLang) : '',
  };
}

export function tPart(part) {
  if (!part || currentLang === 'en') return part;
  const localMap = part.i18n?.[currentLang];
  const locCategory = localMap?.category || tPartCategory(part.category);
  const locName = localMap?.name || localizePartName(part.name, part.category, currentLang);
  return {
    ...part,
    name: locName,
    category: locCategory,
    desc: localMap?.desc || buildFluentPartDesc(part, locName, locCategory, currentLang),
    funFact: localMap?.funFact || buildFluentPartFunFact(part, locName, locCategory, currentLang),
  };
}

export function tQuizQuestion(qOrObj, categoryObj = null) {
  const qText = typeof qOrObj === 'string' ? qOrObj : (qOrObj?.q || '');
  if (!qText || currentLang === 'en') return qText;

  // Locate target part if available so we can synthesize a 100% fluent native-language question
  const correctId = typeof qOrObj === 'object' ? qOrObj?.correctId : null;
  const rawPart =
    correctId && Array.isArray(categoryObj?.parts)
      ? categoryObj.parts.find((p) => p.id === correctId)
      : null;
  const locCat = rawPart ? tPartCategory(rawPart.category) : GENERIC_CATEGORY_FALLBACK[currentLang];
  const activeModelObj =
    categoryObj && Array.isArray(categoryObj.models)
      ? categoryObj.models.find((m) => m.id === categoryObj.activeModelId) || categoryObj
      : categoryObj;
  const locModelName = activeModelObj ? tModel(activeModelObj).name : '';
  const specs = extractQuantitativeSpecs(qText || rawPart?.desc || '', currentLang);
  const specHint = specs.length ? ` (${specs.join(' / ')})` : '';

  switch (currentLang) {
    case 'zh-CN':
      return locModelName
        ? `在${locModelName}中，哪一个属于「${locCat}」核心系统并承担关键工程职能${specHint}？`
        : `哪一个精密部件属于「${locCat}」系统并负责该项核心功能${specHint}？`;
    case 'zh-HK':
      return locModelName
        ? `喺${locModelName}入面，邊一個零件屬於「${locCat}」系統並負責呢項關鍵工程功能${specHint}？`
        : `邊一個精密部件屬於「${locCat}」系統並負責呢項核心功能${specHint}？`;
    case 'es':
      return locModelName
        ? `¿Qué componente del sistema de ${locCat} en ${locModelName} cumple esta función clave de ingeniería${specHint}?`
        : `¿Qué pieza del módulo de ${locCat} realiza esta función técnica principal${specHint}?`;
    case 'fr':
      return locModelName
        ? `Quel composant du système ${locCat} de ${locModelName} assure cette fonction technique essentielle${specHint} ?`
        : `Quelle pièce du module ${locCat} remplit cette fonction d'ingénierie clé${specHint} ?`;
    case 'de':
      return locModelName
        ? `Welches Bauteil aus dem Bereich ${locCat} übernimmt bei ${locModelName} diese zentrale technische Funktion${specHint}?`
        : `Welches Konstruktionsteil des Systems ${locCat} erfüllt diese wichtige Ingenieurfunktion${specHint}?`;
    case 'nl':
      return locModelName
        ? `Welk onderdeel binnen het systeem ${locCat} van ${locModelName} vervult deze cruciale technische functie${specHint}?`
        : `Welk constructieonderdeel van het systeem ${locCat} voert deze belangrijke ingenieursfunctie uit${specHint}?`;
    case 'pt':
      return locModelName
        ? `Qual componente do sistema de ${locCat} em ${locModelName} desempenha esta função técnica essencial${specHint}?`
        : `Qual peça do módulo de ${locCat} executa esta função principal de engenharia${specHint}?`;
    case 'it':
      return locModelName
        ? `Quale componente del sistema ${locCat} in ${locModelName} svolge questa funzione ingegneristica fondamentale${specHint}?`
        : `Quale elemento del gruppo ${locCat} esegue questa funzione tecnica essenziale${specHint}?`;
    case 'ja':
      return locModelName
        ? `${locModelName}において、「${locCat}」システムに属しこの重要なエンジニアリング機能を担うパーツはどれですか${specHint}？`
        : `「${locCat}」システムを構成し、この主要な技術的役割を果たすパーツはどれですか${specHint}？`;
    case 'ko':
      return locModelName
        ? `${locModelName}에서 '${locCat}' 시스템에 속하며 이 핵심 공학 기능을 수행하는 부품은 무엇입니까${specHint}?`
        : `'${locCat}' 모듈에 속하며 이 핵심 기술 기능을 담당하는 부품은 어느 것입니까${specHint}?`;
    case 'ar':
      return locModelName
        ? `أي جزء ضمن منظومة «${locCat}» في ${locModelName} يؤدي هذه الوظيفة الهندسية الأساسية${specHint}؟`
        : `أي مكون من منظومة «${locCat}» يقوم بهذه المهمة الهندسية الرئيسية${specHint}؟`;
    default:
      return translateTechnicalText(qText, currentLang);
  }
}
