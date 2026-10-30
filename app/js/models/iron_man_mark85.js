// ============================================================================
// Marvel Comics Iron Man Powered Exoskeleton — Collector-Grade 1:1 Realism
// (Eliot R. Brown OHOTMU Schematics • Bob Layton Model 4 • Adi Granov Extremis)
//
// Photorealistic Aerospace & Diecast Engineering Upgrade:
// 1. True Sobel Tangent-Space Normal Maps + Roughness Maps (512×512 linear):
//    - CNC machined aerospace panel seams, chamfered bevels & micro-rivets on
//      deep Candy-Apple Anodized Clearcoat Crimson plates.
//    - Magnetically polarized 22K Champagne Titanium-Gold micro-chainmail weave
//      & directional lathe brushing on the canonical golden bicep & thigh sleeves.
//    - Diamond-quilted Kevlar/Nomex ballistic thermal liner on every inner wall.
// 2. Canonical Marvel Comics Red & Gold Blocking + Multi-Plate Mechanical Detail:
//    - Hinged 22K Champagne Gold faceplate with dark recessed CNC shut-line,
//      pointed Crimson widow's-peak V-crest, multi-lens sapphire HUD eye slits,
//      stepped vocal-grille mouth slit, split mandible chin guard & knurled ear pods.
//    - Interlocking Crimson pectoral clamshell over a dark anodized titanium
//      sub-frame reveal, NACA cooling vents, hex fasteners & a 3D 12-coil copper
//      tokamak Chest Unibeam beneath a curved sapphire crystal dome.
//    - Flared Crimson comic shoulder pauldrons with 6-tube brass munition pods,
//      rotary hydraulic elbow/knee/ankle bearings, 5-fingered multi-phalange
//      articulated hands, 4-lame Crimson rib girdle + Gold V-belt + Crimson trunks,
//      machined twin circular Hip Power Pods, and flared Crimson jet boots with
//      Eliot R. Brown calf ram-air louvers & gimbaled 12-vane sole turbo-nozzles.
// 3. 100% True Double-Walled Hollow Wearable Architecture ("Room for a Person Inside"):
//    - Every armor plate and limb cylinder is a watertight, open-ended double-walled
//      hollow shell (~10–15 mm wall thickness) surrounding the unmistakable hollow
//      human pilot cavity, thermocouple undersuit sheath & neuro-transponder HUD.
// ============================================================================
import * as THREE from '../../vendor/three.module.js';
import { brushedMetal, chromeMat, glassMat, emissiveMat, mat } from '../materials.js';
import { loftRings, surfaceGrid, MeshBatch, smoothCurve, smoothstep, cachedCanvasTexture } from '../loft.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const gauss = (x, mu, sig) => Math.exp(-0.5 * ((x - mu) / sig) ** 2);

// ----------------------------------------------------------------------------
// True Tangent-Space Sobel Normal & Roughness Map Generators
// ----------------------------------------------------------------------------

