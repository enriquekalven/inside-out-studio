// 🚀 Spin It Up! / Fire It Up! — engine test cell: spool-up, stage spin rates, combustor glow, afterburner/Mach diamonds.
import * as THREE from '../../vendor/three.module.js';
import { BaseSim, clamp, approach } from './base.js';

export class EngineSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: true });
    const id = viewer.currentObject?.activeModelId || '';
    this.isRocket = /raptor|rocket/i.test(id);
    this.hasBurner = /f135|afterburner/i.test(id) || this.isRocket;
    this.maxThrust = this.isRocket ? 2300 : /f135/i.test(id) ? 125 : 490;
    this.st = { throttle: 0, n1: 0, n2: 0, egt: 20, burner: 0, lit: false };
    this.glowMeshes = [];
  }

  onEnter() {
    const v = this.viewer;
    const box = new THREE.Box3().setFromObject(v.rootGroup);
    this.box = box;
    const cy = (box.min.y + box.max.y) / 2;
    const floorY = v.stageFloorGroup.position.y;
    // Thrust stand: bedplate + two steel pylons holding the engine at its centreline
    const steel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.7 });
    const yellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(box.max.x - box.min.x + 1.2, 0.12, 1.4), yellow);
    bed.position.set((box.min.x + box.max.x) / 2, floorY + 0.06, 0);
    this.env.add(bed);
    for (const x of [box.min.x + 0.35, box.max.x - 0.35]) {
      const h = Math.max(0.2, cy - floorY - 0.12);
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), steel);
      pylon.position.set(x, floorY + 0.12 + h / 2, 0.9);
      this.env.add(pylon);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.0), steel);
      arm.position.set(x, cy, 0.42);
      this.env.add(arm);
    }
    // Exhaust plume (two nested cones pointing aft, -X) + Mach diamonds
    const coreCol = this.isRocket ? 0xcfe9ff : 0xffb85c;
    const outerCol = this.isRocket ? 0xffa94d : 0xff5a1f;
    const mk = (col, r, op) => new THREE.Mesh(
      new THREE.ConeGeometry(r, 1, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    const nozzleR = Math.min(0.5, (box.max.y - box.min.y) * 0.22);
    this.plume = new THREE.Group();
    this.plume.position.set(box.min.x, cy, 0);
    this.core = mk(coreCol, nozzleR * 0.55, 0.55);
    this.outer = mk(outerCol, nozzleR, 0.28);
    for (const c of [this.core, this.outer]) {
      c.rotation.z = Math.PI / 2; // apex toward +X (nozzle), base aft
      c.position.x = -0.5;
      this.plume.add(c);
    }
    this.diamonds = [];
    const dMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(nozzleR * 0.32, 0), dMat);
      d.position.x = -0.3 - i * 0.28;
      d.scale.set(1.6, 1, 1);
      this.plume.add(d);
      this.diamonds.push(d);
    }
    this.plume.scale.set(0.001, 1, 1);
    this.env.add(this.plume);
    // Combustor / chamber meshes glow with power
    this.glowMeshes = this.meshes(/combust|chamber|burner|annular|nozzle/).filter((m) => m.material.emissive);
    for (const m of this.glowMeshes) {
      m.userData.simEmissive = { hex: m.material.emissive.getHex(), i: m.material.emissiveIntensity };
    }
    this.spinners = v.driveCranks.map((c, i) => ({ c, mult: 0.55 + ((i * 7) % 5) * 0.22 }));
    v.desiredSpherical.theta = 2.25;
    v.desiredSpherical.phi = 1.2;
    v.desiredSpherical.radius = Math.max(4.2, v.defaultSpherical.radius * 1.12);
  }

  onExit() {
    for (const m of this.glowMeshes) {
      const e = m.userData.simEmissive;
      if (e) {
        m.material.emissive.setHex(e.hex);
        m.material.emissiveIntensity = e.i;
      }
    }
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const inp = this.inputs;
    if (!st.lit) st.lit = true; // igniters fire as soon as the test cell is armed
    if (inp.up) st.throttle = clamp(st.throttle + dt * 0.32, 0, 1);
    if (inp.down) st.throttle = clamp(st.throttle - dt * 0.5, 0, 1);
    const burnerWanted = Boolean(inp.space) && this.hasBurner;
    if (burnerWanted) st.throttle = clamp(st.throttle + dt * 0.8, 0, 1);
    st.burner = approach(st.burner, burnerWanted && st.throttle > 0.85 ? 1 : 0, dt * 4);

    const idle = this.isRocket ? 0 : 22;
    const n1Target = idle + st.throttle * (100 - idle);
    st.n1 = approach(st.n1, n1Target, dt * (st.n1 < n1Target ? 0.55 : 0.8));
    st.n2 = approach(st.n2, this.isRocket ? n1Target : 58 + st.throttle * 42, dt * 1.1);
    const egtTarget = this.isRocket ? 20 + st.n1 * 32 : 320 + st.n1 * 6.4 + st.burner * 420;
    st.egt = approach(st.egt, egtTarget, dt * 1.4);
    const thrust = this.maxThrust * (st.n1 / 100) ** 2.1 * (1 + st.burner * 0.55);
    const fuel = thrust * (this.isRocket ? 0.3 : 0.028) * (1 + st.burner * 0.6);

    if (st.n1 >= Math.max(10, idle - 1)) this.check('idle');
    if (st.n1 >= 98.5) this.check('full');
    if (st.burner > 0.9 && st.n1 > 95) this.check('burner');

    // Stage spin rates (fan slow, HP spool fast), combustor glow, plume + diamonds
    const base = st.n1 * 0.9;
    for (const { c, mult } of this.spinners) {
      const axis = c.userData?.spinAxis || 'x';
      c.rotation[axis] += dt * base * mult * 0.12;
    }
    const glow = clamp((st.n1 - idle) / (100 - idle), 0, 1);
    for (const m of this.glowMeshes) {
      m.material.emissive.setHex(st.burner > 0.3 ? 0xffd27a : 0xff7a1a);
      m.material.emissiveIntensity = (m.userData.simEmissive?.i || 0) + glow * 1.6 + st.burner * 1.2;
    }
    const len = (this.isRocket ? 0.4 : 0.15) + glow * (this.isRocket ? 2.8 : 1.3) + st.burner * 2.6;
    this.plume.scale.set(Math.max(0.001, len), 1 + st.burner * 0.35, 1 + st.burner * 0.35);
    this.core.material.opacity = 0.25 + glow * 0.4 + st.burner * 0.3;
    this.outer.material.opacity = 0.1 + glow * 0.22 + st.burner * 0.2;
    const flicker = 0.85 + Math.sin(this.elapsed * 43) * 0.15;
    const showDiamonds = st.burner > 0.6 || (this.isRocket && st.n1 > 60);
    for (const [i, d] of this.diamonds.entries()) {
      d.visible = showDiamonds;
      d.scale.set(1.6 * flicker, (1 - i * 0.1) * flicker, (1 - i * 0.1) * flicker);
    }
    v.rootGroup.position.y = Math.sin(this.elapsed * 60) * 0.0025 * (st.n1 / 100) * (1 + st.burner);

    Object.assign(this.telemetry, {
      n1: Math.round(st.n1),
      n2: Math.round(st.n2),
      egt: Math.round(st.egt),
      thrust: Math.round(thrust),
      fuel: fuel.toFixed(1),
      fuelBar: clamp((fuel / (this.maxThrust * (this.isRocket ? 0.3 : 0.028) * 1.6)) * 100, 0, 100),
      soundRpm: 900 + (st.n1 / 100) * 8000,
      soundThrottle: st.throttle * 0.8 + st.burner * 0.2,
    });
  }
}

