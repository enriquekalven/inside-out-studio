// CAD-Fidelity 3D Helicopters & Drones (`helicopters`), Mechanical Watch & Clock (`watches`),
// and Bikes & Motorcycles (`bikes`) Models for Inside Out Studio (Batch 2).
import * as THREE from '../../vendor/three.module.js';
import {
  mat, carPaint, brushedMetal, chromeMat, carbonFiberMat, glassMat, emissiveMat, screenMat, solarGridTexture,
  brakeRotorTexture, box, rbox, cyl, sphere, torus, cone, tube, extrudeProfile, buildHexBoltArray, buildFinArray, buildWiringHarness,
} from '../materials.js';
import {
  populateIngenuityCad, populateWatchCad, populateBikeCad, populateEngineCad, populateGearboxCad,
} from '../cad_loader.js';
import { surfaceGrid, addSmoothMesh } from '../loft.js';
import { buildBlackHawkModel } from './uh60_black_hawk.js';

function evalStationPoint(st, theta) {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const ry = sinT <= 0 ? (st.rTop ?? st.ry ?? 0.2) : (st.rBot ?? st.ry ?? 0.2);
  const rz = st.rz ?? 0.2;
  const n = st.n ?? 2.0;
  const exp = 2.0 / n;
  let yLocal = -Math.sign(sinT) * Math.pow(Math.abs(sinT), exp) * ry;
  let zLocal = Math.sign(cosT) * Math.pow(Math.abs(cosT), exp) * rz;
  if (st.chine) {
    const chineBoost = Math.pow(Math.abs(cosT), 3.0) * st.chine;
    zLocal *= 1.0 + chineBoost;
    yLocal *= 1.0 - 0.18 * chineBoost;
  }
  if (st.flatBottom && yLocal < -ry * st.flatBottom) {
    yLocal = -ry * st.flatBottom;
  }
  return [st.x, (st.y ?? 0) + yLocal, (st.zCenter ?? 0) + zLocal];
}

function buildMultiSectionLoft(
  group,
  stations,
  {
    radialSegs = 40,
    material,
    pos = [0, 0, 0],
    rot = [0, 0, 0],
    capStart = true,
    capEnd = true,
    uOffset = 0,
    vMin = 0,
    vMax = 1,
  } = {},
) {
  const numStations = stations.length;
  const ringVerts = radialSegs + 1;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i < numStations; i++) {
    const st = stations[i];
    const v = vMin + (i / Math.max(1, numStations - 1)) * (vMax - vMin);
    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = (u + uOffset) * Math.PI * 2;
      const [px, py, pz] = evalStationPoint(st, theta);
      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  const flip = stations[numStations - 1].x < stations[0].x;
  for (let i = 0; i < numStations - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * ringVerts + j;
      const b = (i + 1) * ringVerts + j;
      const c = (i + 1) * ringVerts + (j + 1);
      const d = i * ringVerts + (j + 1);
      if (flip) {
        indices.push(a, b, d, b, c, d);
      } else {
        indices.push(a, d, b, b, d, c);
      }
    }
  }

  if (capStart) {
    const st0 = stations[0];
    if ((st0.ry ?? st0.rTop ?? 0) > 0.004 && (st0.rz ?? 0) > 0.004) {
      const cIdx = positions.length / 3;
      positions.push(st0.x, st0.y ?? 0, st0.zCenter ?? 0);
      uvs.push(0.5, vMin);
      for (let j = 0; j < radialSegs; j++) {
        if (flip) indices.push(cIdx, j + 1, j);
        else indices.push(cIdx, j, j + 1);
      }
    }
  }

  if (capEnd) {
    const stEnd = stations[numStations - 1];
    if ((stEnd.ry ?? stEnd.rTop ?? 0) > 0.004 && (stEnd.rz ?? 0) > 0.004) {
      const base = (numStations - 1) * ringVerts;
      const cIdx = positions.length / 3;
      positions.push(stEnd.x, stEnd.y ?? 0, stEnd.zCenter ?? 0);
      uvs.push(0.5, vMax);
      for (let j = 0; j < radialSegs; j++) {
        if (flip) indices.push(cIdx, base + j, base + j + 1);
        else indices.push(cIdx, base + j + 1, base + j);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function evalLoftSurfacePointAndNormal(stations, x, theta) {
  let idx = 0;
  if (x <= stations[0].x) {
    idx = 0;
  } else if (x >= stations[stations.length - 1].x) {
    idx = Math.max(0, stations.length - 2);
  } else {
    for (let i = 0; i < stations.length - 1; i++) {
      if (x >= stations[i].x && x <= stations[i + 1].x) {
        idx = i;
        break;
      }
    }
  }
  const a = stations[idx];
  const b = stations[Math.min(stations.length - 1, idx + 1)];
  const spanX = b.x - a.x;
  const t = Math.abs(spanX) > 1e-6 ? Math.min(1, Math.max(0, (x - a.x) / spanX)) : 0;
  const pA = evalStationPoint(a, theta);
  const pB = evalStationPoint(b, theta);
  const px = pA[0] + (pB[0] - pA[0]) * t;
  const py = pA[1] + (pB[1] - pA[1]) * t;
  const pz = pA[2] + (pB[2] - pA[2]) * t;

  const cyA = a.y ?? 0;
  const czA = a.zCenter ?? 0;
  const cyB = b.y ?? 0;
  const czB = b.zCenter ?? 0;
  const cy = cyA + (cyB - cyA) * t;
  const cz = czA + (czB - czA) * t;

  const ryVec = py - cy;
  const rzVec = pz - cz;
  const rLen = Math.hypot(ryVec, rzVec) || 1;
  const ury = ryVec / rLen;
  const urz = rzVec / rLen;

  const rA = (pA[1] - cyA) * ury + (pA[2] - czA) * urz;
  const rB = (pB[1] - cyB) * ury + (pB[2] - czB) * urz;
  const drdx = Math.abs(spanX) > 1e-5 ? (rB - rA) / spanX : 0;

  let nx = -drdx;
  let ny = ury;
  let nz = urz;
  const nMag = Math.hypot(nx, ny, nz) || 1;
  nx /= nMag;
  ny /= nMag;
  nz /= nMag;

  return { px, py, pz, nx, ny, nz };
}

function buildConformalLoftPatch(
  group,
  stations,
  {
    xFront,
    xBack,
    angBottomFront,
    angTopFront,
    angBottomBack,
    angTopBack,
    offset = 0.004,
    uSteps = 12,
    vSteps = 8,
    material,
  } = {},
) {
  const rawU = [];
  for (let iu = 0; iu <= uSteps; iu++) rawU.push(iu / uSteps);
  const xMin = Math.min(xFront, xBack);
  const xMax = Math.max(xFront, xBack);
  const dxTotal = xBack - xFront;
  if (Math.abs(dxTotal) > 1e-6) {
    for (const st of stations) {
      if (st.x > xMin + 1e-4 && st.x < xMax - 1e-4) {
        rawU.push((st.x - xFront) / dxTotal);
      }
    }
  }
  rawU.sort((a, b) => a - b);
  const uList = [rawU[0]];
  for (let k = 1; k < rawU.length; k++) {
    if (rawU[k] - uList[uList.length - 1] > 1e-3) {
      uList.push(rawU[k]);
    }
  }
  if (1.0 - uList[uList.length - 1] > 1e-4) uList.push(1.0);
  else uList[uList.length - 1] = 1.0;

  const effOffset = Math.max(offset, 0.006) + Math.max(0, offset - 0.004);
  const positions = [];
  const normalsHint = [];
  const uvs = [];
  const indices = [];

  const uCount = uList.length - 1;
  for (let iu = 0; iu <= uCount; iu++) {
    const u = uList[iu];
    const x = xFront + (xBack - xFront) * u;
    const aBot = angBottomFront + (angBottomBack - angBottomFront) * u;
    const aTop = angTopFront + (angTopBack - angTopFront) * u;
    for (let iv = 0; iv <= vSteps; iv++) {
      const v = iv / vSteps;
      const angFromCrown = aBot + (aTop - aBot) * v;
      const theta = -Math.PI / 2 + angFromCrown;
      const { px, py, pz, nx, ny, nz } = evalLoftSurfacePointAndNormal(stations, x, theta);
      positions.push(
        px + nx * effOffset,
        py + ny * effOffset,
        pz + nz * effOffset,
      );
      normalsHint.push(nx, ny, nz);
      uvs.push(u, v);
    }
  }

  const row = vSteps + 1;
  for (let iu = 0; iu < uCount; iu++) {
    for (let iv = 0; iv < vSteps; iv++) {
      const a = iu * row + iv;
      const b = (iu + 1) * row + iv;
      const c = (iu + 1) * row + (iv + 1);
      const d = iu * row + (iv + 1);

      const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
      const bx = positions[b * 3] - ax, by = positions[b * 3 + 1] - ay, bz = positions[b * 3 + 2] - az;
      const dx = positions[d * 3] - ax, dy = positions[d * 3 + 1] - ay, dz = positions[d * 3 + 2] - az;
      const fnx = by * dz - bz * dy;
      const fny = bz * dx - bx * dz;
      const fnz = bx * dy - by * dx;
      const hnx = normalsHint[a * 3], hny = normalsHint[a * 3 + 1], hnz = normalsHint[a * 3 + 2];
      if (fnx * hnx + fny * hny + fnz * hnz >= 0) {
        indices.push(a, b, d, b, c, d);
      } else {
        indices.push(a, d, b, b, d, c);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSpinHub(g, pos, blades, radius, chord, bladeMat, hubMat, axis = 'y') {
  const spin = new THREE.Group();
  spin.position.set(pos[0], pos[1], pos[2]);
  spin.userData.driveAnim = 'fan';
  spin.userData.spinAxis = axis;
  g.add(spin);
  // Central machined titanium/aluminum rotor head spider + blade damper arms
  cyl(spin, 0.085, 0.105, 0.095, 24, hubMat, [0, 0, 0], axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]);
  sphere(spin, 0.068, 16, 12, hubMat, [0, axis === 'z' ? 0 : 0.045, axis === 'z' ? 0.045 : 0]);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    const b = new THREE.Group();
    if (axis === 'z') b.rotation.z = a;
    else b.rotation.y = a;
    spin.add(b);
    // Elastomeric lead-lag damper + pitch-housing cuff + dual bolt clevis
    cyl(b, 0.024, 0.028, 0.16, 14, hubMat, [0.11, 0, 0], [0, 0, Math.PI / 2]);
    rbox(b, 0.09, 0.032, chord * 0.65, 0.006, hubMat, [0.16, 0, 0]);
    // Main composite airfoil blade + nickel leading-edge erosion strip + 20° swept yellow high-vis tip
    rbox(b, radius * 0.84, 0.015, chord, 0.005, bladeMat, [radius * 0.48, 0, 0], [0.09, 0, 0]);
    box(b, radius * 0.82, 0.008, chord * 0.16, chromeMat(), [radius * 0.48, 0.002, -chord * 0.42], [0.09, 0, 0]);
    rbox(b, radius * 0.16, 0.015, chord * 0.94, 0.005, carPaint(0xfacc15), [radius * 0.93, 0, chord * 0.16], [0.09, -0.32, 0]);
  }
  return spin;
}

function addToothedGear(g, pos, radius, thickness, teeth, gearMat, holeMat = chromeMat(), spin = true) {
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  if (spin) {
    grp.userData.driveAnim = 'fan';
    grp.userData.spinAxis = 'y';
  }
  g.add(grp);
  // Outer rim + 5 spokes + central pinion arbor + individual gear teeth around circumference
  torus(grp, radius * 0.88, thickness * 0.55, gearMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  cyl(grp, radius * 0.24, radius * 0.24, thickness * 1.35, 16, holeMat, [0, 0, 0]);
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    box(grp, radius * 1.68, thickness * 0.65, radius * 0.12, gearMat, [0, 0, 0], [0, a, 0]);
  }
  for (let t = 0; t < teeth; t++) {
    const a = (t / teeth) * Math.PI * 2;
    box(grp, radius * 0.14, thickness * 0.85, radius * 0.09, gearMat, [Math.cos(a) * radius * 0.96, 0, Math.sin(a) * radius * 0.96], [0, -a, 0]);
  }
  return grp;
}

function buildH145Model() {
  const rescueRed = carPaint(0xdc2626);
  const rescueYellow = carPaint(0xfacc15);
  const rescueWhite = carPaint(0xf8fafc);
  const darkCarbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });
  const darkTi = brushedMetal(0x334155, { metalness: 0.86, roughness: 0.24 });
  const canopyGlass = glassMat(0x0c192c, 0.72);
  const skyGlass = glassMat(0x0284c7, 0.56);
  const gasketBlack = mat(0x0f172a, { roughness: 0.65, metalness: 0.2 });

  // 30-Station True 3D Lofted Airbus H145 D3 Fuselage Definition (from rear clamshell bay x=-0.56 to rounded nose radome x=+1.38)
  const h145FuselageStations = [
    { x: -0.56, y: 0.11, rTop: 0.065, rBot: 0.055, rz: 0.075, n: 2.1, flatBottom: 0.82 },
    { x: -0.52, y: 0.09, rTop: 0.115, rBot: 0.095, rz: 0.145, n: 2.2, flatBottom: 0.82 },
    { x: -0.47, y: 0.07, rTop: 0.165, rBot: 0.145, rz: 0.205, n: 2.3, flatBottom: 0.83 },
    { x: -0.42, y: 0.04, rTop: 0.215, rBot: 0.195, rz: 0.255, n: 2.4, flatBottom: 0.84 },
    { x: -0.36, y: 0.02, rTop: 0.248, rBot: 0.235, rz: 0.285, n: 2.48, flatBottom: 0.85 },
    { x: -0.30, y: 0.01, rTop: 0.265, rBot: 0.255, rz: 0.302, n: 2.52, flatBottom: 0.85 },
    { x: -0.22, y: 0.01, rTop: 0.272, rBot: 0.262, rz: 0.312, n: 2.55, flatBottom: 0.86 },
    { x: -0.14, y: 0.01, rTop: 0.274, rBot: 0.264, rz: 0.315, n: 2.55, flatBottom: 0.86 },
    { x: -0.04, y: 0.01, rTop: 0.275, rBot: 0.265, rz: 0.316, n: 2.55, flatBottom: 0.86 },
    { x: 0.06,  y: 0.01, rTop: 0.275, rBot: 0.265, rz: 0.316, n: 2.55, flatBottom: 0.86 },
    { x: 0.16,  y: 0.01, rTop: 0.275, rBot: 0.265, rz: 0.316, n: 2.55, flatBottom: 0.86 },
    { x: 0.26,  y: 0.01, rTop: 0.275, rBot: 0.265, rz: 0.316, n: 2.55, flatBottom: 0.86 },
    { x: 0.36,  y: 0.01, rTop: 0.274, rBot: 0.265, rz: 0.315, n: 2.55, flatBottom: 0.86 },
    { x: 0.46,  y: 0.01, rTop: 0.273, rBot: 0.264, rz: 0.314, n: 2.52, flatBottom: 0.86 },
    { x: 0.56,  y: 0.01, rTop: 0.270, rBot: 0.262, rz: 0.310, n: 2.48, flatBottom: 0.86 },
    { x: 0.64,  y: 0.00, rTop: 0.266, rBot: 0.258, rz: 0.305, n: 2.42, flatBottom: 0.85 },
    { x: 0.72,  y: 0.00, rTop: 0.258, rBot: 0.252, rz: 0.298, n: 2.36, flatBottom: 0.84 },
    { x: 0.80,  y: -0.01, rTop: 0.242, rBot: 0.244, rz: 0.288, n: 2.30, flatBottom: 0.83 },
    { x: 0.88,  y: -0.02, rTop: 0.218, rBot: 0.232, rz: 0.274, n: 2.24, flatBottom: 0.82 },
    { x: 0.96,  y: -0.03, rTop: 0.190, rBot: 0.216, rz: 0.256, n: 2.18, flatBottom: 0.80 },
    { x: 1.04,  y: -0.05, rTop: 0.160, rBot: 0.194, rz: 0.234, n: 2.12, flatBottom: 0.78 },
    { x: 1.11,  y: -0.06, rTop: 0.132, rBot: 0.168, rz: 0.208, n: 2.08, flatBottom: 0.75 },
    { x: 1.18,  y: -0.07, rTop: 0.104, rBot: 0.138, rz: 0.176, n: 2.04, flatBottom: 0.72 },
    { x: 1.24,  y: -0.08, rTop: 0.078, rBot: 0.105, rz: 0.140, n: 2.02 },
    { x: 1.29,  y: -0.09, rTop: 0.055, rBot: 0.072, rz: 0.102, n: 2.00 },
    { x: 1.33,  y: -0.095, rTop: 0.036, rBot: 0.045, rz: 0.066, n: 2.00 },
    { x: 1.36,  y: -0.10, rTop: 0.020, rBot: 0.024, rz: 0.035, n: 2.00 },
    { x: 1.38,  y: -0.10, rTop: 0.006, rBot: 0.006, rz: 0.008, n: 2.00 },
  ];

  // 22-Station Lofted Upper Turboshaft Doghouse & Transmission Deck Cowling
  const h145EngineDeckStations = [
    { x: -0.58, y: 0.30, rTop: 0.045, rBot: 0.02, rz: 0.085, n: 2.1, flatBottom: 0.85 },
    { x: -0.50, y: 0.31, rTop: 0.085, rBot: 0.03, rz: 0.145, n: 2.2, flatBottom: 0.85 },
    { x: -0.42, y: 0.31, rTop: 0.125, rBot: 0.04, rz: 0.185, n: 2.3, flatBottom: 0.86 },
    { x: -0.30, y: 0.31, rTop: 0.155, rBot: 0.05, rz: 0.205, n: 2.35, flatBottom: 0.88 },
    { x: -0.16, y: 0.31, rTop: 0.168, rBot: 0.05, rz: 0.215, n: 2.35, flatBottom: 0.88 },
    { x: 0.00,  y: 0.31, rTop: 0.175, rBot: 0.05, rz: 0.218, n: 2.35, flatBottom: 0.88 },
    { x: 0.16,  y: 0.31, rTop: 0.178, rBot: 0.05, rz: 0.215, n: 2.35, flatBottom: 0.88 },
    { x: 0.30,  y: 0.31, rTop: 0.165, rBot: 0.05, rz: 0.198, n: 2.30, flatBottom: 0.88 },
    { x: 0.44,  y: 0.30, rTop: 0.135, rBot: 0.04, rz: 0.168, n: 2.25, flatBottom: 0.86 },
    { x: 0.56,  y: 0.29, rTop: 0.088, rBot: 0.03, rz: 0.125, n: 2.15, flatBottom: 0.85 },
    { x: 0.65,  y: 0.27, rTop: 0.038, rBot: 0.02, rz: 0.072, n: 2.05, flatBottom: 0.85 },
    { x: 0.70,  y: 0.26, rTop: 0.010, rBot: 0.01, rz: 0.025, n: 2.00, flatBottom: 0.85 },
  ];

  const parts = [
    { id: 'h145-bearingless-5blade-rotor', name: 'Hingeless 5-Blade Bearingless Carbon-Flexbeam Main Rotor', category: 'Rotor System', isOuter: true, explodeOffset: [0, 1.55, 0],
      desc: 'H145 D3 bearingless 5-blade composite flexbeam rotor hub with aerodynamic spherical mast cap, integrated pitch-control cuffs, swashplate, and swept parabolic noise-reducing blades.',
      funFact: 'Eliminating mechanical hinges and bearings cuts cabin vibration in half—vital for critically injured patients in a flying ICU!',
      build(g) {
        addSpinHub(g, [0.16, 0.74, 0], 5, 1.48, 0.105, darkCarbon, alu, 'y');
        // Aerodynamic composite mast fairing cap + vibration absorber pendulum weights
        sphere(g, 0.092, 22, 16, darkCarbon, [0.16, 0.77, 0]).scale.set(1.0, 0.62, 1.0);
        cyl(g, 0.048, 0.062, 0.26, 24, alu, [0.16, 0.58, 0]);
        // Rotating & stationary titanium swashplate rings + 3 pitch-control rods & scissor links
        torus(g, 0.115, 0.016, chromeMat(), [0.16, 0.55, 0], [Math.PI / 2, 0, 0]);
        torus(g, 0.105, 0.014, darkTi, [0.16, 0.52, 0], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          cyl(g, 0.006, 0.006, 0.18, 8, chromeMat(), [0.16 + Math.cos(a) * 0.105, 0.64, Math.sin(a) * 0.105]);
        }
      } },
    { id: 'fenestron-shrouded-tail-rotor', name: '10-Blade Uneven-Spaced Fenestron Shrouded Tail Rotor & Stabilizers', category: 'Anti-Torque & Safety', isOuter: true, explodeOffset: [-1.85, 0.35, 0],
      desc: 'High-clearance composite tailboom, horizontal stabilizer with twin endplate fins, and vertical tail shroud enclosing a 10-blade ducted anti-torque fan with stator guide vanes.',
      funFact: 'Enclosing the tail rotor inside a shroud protects ground paramedics walking behind the helicopter during mountain rescues!',
      build(g) {
        // Multi-station lofted high-set composite tailboom tapering from rear upper cabin to Fenestron shroud
        const tailBoomStations = [
          { x: -1.52, y: 0.28, rTop: 0.075, rBot: 0.068, rz: 0.062, n: 2.0 },
          { x: -1.32, y: 0.27, rTop: 0.084, rBot: 0.076, rz: 0.072, n: 2.0 },
          { x: -1.10, y: 0.26, rTop: 0.096, rBot: 0.088, rz: 0.084, n: 2.05 },
          { x: -0.86, y: 0.25, rTop: 0.112, rBot: 0.102, rz: 0.098, n: 2.1 },
          { x: -0.62, y: 0.24, rTop: 0.132, rBot: 0.118, rz: 0.118, n: 2.15 },
          { x: -0.44, y: 0.23, rTop: 0.145, rBot: 0.128, rz: 0.135, n: 2.2 },
        ];
        buildMultiSectionLoft(g, tailBoomStations, { radialSegs: 28, material: rescueRed });
        // Conformal yellow & white ambulance bands along tailboom + aerodynamic Coanda strakes
        for (const s of [-1, 1]) {
          buildConformalLoftPatch(g, tailBoomStations, {
            xFront: -0.52, xBack: -1.46,
            angBottomFront: 1.35 * s, angTopFront: 1.75 * s,
            angBottomBack: 1.35 * s, angTopBack: 1.75 * s,
            offset: 0.003, uSteps: 8, vSteps: 4, material: rescueYellow,
          });
          buildConformalLoftPatch(g, tailBoomStations, {
            xFront: -0.52, xBack: -1.46,
            angBottomFront: 0.85 * s, angTopFront: 1.32 * s,
            angBottomBack: 0.85 * s, angTopBack: 1.32 * s,
            offset: 0.003, uSteps: 8, vSteps: 4, material: rescueWhite,
          });
        }
        // Horizontal stabilizer airfoil + swept red/yellow endplate vertical fins
        rbox(g, 0.24, 0.026, 0.82, 0.009, rescueYellow, [-1.18, 0.27, 0], [0, 0, 0.04]);
        for (const s of [-1, 1]) {
          const endFinPts = [[-1.06, 0.16], [-1.30, 0.18], [-1.36, 0.42], [-1.14, 0.40]];
          extrudeProfile(g, endFinPts, 0.022, rescueRed, [0, 0, s * 0.41], [0, s * -0.05, 0], 0.006);
          rbox(g, 0.21, 0.045, 0.026, 0.006, rescueYellow, [-1.25, 0.40, s * 0.41]);
        }
        // Deeply sculpted shrouded Fenestron tail-rotor housing (fairing body + annular duct + swept dorsal fin + ventral bumper)
        const shroudFairingStations = [
          { x: -1.94, y: 0.32, rTop: 0.04, rBot: 0.04, rz: 0.018, n: 2.0 },
          { x: -1.86, y: 0.31, rTop: 0.28, rBot: 0.26, rz: 0.052, n: 2.0 },
          { x: -1.68, y: 0.30, rTop: 0.33, rBot: 0.31, rz: 0.068, n: 2.0 },
          { x: -1.52, y: 0.29, rTop: 0.26, rBot: 0.24, rz: 0.064, n: 2.0 },
          { x: -1.42, y: 0.28, rTop: 0.11, rBot: 0.10, rz: 0.062, n: 2.0 },
        ];
        buildMultiSectionLoft(g, shroudFairingStations, { radialSegs: 32, material: rescueRed });
        // Recessed Fenestron annular duct throat (yellow inner wall + red sculpted lip torus + 8 stator guide vanes)
        cyl(g, 0.235, 0.235, 0.142, 32, rescueYellow, [-1.68, 0.30, 0], [Math.PI / 2, 0, 0]);
        for (const s of [-1, 1]) {
          torus(g, 0.238, 0.032, rescueRed, [-1.68, 0.30, s * 0.056]);
        }
        for (let v = 0; v < 8; v++) {
          const va = (v / 8) * Math.PI * 2 + 0.2;
          box(g, 0.21, 0.012, 0.035, alu, [-1.68 + Math.cos(va) * 0.115, 0.30 + Math.sin(va) * 0.115, -0.02], [0, 0, va]);
        }
        // Swept upper vertical tail fin & anti-collision beacon + ventral tail bumper skid
        const finPts = [[-1.50, 0.54], [-1.84, 0.54], [-1.98, 0.92], [-1.72, 0.92]];
        extrudeProfile(g, finPts, 0.058, rescueRed, [0, 0, 0], [0, 0, 0], 0.016);
        rbox(g, 0.26, 0.08, 0.062, 0.012, rescueYellow, [-1.85, 0.89, 0]);
        sphere(g, 0.024, 14, 12, emissiveMat(0xef4444, 2.2), [-1.82, 0.95, 0]);
        tube(g, [[-1.58, 0.04, 0], [-1.72, -0.09, 0], [-1.84, -0.06, 0]], 0.014, alu);
        addSpinHub(g, [-1.68, 0.30, 0.01], 10, 0.215, 0.030, darkCarbon, alu, 'z');
      } },
    { id: 'twin-arriel-2e-turboshafts', name: 'Twin Safran Arriel 2E FADEC Turboshafts & Splayed Exhausts', category: 'Propulsion', isOuter: false, explodeOffset: [0, 1.15, -1.35],
      desc: 'Dual-channel FADEC turboshafts delivering 894 shp each with side mesh air intakes, titanium fireproof deck, main bevel gearbox, and splayed heat-shielded exhaust ejectors.',
      funFact: 'If one engine fails during a mountain rescue hover, the surviving engine automatically boosts above 100% power in under a second!',
      build(g) {
        populateGearboxCad(g, { pos: [0.16, 0.38, 0], scale: 0.011 });
        // True 3D multi-station lofted upper engine deck cowling (replaces old flat extruded white block!)
        buildMultiSectionLoft(g, h145EngineDeckStations, { radialSegs: 36, material: rescueWhite });
        // Conformal red & yellow upper cowling accent bands + recessed black mesh side engine air intakes
        for (const s of [-1, 1]) {
          buildConformalLoftPatch(g, h145EngineDeckStations, {
            xFront: 0.56, xBack: -0.44,
            angBottomFront: 0.85 * s, angTopFront: 1.38 * s,
            angBottomBack: 0.85 * s, angTopBack: 1.38 * s,
            offset: 0.003, uSteps: 10, vSteps: 5, material: rescueRed,
          });
          // Recessed dark intake plenum scoop + stainless FOD mesh screen
          rbox(g, 0.28, 0.085, 0.035, 0.01, gasketBlack, [0.06, 0.38, s * 0.205], [0, s * 0.06, 0]);
          rbox(g, 0.16, 0.055, 0.038, 0.006, darkTi, [-0.22, 0.38, s * 0.195], [0, s * 0.08, 0]);
          // Internal Safran Arriel 2E turboshaft core + angled heat-blued inconel exhaust ejector nozzle
          cyl(g, 0.075, 0.085, 0.48, 20, alu, [-0.04, 0.38, s * 0.11], [0, 0, Math.PI / 2]);
          cyl(g, 0.062, 0.074, 0.22, 20, darkTi, [-0.46, 0.39, s * 0.135], [0.08, -0.26 * s, Math.PI / 2]);
          torus(g, 0.064, 0.008, chromeMat(), [-0.55, 0.39, s * 0.162], [0, Math.PI / 2 - 0.26 * s, 0]);
        }
      } },
    { id: 'helionix-cockpit-clamshell-bay', name: 'Lofted Composite Medevac Fuselage, Sliding Doors & Rear Clamshell Bay', category: 'Airframe & Cabin Shell', isOuter: true, explodeOffset: [0, 0.15, 1.35],
      desc: 'Contoured composite red/white/yellow HEMS air-ambulance fuselage with flush conformal livery stripes, wide sliding side doors, and rear clamshell cargo doors.',
      funFact: 'The rear clamshell doors open wide right under the high tailboom so paramedics can slide a wheeled stretcher straight into the cabin!',
      build(g) {
        // 1. True 3D Multi-Station Lofted Airbus H145 Fuselage (28 stations × 40 radial segments — smooth compound curves!)
        buildMultiSectionLoft(g, h145FuselageStations, { radialSegs: 40, material: rescueRed });

        // 2. Conformal HEMS White Upper Cabin Band, High-Vis Sulfur-Yellow Lower Cheatline & Red Cross Rescue Emblems
        for (const s of [-1, 1]) {
          // Conformal white upper cabin ambulance band wrapping smoothly around the lofted hull
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 0.64, xBack: -0.38,
            angBottomFront: 0.58 * s, angTopFront: 1.52 * s,
            angBottomBack: 0.58 * s, angTopBack: 1.52 * s,
            offset: 0.0035, uSteps: 14, vSteps: 8, material: rescueWhite,
          });
          // Conformal high-visibility yellow lower medevac stripe running from nose cheek to rear clamshell
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 1.18, xBack: -0.44,
            angBottomFront: 1.56 * s, angTopFront: 1.92 * s,
            angBottomBack: 1.54 * s, angTopBack: 1.90 * s,
            offset: 0.004, uSteps: 18, vSteps: 6, material: rescueYellow,
          });
          // Conformal 3-pane dark-tinted cabin windows with black gasket frames along sliding door & aft cabin
          for (const [wxFront, wxBack] of [[0.56, 0.34], [0.26, 0.04], [-0.04, -0.26]]) {
            buildConformalLoftPatch(g, h145FuselageStations, {
              xFront: wxFront + 0.015, xBack: wxBack - 0.015,
              angBottomFront: 0.72 * s, angTopFront: 1.36 * s,
              angBottomBack: 0.72 * s, angTopBack: 1.36 * s,
              offset: 0.0055, uSteps: 6, vSteps: 6, material: gasketBlack,
            });
            buildConformalLoftPatch(g, h145FuselageStations, {
              xFront: wxFront, xBack: wxBack,
              angBottomFront: 0.76 * s, angTopFront: 1.32 * s,
              angBottomBack: 0.76 * s, angTopBack: 1.32 * s,
              offset: 0.007, uSteps: 6, vSteps: 6, material: canopyGlass,
            });
          }
          // Red Cross Medical Rescue Emblem on aft cabin flank + upper/lower sliding cabin door rails & door handle
          box(g, 0.095, 0.030, 0.014, rescueRed, [-0.33, 0.09, s * 0.308]);
          box(g, 0.030, 0.095, 0.014, rescueRed, [-0.33, 0.09, s * 0.308]);
          box(g, 0.82, 0.012, 0.018, alu, [0.16, 0.23, s * 0.295]);
          box(g, 0.82, 0.014, 0.022, alu, [0.16, -0.19, s * 0.298]);
          rbox(g, 0.055, 0.018, 0.022, 0.004, gasketBlack, [0.58, -0.02, s * 0.314]);
        }
        // 3. Rear Clamshell Ambulance Loading Doors (conformal yellow safety panels, center seam & dual tinted rear windows)
        for (const s of [-1, 1]) {
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: -0.38, xBack: -0.54,
            angBottomFront: 0.25 * s, angTopFront: 1.45 * s,
            angBottomBack: 0.25 * s, angTopBack: 1.45 * s,
            offset: 0.0045, uSteps: 6, vSteps: 6, material: rescueYellow,
          });
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: -0.40, xBack: -0.50,
            angBottomFront: 0.45 * s, angTopFront: 1.05 * s,
            angBottomBack: 0.45 * s, angTopBack: 1.05 * s,
            offset: 0.0065, uSteps: 5, vSteps: 5, material: canopyGlass,
          });
        }
      } },
    { id: 'panoramic-bubble-windshield-helionix', name: 'Framed Panoramic Bubble Canopy, Skylights & 3-Screen Helionix Cockpit', category: 'Cockpit & Avionics', isOuter: true, explodeOffset: [1.45, 0.35, 0],
      desc: 'Framed two-piece curved polycarbonate bubble windshield with center post, twin wipers, overhead blue-tinted skylights, lower chin windows, 3-screen Helionix glass dash, and dual cyclic/collective controls.',
      funFact: 'The H145’s 4-axis Helionix autopilot can automatically bring the helicopter to a stable hover in zero-visibility mountain clouds!',
      build(g) {
        // 1. Compound-Curved Conformal Left & Right Panoramic Cockpit Windshields hugging the lofted nose
        for (const s of [-1, 1]) {
          // Black weatherstrip perimeter frame + curved polycarbonate bubble windshield
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 1.19, xBack: 0.67,
            angBottomFront: 0.05 * s, angTopFront: 1.24 * s,
            angBottomBack: 0.05 * s, angTopBack: 1.32 * s,
            offset: 0.005, uSteps: 14, vSteps: 10, material: gasketBlack,
          });
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 1.17, xBack: 0.69,
            angBottomFront: 0.09 * s, angTopFront: 1.18 * s,
            angBottomBack: 0.09 * s, angTopBack: 1.26 * s,
            offset: 0.007, uSteps: 14, vSteps: 10, material: canopyGlass,
          });
          // Conformal overhead blue-tinted cockpit roof skylight windows
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 0.88, xBack: 0.65,
            angBottomFront: 0.12 * s, angTopFront: 0.56 * s,
            angBottomBack: 0.12 * s, angTopBack: 0.58 * s,
            offset: 0.008, uSteps: 8, vSteps: 6, material: skyGlass,
          });
          // Conformal lower chin bubble observation windows for vertical landing visibility
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 1.26, xBack: 1.02,
            angBottomFront: 1.62 * s, angTopFront: 2.28 * s,
            angBottomBack: 1.62 * s, angTopBack: 2.22 * s,
            offset: 0.006, uSteps: 8, vSteps: 6, material: canopyGlass,
          });
          // Conformal painted rescue-red A-pillar divider between windshield & cockpit side door window
          buildConformalLoftPatch(g, h145FuselageStations, {
            xFront: 0.94, xBack: 0.88,
            angBottomFront: 0.08 * s, angTopFront: 1.30 * s,
            angBottomBack: 0.08 * s, angTopBack: 1.30 * s,
            offset: 0.009, uSteps: 4, vSteps: 8, material: rescueRed,
          });
          // Pantograph windshield wiper blade + pilot & co-pilot crashworthy bucket seats + cyclic stick
          box(g, 0.22, 0.008, 0.012, darkCarbon, [1.04, 0.08, s * 0.11], [0, s * -0.22, -0.52]);
          rbox(g, 0.14, 0.22, 0.13, 0.016, darkCarbon, [0.76, -0.04, s * 0.13]);
          cyl(g, 0.007, 0.009, 0.16, 10, darkCarbon, [0.88, -0.08, s * 0.13], [0, 0, -0.18]);
        }
        // Center windshield mullion post (conformal rescue-red strip down the nose centerline)
        buildConformalLoftPatch(g, h145FuselageStations, {
          xFront: 1.20, xBack: 0.66,
          angBottomFront: -0.07, angTopFront: 0.07,
          angBottomBack: -0.07, angTopBack: 0.07,
          offset: 0.009, uSteps: 12, vSteps: 4, material: rescueRed,
        });
        // 3-Screen Airbus Helionix glass cockpit instrument panel + anti-glare brow + nose weather radar radome cap
        rbox(g, 0.15, 0.11, 0.42, 0.018, screenMat('dashboard'), [0.96, 0.01, 0], [0, 0, -0.22]);
        rbox(g, 0.18, 0.032, 0.44, 0.012, gasketBlack, [0.98, 0.07, 0]);
        for (const s of [-1, 1]) {
          cyl(g, 0.004, 0.006, 0.11, 8, chromeMat(), [1.26, -0.02, s * 0.12], [0, 0, Math.PI / 2]);
        }
      } },
    { id: 'hems-icu-stretcher-life-support', name: 'Roll-In Stryker ICU Medical Stretcher, Ventilator & Paramedic Seats', category: 'Flying ICU Interior', isOuter: false, explodeOffset: [-0.95, 0.15, -1.35],
      desc: 'Roll-in aluminum ambulance stretcher with yellow high-vis mattress, overhead medical oxygen/defibrillator/ventilator rack, and two swiveling flight-doctor seats.',
      funFact: 'Every H145 air ambulance carries the same ventilator, defibrillator, blood warmer, and ultrasound gear as a hospital trauma bay!',
      build(g) {
        // Roll-in Stryker aluminum stretcher rails, folding undercarriage & high-vis yellow segmented mattress
        rbox(g, 0.76, 0.048, 0.21, 0.016, rescueYellow, [0.04, -0.05, -0.08]);
        rbox(g, 0.22, 0.055, 0.19, 0.014, rescueYellow, [0.34, -0.01, -0.08], [0, 0, -0.35]);
        rbox(g, 0.78, 0.024, 0.23, 0.008, alu, [0.04, -0.09, -0.08]);
        // Medical ICU rack with Corpuls defibrillator monitor, Dräger ventilator & twin white/blue oxygen cylinders
        rbox(g, 0.46, 0.24, 0.13, 0.016, alu, [-0.04, 0.05, 0.16]);
        rbox(g, 0.15, 0.11, 0.022, 0.005, screenMat('ios'), [-0.04, 0.09, 0.092]);
        cyl(g, 0.026, 0.026, 0.22, 14, rescueWhite, [-0.18, 0.04, 0.16]);
        cyl(g, 0.026, 0.026, 0.22, 14, carPaint(0x0284c7), [0.10, 0.04, 0.16]);
        // Flight paramedic & emergency doctor swiveling cabin seats
        rbox(g, 0.13, 0.20, 0.13, 0.014, carPaint(0x1d4ed8), [0.36, -0.03, 0.12]);
      } },
    { id: 'rescue-winch-searchlight-flir', name: 'Goodrich 90m Hydraulic Rescue Hoist, Hook & TrakkaBeam Searchlight', category: 'Search & Rescue Gear', isOuter: true, explodeOffset: [0.65, 0.55, 1.45],
      desc: 'Roof-mounted Goodrich 90-meter hydraulic rescue winch boom with cable & rescue hook, belly TrakkaBeam A800 searchlight, and nose FLIR thermal camera.',
      funFact: 'The external rescue winch can hoist two people (272 kg) simultaneously up from a cliff face or sinking ship while hovering!',
      build(g) {
        // Roof-mounted Goodrich hydraulic rescue hoist drum, aerodynamic yellow pod & cantilevered strut
        cyl(g, 0.042, 0.042, 0.20, 20, rescueYellow, [0.28, 0.33, 0.36], [0, 0, Math.PI / 2]);
        sphere(g, 0.042, 16, 12, rescueYellow, [0.38, 0.33, 0.36]);
        cyl(g, 0.015, 0.015, 0.24, 12, alu, [0.28, 0.29, 0.25], [Math.PI / 2 - 0.18, 0, 0]);
        // Steel hoist cable, elastomeric bump stop & rescue hook
        cyl(g, 0.004, 0.004, 0.30, 8, chromeMat(), [0.34, 0.17, 0.38]);
        cyl(g, 0.016, 0.020, 0.04, 12, gasketBlack, [0.34, 0.04, 0.38]);
        torus(g, 0.022, 0.006, rescueYellow, [0.34, 0.00, 0.38]);
        // Belly TrakkaBeam A800 searchlight on pan/tilt gimbal + nose FLIR thermal imaging turret
        cyl(g, 0.052, 0.058, 0.10, 20, darkCarbon, [0.62, -0.30, -0.22], [0, 0, Math.PI / 2 - 0.25]);
        cyl(g, 0.044, 0.044, 0.015, 20, emissiveMat(0xe0f2fe, 2.0), [0.67, -0.31, -0.22], [0, 0, Math.PI / 2 - 0.25]);
        sphere(g, 0.054, 18, 14, darkTi, [1.26, -0.21, 0.08]);
        sphere(g, 0.026, 14, 12, skyGlass, [1.30, -0.22, 0.08]);
      } },
    { id: 'tubular-aluminum-skid-gear', name: 'Energy-Absorbing Tubular Aluminum Skids, Snow Pads & Wire Cutters', category: 'Landing Gear', isOuter: false, explodeOffset: [0, -1.35, 0],
      desc: 'Cross-tube aluminum landing skids with bear-paw snow settling protectors, long paramedic boarding steps, and upper/lower wire-strike protection cutters.',
      funFact: 'The curved cross-tubes bend like giant leaf springs to absorb hard emergency landings on rocky alpine ledges!',
      build(g) {
        // Continuous arched forward & aft aluminum cross-tubes curving from fuselage belly down to skid tubes
        for (const xCross of [-0.16, 0.68]) {
          tube(g, [
            [xCross, -0.44, -0.42],
            [xCross, -0.30, -0.32],
            [xCross, -0.24, -0.22],
            [xCross, -0.24, 0.22],
            [xCross, -0.30, 0.32],
            [xCross, -0.44, 0.42],
          ], 0.024, alu);
        }
        for (const s of [-1, 1]) {
          // Longitudinal tubular steel/aluminum skid runners with curved upturned nose tips & rear tow rings
          tube(g, [
            [-0.48, -0.44, s * 0.42],
            [0.26, -0.44, s * 0.42],
            [1.04, -0.44, s * 0.42],
            [1.16, -0.41, s * 0.42],
            [1.23, -0.34, s * 0.42],
          ], 0.025, alu);
          // Bear-paw snow settling pads at rear of skids + full-length paramedic boarding step rails
          rbox(g, 0.26, 0.016, 0.13, 0.006, rescueYellow, [-0.34, -0.455, s * 0.42]);
          rbox(g, 0.68, 0.016, 0.065, 0.006, darkCarbon, [0.26, -0.34, s * 0.365]);
        }
        // Upper roof & lower belly WSPS (Wire Strike Protection System) mechanical cable cutters
        const upperCutterPts = [[0.84, 0.25], [0.98, 0.24], [1.06, 0.42], [0.96, 0.42]];
        extrudeProfile(g, upperCutterPts, 0.014, darkCarbon, [0, 0, 0], [0, 0, 0], 0.003);
        const lowerCutterPts = [[0.92, -0.23], [1.06, -0.21], [1.14, -0.36], [1.02, -0.36]];
        extrudeProfile(g, lowerCutterPts, 0.014, darkCarbon, [0, 0, 0], [0, 0, 0], 0.003);
      } },
  ];
  return {
    id: 'airbus-h145-rescue', name: 'Airbus H145 D3 Medevac Helicopter', brand: 'Airbus Helicopters', badge: '5-Blade Hingeless • Fenestron Tail • 8 Subsystems',
    desc: 'World-leading air-ambulance rescue helicopter with a 5-blade bearingless main rotor, shrouded Fenestron tail fan, framed panoramic bubble cockpit, roll-in ICU stretcher bay, Goodrich rescue hoist, and twin Arriel 2E turboshafts.',
    cameraPos: [3.8, 2.0, 3.8], parts,
    quiz: [
      { q: 'What is the shrouded 10-blade tail fan on the Airbus H145 called?', correctId: 'fenestron-shrouded-tail-rotor', distractors: ['h145-bearingless-5blade-rotor', 'tubular-aluminum-skid-gear', 'twin-arriel-2e-turboshafts'] },
      { q: 'Why does the H145 use a 5-blade bearingless flexbeam rotor instead of hinged blades?', correctId: 'h145-bearingless-5blade-rotor', distractors: ['tubular-aluminum-skid-gear', 'helionix-cockpit-clamshell-bay', 'fenestron-shrouded-tail-rotor'] },
      { q: 'Which feature lets paramedics load a stretcher straight into the back of the H145?', correctId: 'helionix-cockpit-clamshell-bay', distractors: ['twin-arriel-2e-turboshafts', 'tubular-aluminum-skid-gear', 'h145-bearingless-5blade-rotor'] },
      { q: 'Which twin FADEC turboshaft engines give the medevac helicopter safe single-engine climb power?', correctId: 'twin-arriel-2e-turboshafts', distractors: ['tubular-aluminum-skid-gear', 'hems-icu-stretcher-life-support', 'panoramic-bubble-windshield-helionix'] },
      { q: 'Which external 90-meter hydraulic winch and searchlight rescue stranded hikers from steep cliffs?', correctId: 'rescue-winch-searchlight-flir', distractors: ['fenestron-shrouded-tail-rotor', 'tubular-aluminum-skid-gear', 'panoramic-bubble-windshield-helionix'] },
    ],
  };
}

