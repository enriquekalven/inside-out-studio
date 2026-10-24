// 🏎️ Drive It! — Cars: dyno/road test-drive (ported from the original viewer drive loop).
import { BaseSim, clamp } from './base.js';
import { playHorn } from '../sound.js';

export class DriveSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: /tesla|rivian/i.test(viewer.currentObject?.activeModelId || '') });
    this.st = {
      speed: 64, rpm: 3600, gear: '3', throttle: 0, braking: 0, steerAngle: 0, nitro: false,
      headlightsOn: true, autoCruise: true, crankPhase: 0, pitchAngle: 0, rollAngle: 0, stoppedAfterRun: false,
    };
  }

  onEnter() {
    const v = this.viewer;
    v.roadLinesGroup.visible = true;
    v.headlightGroup.visible = this.st.headlightsOn && v.driveWheels.length > 0;
    v.desiredSpherical.theta = 0.95;
    v.desiredSpherical.phi = 1.24;
    v.desiredSpherical.radius = Math.max(3.8, v.defaultSpherical.radius * 0.92);
  }

  onExit() {
    const v = this.viewer;
    v.roadLinesGroup.visible = false;
    v.headlightGroup.visible = false;
  }

  onInput(name, down) {
    if (down) this.st.autoCruise = false;
  }

  trigger(name) {
    if (name === 'lights') {
      this.st.headlightsOn = !this.st.headlightsOn;
      this.viewer.headlightGroup.visible = this.st.headlightsOn && this.viewer.driveWheels.length > 0;
      return this.st.headlightsOn;
    }
    if (name === 'horn') {
      playHorn();
      return true;
    }
    return false;
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const inp = this.inputs;
    const t = v.clock.elapsedTime;
    let throttle = 0;
    let braking = 0;
    let steerTarget = 0;

    if (st.autoCruise) {
      const targetSpeed = inp.boost ? 168 : 68;
      throttle = st.speed < targetSpeed ? 0.55 : 0.28;
      steerTarget = Math.sin(t * 1.15) * 0.16;
    } else {
      if (inp.up) throttle = inp.boost ? 1.0 : 0.82;
      if (inp.down) {
        if (st.speed > 2) braking = 0.9;
        else throttle = -0.45; // Reverse
      }
      if (inp.space) braking = 1.0;
      if (inp.left) steerTarget += 0.44;
      if (inp.right) steerTarget -= 0.44;
    }

    st.nitro = Boolean(inp.boost);
    if (st.nitro && throttle <= 0) throttle = 1.0;
    if (st.nitro && !st.autoCruise) this.check('boost');

    const maxSpeed = st.nitro ? 212 : 165;
    if (braking > 0) {
      const decel = 95 * braking * dt;
      if (st.speed > 0) st.speed = Math.max(0, st.speed - decel);
      else if (st.speed < 0) st.speed = Math.min(0, st.speed + decel);
    } else if (throttle > 0) {
      const accel = (st.nitro ? 68 : 38) * throttle * (1 - st.speed / (maxSpeed * 1.08));
      st.speed = Math.min(maxSpeed, st.speed + accel * dt);
    } else if (throttle < 0) {
      st.speed = Math.max(-32, st.speed + throttle * 35 * dt);
    } else {
      st.speed *= Math.max(0, 1 - dt * 0.45);
      if (Math.abs(st.speed) < 0.4) st.speed = 0;
    }

    const absSpeed = Math.abs(st.speed);
    if (absSpeed >= 100) st.ranFast = true;
    if (st.ranFast) this.check('fast');
    if (st.ranFast && absSpeed < 0.5 && braking > 0) this.check('stop');

    if (st.speed < -0.5) {
      st.gear = 'R';
      st.rpm = Math.min(6500, 1100 + absSpeed * 145);
    } else if (absSpeed < 0.8 && throttle === 0) {
      st.gear = 'N';
      st.rpm = 850 + Math.sin(t * 9) * 35;
    } else {
      const gearThresholds = [0, 24, 46, 70, 96, 124, 152, 182];
      let gNum = 1;
      for (let i = gearThresholds.length - 1; i >= 0; i--) {
        if (absSpeed >= gearThresholds[i]) { gNum = i + 1; break; }
      }
      st.gear = String(gNum);
      const gearFrac = clamp((absSpeed - (gearThresholds[gNum - 1] || 0)) / 28, 0, 1);
      const targetRpm = 2100 + gearFrac * 6100 + (st.nitro ? 650 : 0);
      st.rpm += (targetRpm - st.rpm) * Math.min(1, dt * 10);
    }
    st.throttle = Math.max(0, throttle);
    st.braking = braking;
    st.steerAngle += (steerTarget - st.steerAngle) * Math.min(1, dt * 8.5);

    const wheelAngularVel = (st.speed / 60) * 14.5;
    for (const w of v.driveWheels) w.rotation.z -= wheelAngularVel * dt;
    for (const sw of v.steerWheels) sw.rotation.y = st.steerAngle;
    for (const stw of v.steeringWheels) stw.rotation.x = st.steerAngle * 2.4;

    const roadScrollSpeed = (st.speed / 60) * 5.2;
    for (const dash of v.laneDashes) {
      dash.position.x -= roadScrollSpeed * dt;
      if (dash.position.x < -11.2) dash.position.x += 22.4;
      else if (dash.position.x > 11.2) dash.position.x -= 22.4;
    }

    const crankSpeed = 8 + (st.rpm / 9000) * 48;
    st.crankPhase += dt * crankSpeed;
    for (const p of v.drivePistons) {
      p.position.y = (p.userData.baseY ?? 0.08) + Math.sin(st.crankPhase + (p.userData.phase ?? 0)) * 0.032;
    }
    this.spinFans(dt, crankSpeed * 0.65);

    const targetPitch = throttle > 0 ? throttle * 0.024 * (st.nitro ? 1.45 : 1) : -braking * 0.032;
    const targetRoll = -st.steerAngle * Math.min(1, absSpeed / 45) * 0.065;
    st.pitchAngle += (targetPitch - st.pitchAngle) * Math.min(1, dt * 7);
    st.rollAngle += (targetRoll - st.rollAngle) * Math.min(1, dt * 7);
    v.rootGroup.rotation.z = st.pitchAngle;
    v.rootGroup.rotation.x = st.rollAngle;
    v.rootGroup.position.y = Math.sin(t * 52) * 0.0018 * (st.rpm / 8000);

    Object.assign(this.telemetry, {
      speed: Math.round(absSpeed),
      gear: st.gear === 'R' || st.gear === 'N' ? st.gear : `G${st.gear}`,
      rpm: Math.round(st.rpm),
      rpmBar: st.rpm,
      soundRpm: st.rpm,
      soundThrottle: st.throttle,
    });
  }
}
