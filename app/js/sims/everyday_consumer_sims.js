// Wave 2 & Wave 3 Interactive 3D Action Simulators:
// - DysonVacuumSim (`dyson-v15-vacuum`)
// - FridgeHeatPumpSim (`french-door-refrigerator`)
// - EscalatorSim (`commercial-escalator`)
// - GamingConsoleSim (`gaming`: PS5 Pro, DualSense, Handheld Hybrid OLED)
// - SpatialAudioXrSim (`audio-xr`: Apple Vision Pro, AirPods Pro 2, ANC Over-Ear)
// - CameraOpticsSim (`cameras`: Mirrorless Full-Frame, Instant Film, IMAX 70mm)

import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, makeGlowQuad } from './base.js';

// ============================================================================
// 1. DYSON V15 CYCLONE VACUUM SIM
// ============================================================================
export class DysonVacuumSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: true });
    this.st = { rpm: 18000, suction: 35, battery: 96, laserOn: true, binEject: 0 };
  }

  onEnter() {
    this.lasers = [];
    this.viewer.rootGroup.traverse((o) => {
      if (o.userData?.isLaserBeam) this.lasers.push(o);
    });
    this.bins = this.parts(/polycarbonate-dust-bin/);
    this.motes = [];
    for (let i = 0; i < 18; i++) {
      const mote = makeGlowQuad(0x4ade80, 0.09, 0.85, true);
      mote.userData.seed = i * 0.37;
      mote.position.set(1.2 + (i % 6) * 0.14, -1.02 + (i % 3) * 0.04, ((i % 5) - 2) * 0.14);
      this.env.add(mote);
      this.motes.push(mote);
    }
    this.check('laser');
  }

  onExit() {
    for (const b of this.bins) b.position.set(0, 0, 0);
    for (const l of this.lasers) l.visible = true;
  }

  trigger(name) {
    if (name === 'lights') {
      this.st.laserOn = !this.st.laserOn;
      for (const l of this.lasers) l.visible = this.st.laserOn;
      if (this.st.laserOn) this.check('laser');
      this.playTrigger('lights');
      return this.st.laserOn;
    }
    if (name === 'bin') {
      this.st.binEject = 0.65;
      this.playTrigger('bin');
      return true;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    const targetRpm = inp.boost ? 125000 : inp.up ? 102000 : inp.down ? 38000 : 24000;
    st.rpm = Math.round(approach(st.rpm, targetRpm, dt * 4.2));
    st.suction = Math.round((st.rpm / 125000) * 240);
    st.battery = clamp(st.battery - (0.04 + (st.rpm / 125000) * 0.25) * dt, 8, 100);
    if (st.rpm >= 95000) this.check('suction');
    if (inp.boost && st.suction >= 220) this.check('boost');

    st.binEject = Math.max(0, st.binEject - dt * 1.6);
    const binShift = Math.sin(clamp(st.binEject, 0, 0.65) * Math.PI) * 0.22;
    for (const b of this.bins) b.position.x = binShift;

    this.spinFans(dt, (st.rpm / 125000) * 38);

    const pullRate = 0.6 + (st.rpm / 125000) * 3.4;
    for (const m of this.motes) {
      m.visible = st.laserOn || st.rpm > 50000;
      const u = (this.elapsed * pullRate + m.userData.seed) % 1;
      m.position.x = 1.68 - u * 0.68;
      m.position.y = -1.03 + u * 0.16 + Math.sin(this.elapsed * 8 + m.userData.seed * 6) * 0.02;
      m.lookAt(this.viewer.camera.position);
    }

    const dustRate = Math.round((st.rpm / 125000) * 14800 * (st.laserOn ? 1.15 : 0.85));
    Object.assign(this.telemetry, {
      rpm: st.rpm.toLocaleString(),
      suction: `${st.suction} AW`,
      dust: `${dustRate.toLocaleString()}/s`,
      battery: Math.round(st.battery),
      soundRpm: 1200 + (st.rpm / 125000) * 4200,
      soundThrottle: st.rpm / 125000,
    });
  }
}

