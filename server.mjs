// Zero-dependency static file + Google Cloud Chirp 3 HD TTS proxy server for Inside Out Studio.
// - Listens on 127.0.0.1 only (never 0.0.0.0).
// - Static files: GET/HEAD only, strict allow-list of file types, path-traversal and dotfile guards.
// - Same-origin BFF TTS proxy: GET /api/tts/status and POST /api/tts using Google Cloud Chirp 3 HD (Aoede).
// - Strict security headers (CSP, frame-ancestors, nosniff, Permissions-Policy, ...).
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.join(PROJECT_DIR, 'app');
const TTS_CACHE_DIR = path.join(PROJECT_DIR, '.tts_cache');
const HOST = '127.0.0.1';
const PORT = parsePort(process.env.PORT, 8137);
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'project-maui';
const MAX_TTS_BODY_BYTES = 4096;

function parsePort(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d{1,5}$/.test(value)) throw new Error('PORT must be an integer between 1 and 65535');
  const n = Number(value);
  if (n < 1 || n > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  return n;
}

// Strict allow-list of all 13 supported languages -> Google Cloud Chirp 3 HD voices
const CHIRP_VOICE_MAP = Object.freeze({
  en: { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Aoede' },
  'zh-CN': { languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Aoede' },
  'zh-HK': { languageCode: 'yue-HK', name: 'yue-HK-Chirp3-HD-Aoede' },
  es: { languageCode: 'es-ES', name: 'es-ES-Chirp3-HD-Aoede' },
  'es-419': { languageCode: 'es-US', name: 'es-US-Chirp3-HD-Aoede' },
  fr: { languageCode: 'fr-FR', name: 'fr-FR-Chirp3-HD-Aoede' },
  de: { languageCode: 'de-DE', name: 'de-DE-Chirp3-HD-Aoede' },
  nl: { languageCode: 'nl-NL', name: 'nl-NL-Chirp3-HD-Aoede' },
  pt: { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Aoede' },
  it: { languageCode: 'it-IT', name: 'it-IT-Chirp3-HD-Aoede' },
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Chirp3-HD-Aoede' },
  ko: { languageCode: 'ko-KR', name: 'ko-KR-Chirp3-HD-Aoede' },
  ar: { languageCode: 'ar-XA', name: 'ar-XA-Chirp3-HD-Aoede' },
});

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest', '.txt', '.wasm']);

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  "connect-src 'self' blob: data: https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com https://firebaseinstallations.googleapis.com",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const gzipCache = new Map(); // absolute file path -> { mtimeMs, buf }

let cachedAccessToken = null;
let cachedTokenExpiresAt = 0;

function getGcloudAccessToken() {
  if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
    return Promise.resolve(process.env.GOOGLE_CLOUD_ACCESS_TOKEN.trim());
  }
  const now = Date.now();
  if (cachedAccessToken && now < cachedTokenExpiresAt) {
    return Promise.resolve(cachedAccessToken);
  }
  return new Promise((resolve) => {
    const metricsEnv = process.env.CLOUDSDK_METRICS_ENVIRONMENT
      ? `${process.env.CLOUDSDK_METRICS_ENVIRONMENT} datacloud.antigravity`
      : 'datacloud.antigravity';
    execFile(
      'gcloud',
      ['auth', 'print-access-token'],
      {
        timeout: 4500,
        env: { ...process.env, CLOUDSDK_METRICS_ENVIRONMENT: metricsEnv },
      },
      (err, stdout) => {
        if (err || !stdout) {
          resolve(null);
          return;
        }
        const token = String(stdout).trim();
        if (!token) {
          resolve(null);
          return;
        }
        cachedAccessToken = token;
        cachedTokenExpiresAt = Date.now() + 45 * 60 * 1000;
        resolve(token);
      },
    );
  });
}

// Prepare text for Chirp 3 HD sentence tokenizer (especially CJK <= 40 chars per sentence with ASCII '. ')
function prepareChirpText(rawText, langKey) {
  const cleaned = String(rawText || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
  if (!cleaned) return '';

  const isCJK = langKey === 'zh-CN' || langKey === 'zh-HK' || langKey === 'ja';
  if (isCJK) {
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

  // Non-CJK: ensure no single sentence exceeds 220 chars for Chirp 3 HD
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

function synthesizeChirpMp3(preparedText, voiceCfg, accessToken) {
  const payload = JSON.stringify({
    input: { text: preparedText },
    voice: {
      languageCode: voiceCfg.languageCode,
      name: voiceCfg.name,
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
          Authorization: `Bearer ${accessToken}`,
          'x-goog-user-project': GCP_PROJECT,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) {
            reject(new Error(`TTS_UPSTREAM_${res.statusCode}`));
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            if (!parsed.audioContent) {
              reject(new Error('TTS_EMPTY_AUDIO'));
              return;
            }
            resolve(Buffer.from(parsed.audioContent, 'base64'));
          } catch {
            reject(new Error('TTS_PARSE_ERROR'));
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error('TTS_TIMEOUT'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function sendText(res, status, message, extra = {}) {
  send(res, status, { 'Content-Type': 'text/plain; charset=utf-8', ...extra }, message);
}

function sendJson(res, status, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  send(
    res,
    status,
    {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': body.length,
    },
    body,
  );
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Payload Too Large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed);
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// Resolve a URL path to a file inside ROOT, or null if it escapes ROOT / targets a dotfile.
function resolveSafe(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const resolved = path.resolve(ROOT, '.' + path.posix.normalize('/' + decoded));
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  const rel = path.relative(ROOT, resolved);
  if (rel.split(path.sep).some((segment) => segment.startsWith('.'))) return null;
  return resolved;
}

async function handleTtsStatus(_req, res) {
  const token = await getGcloudAccessToken();
  sendJson(res, 200, {
    available: Boolean(token),
    engine: 'chirp3-hd',
    voices: CHIRP_VOICE_MAP,
  });
}

async function handleTtsSynthesize(req, res) {
  if (req.headers['x-requested-with'] !== 'InsideOutStudio') {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('application/json')) {
    sendJson(res, 415, { error: 'Unsupported Media Type' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req, MAX_TTS_BODY_BYTES);
  } catch (err) {
    sendJson(res, err.statusCode || 400, { error: err.message || 'Bad Request' });
    return;
  }

  const langKey = typeof body?.lang === 'string' ? body.lang.trim() : '';
  const rawText = typeof body?.text === 'string' ? body.text.trim() : '';
  const voiceCfg = Object.prototype.hasOwnProperty.call(CHIRP_VOICE_MAP, langKey)
    ? CHIRP_VOICE_MAP[langKey]
    : null;

  if (!voiceCfg || !rawText) {
    sendJson(res, 400, { error: 'Invalid lang or empty text' });
    return;
  }

  const preparedText = prepareChirpText(rawText, langKey);
  if (!preparedText) {
    sendJson(res, 400, { error: 'Empty prepared text' });
    return;
  }

  const cacheHash = crypto
    .createHash('sha256')
    .update(`${voiceCfg.name}|${preparedText}`)
    .digest('hex');
  const cacheFile = path.join(TTS_CACHE_DIR, `${cacheHash}.mp3`);

  try {
    const cachedMp3 = await fs.promises.readFile(cacheFile);
    if (cachedMp3.length > 128) {
      send(
        res,
        200,
        {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
          'X-Chirp-Voice': voiceCfg.name,
          'X-Chirp-Cache': 'HIT',
          'Content-Length': cachedMp3.length,
        },
        cachedMp3,
      );
      return;
    }
  } catch {
    // Cache miss
  }

  const token = await getGcloudAccessToken();
  if (!token) {
    sendJson(res, 503, { error: 'Chirp TTS credentials unavailable' });
    return;
  }

  try {
    const mp3Buf = await synthesizeChirpMp3(preparedText, voiceCfg, token);
    await fs.promises.mkdir(TTS_CACHE_DIR, { recursive: true });
    await fs.promises.writeFile(cacheFile, mp3Buf);
    send(
      res,
      200,
      {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-Chirp-Voice': voiceCfg.name,
        'X-Chirp-Cache': 'MISS',
        'Content-Length': mp3Buf.length,
      },
      mp3Buf,
    );
  } catch (err) {
    if (String(err?.message || '').includes('401')) {
      cachedAccessToken = null;
      cachedTokenExpiresAt = 0;
    }
    sendJson(res, 502, { error: 'Chirp synthesis failed' });
  }
}

async function handle(req, res) {
  let pathname;
  try {
    pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  } catch {
    sendText(res, 400, 'Bad Request');
    return;
  }

  if (pathname === '/api/tts/status' && req.method === 'GET') {
    await handleTtsStatus(req, res);
    return;
  }
  if (pathname === '/api/tts' && req.method === 'POST') {
    await handleTtsSynthesize(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD, POST' });
    return;
  }
  let filePath = resolveSafe(pathname);
  if (!filePath) {
    sendText(res, 404, 'Not Found');
    return;
  }
  let stat;
  try {
    stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = await fs.promises.stat(filePath);
    }
  } catch {
    sendText(res, 404, 'Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext];
  if (!stat.isFile() || !type) {
    sendText(res, 404, 'Not Found');
    return;
  }
  const cacheHeader = ext === '.mp3' || ext === '.glb' ? 'public, max-age=86400' : 'no-cache';
  const headers = { 'Content-Type': type, 'Cache-Control': cacheHeader };
  let body = await fs.promises.readFile(filePath);
  const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
  if (acceptsGzip && COMPRESSIBLE.has(ext) && body.length > 1024) {
    const cached = gzipCache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      body = cached.buf;
    } else {
      const buf = zlib.gzipSync(body, { level: 6 });
      gzipCache.set(filePath, { mtimeMs: stat.mtimeMs, buf });
      body = buf;
    }
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  send(res, 200, headers, req.method === 'HEAD' ? undefined : body);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    // Generic message to the client; short diagnostic (no request data) to stderr.
    console.error('server error:', err && err.code ? err.code : 'unknown');
    if (!res.headersSent) sendText(res, 500, 'Internal Server Error');
    else res.destroy();
  });
});

server.on('clientError', (_err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, HOST, () => {
  console.log(`Inside Out Studio running at http://${HOST}:${PORT}/  (Ctrl+C to stop)`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
