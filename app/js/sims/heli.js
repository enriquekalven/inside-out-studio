// 🚁 Take It for a Hover! — shared helicopter / multirotor sim for every `helicopters` model.
// Rotor spool-up, collective lift-off & climb with an auto-trim that settles into a steady hover, a ground-effect
// cushion, cyclic nose-down acceleration / nose-up braking, pedal turns in the hover and banked turns at speed,
// gentle-touchdown scoring, rotor blur discs, downwash dust, nav lights & strobes, and a scrolling world whose
// speed and altitude cues are scaled from each model's real rotor size.
// Part groups are never transformed by id (some ids contain words like 'tail' / 'gear'); only spin groups turn.
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, wrapDeg, makeCanvasTexture } from './base.js';
import { buildSky } from './flight_env.js';

const KT_TO_MS = 0.514444;
const FT_TO_M = 0.3048;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const PITCH_MAX = 0.2; // rad of nose-down attitude at full forward cyclic (the pose shows 75 % of it)
const GROUND_SIZE = 170; // scrolling ground plane edge, world units
const DROP_CAP = 10; // altitude is shown by sinking the world, compressed so the ground never vanishes

// Real-world envelopes (lightly rounded). rotorR = main-rotor radius in metres: the model's measured rotor radius
// divided by this gives units-per-metre, so ground speed, pad size and altitude cues match each aircraft's scale.
const PROFILES = {
  uh60: {
    match: /uh-?60|black-?hawk/, vMax: 158, cruise: 100, climb: 1650, descent: 1500, accel: 72, ceiling: 6000,
    rotorR: 8.18, liftoffFt: 8, gentleFpm: 360, landKt: 25, theme: 'farm', mainRate: 27, tailRate: 40, electric: false,
  },
  h145: {
    match: /h145|ec145|bk117|airbus/, vMax: 137, cruise: 100, climb: 1900, descent: 1500, accel: 68, ceiling: 6000,
    rotorR: 5.5, liftoffFt: 8, gentleFpm: 360, landKt: 25, theme: 'farm', mainRate: 22, tailRate: 15, electric: false,
  },
  mavic: {
    match: /mavic|drone|quad/, vMax: 40, cruise: 30, climb: 1575, descent: 1180, accel: 36, ceiling: 400,
    rotorR: 0.12, liftoffFt: 3, gentleFpm: 420, landKt: 8, theme: 'park', mainRate: 30, tailRate: 30, electric: true,
  },
  ingenuity: {
    match: /ingenuity|mars/, vMax: 20, cruise: 12, climb: 400, descent: 320, accel: 16, ceiling: 80,
    rotorR: 0.605, liftoffFt: 3, gentleFpm: 240, landKt: 5, theme: 'mars', mainRate: 30, tailRate: 30, electric: true,
  },
};

function profileFor(id) {
  for (const p of Object.values(PROFILES)) if (p.match.test(id)) return p;
  return PROFILES.uh60;
}

const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);
const wrapC = (x, span) => fract(x / span + 0.5) * span - span / 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw `fn(px, py)` at (x, y) plus the wrapped copies needed for a seamless W x H tile.
function wrapped(W, H, x, y, r, fn) {
  for (const dx of [-W, 0, W]) {
    for (const dy of [-H, 0, H]) {
      const px = x + dx;
      const py = y + dy;
      if (px + r < 0 || px - r > W || py + r < 0 || py - r > H) continue;
      fn(px, py);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Canvas textures (generated once per sim entry, disposed on exit)
// ---------------------------------------------------------------------------------------------------------------
function drawFarm(ctx, W, H) {
  const r = rng(21);
  ctx.fillStyle = '#41592a';
  ctx.fillRect(0, 0, W, H);
  const xs = [0, 180, 400, 590, 800, 1024];
  const ys = [0, 230, 420, 640, 830, 1024];
  const crops = ['#506b2b', '#617c33', '#7a8640', '#8d8650', '#486b29', '#5a7830', '#77693f', '#3f6026', '#86804a', '#5f5c36'];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + 5;
      const x1 = xs[i + 1] - 5;
      const y0 = ys[j] + 5;
      const y1 = ys[j + 1] - 5;
      ctx.fillStyle = crops[Math.floor(r() * crops.length)];
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      const vertical = r() > 0.5;
      ctx.strokeStyle = r() > 0.5 ? 'rgba(15,25,8,0.18)' : 'rgba(255,250,210,0.09)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k < 130; k++) {
        if (vertical) {
          ctx.moveTo(x0 + k * 8, y0);
          ctx.lineTo(x0 + k * 8, y1);
        } else {
          ctx.moveTo(x0, y0 + k * 8);
          ctx.lineTo(x1, y0 + k * 8);
        }
      }
      ctx.stroke();
      for (let k = 0; k < 26; k++) {
        ctx.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,220,0.05)';
        ctx.beginPath();
        ctx.arc(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 12 + r() * 46, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  // dirt farm tracks on two field boundaries (continue seamlessly into the neighbouring tiles)
  ctx.fillStyle = '#7d6c4c';
  ctx.fillRect(xs[2] - 8, 0, 16, H);
  ctx.fillRect(0, ys[3] - 7, W, 14);
  ctx.fillStyle = '#9b8862';
  ctx.fillRect(xs[2] - 5, 0, 10, H);
  ctx.fillRect(0, ys[3] - 4, W, 8);
  // hedgerows along the other field edges
  for (const x of xs.slice(0, -1)) {
    if (x === xs[2]) continue;
    for (let y = 0; y < H; y += 8) {
      if (r() < 0.3) continue;
      const rad = 3.5 + r() * 4;
      const tone = r() > 0.5 ? '#25391a' : '#2f4720';
      wrapped(W, H, x, y, rad, (px, py) => {
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, TAU);
        ctx.fill();
      });
    }
  }
  // copses of trees with soft shadows
  for (let i = 0; i < 24; i++) {
    const cx = r() * W;
    const cy = r() * H;
    const n = 4 + Math.floor(r() * 10);
    for (let k = 0; k < n; k++) {
      const x = cx + (r() - 0.5) * 60;
      const y = cy + (r() - 0.5) * 60;
      const rad = 6 + r() * 9;
      const tone = r() > 0.5 ? '#203317' : '#2b4420';
      wrapped(W, H, x, y, rad + 6, (px, py) => {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(px + 4, py + 4, rad, 0, TAU);
        ctx.fill();
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, TAU);
        ctx.fill();
      });
    }
  }
  // a farmstead by the crossroads
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(xs[2] + 22, ys[3] + 22, 46, 28);
  ctx.fillStyle = '#7a3b2c';
  ctx.fillRect(xs[2] + 18, ys[3] + 18, 46, 28);
  ctx.fillStyle = '#8e8f8a';
  ctx.fillRect(xs[2] + 24, ys[3] + 60, 30, 20);
}

function drawPark(ctx, W, H) {
  const r = rng(33);
  ctx.fillStyle = '#3f6c2b';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,230,0.07)' : 'rgba(0,20,0,0.08)';
    ctx.fillRect(i * 64, 0, 64, H);
  }
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(20,40,10,0.22)' : 'rgba(190,220,140,0.12)';
    ctx.fillRect(r() * W, r() * H, 1.5, 3.5);
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * W;
    const y = r() * H;
    const col = r() > 0.7 ? '#f2eed8' : '#e3cc45';
    const rad = 1.6 + r() * 1.4;
    wrapped(W, H, x, y, 4, (px, py) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, TAU);
      ctx.fill();
    });
  }
  // a gravel footpath that leaves the right edge where it enters the left (seamless)
  ctx.lineCap = 'round';
  const path = (w, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 8) {
      const y = 610 + 110 * Math.sin((x / W) * TAU) + 30 * Math.sin((x / W) * TAU * 3);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  path(42, '#7a7563');
  path(34, '#b8af92');
}