// ============================================================================
// 2. FRENCH-DOOR HEAT-PUMP REFRIGERATOR SIM
// ============================================================================
export class FridgeHeatPumpSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true });
    this.st = { fridgeF: 41.0, freezerF: 4.0, hz: 42, load: 36, doorsOpen: false, iceTimer: 0 };
  }

  onEnter() {
    this.doors = this.parts(/french-doors-mullion/);
    this.coldPlumes = [-0.25, 0.25].map((z, idx) => {
      const q = makeGlowQuad(0x38bdf8, 0.68, 0.55, true);
      q.position.set(0.05, 0.35 - idx * 0.35, z);
      this.env.add(q);
      return q;
    });
    this.iceCubes = [0, 1, 2].map((i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.045, 0.045),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.88 }),
      );
      cube.visible = false;
      cube.userData.offset = i * 0.22;
      this.env.add(cube);
      return cube;
    });
  }

  onExit() {
    for (const d of this.doors) d.position.set(0, 0, 0);
  }

  trigger(name) {
    if (name === 'ice') {
      this.st.iceTimer = 1.1;
      this.check('ice');
      this.playTrigger('ice');
      return true;
    }
    if (name === 'lights') {
      this.st.doorsOpen = !this.st.doorsOpen;
      this.check('door');
      this.playTrigger('lights');
      return this.st.doorsOpen;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    if (inp.space && st.iceTimer <= 0) this.trigger('ice');
    st.iceTimer = Math.max(0, st.iceTimer - dt);

    const targetLoad = inp.boost ? 98 : inp.up ? 82 : inp.down ? 22 : 38;
    st.load = approach(st.load, targetLoad, dt * 3.0);
    st.hz = Math.round(28 + (st.load / 100) * 92);

    const coolTargetF = inp.boost ? 34.0 : inp.up ? 36.5 : 38.0;
    const freezeTargetF = inp.boost ? -6.0 : inp.up ? -1.0 : 1.0;
    st.fridgeF = approach(st.fridgeF, coolTargetF, dt * 1.4);
    st.freezerF = approach(st.freezerF, freezeTargetF, dt * 1.4);
    if (st.fridgeF <= 37.5 && st.freezerF <= 0.5) this.check('cool');

    for (const d of this.doors) {
      d.position.x = approach(d.position.x, st.doorsOpen ? 0.26 : 0, dt * 5.0);
    }

    this.spinFans(dt, 4 + (st.load / 100) * 18);

    this.coldPlumes.forEach((p, idx) => {
      p.position.y = 0.45 - ((this.elapsed * (0.45 + st.load * 0.008) + idx * 0.5) % 0.9);
      p.material.opacity = 0.28 + (st.load / 100) * 0.45;
      p.lookAt(this.viewer.camera.position);
    });

    this.iceCubes.forEach((c) => {
      if (st.iceTimer > 0) {
        c.visible = true;
        const prog = ((1.1 - st.iceTimer + c.userData.offset) % 0.65) / 0.65;
        c.position.set(0.62, 0.28 - prog * 0.26, -0.34 + (c.userData.offset - 0.22) * 0.12);
        c.rotation.x += dt * 5;
        c.rotation.y += dt * 4;
      } else {
        c.visible = false;
      }
    });

    Object.assign(this.telemetry, {
      fridgeTemp: `${st.fridgeF.toFixed(1)}°F`,
      freezerTemp: `${st.freezerF.toFixed(0)}°F`,
      compHz: `${st.hz} Hz`,
      load: Math.round(st.load),
      soundThrottle: st.load / 100,
      soundExtra: { hz: st.hz },
    });
  }
}

