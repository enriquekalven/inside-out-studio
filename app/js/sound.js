// Web Audio API Realistic Object-Specific Acoustic Synthesizer + Google Cloud Chirp 3 HD Read Aloud for Inside Out Studio.
// Covers 40+ physically modeled procedural sound profiles & mechanical/electronic foley across all 21 categories / 79 models,
// plus 3-Tier Multi-Language Read Aloud (13 languages: EN, ZH-CN, ZH-HK, ES, ES-419, FR, DE, NL, PT, IT, JA, KO, AR):
//   1. Studio Chirp 3 HD (`Aoede`) pre-synthesized MP3 assets (`assets/audio/chirp/<lang>/<key>.mp3`) — works on static hosting!
//   2. Live Google Cloud Chirp 3 HD (`Aoede`) BFF synthesis via same-origin `POST /api/tts` when available.
//   3. Graceful fallback to unity-pitch (1.0), novelty-filtered browser `speechSynthesis`.
// Includes a soft-knee Master DynamicsCompressor + anti-aliasing low-pass filter for Web Audio
// and automatic background engine ducking during Read Aloud playback.
import { getLangMeta } from './i18n.js';
import { getStudioChirpAudioUrl } from './audio_manifest.js';

let ctx = null;
let masterBus = null;
let noiseCache = null; // { ctx, white, pink, brown, crackle }
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
let soundFxPlayedCount = 0;
let lastTriggerSoundName = null;
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
  probeChirpApiStatus();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      try {
        if (document.hidden && ctx.state === 'running') {
          ctx.suspend().catch(() => {});
        } else if (!document.hidden && !muted && engineNodes && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
    });
  }
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
  // Smoothly duck Web Audio master bus and background simulation while Read Aloud is active
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
    warmthFilter.frequency.setValueAtTime(12500, c.currentTime);
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

// Deterministic, zero-allocation cached noise buffers (White, Pink -3dB/oct, Brown -6dB/oct, Rocket Crackle)
function getNoiseBuffers(c) {
  if (noiseCache && noiseCache.ctx === c) return noiseCache;
  const sr = c.sampleRate || 44100;
  const len = Math.floor(sr * 2.0);
  const white = c.createBuffer(1, len, sr);
  const pink = c.createBuffer(1, len, sr);
  const brown = c.createBuffer(1, len, sr);
  const crackle = c.createBuffer(1, len, sr);

  const wData = white.getChannelData(0);
  const pData = pink.getChannelData(0);
  const bData = brown.getChannelData(0);
  const cData = crackle.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastBrown = 0;
  let crackEnv = 0;
  let seed = 0x9e3779b9;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 2147483648) - 1;
  };

  for (let i = 0; i < len; i++) {
    const w = rand();
    wData[i] = w * 0.7;

    // Paul Kellet pink noise filter
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;

    // Leaky-integrator brown rumble noise
    lastBrown = (lastBrown + 0.024 * w) / 1.024;
    bData[i] = Math.max(-1, Math.min(1, lastBrown * 3.2));

    // Supersonic acoustic shock-wave crackle (stochastic N-wave bursts)
    if (rand() > 0.988) crackEnv = 1.0;
    crackEnv *= 0.965;
    cData[i] = w * (0.18 + crackEnv * 0.82);
  }

  // Smooth crossfade on last 256 samples to eliminate loop seam clicks
  const fade = Math.min(256, Math.floor(len * 0.02));
  for (let i = 0; i < fade; i++) {
    const alpha = i / fade;
    const idx = len - fade + i;
    wData[idx] = wData[idx] * (1 - alpha) + wData[i] * alpha;
    pData[idx] = pData[idx] * (1 - alpha) + pData[i] * alpha;
    bData[idx] = bData[idx] * (1 - alpha) + bData[i] * alpha;
    cData[idx] = cData[idx] * (1 - alpha) + cData[i] * alpha;
  }

  noiseCache = { ctx: c, white, pink, brown, crackle };
  return noiseCache;
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

// ============================================================================
// Core Procedural Primitives (Tones, Filtered Noise Bursts & Micro-Impulses)
// ============================================================================
function tone(freq, duration = 0.1, type = 'sine', gainVal = 0.14, delay = 0, endFreq = null) {
  const c = getCtx();
  if (!c) return;
  if (speakingActive && duration <= 0.12) return;
  try {
    const dest = getMasterInput(c);
    if (!dest) return;
    soundFxPlayedCount += 1;
    const now = c.currentTime + Math.max(0, delay);
    const safeStartFreq = Math.max(32, Math.min(8800, Number(freq) || 440));
    const safeEndFreq =
      endFreq !== null ? Math.max(32, Math.min(8800, Number(endFreq) || safeStartFreq)) : null;
    const peakGain = Math.max(0.001, Math.min(0.26, Number(gainVal) || 0.12));

    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(safeStartFreq, now);
    if (safeEndFreq !== null && Math.abs(safeEndFreq - safeStartFreq) > 0.5) {
      osc.frequency.exponentialRampToValueAtTime(safeEndFreq, now + duration);
    }

    const maxF = Math.max(safeStartFreq, safeEndFreq || safeStartFreq);
    const cutoff = Math.min(10500, Math.max(550, maxF * (type === 'sawtooth' || type === 'square' ? 2.6 : 3.8)));
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(0.75, now);

    const attackTime = Math.min(0.012, duration * 0.22);
    const stopTime = now + duration + 0.02;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + Math.max(0.0015, attackTime));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.015);

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

function noiseBurst({
  kind = 'pink',
  duration = 0.14,
  delay = 0,
  gainVal = 0.09,
  filterType = 'bandpass',
  freq = 1200,
  endFreq = null,
  q = 1.4,
  attack = 0.008,
} = {}) {
  const c = getCtx();
  if (!c) return;
  if (speakingActive && duration <= 0.12) return;
  try {
    const dest = getMasterInput(c);
    if (!dest) return;
    soundFxPlayedCount += 1;
    const buffers = getNoiseBuffers(c);
    const buf = buffers[kind] || buffers.pink;
    const now = c.currentTime + Math.max(0, delay);

    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = filterType;
    const f0 = Math.max(40, Math.min(11000, Number(freq) || 1200));
    filter.frequency.setValueAtTime(f0, now);
    if (endFreq !== null) {
      const f1 = Math.max(40, Math.min(11000, Number(endFreq) || f0));
      filter.frequency.exponentialRampToValueAtTime(f1, now + duration);
    }
    filter.Q.setValueAtTime(Math.max(0.2, Math.min(18, Number(q) || 1.2)), now);

    const gain = c.createGain();
    const peak = Math.max(0.001, Math.min(0.28, Number(gainVal) || 0.08));
    const atk = Math.min(Math.max(0.001, attack), duration * 0.45);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + atk);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.015);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // ignore
      }
    };

    const maxOffset = Math.max(0, buf.duration - 0.25);
    const randOffset = (soundFxPlayedCount * 0.173) % Math.max(0.05, maxOffset);
    src.start(now, randOffset);
    src.stop(now + duration + 0.02);
  } catch {
    // ignore
  }
}

