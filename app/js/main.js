// Inside Out Studio — Main Application Controller
// Coordinates the Home screen, 3D StageViewer, 5 interactive modes (Explore, Find It!, Build It!, Quiz, Action/Drive),
// multi-model switching per category, star persistence, sound/speech synthesis, and celebration confetti.
import { OBJECTS, getObjectById, setCategoryModel } from './catalog.js';
import { getAction } from './actions.js';
import { StageViewer } from './viewer.js';
import { onCadReady } from './cad_loader.js';
import { el, clear, $, $$, shuffle, starsNode, prefersReducedMotion } from './ui.js';
import {
  getLang,
  getLangDir,
  setLang,
  onLangChange,
  t,
  tPraise,
  tCategory,
  tAction,
  tModel,
  tPart,
  tQuizQuestion,
} from './i18n.js';
import {
  isMuted,
  toggleMuted,
  playPop,
  playSnap,
  playWhoosh,
  playCorrect,
  playOops,
  playFanfare,
  playHorn,
  stopEngineSound,
  speakText,
  stopSpeaking,
  getAudioDiagnostics,
} from './sound.js';
import {
  initAnalytics,
  trackCategorySelect,
  trackModelSelect,
  trackModeSwitch,
  trackPartInspect,
  trackReadAloud,
  trackQuizComplete,
  trackLanguageSwitch,
} from './analytics.js';

if (typeof window !== 'undefined') {
  window.__getAudioDiagnostics = getAudioDiagnostics;
}

const STORAGE_KEY = 'inside_out_studio_progress_v1';
const CORE_MODES = ['explore', 'find', 'build', 'quiz'];
const MODES = ['explore', 'find', 'build', 'quiz', 'drive'];
const MAX_STARS = OBJECTS.length * CORE_MODES.length * 3;
const TOTAL_MODELS = OBJECTS.reduce(
  (sum, o) => sum + (Array.isArray(o.models) ? o.models.length : 1),
  0,
);

const state = {
  screen: 'home', // 'home' | 'lab'
  activeObjectId: 'car',
  mode: 'explore', // 'explore' | 'find' | 'build' | 'quiz' | 'drive'
  selectedPartId: null,
  progress: loadProgress(),
  findSession: null,
  buildSession: null,
  quizSession: null,
};

let viewer = null;

function activeAction() {
  const obj = getObjectById(state.activeObjectId);
  return tAction(getAction(obj.id, obj.activeModelId), obj.id);
}

function defaultProgress() {
  const objs = {};
  for (const obj of OBJECTS) {
    objs[obj.id] = {
      foundParts: [],
      stars: { explore: 0, find: 0, build: 0, quiz: 0, drive: 0 },
    };
  }
  return { objects: objs };
}

function getAllCategoryPartIds(obj) {
  const ids = new Set();
  if (Array.isArray(obj.models)) {
    for (const m of obj.models) {
      for (const p of m.parts) ids.add(p.id);
    }
  } else {
    for (const p of obj.parts) ids.add(p.id);
  }
  return ids;
}

