// Web Audio API synthesized sound effects + Google Cloud Chirp 3 HD Read Aloud for Inside Out Studio.
// 3-Tier Multi-Language Read Aloud Architecture (12 languages: EN, ZH-CN, ZH-HK, ES, FR, DE, NL, PT, IT, JA, KO, AR):
//   1. Studio Chirp 3 HD (`Aoede`) pre-synthesized MP3 assets (`assets/audio/chirp/<lang>/<key>.mp3`) — works on static hosting!
//   2. Live Google Cloud Chirp 3 HD (`Aoede`) BFF synthesis via same-origin `POST /api/tts` when available.
//   3. Graceful fallback to unity-pitch (1.0), novelty-filtered browser `speechSynthesis`.
// Includes a soft-knee Master DynamicsCompressor + anti-aliasing low-pass filter for Web Audio
// and automatic background engine ducking during Read Aloud playback.
import { getLangMeta } from './i18n.js';
import { getStudioChirpAudioUrl } from './audio_manifest.js';

let ctx = null;
let masterBus = null;
let muted = false;
let speakingActive = false;
let speechSessionId = 0;
let speechStartTimer = null;
let cachedVoices = [];
let activeAudioEl = null;
let activeObjectUrl = null;
let activeFetchController = null;
let chirpApiState = null; // null = unknown, true = available, false = unavailable
let chirpApiCheckPromise = null;
const speakingListeners = new Set();

let lastSpeechDiagnostics = {
  rawText: '',
  cleanedText: '',
  chunks: [],
  langCode: 'en',
  utterLang: 'en-US',
  engine: 'idle',
  chirpVoice: 'en-US-Chirp3-HD-Aoede',
  audioUrl: null,
  pitch: 1.0,
  rate: 1.0,
  voiceName: null,
  voiceLang: null,
  timestamp: 0,
};

function probeChirpApiStatus() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    chirpApiState = false;
    return Promise.resolve(false);
  }
  if (chirpApiState !== null) {
    return Promise.resolve(chirpApiState);
  }
  if (chirpApiCheckPromise) {
    return chirpApiCheckPromise;
  }
  chirpApiCheckPromise = fetch('/api/tts/status', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) {
        chirpApiState = false;
        return false;
      }
      const ct = String(res.headers.get('content-type') || '');
      if (!ct.includes('application/json')) {
        chirpApiState = false;
        return false;
      }
      const data = await res.json();
      chirpApiState = Boolean(data && data.available);
      return chirpApiState;
    })
    .catch(() => {
      chirpApiState = false;
      return false;
    })
    .finally(() => {
      chirpApiCheckPromise = null;
    });
  return chirpApiCheckPromise;
}

if (typeof window !== 'undefined') {
  // Warm up Chirp API availability check asynchronously on load
  probeChirpApiStatus();
}

function refreshVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    const list = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    if (Array.isArray(list) && list.length > 0) {
      cachedVoices = list;
    }
  } catch {
    // ignore
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  try {
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }
  } catch {
    // ignore
  }
}

function cleanupActiveAudio() {
  if (activeFetchController) {
    try {
      activeFetchController.abort();
    } catch {
      // ignore
    }
    activeFetchController = null;
  }
  if (activeAudioEl) {
    try {
      activeAudioEl.onended = null;
      activeAudioEl.onerror = null;
      activeAudioEl.pause();
      activeAudioEl.removeAttribute('src');
      activeAudioEl.load();
    } catch {
      // ignore
    }
    activeAudioEl = null;
  }
  if (activeObjectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    try {
      URL.revokeObjectURL(activeObjectUrl);
    } catch {
      // ignore
    }
    activeObjectUrl = null;
  }
}

function setSpeakingState(active) {
  const next = Boolean(active);
  if (speakingActive === next) return;
  speakingActive = next;
  // Smoothly silence Web Audio master bus and background engine while Read Aloud is active
  if (ctx && masterBus?.input) {
    try {
      const busTarget = speakingActive ? 0.0 : 0.85;
      masterBus.input.gain.setTargetAtTime(busTarget, ctx.currentTime, 0.015);
    } catch {
      // ignore
    }
  }
  if (engineNodes && ctx) {
    try {
      const target = speakingActive ? 0.001 : (engineNodes.lastTargetVol || 0.04);
      engineNodes.masterGain.gain.setTargetAtTime(target, ctx.currentTime, 0.025);
    } catch {
      // ignore
    }
  }
  for (const fn of speakingListeners) {
    try {
      fn(speakingActive);
    } catch {
      // ignore
    }
  }
}

