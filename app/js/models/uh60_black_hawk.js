// ============================================================================
// Sikorsky UH-60M Black Hawk — lofted hull, faceted windshield, procedural Army livery, explodable parts.
//
// Modelled in real metres inside a 0.25-scale frame (1 world unit = 4 m):
//   local x = -s (s = metres aft of the nose tip), y = h (metres above the ground), z = metres to starboard.
// Hull = superellipse stations lofted with loft.js and clipped by flat windshield planes (real faceted panes);
// window & door openings are alpha cut-outs in the hull livery so the interior (4-MFD flight deck, troop
// seats) shows through tinted glass. Small parts are merged per material with MeshBatch (low draw calls).
// Part ids deliberately avoid the FlightSim regex words (gear / tail / flap / slat / aileron / empennage).
// ============================================================================
import * as THREE from '../../vendor/three.module.js';
import {
  superellipse, superellipseTopAt, loftRings, surfaceGrid, wingLoft, cachedCanvasTexture, MeshBatch, smoothCurve,
  addSmoothMesh,
} from '../loft.js';

const UNIT = 0.25; // world units per metre
const S_ORIGIN = 6.9; // fuselage station (m aft of the nose) that lands on the world origin
const GROUND_Y = -0.67; // world y of the tyre contact patch (the stage floor settles at -0.675)
const HULL_LEN = 14.2; // hull loft: nose tip -> tail-cone end (the pylon carries on to 15.26 m)
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/** Local metre-frame point from fuselage station s (m aft of nose), height h (m) and lateral z (m, + = starboard). */
const P = (s, h, z = 0) => [-s, h, z];
const V = (s, h, z = 0) => new THREE.Vector3(-s, h, z);

function metreFrame(g) {
  const f = new THREE.Group();
  f.name = 'uh60-metre-frame';
  f.position.set(S_ORIGIN * UNIT, GROUND_Y, 0);
  f.scale.setScalar(UNIT);
  g.add(f);
  return f;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Geometry helpers
// ============================================================================
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);

/** Bake pos/rot (Euler XYZ) and an optional parent frame matrix into a geometry. */
function place(geo, pos = [0, 0, 0], rot = [0, 0, 0], frame = null, scale = null) {
  _e.set(rot[0], rot[1], rot[2]);
  _q.setFromEuler(_e);
  _v1.set(pos[0], pos[1], pos[2]);
  _m4.compose(_v1, _q, scale ? _v2.set(scale[0], scale[1], scale[2]) : _one);
  if (frame) _m4.premultiply(frame);
  geo.applyMatrix4(_m4);
  return geo;
}

/** Cylinder (or cone frustum) spanning point a -> b. */
function cylBetween(a, b, rA, rB, segs = 12, open = false) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const d = new THREE.Vector3().subVectors(B, A);
  const len = Math.max(1e-5, d.length());
  const geo = new THREE.CylinderGeometry(rB, rA, len, segs, 1, open);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, _one);
  geo.applyMatrix4(m);
  return geo;
}

/** Box spanning a -> b (length axis), with width w (horizontal-ish) and height h. */
function boxBetween(a, b, w, h, up = [0, 1, 0]) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = Math.max(1e-5, dir.length());
  dir.normalize();
  const upV = new THREE.Vector3(...up);
  const side = new THREE.Vector3().crossVectors(upV, dir).normalize();
  const realUp = new THREE.Vector3().crossVectors(dir, side).normalize();
  const basis = new THREE.Matrix4().makeBasis(side, realUp, dir);
  const geo = new THREE.BoxGeometry(w, h, len);
  basis.setPosition(A.clone().add(B).multiplyScalar(0.5));
  geo.applyMatrix4(basis);
  return geo;
}

