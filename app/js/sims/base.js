// Shared base class + helpers for per-category action simulations (Drive, Flight, Dive, Engine, ...).
// A sim owns a private `env` group added to the scene while active, reads held inputs from
// `viewer.inputs`, mutates part groups found by id-regex, and returns a telemetry object per frame.
import * as THREE from '../../vendor/three.module.js';
import { startEngineSound, updateEngineSound, stopEngineSound } from '../sound.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const approach = (cur, target, rate) => cur + (target - cur) * Math.min(1, rate);
export const wrapDeg = (d) => ((d % 360) + 360) % 360;

export function disposeGroup(group) {
  group.traverse((o) => {
    if (o.isMesh || o.isSprite || o.isLine || o.isPoints) {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
  group.clear();
}

export function makeCanvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Soft radial glow quad (clouds, bubbles, exhaust, sun) — additive and depth-write free.
export function makeGlowQuad(color, size, opacity = 0.5, additive = false) {
  const tex = makeCanvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
}

export class BaseSim {
  constructor(viewer, { engineSound = false, turbine = false } = {}) {
    this.viewer = viewer;
    this.env = new THREE.Group();
    this.env.name = 'sim-env';
    this.checks = {};
    this.elapsed = 0;
    this.telemetry = { checks: this.checks };
    this.engineSound = engineSound;
    this.turbine = turbine;
    this.hideFloor = false;
  }

  get inputs() {
    return this.viewer.inputs;
  }

  // Part groups whose catalog id matches `regex` (e.g. /gear|wheel/).
  parts(regex) {
    const out = [];
    for (const [id, rec] of this.viewer.partRecords.entries()) {
      if (regex.test(id)) out.push(rec.group);
    }
    return out;
  }

  meshes(regex) {
    const out = [];
    for (const [id, rec] of this.viewer.partRecords.entries()) {
      if (regex.test(id)) out.push(...rec.meshes);
    }
    return out;
  }

  spinFans(dt, rate) {
    for (const c of this.viewer.driveCranks) {
      const axis = c.userData?.spinAxis || 'x';
      c.rotation[axis] += dt * rate;
    }
  }

  check(id) {
    if (!this.checks[id]) this.checks[id] = true;
  }

  enter() {
    this.viewer.scene.add(this.env);
    if (this.engineSound) startEngineSound();
    this.onEnter();
    if (this.hideFloor) this.viewer.stageFloorGroup.visible = false;
  }

  exit() {
    this.onExit();
    this.viewer.scene.remove(this.env);
    disposeGroup(this.env);
    this.viewer.stageFloorGroup.visible = true;
    if (this.engineSound) stopEngineSound();
  }

  update(dt) {
    this.elapsed += dt;
    this.onUpdate(dt);
    this.telemetry.checks = this.checks;
    if (this.engineSound) {
      updateEngineSound(this.telemetry.soundRpm ?? 900, this.telemetry.soundThrottle ?? 0, this.turbine);
    }
    return this.telemetry;
  }

  // Hooks for subclasses
  onEnter() {}
  onExit() {}
  onUpdate() {}
  onInput() {}
  trigger() {
    return false;
  }
}
