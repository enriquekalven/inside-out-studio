// ✈️ Take It for a Flight! — aircraft-class authentic flight physics, FAA nav lights, hinge-pivoted surfaces,
// spinning landing-gear tires, Cessna Para-Lift flaps, F-22 2D thrust vectoring & SR-71 Mach 3.3 translating spikes.
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach, wrapDeg, makeGlowQuad } from './base.js';
import { buildSky, buildGround, buildClouds, scrollGround, scrollClouds } from './flight_env.js';

const KT_TO_FPM = 101.3;
const WORLD_PER_FT = 0.0025; // visual descent of the ground per foot of altitude
const FLAP_DETENTS = [0, 10, 20, 30];

export class FlightSim extends BaseSim {
  constructor(viewer) {
    const id = String(viewer.currentObject?.activeModelId || '').toLowerCase();
    const isIronMan = /iron-man/i.test(id);
    const isProp = /cessna/i.test(id);
    const isSR71 = /sr71|blackbird/i.test(id);
    const isF22 = /f22|raptor/i.test(id);
    const isA350 = /a350|airbus/i.test(id);
    super(viewer, { engineSound: true, turbine: !isProp });
    this.modelId = id;
    this.isIronMan = isIronMan;
    this.isProp = isProp;
    this.isSR71 = isSR71;
    this.isF22 = isF22;
    this.fixedGear = isProp || isIronMan;
    this.hideFloor = true;

    if (isIronMan) {
      this.perf = { vMax: 1380, vR: 12, accel: 310, boostMult: 1.85, climbScale: 1.85 }; // Mach 3+ Repulsor Overdrive
    } else if (isProp) {
      this.perf = { vMax: 126, vR: 55, accel: 26, boostMult: 1.08, climbScale: 0.78 };
    } else if (isSR71) {
      this.perf = { vMax: 1380, vR: 180, accel: 156, boostMult: 1.44, climbScale: 1.95 }; // ~1985 KT (Mach 3.34) in TEB burner
    } else if (isF22) {
      this.perf = { vMax: 1050, vR: 145, accel: 128, boostMult: 1.28, climbScale: 1.55 }; // Mach 1.8 dry supercruise, Mach 2.28 burner
    } else if (isA350) {
      this.perf = { vMax: 515, vR: 150, accel: 58, boostMult: 1.08, climbScale: 1.05 }; // Mach 0.85 cruise
    } else {
      this.perf = { vMax: 482, vR: 142, accel: 54, boostMult: 1.08, climbScale: 1.05 }; // 737 MAX Mach 0.79 cruise
    }

    this.st = {
      speed: isIronMan ? 0 : isProp ? 22 : 38,
      altitude: 0,
      vs: 0,
      heading: 270,
      throttle: isIronMan ? 0.16 : 0.34,
      pitch: 0,
      bank: 0,
      heroLean: 0,
      onGround: true,
      gearDown: true,
      gearAnim: 0,
      tookOff: false,
      lightsOn: true,
      flapIdx: isProp ? 1 : 0, // Cessna starts at 10° takeoff flaps
      flap: 0.33,
      spikeAnim: 0,
      tebFlash: 0,
      unibeamTimer: 0,
      chuteOpen: false,
      wheelSpinRate: 0,
    };
  }

  _collectPivotedParts(regex) {
    const out = [];
    for (const [id, rec] of this.viewer.partRecords.entries()) {
      if (regex.test(id)) {
        out.push({
          id,
          g: rec.group,
          pivot: rec.center.clone(),
          basePos: rec.group.position.clone(),
          baseRot: rec.group.rotation.clone(),
        });
      }
    }
    return out;
  }

  _setHingeRotation(item, rx, ry, rz) {
    const { g, pivot } = item;
    g.rotation.set(rx, ry, rz);
    const rotated = pivot.clone().applyEuler(g.rotation);
    g.position.set(pivot.x - rotated.x, pivot.y - rotated.y, pivot.z - rotated.z);
  }