// ============================================================================
// Object-Specific Acoustic Profile Resolver (All 21 Categories / 79 Models)
// ============================================================================
export function resolveSoundProfile(categoryId = 'car', modelId = '') {
  const cat = String(categoryId || 'car').toLowerCase();
  const mid = String(modelId || '').toLowerCase();

  if (cat === 'car' || cat === 'cars') {
    if (/tesla|cybertruck|rivian/.test(mid)) return 'ev-drive';
    if (/lamborghini|revuelto|v12/.test(mid)) return 'v12-supercar';
    if (/porsche|gt3|911/.test(mid)) return 'flat6-gt';
    return 'v8-supercar';
  }
  if (cat === 'bike' || cat === 'bikes') {
    if (/ducati|panigale|moto/.test(mid)) return 'v4-moto';
    if (/tern|ebike|cargo/.test(mid)) return 'ebike';
    return 'road-bike';
  }
  if (cat === 'airplane' || cat === 'airplanes') {
    if (/iron-man/.test(mid)) return 'iron-man-flight';
    if (/cessna|prop|skyhawk/.test(mid)) return 'piston-prop';
    if (/f22|sr71|blackbird|raptor/.test(mid)) return 'fighter-afterburner';
    return 'turbofan-airliner';
  }
  if (cat === 'heli' || cat === 'helicopters' || cat === 'helicopter') {
    if (/mavic|drone|ingenuity|mars/.test(mid)) return 'quad-drone';
    return 'heli-turbine';
  }
  if (cat === 'jet' || cat === 'jets' || cat === 'engine') {
    if (/raptor|rocket/.test(mid)) return 'rocket-plume';
    if (/f135|afterburner/.test(mid)) return 'afterburner-cell';
    return 'turbofan-cell';
  }
  if (cat === 'rocket' || cat === 'rockets') return 'rocket-plume';
  if (cat === 'submarine' || cat === 'submarines') return 'submarine-hydro';
  if (cat === 'ship' || cat === 'ships') {
    if (/titanic/.test(mid)) return 'steam-liner';
    return 'marine-ship';
  }
  if (cat === 'train' || cat === 'trains') {
    if (/maglev/.test(mid)) return 'maglev-train';
    return 'bullet-train';
  }
  if (cat === 'space' || cat === 'spacecraft') return 'orbital-spacecraft';
  if (cat === 'robot' || cat === 'robots') {
    if (/iron-man/.test(mid)) return 'iron-man-flight';
    if (/perseverance|rover|mars/.test(mid)) return 'mars-rover';
    if (/kuka|6axis|industrial/.test(mid)) return 'industrial-arm';
    return 'quadruped-robot';
  }
  if (cat === 'construction') {
    if (/combine|harvester/.test(mid)) return 'combine-harvester';
    if (/crane|liebherr/.test(mid)) return 'tower-crane';
    return 'heavy-excavator';
  }
  if (cat === 'watch' || cat === 'watches') {
    if (/clock|grandfather|pendulum/.test(mid)) return 'horology-clock';
    return 'horology-watch';
  }
  if (cat === 'everyday') {
    if (/dyson|vacuum/.test(mid)) return 'dyson-cyclone';
    if (/fridge|refrigerator/.test(mid)) return 'fridge-inverter';
    if (/escalator/.test(mid)) return 'escalator-drive';
    if (/espresso|coffee/.test(mid)) return 'espresso-brew';
    if (/elevator/.test(mid)) return 'elevator-traction';
    if (/lock/.test(mid)) return 'pin-lock';
    return 'toilet-siphon';
  }
  if (cat === 'iphone' || cat === 'phone' || cat === 'phones') return 'smartphone';
  if (cat === 'laptop' || cat === 'laptops') {
    if (/air/.test(mid)) return 'laptop-fanless';
    return 'laptop-fan';
  }
  if (cat === 'house' || cat === 'houses') return 'smart-home';
  if (cat === 'tv' || cat === 'tvs') return 'cinema-tv';
  if (cat === 'gaming' || cat === 'console' || cat === 'ps5') {
    if (/dualsense|controller/.test(mid)) return 'gaming-controller';
    return 'gaming-console';
  }
  if (cat === 'audio-xr' || cat === 'vision' || cat === 'headphones' || cat === 'airpods') {
    return 'spatial-xr';
  }
  if (cat === 'cameras' || cat === 'camera') {
    if (/instant/.test(mid)) return 'camera-instant';
    if (/imax/.test(mid)) return 'camera-imax';
    return 'camera-mirrorless';
  }
  return 'v8-supercar';
}

// ============================================================================
// Continuous Multi-Profile Acoustic Simulation Engine
// ============================================================================
let engineNodes = null;

function makeNoiseSource(c, kind = 'pink') {
  const buffers = getNoiseBuffers(c);
  const src = c.createBufferSource();
  src.buffer = buffers[kind] || buffers.pink;
  src.loop = true;
  return src;
}

