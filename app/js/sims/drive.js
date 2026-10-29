// 🏎️ Drive It! — Cars: dyno/road test-drive (ported from the original viewer drive loop).
import { BaseSim, clamp } from './base.js';
import { playHorn, playPop } from '../sound.js';

export class DriveSim extends BaseSim {
  constructor(viewer) {
    const id = String(viewer.currentObject?.activeModelId || viewer.currentModel?.id || '').toLowerCase();
    const isEV = /tesla|cybertruck|rivian/i.test(id);
    const isPedalBike = /tern|road-bike|bicycle|ebike/i.test(id);
    const isEbike = /tern|ebike|cargo/i.test(id);
    const isMoto = /ducati|panigale|moto/i.test(id);
    super(viewer, { engineSound: !isPedalBike || isEbike, turbine: isEV || isEbike });
    this.isEV = isEV;
    this.isPedalBike = isPedalBike;
    this.isEbike = isEbike;
    this.isMoto = isMoto;
    this.hasLights = !isPedalBike || isEbike;
    this.st = {
      speed: isPedalBike ? 19 : isMoto ? 78 : 64,
      rpm: isPedalBike ? 84 : isEV ? 5600 : isMoto ? 6800 : 3600,
      gear: isEV ? 'D' : isPedalBike ? '8' : '3',
      throttle: 0,
      braking: 0,
      steerAngle: 0,
      nitro: false,
      headlightsOn: this.hasLights,
      autoCruise: true,
      crankPhase: 0,
      pitchAngle: 0,
      rollAngle: 0,
      stoppedAfterRun: false,
    };
  }

