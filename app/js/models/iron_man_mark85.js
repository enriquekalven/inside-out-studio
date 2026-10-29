// ============================================================================
// Marvel Comics Iron Man Powered Exoskeleton (Classic Model 4 / Extremis / OHOTMU Cutaway)
//
// Engineered from canonical Marvel Comics technical schematics (Eliot R. Brown's
// Official Handbook of the Marvel Universe cutaway, Bob Layton & Alex Ross Classic
// Red-and-Gold Model 4, and Adi Granov's Extremis Model 29):
// 1. Canonical Marvel Comics Silhouette & Color Blocking:
//    - Helmet: Hinged gleaming Comic Gold faceplate with Crimson widow's-peak crest,
//      slanted rectangular comic eye slits, chiseled cheekbones, classic horizontal
//      comic mouth slit, and circular Crimson/Gold phased-array ear transceivers.
//    - Shoulders, Chest & Trunk: Flared rounded-bell Crimson comic shoulder pauldrons
//      with gold rim trim, 100% Crimson broad heroic pectoral carapace with the
//      circular/pentagonal-bezel Marvel Comics Unibeam projector, segmented Crimson
//      abdominal rib lames, classic comic V-belt trunks, and twin circular Hip Power Pods.
//    - Arms & Legs: 100% gleaming Comic Gold polarized micro-mesh bicep & thigh sleeves
//      paired with dramatic flared-cuff Crimson repulsor gauntlets and flared-cuff
//      Crimson jet boots with Eliot R. Brown calf ram-air intake louvers.
// 2. True Wearable Hollow Clamshell Architecture ("Room for a Human Inside"):
//    - Zero solid end-caps or stick-robot rods. Every armor plate and limb sleeve is a
//      watertight, double-walled 3D hollow shell (~10–14 mm wall thickness) with a
//      shaded dark-quilted titanium inner liner, stitched chamfered alloy rims, and
//      an unmistakable hollow human pilot cavity & thermocouple undersuit sheath inside.
// ============================================================================
import * as THREE from '../../vendor/three.module.js';
import { carPaint, brushedMetal, chromeMat, glassMat, emissiveMat, mat } from '../materials.js';
import { loftRings, surfaceGrid, MeshBatch, smoothCurve, smoothstep, cachedCanvasTexture } from '../loft.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const gauss = (x, mu, sig) => Math.exp(-0.5 * ((x - mu) / sig) ** 2);

// ----------------------------------------------------------------------------
// Procedural Marvel Comics panel-line & micro-chainmail bump textures
// ----------------------------------------------------------------------------
function comicArmorBumpTex() {
  return cachedCanvasTexture(
    'marvel-comics-armor-bump-v2',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      // Subtle polarized micro-chainmail / crystalline weave
      ctx.strokeStyle = 'rgba(110,110,110,0.22)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Crisp comic-book armor seam lines
      ctx.strokeStyle = '#303030';
      ctx.lineWidth = 2.2;
      for (const yFrac of [0.2, 0.48, 0.76]) {
        const y = yFrac * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w * 0.34, y + 10);
        ctx.lineTo(w * 0.5, y + 2);
        ctx.lineTo(w * 0.66, y + 10);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    { repeat: [2, 2], linear: true },
  );
}

function innerQuiltedBumpTex() {
  return cachedCanvasTexture(
    'marvel-comics-inner-liner-bump-v1',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#454545';
      ctx.lineWidth = 2;
      const step = 32;
      for (let i = -h; i < w + h; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, h);
        ctx.lineTo(i + h, 0);
        ctx.stroke();
      }
    },
    { repeat: [3, 3], linear: true },
  );
}

// ----------------------------------------------------------------------------
// Parametric Loft & True Double-Walled Hollow Shell Builders
// ----------------------------------------------------------------------------

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