function loadProgress() {
  const base = defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.objects) return base;
    for (const obj of OBJECTS) {
      const saved = parsed.objects[obj.id];
      if (!saved) continue;
      if (Array.isArray(saved.foundParts)) {
        const validIds = getAllCategoryPartIds(obj);
        base.objects[obj.id].foundParts = saved.foundParts.filter((id) => validIds.has(id));
      }
      if (saved.stars && typeof saved.stars === 'object') {
        for (const m of MODES) {
          const val = Number(saved.stars[m]) || 0;
          base.objects[obj.id].stars[m] = Math.max(0, Math.min(3, val));
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return base;
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch {
    // ignore storage errors
  }
}

function getObjProgress(objId = state.activeObjectId) {
  if (!state.progress.objects[objId]) {
    state.progress.objects[objId] = {
      foundParts: [],
      stars: { explore: 0, find: 0, build: 0, quiz: 0, drive: 0 },
    };
  }
  return state.progress.objects[objId];
}

function getActiveModelFoundCount(obj) {
  const prog = getObjProgress(obj.id);
  const activePartIds = new Set(obj.parts.map((p) => p.id));
  return prog.foundParts.filter((id) => activePartIds.has(id)).length;
}

function totalStars() {
  let sum = 0;
  for (const obj of OBJECTS) {
    const st = getObjProgress(obj.id).stars;
    sum += (st.explore || 0) + (st.find || 0) + (st.build || 0) + (st.quiz || 0);
  }
  return sum;
}

function objectStars(objId) {
  const st = getObjProgress(objId).stars;
  return (st.explore || 0) + (st.find || 0) + (st.build || 0) + (st.quiz || 0);
}

function awardModeStars(objId, mode, earned) {
  const rec = getObjProgress(objId);
  const prev = rec.stars[mode] || 0;
  if (earned > prev) {
    rec.stars[mode] = Math.min(3, earned);
    saveProgress();
  }
  updateStarHeader();
  updateModeTabStars();
}

function updateStarHeader() {
  $('#star-count').textContent = String(totalStars());
  $('#star-max').textContent = `/${MAX_STARS}`;
}

function updateModeTabStars() {
  const st = getObjProgress().stars;
  for (const m of MODES) {
    const host = $(`[data-stars="${m}"]`);
    if (!host) continue;
    const count = st[m] || 0;
    host.textContent = count > 0 ? '★'.repeat(count) + '☆'.repeat(3 - count) : '';
  }
}

// ============================================================================
// Static Chrome Localization
// ============================================================================
function syncStaticChromeI18n() {
  if (document.documentElement) {
    document.documentElement.lang = getLang();
    document.documentElement.dir = getLangDir();
  }
  document.title = `${t('brandTitle')} — ${t('homeHeroTitle')}`;
  const setTxt = (sel, val) => {
    const node = $(sel);
    if (node) node.textContent = val;
  };
  setTxt('#skip-link', t('skipToContent'));
  setTxt('#home-btn-text', t('homeBtn'));
  setTxt('#brand-title', t('brandTitle'));
  setTxt('#stars-earned-sr', t('starsEarned'));
  setTxt('#sound-sr', t('soundLabel'));
  setTxt('#home-title', t('homeHeroTitle'));
  setTxt('#home-lead', t('homeHeroLead', { totalModels: TOTAL_MODELS }));
  setTxt('#home-footer-text', t('homeFooterNote'));
  setTxt('#reset-btn', t('resetStarsBtn'));

  setTxt('[data-mode-label="explore"]', t('modeExplore'));
  setTxt('[data-mode-label="find"]', t('modeFind'));
  setTxt('[data-mode-label="build"]', t('modeBuild'));
  setTxt('[data-mode-label="quiz"]', t('modeQuiz'));

  setTxt('#explode-text', t('explodeBtn'));
  setTxt('#assemble-text', t('assembleBtn'));
  setTxt('#stage-loading', t('stageLoading'));
  setTxt('#stage-error-title', t('stageErrorTitle'));
  setTxt('#stage-error-body', t('stageErrorSub'));

  setTxt('#confirm-title', t('confirmTitle'));
  setTxt('#confirm-body', t('confirmText'));
  setTxt('#confirm-yes', t('confirmYes'));
  setTxt('#confirm-no', t('confirmNo'));

  const langSel = $('#lang-select');
  if (langSel) {
    langSel.value = getLang();
    langSel.setAttribute('aria-label', t('langLabel'));
  }

  const setAttr = (sel, attr, val) => {
    const node = $(sel);
    if (node) node.setAttribute(attr, val);
  };
  setAttr('#modes-nav', 'aria-label', t('waysToPlay'));
  setAttr('#model-selector', 'aria-label', t('selectModelVariant'));
  setAttr('#explode-slider', 'aria-label', t('howFarApart'));
  setAttr('#xray-btn', 'title', t('xrayTitle'));
  setTxt('#xray-sr', t('xrayTitle'));
  setAttr('#spin-btn', 'title', t('spinTitle'));
  setTxt('#spin-sr', t('spinTitle'));
  setAttr('#labels-btn', 'title', t('labelsTitle'));
  setTxt('#labels-sr', t('labelsTitle'));
  setAttr('#view-btn', 'title', t('resetViewTitle'));
  setTxt('#view-sr', t('resetViewTitle'));
}

// ============================================================================
// Home Screen
// ============================================================================
function renderHomeGrid() {
  const grid = $('#object-grid');
  clear(grid);
  for (const obj of OBJECTS) {
    const locObj = tCategory(obj);
    const stars = objectStars(obj.id);
    const maxObjStars = CORE_MODES.length * 3;
    const foundCount = getActiveModelFoundCount(obj);
    const modelCount = Array.isArray(obj.models) ? obj.models.length : 1;
    const card = el(
      'button',
      {
        type: 'button',
        class: `obj-card obj-${obj.id}`,
        'data-object-id': obj.id,
      },
      el('div', { class: 'obj-thumb', 'aria-hidden': 'true' }, el('span', { class: 'obj-emoji' }, obj.emoji)),
      el('span', { class: 'obj-name' }, locObj.name),
      el('span', { class: 'obj-tag' }, locObj.tagline),
      el('span', { class: 'obj-models-badge' }, t('modelsBadge', { count: modelCount })),
      el(
        'span',
        { class: `obj-stars ${stars === maxObjStars ? 'obj-done' : ''}` },
        t('cardStats', {
          stars,
          maxStars: maxObjStars,
          found: foundCount,
          total: obj.parts.length,
        }),
      ),
    );
    card.addEventListener('click', () => {
      playPop(560);
      openObjectLab(obj.id);
    });
    grid.appendChild(el('li', {}, card));
  }
}

function showHome() {
  stopSpeaking();
  stopEngineSound();
  if (viewer && viewer.driveMode) {
    toggleDriveMode(false);
  }
  state.screen = 'home';
  $('#home-screen').hidden = false;
  $('#lab-screen').hidden = true;
  $('#home-btn').hidden = true;
  syncStaticChromeI18n();
  updateStarHeader();
  renderHomeGrid();
}

// ============================================================================
// Per-Category Action Mode & Dynamic Telemetry HUD
// ============================================================================
function syncActionUi() {
  const act = activeAction();
  const isDriving = Boolean(viewer && viewer.driveMode);

  const modeDriveIcon = $('#mode-drive-icon');
  const modeDriveText = $('#mode-drive-text');
  if (modeDriveIcon) modeDriveIcon.textContent = act.emoji;
  if (modeDriveText) modeDriveText.textContent = act.verb;

  const driveBtn = $('#drive-btn');
  const driveIcon = $('#drive-btn-icon');
  const driveText = $('#drive-btn-text');
  if (driveIcon) driveIcon.textContent = act.emoji;
  if (driveText) driveText.textContent = isDriving ? act.stopVerb : act.verb;
  if (driveBtn) {
    driveBtn.setAttribute('aria-pressed', String(isDriving));
    driveBtn.title = `${act.emoji} ${act.verb} (${act.hint})`;
  }

  const tip = $('#stage-tip');
  if (tip) {
    tip.textContent = t('stageTip', { emoji: act.emoji, verb: act.verb, hint: act.hint });
  }

  // Rebuild dynamic HUD gauges
  const gaugesHost = $('#drive-gauges');
  if (gaugesHost) {
    clear(gaugesHost);
    gaugesHost.appendChild(
      el('span', { class: 'drive-hud-title', id: 'drive-hud-title' }, `${act.emoji} ${act.verb}`),
    );
    let assignedGearId = false;
    for (const g of act.hud) {
      if (g.big) {
        gaugesHost.appendChild(
          el(
            'div',
            { class: 'drive-speed-box' },
            el('span', { class: 'drive-speed-val', id: 'drive-speed', 'data-hud-val': g.id }, '0'),
            el('span', { class: 'drive-speed-unit', id: 'drive-speed-unit' }, g.label),
          ),
        );
      } else if (g.bar) {
        gaugesHost.appendChild(
          el(
            'div',
            { class: 'drive-tach-box' },
            el(
              'div',
              { class: 'drive-tach-head' },
              el('span', { id: 'drive-bar-label' }, g.label.toUpperCase()),
              el('span', { id: 'drive-rpm', 'data-hud-val': g.id }, '0'),
            ),
            el(
              'div',
              { class: 'drive-tach-track' },
              el('div', {
                class: 'drive-tach-fill',
                id: 'drive-rpm-bar',
                'data-hud-bar': g.id,
                'data-hud-max': String(g.max || 100),
              }),
            ),
          ),
        );
      } else if (!assignedGearId) {
        assignedGearId = true;
        gaugesHost.appendChild(
          el(
            'div',
            { class: 'drive-gear-box', id: 'drive-gear', 'data-hud-val': g.id, title: g.label },
            '—',
          ),
        );
      } else {
        gaugesHost.appendChild(
          el(
            'div',
            { class: 'drive-stat-box' },
            el('span', { class: 'drive-stat-lbl' }, g.label),
            el('span', { class: 'drive-stat-val', 'data-hud-val': g.id }, '0'),
          ),
        );
      }
    }
  }

  // Rebuild dynamic HUD action controls
  const ctrlsHost = $('#drive-controls');
  if (ctrlsHost) {
    clear(ctrlsHost);
    const legacyIdMap = {
      left: 'drive-left-btn',
      right: 'drive-right-btn',
      up: 'drive-gas-btn',
      down: 'drive-brake-btn',
      boost: 'drive-nitro-btn',
      lights: 'drive-lights-btn',
      horn: 'drive-horn-btn',
    };
    for (const c of act.controls) {
      let cls = 'drive-ctrl-btn';
      if (c.primary || c.id === 'up') cls += ' drive-gas';
      else if (c.id === 'down') cls += ' drive-brake';
      else if (c.id === 'boost' || c.id === 'space') cls += ' drive-nitro';
      const attrs = {
        type: 'button',
        class: cls,
        title: c.title || c.label,
        'data-ctrl-id': c.id,
      };
      if (legacyIdMap[c.id]) attrs.id = legacyIdMap[c.id];
      const btn = el('button', attrs, c.label);
      if (c.input) {
        const setDown = (down) => {
          if (!viewer) return;
          viewer.setDriveInput(c.input, down);
          btn.classList.toggle('is-active', down);
        };
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          setDown(true);
        });
        btn.addEventListener('pointerup', () => setDown(false));
        btn.addEventListener('pointerleave', () => setDown(false));
        btn.addEventListener('pointercancel', () => setDown(false));
      } else if (c.trigger) {
        btn.addEventListener('click', () => {
          if (!viewer) return;
          if (c.trigger === 'horn') playHorn();
          else playPop(580);
          const res = viewer.triggerAction(c.trigger);
          if (typeof res === 'boolean') {
            btn.setAttribute('aria-pressed', String(res));
            btn.classList.toggle('is-active', res);
          }
        });
      }
      ctrlsHost.appendChild(btn);
    }
    const resetBtn = el(
      'button',
      {
        type: 'button',
        class: 'drive-ctrl-btn',
        id: 'drive-reset-btn',
        title: t('resetSimTitle'),
      },
      t('resetSimBtn'),
    );
    resetBtn.addEventListener('click', () => {
      if (!viewer) return;
      playPop(520);
      viewer.triggerAction('reset');
    });
    ctrlsHost.appendChild(resetBtn);
  }
}