/** Mirror a geometry across z = 0 keeping outward winding & normals. */
function mirrorGeoZ(geo) {
  const g = geo.clone();
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, -pos.getZ(i));
    if (nor) nor.setZ(i, -nor.getZ(i));
  }
  if (g.index) {
    const a = g.index.array;
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i + 1];
      a[i + 1] = a[i + 2];
      a[i + 2] = t;
    }
    g.index.needsUpdate = true;
  }
  pos.needsUpdate = true;
  if (nor) nor.needsUpdate = true;
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function quadBezier(a, c, b, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

function polyLen(poly) {
  let L = 0;
  for (let i = 1; i < poly.length; i++) L += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  return L;
}

function trimStart(poly, r) {
  let acc = 0;
  for (let i = 1; i < poly.length; i++) {
    const L = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    if (acc + L >= r) {
      const t = (r - acc) / (L || 1);
      const p = [lerp(poly[i - 1][0], poly[i][0], t), lerp(poly[i - 1][1], poly[i][1], t)];
      return [p, ...poly.slice(i)];
    }
    acc += L;
  }
  return [poly[poly.length - 1]];
}

function trimEnd(poly, r) {
  return trimStart([...poly].reverse(), r).reverse();
}

/** Closed loop from edge polylines (edge i ends where edge i+1 starts) with rounded corners. */
function roundedLoop(edges, r, segs = 6) {
  const trimmed = edges.map((e) => {
    const rr = Math.min(r, polyLen(e) * 0.45);
    return trimEnd(trimStart(e, rr), rr);
  });
  const out = [];
  for (let i = 0; i < edges.length; i++) {
    const e = trimmed[i];
    for (const p of e) out.push(p);
    const next = trimmed[(i + 1) % edges.length];
    const corner = edges[i][edges[i].length - 1];
    const a = e[e.length - 1];
    const b = next[0];
    for (let k = 1; k < segs; k++) out.push(quadBezier(a, corner, b, k / segs));
  }
  return out;
}

/** Rounded polygon from corner points (straight edges). */
function roundedPoly(corners, r, segs = 6) {
  const edges = corners.map((c, i) => [c, corners[(i + 1) % corners.length]]);
  return roundedLoop(edges, r, segs);
}

/** Triangulate a 2D param-space outline and lift it with map(p) -> [x,y,z]; normals oriented along `hint`. */
function polygonGeometry(outline2, map, hint) {
  const contour = outline2.map(([a, b]) => new THREE.Vector2(a, b));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos = [];
  const uv = [];
  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  for (const [a, b] of outline2) {
    minA = Math.min(minA, a);
    maxA = Math.max(maxA, a);
    minB = Math.min(minB, b);
    maxB = Math.max(maxB, b);
  }
  for (const p of outline2) {
    pos.push(...map(p));
    uv.push((p[0] - minA) / (maxA - minA || 1), (p[1] - minB) / (maxB - minB || 1));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const idx = faces.flat();
  geo.setIndex(idx);
  geo.computeVertexNormals();
  if (hint) {
    const n = geo.attributes.normal;
    let dot = 0;
    for (let i = 0; i < n.count; i++) dot += n.getX(i) * hint[0] + n.getY(i) * hint[1] + n.getZ(i) * hint[2];
    if (dot < 0) {
      for (let i = 0; i < idx.length; i += 3) {
        const t = idx[i + 1];
        idx[i + 1] = idx[i + 2];
        idx[i + 2] = t;
      }
      geo.setIndex(idx);
      geo.computeVertexNormals();
    }
  }
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Closed tube (rubber seal / frame) through 3D points. */
function sealTube(points3, radius, radial = 5) {
  const curve = new THREE.CatmullRomCurve3(points3.map((p) => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
  return new THREE.TubeGeometry(curve, Math.max(24, points3.length * 2), radius, radial, true);
}

/** Open tube through 3D points. */
function pathTube(points3, radius, radial = 6, segs = null) {
  const curve = new THREE.CatmullRomCurve3(points3.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  return new THREE.TubeGeometry(curve, segs || Math.max(12, points3.length * 4), radius, radial, false);
}

/** Ring of rings lofted along an arbitrary straight axis (HIRSS ducts, nacelles). */
function axisLoft(stations, N, opts = {}) {
  // stations: [{ c:[x,y,z], dir:[x,y,z], up:[x,y,z], spec }]
  const rings = stations.map((st) => {
    const fn = superellipse(st.spec);
    const d = new THREE.Vector3(...st.dir).normalize();
    const up = new THREE.Vector3(...(st.up || [0, 1, 0]));
    const side = new THREE.Vector3().crossVectors(d, up).normalize();
    const realUp = new THREE.Vector3().crossVectors(side, d).normalize();
    const ring = [];
    for (let k = 0; k < N; k++) {
      const [z, y] = fn((k / N) * TAU);
      ring.push([st.c[0] + side.x * z + realUp.x * y, st.c[1] + side.y * z + realUp.y * y, st.c[2] + side.z * z + realUp.z * y]);
    }
    return ring;
  });
  return loftRings(rings, opts);
}

// ============================================================================
// Hull profile (metres). Monotone-cubic laws along s for the superellipse stations.
// ============================================================================
const K = smoothCurve;
const PROFILE = {
  top: K([
    [0, 1.25], [0.025, 1.325], [0.07, 1.39], [0.14, 1.44], [0.24, 1.48], [0.38, 1.51], [0.56, 1.53], [0.74, 1.545],
    [0.86, 1.556], [0.95, 1.71], [1.08, 1.93], [1.25, 2.13], [1.45, 2.26], [1.65, 2.305], [1.85, 2.318], [2.2, 2.322],
    [6.8, 2.325], [8.0, 2.33], [10, 2.3], [12, 2.24], [13.0, 2.21], [13.7, 2.17], [14.0, 2.12], [14.2, 2.04],
  ]),
  bot: K([
    [0, 1.25], [0.025, 1.17], [0.07, 1.09], [0.14, 1.01], [0.24, 0.935], [0.38, 0.855], [0.56, 0.78], [0.8, 0.705],
    [1.1, 0.635], [1.45, 0.57], [1.85, 0.515], [2.35, 0.478], [3.0, 0.465], [6.6, 0.465], [7.0, 0.5], [7.5, 0.62],
    [8.0, 0.81], [8.5, 1.01], [9.0, 1.19], [9.5, 1.33], [10, 1.43], [11, 1.56], [12, 1.65], [13, 1.71], [13.7, 1.75],
    [14.0, 1.8], [14.2, 1.92],
  ]),
  halfW: K([
    [0, 0], [0.025, 0.2], [0.07, 0.33], [0.14, 0.44], [0.24, 0.545], [0.38, 0.645], [0.56, 0.745], [0.74, 0.83],
    [0.86, 0.885], [1.0, 0.95], [1.2, 1.022], [1.5, 1.088], [1.9, 1.135], [2.5, 1.168], [3.0, 1.18], [6.6, 1.18],
    [7.0, 1.155], [7.5, 1.08], [8.0, 0.95], [8.5, 0.8], [9.0, 0.665], [9.5, 0.56], [10, 0.48], [11, 0.385],
    [12, 0.315], [13, 0.262], [13.7, 0.225], [14.0, 0.17], [14.2, 0.07],
  ]),
  yc: K([
    [0, 1.25], [0.07, 1.24], [0.24, 1.21], [0.56, 1.165], [0.86, 1.15], [1.3, 1.17], [2.0, 1.24], [2.8, 1.29],
    [6.6, 1.3], [7.0, 1.34], [7.5, 1.43], [8.0, 1.55], [8.5, 1.66], [9.0, 1.75], [9.5, 1.81], [10, 1.86], [11, 1.91],
    [12, 1.945], [13, 1.96], [14.2, 1.98],
  ]),
  nTop: K([[0, 2.3], [0.5, 2.5], [0.86, 2.7], [1.3, 3.3], [2.2, 3.6], [6.6, 3.6], [8, 3.2], [9.5, 2.5], [14.2, 2.3]]),
  nBot: K([[0, 2.3], [0.5, 2.5], [1.0, 3.0], [1.8, 4.2], [2.6, 5.0], [6.6, 5.0], [7.5, 4.0], [8.5, 3.0], [9.5, 2.4], [14.2, 2.2]]),
};

function hullSpec(s) {
  const top = PROFILE.top(s);
  const bot = PROFILE.bot(s);
  const yc = Math.min(top - 1e-4, Math.max(bot + 1e-4, PROFILE.yc(s)));
  return {
    halfW: Math.max(0, PROFILE.halfW(s)), top: Math.max(0, top - yc), bot: Math.max(0, yc - bot), yc, zc: 0,
    nTop: PROFILE.nTop(s), nBot: PROFILE.nBot(s),
  };
}

// Flat windshield planes: main panes h <= hw(s) (both sides), side panes h <= hw(s) - k (|z| - zc).
const WS = { cut: 0.86, s0: 0.86, h0: 1.565, slope: 0.8, zc: 0.77, k: 1.45 };
const hwAt = (s) => WS.h0 + WS.slope * (s - WS.s0);
const hSideAt = (s, z) => hwAt(s) - WS.k * (Math.abs(z) - WS.zc);
const baseTopAt = (s, z) => superellipseTopAt(hullSpec(s), z);

function clipPoly(poly, [a, b, c]) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const fp = a * p[0] + b * p[1] - c;
    const fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/** Rotate a closed [z,h] polygon so it starts exactly at the roof centre, heading to +z (starboard) first. */
function anchorTop(poly) {
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    if (p[0] <= 0 && q[0] > 0) {
      const t = p[0] === q[0] ? 0 : -p[0] / (q[0] - p[0]);
      const out = [[0, p[1] + (q[1] - p[1]) * t]];
      for (let k = 1; k <= n; k++) {
        const r = poly[(i + k) % n];
        const last = out[out.length - 1];
        if (Math.hypot(r[0] - last[0], r[1] - last[1]) > 1e-7) out.push(r);
      }
      const last = out[out.length - 1];
      if (Math.hypot(last[0] - out[0][0], last[1] - out[0][1]) < 1e-7) out.pop();
      return out;
    }
  }
  return poly;
}

const OUT_N = 640;
const outlineCache = new Map();

/**
 * Dense closed hull outline [z,h] at station s (starts at the roof centre, starboard first) + arc lengths.
 * `coarse` (texture painting) snaps s to a 1 cm grid and uses fewer points so thousands of queries stay cheap.
 */
function hullOutline(s, coarse = false) {
  const n0 = coarse ? 256 : OUT_N;
  if (coarse) s = Math.round(s * 100) / 100;
  const key = coarse ? -1 - Math.round(s * 100) : Math.round(s * 4000);
  let o = outlineCache.get(key);
  if (o) return o;
  const sp = hullSpec(s);
  let pts;
  if (sp.halfW < 1e-5 || sp.top + sp.bot < 1e-5) {
    pts = [[0, sp.yc]];
  } else {
    const fn = superellipse(sp);
    pts = new Array(n0);
    for (let k = 0; k < n0; k++) pts[k] = fn((k / n0) * TAU);
    if (s >= WS.cut) {
      const hw = hwAt(s);
      for (const hp of [[0, 1, hw], [WS.k, 1, hw + WS.k * WS.zc], [-WS.k, 1, hw + WS.k * WS.zc]]) pts = clipPoly(pts, hp);
      pts = anchorTop(pts);
    }
  }
  const n = pts.length;
  const cum = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i % n][0] - pts[i - 1][0], pts[i % n][1] - pts[i - 1][1]);
  o = { s, pts, cum, per: cum[n] };
  if (outlineCache.size > 8000) outlineCache.clear();
  outlineCache.set(key, o);
  return o;
}

function resampleOutline(o, N) {
  const { pts, cum, per } = o;
  const n = pts.length;
  const out = new Array(N);
  if (per < 1e-9) {
    for (let k = 0; k < N; k++) out[k] = [pts[0][0], pts[0][1]];
    return out;
  }
  let seg = 0;
  for (let k = 0; k < N; k++) {
    const target = (k / N) * per;
    while (seg < n - 1 && cum[seg + 1] < target) seg++;
    const a = pts[seg];
    const b = pts[(seg + 1) % n];
    const L = cum[seg + 1] - cum[seg] || 1;
    const t = clamp((target - cum[seg]) / L, 0, 1);
    out[k] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  return out;
}

/** Starboard-side crossing of height h at station s: { z, v (arc fraction), nz, nh }. Port: z -> -z, v -> 1 - v. */
function sideAt(s, h, side = 1, coarse = false) {
  const o = hullOutline(s, coarse);
  const { pts, cum, per } = o;
  const half = per / 2;
  let best = null;
  for (let i = 0; i < pts.length && cum[i] <= half + 1e-9; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if ((a[1] - h) * (b[1] - h) > 0 || a[1] === b[1]) continue;
    const t = (a[1] - h) / (a[1] - b[1]);
    const z = a[0] + (b[0] - a[0]) * t;
    if (!best || z > best.z) {
      const L = cum[i + 1] - cum[i];
      const dz = (b[0] - a[0]) / (L || 1);
      const dh = (b[1] - a[1]) / (L || 1);
      best = { z, arc: cum[i] + t * L, nz: -dh, nh: dz };
    }
  }
  if (!best) best = { z: 0, arc: 0, nz: 0, nh: 1 };
  const v = best.arc / (per || 1);
  return side > 0 ? { z: best.z, v, nz: best.nz, nh: best.nh } : { z: -best.z, v: 1 - v, nz: -best.nz, nh: best.nh };
}

/** Upper-surface point at lateral z: { h, v, nz, nh } (works on the roof, windshield and side-pane facets). */
function topAt(s, z, coarse = false) {
  const o = hullOutline(s, coarse);
  const { pts, cum, per } = o;
  const az = Math.abs(z);
  for (let i = 0; i < pts.length - 1 && cum[i] <= per / 2; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (b[0] < a[0] - 1e-9) break;
    if (az >= a[0] && az <= b[0]) {
      const t = (az - a[0]) / (b[0] - a[0] || 1);
      const L = cum[i + 1] - cum[i];
      const dz = (b[0] - a[0]) / (L || 1);
      const dh = (b[1] - a[1]) / (L || 1);
      const v = (cum[i] + t * L) / per;
      return z >= 0 ? { h: a[1] + (b[1] - a[1]) * t, v, nz: -dh, nh: dz } : { h: a[1] + (b[1] - a[1]) * t, v: 1 - v, nz: dh, nh: dz };
    }
  }
  const sp = hullSpec(s);
  return { h: sp.yc, v: z >= 0 ? 0.25 : 0.75, nz: Math.sign(z) || 1, nh: 0 };
}

/** Local-frame point on the hull side at (s, h) offset outward by `off` metres. */
function sidePoint(s, h, side, off = 0) {
  const r = sideAt(s, h, side);
  return P(s, h + r.nh * off, r.z + r.nz * off);
}

function topPoint(s, z, off = 0) {
  const r = topAt(s, z);
  return P(s, r.h + r.nh * off, z + r.nz * off);
}

function solveS(fn, lo, hi) {
  // first s in [lo, hi] where fn(s) >= 0 (fn assumed to change sign once)
  if (fn(lo) >= 0) return lo;
  for (let i = 0; i < 44; i++) {
    const m = (lo + hi) / 2;
    if (fn(m) >= 0) hi = m;
    else lo = m;
  }
  return hi;
}
const sillS = (z) => solveS((s) => baseTopAt(s, z) - hwAt(s), WS.cut, 1.7);
const roofS = (z) => solveS((s) => hwAt(s) - baseTopAt(s, z), 1.2, 2.6);
/** Outer edge (lateral z) of the side-pane facet at station s, or null if the facet is absent. */
function sideFacetOuter(s) {
  const sp = hullSpec(s);
  const f = (z) => superellipseTopAt(sp, z) - hSideAt(s, z);
  if (f(WS.zc + 0.02) <= 0) return null;
  let lo = WS.zc + 0.02;
  let hi = sp.halfW;
  if (f(hi) > 0) return hi;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) lo = m;
    else hi = m;
  }
  return lo;
}

// ============================================================================
// Window, door and hatch outlines (metres)
// ============================================================================
let OPEN = null;
function openings() {
  if (OPEN) return OPEN;
  // Main windshield pane (starboard; port mirrors z). Param space (s, z), on the plane h = hw(s).
  const zIn = 0.045;
  const zOut = WS.zc - 0.04;
  const bottom = [];
  const top = [];
  for (let i = 0; i <= 10; i++) {
    const z = lerp(zIn, zOut, i / 10);
    bottom.push([sillS(z) + 0.035, z]);
    top.push([roofS(z) - 0.032, z]);
  }
  const mainPane = roundedLoop([
    bottom,
    [bottom[10], top[10]],
    [...top].reverse(),
    [top[0], bottom[0]],
  ], 0.06, 6);

  // Side windshield pane on the side facet (s, z): from the corner post to the facet's outer edge.
  const sideIn = [];
  const sideOut = [];
  const sA = sillS(WS.zc + 0.06) + 0.06;
  const sB = 1.88;
  for (let i = 0; i <= 12; i++) {
    const s = lerp(sA, sB, i / 12);
    const zo = sideFacetOuter(s);
    const zi = WS.zc + 0.04;
    const zOuter = zo ? Math.max(zi + 0.02, zo - 0.04) : zi + 0.02;
    sideIn.push([s, zi]);
    sideOut.push([s, zOuter]);
  }
  const sidePane = roundedLoop([sideIn, [sideIn[12], sideOut[12]], [...sideOut].reverse(), [sideOut[0], sideIn[0]]], 0.05, 6);

  const overhead = roundedPoly([[1.98, 0.12], [2.9, 0.12], [2.9, 0.6], [1.98, 0.6]], 0.09);
  const chin = roundedPoly([[1.08, 0.84], [1.8, 0.76], [1.88, 1.13], [1.15, 1.25]], 0.07);

  const cockpitDoor = {
    s0: 1.96, s1: 3.24, h0: 0.86, h1: 2.2,
    outline: roundedPoly([[2.0, 0.9], [3.2, 0.9], [3.2, 2.15], [2.18, 2.15], [2.0, 1.78]], 0.055),
    window: roundedPoly([[2.11, 1.37], [3.1, 1.37], [3.1, 2.06], [2.24, 2.06], [2.09, 1.79]], 0.075),
  };
  const gunner = roundedPoly([[3.33, 1.43], [3.88, 1.43], [3.88, 2.02], [3.33, 2.02]], 0.08);
  const cabinDoor = {
    s0: 3.96, s1: 5.86, h0: 0.84, h1: 2.16,
    outline: roundedPoly([[4.0, 0.87], [5.82, 0.87], [5.82, 2.12], [4.0, 2.12]], 0.06),
    windows: [
      roundedPoly([[4.14, 1.38], [4.84, 1.38], [4.84, 1.98], [4.14, 1.98]], 0.09),
      roundedPoly([[4.98, 1.38], [5.68, 1.38], [5.68, 1.98], [4.98, 1.98]], 0.09),
    ],
  };
  OPEN = { mainPane, sidePane, overhead, chin, cockpitDoor, gunner, cabinDoor };
  return OPEN;
}

// 3D maps for each opening family -----------------------------------------------------------
const WS_N_MAIN = new THREE.Vector3(WS.slope, 1, 0).normalize(); // local (x=-s) normal of the main plane
function mainPanePoint([s, z], side, off = 0) {
  return [-s + WS_N_MAIN.x * off, hwAt(s) + WS_N_MAIN.y * off, side * z];
}
function sidePanePoint([s, z], side, off = 0) {
  const n = new THREE.Vector3(WS.slope, 1, side * WS.k).normalize();
  return [-s + n.x * off, hSideAt(s, z) + n.y * off, side * z + n.z * off];
}
const overheadPoint = ([s, z], side, off = 0) => topPoint(s, side * z, off);
const sideWinPoint = ([s, h], side, off = 0) => sidePoint(s, h, side, off);

// ============================================================================
// Procedural textures
// ============================================================================
const PAINT = '#20241a'; // FS 34031 Aircraft Green, lusterless
const SEAL = 'rgba(12,14,10,0.92)';

function hullUV(s, v, W, H) {
  return [(s / HULL_LEN) * W, (1 - v) * H];
}

function drawHullLivery(ctx, W, H, bump) {
  const rnd = mulberry32(6060);
  const O = openings();
  const X = (s) => (s / HULL_LEN) * W;
  const sideXY = (s, h, side) => hullUV(s, sideAt(s, h, side, true).v, W, H);
  const topXY = (s, z) => hullUV(s, topAt(s, z, true).v, W, H);
  const seamCol = bump ? '#4a4a4a' : 'rgba(18,21,14,0.55)';
  const seamHi = bump ? '#a0a0a0' : 'rgba(210,220,190,0.05)';
  const rivetCol = bump ? '#b4b4b4' : 'rgba(225,232,205,0.10)';

  // 1. Base paint (+ subtle mottling / fine noise)
  ctx.fillStyle = bump ? '#808080' : PAINT;
  ctx.fillRect(0, 0, W, H);
  if (!bump) {
    for (let i = 0; i < 420; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = 20 + rnd() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const light = rnd() > 0.5;
      g.addColorStop(0, light ? 'rgba(235,240,215,0.035)' : 'rgba(10,12,6,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,240,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    }
  }

  const strokePath = (pts, color, width, close = false) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const fillPath = (pts, color) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const rivets = (pts, spacing = 6) => {
    let acc = 0;
    ctx.fillStyle = rivetCol;
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      while (acc <= L) {
        const t = acc / (L || 1);
        const x = lerp(pts[i - 1][0], pts[i][0], t);
        const y = lerp(pts[i - 1][1], pts[i][1], t);
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
        acc += spacing;
      }
      acc -= L;
    }
  };
  // seam along s at constant height on one side
  const seamAlong = (s0, s1, h, side, withRivets = true) => {
    const pts = [];
    for (let s = s0; s <= s1 + 1e-6; s += 0.05) pts.push(sideXY(Math.min(s, s1), h, side));
    strokePath(pts, seamCol, 2);
    strokePath(pts.map(([x, y]) => [x, y + 1.5]), seamHi, 1);
    if (withRivets) rivets(pts.map(([x, y]) => [x, y + 4]), 6);
  };
  // ring seam (constant s) between two heights on one side, or full perimeter
  const ringSeam = (s, side = 0, h0 = null, h1 = null, withRivets = true) => {
    const x = X(s);
    let y0 = 0;
    let y1 = H;
    if (side) {
      y0 = sideXY(s, h1, side)[1];
      y1 = sideXY(s, h0, side)[1];
      if (y0 > y1) [y0, y1] = [y1, y0];
    }
    strokePath([[x, y0], [x, y1]], seamCol, 2);
    strokePath([[x + 1.5, y0], [x + 1.5, y1]], seamHi, 1);
    if (withRivets) rivets([[x - 4, y0], [x - 4, y1]], 6);
  };
  const panelSide = (corners, side, r = 0.05) => {
    const pts = roundedPoly(corners, r, 4).map(([s, h]) => sideXY(s, h, side));
    strokePath(pts, seamCol, 1.8, true);
    rivets(pts, 7);
  };
  const latch = (s, h, side, w = 0.07, hh = 0.025) => {
    const a = sideXY(s - w / 2, h + hh / 2, side);
    const b = sideXY(s + w / 2, h - hh / 2, side);
    ctx.fillStyle = bump ? '#5a5a5a' : 'rgba(14,16,10,0.6)';
    ctx.fillRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  };

  // 2. Structural seams: frames (ring seams), longerons, access panels
  for (const s of [0.6, 3.27, 3.92, 5.9, 6.55, 7.3, 8.1, 8.95, 9.85, 11.0, 12.15, 13.25]) ringSeam(s);
  for (const side of [1, -1]) {
    seamAlong(1.25, 8.2, 0.8, side);
    seamAlong(2.05, 8.7, 2.19, side);
    seamAlong(1.5, 7.2, 0.53, side, false);
    seamAlong(5.9, 8.6, 1.32, side);
    // boom side seams
    const boom = [];
    for (let s = 9.85; s <= 13.3; s += 0.05) boom.push(sideXY(s, PROFILE.yc(s) + 0.05, side));
    strokePath(boom, seamCol, 1.8);
    rivets(boom.map(([x, y]) => [x, y + 4]), 7);
    // nose avionics bay doors + lower nose panel
    panelSide([[0.2, 1.02], [0.56, 1.0], [0.58, 1.36], [0.24, 1.4]], side, 0.04);
    latch(0.39, 1.06, side);
    latch(0.41, 1.33, side);
    panelSide([[0.75, 0.79], [1.0, 0.75], [1.0, 1.0], [0.77, 1.02]], side, 0.03);
    // below the gunner window, behind the cabin door, aft fuselage, boom panels
    panelSide([[3.34, 0.93], [3.86, 0.93], [3.86, 1.3], [3.34, 1.3]], side);
    panelSide([[6.02, 1.05], [6.48, 1.05], [6.48, 1.86], [6.02, 1.86]], side);
    latch(6.25, 1.1, side);
    latch(6.25, 1.8, side);
    panelSide([[7.42, 1.56], [7.98, 1.56], [7.98, 2.02], [7.42, 2.02]], side);
    panelSide([[8.22, 1.62], [8.86, 1.62], [8.86, 2.07], [8.22, 2.07]], side);
    panelSide([[10.05, 1.74], [10.85, 1.74], [10.85, 2.04], [10.05, 2.04]], side, 0.04);
    panelSide([[11.25, 1.78], [12.0, 1.78], [12.0, 2.05], [11.25, 2.05]], side, 0.04);
    // fuel filler (port has the gravity filler; draw on both for symmetry of grime)
    const fc = sideXY(6.82, 1.18, side);
    ctx.beginPath();
    ctx.arc(fc[0], fc[1], 7, 0, TAU);
    ctx.strokeStyle = seamCol;
    ctx.lineWidth = 2;
    ctx.stroke();
    // boarding steps (dark recesses) and hand-holds
    for (const [s0, s1, h0, h1] of [[2.24, 2.5, 0.62, 0.71], [4.66, 4.96, 0.6, 0.69], [3.42, 3.62, 2.22, 2.27]]) {
      const pts = [sideXY(s0, h1, side), sideXY(s1, h1, side), sideXY(s1, h0, side), sideXY(s0, h0, side)];
      fillPath(pts, bump ? '#303030' : 'rgba(8,9,6,0.85)');
    }
  }
  // roof / belly centre seams
  strokePath([[X(0.62), hullUV(0, 0.5, W, H)[1]], [X(7.5), hullUV(0, 0.5, W, H)[1]]], seamCol, 1.6);

  if (!bump) {
    // 3. Weathering: exhaust soot on the boom, oil streaks under the transmission, belly grime
    for (const side of [1, -1]) {
      for (let i = 0; i < 260; i++) {
        const s0 = 8.4 + rnd() * 4.2;
        const len = 0.4 + rnd() * 1.6;
        const h = PROFILE.yc(s0) + (rnd() * 0.95) * (PROFILE.top(s0) - PROFILE.yc(s0));
        const fade = clamp(1 - (s0 - 8.4) / 4.6, 0, 1);
        const pts = [];
        for (let s = s0; s <= Math.min(13.4, s0 + len); s += 0.1) pts.push(sideXY(s, Math.min(PROFILE.top(s) - 0.01, h), side));
        strokePath(pts, `rgba(12,12,10,${(0.05 + rnd() * 0.07) * fade})`, 2 + rnd() * 5);
      }
      for (let i = 0; i < 46; i++) {
        const s = 3.9 + rnd() * 3.0;
        const h0 = 2.2 - rnd() * 0.05;
        const pts = [];
        const L = 0.12 + rnd() * 0.45;
        for (let h = h0; h >= h0 - L; h -= 0.04) pts.push(sideXY(s + (h0 - h) * 0.05, h, side));
        strokePath(pts, `rgba(20,18,10,${0.05 + rnd() * 0.08})`, 1 + rnd() * 2.5);
      }
    }
    const by = hullUV(0, 0.5, W, H)[1];
    const g = ctx.createLinearGradient(0, by - H * 0.12, 0, by + H * 0.12);
    g.addColorStop(0, 'rgba(32,28,18,0)');
    g.addColorStop(0.5, 'rgba(32,28,18,0.28)');
    g.addColorStop(1, 'rgba(32,28,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(X(0.5), by - H * 0.12, X(9.5) - X(0.5), H * 0.24);
    // soot pooled right behind the HIRSS outlets (upper boom/aft fuselage, both sides)
    for (const side of [1, -1]) {
      const c = sideXY(9.25, 2.12, side);
      const rg = ctx.createRadialGradient(c[0], c[1], 4, c[0], c[1], 120);
      rg.addColorStop(0, 'rgba(14,14,12,0.42)');
      rg.addColorStop(1, 'rgba(14,14,12,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(c[0] - 130, c[1] - 130, 260, 260);
    }

    // 4. Markings: low-visibility black "U.S. ARMY" on the boom, stencils
    const text = (str, s, h, side, size, color, font = '900', family = "'Arial Black', 'Helvetica Neue', Arial, sans-serif") => {
      // local metre-space transform -> canvas via finite differences of the hull UV map
      const dir = side > 0 ? -1 : 1; // reading direction along s (starboard reads toward the nose)
      const o = sideXY(s, h, side);
      const ax = sideXY(s + dir * 0.1, h, side);
      const ay = sideXY(s, h - 0.1, side);
      const ux = [(ax[0] - o[0]) / 0.1, (ax[1] - o[1]) / 0.1];
      const uy = [(ay[0] - o[0]) / 0.1, (ay[1] - o[1]) / 0.1];
      ctx.save();
      ctx.setTransform(ux[0], ux[1], uy[0], uy[1], o[0], o[1]);
      ctx.font = `${font} ${size}px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    for (const side of [1, -1]) {
      text('U.S. ARMY', 11.05, 1.94, side, 0.27, 'rgba(14,16,11,0.86)');
      text('NO STEP', 3.6, 2.27, side, 0.05, 'rgba(14,16,11,0.8)', '700', 'Arial, sans-serif');
      text('NO STEP', 7.0, 2.27, side, 0.05, 'rgba(14,16,11,0.8)', '700', 'Arial, sans-serif');
      text('FUEL', 6.82, 1.3, side, 0.045, 'rgba(14,16,11,0.85)', '700', 'Arial, sans-serif');
      text('RESCUE', 4.92, 0.78, side, 0.05, 'rgba(14,16,11,0.75)', '700', 'Arial, sans-serif');
      text('DANGER  -  KEEP CLEAR OF ROTOR', 12.6, 1.83, side, 0.042, 'rgba(14,16,11,0.8)', '700', 'Arial, sans-serif');
    }
  }

  // 5. Openings: seal lines, then punch alpha holes (windshield, side panes, overhead, chin, doors, gunner)
  const loops = [];
  for (const side of [1, -1]) {
    loops.push(O.mainPane.map(([s, z]) => topXY(s, side * z)));
    loops.push(O.sidePane.map(([s, z]) => topXY(s, side * z)));
    loops.push(O.overhead.map(([s, z]) => topXY(s, side * z)));
    loops.push(O.chin.map(([s, h]) => sideXY(s, h, side)));
    loops.push(O.gunner.map(([s, h]) => sideXY(s, h, side)));
    loops.push(O.cockpitDoor.outline.map(([s, h]) => sideXY(s, h, side)));
    loops.push(O.cabinDoor.outline.map(([s, h]) => sideXY(s, h, side)));
  }
  for (const pts of loops) strokePath(pts, bump ? '#3c3c3c' : SEAL, 5, true);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const pts of loops) fillPath(pts, '#000');
  ctx.restore();
}

function hullTextures() {
  const color = cachedCanvasTexture('uh60m-hull-livery-v1', 2048, 1024, (ctx, w, h) => drawHullLivery(ctx, w, h, false));
  const bump = cachedCanvasTexture('uh60m-hull-bump-v1', 2048, 1024, (ctx, w, h) => drawHullLivery(ctx, w, h, true), { linear: true });
  return { color, bump };
}

/** Generic cowling panel texture (doghouse, nacelles, HIRSS): seams, latches, soot. */
function cowlTexture(key, opts = {}) {
  return cachedCanvasTexture(key, 1024, 512, (ctx, W, H) => {
    const rnd = mulberry32(opts.seed || 77);
    ctx.fillStyle = opts.base || PAINT;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,240,0.03)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    }
    ctx.strokeStyle = 'rgba(16,18,12,0.6)';
    ctx.lineWidth = 2;
    for (const u of opts.seamsU || [0.18, 0.36, 0.55, 0.72, 0.88]) {
      ctx.beginPath();
      ctx.moveTo(u * W, 0);
      ctx.lineTo(u * W, H);
      ctx.stroke();
    }
    for (const v of opts.seamsV || [0.3, 0.7]) {
      ctx.beginPath();
      ctx.moveTo(0, v * H);
      ctx.lineTo(W, v * H);
      ctx.stroke();
      ctx.fillStyle = 'rgba(12,14,9,0.7)';
      for (let u = 0.06; u < 1; u += 0.085) ctx.fillRect(u * W, v * H - 5, 16, 10);
    }
    ctx.fillStyle = 'rgba(225,232,205,0.08)';
    for (const u of opts.seamsU || [0.18, 0.36, 0.55, 0.72, 0.88]) for (let y = 4; y < H; y += 7) ctx.fillRect(u * W - 4, y, 1.6, 1.6);
    if (opts.sootFrom != null) {
      const g = ctx.createLinearGradient(opts.sootFrom * W, 0, W, 0);
      g.addColorStop(0, 'rgba(10,10,8,0)');
      g.addColorStop(1, `rgba(10,10,8,${opts.soot || 0.6})`);
      ctx.fillStyle = g;
      ctx.fillRect(opts.sootFrom * W, 0, W, H);
    }
    if (opts.grille) {
      const [u0, u1, v0, v1] = opts.grille;
      ctx.fillStyle = '#121410';
      ctx.fillRect(u0 * W, v0 * H, (u1 - u0) * W, (v1 - v0) * H);
      ctx.strokeStyle = 'rgba(90,96,80,0.8)';
      ctx.lineWidth = 2;
      for (let u = u0; u <= u1; u += 0.008) {
        ctx.beginPath();
        ctx.moveTo(u * W, v0 * H);
        ctx.lineTo(u * W, v1 * H);
        ctx.stroke();
      }
    }
  });
}

function bladeTexture() {
  return cachedCanvasTexture('uh60m-main-blade-v2', 1024, 128, (ctx, W, H) => {
    ctx.fillStyle = '#151618';
    ctx.fillRect(0, 0, W, H);
    // span-wise grime
    const rnd = mulberry32(12);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * W, rnd() * H, 60 + rnd() * 160, 1 + rnd() * 2.5);
    }
    // nickel / titanium leading-edge erosion strip around v = 0.5 (ring: TE -> upper -> LE -> lower -> TE)
    const g = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.58);
    g.addColorStop(0, 'rgba(76,81,85,0)');
    g.addColorStop(0.25, '#4c5155');
    g.addColorStop(0.5, '#5f6468');
    g.addColorStop(0.75, '#4c5155');
    g.addColorStop(1, 'rgba(76,81,85,0)');
    ctx.fillStyle = g;
    ctx.fillRect(W * 0.12, H * 0.42, W * 0.88, H * 0.16);
    // swept-tip cap (slightly lighter composite) + trim tab line
    ctx.fillStyle = 'rgba(120,125,130,0.1)';
    ctx.fillRect(W * 0.93, 0, W * 0.07, H);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(W * 0.62, 0, 3, H * 0.06);
    ctx.fillRect(W * 0.62, H * 0.94, 3, H * 0.06);
  });
}

function pylonTexture() {
  return cachedCanvasTexture('uh60m-pylon-v1', 1024, 512, (ctx, W, H) => {
    const rnd = mulberry32(31);
    ctx.fillStyle = PAINT;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,240,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    }
    // seams (u = span 0 root -> 1 tip, canvas x); v around the airfoil: 0 TE (port) -> 0.5 LE -> 1 TE (starboard)
    ctx.strokeStyle = 'rgba(16,18,12,0.6)';
    ctx.lineWidth = 2;
    for (const u of [0.28, 0.62, 0.86]) {
      ctx.beginPath();
      ctx.moveTo(u * W, 0);
      ctx.lineTo(u * W, H);
      ctx.stroke();
    }
    for (const v of [0.12, 0.38, 0.62, 0.88]) {
      ctx.beginPath();
      ctx.moveTo(0, (1 - v) * H);
      ctx.lineTo(W, (1 - v) * H);
      ctx.stroke();
    }
    // tail number on both pylon faces. canvas x = u*W (span, up the pylon), y = (1-v)*H (around the airfoil).
    // On BOTH faces "screen right" runs toward canvas +y and "screen up" toward canvas +x => rotate +90 deg.
    // Text is squeezed along the reading axis to undo the texel aspect (span 2.15 m / 1024 px vs ~2.5 m / 512 px).
    const face = (vCenter) => {
      ctx.save();
      ctx.translate(0.47 * W, (1 - vCenter) * H);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(14,16,11,0.88)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "900 118px 'Arial Black', Arial, sans-serif";
      ctx.save();
      ctx.scale(0.43, 1.0);
      ctx.fillText('20175', 0, 0);
      ctx.restore();
      ctx.font = "800 46px Arial, sans-serif";
      ctx.save();
      ctx.scale(0.43, 1.0);
      ctx.fillText('ARMY', 0, -96);
      ctx.restore();
      ctx.restore();
    };
    face(0.26);
    face(0.74);
    // soot from the tail gearbox & warning stripe near the tip
    const g = ctx.createLinearGradient(0.75 * W, 0, W, 0);
    g.addColorStop(0, 'rgba(12,12,10,0)');
    g.addColorStop(1, 'rgba(12,12,10,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0.75 * W, 0, 0.25 * W, H);
  });
}

function doorTexture(key, outline, windows, s0, s1, h0, h1, opts = {}) {
  return cachedCanvasTexture(key, 512, 512, (ctx, W, H) => {
    const map = ([s, h]) => [((s - s0) / (s1 - s0)) * W, (1 - (h - h0) / (h1 - h0)) * H];
    const rnd = mulberry32(opts.seed || 5);
    const path = (pts) => {
      ctx.beginPath();
      const p0 = map(pts[0]);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i < pts.length; i++) {
        const p = map(pts[i]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
    };
    path(outline);
    ctx.fillStyle = PAINT;
    ctx.fill();
    ctx.save();
    path(outline);
    ctx.clip();
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,240,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    }
    // inner panel line, kick-plate grime, handle
    const inset = outline.map(([s, h]) => [lerp(s, (s0 + s1) / 2, 0.06), lerp(h, (h0 + h1) / 2, 0.06)]);
    path(inset);
    ctx.strokeStyle = 'rgba(16,18,12,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const g = ctx.createLinearGradient(0, H * 0.75, 0, H);
    g.addColorStop(0, 'rgba(30,26,16,0)');
    g.addColorStop(1, 'rgba(30,26,16,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.75, W, H * 0.25);
    if (opts.handle) {
      const [hs, hh] = opts.handle;
      const p = map([hs, hh]);
      ctx.fillStyle = '#121410';
      ctx.fillRect(p[0] - 18, p[1] - 6, 36, 12);
      ctx.fillStyle = 'rgba(200,205,190,0.25)';
      ctx.fillRect(p[0] - 16, p[1] - 5, 32, 3);
    }
    if (opts.track) {
      // roller fittings at the door corners
      for (const [s, h] of opts.track) {
        const p = map([s, h]);
        ctx.fillStyle = '#1a1c18';
        ctx.fillRect(p[0] - 10, p[1] - 8, 20, 16);
      }
    }
    ctx.restore();
    path(outline);
    ctx.strokeStyle = SEAL;
    ctx.lineWidth = 4;
    ctx.stroke();
    for (const w of windows) {
      path(w);
      ctx.strokeStyle = SEAL;
      ctx.lineWidth = 7;
      ctx.stroke();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (const w of windows) {
      path(w);
      ctx.fill();
    }
    ctx.restore();
  });
}

function mfdTexture() {
  return cachedCanvasTexture('uh60m-mfd-v1', 1024, 320, (ctx, W, H) => {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);
    const pw = W / 4;
    for (let i = 0; i < 4; i++) {
      const x0 = i * pw + 10;
      const w = pw - 20;
      const y0 = 10;
      const h = H - 20;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, w, h);
      ctx.clip();
      if (i === 0 || i === 3) {
        // Primary flight display: attitude ball + tapes
        const cx = x0 + w / 2;
        const cy = y0 + h / 2 + 8;
        ctx.fillStyle = '#1d6fd1';
        ctx.fillRect(x0, y0, w, h);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i === 0 ? -0.08 : 0.06);
        ctx.fillStyle = '#7a4b22';
        ctx.fillRect(-w, 6, w * 2, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w, 6);
        ctx.lineTo(w, 6);
        ctx.stroke();
        for (const p of [-40, -20, 20, 40]) {
          ctx.beginPath();
          ctx.moveTo(-26, 6 - p);
          ctx.lineTo(26, 6 - p);
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = '#ffd400';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 60, cy);
        ctx.lineTo(cx - 20, cy);
        ctx.lineTo(cx - 10, cy + 12);
        ctx.moveTo(cx + 60, cy);
        ctx.lineTo(cx + 20, cy);
        ctx.lineTo(cx + 10, cy + 12);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x0, y0, 44, h);
        ctx.fillRect(x0 + w - 44, y0, 44, h);
        ctx.fillStyle = '#f2f2f2';
        ctx.font = '700 18px Arial, sans-serif';
        ctx.fillText('120', x0 + 4, cy + 6);
        ctx.fillText('1500', x0 + w - 42, cy + 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(x0, y0, w, 30);
        ctx.fillStyle = '#29ff8a';
        ctx.font = '700 18px Arial, sans-serif';
        ctx.fillText('HDG 270   TRQ 62%', x0 + 30, y0 + 21);
      } else if (i === 1) {
        // Moving-map / navigation display
        ctx.fillStyle = '#0b1a10';
        ctx.fillRect(x0, y0, w, h);
        const rnd = mulberry32(9);
        for (let k = 0; k < 18; k++) {
          ctx.strokeStyle = `rgba(${80 + rnd() * 60},${140 + rnd() * 80},${70 + rnd() * 40},0.6)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          let x = x0 + rnd() * w;
          let y = y0 + rnd() * h;
          ctx.moveTo(x, y);
          for (let j = 0; j < 6; j++) {
            x += (rnd() - 0.5) * 80;
            y += (rnd() - 0.5) * 80;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.strokeStyle = '#ff3df2';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x0 + w / 2, y0 + h - 30);
        ctx.lineTo(x0 + w * 0.62, y0 + h * 0.45);
        ctx.lineTo(x0 + w * 0.4, y0 + 30);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x0 + w / 2, y0 + h - 44);
        ctx.lineTo(x0 + w / 2 - 12, y0 + h - 20);
        ctx.lineTo(x0 + w / 2 + 12, y0 + h - 20);
        ctx.fill();
      } else {
        // Engine instruments: torque / TGT / Np-Nr gauges
        ctx.fillStyle = '#060a0f';
        ctx.fillRect(x0, y0, w, h);
        for (let k = 0; k < 4; k++) {
          const gx = x0 + 40 + (k % 2) * (w / 2);
          const gy = y0 + 70 + Math.floor(k / 2) * 140;
          ctx.strokeStyle = '#3a4656';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(gx + 20, gy + 20, 38, Math.PI * 0.8, Math.PI * 2.2);
          ctx.stroke();
          ctx.strokeStyle = k === 1 ? '#ffb000' : '#2cff7a';
          ctx.beginPath();
          ctx.arc(gx + 20, gy + 20, 38, Math.PI * 0.8, Math.PI * (1.3 + k * 0.17));
          ctx.stroke();
          ctx.fillStyle = '#e8eef5';
          ctx.font = '700 17px Arial, sans-serif';
          ctx.fillText(['TRQ', 'TGT', 'NP', 'NR'][k], gx + 6, gy + 26);
        }
      }
      ctx.restore();
      ctx.strokeStyle = '#2a2f36';
      ctx.lineWidth = 6;
      ctx.strokeRect(x0, y0, w, h);
    }
  });
}

function treadTexture() {
  return cachedCanvasTexture('uh60m-tyre-v1', 256, 128, (ctx, W, H) => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0c0c0c';
    for (const v of [0.36, 0.46, 0.54, 0.64]) ctx.fillRect(0, v * H, W, 0.035 * H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0.12 * H, 2, 0.12 * H);
  }, { repeat: [10, 1] });
}

// ============================================================================
// Shared standard materials (instantiated per part inside build(g) — never shared across parts)
// ============================================================================
const paintMat = (opts = {}) => new THREE.MeshStandardMaterial({
  color: opts.color ?? 0xffffff, map: opts.map || null, bumpMap: opts.bump || null, bumpScale: opts.bumpScale ?? 1,
  roughness: opts.roughness ?? 0.82, metalness: opts.metalness ?? 0.0, side: opts.side ?? THREE.FrontSide,
  alphaTest: opts.alphaTest ?? 0, envMapIntensity: opts.env ?? 0.22,
});
const oliveMat = () => paintMat({ color: 0x20241a });
const darkOliveMat = () => paintMat({ color: 0x171a13, roughness: 0.82 });
const metalMat = (color = 0x6a7076, roughness = 0.35, metalness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.8 });
const rubberMat = () => new THREE.MeshStandardMaterial({ color: 0x111213, roughness: 0.88, metalness: 0, envMapIntensity: 0.5 });
const sootMat = () => new THREE.MeshStandardMaterial({ color: 0x171816, roughness: 0.95, metalness: 0.1, envMapIntensity: 0.4 });
const tintGlass = (color = 0x152022, opacity = 0.55) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.05, metalness: 0.0, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: 0.04,
  envMapIntensity: 0.95, side: THREE.DoubleSide,
});
const glowMat = (color, intensity = 1.4) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });

