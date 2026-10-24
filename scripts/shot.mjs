// Dev visual-review harness: renders ONE category/model in headless Chrome and saves stage screenshots
// from several camera angles (plus exploded / x-ray / action-mode shots) for fast modeling iteration.
//
// Usage:
//   node scripts/shot.mjs --cat helicopters --model uh60-black-hawk --out /tmp/shots \
//        --views default,front34,side,rear34,top,close,exploded,xray,action --port 8151 --cdp 9361
// Views:
//   default | front34 | rear34 | side | front | rear | top | low | close | exploded | xray
//   action[:ms[:input]]   -> click the action button, optionally hold an input (up/down/boost/pitchUp...) for ms
//   cam:theta,phi,rScale  -> custom spherical camera (theta from +Z toward +X, phi from +Y), radius x default
// Exit code is non-zero if the page logged console errors / exceptions.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);
const CAT = args.cat || 'helicopters';
const MODEL = args.model || '';
const OUT = path.resolve(args.out || path.join(ROOT, 'screenshots', 'dev'));
const PREFIX = args.prefix || MODEL || CAT;
const VIEWS = (args.views || 'default,front34,side,rear34,top,close,exploded').split(',').filter(Boolean);
const PORT = Number(args.port || 8151);
const CDP_PORT = Number(args.cdp || 9361);
const WIDTH = Number(args.width || 1440);
const HEIGHT = Number(args.height || 900);
const FULL = args.full === 'true';
// --url https://example.web.app  -> test a deployed site instead of spawning the local server
const BASE_URL = args.url && args.url !== 'true' ? args.url.replace(/\/$/, '') : null;
const CHROME_BIN = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function waitHttp(url, ms = 8000) {
  const t0 = Date.now();
  for (;;) {
    try {
      await new Promise((resolve, reject) => http.get(url, (r) => (r.resume(), resolve())).on('error', reject));
      return;
    } catch (e) {
      if (Date.now() - t0 > ms) throw e;
      await sleep(120);
    }
  }
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.seq = 0;
    this.pending = new Map();
    this.errors = [];
  }
  async open() {
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'assert')) {
        this.errors.push((msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.errors.push(`${d.text} ${d.exception?.description || ''}`);
      } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        this.errors.push(`[${msg.params.entry.source}] ${msg.params.entry.text}`);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`eval failed: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`);
    return r.result?.value;
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-shot-'));
  const server = BASE_URL
    ? null
    : spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'ignore',
    });
  let chrome = null;
  let cdp = null;
  let failed = false;
  try {
    if (!BASE_URL) await waitHttp(`http://127.0.0.1:${PORT}/`);
    chrome = spawn(
      CHROME_BIN,
      [
        '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, '--no-first-run',
        '--no-default-browser-check', '--disable-extensions', '--mute-audio', '--enable-webgl', '--ignore-gpu-blocklist',
        `--window-size=${WIDTH},${HEIGHT}`, 'about:blank',
      ],
      { stdio: 'ignore' },
    );
    let targets = null;
    for (let i = 0; i < 60; i++) {
      try {
        targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (targets.length) break;
      } catch {
        // retry
      }
      await sleep(150);
    }
    const page = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: false });
    await cdp.send('Page.navigate', { url: BASE_URL ? `${BASE_URL}/` : `http://127.0.0.1:${PORT}/` });
    await sleep(BASE_URL ? 3500 : 900);
    // Capture the live StageViewer instance without touching app code (ES modules are singletons per URL).
    await cdp.eval(`import('/js/viewer.js').then((m) => {
      const P = m.StageViewer.prototype;
      if (!P.__shotPatched) { const orig = P._loop; P._loop = function () { window.__viewer = this; return orig.call(this); }; P.__shotPatched = true; }
      return true;
    })`);
    await cdp.eval(`document.querySelector('.obj-card[data-object-id="${CAT}"]')?.click()`);
    await sleep(700);
    if (MODEL) {
      const ok = await cdp.eval(`(() => { const p = document.querySelector('#model-selector .model-pill[data-model-id="${MODEL}"]'); if (p) { p.click(); return true; } return false; })()`);
      if (!ok) throw new Error(`model pill ${MODEL} not found in ${CAT}`);
      await sleep(900);
    }
    for (let i = 0; i < 40; i++) {
      if (await cdp.eval('Boolean(window.__viewer)')) break;
      await sleep(100);
    }
    const info = await cdp.eval(`(() => { const v = window.__viewer; const r = v.defaultSpherical; return {
      parts: [...v.partRecords.keys()], meshes: [...v.partRecords.values()].reduce((n, r) => n + r.meshes.length, 0),
      tris: v.renderer.info.render.triangles, calls: v.renderer.info.render.calls, radius: r.radius, phi: r.phi, theta: r.theta,
      floorY: v.stageFloorGroup.position.y } })()`);
    console.log(`model ${CAT}/${MODEL}: parts=${info.parts.length} meshes=${info.meshes} drawCalls=${info.calls} tris=${info.tris} camR=${info.radius.toFixed(2)} floorY=${info.floorY.toFixed(3)}`);
    console.log(`  part ids: ${info.parts.join(', ')}`);

    const rect = await cdp.eval(`(() => { const r = document.querySelector('#stage-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    const shoot = async (name) => {
      const params = { format: 'png' };
      if (!FULL) params.clip = { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 };
      const { data } = await cdp.send('Page.captureScreenshot', params);
      const file = path.join(OUT, `${PREFIX}-${name}.png`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`  saved ${file}`);
    };
    const setCam = async (theta, phi, rScale) => {
      await cdp.eval(`(() => { const v = window.__viewer; v.setExplode(0, true); v.setXrayMode(false);
        const r = v.defaultSpherical.radius * ${rScale};
        v.desiredSpherical.set(r, ${phi}, ${theta}); v.spherical.copy(v.desiredSpherical);
        v.desiredTarget.copy(v.defaultTarget || v.target); v.target.copy(v.desiredTarget); return true; })()`);
      await sleep(450);
    };
    const presets = {
      front34: [1.05, 1.18, 1.0],
      rear34: [-2.2, 1.18, 1.0],
      side: [0.0, 1.42, 1.0],
      front: [Math.PI / 2, 1.38, 0.95],
      rear: [-Math.PI / 2, 1.38, 0.95],
      top: [0.0, 0.18, 1.1],
      low: [0.75, 1.52, 0.85],
      close: [0.95, 1.2, 0.55],
    };
    for (const view of VIEWS) {
      if (view === 'default') {
        await cdp.eval('(() => { const v = window.__viewer; v.setExplode(0, true); v.setXrayMode(false); v.resetView(); v.spherical.copy(v.desiredSpherical); v.target.copy(v.desiredTarget); return true; })()');
        await sleep(450);
        await shoot('default');
      } else if (presets[view]) {
        await setCam(...presets[view]);
        await shoot(view);
      } else if (view.startsWith('cam:')) {
        const [t, p, r] = view.slice(4).split(',').map(Number);
        await setCam(t, p, r || 1);
        await shoot(`cam_${t}_${p}_${r || 1}`.replace(/\./g, 'p'));
      } else if (view === 'exploded') {
        await cdp.eval('(() => { const v = window.__viewer; v.setXrayMode(false); v.resetView(); v.setExplode(1, true); v.spherical.copy(v.desiredSpherical); v.target.copy(v.desiredTarget); return true; })()');
        await sleep(500);
        await shoot('exploded');
        await cdp.eval('window.__viewer.setExplode(0, true)');
      } else if (view === 'xray') {
        await cdp.eval('(() => { const v = window.__viewer; v.setExplode(0, true); v.resetView(); v.setXrayMode(true); v.spherical.copy(v.desiredSpherical); v.target.copy(v.desiredTarget); return true; })()');
        await sleep(450);
        await shoot('xray');
        await cdp.eval('window.__viewer.setXrayMode(false)');
      } else if (view.startsWith('action')) {
        const [, msStr, input] = view.split(':');
        const ms = Number(msStr || 1500);
        await cdp.eval('window.__viewer.resetView()');
        await cdp.eval(`document.querySelector('#drive-btn').click()`);
        await sleep(300);
        if (input) await cdp.eval(`window.__viewer.setDriveInput('${input}', true)`);
        await sleep(ms);
        if (input) await cdp.eval(`window.__viewer.setDriveInput('${input}', false)`);
        const tel = await cdp.eval('JSON.stringify(Object.fromEntries(Object.entries(window.__viewer.driveState).filter(([k, v]) => typeof v !== "object")))');
        console.log(`  action telemetry: ${tel}`);
        await shoot(view.replace(/:/g, '_'));
        await cdp.eval(`document.querySelector('#drive-btn').click()`);
        await sleep(300);
      } else {
        console.warn(`  unknown view ${view}`);
      }
    }
    if (cdp.errors.length) {
      failed = true;
      console.error('PAGE ERRORS:\n  ' + cdp.errors.join('\n  '));
    } else {
      console.log('  no console errors');
    }
  } finally {
    try {
      cdp?.ws.close();
    } catch {
      // ignore
    }
    chrome?.kill('SIGKILL');
    server?.kill('SIGKILL');
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
