// Multi-car Japanese & Chinese high-speed trainsets for Inside Out Studio (`train` category).
// Every consist = lead end car + intermediate cars + tail end car, lofted from real cross-sections
// (1 scene unit = 6.5 m) and wrapped in UV-mapped canvas liveries painted in physical coordinates
// (stripe heights, window pitch, doors and logos in metres). Running gear, seats and underfloor
// equipment are merged per material (MeshBatch) so a whole 100 m train stays near 100 draw calls.
//   • shinkansen-n700s — JR Central N700S "Supreme" (Dual Supreme Wing nose, Tokaido blue)
//   • cr400af-fuxing   — China Railway CR400AF "Fuxing Hao" 复兴号 (dragon-head nose, red bands)
//   • scmaglev-l0      — JR Central SCMaglev L0 Series (15 m nose, U-shaped guideway, 603 km/h)
//
// Car-local frame (metres): s = distance from the car's front (nose tip for end cars), y = height
// above the rail head (guideway floor for the maglev), z = right. Local x = -s (forward = +X).
import * as THREE from '../../vendor/three.module.js';
import { mergeGeometries } from '../../vendor/BufferGeometryUtils.js';
import { surfaceGrid, cachedCanvasTexture, MeshBatch, smoothCurve, smoothstep, addSmoothMesh } from '../loft.js';

const MS = 1 / 6.5; // metres -> scene units
const RAIL_Y = -0.4; // rail head / guideway floor (scene y)
const BASE_Y = -0.705; // underside of the viaduct deck: just below the viewer's hidden headlight cones (y≈-0.67)
const DEG = Math.PI / 180;
const TEX_W = 2048;
const TEX_H = 512;
const N_LOW = 16; // lower half-profile segments (belly -> edge)
const N_UP = 30; // upper half-profile segments (edge -> roof centre)

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
function steps(a, b, step) {
  const out = [];
  for (let s = a; s < b - 1e-9; s += step) out.push(s);
  out.push(b);
  return out;
}

// ============================================================================
// Cross-sections: two cubic Béziers joined at the belt / "wing" edge point E
// ============================================================================

function bezPt(c, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
}

/**
 * Right-half section (z >= 0). p = { yBot, zE, yE, yTop, alpha, beta, kU1, kU2, kL1, kL2 } in metres/radians.
 * alpha = upper-surface tangent at E measured from horizontal (90° = smooth vertical side wall),
 * beta = lower-flank tangent tilt from vertical. alpha < 90° or beta > 0 makes E a crisp edge (the N700S "wings").
 */
function sectionCurves(p) {
  const zE = Math.max(0, p.zE);
  const rise = Math.max(1e-6, p.yTop - p.yE);
  const drop = Math.max(1e-6, p.yE - p.yBot);
  const ca = Math.cos(p.alpha);
  const sa = Math.sin(p.alpha);
  const U2 = [p.kU2 * zE, p.yTop];
  let hU = p.kU1 * (rise * sa + zE * ca);
  if (ca > 1e-3) hU = Math.min(hU, (zE - U2[0] - 0.06 * zE) / ca);
  if (sa > 1e-3) hU = Math.min(hU, (0.94 * rise) / sa);
  hU = Math.max(0, hU);
  const U1 = [zE - hU * ca, p.yE + hU * sa];
  const sb = Math.sin(p.beta);
  const cb = Math.cos(p.beta);
  const L1 = [p.kL2 * zE, p.yBot];
  let hL = p.kL1 * drop;
  if (cb > 1e-3) hL = Math.min(hL, (0.94 * drop) / cb);
  if (sb > 1e-3) hL = Math.min(hL, (zE - L1[0] - 0.05 * zE) / sb);
  hL = Math.max(0, hL);
  const L2 = [zE - hL * sb, p.yE - hL * cb];
  return { lower: [[0, p.yBot], L1, L2, [zE, p.yE]], upper: [[zE, p.yE], U1, U2, [0, p.yTop]] };
}

function resampleBezier(c, n) {
  const D = 48;
  const pts = [];
  const cum = [0];
  for (let k = 0; k <= D; k++) pts.push(bezPt(c, k / D));
  for (let k = 1; k <= D; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const L = cum[D];
  const out = [];
  if (L < 1e-9) {
    for (let k = 0; k <= n; k++) out.push([pts[0][0], pts[0][1]]);
    return out;
  }
  let m = 1;
  for (let k = 0; k <= n; k++) {
    const target = (k / n) * L;
    while (m < D && cum[m] < target) m++;
    const seg = cum[m] - cum[m - 1] || 1;
    const t = clamp01((target - cum[m - 1]) / seg);
    out.push([pts[m - 1][0] + (pts[m][0] - pts[m - 1][0]) * t, pts[m - 1][1] + (pts[m][1] - pts[m - 1][1]) * t]);
  }
  return out;
}

/** Half profile from bottom centre (index 0) via the edge E (index N_LOW) to the roof centre. */
function halfProfile(p) {
  const { lower, upper } = sectionCurves(p);
  return resampleBezier(lower, N_LOW).concat(resampleBezier(upper, N_UP).slice(1));
}

/** Skin point on a section: g in [-1, 1] (-1 belly centre, 0 edge E, +1 roof centre) -> [z, y]. */
function sectionPointG(p, g) {
  const { lower, upper } = sectionCurves(p);
  return g < 0 ? bezPt(lower, 1 + Math.max(-1, g)) : bezPt(upper, Math.min(1, g));
}

function scaleSection(p, k) {
  const yc = (p.yTop + p.yBot) / 2;
  return { ...p, zE: p.zE * k, yE: yc + (p.yE - yc) * k, yTop: yc + (p.yTop - yc) * k, yBot: yc + (p.yBot - yc) * k };
}

const capFactor = (s, sCap) => {
  if (s >= sCap) return 1;
  const t = 1 - Math.max(0, s) / sCap;
  return Math.sqrt(Math.max(0, 1 - t * t));
};

/** Compile nose laws (smooth monotone curves through [s, value] knots) into section(s). */
function compileShape(sh) {
  const f = {};
  for (const key of ['top', 'bot', 'yE', 'zE', 'alpha', 'beta', 'kU1', 'kU2', 'kL1', 'kL2']) f[key] = smoothCurve(sh[key]);
  const body = { ...sh.body, alpha: sh.body.alpha * DEG, beta: sh.body.beta * DEG };
  return (s) => {
    if (s >= sh.noseLen) return body;
    const c = capFactor(s, sh.sCap);
    const yT = sh.yTip;
    let top = f.top(s);
    if (sh.bump) top += sh.bump[2] * Math.exp(-(((s - sh.bump[0]) / sh.bump[1]) ** 2));
    return {
      yTop: yT + c * (top - yT),
      yBot: yT - c * (yT - f.bot(s)),
      yE: yT + c * (f.yE(s) - yT),
      zE: c * f.zE(s),
      alpha: f.alpha(s) * DEG,
      beta: f.beta(s) * DEG,
      kU1: f.kU1(s),
      kU2: f.kU2(s),
      kL1: f.kL1(s),
      kL2: f.kL2(s),
    };
  };
}

// ============================================================================
// Lofted shells (two mirrored half-strips -> clean UV seams on the centre line)
// ============================================================================

/**
 * @param {Array<{s:number,p:object}>} stations sorted by s (car-local metres)
 * @param {object} o { len, yMin, yMax, capStart, capEnd, prev, next } (prev/next = ghost stations for normals)
 * UVs: side projection. u = 1 - s/len; right half v = 0.5*h(y), left half v = 1 - 0.5*h(y), so the canvas
 * holds the right-side elevation in its lower half and the left side (rotated 180°) in its upper half.
 */
function shellGeometry(stations, o) {
  // o.crease: duplicate the edge point E so each side gets one-sided normals (a crisp, shaded crease)
  const crease = Boolean(o.crease);
  const profileOf = (p) => {
    const pr = halfProfile(p);
    return crease ? pr.slice(0, N_LOW + 1).concat(pr.slice(N_LOW)) : pr;
  };
  const M = N_LOW + N_UP + 1 + (crease ? 1 : 0);
  const R = stations.length;
  const prof = stations.map((st) => profileOf(st.p));
  const ghostPrev = o.prev ? { s: o.prev.s, pr: profileOf(o.prev.p) } : null;
  const ghostNext = o.next ? { s: o.next.s, pr: profileOf(o.next.p) } : null;
  const len = o.len || 1;
  const yMin = o.yMin ?? 0;
  const yMax = o.yMax ?? 4;
  const hN = (y) => clamp01((y - yMin) / (yMax - yMin));

  const capCount = (o.capStart ? 2 * M - 1 : 0) + (o.capEnd ? 2 * M - 1 : 0);
  const total = 2 * R * M + capCount;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  const idx = [];
  const T = new THREE.Vector3();
  const A = new THREE.Vector3();
  const n = new THREE.Vector3();

  const ringPt = (i, j) => {
    if (i < 0) return ghostPrev ? [-ghostPrev.s, ghostPrev.pr[j][1], ghostPrev.pr[j][0]] : null;
    if (i >= R) return ghostNext ? [-ghostNext.s, ghostNext.pr[j][1], ghostNext.pr[j][0]] : null;
    return [-stations[i].s, prof[i][j][1], prof[i][j][0]];
  };

  for (let i = 0; i < R; i++) {
    const s = stations[i].s;
    const u = 1 - s / len;
    for (let j = 0; j < M; j++) {
      const q = prof[i][j];
      const qa = j + 1 < M ? prof[i][j + 1] : [-prof[i][M - 2][0], prof[i][M - 2][1]];
      const qb = j - 1 >= 0 ? prof[i][j - 1] : [-prof[i][1][0], prof[i][1][1]];
      T.set(0, qa[1] - qb[1], qa[0] - qb[0]);
      const pa = ringPt(i + 1, j) || ringPt(i, j);
      const pb = ringPt(i - 1, j) || ringPt(i, j);
      A.set(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
      n.crossVectors(T, A);
      if (n.lengthSq() < 1e-14) n.set(i === 0 ? 1 : -1, 0, 0);
      n.normalize();
      const kR = i * M + j;
      const kL = R * M + kR;
      pos.set([-s, q[1], q[0]], kR * 3);
      pos.set([-s, q[1], -q[0]], kL * 3);
      nor.set([n.x, n.y, n.z], kR * 3);
      nor.set([n.x, n.y, -n.z], kL * 3);
      const h = hN(q[1]);
      uv.set([u, 0.5 * h], kR * 2);
      uv.set([u, 1 - 0.5 * h], kL * 2);
    }
  }
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < M - 1; j++) {
      if (crease && j === N_LOW) continue; // zero-area strip between the two copies of E
      const a = i * M + j;
      const b = (i + 1) * M + j;
      const c = (i + 1) * M + j + 1;
      const d = i * M + j + 1;
      idx.push(a, d, c, a, c, b);
      const o2 = R * M;
      idx.push(o2 + a, o2 + c, o2 + d, o2 + a, o2 + b, o2 + c);
    }
  }
  let cursor = 2 * R * M;
  const addCap = (i, outward) => {
    const s = stations[i].s;
    const pr = prof[i];
    const outline = [];
    for (let j = 0; j < M; j++) outline.push([pr[j][0], pr[j][1]]);
    for (let j = M - 2; j >= 1; j--) outline.push([-pr[j][0], pr[j][1]]);
    let cy = 0;
    for (const p of outline) cy += p[1];
    cy /= outline.length;
    const c0 = cursor;
    pos.set([-s, cy, 0], c0 * 3);
    nor.set([outward, 0, 0], c0 * 3);
    uv.set([1 - s / len, 0.5], c0 * 2);
    cursor++;
    const start = cursor;
    for (const p of outline) {
      pos.set([-s, p[1], p[0]], cursor * 3);
      nor.set([outward, 0, 0], cursor * 3);
      uv.set([1 - s / len, 0.5], cursor * 2);
      cursor++;
    }
    const K = outline.length;
    for (let k = 0; k < K; k++) {
      const a = start + k;
      const b = start + ((k + 1) % K);
      // Outline runs belly -> right side -> roof -> left side, i.e. CCW seen from behind (-X).
      if (outward < 0) idx.push(c0, a, b);
      else idx.push(c0, b, a);
    }
  };
  if (o.capStart) addCap(0, 1);
  if (o.capEnd) addCap(R - 1, -1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, cursor * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, cursor * 3), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv.subarray(0, cursor * 2), 2));
  geo.setIndex(idx);
  return geo;
}

// ============================================================================
// Consist layout & transforms
// ============================================================================

function layoutTrain(cfg) {
  const kinds = ['lead', ...Array(cfg.midCars).fill('mid'), 'tail'];
  const cars = [];
  let xFront = cfg.xTip;
  kinds.forEach((kind, idx) => {
    const L = kind === 'mid' ? cfg.midLen : cfg.endLen;
    const xRear = xFront - L * MS;
    const flip = kind === 'tail';
    cars.push({ kind, idx, L, xFront, xRear, flip, x0: flip ? xRear : xFront, end: kind !== 'mid' });
    xFront = xRear;
  });
  return cars;
}

/** Car-local metres -> scene coordinates. */
function toScene(car, s, y, z) {
  return [car.x0 + (car.flip ? s : -s) * MS, RAIL_Y + y * MS, (car.flip ? -z : z) * MS];
}

function carMatrix(car) {
  const m = new THREE.Matrix4().makeScale(MS, MS, MS);
  if (car.flip) m.premultiply(new THREE.Matrix4().makeRotationY(Math.PI));
  m.premultiply(new THREE.Matrix4().makeTranslation(car.x0, RAIL_Y, 0));
  return m;
}

const sectionFor = (cfg, car, s) => (car.end ? cfg.section(s) : cfg.section(1e6));

function skinPoint(cfg, car, s, g, side) {
  const [z, y] = sectionPointG(sectionFor(cfg, car, s), g);
  return toScene(car, s, y, side * z);
}

const outwardHint = (cfg) => (p) => [0, p[1] - (RAIL_Y + cfg.axisY * MS), p[2]];

/** Station list for an end car between sFrom and sTo (nose rings dense near the tip & the skirt step). */
function endStations(cfg, sFrom, sTo) {
  const Ln = cfg.shape.noseLen;
  const set = new Set();
  const K = cfg.noseRings ?? 84;
  for (let k = 0; k <= K; k++) set.add(+(Ln * (k / K) ** 1.6).toFixed(4));
  for (const [a, b, st] of cfg.denseZones || []) for (const s of steps(a, b, st)) set.add(+s.toFixed(4));
  set.add(Ln);
  set.add(sTo);
  return [...set].filter((s) => s >= sFrom - 1e-9 && s <= sTo + 1e-9).sort((a, b) => a - b).map((s) => ({ s, p: cfg.section(s) }));
}

// ============================================================================
// Livery canvas painting in physical coordinates
// ============================================================================

function bandView(w, hb, len, side, yMin, yMax) {
  const sx = w / len;
  const sy = hb / (yMax - yMin);
  return { w, h: hb, len, side, sx, sy, X: (s) => (side === 'R' ? len - s : s) * sx, Y: (y) => (yMax - y) * sy };
}

function fillRectM(ctx, V, s0, s1, y0, y1) {
  const xa = V.X(s0);
  const xb = V.X(s1);
  ctx.fillRect(Math.min(xa, xb), V.Y(y1), Math.abs(xb - xa), V.Y(y0) - V.Y(y1));
}

