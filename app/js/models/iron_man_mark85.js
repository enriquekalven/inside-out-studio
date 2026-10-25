// ============================================================================
// Iron Man Mark LXXXV (85) — Avengers: Endgame nano-tech armor, sculpted like the movie suit.
//
// Every armor shell is a lofted superellipse surface (torso, helmet, pauldrons, limbs, boots) built with the
// shared loft.js engine instead of primitive spheres/boxes, then layered with raised plates, gold trim, the
// triangular RT arc reactor, F.R.I.D.A.Y. eye slits, palm repulsors, boot thrusters and the dorsal
// nano-lightning refocuser blades. Figure faces +X (vehicle forward convention so the FlightSim pitch/bank
// axes work), stands on the stage floor (sole y = -1.0), +Z is the suit's right-hand side.
// Part ids deliberately avoid the FlightSim regex words (gear / tail / flap / slat / aileron / empennage).
// ============================================================================
import * as THREE from '../../vendor/three.module.js';
import { carPaint, brushedMetal, chromeMat, glassMat, emissiveMat, mat, extrudeProfile } from '../materials.js';
import { loftRings, surfaceGrid, MeshBatch, smoothCurve, addSmoothMesh } from '../loft.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);

// ----------------------------------------------------------------------------
// Axial loft helpers: superellipse rings swept along an arbitrary axis
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
 * n = squareness (2 = ellipse, 3+ = boxy), c1/c2 = section centre offsets along e1/e2.
 */
