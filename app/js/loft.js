// Smooth Procedural Surface Toolkit for Inside Out Studio vehicle hulls.
// Used to sculpt continuous, realistic skins (helicopter fuselages, bullet-train noses & carbodies,
// wings, stabilators, rotor blades) instead of stacking boxes:
// - superellipse(): parametric cross-section (roof/belly squareness, independent top/bottom extents)
// - sampleClosed(): arc-length-uniform resampling so every ring has the same, symmetric topology
// - loftRings(): structured-grid BufferGeometry through rings with seam-safe smooth normals, UVs & caps
// - surfaceGrid(): any (s,t) -> xyz patch (hull-conforming windows, decals, stripes) with normal offset
// - wingLoft(): NACA 00xx airfoil loft with chord/sweep/droop/twist laws (blades, fins, stub wings)
// - cachedCanvasTexture(): memoised livery / panel-line canvas textures (survive model switches)
// - MeshBatch: merges many small primitives per material into one draw call
//
// Conventions: X = vehicle forward axis, Y = up, Z = starboard/right. Section functions return [z, y].
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

const TAU = Math.PI * 2;

// ============================================================================
// Cross-sections
// ============================================================================

/**
 * Superellipse cross-section. `a` runs 0..2PI starting at the roof centre and heading toward +Z first.
 * @param {object} spec
 * @param {number} spec.halfW  half width (Z extent)
 * @param {number} spec.top    distance from yc up to the roof
 * @param {number} spec.bot    distance from yc down to the belly
 * @param {number} [spec.yc=0] vertical centre
 * @param {number} [spec.zc=0] lateral centre
 * @param {number} [spec.nTop=2.5] roof squareness (2 = ellipse, 4+ = boxy)
 * @param {number} [spec.nBot=2.5] belly squareness
 * @returns {(a:number) => [number, number]} [z, y]
 */
export function superellipse(spec) {
  const { halfW, top, bot } = spec;
  const yc = spec.yc ?? 0;
  const zc = spec.zc ?? 0;
  const nTop = spec.nTop ?? 2.5;
  const nBot = spec.nBot ?? 2.5;
  return (a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const upper = c >= 0;
    const e = 2 / (upper ? nTop : nBot);
    const z = zc + halfW * Math.sign(s) * Math.abs(s) ** e;
    const y = yc + (upper ? top : bot) * Math.sign(c) * Math.abs(c) ** e;
    return [z, y];
  };
}

/** Right-side (+Z) hull half-width at height y for a superellipse spec (0 outside the section). */
export function superellipseZAt(spec, y) {
  const yc = spec.yc ?? 0;
  const upper = y >= yc;
  const n = upper ? (spec.nTop ?? 2.5) : (spec.nBot ?? 2.5);
  const ext = upper ? spec.top : spec.bot;
  const u = Math.min(1, Math.abs(y - yc) / Math.max(1e-9, ext));
  return (spec.zc ?? 0) + spec.halfW * Math.max(0, 1 - u ** n) ** (1 / n);
}

/** Roof (upper) height at lateral offset z for a superellipse spec. */
export function superellipseTopAt(spec, z) {
  const n = spec.nTop ?? 2.5;
  const u = Math.min(1, Math.abs(z - (spec.zc ?? 0)) / Math.max(1e-9, spec.halfW));
  return (spec.yc ?? 0) + spec.top * Math.max(0, 1 - u ** n) ** (1 / n);
}

/** Belly (lower) height at lateral offset z for a superellipse spec. */
export function superellipseBottomAt(spec, z) {
  const n = spec.nBot ?? 2.5;
  const u = Math.min(1, Math.abs(z - (spec.zc ?? 0)) / Math.max(1e-9, spec.halfW));
  return (spec.yc ?? 0) - spec.bot * Math.max(0, 1 - u ** n) ** (1 / n);
}