// 🚀 Launch It! — Vertical orbital pad liftoff simulation: downward (-Y) multi-engine plume,
// Mach shock diamonds, water deluge steam clouds, umbilical tower release, and upward (+Y) ascent to orbit.
export class RocketLaunchSim extends BaseSim {
  constructor(viewer) {
    super(viewer, { engineSound: true, turbine: false });
    this.hideFloor = true;
    const id = viewer.currentObject?.activeModelId || '';
    this.maxThrust = /starship/i.test(id) ? 74000 : /saturn/i.test(id) ? 35100 : 7607;
    this.st = {
      throttle: 0.72,
      n1: 35,
      n2: 40,
      egt: 980,
      burner: 0,
      lit: true,
      altitude: 0,
      velocity: 0,
    };
    this.glowMeshes = [];
    this.steamPuffs = [];
  }

  onEnter() {
    const v = this.viewer;
    v.rootGroup.position.set(0, 0, 0);
    v.rootGroup.rotation.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(v.rootGroup);
    this.box = box;
    const baseY = box.min.y;
    const topY = box.max.y;
    const rocketH = Math.max(2.6, topY - baseY);
    const rocketR = Math.max(0.22, Math.min(0.45, (box.max.x - box.min.x) * 0.36));

    // World group scrolls downward (-Y) as the rocket ascends upward (+Y)
    this.world = new THREE.Group();
    this.env.add(this.world);

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82, metalness: 0.15 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.78 });
    const lightSteelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.38, metalness: 0.72 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.3 });
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.35, metalness: 0.25 });

    // Coastal ocean & concrete launch complex apron below the orbital launch mount
    const groundY = baseY - 0.75;
    const ocean = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 0.16, 48), oceanMat);
    ocean.position.set(0, groundY - 0.12, 0);
    this.world.add(ocean);

    const padApron = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.2, 0.24, 32), concreteMat);
    padApron.position.set(0, groundY, 0);
    this.world.add(padApron);

    // Flame trench & deflector ramp under the launch table
    const trench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.28, 3.2), darkSteelMat);
    trench.position.set(0, groundY + 0.12, 0);
    this.world.add(trench);

    // Orbital Launch Mount (OLM) table at baseY with 6 heavy steel support legs
    const olmRing = new THREE.Mesh(new THREE.CylinderGeometry(rocketR * 1.45, rocketR * 1.65, 0.22, 16), darkSteelMat);
    olmRing.position.set(0, baseY - 0.08, 0);
    this.world.add(olmRing);

    const hazardCollar = new THREE.Mesh(new THREE.TorusGeometry(rocketR * 1.52, 0.028, 10, 24), hazardMat);
    hazardCollar.rotation.x = Math.PI / 2;
    hazardCollar.position.set(0, baseY + 0.02, 0);
    this.world.add(hazardCollar);

    const legH = Math.max(0.45, baseY - groundY - 0.12);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, legH, 12), lightSteelMat);
      leg.position.set(Math.cos(a) * rocketR * 1.35, groundY + legH * 0.5 + 0.06, Math.sin(a) * rocketR * 1.35);
      this.world.add(leg);
    }

    // Launch Umbilical Tower ("Mechazilla" / LUT) standing vertically beside the rocket
    const towerX = -(rocketR * 2.25 + 0.38);
    const towerZ = -0.25;
    const towerH = rocketH + 0.85;
    const towerGroup = new THREE.Group();
    towerGroup.position.set(towerX, groundY + 0.12, towerZ);
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, towerH, 10), darkSteelMat);
      col.position.set(dx, towerH * 0.5, dz);
      towerGroup.add(col);
    }
    const levels = 9;
    for (let i = 1; i <= levels; i++) {
      const ly = (i / levels) * towerH;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.42), lightSteelMat);
      deck.position.set(0, ly, 0);
      towerGroup.add(deck);
    }
    // Lightning mast atop the tower
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.024, 0.65, 8), hazardMat);
    mast.position.set(0, towerH + 0.32, 0);
    towerGroup.add(mast);

    // Retracting Quick-Disconnect (QD) & Crew/Catch Arms
    this.qdArms = [];
    for (const frac of [0.32, 0.68]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(0.18, towerH * frac, 0.18);
      const armBeam = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(towerX) - rocketR * 0.85, 0.055, 0.08), hazardMat);
      armBeam.position.set((Math.abs(towerX) - rocketR * 0.85) * 0.5, 0, 0);
      armPivot.add(armBeam);
      towerGroup.add(armPivot);
      this.qdArms.push(armPivot);
    }
    this.world.add(towerGroup);

    // High-altitude atmospheric cloud layers + upper-space stars inside world
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95,
      transparent: true,
      opacity: 0.65,
    });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + (i % 3) * 0.3;
      const dist = 2.4 + (i % 5) * 1.4;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.45 + (i % 3) * 0.22, 12, 10), cloudMat);
      puff.scale.set(1.6, 0.42, 1.3);
      puff.position.set(Math.cos(a) * dist, 4.5 + i * 1.35, Math.sin(a) * dist);
      this.world.add(puff);
    }

    // Water deluge / exhaust steam clouds billowing around the pad base
    const steamMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.92,
      transparent: true,
      opacity: 0.75,
    });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), steamMat.clone());
      puff.position.set(Math.cos(a) * 0.35, baseY - 0.32, Math.sin(a) * 0.35);
      puff.userData = { angle: a, phase: i * 0.45, baseY: baseY - 0.32 };
      this.world.add(puff);
      this.steamPuffs.push(puff);
    }

    // Downward (-Y) Rocket Exhaust Plume + Mach Shock Diamonds pinned to the rocket's engine bells
    const mkCone = (col, r, op) => new THREE.Mesh(
      new THREE.ConeGeometry(r, 1, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const nozzleR = Math.max(0.2, rocketR * 0.92);
    this.baseY = baseY;
    this.plume = new THREE.Group();
    this.plume.position.set(0, baseY, 0);
    // ConeGeometry has apex at +0.5Y and open base at -0.5Y -> shifting by -0.5Y places apex at 0 and shoots straight DOWN (-Y)
    this.core = mkCone(0xdbeafe, nozzleR * 0.65, 0.78);
    this.outer = mkCone(0xff8c24, nozzleR * 1.25, 0.42);
    for (const c of [this.core, this.outer]) {
      c.position.y = -0.5;
      this.plume.add(c);
    }
    this.diamonds = [];
    const dMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(nozzleR * 0.34, 0), dMat);
      d.position.y = -0.22 - i * 0.26;
      d.scale.set(1, 1.55, 1);
      this.plume.add(d);
      this.diamonds.push(d);
    }
    this.plume.scale.set(1, 0.8, 1);
    this.env.add(this.plume);

    // Engine bells / thrust chamber glow
    this.glowMeshes = this.meshes(/engine|merlin|raptor|f1|nozzle|bell|thrust|booster/).filter(
      (m) => m.material && m.material.emissive,
    );
    for (const m of this.glowMeshes) {
      m.userData.simEmissive = { hex: m.material.emissive.getHex(), i: m.material.emissiveIntensity };
    }

    // Frame the full vertical rocket + launch tower + downward flame plume
    v.desiredSpherical.theta = 0.62;
    v.desiredSpherical.phi = 1.32;
    v.desiredSpherical.radius = Math.max(5.4, v.defaultSpherical.radius * 1.18);
  }

  onExit() {
    this.viewer.rootGroup.position.set(0, 0, 0);
    this.viewer.rootGroup.rotation.set(0, 0, 0);
    for (const m of this.glowMeshes) {
      const e = m.userData.simEmissive;
      if (e) {
        m.material.emissive.setHex(e.hex);
        m.material.emissiveIntensity = e.i;
      }
    }
  }

  onUpdate(dt) {
    const v = this.viewer;
    const st = this.st;
    const inp = this.inputs;

    if (inp.up) st.throttle = clamp(st.throttle + dt * 0.45, 0, 1);
    else if (inp.down) st.throttle = clamp(st.throttle - dt * 0.45, 0, 1);
    else if (this.elapsed < 3.5 && st.throttle < 0.88) {
      // Automatic launch sequence ramp-up on pad ignition
      st.throttle = clamp(st.throttle + dt * 0.18, 0, 0.92);
    }

    const burnerWanted = Boolean(inp.space) || st.throttle > 0.94;
    if (inp.space) st.throttle = clamp(st.throttle + dt * 0.85, 0, 1);
    st.burner = approach(st.burner, burnerWanted && st.throttle > 0.85 ? 1 : 0, dt * 3.5);

    const n1Target = st.throttle * 100;
    st.n1 = approach(st.n1, n1Target, dt * 1.6);
    st.n2 = approach(st.n2, Math.min(100, n1Target * 1.02), dt * 1.8);
    st.egt = approach(st.egt, 450 + st.n1 * 28.5 + st.burner * 380, dt * 2.0);

    const thrust = this.maxThrust * (st.n1 / 100) ** 1.85 * (1 + st.burner * 0.25);
    const fuel = thrust * 0.28 * (1 + st.burner * 0.35);

    if (st.n1 >= 20) {
      this.check('idle');
      this.check('ignite');
    }
    if (st.altitude >= 1.1) {
      this.check('liftoff');
    }
    if (st.n1 >= 96 || (st.burner > 0.8 && st.n1 > 88)) {
      this.check('full');
      this.check('burner');
      this.check('maxq');
    }

    // Vertical upward liftoff physics (+Y ascent!)
    const twr = (st.n1 / 100) * (1 + st.burner * 0.25);
    if (twr > 0.45) {
      const accel = (twr - 0.45) * 4.2;
      st.velocity = clamp(st.velocity + accel * dt, 0, 14);
    } else {
      st.velocity = approach(st.velocity, 0, dt * 2.5);
    }
    st.altitude += st.velocity * dt;
    if (st.altitude > 36) st.altitude = 4 + ((st.altitude - 4) % 32);

    // Swing Quick-Disconnect arms back as soon as liftoff begins
    const qdSwing = clamp(st.altitude * 1.8 + (st.n1 > 50 ? 0.55 : 0), 0, 1.15);
    for (const arm of this.qdArms) {
      arm.rotation.y = -qdSwing;
    }

    // Rocket rises upward (+Y) into the frame while the launch pad & clouds scroll downward (-Y)
    const vib = (Math.random() - 0.5) * 0.008 * (st.n1 / 100);
    const rocketRiseY = Math.min(0.85, st.altitude * 0.18) + vib;
    v.rootGroup.position.set(vib * 0.5, rocketRiseY, 0);
    this.world.position.y = -st.altitude;

    // Downward (-Y) exhaust plume stays pinned to the bottom of the ascending rocket's engine bells
    this.plume.position.set(0, this.baseY + rocketRiseY, 0);
    const glow = clamp(st.n1 / 100, 0, 1);
    const plumeLen = 0.25 + glow * 2.4 + st.burner * 1.4;
    const plumeWidth = 0.85 + glow * 0.35 + st.burner * 0.35;
    this.plume.scale.set(plumeWidth, Math.max(0.01, plumeLen), plumeWidth);
    this.core.material.opacity = 0.35 + glow * 0.48 + st.burner * 0.15;
    this.outer.material.opacity = 0.16 + glow * 0.28 + st.burner * 0.18;

    const flicker = 0.88 + Math.sin(this.elapsed * 48) * 0.12;
    const showDiamonds = st.n1 > 35;
    for (const [i, d] of this.diamonds.entries()) {
      d.visible = showDiamonds;
      const s = (1 - i * 0.11) * flicker;
      d.scale.set(s, 1.55 * flicker, s);
    }

    // Billow pad water-deluge steam clouds outward along the pad as exhaust hits the flame trench
    const padProximity = clamp(1 - st.altitude / 5.5, 0, 1);
    for (const puff of this.steamPuffs) {
      const cycle = ((this.elapsed * (0.9 + glow * 1.4) + puff.userData.phase) % 2.4) / 2.4;
      const rad = 0.3 + cycle * (1.8 + glow * 2.2);
      puff.position.x = Math.cos(puff.userData.angle) * rad;
      puff.position.z = Math.sin(puff.userData.angle) * rad;
      puff.position.y = puff.userData.baseY + cycle * 0.55;
      const sc = (0.65 + cycle * 2.2) * (0.3 + glow * 0.9);
      puff.scale.set(sc * 1.3, sc * 0.75, sc * 1.3);
      puff.material.opacity = (1 - cycle) * 0.65 * padProximity * glow;
    }

    for (const m of this.glowMeshes) {
      m.material.emissive.setHex(st.burner > 0.3 ? 0xfff0b3 : 0xff8a2b);
      m.material.emissiveIntensity = (m.userData.simEmissive?.i || 0) + glow * 1.8 + st.burner * 1.1;
    }

    const altKm = (st.altitude * 3.4).toFixed(1);
    const velKms = (st.velocity * 0.56).toFixed(2);
    Object.assign(this.telemetry, {
      throttle: Math.round(st.n1),
      altitude: `${altKm} km`,
      velocity: `${velKms}`,
      n1: Math.round(st.n1),
      n2: Math.round(st.n2),
      egt: Math.round(st.egt),
      thrust: Math.round(thrust),
      fuel: fuel.toFixed(0),
      fuelBar: clamp((st.n1 / 100) * 100, 0, 100),
      soundRpm: 1100 + (st.n1 / 100) * 7500,
      soundThrottle: clamp(st.throttle * 0.85 + st.burner * 0.15, 0, 1),
    });
  }
}

