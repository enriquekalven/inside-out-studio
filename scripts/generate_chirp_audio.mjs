// Pre-synthesizes Studio Google Cloud Chirp 3 HD (Aoede) MP3 narrations across all 13 languages
// (`en`, `zh-CN`, `zh-HK`, `es`, `es-419`, `fr`, `de`, `nl`, `pt`, `it`, `ja`, `ko`, `ar`) for Inside Out Studio,
// saving MP3 assets to `app/assets/audio/chirp/<lang>/<key>.mp3` and generating `app/js/audio_manifest.js`.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Minimal DOM canvas stub so catalog.js -> materials.js can be imported cleanly in Node
const ctxStub = new Proxy(
  {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createImageData: (w = 64, h = 64) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (_x, _y, w = 64, h = 64) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  },
  { get: (target, prop) => (prop in target ? target[prop] : () => {}) },
);
globalThis.document = {
  documentElement: { lang: 'en', dir: 'ltr' },
  createElement: () => ({
    width: 64,
    height: 64,
    getContext: () => ctxStub,
  }),
};

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_ROOT = path.join(PROJECT_DIR, 'app', 'assets', 'audio', 'chirp');
const MANIFEST_PATH = path.join(PROJECT_DIR, 'app', 'js', 'audio_manifest.js');
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'project-maui';

const { OBJECTS } = await import('../app/js/catalog.js');
const { LANGUAGES, setLang, t, tPart } = await import('../app/js/i18n.js');
const { cleanTextForSpeech } = await import('../app/js/sound.js');

function getAccessToken() {
  if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
    return process.env.GOOGLE_CLOUD_ACCESS_TOKEN.trim();
  }
  const metricsEnv = process.env.CLOUDSDK_METRICS_ENVIRONMENT
    ? `${process.env.CLOUDSDK_METRICS_ENVIRONMENT} datacloud.antigravity`
    : 'datacloud.antigravity';
  return execFileSync('gcloud', ['auth', 'print-access-token'], {
    encoding: 'utf8',
    env: { ...process.env, CLOUDSDK_METRICS_ENVIRONMENT: metricsEnv },
  }).trim();
}