/**
 * Resample a closed parametric outline into N points evenly spaced by arc length.
 * Starts at fn(0) (roof centre) so rings of different shapes keep vertex correspondence & symmetry.
 * @param {(a:number) => [number, number]} fn
 * @param {number} N even point count
 * @returns {Array<[number, number]>}
 */
export function sampleClosed(fn, N, dense = 960) {
  const pts = new Array(dense + 1);
  for (let m = 0; m <= dense; m++) pts[m] = fn((m / dense) * TAU);
  const cum = new Float64Array(dense + 1);
  for (let m = 1; m <= dense; m++) {
    cum[m] = cum[m - 1] + Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]);
  }
  const L = cum[dense];
  const out = new Array(N);
  if (L < 1e-9) {
    for (let k = 0; k < N; k++) out[k] = [pts[0][0], pts[0][1]];
    return out;
  }
  let m = 1;
  for (let k = 0; k < N; k++) {
    const target = (k / N) * L;
    while (m < dense && cum[m] < target) m++;
    const seg = cum[m] - cum[m - 1] || 1;
    const t = Math.min(1, Math.max(0, (target - cum[m - 1]) / seg));
    out[k] = [pts[m - 1][0] + (pts[m][0] - pts[m - 1][0]) * t, pts[m - 1][1] + (pts[m][1] - pts[m - 1][1]) * t];
  }
  return out;
}

/** Lift a 2D [z, y] section into a 3D ring at station x (optionally per-point x via xOf(z, y)). */
export function ringAt(x, pts2d, xOf = null) {
  return pts2d.map(([z, y]) => [xOf ? xOf(z, y) : x, y, z]);
}

// ============================================================================
// Lofted surfaces
// ============================================================================

function ringCentroid(ring) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
    z += p[2];
  }
  const n = ring.length;
  return [x / n, y / n, z / n];
}

function dist3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Loft a smooth closed skin through rings of equal point count.
 * Normals come from central differences on the structured grid (seam column duplicated for UVs but
 * sharing the same normal, so there is no visible seam). Collapsed rings (pointed tips) get axial normals.
 * @param {Array<Array<[number,number,number]>>} rings
 * @param {object} [opts]
 * @param {boolean} [opts.capStart=false] flat cap on the first ring
 * @param {boolean} [opts.capEnd=false] flat cap on the last ring
 * @param {number[]} [opts.u] explicit per-ring U coordinates (default: normalised centroid path length)
 * @returns {THREE.BufferGeometry} geometry.userData.ringCount / pointCount are set
 */
