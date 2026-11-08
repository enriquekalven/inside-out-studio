// Wave 3B: Spatial Headsets & Personal Audio (`audio-xr`) — 3 Flagship 10-Part 3D Models
// 1. `apple-vision-pro` — Apple Vision Pro Spatial Computer
// 2. `airpods-pro-2` — AirPods Pro 2 + MagSafe Charging Case
// 3. `anc-over-ear-headphones` — Flagship Over-Ear ANC Headphones

import * as THREE from '../../vendor/three.module.js';
import {
  mat,
  carPaint,
  brushedMetal,
  chromeMat,
  carbonFiberMat,
  glassMat,
  emissiveMat,
  pcbMat,
  screenMat,
  box,
  rbox,
  cyl,
  sphere,
  torus,
  cone,
  tube,
  lathe,
  extrudeProfile,
  buildHexBoltArray,
  buildCoilSpring,
  buildFinArray,
} from '../materials.js';

function buildAudioXrModel(cfg) {
  const primary = carPaint(cfg.primaryHex, { metalness: 0.35, roughness: 0.14 });
  const accent = carPaint(cfg.accentHex || 0xec4899);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const alu = brushedMetal(0xdbe2ea, { metalness: 0.9, roughness: 0.18 });
  const spaceGray = brushedMetal(0x475569, { metalness: 0.86, roughness: 0.22 });
  const copper = brushedMetal(0xc25e1a, { metalness: 0.94, roughness: 0.14 });
  const gold = brushedMetal(0xfbbf24, { metalness: 0.92, roughness: 0.16 });
  const chrome = chromeMat();
  const white = mat(0xf8fafc, { roughness: 0.16, metalness: 0.06, clearcoat: 0.85 });
  const knitFabric = mat(0xe2e8f0, { roughness: 0.82, metalness: 0.02 });
  const matteBlack = mat(0x0f172a, { roughness: 0.58, metalness: 0.12 });
  const carbon = carbonFiberMat([6, 6]);
  const glass = glassMat(0x1e293b, 0.58);
  const clearOptic = glassMat(0x93c5fd, 0.38);
  const parts = cfg.partsSpec.map(([id, name, category, isOuter, explodeOffset, desc, funFact, fn]) => ({
    id,
    name,
    category,
    isOuter,
    explodeOffset,
    desc,
    funFact,
    build(g) {
      fn(g, {
        primary,
        accent,
        darkSteel,
        alu,
        spaceGray,
        copper,
        gold,
        chrome,
        white,
        knitFabric,
        matteBlack,
        carbon,
        glass,
        clearOptic,
      });
    },
  }));
  return {
    id: cfg.id,
    name: cfg.name,
    brand: cfg.brand,
    badge: cfg.badge,
    desc: cfg.desc,
    cameraPos: cfg.cameraPos || [3.35, 1.95, 3.55],
    parts,
    quiz: cfg.quiz,
  };
}

