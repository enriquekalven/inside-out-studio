// 📱 Power It On! • 💻 Boot It Up! • 🏡 Move In! • 📺 Turn It On! • 🚄 Take It for a Ride! • 🛰️ Take It to Orbit!
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, makeCanvasTexture, makeGlowQuad } from './base.js';
import { playPop, playSnap, playHorn } from '../sound.js';

export class PhoneSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: false }); this.st = { battery: 96, cpu: 33, load: 22, boot: 0, buzz: 0, flash: false, shutter: 0 }; }
  onEnter() {
    const box = new THREE.Box3().setFromObject(this.viewer.rootGroup), sz = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    this.scrTex = makeCanvasTexture(128, 256, (c, w, h) => { c.fillStyle = '#0ea5e9'; c.fillRect(0, 0, w, h); });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 0.82, sz.y * 0.86), new THREE.MeshBasicMaterial({ map: this.scrTex, transparent: true, opacity: 0.92 }));
    this.screen.position.set(ctr.x, ctr.y, box.max.z + 0.012);
    this.flashGlow = makeGlowQuad(0xfffbeb, 1.3, 0.9, true);
    this.flashGlow.position.set(ctr.x + sz.x * 0.22, ctr.y + sz.y * 0.32, box.min.z - 0.04);
    this.flashGlow.visible = false;
    this.env.add(this.screen, this.flashGlow);
  }
  onExit() { this.viewer.rootGroup.position.set(0, 0, 0); }
  trigger(name) {
    if (name === 'haptic') { this.st.buzz = 0.45; playPop(190); this.check('haptic'); return true; }
    if (name === 'flashlight') { this.st.flash = !this.st.flash; this.flashGlow.visible = this.st.flash; return this.st.flash; }
    if (name === 'camera') { this.st.shutter = 1; playSnap(); this.st.flash = true; this.flashGlow.visible = true; this.check('photo'); return true; }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    if ((st.boot = clamp(st.boot + dt * 1.1, 0, 1)) >= 1) this.check('boot');
    if (inp.space && st.buzz <= 0) this.trigger('haptic');
    st.buzz = Math.max(0, st.buzz - dt); st.shutter = Math.max(0, st.shutter - dt * 3.2);
    st.load = approach(st.load, inp.up ? 96 : 18 + Math.sin(this.elapsed * 2.5) * 6, dt * 3.5);
    st.cpu = approach(st.cpu, 31 + st.load * 0.19, dt * 1.8);
    st.battery = clamp(st.battery - (0.03 + st.load * 0.002) * dt, 12, 100);
    const ctx = this.scrTex.image.getContext('2d'), g = ctx.createLinearGradient(0, 0, 128, 256);
    g.addColorStop(0, st.load > 60 ? '#ec4899' : '#0284c7'); g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = st.shutter > 0.2 ? '#ffffff' : g; ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('09:41', 64, 72);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(20, 180, (st.load / 100) * 88, 12);
    this.scrTex.needsUpdate = true;
    this.viewer.rootGroup.position.x = st.buzz > 0 ? Math.sin(this.elapsed * 190) * 0.03 : 0;
    Object.assign(this.telemetry, { battery: Math.round(st.battery), cpu: `${Math.round(st.cpu)}°C`, signal: '5G UW', load: `${Math.round(st.load)}%`, loadBar: st.load });
  }
}

export class LaptopSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: true, turbine: true }); this.st = { cpu: 24, temp: 44, fan: 1400, battery: 94, lid: 0.55, peaked: false, typing: 0 }; }
  onEnter() {
    this.lids = this.parts(/lid|display|screen/);
    this.glows = this.meshes(/heatpipe|vapor|motherboard|logic|keyboard/).filter((m) => m.material?.emissive);
    for (const m of this.glows) m.userData.origEm = m.material.emissive.getHex();
  }
  onExit() {
    for (const g of this.lids) g.rotation.set(0, 0, 0);
    for (const m of this.glows) if (m.userData.origEm !== undefined) m.material.emissive.setHex(m.userData.origEm);
  }
  trigger(name) { if (name === 'keypress') { this.st.typing = 0.4; playPop(720); return true; } return false; }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    if ((st.lid = approach(st.lid, 0, dt * 2.2)) < 0.05) this.check('boot');
    for (const g of this.lids) g.rotation.x = st.lid;
    if (inp.space && st.typing <= 0) this.trigger('keypress');
    st.typing = Math.max(0, st.typing - dt);
    st.cpu = approach(st.cpu, inp.up ? 97 : inp.down ? 8 : 24 + (st.typing > 0 ? 25 : 0), dt * 3.0);
    if (st.cpu >= 90) { st.peaked = true; this.check('load'); }
    st.temp = approach(st.temp, 36 + st.cpu * 0.56 - (inp.down ? 14 : 0), dt * (inp.down ? 2.6 : 1.5));
    if (st.peaked && st.temp < 60) this.check('cool');
    st.fan = Math.round(approach(st.fan, st.temp > 50 ? 1600 + (st.temp - 40) * 72 : 1100, dt * 1100));
    st.battery = clamp(st.battery - (0.02 + st.cpu * 0.001) * dt, 10, 100);
    this.spinFans(dt, (st.fan / 1000) * 9);
    for (const m of this.glows) m.material.emissive.setHex(st.temp > 72 ? 0xf97316 : st.typing > 0 ? 0x38bdf8 : m.userData.origEm);
    Object.assign(this.telemetry, { cpu: Math.round(st.cpu), temp: `${Math.round(st.temp)}°C`, fan: `${st.fan} RPM`, battery: `${Math.round(st.battery)}%`, batteryBar: st.battery, soundRpm: 850 + st.fan * 0.9, soundThrottle: st.cpu / 100 });
  }
}

export class HouseSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: false }); this.st = { kwh: 1.2, temp: 22.0, power: 58, night: false, rooms: 1, hvac: true }; }
  onEnter() {
    this.sun = makeGlowQuad(0xfacc15, 2.2, 0.95, true); this.sun.position.set(2.4, 2.5, -1.8);
    this.roomLights = [-0.65, 0, 0.65].map((x) => { const g = makeGlowQuad(0xfef08a, 1.1, 0.75, true); g.position.set(x, 0.05, 0.25); this.env.add(g); return g; });
    this.hvacOrb = makeGlowQuad(0x38bdf8, 1.4, 0.55, true); this.hvacOrb.position.set(0, 0.35, 0);
    this.env.add(this.sun, this.hvacOrb);
  }
  trigger(name) {
    if (name === 'daynight') { this.st.night = !this.st.night; if (this.st.night) this.check('night'); return this.st.night; }
    if (name === 'lights') { this.st.rooms = (this.st.rooms % 3) + 1; if (this.st.rooms >= 3) this.check('lights'); playPop(580); return true; }
    if (name === 'hvac') { this.st.hvac = !this.st.hvac; playPop(480); return this.st.hvac; }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    st.power = approach(st.power, inp.up ? 100 : st.night ? 0 : 62, dt * 3.5);
    if ((st.kwh = +(st.kwh + (st.power / 100) * dt * 1.9).toFixed(1)) >= 5) this.check('solar');
    st.temp = approach(st.temp, st.hvac ? 21.0 : (st.night ? 17.0 : 26.0), dt * 0.9);
    this.sun.material.color.setHex(st.night ? 0x93c5fd : 0xfacc15);
    this.sun.scale.setScalar(inp.up ? 1.35 : st.night ? 0.65 : 1.0);
    this.roomLights.forEach((l, i) => { l.visible = i < st.rooms; l.lookAt(this.viewer.camera.position); });
    this.hvacOrb.visible = st.hvac; this.hvacOrb.position.y = 0.1 + Math.sin(this.elapsed * 3) * 0.25; this.hvacOrb.lookAt(this.viewer.camera.position);
    Object.assign(this.telemetry, { kwh: st.kwh.toFixed(1), temp: `${st.temp.toFixed(1)}°C`, time: st.night ? '22:30 🌙' : inp.up ? '12:00 ☀️' : '15:00 ⛅', power: `${Math.round(st.power)}%`, powerBar: st.power });
  }
}