function drawMars(ctx, W, H) {
  const r = rng(44);
  ctx.fillStyle = '#9a5634';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 40 + r() * 140;
    const col = r() > 0.5 ? 'rgba(80,35,18,0.22)' : 'rgba(225,160,110,0.18)';
    wrapped(W, H, x, y, rad, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    });
  }
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(55,22,10,0.25)' : 'rgba(235,185,135,0.15)';
    const s = 1 + r() * 2;
    ctx.fillRect(r() * W, r() * H, s, s);
  }
  ctx.strokeStyle = 'rgba(65,28,14,0.2)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = 40 + r() * 90;
    wrapped(W, H, x, y, len, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px - len / 2, py);
      ctx.quadraticCurveTo(px, py - 6, px + len / 2, py + 2);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 9; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 14 + r() * 46;
    wrapped(W, H, x, y, rad * 1.3, (px, py) => {
      ctx.fillStyle = 'rgba(75,32,16,0.3)';
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, TAU);
      ctx.fill();
      ctx.lineWidth = rad * 0.18;
      ctx.strokeStyle = 'rgba(230,175,125,0.35)';
      ctx.beginPath();
      ctx.arc(px, py, rad * 1.05, Math.PI * 0.9, Math.PI * 1.9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(55,22,10,0.35)';
      ctx.beginPath();
      ctx.arc(px, py, rad * 1.05, Math.PI * 1.9, Math.PI * 2.9);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 700; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = 1.5 + r() * r() * 6;
    const col = r() > 0.5 ? '#5e321f' : '#7c4429';
    const rot = r() * 3;
    wrapped(W, H, x, y, s * 2, (px, py) => {
      ctx.fillStyle = 'rgba(35,15,6,0.45)';
      ctx.beginPath();
      ctx.ellipse(px + s * 0.5, py + s * 0.4, s, s * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(px, py, s, s * 0.75, rot, 0, TAU);
      ctx.fill();
    });
  }
}

function drawMarsSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#4e3527');
  g.addColorStop(0.45, '#b4825a');
  g.addColorStop(0.62, '#d6a677');
  g.addColorStop(1, '#e6c29b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Big "H" whose bars run along the texture's u axis, so it reads upright from the chase camera behind the nose.
function drawH(ctx, W, H, color) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = color;
  const hw = W * 0.3;
  const hh = H * 0.36;
  const bar = W * 0.07;
  ctx.fillRect(-hw / 2, -hh / 2, bar, hh);
  ctx.fillRect(hw / 2 - bar, -hh / 2, bar, hh);
  ctx.fillRect(-hw / 2, -bar / 2, hw, bar);
  ctx.restore();
}

function drawHelipad(ctx, W, H) {
  const r = rng(9);
  ctx.fillStyle = '#6f7378';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
  ctx.strokeStyle = 'rgba(35,37,40,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const k of [W / 3, (2 * W) / 3]) {
    ctx.moveTo(k, 0);
    ctx.lineTo(k, H);
    ctx.moveTo(0, k);
    ctx.lineTo(W, k);
  }
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = 'rgba(15,15,15,0.14)';
    ctx.beginPath();
    ctx.ellipse(W / 2 + (r() - 0.5) * W * 0.5, H / 2 + (r() - 0.5) * H * 0.5, 20 + r() * 30, 8 + r() * 10, r() * 3, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#e4e2d8';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.36, 0, TAU);
  ctx.stroke();
  drawH(ctx, W, H, '#e4e2d8');
  ctx.fillStyle = '#ffd34d';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    ctx.beginPath();
    ctx.arc(W / 2 + Math.cos(a) * W * 0.455, H / 2 + Math.sin(a) * H * 0.455, 5, 0, TAU);
    ctx.fill();
  }
}

