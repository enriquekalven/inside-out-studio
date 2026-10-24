// Multi-Asset Real CAD Mesh Loader & Sub-Assembly Distributor (`app/assets/models/*.glb`) for Inside Out Studio.
// Loads and caches all 7 open-licensed CAD GLB models:
//  1. `ferrari.glb` (358,788 triangles, 58 named nodes — Ferrari 458/SF90 CAD)
//  2. `car_concept.glb` (162,766 vertices, 101 named nodes — Khronos CarConcept full automotive CAD)
//  3. `buggy.glb` (245,673 vertices, 205 nodes — Khronos Okino CAD spaceframe buggy & suspension)
//  4. `engine_cad.glb` (55,843 vertices, 82 nodes — Khronos Okino 2-Cylinder Engine CAD with pistons, rods & gears)
//  5. `gearbox_cad.glb` (229,801 vertices, 118 nodes — Khronos Okino Multi-Shaft Spur Gearbox CAD)
//  6. `global_hawk.glb` (NASA RQ-4 Global Hawk high-altitude jet aircraft CAD)
//  7. `space_shuttle_eng.glb` (NASA RS-25 / SSME Cryogenic Liquid Rocket Engine CAD)
import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from '../vendor/DRACOLoader.js';
import {
  mat,
  carPaint,
  brushedMetal,
  chromeMat,
  carbonFiberMat,
  glassMat,
  emissiveMat,
  tireTreadTexture,
} from './materials.js';

const cadCache = {
  ferrari: null,
  carConcept: null,
  buggy: null,
  engineCad: null,
  gearboxCad: null,
  globalHawk: null,
  rocketEng: null,
  issNasa: null,
  shuttleEt: null,
  shuttleSrb: null,
  shuttlePayload: null,
  shuttleOds: null,
  saturnV: null,
  perseverance: null,
  ingenuity: null,
  chronographWatch: null,
  carbonBike: null,
};

let loadPromise = null;
const readyListeners = new Set();
const upgradeRegistry = new Map();

function clearProceduralFallbacks(targetGroup) {
  if (!targetGroup || !targetGroup.children) return;
  for (let i = targetGroup.children.length - 1; i >= 0; i--) {
    const ch = targetGroup.children[i];
    if (!ch.userData?.isCadWrapper) {
      targetGroup.remove(ch);
    }
  }
}

export function attachCadWrapper(targetGroup, wrapper) {
  if (!targetGroup || !wrapper) return false;
  wrapper.userData.isCadWrapper = true;
  clearProceduralFallbacks(targetGroup);
  targetGroup.add(wrapper);
  return true;
}

function registerCadUpgrade(assetKey, targetGroup, applyFn) {
  if (cadCache[assetKey]) {
    return applyFn(cadCache[assetKey]);
  }
  preloadCadAssets();
  if (!upgradeRegistry.has(assetKey)) {
    upgradeRegistry.set(assetKey, []);
  }
  upgradeRegistry.get(assetKey).push({ targetGroup, applyFn });
  return false;
}

function flushUpgradesForKey(assetKey) {
  const root = cadCache[assetKey];
  if (!root) return;
  const list = upgradeRegistry.get(assetKey);
  if (!list) return;
  upgradeRegistry.delete(assetKey);
  for (const item of list) {
    try {
      if (item.targetGroup && item.targetGroup.parent) {
        item.applyFn(root);
      }
    } catch {
      // ignore individual upgrade error
    }
  }
}

// 1. Ferrari alignment transform: rotates -90 deg around Y (so -Z front in GLB becomes +X front in Studio)
// and shifts Y by -0.56 so tire bottoms sit on the studio floor and wheel centers sit at y = -0.20.
const FERRARI_ALIGN_MATRIX = new THREE.Matrix4();
{
  const alignObj = new THREE.Object3D();
  alignObj.rotation.y = -Math.PI / 2;
  alignObj.position.set(0.15, -0.56, 0);
  alignObj.updateMatrix();
  FERRARI_ALIGN_MATRIX.copy(alignObj.matrix);
}

// 2. CarConcept alignment transform: in CarConcept.glb, +Z is front, +Y is up, wheel centers at y=0.384.
// Rotating +90 deg around Y maps +Z (front) -> +X (Studio front), +X (left) -> -Z, with wheel centers at y = -0.20.
const CAR_CONCEPT_ALIGN_MATRIX = new THREE.Matrix4();
{
  const alignObj = new THREE.Object3D();
  alignObj.rotation.y = Math.PI / 2;
  alignObj.scale.set(0.92, 0.94, 0.92);
  alignObj.position.set(-0.08, -0.56, 0);
  alignObj.updateMatrix();
  CAR_CONCEPT_ALIGN_MATRIX.copy(alignObj.matrix);
}

export function isFerrariCadReady() {
  return Boolean(cadCache.ferrari);
}

export function areAllCadAssetsReady() {
  return Boolean(
    cadCache.ferrari &&
      cadCache.carConcept &&
      cadCache.buggy &&
      cadCache.engineCad &&
      cadCache.gearboxCad &&
      cadCache.rocketEng &&
      cadCache.issNasa &&
      cadCache.shuttleEt &&
      cadCache.shuttleSrb &&
      cadCache.shuttlePayload &&
      cadCache.shuttleOds &&
      cadCache.saturnV &&
      cadCache.perseverance &&
      cadCache.ingenuity &&
      cadCache.chronographWatch &&
      cadCache.carbonBike,
  );
}

export function onCadReady(fn) {
  if (areAllCadAssetsReady()) {
    fn();
    return () => {};
  }
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

function notifyListeners() {
  for (const listener of readyListeners) {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  }
}

function markSharedCadGeometries(root) {
  if (!root) return;
  // Straighten CarConcept's baked-in 30-degree front-wheel turn so wheels align straight in wheel arches
  for (const wName of ['WheelFrontL', 'WheelFrontR']) {
    const wn = root.getObjectByName(wName);
    if (wn) {
      const eul = new THREE.Euler().setFromQuaternion(wn.quaternion, 'ZYX');
      eul.z = 0;
      wn.quaternion.setFromEuler(eul);
      wn.updateMatrix();
    }
  }
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.userData.sharedCad = true;
    }
  });
}