// ============================================================================
// Part builders
// ============================================================================

// ---- 1. Main rotor: 4 swept-tip blades, titanium hub, elastomeric bearings, dampers, swashplate, bifilar ----
function buildMainRotor(g) {
  const f = metreFrame(g);
  // Physical material only to tame the Fresnel sheen (specularIntensity) — the studio IBL is very bright.
  const bladeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: bladeTexture(), roughness: 0.78, metalness: 0.05, envMapIntensity: 0.3, specularIntensity: 0.45,
  });
  const tiMat = metalMat(0x5a6066, 0.36, 0.86);
  const steelMat = metalMat(0xb3bac1, 0.22, 0.92);
  const darkMat = metalMat(0x2d3135, 0.45, 0.7);
  const elastoMat = rubberMat();
  const servoMat = paintMat({ color: 0x282c21, roughness: 0.7 });

  // Mast base on the main transmission; 3 deg forward tilt; spin group carries the rotating system.
  const tilt = new THREE.Group();
  tilt.position.set(...P(4.74, 2.56, 0));
  tilt.rotation.z = -3 * DEG;
  f.add(tilt);
  const spin = new THREE.Group();
  spin.position.set(0, 0.86, 0); // hub centre ~3.42 m above the ground
  spin.userData.driveAnim = 'fan';
  spin.userData.spinAxis = 'y';
  tilt.add(spin);

  // Stationary (non-rotating) controls: lower swashplate ring, 3 hydraulic servos, anti-rotation link
  const fixed = new MeshBatch();
  fixed.add(new THREE.LatheGeometry([[0.17, -0.035], [0.4, -0.035], [0.41, 0.0], [0.4, 0.03], [0.17, 0.03]].map(([r, y]) => new THREE.Vector2(r, y)), 40), darkMat, [0, 0.44, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + Math.PI / 2;
    const x = Math.cos(a) * 0.36;
    const z = Math.sin(a) * 0.36;
    fixed.add(cylBetween([x, 0.06, z], [x, 0.3, z], 0.055, 0.055, 14), servoMat);
    fixed.add(cylBetween([x, 0.3, z], [x, 0.42, z], 0.022, 0.022, 10), steelMat);
  }
  fixed.add(boxBetween([-0.42, 0.14, 0.12], [-0.42, 0.42, 0.12], 0.05, 0.05), darkMat);
  fixed.add(cylBetween([0, -0.1, 0], [0, 0.4, 0], 0.2, 0.2, 24), darkMat); // mast boot / standpipe
  fixed.flush(tilt);

  const b = new MeshBatch();
  // Rotating mast + upper swashplate + scissors drive link
  b.add(cylBetween([0, -0.5, 0], [0, -0.04, 0], 0.15, 0.15, 24), steelMat);
  b.add(new THREE.LatheGeometry([[0.17, -0.025], [0.37, -0.025], [0.375, 0.0], [0.37, 0.025], [0.17, 0.025]].map(([r, y]) => new THREE.Vector2(r, y)), 40), tiMat, [0, -0.36, 0]);
  b.add(boxBetween([0.16, -0.12, 0], [0.3, -0.33, 0], 0.04, 0.03), darkMat);
  // Forged titanium hub: centre drum + 4 arms
  b.add(cylBetween([0, -0.09, 0], [0, 0.09, 0], 0.27, 0.3, 32), tiMat);
  b.add(cylBetween([0, 0.09, 0], [0, 0.13, 0], 0.18, 0.24, 28), tiMat);
  const bladeGeos = [];
  for (let k = 0; k < 4; k++) {
    const psi = k * (Math.PI / 2) + Math.PI / 4;
    const fr = new THREE.Matrix4().makeRotationY(psi); // blade span runs along frame +Z
    // hub arm, elastomeric bearing, spindle / blade cuff
    b.add(place(new THREE.BoxGeometry(0.26, 0.15, 0.34), [0, 0, 0.36], [0, 0, 0], fr), tiMat);
    b.add(place(new THREE.CylinderGeometry(0.12, 0.12, 0.17, 20), [0, 0, 0.52], [Math.PI / 2, 0, 0], fr), elastoMat);
    b.add(place(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 20), [0, 0, 0.43], [Math.PI / 2, 0, 0], fr), tiMat);
    b.add(place(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 20), [0, 0, 0.61], [Math.PI / 2, 0, 0], fr), tiMat);
    b.add(place(new THREE.CylinderGeometry(0.075, 0.11, 0.62, 18), [0, 0, 0.92], [Math.PI / 2, 0, 0], fr), darkMat);
    b.add(place(new THREE.BoxGeometry(0.3, 0.09, 0.26), [-0.03, 0, 1.15], [0, 0, 0], fr), darkMat);
    for (const bx of [-0.09, 0.03]) for (const bz of [1.08, 1.22]) {
      b.add(place(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), [bx, 0, bz], [0, 0, 0], fr), steelMat);
    }
    // hydraulic lead-lag damper (body + chrome rod) from the hub drum to the cuff
    const d0 = new THREE.Vector3(0.24, 0.05, 0.18).applyMatrix4(fr);
    const d1 = new THREE.Vector3(0.17, 0.05, 0.62).applyMatrix4(fr);
    const d2 = new THREE.Vector3(0.12, 0.04, 0.94).applyMatrix4(fr);
    b.add(cylBetween(d0.toArray(), d1.toArray(), 0.05, 0.05, 14), darkMat);
    b.add(cylBetween(d1.toArray(), d2.toArray(), 0.022, 0.022, 10), steelMat);
    // pitch horn + pitch link down to the rotating swashplate
    const h0 = new THREE.Vector3(0.0, -0.02, 0.66).applyMatrix4(fr);
    const h1 = new THREE.Vector3(0.27, -0.06, 0.6).applyMatrix4(fr);
    const l1 = new THREE.Vector3(0.3, -0.36, 0.22).applyMatrix4(fr);
    b.add(boxBetween(h0.toArray(), h1.toArray(), 0.07, 0.05), tiMat);
    b.add(cylBetween(h1.toArray(), l1.toArray(), 0.02, 0.02, 10), steelMat);
    b.add(place(new THREE.SphereGeometry(0.032, 10, 8), h1.toArray()), steelMat);
    b.add(place(new THREE.SphereGeometry(0.032, 10, 8), l1.toArray()), steelMat);
    // droop stop / flap restraint ring tab
    b.add(place(new THREE.BoxGeometry(0.08, 0.06, 0.1), [0, -0.1, 0.3], [0, 0, 0], fr), darkMat);

    // Blade: NACA ~9.5% section, 0.53 m chord, -15 deg twist, 20 deg swept tip, slight static droop
    const R0 = 1.12;
    const R = 8.18;
    const span = R - R0;
    const tipStart = 0.94 * R;
    const chordAt = (sf) => {
      const r = R0 + sf * span;
      if (r < 1.55) return lerp(0.3, 0.53, smooth01((r - R0) / (1.55 - R0)));
      if (r > tipStart) return lerp(0.53, 0.36, (r - tipStart) / (R - tipStart));
      return 0.53;
    };
    const geo = wingLoft({
      span,
      nSpan: 64,
      nChord: 12,
      chord: chordAt,
      le: (sf) => {
        const r = R0 + sf * span;
        const sweep = r > tipStart ? (r - tipStart) * Math.tan(20 * DEG) : 0;
        return 0.25 * chordAt(sf) - sweep;
      },
      thick: (sf) => {
        const r = R0 + sf * span;
        return r < 1.9 ? lerp(0.2, 0.095, smooth01((r - R0) / (1.9 - R0))) : 0.095;
      },
      lift: (sf) => -0.34 * sf * sf,
      twist: (sf) => (7 - 15 * sf) * DEG,
    });
    geo.translate(0, 0, R0);
    geo.applyMatrix4(fr);
    bladeGeos.push(geo);
    // Bifilar absorber arm (between blades) with paired tungsten pendulum weights
    const fb = new THREE.Matrix4().makeRotationY(psi + Math.PI / 4);
    b.add(place(new THREE.BoxGeometry(0.11, 0.06, 0.46), [0, 0.24, 0.3], [0, 0, 0], fb), tiMat);
    b.add(place(new THREE.CylinderGeometry(0.125, 0.125, 0.075, 24), [0, 0.3, 0.55], [0, 0, 0], fb), darkMat);
    b.add(place(new THREE.CylinderGeometry(0.125, 0.125, 0.075, 24), [0, 0.18, 0.55], [0, 0, 0], fb), darkMat);
    b.add(place(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), [0, 0.24, 0.55], [0, 0, 0], fb), steelMat);
  }
  b.add(cylBetween([0, 0.13, 0], [0, 0.27, 0], 0.13, 0.15, 24), tiMat); // bifilar hub post
  b.add(place(new THREE.SphereGeometry(0.13, 20, 10, 0, TAU, 0, Math.PI / 2), [0, 0.27, 0]), tiMat);
  for (const geo of bladeGeos) b.add(geo, bladeMat);
  b.flush(spin);
}

