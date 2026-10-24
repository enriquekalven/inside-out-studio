// ✈️ Take It for a Flight! — runway roll → rotate → climb, gear retraction, control surfaces, nav lights.
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, wrapDeg } from './base.js';
import { buildSky, buildGround, buildClouds, scrollGround, scrollClouds } from './flight_env.js';

const KT_TO_FPM = 101.3;
const WORLD_PER_FT = 0.0025; // visual descent of the ground per foot of altitude

export class FlightSim extends BaseSim {
  constructor(viewer) {
    const id = viewer.currentObject?.activeModelId || '';
    const isProp = /cessna/i.test(id);
    super(viewer, { engineSound: true, turbine: !isProp });
    this.hideFloor = true;
    this.perf = isProp
      ? { vMax: 125, vR: 55, accel: 9 }
      : /f22|fighter/i.test(id) ? { vMax: 760, vR: 150, accel: 42 } : { vMax: 470, vR: 140, accel: 22 };
    this.st = {
      speed: 0, altitude: 0, vs: 0, heading: 270, throttle: 0, pitch: 0, bank: 0,
      onGround: true, gearDown: true, gearAnim: 0, tookOff: false, lightsOn: true, flap: 0.3,
    };
  }

  onEnter() {
    const v = this.viewer;
    buildSky(this.env);
    this.groundInfo = buildGround(this.env, v.stageFloorGroup.position.y);
    this.clouds = buildClouds(this.env);
    this.gearGroups = this.parts(/gear/).map((g) => ({ g, baseY: g.position.y, baseScale: g.scale.clone() }));
    this.flapGroups = this.parts(/flap|slat|aileron/);
    this.tailGroups = this.parts(/tail|empennage/);
    this.lights = this._buildNavLights();
    v.headlightGroup.visible = true;
    v.desiredSpherical.theta = 2.35;
    v.desiredSpherical.phi = 1.22;
    v.desiredSpherical.radius = Math.max(4.2, v.defaultSpherical.radius * 1.05);
  }

  onExit() {
    const v = this.viewer;
    v.headlightGroup.visible = false;
    for (const { g, baseY, baseScale } of this.gearGroups) {
      g.visible = true;
      g.position.y = baseY;
      g.scale.copy(baseScale);
    }
    for (const g of [...this.flapGroups, ...this.tailGroups]) g.rotation.set(0, 0, 0);
  }