export function isSpeaking() {
  return speakingActive;
}

export function onSpeakingChange(fn) {
  speakingListeners.add(fn);
  return () => speakingListeners.delete(fn);
}

function getCtx() {
  if (muted || typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getMasterInput(c) {
  if (!c) return null;
  if (masterBus && masterBus.ctx === c) return masterBus.input;
  try {
    const input = c.createGain();
    input.gain.setValueAtTime(0.85, c.currentTime);

    const dcBlocker = c.createBiquadFilter();
    dcBlocker.type = 'highpass';
    dcBlocker.frequency.setValueAtTime(28, c.currentTime);
    dcBlocker.Q.setValueAtTime(0.707, c.currentTime);

    const warmthFilter = c.createBiquadFilter();
    warmthFilter.type = 'lowpass';
    warmthFilter.frequency.setValueAtTime(10500, c.currentTime);
    warmthFilter.Q.setValueAtTime(0.707, c.currentTime);

    const compressor = c.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, c.currentTime);
    compressor.knee.setValueAtTime(18, c.currentTime);
    compressor.ratio.setValueAtTime(4, c.currentTime);
    compressor.attack.setValueAtTime(0.003, c.currentTime);
    compressor.release.setValueAtTime(0.16, c.currentTime);

    input.connect(dcBlocker);
    dcBlocker.connect(warmthFilter);
    warmthFilter.connect(compressor);
    compressor.connect(c.destination);

    masterBus = { ctx: c, input, dcBlocker, warmthFilter, compressor };
    return input;
  } catch {
    return c.destination;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(val) {
  muted = Boolean(val);
  if (muted) {
    stopSpeaking();
    stopEngineSound();
  }
}

export function toggleMuted() {
  setMuted(!muted);
  if (!muted) playPop(660);
  return muted;
}

function tone(freq, duration = 0.1, type = 'sine', gainVal = 0.14, delay = 0, endFreq = null) {
  const c = getCtx();
  if (!c) return;
  // Do not let quick UI chirps step on active Read Aloud narration
  if (speakingActive && duration <= 0.12) return;
  try {
    const dest = getMasterInput(c);
    if (!dest) return;
    const now = c.currentTime + Math.max(0, delay);
    const safeStartFreq = Math.max(45, Math.min(4200, Number(freq) || 440));
    const safeEndFreq =
      endFreq !== null ? Math.max(45, Math.min(4200, Number(endFreq) || safeStartFreq)) : null;
    const peakGain = Math.max(0.002, Math.min(0.24, Number(gainVal) || 0.12));

    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(safeStartFreq, now);
    if (safeEndFreq !== null && Math.abs(safeEndFreq - safeStartFreq) > 0.5) {
      osc.frequency.exponentialRampToValueAtTime(safeEndFreq, now + duration);
    }

    const maxF = Math.max(safeStartFreq, safeEndFreq || safeStartFreq);
    const cutoff = Math.min(7200, Math.max(600, maxF * (type === 'sawtooth' ? 2.5 : 3.6)));
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(0.7, now);

    const attackTime = Math.min(0.014, duration * 0.25);
    const stopTime = now + duration + 0.018;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.014);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // ignore
      }
    };

    osc.start(now);
    osc.stop(stopTime);
  } catch {
    // Ignore audio context state errors in headless/autoplay-restricted browsers
  }
}

// Continuous Web Audio V8/V12/EV/Turbine Engine Synthesizer for Drive Mode
let engineNodes = null;