function drawDronePad(ctx, W, H) {
  ctx.fillStyle = '#e8661f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.39, 0, TAU);
  ctx.stroke();
  drawH(ctx, W, H, '#ffffff');
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.485, 0, TAU);
  ctx.stroke();
}

function drawDust(ctx, W, H) {
  const r = rng(5);
  const c = W / 2;
  for (let i = 0; i < 220; i++) {
    const a = r() * TAU;
    const r0 = W * (0.16 + r() * 0.12);
    const r1 = W * (0.36 + r() * 0.13);
    const a2 = a + 0.25 + r() * 0.2;
    const g = ctx.createLinearGradient(c + Math.cos(a) * r0, c + Math.sin(a) * r0, c + Math.cos(a2) * r1, c + Math.sin(a2) * r1);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.55, `rgba(255,255,255,${(0.2 + r() * 0.25).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + r() * 5;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
    const am = a + 0.12;
    const rm = ((r0 + r1) / 2) * 1.02;
    ctx.quadraticCurveTo(c + Math.cos(am) * rm, c + Math.sin(am) * rm, c + Math.cos(a2) * r1, c + Math.sin(a2) * r1);
    ctx.stroke();
  }
  const rg = ctx.createRadialGradient(c, c, W * 0.12, c, c, W * 0.5);
  rg.addColorStop(0, 'rgba(255,255,255,0)');
  rg.addColorStop(0.55, 'rgba(255,255,255,0.34)');
  rg.addColorStop(0.8, 'rgba(255,255,255,0.2)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
}

// Rotor blur: clear hub, translucent blade sweep, a denser ring where the tip caps whirl past.
function drawDisc(ctx, W, H) {
  const c = W / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.13, 'rgba(255,255,255,0)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.4)');
  g.addColorStop(0.9, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.965, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 7; k++) {
    ctx.strokeStyle = `rgba(255,255,255,${k % 2 ? 0.1 : 0.04})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c, c, c * (0.3 + k * 0.09), 0, TAU);
    ctx.stroke();
  }
}

