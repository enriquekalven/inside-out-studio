// Inside Out Studio — Main Application Controller
// Coordinates the Home screen, 3D StageViewer, 5 interactive modes (Explore, Find It!, Build It!, Quiz, Action/Drive),
// multi-model switching per category, star persistence, sound/speech synthesis, and celebration confetti.
import { OBJECTS, getObjectById, setCategoryModel } from './catalog.js';
import { getAction } from './actions.js';
import { StageViewer } from './viewer.js';
import { onCadReady } from './cad_loader.js';
import { el, clear, $, $$, shuffle, starsNode, praise, prefersReducedMotion } from './ui.js';
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
} from './sound.js';

const STORAGE_KEY = 'inside_out_studio_progress_v1';
const CORE_MODES = ['explore', 'find', 'build', 'quiz'];
const MODES = ['explore', 'find', 'build', 'quiz', 'drive'];
const MAX_STARS = OBJECTS.length * CORE_MODES.length * 3;

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
  return getAction(obj.id, obj.activeModelId);
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
// Home Screen
// ============================================================================
function renderHomeGrid() {
  const grid = $('#object-grid');
  clear(grid);
  for (const obj of OBJECTS) {
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
      el('span', { class: 'obj-name' }, obj.name),
      el('span', { class: 'obj-tag' }, obj.tagline),
      el('span', { class: 'obj-models-badge' }, `🎛️ ${modelCount} Realistic 3D Models`),
      el(
        'span',
        { class: `obj-stars ${stars === maxObjStars ? 'obj-done' : ''}` },
        `⭐ ${stars}/${maxObjStars} • 🔍 ${foundCount}/${obj.parts.length} parts`,
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
    tip.textContent = `Drag to spin • Pinch or scroll to zoom • Tap any part • Click ${act.emoji} ${act.verb} ${act.hint}`;
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
        title: 'Reset Simulation (R)',
      },
      '🔄 Reset',
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
    el('span', { class: 'part-cat' }, `${obj.name} • Live Simulator`),
    el('h2', { class: 'part-name' }, `${act.emoji} ${act.verb}`),
    el(
      'p',
      { class: 'part-desc' },
      'Use the cockpit buttons in the 3D stage or your keyboard (W/S or ↑/↓, A/D or ←/→, Space, B, H, L, R) to complete all 3 mission goals!',
    ),
    el('h3', {}, '3-Star Mission Checklist'),
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
    const isFound = prog.foundParts.includes(p.id);
    const chipBtn = el(
      'button',
      {
        type: 'button',
        class: `chip ${isFound ? 'is-found' : ''}`.trim(),
        'data-part-id': p.id,
      },
      p.name,
    );
    chipBtn.addEventListener('click', () => handleStagePartClick(p.id));
    chipsList.appendChild(el('li', {}, chipBtn));
  }
  panel.appendChild(
    el('div', { class: 'card' }, el('h3', {}, `3D Parts (${obj.parts.length})`), chipsList),
  );
}