function stationSampler(stations) {
  const field = (key, fallback) => {
    const knots = stations.map((s) => [s.t, s[key] ?? (typeof fallback === 'function' ? fallback(s) : fallback)]);
    return smoothCurve(knots);
  };
  const f1 = field('r1', 0.1);
  const f1n = field('r1n', (s) => s.r1 ?? 0.1);
  const f2 = field('r2', (s) => s.r1 ?? 0.1);
  const fn = field('n', 2.4);
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

/** Closed loft of superellipse rings along an axis (limbs, helmet, boots, torso). Returns the geometry. */
function axialLoft({ origin, axis, up, length, stations, N = 40, capStart = false, capEnd = false, radial }) {
  const frame = axisFrame(origin, axis, up);
  const sample = stationSampler(stations);
  const rings = stations.map((st) => {
    const p = sample(st.t);
    const ring = [];
    for (let j = 0; j < N; j++) {
      const a = (j / N) * TAU;
      ring.push(ringPoint(frame, length, st.t, a, p, radial ? radial(st.t, j / N) : 1));
    }
    return ring;
  });
  return loftRings(rings, { capStart, capEnd });
}

/**
 * Open patch of the same axial surface (armor plates, faceplate, pauldron caps): angles aFrom..aTo (rad),
 * axial range tFrom..tTo (numbers or functions of the angle fraction u in 0..1), pushed out by `offset`
 * and optionally domed by `bump(s, u)` (radial multiplier - 1).
 */
function axialPatch({ origin, axis, up, length, stations, aFrom, aTo, tFrom, tTo, ns = 10, nt = 14, offset = 0, bump = null }) {
  const frame = axisFrame(origin, axis, up);
  const sample = stationSampler(stations);
  const t0 = typeof tFrom === 'function' ? tFrom : () => tFrom;
  const t1 = typeof tTo === 'function' ? tTo : () => tTo;
  const fn = (s, u) => {
    const t = lerp(t0(u), t1(u), s);
    const a = lerp(aFrom, aTo, u);
    const p = sample(clamp(t, 0, 1));
    const radial = 1 + (bump ? bump(s, u) : 0);
    return ringPoint(frame, length, t, a, p, radial);
  };
  return surfaceGrid(fn, {
    ns,
    nt,
    offset,
    outward: (pt) => {
      // radial direction from the loft axis (robust outward hint for both closed and shallow patches)
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

/** Euler rotation that maps local +Y onto `dir` (for cylinders / plates laid along a limb). */
function eulerAlong(dir, roll = 0) {
  const d = V3(dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

/** Group placed at `origin` whose local +Y = dir and local +Z = normal (palm/blade frames). */
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
// Suit layout (world units; figure is 2.3 units tall, feet on y = -1.0)
// ----------------------------------------------------------------------------
const TORSO = {
  origin: [0, 0.10, 0],
  axis: [0, 1, 0],
  up: [1, 0, 0],
  length: 0.88, // y 0.10 -> 0.98
  // t: 0 = hips, 1 = top of the trapezius. r1 = front depth, r1n = back depth, r2 = half width.
  stations: [
    { t: 0.0, r1: 0.135, r1n: 0.125, r2: 0.215, n: 2.6 },
    { t: 0.18, r1: 0.13, r1n: 0.12, r2: 0.2, n: 2.6 },
    { t: 0.36, r1: 0.128, r1n: 0.118, r2: 0.19, n: 2.7 }, // waist
    { t: 0.52, r1: 0.158, r1n: 0.132, r2: 0.235, n: 2.8 },
    { t: 0.68, r1: 0.19, r1n: 0.148, r2: 0.28, n: 2.9 },
    { t: 0.78, r1: 0.196, r1n: 0.152, r2: 0.3, n: 3.0 }, // chest peak
    { t: 0.88, r1: 0.162, r1n: 0.14, r2: 0.3, n: 3.0 },
    { t: 0.95, r1: 0.105, r1n: 0.105, r2: 0.235, n: 2.8 },
    { t: 1.0, r1: 0.075, r1n: 0.08, r2: 0.15, n: 2.6 },
  ],
};
const T_AT = (y) => (y - TORSO.origin[1]) / TORSO.length;
const torsoSample = stationSampler(TORSO.stations);
const torsoFrontX = (y, zFrac = 0) => frontDepthAt(TORSO.stations, T_AT(y), zFrac);
const torsoBackX = (y) => -torsoSample(clamp(T_AT(y), 0, 1)).r1n;
const torsoHalfW = (y) => torsoSample(clamp(T_AT(y), 0, 1)).r2;

const SHOULDER = (side) => [0.0, 0.86, side * 0.405];
// Power stance: elbows out, forearms angled forward-down, both palms raised toward the viewer (repulsors charged).
const ELBOW = (side) => [0.06, 0.55, side * 0.52];
const WRIST = (side) => [0.259, 0.292, side * 0.57];
const FINGER_DIR = () => [0.3, 1, 0];
const PALM_NORMAL = () => [1, -0.3, 0];
const HIP = (side) => [0.0, 0.14, side * 0.155];
const KNEE = (side) => [0.015, -0.32, side * 0.16];
const ANKLE = (side) => [0.0, -0.84, side * 0.155];

const HELMET = {
  origin: [0.0, 0.995, 0],
  axis: [0, 1, 0],
  up: [1, 0, 0],
  length: 0.325, // y 0.995 -> 1.32
  stations: [
    { t: 0.0, r1: 0.082, r1n: 0.085, r2: 0.08, n: 2.8, c1: 0.01 }, // chin
    { t: 0.14, r1: 0.108, r1n: 0.112, r2: 0.1, n: 2.9, c1: 0.012 }, // jaw / mouth line
    { t: 0.36, r1: 0.118, r1n: 0.13, r2: 0.112, n: 2.9, c1: 0.008 }, // cheekbones / ears
    { t: 0.56, r1: 0.117, r1n: 0.136, r2: 0.116, n: 2.8, c1: 0.004 }, // temples / brow
    { t: 0.76, r1: 0.1, r1n: 0.125, r2: 0.105, n: 2.6, c1: -0.004 },
    { t: 0.92, r1: 0.06, r1n: 0.08, r2: 0.07, n: 2.4, c1: -0.012 },
    { t: 1.0, r1: 0.0, r1n: 0.0, r2: 0.0, n: 2.2, c1: -0.016 }, // crown
  ],
};
const H_AT = (y) => (y - HELMET.origin[1]) / HELMET.length;

export function buildIronManMark85Model() {
  // --- Materials: MCU "hot-rod" candy red, gold-titanium, gunmetal joints, arc-reactor plasma ---
  const hotRodRed = carPaint(0x9c0e19, { roughness: 0.17, metalness: 0.58 });
  const deepRed = carPaint(0x6b0a12, { roughness: 0.3, metalness: 0.5 });
  const gold = brushedMetal(0xd6a21f, { roughness: 0.2, metalness: 0.96, clearcoat: 0.55 });
  const gunmetal = brushedMetal(0x2a313d, { roughness: 0.34, metalness: 0.9 });
  const silver = chromeMat();
  const arcWhite = emissiveMat(0xe9fbff, 4.6);
  const arcCyan = emissiveMat(0x5cd2ff, 3.0);
  const thrustBlue = emissiveMat(0x7dd3fc, 2.4);
  const holo = glassMat(0x38bdf8, 0.38);
  const reactorGlass = glassMat(0xbfe9ff, 0.3);
  const matte = mat(0x111827, { roughness: 0.6, metalness: 0.4 });

  // Shared sub-builders ------------------------------------------------------
  /** Lofted limb segment between two joints with a radius law (bulge/taper) and squareness. */
  const limb = (batch, from, to, radii, material, { n = 2.4, up = [1, 0, 0], N = 36, r2Scale = 1, capStart = true, capEnd = true } = {}) => {
    const axis = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const length = Math.hypot(axis[0], axis[1], axis[2]);
    const stations = radii.map(([t, r, nn]) => ({ t, r1: r, r1n: r, r2: r * r2Scale, n: nn ?? n }));
    batch.add(axialLoft({ origin: from, axis, up, length, stations, N, capStart, capEnd }), material);
  };
  /** Thin plate laid along a limb axis at a lateral/forward offset (gold stripes, vents). */
  const limbPlate = (batch, from, to, tA, tB, lateral, forward, width, thick, material, radialOut) => {
    const d = V3(to).sub(V3(from));
    const len = d.length();
    const dir = d.clone().normalize();
    const fwd = new THREE.Vector3(1, 0, 0).sub(dir.clone().multiplyScalar(dir.x)).normalize();
    const lat = new THREE.Vector3().crossVectors(dir, fwd).normalize();
    const mid = V3(from).add(dir.clone().multiplyScalar(len * (tA + tB) * 0.5));
    const out = fwd.clone().multiplyScalar(forward).add(lat.clone().multiplyScalar(lateral)).normalize().multiplyScalar(radialOut);
    mid.add(out);
    // orient: local +Y along limb, local +Z toward the outward direction
    const z = out.clone().normalize();
    z.sub(dir.clone().multiplyScalar(z.dot(dir))).normalize();
    const x = new THREE.Vector3().crossVectors(dir, z).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, dir, z));
    const e = new THREE.Euler().setFromQuaternion(q);
    batch.rbox(width, len * (tB - tA), thick, Math.min(0.012, thick * 0.45), material, [mid.x, mid.y, mid.z], [e.x, e.y, e.z]);
  };

  const parts = [
    // ========================================================================
    // 1. HELMET
    // ========================================================================
    {
      id: 'mark85-helmet-hud',
      name: 'Mark LXXXV Gold-Titanium Faceplate, Crimson Helmet & F.R.I.D.A.Y. HUD Eyes',
      category: 'Helmet & Avionics',
      isOuter: true,
      explodeOffset: [0.25, 1.55, 0],
      desc: 'Lofted crimson cranial helmet with the sculpted gold faceplate — brow V-ridge, slanted glowing eye slits, cheek frown seams, chin guard and mouth slot — over a ribbed gunmetal neck and gold gorget collar.',
      funFact: 'Unlike early suits that needed robotic arms to bolt on, the Mark 85 helmet forms out of microscopic gold-titanium nanoparticles in less than a second!',
      build(g) {
        const b = new MeshBatch();
        // Crimson helmet shell (full loft, crown closed by the collapsed ring)
        b.add(axialLoft({ ...HELMET, N: 48 }), hotRodRed);
        // Gold faceplate: chin point at the centre, V-shaped brow (dips between the eyes)
        const faceA = 0.36 * Math.PI;
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -faceA,
            aTo: faceA,
            tFrom: (u) => H_AT(1.012 + 0.03 * Math.abs(u - 0.5) * 2),
            tTo: (u) => H_AT(1.262 - 0.032 * (1 - Math.abs(u - 0.5) * 2)),
            ns: 12,
            nt: 18,
            offset: 0.006,
          }),
          gold,
        );
        // Raised gold nose/brow centre ridge
        b.add(axialPatch({ ...HELMET, aFrom: -0.05 * Math.PI, aTo: 0.05 * Math.PI, tFrom: H_AT(1.09), tTo: H_AT(1.21), ns: 6, nt: 4, offset: 0.012 }), gold);
        for (const side of [-1, 1]) {
          // Eye socket recess + glowing F.R.I.D.A.Y. eye slit (outer corner raised = the Iron Man "frown")
          const ey = 1.168;
          const ez = side * 0.046;
          const ex = frontDepthAt(HELMET.stations, H_AT(ey), Math.abs(ez) / 0.116) + 0.004;
          const yaw = -side * 0.42;
          b.rbox(0.008, 0.024, 0.064, 0.003, matte, [ex + 0.004, ey, ez], [side * 0.22, yaw, 0]);
          b.rbox(0.006, 0.013, 0.05, 0.002, arcWhite, [ex + 0.011, ey + 0.001, ez], [side * 0.22, yaw, 0]);
          // Cheek frown seams running from the outer eye corner to the jaw
          b.rbox(0.006, 0.11, 0.007, 0.002, matte, [ex - 0.002, 1.105, side * 0.084], [side * 0.16, yaw, side * 0.12]);
          // Crimson cheek-guard plates framing the gold mask + ear discs with silver bolts
          b.add(axialPatch({ ...HELMET, aFrom: side * 0.38 * Math.PI, aTo: side * 0.56 * Math.PI, tFrom: H_AT(1.03), tTo: H_AT(1.25), ns: 8, nt: 5, offset: 0.007 }), hotRodRed);
          b.cyl(0.03, 0.03, 0.012, 20, gunmetal, [0.0, 1.13, side * 0.122], [Math.PI / 2, 0, 0]);
          b.cyl(0.012, 0.012, 0.008, 12, silver, [0.0, 1.13, side * 0.13], [Math.PI / 2, 0, 0]);
        }
        // Mouth slot
        b.rbox(0.006, 0.006, 0.062, 0.002, matte, [frontDepthAt(HELMET.stations, H_AT(1.072)) + 0.009, 1.072, 0]);
        // Dark crimson crown crest (centre strip from brow over the top of the helmet)
        b.add(axialPatch({ ...HELMET, aFrom: -0.08 * Math.PI, aTo: 0.08 * Math.PI, tFrom: H_AT(1.27), tTo: 0.9, ns: 8, nt: 4, offset: 0.004 }), deepRed);
        // Ribbed gunmetal neck + gold gorget collar
        b.cyl(0.062, 0.068, 0.11, 24, gunmetal, [0.0, 0.96, 0]);
        for (const ry of [0.935, 0.965, 0.995]) b.torus(0.066, 0.006, gunmetal, [0.0, ry, 0], [Math.PI / 2, 0, 0]);
        b.torus(0.1, 0.028, gold, [0.0, 0.945, 0], [Math.PI / 2, 0, 0], [1.15, 1, 0.5]);
        b.flush(g);
      },
    },
    // ========================================================================
    // 2. CHEST + ARC REACTOR
    // ========================================================================
    {
      id: 'arc-reactor-chestplate',
      name: 'Sculpted Crimson Chest Armor, Gold Sternum Inlays & Nano-Tech RT Arc Reactor',
      category: 'Power Core & Torso',
      isOuter: true,
      explodeOffset: [1.65, 0.45, 0],
      desc: 'Lofted V-taper thoracic shell with raised pectoral plates, gold clavicle & sternum inlays and the recessed circular RT housing whose triangular core glows white-blue at 8 gigajoules per second.',
      funFact: 'The Mark 85 chest Arc Reactor powers both the liquid-metal nanotech swarm and the suit’s plasma repulsors simultaneously!',
      build(g) {
        const b = new MeshBatch();
        const half = 0.53 * Math.PI;
        // Front thoracic shell (y 0.455 -> 0.98), overlapping the abdomen ring like layered armor
        b.add(axialPatch({ ...TORSO, aFrom: -half, aTo: half, tFrom: T_AT(0.455), tTo: 1.0, ns: 16, nt: 30 }), hotRodRed);
        for (const side of [-1, 1]) {
          // Raised pectoral plates (domed)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.07 * Math.PI,
              aTo: side * 0.42 * Math.PI,
              tFrom: T_AT(0.62),
              tTo: T_AT(0.87),
              ns: 10,
              nt: 10,
              offset: 0.008,
              bump: (s, u) => 0.07 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u),
            }),
            hotRodRed,
          );
          // Gold clavicle plates on the upper chest + gold lateral rib plates under the pecs
          b.add(axialPatch({ ...TORSO, aFrom: side * 0.1 * Math.PI, aTo: side * 0.46 * Math.PI, tFrom: T_AT(0.885), tTo: T_AT(0.955), ns: 4, nt: 8, offset: 0.009 }), gold);
          b.add(axialPatch({ ...TORSO, aFrom: side * 0.4 * Math.PI, aTo: side * 0.52 * Math.PI, tFrom: T_AT(0.5), tTo: T_AT(0.64), ns: 4, nt: 4, offset: 0.007 }), gold);
          // Gold under-pec band sloping down toward the sternum (the Mark 85 chest "V")
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side * 0.03 * Math.PI,
              aTo: side * 0.44 * Math.PI,
              tFrom: (u) => T_AT(0.535 + 0.05 * u),
              tTo: (u) => T_AT(0.575 + 0.05 * u),
              ns: 3,
              nt: 10,
              offset: 0.011,
            }),
            gold,
          );
        }
        // Gold sternum strip between the pecs
        b.add(axialPatch({ ...TORSO, aFrom: -0.035 * Math.PI, aTo: 0.035 * Math.PI, tFrom: T_AT(0.56), tTo: T_AT(0.88), ns: 8, nt: 3, offset: 0.012 }), gold);
        // RT Arc Reactor: recessed gunmetal housing, 10 radial emitter segments, triangular core, chrome bezel
        const rx = torsoFrontX(0.76) + 0.008;
        b.cyl(0.074, 0.08, 0.03, 32, gunmetal, [rx, 0.76, 0], [0, 0, Math.PI / 2]);
        b.cyl(0.06, 0.06, 0.02, 32, matte, [rx + 0.012, 0.76, 0], [0, 0, Math.PI / 2]);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU;
          b.rbox(0.008, 0.02, 0.01, 0.003, arcCyan, [rx + 0.02, 0.76 + Math.cos(a) * 0.048, Math.sin(a) * 0.048], [a, 0, 0]);
        }
        b.cyl(0.034, 0.034, 0.012, 3, arcWhite, [rx + 0.022, 0.76, 0], [0, 0, Math.PI / 2]);
        b.cyl(0.015, 0.015, 0.016, 24, arcWhite, [rx + 0.024, 0.76, 0], [0, 0, Math.PI / 2]);
        b.torus(0.066, 0.007, silver, [rx + 0.026, 0.76, 0], [0, Math.PI / 2, 0]);
        b.flush(g);
        // Transparent reactor dome (kept as its own mesh for correct alpha sorting)
        const dome = new THREE.SphereGeometry(0.064, 24, 12, 0, TAU, 0, Math.PI / 2);
        addSmoothMesh(g, dome, reactorGlass, [rx + 0.022, 0.76, 0], [0, 0, -Math.PI / 2], [0.35, 1, 1]);
      },
    },
    // ========================================================================
    // 3. BACK + DORSAL AIRBRAKES
    // ========================================================================
    {
      id: 'dorsal-airbrake-array',
      name: 'Dorsal Back Armor, Gold Spine Plates, Airbrake Fins & Upper-Back Thrusters',
      category: 'Aerodynamics & Flight',
      isOuter: true,
      explodeOffset: [-1.65, 0.6, 0],
      desc: 'Lofted dorsal shell with shoulder-blade plates, a segmented gold spinal column, two hinged airbrake fins that pop open for high-G stops, and twin vectoring plasma thrusters between the shoulder blades.',
      funFact: 'Just like a fighter jet, Iron Man pops open airbrake fins on his back to execute high-G supersonic turns and sudden mid-air stops!',
      build(g) {
        const b = new MeshBatch();
        const half = 0.53 * Math.PI;
        b.add(axialPatch({ ...TORSO, aFrom: half, aTo: TAU - half, tFrom: T_AT(0.455), tTo: 1.0, ns: 16, nt: 30 }), hotRodRed);
        for (const side of [-1, 1]) {
          // Shoulder-blade plates (dark crimson)
          b.add(axialPatch({ ...TORSO, aFrom: side * 0.62 * Math.PI, aTo: side * 0.9 * Math.PI, tFrom: T_AT(0.66), tTo: T_AT(0.92), ns: 6, nt: 6, offset: 0.008 }), deepRed);
          // Hinged airbrake fin: red plate with gold edge, swung open
          const hx = torsoBackX(0.8) - 0.012;
          b.rbox(0.014, 0.21, 0.13, 0.008, hotRodRed, [hx - 0.03, 0.8, side * 0.205], [0.0, side * 0.5, 0.0]);
          b.rbox(0.008, 0.19, 0.03, 0.004, gold, [hx - 0.048, 0.8, side * 0.26], [0.0, side * 0.5, 0.0]);
          // Upper-back vectoring thruster nacelles with glowing cores
          const tx = torsoBackX(0.63) - 0.02;
          b.cyl(0.034, 0.042, 0.09, 20, gunmetal, [tx - 0.02, 0.63, side * 0.11], [0, 0, Math.PI / 2 + 0.5]);
          b.cyl(0.024, 0.03, 0.012, 18, thrustBlue, [tx - 0.058, 0.61, side * 0.11], [0, 0, Math.PI / 2 + 0.5]);
        }
        // Gold spine vertebra plates
        for (let i = 0; i < 6; i++) {
          const y = 0.9 - i * 0.075;
          b.rbox(0.012, 0.05, 0.07 - i * 0.004, 0.004, gold, [torsoBackX(y) - 0.006, y, 0]);
        }
        b.flush(g);
      },
    },
    // ========================================================================
    // 4. SHOULDER PAULDRONS + NANO-MISSILE PODS
    // ========================================================================
    {
      id: 'pauldron-missile-pods',
      name: 'Layered Crimson/Gold Shoulder Pauldrons & Pop-Up Nano-Missile Pods',
      category: 'Ordnance & Defense',
      isOuter: true,
      explodeOffset: [-0.35, 1.35, 0],
      desc: 'Lofted squared-dome deltoid pauldrons with gold base bands and top stripes, each hiding a hinged nano-missile hatch with six guided micro-missile tips.',
      funFact: 'Each shoulder pod packs a dozen millimeter-wave guided micro-missiles capable of locking onto multiple targets at once!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const spec = {
            origin: [0.0, 0.825, side * 0.345],
            axis: [0, 0, side],
            up: [0, 1, 0],
            length: 0.2,
            stations: [
              { t: 0.0, r1: 0.15, r1n: 0.105, r2: 0.15, n: 3.4, c1: 0.025 },
              { t: 0.35, r1: 0.148, r1n: 0.108, r2: 0.148, n: 3.5, c1: 0.025 },
              { t: 0.65, r1: 0.13, r1n: 0.1, r2: 0.13, n: 3.3, c1: 0.02 },
              { t: 0.85, r1: 0.095, r1n: 0.08, r2: 0.095, n: 3.0, c1: 0.012 },
              { t: 0.96, r1: 0.05, r1n: 0.045, r2: 0.05, n: 2.6, c1: 0.004 },
              { t: 1.0, r1: 0.0, r1n: 0.0, r2: 0.0, n: 2.4 },
            ],
          };
          const openA = 0.6 * Math.PI; // open underneath (armpit)
          b.add(axialPatch({ ...spec, aFrom: -openA, aTo: openA, tFrom: 0, tTo: 1, ns: 12, nt: 24 }), hotRodRed);
          b.add(axialPatch({ ...spec, aFrom: -openA, aTo: openA, tFrom: 0, tTo: 0.12, ns: 2, nt: 24, offset: 0.006 }), gold);
          b.add(axialPatch({ ...spec, aFrom: -0.12 * Math.PI, aTo: 0.12 * Math.PI, tFrom: 0.14, tTo: 0.9, ns: 8, nt: 4, offset: 0.007 }), gold);
          // Nano-missile hatch (hinged open) + 6 micro-missile tips
          const hz = side * 0.46;
          b.rbox(0.08, 0.008, 0.06, 0.003, gold, [-0.02, 0.985, hz], [0, 0, side * 0.6]);
          for (const mx of [-0.02, 0.0, 0.02]) for (const mz of [-0.012, 0.012]) {
            b.cyl(0.006, 0.006, 0.03, 10, silver, [-0.02 + mx, 0.97, hz + mz]);
            b.cone(0.006, 0.012, 10, hotRodRed, [-0.02 + mx, 0.99, hz + mz]);
          }
        }
        b.flush(g);
      },
    },
    // ========================================================================
    // 5. ARMS + REPULSOR GAUNTLETS
    // ========================================================================
    {
      id: 'repulsor-gauntlets-arms',
      name: 'Gold Bicep Armor, Crimson Forearm Gauntlets, Articulated Hands & Palm Repulsors',
      category: 'Arms & Repulsors',
      isOuter: true,
      explodeOffset: [0.55, 0.35, 1.55],
      desc: 'Lofted gold upper-arm armor with bicep bulge, gunmetal elbow actuators, flared crimson gauntlets with gold side stripes, articulated five-finger hands and palm-mounted muon repulsor emitters.',
      funFact: 'Iron Man’s palm Repulsors were originally invented as magnetic flight stabilizers before becoming his signature concussive beam weapon!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const E = ELBOW(side);
          const W = WRIST(side);
          // Gold upper arm with bicep swell + crimson outer bicep guard
          limb(b, [S[0], S[1] + 0.02, S[2]], E, [[0, 0.085, 2.3], [0.3, 0.092, 2.5], [0.7, 0.078, 2.5], [1, 0.064, 2.4]], gold, { r2Scale: 1.05 });
          limbPlate(b, S, E, 0.22, 0.78, side, 0.1, 0.07, 0.014, hotRodRed, 0.082);
          // Elbow: gunmetal actuator sphere + red elbow cap
          b.sphere(0.068, 20, 16, gunmetal, E);
          // Crimson gauntlet (flared mid-forearm) with gold side stripes and gold wrist cuff
          limb(b, E, W, [[0, 0.062, 2.5], [0.3, 0.08, 2.8], [0.75, 0.072, 2.8], [1, 0.062, 2.6]], hotRodRed);
          limbPlate(b, E, W, 0.2, 0.9, side, 0.0, 0.028, 0.01, gold, 0.077);
          limbPlate(b, E, W, 0.2, 0.9, -side, 0.0, 0.028, 0.01, gold, 0.077);
          limbPlate(b, E, W, 0.25, 0.85, 0, 1, 0.045, 0.01, gold, 0.078);
          b.cyl(0.066, 0.07, 0.03, 22, gold, W, eulerAlong([W[0] - E[0], W[1] - E[1], W[2] - E[2]]));
          // Hand: palm block, 4 segmented fingers, thumb, palm repulsor (right palm aims forward, left palm down)
          const hand = framedGroup(g, W, FINGER_DIR(side), PALM_NORMAL(side));
          const hb = new MeshBatch();
          hb.rbox(0.082, 0.1, 0.03, 0.01, hotRodRed, [0, 0.05, 0]);
          hb.rbox(0.07, 0.03, 0.028, 0.008, gold, [0, 0.0, 0]);
          for (const fx of [-0.03, -0.01, 0.01, 0.03]) {
            hb.rbox(0.017, 0.046, 0.022, 0.006, gold, [fx, 0.123, -0.004], [-0.35, 0, 0]);
            hb.rbox(0.015, 0.04, 0.02, 0.006, hotRodRed, [fx, 0.16, 0.008], [-0.8, 0, 0]);
          }
          hb.rbox(0.018, 0.05, 0.022, 0.006, gold, [side * 0.052, 0.07, -0.002], [-0.2, 0, side * 0.5]);
          hb.cyl(0.03, 0.03, 0.008, 24, gunmetal, [0, 0.05, 0.016], [Math.PI / 2, 0, 0]);
          hb.cyl(0.021, 0.021, 0.01, 24, arcWhite, [0, 0.05, 0.019], [Math.PI / 2, 0, 0]);
          hb.flush(hand);
        }
        b.flush(g);
      },
    },
    // ========================================================================
    // 6. NANO-LIGHTNING REFOCUSERS + ENERGY SHIELD
    // ========================================================================
    {
      id: 'nano-lightning-refocuser-blade',
      name: 'Deployed Dorsal Nano-Lightning Refocuser Blades & Forearm Energy Shield',
      category: 'Nanotech Weapons',
      isOuter: true,
      explodeOffset: [-1.35, 1.45, 0.55],
      desc: 'Endgame-spec six curved refocuser blades fanned out behind the shoulders on twin nano-arms, each with a glowing plasma edge, plus the hexagonal holographic repulsor shield projected from the left forearm.',
      funFact: 'In Avengers: Endgame, the Mark 85’s dorsal Refocuser blades absorbed Thor’s full Mjolnir/Stormbreaker lightning bolt and supercharged 6 simultaneous repulsor beams!',
      build(g) {
        const b = new MeshBatch();
        const hub = [-0.25, 0.8, 0];
        for (const side of [-1, 1]) {
          b.tube([[torsoBackX(0.84) - 0.01, 0.84, side * 0.15], [-0.22, 0.82, side * 0.08], hub], 0.016, gunmetal);
        }
        b.sphere(0.04, 16, 12, gunmetal, hub);
        b.flush(g);
        // Six curved claws fanning out sideways/backward behind the shoulders (not above the head)
        const claw = [[0, 0], [0.026, 0.05], [0.032, 0.16], [0.018, 0.27], [0.0, 0.31], [-0.016, 0.27], [-0.028, 0.16], [-0.024, 0.05]];
        const glowEdge = [[0.005, 0.06], [0.016, 0.16], [0.01, 0.25], [-0.003, 0.265], [0.003, 0.16], [-0.005, 0.06]];
        for (const phi of [-1.5, -0.95, -0.4, 0.4, 0.95, 1.5]) {
          const dir = [-0.55, Math.cos(phi), Math.sin(phi)];
          const root = [hub[0] - 0.02, hub[1] + 0.1 * Math.cos(phi), 0.1 * Math.sin(phi)];
          const blade = framedGroup(g, root, dir, [1, 0, 0]);
          extrudeProfile(blade, claw, 0.016, hotRodRed, [0, 0, -0.008], [0, 0, 0], 0.004);
          extrudeProfile(blade, claw.map(([x, y]) => [x * 0.6, y * 0.97]), 0.012, gold, [0, 0.004, 0.009], [0, 0, 0], 0.003);
          extrudeProfile(blade, glowEdge, 0.01, arcCyan, [0, 0, 0.016], [0, 0, 0], 0.002);
          extrudeProfile(blade, glowEdge, 0.01, arcCyan, [0, 0, -0.018], [0, 0, 0], 0.002);
        }
        // Holographic hexagonal repulsor shield on the LEFT forearm
        const hex = [];
        for (let i = 0; i < 6; i++) hex.push([Math.cos((i / 6) * TAU + Math.PI / 6) * 0.19, Math.sin((i / 6) * TAU + Math.PI / 6) * 0.19]);
        extrudeProfile(g, hex, 0.012, holo, [0.17, 0.43, -0.69], [0.1, -0.3, 0], 0.004);
        extrudeProfile(g, hex.map(([x, y]) => [x * 0.55, y * 0.55]), 0.014, arcCyan, [0.17, 0.43, -0.696], [0.1, -0.3, 0], 0.002);
      },
    },
    // ========================================================================
    // 7. ABDOMEN + PELVIS
    // ========================================================================
    {
      id: 'abdominal-pelvis-armor',
      name: 'Articulated Gold Abdominal Plates, Crimson Obliques, Belt & V-Codpiece',
      category: 'Core & Waist Armor',
      isOuter: true,
      explodeOffset: [1.35, -0.1, -0.75],
      desc: 'Lofted waist ring with three rows of raised gold abdominal plates, crimson oblique shells, a gunmetal belt groove, gold hip discs and the V-shaped gold pelvic codpiece over gunmetal hip actuators.',
      funFact: 'Overlapping gold-titanium rib and ab plates slide over each other like medieval lobster armor so Tony Stark can twist and bend at supersonic speeds!',
      build(g) {
        const b = new MeshBatch();
        // Waist/pelvis ring y 0.10 -> 0.47 (slightly inset so the chest shell overlaps it like layered armor), closed at the hips
        const tTop = T_AT(0.47);
        const inset = [0, 0.25, 0.5, 0.75, 1].map((k) => {
          const t = k * tTop;
          const p = torsoSample(t);
          return { t, r1: p.r1 * 0.985, r1n: p.r1n * 0.985, r2: p.r2 * 0.985, n: p.n };
        });
        b.add(axialLoft({ ...TORSO, stations: inset, N: 48, capStart: true, capEnd: true }), hotRodRed);
        // Gunmetal belt groove ring at the waist
        b.add(axialPatch({ ...TORSO, aFrom: 0, aTo: TAU, tFrom: T_AT(0.262), tTo: T_AT(0.278), ns: 1, nt: 40, offset: 0.004 }), gunmetal);
        // Gold abdominal plates (3 rows, domed)
        for (const [ya, yb] of [[0.395, 0.455], [0.325, 0.385], [0.255, 0.315]]) {
          b.add(axialPatch({ ...TORSO, aFrom: -0.16 * Math.PI, aTo: 0.16 * Math.PI, tFrom: T_AT(ya), tTo: T_AT(yb), ns: 4, nt: 8, offset: 0.008, bump: (s, u) => 0.05 * Math.sin(Math.PI * s) * Math.sin(Math.PI * u) }), gold);
        }
        for (const side of [-1, 1]) {
          // Gold hip discs + gunmetal hip actuators + crimson hip plates
          b.cyl(0.05, 0.05, 0.02, 24, gold, [0.0, 0.2, side * (torsoHalfW(0.2) + 0.002)], [Math.PI / 2, 0, 0]);
          b.torus(0.036, 0.006, gunmetal, [0.0, 0.2, side * (torsoHalfW(0.2) + 0.012)], [0, 0, 0]);
          b.sphere(0.08, 20, 16, gunmetal, HIP(side));
          b.add(axialPatch({ ...TORSO, aFrom: side * 0.2 * Math.PI, aTo: side * 0.5 * Math.PI, tFrom: T_AT(0.11), tTo: T_AT(0.245), ns: 4, nt: 6, offset: 0.008 }), hotRodRed);
        }
        // Gold V-codpiece
        b.add(axialPatch({ ...TORSO, aFrom: -0.17 * Math.PI, aTo: 0.17 * Math.PI, tFrom: (u) => T_AT(0.105 + 0.08 * Math.abs(u - 0.5) * 2), tTo: T_AT(0.245), ns: 6, nt: 8, offset: 0.011 }), gold);
        b.flush(g);
      },
    },
    // ========================================================================
    // 8. THIGHS + KNEES
    // ========================================================================
    {
      id: 'thigh-exo-thrusters',
      name: 'Sculpted Crimson Thigh Armor, Gold Inner Strips, Knee Caps & Attitude Vents',
      category: 'Upper Leg Armor',
      isOuter: true,
      explodeOffset: [-0.3, -0.55, -1.55],
      desc: 'Lofted quadriceps armor tapering to gunmetal knee actuators with gold patella caps, gold inner-thigh strips and lateral attitude-control thruster vents.',
      funFact: 'Lateral micro-thrusters in the thigh armor let Iron Man hover motionless in crosswinds or strafe sideways mid-air!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const H = HIP(side);
          const K = KNEE(side);
          limb(b, [H[0], H[1] + 0.03, H[2]], K, [[0, 0.128, 2.6], [0.3, 0.126, 2.8], [0.7, 0.108, 2.8], [1, 0.088, 2.6]], hotRodRed, { r2Scale: 0.96 });
          // Gold inner-thigh strip + front quad plate + outer vent slot
          limbPlate(b, H, K, 0.15, 0.85, -side, 0.3, 0.04, 0.01, gold, 0.118);
          limbPlate(b, H, K, 0.3, 0.7, side, 0.0, 0.026, 0.012, gunmetal, 0.113);
          // Knee: gunmetal actuator cylinder + gold patella cap
          b.cyl(0.068, 0.068, 0.17, 22, gunmetal, K, [Math.PI / 2, 0, 0]);
          b.add(
            axialLoft({
              origin: [K[0] + 0.02, K[1], K[2]],
              axis: [1, 0, 0],
              up: [0, 1, 0],
              length: 0.09,
              stations: [{ t: 0, r1: 0.075, r2: 0.07, n: 2.6 }, { t: 0.5, r1: 0.068, r2: 0.064, n: 2.6 }, { t: 0.85, r1: 0.04, r2: 0.04, n: 2.4 }, { t: 1, r1: 0, r2: 0, n: 2.2 }],
              N: 28,
            }),
            gold,
          );
        }
        b.flush(g);
      },
    },
    // ========================================================================
    // 9. SHINS + BOOTS + THRUSTERS
    // ========================================================================
    {
      id: 'calf-boot-jet-thrusters',
      name: 'Crimson Shin Greaves, Calf Airbrakes, Gold-Toed Boots & Sole Plasma Thrusters',
      category: 'Flight Propulsion & Boots',
      isOuter: true,
      explodeOffset: [0.4, -1.55, 0],
      desc: 'Lofted calf greaves with gold side stripes and rear airbrake fins, gunmetal ankle actuators, lofted armored boots with gold toe caps and circular sole-mounted plasma flight thrusters.',
      funFact: 'Each boot houses a miniature hybrid plasma turbine that sucks in surrounding air at low altitude or runs on pure Arc Reactor plasma in space!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const K = KNEE(side);
          const A = ANKLE(side);
          limb(b, [K[0], K[1] - 0.03, K[2]], A, [[0, 0.084, 2.8], [0.25, 0.097, 3.0], [0.6, 0.08, 2.9], [1, 0.064, 2.6]], hotRodRed, { r2Scale: 0.95 });
          limbPlate(b, K, A, 0.2, 0.85, side, 0.2, 0.03, 0.01, gold, 0.088);
          limbPlate(b, K, A, 0.2, 0.85, -side, 0.2, 0.03, 0.01, gold, 0.088);
          limbPlate(b, K, A, 0.15, 0.75, 0, 1, 0.05, 0.012, gold, 0.088);
          // Rear calf airbrake fin + ankle actuator
          b.rbox(0.012, 0.2, 0.06, 0.005, deepRed, [K[0] - 0.1, -0.55, K[2]], [0, 0, -0.12]);
          b.cyl(0.055, 0.06, 0.07, 20, gunmetal, [A[0], A[1] + 0.01, A[2]]);
          // Boot: lofted heel-to-toe along +X with a flat sole on y = -1.0, gold toe cap & instep plate
          const boot = {
            origin: [-0.11, -0.92, A[2]],
            axis: [1, 0, 0],
            up: [0, 1, 0],
            length: 0.33,
            // c1 = r1n - 0.08 keeps the sole perfectly flat on y = -1.0 while the instep rises to the ankle
            stations: [
              { t: 0.0, r1: 0.06, r1n: 0.075, r2: 0.072, n: 2.6, c1: -0.005 },
              { t: 0.3, r1: 0.085, r1n: 0.082, r2: 0.085, n: 3.0, c1: 0.002 },
              { t: 0.62, r1: 0.062, r1n: 0.08, r2: 0.082, n: 3.0, c1: 0.0 },
              { t: 0.88, r1: 0.04, r1n: 0.06, r2: 0.068, n: 2.8, c1: -0.02 },
              { t: 1.0, r1: 0.01, r1n: 0.04, r2: 0.04, n: 2.6, c1: -0.04 },
            ],
          };
          b.add(axialLoft({ ...boot, N: 36, capStart: true, capEnd: true }), hotRodRed);
          b.add(axialPatch({ ...boot, aFrom: -0.7 * Math.PI, aTo: 0.7 * Math.PI, tFrom: 0.68, tTo: 1.0, ns: 6, nt: 16, offset: 0.006 }), gold);
          b.add(axialPatch({ ...boot, aFrom: -0.5 * Math.PI, aTo: 0.5 * Math.PI, tFrom: 0.18, tTo: 0.5, ns: 4, nt: 10, offset: 0.006 }), gold);
          // Sole plate + circular plasma thruster (bezel + glowing core)
          b.rbox(0.3, 0.012, 0.15, 0.004, gunmetal, [0.04, -0.995, A[2]]);
          b.torus(0.046, 0.008, gunmetal, [0.04, -0.997, A[2]], [Math.PI / 2, 0, 0]);
          b.cyl(0.04, 0.04, 0.006, 24, thrustBlue, [0.04, -0.9995, A[2]]);
          b.cyl(0.02, 0.02, 0.008, 18, arcWhite, [0.04, -0.9995, A[2]]);
        }
        b.flush(g);
      },
    },
    // ========================================================================
    // 10. INTERNAL ENDOSKELETON
    // ========================================================================
    {
      id: 'internal-nanotech-endoskeleton',
      name: 'Internal Gold-Titanium Nanotech Endoskeleton & Plasma Conduits',
      category: 'Internal Endoskeleton',
      isOuter: false,
      explodeOffset: [-1.4, -0.4, 1.15],
      desc: 'X-ray cutaway of the biometric endoskeleton: segmented spinal column, ribcage hoops, pelvic ring, humerus/radius and femur/tibia actuator struts with silver joints, and glowing cyan nano-conduits feeding Arc Reactor plasma to every repulsor and thruster.',
      funFact: 'Billions of autonomous nanobots flow along internal plasma conduits to instantly rebuild damaged armor or morph into new tools!',
      build(g) {
        const b = new MeshBatch();
        // Spine with vertebra discs, ribcage hoops, pelvic ring, collarbone bar
        b.cyl(0.03, 0.03, 0.85, 14, gunmetal, [-0.03, 0.56, 0]);
        for (let i = 0; i < 9; i++) b.cyl(0.045, 0.045, 0.02, 12, silver, [-0.03, 0.2 + i * 0.085, 0]);
        for (const y of [0.56, 0.66, 0.76, 0.86]) b.torus(torsoHalfW(y) * 0.72, 0.009, gunmetal, [0.0, y, 0], [Math.PI / 2, 0, 0], [0.62, 1, 1]);
        b.torus(0.16, 0.014, gunmetal, [0.0, 0.16, 0], [Math.PI / 2, 0, 0], [0.7, 1, 1]);
        b.cyl(0.02, 0.02, 0.76, 12, silver, [0.02, 0.9, 0], [Math.PI / 2, 0, 0]);
        // Limb struts + joints + cyan plasma conduits (reactor -> hands / boots / helmet)
        for (const side of [-1, 1]) {
          const segs = [[SHOULDER(side), ELBOW(side)], [ELBOW(side), WRIST(side)], [HIP(side), KNEE(side)], [KNEE(side), ANKLE(side)]];
          for (const [p, q] of segs) {
            const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
            const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
            b.cyl(0.022, 0.018, len, 12, gunmetal, mid, eulerAlong([q[0] - p[0], q[1] - p[1], q[2] - p[2]]));
          }
          for (const j of [SHOULDER(side), ELBOW(side), HIP(side), KNEE(side), ANKLE(side)]) b.sphere(0.032, 14, 10, silver, j);
          b.tube([[0.12, 0.74, 0], [0.06, 0.86, side * 0.3], SHOULDER(side), ELBOW(side), WRIST(side)], 0.009, arcCyan, 40);
          b.tube([[0.1, 0.7, 0], [0.04, 0.3, side * 0.1], HIP(side), KNEE(side), ANKLE(side), [0.04, -0.97, side * 0.155]], 0.009, arcCyan, 40);
        }
        b.tube([[0.12, 0.78, 0], [0.04, 0.95, 0], [0.0, 1.1, 0]], 0.009, arcCyan, 16);
        b.flush(g);
      },
    },
  ];

  return {
    id: 'iron-man-mark-85',
    name: 'Iron Man Mark LXXXV (85) Nano-Tech Armor',
    brand: 'Stark Industries',
    badge: 'Mach 10+ • 8 GJ/s Arc Reactor • Nanotech Swarm',
    desc: 'Tony Stark’s ultimate Mark LXXXV (85) bleeding-edge Gold-Titanium Nano-Tech Exoskeleton, sculpted like the Endgame suit: lofted hot-rod red and gold armor, the chest RT Arc Reactor, palm Repulsors, 6-blade Dorsal Lightning Refocusers and boot plasma thrusters.',
    cameraPos: [3.4, 1.35, 3.3],
    cameraTarget: [0, 0.12, 0],
    parts,
    quiz: [
      { q: 'Which glowing core in the center of the Mark 85 chestplate generates 8 gigajoules per second to power the suit?', correctId: 'arc-reactor-chestplate', distractors: ['mark85-helmet-hud', 'pauldron-missile-pods', 'thigh-exo-thrusters'] },
      { q: 'Which 6-blade dorsal array behind Iron Man’s shoulders absorbs lightning to supercharge his repulsor blasts?', correctId: 'nano-lightning-refocuser-blade', distractors: ['dorsal-airbrake-array', 'calf-boot-jet-thrusters', 'abdominal-pelvis-armor'] },
      { q: 'Which palm-mounted emitters serve as both magnetic flight stabilizers and concussive energy blasters?', correctId: 'repulsor-gauntlets-arms', distractors: ['internal-nanotech-endoskeleton', 'mark85-helmet-hud', 'thigh-exo-thrusters'] },
      { q: 'Which part forms out of gold-titanium nanoparticles in under a second and shows Tony the glowing F.R.I.D.A.Y. heads-up display?', correctId: 'mark85-helmet-hud', distractors: ['pauldron-missile-pods', 'arc-reactor-chestplate', 'dorsal-airbrake-array'] },
      { q: 'Which part hides the plasma turbines that lift Iron Man off the ground from the soles of his feet?', correctId: 'calf-boot-jet-thrusters', distractors: ['thigh-exo-thrusters', 'repulsor-gauntlets-arms', 'nano-lightning-refocuser-blade'] },
    ],
  };
}