function roundRectM(ctx, V, s0, s1, y0, y1, r) {
  const xa = V.X(s0);
  const xb = V.X(s1);
  ctx.beginPath();
  ctx.roundRect(Math.min(xa, xb), V.Y(y1), Math.abs(xb - xa), V.Y(y0) - V.Y(y1), Math.max(0, r * Math.min(V.sx, V.sy)));
}

function bandPath(ctx, V, sList, topFn, botFn) {
  ctx.beginPath();
  sList.forEach((s, i) => (i ? ctx.lineTo(V.X(s), V.Y(topFn(s))) : ctx.moveTo(V.X(s), V.Y(topFn(s)))));
  for (let i = sList.length - 1; i >= 0; i--) ctx.lineTo(V.X(sList[i]), V.Y(botFn(sList[i])));
  ctx.closePath();
}

const fontPx = (font, h, V) => font.replace('{px}', `${Math.max(4, Math.round(h * V.sy))}px`);

/**
 * Text runs laid out left -> right *as the viewer sees that side*, centred on car-local s, baseline at y (m),
 * so logos such as "N700S" read correctly on both sides of the train.
 */
function textRun(ctx, V, s, y, runs) {
  ctx.save();
  ctx.translate(V.X(s), V.Y(y));
  ctx.scale(V.sx / V.sy, 1);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const widths = runs.map((r) => {
    ctx.font = fontPx(r.font, r.h, V);
    return ctx.measureText(r.t).width + (r.gap ?? 0) * V.sy;
  });
  let x = -widths.reduce((a, b) => a + b, 0) / 2;
  runs.forEach((r, i) => {
    ctx.save();
    ctx.font = fontPx(r.font, r.h, V);
    ctx.translate(x, -(r.dy ?? 0) * V.sy);
    if (r.skew) ctx.transform(1, 0, -r.skew, 1, 0, 0);
    if (r.stroke) {
      ctx.lineWidth = r.strokeW ?? 2;
      ctx.strokeStyle = r.stroke;
      ctx.strokeText(r.t, 0, 0);
    }
    ctx.fillStyle = r.color;
    ctx.fillText(r.t, 0, 0);
    ctx.restore();
    x += widths[i];
  });
  ctx.restore();
}

function paintWindow(ctx, V, s0, s1, y0, y1, r, frit = 0.035, glassTop = '#3d4d60') {
  ctx.fillStyle = '#0b0f15';
  roundRectM(ctx, V, s0 - frit, s1 + frit, y0 - frit, y1 + frit, r + frit);
  ctx.fill();
  const g = ctx.createLinearGradient(0, V.Y(y1), 0, V.Y(y0));
  g.addColorStop(0, glassTop);
  g.addColorStop(0.42, '#1c2632');
  g.addColorStop(1, '#10161e');
  ctx.fillStyle = g;
  roundRectM(ctx, V, s0, s1, y0, y1, r);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,215,240,0.10)';
  roundRectM(ctx, V, s0 + (s1 - s0) * 0.08, s0 + (s1 - s0) * 0.5, y1 - (y1 - y0) * 0.42, y1 - (y1 - y0) * 0.08, r * 0.6);
  ctx.fill();
}

function paintDoor(ctx, V, s0, s1, y0, y1, win) {
  ctx.strokeStyle = 'rgba(72,82,96,0.9)';
  ctx.lineWidth = Math.max(1.6, 0.018 * V.sx);
  roundRectM(ctx, V, s0, s1, y0, y1, 0.06);
  ctx.stroke();
  if (win) paintWindow(ctx, V, s0 + win.inset, s1 - win.inset, win.y0, win.y1, 0.07, 0.025);
  ctx.fillStyle = 'rgba(80,90,104,0.55)';
  const hs = V.side === 'R' ? [s0 + (s1 - s0) * 0.14, s0 + (s1 - s0) * 0.22] : [s0 + (s1 - s0) * 0.78, s0 + (s1 - s0) * 0.86];
  fillRectM(ctx, V, hs[0], hs[1], y0 + (y1 - y0) * 0.45, y0 + (y1 - y0) * 0.5);
}

function paintDisplay(ctx, V, s0, s1, y0, y1, color, label) {
  ctx.fillStyle = '#0c0f14';
  roundRectM(ctx, V, s0, s1, y0, y1, 0.02);
  ctx.fill();
  if (label) textRun(ctx, V, (s0 + s1) / 2, y0 + (y1 - y0) * 0.22, [{ t: label, h: (y1 - y0) * 0.62, font: `700 {px} ${CJK}`, color }]);
}

function liveryTexture(cfg, kind) {
  const len = kind === 'mid' ? cfg.midLen : cfg.endLen;
  return cachedCanvasTexture(
    `${cfg.id}:livery:${kind}:v5`,
    TEX_W,
    TEX_H,
    (ctx, w, h) => {
      const hb = h / 2;
      for (const side of ['R', 'L']) {
        ctx.save();
        if (side === 'R') ctx.translate(0, hb);
        else {
          ctx.translate(w, hb);
          ctx.rotate(Math.PI);
        }
        ctx.beginPath();
        ctx.rect(0, 0, w, hb);
        ctx.clip();
        cfg.paint(ctx, bandView(w, hb, len, side, cfg.tex.yMin, cfg.tex.yMax), kind, cfg);
        ctx.restore();
      }
    },
    { anisotropy: 8 },
  );
}

// ============================================================================
// Materials (always created inside build(g) — highlight / x-ray mutate them per part)
// ============================================================================

const paintMat = (map) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, roughness: 0.3, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.12 });
const whitePaint = (color = 0xf3f5f8) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.12 });
const glassDark = () => new THREE.MeshPhysicalMaterial({ color: 0x0a0f17, roughness: 0.05, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 });
const fritMat = () => new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: 0.55, metalness: 0.1 });
const metal = (color, rough = 0.35, metalness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness });
const matte = (color, rough = 0.8, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness });
const lampMat = (color, intensity) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.15, metalness: 0.1 });

// ============================================================================
// Shared component builders (scene units)
// ============================================================================

/** Glass / frit / lamp patch on the skin. gRange(a) -> [gLow, gHigh] along the patch (a = 0..1 over s0..s1). */
function skinPatch(cfg, car, s0, s1, gRange, opts = {}) {
  const both = opts.span === 'both';
  const side = opts.side ?? 1;
  return surfaceGrid(
    (a, b) => {
      const s = s0 + (s1 - s0) * a;
      const [gLo, gHi] = gRange(a);
      if (both) {
        const w = b * 2 - 1; // -1 left .. +1 right across the roof centre
        const g = gHi - (gHi - gLo) * Math.abs(w);
        return skinPoint(cfg, car, s, g, w < 0 ? -1 : 1);
      }
      return skinPoint(cfg, car, s, gLo + (gHi - gLo) * b, side);
    },
    { ns: opts.ns ?? 18, nt: opts.nt ?? 16, offset: opts.offset ?? 0.0015, outward: outwardHint(cfg) },
  );
}

function wheelLathe() {
  // [radius, axial] metres; flange on the inboard side (negative axial)
  const prof = [
    [0.1, -0.085], [0.17, -0.085], [0.19, -0.03], [0.33, -0.022], [0.355, -0.068], [0.405, -0.072],
    [0.46, -0.072], [0.466, -0.058], [0.437, -0.04], [0.43, 0.0], [0.424, 0.062], [0.375, 0.066],
    [0.352, 0.024], [0.19, 0.024], [0.17, 0.085], [0.1, 0.085], [0.1, -0.085],
  ];
  return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * MS, y * MS)), 28);
}

function helixGeometry(r, h, turns, wire, segs = 44) {
  const pts = [];
  for (let k = 0; k <= segs; k++) {
    const t = k / segs;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * h - h / 2, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, wire, 5, false);
}

/** Rail-wheel bogie (bolsterless, air springs, yaw dampers, coil primary springs) at scene x = cx. */
function addRailBogie(B, M, cx) {
  const P = (dx, y, z) => [cx + dx * MS, RAIL_Y + y * MS, z * MS];
  const fw = 1.02;
  for (const side of [-1, 1]) {
    const z = side * fw;
    B.rbox(1.3 * MS, 0.3 * MS, 0.24 * MS, 0.04 * MS, M.frame, P(0, 0.7, z));
    for (const e of [-1, 1]) {
      B.rbox(0.98 * MS, 0.22 * MS, 0.22 * MS, 0.04 * MS, M.frame, P(e * 1.12, 0.8, z));
      B.rbox(0.4 * MS, 0.26 * MS, 0.2 * MS, 0.03 * MS, M.frame, P(e * 0.66, 0.75, z), [0, 0, e * -0.35]);
      // axle box + front cover + coil-spring pair
      B.rbox(0.38 * MS, 0.3 * MS, 0.26 * MS, 0.05 * MS, M.box, P(e * 1.25, 0.43, side * 1.06));
      B.cyl(0.11 * MS, 0.11 * MS, 0.06 * MS, 14, M.box, P(e * 1.25, 0.43, side * 1.21), [Math.PI / 2, 0, 0]);
      for (const k of [-1, 1]) B.add(helixGeometry(0.075 * MS, 0.16 * MS, 4.5, 0.016 * MS), M.spring, P(e * 1.25 + k * 0.16, 0.64, side * 1.06));
    }
    // secondary air spring (rubber bellows) carrying the body
    B.cyl(0.3 * MS, 0.31 * MS, 0.16 * MS, 22, M.rubber, P(0, 0.93, z));
    B.cyl(0.33 * MS, 0.33 * MS, 0.03 * MS, 22, M.frame, P(0, 1.02, z));
    // yaw damper (body <-> frame) along the outside
    B.cyl(0.055 * MS, 0.055 * MS, 0.78 * MS, 10, M.damper, P(0.32, 0.86, side * 1.3), [0, 0, Math.PI / 2]);
    B.cyl(0.025 * MS, 0.025 * MS, 0.5 * MS, 8, M.rod, P(0.95, 0.86, side * 1.3), [0, 0, Math.PI / 2]);
    B.rbox(0.18 * MS, 0.18 * MS, 0.12 * MS, 0.02 * MS, M.frame, P(-0.32, 0.86, side * 1.22));
  }
  for (const e of [-1, 1]) B.cyl(0.11 * MS, 0.11 * MS, 2.04 * MS, 14, M.frame, P(e * 0.32, 0.64, 0), [Math.PI / 2, 0, 0]);
  B.cyl(0.03 * MS, 0.03 * MS, 2.3 * MS, 8, M.rod, P(-0.55, 0.9, 0), [Math.PI / 2, 0, 0]);
}

/** One rolling wheelset group (driveRole 'wheel') at scene x = cx. */
function addWheelset(g, cx, M) {
  const ws = new THREE.Group();
  ws.position.set(cx, RAIL_Y + 0.43 * MS, 0);
  ws.userData.driveRole = 'wheel';
  g.add(ws);
  const B = new MeshBatch();
  B.cyl(0.085 * MS, 0.085 * MS, 2.2 * MS, 14, M.wheel, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    // Lathe axis Y -> ±Z (rotX ±90°) so both flanges face inboard without a mirroring (winding-flipping) scale.
    B.add(wheelLathe(), M.wheel, [0, 0, side * 0.75 * MS], [(side * Math.PI) / 2, 0, 0]);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      B.cyl(0.022 * MS, 0.022 * MS, 0.03 * MS, 6, M.wheel, [Math.cos(a) * 0.14 * MS, Math.sin(a) * 0.14 * MS, side * 0.84 * MS], [Math.PI / 2, 0, 0]);
    }
    B.box(0.05 * MS, 0.16 * MS, 0.02 * MS, M.wheel, [0.26 * MS, 0, side * 0.778 * MS]);
  }
  B.flush(ws);
  return ws;
}

/** Single-arm pantograph on a roof; returns the controller group with userData.setLift(t) (0 = folded, 1 = at wire). */
function addPantograph(g, B, M, base, o) {
  const P = (dx, dy, dz) => [base[0] + dx * MS, base[1] + dy * MS, dz * MS];
  for (const dx of [0.15, -1.15]) {
    for (const dz of [-0.42, 0.42]) {
      B.cyl(0.06 * MS, 0.075 * MS, o.insH * MS, 10, M.insulator, P(dx, o.insH / 2, dz));
      for (let r = 0; r < 4; r++) B.cyl(0.095 * MS, 0.095 * MS, 0.02 * MS, 10, M.insulator, P(dx, 0.06 + (r * (o.insH - 0.1)) / 3, dz));
    }
  }
  const fy = o.insH + 0.03;
  B.box(1.5 * MS, 0.06 * MS, 0.07 * MS, M.arm, P(-0.5, fy, 0.42));
  B.box(1.5 * MS, 0.06 * MS, 0.07 * MS, M.arm, P(-0.5, fy, -0.42));
  B.box(0.08 * MS, 0.06 * MS, 0.9 * MS, M.arm, P(0.15, fy, 0));
  B.box(0.08 * MS, 0.06 * MS, 0.9 * MS, M.arm, P(-1.15, fy, 0));
  B.cyl(0.07 * MS, 0.07 * MS, 0.5 * MS, 10, M.arm, P(-0.75, fy + 0.08, 0), [0, 0, Math.PI / 2]);

  const ctl = new THREE.Group();
  ctl.name = 'pantograph';
  g.add(ctl);
  const hinge = new THREE.Vector3(base[0] + 0.15 * MS, base[1] + (fy + 0.08) * MS, 0);
  const L1 = 1.62;
  const L2 = 1.7;
  const lower = new THREE.Group();
  const upper = new THREE.Group();
  const head = new THREE.Group();
  ctl.add(lower, upper, head);
  const lb = new MeshBatch();
  lb.cyl(0.05 * MS, 0.085 * MS, L1 * MS, 10, M.arm, [L1 * MS * 0.5, 0, 0], [0, 0, Math.PI / 2]);
  lb.cyl(0.11 * MS, 0.11 * MS, 0.5 * MS, 12, M.arm, [0, 0, 0], [Math.PI / 2, 0, 0]);
  lb.cyl(0.018 * MS, 0.018 * MS, L1 * MS * 0.95, 6, M.arm, [L1 * MS * 0.5, -0.09 * MS, 0.06 * MS], [0, 0, Math.PI / 2]);
  lb.flush(lower);
  const ub = new MeshBatch();
  for (const dz of [-1, 1]) {
    ub.tube([[0, 0, 0], [L2 * 0.55, 0.02, dz * 0.1], [L2, 0, dz * 0.24]].map(([x, y, z]) => [x * MS, y * MS, z * MS]), 0.026 * MS, M.arm, 12, 6);
  }
  ub.sphere(0.06 * MS, 10, 8, M.arm, [0, 0, 0]);
  ub.flush(upper);
  const hb = new MeshBatch();
  hb.box(0.22 * MS, 0.05 * MS, 1.36 * MS, M.arm, [0, -0.06 * MS, 0]);
  hb.box(0.1 * MS, 0.05 * MS, 1.3 * MS, M.carbon, [0.05 * MS, 0, 0]);
  hb.box(0.1 * MS, 0.05 * MS, 1.3 * MS, M.carbon, [-0.07 * MS, 0, 0]);
  for (const dz of [-1, 1]) {
    hb.tube([[0, 0, dz * 0.65], [0, -0.04, dz * 0.82], [0, -0.16, dz * 0.92]].map(([x, y, z]) => [x * MS, y * MS, z * MS]), 0.022 * MS, M.arm, 10, 6);
    hb.cyl(0.03 * MS, 0.03 * MS, 0.12 * MS, 8, M.arm, [0, -0.12 * MS, dz * 0.24 * MS]);
  }
  hb.flush(head);

  const hMin = 0.3;
  const hMax = o.wireY - (base[1] - RAIL_Y) / MS - (fy + 0.08) - 0.06; // carbon strip touches the wire at t = 1
  ctl.userData.setLift = (t) => {
    const H = lerp(hMin, hMax, clamp01(t));
    const dxh = 0.04;
    const d = Math.max(1e-4, Math.hypot(dxh, H));
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const ux = dxh / d;
    const uy = H / d;
    let kx = a * ux - hh * uy; // knee behind the hinge (-x)
    let ky = a * uy + hh * ux;
    if (kx > 0) {
      kx = a * ux + hh * uy;
      ky = a * uy - hh * ux;
    }
    lower.position.copy(hinge);
    lower.rotation.set(0, 0, Math.atan2(ky, kx));
    upper.position.set(hinge.x + kx * MS, hinge.y + ky * MS, 0);
    upper.rotation.set(0, 0, Math.atan2(H - ky, dxh - kx));
    head.position.set(hinge.x + dxh * MS, hinge.y + H * MS + 0.03 * MS, 0);
  };
  ctl.userData.head = head;
  ctl.userData.restLift = o.rest ?? 1;
  ctl.userData.setLift(ctl.userData.restLift);
  return ctl;
}