/** Convert a Float32 heightfield [0..1] into a tangent-space RGB normal map on `ctx`. */
function bakeSobelNormalToCanvas(ctx, w, h, heightArr, strength = 3.2) {
  const img = ctx.createImageData?.(w, h);
  if (!img?.data) return;
  const d = img.data;
  const at = (x, y) => heightArr[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1);
      const tc = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const ml = at(x - 1, y);
      const mr = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const bc = at(x, y + 1);
      const br = at(x + 1, y + 1);

      const dx = (tr + 2 * mr + br - (tl + 2 * ml + bl)) * strength;
      const dy = (bl + 2 * bc + br - (tl + 2 * tc + tr)) * strength;
      let nx = -dx;
      let ny = dy; // WebGL tangent-space +Y up
      let nz = 1.0;
      const inv = 1 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;

      const idx = (y * w + x) * 4;
      d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Build CNC aerospace armor panel seam + micro-rivet + satin brush normal & roughness maps. */
function getArmorPanelPbrMaps() {
  const S = 512;
  const buildHeight = () => {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#c8c8c8';
    g.fillRect(0, 0, S, S);

    // Fine directional aerospace satin finish
    for (let y = 0; y < S; y += 2) {
      const v = 196 + ((y * 17) % 11) - 5;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(0, y, S, 1);
    }

    // Beveled CNC armor panel seams (outer soft bevel + sharp dark shut-line)
    const drawSeam = (pts) => {
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = '#ececec';
      g.lineWidth = 7;
      g.beginPath();
      pts.forEach(([x, y], idx) => (idx ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();

      g.strokeStyle = '#242424';
      g.lineWidth = 2.4;
      g.beginPath();
      pts.forEach(([x, y], idx) => (idx ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    };

    for (const yf of [0.22, 0.52, 0.80]) {
      const y = yf * S;
      drawSeam([
        [0, y],
        [S * 0.30, y + 14],
        [S * 0.50, y + 2],
        [S * 0.70, y + 14],
        [S, y],
      ]);
      // Precision recessed micro-rivets flanking panel corners
      for (const xf of [0.08, 0.28, 0.32, 0.48, 0.52, 0.68, 0.72, 0.92]) {
        const rx = xf * S;
        const ry = y + (xf > 0.25 && xf < 0.75 ? 18 : 8);
        g.fillStyle = '#383838';
        g.beginPath();
        g.arc(rx, ry, 2.2, 0, TAU);
        g.fill();
        g.fillStyle = '#b4b4b4';
        g.beginPath();
        g.arc(rx, ry, 1.0, 0, TAU);
        g.fill();
      }
    }
    drawSeam([
      [S * 0.5, 0],
      [S * 0.5, S * 0.22],
    ]);
    drawSeam([
      [S * 0.5, S * 0.52],
      [S * 0.5, S * 0.80],
    ]);

    const imgData = g.getImageData?.(0, 0, S, S);
    if (!imgData?.data) return new Float32Array(S * S).fill(0.75);
    const raw = imgData.data;
    const h = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) h[i] = raw[i * 4] / 255;
    return h;
  };

  let cachedH = null;
  const ensureH = () => {
    if (!cachedH) cachedH = buildHeight();
    return cachedH;
  };

  const normal = cachedCanvasTexture(
    'im-realistic-armor-normal-v3',
    S,
    S,
    (ctx, w, h) => bakeSobelNormalToCanvas(ctx, w, h, ensureH(), 3.6),
    { repeat: [2, 2], linear: true, anisotropy: 8 },
  );

  const roughness = cachedCanvasTexture(
    'im-realistic-armor-rough-v3',
    S,
    S,
    (ctx, w, h) => {
      const hArr = ensureH();
      const img = ctx.createImageData?.(w, h);
      if (!img?.data) return;
      const d = img.data;
      for (let i = 0; i < w * h; i++) {
        // Glossy clearcoat plates (~34/255 -> 0.13) with matte oil/shadow in panel seams (~175/255)
        const seamFactor = clamp((0.76 - hArr[i]) * 2.4, 0, 1);
        const rVal = Math.round(lerp(34, 185, seamFactor));
        d[i * 4] = rVal;
        d[i * 4 + 1] = rVal;
        d[i * 4 + 2] = rVal;
        d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat: [2, 2], linear: true, anisotropy: 8 },
  );

  return { normal, roughness };
}

/** Build Marvel Comics polarized 22K titanium-gold micro-chainmail + brushed alloy normal & roughness maps. */
function getGoldMicroMeshPbrMaps() {
  const S = 512;
  let cachedH = null;
  const ensureH = () => {
    if (cachedH) return cachedH;
    const h = new Float32Array(S * S);
    const freqX = 36;
    const freqY = 48;
    for (let y = 0; y < S; y++) {
      const v = y / S;
      // Subtle radial brushed lathe lines
      const brush = 0.04 * Math.sin(v * TAU * 128) + 0.02 * Math.cos(v * TAU * 63);
      // Articulated flex-ring seam grooves
      const seam =
        -0.38 *
        (gauss(v, 0.25, 0.008) + gauss(v, 0.50, 0.008) + gauss(v, 0.75, 0.008));
      for (let x = 0; x < S; x++) {
        const u = x / S;
        // Interlocking polarized hexagonal micro-scale / chainmail relief
        const row = v * freqY;
        const rowIdx = Math.floor(row);
        const fy = row - rowIdx;
        const ux = u * freqX + (rowIdx % 2) * 0.5;
        const fx = ux - Math.floor(ux);
        const dx = fx - 0.5;
        const dy = fy - 0.5;
        const scalePillow = clamp(1 - (dx * dx * 3.1 + dy * dy * 3.1), 0, 1);
        h[y * S + x] = clamp(0.62 + 0.16 * scalePillow + brush + seam, 0, 1);
      }
    }
    cachedH = h;
    return h;
  };

  const normal = cachedCanvasTexture(
    'im-realistic-goldmesh-normal-v3',
    S,
    S,
    (ctx, w, h) => bakeSobelNormalToCanvas(ctx, w, h, ensureH(), 2.8),
    { repeat: [2, 2], linear: true, anisotropy: 8 },
  );

  const roughness = cachedCanvasTexture(
    'im-realistic-goldmesh-rough-v3',
    S,
    S,
    (ctx, w, h) => {
      const hArr = ensureH();
      const img = ctx.createImageData?.(w, h);
      if (!img?.data) return;
      const d = img.data;
      for (let i = 0; i < w * h; i++) {
        const rVal = Math.round(clamp(lerp(115, 38, hArr[i]), 32, 160));
        d[i * 4] = rVal;
        d[i * 4 + 1] = rVal;
        d[i * 4 + 2] = rVal;
        d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat: [2, 2], linear: true, anisotropy: 8 },
  );

  return { normal, roughness };
}

/** Quilted Kevlar/Nomex inner armor liner normal map. */
function getInnerQuiltedNormalMap() {
  const S = 256;
  return cachedCanvasTexture(
    'im-realistic-quilted-normal-v3',
    S,
    S,
    (ctx, w, h) => {
      const hArr = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = ((x + y) % 32) / 32 - 0.5;
          const v = ((x - y + 512) % 32) / 32 - 0.5;
          const cushion = clamp(1 - 3.4 * (u * u + v * v), 0.15, 1.0);
          hArr[y * w + x] = cushion;
        }
      }
      bakeSobelNormalToCanvas(ctx, w, h, hArr, 2.6);
    },
    { repeat: [4, 4], linear: true, anisotropy: 4 },
  );
}

/** Multi-ring Stark tokamak / Unibeam optical emitter texture (prevents flat white clipping!). */
function getUnibeamEmitterTex() {
  return cachedCanvasTexture(
    'im-realistic-unibeam-emitter-v3',
    256,
    256,
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const rMax = w * 0.48;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rMax);
      grad.addColorStop(0.00, '#ffffff');
      grad.addColorStop(0.28, '#e0f7ff');
      grad.addColorStop(0.55, '#38bdf8');
      grad.addColorStop(0.82, '#0284c7');
      grad.addColorStop(1.00, '#082f49');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Concentric tokamak containment rings & 12 radial magnetic field spokes
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      for (const rf of [0.30, 0.54, 0.78]) {
        ctx.lineWidth = rf === 0.54 ? 3.0 : 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, rMax * rf, 0, TAU);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(12, 74, 110, 0.55)';
      ctx.lineWidth = 2.2;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rMax * 0.32, cy + Math.sin(a) * rMax * 0.32);
        ctx.lineTo(cx + Math.cos(a) * rMax * 0.96, cy + Math.sin(a) * rMax * 0.96);
        ctx.stroke();
      }
    },
    { linear: false, anisotropy: 4 },
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

/** True 360° outward-facing conforming trim band (avoids full-circle outHint cancellation). */
function axialBand(o) {
  const { rings } = sampleAxialRings(
    { ...o, N: o.N ?? 48, steps: o.steps ?? 5 },
    o.scaleMul ?? 1.032,
  );
  return loftRings(rings, { capStart: false, capEnd: false });
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

/** Thin conforming exterior surface patch (shut-line reveals, trim accents, muscle bevels). */
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

  const addEdgeStrip = (indices, interiorIndices) => {
    const M = indices.length;
    const pos = new Float32Array(M * 2 * 3);
    const nor = new Float32Array(M * 2 * 3);
    const uv = new Float32Array(M * 2 * 2);

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

/** Add a realistic mechanical hydraulic cylinder strut (outer barrel + gleaming chrome piston rod + end clevises). */
function addHydraulicStrut(b, p0, p1, rBarrel, barrelMat, rodMat, clevisMat) {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  if (L < 1e-5) return;
  const rot = eulerAlong(d);
  const midBarrel = [lerp(p0[0], p1[0], 0.30), lerp(p0[1], p1[1], 0.30), lerp(p0[2], p1[2], 0.30)];
  const midRod = [lerp(p0[0], p1[0], 0.72), lerp(p0[1], p1[1], 0.72), lerp(p0[2], p1[2], 0.72)];
  const collar = [lerp(p0[0], p1[0], 0.56), lerp(p0[1], p1[1], 0.56), lerp(p0[2], p1[2], 0.56)];
  b.cyl(rBarrel, rBarrel, L * 0.56, 12, barrelMat, midBarrel, rot);
  b.cyl(rBarrel * 0.62, rBarrel * 0.62, L * 0.52, 10, rodMat, midRod, rot);
  b.cyl(rBarrel * 1.18, rBarrel * 1.18, L * 0.08, 12, clevisMat, collar, rot);
  b.sphere(rBarrel * 1.15, 10, 8, clevisMat, p0);
  b.sphere(rBarrel * 1.05, 10, 8, clevisMat, p1);
}

// ============================================================================
// MAIN BUILDER — COLLECTOR-GRADE MARVEL COMICS IRON MAN POWERED EXOSKELETON
// ============================================================================
export function buildIronManModel() {
  const panelMaps = getArmorPanelPbrMaps();
  const goldMeshMaps = getGoldMicroMeshPbrMaps();
  const quiltedNormal = getInnerQuiltedNormalMap();
  const unibeamTex = getUnibeamEmitterTex();

  // 1. Deep Candy-Apple Anodized Clearcoat Crimson (Hot Toys Diecast / Adi Granov Extremis finish)
  const comicCrimson = new THREE.MeshPhysicalMaterial({
    color: 0xb80d1d,
    metalness: 0.86,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    reflectivity: 1.0,
    sheen: 0.20,
    sheenColor: new THREE.Color(0xff4d5e),
    normalMap: panelMaps.normal,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughnessMap: panelMaps.roughness,
  });

  // Secondary darker anodized maroon-crimson for overlapping armor plates & tonal separation
  const deepCrimson = new THREE.MeshPhysicalMaterial({
    color: 0x7e0814,
    metalness: 0.88,
    roughness: 0.19,
    clearcoat: 0.92,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    normalMap: panelMaps.normal,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughnessMap: panelMaps.roughness,
  });

  // 2. Aerospace 22K Brushed Champagne Titanium-Gold (rigid faceplate, Unibeam bezel, V-belt, rims)
  const comicGold = new THREE.MeshPhysicalMaterial({
    color: 0xe6b85c,
    metalness: 0.95,
    roughness: 0.16,
    clearcoat: 0.62,
    clearcoatRoughness: 0.07,
    reflectivity: 1.0,
    normalMap: panelMaps.normal,
    normalScale: new THREE.Vector2(0.30, 0.30),
    roughnessMap: panelMaps.roughness,
  });

  // 3. Polarized 22K Titanium-Gold Micro-Chainmail Weave (bicep & thigh muscular sleeves!)
  const polarizedGoldMesh = new THREE.MeshPhysicalMaterial({
    color: 0xdfa944,
    metalness: 0.94,
    roughness: 0.21,
    clearcoat: 0.45,
    clearcoatRoughness: 0.10,
    reflectivity: 1.0,
    normalMap: goldMeshMaps.normal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: goldMeshMaps.roughness,
  });

  // Warm machined bronze-gold for collars, brow bevels & hydraulic fittings
  const richGold = new THREE.MeshPhysicalMaterial({
    color: 0xc28624,
    metalness: 0.93,
    roughness: 0.23,
    clearcoat: 0.45,
    clearcoatRoughness: 0.12,
  });

  // Quilted Kevlar/Nomex ballistic thermal inner liner (facing inward inside every hollow shell!)
  const innerLiner = new THREE.MeshStandardMaterial({
    color: 0x161d2a,
    roughness: 0.64,
    metalness: 0.28,
    normalMap: quiltedNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
  });

  // Precision CNC mechanical metals, copper windings & sapphire crystal optics
  const rimTitanium = brushedMetal(0xcbd5e1, { roughness: 0.19, metalness: 0.94, clearcoat: 0.45 });
  const rimGold = brushedMetal(0xe2b04a, { roughness: 0.19, metalness: 0.95, clearcoat: 0.48 });
  const gunmetal = brushedMetal(0x202632, { roughness: 0.28, metalness: 0.90, clearcoat: 0.28 });
  const darkSlot = mat(0x080b11, { roughness: 0.48, metalness: 0.68 });
  const silver = chromeMat(0xeef4fa);
  const copperCoil = brushedMetal(0xd97736, { roughness: 0.18, metalness: 0.95, clearcoat: 0.40 });
  const sapphireLens = glassMat(0xdbeafe, 0.34);

  const undersuitNavy = new THREE.MeshStandardMaterial({
    color: 0x111928,
    roughness: 0.50,
    metalness: 0.38,
    normalMap: quiltedNormal,
    normalScale: new THREE.Vector2(0.42, 0.42),
  });
  const pilotHolo = glassMat(0x67e8f9, 0.25);

  // Calibrated HDR-safe optical emitters (zero 8-million-intensity whiteout clipping!)
  const unibeamCore = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: unibeamTex,
    emissive: 0xbae6fd,
    emissiveMap: unibeamTex,
    emissiveIntensity: 2.35,
    roughness: 0.12,
    metalness: 0.10,
  });
  const unibeamCyan = emissiveMat(0x38bdf8, 1.85);
  const hudEyeGlow = emissiveMat(0xe0f2fe, 2.25);
  const repulsorGold = emissiveMat(0xfbbf24, 1.65);
  const bioScanCyan = emissiveMat(0x22d3ee, 1.40);

  // --------------------------------------------------------------------------
  // Heroic 8-Head Athletic Ready-Stance Proportions (Y = -1.00 soles to +1.34 crown)
  // Facing +X, Up +Y, Right/Starboard +Z
  // --------------------------------------------------------------------------
  const SHOULDER = (s) => [-0.010, 0.858, s * 0.312];
  const ELBOW = (s) => [-0.032, 0.520, s * 0.376];
  const WRIST = (s) => [0.112, 0.192, s * 0.412];
  const HIP = (s) => [0.006, 0.138, s * 0.152];
  const KNEE = (s) => [0.022, -0.422, s * 0.180];
  const ANKLE = (s) => [-0.006, -0.885, s * 0.198];

  // Shared Heroic Thoracic & Abdominal Loft Envelope (y = 0.06 .. 0.99)
  const TORSO_Y0 = 0.06;
  const TORSO_H = 0.93;
  const T_AT = (y) => (y - TORSO_Y0) / TORSO_H;

  const TORSO_STATIONS = [
    { t: 0.00, r1: 0.114, r1n: 0.110, r2: 0.150, n: 2.5, c1: 0.006 }, // y = 0.06 lower pelvic arch
    { t: 0.13, r1: 0.134, r1n: 0.130, r2: 0.186, n: 2.6, c1: 0.008 }, // y = 0.18 iliac hip crest
    { t: 0.25, r1: 0.128, r1n: 0.124, r2: 0.170, n: 2.5, c1: 0.009 }, // y = 0.29 V-belt waist
    { t: 0.35, r1: 0.126, r1n: 0.120, r2: 0.158, n: 2.5, c1: 0.011 }, // y = 0.39 athletic comic taper!
    { t: 0.48, r1: 0.146, r1n: 0.134, r2: 0.190, n: 2.6, c1: 0.015 }, // y = 0.51 lower ribcage rim
    { t: 0.64, r1: 0.176, r1n: 0.156, r2: 0.232, n: 2.7, c1: 0.021 }, // y = 0.66 mid chest / serratus / lats
    { t: 0.79, r1: 0.198, r1n: 0.166, r2: 0.264, n: 2.8, c1: 0.025 }, // y = 0.79 broad heroic pectorals!
    { t: 0.91, r1: 0.158, r1n: 0.140, r2: 0.226, n: 2.6, c1: 0.013 }, // y = 0.91 clavicles / trapezius
    { t: 1.00, r1: 0.096, r1n: 0.094, r2: 0.108, n: 2.3, c1: 0.002 }, // y = 0.99 open neck collar aperture
  ];

  const torsoRadial = (t, a) => {
    const aa = Math.abs(a);
    // Broad sculpted Marvel Comics pectoral shelves + crisp central sternum channel
    const pec = 0.078 * gauss(t, 0.77, 0.082) * gauss(aa, 0.39, 0.21);
    const sternum = -0.032 * gauss(t, 0.74, 0.11) * gauss(aa, 0.0, 0.095);
    // Rectus abdominis & lateral serratus muscle definition
    const abs = 0.026 * gauss(t, 0.38, 0.10) * gauss(aa, 0.20, 0.15);
    const serratus = 0.024 * gauss(t, 0.58, 0.08) * gauss(aa, 1.05, 0.22);
    // Rear scapular wings & latissimus dorsi V-taper
    const lats = 0.054 * gauss(t, 0.74, 0.11) * gauss(aa, 2.46, 0.27);
    const spineGroove = -0.034 * gauss(t, 0.66, 0.18) * gauss(aa, Math.PI, 0.11);
    return 1 + pec + sternum + abs + serratus + lats + spineGroove;
  };

  const TORSO = {
    origin: [0, TORSO_Y0, 0],
    axis: [0, TORSO_H, 0],
    up: [1, 0, 0],
    stations: TORSO_STATIONS,
    radial: torsoRadial,
  };
  const torsoSample = stationSampler(TORSO_STATIONS);

  // Sculpted Cranial Helmet Envelope (open neck bottom at y = 1.045, closed crown at y = 1.340)
  const HELMET = {
    origin: [0.008, 1.045, 0],
    axis: [0, 0.295, 0],
    up: [1, 0, 0],
    stations: [
      { t: 0.00, r1: 0.098, r1n: 0.094, r2: 0.086, n: 2.5, c1: 0.012 }, // Open neck/jaw aperture!
      { t: 0.16, r1: 0.120, r1n: 0.105, r2: 0.095, n: 2.9, c1: 0.019 }, // Chiseled mandible & chin
      { t: 0.38, r1: 0.129, r1n: 0.116, r2: 0.103, n: 3.1, c1: 0.015 }, // Angular zygomatic cheekbones!
      { t: 0.58, r1: 0.130, r1n: 0.122, r2: 0.107, n: 2.8, c1: 0.011 }, // Supraorbital brow & ear pods
      { t: 0.78, r1: 0.119, r1n: 0.118, r2: 0.099, n: 2.4, c1: 0.004 }, // Frontal cranium dome
      { t: 0.93, r1: 0.080, r1n: 0.082, r2: 0.069, n: 2.2, c1: -0.002 },
      { t: 1.00, r1: 0.010, r1n: 0.010, r2: 0.010, n: 2.0, c1: -0.004 }, // Crown apex
    ],
    radial: (t, a) => {
      const aa = Math.abs(a);
      const jaw = 0.046 * gauss(t, 0.20, 0.095) * gauss(aa, 0.70, 0.20);
      const cheek = 0.036 * gauss(t, 0.37, 0.065) * gauss(aa, 0.44, 0.16);
      const templeSink = -0.026 * gauss(t, 0.56, 0.08) * gauss(aa, 0.95, 0.18);
      const brow = 0.040 * gauss(t, 0.58, 0.058) * gauss(aa, 0.28, 0.26);
      const eyeSocket = -0.046 * gauss(t, 0.50, 0.042) * gauss(aa, 0.36, 0.15);
      const chin = 0.048 * gauss(t, 0.10, 0.065) * gauss(aa, 0.0, 0.20);
      return 1 + jaw + cheek + templeSink + brow + eyeSocket + chin;
    },
  };

  const parts = [
    // ========================================================================
    // 1. MARVEL COMICS 22K GOLD FACEPLATE & HOLLOW CRIMSON CYBERNETIC HELMET
    // ========================================================================
    {
      id: 'mark85-helmet-hud',
      i18n: {"es-419":{"name":"Placa Facial de Oro de 22K, Casco Carmesí y Transpondedor Cibernético","desc":"Casco hueco articulado de doble pared con placa facial de aleación de titanio y oro cepillado de 22K, pico de viuda clásico de Marvel Comics, visores ópticos HUD de cristal de zafiro, rejilla vocal escalonada, respirador de oxígeno de emergencia para 1 hora y transpondedores cibernéticos que leen las órdenes neuronales de Tony Stark en tiempo real.","funFact":"¡En los planos técnicos oficiales de Marvel Comics diseñados por Eliot R. Brown, los captadores cibernéticos dentro del casco traducen los impulsos cerebrales de Tony Stark en órdenes de vuelo en menos de 2 milisegundos!"},"es":{"name":"Placa Facial de Oro de 22K, Casco Carmesí y Transpondedor Cibernético","desc":"Casco hueco articulado de doble pared con placa facial de aleación de titanio y oro cepillado de 22K, pico de viuda clásico de Marvel Comics, visores ópticos HUD de cristal de zafiro, rejilla vocal escalonada y transpondedores cibernéticos neuronales.","funFact":"¡En los esquemas oficiales de Marvel Comics creados por Eliot R. Brown, los sensores cibernéticos del casco traducen las ondas cerebrales de Tony Stark en maniobras de vuelo instantáneas!"}},
      name: 'Marvel Comics 22K Gold Faceplate, Crimson Clamshell Helmet & Cybernetic Transponder',
      category: 'Helmet & Cybernetics',
      isOuter: true,
      explodeOffset: [0.16, 0.96, 0],
      desc: 'Collector-grade Marvel Comics clamshell helmet (Bob Layton Model 4 / Adi Granov Extremis) machined as an open-necked hollow shell (~10 mm wall thickness) with room for Tony Stark’s head inside: hinged 22K brushed Champagne Gold faceplate with dark CNC shut-line, pointed Crimson widow’s-peak V-crest, sapphire-lensed HUD eye slits, stepped vocal-grille mouth slit, and knurled phased-array ear pods.',
      funFact: 'In Marvel Comics schematics by Eliot R. Brown, Iron Man’s helmet houses cybernetic neuro-transponder pick-ups that read Tony’s brainwaves at the speed of thought, plus a collapsible 1-hour emergency oxygen supply!',
      build(g) {
        const b = new MeshBatch();

        // 1. Open-ended hollow multi-ring articulated cervical neck collar (y = 0.962 .. 1.056)
        const neckSpec = {
          origin: [0.004, 0.962, 0],
          axis: [0, 0.094, 0],
          up: [1, 0, 0],
          N: 44,
          steps: 10,
          wallRatio: 0.84,
          openStart: true,
          openEnd: true,
          stations: [
            { t: 0.0, r1: 0.095, r1n: 0.093, r2: 0.103, n: 2.3, c1: 0.004 },
            { t: 0.5, r1: 0.086, r1n: 0.086, r2: 0.091, n: 2.3, c1: 0.006 },
            { t: 1.0, r1: 0.091, r1n: 0.089, r2: 0.087, n: 2.4, c1: 0.008 },
          ],
        };
        addHollowTube(b, neckSpec, gunmetal, innerLiner, rimGold);
        // 3 overlapping Crimson ballistic neck lames over the dark gunmetal collar
        for (const [t0, t1, m] of [
          [0.06, 0.30, comicCrimson],
          [0.36, 0.62, deepCrimson],
          [0.68, 0.94, comicCrimson],
        ]) {
          b.add(
            axialBand({ ...neckSpec, tFrom: t0, tTo: t1, N: 44, steps: 4, scaleMul: 1.036 }),
            m,
          );
        }

        // 2. Hollow Candy-Apple Crimson Cranial Helmet Shell: OPEN neck aperture, closed crown dome
        addHollowTube(
          b,
          { ...HELMET, N: 56, steps: 26, wallRatio: 0.86, openStart: true, openEnd: false },
          comicCrimson,
          innerLiner,
          rimGold,
        );

        // Dark recessed CNC mechanical shut-line framing the hinged Gold Faceplate!
        const faceMask = (t, a) => {
          const aa = Math.abs(a);
          const widowCut = 0.18 * smoothstep(0.65, 0.84, t) * gauss(aa, 0.0, 0.24);
          return aa < 0.44 * Math.PI - widowCut ? 1 : 0;
        };
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -0.455 * Math.PI,
            aTo: 0.455 * Math.PI,
            tFrom: 0.035,
            tTo: 0.825,
            ns: 18,
            nt: 26,
            offset: 0.0022,
          }),
          darkSlot,
        );

        // 3. Hinged 22K Brushed Champagne Gold Faceplate (thick double-walled front clamshell!)
        addThickClamshell(
          b,
          {
            ...HELMET,
            aFrom: -0.43 * Math.PI,
            aTo: 0.43 * Math.PI,
            tFrom: 0.05,
            tTo: 0.80,
            ns: 24,
            nt: 30,
            offset: 0.0058,
            wallThick: 0.0085,
            radial: (t, a) => HELMET.radial(t, a) * (faceMask(t, a) ? 1.0 : 0.952),
          },
          comicGold,
          innerLiner,
          rimTitanium,
        );

        // Sculpted Zygomatic Cheekbone Planes & Occipital Backplate Armor Step
        for (const side of [-1, 1]) {
          b.add(
            axialPatch({
              ...HELMET,
              aFrom: side > 0 ? 0.14 * Math.PI : -0.36 * Math.PI,
              aTo: side > 0 ? 0.36 * Math.PI : -0.14 * Math.PI,
              tFrom: 0.24,
              tTo: 0.43,
              ns: 8,
              nt: 10,
              offset: 0.0108,
            }),
            richGold,
          );
          // Crimson lateral mandible & cheek guards with recessed temple intake slot
          b.add(
            axialPatch({
              ...HELMET,
              aFrom: side > 0 ? 0.38 * Math.PI : -0.66 * Math.PI,
              aTo: side > 0 ? 0.66 * Math.PI : -0.38 * Math.PI,
              tFrom: 0.04,
              tTo: 0.56,
              ns: 12,
              nt: 12,
              offset: 0.0105,
            }),
            comicCrimson,
          );
          // Temple micro-cooling vent slot
          b.rbox(0.022, 0.008, 0.010, 0.002, darkSlot, [0.068, 1.236, side * 0.094], [0, side * 0.38, -0.18]);

          // Machined Phased-Array Ear Transceiver Discs (knurled gold ring + 6 hex bolts + gunmetal radar cap)
          const ez = side * 0.107;
          b.cyl(0.034, 0.036, 0.014, 28, comicCrimson, [0.008, 1.194, ez], [Math.PI / 2, 0, 0]);
          b.torus(0.028, 0.0042, comicGold, [0.008, 1.194, ez + side * 0.0065], [0, Math.PI / 2, 0]);
          b.cyl(0.017, 0.019, 0.016, 20, gunmetal, [0.008, 1.194, ez + side * 0.003], [Math.PI / 2, 0, 0]);
          b.cyl(0.007, 0.007, 0.018, 14, rimTitanium, [0.008, 1.194, ez + side * 0.004], [Math.PI / 2, 0, 0]);
          for (let k = 0; k < 6; k++) {
            const ka = (k / 6) * TAU;
            b.cyl(
              0.0022,
              0.0022,
              0.006,
              6,
              silver,
              [0.008 + Math.cos(ka) * 0.022, 1.194 + Math.sin(ka) * 0.022, ez + side * 0.008],
              [Math.PI / 2, 0, 0],
            );
          }
        }

        // Occipital rear cranial armor plate + gold neck sensor strip
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: 0.72 * Math.PI,
            aTo: 1.28 * Math.PI,
            tFrom: 0.14,
            tTo: 0.76,
            ns: 10,
            nt: 14,
            offset: 0.006,
          }),
          deepCrimson,
        );

        // Crisp Marvel Comics Crimson Widow's-Peak Forehead V-Crest & Aero Crown Ridge
        b.add(
          axialPatch({
            ...HELMET,
            aFrom: -0.14 * Math.PI,
            aTo: 0.14 * Math.PI,
            tFrom: 0.67,
            tTo: 0.97,
            ns: 12,
            nt: 14,
            offset: 0.012,
          }),
          comicCrimson,
        );
        b.cone(0.027, 0.056, 4, comicCrimson, [0.153, 1.236, 0], [0, Math.PI / 4, Math.PI]);

        // 4. Multi-Layer Optical HUD Eye Slits (Dark Chamfer + Titanium Bezel + Glowing HUD + Sapphire Lens)
        for (const side of [-1, 1]) {
          const rotEye = [-side * 0.14, -side * 0.34, 0];
          b.rbox(0.020, 0.019, 0.056, 0.003, darkSlot, [0.152, 1.197, side * 0.042], rotEye);
          b.rbox(0.018, 0.015, 0.051, 0.0025, rimTitanium, [0.154, 1.197, side * 0.042], rotEye);
          b.rbox(0.016, 0.0105, 0.046, 0.002, hudEyeGlow, [0.156, 1.197, side * 0.042], rotEye);
          b.rbox(0.004, 0.0115, 0.048, 0.0015, sapphireLens, [0.163, 1.197, side * 0.042], rotEye);
          // Angry sculpted 22K Gold supraorbital brow ridge
          b.rbox(0.020, 0.008, 0.058, 0.002, richGold, [0.158, 1.208, side * 0.041], [-side * 0.16, -side * 0.34, 0]);
        }

        // 5. Recessed Stepped Marvel Comics Mouth Slit with Micro-Grille + Split Mandible Chin Guard
        b.rbox(0.020, 0.010, 0.058, 0.002, darkSlot, [0.156, 1.107, 0]);
        for (let gv = -3; gv <= 3; gv++) {
          b.box(0.004, 0.0075, 0.0018, gunmetal, [0.163, 1.107, gv * 0.007]);
        }
        for (const side of [-1, 1]) {
          b.rbox(0.018, 0.0085, 0.022, 0.002, darkSlot, [0.151, 1.102, side * 0.034], [side * 0.14, -side * 0.28, 0]);
          // Crimson lower-jaw corner accent flanking the gold chin
          b.rbox(0.022, 0.018, 0.024, 0.004, comicCrimson, [0.139, 1.072, side * 0.034], [0, -side * 0.32, 0]);
        }
        b.rbox(0.021, 0.024, 0.048, 0.005, comicGold, [0.156, 1.076, 0], [0, 0, -0.08]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 2. INTERLOCKING CRIMSON FRONT THORACIC CLAMSHELL & 12-COIL SAPPHIRE UNIBEAM
    // ========================================================================
    {
      id: 'arc-reactor-chestplate',
      i18n: {"es-419":{"name":"Coraza Pectoral Carmesí y Proyector Unirrayo de Zafiro de 12 Bobinas","desc":"Coraza pectoral anatómica hueca de doble pared con acabado carmesí multicapa y líneas de cierre mecanizadas por CNC. En el centro del esternón aloja el legendario Unirrayo de zafiro rodeado por 12 bobinas electromagnéticas de cobre capaces de proyectar reflectores halógenos, rayos tractores magnéticos, láseres ultravioletas y descargas de energía pura.","funFact":"¡En los cómics clásicos de Iron Man, el Unirrayo pectoral no es solo una ventana del reactor: es un proyector multiespectro capaz de emitir luz de búsqueda, campos de tracción y pulsos electromagnéticos!"},"es":{"name":"Coraza Pectoral Carmesí y Proyector Unirrayo de Zafiro de 12 Bobinas","desc":"Coraza pectoral anatómica hueca de doble pared con acabado carmesí multicapa, líneas de cierre CNC y proyector central Unirrayo de cristal de zafiro con 12 bobinas electromagnéticas de cobre.","funFact":"¡En los cómics clásicos de Marvel, el Unirrayo del pecho actúa como proyector multiespectro de haces tractores, láseres y descargas concusivas!"}},
      name: 'Interlocking Crimson Thoracic Clamshell & 12-Coil Sapphire Unibeam Projector',
      category: 'Front Chest Clamshell',
      isOuter: true,
      explodeOffset: [1.18, 0.16, 0],
      desc: '100% Marvel Comics Crimson front thoracic clamshell engineered as a true double-walled hollow half-shell (~15 mm wall thickness) with a diamond-quilted Kevlar inner liner, interlocking multi-plate pectoral armor over dark titanium shut-lines, clavicle NACA intakes, and a deep 3D 12-coil copper tokamak Unibeam projector sealed behind a curved sapphire crystal lens.',
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
            ns: 26,
            nt: 34,
            wallThick: 0.015,
          },
          comicCrimson,
          innerLiner,
          rimTitanium,
        );

        // Dark anodized titanium sternum & sub-pectoral razor-thin CNC shut-line reveal channel
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: -0.44 * Math.PI,
            aTo: 0.44 * Math.PI,
            tFrom: T_AT(0.59),
            tTo: T_AT(0.90),
            ns: 14,
            nt: 24,
            offset: 0.0080,
          }),
          darkSlot,
        );

        // 2. Overlapping Sculpted Left & Right Crimson Pectoral Plates, Clavicle Yokes & Latches
        for (const side of [-1, 1]) {
          // Main broad Crimson pectoral armor plate (leaves razor-sharp ~3 mm CNC sternum & sub-pec shut-lines!)
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.011 * Math.PI : -0.445 * Math.PI,
              aTo: side > 0 ? 0.445 * Math.PI : -0.011 * Math.PI,
              tFrom: T_AT(0.654),
              tTo: T_AT(0.888),
              ns: 14,
              nt: 18,
              offset: 0.0112,
            }),
            comicCrimson,
          );
          // Upper clavicle Crimson yoke plate
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.014 * Math.PI : -0.435 * Math.PI,
              aTo: side > 0 ? 0.435 * Math.PI : -0.014 * Math.PI,
              tFrom: T_AT(0.894),
              tTo: T_AT(0.972),
              ns: 6,
              nt: 14,
              offset: 0.0105,
            }),
            deepCrimson,
          );
          // Lower sub-pectoral angled bevel plate + serratus rib guard
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.014 * Math.PI : -0.455 * Math.PI,
              aTo: side > 0 ? 0.455 * Math.PI : -0.014 * Math.PI,
              tFrom: T_AT(0.535),
              tTo: T_AT(0.648),
              ns: 8,
              nt: 16,
              offset: 0.0102,
            }),
            deepCrimson,
          );

          // Recessed collarbone NACA cooling intake louver + titanium hex fasteners
          b.rbox(0.016, 0.018, 0.046, 0.003, gunmetal, [0.148, 0.905, side * 0.105], [0, -side * 0.35, -0.25]);
          b.rbox(0.010, 0.008, 0.036, 0.002, darkSlot, [0.154, 0.905, side * 0.105], [0, -side * 0.35, -0.25]);
          for (const [bx, by, bz] of [
            [0.195, 0.855, side * 0.165],
            [0.202, 0.675, side * 0.155],
            [0.158, 0.565, side * 0.135],
          ]) {
            b.cyl(0.0038, 0.0038, 0.006, 6, rimTitanium, [bx, by, bz], [0, 0, Math.PI / 2]);
          }

          // Side-seam magnetic clamshell latch clevises (visible when exploded!)
          for (const yLatch of [0.57, 0.70, 0.83]) {
            const st = torsoSample(T_AT(yLatch));
            b.rbox(0.028, 0.022, 0.016, 0.003, rimGold, [st.c1, yLatch, side * (st.r2 + 0.004)]);
            b.cyl(0.004, 0.004, 0.028, 10, silver, [st.c1, yLatch, side * (st.r2 + 0.008)]);
          }
        }

        // Crisp 22K Champagne Gold Collarbone Rim Trim around the open neck aperture
        b.torus(0.105, 0.007, comicGold, [0.006, 0.986, 0], [Math.PI / 2 + 0.14, 0, 0], [0.92, 1.04, 1]);

        // 3. Collector-Grade 3D 12-Coil Tokamak / Marvel Comics Unibeam Chest Projector
        const ux = 0.218;
        const uy = 0.758;
        const tiltZ = -0.10;
        // Outer chamfered 22K Champagne Gold circular-pentagonal bezel + 5 Adi Granov armor lugs
        b.torus(0.068, 0.0095, comicGold, [ux, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.torus(0.056, 0.0055, rimTitanium, [ux + 0.005, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.cyl(0.055, 0.058, 0.018, 36, darkSlot, [ux - 0.003, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);

        // 12 radial electromagnetic copper tokamak coils + palladium stator teeth inside the chamber!
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * TAU;
          const cyOff = Math.cos(ang) * 0.044;
          const czOff = Math.sin(ang) * 0.044;
          b.rbox(0.010, 0.009, 0.013, 0.002, copperCoil, [ux + 0.005, uy + cyOff, czOff], [ang, 0, tiltZ]);
          b.box(0.012, 0.0035, 0.008, silver, [ux + 0.007, uy + cyOff * 0.88, czOff * 0.88], [ang, 0, tiltZ]);
        }
        // 5 radial Marvel Comics pentagonal gold clamps + 5 hex bolts
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * TAU - Math.PI / 2;
          b.rbox(
            0.012,
            0.016,
            0.010,
            0.0025,
            comicGold,
            [ux + 0.007, uy + Math.cos(ang) * 0.062, Math.sin(ang) * 0.062],
            [ang, 0, 0],
          );
          const bAng = ang + Math.PI / 5;
          b.cyl(
            0.0028,
            0.0028,
            0.008,
            6,
            silver,
            [ux + 0.009, uy + Math.cos(bAng) * 0.066, Math.sin(bAng) * 0.066],
            [0, 0, Math.PI / 2 + tiltZ],
          );
        }

        // Multi-ring glowing tokamak core + central titanium focus ring + curved Sapphire Crystal Dome!
        b.torus(0.042, 0.0042, unibeamCyan, [ux + 0.007, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.cyl(0.036, 0.036, 0.008, 32, unibeamCore, [ux + 0.006, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);
        b.torus(0.020, 0.0024, silver, [ux + 0.011, uy, 0], [0, Math.PI / 2, tiltZ]);
        b.sphere(0.052, 24, 16, sapphireLens, [ux + 0.006, uy, 0], [0, 0, tiltZ], [0.24, 1.0, 1.0]);

        // Shallow inner concave sternum Unibeam backing ring (leaves 100% of ribcage cavity hollow!)
        b.cyl(0.058, 0.058, 0.010, 28, rimTitanium, [ux - 0.016, uy, 0], [0, 0, Math.PI / 2 + tiltZ]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 3. HOLLOW REAR DORSAL CLAMSHELL, HYDRAULIC AIRBRAKES & SPINE CAPACITORS
    // ========================================================================
    {
      id: 'dorsal-airbrake-array',
      i18n: {"es-419":{"name":"Coraza Dorsal Hueca, Aerofrenos Hidráulicos y Capacitores Espinales","desc":"Coraza dorsal ergonómica de doble pared esculpida sobre los trapecios y omóplatos del piloto, equipada con dos flaps hidráulicos de frenado aerodinámico con pistones de titanio visibles, columna vertebral articulada de 6 vértebras doradas y bancos de capacitores termoeléctricos.","funFact":"¡Al volar a más de Mach 3, los aerofrenos dorsales se despliegan con microactuadores hidráulicos para estabilizar giros cerrados de alta gravedad sin perder sustentación!"},"es":{"name":"Coraza Dorsal Hueca, Aerofrenos Hidráulicos y Condensadores Espinales","desc":"Coraza dorsal ergonómica de doble pared con dos flaps hidráulicos de frenado aerodinámico, actuadores de titanio visibles, columna articulada de 6 vértebras doradas y condensadores espinales.","funFact":"¡A velocidades superiores a Mach 3, los aerofrenos dorsales se despliegan hidráulicamente para ejecutar maniobras cerradas de alta gravedad!"}},
      name: 'Hollow Rear Dorsal Clamshell, Hydraulic Airbrake Flaps & Spine Capacitors',
      category: 'Rear Dorsal Clamshell',
      isOuter: true,
      explodeOffset: [-1.18, 0.20, 0],
      desc: 'Matching Marvel Comics Crimson rear thoracic clamshell (~15 mm thick hollow concave plate) that splits away from the front chestplate so Tony Stark can step inside. Features overlapping scapular armor plates, twin deployed airbrake flaps with exposed hydraulic cylinders, micro-turbine exhaust louvers, and a 5-cell spinal capacitor array.',
      funFact: 'When Iron Man decelerates from Mach 3+ supersonic flight, twin dorsal airbrake flaps deploy on hydraulic struts from his upper backplate while his palm repulsors fire forward as retro-thrusters!',
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
            ns: 26,
            nt: 34,
            wallThick: 0.015,
          },
          comicCrimson,
          innerLiner,
          rimTitanium,
        );

        // Dark mechanical dorsal shut-line channel
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: 0.58 * Math.PI,
            aTo: 1.42 * Math.PI,
            tFrom: T_AT(0.64),
            tTo: T_AT(0.93),
            ns: 12,
            nt: 22,
            offset: 0.008,
          }),
          darkSlot,
        );

        // 2. Overlapping Scapular Wing Plates, Hydraulic Pop-Out Airbrakes & Exhaust Louvers
        for (const side of [-1, 1]) {
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.60 * Math.PI : 1.12 * Math.PI,
              aTo: side > 0 ? 0.88 * Math.PI : 1.40 * Math.PI,
              tFrom: T_AT(0.66),
              tTo: T_AT(0.92),
              ns: 12,
              nt: 14,
              offset: 0.011,
            }),
            deepCrimson,
          );

          // Deployed Dorsal Aerodynamic Airbrake Flap + Twin Hydraulic Actuator Cylinders
          const bx = -0.160;
          const by = 0.790;
          const bz = side * 0.108;
          const flapRot = [side * 0.15, -side * 0.30, -0.24];
          b.rbox(0.012, 0.172, 0.072, 0.004, comicCrimson, [bx - 0.026, by, bz], flapRot);
          b.rbox(0.008, 0.150, 0.054, 0.003, comicGold, [bx - 0.019, by, bz + side * 0.003], flapRot);
          b.rbox(0.022, 0.154, 0.044, 0.003, darkSlot, [bx + 0.006, by, bz - side * 0.004]);
          addHydraulicStrut(
            b,
            [bx + 0.008, by + 0.032, bz],
            [bx - 0.024, by + 0.042, bz + side * 0.004],
            0.0048,
            gunmetal,
            silver,
            richGold,
          );
          addHydraulicStrut(
            b,
            [bx + 0.008, by - 0.036, bz],
            [bx - 0.024, by - 0.026, bz + side * 0.004],
            0.0048,
            gunmetal,
            silver,
            richGold,
          );

          // Recessed dorsal micro-turbine exhaust louver port with titanium vanes
          b.rbox(0.020, 0.052, 0.040, 0.004, gunmetal, [-0.150, 0.615, side * 0.092], [0, -side * 0.22, 0]);
          b.rbox(0.010, 0.034, 0.026, 0.002, unibeamCyan, [-0.156, 0.615, side * 0.092], [0, -side * 0.22, 0]);
          for (let lv = -1; lv <= 1; lv++) {
            b.box(0.008, 0.0035, 0.032, rimTitanium, [-0.159, 0.615 + lv * 0.011, side * 0.092], [0, -side * 0.22, 0.25]);
          }
        }

        // 3. Exterior 5-Vertebra Spinal Capacitor & Chaff Dispenser Ridge (inside stays 100% hollow!)
        for (let i = 0; i < 5; i++) {
          const sy = 0.545 + i * 0.068;
          b.rbox(0.024, 0.052, 0.068, 0.006, i % 2 === 0 ? comicCrimson : deepCrimson, [-0.146, sy, 0]);
          b.rbox(0.014, 0.032, 0.044, 0.003, comicGold, [-0.155, sy, 0]);
          b.cyl(0.0032, 0.0032, 0.056, 8, rimTitanium, [-0.156, sy, 0], [Math.PI / 2, 0, 0]);
        }

        b.flush(g);
      },
    },

    // ========================================================================
    // 4. MULTI-TIERED FLARED CRIMSON COMIC SHOULDER PAULDRONS & MUNITION PODS
    // ========================================================================
    {
      id: 'pauldron-missile-pods',
      i18n: {"es-419":{"name":"Hombreras Carmesí Escalonadas y Módulos Desplegables de Micro-Munición","desc":"Hombreras blindadas acampanadas al estilo clásico de Marvel Comics con rebordes en oro cepillado de 22K, montadas sobre anillos cardánicos que permiten rotación completa del brazo, integrando módulos superiores desplegables con 6 tubos de micro-municiones guiadas.","funFact":"¡Las hombreras acampanadas inmortalizadas por Bob Layton ocultan lanzadores miniaturizados guiados por el radar del casco sin sacrificar la movilidad de los hombros!"},"es":{"name":"Hombreras Carmesí Escalonadas y Módulos Desplegables de Micro-Munición","desc":"Hombreras blindadas acampanadas al estilo clásico de Marvel Comics con rebordes de oro de 22K, juntas cardánicas y módulos desplegables con 6 tubos de micro-munición guiada.","funFact":"¡Las icónicas hombreras acampanadas de Bob Layton alojan micro-lanzadores guiados por el visor HUD sin limitar el giro del brazo!"}},
      name: 'Multi-Tiered Flared Crimson Comic Shoulder Pauldrons & Pop-Up Munition Pods',
      category: 'Shoulder Pauldrons',
      isOuter: true,
      explodeOffset: [-0.22, 0.68, 0],
      desc: 'Classic Bob Layton & Adi Granov flared rounded-bell Marvel Comics Crimson shoulder pauldrons edged in brushed 22K Champagne Gold. Each pauldron is a two-tiered hollow concave dome (~13 mm wall thickness) mounted on titanium rotary clevis bearings over the human deltoid, topped with a hinged 6-tube brass micro-munition pod.',
      funFact: 'Unlike the gold shoulders used in later movie suits, classic and Extremis Marvel Comics Iron Man armors feature bold flared Crimson shoulder bells that create his unmistakable heroic comic silhouette!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const pauldronSpec = {
            origin: [S[0], S[1] - 0.088, S[2] - side * 0.026],
            axis: [0, 0.200, side * 0.028],
            up: [0, 0, side],
            stations: [
              { t: 0.00, r1: 0.122, r1n: 0.050, r2: 0.120, n: 2.3, c1: 0.018 }, // Flared comic lower bell skirt!
              { t: 0.35, r1: 0.115, r1n: 0.054, r2: 0.114, n: 2.4, c1: 0.016 },
              { t: 0.72, r1: 0.098, r1n: 0.058, r2: 0.100, n: 2.4, c1: 0.008 },
              { t: 1.00, r1: 0.060, r1n: 0.044, r2: 0.070, n: 2.2, c1: -0.006 },
            ],
          };

          // Primary Concave Hollow Crimson Bell Clamshell!
          addThickClamshell(
            b,
            {
              ...pauldronSpec,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: 0.0,
              tTo: 1.0,
              ns: 18,
              nt: 24,
              wallThick: 0.013,
            },
            comicCrimson,
            innerLiner,
            rimGold,
          );

          // Overlapping Upper Deltoid Armor Tier (creates crisp recessed mechanical step!)
          b.add(
            axialPatch({
              ...pauldronSpec,
              aFrom: -0.48 * Math.PI,
              aTo: 0.48 * Math.PI,
              tFrom: 0.38,
              tTo: 0.94,
              ns: 10,
              nt: 18,
              offset: 0.009,
            }),
            deepCrimson,
          );

          // Gleaming 22K Champagne Gold Flared Lower Rim Molding
          b.add(
            axialPatch({
              ...pauldronSpec,
              aFrom: -0.57 * Math.PI,
              aTo: 0.57 * Math.PI,
              tFrom: 0.0,
              tTo: 0.13,
              ns: 5,
              nt: 22,
              offset: 0.0082,
            }),
            comicGold,
          );

          // Internal Titanium Rotary Shoulder Clevis Bearing (tucked under pauldron arch, outside arm bore)
          b.torus(0.068, 0.007, gunmetal, [S[0], S[1] + 0.010, S[2] - side * 0.018], [0, Math.PI / 2, 0.35 * side]);

          // Pop-Up 6-Tube Brass/Gunmetal Stark Micro-Munition Pod + Hinged Crimson Bay Door
          const px = S[0] - 0.006;
          const py = S[1] + 0.096;
          const pz = S[2] + side * 0.028;
          const podRot = [side * 0.22, 0, -0.08];
          b.rbox(0.072, 0.026, 0.056, 0.005, gunmetal, [px, py, pz], podRot);
          b.rbox(0.074, 0.0075, 0.058, 0.002, comicCrimson, [px - 0.006, py + 0.017, pz], [side * 0.22, 0, 0.14]);
          b.rbox(0.066, 0.004, 0.048, 0.0015, comicGold, [px - 0.006, py + 0.014, pz], [side * 0.22, 0, 0.14]);
          for (const dy of [-0.005, 0.005]) {
            for (const dz of [-0.016, 0, 0.016]) {
              b.cyl(0.0045, 0.0045, 0.016, 12, rimTitanium, [px + 0.032, py + dy, pz + dz], [0, 0, Math.PI / 2]);
              b.sphere(0.0038, 10, 8, comicGold, [px + 0.040, py + dy, pz + dz]);
            }
          }
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 5. POLARIZED GOLD BICEPS, HYDRAULIC ELBOWS & 5-FINGERED REPULSOR GAUNTLETS
    // ========================================================================
    {
      id: 'repulsor-gauntlets-arms',
      i18n: {"es-419":{"name":"Bíceps Polarizados de Oro de 22K, Codos Hidráulicos y Guanteletes Repulsores","desc":"Mangas de bíceps huecas tejidas con micromalla cristalina de titanio y oro de 22K polarizado magnéticamente, codos con tambores hidráulicos rotativos y guanteletes carmesí acampanados con 5 dedos articulados y lentes repulsoras de zafiro en cada palma.","funFact":"¡Según el manual técnico de Marvel Comics, las mangas doradas están formadas por miles de microescamas metálicas flexibles que se vuelven tan rígidas como el acero blindado al recibir carga magnética!"},"es":{"name":"Bíceps Polarizados de Oro de 22K, Codos Hidráulicos y Guanteletes Repulsores","desc":"Mangas de bíceps huecas con micromalla polarizada de oro de 22K, articulaciones hidráulicas en los codos y guanteletes carmesí acampanados con 5 dedos articulados y lentes repulsoras de zafiro en las palmas.","funFact":"¡En los cómics de Marvel, las mangas doradas utilizan una micromalla cristalina que pasa de ser flexible como la tela a rígida como el titanio al polarizarse magnéticamente!"}},
      name: 'Polarized 22K Gold Biceps, Hydraulic Elbows, Flared Crimson Gauntlets & 5-Fingered Repulsors',
      category: 'Arms & Repulsors',
      isOuter: true,
      explodeOffset: [0.88, 0.08, 0],
      desc: 'Canonical Marvel Comics arm assembly built as open-ended hollow sleeves (~11 mm wall thickness) so human arms slide right through: sculpted 22K Titanium-Gold polarized micro-mesh bicep/tricep sleeves, hollow rotary elbow bearings with twin hydraulic dampers, flared-cuff Crimson gauntlets with wrist laser pods, and 5-fingered multi-phalange articulated hands framing sapphire-lensed Palm Repulsors.',
      funFact: 'In Marvel Comics, Iron Man’s golden arm and leg sleeves are woven from magnetically polarized micro-chainmail that stays flexible like cloth until energized into tank-proof armor in microseconds!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const S = SHOULDER(side);
          const E = ELBOW(side);
          const W = WRIST(side);

          // 1. Open-Ended Hollow Sculpted 22K Polarized Titanium-Gold Bicep/Tricep Sleeve
          const upperDir = [E[0] - S[0], E[1] - S[1], E[2] - S[2]];
          const upperSpec = {
            origin: S,
            axis: upperDir,
            up: [1, 0, 0],
            N: 44,
            steps: 18,
            wallRatio: 0.84,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.069, r1n: 0.067, r2: 0.069, n: 2.3 },
              { t: 0.36, r1: 0.084, r1n: 0.078, r2: 0.078, n: 2.5, c1: 0.007 }, // Sculpted biceps brachii peak!
              { t: 0.72, r1: 0.074, r1n: 0.070, r2: 0.070, n: 2.4, c1: 0.003 },
              { t: 1.00, r1: 0.062, r1n: 0.060, r2: 0.062, n: 2.3 },
            ],
            radial: (t, a) => {
              const aa = Math.abs(a);
              const bicepPeak = 0.048 * gauss(t, 0.42, 0.18) * gauss(aa, 0.0, 0.38);
              const tricepHead = 0.036 * gauss(t, 0.36, 0.16) * gauss(aa, Math.PI * 0.85, 0.35);
              return 1 + bicepPeak + tricepHead;
            },
          };
          addHollowTube(b, upperSpec, polarizedGoldMesh, innerLiner, rimGold);

          // Precision brushed-gold bicep cuff & torque amplifier bands
          for (const tf of [0.10, 0.88]) {
            b.add(
              axialBand({
                ...upperSpec,
                tFrom: tf - 0.03,
                tTo: tf + 0.03,
                N: 44,
                steps: 3,
                scaleMul: 1.032,
              }),
              comicGold,
            );
          }

          // 2. Open-Bore Mechanical Rotary Elbow Joint (Caliper Bearings + Twin Hydraulic Damper Struts!)
          const elbowRot = eulerAlong(upperDir);
          b.torus(0.058, 0.009, gunmetal, E, [elbowRot[0] + Math.PI / 2, elbowRot[1], elbowRot[2]]);
          for (const calSide of [-1, 1]) {
            const cz = E[2] + calSide * 0.064;
            b.cyl(0.020, 0.020, 0.012, 18, rimTitanium, [E[0], E[1], cz], [Math.PI / 2, 0, 0]);
            b.cyl(0.010, 0.010, 0.016, 14, comicGold, [E[0], E[1], cz + calSide * 0.002], [Math.PI / 2, 0, 0]);
          }
          addHydraulicStrut(
            b,
            [E[0] - 0.058, E[1] + 0.068, E[2] + side * 0.042],
            [E[0] - 0.052, E[1] - 0.042, E[2] + side * 0.048],
            0.0055,
            gunmetal,
            silver,
            richGold,
          );

          // 3. Open-Ended Hollow Crimson Forearm Gauntlet with Flared Marvel Comics Elbow Cuff!
          const foreStart = [
            E[0] - 0.012 * (W[0] - E[0]),
            E[1] + 0.030,
            E[2] - side * 0.004,
          ];
          const foreDir = [W[0] - foreStart[0], W[1] - foreStart[1], W[2] - foreStart[2]];
          const foreSpec = {
            origin: foreStart,
            axis: foreDir,
            up: [1, 0, 0],
            N: 44,
            steps: 22,
            wallRatio: 0.83,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.095, r1n: 0.092, r2: 0.096, n: 2.6, c1: -0.004 }, // Dramatic flared Marvel Comics gauntlet cuff!
              { t: 0.16, r1: 0.080, r1n: 0.078, r2: 0.082, n: 2.6 },
              { t: 0.36, r1: 0.075, r1n: 0.070, r2: 0.076, n: 2.7, c1: 0.004 }, // Brachioradialis forearm swell
              { t: 0.72, r1: 0.063, r1n: 0.059, r2: 0.064, n: 2.7 },
              { t: 1.00, r1: 0.056, r1n: 0.052, r2: 0.058, n: 2.8 },
            ],
            radial: (t, a) => {
              const cuffPoint = 0.14 * (1 - smoothstep(0.0, 0.22, t)) * gauss(Math.abs(a), Math.PI * 0.65, 0.34);
              return 1 + cuffPoint;
            },
          };
          addHollowTube(b, foreSpec, comicCrimson, innerLiner, rimGold);

          // Overlapping Dorsal Gauntlet Armor Plate + Wrist Laser Projector Pod + Gold Cuff Moldings
          b.add(
            axialPatch({
              ...foreSpec,
              aFrom: side > 0 ? 0.18 * Math.PI : -0.82 * Math.PI,
              aTo: side > 0 ? 0.82 * Math.PI : -0.18 * Math.PI,
              tFrom: 0.22,
              tTo: 0.86,
              ns: 10,
              nt: 14,
              offset: 0.0055,
            }),
            deepCrimson,
          );
          b.add(
            axialBand({ ...foreSpec, tFrom: 0.0, tTo: 0.07, N: 44, steps: 3, scaleMul: 1.036 }),
            comicGold,
          );
          b.add(
            axialBand({ ...foreSpec, tFrom: 0.90, tTo: 1.0, N: 44, steps: 4, scaleMul: 1.040 }),
            comicGold,
          );

          // Dorsal Wrist Micro-Laser / Anti-Tank Emitter Pod
          const fRot = eulerAlong(foreDir);
          b.rbox(0.026, 0.052, 0.022, 0.004, gunmetal, [W[0] - 0.010, W[1] + 0.058, W[2] + side * 0.060], fRot);
          b.cyl(0.005, 0.005, 0.012, 12, repulsorGold, [W[0] + 0.004, W[1] + 0.032, W[2] + side * 0.064], fRot);

          // 4. Realistic 5-Fingered Multi-Phalange Articulated Hand + Sapphire-Lensed Palm Repulsor!
          const hx = W[0] + 0.024;
          const hy = W[1] - 0.048;
          const hz = W[2] + side * 0.006;

          // Hollow Crimson dorsal hand metacarpal carapace + sculpted gold knuckle bar + inner palm pad
          b.rbox(0.076, 0.084, 0.024, 0.008, comicCrimson, [hx + 0.004, hy, hz + side * 0.014], fRot);
          b.rbox(0.078, 0.016, 0.012, 0.003, comicGold, [hx + 0.008, hy - 0.038, hz + side * 0.022], fRot);
          b.rbox(0.064, 0.076, 0.014, 0.005, innerLiner, [hx + 0.002, hy, hz - side * 0.002], fRot);

          // Recessed Multi-Lens Sapphire Palm Repulsor (facing inward/downward on palm)
          const px = hx + 0.002;
          const py = hy - 0.004;
          const pz = hz - side * 0.010;
          b.torus(0.024, 0.0045, rimTitanium, [px, py, pz], [0, Math.PI / 2, 0]);
          b.cyl(0.020, 0.020, 0.006, 24, unibeamCore, [px, py, pz], [Math.PI / 2, 0, 0]);
          b.sphere(0.021, 18, 12, sapphireLens, [px, py, pz - side * 0.003], [0, 0, 0], [1.0, 1.0, 0.35]);

          // 4 Graduated 3-Phalange Articulated Fingers (Index, Middle, Ring, Pinky)
          const fingerSpecs = [
            { xOff: 0.025, lenScale: 0.96 },  // Index
            { xOff: 0.009, lenScale: 1.05 },  // Middle
            { xOff: -0.008, lenScale: 0.98 }, // Ring
            { xOff: -0.024, lenScale: 0.84 }, // Pinky
          ];
          for (const fg of fingerSpecs) {
            const fx = hx + fg.xOff;
            const L1 = 0.032 * fg.lenScale;
            const L2 = 0.024 * fg.lenScale;
            const L3 = 0.018 * fg.lenScale;
            // Knuckle pin
            b.cyl(0.0055, 0.0055, 0.013, 10, gunmetal, [fx, hy - 0.044, hz + side * 0.012], [0, 0, Math.PI / 2]);
            // Proximal phalange (Crimson)
            b.rbox(0.0135, L1, 0.015, 0.0035, comicCrimson, [fx, hy - 0.058, hz + side * 0.010], [side * 0.22, 0, 0]);
            // Middle phalange (Deep Crimson + gunmetal joint)
            b.cyl(0.0045, 0.0045, 0.012, 8, gunmetal, [fx, hy - 0.073, hz + side * 0.005], [0, 0, Math.PI / 2]);
            b.rbox(0.012, L2, 0.0135, 0.003, deepCrimson, [fx, hy - 0.084, hz + side * 0.001], [side * 0.48, 0, 0]);
            // Distal fingertip (Crimson + Gold tip pad)
            b.rbox(0.0108, L3, 0.012, 0.003, comicCrimson, [fx, hy - 0.100, hz - side * 0.010], [side * 0.72, 0, 0]);
          }

          // 3-Segment Opposable Armored Thumb
          b.sphere(0.011, 10, 8, gunmetal, [hx + 0.034, hy - 0.012, hz + side * 0.004]);
          b.rbox(0.016, 0.030, 0.016, 0.004, comicCrimson, [hx + 0.042, hy - 0.026, hz - side * 0.004], [side * 0.22, 0, -0.45]);
          b.rbox(0.014, 0.024, 0.014, 0.0035, deepCrimson, [hx + 0.048, hy - 0.048, hz - side * 0.012], [side * 0.45, 0, -0.18]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 6. OVERLAPPING CRIMSON RIB GIRDLE & CLASSIC COMIC V-BELT TRUNK ARMOR
    // ========================================================================
    {
      id: 'abdominal-pelvis-armor',
      i18n: {"es-419":{"name":"Faja Abdominal Articulada Carmesí, Trusa Blindada y Cinturón en V de Oro","desc":"Sección media hueca de doble pared compuesta por láminas costales carmesí superpuestas que permiten inclinar y girar el torso, coronada por el icónico cinturón en punta en V de oro de 22K y la clásica trusa pélvica carmesí de Marvel Comics con faldones articulados de cadera.","funFact":"¡Dividir el abdomen en placas superpuestas independientes con amortiguadores internos le permite a Iron Man doblar el torso como un acróbata aun dentro de una coraza metálica!"},"es":{"name":"Faja Abdominal Articulada Carmesí, Calzón Blindado y Cinturón en V de Oro","desc":"Sección media hueca de doble pared formada por láminas costales carmesí superpuestas, cinturón en punta en V de oro de 22K y protección pélvica carmesí clásica de Marvel Comics.","funFact":"¡Las placas abdominales superpuestas permiten a Iron Man flexionar y girar el torso con total libertad pese a vestir blindaje pesado!"}},
      name: 'Hollow Overlapping Crimson Rib Girdle & Marvel Comics Gold V-Belt Trunks',
      category: 'Abdomen & Trunk Girdle',
      isOuter: true,
      explodeOffset: [0.78, -0.32, 0],
      desc: 'True open-top, open-bottom hollow double-walled waist & pelvic girdle (~13 mm wall thickness, zero solid plugs): 4 overlapping Marvel Comics Crimson abdominal rib lames and serratus side plates mounted over dark ballistic flex-channels, paired with a machined 22K Gold V-belt and articulated Crimson pelvic trunk armor.',
      funFact: 'Classic Marvel Comics Iron Man suits use overlapping Crimson abdominal lames and hinged pelvic hip-tassets so Tony Stark can twist and crouch freely without exposing a single millimeter of unarmored gap!',
      build(g) {
        const b = new MeshBatch();

        // 1A. 100% Candy-Apple Crimson Marvel Comics Pelvic Trunks (y = 0.078 .. 0.268, open double-walled hollow!)
        addHollowTube(
          b,
          {
            ...TORSO,
            tFrom: T_AT(0.078),
            tTo: T_AT(0.268),
            N: 56,
            steps: 14,
            wallRatio: 0.86,
            openStart: true,
            openEnd: true,
          },
          comicCrimson,
          innerLiner,
          rimGold,
        );

        // Sculpted anterior & gluteal Crimson trunk armor plates for crisp multi-piece comic relief
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: -0.34 * Math.PI,
            aTo: 0.34 * Math.PI,
            tFrom: T_AT(0.092),
            tTo: T_AT(0.248),
            ns: 8,
            nt: 20,
            offset: 0.0055,
          }),
          deepCrimson,
        );
        b.add(
          axialPatch({
            ...TORSO,
            aFrom: 0.68 * Math.PI,
            aTo: 1.32 * Math.PI,
            tFrom: T_AT(0.095),
            tTo: T_AT(0.248),
            ns: 8,
            nt: 18,
            offset: 0.005,
          }),
          deepCrimson,
        );

        // 1B. Upper Ribbed Waist Ballistic Flex-Girdle (y = 0.268 .. 0.520, dark gunmetal under Crimson lames!)
        addHollowTube(
          b,
          {
            ...TORSO,
            tFrom: T_AT(0.268),
            tTo: T_AT(0.520),
            N: 56,
            steps: 14,
            wallRatio: 0.86,
            openStart: false,
            openEnd: true,
          },
          gunmetal,
          innerLiner,
          rimTitanium,
        );

        // 2. Overlapping 4-Tier Marvel Comics Crimson Abdominal Rib Lames (leaving crisp dark gunmetal flex gaps!)
        for (let i = 0; i < 4; i++) {
          const yLo = 0.300 + i * 0.052;
          const yHi = yLo + 0.043;
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: -0.44 * Math.PI,
              aTo: 0.44 * Math.PI,
              tFrom: T_AT(yLo),
              tTo: T_AT(yHi),
              ns: 6,
              nt: 26,
              offset: 0.0072,
              radial: (t, a) => torsoRadial(t, a) + 0.024 * gauss(Math.abs(a), 0.0, 0.22),
            }),
            i % 2 === 0 ? comicCrimson : deepCrimson,
          );
          // Rear lumbar Crimson armor lames
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: 0.56 * Math.PI,
              aTo: 1.44 * Math.PI,
              tFrom: T_AT(yLo),
              tTo: T_AT(yHi),
              ns: 5,
              nt: 22,
              offset: 0.0065,
            }),
            i % 2 === 0 ? deepCrimson : comicCrimson,
          );
        }

        // Lateral Oblique / Serratus Hinged Crimson Plates with Titanium Hex Fasteners
        for (const side of [-1, 1]) {
          b.add(
            axialPatch({
              ...TORSO,
              aFrom: side > 0 ? 0.36 * Math.PI : -0.64 * Math.PI,
              aTo: side > 0 ? 0.64 * Math.PI : -0.36 * Math.PI,
              tFrom: T_AT(0.30),
              tTo: T_AT(0.50),
              ns: 8,
              nt: 12,
              offset: 0.0085,
            }),
            deepCrimson,
          );
          // Hinged pelvic hip-skirt tassets with gold trim
          b.rbox(0.115, 0.088, 0.014, 0.004, comicCrimson, [0.012, 0.165, side * 0.186], [side * 0.12, 0, 0]);
          b.rbox(0.117, 0.014, 0.016, 0.002, comicGold, [0.012, 0.124, side * 0.191], [side * 0.12, 0, 0]);
        }

        // 3. Machined 22K Champagne Gold Marvel Comics Pointed V-Belt & Central Stark Buckle (360° outward!)
        b.add(
          axialBand({
            ...TORSO,
            tFrom: T_AT(0.244),
            tTo: T_AT(0.298),
            N: 56,
            steps: 6,
            scaleMul: 1.055,
            radial: (t, a) => torsoRadial(t, a) + 0.032 * gauss(Math.abs(a), 0.0, 0.18),
          }),
          comicGold,
        );
        // Segmented belt utility link blocks + Central Crimson/Gold V-Buckle Medallion
        for (const side of [-1, 1]) {
          for (const az of [0.35, 0.68, 2.45]) {
            const a = side * az;
            const st = torsoSample(T_AT(0.271));
            const rp = ringPoint(axisFrame(TORSO.origin, TORSO.axis, TORSO.up), TORSO_H, T_AT(0.271), a, st, (torsoRadial(T_AT(0.271), a) + 0.04) * 1.04);
            b.rbox(0.018, 0.046, 0.034, 0.003, richGold, rp, [0, -a, 0]);
          }
        }
        // Classic Marvel Comics pointed V-buckle chevron
        b.rbox(0.022, 0.068, 0.082, 0.006, comicGold, [0.150, 0.258, 0], [0, 0, -0.06]);
        b.rbox(0.025, 0.046, 0.056, 0.004, comicCrimson, [0.154, 0.258, 0], [0, 0, -0.06]);
        b.cone(0.032, 0.044, 4, comicGold, [0.152, 0.218, 0], [0, Math.PI / 4, Math.PI]);

        // Hollow lower pelvic codpiece saddle arch
        b.rbox(0.198, 0.046, 0.088, 0.016, comicCrimson, [0.006, 0.062, 0]);
        b.rbox(0.176, 0.022, 0.072, 0.006, innerLiner, [0.006, 0.082, 0]);

        b.flush(g);
      },
    },

    // ========================================================================
    // 7. MACHINED TWIN MARVEL COMICS CIRCULAR HIP POWER PODS & SOLAR COILS
    // ========================================================================
    {
      id: 'comic-hip-power-pods',
      i18n: {"es-419":{"name":"Cápsulas Circulares de Energía de Cadera, Bobinas de Cobre y Lanzabengalas","desc":"Los inconfundibles discos circulares gemelos de cadera de Marvel Comics mecanizados en oro cepillado de 22K: la cápsula derecha muestra una celda solar-termoeléctrica con embobinado de cobre puro, mientras que la izquierda aloja un tambor rotativo de 8 bengalas infrarrojas defensivas.","funFact":"¡Esos discos redondos en las caderas de Iron Man en los cómics clásicos son baterías auxiliares recargables por energía solar y dispensadores rotativos de contramedidas térmicas!"},"es":{"name":"Cápsulas Circulares de Energía de Cadera, Bobinas de Cobre y Lanzabengalas","desc":"Discos circulares gemelos de cadera mecanizados en oro cepillado de 22K: el derecho integra una batería auxiliar con bobinas de cobre visto y el izquierdo un dispensador rotativo de 8 bengalas defensivas.","funFact":"¡Los característicos discos redondos en las caderas del Iron Man clásico funcionan como acumuladores solares auxiliares y lanzadores de contramedidas!"}},
      name: 'Machined Twin Circular Marvel Comics Hip Power Pods, Copper Coils & Flare Discs',
      category: 'Waist Power & Countermeasures',
      isOuter: false,
      explodeOffset: [-0.88, -0.14, 0],
      desc: 'Iron Man’s #1 unmistakable Marvel Comics waist signature from Tales of Suspense through Extremis: CNC-machined circular Crimson-and-Gold Hip Power Pods with 8 hex bolts, exposed radial copper solar/thermocouple converter coils beneath a sapphire ring window, and 6 peripheral rotary flare/EMP dispenser tubes.',
      funFact: 'In Eliot R. Brown’s Official Handbook of the Marvel Universe schematics, Iron Man’s circular hip pods double as high-density auxiliary battery packs and emergency solar-energy converters!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const px = 0.012;
          const py = 0.238;
          const pz = side * 0.202;
          const rotZ = -side * 0.08;

          // Outer Crimson armored circular pod drum + knurled 22K Gold bezel
          b.cyl(0.070, 0.074, 0.038, 36, comicCrimson, [px, py, pz], [Math.PI / 2 + rotZ, 0, 0]);
          b.torus(0.068, 0.007, comicGold, [px, py, pz + side * 0.017], [0, Math.PI / 2, 0]);
          b.cyl(0.054, 0.056, 0.012, 32, darkSlot, [px, py, pz + side * 0.018], [Math.PI / 2 + rotZ, 0, 0]);

          // 10 Exposed Radial Copper Solar/Thermocouple Coils + 8 Titanium Hex Bolts!
          for (let k = 0; k < 10; k++) {
            const ang = (k / 10) * TAU;
            b.rbox(
              0.012,
              0.008,
              0.008,
              0.002,
              copperCoil,
              [px + Math.cos(ang) * 0.040, py + Math.sin(ang) * 0.040, pz + side * 0.023],
              [0, 0, ang],
            );
          }
          for (let k = 0; k < 8; k++) {
            const ang = (k / 8) * TAU + Math.PI / 8;
            b.cyl(
              0.0028,
              0.0028,
              0.008,
              6,
              silver,
              [px + Math.cos(ang) * 0.064, py + Math.sin(ang) * 0.064, pz + side * 0.021],
              [Math.PI / 2, 0, 0],
            );
          }

          // Central 22K Gold Cap + Amber Charge Core + Sapphire Ring Cover
          b.cyl(0.028, 0.032, 0.016, 24, comicGold, [px, py, pz + side * 0.022], [Math.PI / 2 + rotZ, 0, 0]);
          b.cyl(0.014, 0.014, 0.019, 20, repulsorGold, [px, py, pz + side * 0.024], [Math.PI / 2 + rotZ, 0, 0]);
          b.cyl(0.052, 0.052, 0.003, 28, sapphireLens, [px, py, pz + side * 0.026], [Math.PI / 2 + rotZ, 0, 0]);

          // 6 Peripheral Rotary Flare / Chaff Countermeasure Micro-Tubes
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * TAU;
            b.cyl(
              0.0052,
              0.0052,
              0.014,
              10,
              gunmetal,
              [px + Math.cos(ang) * 0.057, py + Math.sin(ang) * 0.057, pz + side * 0.019],
              [Math.PI / 2, 0, 0],
            );
          }

          // Inner-side titanium bayonet mount & blue toroidal capacitor ring
          b.torus(0.048, 0.008, rimTitanium, [px, py, pz - side * 0.017], [0, Math.PI / 2, 0]);
          b.torus(0.034, 0.0045, bioScanCyan, [px, py, pz - side * 0.018], [0, Math.PI / 2, 0]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 8. POLARIZED 22K GOLD QUADRICEPS SLEEVES & ARTICULATED KNEE COPS
    // ========================================================================
    {
      id: 'thigh-exo-thrusters',
      i18n: {"es-419":{"name":"Musleras Polarizadas de Oro de 22K y Rodilleras Articuladas Carmesí y Oro","desc":"Cilindros femorales huecos de doble pared recubiertos con micromalla polarizada de oro de 22K, tendones hidráulicos lineales que multiplican la fuerza de levantamiento y rodilleras poligonales articuladas en carmesí y oro con tambores de torsión.","funFact":"¡Al activar el campo magnético de alta densidad en las musleras doradas, el exoesqueleto multiplica la fuerza de las piernas lo suficiente para levantar decenas de toneladas!"},"es":{"name":"Musleras Polarizadas de Oro de 22K y Rodilleras Articuladas Carmesí y Oro","desc":"Cilindros femorales huecos de doble pared con micromalla polarizada de oro de 22K, actuadores lineales de fuerza y rodilleras poligonales articuladas en carmesí y oro.","funFact":"¡Cuando se polarizan magnéticamente las musleras doradas, los actuadores femorales permiten a la armadura soportar cargas de decenas de toneladas!"}},
      name: 'Hollow Polarized 22K Gold Quadriceps Sleeves & Articulated Crimson/Gold Knee Cops',
      category: 'Upper Leg Armor',
      isOuter: true,
      explodeOffset: [-0.62, -0.42, 0],
      desc: '100% gleaming Marvel Comics 22K Titanium-Gold quadriceps & hamstring thigh sleeves engineered as wide-open double-walled hollow cylinders (~13 mm wall thickness, zero solid plugs) with anatomical vastus lateralis & teardrop quad contours, lateral vernier strips, rotary knee bearings, and sculpted Crimson-and-Gold patella knee shields.',
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
            N: 48,
            steps: 22,
            wallRatio: 0.85,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.106, r1n: 0.104, r2: 0.102, n: 2.4, c1: 0.004 }, // Wide open hip cuff!
              { t: 0.30, r1: 0.122, r1n: 0.114, r2: 0.116, n: 2.5, c1: 0.011 }, // Powerful athletic quad sweep!
              { t: 0.64, r1: 0.110, r1n: 0.100, r2: 0.102, n: 2.5, c1: 0.007 },
              { t: 1.00, r1: 0.085, r1n: 0.081, r2: 0.084, n: 2.4 }, // Open knee cuff!
            ],
            radial: (t, a) => {
              // Anatomical rectus femoris, vastus lateralis sweep & inner vastus medialis teardrop!
              const rectus = 0.048 * gauss(t, 0.38, 0.20) * gauss(Math.abs(a), 0.12, 0.26);
              const lateralis = 0.042 * gauss(t, 0.44, 0.22) * gauss(a, side * 1.15, 0.34);
              const medialis = 0.038 * gauss(t, 0.74, 0.12) * gauss(a, -side * 0.62, 0.26);
              const hamstring = 0.032 * gauss(t, 0.40, 0.20) * gauss(Math.abs(a), Math.PI * 0.88, 0.32);
              return 1 + rectus + lateralis + medialis + hamstring;
            },
          };

          // 100% Gleaming Polarized 22K Titanium-Gold Double-Walled Hollow Thigh Cylinder!
          addHollowTube(b, thighSpec, polarizedGoldMesh, innerLiner, rimGold);

          // Rigid Brushed 22K Gold Anterior Quadriceps Armor Plate & Lateral Vernier Strip
          b.add(
            axialPatch({
              ...thighSpec,
              aFrom: -0.28 * Math.PI,
              aTo: 0.28 * Math.PI,
              tFrom: 0.14,
              tTo: 0.84,
              ns: 14,
              nt: 18,
              offset: 0.0045,
            }),
            comicGold,
          );
          const tRot = eulerAlong(thighDir);
          b.rbox(
            0.032,
            0.225,
            0.014,
            0.003,
            gunmetal,
            [(H[0] + K[0]) * 0.5 + 0.006, (H[1] + K[1]) * 0.5 + 0.02, (H[2] + K[2]) * 0.5 + side * 0.112],
            tRot,
          );
          b.rbox(
            0.018,
            0.195,
            0.016,
            0.002,
            comicGold,
            [(H[0] + K[0]) * 0.5 + 0.006, (H[1] + K[1]) * 0.5 + 0.02, (H[2] + K[2]) * 0.5 + side * 0.114],
            tRot,
          );

          // Open-Bore Rotary Knee Caliper Bearings + Sculpted Crimson & Gold Patella Shield!
          for (const calSide of [-1, 1]) {
            const kz = K[2] + calSide * 0.086;
            b.cyl(0.024, 0.024, 0.014, 20, gunmetal, [K[0], K[1], kz], [Math.PI / 2, 0, 0]);
            b.cyl(0.013, 0.013, 0.018, 16, rimTitanium, [K[0], K[1], kz + calSide * 0.002], [Math.PI / 2, 0, 0]);
          }
          b.rbox(0.026, 0.090, 0.088, 0.010, comicGold, [K[0] + 0.086, K[1] + 0.010, K[2]]);
          b.rbox(0.018, 0.068, 0.066, 0.006, comicCrimson, [K[0] + 0.094, K[1] + 0.010, K[2]]);
          b.rbox(0.016, 0.074, 0.076, 0.006, innerLiner, [K[0] + 0.072, K[1] + 0.010, K[2]]);
        }
        b.flush(g);
      },
    },

    // ========================================================================
    // 9. FLARED CRIMSON JET BOOTS, CALF AIR-INTAKES, ACHILLES HYDRAULICS & TURBINES
    // ========================================================================
    {
      id: 'calf-boot-jet-thrusters',
      i18n: {"es-419":{"name":"Botas a Reacción Carmesí, Tomas de Aire y Turbinas Vectoriales en las Suelas","desc":"Botas supersónicas huecas de puño acampanado con tomas de aire dinámicas en las pantorrillas, amortiguadores hidráulicos gemelos en los tobillos para aterrizajes pesados y cámaras de poscombustión duales con toberas vectoriales bajo el talón y la planta del pie.","funFact":"¡Las botas a reacción de Iron Man comprimen aire atmosférico mediante turbinas en vuelos normales y cambian a propelente líquido sellado cuando sale al espacio exterior!"},"es":{"name":"Botas a Reacción Carmesí, Tomas de Aire y Turbinas Vectoriales en las Suelas","desc":"Botas supersónicas huecas de puño acampanado con tomas dinámicas en las pantorrillas, amortiguadores hidráulicos en los tobillos y toberas vectoriales bajo el talón y la suela.","funFact":"¡Las botas a reacción de Iron Man aspiran aire atmosférico durante el vuelo terrestre y conmutan a circuito cerrado al salir a órbita!"}},
      name: 'Hollow Flared Crimson Jet Boots, Calf Ram-Intakes, Ankle Hydraulics & Gimbaled Turbines',
      category: 'Jet Boots & Propulsion',
      isOuter: true,
      explodeOffset: [0.32, -0.92, 0],
      desc: 'Iconic Marvel Comics Crimson cuffed jet boots sculpted with gastrocnemius calf musculature, sweeping V-flared comic knee collars trimmed in 22K Gold, Eliot R. Brown calf ram-air intake louvers, exposed Achilles hydraulic dampers, articulated multi-plate foot armor, and gimbaled 12-vane sole turbo-jet nozzles.',
      funFact: 'According to Marvel’s Official Handbook schematics, Iron Man’s calves scoop in outside air through louvered intakes, compress it with miniature electric turbines, and blast superheated exhaust out of his boot soles!',
      build(g) {
        const b = new MeshBatch();
        for (const side of [-1, 1]) {
          const K = KNEE(side);
          const A = ANKLE(side);
          const shinStart = [K[0] - 0.004, K[1] + 0.028, K[2]];
          const shinDir = [A[0] - shinStart[0], A[1] - shinStart[1], A[2] - shinStart[2]];

          // 1. Open-Top Hollow Crimson Shin/Calf Greave with Sweeping Flared Marvel Comics Boot Collar!
          const shinSpec = {
            origin: shinStart,
            axis: shinDir,
            up: [1, 0, 0],
            N: 48,
            steps: 24,
            wallRatio: 0.84,
            openStart: true,
            openEnd: true,
            stations: [
              { t: 0.00, r1: 0.110, r1n: 0.100, r2: 0.106, n: 2.6, c1: 0.008 }, // Sweeping flared comic boot-cuff collar!
              { t: 0.16, r1: 0.090, r1n: 0.090, r2: 0.090, n: 2.5 },
              { t: 0.36, r1: 0.090, r1n: 0.108, r2: 0.098, n: 2.5, c1: -0.009 }, // Muscular gastrocnemius calf flare!
              { t: 0.72, r1: 0.075, r1n: 0.077, r2: 0.075, n: 2.6 },
              { t: 1.00, r1: 0.070, r1n: 0.072, r2: 0.071, n: 2.7 },
            ],
            radial: (t, a) => {
              const frontCrest = 0.17 * (1 - smoothstep(0.0, 0.22, t)) * gauss(Math.abs(a), 0.0, 0.34);
              const shinRidge = 0.048 * smoothstep(0.14, 0.34, t) * gauss(Math.abs(a), 0.0, 0.15);
              const calfHeads = 0.036 * gauss(t, 0.38, 0.16) * gauss(Math.abs(a), Math.PI * 0.82, 0.28);
              return 1 + frontCrest + shinRidge + calfHeads;
            },
          };
          addHollowTube(b, shinSpec, comicCrimson, innerLiner, rimGold);

          // Overlapping Anterior Shin Guard Plate + Gleaming 22K Gold Flared Boot-Cuff Trim!
          b.add(
            axialPatch({
              ...shinSpec,
              aFrom: -0.26 * Math.PI,
              aTo: 0.26 * Math.PI,
              tFrom: 0.12,
              tTo: 0.88,
              ns: 12,
              nt: 16,
              offset: 0.0048,
            }),
            deepCrimson,
          );
          b.add(
            axialBand({
              ...shinSpec,
              tFrom: 0.0,
              tTo: 0.07,
              N: 48,
              steps: 4,
              scaleMul: 1.042,
            }),
            comicGold,
          );

          // Eliot R. Brown OHOTMU Calf Ram-Air Compressor Intake Scoops & 6 Titanium Louver Blades!
          const cx = (K[0] + A[0]) * 0.5 - 0.072;
          const cy = (K[1] + A[1]) * 0.5 + 0.058;
          const cz = (K[2] + A[2]) * 0.5 + side * 0.054;
          b.rbox(0.050, 0.112, 0.032, 0.005, gunmetal, [cx, cy, cz], [0, side * 0.45, 0.08]);
          b.rbox(0.032, 0.088, 0.016, 0.002, unibeamCyan, [cx + 0.006, cy, cz], [0, side * 0.45, 0.08]);
          for (let li = -2.5; li <= 2.5; li += 1) {
            b.rbox(0.040, 0.0055, 0.034, 0.001, rimTitanium, [cx - 0.005, cy + li * 0.015, cz + side * 0.004], [0, side * 0.45, 0.28]);
          }

          // Exposed Achilles Twin Hydraulic Shock-Absorber Struts & Malleolus Ankle Bearings!
          for (const ankSide of [-1, 1]) {
            const az = A[2] + ankSide * 0.072;
            b.cyl(0.022, 0.022, 0.012, 18, gunmetal, [A[0], A[1] - 0.015, az], [Math.PI / 2, 0, 0]);
            b.cyl(0.012, 0.012, 0.016, 14, comicGold, [A[0], A[1] - 0.015, az + ankSide * 0.002], [Math.PI / 2, 0, 0]);
            addHydraulicStrut(
              b,
              [A[0] - 0.068, A[1] + 0.125, A[2] + ankSide * 0.028],
              [A[0] - 0.076, A[1] - 0.048, A[2] + ankSide * 0.032],
              0.0055,
              gunmetal,
              silver,
              richGold,
            );
          }

          // 2. Hollow Multi-Plate Armored Crimson Boot Foot Carapace (leaves hollow dome for human foot!)
          const bootSpec = {
            origin: [A[0] - 0.078, -0.945, A[2]],
            axis: [0.282, -0.010, -side * 0.022],
            up: [0, 1, 0],
            stations: [
              { t: 0.00, r1: 0.074, r1n: 0.042, r2: 0.070, n: 2.6, c1: 0.018 }, // Heel counter
              { t: 0.35, r1: 0.084, r1n: 0.042, r2: 0.076, n: 2.7, c1: 0.016 }, // Instep arch (hollow inside!)
              { t: 0.72, r1: 0.060, r1n: 0.040, r2: 0.074, n: 2.8, c1: -0.002 }, // Forefoot
              { t: 1.00, r1: 0.034, r1n: 0.032, r2: 0.054, n: 2.9, c1: -0.014 }, // Armored toe cap
            ],
          };
          addThickClamshell(
            b,
            {
              ...bootSpec,
              aFrom: -0.58 * Math.PI,
              aTo: 0.58 * Math.PI,
              tFrom: 0.0,
              tTo: 1.0,
              ns: 16,
              nt: 22,
              wallThick: 0.0115,
            },
            comicCrimson,
            innerLiner,
            rimTitanium,
          );
          // Overlapping Instep Tongue Shield & Gold Toe Trim
          b.add(
            axialPatch({
              ...bootSpec,
              aFrom: -0.36 * Math.PI,
              aTo: 0.36 * Math.PI,
              tFrom: 0.24,
              tTo: 0.68,
              ns: 8,
              nt: 14,
              offset: 0.0085,
            }),
            deepCrimson,
          );
          b.add(
            axialPatch({
              ...bootSpec,
              aFrom: -0.45 * Math.PI,
              aTo: 0.45 * Math.PI,
              tFrom: 0.82,
              tTo: 0.98,
              ns: 4,
              nt: 14,
              offset: 0.007,
            }),
            comicGold,
          );

          // 3. Heavy Thermal-Tile Thrust Sole + Gimbaled 12-Vane Sole Turbo-Jet Nozzles!
          const soleX = A[0] + 0.058;
          const soleZ = A[2] - side * 0.008;
          b.rbox(0.292, 0.024, 0.146, 0.006, gunmetal, [soleX, -0.986, soleZ], [0, side * 0.08, 0]);
          b.rbox(0.270, 0.008, 0.126, 0.003, innerLiner, [soleX, -0.972, soleZ], [0, side * 0.08, 0]);

          for (const [nxOff, nr] of [[-0.048, 0.046], [0.064, 0.034]]) {
            const nx = soleX + nxOff;
            b.torus(nr, 0.007, rimTitanium, [nx, -0.996, soleZ], [Math.PI / 2, 0, 0]);
            b.torus(nr * 0.80, 0.004, copperCoil, [nx, -0.997, soleZ], [Math.PI / 2, 0, 0]);
            for (let v = 0; v < 12; v++) {
              const va = (v / 12) * TAU;
              b.box(
                0.003,
                0.008,
                nr * 0.36,
                silver,
                [nx + Math.cos(va) * nr * 0.82, -0.997, soleZ + Math.sin(va) * nr * 0.82],
                [0, -va, 0],
              );
            }
            b.cyl(nr * 0.72, nr * 0.72, 0.006, 24, unibeamCore, [nx, -0.998, soleZ]);
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
      i18n: {"es-419":{"name":"Cavidad Interior Hueca para el Piloto, Forro Térmico Nomex y Aviónica","desc":"Arquitectura verdaderamente hueca y vestible a escala humana: al activar Rayos X o ¡Desarmar!, todas las corazas externas se abren para revelar la cavidad anatómica donde entra Tony Stark, tapizada con forro acolchado térmico de Kevlar/Nomex, anillos de escaneo biométrico y conductos de energía montados en las paredes internas.","funFact":"¡A diferencia de los robots macizos, cada pieza de esta armadura tiene espesor real de doble pared y espacio libre en el centro para que un piloto humano quepa cómodamente adentro!"},"es":{"name":"Cavidad Interior Hueca para el Piloto, Forro Térmico Nomex y Aviónica","desc":"Arquitectura verdaderamente hueca y vestible a escala humana: en vista de Rayos X o ¡Despiezar!, las placas exteriores muestran la cavidad anatómica para el piloto humano con forro acolchado de Kevlar/Nomex y conductos de aviónica perimetrales.","funFact":"¡Cada placa de esta armadura tiene doble pared real y una cavidad interior despejada diseñada a medida para albergar un cuerpo humano en su interior!"}},
      name: 'Hollow Human Pilot Cavity, Thermocouple Undersuit Sheath & Cybernetic Avionics',
      category: 'Wearable Pilot Interior',
      isOuter: false,
      explodeOffset: [0, 0, 0],
      desc: 'Wearable interior of the Marvel Comics Iron Man suit—proving there is hollow room for a real person inside! Features the open-necked dark navy quilted Kevlar/thermocouple undersuit sheath with cutaway rib windows, translucent human pilot ergonomic clearance volume, helmet neuro-transponder headband, flush sternum RT Unibeam coupling, and footbed turbine impellers.',
      funFact: 'Before clamping his red-and-gold plates shut, comic-book Tony Stark wears a padded ballistic-and-thermocouple inner bodysuit (upgraded in Extremis into a gold-piped bio-sheath) that insulates him from -200°F stratospheric cold and 2,000°F re-entry heat!',
      build(g) {
        const b = new MeshBatch();

        // 1. Cutaway Hollow Navy-and-Gold Extremis / Ballistic Undersuit Sheath
        for (const side of [-1, 1]) {
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
          b.rbox(0.185, 0.044, 0.074, 0.018, pilotHolo, [ANKLE(side)[0] + 0.048, -0.925, ANKLE(side)[2] - side * 0.006]);
        }

        // 3. Wall-Mounted Marvel Comics Internal Avionics (wrapping AROUND the pilot, never blocking center!)
        b.torus(0.088, 0.0045, comicGold, [0.010, 1.215, 0], [Math.PI / 2 - 0.08, 0, 0], [1.06, 0.90, 1]);
        for (const side of [-1, 1]) {
          b.cyl(0.014, 0.014, 0.008, 16, bioScanCyan, [0.020, 1.210, side * 0.082], [Math.PI / 2, 0, 0]);
        }
        b.torus(0.095, 0.005, bioScanCyan, [0.032, 1.196, 0], [Math.PI / 2, 0, -Math.PI * 0.25], [1, 0.85, 1]);
        b.rbox(0.022, 0.020, 0.052, 0.005, gunmetal, [0.108, 1.100, 0]);

        // Flush Sternum-Wall Repulsor Tech (RT) Unibeam Thermoelectric Core
        const rtx = 0.180;
        const rty = 0.758;
        b.torus(0.048, 0.007, comicGold, [rtx, rty, 0], [0, Math.PI / 2, -0.10]);
        b.cyl(0.040, 0.040, 0.012, 28, unibeamCore, [rtx + 0.004, rty, 0], [0, 0, Math.PI / 2 - 0.10]);

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
    badge: 'Mach 3+ • 12-Coil Unibeam • Hollow Wearable Diecast Armor',
    desc: 'Collector-grade 1:1 photorealistic Marvel Comics Iron Man Powered Exoskeleton inspired by Eliot R. Brown’s Official Handbook schematics, Bob Layton’s Classic Model 4, and Adi Granov’s Extremis armor: brushed 22K Champagne Gold faceplate with sapphire HUD eye slits, deep Candy-Apple Clearcoat Crimson multi-plate armor, 12-coil Chest Unibeam, machined twin circular Hip Power Pods, polarized 22K Gold micro-weave bicep & thigh sleeves, hydraulic rotary joints, 5-fingered articulated repulsor gauntlets, and a genuinely hollow double-walled interior built for a human pilot inside.',
    cameraPos: [3.10, 1.12, 3.00],
    cameraTarget: [0, 0.16, 0],
    parts,
    quiz: [
      {
        q: 'Which multi-spectrum 12-coil chest projector in Iron Man’s Crimson front clamshell fires searchlights, tractor beams, lasers, and concussive blasts?',
        correctId: 'arc-reactor-chestplate',
        distractors: ['mark85-helmet-hud', 'pauldron-missile-pods', 'thigh-exo-thrusters'],
      },
      {
        q: 'Which twin circular Marvel Comics waist discs store auxiliary solar-thermocouple battery power and dispense defensive flares?',
        correctId: 'comic-hip-power-pods',
        distractors: ['dorsal-airbrake-array', 'calf-boot-jet-thrusters', 'abdominal-pelvis-armor'],
      },
      {
        q: 'Which flared-cuff Crimson arm components house Iron Man’s 5-fingered sapphire-lensed palm flight stabilizers and concussive repulsor rays?',
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
