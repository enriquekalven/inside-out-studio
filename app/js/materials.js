// Hyper-Realistic Procedural PBR Material, Texture & Micro-Mechanical 3D Geometry Builders for Inside Out Studio.
// Includes clearcoat automotive paint, physical glass, carbon fiber weave, brushed metals, honeycomb grilles,
// cross-drilled brake rotors, radial tires, emerald/black PCBs, solar cells, OLED screens,
// AND Micro-Mechanical Detail Builders:
// - buildHexBoltArray (6-sided hex bolts, washers, Torx/Pentalobe screws, studs)
// - buildWiringHarness (multi-strand color-coded HV orange/red/blue/yellow looms, P-clamps, Deutsch plugs, braided AN hoses)
// - buildDetailedEngineBlock (pistons, H-beam con-rods, crankshaft, DOHC valve covers with 16 hex bolts, ignition coils, tubular headers, twin turbos, serpentine belt drive)
// - buildDetailedEVDriveUnit (hairpin copper stator windings, carbon-sleeved rotor, SiC inverter busbars, HV orange harness)
// - buildCoiloverSuspension (3D helical coilover springs around anodized damper shafts, A-arm wishbones, tie rods, braided brake lines)
// - buildDetailedWheel (5/10 3D hex lug nuts, recessed lug wells, tire valve stem, 12 rotor bobbins, Brembo caliper bleeder screw & spin/steer pivots)
// - buildSculptedCarBody (flared 3D wheel arches, contoured hood & pillars, side mirrors, wipers, projector headlamps, honeycomb grilles, diffuser)
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

const textureCache = new Map();

function getCachedTexture(key, width, height, drawFn, opts = {}) {
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

// ============================================================================
// Procedural Canvas Textures
// ============================================================================
export function carbonFiberTexture(repeat = [6, 6]) {
  return getCachedTexture(
    `carbon_${repeat.join('_')}`,
    64,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#12151a';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          const odd = ((x + y) / 8) % 2 === 0;
          ctx.fillStyle = odd ? '#282e38' : '#171b22';
          ctx.fillRect(x, y, 7, 7);
          ctx.fillStyle = odd ? '#3a4250' : '#0d1014';
          ctx.fillRect(x + 1, y + 1, 5, 2);
        }
      }
    },
    { repeat },
  );
}

export function brushedMetalTexture(baseHex = '#bfc6cf', repeat = [2, 2]) {
  return getCachedTexture(
    `brushed_${baseHex}_${repeat.join('_')}`,
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
        ctx.fillRect(0, y, w, 1);
      }
    },
    { repeat },
  );
}

