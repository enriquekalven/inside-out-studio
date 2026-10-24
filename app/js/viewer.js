// 3D Stage & Interactive Exploded-View PBR Renderer for Inside Out Studio.
// Uses vendored Three.js 0.186.1 + RoomEnvironment IBL + ACESFilmicToneMapping + PCFSoftShadowMap,
// custom pointer/touch OrbitControls, smooth explosion lerping, X-ray cutaway mode, raycasting, and 2D callout pins.
import * as THREE from '../vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { el, clear, prefersReducedMotion } from './ui.js';
import { onCadReady } from './cad_loader.js';
import { stopEngineSound } from './sound.js';
import { createActionSim } from './sims/index.js';

export class StageViewer {
  constructor({ canvasHost, labelsHost, onPartClick, onDriveTelemetry }) {
    this.canvasHost = canvasHost;
    this.labelsHost = labelsHost;
    this.onPartClick = onPartClick;
    this.onDriveTelemetry = onDriveTelemetry;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.renderer = null;
    this.pmremGenerator = null;

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Showroom / Dyno Track Stage Floor Group (dynamically positioned right under the model's tires/base)
    this.stageFloorGroup = new THREE.Group();
    this.stageFloorGroup.position.y = -0.57;
    this.scene.add(this.stageFloorGroup);

    // Dark asphalt dyno pad / road surface
    const roadGeo = new THREE.PlaneGeometry(22, 10);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.78,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    this.roadPlane = new THREE.Mesh(roadGeo, roadMat);
    this.roadPlane.rotation.x = -Math.PI / 2;
    this.roadPlane.position.y = -0.005;
    this.roadPlane.receiveShadow = true;
    this.stageFloorGroup.add(this.roadPlane);

    // Glowing showroom turntable rings
    const ringGeo = new THREE.RingGeometry(2.35, 2.52, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    this.floorRing = new THREE.Mesh(ringGeo, ringMat);
    this.floorRing.rotation.x = -Math.PI / 2;
    this.floorRing.position.y = 0.002;
    this.stageFloorGroup.add(this.floorRing);

    const innerRingGeo = new THREE.RingGeometry(1.35, 1.4, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.003;
    this.stageFloorGroup.add(innerRing);

    // Scrolling highway lane dashes & edge lines for "Drive It!" mode
    this.roadLinesGroup = new THREE.Group();
    this.roadLinesGroup.visible = false;
    this.stageFloorGroup.add(this.roadLinesGroup);

    const edgeLineGeo = new THREE.PlaneGeometry(22, 0.06);
    const edgeLineMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    for (const zEdge of [-1.65, 1.65]) {
      const edgeMesh = new THREE.Mesh(edgeLineGeo, edgeLineMat);
      edgeMesh.rotation.x = -Math.PI / 2;
      edgeMesh.position.set(0, 0.005, zEdge);
      this.roadLinesGroup.add(edgeMesh);
    }

    this.laneDashes = [];
    const dashGeo = new THREE.PlaneGeometry(0.85, 0.07);
    const dashMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
    });
    const sideDashMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 14; i++) {
      const x = -10.5 + i * 1.6;
      const centerDash = new THREE.Mesh(dashGeo, dashMat);
      centerDash.rotation.x = -Math.PI / 2;
      centerDash.position.set(x, 0.006, 0);
      this.roadLinesGroup.add(centerDash);
      this.laneDashes.push(centerDash);

      for (const zRoller of [-0.88, 0.88]) {
        const rollerTick = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.04), sideDashMat);
        rollerTick.rotation.x = -Math.PI / 2;
        rollerTick.position.set(x, 0.006, zRoller);
        this.roadLinesGroup.add(rollerTick);
        this.laneDashes.push(rollerTick);
      }
    }

    const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.34 });
    this.shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0.001;
    this.shadowPlane.receiveShadow = true;
    this.stageFloorGroup.add(this.shadowPlane);

    // Headlight beam cones (visible during Drive Mode when headlights are ON)
    this.headlightGroup = new THREE.Group();
    this.headlightGroup.visible = false;
    this.rootGroup.add(this.headlightGroup);
    const beamGeo = new THREE.ConeGeometry(0.62, 3.4, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (const zSide of [-0.58, 0.58]) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(3.55, -0.05, zSide);
      this.headlightGroup.add(beam);
    }

    // Studio Lighting (paired with RoomEnvironment PMREM IBL)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.95);
    hemi.position.set(0, 12, 0);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffdf8, 2.15);
    keyLight.position.set(6, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);
    this.scene.add(keyLight.target);
    this.keyLight = keyLight;
    this.keyLightOffset = keyLight.position.clone();

    const fillLight = new THREE.DirectionalLight(0x9ec5fe, 0.9);
    fillLight.position.set(-7, 4, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeaa7, 0.8);
    rimLight.position.set(-4, 6, -6);
    this.scene.add(rimLight);

    // State
    this.currentObject = null;
    this.partRecords = new Map(); // partId -> { def, group, meshes, baseMats, center, labelEl, targetExplode, currentExplode }
    this.explodeTarget = 0; // 0..1
    this.explodeCurrent = 0;
    this.perPartMode = false; // true in Build-It mode where each part has its own 0 or 1 state
    this.selectedPartId = null;
    this.hoveredPartId = null;
    this.foundSet = new Set();
    // Default showLabels to false so floating black pills don't cover the 3D car unless toggled on
    this.showLabels = false;
    this.xrayMode = false;
    this.autoRotate = false;

    // Interactive Action / Drive Simulation State
    this.driveMode = false;
    this.sim = null;
    this.inputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      boost: false,
      space: false,
      pitchUp: false,
      pitchDown: false,
    };
    this.driveWheels = [];
    this.steerWheels = [];
    this.steeringWheels = [];
    this.drivePistons = [];
    this.driveCranks = [];
    this.brakeGlowMeshes = [];
    this.driveState = {
      speed: 0,
      rpm: 850,
      gear: '1',
      throttle: 0,
      braking: 0,
      steerAngle: 0,
      nitro: false,
      headlightsOn: true,
      autoCruise: true,
      crankPhase: 0,
      pitchAngle: 0,
      rollAngle: 0,
      inputs: this.inputs,
    };

    // Spherical camera orbit coordinates
    this.target = new THREE.Vector3(0, 0, 0);
    this.desiredTarget = new THREE.Vector3(0, 0, 0);
    this.spherical = new THREE.Spherical(5.6, 1.15, 0.78);
    this.desiredSpherical = new THREE.Spherical(5.6, 1.15, 0.78);
    this.defaultSpherical = new THREE.Spherical(5.6, 1.15, 0.78);
    // Per-model orbit pivot (e.g. the lead car of a long trainset) and zoom-out limit
    this.defaultTarget = new THREE.Vector3(0, 0, 0);
    this.maxRadius = 12.0;

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.activePointers = new Map();
    this.pointerDownPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.pinchPrevDist = 0;

    this.animFrame = 0;
    this.clock = new THREE.Clock();

    // When high-poly CAD assets (.glb) finish async loading, refresh the active model
    onCadReady(() => {
      if (this.currentObject) {
        const prevExplode = this.explodeTarget;
        const prevXray = this.xrayMode;
        const prevDrive = this.driveMode;
        const prevSelect = this.selectedPartId;
        this.loadObject(this.currentObject);
        if (prevExplode > 0) this.setExplode(prevExplode, true);
        if (prevXray) this.setXrayMode(true);
        if (prevDrive) this.setDriveMode(true);
        if (prevSelect) this.selectPart(prevSelect, false);
      }
    });
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Studio Image-Based Lighting (IBL) via RoomEnvironment
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.pmremGenerator.compileEquirectangularShader();
      const roomEnv = new RoomEnvironment();
      this.scene.environment = this.pmremGenerator.fromScene(roomEnv, 0.04).texture;
      this.scene.environmentIntensity = 0.95;
      roomEnv.dispose();

      this.canvasHost.appendChild(this.renderer.domElement);
      this.canvasHost.classList.add('is-grab');
    } catch {
      return false;
    }

    this._bindEvents();
    this.resize();
    this._loop();
    return true;
  }

  _bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      dom.setPointerCapture(e.pointerId);
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activePointers.size === 1) {
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
        this.isDragging = false;
        this.canvasHost.classList.add('is-grabbing');
      } else if (this.activePointers.size === 2) {
        const pts = Array.from(this.activePointers.values());
        this.pinchPrevDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) {
        this._updateHover(e);
        return;
      }
      const prev = this.activePointers.get(e.pointerId);
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y) > 5) {
          this.isDragging = true;
        }
        this.desiredSpherical.theta -= dx * 0.0085;
        this.desiredSpherical.phi = Math.max(0.22, Math.min(Math.PI - 0.22, this.desiredSpherical.phi - dy * 0.0075));
      } else if (this.activePointers.size === 2) {
        this.isDragging = true;
        const pts = Array.from(this.activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.pinchPrevDist > 0) {
          const delta = (this.pinchPrevDist - dist) * 0.015;
          this.desiredSpherical.radius = Math.max(1.8, Math.min(this.maxRadius, this.desiredSpherical.radius + delta));
        }
        this.pinchPrevDist = dist;
      }
    });

    const onPointerUp = (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size === 0) {
        this.canvasHost.classList.remove('is-grabbing');
      }
      if (!this.isDragging && e.type === 'pointerup') {
        const hitPartId = this._raycastPart(e.clientX, e.clientY);
        if (hitPartId && this.onPartClick) {
          this.onPartClick(hitPartId);
        }
      }
    };

    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.08 : 0.92;
        this.desiredSpherical.radius = Math.max(1.8, Math.min(this.maxRadius, this.desiredSpherical.radius * factor));
      },
      { passive: false },
    );

    window.addEventListener('resize', () => this.resize());
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.canvasHost);
    }
  }

  _updateHover(e) {
    const hit = this._raycastPart(e.clientX, e.clientY);
    if (hit !== this.hoveredPartId) {
      this.hoveredPartId = hit;
      this.canvasHost.classList.toggle('is-pointer', Boolean(hit));
      this._refreshHighlights();
    }
  }

  _raycastPart(clientX, clientY) {
    if (!this.renderer) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const pickables = [];
    for (const rec of this.partRecords.values()) {
      if (rec.group.visible) {
        pickables.push(...rec.meshes);
      }
    }
    const hits = this.raycaster.intersectObjects(pickables, false);
    if (hits.length === 0) return null;
    return hits[0].object.userData.partId || null;
  }

  resize() {
    if (!this.renderer) return;
    const w = Math.max(1, this.canvasHost.clientWidth);
    const h = Math.max(1, this.canvasHost.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  loadObject(objDef) {
    if (this.sim) {
      this.sim.exit();
      this.sim = null;
    }
    this.driveMode = false;
    this.currentObject = objDef;
    this.selectedPartId = null;
    this.hoveredPartId = null;
    this.perPartMode = false;
    this.explodeTarget = 0;
    this.explodeCurrent = 0;

    // Dispose old geometries/materials (protect shared CAD BufferGeometries!)
    for (const rec of this.partRecords.values()) {
      for (const m of rec.meshes) {
        if (m.geometry && !m.geometry.userData?.sharedCad) {
          m.geometry.dispose();
        }
        if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
        else if (m.material) m.material.dispose();
      }
    }
    this.partRecords.clear();
    this.rootGroup.clear();
    this.rootGroup.add(this.headlightGroup);
    this.rootGroup.rotation.set(0, 0, 0);
    this.rootGroup.position.set(0, 0, 0);
    clear(this.labelsHost);

    this.driveWheels = [];
    this.steerWheels = [];
    this.steeringWheels = [];
    this.drivePistons = [];
    this.driveCranks = [];
    this.brakeGlowMeshes = [];

    // Camera default spherical from object's cameraPos
    const [cx, cy, cz] = objDef.cameraPos || [4.0, 2.5, 4.2];
    const camVec = new THREE.Vector3(cx, cy, cz);
    this.defaultSpherical.setFromVector3(camVec);
    this.spherical.copy(this.defaultSpherical);
    this.desiredSpherical.copy(this.defaultSpherical);
    const modelDef = objDef.activeModel || objDef;
    const [tx, ty, tz] = modelDef.cameraTarget || objDef.cameraTarget || [0, 0, 0];
    this.defaultTarget.set(tx, ty, tz);
    this.target.copy(this.defaultTarget);
    this.desiredTarget.copy(this.defaultTarget);
    this.maxRadius = Math.max(12.0, modelDef.maxCameraRadius || 0, this.defaultSpherical.radius * 1.6);

    // Build each part
    for (const partDef of objDef.parts) {
      const partGroup = new THREE.Group();
      partGroup.name = partDef.id;
      partDef.build(partGroup);
      if (partGroup.children.some((ch) => ch.userData?.isCadWrapper)) {
        for (let i = partGroup.children.length - 1; i >= 0; i--) {
          if (!partGroup.children[i].userData?.isCadWrapper) {
            partGroup.remove(partGroup.children[i]);
          }
        }
      }

      const meshes = [];
      const baseMats = [];
      const box3 = new THREE.Box3();

      partGroup.traverse((child) => {
        if (child.userData?.driveRole === 'wheel') {
          this.driveWheels.push(child);
        }
        if (child.userData?.steerRole === 'front-wheel') {
          this.steerWheels.push(child);
        }
        if (child.userData?.steerRole === 'steering-wheel') {
          this.steeringWheels.push(child);
        }
        if (child.userData?.driveAnim === 'piston') {
          this.drivePistons.push(child);
        }
        if (child.userData?.driveAnim === 'crank' || child.userData?.driveAnim === 'fan') {
          if (child.position.lengthSq() < 1e-6 && child.children.length > 0) {
            const spinBox = new THREE.Box3().setFromObject(child);
            if (!spinBox.isEmpty()) {
              const pivot = new THREE.Vector3();
              spinBox.getCenter(pivot);
              child.position.copy(pivot);
              for (const grand of child.children) {
                grand.position.sub(pivot);
              }
            }
          }
          this.driveCranks.push(child);
        }
        if (child.isMesh) {
          child.userData.partId = partDef.id;
          child.castShadow = true;
          child.receiveShadow = true;
          meshes.push(child);
          baseMats.push({
            opacity: child.material.opacity,
            transparent: child.material.transparent,
            emissiveHex: child.material.emissive ? child.material.emissive.getHex() : 0x000000,
            emissiveIntensity: child.material.emissiveIntensity || 0,
          });
        }
      });

      box3.setFromObject(partGroup);
      const center = new THREE.Vector3();
      if (!box3.isEmpty()) box3.getCenter(center);

      const labelEl = el(
        'button',
        {
          type: 'button',
          class: 'part-label',
          'data-part-id': partDef.id,
        },
        partDef.name,
      );
      labelEl.addEventListener('click', () => {
        if (this.onPartClick) this.onPartClick(partDef.id);
      });
      this.labelsHost.appendChild(labelEl);

      this.rootGroup.add(partGroup);
      this.partRecords.set(partDef.id, {
        def: partDef,
        group: partGroup,
        meshes,
        baseMats,
        center,
        labelEl,
        targetExplode: 0,
        currentExplode: 0,
      });
    }

    // Align the showroom / dyno track floor directly underneath the assembled object's lowest point (e.g., tire treads)
    const fullBox = new THREE.Box3().setFromObject(this.rootGroup);
    if (!fullBox.isEmpty()) {
      this.stageFloorGroup.position.y = Math.max(-1.62, Math.min(-0.48, fullBox.min.y - 0.005));
    } else {
      this.stageFloorGroup.position.y = -0.57;
    }
    this._fitStageToBox(fullBox);

    this._applyXray();
    this._refreshHighlights();
  }

  // Grow the key-light shadow frustum and the floor planes so long/large models (multi-car trainsets,
  // big rotor discs) are fully shadowed; small models keep the original crisp 1024px / ±4.2 setup.
  _fitStageToBox(box) {
    const light = this.keyLight;
    if (!light) return;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    let radius = 4.2;
    if (!box.isEmpty()) {
      box.getCenter(center);
      box.getSize(size);
      radius = Math.max(4.2, Math.hypot(size.x, size.z) * 0.5 + 0.6);
    }
    center.y = 0;
    light.target.position.copy(center);
    light.position.copy(center).add(this.keyLightOffset);
    const cam = light.shadow.camera;
    cam.left = -radius;
    cam.right = radius;
    cam.top = radius;
    cam.bottom = -radius;
    cam.far = Math.max(25, this.keyLightOffset.length() + radius * 2);
    cam.updateProjectionMatrix();
    const wantMap = radius > 6 ? 2048 : 1024;
    if (light.shadow.mapSize.width !== wantMap) {
      light.shadow.mapSize.set(wantMap, wantMap);
      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    }
    const spanX = box.isEmpty() ? 0 : size.x;
    const spanZ = box.isEmpty() ? 0 : size.z;
    this.roadPlane.scale.set(Math.max(1, (spanX + 6) / 22), Math.max(1, (spanZ + 4) / 10), 1);
    this.shadowPlane.scale.set(Math.max(1, (spanX + 4) / 16), Math.max(1, (spanZ + 4) / 16), 1);
    this.roadPlane.position.x = box.isEmpty() ? 0 : center.x;
    this.shadowPlane.position.x = this.roadPlane.position.x;
  }

  setDriveMode(enabled) {
    if (this.sim) {
      this.sim.exit();
      this.sim = null;
    }
    for (const k of Object.keys(this.inputs)) this.inputs[k] = false;
    this.driveMode = Boolean(enabled);
    this.roadLinesGroup.visible = false;
    this.headlightGroup.visible = false;
    this.rootGroup.rotation.set(0, 0, 0);
    this.rootGroup.position.set(0, 0, 0);
    for (const sw of this.steerWheels) sw.rotation.y = 0;
    for (const stw of this.steeringWheels) stw.rotation.x = 0;

    if (this.driveMode && this.currentObject) {
      if (this.explodeTarget > 0) this.setExplode(0, true);
      this.sim = createActionSim(
        this.currentObject.id || 'car',
        this.currentObject.activeModelId || '',
        this,
      );
      this.sim.enter();
      const tel = this.sim.update(0.016);
      Object.assign(this.driveState, tel);
    } else {
      stopEngineSound();
    }
    return this.driveMode;
  }

  setDriveInput(inputName, isDown) {
    const key = inputName === 'nitro' ? 'boost' : inputName === 'brake' ? 'space' : inputName;
    if (!(key in this.inputs)) return;
    const down = Boolean(isDown);
    this.inputs[key] = down;
    if (this.sim) this.sim.onInput(key, down);
  }

  triggerAction(name) {
    if (name === 'reset' && this.driveMode) {
      this.setDriveMode(true);
      return true;
    }
    return this.sim ? this.sim.trigger(name) : false;
  }

  toggleHeadlights() {
    return this.triggerAction('lights');
  }

  _updateDriveSimulation(dt) {
    const st = this.driveState;
    if (!this.driveMode || !this.sim) {
      if (!prefersReducedMotion() && (this.drivePistons.length > 0 || this.driveCranks.length > 0)) {
        st.crankPhase += dt * 8.0;
        for (const p of this.drivePistons) {
          const baseY = p.userData.baseY ?? 0.08;
          const phase = p.userData.phase ?? 0;
          p.position.y = baseY + Math.sin(st.crankPhase + phase) * 0.026;
        }
        for (const c of this.driveCranks) {
          const axis = c.userData?.spinAxis || 'x';
          c.rotation[axis] += dt * 4.5;
        }
      }
      return;
    }

    const tel = this.sim.update(dt);
    Object.assign(this.driveState, tel);
    if (this.onDriveTelemetry) {
      this.onDriveTelemetry(tel, this.sim);
    }
  }

  setExplode(fraction, immediate = false) {
    this.perPartMode = false;
    const clamped = Math.max(0, Math.min(1, Number(fraction) || 0));
    this.explodeTarget = clamped;
    for (const rec of this.partRecords.values()) {
      rec.targetExplode = clamped;
      if (immediate || prefersReducedMotion()) {
        rec.currentExplode = clamped;
      }
    }
    if (immediate || prefersReducedMotion()) {
      this.explodeCurrent = clamped;
      this._updatePartPositions();
    }
    const extraZoom = clamped * 1.15;
    this.desiredSpherical.radius = this.defaultSpherical.radius + extraZoom;
    this._refreshHighlights();
  }

  setBuildStates(placedSet, activeTargetId = null, immediate = false) {
    this.perPartMode = true;
    for (const [id, rec] of this.partRecords.entries()) {
      const isPlaced = placedSet.has(id);
      const t = isPlaced ? 0 : 0.92;
      rec.targetExplode = t;
      if (immediate || prefersReducedMotion()) {
        rec.currentExplode = t;
      }
    }
    this.selectedPartId = activeTargetId;
    this.desiredSpherical.radius = this.defaultSpherical.radius + 1.05;
    if (immediate || prefersReducedMotion()) {
      this._updatePartPositions();
    }
    this._refreshHighlights();
  }

  selectPart(partId, focusCamera = false) {
    this.selectedPartId = partId;
    this._refreshHighlights();

    for (const [id, rec] of this.partRecords.entries()) {
      rec.labelEl.classList.toggle('is-selected', id === partId);
    }

    if (focusCamera && partId && this.partRecords.has(partId)) {
      const rec = this.partRecords.get(partId);
      const [ox, oy, oz] = rec.def.explodeOffset;
      const worldCenter = new THREE.Vector3(
        rec.center.x + ox * rec.targetExplode,
        rec.center.y + oy * rec.targetExplode,
        rec.center.z + oz * rec.targetExplode,
      );
      this.desiredTarget.copy(this.defaultTarget).lerp(worldCenter, 0.35);
    } else if (!partId) {
      this.desiredTarget.copy(this.defaultTarget);
    }
  }

  setFoundParts(foundIterable) {
    this.foundSet = new Set(foundIterable || []);
    for (const [id, rec] of this.partRecords.entries()) {
      rec.labelEl.classList.toggle('is-found', this.foundSet.has(id));
    }
  }

  setShowLabels(show) {
    this.showLabels = Boolean(show);
    this._updateLabels();
  }

  setXrayMode(enabled) {
    this.xrayMode = Boolean(enabled);
    this._applyXray();
    return this.xrayMode;
  }

  setAutoRotate(enabled) {
    this.autoRotate = Boolean(enabled);
    return this.autoRotate;
  }

  setCameraPreset(preset) {
    const baseRadius = this.defaultSpherical.radius + (this.perPartMode ? 1.05 : this.explodeTarget * 1.15);
    this.desiredTarget.copy(this.defaultTarget);
    if (preset === 'photo') {
      this.desiredSpherical.set(baseRadius * 0.9, 1.24, 0.92);
    } else if (preset === 'front') {
      this.desiredSpherical.set(baseRadius * 0.95, 1.22, Math.PI / 2);
    } else if (preset === 'side') {
      this.desiredSpherical.set(baseRadius * 0.95, 1.25, 0);
    } else if (preset === 'top') {
      this.desiredSpherical.set(baseRadius * 1.05, 0.25, 0);
    } else {
      this.resetView();
    }
  }

  resetView() {
    this.desiredSpherical.copy(this.defaultSpherical);
    if (!this.perPartMode) {
      this.desiredSpherical.radius = this.defaultSpherical.radius + this.explodeTarget * 1.15;
    }
    this.desiredTarget.copy(this.defaultTarget);
  }

  _applyXray() {
    for (const rec of this.partRecords.values()) {
      const isOuter = Boolean(rec.def.isOuter);
      rec.meshes.forEach((m, idx) => {
        const base = rec.baseMats[idx];
        if (this.xrayMode && isOuter) {
          m.material.transparent = true;
          m.material.opacity = Math.min(base.opacity, 0.18);
          m.material.depthWrite = false;
        } else {
          m.material.transparent = base.transparent;
          m.material.opacity = base.opacity;
          m.material.depthWrite = !base.transparent;
        }
        m.material.needsUpdate = true;
      });
    }
  }

  _refreshHighlights() {
    const allowSelectedGlow = this.explodeTarget >= 0.15 || this.perPartMode;
    for (const [id, rec] of this.partRecords.entries()) {
      const isSelected = allowSelectedGlow && id === this.selectedPartId;
      const isHovered = id === this.hoveredPartId;
      rec.meshes.forEach((m, idx) => {
        const base = rec.baseMats[idx];
        if (!m.material.emissive) return;
        if (isSelected) {
          m.material.emissive.setHex(0xffb703);
          m.material.emissiveIntensity = 0.52;
        } else if (isHovered) {
          m.material.emissive.setHex(0x38bdf8);
          m.material.emissiveIntensity = 0.32;
        } else {
          m.material.emissive.setHex(base.emissiveHex);
          m.material.emissiveIntensity = base.emissiveIntensity;
        }
      });
    }
  }

  _updatePartPositions() {
    for (const rec of this.partRecords.values()) {
      const [ox, oy, oz] = rec.explodeOffset || rec.def.explodeOffset;
      const t = rec.currentExplode;
      rec.group.position.set(ox * t, oy * t, oz * t);
    }
  }

  _updateLabels() {
    if (!this.renderer) return;
    const w = this.canvasHost.clientWidth;
    const h = this.canvasHost.clientHeight;
    if (w === 0 || h === 0) return;

    this.labelsHost.hidden = false;
    const isExploded = this.explodeCurrent >= 0.15 || this.perPartMode;
    const showAll = this.showLabels && !this.perPartMode && !this.driveMode && this.explodeCurrent >= 0.15;
    const proj = new THREE.Vector3();

    for (const [id, rec] of this.partRecords.entries()) {
      const visible =
        !this.driveMode &&
        (showAll || id === this.hoveredPartId || (isExploded && id === this.selectedPartId));
      if (!visible) {
        rec.labelEl.hidden = true;
        continue;
      }
      proj.copy(rec.center).add(rec.group.position);
      proj.project(this.camera);

      if (proj.z > 1 || proj.z < -1) {
        rec.labelEl.hidden = true;
        continue;
      }

      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      const inBounds = x >= 24 && x <= w - 24 && y >= 24 && y <= h - 60;
      rec.labelEl.hidden = !inBounds;
      if (inBounds) {
        rec.labelEl.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`;
      }
    }
  }

  _loop() {
    this.animFrame = requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    const lerpSpeed = prefersReducedMotion() ? 1 : Math.min(1, dt * 9);

    if (this.autoRotate && this.activePointers.size === 0 && !prefersReducedMotion()) {
      this.desiredSpherical.theta += dt * 0.45;
    }

    this.spherical.radius += (this.desiredSpherical.radius - this.spherical.radius) * lerpSpeed;
    this.spherical.phi += (this.desiredSpherical.phi - this.spherical.phi) * lerpSpeed;
    this.spherical.theta += (this.desiredSpherical.theta - this.spherical.theta) * lerpSpeed;
    this.target.lerp(this.desiredTarget, lerpSpeed);

    const camOffset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(camOffset);
    this.camera.lookAt(this.target);

    this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * lerpSpeed;
    for (const rec of this.partRecords.values()) {
      rec.currentExplode += (rec.targetExplode - rec.currentExplode) * lerpSpeed;
    }
    this._updatePartPositions();
    this._updateDriveSimulation(dt);

    const allowSelectedGlow = this.explodeCurrent >= 0.15 || this.perPartMode;
    if (allowSelectedGlow && this.selectedPartId && this.partRecords.has(this.selectedPartId) && !prefersReducedMotion()) {
      const rec = this.partRecords.get(this.selectedPartId);
      const pulse = 0.42 + 0.25 * Math.sin(this.clock.elapsedTime * 5.5);
      for (const m of rec.meshes) {
        if (m.material.emissive) m.material.emissiveIntensity = pulse;
      }
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
    this._updateLabels();
  }
}