// ============================================================================
// Lab Screen, Model Variant Selector & Mode Switching
// ============================================================================
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
    const isActive = m.id === obj.activeModelId;
    const pill = el(
      'button',
      {
        type: 'button',
        class: `model-pill ${isActive ? 'is-active' : ''}`.trim(),
        'data-model-id': m.id,
        'aria-pressed': String(isActive),
      },
      el('span', { class: 'model-pill-name' }, m.name),
      m.badge ? el('span', { class: 'model-pill-badge' }, m.badge) : null,
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
  state.selectedPartId = obj.parts[0].id;
  $('#lab-title').textContent = `${obj.emoji} ${obj.fullName}`;
  const sub = $('#lab-subtitle');
  if (sub) sub.textContent = obj.tagline || '';
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
  state.screen = 'lab';
  state.activeObjectId = obj.id;
  state.selectedPartId = obj.parts[0].id;

  $('#home-screen').hidden = true;
  $('#lab-screen').hidden = false;
  $('#home-btn').hidden = false;
  $('#lab-title').textContent = `${obj.emoji} ${obj.fullName}`;
  const sub = $('#lab-subtitle');
  if (sub) sub.textContent = obj.tagline || '';
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
  $('#explode-text').textContent = 'Explode!';
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
  const part = obj.parts.find((p) => p.id === state.selectedPartId) || obj.parts[0];
  const modelFoundCount = getActiveModelFoundCount(obj);

  // Part Inspector Card
  const readBtn = el(
    'button',
    { type: 'button', class: 'btn btn-teal btn-small', id: 'read-aloud-btn' },
    el('span', { 'aria-hidden': 'true' }, '🗣️'),
    ' Read Aloud',
  );
  readBtn.addEventListener('click', () => {
    speakText(`${part.name}. ${part.desc} Fun fact: ${part.funFact}`);
  });

  const explodePartBtn = el(
    'button',
    { type: 'button', class: 'btn btn-sun btn-small' },
    el('span', { 'aria-hidden': 'true' }, '💥'),
    viewer.explodeTarget < 0.6 ? ' Explode to see inside' : ' Assemble back',
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
    el('p', { class: 'fun-fact', id: 'inspector-fun-fact' }, `💡 Fun Fact: ${part.funFact}`),
    el('div', { class: 'card-actions' }, readBtn, explodePartBtn),
  );

  // Parts Checklist Card
  const chipsList = el('ul', { class: 'chips', id: 'parts-checklist' });
  for (const p of obj.parts) {
    const isFound = prog.foundParts.includes(p.id);
    const isSelected = p.id === part.id;
    const chipBtn = el(
      'button',
      {
        type: 'button',
        class: `chip ${isFound ? 'is-found' : ''} ${isSelected ? 'is-selected' : ''}`.trim(),
        'data-part-id': p.id,
      },
      p.name,
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
      `Parts Discovered (${modelFoundCount}/${obj.parts.length})`,
    ),
    el('progress', {
      class: 'meter',
      value: modelFoundCount,
      max: obj.parts.length,
    }),
    el('p', { class: 'muted' }, 'Tap any 3D piece or part button below to inspect it and earn Explore stars!'),
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
  const target = sess.targets[sess.index];

  const dots = el('ul', { class: 'dots', 'aria-label': 'Find It progress' });
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
    '💡 Show Hint & Highlight',
  );
  hintBtn.addEventListener('click', () => {
    playPop(600);
    viewer.selectPart(target.id, true);
    setStageMessage(`Look for the glowing ${target.name}!`, 'is-good');
  });

  const speakPromptBtn = el(
    'button',
    { type: 'button', class: 'btn btn-teal btn-small' },
    '🗣️ Hear Clue',
  );
  speakPromptBtn.addEventListener('click', () => {
    speakText(`Can you tap the ${target.name}? Clue: ${target.desc}`);
  });

  // Also provide accessible part buttons for keyboard/screen-reader or mobile quick-tap
  const obj = getObjectById(state.activeObjectId);
  const quickChips = el('ul', { class: 'chips', id: 'find-part-choices' });
  for (const p of obj.parts) {
    const b = el(
      'button',
      { type: 'button', class: 'chip', 'data-part-id': p.id },
      `Tap 3D piece #${obj.parts.indexOf(p) + 1} (${p.category})`,
    );
    b.addEventListener('click', () => handleFindAttempt(p.id));
    quickChips.appendChild(el('li', {}, b));
  }

  const card = el(
    'div',
    { class: 'card', id: 'find-card' },
    dots,
    el('p', { class: 'prompt-label' }, `Find It! • Round ${sess.index + 1} of ${sess.targets.length}`),
    el('h2', { class: 'prompt-big', id: 'find-target-name', 'data-target-id': target.id }, target.name),
    el('p', { class: 'part-desc' }, `Clue: ${target.desc}`),
    el('div', { class: 'card-actions' }, speakPromptBtn, hintBtn),
  );

  const helperCard = el(
    'div',
    { class: 'card' },
    el('h3', {}, 'Spin & tap the 3D piece in the blueprint stage!'),
    el('p', { class: 'muted' }, 'You can click directly on the 3D model or use the category locator buttons below:'),
    quickChips,
  );

  panel.append(card, helperCard);
}

