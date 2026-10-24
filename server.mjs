// Zero-dependency static file server for Inside Out Studio.
// - Listens on 127.0.0.1 only (never 0.0.0.0).
// - GET/HEAD only, strict allow-list of file types, path-traversal and dotfile guards.
// - Strict security headers (CSP, frame-ancestors, nosniff, Permissions-Policy, ...).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'app');
const HOST = '127.0.0.1';
const PORT = parsePort(process.env.PORT, 8137);

function parsePort(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d{1,5}$/.test(value)) throw new Error('PORT must be an integer between 1 and 65535');
  const n = Number(value);
  if (n < 1 || n > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  return n;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest', '.txt', '.wasm']);

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' blob: data:",
  "media-src 'none'",
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
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const gzipCache = new Map(); // absolute file path -> { mtimeMs, buf }

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function sendText(res, status, message, extra = {}) {
  send(res, status, { 'Content-Type': 'text/plain; charset=utf-8', ...extra }, message);
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

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }
  let pathname;
  try {
    pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  } catch {
    sendText(res, 400, 'Bad Request');
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
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache' };
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