function drawPuff(ctx, W, H) {
  const r = rng(77);
  for (let i = 0; i < 9; i++) {
    const x = W * (0.22 + r() * 0.56);
    const y = H * (0.42 + r() * 0.2);
    const rad = W * (0.14 + r() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawGlow(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawCorrugated(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (let i = 0; i <= 8; i++) {
    g.addColorStop(i / 8, i % 2 ? '#6f776e' : '#a4aca2');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = rng(13);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(60,45,30,${(0.04 + r() * 0.08).toFixed(3)})`;
    ctx.fillRect(0, r() * H, W, 1 + r() * 3);
  }
}

function drawConcrete(ctx, W, H) {
  const r = rng(17);
  ctx.fillStyle = '#7a7d80';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
  ctx.strokeStyle = 'rgba(30,32,35,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}

function drawSockStripes(ctx, W, H) {
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#f4f1ea' : '#ff6a13';
    ctx.fillRect(0, (i / 5) * H, W, H / 5 + 1);
  }
}

// ---------------------------------------------------------------------------------------------------------------
export class HeliSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: true });
    this.hideFloor = true;
    this.modelId = String(viewer.currentObject?.activeModelId || '').toLowerCase();
    this.prof = profileFor(this.modelId);
    this.st = {
      nr: 0, collective: 0, altitude: 0, vs: 0, speed: 0, psi: 0, pitch: 0, bank: 0, yawRate: 0,
      onGround: true, tookOff: false, lightsOn: true, landedTimer: 0, landedMsg: '',
    };
    this.pos = { x: 0, z: 0 }; // aircraft position over the world, model units
    this.camFollow = 0;
    this.jolt = 0;
    this.attached = []; // objects parented to the aircraft (removed on exit)
    this.textures = [];
    this.props = [];
    this.rotors = [];
    this.lights = [];
    this.clouds = [];
    this.rocks = null;
  }

  _tex(t) {
    this.textures.push(t);
    return t;
  }

  onEnter() {
    const v = this.viewer;
    v.rootGroup.rotation.order = 'YZX'; // yaw, then pitch, then bank (restored in onExit)
    v.rootGroup.updateMatrixWorld(true);
    this._measure();
    this._buildWorld();
    this._buildRotorDiscs();
    this._buildLights();
    v.headlightGroup.visible = false;
    // Rear-right three-quarter chase view (tail rotor side); the camera then swings to follow turns.
    v.desiredSpherical.theta = -0.72;
    v.desiredSpherical.phi = 1.2;
    v.desiredSpherical.radius = Math.max(4.4, v.defaultSpherical.radius * 1.08);
  }

  onExit() {
    const v = this.viewer;
    for (const o of this.attached) {
      o.parent?.remove(o);
      o.traverse((n) => {
        if (n.geometry) n.geometry.dispose();
        if (n.material) n.material.dispose();
      });
    }
    this.attached = [];
    for (const t of this.textures) t.dispose();
    this.textures = [];
    for (const r of this.rotors) r.crank.rotation[r.axis] %= TAU;
    v.scene.fog = this.prevFog ?? null;
    v.rootGroup.rotation.order = 'XYZ';
    v.rootGroup.rotation.set(0, 0, 0);
    v.rootGroup.position.set(0, 0, 0);
  }

  trigger(name) {
    if (name === 'lights') {
      this.st.lightsOn = !this.st.lightsOn;
      return this.st.lightsOn;
    }
    return false;
  }

  // Body box (without rotors), true model bottom, and per-spin-group radius / direction / rate.
  _measure() {
    const v = this.viewer;
    const crankSet = new Set(v.driveCranks);
    const underCrank = (o) => {
      for (let p = o.parent; p && p !== v.rootGroup; p = p.parent) if (crankSet.has(p)) return true;
      return false;
    };
    const full = new THREE.Box3();
    const body = new THREE.Box3();
    this.bodyMeshes = [];
    for (const rec of v.partRecords.values()) {
      for (const m of rec.meshes) {
        full.expandByObject(m);
        if (!underCrank(m)) {
          body.expandByObject(m);
          this.bodyMeshes.push(m);
        }
      }
    }
    if (full.isEmpty()) full.set(new THREE.Vector3(-1, -0.6, -1), new THREE.Vector3(1, 0.6, 1));
    if (body.isEmpty()) body.copy(full);
    this.bodyBox = body;
    this.bottomY = full.min.y;
    this.bodySize = body.getSize(new THREE.Vector3());
    this.bodyCenter = body.getCenter(new THREE.Vector3());
    this.modelScale = Math.max(0.5, this.bodySize.x, this.bodySize.z);

    const tmp = new THREE.Vector3();
    let maxR = 0;
    for (const c of v.driveCranks) {
      const axis = c.userData?.spinAxis || 'x';
      const axisW = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0).transformDirection(c.matrixWorld);
      const center = c.getWorldPosition(new THREE.Vector3());
      let radius = 0;
      let tipAx = 0;
      c.traverse((o) => {
        const pos = o.isMesh && o.geometry?.attributes?.position;
        if (!pos) return;
        const step = Math.max(1, Math.floor(pos.count / 6000));
        for (let i = 0; i < pos.count; i += step) {
          tmp.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).sub(center);
          const ax = tmp.dot(axisW);
          const rr = Math.sqrt(Math.max(0, tmp.lengthSq() - ax * ax));
          if (rr > radius) {
            radius = rr;
            tipAx = ax;
          }
        }
      });
      const ws = c.getWorldScale(new THREE.Vector3());
      const scale = (Math.abs(ws.x) + Math.abs(ws.y) + Math.abs(ws.z)) / 3 || 1;
      this.rotors.push({ crank: c, axis, center, radius, tipAx, scale, dir: 1, main: false, disc: null });
      maxR = Math.max(maxR, radius);
    }
    this.maxR = maxR;
    const mains = this.rotors.filter((r) => maxR > 0 && r.radius >= maxR * 0.6);
    for (const r of mains) r.main = true;
    // Counter-rotation: coaxial rotors alternate, multirotor diagonals pair up CW / CCW, a single rotor turns CCW
    // seen from above (US / Airbus-Germany convention; torque reaction is balanced by the tail rotor or Fenestron).
    if (mains.length > 1) {
      const c0 = mains[0].center;
      const coaxial = mains.every((r) => Math.hypot(r.center.x - c0.x, r.center.z - c0.z) < maxR * 0.1);
      if (coaxial) {
        mains.sort((a, b) => a.center.y - b.center.y).forEach((r, i) => {
          r.dir = i % 2 ? -1 : 1;
        });
      } else {
        for (const r of mains) r.dir = (r.center.x - this.bodyCenter.x) * (r.center.z - this.bodyCenter.z) >= 0 ? 1 : -1;
      }
    }
    this.unitsPerM = maxR > 0.05 ? maxR / this.prof.rotorR : 0.25;
  }

  _buildWorld() {
    const v = this.viewer;
    const theme = this.prof.theme;
    const upm = this.unitsPerM;
    const aniso = Math.min(8, v.renderer?.capabilities?.getMaxAnisotropy?.() || 1);

    // Sky dome + sun stay fog-free so the gradient survives; fog colour matches the dome just below the horizon.
    const dome = buildSky(this.env);
    for (const ch of this.env.children) if (ch.material) ch.material.fog = false;
    let fogHex = 0x88c2fb;
    if (theme === 'mars') {
      const old = dome.material.map;
      dome.material.map = this._tex(makeCanvasTexture(16, 256, drawMarsSky));
      dome.material.needsUpdate = true;
      old?.dispose();
      for (const ch of this.env.children) if (ch !== dome && ch.material?.color) ch.material.color.set(0xdde6ff);
      fogHex = 0xc99868;
    }
    this.prevFog = v.scene.fog;
    v.scene.fog = new THREE.Fog(fogHex, 24, 80);

    // Ground: one big plane whose texture offset scrolls with the aircraft's position (seamless, 1 draw call).
    const tileM = theme === 'park' ? 14 : theme === 'mars' ? 18 : 160;
    this.tileUnits = Math.max(4, tileM * upm);
    const draw = theme === 'park' ? drawPark : theme === 'mars' ? drawMars : drawFarm;
    const gTex = this._tex(makeCanvasTexture(1024, 1024, draw));
    gTex.wrapS = THREE.RepeatWrapping;
    gTex.wrapT = THREE.RepeatWrapping;
    gTex.anisotropy = aniso;
    gTex.repeat.set(GROUND_SIZE / this.tileUnits, GROUND_SIZE / this.tileUnits);
    this.groundTex = gTex;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), new THREE.MeshLambertMaterial({ map: gTex }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.groundGroup = new THREE.Group();
    this.groundGroup.add(ground);
    this.groundGroup.position.y = this.bottomY;
    this.env.add(this.groundGroup);

    // Take-off pad at the world origin: Army helipad, or an orange drone landing pad.
    if (theme !== 'mars') {
      const sizeU = (theme === 'park' ? 0.65 : 22) * upm;
      const padTex = this._tex(makeCanvasTexture(512, 512, theme === 'park' ? drawDronePad : drawHelipad));
      padTex.anisotropy = aniso;
      const geo = theme === 'park' ? new THREE.CircleGeometry(sizeU / 2, 48) : new THREE.PlaneGeometry(sizeU, sizeU);
      const pad = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        map: padTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.002;
      pad.receiveShadow = true;
      this._prop(pad, 0, 0);
    }

    if (theme === 'farm') this._buildAirfield(upm);
    if (theme === 'mars') this._buildRocks(upm);

    // Downwash: swirling dust / grass ripple ring under the rotor when close to the ground
    const dustTex = this._tex(makeCanvasTexture(256, 256, drawDust));
    const dustCol = theme === 'mars' ? 0xd08a55 : theme === 'park' ? 0xdfe8cf : 0xd6cba8;
    this.dust = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      map: dustTex, color: dustCol, transparent: true, opacity: 0, depthWrite: false,
    }));
    this.dust.rotation.x = -Math.PI / 2;
    this.dust.position.y = 0.006 * this.modelScale;
    this.dust.renderOrder = 2;
    this.groundGroup.add(this.dust);

    // Fair-weather cumulus (Earth only), drifting with parallax and sinking a little as we climb
    if (theme !== 'mars') {
      const puffTex = this._tex(makeCanvasTexture(128, 128, drawPuff));
      const r = rng(5);
      for (let i = 0; i < 18; i++) {
        const size = 4 + r() * 6;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.62), new THREE.MeshBasicMaterial({
          map: puffTex, transparent: true, opacity: 0.88, depthWrite: false,
        }));
        this.env.add(m);
        this.clouds.push({ obj: m, wx: (r() - 0.5) * 140, wz: (r() - 0.5) * 140, h: 9 + r() * 9 });
      }
    }
  }

  // Hangar + windsock by the helipad for scale and wind cues (full-size helicopters only).
  _buildAirfield(upm) {
    const hangar = new THREE.Group();
    const rad = 11 * upm;
    const len = 34 * upm;
    const shellGeo = new THREE.CylinderGeometry(rad, rad, len, 32, 1, false, 0, Math.PI);
    shellGeo.rotateZ(Math.PI / 2);
    const ribTex = this._tex(makeCanvasTexture(64, 256, drawCorrugated));
    ribTex.wrapS = THREE.RepeatWrapping;
    ribTex.wrapT = THREE.RepeatWrapping;
    ribTex.repeat.set(1, 14);
    const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.5, metalness: 0.4, envMapIntensity: 0.55 }));
    shell.castShadow = true;
    shell.receiveShadow = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3 * upm, rad * 0.78, rad * 1.3), new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.7 }));
    door.position.set(-len / 2 - 0.12 * upm, rad * 0.39, 0);
    const concTex = this._tex(makeCanvasTexture(256, 256, drawConcrete));
    concTex.wrapS = THREE.RepeatWrapping;
    concTex.wrapT = THREE.RepeatWrapping;
    concTex.repeat.set(4, 3);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(len * 1.3, rad * 2.6), new THREE.MeshLambertMaterial({
      map: concTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(-len * 0.55, 0.001, 0);
    apron.receiveShadow = true;
    hangar.add(shell, door, apron);
    hangar.rotation.y = 0.68; // door (local -X) faces the helipad at the world origin
    this._prop(hangar, 135 * upm, -110 * upm);

    const sock = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * upm, 0.1 * upm, 6.4 * upm, 10), new THREE.MeshStandardMaterial({ color: 0xd9dbd6, roughness: 0.5 }));
    pole.position.y = 3.2 * upm;
    pole.castShadow = true;
    const stripeTex = this._tex(makeCanvasTexture(32, 160, drawSockStripes));
    const coneGeo = new THREE.ConeGeometry(0.42 * upm, 3.6 * upm, 18, 1, true);
    coneGeo.rotateZ(-Math.PI / 2);
    coneGeo.translate(1.8 * upm, 0, 0);
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8, side: THREE.DoubleSide }));
    cone.castShadow = true;
    const swivel = new THREE.Group();
    swivel.position.y = 6.1 * upm;
    swivel.add(cone);
    sock.add(pole, swivel);
    this.windsock = swivel;
    this._prop(sock, 42 * upm, -9 * upm);
  }

  // Scattered Jezero-crater rocks (instanced, wrapped around the aircraft as it flies).
  _buildRocks(upm) {
    const n = 90;
    const span = 80;
    const mesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x5c331f }), n);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const r = rng(11);
    const keepOut = Math.max(2.5 * this.maxR, 2);
    const list = [];
    for (let i = 0; i < n; i++) {
      let wx = (r() - 0.5) * span;
      let wz = (r() - 0.5) * span;
      if (Math.hypot(wx, wz) < keepOut) {
        wx += Math.sign(wx || 1) * keepOut;
        wz += Math.sign(wz || 1) * keepOut;
      }
      list.push({ wx, wz, s: (0.06 + r() * r() * 0.4) * upm, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, 0)) });
    }
    this.rocks = { mesh, list, span, lastX: NaN, lastZ: NaN };
    this.groundGroup.add(mesh);
  }

  _prop(obj, wx, wz) {
    this.groundGroup.add(obj);
    this.props.push({ obj, wx, wz });
  }

  _buildRotorDiscs() {
    const tex = this._tex(makeCanvasTexture(256, 256, drawDisc));
    for (const r of this.rotors) {
      if (r.radius < Math.max(0.05, this.maxR * 0.12)) continue; // skip tiny gears / spinners
      const geo = new THREE.CircleGeometry(r.radius / r.scale, 56);
      if (r.axis === 'y') geo.rotateX(-Math.PI / 2);
      else if (r.axis === 'x') geo.rotateY(Math.PI / 2);
      const off = (r.tipAx * 0.5) / r.scale; // mid-blade height (blades droop / cone)
      geo.translate(r.axis === 'x' ? off : 0, r.axis === 'y' ? off : 0, r.axis === 'z' ? off : 0);
      const disc = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        map: tex, color: 0x26292d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
      }));
      disc.raycast = () => {};
      disc.renderOrder = 3;
      r.crank.add(disc);
      r.disc = disc;
      this.attached.push(disc);
    }
  }

  // Anti-collision beacons (top + belly), white tail strobe, red/green position lights — placed by ray-casting
  // onto the fuselage so they sit on the skin of any helicopter shape.
  _buildLights() {
    if (!this.bodyMeshes.length) return;
    const b = this.bodyBox;
    const c = this.bodyCenter;
    const sz = this.bodySize;
    const s = this.modelScale;
    const ray = new THREE.Raycaster();
    const hit = (o, d) => {
      ray.set(o, d);
      const h = ray.intersectObjects(this.bodyMeshes, false)[0];
      return h ? h.point.clone().addScaledVector(d, -0.004 * s) : null;
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const glowTex = this._tex(makeCanvasTexture(64, 64, drawGlow));
    const add = (pt, color, kind, size, phase = 0) => {
      if (!pt) return;
      const g = new THREE.Group();
      g.position.copy(pt);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0055 * s, 8, 6), new THREE.MeshBasicMaterial({ color }));
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false,
      }));
      spr.scale.setScalar(size * s);
      dot.raycast = () => {};
      spr.raycast = () => {};
      g.add(dot, spr);
      this.viewer.rootGroup.add(g);
      this.attached.push(g);
      this.lights.push({ obj: g, kind, phase });
    };
    add(hit(V(c.x - sz.x * 0.1, b.max.y + 1, 0), V(0, -1, 0)), 0xff2a2a, 'beacon', 0.07, 0);
    add(hit(V(c.x + sz.x * 0.05, b.min.y - 1, 0), V(0, 1, 0)), 0xff2a2a, 'beacon', 0.06, Math.PI);
    add(hit(V(b.min.x - 1, c.y + sz.y * 0.28, 0), V(1, 0, 0)), 0xffffff, 'strobe', 0.1, 0);
    add(hit(V(c.x + sz.x * 0.12, c.y + sz.y * 0.12, b.min.z - 1), V(0, 0, 1)), 0xff3030, 'nav', 0.045);
    add(hit(V(c.x + sz.x * 0.12, c.y + sz.y * 0.12, b.max.z + 1), V(0, 0, -1)), 0x2bff6a, 'nav', 0.045);
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const p = this.prof;
    const inp = this.inputs;
    const boost = Boolean(inp.boost);

    // 1. Rotor spool-up: engines / motors bring the rotor to 100 % in ~2.5 s (compressed from real life)
    st.nr = Math.min(1, st.nr + dt * (0.12 + 0.8 * (1 - st.nr)));

    // 2. Collective: W raises, S lowers; hands-off in the air it eases to the hover setting (settle into hover).
    //    Translational lift lowers the hover setting at moderate speed, parasite drag raises it near Vmax, and
    //    ground effect cushions the last rotor diameter.
    const altM = st.altitude * FT_TO_M;
    const spdFrac = clamp(st.speed / p.vMax, 0, 1.2);
    const etl = 0.1 * smooth(0.1, 0.32, spdFrac) - 0.09 * spdFrac ** 3;
    const ge = 0.07 * clamp(1 - altM / (2 * p.rotorR), 0, 1);
    const lift = st.nr * st.nr * (1 + etl);
    let cHover = clamp((0.5 - ge) / Math.max(0.2, lift), 0, 1);
    const lowHover = !st.onGround && st.altitude < p.liftoffFt * 0.6 && st.speed < p.landKt;
    if (lowHover) cHover = Math.max(0, cHover - 0.06); // hands-off just above the pad: settle gently onto it
    if (inp.up || boost) st.collective = Math.min(1, st.collective + dt * (boost ? 0.9 : 0.5));
    else if (inp.down) st.collective = Math.max(0, st.collective - dt * 0.65);
    else if (!st.onGround) st.collective = approach(st.collective, clamp(cHover - 0.18 * (st.vs / p.climb), 0, 1), dt * 2.2);

    // 3. Vertical: excess rotor thrust → target V/S (fpm), lagged; flare zoom-climb; soft ceiling
    const excess = st.collective * lift + ge - 0.5;
    let vsT = excess >= 0 ? excess * 2 * p.climb * (boost ? 1.15 : 1) : excess * 2 * p.descent;
    if (st.pitch > 0 && st.speed > 5) vsT += st.pitch * st.speed * 8 * (p.climb / 1650);
    const ceilFrac = st.altitude / p.ceiling;
    if (ceilFrac > 0.9) vsT = Math.min(vsT, p.climb * clamp((1 - ceilFrac) / 0.1, 0, 1));
    if (st.onGround) {
      if (vsT > 60 && st.nr > 0.9) st.onGround = false; // lift-off!
      else st.vs = 0;
    }
    if (!st.onGround) {
      st.vs = approach(st.vs, vsT, dt * 2.6);
      // Flare cushion: like a pilot raising the collective just before touchdown (plus ground effect), the sink
      // rate tapers over the last ~3 lift-off heights so a slow, steady descent ends in a gentle landing.
      const flareFt = p.liftoffFt * 3;
      if (st.altitude < flareFt) {
        st.vs = Math.max(st.vs, -(p.gentleFpm * 0.7 + (p.descent - p.gentleFpm * 0.7) * (st.altitude / flareFt)));
      }
      st.altitude += (st.vs / 60) * dt;
      if (!st.tookOff && st.altitude > p.liftoffFt) {
        st.tookOff = true;
        this.check('liftoff');
      }
      if (st.altitude <= 0) {
        const gentle = st.vs >= -p.gentleFpm && st.speed <= p.landKt;
        st.landedMsg = gentle ? 'SOFT LANDING' : st.speed > p.landKt ? 'TOO FAST!' : 'BUMPY!';
        st.landedTimer = 2.8;
        if (gentle && st.tookOff) this.check('land');
        if (!gentle) this.jolt = 1;
        st.altitude = 0;
        st.vs = 0;
        st.onGround = true;
      }
    }
    st.landedTimer = Math.max(0, st.landedTimer - dt);

    // 4. Cyclic: nose-down accelerates, nose-up brakes; hands-off holds attitude near trim so speed bleeds slowly,
    //    and below ~10 % of cruise it levels into a hover.
    const vMaxEff = p.vMax * (boost ? 1.12 : 1);
    const trim = -PITCH_MAX * (st.speed / vMaxEff) ** 2;
    let pitchT = 0;
    if (!st.onGround) {
      if (inp.pitchDown) pitchT = -PITCH_MAX;
      else if (inp.pitchUp) pitchT = 0.16;
      else if (st.speed < p.cruise * 0.1) pitchT = 0.03 * smooth(0, p.cruise * 0.1, st.speed);
      else pitchT = trim * 0.75;
    }
    st.pitch = approach(st.pitch, pitchT, dt * 2.4);
    if (st.onGround) {
      st.speed = Math.max(0, st.speed - dt * p.vMax * 0.6);
    } else {
      const drag = 0.012 * st.speed;
      st.speed = clamp(st.speed + (p.accel * (boost ? 1.25 : 1) * (trim - st.pitch) - drag) * dt, 0, vMaxEff);
    }

    // 5. Pedals & bank: pedal turns in the hover, coordinated banked turns at speed
    const yawIn = (inp.left ? 1 : 0) - (inp.right ? 1 : 0); // +1 = left (counter-clockwise from above)
    const fwd = smooth(0.12, 0.38, st.speed / p.vMax);
    st.bank = approach(st.bank, st.onGround ? 0 : -yawIn * (0.05 + 0.4 * fwd), dt * 2.6);
    let yawRate = 0;
    if (!st.onGround) {
      const pedal = yawIn * 50 * (1 - fwd);
      const coord = -clamp((2 * 1091 * Math.tan(st.bank)) / Math.max(st.speed, p.vMax * 0.3), -45, 45) * fwd;
      yawRate = pedal + coord;
    }
    st.yawRate = approach(st.yawRate, yawRate, dt * 4);
    st.psi += st.yawRate * DEG * dt;

    // 6. Ground track. The world is only sunk a compressed amount, so the visual ground speed is scaled the same
    //    way to keep the ground's angular rate honest at every height.
    const altU = altM * this.unitsPerM;
    const drop = DROP_CAP * (1 - Math.exp(-altU / DROP_CAP));
    const eye = this.modelScale * 0.5;
    const visFactor = (drop + eye) / (altU + eye);
    const distU = st.speed * KT_TO_MS * dt * this.unitsPerM * visFactor;
    this.pos.x += Math.cos(st.psi) * distU;
    this.pos.z -= Math.sin(st.psi) * distU;

    this._updateVisuals(dt, drop, altU, boost);

    // 7. Checklist + HUD telemetry
    if (!st.onGround && st.speed >= p.cruise) this.check('cruise');
    let phase;
    if (st.onGround && st.landedTimer > 0) phase = st.landedMsg;
    else if (st.onGround) phase = st.nr < 0.97 ? 'SPOOL-UP' : st.tookOff ? 'LANDED' : 'READY';
    else if (ceilFrac > 0.97) phase = 'ALT LIMIT';
    else if (boost) phase = 'MAX PWR';
    else if (st.speed >= p.cruise) phase = 'CRUISE';
    else if (st.vs > 250) phase = 'CLIMB';
    else if (st.vs < -250) phase = 'DESCEND';
    else if (st.speed > Math.max(6, p.cruise * 0.25)) phase = 'FORWARD';
    else phase = 'HOVER';
    const hdg = Math.round(wrapDeg(-st.psi / DEG)) % 360;
    const chop = p.electric ? 0 : 0.28 * Math.max(0, Math.sin(this.elapsed * TAU * 4.6 * st.nr));
    Object.assign(this.telemetry, {
      airspeed: Math.round(st.speed),
      phase,
      altitude: Math.round(st.altitude),
      vs: Math.round(st.vs / 10) * 10,
      heading: String(hdg === 0 ? 360 : hdg).padStart(3, '0'),
      rotor: `${Math.round(st.nr * 100)}%`,
      collective: `${Math.round(st.collective * 100)}%`,
      collectiveBar: st.collective * 100,
      soundRpm: 800 + st.nr * (p.electric ? 6600 : 5200) + st.collective * (p.electric ? 1400 : 2000) + (boost ? 500 : 0),
      soundThrottle: clamp((0.12 + st.collective * 0.75 + (boost ? 0.15 : 0) + chop) * st.nr, 0, 1),
    });
  }

  _updateVisuals(dt, drop, altU, boost) {
    const v = this.viewer;
    const st = this.st;
    const t = this.elapsed;

    // Rotors (per-group rate & direction) + blur discs that fade in as the rotor reaches flight RPM
    for (const r of this.rotors) {
      const rate = (r.main ? this.prof.mainRate : this.prof.tailRate) * r.dir * st.nr;
      r.crank.rotation[r.axis] = (r.crank.rotation[r.axis] + rate * dt) % TAU;
      if (r.disc) r.disc.material.opacity = (r.main ? 0.42 : 0.3) * smooth(0.55, 1, st.nr);
    }

    // World: sink the ground for altitude, scroll its texture / props / rocks / clouds for the ground track
    const groundY = this.bottomY - drop;
    this.groundGroup.position.y = groundY;
    this.groundTex.offset.set(fract(this.pos.x / this.tileUnits), fract(-this.pos.z / this.tileUnits));
    for (const pr of this.props) {
      const x = pr.wx - this.pos.x;
      const z = pr.wz - this.pos.z;
      pr.obj.position.x = x;
      pr.obj.position.z = z;
      pr.obj.visible = Math.hypot(x, z) < GROUND_SIZE * 0.5;
    }
    if (this.windsock) this.windsock.rotation.set(0, 0.6 + Math.sin(t * 0.7) * 0.18, -0.12 + Math.sin(t * 1.9) * 0.05);
    if (this.rocks && (this.rocks.lastX !== this.pos.x || this.rocks.lastZ !== this.pos.z)) {
      const { mesh, list, span } = this.rocks;
      const m4 = new THREE.Matrix4();
      const pv = new THREE.Vector3();
      const sv = new THREE.Vector3();
      list.forEach((rk, i) => {
        pv.set(wrapC(rk.wx - this.pos.x, span), rk.s * 0.3, wrapC(rk.wz - this.pos.z, span));
        sv.set(rk.s, rk.s * 0.62, rk.s);
        mesh.setMatrixAt(i, m4.compose(pv, rk.q, sv));
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.rocks.lastX = this.pos.x;
      this.rocks.lastZ = this.pos.z;
    }
    for (const cl of this.clouds) {
      cl.obj.position.set(wrapC(cl.wx - this.pos.x * 0.7, 140), cl.h - drop * 0.35, wrapC(cl.wz - this.pos.z * 0.7, 140));
      cl.obj.lookAt(v.camera.position);
    }

    // Downwash ring: strongest in a low hover with lots of collective, gone above ~1.6 rotor diameters
    const R = this.maxR > 0 ? this.maxR : this.modelScale * 0.4;
    const hR = altU / (2 * R);
    const dustK = st.nr > 0.6 ? clamp(1 - hR / 1.6, 0, 1) * smooth(0.6, 1, st.nr) * (0.35 + 0.65 * st.collective) : 0;
    this.dust.visible = dustK > 0.01;
    this.dust.material.opacity = 0.95 * dustK;
    const ds = R * (2.4 + hR * 1.2);
    this.dust.scale.set(ds, ds, 1);
    this.dust.rotation.z += dt * (1.2 + 2 * st.collective) * st.nr;

    // Lights: steady position lights, pulsing red beacons, double-flash white strobe
    for (const L of this.lights) {
      let on = st.lightsOn;
      if (L.kind === 'beacon') on = on && Math.sin(t * TAU * 1.1 + L.phase) > 0.35;
      else if (L.kind === 'strobe') {
        const ph = (t + L.phase) % 1.25;
        on = on && (ph < 0.05 || (ph > 0.14 && ph < 0.19));
      }
      L.obj.visible = on;
    }

    // Chase camera swings round to follow turns (with lag, so the yaw stays visible); orbit drags still add on top
    const prevFollow = this.camFollow;
    this.camFollow = approach(this.camFollow, st.psi, dt * 1.1);
    v.desiredSpherical.theta += this.camFollow - prevFollow;

    // Pose: yaw → pitch → bank (Euler 'YZX'), hover bob & light turbulence, gear-compression jolt on hard landings
    let bob = 0;
    let wobP = 0;
    let wobB = 0;
    if (!st.onGround) {
      const k = this.modelScale * 0.004;
      bob = Math.sin(t * 1.7) * k * 1.4 + Math.sin(t * 2.9 + 1) * k * 0.6;
      wobP = Math.sin(t * 1.3 + 0.5) * 0.008;
      wobB = Math.sin(t * 1.1 + 2) * 0.01 + (boost ? Math.sin(t * 13) * 0.003 : 0);
    } else if (st.nr > 0.2) {
      bob = Math.sin(t * 40) * 0.0012 * st.nr; // rotor shiver on the ground
    }
    this.jolt = Math.max(0, this.jolt - dt * 2.5);
    const joltY = -Math.sin(this.jolt * Math.PI) * 0.012 * this.modelScale;
    v.rootGroup.position.y = bob + joltY;
    v.rootGroup.rotation.set(st.bank + wobB, st.psi, st.pitch * 0.75 + wobP);
  }
}