export function startEngineSound(profileOrOpts = null) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  let profile = 'v8-supercar';
  if (typeof profileOrOpts === 'string' && profileOrOpts) {
    profile = profileOrOpts;
  } else if (profileOrOpts && typeof profileOrOpts === 'object') {
    profile = profileOrOpts.profile || resolveSoundProfile(profileOrOpts.categoryId, profileOrOpts.modelId);
  }

  if (engineNodes && engineNodes.profile === profile) return;
  if (engineNodes) stopEngineSound();

  try {
    const dest = getMasterInput(c);
    if (!dest) return;
    const now = c.currentTime;
    const masterGain = c.createGain();
    masterGain.gain.setValueAtTime(speakingActive ? 0.001 : 0.024, now);
    masterGain.connect(dest);

    const sources = [];
    const disconnectors = [masterGain];
    const addOsc = (type, freq, gainVal, targetNode) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(gainVal, now);
      o.connect(g);
      g.connect(targetNode);
      o.start(now);
      sources.push(o);
      disconnectors.push(o, g);
      return { o, g };
    };
    const addNoise = (kind, filterType, freq, q, gainVal, targetNode) => {
      const s = makeNoiseSource(c, kind);
      const f = c.createBiquadFilter();
      const g = c.createGain();
      f.type = filterType;
      f.frequency.setValueAtTime(freq, now);
      f.Q.setValueAtTime(q, now);
      g.gain.setValueAtTime(gainVal, now);
      s.connect(f);
      f.connect(g);
      g.connect(targetNode);
      s.start(now);
      sources.push(s);
      disconnectors.push(s, f, g);
      return { s, f, g };
    };

    const state = {
      profile,
      masterGain,
      sources,
      disconnectors,
      lastTargetVol: 0.032,
      nextPulseTime: now + 0.05,
      pulseToggle: false,
      prevGear: null,
      prevThrottle: 0,
    };

    // Build specialized acoustic synthesis topology per physical machine archetype
    if (profile === 'v12-supercar' || profile === 'v8-supercar' || profile === 'flat6-gt' || profile === 'v4-moto') {
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(profile === 'v12-supercar' ? 2.1 : 1.45, now);
      filter.connect(masterGain);
      disconnectors.push(filter);

      const ratio2 = profile === 'v12-supercar' ? 3.0 : profile === 'flat6-gt' ? 1.5 : profile === 'v4-moto' ? 2.5 : 2.0;
      const ratio3 = profile === 'v12-supercar' ? 1.5 : 0.5;
      state.osc1 = addOsc('sawtooth', 56, 0.48, filter);
      state.osc2 = addOsc(profile === 'flat6-gt' ? 'sawtooth' : 'triangle', 56 * ratio2, 0.34, filter);
      state.osc3 = addOsc('sine', 56 * ratio3, 0.28, filter);
      state.turboWhine = addOsc('sine', 1600, profile === 'v8-supercar' ? 0.04 : 0.0, masterGain);
      state.intakeNoise = addNoise('pink', 'bandpass', 520, 1.8, 0.18, masterGain);
      state.filter = filter;
      state.ratios = [1, ratio2, ratio3];
    } else if (profile === 'ev-drive' || profile === 'ebike') {
      state.osc1 = addOsc('sine', 190, 0.32, masterGain);
      state.osc2 = addOsc('triangle', 570, 0.14, masterGain);
      state.roadNoise = addNoise('pink', 'bandpass', 380, 0.9, 0.28, masterGain);
    } else if (profile === 'road-bike') {
      state.windNoise = addNoise('pink', 'bandpass', 520, 0.8, 0.18, masterGain);
    } else if (profile === 'turbofan-airliner' || profile === 'turbofan-cell') {
      state.osc1 = addOsc('sawtooth', 165, 0.18, masterGain); // N1 fan buzz-saw
      state.osc2 = addOsc('sine', 980, 0.22, masterGain); // N2 compressor whine
      state.jetRoar = addNoise('pink', 'bandpass', 640, 0.75, 0.55, masterGain);
      state.coreRumble = addNoise('brown', 'lowpass', 220, 0.7, 0.38, masterGain);
    } else if (profile === 'fighter-afterburner' || profile === 'afterburner-cell') {
      state.osc1 = addOsc('sawtooth', 210, 0.2, masterGain);
      state.osc2 = addOsc('triangle', 1180, 0.18, masterGain);
      state.jetRoar = addNoise('pink', 'bandpass', 780, 0.85, 0.52, masterGain);
      state.burnerRumble = addNoise('crackle', 'lowpass', 380, 1.1, 0.05, masterGain);
    } else if (profile === 'piston-prop') {
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.Q.setValueAtTime(1.4, now);
      filter.connect(masterGain);
      disconnectors.push(filter);
      state.osc1 = addOsc('sawtooth', 42, 0.5, filter);
      state.osc2 = addOsc('triangle', 84, 0.35, filter);
      state.propWash = addNoise('pink', 'bandpass', 340, 1.1, 0.28, masterGain);
      state.filter = filter;
    } else if (profile === 'heli-turbine') {
      // Rotor blade-vortex slap ('chop-chop') via LFO-modulated bandpass wash + turboshaft whine
      const chopGain = c.createGain();
      chopGain.gain.setValueAtTime(0.35, now);
      chopGain.connect(masterGain);
      disconnectors.push(chopGain);

      const lfo = c.createOscillator();
      const lfoDepth = c.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(16, now);
      lfoDepth.gain.setValueAtTime(0.32, now);
      lfo.connect(lfoDepth);
      lfoDepth.connect(chopGain.gain);
      lfo.start(now);
      sources.push(lfo);
      disconnectors.push(lfo, lfoDepth);

      state.rotorWash = addNoise('brown', 'lowpass', 240, 1.2, 0.85, chopGain);
      state.bladeSlap = addNoise('pink', 'bandpass', 320, 1.8, 0.42, chopGain);
      state.turbineWhine = addOsc('sine', 1350, 0.12, masterGain);
      state.lfo = lfo;
      state.lfoDepth = lfoDepth;
    } else if (profile === 'quad-drone') {
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.connect(masterGain);
      disconnectors.push(filter);
      state.osc1 = addOsc('sawtooth', 195, 0.28, filter);
      state.osc2 = addOsc('sawtooth', 203, 0.26, filter); // Slight detune between 4 brushless props
      state.osc3 = addOsc('triangle', 398, 0.16, filter);
      state.airBuzz = addNoise('pink', 'bandpass', 950, 1.3, 0.18, masterGain);
      state.filter = filter;
    } else if (profile === 'rocket-plume') {
      state.subRumble = addNoise('brown', 'lowpass', 135, 0.9, 0.78, masterGain);
      state.shockCrackle = addNoise('crackle', 'bandpass', 680, 0.75, 0.52, masterGain);
      state.turbopump = addOsc('sine', 820, 0.08, masterGain);
    } else if (profile === 'submarine-hydro') {
      state.hydroAmbience = addNoise('brown', 'lowpass', 120, 1.1, 0.65, masterGain);
      state.cavitation = addNoise('pink', 'bandpass', 480, 1.6, 0.18, masterGain);
      state.reactorHum = addOsc('sine', 60, 0.16, masterGain);
    } else if (profile === 'marine-ship' || profile === 'steam-liner') {
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(190, now);
      filter.connect(masterGain);
      disconnectors.push(filter);
      state.osc1 = addOsc('sawtooth', 34, 0.42, filter);
      state.osc2 = addOsc('triangle', 68, 0.26, filter);
      state.bowWave = addNoise('pink', 'bandpass', 360, 0.85, 0.42, masterGain);
      state.filter = filter;
    } else if (profile === 'bullet-train' || profile === 'maglev-train') {
      state.inverter1 = addOsc('sine', 240, 0.24, masterGain);
      state.inverter2 = addOsc('triangle', 360, 0.15, masterGain);
      state.railOrAero = addNoise(
        'pink',
        'bandpass',
        profile === 'maglev-train' ? 680 : 420,
        profile === 'maglev-train' ? 0.9 : 1.4,
        0.38,
        masterGain,
      );
    } else if (profile === 'iron-man-flight') {
      state.osc1 = addOsc('sine', 310, 0.26, masterGain);
      state.osc2 = addOsc('triangle', 930, 0.16, masterGain);
      state.plasmaRush = addNoise('pink', 'bandpass', 1150, 1.2, 0.38, masterGain);
    } else if (profile === 'industrial-arm' || profile === 'mars-rover' || profile === 'quadruped-robot') {
      state.servo1 = addOsc('triangle', 280, 0.22, masterGain);
      state.servo2 = addOsc('sine', 560, 0.14, masterGain);
      state.gearNoise = addNoise('pink', 'bandpass', 1100, 2.2, 0.12, masterGain);
    } else if (profile === 'heavy-excavator' || profile === 'tower-crane' || profile === 'combine-harvester') {
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, now);
      filter.connect(masterGain);
      disconnectors.push(filter);
      state.diesel = addOsc('sawtooth', profile === 'tower-crane' ? 50 : 42, 0.42, filter);
      state.hydPump = addOsc('triangle', 480, 0.16, masterGain);
      state.workNoise = addNoise('pink', 'bandpass', profile === 'combine-harvester' ? 580 : 320, 1.2, 0.25, masterGain);
      state.filter = filter;
    } else if (profile === 'dyson-cyclone') {
      state.impeller1 = addOsc('sine', 1650, 0.24, masterGain);
      state.impeller2 = addOsc('triangle', 3300, 0.1, masterGain);
      state.cycloneAir = addNoise('pink', 'bandpass', 1850, 1.1, 0.48, masterGain);
    } else if (profile === 'fridge-inverter') {
      state.comp1 = addOsc('sine', 68, 0.34, masterGain);
      state.comp2 = addOsc('triangle', 136, 0.12, masterGain);
      state.evapFan = addNoise('pink', 'lowpass', 480, 0.8, 0.18, masterGain);
    } else if (profile === 'escalator-drive' || profile === 'elevator-traction') {
      state.motor1 = addOsc('sine', 110, 0.25, masterGain);
      state.motor2 = addOsc('triangle', 220, 0.12, masterGain);
      state.railWhisper = addNoise('pink', 'bandpass', 360, 1.4, 0.22, masterGain);
    } else if (profile === 'toilet-siphon') {
      state.waterRush = addNoise('pink', 'bandpass', 680, 1.2, 0.52, masterGain);
      state.siphonGurgle = addNoise('brown', 'lowpass', 220, 2.2, 0.32, masterGain);
    } else if (profile === 'espresso-brew') {
      state.pumpBuzz = addOsc('sawtooth', 60, 0.22, masterGain);
      state.pumpFilter = addNoise('brown', 'lowpass', 180, 1.5, 0.2, masterGain);
      state.steamHiss = addNoise('white', 'highpass', 2800, 0.9, 0.24, masterGain);
    } else if (profile === 'laptop-fan' || profile === 'gaming-console') {
      state.blowerAir = addNoise('pink', 'bandpass', 950, 0.85, 0.38, masterGain);
      state.fanBlade = addOsc('sine', 180, 0.06, masterGain);
    } else if (profile === 'spatial-xr') {
      // ANC cabin noise bed (attenuates as ANC -dB deepens!) + 360° crystalline binaural chord
      state.cabinNoise = addNoise('brown', 'lowpass', 180, 0.8, 0.32, masterGain);
      state.pad1 = addOsc('sine', 261.63, 0.14, masterGain); // C4
      state.pad2 = addOsc('sine', 392.0, 0.11, masterGain);  // G4
      state.pad3 = addOsc('sine', 493.88, 0.08, masterGain); // B4 (maj7 spatial air)
    } else if (profile === 'cinema-tv') {
      state.subBass = addOsc('sine', 65.41, 0.22, masterGain);
      state.warmPad = addOsc('triangle', 196.0, 0.12, masterGain);
    } else if (profile === 'orbital-spacecraft' || profile === 'smart-home') {
      state.ambientAir = addNoise('pink', 'lowpass', 340, 0.8, 0.18, masterGain);
      state.gyroHum = addOsc('sine', 120, 0.09, masterGain);
    } else {
      // Precision quiet profiles (`horology-watch`, `horology-clock`, `pin-lock`, `smartphone`, `laptop-fanless`, `gaming-controller`, `camera-*`)
      // rely on crisp sample-scheduled mechanical impulses inside updateEngineSound() + trigger actions!
      state.quietBed = addNoise('pink', 'lowpass', 300, 0.7, 0.005, masterGain);
    }

    engineNodes = state;
  } catch {
    engineNodes = null;
  }
}