/** Prism along X from a [z, y] profile in metres (rails, guideway walls). */
function prismX(profile, x0, x1) {
  const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(z * MS, y * MS)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, steps: 1 });
  geo.rotateY(-Math.PI / 2); // extrusion +Z -> -X (a rotation, so winding is preserved)
  geo.translate(x1, RAIL_Y, 0);
  return geo;
}

const RAIL_PROFILE = [
  [-0.0725, -0.174], [0.0725, -0.174], [0.0725, -0.162], [0.012, -0.14], [0.0085, -0.12], [0.0085, -0.05],
  [0.032, -0.038], [0.0325, -0.01], [0.028, 0], [-0.028, 0], [-0.0325, -0.01], [-0.032, -0.038], [-0.0085, -0.05],
  [-0.0085, -0.12], [-0.012, -0.14], [-0.0725, -0.162],
];

// ============================================================================
// Trainset factory
// ============================================================================

function buildTrainset(cfg) {
  cfg.section = compileShape(cfg.shape);
  const cars = layoutTrain(cfg);
  const lead = cars[0];
  const tail = cars[cars.length - 1];
  const g2 = cfg.gap / 2;
  const isMaglev = cfg.kind === 'maglev';
  const bodyP = cfg.section(1e6);
  const T = cfg.text;
  const xMin = tail.xRear;
  const xMax = lead.xFront;
  const Ln = cfg.shape.noseLen;

  const bogieS = (car) => {
    const first = car.end ? cfg.frontBogie : cfg.bogieOverhang;
    return [first, first + cfg.bogieSpacing];
  };
  const bogieCentres = (car) => (isMaglev ? [] : bogieS(car).map((s) => toScene(car, s, 0, 0)[0]));
  const poweredCar = (car) => (cfg.poweredEnds ? true : !car.end);
  // SCMaglev: one bogie under each end car's nose root plus articulated bogies under every car joint
  const maglevBogies = () => {
    const xs = [toScene(lead, cfg.frontBogie, 0, 0)[0]];
    for (let i = 0; i < cars.length - 1; i++) xs.push(cars[i].xRear);
    xs.push(toScene(tail, cfg.frontBogie, 0, 0)[0]);
    return xs;
  };

  function shellFor(car, sFrom, sTo, caps) {
    const stations = car.end ? endStations(cfg, sFrom, sTo) : [sFrom, sTo].map((s) => ({ s, p: bodyP }));
    const geo = shellGeometry(stations, {
      len: car.L, yMin: cfg.tex.yMin, yMax: cfg.tex.yMax, capStart: caps.start, capEnd: caps.end, prev: caps.prev, next: caps.next,
      crease: Boolean(cfg.crease && car.end),
    });
    geo.applyMatrix4(carMatrix(car));
    return geo;
  }

  function addCabGlass(g, car, mats) {
    const W = cfg.windshield;
    const sAt = (a, s0, s1) => s0 + (s1 - s0) * a;
    const f0 = W.s0 - W.frit;
    const f1 = W.s1 + W.frit * 0.7;
    addSmoothMesh(g, skinPatch(cfg, car, f0, f1, (a) => {
      const s = sAt(a, f0, f1);
      const lead0 = clamp01((s - f0) / W.frit);
      return [Math.max(-0.25, W.gLow(Math.max(W.s0, s)) - W.fritG * (0.35 + 0.65 * lead0)), 1];
    }, { span: 'both', ns: 30, nt: 36, offset: 0.0011 }), mats.frit);
    addSmoothMesh(g, skinPatch(cfg, car, W.s0, W.s1, (a) => [W.gLow(sAt(a, W.s0, W.s1)), 1], { span: 'both', ns: 30, nt: 36, offset: 0.0022 }), mats.glass);
    for (const sw of W.side || []) {
      for (const side of [-1, 1]) {
        const rng = (a, pad) => {
          const e = Math.sin(Math.PI * a) ** 0.3;
          const mid = (sw.g0 + sw.g1) / 2;
          const half = ((sw.g1 - sw.g0) / 2) * e + pad;
          return [mid - half, mid + half];
        };
        addSmoothMesh(g, skinPatch(cfg, car, sw.s0 - 0.06, sw.s1 + 0.06, (a) => rng(a, 0.025), { side, ns: 10, nt: 6, offset: 0.0011 }), mats.frit);
        addSmoothMesh(g, skinPatch(cfg, car, sw.s0, sw.s1, (a) => rng(a, 0), { side, ns: 10, nt: 6, offset: 0.0022 }), mats.glass);
      }
    }
  }

  function addLamps(g, car, headMat, tailMat, trimMat) {
    for (const side of [-1, 1]) {
      for (const [lamp, m] of [[cfg.headlight, headMat], [cfg.taillight, tailMat]]) {
        if (!lamp) continue;
        const rng = (a, pad) => {
          const e = Math.sin(Math.PI * clamp01(a)) ** (lamp.round ?? 0.45);
          const mid = (lamp.g0 + lamp.g1) / 2 + (lamp.tilt ?? 0) * (a - 0.5);
          const half = ((lamp.g1 - lamp.g0) / 2) * Math.max(0.12, e) + pad;
          return [mid - half, mid + half];
        };
        addSmoothMesh(g, skinPatch(cfg, car, lamp.s0 - 0.07, lamp.s1 + 0.07, (a) => rng(a, 0.025), { side, ns: 14, nt: 4, offset: 0.0009 }), trimMat);
        addSmoothMesh(g, skinPatch(cfg, car, lamp.s0, lamp.s1, (a) => rng(a, 0), { side, ns: 14, nt: 4, offset: 0.0017 }), m);
      }
    }
  }

  function addNoseSeam(g, car, material) {
    if (!cfg.seamS) return;
    const s0 = cfg.seamS;
    const geo = surfaceGrid(
      (a, b) => {
        const s = s0 + 0.025 * a;
        const gg = b < 0.5 ? -1 + 4 * b : 1 - 4 * (b - 0.5);
        return skinPoint(cfg, car, s, Math.max(-1, Math.min(1, gg)), b < 0.5 ? 1 : -1);
      },
      { ns: 1, nt: 72, offset: 0.0009, outward: () => [car.flip ? -1 : 1, 0, 0] },
    );
    addSmoothMesh(g, geo, material);
  }

  const P = cfg.parts;
  const parts = [];

  parts.push({
    id: 'aero-nose-cone', category: 'Aerodynamics', isOuter: true, explodeOffset: cfg.explode.nose, ...P.nose,
    build(g) {
      const geo = shellFor(lead, 0, Ln, { next: { s: Ln + 0.25, p: cfg.section(Ln + 0.25) } });
      addSmoothMesh(g, geo, paintMat(liveryTexture(cfg, 'end')));
      addLamps(g, lead, lampMat(0xf4f8ff, 2.4), matte(0x3a0c0e, 0.25, 0.25), fritMat());
      addNoseSeam(g, lead, matte(0x7a838e, 0.5, 0.2));
    },
  });

  parts.push({
    id: 'aluminum-carbody-shell', category: 'Structure', isOuter: true, explodeOffset: cfg.explode.body, ...P.body,
    build(g) {
      const endGeos = [
        shellFor(lead, Ln, lead.L - g2, { end: true, prev: { s: Ln - 0.25, p: cfg.section(Ln - 0.25) } }),
        shellFor(tail, 0, tail.L - g2, { end: true }),
      ];
      addSmoothMesh(g, mergeGeometries(endGeos, false), paintMat(liveryTexture(cfg, 'end')));
      const midGeos = cars.filter((c) => !c.end).map((c) => shellFor(c, g2, c.L - g2, { start: true, end: true }));
      if (midGeos.length) addSmoothMesh(g, mergeGeometries(midGeos, false), paintMat(liveryTexture(cfg, 'mid')));
      // the tail car's nose (cab glass + lit red tail lamps) belongs to the carbody
      addCabGlass(g, tail, { glass: glassDark(), frit: fritMat() });
      addLamps(g, tail, matte(0xb9c0c9, 0.15, 0.4), lampMat(0xff2a2a, 2.2), fritMat());
      addNoseSeam(g, tail, matte(0x7a838e, 0.5, 0.2));
      // recessed underfloor equipment skirts
      const B = new MeshBatch();
      const skirt = matte(cfg.colors.skirt, 0.62, 0.25);
      for (const car of cars) {
        const zones = [];
        if (isMaglev) {
          zones.push([car.end ? Ln + 0.4 : 3.2, car.L - 3.2]);
        } else {
          const bs = bogieS(car);
          if (car.end) zones.push([Math.max(Ln * 0.6, bs[0] + 2.05), bs[1] - 2.05]);
          else {
            zones.push([0.35, bs[0] - 2.05]);
            zones.push([bs[0] + 2.05, bs[1] - 2.05]);
          }
          zones.push([bs[1] + 2.05, car.L - g2 - 0.15]);
        }
        for (const [a, b] of zones) {
          if (b - a < 0.4) continue;
          B.rbox((b - a) * MS, (cfg.skirt.y1 - cfg.skirt.y0) * MS, cfg.skirt.w * MS, 0.1 * MS, skirt, toScene(car, (a + b) / 2, (cfg.skirt.y0 + cfg.skirt.y1) / 2, 0));
        }
      }
      if (cfg.addRoofExtras) cfg.addRoofExtras(B, cars, { bodyP, mats: { metal: metal(0x9aa3ad, 0.35, 0.8), dark: matte(0x2b3036, 0.6, 0.3), insulator: matte(0xe2e5e9, 0.3, 0.05), paint: whitePaint() } });
      B.flush(g);
    },
  });

  parts.push({
    id: 'driver-cab-cockpit', category: 'Driver Cab', isOuter: true, explodeOffset: cfg.explode.cab, ...P.cab,
    build(g) {
      addCabGlass(g, lead, { glass: glassDark(), frit: fritMat() });
      const W = cfg.windshield;
      const B = new MeshBatch();
      const consoleMat = matte(0x2a2f37, 0.55, 0.2);
      const seatMat = matte(cfg.colors.cabSeat, 0.7, 0.05);
      const screen = new THREE.MeshStandardMaterial({ color: 0x0b2a4a, emissive: 0x3aa0ff, emissiveIntensity: 0.9, roughness: 0.3 });
      const sc = W.s0 + (W.s1 - W.s0) * 0.62;
      const yc = cfg.cab.deskY;
      B.rbox(0.9 * MS, 0.35 * MS, cfg.cab.deskW * MS, 0.06 * MS, consoleMat, toScene(lead, sc + 0.55, yc, 0), [0, 0, 0.25]);
      for (const dz of [-0.55, 0, 0.55]) B.box(0.04 * MS, 0.26 * MS, 0.42 * MS, screen, toScene(lead, sc + 0.32, yc + 0.28, dz * (cfg.cab.deskW / 1.9)), [0, 0, 0.45]);
      B.rbox(0.55 * MS, 0.12 * MS, 0.55 * MS, 0.05 * MS, seatMat, toScene(lead, sc + 1.6, yc - 0.32, 0));
      B.rbox(0.12 * MS, 0.75 * MS, 0.55 * MS, 0.05 * MS, seatMat, toScene(lead, sc + 1.95, yc + 0.02, 0), [0, 0, 0.2]);
      const lever = metal(0xc0c6cd);
      for (const dz of [-0.35, 0.35]) B.cyl(0.03 * MS, 0.03 * MS, 0.3 * MS, 8, lever, toScene(lead, sc + 0.9, yc + 0.25, dz), [0, 0, 0.3]);
      B.box(3.2 * MS, 0.05 * MS, (cfg.cab.deskW + 0.5) * MS, matte(0x3a4048), toScene(lead, sc + 1.3, yc - 0.75, 0));
      B.box(0.06 * MS, 1.6 * MS, (cfg.cab.deskW + 0.6) * MS, matte(0x8a929c), toScene(lead, sc + 2.9, yc + 0.1, 0));
      B.flush(g);
    },
  });

  parts.push({
    id: 'pantograph-catenary', category: isMaglev ? 'Wireless Power' : 'High-Voltage Power', isOuter: true, explodeOffset: cfg.explode.panto, ...P.panto,
    build(g) {
      const B = new MeshBatch();
      if (isMaglev) {
        // inductive power-collection coil panels on the lower body sides, facing the guideway coils
        const coil = matte(0x2c3440, 0.45, 0.35);
        const frame = metal(0xaab2bc, 0.35, 0.8);
        for (const car of cars) {
          const a = car.end ? Ln + 1.2 : 3.4;
          const b = car.L - 3.4;
          for (const side of [-1, 1]) {
            B.rbox((b - a) * MS, 0.3 * MS, 0.06 * MS, 0.02 * MS, frame, toScene(car, (a + b) / 2, 0.86, side * 1.33));
            for (let s = a + 0.3; s < b - 0.9; s += 1.1) B.rbox(0.9 * MS, 0.22 * MS, 0.05 * MS, 0.03 * MS, coil, toScene(car, s + 0.45, 0.86, side * 1.36));
          }
        }
        B.flush(g);
        return;
      }
      const M = { insulator: matte(0xe6e8eb, 0.3, 0.05), arm: metal(0x8f98a3, 0.35, 0.85), carbon: matte(0x1b1d21, 0.6, 0.2), shield: whitePaint(), cable: matte(0x1f2328, 0.5, 0.2) };
      const roofY = RAIL_Y + bodyP.yTop * MS;
      for (const pp of cfg.pantographs) {
        const car = cars[pp.car];
        const base = toScene(car, pp.s, bodyP.yTop, 0);
        base[1] = roofY - 0.02 * MS;
        addPantograph(g, B, M, base, { insH: cfg.pantoInsH ?? 0.32, wireY: cfg.wireH, rest: 1 });
        if (cfg.pantoShields) {
          for (const side of [-1, 1]) B.rbox(2.6 * MS, 0.42 * MS, 0.07 * MS, 0.05 * MS, M.shield, [base[0] - 0.5 * MS, roofY + 0.12 * MS, side * 0.98 * MS]);
        }
        if (cfg.pantoFairing) {
          B.rbox(3.4 * MS, 0.16 * MS, 1.7 * MS, 0.08 * MS, M.shield, [base[0] - 0.5 * MS, roofY + 0.0 * MS, 0]);
        }
        B.cyl(0.03 * MS, 0.03 * MS, 6.0 * MS, 8, M.cable, [base[0] - 4.5 * MS, roofY + 0.06 * MS, 0.25 * MS], [0, 0, Math.PI / 2]);
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'bogies-wheelsets', category: isMaglev ? 'Levitation & Landing Gear' : 'Running Gear', isOuter: true, explodeOffset: cfg.explode.bogies, ...P.bogies,
    build(g) {
      if (isMaglev) {
        buildMaglevBogies(g, maglevBogies());
        return;
      }
      const B = new MeshBatch();
      const M = {
        frame: metal(cfg.colors.bogie, 0.55, 0.45), box: metal(0x4a5059, 0.45, 0.6), spring: metal(0x30353c, 0.45, 0.6),
        rubber: matte(0x15171a, 0.85, 0.0), damper: metal(cfg.colors.damper, 0.4, 0.5), rod: metal(0xd5dbe2, 0.2, 0.95),
        wheel: metal(0x9aa1aa, 0.32, 0.88),
      };
      for (const car of cars) {
        for (const cx of bogieCentres(car)) {
          addRailBogie(B, M, cx);
          for (const e of [-1, 1]) addWheelset(g, cx + e * 1.25 * MS, M);
        }
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'traction-motors-gearbox', category: isMaglev ? 'Superconducting Magnets' : 'Propulsion', isOuter: false, explodeOffset: cfg.explode.motors, ...P.motors,
    build(g) {
      if (isMaglev) {
        buildMaglevMagnets(g, maglevBogies());
        return;
      }
      const B = new MeshBatch();
      const motor = metal(0x6b7380, 0.45, 0.7);
      const fins = metal(0x8d96a1, 0.4, 0.75);
      const gear = metal(0x3b414a, 0.5, 0.6);
      for (const car of cars) {
        if (!poweredCar(car)) continue;
        for (const cx of bogieCentres(car)) {
          for (const e of [-1, 1]) {
            const mx = cx + e * 0.62 * MS;
            const mz = e * 0.12;
            const my = RAIL_Y + 0.55 * MS;
            B.cyl(0.27 * MS, 0.27 * MS, 0.62 * MS, 18, motor, [mx, my, mz * MS], [Math.PI / 2, 0, 0]);
            for (let k = -2; k <= 2; k++) B.cyl(0.29 * MS, 0.29 * MS, 0.025 * MS, 18, fins, [mx, my, (mz + k * 0.11) * MS], [Math.PI / 2, 0, 0]);
            B.cyl(0.07 * MS, 0.07 * MS, 0.32 * MS, 10, fins, [mx, my, (mz + 0.45) * MS], [Math.PI / 2, 0, 0]);
            B.rbox(0.5 * MS, 0.55 * MS, 0.22 * MS, 0.06 * MS, gear, [cx + e * 1.12 * MS, RAIL_Y + 0.47 * MS, 0.6 * MS]);
          }
        }
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'sic-traction-transformer', category: isMaglev ? 'On-Board Power' : 'Power Electronics', isOuter: false, explodeOffset: cfg.explode.power, ...P.power,
    build(g) {
      const B = new MeshBatch();
      const boxMat = metal(0x4b525c, 0.5, 0.55);
      const finMat = metal(0x9aa3ad, 0.35, 0.8);
      const hv = matte(0xf97316, 0.45, 0.1);
      const batt = matte(0x2e6b4f, 0.5, 0.2);
      const y0 = cfg.skirt.y0 + 0.08;
      const y1 = cfg.skirt.y1 - 0.06;
      const yc = (y0 + y1) / 2;
      for (const car of cars) {
        const items = cfg.equipment(car);
        for (const it of items) {
          const c = toScene(car, it.s, yc, 0);
          const w = it.w ?? 2.3;
          B.rbox(it.len * MS, (y1 - y0) * MS, w * MS, 0.06 * MS, it.type === 'battery' ? batt : boxMat, c);
          if (it.fins) {
            for (let k = 0; k < Math.floor(it.len / 0.18); k++) {
              B.box(0.05 * MS, (y1 - y0) * 0.8 * MS, (w + 0.08) * MS, finMat, [c[0] + (-it.len / 2 + 0.1 + k * 0.18) * MS, c[1], 0]);
            }
          }
          if (it.type === 'transformer') B.cyl(0.14 * MS, 0.14 * MS, w * 0.9 * MS, 12, finMat, [c[0], c[1] + (y1 - y0) * 0.35 * MS, 0], [Math.PI / 2, 0, 0]);
        }
        // HV cable linking the boxes (inside the skirt zone)
        if (items.length > 1) {
          const sA = Math.min(...items.map((i) => i.s));
          const sB = Math.max(...items.map((i) => i.s));
          const a = toScene(car, sA, y1 - 0.03, 0.6);
          const b = toScene(car, sB, y1 - 0.03, 0.6);
          B.cyl(0.035 * MS, 0.035 * MS, Math.abs(b[0] - a[0]), 8, hv, [(a[0] + b[0]) / 2, a[1], a[2]], [0, 0, Math.PI / 2]);
        }
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'passenger-saloon-seats', category: 'Cabin Interior', isOuter: false, explodeOffset: cfg.explode.seats, ...P.seats,
    build(g) {
      const B = new MeshBatch();
      const fabric = matte(cfg.colors.seat, 0.78, 0.02);
      const cover = matte(0xf2f4f7, 0.7, 0.0);
      const arm = matte(0x6b7280, 0.5, 0.3);
      const floor = matte(cfg.colors.floor, 0.85, 0.02);
      const rack = metal(0xb8c0c9, 0.3, 0.85);
      const fy = cfg.floorY;
      for (const car of cars) {
        const sA = car.end ? cfg.seats.endStart : cfg.seats.midStart;
        const sB = car.L - (car.end ? cfg.seats.endTail : cfg.seats.midTail);
        const fl0 = car.end ? Ln - 1.5 : 0.6;
        B.box(Math.abs(car.L - 0.6 - fl0) * MS, 0.06 * MS, (bodyP.zE * 2 - 0.35) * MS, floor, toScene(car, (fl0 + car.L - 0.6) / 2, fy - 0.03, 0));
        for (const side of [-1, 1]) B.box((sB - sA) * MS, 0.03 * MS, 0.42 * MS, rack, toScene(car, (sA + sB) / 2, cfg.seats.rackY, side * (bodyP.zE - 0.42)));
        for (let s = sA; s <= sB; s += cfg.seats.pitch) {
          const x = toScene(car, s, 0, 0)[0];
          for (const blk of cfg.seats.blocks) {
            for (const z of blk) {
              const zz = z * MS;
              B.box(0.48 * MS, 0.12 * MS, 0.43 * MS, fabric, [x, RAIL_Y + (fy + 0.44) * MS, zz]);
              B.box(0.1 * MS, 0.7 * MS, 0.43 * MS, fabric, [x - 0.27 * MS, RAIL_Y + (fy + 0.82) * MS, zz], [0, 0, 0.16]);
              B.box(0.035 * MS, 0.2 * MS, 0.36 * MS, cover, [x - 0.16 * MS, RAIL_Y + (fy + 1.06) * MS, zz], [0, 0, 0.16]);
            }
            for (const ze of [Math.min(...blk) - 0.25, Math.max(...blk) + 0.25]) B.box(0.42 * MS, 0.06 * MS, 0.06 * MS, arm, [x - 0.02 * MS, RAIL_Y + (fy + 0.64) * MS, ze * MS]);
          }
        }
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'regenerative-eddy-brakes', category: 'Braking & Safety', isOuter: false, explodeOffset: cfg.explode.brakes, ...P.brakes,
    build(g) {
      const B = new MeshBatch();
      const disc = metal(0xc3c9d1, 0.28, 0.9);
      const vent = metal(0x6d7580, 0.45, 0.7);
      const caliper = metal(cfg.colors.caliper, 0.45, 0.5);
      if (isMaglev) {
        for (const bx of maglevBogies()) {
          for (const e of [-1, 1]) {
            for (const side of [-1, 1]) {
              const p = [bx + e * 1.55 * MS, RAIL_Y + 0.33 * MS, side * 0.86 * MS];
              B.cyl(0.24 * MS, 0.24 * MS, 0.05 * MS, 22, disc, p, [Math.PI / 2, 0, 0]);
              B.rbox(0.16 * MS, 0.2 * MS, 0.14 * MS, 0.03 * MS, caliper, [p[0] - e * 0.22 * MS, p[1] + 0.12 * MS, p[2]]);
            }
          }
        }
        B.flush(g);
        return;
      }
      for (const car of cars) {
        const powered = poweredCar(car);
        for (const cx of bogieCentres(car)) {
          for (const e of [-1, 1]) {
            const ax = cx + e * 1.25 * MS;
            const ay = RAIL_Y + 0.43 * MS;
            if (powered) {
              for (const side of [-1, 1]) {
                for (const k of [-1, 1]) B.cyl(0.33 * MS, 0.33 * MS, 0.025 * MS, 26, disc, [ax, ay, side * (0.75 + k * 0.075) * MS], [Math.PI / 2, 0, 0]);
                B.rbox(0.16 * MS, 0.2 * MS, 0.26 * MS, 0.03 * MS, caliper, [ax - e * 0.36 * MS, ay + 0.06 * MS, side * 0.75 * MS]);
              }
            } else {
              for (const z of [-0.32, 0.32]) {
                B.cyl(0.33 * MS, 0.33 * MS, 0.07 * MS, 26, disc, [ax, ay, z * MS], [Math.PI / 2, 0, 0]);
                B.cyl(0.18 * MS, 0.18 * MS, 0.09 * MS, 16, vent, [ax, ay, z * MS], [Math.PI / 2, 0, 0]);
                B.rbox(0.18 * MS, 0.22 * MS, 0.14 * MS, 0.03 * MS, caliper, [ax + e * 0.36 * MS, ay + 0.08 * MS, z * MS]);
              }
            }
          }
        }
      }
      B.flush(g);
    },
  });

  parts.push({
    id: 'diaphragm-gangway-coupler', category: 'Coupling & Comfort', isOuter: true, explodeOffset: cfg.explode.gangway, ...P.gangway,
    build(g) {
      const rubber = matte(0x23272d, 0.85, 0.05);
      const coupler = metal(0x8a929c, 0.4, 0.8);
      const geos = [];
      const B = new MeshBatch();
      for (let i = 0; i < cars.length - 1; i++) {
        const a = cars[i];
        const xs = a.xRear + g2 * MS;
        const gap = cfg.gap + 0.04;
        const ks = [0.985, 0.96, 0.975, 0.958, 0.975, 0.96, 0.985];
        const stations = ks.map((k, j) => ({ s: (j / (ks.length - 1)) * gap, p: scaleSection(bodyP, k) }));
        const geo = shellGeometry(stations, { len: gap, yMin: 0, yMax: 5 });
        geo.applyMatrix4(new THREE.Matrix4().makeTranslation(xs + 0.02 * MS, RAIL_Y, 0).multiply(new THREE.Matrix4().makeScale(MS, MS, MS)));
        geos.push(geo);
        B.cyl(0.08 * MS, 0.08 * MS, 1.6 * MS, 10, coupler, [a.xRear, RAIL_Y + cfg.couplerY * MS, 0], [0, 0, Math.PI / 2]);
        B.rbox(0.5 * MS, 0.35 * MS, 0.5 * MS, 0.05 * MS, coupler, [a.xRear, RAIL_Y + cfg.couplerY * MS, 0]);
      }
      if (geos.length) addSmoothMesh(g, mergeGeometries(geos, false), rubber);
      B.flush(g);
    },
  });

  parts.push({
    id: cfg.trackPartId, category: isMaglev ? 'Guideway' : 'Track', isOuter: false, explodeOffset: cfg.explode.track, ...P.track,
    build(g) {
      cfg.buildTrack(g, { xMin: xMin - 1.4, xMax: xMax + 1.8 });
      g.userData.trackBed = true;
      g.traverse((o) => {
        if (o.isMesh) o.userData.trackBed = true;
      });
    },
  });

  return {
    id: cfg.id,
    name: T.name,
    brand: T.brand,
    badge: T.badge,
    desc: T.desc,
    cameraPos: cfg.camera.pos,
    cameraTarget: cfg.camera.target,
    maxCameraRadius: cfg.camera.maxR,
    rideSpec: {
      kind: cfg.kind, scale: MS, railY: RAIL_Y, baseY: BASE_Y, railZ: 0.75 * MS, wireY: RAIL_Y + (cfg.wireH ?? 5) * MS, xMin, xMax,
      vmax: cfg.ride.vmax, vboost: cfg.ride.vboost, powerMW: cfg.ride.powerMW, region: cfg.ride.region, kv: cfg.ride.kv,
      wheelR: (cfg.ride.wheelR ?? 0.43) * MS, track: cfg.trackStyle || null, guideway: cfg.guideway || null,
      liftOff: cfg.ride.liftOff ?? 0,
    },
    parts,
    quiz: cfg.quiz,
  };
}

// ============================================================================
// Track & guideway builders. Everything periodic is phase-anchored at xMax, so the ride sim can rebuild a
// longer copy (same builder, via rideSpec.buildTrack) and scroll it by whole periods without a seam.
// ============================================================================

/** Deterministic PRNG (mulberry32) so canvas weathering is identical on every load. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable weathered cast-concrete albedo (light neutral grey; tint per use with material.color). */
function concreteTexture(seed = 11) {
  return cachedCanvasTexture(`rail:concrete:${seed}`, 512, 512, (ctx, w, h) => {
    const r = rng(seed);
    ctx.fillStyle = '#b3b7bb';
    ctx.fillRect(0, 0, w, h);
    const wrap = (fn) => {
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy);
    };
    // soft mottling & water stains
    for (let k = 0; k < 64; k++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 18 + r() * 95;
      const a = 0.05 + r() * 0.08;
      const col = r() < 0.62 ? `rgba(62,66,72,${a})` : `rgba(232,234,236,${a})`;
      wrap((ox, oy) => {
        const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, col);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      });
    }
    // fine aggregate speckle
    for (let k = 0; k < 11000; k++) {
      const v = r() < 0.55 ? 64 + r() * 60 : 196 + r() * 44;
      ctx.fillStyle = `rgba(${v | 0},${v | 0},${(v + 4) | 0},${0.1 + r() * 0.22})`;
      ctx.fillRect((r() * w) | 0, (r() * h) | 0, r() < 0.88 ? 1 : 2, r() < 0.88 ? 1 : 2);
    }
    // rain streaks / grime lines
    for (let k = 0; k < 46; k++) {
      const x = r() * w;
      const y = r() * h;
      const len = 30 + r() * 220;
      const lw = 1 + r() * 3;
      ctx.fillStyle = `rgba(58,62,68,${0.03 + r() * 0.06})`;
      wrap((ox, oy) => ctx.fillRect(x + ox, y + oy, lw, len));
    }
  }, { repeat: [1, 1] });
}

/** Box (scene units) with world-scaled UVs: 1 UV unit = `tile`, u anchored at world x = xRef. */
function uvBox(w, h, d, pos, tile, xRef) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = (p.getX(i) + pos[0] - xRef) / tile;
    const y = (p.getY(i) + pos[1]) / tile;
    const z = (p.getZ(i) + pos[2]) / tile;
    if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, x, z);
    else if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
  return geo;
}

function buildSlabTrack(style) {
  return (g, k) => {
    const { xMin, xMax } = k;
    const B = new MeshBatch();
    const tex = concreteTexture(11);
    const conc = (color, rough = 0.97) => new THREE.MeshStandardMaterial({ color, map: tex, roughness: rough, metalness: 0 });
    const deckM = conc(style.deckTint);
    const sideM = conc(style.girderTint);
    const slabM = conc(style.slabTint, 0.93);
    const bedM = conc(style.bedTint);
    const lidM = conc(style.lidTint);
    // CA mortar (Shinkansen J-slab) or self-compacting concrete (CRTS III) under the slabs
    const fillM = style.scc ? bedM : matte(0x3a3e43, 0.97, 0.0);
    const railM = metal(0x57514c, 0.6, 0.55);
    const shiny = metal(0xe8ecef, 0.16, 1.0);
    const plateM = matte(0x25282c, 0.62, 0.35);
    const clipM = metal(style.clipColor, 0.42, 0.75);
    const boltM = metal(0x3b3f44, 0.5, 0.65);
    const L = xMax - xMin;
    const xc = (xMin + xMax) / 2;
    const Y = (m) => RAIL_Y + m * MS;
    const P = (style.slabLen + style.slabGap) * MS; // one slab = the track's repeat period
    const box = (w, h, d, mat, pos) => B.add(uvBox(w, h, d, pos, P, xMax), mat, pos);
    const seatH = style.seatH ?? 0;
    const slabTop = -(0.174 + style.padH + seatH);
    const slabBot = slabTop - style.slabH;
    const fillBot = slabBot - style.mortarH;
    const deckTop = fillBot - style.bedH;
    const deckBot = deckTop - 0.32;
    const baseM = (BASE_Y - RAIL_Y) / MS;
    const half = style.deckW / 2;
    // viaduct deck slab on a narrower box girder
    box(L, (deckTop - deckBot) * MS, style.deckW * MS, deckM, [xc, Y((deckTop + deckBot) / 2), 0]);
    box(L, (deckBot - baseM) * MS, style.girderW * MS, sideM, [xc, Y((deckBot + baseM) / 2), 0]);
    // concrete roadbed (J-slab) / hydraulic base plate (CRTS III) carrying the track slabs
    box(L, style.bedH * MS, style.bedW * MS, bedM, [xc, Y(deckTop + style.bedH / 2), 0]);
    for (const side of [-1, 1]) {
      const zs = (m) => side * m * MS;
      // low parapet lip along the deck edge with a darker coping
      box(L, style.parapetH * MS, 0.2 * MS, deckM, [xc, Y(deckTop + style.parapetH / 2), zs(half - 0.1)]);
      box(L, 0.05 * MS, 0.24 * MS, sideM, [xc, Y(deckTop + style.parapetH + 0.025), zs(half - 0.1)]);
      // cable trough: inner wall + precast lids (a lid joint every quarter slab)
      const tw = style.troughW;
      const tz = half - 0.22 - tw / 2;
      box(L, 0.22 * MS, 0.07 * MS, deckM, [xc, Y(deckTop + 0.11), zs(tz - tw / 2 - 0.035)]);
      for (let x = xMax - P / 8; x > xMin + P / 16; x -= P / 4) box(P / 4 - 0.014 * MS, 0.05 * MS, tw * MS, lidM, [x, Y(deckTop + 0.2), zs(tz)]);
    }
    const nSeats = Math.round(style.slabLen / style.fastPitch);
    for (let x = xMax - P / 2; x > xMin + P / 2 - 1e-6; x -= P) {
      box(style.slabLen * MS, style.slabH * MS, style.slabW * MS, slabM, [x, Y((slabTop + slabBot) / 2), 0]);
      box(style.slabLen * MS, style.mortarH * MS, (style.slabW + 0.06) * MS, fillM, [x, Y((slabBot + fillBot) / 2), 0]);
      if (style.bosses) {
        // cylindrical concrete stopper (boss) between the slabs, ringed by resin filler
        const bx = x - P / 2;
        if (bx > xMin + 0.05) {
          B.cyl(0.26 * MS, 0.26 * MS, (style.slabH + style.mortarH) * MS, 20, bedM, [bx, Y((slabTop + fillBot) / 2 + 0.004), 0]);
          B.cyl(0.32 * MS, 0.32 * MS, 0.01 * MS, 20, plateM, [bx, Y(slabTop - 0.002), 0]);
        }
      }
      for (let q = 0; q < nSeats; q++) {
        const fx = x + (-style.slabLen / 2 + (q + 0.5) * (style.slabLen / nSeats)) * MS;
        for (const rz of [-0.75, 0.75]) {
          // CRTS III: raised rail-seat pedestal cast into the slab
          if (seatH) box(0.34 * MS, seatH * MS, 0.62 * MS, slabM, [fx, Y(slabTop + seatH / 2), rz * MS]);
          // tie plate + rubber pad, two spring clips on the rail foot, two anchor bolts
          B.box(0.17 * MS, style.padH * MS, 0.38 * MS, plateM, [fx, Y(-0.174 - style.padH / 2), rz * MS]);
          for (const cz of [-1, 1]) {
            B.box(0.1 * MS, 0.03 * MS, 0.075 * MS, clipM, [fx, Y(-0.156), (rz + cz * 0.098) * MS], [cz * 0.3, 0, 0]);
            B.cyl(0.024 * MS, 0.024 * MS, 0.05 * MS, 6, boltM, [fx, Y(-0.168), (rz + cz * 0.155) * MS]);
          }
        }
      }
    }
    B.flush(g);
    const railGeos = [-0.75, 0.75].map((rz) => prismX(RAIL_PROFILE.map(([z, y]) => [z + rz, y]), xMin, xMax));
    addSmoothMesh(g, mergeGeometries(railGeos, false), railM);
    // polished running band worn into the rail head by the wheels
    const shine = new MeshBatch();
    for (const rz of [-0.75, 0.75]) shine.box(L, 0.003 * MS, 0.044 * MS, shiny, [xc, Y(0.0015), rz * MS]);
    shine.flush(g);
  };
}

/** Ground-coil sidewall texture: figure-8 null-flux levitation/guidance coils (tile = 2 coils). */
function coilTexture(repeatX) {
  return cachedCanvasTexture(`scmaglev:coils:${repeatX.toFixed(2)}`, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7f8790';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 2; k++) {
      const x0 = k * (w / 2) + 10;
      const pw = w / 2 - 20;
      ctx.fillStyle = '#353b42';
      ctx.beginPath();
      ctx.roundRect(x0, 22, pw, h - 44, 14);
      ctx.fill();
      ctx.strokeStyle = '#a0784a';
      ctx.lineWidth = 11;
      for (const [cy, hh] of [[h * 0.33, h * 0.24], [h * 0.67, h * 0.24]]) {
        ctx.beginPath();
        ctx.roundRect(x0 + 26, cy - hh / 2, pw - 52, hh, hh * 0.45);
        ctx.stroke();
      }
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0 + pw / 2 - 18, h * 0.45);
      ctx.lineTo(x0 + pw / 2 + 18, h * 0.55);
      ctx.moveTo(x0 + pw / 2 + 18, h * 0.45);
      ctx.lineTo(x0 + pw / 2 - 18, h * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#c9ced4';
      for (const bx of [x0 + 12, x0 + pw - 12]) for (const by of [34, h - 34]) ctx.fillRect(bx - 4, by - 4, 8, 8);
    }
  }, { repeat: [repeatX, 1] });
}

function buildGuideway(gw) {
  return (g, k) => {
    const { xMin, xMax } = k;
    const L = xMax - xMin;
    const xc = (xMin + xMax) / 2;
    const Y = (m) => RAIL_Y + m * MS;
    const B = new MeshBatch();
    const concrete = matte(0x9aa1a8, 0.9, 0.02);
    const girder = matte(0x858c94, 0.95, 0.02);
    const strip = matte(0xb7bcc2, 0.7, 0.05);
    const baseM = (BASE_Y - RAIL_Y) / MS;
    const outer = gw.inner + gw.wallT;
    // floor slab, box girder below, U sidewalls with rounded caps
    B.box(L, gw.floorT * MS, outer * 2 * MS, concrete, [xc, Y(-gw.floorT / 2), 0]);
    B.box(L, (-gw.floorT - baseM) * MS, gw.girderW * MS, girder, [xc, Y((-gw.floorT + baseM) / 2), 0]);
    for (const side of [-1, 1]) {
      B.rbox(L, (gw.wallH + 0.02) * MS, gw.wallT * MS, 0.06 * MS, concrete, [xc, Y(gw.wallH / 2), side * (gw.inner + gw.wallT / 2) * MS]);
      // landing-wheel running strips & guide strips
      B.box(L, 0.03 * MS, 0.5 * MS, strip, [xc, Y(0.015), side * gw.wheelZ * MS]);
      B.box(L, 0.16 * MS, 0.04 * MS, strip, [xc, Y(0.46), side * (gw.inner - 0.02) * MS]);
    }
    // expansion joints every 12 m
    for (let x = xMax - 0.3; x > xMin; x -= 12 * MS) B.box(0.03 * MS, 0.012 * MS, gw.inner * 2 * MS, girder, [x, Y(0.006), 0]);
    B.flush(g);
    // ground-coil panels on both inner faces (figure-8 levitation-guidance coils + propulsion coils)
    const tileM = 2.7;
    const tex = coilTexture(L / MS / tileM);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.6, metalness: 0.15 });
    const ph = gw.coilY1 - gw.coilY0;
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(L, ph * MS);
      const m = addSmoothMesh(g, geo, coilMat, [xc, Y((gw.coilY0 + gw.coilY1) / 2), side * (gw.inner - 0.045) * MS], [0, side > 0 ? Math.PI : 0, 0]);
      m.userData.coilPanel = true;
    }
  };
}

// ============================================================================
// SCMaglev running gear
// ============================================================================

function buildMaglevBogies(g, xs) {
  const B = new MeshBatch();
  const frame = metal(0x3a4048, 0.5, 0.5);
  const strut = metal(0x9aa2ab, 0.3, 0.85);
  const tyreRubber = matte(0x16181b, 0.9, 0.0);
  const hubMat = metal(0xc9ced4, 0.25, 0.9);
  for (const bx of xs) {
    const P = (dx, y, z) => [bx + dx * MS, RAIL_Y + y * MS, z * MS];
    B.rbox(4.6 * MS, 0.28 * MS, 2.5 * MS, 0.06 * MS, frame, P(0, 0.58, 0));
    for (const e of [-1, 1]) {
      B.rbox(0.3 * MS, 0.5 * MS, 3.0 * MS, 0.05 * MS, frame, P(e * 1.9, 0.62, 0));
      for (const side of [-1, 1]) {
        // landing-gear leg + retraction actuator
        B.cyl(0.06 * MS, 0.06 * MS, 0.42 * MS, 10, strut, P(e * 1.55, 0.55, side * 1.12), [0, 0, e * 0.25]);
        B.cyl(0.035 * MS, 0.035 * MS, 0.5 * MS, 8, strut, P(e * 1.2, 0.58, side * 1.12), [0, 0, e * 0.9]);
        // guide wheels (vertical axis) that run on the sidewall strips at low speed
        B.cyl(0.24 * MS, 0.24 * MS, 0.16 * MS, 18, tyreRubber, P(e * 2.15, 0.46, side * 1.66));
        B.cyl(0.12 * MS, 0.12 * MS, 0.18 * MS, 12, hubMat, P(e * 2.15, 0.46, side * 1.66));
      }
    }
    // support (landing) wheels: rubber tyres on short axles, roll on the guideway floor, retract above ~150 km/h
    for (const e of [-1, 1]) {
      const grp = new THREE.Group();
      grp.position.set(bx + e * 1.55 * MS, RAIL_Y + 0.33 * MS, 0);
      grp.userData.driveRole = 'wheel';
      grp.userData.retractable = true;
      g.add(grp);
      const wb = new MeshBatch();
      for (const side of [-1, 1]) {
        wb.cyl(0.33 * MS, 0.33 * MS, 0.24 * MS, 22, tyreRubber, [0, 0, side * 1.12 * MS], [Math.PI / 2, 0, 0]);
        wb.cyl(0.2 * MS, 0.2 * MS, 0.26 * MS, 16, hubMat, [0, 0, side * 1.12 * MS], [Math.PI / 2, 0, 0]);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          wb.cyl(0.025 * MS, 0.025 * MS, 0.29 * MS, 6, hubMat, [Math.cos(a) * 0.12 * MS, Math.sin(a) * 0.12 * MS, side * 1.12 * MS], [Math.PI / 2, 0, 0]);
        }
      }
      wb.cyl(0.06 * MS, 0.06 * MS, 2.0 * MS, 10, hubMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
      wb.flush(grp);
    }
  }
  B.flush(g);
}

function buildMaglevMagnets(g, xs) {
  const B = new MeshBatch();
  const shell = metal(0xd7dce2, 0.3, 0.6);
  const coil = metal(0x2f4b78, 0.35, 0.6);
  const cryo = metal(0x8f98a3, 0.35, 0.8);
  for (const bx of xs) {
    for (const side of [-1, 1]) {
      const zc = side * 1.6 * MS;
      B.rbox(5.0 * MS, 0.95 * MS, 0.3 * MS, 0.1 * MS, shell, [bx, RAIL_Y + 0.86 * MS, zc]);
      // four racetrack superconducting coils per magnet unit, seen through the outer face
      for (let k = 0; k < 4; k++) {
        const cx = bx + (-1.8 + k * 1.2) * MS;
        const zf = side * 1.76 * MS;
        B.box(1.0 * MS, 0.06 * MS, 0.03 * MS, coil, [cx, RAIL_Y + 1.12 * MS, zf]);
        B.box(1.0 * MS, 0.06 * MS, 0.03 * MS, coil, [cx, RAIL_Y + 0.6 * MS, zf]);
        B.box(0.06 * MS, 0.52 * MS, 0.03 * MS, coil, [cx - 0.47 * MS, RAIL_Y + 0.86 * MS, zf]);
        B.box(0.06 * MS, 0.52 * MS, 0.03 * MS, coil, [cx + 0.47 * MS, RAIL_Y + 0.86 * MS, zf]);
      }
      // on-board cryocooler + helium lines
      B.rbox(0.7 * MS, 0.35 * MS, 0.4 * MS, 0.05 * MS, cryo, [bx, RAIL_Y + 1.48 * MS, side * 1.5 * MS]);
      B.cyl(0.04 * MS, 0.04 * MS, 3.6 * MS, 8, cryo, [bx, RAIL_Y + 1.38 * MS, side * 1.62 * MS], [0, 0, Math.PI / 2]);
    }
  }
  B.flush(g);
}

// ============================================================================
// Model configs
// ============================================================================

const SANS = '"Helvetica Neue", Arial, sans-serif';
const CJK = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const CJK_SERIF = '"Songti SC", "STSong", "Hiragino Mincho ProN", "Noto Serif CJK SC", "SimSun", serif';

// ---------------------------------------------------------------------------
// JR Central N700S Supreme
// ---------------------------------------------------------------------------
const N700S_TRACK = {
  slabLen: 4.93, slabGap: 0.07, slabW: 2.34, slabH: 0.19, mortarH: 0.05, padH: 0.03, bedH: 0.1, bedW: 2.8, fastPitch: 0.625, bosses: true,
  deckW: 4.6, girderW: 2.8, parapetH: 0.42, troughW: 0.42, clipColor: 0x8d949c,
  deckTint: 0x6b7177, girderTint: 0x565c62, slabTint: 0x81878d, bedTint: 0x72787e, lidTint: 0x5f656b,
};
const N700S = {
  id: 'shinkansen-n700s',
  kind: 'rail',
  midCars: 2,
  endLen: 27.35,
  midLen: 25.0,
  gap: 0.6,
  xTip: (27.35 * MS) / 2,
  frontBogie: 6.1,
  bogieOverhang: 3.75,
  bogieSpacing: 17.5,
  floorY: 1.3,
  axisY: 2.0,
  couplerY: 1.0,
  wireH: 5.0,
  pantoShields: true,
  pantographs: [{ car: 1, s: 17.5 }],
  seamS: 0.55,
  colors: { skirt: 0x3b4048, bogie: 0x2c3138, damper: 0x5b6470, caliper: 0x3a3f46, seat: 0x2a4f9a, floor: 0x8c8277, cabSeat: 0x1f3c78 },
  skirt: { y0: 0.42, y1: 1.06, w: 2.96 },
  tex: { yMin: 0.4, yMax: 3.66 },
  denseZones: [[3.3, 4.6, 0.06], [0, 1.2, 0.04]],
  shape: {
    noseLen: 10.7,
    yTip: 1.08,
    sCap: 0.85,
    body: { yBot: 1.0, zE: 1.68, yE: 1.8, yTop: 3.6, alpha: 90, beta: 0, kU1: 0.75, kU2: 0.62, kL1: 0.55, kL2: 0.7 },
    top: [[0, 1.34], [1, 1.5], [2, 1.71], [3, 1.97], [4, 2.29], [5, 2.66], [6, 3.0], [7, 3.27], [8, 3.45], [9, 3.555], [10, 3.595], [10.7, 3.6], [11.7, 3.6]],
    bot: [[0, 0.8], [0.8, 0.66], [1.6, 0.6], [2.6, 0.57], [3.4, 0.58], [3.85, 0.7], [4.25, 1.0], [10.7, 1.0], [11.7, 1.0]],
    yE: [[0, 1.1], [0.6, 1.08], [1.2, 1.09], [2, 1.12], [3, 1.18], [4, 1.26], [5, 1.36], [6, 1.47], [7, 1.58], [8, 1.68], [9, 1.75], [10, 1.79], [10.7, 1.8], [11.7, 1.8]],
    zE: [[0, 0.82], [0.5, 0.84], [1, 0.9], [2, 1.07], [3, 1.23], [4, 1.36], [5, 1.47], [6, 1.55], [7, 1.61], [8, 1.65], [9, 1.675], [10, 1.68], [10.7, 1.68], [11.7, 1.68]],
    alpha: [[0, 14], [1, 15], [2, 17], [3, 18], [4, 19], [5, 22], [6, 29], [7, 42], [8, 60], [9, 78], [10, 88], [10.7, 90], [11.7, 90]],
    beta: [[0, 55], [1, 48], [2, 40], [3, 32], [4, 24], [5, 17], [6, 11], [7, 6], [8, 3], [9, 1], [10, 0], [11.7, 0]],
    kU1: [[0, 0.42], [2, 0.62], [4, 0.82], [7, 0.82], [9, 0.76], [10.7, 0.75], [11.7, 0.75]],
    kU2: [[0, 0.56], [2, 0.5], [3.5, 0.41], [5, 0.44], [6.5, 0.5], [8, 0.57], [10.7, 0.62], [11.7, 0.62]],
    kL1: [[0, 0.5], [10.7, 0.55], [11.7, 0.55]],
    kL2: [[0, 0.8], [4, 0.75], [10.7, 0.7], [11.7, 0.7]],
    bump: [5.6, 1.2, 0.05],
  },
  windshield: {
    s0: 3.85, s1: 6.9, frit: 0.16, fritG: 0.06,
    gLow: (s) => 1 - 0.5 * Math.sin((Math.PI / 2) * clamp01((s - 3.85) / 1.5)) ** 0.75 - 0.14 * smoothstep(5.5, 6.9, s),
  },
  cab: { deskY: 2.15, deskW: 1.7 },
  headlight: { s0: 1.25, s1: 3.05, g0: -0.07, g1: 0.07, round: 0.3 },
  taillight: { s0: 3.12, s1: 3.55, g0: -0.05, g1: 0.05, round: 0.5 },
  seats: { pitch: 1.04, midStart: 3.9, midTail: 3.6, endStart: 14.3, endTail: 3.0, rackY: 2.72, blocks: [[-1.17, -0.72, -0.27], [0.64, 1.09]] },
  ride: { vmax: 300, vboost: 360, powerMW: 17, region: 'jp', kv: '25 kV' },
  trackStyle: N700S_TRACK,
  camera: { pos: [4.75, 1.55, 5.35], target: [-0.6, -0.15, 0], maxR: 26 },
  explode: {
    nose: [1.7, 0.16, 0], body: [0, 1.05, 0], cab: [0.75, 1.6, 0], panto: [0, 2.0, 0], bogies: [0, -0.04, 1.15],
    motors: [0, -0.04, 1.75], power: [0, -0.04, -1.45], seats: [0, 0.32, 0], brakes: [0, -0.04, 0.62], gangway: [0, 0.5, -0.8], track: [0, 0, -0.55],
  },
  trackPartId: 'slab-track-rails',
  buildTrack: buildSlabTrack(N700S_TRACK),
  equipment: (car) => (car.end
    ? [{ s: 13.2, len: 3.2, type: 'battery' }, { s: 17.2, len: 3.4, type: 'box', fins: true }, { s: 20.6, len: 2.4, type: 'box' }]
    : car.idx === 1
      ? [{ s: 7.6, len: 4.2, type: 'transformer', fins: true }, { s: 12.6, len: 3.6, type: 'box', fins: true }, { s: 16.8, len: 3.0, type: 'box' }]
      : [{ s: 7.4, len: 3.6, type: 'box', fins: true }, { s: 12.2, len: 4.0, type: 'box', fins: true }, { s: 16.6, len: 2.8, type: 'battery' }]),
  paint(ctx, V, kind, cfg) {
    const L = V.len;
    const blue = '#0b3a8c';
    ctx.fillStyle = '#f5f7fa';
    ctx.fillRect(0, 0, V.w, V.h);
    ctx.fillStyle = '#d3d8de';
    fillRectM(ctx, V, -1, L + 1, -1, 1.035);
    const Ln = cfg.shape.noseLen;
    const end = kind === 'end';
    const edgeY = (s) => (end && s < Ln ? cfg.section(s).yE : 1.8);
    if (end) {
      ctx.fillStyle = '#2f343b';
      bandPath(ctx, V, steps(-0.2, 4.4, 0.05), (s) => 0.74 + 0.06 * smoothstep(3.6, 4.4, s), () => -1);
      ctx.fill();
    }
    // thick Tokaido-blue band below the windows, sweeping down along the nose "wing" edge to the headlights
    const bandTop = (s) => edgeY(s) - 0.02;
    const bandTh = (s) => (end ? 0.25 * smoothstep(1.1, 4.4, s) : 0.25);
    ctx.fillStyle = blue;
    bandPath(ctx, V, end ? steps(1.0, Ln, 0.05).concat([L + 1]) : [-1, L + 1], bandTop, (s) => bandTop(s) - bandTh(s));
    ctx.fill();
    // thin pinstripe
    const pinTop = (s) => bandTop(s) - bandTh(s) - 0.07 * (end ? smoothstep(1.4, 4.8, s) : 1);
    const pinTh = (s) => (end ? 0.06 * smoothstep(1.9, 5.2, s) : 0.06);
    bandPath(ctx, V, end ? steps(1.8, Ln, 0.05).concat([L + 1]) : [-1, L + 1], pinTop, (s) => pinTop(s) - pinTh(s));
    ctx.fill();
    const win = { y0: 1.99, y1: 2.55, w: 0.7, r: 0.1 };
    const doorY = [1.36, 3.17];
    const doorWin = { inset: 0.36, y0: 2.3, y1: 2.82 };
    const drawWindows = (a, b) => {
      for (let s = a; s + win.w <= b + 1e-6; s += 1.04) paintWindow(ctx, V, s, s + win.w, win.y0, win.y1, win.r);
    };
    const logo = (s, y, h) => textRun(ctx, V, s, y, [
      { t: 'N700', h, font: `italic 800 {px} ${SANS}`, color: blue, skew: 0.12 },
      { t: 'S', h: h * 1.35, font: `italic 900 {px} ${SANS}`, color: '#b8913c', skew: 0.14 },
    ]);
    if (end) {
      paintDoor(ctx, V, 9.88, 10.56, 1.4, 2.98, { inset: 0.17, y0: 2.3, y1: 2.78 });
      textRun(ctx, V, 8.6, 2.12, [{ t: 'JR', h: 0.34, font: `900 {px} ${SANS}`, color: '#f37321', skew: 0.08 }]);
      logo(12.3, 2.12, 0.36);
      textRun(ctx, V, 12.3, 1.93, [{ t: 'Supreme', h: 0.1, font: `italic 600 {px} ${SANS}`, color: '#4a5568' }]);
      drawWindows(14.05, L - 2.65);
      paintDoor(ctx, V, L - 2.22, L - 1.17, doorY[0], doorY[1], doorWin);
      paintDisplay(ctx, V, L - 2.62, L - 2.3, 2.62, 2.78, '#ffb347', '');
    } else {
      paintDoor(ctx, V, 1.15, 2.2, doorY[0], doorY[1], doorWin);
      paintDoor(ctx, V, L - 2.2, L - 1.15, doorY[0], doorY[1], doorWin);
      paintDisplay(ctx, V, 2.42, 3.4, 2.62, 2.8, '#ffb347', 'のぞみ 東京');
      logo(2.95, 2.12, 0.18);
      drawWindows(3.9, L - 3.5);
    }
    ctx.fillStyle = 'rgba(120,130,142,0.32)';
    fillRectM(ctx, V, end ? Ln + 0.4 : 0, L, 3.3, 3.31);
  },
  text: {
    name: 'Shinkansen N700S Supreme',
    brand: 'JR Central • Tokaido Shinkansen',
    badge: '300 km/h • Dual Supreme Wing',
    desc: 'Japan’s newest Tokaido Shinkansen “bullet train” (in service since 2020). A real N700S is a 16-car, 405-meter set; here you see the lead car, two middle cars and the tail car on a stretch of Shinkansen slab track.',
  },
  parts: {
    nose: {
      name: '10.7 m “Dual Supreme Wing” Nose', desc: 'The long, flat duck-bill nose with sharp “wing” edges on both sides. It pushes air smoothly out of the way so the train doesn’t make a loud boom when it rushes into a tunnel. Slim LED headlights sit right on the wing edges.',
      funFact: 'A bullet train entering a tunnel squeezes the air like a piston. A long, slim nose stops that “tunnel boom” — the same idea that made Japanese engineers copy the kingfisher’s beak for an older Shinkansen!',
    },
    body: {
      name: 'Airtight Aluminum Carbody Shells', desc: 'Each car is built from long, hollow aluminum extrusions welded together, then sealed airtight. You can see the Tokaido-blue stripes, flush plug doors and rounded windows on the lead car, two middle cars and the tail car.',
      funFact: 'Shinkansen cars are sealed like airplanes so your ears don’t pop when the train zooms into a tunnel at 285 km/h.',
    },
    cab: {
      name: 'Driver Cab & Wraparound Windshield', desc: 'The raised cockpit with a dark wraparound windshield, the driver’s seat and the control desk with screens.',
      funFact: 'Shinkansen lines have no traffic-light signals beside the track: the speed limit is sent straight to a screen in the cab by ATC (Automatic Train Control).',
    },
    panto: {
      name: 'Single-Arm Pantograph', desc: 'The folding arm on the roof presses a carbon strip up against the overhead wire to collect 25,000-volt electricity. Side shields help keep it quiet.',
      funFact: 'A whole 16-car N700S only needs two pantographs — fewer pantographs means less wind noise for people living near the line.',
    },
    bogies: {
      name: 'Bogies, Air Springs & Wheelsets', desc: 'Each car rides on two bogies. They have steel wheelsets, coil springs over the axle boxes, rubber air springs that carry the body, and yaw dampers that stop the bogie from wobbling at high speed.',
      funFact: 'Train wheels are slightly cone-shaped, so a wheelset steers itself around curves — no steering wheel needed!',
    },
    motors: {
      name: 'Traction Motors & Gearboxes', desc: 'Electric motors mounted on the bogies of the middle cars turn the axles through gearboxes. On the real train, 14 of the 16 cars have motors.',
      funFact: 'Spreading motors along the whole train (instead of one big locomotive) lets a Shinkansen accelerate quickly and keeps it light on the tracks.',
    },
    power: {
      name: 'Transformer, SiC Converters & Batteries', desc: 'Underfloor boxes that turn 25,000 volts from the wire into power for the motors, using tiny silicon-carbide (SiC) chips. A battery pack is hidden here too.',
      funFact: 'The N700S was the first high-speed train to use silicon-carbide power chips — and its batteries let it creep to safety by itself if the power ever goes out.',
    },
    seats: {
      name: 'Passenger Saloons & Reclining Seats', desc: 'Rows of blue reclining seats (3 + 2 across) with white head covers, a carpeted floor and luggage racks above the windows.',
      funFact: 'At the last station, the seat rows spin around so every passenger faces forward for the return trip!',
    },
    brakes: {
      name: 'Regenerative & Disc Brakes', desc: 'Shiny brake discs on the wheels and axles with brake calipers on the bogie frames. Most of the slowing down is done by the motors themselves.',
      funFact: 'When the train slows down, its motors work as generators and send electricity back into the overhead wire for other trains to use.',
    },
    gangway: {
      name: 'Full-Width Gangway Covers & Couplers', desc: 'Smooth rubber covers wrap the gaps between cars, with walk-through gangways and couplers inside.',
      funFact: 'Covering the gaps between cars smooths the airflow and makes the train much quieter at 300 km/h.',
    },
    track: {
      name: 'Shinkansen Slab Track & Rails', desc: 'Instead of gravel, the rails sit on precast concrete slabs laid on a cushion of cement-asphalt mortar. Round concrete bosses between the slabs hold them in place, all on a concrete viaduct.',
      funFact: 'Slab track keeps the rails perfectly lined up for years, which is one reason Shinkansen rides are so smooth.',
    },
  },
  quiz: [
    { q: 'Which part of the N700S has sharp “wing” edges to stop a loud boom when the train enters a tunnel?', correctId: 'aero-nose-cone', distractors: ['passenger-saloon-seats', 'diaphragm-gangway-coupler', 'bogies-wheelsets'] },
    { q: 'Which roof part reaches up to the overhead wire to collect 25,000-volt electricity?', correctId: 'pantograph-catenary', distractors: ['driver-cab-cockpit', 'regenerative-eddy-brakes', 'slab-track-rails'] },
    { q: 'Which underfloor part uses tiny silicon-carbide chips to control the motors?', correctId: 'sic-traction-transformer', distractors: ['passenger-saloon-seats', 'aero-nose-cone', 'diaphragm-gangway-coupler'] },
  ],
};

// ---------------------------------------------------------------------------
// China Railway CR400AF Fuxing Hao
// ---------------------------------------------------------------------------
const CR_TRACK = {
  slabLen: 5.6, slabGap: 0.07, slabW: 2.5, slabH: 0.2, mortarH: 0.09, padH: 0.03, seatH: 0.04, bedH: 0.24, bedW: 3.1, fastPitch: 0.63, scc: true,
  deckW: 4.9, girderW: 3.2, parapetH: 0.55, troughW: 0.44, clipColor: 0x2b2e33,
  deckTint: 0x6e747a, girderTint: 0x585e64, slabTint: 0x878d93, bedTint: 0x767c82, lidTint: 0x62686e,
};
const CR400AF = {
  id: 'cr400af-fuxing',
  kind: 'rail',
  midCars: 2,
  endLen: 27.6,
  midLen: 25.0,
  gap: 0.6,
  xTip: (27.6 * MS) / 2,
  frontBogie: 6.35,
  bogieOverhang: 3.75,
  bogieSpacing: 17.5,
  floorY: 1.26,
  axisY: 2.2,
  couplerY: 1.0,
  wireH: 5.3,
  pantoFairing: true,
  pantoInsH: 0.42,
  pantographs: [{ car: 2, s: 7.5 }],
  seamS: 0.5,
  colors: { skirt: 0x3a3f46, bogie: 0x30353c, damper: 0x6b7280, caliper: 0x3a3f46, seat: 0x3c5d8f, floor: 0x7d746b, cabSeat: 0x2f3a4a },
  skirt: { y0: 0.4, y1: 1.02, w: 2.98 },
  tex: { yMin: 0.4, yMax: 4.12 },
  denseZones: [[3.6, 4.9, 0.06], [0, 1.2, 0.04]],
  shape: {
    noseLen: 8.8,
    yTip: 1.12,
    sCap: 0.75,
    body: { yBot: 0.96, zE: 1.68, yE: 1.95, yTop: 4.05, alpha: 90, beta: 0, kU1: 0.84, kU2: 0.7, kL1: 0.5, kL2: 0.74 },
    top: [[0, 1.42], [0.8, 1.72], [1.6, 2.04], [2.6, 2.5], [3.6, 2.96], [4.6, 3.36], [5.6, 3.68], [6.6, 3.9], [7.6, 4.01], [8.8, 4.05], [9.8, 4.05]],
    bot: [[0, 0.82], [0.8, 0.66], [1.6, 0.6], [2.6, 0.58], [3.6, 0.6], [4.15, 0.72], [4.55, 0.96], [8.8, 0.96], [9.8, 0.96]],
    yE: [[0, 1.13], [0.6, 1.11], [1.4, 1.15], [2.4, 1.25], [3.4, 1.39], [4.4, 1.54], [5.4, 1.69], [6.4, 1.81], [7.6, 1.92], [8.8, 1.95], [9.8, 1.95]],
    zE: [[0, 0.78], [0.6, 0.86], [1.4, 1.04], [2.4, 1.24], [3.4, 1.41], [4.4, 1.53], [5.4, 1.62], [6.4, 1.66], [7.6, 1.68], [8.8, 1.68], [9.8, 1.68]],
    alpha: [[0, 40], [1.5, 46], [3, 54], [4.5, 64], [6, 75], [7.5, 85], [8.8, 90], [9.8, 90]],
    beta: [[0, 44], [1.5, 33], [3, 22], [4.5, 12], [6, 5], [7.5, 1], [8.8, 0], [9.8, 0]],
    kU1: [[0, 0.42], [4, 0.52], [8.8, 0.84], [9.8, 0.84]],
    kU2: [[0, 0.56], [4, 0.6], [8.8, 0.7], [9.8, 0.7]],
    kL1: [[0, 0.5], [8.8, 0.5], [9.8, 0.5]],
    kL2: [[0, 0.76], [8.8, 0.74], [9.8, 0.74]],
  },
  windshield: {
    s0: 2.62, s1: 5.95, frit: 0.16, fritG: 0.07,
    gLow: (s) => 1 - 0.74 * Math.sin((Math.PI / 2) * clamp01((s - 2.62) / 1.5)) ** 0.7 - 0.06 * smoothstep(4.6, 5.95, s),
  },
  cab: { deskY: 2.35, deskW: 1.9 },
  headlight: { s0: 1.2, s1: 2.75, g0: 0.03, g1: 0.17, round: 0.4, tilt: 0.08 },
  taillight: { s0: 2.82, s1: 3.2, g0: 0.05, g1: 0.15, round: 0.5 },
  seats: { pitch: 1.0, midStart: 3.6, midTail: 3.4, endStart: 13.0, endTail: 3.0, rackY: 2.95, blocks: [[-1.17, -0.72, -0.27], [0.64, 1.09]] },
  ride: { vmax: 350, vboost: 420, powerMW: 10.1, region: 'cn', kv: '27.5 kV' },
  trackStyle: CR_TRACK,
  camera: { pos: [3.55, 1.32, 5.45], target: [-0.45, -0.1, 0], maxR: 26 },
  explode: {
    nose: [1.6, 0.16, 0], body: [0, 1.1, 0], cab: [0.7, 1.65, 0], panto: [0, 2.0, 0], bogies: [0, -0.04, 1.15],
    motors: [0, -0.04, 1.75], power: [0, -0.04, -1.45], seats: [0, 0.34, 0], brakes: [0, -0.04, 0.62], gangway: [0, 0.52, -0.8], track: [0, 0, -0.55],
  },
  trackPartId: 'slab-track-rails',
  buildTrack: buildSlabTrack(CR_TRACK),
  addRoofExtras(B, cars, k) {
    // high-voltage roof cable on insulators running along the middle cars (links the pantograph cars)
    const yRoof = k.bodyP.yTop;
    for (const car of cars) {
      if (car.end) continue;
      for (let s = 1.2; s <= car.L - 1.2; s += 3.2) B.cyl(0.05 * MS, 0.07 * MS, 0.24 * MS, 10, k.mats.insulator, toScene(car, s, yRoof + 0.1, -0.45));
      const a = toScene(car, 1.0, yRoof + 0.24, -0.45);
      B.cyl(0.035 * MS, 0.035 * MS, (car.L - 2.0) * MS, 8, k.mats.dark, [a[0] - ((car.L - 2.0) / 2) * MS, a[1], a[2]], [0, 0, Math.PI / 2]);
      // roof-mounted air-conditioning intake grilles
      for (const s of [4.5, car.L - 4.5]) B.rbox(2.2 * MS, 0.06 * MS, 1.2 * MS, 0.03 * MS, k.mats.metal, toScene(car, s, yRoof + 0.01, 0.35));
    }
  },
  equipment: (car) => (car.end
    ? [{ s: 13.0, len: 3.0, type: 'battery' }, { s: 17.0, len: 3.6, type: 'box', fins: true }, { s: 20.8, len: 2.4, type: 'box' }]
    : car.idx === 1
      ? [{ s: 7.6, len: 4.4, type: 'transformer', fins: true }, { s: 12.8, len: 3.6, type: 'box', fins: true }, { s: 16.8, len: 3.0, type: 'box' }]
      : [{ s: 7.4, len: 3.6, type: 'box', fins: true }, { s: 12.2, len: 4.0, type: 'box', fins: true }, { s: 16.6, len: 2.8, type: 'box' }]),
  paint(ctx, V, kind, cfg) {
    const L = V.len;
    const red = '#c8102e';
    const dark = '#262b33';
    ctx.fillStyle = '#f6f7f9';
    ctx.fillRect(0, 0, V.w, V.h);
    ctx.fillStyle = '#d2d6dc';
    fillRectM(ctx, V, -1, L + 1, -1, 0.995);
    const Ln = cfg.shape.noseLen;
    const end = kind === 'end';
    const edgeY = (s) => (end && s < Ln ? cfg.section(s).yE : 1.95);
    if (end) {
      ctx.fillStyle = '#2d3238';
      bandPath(ctx, V, steps(-0.2, 4.8, 0.05), (s) => 0.8 + 0.1 * smoothstep(4.0, 4.8, s), () => -1);
      ctx.fill();
    }
    // red "dragon" swoosh: the body band rises along the nose cheek, widens, then tapers to the headlights
    const lift = (s) => (end ? 0.13 * Math.exp(-(((s - 3.6) / 1.9) ** 2)) : 0);
    const thick = (s) => (end ? 0.14 + 0.1 * Math.exp(-(((s - 3.9) / 1.6) ** 2)) : 0.14) * (end ? smoothstep(1.0, 2.6, s) : 1);
    const ctr = (s) => edgeY(s) - 0.04 + lift(s);
    const sl = end ? steps(0.95, Ln, 0.05).concat([L + 1]) : [-1, L + 1];
    ctx.fillStyle = red;
    bandPath(ctx, V, sl, (s) => ctr(s) + thick(s) / 2, (s) => ctr(s) - thick(s) / 2);
    ctx.fill();
    // thin dark accent above the swoosh on the nose, thin red pinstripe below everywhere
    if (end) {
      ctx.fillStyle = dark;
      const at = (s) => ctr(s) + thick(s) / 2 + 0.05;
      const ath = (s) => 0.045 * smoothstep(1.6, 3.0, s) * (1 - smoothstep(6.5, 8.6, s));
      bandPath(ctx, V, steps(1.5, 8.7, 0.05), (s) => at(s) + ath(s), at);
      ctx.fill();
    }
    ctx.fillStyle = red;
    const pt = (s) => ctr(s) - thick(s) / 2 - 0.08;
    const pth = (s) => (end ? 0.04 * smoothstep(2.4, 4.6, s) : 0.04);
    bandPath(ctx, V, end ? steps(2.2, Ln, 0.05).concat([L + 1]) : [-1, L + 1], pt, (s) => pt(s) - pth(s));
    ctx.fill();
    const win = { y0: 2.14, y1: 2.8, w: 0.84, r: 0.12 };
    const doorY = [1.32, 3.33];
    const doorWin = { inset: 0.33, y0: 2.4, y1: 2.98 };
    const drawWindows = (a, b) => {
      for (let s = a; s + win.w <= b + 1e-6; s += 1.0) paintWindow(ctx, V, s, s + win.w, win.y0, win.y1, win.r);
    };
    if (end) {
      paintDoor(ctx, V, 7.45, 8.15, 1.42, 3.12, { inset: 0.16, y0: 2.42, y1: 2.92 });
      textRun(ctx, V, 9.6, 2.3, [{ t: 'CR', h: 0.44, font: `italic 900 {px} ${SANS}`, color: red, skew: 0.16 }]);
      textRun(ctx, V, 11.55, 2.28, [{ t: '复兴号', h: 0.5, font: `900 {px} ${CJK_SERIF}`, color: red }]);
      drawWindows(13.05, L - 2.6);
      paintDoor(ctx, V, L - 2.15, L - 1.15, doorY[0], doorY[1], doorWin);
      textRun(ctx, V, L - 3.3, 3.38, [{ t: 'CR400AF', h: 0.13, font: `700 {px} ${SANS}`, color: '#3b4048' }]);
    } else {
      paintDoor(ctx, V, 1.15, 2.15, doorY[0], doorY[1], doorWin);
      paintDoor(ctx, V, L - 2.15, L - 1.15, doorY[0], doorY[1], doorWin);
      paintDisplay(ctx, V, 2.4, 3.3, 2.95, 3.12, '#ff5a3c', '北京南 Beijing');
      textRun(ctx, V, 2.85, 2.35, [{ t: 'CR', h: 0.2, font: `italic 900 {px} ${SANS}`, color: red, skew: 0.16 }]);
      drawWindows(3.6, L - 3.45);
    }
    ctx.fillStyle = 'rgba(120,130,142,0.32)';
    fillRectM(ctx, V, end ? Ln + 0.4 : 0, L, 3.62, 3.63);
  },
  text: {
    name: 'CR400AF Fuxing Hao 复兴号',
    brand: 'China Railway • CRRC Qingdao Sifang',
    badge: '350 km/h • Dragon-head nose',
    desc: 'China’s own-design “Fuxing” (复兴, Rejuvenation) high-speed train, cruising at 350 km/h on lines like Beijing–Shanghai since 2017. Real sets have 8 or 16 cars; here you see the lead car, two middle cars and the tail car on CRTS III slab track.',
  },
  parts: {
    nose: {
      name: 'Rounded “Dragon-Head” Nose', desc: 'The smooth, rounded nose about 9 m long, with slanted LED headlights and the red “dragon” swoosh. Its shape lets air slide over the train with very little drag.',
      funFact: 'In a 2016 test, two Fuxing prototypes zoomed past each other at 420 km/h each — a closing speed of 840 km/h!',
    },
    body: {
      name: 'Aluminum Carbody Shells', desc: 'Lightweight, airtight aluminum car bodies. Fuxing trains are taller than Japanese bullet trains (4.05 m) because China’s railways allow bigger trains, giving passengers more room.',
      funFact: '复兴号 (Fùxīng Hào) means “Rejuvenation”. China’s high-speed network is now longer than the distance around the Earth — over 45,000 km!',
    },
    cab: {
      name: 'Driver Cab & Panoramic Windshield', desc: 'A big wraparound windshield, the driver’s seat and a control desk with screens for the CTCS train-control system.',
      funFact: 'On some Fuxing lines the train can drive itself between stations (automatic train operation), while the driver keeps watch.',
    },
    panto: {
      name: 'Single-Arm Pantograph & Roof Cable', desc: 'The roof pantograph collects 27.5 kV from the overhead wire. A high-voltage cable on white insulators runs along the roof to share the power between cars.',
      funFact: 'The pantograph presses on the wire with about the same force as holding a big bag of rice — enough to keep contact at 350 km/h without bouncing.',
    },
    bogies: {
      name: 'Bogies, Air Springs & Wheelsets', desc: 'Two bogies per car with steel wheelsets, coil springs, air springs and yaw dampers. Sensors on the bogies check temperatures and vibrations all the time.',
      funFact: 'A Fuxing train carries over 2,500 sensors that keep checking the wheels, bogies, brakes and doors while it runs.',
    },
    motors: {
      name: 'Traction Motors & Gearboxes', desc: 'Electric motors on the bogies of the powered cars spin the axles through gearboxes.',
      funFact: 'An 8-car Fuxing train has about 10,000 kW of power — like more than 100 family cars working together!',
    },
    power: {
      name: 'Transformer & Traction Converters', desc: 'Underfloor boxes that turn the 27.5 kV from the wire into the right kind of electricity for the motors and the air-conditioning.',
      funFact: 'The traction converters can change the power’s frequency thousands of times a second to control the motor speed smoothly.',
    },
    seats: {
      name: 'Passenger Saloons & Seats', desc: 'Second-class rows of 3 + 2 blue seats with white head covers, power sockets and luggage racks.',
      funFact: 'Fuxing trains have Wi-Fi and a power socket at every seat so passengers can charge their phones at 350 km/h.',
    },
    brakes: {
      name: 'Regenerative & Disc Brakes', desc: 'Disc brakes on the wheels and axles plus regenerative braking, where the motors slow the train down and make electricity.',
      funFact: 'Most of the braking from 350 km/h is done by the motors acting as generators, so the brake pads barely wear out.',
    },
    gangway: {
      name: 'Sealed Gangways & Couplers', desc: 'Rubber gangway covers between cars keep the inside quiet and airtight; the couplers hold the cars together.',
      funFact: 'The whole train is pressure-sealed, so even passing another train at 700 km/h combined doesn’t make your ears pop.',
    },
    track: {
      name: 'CRTS III Slab Track & Rails', desc: 'China’s CRTS III ballastless track: precast concrete slabs on a self-compacting concrete layer, with welded rails held by elastic fastenings, on a concrete viaduct.',
      funFact: 'About half of China’s high-speed lines run on long viaducts — the Danyang–Kunshan bridge is 164 km long, the longest bridge in the world!',
    },
  },
  quiz: [
    { q: 'Which part of the Fuxing train has the red “dragon” swoosh and pushes the air aside?', correctId: 'aero-nose-cone', distractors: ['sic-traction-transformer', 'passenger-saloon-seats', 'slab-track-rails'] },
    { q: 'Fuxing trains glide on precast concrete slabs instead of gravel. Which part is that?', correctId: 'slab-track-rails', distractors: ['bogies-wheelsets', 'diaphragm-gangway-coupler', 'aluminum-carbody-shell'] },
    { q: 'Which part spins the axles to move the train?', correctId: 'traction-motors-gearbox', distractors: ['pantograph-catenary', 'driver-cab-cockpit', 'regenerative-eddy-brakes'] },
  ],
};

// ---------------------------------------------------------------------------
// JR Central SCMaglev L0 Series
// ---------------------------------------------------------------------------
const L0_GUIDEWAY = { inner: 1.92, wallT: 0.42, wallH: 1.3, floorT: 0.45, girderW: 3.4, wheelZ: 1.12, coilY0: 0.12, coilY1: 1.2 };
const L0 = {
  id: 'scmaglev-l0',
  kind: 'maglev',
  midCars: 2,
  endLen: 28.0,
  midLen: 24.3,
  gap: 0.5,
  xTip: 2.35,
  frontBogie: 12.6,
  floorY: 0.98,
  axisY: 1.9,
  couplerY: 0.85,
  seamS: 0,
  colors: { skirt: 0x5b6169, bogie: 0x3a4048, damper: 0x6b7280, caliper: 0x3a3f46, seat: 0x23395d, floor: 0x7e7a75, cabSeat: 0x2a3446 },
  skirt: { y0: 0.36, y1: 0.66, w: 2.2 },
  tex: { yMin: 0.38, yMax: 3.66 },
  denseZones: [[0, 1.4, 0.05]],
  noseRings: 96,
  shape: {
    noseLen: 15.0,
    yTip: 0.92,
    sCap: 1.1,
    body: { yBot: 0.55, zE: 1.45, yE: 1.3, yTop: 3.6, alpha: 90, beta: 0, kU1: 0.66, kU2: 0.6, kL1: 0.5, kL2: 0.62 },
    top: [[0, 1.14], [1, 1.27], [2.5, 1.46], [4.5, 1.76], [6.5, 2.1], [8.5, 2.48], [10.5, 2.9], [12.5, 3.3], [14, 3.53], [15, 3.6], [16, 3.6]],
    bot: [[0, 0.7], [1, 0.6], [3, 0.56], [15, 0.55], [16, 0.55]],
    yE: [[0, 0.93], [1, 0.9], [3, 0.94], [6, 1.04], [9, 1.14], [12, 1.23], [14, 1.29], [15, 1.3], [16, 1.3]],
    zE: [[0, 0.46], [1, 0.58], [3, 0.84], [6, 1.12], [9, 1.31], [12, 1.41], [14, 1.45], [15, 1.45], [16, 1.45]],
    alpha: [[0, 20], [3, 25], [6, 34], [9, 48], [12, 68], [14, 84], [15, 90], [16, 90]],
    beta: [[0, 40], [3, 28], [6, 16], [9, 8], [12, 3], [15, 0], [16, 0]],
    kU1: [[0, 0.34], [6, 0.4], [12, 0.56], [15, 0.66], [16, 0.66]],
    kU2: [[0, 0.5], [8, 0.55], [15, 0.6], [16, 0.6]],
    kL1: [[0, 0.5], [15, 0.5], [16, 0.5]],
    kL2: [[0, 0.7], [15, 0.62], [16, 0.62]],
    bump: [11.3, 1.1, 0.07],
  },
  windshield: {
    s0: 10.25, s1: 12.35, frit: 0.14, fritG: 0.05,
    gLow: (s) => 1 - 0.42 * Math.sin((Math.PI / 2) * clamp01((s - 10.25) / 0.75)) ** 0.8,
  },
  cab: { deskY: 2.35, deskW: 1.4 },
  headlight: { s0: 1.5, s1: 2.7, g0: -0.05, g1: 0.09, round: 0.4 },
  taillight: { s0: 2.78, s1: 3.15, g0: -0.04, g1: 0.07, round: 0.5 },
  seats: { pitch: 0.98, midStart: 3.2, midTail: 3.2, endStart: 17.6, endTail: 3.0, rackY: 2.55, blocks: [[-0.84, -0.4], [0.4, 0.84]] },
  ride: { vmax: 500, vboost: 603, powerMW: 0, region: 'maglev', kv: 'LSM', liftOff: 150, wheelR: 0.33 },
  guideway: L0_GUIDEWAY,
  camera: { pos: [3.7, 1.42, 5.55], target: [-0.35, -0.12, 0], maxR: 26 },
  explode: {
    nose: [1.9, 0.18, 0], body: [0, 1.05, 0], cab: [0.6, 1.55, 0], panto: [0, 0.55, 1.25], bogies: [0, -0.04, 1.35],
    motors: [0, 0.1, 2.0], power: [0, 0.2, -1.45], seats: [0, 0.32, 0], brakes: [0, -0.04, 0.75], gangway: [0, 0.5, -0.8], track: [0, 0, -0.7],
  },
  trackPartId: 'maglev-guideway-coils',
  buildTrack: buildGuideway(L0_GUIDEWAY),
  equipment: (car) => {
    const a = car.end ? 16.5 : 3.6;
    const b = car.L - 3.6;
    return [{ s: a + (b - a) * 0.25, len: (b - a) * 0.4, type: 'battery', w: 1.9 }, { s: a + (b - a) * 0.72, len: (b - a) * 0.4, type: 'box', fins: true, w: 1.9 }];
  },
  paint(ctx, V, kind, cfg) {
    const L = V.len;
    const blue = '#0f5fb0';
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, V.w, V.h);
    ctx.fillStyle = '#cdd2d8';
    fillRectM(ctx, V, -1, L + 1, -1, 0.6);
    const Ln = cfg.shape.noseLen;
    const end = kind === 'end';
    const edgeY = (s) => (end && s < Ln ? cfg.section(s).yE : 1.3);
    // JR Central blue band: low along the body, sweeping forward along the nose edge to a point
    const top = (s) => edgeY(s) + 0.36 * (end ? smoothstep(0.0, 1.0, (s - 1.4) / 13.6) : 1);
    const th = (s) => (end ? 0.22 * smoothstep(1.4, 6.0, s) : 0.22);
    ctx.fillStyle = blue;
    bandPath(ctx, V, end ? steps(1.3, Ln, 0.05).concat([L + 1]) : [-1, L + 1], top, (s) => top(s) - th(s));
    ctx.fill();
    const pin = (s) => top(s) - th(s) - 0.06;
    bandPath(ctx, V, end ? steps(3.5, Ln, 0.05).concat([L + 1]) : [-1, L + 1], pin, (s) => pin(s) - 0.035 * (end ? smoothstep(3.5, 7, s) : 1));
    ctx.fill();
    const win = { y0: 1.98, y1: 2.34, w: 0.46, r: 0.1 };
    const drawWindows = (a, b) => {
      for (let s = a; s + win.w <= b + 1e-6; s += 0.98) paintWindow(ctx, V, s, s + win.w, win.y0, win.y1, win.r, 0.03);
    };
    const doorY = [1.12, 3.0];
    const doorWin = { inset: 0.3, y0: 2.2, y1: 2.65 };
    if (end) {
      textRun(ctx, V, 13.5, 1.98, [
        { t: 'L', h: 0.52, font: `italic 900 {px} ${SANS}`, color: blue, skew: 0.15 },
        { t: '0', h: 0.52, font: `italic 900 {px} ${SANS}`, color: '#1d9be0', skew: 0.15 },
      ]);
      textRun(ctx, V, 13.5, 1.78, [{ t: 'SCMAGLEV', h: 0.09, font: `700 {px} ${SANS}`, color: '#4a5568' }]);
      drawWindows(17.4, L - 2.4);
      paintDoor(ctx, V, L - 2.0, L - 1.1, doorY[0], doorY[1], doorWin);
      textRun(ctx, V, 15.9, 2.1, [{ t: 'JR', h: 0.22, font: `900 {px} ${SANS}`, color: '#f37321', skew: 0.08 }]);
    } else {
      paintDoor(ctx, V, 1.0, 1.9, doorY[0], doorY[1], doorWin);
      paintDoor(ctx, V, L - 1.9, L - 1.0, doorY[0], doorY[1], doorWin);
      drawWindows(2.9, L - 2.4);
    }
    ctx.fillStyle = 'rgba(120,130,142,0.3)';
    fillRectM(ctx, V, end ? Ln + 0.4 : 0, L, 3.05, 3.06);
  },
  text: {
    name: 'SCMaglev L0 Series',
    brand: 'JR Central • Chuo Shinkansen',
    badge: '603 km/h world record • Maglev',
    desc: 'Japan’s superconducting maglev floats about 10 cm off its U-shaped concrete guideway. In 2015 a 7-car L0 set reached 603 km/h — the fastest any train has ever gone. It is being built to link Tokyo and Nagoya in about 40 minutes.',
  },
  parts: {
    nose: {
      name: '15 m Ultra-Long Aero Nose', desc: 'An extremely long, flat nose — more than half the length of the car — so the train can rush into tunnels at 500 km/h without a booming pressure wave.',
      funFact: 'At 500 km/h the L0 travels about 139 meters every second — longer than a football field and a half!',
    },
    body: {
      name: 'Lightweight Airtight Carbody', desc: 'Narrow, round, pressure-sealed car bodies (2.9 m wide) with small airplane-style windows and the blue JR Central stripe.',
      funFact: 'The L0 is narrower and rounder than a Shinkansen to make it lighter and to cut air resistance in the guideway.',
    },
    cab: {
      name: 'Crew Cabin & Forward Camera Window', desc: 'A small dark visor on the nose. There is no driver’s steering or throttle: the train is controlled from a control center by computers, and cameras watch the guideway ahead.',
      funFact: 'SCMaglev trains are driven automatically by the power of the guideway itself — whoever controls the coils controls the speed!',
    },
    panto: {
      name: 'Inductive Power-Collection Coils (No Pantograph!)', desc: 'Panels on the lower body pick up electricity wirelessly from coils in the guideway, like a giant wireless phone charger. They power the lights and air-conditioning.',
      funFact: 'There are no overhead wires at all: nothing touches the train while it flies along at 500 km/h.',
    },
    bogies: {
      name: 'Maglev Bogies & Rubber-Tyred Landing Wheels', desc: 'Bogies sit under the car joints and the noses. Below about 150 km/h the train rolls on rubber tyres like an airplane; above that it lifts off and the wheels tuck up.',
      funFact: 'The L0 takes off a bit like a plane — it rolls on wheels at first, then floats about 10 cm above the guideway at high speed.',
    },
    motors: {
      name: 'Superconducting Magnets (–269 °C)', desc: 'Silver magnet units on both sides of each bogie, filled with super-cold liquid helium. The guideway coils pull and push on these magnets to lift, steer and propel the train.',
      funFact: 'The magnet coils are cooled to about –269 °C, colder than outer space near Earth, so electricity flows through them forever with zero resistance.',
    },
    power: {
      name: 'On-Board Batteries & Power Converters', desc: 'Underfloor batteries and converters store the wirelessly collected power for the lights, doors, air-conditioning and the magnets’ cooling system.',
      funFact: 'The train itself has no traction motors at all — the “motor” is stretched out along the whole guideway!',
    },
    seats: {
      name: 'Passenger Cabin (2 + 2 Seats)', desc: 'A narrow cabin with two seats on each side of the aisle and small round-cornered windows.',
      funFact: 'Even at 500 km/h the ride is quiet and smooth because the train floats without wheels touching anything.',
    },
    brakes: {
      name: 'Regenerative LSM & Wheel Disc Brakes', desc: 'To slow down, the guideway coils run in reverse and turn the train’s motion back into electricity. Disc brakes on the landing wheels help for the final stop.',
      funFact: 'Because nothing rubs while it floats, the L0 uses the guideway’s magnetic forces to brake from 500 km/h.',
    },
    gangway: {
      name: 'Articulated Gangways', desc: 'Covered gangways at the car joints. The cars share one bogie at each joint, so the whole train bends smoothly like a snake.',
      funFact: 'Sharing bogies between cars saves weight — and every kilogram counts when you are floating on magnets!',
    },
    track: {
      name: 'U-Shaped Guideway & Figure-8 Coils', desc: 'A concrete U-shaped guideway. Its sidewalls are lined with figure-8 “null-flux” coils that lift and center the train, plus propulsion coils that pull it along.',
      funFact: 'When the train is exactly centered, the two loops of each figure-8 coil cancel out; if it drifts or sinks, the coils push it right back — no computer needed!',
    },
  },
  quiz: [
    { q: 'Which part of the L0 holds super-cold magnets that the guideway pushes on to lift the train?', correctId: 'traction-motors-gearbox', distractors: ['passenger-saloon-seats', 'diaphragm-gangway-coupler', 'aero-nose-cone'] },
    { q: 'Which concrete part has figure-8 coils in its walls that lift, steer and propel the maglev?', correctId: 'maglev-guideway-coils', distractors: ['aluminum-carbody-shell', 'regenerative-eddy-brakes', 'driver-cab-cockpit'] },
    { q: 'The L0 has no pantograph. Which part collects electricity wirelessly?', correctId: 'pantograph-catenary', distractors: ['bogies-wheelsets', 'sic-traction-transformer', 'aero-nose-cone'] },
  ],
};

export const TRAIN_CONFIGS = [N700S, CR400AF, L0];
export const TRAIN_MODELS = TRAIN_CONFIGS.map((cfg) => buildTrainset(cfg));
// Dev-only hooks (section plots / probes); harmless at runtime.
export const TRAIN_DEBUG = { halfProfile, sectionPointG, sectionCurves };