export class TvSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: false }); this.st = { nits: 650, vol: 45, idx: 0, seen: new Set([0]) }; }
  onEnter() {
    this.tex = makeCanvasTexture(160, 90, (c, w, h) => { c.fillStyle = '#0284c7'; c.fillRect(0, 0, w, h); });
    this.pic = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.72), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, opacity: 0.9 }));
    this.pic.position.set(0, 0.15, 0.22);
    this.ambi = makeGlowQuad(0x38bdf8, 4.8, 0.65, true); this.ambi.position.set(0, 0.15, -0.25);
    this.env.add(this.ambi, this.pic);
    this.speakers = this.parts(/speaker|soundbar|sub|audio|horn/);
  }
  onExit() { for (const s of this.speakers) s.scale.setScalar(1); }
  trigger(name) {
    if (name === 'input') { this.st.idx = (this.st.idx + 1) % 3; this.st.seen.add(this.st.idx); if (this.st.seen.size >= 3) this.check('input'); playPop(640); return true; }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    if (inp.up) st.nits = clamp(st.nits + dt * 550, 150, 2000);
    if (inp.down) st.nits = clamp(st.nits - dt * 550, 150, 2000);
    if (st.nits >= 1000) this.check('bright');
    if (inp.right) st.vol = clamp(st.vol + dt * 48, 0, 100);
    if (inp.left) st.vol = clamp(st.vol - dt * 48, 0, 100);
    if (st.vol > 80) this.check('loud');
    const cols = [['#0ea5e9', '#10b981', 0x38bdf8], ['#f97316', '#7c3aed', 0xf97316], ['#ec4899', '#06b6d4', 0xec4899]][st.idx];
    const ctx = this.tex.image.getContext('2d'), g = ctx.createLinearGradient(0, 0, 160, 90);
    g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 160, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(80 + Math.sin(this.elapsed * 2.4) * 42, 45 + Math.cos(this.elapsed * 1.8) * 20, 16, 0, Math.PI * 2); ctx.fill();
    this.tex.needsUpdate = true;
    this.ambi.material.color.setHex(cols[2]); this.ambi.material.opacity = 0.25 + (st.nits / 2000) * 0.65;
    const bass = 1 + Math.sin(this.elapsed * 28) * (st.vol / 100) * 0.06;
    for (const s of this.speakers) s.scale.setScalar(bass);
    Object.assign(this.telemetry, { nits: Math.round(st.nits), hz: [120, 24, 144][st.idx], input: ['HDMI 1 • 8K', 'Cinema HDR', 'Game 144Hz'][st.idx], volume: `${Math.round(st.vol)}%`, volumeBar: st.vol });
  }
}

export class TrainSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: true, turbine: true }); this.hideFloor = true; this.st = { speed: 120, power: 6.8, pantoUp: true, auto: true, hitHigh: false }; }
  onEnter() {
    const box = new THREE.Box3().setFromObject(this.viewer.rootGroup);
    const y = this.viewer.stageFloorGroup.position.y;
    this.isMaglev = /maglev/i.test(this.viewer.currentModel?.id || '');
    const pantoParts = this.parts(/panto|catenary/);
    this.pantoGroups = pantoParts;
    const pantoBox = pantoParts.length ? new THREE.Box3().setFromObject(pantoParts[0]) : null;
    const wireY = pantoBox && !pantoBox.isEmpty() ? pantoBox.max.y + 0.01 : Math.min(box.max.y + 0.02, y + 0.92);
    const pantoX = pantoBox && !pantoBox.isEmpty() ? (pantoBox.min.x + pantoBox.max.x) * 0.5 : -1.8;

    const span = Math.max(28, (box.max.x - box.min.x) + 10);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.35 });
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.65, roughness: 0.3 });

    if (!this.isMaglev) {
      this.wire = new THREE.Mesh(new THREE.BoxGeometry(span, 0.012, 0.012), railMat);
      this.wire.position.set(0, wireY, 0);
      this.env.add(this.wire);
    }

    // Passing high-speed catenary portals & trackside markers that streak by at 300-600 km/h
    this.portals = Array.from({ length: 10 }, (_, i) => {
      const g = new THREE.Group();
      const x = -span * 0.45 + i * (span / 10);
      g.position.set(x, y, 0);
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), mastMat);
        post.position.set(0, 0.11, s * 0.68);
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), markerMat);
        beacon.position.set(0, 0.22, s * 0.68);
        g.add(post, beacon);
      }
      if (!this.isMaglev && i % 2 === 0) {
        const mast = new THREE.Mesh(new THREE.BoxGeometry(0.035, wireY - y + 0.14, 0.035), mastMat);
        mast.position.set(0, (wireY - y + 0.14) * 0.5, -0.68);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.72), mastMat);
        arm.position.set(0, wireY - y + 0.08, -0.34);
        g.add(mast, arm);
      }
      this.env.add(g);
      return g;
    });
    this.portalSpan = span;

    this.spark = makeGlowQuad(0x7dd3fc, 0.32, 0.85, true);
    this.spark.position.set(pantoX, wireY - 0.01, 0);
    this.env.add(this.spark);

    // Lead-car nose headlight glows
    this.noseLights = [-0.17, 0.17].map((z) => {
      const q = makeGlowQuad(0xfffbeb, 0.38, 0.85, true);
      q.position.set(box.max.x - 0.52, y + 0.31, z);
      this.env.add(q);
      return q;
    });
    this.viewer.headlightGroup.visible = false;
  }
  onExit() {
    this.viewer.headlightGroup.visible = false;
    this.viewer.rootGroup.position.y = 0;
  }
  trigger(name) {
    if (name === 'pantograph') { this.st.pantoUp = !this.st.pantoUp; if (this.st.pantoUp) this.check('depart'); return this.st.pantoUp; }
    if (name === 'horn') { playHorn(); return true; }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs, maxV = this.isMaglev ? (inp.boost ? 603 : 505) : (inp.boost ? 500 : 350);
    if (inp.up || inp.down || inp.boost) st.auto = false;
    if (st.auto) st.speed = approach(st.speed, this.isMaglev ? 320 : 240, dt * 38);
    else if (inp.down) st.speed = Math.max(0, st.speed - 145 * dt);
    else if (inp.up || inp.boost) st.speed = Math.min(maxV, st.speed + (inp.boost ? 125 : 75) * dt);
    else st.speed = Math.max(0, st.speed - 14 * dt);
    if (st.pantoUp && st.speed > 25) this.check('depart');
    if (st.speed >= 300) { st.hitHigh = true; this.check('highspeed'); }
    if (st.hitHigh && st.speed < 1 && inp.down) this.check('stop');
    st.power = st.pantoUp ? clamp((st.speed / 500) * 18, 0, 18) : 0;
    const dx = (st.speed / 100) * 5.8 * dt;
    const halfSpan = this.portalSpan * 0.5;
    for (const p of this.portals) {
      p.position.x -= dx;
      if (p.position.x < -halfSpan) p.position.x += this.portalSpan;
    }
    if (this.viewer.driveWheels?.length) {
      const dTheta = -dx / 0.085;
      for (const w of this.viewer.driveWheels) w.rotation.z += dTheta;
    }
    if (this.isMaglev && st.speed > 80) {
      this.viewer.rootGroup.position.y = 0.018 + Math.sin(this.elapsed * 6) * 0.003;
    } else {
      this.viewer.rootGroup.position.y = Math.sin(this.elapsed * 32) * Math.min(0.002, st.speed * 0.000005);
    }
    this.spark.visible = !this.isMaglev && st.pantoUp && st.speed > 70 && Math.sin(this.elapsed * 55) > 0.25;
    this.spark.lookAt(this.viewer.camera.position);
    for (const q of this.noseLights) q.lookAt(this.viewer.camera.position);
    Object.assign(this.telemetry, { speed: Math.round(st.speed), notch: inp.down ? 'REGEN' : inp.boost ? 'MAG' : `P${Math.min(8, Math.ceil(st.speed / 45))}`, kv: this.isMaglev ? 'SCM L0' : (st.pantoUp ? '25 kV' : '0 kV'), power: `${st.power.toFixed(1)} MW`, powerBar: (st.power / 18) * 100, soundRpm: 900 + st.speed * 14, soundThrottle: st.speed / 500 });
  }
}