  onEnter() {
    const v = this.viewer;
    v.roadLinesGroup.visible = true;
    v.headlightGroup.visible = this.hasLights && this.st.headlightsOn && v.driveWheels.length > 0;
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
    if (name === 'lights' && this.hasLights) {
      this.st.headlightsOn = !this.st.headlightsOn;
      this.viewer.headlightGroup.visible = this.st.headlightsOn && this.viewer.driveWheels.length > 0;
      return this.st.headlightsOn;
    }
    if (name === 'horn') {
      if (this.isPedalBike) playPop(920);
      else playHorn();
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

    const cruiseSpeed = this.isPedalBike ? (inp.boost ? 31 : 20) : this.isMoto ? (inp.boost ? 182 : 84) : (inp.boost ? 168 : 68);
    if (st.autoCruise) {
      throttle = st.speed < cruiseSpeed ? 0.55 : 0.28;
      steerTarget = Math.sin(t * 1.15) * 0.16;
    } else {
      if (inp.up) throttle = inp.boost ? 1.0 : 0.82;
      if (inp.down) {
        if (st.speed > 1.5 || this.isPedalBike || this.isMoto) braking = 0.92;
        else throttle = -0.45; // Reverse for cars/trucks
      }
      if (inp.space) braking = 1.0;
      if (inp.left) steerTarget += 0.44;
      if (inp.right) steerTarget -= 0.44;
    }

    st.nitro = Boolean(inp.boost);
    if (st.nitro && throttle <= 0 && braking <= 0) throttle = 1.0;
    if (st.nitro && !st.autoCruise) this.check('boost');

    const maxSpeed = this.isPedalBike
      ? (st.nitro ? 35 : 26)
      : this.isMoto
        ? (st.nitro ? 199 : 168)
        : this.isEV
          ? (st.nitro ? 205 : 162)
          : (st.nitro ? 212 : 165);
    const accelBase = this.isPedalBike ? (st.nitro ? 16 : 9) : this.isEV ? (st.nitro ? 82 : 48) : (st.nitro ? 68 : 38);
    const decelRate = this.isPedalBike ? 28 : 95;

    if (braking > 0) {
      const decel = decelRate * braking * dt;
      if (st.speed > 0) st.speed = Math.max(0, st.speed - decel);
      else if (st.speed < 0) st.speed = Math.min(0, st.speed + decel);
    } else if (throttle > 0) {
      const accel = accelBase * throttle * (1 - st.speed / (maxSpeed * 1.08));
      st.speed = Math.min(maxSpeed, st.speed + accel * dt);
    } else if (throttle < 0 && !this.isPedalBike && !this.isMoto) {
      st.speed = Math.max(-32, st.speed + throttle * 35 * dt);
    } else {
      st.speed *= Math.max(0, 1 - dt * (this.isEV ? 0.85 : 0.45));
      if (Math.abs(st.speed) < 0.4) st.speed = 0;
    }

    const absSpeed = Math.abs(st.speed);
    const fastGate = this.isPedalBike ? 22 : this.isMoto ? 120 : 100;
    if (absSpeed >= fastGate) st.ranFast = true;
    if (st.ranFast) this.check('fast');
    if (st.ranFast && absSpeed < 0.5 && braking > 0) this.check('stop');

    let gearLabel = 'G1';
    if (this.isEV) {
      if (st.speed < -0.5) {
        st.gear = 'R';
        gearLabel = 'R';
        st.rpm = Math.round(absSpeed * 92);
      } else if (absSpeed < 0.5 && throttle <= 0) {
        st.gear = 'P';
        gearLabel = 'P';
        st.rpm = 0;
      } else {
        st.gear = 'D';
        gearLabel = st.nitro ? 'PLAID' : '1-SPD';
        const targetRpm = Math.min(18500, absSpeed * 90 + (throttle > 0 ? 450 : 0));
        st.rpm += (targetRpm - st.rpm) * Math.min(1, dt * 12);
      }
    } else if (this.isPedalBike) {
      if (absSpeed < 0.5 && throttle <= 0) {
        st.gear = '1';
        gearLabel = 'G1';
        st.rpm = 0;
      } else {
        const gNum = clamp(Math.ceil((absSpeed / 32) * 12), 1, 12);
        st.gear = String(gNum);
        gearLabel = `G${gNum}`;
        const targetCadence = throttle > 0 ? clamp(68 + absSpeed * 1.15 + (st.nitro ? 16 : 0), 55, 118) : 0;
        st.rpm += (targetCadence - st.rpm) * Math.min(1, dt * 8);
      }
    } else if (this.isMoto) {
      if (absSpeed < 0.8 && throttle === 0) {
        st.gear = 'N';
        gearLabel = 'N';
        st.rpm = 1350 + Math.sin(t * 12) * 45;
      } else {
        const motoThresholds = [0, 38, 72, 104, 136, 166];
        let gNum = 1;
        for (let i = motoThresholds.length - 1; i >= 0; i--) {
          if (absSpeed >= motoThresholds[i]) { gNum = i + 1; break; }
        }
        st.gear = String(gNum);
        gearLabel = `G${gNum}`;
        const gearFrac = clamp((absSpeed - (motoThresholds[gNum - 1] || 0)) / 34, 0, 1);
        const targetRpm = 4200 + gearFrac * 9400 + (st.nitro ? 850 : 0);
        st.rpm += (targetRpm - st.rpm) * Math.min(1, dt * 11);
      }
    } else if (st.speed < -0.5) {
      st.gear = 'R';
      gearLabel = 'R';
      st.rpm = Math.min(6500, 1100 + absSpeed * 145);
    } else if (absSpeed < 0.8 && throttle === 0) {
      st.gear = 'N';
      gearLabel = 'N';
      st.rpm = 850 + Math.sin(t * 9) * 35;
    } else {
      const gearThresholds = [0, 24, 46, 70, 96, 124, 152, 182];
      let gNum = 1;
      for (let i = gearThresholds.length - 1; i >= 0; i--) {
        if (absSpeed >= gearThresholds[i]) { gNum = i + 1; break; }
      }
      st.gear = String(gNum);
      gearLabel = `G${gNum}`;
      const gearFrac = clamp((absSpeed - (gearThresholds[gNum - 1] || 0)) / 28, 0, 1);
      const targetRpm = 2100 + gearFrac * 6100 + (st.nitro ? 650 : 0);
      st.rpm += (targetRpm - st.rpm) * Math.min(1, dt * 10);
    }
    st.throttle = Math.max(0, throttle);
    st.braking = braking;
    st.steerAngle += (steerTarget - st.steerAngle) * Math.min(1, dt * 8.5);

    const wheelAngularVel = (st.speed / 60) * (this.isPedalBike ? 22.0 : 14.5);
    for (const w of v.driveWheels) w.rotation.z -= wheelAngularVel * dt;
    for (const sw of v.steerWheels) sw.rotation.y = st.steerAngle;
    for (const stw of v.steeringWheels) stw.rotation.x = st.steerAngle * 2.4;

    const roadScrollSpeed = (st.speed / 60) * 5.2;
    for (const dash of v.laneDashes) {
      dash.position.x -= roadScrollSpeed * dt;
      if (dash.position.x < -11.2) dash.position.x += 22.4;
      else if (dash.position.x > 11.2) dash.position.x -= 22.4;
    }

    const crankSpeed = this.isPedalBike
      ? (st.rpm / 60) * Math.PI * 2
      : 8 + (st.rpm / 9000) * 48;
    st.crankPhase += dt * crankSpeed;
    for (const p of v.drivePistons) {
      p.position.y = (p.userData.baseY ?? 0.08) + Math.sin(st.crankPhase + (p.userData.phase ?? 0)) * 0.032;
    }
    this.spinFans(dt, this.isPedalBike ? crankSpeed : crankSpeed * 0.65);

    const leanSign = this.isPedalBike || this.isMoto ? 2.2 : -1;
    const targetPitch = throttle > 0 ? throttle * 0.024 * (st.nitro ? 1.45 : 1) : -braking * 0.032;
    const targetRoll = leanSign * st.steerAngle * Math.min(1, absSpeed / (this.isPedalBike ? 18 : 45)) * 0.065;
    st.pitchAngle += (targetPitch - st.pitchAngle) * Math.min(1, dt * 7);
    st.rollAngle += (targetRoll - st.rollAngle) * Math.min(1, dt * 7);
    v.rootGroup.rotation.z = st.pitchAngle;
    v.rootGroup.rotation.x = st.rollAngle;
    v.rootGroup.position.y = this.isPedalBike || this.isEV
      ? 0
      : Math.sin(t * 52) * 0.0018 * (st.rpm / 8000);

    Object.assign(this.telemetry, {
      speed: Math.round(absSpeed),
      gear: gearLabel,
      rpm: Math.round(st.rpm),
      rpmBar: st.rpm,
      soundRpm: this.isEbike ? 600 + absSpeed * 55 : this.isEV ? 450 + st.rpm * 0.35 : st.rpm,
      soundThrottle: st.throttle,
    });
  }
}