function handleFindAttempt(partId) {
  const sess = state.findSession;
  if (!sess || sess.index >= sess.targets.length) return;
  const target = sess.targets[sess.index];
  const obj = getObjectById(state.activeObjectId);
  const tappedPart = obj.parts.find((p) => p.id === partId);

  if (partId === target.id) {
    playCorrect();
    sess.results[sess.index] = sess.currentMistakes === 0 ? 'right' : 'wrong';
    viewer.selectPart(target.id, true);
    setStageMessage(`${praise()} That's the ${target.name}!`, 'is-good');
    sess.index += 1;
    sess.currentMistakes = 0;

    if (sess.index >= sess.targets.length) {
      const stars = sess.mistakes === 0 ? 3 : sess.mistakes <= 2 ? 2 : 1;
      awardModeStars(obj.id, 'find', stars);
      setTimeout(() => {
        showCelebration({
          title: `You found every part of the ${obj.name}!`,
          stars,
          text: `You spotted all ${sess.targets.length} parts in the 3D exploded model!`,
          nextMode: 'build',
          nextLabel: '🧩 Play Build It! next',
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
      `Oops, that's the ${tappedPart ? tappedPart.name : 'wrong piece'}! Try finding the ${target.name}.`,
      'is-oops',
    );
    if (sess.currentMistakes >= 2) {
      viewer.selectPart(target.id, true);
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
  const firstTarget = state.buildSession.order[0];
  viewer.setBuildStates(state.buildSession.placedIds, firstTarget.id, false);
  setStageMessage(`Step 1: Tap the glowing ${firstTarget.name} to snap it into place!`, '');
  renderBuildPanel();
}

function renderBuildPanel() {
  const panel = $('#panel');
  clear(panel);
  const obj = getObjectById(state.activeObjectId);
  const sess = state.buildSession;
  const doneCount = sess.placedIds.size;
  const total = sess.order.length;
  const currentTarget = sess.order[sess.index] || sess.order[total - 1];

  const snapNowBtn = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary btn-big btn-block',
      id: 'snap-piece-btn',
      disabled: doneCount >= total,
    },
    `🧩 Snap ${currentTarget.name} Into Place!`,
  );
  snapNowBtn.addEventListener('click', () => {
    snapBuildPart(currentTarget.id);
  });

  const stepCard = el(
    'div',
    { class: 'card', id: 'build-step-card' },
    el('p', { class: 'prompt-label' }, `Build It! • Step ${Math.min(doneCount + 1, total)} of ${total}`),
    el('h2', { class: 'prompt-big', id: 'build-target-name' }, currentTarget.name),
    el('p', { class: 'part-desc' }, currentTarget.desc),
    el('progress', { class: 'meter', value: doneCount, max: total }),
    el('p', { class: 'muted' }, `${doneCount} of ${total} parts assembled`),
    el('div', { class: 'card-actions' }, snapNowBtn),
  );

  const chips = el('ul', { class: 'chips', id: 'build-parts-list' });
  for (const p of sess.order) {
    const placed = sess.placedIds.has(p.id);
    const isNow = !placed && p.id === currentTarget.id;
    const chip = el(
      'button',
      {
        type: 'button',
        class: `chip ${placed ? 'is-placed' : ''} ${isNow ? 'is-selected' : ''}`.trim(),
        'data-part-id': p.id,
      },
      p.name,
    );
    chip.addEventListener('click', () => {
      snapBuildPart(p.id);
    });
    chips.appendChild(el('li', {}, chip));
  }

  const listCard = el(
    'div',
    { class: 'card' },
    el('h3', {}, 'Assembly Blueprint Checklist'),
    el('p', { class: 'muted' }, 'Tap the floating 3D piece in the stage or click any part below to snap it home!'),
    chips,
  );

  panel.append(stepCard, listCard);
}

function snapBuildPart(partId) {
  const obj = getObjectById(state.activeObjectId);
  const sess = state.buildSession;
  if (!sess) return;

  if (sess.placedIds.has(partId)) {
    playPop(480);
    setStageMessage('That part is already bolted in!', '');
    return;
  }

  playSnap();
  sess.placedIds.add(partId);

  // Advance index to next unplaced part
  while (sess.index < sess.order.length && sess.placedIds.has(sess.order[sess.index].id)) {
    sess.index += 1;
  }

  const nextTarget = sess.order[sess.index] || null;
  viewer.setBuildStates(sess.placedIds, nextTarget ? nextTarget.id : null, false);

  const snappedPart = obj.parts.find((p) => p.id === partId);
  if (sess.placedIds.size >= sess.order.length) {
    setStageMessage(`🎉 100% Assembled! The ${obj.name} is ready to roll!`, 'is-good');
    awardModeStars(obj.id, 'build', 3);
    renderBuildPanel();
    setTimeout(() => {
      showCelebration({
        title: `You built the ${obj.name}!`,
        stars: 3,
        text: `Every single piece (${sess.order.length}/${sess.order.length}) is snapped into place!`,
        nextMode: 'quiz',
        nextLabel: '❓ Take the 5-Question Quiz!',
      });
    }, 450);
  } else {
    setStageMessage(
      `${praise()} Snapped in the ${snappedPart ? snappedPart.name : 'part'}! Next: ${nextTarget.name}`,
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
  const cur = sess.questions[sess.index];

  const dots = el('ul', { class: 'dots', 'aria-label': 'Quiz progress' });
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

  for (const optPart of cur.options) {
    const btn = el(
      'button',
      {
        type: 'button',
        class: 'opt',
        'data-part-id': optPart.id,
        'data-correct': optPart.id === cur.correctId ? 'true' : 'false',
      },
      optPart.name,
    );
    btn.addEventListener('click', () => {
      if (sess.answered) return;
      sess.answered = true;
      const isRight = optPart.id === cur.correctId;

      for (const b of $$('.opt', optsWrap)) {
        b.disabled = true;
        if (b.dataset.partId === cur.correctId) b.classList.add('is-right');
        else if (b === btn && !isRight) b.classList.add('is-wrong');
      }

      viewer.selectPart(cur.correctId, true);
      const correctPart = obj.parts.find((p) => p.id === cur.correctId);

      if (isRight) {
        playCorrect();
        sess.score += 1;
        sess.streak += 1;
        sess.results[sess.index] = 'right';
        feedbackEl.className = 'feedback is-good';
        feedbackEl.textContent = `${praise()} ${correctPart.name}: ${correctPart.desc}`;
        setStageMessage(`⭐ Correct! Streak: ${sess.streak}`, 'is-good');
      } else {
        playOops();
        sess.streak = 0;
        sess.results[sess.index] = 'wrong';
        feedbackEl.className = 'feedback is-oops';
        feedbackEl.textContent = `Not quite! The right answer is ${correctPart.name} — ${correctPart.desc}`;
        setStageMessage(`Look at the highlighted ${correctPart.name}!`, 'is-oops');
      }

      const isLast = sess.index >= sess.questions.length - 1;
      const nextBtn = el(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary btn-block',
          id: 'quiz-next-btn',
        },
        isLast ? '🏆 See My Quiz Score!' : 'Next Question →',
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
    { type: 'button', class: 'btn btn-ghost btn-small' },
    '🗣️ Read Question',
  );
  readQuestionBtn.addEventListener('click', () => {
    speakText(cur.q);
  });

  const card = el(
    'div',
    { class: 'card', id: 'quiz-card' },
    dots,
    el(
      'p',
      { class: 'prompt-label' },
      `Question ${sess.index + 1} of ${sess.questions.length} • Score: ${sess.score}`,
    ),
    el('h2', { class: 'question', id: 'quiz-question-text' }, cur.q),
    optsWrap,
    feedbackEl,
    nextRow,
    el('div', { class: 'card-actions' }, readQuestionBtn),
  );

  panel.appendChild(card);
}

function finishQuiz() {
  const obj = getObjectById(state.activeObjectId);
  const sess = state.quizSession;
  const total = sess.questions.length;
  let stars = 1;
  if (sess.score >= total) stars = 3;
  else if (sess.score >= 3) stars = 2;

  awardModeStars(obj.id, 'quiz', stars);
  showCelebration({
    title: `Quiz Complete: ${sess.score} / ${total}!`,
    stars,
    text:
      sess.score === total
        ? `Perfect score! You are a certified ${obj.name} Chief Engineer!`
        : `Great job learning how the ${obj.name} works from the inside out!`,
    nextMode: 'explore',
    nextLabel: '🔍 Back to Explore',
  });
}

// ============================================================================
// Stage 3D Click Dispatcher
// ============================================================================
function handleStagePartClick(partId) {
  if (state.mode === 'explore') {
    playPop(540);
    state.selectedPartId = partId;
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
    nextLabel || 'Keep Playing',
  );
  nextBtn.addEventListener('click', () => {
    dlg.close();
    setMode(nextMode || 'explore');
  });

  const homeBtn = el(
    'button',
    { type: 'button', class: 'btn btn-secondary', id: 'celebrate-home-btn' },
    '🏠 Pick Another Object',
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
    setStageMessage(next ? '🩻 X-Ray Cutaway On: See right through outer shells!' : '🩻 X-Ray Cutaway Off', '');
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

// Initialize on DOMContentLoaded
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