export function startEngineSound() {
  if (muted) return;
  const c = getCtx();
  if (!c || engineNodes) return;
  try {
    const dest = getMasterInput(c);
    if (!dest) return;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const filter = c.createBiquadFilter();
    const masterGain = c.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(58, c.currentTime);
    osc2.frequency.setValueAtTime(116, c.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, c.currentTime);
    filter.Q.setValueAtTime(1.15, c.currentTime);

    const initialVol = speakingActive ? 0.003 : 0.036;
    masterGain.gain.setValueAtTime(initialVol, c.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(dest);

    osc1.start();
    osc2.start();
    engineNodes = { osc1, osc2, filter, masterGain, lastTargetVol: 0.036 };
  } catch {
    engineNodes = null;
  }
}

export function updateEngineSound(rpm = 900, throttle = 0, isTurbineOrEV = false) {
  if (muted || !engineNodes || !ctx) return;
  try {
    const now = ctx.currentTime;
    const normRpm = Math.max(0, Math.min(1, (rpm - 800) / 8200));
    const baseFreq = isTurbineOrEV
      ? 140 + normRpm * 460
      : 48 + normRpm * 195;
    const subFreq = isTurbineOrEV
      ? baseFreq * 1.5
      : baseFreq * 2.0;
    engineNodes.osc1.frequency.setTargetAtTime(baseFreq, now, 0.045);
    engineNodes.osc2.frequency.setTargetAtTime(subFreq, now, 0.045);
    engineNodes.filter.frequency.setTargetAtTime(
      230 + normRpm * 1250 + throttle * 550,
      now,
      0.05,
    );
    const rawVol = 0.028 + normRpm * 0.048 + throttle * 0.03;
    engineNodes.lastTargetVol = rawVol;
    const effectiveVol = speakingActive ? 0.003 : rawVol;
    engineNodes.masterGain.gain.setTargetAtTime(effectiveVol, now, 0.05);
  } catch {
    // ignore
  }
}

export function stopEngineSound() {
  if (!engineNodes) return;
  try {
    engineNodes.osc1.stop();
    engineNodes.osc2.stop();
    engineNodes.masterGain.disconnect();
  } catch {
    // ignore
  }
  engineNodes = null;
}

export function playHorn() {
  tone(349.23, 0.26, 'triangle', 0.11, 0, 349.23);
  tone(440.0, 0.26, 'triangle', 0.11, 0, 440.0);
}

export function playPop(freq = 520) {
  const base = Math.max(180, Math.min(1200, Number(freq) || 520));
  tone(base, 0.065, 'sine', 0.11, 0, base * 1.18);
}

export function playSnap() {
  tone(390, 0.055, 'sine', 0.13, 0, 620);
  tone(660, 0.08, 'triangle', 0.1, 0.04, 880);
}

export function playWhoosh(exploding = true) {
  if (exploding) {
    tone(210, 0.2, 'sine', 0.11, 0, 540);
    tone(310, 0.18, 'triangle', 0.075, 0.035, 720);
  } else {
    tone(540, 0.19, 'sine', 0.11, 0, 220);
    tone(440, 0.17, 'triangle', 0.075, 0.035, 290);
  }
}

export function playCorrect() {
  tone(523.25, 0.1, 'triangle', 0.13, 0);
  tone(659.25, 0.1, 'triangle', 0.13, 0.085);
  tone(783.99, 0.17, 'triangle', 0.14, 0.17);
}

export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, idx) => {
    tone(n, idx === notes.length - 1 ? 0.32 : 0.11, 'triangle', 0.13, idx * 0.095);
  });
}

export function playOops() {
  tone(310, 0.11, 'triangle', 0.1, 0, 255);
  tone(245, 0.16, 'triangle', 0.1, 0.095, 195);
}