export function preloadCadAssets() {
  if (loadPromise) return loadPromise;

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./vendor/draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const loadOne = (key, url) =>
    new Promise((resolve) => {
      try {
        gltfLoader.load(
          url,
          (gltf) => {
            cadCache[key] = gltf.scene;
            markSharedCadGeometries(gltf.scene);
            flushUpgradesForKey(key);
            notifyListeners();
            resolve(gltf.scene);
          },
          undefined,
          () => resolve(null),
        );
      } catch {
        resolve(null);
      }
    });

  loadPromise = Promise.all([
    loadOne('ferrari', './assets/models/ferrari.glb'),
    loadOne('carConcept', './assets/models/car_concept.glb'),
    loadOne('buggy', './assets/models/buggy.glb'),
    loadOne('engineCad', './assets/models/engine_cad.glb'),
    loadOne('gearboxCad', './assets/models/gearbox_cad.glb'),
    loadOne('globalHawk', './assets/models/global_hawk.glb'),
    loadOne('rocketEng', './assets/models/space_shuttle_eng.glb'),
    loadOne('issNasa', './assets/models/iss_nasa.glb'),
    loadOne('shuttleEt', './assets/models/shuttle_et.glb'),
    loadOne('shuttleSrb', './assets/models/shuttle_srb.glb'),
    loadOne('shuttlePayload', './assets/models/shuttle_payload.glb'),
    loadOne('shuttleOds', './assets/models/shuttle_ods.glb'),
    loadOne('saturnV', './assets/models/saturn_v.glb'),
    loadOne('perseverance', './assets/models/perseverance_rover.glb'),
    loadOne('ingenuity', './assets/models/ingenuity_mars.glb'),
    loadOne('chronographWatch', './assets/models/chronograph_watch.glb'),
    loadOne('carbonBike', './assets/models/carbon_frame_bike.glb'),
  ]).then((results) => {
    dracoLoader.dispose();
    readyListeners.clear();
    return results;
  });

  return loadPromise;
}

function getCadMaterial(meshName, overrides = {}) {
  if (overrides[meshName]) return overrides[meshName];
  const n = (meshName || '').toLowerCase();
  if (
    n === 'body' ||
    n.startsWith('bodyhood') ||
    n.startsWith('bodydoor') ||
    n.startsWith('bodyrearpanels') ||
    n === 'bodyroofpanel' ||
    n === 'bodypillars'
  ) {
    if (n.includes('window')) return overrides.glass || glassMat(0x7dd3fc, 0.34);
    if (n.includes('handle') || n.includes('mirror')) return overrides.trim || chromeMat();
    if (n.includes('under') || n.includes('interior') || n.includes('grill')) {
      return overrides.trim || carbonFiberMat([5, 5]);
    }
    return overrides.body || carPaint(0xd40000);
  }
  if (n === 'bodypanelscolor2' || n === 'bodyunderside' || n.includes('gasket')) {
    return overrides.trim || carbonFiberMat([6, 6]);
  }
  if (n === 'glass' || n === 'bodywindshield' || n === 'bodyrearwindow' || n === 'bodywindowsrearsides') {
    return overrides.glass || glassMat(0x7dd3fc, 0.34);
  }
  if (n === 'lights' || n === 'leds' || n === 'bodyheadlights') return emissiveMat(0xf8fafc, 1.45);
  if (n === 'lights_red' || n === 'bodytaillights' || n === 'bodyturnsignalsrear') {
    return emissiveMat(0xff1818, 1.35);
  }
  if (n === 'steering_red_lights') return emissiveMat(0xff1e27, 1.6);
  if (n.includes('carbon') || n === 'interiorcage') return carbonFiberMat([6, 6]);
  if (
    n === 'chrome' ||
    n === 'metal' ||
    n === 'nuts' ||
    n === 'steering_metal' ||
    n === 'axles' ||
    n.includes('brakedisc') ||
    n.includes('pedal')
  ) {
    return chromeMat();
  }
  if (n === 'engine') {
    return brushedMetal(0xd1d5db, { metalness: 0.88, roughness: 0.22 });
  }
  if (n.startsWith('rim_') || n === 'wheel') {
    return overrides.rim || brushedMetal(0xe2e8f0, { metalness: 0.92, roughness: 0.14 });
  }
  if (n === 'tire') {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tireTreadTexture(),
      roughness: 0.72,
      metalness: 0.08,
    });
  }
  if (n === 'brake' || n === 'brakes' || n.includes('brakepad')) {
    return overrides.caliper || carPaint(0xffd100, { metalness: 0.45, roughness: 0.16 });
  }
  if (n === 'centre' || n === 'yellow_trim' || n === 'steering_centre') {
    return overrides.accent || carPaint(0xffd100);
  }
  if (n === 'leather' || n === 'steering_leather' || n.startsWith('interiorseats')) {
    return overrides.leather || mat(0xb45309, { roughness: 0.38, metalness: 0.08 });
  }
  if (n === 'interior_light' || n.startsWith('interiordash')) {
    return overrides.dash || brushedMetal(0x475569, { metalness: 0.65, roughness: 0.32 });
  }
  return mat(0x181c24, { roughness: 0.46, metalness: 0.25 });
}

/**
 * Clones one or more named CAD nodes from `ferrari.glb` into `targetGroup`, aligned in Studio coordinates.
 */