export class SpaceSim extends BaseSim {
  constructor(viewer) { super(viewer, { engineSound: false }); this.hideFloor = true; this.st = { vel: 7.66, alt: 408, pitch: 0, yaw: 0, sunTrack: true, rcs: 0, kw: 88 }; }
  onEnter() {
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.35, roughness: 0.6 }));
    this.earth.position.set(0, -13.3, 0);
    const pts = new Float32Array(450);
    for (let i = 0; i < 450; i += 3) { pts[i] = (Math.random() - 0.5) * 26; pts[i + 1] = (Math.random() - 0.2) * 18; pts[i + 2] = -4 - Math.random() * 14; }
    const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 }));
    this.puff = makeGlowQuad(0xe0f2fe, 0.9, 0.85, true); this.puff.position.set(-1.3, 0.2, 0);
    this.env.add(this.earth, stars, this.puff);
    this.arrays = this.parts(/solar|array|panel|wing/);
  }
  onExit() { for (const a of this.arrays) a.rotation.set(0, 0, 0); }
  trigger(name) {
    if (name === 'rcs') { this.st.rcs = 0.45; playPop(420); this.check('rcs'); return true; }
    if (name === 'solar') { this.st.sunTrack = !this.st.sunTrack; if (this.st.sunTrack) this.check('solar'); return this.st.sunTrack; }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    if (inp.up) { st.vel = clamp(st.vel + dt * 0.25, 7.4, 8.3); st.alt = clamp(st.alt + dt * 22, 350, 650); st.rcs = 0.2; }
    if (inp.down) { st.vel = clamp(st.vel - dt * 0.25, 7.2, 8.3); st.alt = clamp(st.alt - dt * 22, 320, 650); st.rcs = 0.2; }
    if (inp.left || inp.right || inp.pitchUp || inp.pitchDown || inp.space) { st.rcs = 0.3; this.check('rcs'); }
    st.yaw += ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * dt * 0.5;
    st.pitch += ((inp.pitchUp ? 1 : 0) - (inp.pitchDown ? 1 : 0)) * dt * 0.5;
    st.rcs = Math.max(0, st.rcs - dt);
    if (st.vel >= 7.8) this.check('orbit');
    if (st.sunTrack) { this.check('solar'); for (const a of this.arrays) a.rotation.x = Math.sin(this.elapsed * 0.8) * 0.35; }
    st.kw = approach(st.kw, st.sunTrack ? 120 : 42, dt * 20);
    this.earth.rotation.z -= dt * 0.08;
    this.puff.visible = st.rcs > 0; this.puff.lookAt(this.viewer.camera.position);
    this.viewer.rootGroup.rotation.set(0, st.yaw, st.pitch);
    Object.assign(this.telemetry, { velocity: st.vel.toFixed(2), altitude: `${Math.round(st.alt)} km`, attitude: `${Math.round(st.pitch * 57)}°/${Math.round(st.yaw * 57)}°`, solar: `${Math.round(st.kw)} kW`, solarBar: (st.kw / 120) * 100 });
  }
}