// ============================================================================
// 3. HEAVY-DUTY COMMERCIAL ESCALATOR SIM
// ============================================================================
export class EscalatorSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: false });
    this.st = { fpm: 90, dir: 1, stopped: false, phase: 0, load: 48 };
  }

  onEnter() {
    this.steps = [];
    this.viewer.rootGroup.traverse((o) => {
      if (typeof o.userData?.escalatorStepU === 'number') {
        this.steps.push({
          grp: o,
          baseU: o.userData.escalatorStepU,
          origX: o.position.x,
          origY: o.position.y,
        });
      }
    });
  }

  onExit() {
    for (const s of this.steps) {
      s.grp.position.x = s.origX;
      s.grp.position.y = s.origY;
    }
  }

  trigger(name) {
    if (name === 'reverse') {
      this.st.dir *= -1;
      this.st.stopped = false;
      this.check('reverse');
      this.playTrigger('reverse');
      return true;
    }
    if (name === 'estop') {
      this.st.stopped = !this.st.stopped;
      this.playTrigger('estop');
      return this.st.stopped;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    const targetFpm = st.stopped ? 0 : inp.boost ? 120 : inp.up ? 100 : inp.down ? 25 : 90;
    st.fpm = approach(st.fpm, targetFpm, dt * 4.0);
    st.load = approach(st.load, st.stopped ? 4 : inp.boost ? 96 : inp.up ? 68 : 42, dt * 3.2);

    if (st.fpm >= 95) this.check('ride');
    if (inp.boost && st.load >= 85) this.check('rush');

    const cycleSpeed = (st.fpm / 100) * 0.24 * st.dir;
    st.phase = (((st.phase + dt * cycleSpeed) % 1) + 1) % 1;

    for (const s of this.steps) {
      const u = (s.baseU + st.phase) % 1;
      const sx = -1.32 + u * 2.58;
      let sy = -0.44;
      if (sx > -1.05 && sx < 0.98) {
        sy = -0.44 + ((sx + 1.05) / 2.03) * 1.32;
      } else if (sx >= 0.98) {
        sy = 0.88;
      }
      s.grp.position.x = sx;
      s.grp.position.y = sy;
    }

    this.spinFans(dt, -(st.fpm / 100) * 4.5 * st.dir);

    const paxHr = st.stopped ? 0 : Math.round((st.fpm / 100) * (inp.boost ? 9000 : 6200));
    Object.assign(this.telemetry, {
      paxHr: paxHr.toLocaleString(),
      dir: st.stopped ? 'E-STOP 🛑' : st.dir > 0 ? 'UP ↗' : 'DOWN ↘',
      speedFpm: `${Math.round(st.fpm)} fpm`,
      motorLoad: Math.round(st.load),
      soundRpm: 650 + st.fpm * 8,
      soundThrottle: st.load / 100,
    });
  }
}

// ============================================================================
// 4. GAMING CONSOLE & CONTROLLER SIM (`gaming`)
// ============================================================================
const RGB_PALETTE = [0x3b82f6, 0xa855f7, 0xec4899, 0x10b981, 0xf59e0b];