export function addFerrariCadNodes(targetGroup, nodeNames, materialOverrides = {}, transformOverride = null) {
  const ferrariRoot = cadCache.ferrari;
  if (!ferrariRoot) return false;
  let addedAny = false;

  const baseAlign = transformOverride
    ? new THREE.Matrix4().multiplyMatrices(transformOverride, FERRARI_ALIGN_MATRIX)
    : FERRARI_ALIGN_MATRIX;

  for (const name of nodeNames) {
    const srcNode = ferrariRoot.getObjectByName(name);
    if (!srcNode) continue;

    if (name.startsWith('wheel_')) {
      const isFront = name === 'wheel_fl' || name === 'wheel_fr';
      const worldMat = new THREE.Matrix4().multiplyMatrices(baseAlign, srcNode.matrixWorld);
      const hubPos = new THREE.Vector3();
      worldMat.decompose(hubPos, new THREE.Quaternion(), new THREE.Vector3());

      const steerGroup = new THREE.Group();
      steerGroup.position.copy(hubPos);
      if (isFront) steerGroup.userData.steerRole = 'front-wheel';
      targetGroup.add(steerGroup);

      const spinGroup = new THREE.Group();
      spinGroup.userData.driveRole = 'wheel';
      steerGroup.add(spinGroup);

      srcNode.traverse((child) => {
        if (!child.isMesh) return;
        const m = new THREE.Mesh(child.geometry, getCadMaterial(child.name, materialOverrides));
        const childStudioMat = new THREE.Matrix4().multiplyMatrices(baseAlign, child.matrixWorld);
        const localToSteer = new THREE.Matrix4()
          .makeTranslation(-hubPos.x, -hubPos.y, -hubPos.z)
          .multiply(childStudioMat);
        localToSteer.decompose(m.position, m.quaternion, m.scale);
        m.castShadow = true;
        m.receiveShadow = true;
        if (child.name === 'brake') {
          m.userData.driveRole = 'brake-caliper';
          steerGroup.add(m);
        } else {
          spinGroup.add(m);
        }
        addedAny = true;
      });
      continue;
    }

    if (name === 'steering_wheel') {
      const worldMat = new THREE.Matrix4().multiplyMatrices(baseAlign, srcNode.matrixWorld);
      const swPos = new THREE.Vector3();
      worldMat.decompose(swPos, new THREE.Quaternion(), new THREE.Vector3());

      const swGroup = new THREE.Group();
      swGroup.position.copy(swPos);
      swGroup.userData.steerRole = 'steering-wheel';
      targetGroup.add(swGroup);

      srcNode.traverse((child) => {
        if (!child.isMesh) return;
        const m = new THREE.Mesh(child.geometry, getCadMaterial(child.name, materialOverrides));
        const childStudioMat = new THREE.Matrix4().multiplyMatrices(baseAlign, child.matrixWorld);
        const localMat = new THREE.Matrix4()
          .makeTranslation(-swPos.x, -swPos.y, -swPos.z)
          .multiply(childStudioMat);
        localMat.decompose(m.position, m.quaternion, m.scale);
        m.castShadow = true;
        m.receiveShadow = true;
        swGroup.add(m);
        addedAny = true;
      });
      continue;
    }

    srcNode.traverse((child) => {
      if (!child.isMesh) return;
      const m = new THREE.Mesh(child.geometry, getCadMaterial(child.name, materialOverrides));
      const studioMat = new THREE.Matrix4().multiplyMatrices(baseAlign, child.matrixWorld);
      studioMat.decompose(m.position, m.quaternion, m.scale);
      m.castShadow = true;
      m.receiveShadow = true;
      targetGroup.add(m);
      addedAny = true;
    });
  }

  return addedAny;
}

/**
 * Clones one or more named CAD nodes from `car_concept.glb` (97 named automotive CAD meshes)
 * into `targetGroup`, aligned in Studio coordinates.
 */
export function addCarConceptCadNodes(targetGroup, nodeNames, materialOverrides = {}, transformOverride = null) {
  const root = cadCache.carConcept;
  if (!root) return false;
  let addedAny = false;

  const baseAlign = transformOverride
    ? new THREE.Matrix4().multiplyMatrices(transformOverride, CAR_CONCEPT_ALIGN_MATRIX)
    : CAR_CONCEPT_ALIGN_MATRIX;

  for (const name of nodeNames) {
    const lookupName = name === 'InteriorSteeringWheel' ? 'InteriorSteeringCylinder' : name;
    const srcNode = root.getObjectByName(lookupName) || root.getObjectByName(name);
    if (!srcNode) continue;

    if (name === 'WheelFrontL' || name === 'WheelFrontR' || name === 'WheelRearL' || name === 'WheelRearR') {
      const isFront = name === 'WheelFrontL' || name === 'WheelFrontR';
      const worldMat = new THREE.Matrix4().multiplyMatrices(baseAlign, srcNode.matrixWorld);
      const hubPos = new THREE.Vector3();
      worldMat.decompose(hubPos, new THREE.Quaternion(), new THREE.Vector3());

      const steerGroup = new THREE.Group();
      steerGroup.position.copy(hubPos);
      if (isFront) steerGroup.userData.steerRole = 'front-wheel';
      targetGroup.add(steerGroup);

      const spinGroup = new THREE.Group();
      spinGroup.userData.driveRole = 'wheel';
      steerGroup.add(spinGroup);

      srcNode.traverse((child) => {
        if (!child.isMesh) return;
        const cName = child.name || '';
        const isBrakePad = /BrakePad/i.test(cName);
        const isBrakeDisc = /BrakeDisc/i.test(cName);
        if (materialOverrides.excludeBrakes && (isBrakePad || isBrakeDisc)) return;

        const isRim = /Rim/i.test(cName);
        const matKey = isBrakePad ? 'brake' : isBrakeDisc ? 'brakedisc' : isRim ? 'wheel' : 'tire';
        const m = new THREE.Mesh(child.geometry, getCadMaterial(matKey, materialOverrides));
        const childStudioMat = new THREE.Matrix4().multiplyMatrices(baseAlign, child.matrixWorld);
        const localToSteer = new THREE.Matrix4()
          .makeTranslation(-hubPos.x, -hubPos.y, -hubPos.z)
          .multiply(childStudioMat);
        localToSteer.decompose(m.position, m.quaternion, m.scale);
        m.castShadow = true;
        m.receiveShadow = true;
        if (isBrakePad) {
          m.userData.driveRole = 'brake-caliper';
          steerGroup.add(m);
        } else {
          spinGroup.add(m);
        }
        addedAny = true;
      });
      continue;
    }

    const isSteerWheel = name.startsWith('InteriorSteeringWheel') || lookupName === 'InteriorSteeringCylinder';
    let hostGroup = targetGroup;
    let pivotPos = null;

    if (isSteerWheel) {
      const worldMat = new THREE.Matrix4().multiplyMatrices(baseAlign, srcNode.matrixWorld);
      pivotPos = new THREE.Vector3();
      worldMat.decompose(pivotPos, new THREE.Quaternion(), new THREE.Vector3());
      const swGroup = new THREE.Group();
      swGroup.position.copy(pivotPos);
      swGroup.userData.steerRole = 'steering-wheel';
      targetGroup.add(swGroup);
      hostGroup = swGroup;
    }

    const collectMeshes = [];
    if (isSteerWheel) {
      srcNode.traverse((ch) => {
        if (ch.isMesh) collectMeshes.push(ch);
      });
    } else {
      // Only clone meshes that belong to srcNode itself (not named descendant nodes like WheelFrontL on BodyUnderside)
      if (srcNode.isMesh) {
        collectMeshes.push(srcNode);
      }
      if (srcNode.children) {
        for (const ch of srcNode.children) {
          if (ch.isMesh && (!ch.name || ch.name.startsWith('mesh_') || ch.name.startsWith(`${srcNode.name}_`))) {
            collectMeshes.push(ch);
          }
        }
      }
    }

    for (const child of collectMeshes) {
      const matName = child.parent?.name && child.name.startsWith('mesh_') ? child.parent.name : child.name || name;
      const m = new THREE.Mesh(child.geometry, getCadMaterial(matName, materialOverrides));
      const studioMat = new THREE.Matrix4().multiplyMatrices(baseAlign, child.matrixWorld);
      if (pivotPos) {
        const localMat = new THREE.Matrix4()
          .makeTranslation(-pivotPos.x, -pivotPos.y, -pivotPos.z)
          .multiply(studioMat);
        localMat.decompose(m.position, m.quaternion, m.scale);
      } else {
        studioMat.decompose(m.position, m.quaternion, m.scale);
      }
      m.castShadow = true;
      m.receiveShadow = true;
      hostGroup.add(m);
      addedAny = true;
    }
  }

  return addedAny;
}