function updateDriveHud(st = {}) {
  const act = activeAction();
  for (const g of act.hud) {
    const valEl = $(`#drive-gauges [data-hud-val="${g.id}"]`);
    const raw = st[g.id];
    if (valEl && raw !== undefined) {
      if (g.id === 'rpm' && typeof raw === 'number') {
        valEl.textContent = `${Math.round(raw).toLocaleString()} RPM`;
      } else {
        valEl.textContent = String(raw);
      }
    }
    if (g.bar) {
      const barEl = $(`#drive-gauges [data-hud-bar="${g.id}"]`);
      if (barEl) {
        const barRaw = Number(st[`${g.id}Bar`] ?? raw ?? 0) || 0;
        const max = Number(g.max) || 100;
        const pct = Math.max(6, Math.min(100, (barRaw / max) * 100));
        barEl.style.width = `${pct.toFixed(1)}%`;
      }
    }
  }
  if (st.warning) {
    setStageMessage(st.warning, 'is-oops');
  }
  if (st.checks && Array.isArray(act.checklist)) {
    let doneCount = 0;
    for (const item of act.checklist) {
      const done = Boolean(st.checks[item.id]);
      if (done) doneCount += 1;
      const chip = $(`#drive-checklist [data-check-id="${item.id}"]`);
      if (chip) chip.classList.toggle('is-found', done);
    }
    if (doneCount > 0) {
      awardModeStars(state.activeObjectId, 'drive', doneCount);
    }
  }
}

function toggleDriveMode(forceState) {
  if (!viewer) return;
  const next = typeof forceState === 'boolean' ? forceState : !viewer.driveMode;
  viewer.setDriveMode(next);
  const driveHud = $('#drive-hud');
  if (driveHud) driveHud.hidden = !next;
  syncActionUi();
  if (next) {
    setStageMessage('', '');
    updateDriveHud(viewer.driveState);
    if (state.mode !== 'drive') {
      state.mode = 'drive';
      $('#stage').setAttribute('data-mode', 'drive');
      for (const btn of $$('.mode-btn')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.mode === 'drive'));
      }
      renderDrivePanel();
    }
  } else if (state.mode === 'drive') {
    setMode('explore');
  }
}

function renderDrivePanel() {
  const panel = $('#panel');
  clear(panel);
  const obj = getObjectById(state.activeObjectId);
  const locCat = tCategory(obj);
  const act = activeAction();
  const checks = viewer?.sim?.checks || {};

  const checkListEl = el('ul', { class: 'chips', id: 'drive-checklist' });
  for (const item of act.checklist) {
    const done = Boolean(checks[item.id]);
    checkListEl.appendChild(
      el(
        'li',
        {},
        el(
          'span',
          { class: `chip ${done ? 'is-found' : ''}`.trim(), 'data-check-id': item.id },
          item.label,
        ),
      ),
    );
  }

  const stopBtn = el(
    'button',
    { type: 'button', class: 'btn btn-secondary btn-small' },
    `⏹️ ${act.stopVerb}`,
  );
  stopBtn.addEventListener('click', () => {
    playPop(520);
    setMode('explore');
  });

  const card = el(
    'div',
    { class: 'card', id: 'drive-panel-card' },
    el('span', { class: 'part-cat' }, t('liveSimSubtitle', { name: locCat.name })),
    el('h2', { class: 'part-name' }, `${act.emoji} ${act.verb}`),
    el('p', { class: 'part-desc' }, t('simInstructions')),
    el('h3', {}, t('missionChecklistTitle')),
    checkListEl,
    el('div', { class: 'card-actions' }, stopBtn),
  );
  panel.appendChild(card);
  renderExplorePanelAppendParts(panel, obj);
}

function renderExplorePanelAppendParts(panel, obj) {
  const prog = getObjProgress(obj.id);
  const chipsList = el('ul', { class: 'chips', id: 'parts-checklist' });
  for (const p of obj.parts) {
    const locP = tPart(p);
    const isFound = prog.foundParts.includes(p.id);
    const chipBtn = el(
      'button',
      {
        type: 'button',
        class: `chip ${isFound ? 'is-found' : ''}`.trim(),
        'data-part-id': p.id,
      },
      locP.name,
    );
    chipBtn.addEventListener('click', () => handleStagePartClick(p.id));
    chipsList.appendChild(el('li', {}, chipBtn));
  }
  panel.appendChild(
    el('div', { class: 'card' }, el('h3', {}, t('partsCountHeading', { total: obj.parts.length })), chipsList),
  );
}

// ============================================================================
// Lab Screen, Model Variant Selector & Mode Switching
// ============================================================================
function syncLabHeader(obj) {
  const locCat = tCategory(obj);
  $('#lab-title').textContent = `${obj.emoji} ${locCat.fullName}`;
  const sub = $('#lab-subtitle');
  if (sub) sub.textContent = locCat.tagline || '';
}