export function loftRings(rings, opts = {}) {
  const R = rings.length;
  const N = rings[0].length;
  if (R < 2) throw new Error('loftRings needs at least 2 rings');
  for (const ring of rings) {
    if (ring.length !== N) throw new Error('loftRings: every ring must have the same point count');
  }
  const cols = N + 1;
  const cents = rings.map(ringCentroid);

  const uArr = new Float64Array(R);
  if (opts.u) {
    for (let i = 0; i < R; i++) uArr[i] = opts.u[i];
  } else {
    let acc = 0;
    for (let i = 1; i < R; i++) {
      acc += dist3(cents[i], cents[i - 1]);
      uArr[i] = acc;
    }
    const tot = acc || 1;
    for (let i = 0; i < R; i++) uArr[i] /= tot;
  }

  const P = (i, j) => rings[i][((j % N) + N) % N];
  const raw = new Float64Array(R * N * 3);
  const fallback = new Uint8Array(R * N);
  const ta = new THREE.Vector3();
  const tb = new THREE.Vector3();
  const n = new THREE.Vector3();
  let orient = 0;
  for (let i = 0; i < R; i++) {
    const iA = Math.min(R - 1, i + 1);
    const iB = Math.max(0, i - 1);
    for (let j = 0; j < N; j++) {
      const a = P(iA, j);
      const b = P(iB, j);
      ta.set(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const c = P(i, j + 1);
      const d = P(i, j - 1);
      tb.set(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
      n.crossVectors(tb, ta);
      const k = i * N + j;
      if (n.lengthSq() < 1e-16) {
        // Collapsed ring (nose tip / blade tip): point along the loft axis, away from the neighbour ring.
        const nb = i === 0 ? cents[Math.min(1, R - 1)] : cents[i - 1];
        const self = cents[i];
        n.set(self[0] - nb[0], self[1] - nb[1], self[2] - nb[2]);
        if (n.lengthSq() < 1e-16) n.set(1, 0, 0);
        fallback[k] = 1;
      } else {
        const p = P(i, j);
        const ce = cents[i];
        orient += n.x * (p[0] - ce[0]) + n.y * (p[1] - ce[1]) + n.z * (p[2] - ce[2]);
      }
      n.normalize();
      raw[k * 3] = n.x;
      raw[k * 3 + 1] = n.y;
      raw[k * 3 + 2] = n.z;
    }
  }
  const sign = orient >= 0 ? 1 : -1;

  const capVerts = (opts.capStart ? N + 1 : 0) + (opts.capEnd ? N + 1 : 0);
  const total = R * cols + capVerts;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);

  for (let i = 0; i < R; i++) {
    const ring = rings[i];
    const cum = [0];
    for (let j = 1; j <= N; j++) cum.push(cum[j - 1] + dist3(ring[j % N], ring[j - 1]));
    const per = cum[N];
    for (let j = 0; j <= N; j++) {
      const jj = j % N;
      const p = ring[jj];
      const v = i * cols + j;
      pos[v * 3] = p[0];
      pos[v * 3 + 1] = p[1];
      pos[v * 3 + 2] = p[2];
      const k = i * N + jj;
      const s = fallback[k] ? 1 : sign;
      nor[v * 3] = raw[k * 3] * s;
      nor[v * 3 + 1] = raw[k * 3 + 1] * s;
      nor[v * 3 + 2] = raw[k * 3 + 2] * s;
      uv[v * 2] = uArr[i];
      uv[v * 2 + 1] = per > 1e-9 ? cum[j] / per : j / N;
    }
  }

  const idx = [];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < N; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + j + 1;
      const d = i * cols + j + 1;
      // raw normal = ring x loft; triangle (a,b,d) faces -raw. Choose winding that faces outward.
      if (sign > 0) idx.push(a, d, b, b, d, c);
      else idx.push(a, b, d, b, c, d);
    }
  }

  let cursor = R * cols;
  const addCap = (ringIndex, neighbourIndex) => {
    const ring = rings[ringIndex];
    const ce = cents[ringIndex];
    const nb = cents[neighbourIndex];
    const axis = new THREE.Vector3(ce[0] - nb[0], ce[1] - nb[1], ce[2] - nb[2]).normalize();
    const centerIdx = cursor;
    pos.set(ce, centerIdx * 3);
    nor.set([axis.x, axis.y, axis.z], centerIdx * 3);
    uv.set([uArr[ringIndex], 0.5], centerIdx * 2);
    cursor++;
    const start = cursor;
    for (let j = 0; j < N; j++) {
      const p = ring[j];
      pos.set(p, cursor * 3);
      nor.set([axis.x, axis.y, axis.z], cursor * 3);
      uv.set([uArr[ringIndex], j / N], cursor * 2);
      cursor++;
    }
    // Decide winding from the first non-degenerate triangle.
    let flip = false;
    for (let j = 0; j < N; j++) {
      const p0 = ring[j];
      const p1 = ring[(j + 1) % N];
      const e1 = new THREE.Vector3(p0[0] - ce[0], p0[1] - ce[1], p0[2] - ce[2]);
      const e2 = new THREE.Vector3(p1[0] - ce[0], p1[1] - ce[1], p1[2] - ce[2]);
      const fn = new THREE.Vector3().crossVectors(e1, e2);
      if (fn.lengthSq() > 1e-16) {
        flip = fn.dot(axis) < 0;
        break;
      }
    }
    for (let j = 0; j < N; j++) {
      const a = start + j;
      const b = start + ((j + 1) % N);
      if (flip) idx.push(centerIdx, b, a);
      else idx.push(centerIdx, a, b);
    }
  };
  if (opts.capStart) addCap(0, 1);
  if (opts.capEnd) addCap(R - 1, R - 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  geo.userData.ringCount = R;
  geo.userData.pointCount = N;
  return geo;
}