function smooth01(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// ---- 2. Twin T700 engines, HIRSS suppressors, main transmission, APU, oil cooler ----
function buildEngines(g) {
  const f = metreFrame(g);
  const cowlTex = cowlTexture('uh60m-nacelle-cowl-v1', { seamsU: [0.12, 0.34, 0.58, 0.8], seamsV: [0.22, 0.78], sootFrom: 0.86, soot: 0.5, seed: 21 });
  const cowl = paintMat({ map: cowlTex, side: THREE.DoubleSide });
  const inletDark = new THREE.MeshStandardMaterial({ color: 0x0d0f10, roughness: 0.6, metalness: 0.3 });
  const lipMat = metalMat(0x6d7368, 0.4, 0.6);
  const hirssTex = cowlTexture('uh60m-hirss-v1', { base: '#1a1d17', seamsU: [0.2, 0.45, 0.7], seamsV: [0.5], sootFrom: 0.35, soot: 0.85, seed: 8 });
  const hirss = paintMat({ map: hirssTex, roughness: 0.86, side: THREE.DoubleSide });
  const soot = sootMat();
  const gearboxMat = metalMat(0x5d646a, 0.45, 0.7);
  const steel = metalMat(0xa9b0b6, 0.25, 0.9);

  const batch = new MeshBatch();
  for (const side of [1, -1]) {
    const zc = side * 0.64;
    // T700 nacelle loft (open at the intake), slightly boxy cowl
    const st = [
      [4.97, 0.29, 0.29, 0.27], [5.05, 0.33, 0.33, 0.31], [5.35, 0.355, 0.355, 0.33], [6.6, 0.35, 0.35, 0.33],
      [7.05, 0.325, 0.33, 0.3], [7.32, 0.3, 0.31, 0.28],
    ];
    const rings = st.map(([s, hw, top, bot]) => {
      const fn = superellipse({ halfW: hw, top, bot, yc: 2.74, zc, nTop: 2.5, nBot: 2.3 });
      const ring = [];
      for (let k = 0; k < 48; k++) {
        const [z, y] = fn((k / 48) * TAU);
        ring.push([-s, y, z]);
      }
      return ring;
    });
    batch.add(loftRings(rings, { u: st.map(([s]) => (s - 4.97) / 2.35) }), cowl);
    // intake lip, inlet face with swirl frame + centre bullet, FOD screen ring
    batch.add(place(new THREE.TorusGeometry(0.3, 0.035, 10, 40), P(4.99, 2.74, zc), [0, Math.PI / 2, 0]), lipMat);
    batch.add(place(new THREE.CircleGeometry(0.31, 36), P(5.22, 2.74, zc), [0, Math.PI / 2, 0]), inletDark);
    batch.add(place(new THREE.ConeGeometry(0.1, 0.22, 20), P(5.1, 2.74, zc), [0, 0, Math.PI / 2]), lipMat);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      batch.add(place(new THREE.BoxGeometry(0.02, 0.22, 0.018), [-5.17, 2.74 + Math.sin(a) * 0.17, zc + Math.cos(a) * 0.17], [a, 0, 0]), lipMat);
    }
    // HIRSS: long boxy suppressor angled outboard/aft from the nacelle tail
    const A = new THREE.Vector3(...P(7.2, 2.74, side * 0.66));
    const B = new THREE.Vector3(...P(8.85, 2.66, side * 1.2));
    const dir = B.clone().sub(A).normalize();
    const hst = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const c = A.clone().lerp(B, t);
      hst.push({ c: c.toArray(), dir: dir.toArray(), spec: { halfW: lerp(0.2, 0.25, t), top: lerp(0.19, 0.22, t), bot: lerp(0.19, 0.21, t), nTop: 4.2, nBot: 4.2 } });
    }
    batch.add(axisLoft(hst, 40, { u: hst.map((_, i) => i / 6) }), hirss);
    // sooty outlet face + internal baffles (recessed)
    const out = B.clone().addScaledVector(dir, -0.05);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    const eul = new THREE.Euler().setFromQuaternion(q);
    batch.add(place(new THREE.PlaneGeometry(0.46, 0.4), out.toArray(), [eul.x, eul.y, eul.z]), soot);
    for (let i = -1; i <= 1; i++) {
      const c = B.clone().addScaledVector(dir, -0.02);
      c.y += i * 0.11;
      batch.add(place(new THREE.BoxGeometry(0.46, 0.018, 0.06), c.toArray(), [eul.x, eul.y, eul.z]), steel);
    }
    // engine-to-gearbox input module shaft fairing (visible in x-ray / exploded)
    batch.add(cylBetween(P(5.0, 2.62, side * 0.5), P(4.82, 2.42, side * 0.22), 0.09, 0.11, 16), gearboxMat);
  }
  // Main transmission (inside the doghouse): main module, input modules, accessory modules, tail-drive output
  batch.add(new THREE.LatheGeometry([[0.0, 2.08], [0.45, 2.08], [0.5, 2.2], [0.46, 2.42], [0.3, 2.56], [0.2, 2.62], [0, 2.62]].map(([r, y]) => new THREE.Vector2(r, y)), 32), gearboxMat, P(4.78, 0, 0));
  for (const side of [1, -1]) {
    batch.add(cylBetween(P(4.55, 2.3, side * 0.35), P(4.25, 2.3, side * 0.55), 0.15, 0.13, 18), gearboxMat);
    batch.add(cylBetween(P(5.2, 2.24, side * 0.25), P(5.45, 2.3, side * 0.42), 0.13, 0.11, 18), gearboxMat);
  }
  batch.add(cylBetween(P(5.2, 2.3, 0), P(9.4, 2.32, 0), 0.06, 0.06, 12), steel); // tail-rotor drive shaft start
  // APU (T-62T) exhaust stack + oil-cooler inlet scoop behind the mast
  batch.add(cylBetween(P(7.85, 2.86, -0.22), P(8.0, 3.02, -0.3), 0.075, 0.085, 16, true), soot);
  batch.add(place(new THREE.BoxGeometry(0.22, 0.1, 0.46), P(5.38, 2.98, 0), [0, 0, 0.12]), paintMat({ color: 0x1d2118 }));
  batch.add(place(new THREE.PlaneGeometry(0.42, 0.08), P(5.27, 2.985, 0), [0, -Math.PI / 2, 0]), inletDark);
  batch.flush(f);
}

