// ============================================================================
// Iron Man Mark LXXXV (85) — Avengers: Endgame Nano-Tech Exoskeleton (Ryan Meinerding Blueprint Sculpture)
//
// Sculpted directly from the official MCU Avengers: Endgame Mark 85 studio turnaround and Ryan Meinerding
// concept blueprints:
// 1. Authentic Tales-of-Suspense / Mark 85 Color Blocking:
//    - Helmet: Gold faceplate with deep crimson widow's-peak forehead V, crimson jaw/cheek guards, crimson
//      chin center wedge, recessed gunmetal eye sockets, and slanted cyan-white F.R.I.D.A.Y. eye slits.
//    - Chest & Abdomen: 100% Deep Candy Crimson thoracic carapace and 4-tier crimson V-chevron abdominal
//      plates flanked by gold & silver-titanium oblique rib struts and 6 glowing white-cyan micro-RT ports
//      (2 collarbone + 4 oblique rib/hip ports).
//    - Chest RT Arc Reactor: Rounded-inverted-triangle / trapezoidal heart housing with a beveled silver-
//      gunmetal frame, geometric internal lattice struts, and a brilliant cyan-white core.
//    - Shoulders & Arms: Gold-titanium sculpted deltoid pauldrons with a crimson upper collar rim, gold
//      anatomical biceps/triceps with recessed muscle grooves, crimson contoured forearm gauntlets with
//      silver-champagne upper/wrist cuffs, and articulated crimson hands with palm repulsors.
//    - Pelvis & Legs: Seamless crimson anatomical pelvis/codpiece with symmetric hip armor flares (zero Lego
//      hip gap), primarily GOLD sculpted quadriceps thighs with a symmetric crimson upper-outer hip sweep and
//      gunmetal inner mechanical frame, gold/gunmetal articulated knee guards, and 100% crimson shin greaves
//      + multi-faceted crimson combat boots with silver under-knee V-collars and gunmetal soles.
//    - Dorsal Back & Nano-Lightning Refocuser: Gold Y-shaped scapular yoke over crimson/gunmetal dorsal
//      plates, and the deployed 6-wing X-configuration Nano-Lightning Refocuser pods with glowing internal
//      energy capacitor cells.
// ============================================================================
import * as THREE from '../../vendor/three.module.js';
import { carPaint, brushedMetal, chromeMat, glassMat, emissiveMat, mat, extrudeProfile } from '../materials.js';
import { loftRings, surfaceGrid, MeshBatch, smoothCurve, smoothstep, cachedCanvasTexture } from '../loft.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const gauss = (x, mu, sig) => Math.exp(-0.5 * ((x - mu) / sig) ** 2);

// ----------------------------------------------------------------------------
// Procedural micro-seam & panel-line bump map for nano-armor surfaces
// ----------------------------------------------------------------------------
function nanoPanelBumpTex() {
  return cachedCanvasTexture(
    'mark85-nano-panel-bump-v6',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(115,115,115,0.22)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#383838';
      ctx.lineWidth = 2;
      for (const yFrac of [0.18, 0.38, 0.58, 0.78]) {
        const y = yFrac * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w * 0.35, y + 14);
        ctx.lineTo(w * 0.5, y + 4);
        ctx.lineTo(w * 0.65, y + 14);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    { repeat: [2, 2], linear: true },
  );
}

// ----------------------------------------------------------------------------
// Axial loft helpers with anatomical harmonic cross-section modulation
// ----------------------------------------------------------------------------

/** Orthonormal frame: d = loft axis, e1 = "front" reference (projection of `up` ⟂ d), e2 = d × e1. */
function axisFrame(origin, axis, up = [1, 0, 0]) {
  const o = V3(origin);
  const d = V3(axis).normalize();
  let e1 = V3(up);
  e1.sub(d.clone().multiplyScalar(e1.dot(d)));
  if (e1.lengthSq() < 1e-8) e1 = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  e1.sub(d.clone().multiplyScalar(e1.dot(d))).normalize();
  const e2 = new THREE.Vector3().crossVectors(d, e1).normalize();
  return { o, d, e1, e2 };
}

/**
 * Smoothly interpolated station parameters. Stations: [{ t, r1, r1n?, r2, n?, c1?, c2? }] sorted by t.
 * r1 = radius toward +e1 (front), r1n = radius toward -e1 (back, defaults to r1), r2 = radius along ±e2,
 * n = squareness (2 = ellipse, 3+ = faceted armor), c1/c2 = section centre offsets along e1/e2.
 */
function stationSampler(stations) {
  const field = (key, fallback) => {
    const knots = stations.map((s) => [s.t, s[key] ?? (typeof fallback === 'function' ? fallback(s) : fallback)]);
    return smoothCurve(knots);
  };
  const f1 = field('r1', 0.1);
  const f1n = field('r1n', (s) => s.r1 ?? 0.1);
  const f2 = field('r2', (s) => s.r1 ?? 0.1);
  const fn = field('n', 2.5);
  const fc1 = field('c1', 0);
  const fc2 = field('c2', 0);
  return (t) => ({ r1: f1(t), r1n: f1n(t), r2: f2(t), n: fn(t), c1: fc1(t), c2: fc2(t) });
}

/** Point on a superellipse ring: a = 0 points toward +e1, a = +PI/2 toward +e2. radial scales the section. */
function ringPoint(frame, len, t, a, p, radial = 1) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const e = 2 / p.n;
  const u1 = (c >= 0 ? p.r1 : p.r1n) * Math.sign(c) * Math.abs(c) ** e;
  const u2 = p.r2 * Math.sign(s) * Math.abs(s) ** e;
  const x = frame.o.x + frame.d.x * len * t + frame.e1.x * (u1 * radial + p.c1) + frame.e2.x * (u2 * radial + p.c2);
  const y = frame.o.y + frame.d.y * len * t + frame.e1.y * (u1 * radial + p.c1) + frame.e2.y * (u2 * radial + p.c2);
  const z = frame.o.z + frame.d.z * len * t + frame.e1.z * (u1 * radial + p.c1) + frame.e2.z * (u2 * radial + p.c2);
  return [x, y, z];
}

/** Normalize any angle to [-PI, PI] so `radial(t, a)` is always continuous across a = ±PI. */
function wrapPi(a) {
  let w = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return w;
}

/**
 * Closed loft of superellipse rings along an axis with dense axial resampling (`steps`) and optional
 * anatomical harmonic modulation `radial(t, a)` where `a` is angle in radians (-PI..PI).
 */
function axialLoft({ origin, axis, up, length, stations, N = 48, steps = 0, capStart = false, capEnd = false, radial = null }) {
  const frame = axisFrame(origin, axis, up);
  const sample = stationSampler(stations);
  const tMin = stations[0].t;
  const tMax = stations[stations.length - 1].t;
  const ts = [];
  if (steps > 0) {
    for (let i = 0; i <= steps; i++) ts.push(lerp(tMin, tMax, i / steps));
  } else {
    for (const st of stations) ts.push(st.t);
  }
  const rings = ts.map((t) => {
    const p = sample(t);
    const ring = [];
    for (let j = 0; j < N; j++) {
      const a = wrapPi((j / N) * TAU);
      const rad = radial ? radial(t, a) : 1;
      ring.push(ringPoint(frame, length, t, a, p, rad));
    }
    return ring;
  });
  return loftRings(rings, { capStart, capEnd });
}

/**
 * Open contoured armor plate patch over angles `aFrom..aTo` (rad) and axial range `tFrom..tTo`.
 * Includes subtle edge bevel drop-off so each armor plate looks like a thick forged shell rather than paper.
 */
function axialPatch({
  origin,
  axis,
  up,
  length,
  stations,
  aFrom,
  aTo,
  tFrom,
  tTo,
  ns = 12,
  nt = 16,
  offset = 0,
  bump = null,
  radial = null,
}) {
  const frame = axisFrame(origin, axis, up);
  const sample = stationSampler(stations);
  const t0 = typeof tFrom === 'function' ? tFrom : () => tFrom;
  const t1 = typeof tTo === 'function' ? tTo : () => tTo;
  const a0 = typeof aFrom === 'function' ? aFrom : () => aFrom;
  const a1 = typeof aTo === 'function' ? aTo : () => aTo;
  const fn = (s, u) => {
    const t = lerp(t0(u), t1(u), s);
    const a = wrapPi(lerp(a0(s), a1(s), u));
    const p = sample(clamp(t, 0, 1));
    const baseRad = radial ? radial(clamp(t, 0, 1), a) : 1;
    const extra = bump ? bump(s, u) : 0;
    return ringPoint(frame, length, t, a, p, baseRad + extra);
  };
  return surfaceGrid(fn, {
    ns,
    nt,
    offset,
    outward: (pt) => {
      const rel = new THREE.Vector3(pt[0] - frame.o.x, pt[1] - frame.o.y, pt[2] - frame.o.z);
      rel.sub(frame.d.clone().multiplyScalar(rel.dot(frame.d)));
      return [rel.x, rel.y, rel.z];
    },
  });
}

/** Surface radius toward +e1 ("front" x) at axial fraction t and lateral fraction of r2 (0 = centre). */
function frontDepthAt(stations, t, lateralFrac = 0) {
  const p = stationSampler(stations)(clamp(t, 0, 1));
  const u = clamp(Math.abs(lateralFrac), 0, 1);
  return p.c1 + p.r1 * Math.max(0, 1 - u ** p.n) ** (1 / p.n);
}