export class GamingConsoleSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: true });
    this.st = { fps: 60, gpuGhz: 2.18, temp: 52, power: 48, rgbIdx: 0, hapticBuzz: 0 };
  }

  onEnter() {
    this.rgbMeshes = [];
    this.pistons = [];
    this.viewer.rootGroup.traverse((o) => {
      if (o.userData?.isRgbBlade && o.material?.color) {
        o.userData.origHex = o.material.color.getHex();
        if (o.material.emissive) o.userData.origEmHex = o.material.emissive.getHex();
        this.rgbMeshes.push(o);
      }
      if (o.userData?.driveAnim === 'piston') {
        o.userData.origZ = o.position.z;
        this.pistons.push(o);
      }
    });
    this.aura = makeGlowQuad(RGB_PALETTE[0], 2.2, 0.35, true);
    this.aura.position.set(0, 0.25, 0);
    this.env.add(this.aura);
  }

  onExit() {
    this.viewer.rootGroup.position.set(0, 0, 0);
    for (const m of this.rgbMeshes) {
      if (m.userData.origHex !== undefined) m.material.color.setHex(m.userData.origHex);
      if (m.userData.origEmHex !== undefined && m.material.emissive) m.material.emissive.setHex(m.userData.origEmHex);
    }
    for (const p of this.pistons) {
      if (p.userData.origZ !== undefined) p.position.z = p.userData.origZ;
    }
  }

  trigger(name) {
    if (name === 'haptic') {
      this.st.hapticBuzz = 0.55;
      this.check('haptic');
      this.playTrigger('haptic');
      return true;
    }
    if (name === 'rgb') {
      this.st.rgbIdx = (this.st.rgbIdx + 1) % RGB_PALETTE.length;
      const hex = RGB_PALETTE[this.st.rgbIdx];
      for (const m of this.rgbMeshes) {
        m.material.color.setHex(hex);
        if (m.material.emissive) m.material.emissive.setHex(hex);
      }
      this.aura.material.color.setHex(hex);
      this.check('haptic');
      this.playTrigger('rgb');
      return true;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    if (inp.space && st.hapticBuzz <= 0) this.trigger('haptic');
    st.hapticBuzz = Math.max(0, st.hapticBuzz - dt);

    const targetFps = inp.boost ? 120 : inp.up ? 90 : inp.down ? 30 : 60;
    const targetLoad = inp.boost ? 98 : inp.up ? 78 : inp.down ? 14 : 46;
    st.fps = approach(st.fps, targetFps, dt * 5.0);
    st.power = approach(st.power, targetLoad, dt * 3.6);
    st.gpuGhz = 1.45 + (st.power / 100) * 0.92;
    st.temp = approach(st.temp, 39 + st.power * 0.34, dt * 1.8);

    if (st.fps >= 58) this.check('boot');
    if (st.fps >= 115) this.check('boost');

    this.spinFans(dt, 4 + (st.power / 100) * 24);
    for (const p of this.pistons) {
      p.position.z = (p.userData.origZ || 0) + (st.hapticBuzz > 0 ? Math.sin(this.elapsed * 140) * 0.045 : 0);
    }
    this.viewer.rootGroup.position.x = st.hapticBuzz > 0 ? Math.sin(this.elapsed * 175) * 0.024 : 0;
    this.aura.lookAt(this.viewer.camera.position);
    this.aura.scale.setScalar(0.9 + (st.power / 100) * 0.45);

    Object.assign(this.telemetry, {
      fps: Math.round(st.fps),
      gpu: `${st.gpuGhz.toFixed(2)} GHz`,
      temp: `${Math.round(st.temp)}°C`,
      power: Math.round(st.power),
      soundRpm: 900 + st.power * 22,
      soundThrottle: st.power / 100,
    });
  }
}

// ============================================================================
// 5. SPATIAL XR & AUDIO SIM (`audio-xr`)
// ============================================================================
export class SpatialAudioXrSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true });
    this.st = { ancDb: 28, immersion: 64, passthrough: false, wavePulse: 0 };
  }

  onEnter() {
    this.rings = [0, 1, 2].map((i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55 + i * 0.28, 0.012, 12, 48),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42 }),
      );
      ring.rotation.x = Math.PI / 2;
      this.env.add(ring);
      return ring;
    });
    this.eyeSight = [];
    this.viewer.rootGroup.traverse((o) => {
      if (o.userData?.isRgbBlade && o.material?.color) {
        o.userData.origHex = o.material.color.getHex();
        this.eyeSight.push(o);
      }
    });
  }

  onExit() {
    for (const m of this.eyeSight) {
      if (m.userData.origHex !== undefined) m.material.color.setHex(m.userData.origHex);
    }
  }

  trigger(name) {
    if (name === 'spatial') {
      this.st.wavePulse = 1.0;
      this.check('spatial');
      this.playTrigger('spatial');
      return true;
    }
    if (name === 'passthrough') {
      this.st.passthrough = !this.st.passthrough;
      for (const m of this.eyeSight) {
        m.material.color.setHex(this.st.passthrough ? 0x38bdf8 : 0xa855f7);
      }
      this.check('passthrough');
      this.playTrigger('passthrough');
      return this.st.passthrough;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    if (inp.space && st.wavePulse <= 0.1) this.trigger('spatial');
    st.wavePulse = Math.max(0, st.wavePulse - dt * 0.9);

    const targetImm = st.passthrough ? 25 : inp.boost ? 100 : inp.up ? 88 : inp.down ? 32 : 66;
    st.immersion = approach(st.immersion, targetImm, dt * 3.5);
    st.ancDb = Math.round(st.passthrough ? 6 : 14 + (st.immersion / 100) * 28);

    if (st.ancDb >= 35) this.check('anc');
    if (inp.boost) this.check('spatial');

    this.spinFans(dt, 3 + (st.immersion / 100) * 9);

    this.rings.forEach((r, idx) => {
      const s = 1 + ((this.elapsed * 0.65 + idx * 0.33) % 1) * (0.45 + st.wavePulse * 0.65);
      r.scale.setScalar(s);
      r.material.color.setHex(st.passthrough ? 0x34d399 : inp.boost ? 0xa855f7 : 0x38bdf8);
      r.material.opacity = clamp((1.55 - s) * (0.35 + st.wavePulse * 0.45), 0.05, 0.75);
    });

    Object.assign(this.telemetry, {
      ancDb: st.passthrough ? 'OPEN' : `-${st.ancDb} dB`,
      mode: st.passthrough ? 'Transparency' : inp.boost ? '360° Spatial' : 'Adaptive ANC',
      latency: '11.2 ms',
      immersion: Math.round(st.immersion),
      soundThrottle: st.immersion / 100,
      soundExtra: { ancFrac: st.passthrough ? 0 : st.ancDb / 42 },
    });
  }
}