  onEnter() {
    const v = this.viewer;
    this.floorY = typeof v.baseStageFloorY === 'number' ? v.baseStageFloorY : v.stageFloorGroup.position.y;
    this.skyDome = buildSky(this.env);
    this.groundInfo = buildGround(this.env, this.floorY);
    this.clouds = buildClouds(this.env);

    this.gearGroups = this.fixedGear
      ? []
      : this.parts(/gear/).map((g) => ({ g, baseY: g.position.y, baseScale: g.scale.clone() }));
    this.flapItems = this._collectPivotedParts(/flap|slat|aileron/);
    this.tailItems = this._collectPivotedParts(/tail|empennage|rudder/);
    this.nozzleItems = this._collectPivotedParts(/thrust-vectoring-nozzle/);
    this.spikeItems = this._collectPivotedParts(/j58-inlet-spike/);
    this.airbrakeItems = this.isIronMan ? this._collectPivotedParts(/dorsal-airbrake/) : [];

    this.lights = this.isIronMan ? [] : this._buildNavLights();
    this.plumes = this._buildAfterburnerPlumes();
    this.ironVfx = this.isIronMan ? this._buildIronManRepulsorVfx() : null;
    this.propDisc = this.isProp ? this._buildPropBlurDisc() : null;
    this.chuteGroup = this.isSR71 ? this._buildDragChute() : null;

    v.headlightGroup.visible = !this.isIronMan;
    if (this.isIronMan) {
      v.desiredSpherical.theta = 0.98;
      v.desiredSpherical.phi = 1.24;
      v.desiredSpherical.radius = Math.max(4.95, v.defaultSpherical.radius * 1.12);
    } else {
      v.desiredSpherical.theta = 2.35;
      v.desiredSpherical.phi = 1.22;
      v.desiredSpherical.radius = Math.max(4.2, v.defaultSpherical.radius * 1.05);
    }
  }

  onExit() {
    const v = this.viewer;
    v.headlightGroup.visible = false;
    v.rootGroup.rotation.set(0, 0, 0);
    v.rootGroup.position.set(0, 0, 0);
    for (const { g, baseY, baseScale } of this.gearGroups) {
      g.visible = true;
      g.position.y = baseY;
      g.scale.copy(baseScale);
    }
    for (const item of [
      ...this.flapItems,
      ...this.tailItems,
      ...this.nozzleItems,
      ...this.spikeItems,
      ...(this.airbrakeItems || []),
    ]) {
      item.g.rotation.copy(item.baseRot);
      item.g.position.copy(item.basePos);
    }
    for (const l of this.lights || []) {
      v.rootGroup.remove(l);
      if (l.geometry) l.geometry.dispose();
      if (l.material) l.material.dispose();
    }
    if (this.plumeGroup) {
      v.rootGroup.remove(this.plumeGroup);
    }
    if (this.ironVfx?.group) {
      v.rootGroup.remove(this.ironVfx.group);
    }
    if (this.propDisc) {
      v.rootGroup.remove(this.propDisc);
      if (this.propDisc.geometry) this.propDisc.geometry.dispose();
      if (this.propDisc.material) {
        if (this.propDisc.material.map) this.propDisc.material.map.dispose();
        this.propDisc.material.dispose();
      }
    }
    if (this.chuteGroup) {
      v.rootGroup.remove(this.chuteGroup);
    }
  }

  _buildPropBlurDisc() {
    const v = this.viewer;
    const crank = v.driveCranks[0];
    if (!crank) return null;
    v.rootGroup.updateWorldMatrix(true, true);
    const invRoot = v.rootGroup.matrixWorld.clone().invert();
    const hubPos = new THREE.Vector3().setFromMatrixPosition(crank.matrixWorld).applyMatrix4(invRoot);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64;
    const cy = 64;
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 62);
    grad.addColorStop(0.0, 'rgba(203,213,225,0.0)');
    grad.addColorStop(0.22, 'rgba(30,41,59,0.28)');
    grad.addColorStop(0.84, 'rgba(30,41,59,0.18)');
    grad.addColorStop(0.90, 'rgba(248,250,252,0.55)');
    grad.addColorStop(0.96, 'rgba(220,38,38,0.62)');
    grad.addColorStop(1.0, 'rgba(220,38,38,0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(1.32, 1.32),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    disc.rotation.y = Math.PI / 2;
    disc.position.copy(hubPos).add(new THREE.Vector3(0.022, 0, 0));
    v.rootGroup.add(disc);
    return disc;
  }