export function honeycombGrilleTexture(repeat = [6, 2]) {
  return getCachedTexture(
    `honeycomb_${repeat.join('_')}`,
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#07090d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      const stepX = 24;
      const stepY = 20;
      for (let row = 0; row < h / stepY + 1; row++) {
        for (let col = 0; col < w / stepX + 1; col++) {
          const cx = col * stepX + (row % 2 ? stepX / 2 : 0);
          const cy = row * stepY;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            const px = cx + Math.cos(a) * 10;
            const py = cy + Math.sin(a) * 10;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    },
    { repeat },
  );
}

export function brakeRotorTexture() {
  return getCachedTexture('brake_rotor_v2', 256, 256, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#b4bcc4';
    ctx.fillRect(0, 0, w, h);
    // Concentric machined grooves
    for (let r = 36; r < 124; r += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = r % 6 === 0 ? '#8e98a4' : '#d2d9e0';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    // Dark anodized center bell hat
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#1e232b';
    ctx.fill();
    // Slotted J-hook grooves + cross-drilled ventilation holes
    ctx.strokeStyle = '#15181e';
    ctx.lineWidth = 2.4;
    ctx.fillStyle = '#12151a';
    for (let arm = 0; arm < 12; arm++) {
      const baseAngle = (arm / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(baseAngle) * 55, cy + Math.sin(baseAngle) * 55);
      ctx.lineTo(cx + Math.cos(baseAngle + 0.18) * 116, cy + Math.sin(baseAngle + 0.18) * 116);
      ctx.stroke();
      for (let step = 0; step < 4; step++) {
        const rad = 58 + step * 15;
        const a = baseAngle + 0.09 + step * 0.09;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 3.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

export function tireTreadTexture() {
  return getCachedTexture(
    'tire_tread_v2',
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#181b20';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0b0d10';
      // 4 deep circumferential rain channels
      ctx.fillRect(20, 0, 7, h);
      ctx.fillRect(48, 0, 8, h);
      ctx.fillRect(74, 0, 8, h);
      ctx.fillRect(102, 0, 7, h);
      // Directional V-sipes & shoulder blocks
      ctx.strokeStyle = '#090b0e';
      ctx.lineWidth = 4;
      for (let y = 0; y < h; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(20, y + 7);
        ctx.moveTo(27, y + 3);
        ctx.lineTo(48, y + 10);
        ctx.moveTo(82, y + 10);
        ctx.lineTo(102, y + 3);
        ctx.moveTo(109, y + 7);
        ctx.lineTo(128, y);
        ctx.stroke();
      }
    },
    { repeat: [5, 1] },
  );
}

export function pcbTexture(substrate = '#0b5d3b') {
  return getCachedTexture(`pcb_${substrate}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = substrate;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    for (let i = 12; i < w; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 8);
      ctx.lineTo(i, h * 0.45);
      ctx.lineTo(i + 10, h * 0.55);
      ctx.lineTo(i + 10, h - 10);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e5c158';
    ctx.lineWidth = 1.5;
    for (let y = 20; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }
    for (let y = 18; y < h - 18; y += 32) {
      for (let x = 18; x < w - 18; x += 38) {
        ctx.fillStyle = '#14181f';
        ctx.fillRect(x, y, 16, 12);
        ctx.fillStyle = '#f2c94c';
        ctx.fillRect(x - 3, y + 2, 3, 8);
        ctx.fillRect(x + 16, y + 2, 3, 8);
      }
    }
  });
}

export function solarGridTexture() {
  return getCachedTexture(
    'solar_grid_v1',
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#10254c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#5c9ce6';
      ctx.lineWidth = 2;
      for (let x = 0; x <= w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      for (let x = 8; x < w; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    { repeat: [2, 2] },
  );
}

export function oledScreenTexture(style = 'ios') {
  return getCachedTexture(`oled_${style}`, 256, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    if (style === 'ios') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.45, '#1d4ed8');
      grad.addColorStop(0.8, '#7c3aed');
      grad.addColorStop(1, '#f43f5e');
    } else if (style === 'pixel') {
      grad.addColorStop(0, '#0b132b');
      grad.addColorStop(0.5, '#0f766e');
      grad.addColorStop(1, '#38bdf8');
    } else if (style === 'samsung') {
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#f59e0b');
    } else if (style === 'dashboard') {
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    } else {
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0284c7');
      grad.addColorStop(1, '#10b981');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.35, 78, 0, Math.PI * 2);
    ctx.fill();

    const cols = 4;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < cols; c++) {
        const ix = 26 + c * 54;
        const iy = 120 + r * 64;
        ctx.fillStyle = ['#38bdf8', '#fbbf24', '#34d399', '#f87171'][(r + c) % 4];
        ctx.beginPath();
        ctx.roundRect(ix, iy, 38, 38, 9);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(w * 0.28, 48, w * 0.44, 16);
  });
}

export function brickWallTexture() {
  return getCachedTexture(
    'brick_wall_v1',
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#d8cfc2';
      ctx.fillRect(0, 0, w, h);
      const rows = 8;
      const bh = h / rows;
      const bw = w / 4;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (bw / 2);
        for (let c = -1; c < 5; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#b8523b' : '#c76148';
          ctx.fillRect(c * bw + offset + 2, r * bh + 2, bw - 4, bh - 4);
        }
      }
    },
    { repeat: [3, 2] },
  );
}

// ============================================================================
// High-Precision PBR Material Presets
// ============================================================================
export function mat(color, opts = {}) {
  if (opts.clearcoat) {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: opts.roughness ?? 0.16,
      metalness: opts.metalness ?? 0.55,
      clearcoat: opts.clearcoat ?? 1.0,
      clearcoatRoughness: opts.clearcoatRoughness ?? 0.05,
      reflectivity: 1.0,
      transparent: Boolean(opts.opacity && opts.opacity < 1),
      opacity: opts.opacity ?? 1,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
      map: opts.map || null,
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.36,
    metalness: opts.metalness ?? 0.25,
    transparent: Boolean(opts.opacity && opts.opacity < 1),
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    map: opts.map || null,
  });
}

export function carPaint(colorHex, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: opts.metalness ?? 0.65,
    roughness: opts.roughness ?? 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
    side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function brushedMetal(colorHex = 0xc4cbd4, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: opts.metalness ?? 0.88,
    roughness: opts.roughness ?? 0.22,
    clearcoat: opts.clearcoat ?? 0.35,
    clearcoatRoughness: 0.18,
    map: brushedMetalTexture('#d8dee6', opts.repeat || [2, 2]),
    side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function chromeMat(colorHex = 0xeef3f8) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.96,
    roughness: 0.06,
    clearcoat: 0.7,
  });
}

export function carbonFiberMat(repeat = [6, 6]) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: carbonFiberTexture(repeat),
    metalness: 0.38,
    roughness: 0.22,
    clearcoat: 0.88,
    clearcoatRoughness: 0.07,
  });
}

export function glassMat(colorHex = 0x8ecae6, opacity = 0.42) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.05,
    roughness: 0.06,
    transparent: true,
    opacity,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.95,
    side: THREE.DoubleSide,
  });
}

export function emissiveMat(colorHex = 0xffaa00, intensity = 0.85) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.1,
  });
}

export function pcbMat(substrate = '#0b5d3b') {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pcbTexture(substrate),
    roughness: 0.32,
    metalness: 0.42,
  });
}

export function screenMat(style = 'ios') {
  const tex = oledScreenTexture(style);
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tex,
    emissive: 0x223355,
    emissiveMap: tex,
    emissiveIntensity: 0.55,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
  });
}

// ============================================================================
// High-Precision 3D Geometry Primitives
// ============================================================================
export function addMesh(group, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

export function box(group, w, h, d, material, pos, rot, scale) {
  return addMesh(group, new THREE.BoxGeometry(w, h, d), material, pos, rot, scale);
}

export function rbox(group, w, h, d, radius = 0.04, material, pos, rot, scale) {
  return addMesh(group, new RoundedBoxGeometry(w, h, d, 3, radius), material, pos, rot, scale);
}

export function cyl(group, rTop, rBot, h, segs, material, pos, rot, scale) {
  return addMesh(group, new THREE.CylinderGeometry(rTop, rBot, h, segs), material, pos, rot, scale);
}

export function sphere(group, r, segs, a4, a5, a6, a7) {
  if (typeof a4 === 'number') {
    return addMesh(group, new THREE.SphereGeometry(r, segs, a4), a5, a6, a7);
  }
  return addMesh(group, new THREE.SphereGeometry(r, segs, segs), a4, a5, a6);
}

export function torus(group, r, tubeRadius, material, pos, rot, scale) {
  return addMesh(group, new THREE.TorusGeometry(r, tubeRadius, 16, 32), material, pos, rot, scale);
}

export function cone(group, r, h, segs, material, pos, rot, scale) {
  return addMesh(group, new THREE.ConeGeometry(r, h, segs), material, pos, rot, scale);
}

export function tube(group, pointsArray, radius, material, closed = false, segs = 28) {
  const vecs = pointsArray.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vecs, closed);
  const geo = new THREE.TubeGeometry(curve, segs, radius, 12, closed);
  return addMesh(group, geo, material);
}

export function extrudeProfile(group, pts, depth, material, pos = [0, 0, 0], rot = [0, 0, 0], bevel = 0.03) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i][0], pts[i][1]);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 18,
  });
  geo.translate(0, 0, -depth / 2);
  return addMesh(group, geo, material, pos, rot);
}

// ============================================================================
// PART 1: Micro-Mechanical Detail Engine ("Nuts, Bolts, Wires, Pistons & Springs")
// ============================================================================

/**
 * 1. buildHexBoltArray:
 * Renders 6-sided hexagonal bolt heads (`CylinderGeometry(r, r, h, 6)`) + flanged washers + threaded studs/sockets
 * in polished chrome, anodized titanium, gold zinc (`0xd4af37`), red/blue anodized, or black oxide.
 */
export function buildHexBoltArray(
  group,
  positions,
  {
    radius = 0.018,
    height = 0.016,
    finish = 'chrome', // 'chrome' | 'gold' | 'titanium' | 'black' | 'copper' | 'red' | 'blue'
    rot = [0, 0, 0],
    includeWasher = true,
    includeStud = true,
  } = {},
) {
  const finishColors = {
    chrome: 0xeef3f8,
    gold: 0xfbbf24,
    titanium: 0x94a3b8,
    black: 0x1e293b,
    copper: 0xd97724,
    red: 0xdc2626,
    blue: 0x2563eb,
  };
  const headMat =
    finish === 'chrome'
      ? chromeMat(finishColors.chrome)
      : brushedMetal(finishColors[finish] || 0xd8dee9, { metalness: 0.92, roughness: 0.14 });
  const washerMat = brushedMetal(0x64748b, { metalness: 0.85, roughness: 0.25 });
  const socketMat = mat(0x0f172a, { metalness: 0.7, roughness: 0.35 });

  const hexGeo = new THREE.CylinderGeometry(radius, radius, height, 6);
  const washerGeo = includeWasher
    ? new THREE.CylinderGeometry(radius * 1.42, radius * 1.42, height * 0.32, 14)
    : null;
  const studGeo = includeStud
    ? new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, height * 1.15, 8)
    : null;

  for (const pos of positions) {
    // 6-sided hex bolt head
    addMesh(group, hexGeo.clone(), headMat, pos, rot);
    if (washerGeo) {
      addMesh(group, washerGeo.clone(), washerMat, pos, rot);
    }
    if (studGeo) {
      addMesh(group, studGeo.clone(), socketMat, pos, rot);
    }
  }
}

/**
 * 2. buildWiringHarness:
 * Renders multi-strand color-coded automotive & aerospace wiring looms (`TubeGeometry` bundles in
 * High-Voltage Orange `0xff6600`, Red 12V `0xe11d48`, Blue CAN-bus `0x0284c7`, Yellow sensor `0xeab308`,
 * Braided Stainless AN Hose `0xd8dee9`) complete with corrugated split-loom clamps, Deutsch connectors,
 * P-clips with hex bolts, and red/blue anodized AN fittings!
 */
export function buildWiringHarness(
  group,
  routes,
  {
    includeClamps = true,
    includeAnFittings = true,
  } = {},
) {
  const clampMat = mat(0x0f172a, { roughness: 0.5, metalness: 0.25 });
  const bracketMat = brushedMetal(0x94a3b8);
  const anRed = brushedMetal(0xdc2626, { metalness: 0.88, roughness: 0.16 });
  const anBlue = brushedMetal(0x2563eb, { metalness: 0.88, roughness: 0.16 });
  const deutschMat = mat(0x1e293b, { roughness: 0.4, metalness: 0.3 });
  const sealMat = mat(0x10b981, { roughness: 0.3 });

  for (const route of routes) {
    const pts = route.points;
    if (!pts || pts.length < 2) continue;
    const radius = route.radius ?? 0.018;
    const color = route.color ?? 0xff6600;
    const isBraided = Boolean(route.braided);

    const wireMat = isBraided
      ? brushedMetal(color, { metalness: 0.9, roughness: 0.2, repeat: [8, 2] })
      : mat(color, { roughness: 0.26, metalness: 0.2, clearcoat: 0.6 });

    tube(group, pts, radius, wireMat, false, 28);

    // Parallel companion strand for multi-wire loom look
    if (route.companionColor) {
      const offsetPts = pts.map(([px, py, pz]) => [px, py + radius * 1.45, pz + radius * 0.85]);
      const compMat = mat(route.companionColor, { roughness: 0.28, metalness: 0.2, clearcoat: 0.5 });
      tube(group, offsetPts, radius * 0.72, compMat, false, 24);
    }

    // End fittings: Red/Blue Anodized Hex AN Hose Fittings or Deutsch Connectors
    const startPt = pts[0];
    const endPt = pts[pts.length - 1];
    if (includeAnFittings && isBraided) {
      cyl(group, radius * 1.55, radius * 1.55, radius * 2.8, 6, anRed, startPt, [0, 0, Math.PI / 2]);
      cyl(group, radius * 1.35, radius * 1.35, radius * 2.2, 6, anBlue, startPt, [0, 0, Math.PI / 2]);
      cyl(group, radius * 1.55, radius * 1.55, radius * 2.8, 6, anRed, endPt, [0, 0, Math.PI / 2]);
      cyl(group, radius * 1.35, radius * 1.35, radius * 2.2, 6, anBlue, endPt, [0, 0, Math.PI / 2]);
    } else {
      // Deutsch weatherpack plug with silicone seal ring
      rbox(group, radius * 3.2, radius * 2.6, radius * 2.6, 0.005, deutschMat, startPt);
      cyl(group, radius * 1.25, radius * 1.25, radius * 1.2, 12, sealMat, startPt, [0, 0, Math.PI / 2]);
      rbox(group, radius * 3.2, radius * 2.6, radius * 2.6, 0.005, deutschMat, endPt);
    }

    // Intermediate P-clamps & zip-ties with hex bolts
    if (includeClamps && pts.length >= 3) {
      for (let i = 1; i < pts.length - 1; i++) {
        const cp = pts[i];
        torus(group, radius * 1.38, radius * 0.36, clampMat, cp, [0, Math.PI / 2, 0]);
        box(group, radius * 1.2, radius * 0.5, radius * 2.2, bracketMat, [
          cp[0],
          cp[1] - radius * 1.1,
          cp[2],
        ]);
        cyl(
          group,
          radius * 0.55,
          radius * 0.55,
          radius * 0.9,
          6,
          chromeMat(),
          [cp[0], cp[1] - radius * 0.7, cp[2] + radius * 0.8],
        );
      }
    }
  }
}

/**
 * 3. buildDetailedEngineBlock:
 * Builds a museum-grade mechanical internal combustion engine (V8, V12, V6, Flat-6, Inline-4) with:
 * - Ribbed cast-aluminum cylinder block, oil pan sump, and 20 perimeter hex bolts
 * - Cutaway cylinder bores exposing reciprocating polished pistons, wrist pins, forged H-beam con-rods, and billet crankshaft
 * - Finned DOHC valve covers with 16 hex bolts, billet oil filler cap, individual red/yellow ignition coils & spark plug wires
 * - Curved tubular exhaust headers (`TubeGeometry`), twin turbocharger snail scrolls with turbine blades & wastegates
 * - Front serpentine belt drive (crank pulley, alternator with copper windings, water pump, tensioner, cooling fan, ribbed belt)
 */
export function buildDetailedEngineBlock(
  group,
  {
    pos = [0, 0, 0],
    cylinders = 8, // 6 | 8 | 12
    layout = 'v', // 'v' | 'flat'
    valveCoverColor = 0xd40000,
    coilColor = 0xe11d48,
    hasTwinTurbos = true,
    scale = 1,
  } = {},
) {
  const [bx, by, bz] = pos;
  const eng = new THREE.Group();
  eng.position.set(bx, by, bz);
  eng.scale.setScalar(scale);
  group.add(eng);

  const castAlu = brushedMetal(0xcbd5e1, { metalness: 0.86, roughness: 0.26 });
  const machinedAlu = chromeMat(0xf1f5f9);
  const darkIron = brushedMetal(0x27303f, { metalness: 0.82, roughness: 0.32 });
  const coverMat = carPaint(valveCoverColor, { metalness: 0.55, roughness: 0.16 });
  const coilMat = mat(coilColor, { roughness: 0.25, metalness: 0.3 });
  const copperMat = mat(0xd97724, { metalness: 0.9, roughness: 0.18 });
  const beltMat = mat(0x111827, { roughness: 0.78, metalness: 0.08 });
  const headerMat = brushedMetal(0xc4b5fd, { metalness: 0.92, roughness: 0.16 });
  const goldMat = brushedMetal(0xfbbf24, { metalness: 0.9, roughness: 0.18 });

  const pairs = Math.max(2, Math.floor(cylinders / 2));
  const blockLen = pairs * 0.17 + 0.14;

  // Lower oil pan sump + cooling fins + perimeter hex bolts
  rbox(eng, blockLen, 0.11, 0.42, 0.02, darkIron, [0, -0.18, 0]);
  const sumpBolts = [];
  for (let i = 0; i < pairs + 2; i++) {
    const x = -blockLen * 0.45 + (i / (pairs + 1)) * (blockLen * 0.9);
    sumpBolts.push([x, -0.12, 0.21], [x, -0.12, -0.21]);
  }
  buildHexBoltArray(eng, sumpBolts, { radius: 0.012, height: 0.012, finish: 'gold' });

  // Main ribbed cylinder block & crank journal girdle
  rbox(eng, blockLen, 0.22, 0.38, 0.025, castAlu, [0, -0.02, 0]);
  for (let i = 0; i < pairs + 1; i++) {
    const x = -blockLen * 0.44 + (i / pairs) * (blockLen * 0.88);
    box(eng, 0.018, 0.21, 0.42, castAlu, [x, -0.02, 0]);
  }

  // Billet counterweighted crankshaft along X axis (tagged for Drive It! animation)
  const crankGroup = new THREE.Group();
  crankGroup.position.set(0, -0.09, 0);
  crankGroup.userData.driveAnim = 'crank';
  eng.add(crankGroup);
  cyl(crankGroup, 0.032, 0.032, blockLen + 0.16, 16, machinedAlu, [0, 0, 0], [0, 0, Math.PI / 2]);
  for (let i = 0; i < pairs; i++) {
    const x = -blockLen * 0.36 + (i / Math.max(1, pairs - 1)) * (blockLen * 0.72);
    cyl(crankGroup, 0.068, 0.068, 0.022, 14, darkIron, [x - 0.03, 0.015 * (i % 2 ? 1 : -1), 0], [0, 0, Math.PI / 2]);
    cyl(crankGroup, 0.068, 0.068, 0.022, 14, darkIron, [x + 0.03, -0.015 * (i % 2 ? 1 : -1), 0], [0, 0, Math.PI / 2]);
  }

  // Exposed Cylinders + Reciprocating Pistons + Forged H-Beam Con-Rods (tagged for Drive It! animation)
  const bankAngle = layout === 'flat' ? 1.38 : 0.52;
  for (let side of [-1, 1]) {
    for (let i = 0; i < pairs; i++) {
      const x = -blockLen * 0.36 + (i / Math.max(1, pairs - 1)) * (blockLen * 0.72) + (side > 0 ? 0.018 : -0.018);
      const phase = i * (Math.PI / 2) + (side > 0 ? 0 : Math.PI);
      const lift = Math.sin(phase) * 0.028;

      // Machined cylinder sleeve
      const sleeveY = layout === 'flat' ? -0.05 : 0.08;
      const sleeveZ = side * (layout === 'flat' ? 0.24 : 0.14);
      cyl(
        eng,
        0.058,
        0.058,
        0.16,
        18,
        darkIron,
        [x, sleeveY, sleeveZ],
        [side * bankAngle, 0, 0],
      );

      // Piston + wrist pin + connecting rod group
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(x, sleeveY + lift * Math.cos(bankAngle), sleeveZ + side * lift * Math.sin(bankAngle));
      pistonGroup.rotation.x = side * bankAngle;
      pistonGroup.userData.driveAnim = 'piston';
      pistonGroup.userData.pistonBaseY = pistonGroup.position.y;
      pistonGroup.userData.pistonBaseZ = pistonGroup.position.z;
      pistonGroup.userData.pistonPhase = phase;
      pistonGroup.userData.bankSide = side;
      pistonGroup.userData.bankAngle = bankAngle;
      eng.add(pistonGroup);

      // Polished piston crown + 3 compression ring grooves + wrist pin + H-beam rod
      cyl(pistonGroup, 0.052, 0.052, 0.065, 18, machinedAlu, [0, 0.02, 0]);
      torus(pistonGroup, 0.053, 0.004, goldMat, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
      torus(pistonGroup, 0.053, 0.004, darkIron, [0, 0.028, 0], [Math.PI / 2, 0, 0]);
      cyl(pistonGroup, 0.016, 0.016, 0.09, 12, chromeMat(), [0, 0.005, 0], [0, 0, Math.PI / 2]);
      box(pistonGroup, 0.018, 0.13, 0.024, castAlu, [0, -0.055, 0]);
    }
  }

  // DOHC Finned Valve Covers + 16 Hex Bolts + Ignition Coil Packs + Spark Plug Wires + Tubular Headers
  const valveCoverBolts = [];
  for (const side of [-1, 1]) {
    const vcY = layout === 'flat' ? -0.05 : 0.19;
    const vcZ = side * (layout === 'flat' ? 0.36 : 0.21);
    const vcRot = [side * bankAngle, 0, 0];

    rbox(eng, blockLen * 0.96, 0.09, 0.19, 0.022, coverMat, [0, vcY, vcZ], vcRot);

    // Machined cooling fins on valve cover
    for (let f = -1; f <= 1; f += 2) {
      box(eng, blockLen * 0.9, 0.012, 0.018, machinedAlu, [0, vcY + 0.045, vcZ + f * 0.04], vcRot);
    }

    // Perimeter hex bolts around valve cover + Ignition Coils + Tubular Exhaust Header Runners
    const collectorPt = [-blockLen * 0.48, vcY - 0.08, side * 0.34];
    for (let i = 0; i < pairs; i++) {
      const x = -blockLen * 0.36 + (i / Math.max(1, pairs - 1)) * (blockLen * 0.72);
      valveCoverBolts.push(
        [x, vcY + 0.048, vcZ + side * 0.075],
        [x, vcY + 0.048, vcZ - side * 0.075],
      );

      // Individual red/yellow Ignition Coil-on-Plug pack + hex fastener
      rbox(eng, 0.048, 0.055, 0.048, 0.008, coilMat, [x, vcY + 0.055, vcZ], vcRot);
      cyl(eng, 0.01, 0.01, 0.02, 6, chromeMat(), [x + 0.025, vcY + 0.072, vcZ], vcRot);

      // High-tension braided spark plug wire to central ignition loom
      tube(
        eng,
        [
          [x, vcY + 0.075, vcZ],
          [x, vcY + 0.12, vcZ * 0.55],
          [x, vcY + 0.1, side * 0.04],
        ],
        0.007,
        coilMat,
        false,
        14,
      );

      // Individual curved tubular exhaust header runner from exhaust port to collector
      tube(
        eng,
        [
          [x, vcY - 0.03, vcZ + side * 0.08],
          [x - 0.04, vcY - 0.07, side * 0.38],
          [x * 0.5 - blockLen * 0.22, vcY - 0.09, side * 0.36],
          collectorPt,
        ],
        0.022,
        headerMat,
        false,
        20,
      );
    }
    // Exhaust header merge collector & flange with hex bolts
    cyl(eng, 0.048, 0.038, 0.14, 16, headerMat, collectorPt, [0, 0, Math.PI / 2]);
    buildHexBoltArray(
      eng,
      [
        [collectorPt[0] - 0.06, collectorPt[1] + 0.045, collectorPt[2]],
        [collectorPt[0] - 0.06, collectorPt[1] - 0.045, collectorPt[2]],
      ],
      { radius: 0.011, height: 0.012, finish: 'gold', rot: [0, 0, Math.PI / 2] },
    );
  }
  buildHexBoltArray(eng, valveCoverBolts, { radius: 0.011, height: 0.014, finish: 'chrome' });

  // Billet Aluminum Oil Filler Cap + Intake Plenum Runners & Throttle Body
  cyl(eng, 0.036, 0.036, 0.03, 12, goldMat, [blockLen * 0.32, 0.26, 0.18]);
  rbox(eng, blockLen * 0.88, 0.08, 0.18, 0.02, carbonFiberMat([4, 4]), [0, 0.26, 0]);
  for (let i = 0; i < pairs; i++) {
    const x = -blockLen * 0.34 + (i / Math.max(1, pairs - 1)) * (blockLen * 0.68);
    cyl(eng, 0.028, 0.025, 0.12, 12, machinedAlu, [x, 0.24, 0.1], [0.5, 0, 0]);
    cyl(eng, 0.028, 0.025, 0.12, 12, machinedAlu, [x, 0.24, -0.1], [-0.5, 0, 0]);
  }
  // Fuel rails + injectors with blue anodized AN fittings
  for (const side of [-1, 1]) {
    cyl(eng, 0.014, 0.014, blockLen * 0.88, 12, brushedMetal(0x2563eb), [0, 0.25, side * 0.12], [0, 0, Math.PI / 2]);
  }

  // Twin Turbocharger Snail Scrolls + Turbine Blades + Wastegate Actuators + Braided Oil Lines
  if (hasTwinTurbos) {
    for (const side of [-1, 1]) {
      const tx = -blockLen * 0.56;
      const ty = 0.08;
      const tz = side * 0.26;
      // Hot turbine scroll (Inconel) + cold compressor snail scroll (polished aluminum)
      torus(eng, 0.078, 0.034, headerMat, [tx, ty, tz], [0, Math.PI / 2, 0]);
      torus(eng, 0.082, 0.036, machinedAlu, [tx - 0.065, ty, tz], [0, Math.PI / 2, 0]);
      // Visible spinning compressor impeller wheel inside intake bellmouth
      const impGroup = new THREE.Group();
      impGroup.position.set(tx - 0.085, ty, tz);
      impGroup.userData.driveAnim = 'fan';
      eng.add(impGroup);
      cyl(impGroup, 0.018, 0.008, 0.04, 12, goldMat, [0, 0, 0], [0, 0, Math.PI / 2]);
      for (let b = 0; b < 8; b++) {
        const a = (b / 8) * Math.PI * 2;
        box(impGroup, 0.015, 0.095, 0.006, machinedAlu, [0, 0, 0], [a, 0.35, 0]);
      }
      // Gold anodized wastegate actuator canister & rod
      cyl(eng, 0.024, 0.024, 0.055, 14, goldMat, [tx - 0.03, ty + 0.095, tz], [0, 0, Math.PI / 2]);
      cyl(eng, 0.005, 0.005, 0.08, 8, chromeMat(), [tx + 0.01, ty + 0.095, tz], [0, 0, Math.PI / 2]);
    }
    // Braided stainless turbo oil feed lines with red/blue AN fittings
    buildWiringHarness(eng, [
      {
        points: [
          [0, 0.22, 0],
          [-blockLen * 0.3, 0.24, 0.18],
          [-blockLen * 0.56, 0.14, 0.26],
        ],
        radius: 0.01,
        color: 0xe2e8f0,
        braided: true,
      },
      {
        points: [
          [0, 0.22, 0],
          [-blockLen * 0.3, 0.24, -0.18],
          [-blockLen * 0.56, 0.14, -0.26],
        ],
        radius: 0.01,
        color: 0xe2e8f0,
        braided: true,
      },
    ]);
  }

  // Front Serpentine Belt Drive: Crank Pulley, Alternator (with copper stator), A/C Compressor, Water Pump & Ribbed Belt
  const frontX = blockLen * 0.54;
  const pulleys = [
    { y: -0.09, z: 0, r: 0.072, h: 0.032, mat: darkIron }, // Crank harmonic balancer
    { y: 0.06, z: 0, r: 0.052, h: 0.028, mat: machinedAlu }, // Water pump pulley
    { y: 0.11, z: 0.16, r: 0.044, h: 0.028, mat: chromeMat() }, // Alternator pulley
    { y: -0.06, z: -0.16, r: 0.048, h: 0.028, mat: darkIron }, // A/C compressor
    { y: 0.02, z: -0.11, r: 0.028, h: 0.026, mat: goldMat }, // Idler tensioner
  ];
  for (const p of pulleys) {
    const pg = new THREE.Group();
    pg.position.set(frontX, p.y, p.z);
    pg.userData.driveAnim = 'fan';
    eng.add(pg);
    cyl(pg, p.r, p.r, p.h, 20, p.mat, [0, 0, 0], [0, 0, Math.PI / 2]);
    cyl(pg, p.r * 0.28, p.r * 0.28, p.h + 0.01, 6, goldMat, [0, 0, 0], [0, 0, Math.PI / 2]);
  }
  // Alternator ventilated casing with visible internal copper stator windings
  cyl(eng, 0.068, 0.068, 0.11, 18, castAlu, [frontX - 0.07, 0.11, 0.16], [0, 0, Math.PI / 2]);
  torus(eng, 0.054, 0.014, copperMat, [frontX - 0.06, 0.11, 0.16], [0, Math.PI / 2, 0]);

  // Continuous ribbed serpentine belt loop connecting all pulleys
  tube(
    eng,
    [
      [frontX, -0.155, 0],
      [frontX, -0.09, 0.12],
      [frontX, 0.11, 0.2],
      [frontX, 0.145, 0.14],
      [frontX, 0.105, 0],
      [frontX, 0.02, -0.13],
      [frontX, -0.06, -0.2],
      [frontX, -0.12, -0.14],
    ],
    0.012,
    beltMat,
    true,
    36,
  );

  return eng;
}

/**
 * 4. buildDetailedEVDriveUnit:
 * Builds a high-detail electric motor + inverter + reduction gearbox sub-assembly with:
 * - Finned cast-aluminum stator housing with 16 perimeter hex bolts
 * - Exposed copper hairpin stator windings & spinning carbon-sleeved rotor
 * - Silicon-carbide (SiC) power inverter with copper busbars & 3-phase HV orange cables
 * - Braided blue glycol coolant hoses with anodized AN fittings
 */
export function buildDetailedEVDriveUnit(
  group,
  {
    pos = [0, 0, 0],
    twin = false,
    width = 0.62,
    radius = 0.21,
  } = {},
) {
  const [bx, by, bz] = pos;
  const alu = brushedMetal(0xd1d5db, { metalness: 0.88, roughness: 0.22 });
  const darkCase = brushedMetal(0x1e293b, { metalness: 0.8, roughness: 0.3 });
  const copper = mat(0xd97724, { metalness: 0.92, roughness: 0.16 });
  const carbon = carbonFiberMat([5, 5]);
  const rSub = Math.min(0.13, radius * 0.68);
  const unitY = by + 0.06;

  // Compact cast-aluminum transaxle cradle housing enclosing the stator/rotor
  rbox(group, rSub * 2.35, rSub * 1.75, twin ? width * 1.48 : width * 0.96, 0.028, alu, [bx, unitY, bz]);

  const offsets = twin ? [-0.18, 0.18] : [0];
  for (const zOff of offsets) {
    const z = bz + zOff;
    const w = twin ? width * 0.56 : width * 0.82;
    cyl(group, rSub, rSub, w, 24, darkCase, [bx, unitY, z], [Math.PI / 2, 0, 0]);
    // Internal copper hairpin stator rings + carbon-sleeved rotor
    torus(group, rSub * 0.82, 0.018, copper, [bx, unitY, z + w * 0.38], [0, 0, 0]);
    torus(group, rSub * 0.82, 0.018, copper, [bx, unitY, z - w * 0.38], [0, 0, 0]);
    const rotorG = new THREE.Group();
    rotorG.position.set(bx, unitY, z);
    rotorG.userData.driveAnim = 'crank';
    group.add(rotorG);
    cyl(rotorG, rSub * 0.58, rSub * 0.58, w * 1.04, 20, carbon, [0, 0, 0], [Math.PI / 2, 0, 0]);
  }

  // Top-mounted SiC Inverter box with copper busbars & 3-phase HV Orange cables
  rbox(group, 0.34, 0.09, twin ? 0.64 : 0.44, 0.018, darkCase, [bx, unitY + rSub + 0.04, bz]);
  for (let p = -1; p <= 1; p++) {
    box(group, 0.07, 0.02, 0.035, copper, [bx + 0.14, unitY + rSub + 0.085, bz + p * 0.09]);
  }
  buildWiringHarness(group, [
    {
      points: [
        [bx + 0.14, unitY + rSub + 0.06, bz - 0.1],
        [bx + 0.22, unitY + rSub * 0.3, bz - 0.16],
        [bx + 0.08, unitY - 0.02, bz - 0.2],
      ],
      radius: 0.013,
      color: 0xff6600,
      companionColor: 0x0284c7,
    },
    {
      points: [
        [bx + 0.14, unitY + rSub + 0.06, bz + 0.1],
        [bx + 0.22, unitY + rSub * 0.3, bz + 0.16],
        [bx + 0.08, unitY - 0.02, bz + 0.2],
      ],
      radius: 0.013,
      color: 0xff6600,
      companionColor: 0xe11d48,
    },
    {
      points: [
        [bx - 0.14, unitY + rSub + 0.05, bz],
        [bx - 0.2, unitY + 0.02, bz],
        [bx - 0.1, unitY - 0.04, bz],
      ],
      radius: 0.01,
      color: 0xe2e8f0,
      braided: true,
    },
  ]);
}

/**
 * 5. buildCoiloverSuspension:
 * Builds 4-corner double-wishbone coilover suspension assemblies:
 * - Real 3D helical coilover spring (`TubeGeometry` helix around an anodized damper shaft)
 * - Billet spring perches & top hat with 3 mounting studs/hex nuts
 * - Upper & lower tubular A-arm wishbones with ball joints & hex bolts
 * - Braided stainless steel hydraulic brake lines with red/blue anodized AN fittings
 */
export function buildCoiloverSuspension(
  group,
  corners,
  {
    springColor = 0xfacc15,
    damperColor = 0x94a3b8,
    height = 0.42,
    coils = 6.5,
  } = {},
) {
  const springMat = carPaint(springColor, { metalness: 0.45, roughness: 0.16 });
  const damperMat = brushedMetal(damperColor, { metalness: 0.9, roughness: 0.18 });
  const chrome = chromeMat();
  const armMat = brushedMetal(0x334155, { metalness: 0.85, roughness: 0.25 });
  const goldMat = brushedMetal(0xfbbf24, { metalness: 0.9, roughness: 0.15 });

  for (const [wx, wy, wz] of corners) {
    const sideSign = wz >= 0 ? 1 : -1;
    const sx = wx;
    const sy = wy + 0.18;
    const sz = wz * 0.82;

    // Damper body + polished piston shaft + anodized reservoir piggyback
    cyl(group, 0.032, 0.032, height * 0.62, 16, damperMat, [sx, sy - height * 0.14, sz]);
    cyl(group, 0.018, 0.018, height * 0.96, 14, chrome, [sx, sy, sz]);
    cyl(group, 0.022, 0.022, height * 0.42, 14, goldMat, [sx + (wx >= 0 ? -0.055 : 0.055), sy + 0.04, sz]);

    // Upper & lower billet spring perches
    cyl(group, 0.068, 0.068, 0.022, 18, goldMat, [sx, sy + height * 0.42, sz]);
    cyl(group, 0.068, 0.068, 0.022, 18, goldMat, [sx, sy - height * 0.34, sz]);

    // Strut tower top-hat 3 hex mounting nuts
    const topBolts = [];
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      topBolts.push([sx + Math.cos(a) * 0.045, sy + height * 0.45, sz + Math.sin(a) * 0.045]);
    }
    buildHexBoltArray(group, topBolts, { radius: 0.01, height: 0.014, finish: 'chrome' });

    // Real 3D Helical Coilover Spring around damper shaft
    const helixPts = [];
    const steps = 42;
    const helixR = 0.056;
    const yStart = sy - height * 0.31;
    const yEnd = sy + height * 0.39;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const ang = t * coils * Math.PI * 2;
      helixPts.push([
        sx + Math.cos(ang) * helixR,
        yStart + t * (yEnd - yStart),
        sz + Math.sin(ang) * helixR,
      ]);
    }
    tube(group, helixPts, 0.012, springMat, false, 44);

    // Upper & lower tubular A-arm wishbones + ball joints + subframe hex bolts
    const innerZ = wz * 0.46;
    const outerZ = wz * 0.92;
    for (const yOff of [-0.14, 0.1]) {
      tube(
        group,
        [
          [sx - 0.16, wy + yOff, innerZ],
          [sx, wy + yOff, outerZ],
          [sx + 0.16, wy + yOff, innerZ],
        ],
        0.015,
        armMat,
        false,
        16,
      );
      sphere(group, 0.024, 12, goldMat, [sx, wy + yOff, outerZ]);
      buildHexBoltArray(
        group,
        [
          [sx - 0.16, wy + yOff, innerZ],
          [sx + 0.16, wy + yOff, innerZ],
        ],
        { radius: 0.012, height: 0.016, finish: 'gold', rot: [0, 0, Math.PI / 2] },
      );
    }

    // Braided stainless hydraulic brake line with red/blue AN fittings to caliper
    buildWiringHarness(
      group,
      [
        {
          points: [
            [sx - 0.1, wy + 0.12, innerZ],
            [sx - 0.08, wy + 0.04, sz],
            [sx + (wx >= 0 ? -0.14 : 0.14), wy + 0.06, outerZ - sideSign * 0.02],
          ],
          radius: 0.008,
          color: 0xe2e8f0,
          braided: true,
        },
      ],
      { includeClamps: false, includeAnFittings: true },
    );
  }
}

/**
 * 6. buildDetailedWheel (Upgraded with 5/10 3D Hex Lug Nuts, Tire Valve Stem, 12 Rotor Bobbins,
 * Brembo Caliper Bleeder Screw, and Spin/Steer Pivot Groups for Live Test-Drive Mode!)
 */
export function buildDetailedWheel(
  group,
  [x, y, z],
  {
    tireRadius = 0.36,
    tireWidth = 0.24,
    rimColor = 0xd8dee9,
    caliperColor = 0xe63946,
    spokes = 7,
    lugCount = 5,
    includeBrake = false,
  } = {},
) {
  const sideSign = z >= 0 ? 1 : -1;
  const isFront = x > 0.2;

  // Steering knuckle pivot at exact wheel hub center [x, y, z]
  const steerGroup = new THREE.Group();
  steerGroup.position.set(x, y, z);
  if (isFront) {
    steerGroup.userData.steerRole = 'front-wheel';
  }
  group.add(steerGroup);

  // Rotating wheel + tire + brake rotor group around local [0, 0, 0]
  const spinGroup = new THREE.Group();
  spinGroup.userData.driveRole = 'wheel';
  steerGroup.add(spinGroup);

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tireTreadTexture(),
    roughness: 0.76,
    metalness: 0.08,
  });
  const sidewallMat = mat(0x16191e, { roughness: 0.62, metalness: 0.08 });
  const rimMat = brushedMetal(rimColor, { metalness: 0.92, roughness: 0.14 });
  const darkHub = mat(0x181c23, { metalness: 0.75, roughness: 0.28 });
  const chrome = chromeMat();
  const goldMat = brushedMetal(0xfbbf24, { metalness: 0.9, roughness: 0.16 });

  // Smooth automotive tire carcass with multi-rib radial tread & contoured sidewalls
  cyl(spinGroup, tireRadius, tireRadius, tireWidth * 0.9, 44, tireMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const rOff of [-0.28, -0.1, 0.1, 0.28]) {
    torus(spinGroup, tireRadius * 0.985, tireWidth * 0.055, sidewallMat, [0, 0, rOff * tireWidth], [0, 0, 0]);
  }
  torus(
    spinGroup,
    tireRadius * 0.85,
    tireWidth * 0.2,
    sidewallMat,
    [0, 0, sideSign * (tireWidth * 0.35)],
    [0, 0, 0],
  );
  torus(
    spinGroup,
    tireRadius * 0.85,
    tireWidth * 0.2,
    sidewallMat,
    [0, 0, -sideSign * (tireWidth * 0.35)],
    [0, 0, 0],
  );

  // Alloy wheel barrel & outer machined lip
  const rimR = tireRadius * 0.68;
  cyl(spinGroup, rimR, rimR, tireWidth * 0.92, 28, darkHub, [0, 0, 0], [Math.PI / 2, 0, 0]);
  torus(spinGroup, rimR, 0.022, rimMat, [0, 0, sideSign * (tireWidth * 0.44)], [0, 0, 0]);

  // Multi-spoke alloy star + center cap + 5/10 3D Hex Lug Nuts + Tire Valve Stem
  const spokeZ = sideSign * (tireWidth * 0.4);
  cyl(spinGroup, rimR * 0.28, rimR * 0.28, 0.055, 20, rimMat, [0, 0, spokeZ], [Math.PI / 2, 0, 0]);
  cyl(spinGroup, rimR * 0.11, rimR * 0.11, 0.064, 16, goldMat, [0, 0, spokeZ], [Math.PI / 2, 0, 0]);

  for (let s = 0; s < spokes; s++) {
    const a = (s / spokes) * Math.PI * 2;
    const sx = Math.cos(a) * (rimR * 0.54);
    const sy = Math.sin(a) * (rimR * 0.54);
    box(spinGroup, rimR * 0.78, 0.032, 0.026, rimMat, [sx, sy, spokeZ], [0, 0, a]);
    // Split-spoke V-rib accent
    box(spinGroup, rimR * 0.72, 0.016, 0.03, chrome, [sx, sy, spokeZ + sideSign * 0.008], [0, 0, a + 0.08]);
  }

  // 3D Hex Lug Nuts inside recessed lug wells
  const lugPositions = [];
  for (let l = 0; l < lugCount; l++) {
    const a = (l / lugCount) * Math.PI * 2;
    const lx = Math.cos(a) * (rimR * 0.19);
    const ly = Math.sin(a) * (rimR * 0.19);
    lugPositions.push([lx, ly, spokeZ + sideSign * 0.028]);
  }
  buildHexBoltArray(spinGroup, lugPositions, {
    radius: 0.013,
    height: 0.022,
    finish: 'chrome',
    rot: [Math.PI / 2, 0, 0],
    includeWasher: true,
    includeStud: false,
  });

  // Tire inflation valve stem + brass cap at bottom of rim lip
  cyl(
    spinGroup,
    0.008,
    0.008,
    0.038,
    8,
    chrome,
    [0, -rimR * 0.88, sideSign * (tireWidth * 0.38)],
    [0, 0, 0],
  );
  cyl(
    spinGroup,
    0.01,
    0.01,
    0.014,
    6,
    goldMat,
    [0, -rimR * 0.82, sideSign * (tireWidth * 0.38)],
    [0, 0, 0],
  );

  if (includeBrake) {
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: brakeRotorTexture(),
      metalness: 0.86,
      roughness: 0.2,
    });
    const bz = -sideSign * 0.02;
    // Rotor spins with wheel + 12 floating rotor bobbins/hex bolts around center hat
    cyl(spinGroup, rimR * 0.8, rimR * 0.8, 0.036, 28, rotorMat, [0, 0, bz], [Math.PI / 2, 0, 0]);
    const bobbinPos = [];
    for (let b = 0; b < 12; b++) {
      const a = (b / 12) * Math.PI * 2;
      bobbinPos.push([
        Math.cos(a) * (rimR * 0.36),
        Math.sin(a) * (rimR * 0.36),
        bz + sideSign * 0.02,
      ]);
    }
    buildHexBoltArray(spinGroup, bobbinPos, {
      radius: 0.009,
      height: 0.012,
      finish: 'titanium',
      rot: [Math.PI / 2, 0, 0],
      includeWasher: false,
      includeStud: false,
    });

    // Stationary 6-Piston Brembo Caliper mounted to steering knuckle (`steerGroup`)
    const calMat = carPaint(caliperColor, { metalness: 0.45, roughness: 0.16 });
    const calX = x >= 0 ? -0.14 : 0.14;
    const caliperMesh = rbox(steerGroup, 0.13, 0.21, 0.088, 0.022, calMat, [calX, 0.06, bz]);
    caliperMesh.userData.driveRole = 'brake-caliper';
    // 4 caliper bridge hex bolts + brass bleeder screw nipple
    buildHexBoltArray(
      steerGroup,
      [
        [calX, 0.12, bz + sideSign * 0.046],
        [calX, 0.0, bz + sideSign * 0.046],
      ],
      { radius: 0.01, height: 0.014, finish: 'chrome', rot: [Math.PI / 2, 0, 0] },
    );
    cyl(steerGroup, 0.008, 0.008, 0.028, 6, goldMat, [calX, 0.17, bz + sideSign * 0.02]);
  }
}

/**
 * 7. buildSculptedCarBody:
 * Builds a multi-contour 3D automotive body shell with:
 * - Sculpted side flanks + 3D flared cylindrical wheel-well arches (`torus` + arch lip molding)
 * - Contoured front hood/bonnet with twin aerodynamic power bulges & shutlines
 * - Sculpted A/B/C pillars, aerodynamic side mirrors on stalks, flush/sculpted door handles, dual wipers
 * - Front fascia with carbon splitter, honeycomb mesh grille, projector headlight pods, and rear diffuser
 * - Inner door/fender perimeter hex fasteners visible when exploded!
 */
export function buildSculptedCarBody(
  group,
  {
    profile,
    bodyColor = 0xc8102e,
    accentColor = null,
    wheelPositions = [
      [1.25, -0.22],
      [-1.28, -0.22],
    ],
    archRadius = 0.42,
    halfWidth = 0.85,
    hoodPos = [1.42, 0.16],
    hoodLen = 1.02,
    hoodSlope = -0.14,
    includeMirrors = true,
    includeHeadlights = true,
    includeGrille = true,
    includeWing = false,
    wingHeight = 0.36,
  } = {},
) {
  const paint = typeof bodyColor === 'object' ? bodyColor : carPaint(bodyColor);
  const carbon = carbonFiberMat([5, 5]);
  const accent = accentColor ? (typeof accentColor === 'object' ? accentColor : carPaint(accentColor)) : carbon;
  const chrome = chromeMat();
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: honeycombGrilleTexture([6, 2]),
    roughness: 0.45,
    metalness: 0.6,
  });

  // Left & Right sculpted side body flanks + 3D flared wheel arches + side mirrors + door handles
  for (const side of [-1, 1]) {
    const zSide = side * halfWidth;
    if (profile && profile.length >= 3) {
      extrudeProfile(group, profile, 0.15, paint, [0, 0, zSide], [0, 0, 0], 0.032);
    }

    // Sculpted lower aerodynamic side skirt in carbon fiber with 6 hex rivets
    rbox(group, 2.25, 0.065, 0.14, 0.02, carbon, [0, -0.22, side * (halfWidth + 0.04)]);
    const skirtBolts = [];
    for (let b = -2; b <= 2; b++) {
      skirtBolts.push([b * 0.44, -0.22, side * (halfWidth + 0.11)]);
    }
    buildHexBoltArray(group, skirtBolts, {
      radius: 0.009,
      height: 0.01,
      finish: 'titanium',
      rot: [Math.PI / 2, 0, 0],
    });

    // 3D Flared Fender Arches over front & rear wheels (upper half-torus + inner fender liner)
    for (const [wx, wy] of wheelPositions) {
      const archGeo = new THREE.TorusGeometry(archRadius, 0.055, 14, 24, Math.PI * 1.08);
      addMesh(
        group,
        archGeo,
        paint,
        [wx, wy + 0.02, side * (halfWidth + 0.05)],
        [0, 0, -0.04],
      );
      const lipGeo = new THREE.TorusGeometry(archRadius * 0.96, 0.024, 10, 20, Math.PI * 1.06);
      addMesh(
        group,
        lipGeo,
        carbon,
        [wx, wy + 0.01, side * (halfWidth + 0.08)],
        [0, 0, -0.03],
      );
    }

    // Sculpted door shutlines & flush chrome/accent door handles
    box(group, 0.2, 0.034, 0.024, chrome, [0.12, 0.16, side * (halfWidth + 0.08)]);
    // Inner door hinge & fender flange hex bolts (visible when body explodes!)
    buildHexBoltArray(
      group,
      [
        [0.72, 0.14, side * (halfWidth - 0.06)],
        [0.72, -0.04, side * (halfWidth - 0.06)],
        [-0.58, 0.16, side * (halfWidth - 0.06)],
        [-0.58, -0.02, side * (halfWidth - 0.06)],
      ],
      { radius: 0.012, height: 0.014, finish: 'gold', rot: [Math.PI / 2, 0, 0] },
    );

    // Aerodynamic Side Mirror on sculpted stalk with mirror glass & LED turn repeater
    if (includeMirrors) {
      box(
        group,
        0.09,
        0.03,
        0.12,
        carbon,
        [0.64, 0.28, side * (halfWidth + 0.1)],
        [side * 0.35, 0, 0],
      );
      rbox(
        group,
        0.16,
        0.085,
        0.13,
        0.025,
        paint,
        [0.6, 0.32, side * (halfWidth + 0.16)],
        [0, side * -0.18, 0],
      );
      box(
        group,
        0.015,
        0.065,
        0.1,
        chrome,
        [0.52, 0.32, side * (halfWidth + 0.16)],
        [0, side * -0.18, 0],
      );
    }
  }

  // Contoured Front Hood / Bonnet with twin aerodynamic power bulges & dual windshield wipers
  rbox(group, hoodLen, 0.075, halfWidth * 1.88, 0.03, paint, [hoodPos[0], hoodPos[1], 0], [0, 0, hoodSlope]);
  for (const side of [-1, 1]) {
    rbox(
      group,
      hoodLen * 0.78,
      0.04,
      0.24,
      0.018,
      paint,
      [hoodPos[0] - 0.04, hoodPos[1] + 0.03, side * (halfWidth * 0.52)],
      [0, 0, hoodSlope],
    );
  }
  // Dual articulated windshield wiper blades at base of windshield
  for (const zWiper of [-0.32, 0.24]) {
    box(group, 0.04, 0.025, 0.56, carbon, [hoodPos[0] - hoodLen * 0.46, hoodPos[1] + 0.08, zWiper], [0, 0.12, 0]);
  }

  // Front Honeycomb Grille + Carbon Splitter + Multi-Projector LED Headlight Pods
  if (includeGrille) {
    rbox(group, 0.14, 0.22, halfWidth * 1.72, 0.025, grilleMat, [2.0, -0.12, 0]);
    rbox(group, 0.38, 0.045, halfWidth * 2.08, 0.018, carbon, [1.96, -0.26, 0]);
    // Splitter support tie-rods
    for (const side of [-1, 1]) {
      cyl(group, 0.008, 0.008, 0.16, 8, chrome, [2.08, -0.18, side * 0.42], [0, 0, -0.25]);
    }
  }

  if (includeHeadlights) {
    const ledWhite = emissiveMat(0xf8fafc, 1.45);
    const glassCover = glassMat(0xe0f2fe, 0.52);
    for (const side of [-1, 1]) {
      const hz = side * (halfWidth * 0.78);
      // Dark projector housing + twin internal optical lenses + DRL tube + clear cover
      rbox(group, 0.28, 0.1, 0.3, 0.025, carbon, [1.92, 0.04, hz], [0, 0, -0.18]);
      sphere(group, 0.038, 14, ledWhite, [1.98, 0.04, hz - side * 0.05]);
      sphere(group, 0.032, 14, ledWhite, [1.96, 0.05, hz + side * 0.05]);
      rbox(group, 0.26, 0.022, 0.28, 0.01, ledWhite, [1.98, 0.08, hz], [0, 0, -0.18]);
      rbox(group, 0.3, 0.09, 0.31, 0.025, glassCover, [1.99, 0.05, hz], [0, 0, -0.18]);
    }
  }

  // Rear Honeycomb Fascia + Multi-Strake Underbody Diffuser + Optional Rear Wing
  rbox(group, 0.14, 0.24, halfWidth * 1.78, 0.025, grilleMat, [-1.98, 0.04, 0]);
  rbox(group, 0.42, 0.05, halfWidth * 1.98, 0.018, carbon, [-1.92, -0.24, 0]);
  for (let z = -halfWidth * 0.75; z <= halfWidth * 0.75; z += 0.26) {
    box(group, 0.46, 0.16, 0.024, carbon, [-1.88, -0.18, z], [0, 0, 0.18]);
  }
  if (includeWing) {
    rbox(group, 0.24, 0.045, halfWidth * 1.92, 0.015, accent, [-1.92, wingHeight, 0], [0, 0, 0.16]);
  }
}

// ============================================================================
// Aerospace & Naval CAD-Fidelity Textures & Lofted Geometry Builders
// ============================================================================

/**
 * Procedural Airliner Fuselage Texture (512x256):
 * Renders aluminum panel seams, rivet rows, cheatline livery stripes,
 * passenger cabin windows with silver frames & dark polarized glass,
 * and boarding/emergency exit doors with red warning stencils & handles.
 * Note: Three.js LatheGeometry maps U around the circumference (0..1) and V along the profile (nose to tail).
 */
export function airlinerFuselageTexture(primaryHex = '#0284c7', accentHex = '#38bdf8', bodyHex = '#f8fafc') {
  return getCachedTexture(`airliner_fuselage_v3_${primaryHex}_${accentHex}`, 512, 512, (ctx, w, h) => {
    // Base gloss airliner white/composite skin
    ctx.fillStyle = bodyHex;
    ctx.fillRect(0, 0, w, h);

    // Note on Three.js LatheGeometry with rot = [0, 0, -Math.PI / 2]:
    // Y_world = -r * sin(2π * u), Z_world = r * cos(2π * u)
    //   u = 0.00 / 1.00 -> Starboard side (+Z)
    //   u = 0.25        -> Belly (-Y)
    //   u = 0.50        -> Port side (-Z)
    //   u = 0.75        -> Crown / Rooftop (+Y)

    // Lower belly metallic gray aerodynamic fairing centered at u = 0.25 (-Y bottom)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w * 0.16, 0, w * 0.18, h);

    // Circumferential panel seam rings along fuselage length (V = Y axis in texture)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)';
    ctx.lineWidth = 1.1;
    for (let y = 24; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Longitudinal stringer panel seams
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Helper to draw one side's cheatlines, cabin windows, and passenger boarding doors
    // winU is placed slightly above mid-height (Y_world > 0), cheatU just below window line
    const drawSideLivery = (winU, cheatU, dirSign) => {
      const wx = w * winU;
      const cx = w * cheatU;

      // Dual Swept Livery Cheatline Stripes with aerodynamic tapered speed-points at nose & tail
      ctx.fillStyle = primaryHex;
      ctx.beginPath();
      ctx.moveTo(cx - 5 * dirSign, h * 0.08);
      ctx.lineTo(cx + 5 * dirSign, h * 0.15);
      ctx.lineTo(cx + 5 * dirSign, h * 0.85);
      ctx.lineTo(cx - 5 * dirSign, h * 0.91);
      ctx.closePath();
      ctx.fill();

      const ax = cx + dirSign * 7.5;
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.moveTo(ax - 2 * dirSign, h * 0.12);
      ctx.lineTo(ax + 2 * dirSign, h * 0.17);
      ctx.lineTo(ax + 2 * dirSign, h * 0.83);
      ctx.lineTo(ax - 2 * dirSign, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Forward & Aft Passenger Entry Doors + Overwing Emergency Exit Doors on the SIDE flank
      for (const doorV of [0.24, 0.48, 0.54, 0.78]) {
        const dy = h * doorV;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.0;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(wx - 13, dy - 5.5, 26, 11, 3);
        ctx.fill();
        ctx.stroke();
        // Circular/oval porthole window near top of door + red handle stencil
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx - 4 * dirSign - 3, dy - 2.5, 6, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(wx + 3 * dirSign - 1.5, dy - 3, 3, 6);
      }

      // 24 Passenger Cabin Windows per side with aluminum bezel & dark polarized glass
      for (let winIdx = 0; winIdx < 24; winIdx++) {
        const wy = h * (0.27 + winIdx * 0.020);
        if (Math.abs(wy - h * 0.48) < 9 || Math.abs(wy - h * 0.54) < 9) continue;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(wx - 5.5, wy - 3.0, 11, 6.0, 2.5);
        ctx.fill();
        ctx.fillStyle = '#091326';
        ctx.beginPath();
        ctx.roundRect(wx - 4.0, wy - 2.0, 8, 4.0, 1.8);
        ctx.fill();
        ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
        ctx.fillRect(wx - 2.5, wy - 1.2, 3.5, 1.8);
      }
    };

    // Port side (+Z): windows at u = 0.962 (Y_world = +0.24*r), cheatline at u = 0.022 (Y_world = -0.14*r)
    drawSideLivery(0.962, 0.022, -1);
    // Starboard side (-Z): windows at u = 0.538 (Y_world = +0.24*r), cheatline at u = 0.478 (Y_world = -0.14*r)
    drawSideLivery(0.538, 0.478, 1);
  });
}

/**
 * Procedural Submarine Anechoic Acoustic Tile Texture (512x256):
 * Renders sound-absorbing dark elastomer tile grid, hull weld seams,
 * zinc sacrificial anodes, and white hull draft markings.
 */
export function submarineHullTexture(baseHex = '#151c26') {
  return getCachedTexture(`sub_hull_${baseHex}`, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);

    const tileW = 16;
    const tileH = 12;
    for (let y = 0; y < h; y += tileH) {
      const shift = ((y / tileH) % 2) * (tileW / 2);
      for (let x = -tileW; x < w + tileW; x += tileW) {
        const shade = ((x + y) % 3 === 0) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.16)';
        ctx.fillStyle = shade;
        ctx.fillRect(x + shift + 1, y + 1, tileW - 2, tileH - 2);
      }
    }

    // Circumferential pressure-hull weld seams
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 2;
    for (let y = 32; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // White naval depth draft marks & rescue hatch stencil rings
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.28, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.72, 16, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/**
 * Helper to build a smooth revolved LatheGeometry along the X axis (default aircraft/sub axis).
 * `profilePoints` is an array of `[x, radius]` pairs from tail to nose (or vice versa).
 */
export function lathe(group, profilePoints, segs = 36, material, pos = [0, 0, 0], rot = [0, 0, -Math.PI / 2], scale = [1, 1, 1]) {
  const pts = profilePoints.map(([axialX, r]) => new THREE.Vector2(Math.max(0.001, r), axialX));
  const geo = new THREE.LatheGeometry(pts, segs);
  geo.computeVertexNormals();
  return addMesh(group, geo, material, pos, rot, scale);
}

/**
 * Helper to build a 3D helical coil spring along the Y axis centered at `pos`.
 */
export function buildCoilSpring(group, pos = [0, 0, 0], height = 0.24, radius = 0.05, wireRadius = 0.009, coils = 6, material) {
  const [sx, sy, sz] = pos;
  const pts = [];
  const steps = Math.max(28, Math.round(coils * 7));
  const yStart = sy - height * 0.5;
  const yEnd = sy + height * 0.5;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const ang = t * coils * Math.PI * 2;
    pts.push([
      sx + Math.cos(ang) * radius,
      yStart + t * (yEnd - yStart),
      sz + Math.sin(ang) * radius,
    ]);
  }
  return tube(group, pts, wireRadius, material || chromeMat(), false, steps);
}

/**
 * Builds an array of parallel cooling/radiator fins.
 */
export function buildFinArray(group, origin = [0, 0, 0], count = 12, size = [0.004, 0.2, 0.24], step = [0.008, 0, 0], material) {
  const m = material || brushedMetal(0xcbd5e1);
  const half = (count - 1) * 0.5;
  for (let i = 0; i < count; i++) {
    const off = i - half;
    box(group, size[0], size[1], size[2], m, [
      origin[0] + off * step[0],
      origin[1] + off * step[1],
      origin[2] + off * step[2],
    ]);
  }
}