// ============================================================================
// Multi-Language Speech Prosody Sanitizer, Voice Quality Selector & Chunker
// ============================================================================
const UNIT_SPOKEN_MAP = {
  en: { degC: ' degrees Celsius', degF: ' degrees Fahrenheit', deg: ' degrees', kmh: ' kilometers per hour', mph: ' miles per hour', rpm: ' RPM' },
  'zh-CN': { degC: ' 摄氏度', degF: ' 华氏度', deg: ' 度', kmh: ' 公里每小时', mph: ' 英里每小时', rpm: ' 转每分钟' },
  'zh-HK': { degC: ' 攝氏度', degF: ' 華氏度', deg: ' 度', kmh: ' 公里每小時', mph: ' 英里每小時', rpm: ' 轉每分鐘' },
  es: { degC: ' grados Celsius', degF: ' grados Fahrenheit', deg: ' grados', kmh: ' kilómetros por hora', mph: ' millas por hora', rpm: ' revoluciones por minuto' },
  fr: { degC: ' degrés Celsius', degF: ' degrés Fahrenheit', deg: ' degrés', kmh: ' kilomètres par heure', mph: ' miles par heure', rpm: ' tours par minute' },
  de: { degC: ' Grad Celsius', degF: ' Grad Fahrenheit', deg: ' Grad', kmh: ' Kilometer pro Stunde', mph: ' Meilen pro Stunde', rpm: ' Umdrehungen pro Minute' },
  nl: { degC: ' graden Celsius', degF: ' graden Fahrenheit', deg: ' graden', kmh: ' kilometer per uur', mph: ' mijl per uur', rpm: ' toeren per minuut' },
  pt: { degC: ' graus Celsius', degF: ' graus Fahrenheit', deg: ' graus', kmh: ' quilômetros por hora', mph: ' milhas por hora', rpm: ' rotações por minuto' },
  it: { degC: ' gradi Celsius', degF: ' gradi Fahrenheit', deg: ' gradi', kmh: ' chilometri orari', mph: ' miglia orarie', rpm: ' giri al minuto' },
  ja: { degC: ' 度', degF: ' 華氏度', deg: ' 度', kmh: ' キロメートル毎時', mph: ' マイル毎時', rpm: ' 回転毎分' },
  ko: { degC: ' 도', degF: ' 화씨 도', deg: ' 도', kmh: ' 시속 킬로미터', mph: ' 시속 마일', rpm: ' 알피엠' },
  ar: { degC: ' درجة مئوية', degF: ' درجة فهرنهايت', deg: ' درجة', kmh: ' كيلومتر في الساعة', mph: ' ميل في الساعة', rpm: ' دورة في الدقيقة' },
};

// Block macOS/Chrome novelty & legacy Eloquence formant voices that cause severe robotic/chirpy distortion
const NOVELTY_OR_FORMANT_VOICE_RE =
  /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|espeak)\b/i;

const PREFERRED_VOICE_NAMES = {
  en: /\b(Samantha|Ava|Allison|Alex|Victoria|Daniel|Karen|Moira|Serena)\b/i,
  'zh-CN': /\b(Tingting|Ting-Ting|Xiaoxiao|Yunxi|Yu-shu|Meijia)\b/i,
  'zh-HK': /\b(Sinji|Sin-ji|Sin-Ji|HiuMaan|HiuGaai|WanLung)\b/i,
  es: /\b(Mónica|Monica|Paulina|Marisol|Jorge|Sabina|Elena)\b/i,
  fr: /\b(Thomas|Amélie|Amelie|Audrey|Aurélie|Aurelie|Jacques|Denise)\b/i,
  de: /\b(Anna|Helena|Petra|Martin|Yannick|Katja)\b/i,
  nl: /\b(Xander|Ellen|Claire|Colette|Fenna|Maarten)\b/i,
  pt: /\b(Luciana|Joana|Catarina|Felipe|Francisca)\b/i,
  it: /\b(Alice|Federica|Luca|Paola|Elsa)\b/i,
  ja: /\b(Kyoko|Otoya|Hattori|O-Ren|Nanami)\b/i,
  ko: /\b(Yuna|Sora|Jian|Minsu|SunHi)\b/i,
  ar: /\b(Majed|Maged|Tarik|Laila|Mariam|Zariyah)\b/i,
};