function renderModelSelector(obj) {
  const host = $('#model-selector');
  if (!host) return;
  clear(host);
  if (!Array.isArray(obj.models) || obj.models.length <= 1) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  for (const m of obj.models) {
    const locM = tModel(m);
    const isActive = m.id === obj.activeModelId;
    const pill = el(
      'button',
      {
        type: 'button',
        class: `model-pill ${isActive ? 'is-active' : ''}`.trim(),
        'data-model-id': m.id,
        'aria-pressed': String(isActive),
      },
      el('span', { class: 'model-pill-name' }, locM.name),
      locM.badge ? el('span', { class: 'model-pill-badge' }, locM.badge) : null,
    );
    pill.addEventListener('click', () => {
      if (m.id === obj.activeModelId) return;
      playPop(620);
      selectModelVariant(m.id);
    });
    host.appendChild(pill);
  }
}

function selectModelVariant(modelId) {
  stopSpeaking();
  const obj = setCategoryModel(state.activeObjectId, modelId);
  trackModelSelect(obj.id, obj.activeModelId || modelId);
  state.selectedPartId = obj.parts[0].id;
  syncLabHeader(obj);
  renderModelSelector(obj);

  if (viewer) {
    const wasDriving = viewer.driveMode;
    viewer.loadObject(obj);
    viewer.setFoundParts(getObjProgress(obj.id).foundParts);
    if (wasDriving) viewer.setDriveMode(true);
  }
  syncActionUi();
  setMode(state.mode);
}

function openObjectLab(objId, initialMode = 'explore') {
  const obj = getObjectById(objId);
  trackCategorySelect(obj.id);
  state.screen = 'lab';
  state.activeObjectId = obj.id;
  state.selectedPartId = obj.parts[0].id;

  $('#home-screen').hidden = true;
  $('#lab-screen').hidden = false;
  $('#home-btn').hidden = false;
  syncLabHeader(obj);
  renderModelSelector(obj);

  if (!viewer) {
    viewer = new StageViewer({
      canvasHost: $('#stage-canvas'),
      labelsHost: $('#labels'),
      onPartClick: (partId) => handleStagePartClick(partId),
      onDriveTelemetry: (st) => updateDriveHud(st),
    });
    const ok = viewer.init();
    if (!ok) {
      $('#stage-error').hidden = false;
    }
  }

  toggleDriveMode(false);
  viewer.resize();
  viewer.loadObject(obj);
  viewer.setFoundParts(getObjProgress(obj.id).foundParts);
  syncActionUi();

  // Sync HUD toggles
  $('#xray-btn').setAttribute('aria-pressed', String(viewer.xrayMode));
  $('#spin-btn').setAttribute('aria-pressed', String(viewer.autoRotate));
  $('#labels-btn').setAttribute('aria-pressed', String(viewer.showLabels));

  updateStarHeader();
  updateModeTabStars();
  setMode(initialMode);
}

function setMode(mode) {
  stopSpeaking();
  if (!MODES.includes(mode)) mode = 'explore';
  if (mode !== 'drive' && viewer && viewer.driveMode) {
    viewer.setDriveMode(false);
    const driveHud = $('#drive-hud');
    if (driveHud) driveHud.hidden = true;
    syncActionUi();
  }
  state.mode = mode;

  $('#stage').setAttribute('data-mode', mode);
  for (const btn of $$('.mode-btn')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
  }

  setStageMessage('', '');

  const obj = getObjectById(state.activeObjectId);
  trackModeSwitch(mode, obj.id, obj.activeModelId || obj.id);
  if (mode === 'explore') {
    viewer.setShowLabels($('#labels-btn').getAttribute('aria-pressed') === 'true');
    syncExplodeControls(viewer.explodeTarget);
    if (!state.selectedPartId) state.selectedPartId = obj.parts[0].id;
    markPartExplored(state.selectedPartId);
    viewer.selectPart(state.selectedPartId, false);
    renderExplorePanel();
  } else if (mode === 'find') {
    startFindMode();
  } else if (mode === 'build') {
    startBuildMode();
  } else if (mode === 'quiz') {
    startQuizMode();
  } else if (mode === 'drive') {
    if (!viewer.driveMode) toggleDriveMode(true);
    renderDrivePanel();
  }
}

function syncExplodeControls(fraction) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  $('#explode-slider').value = String(pct);
  $('#explode-icon').textContent = '💥';
  $('#explode-text').textContent = t('explodeBtn');
  $('#explode-btn').disabled = pct >= 99;
  $('#assemble-btn').disabled = pct <= 1;
}

function setExplodeFraction(fraction, withSound = false) {
  const clamped = Math.max(0, Math.min(1, fraction));
  if (withSound) playWhoosh(clamped > 0.4);
  viewer.setExplode(clamped);
  syncExplodeControls(clamped);
}

function setStageMessage(text, toneClass = '') {
  const msg = $('#stage-msg');
  msg.textContent = text || '';
  msg.className = 'stage-msg' + (toneClass ? ` ${toneClass}` : '');
}

// ============================================================================
// Mode 1: EXPLORE
// ============================================================================
function markPartExplored(partId) {
  const obj = getObjectById(state.activeObjectId);
  const prog = getObjProgress(obj.id);
  if (!prog.foundParts.includes(partId)) {
    prog.foundParts.push(partId);
    saveProgress();
  }
  viewer.setFoundParts(prog.foundParts);

  const modelFoundCount = getActiveModelFoundCount(obj);
  const ratio = modelFoundCount / obj.parts.length;
  let stars = 0;
  if (ratio >= 1) stars = 3;
  else if (ratio >= 0.6) stars = 2;
  else if (ratio >= 0.3) stars = 1;
  if (stars > 0) awardModeStars(obj.id, 'explore', stars);
}