function buildDjiMavicModel() {
  const carbon = carbonFiberMat([6, 6]);
  const magGrey = brushedMetal(0x475569, { metalness: 0.78, roughness: 0.28 });
  const darkSlate = mat(0x1e293b, { roughness: 0.42, metalness: 0.35 });
  const copper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });

  const parts = [
    { id: 'folding-carbon-arms-outrunners', name: '4× Folding Carbon Arms, Hinges & Front Antenna Landing Legs', category: 'Airframe Booms', isOuter: true, explodeOffset: [0, 0.45, 1.45],
      desc: 'Four sculpted carbon-composite folding swing arms with spring-cam pivot hinges, internal coaxial motor wiring, and front vertical landing legs.',
      funFact: 'The front arms swing forward while the rear arms fold downward and twist 180 degrees so the whole quadcopter fits in a jacket pocket!',
      build(g) {
        for (const [x, z, isFront] of [[0.82, -0.82, true], [0.82, 0.82, true], [-0.78, -0.78, false], [-0.78, 0.78, false]]) {
          cyl(g, 0.045, 0.045, 0.09, 16, alu, [x * 0.28, isFront ? 0.02 : -0.02, z * 0.26]);
          tube(g, [[x * 0.28, isFront ? 0.02 : -0.03, z * 0.26], [x * 0.65, 0.03, z * 0.62], [x, 0.05, z]], 0.032, carbon);
          cyl(g, 0.092, 0.078, 0.055, 22, magGrey, [x, 0.035, z]);
          sphere(g, 0.018, 12, 10, emissiveMat(isFront ? 0xef4444 : 0x22c55e, 1.8), [x, 0.01, z]);
          if (isFront) cyl(g, 0.016, 0.012, 0.22, 12, darkSlate, [x, -0.09, z]);
        }
      } },
    { id: 'brushless-outrunner-motors-props', name: '4× Copper-Wound Brushless Outrunner Motors & Folding Low-Noise Props', category: 'Propulsion', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'Four high-torque 3-phase brushless outrunner motors with visible copper stator windings, neodymium rotor bells, and 8 aerodynamic folding low-noise propellers.',
      funFact: 'Unlike a helicopter with tilting blades, a quadcopter steers entirely by speeding up or slowing down pairs of motors thousands of times per second!',
      build(g) {
        for (const [x, z] of [[0.82, -0.82], [0.82, 0.82], [-0.78, -0.78], [-0.78, 0.78]]) {
          cyl(g, 0.078, 0.078, 0.045, 20, copper, [x, 0.075, z]);
          cyl(g, 0.088, 0.088, 0.038, 22, darkSlate, [x, 0.105, z]);
          addSpinHub(g, [x, 0.135, z], 2, 0.56, 0.062, carbon, alu, 'y');
        }
      } },
    { id: 'hasselblad-3axis-gimbal', name: '3-Axis Brushless Gimbal & Hasselblad Triple-Camera Array', category: 'Imaging Payload', isOuter: true, explodeOffset: [1.45, -0.35, 0],
      desc: 'Vibration-isolated 3-axis brushless gimbal stabilizing a 4/3" CMOS 20MP Hasselblad main camera, 70mm medium tele, and 166mm periscope tele.',
      funFact: 'The gimbal’s brushless torque motors cancel out wind gusts to within 0.005 degrees so aerial video looks rock-steady!',
      build(g) {
        rbox(g, 0.18, 0.05, 0.24, 0.015, magGrey, [0.58, 0.06, 0]);
        rbox(g, 0.05, 0.18, 0.04, 0.012, magGrey, [0.64, -0.02, 0.12]);
        rbox(g, 0.24, 0.24, 0.22, 0.045, darkSlate, [0.72, -0.06, 0]);
        for (const [dy, dz, r] of [[0.045, 0, 0.058], [-0.05, -0.052, 0.040], [-0.05, 0.052, 0.040]]) {
          torus(g, r + 0.005, 0.008, copper, [0.84, -0.06 + dy, dz], [0, Math.PI / 2, 0]);
          cyl(g, r, r, 0.035, 22, glassMat(0x38bdf8, 0.55), [0.84, -0.06 + dy, dz], [0, 0, Math.PI / 2]);
        }
      } },
    { id: 'lipo-4s-flight-battery', name: '4S 5,000 mAh LiPo Intelligent Flight Battery & BMS', category: 'Electrical Power', isOuter: false, explodeOffset: [-1.35, 0.35, 0],
      desc: 'Slide-in 77 Wh high-discharge lithium-polymer battery pack with smart cell-balancing BMS and 4 LED charge indicators.',
      funFact: 'Smart drone batteries automatically discharge themselves to 60% if left unused for a week so the lithium cells don’t swell!',
      build(g) {
        rbox(g, 0.62, 0.20, 0.36, 0.035, darkSlate, [-0.18, 0.03, 0]);
        torus(g, 0.032, 0.006, alu, [-0.495, 0.03, 0], [0, Math.PI / 2, 0]);
        for (let i = 0; i < 4; i++) {
          sphere(g, 0.014, 12, 12, emissiveMat(0x22c55e, 1.8), [-0.495, 0.03, -0.06 + i * 0.04]);
        }
      } },
    { id: 'omnidirectional-vision-gps', name: 'Omnidirectional 8-Camera Binocular Vision & ToF Obstacle Sensors', category: 'Autonomy Sensors', isOuter: false, explodeOffset: [0.85, 0.95, 0],
      desc: 'Eight wide-angle fisheye stereo vision cameras (front, rear, top, bottom) plus a downward Time-of-Flight infrared laser altimeter.',
      funFact: 'Eight stereo camera eyes build a live 3D voxel map around the drone so it can weave around tree branches automatically!',
      build(g) {
        for (const z of [-0.15, 0.15]) {
          sphere(g, 0.042, 16, 16, glassMat(0x0f172a, 0.78), [0.58, 0.09, z]);
          sphere(g, 0.036, 16, 16, glassMat(0x0f172a, 0.78), [-0.46, 0.09, z]);
          sphere(g, 0.030, 14, 14, glassMat(0x0f172a, 0.78), [0.12, -0.12, z * 0.65]);
        }
        rbox(g, 0.08, 0.025, 0.08, 0.006, emissiveMat(0xef4444, 1.2), [-0.08, -0.125, 0]);
      } },
    { id: 'flight-controller-esc-gnss-stack', name: 'Dual-IMU Flight Controller PCB, 4-in-1 50A ESC & GNSS Receiver', category: 'Avionics & ESC Stack', isOuter: false, explodeOffset: [0, 0.85, -1.25],
      desc: 'Multi-layer green flight controller board with vibration-damped dual IMUs, barometric altimeter, 4-in-1 sinusoidal ESC power stage, and ceramic GPS/Galileo patch antenna.',
      funFact: 'The flight controller reads gyroscope and accelerometer data 2,000 times per second to hold the drone within 10 cm in gusty winds!',
      build(g) {
        rbox(g, 0.52, 0.032, 0.34, 0.01, mat(0x065f46, { roughness: 0.35 }), [0.08, 0.12, 0]);
        rbox(g, 0.44, 0.028, 0.30, 0.008, mat(0x0f172a, { roughness: 0.3 }), [0.06, 0.07, 0]);
        rbox(g, 0.14, 0.022, 0.14, 0.005, copper, [0.18, 0.145, 0]);
      } },
    { id: 'o3-plus-sdr-video-transceiver', name: 'O3+ 15km 1080p/60fps SDR Video Transceiver & Diversity Antennas', category: 'Radio & Telemetry', isOuter: false, explodeOffset: [-0.95, -0.45, -1.25],
      desc: 'Software-Defined Radio (SDR) H.265 video encoder, RF power amplifiers, and 2T4R dual-band 2.4/5.8 GHz phased-array antenna feeds.',
      funFact: 'The O3+ radio hops across frequencies in milliseconds to beam crystal-clear 1080p live video from up to 15 kilometers away!',
      build(g) {
        rbox(g, 0.28, 0.035, 0.24, 0.008, alu, [-0.08, -0.04, 0]);
        buildWiringHarness(g, [[-0.08, -0.04, 0.10], [0.45, 0.02, 0.45], [0.80, -0.02, 0.80]], { radius: 0.008, color: 0x38bdf8 });
        buildWiringHarness(g, [[-0.08, -0.04, -0.10], [0.45, 0.02, -0.45], [0.80, -0.02, -0.80]], { radius: 0.008, color: 0x38bdf8 });
      } },
    { id: 'magnesium-core-cooling-chassis', name: 'Sculpted Aerodynamic Body Shell & Finned Magnesium Heatsink Belly', category: 'Structure & Thermal', isOuter: true, explodeOffset: [0, -1.25, 0],
      desc: 'Aerodynamic matte-slate fuselage shell with cooling intake gills and a die-cast magnesium finned bottom heatsink plate cooled by propeller downwash.',
      funFact: 'The drone places its 4K video processor heatsink on its belly so the hurricane-force air from the propellers cools it for free!',
      build(g) {
        const bodyPts = [
          [-0.52, -0.10], [0.46, -0.12], [0.64, -0.02],
          [0.56, 0.14], [0.12, 0.18], [-0.48, 0.14],
        ];
        extrudeProfile(g, bodyPts, 0.42, magGrey, [0, 0, 0], [0, 0, 0], 0.045);
        for (let i = -3; i <= 3; i++) box(g, 0.55, 0.025, 0.016, alu, [0.02, -0.13, i * 0.045]);
      } },
  ];
  return {
    id: 'dji-mavic-3-pro', name: 'Pro Triple-Camera Folding Quadcopter', brand: 'DJI / Hasselblad', badge: '43-Min Flight • 3-Axis Gimbal • 8 Subsystems',
    desc: 'Foldable professional aerial photography quadcopter with 4 folding carbon arms, copper-wound brushless outrunner motors, 3-axis Hasselblad triple-camera gimbal, 4S LiPo smart battery, 8-camera vision suite, and O3+ SDR downlink.',
    cameraPos: [3.4, 2.1, 3.4], parts,
    quiz: [
      { q: 'How does a quadcopter pitch, roll, and yaw without a tail rotor or mechanical swashplate?', correctId: 'brushless-outrunner-motors-props', distractors: ['hasselblad-3axis-gimbal', 'lipo-4s-flight-battery', 'magnesium-core-cooling-chassis'] },
      { q: 'Which 3-axis motorized mechanism keeps the drone camera level even when the drone tilts into the wind?', correctId: 'hasselblad-3axis-gimbal', distractors: ['omnidirectional-vision-gps', 'folding-carbon-arms-outrunners', 'lipo-4s-flight-battery'] },
      { q: 'Which sensor suite lets the quadcopter detect and fly around tree branches in all directions?', correctId: 'omnidirectional-vision-gps', distractors: ['magnesium-core-cooling-chassis', 'lipo-4s-flight-battery', 'hasselblad-3axis-gimbal'] },
      { q: 'Which 4 hinged carbon-composite booms fold inward so the quadcopter fits inside a small bag?', correctId: 'folding-carbon-arms-outrunners', distractors: ['lipo-4s-flight-battery', 'o3-plus-sdr-video-transceiver', 'flight-controller-esc-gnss-stack'] },
      { q: 'Which long-range Software-Defined Radio beams live 1080p/60fps video from up to 15 kilometers away?', correctId: 'o3-plus-sdr-video-transceiver', distractors: ['magnesium-core-cooling-chassis', 'hasselblad-3axis-gimbal', 'lipo-4s-flight-battery'] },
    ],
  };
}

