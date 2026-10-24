// 🌊 Take It for a Dive! — surfaced in waves → flood ballast → dive to test depth → blow ballast & surface.
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, wrapDeg } from './base.js';
import { buildWater, animateWater, buildSeabed, buildBubbles, emitBubbles, updateBubbles, buildMasts } from './dive_env.js';

const WORLD_PER_M = 0.02; // visual units per metre of depth
const SHALLOW = new THREE.Color(0x2aa7e0);
const DEEP = new THREE.Color(0x02101f);

export class DiveSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: true });
    this.hideFloor = true;
    const id = viewer.currentObject?.activeModelId || '';
    this.perf = /deep-sea/i.test(id)
      ? { vMax: 3.5, testDepth: 240, crush: 11000 }
      : /nautilus/i.test(id) ? { vMax: 5, testDepth: 60, crush: 150 } : { vMax: 25, testDepth: 240, crush: 490 };
    this.st = {
      depth: 0, speed: 0, heading: 90, ballast: 0, throttle: 0, planes: 0, rudder: 0, pitch: 0, roll: 0,
      lightsOn: false, mastUp: true, mastAnim: 1, reachedTest: false, creak: false,
    };
    this.bubbleTimer = 0;
  }

  onEnter() {
    const v = this.viewer;
    const box = new THREE.Box3().setFromObject(v.rootGroup);
    this.box = box;
    this.waterY = box.min.y + (box.max.y - box.min.y) * 0.62;
    this.water = buildWater(this.env, this.waterY);
    this.seabed = buildSeabed(this.env, this.waterY - (this.perf.testDepth * 1.6) * WORLD_PER_M);
    this.bubbles = buildBubbles(this.env);
    this.masts = buildMasts(v, this.parts(/sail|conning|boarding/));
    this.rudderGroups = this.parts(/rudder|planes|tail/);
    this.sternPos = new THREE.Vector3(box.min.x + 0.1, (box.min.y + box.max.y) / 2, 0);
    this.prevBg = v.scene.background;
    v.headlightGroup.position.x = box.max.x - 3.55 + 0.15;
    v.headlightGroup.visible = false;
    v.desiredSpherical.theta = 0.9;
    v.desiredSpherical.phi = 1.18;
    v.desiredSpherical.radius = Math.max(4.0, v.defaultSpherical.radius * 1.02);
  }

  onExit() {
    const v = this.viewer;
    v.scene.fog = null;
    v.scene.background = this.prevBg || null;
    v.headlightGroup.visible = false;
    v.headlightGroup.position.x = 0;
    for (const m of this.masts) v.rootGroup.remove(m);
    for (const g of this.rudderGroups) g.rotation.set(0, 0, 0);
  }

  trigger(name) {
    if (name === 'lights') {
      this.st.lightsOn = !this.st.lightsOn;
      return this.st.lightsOn;
    }
    if (name === 'periscope') {
      this.st.mastUp = !this.st.mastUp;
      return this.st.mastUp;
    }
    return false;
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const inp = this.inputs;
    const p = this.perf;

    // Throttle → speed; ballast flood/blow; planes & rudder
    st.throttle = inp.up ? clamp(st.throttle + dt * 0.6, 0, 1) : clamp(st.throttle - dt * 0.25, 0, 1);
    st.speed = approach(st.speed, st.throttle * p.vMax * (inp.boost ? 1.15 : 1), dt * 0.5);
    if (inp.down) st.ballast = clamp(st.ballast + dt * 28, 0, 100);
    if (inp.space) st.ballast = clamp(st.ballast - dt * 40, 0, 100);
    st.planes = approach(st.planes, (inp.pitchDown ? 1 : 0) - (inp.pitchUp ? 1 : 0), dt * 3);
    st.rudder = approach(st.rudder, (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dt * 3);

    // Vertical: negative buoyancy from ballast + hydrodynamic dive planes (need way on)
    const buoyancy = ((st.ballast - 45) / 55) * 2.2;
    const planeEffect = st.planes * 1.8 * Math.min(1, st.speed / Math.max(1, p.vMax * 0.3));
    const vSpeed = buoyancy + planeEffect; // m/s downward
    st.depth = clamp(st.depth + vSpeed * dt, 0, p.crush * 0.98);
    st.heading = wrapDeg(st.heading + st.rudder * 14 * Math.min(1, st.speed / 4) * dt);
    const stress = (st.depth / p.crush) * 100;
    st.creak = stress > 80;

    if (st.depth > 50) this.check('dive');
    if (st.depth >= p.testDepth) { st.reachedTest = true; this.check('testdepth'); }
    if (st.reachedTest && st.depth < 1) this.check('surface');

    // Masts auto-retract below periscope depth
    if (st.depth > 20 && st.mastUp) st.mastUp = false;
    st.mastAnim = approach(st.mastAnim, st.mastUp ? 1 : 0, dt * 1.5);
    for (const m of this.masts) {
      m.position.y = m.userData.topY - (1 - st.mastAnim) * 0.46;
      m.visible = st.mastAnim > 0.08;
    }
    for (const g of this.rudderGroups) {
      g.rotation.y = -st.rudder * 0.25;
      g.rotation.z = -st.planes * 0.22;
    }
    this.spinFans(dt, 2 + st.throttle * 26);

    // World: water rises above the boat as it dives; fog/background fade blue-green → black
    const rel = st.depth * WORLD_PER_M;
    this.water.water.position.y = this.waterY + rel;
    this.seabed.position.y = this.waterY + rel - p.testDepth * 1.6 * WORLD_PER_M;
    animateWater(this.water, this.elapsed, st.depth < 2 ? 0.06 : 0.03);
    const under = clamp((rel - 0.6) / 0.8, 0, 1); // camera submerged factor
    const deepT = clamp(st.depth / Math.max(200, p.testDepth * 1.5), 0, 1);
    if (under > 0.02) {
      const col = SHALLOW.clone().lerp(DEEP, deepT);
      v.scene.background = col;
      v.scene.fog = new THREE.FogExp2(col.getHex(), 0.03 + deepT * 0.07);
    } else {
      v.scene.background = this.prevBg || null;
      v.scene.fog = null;
    }
    // Bubbles from the pump-jet and from ballast vents
    this.bubbleTimer += dt;
    if (this.bubbleTimer > 0.08) {
      this.bubbleTimer = 0;
      const stern = this.sternPos.clone().applyMatrix4(v.rootGroup.matrixWorld);
      if (st.throttle > 0.05 && rel > 0.2) emitBubbles(this.bubbles, stern, 1 + Math.round(st.throttle * 2), 0.25);
      if ((inp.down || inp.space) && rel > 0.2) {
        const vent = new THREE.Vector3(0, this.box.max.y - 0.1, 0).applyMatrix4(v.rootGroup.matrixWorld);
        emitBubbles(this.bubbles, vent, 3, 1.2);
      }
    }
    updateBubbles(this.bubbles, dt, this.water.water.position.y, v.camera, st.speed * 0.05);
    v.headlightGroup.visible = st.lightsOn;

    // Pose: dive-plane pitch, rudder roll, surface bobbing, hull-creak shudder near crush depth
    const targetPitch = -st.planes * 0.18 - clamp(vSpeed / 3, -1, 1) * 0.08;
    st.pitch = approach(st.pitch, targetPitch, dt * 2);
    st.roll = approach(st.roll, -st.rudder * 0.1 * Math.min(1, st.speed / 5), dt * 2);
    const bob = st.depth < 2 ? Math.sin(this.elapsed * 1.3) * 0.045 : 0;
    const shudder = st.creak ? (Math.random() - 0.5) * 0.01 : 0;
    v.rootGroup.rotation.set(st.roll + bob * 0.4, 0, st.pitch + shudder);
    v.rootGroup.position.y = bob + shudder;

    Object.assign(this.telemetry, {
      depth: Math.round(st.depth),
      speed: st.speed.toFixed(1),
      heading: String(Math.round(st.heading)).padStart(3, '0'),
      ballast: Math.round(st.ballast),
      ballastBar: st.ballast,
      stress: Math.round(stress),
      warning: st.creak ? '⚠️ HULL CREAKING — near crush depth! Blow ballast (Space)!' : '',
      soundRpm: 900 + st.throttle * 4000,
      soundThrottle: st.throttle * 0.6,
    });
  }
}