export function updateEngineSound(rpm = 900, throttle = 0, extra = false) {
  if (muted || !engineNodes || !ctx) return;
  try {
    const now = ctx.currentTime;
    const p = engineNodes.profile;
    const ex = extra && typeof extra === 'object' ? extra : { turbine: Boolean(extra) };
    const normRpm = Math.max(0, Math.min(1, (Number(rpm) - 600) / 8400));
    const thr = Math.max(0, Math.min(1, Number(throttle) || 0));
    let rawVol = 0.024;

    if (p === 'v12-supercar' || p === 'v8-supercar' || p === 'flat6-gt' || p === 'v4-moto') {
      const baseMin = p === 'v12-supercar' ? 68 : p === 'v4-moto' ? 74 : p === 'flat6-gt' ? 62 : 46;
      const baseSpan = p === 'v12-supercar' ? 285 : p === 'v4-moto' ? 310 : p === 'flat6-gt' ? 245 : 195;
      const f0 = baseMin + normRpm * baseSpan;
      engineNodes.osc1.o.frequency.setTargetAtTime(f0, now, 0.038);
      engineNodes.osc2.o.frequency.setTargetAtTime(f0 * engineNodes.ratios[1], now, 0.038);
      engineNodes.osc3.o.frequency.setTargetAtTime(Math.max(32, f0 * engineNodes.ratios[2]), now, 0.038);
      engineNodes.filter.frequency.setTargetAtTime(240 + normRpm * 1850 + thr * 780, now, 0.042);
      engineNodes.intakeNoise.f.frequency.setTargetAtTime(420 + normRpm * 1900, now, 0.05);
      engineNodes.intakeNoise.g.gain.setTargetAtTime(0.06 + thr * 0.22, now, 0.05);
      if (p === 'v8-supercar') {
        engineNodes.turboWhine.o.frequency.setTargetAtTime(1400 + normRpm * 2900, now, 0.06);
        engineNodes.turboWhine.g.gain.setTargetAtTime(thr * 0.055, now, 0.06);
      }
      // Subtle exhaust overrun pop / turbo flutter on rapid throttle lift at high RPM
      if (engineNodes.prevThrottle > 0.65 && thr < 0.15 && normRpm > 0.45 && now > engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 0.35;
        noiseBurst({ kind: 'crackle', duration: 0.09, freq: 240, filterType: 'lowpass', gainVal: 0.07 });
      }
      engineNodes.prevThrottle = thr;
      rawVol = 0.028 + normRpm * 0.052 + thr * 0.032;
    } else if (p === 'ev-drive' || p === 'ebike') {
      const spdNorm = Math.max(0, Math.min(1, Number(rpm) / 6500));
      const invFreq = (p === 'ebike' ? 140 : 175) + spdNorm * (p === 'ebike' ? 420 : 920);
      engineNodes.osc1.o.frequency.setTargetAtTime(invFreq, now, 0.045);
      engineNodes.osc2.o.frequency.setTargetAtTime(invFreq * 3.0, now, 0.045);
      engineNodes.roadNoise.f.frequency.setTargetAtTime(260 + spdNorm * 680, now, 0.06);
      engineNodes.roadNoise.g.gain.setTargetAtTime(spdNorm * 0.34, now, 0.06);
      rawVol = spdNorm < 0.02 && thr < 0.02 ? 0.002 : 0.016 + spdNorm * 0.038 + thr * 0.02;
    } else if (p === 'road-bike') {
      const spd = Number(ex.speed ?? rpm) || 0;
      const pedaling = thr > 0.08;
      engineNodes.windNoise.f.frequency.setTargetAtTime(320 + spd * 18, now, 0.06);
      engineNodes.windNoise.g.gain.setTargetAtTime(Math.min(0.35, spd * 0.01), now, 0.06);
      rawVol = 0.028;
      // Crisp freehub pawl ratchet clicking when coasting above 3 mph!
      if (!pedaling && spd > 3 && now >= engineNodes.nextPulseTime) {
        const clickHz = Math.max(4, Math.min(28, spd * 0.85));
        engineNodes.nextPulseTime = now + 1 / clickHz;
        tone(2950, 0.012, 'triangle', 0.042, 0, 1850);
      }
    } else if (p === 'turbofan-airliner' || p === 'turbofan-cell') {
      engineNodes.osc1.o.frequency.setTargetAtTime(110 + normRpm * 280, now, 0.06);
      engineNodes.osc2.o.frequency.setTargetAtTime(780 + normRpm * 2150, now, 0.06);
      engineNodes.jetRoar.f.frequency.setTargetAtTime(420 + normRpm * 980, now, 0.06);
      engineNodes.coreRumble.g.gain.setTargetAtTime(0.22 + thr * 0.45, now, 0.06);
      rawVol = 0.024 + normRpm * 0.048 + thr * 0.028;
    } else if (p === 'fighter-afterburner' || p === 'afterburner-cell') {
      const burner = Number(ex.burner ?? (thr > 0.9 ? 1 : 0));
      engineNodes.osc1.o.frequency.setTargetAtTime(145 + normRpm * 340, now, 0.05);
      engineNodes.osc2.o.frequency.setTargetAtTime(920 + normRpm * 2400, now, 0.05);
      engineNodes.jetRoar.f.frequency.setTargetAtTime(520 + normRpm * 1250, now, 0.05);
      engineNodes.burnerRumble.g.gain.setTargetAtTime(0.06 + burner * 0.68, now, 0.04);
      engineNodes.burnerRumble.f.frequency.setTargetAtTime(260 + burner * 420, now, 0.04);
      rawVol = 0.026 + normRpm * 0.05 + burner * 0.036;
    } else if (p === 'piston-prop') {
      const propNorm = Math.max(0, Math.min(1, (Number(rpm) - 700) / 2100));
      const f0 = 36 + propNorm * 58;
      engineNodes.osc1.o.frequency.setTargetAtTime(f0, now, 0.045);
      engineNodes.osc2.o.frequency.setTargetAtTime(f0 * 2, now, 0.045);
      engineNodes.filter.frequency.setTargetAtTime(210 + propNorm * 680 + thr * 240, now, 0.05);
      engineNodes.propWash.f.frequency.setTargetAtTime(280 + propNorm * 520, now, 0.05);
      rawVol = 0.026 + propNorm * 0.044 + thr * 0.024;
    } else if (p === 'heli-turbine') {
      const nr = Math.max(0.05, Math.min(1.1, Number(ex.nr ?? (0.3 + normRpm * 0.7))));
      engineNodes.lfo.frequency.setTargetAtTime(4 + nr * 14.5, now, 0.06); // ~18.5 Hz blade-pass slap!
      engineNodes.lfoDepth.gain.setTargetAtTime(0.18 + thr * 0.28, now, 0.06);
      engineNodes.bladeSlap.f.frequency.setTargetAtTime(220 + nr * 210 + thr * 140, now, 0.06);
      engineNodes.turbineWhine.o.frequency.setTargetAtTime(880 + nr * 1450, now, 0.06);
      rawVol = (0.022 + thr * 0.052) * Math.min(1, nr * 1.15);
    } else if (p === 'quad-drone') {
      const f = 145 + normRpm * 490 + thr * 120;
      engineNodes.osc1.o.frequency.setTargetAtTime(f, now, 0.04);
      engineNodes.osc2.o.frequency.setTargetAtTime(f * 1.038, now, 0.04);
      engineNodes.osc3.o.frequency.setTargetAtTime(f * 2.02, now, 0.04);
      engineNodes.filter.frequency.setTargetAtTime(850 + normRpm * 2200, now, 0.05);
      rawVol = 0.018 + normRpm * 0.036 + thr * 0.02;
    } else if (p === 'rocket-plume') {
      engineNodes.subRumble.f.frequency.setTargetAtTime(85 + thr * 140, now, 0.05);
      engineNodes.shockCrackle.f.frequency.setTargetAtTime(480 + thr * 920, now, 0.05);
      engineNodes.shockCrackle.g.gain.setTargetAtTime(0.18 + thr * 0.62, now, 0.05);
      engineNodes.turbopump.o.frequency.setTargetAtTime(620 + normRpm * 1350, now, 0.06);
      rawVol = 0.022 + thr * 0.068;
    } else if (p === 'submarine-hydro') {
      engineNodes.cavitation.f.frequency.setTargetAtTime(260 + normRpm * 740, now, 0.06);
      engineNodes.cavitation.g.gain.setTargetAtTime(0.05 + thr * 0.36, now, 0.06);
      engineNodes.hydroAmbience.f.frequency.setTargetAtTime(95 + thr * 90, now, 0.08);
      if (ex.creak && now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 1.15;
        tone(142, 0.32, 'sawtooth', 0.055, 0, 96);
      }
      rawVol = 0.024 + thr * 0.036;
    } else if (p === 'marine-ship' || p === 'steam-liner') {
      const f = 26 + thr * 34;
      engineNodes.osc1.o.frequency.setTargetAtTime(f, now, 0.08);
      engineNodes.osc2.o.frequency.setTargetAtTime(f * 2, now, 0.08);
      engineNodes.bowWave.f.frequency.setTargetAtTime(280 + thr * 380, now, 0.08);
      engineNodes.bowWave.g.gain.setTargetAtTime(0.16 + thr * 0.42, now, 0.08);
      rawVol = 0.022 + thr * 0.04;
    } else if (p === 'bullet-train' || p === 'maglev-train') {
      const spd = Number(ex.speed ?? (thr * 360)) || 0;
      const spdNorm = Math.max(0, Math.min(1, spd / 500));
      // Authentic Shinkansen / Fuxing SiC VVVF stepped musical inverter sweep at low-mid speed!
      const stepFreq = p === 'bullet-train' && spd < 140
        ? [196, 220, 261.6, 293.7, 329.6, 392][Math.min(5, Math.floor(spd / 24))]
        : 220 + spdNorm * 620;
      engineNodes.inverter1.o.frequency.setTargetAtTime(stepFreq, now, 0.045);
      engineNodes.inverter2.o.frequency.setTargetAtTime(stepFreq * 1.5, now, 0.045);
      engineNodes.railOrAero.f.frequency.setTargetAtTime(320 + spdNorm * 880, now, 0.06);
      engineNodes.railOrAero.g.gain.setTargetAtTime(spdNorm * 0.45, now, 0.06);
      rawVol = spd < 1 ? 0.004 : 0.018 + spdNorm * 0.048;
    } else if (p === 'iron-man-flight') {
      engineNodes.osc1.o.frequency.setTargetAtTime(240 + normRpm * 520, now, 0.05);
      engineNodes.osc2.o.frequency.setTargetAtTime(720 + normRpm * 1560, now, 0.05);
      engineNodes.plasmaRush.f.frequency.setTargetAtTime(750 + thr * 1650, now, 0.05);
      rawVol = 0.022 + thr * 0.05;
    } else if (p === 'industrial-arm' || p === 'mars-rover' || p === 'quadruped-robot') {
      const sFreq = (p === 'mars-rover' ? 190 : 250) + normRpm * 420;
      engineNodes.servo1.o.frequency.setTargetAtTime(sFreq, now, 0.05);
      engineNodes.servo2.o.frequency.setTargetAtTime(sFreq * 2.0, now, 0.05);
      engineNodes.gearNoise.f.frequency.setTargetAtTime(780 + normRpm * 900, now, 0.06);
      rawVol = 0.016 + thr * 0.026;
    } else if (p === 'heavy-excavator' || p === 'tower-crane' || p === 'combine-harvester') {
      const dFreq = p === 'tower-crane' ? 58 + normRpm * 65 : 38 + normRpm * 56;
      engineNodes.diesel.o.frequency.setTargetAtTime(dFreq, now, 0.06);
      engineNodes.hydPump.o.frequency.setTargetAtTime(380 + thr * 420, now, 0.06);
      engineNodes.filter.frequency.setTargetAtTime(190 + thr * 340, now, 0.06);
      rawVol = 0.024 + thr * 0.036;
    } else if (p === 'dyson-cyclone') {
      // 125,000 RPM Hyperdymium high-pitched turbine whistle + cyclonic suction rush
      const wFreq = 1350 + thr * 2650;
      engineNodes.impeller1.o.frequency.setTargetAtTime(wFreq, now, 0.045);
      engineNodes.impeller2.o.frequency.setTargetAtTime(wFreq * 1.98, now, 0.045);
      engineNodes.cycloneAir.f.frequency.setTargetAtTime(1200 + thr * 2400, now, 0.05);
      rawVol = 0.02 + thr * 0.048;
    } else if (p === 'fridge-inverter') {
      const hz = Number(ex.hz ?? (35 + thr * 75));
      engineNodes.comp1.o.frequency.setTargetAtTime(hz, now, 0.08);
      engineNodes.comp2.o.frequency.setTargetAtTime(hz * 2, now, 0.08);
      engineNodes.evapFan.f.frequency.setTargetAtTime(340 + thr * 420, now, 0.08);
      rawVol = 0.014 + thr * 0.022;
    } else if (p === 'escalator-drive' || p === 'elevator-traction') {
      const spdNorm = Math.max(0, Math.min(1.2, thr));
      engineNodes.motor1.o.frequency.setTargetAtTime(85 + spdNorm * 135, now, 0.06);
      engineNodes.motor2.o.frequency.setTargetAtTime(170 + spdNorm * 270, now, 0.06);
      rawVol = spdNorm < 0.05 ? 0.002 : 0.016 + spdNorm * 0.026;
      // Rhythmic die-cast aluminum escalator step-cleat cadence
      if (p === 'escalator-drive' && spdNorm > 0.12 && now >= engineNodes.nextPulseTime) {
        const stepHz = 1.4 + spdNorm * 2.4;
        engineNodes.nextPulseTime = now + 1 / stepHz;
        noiseBurst({ kind: 'pink', duration: 0.035, freq: 520, q: 2.5, gainVal: 0.026 });
      }
    } else if (p === 'toilet-siphon') {
      const phase = ex.phase || 'flushing';
      if (phase === 'flushing') {
        engineNodes.waterRush.f.frequency.setTargetAtTime(780, now, 0.08);
        engineNodes.waterRush.g.gain.setTargetAtTime(0.55, now, 0.08);
        engineNodes.siphonGurgle.f.frequency.setTargetAtTime(240, now, 0.08);
        engineNodes.siphonGurgle.g.gain.setTargetAtTime(0.24, now, 0.08);
        rawVol = 0.042;
      } else if (phase === 'siphon') {
        engineNodes.waterRush.f.frequency.setTargetAtTime(420, now, 0.08);
        engineNodes.waterRush.g.gain.setTargetAtTime(0.38, now, 0.08);
        engineNodes.siphonGurgle.f.frequency.setTargetAtTime(135, now, 0.08);
        engineNodes.siphonGurgle.g.gain.setTargetAtTime(0.68, now, 0.08);
        rawVol = 0.048;
      } else {
        // Ballcock cistern refill hiss
        engineNodes.waterRush.f.frequency.setTargetAtTime(2400, now, 0.1);
        engineNodes.waterRush.g.gain.setTargetAtTime(0.28, now, 0.1);
        engineNodes.siphonGurgle.g.gain.setTargetAtTime(0.04, now, 0.1);
        rawVol = 0.022;
      }
    } else if (p === 'espresso-brew') {
      const steaming = Boolean(ex.steaming);
      const bar = Number(ex.pressure ?? 9);
      engineNodes.pumpBuzz.o.frequency.setTargetAtTime(58 + (bar > 5 ? 2 : -4), now, 0.05);
      engineNodes.pumpBuzz.g.gain.setTargetAtTime(bar > 2 ? 0.22 : 0.04, now, 0.05);
      engineNodes.steamHiss.g.gain.setTargetAtTime(steaming ? 0.28 : 0.01, now, 0.06);
      rawVol = 0.028 + (steaming ? 0.016 : 0);
    } else if (p === 'laptop-fan' || p === 'gaming-console') {
      engineNodes.blowerAir.f.frequency.setTargetAtTime(650 + thr * 1350, now, 0.08);
      engineNodes.fanBlade.o.frequency.setTargetAtTime(140 + thr * 280, now, 0.08);
      rawVol = 0.008 + thr * 0.032;
    } else if (p === 'spatial-xr') {
      const ancFrac = Math.max(0, Math.min(1, Number(ex.ancFrac ?? thr)));
      // Active Noise Cancellation: cabin noise drops dramatically as ANC deepens!
      engineNodes.cabinNoise.g.gain.setTargetAtTime(0.42 * (1 - ancFrac * 0.92), now, 0.08);
      engineNodes.pad1.g.gain.setTargetAtTime(0.06 + ancFrac * 0.12, now, 0.08);
      engineNodes.pad2.g.gain.setTargetAtTime(0.05 + ancFrac * 0.09, now, 0.08);
      engineNodes.pad3.g.gain.setTargetAtTime(0.03 + ancFrac * 0.07, now, 0.08);
      rawVol = 0.028;
    } else if (p === 'cinema-tv') {
      const volFrac = Math.max(0, Math.min(1, thr));
      const chordFreqs = [65.41, 73.42, 55.0];
      const rootF = chordFreqs[Number(ex.idx || 0) % 3];
      engineNodes.subBass.o.frequency.setTargetAtTime(rootF, now, 0.08);
      engineNodes.warmPad.o.frequency.setTargetAtTime(rootF * 3, now, 0.08);
      rawVol = volFrac * 0.038;
    } else if (p === 'orbital-spacecraft' || p === 'smart-home') {
      const active = ex.active !== false;
      rawVol = active ? 0.014 + thr * 0.014 : 0.002;
    } else if (p === 'horology-watch') {
      // 28,800 BPH = 8 escapement ticks/sec (accelerates smoothly in time-lapse boost!)
      const running = ex.running !== false;
      const mult = Math.max(1, Math.min(4, Number(ex.speedMult || 1)));
      const rateHz = 8 * mult;
      if (running && now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 1 / rateHz;
        engineNodes.pulseToggle = !engineNodes.pulseToggle;
        tone(engineNodes.pulseToggle ? 3650 : 4250, 0.009, 'triangle', 0.038, 0, 2400);
      }
      rawVol = 0.004;
    } else if (p === 'horology-clock') {
      // Grandfather pendulum 1.0 Hz deadbeat anchor escapement: woody-brass 'TICK... TOCK...'
      const mult = Math.max(1, Math.min(4, Number(ex.speedMult || 1)));
      if (now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 1 / mult;
        engineNodes.pulseToggle = !engineNodes.pulseToggle;
        const f = engineNodes.pulseToggle ? 980 : 740;
        tone(f, 0.026, 'triangle', 0.065, 0, f * 0.62);
      }
      rawVol = 0.004;
    } else if (p === 'camera-imax') {
      // 24 fps 65mm 15-perf Rolling-Loop mechanical celluloid film transport clatter when rolling!
      const fps = Number(ex.fps || 1);
      if (fps >= 10 && now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 1 / Math.min(24, fps);
        noiseBurst({ kind: 'white', duration: 0.016, freq: 2400, q: 2.4, gainVal: 0.045 });
        tone(620, 0.014, 'triangle', 0.032, 0, 380);
      }
      rawVol = 0.004;
    } else if (p === 'camera-mirrorless') {
      const fps = Number(ex.fps || 1);
      if (fps >= 10 && now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 1 / Math.min(16, fps);
        playShutterClick(false);
      }
      rawVol = 0.004;
    } else if (p === 'pin-lock') {
      const aligned = Number(ex.aligned ?? 0);
      const unlocked = Boolean(ex.unlocked);
      if (engineNodes.prevAligned !== undefined && aligned !== engineNodes.prevAligned && aligned > 0 && now >= engineNodes.nextPulseTime) {
        engineNodes.nextPulseTime = now + 0.045;
        tone(1900 + aligned * 185, 0.018, 'triangle', 0.045, 0, 1450);
      }
      if (engineNodes.prevUnlocked !== undefined && unlocked !== engineNodes.prevUnlocked) {
        tone(unlocked ? 260 : 210, 0.045, 'triangle', 0.07, 0, 120);
      }
      engineNodes.prevAligned = aligned;
      engineNodes.prevUnlocked = unlocked;
      rawVol = 0.004;
    }

    engineNodes.lastTargetVol = rawVol;
    const effectiveVol = speakingActive ? 0.001 : rawVol;
    engineNodes.masterGain.gain.setTargetAtTime(effectiveVol, now, 0.05);
  } catch {
    // ignore
  }
}