function buildIngenuityModel() {
  const carbon = carbonFiberMat([5, 5]);
  const kapton = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: solarGridTexture(), metalness: 0.72, roughness: 0.18 });

  const parts = [
    { id: 'coaxial-carbon-rotors', name: 'Counter-Rotating 1.2m Carbon-Foam Coaxial Rotors (NASA CAD)', category: 'Mars Rotor System', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'Real NASA Ingenuity CAD twin counter-rotating 1.2-meter molded carbon-fiber foam-core rotors spinning at 2,537 RPM in Mars’s 1%-density CO2 atmosphere.',
      funFact: 'Mars’s air is 99% thinner than Earth’s—so Ingenuity’s blades had to spin 5 times faster than an Earth helicopter just to lift 1.8 kg!',
      build(g) {
        populateIngenuityCad(g, { zone: 'rotors' });
        addSpinHub(g, [0, 0.45, 0], 2, 1.15, 0.14, carbon, kapton, 'y');
        addSpinHub(g, [0, 0.62, 0], 2, 1.15, 0.14, carbon, kapton, 'y');
      } },
    { id: 'dual-swashplate-pitch-servos', name: 'Dual Titanium Swashplates, Coaxial Mast & 6 Micro-Servos', category: 'Rotor Flight Controls', isOuter: false, explodeOffset: [0, 0.95, 1.25],
      desc: 'Concentric inner/outer titanium drive shafts, upper and lower articulated titanium swashplates, pitch-change links, and 6 heated micro-servos.',
      funFact: 'Beneath Ingenuity’s upper swashplate, NASA engineers taped a tiny postage-stamp piece of muslin fabric from the Wright Brothers’ 1903 Flyer!',
      build(g) {
        cyl(g, 0.032, 0.036, 0.62, 16, carbon, [0, 0.42, 0]);
        for (const y of [0.38, 0.56]) {
          torus(g, 0.085, 0.014, kapton, [0, y, 0], [Math.PI / 2, 0, 0]);
          torus(g, 0.072, 0.011, alu, [0, y + 0.025, 0], [Math.PI / 2, 0, 0]);
        }
        for (const a of [0, 2.09, 4.18]) {
          cyl(g, 0.008, 0.008, 0.24, 8, alu, [Math.cos(a) * 0.07, 0.34, Math.sin(a) * 0.07]);
        }
      } },
    { id: 'top-solar-array-panel', name: 'Mast-Top GaAs Solar Array & 900 MHz Rover Radio Antenna (NASA CAD)', category: 'Power & Radio', isOuter: true, explodeOffset: [0, 1.95, 0],
      desc: 'Real NASA Ingenuity CAD high-efficiency gallium-arsenide solar cell array mounted above the coaxial rotors with a central 900 MHz monopole antenna.',
      funFact: 'Over 70% of Ingenuity’s solar battery power wasn’t used for flying—it was used just to run survival heaters through -90°C Martian nights!',
      build(g) {
        populateIngenuityCad(g, { zone: 'solar-panel' });
        box(g, 0.82, 0.02, 0.32, solarMat, [0, 0.82, 0]);
        cyl(g, 0.006, 0.006, 0.18, 8, kapton, [0.12, 0.91, 0]);
      } },
    { id: 'kapton-avionics-fuselage', name: 'Gold Kapton-Foil CO2-Gap Thermal Fuselage Box (NASA CAD)', category: 'Thermal Enclosure', isOuter: true, explodeOffset: [1.35, 0, 0],
      desc: 'Real NASA Ingenuity CAD ultra-lightweight carbon-composite outer box wrapped in gold Kapton foil, trapping a stagnant CO2 gas layer for thermal insulation.',
      funFact: 'Solid foam insulation was too heavy for Mars—so JPL used Mars’s own thin carbon-dioxide air trapped between foil layers as weightless insulation!',
      build(g) {
        populateIngenuityCad(g, { zone: 'fuselage-bus' });
        rbox(g, 0.36, 0.32, 0.36, 0.02, kapton, [0, -0.05, 0]);
      } },
    { id: 'six-cell-sony-li-ion-battery', name: '6× Sony VTC4 18650 Li-Ion Battery Pack (35.7 Wh) & Foil Heaters', category: 'Energy Storage', isOuter: false, explodeOffset: [-1.25, 0.25, 0],
      desc: 'Six cylindrical high-discharge 2 Ah lithium-ion 18650 cells arranged around the central mast tube with Kapton resistance heater blankets.',
      funFact: 'Ingenuity’s 6 battery cells weighed just 273 grams total yet delivered over 350 watts of burst power during takeoff on Mars!',
      build(g) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          cyl(g, 0.028, 0.028, 0.18, 14, carPaint(0x16a34a), [Math.cos(a) * 0.085, -0.04, Math.sin(a) * 0.085]);
        }
        torus(g, 0.09, 0.012, kapton, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
      } },
    { id: 'snapdragon-flight-computer-imu', name: 'Qualcomm Snapdragon 801 Flight Processor, Dual FPGA & MEMS IMU', category: 'Avionics & GNC', isOuter: false, explodeOffset: [0, -0.25, -1.35],
      desc: 'Cube-shaped avionics card cage inside the fuselage box housing a 2.26 GHz Snapdragon 801 Linux processor, radiation-tolerant Actel FPGAs, and Bosch BMI160 IMU.',
      funFact: 'Ingenuity’s Snapdragon 801 smartphone chip had 100 times more computing power than the Perseverance Mars rover it rode to Mars with!',
      build(g) {
        for (const d of [-0.11, 0.11]) {
          box(g, 0.22, 0.20, 0.012, mat(0x065f46), [0, -0.05, d]);
          box(g, 0.012, 0.20, 0.22, mat(0x065f46), [d, -0.05, 0]);
        }
        rbox(g, 0.07, 0.07, 0.018, 0.004, mat(0x0f172a), [0, -0.05, 0.12]);
      } },
    { id: 'garmin-lidar-navcam-downward', name: 'Garmin Lidar-Lite Laser Altimeter, 30-Hz NavCam & 13MP RTE Camera', category: 'Vision & Altimetry', isOuter: false, explodeOffset: [-1.35, -0.55, 0],
      desc: 'Nadir-pointing Garmin Lidar-Lite v3 laser rangefinder, 0.5MP global-shutter B&W navigation camera, and forward-angled 13MP color Return-to-Earth camera.',
      funFact: 'Because Mars has no GPS satellites and a weak magnetic field, Ingenuity navigated by tracking rocks and sand ripples 30 times per second!',
      build(g) {
        cyl(g, 0.06, 0.06, 0.08, 16, chromeMat(), [-0.06, -0.24, 0.04]);
        cyl(g, 0.045, 0.045, 0.07, 16, glassMat(0x38bdf8, 0.45), [0.06, -0.24, -0.04]);
        cyl(g, 0.032, 0.032, 0.05, 16, alu, [0.16, -0.14, 0], [0, 0, Math.PI / 2 - 0.35]);
      } },
    { id: 'carbon-mars-landing-legs', name: '4× Ultra-Light Tapered Carbon-Tube Landing Legs (NASA CAD)', category: 'Landing Gear', isOuter: false, explodeOffset: [0, -1.35, 0],
      desc: 'Real NASA Ingenuity CAD four flexible titanium-and-carbon legs with spring-loaded deployment hinges and compliant Martian regolith footpads.',
      funFact: 'Planned for just 5 test flights over 30 days, Ingenuity flew 72 times over nearly 3 years on Mars!',
      build(g) {
        populateIngenuityCad(g, { zone: 'landing-legs' });
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          cyl(g, 0.012, 0.016, 0.72, 10, carbon, [sx * 0.34, -0.34, sz * 0.34], [sz * 0.55, 0, -sx * 0.55]);
        }
      } },
  ];
  return {
    id: 'nasa-ingenuity-mars-heli', name: 'NASA Ingenuity Mars Coaxial Helicopter', brand: 'NASA JPL / AeroVironment', badge: '2,537 RPM • 1.8 kg • 8 Subsystems • Real NASA CAD',
    desc: 'First aircraft to achieve powered, controlled flight on another planet, built from official NASA JPL 3D CAD with counter-rotating coaxial carbon rotors, dual swashplates, solar array, 6-cell Li-ion pack, and Snapdragon flight computer.',
    cameraPos: [3.4, 2.0, 3.4], parts,
    quiz: [
      { q: 'Why does NASA Ingenuity use two counter-rotating coaxial rotors instead of a tail rotor?', correctId: 'coaxial-carbon-rotors', distractors: ['top-solar-array-panel', 'carbon-mars-landing-legs', 'kapton-avionics-fuselage'] },
      { q: 'What did most of Ingenuity’s solar-charged battery energy do during the -90°C Martian night?', correctId: 'top-solar-array-panel', distractors: ['carbon-mars-landing-legs', 'coaxial-carbon-rotors', 'kapton-avionics-fuselage'] },
      { q: 'Which gold-foiled central cube houses Ingenuity’s batteries, heaters, and Snapdragon flight computer?', correctId: 'kapton-avionics-fuselage', distractors: ['coaxial-carbon-rotors', 'carbon-mars-landing-legs', 'top-solar-array-panel'] },
      { q: 'Which downward Garmin laser altimeter and navigation camera track Martian rocks 30 times per second without GPS?', correctId: 'garmin-lidar-navcam-downward', distractors: ['carbon-mars-landing-legs', 'top-solar-array-panel', 'six-cell-sony-li-ion-battery'] },
      { q: 'Which 6 micro-servos and dual titanium swashplates tilt Ingenuity’s rotor blades 500 times per second?', correctId: 'dual-swashplate-pitch-servos', distractors: ['carbon-mars-landing-legs', 'six-cell-sony-li-ion-battery', 'top-solar-array-panel'] },
    ],
  };
}