function renderExplorePanel() {
  const panel = $('#panel');
  clear(panel);
  const obj = getObjectById(state.activeObjectId);
  const prog = getObjProgress(obj.id);
  const rawPart = obj.parts.find((p) => p.id === state.selectedPartId) || obj.parts[0];
  const part = tPart(rawPart);
  const modelFoundCount = getActiveModelFoundCount(obj);
  const activeModelKey = obj.activeModelId || obj.models?.[0]?.id || obj.id;
  const studioKey = `${activeModelKey}__${rawPart.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Part Inspector Card
  const readBtn = el(
    'button',
    { type: 'button', class: 'btn btn-teal btn-small', id: 'read-aloud-btn' },
    el('span', { 'aria-hidden': 'true' }, '🗣️'),
    ` ${t('readAloud')}`,
  );
  readBtn.addEventListener('click', () => {
    speakText(`${part.name}. ${part.desc} ${t('funFactPrefix', { fact: part.funFact })}`, {
      studioKey,
    });
    const diag = getAudioDiagnostics();
    trackReadAloud(getLang(), diag.lastSpeech?.engine || 'chirp3-hd', studioKey);
  });

  const explodePartBtn = el(
    'button',
    { type: 'button', class: 'btn btn-sun btn-small' },
    el('span', { 'aria-hidden': 'true' }, '💥'),
    ` ${viewer.explodeTarget < 0.6 ? t('explodeSeeInside') : t('assembleBack')}`,
  );
  explodePartBtn.addEventListener('click', () => {
    const next = viewer.explodeTarget < 0.6 ? 0.85 : 0;
    setExplodeFraction(next, true);
    renderExplorePanel();
  });

  const inspectorCard = el(
    'div',
    { class: 'card', id: 'part-inspector' },
    el('span', { class: 'part-cat' }, part.category),
    el('h2', { class: 'part-name', id: 'inspector-part-name' }, part.name),
    el('p', { class: 'part-desc', id: 'inspector-part-desc' }, part.desc),
    el('p', { class: 'fun-fact', id: 'inspector-fun-fact' }, t('funFactPrefix', { fact: part.funFact })),
    el('div', { class: 'card-actions' }, readBtn, explodePartBtn),
  );

  // Parts Checklist Card
  const chipsList = el('ul', { class: 'chips', id: 'parts-checklist' });
  for (const p of obj.parts) {
    const locP = tPart(p);
    const isFound = prog.foundParts.includes(p.id);
    const isSelected = p.id === rawPart.id;
    const chipBtn = el(
      'button',
      {
        type: 'button',
        class: `chip ${isFound ? 'is-found' : ''} ${isSelected ? 'is-selected' : ''}`.trim(),
        'data-part-id': p.id,
      },
      locP.name,
    );
    chipBtn.addEventListener('click', () => {
      handleStagePartClick(p.id);
    });
    chipsList.appendChild(el('li', {}, chipBtn));
  }

  const checklistCard = el(
    'div',
    { class: 'card' },
    el(
      'h3',
      {},
      t('partsDiscovered', { found: modelFoundCount, total: obj.parts.length }),
    ),
    el('progress', {
      class: 'meter',
      value: modelFoundCount,
      max: obj.parts.length,
    }),
    el('p', { class: 'muted' }, t('exploreHelper')),
    chipsList,
  );

  panel.append(inspectorCard, checklistCard);
}

// ============================================================================
// Mode 2: FIND IT!
// ============================================================================
function startFindMode() {
  const obj = getObjectById(state.activeObjectId);
  const rounds = shuffle(obj.parts).slice(0, Math.min(6, obj.parts.length));
  state.findSession = {
    targets: rounds,
    index: 0,
    mistakes: 0,
    results: rounds.map(() => 'pending'), // 'right' | 'wrong' | 'pending'
    currentMistakes: 0,
  };
  // Partially explode the 3D object so internal pieces are clickable, and hide name callouts
  setExplodeFraction(0.75, true);
  viewer.setShowLabels(false);
  viewer.selectPart(null, false);
  renderFindPanel();
}

function renderFindPanel() {
  const panel = $('#panel');
  clear(panel);
  const sess = state.findSession;
  if (!sess) return;
  const rawTarget = sess.targets[sess.index] || sess.targets[0];
  const target = tPart(rawTarget);

  const dots = el('ul', { class: 'dots', 'aria-label': t('modeFind') });
  sess.results.forEach((status, i) => {
    let cls = 'dot';
    if (i === sess.index) cls += ' is-now';
    else if (status === 'right') cls += ' is-right';
    else if (status === 'wrong') cls += ' is-wrong';
    dots.appendChild(el('li', { class: cls }));
  });

  const hintBtn = el(
    'button',
    { type: 'button', class: 'btn btn-sun btn-small', id: 'find-hint-btn' },
    t('showHint'),
  );
  hintBtn.addEventListener('click', () => {
    playPop(600);
    viewer.selectPart(rawTarget.id, true);
    setStageMessage(t('lookForGlowing', { name: target.name }), 'is-good');
  });

  const speakPromptBtn = el(
    'button',
    { type: 'button', class: 'btn btn-teal btn-small', id: 'hear-clue-btn' },
    t('hearClue'),
  );
  speakPromptBtn.addEventListener('click', () => {
    speakText(`${target.name}. ${t('cluePrefix', { desc: target.desc })}`);
  });

  // Also provide accessible part buttons for keyboard/screen-reader or mobile quick-tap
  const obj = getObjectById(state.activeObjectId);
  const quickChips = el('ul', { class: 'chips', id: 'find-part-choices' });
  for (const p of obj.parts) {
    const locP = tPart(p);
    const b = el(
      'button',
      { type: 'button', class: 'chip', 'data-part-id': p.id },
      t('tap3dPiece', { num: obj.parts.indexOf(p) + 1, category: locP.category }),
    );
    b.addEventListener('click', () => handleFindAttempt(p.id));
    quickChips.appendChild(el('li', {}, b));
  }

  const card = el(
    'div',
    { class: 'card', id: 'find-card' },
    dots,
    el('p', { class: 'prompt-label' }, t('findRoundLabel', { round: sess.index + 1, total: sess.targets.length })),
    el('h2', { class: 'prompt-big', id: 'find-target-name', 'data-target-id': rawTarget.id }, target.name),
    el('p', { class: 'part-desc' }, t('cluePrefix', { desc: target.desc })),
    el('div', { class: 'card-actions' }, speakPromptBtn, hintBtn),
  );

  const helperCard = el(
    'div',
    { class: 'card' },
    el('h3', {}, t('findHelperTitle')),
    el('p', { class: 'muted' }, t('findHelperSub')),
    quickChips,
  );

  panel.append(card, helperCard);
}

function handleFindAttempt(partId) {
  const sess = state.findSession;
  if (!sess || sess.index >= sess.targets.length) return;
  const rawTarget = sess.targets[sess.index];
  const target = tPart(rawTarget);
  const obj = getObjectById(state.activeObjectId);
  const locCat = tCategory(obj);
  const rawTapped = obj.parts.find((p) => p.id === partId);
  const tappedPart = rawTapped ? tPart(rawTapped) : null;

  if (partId === rawTarget.id) {
    playCorrect();
    sess.results[sess.index] = sess.currentMistakes === 0 ? 'right' : 'wrong';
    viewer.selectPart(rawTarget.id, true);
    setStageMessage(t('foundRightMsg', { praise: tPraise(), name: target.name }), 'is-good');
    sess.index += 1;
    sess.currentMistakes = 0;

    if (sess.index >= sess.targets.length) {
      const stars = sess.mistakes === 0 ? 3 : sess.mistakes <= 2 ? 2 : 1;
      awardModeStars(obj.id, 'find', stars);
      setTimeout(() => {
        showCelebration({
          title: t('findCelebTitle', { name: locCat.name }),
          stars,
          text: t('findCelebText', { count: sess.targets.length }),
          nextMode: 'build',
          nextLabel: t('playBuildNext'),
        });
      }, 450);
    } else {
      renderFindPanel();
    }
  } else {
    playOops();
    sess.mistakes += 1;
    sess.currentMistakes += 1;
    viewer.selectPart(partId, false);
    setStageMessage(
      t('foundOopsMsg', {
        wrong: tappedPart ? tappedPart.name : t('wrongPiece'),
        target: target.name,
      }),
      'is-oops',
    );
    if (sess.currentMistakes >= 2) {
      viewer.selectPart(rawTarget.id, true);
    }
  }
}

// ============================================================================
// Mode 3: BUILD IT!
// ============================================================================
function startBuildMode() {
  const obj = getObjectById(state.activeObjectId);
  state.buildSession = {
    order: obj.parts.slice(),
    placedIds: new Set(),
    index: 0,
  };
  viewer.setShowLabels(false);
  const firstTarget = tPart(state.buildSession.order[0]);
  viewer.setBuildStates(state.buildSession.placedIds, firstTarget.id, false);
  setStageMessage(t('buildStep1Msg', { name: firstTarget.name }), '');
  renderBuildPanel();
}

function renderBuildPanel() {
  const panel = $('#panel');
  clear(panel);
  const sess = state.buildSession;
  if (!sess) return;
  const doneCount = sess.placedIds.size;
  const total = sess.order.length;
  const rawTarget = sess.order[sess.index] || sess.order[total - 1];
  const currentTarget = tPart(rawTarget);

  const snapNowBtn = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary btn-big btn-block',
      id: 'snap-piece-btn',
      disabled: doneCount >= total,
    },
    t('snapIntoPlaceBtn', { name: currentTarget.name }),
  );
  snapNowBtn.addEventListener('click', () => {
    snapBuildPart(rawTarget.id);
  });

  const stepCard = el(
    'div',
    { class: 'card', id: 'build-step-card' },
    el('p', { class: 'prompt-label' }, t('buildStepLabel', { step: Math.min(doneCount + 1, total), total })),
    el('h2', { class: 'prompt-big', id: 'build-target-name' }, currentTarget.name),
    el('p', { class: 'part-desc' }, currentTarget.desc),
    el('progress', { class: 'meter', value: doneCount, max: total }),
    el('p', { class: 'muted' }, t('partsAssembledCount', { done: doneCount, total })),
    el('div', { class: 'card-actions' }, snapNowBtn),
  );

  const chips = el('ul', { class: 'chips', id: 'build-parts-list' });
  for (const p of sess.order) {
    const locP = tPart(p);
    const placed = sess.placedIds.has(p.id);
    const isNow = !placed && p.id === rawTarget.id;
    const chip = el(
      'button',
      {
        type: 'button',
        class: `chip ${placed ? 'is-placed' : ''} ${isNow ? 'is-selected' : ''}`.trim(),
        'data-part-id': p.id,
      },
      locP.name,
    );
    chip.addEventListener('click', () => {
      snapBuildPart(p.id);
    });
    chips.appendChild(el('li', {}, chip));
  }

  const listCard = el(
    'div',
    { class: 'card' },
    el('h3', {}, t('assemblyChecklistTitle')),
    el('p', { class: 'muted' }, t('assemblyChecklistSub')),
    chips,
  );

  panel.append(stepCard, listCard);
}

function snapBuildPart(partId) {
  const obj = getObjectById(state.activeObjectId);
  const locCat = tCategory(obj);
  const sess = state.buildSession;
  if (!sess) return;

  if (sess.placedIds.has(partId)) {
    playPop(480);
    setStageMessage(t('alreadyBoltedMsg'), '');
    return;
  }

  playSnap();
  sess.placedIds.add(partId);

  // Advance index to next unplaced part
  while (sess.index < sess.order.length && sess.placedIds.has(sess.order[sess.index].id)) {
    sess.index += 1;
  }

  const nextRawTarget = sess.order[sess.index] || null;
  const nextTarget = nextRawTarget ? tPart(nextRawTarget) : null;
  viewer.setBuildStates(sess.placedIds, nextRawTarget ? nextRawTarget.id : null, false);

  const rawSnapped = obj.parts.find((p) => p.id === partId);
  const snappedPart = rawSnapped ? tPart(rawSnapped) : null;
  if (sess.placedIds.size >= sess.order.length) {
    setStageMessage(t('assembled100Msg', { name: locCat.name }), 'is-good');
    awardModeStars(obj.id, 'build', 3);
    renderBuildPanel();
    setTimeout(() => {
      showCelebration({
        title: t('buildCelebTitle', { name: locCat.name }),
        stars: 3,
        text: t('buildCelebText', { total: sess.order.length }),
        nextMode: 'quiz',
        nextLabel: t('takeQuizNext'),
      });
    }, 450);
  } else {
    setStageMessage(
      t('snappedStepMsg', {
        praise: tPraise(),
        snapped: snappedPart ? snappedPart.name : '',
        next: nextTarget ? nextTarget.name : '',
      }),
      'is-good',
    );
    renderBuildPanel();
  }
}

// ============================================================================
// Mode 4: QUIZ (5 Multiple-Choice Questions per Object)
// ============================================================================
function startQuizMode() {
  const obj = getObjectById(state.activeObjectId);
  const questions = obj.quiz.map((qItem) => {
    const correctPart = obj.parts.find((p) => p.id === qItem.correctId);
    const distractorParts = qItem.distractors
      .map((id) => obj.parts.find((p) => p.id === id))
      .filter(Boolean);
    const options = shuffle([correctPart, ...distractorParts]);
    return {
      q: qItem.q,
      correctId: qItem.correctId,
      options,
    };
  });

  state.quizSession = {
    questions,
    index: 0,
    score: 0,
    streak: 0,
    answered: false,
    results: questions.map(() => 'pending'),
  };

  setExplodeFraction(0.55, false);
  viewer.setShowLabels(false);
  viewer.selectPart(null, false);
  renderQuizPanel();
}

function renderQuizPanel() {
  const panel = $('#panel');
  clear(panel);
  const obj = getObjectById(state.activeObjectId);
  const sess = state.quizSession;
  if (!sess) return;
  const cur = sess.questions[sess.index];
  const localizedQuestionText = tQuizQuestion(cur, obj);

  const dots = el('ul', { class: 'dots', 'aria-label': t('modeQuiz') });
  sess.results.forEach((status, i) => {
    let cls = 'dot';
    if (i === sess.index && status === 'pending') cls += ' is-now';
    else if (status === 'right') cls += ' is-right';
    else if (status === 'wrong') cls += ' is-wrong';
    dots.appendChild(el('li', { class: cls }));
  });

  const optsWrap = el('div', { class: 'options', id: 'quiz-options' });
  const feedbackEl = el('p', { class: 'feedback', id: 'quiz-feedback', role: 'status' });
  const nextRow = el('div', { class: 'row', id: 'quiz-next-row' });

  for (const rawOptPart of cur.options) {
    const optPart = tPart(rawOptPart);
    const btn = el(
      'button',
      {
        type: 'button',
        class: 'opt',
        'data-part-id': rawOptPart.id,
        'data-correct': rawOptPart.id === cur.correctId ? 'true' : 'false',
      },
      optPart.name,
    );
    btn.addEventListener('click', () => {
      if (sess.answered) return;
      sess.answered = true;
      const isRight = rawOptPart.id === cur.correctId;

      for (const b of $$('.opt', optsWrap)) {
        b.disabled = true;
        if (b.dataset.partId === cur.correctId) b.classList.add('is-right');
        else if (b === btn && !isRight) b.classList.add('is-wrong');
      }

      viewer.selectPart(cur.correctId, true);
      const rawCorrectPart = obj.parts.find((p) => p.id === cur.correctId);
      const correctPart = rawCorrectPart ? tPart(rawCorrectPart) : optPart;

      if (isRight) {
        playCorrect();
        sess.score += 1;
        sess.streak += 1;
        sess.results[sess.index] = 'right';
        feedbackEl.className = 'feedback is-good';
        feedbackEl.textContent = `${tPraise()} ${correctPart.name}: ${correctPart.desc}`;
        setStageMessage(t('quizCorrectToast', { streak: sess.streak }), 'is-good');
      } else {
        playOops();
        sess.streak = 0;
        sess.results[sess.index] = 'wrong';
        feedbackEl.className = 'feedback is-oops';
        feedbackEl.textContent = t('quizWrongFeedback', {
          name: correctPart.name,
          desc: correctPart.desc,
        });
        setStageMessage(t('quizLookHighlighted', { name: correctPart.name }), 'is-oops');
      }

      const isLast = sess.index >= sess.questions.length - 1;
      const nextBtn = el(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary btn-block',
          id: 'quiz-next-btn',
        },
        isLast ? t('seeQuizScore') : t('nextQuestion'),
      );
      nextBtn.addEventListener('click', () => {
        if (isLast) {
          finishQuiz();
        } else {
          sess.index += 1;
          sess.answered = false;
          viewer.selectPart(null, false);
          renderQuizPanel();
        }
      });
      nextRow.appendChild(nextBtn);
    });
    optsWrap.appendChild(btn);
  }

  const readQuestionBtn = el(
    'button',
    { type: 'button', class: 'btn btn-ghost btn-small', id: 'read-question-btn' },
    t('readQuestion'),
  );
  readQuestionBtn.addEventListener('click', () => {
    speakText(localizedQuestionText);
  });

  const card = el(
    'div',
    { class: 'card', id: 'quiz-card' },
    dots,
    el(
      'p',
      { class: 'prompt-label' },
      t('quizProgressLabel', {
        num: sess.index + 1,
        total: sess.questions.length,
        score: sess.score,
      }),
    ),
    el('h2', { class: 'question', id: 'quiz-question-text' }, localizedQuestionText),
    optsWrap,
    feedbackEl,
    nextRow,
    el('div', { class: 'card-actions' }, readQuestionBtn),
  );

  panel.appendChild(card);
}

function finishQuiz() {
  const obj = getObjectById(state.activeObjectId);
  const locCat = tCategory(obj);
  const sess = state.quizSession;
  const total = sess.questions.length;
  let stars = 1;
  if (sess.score >= total) stars = 3;
  else if (sess.score >= 3) stars = 2;

  awardModeStars(obj.id, 'quiz', stars);
  trackQuizComplete(obj.id, obj.activeModelId || obj.id, sess.score, total, stars);
  showCelebration({
    title: t('quizCelebTitle', { score: sess.score, total }),
    stars,
    text:
      sess.score === total
        ? t('quizPerfectText', { name: locCat.name })
        : t('quizGoodText', { name: locCat.name }),
    nextMode: 'explore',
    nextLabel: t('backToExplore'),
  });
}

// ============================================================================
// Stage 3D Click Dispatcher
// ============================================================================
function handleStagePartClick(partId) {
  if (state.mode === 'explore') {
    playPop(540);
    state.selectedPartId = partId;
    const obj = getObjectById(state.activeObjectId);
    trackPartInspect(obj.id, obj.activeModelId || obj.id, partId);
    markPartExplored(partId);
    viewer.selectPart(partId, true);
    renderExplorePanel();
  } else if (state.mode === 'find') {
    handleFindAttempt(partId);
  } else if (state.mode === 'build') {
    snapBuildPart(partId);
  } else if (state.mode === 'quiz') {
    // In quiz mode, clicking a 3D part selects the matching option button if available
    const matchingOpt = $(`#quiz-options .opt[data-part-id="${partId}"]`);
    if (matchingOpt && !matchingOpt.disabled) {
      matchingOpt.click();
    } else {
      playPop(500);
      viewer.selectPart(partId, false);
    }
  }
}