/**
 * Attaches real mechanical CAD engine components from `engine_cad.glb` (82 nodes: finned cylinders,
 * crankcase, connecting rods, bevel gears, lifters, valve springs).
 * @param {THREE.Group} targetGroup
 * @param {object} opts
 * @param {'all'|'block'|'crankcase'|'rods'} [opts.partType='all']
 */
export function addEngineCadSubassembly(targetGroup, arg1 = {}, arg2) {
  let opts = arg1;
  if (Array.isArray(arg1)) {
    opts = { pos: arg1, scale: typeof arg2 === 'number' ? arg2 : 0.0012 };
  }
  const rawPos = opts?.pos || opts?.position || [0, 0, 0];
  const rawRot = opts?.rot || opts?.rotation || [0, 0, 0];
  const rawScale = typeof opts?.scale === 'number' ? opts.scale : 0.00065;
  const scale = rawScale > 0.0014 ? 0.00065 : rawScale;
  const {
    partType = 'all',
    primaryColor = 0xd1d5db,
    accentColor = 0xd40000,
  } = opts || {};

  const root = cadCache.engineCad;
  if (!root) return false;

  const wrapper = new THREE.Group();
  wrapper.position.set(rawPos[0], rawPos[1], rawPos[2]);
  wrapper.rotation.set(rawRot[0], rawRot[1], rawRot[2]);
  wrapper.scale.setScalar(scale);

  const aluMat = brushedMetal(primaryColor, { metalness: 0.88, roughness: 0.22 });
  const chrome = chromeMat();
  const accentMat = carPaint(accentColor);
  const darkSteel = brushedMetal(0x334155, { metalness: 0.9, roughness: 0.2 });

  let count = 0;
  const box = new THREE.Box3();
  const ctr = new THREE.Vector3();

  root.traverse((child) => {
    if (!child.isMesh) return;
    box.setFromObject(child);
    box.getCenter(ctr);
    const isRodOrLifter = /rod|Lifter/i.test(child.name || '') || /rod|Lifter/i.test(child.parent?.name || '');
    const isUpper = ctr.y > -20;

    if (partType === 'rods' && !isRodOrLifter) return;
    if (partType === 'block' && (!isUpper || isRodOrLifter)) return;
    if (partType === 'crankcase' && (isUpper || isRodOrLifter)) return;

    let chosenMat = aluMat;
    if (isRodOrLifter) chosenMat = chrome;
    else if (ctr.y > 45) chosenMat = accentMat;
    else if (!isUpper) chosenMat = darkSteel;

    const m = new THREE.Mesh(child.geometry, chosenMat);
    child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    m.position.x += 0.8;
    m.position.y += 36.5;
    m.position.z += 2.4;
    if (isRodOrLifter) {
      m.userData.driveAnim = 'piston';
      m.userData.baseY = m.position.y;
      m.userData.phase = count * 1.1;
    }
    m.castShadow = true;
    m.receiveShadow = true;
    wrapper.add(m);
    count++;
  });

  if (count > 0) {
    targetGroup.add(wrapper);
    return true;
  }
  return false;
}

/**
 * Attaches real mechanical CAD multi-shaft spur/helical gearbox assembly from `gearbox_cad.glb` (118 nodes).
 */