export function stopEngineSound() {
  if (!engineNodes) return;
  try {
    for (const s of engineNodes.sources || []) {
      try {
        s.stop();
      } catch {
        // ignore
      }
    }
    for (const n of engineNodes.disconnectors || []) {
      try {
        n.disconnect();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  engineNodes = null;
}

// ============================================================================
// Realistic One-Shot Object Action & Mechanical Foley Sound Effects
// ============================================================================
function playShutterClick(withRollerEject = false) {
  // First curtain + mirror/blade snap + second curtain 24ms later
  noiseBurst({ kind: 'white', duration: 0.018, freq: 3200, q: 2.0, gainVal: 0.12 });
  tone(920, 0.018, 'triangle', 0.09, 0, 340);
  noiseBurst({ kind: 'white', duration: 0.022, delay: 0.026, freq: 2600, q: 1.8, gainVal: 0.11 });
  tone(740, 0.022, 'triangle', 0.08, 0.026, 280);
  if (withRollerEject) {
    // Polaroid motorized developer-roller film eject whirr!
    tone(310, 0.42, 'sawtooth', 0.055, 0.06, 365);
    noiseBurst({ kind: 'pink', duration: 0.42, delay: 0.06, freq: 1150, q: 2.2, gainVal: 0.055 });
  }
}

export function playHorn(categoryId = 'car', modelId = '') {
  const profile = resolveSoundProfile(categoryId, modelId);
  lastTriggerSoundName = `horn:${profile}`;
  if (profile === 'road-bike' || profile === 'ebike') {
    // Crisp metallic brass bicycle handlebar bell ('ding-ring-ring!')
    tone(2093, 0.52, 'sine', 0.13, 0);
    tone(4186, 0.36, 'sine', 0.06, 0);
    tone(2093, 0.48, 'sine', 0.11, 0.11);
    tone(3136, 0.32, 'triangle', 0.05, 0.11);
    return;
  }
  if (profile === 'steam-liner') {
    // RMS Titanic 3-chime brass steam whistle + steam hiss!
    tone(146.83, 0.68, 'sawtooth', 0.09, 0);
    tone(185.0, 0.68, 'triangle', 0.08, 0);
    tone(220.0, 0.68, 'triangle', 0.07, 0);
    noiseBurst({ kind: 'pink', duration: 0.65, freq: 1400, q: 1.1, gainVal: 0.06 });
    return;
  }
  if (profile === 'marine-ship') {
    // Deep reverberant ocean ship Typhoon foghorn (65 Hz + 82 Hz)
    tone(65.41, 0.72, 'sawtooth', 0.13, 0, 64.5);
    tone(82.41, 0.72, 'triangle', 0.11, 0, 81.5);
    return;
  }
  if (profile === 'bullet-train' || profile === 'maglev-train') {
    // High-speed rail two-tone air horn (E4 + G#4)
    tone(329.63, 0.36, 'sawtooth', 0.095, 0);
    tone(415.3, 0.36, 'sawtooth', 0.095, 0);
    return;
  }
  if (profile === 'ev-drive') {
    // Modern EV futuristic dual-harmonic pedestrian/cyber horn
    tone(392.0, 0.26, 'triangle', 0.11, 0);
    tone(493.88, 0.26, 'sine', 0.11, 0);
    return;
  }
  if (profile === 'v4-moto') {
    tone(466.16, 0.24, 'sawtooth', 0.1, 0);
    tone(587.33, 0.24, 'triangle', 0.09, 0);
    return;
  }
  // Classic automotive dual-tone klaxon (F4 + A4)
  tone(349.23, 0.28, 'sawtooth', 0.095, 0, 349.23);
  tone(440.0, 0.28, 'sawtooth', 0.095, 0, 440.0);
}

export function playSimTriggerSound(triggerName, categoryId = '', modelId = '') {
  const trig = String(triggerName || '').toLowerCase();
  const profile = resolveSoundProfile(categoryId, modelId);
  lastTriggerSoundName = `${trig}:${profile}`;

  if (trig === 'horn') {
    playHorn(categoryId, modelId);
    return;
  }
  if (trig === 'reset') {
    tone(520, 0.07, 'triangle', 0.09, 0, 390);
    return;
  }
  // Submarine sonar ping & periscope hydraulic actuator
  if (profile === 'submarine-hydro') {
    if (trig === 'periscope') {
      // Hydraulic mast actuator whirr + resonant 1,480 Hz Active Sonar Ping + ocean echo!
      tone(220, 0.18, 'sawtooth', 0.05, 0, 290);
      tone(1480, 0.42, 'sine', 0.14, 0.12, 1472);
      tone(1480, 0.32, 'sine', 0.045, 0.46, 1468);
      return;
    }
    if (trig === 'lights') {
      // Floodlight relay click + high-frequency sonar chirp
      tone(980, 0.025, 'triangle', 0.08, 0, 620);
      tone(1480, 0.28, 'sine', 0.11, 0.03, 1474);
      return;
    }
  }
  // Aircraft & Iron Man triggers
  if (trig === 'unibeam') {
    // Rising repulsor capacitor charge whine -> Arc plasma blast!
    tone(380, 0.22, 'sine', 0.11, 0, 1950);
    noiseBurst({ kind: 'crackle', duration: 0.36, delay: 0.16, freq: 540, q: 0.9, gainVal: 0.14 });
    tone(110, 0.38, 'sawtooth', 0.12, 0.16, 62);
    return;
  }
  if (trig === 'gear') {
    // Hydraulic landing-gear actuator whirr + mechanical uplock/downlock clunk
    tone(280, 0.26, 'sawtooth', 0.055, 0, 340);
    tone(135, 0.09, 'triangle', 0.11, 0.24, 78);
    return;
  }
  if (trig === 'flaps') {
    tone(420, 0.2, 'triangle', 0.065, 0, 480);
    return;
  }
  // Train pantograph contact arc
  if (trig === 'pantograph') {
    noiseBurst({ kind: 'white', duration: 0.09, freq: 2800, q: 2.2, gainVal: 0.09 });
    tone(320, 0.12, 'sawtooth', 0.07, 0, 640);
    return;
  }
  // Orbital spacecraft RCS cold-gas burst & NASA Quindar beep
  if (trig === 'rcs') {
    noiseBurst({ kind: 'white', duration: 0.16, filterType: 'highpass', freq: 2200, q: 0.8, gainVal: 0.11 });
    return;
  }
  if (trig === 'solar') {
    // Authentic NASA Apollo / ISS Quindar intro tone (2,525 Hz, 250ms)
    tone(2525, 0.18, 'sine', 0.09, 0);
    return;
  }
  // Robotics tools (Laser welder / Mars SuperCam LIBS zap / LiDAR chirp)
  if (trig === 'tool') {
    if (profile === 'mars-rover') {
      tone(2400, 0.05, 'sawtooth', 0.12, 0, 420);
      noiseBurst({ kind: 'white', duration: 0.045, freq: 3600, q: 2.4, gainVal: 0.11 });
    } else if (profile === 'industrial-arm') {
      noiseBurst({ kind: 'crackle', duration: 0.24, freq: 2200, q: 1.5, gainVal: 0.1 });
    } else {
      tone(880, 0.08, 'sine', 0.09, 0, 1760);
    }
    return;
  }
  if (trig === 'bucket') {
    tone(165, 0.12, 'triangle', 0.11, 0, 88);
    noiseBurst({ kind: 'pink', duration: 0.1, freq: 480, q: 2.0, gainVal: 0.08 });
    return;
  }
  // Horology: Chronograph pusher snick & Westminster Quarters / Repeater Chime!
  if (trig === 'chrono') {
    tone(3200, 0.018, 'triangle', 0.1, 0, 1800);
    tone(2100, 0.025, 'sine', 0.08, 0.025, 1400);
    return;
  }
  if (trig === 'chime') {
    if (profile === 'horology-clock') {
      // Authentic 4-note Westminster Quarters tubular brass chime (E4 - G#4 - F#4 - B3)
      const notes = [329.63, 415.3, 369.99, 246.94];
      notes.forEach((n, idx) => {
        const d = idx === 3 ? 0.55 : 0.28;
        tone(n, d, 'sine', 0.13, idx * 0.24);
        tone(n * 2.0, d * 0.7, 'triangle', 0.045, idx * 0.24);
      });
    } else {
      // Swiss Minute Repeater double cathedral gong ('ting-tong!')
      tone(1318.5, 0.34, 'sine', 0.11, 0);
      tone(987.77, 0.42, 'sine', 0.11, 0.18);
    }
    return;
  }
  // Everyday appliances
  if (trig === 'flush') {
    tone(580, 0.045, 'triangle', 0.08, 0, 360); // Chrome trip lever clink
    noiseBurst({ kind: 'pink', duration: 0.36, delay: 0.04, freq: 920, endFreq: 340, q: 1.1, gainVal: 0.13 });
    return;
  }
  if (trig === 'lid') {
    tone(190, 0.08, 'sine', 0.09, 0, 95);
    return;
  }
  if (trig === 'shot') {
    tone(120, 0.06, 'sawtooth', 0.08, 0, 60); // 3-way brew solenoid clack
    noiseBurst({ kind: 'pink', duration: 0.22, delay: 0.04, freq: 720, q: 1.6, gainVal: 0.07 });
    return;
  }
  if (trig === 'steam') {
    noiseBurst({ kind: 'white', duration: 0.34, filterType: 'highpass', freq: 2600, q: 0.9, gainVal: 0.11 });
    return;
  }
  if (trig === 'doors') {
    tone(240, 0.22, 'sine', 0.06, 0, 190);
    noiseBurst({ kind: 'pink', duration: 0.22, freq: 460, q: 1.8, gainVal: 0.05 });
    return;
  }
  if (trig === 'express') {
    // Classic two-tone elevator floor arrival chime (G5 -> E5)
    tone(783.99, 0.22, 'sine', 0.12, 0);
    tone(659.25, 0.32, 'sine', 0.12, 0.18);
    return;
  }
  if (trig === 'key') {
    // 5 brass pin-stack bitting clicks sliding along notched key blade!
    [1950, 2250, 2550, 2380, 2820].forEach((f, i) => {
      tone(f, 0.022, 'triangle', 0.065, i * 0.032, f * 0.78);
    });
    return;
  }
  if (trig === 'bolt') {
    // Heavy hardened-steel deadbolt throw clunk
    tone(240, 0.065, 'triangle', 0.13, 0, 110);
    tone(860, 0.03, 'sine', 0.08, 0.02, 480);
    return;
  }
  if (trig === 'bin') {
    // Dyson polycarbonate dust-bin point-and-shoot latch release
    noiseBurst({ kind: 'white', duration: 0.035, freq: 1850, q: 2.0, gainVal: 0.11 });
    tone(340, 0.075, 'triangle', 0.1, 0.02, 165);
    return;
  }
  if (trig === 'ice') {
    // Auger crunch + 3 ice cubes clinking into a glass + chilled water splash
    noiseBurst({ kind: 'crackle', duration: 0.18, freq: 1450, q: 1.6, gainVal: 0.08 });
    [2650, 3120, 2890].forEach((f, i) => {
      tone(f, 0.055, 'sine', 0.085, 0.08 + i * 0.085, f * 0.92);
    });
    return;
  }
  if (trig === 'reverse') {
    tone(523.25, 0.1, 'triangle', 0.09, 0);
    tone(659.25, 0.12, 'triangle', 0.09, 0.09);
    return;
  }
  if (trig === 'estop') {
    // Heavy mechanical comb-plate safety brake clunk
    tone(155, 0.12, 'sawtooth', 0.12, 0, 68);
    noiseBurst({ kind: 'pink', duration: 0.08, freq: 420, q: 2.2, gainVal: 0.09 });
    return;
  }
  // Smartphones, Laptops, Houses, TVs, Gaming, Spatial XR & Cameras
  if (trig === 'haptic') {
    // Linear-resonant / DualSense voice-coil 160 Hz tactile thump + adaptive worm-gear whirr on gaming
    tone(165, 0.055, 'sine', 0.16, 0, 118);
    tone(235, 0.04, 'triangle', 0.09, 0.055, 160);
    if (profile.startsWith('gaming')) {
      tone(540, 0.09, 'sawtooth', 0.045, 0.02, 760);
    }
    return;
  }
  if (trig === 'rgb') {
    // Crystalline console lightbar synth chord
    tone(523.25, 0.16, 'sine', 0.085, 0);
    tone(783.99, 0.2, 'triangle', 0.075, 0.045);
    return;
  }
  if (trig === 'keypress') {
    // Rapid tactile scissor/mechanical keyboard switch clacks
    [0, 0.055, 0.105].forEach((d, i) => {
      noiseBurst({ kind: 'white', duration: 0.014, delay: d, freq: 2900 + i * 250, q: 2.5, gainVal: 0.08 });
      tone(680 + i * 70, 0.016, 'triangle', 0.055, d, 380);
    });
    return;
  }
  if (trig === 'camera' || trig === 'shutter') {
    if (profile === 'camera-imax') {
      // Heavy 65mm rotary mirror shutter clack
      noiseBurst({ kind: 'white', duration: 0.024, freq: 2100, q: 1.8, gainVal: 0.12 });
      tone(480, 0.035, 'triangle', 0.1, 0, 210);
    } else {
      playShutterClick(profile === 'camera-instant');
    }
    return;
  }
  if (trig === 'flash') {
    if (profile === 'camera-instant') {
      // Iconic 330V Xenon flash capacitor rising high-pitched charge whine + strobe pop!
      noiseBurst({ kind: 'white', duration: 0.02, freq: 3800, q: 1.4, gainVal: 0.12 });
      tone(1350, 0.42, 'sine', 0.065, 0.03, 4100);
    } else {
      noiseBurst({ kind: 'white', duration: 0.025, freq: 3600, q: 1.4, gainVal: 0.11 });
      tone(1600, 0.08, 'sine', 0.06, 0, 880);
    }
    return;
  }
  if (trig === 'spatial') {
    // 3D ray-traced spatial audio binaural shimmer arpeggio
    [587.33, 880.0, 1174.66, 1479.98].forEach((f, i) => {
      tone(f, 0.24, 'sine', 0.08, i * 0.045);
    });
    return;
  }
  if (trig === 'passthrough') {
    tone(740, 0.14, 'sine', 0.08, 0, 987.77);
    noiseBurst({ kind: 'pink', duration: 0.14, freq: 1800, q: 1.5, gainVal: 0.04 });
    return;
  }
  if (trig === 'daynight') {
    tone(440, 0.14, 'sine', 0.08, 0);
    tone(659.25, 0.18, 'sine', 0.08, 0.07);
    return;
  }
  if (trig === 'hvac') {
    tone(320, 0.045, 'triangle', 0.08, 0, 210);
    noiseBurst({ kind: 'pink', duration: 0.18, delay: 0.03, freq: 520, q: 1.2, gainVal: 0.05 });
    return;
  }
  if (trig === 'input') {
    tone(587.33, 0.08, 'sine', 0.09, 0);
    tone(880.0, 0.12, 'sine', 0.09, 0.06);
    return;
  }
  if (trig === 'lights' || trig === 'flashlight') {
    if (profile === 'fridge-inverter') {
      // Magnetic French-door gasket seal thup
      tone(185, 0.075, 'sine', 0.095, 0, 95);
    } else {
      // Tactile toggle switch click
      tone(1150, 0.024, 'triangle', 0.075, 0, 680);
    }
    return;
  }

  playPop(580);
}

export function playPop(freq = 520) {
  const base = Math.max(180, Math.min(1400, Number(freq) || 520));
  tone(base, 0.06, 'sine', 0.1, 0, base * 1.18);
}

export function playSnap(categoryId = '') {
  const cat = String(categoryId || '').toLowerCase();
  const isPrecision = /watch|iphone|phone|camera|audio-xr|laptop|gaming/.test(cat);
  if (isPrecision) {
    noiseBurst({ kind: 'white', duration: 0.016, freq: 3400, q: 2.5, gainVal: 0.08 });
    tone(880, 0.045, 'triangle', 0.1, 0, 1320);
  } else {
    // Mechanical torque-ratchet + solid lock-in snap
    noiseBurst({ kind: 'pink', duration: 0.028, freq: 1400, q: 2.0, gainVal: 0.08 });
    tone(340, 0.055, 'triangle', 0.12, 0, 580);
    tone(660, 0.08, 'triangle', 0.1, 0.038, 880);
  }
}

export function playWhoosh(exploding = true) {
  if (exploding) {
    noiseBurst({ kind: 'pink', duration: 0.24, freq: 320, endFreq: 1650, q: 1.2, gainVal: 0.09, attack: 0.02 });
    tone(210, 0.2, 'sine', 0.085, 0, 540);
  } else {
    noiseBurst({ kind: 'pink', duration: 0.22, freq: 1550, endFreq: 280, q: 1.2, gainVal: 0.09, attack: 0.02 });
    tone(520, 0.18, 'sine', 0.085, 0, 210);
    tone(390, 0.05, 'triangle', 0.08, 0.16, 520);
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
  'es-419': { degC: ' grados Celsius', degF: ' grados Fahrenheit', deg: ' grados', kmh: ' kilómetros por hora', mph: ' millas por hora', rpm: ' revoluciones por minuto' },
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
  es: /\b(Mónica|Monica|Marisol|Jorge|Elena|Paulina)\b/i,
  'es-419': /\b(Paulina|Sabina|Dalia|Juan|Paloma|Alonso|Angelica|Francisca|Mónica|Monica)\b/i,
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
    if (exactLocaleRe.test(vLang)) score += 45;
    else if (langCode === 'es-419' && /^es-(MX|419|US|CO|AR|CL|PE)/i.test(vLang)) score += 42;
    else if (langCode === 'es' && /^es-ES/i.test(vLang)) score += 42;
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
    engineRunning: Boolean(engineNodes),
    activeSoundProfile: engineNodes ? engineNodes.profile : null,
    activeSourceCount: engineNodes ? engineNodes.sources.length : 0,
    soundFxPlayedCount,
    lastTriggerSoundName,
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