// ============================================================================
// Celebration Modal & Confetti
// ============================================================================
function showCelebration({ title, stars, text, nextMode, nextLabel }) {
  playFanfare();
  burstConfetti();

  const dlg = $('#celebrate');
  $('#celebrate-title').textContent = title;
  $('#celebrate-text').textContent = text;

  const starBox = $('#celebrate-stars');
  clear(starBox);
  for (let i = 1; i <= 3; i++) {
    starBox.appendChild(
      el('span', { class: `star ${i > stars ? 'is-empty' : ''}`.trim() }, '⭐'),
    );
  }

  const actions = $('#celebrate-actions');
  clear(actions);

  const nextBtn = el(
    'button',
    { type: 'button', class: 'btn btn-primary btn-big', id: 'celebrate-next-btn' },
    nextLabel || t('keepPlaying'),
  );
  nextBtn.addEventListener('click', () => {
    dlg.close();
    setMode(nextMode || 'explore');
  });

  const homeBtn = el(
    'button',
    { type: 'button', class: 'btn btn-secondary', id: 'celebrate-home-btn' },
    t('pickAnotherObject'),
  );
  homeBtn.addEventListener('click', () => {
    dlg.close();
    showHome();
  });

  actions.append(nextBtn, homeBtn);
  if (typeof dlg.showModal === 'function' && !dlg.open) {
    dlg.showModal();
  }
}