// 🚽 Siphon-Flush Toilet Sim — Flapper lifts, cistern water drops, 3D swirling blue water vortex & droplets go DOWN the bowl into the S-trap drain, then refills!
export class ToiletFlushSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: false });
    this.st = {
      phase: 'flushing', // 'flushing' | 'siphon' | 'refill' | 'ready'
      timer: 0,
      cisternLevel: 100, // 0..100 %
      bowlLevel: 1.0, // 0.15..1.25
      vortexSpeed: 14,
      flowGpm: 18.5,
      lidOpen: true,
    };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = false;
    this.flapperGroups = this.parts(/flapper|lever/);
    this.floatGroups = this.parts(/float|fill-valve/);
    this.lidGroups = this.parts(/seat|lid/);

    // Translucent water inside the upper cistern tank (drops when flushing, rises on refill)
    const tankWaterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.58,
      roughness: 0.12,
      transmission: 0.45,
    });
    this.tankWater = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.26, 0.39), tankWaterMat);
    this.tankWater.position.set(-0.32, 0.22, 0);
    this.env.add(this.tankWater);

    // Swirling bowl vortex group (spins & plunges DOWN into the S-trap drain at x=0.14, y=-0.16..-0.38)
    this.vortexGroup = new THREE.Group();
    this.vortexGroup.position.set(0.15, -0.14, 0);
    this.env.add(this.vortexGroup);

    const vortexRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.82,
      roughness: 0.15,
    });
    this.vortexRings = [];
    for (let i = 0; i < 6; i++) {
      const frac = i / 5;
      const r = 0.175 * (1 - frac * 0.68);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014 - frac * 0.004, 12, 28), vortexRingMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -frac * 0.18;
      this.vortexGroup.add(ring);
      this.vortexRings.push({ mesh: ring, baseR: r, frac });
    }

    // 40 animated 3D water stream droplets spiraling from rim jets DOWN through the bowl into the S-trap siphon
    const dropMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.9,
      roughness: 0.1,
    });
    const dropGeo = new THREE.SphereGeometry(0.015, 8, 8);
    this.drops = [];
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      this.env.add(m);
      this.drops.push({
        mesh: m,
        progress: (i / 40),
        angleOffset: (i * 1.37),
        speed: 0.85 + (i % 5) * 0.12,
      });
    }

    // S-trap siphon flow droplets travelling down the rear drain pipe
    this.siphonDrops = [];
    const siphonGeo = new THREE.SphereGeometry(0.018, 8, 8);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(siphonGeo, dropMat);
      this.env.add(m);
      this.siphonDrops.push({ mesh: m, t: i / 16 });
    }

    this.check('flush');
  }
  onExit() {
    for (const g of [...this.flapperGroups, ...this.floatGroups, ...this.lidGroups]) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  }
  trigger(name) {
    if (name === 'flush') {
      this.st.phase = 'flushing';
      this.st.timer = 0;
      if (this.st.cisternLevel < 45) this.st.cisternLevel = 100;
      playPop(340);
      this.check('flush');
      return true;
    }
    if (name === 'lid') {
      this.st.lidOpen = !this.st.lidOpen;
      playPop(520);
      return this.st.lidOpen;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    st.timer += dt;
    if (inp.space && st.phase === 'ready') this.trigger('flush');

    const boostMult = inp.boost ? 1.65 : 1.0;
    if (inp.up) {
      st.phase = 'flushing';
      this.check('flush');
    } else if (inp.down) {
      st.phase = 'refill';
    }

    if (st.phase === 'flushing') {
      st.cisternLevel = Math.max(8, st.cisternLevel - dt * 38 * boostMult);
      st.bowlLevel = approach(st.bowlLevel, 1.15, dt * 4.5);
      st.vortexSpeed = approach(st.vortexSpeed, 18 * boostMult, dt * 6);
      st.flowGpm = approach(st.flowGpm, 24.0 * boostMult, dt * 8);
      if (st.cisternLevel <= 15 && !inp.up) {
        st.phase = 'siphon';
        st.timer = 0;
        this.check('siphon');
      }
    } else if (st.phase === 'siphon') {
      // Siphon pulls water rapidly DOWN the bowl into the S-trap drain
      st.cisternLevel = Math.max(4, st.cisternLevel - dt * 15);
      st.bowlLevel = Math.max(0.18, st.bowlLevel - dt * 0.85 * boostMult);
      st.vortexSpeed = approach(st.vortexSpeed, 24 * boostMult, dt * 8);
      st.flowGpm = approach(st.flowGpm, 28.5 * boostMult, dt * 9);
      this.check('siphon');
      if (st.bowlLevel <= 0.22) {
        st.phase = 'refill';
        st.timer = 0;
      }
    } else if (st.phase === 'refill') {
      const fillRate = inp.down ? 55 : 28;
      st.cisternLevel = Math.min(100, st.cisternLevel + dt * fillRate);
      st.bowlLevel = approach(st.bowlLevel, 1.0, dt * 2.2);
      st.vortexSpeed = approach(st.vortexSpeed, 3.5, dt * 4);
      st.flowGpm = approach(st.flowGpm, 4.2, dt * 5);
      if (st.cisternLevel >= 98) {
        this.check('refill');
        st.phase = 'flushing'; // Continuously loop the flush demo so the user always sees water swirling & going down!
        st.timer = 0;
      }
    }

    // Update cistern water level height & position (drops down as tank drains)
    const lvlFrac = clamp(st.cisternLevel / 100, 0.08, 1);
    this.tankWater.scale.y = lvlFrac;
    this.tankWater.position.y = 0.09 + 0.13 * lvlFrac;

    // Lift flapper valve when flushing, drop float cup with water level
    const flapperLift = (st.phase === 'flushing' || st.phase === 'siphon') ? 0.065 : 0;
    for (const fg of this.flapperGroups) {
      fg.position.y = approach(fg.position.y, flapperLift, dt * 10);
      fg.rotation.z = approach(fg.rotation.z, flapperLift * 1.8, dt * 10);
    }
    for (const fl of this.floatGroups) {
      fl.position.y = (lvlFrac - 0.85) * 0.12;
    }
    for (const lg of this.lidGroups) {
      lg.rotation.z = approach(lg.rotation.z, st.lidOpen ? 0 : -1.25, dt * 6);
    }

    // Spin & plunge the bowl vortex rings DOWNWARD
    this.vortexGroup.rotation.y -= dt * st.vortexSpeed;
    for (let i = 0; i < this.vortexRings.length; i++) {
      const vr = this.vortexRings[i];
      const pulse = ((this.elapsed * 2.2 + vr.frac) % 1);
      const rScale = (1 - pulse * 0.65) * clamp(st.bowlLevel, 0.35, 1.15);
      vr.mesh.scale.set(rScale, rScale, 1);
      // Plunge from rim (y=0.04) DOWN to S-trap throat (y=-0.22)
      vr.mesh.position.y = 0.03 - pulse * 0.24;
      vr.mesh.material.opacity = (1 - pulse * 0.55) * 0.85;
    }

    // Spiral 40 water droplets from rim jets (y = -0.03, r = 0.21) DOWN into the bowl throat (y = -0.34, r = 0.02)
    const activeFlow = st.phase !== 'refill' || st.cisternLevel < 65;
    for (const d of this.drops) {
      d.progress = (d.progress + dt * d.speed * (0.45 + st.vortexSpeed * 0.055)) % 1;
      const p = d.progress;
      const angle = d.angleOffset + p * 11.5 + this.elapsed * (st.vortexSpeed * 0.45);
      const rad = (1 - p * 0.88) * 0.205 * clamp(st.bowlLevel + 0.2, 0.45, 1.15);
      const wx = 0.15 + Math.cos(angle) * rad;
      const wz = Math.sin(angle) * rad * 0.82;
      const wy = -0.03 - p * 0.31; // Plunges straight DOWN the bowl!
      d.mesh.position.set(wx, wy, wz);
      const s = activeFlow ? (1.15 - p * 0.45) : 0.45;
      d.mesh.scale.setScalar(s);
    }

    // Animate water rushing through the S-trap curve and DOWN the floor soil drain (x = -0.22, y = -0.49)
    for (const sd of this.siphonDrops) {
      sd.t = (sd.t + dt * (0.7 + st.flowGpm * 0.045)) % 1;
      const t = sd.t;
      // Path: bowl throat (0.08, -0.34) -> up S-trap weir (-0.06, -0.15) -> straight DOWN drain (-0.22, -0.49)
      let sx, sy;
      if (t < 0.45) {
        const u = t / 0.45;
        sx = 0.08 - u * 0.14;
        sy = -0.34 + Math.sin(u * Math.PI) * 0.19;
      } else {
        const u = (t - 0.45) / 0.55;
        sx = -0.06 - u * 0.16;
        sy = -0.16 - u * 0.34; // Straight DOWN into floor drain!
      }
      sd.mesh.position.set(sx, sy, (Math.sin(t * 24) * 0.018));
      sd.mesh.visible = st.flowGpm > 6;
    }

    const stageLabel =
      st.phase === 'flushing' ? 'RIM JET SWIRL' :
      st.phase === 'siphon' ? 'SIPHON DOWN DRAIN' : 'BALLCOCK REFILL';

    Object.assign(this.telemetry, {
      flow: st.flowGpm.toFixed(1),
      stage: stageLabel,
      trap: st.phase === 'siphon' ? 'PULLING VACUUM' : 'SEALED 50mm',
      level: `${Math.round(st.cisternLevel)}%`,
      levelBar: st.cisternLevel,
    });
  }
}

