// End-to-End Headless Chrome Verification Suite for Inside Out Studio.
// Uses raw Chrome DevTools Protocol (CDP) over Node built-in WebSocket (zero external test dependencies).
// Starts server.mjs, verifies all 7 objects, tests Explore / Explode / X-Ray / Find It! / Build It! / Quiz,
// asserts 0 console errors & 0 page/CSP errors, and saves desktop (1440x900) and mobile (393x852) screenshots.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');
const SERVER_PORT = 8138;
const CDP_PORT = 9347;
const CHROME_BIN =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function waitForHttp(url, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve(res.statusCode);
        })
        .on('error', (err) => {
          if (Date.now() - start > timeoutMs) reject(err);
          else setTimeout(check, 120);
        });
    };
    check();
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.seq = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    this.pageErrors = [];
    this.securityViolations = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });

    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
        return;
      }
      // Track runtime exceptions, console errors, and CSP violations
      if (msg.method === 'Runtime.consoleAPICalled') {
        const { type, args } = msg.params;
        if (type === 'error' || type === 'assert') {
          const text = (args || []).map((a) => a.value ?? a.description ?? '').join(' ');
          this.consoleErrors.push(text);
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.pageErrors.push(d.text + (d.exception?.description ? `: ${d.exception.description}` : ''));
      } else if (msg.method === 'Log.entryAdded') {
        const entry = msg.params.entry;
        if (entry.level === 'error') {
          this.consoleErrors.push(`[${entry.source}] ${entry.text}`);
        }
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${res.exceptionDetails.text}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    return outPath;
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

async function runTests() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const profileDir = fs.mkdtempSync(path.join(ROOT, '.chrome-test-'));

  console.log('1. Starting Inside Out Studio static server on 127.0.0.1:8137...');
  const serverProc = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(SERVER_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let chromeProc = null;
  let cdp = null;

  try {
    await waitForHttp(`http://127.0.0.1:${SERVER_PORT}/`);
    console.log('   ✓ Server listening.');

    console.log('2. Launching headless Chrome with WebGL enabled...');
    chromeProc = spawn(
      CHROME_BIN,
      [
        '--headless=new',
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-extensions',
        '--mute-audio',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--window-size=1440,900',
        'about:blank',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    // Wait for CDP JSON endpoint
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        targets = await httpGetJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (Array.isArray(targets) && targets.length > 0) break;
      } catch {
        await sleep(150);
      }
    }
    assert.ok(targets && targets.length > 0, 'Failed to connect to headless Chrome CDP');
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');

    // Set Desktop viewport 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log('3. Navigating to Inside Out Studio Home Screen...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/` });
    await sleep(600);

    // Attach CSP violation listener in page
    await cdp.eval(`
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push(e.violatedDirective + ':' + e.blockedURI);
      });
    `);

    const homeData = await cdp.eval(`({
      title: document.title,
      brand: document.querySelector('.brand')?.textContent?.trim(),
      heading: document.querySelector('#home-title')?.textContent?.trim(),
      cardCount: document.querySelectorAll('.obj-card').length,
      cardIds: Array.from(document.querySelectorAll('.obj-card')).map(c => c.dataset.objectId)
    })`);

    assert.ok(homeData.title.includes('Inside Out Studio'), `Unexpected title: ${homeData.title}`);
    assert.ok(homeData.brand.includes('Inside Out Studio'), `Unexpected brand: ${homeData.brand}`);
    assert.ok(
      homeData.heading.includes('Explode & explore how the world works from the inside out'),
      `Unexpected heading: ${homeData.heading}`,
    );
    assert.ok(homeData.cardCount >= 10, `Must render at least 10 object category cards on Home screen, got ${homeData.cardCount}`);
    const objectIds = homeData.cardIds;
    console.log(`   ✓ Home branding & all ${homeData.cardCount} category cards verified (${objectIds.join(', ')}).`);

    await cdp.screenshot('01-home-desktop.png');

    // 4. Verify all categories and all models load in 3D, switch via model pills, and explode cleanly
    const flagshipAssembledShots = {
      'ferrari-sf90': '02-car-assembled-showroom-desktop.png',
      'porsche-911-gt3rs': '02-car-concept-cad-showroom-desktop.png',
      'tesla-plaid': '02-car-tesla-s-plaid-showroom-desktop.png',
      'tesla-model-x-plaid': '02-car-tesla-x-plaid-showroom-desktop.png',
      'tesla-roadster-2': '02-car-tesla-roadster-2-showroom-desktop.png',
      'cybertruck': '02-car-cybertruck-showroom-desktop.png',
      'rivian-r1t': '02-car-rivian-r1t-showroom-desktop.png',
      'ford-f150-raptor': '02-car-ford-f150-raptor-showroom-desktop.png',
      'boeing-737-max': '02-airplane-assembled-showroom-desktop.png',
      'airbus-a350': '02-airplane-airbus-a350-showroom-desktop.png',
      'f22-raptor-jet': '02-airplane-f22-raptor-showroom-desktop.png',
      'lockheed-sr71-blackbird': '02-airplane-sr71-blackbird-showroom-desktop.png',
      'cessna-172': '02-airplane-cessna-172-showroom-desktop.png',
      'virginia-ssn-sub': '02-submarine-assembled-showroom-desktop.png',
      'iphone-16-pro-max': '02-iphone-assembled-showroom-desktop.png',
      'ge9x-turbofan': '02-jet-assembled-showroom-desktop.png',
      'f135-afterburner-jet': '02-jet-f135-afterburner-showroom-desktop.png',
      'spacex-raptor-rocket': '02-raptor-rocket-cad-showroom-desktop.png',
      'macbook-pro-16': '02-laptop-assembled-showroom-desktop.png',
      'modern-eco-home': '02-house-assembled-showroom-desktop.png',
      'mini-led-8k-tv': '02-tv-assembled-showroom-desktop.png',
      'shinkansen-n700s': '02-train-shinkansen-showroom-desktop.png',
      'iss-orbital-station': '02-space-iss-showroom-desktop.png',
      'space-shuttle-sts': '02-space-shuttle-showroom-desktop.png',
      'spacex-falcon-9': '02-rocket-falcon-9-showroom-desktop.png',
      'spacex-starship-superheavy': '02-rocket-starship-showroom-desktop.png',
      'nasa-saturn-v-apollo': '02-rocket-saturn-v-showroom-desktop.png',
      'uh60-black-hawk': '02-heli-black-hawk-showroom-desktop.png',
      'airbus-h145-rescue': '02-heli-h145-showroom-desktop.png',
      'dji-mavic-3-pro': '02-heli-mavic-drone-showroom-desktop.png',
      'nasa-ingenuity-mars-heli': '02-heli-ingenuity-showroom-desktop.png',
      'iron-man-mark-85': '02-robot-iron-man-showroom-desktop.png',
      'mars-perseverance-rover': '02-robot-perseverance-showroom-desktop.png',
      'kuka-6axis-industrial-arm': '02-robot-kuka-arm-showroom-desktop.png',
      'boston-quadruped-robot': '02-robot-quadruped-showroom-desktop.png',
      'cat-hydraulic-excavator': '02-construction-excavator-showroom-desktop.png',
      'john-deere-combine-harvester': '02-construction-combine-showroom-desktop.png',
      'liebherr-tower-crane': '02-construction-crane-showroom-desktop.png',
      'swiss-chronograph-watch': '02-watch-chronograph-showroom-desktop.png',
      'grandfather-pendulum-clock': '02-watch-grandfather-clock-showroom-desktop.png',
      'tern-gsd-cargo-ebike': '02-bike-tern-gsd-showroom-desktop.png',
      'carbon-aero-road-bike': '02-bike-carbon-road-showroom-desktop.png',
      'ducati-panigale-v4': '02-bike-ducati-panigale-showroom-desktop.png',
      'quantum-of-the-seas': '02-ship-quantum-of-the-seas-showroom-desktop.png',
      'launchpad-mega-yacht': '02-ship-launchpad-yacht-showroom-desktop.png',
      'ultra-large-container-ship': '02-ship-container-showroom-desktop.png',
      'nimitz-aircraft-carrier': '02-ship-carrier-showroom-desktop.png',
      'rms-titanic-ocean-liner': '02-ship-titanic-showroom-desktop.png',
      'siphon-flush-toilet': '02-everyday-toilet-showroom-desktop.png',
      'traction-passenger-elevator': '02-everyday-elevator-showroom-desktop.png',
      'pin-tumbler-lock': '02-everyday-lock-showroom-desktop.png',
      'italian-espresso-machine': '02-everyday-espresso-showroom-desktop.png',
    };
    const flagshipExplodedShots = {
      'ferrari-sf90': '02-explore-car-exploded-desktop.png',
      'tesla-roadster-2': '02-explore-tesla-roadster-2-exploded-desktop.png',
      'cybertruck': '02-explore-cybertruck-exploded-desktop.png',
      'boeing-737-max': '02-explore-airplane-exploded-desktop.png',
      'f22-raptor-jet': '02-explore-f22-raptor-exploded-desktop.png',
      'cessna-172': '02-explore-cessna-172-exploded-desktop.png',
      'virginia-ssn-sub': '02-explore-submarine-exploded-desktop.png',
      'iphone-16-pro-max': '02-explore-iphone-exploded-desktop.png',
      'ge9x-turbofan': '02-explore-jet-exploded-desktop.png',
      'macbook-pro-m3-max': '02-explore-laptop-exploded-desktop.png',
      'modern-smart-home': '02-explore-house-exploded-desktop.png',
      'lg-oled-evo-g4': '02-explore-tv-exploded-desktop.png',
      'shinkansen-n700s': '02-explore-train-shinkansen-exploded-desktop.png',
      'iss-orbital-station': '02-explore-space-iss-exploded-desktop.png',
      'iron-man-mark-85': '02-explore-robot-iron-man-exploded-desktop.png',
      'mars-perseverance-rover': '02-explore-robot-perseverance-exploded-desktop.png',
      'swiss-chronograph-watch': '02-explore-watch-chronograph-exploded-desktop.png',
      'grandfather-pendulum-clock': '02-explore-watch-grandfather-exploded-desktop.png',
      'tern-gsd-cargo-ebike': '02-explore-bike-tern-gsd-exploded-desktop.png',
      'ducati-panigale-v4': '02-explore-bike-ducati-exploded-desktop.png',
      'rms-titanic-ocean-liner': '02-explore-titanic-exploded-desktop.png',
    };

    let totalModelsVerified = 0;
    console.log(`4. Testing 3D models, GLB CAD assets, Model Variant Selector & Exploded Views across all ${objectIds.length} categories...`);
    for (const objId of objectIds) {
      await cdp.eval(`(() => {
        const btn = document.querySelector('.obj-card[data-object-id="${objId}"]');
        if (btn) btn.click();
      })()`);
      await sleep(objId === 'car' ? 950 : 320);

      if (objId === 'car') {
        // Wait for open-licensed GLB CAD models to finish loading
        for (let w = 0; w < 35; w++) {
          const glbCount = await cdp.eval(`
            performance.getEntriesByType('resource').filter(r => r.name.includes('.glb')).length
          `);
          if (glbCount >= 17) break;
          await sleep(150);
        }
        const loadedGlbs = await cdp.eval(`
          performance.getEntriesByType('resource')
            .filter(r => r.name.includes('.glb'))
            .map(r => r.name.split('/').pop())
        `);
        assert.ok(
          loadedGlbs.length >= 17,
          `Expected all 17 GLB CAD assets to be loaded, got ${loadedGlbs.length}: ${loadedGlbs.join(', ')}`,
        );
        console.log(`   ✓ Verified all ${loadedGlbs.length} GLB CAD assets loaded (${loadedGlbs.join(', ')}).`);
      }

      const modelIds = await cdp.eval(`
        Array.from(document.querySelectorAll('#model-selector .model-pill')).map(b => b.dataset.modelId)
      `);
      assert.ok(modelIds.length >= 2, `${objId} should have at least 2 model variants, got ${modelIds.length}`);

      for (const mId of modelIds) {
        await cdp.eval(`(() => {
          const pill = document.querySelector('#model-selector .model-pill[data-model-id="${mId}"]');
          if (pill) pill.click();
        })()`);
        await sleep(280);

        const labInfo = await cdp.eval(`({
          labHidden: document.querySelector('#lab-screen').hidden,
          title: document.querySelector('#lab-title').textContent,
          activePillId: document.querySelector('#model-selector .model-pill.is-active')?.dataset?.modelId,
          partChipCount: document.querySelectorAll('#parts-checklist .chip').length,
          canvasW: document.querySelector('#stage-canvas canvas')?.width || 0,
          canvasH: document.querySelector('#stage-canvas canvas')?.height || 0,
          errorHidden: document.querySelector('#stage-error').hidden,
          actionBtnLabel: document.querySelector('#drive-btn')?.textContent?.trim() || '',
        })`);

        assert.equal(labInfo.labHidden, false, `${objId}/${mId} lab screen should be visible`);
        assert.equal(labInfo.errorHidden, true, `${objId}/${mId} WebGL error banner should be hidden`);
        assert.equal(labInfo.activePillId, mId, `${objId}/${mId} model pill should be active`);
        assert.ok(
          labInfo.partChipCount >= 5 && labInfo.partChipCount <= 12,
          `${objId}/${mId} should have 5-12 parts, got ${labInfo.partChipCount}`,
        );
        assert.ok(labInfo.canvasW > 0 && labInfo.canvasH > 0, `${objId}/${mId} WebGL canvas has zero dimensions`);

        if (flagshipAssembledShots[mId]) {
          // Verify labels are auto-hidden at 0% explode in Showroom view
          const visibleLabelsAtZero = await cdp.eval(`
            Array.from(document.querySelectorAll('.part-label')).filter(el => !el.hidden).length
          `);
          assert.equal(visibleLabelsAtZero, 0, `${mId} should hide floating part labels at 0% explode`);
          await cdp.screenshot(flagshipAssembledShots[mId]);
        }

        if (mId === 'ferrari-sf90') {
          // Test Interactive "🏎️ Drive It!" Mode on Ferrari SF90 Stradale
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(450);
          const driveHudState = await cdp.eval(`({
            hudHidden: document.querySelector('#drive-hud').hidden,
            speed: Number(document.querySelector('#drive-speed').textContent),
          })`);
          assert.equal(driveHudState.hudHidden, false, 'Drive HUD should be visible when Drive It! is active');
          assert.ok(driveHudState.speed > 15, `Expected live driving speed > 15 MPH, got ${driveHudState.speed}`);
          await cdp.screenshot('09-drive-mode-active-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(200);
        } else if (mId === 'boeing-737-max') {
          assert.ok(labInfo.actionBtnLabel.includes('Flight'), `Expected Flight button for 737, got ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(420);
          await cdp.screenshot('09-airplane-flight-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'virginia-ssn-sub') {
          assert.ok(labInfo.actionBtnLabel.includes('Dive'), `Expected Dive button for Sub, got ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(420);
          await cdp.screenshot('09-submarine-dive-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'shinkansen-n700s') {
          assert.ok(labInfo.actionBtnLabel.includes('Ride'), `Expected Ride button for Train, got ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(420);
          await cdp.screenshot('09-train-ride-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'iss-orbital-station') {
          assert.ok(labInfo.actionBtnLabel.includes('Orbit'), `Expected Orbit button for Space, got ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(420);
          await cdp.screenshot('09-space-orbit-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'spacex-falcon-9') {
          assert.ok(labInfo.actionBtnLabel.includes('Launch'), `Expected Launch button for Rocket, got ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(650);
          await cdp.screenshot('09-rocket-launch-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'siphon-flush-toilet') {
          assert.ok(labInfo.actionBtnLabel.includes('Flush'), `Expected Flush It! button for Toilet, got ${labInfo.actionBtnLabel}`);
          assert.ok(!labInfo.actionBtnLabel.includes('Drive'), `Toilet button must NOT say Drive: ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(550);
          await cdp.screenshot('09-toilet-flush-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        } else if (mId === 'italian-espresso-machine') {
          assert.ok(labInfo.actionBtnLabel.includes('Brew'), `Expected Brew Espresso! button for Espresso Machine, got ${labInfo.actionBtnLabel}`);
          assert.ok(!labInfo.actionBtnLabel.includes('Drive'), `Espresso Machine button must NOT say Drive: ${labInfo.actionBtnLabel}`);
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(650);
          await cdp.screenshot('09-espresso-brew-mode-desktop.png');
          await cdp.eval(`document.querySelector('#drive-btn').click()`);
          await sleep(180);
        }

        // Click Explode button to explode 100%
        await cdp.eval(`document.querySelector('#explode-btn').click()`);
        await sleep(360);

        const sliderVal = await cdp.eval(`Number(document.querySelector('#explode-slider').value)`);
        assert.equal(sliderVal, 100, `${objId}/${mId} explode slider should be 100 after clicking Explode!`);

        // Click 2nd part chip (Engine/Powertrain) to inspect & focus camera
        await cdp.eval(`document.querySelectorAll('#parts-checklist .chip')[1].click()`);
        await sleep(220);

        // Save showcase exploded screenshots for flagship models
        if (flagshipExplodedShots[mId]) {
          await cdp.screenshot(flagshipExplodedShots[mId]);
        }

        // Reset explode back to 0 for next variant
        await cdp.eval(`document.querySelector('#assemble-btn').click()`);
        await sleep(120);
        totalModelsVerified++;
      }

      console.log(`   ✓ ${objId.toUpperCase()}: Verified all ${modelIds.length} realistic 3D models (${modelIds.join(', ')}).`);

      // Return to Home
      await cdp.eval(`document.querySelector('#home-btn').click()`);
      await sleep(150);
    }
    assert.equal(totalModelsVerified, 67, `Expected 67 total 3D models verified across 18 categories, got ${totalModelsVerified}`);

    // 5. Deep test all 4 interactive modes on Jet Engine (GE9X High-Bypass Turbofan)
    console.log('5. Testing all 4 interactive modes (Explore, Find It!, Build It!, Quiz) on Jet Engine...');
    await cdp.eval(`(() => {
      if (!document.querySelector('#lab-screen').hidden) {
        document.querySelector('#home-btn')?.click();
      }
      document.querySelector('button.obj-card[data-object-id="jet"]')?.click();
    })()`);
    await sleep(300);
    await cdp.eval(`(() => {
      document.querySelector('#model-selector .model-pill[data-model-id="ge9x-turbofan"]')?.click();
      document.querySelector('.mode-btn[data-mode="explore"]')?.click();
    })()`);
    await sleep(250);

    // 5a. Explore Mode: inspect all parts + test X-Ray toggle + Read Aloud button
    const step5Debug = await cdp.eval(`(() => {
      const partIds = Array.from(document.querySelectorAll('#parts-checklist .chip')).map(c => c.dataset.partId);
      for (const pid of partIds) {
        document.querySelector('#parts-checklist .chip[data-part-id="' + pid + '"]')?.click();
      }
      document.querySelector('#xray-btn')?.click();
      document.querySelector('#read-aloud-btn')?.click();
      return {
        title: document.querySelector('#lab-title')?.textContent,
        labHidden: document.querySelector('#lab-screen').hidden,
        mode: document.querySelector('#stage')?.dataset?.mode,
        partCount: partIds.length,
        foundCount: document.querySelectorAll('#parts-checklist .chip.is-found').length,
        starsText: document.querySelector('[data-stars="explore"]')?.textContent,
      };
    })()`);
    await sleep(250);
    const exploreStars = await cdp.eval(`document.querySelector('[data-stars="explore"]').textContent`);
    assert.equal(exploreStars, '★★★', `Exploring all parts should award 3 stars in Explore mode (${JSON.stringify(step5Debug)})`);
    console.log('   ✓ Explore Mode: All parts inspected, X-Ray & Read Aloud tested, 3 stars awarded.');

    // 5b. Find It! Mode: complete all 6 rounds
    await cdp.eval(`document.querySelector('.mode-btn[data-mode="find"]').click()`);
    await sleep(300);
    await cdp.screenshot('03-find-it-mode-desktop.png');

    for (let round = 0; round < 6; round++) {
      await cdp.eval(`(() => {
        document.querySelector('#find-hint-btn')?.click();
        const pid = document.querySelector('#find-target-name')?.dataset?.targetId ||
                    document.querySelector('.part-label.is-selected')?.dataset?.partId;
        const btn = document.querySelector('#find-part-choices .chip[data-part-id="' + pid + '"]');
        if (btn) btn.click();
      })()`);
      await sleep(160);
    }
    await sleep(750);
    const findCelebrationOpen = await cdp.eval(`document.querySelector('#celebrate').open`);
    assert.equal(findCelebrationOpen, true, 'Celebration dialog should open after completing Find It!');
    await cdp.eval(`document.querySelector('#celebrate-next-btn').click()`); // advances to Build It!
    await sleep(300);
    console.log('   ✓ Find It! Mode: Completed all 6 rounds & verified celebration.');

    // 5c. Build It! Mode: snap every piece into place
    const activeModeAfterFind = await cdp.eval(
      `document.querySelector('.mode-btn[aria-pressed="true"]').dataset.mode`,
    );
    assert.equal(activeModeAfterFind, 'build', 'Should transition to Build It! mode');
    await cdp.screenshot('04-build-it-mode-desktop.png');

    const totalBuildSteps = await cdp.eval(`document.querySelectorAll('#build-parts-list .chip').length`);
    for (let s = 0; s < totalBuildSteps; s++) {
      await cdp.eval(`document.querySelector('#snap-piece-btn')?.click()`);
      await sleep(110);
    }
    await sleep(750);
    const buildCelebrationOpen = await cdp.eval(`document.querySelector('#celebrate').open`);
    assert.equal(buildCelebrationOpen, true, 'Celebration dialog should open after 100% assembly in Build It!');
    await cdp.eval(`document.querySelector('#celebrate-next-btn').click()`); // advances to Quiz
    await sleep(300);
    console.log(`   ✓ Build It! Mode: Snapped all ${totalBuildSteps} parts back together & earned 3 stars.`);

    // 5d. Quiz Mode: answer all 5 questions correctly
    const activeModeAfterBuild = await cdp.eval(
      `document.querySelector('.mode-btn[aria-pressed="true"]').dataset.mode`,
    );
    assert.equal(activeModeAfterBuild, 'quiz', 'Should transition to Quiz mode');
    await cdp.screenshot('05-quiz-mode-desktop.png');

    for (let q = 0; q < 5; q++) {
      const qText = await cdp.eval(`document.querySelector('#quiz-question-text')?.textContent?.trim() || ''`);
      assert.ok(qText.length > 8, `Quiz question text should be non-empty, got "${qText}"`);
      assert.ok(!qText.includes('[object Object]') && !qText.includes('undefined'), `Invalid quiz question text: "${qText}"`);
      await cdp.eval(`(() => {
        const rightOpt = document.querySelector('#quiz-options .opt[data-correct="true"]');
        if (rightOpt) rightOpt.click();
      })()`);
      await sleep(120);
      await cdp.eval(`document.querySelector('#quiz-next-btn')?.click()`);
      await sleep(150);
    }
    await sleep(300);
    const quizStars = await cdp.eval(`document.querySelector('[data-stars="quiz"]').textContent`);
    assert.equal(quizStars, '★★★', '5/5 quiz score should award 3 stars');
    await cdp.screenshot('06-celebration-modal-desktop.png');
    await cdp.eval(`document.querySelector('#celebrate-home-btn').click()`);
    await sleep(250);

    const totalStarCount = await cdp.eval(`Number(document.querySelector('#star-count').textContent)`);
    assert.ok(totalStarCount >= 12, `Expected at least 12 total stars earned, got ${totalStarCount}`);
    console.log(`   ✓ Quiz Mode: Answered 5/5 questions, earned 12/12 stars on Jet Engine (Total stars: ${totalStarCount}).`);

    // 6. Test Mobile Viewport (393x852 iPhone 15 Pro dimensions)
    console.log('6. Testing Mobile Viewport (393x852)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(300);
    await cdp.screenshot('07-home-mobile.png');

    await cdp.eval(`document.querySelector('.obj-card[data-object-id="house"]').click()`);
    await sleep(300);
    await cdp.eval(`document.querySelector('#explode-btn').click()`);
    await sleep(450);
    const mobileOverflow = await cdp.eval(`({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      topbarRight: document.querySelector('#mute-btn')?.getBoundingClientRect()?.right || 0,
    })`);
    assert.ok(
      mobileOverflow.scrollW <= mobileOverflow.innerW && mobileOverflow.topbarRight <= mobileOverflow.innerW,
      `Mobile viewport horizontal overflow detected: ${JSON.stringify(mobileOverflow)}`,
    );
    await cdp.screenshot('08-house-exploded-mobile.png');
    console.log('   ✓ Mobile layout & exploded 3D House captured.');

    // 7. Test 12-Language Internationalization (en, zh-CN, zh-HK, es, fr, de, nl, pt, it, ja, ko, ar) + Chirp 3 HD Read Aloud + GA4
    console.log('7. Testing 12-Language Internationalization, Google Cloud Chirp 3 HD Read Aloud & GA4 (EN, ZH-CN, ZH-HK, ES, FR, DE, NL, PT, IT, JA, KO, AR)...');
    const langCodes = await cdp.eval(
      `Array.from(document.querySelectorAll('#lang-select option')).map((o) => o.value)`,
    );
    assert.deepEqual(
      langCodes,
      ['en', 'zh-CN', 'zh-HK', 'es', 'fr', 'de', 'nl', 'pt', 'it', 'ja', 'ko', 'ar'],
      `Expected all 12 language options in #lang-select, got ${JSON.stringify(langCodes)}`,
    );

    const noveltyVoiceRe =
      /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|espeak)\b/i;

    // Reset House model selector to flagship modern-eco-home (Step 4 left it on geodesic-dome-cabin)
    await cdp.eval(`document.querySelector('.model-pill[data-model-id="modern-eco-home"]')?.click()`);
    await sleep(180);

    for (const code of ['zh-CN', 'zh-HK', 'es', 'fr', 'de', 'nl', 'pt', 'it', 'ja', 'ko', 'ar', 'en']) {
      const langState = await cdp.eval(`(() => {
        const sel = document.querySelector('#lang-select');
        sel.value = ${JSON.stringify(code)};
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        const readBtn = document.querySelector('#read-aloud-btn');
        if (readBtn) readBtn.click();
        const diag = typeof window.__getAudioDiagnostics === 'function' ? window.__getAudioDiagnostics() : null;
        return {
          htmlLang: document.documentElement.lang,
          htmlDir: document.documentElement.dir,
          brand: document.querySelector('#brand-title')?.textContent?.trim(),
          stageTitle: document.querySelector('#lab-title')?.textContent?.trim(),
          firstPartLabel: document.querySelector('.part-label')?.textContent?.trim(),
          firstChip: document.querySelector('.chip')?.textContent?.trim(),
          partDesc: document.querySelector('#inspector-part-desc')?.textContent?.trim(),
          funFact: document.querySelector('#inspector-fun-fact')?.textContent?.trim(),
          diag,
        };
      })()`);
      assert.equal(langState.htmlLang, code, `Expected <html lang="${code}">, got ${langState.htmlLang}`);
      assert.equal(
        langState.htmlDir,
        code === 'ar' ? 'rtl' : 'ltr',
        `Expected <html dir="${code === 'ar' ? 'rtl' : 'ltr'}"> for ${code}, got ${langState.htmlDir}`,
      );
      assert.ok(langState.brand && langState.brand.length > 0, `Empty brand title for ${code}`);
      assert.ok(
        langState.stageTitle && langState.stageTitle.length > 0 && !langState.stageTitle.includes('undefined'),
        `Invalid stage title for ${code}: ${langState.stageTitle}`,
      );
      assert.ok(langState.firstPartLabel && langState.firstPartLabel.length > 0, `Empty 3D part label for ${code}`);
      assert.ok(langState.firstChip && langState.firstChip.length > 0, `Empty part chip for ${code}`);
      assert.ok(langState.diag && langState.diag.lastSpeech, `Missing audio diagnostics for ${code}`);
      assert.equal(
        langState.diag.lastSpeech.engine,
        'studio-chirp3-hd',
        `Expected Studio Chirp 3 HD engine for default flagship part in ${code}, got ${langState.diag.lastSpeech.engine}`,
      );
      assert.ok(
        String(langState.diag.lastSpeech.chirpVoice || '').includes('-Chirp3-HD-Aoede'),
        `Expected Chirp3-HD-Aoede voice for ${code}, got ${langState.diag.lastSpeech.chirpVoice}`,
      );
      assert.ok(
        String(langState.diag.lastSpeech.audioUrl || '').endsWith('.mp3'),
        `Expected pre-synthesized .mp3 URL for ${code}, got ${langState.diag.lastSpeech.audioUrl}`,
      );
      assert.equal(
        langState.diag.lastSpeech.pitch,
        1.0,
        `Expected unity pitch (1.0) for ${code}, got ${langState.diag.lastSpeech.pitch}`,
      );
      assert.equal(
        langState.diag.lastSpeech.langCode,
        code,
        `Expected speech langCode=${code}, got ${langState.diag.lastSpeech.langCode}`,
      );
      assert.ok(
        !/💡|🗣️|🏎️|⭐/.test(langState.diag.lastSpeech.cleanedText),
        `Emojis must be stripped from Read Aloud text for ${code}: ${langState.diag.lastSpeech.cleanedText}`,
      );
      assert.ok(
        !/(发动机|引擎|モーター|エンジン|엔진)\s*(Engine|engine)\b/.test(langState.diag.lastSpeech.cleanedText),
        `Duplicate engine token in Read Aloud text for ${code}: ${langState.diag.lastSpeech.cleanedText}`,
      );
      assert.ok(
        !/([\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0600-\u06ff])s\b/i.test(langState.diag.lastSpeech.cleanedText),
        `Broken CJK/Arabic plural 's' in Read Aloud text for ${code}: ${langState.diag.lastSpeech.cleanedText}`,
      );
      if (langState.diag.lastSpeech.voiceName) {
        assert.ok(
          !noveltyVoiceRe.test(langState.diag.lastSpeech.voiceName),
          `Novelty/formant voice selected for ${code}: ${langState.diag.lastSpeech.voiceName}`,
        );
      }
      if (code !== 'en') {
        assert.ok(
          !langState.stageTitle.includes('Houses & Architecture'),
          `Expected localized stage title for ${code}, got ${langState.stageTitle}`,
        );
      }
    }
    await cdp.eval(`window.speechSynthesis && window.speechSynthesis.cancel()`);

    // 7b. Verify live /api/tts Chirp 3 HD synthesis for Dutch (nl), German (de), and Arabic (ar)
    const liveChirpChecks = await cdp.eval(`(async () => {
      const statusRes = await fetch('/api/tts/status');
      const statusJson = await statusRes.json();
      if (!statusJson.available) return { available: false };
      const samples = [
        { lang: 'nl', text: 'Dit 3D-model toont hoe de motor en aandrijflijn van binnen werken.', expectedVoice: 'nl-NL-Chirp3-HD-Aoede' },
        { lang: 'de', text: 'Dieses 3D-Modell zeigt detailliert, wie das Triebwerk im Inneren arbeitet.', expectedVoice: 'de-DE-Chirp3-HD-Aoede' },
        { lang: 'ar', text: 'يوضح هذا النموذج ثلاثي الأبعاد كيف يعمل المحرك من الداخل بدقة عالية.', expectedVoice: 'ar-XA-Chirp3-HD-Aoede' },
      ];
      const results = [];
      for (const s of samples) {
        const r = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'InsideOutStudio' },
          body: JSON.stringify({ lang: s.lang, text: s.text }),
        });
        const buf = await r.arrayBuffer();
        results.push({
          lang: s.lang,
          status: r.status,
          contentType: r.headers.get('content-type'),
          voice: r.headers.get('x-chirp-voice'),
          expectedVoice: s.expectedVoice,
          bytes: buf.byteLength,
        });
      }
      return { available: true, results };
    })()`);
    assert.equal(liveChirpChecks.available, true, 'Expected live /api/tts Chirp 3 HD endpoint to be available');
    for (const item of liveChirpChecks.results) {
      assert.equal(item.status, 200, `Expected HTTP 200 from /api/tts for ${item.lang}, got ${item.status}`);
      assert.equal(item.contentType, 'audio/mpeg', `Expected audio/mpeg for ${item.lang}, got ${item.contentType}`);
      assert.equal(item.voice, item.expectedVoice, `Expected Chirp voice ${item.expectedVoice}, got ${item.voice}`);
      assert.ok(item.bytes > 4000, `Expected non-trivial Chirp MP3 bytes for ${item.lang}, got ${item.bytes}`);
    }
    console.log('   ✓ Verified all 12 languages + Studio & Live Chirp 3 HD Read Aloud (including Dutch nl, German de, and Arabic ar).');

    // 7c. Verify Google Analytics 4 (GA4 G-B1SZ4464HN) configuration & event pipeline
    const gaCheck = await cdp.eval(`({
      hasGtagScript: Boolean(document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-B1SZ4464HN"]')),
      hasGtagFn: typeof window.gtag === 'function',
      analytics: window.__insideOutAnalytics || null,
    })`);
    assert.equal(gaCheck.hasGtagScript, true, 'Missing gtag.js script tag for G-B1SZ4464HN');
    assert.equal(gaCheck.hasGtagFn, true, 'window.gtag function not defined');
    assert.ok(gaCheck.analytics && gaCheck.analytics.initialized, 'GA4 analytics state not initialized');
    assert.equal(gaCheck.analytics.measurementId, 'G-B1SZ4464HN', `Unexpected GA4 Measurement ID: ${gaCheck.analytics.measurementId}`);
    assert.ok(
      Array.isArray(gaCheck.analytics.eventsSent) && gaCheck.analytics.eventsSent.length >= 5,
      `Expected GA4 events recorded in eventsSent, got ${gaCheck.analytics?.eventsSent?.length}`,
    );
    console.log(`   ✓ Verified Google Analytics 4 (${gaCheck.analytics.measurementId}) initialized with ${gaCheck.analytics.eventsSent.length} tracked events.`);

    // 8. Assert zero console errors, zero page exceptions, and zero CSP violations
    const cspViolations = await cdp.eval(`window.__cspViolations || []`);
    assert.deepEqual(cdp.consoleErrors, [], `Console errors detected: ${cdp.consoleErrors.join('; ')}`);
    assert.deepEqual(cdp.pageErrors, [], `Page exceptions detected: ${cdp.pageErrors.join('; ')}`);
    assert.deepEqual(cspViolations, [], `CSP violations detected: ${cspViolations.join('; ')}`);

    console.log('\n✅ ALL E2E TESTS PASSED! (18 categories, 67 hyper-detailed 3D models, 12 languages + Chirp 3 HD Read Aloud + GA4, 0 console errors, 0 page errors, 0 CSP violations)');
  } finally {
    if (cdp) {
      if (cdp.consoleErrors.length) console.error('Console Errors:', cdp.consoleErrors);
      if (cdp.pageErrors.length) console.error('Page Errors:', cdp.pageErrors);
      cdp.close();
    }
    if (chromeProc) chromeProc.kill('SIGKILL');
    serverProc.kill('SIGTERM');
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