  _buildNavLights() {
    // FAA / ICAO standard with aircraft nose along +X and Up along +Y:
    // Port (Left Wing, -Z) = RED, Starboard (Right Wing, +Z) = GREEN, Vertical Tail Peak = Strobe White.
    // Convert mesh vertices into viewer.rootGroup local space so scale & fitOffset are never double-applied!
    this.viewer.rootGroup.updateWorldMatrix(true, true);
    const invRoot = this.viewer.rootGroup.matrixWorld.clone().invert();
    const meshToRoot = new THREE.Matrix4();

    let portTip = new THREE.Vector3(0, 0.1, -1.8);
    let stbdTip = new THREE.Vector3(0, 0.1, 1.8);
    let tailPeak = new THREE.Vector3(-2.0, 0.9, 0);
    let minZ = Infinity;
    let maxZ = -Infinity;
    let maxTailY = -Infinity;

    const tmp = new THREE.Vector3();
    for (const rec of this.viewer.partRecords.values()) {
      for (const m of rec.meshes) {
        const pos = m.geometry?.attributes?.position;
        if (!pos) continue;
        meshToRoot.multiplyMatrices(invRoot, m.matrixWorld);
        const step = Math.max(1, Math.floor(pos.count / 320));
        for (let i = 0; i < pos.count; i += step) {
          tmp.fromBufferAttribute(pos, i).applyMatrix4(meshToRoot);
          if (tmp.z < minZ) {
            minZ = tmp.z;
            portTip.copy(tmp);
          }
          if (tmp.z > maxZ) {
            maxZ = tmp.z;
            stbdTip.copy(tmp);
          }
          if (tmp.x < -0.6 && tmp.y > maxTailY) {
            maxTailY = tmp.y;
            tailPeak.copy(tmp);
          }
        }
      }
    }

    const mk = (color, r = 0.032) =>
      new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 10),
        new THREE.MeshBasicMaterial({ color, toneMapped: false }),
      );
    const portRed = mk(0xff2d2d);
    portRed.position.copy(portTip);
    const stbdGreen = mk(0x22ff55);
    stbdGreen.position.copy(stbdTip);
    const tailStrobe = mk(0xffffff, 0.038);
    tailStrobe.position.copy(tailPeak).add(new THREE.Vector3(0, 0.02, 0));

    this.viewer.rootGroup.add(portRed, stbdGreen, tailStrobe);
    return [portRed, stbdGreen, tailStrobe];
  }

  _buildAfterburnerPlumes() {
    this.plumeGroup = null;
    if (!this.isF22 && !this.isSR71) return [];
    const grp = new THREE.Group();
    grp.visible = false;
    const zOffsets = this.isSR71 ? [-0.92, 0.92] : [-0.24, 0.24];
    const xNozzle = this.isSR71 ? -1.94 : -1.92;
    const yNozzle = this.isSR71 ? 0.04 : 0.05;
    const plumes = [];

    for (const z of zOffsets) {
      const pWrap = new THREE.Group();
      pWrap.position.set(xNozzle, yNozzle, z);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0xff6b00,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const outerCone = new THREE.Mesh(new THREE.ConeGeometry(this.isSR71 ? 0.15 : 0.11, 1.05, 18, 1, true), outerMat);
      outerCone.rotation.z = Math.PI / 2;
      outerCone.position.x = -0.52;
      pWrap.add(outerCone);

      // Supersonic Mach shock-diamond rings along exhaust plume
      const diamonds = [];
      for (let d = 0; d < 4; d++) {
        const dQuad = makeGlowQuad(0x7dd3fc, this.isSR71 ? 0.22 : 0.17, 0.85, true);
        dQuad.position.set(-0.18 - d * 0.22, 0, 0);
        pWrap.add(dQuad);
        diamonds.push(dQuad);
      }
      grp.add(pWrap);
      plumes.push({ pWrap, outerMat, diamonds });
    }
    this.viewer.rootGroup.add(grp);
    this.plumeGroup = grp;
    return plumes;
  }

  _buildDragChute() {
    const grp = new THREE.Group();
    grp.visible = false;
    grp.position.set(-2.05, 0.22, 0);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      canopyMat,
    );
    canopy.rotation.z = -Math.PI / 2;
    canopy.position.set(-1.15, 0.22, 0);
    grp.add(canopy);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-1.12, 0.22 + Math.sin(a) * 0.38, Math.cos(a) * 0.38),
      ];
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }
    this.viewer.rootGroup.add(grp);
    return grp;
  }

  _buildIronManRepulsorVfx() {
    const grp = new THREE.Group();

    // 1. Twin Boot-Sole Plasma Jet Plumes (extending along -Y from boot nozzles)
    const bootPlumes = [];
    for (const s of [-1, 1]) {
      const pWrap = new THREE.Group();
      pWrap.position.set(0.045, -1.00, s * 0.186);

      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const outerCone = new THREE.Mesh(new THREE.ConeGeometry(0.092, 1.15, 20, 1, true), outerMat);
      outerCone.rotation.z = Math.PI;
      outerCone.position.y = -0.575;
      pWrap.add(outerCone);

      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xfef9c3,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const coreCone = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.64, 16, 1, true), coreMat);
      coreCone.rotation.z = Math.PI;
      coreCone.position.y = -0.32;
      pWrap.add(coreCone);

      const nozzleHalo = makeGlowQuad(0x7dd3fc, 0.28, 0.92, true);
      nozzleHalo.position.set(0, -0.04, 0);
      pWrap.add(nozzleHalo);

      const diamonds = [];
      for (let d = 0; d < 4; d++) {
        const dq = makeGlowQuad(d % 2 === 0 ? 0xfef08a : 0x7dd3fc, 0.21 - d * 0.025, 0.86, true);
        dq.position.set(0, -0.16 - d * 0.22, 0);
        pWrap.add(dq);
        diamonds.push(dq);
      }

      grp.add(pWrap);
      bootPlumes.push({ pWrap, outerMat, coreMat, nozzleHalo, diamonds });
    }

    // 2. Twin Palm Repulsor Trim & Attitude Stabilizer Beams
    const palmPlumes = [];
    for (const s of [-1, 1]) {
      const palmWrap = new THREE.Group();
      palmWrap.position.set(0.118, 0.132, s * 0.415);

      const halo = makeGlowQuad(0x7dd3fc, 0.22, 0.88, true);
      palmWrap.add(halo);

      const stabMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const stabCone = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.48, 14, 1, true), stabMat);
      stabCone.rotation.z = Math.PI;
      stabCone.position.y = -0.24;
      palmWrap.add(stabCone);

      grp.add(palmWrap);
      palmPlumes.push({ palmWrap, halo, stabCone, stabMat });
    }

    // 3. Multi-Spectrum Chest Unibeam Projector Blast (+X from sternum RT core)
    const unibeamGroup = new THREE.Group();
    unibeamGroup.position.set(0.226, 0.758, 0);
    unibeamGroup.visible = false;

    const uniFlash = makeGlowQuad(0xfef08a, 0.56, 0.98, true);
    unibeamGroup.add(uniFlash);

    const uniOuterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const uniOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.085, 3.8, 24, 1, true), uniOuterMat);
    uniOuter.rotation.z = -Math.PI / 2;
    uniOuter.position.x = 1.9;
    unibeamGroup.add(uniOuter);

    const uniCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const uniCore = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.048, 3.8, 18, 1, true), uniCoreMat);
    uniCore.rotation.z = -Math.PI / 2;
    uniCore.position.x = 1.9;
    unibeamGroup.add(uniCore);

    const uniRings = [];
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.11 + r * 0.035, 0.012, 10, 28),
        new THREE.MeshBasicMaterial({
          color: r % 2 === 0 ? 0xfef08a : 0x7dd3fc,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.x = 0.25 + r * 0.72;
      unibeamGroup.add(ring);
      uniRings.push(ring);
    }
    grp.add(unibeamGroup);

    this.viewer.rootGroup.add(grp);
    return { grp, group: grp, bootPlumes, palmPlumes, unibeamGroup, uniFlash, uniOuterMat, uniCoreMat, uniRings };
  }

  trigger(name) {
    if (name === 'unibeam' && this.isIronMan) {
      this.st.unibeamTimer = this.st.unibeamTimer > 0.2 ? 0 : 2.8;
      if (this.st.unibeamTimer > 0) this.check('unibeam');
      return this.st.unibeamTimer > 0;
    }
    if (name === 'flaps' || (name === 'gear' && this.fixedGear)) {
      this.st.flapIdx = (this.st.flapIdx + 1) % FLAP_DETENTS.length;
      if (this.st.flapIdx > 0) this.check('flaps');
      return this.st.flapIdx > 0;
    }
    if (name === 'gear' && !this.fixedGear) {
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

    // 1. Throttle, Afterburner (TEB flash on SR-71) & Airbrakes / Wheel Brakes
    if (inp.up || inp.boost) st.throttle = clamp(st.throttle + dt * (inp.boost ? 0.95 : 0.6), 0, 1);
    else if (inp.down) st.throttle = clamp(st.throttle - dt * 0.95, 0, 1);

    const burnerActive = (this.isF22 || this.isSR71) && (inp.boost || st.throttle > 0.92);
    if (this.isSR71 && inp.boost && !this._prevBoost) {
      st.tebFlash = 0.45; // Pyrophoric green Triethylborane ignition flash!
    }
    this._prevBoost = Boolean(inp.boost);
    st.tebFlash = Math.max(0, st.tebFlash - dt);
    st.unibeamTimer = Math.max(0, st.unibeamTimer - dt);

    const boost = inp.boost ? p.boostMult : 1.0;
    const brake = inp.down && (st.onGround || this.isIronMan) ? 1 : 0;

    // Flap aerodynamic lift & drag effect (especially on Cessna 172 Para-Lift flaps)
    const flapDeg = this.isProp ? FLAP_DETENTS[st.flapIdx] : Math.round(st.flap * 30);
    const flapFrac = flapDeg / 30;
    const effectiveVR = p.vR * (1 - flapFrac * 0.14);

    // 2. Airspeed (KT) & Mach Number (speed of sound scales from 661 KT sea-level to 573 KT in stratosphere)
    const flapDrag = flapFrac * (this.isProp ? 2.4 : 4.5);
    const chuteDrag = this.isSR71 && st.onGround && brake && st.speed > 45 ? 38 : 0;
    st.chuteOpen = chuteDrag > 0;
    const drag = (st.speed / (p.vMax * boost)) ** 2 * p.accel * boost * 0.98 + 0.45 + flapDrag;
    const thrustAccel = st.throttle * p.accel * boost;
    st.speed = clamp(
      st.speed + (thrustAccel - drag - brake * (this.isIronMan ? 65 : 32) - chuteDrag) * dt,
      0,
      p.vMax * boost,
    );

    const speedOfSoundKt = 661.5 - clamp(st.altitude / 36000, 0, 1) * 88.0;
    const mach = st.speed / speedOfSoundKt;
    if (this.isIronMan && mach >= 1.0) this.check('supersonic');
    if (this.isF22 && mach >= 1.5) this.check('supercruise');
    if (this.isSR71 && mach >= 3.0) this.check('mach3');

    // 3. Pitch & Rotation Dynamics
    let pitchTarget = 0;
    if (inp.pitchUp) pitchTarget = this.isIronMan ? 0.42 : this.isF22 ? 0.34 : 0.26;
    else if (inp.pitchDown) pitchTarget = st.onGround ? 0 : -0.24;
    else if (!st.onGround) pitchTarget = st.throttle > (this.isIronMan ? 0.22 : 0.38) ? 0.085 : -0.055;
    else if (st.speed > effectiveVR * 1.04) pitchTarget = 0.16;

    if (!this.isIronMan && !st.onGround && st.speed < effectiveVR * 0.8) pitchTarget = Math.min(pitchTarget, -0.14);
    if (!this.isIronMan && st.onGround && st.speed < effectiveVR * 0.88) pitchTarget = Math.min(pitchTarget, 0.02);
    st.pitch = approach(st.pitch, pitchTarget, dt * (this.isIronMan || this.isF22 ? 3.2 : 2.2));

    // 4. Bank, Yaw & Runway Nosewheel Steering
    const bankTarget = (inp.right ? 0.58 : 0) - (inp.left ? 0.58 : 0);
    st.bank = approach(st.bank, st.onGround ? 0 : bankTarget, dt * (this.isIronMan || this.isF22 ? 3.4 : 2.5));
    const steerInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const yawRate = st.onGround ? steerInput * 14 * Math.min(1, st.speed / 20) : st.bank * 32;
    st.heading = wrapDeg(st.heading + yawRate * dt);

    const noseSteer = st.onGround ? -steerInput * 0.38 : 0;
    for (const sw of v.steerWheels) {
      sw.rotation.y = approach(sw.rotation.y, noseSteer, dt * 8);
    }

    // 5. Vertical Climb / Descent & Stratospheric Sky Transition
    const lift = this.isIronMan
      ? (Math.max(45, st.speed) * Math.sin(st.pitch) + (st.throttle - 0.18) * 95) * KT_TO_FPM * 0.65
      : st.speed * Math.sin(st.pitch) * KT_TO_FPM * p.climbScale;
    if (st.onGround) {
      st.vs = 0;
      const ironLiftoff = this.isIronMan && (st.throttle > 0.24 || inp.up || inp.pitchUp || inp.boost);
      if (ironLiftoff || (st.pitch > 0.075 && st.speed > effectiveVR)) {
        st.onGround = false;
        st.tookOff = true;
        if (this.isIronMan && st.altitude < 12) st.altitude = 18;
        this.check('takeoff');
      }
    } else {
      const stallSink = !this.isIronMan && st.speed < effectiveVR * 0.8 ? 900 : 0;
      st.vs = approach(st.vs, lift - stallSink, dt * 3);
      st.altitude = clamp(st.altitude + (st.vs / 60) * dt, 0, this.isSR71 ? 85000 : 65000);
      if (st.altitude <= 0) {
        st.altitude = 0;
        st.onGround = true;
        st.gearDown = true;
        if (st.tookOff && st.vs > -950) this.check('land');
        st.vs = 0;
      }
    }

    if (this.skyDome?.material) {
      // Darken sky smoothly into deep-space indigo above 30,000 ft (iconic SR-71 view at 85,000 ft!)
      const stratFrac = clamp((st.altitude - 25000) / 50000, 0, 1);
      const c = 1 - stratFrac * 0.78;
      this.skyDome.material.color.setRGB(c * 0.85 + (1 - c) * 0.06, c * 0.9 + (1 - c) * 0.08, c);
    }

    // 6. Landing Gear Retraction (Skipped for Fixed-Gear Cessna 172 & Iron Man!) & Spinning Tires
    if (!this.fixedGear) {
      if (!st.onGround && st.altitude > 160 && st.gearDown && !inp.pitchDown) st.gearDown = false;
      if (!st.onGround && st.altitude < 320 && st.vs < 0 && !st.gearDown) st.gearDown = true;
      st.gearAnim = approach(st.gearAnim, st.gearDown ? 0 : 1, dt * 1.65);
      if (st.gearAnim > 0.96) this.check('gearup');
      for (const { g, baseY, baseScale } of this.gearGroups) {
        g.position.y = baseY + st.gearAnim * 0.28;
        g.scale.set(baseScale.x, baseScale.y * Math.max(0.05, 1 - st.gearAnim), baseScale.z);
        g.visible = st.gearAnim < 0.98;
      }
    }

    const targetWheelRate = st.onGround ? st.speed * 0.22 : 0;
    st.wheelSpinRate = approach(st.wheelSpinRate, targetWheelRate, dt * (st.onGround ? 12 : 2.5));
    for (const w of v.driveWheels) {
      w.rotation.z -= st.wheelSpinRate * dt;
    }

    // 7. Hinge-Pivoted Flaps, Tail Surfaces, F-22 2D Vectoring Nozzles, SR-71 Spikes & Iron Man Dorsal Airbrakes
    const targetFlap = this.isProp ? FLAP_DETENTS[st.flapIdx] / 30 : st.speed < p.vR * 1.45 ? 0.45 : 0;
    st.flap = approach(st.flap, targetFlap, dt * 2.2);
    for (const item of this.flapItems) {
      this._setHingeRotation(item, 0, 0, -st.flap * 0.42 + st.bank * 0.08);
    }
    for (const item of this.tailItems) {
      const elevDeflect = -(pitchTarget - st.pitch) * 0.32;
      const rudDeflect = (st.bank + (st.onGround ? steerInput * 0.35 : 0)) * 0.14;
      this._setHingeRotation(item, 0, rudDeflect, elevDeflect);
    }
    for (const item of this.nozzleItems) {
      // F-22 ±20° 2D pitch thrust-vectoring rectangular titanium nozzles
      const vecAngle = clamp((pitchTarget - st.pitch * 0.4) * 0.85, -0.35, 0.35);
      this._setHingeRotation(item, 0, 0, -vecAngle);
    }
    if (this.airbrakeItems?.length) {
      const brakeDeploy = !st.onGround && inp.down ? 0.28 : 0;
      for (const item of this.airbrakeItems) {
        this._setHingeRotation(item, 0, 0, brakeDeploy);
      }
    }

    // SR-71 computer-controlled J58 supersonic inlet spikes retract aft above Mach 1.6 up to Mach 3.2!
    const spikeFrac = this.isSR71 ? clamp((mach - 1.55) / 1.65, 0, 1) : 0;
    st.spikeAnim = approach(st.spikeAnim, spikeFrac, dt * 2.4);
    for (const item of this.spikeItems) {
      item.g.position.set(item.basePos.x - st.spikeAnim * 0.22, item.basePos.y, item.basePos.z);
    }

    // 8. Spinning Propellers / Turbofans, Afterburner Plumes & Iron Man Repulsor / Unibeam VFX
    const fanRate = this.isProp ? 12 + st.throttle * 48 : 8 + st.throttle * 62 + st.speed * 0.04;
    this.spinFans(dt, fanRate);
    if (this.propDisc?.material) {
      this.propDisc.material.opacity = 0.08 + st.throttle * 0.28;
    }

    if (this.plumeGroup) {
      this.plumeGroup.visible = burnerActive;
      if (burnerActive) {
        const pulse = 0.88 + 0.16 * Math.sin(this.elapsed * 38);
        const burnerScale = (inp.boost ? 1.32 : 0.92) * pulse;
        const isGreenTeb = st.tebFlash > 0;
        for (const pl of this.plumes) {
          pl.pWrap.scale.set(burnerScale, 1, 1);
          pl.outerMat.color.setHex(isGreenTeb ? 0x22c55e : 0xff6b00);
          pl.outerMat.opacity = isGreenTeb ? 0.92 : 0.72;
          pl.diamonds.forEach((d, idx) => {
            d.material.color.setHex(isGreenTeb ? 0x86efac : idx % 2 === 0 ? 0x7dd3fc : 0xfef08a);
            d.lookAt(v.camera.position);
          });
        }
      }
    }

    if (this.ironVfx) {
      const pulse = 0.90 + 0.14 * Math.sin(this.elapsed * 42);
      const jetPower = clamp(st.throttle * (inp.boost ? 1.48 : 1.0), 0.12, 1.55);
      for (const bp of this.ironVfx.bootPlumes) {
        bp.pWrap.visible = !st.onGround || st.throttle > 0.18;
        bp.pWrap.scale.set(0.85 + jetPower * 0.22, jetPower * pulse, 0.85 + jetPower * 0.22);
        bp.outerMat.color.setHex(inp.boost ? 0xf59e0b : 0x38bdf8);
        bp.nozzleHalo.lookAt(v.camera.position);
        bp.diamonds.forEach((d) => d.lookAt(v.camera.position));
      }
      for (const pp of this.ironVfx.palmPlumes) {
        pp.palmWrap.visible = !st.onGround || st.throttle > 0.22;
        pp.halo.lookAt(v.camera.position);
        pp.stabCone.scale.set(1, (0.55 + jetPower * 0.65) * pulse, 1);
      }
      const uniActive = st.unibeamTimer > 0;
      this.ironVfx.unibeamGroup.visible = uniActive;
      if (uniActive) {
        const uPulse = 0.92 + 0.14 * Math.sin(this.elapsed * 54);
        this.ironVfx.uniFlash.lookAt(v.camera.position);
        this.ironVfx.uniFlash.scale.setScalar(uPulse);
        this.ironVfx.uniOuterMat.opacity = 0.58 + 0.22 * uPulse;
        this.ironVfx.uniRings.forEach((ring, idx) => {
          const travel = ((this.elapsed * 3.8 + idx * 0.25) % 1) * 3.4;
          ring.position.x = 0.18 + travel;
          ring.scale.setScalar(0.75 + travel * 0.36);
        });
      }
    }

    if (this.chuteGroup) {
      this.chuteGroup.visible = st.chuteOpen;
      if (st.chuteOpen) {
        const flutter = 0.94 + 0.08 * Math.sin(this.elapsed * 26);
        this.chuteGroup.scale.set(1, flutter, flutter);
      }
    }

    // 9. World Motion (Runway + Clouds + Nav Strobes)
    const dist = (st.speed / 60) * 2.8 * dt;
    scrollGround(this.groundInfo, dist);
    scrollClouds(this.clouds, dist * 0.6, v.camera);
    const sink = -st.altitude * WORLD_PER_FT;
    this.groundInfo.ground.position.y = this.floorY + Math.max(-34, sink);
    for (const c of this.clouds) {
      c.position.y = Math.max(-30, c.userData.baseY ?? (c.userData.baseY = c.position.y)) + sink * 0.35;
    }

    if (this.lights.length >= 3) {
      const strobeOn = st.lightsOn && Math.sin(this.elapsed * 9) > 0.65;
      this.lights[0].visible = this.lights[1].visible = st.lightsOn;
      this.lights[2].visible = strobeOn;
    }
    v.headlightGroup.visible = this.isIronMan ? st.unibeamTimer > 0 : st.lightsOn && st.gearAnim < 0.5;

    // 10. Pose Aircraft or Iron Man Superhero Repulsor Flight
    if (this.isIronMan) {
      // Lean head-first along +X in supersonic flight; flare upright into heroic chest-forward hover when firing Unibeam!
      const cruiseLean = clamp(0.32 + (st.speed / 240) * 0.88 - st.pitch * 0.42, 0.20, 1.24);
      const targetLean = st.onGround ? 0 : st.unibeamTimer > 0 ? 0.28 : cruiseLean;
      st.heroLean = approach(st.heroLean, targetLean, dt * 3.4);
      v.rootGroup.rotation.set(-st.bank * 0.85, 0, -st.heroLean);
      v.rootGroup.position.y = st.onGround ? 0 : -0.08 + Math.sin(this.elapsed * 3.8) * 0.028;
    } else {
      v.rootGroup.rotation.set(-st.bank * 0.9, 0, st.pitch);
      v.rootGroup.position.y = st.onGround ? Math.sin(this.elapsed * 40) * 0.0028 * Math.min(1, st.speed / 40) : 0;
    }

    const propRpm = Math.round(750 + st.throttle * 1950);
    const spikeInches = Math.round(st.spikeAnim * 26);

    Object.assign(this.telemetry, {
      airspeed: Math.round(st.speed),
      mph: Math.round(st.speed * 1.15078),
      mach: `M${mach.toFixed(2)}`,
      altitude: Math.round(st.altitude).toLocaleString(),
      vs: Math.round(st.vs / 10) * 10,
      heading: String(Math.round(st.heading)).padStart(3, '0'),
      flapsDeg: `${flapDeg}°`,
      flapsBadge: `FLP ${flapDeg}°`,
      unibeamBadge: st.unibeamTimer > 0 ? '⚡ UNIBEAM!' : 'UNIBEAM RDY',
      spike: spikeInches > 0 ? `-${spikeInches}" (${Math.round(st.spikeAnim * 100)}%)` : 'FWD (Subsonic)',
      rpm: propRpm,
      rpmBar: propRpm,
      throttle: Math.round(st.throttle * (inp.boost ? 110 : 100)),
      throttleBar: Math.round(clamp(st.throttle * (inp.boost ? 110 : 100), 0, 100)),
      soundRpm: this.isProp ? propRpm : 950 + st.throttle * 7900 + (burnerActive || st.unibeamTimer > 0 ? 1400 : 0),
      soundThrottle: clamp(st.throttle + (burnerActive || st.unibeamTimer > 0 ? 0.2 : 0), 0, 1),
    });
  }
}