// ☕ Italian Espresso Machine Sim — Rotary pump hits 9.0 BAR, twin dark espresso streams pour down into a porcelain cup with rising golden crema, and steam wand billows microfoam!
export class EspressoBrewSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: false });
    this.st = {
      pressure: 9.0,
      brewTemp: 93.2,
      steamTemp: 126.0,
      shotMl: 12,
      pouring: true,
      steaming: true,
      preInfuse: false,
    };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = false;
    this.pfGroups = this.parts(/portafilter/);
    this.wandGroups = this.parts(/steam-wand/);

    // White porcelain demitasse cup + saucer resting on the stainless drip tray under the portafilter spouts (x=0.25, y=-0.30, z=0)
    this.cupGroup = new THREE.Group();
    this.cupGroup.position.set(0.25, -0.31, 0);
    this.env.add(this.cupGroup);

    const porcMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.12, clearcoat: 0.9 });
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.016, 24), porcMat);
    saucer.position.y = 0.008;
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.050, 0.115, 24, 1, true), porcMat);
    cupBody.position.y = 0.068;
    cupBody.material.side = THREE.DoubleSide;
    const cupBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, 0.012, 24), porcMat);
    cupBottom.position.y = 0.016;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 10, 18, Math.PI), porcMat);
    handle.position.set(0.066, 0.072, 0);
    handle.rotation.z = -Math.PI / 2;
    this.cupGroup.add(saucer, cupBody, cupBottom, handle);

    // Rising dark-roast espresso liquid + golden tiger-stripe crema disc inside the cup
    const espressoMat = new THREE.MeshStandardMaterial({ color: 0x291307, roughness: 0.22 });
    const cremaMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
      roughness: 0.32,
    });
    this.espressoLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.08, 22), espressoMat);
    this.espressoLiquid.position.y = 0.052;
    this.cremaLayer = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.058, 0.014, 22), cremaMat);
    this.cremaLayer.position.y = 0.095;
    this.cupGroup.add(this.espressoLiquid, this.cremaLayer);

    // Twin vertical streams of rich dark-amber espresso pouring DOWN from portafilter spouts (y=-0.09) into cup (y=-0.24)
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      emissive: 0xb45309,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    this.streams = [];
    for (const zOff of [-0.026, 0.026]) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0045, 0.17, 12), streamMat);
      s.position.set(0.25, -0.175, zOff);
      this.env.add(s);
      this.streams.push({ mesh: s, zOff });
    }

    // Pour droplets along the twin espresso streams for crisp downward motion
    const dropMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x92400e, emissiveIntensity: 0.5, roughness: 0.15 });
    const dropGeo = new THREE.SphereGeometry(0.0085, 8, 8);
    this.pourDrops = [];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      this.env.add(m);
      this.pourDrops.push({ mesh: m, t: (i / 18), z: (i % 2 === 0 ? -0.026 : 0.026) });
    }

    // Billowing white steam puffs rising from the steam wand tip (x=0.28, y=-0.18, z=0.24)
    this.steamPuffs = [];
    for (let i = 0; i < 12; i++) {
      const puff = makeGlowQuad(0xf8fafc, 0.16, 0.55, false);
      this.env.add(puff);
      this.steamPuffs.push({ mesh: puff, t: i / 12 });
    }

    this.check('pressure');
  }
  onExit() {}
  trigger(name) {
    if (name === 'shot') {
      this.st.pouring = true;
      if (this.st.shotMl >= 58) this.st.shotMl = 4;
      playPop(440);
      this.check('pressure');
      this.check('shot');
      return true;
    }
    if (name === 'steam') {
      this.st.steaming = !this.st.steaming;
      playPop(620);
      this.check('steam');
      return this.st.steaming;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    this.spinFans(dt, 14.0); // Spin internal rotary vane pump!

    if (inp.down) {
      // Pre-infusion at 3.2 bar
      st.pressure = approach(st.pressure, 3.2, dt * 6);
      st.pouring = true;
    } else if (inp.up || st.pouring) {
      st.pressure = approach(st.pressure, 9.0 + Math.sin(this.elapsed * 8) * 0.15, dt * 6);
      this.check('pressure');
    } else {
      st.pressure = approach(st.pressure, 1.5, dt * 4);
    }

    if (inp.boost) {
      st.steaming = true;
      this.check('steam');
    }

    // Advance double espresso extraction (loops smoothly from 6 ml to 60 ml so user always sees espresso pouring down!)
    const pourRate = inp.up ? 14 : 9.5;
    st.shotMl += dt * pourRate;
    if (st.shotMl >= 36) this.check('shot');
    if (st.shotMl >= 60) st.shotMl = 8;

    const fillFrac = clamp(st.shotMl / 60, 0.12, 1.0);
    this.espressoLiquid.scale.y = fillFrac;
    this.espressoLiquid.position.y = 0.018 + 0.04 * fillFrac;
    this.cremaLayer.position.y = 0.022 + 0.08 * fillFrac;
    const cremaScale = 0.85 + 0.15 * fillFrac;
    this.cremaLayer.scale.set(cremaScale, 1, cremaScale);

    // Animate twin espresso streams pouring down
    for (const s of this.streams) {
      const wobble = 1 + Math.sin(this.elapsed * 22 + s.zOff * 40) * 0.12;
      s.mesh.scale.set(wobble, 1, wobble);
    }
    for (const d of this.pourDrops) {
      d.t = (d.t + dt * 2.8) % 1;
      d.mesh.position.set(0.25, -0.09 - d.t * 0.16, d.z);
    }

    // Animate steam wand microfoam plumes
    if (st.steaming) this.check('steam');
    for (const sp of this.steamPuffs) {
      sp.t = (sp.t + dt * (inp.boost ? 1.65 : 1.05)) % 1;
      const p = sp.t;
      sp.mesh.visible = st.steaming;
      sp.mesh.position.set(
        0.29 + Math.sin(p * 8 + this.elapsed * 4) * 0.04,
        -0.18 + p * 0.32,
        0.24 + Math.cos(p * 6 + this.elapsed * 3) * 0.04,
      );
      sp.mesh.scale.setScalar(0.55 + p * 1.45);
      sp.mesh.material.opacity = (1 - p) * (inp.boost ? 0.72 : 0.48);
      sp.mesh.lookAt(this.viewer.camera.position);
    }

    st.brewTemp = 93.0 + Math.sin(this.elapsed * 1.8) * 0.3;
    Object.assign(this.telemetry, {
      pressure: st.pressure.toFixed(1),
      temp: `${st.brewTemp.toFixed(1)}°C`,
      shot: `${Math.round(st.shotMl)} ml`,
      crema: `${Math.round(fillFrac * 100)}%`,
      cremaBar: fillFrac * 100,
    });
  }
}

// 🛗 Traction Passenger Elevator Sim — Hoists glass cab up/down steel rails while counterweight moves oppositely & sheave spins!
export class ElevatorSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: false });
    this.st = { height: 0.25, dir: 1, speed: 4.5, doorsOpen: false, doorTimer: 0 };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = false;
    this.cabGroups = this.parts(/cab|doors/);
    this.cwtGroups = this.parts(/counterweight|ropes/);
    this.govGroups = this.parts(/governor/);
  }
  onExit() {
    for (const g of [...this.cabGroups, ...this.cwtGroups]) g.position.set(0, 0, 0);
  }
  trigger(name) {
    if (name === 'doors') {
      this.st.doorsOpen = !this.st.doorsOpen;
      playPop(480);
      this.check('doors');
      return this.st.doorsOpen;
    }
    if (name === 'express') {
      this.st.dir = this.st.height > 0.6 ? -1 : 1;
      this.st.doorsOpen = false;
      playPop(660);
      return true;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    const maxSpd = inp.boost ? 10.0 : 5.0;
    let v = 0;
    if (inp.up || inp.boost) {
      v = maxSpd;
      st.dir = 1;
      st.doorsOpen = false;
    } else if (inp.down) {
      v = -maxSpd;
      st.dir = -1;
      st.doorsOpen = false;
    } else if (!st.doorsOpen) {
      v = st.dir * 2.8;
    }

    st.height = clamp(st.height + (v * 0.065) * dt, 0, 1);
    if (st.height >= 0.98) {
      st.dir = -1;
      this.check('ascend');
      this.check('doors');
    } else if (st.height <= 0.02) {
      st.dir = 1;
      this.check('descend');
    }
    if (v < -0.5) this.check('descend');
    if (st.height > 0.82) this.check('ascend');

    // Cab moves vertically (-0.20 .. +0.22); counterweight moves in opposite vertical direction!
    const yOff = (st.height - 0.35) * 0.42;
    for (const cg of this.cabGroups) cg.position.y = yOff;
    for (const cw of this.cwtGroups) cw.position.y = -yOff * 0.75;
    this.spinFans(dt, v * 1.8);

    const floors = ['B1', 'L', '5', '12', '24', '38', '50', 'PH'];
    const fIdx = clamp(Math.floor(st.height * (floors.length - 1) + 0.4), 0, floors.length - 1);
    Object.assign(this.telemetry, {
      floor: floors[fIdx],
      speed: `${Math.abs(v).toFixed(1)} m/s`,
      cwt: `${Math.round((1 - st.height) * 100)}% LVL`,
      cable: `${Math.round(st.height * 100)}%`,
      cableBar: st.height * 100,
    });
  }
}