export function cleanTextForSpeech(rawText, langCode = null) {
  if (!rawText) return '';
  const code = langCode || getLangMeta()?.code || 'en';
  const units = UNIT_SPOKEN_MAP[code] || UNIT_SPOKEN_MAP.en;
  const isCJK = code === 'zh-CN' || code === 'zh-HK' || code === 'ja';
  const pauseSep = isCJK ? '，' : ', ';

  let s = String(rawText)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\uFE0E\uFE0F\u200D\u20E3]/gu, ' ')
    .replace(/[•‣▸▹▪▫★☆→←↑↓↔⇒⇐]/g, ' ')
    .replace(/([\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0600-\u06ff])s\b/gi, '$1')
    .replace(/(-?\d+(?:[.,]\d+)?)\s*°\s*C\b/gi, `$1${units.degC}`)
    .replace(/(-?\d+(?:[.,]\d+)?)\s*°\s*F\b/gi, `$1${units.degF}`)
    .replace(/(\d+(?:[.,]\d+)?)\s*°/g, `$1${units.deg} `)
    .replace(/\bkm\s*\/\s*h\b/gi, units.kmh.trim())
    .replace(/\bmph\b/gi, units.mph.trim())
    .replace(/\bRPM\b/g, units.rpm.trim())
    .replace(/\s*\/\s*/g, pauseSep)
    .replace(/\s*[—―]\s*/g, pauseSep)
    .replace(/\s+–\s+/g, pauseSep)
    .replace(/(\d)–(\d)/g, '$1-$2')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\b([A-Za-z]{2,})\s+\1\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