export function addGearboxCadSubassembly(targetGroup, arg1 = {}, arg2) {
  let opts = arg1;
  if (Array.isArray(arg1)) {
    opts = { pos: arg1, scale: typeof arg2 === 'number' ? arg2 : 0.012 };
  }
  const rawPos = opts?.pos || opts?.position || [-1.38, -0.18, 0];
  const rawRot = opts?.rot || opts?.rotation || [0, 0, 0];
  const rawScale = typeof opts?.scale === 'number' ? opts.scale : 0.012;
  const scale = rawScale > 0.03 ? 0.0085 : rawScale;

  const root = cadCache.gearboxCad;
  if (!root) return false;

  const wrapper = new THREE.Group();
  wrapper.position.set(rawPos[0], rawPos[1], rawPos[2]);
  wrapper.rotation.set(rawRot[0], rawRot[1], rawRot[2]);
  wrapper.scale.setScalar(scale);

  const alu = brushedMetal(0xd1d5db, { metalness: 0.88, roughness: 0.22 });
  const steelGear = brushedMetal(0x475569, { metalness: 0.92, roughness: 0.18 });
  const brassGear = brushedMetal(0xf59e0b, { metalness: 0.9, roughness: 0.16 });

  let idx = 0;
  root.traverse((child) => {
    if (!child.isMesh) return;
    const matChoice = idx % 5 === 0 ? brassGear : idx % 2 === 0 ? steelGear : alu;
    const m = new THREE.Mesh(child.geometry, matChoice);
    child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    // Center around GearboxAssy centroid (159.2, 17.0, 3.2)
    m.position.x -= 159.2;
    m.position.y -= 17.02;
    m.position.z -= 3.21;
    m.castShadow = true;
    m.receiveShadow = true;
    wrapper.add(m);
    idx++;
  });

  if (idx > 0) {
    targetGroup.add(wrapper);
    return true;
  }
  return false;
}

/**
 * Attaches spatial CAD sub-assemblies from `buggy.glb` (205-node spaceframe chassis, suspension, engine, rollcage).
 * @param {THREE.Group} targetGroup
 * @param {object|string} arg1
 */
export function addBuggyCadSubassembly(targetGroup, arg1 = {}, arg2, arg3) {
  let opts = arg1;
  if (typeof arg1 === 'string') {
    opts = {
      zone: arg1,
      pos: Array.isArray(arg2) ? arg2 : [0, -0.18, 0],
      scale: typeof arg3 === 'number' ? arg3 : 0.017,
    };
  } else if (Array.isArray(arg1)) {
    opts = { pos: arg1, scale: typeof arg2 === 'number' ? arg2 : 0.017 };
  }
  const rawPos = opts?.pos || opts?.position || [0, -0.18, 0];
  const rawScale = typeof opts?.scale === 'number' ? opts.scale : 0.017;
  const scale = rawScale > 0.04 ? 0.017 : rawScale;
  const { zone = 'chassis', colorOverride = 0x334155 } = opts || {};

  const root = cadCache.buggy;
  if (!root) return false;

  const wrapper = new THREE.Group();
  wrapper.position.set(rawPos[0], rawPos[1], rawPos[2]);
  wrapper.rotation.y = Math.PI / 2;
  wrapper.scale.setScalar(scale);

  const primaryMat = brushedMetal(colorOverride, { metalness: 0.85, roughness: 0.24 });
  const chrome = chromeMat();
  const springMat = carPaint(0xf59e0b);

  const box = new THREE.Box3();
  const ctr = new THREE.Vector3();
  let count = 0;

  root.traverse((child) => {
    if (!child.isMesh) return;
    box.setFromObject(child);
    box.getCenter(ctr);

    let match = false;
    if (zone === 'rollcage' && ctr.y > 58) match = true;
    else if (zone === 'engine' && ctr.y <= 58 && ctr.z < -8) match = true;
    else if (zone === 'suspension' && ctr.y <= 58 && ctr.z > 42) match = true;
    else if (zone === 'chassis' && ctr.y <= 58 && ctr.z >= -8 && ctr.z <= 42) match = true;

    if (!match) return;

    const chosenMat = zone === 'suspension' ? (count % 3 === 0 ? springMat : chrome) : primaryMat;
    const m = new THREE.Mesh(child.geometry, chosenMat);
    child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    m.position.x -= 24.1;
    m.position.y -= 50.9;
    m.position.z -= 16.9;
    m.castShadow = true;
    m.receiveShadow = true;
    wrapper.add(m);
    count++;
  });

  if (count > 0) {
    targetGroup.add(wrapper);
    return true;
  }
  return false;
}

/**
 * Attaches the NASA RS-25 / SSME Cryogenic Liquid Rocket Engine CAD (`space_shuttle_eng.glb`).
 */
export function addRocketEngineCad(
  targetGroup,
  opts = {},
) {
  const rawPos = opts?.pos || opts?.position || [0, 0, 0];
  const rawRot = opts?.rot || opts?.rotation || [0, 0, 0];
  const rawScale = typeof opts?.scale === 'number' ? opts.scale : 0.0028;
  const scale = rawScale > 0.015 ? 0.0028 : rawScale;
  const { partType = 'all', replaceFallback = false } = opts || {};

  return registerCadUpgrade('rocketEng', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(rawPos[0], rawPos[1], rawPos[2]);
    wrapper.rotation.set(rawRot[0], rawRot[1], rawRot[2]);
    wrapper.scale.setScalar(scale);

    const inconel = brushedMetal(0x475569, { metalness: 0.9, roughness: 0.22 });
    const copperLiner = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });

    let count = 0;
    root.traverse((child) => {
      if (!child.isMesh) return;
      const isInner = child.name === '0';
      if (partType === 'inner' && !isInner) return;
      if (partType === 'outer' && isInner) return;

      const m = new THREE.Mesh(child.geometry, isInner ? copperLiner : inconel);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.position.x += 40.8;
      m.position.y += 1.75;
      m.position.z -= 0.88;
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      if (replaceFallback) {
        return attachCadWrapper(targetGroup, wrapper);
      }
      targetGroup.add(wrapper);
      return true;
    }
    return false;
  });
}