function wrapPi(a) {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/** Flip normals and reverse triangle winding so an inner cavity surface renders facing inward. */
function invertGeometry(geo) {
  const nor = geo.attributes.normal;
  if (nor) {
    const arr = nor.array;
    for (let i = 0; i < arr.length; i++) arr[i] = -arr[i];
    nor.needsUpdate = true;
  }
  const idx = geo.index;
  if (idx) {
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    idx.needsUpdate = true;
  }
  return geo;
}

/** Stitch an annular rim wall between an outer open ring and an inner open ring. */
function buildAnnularRim(outerRing, innerRing, outwardDir) {
  const N = outerRing.length;
  const cols = N + 1;
  const pos = new Float32Array(cols * 2 * 3);
  const nor = new Float32Array(cols * 2 * 3);
  const uv = new Float32Array(cols * 2 * 2);
  const ax = new THREE.Vector3(outwardDir[0], outwardDir[1], outwardDir[2]).normalize();

  for (let j = 0; j <= N; j++) {
    const jj = j % N;
    const po = outerRing[jj];
    const pi = innerRing[jj];
    const k0 = j;
    const k1 = cols + j;
    pos[k0 * 3] = po[0];
    pos[k0 * 3 + 1] = po[1];
    pos[k0 * 3 + 2] = po[2];
    pos[k1 * 3] = pi[0];
    pos[k1 * 3 + 1] = pi[1];
    pos[k1 * 3 + 2] = pi[2];
    nor[k0 * 3] = ax.x;
    nor[k0 * 3 + 1] = ax.y;
    nor[k0 * 3 + 2] = ax.z;
    nor[k1 * 3] = ax.x;
    nor[k1 * 3 + 1] = ax.y;
    nor[k1 * 3 + 2] = ax.z;
    uv[k0 * 2] = j / N;
    uv[k0 * 2 + 1] = 0;
    uv[k1 * 2] = j / N;
    uv[k1 * 2 + 1] = 1;
  }

  // Verify triangle winding faces +ax
  let flip = false;
  for (let j = 0; j < N; j++) {
    const p0 = outerRing[j];
    const p1 = outerRing[(j + 1) % N];
    const q0 = innerRing[j];
    const e1 = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    const e2 = new THREE.Vector3(q0[0] - p0[0], q0[1] - p0[1], q0[2] - p0[2]);
    const fn = new THREE.Vector3().crossVectors(e1, e2);
    if (fn.lengthSq() > 1e-14) {
      flip = fn.dot(ax) < 0;
      break;
    }
  }

  const idx = [];
  for (let j = 0; j < N; j++) {
    const a = j;
    const b = j + 1;
    const c = cols + j;
    const d = cols + j + 1;
    if (flip) idx.push(a, c, b, b, c, d);
    else idx.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Sample axial rings over [tFrom, tTo] with radial scale `scaleMul`. */
function sampleAxialRings(o, scaleMul = 1) {
  const frame = axisFrame(o.origin, o.axis, o.up);
  const len = V3(o.axis).length();
  const sample = stationSampler(o.stations);
  const N = o.N ?? 48;
  const steps = o.steps ?? 20;
  const tFrom = o.tFrom ?? 0;
  const tTo = o.tTo ?? 1;
  const radial = o.radial || null;
  const rings = [];
  for (let i = 0; i <= steps; i++) {
    const t = lerp(tFrom, tTo, i / steps);
    const p = sample(t);
    const ring = new Array(N);
    for (let j = 0; j < N; j++) {
      const a = wrapPi((j / N) * TAU);
      const rad = (radial ? radial(t, a) : 1) * scaleMul;
      ring[j] = ringPoint(frame, len, t, a, p, rad);
    }
    rings.push(ring);
  }
  return { rings, frame };
}

function axialLoft(o) {
  const { rings } = sampleAxialRings(o, o.scaleMul ?? 1);
  return loftRings(rings, { capStart: o.capStart ?? false, capEnd: o.capEnd ?? false });
}

/**
 * Build a TRUE OPEN-ENDED DOUBLE-WALLED HOLLOW ARMOR SLEEVE:
 * - Outer sculpted skin (outerMat)
 * - Inner concave liner skin (innerMat, facing inward toward the human pilot cavity!)
 * - Stitched physical armor rim walls at open ends (rimMat) — ZERO solid end-caps!
 */
function addHollowTube(batch, o, outerMat, innerMat, rimMat = outerMat) {
  const wallRatio = o.wallRatio ?? 0.85;
  const openStart = o.openStart !== false;
  const openEnd = o.openEnd !== false;

  const { rings: outerRings, frame } = sampleAxialRings(o, 1.0);
  const { rings: innerRings } = sampleAxialRings(o, wallRatio);

  batch.add(loftRings(outerRings, { capStart: !openStart, capEnd: !openEnd }), outerMat);
  batch.add(
    invertGeometry(loftRings(innerRings, { capStart: !openStart, capEnd: !openEnd })),
    innerMat,
  );

  if (openStart) {
    batch.add(buildAnnularRim(outerRings[0], innerRings[0], [-frame.d.x, -frame.d.y, -frame.d.z]), rimMat);
  }
  if (openEnd) {
    const last = outerRings.length - 1;
    batch.add(buildAnnularRim(outerRings[last], innerRings[last], [frame.d.x, frame.d.y, frame.d.z]), rimMat);
  }
}

/** Thin conforming exterior surface patch (trim accents, brow crests, muscle bevels). */
function axialPatch(o) {
  const frame = axisFrame(o.origin, o.axis, o.up);
  const len = V3(o.axis).length();
  const sample = stationSampler(o.stations);
  const radial = o.radial || null;
  const aMid = 0.5 * (o.aFrom + o.aTo);
  const outHint = frame.e1
    .clone()
    .multiplyScalar(Math.cos(aMid))
    .addScaledVector(frame.e2, Math.sin(aMid));
  return surfaceGrid(
    (s, u) => {
      const t = lerp(o.tFrom, o.tTo, s);
      const a = wrapPi(lerp(o.aFrom, o.aTo, u));
      return ringPoint(frame, len, t, a, sample(t), radial ? radial(t, a) : 1);
    },
    {
      ns: o.ns ?? 14,
      nt: o.nt ?? 16,
      offset: o.offset ?? 0.0025,
      outward: [outHint.x, outHint.y, outHint.z],
    },
  );
}

/**
 * Build a TRUE WATERTIGHT THICK-WALLED CURVED CLAMSHELL ARMOR PLATE:
 * - Outer convex armor surface (+wallThick/2) in outerMat
 * - Inner concave padded interior surface (-wallThick/2, inward normals) in innerMat
 * - 4 stitched perimeter edge walls around s=0, s=1, u=0, u=1 in rimMat
 */
function addThickClamshell(batch, o, outerMat, innerMat, rimMat = outerMat) {
  const frame = axisFrame(o.origin, o.axis, o.up);
  const len = V3(o.axis).length();
  const sample = stationSampler(o.stations);
  const radial = o.radial || null;
  const ns = o.ns ?? 16;
  const nt = o.nt ?? 20;
  const rows = ns + 1;
  const cols = nt + 1;
  const halfW = (o.wallThick ?? 0.014) * 0.5;
  const baseOff = o.offset ?? 0;

  const P = new Array(rows * cols);
  const C = new Array(rows * cols);
  for (let i = 0; i <= ns; i++) {
    const t = lerp(o.tFrom, o.tTo, i / ns);
    const st = sample(t);
    const cx = frame.o.x + frame.d.x * len * t + frame.e1.x * st.c1 + frame.e2.x * st.c2;
    const cy = frame.o.y + frame.d.y * len * t + frame.e1.y * st.c1 + frame.e2.y * st.c2;
    const cz = frame.o.z + frame.d.z * len * t + frame.e1.z * st.c1 + frame.e2.z * st.c2;
    for (let j = 0; j <= nt; j++) {
      const a = wrapPi(lerp(o.aFrom, o.aTo, j / nt));
      P[i * cols + j] = ringPoint(frame, len, t, a, st, radial ? radial(t, a) : 1);
      C[i * cols + j] = [cx, cy, cz];
    }
  }

  const Nrm = new Array(rows * cols);
  const ta = new THREE.Vector3();
  const tb = new THREE.Vector3();
  const n = new THREE.Vector3();
  let orient = 0;
  for (let i = 0; i <= ns; i++) {
    for (let j = 0; j <= nt; j++) {
      const a = P[Math.min(ns, i + 1) * cols + j];
      const b = P[Math.max(0, i - 1) * cols + j];
      const c = P[i * cols + Math.min(nt, j + 1)];
      const d = P[i * cols + Math.max(0, j - 1)];
      ta.set(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      tb.set(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
      n.crossVectors(tb, ta);
      const p = P[i * cols + j];
      const ce = C[i * cols + j];
      const rx = p[0] - ce[0];
      const ry = p[1] - ce[1];
      const rz = p[2] - ce[2];
      if (n.lengthSq() < 1e-16) n.set(rx, ry, rz);
      n.normalize();
      orient += n.x * rx + n.y * ry + n.z * rz;
      Nrm[i * cols + j] = [n.x, n.y, n.z];
    }
  }
  const sign = orient >= 0 ? 1 : -1;

  const Pout = new Array(rows * cols);
  const Pin = new Array(rows * cols);
  for (let k = 0; k < rows * cols; k++) {
    const p = P[k];
    const nn = Nrm[k];
    const nx = nn[0] * sign;
    const ny = nn[1] * sign;
    const nz = nn[2] * sign;
    Nrm[k] = [nx, ny, nz];
    Pout[k] = [p[0] + nx * (baseOff + halfW), p[1] + ny * (baseOff + halfW), p[2] + nz * (baseOff + halfW)];
    Pin[k] = [p[0] + nx * (baseOff - halfW), p[1] + ny * (baseOff - halfW), p[2] + nz * (baseOff - halfW)];
  }

  const makeSheet = (pts, normalMul, reverseWinding) => {
    const pos = new Float32Array(rows * cols * 3);
    const nor = new Float32Array(rows * cols * 3);
    const uv = new Float32Array(rows * cols * 2);
    for (let k = 0; k < rows * cols; k++) {
      const p = pts[k];
      const nn = Nrm[k];
      pos[k * 3] = p[0];
      pos[k * 3 + 1] = p[1];
      pos[k * 3 + 2] = p[2];
      nor[k * 3] = nn[0] * normalMul;
      nor[k * 3 + 1] = nn[1] * normalMul;
      nor[k * 3 + 2] = nn[2] * normalMul;
      uv[k * 2] = Math.floor(k / cols) / ns;
      uv[k * 2 + 1] = (k % cols) / nt;
    }
    const idx = [];
    for (let i = 0; i < ns; i++) {
      for (let j = 0; j < nt; j++) {
        const a = i * cols + j;
        const b = (i + 1) * cols + j;
        const c = (i + 1) * cols + j + 1;
        const d = i * cols + j + 1;
        const windPos = sign > 0 ? !reverseWinding : reverseWinding;
        if (windPos) idx.push(a, d, b, b, d, c);
        else idx.push(a, b, d, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  };

  batch.add(makeSheet(Pout, 1, false), outerMat);
  batch.add(makeSheet(Pin, -1, true), innerMat);

  // Build stitched perimeter edge strips along all 4 boundaries
  const addEdgeStrip = (indices, interiorIndices) => {
    const M = indices.length;
    const pos = new Float32Array(M * 2 * 3);
    const nor = new Float32Array(M * 2 * 3);
    const uv = new Float32Array(M * 2 * 2);

    // Outward edge hint = boundary point minus interior neighbor
    const hints = new Array(M);
    for (let m = 0; m < M; m++) {
      const pb = P[indices[m]];
      const pi = P[interiorIndices[m]];
      const hx = pb[0] - pi[0];
      const hy = pb[1] - pi[1];
      const hz = pb[2] - pi[2];
      const hl = Math.hypot(hx, hy, hz) || 1;
      hints[m] = [hx / hl, hy / hl, hz / hl];
    }

    for (let m = 0; m < M; m++) {
      const po = Pout[indices[m]];
      const pi = Pin[indices[m]];
      const h = hints[m];
      pos[m * 3] = po[0];
      pos[m * 3 + 1] = po[1];
      pos[m * 3 + 2] = po[2];
      pos[(M + m) * 3] = pi[0];
      pos[(M + m) * 3 + 1] = pi[1];
      pos[(M + m) * 3 + 2] = pi[2];
      nor[m * 3] = h[0];
      nor[m * 3 + 1] = h[1];
      nor[m * 3 + 2] = h[2];
      nor[(M + m) * 3] = h[0];
      nor[(M + m) * 3 + 1] = h[1];
      nor[(M + m) * 3 + 2] = h[2];
      uv[m * 2] = m / Math.max(1, M - 1);
      uv[m * 2 + 1] = 0;
      uv[(M + m) * 2] = m / Math.max(1, M - 1);
      uv[(M + m) * 2 + 1] = 1;
    }

    let flip = false;
    for (let m = 0; m < M - 1; m++) {
      const p0 = Pout[indices[m]];
      const p1 = Pout[indices[m + 1]];
      const q0 = Pin[indices[m]];
      const e1 = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
      const e2 = new THREE.Vector3(q0[0] - p0[0], q0[1] - p0[1], q0[2] - p0[2]);
      const fn = new THREE.Vector3().crossVectors(e1, e2);
      if (fn.lengthSq() > 1e-14) {
        const h = hints[m];
        flip = fn.x * h[0] + fn.y * h[1] + fn.z * h[2] < 0;
        break;
      }
    }

    const idx = [];
    for (let m = 0; m < M - 1; m++) {
      const a = m;
      const b = m + 1;
      const c = M + m;
      const d = M + m + 1;
      if (flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    batch.add(geo, rimMat);
  };

  // Bottom edge (i = 0) & Top edge (i = ns)
  const row0 = [];
  const row1 = [];
  const rowTop = [];
  const rowTopIn = [];
  for (let j = 0; j <= nt; j++) {
    row0.push(j);
    row1.push(cols + j);
    rowTop.push(ns * cols + j);
    rowTopIn.push((ns - 1) * cols + j);
  }
  addEdgeStrip(row0, row1);
  addEdgeStrip(rowTop, rowTopIn);

  // Left seam (j = 0) & Right seam (j = nt)
  const col0 = [];
  const col1 = [];
  const colR = [];
  const colRIn = [];
  for (let i = 0; i <= ns; i++) {
    col0.push(i * cols);
    col1.push(i * cols + 1);
    colR.push(i * cols + nt);
    colRIn.push(i * cols + (nt - 1));
  }
  addEdgeStrip(col0, col1);
  addEdgeStrip(colR, colRIn);
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _up = new THREE.Vector3(0, 1, 0);
function eulerAlong(dir) {
  _q.setFromUnitVectors(_up, V3(dir).normalize());
  _e.setFromQuaternion(_q);
  return [_e.x, _e.y, _e.z];
}

// ============================================================================
// MAIN BUILDER — MARVEL COMICS IRON MAN POWERED EXOSKELETON
// ============================================================================
export function buildIronManModel() {
  // Canonical Marvel Comics Palette: vibrant enameled Crimson + radiant Golden Avenger Gold
  const bump = comicArmorBumpTex();
  const linerBump = innerQuiltedBumpTex();
  const applyBump = (m, scale = 0.0022, tex = bump) => {
    m.bumpMap = tex;
    m.bumpScale = scale;
    return m;
  };

  const comicCrimson = applyBump(carPaint(0xd91424, { metalness: 0.72, roughness: 0.16 }));
  const deepCrimson = applyBump(carPaint(0x9e0b18, { metalness: 0.78, roughness: 0.20 }));
  const comicGold = applyBump(carPaint(0xf6be24, { metalness: 0.86, roughness: 0.16 }));
  const richGold = applyBump(carPaint(0xd89610, { metalness: 0.88, roughness: 0.22 }));
  const innerLiner = applyBump(mat(0x1b2332, 0.58, 0.35), 0.0035, linerBump);
  const rimTitanium = brushedMetal(0xcbd5e1, { roughness: 0.24, metalness: 0.90 });
  const rimGold = brushedMetal(0xeab308, { roughness: 0.22, metalness: 0.92 });
  const gunmetal = brushedMetal(0x232934, { roughness: 0.32, metalness: 0.86 });
  const darkSlot = mat(0x0c1017, 0.42, 0.75);
  const silver = chromeMat(0xe2e8f0);
  const undersuitNavy = applyBump(mat(0x131c2e, 0.46, 0.42), 0.0025, linerBump);
  const pilotHolo = glassMat(0x67e8f9, 0.26, 0.15);

  const unibeamWhite = emissiveMat(0xffffff, 0x7dd3fc, 3.6);
  const unibeamCyan = emissiveMat(0xbae6fd, 0x38bdf8, 2.7);
  const hudEyeGlow = emissiveMat(0xf8fafc, 0x7dd3fc, 3.2);
  const repulsorGold = emissiveMat(0xfef08a, 0xf59e0b, 2.4);
  const bioScanCyan = emissiveMat(0x67e8f9, 0x06b6d4, 1.9);

  // --------------------------------------------------------------------------
  // Heroic 8-Head Marvel Comics Proportions (Y = -1.00 soles to +1.34 crown)
  // Facing +X, Up +Y, Right/Starboard +Z
  // --------------------------------------------------------------------------
  const SHOULDER = (s) => [-0.005, 0.855, s * 0.305];
  const ELBOW = (s) => [-0.015, 0.515, s * 0.372];
  const WRIST = (s) => [0.095, 0.185, s * 0.415];
  const HIP = (s) => [0.005, 0.135, s * 0.148];
  const KNEE = (s) => [0.020, -0.425, s * 0.176];
  const ANKLE = (s) => [-0.005, -0.885, s * 0.194];

  // Shared Heroic Thoracic & Abdominal Loft Envelope (y = 0.06 .. 0.99)
  const TORSO_Y0 = 0.06;
  const TORSO_H = 0.93;
  const T_AT = (y) => (y - TORSO_Y0) / TORSO_H;

  const TORSO_STATIONS = [
    { t: 0.00, r1: 0.112, r1n: 0.108, r2: 0.148, n: 2.5, c1: 0.006 }, // y = 0.06 lower trunk arch
    { t: 0.13, r1: 0.132, r1n: 0.128, r2: 0.184, n: 2.6, c1: 0.008 }, // y = 0.18 iliac hip crest
    { t: 0.25, r1: 0.126, r1n: 0.122, r2: 0.168, n: 2.5, c1: 0.008 }, // y = 0.29 waist belt
    { t: 0.35, r1: 0.124, r1n: 0.118, r2: 0.156, n: 2.5, c1: 0.010 }, // y = 0.39 athletic comic taper!
    { t: 0.48, r1: 0.142, r1n: 0.132, r2: 0.186, n: 2.6, c1: 0.014 }, // y = 0.51 lower ribcage rim
    { t: 0.64, r1: 0.172, r1n: 0.152, r2: 0.228, n: 2.7, c1: 0.020 }, // y = 0.66 mid chest / lats
    { t: 0.79, r1: 0.192, r1n: 0.162, r2: 0.258, n: 2.8, c1: 0.024 }, // y = 0.79 broad heroic pectorals!
    { t: 0.91, r1: 0.156, r1n: 0.138, r2: 0.222, n: 2.6, c1: 0.012 }, // y = 0.91 clavicles / traps
    { t: 1.00, r1: 0.096, r1n: 0.094, r2: 0.108, n: 2.3, c1: 0.002 }, // y = 0.99 open neck collar aperture
  ];

  const torsoRadial = (t, a) => {
    const aa = Math.abs(a);
    // Broad sculpted Marvel Comics pectoral shelves with crisp sternum valley
    const pec = 0.072 * gauss(t, 0.77, 0.085) * gauss(aa, 0.38, 0.22);
    const sternum = -0.028 * gauss(t, 0.74, 0.11) * gauss(aa, 0.0, 0.10);
    // Comic abdominal six-pack/rib contour
    const abs = 0.022 * gauss(t, 0.38, 0.10) * gauss(aa, 0.22, 0.16);
    // Rear scapular & latissimus V-taper
    const lats = 0.048 * gauss(t, 0.74, 0.11) * gauss(aa, 2.48, 0.28);
    const spineGroove = -0.030 * gauss(t, 0.66, 0.18) * gauss(aa, Math.PI, 0.12);
    return 1 + pec + sternum + abs + lats + spineGroove;
  };

  const TORSO = {
    origin: [0, TORSO_Y0, 0],
    axis: [0, TORSO_H, 0],
    up: [1, 0, 0],
    stations: TORSO_STATIONS,
    radial: torsoRadial,
  };
  const torsoSample = stationSampler(TORSO_STATIONS);

  // Hollow Cranial Helmet Envelope (open neck bottom at y = 1.045, closed crown at y = 1.338)
  const HELMET = {
    origin: [0.008, 1.045, 0],
    axis: [0, 0.293, 0],
    up: [1, 0, 0],
    stations: [
      { t: 0.00, r1: 0.098, r1n: 0.094, r2: 0.086, n: 2.5, c1: 0.012 }, // Open neck/jaw aperture!
      { t: 0.16, r1: 0.118, r1n: 0.104, r2: 0.094, n: 2.8, c1: 0.018 }, // Chiseled comic chin & jaw
      { t: 0.38, r1: 0.126, r1n: 0.114, r2: 0.102, n: 2.9, c1: 0.014 }, // Cheekbones
      { t: 0.58, r1: 0.128, r1n: 0.120, r2: 0.106, n: 2.7, c1: 0.010 }, // Brow & ear pods
      { t: 0.78, r1: 0.118, r1n: 0.116, r2: 0.098, n: 2.4, c1: 0.004 }, // Forehead dome
      { t: 0.93, r1: 0.078, r1n: 0.080, r2: 0.068, n: 2.2, c1: -0.002 },
      { t: 1.00, r1: 0.010, r1n: 0.010, r2: 0.010, n: 2.0, c1: -0.004 }, // Crown apex
    ],
    radial: (t, a) => {
      const aa = Math.abs(a);
      const jaw = 0.042 * gauss(t, 0.20, 0.10) * gauss(aa, 0.72, 0.22);
      const brow = 0.036 * gauss(t, 0.57, 0.065) * gauss(aa, 0.28, 0.28);
      const eyeSocket = -0.042 * gauss(t, 0.50, 0.045) * gauss(aa, 0.36, 0.16);
      const chin = 0.044 * gauss(t, 0.10, 0.07) * gauss(aa, 0.0, 0.22);
      return 1 + jaw + brow + eyeSocket + chin;
    },
  };

  const parts = [
    // ========================================================================
    // 1. MARVEL COMICS GOLD FACEPLATE & HOLLOW CRIMSON CYBERNETIC HELMET
    // ========================================================================
    {
      id: 'mark85-helmet-hud',
      name: 'Marvel Comics Gold Faceplate, Crimson Clamshell Helmet & Cybernetic Transponder',
      category: 'Helmet & Cybernetics',
      isOuter: true,
      explodeOffset: [0.15, 0.96, 0],
      desc: 'Authentic Marvel Comics clamshell helmet (Model 4 / Extremis) sculpted as a true open-necked hollow shell (~10 mm wall thickness) with room for Tony Stark’s head inside: gleaming Comic Gold hinged faceplate, Crimson widow’s-peak brow crest, slanted rectangular comic eye slits, classic horizontal mouth slit, and phased-array ear transceivers.',
      funFact: 'In Marvel Comics schematics by Eliot R. Brown, Iron Man’s helmet houses cybernetic neuro-transponder pick-ups that read Tony’s brainwaves at the speed of thought, plus a collapsible 1-hour emergency oxygen supply!',
      build(g) {
        const b = new MeshBatch();

        // 1. Open-ended hollow segmented Crimson neck collar ring (y = 0.965 .. 1.055)
        const neckSpec = {
          origin: [0.004, 0.965, 0],
          axis: [0, 0.090, 0],
          up: [1, 0, 0],
          N: 40,
          steps: 8,
          wallRatio: 0.84,
          openStart: true,
          openEnd: true,
          stations: [
            { t: 0.0, r1: 0.094, r1n: 0.092, r2: 0.102, n: 2.3, c1: 0.004 },
            { t: 0.5, r1: 0.086, r1n: 0.086, r2: 0.090, n: 2.3, c1: 0.006 },
            { t: 1.0, r1: 0.090, r1n: 0.088, r2: 0.086, n: 2.4, c1: 0.008 },
          ],
        };
        addHollowTube(b, neckSpec, deepCrimson, innerLiner, rimGold);

        // 2. Hollow Crimson Cranial Helmet Shell: OPEN neck aperture (openStart: true), closed crown dome (openEnd: false)
        addHollowTube(
          b,
          { ...HELMET, N: 52, steps: 24, wallRatio: 0.86, openStart: true, openEnd: false },
          comicCrimson,
          innerLiner,
          rimGold,
        );

        // 3. Hinged Gleaming Marvel Comics Gold Faceplate (thick double-walled front clamshell!)
        const faceMask = (t, a) => {
          const aa = Math.abs(a);
          // Classic Marvel Comics Crimson Widow's-Peak dipping into center forehead
          const widowCut = 0.17 * smoothstep(0.66, 0.84, t) * gauss(aa, 0.0, 0.24);
          return aa < 0.44 * Math.PI - widowCut ? 1 : 0;
        };
        addThickClamshell(
          b,
          {
            ...HELMET,
            aFrom: -0.43 * Math.PI,
            aTo: 0.43 * Math.PI,
            tFrom: 0.05,
            tTo: 0.80,
            ns: 22,
            nt: 28,
            offset: 0.005,
            wallThick: 0.008,
            radial: (t, a) => HELMET.radial(t, a) * (faceMask(t, a) ? 1.0 : 0.955),
          },
          comicGold,
          innerLiner,
          rimGold,
        );

        // Crisp Marvel Comics Crimson Widow's-Peak Forehead V-Crest & Crown Ridge
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -0.14 * Math.PI,
            aTo: 0.14 * Math.PI,
            tFrom: 0.68,
            tTo: 0.97,
            ns: 12,
            nt: 14,
            offset: 0.0115,
          }),
          comicCrimson,
        );
        // Pointed V-tip of the Crimson Widow's Peak dipping down between the brows
        b.cone(0.026, 0.052, 4, comicCrimson, [0.149, 1.236, 0], [0, Math.PI / 4, Math.PI]);

        // Crimson Jaw/Cheek Side Framing Guards (classic Layton / Granov cheekbone sweep)
        for (const side of [-1, 1]) {
          b.add(
            axialPatch({
              ...HELMET,
              aFrom: side > 0 ? 0.36 * Math.PI : -0.64 * Math.PI,
              aTo: side > 0 ? 0.64 * Math.PI : -0.36 * Math.PI,
              tFrom: 0.04,
              tTo: 0.54,
              ns: 12,
              nt: 12,
              offset: 0.010,
            }),
            comicCrimson,
          );
          // Circular Marvel Comics Phased-Array Ear Transceiver Discs
          const ez = side * 0.106;
          b.cyl(0.032, 0.034, 0.014, 24, comicCrimson, [0.008, 1.192, ez], [Math.PI / 2, 0, 0]);
          b.torus(0.026, 0.004, comicGold, [0.008, 1.192, ez + side * 0.006], [0, Math.PI / 2, 0]);
          b.cyl(0.014, 0.014, 0.016, 18, gunmetal, [0.008, 1.192, ez + side * 0.002], [Math.PI / 2, 0, 0]);
        }

        // 4. Classic Marvel Comics Slanted Rectangular Eye Slits + Angry Brow Ridge
        for (const side of [-1, 1]) {
          b.rbox(0.018, 0.018, 0.054, 0.003, darkSlot, [0.146, 1.196, side * 0.042], [-side * 0.14, -side * 0.34, 0]);
          b.rbox(0.016, 0.011, 0.046, 0.002, hudEyeGlow, [0.149, 1.196, side * 0.042], [-side * 0.14, -side * 0.34, 0]);
          // Sculpted gold brow frown bevel above each eye slit
          b.rbox(0.018, 0.007, 0.056, 0.002, richGold, [0.150, 1.207, side * 0.041], [-side * 0.16, -side * 0.34, 0]);
        }

        // 5. Signature Marvel Comics Recessed Horizontal/Stepped Mouth Slit & Chiseled Chin Guard
        b.rbox(0.018, 0.009, 0.058, 0.002, darkSlot, [0.151, 1.106, 0]);
        for (const side of [-1, 1]) {
          b.rbox(0.016, 0.0075, 0.022, 0.002, darkSlot, [0.145, 1.102, side * 0.033], [side * 0.14, -side * 0.28, 0]);
        }
        b.rbox(0.018, 0.024, 0.052, 0.005, comicGold, [0.150, 1.076, 0], [0, 0, -0.08]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 2. MARVEL COMICS CRIMSON FRONT THORACIC CLAMSHELL & UNIBEAM PROJECTOR
    // ========================================================================
    {
      id: 'arc-reactor-chestplate',
      name: 'Marvel Comics Crimson Thoracic Clamshell & Multi-Spectrum Unibeam Chest Projector',
      category: 'Front Chest Clamshell',
      isOuter: true,
      explodeOffset: [1.18, 0.16, 0],
      desc: '100% Marvel Comics Crimson front thoracic clamshell sculpted as a true double-walled hollow half-shell (~14 mm wall thickness) with a dark quilted titanium inner liner and magnetic side-seam latches. Houses the iconic circular/pentagonal-bezel Unibeam Chest Projector flush in the sternum wall so Tony Stark’s chest fits comfortably inside.',
      funFact: 'In Marvel Comics, Iron Man’s chest Unibeam doesn’t just fire concussive blasts—it projects a high-intensity searchlight, ultraviolet/infrared scan beams, laser cutters, and electromagnetic tractor beams!',
      build(g) {
        const b = new MeshBatch();

        // 1. True Concave Front Half-Shell Clamshell (y = 0.50 .. 0.99, a ∈ [-0.50π, +0.50π])
        addThickClamshell(
          b,
          {
            ...TORSO,
            aFrom: -0.50 * Math.PI,
            aTo: 0.50 * Math.PI,
            tFrom: T_AT(0.50),
            tTo: T_AT(0.99),
            ns: 24,
            nt: 32,
            wallThick: 0.015,
          },
          comicCrimson,
          innerLiner,
          rimTitanium,
        );

        // 2. Sculpted Heroic Marvel Comics Pectoral Armor Plates & Collarbone Ring (100% Crimson + Gold Trim)
        for (const side of [-1, 1]) {
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.05 * Math.PI : -0.44 * Math.PI,
              aTo: side > 0 ? 0.44 * Math.PI : -0.05 * Math.PI,
              tFrom: T_AT(0.65),
              tTo: T_AT(0.89),
              ns: 12,
              nt: 16,
              offset: 0.010,
            }),
            comicCrimson,
          );
          // Lower pectoral comic bevel crease
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.08 * Math.PI : -0.42 * Math.PI,
              aTo: side > 0 ? 0.42 * Math.PI : -0.08 * Math.PI,
              tFrom: T_AT(0.61),
              tTo: T_AT(0.65),
              ns: 4,
              nt: 14,
              offset: 0.009,
            }),
            deepCrimson,
          );
          // Side-seam magnetic clamshell latch lugs (visible when exploded!)
          for (const yLatch of [0.58, 0.70, 0.82]) {
            const st = torsoSample(T_AT(yLatch));
            b.rbox(0.026, 0.022, 0.014, 0.003, rimGold, [st.c1, yLatch, side * (st.r2 + 0.004)]);
          }
        }

        // Crisp Gold Collarbone Rim Trim around the open neck aperture
        b.torus(0.104, 0.0065, comicGold, [0.006, 0.985, 0], [Math.PI / 2 + 0.14, 0, 0], [0.92, 1.04, 1]);

        // 3. Canonical Marvel Comics Circular Unibeam Chest Projector (with Adi Granov Gold Bezel Collar)
        const ux = 0.214;
        const uy = 0.758;
        const tiltZ = -0.10;
        // Outer sculpted gold Unibeam bezel ring + 5 radial comic accent lugs
        b.torus(0.064, 0.009, comicGold, [ux, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.torus(0.052, 0.006, silver, [ux + 0.005, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.cyl(0.050, 0.054, 0.016, 32, gunmetal, [ux - 0.002, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);
        // Glowing multi-spectrum Unibeam lens + concentric focussing rings
        b.cyl(0.044, 0.044, 0.010, 32, unibeamCyan, [ux + 0.004, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);
        b.cyl(0.026, 0.026, 0.012, 24, unibeamWhite, [ux + 0.006, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);
        b.torus(0.035, 0.0025, silver, [ux + 0.010, uy, 0], [0, Math.PI / 2, tiltZ]);
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * TAU - Math.PI / 2;
          b.rbox(
            0.010,
            0.014,
            0.008,
            0.002,
            comicGold,
            [ux + 0.006, uy + Math.cos(ang) * 0.058, Math.sin(ang) * 0.058],
            [ang, 0, 0],
          );
        }

        // Shallow inner concave sternum Unibeam backing cap (leaves 100% of ribcage cavity hollow!)
        b.cyl(0.056, 0.056, 0.012, 24, rimTitanium, [ux - 0.016, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 3. HOLLOW REAR DORSAL CLAMSHELL, POP-OUT AIRBRAKES & FLIGHT STABILIZERS
    // ========================================================================
    {
      id: 'dorsal-airbrake-array',
      name: 'Hollow Rear Dorsal Clamshell, Pop-Out Airbrake Flaps & Micro-Turbine Louvers',
      category: 'Rear Dorsal Clamshell',
      isOuter: true,
      explodeOffset: [-1.18, 0.20, 0],
      desc: 'Matching Marvel Comics Crimson rear thoracic clamshell (~14 mm thick hollow concave plate) that splits away from the front chestplate so Tony Stark can step inside. Houses twin hinged aerodynamic airbrake flaps, upper-back micro-turbine exhaust louvers, and a flush spinal ECM countermeasure pack.',
      funFact: 'When Iron Man decelerates from Mach 3+ supersonic flight, twin dorsal airbrake flaps pop open from his upper backplate while his palm repulsors fire forward as retro-thrusters!',
      build(g) {
        const b = new MeshBatch();

        // 1. True Concave Rear Half-Shell Clamshell (a ∈ [0.50π, 1.50π])
        addThickClamshell(
          b,
          {
            ...TORSO,
            aFrom: 0.50 * Math.PI,
            aTo: 1.50 * Math.PI,
            tFrom: T_AT(0.50),
            tTo: T_AT(0.99),
            ns: 24,
            nt: 32,
            wallThick: 0.015,
          },
          comicCrimson,
          innerLiner,
          rimTitanium,
        );

        // 2. Sculpted Scapular Armor Plates, Gold Dorsal Trim & Hinged Pop-Out Airbrake Flaps
        for (const side of [-1, 1]) {
          // Raised crimson scapular wing bevel
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.60 * Math.PI : 1.12 * Math.PI,
              aTo: side > 0 ? 0.88 * Math.PI : 1.40 * Math.PI,
              tFrom: T_AT(0.68),
              tTo: T_AT(0.92),
              ns: 12,
              nt: 14,
              offset: 0.010,
            }),
            deepCrimson,
          );

          // Deployed Marvel Comics Dorsal Aerodynamic Airbrake Flap + Gold Hydraulic Strut
          const bx = -0.156;
          const by = 0.785;
          const bz = side * 0.105;
          b.rbox(0.012, 0.165, 0.068, 0.004, comicCrimson, [bx - 0.022, by, bz], [side * 0.14, -side * 0.28, -0.22]);
          b.rbox(0.008, 0.145, 0.052, 0.003, comicGold, [bx - 0.015, by, bz + side * 0.003], [side * 0.14, -side * 0.28, -0.22]);
          b.cyl(0.005, 0.005, 0.048, 10, silver, [bx - 0.004, by - 0.02, bz], [0, 0, Math.PI / 2]);

          // Recessed dorsal micro-turbine exhaust louver port
          b.rbox(0.018, 0.044, 0.036, 0.004, gunmetal, [-0.148, 0.62, side * 0.088], [0, -side * 0.22, 0]);
          b.rbox(0.010, 0.028, 0.024, 0.002, unibeamCyan, [-0.155, 0.62, side * 0.088], [0, -side * 0.22, 0]);
        }

        // Flush Spinal Auxiliary Battery & Chaff Dispenser Ridge (exterior-mounted so inside stays hollow!)
        for (let i = 0; i < 4; i++) {
          const sy = 0.56 + i * 0.072;
          b.rbox(0.022, 0.054, 0.064, 0.006, deepCrimson, [-0.144, sy, 0]);
          b.rbox(0.012, 0.036, 0.042, 0.003, comicGold, [-0.152, sy, 0]);
        }

        b.flush(g);
      },
    },

    // ========================================================================
    // 4. FLARED CRIMSON COMIC SHOULDER PAULDRONS & MICRO-MUNITION PODS
    // ========================================================================
    {
      id: 'pauldron-missile-pods',
      name: 'Flared Crimson Comic Shoulder Pauldrons & Pop-Up Micro-Munition Pods',
      category: 'Shoulder Pauldrons',
      isOuter: true,
      explodeOffset: [-0.22, 0.68, 0],
      desc: 'Classic Bob Layton & Adi Granov flared rounded-bell Marvel Comics Crimson shoulder pauldrons edged in gleaming Comic Gold. Each pauldron is a true concave hollow dome cup (~12 mm thick) arching over the human deltoid joint, with a pop-up Stark micro-munition rack tucked into the upper ridge.',
      funFact: 'Unlike the gold shoulders used in later movie suits, classic and Extremis Marvel Comics Iron Man armors feature bold flared Crimson shoulder bells that create his unmistakable heroic comic silhouette!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const pauldronSpec = {
            origin: [S[0], S[1] - 0.085, S[2] - side * 0.025],
            axis: [0, 0.195, side * 0.028],
            up: [0, 0, side],
            stations: [
              { t: 0.00, r1: 0.118, r1n: 0.048, r2: 0.116, n: 2.3, c1: 0.018 }, // Flared comic lower bell skirt!
              { t: 0.35, r1: 0.112, r1n: 0.052, r2: 0.112, n: 2.4, c1: 0.016 },
              { t: 0.72, r1: 0.096, r1n: 0.056, r2: 0.098, n: 2.4, c1: 0.008 },
              { t: 1.00, r1: 0.058, r1n: 0.042, r2: 0.068, n: 2.2, c1: -0.006 },
            ],
          };

          // True Concave Hollow Cup Dome Clamshell!
          addThickClamshell(
            b,
            {
              ...pauldronSpec,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: 0.0,
              tTo: 1.0,
              ns: 16,
              nt: 22,
              wallThick: 0.012,
            },
            comicCrimson,
            innerLiner,
            rimGold,
          );

          // Gleaming Comic Gold Flared Lower Rim Trim Band
          b.add(
            axialPatch({
              ...pauldronSpec,
              aFrom: -0.56 * Math.PI,
              aTo: 0.56 * Math.PI,
              tFrom: 0.0,
              tTo: 0.13,
              ns: 4,
              nt: 20,
              offset: 0.0075,
            }),
            comicGold,
          );

          // Compact Pop-Up Stark Micro-Munition / Anti-Personnel Dart Pod on upper ridge
          const px = S[0] - 0.008;
          const py = S[1] + 0.092;
          const pz = S[2] + side * 0.028;
          b.rbox(0.068, 0.024, 0.052, 0.005, gunmetal, [px, py, pz], [side * 0.22, 0, -0.08]);
          b.rbox(0.070, 0.007, 0.054, 0.002, deepCrimson, [px - 0.004, py + 0.015, pz], [side * 0.22, 0, -0.08]);
          for (const dx of [-0.018, 0, 0.018]) {
            for (const dz of [-0.011, 0.011]) {
              b.cyl(0.0042, 0.0042, 0.014, 10, comicGold, [px + dx + 0.026, py + 0.002, pz + dz], [0, 0, Math.PI / 2]);
            }
          }
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 5. POLARIZED GOLD BICEPS & FLARED CRIMSON REPULSOR GAUNTLETS
    // ========================================================================
    {
      id: 'repulsor-gauntlets-arms',
      name: 'Polarized Gold Micro-Mesh Biceps, Flared Crimson Gauntlets & Palm Repulsors',
      category: 'Arms & Repulsors',
      isOuter: true,
      explodeOffset: [0.88, 0.08, 0],
      desc: 'Canonical Marvel Comics arm assembly built as open-ended hollow sleeves (~11 mm wall thickness) so human arms slide right through: 100% gleaming Comic Gold polarized micro-mesh upper-arm sleeves, Crimson forearm gauntlets with the iconic flared comic elbow V-cuff, wrist laser/force-field bezel, and glowing Palm Repulsor lenses.',
      funFact: 'In Marvel Comics, Iron Man’s golden arm and leg sleeves are woven from magnetically polarized micro-chainmail that stays flexible like cloth until energized into tank-proof armor in microseconds!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const E = ELBOW(side);
          const W = WRIST(side);

          // 1. Open-Ended Hollow 100% Comic Gold Bicep/Tricep Sleeve
          const upperDir = [E[0] - S[0], E[1] - S[1], E[2] - S[2]];
          const upperSpec = {
            origin: S,
            axis: upperDir,
            up: [1, 0, 0],
            N: 40,
            steps: 16,
            wallRatio: 0.84,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.068, r1n: 0.066, r2: 0.068, n: 2.3 },
              { t: 0.38, r1: 0.080, r1n: 0.074, r2: 0.076, n: 2.5, c1: 0.006 }, // Heroic bicep peak!
              { t: 0.75, r1: 0.072, r1n: 0.068, r2: 0.068, n: 2.4, c1: 0.003 },
              { t: 1.00, r1: 0.062, r1n: 0.060, r2: 0.062, n: 2.3 },
            ],
          };
          addHollowTube(b, upperSpec, comicGold, innerLiner, rimGold);

          // Subtle comic micro-mail articulation rings along bicep
          for (const tf of [0.26, 0.52, 0.78]) {
            b.add(
              axialPatch({
                ...upperSpec,
                aFrom: -Math.PI,
                aTo: Math.PI,
                tFrom: tf - 0.02,
                tTo: tf + 0.02,
                ns: 3,
                nt: 24,
                offset: 0.002,
              }),
              richGold,
            );
          }

          // Hollow Articulated Gold/Gunmetal Elbow Ring
          const elbowRot = eulerAlong(upperDir);
          b.torus(0.058, 0.009, gunmetal, E, [elbowRot[0] + Math.PI / 2, elbowRot[1], elbowRot[2]]);

          // 2. Open-Ended Hollow Crimson Forearm Gauntlet with Iconic Flared Marvel Comics Elbow Cuff!
          const foreStart = [
            E[0] - 0.015 * (W[0] - E[0]),
            E[1] + 0.028,
            E[2] - side * 0.004,
          ];
          const foreDir = [W[0] - foreStart[0], W[1] - foreStart[1], W[2] - foreStart[2]];
          const foreSpec = {
            origin: foreStart,
            axis: foreDir,
            up: [1, 0, 0],
            N: 42,
            steps: 20,
            wallRatio: 0.83,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.092, r1n: 0.090, r2: 0.094, n: 2.6, c1: -0.004 }, // Dramatic flared Marvel Comics gauntlet cuff!
              { t: 0.16, r1: 0.078, r1n: 0.076, r2: 0.080, n: 2.6 },
              { t: 0.36, r1: 0.072, r1n: 0.068, r2: 0.072, n: 2.7, c1: 0.003 },
              { t: 0.72, r1: 0.062, r1n: 0.058, r2: 0.062, n: 2.7 },
              { t: 1.00, r1: 0.056, r1n: 0.052, r2: 0.058, n: 2.8 },
            ],
            radial: (t, a) => {
              // Classic comic V-point flare at outer/dorsal elbow cuff
              const cuffPoint = 0.12 * (1 - smoothstep(0.0, 0.22, t)) * gauss(Math.abs(a), Math.PI * 0.65, 0.35);
              return 1 + cuffPoint;
            },
          };
          addHollowTube(b, foreSpec, comicCrimson, innerLiner, rimGold);

          // Gold Flared Gauntlet Cuff Lip + Wrist Micro-Laser Bezel
          b.add(
            axialPatch({
              ...foreSpec,
              aFrom: -Math.PI,
              aTo: Math.PI,
              tFrom: 0.0,
              tTo: 0.07,
              ns: 3,
              nt: 28,
              offset: 0.0035,
            }),
            comicGold,
          );
          b.add(
            axialPatch({
              ...foreSpec,
              aFrom: -Math.PI,
              aTo: Math.PI,
              tFrom: 0.90,
              tTo: 1.0,
              ns: 4,
              nt: 24,
              offset: 0.0035,
            }),
            comicGold,
          );

          // 3. Hollow Armored Crimson Glove Carapace + Concave Glowing Palm Repulsor Lens
          const fRot = eulerAlong(foreDir);
          const hx = W[0] + 0.022;
          const hy = W[1] - 0.048;
          const hz = W[2] + side * 0.008;
          // Open-wrist hollow crimson dorsal hand shell
          b.rbox(0.072, 0.082, 0.026, 0.008, comicCrimson, [hx + 0.006, hy, hz + side * 0.012], fRot);
          b.rbox(0.060, 0.074, 0.016, 0.005, innerLiner, [hx + 0.002, hy, hz - side * 0.002], fRot);

          // Concave Palm Repulsor Ray Projector Lens (facing inward/forward on palm)
          const px = hx + 0.004;
          const py = hy - 0.004;
          const pz = hz - side * 0.012;
          b.torus(0.022, 0.0045, silver, [px, py, pz], [0, Math.PI / 2, 0]);
          b.cyl(0.019, 0.019, 0.006, 22, unibeamCyan, [px, py, pz], [Math.PI / 2, 0, 0]);
          b.cyl(0.011, 0.011, 0.008, 18, unibeamWhite, [px, py, pz - side * 0.002], [Math.PI / 2, 0, 0]);

          // 4 Articulated Crimson Fingers + Thumb
          for (let fi = 0; fi < 4; fi++) {
            const fxOff = (fi - 1.5) * 0.015;
            b.rbox(0.013, 0.036, 0.015, 0.004, comicCrimson, [hx + fxOff, hy - 0.056, hz + side * 0.008], [side * 0.20, 0, 0]);
            b.rbox(0.011, 0.026, 0.013, 0.003, deepCrimson, [hx + fxOff, hy - 0.082, hz - side * 0.002], [side * 0.42, 0, 0]);
          }
          b.rbox(0.015, 0.038, 0.016, 0.004, comicCrimson, [hx + 0.038, hy - 0.024, hz - side * 0.008], [side * 0.25, 0, -0.42]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 6. CRIMSON RIBBED ABDOMINAL GIRDLE & CLASSIC COMIC V-BELT TRUNK SHELL
    // ========================================================================
    {
      id: 'abdominal-pelvis-armor',
      name: 'Hollow Crimson Ribbed Abdominal Girdle & Classic Marvel Comics V-Belt Trunks',
      category: 'Abdomen & Trunk Girdle',
      isOuter: true,
      explodeOffset: [0.78, -0.32, 0],
      desc: 'True open-top, open-bottom hollow double-walled Crimson waist & pelvic girdle (~13 mm wall thickness, zero solid plugs): articulated 4-lame Marvel Comics Crimson abdominal rib bands above the classic pointed V-belt and Crimson superhero trunk armor.',
      funFact: 'Classic Marvel Comics Iron Man suits use overlapping Crimson abdominal lames and a V-shaped pelvic girdle so Tony Stark can twist and crouch freely without exposing a single millimeter of unarmored gap!',
      build(g) {
        const b = new MeshBatch();

        // 1. Open-Ended Double-Walled Hollow Crimson Abdominal & Trunk Girdle (y = 0.07 .. 0.52)
        addHollowTube(
          b,
          {
            ...TORSO,
            tFrom: T_AT(0.08),
            tTo: T_AT(0.52),
            N: 52,
            steps: 22,
            wallRatio: 0.86,
            openStart: true,
            openEnd: true,
          },
          comicCrimson,
          innerLiner,
          rimTitanium,
        );

        // 2. Sculpted 4-Tier Marvel Comics Articulated Crimson Abdominal Rib Lames
        for (let i = 0; i < 4; i++) {
          const yLo = 0.30 + i * 0.052;
          const yHi = yLo + 0.040;
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: -0.46 * Math.PI,
              aTo: 0.46 * Math.PI,
              tFrom: T_AT(yLo),
              tTo: T_AT(yHi),
              ns: 5,
              nt: 24,
              offset: 0.006,
              radial: (t, a) => torsoRadial(t, a) + 0.022 * gauss(Math.abs(a), 0.0, 0.22),
            }),
            i % 2 === 0 ? comicCrimson : deepCrimson,
          );
        }

        // 3. Classic Marvel Comics Pointed V-Belt & Sculpted Pelvic Trunk Arch (hollow saddle!)
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: -Math.PI,
            aTo: Math.PI,
            tFrom: T_AT(0.24),
            tTo: T_AT(0.295),
            ns: 6,
            nt: 36,
            offset: 0.0085,
            radial: (t, a) => torsoRadial(t, a) + 0.026 * gauss(Math.abs(a), 0.0, 0.18),
          }),
          comicGold,
        );
        // Crimson center V-buckle medallion + hollow lower pelvic codpiece arch
        b.rbox(0.020, 0.058, 0.072, 0.006, comicCrimson, [0.144, 0.255, 0], [0, 0, -0.06]);
        b.rbox(0.195, 0.046, 0.086, 0.016, comicCrimson, [0.006, 0.062, 0]);
        b.rbox(0.175, 0.022, 0.072, 0.006, innerLiner, [0.006, 0.082, 0]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 7. TWIN MARVEL COMICS CIRCULAR HIP POWER PODS & COUNTERMEASURE DISCS
    // ========================================================================
    {
      id: 'comic-hip-power-pods',
      name: 'Twin Circular Marvel Comics Hip Power Pods, Solar Converters & Flare Discs',
      category: 'Waist Power & Countermeasures',
      isOuter: false,
      explodeOffset: [-0.88, -0.14, 0],
      desc: 'Iron Man’s #1 unmistakable Marvel Comics waist detail from Tales of Suspense through Extremis: twin circular Crimson-and-Gold Hip Power Pods mounted outside the pelvic shell, housing auxiliary solar/thermocouple battery coils, magnetic grapple reels, and rotary IR flare/EMP countermeasure ports.',
      funFact: 'In Eliot R. Brown’s Official Handbook of the Marvel Universe schematics, Iron Man’s circular hip pods double as high-density auxiliary battery packs and emergency solar-energy converters!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const px = 0.012;
          const py = 0.238;
          const pz = side * 0.198;
          const rotZ = -side * 0.08;

          // Outer Crimson armored circular pod housing
          b.cyl(0.068, 0.072, 0.036, 32, comicCrimson, [px, py, pz], [Math.PI / 2 + rotZ, 0, 0]);
          b.torus(0.066, 0.0065, comicGold, [px, py, pz + side * 0.016], [0, Math.PI / 2, 0]);

          // Domed Gleaming Comic Gold Solar/Thermocouple Converter Cap on exterior face
          b.cyl(0.048, 0.056, 0.014, 28, comicGold, [px, py, pz + side * 0.020], [Math.PI / 2 + rotZ, 0, 0]);
          b.torus(0.032, 0.004, richGold, [px, py, pz + side * 0.026], [0, Math.PI / 2, 0]);
          b.cyl(0.016, 0.016, 0.016, 20, repulsorGold, [px, py, pz + side * 0.022], [Math.PI / 2 + rotZ, 0, 0]);

          // 6 Peripheral Rotary Flare / Chaff Countermeasure Micro-Tubes
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * TAU;
            b.cyl(
              0.0055,
              0.0055,
              0.012,
              10,
              gunmetal,
              [px + Math.cos(ang) * 0.056, py + Math.sin(ang) * 0.056, pz + side * 0.018],
              [Math.PI / 2, 0, 0],
            );
          }

          // Inner-side exposed toroidal capacitor ring & magnetic latch mount (sits outside hip wall!)
          b.torus(0.046, 0.008, rimTitanium, [px, py, pz - side * 0.016], [0, Math.PI / 2, 0]);
          b.torus(0.032, 0.005, bioScanCyan, [px, py, pz - side * 0.017], [0, Math.PI / 2, 0]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 8. POLARIZED GOLD QUADRICEPS THIGH SLEEVES & ARTICULATED KNEE COPS
    // ========================================================================
    {
      id: 'thigh-exo-thrusters',
      name: 'Hollow Polarized Gold Thigh Armor Sleeves & Articulated Comic Knee Cops',
      category: 'Upper Leg Armor',
      isOuter: true,
      explodeOffset: [-0.62, -0.42, 0],
      desc: '100% gleaming Marvel Comics Gold quadriceps & hamstring thigh sleeves engineered as wide-open double-walled hollow cylinders (~13 mm wall thickness, zero solid plugs) with dark padded titanium interiors so a human pilot’s legs fit comfortably inside.',
      funFact: 'Linear magnetic-field amplifiers woven into the walls of Iron Man’s golden thigh sleeves multiply Tony Stark’s leg strength enough to leap stories high or brace against 80-ton impacts!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const H = HIP(side);
          const K = KNEE(side);
          const thighDir = [K[0] - H[0], K[1] - H[1], K[2] - H[2]];
          const thighSpec = {
            origin: H,
            axis: thighDir,
            up: [1, 0, 0],
            N: 44,
            steps: 20,
            wallRatio: 0.85,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.104, r1n: 0.102, r2: 0.100, n: 2.4, c1: 0.004 }, // Wide open hip cuff!
              { t: 0.28, r1: 0.118, r1n: 0.110, r2: 0.112, n: 2.5, c1: 0.010 }, // Athletic comic quad sweep!
              { t: 0.62, r1: 0.106, r1n: 0.098, r2: 0.098, n: 2.5, c1: 0.006 },
              { t: 1.00, r1: 0.084, r1n: 0.080, r2: 0.082, n: 2.4 }, // Open knee cuff!
            ],
            radial: (t, a) => {
              const quad = 0.048 * gauss(t, 0.38, 0.22) * gauss(Math.abs(a), 0.18, 0.32);
              return 1 + quad;
            },
          };

          // 100% Gleaming Marvel Comics Gold Double-Walled Hollow Thigh Cylinder!
          addHollowTube(b, thighSpec, comicGold, innerLiner, rimGold);

          // Sculpted Gold Quadriceps Ridge & Micro-Mesh Seam Flutes
          b.add(
            axialPatch({
              ...thighSpec,
              aFrom: -0.34 * Math.PI,
              aTo: 0.34 * Math.PI,
              tFrom: 0.14,
              tTo: 0.84,
              ns: 12,
              nt: 16,
              offset: 0.004,
            }),
            comicGold,
          );
          for (const tf of [0.30, 0.56, 0.80]) {
            b.add(
              axialPatch({
                ...thighSpec,
                aFrom: -Math.PI,
                aTo: Math.PI,
                tFrom: tf - 0.015,
                tTo: tf + 0.015,
                ns: 3,
                nt: 26,
                offset: 0.0025,
              }),
              richGold,
            );
          }

          // Hollow Articulated Patella Knee Cop (front shield only — rear stays open for knee bend!)
          b.rbox(0.026, 0.082, 0.084, 0.010, comicGold, [K[0] + 0.082, K[1] + 0.008, K[2]]);
          b.rbox(0.016, 0.068, 0.072, 0.006, innerLiner, [K[0] + 0.068, K[1] + 0.008, K[2]]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 9. FLARED CRIMSON CUFFED JET BOOTS, CALF RAM-INTAKES & SOLE TURBINES
    // ========================================================================
    {
      id: 'calf-boot-jet-thrusters',
      name: 'Hollow Flared Crimson Cuffed Jet Boots, Calf Air-Intakes & Sole Turbines',
      category: 'Jet Boots & Propulsion',
      isOuter: true,
      explodeOffset: [0.32, -0.92, 0],
      desc: 'Iconic Marvel Comics Crimson cuffed jet boots featuring the sweeping V-flared comic knee collar, Eliot R. Brown calf ram-air compressor louvers, a true open-top hollow shin & foot interior, and dual-mode air-breathing/plasma jet thrusters built into the heavy insulated soles.',
      funFact: 'According to Marvel’s Official Handbook schematics, Iron Man’s calves scoop in outside air through louvered intakes, compress it with miniature electric turbines, and blast superheated exhaust out of his boot soles!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const K = KNEE(side);
          const A = ANKLE(side);
          const shinStart = [K[0] - 0.004, K[1] + 0.028, K[2]];
          const shinDir = [A[0] - shinStart[0], A[1] - shinStart[1], A[2] - shinStart[2]];

          // 1. Open-Top Hollow Crimson Shin Greave with Sweeping Flared Marvel Comics Boot Collar!
          const shinSpec = {
            origin: shinStart,
            axis: shinDir,
            up: [1, 0, 0],
            N: 44,
            steps: 22,
            wallRatio: 0.84,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.106, r1n: 0.098, r2: 0.104, n: 2.6, c1: 0.008 }, // Sweeping flared comic boot-cuff collar!
              { t: 0.16, r1: 0.088, r1n: 0.088, r2: 0.088, n: 2.5 },
              { t: 0.36, r1: 0.088, r1n: 0.104, r2: 0.094, n: 2.5, c1: -0.008 }, // Heroic gastrocnemius calf flare!
              { t: 0.72, r1: 0.074, r1n: 0.076, r2: 0.074, n: 2.6 },
              { t: 1.00, r1: 0.070, r1n: 0.072, r2: 0.070, n: 2.7 },
            ],
            radial: (t, a) => {
              // Dramatic comic V-point crest at front of flared boot cuff!
              const frontCrest = 0.16 * (1 - smoothstep(0.0, 0.22, t)) * gauss(Math.abs(a), 0.0, 0.34);
              const shinRidge = 0.042 * smoothstep(0.15, 0.35, t) * gauss(Math.abs(a), 0.0, 0.16);
              return 1 + frontCrest + shinRidge;
            },
          };
          addHollowTube(b, shinSpec, comicCrimson, innerLiner, rimGold);

          // Gleaming Comic Gold Flared Boot-Cuff Rim Trim!
          b.add(
            axialPatch({
              ...shinSpec,
              aFrom: -Math.PI,
              aTo: Math.PI,
              tFrom: 0.0,
              tTo: 0.065,
              ns: 4,
              nt: 30,
              offset: 0.004,
            }),
            comicGold,
          );

          // Eliot R. Brown OHOTMU Calf Ram-Air Compressor Intake Louvers (outer & rear calf!)
          const cx = (K[0] + A[0]) * 0.5 - 0.068;
          const cy = (K[1] + A[1]) * 0.5 + 0.055;
          const cz = (K[2] + A[2]) * 0.5 + side * 0.052;
          b.rbox(0.046, 0.098, 0.028, 0.005, gunmetal, [cx, cy, cz], [0, side * 0.45, 0.08]);
          for (let li = -2; li <= 2; li++) {
            b.rbox(0.036, 0.006, 0.030, 0.001, silver, [cx - 0.004, cy + li * 0.016, cz + side * 0.004], [0, side * 0.45, 0.25]);
          }

          // 2. Hollow Armored Crimson Boot Foot Carapace (open ankle entrance + arched hollow foot dome!)
          const bootSpec = {
            origin: [A[0] - 0.075, -0.945, A[2]],
            axis: [0.275, -0.010, -side * 0.022],
            up: [0, 1, 0],
            stations: [
              { t: 0.00, r1: 0.072, r1n: 0.042, r2: 0.068, n: 2.6, c1: 0.018 }, // Heel counter
              { t: 0.35, r1: 0.082, r1n: 0.042, r2: 0.074, n: 2.7, c1: 0.016 }, // Instep arch (hollow inside!)
              { t: 0.72, r1: 0.058, r1n: 0.040, r2: 0.072, n: 2.8, c1: -0.002 }, // Forefoot
              { t: 1.00, r1: 0.032, r1n: 0.032, r2: 0.052, n: 2.9, c1: -0.014 }, // Armored toe cap
            ],
          };
          // Upper boot dome clamshell (leaves hollow space for the human foot!)
          addThickClamshell(
            b,
            {
              ...bootSpec,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: 0.0,
              tTo: 1.0,
              ns: 14,
              nt: 20,
              wallThick: 0.011,
            },
            comicCrimson,
            innerLiner,
            rimTitanium,
          );

          // 3. Heavy Insulated Gunmetal Thrust Sole + Dual Sole Jet Nozzles (Heel Main + Toe Attitude)
          const soleX = A[0] + 0.058;
          const soleZ = A[2] - side * 0.008;
          b.rbox(0.285, 0.022, 0.142, 0.006, gunmetal, [soleX, -0.988, soleZ], [0, side * 0.08, 0]);
          b.rbox(0.265, 0.008, 0.124, 0.003, innerLiner, [soleX, -0.974, soleZ], [0, side * 0.08, 0]);

          // Main Heel Jet Turbine Ring + Forefoot Stabilizer Nozzle
          for (const [nxOff, nr] of [[-0.048, 0.044], [0.062, 0.032]]) {
            const nx = soleX + nxOff;
            b.torus(nr, 0.007, silver, [nx, -0.996, soleZ], [Math.PI / 2, 0, 0]);
            b.cyl(nr * 0.86, nr * 0.86, 0.006, 24, unibeamCyan, [nx, -0.998, soleZ]);
            b.cyl(nr * 0.48, nr * 0.48, 0.008, 18, unibeamWhite, [nx, -0.999, soleZ]);
          }
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 10. HOLLOW PILOT CAVITY, THERMOCOUPLE UNDERSUIT & WALL-MOUNTED AVIONICS
    // ========================================================================
    {
      id: 'internal-nanotech-endoskeleton',
      name: 'Hollow Human Pilot Cavity, Thermocouple Undersuit Sheath & Cybernetic Avionics',
      category: 'Wearable Pilot Interior',
      isOuter: false,
      explodeOffset: [0, 0, 0],
      desc: 'Wearable interior of the Marvel Comics Iron Man suit—proving there is hollow room for a real person inside! Features the open-necked dark navy ballistic/thermocouple undersuit sheath with cutaway rib windows, translucent human pilot ergonomic clearance volume, helmet neuro-transponder headband, flush sternum RT Unibeam generator, and footbed turbine impellers.',
      funFact: 'Before clamping his red-and-gold plates shut, comic-book Tony Stark wears a padded ballistic-and-thermocouple inner bodysuit (upgraded in Extremis into a gold-piped bio-sheath) that insulates him from -200°F stratospheric cold and 2,000°F re-entry heat!',
      build(g) {
        const b = new MeshBatch();

        // 1. Cutaway Hollow Navy-and-Gold Extremis / Ballistic Undersuit Sheath
        //    Built as thin open-ended cutaway panels (~5 mm wall) around the perimeter so the
        //    hollow interior cavity is 100% unobstructed and visible!
        for (const side of [-1, 1]) {
          // Lateral rib/waist undersuit liner panels (leaving a wide-open front & back cutaway window!)
          addThickClamshell(
            b,
            {
              ...TORSO,
              aFrom: side > 0 ? 0.28 * Math.PI : -0.72 * Math.PI,
              aTo: side > 0 ? 0.72 * Math.PI : -0.28 * Math.PI,
              tFrom: T_AT(0.16),
              tTo: T_AT(0.92),
              ns: 16,
              nt: 12,
              offset: -0.016,
              wallThick: 0.005,
            },
            undersuitNavy,
            innerLiner,
            rimGold,
          );

          // Gold Extremis bio-telemetry & liquid-cooling capillary ribs hugging the INNER WALL perimeter
          for (const yRib of [0.34, 0.48, 0.62, 0.76, 0.88]) {
            b.add(
              axialPatch({
                ...TORSO,
                aFrom: side > 0 ? 0.24 * Math.PI : -0.76 * Math.PI,
                aTo: side > 0 ? 0.76 * Math.PI : -0.24 * Math.PI,
                tFrom: T_AT(yRib - 0.008),
                tTo: T_AT(yRib + 0.008),
                ns: 2,
                nt: 12,
                offset: -0.012,
              }),
              comicGold,
            );
          }
        }

        // Open-necked undersuit collar gasket (hollow tunnel for human neck!)
        b.torus(0.082, 0.007, comicGold, [0.005, 0.965, 0], [Math.PI / 2, 0, 0], [0.92, 1.0, 1]);

        // 2. Translucent Holographic Human Pilot Ergonomic Clearance Silhouette (Tony Stark Fit Volume!)
        //    Sized cleanly INSIDE the hollow armor walls (~22–30 mm clearance all around) so X-Ray &
        //    Explode modes unmistakably demonstrate room for a human person inside!
        const addHoloLimb = (p0, p1, rStart, rMid, rEnd) => {
          b.add(
            axialLoft({
              origin: p0,
              axis: [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]],
              up: [1, 0, 0],
              N: 24,
              steps: 10,
              capStart: true,
              capEnd: true,
              stations: [
                { t: 0.0, r1: rStart, r2: rStart, n: 2.1 },
                { t: 0.5, r1: rMid, r2: rMid, n: 2.1 },
                { t: 1.0, r1: rEnd, r2: rEnd, n: 2.1 },
              ],
            }),
            pilotHolo,
          );
        };

        // Human pilot head + neck silhouette inside the hollow helmet
        b.add(
          axialLoft({
            origin: [0.010, 1.02, 0],
            axis: [0, 0.265, 0],
            up: [1, 0, 0],
            N: 28,
            steps: 12,
            capStart: true,
            capEnd: true,
            stations: [
              { t: 0.00, r1: 0.056, r1n: 0.054, r2: 0.054, n: 2.0 },
              { t: 0.25, r1: 0.082, r1n: 0.074, r2: 0.068, n: 2.2, c1: 0.010 },
              { t: 0.65, r1: 0.088, r1n: 0.086, r2: 0.074, n: 2.1, c1: 0.006 },
              { t: 1.00, r1: 0.012, r1n: 0.012, r2: 0.012, n: 2.0 },
            ],
          }),
          pilotHolo,
        );

        // Human pilot torso silhouette inside the hollow chest & waist cavity
        b.add(
          axialLoft({
            ...TORSO,
            tFrom: T_AT(0.12),
            tTo: T_AT(0.95),
            N: 32,
            steps: 16,
            scaleMul: 0.72,
            capStart: true,
            capEnd: true,
          }),
          pilotHolo,
        );

        // Biometric HUD Scan Rings around the human pilot silhouette
        for (const [sy, sr] of [[1.19, 0.082], [0.755, 0.165], [0.40, 0.122]]) {
          b.torus(sr, 0.0028, bioScanCyan, [0.012, sy, 0], [Math.PI / 2, 0, 0], [0.82, 1.0, 1]);
        }

        for (const side of [-1, 1]) {
          addHoloLimb(SHOULDER(side), ELBOW(side), 0.046, 0.050, 0.040);
          addHoloLimb(ELBOW(side), WRIST(side), 0.040, 0.042, 0.032);
          addHoloLimb(HIP(side), KNEE(side), 0.068, 0.072, 0.054);
          addHoloLimb(KNEE(side), ANKLE(side), 0.052, 0.056, 0.042);
          // Human foot silhouette inside the hollow boot dome
          b.rbox(0.185, 0.044, 0.074, 0.018, pilotHolo, [ANKLE(side)[0] + 0.048, -0.925, ANKLE(side)[2] - side * 0.006]);
        }

        // 3. Wall-Mounted Marvel Comics Internal Avionics (wrapping AROUND the pilot, never blocking center!)
        // 3a. Helmet Inner Cybernetic Neuro-Transponder Rim, Curved HUD Visor & Collapsible Oxygen Breather
        b.torus(0.088, 0.0045, comicGold, [0.010, 1.215, 0], [Math.PI / 2 - 0.08, 0, 0], [1.06, 0.90, 1]);
        for (const side of [-1, 1]) {
          // Temple neuro-transponder pick-up nodes
          b.cyl(0.014, 0.014, 0.008, 16, bioScanCyan, [0.020, 1.210, side * 0.082], [Math.PI / 2, 0, 0]);
        }
        // Curved inner HUD holographic visor strip behind eyes + chin emergency oxygen breather
        b.torus(0.095, 0.005, bioScanCyan, [0.032, 1.196, 0], [Math.PI / 2, 0, -Math.PI * 0.25], [1, 0.85, 1]);
        b.rbox(0.022, 0.020, 0.052, 0.005, gunmetal, [0.108, 1.100, 0]);

        // 3b. Flush Sternum-Wall Repulsor Tech (RT) Unibeam Thermoelectric Core (visible in X-Ray & Explode!)
        const rtx = 0.178;
        const rty = 0.758;
        b.torus(0.048, 0.007, comicGold, [rtx, rty, 0], [0, Math.PI / 2, -0.10]);
        b.cyl(0.040, 0.040, 0.012, 28, unibeamCyan, [rtx + 0.004, rty, 0], [0, 0, Math.PI / 2 - 0.10]);
        b.cyl(0.022, 0.022, 0.016, 20, unibeamWhite, [rtx + 0.006, rty, 0], [0, 0, Math.PI / 2 - 0.10]);

        // Perimeter flexible power bus ribbons hugging inner rib/hip sheath (tucked cleanly inside outer armor!)
        for (const side of [-1, 1]) {
          b.tube(
            [
              [0.162, 0.758, side * 0.042],
              [0.105, 0.832, side * 0.162],
              [0.015, 0.860, side * 0.220],
            ],
            0.005,
            bioScanCyan,
            18,
          );
          b.tube(
            [
              [0.156, 0.735, side * 0.045],
              [0.082, 0.535, side * 0.128],
              [0.022, 0.245, side * 0.132],
            ],
            0.005,
            bioScanCyan,
            18,
          );
          // Boot-sole internal micro-turbine compressor impellers seated BELOW the pilot's feet
          const sx = ANKLE(side)[0] + 0.010;
          const sz = ANKLE(side)[2] - side * 0.008;
          b.torus(0.036, 0.006, comicGold, [sx, -0.964, sz], [Math.PI / 2, 0, 0]);
          b.cyl(0.028, 0.028, 0.010, 20, bioScanCyan, [sx, -0.966, sz]);
        }

        b.flush(g);
      },
    },
  ];

  return {
    id: 'iron-man-mark-85',
    name: 'Marvel Comics Iron Man Powered Armor',
    brand: 'Stark Industries (Marvel Comics)',
    badge: 'Mach 3+ • Unibeam RT • Hollow Wearable Clamshell',
    desc: 'Canonical Marvel Comics Iron Man Powered Exoskeleton inspired by Eliot R. Brown’s Official Handbook schematics, Bob Layton’s Classic Model 4, and Adi Granov’s Extremis armor: gleaming Comic Gold faceplate with rectangular eye & mouth slits, flared Crimson shoulder pauldrons, circular Chest Unibeam, twin circular Hip Power Pods, 100% Gold bicep & thigh sleeves, flared-cuff Crimson gauntlets & jet boots, and a genuinely hollow double-walled interior built for a human pilot inside.',
    cameraPos: [3.15, 1.12, 3.05],
    cameraTarget: [0, 0.16, 0],
    parts,
    quiz: [
      {
        q: 'Which multi-spectrum chest projector in Iron Man’s Crimson front clamshell fires searchlights, tractor beams, lasers, and concussive blasts?',
        correctId: 'arc-reactor-chestplate',
        distractors: ['mark85-helmet-hud', 'pauldron-missile-pods', 'thigh-exo-thrusters'],
      },
      {
        q: 'Which twin circular Marvel Comics waist discs store auxiliary solar-thermocouple battery power and dispense defensive flares?',
        correctId: 'comic-hip-power-pods',
        distractors: ['dorsal-airbrake-array', 'calf-boot-jet-thrusters', 'abdominal-pelvis-armor'],
      },
      {
        q: 'Which flared-cuff Crimson arm components house Iron Man’s palm-mounted magnetic flight stabilizers and concussive repulsor rays?',
        correctId: 'repulsor-gauntlets-arms',
        distractors: ['internal-nanotech-endoskeleton', 'mark85-helmet-hud', 'thigh-exo-thrusters'],
      },
      {
        q: 'Which open-necked hollow armor shell contains cybernetic neuro-transponder pick-ups that read Tony Stark’s brainwaves and an emergency 1-hour oxygen breather?',
        correctId: 'mark85-helmet-hud',
        distractors: ['pauldron-missile-pods', 'arc-reactor-chestplate', 'dorsal-airbrake-array'],
      },
      {
        q: 'Which flared-cuff Crimson lower-leg components scoop air through calf louvers to feed dual-mode jet turbines in the soles of Iron Man’s feet?',
        correctId: 'calf-boot-jet-thrusters',
        distractors: ['thigh-exo-thrusters', 'repulsor-gauntlets-arms', 'comic-hip-power-pods'],
      },
    ],
  };
}

export { buildIronManModel as buildIronManMark85Model };