// ============================================================================
// 6. CAMERAS & OPTICS SIM (`cameras`)
// ============================================================================
export class CameraOpticsSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true });
    this.st = { focusPct: 48, fStop: 2.8, shutterFlash: 0, printEject: 0, burstFps: 1 };
  }

  onEnter() {
    this.lenses = this.parts(/zoom-lens|taking-lens|cinema-lens/);
    this.prints = [];
    this.viewer.rootGroup.traverse((o) => {
      if (o.userData?.isInstantPrint) {
        o.userData.origZ = o.position.z;
        this.prints.push(o);
      }
    });
    this.strobe = makeGlowQuad(0xffffff, 2.8, 0.0, true);
    this.strobe.position.set(0.65, 0.35, 0.85);
    this.env.add(this.strobe);
  }

  onExit() {
    for (const l of this.lenses) l.position.set(0, 0, 0);
    for (const p of this.prints) {
      if (p.userData.origZ !== undefined) p.position.z = p.userData.origZ;
    }
  }

  trigger(name) {
    if (name === 'shutter') {
      this.st.shutterFlash = 0.85;
      this.st.printEject = 1.0;
      this.check('shutter');
      this.playTrigger('shutter');
      return true;
    }
    if (name === 'flash') {
      this.st.shutterFlash = 1.0;
      this.playTrigger('flash');
      return true;
    }
    return false;
  }

  onUpdate(dt) {
    const st = this.st;
    const inp = this.inputs;
    if (inp.space && st.shutterFlash <= 0.1) this.trigger('shutter');

    st.shutterFlash = Math.max(0, st.shutterFlash - dt * 3.4);
    st.printEject = Math.max(0, st.printEject - dt * 0.65);

    const targetFocus = inp.boost ? 98 : inp.up ? 92 : inp.down ? 28 : 54;
    st.focusPct = approach(st.focusPct, targetFocus, dt * 3.8);
    st.fStop = inp.down ? 8.0 : inp.boost ? 2.0 : 2.8;
    st.burstFps = inp.boost ? 24 : inp.up ? 12 : 1;

    if (st.focusPct >= 88) this.check('focus');
    if (inp.boost && st.burstFps >= 20) {
      this.check('burst');
      if (Math.floor(this.elapsed * 12) % 2 === 0 && st.shutterFlash <= 0.05) {
        st.shutterFlash = 0.35;
      }
    }

    const lensShift = ((st.focusPct - 50) / 50) * 0.06;
    for (const l of this.lenses) l.position.z = lensShift;

    for (const p of this.prints) {
      const baseZ = p.userData.origZ || 0;
      p.position.z = baseZ + Math.sin((1 - st.printEject) * Math.PI * 0.5) * (st.printEject > 0 ? 0.32 : 0);
    }

    this.spinFans(dt, inp.boost ? 24 : inp.up ? 10 : 1.5);
    this.strobe.material.opacity = st.shutterFlash * 0.9;
    this.strobe.lookAt(this.viewer.camera.position);

    Object.assign(this.telemetry, {
      shutterHud: inp.boost ? '1/8000s' : '1/500s',
      aperture: `f/${st.fStop.toFixed(1)}`,
      fpsHud: `${st.burstFps} FPS`,
      buffer: Math.round(st.focusPct),
      soundExtra: { fps: st.burstFps },
    });
  }
}
