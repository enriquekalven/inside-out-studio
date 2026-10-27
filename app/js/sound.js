// Web Audio API synthesized sound effects + Web Speech API Read Aloud for Inside Out Studio.
// Zero external audio files or network calls. Respects the user's mute toggle.
import { getLangMeta } from './i18n.js';

let ctx = null;
let muted = false;

function getCtx() {
  if (muted) return null;
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
  try {
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + Math.min(0.015, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
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
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const filter = c.createBiquadFilter();
    const masterGain = c.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(58, c.currentTime);
    osc2.frequency.setValueAtTime(116, c.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, c.currentTime);
    filter.Q.setValueAtTime(2.5, c.currentTime);

    masterGain.gain.setValueAtTime(0.04, c.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(c.destination);

    osc1.start();
    osc2.start();
    engineNodes = { osc1, osc2, filter, masterGain };
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
      ? 140 + normRpm * 520
      : 48 + normRpm * 210;
    const subFreq = isTurbineOrEV
      ? baseFreq * 1.5
      : baseFreq * 2.0;
    engineNodes.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    engineNodes.osc2.frequency.setTargetAtTime(subFreq, now, 0.04);
    engineNodes.filter.frequency.setTargetAtTime(
      240 + normRpm * 1400 + throttle * 650,
      now,
      0.05,
    );
    const vol = 0.032 + normRpm * 0.055 + throttle * 0.035;
    engineNodes.masterGain.gain.setTargetAtTime(vol, now, 0.05);
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
  // Dual-tone automotive sports horn (F4 + A4 chord)
  tone(349.23, 0.28, 'sawtooth', 0.11, 0, 349.23);
  tone(440.0, 0.28, 'sawtooth', 0.11, 0, 440.0);
}

export function playPop(freq = 520) {
  tone(freq, 0.08, 'triangle', 0.15, 0, freq * 1.35);
}

export function playSnap() {
  tone(380, 0.06, 'triangle', 0.16, 0, 760);
  tone(760, 0.09, 'sine', 0.12, 0.045, 980);
}

export function playWhoosh(exploding = true) {
  if (exploding) {
    tone(190, 0.24, 'sine', 0.13, 0, 620);
    tone(280, 0.22, 'triangle', 0.09, 0.04, 840);
  } else {
    tone(620, 0.22, 'sine', 0.13, 0, 210);
    tone(480, 0.2, 'triangle', 0.09, 0.04, 320);
  }
}

export function playCorrect() {
  tone(523.25, 0.11, 'triangle', 0.15, 0);      // C5
  tone(659.25, 0.11, 'triangle', 0.15, 0.09);   // E5
  tone(783.99, 0.18, 'triangle', 0.16, 0.18);   // G5
}

export function playOops() {
  tone(310, 0.12, 'sawtooth', 0.09, 0, 250);
  tone(240, 0.18, 'sawtooth', 0.09, 0.1, 185);
}

export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, idx) => {
    tone(n, idx === notes.length - 1 ? 0.34 : 0.12, 'triangle', 0.16, idx * 0.1);
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function speakText(text) {
  if (muted || !text || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(String(text));
    const meta = getLangMeta();
    const speechLang = meta?.speechLang || 'en-US';
    utter.lang = speechLang;
    utter.rate = 0.96;
    utter.pitch = 1.04;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    let matchVoice = null;
    if (meta?.code === 'zh-HK') {
      matchVoice =
        voices.find((v) => v.localService && /zh[-_]HK|yue/i.test(v.lang)) ||
        voices.find((v) => /zh[-_]HK|yue/i.test(v.lang) || /cantonese|hong\s*kong|sin[-_]?ji/i.test(v.name)) ||
        voices.find((v) => /^zh/i.test(v.lang));
    } else if (meta?.code === 'zh-CN') {
      matchVoice =
        voices.find((v) => v.localService && /zh[-_](CN|SG)|cmn/i.test(v.lang)) ||
        voices.find((v) => /zh[-_](CN|SG)|cmn/i.test(v.lang)) ||
        voices.find((v) => /^zh/i.test(v.lang));
    } else {
      const prefix = speechLang.split('-')[0].toLowerCase();
      const exactRe = new RegExp(`^${speechLang.replace('-', '[-_]')}`, 'i');
      const prefixRe = new RegExp(`^${prefix}\\b`, 'i');
      matchVoice =
        voices.find((v) => v.localService && exactRe.test(v.lang)) ||
        voices.find((v) => exactRe.test(v.lang)) ||
        voices.find((v) => v.localService && prefixRe.test(v.lang)) ||
        voices.find((v) => prefixRe.test(v.lang));
    }
    if (matchVoice) utter.voice = matchVoice;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}