/** Euler rotation that maps local +Y onto `dir`. */
function eulerAlong(dir, roll = 0) {
  const d = V3(dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

/** Group placed at `origin` whose local +Y = dir and local +Z = normal (for hands, pods, reactor). */
function framedGroup(parent, origin, dir, normal) {
  const y = V3(dir).normalize();
  const z = V3(normal);
  z.sub(y.clone().multiplyScalar(z.dot(y))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  const grp = new THREE.Group();
  grp.position.set(origin[0], origin[1], origin[2]);
  grp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  parent.add(grp);
  return grp;
}

// ----------------------------------------------------------------------------
// Anatomical Heroic Proportions & Stance (Feet on y = -1.0, crown at y = 1.33)
// ----------------------------------------------------------------------------
// Torso runs from lower pelvis/groin (y = 0.01) up to base of neck/trapezius (y = 0.99) so there is
// ZERO horizontal Lego gap between pelvis and thighs.
const TORSO = {
  origin: [0, 0.01, 0],
  axis: [0, 1, 0],
  up: [1, 0, 0],
  length: 0.98, // y 0.01 -> 0.99
  stations: [
    { t: 0.0, r1: 0.115, r1n: 0.115, r2: 0.135, n: 2.3, c1: 0.008 }, // groin / perineal base (y=0.01)
    { t: 0.09, r1: 0.152, r1n: 0.148, r2: 0.228, n: 2.6, c1: 0.01 }, // lower pelvis / glute sweep (y=0.10)
    { t: 0.18, r1: 0.158, r1n: 0.152, r2: 0.242, n: 2.8, c1: 0.01 }, // iliac crest / hip flare (y=0.19)
    { t: 0.28, r1: 0.138, r1n: 0.132, r2: 0.198, n: 2.6, c1: 0.006 }, // anatomical waist taper (y=0.29)
    { t: 0.40, r1: 0.148, r1n: 0.138, r2: 0.212, n: 2.7, c1: 0.01 }, // mid-abdomen / obliques (y=0.41)
    { t: 0.54, r1: 0.172, r1n: 0.154, r2: 0.252, n: 3.0, c1: 0.014 }, // lower ribcage / serratus (y=0.55)
    { t: 0.69, r1: 0.196, r1n: 0.168, r2: 0.292, n: 3.3, c1: 0.016 }, // lower pectoral shelf (y=0.69)
    { t: 0.80, r1: 0.202, r1n: 0.172, r2: 0.308, n: 3.3, c1: 0.015 }, // broad heroic chest / lats peak (y=0.79)
    { t: 0.90, r1: 0.160, r1n: 0.148, r2: 0.262, n: 2.9, c1: 0.008 }, // clavicles / upper traps (y=0.89)
    { t: 0.96, r1: 0.106, r1n: 0.110, r2: 0.168, n: 2.5, c1: 0.002 }, // trapezius slope (y=0.95)
    { t: 1.0, r1: 0.074, r1n: 0.080, r2: 0.098, n: 2.4, c1: 0.0 }, // neck collar ring (y=0.99)
  ],
  // Anatomical muscle & armor crease modulation around the torso (all fade smoothly to 0 as t -> 0.94..1.0)
  radial(t, a) {
    const absA = Math.abs(a);
    const topFade = 1 - smoothstep(0.88, 0.96, t);
    // Sternum central groove between pectorals
    const sternumGroove = -0.045 * gauss(absA, 0, 0.07) * gauss(t, 0.74, 0.10);
    // Pectoral muscle swell on left and right chest (chiseled, not ballooned)
    const pecBulge = 0.032 * gauss(absA, 0.42, 0.22) * gauss(t, 0.75, 0.08);
    // Abdominal linea alba + 4 horizontal chevron creases
    const abCenterGroove = -0.024 * gauss(absA, 0, 0.06) * gauss(t, 0.38, 0.13);
    const abRibWave = 0.016 * Math.sin(t * 44) * gauss(absA, 0.18, 0.18) * gauss(t, 0.39, 0.12);
    // Latissimus dorsi V-taper flare and deep spinal furrow on the back
    const latFlare = 0.038 * gauss(absA, 1.85, 0.35) * gauss(t, 0.70, 0.13);
    const spineGroove = -0.046 * gauss(absA, Math.PI, 0.14) * gauss(t, 0.62, 0.20);
    // Gluteal swell at lower back
    const gluteBulge = 0.055 * gauss(absA, 2.65, 0.30) * gauss(t, 0.11, 0.06);
    return 1 + topFade * (sternumGroove + pecBulge + abCenterGroove + abRibWave + latFlare + spineGroove + gluteBulge);
  },
};
const T_AT = (y) => (y - TORSO.origin[1]) / TORSO.length;
const torsoSample = stationSampler(TORSO.stations);
const torsoFrontX = (y, zFrac = 0) => frontDepthAt(TORSO.stations, T_AT(y), zFrac);
const torsoBackX = (y) => {
  const p = torsoSample(clamp(T_AT(y), 0, 1));
  return p.c1 - p.r1n;
};

// Heroic A-stance joint coordinates (natural athletic posture from im_infobox.png & concept2.png)
const SHOULDER = (side) => [-0.01, 0.835, side * 0.355];
const ELBOW = (side) => [-0.035, 0.50, side * 0.445];
const WRIST = (side) => [0.095, 0.19, side * 0.485];
const HIP = (side) => [0.005, 0.11, side * 0.152];
const KNEE = (side) => [0.025, -0.37, side * 0.182];
const ANKLE = (side) => [-0.01, -0.85, side * 0.208];

// Sculpted MCU Mark 85 Helmet with angular jawline, cheekbone planes, and sleek cranial dome
const HELMET = {
  origin: [0.0, 0.985, 0],
  axis: [0, 1, 0],
  up: [1, 0, 0],
  length: 0.34, // y 0.985 -> 1.325
  stations: [
    { t: 0.0, r1: 0.072, r1n: 0.078, r2: 0.060, n: 3.2, c1: 0.022 }, // sharp angular chin apex
    { t: 0.14, r1: 0.110, r1n: 0.104, r2: 0.095, n: 3.3, c1: 0.020 }, // angular jawline / mouth
    { t: 0.34, r1: 0.120, r1n: 0.124, r2: 0.110, n: 3.3, c1: 0.014 }, // sculpted cheekbones
    { t: 0.54, r1: 0.118, r1n: 0.134, r2: 0.114, n: 3.1, c1: 0.008 }, // menacing brow ridge & temples
    { t: 0.74, r1: 0.102, r1n: 0.126, r2: 0.102, n: 2.7, c1: -0.002 }, // forehead / widow's peak
    { t: 0.90, r1: 0.066, r1n: 0.090, r2: 0.072, n: 2.4, c1: -0.012 }, // upper cranium
    { t: 1.0, r1: 0.0, r1n: 0.0, r2: 0.0, n: 2.2, c1: -0.020 }, // crown apex
  ],
  radial(t, a) {
    const absA = Math.abs(a);
    const cheekbone = 0.038 * gauss(absA, 0.55, 0.18) * gauss(t, 0.38, 0.10);
    const cheekHollow = -0.030 * gauss(absA, 0.48, 0.16) * gauss(t, 0.22, 0.08);
    const brow = 0.036 * gauss(absA, 0.28, 0.24) * gauss(t, 0.56, 0.06);
    const eyeTrough = -0.042 * gauss(absA, 0.32, 0.18) * gauss(t, 0.48, 0.045);
    return 1 + cheekbone + cheekHollow + brow + eyeTrough;
  },
};
const H_AT = (y) => (y - HELMET.origin[1]) / HELMET.length;

export function buildIronManMark85Model() {
  const bumpTex = nanoPanelBumpTex();

  // --- Authentic MCU Mark 85 PBR Materials ---
  const withBump = (m, scale) => {
    m.bumpMap = bumpTex;
    m.bumpScale = scale;
    m.side = THREE.DoubleSide;
    return m;
  };
  const hotRodRed = withBump(carPaint(0x980b15, { roughness: 0.16, metalness: 0.68, doubleSide: true }), 0.0022);
  const deepRed = withBump(carPaint(0x58060d, { roughness: 0.24, metalness: 0.65, doubleSide: true }), 0.0018);
  const gold = withBump(brushedMetal(0xdba628, { roughness: 0.18, metalness: 0.94, clearcoat: 0.75, doubleSide: true }), 0.0018);
  const gunmetal = withBump(brushedMetal(0x232933, { roughness: 0.36, metalness: 0.88, doubleSide: true }), 0.0025);
  const silver = chromeMat(0xd8e0e8);
  silver.side = THREE.DoubleSide;
  const matte = mat(0x0f141c, { roughness: 0.65, metalness: 0.45 });
  const arcWhite = emissiveMat(0xf0fcff, 4.8);
  const arcCyan = emissiveMat(0x5ce1ff, 3.2);
  const thrustBlue = emissiveMat(0x68d8ff, 2.6);
  const reactorGlass = glassMat(0xc8eeff, 0.34);

  // Shared anatomical limb builder with harmonic cross-section modulation
  const sculptedLimb = (
    batch,
    from,
    to,
    stations,
    material,
    { up = [1, 0, 0], N = 48, steps = 22, capStart = true, capEnd = true, radial = null } = {},
  ) => {
    const axis = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const length = Math.hypot(axis[0], axis[1], axis[2]);
    batch.add(axialLoft({ origin: from, axis, up, length, stations, N, steps, capStart, capEnd, radial }), material);
    return { origin: from, axis, up, length, stations, radial };
  };

  // Surface-conforming micro-RT glowing port (the 6 signature glowing white-cyan nodes on the Mark 85 torso)
  const addMicroRT = (batch, pos, rot) => {
    batch.rbox(0.010, 0.020, 0.032, 0.003, silver, pos, rot);
    batch.rbox(0.012, 0.011, 0.020, 0.002, arcWhite, [pos[0] + 0.003, pos[1], pos[2]], rot);
  };

  const parts = [
    // ========================================================================
    // 1. HELMET, SCULPTED NECK & F.R.I.D.A.Y. HUD EYES
    // ========================================================================
    {
      id: 'mark85-helmet-hud',
      name: 'Mark LXXXV Gold-Titanium Faceplate, Crimson Widow’s-Peak Helmet & F.R.I.D.A.Y. HUD Eyes',
      category: 'Helmet & Avionics',
      isOuter: true,
      explodeOffset: [0.25, 1.55, 0],
      desc: 'Blueprint-accurate Mark 85 helmet featuring the sculpted gold-titanium faceplate, deep crimson widow’s-peak forehead V, crimson jaw/cheek guards and crimson center chin wedge, recessed gunmetal brow sockets with slanted cyan-white F.R.I.D.A.Y. HUD eyes, and segmented crimson/gunmetal muscular neck armor.',
      funFact: 'Unlike early suits that needed robotic arms to bolt on, the Mark 85 helmet forms out of microscopic gold-titanium nanoparticles in less than a second!',
      build(g) {
        const b = new MeshBatch();
        // Base crimson cranial shell with sculpted cheekbone/brow harmonics
        b.add(axialLoft({ ...HELMET, N: 56, steps: 28 }), hotRodRed);

        // Gold faceplate reaching down to the sharp angular jaw and framing the crimson widow's peak
        const faceA = 0.37 * Math.PI;
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -faceA,
            aTo: faceA,
            tFrom: (u) => {
              const d = Math.abs(u - 0.5) * 2;
              return H_AT(0.996 + 0.048 * d ** 1.5);
            },
            tTo: (u) => {
              const d = Math.abs(u - 0.5) * 2;
              return H_AT(1.195 + 0.075 * Math.sin(Math.min(1, d * 1.35) * (Math.PI / 2)));
            },
            ns: 18,
            nt: 26,
            offset: 0.0045,
          }),
          gold,
        );

        // Compact crimson center chin guard at the very tip of the jawline
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -0.075 * Math.PI,
            aTo: 0.075 * Math.PI,
            tFrom: H_AT(0.988),
            tTo: (u) => H_AT(1.028 - 0.010 * Math.abs(u - 0.5) * 2),
            ns: 6,
            nt: 8,
            offset: 0.006,
          }),
          hotRodRed,
        );

        // Crimson widow's-peak center forehead crest plate
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: (s) => -(0.045 + 0.12 * s) * Math.PI,
            aTo: (s) => (0.045 + 0.12 * s) * Math.PI,
            tFrom: H_AT(1.188),
            tTo: H_AT(1.305),
            ns: 12,
            nt: 12,
            offset: 0.006,
          }),
          hotRodRed,
        );
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -0.018 * Math.PI,
            aTo: 0.018 * Math.PI,
            tFrom: H_AT(1.20),
            tTo: H_AT(1.30),
            ns: 8,
            nt: 4,
            offset: 0.0075,
          }),
          deepRed,
        );

        for (const side of [-1, 1]) {
          // Crimson angular jaw & cheek guard plates framing the lower sides of the gold faceplate (u=0 inner, u=1 outer)
          b.add(
            axialPatch({
              ...HELMET,
              aFrom: side * 0.22 * Math.PI,
              aTo: side * 0.58 * Math.PI,
              tFrom: H_AT(1.01),
              tTo: (u) => H_AT(1.145 + 0.08 * u),
              ns: 12,
              nt: 12,
              offset: 0.006,
            }),
            hotRodRed,
          );
          // Dark gunmetal cheekbone panel seam line
          b.add(
            axialPatch({
              ...HELMET,
              aFrom: (s) => side * lerp(0.14, 0.25, s) * Math.PI,
              aTo: (s) => side * (lerp(0.14, 0.25, s) + 0.016) * Math.PI,
              tFrom: H_AT(1.055),
              tTo: H_AT(1.155),
              ns: 10,
              nt: 4,
              offset: 0.0055,
            }),
            matte,
          );

          // Narrow, menacing recessed gunmetal eye bezel + glowing cyan-white F.R.I.D.A.Y. slit
          const ey = 1.158;
          const ez = side * 0.044;
          const ex = frontDepthAt(HELMET.stations, H_AT(ey), Math.abs(ez) / 0.114);
          const yaw = -side * 0.38;
          const roll = side * 0.16;
          b.rbox(0.012, 0.018, 0.056, 0.003, matte, [ex + 0.002, ey, ez], [roll, yaw, 0]);
          b.rbox(0.010, 0.0085, 0.046, 0.002, arcWhite, [ex + 0.006, ey - 0.001, ez], [roll, yaw, 0]);
          b.rbox(0.008, 0.011, 0.050, 0.002, arcCyan, [ex + 0.004, ey - 0.001, ez], [roll, yaw, 0]);

          // Recessed ear/temple mechanical aperture
          b.cyl(0.026, 0.026, 0.010, 20, gunmetal, [-0.005, 1.135, side * 0.112], [Math.PI / 2, 0, 0]);
          b.torus(0.022, 0.004, silver, [-0.005, 1.135, side * 0.116], [0, 0, 0]);
        }

        // Angular frowning mouth slit above the crimson chin wedge (roll in YZ plane is around X axis!)
        const mx = frontDepthAt(HELMET.stations, H_AT(1.052));
        b.rbox(0.008, 0.005, 0.048, 0.0015, matte, [mx + 0.005, 1.052, 0]);
        for (const side of [-1, 1]) {
          b.rbox(0.008, 0.005, 0.022, 0.0015, matte, [mx + 0.001, 1.047, side * 0.031], [side * 0.25, -side * 0.35, 0]);
        }

        // Sculpted anatomical neck & trapezius collar (gunmetal + crimson muscular collar rings)
        const neckSpec = {
          origin: [0, 0.895, 0],
          axis: [0, 1, 0],
          up: [1, 0, 0],
          length: 0.13, // y 0.895 -> 1.025
          stations: [
            { t: 0.0, r1: 0.112, r1n: 0.118, r2: 0.164, n: 2.5, c1: 0.004 }, // broad trapezius base
            { t: 0.45, r1: 0.078, r1n: 0.086, r2: 0.098, n: 2.4, c1: 0.004 }, // mid-neck
            { t: 1.0, r1: 0.066, r1n: 0.074, r2: 0.074, n: 2.4, c1: 0.004 }, // sub-jaw collar
          ],
        };
        b.add(axialLoft({ ...neckSpec, N: 36, steps: 12 }), gunmetal);
        // Segmented crimson sternocleidomastoid & trapezius armor plates on the neck
        for (const [idx, [t0, t1]] of [[0.04, 0.34], [0.40, 0.66], [0.72, 0.92]].entries()) {
          b.add(
            axialPatch({
              ...neckSpec,
              aFrom: -0.78 * Math.PI,
              aTo: 0.78 * Math.PI,
              tFrom: t0,
              tTo: t1,
              ns: 5,
              nt: 18,
              offset: 0.0045,
            }),
            idx === 1 ? deepRed : hotRodRed,
          );
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 2. SCULPTED CRIMSON CHEST CARAPACE & TRAPEZOIDAL RT ARC REACTOR
    // ========================================================================
    {
      id: 'arc-reactor-chestplate',
      name: 'Sculpted Crimson Thoracic Carapace, Clavicle Micro-RTs & Trapezoidal RT Arc Reactor',
      category: 'Power Core & Torso',
      isOuter: true,
      explodeOffset: [1.65, 0.45, 0],
      desc: 'Movie-accurate 100% deep candy crimson thoracic armor with multi-plane pectoral plates, silver/gunmetal collarbone brackets housing two glowing micro-RT ports, gold upper-rib side accents, and the recessed rounded-inverted-triangle (trapezoidal heart) Mark 85 RT Arc Reactor.',
      funFact: 'The Mark 85 chest Arc Reactor returns to a sleek rounded-triangle shape and powers both the liquid-metal nanotech swarm and the suit’s plasma repulsors simultaneously!',
      build(g) {
        const b = new MeshBatch();
        // Upper-torso gunmetal under-suit loft (t = 0.54 .. 1.0, meets abdominal-pelvis-armor at t = 0.54 with zero overlap)
        b.add(
          axialLoft({
            ...TORSO,
            stations: TORSO.stations.filter((s) => s.t >= 0.54),
            N: 52,
            steps: 20,
            capStart: true,
            capEnd: true,
          }),
          gunmetal,
        );

        // Central crimson sternum bezel framing the Arc Reactor (recessed 1.5mm below the pecs for a crisp step seam)
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: -0.105 * Math.PI,
            aTo: 0.105 * Math.PI,
            tFrom: T_AT(0.618),
            tTo: T_AT(0.896),
            ns: 14,
            nt: 14,
            offset: 0.008,
          }),
          hotRodRed,
        );

        for (const side of [-1, 1]) {
          // Note: since both `aFrom` and `aTo` are multiplied by `side`, `u = 0` is ALWAYS the inner edge
          // and `u = 1` is ALWAYS the outer edge for both left (-1) and right (+1)!
          // Because `ringPoint` raises `|sin(a)|` to `2/n ≈ 0.60`, `0.0004 * PI` gives a true 3.5mm hairline center seam!

          // Main sculpted crimson pectoral carapace plate (chiseled heroic chest with crisp hairline panel seams)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: (s) => side * lerp(0.0004, 0.105, smoothstep(0.18, 0.62, s)) * Math.PI,
              aTo: side * 0.46 * Math.PI,
              tFrom: (u) => T_AT(0.618 + 0.032 * u),
              tTo: (u) => T_AT(0.896 - 0.020 * u),
              ns: 20,
              nt: 22,
              offset: 0.0095,
              bump: (s, u) => 0.016 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u),
            }),
            hotRodRed,
          );

          // Upper crimson trapezius / collarbone yoke (separated from pecs by a tight 6mm recessed panel line)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.0004 * Math.PI,
              aTo: side * 0.52 * Math.PI,
              tFrom: (u) => T_AT(0.903 - 0.020 * u),
              tTo: (u) => T_AT(0.985 - 0.030 * u),
              ns: 10,
              nt: 16,
              offset: 0.0085,
            }),
            hotRodRed,
          );

          // Silver-titanium collarbone accent strip leading into the clavicle micro-RT
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.11 * Math.PI,
              aTo: side * 0.31 * Math.PI,
              tFrom: (u) => T_AT(0.894 - 0.015 * u),
              tTo: (u) => T_AT(0.906 - 0.015 * u),
              ns: 4,
              nt: 10,
              offset: 0.0095,
            }),
            silver,
          );

          // Lower crimson sub-pectoral rib plate (tucks under the pectoral shelf with a crisp 3.5mm center hairline seam)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.0004 * Math.PI,
              aTo: side * 0.365 * Math.PI,
              tFrom: (u) => T_AT(0.505 + 0.038 * u),
              tTo: (u) => T_AT(0.612 + 0.032 * u),
              ns: 10,
              nt: 16,
              offset: 0.0075,
            }),
            hotRodRed,
          );

          // Gold lateral serratus / outer-rib accent plate under the armpit (visible in im_infobox.png)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.372 * Math.PI,
              aTo: side * 0.54 * Math.PI,
              tFrom: T_AT(0.52),
              tTo: T_AT(0.68),
              ns: 10,
              nt: 10,
              offset: 0.008,
            }),
            gold,
          );

          // Silver-titanium upper-chest clavicle bracket + glowing collarbone micro-RT port
          // Note: Euler Z rotation (pitch in XY plane) is independent of `side`!
          const cy = 0.878;
          const cz = side * 0.135;
          const cx = torsoFrontX(cy, Math.abs(cz) / 0.27);
          addMicroRT(b, [cx + 0.010, cy, cz], [side * 0.16, -side * 0.38, -0.18]);
        }

        // --- Rounded-Inverted-Triangle (Trapezoidal Heart) Mark 85 RT Arc Reactor ---
        const ry = 0.768;
        const rx = torsoFrontX(ry) + 0.014;
        const rtGrp = framedGroup(g, [rx, ry, 0], [0, 1, 0], [1, -0.06, 0]);
        const outerRT = [
          [-0.054, 0.048],
          [0.054, 0.048],
          [0.066, 0.022],
          [0.045, -0.030],
          [0.016, -0.060],
          [-0.016, -0.060],
          [-0.045, -0.030],
          [-0.066, 0.022],
        ];
        const innerRT = outerRT.map(([x, y]) => [x * 0.78, y * 0.78]);
        const coreRT = outerRT.map(([x, y]) => [x * 0.54, y * 0.54]);
        extrudeProfile(rtGrp, outerRT, 0.018, gunmetal, [0, 0, -0.006], [0, 0, 0], 0.004);
        extrudeProfile(rtGrp, innerRT, 0.020, silver, [0, 0, -0.003], [0, 0, 0], 0.003);
        extrudeProfile(rtGrp, innerRT.map(([x, y]) => [x * 0.90, y * 0.90]), 0.022, arcCyan, [0, 0, 0.0], [0, 0, 0], 0.002);
        extrudeProfile(rtGrp, coreRT, 0.025, arcWhite, [0, 0, 0.002], [0, 0, 0], 0.002);

        // Internal geometric Mark 85 Arc Reactor lattice bars across the glowing face
        const rb = new MeshBatch();
        for (const side of [-1, 1]) {
          rb.rbox(0.005, 0.056, 0.006, 0.001, gunmetal, [side * 0.022, -0.004, 0.025], [0, 0, side * 0.42]);
          rb.rbox(0.004, 0.036, 0.006, 0.001, silver, [side * 0.032, 0.018, 0.025], [0, 0, -side * 0.55]);
        }
        rb.rbox(0.068, 0.005, 0.006, 0.001, gunmetal, [0, 0.016, 0.025]);
        rb.flush(rtGrp);
        extrudeProfile(rtGrp, innerRT.map(([x, y]) => [x * 0.88, y * 0.88]), 0.006, reactorGlass, [0, 0, 0.024], [0, 0, 0], 0.002);

        b.flush(g);
      },
    },

    // ========================================================================
    // 3. DORSAL BACK ARMOR, GOLD Y-YOKE & FLIGHT THRUSTERS
    // ========================================================================
    {
      id: 'dorsal-airbrake-array',
      name: 'Dorsal Back Carapace, Gold Scapular Y-Yoke, Spinal Column & Vectoring Flight Thrusters',
      category: 'Aerodynamics & Flight',
      isOuter: true,
      explodeOffset: [-1.65, 0.6, 0],
      desc: 'Turnaround-accurate Mark 85 dorsal armor with the signature gold Y-shaped scapular yoke, sculpted crimson latissimus shells, segmented gunmetal/silver thoracic spine, and twin recessed dorsal flight thrusters.',
      funFact: 'Just like a fighter jet, Iron Man pops open dorsal flight flaps on his back to execute high-G supersonic turns and sudden mid-air stops!',
      build(g) {
        const b = new MeshBatch();

        for (const side of [-1, 1]) {
          // u=0 is outer shoulder (0.55*PI), u=1 is inner spine (0.996*PI -> 20mm spinal furrow) for both sides!
          // Gold Y-shaped scapular / upper-back yoke (matches game_back.png turnaround)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.55 * Math.PI,
              aTo: side * 0.996 * Math.PI,
              tFrom: (u) => T_AT(0.73 - 0.05 * u),
              tTo: (u) => T_AT(0.96 - 0.02 * (1 - u)),
              ns: 14,
              nt: 20,
              offset: 0.0085,
            }),
            gold,
          );
          // Sculpted crimson latissimus dorsi & mid-back armor plates below the gold yoke
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.54 * Math.PI,
              aTo: side * 0.996 * Math.PI,
              tFrom: T_AT(0.49),
              tTo: (u) => T_AT(0.722 - 0.05 * u),
              ns: 14,
              nt: 20,
              offset: 0.0075,
              bump: (s, u) => 0.018 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u),
            }),
            hotRodRed,
          );
          // Subtle deep-crimson lower-thoracic airbrake trim (strictly below the gold Y-yoke!)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.66 * Math.PI,
              aTo: side * 0.94 * Math.PI,
              tFrom: T_AT(0.54),
              tTo: (u) => T_AT(0.675 - 0.03 * u),
              ns: 8,
              nt: 12,
              offset: 0.009,
            }),
            deepRed,
          );
          // Twin recessed upper-back flight thruster ports
          const ty = 0.63;
          const tx = torsoBackX(ty);
          b.cyl(0.026, 0.032, 0.045, 20, gunmetal, [tx - 0.002, ty, side * 0.105], [0, 0, Math.PI / 2 + 0.35]);
          b.cyl(0.016, 0.020, 0.01, 18, thrustBlue, [tx - 0.022, ty - 0.007, side * 0.105], [0, 0, Math.PI / 2 + 0.35]);
        }

        // Segmented silver & gunmetal spinal column down the dorsal furrow (proud of the spinal groove)
        for (let i = 0; i < 6; i++) {
          const y = 0.88 - i * 0.068;
          const bx = torsoBackX(y) * 0.96 - 0.006;
          b.rbox(0.022, 0.046, 0.056 - i * 0.003, 0.004, i % 2 === 0 ? silver : gunmetal, [bx, y, 0], [0, 0, -0.08]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 4. GOLD DELTOID SHOULDER PAULDRONS & POP-UP NANO-MISSILE PODS
    // ========================================================================
    {
      id: 'pauldron-missile-pods',
      name: 'Gold-Titanium Sculpted Deltoid Pauldrons, Crimson Collar Rim & Nano-Missile Pods',
      category: 'Ordnance & Defense',
      isOuter: true,
      explodeOffset: [-0.35, 1.35, 0],
      desc: 'Classic Tales-of-Suspense inspired Mark 85 GOLD shoulder pauldrons sculpted tightly around the deltoid muscle with a crimson upper collar border, gunmetal inner mechanical frame, and concealed micro-missile bays.',
      funFact: 'The Mark 85 brought Tony Stark’s comic-book gold shoulders and gold thighs to the big screen for the very first time in the MCU!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          // Anatomical deltoid cap tucked closely against the trapezius and upper arm
          const spec = {
            origin: [S[0] + 0.005, S[1] + 0.072, side * 0.238],
            axis: [-0.03, -0.46, side * 0.88],
            up: [1, 0, 0],
            length: 0.24,
            stations: [
              { t: 0.0, r1: 0.092, r1n: 0.088, r2: 0.082, n: 2.8, c1: 0.004 },
              { t: 0.25, r1: 0.130, r1n: 0.120, r2: 0.122, n: 3.3, c1: 0.008 },
              { t: 0.58, r1: 0.126, r1n: 0.116, r2: 0.118, n: 3.4, c1: 0.006 },
              { t: 0.85, r1: 0.095, r1n: 0.088, r2: 0.090, n: 3.0, c1: 0.003 },
              { t: 1.0, r1: 0.068, r1n: 0.065, r2: 0.065, n: 2.7, c1: 0.0 },
            ],
          };
          const openA = 0.64 * Math.PI;
          b.add(axialPatch({ ...spec, aFrom: -openA, aTo: openA, tFrom: 0.04, tTo: 0.96, ns: 14, nt: 22 }), gunmetal);
          // Primary GOLD deltoid pauldron carapace
          b.add(
            axialPatch({
              ...spec,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: 0.15,
              tTo: (u) => 0.95 - 0.12 * Math.abs(u - 0.5) * 2,
              ns: 14,
              nt: 22,
              offset: 0.0055,
              bump: (s, u) => 0.025 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u),
            }),
            gold,
          );
          // Deep-crimson upper shoulder collar border along the inner edge (t = 0..0.19)
          b.add(
            axialPatch({
              ...spec,
              aFrom: -0.56 * Math.PI,
              aTo: 0.56 * Math.PI,
              tFrom: 0.0,
              tTo: 0.19,
              ns: 6,
              nt: 18,
              offset: 0.0065,
            }),
            deepRed,
          );
          // Subtle recessed micro-ordinance bay on the upper-rear shoulder crest (roll in YZ plane is around X axis!)
          const mz = side * 0.36;
          b.rbox(0.056, 0.012, 0.044, 0.003, gunmetal, [-0.015, 0.902, mz], [side * 0.32, 0, 0]);
          for (const dx of [-0.014, 0, 0.014]) {
            b.cyl(0.0045, 0.0045, 0.014, 10, silver, [-0.015 + dx, 0.909, mz], [side * 0.32, 0, 0]);
          }
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 5. ANATOMICAL GOLD BICEPS, CRIMSON GAUNTLETS & ARTICULATED HANDS
    // ========================================================================
    {
      id: 'repulsor-gauntlets-arms',
      name: 'Sculpted Gold Biceps, Crimson Contoured Forearm Gauntlets, Silver Cuffs & Palm Repulsors',
      category: 'Arms & Repulsors',
      isOuter: true,
      explodeOffset: [0.55, 0.35, 1.55],
      desc: 'Anatomically lofted upper arms with gold bicep and tricep muscle shells over a gunmetal shoulder/elbow joint frame, contoured crimson forearm gauntlets with silver-champagne upper and wrist cuffs, and articulated crimson hands with glowing palm repulsors.',
      funFact: 'Iron Man’s palm Repulsors were originally invented as magnetic flight stabilizers before becoming his signature concussive beam weapon!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const E = ELBOW(side);
          const W = WRIST(side);

          // Seamless gunmetal shoulder ball-joint nested inside the deltoid pauldron
          b.sphere(0.078, 22, 16, gunmetal, S);

          // --- Upper Arm (Bicep / Tricep): Base gunmetal + sculpted GOLD muscle shells ---
          const upperArm = sculptedLimb(
            b,
            S,
            E,
            [
              { t: 0.0, r1: 0.078, r1n: 0.076, r2: 0.076, n: 2.4 },
              { t: 0.25, r1: 0.090, r1n: 0.086, r2: 0.084, n: 2.6, c1: 0.005 },
              { t: 0.52, r1: 0.094, r1n: 0.084, r2: 0.082, n: 2.7, c1: 0.008 }, // bicep peak
              { t: 0.82, r1: 0.074, r1n: 0.072, r2: 0.074, n: 2.5, c1: 0.002 },
              { t: 1.0, r1: 0.064, r1n: 0.064, r2: 0.068, n: 2.4 },
            ],
            gunmetal,
            {
              radial: (t, a) => {
                const bicep = 0.055 * gauss(Math.abs(a), 0.15, 0.45) * gauss(t, 0.48, 0.22);
                const tricep = 0.048 * gauss(Math.abs(a), 2.8, 0.5) * gauss(t, 0.42, 0.20);
                return 1 + bicep + tricep;
              },
            },
          );
          b.add(
            axialPatch({
              ...upperArm,
              aFrom: -0.46 * Math.PI,
              aTo: 0.46 * Math.PI,
              tFrom: 0.12,
              tTo: 0.88,
              ns: 14,
              nt: 18,
              offset: 0.005,
            }),
            gold,
          );
          b.add(
            axialPatch({
              ...upperArm,
              aFrom: 0.50 * Math.PI,
              aTo: 1.50 * Math.PI,
              tFrom: 0.14,
              tTo: 0.86,
              ns: 14,
              nt: 18,
              offset: 0.005,
            }),
            gold,
          );
          // Silver-titanium upper bicep ring band (proud offset = 0.0085 prevents any chord z-fighting)
          b.add(axialPatch({ ...upperArm, aFrom: 0, aTo: TAU, tFrom: 0.18, tTo: 0.24, ns: 6, nt: 32, offset: 0.0085 }), silver);

          // --- Articulated Elbow Joint ---
          b.sphere(0.064, 20, 16, gunmetal, E);
          b.cyl(0.054, 0.054, 0.125, 20, gunmetal, E, eulerAlong([0, 0, 1]));
          b.torus(0.056, 0.006, silver, E, [0, Math.PI / 2, 0]);

          // --- Forearm Gauntlet: Contoured Crimson with brachioradialis muscle flare + Silver/Gold cuffs ---
          const forearm = sculptedLimb(
            b,
            E,
            W,
            [
              { t: 0.0, r1: 0.064, r1n: 0.064, r2: 0.066, n: 2.5 },
              { t: 0.24, r1: 0.086, r1n: 0.082, r2: 0.084, n: 2.9, c1: 0.004 }, // brachioradialis forearm swell
              { t: 0.56, r1: 0.078, r1n: 0.075, r2: 0.078, n: 2.9, c1: 0.002 },
              { t: 0.84, r1: 0.064, r1n: 0.062, r2: 0.068, n: 2.7 },
              { t: 1.0, r1: 0.056, r1n: 0.054, r2: 0.062, n: 2.6 },
            ],
            gunmetal,
          );
          // Main crimson dorsal & palmar gauntlet shells
          b.add(
            axialPatch({
              ...forearm,
              aFrom: -0.47 * Math.PI,
              aTo: 0.47 * Math.PI,
              tFrom: 0.08,
              tTo: 0.92,
              ns: 14,
              nt: 18,
              offset: 0.005,
            }),
            hotRodRed,
          );
          b.add(
            axialPatch({
              ...forearm,
              aFrom: 0.53 * Math.PI,
              aTo: 1.47 * Math.PI,
              tFrom: 0.08,
              tTo: 0.92,
              ns: 14,
              nt: 18,
              offset: 0.005,
            }),
            hotRodRed,
          );
          // Silver-titanium upper forearm V-cuff & gold wrist cuff
          b.add(
            axialPatch({
              ...forearm,
              aFrom: -0.85 * Math.PI,
              aTo: 0.85 * Math.PI,
              tFrom: (u) => 0.08 + 0.06 * (1 - Math.abs(u - 0.5) * 2),
              tTo: (u) => 0.16 + 0.06 * (1 - Math.abs(u - 0.5) * 2),
              ns: 6,
              nt: 28,
              offset: 0.0075,
            }),
            silver,
          );
          b.add(
            axialPatch({
              ...forearm,
              aFrom: 0,
              aTo: TAU,
              tFrom: 0.88,
              tTo: 0.97,
              ns: 6,
              nt: 32,
              offset: 0.0075,
            }),
            gold,
          );

          // --- Sculpted Armored Hand & Glowing Palm Repulsor ---
          const fDir = [0.28, -0.94, -side * 0.12];
          const pNorm = [0.35, 0.12, -side * 0.92];
          const hand = framedGroup(g, W, fDir, pNorm);
          const hb = new MeshBatch();
          hb.rbox(0.078, 0.092, 0.032, 0.010, hotRodRed, [0, 0.045, 0]);
          hb.rbox(0.082, 0.022, 0.035, 0.006, gold, [0, 0.086, -0.002]);
          // 4 articulated crimson fingers (curled in a heroic ready pose)
          for (const [idx, fx] of [-0.028, -0.009, 0.009, 0.028].entries()) {
            const lenScale = idx === 1 || idx === 2 ? 1.06 : 0.95;
            hb.rbox(0.016, 0.042 * lenScale, 0.020, 0.005, hotRodRed, [fx, 0.108, 0.004], [0.55, 0, 0]);
            hb.rbox(0.014, 0.034 * lenScale, 0.018, 0.004, gold, [fx, 0.126, 0.028], [1.35, 0, 0]);
            hb.rbox(0.013, 0.026 * lenScale, 0.016, 0.004, hotRodRed, [fx, 0.116, 0.050], [2.15, 0, 0]);
          }
          // Articulated thumb
          hb.rbox(0.020, 0.044, 0.022, 0.006, hotRodRed, [side * 0.046, 0.048, 0.010], [0.4, 0, -side * 0.45]);
          hb.rbox(0.017, 0.034, 0.019, 0.005, gold, [side * 0.052, 0.078, 0.026], [0.95, 0, -side * 0.25]);
          // Glowing Palm Repulsor emitter lens
          hb.cyl(0.025, 0.028, 0.008, 24, silver, [0, 0.046, 0.016], [Math.PI / 2, 0, 0]);
          hb.cyl(0.018, 0.018, 0.010, 24, arcWhite, [0, 0.046, 0.019], [Math.PI / 2, 0, 0]);
          hb.torus(0.021, 0.003, arcCyan, [0, 0.046, 0.020], [0, 0, 0]);
          hb.flush(hand);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 6. 6-WING X-CONFIGURATION NANO-LIGHTNING REFOCUSER ARRAY
    // ========================================================================
    {
      id: 'nano-lightning-refocuser-blade',
      name: 'Deployed 6-Pod X-Wing Dorsal Nano-Lightning Refocuser Array',
      category: 'Nanotech Weapons',
      isOuter: true,
      explodeOffset: [-1.45, 1.35, 0.45],
      desc: 'Sculpted directly from the official Endgame Mark 85 deployed back turnaround: six heavy mechanical red-and-gold capacitor pods arranged in a radial X-wing matrix behind the shoulders, each housing five glowing rectangular energy cells and an inner plasma focusing channel.',
      funFact: 'In Avengers: Endgame, the Mark 85’s six dorsal Refocuser pods absorbed Thor’s full Mjolnir/Stormbreaker lightning bolt and supercharged 6 simultaneous repulsor beams!',
      build(g) {
        const b = new MeshBatch();
        const hub = [-0.21, 0.78, 0];
        b.rbox(0.06, 0.14, 0.13, 0.012, gunmetal, [-0.185, 0.78, 0]);
        b.rbox(0.04, 0.10, 0.09, 0.008, gold, [-0.205, 0.78, 0]);
        b.cyl(0.028, 0.028, 0.03, 20, silver, [-0.22, 0.78, 0], [0, 0, Math.PI / 2]);
        b.cyl(0.016, 0.016, 0.034, 20, arcCyan, [-0.222, 0.78, 0], [0, 0, Math.PI / 2]);

        // 6 heavy mechanical X-wing pods (2 large upper diagonal, 2 horizontal mid, 2 lower diagonal — matches back_repulsors.png)
        const podSpecs = [
          { angle: 0.62, len: 0.46, w: 0.088, yOff: 0.07, zOff: 0.11 }, // Upper diagonal pod
          { angle: -0.04, len: 0.36, w: 0.074, yOff: 0.0, zOff: 0.13 }, // Mid horizontal pod
          { angle: -0.68, len: 0.42, w: 0.082, yOff: -0.07, zOff: 0.11 }, // Lower diagonal pod
        ];

        const outerHull = (L, W) => [
          [-W * 0.42, 0],
          [-W * 0.52, L * 0.18],
          [-W * 0.48, L * 0.76],
          [-W * 0.18, L],
          [W * 0.22, L * 0.92],
          [W * 0.50, L * 0.68],
          [W * 0.46, L * 0.14],
          [W * 0.35, 0],
        ];

        for (const side of [-1, 1]) {
          for (const spec of podSpecs) {
            const root = [hub[0] - 0.02, hub[1] + spec.yOff, side * spec.zOff];
            b.tube([hub, [hub[0] - 0.03, hub[1] + spec.yOff * 0.6, side * spec.zOff * 0.55], root], 0.015, gunmetal, 12);
            b.sphere(0.024, 14, 10, silver, root);

            const dir = [-0.24, Math.sin(spec.angle), side * Math.cos(spec.angle)];
            const pod = framedGroup(g, root, dir, [1, 0.15, 0]);
            const L = spec.len;
            const W = spec.w;
            const hullPts = outerHull(L, W);
            const goldPts = hullPts.map(([x, y]) => [x * 0.74, y * 0.94 + L * 0.02]);
            const recessPts = hullPts.map(([x, y]) => [x * 0.48, y * 0.86 + L * 0.05]);

            extrudeProfile(pod, hullPts, 0.034, hotRodRed, [0, 0, -0.017], [0, 0, 0], 0.006);
            extrudeProfile(pod, goldPts, 0.040, gold, [0, 0, -0.020], [0, 0, 0], 0.004);
            extrudeProfile(pod, recessPts, 0.044, gunmetal, [0, 0, -0.022], [0, 0, 0], 0.002);

            const pb = new MeshBatch();
            for (let k = 0; k < 5; k++) {
              const py = L * (0.16 + k * 0.155);
              const cw = W * (0.36 - k * 0.025);
              pb.rbox(cw, L * 0.095, 0.048, 0.003, silver, [0, py, 0]);
              pb.rbox(cw * 0.72, L * 0.065, 0.052, 0.002, k % 2 === 0 ? arcWhite : arcCyan, [0, py, 0]);
            }
            pb.rbox(W * 0.22, L * 0.45, 0.024, 0.003, gunmetal, [-side * W * 0.46, L * 0.46, 0]);
            pb.flush(pod);
          }
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 7. CRIMSON V-CHEVRON ABDOMEN, GOLD/SILVER OBLIQUES & SEAMLESS PELVIS
    // ========================================================================
    {
      id: 'abdominal-pelvis-armor',
      name: 'Crimson V-Chevron Abdominal Plates, Gold/Silver Oblique Ribs, 4 Micro-RTs & Seamless Pelvis',
      category: 'Core & Waist Armor',
      isOuter: true,
      explodeOffset: [1.35, -0.1, -0.75],
      desc: 'Authentic Mark 85 abdominal and pelvic assembly: four overlapping crimson V-chevron ab plates (not gold blocks), flanked by gold and silver-titanium oblique ribcage struts, four glowing white-cyan micro-RT ports, and a sculpted crimson pelvic codpiece & hip flares that bridge seamlessly into the upper thighs.',
      funFact: 'The Mark 85’s overlapping crimson abdominal chevrons and gold oblique ribs mimic human musculature while flexing smoothly at supersonic speeds!',
      build(g) {
        const b = new MeshBatch();
        // Continuous gunmetal under-suit from groin (y=0.01) to lower ribcage (t=0.54)
        b.add(
          axialLoft({
            ...TORSO,
            stations: TORSO.stations.filter((s) => s.t <= 0.54),
            N: 52,
            steps: 22,
            capStart: true,
            capEnd: true,
          }),
          gunmetal,
        );

        // 4 overlapping CRIMSON V-chevron abdominal plates down the center of the six-pack (im_infobox.png)
        const abRows = [
          [0.425, 0.495, 0.145],
          [0.355, 0.420, 0.135],
          [0.285, 0.350, 0.125],
          [0.215, 0.280, 0.112],
        ];
        for (const [ya, yb, halfA] of abRows) {
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: -halfA * Math.PI,
              aTo: halfA * Math.PI,
              tFrom: (u) => T_AT(ya - 0.022 * (1 - Math.abs(u - 0.5) * 2)),
              tTo: (u) => T_AT(yb - 0.018 * (1 - Math.abs(u - 0.5) * 2)),
              ns: 8,
              nt: 16,
              offset: 0.006,
              bump: (s, u) => {
                const centerDip = -0.022 * gauss(u, 0.5, 0.08);
                return (0.024 + centerDip) * Math.sin(Math.PI * s) * Math.sin(Math.PI * u);
              },
            }),
            hotRodRed,
          );
        }

        for (const side of [-1, 1]) {
          // u=0 is inner ab border and u=1 is outer oblique border (0.38*PI) for both sides!
          // Silver-titanium & Gold oblique ribcage struts flanking the crimson abs (perfectly symmetric!)
          for (const [idx, [ya, yb, innerA]] of [
            [0.41, 0.48, 0.150],
            [0.33, 0.40, 0.140],
            [0.25, 0.32, 0.130],
          ].entries()) {
            b.add(
              axialPatch({
                ...TORSO,
                aFrom: side * innerA * Math.PI,
                aTo: side * 0.38 * Math.PI,
                tFrom: (u) => T_AT(ya + 0.045 * u),
                tTo: (u) => T_AT(yb + 0.045 * u),
                ns: 6,
                nt: 10,
                offset: 0.0055,
              }),
              idx === 1 ? silver : gold,
            );
          }

          // Crimson lateral oblique & lower-back kidney plates
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.39 * Math.PI,
              aTo: side * 0.996 * Math.PI,
              tFrom: T_AT(0.225),
              tTo: T_AT(0.49),
              ns: 10,
              nt: 16,
              offset: 0.0055,
            }),
            hotRodRed,
          );

          // 4 glowing white-cyan micro-RT nodes along the ribs & upper hips (Euler Z rotation is independent of `side`!)
          for (const [ry, rz] of [
            [0.455, side * 0.125],
            [0.255, side * 0.145],
          ]) {
            const rx = torsoFrontX(ry, Math.abs(rz) / 0.22);
            addMicroRT(b, [rx + 0.006, ry, rz], [side * 0.12, -side * 0.48, -0.15]);
          }

          // Sculpted crimson iliac hip armor flares + gluteal rear plates (symmetrically arches over the hip joint)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.16 * Math.PI,
              aTo: side * 0.96 * Math.PI,
              tFrom: (u) => T_AT(0.06 + 0.06 * Math.sin(u * 0.75 * Math.PI)),
              tTo: (u) => T_AT(0.215 + 0.02 * (1 - u)),
              ns: 12,
              nt: 18,
              offset: 0.0075,
              bump: (s, u) => 0.025 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u),
            }),
            hotRodRed,
          );
          // Gold lateral hip accent strip
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.42 * Math.PI,
              aTo: side * 0.62 * Math.PI,
              tFrom: T_AT(0.14),
              tTo: T_AT(0.20),
              ns: 4,
              nt: 8,
              offset: 0.009,
            }),
            gold,
          );

          // Recessed gunmetal hip ball-joint nested seamlessly inside the pelvis/thigh junction
          b.sphere(0.086, 20, 16, gunmetal, HIP(side));
        }

        // Sculpted 100% CRIMSON angular pelvic codpiece & rear sacral shield
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: -0.165 * Math.PI,
            aTo: 0.165 * Math.PI,
            tFrom: (u) => T_AT(0.015 + 0.085 * (Math.abs(u - 0.5) * 2) ** 1.3),
            tTo: (u) => T_AT(0.215 - 0.025 * (1 - Math.abs(u - 0.5) * 2)),
            ns: 12,
            nt: 14,
            offset: 0.0085,
            bump: (s, u) => 0.03 * Math.sin(Math.PI * s) * (1 - 0.3 * Math.abs(u - 0.5)),
          }),
          hotRodRed,
        );
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: 0.88 * Math.PI,
            aTo: 1.12 * Math.PI,
            tFrom: T_AT(0.04),
            tTo: T_AT(0.225),
            ns: 10,
            nt: 12,
            offset: 0.0085,
          }),
          deepRed,
        );
        b.flush(g);
      },
    },

    // ========================================================================
    // 8. SCULPTED GOLD QUADRICEPS THIGHS, CRIMSON HIP SWEEP & KNEE GUARDS
    // ========================================================================
    {
      id: 'thigh-exo-thrusters',
      name: 'Mark LXXXV Gold Quadriceps Thigh Armor, Crimson Hip Sweep & Articulated Knee Guards',
      category: 'Upper Leg Armor',
      isOuter: true,
      explodeOffset: [-0.3, -0.55, -1.55],
      desc: 'Blueprint-accurate Mark 85 upper legs: primarily GOLD sculpted quadriceps and vastus lateralis armor plates with a subtle central panel crease, a symmetric deep crimson upper-outer hip sweep, gunmetal inner-thigh mechanical framing, and articulated gold/gunmetal patella knee guards.',
      funFact: 'Lateral attitude-control micro-thrusters built into the gold thigh plates let Iron Man hover motionless in crosswinds or strafe sideways mid-air!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const H = HIP(side);
          const K = KNEE(side);
          const thighStart = [H[0], H[1] + 0.045, H[2]];

          // Note: For thigh (axis ≈ -Y, up = +X), frame.e2 = d × e1 = (0,-1,0) × (1,0,0) = (0, 0, +1).
          // Therefore:
          // - `a * side > 0` is ALWAYS the OUTER (+Z*side) side of the thigh!
          // - `a * side < 0` is ALWAYS the INNER (-Z*side) side of the thigh!
          const thigh = sculptedLimb(
            b,
            thighStart,
            K,
            [
              { t: 0.0, r1: 0.128, r1n: 0.132, r2: 0.124, n: 2.5, c1: 0.004, c2: side * 0.006 },
              { t: 0.22, r1: 0.142, r1n: 0.140, r2: 0.136, n: 2.7, c1: 0.010, c2: side * 0.008 }, // upper quad & glute fullness
              { t: 0.48, r1: 0.136, r1n: 0.128, r2: 0.128, n: 2.8, c1: 0.012, c2: side * 0.005 }, // mid-quadriceps peak
              { t: 0.76, r1: 0.114, r1n: 0.106, r2: 0.108, n: 2.7, c1: 0.006, c2: -side * 0.004 }, // vastus medialis teardrop
              { t: 1.0, r1: 0.090, r1n: 0.088, r2: 0.092, n: 2.5, c1: 0.002 },
            ],
            gunmetal,
            {
              radial: (t, a) => {
                const outerQuad = 0.048 * gauss(a * side, 1.10, 0.45) * gauss(t, 0.42, 0.22);
                const innerTeardrop = 0.042 * gauss(a * side, -0.80, 0.38) * gauss(t, 0.70, 0.16);
                const hamstring = 0.038 * gauss(Math.abs(a), 2.75, 0.4) * gauss(t, 0.45, 0.22);
                return 1 + outerQuad + innerTeardrop + hamstring;
              },
            },
          );

          // 1) Symmetric Upper-Outer CRIMSON hip/thigh saddle plate (angles signed by `side` so left and right mirror!)
          b.add(
            axialPatch({
              ...thigh,
              aFrom: -side * 0.18 * Math.PI,
              aTo: side * 0.60 * Math.PI,
              tFrom: 0.02,
              tTo: (u) => {
                // u=0 is inner (-side*0.18*PI), u=1 is outer (+side*0.60*PI): sweeps lower down the outer hip!
                return 0.19 + 0.16 * u;
              },
              ns: 12,
              nt: 18,
              offset: 0.006,
            }),
            hotRodRed,
          );

          // 2) Continuous sculpted GOLD quadriceps carapace (wraps smoothly from inner vastus medialis to outer vastus lateralis!)
          b.add(
            axialPatch({
              ...thigh,
              aFrom: -side * 0.52 * Math.PI,
              aTo: side * 0.58 * Math.PI,
              // u=0 is inner (-side*0.52*PI), u=0.47 is front center (a=0), u=1 is outer (+side*0.58*PI)
              tFrom: (u) => 0.21 + 0.15 * Math.max(0, (u - 0.35) / 0.65) ** 1.2,
              tTo: 0.90,
              ns: 18,
              nt: 26,
              offset: 0.006,
              bump: (s, u) => {
                const seamDip = -0.012 * gauss(u, 0.47, 0.03);
                return (0.018 + seamDip) * Math.sin(Math.PI * s);
              },
            }),
            gold,
          );

          // 3) Rear hamstring armor plates: crimson upper hamstring + gold lower hamstring (centered at a = PI)
          b.add(
            axialPatch({
              ...thigh,
              aFrom: 0.62 * Math.PI,
              aTo: 1.38 * Math.PI,
              tFrom: 0.08,
              tTo: 0.50,
              ns: 12,
              nt: 18,
              offset: 0.006,
            }),
            hotRodRed,
          );
          b.add(
            axialPatch({
              ...thigh,
              aFrom: 0.64 * Math.PI,
              aTo: 1.36 * Math.PI,
              tFrom: 0.53,
              tTo: 0.88,
              ns: 12,
              nt: 18,
              offset: 0.006,
            }),
            gold,
          );

          // 4) Silver-titanium inner-thigh mechanical accent plate
          b.add(
            axialPatch({
              ...thigh,
              aFrom: -side * 0.62 * Math.PI,
              aTo: -side * 0.50 * Math.PI,
              tFrom: 0.34,
              tTo: 0.78,
              ns: 8,
              nt: 6,
              offset: 0.005,
            }),
            silver,
          );

          // --- Sculpted Knee Joint & Patella Guard ---
          b.sphere(0.082, 20, 16, gunmetal, K);
          b.cyl(0.068, 0.068, 0.175, 22, gunmetal, K, [Math.PI / 2, 0, 0]);
          const kneeSpec = {
            origin: [K[0] - 0.01, K[1] - 0.075, K[2]],
            axis: [0, 1, 0],
            up: [1, 0, 0],
            length: 0.15,
            stations: [
              { t: 0.0, r1: 0.088, r1n: 0.080, r2: 0.086, n: 2.8, c1: 0.010 },
              { t: 0.5, r1: 0.102, r1n: 0.086, r2: 0.095, n: 3.2, c1: 0.016 },
              { t: 1.0, r1: 0.088, r1n: 0.080, r2: 0.086, n: 2.8, c1: 0.010 },
            ],
          };
          b.add(axialPatch({ ...kneeSpec, aFrom: -0.34 * Math.PI, aTo: 0.34 * Math.PI, tFrom: 0.05, tTo: 0.95, ns: 10, nt: 14, offset: 0.005 }), gold);
          b.add(axialPatch({ ...kneeSpec, aFrom: -0.18 * Math.PI, aTo: 0.18 * Math.PI, tFrom: 0.22, tTo: 0.78, ns: 6, nt: 8, offset: 0.008 }), silver);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 9. ALL-CRIMSON SHIN GREAVES, SILVER V-COLLARS & MULTI-FACETED BOOTS
    // ========================================================================
    {
      id: 'calf-boot-jet-thrusters',
      name: 'Sculpted Crimson Shin Greaves, Silver Under-Knee V-Collars, All-Crimson Boots & Sole Thrusters',
      category: 'Flight Propulsion & Boots',
      isOuter: true,
      explodeOffset: [0.4, -1.55, 0],
      desc: 'Blueprint-accurate Mark 85 lower legs: 100% deep candy crimson shin greaves with an anatomical gastrocnemius calf flare, sharp anterior tibial ridge, silver/gunmetal V-chevron collar below the knee, and multi-faceted all-crimson armored boots with gunmetal soles and twin plasma flight turbines.',
      funFact: 'Each boot houses a miniature hybrid plasma turbine that sucks in surrounding air at low altitude or runs on pure Arc Reactor plasma in space!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const K = KNEE(side);
          const A = ANKLE(side);

          // Anatomical lower leg (shin & gastrocnemius calf flare)
          const shin = sculptedLimb(
            b,
            [K[0], K[1] - 0.02, K[2]],
            A,
            [
              { t: 0.0, r1: 0.086, r1n: 0.086, r2: 0.088, n: 2.7 },
              { t: 0.18, r1: 0.094, r1n: 0.106, r2: 0.098, n: 2.9, c1: -0.004, c2: side * 0.004 },
              { t: 0.34, r1: 0.092, r1n: 0.118, r2: 0.106, n: 3.0, c1: -0.010, c2: side * 0.006 }, // gastrocnemius calf peak
              { t: 0.58, r1: 0.084, r1n: 0.094, r2: 0.088, n: 2.9, c1: -0.004 },
              { t: 0.82, r1: 0.072, r1n: 0.076, r2: 0.074, n: 2.7 },
              { t: 1.0, r1: 0.068, r1n: 0.072, r2: 0.074, n: 2.6 },
            ],
            gunmetal,
            {
              radial: (t, a) => {
                const shinCrest = 0.052 * gauss(a, 0, 0.22) * gauss(t, 0.48, 0.28);
                const calfMuscle = 0.060 * gauss(Math.abs(a), 2.55, 0.42) * gauss(t, 0.32, 0.16);
                return 1 + shinCrest + calfMuscle;
              },
            },
          );

          // 1) Silver-titanium V-chevron collar band directly below the knee
          b.add(
            axialPatch({
              ...shin,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: (u) => 0.04 + 0.09 * (1 - Math.abs(u - 0.5) * 2),
              tTo: (u) => 0.12 + 0.10 * (1 - Math.abs(u - 0.5) * 2),
              ns: 6,
              nt: 20,
              offset: 0.006,
            }),
            silver,
          );

          // 2) 100% Deep Candy Crimson sculpted shin greave & calf shells
          b.add(
            axialPatch({
              ...shin,
              aFrom: -0.54 * Math.PI,
              aTo: 0.54 * Math.PI,
              tFrom: (u) => 0.13 + 0.10 * (1 - Math.abs(u - 0.5) * 2),
              tTo: (u) => 0.94 + 0.04 * (1 - Math.abs(u - 0.5) * 2),
              ns: 18,
              nt: 22,
              offset: 0.0055,
            }),
            hotRodRed,
          );
          b.add(
            axialPatch({
              ...shin,
              aFrom: 0.56 * Math.PI,
              aTo: 1.44 * Math.PI,
              tFrom: 0.08,
              tTo: 0.88,
              ns: 14,
              nt: 18,
              offset: 0.0055,
            }),
            hotRodRed,
          );
          b.add(
            axialPatch({
              ...shin,
              aFrom: 0.78 * Math.PI,
              aTo: 1.22 * Math.PI,
              tFrom: 0.18,
              tTo: 0.62,
              ns: 8,
              nt: 10,
              offset: 0.009,
            }),
            deepRed,
          );

          // --- Ankle Guard & Multi-Faceted All-Crimson Combat Boot ---
          b.sphere(0.068, 18, 14, gunmetal, A);
          const ankleCollar = {
            origin: [A[0] + 0.01, A[1] - 0.05, A[2]],
            axis: [0.15, 1, 0],
            up: [1, 0, 0],
            length: 0.12,
            stations: [
              { t: 0.0, r1: 0.095, r1n: 0.088, r2: 0.088, n: 2.9 },
              { t: 0.5, r1: 0.088, r1n: 0.082, r2: 0.084, n: 2.9 },
              { t: 1.0, r1: 0.076, r1n: 0.074, r2: 0.078, n: 2.7 },
            ],
          };
          b.add(axialPatch({ ...ankleCollar, aFrom: -0.68 * Math.PI, aTo: 0.68 * Math.PI, tFrom: 0, tTo: 1, ns: 8, nt: 18, offset: 0.005 }), hotRodRed);

          const footDir = [0.99, 0, side * 0.12];
          const boot = {
            origin: [A[0] - 0.105, -0.925, A[2] - side * 0.012],
            axis: footDir,
            up: [0, 1, 0],
            length: 0.335,
            stations: [
              { t: 0.0, r1: 0.068, r1n: 0.072, r2: 0.070, n: 2.7, c1: 0.0 },
              { t: 0.28, r1: 0.092, r1n: 0.075, r2: 0.086, n: 3.1, c1: 0.005 },
              { t: 0.58, r1: 0.068, r1n: 0.074, r2: 0.084, n: 3.2, c1: 0.002 },
              { t: 0.85, r1: 0.044, r1n: 0.058, r2: 0.072, n: 3.1, c1: -0.014 },
              { t: 1.0, r1: 0.016, r1n: 0.040, r2: 0.046, n: 2.8, c1: -0.032 },
            ],
          };
          b.add(axialLoft({ ...boot, N: 40, steps: 16, capStart: true, capEnd: true }), hotRodRed);
          b.add(axialPatch({ ...boot, aFrom: -0.55 * Math.PI, aTo: 0.55 * Math.PI, tFrom: 0.18, tTo: 0.56, ns: 8, nt: 14, offset: 0.005 }), deepRed);
          b.add(axialPatch({ ...boot, aFrom: -0.62 * Math.PI, aTo: 0.62 * Math.PI, tFrom: 0.60, tTo: 0.96, ns: 8, nt: 16, offset: 0.006 }), hotRodRed);
          b.add(axialPatch({ ...boot, aFrom: -0.45 * Math.PI, aTo: 0.45 * Math.PI, tFrom: 0.88, tTo: 0.99, ns: 4, nt: 10, offset: 0.004 }), gunmetal);

          // Heavy gunmetal combat sole + circular sole-mounted plasma flight thruster
          const soleX = A[0] + 0.055;
          const soleZ = A[2] + side * 0.006;
          b.rbox(0.31, 0.016, 0.152, 0.005, gunmetal, [soleX, -0.992, soleZ], [0, -side * 0.12, 0]);
          b.torus(0.046, 0.008, gunmetal, [soleX, -0.996, soleZ], [Math.PI / 2, 0, 0]);
          b.cyl(0.040, 0.040, 0.006, 24, thrustBlue, [soleX, -0.9985, soleZ]);
          b.cyl(0.020, 0.020, 0.008, 18, arcWhite, [soleX, -0.999, soleZ]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 10. INTERNAL NANOTECH ENDOSKELETON & PLASMA CONDUITS
    // ========================================================================
    {
      id: 'internal-nanotech-endoskeleton',
      name: 'Internal Gold-Titanium Nanotech Endoskeleton & Plasma Conduits',
      category: 'Internal Endoskeleton',
      isOuter: false,
      explodeOffset: [-1.4, -0.4, 1.15],
      desc: 'X-ray cutaway of the biometric endoskeleton: segmented spinal column, thoracic ribcage hoops, pelvic ring, humerus/radius and femur/tibia actuator struts with silver joints, and glowing cyan nano-conduits feeding Arc Reactor plasma to every repulsor and thruster.',
      funFact: 'Billions of autonomous nanobots flow along internal plasma conduits to instantly rebuild damaged armor or morph into new weapons!',
      build(g) {
        const b = new MeshBatch();
        b.cyl(0.028, 0.028, 0.84, 14, gunmetal, [-0.025, 0.54, 0]);
        for (let i = 0; i < 9; i++) b.cyl(0.042, 0.042, 0.018, 12, silver, [-0.025, 0.18 + i * 0.085, 0]);
        for (const y of [0.56, 0.66, 0.76, 0.86]) {
          const hw = torsoSample(clamp(T_AT(y), 0, 1)).r2 * 0.72;
          b.torus(hw, 0.009, gunmetal, [0.0, y, 0], [Math.PI / 2, 0, 0], [0.62, 1, 1]);
        }
        b.torus(0.15, 0.014, gunmetal, [0.0, 0.14, 0], [Math.PI / 2, 0, 0], [0.7, 1, 1]);
        b.cyl(0.018, 0.018, 0.68, 12, silver, [0.01, 0.86, 0], [Math.PI / 2, 0, 0]);

        for (const side of [-1, 1]) {
          const segs = [
            [SHOULDER(side), ELBOW(side)],
            [ELBOW(side), WRIST(side)],
            [HIP(side), KNEE(side)],
            [KNEE(side), ANKLE(side)],
          ];
          for (const [p, q] of segs) {
            const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
            const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
            b.cyl(0.022, 0.018, len, 12, gunmetal, mid, eulerAlong([q[0] - p[0], q[1] - p[1], q[2] - p[2]]));
          }
          for (const j of [SHOULDER(side), ELBOW(side), HIP(side), KNEE(side), ANKLE(side)]) {
            b.sphere(0.032, 14, 10, silver, j);
          }
          b.tube([[0.12, 0.76, 0], [0.04, 0.85, side * 0.26], SHOULDER(side), ELBOW(side), WRIST(side)], 0.009, arcCyan, 40);
          b.tube([[0.10, 0.72, 0], [0.03, 0.28, side * 0.10], HIP(side), KNEE(side), ANKLE(side), [0.04, -0.97, side * 0.208]], 0.009, arcCyan, 40);
        }
        b.tube([[0.12, 0.78, 0], [0.03, 0.95, 0], [0.0, 1.12, 0]], 0.009, arcCyan, 16);
        b.flush(g);
      },
    },
  ];

  return {
    id: 'iron-man-mark-85',
    name: 'Iron Man Mark LXXXV (85) Nano-Tech Armor',
    brand: 'Stark Industries',
    badge: 'Mach 10+ • 8 GJ/s Arc Reactor • Nanotech Swarm',
    desc: 'Tony Stark’s ultimate Mark LXXXV (85) Gold-Titanium Nano-Tech Exoskeleton sculpted from the official Avengers: Endgame blueprints: crimson thoracic and V-chevron abdominal armor with 6 micro-RT ports, trapezoidal RT Arc Reactor, gold deltoid pauldrons, gold biceps, gold quadriceps thighs, all-crimson shins and boots, and the 6-pod X-wing Dorsal Nano-Lightning Refocuser array.',
    cameraPos: [3.2, 1.15, 3.1],
    cameraTarget: [0, 0.15, 0],
    parts,
    quiz: [
      {
        q: 'Which glowing trapezoidal core in the center of the Mark 85 chestplate generates 8 gigajoules per second to power the suit?',
        correctId: 'arc-reactor-chestplate',
        distractors: ['mark85-helmet-hud', 'pauldron-missile-pods', 'thigh-exo-thrusters'],
      },
      {
        q: 'Which 6-pod X-wing dorsal array behind Iron Man’s shoulders absorbs Thor’s lightning to supercharge his repulsor blasts?',
        correctId: 'nano-lightning-refocuser-blade',
        distractors: ['dorsal-airbrake-array', 'calf-boot-jet-thrusters', 'abdominal-pelvis-armor'],
      },
      {
        q: 'Which palm-mounted emitters serve as both magnetic flight stabilizers and concussive energy blasters?',
        correctId: 'repulsor-gauntlets-arms',
        distractors: ['internal-nanotech-endoskeleton', 'mark85-helmet-hud', 'thigh-exo-thrusters'],
      },
      {
        q: 'Which part forms out of gold-titanium nanoparticles in under a second and shows Tony the glowing F.R.I.D.A.Y. heads-up display?',
        correctId: 'mark85-helmet-hud',
        distractors: ['pauldron-missile-pods', 'arc-reactor-chestplate', 'dorsal-airbrake-array'],
      },
      {
        q: 'Which part hides the plasma turbines that lift Iron Man off the ground from the soles of his feet?',
        correctId: 'calf-boot-jet-thrusters',
        distractors: ['thigh-exo-thrusters', 'repulsor-gauntlets-arms', 'nano-lightning-refocuser-blade'],
      },
    ],
  };
}