// ---- 3. Airframe: lofted hull (nose, cockpit, cabin, aft fuselage, tail boom) + transmission doghouse ----
function hullStations() {
  const out = [];
  let s = 0;
  while (s < HULL_LEN - 0.03) {
    out.push(s);
    const ds = s < 0.12 ? 0.013 : s < 0.6 ? 0.03 : s < 2.4 ? 0.042 : s < 7.6 ? 0.1 : s < 10 ? 0.12 : 0.16;
    s += ds;
  }
  out.push(HULL_LEN);
  if (!out.some((x) => Math.abs(x - WS.cut) < 1e-6)) {
    out.push(WS.cut - 0.004, WS.cut);
    out.sort((a, b) => a - b);
  }
  return out.filter((x, i, arr) => i === 0 || x - arr[i - 1] > 1e-4);
}

function buildHull(g) {
  const f = metreFrame(g);
  const tex = hullTextures();
  const hullMat = paintMat({ map: tex.color, bump: tex.bump, bumpScale: 1.6, side: THREE.DoubleSide, alphaTest: 0.06 });
  const stations = hullStations();
  const N = 168;
  const rings = stations.map((s) => resampleOutline(hullOutline(s), N).map(([z, h]) => [-s, h, z]));
  const geo = loftRings(rings, { u: stations.map((s) => s / HULL_LEN), capEnd: true });
  addSmoothMesh(f, geo, hullMat);

  // Transmission "doghouse" fairing from the cockpit roof back over the engines into the boom
  const dogTex = cowlTexture('uh60m-doghouse-v1', { seamsU: [0.12, 0.27, 0.42, 0.6, 0.76, 0.88], seamsV: [0.18, 0.82], sootFrom: 0.84, soot: 0.45, grille: [0.7, 0.79, 0.44, 0.56], seed: 41 });
  const dogMat = paintMat({ map: dogTex });
  const dk = [
    [2.55, 2.27, 0.3], [2.9, 2.5, 0.44], [3.3, 2.7, 0.51], [3.8, 2.84, 0.545], [4.4, 2.9, 0.555], [5.2, 2.93, 0.55],
    [6.2, 2.94, 0.52], [7.2, 2.9, 0.48], [8.0, 2.76, 0.42], [8.7, 2.54, 0.35], [9.3, 2.37, 0.29], [9.6, 2.3, 0.24],
  ];
  const dogRings = dk.map(([s, top, hw]) => {
    const fn = superellipse({ halfW: hw, top: top - 2.16, bot: 0.2, yc: 2.16, nTop: 2.7, nBot: 2.0 });
    const ring = [];
    for (let k = 0; k < 64; k++) {
      const [z, y] = fn((k / 64) * TAU);
      ring.push([-s, y, z]);
    }
    return ring;
  });
  addSmoothMesh(f, loftRings(dogRings, { u: dk.map(([s]) => (s - 2.55) / 7.05), capStart: true, capEnd: true }), dogMat);
}