/**
 * Convenience: loft a list of stations `{ x, section }` where `section` is a superellipse spec or
 * an outline function `(a) => [z, y]`. All rings share N points.
 */
export function loftStations(stations, N = 64, opts = {}) {
  const rings = stations.map((st) => {
    const fn = typeof st.section === 'function' ? st.section : superellipse(st.section);
    return ringAt(st.x, sampleClosed(fn, N), st.xOf || null);
  });
  return loftRings(rings, opts);
}

/**
 * Open parametric patch over s,t in [0,1] (windows, decal panels, stripes conforming to a hull).
 * @param {(s:number, t:number) => [number,number,number]} fn
 * @param {object} [opts]
 * @param {number} [opts.ns=12] segments along s
 * @param {number} [opts.nt=12] segments along t
 * @param {number} [opts.offset=0] push the patch out along its normals (avoids z-fighting with the hull)
 * @param {[number,number,number]|((p:number[])=>number[])} [opts.outward] outward hint used to orient normals
 * @returns {THREE.BufferGeometry}
 */
export function surfaceGrid(fn, opts = {}) {
  const ns = opts.ns ?? 12;
  const nt = opts.nt ?? 12;
  const rows = ns + 1;
  const cols = nt + 1;
  const P = new Array(rows * cols);
  for (let i = 0; i <= ns; i++) {
    for (let j = 0; j <= nt; j++) P[i * cols + j] = fn(i / ns, j / nt);
  }
  const pos = new Float32Array(rows * cols * 3);
  const nor = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const ta = new THREE.Vector3();
  const tb = new THREE.Vector3();
  const n = new THREE.Vector3();
  const normals = new Array(rows * cols);
  let orient = 0;
  const hint = (p) => {
    const o = opts.outward;
    if (!o) return null;
    return typeof o === 'function' ? o(p) : o;
  };
  for (let i = 0; i <= ns; i++) {
    for (let j = 0; j <= nt; j++) {
      const a = P[Math.min(ns, i + 1) * cols + j];
      const b = P[Math.max(0, i - 1) * cols + j];
      const c = P[i * cols + Math.min(nt, j + 1)];
      const d = P[i * cols + Math.max(0, j - 1)];
      ta.set(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      tb.set(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
      n.crossVectors(tb, ta);
      if (n.lengthSq() < 1e-18) n.set(0, 1, 0);
      n.normalize();
      const p = P[i * cols + j];
      const h = hint(p);
      if (h) orient += n.x * h[0] + n.y * h[1] + n.z * h[2];
      normals[i * cols + j] = [n.x, n.y, n.z];
    }
  }
  const sign = opts.outward ? (orient >= 0 ? 1 : -1) : 1;
  const off = opts.offset ?? 0;
  for (let k = 0; k < rows * cols; k++) {
    const p = P[k];
    const nn = normals[k];
    pos[k * 3] = p[0] + nn[0] * sign * off;
    pos[k * 3 + 1] = p[1] + nn[1] * sign * off;
    pos[k * 3 + 2] = p[2] + nn[2] * sign * off;
    nor[k * 3] = nn[0] * sign;
    nor[k * 3 + 1] = nn[1] * sign;
    nor[k * 3 + 2] = nn[2] * sign;
    const i = Math.floor(k / cols);
    const j = k % cols;
    uv[k * 2] = i / ns;
    uv[k * 2 + 1] = j / nt;
  }
  const idx = [];
  for (let i = 0; i < ns; i++) {
    for (let j = 0; j < nt; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + j + 1;
      const d = i * cols + j + 1;
      if (sign > 0) idx.push(a, d, b, b, d, c);
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
}

// ============================================================================
// Airfoils: wings, fins, stabilators, rotor blades
// ============================================================================

/** NACA 4-digit symmetric half-thickness (closed trailing edge) at chord fraction x for thickness ratio t. */
export function nacaHalfThickness(x, t) {
  const xc = Math.min(1, Math.max(0, x));
  return 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1036 * xc ** 4);
}

const asFn = (v, fallback) => (typeof v === 'function' ? v : () => (v ?? fallback));

/**
 * Loft a symmetric NACA airfoil along +Z (span). Chord runs along -X from the leading edge, thickness along Y.
 * Every law takes the span fraction sf in [0,1].
 * @param {object} o
 * @param {number} o.span
 * @param {number|((sf:number)=>number)} o.chord chord length
 * @param {number|((sf:number)=>number)} [o.le=0] X of the leading edge (negative = swept back)
 * @param {number|((sf:number)=>number)} [o.lift=0] Y offset (dihedral / droop)
 * @param {number|((sf:number)=>number)} [o.thick=0.12] thickness ratio
 * @param {number|((sf:number)=>number)} [o.twist=0] pitch (rad, + = leading edge up) about quarter chord
 * @param {number} [o.nSpan=10]
 * @param {number} [o.nChord=12]
 * @param {boolean} [o.capRoot=true]
 * @param {boolean} [o.capTip=true]
 */
export function wingLoft(o) {
  const span = o.span;
  const chord = asFn(o.chord, 1);
  const le = asFn(o.le, 0);
  const lift = asFn(o.lift, 0);
  const thick = asFn(o.thick, 0.12);
  const twist = asFn(o.twist, 0);
  const nSpan = o.nSpan ?? 10;
  const nChord = o.nChord ?? 12;
  const xs = [];
  for (let m = 0; m <= nChord; m++) xs.push(0.5 * (1 - Math.cos((m / nChord) * Math.PI)));
  const rings = [];
  for (let k = 0; k <= nSpan; k++) {
    const sf = k / nSpan;
    const z = sf * span;
    const c = Math.max(1e-5, chord(sf));
    const xLE = le(sf);
    const yOff = lift(sf);
    const th = thick(sf);
    const tw = twist(sf);
    const ct = Math.cos(tw);
    const st = Math.sin(tw);
    const qx = xLE - 0.25 * c;
    const pt = (xc, side) => {
      const px = xLE - xc * c;
      const py = side * nacaHalfThickness(xc, th) * c;
      const dx = px - qx;
      return [qx + dx * ct - py * st, dx * st + py * ct + yOff, z];
    };
    const ring = [];
    for (let m = nChord; m >= 0; m--) ring.push(pt(xs[m], 1)); // TE -> upper -> LE
    for (let m = 1; m < nChord; m++) ring.push(pt(xs[m], -1)); // lower LE -> TE
    rings.push(ring);
  }
  return loftRings(rings, { capStart: o.capRoot ?? true, capEnd: o.capTip ?? true });
}

// ============================================================================
// Textures
// ============================================================================

const canvasTexCache = new Map();

/**
 * Memoised canvas texture (kept across model switches; the viewer only disposes materials).
 * @param {string} key
 * @param {number} w
 * @param {number} h
 * @param {(ctx:CanvasRenderingContext2D, w:number, h:number) => void} draw
 * @param {object} [opts] { repeat:[u,v], linear:boolean, anisotropy:number }
 */
export function cachedCanvasTexture(key, w, h, draw, opts = {}) {
  if (canvasTexCache.has(key)) return canvasTexCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = opts.anisotropy ?? 8;
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  tex.needsUpdate = true;
  canvasTexCache.set(key, tex);
  return tex;
}

// ============================================================================
// Mesh helpers & batching
// ============================================================================

/** Add a mesh with shadows, mirroring materials.js#addMesh. */
export function addSmoothMesh(group, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

function normalizeForMerge(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.morphAttributes = {};
  g.clearGroups();
  return g;
}

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/**
 * Collects many static primitives and merges them into one mesh per material on flush().
 * Primitive signatures mirror materials.js (minus the leading group argument).
 */
export class MeshBatch {
  constructor() {
    this.buckets = new Map();
  }

  /** Add any geometry (ownership transfers to the batch). Returns the transformed clone. */
  add(geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
    const g = normalizeForMerge(geo);
    geo.dispose();
    _e.set(rot[0], rot[1], rot[2]);
    _q.setFromEuler(_e);
    _p.set(pos[0], pos[1], pos[2]);
    _s.set(scale[0], scale[1], scale[2]);
    _m4.compose(_p, _q, _s);
    g.applyMatrix4(_m4);
    if (!this.buckets.has(material)) this.buckets.set(material, []);
    this.buckets.get(material).push(g);
    return g;
  }

  box(w, h, d, material, pos, rot, scale) {
    return this.add(new THREE.BoxGeometry(w, h, d), material, pos, rot, scale);
  }

  rbox(w, h, d, radius, material, pos, rot, scale) {
    const r = Math.min(radius, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    return this.add(new RoundedBoxGeometry(w, h, d, 2, Math.max(1e-4, r)), material, pos, rot, scale);
  }

  cyl(rTop, rBot, h, segs, material, pos, rot, scale) {
    return this.add(new THREE.CylinderGeometry(rTop, rBot, h, segs), material, pos, rot, scale);
  }

  sphere(r, wSegs, hSegs, material, pos, rot, scale) {
    return this.add(new THREE.SphereGeometry(r, wSegs, hSegs), material, pos, rot, scale);
  }

  torus(r, tube, material, pos, rot, scale, radial = 10, tubular = 28) {
    return this.add(new THREE.TorusGeometry(r, tube, radial, tubular), material, pos, rot, scale);
  }

  cone(r, h, segs, material, pos, rot, scale) {
    return this.add(new THREE.ConeGeometry(r, h, segs), material, pos, rot, scale);
  }

  /** Lathe around local Y from [radius, y] points. */
  lathe(points, segs, material, pos, rot, scale) {
    const pts = points.map(([r, y]) => new THREE.Vector2(r, y));
    return this.add(new THREE.LatheGeometry(pts, segs), material, pos, rot, scale);
  }

  /** Tube along a Catmull-Rom path of [x,y,z] points. */
  tube(points, radius, material, segs = 24, radial = 8) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    return this.add(new THREE.TubeGeometry(curve, segs, radius, radial, false), material);
  }

  get size() {
    let n = 0;
    for (const list of this.buckets.values()) n += list.length;
    return n;
  }

  /** Merge every bucket into a single mesh per material and add them to `group`. */
  flush(group) {
    const meshes = [];
    for (const [material, list] of this.buckets.entries()) {
      if (list.length === 0) continue;
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (list.length > 1) for (const g of list) g.dispose();
      if (!merged) continue;
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      meshes.push(addSmoothMesh(group, merged, material));
    }
    this.buckets.clear();
    return meshes;
  }
}

/** Mirror helper: returns [x, y, -z] for symmetric placement. */
export const mirrorZ = (p) => [p[0], p[1], -p[2]];

/** Smoothstep 0..1. */
export function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Piecewise-linear interpolation through sorted [x, y] knots (clamped). */
export function piecewise(knots, x) {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    if (x <= knots[i][0]) {
      const [x0, y0] = knots[i - 1];
      const [x1, y1] = knots[i];
      const t = (x - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * t;
    }
  }
  return knots[knots.length - 1][1];
}

/** Monotone cubic (Fritsch-Carlson) interpolation through sorted [x, y] knots: smooth, no overshoot. */
export function smoothCurve(knots) {
  const n = knots.length;
  const xs = knots.map((k) => k[0]);
  const ys = knots.map((k) => k[1]);
  const d = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1);
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