// 🔑 Pin-Tumbler Lock Sim — Slides notched brass key in, aligns all 5 key/driver pins at the shear line, and rotates plug & deadbolt cam!
export class LockSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: false });
    this.st = { keyIn: 1, plugDeg: 0, dir: 1, auto: true };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = false;
    this.keyGroups = this.parts(/key-blade/);
    this.keyPinGroups = this.parts(/key-pins/);
    this.driverPinGroups = this.parts(/driver-pins/);
    this.plugGroups = this.parts(/plug-core/);
    this.camGroups = this.parts(/cam|deadbolt/);
    this.check('insert');
  }
  onExit() {
    for (const g of [...this.keyGroups, ...this.keyPinGroups, ...this.driverPinGroups, ...this.plugGroups, ...this.camGroups]) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  }
  trigger(name) {
    if (name === 'key') {
      this.st.keyIn = this.st.keyIn > 0.5 ? 0 : 1;
      playSnap();
      this.check('insert');
      return this.st.keyIn > 0.5;
    }
    if (name === 'bolt') {
      this.st.plugDeg = this.st.plugDeg > 45 ? 0 : 90;
      playSnap();
      this.check('turn');
      this.check('unlock');
      return true;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    if (inp.up) {
      st.keyIn = approach(st.keyIn, 1, dt * 6);
      st.plugDeg = clamp(st.plugDeg + dt * 110, 0, 90);
    } else if (inp.down) {
      st.plugDeg = clamp(st.plugDeg - dt * 110, 0, 90);
    } else {
      // Continuous demonstration cycle: key slides in -> pins lift to shear line -> plug & deadbolt cam rotate 90°!
      const cyc = (this.elapsed * 0.55) % 4;
      if (cyc < 1) {
        st.keyIn = clamp(cyc, 0, 1);
        st.plugDeg = 0;
      } else if (cyc < 2.5) {
        st.keyIn = 1;
        st.plugDeg = clamp((cyc - 1) * 75, 0, 90);
      } else if (cyc < 3.4) {
        st.keyIn = 1;
        st.plugDeg = clamp(90 - (cyc - 2.5) * 100, 0, 90);
      } else {
        st.keyIn = clamp(1 - (cyc - 3.4) * 1.6, 0.15, 1);
        st.plugDeg = 0;
      }
    }

    if (st.keyIn > 0.85) this.check('insert');
    if (st.plugDeg > 35) this.check('turn');
    if (st.plugDeg > 75) this.check('unlock');

    // Slide key along X axis; lift pins vertically as bitting ramps pass underneath
    const slideX = -(1 - st.keyIn) * 0.34;
    for (const kg of this.keyGroups) kg.position.x = slideX;
    const pinLift = Math.sin(st.keyIn * Math.PI * 0.5) * 0.042 + (inp.boost ? Math.sin(this.elapsed * 16) * 0.02 : 0);
    for (const kp of this.keyPinGroups) kp.position.y = pinLift;
    for (const dp of this.driverPinGroups) dp.position.y = pinLift;

    const rad = (st.plugDeg * Math.PI) / 180;
    for (const pg of this.plugGroups) pg.rotation.x = rad * 0.35;
    for (const cg of this.camGroups) {
      cg.rotation.x = rad;
      cg.position.z = (st.plugDeg / 90) * 0.08;
    }

    const aligned = Math.round(st.keyIn * 5);
    Object.assign(this.telemetry, {
      pins: `${aligned} / 5`,
      angle: `${Math.round(st.plugDeg)}°`,
      state: aligned === 5 ? 'SHEAR ALIGNED' : 'LOCKED',
      bolt: `${Math.round((st.plugDeg / 90) * 100)}%`,
      boltBar: (st.plugDeg / 90) * 100,
    });
  }
}

// ⌚ Horology Sim — Winds mainspring/weights, oscillates balance wheel at 28,800 BPH or swings grandfather pendulum, sweeps hands & chimes!
export class HorologySim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: false });
    this.st = { reserve: 78, chronoRun: true, chronoSec: 0, chimeGlow: 0 };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = false;
    this.pendulumGroups = this.parts(/pendulum/);
    this.balanceGroups = this.parts(/balance|escapement/);
    this.handGroups = this.parts(/hands|dial/);
    this.weightGroups = this.parts(/weights|barrel|mainspring/);
    this.chimeGroups = this.parts(/chime|tubes/);
    this.isClock = String(this.viewer.currentObject?.activeModelId || '').includes('clock');
    this.check('chrono');
  }
  onExit() {
    for (const g of [...this.pendulumGroups, ...this.balanceGroups, ...this.weightGroups, ...this.chimeGroups]) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  }
  trigger(name) {
    if (name === 'chrono') {
      this.st.chronoRun = !this.st.chronoRun;
      playSnap();
      this.check('chrono');
      return this.st.chronoRun;
    }
    if (name === 'chime') {
      this.st.chimeGlow = 1.0;
      playPop(520);
      this.check('chime');
      return true;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    const speedMult = inp.boost ? 6.0 : 1.0;
    if (inp.up) {
      st.reserve = Math.min(100, st.reserve + dt * 28);
      if (st.reserve >= 90) this.check('wind');
    } else {
      st.reserve = Math.max(35, st.reserve - dt * 0.4);
    }
    if (inp.down) st.chronoSec = 0;
    if (inp.boost) this.check('chime');
    if (st.chronoRun) st.chronoSec = (st.chronoSec + dt * speedMult) % 60;
    st.chimeGlow = Math.max(0, st.chimeGlow - dt * 1.5);

    // Spin gear train wheels & hands via driveCranks
    this.spinFans(dt, 2.2 * speedMult);

    // Swing grandfather clock pendulum smoothly side-to-side around top suspension spring
    const swingAngle = Math.sin(this.elapsed * 3.14159 * speedMult) * 0.14;
    for (const pg of this.pendulumGroups) {
      pg.rotation.x = swingAngle;
    }

    // Oscillate Swiss watch balance wheel back-and-forth rapidly
    const balAngle = Math.sin(this.elapsed * 22 * speedMult) * 0.35;
    for (const bg of this.balanceGroups) {
      bg.rotation.y = balAngle;
    }

    Object.assign(this.telemetry, {
      rate: this.isClock ? '1.0 Hz (60 BPM)' : '28,800 BPH (4 Hz)',
      chrono: `${st.chronoSec.toFixed(1)} s`,
      escapement: this.isClock ? 'DEADBEAT ANCHOR' : 'SWISS LEVER',
      reserve: `${Math.round(st.reserve)}%`,
      reserveBar: st.reserve,
    });
  }
}