// ---- 4. Cockpit glazing: faceted windshield, side panes, green overhead windows, chin windows, wipers ----
function buildGlazing(g) {
  const f = metreFrame(g);
  const O = openings();
  const glass = tintGlass(0x1c272c, 0.46);
  const green = tintGlass(0x1f4a34, 0.55);
  const sealMat = rubberMat();
  const wiperMat = new THREE.MeshStandardMaterial({ color: 0x0f1011, roughness: 0.5, metalness: 0.4 });
  const batch = new MeshBatch();
  const OFF = 0.006;
  for (const side of [1, -1]) {
    const hintMain = [WS_N_MAIN.x, WS_N_MAIN.y, 0];
    batch.add(polygonGeometry(O.mainPane, (p) => mainPanePoint(p, side, OFF), hintMain), glass);
    batch.add(sealTube(O.mainPane.map((p) => mainPanePoint(p, side, OFF)), 0.014), sealMat);
    const hintSide = [WS.slope, 1, side * WS.k];
    batch.add(polygonGeometry(O.sidePane, (p) => sidePanePoint(p, side, OFF), hintSide), glass);
    batch.add(sealTube(O.sidePane.map((p) => sidePanePoint(p, side, OFF)), 0.012), sealMat);
    batch.add(polygonGeometry(O.overhead, (p) => overheadPoint(p, side, OFF), [0, 1, 0]), green);
    batch.add(sealTube(O.overhead.map((p) => overheadPoint(p, side, OFF)), 0.012), sealMat);
    batch.add(polygonGeometry(O.chin, (p) => sideWinPoint(p, side, OFF), [0, 0, side]), glass);
    batch.add(sealTube(O.chin.map((p) => sideWinPoint(p, side, OFF)), 0.011), sealMat);
    // windshield wiper parked along the lower frame of each main pane
    const zA = 0.2;
    const zB = 0.58;
    const pa = mainPanePoint([sillS(zA) + 0.1, zA], side, 0.025);
    const pb = mainPanePoint([sillS(zB) + 0.1, zB], side, 0.025);
    batch.add(cylBetween(pa, pb, 0.008, 0.008, 6), wiperMat);
    batch.add(boxBetween(pa, pb, 0.02, 0.012, [WS_N_MAIN.x, WS_N_MAIN.y, 0]), wiperMat);
    batch.add(place(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), mainPanePoint([sillS(zB) + 0.05, zB + 0.04], side, 0.02)), wiperMat);
  }
  batch.flush(f);
}

// ---- 5. Flight deck: 4-MFD instrument panel, glare shield, consoles, armored seats, cyclic & collective ----
function buildFlightDeck(g) {
  const f = metreFrame(g);
  const screenTex = mfdTexture();
  const screen = new THREE.MeshStandardMaterial({ color: 0xffffff, map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.85, roughness: 0.25 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.7, metalness: 0.2 });
  const seatArmor = paintMat({ color: 0x252920, roughness: 0.62 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x1d1f1c, roughness: 0.92 });
  const stick = new THREE.MeshStandardMaterial({ color: 0x111213, roughness: 0.5, metalness: 0.3 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.85 });
  const b = new MeshBatch();
  // floor
  b.add(place(new THREE.BoxGeometry(2.3, 0.04, 1.9), P(2.15, 0.78, 0)), floor);
  // instrument panel (tilted back) with 4 MFD bezels, glare shield
  const tilt = -12 * DEG;
  b.add(place(new THREE.BoxGeometry(0.14, 0.5, 1.7), P(1.66, 1.33, 0), [0, 0, tilt]), panel);
  b.add(place(new THREE.BoxGeometry(0.42, 0.05, 1.74), P(1.52, 1.6, 0), [0, 0, -4 * DEG]), panel);
  const scr = new THREE.PlaneGeometry(1.0, 0.26);
  // the 4 displays share one texture strip: map the whole strip onto 4 quads
  for (let i = 0; i < 4; i++) {
    const z = [-0.6, -0.36, 0.36, 0.6][i];
    const quad = new THREE.PlaneGeometry(0.2, 0.25);
    const uv = quad.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 4);
    // panel face normal points aft (+s => -x local)
    b.add(place(quad, P(1.585, 1.35, z), [0, -Math.PI / 2, -tilt * 0]), screen);
    b.add(place(new THREE.BoxGeometry(0.03, 0.29, 0.24), P(1.6, 1.35, z)), panel);
  }
  scr.dispose();
  // centre console with CDUs, overhead console
  b.add(place(new THREE.BoxGeometry(1.0, 0.34, 0.34), P(2.15, 1.0, 0)), panel);
  for (const s of [1.8, 2.15]) {
    const quad = new THREE.PlaneGeometry(0.16, 0.12);
    const uv = quad.attributes.uv;
    for (let k = 0; k < uv.count; k++) {
      uv.setX(k, 0.25 + uv.getX(k) * 0.25);
      uv.setY(k, 0.2 + uv.getY(k) * 0.3);
    }
    b.add(place(quad, P(s, 1.175, 0), [-Math.PI / 2, 0, 0]), screen);
  }
  b.add(place(new THREE.BoxGeometry(0.9, 0.08, 0.22), P(2.45, 2.2, 0)), panel);
  // armored crew seats (pilot right, co-pilot left), cyclics, collectives, pedals
  for (const side of [1, -1]) {
    const z = side * 0.5;
    b.add(place(new THREE.BoxGeometry(0.5, 0.12, 0.5), P(2.55, 1.0, z)), cushion);
    b.add(place(new THREE.BoxGeometry(0.12, 0.85, 0.52), P(2.85, 1.45, z), [0, 0, 10 * DEG]), seatArmor);
    b.add(place(new THREE.BoxGeometry(0.1, 0.7, 0.42), P(2.78, 1.43, z), [0, 0, 10 * DEG]), cushion);
    b.add(place(new THREE.BoxGeometry(0.14, 0.18, 0.28), P(2.92, 1.98, z), [0, 0, 10 * DEG]), cushion);
    for (const w of [-1, 1]) b.add(place(new THREE.BoxGeometry(0.42, 0.6, 0.03), P(2.75, 1.32, z + w * 0.27), [0, 0, 8 * DEG]), seatArmor);
    b.add(place(new THREE.BoxGeometry(0.45, 0.22, 0.4), P(2.6, 0.85, z)), seatArmor);
    b.add(cylBetween(P(2.2, 0.8, z), P(2.25, 1.26, z), 0.018, 0.014, 10), stick);
    b.add(place(new THREE.CylinderGeometry(0.03, 0.026, 0.12, 12), P(2.25, 1.31, z)), stick);
    b.add(cylBetween(P(2.85, 0.92, z - side * 0.33), P(2.42, 1.08, z - side * 0.33), 0.018, 0.018, 10), stick);
    b.add(place(new THREE.BoxGeometry(0.12, 0.06, 0.08), P(2.4, 1.1, z - side * 0.33)), stick);
    for (const w of [-1, 1]) b.add(place(new THREE.BoxGeometry(0.06, 0.16, 0.08), P(1.78, 0.9, z + w * 0.12), [0, 0, 30 * DEG]), panel);
  }
  b.flush(f);
}

// ---- 6/7. Doors: cockpit door, gunner window, sliding cabin door (+ tracks); hoist (stbd) / troop cabin (port) ----
function doorPatch(spec, side, mat) {
  const { s0, s1, h0, h1 } = spec;
  return surfaceGrid((a, t) => {
    const s = lerp(s0, s1, a);
    const h = lerp(h0, h1, t);
    return sidePoint(s, h, side);
  }, { ns: 26, nt: 22, offset: 0.005, outward: [0, 0, side] });
}

function buildDoors(g, side) {
  const f = metreFrame(g);
  const O = openings();
  const cd = O.cockpitDoor;
  const cb = O.cabinDoor;
  const cdTex = doorTexture('uh60m-cockpit-door-v1', cd.outline, [cd.window], cd.s0, cd.s1, cd.h0, cd.h1, { handle: [3.05, 1.2], seed: 3 });
  const cbTex = doorTexture('uh60m-cabin-door-v1', cb.outline, cb.windows, cb.s0, cb.s1, cb.h0, cb.h1, { handle: [4.12, 1.25], track: [[4.08, 2.07], [5.74, 2.07], [4.08, 0.92], [5.74, 0.92]], seed: 4 });
  const cdMat = paintMat({ map: cdTex, side: THREE.DoubleSide, alphaTest: 0.06 });
  const cbMat = paintMat({ map: cbTex, side: THREE.DoubleSide, alphaTest: 0.06 });
  const glass = tintGlass(0x1c272c, 0.5);
  const trackMat = metalMat(0x50565a, 0.4, 0.75);
  const sealMat = rubberMat();
  addSmoothMesh(f, doorPatch(cd, side, cdMat), cdMat);
  addSmoothMesh(f, doorPatch(cb, side, cbMat), cbMat);
  const b = new MeshBatch();
  for (const w of [cd.window, O.gunner, ...cb.windows]) {
    b.add(polygonGeometry(w, (p) => sideWinPoint(p, side, 0.004), [0, 0, side]), glass);
  }
  b.add(sealTube(O.gunner.map((p) => sideWinPoint(p, side, 0.008)), 0.012), sealMat);
  // external sliding-door tracks above and below the cabin door, running aft along the fuselage
  for (const h of [2.17, 0.83]) {
    const pts = [];
    for (let s = 3.98; s <= 7.75; s += 0.25) pts.push(sidePoint(s, h, side, 0.035));
    b.add(pathTube(pts, 0.022, 6, 40), trackMat);
    for (let s = 4.1; s <= 7.6; s += 0.9) b.add(cylBetween(sidePoint(s, h, side, 0.0), sidePoint(s, h, side, 0.04), 0.012, 0.012, 6), trackMat);
  }
  b.flush(f);
  return { f, batch: b };
}

function buildStarboardDoors(g) {
  const { f } = buildDoors(g, 1);
  // External rescue hoist on the roof edge above the starboard cabin door (boom, drum, cable, hook)
  const hoist = new MeshBatch();
  const olive = paintMat({ color: 0x1f231a, roughness: 0.72 });
  const steel = metalMat(0x9aa1a8, 0.3, 0.9);
  const hook = new THREE.MeshStandardMaterial({ color: 0x1a1b1c, roughness: 0.5, metalness: 0.6 });
  const base = topPoint(4.35, 0.88, 0.0);
  const tip = [base[0], base[1] + 0.22, 1.85];
  hoist.add(boxBetween(base, [base[0], base[1] + 0.2, 1.3], 0.16, 0.14), olive);
  hoist.add(boxBetween([base[0], base[1] + 0.2, 1.3], tip, 0.12, 0.12), olive);
  hoist.add(cylBetween([base[0] - 0.22, tip[1] + 0.02, 1.62], [base[0] + 0.22, tip[1] + 0.02, 1.62], 0.11, 0.11, 18), olive);
  hoist.add(cylBetween([tip[0], tip[1] - 0.05, tip[2]], [tip[0], tip[1] - 0.95, tip[2]], 0.006, 0.006, 6), steel);
  hoist.add(place(new THREE.TorusGeometry(0.05, 0.014, 8, 16, Math.PI * 1.5), [tip[0], tip[1] - 1.02, tip[2]], [0, Math.PI / 2, 0]), hook);
  hoist.add(cylBetween([tip[0], tip[1] - 0.92, tip[2]], [tip[0], tip[1] - 0.98, tip[2]], 0.03, 0.03, 10), hook);
  hoist.flush(f);
}

function buildPortDoorsCabin(g) {
  const { f } = buildDoors(g, -1);
  // Crashworthy cabin: floor, forward-facing & aft-facing troop seat rows, gunner seats
  const b = new MeshBatch();
  const floor = new THREE.MeshStandardMaterial({ color: 0x33373b, roughness: 0.9 });
  const frame = metalMat(0x8d949a, 0.35, 0.8);
  const fabric = new THREE.MeshStandardMaterial({ color: 0x5b5f45, roughness: 0.95 });
  b.add(place(new THREE.BoxGeometry(3.85, 0.05, 2.1), P(5.1, 0.88, 0)), floor);
  const seat = (s, z, facing) => {
    // facing +1 = forward, -1 = aft
    b.add(place(new THREE.BoxGeometry(0.42, 0.05, 0.42), P(s, 1.32, z)), fabric);
    b.add(place(new THREE.BoxGeometry(0.05, 0.6, 0.42), P(s + facing * 0.22, 1.62, z)), fabric);
    for (const dz of [-0.2, 0.2]) {
      b.add(cylBetween(P(s - 0.18, 0.9, z + dz), P(s - 0.18, 1.32, z + dz), 0.014, 0.014, 6), frame);
      b.add(cylBetween(P(s + facing * 0.24, 1.32, z + dz), P(s + facing * 0.24, 2.18, z + dz), 0.014, 0.014, 6), frame);
    }
  };
  for (const z of [-0.72, -0.24, 0.24, 0.72]) seat(6.45, z, 1);
  for (const z of [-0.5, 0, 0.5]) seat(3.95, z, -1);
  for (const sd of [1, -1]) {
    b.add(place(new THREE.BoxGeometry(0.42, 0.05, 0.4), P(3.6, 1.3, sd * 0.82)), fabric);
    b.add(place(new THREE.BoxGeometry(0.4, 0.6, 0.05), P(3.6, 1.6, sd * 0.6)), fabric);
  }
  b.flush(f);
}