/**
 * Splits and attaches the NASA International Space Station CAD (`iss_nasa.glb`) into real exploded parts:
 * - `zone = 'truss'`: S0–S6 / P1–P6 Integrated Truss Structure & Z1 truss
 * - `zone = 'solar-wings'`: 8 Photovoltaic Solar Array Wings
 * - `zone = 'radiators'`: Thermal Control EATCS Radiator Panels
 * - `zone = 'us-modules'`: Destiny, Harmony, Unity, Columbus & Kibo Pressurized Modules (upper Y > 5.5)
 * - `zone = 'russian-modules'`: Zarya FGB, Zvezda Service Module, Rassvet & Poisk (lower Y <= 5.5)
 * - `zone = 'soyuz-docking'`: Docked Soyuz/Progress Spacecraft & PMA Adapters
 */
export function populateIssCad(
  targetGroup,
  { zone = 'all', pos = [0, 0.08, 0], scale = 0.096, rot = [0, Math.PI / 2, Math.PI / 2] } = {},
) {
  return registerCadUpgrade('issNasa', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const trussMat = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.24 });
    const goldKapton = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
    const solarBlue = carPaint(0x1d4ed8, { metalness: 0.72, roughness: 0.16 });
    const radiatorWhite = mat(0xf8fafc, { roughness: 0.25, metalness: 0.15 });
    const moduleWhite = brushedMetal(0xe2e8f0, { metalness: 0.55, roughness: 0.28 });
    const russianTan = mat(0xd6d3d1, { roughness: 0.36, metalness: 0.24 });
    const soyuzDark = brushedMetal(0x334155, { metalness: 0.78, roughness: 0.26 });

    const box = new THREE.Box3();
    const ctr = new THREE.Vector3();
    let count = 0;

    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      box.copy(child.geometry.boundingBox);
      box.getCenter(ctr);
      if (ctr.y > 32) return;

      const matName = (child.material?.name || '').toLowerCase();
      const spanZ = box.max.z - box.min.z;

      let partZone = 'us-modules';
      let chosenMat = moduleWhite;

      if (matName.includes('lambert7') || matName.includes('soyuz_blinn4')) {
        partZone = 'solar-wings';
        chosenMat = matName.includes('lambert7') ? solarBlue : goldKapton;
      } else if (matName.includes('anisotropic') || matName.includes('apollohorns') || child.name.startsWith('polySurfa3')) {
        partZone = 'truss';
        chosenMat = matName.includes('apollohorns') ? goldKapton : trussMat;
      } else if (matName.includes('lambert3') || (matName.includes('lambert4') && spanZ > 5)) {
        partZone = 'radiators';
        chosenMat = radiatorWhite;
      } else if (
        matName.includes('soyuz_blinn2') ||
        matName.includes('soyuz_blinn3') ||
        matName.includes('blinn6') ||
        matName.includes('blinn7')
      ) {
        partZone = 'soyuz-docking';
        chosenMat = soyuzDark;
      } else if (ctr.y <= 5.5) {
        partZone = 'russian-modules';
        chosenMat = matName.includes('blinn5') ? goldKapton : russianTan;
      } else {
        partZone = 'us-modules';
        chosenMat = matName.includes('bendedtruss') ? goldKapton : moduleWhite;
      }

      if (zone !== 'all' && partZone !== zone) return;

      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.position.y -= 6.8;
      if (partZone === 'solar-wings') {
        m.userData.driveAnim = 'solar-track';
      }
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

/**
 * Attaches NASA Space Shuttle Launch Stack CAD assets (`shuttle_et.glb`, `shuttle_srb.glb`,
 * `shuttle_payload.glb`, `shuttle_ods.glb`, `space_shuttle_eng.glb`) aligned in Studio coordinates.
 * @param {THREE.Group} targetGroup
 * @param {object} opts
 * @param {'et'|'srb-pair'|'srb-left'|'srb-right'|'payload'|'ods'|'ssme-trio'} [opts.partType='et']
 */
export function populateShuttleStackCad(
  targetGroup,
  { partType = 'et', pos = [0, 0, 0], scale = 0.00215, rot = [0, 0, 0] } = {},
) {
  if (partType === 'ssme-trio') {
    return registerCadUpgrade('rocketEng', targetGroup, () => {
      clearProceduralFallbacks(targetGroup);
      const offsets = [
        [-1.32, 0.30, 0, [0, 0, 0.16]],
        [-1.38, 0.15, -0.13, [0, 0.08, 0.10]],
        [-1.38, 0.15, 0.13, [0, -0.08, 0.10]],
      ];
      let ok = false;
      for (const [ox, oy, oz, r] of offsets) {
        if (addRocketEngineCad(targetGroup, { pos: [pos[0] + ox, pos[1] + oy, pos[2] + oz], scale: 0.0022, rot: r })) {
          ok = true;
        }
      }
      return ok;
    });
  }

  const keyMap = {
    et: 'shuttleEt',
    'srb-pair': 'shuttleSrb',
    'srb-left': 'shuttleSrb',
    'srb-right': 'shuttleSrb',
    payload: 'shuttlePayload',
    ods: 'shuttleOds',
  };
  const assetKey = keyMap[partType] || 'shuttleEt';

  return registerCadUpgrade(assetKey, targetGroup, (root) => {
    const sofiOrange = mat(0xd95f18, { roughness: 0.58, metalness: 0.08 });
    const darkStrut = brushedMetal(0x334155, { metalness: 0.85, roughness: 0.24 });
    const srbWhite = mat(0xf8fafc, { roughness: 0.3, metalness: 0.12 });
    const goldFoil = brushedMetal(0xf59e0b, { metalness: 0.9, roughness: 0.18 });
    const alu = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.22 });

    const zOffsets =
      partType === 'srb-pair' ? [-0.54, 0.54] : partType === 'srb-left' ? [-0.54] : partType === 'srb-right' ? [0.54] : [0];

    const masterWrapper = new THREE.Group();
    let count = 0;
    for (const zOff of zOffsets) {
      const wrapper = new THREE.Group();
      wrapper.position.set(pos[0], pos[1], pos[2] + zOff);
      wrapper.rotation.set(rot[0], rot[1], rot[2]);
      wrapper.scale.setScalar(scale);

      root.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        const mName = (child.material?.name || '').toLowerCase();
        let chosenMat = alu;
        if (partType === 'et') {
          chosenMat = mName.includes('attach') || mName.includes('shutsup') ? darkStrut : sofiOrange;
        } else if (partType.startsWith('srb')) {
          chosenMat = srbWhite;
        } else if (partType === 'payload' || partType === 'ods') {
          chosenMat = mName.includes('wrinkled') || mName.includes('shield') ? goldFoil : alu;
        }

        const m = new THREE.Mesh(child.geometry, chosenMat);
        child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
        m.castShadow = true;
        m.receiveShadow = true;
        wrapper.add(m);
        count++;
      });

      if (wrapper.children.length > 0) {
        masterWrapper.add(wrapper);
      }
    }
    if (count > 0) {
      return attachCadWrapper(targetGroup, masterWrapper);
    }
    return false;
  });
}