function prepareChirpText(rawText, langKey) {
  const cleaned = cleanTextForSpeech(rawText, langKey)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
  if (!cleaned) return '';

  const isCJK = langKey === 'zh-CN' || langKey === 'zh-HK' || langKey === 'ja';
  if (isCJK) {
    // Digits and Latin acronyms expand into multi-syllable spoken words in CJK Chirp 3 HD;
    // split at every clause boundary and cap weighted length so no clause ever overflows phonemes.
    const clauses = cleaned
      .replace(/[。！？!?；;（）()，、,：:—–-]+/g, '\n')
      .replace(/\.\s+/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const out = [];
    for (const cl of clauses) {
      let chunk = '';
      let weight = 0;
      for (const ch of cl) {
        const w = /[0-9A-Za-z]/.test(ch) ? 2.2 : 1;
        if (weight + w > 18 && chunk.length > 0) {
          // Avoid splitting right inside a number or short English token if possible
          if (/[0-9A-Za-z.,]/.test(ch) && /[0-9A-Za-z]$/.test(chunk) && weight < 28) {
            chunk += ch;
            weight += w;
            continue;
          }
          out.push(chunk.trim());
          chunk = ch;
          weight = w;
        } else {
          chunk += ch;
          weight += w;
        }
      }
      if (chunk.trim()) out.push(chunk.trim());
    }
    return out.filter(Boolean).join('。 ') + '。';
  }

  const sentences = cleaned
    .split(/(?<=[.!?؟])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const normalized = [];
  for (const s of sentences) {
    if (s.length <= 220) {
      normalized.push(/[.!?؟]$/.test(s) ? s : `${s}.`);
    } else {
      const clauses = s.split(/[,;،]\s+/u).filter(Boolean);
      let buf = '';
      for (const cl of clauses) {
        if (buf && buf.length + 2 + cl.length > 200) {
          normalized.push(/[.!?؟]$/.test(buf) ? buf : `${buf}.`);
          buf = cl;
        } else {
          buf = buf ? `${buf}, ${cl}` : cl;
        }
      }
      if (buf) normalized.push(/[.!?؟]$/.test(buf) ? buf : `${buf}.`);
    }
  }
  return normalized.join(' ');
}

function synthesizeMp3(preparedText, chirpLangCode, chirpVoice, token) {
  const payload = JSON.stringify({
    input: { text: preparedText },
    voice: {
      languageCode: chirpLangCode,
      name: chirpVoice,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'texttospeech.googleapis.com',
        port: 443,
        path: '/v1/text:synthesize',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-goog-user-project': GCP_PROJECT,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 240)}`));
            return;
          }
          const parsed = JSON.parse(raw);
          resolve(Buffer.from(parsed.audioContent, 'base64'));
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const token = getAccessToken();
  const tasks = [];
  const studioKeys = new Set();

  // Pre-synthesize the primary & core-powertrain parts (parts[0] and parts[1]) of every flagship category model
  // across all 12 languages so static hosting plays real Chirp 3 HD immediately in every category & language.
  for (const obj of OBJECTS) {
    const modelId = obj.activeModelId || obj.models?.[0]?.id || obj.id;
    const targetParts = (obj.parts || []).slice(0, 2);
    for (const rawPart of targetParts) {
      const studioKey = `${modelId}__${rawPart.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      studioKeys.add(studioKey);
      for (const langMeta of LANGUAGES) {
        setLang(langMeta.code);
        const locPart = tPart(rawPart);
        const rawReadAloud = `${locPart.name}. ${locPart.desc} ${t('funFactPrefix', { fact: locPart.funFact })}`;
        const preparedText = prepareChirpText(rawReadAloud, langMeta.code);
        const outDir = path.join(AUDIO_ROOT, langMeta.code);
        const outFile = path.join(outDir, `${studioKey}.mp3`);
        tasks.push({
          langCode: langMeta.code,
          chirpLangCode: langMeta.chirpLangCode,
          chirpVoice: langMeta.chirpVoice,
          studioKey,
          preparedText,
          outDir,
          outFile,
        });
      }
    }
  }

  console.log(`Synthesizing ${tasks.length} Chirp 3 HD (Aoede) MP3 clips across ${LANGUAGES.length} languages...`);

  let completed = 0;
  let skipped = 0;
  let cursor = 0;
  const concurrency = 3;

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      const item = tasks[idx];
      fs.mkdirSync(item.outDir, { recursive: true });
      if (fs.existsSync(item.outFile) && fs.statSync(item.outFile).size > 512) {
        skipped++;
        continue;
      }
      let lastErr = null;
      for (let attempt = 1; attempt <= 7; attempt++) {
        try {
          const mp3 = await synthesizeMp3(
            item.preparedText,
            item.chirpLangCode,
            item.chirpVoice,
            token,
          );
          fs.writeFileSync(item.outFile, mp3);
          completed++;
          lastErr = null;
          await new Promise((r) => setTimeout(r, 240));
          break;
        } catch (err) {
          lastErr = err;
          const is429 = String(err.message || '').includes('429');
          const waitMs = is429 ? Math.min(35000, 4000 * attempt) : 600 * attempt;
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
      if (lastErr) {
        throw new Error(`Failed [${item.langCode}] ${item.studioKey}: ${lastErr.message}`);
      }
      if ((completed + skipped) % 48 === 0) {
        console.log(`  Progress: ${completed + skipped}/${tasks.length} clips ready...`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const sortedKeys = Array.from(studioKeys).sort();
  const langCodes = LANGUAGES.map((l) => l.code);
  const manifestSource = `// Auto-generated by scripts/generate_chirp_audio.mjs — DO NOT EDIT MANUALLY.
// Maps pre-synthesized Google Cloud Chirp 3 HD (Aoede) Studio narrations across all 12 languages.

export const CHIRP_STUDIO_LANGS = new Set(${JSON.stringify(langCodes)});

export const CHIRP_STUDIO_KEYS = new Set(${JSON.stringify(sortedKeys, null, 2)});

export function getStudioChirpAudioUrl(langCode, studioKey) {
  if (!langCode || !studioKey) return null;
  const safeKey = String(studioKey).replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!CHIRP_STUDIO_LANGS.has(langCode) || !CHIRP_STUDIO_KEYS.has(safeKey)) return null;
  return \`assets/audio/chirp/\${encodeURIComponent(langCode)}/\${safeKey}.mp3\`;
}
`;
  fs.writeFileSync(MANIFEST_PATH, manifestSource, 'utf8');
  console.log(
    `Done! Synthesized ${completed} new clips (${skipped} cached), total ${tasks.length} clips across ${langCodes.length} languages. Wrote app/js/audio_manifest.js.`,
  );
}

main().catch((err) => {
  console.error('Chirp generation failed:', err);
  process.exit(1);
});