function burstConfetti() {
  if (prefersReducedMotion()) return;
  const canvas = $('#confetti');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#ffc93c', '#d63b2f', '#2160d8', '#0b7a75', '#2ecc71', '#9b59b6'];
  const pieces = Array.from({ length: 65 }, (_, i) => ({
    x: canvas.width * 0.5 + (Math.cos(i) * 60),
    y: canvas.height * 0.38,
    vx: (Math.sin(i * 1.7) * 9),
    vy: -6 - (i % 7) * 1.4,
    size: 8 + (i % 5) * 2,
    color: colors[i % colors.length],
    rot: i * 0.4,
    vrot: (i % 2 === 0 ? 1 : -1) * 0.12,
  }));

  let frame = 0;
  function step() {
    frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32;
      p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }
    if (frame < 75) {
      requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(step);
}

// ============================================================================
// Global Event Bindings
// ============================================================================
function initEvents() {
  $('#home-btn').addEventListener('click', () => {
    playPop(440);
    showHome();
  });

  $('.brand').addEventListener('click', () => {
    if (state.screen !== 'home') showHome();
  });
  $('.brand').style.cursor = 'pointer';

  $('#sound-btn').addEventListener('click', () => {
    const nowMuted = toggleMuted();
    $('#sound-btn').setAttribute('aria-pressed', String(!nowMuted));
    $('#sound-icon').textContent = nowMuted ? '🔇' : '🔊';
  });

  // Mode buttons
  for (const btn of $$('.mode-btn')) {
    btn.addEventListener('click', () => {
      playPop(580);
      setMode(btn.dataset.mode);
    });
  }

  // Stage HUD controls
  $('#explode-btn').addEventListener('click', () => {
    setExplodeFraction(1, true);
    if (state.mode === 'explore') renderExplorePanel();
  });

  $('#assemble-btn').addEventListener('click', () => {
    setExplodeFraction(0, true);
    if (state.mode === 'explore') renderExplorePanel();
  });

  $('#drive-btn').addEventListener('click', () => {
    playPop(640);
    toggleDriveMode();
  });

  // Keyboard controls for active category simulation
  const resolveHoldKeys = (e) => {
    const act = activeAction();
    const map = act.keys || {};
    const k = e.key.toLowerCase();
    const out = [];
    if (map[e.key]) out.push(map[e.key]);
    if (map[k] && !out.includes(map[k])) out.push(map[k]);
    if (e.key === 'Shift' && !out.includes('nitro')) out.push('nitro');
    if (k === 'b' && !out.includes('boost')) out.push('boost');
    return out;
  };

  window.addEventListener('keydown', (e) => {
    if (!viewer || !viewer.driveMode || state.screen !== 'lab') return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    const act = activeAction();
    const k = e.key.toLowerCase();

    const tapAction = (act.taps && (act.taps[e.key] || act.taps[k])) || (k === 'r' ? 'reset' : null);
    if (tapAction) {
      e.preventDefault();
      if (tapAction === 'horn') playHorn();
      const res = viewer.triggerAction(tapAction);
      const tapBtn = $(`#drive-controls [data-action="${tapAction}"]`);
      if (tapBtn && typeof res === 'boolean') {
        tapBtn.setAttribute('aria-pressed', String(res));
        tapBtn.classList.toggle('is-active', res);
      }
      return;
    }

    const holds = resolveHoldKeys(e);
    if (holds.length) {
      e.preventDefault();
      for (const h of holds) {
        viewer.setDriveInput(h, true);
        const holdBtn = $(`#drive-controls [data-hold="${h}"]`);
        if (holdBtn) holdBtn.classList.add('is-active');
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!viewer || !viewer.driveMode) return;
    const holds = resolveHoldKeys(e);
    for (const h of holds) {
      viewer.setDriveInput(h, false);
      const holdBtn = $(`#drive-controls [data-hold="${h}"]`);
      if (holdBtn) holdBtn.classList.remove('is-active');
    }
  });

  $('#explode-slider').addEventListener('input', (e) => {
    const val = Number(e.target.value) / 100;
    setExplodeFraction(val, false);
  });

  $('#xray-btn').addEventListener('click', () => {
    if (!viewer) return;
    playPop(620);
    const next = viewer.setXrayMode(!viewer.xrayMode);
    $('#xray-btn').setAttribute('aria-pressed', String(next));
    setStageMessage(next ? t('xrayOnMsg') : t('xrayOffMsg'), '');
  });

  $('#spin-btn').addEventListener('click', () => {
    if (!viewer) return;
    playPop(620);
    const next = viewer.setAutoRotate(!viewer.autoRotate);
    $('#spin-btn').setAttribute('aria-pressed', String(next));
  });

  $('#labels-btn').addEventListener('click', () => {
    if (!viewer) return;
    playPop(540);
    const next = !viewer.showLabels;
    viewer.setShowLabels(next);
    $('#labels-btn').setAttribute('aria-pressed', String(next));
  });

  $('#view-btn').addEventListener('click', () => {
    if (!viewer) return;
    playPop(500);
    viewer.resetView();
  });

  // Language selector
  const langSelect = $('#lang-select');
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener('change', (e) => {
      playPop(560);
      const nextCode = setLang(e.target.value);
      trackLanguageSwitch(nextCode);
    });
  }

  onLangChange(() => {
    stopSpeaking();
    syncStaticChromeI18n();
    if (state.screen === 'home') {
      renderHomeGrid();
    } else {
      const obj = getObjectById(state.activeObjectId);
      syncLabHeader(obj);
      renderModelSelector(obj);
      syncActionUi();
      if (viewer) {
        viewer.refreshLabels();
        if (viewer.driveMode) {
          updateDriveHud(viewer.driveState);
        }
      }
      if (state.mode === 'explore') renderExplorePanel();
      else if (state.mode === 'find') renderFindPanel();
      else if (state.mode === 'build') renderBuildPanel();
      else if (state.mode === 'quiz') renderQuizPanel();
      else if (state.mode === 'drive') renderDrivePanel();
    }
  });

  // Reset stars dialog
  const confirmDlg = $('#confirm');
  $('#reset-btn').addEventListener('click', () => {
    if (typeof confirmDlg.showModal === 'function') confirmDlg.showModal();
  });
  $('#confirm-no').addEventListener('click', () => confirmDlg.close());
  $('#confirm-yes').addEventListener('click', () => {
    state.progress = defaultProgress();
    saveProgress();
    confirmDlg.close();
    showHome();
  });
}

// Initialize GA4 telemetry & UI on module evaluation
initAnalytics();
initEvents();
showHome();

onCadReady(() => {
  if (state.screen === 'lab' && viewer) {
    const obj = getObjectById(state.activeObjectId);
    if (obj) {
      const prevExplode = viewer.explodeTarget;
      const prevSelected = state.selectedPartId;
      const wasDriving = viewer.driveMode;
      viewer.loadObject(obj);
      viewer.setFoundParts(getObjProgress(obj.id).foundParts);
      if (prevExplode > 0) viewer.setExplode(prevExplode, true);
      if (prevSelected) viewer.selectPart(prevSelected, false);
      if (wasDriving) viewer.setDriveMode(true);
    }
  }
});