function buildSwissChronographModel() {
  const brass = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const steel = chromeMat();
  const rhodium = brushedMetal(0xe2e8f0, { metalness: 0.9, roughness: 0.18 });
  const ruby = carPaint(0xe11d48);
  const bluedSteel = carPaint(0x1d4ed8);
  const blackCeramic = mat(0x0f172a, { roughness: 0.12, metalness: 0.45 });

  // 10 Horological Subsystems arranged in a multi-tier vertical & radial exploded stack!
  const parts = [
    { id: 'ceramic-tachymeter-bezel-sapphire', name: 'Cerachrom Tachymeter Bezel & Anti-Reflective Domed Sapphire Crystal', category: 'Bezel & Crystal', isOuter: true, explodeOffset: [0, 1.85, 0],
      desc: 'Scratchproof black ceramic tachymeter bezel graduated from 400 to 60 units per hour, paired with a synthetic corundum sapphire front crystal and red waterproof gasket.',
      funFact: 'A tachymeter scale on the bezel lets a racing driver measure speed in MPH over a 1-mile track using only the central stopwatch hand!',
      build(g) {
        torus(g, 0.72, 0.075, blackCeramic, [0, 0.16, 0], [Math.PI / 2, 0, 0]);
        torus(g, 0.64, 0.016, carPaint(0xef4444), [0, 0.15, 0], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          box(g, 0.04, 0.015, 0.012, rhodium, [Math.cos(a) * 0.72, 0.22, Math.sin(a) * 0.72], [0, -a, 0]);
        }
        cyl(g, 0.64, 0.64, 0.032, 36, glassMat(0xe0f2fe, 0.24), [0, 0.19, 0]);
      } },
    { id: 'lumed-hands-red-chrono-sweep', name: 'Super-LumiNova Baton Hands, Red Flyback Chrono Sweep & Sub-Hands', category: 'Indications & Hands', isOuter: false, explodeOffset: [0, 1.45, 0.65],
      desc: 'Diamond-cut 18k white-gold hour and minute hands filled with Super-LumiNova, central red chronograph seconds sweep hand, and 3 sub-register hands.',
      funFact: 'The central red chronograph hand starts, stops, and snaps back to 12 o’clock in under 1/100th of a second when the reset heart-cam is struck!',
      build(g) {
        const sweep = new THREE.Group();
        sweep.position.set(0, 0.135, 0);
        sweep.userData.driveAnim = 'fan';
        sweep.userData.spinAxis = 'y';
        g.add(sweep);
        cyl(sweep, 0.038, 0.038, 0.035, 16, brass, [0, 0, 0]);
        rbox(sweep, 0.36, 0.014, 0.038, 0.004, rhodium, [0.14, -0.008, 0.04], [0, -0.45, 0]);
        rbox(sweep, 0.50, 0.014, 0.028, 0.004, rhodium, [-0.12, 0, -0.16], [0, 0.85, 0]);
        rbox(sweep, 0.62, 0.012, 0.014, 0.003, carPaint(0xef4444), [0.16, 0.01, 0], [0, 0, 0]);
        for (const [sx, sz] of [[0, 0.30], [-0.30, 0], [0, -0.30]]) {
          cyl(g, 0.022, 0.022, 0.025, 12, brass, [sx, 0.128, sz]);
          box(g, 0.13, 0.01, 0.012, carPaint(0xef4444), [sx + 0.04, 0.132, sz], [0, 0.5, 0]);
        }
      } },
    { id: 'chronograph-dial-hands-case', name: 'Sunburst "Panda" Tri-Compax Dial, Guilloché Sub-Registers & Applied Indices', category: 'Dial Plate', isOuter: false, explodeOffset: [0, 1.05, -0.65],
      desc: 'Sunburst silver-white "Panda" dial plate with 3 recessed snailed black sub-registers (30-min counter, 12-hr counter, running seconds), minute track, and applied 18k gold baton hour markers.',
      funFact: 'High-contrast white dials with three black sub-dials were nicknamed "Panda dials" by 1960s racing drivers who needed instant legibility at 180 mph!',
      build(g) {
        cyl(g, 0.62, 0.62, 0.024, 40, rhodium, [0, 0.095, 0]);
        torus(g, 0.59, 0.012, blackCeramic, [0, 0.108, 0], [Math.PI / 2, 0, 0]);
        for (const [sx, sz] of [[0, 0.30], [-0.30, 0], [0, -0.30]]) {
          cyl(g, 0.16, 0.16, 0.028, 28, blackCeramic, [sx, 0.098, sz]);
          torus(g, 0.16, 0.008, brass, [sx, 0.112, sz], [Math.PI / 2, 0, 0]);
          torus(g, 0.10, 0.004, rhodium, [sx, 0.113, sz], [Math.PI / 2, 0, 0]);
        }
        for (let h = 0; h < 12; h++) {
          const a = (h / 12) * Math.PI * 2;
          rbox(g, 0.085, 0.018, 0.028, 0.004, brass, [Math.cos(a) * 0.51, 0.112, Math.sin(a) * 0.51], [0, -a, 0]);
        }
      } },
    { id: 'oyster-316l-case-strap', name: '904L Oyster Middle Case, Sculpted Lugs, Crown Guards & 3-Link Bracelet', category: 'Case & Strap', isOuter: true, explodeOffset: [-1.45, 0.35, 0],
      desc: 'CNC-machined 904L stainless-steel Oyster middle case, bevel-polished lugs, twin crown guards, and articulated 3-link Oyster bracelet with folding Oysterlock safety clasp.',
      funFact: 'The middle case is milled from a solid block of corrosion-proof 904L superalloy steel using 15 separate CNC operations!',
      build(g) {
        // Middle case barrel & satin-brushed outer caseband
        torus(g, 0.70, 0.092, steel, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.74, 0.72, 0.16, 40, steel, [0, 0.03, 0]);
        cyl(g, 0.61, 0.61, 0.17, 36, brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.28 }), [0, 0.035, 0]);
        // 4 Sculpted bevel-polished Oyster lugs (along +Z / -Z 12 o'clock & 6 o'clock)
        for (const sx of [-0.42, 0.42]) {
          for (const sz of [-0.78, 0.78]) {
            rbox(g, 0.16, 0.13, 0.34, 0.025, steel, [sx, 0.025, sz], [sz > 0 ? 0.14 : -0.14, sx * (sz > 0 ? -0.18 : 0.18), 0]);
          }
        }
        // Twin Crown Guards on +X side
        for (const z of [-0.14, 0.14]) {
          rbox(g, 0.16, 0.10, 0.08, 0.02, steel, [0.74, 0.04, z], [0, z * 0.4, 0]);
        }
        // Solid end-links & articulated 3-row Oyster Bracelet along +Z and -Z
        for (const dir of [-1, 1]) {
          for (let link = 0; link < 6; link++) {
            const lz = dir * (0.82 + link * 0.21);
            const ly = 0.02 - link * link * 0.018;
            const pitch = dir * link * 0.085;
            const w = 0.66 - link * 0.022;
            // Outer satin links + polished center link
            rbox(g, w * 0.31, 0.055, 0.18, 0.012, rhodium, [-w * 0.34, ly, lz], [pitch, 0, 0]);
            rbox(g, w * 0.32, 0.058, 0.18, 0.012, steel, [0, ly, lz], [pitch, 0, 0]);
            rbox(g, w * 0.31, 0.055, 0.18, 0.012, rhodium, [w * 0.34, ly, lz], [pitch, 0, 0]);
          }
        }
        // Folding Oysterlock deployant clasp bridge at the bottom of the bracelet arc
        rbox(g, 0.56, 0.048, 0.52, 0.014, steel, [0, -0.58, 0]);
      } },
    { id: 'mainspring-barrel-crown', name: 'Triplock Winding Crown, Stem, Keyless Works & Chrono Pump Pushers', category: 'Winding & Setting', isOuter: true, explodeOffset: [1.55, 0.25, 0],
      desc: 'Knurled screw-down Triplock winding crown with triple O-ring gaskets, square winding stem, sliding clutch pinion, setting lever jumper, and twin start/stop/reset chronograph pushers.',
      funFact: 'Pulling the crown out one click shifts a tiny sliding pinion gear from winding the mainspring to setting the hands!',
      build(g) {
        // Knurled Triplock winding crown at 3 o'clock (+X)
        cyl(g, 0.095, 0.095, 0.13, 24, brass, [0.86, 0.04, 0], [0, 0, Math.PI / 2]);
        for (let k = 0; k < 12; k++) {
          const ka = (k / 12) * Math.PI * 2;
          box(g, 0.12, 0.014, 0.014, steel, [0.86, 0.04 + Math.cos(ka) * 0.095, Math.sin(ka) * 0.095]);
        }
        // Square winding stem, sliding pinion & keyless works setting lever
        cyl(g, 0.024, 0.024, 0.52, 12, steel, [0.56, 0.04, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.055, 0.055, 0.06, 16, brass, [0.46, 0.04, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.22, 0.018, 0.06, 0.006, bluedSteel, [0.44, 0.055, 0.09], [0, 0.35, 0]);
        // Twin Start/Stop (2 o'clock) & Flyback Reset (4 o'clock) Pump Pushers
        for (const z of [-0.38, 0.38]) {
          cyl(g, 0.065, 0.065, 0.12, 20, steel, [0.79, 0.04, z], [0, z * 0.55, Math.PI / 2]);
          cyl(g, 0.038, 0.038, 0.18, 16, brass, [0.69, 0.04, z * 0.88], [0, z * 0.55, Math.PI / 2]);
        }
      } },
    { id: 'coiled-nivaflex-mainspring-barrel', name: 'Toothed Brass Mainspring Barrel, Coiled Nivaflex Ribbon & Ratchet Wheel', category: 'Energy Barrel', isOuter: false, explodeOffset: [-1.15, -0.15, 1.15],
      desc: 'Large toothed brass barrel drum housing a coiled 60-cm blue Nivaflex cobalt-alloy mainspring ribbon, central barrel arbor, steel ratchet wheel, and recoil click.',
      funFact: 'Inside a mechanical watch there is no battery at all—just a tightly coiled 24-inch superalloy ribbon unwinding smoothly over 72 hours!',
      build(g) {
        addToothedGear(g, [-0.22, 0.03, -0.18], 0.26, 0.055, 24, brass, steel, true);
        for (const r of [0.08, 0.12, 0.16, 0.20]) {
          torus(g, r, 0.011, bluedSteel, [-0.22, 0.04, -0.18], [Math.PI / 2, 0, 0]);
        }
        addToothedGear(g, [-0.22, 0.075, -0.18], 0.19, 0.022, 18, steel, ruby, true);
      } },
    { id: 'going-train-gear-wheels', name: '4-Wheel Brass Going Train, Pinions & Synthetic Ruby Jewel Bearings', category: 'Gear Train', isOuter: false, explodeOffset: [-1.15, 0.55, -1.15],
      desc: 'Spoked brass Center Wheel (1 rev/hr), Third Wheel, Fourth Wheel (1 rev/min), and Escape Pinion multiplying torque speed by 4,800× inside synthetic ruby bearings.',
      funFact: 'Watchmakers use real synthetic rubies as bearings because diamond-hard ruby against polished steel has almost zero friction for decades!',
      build(g) {
        addToothedGear(g, [0, 0.035, 0], 0.24, 0.026, 24, brass, ruby, true);
        addToothedGear(g, [0.22, 0.042, -0.16], 0.19, 0.024, 20, brass, ruby, true);
        addToothedGear(g, [0, 0.048, -0.30], 0.17, 0.024, 18, brass, ruby, true);
        addToothedGear(g, [-0.22, 0.038, 0.18], 0.16, 0.024, 16, brass, ruby, true);
        // Steel pinions & arbors linking the going train
        for (const [gx, gz] of [[0, 0], [0.22, -0.16], [0, -0.30], [-0.22, 0.18]]) {
          cyl(g, 0.032, 0.032, 0.08, 12, steel, [gx, 0.04, gz]);
          cyl(g, 0.018, 0.018, 0.095, 12, ruby, [gx, 0.04, gz]);
        }
      } },
    { id: 'column-wheel-chrono-clutch', name: '8-Pillar Blued-Steel Column Wheel, Horizontal Clutch & Reset Hammers', category: 'Chronograph Complication', isOuter: false, explodeOffset: [1.15, 0.55, 1.15],
      desc: 'Castellated 8-pillar blued-steel column wheel (roue à colonnes) coordinating the chronograph start/stop coupling yoke, intermediate driving wheel, and zero-reset heart hammers.',
      funFact: 'Machining a single tiny 8-pillar column wheel from hardened steel takes hours of micro-milling and is the hallmark of a true luxury chronograph!',
      build(g) {
        cyl(g, 0.095, 0.095, 0.035, 20, bluedSteel, [0.26, 0.05, -0.16]);
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          box(g, 0.022, 0.055, 0.022, bluedSteel, [0.26 + Math.cos(a) * 0.072, 0.08, -0.16 + Math.sin(a) * 0.072]);
        }
        rbox(g, 0.42, 0.018, 0.045, 0.006, steel, [0.12, 0.065, 0.04], [0, 0.48, 0]);
        rbox(g, 0.34, 0.018, 0.040, 0.006, steel, [-0.04, 0.072, 0.14], [0, -0.35, 0]);
      } },
    { id: 'rhodium-mainplate-cotes-de-geneve', name: 'Perlage Mainplate, Côtes de Genève Bridges, Ruby Chatons & Blued Screws', category: 'Mainplate & Bridges', isOuter: false, explodeOffset: [0.95, -0.45, -1.15],
      desc: 'Circular-grained brass mainplate and 4 rhodium-plated bridges decorated with Geneva stripes, bevelled anglage edges, pressed ruby jewel bearings, and thermally blued screws.',
      funFact: 'The parallel "Côtes de Genève" stripes on the bridges aren’t just beautiful—their microscopic grooves trap tiny dust particles before they reach the gears!',
      build(g) {
        cyl(g, 0.58, 0.58, 0.022, 36, brass, [0, -0.015, 0]);
        rbox(g, 0.44, 0.026, 0.28, 0.008, rhodium, [-0.18, 0.02, -0.14]);
        rbox(g, 0.36, 0.026, 0.22, 0.008, rhodium, [0.18, 0.02, -0.16]);
        rbox(g, 0.38, 0.026, 0.18, 0.008, rhodium, [0.20, 0.02, 0.16]);
        for (const [jx, jz] of [[0, 0], [-0.22, -0.18], [0.22, -0.16], [0.22, 0.14], [-0.22, 0.18], [0, -0.30]]) {
          cyl(g, 0.028, 0.028, 0.036, 14, ruby, [jx, 0.022, jz]);
          cyl(g, 0.016, 0.016, 0.038, 12, bluedSteel, [jx + 0.055, 0.022, jz + 0.035]);
        }
      } },
    { id: 'swiss-lever-escapement-balance-rotor', name: 'Swiss Lever Escapement, 4 Hz Balance Wheel, Hairspring & Tungsten Rotor', category: 'Escapement & Automatic Rotor', isOuter: true, explodeOffset: [0, -1.55, 0],
      desc: '28,800 vph (4 Hz) Glucydur balance wheel with gold timing weights, blue Parachrom Breguet hairspring, ruby pallet fork, club-tooth escape wheel, and guilloché tungsten automatic rotor.',
      funFact: 'The tiny balance wheel ticks 8 times every single second—691,200 beats per day—while the half-moon rotor winds the watch from your wrist motion!',
      build(g) {
        addSpinHub(g, [0.22, 0.04, 0.16], 4, 0.22, 0.024, brass, ruby, 'y');
        torus(g, 0.22, 0.020, brass, [0.22, 0.04, 0.16], [Math.PI / 2, 0, 0]);
        for (const r of [0.06, 0.09, 0.12]) {
          torus(g, r, 0.005, bluedSteel, [0.22, 0.065, 0.16], [Math.PI / 2, 0, 0]);
        }
        addToothedGear(g, [0.04, 0.035, 0.24], 0.11, 0.018, 15, steel, ruby, true);
        // Half-moon skeletonized tungsten automatic rotor + sapphire exhibition caseback ring
        const rotor = new THREE.Group();
        rotor.position.set(0, -0.075, 0);
        rotor.userData.driveAnim = 'fan';
        rotor.userData.spinAxis = 'y';
        g.add(rotor);
        cyl(rotor, 0.11, 0.11, 0.03, 20, steel, [0, 0, 0]);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.065, 12, 28, Math.PI), brass);
        arc.rotation.x = Math.PI / 2;
        rotor.add(arc);
        for (const a of [0.4, 1.57, 2.74]) {
          box(rotor, 0.44, 0.022, 0.045, rhodium, [Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], [0, -a, 0]);
        }
        cyl(g, 0.62, 0.62, 0.026, 36, glassMat(0xe0f2fe, 0.24), [0, -0.14, 0]);
      } },
  ];
  return {
    id: 'swiss-chronograph-watch', name: 'Swiss Automatic Mechanical Chronograph', brand: 'Haute Horlogerie Geneva', badge: '28,800 vph • Column Wheel • 10 Horological Layers',
    desc: 'High-complication self-winding mechanical chronograph exploding into 10 authentic horological layers: Cerachrom tachymeter bezel & sapphire crystal, lumed hands, Panda tri-compax dial, Oyster case, Triplock crown & pushers, coiled mainspring barrel, 4-wheel going train, 8-pillar column wheel, Côtes de Genève bridges, and Swiss lever escapement.',
    cameraPos: [2.8, 2.2, 2.8], parts,
    quiz: [
      { q: 'Which oscillating wheel and hairspring divide time into 8 exact beats per second (28,800 vph)?', correctId: 'swiss-lever-escapement-balance-rotor', distractors: ['mainspring-barrel-crown', 'oyster-316l-case-strap', 'chronograph-dial-hands-case'] },
      { q: 'Where is mechanical energy stored inside a battery-free automatic watch?', correctId: 'coiled-nivaflex-mainspring-barrel', distractors: ['going-train-gear-wheels', 'swiss-lever-escapement-balance-rotor', 'chronograph-dial-hands-case'] },
      { q: 'Why are synthetic rubies ("jewels") pressed into the movement bridges?', correctId: 'going-train-gear-wheels', distractors: ['oyster-316l-case-strap', 'mainspring-barrel-crown', 'chronograph-dial-hands-case'] },
      { q: 'Which 8-pillar blued-steel turret coordinates starting, stopping, and resetting the stopwatch hands crisply?', correctId: 'column-wheel-chrono-clutch', distractors: ['oyster-316l-case-strap', 'ceramic-tachymeter-bezel-sapphire', 'chronograph-dial-hands-case'] },
      { q: 'Which scratch-proof ceramic outer ring and sapphire crystal let drivers calculate speed over a measured mile?', correctId: 'ceramic-tachymeter-bezel-sapphire', distractors: ['coiled-nivaflex-mainspring-barrel', 'rhodium-mainplate-cotes-de-geneve', 'going-train-gear-wheels'] },
    ],
  };
}

function buildGrandfatherClockModel() {
  const brass = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.15 });
  const mahogany = mat(0x451a03, { roughness: 0.34, metalness: 0.08 });
  const burlWalnut = mat(0x78350f, { roughness: 0.38, metalness: 0.06 });
  const steel = chromeMat();
  const silverDial = brushedMetal(0xe2e8f0, { metalness: 0.85, roughness: 0.2 });

  // 10 Separate Cabinet & Horological Subsystems so the entire Grandfather Clock explodes apart into every mechanical & architectural piece!
  const parts = [
    { id: 'swan-neck-hood-bonnet-finials', name: 'Removable Swan-Neck Pediment Hood Bonnet, Columns & 3 Brass Finials', category: 'Upper Clock Hood', isOuter: true, explodeOffset: [0, 1.65, 0],
      desc: 'Slide-off Chippendale mahogany upper hood bonnet with turned Corinthian columns, brass capitals, acoustic side sound frets, carved swan-neck pediment scrolls, and 3 brass ball-and-spire finials.',
      funFact: 'The entire top hood of a grandfather clock slides forward off wooden rails so the clockmaker can oil the gears from all four sides!',
      build(g) {
        rbox(g, 0.84, 0.06, 0.52, 0.015, mahogany, [0, 0.38, 0]);
        rbox(g, 0.78, 0.56, 0.06, 0.02, mahogany, [0, 0.66, -0.22]);
        for (const s of [-1, 1]) {
          rbox(g, 0.06, 0.56, 0.44, 0.015, mahogany, [s * 0.36, 0.66, 0]);
          cyl(g, 0.032, 0.036, 0.52, 18, burlWalnut, [s * 0.37, 0.66, 0.22]);
          cyl(g, 0.042, 0.042, 0.04, 18, brass, [s * 0.37, 0.92, 0.22]);
          cyl(g, 0.042, 0.042, 0.04, 18, brass, [s * 0.37, 0.41, 0.22]);
        }
        rbox(g, 0.86, 0.10, 0.52, 0.02, mahogany, [0, 0.96, 0]);
        cyl(g, 0.26, 0.26, 0.46, 24, mahogany, [0, 0.96, -0.02], [Math.PI / 2, 0, 0]);
        for (const [fx, fy] of [[-0.36, 1.06], [0, 1.24], [0.36, 1.06]]) {
          cyl(g, 0.018, 0.028, 0.06, 14, brass, [fx, fy, 0.18]);
          sphere(g, 0.032, 16, 14, brass, [fx, fy + 0.05, 0.18]);
          cone(g, 0.014, 0.09, 12, brass, [fx, fy + 0.12, 0.18]);
        }
      } },
    { id: 'moon-phase-dial-mahogany-case', name: 'Arched Brass Dial, Silvered Roman Chapter Ring, Spandrels & Serpentine Hands', category: 'Dial & Hands', isOuter: true, explodeOffset: [0, 0.75, 1.55],
      desc: 'Engraved solid-brass break-arch dial plate with 4 cast gilded cherub-head corner spandrels, silvered Roman numeral chapter ring, subsidiary seconds dial, and blued-steel serpentine hands.',
      funFact: 'Before house lighting existed, the contrast of black-waxed Roman numerals etched into a silvered ring let people read the time by candlelight!',
      build(g) {
        rbox(g, 0.48, 0.48, 0.024, 0.01, brass, [0, 0.62, 0.18]);
        // 4 Ornate cast-brass corner spandrels + silvered chapter ring + subsidiary seconds ring
        for (const [sx, sy] of [[-0.17, 0.45], [0.17, 0.45], [-0.17, 0.79], [0.17, 0.79]]) {
          torus(g, 0.042, 0.012, brass, [sx, sy, 0.195]);
        }
        torus(g, 0.175, 0.032, silverDial, [0, 0.62, 0.196]);
        torus(g, 0.052, 0.008, silverDial, [0, 0.70, 0.198]);
        for (let h = 0; h < 12; h++) {
          const a = (h / 12) * Math.PI * 2;
          box(g, 0.028, 0.008, 0.008, mat(0x0f172a), [Math.cos(a) * 0.175, 0.62 + Math.sin(a) * 0.175, 0.205], [0, 0, a]);
        }
        box(g, 0.018, 0.13, 0.01, mat(0x0f172a), [0, 0.67, 0.208], [0, 0, -0.35]);
        box(g, 0.013, 0.175, 0.01, mat(0x0f172a), [0.05, 0.64, 0.212], [0, 0, -1.25]);
      } },
    { id: 'rolling-moon-phase-calendar-disc', name: 'Hand-Painted Rotating Moon-Phase Hemisphere Disc & 29½-Day Lunar Gear', category: 'Astronomical Complication', isOuter: false, explodeOffset: [0.85, 1.15, 1.15],
      desc: '59-tooth brass lunar disc painted with two golden moon faces and starry skies that advances one tooth every 12 hours to track the 29.5-day synodic lunar cycle.',
      funFact: 'Eighteenth-century farmers and travellers relied on the clock’s moon-phase dial to know which nights would have bright full-moon light for night travel!',
      build(g) {
        cyl(g, 0.17, 0.17, 0.022, 28, brass, [0, 0.84, 0.16], [Math.PI / 2, 0, 0]);
        cyl(g, 0.14, 0.14, 0.026, 28, carPaint(0x1e3a8a), [0, 0.84, 0.165], [Math.PI / 2, 0, 0]);
        sphere(g, 0.048, 16, 12, brass, [-0.045, 0.85, 0.175]);
        sphere(g, 0.048, 16, 12, brass, [0.045, 0.83, 0.175]);
      } },
    { id: 'going-striking-gear-train', name: 'Twin Solid-Brass Movement Plates, 10 Spoked Gears & Rack-and-Snail Strike', category: 'Movement & Gear Train', isOuter: false, explodeOffset: [-0.95, 0.65, 0.95],
      desc: 'Two heavy brushed-brass movement plates joined by 4 turned pillars, housing the timekeeping going train, quarter-chime train, and hour-counting rack-and-snail striking gears.',
      funFact: 'A stepped 12-notch "snail cam" tells the hammer mechanism whether to strike 1 o’clock or 12 o’clock without ever losing count!',
      build(g) {
        populateGearboxCad(g, { pos: [0, 0.62, 0], scale: 0.007 });
        for (const z of [-0.09, 0.09]) box(g, 0.48, 0.44, 0.018, brass, [0, 0.62, z]);
        for (const [px, py] of [[-0.20, 0.44], [0.20, 0.44], [-0.20, 0.80], [0.20, 0.80]]) {
          cyl(g, 0.014, 0.014, 0.20, 12, brass, [px, py, 0], [Math.PI / 2, 0, 0]);
        }
        for (const [gx, gy, r] of [[-0.14, 0.52, 0.095], [0, 0.52, 0.095], [0.14, 0.52, 0.095], [-0.12, 0.68, 0.08], [0.12, 0.68, 0.08]]) {
          torus(g, r, 0.012, brass, [gx, gy, 0.02]);
          cyl(g, 0.02, 0.02, 0.18, 12, steel, [gx, gy, 0], [Math.PI / 2, 0, 0]);
        }
      } },
    { id: 'deadbeat-anchor-escapement-crutch', name: 'Deadbeat Anchor Escapement Wheel, Steel Pallets, Crutch Fork & Suspension Spring', category: 'Escapement Mechanism', isOuter: false, explodeOffset: [1.15, 0.55, 0.35],
      desc: 'Graham deadbeat anchor escapement wheel with 30 pointed brass teeth, hardened steel entry/exit pallets, brass crutch fork, and thin steel pendulum suspension spring.',
      funFact: 'George Graham invented the "deadbeat" anchor escapement in 1715 so the seconds hand locks dead-still between ticks instead of recoiling backward!',
      build(g) {
        addSpinHub(g, [0, 0.68, 0.05], 8, 0.12, 0.018, brass, steel, 'z');
        torus(g, 0.11, 0.01, brass, [0, 0.68, 0.05]);
        // Anchor pallet arch above escape wheel + vertical crutch fork down to pendulum rod
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 10, 20, Math.PI * 0.85), steel);
        arch.position.set(0, 0.72, 0.05);
        g.add(arch);
        cyl(g, 0.008, 0.008, 0.32, 10, brass, [0, 0.58, 0.06]);
      } },
    { id: 'westminster-chime-tubes-hammers', name: '9 Tuned Nickel-Brass Westminster Chime Tubes, Pinned Drum & Hammers', category: 'Acoustic Chime Array', isOuter: false, explodeOffset: [0, 0.25, -1.55],
      desc: 'Nine graduated acoustic nickel-plated brass resonator tubes suspended from a cast soundboard rack, struck by 9 leather-faced brass hammers lifted by a pinned chime cylinder.',
      funFact: 'Every 15 minutes, the pinned brass drum plays the famous 4-note melody of Big Ben’s Westminster Quarters on the tuned tubes!',
      build(g) {
        rbox(g, 0.56, 0.038, 0.07, 0.008, brass, [0, 0.56, -0.14]);
        cyl(g, 0.036, 0.036, 0.28, 18, brass, [0.12, 0.58, -0.06], [0, 0, Math.PI / 2]);
        for (let i = -4; i <= 4; i++) {
          const len = 1.02 + i * 0.045;
          cyl(g, 0.015, 0.015, len, 14, steel, [i * 0.058, 0.54 - len * 0.5, -0.14]);
          rbox(g, 0.022, 0.024, 0.045, 0.005, brass, [i * 0.058, 0.49, -0.095]);
        }
      } },
    { id: 'cable-driven-brass-weights', name: 'Triple Brass-Sheathed Cast-Iron Driving Weights & Compounded Pulleys', category: 'Gravity Power', isOuter: false, explodeOffset: [-1.45, -0.15, 0],
      desc: 'Three heavy cast-iron weights inside polished brass cylinders (left: hour strike, center: time, right: Westminster chimes) hanging from braided steel cables and brass pulleys.',
      funFact: 'Grandfather clocks are powered by pure gravity—cranking the three weights up stores potential energy that drives all 10 gears and 9 chimes for 8 days!',
      build(g) {
        for (const [x, yOff] of [[-0.19, -0.14], [0, -0.24], [0.19, -0.08]]) {
          cyl(g, 0.068, 0.068, 0.38, 24, brass, [x, yOff, -0.02]);
          torus(g, 0.069, 0.006, steel, [x, yOff + 0.16, -0.02], [Math.PI / 2, 0, 0]);
          torus(g, 0.069, 0.006, steel, [x, yOff - 0.16, -0.02], [Math.PI / 2, 0, 0]);
          cyl(g, 0.030, 0.030, 0.020, 16, brass, [x, yOff + 0.22, -0.02], [Math.PI / 2, 0, 0]);
          cyl(g, 0.005, 0.005, 0.68, 8, steel, [x, yOff + 0.54, -0.02]);
        }
      } },
    { id: 'deadbeat-escapement-pendulum', name: '9-Rod Gridiron Lyre Pendulum, 220mm Brass Lenticular Bob & Beat Scale', category: 'Regulating Pendulum', isOuter: false, explodeOffset: [1.45, -0.25, 0],
      desc: '99.4-cm temperature-compensated 9-rod alternating brass-and-steel lyre gridiron pendulum with a 22-cm mirror-polished brass lenticular bob, rating nut, and silvered beat scale.',
      funFact: 'Metal expands when a room gets warm, which would make a normal pendulum swing slower—so alternating brass and steel rods cancel out thermal expansion automatically!',
      build(g) {
        for (let i = -4; i <= 4; i++) {
          cyl(g, 0.0055, 0.0055, 1.24, 10, i % 2 === 0 ? brass : steel, [i * 0.011, 0.0, 0.04]);
        }
        rbox(g, 0.12, 0.022, 0.02, 0.005, brass, [0, 0.38, 0.04]);
        rbox(g, 0.12, 0.022, 0.02, 0.005, brass, [0, -0.32, 0.04]);
        cyl(g, 0.21, 0.21, 0.048, 32, brass, [0, -0.64, 0.04], [Math.PI / 2, 0, 0]);
        sphere(g, 0.095, 20, 16, brass, [0, -0.64, 0.055]);
        cone(g, 0.018, 0.08, 12, brass, [0, -0.89, 0.04], [Math.PI, 0, 0]);
      } },
    { id: 'waisted-mahogany-trunk-glass-door', name: 'Waisted Mahogany Trunk Cabinet, Fluted Quarter Columns & Beveled Glass Door', category: 'Trunk Cabinet & Door', isOuter: true, explodeOffset: [0, -0.15, 1.45],
      desc: 'Tall mahogany trunk enclosure with acoustic backboard, quarter-fluted burl-walnut Corinthian pilasters, solid brass hinges, lockable keyhole escutcheon, and beveled crystal pendulum door.',
      funFact: 'The tall wooden trunk was invented in London in 1670 to shield the 1-meter pendulum and hanging weights from drafts, pets, and household dust!',
      build(g) {
        rbox(g, 0.70, 1.02, 0.05, 0.015, mahogany, [0, -0.14, -0.21]);
        for (const s of [-1, 1]) {
          rbox(g, 0.09, 1.02, 0.42, 0.015, mahogany, [s * 0.31, -0.14, -0.02]);
          cyl(g, 0.026, 0.026, 0.94, 16, burlWalnut, [s * 0.34, -0.14, 0.19]);
          cyl(g, 0.034, 0.034, 0.04, 16, brass, [s * 0.34, 0.34, 0.19]);
          cyl(g, 0.034, 0.034, 0.04, 16, brass, [s * 0.34, -0.62, 0.19]);
        }
        rbox(g, 0.50, 0.92, 0.022, 0.01, glassMat(0xe0f2fe, 0.24), [0, -0.14, 0.19]);
        rbox(g, 0.025, 0.06, 0.015, 0.005, brass, [0.24, -0.14, 0.205]);
      } },
    { id: 'carved-base-plinth-bracket-feet', name: 'Carved Mahogany Base Pedestal, Burl-Walnut Panel & Brass Ogee Feet', category: 'Base Pedestal', isOuter: true, explodeOffset: [0, -1.55, 0],
      desc: 'Heavy lower mahogany pedestal base with book-matched burl-walnut raised panel, stepped plinth molding, and 4 cast-brass leveling bracket feet keeping the clock plumb.',
      funFact: 'If a grandfather clock leans even 1 degree out of plumb, the anchor escapement goes "out of beat" (tick...tock-tick) and stops—so the base has micro-leveling feet!',
      build(g) {
        rbox(g, 0.90, 0.08, 0.56, 0.02, mahogany, [0, -1.08, 0]);
        rbox(g, 0.82, 0.42, 0.48, 0.025, mahogany, [0, -0.85, 0]);
        rbox(g, 0.62, 0.28, 0.03, 0.01, burlWalnut, [0, -0.85, 0.235]);
        for (const [fx, fz] of [[-0.40, -0.24], [0.40, -0.24], [-0.40, 0.24], [0.40, 0.24]]) {
          rbox(g, 0.10, 0.06, 0.10, 0.015, brass, [fx, -1.14, fz]);
        }
      } },
  ];
  return {
    id: 'grandfather-pendulum-clock', name: 'Longcase Westminster Pendulum Clock', brand: 'Classical Horology', badge: '1.000 Hz Pendulum • Gravity Driven • 10 Subsystems',
    desc: 'Heirloom mechanical longcase clock exploding into 10 horological and cabinet assemblies: removable swan-neck hood, arched brass dial, rotating moon-phase disc, twin brass movement plates & 10 gears, deadbeat anchor escapement, 9 Westminster chime tubes, 3 cable-driven brass weights, 9-rod gridiron lyre pendulum, beveled glass trunk, and burl-walnut base plinth.',
    cameraPos: [3.2, 1.8, 3.4], parts,
    quiz: [
      { q: 'What powers the gears of a traditional grandfather clock for 8 days without electricity?', correctId: 'cable-driven-brass-weights', distractors: ['deadbeat-escapement-pendulum', 'westminster-chime-tubes-hammers', 'moon-phase-dial-mahogany-case'] },
      { q: 'How long does it take a ~1-meter grandfather clock pendulum to swing from one side to the other?', correctId: 'deadbeat-escapement-pendulum', distractors: ['going-striking-gear-train', 'cable-driven-brass-weights', 'westminster-chime-tubes-hammers'] },
      { q: 'Which mechanism counts out the exact number of strikes at the top of each hour?', correctId: 'going-striking-gear-train', distractors: ['moon-phase-dial-mahogany-case', 'deadbeat-escapement-pendulum', 'cable-driven-brass-weights'] },
      { q: 'Which 9 tuned nickel-brass tubes and felt hammers play the famous four-note Westminster melody every 15 minutes?', correctId: 'westminster-chime-tubes-hammers', distractors: ['carved-base-plinth-bracket-feet', 'swan-neck-hood-bonnet-finials', 'waisted-mahogany-trunk-glass-door'] },
      { q: 'Which hand-painted rotating dial disc advances one tooth per day to track the 29½-day lunar cycle?', correctId: 'rolling-moon-phase-calendar-disc', distractors: ['cable-driven-brass-weights', 'carved-base-plinth-bracket-feet', 'waisted-mahogany-trunk-glass-door'] },
    ],
  };
}