export function chunkTextForSpeech(cleanedText, langCode = null, maxLen = 360) {
  const s = String(cleanedText || '').trim();
  if (!s) return [];
  if (s.length <= maxLen) return [s];
  const code = langCode || getLangMeta()?.code || 'en';
  const isCJK = code === 'zh-CN' || code === 'zh-HK' || code === 'ja';

  const rawSentences = s
    .split(/(?<=[.!?。！？؟])\s+|(?<=[。！？؟])/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  const pushSubChunks = (segment) => {
    if (segment.length <= maxLen) {
      chunks.push(segment);
      return;
    }
    const clauses = segment
      .split(/(?<=[,;，；、])\s*|(?<=[，；、])/u)
      .map((c) => c.trim())
      .filter(Boolean);
    let buf = '';
    for (const cl of clauses) {
      const sep = buf && !isCJK ? ' ' : '';
      if (buf && (buf + sep + cl).length > maxLen) {
        chunks.push(buf);
        buf = cl;
      } else {
        buf = buf ? buf + sep + cl : cl;
      }
    }
    if (buf) chunks.push(buf);
  };

  for (const sent of rawSentences) {
    const sep = current && !isCJK ? ' ' : '';
    if (current && (current + sep + sent).length <= maxLen) {
      current = current + sep + sent;
    } else {
      if (current) chunks.push(current);
      if (sent.length > maxLen) {
        pushSubChunks(sent);
        current = '';
      } else {
        current = sent;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [s];
}

export function pickBestVoice(langCode = 'en', speechLang = 'en-US', voicesInput = null) {
  const voices = Array.isArray(voicesInput) && voicesInput.length ? voicesInput : refreshVoices();
  if (!voices.length) return null;

  const normLang = (v) => String(v?.lang || '').replace('_', '-');
  const targetNorm = String(speechLang || 'en-US').replace('_', '-');
  const prefix = targetNorm.split('-')[0].toLowerCase();

  const matchesLanguage = (v) => {
    const vLang = normLang(v);
    const vName = String(v?.name || '');
    if (langCode === 'zh-HK') {
      return (
        /^(zh-(HK|MO|TW|Hant)|yue)/i.test(vLang) ||
        /cantonese|hong\s*kong|sin[-_]?ji|hiumaan|hiugaai|wanlung|粤|粵|廣東/i.test(vName)
      );
    }
    if (langCode === 'zh-CN') {
      return (
        /^(zh-(CN|SG|Hans)|cmn)/i.test(vLang) ||
        /ting[-_]?ting|xiaoxiao|yunxi|yushu|mandarin|mainland|普通话/i.test(vName)
      );
    }
    if (langCode === 'ar') {
      return /^ar(-|$)/i.test(vLang) || /majed|maged|tarik|laila|mariam|arabic|العربية/i.test(vName);
    }
    if (langCode === 'nl') {
      return /^nl(-|$)/i.test(vLang) || /xander|ellen|claire|dutch|nederlands/i.test(vName);
    }
    return new RegExp(`^${prefix}(-|$)`, 'i').test(vLang);
  };

  let candidates = voices.filter(matchesLanguage);
  if (!candidates.length && (langCode === 'zh-HK' || langCode === 'zh-CN')) {
    candidates = voices.filter((v) => /^(zh|yue|cmn)/i.test(normLang(v)));
  }
  if (!candidates.length) return null;

  const preferredNameRe = PREFERRED_VOICE_NAMES[langCode] || PREFERRED_VOICE_NAMES.en;
  const exactLocaleRe = new RegExp(`^${targetNorm}$`, 'i');

  const scoreVoice = (v) => {
    const name = String(v?.name || '');
    const vLang = normLang(v);
    const isNovelty = NOVELTY_OR_FORMANT_VOICE_RE.test(name);
    let score = 0;

    if (isNovelty) score -= 1000;
    if (preferredNameRe && preferredNameRe.test(name)) score += 170;
    if (/premium|enhanced|siri/i.test(name)) score += 155;
    if (/natural|online|neural|chirp|studio|wavenet|journey/i.test(name)) score += 130;
    if (/google/i.test(name)) score += 105;
    if (v.localService && !isNovelty) score += 25;
    if (exactLocaleRe.test(vLang)) score += 40;
    else if (langCode === 'zh-HK' && /^(zh-HK|yue)/i.test(vLang)) score += 45;
    else if (langCode === 'ar' && /^ar-(SA|001|XA|EG|AE)/i.test(vLang)) score += 38;
    else if (langCode === 'nl' && /^nl-(NL|BE)/i.test(vLang)) score += 38;
    else if (new RegExp(`^${prefix}-`, 'i').test(vLang)) score += 20;
    if (v.default && score > 0) score += 5;
    return score;
  };

  const ranked = candidates
    .map((voice, idx) => ({ voice, score: scoreVoice(voice), idx }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx);

  return ranked[0]?.voice || null;
}

export function getAudioDiagnostics() {
  return {
    muted,
    speakingActive,
    chirpApiState,
    hasMasterCompressor: Boolean(masterBus?.compressor),
    voicesCount: cachedVoices.length,
    lastSpeech: { ...lastSpeechDiagnostics },
  };
}

export function stopSpeaking() {
  speechSessionId += 1;
  if (speechStartTimer) {
    clearTimeout(speechStartTimer);
    speechStartTimer = null;
  }
  cleanupActiveAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  setSpeakingState(false);
}

function playAudioElementUrl(url, sessionId, onFallback, isObjectUrl = false) {
  if (typeof Audio === 'undefined') {
    onFallback();
    return;
  }
  cleanupActiveAudio();
  if (isObjectUrl) {
    activeObjectUrl = url;
  }
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = 1.0;
  activeAudioEl = audio;

  audio.onended = () => {
    if (sessionId !== speechSessionId) return;
    cleanupActiveAudio();
    setSpeakingState(false);
  };

  audio.onerror = () => {
    if (sessionId !== speechSessionId) return;
    cleanupActiveAudio();
    onFallback();
  };

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch((err) => {
      if (sessionId !== speechSessionId) return;
      if (err && err.name === 'AbortError') return;
      cleanupActiveAudio();
      onFallback();
    });
  }
}

function speakWithBrowserFallback(chunks, langCode, speechLang, sessionId) {
  if (sessionId !== speechSessionId || muted) {
    setSpeakingState(false);
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    setSpeakingState(false);
    return;
  }
  const voices = refreshVoices();
  const matchVoice = pickBestVoice(langCode, speechLang, voices);
  const effectiveLang = (matchVoice?.lang || speechLang || 'en-US').replace('_', '-');

  lastSpeechDiagnostics = {
    ...lastSpeechDiagnostics,
    engine: 'browser-neural',
    utterLang: effectiveLang,
    voiceName: matchVoice?.name || null,
    voiceLang: matchVoice?.lang || null,
  };

  const synth = window.speechSynthesis;
  try {
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused && synth.resume) synth.resume();
  } catch {
    // ignore
  }

  const speakChunkAt = (idx, useFallbackDefaultVoice = false) => {
    if (sessionId !== speechSessionId || muted) {
      setSpeakingState(false);
      return;
    }
    if (idx >= chunks.length) {
      setSpeakingState(false);
      return;
    }
    try {
      const utter = new SpeechSynthesisUtterance(chunks[idx]);
      utter.lang = useFallbackDefaultVoice ? speechLang : effectiveLang;
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      if (matchVoice && !useFallbackDefaultVoice) {
        utter.voice = matchVoice;
      }
      utter.onend = () => {
        if (sessionId !== speechSessionId) return;
        if (idx + 1 < chunks.length) {
          speakChunkAt(idx + 1, useFallbackDefaultVoice);
        } else {
          setSpeakingState(false);
        }
      };
      utter.onerror = (ev) => {
        if (sessionId !== speechSessionId) return;
        const errCode = ev?.error || '';
        if (!useFallbackDefaultVoice && matchVoice && errCode !== 'canceled' && errCode !== 'interrupted') {
          speakChunkAt(idx, true);
          return;
        }
        setSpeakingState(false);
      };
      synth.speak(utter);
    } catch {
      setSpeakingState(false);
    }
  };

  speakChunkAt(0, false);
}

export function speakText(text, opts = {}) {
  if (muted || !text || typeof window === 'undefined') {
    return false;
  }
  try {
    const meta = getLangMeta();
    const langCode = meta?.code || 'en';
    const speechLang = meta?.speechLang || 'en-US';
    const chirpVoice = meta?.chirpVoice || 'en-US-Chirp3-HD-Aoede';
    const cleaned = cleanTextForSpeech(text, langCode);
    if (!cleaned) return false;

    const chunks = chunkTextForSpeech(cleaned, langCode, 360);
    const voices = refreshVoices();
    const matchVoice = pickBestVoice(langCode, speechLang, voices);
    const studioUrl = opts?.studioKey ? getStudioChirpAudioUrl(langCode, opts.studioKey) : null;

    const sessionId = ++speechSessionId;
    if (speechStartTimer) {
      clearTimeout(speechStartTimer);
      speechStartTimer = null;
    }
    cleanupActiveAudio();
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
    }

    lastSpeechDiagnostics = {
      rawText: String(text),
      cleanedText: cleaned,
      chunks,
      langCode,
      utterLang: (matchVoice?.lang || speechLang || 'en-US').replace('_', '-'),
      engine: studioUrl ? 'studio-chirp3-hd' : chirpApiState ? 'live-chirp3-hd' : 'browser-neural',
      chirpVoice,
      audioUrl: studioUrl || null,
      pitch: 1.0,
      rate: 1.0,
      voiceName: studioUrl || chirpApiState ? chirpVoice : (matchVoice?.name || null),
      voiceLang: meta?.chirpLangCode || speechLang,
      timestamp: Date.now(),
    };

    setSpeakingState(true);

    const tryLiveChirpOrBrowser = () => {
      if (sessionId !== speechSessionId || muted) {
        setSpeakingState(false);
        return;
      }
      probeChirpApiStatus().then((available) => {
        if (sessionId !== speechSessionId || muted) return;
        if (!available) {
          speakWithBrowserFallback(chunks, langCode, speechLang, sessionId);
          return;
        }
        const controller = new AbortController();
        activeFetchController = controller;
        fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'InsideOutStudio',
          },
          body: JSON.stringify({ text: cleaned, lang: langCode }),
          signal: controller.signal,
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP_${res.status}`);
            const voiceHeader = res.headers.get('X-Chirp-Voice') || chirpVoice;
            const blob = await res.blob();
            if (sessionId !== speechSessionId || muted) return;
            activeFetchController = null;
            const objUrl = URL.createObjectURL(blob);
            lastSpeechDiagnostics = {
              ...lastSpeechDiagnostics,
              engine: 'live-chirp3-hd',
              chirpVoice: voiceHeader,
              voiceName: voiceHeader,
              audioUrl: 'blob:/api/tts',
            };
            playAudioElementUrl(
              objUrl,
              sessionId,
              () => speakWithBrowserFallback(chunks, langCode, speechLang, sessionId),
              true,
            );
          })
          .catch((err) => {
            if (sessionId !== speechSessionId) return;
            if (err && err.name === 'AbortError') return;
            activeFetchController = null;
            speakWithBrowserFallback(chunks, langCode, speechLang, sessionId);
          });
      });
    };

    if (studioUrl) {
      playAudioElementUrl(studioUrl, sessionId, tryLiveChirpOrBrowser, false);
    } else {
      tryLiveChirpOrBrowser();
    }

    return true;
  } catch {
    setSpeakingState(false);
    return false;
  }
}