/**
 * Splits and attaches the NASA Apollo Saturn V CAD (`saturn_v.glb`) by stage zone:
 * `'f1-engines'` (base F-1 engine bells & fairings), `'s-ic'` (1st stage tank & fins),
 * `'s-ii'` (2nd stage), `'s-ivb'` (3rd stage), `'csm-les'` (Apollo spacecraft & LES).
 * Stands vertically upright along +Y!
 */
export function populateSaturnVCad(
  targetGroup,
  { zone = 'all', pos = [0, 0, 0], scale = 0.38, rot = [0, 0, 0] } = {},
) {
  return registerCadUpgrade('saturnV', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const whitePaint = mat(0xf8fafc, { roughness: 0.28, metalness: 0.12 });
    const blackRoll = mat(0x0f172a, { roughness: 0.36, metalness: 0.2 });
    const inconel = brushedMetal(0x475569, { metalness: 0.88, roughness: 0.22 });

    const box = new THREE.Box3();
    const ctr = new THREE.Vector3();
    let count = 0;

    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      box.setFromObject(child);
      box.getCenter(ctr);

      const radial = Math.hypot(ctr.x, ctr.z - 0.743);
      let stageZone = 's-ic';
      if (ctr.y > 9.6) stageZone = 'csm-les';
      else if (ctr.y > 7.0) stageZone = 's-ivb';
      else if (ctr.y > 4.1) stageZone = 's-ii';
      else if (ctr.y <= 0.8 && radial > 0.52) stageZone = 'fins';
      else if (ctr.y <= 1.25) stageZone = 'f1-engines';

      if (zone !== 'all' && stageZone !== zone) return;

      const mName = (child.material?.name || '').toLowerCase();
      const chosenMat =
        mName.includes('fin') || mName.includes('blinn6') || stageZone === 'f1-engines' || stageZone === 'fins'
          ? inconel
          : mName.includes('blinn2')
            ? blackRoll
            : whitePaint;
      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.position.y -= 5.6;
      m.position.z -= 0.743;
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

/**
 * Splits and attaches the NASA Mars 2020 Perseverance Rover CAD (`perseverance_rover.glb`) by sub-assembly:
 * `'chassis'`, `'wheels-suspension'`, `'mast'`, `'turret-arm'`, `'rtg'`, `'antennas'`, or `'all'`.
 */
export function populatePerseveranceCad(
  targetGroup,
  { zone = 'all', pos = [0, -0.72, 0], scale = 0.88, rot = [0, Math.PI / 2, 0] } = {},
) {
  return registerCadUpgrade('perseverance', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const whiteDeck = mat(0xf8fafc, { roughness: 0.3, metalness: 0.16 });
    const darkTi = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
    const goldFoil = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
    const alu = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.22 });

    const box = new THREE.Box3();
    const ctr = new THREE.Vector3();
    let count = 0;

    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      box.setFromObject(child);
      box.getCenter(ctr);
      const nName = `${child.name || ''} ${child.parent?.name || ''}`.toLowerCase();
      const mName = (child.material?.name || '').toLowerCase();

      let partZone = 'chassis';
      if (/antenna/i.test(nName)) {
        partZone = 'antennas';
      } else if (/mast|navcam|supercam|head|microphone|lens|up_look/i.test(nName) || ctr.y > 1.48) {
        partZone = 'mast';
      } else if (/arm|turret|corer|drill|sherloc|pixl/i.test(nName) || ctr.z > 1.02) {
        partZone = 'turret-arm';
      } else if (/rtg|mmrtg|rimfax/i.test(nName) || ctr.z < -0.95) {
        partZone = 'rtg';
      } else if (/wheel|bogie|rocker|leg|strut|hub|suspension/i.test(nName) || ctr.y < 0.62 || Math.abs(ctr.x) > 0.72) {
        partZone = 'wheels-suspension';
      }

      if (zone !== 'all' && partZone !== zone) return;

      let chosenMat = child.material || alu;
      if (!child.material) {
        if (mName.includes('gold') || mName.includes('foil') || mName.includes('brass')) chosenMat = goldFoil;
        else if (mName.includes('black') || mName.includes('gunmetal')) chosenMat = darkTi;
        else if (mName.includes('white')) chosenMat = whiteDeck;
      }

      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      if (partZone === 'wheels-suspension' && /wheel/i.test(nName)) {
        m.userData.driveRole = 'wheel';
      }
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

/**
 * Splits and attaches the NASA Ingenuity Mars Helicopter CAD (`ingenuity_mars.glb`) by sub-assembly:
 * `'rotors'`, `'solar-panel'`, `'fuselage-bus'`, `'landing-legs'`, or `'all'`.
 * Note: `ingenuity_mars.glb` top node `bus` already includes a +90° Z rotation standing the rotorcraft upright along +Y.
 */
export function populateIngenuityCad(
  targetGroup,
  { zone = 'all', pos = [0, -0.42, 0], scale = 1.15, rot = [0, 0, 0] } = {},
) {
  return registerCadUpgrade('ingenuity', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const carbon = carbonFiberMat([4, 4]);
    const kapton = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
    const silverFoil = brushedMetal(0xe2e8f0, { metalness: 0.94, roughness: 0.14 });

    let count = 0;
    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const nName = `${child.name || ''} ${child.parent?.name || ''}`.toLowerCase();

      let partZone = 'fuselage-bus';
      if (nName.includes('rotor') || nName.includes('parts_0')) partZone = 'rotors';
      else if (nName.includes('solar')) partZone = 'solar-panel';
      else if (nName.includes('leg')) partZone = 'landing-legs';

      if (zone !== 'all' && partZone !== zone) return;

      const mName = (child.material?.name || '').toLowerCase();
      const chosenMat =
        child.material ||
        (mName.includes('gold') || mName.includes('chopper') ? kapton : mName.includes('foil') ? silverFoil : carbon);
      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      if (partZone === 'rotors') {
        m.userData.driveAnim = 'fan';
      }
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

/**
 * Splits and attaches the Khronos Mechanical Chronograph Watch CAD (`chronograph_watch.glb`):
 * `'case-bezel'`, `'dial-hands'`, `'crown-pushers'`, `'crystal-backplate'`, `'strap-clasp'`, or `'all'`.
 */
export function populateWatchCad(
  targetGroup,
  { zone = 'all', pos = [0, 0.06, 0.28], scale = 0.42, rot = [0, 0.32, 0] } = {},
) {
  return registerCadUpgrade('chronographWatch', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const titanium = brushedMetal(0xe2e8f0, { metalness: 0.94, roughness: 0.14 });
    const roseGold = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
    const dialDark = mat(0x0f172a, { roughness: 0.24, metalness: 0.45 });
    const strapCarbon = carbonFiberMat([5, 5]);
    const sapphire = glassMat(0xe0f2fe, 0.24);

    const zones = Array.isArray(zone) ? zone : [zone];
    let count = 0;
    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const nName = `${child.name || ''} ${child.parent?.name || ''}`.toLowerCase();

      let partZone = 'case-bezel';
      let chosenMat = titanium;
      if (nName.includes('band') || nName.includes('clasp')) {
        partZone = 'strap-clasp';
        chosenMat = nName.includes('clasp') ? titanium : strapCarbon;
      } else if (nName.includes('hand') || nName.includes('watch face')) {
        partZone = 'dial-hands';
        chosenMat = nName.includes('hand') ? roseGold : dialDark;
      } else if (nName.includes('button')) {
        partZone = 'crown-pushers';
        chosenMat = roseGold;
      } else if (nName.includes('glass') || nName.includes('backplate')) {
        partZone = 'crystal-backplate';
        chosenMat = nName.includes('glass') ? sapphire : titanium;
      }

      if (!zones.includes('all') && !zones.includes(partZone)) return;

      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

/**
 * Splits and attaches the Three.js CarbonFrameBike CAD (`carbon_frame_bike.glb`) by sub-assembly:
 * `'frame'`, `'rear-wheel'`, `'front-wheel'`, `'wheels'`, `'brakes'`, `'drivetrain'`, `'cockpit-fork'`, or `'all'`.
 */
export function populateBikeCad(
  targetGroup,
  { zone = 'all', pos = [0, -0.68, 0], scale = 1.42, rot = [0, 0, 0] } = {},
) {
  return registerCadUpgrade('carbonBike', targetGroup, (root) => {
    const wrapper = new THREE.Group();
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.scale.setScalar(scale);

    const carbon = carbonFiberMat([6, 6]);
    const chrome = chromeMat();
    const redAnodized = carPaint(0xdc2626);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tireTreadTexture(),
      roughness: 0.72,
      metalness: 0.08,
    });

    const box = new THREE.Box3();
    const ctr = new THREE.Vector3();
    const zones = Array.isArray(zone) ? zone : [zone];
    let count = 0;

    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const mName = (child.material?.name || '').toLowerCase();
      if (mName.includes('shadow')) return;

      let lineage = '';
      let p = child;
      while (p) {
        lineage += ` ${p.name || ''}`;
        p = p.parent;
      }
      const low = lineage.toLowerCase();
      // Skip unskinned 100x armature hose helper meshes
      if (low.includes('schlauch_') || low.includes('armature_s')) return;

      box.setFromObject(child);
      box.getCenter(ctr);

      let partZone = 'frame';
      if (low.includes('brems')) partZone = 'brakes';
      else if (low.includes('radhinten') || low.includes('zb_hr')) partZone = 'rear-wheel';
      else if (low.includes('radvorn') || low.includes('zb_vr') || ctr.x < -0.25) partZone = 'front-wheel';
      else if (mName.includes('getriebe') || mName.includes('chain') || mName.includes('pedale')) partZone = 'drivetrain';
      else if (mName.includes('lenker') || mName.includes('griff') || mName.includes('feder')) partZone = 'cockpit-fork';

      const matchWheelAlias = zones.includes('wheels') && (partZone === 'front-wheel' || partZone === 'rear-wheel');
      if (!zones.includes('all') && !zones.includes(partZone) && !matchWheelAlias) return;

      let chosenMat = carbon;
      if (mName.includes('reifen') || mName.includes('gummi')) chosenMat = tireMat;
      else if (mName.includes('rotesteil') || mName.includes('feder')) chosenMat = redAnodized;
      else if (mName.includes('metal') || mName.includes('brems') || mName.includes('getriebe') || mName.includes('chain')) {
        chosenMat = chrome;
      }

      const m = new THREE.Mesh(child.geometry, chosenMat);
      child.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.castShadow = true;
      m.receiveShadow = true;
      wrapper.add(m);
      count++;
    });

    if (count > 0) {
      return attachCadWrapper(targetGroup, wrapper);
    }
    return false;
  });
}

export {
  addGearboxCadSubassembly as populateGearboxCad,
  addEngineCadSubassembly as populateEngineCad,
};