// 🚢 Surface Ship Sim — Sails across an animated ocean wave surface with a foamy V-bow wake & twin stern propeller wash (no underwater submarine diving!)
export class SurfaceShipSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true });
    this.hideFloor = true;
    this.st = { knots: 18.5, heading: 0, yaw: 0, lights: true };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = true;

    // Sparkling deep-blue ocean water plane at waterline (y = -0.26)
    const waterTex = makeCanvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#0369a1');
      g.addColorStop(0.5, '#0284c7');
      g.addColorStop(1, '#075985');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 28; i++) {
        const y = (i / 28) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.33, y + 6, w * 0.66, y - 6, w, y);
        ctx.stroke();
      }
    });
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(8, 8);
    this.waterTex = waterTex;

    const oceanMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x0ea5e9,
      roughness: 0.18,
      metalness: 0.25,
      transparent: true,
      opacity: 0.86,
    });
    this.ocean = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), oceanMat);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -0.26;
    this.env.add(this.ocean);

    // Foamy white V-shaped bow wake & stern propeller wash ribbons
    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.68, side: THREE.DoubleSide });
    this.wakeStrips = [];
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.16), wakeMat);
      strip.rotation.x = -Math.PI / 2;
      strip.rotation.z = s * 0.22;
      strip.position.set(-0.2, -0.248, s * 0.52);
      this.env.add(strip);
      this.wakeStrips.push({ mesh: strip, s });
    }
    this.sternWash = [];
    for (let i = 0; i < 16; i++) {
      const foam = makeGlowQuad(0xe0f2fe, 0.36, 0.55, false);
      foam.rotation.x = -Math.PI / 2;
      this.env.add(foam);
      this.sternWash.push({ mesh: foam, t: i / 16 });
    }
  }
  onExit() {
    this.viewer.headlightGroup.visible = false;
    this.viewer.rootGroup.position.set(0, 0, 0);
    this.viewer.rootGroup.rotation.set(0, 0, 0);
  }
  trigger(name) {
    if (name === 'horn') {
      playHorn();
      this.check('horn');
      return true;
    }
    if (name === 'lights') {
      this.st.lights = !this.st.lights;
      this.viewer.headlightGroup.visible = this.st.lights;
      this.check('horn');
      return this.st.lights;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    const maxKt = inp.boost ? 32.0 : 23.5;
    if (inp.up || inp.boost) st.knots = Math.min(maxKt, st.knots + (inp.boost ? 11 : 6.5) * dt);
    else if (inp.down) st.knots = Math.max(0, st.knots - 10 * dt);
    else st.knots = approach(st.knots, 18.5, dt * 1.5);

    if (st.knots >= 20) this.check('sail');
    const turn = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (turn !== 0) {
      st.yaw = clamp(st.yaw - turn * dt * 0.45, -0.38, 0.38);
      st.heading = (st.heading + turn * dt * 28 + 360) % 360;
      this.check('helm');
    } else {
      st.yaw = approach(st.yaw, 0, dt * 2);
    }

    // Scroll ocean surface texture & stern foam wash backward
    const spdNorm = st.knots / 24;
    this.waterTex.offset.x = (this.waterTex.offset.x + dt * spdNorm * 0.85) % 1;
    this.spinFans(dt, 4.5 + spdNorm * 14);

    for (const sw of this.sternWash) {
      sw.t = (sw.t + dt * (0.45 + spdNorm * 0.95)) % 1;
      const p = sw.t;
      sw.mesh.position.set(-1.95 - p * 3.2, -0.245, Math.sin(p * 10 + this.elapsed * 4) * (0.08 + p * 0.25));
      sw.mesh.scale.setScalar(0.65 + p * 1.6);
      sw.mesh.material.opacity = (1 - p) * 0.55 * clamp(spdNorm, 0.2, 1.2);
    }

    // Gentle ocean swell pitch & roll
    const pitch = Math.sin(this.elapsed * 1.6) * 0.022;
    const roll = Math.cos(this.elapsed * 1.2) * 0.018 - turn * 0.03;
    this.viewer.rootGroup.position.y = Math.sin(this.elapsed * 1.6) * 0.018;
    this.viewer.rootGroup.rotation.set(roll, st.yaw, pitch);

    const rpm = Math.round(st.knots * 6.2);
    const pwrPct = clamp((st.knots / 32) * 100, 5, 100);
    Object.assign(this.telemetry, {
      speed: st.knots.toFixed(1),
      heading: `${String(Math.round(st.heading)).padStart(3, '0')}°`,
      rpm: `${rpm} RPM`,
      power: `${Math.round(pwrPct)}%`,
      powerBar: pwrPct,
      soundRpm: 720 + st.knots * 42,
      soundThrottle: spdNorm,
    });
  }
}

// 🏗️ Construction Excavator, Tower Crane & Combine Harvester Sim — Slews upper turret/jib or combine auger, articulates hydraulic boom/stick/bucket, or spins harvester reel & wheels without highway road lines!
export class ExcavatorCraneSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true });
    const id = String(viewer.currentObject?.activeModelId || viewer.currentModel?.id || '').toLowerCase();
    this.isCombine = /combine|harvester/i.test(id);
    this.isCrane = /crane|liebherr/i.test(id);
    this.st = { slewDeg: 0, boomPhase: 0, pressure: 320, grainPct: 42, autoDig: true };
  }
  onEnter() {
    this.viewer.roadLinesGroup.visible = false;
    this.viewer.headlightGroup.visible = true;
    if (this.isCombine) {
      this.slewGroups = this.parts(/auger/);
      this.boomGroups = this.parts(/header|feederhouse/);
      this.stickGroups = this.parts(/sieve|cleaning/);
      this.bucketGroups = [];
    } else {
      this.slewGroups = this.parts(/house|turret|slewing|jib|counter-jib|cab/);
      this.boomGroups = this.parts(/boom/);
      this.stickGroups = this.parts(/stick|dipper|trolley|hook/);
      this.bucketGroups = this.parts(/bucket/);
    }
  }
  onExit() {
    this.viewer.headlightGroup.visible = false;
    for (const g of [...this.slewGroups, ...this.boomGroups, ...this.stickGroups, ...this.bucketGroups]) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  }
  trigger(name) {
    if (name === 'bucket') {
      this.st.autoDig = !this.st.autoDig;
      playPop(380);
      this.check('dig');
      return this.st.autoDig;
    }
    if (name === 'lights') {
      this.viewer.headlightGroup.visible = !this.viewer.headlightGroup.visible;
      return this.viewer.headlightGroup.visible;
    }
    return false;
  }
  onUpdate(dt) {
    const st = this.st, inp = this.inputs;
    const turn = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (turn !== 0) {
      st.slewDeg = clamp(st.slewDeg + turn * dt * 48, -65, 65);
      this.check('slew');
    } else {
      st.slewDeg = Math.sin(this.elapsed * 0.65) * 28;
      if (Math.abs(st.slewDeg) > 18) this.check('slew');
    }

    const boostMult = inp.boost ? 1.55 : 1.0;
    if (inp.up || inp.down || inp.boost) {
      st.boomPhase += dt * (inp.up ? 2.2 : inp.down ? -2.2 : 3.0);
      this.check('boom');
      this.check('dig');
    } else {
      st.boomPhase += dt * 1.35;
      if (this.elapsed > 1.2) this.check('boom');
      if (this.elapsed > 2.4) this.check('dig');
    }

    this.spinFans(dt, 3.8 * boostMult);
    if (this.isCombine) {
      for (const w of this.viewer.driveWheels) w.rotation.z -= dt * 3.2 * boostMult;
      const augerRad = ((Math.abs(st.slewDeg) / 65) * 0.42);
      for (const sg of this.slewGroups) sg.rotation.y = augerRad;
      const hdrFloat = Math.sin(st.boomPhase) * 0.025;
      for (const bg of this.boomGroups) bg.position.y = hdrFloat;
      for (const stg of this.stickGroups) stg.position.x = Math.sin(this.elapsed * 22) * 0.014;
      st.grainPct = (st.grainPct + dt * 7.5 * boostMult) % 100;
      const rotorRpm = Math.round(920 + (inp.boost ? 210 : Math.sin(st.boomPhase) * 45));
      const ratePct = clamp(Math.round(74 * boostMult), 0, 100);
      Object.assign(this.telemetry, {
        pressure: `${rotorRpm}`,
        slew: `${Math.round(Math.abs(st.slewDeg) * 1.3)}°`,
        load: `${Math.round(st.grainPct)}% bu`,
        cycle: `${ratePct}%`,
        cycleBar: ratePct,
        soundRpm: 1250 + rotorRpm * 0.45,
        soundThrottle: 0.55 * boostMult,
      });
      return;
    }

    const slewRad = (st.slewDeg * Math.PI) / 180;
    for (const sg of this.slewGroups) sg.rotation.y = slewRad * 0.35;
    const boomAng = Math.sin(st.boomPhase) * (this.isCrane ? 0.015 : 0.12);
    for (const bg of this.boomGroups) bg.rotation.z = boomAng;
    if (this.isCrane) {
      for (const stg of this.stickGroups) stg.position.y = Math.sin(st.boomPhase) * 0.14;
    } else {
      for (const stg of this.stickGroups) stg.rotation.z = -boomAng * 1.4;
      for (const bkg of this.bucketGroups) bkg.rotation.z = Math.cos(st.boomPhase) * 0.25;
    }

    const cycPct = Math.round(((Math.sin(st.boomPhase) + 1) * 0.5) * 100);
    st.pressure = 285 + Math.round(Math.abs(Math.cos(st.boomPhase)) * 65);
    Object.assign(this.telemetry, {
      pressure: `${st.pressure}`,
      slew: `${Math.round(st.slewDeg)}°`,
      load: this.isCrane ? '12.0 t' : '18.4 t',
      cycle: `${cycPct}%`,
      cycleBar: cycPct,
      soundRpm: 1150 + cycPct * 6,
      soundThrottle: 0.45,
    });
  }
}