function buildTernGsdModel() {
  const ternYellow = carPaint(0xf59e0b, { roughness: 0.18, metalness: 0.35, clearcoat: 1.0 });
  const matteBlack = mat(0x111827, { roughness: 0.55, metalness: 0.25 });
  const anodizedBlack = brushedMetal(0x1e293b, { roughness: 0.28, metalness: 0.82 });
  const alu = brushedMetal(0xd8dee9, { roughness: 0.22, metalness: 0.88 });
  const tireMat = mat(0x0f172a, { roughness: 0.85, metalness: 0.05 });
  const pannierCloth = mat(0x1f2937, { roughness: 0.78, metalness: 0.08 });
  const maguraYellow = carPaint(0xfacc15);

  const parts = [
    {
      id: 'updeck-lowstep-cargo-frame',
      name: 'Hydroformed 6061-AL UpDeck Low-Step Truss Frame & Integrated Longtail Atlas Rack',
      category: 'Cargo Frame & Chassis',
      isOuter: true,
      explodeOffset: [0, 0.85, 0],
      desc: 'Patented Tern GSD hydroformed aluminum spaceframe truss with an ultra-low 49 cm step-through height, welded rear longtail Atlas cargo deck (rated for 100 kg), rear vertical-parking feet, and frame-mounted Front Transporteur Rack.',
      funFact: 'Even though the Tern GSD can carry 200 kg (440 lbs)—including two kids or a full-grown adult passenger—it is the exact same length (180 cm) as a regular city bicycle and stands vertically on its tail to fit inside small apartment elevators!',
      build(g) {
        // Head tube at front (x=0.72, y=0.14)
        cyl(g, 0.036, 0.038, 0.28, 20, ternYellow, [0.72, 0.14, 0], [0, 0, -0.22]);
        // Low-step upper hydroformed downtube from headtube to low step-over cradle
        cyl(g, 0.032, 0.036, 0.64, 18, ternYellow, [0.46, -0.04, 0], [0, 0, 0.86]);
        // Lower heavy-duty spine tube from lower headtube to bottom bracket
        cyl(g, 0.036, 0.04, 0.82, 18, ternYellow, [0.39, -0.15, 0], [0, 0, 0.96]);
        // Internal UpDeck truss web gussets between upper and lower tubes
        for (const [gx, gy, ang] of [[0.54, -0.02, -0.55], [0.38, -0.11, 0.45], [0.24, -0.2, -0.5]]) {
          cyl(g, 0.016, 0.016, 0.16, 12, ternYellow, [gx, gy, 0], [0, 0, ang]);
        }
        // Step-through horizontal cradle bridge into bottom bracket
        rbox(g, 0.34, 0.075, 0.085, 0.022, ternYellow, [0.14, -0.28, 0], [0, 0, 0.22]);
        // Seat tube rising from bottom bracket (0.04, -0.34) to (-0.09, 0.26)
        cyl(g, 0.032, 0.036, 0.64, 18, ternYellow, [-0.02, -0.04, 0], [0, 0, 0.21]);
        // 2-stage telescopic Easy-Step seatpost + ergonomic saddle with rear lift handle
        cyl(g, 0.024, 0.027, 0.28, 16, anodizedBlack, [-0.08, 0.34, 0], [0, 0, 0.21]);
        rbox(g, 0.28, 0.055, 0.19, 0.022, matteBlack, [-0.13, 0.49, 0], [0, 0, 0.05]);
        torus(g, 0.045, 0.01, anodizedBlack, [-0.25, 0.47, 0], [Math.PI / 2, 0, 0]);

        // Integrated Longtail Rear Atlas Cargo Deck (welded frame truss from x=-0.06 to -1.26 at y=0.09)
        for (const z of [-0.11, 0.11]) {
          // Upper deck rails
          cyl(g, 0.02, 0.02, 1.22, 14, ternYellow, [-0.66, 0.09, z], [0, 0, Math.PI / 2]);
          // Lower chainstays from BB (0.04, -0.34) to rear axle (-0.92, -0.36) and rear vertical-stand bumper (-1.26, -0.24)
          cyl(g, 0.022, 0.024, 0.98, 14, ternYellow, [-0.44, -0.35, z * 0.95], [0, 0, 1.55]);
          cyl(g, 0.018, 0.02, 0.38, 12, ternYellow, [-1.09, -0.3, z], [0, 0, 1.24]);
          // Triangulated diagonal truss stays supporting the 100-kg rear cargo deck
          cyl(g, 0.018, 0.018, 0.56, 12, ternYellow, [-0.32, -0.12, z], [0, 0, -0.78]);
          cyl(g, 0.018, 0.018, 0.52, 12, ternYellow, [-0.72, -0.13, z], [0, 0, 0.62]);
          cyl(g, 0.018, 0.018, 0.48, 12, ternYellow, [-1.08, -0.09, z], [0, 0, -0.68]);
          // Vertical parking feet at x=-1.27 (allows standing bike upright on its tail)
          cyl(g, 0.022, 0.022, 0.06, 12, matteBlack, [-1.27, 0.09, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.022, 0.022, 0.06, 12, matteBlack, [-1.27, -0.24, z], [0, 0, Math.PI / 2]);
        }
        // Crossbars on the rear Atlas cargo deck
        for (const x of [-0.12, -0.36, -0.62, -0.88, -1.12, -1.25]) {
          cyl(g, 0.016, 0.016, 0.24, 12, ternYellow, [x, 0.09, 0], [Math.PI / 2, 0, 0]);
        }

        // Frame-mounted Front Transporteur Rack bolted to Head Tube Combo Mount
        rbox(g, 0.14, 0.08, 0.09, 0.015, anodizedBlack, [0.79, 0.12, 0]);
        rbox(g, 0.32, 0.03, 0.34, 0.01, anodizedBlack, [0.96, 0.08, 0]);
        for (const z of [-0.15, 0.15]) {
          cyl(g, 0.012, 0.012, 0.3, 10, anodizedBlack, [0.96, 0.18, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.012, 0.012, 0.12, 10, anodizedBlack, [1.1, 0.13, z]);
          cyl(g, 0.012, 0.012, 0.12, 10, anodizedBlack, [0.83, 0.13, z]);
        }
        // Integrated Tern Valo Direct 190-lumen front LED headlight & Rear Brake Light
        cyl(g, 0.028, 0.028, 0.055, 16, anodizedBlack, [1.13, 0.09, 0], [0, 0, Math.PI / 2]);
        sphere(g, 0.024, 14, 14, emissiveMat(0xf8fafc, 2.4), [1.15, 0.09, 0]);
        rbox(g, 0.025, 0.04, 0.12, 0.008, emissiveMat(0xef4444, 2.2), [-1.27, 0.05, 0]);
      },
    },
    {
      id: 'twenty-inch-moto-x-wheels',
      name: '20-Inch Tern Atlas Cargo Wheels, Schwalbe Super Moto-X Tires & Full Mudguards',
      category: 'Wheels & Tires',
      isOuter: true,
      explodeOffset: [0, -1.25, 0],
      desc: 'Compact, ultra-strong 20-inch double-wall Tern Atlas wheels with 36 custom-forged stainless spokes, puncture-protected Schwalbe Super Moto-X 20×2.40" balloon tires, and SKS Chromoplastic full wraparound fenders.',
      funFact: 'Small 20-inch wheels are inherently stronger against heavy side-loads than full-size 26" or 29" wheels, while keeping the center of gravity of heavy cargo super low to the ground!',
      build(g) {
        for (const [wx, isRear] of [[0.90, false], [-0.92, true]]) {
          const w = new THREE.Group();
          w.position.set(wx, -0.36, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          // Beefy 20x2.4" Schwalbe Super Moto-X balloon tire (outer radius ~0.335m)
          torus(w, 0.268, 0.066, tireMat, [0, 0, 0], [0, 0, 0]);
          // Reflective safety sidewall stripe on Schwalbe tire
          torus(w, 0.255, 0.006, emissiveMat(0xe2e8f0, 0.6), [0, 0, 0.058], [0, 0, 0]);
          torus(w, 0.255, 0.006, emissiveMat(0xe2e8f0, 0.6), [0, 0, -0.058], [0, 0, 0]);
          // Double-wall black anodized 20" Tern Atlas rim
          torus(w, 0.212, 0.02, anodizedBlack, [0, 0, 0], [0, 0, 0]);
          // Heavy-duty thru-axle hub
          cyl(w, 0.042, 0.042, 0.13, 20, isRear ? anodizedBlack : alu, [0, 0, 0], [Math.PI / 2, 0, 0]);
          // 18 paired heavy-gauge spokes
          for (let i = 0; i < 18; i++) {
            const ang = (i / 18) * Math.PI * 2;
            const zOff = (i % 2 === 0 ? 1 : -1) * 0.028;
            cyl(w, 0.0038, 0.0038, 0.4, 8, alu, [Math.cos(ang) * 0.11, Math.sin(ang) * 0.11, zOff], [0, 0, ang + Math.PI / 2]);
          }
          // Full wraparound SKS Chromoplastic matte-black fender + mudflap
          const fenderArc = new THREE.Mesh(
            new THREE.TorusGeometry(0.352, 0.042, 12, 28, isRear ? Math.PI * 1.15 : Math.PI * 0.95),
            matteBlack
          );
          fenderArc.position.set(wx, -0.36, 0);
          fenderArc.rotation.z = isRear ? -0.15 : 0.22;
          g.add(fenderArc);
        }
      },
    },
    {
      id: 'bosch-cargo-line-mid-drive',
      name: 'Bosch Cargo Line 85Nm Smart Mid-Drive Motor & Gates CDX Carbon Belt Drive',
      category: 'Electric Powertrain',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.35],
      desc: 'Mid-mounted Bosch Cargo Line electric motor delivering 85 Nm of torque and up to 400% pedal assist, driving the rear wheel through a grease-free Gates Carbon Drive CDX synchronous belt and heavy-duty internal gear hub.',
      funFact: 'The Bosch Cargo Line motor measures your pedal torque, cadence, and bike speed 1,000 times per second—giving you up to 4× your own leg strength even when starting from a dead stop on a steep hill with two kids on the back!',
      build(g) {
        // Bosch Cargo Line motor housing at bottom bracket (x=0.05, y=-0.34, z=0)
        rbox(g, 0.24, 0.17, 0.15, 0.045, anodizedBlack, [0.05, -0.34, 0], [0, 0, -0.18]);
        cyl(g, 0.078, 0.078, 0.16, 22, matteBlack, [0.04, -0.34, 0], [Math.PI / 2, 0, 0]);
        // Bosch silver cooling fins & red/silver motor badge
        cyl(g, 0.052, 0.052, 0.168, 20, alu, [0.04, -0.34, 0], [Math.PI / 2, 0, 0]);
        // Crankarms + platform pedals
        rbox(g, 0.18, 0.028, 0.018, 0.006, anodizedBlack, [0.11, -0.34, 0.1], [0, 0, -0.35]);
        rbox(g, 0.18, 0.028, 0.018, 0.006, anodizedBlack, [-0.03, -0.34, -0.1], [0, 0, -0.35]);
        rbox(g, 0.09, 0.02, 0.08, 0.005, matteBlack, [0.18, -0.39, 0.15]);
        rbox(g, 0.09, 0.02, 0.08, 0.005, matteBlack, [-0.1, -0.29, -0.15]);
        // Gates CDX front belt sprocket & rear hub sprocket (z = 0.082)
        torus(g, 0.092, 0.012, alu, [0.04, -0.34, 0.082], [0, 0, 0]);
        torus(g, 0.068, 0.012, alu, [-0.92, -0.36, 0.082], [0, 0, 0]);
        // Upper and lower Gates Carbon Drive belt runs + protective Chainblade cover
        box(g, 0.96, 0.012, 0.016, matteBlack, [-0.44, -0.26, 0.082], [0, 0, 0.025]);
        box(g, 0.96, 0.012, 0.016, matteBlack, [-0.44, -0.43, 0.082], [0, 0, -0.015]);
        rbox(g, 1.04, 0.12, 0.035, 0.02, matteBlack, [-0.42, -0.31, 0.096], [0, 0, 0.02]);
      },
    },
    {
      id: 'bosch-dual-battery-1000wh',
      name: 'Bosch DualBattery 1,000 Wh Frame-Mounted Lithium-Ion Packs & Smart BMS',
      category: 'Battery & Range',
      isOuter: false,
      explodeOffset: [-0.65, 0.45, -1.35],
      desc: 'Dual Bosch PowerPack 500 Wh batteries (1,000 Wh combined capacity) tucked securely into the space between the seat tube and rear 20" wheel, alternating discharge automatically for up to 206 km (128 mi) of range.',
      funFact: 'Bosch’s DualBattery computer switches back and forth between the two batteries in tiny increments as you ride so both packs age evenly and never overheat!',
      build(g) {
        // Pack 1 tucked directly behind the seat tube
        rbox(g, 0.11, 0.34, 0.1, 0.022, matteBlack, [-0.14, -0.11, 0], [0, 0, 0.21]);
        rbox(g, 0.115, 0.06, 0.104, 0.01, ternYellow, [-0.11, 0.02, 0], [0, 0, 0.21]);
        // Pack 2 mounted right behind Pack 1 in the dual-battery cradle
        rbox(g, 0.11, 0.34, 0.1, 0.022, matteBlack, [-0.27, -0.14, 0], [0, 0, 0.21]);
        rbox(g, 0.115, 0.06, 0.104, 0.01, anodizedBlack, [-0.24, -0.01, 0], [0, 0, 0.21]);
        // 5 LED charge-level indicators on both packs
        for (let i = 0; i < 5; i++) {
          sphere(g, 0.008, 10, 10, emissiveMat(0x22c55e, 1.8), [-0.12, -0.05 + i * 0.022, 0.055]);
          sphere(g, 0.008, 10, 10, emissiveMat(0x22c55e, 1.8), [-0.25, -0.08 + i * 0.022, 0.055]);
        }
        // High-current orange/black harness down to Bosch motor
        buildWiringHarness(g, [[-0.27, -0.28, 0.04], [-0.14, -0.31, 0.05], [0.02, -0.34, 0.04]], { radius: 0.01, color: 0xf97316 });
      },
    },
    {
      id: 'physis-3d-folding-cockpit',
      name: 'Tern Physis 3D Folding Handlepost, Andros Twin-Stem & Bosch Kiox Cockpit',
      category: 'Folding Cockpit & Controls',
      isOuter: true,
      explodeOffset: [1.15, 1.05, 0],
      desc: '3D-forged single-piece aluminum Physis 3D folding handlepost with patented OCL+ locking hinge, tool-free Andros adjustable twin-stem, swept riser handlebars, Ergon grips, and Bosch Kiox color display.',
      funFact: 'The Physis 3D handlepost folds flat in 5 seconds so the bike fits inside a minivan or SUV, and the tool-free Andros stem adjusts in seconds to fit riders from 4\'11" (150 cm) to 6\'5" (195 cm)!',
      build(g) {
        // OCL+ heavy-duty folding hinge clamp right above headtube (0.68, 0.28)
        cyl(g, 0.042, 0.042, 0.08, 20, anodizedBlack, [0.68, 0.29, 0], [0, 0, -0.2]);
        rbox(g, 0.06, 0.05, 0.095, 0.012, ternYellow, [0.69, 0.29, 0.02], [0, 0, -0.2]);
        // Tall tapered 3D-forged vertical Physis handlepost rising to y=0.72
        cyl(g, 0.026, 0.034, 0.46, 18, anodizedBlack, [0.61, 0.51, 0], [0, 0, -0.18]);
        // Tern Andros adjustable twin-stem extending forward/up to handlebar
        for (const z of [-0.032, 0.032]) {
          rbox(g, 0.14, 0.032, 0.018, 0.008, alu, [0.62, 0.75, z], [0, 0, 0.35]);
        }
        // Swept-back comfort handlebar + Ergon wing grips
        cyl(g, 0.014, 0.014, 0.64, 14, anodizedBlack, [0.66, 0.78, 0], [Math.PI / 2, 0, 0]);
        for (const z of [-0.3, 0.3]) {
          cyl(g, 0.02, 0.018, 0.13, 14, matteBlack, [0.63, 0.78, z], [Math.PI / 2, 0.22 * Math.sign(z), 0]);
          // Magura brake levers
          rbox(g, 0.08, 0.016, 0.02, 0.005, anodizedBlack, [0.69, 0.77, z * 0.78], [0, -0.25 * Math.sign(z), 0]);
        }
        // Center Bosch Kiox 300 color cockpit display
        rbox(g, 0.055, 0.075, 0.048, 0.008, screenMat('dashboard'), [0.68, 0.82, 0], [0, 0, -0.45]);
      },
    },
    {
      id: 'suntour-cargo-suspension-fork',
      name: 'SR Suntour Custom 20" Cargo Coil Suspension Fork & Thru-Axle Crown',
      category: 'Front Suspension',
      isOuter: false,
      explodeOffset: [1.35, -0.25, 0],
      desc: 'Custom-tuned SR Suntour XCM32-Cargo 20-inch suspension fork with 70 mm travel, forged aluminum crown, 32 mm steel stanchions, and 15 mm thru-axle lowers rated for 200 kg gross vehicle weight.',
      funFact: 'Standard bicycle suspension forks flex under heavy cargo braking—so Tern and SR Suntour engineered a custom 20-inch motorcycle-grade fork crown and 32 mm stanchions specifically for the GSD!',
      build(g) {
        // Forged fork crown at (0.76, -0.02)
        rbox(g, 0.085, 0.045, 0.19, 0.015, anodizedBlack, [0.76, -0.01, 0], [0, 0, -0.22]);
        // Fork steerer + upper stanchions + lower magnesium sliders down to front axle (0.90, -0.36)
        for (const z of [-0.075, 0.075]) {
          cyl(g, 0.017, 0.017, 0.18, 14, chromeMat(), [0.8, -0.1, z], [0, 0, -0.38]);
          cyl(g, 0.023, 0.021, 0.24, 16, matteBlack, [0.86, -0.26, z], [0, 0, -0.38]);
        }
        // Lower fork arch brace over the 20" front tire
        torus(g, 0.082, 0.015, matteBlack, [0.83, -0.16, 0], [0, Math.PI / 2, -0.38]);
      },
    },
    {
      id: 'clubhouse-plus-passenger-cage',
      name: 'Tern Clubhouse+ Passenger Safety Bars, Dual Seat Pads & Sidekick Wide Decks',
      category: 'Passenger & Kid System',
      isOuter: true,
      explodeOffset: [-1.25, 0.95, 0],
      desc: 'Modular aluminum Clubhouse+ wraparound safety rail system ("Kid Cage") supporting two Thule Yepp child seats or two padded Clubhouse seat cushions with backrest, paired with lower Sidekick Wide Decks footrests.',
      funFact: 'In 30 seconds without tools, the Clubhouse+ rails convert from carrying two kids to holding four standard 600×400 mm Eurocrates of groceries or deliveries!',
      build(g) {
        // Upper Clubhouse+ safety rail loop around rear deck (x = -0.30 to -1.24, y = 0.34, z = ±0.22)
        for (const z of [-0.22, 0.22]) {
          cyl(g, 0.015, 0.015, 0.94, 12, anodizedBlack, [-0.77, 0.34, z], [0, 0, Math.PI / 2]);
          // Vertical posts down to rear Atlas deck (y = 0.09 to 0.34)
          cyl(g, 0.015, 0.015, 0.26, 12, anodizedBlack, [-0.36, 0.21, z]);
          cyl(g, 0.015, 0.015, 0.26, 12, anodizedBlack, [-1.16, 0.21, z]);
        }
        // Front & rear crossbars + extended child-hand Protection Bar wings
        cyl(g, 0.015, 0.015, 0.44, 12, anodizedBlack, [-0.3, 0.34, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.015, 0.015, 0.44, 12, anodizedBlack, [-1.24, 0.34, 0], [Math.PI / 2, 0, 0]);
        // Inner passenger grab handle bar behind front rider saddle
        cyl(g, 0.014, 0.014, 0.34, 12, matteBlack, [-0.34, 0.39, 0], [Math.PI / 2, 0, 0]);
        // Two plush Clubhouse+ passenger seat cushions + rear backrest pad
        rbox(g, 0.34, 0.055, 0.22, 0.018, matteBlack, [-0.56, 0.13, 0]);
        rbox(g, 0.34, 0.055, 0.22, 0.018, matteBlack, [-0.96, 0.13, 0]);
        rbox(g, 0.06, 0.18, 0.26, 0.018, matteBlack, [-1.2, 0.26, 0]);
        // Lower Sidekick Wide Decks (running board footrests at y = -0.37, z = ±0.21)
        for (const z of [-0.21, 0.21]) {
          rbox(g, 0.72, 0.024, 0.11, 0.008, anodizedBlack, [-0.82, -0.37, z]);
        }
      },
    },
    {
      id: 'cargo-hold-52-panniers',
      name: 'Tern Cargo Hold 52L Weatherproof Pannier Bags & Rear Wheel-Guard Skirts',
      category: 'Cargo & Weather Gear',
      isOuter: true,
      explodeOffset: [-1.15, -0.15, 1.45],
      desc: 'Pair of oversized 52-liter waterproof roll-top Cargo Hold panniers (104 L combined trunk capacity) with Fidlock magnetic buckles and protective mesh wheel-guard skirts keeping passenger feet away from spokes.',
      funFact: 'The two Cargo Hold 52 panniers hold as much as the trunk of a compact hatchback car—and fold completely flat against the frame when empty!',
      build(g) {
        for (const side of [-1, 1]) {
          // Protective mesh wheel skirt over upper rear wheel quadrant
          rbox(g, 0.56, 0.28, 0.012, 0.005, matteBlack, [-0.82, -0.12, side * 0.115]);
          // 52L Cargo Hold pannier bag slung along the rear rack above the Sidekick Wide Deck
          rbox(g, 0.62, 0.36, 0.13, 0.032, pannierCloth, [-0.82, -0.11, side * 0.2]);
          // Fold-over roll-top flap + Tern high-vis yellow reflective stripe
          rbox(g, 0.64, 0.07, 0.14, 0.02, anodizedBlack, [-0.82, 0.05, side * 0.202]);
          rbox(g, 0.54, 0.032, 0.01, 0.004, maguraYellow, [-0.82, -0.12, side * 0.268]);
          // Twin Fidlock vertical strap buckles
          for (const bx of [-0.66, -0.98]) {
            rbox(g, 0.035, 0.26, 0.012, 0.003, anodizedBlack, [bx, -0.08, side * 0.268]);
          }
        }
      },
    },
    {
      id: 'atlas-lockstand-kickstand',
      name: 'Patented Atlas Lockstand Dual-Leg Auto-Locking Center Kickstand',
      category: 'Parking & Stability',
      isOuter: false,
      explodeOffset: [0, -1.35, -0.95],
      desc: 'Heavy-duty hydroformed dual-leg center stand rated for 80 kg (176 lbs) that automatically locks into place when deployed and unlocks via a remote lever on the handlebar.',
      funFact: 'Unlike a normal side kickstand that leans the bike over, the Atlas Lockstand lifts the rear wheel upright on two wide legs and locks with steel pins so children can climb aboard safely!',
      build(g) {
        rbox(g, 0.12, 0.06, 0.16, 0.015, anodizedBlack, [-0.14, -0.39, 0]);
        for (const z of [-0.17, 0.17]) {
          cyl(g, 0.018, 0.016, 0.34, 12, anodizedBlack, [-0.18, -0.52, z * 0.78], [-0.35 * Math.sign(z), 0, -0.15]);
          // Wide composite Lockstand foot pads sitting right on the ground plane
          rbox(g, 0.11, 0.028, 0.065, 0.008, matteBlack, [-0.21, -0.66, z]);
        }
      },
    },
    {
      id: 'magura-mt5-quad-piston-brakes',
      name: 'Magura MT5 eSTOP 4-Piston Hydraulic Cargo Disc Calipers & 180mm Rotors',
      category: 'Braking System',
      isOuter: false,
      explodeOffset: [0.45, -0.65, -1.35],
      desc: 'Motorcycle-derived Magura MT5 eSTOP 4-piston forged monobloc hydraulic disc calipers clamping 180 mm MDR-C heavy-duty stainless rotors front and rear.',
      funFact: 'Stopping a 200-kg loaded cargo bike down a steep San Francisco hill requires 4-piston hydraulic calipers originally developed for racing motorcycles!',
      build(g) {
        for (const [wx, cy] of [[0.90, -0.26], [-0.92, -0.26]]) {
          // 180mm vented stainless disc rotor on left side of hub (z = -0.072)
          cyl(g, 0.11, 0.11, 0.008, 28, chromeMat(), [wx, -0.36, -0.072], [Math.PI / 2, 0, 0]);
          torus(g, 0.095, 0.012, alu, [wx, -0.36, -0.072], [0, 0, 0]);
          // Magura MT5 4-piston caliper body + iconic Magura yellow piston rings
          rbox(g, 0.085, 0.052, 0.045, 0.012, anodizedBlack, [wx - 0.07, cy, -0.072], [0, 0, 0.45]);
          torus(g, 0.014, 0.004, maguraYellow, [wx - 0.08, cy, -0.096], [0, 0, 0]);
          torus(g, 0.014, 0.004, maguraYellow, [wx - 0.055, cy - 0.01, -0.096], [0, 0, 0]);
        }
      },
    },
  ];

  return {
    id: 'tern-gsd-cargo-ebike',
    name: 'Tern GSD S10 Electric Cargo Bike',
    brand: 'Tern Bicycles / Bosch eBike Systems',
    badge: '200 kg Gross Load • Bosch Cargo Line 85Nm • DualBattery 1000Wh',
    desc: 'Flagship compact utility longtail electric cargo bicycle engineered to replace a family car—featuring 20" Atlas wheels, a hydroformed UpDeck low-step truss frame, Bosch Cargo Line 85Nm mid-drive motor, 1,000 Wh DualBattery system, Physis 3D folding cockpit, Clubhouse+ passenger safety cage, Cargo Hold 52L panniers, and Atlas Lockstand.',
    cameraPos: [3.1, 1.65, 3.1],
    parts,
    quiz: [
      { q: 'Why does the Tern GSD use compact 20-inch wheels instead of full-size 26" or 29" wheels?', correctId: 'twenty-inch-moto-x-wheels', distractors: ['physis-3d-folding-cockpit', 'magura-mt5-quad-piston-brakes', 'suntour-cargo-suspension-fork'] },
      { q: 'Which mid-mounted electric motor delivers 85 Nm of torque and up to 400% pedal assist?', correctId: 'bosch-cargo-line-mid-drive', distractors: ['bosch-dual-battery-1000wh', 'atlas-lockstand-kickstand', 'updeck-lowstep-cargo-frame'] },
      { q: 'Which auto-locking dual-leg mechanism keeps the Tern GSD stable while loading two kids onto the rear rack?', correctId: 'atlas-lockstand-kickstand', distractors: ['clubhouse-plus-passenger-cage', 'cargo-hold-52-panniers', 'suntour-cargo-suspension-fork'] },
      { q: 'Which rear safety rail system converts between carrying two child passengers and holding four Eurocrates?', correctId: 'clubhouse-plus-passenger-cage', distractors: ['physis-3d-folding-cockpit', 'updeck-lowstep-cargo-frame', 'cargo-hold-52-panniers'] },
      { q: 'Which 4-piston hydraulic disc brake system stops a fully loaded 200-kg cargo e-bike safely on steep hills?', correctId: 'magura-mt5-quad-piston-brakes', distractors: ['cargo-hold-52-panniers', 'physis-3d-folding-cockpit', 'bosch-dual-battery-1000wh'] },
    ],
  };
}

function buildCarbonRoadBikeModel() {
  const carbon = carbonFiberMat([6, 6]);
  const red = carPaint(0xdc2626);
  const steel = chromeMat();
  const alu = brushedMetal(0xd8dee9, { metalness: 0.9, roughness: 0.16 });
  const goldTi = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.14 });
  const matteBlack = mat(0x111827, { roughness: 0.65 });

  const parts = [
    {
      id: 'monocoque-carbon-frame-fork',
      name: 'Toray T1100 Monocoque Carbon Aero Frame & Internal Cable Routing (CAD)',
      category: 'Frame & Aero',
      isOuter: true,
      explodeOffset: [0, 1.25, 0],
      desc: 'Precision-molded Kamm-tail carbon main triangle, dropped aero seatstays, bottom bracket shell, and internal Di2/hydraulic routing.',
      funFact: 'High-modulus carbon-fiber road frames weigh under 700 grams—less than a full water bottle—yet survive 100+ km/h mountain descents!',
      build(g) {
        populateBikeCad(g, { zone: 'frame' });
        cyl(g, 0.032, 0.038, 1.15, 16, carbon, [0, 0.28, 0], [0, 0, 1.42]);
      },
    },
    {
      id: 'bladed-aero-carbon-fork',
      name: 'Bladed Carbon Aero Fork, Tapered Ceramic Headset & Thru-Axle Dropouts',
      category: 'Front Suspension & Steering',
      isOuter: true,
      explodeOffset: [1.15, 0.35, 0],
      desc: 'Wind-tunnel-sculpted deep-section carbon fork blades, 1-1/8" to 1-1/2" tapered ceramic headset bearings, internal front brake hose channel, and 12×100mm thru-axle.',
      funFact: 'Aero fork blades are spaced slightly wider apart so turbulent air spinning off the front wheel flows smoothly past the frame without stalling!',
      build(g) {
        for (const z of [-0.048, 0.048]) {
          rbox(g, 0.065, 0.48, 0.018, 0.006, carbon, [0.68, 0.04, z], [0, 0, -0.34]);
        }
        cyl(g, 0.024, 0.028, 0.18, 16, carbon, [0.58, 0.36, 0], [0, 0, -0.34]);
        torus(g, 0.028, 0.006, goldTi, [0.55, 0.44, 0], [Math.PI / 2, 0, -0.34]);
        cyl(g, 0.008, 0.008, 0.13, 12, alu, [0.78, -0.2, 0], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'aero-cockpit-saddle-seatpost',
      name: 'Integrated One-Piece Carbon Aero Bar-Stem, STI Shifters & Out-Front GPS (CAD)',
      category: 'Cockpit & Controls',
      isOuter: true,
      explodeOffset: [0.95, 1.15, 0],
      desc: 'Real CAD one-piece aerodynamic carbon drop handlebar, wireless dual-control shift/brake levers, perforated bar tape, and out-front GPS computer mount.',
      funFact: 'Routing brake hoses completely inside the handlebar and stem saves up to 8 watts of aerodynamic drag at 45 km/h!',
      build(g) {
        populateBikeCad(g, { zone: 'cockpit-fork' });
        rbox(g, 0.16, 0.04, 0.42, 0.015, carbon, [0.56, 0.56, 0]);
        // Out-front aero cycling GPS computer displaying live watts, cadence & heart rate
        rbox(g, 0.085, 0.016, 0.052, 0.005, screenMat('dashboard'), [0.68, 0.58, 0], [0, 0, -0.15]);
        for (const z of [-0.19, 0.19]) {
          rbox(g, 0.09, 0.12, 0.028, 0.008, matteBlack, [0.64, 0.54, z], [0, 0, -0.25]);
        }
      },
    },
    {
      id: 'd-profile-seatpost-3d-saddle',
      name: 'D-Shaped Aero Carbon Seatpost, Internal Di2 Battery & 3D-Printed Lattice Saddle',
      category: 'Saddle & Electronics',
      isOuter: true,
      explodeOffset: [-0.85, 1.25, 0],
      desc: 'Truncated-airfoil D-profile carbon seatpost housing the cylindrical 7.4V lithium-ion Di2 battery pack, topped by a carbon-rail 3D-printed elastomeric lattice saddle.',
      funFact: 'Instead of foam, pro saddles use a 3D-printed honeycomb polymer lattice tuned with softer zones under sit-bones and firmer support at the nose!',
      build(g) {
        rbox(g, 0.052, 0.34, 0.028, 0.008, carbon, [-0.32, 0.46, 0], [0, 0, 0.28]);
        // Cylindrical internal Di2 lithium battery inside seatpost
        cyl(g, 0.01, 0.01, 0.16, 12, carPaint(0x2563eb), [-0.28, 0.36, 0], [0, 0, 0.28]);
        // Carbon-rail 3D-printed saddle
        rbox(g, 0.28, 0.036, 0.14, 0.014, matteBlack, [-0.38, 0.62, 0]);
        for (const z of [-0.022, 0.022]) {
          cyl(g, 0.004, 0.004, 0.18, 8, carbon, [-0.37, 0.59, z], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'hollow-crankset-power-meter',
      name: 'Hollow-Forged 54/40T Crankset, Dual-Sided Power Meter Spider & Ceramic BB',
      category: 'Crankset & Power Meter',
      isOuter: false,
      explodeOffset: [0.25, -0.65, 1.35],
      desc: 'Hollow-bonded 172.5mm crankarms, CNC-machined 54/40T aero outer/inner chainrings, strain-gauge power meter spider accurate to ±1%, and ceramic-bearing bottom bracket.',
      funFact: 'Microscopic strain gauges inside the crank spider measure how much the metal flexes 200 times per second to calculate exact rider power in Watts!',
      build(g) {
        // Bottom bracket shell + ceramic bearing cups + 24mm titanium spindle
        cyl(g, 0.028, 0.028, 0.095, 20, red, [-0.08, -0.22, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.014, 0.014, 0.13, 16, goldTi, [-0.08, -0.22, 0], [Math.PI / 2, 0, 0]);
        // 54T outer & 40T inner chainrings + strain-gauge spider LED pod
        torus(g, 0.115, 0.012, carbon, [-0.08, -0.22, 0.055], [0, 0, 0]);
        torus(g, 0.085, 0.009, alu, [-0.08, -0.22, 0.048], [0, 0, 0]);
        rbox(g, 0.18, 0.034, 0.016, 0.006, carbon, [-0.01, -0.22, 0.068], [0, 0, -0.35]);
        rbox(g, 0.18, 0.034, 0.016, 0.006, carbon, [-0.15, -0.22, -0.068], [0, 0, -0.35]);
      },
    },
    {
      id: 'clipless-carbon-pedals',
      name: 'Carbon-Body SPD-SL Clipless Road Pedals & Hollow Titanium Spindles',
      category: 'Pedals & Contact Points',
      isOuter: false,
      explodeOffset: [0.55, -0.95, 1.45],
      desc: 'Wide-platform injection-molded carbon clipless pedals with stainless-steel cleat wear plates, adjustable spring-loaded retention jaws, and hollow titanium axles.',
      funFact: 'Clipping carbon-soled cycling shoes directly into spring-loaded pedal jaws lets a sprinter pull UP as well as push DOWN at 1,800 watts!',
      build(g) {
        for (const [px, py, pz] of [[0.06, -0.25, 0.105], [-0.22, -0.19, -0.105]]) {
          cyl(g, 0.006, 0.006, 0.055, 10, goldTi, [px, py, pz], [Math.PI / 2, 0, 0]);
          rbox(g, 0.075, 0.018, 0.065, 0.005, carbon, [px, py, pz + Math.sign(pz) * 0.02]);
          rbox(g, 0.035, 0.02, 0.05, 0.003, steel, [px, py + 0.004, pz + Math.sign(pz) * 0.02]);
        }
      },
    },
    {
      id: 'electronic-derailleur-crankset',
      name: '12-Speed Wireless Electronic Derailleurs, 11-30T Titanium Cassette & Chain (CAD)',
      category: 'Electronic Drivetrain',
      isOuter: false,
      explodeOffset: [-0.55, -0.65, 1.35],
      desc: 'Real CAD 12-speed roller chain, 11-30T hyperglide cassette, front braze-on electronic yaw derailleur, and rear servo derailleur with oversized ceramic pulley cage.',
      funFact: 'A modern waxed bicycle chain transfers 98.6% of the rider’s leg power directly to the rear tire—more efficient than almost any car transmission!',
      build(g) {
        populateBikeCad(g, { zone: 'drivetrain' });
        torus(g, 0.16, 0.016, steel, [-0.08, -0.22, 0.09], [0, 0, 0]);
        // Oversized ceramic pulley wheel cage on rear derailleur
        for (const py of [-0.28, -0.35]) {
          torus(g, 0.024, 0.005, red, [-0.78, py, 0.085], [0, 0, 0]);
        }
      },
    },
    {
      id: 'hydraulic-disc-brakes',
      name: 'Flat-Mount Hydraulic Disc Calipers & 160mm Ice-Tech Centerlock Rotors (CAD)',
      category: 'Braking System',
      isOuter: false,
      explodeOffset: [0, 0.45, -1.35],
      desc: 'Real CAD mineral-oil hydraulic brake levers, internal hoses, 2-piston monobloc magnesium calipers, finned cooling pads, and 160mm stainless-aluminum-stainless sandwich rotors.',
      funFact: 'Disc brakes moved stopping power from the fragile carbon wheel rim to a hub rotor with aluminum cooling fins that works equally well in pouring rain!',
      build(g) {
        populateBikeCad(g, { zone: 'brakes' });
        for (const x of [-0.78, 0.78]) {
          torus(g, 0.14, 0.012, steel, [x, -0.2, -0.06], [0, 0, 0]);
          rbox(g, 0.065, 0.042, 0.036, 0.008, matteBlack, [x - 0.08, -0.12, -0.06]);
        }
      },
    },
    {
      id: 'deep-section-carbon-wheelset',
      name: '50mm Deep-Section Carbon Tubeless Wheelset, Bladed Spokes & 28c Tires (CAD)',
      category: 'Wheels & Tires',
      isOuter: true,
      explodeOffset: [0, -1.25, 0],
      desc: 'Real CAD front and rear spoked wheels with 50mm toroidal carbon rims, 24 bladed straight-pull aero spokes, 54T star-ratchet freehub, and 28mm tubeless silica slick tires.',
      funFact: 'Every bicycle wheel is a pre-tensioned suspension bridge—the rim hangs from the top spokes rather than resting on the bottom ones!',
      build(g) {
        populateBikeCad(g, { zone: ['front-wheel', 'rear-wheel'] });
        for (const x of [-0.78, 0.78]) {
          const w = new THREE.Group();
          w.position.set(x, -0.2, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          torus(w, 0.36, 0.038, mat(0x0f172a), [0, 0, 0], [0, 0, 0]);
          torus(w, 0.31, 0.022, red, [0, 0, 0], [0, 0, 0]);
        }
      },
    },
    {
      id: 'aero-carbon-bottle-cages-bidons',
      name: 'Wind-Tunnel Aero Carbon Water Bottle Cages & Dual 550ml Pro Bidons',
      category: 'Hydration & Frame Aero',
      isOuter: false,
      explodeOffset: [0.15, 0.55, -1.15],
      desc: 'Twin 18-gram injection-molded carbon cages bolted to the downtube and seattube bosses, holding aerodynamic dimpled 550ml pro team hydration bidons.',
      funFact: 'In wind-tunnel tests, a modern aero road bike is actually FASTER with water bottles installed because they fill the air gap inside the frame triangle!',
      build(g) {
        // Downtube & seattube carbon bottle cages + red/white team bidons
        const positions = [
          { pos: [0.14, 0.04, 0], rot: [0, 0, -0.78] },
          { pos: [-0.14, 0.06, 0], rot: [0, 0, 0.32] },
        ];
        for (const { pos, rot } of positions) {
          rbox(g, 0.055, 0.16, 0.055, 0.015, carbon, pos, rot);
          cyl(g, 0.034, 0.032, 0.18, 18, mat(0xf8fafc, { roughness: 0.3 }), pos, rot);
          cyl(g, 0.026, 0.034, 0.035, 16, red, [pos[0] + 0.02, pos[1] + 0.09, pos[2]], rot);
        }
      },
    },
  ];
  return {
    id: 'carbon-aero-road-bike',
    name: 'Tour-Grade Carbon Aero Bike',
    brand: 'UCI WorldTour Aero Monocoque',
    badge: '6.8 kg UCI Limit • 12-Speed Di2 • Power Meter • Real CAD',
    desc: 'Ultra-lightweight 10-part carbon-fiber WorldTour racing bicycle featuring a Toray T1100 monocoque aero frame, bladed aero fork, integrated bar-stem cockpit, 3D-printed lattice saddle, dual-sided power meter crankset, clipless carbon pedals, 12-speed electronic drivetrain, flat-mount hydraulic disc brakes, 50mm wheelset, and aero bidons.',
    cameraPos: [3.2, 1.8, 3.2],
    parts,
    quiz: [
      { q: 'Why are carbon-fiber bicycle frames both feather-light and stiff under pedaling loads?', correctId: 'monocoque-carbon-frame-fork', distractors: ['hydraulic-disc-brakes', 'deep-section-carbon-wheelset', 'electronic-derailleur-crankset'] },
      { q: 'Which subsystem transfers 98.6% of the rider’s pedal torque to the rear wheel?', correctId: 'electronic-derailleur-crankset', distractors: ['monocoque-carbon-frame-fork', 'hydraulic-disc-brakes', 'deep-section-carbon-wheelset'] },
      { q: 'How does the crankset measure a cyclist’s exact pedaling output in Watts?', correctId: 'hollow-crankset-power-meter', distractors: ['clipless-carbon-pedals', 'd-profile-seatpost-3d-saddle', 'aero-carbon-bottle-cages-bidons'] },
      { q: 'Why did pro road bikes switch from rim brakes to hub-mounted hydraulic rotors?', correctId: 'hydraulic-disc-brakes', distractors: ['deep-section-carbon-wheelset', 'monocoque-carbon-frame-fork', 'electronic-derailleur-crankset'] },
      { q: 'Why do 50mm deep-section carbon rims and bladed spokes slice through crosswinds faster than shallow box rims?', correctId: 'deep-section-carbon-wheelset', distractors: ['clipless-carbon-pedals', 'aero-carbon-bottle-cages-bidons', 'd-profile-seatpost-3d-saddle'] },
    ],
  };
}

function buildDucatiPanigaleModel() {
  const ducatiRed = carPaint(0xd40000);
  const corseWhite = carPaint(0xf8fafc);
  const tricoloreGreen = carPaint(0x16a34a);
  const ohlinsGold = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.14 });
  const magnesiumBronze = brushedMetal(0x926c44, { metalness: 0.86, roughness: 0.24 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.90, roughness: 0.18 });
  const darkMetal = brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.26 });
  const titanium = brushedMetal(0x94a3b8, { metalness: 0.92, roughness: 0.20 });
  const heatBlueTi = brushedMetal(0x60a5fa, { metalness: 0.92, roughness: 0.18 });
  const carbon = carbonFiberMat([6, 6]);
  const tireRubber = mat(0x0f172a, { roughness: 0.78 });
  const alcantara = mat(0x111827, { roughness: 0.88 });
  const rotorDiscMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: brakeRotorTexture(),
    metalness: 0.88,
    roughness: 0.18,
  });

  // 18-Station Sculpted Muscular 17L Ducati Fuel Tank Loft (from rear seat waist x=-0.16 to front airbox cover x=0.45)
  const panigaleTankStations = [
    { x: -0.16, y: 0.24, rTop: 0.032, rBot: 0.030, rz: 0.058, n: 2.1, flatBottom: 0.80 },
    { x: -0.10, y: 0.25, rTop: 0.055, rBot: 0.045, rz: 0.088, n: 2.15, flatBottom: 0.80 },
    { x: -0.02, y: 0.27, rTop: 0.082, rBot: 0.058, rz: 0.118, n: 2.2, flatBottom: 0.82 },
    { x: 0.06,  y: 0.29, rTop: 0.108, rBot: 0.068, rz: 0.148, n: 2.25, chine: 0.15, flatBottom: 0.82 },
    { x: 0.14,  y: 0.31, rTop: 0.128, rBot: 0.075, rz: 0.172, n: 2.3, chine: 0.22, flatBottom: 0.82 },
    { x: 0.22,  y: 0.32, rTop: 0.138, rBot: 0.078, rz: 0.182, n: 2.3, chine: 0.25, flatBottom: 0.82 },
    { x: 0.30,  y: 0.32, rTop: 0.125, rBot: 0.072, rz: 0.168, n: 2.25, chine: 0.20, flatBottom: 0.80 },
    { x: 0.38,  y: 0.32, rTop: 0.092, rBot: 0.055, rz: 0.132, n: 2.15, flatBottom: 0.78 },
    { x: 0.43,  y: 0.33, rTop: 0.052, rBot: 0.035, rz: 0.085, n: 2.05, flatBottom: 0.75 },
    { x: 0.46,  y: 0.33, rTop: 0.018, rBot: 0.015, rz: 0.035, n: 2.0 },
  ];

  // 16-Station Compound-Curved Aerodynamic Front Nose Cowl Loft (from upper fairing ears x=0.48 to sharp nose tip x=0.96)
  const panigaleNoseStations = [
    { x: 0.48, y: 0.36, rTop: 0.075, rBot: 0.055, rz: 0.195, n: 2.1, chine: 0.28, flatBottom: 0.65 },
    { x: 0.56, y: 0.34, rTop: 0.082, rBot: 0.068, rz: 0.188, n: 2.1, chine: 0.32, flatBottom: 0.65 },
    { x: 0.64, y: 0.32, rTop: 0.084, rBot: 0.076, rz: 0.175, n: 2.05, chine: 0.35, flatBottom: 0.62 },
    { x: 0.72, y: 0.29, rTop: 0.078, rBot: 0.072, rz: 0.155, n: 2.0, chine: 0.36, flatBottom: 0.58 },
    { x: 0.80, y: 0.26, rTop: 0.064, rBot: 0.058, rz: 0.128, n: 1.95, chine: 0.34, flatBottom: 0.55 },
    { x: 0.87, y: 0.24, rTop: 0.044, rBot: 0.040, rz: 0.092, n: 1.9, chine: 0.28 },
    { x: 0.92, y: 0.23, rTop: 0.026, rBot: 0.024, rz: 0.054, n: 1.9, chine: 0.20 },
    { x: 0.96, y: 0.22, rTop: 0.008, rBot: 0.008, rz: 0.016, n: 2.0 },
  ];

  const parts = [
    { id: 'desmosedici-v4-engine', name: '998cc 90° Desmosedici Stradale R V4 Engine & Open STM Dry Clutch (CAD)', category: 'Powertrain', isOuter: false, explodeOffset: [0, -0.45, 1.35],
      desc: '90° V4 stressed-member engine block with 42° rearward-tilted cylinder banks, magnesium cam covers, STM EVO-SBK open dry clutch with exposed red springs, and dual curved radiator/oil cooler cores.',
      funFact: 'At 16,500 RPM in 6th gear, steel valve springs would float—so Ducati uses a second "Desmodromic" cam lobe to mechanically pull every titanium valve shut!',
      build(g) {
        populateEngineCad(g, { pos: [0.12, -0.06, 0], scale: 0.00052, accentColor: 0xd40000 });
        // Crankcase & 90° V4 front/rear cylinder banks tilted 42° rearward
        rbox(g, 0.34, 0.24, 0.24, 0.03, darkMetal, [0.08, -0.11, 0]);
        // Front cylinder bank (tilted forward) & Rear cylinder bank (tilted rearward) with bronze magnesium Desmo cam covers
        rbox(g, 0.18, 0.22, 0.23, 0.02, alu, [0.24, 0.02, 0], [0, 0, -0.58]);
        rbox(g, 0.19, 0.045, 0.24, 0.01, magnesiumBronze, [0.31, 0.09, 0], [0, 0, -0.58]);
        rbox(g, 0.18, 0.22, 0.23, 0.02, alu, [0.02, 0.08, 0], [0, 0, 0.72]);
        rbox(g, 0.19, 0.045, 0.24, 0.01, magnesiumBronze, [-0.05, 0.15, 0], [0, 0, 0.72]);
        // Right-side STM EVO-SBK open dry clutch with bronze magnesium case, slotted carbon guard, red pressure plate & 6 gold springs
        cyl(g, 0.115, 0.115, 0.048, 28, magnesiumBronze, [0.02, -0.13, 0.135], [Math.PI / 2, 0, 0]);
        torus(g, 0.092, 0.015, carbon, [0.02, -0.13, 0.164]);
        cyl(g, 0.072, 0.072, 0.020, 24, ducatiRed, [0.02, -0.13, 0.160], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          cyl(g, 0.013, 0.013, 0.026, 12, ohlinsGold, [0.02 + Math.cos(a) * 0.046, -0.13 + Math.sin(a) * 0.046, 0.168], [Math.PI / 2, 0, 0]);
        }
        // Left-side magnesium alternator cover & water pump + Samco red silicone coolant hoses
        cyl(g, 0.098, 0.098, 0.040, 24, magnesiumBronze, [0.08, -0.12, -0.135], [Math.PI / 2, 0, 0]);
        tube(g, [[0.14, -0.08, -0.14], [0.28, -0.02, -0.15], [0.42, 0.04, -0.13]], 0.013, ducatiRed);
        // Curved dual-stage aluminum water radiator (upper) & oil cooler (lower) behind front wheel
        rbox(g, 0.055, 0.24, 0.30, 0.01, darkMetal, [0.44, 0.02, 0], [0, 0, -0.36]);
        rbox(g, 0.048, 0.15, 0.24, 0.008, alu, [0.39, -0.17, 0], [0, 0, -0.24]);
        buildFinArray(g, [0.45, 0.02, 0], 14, [0.003, 0.20, 0.27], [0.004, 0, 0], alu);
        buildWiringHarness(g, [[-0.08, 0.08, 0.13], [0.12, -0.02, 0.15], [0.32, 0.12, 0.13]], { radius: 0.009, color: 0xf97316 });
      } },
    { id: 'akrapovic-titanium-exhaust', name: 'Akrapovič Full-Race Hydroformed Titanium 4-2-1-2 Exhaust System', category: 'Exhaust & Aero Thermal', isOuter: false, explodeOffset: [0, -0.95, 0.85],
      desc: 'Thin-wall hydroformed titanium primary headers with heat-blued weld seams, underbelly twin catalytic collectors, and dual carbon-capped undertail/belly exit silencers.',
      funFact: 'The full-race Akrapovič titanium exhaust shaves 5 kg off the bike and boosts output to 237 horsepower with racing oil!',
      build(g) {
        // Front bank primary titanium headers curving down under engine sump
        for (const s of [-1, 1]) {
          tube(g, [
            [0.32, -0.02, s * 0.07],
            [0.37, -0.16, s * 0.09],
            [0.24, -0.28, s * 0.09],
            [-0.06, -0.30, s * 0.085],
            [-0.26, -0.27, s * 0.095],
          ], 0.021, titanium);
          // Rear bank primary headers looping under seat & down to collector
          tube(g, [
            [-0.06, 0.12, s * 0.065],
            [-0.22, 0.16, s * 0.08],
            [-0.28, 0.02, s * 0.095],
            [-0.18, -0.22, s * 0.09],
          ], 0.020, heatBlueTi);
          // Underbelly twin titanium race silencers with angled carbon-fiber slash-cut end caps & mesh outlets
          cyl(g, 0.042, 0.048, 0.28, 18, titanium, [-0.18, -0.28, s * 0.105], [0, 0, Math.PI / 2 - 0.12]);
          cyl(g, 0.040, 0.034, 0.06, 16, carbon, [-0.33, -0.26, s * 0.105], [0, 0, Math.PI / 2 - 0.12]);
          // High-mount WSBK-style undertail titanium dual mufflers tucked beneath tail cowling
          cyl(g, 0.034, 0.038, 0.22, 16, titanium, [-0.66, 0.34, s * 0.075], [0, 0, Math.PI / 2 + 0.38]);
          cyl(g, 0.032, 0.026, 0.045, 14, carbon, [-0.77, 0.38, s * 0.075], [0, 0, Math.PI / 2 + 0.38]);
        }
        // Carbon-fiber rear exhaust heat shield on right flank
        rbox(g, 0.22, 0.11, 0.012, 0.004, carbon, [-0.22, 0.08, 0.115], [0, 0, 0.45]);
      } },
    { id: 'aluminum-front-frame-swingarm', name: 'Cast-Aluminum Stressed-Member "Front Frame" & Rear Subframe', category: 'Chassis', isOuter: false, explodeOffset: [-0.95, 0.55, 0],
      desc: '4.2-kg hollow cast-aluminum Front Frame with machined weight-saving pockets bolted directly to the front & rear V4 cylinder heads, plus cast rear trellis subframe.',
      funFact: 'There is no traditional perimeter frame—the Desmosedici V4 engine block IS the motorcycle’s load-bearing chassis!',
      build(g) {
        // Steering head casting + twin sculpted front frame spars with CNC weight-relief pockets
        cyl(g, 0.044, 0.044, 0.19, 20, alu, [0.54, 0.31, 0], [0, 0, -0.40]);
        for (const s of [-1, 1]) {
          const z = s * 0.135;
          rbox(g, 0.48, 0.082, 0.028, 0.012, alu, [0.31, 0.21, z], [0, s * -0.06, 0.40]);
          // Recessed dark CNC pockets in frame spar
          rbox(g, 0.16, 0.038, 0.032, 0.006, darkMetal, [0.36, 0.23, z], [0, s * -0.06, 0.40]);
          rbox(g, 0.14, 0.034, 0.032, 0.006, darkMetal, [0.18, 0.15, z], [0, s * -0.06, 0.40]);
          // Rear cast-aluminum seat subframe rails bolted to rear cylinder bank
          tube(g, [[0.02, 0.16, s * 0.11], [-0.28, 0.22, s * 0.10], [-0.68, 0.36, s * 0.07]], 0.015, darkMetal);
          tube(g, [[-0.06, 0.02, s * 0.12], [-0.34, 0.19, s * 0.10]], 0.012, darkMetal);
        }
        buildHexBoltArray(g, [[0.12, 0.12, 0.15], [0.12, 0.12, -0.15], [0.46, 0.28, 0.14], [0.46, 0.28, -0.14]], { radius: 0.009, height: 0.016 });
      } },
    { id: 'single-sided-swingarm-chain', name: 'Hollow Cast-Aluminum Single-Sided Swingarm, Gold 520 Chain & Rearsets', category: 'Drivetrain & Swingarm', isOuter: false, explodeOffset: [-1.35, -0.15, -0.65],
      desc: '600mm hollow cast-aluminum single-sided left swingarm with adjustable pivot height, eccentric rear hub carrier, DID Gold 520 drive chain, carbon chain guard, and CNC billet rearset footpegs.',
      funFact: 'Because the entire swingarm wraps only around the left side of the rear wheel, pit crews can swap a slick tire in seconds using a single central titanium axle nut!',
      build(g) {
        // Multi-station lofted hollow cast-aluminum single-sided left swingarm (replaces flat extrude!)
        const swingStations = [
          { x: -0.80, y: -0.22, rTop: 0.048, rBot: 0.048, rz: 0.032, zCenter: -0.118, n: 2.2 },
          { x: -0.62, y: -0.20, rTop: 0.058, rBot: 0.064, rz: 0.038, zCenter: -0.122, n: 2.3 },
          { x: -0.38, y: -0.18, rTop: 0.072, rBot: 0.078, rz: 0.042, zCenter: -0.125, n: 2.35 },
          { x: -0.18, y: -0.16, rTop: 0.068, rBot: 0.068, rz: 0.040, zCenter: -0.120, n: 2.3 },
          { x: -0.04, y: -0.15, rTop: 0.055, rBot: 0.055, rz: 0.045, zCenter: -0.105, n: 2.2 },
        ];
        buildMultiSectionLoft(g, swingStations, { radialSegs: 28, material: alu });
        // Dark recessed structural truss pocket & sculpted 3D carbon-fiber rear tire hugger fender
        rbox(g, 0.28, 0.048, 0.088, 0.01, darkMetal, [-0.38, -0.18, -0.125], [0, 0, 0.12]);
        const huggerStations = [
          { x: -0.86, y: 0.06, rTop: 0.012, rBot: 0.008, rz: 0.075, n: 2.0, flatBottom: 0.8 },
          { x: -0.72, y: 0.10, rTop: 0.016, rBot: 0.010, rz: 0.102, n: 2.1, flatBottom: 0.8 },
          { x: -0.56, y: 0.06, rTop: 0.016, rBot: 0.010, rz: 0.105, n: 2.1, flatBottom: 0.8 },
          { x: -0.42, y: -0.05, rTop: 0.014, rBot: 0.010, rz: 0.095, n: 2.1, flatBottom: 0.8 },
        ];
        buildMultiSectionLoft(g, huggerStations, { radialSegs: 24, material: carbon });
        // Gold DID 520 racing chain upper & lower runs + rear anodized aluminum sprocket carrier
        rbox(g, 0.68, 0.016, 0.018, 0.003, ohlinsGold, [-0.44, -0.12, -0.105], [0, 0, 0.14]);
        rbox(g, 0.68, 0.016, 0.018, 0.003, ohlinsGold, [-0.44, -0.26, -0.105], [0, 0, -0.04]);
        torus(g, 0.095, 0.014, ohlinsGold, [-0.78, -0.22, -0.105]);
        // CNC billet aluminum rider rearsets, heel guards, folding knurled footpegs & Ducati Quick Shift (DQS) rod
        for (const s of [-1, 1]) {
          rbox(g, 0.14, 0.09, 0.014, 0.004, alu, [-0.14, -0.12, s * 0.155], [0, 0, 0.35]);
          rbox(g, 0.09, 0.075, 0.008, 0.003, carbon, [-0.18, -0.07, s * 0.162], [0, 0, 0.45]);
          cyl(g, 0.011, 0.011, 0.085, 12, alu, [-0.14, -0.16, s * 0.195], [Math.PI / 2, 0, 0]);
        }
        cyl(g, 0.005, 0.005, 0.22, 8, titanium, [-0.02, -0.15, -0.155], [0, 0, Math.PI / 2 - 0.12]);
      } },
    { id: 'ohlins-npx-forks-monoshock', name: 'Öhlins NPX 25/30 Gold TiN Inverted Forks, Billet Clamps & Cockpit', category: 'Front Suspension & Controls', isOuter: false, explodeOffset: [1.25, 0.45, 0],
      desc: '43mm Öhlins NPX pressurized inverted forks with gold Titanium-Nitride inner tubes, CNC machined billet triple clamps with engraved serial badge, Öhlins steering damper, clip-on bars, and 5" TFT dash.',
      funFact: 'The bright gold color on superbike forks is an ultra-hard Titanium Nitride ceramic coating that makes the tubes slide with almost zero friction!',
      build(g) {
        // Upper gullwing CNC billet triple clamp & lower triple clamp (rake angle ~24.5° = 0.42 rad)
        rbox(g, 0.095, 0.024, 0.27, 0.008, alu, [0.51, 0.36, 0], [0, 0, -0.40]);
        rbox(g, 0.10, 0.032, 0.28, 0.008, alu, [0.58, 0.20, 0], [0, 0, -0.40]);
        // Transverse Öhlins steering damper mounted behind upper triple clamp
        cyl(g, 0.014, 0.014, 0.20, 12, ohlinsGold, [0.47, 0.38, 0], [Math.PI / 2, 0, 0]);
        for (const s of [-1, 1]) {
          const z = s * 0.115;
          // Gold anodized outer fork stanchions + blue/red compression/rebound top caps
          cyl(g, 0.028, 0.026, 0.40, 22, ohlinsGold, [0.60, 0.16, z], [0, 0, 0.40]);
          cyl(g, 0.029, 0.029, 0.018, 16, brushedMetal(s < 0 ? 0x2563eb : 0xdc2626), [0.52, 0.34, z], [0, 0, 0.40]);
          // TiN gold-coated lower inner sliders + CNC radial brake caliper axle bottoms + pressurized gas reservoirs
          cyl(g, 0.022, 0.022, 0.28, 20, ohlinsGold, [0.72, -0.09, z], [0, 0, 0.40]);
          rbox(g, 0.075, 0.085, 0.044, 0.01, alu, [0.78, -0.21, z], [0, 0, 0.40]);
          cyl(g, 0.016, 0.016, 0.09, 14, ohlinsGold, [0.74, -0.19, z + s * 0.022], [0, 0, 0.40]);
          // Clip-on handlebars, Domino race grips, Brembo radial master cylinders, fluid reservoirs & lever guards
          cyl(g, 0.012, 0.012, 0.21, 12, darkMetal, [0.49, 0.35, s * 0.20], [Math.PI / 2, s * 0.28, -0.15]);
          cyl(g, 0.015, 0.015, 0.11, 12, alcantara, [0.46, 0.34, s * 0.25], [Math.PI / 2, s * 0.28, -0.15]);
          cyl(g, 0.016, 0.016, 0.032, 12, glassMat(0xfef3c7, 0.7), [0.53, 0.40, s * 0.17], [0, 0, 0]);
          rbox(g, 0.09, 0.012, 0.018, 0.003, carbon, [0.51, 0.34, s * 0.31], [0, s * -0.25, 0]);
        }
        // Full-color 5-inch Ducati Corse TFT instrument display + magnesium fairing stay bracket
        rbox(g, 0.022, 0.085, 0.145, 0.008, screenMat('dashboard'), [0.59, 0.41, 0], [0, 0, -0.58]);
        rbox(g, 0.14, 0.045, 0.08, 0.008, darkMetal, [0.62, 0.35, 0], [0, 0, -0.30]);
      } },
    { id: 'ohlins-ttx36-monoshock-linkage', name: 'Öhlins TTX36 Piggyback Rear Monoshock & Forged Rocker Linkage', category: 'Rear Suspension', isOuter: false, explodeOffset: [-0.45, 0.65, -0.95],
      desc: 'Twin-tube Öhlins TTX36 rear shock absorber with yellow titanium coil spring, gold piggyback nitrogen reservoir, and forged aluminum adjustable progressive rocker arm.',
      funFact: 'The TTX36 separates compression and rebound oil chambers completely so the shock never cavitates over 280 km/h curbing!',
      build(g) {
        // Forged aluminum progressive triangular rocker linkage + tie rod on left side
        rbox(g, 0.13, 0.065, 0.045, 0.01, alu, [-0.14, 0.05, -0.06], [0, 0, 0.25]);
        // Öhlins TTX36 shock body, piggyback gold gas cylinder & yellow coil spring
        cyl(g, 0.022, 0.022, 0.26, 16, alu, [-0.22, 0.01, -0.06], [0, 0, -0.68]);
        cyl(g, 0.018, 0.018, 0.11, 14, ohlinsGold, [-0.16, 0.08, -0.095], [0, 0, -0.68]);
        for (let c = 0; c < 7; c++) {
          const t = (c - 3) * 0.024;
          torus(g, 0.034, 0.007, ohlinsGold, [-0.22 - t * 0.78, 0.01 + t * 0.62, -0.06], [0, 0, -0.68 + Math.PI / 2]);
        }
      } },
    { id: 'brembo-stylema-marchesini-wheels', name: '17" Marchesini Forged Magnesium Wheels, Pirelli Slicks & Brembo Stylema R Brakes', category: 'Brakes & Wheels', isOuter: true, explodeOffset: [0, -1.20, 0],
      desc: '3-split-Y-spoke forged Marchesini wheels wrapped in wide Pirelli Diablo Supercorsa SP slicks (120/70 ZR17 front, 200/60 ZR17 rear) with dual 330mm floating discs and Brembo Stylema R 4-piston radial calipers.',
      funFact: 'The Desmosedici V4 crankshaft spins backward against the wheels to cancel gyroscopic inertia so the bike flicks from side to side faster!',
      build(g) {
        for (const [x, isFront] of [[-0.78, false], [0.80, true]]) {
          const w = new THREE.Group();
          w.position.set(x, -0.22, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          const tireWidthTube = isFront ? 0.072 : 0.096;
          const rimWidth = isFront ? 0.12 : 0.18;
          // Pirelli Diablo Supercorsa rounded sportbike slick tire profile + Ducati Corse red/white wheel rim stripes
          torus(w, 0.285, tireWidthTube, tireRubber, [0, 0, 0]);
          cyl(w, 0.224, 0.224, rimWidth, 32, darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (const side of [-1, 1]) {
            torus(w, 0.226, 0.0055, ducatiRed, [0, 0, side * (rimWidth * 0.48)]);
            torus(w, 0.218, 0.0035, corseWhite, [0, 0, side * (rimWidth * 0.48)]);
          }
          // Central wheel hub + 3-split-Y-spoke (6 paired Y-branches) forged Marchesini magnesium spokes
          cyl(w, 0.056, 0.056, rimWidth + 0.02, 22, darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
          cyl(w, 0.028, 0.028, rimWidth + 0.05, 16, titanium, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let s = 0; s < 3; s++) {
            const baseA = (s / 3) * Math.PI * 2;
            // Inner root stem of Y-spoke
            rbox(w, 0.085, 0.024, 0.024, 0.005, darkMetal, [Math.cos(baseA) * 0.078, Math.sin(baseA) * 0.078, 0], [0, 0, baseA]);
            // Left and right Y-branches reaching the rim
            for (const branch of [-1, 1]) {
              const a = baseA + branch * 0.24;
              rbox(w, 0.125, 0.016, 0.020, 0.004, darkMetal, [Math.cos(a) * 0.162, Math.sin(a) * 0.162, 0], [0, 0, a + branch * 0.22]);
            }
          }
          if (isFront) {
            // Dual 330mm cross-drilled Brembo T-Drive floating steel brake rotors + gold anodized carriers + radial Stylema R calipers
            for (const s of [-1, 1]) {
              const z = s * 0.072;
              cyl(w, 0.175, 0.175, 0.007, 36, rotorDiscMat, [0, 0, z], [Math.PI / 2, 0, 0]);
              torus(w, 0.172, 0.005, chromeMat(), [0, 0, z]);
              torus(w, 0.118, 0.011, ohlinsGold, [0, 0, z]);
              for (let b = 0; b < 10; b++) {
                const ba = (b / 10) * Math.PI * 2;
                cyl(w, 0.0055, 0.0055, 0.012, 8, ohlinsGold, [Math.cos(ba) * 0.132, Math.sin(ba) * 0.132, z], [Math.PI / 2, 0, 0]);
              }
              // Radial Brembo Stylema R monobloc 4-piston caliper + cooling fins + GP4 carbon brake cooling scoop
              rbox(g, 0.095, 0.062, 0.046, 0.012, titanium, [x - 0.148, -0.15, z], [0, 0, 0.52]);
              rbox(g, 0.048, 0.018, 0.048, 0.004, ducatiRed, [x - 0.152, -0.15, z], [0, 0, 0.52]);
              rbox(g, 0.115, 0.068, 0.038, 0.008, carbon, [x - 0.11, -0.19, z * 1.15], [0, 0, 0.42]);
            }
          } else {
            // Single-sided exposed right wheel face with central titanium cone nut & left-side 245mm cross-drilled rear brake disc
            cyl(w, 0.044, 0.034, 0.036, 20, ohlinsGold, [0, 0, 0.095], [Math.PI / 2, 0, 0]);
            cyl(w, 0.128, 0.128, 0.007, 32, rotorDiscMat, [0, 0, -0.088], [Math.PI / 2, 0, 0]);
            rbox(g, 0.072, 0.048, 0.038, 0.008, titanium, [x + 0.10, -0.12, -0.088], [0, 0, -0.45]);
          }
        }
      } },
    { id: 'sculpted-tank-monoposto-tail', name: 'Brushed-Aluminum 17L Fuel Tank, Race Saddle & Flying-Buttress Monoposto Tail', category: 'Ergonomics & Tail Aero', isOuter: true, explodeOffset: [-0.55, 1.15, 0],
      desc: 'Hand-brushed 17-liter aluminum fuel tank extending under the rider seat, two-tone Ducati Red/exposed aluminum knee recesses, Alcantara race saddle, and twin open-tunnel aerodynamic tail cowling.',
      funFact: 'Just like a MotoGP prototype, part of the Panigale V4 R’s 17-liter aluminum fuel tank sits underneath the rider’s seat to centralize mass!',
      build(g) {
        // 1. True 3D Multi-Station Lofted Muscular 17L Fuel Tank (smooth organic curvature, replaces boxy extruded slabs!)
        buildMultiSectionLoft(g, panigaleTankStations, { radialSegs: 36, material: ducatiRed });
        // Conformal exposed hand-brushed aluminum knee recesses & white Ducati Corse shoulder stripes on both tank flanks
        for (const s of [-1, 1]) {
          buildConformalLoftPatch(g, panigaleTankStations, {
            xFront: 0.16, xBack: -0.14,
            angBottomFront: 0.72 * s, angTopFront: 1.48 * s,
            angBottomBack: 0.65 * s, angTopBack: 1.45 * s,
            offset: 0.0035, uSteps: 10, vSteps: 6, material: alu,
          });
          buildConformalLoftPatch(g, panigaleTankStations, {
            xFront: 0.36, xBack: 0.02,
            angBottomFront: 0.42 * s, angTopFront: 0.62 * s,
            angBottomBack: 0.42 * s, angTopBack: 0.62 * s,
            offset: 0.004, uSteps: 8, vSteps: 4, material: corseWhite,
          });
        }
        // CNC billet quick-release racing fuel cap + front airbox carbon vent
        cyl(g, 0.035, 0.035, 0.016, 20, alu, [0.23, 0.455, 0], [0, 0, -0.18]);
        cyl(g, 0.022, 0.022, 0.020, 14, darkMetal, [0.23, 0.458, 0], [0, 0, -0.18]);
        rbox(g, 0.08, 0.022, 0.09, 0.006, carbon, [0.39, 0.385, 0], [0, 0, -0.32]);

        // 2. Contoured 3D Non-Slip Alcantara Racing Saddle + Sculpted Ducati Corse Bum Stop
        const saddleStations = [
          { x: -0.40, y: 0.24, rTop: 0.025, rBot: 0.018, rz: 0.095, n: 2.3, flatBottom: 0.8 },
          { x: -0.28, y: 0.22, rTop: 0.028, rBot: 0.020, rz: 0.112, n: 2.3, flatBottom: 0.8 },
          { x: -0.16, y: 0.21, rTop: 0.026, rBot: 0.018, rz: 0.085, n: 2.2, flatBottom: 0.8 },
          { x: -0.10, y: 0.22, rTop: 0.020, rBot: 0.015, rz: 0.055, n: 2.1, flatBottom: 0.8 },
        ];
        buildMultiSectionLoft(g, saddleStations, { radialSegs: 28, material: alcantara });

        // 3. Upswept Twin-Spar Monoposto Tail Section with Open "Flying Buttress" Air Channels
        const tailCenterStations = [
          { x: -0.94, y: 0.46, rTop: 0.012, rBot: 0.010, rz: 0.018, n: 2.0 },
          { x: -0.82, y: 0.42, rTop: 0.028, rBot: 0.022, rz: 0.052, n: 2.1 },
          { x: -0.66, y: 0.36, rTop: 0.042, rBot: 0.032, rz: 0.075, n: 2.2 },
          { x: -0.50, y: 0.30, rTop: 0.048, rBot: 0.035, rz: 0.085, n: 2.25 },
          { x: -0.38, y: 0.26, rTop: 0.045, rBot: 0.030, rz: 0.078, n: 2.2 },
        ];
        buildMultiSectionLoft(g, tailCenterStations, { radialSegs: 28, material: ducatiRed });
        // Conformal white & green Italian Tricolore MotoGP number board on tail spine
        buildConformalLoftPatch(g, tailCenterStations, {
          xFront: -0.46, xBack: -0.80,
          angBottomFront: -0.55, angTopFront: 0.55,
          angBottomBack: -0.55, angTopBack: 0.55,
          offset: 0.0035, uSteps: 8, vSteps: 6, material: corseWhite,
        });
        // Left & Right sculpted outer flying-buttress tail wing fairings framing open air channels
        for (const s of [-1, 1]) {
          const tailWingStations = [
            { x: -0.94, y: 0.46, rTop: 0.014, rBot: 0.012, rz: 0.014, zCenter: s * 0.028, n: 2.0 },
            { x: -0.78, y: 0.41, rTop: 0.026, rBot: 0.022, rz: 0.024, zCenter: s * 0.078, n: 2.1, chine: 0.25 },
            { x: -0.58, y: 0.33, rTop: 0.032, rBot: 0.024, rz: 0.026, zCenter: s * 0.105, n: 2.15, chine: 0.25 },
            { x: -0.40, y: 0.25, rTop: 0.026, rBot: 0.020, rz: 0.022, zCenter: s * 0.095, n: 2.1 },
          ];
          buildMultiSectionLoft(g, tailWingStations, { radialSegs: 24, material: ducatiRed });
          // Twin boomerang-shaped glowing crimson LED taillight blades under tail arch
          tube(g, [
            [-0.78, 0.39, s * 0.075],
            [-0.86, 0.42, s * 0.058],
            [-0.92, 0.44, s * 0.028],
          ], 0.009, emissiveMat(0xef4444, 2.5));
        }
      } },
    { id: 'motogp-biplane-winglets-fairing', name: 'Sculpted Nose Fairing, Double-Bubble Screen, Shark-Gill Panels & Biplane Winglets', category: 'Aerodynamics & Body', isOuter: true, explodeOffset: [0.65, 1.10, 0],
      desc: 'Multi-piece wind-tunnel sculpted front nose fairing with dual ram-air nostrils, squinting V-shaped LED DRL headlights, polycarbonate double-bubble racing windscreen, twin-extractor shark-gill side fairings, carbon belly pan, and MotoGP biplane carbon downforce winglets.',
      funFact: 'At 300 km/h (186 mph), the sculpted carbon biplane winglets press the front tire into the asphalt with 37 kg (82 lbs) of aerodynamic downforce!',
      build(g) {
        // 1. Compound-Curved 3D Lofted Front Nose Cowl (replaces boxy extruded slabs!)
        buildMultiSectionLoft(g, panigaleNoseStations, { radialSegs: 36, material: ducatiRed });
        // Conformal Ducati Corse white nose number plate & Italian Tricolore pinstripe
        buildConformalLoftPatch(g, panigaleNoseStations, {
          xFront: 0.90, xBack: 0.62,
          angBottomFront: -0.48, angTopFront: 0.48,
          angBottomBack: -0.52, angTopBack: 0.52,
          offset: 0.0035, uSteps: 8, vSteps: 6, material: corseWhite,
        });
        buildConformalLoftPatch(g, panigaleNoseStations, {
          xFront: 0.89, xBack: 0.63,
          angBottomFront: -0.56, angTopFront: -0.48,
          angBottomBack: -0.60, angTopBack: -0.52,
          offset: 0.004, uSteps: 8, vSteps: 3, material: tricoloreGreen,
        });

        for (const s of [-1, 1]) {
          // Recessed twin ram-air intake nostrils under nose brow + aggressive V-shaped Panigale LED DRL light tubes
          rbox(g, 0.11, 0.036, 0.058, 0.008, mat(0x090d16, { roughness: 0.9 }), [0.86, 0.235, s * 0.058], [0, s * -0.28, -0.28]);
          tube(g, [
            [0.92, 0.235, s * 0.028],
            [0.85, 0.258, s * 0.078],
            [0.75, 0.295, s * 0.132],
            [0.81, 0.278, s * 0.145],
          ], 0.0075, emissiveMat(0xf8fafc, 2.6));
          sphere(g, 0.018, 14, 12, emissiveMat(0xe0f2fe, 2.2), [0.83, 0.25, s * 0.092]);
          // Aero stealth winglet rear-view mirrors with integrated amber LED turn signals on upper nose ears
          rbox(g, 0.085, 0.012, 0.115, 0.004, darkMetal, [0.58, 0.43, s * 0.195], [s * 0.28, s * -0.22, -0.25]);
          rbox(g, 0.048, 0.007, 0.075, 0.002, emissiveMat(0xf59e0b, 1.8), [0.60, 0.432, s * 0.215], [s * 0.28, s * -0.22, -0.25]);
        }

        // 2. True 3D Compound-Curved Double-Bubble Polycarbonate Racing Windscreen (`surfaceGrid` dome — zero flat sides!)
        const screenGeo = surfaceGrid(
          (u, v) => {
            // u = 0 (front nose brow x=0.78) -> u = 1 (upper rear edge x=0.42)
            // v = 0..1 across width (-1..+1)
            const w = (v - 0.5) * 2;
            const arch = 1 - w * w;
            const doubleBubble = Math.max(0, 1 - Math.pow(w / 0.65, 2)) * 0.042 * Math.sin(u * Math.PI * 0.85);
            const x = 0.78 - u * 0.35 - (1 - arch) * 0.08;
            const y = 0.33 + u * 0.20 + arch * 0.045 + doubleBubble;
            const z = w * (0.095 + u * 0.055);
            return [x, y, z];
          },
          { ns: 16, nt: 18, outward: [0.3, 1, 0] },
        );
        addSmoothMesh(g, screenGeo, glassMat(0xbae6fd, 0.36));

        // 3. Compound-Curved Left & Right Shark-Gill Side Fairings Wrapping Organically Around the V4 Engine
        for (const s of [-1, 1]) {
          const fairingGeo = surfaceGrid(
            (u, v) => {
              // u = 0 (lower belly edge) -> u = 1 (upper shoulder edge below tank/bars)
              // v = 0 (rear edge exposing bronze clutch) -> v = 1 (front wheel arch edge)
              const xRear = 0.08 + u * 0.06;
              const xFront = 0.56 + Math.sin(u * Math.PI) * 0.16;
              const x = xRear + (xFront - xRear) * v;
              const yBot = -0.18 + (1 - v) * 0.14;
              const yTop = 0.24 + v * 0.11;
              const y = yBot + (yTop - yBot) * u;
              const bow = Math.sin(u * Math.PI) * 0.048 + Math.sin(v * Math.PI) * 0.022;
              const z = s * (0.118 + bow);
              return [x, y, z];
            },
            { ns: 16, nt: 18, outward: [0, 0, s] },
          );
          addSmoothMesh(g, fairingGeo, ducatiRed);

          // Conformal white/green Ducati Corse diagonal livery band on side fairing
          const stripeGeo = surfaceGrid(
            (u, v) => {
              const uSub = 0.42 + u * 0.18;
              const vSub = 0.18 + v * 0.68;
              const xRear = 0.08 + uSub * 0.06;
              const xFront = 0.56 + Math.sin(uSub * Math.PI) * 0.16;
              const x = xRear + (xFront - xRear) * vSub;
              const yBot = -0.18 + (1 - vSub) * 0.14;
              const yTop = 0.24 + vSub * 0.11;
              const y = yBot + (yTop - yBot) * uSub;
              const bow = Math.sin(uSub * Math.PI) * 0.048 + Math.sin(vSub * Math.PI) * 0.022;
              const z = s * (0.122 + bow);
              return [x, y, z];
            },
            { ns: 6, nt: 12, outward: [0, 0, s] },
          );
          addSmoothMesh(g, stripeGeo, corseWhite);

          // Upper & lower sculpted Shark-Gill hot-air extractor louvers + recessed dark cooling vents
          for (let gill = 0; gill < 3; gill++) {
            const gx = 0.30 + gill * 0.072;
            const gy = 0.05 + gill * 0.028;
            rbox(g, 0.038, 0.125, 0.018, 0.004, mat(0x090d16, { roughness: 0.9 }), [gx, gy, s * 0.162], [s * -0.12, s * -0.10, -0.38]);
            rbox(g, 0.016, 0.130, 0.022, 0.003, ducatiRed, [gx + 0.018, gy, s * 0.168], [s * -0.12, s * -0.18, -0.38]);
          }

          // 4. Double-Plane Carbon-Fiber MotoGP Biplane Downforce Winglets (cambered upper & lower airfoils + endplate)
          for (const [wy, wc, wzSpan] of [[0.245, 0.19, 0.125], [0.185, 0.155, 0.110]]) {
            const wingGeo = surfaceGrid(
              (u, v) => {
                // u = chord (0 front leading edge -> 1 trailing edge), v = span (0 root -> 1 tip)
                const sweep = v * 0.045;
                const x = 0.72 - sweep - u * wc * (1 - v * 0.18);
                const camber = Math.sin(u * Math.PI) * 0.014 - u * 0.028 - v * 0.018;
                const y = wy + camber;
                const z = s * (0.165 + v * wzSpan);
                return [x, y, z];
              },
              { ns: 10, nt: 10, outward: [0, 1, 0] },
            );
            addSmoothMesh(g, wingGeo, carbon);
          }
          // Sculpted carbon-fiber biplane winglet outer endplate + Ducati Corse red strake
          rbox(g, 0.175, 0.082, 0.008, 0.003, carbon, [0.61, 0.205, s * 0.285], [0, s * -0.14, -0.22]);
          rbox(g, 0.135, 0.015, 0.011, 0.003, ducatiRed, [0.61, 0.242, s * 0.288], [0, s * -0.14, -0.22]);
        }

        // 5. Lofted Aerodynamic Aluminum/Carbon Lower Belly Pan (hugs engine sump & Akrapovič silencers)
        const bellyPanStations = [
          { x: -0.26, y: -0.23, rTop: 0.035, rBot: 0.045, rz: 0.118, n: 2.3, flatBottom: 0.78 },
          { x: -0.04, y: -0.24, rTop: 0.045, rBot: 0.055, rz: 0.132, n: 2.35, flatBottom: 0.78 },
          { x: 0.22,  y: -0.24, rTop: 0.052, rBot: 0.058, rz: 0.138, n: 2.35, flatBottom: 0.78 },
          { x: 0.44,  y: -0.21, rTop: 0.048, rBot: 0.052, rz: 0.125, n: 2.25, flatBottom: 0.75 },
          { x: 0.58,  y: -0.14, rTop: 0.025, rBot: 0.030, rz: 0.075, n: 2.1 },
        ];
        buildMultiSectionLoft(g, bellyPanStations, { radialSegs: 28, material: alu });

        // 6. Sculpted 3D Front Mudguard hugging the 17" Pirelli front tire + carbon fork tube guards
        const fenderStations = [
          { x: 0.65, y: 0.02, rTop: 0.022, rBot: 0.015, rz: 0.074, n: 2.1, flatBottom: 0.8 },
          { x: 0.74, y: 0.06, rTop: 0.026, rBot: 0.018, rz: 0.078, n: 2.1, flatBottom: 0.8 },
          { x: 0.84, y: 0.05, rTop: 0.024, rBot: 0.016, rz: 0.076, n: 2.1, flatBottom: 0.8 },
          { x: 0.92, y: -0.01, rTop: 0.016, rBot: 0.012, rz: 0.064, n: 2.0, flatBottom: 0.8 },
        ];
        buildMultiSectionLoft(g, fenderStations, { radialSegs: 24, material: ducatiRed });
        for (const s of [-1, 1]) {
          rbox(g, 0.10, 0.13, 0.012, 0.004, carbon, [0.74, -0.08, s * 0.082], [0, 0, 0.38]);
        }
        buildHexBoltArray(g, [[0.38, 0.22, 0.165], [0.38, 0.22, -0.165], [0.52, 0.02, 0.165], [0.52, 0.02, -0.165]], { radius: 0.007, height: 0.012 });
      } },
  ];
  return {
    id: 'ducati-panigale-v4', name: 'Ducati Panigale V4 R Superbike', brand: 'Ducati Corse', badge: '237 hp • 16,500 RPM Desmo V4 R',
    desc: 'WorldSBK homologation 998cc V4 R superbike with Desmodromic titanium valves, open STM EVO-SBK dry clutch, full-race Akrapovič titanium exhaust, Öhlins NPX/TTX36 suspension, Brembo Stylema R brakes, and MotoGP biplane carbon winglets.',
    cameraPos: [3.1, 1.65, 3.1], parts,
    quiz: [
      { q: 'How does Ducati’s Desmodromic system close engine valves at 16,500 RPM without steel springs?', correctId: 'desmosedici-v4-engine', distractors: ['ohlins-npx-forks-monoshock', 'motogp-biplane-winglets-fairing', 'aluminum-front-frame-swingarm'] },
      { q: 'What do the carbon-fiber biplane winglets on the front fairing do at 300 km/h?', correctId: 'motogp-biplane-winglets-fairing', distractors: ['brembo-stylema-marchesini-wheels', 'aluminum-front-frame-swingarm', 'ohlins-npx-forks-monoshock'] },
      { q: 'Why are the Öhlins NPX inverted front fork tubes coated in bright gold Titanium Nitride?', correctId: 'ohlins-npx-forks-monoshock', distractors: ['desmosedici-v4-engine', 'brembo-stylema-marchesini-wheels', 'motogp-biplane-winglets-fairing'] },
      { q: 'Which hollow cast-aluminum rear arm holds the rear wheel from one side for lightning-fast pit-stop tire swaps?', correctId: 'single-sided-swingarm-chain', distractors: ['sculpted-tank-monoposto-tail', 'motogp-biplane-winglets-fairing', 'ohlins-npx-forks-monoshock'] },
      { q: 'Which forged magnesium wheels and Brembo Stylema radial monobloc calipers shed unsprung weight for razor-sharp cornering?', correctId: 'brembo-stylema-marchesini-wheels', distractors: ['akrapovic-titanium-exhaust', 'sculpted-tank-monoposto-tail', 'aluminum-front-frame-swingarm'] },
    ],
  };
}

export const HELICOPTER_MODELS = [buildBlackHawkModel(), buildH145Model(), buildDjiMavicModel(), buildIngenuityModel()];
export const WATCH_MODELS = [buildSwissChronographModel(), buildGrandfatherClockModel()];
export const BIKE_MODELS = [buildTernGsdModel(), buildCarbonRoadBikeModel(), buildDucatiPanigaleModel()];

export const HELICOPTERS_CATEGORY = {
  id: 'helicopters', name: 'Helicopters & Drones', fullName: 'Military, Rescue, Mars & Quadcopter Rotorcraft', emoji: '🚁', icon: '🚁',
  tagline: 'Sikorsky UH-60M Black Hawk • Airbus H145 Medevac • DJI Mavic 3 Pro • NASA Ingenuity Mars Helicopter (CAD)',
  models: HELICOPTER_MODELS,
};

export const WATCHES_CATEGORY = {
  id: 'watches', name: 'Mechanical Watch & Clock', fullName: 'Haute Horlogerie Chronographs & Longcase Clocks', emoji: '⌚', icon: '⌚',
  tagline: 'Swiss Automatic Mechanical Chronograph • Longcase Westminster Pendulum Clock',
  models: WATCH_MODELS,
};

export const BIKES_CATEGORY = {
  id: 'bikes', name: 'Bikes & Motorcycles', fullName: 'Tern GSD E-Cargo Bike, Carbon Road Bikes & MotoGP Superbikes', emoji: '🚲', icon: '🚲',
  tagline: 'Tern GSD S10 Electric Cargo Bike • Tour-Grade Carbon Aero Road Bike (CAD) • Ducati Panigale V4 R Superbike',
  models: BIKE_MODELS,
};