  _buildNavLights() {
    const box = new THREE.Box3().setFromObject(this.viewer.rootGroup);
    const mk = (color) => new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color }));
    const red = mk(0xff2d2d);
    red.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, box.max.z);
    const green = mk(0x22ff55);
    green.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, box.min.z);
    const strobe = mk(0xffffff);
    strobe.position.set(box.min.x + 0.1, box.max.y, 0);
    this.viewer.rootGroup.add(red, green, strobe);
    return [red, green, strobe];
  }

  trigger(name) {
    if (name === 'gear') {
      this.st.gearDown = !this.st.gearDown;
      return !this.st.gearDown;
    }
    if (name === 'lights') {
      this.st.lightsOn = !this.st.lightsOn;
      return this.st.lightsOn;
    }
    return false;
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const inp = this.inputs;
    const p = this.perf;

    // Throttle & brakes
    if (inp.up) st.throttle = clamp(st.throttle + dt * 0.55, 0, 1);
    else if (inp.down) st.throttle = clamp(st.throttle - dt * 0.9, 0, 1);
    const brake = inp.down && st.onGround ? 1 : 0;
    const boost = inp.boost ? 1.25 : 1;

    // Airspeed (kt): thrust minus drag (quadratic) minus wheel brakes
    const drag = (st.speed / p.vMax) ** 2 * p.accel * 1.05 + 0.6;
    st.speed = clamp(st.speed + (st.throttle * p.accel * boost - drag - brake * 25) * dt, 0, p.vMax * boost);

    // Pitch: manual input, otherwise auto-rotate above Vr and settle to a gentle climb/glide
    let pitchTarget = 0;
    if (inp.pitchUp) pitchTarget = 0.26;
    else if (inp.pitchDown) pitchTarget = st.onGround ? 0 : -0.2;
    else if (!st.onGround) pitchTarget = st.throttle > 0.4 ? 0.06 : -0.05;
    else if (st.speed > p.vR * 1.05) pitchTarget = 0.16;
    if (!st.onGround && st.speed < p.vR * 0.82) pitchTarget = Math.min(pitchTarget, -0.14); // stall nose-drop
    if (st.onGround && st.speed < p.vR * 0.9) pitchTarget = Math.min(pitchTarget, 0.02);
    st.pitch = approach(st.pitch, pitchTarget, dt * 2.2);

    // Bank & heading
    const bankTarget = (inp.right ? 0.55 : 0) - (inp.left ? 0.55 : 0);
    st.bank = approach(st.bank, st.onGround ? 0 : bankTarget, dt * 2.5);
    const yawRate = st.onGround ? ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * 12 * Math.min(1, st.speed / 20) : st.bank * 32;
    st.heading = wrapDeg(st.heading + yawRate * dt);

    // Vertical motion
    const lift = st.speed * Math.sin(st.pitch) * KT_TO_FPM;
    if (st.onGround) {
      st.vs = 0;
      if (st.pitch > 0.08 && st.speed > p.vR) {
        st.onGround = false;
        st.tookOff = true;
        this.check('takeoff');
      }
    } else {
      st.vs = approach(st.vs, lift - (st.speed < p.vR * 0.82 ? 900 : 0), dt * 3);
      st.altitude += (st.vs / 60) * dt;
      if (st.altitude <= 0) {
        st.altitude = 0;
        st.onGround = true;
        st.gearDown = true;
        if (st.tookOff && st.vs > -700) this.check('land');
        st.vs = 0;
      }
    }
    // Landing gear: auto-up after liftoff, auto-down on approach
    if (!st.onGround && st.altitude > 180 && st.gearDown && !inp.pitchDown) st.gearDown = false;
    if (!st.onGround && st.altitude < 320 && st.vs < 0 && !st.gearDown) st.gearDown = true;
    st.gearAnim = approach(st.gearAnim, st.gearDown ? 0 : 1, dt * 1.6);
    if (st.gearAnim > 0.97) this.check('gearup');
    for (const { g, baseY, baseScale } of this.gearGroups) {
      g.position.y = baseY + st.gearAnim * 0.3;
      g.scale.set(baseScale.x, baseScale.y * Math.max(0.05, 1 - st.gearAnim), baseScale.z);
      g.visible = st.gearAnim < 0.98;
    }
    // Control surfaces & fans
    st.flap = approach(st.flap, st.speed < p.vR * 1.6 ? 0.3 : 0, dt * 1.2);
    for (const g of this.flapGroups) g.rotation.z = -st.flap * 0.4 + (st.bank * 0.1);
    for (const g of this.tailGroups) {
      g.rotation.z = -(pitchTarget - st.pitch) * 0.35;
      g.rotation.y = (st.bank + (st.onGround ? yawRate / 40 : 0)) * 0.12;
    }
    this.spinFans(dt, 6 + st.throttle * 60 + st.speed * 0.05);

    // World motion: ground + clouds scroll aft and sink as we climb; lights blink
    const dist = (st.speed / 60) * 2.8 * dt;
    scrollGround(this.groundInfo, dist);
    scrollClouds(this.clouds, dist * 0.6, v.camera);
    const sink = -st.altitude * WORLD_PER_FT;
    this.groundInfo.ground.position.y = v.stageFloorGroup.position.y + Math.max(-30, sink);
    for (const c of this.clouds) c.position.y = Math.max(-28, c.userData.baseY ?? (c.userData.baseY = c.position.y)) + sink * 0.35;
    const strobeOn = st.lightsOn && Math.sin(this.elapsed * 9) > 0.7;
    this.lights[0].visible = this.lights[1].visible = st.lightsOn;
    this.lights[2].visible = strobeOn;
    v.headlightGroup.visible = st.lightsOn && st.gearAnim < 0.5;

    // Pose the aircraft (nose +X): pitch about Z, bank about X, runway rumble
    v.rootGroup.rotation.set(-st.bank * 0.9, 0, st.pitch);
    v.rootGroup.position.y = st.onGround ? Math.sin(this.elapsed * 40) * 0.003 * Math.min(1, st.speed / 40) : 0;

    Object.assign(this.telemetry, {
      airspeed: Math.round(st.speed),
      altitude: Math.round(st.altitude),
      vs: Math.round(st.vs / 10) * 10,
      heading: String(Math.round(st.heading)).padStart(3, '0'),
      throttle: Math.round(st.throttle * 100),
      throttleBar: st.throttle * 100,
      soundRpm: 900 + st.throttle * 7800,
      soundThrottle: st.throttle,
    });
  }
}