// ---- 8. Aft pylon: swept vertical pylon, gearbox fairings, parked stabilator, 20-deg canted tail rotor ----
function buildAftPylon(g) {
  const f = metreFrame(g);
  const pylonMat = paintMat({ map: pylonTexture() });
  const stabMat = paintMat({ color: 0x20241a });
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1d1f, roughness: 0.78, metalness: 0.05, envMapIntensity: 0.3, specularIntensity: 0.45 });
  const hubMat = metalMat(0x5b6167, 0.38, 0.85);
  const fairing = paintMat({ color: 0x1f231a });
  const b = new MeshBatch();

  // Pylon: thick swept fin, LE 12.62 -> 14.32 m, root at h = 1.8 (inside the boom), tip h = 3.95
  const root = 1.8;
  const tipH = 3.95;
  const pyl = wingLoft({
    span: tipH - root,
    nSpan: 14,
    nChord: 14,
    chord: (sf) => lerp(1.5, 0.96, sf),
    le: (sf) => -lerp(12.62, 14.3, sf),
    thick: (sf) => lerp(0.3, 0.3, sf),
    capRoot: true,
    capTip: true,
  });
  b.add(place(pyl, [0, root, 0], [-Math.PI / 2, 0, 0]), pylonMat);
  // rounded pylon cap + tail gearbox fairing (starboard bulge) + intermediate gearbox fairing at the bend
  b.add(place(new THREE.SphereGeometry(0.5, 24, 12, 0, TAU, 0, Math.PI / 2), P(14.78, tipH - 0.02, 0), [0, 0, 0], null, [1.0, 0.18, 0.15]), fairing);
  b.add(place(new THREE.SphereGeometry(0.3, 20, 14), P(14.62, 3.5, 0.06), [0, 0, 0], null, [1.05, 0.8, 0.62]), fairing);
  b.add(place(new THREE.SphereGeometry(0.36, 20, 12), P(12.85, 2.2, 0), [0, 0, 0.35], null, [1.4, 0.55, 0.5]), fairing);
  // white position light at the pylon trailing edge
  b.add(place(new THREE.SphereGeometry(0.045, 10, 8), P(15.27, 3.7, 0)), glowMat(0xfff7e0, 1.2));

  // Stabilator: 4.38 m span, swept, parked trailing-edge-down ~38 deg for low-speed flight / ground
  const stab = new THREE.Group();
  stab.position.set(...P(13.92, 1.86, 0));
  stab.rotation.z = 38 * DEG;
  f.add(stab);
  const half = wingLoft({
    span: 2.05, nSpan: 10, nChord: 12,
    chord: (sf) => lerp(1.02, 0.8, sf),
    le: (sf) => 0.25 * 1.02 - 0.42 * sf,
    thick: 0.12,
  });
  half.translate(0, 0, 0.14);
  const sb = new MeshBatch();
  sb.add(half.clone(), stabMat);
  sb.add(mirrorGeoZ(half), stabMat);
  half.dispose();
  sb.add(cylBetween([0, 0, -0.18], [0, 0, 0.18], 0.07, 0.07, 14), hubMat);
  sb.flush(stab);

  // Tail rotor: hub on the starboard side of the pylon, disc canted 20 deg (top toward the pylon)
  const cant = new THREE.Group();
  cant.position.set(...P(14.62, 3.48, 0.22));
  cant.rotation.x = -20 * DEG;
  f.add(cant);
  const tspin = new THREE.Group();
  tspin.position.set(0, 0, 0.16);
  tspin.userData.driveAnim = 'fan';
  tspin.userData.spinAxis = 'z';
  cant.add(tspin);
  const cb = new MeshBatch();
  cb.add(cylBetween([0, 0, -0.18], [0, 0, 0.02], 0.08, 0.08, 16), hubMat); // gearbox output shaft (static)
  cb.flush(cant);
  const tb = new MeshBatch();
  tb.add(cylBetween([0, 0, -0.07], [0, 0, 0.07], 0.12, 0.12, 20), hubMat);
  tb.add(place(new THREE.SphereGeometry(0.1, 16, 8, 0, TAU, 0, Math.PI / 2), [0, 0, 0.07], [Math.PI / 2, 0, 0]), hubMat);
  const tBlade = wingLoft({
    span: 1.675 - 0.2, nSpan: 14, nChord: 10,
    chord: (sf) => lerp(0.26, 0.24, sf), le: (sf) => 0.25 * lerp(0.26, 0.24, sf), thick: 0.12,
    twist: (sf) => (4 - 8 * sf) * DEG,
  });
  tBlade.translate(0, 0, 0.2);
  for (let k = 0; k < 4; k++) {
    const az = k * (Math.PI / 2) + Math.PI / 4;
    // blade span along +Y of the disc, chord LE facing the direction of positive spin about +Z (-X at the top)
    const m = new THREE.Matrix4().makeRotationZ(az)
      .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
      .multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    tb.add(tBlade.clone().applyMatrix4(m), bladeMat);
    // pitch-change housing at the root
    const hp = new THREE.Vector3(0, 0.2, 0).applyMatrix4(new THREE.Matrix4().makeRotationZ(az));
    tb.add(place(new THREE.CylinderGeometry(0.035, 0.045, 0.14, 10), hp.toArray(), [0, 0, az]), hubMat);
  }
  tBlade.dispose();
  tb.flush(tspin);
  b.flush(f);
}

// ---- 9. Fixed landing wheels: drag beams, two-stage oleo struts, main wheels with brakes, swivelling tail wheel ----
function tyreGeometry(R, w, rim) {
  const hw = w / 2;
  const prof = [
    [rim, -hw * 0.8], [rim + (R - rim) * 0.35, -hw * 0.98], [R - (R - rim) * 0.25, -hw], [R - 0.012, -hw * 0.72],
    [R, -hw * 0.3], [R, hw * 0.3], [R - 0.012, hw * 0.72], [R - (R - rim) * 0.25, hw], [rim + (R - rim) * 0.35, hw * 0.98],
    [rim, hw * 0.8],
  ];
  return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36);
}

function buildWheels(g) {
  const f = metreFrame(g);
  const tyre = new THREE.MeshStandardMaterial({ color: 0xffffff, map: treadTexture(), roughness: 0.92, metalness: 0 });
  const hub = paintMat({ color: 0x21251d, roughness: 0.62, metalness: 0.2 });
  const chrome = metalMat(0xd7dde2, 0.12, 0.98);
  const strut = paintMat({ color: 0x1d2119, roughness: 0.66, metalness: 0.15 });
  const dark = metalMat(0x2b2e31, 0.5, 0.6);
  const b = new MeshBatch();
  for (const side of [1, -1]) {
    const ax = [-3.22, 0.33, side * 1.355];
    // tyre (axis along z) + wheel hub & brake
    b.add(place(tyreGeometry(0.33, 0.25, 0.15), ax, [Math.PI / 2, 0, 0]), tyre);
    b.add(place(new THREE.CylinderGeometry(0.155, 0.155, 0.22, 24), ax, [Math.PI / 2, 0, 0]), hub);
    b.add(place(new THREE.CylinderGeometry(0.075, 0.09, 0.05, 16), [ax[0], ax[1], ax[2] + side * 0.125], [Math.PI / 2, 0, 0]), hub);
    b.add(place(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 20), [ax[0], ax[1], ax[2] - side * 0.13], [Math.PI / 2, 0, 0]), dark);
    // drag beam: fuselage pivot (forward, inboard) to the axle
    const piv = P(2.42, 0.58, side * 0.98);
    const axIn = [ax[0], ax[1] + 0.02, side * 1.18];
    b.add(cylBetween(piv, axIn, 0.075, 0.06, 14), strut);
    b.add(place(new THREE.BoxGeometry(0.22, 0.18, 0.16), P(2.42, 0.6, side * 0.97)), strut);
    // two-stage oleo shock strut: outer cylinder up to the fuselage hard point, chrome piston to the beam
    const top = P(3.02, 1.32, side * 1.13);
    const mid = P(3.12, 0.82, side * 1.2);
    const bot = [ax[0] + 0.05, ax[1] + 0.12, side * 1.2];
    b.add(cylBetween(top, mid, 0.07, 0.07, 16), strut);
    b.add(cylBetween(mid, bot, 0.045, 0.045, 14), chrome);
    b.add(place(new THREE.BoxGeometry(0.18, 0.14, 0.1), P(3.0, 1.34, side * 1.12)), strut);
    // torque links
    b.add(boxBetween(mid, [mid[0] + 0.12, mid[1] - 0.2, mid[2]], 0.03, 0.04), dark);
    b.add(boxBetween([mid[0] + 0.12, mid[1] - 0.2, mid[2]], bot, 0.03, 0.04), dark);
  }
  // tail wheel: swivel fork, oleo strut to the boom, drag brace
  const tw = P(12.06, 0.19, 0);
  b.add(place(tyreGeometry(0.19, 0.15, 0.08), tw, [Math.PI / 2, 0, 0]), tyre);
  b.add(place(new THREE.CylinderGeometry(0.085, 0.085, 0.14, 18), tw, [Math.PI / 2, 0, 0]), hub);
  for (const dz of [-0.11, 0.11]) b.add(boxBetween([tw[0], tw[1], dz], P(11.96, 0.5, dz * 0.6), 0.04, 0.05), strut);
  b.add(place(new THREE.BoxGeometry(0.16, 0.06, 0.26), P(11.96, 0.52, 0)), strut);
  b.add(cylBetween(P(11.96, 0.52, 0), P(11.88, 0.98, 0), 0.04, 0.04, 12), chrome);
  b.add(cylBetween(P(11.88, 0.98, 0), P(11.74, 1.66, 0), 0.06, 0.06, 14), strut);
  b.add(cylBetween(P(11.96, 0.6, 0), P(12.55, 1.68, 0), 0.035, 0.035, 10), strut);
  b.flush(f);
}