export const AUDIO_XR_MODELS = [
  // ==========================================================================
  // 1. APPLE VISION PRO SPATIAL COMPUTER
  // ==========================================================================
  buildAudioXrModel({
    id: 'apple-vision-pro',
    name: 'Apple Vision Pro Spatial Computer',
    brand: 'Apple Spatial Hardware Engineering',
    badge: '23M-Pixel Micro-OLED • M2 + R1 Dual Silicon • 12 Cameras & LiDAR',
    desc: 'Wearable spatial computer sculpting a single piece of 3D-formed laminated glass into an aluminum alloy frame—housing 23-million-pixel stamp-sized Micro-OLED displays, catadioptric pancake lenses, an R1 12ms sensor-fusion chip, M2 processor, EyeSight lenticular OLED, and Spatial Audio pods.',
    primaryHex: 0xdbe2ea,
    accentHex: 0x38bdf8,
    cameraPos: [3.35, 1.95, 3.65],
    partsSpec: [
      [
        'laminated-3d-front-glass',
        '3D-Formed Laminated Optical Front Crystal Visor',
        'Optical Shield',
        true,
        [0, 0.15, 1.45],
        'Single continuous sheet of 3D-formed, optically polished laminated glass acting as an optical lens cover for all 12 cameras and LiDAR sensors.',
        'Unlike ski goggles made of soft plastic, the front visor is precision-formed optical glass so none of the 12 passthrough and tracking cameras suffer distortion!',
        (g, m) => {
          // Curved ski-goggle visor shell with subtle nose bridge arch
          const visor = new THREE.Group();
          visor.position.set(0, 0.08, 0.44);
          g.add(visor);
          rbox(visor, 1.42, 0.56, 0.16, 0.14, m.glass, [0, 0, 0]);
          // Nose bridge cutout arch accent
          cyl(visor, 0.14, 0.18, 0.18, 20, m.matteBlack, [0, -0.25, -0.02], [Math.PI / 2, 0, 0]);
        },
      ],
      [
        'eyesight-lenticular-oled',
        'Curved EyeSight Lenticular Front OLED Display',
        'External Social Display',
        false,
        [0, 0.45, 1.05],
        'Flexible curved outer OLED laminated behind a multi-layer lenticular lens film that projects a 3D stereo-perspective view of the wearer’s eyes to people in the room.',
        'Lenticular micro-ridges steer slightly different images left and right so people standing beside you see your eyes with realistic 3D depth instead of a flat sticker!',
        (g, m) => {
          const eye = new THREE.Group();
          eye.position.set(0, 0.10, 0.35);
          g.add(eye);
          rbox(eye, 1.24, 0.44, 0.032, 0.08, m.matteBlack, [0, 0, 0]);
          // Glowing cyan/indigo EyeSight stereo aura behind the glass
          for (const sx of [-0.32, 0.32]) {
            const aura = cyl(eye, 0.14, 0.14, 0.036, 24, emissiveMat(0x38bdf8, 0.95), [sx, 0.02, 0.005], [Math.PI / 2, 0, 0], [1.35, 1, 0.78]);
            aura.userData.isRgbBlade = true;
          }
        },
      ],
      [
        'cnc-aluminum-frame-crown',
        '3D-Curved CNC Aluminum Unibody Frame, Digital Crown & Top Shutter Key',
        'Unibody Chassis',
        true,
        [0, 1.05, 0.35],
        'Custom aerospace aluminum-alloy frame bent in 3D curves with bottom intake vents, top exhaust louvers, a spatial photo button, and a knurled Immersion Digital Crown.',
        'Turning the knurled Digital Crown dials how much of your real living room fades into a virtual moonscape or cinema!',
        (g, m) => {
          rbox(g, 1.46, 0.58, 0.24, 0.14, m.alu, [0, 0.08, 0.26]);
          rbox(g, 1.32, 0.46, 0.26, 0.10, m.matteBlack, [0, 0.08, 0.26]);
          // Top-right knurled Digital Crown + Top-left Spatial Photo capture button
          cyl(g, 0.068, 0.068, 0.042, 24, m.chrome, [0.46, 0.39, 0.26]);
          torus(g, 0.068, 0.007, m.alu, [0.46, 0.405, 0.26], [Math.PI / 2, 0, 0]);
          rbox(g, 0.11, 0.028, 0.055, 0.012, m.alu, [-0.46, 0.38, 0.26]);
        },
      ],
      [
        'dual-m2-r1-curved-board',
        'Contoured Dual-Silicon Logic Board (Apple M2 + R1 Real-Time Sensor Chip)',
        'Spatial Silicon',
        false,
        [0, 0.85, -0.45],
        'Nose-bridged curved rigid-flex motherboard pairing an 8-core M2 SoC for spatial apps with the dedicated R1 co-processor streaming 12 cameras, 5 sensors, and 6 mics in 12 milliseconds.',
        '12 milliseconds is 8 times faster than the blink of an eye—eliminating motion sickness when you turn your head!',
        (g, m) => {
          // Curved gull-wing rigid-flex logic board arching over nose bridge
          rbox(g, 0.52, 0.24, 0.024, 0.008, pcbMat('#111827'), [-0.34, 0.12, 0.24], [0, 0.12, 0]);
          rbox(g, 0.52, 0.24, 0.024, 0.008, pcbMat('#111827'), [0.34, 0.12, 0.24], [0, -0.12, 0]);
          box(g, 0.24, 0.09, 0.018, m.copper, [0, 0.20, 0.25]);
          // M2 Silicon package (left) + R1 Sensor-Fusion package (right)
          rbox(g, 0.15, 0.15, 0.018, 0.004, m.spaceGray, [-0.32, 0.12, 0.255], [0, 0.12, 0]);
          rbox(g, 0.13, 0.13, 0.018, 0.004, m.chrome, [0.32, 0.12, 0.255], [0, -0.12, 0]);
        },
      ],
      [
        'lidar-passthrough-camera-bar',
        '12-Camera & LiDAR Sensor Array (Stereo Passthrough, Hand Tracking & TrueDepth)',
        'Spatial Sensing',
        false,
        [0, -0.85, 1.15],
        'Arcing carbon-fiber sensor bracket holding 2 high-res main passthrough cameras, 6 world/downward hand-tracking cameras, 4 internal IR eye-tracking cameras, LiDAR scanner, and IR illuminators.',
        'Downward-angled cameras watch your hands resting casually in your lap—so you never have to hold your arms up in the air or carry plastic controllers!',
        (g, m) => {
          rbox(g, 1.26, 0.14, 0.08, 0.03, m.carbon, [0, -0.08, 0.31]);
          // Center LiDAR dToF + TrueDepth dot projector
          cyl(g, 0.042, 0.042, 0.04, 18, m.matteBlack, [0, 0.02, 0.34], [Math.PI / 2, 0, 0]);
          cyl(g, 0.026, 0.026, 0.045, 16, m.clearOptic, [0, 0.02, 0.345], [Math.PI / 2, 0, 0]);
          // Twin stereo high-res passthrough cameras + 4 side/downward hand-tracking lenses
          for (const sx of [-0.36, 0.36]) {
            cyl(g, 0.052, 0.052, 0.045, 20, m.darkSteel, [sx, -0.06, 0.34], [Math.PI / 2, 0, 0]);
            sphere(g, 0.032, 16, 12, m.clearOptic, [sx, -0.06, 0.36]);
          }
          for (const sx of [-0.56, -0.20, 0.20, 0.56]) {
            cyl(g, 0.028, 0.028, 0.035, 16, m.chrome, [sx, -0.13, 0.33], [Math.PI * 0.62, 0, 0]);
          }
        },
      ],
      [
        'micro-oled-pancake-optics',
        '23-Million-Pixel Micro-OLED Silicon Displays, 3-Element Pancake Lenses & IPD Motors',
        'Spatial Optics',
        false,
        [0, 0.15, -0.85],
        'Two postage-stamp-sized 7.5-micron-pixel Micro-OLED panels paired with folded-light 3-element catadioptric pancake lenses, IR eye-tracking LED rings, and motorized interpupillary distance (IPD) worm drives.',
        'Each Micro-OLED panel fits 64 pixels into the space of a single iPhone pixel—delivering more than 4K resolution to EACH eye!',
        (g, m) => {
          for (const sx of [-0.34, 0.34]) {
            const barrel = new THREE.Group();
            barrel.position.set(sx, 0.08, 0.14);
            g.add(barrel);
            cyl(barrel, 0.20, 0.18, 0.14, 28, m.matteBlack, [0, 0, 0], [Math.PI / 2, 0, 0]);
            // Stamp-sized glowing Micro-OLED silicon backplane + multi-element pancake lens dome
            rbox(barrel, 0.16, 0.14, 0.015, 0.005, screenMat('ios'), [0, 0, 0.055]);
            sphere(barrel, 0.175, 24, 16, m.clearOptic, [0, 0, -0.05], [0, 0, 0], [1.05, 0.95, 0.32]);
            // Ring of 8 invisible-IR eye-tracking LEDs around lens rim + motorized IPD leadscrew
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              sphere(barrel, 0.009, 8, 8, emissiveMat(0xa855f7, 0.9), [Math.cos(a) * 0.185, Math.sin(a) * 0.185, -0.068]);
            }
            buildCoilSpring(barrel, [0, 0.21, 0], 0.16, 0.014, 0.0035, 8, m.gold);
          }
        },
      ],
      [
        'dual-whisper-centrifugal-blowers',
        'Twin Whisper-Quiet Counter-Rotating Micro Centrifugal Blowers',
        'Thermal Management',
        false,
        [0, -0.95, 0.25],
        'Left and right ultra-thin centrifugal impeller fans drawing cool air gently past the optical barrels and M2/R1 silicon and venting silently upward.',
        'Active acoustic shaping keeps both fans quieter than a soft whisper right beside your temples even while rendering dual-4K 90Hz worlds!',
        (g, m) => {
          for (const sx of [-0.46, 0.46]) {
            const fan = new THREE.Group();
            fan.position.set(sx, -0.10, 0.21);
            fan.userData.driveAnim = 'fan';
            fan.userData.spinAxis = 'y';
            g.add(fan);
            cyl(fan, 0.11, 0.11, 0.032, 22, m.spaceGray, [0, 0, 0]);
            for (let b = 0; b < 13; b++) {
              const a = (b / 13) * Math.PI * 2;
              box(fan, 0.006, 0.028, 0.045, m.alu, [Math.cos(a) * 0.075, 0, Math.sin(a) * 0.075], [0, -a, 0]);
            }
          }
        },
      ],
      [
        'magnetic-light-seal-cushion',
        'Magnetic Woven Light Seal & Memory-Foam Face Cushion',
        'Ergonomic Light Seal',
        true,
        [0, 0.05, -1.25],
        'Magnetically snap-attached textile Light Seal and breathable micro-velvet face cushion blocking stray room light while positioning eyes at the exact focal plane.',
        'Hidden rare-earth neodymium magnets snap the Light Seal and optional ZEISS prescription optical inserts into sub-millimeter alignment!',
        (g, m) => {
          rbox(g, 1.38, 0.54, 0.22, 0.13, m.knitFabric, [0, 0.08, 0.02]);
          rbox(g, 1.18, 0.38, 0.26, 0.09, m.matteBlack, [0, 0.08, 0.02]);
        },
      ],
      [
        'spatial-audio-straps-knit-band',
        'Dual-Driver Ray-Traced Spatial Audio Pods & 3D-Knitted Solo Loop Headband',
        'Spatial Audio & Fit',
        true,
        [0, 0.25, -1.75],
        'Side power/audio temples housing dual-driver directional speaker pods right above each ear without covering the ear canal, joined by a 3D-knitted ribbed Solo Knit Band with orange quick-release pull tabs and fit dial.',
        'Audio Ray Tracing bounces virtual sound waves off your actual room walls (measured by LiDAR!) so virtual voices sound like they are truly standing in your room!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            // Side white audio temple strap + raised Dual-Driver Spatial Audio pod + bayonet twist power port (left)
            rbox(g, 0.065, 0.14, 0.58, 0.03, m.white, [sx * 0.72, 0.08, -0.18]);
            rbox(g, 0.085, 0.16, 0.20, 0.035, m.white, [sx * 0.725, 0.08, -0.22]);
            for (const dz of [-0.18, -0.26]) {
              cyl(g, 0.028, 0.028, 0.02, 14, m.copper, [sx * 0.75, 0.08, dz], [0, 0, Math.PI / 2]);
            }
          }
          // 3D-knitted curved ribbed rear headband arc + side micro-adjustment dial
          torus(g, 0.72, 0.10, m.knitFabric, [0, 0.08, -0.44], [Math.PI / 2, 0, 0], [1.0, 0.82, 1.25]);
          cyl(g, 0.058, 0.058, 0.032, 20, m.alu, [0.76, 0.08, -0.52], [0, 0, Math.PI / 2]);
        },
      ],
      [
        'braided-tether-external-battery',
        'Machined Aluminum External 35.9Wh Battery Brick & Twist-Lock Braided Cable',
        'Off-Head Power Pack',
        true,
        [-1.35, -0.95, -0.35],
        'Bead-blasted aluminum pocket battery housing three high-voltage pouch cells connected via a woven braided tether and 12-pin bayonet twist-lock temple plug.',
        'Moving 353 grams of lithium battery out of the headset and into your pocket keeps half a pound of torque off your neck and cheekbones!',
        (g, m) => {
          rbox(g, 0.34, 0.56, 0.11, 0.045, m.alu, [-0.98, -0.46, -0.12]);
          // Twist-lock bayonet temple puck + woven white braided power cable
          cyl(g, 0.048, 0.048, 0.035, 20, m.alu, [-0.77, 0.08, -0.12], [0, 0, Math.PI / 2]);
          tube(g, [[-0.78, 0.08, -0.12], [-0.94, -0.08, -0.12], [-0.98, -0.19, -0.12]], 0.015, m.white, false, 20);
        },
      ],
    ],
    quiz: [
      {
        q: 'Which dedicated real-time chip processes 12 cameras, 5 sensors, and 6 microphones in just 12 milliseconds to prevent motion sickness?',
        correctId: 'dual-m2-r1-curved-board',
        distractors: ['laminated-3d-front-glass', 'braided-tether-external-battery', 'magnetic-light-seal-cushion'],
      },
      {
        q: 'How does Vision Pro pack more than 4K resolution into each eye inside a compact goggle depth?',
        correctId: 'micro-oled-pancake-optics',
        distractors: ['eyesight-lenticular-oled', 'dual-whisper-centrifugal-blowers', 'cnc-aluminum-frame-crown'],
      },
      {
        q: 'How does the front EyeSight display show nearby people a natural 3D perspective of your eyes?',
        correctId: 'eyesight-lenticular-oled',
        distractors: ['laminated-3d-front-glass', 'lidar-passthrough-camera-bar', 'magnetic-light-seal-cushion'],
      },
      {
        q: 'Why did engineers put the 35.9Wh machined-aluminum battery in your pocket on a braided twist-lock cable?',
        correctId: 'braided-tether-external-battery',
        distractors: ['dual-whisper-centrifugal-blowers', 'spatial-audio-straps-knit-band', 'cnc-aluminum-frame-crown'],
      },
      {
        q: 'How does Vision Pro let you pinch and tap icons with your hands resting comfortably in your lap with zero controllers?',
        correctId: 'lidar-passthrough-camera-bar',
        distractors: ['eyesight-lenticular-oled', 'braided-tether-external-battery', 'dual-whisper-centrifugal-blowers'],
      },
    ],
  }),

  // ==========================================================================
  // 2. AIRPODS PRO 2 + MAGSAFE CHARGING CASE
  // ==========================================================================
  buildAudioXrModel({
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2 + MagSafe Charging Case',
    brand: 'Apple Acoustic & SiP Engineering',
    badge: 'Apple H2 SiP • 48kHz Active Noise Cancellation • U1 Find My Case',
    desc: 'Miniature acoustic marvel dissected alongside its MagSafe USB-C charging case: revealing the Apple H2 System-in-Package, low-distortion high-excursion neodymium woofer, inward & outward ANC microphones, capacitive touch-swipe stem, MagSafe Qi coil, and lanyard speaker.',
    primaryHex: 0xf8fafc,
    accentHex: 0x10b981,
    cameraPos: [3.25, 1.95, 3.45],
    partsSpec: [
      [
        'gloss-white-bud-shells-vents',
        'Contoured Left & Right Acoustic Earbud Shells & Pressure-Equalizer Vents',
        'Acoustic Enclosures',
        true,
        [0, 1.05, 0.75],
        'Precision ultrasonic-welded gloss-white left and right earbud housings with laser-cut black acoustic mesh vents that equalize inner-ear air pressure.',
        'Without that tiny black oval pressure vent, sealing silicone tips into your ears would make your own footsteps and voice boom uncomfortably inside your head!',
        (g, m) => {
          for (const sx of [-0.42, 0.42]) {
            const bud = new THREE.Group();
            bud.position.set(sx, 0.56, 0);
            bud.rotation.y = sx < 0 ? 0.35 : -0.35;
            g.add(bud);
            sphere(bud, 0.21, 24, 18, m.white, [0, 0.12, 0.04], [0, 0, 0], [0.92, 0.88, 1.15]);
            // Angled stem cylinder + black acoustic equalization vent grille
            cyl(bud, 0.068, 0.058, 0.48, 20, m.white, [0, -0.14, -0.06], [0.22, 0, 0]);
            cyl(bud, 0.058, 0.058, 0.018, 18, m.chrome, [0, -0.375, -0.112], [0.22, 0, 0]);
            rbox(bud, 0.05, 0.11, 0.018, 0.008, m.matteBlack, [0, 0.16, -0.19]);
          }
        },
      ],
      [
        'silicone-acoustic-ear-tips',
        'Snap-Lock Dual-Density Silicone Ear Tips & Micromesh Wax Guards',
        'Passive Acoustic Seal',
        true,
        [0, 0.95, 1.35],
        'Soft medical-grade liquid-silicone-rubber ear tips with an internal rigid snap ring and hydrophobic acoustic mesh that block ambient high-frequency noise passively.',
        'Passive silicone sealing blocks high-pitched clatter (like clinking silverware), while electronic ANC cancels low-frequency rumbles (like jet engines)!',
        (g, m) => {
          const softTip = mat(0xf1f5f9, { roughness: 0.45, opacity: 0.86 });
          for (const sx of [-0.42, 0.42]) {
            const tip = new THREE.Group();
            tip.position.set(sx + (sx < 0 ? -0.08 : 0.08), 0.68, 0.24);
            tip.rotation.y = sx < 0 ? 0.35 : -0.35;
            g.add(tip);
            lathe(tip, [[-0.08, 0.11], [-0.02, 0.175], [0.06, 0.165], [0.11, 0.085]], 24, softTip, [0, 0, 0], [Math.PI / 2, 0, 0]);
            cyl(tip, 0.075, 0.075, 0.015, 18, m.matteBlack, [0, 0, 0.09], [Math.PI / 2, 0, 0]);
          }
        },
      ],
      [
        'high-excursion-custom-drivers',
        'Custom 11mm High-Excursion Neodymium Dynamic Drivers & Voice Coils',
        'Acoustic Transducers',
        false,
        [0, 1.35, 0.15],
        'Custom low-distortion 11mm diaphragm drivers powered by N52 neodymium ring magnets and copper-clad aluminum voice coils aligned straight down the ear canal.',
        'By firing straight toward the eardrum instead of bouncing around a bend, the 11mm diaphragm delivers deep sub-bass from a chamber smaller than a blueberry!',
        (g, m) => {
          for (const sx of [-0.42, 0.42]) {
            const drv = new THREE.Group();
            drv.position.set(sx, 0.68, 0.09);
            drv.rotation.y = sx < 0 ? 0.35 : -0.35;
            g.add(drv);
            cyl(drv, 0.135, 0.115, 0.075, 24, m.alu, [0, 0, 0], [Math.PI / 2, 0, 0]);
            torus(drv, 0.095, 0.018, m.copper, [0, 0, -0.01]);
            sphere(drv, 0.085, 18, 12, m.matteBlack, [0, 0, 0.03], [0, 0, 0], [1, 1, 0.32]);
          }
        },
      ],
      [
        'apple-h2-sip-amplifier',
        'Apple H2 System-in-Package (SiP) & Custom High-Dynamic-Range Amplifier',
        'Computational Audio',
        false,
        [-0.95, 1.15, -0.25],
        '10-layer microscopic System-in-Package chip packing 1 billion transistors to run Adaptive Transparency and 48,000-Hz Active Noise Cancellation anti-phase waves.',
        'Forty-eight thousand times every second, the H2 chip listens to outside noise and fires an exact upside-down mirror sound wave so the two waves cancel to silence!',
        (g, m) => {
          for (const sx of [-0.42, 0.42]) {
            rbox(g, 0.14, 0.16, 0.032, 0.006, pcbMat('#111827'), [sx, 0.66, -0.04], [0, sx < 0 ? 0.35 : -0.35, 0]);
            rbox(g, 0.085, 0.085, 0.022, 0.004, m.spaceGray, [sx, 0.67, -0.025], [0, sx < 0 ? 0.35 : -0.35, 0]);
            rbox(g, 0.055, 0.045, 0.018, 0.003, m.gold, [sx, 0.61, -0.025], [0, sx < 0 ? 0.35 : -0.35, 0]);
          }
        },
      ],
      [
        'anc-mics-skin-detect-sensor',
        'Feedforward + Feedback ANC Microphones & Optical Skin-Detect Sensor',
        'Acoustic & Biometric Sensors',
        false,
        [0.95, 1.15, -0.25],
        'Outward feedforward mic sampling world noise, inward feedback mic inside the nozzle checking what actually reaches your eardrum, plus an infrared water-molecular skin sensor.',
        'Unlike older proximity sensors fooled by pocket fabric, the Skin-Detect sensor looks for the infrared wavelength absorbed specifically by human skin water!',
        (g, m) => {
          for (const sx of [-0.42, 0.42]) {
            // Gold MEMS mic cans + ruby-tinted IR Skin-Detect window
            rbox(g, 0.045, 0.065, 0.024, 0.004, m.gold, [sx, 0.72, -0.14]);
            rbox(g, 0.040, 0.045, 0.022, 0.004, m.gold, [sx, 0.68, 0.15]);
            cyl(g, 0.022, 0.022, 0.015, 14, carPaint(0x881337), [sx, 0.59, 0.09], [Math.PI / 2, 0, 0]);
          }
        },
      ],
      [
        'stem-touch-battery-antenna',
        'Button-Cell Bud Batteries, Force-Touch Capacitive Swipe Stems & Bluetooth Antennas',
        'Stem Power & Controls',
        false,
        [0, 0.65, -0.95],
        'Miniature cylindrical lithium-ion cells, capacitive volume-swipe flex strips, strain-gauge pinch sensors, and laser-direct-structured Bluetooth 5.3 stem antennas.',
        'Sliding your fingertip just 8 millimeters up or down the tiny white stem adjusts volume smoothly via a multi-zone capacitive touch strip!',
        (g, m) => {
          for (const sx of [-0.42, 0.42]) {
            cyl(g, 0.042, 0.042, 0.28, 16, m.alu, [sx, 0.42, -0.06], [0.22, sx < 0 ? 0.35 : -0.35, 0]);
            box(g, 0.018, 0.26, 0.024, m.copper, [sx + (sx < 0 ? -0.045 : 0.045), 0.42, -0.05], [0.22, 0, 0]);
          }
        },
      ],
      [
        'magsafe-case-hinged-lid',
        'MagSafe Charging Case Shell, Counterbalanced Metal Hinge & Status LED',
        'Charging Case Enclosure',
        true,
        [0, -0.55, 0.95],
        'Pebble-smooth IP54 dust/sweat-resistant white charging case with a precision spring-over-center stainless hinge that snaps open and shut with a signature click.',
        'Tiny opposing magnets in the case lid and body create a crisp magnetic detent so the lid snaps shut cleanly instead of rattling!',
        (g, m) => {
          // Lower pebble case body + hinged open upper lid tilted back 55° + front green status LED
          rbox(g, 1.32, 0.66, 0.52, 0.16, m.white, [0, -0.34, 0]);
          rbox(g, 1.32, 0.34, 0.52, 0.15, m.white, [0, 0.16, -0.22], [-0.88, 0, 0]);
          rbox(g, 0.44, 0.08, 0.03, 0.012, m.alu, [0, -0.02, -0.262]);
          sphere(g, 0.018, 12, 10, emissiveMat(0x22c55e, 1.5), [0, -0.24, 0.262]);
        },
      ],
      [
        'twin-case-cells-u1-board',
        'Dual-Pouch Case Battery, Apple U1 Ultra-Wideband Find My Chip & USB-C Port',
        'Case Power & Precision Finding',
        false,
        [0, -1.25, 0],
        'Twin symmetrical lithium-polymer cells flanking the bottom USB-C receptacle and an Apple U1 Ultra-Wideband chip that guides your iPhone straight to a lost case within inches.',
        'Ultra-Wideband radio pulses measure time-of-flight at the speed of light so your phone points an exact arrow to a case buried between sofa cushions!',
        (g, m) => {
          for (const sx of [-0.36, 0.36]) {
            rbox(g, 0.44, 0.42, 0.32, 0.03, m.matteBlack, [sx, -0.36, 0]);
          }
          rbox(g, 0.24, 0.38, 0.028, 0.008, pcbMat('#0b5d3b'), [0, -0.38, 0]);
          rbox(g, 0.09, 0.09, 0.02, 0.004, m.gold, [0, -0.32, 0.02]);
          rbox(g, 0.14, 0.048, 0.09, 0.012, m.chrome, [0, -0.66, 0]);
        },
      ],
      [
        'magsafe-qi-coil-magnet-ring',
        'Rear Copper Qi/Apple-Watch Wireless Induction Coil & MagSafe Magnet Ring',
        'Wireless Power Transfer',
        false,
        [0, -0.55, -1.15],
        'Multi-turn planar Litz-wire copper receiver coil backed by nanocrystalline ferrite shielding and radial neodymium alignment magnets compatible with Qi, MagSafe, and Apple Watch pucks.',
        'An oscillating magnetic field from a charging pad induces electric current directly in this flat spiral copper pancake—charging through solid plastic with zero exposed pins!',
        (g, m) => {
          cyl(g, 0.24, 0.24, 0.016, 32, m.darkSteel, [0, -0.34, -0.23], [Math.PI / 2, 0, 0]);
          for (let r = 0.07; r <= 0.19; r += 0.03) {
            torus(g, r, 0.011, m.copper, [0, -0.34, -0.24]);
          }
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            rbox(g, 0.035, 0.06, 0.018, 0.004, m.chrome, [Math.cos(a) * 0.23, -0.34 + Math.sin(a) * 0.23, -0.235], [0, 0, a]);
          }
        },
      ],
      [
        'case-chime-speaker-lanyard-loop',
        'Case Find-My Piezo/Dynamic Chime Speaker & Conductive Metal Lanyard Loop',
        'Case Acoustics & Antenna',
        false,
        [1.15, -0.55, 0],
        'Bottom acoustic chime speaker for audible Find My pings plus a CNC-machined side aluminum lanyard loop that doubles as part of the Ultra-Wideband antenna!',
        'That little silver lanyard loop on the side isn’t just for wrist straps—a flex cable connects it internally so it radiates Ultra-Wideband Find My signals!',
        (g, m) => {
          rbox(g, 0.22, 0.14, 0.16, 0.02, m.spaceGray, [0.34, -0.58, 0.08]);
          cyl(g, 0.048, 0.048, 0.03, 18, m.copper, [0.34, -0.65, 0.08]);
          // Side CNC aluminum dual-hole lanyard bracket + gold UWB antenna flex
          rbox(g, 0.035, 0.20, 0.12, 0.015, m.chrome, [0.655, -0.28, 0]);
          tube(g, [[0.64, -0.28, 0], [0.38, -0.30, 0], [0.08, -0.32, 0.02]], 0.008, m.gold, false, 16);
        },
      ],
    ],
    quiz: [
      {
        q: 'How many times per second does the Apple H2 chip sample outside noise to generate anti-phase noise-cancellation waves?',
        correctId: 'apple-h2-sip-amplifier',
        distractors: ['magsafe-case-hinged-lid', 'silicone-acoustic-ear-tips', 'case-chime-speaker-lanyard-loop'],
      },
      {
        q: 'What surprising double duty does the silver metal lanyard loop on the side of the charging case perform?',
        correctId: 'case-chime-speaker-lanyard-loop',
        distractors: ['gloss-white-bud-shells-vents', 'high-excursion-custom-drivers', 'silicone-acoustic-ear-tips'],
      },
      {
        q: 'Why does each AirPod Pro shell have a tiny black acoustic pressure-equalization vent on the outside?',
        correctId: 'gloss-white-bud-shells-vents',
        distractors: ['magsafe-qi-coil-magnet-ring', 'twin-case-cells-u1-board', 'magsafe-case-hinged-lid'],
      },
      {
        q: 'Which chip inside the charging case uses speed-of-light radio pulses to point an arrow straight to a lost case?',
        correctId: 'twin-case-cells-u1-board',
        distractors: ['silicone-acoustic-ear-tips', 'high-excursion-custom-drivers', 'anc-mics-skin-detect-sensor'],
      },
      {
        q: 'How does the Skin-Detect sensor tell the difference between your actual ear and the inside of a jacket pocket?',
        correctId: 'anc-mics-skin-detect-sensor',
        distractors: ['magsafe-qi-coil-magnet-ring', 'magsafe-case-hinged-lid', 'stem-touch-battery-antenna'],
      },
    ],
  }),

  // ==========================================================================
  // 3. FLAGSHIP OVER-EAR ANC HEADPHONES
  // ==========================================================================
  buildAudioXrModel({
    id: 'anc-over-ear-headphones',
    name: 'Flagship Over-Ear ANC Headphones',
    brand: 'Sony WH-1000XM5 / AirPods Max Class',
    badge: '40mm Carbon-Dome Drivers • 8-Mic Multi-Noise ANC • 30-Hr Battery',
    desc: 'Reference wireless active-noise-canceling over-ear headphones combining telescoping stainless headband arms, anodized earcups, 40mm carbon-fiber-composite dynamic drivers with dual neodymium ring magnets, 8 beamforming ANC microphones, and viscoelastic memory-foam cushions.',
    primaryHex: 0x334155,
    accentHex: 0xf59e0b,
    cameraPos: [3.35, 2.05, 3.65],
    partsSpec: [
      [
        'spring-steel-headband-canopy',
        'Breathable Knit-Mesh Headband Canopy & Spring-Steel Arch',
        'Headband Suspension',
        true,
        [0, 1.35, 0],
        'Flexible high-carbon spring-steel band wrapped in soft memory foam or a breathable woven mesh canopy that distributes weight evenly across the crown of the head.',
        'Spreading clamping force across a wide suspended mesh canopy cuts peak pressure on the top of your skull by more than half during long flights!',
        (g, m) => {
          torus(g, 0.68, 0.055, m.knitFabric, [0, 0.38, 0], [0, 0, 0], [1, 1.05, 0.45]);
          // Only keep upper arch visually dominant via twin stainless frame rails
          for (const z of [-0.055, 0.055]) {
            tube(
              g,
              [
                [-0.68, 0.22, z],
                [-0.52, 0.84, z],
                [0, 1.06, z],
                [0.52, 0.84, z],
                [0.68, 0.22, z],
              ],
              0.018,
              m.chrome,
              false,
              28,
            );
          }
          // Remove bottom half of torus by using sculpted crown cushion pad instead:
          g.children.shift();
          tube(
            g,
            [
              [-0.56, 0.72, 0],
              [-0.32, 0.98, 0],
              [0, 1.05, 0],
              [0.32, 0.98, 0],
              [0.56, 0.72, 0],
            ],
            0.052,
            m.knitFabric,
            false,
            28,
          );
        },
      ],
      [
        'telescoping-arms-gimbal-yokes',
        'Stepless Telescoping Stainless Arms & Dual-Axis Gimbal Yokes',
        'Articulated Suspension',
        true,
        [0, 0.75, -0.95],
        'Smoothly damped telescoping stainless-steel extension rods and 2-axis rotating yokes with internal coiled ribbon wires so earcups swivel flat and conform to any jaw.',
        'Internal coiled micro-cables flex over 50,000 times inside the swivel joints without fatiguing while carrying balanced audio between left and right cups!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            cyl(g, 0.026, 0.026, 0.42, 16, m.chrome, [sx * 0.66, 0.10, 0], [0, 0, sx * -0.14]);
            cyl(g, 0.036, 0.036, 0.14, 18, m.spaceGray, [sx * 0.62, 0.28, 0], [0, 0, sx * -0.18]);
            // Gimbal pivot fork + internal spring
            torus(g, 0.18, 0.018, m.alu, [sx * 0.68, -0.18, 0], [0, Math.PI / 2, 0]);
            buildCoilSpring(g, [sx * 0.68, -0.02, 0], 0.08, 0.022, 0.004, 5, m.gold);
          }
        },
      ],
      [
        'anodized-acoustic-earcup-shells',
        'Bead-Blasted Anodized Aluminum Outer Earcup Shells & Bass Reflex Ports',
        'Acoustic Chambers',
        true,
        [1.35, -0.25, 0],
        'Deep CNC-machined anodized aluminum earcup shells creating rigid, resonance-free back-volumes with precision bass-reflex tuning ports.',
        'Machined aluminum is far stiffer than thin plastic—stopping the outer shell from vibrating and muddying orchestral midrange notes!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            rbox(g, 0.16, 0.62, 0.48, 0.075, m.spaceGray, [sx * 0.72, -0.24, 0]);
            // Copper-accented acoustic port ring on upper rim
            torus(g, 0.024, 0.006, m.copper, [sx * 0.78, 0.02, 0.12], [0, Math.PI / 2, 0]);
          }
        },
      ],
      [
        'viscoelastic-memory-foam-cushions',
        'Magnetic Viscoelastic Memory-Foam Ear Cushions & Acoustic Mesh',
        'Acoustic Isolation',
        true,
        [-1.35, -0.25, 0],
        'Magnetically detachable slow-rebound memory-foam ear pads wrapped in acoustically engineered mesh or soft vegan leather for an airtight circumaural seal.',
        'Even a 2-millimeter air gap around glasses frames can leak 10 decibels of low-bass—slow-rebound memory foam molds softly around temple arms to seal the gap!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            torus(
              g,
              0.22,
              0.068,
              m.knitFabric,
              [sx * 0.56, -0.24, 0],
              [0, Math.PI / 2, 0],
              [1.0, 1.24, 0.85],
            );
            // Inner L / R scrim fabric screen
            cyl(g, 0.20, 0.20, 0.008, 24, m.matteBlack, [sx * 0.58, -0.24, 0], [0, 0, Math.PI / 2], [1, 1, 1.22]);
          }
        },
      ],
      [
        'carbon-dome-40mm-drivers',
        'Angled 40mm Carbon-Fiber-Composite Dome Drivers & Dual Neodymium Ring Magnets',
        'Reference Drivers',
        false,
        [0, -0.35, 1.15],
        'Angled 40mm dynamic transducers pairing ultra-rigid woven carbon-fiber domes with flexible polyurethane surrounds and twin N52 neodymium motor rings.',
        'Just like studio loudspeaker tweeters, a rigid carbon-fiber dome resists flexing ("cone breakup") up to 40,000 Hz while a soft edge surround pumps deep 20 Hz bass!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            const drv = new THREE.Group();
            drv.position.set(sx * 0.62, -0.24, 0);
            drv.rotation.y = sx * -0.18;
            g.add(drv);
            cyl(drv, 0.175, 0.155, 0.065, 28, m.darkSteel, [0, 0, 0], [0, 0, Math.PI / 2]);
            torus(drv, 0.135, 0.022, m.chrome, [sx * 0.02, 0, 0], [0, Math.PI / 2, 0]);
            torus(drv, 0.115, 0.016, m.copper, [sx * -0.01, 0, 0], [0, Math.PI / 2, 0]);
            sphere(drv, 0.095, 20, 14, m.carbon, [sx * -0.02, 0, 0], [0, 0, 0], [0.35, 1, 1]);
          }
        },
      ],
      [
        'eight-mic-anc-beamforming-array',
        '8-Microphone Hybrid Feedforward/Feedback ANC & Wind-Shielded Voice Array',
        '8-Mic Noise Cancellation',
        false,
        [0, 0.25, 1.25],
        'Four microphones per earcup (outer wind-baffled feedforward mics, inner earcup feedback mics, and jaw-aimed voice pickup mics) feeding real-time multi-band ANC.',
        'Using 4 external mics per side lets the processor triangulate wind turbulence vs airplane cabin roar so gusts never create a "whoosh" in your ears!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            for (const [dy, dz] of [[0.18, 0.14], [0.18, -0.14], [-0.18, 0.16], [-0.02, 0.0]]) {
              cyl(g, 0.024, 0.024, 0.028, 14, m.gold, [sx * 0.68, -0.24 + dy, dz], [0, 0, Math.PI / 2]);
              torus(g, 0.028, 0.005, m.copper, [sx * 0.69, -0.24 + dy, dz], [0, Math.PI / 2, 0]);
            }
          }
        },
      ],
      [
        'dual-anc-qnc-dsp-board',
        'Dual-Processor ANC + 32-Bit DAC/Amp & LDAC/Lossless Bluetooth PCB (Right Cup)',
        'ANC & Hi-Res Audio DSP',
        false,
        [1.15, -0.85, -0.65],
        'Crescent-shaped gold-immersion motherboard in the right earcup carrying a dedicated ultra-low-latency ANC co-processor, 32-bit audiophile DAC, and Bluetooth 5.4 radio.',
        'Because signals traveling at the speed of electricity beat sound waves traveling through 15mm of air, the ANC chip computes the anti-noise wave BEFORE outside noise reaches your eardrum!',
        (g, m) => {
          rbox(g, 0.026, 0.42, 0.30, 0.012, pcbMat('#0b5d3b'), [0.66, -0.24, 0]);
          rbox(g, 0.020, 0.12, 0.12, 0.004, m.matteBlack, [0.68, -0.16, 0.04]);
          rbox(g, 0.020, 0.09, 0.09, 0.004, m.gold, [0.68, -0.32, -0.04]);
        },
      ],
      [
        'capacitive-touch-gesture-grid',
        'Right-Cup Capacitive Gesture Pad / Digital Volume Dial & Wear Sensor',
        'Touch & Wear Controls',
        false,
        [1.45, 0.35, 0.55],
        'Copper-etched capacitive X/Y grid lining the inside of the right shell—recognizing swipe-up for volume, swipe-forward for next track, and palm-cupping for instant Quick Attention conversation mode.',
        'Cupping your whole palm over the right earcup triggers every capacitive pad at once—instantly dropping music volume and switching on ambient passthrough so you can order coffee!',
        (g, m) => {
          rbox(g, 0.012, 0.44, 0.32, 0.03, m.copper, [0.76, -0.24, 0]);
          for (let i = -3; i <= 3; i++) {
            box(g, 0.016, 0.008, 0.28, m.gold, [0.765, -0.24 + i * 0.055, 0]);
          }
        },
      ],
      [
        'left-cup-1200mah-battery',
        'Left-Cup 1,200 mAh Fast-Charge Lithium-Polymer Battery & Weight Balance',
        '30-Hour Battery',
        false,
        [-1.15, -0.85, -0.65],
        'High-density 3.85V pouch battery housed inside the left earcup to balance the weight of the right-cup mainboard, supporting 3 hours of playback from a 3-minute USB-PD charge.',
        'Placing the battery in the left cup and the processors in the right cup keeps both sides within 2 grams of each other so the headphones never tilt on your head!',
        (g, m) => {
          rbox(g, 0.065, 0.36, 0.26, 0.02, m.matteBlack, [-0.66, -0.24, 0]);
          rbox(g, 0.070, 0.30, 0.22, 0.015, m.alu, [-0.66, -0.24, 0]);
          tube(g, [[-0.66, -0.04, 0], [-0.66, 0.14, 0]], 0.008, carPaint(0xef4444), false, 8);
        },
      ],
      [
        'usbc-lossless-35mm-io-module',
        'USB-C Lossless Audio/PD Port, Gold 3.5mm Analog Jack & ANC/Power Keys',
        'Wired & Wireless I/O',
        false,
        [0, -1.25, 0],
        'Lower-rim I/O sub-assemblies housing a USB-C port (for fast charging + 24-bit/96kHz lossless digital audio), gold-plated 3.5mm airline/studio jack, and tactile ANC/Transparency button.',
        'Even if the battery hits 0% on a 14-hour transpacific flight, plugging in the passive 3.5mm analog cable drives the 40mm carbon domes directly with zero battery power!',
        (g, m) => {
          // Right bottom USB-C port + Left bottom gold 3.5mm TRS jack + tactile ANC button
          rbox(g, 0.045, 0.04, 0.09, 0.008, m.chrome, [0.68, -0.55, 0.04]);
          cyl(g, 0.026, 0.026, 0.07, 16, m.gold, [-0.68, -0.55, 0.04]);
          rbox(g, 0.032, 0.075, 0.028, 0.008, m.accent, [-0.74, -0.44, -0.18]);
        },
      ],
    ],
    quiz: [
      {
        q: 'Why do flagship ANC headphones combine a stiff carbon-fiber center dome with a soft outer surround on their 40mm drivers?',
        correctId: 'carbon-dome-40mm-drivers',
        distractors: ['spring-steel-headband-canopy', 'left-cup-1200mah-battery', 'usbc-lossless-35mm-io-module'],
      },
      {
        q: 'How can the ANC chip fire an anti-noise wave BEFORE an airplane’s roar reaches your eardrum?',
        correctId: 'dual-anc-qnc-dsp-board',
        distractors: ['viscoelastic-memory-foam-cushions', 'telescoping-arms-gimbal-yokes', 'left-cup-1200mah-battery'],
      },
      {
        q: 'Why do engineers put the 1,200 mAh battery in the left earcup while the main DSP board lives in the right earcup?',
        correctId: 'left-cup-1200mah-battery',
        distractors: ['spring-steel-headband-canopy', 'capacitive-touch-gesture-grid', 'anodized-acoustic-earcup-shells'],
      },
      {
        q: 'What happens when you cup your entire palm over the right earcup’s capacitive touch grid?',
        correctId: 'capacitive-touch-gesture-grid',
        distractors: ['telescoping-arms-gimbal-yokes', 'usbc-lossless-35mm-io-module', 'anodized-acoustic-earcup-shells'],
      },
      {
        q: 'How does slow-rebound viscoelastic memory foam preserve deep 20 Hz bass for people who wear eyeglasses?',
        correctId: 'viscoelastic-memory-foam-cushions',
        distractors: ['eight-mic-anc-beamforming-array', 'spring-steel-headband-canopy', 'usbc-lossless-35mm-io-module'],
      },
    ],
  }),
];

export const AUDIO_XR_CATEGORY = {
  id: 'audio-xr',
  name: 'Spatial XR & Audio',
  fullName: 'Apple Vision Pro, AirPods Pro 2 & ANC Headphones',
  emoji: '🎧',
  icon: '🎧',
  tagline: 'Apple Vision Pro Spatial Computer • AirPods Pro 2 + MagSafe Case • Flagship Over-Ear ANC Headphones',
  models: AUDIO_XR_MODELS,
};