// 🤖 Precision Robotics & Planetary Rover Sim — Models 6-axis industrial articulated arm welding, Mars Perseverance 6-wheel regolith traverse + SuperCam LIBS rock laser, and agile quadruped trotting gait + spinning 3D LiDAR without highway road lines!
export class RoboticsSim extends BaseSim {
  constructor(viewer) {
    const id = String(viewer.currentObject?.activeModelId || viewer.currentModel?.id || '').toLowerCase();
    const isRover = /mars|perseverance|rover/i.test(id);
    const isArm = /kuka|6axis|industrial-arm/i.test(id);
    super(viewer, { engineSound: true, turbine: true });
    this.isRover = isRover;
    this.isArm = isArm;
    this.isQuad = !isRover && !isArm;
    this.st = { phase: 0, slewDeg: 0, toolPulse: 0, battery: 96, lights: true };
  }
  onEnter() {
    const v = this.viewer;
    v.roadLinesGroup.visible = false;
    v.headlightGroup.visible = false;
    const box = new THREE.Box3().setFromObject(v.rootGroup);
    const floorY = v.stageFloorGroup.position.y;

    this.baseGroups = this.parts(/slew-base|mast|supercam/);
    this.shoulderGroups = this.parts(/lower-link|dorsal-manipulator|robotic-arm/);
    this.forearmGroups = this.parts(/upper-cantilever|wrist-triad|end-effector/);
    this.legGroups = this.parts(/articulated-legs|planetary-actuator-hips/);

    if (this.isRover) {
      // Martian Jezero Crater iron-oxide regolith terrain patch + target basalt rock for LIBS laser
      const marsMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.92, metalness: 0.06 });
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.04, 36), marsMat);
      pad.position.set(0, floorY + 0.02, 0);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 }));
      rock.position.set(box.max.x + 0.42, floorY + 0.14, 0.12);
      this.laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 1.35, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 }),
      );
      this.laserBeam.position.set(box.max.x - 0.05, (box.min.y + box.max.y) * 0.62, 0.06);
      this.laserBeam.rotation.z = Math.PI / 2 - 0.42;
      this.laserBeam.visible = false;
      this.toolGlow = makeGlowQuad(0xf97316, 0.55, 0.9, true);
      this.toolGlow.position.set(rock.position.x, rock.position.y + 0.06, rock.position.z);
      this.toolGlow.visible = false;
      this.env.add(pad, rock, this.laserBeam, this.toolGlow);
    } else {
      this.toolGlow = makeGlowQuad(this.isArm ? 0x38bdf8 : 0x22c55e, 0.72, 0.9, true);
      this.toolGlow.position.set(box.max.x * 0.78, (box.min.y + box.max.y) * 0.55, 0);
      this.toolGlow.visible = false;
      this.env.add(this.toolGlow);
    }
  }
  onExit() {
    const v = this.viewer;
    v.rootGroup.position.set(0, 0, 0);
    v.rootGroup.rotation.set(0, 0, 0);
    for (const g of [...this.baseGroups, ...this.shoulderGroups, ...this.forearmGroups, ...this.legGroups]) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  }
  trigger(name) {
    if (name === 'tool') {
      this.st.toolPulse = 1.1;
      playPop(660);
      this.check('tool');
      return true;
    }
    if (name === 'lights') {
      this.st.lights = !this.st.lights;
      this.viewer.headlightGroup.visible = this.st.lights && !this.isArm;
      return this.st.lights;
    }
    return false;
  }
  onUpdate(dt) {
    const v = this.viewer, st = this.st, inp = this.inputs;
    const speedMult = inp.boost ? 1.85 : inp.up ? 1.35 : inp.down ? -0.85 : 1.0;
    st.phase += dt * 2.1 * speedMult;
    if (Math.abs(st.phase) > 1.2) this.check('move');

    const turn = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (turn !== 0) {
      st.slewDeg = clamp(st.slewDeg + turn * dt * 55, -75, 75);
      this.check('slew');
    } else {
      st.slewDeg = Math.sin(this.elapsed * 0.85) * 32;
      if (Math.abs(st.slewDeg) > 18) this.check('slew');
    }

    if (inp.space) this.trigger('tool');
    st.toolPulse = Math.max(0, st.toolPulse - dt);
    st.battery = clamp(st.battery - dt * 0.04, 18, 100);
    this.spinFans(dt, 7.5 * Math.abs(speedMult));

    const slewRad = (st.slewDeg * Math.PI) / 180;
    for (const bg of this.baseGroups) bg.rotation.y = slewRad * 0.45;
    for (const sg of this.shoulderGroups) sg.rotation.z = Math.sin(st.phase) * 0.14;
    for (const fg of this.forearmGroups) fg.rotation.z = -Math.cos(st.phase * 1.2) * 0.18;

    if (this.isRover) {
      for (const w of v.driveWheels) w.rotation.z -= dt * 2.2 * speedMult;
      v.rootGroup.rotation.z = Math.sin(st.phase * 1.4) * 0.012;
      const firing = st.toolPulse > 0 || (Math.sin(this.elapsed * 1.8) > 0.86);
      if (firing && this.elapsed > 2.0) this.check('tool');
      this.laserBeam.visible = firing;
      this.toolGlow.visible = firing;
      if (firing) this.toolGlow.lookAt(v.camera.position);
    } else if (this.isQuad) {
      const trot = Math.sin(st.phase * 3.2);
      v.rootGroup.position.y = Math.abs(trot) * 0.032;
      v.rootGroup.rotation.z = trot * 0.025;
      v.rootGroup.rotation.y = slewRad * 0.25;
      for (const lg of this.legGroups) lg.rotation.z = trot * 0.08;
      this.toolGlow.visible = st.toolPulse > 0;
      if (this.toolGlow.visible) this.toolGlow.lookAt(v.camera.position);
    } else {
      const welding = st.toolPulse > 0 || (Math.sin(this.elapsed * 2.4) > 0.72);
      if (welding && this.elapsed > 2.0) this.check('tool');
      this.toolGlow.visible = welding;
      if (welding) {
        this.toolGlow.scale.setScalar(0.85 + Math.sin(this.elapsed * 45) * 0.22);
        this.toolGlow.lookAt(v.camera.position);
      }
    }

    const pwr = Math.round(clamp(58 + Math.abs(Math.sin(st.phase)) * 28 + (inp.boost ? 14 : 0), 15, 100));
    const torqueNm = this.isArm ? Math.round(310 + pwr * 2.4) : this.isRover ? Math.round(140 + pwr * 1.1) : Math.round(45 + pwr * 0.65);
    const poseLabel = this.isArm
      ? `J1 ${Math.round(st.slewDeg)}°`
      : this.isRover
        ? (this.laserBeam?.visible ? 'LIBS ZAP' : `HDG ${Math.round((st.slewDeg + 360) % 360)}°`)
        : (inp.boost ? 'SPRINT' : 'TROT 3Hz');

    Object.assign(this.telemetry, {
      power: pwr,
      pose: poseLabel,
      torque: `${torqueNm} Nm`,
      battery: `${Math.round(st.battery)}%`,
      batteryBar: st.battery,
      soundRpm: 720 + pwr * 18,
      soundThrottle: pwr / 100,
    });
  }
}