// ---- 10. ESSS stub wings with two 230-gallon external fuel tanks ----
function buildEsss(g) {
  const f = metreFrame(g);
  const wingMat = paintMat({ color: 0x20241a });
  const tankMat = paintMat({ color: 0x21251c, roughness: 0.72 });
  const dark = metalMat(0x2c3033, 0.5, 0.6);
  const b = new MeshBatch();
  const wing = wingLoft({
    span: 1.72, nSpan: 8, nChord: 10,
    chord: (sf) => lerp(0.66, 0.56, sf), le: (sf) => 0.25 * 0.66 - 0.05 * sf, thick: 0.15,
    lift: (sf) => -Math.tan(8 * DEG) * 1.72 * sf,
  });
  wing.translate(-4.62, 2.14, 1.02);
  b.add(wing.clone(), wingMat);
  b.add(mirrorGeoZ(wing), wingMat);
  wing.dispose();
  const tank = new THREE.LatheGeometry([
    [0, -1.5], [0.12, -1.42], [0.24, -1.15], [0.31, -0.7], [0.32, 0], [0.31, 0.7], [0.25, 1.15], [0.14, 1.42], [0, 1.52],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 28);
  for (const side of [1, -1]) {
    const zt = side * 2.42;
    const hw = 2.14 - Math.tan(8 * DEG) * (2.42 - 1.02);
    // pylon, tank, sway braces, wing support strut to the lower fuselage
    b.add(place(new THREE.BoxGeometry(0.62, 0.3, 0.07), P(4.86, hw - 0.2, zt)), dark);
    b.add(place(tank.clone(), P(4.9, hw - 0.66, zt), [0, 0, Math.PI / 2]), tankMat);
    b.add(place(new THREE.SphereGeometry(0.035, 8, 6), P(3.4, hw - 0.66, zt)), dark);
    b.add(cylBetween(P(4.75, hw - 0.04, side * 2.0), P(4.75, 1.0, side * 1.17), 0.035, 0.035, 10), dark);
    b.add(place(new THREE.BoxGeometry(0.66, 0.08, 0.05), P(4.72, 2.14, side * 1.06)), wingMat);
  }
  tank.dispose();
  b.flush(f);
}

// ---- 11. Sensors & protection: pitot probes, wire-strike cutters, antennas, IR jammer, CMWS, flares, lights ----
function buildSensors(g) {
  const f = metreFrame(g);
  const steel = metalMat(0x6b7178, 0.4, 0.85);
  const cutterMat = metalMat(0x303438, 0.5, 0.7);
  const black = new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.6, metalness: 0.2 });
  const olive = paintMat({ color: 0x171a13, roughness: 0.78 });
  const glassDome = tintGlass(0x101820, 0.75);
  const red = glowMat(0xff2a2a, 1.6);
  const green = glowMat(0x2aff6a, 1.4);
  const b = new MeshBatch();
  // twin pitot-static probes on the cockpit roof, pointing forward above the windshield
  for (const side of [1, -1]) {
    const base = topPoint(1.98, side * 0.34, 0);
    b.add(cylBetween(base, [base[0] + 0.02, base[1] + 0.12, base[2]], 0.018, 0.022, 8), steel);
    b.add(cylBetween([base[0] + 0.02, base[1] + 0.12, base[2]], [base[0] + 0.5, base[1] + 0.12, base[2]], 0.011, 0.011, 8), steel);
    b.add(place(new THREE.ConeGeometry(0.011, 0.06, 8), [base[0] + 0.53, base[1] + 0.12, base[2]], [0, 0, -Math.PI / 2]), steel);
  }
  // wire strike protection: upper cutter on the roof, windshield-post deflector, lower cutter under the nose
  const roof = topPoint(1.86, 0, 0);
  b.add(boxBetween(roof, [roof[0] + 0.32, roof[1] + 0.42, 0], 0.03, 0.09, [1, 0, 0]), cutterMat);
  b.add(boxBetween(mainPanePoint([sillS(0) + 0.02, 0], 1, 0.03), mainPanePoint([roofS(0) - 0.02, 0], 1, 0.03), 0.045, 0.03, [WS_N_MAIN.x, WS_N_MAIN.y, 0]), cutterMat);
  const chinPt = P(0.42, 0.86, 0);
  b.add(boxBetween(chinPt, [chinPt[0] + 0.24, chinPt[1] - 0.36, 0], 0.03, 0.08, [1, 0, 0]), cutterMat);
  // blade antennas (boom top, cabin roof, belly), towel-bar HF antenna on the starboard boom
  for (const [s, h, z, ht] of [[10.6, 2.3, 0, 0.32], [11.7, 2.24, 0, 0.26], [3.2, 2.33, 0.3, 0.22], [9.3, 2.33, 0, 0.2]]) {
    b.add(place(new THREE.BoxGeometry(0.22, ht, 0.03), P(s, h + ht / 2, z), [0, 0, -0.35]), black);
  }
  for (const [s, ht] of [[4.2, 0.24], [6.2, 0.2]]) b.add(place(new THREE.BoxGeometry(0.2, ht, 0.03), P(s, 0.465 - ht / 2, 0), [0, 0, 0.35]), black);
  const bar = [];
  for (let s = 9.9; s <= 12.6; s += 0.3) bar.push(sidePoint(s, PROFILE.yc(s) + 0.22, 1, 0.09));
  b.add(pathTube(bar, 0.013, 5, 30), black);
  for (let s = 10.0; s <= 12.6; s += 0.85) b.add(cylBetween(sidePoint(s, PROFILE.yc(s) + 0.22, 1, 0), sidePoint(s, PROFILE.yc(s) + 0.22, 1, 0.09), 0.01, 0.01, 6), black);
  // AN/ALQ-144 infrared jammer "disco ball" behind the doghouse
  b.add(cylBetween(P(9.05, 2.3, 0), P(9.05, 2.5, 0), 0.11, 0.13, 18), olive);
  b.add(place(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 18), P(9.05, 2.6, 0)), glassDome);
  b.add(place(new THREE.SphereGeometry(0.12, 16, 8, 0, TAU, 0, Math.PI / 2), P(9.05, 2.7, 0)), olive);
  // CMWS missile-warning sensors on the nose cheeks and boom, M130 flare dispensers on the boom
  for (const side of [1, -1]) {
    b.add(place(new THREE.SphereGeometry(0.055, 14, 10), sidePoint(0.62, 1.3, side, 0.01)), glassDome);
    b.add(place(new THREE.SphereGeometry(0.05, 14, 10), sidePoint(10.3, 2.12, side, 0.01)), glassDome);
    const fp = sidePoint(9.65, PROFILE.yc(9.65) - 0.05, side, 0.04);
    b.add(place(new THREE.BoxGeometry(0.36, 0.2, 0.08), fp, [0, 0, 0]), olive);
    // position lights (red port / green starboard) on the upper cabin, anti-collision beacons
    b.add(place(new THREE.SphereGeometry(0.04, 10, 8), topPoint(6.0, side * 1.0, 0.02)), side > 0 ? green : red);
  }
  b.add(place(new THREE.SphereGeometry(0.06, 12, 8, 0, TAU, 0, Math.PI / 2), P(8.35, 2.78, 0)), red);
  b.add(place(new THREE.SphereGeometry(0.06, 12, 8, 0, TAU, Math.PI / 2, Math.PI / 2), P(5.0, 0.465, 0)), red);
  // landing / search light under the cockpit floor
  b.add(place(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 18), P(1.7, 0.5, 0)), glassDome);
  b.flush(f);
}

// ============================================================================
// Model definition
// ============================================================================
export function buildBlackHawkModel() {
  const parts = [
    { id: 'uh60-main-rotor-head', name: 'Main Rotor: 4 Swept-Tip Blades, Titanium Hub & Bifilar Absorber', category: 'Rotor System', isOuter: true, explodeOffset: [0, 1.38, 0],
      desc: 'Four 8-metre composite blades with 20° swept tips bolt to a one-piece forged titanium hub. Rubbery elastomeric bearings let each blade flap, lead-lag and twist; hydraulic dampers calm the lead-lag motion, pitch links ride the swashplate, and the 4-armed bifilar absorber on top swings its heavy weights to cancel vibration.',
      funFact: 'The rotor spins about 258 times a minute. In fast flight the advancing blade tip moves at nearly 90% of the speed of sound, so the tips are swept back to keep the air flowing smoothly!',
      build: buildMainRotor },
    { id: 'uh60-t700-engines-transmission', name: 'Twin GE T700 Turboshafts, HIRSS Exhausts & Main Transmission', category: 'Propulsion', isOuter: false, explodeOffset: [0, 0.86, 0],
      desc: 'Two T700-GE-701D turboshaft engines (about 2,000 horsepower each) sit beside the main transmission. Their built-in particle separators spin sand out of the intake air, and the boxy HIRSS ducts mix cool air into the hot exhaust and aim it away from the helicopter.',
      funFact: 'The main gearbox is built to keep turning the rotor for about 30 minutes even after losing its oil — time for the crew to land safely!',
      build: buildEngines },
    { id: 'uh60-airframe-hull', name: 'Lofted Aluminum Airframe, Blunt Nose, Doghouse & Tail Boom', category: 'Airframe Structure', isOuter: true, explodeOffset: [0, 0.26, 0],
      desc: 'A boxy, crashworthy aluminium and composite fuselage: short avionics nose, flat-sided cabin, the "doghouse" fairing over the main transmission, and a tapering tail boom that carries the tail-rotor drive shaft. Painted lusterless Army "Aircraft Green" so it does not shine in the sun.',
      funFact: 'The Black Hawk was designed to fit inside a C-130 Hercules transport plane (with the rotor blades folded) so it can be flown anywhere in the world!',
      build: buildHull },
    { id: 'uh60-cockpit-glazing', name: 'Faceted Windshield, Upper Side Panes, Green Overhead & Chin Windows', category: 'Canopy & Windows', isOuter: true, explodeOffset: [0.86, 0.66, 0],
      desc: 'Two big sloped windshield panes split by a centre post, angled upper side panes, green-tinted overhead windows for looking up at the rotor, and chin windows by the pilots’ feet for watching the ground while landing. Each main pane has its own wiper.',
      funFact: 'The chin windows let pilots see straight down between their boots — super handy when hovering over a tiny landing spot or a rescue hoist!',
      build: buildGlazing },
    { id: 'uh60-flight-deck', name: 'Glass Cockpit: 4 MFDs, Armored Pilot Seats, Cyclic & Collective', category: 'Cockpit & Avionics', isOuter: false, explodeOffset: [1.32, 0.22, 0],
      desc: 'The UH-60M flight deck has four large colour multifunction displays (flight, map and engine pages), a centre console with keypad computers, and two armored crew seats. Each pilot steers with a cyclic stick, controls lift with the collective lever and points the nose with pedals.',
      funFact: 'The pilot in command usually sits in the RIGHT seat of a Black Hawk — the opposite of most airplanes!',
      build: buildFlightDeck },
    { id: 'uh60-starboard-doors-hoist', name: 'Starboard Crew Door, Gunner Window, Sliding Cabin Door & Rescue Hoist', category: 'Doors & Rescue', isOuter: true, explodeOffset: [0, 0.3, 0.95],
      desc: 'On the right side: the hinged pilot door with its big window, the gunner’s window, and the large sliding cabin door that rolls back on external tracks. Above it, a rescue hoist can winch people up on a steel cable.',
      funFact: 'Both cabin doors slide back, so troops can jump out of either side in seconds — and with both open the cabin feels like a flying porch!',
      build: buildStarboardDoors },
    { id: 'uh60-port-doors-troop-seats', name: 'Port Doors & 11-Seat Crashworthy Troop Cabin', category: 'Doors & Cabin', isOuter: true, explodeOffset: [0, 0.3, -0.95],
      desc: 'The left-side crew door, gunner window and sliding cabin door, plus the cabin itself: a flat floor and crash-absorbing troop seats for up to 11 soldiers (or stretchers for a medical mission).',
      funFact: 'The troop seats are designed to stroke downward in a hard landing, soaking up the jolt so the riders’ backs are protected!',
      build: buildPortDoorsCabin },
    { id: 'uh60-aft-pylon-antitorque', name: 'Swept Pylon, Parked Stabilator & 20° Canted Anti-Torque Rotor', category: 'Anti-Torque & Stability', isOuter: true, explodeOffset: [-0.9, 0.4, 0],
      desc: 'The swept vertical pylon holds the 4-blade, 3.35 m tail rotor on its right side, tilted 20°. A computer moves the big stabilator: it parks steeply trailing-edge-down at low speed and levels out in fast flight.',
      funFact: 'Tilting the tail rotor 20° makes it push the tail sideways AND lift a little — about 2.5% of the helicopter’s total lift comes from the tail rotor!',
      build: buildAftPylon },
    { id: 'uh60-fixed-wheels-struts', name: 'Fixed Main Wheels, Drag Beams, Oleo Struts & Swivel Tail Wheel', category: 'Landing Wheels', isOuter: false, explodeOffset: [0, 0, 0],
      desc: 'The Black Hawk lands on wheels instead of skids. Each main wheel rides on a trailing drag beam with a long two-stage oleo (oil-and-gas) shock strut, and the tail wheel swivels so the helicopter can taxi and turn on the ground.',
      funFact: 'The long-stroke struts are built to squash down and absorb a really hard landing, protecting everyone on board!',
      build: buildWheels },
    { id: 'uh60-esss-stub-wings', name: 'ESSS Stub Wings & Two 230-Gallon External Fuel Tanks', category: 'External Stores & Range', isOuter: true, explodeOffset: [0, 0.6, 0],
      desc: 'The External Stores Support System bolts short wings onto the upper fuselage. Each wing has hard points that can carry big external fuel tanks for long trips.',
      funFact: 'Each external tank holds 230 US gallons of fuel — together they hold more than the helicopter’s own internal tanks!',
      build: buildEsss },
    { id: 'uh60-sensors-antennas', name: 'Pitot Probes, Wire Cutters, Antennas, IR Jammer & Lights', category: 'Sensors & Protection', isOuter: true, explodeOffset: [0.22, 0.56, 0],
      desc: 'Twin pitot probes measure airspeed, saw-toothed wire cutters above and below the cockpit slice through cables, blade antennas and the towel-bar antenna handle radios, and missile-warning sensors, an infrared jammer, flare dispensers and navigation lights keep the crew safe.',
      funFact: 'The wire cutters can snap a steel cable before it tangles in the rotor — a lifesaver when flying low at night!',
      build: buildSensors },
  ];
  return {
    id: 'uh60-black-hawk', name: 'Sikorsky UH-60M Black Hawk', brand: 'Sikorsky / Lockheed Martin',
    badge: '2× ~2,000 shp T700 • 16.4 m 4-Blade Rotor • 11 Subsystems',
    desc: 'The US Army’s famous twin-engine utility helicopter: a 4-blade swept-tip main rotor with a bifilar absorber, two GE T700 turboshafts with HIRSS exhaust suppressors, a faceted windshield and 4-screen glass cockpit, sliding cabin doors, fixed wheels, ESSS external tanks and a 20°-canted tail rotor.',
    cameraPos: [4.4, 1.95, 4.65],
    cameraTarget: [0, -0.05, 0],
    parts,
    quiz: [
      { q: 'Why is the Black Hawk tail rotor tilted 20 degrees?', correctId: 'uh60-aft-pylon-antitorque', distractors: ['uh60-main-rotor-head', 'uh60-fixed-wheels-struts', 'uh60-airframe-hull'] },
      { q: 'Which system has the swashplate, elastomeric bearings and the 4-armed bifilar vibration absorber?', correctId: 'uh60-main-rotor-head', distractors: ['uh60-t700-engines-transmission', 'uh60-esss-stub-wings', 'uh60-sensors-antennas'] },
      { q: 'Which system’s boxy HIRSS ducts cool the exhaust so heat-seeking missiles have a harder time finding the helicopter?', correctId: 'uh60-t700-engines-transmission', distractors: ['uh60-flight-deck', 'uh60-cockpit-glazing', 'uh60-aft-pylon-antitorque'] },
    ],
  };
}
