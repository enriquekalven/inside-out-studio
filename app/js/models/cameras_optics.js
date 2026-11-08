// Wave 3C: Cameras & Precision Optics (`cameras`) — 3 Flagship 10-Part 3D Models
// 1. `mirrorless-fullframe-camera` — Full-Frame Mirrorless Camera & f/2.8 Zoom Lens
// 2. `instant-film-camera` — Retro Instant Film Camera
// 3. `imax-70mm-cinema-camera` — IMAX 70mm 15-Perf Cinema Camera

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

function buildOpticsModel(cfg) {
  const primary = carPaint(cfg.primaryHex, { metalness: 0.32, roughness: 0.24 });
  const accent = carPaint(cfg.accentHex || 0xea580c);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const magnesium = brushedMetal(0x334155, { metalness: 0.86, roughness: 0.28 });
  const alu = brushedMetal(0xdbe2ea, { metalness: 0.9, roughness: 0.18 });
  const brass = brushedMetal(0xd97706, { metalness: 0.93, roughness: 0.16 });
  const copper = brushedMetal(0xc25e1a, { metalness: 0.94, roughness: 0.14 });
  const chrome = chromeMat();
  const white = mat(0xf8fafc, { roughness: 0.2, metalness: 0.06, clearcoat: 0.7 });
  const cream = mat(0xfef3c7, { roughness: 0.26, metalness: 0.05, clearcoat: 0.65 });
  const matteBlack = mat(0x0f172a, { roughness: 0.68, metalness: 0.1 });
  const carbon = carbonFiberMat([5, 5]);
  const lensGlass = glassMat(0x38bdf8, 0.42);
  const magentaCoat = glassMat(0xc084fc, 0.45);
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
        magnesium,
        alu,
        brass,
        copper,
        chrome,
        white,
        cream,
        matteBlack,
        carbon,
        lensGlass,
        magentaCoat,
      });
    },
  }));
  return {
    id: cfg.id,
    name: cfg.name,
    brand: cfg.brand,
    badge: cfg.badge,
    desc: cfg.desc,
    cameraPos: cfg.cameraPos || [3.55, 2.05, 3.85],
    parts,
    quiz: cfg.quiz,
  };
}

export const CAMERAS_MODELS = [
  // ==========================================================================
  // 1. FULL-FRAME MIRRORLESS CAMERA & f/2.8 ZOOM LENS
  // ==========================================================================
  buildOpticsModel({
    id: 'mirrorless-fullframe-camera',
    name: 'Full-Frame Mirrorless Camera & f/2.8 Zoom Lens',
    brand: 'Sony Alpha α1 / Canon EOS R5 / Nikon Z8 Class',
    badge: '35mm Stacked CMOS • 5-Axis IBIS • 9-Blade Iris • 1/8000s Shutter',
    desc: 'Pro full-frame mirrorless camera and fast f/2.8 telephoto zoom lens dissected along the optical axis: revealing multi-coated fluorite & aspherical glass elements, 9-blade circular iris diaphragm, linear XD focus motors, focal-plane shutter, 5-axis IBIS floating 35mm sensor, and 9.44M-dot OLED EVF.',
    primaryHex: 0x1e293b,
    accentHex: 0xea580c,
    cameraPos: [3.55, 2.05, 3.85],
    partsSpec: [
      [
        'magnesium-weathersealed-body',
        'Die-Cast Magnesium Alloy Body, Ergonomic Grip & Knurled Command Dials',
        'Weather-Sealed Body',
        true,
        [-0.55, 0.35, -0.95],
        'Dust- and moisture-sealed magnesium-alloy monocoque with a deep sculpted right-hand grip, cinnabar-orange mount ring, machined mode/exposure dials, and shutter button.',
        'Every seam, button shaft, and dial on a pro camera body sits inside silicone O-ring gaskets so photographers can shoot in monsoons and desert sandstorms!',
        (g, m) => {
          rbox(g, 1.32, 0.92, 0.44, 0.055, m.magnesium, [0, -0.02, -0.22]);
          // Deep right-hand sculpted grip + angled chrome shutter button + top command dials
          rbox(g, 0.34, 0.90, 0.32, 0.075, m.matteBlack, [-0.54, -0.03, 0.04]);
          cyl(g, 0.058, 0.058, 0.04, 20, m.chrome, [-0.54, 0.44, 0.12], [0.32, 0, 0]);
          for (const dx of [-0.36, 0.38, 0.54]) {
            cyl(g, 0.088, 0.088, 0.055, 24, m.darkSteel, [dx, 0.46, -0.20]);
          }
          // Cinnabar-orange anodized lens mount ring + stainless bayonet flange with 12 gold pins
          torus(g, 0.365, 0.022, m.accent, [0, -0.02, 0.02]);
          cyl(g, 0.35, 0.35, 0.035, 32, m.chrome, [0, -0.02, 0.025], [Math.PI / 2, 0, 0]);
        },
      ],
      [
        'zoom-lens-barrel-helicoid',
        '24–70mm f/2.8 Lens Barrel, Rubberized Zoom/Focus Rings & Cam Helicoid',
        'Zoom Barrel Mechanics',
        true,
        [0, 0.15, 1.55],
        'Precision-machined aluminum outer lens barrel with ribbed zoom/focus control rings, petal lens hood, and internal cam-slot brass helicoid sleeves.',
        'Twisting the zoom ring rotates a slotted cam cylinder that glides three separate optical groups forward and backward at different rates simultaneously!',
        (g, m) => {
          const brl = new THREE.Group();
          brl.position.set(0, -0.02, 0.56);
          g.add(brl);
          cyl(brl, 0.355, 0.345, 0.98, 36, m.matteBlack, [0, 0, 0], [Math.PI / 2, 0, 0]);
          // Ribbed zoom & manual focus rubber rings + white/red focal-length index ring + front red/orange badge ring
          cyl(brl, 0.368, 0.368, 0.26, 36, m.darkSteel, [0, 0, -0.12], [Math.PI / 2, 0, 0]);
          cyl(brl, 0.368, 0.368, 0.18, 36, m.darkSteel, [0, 0, 0.24], [Math.PI / 2, 0, 0]);
          torus(brl, 0.358, 0.010, m.accent, [0, 0, 0.42]);
          // Front bayonet filter thread rim
          torus(brl, 0.355, 0.018, m.matteBlack, [0, 0, 0.49]);
        },
      ],
      [
        'aspherical-fluorite-lens-elements',
        '18-Element Multi-Coated Aspherical, ED & Fluorite Glass Optical Stack',
        'Full-Frame Optics',
        false,
        [0, 0.85, 1.15],
        'Cutaway optical train of convex, concave, and extreme-aspherical glass lenses coated in sub-wavelength nano-crystal magnesium fluoride layers.',
        'Uncoated glass reflects ~4% of light per surface—across 18 lens elements, nano-coatings rescue over 75% of the light that would otherwise bounce into ghost flare!',
        (g, m) => {
          const zPositions = [0.16, 0.30, 0.48, 0.68, 0.86, 0.99];
          const radii = [0.21, 0.24, 0.19, 0.26, 0.30, 0.325];
          zPositions.forEach((z, idx) => {
            const r = radii[idx];
            const glass = idx % 2 === 0 ? m.lensGlass : m.magentaCoat;
            sphere(g, r, 28, 18, glass, [0, -0.02, z], [0, 0, 0], [1, 1, idx === 5 ? 0.26 : 0.18]);
            torus(g, r, 0.012, m.alu, [0, -0.02, z]);
          });
        },
      ],
      [
        'nine-blade-aperture-iris',
        'Electromagnetic 9-Blade Circular Aperture Iris Diaphragm',
        'Exposure & Depth of Field',
        false,
        [0.85, 0.25, 0.65],
        'Nine curved matte-black carbon-composite blades actuated by a stepper ring motor to vary the pupil from wide-open f/2.8 to f/22 for creamy background bokeh.',
        'Curved 9-blade apertures keep out-of-focus city lights smooth and round even when stopped down, whereas old 6-blade lenses turned lights into hexagons!',
        (g, m) => {
          const iris = new THREE.Group();
          iris.position.set(0, -0.02, 0.40);
          g.add(iris);
          torus(iris, 0.26, 0.022, m.brass, [0, 0, 0]);
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2;
            rbox(
              iris,
              0.15,
              0.055,
              0.008,
              0.003,
              m.matteBlack,
              [Math.cos(a) * 0.145, Math.sin(a) * 0.145, 0],
              [0, 0, a + 0.68],
            );
          }
        },
      ],
      [
        'linear-autofocus-voice-motors',
        'Quad XD Extreme-Dynamic Linear Magnetic Autofocus Rails',
        'High-Speed Autofocus',
        false,
        [-0.95, 0.15, 0.65],
        'Contactless linear voice-coil motors gliding the internal focusing lens group along polished stainless guide rods at 120 updates per second with zero gear backlash.',
        'Instead of spinning gears, linear autofocus motors levitate and thrust the focus lens magnetically like a miniature maglev bullet train!',
        (g, m) => {
          for (const sx of [-0.25, 0.25]) {
            cyl(g, 0.012, 0.012, 0.56, 14, m.chrome, [sx, -0.02, 0.56], [Math.PI / 2, 0, 0]);
            rbox(g, 0.055, 0.085, 0.18, 0.01, m.copper, [sx, -0.02, 0.56]);
            rbox(g, 0.062, 0.045, 0.12, 0.008, m.alu, [sx, 0.04, 0.56]);
          }
        },
      ],
      [
        'focal-plane-mechanical-shutter',
        '1/8000-Second Carbon-Fiber Dual-Curtain Focal-Plane Shutter',
        'High-Speed Shutter',
        false,
        [0.85, -0.45, 0.15],
        'Ultra-light carbon-fiber & Kevlar front and rear shutter curtains racing vertically in front of the sensor at over 25 km/h—rated for 500,000 actuations.',
        'At 1/8000th of a second, the second curtain chases right behind the first curtain so fast that only a narrow 2-millimeter slit of light sweeps across the sensor!',
        (g, m) => {
          const sh = new THREE.Group();
          sh.position.set(0, -0.02, -0.04);
          g.add(sh);
          rbox(sh, 0.58, 0.44, 0.028, 0.01, m.darkSteel, [0, 0, 0]);
          // 4 overlapping horizontal carbon-fiber shutter blades + right-side electromagnetic actuator coil
          for (let b = -1.5; b <= 1.5; b += 1) {
            box(sh, 0.38, 0.065, 0.012, m.carbon, [-0.04, b * 0.062, 0.008]);
          }
          cyl(sh, 0.036, 0.036, 0.34, 16, m.copper, [0.23, 0, 0]);
        },
      ],
      [
        'stacked-fullframe-cmos-ibis',
        '35mm 50MP Stacked Full-Frame CMOS Sensor & 5-Axis IBIS Magnetic Gimbal',
        'Sensor & Stabilization',
        false,
        [0, -0.85, -0.35],
        '36 × 24mm back-illuminated stacked silicon image sensor floating inside a 5-axis electromagnetic voice-coil stage that cancels pitch, yaw, roll, X, and Y hand shake up to 8 stops.',
        'When you press the shutter halfway, three electromagnetic coils literally float the 50-megapixel silicon wafer in mid-air—counter-steering your hand tremors 1,000 times a second!',
        (g, m) => {
          const ibis = new THREE.Group();
          ibis.position.set(0, -0.02, -0.12);
          g.add(ibis);
          rbox(ibis, 0.64, 0.50, 0.032, 0.012, m.alu, [0, 0, 0]);
          // 3 copper voice-coil stabilization actuators (X, Y, Roll)
          for (const [cx, cy] of [[-0.24, 0.14], [0.24, 0.14], [0, -0.19]]) {
            rbox(ibis, 0.10, 0.075, 0.038, 0.006, m.copper, [cx, cy, 0]);
          }
          // Iridescent emerald/cyan 36×24mm Full-Frame CMOS silicon wafer
          box(ibis, 0.36, 0.24, 0.038, mat(0x0d9488, { metalness: 0.85, roughness: 0.08, clearcoat: 1.0 }), [0, 0, 0.008]);
          box(ibis, 0.38, 0.26, 0.035, m.brass, [0, 0, 0.002]);
        },
      ],
      [
        'oled-evf-prism-pentahousing',
        '9.44M-Dot Micro-OLED Electronic Viewfinder (EVF), Eyepiece Optics & Hot Shoe',
        'Viewfinder & Flash Mount',
        true,
        [0, 1.25, -0.25],
        'Top viewfinder hump housing a 0.64-inch 240fps Micro-OLED panel, 4-element 0.90× magnification eyepiece optics, eye proximity sensor, and multi-interface digital flash hot shoe.',
        'Unlike optical DSLRs that go black during exposure, a stacked-sensor mirrorless EVF shows zero-blackout 120fps motion AND previews exact exposure in pitch darkness!',
        (g, m) => {
          rbox(g, 0.44, 0.28, 0.44, 0.04, m.magnesium, [0, 0.52, -0.22]);
          // Rear cushioned rubber eyecup + coated eyepiece lens + internal Micro-OLED panel + top metal hot shoe
          rbox(g, 0.28, 0.20, 0.08, 0.025, m.matteBlack, [0, 0.50, -0.45]);
          sphere(g, 0.085, 20, 14, m.magentaCoat, [0, 0.50, -0.46], [0, 0, 0], [1.2, 0.9, 0.3]);
          box(g, 0.16, 0.12, 0.015, screenMat('ios'), [0, 0.50, -0.14]);
          rbox(g, 0.20, 0.028, 0.20, 0.005, m.chrome, [0, 0.67, -0.20]);
        },
      ],
      [
        'bionz-isp-cfexpress-mainboard',
        'Dual Image-Signal Processor (ISP) Board, Graphite Spreader & Dual CFexpress Type-A Slots',
        'Image Pipeline & Media',
        false,
        [0.95, 0.15, -0.85],
        'High-speed mainboard debayering 50MP 14-bit RAW bursts at 30 fps and encoding 8K 10-bit video straight into dual PCIe-gen CFexpress / UHS-II SD card slots.',
        'Shooting 30 uncompressed 50-megapixel RAW frames per second generates 1.8 gigabytes of sensor data every single second!',
        (g, m) => {
          rbox(g, 0.96, 0.72, 0.028, 0.01, pcbMat('#0b5d3b'), [0.06, -0.02, -0.26]);
          rbox(g, 0.18, 0.18, 0.022, 0.005, m.matteBlack, [0.16, 0.06, -0.24]);
          // Twin stainless CFexpress / SD card cages on left side
          for (const cy of [0.12, -0.16]) {
            rbox(g, 0.28, 0.22, 0.038, 0.006, m.alu, [0.46, cy, -0.24]);
          }
        },
      ],
      [
        'articulating-lcd-grip-battery',
        '4-Axis Vari-Angle Touchscreen LCD & Grip High-Capacity Li-Ion Battery',
        'Rear Display & Power',
        true,
        [-0.65, -0.55, -1.25],
        'Rear 3.2-inch tilt-and-flip vari-angle touch monitor paired with the 16.4Wh rechargeable lithium-ion battery cartridge sliding up into the right-hand grip.',
        'Tucking a cylindrical-cell battery vertically inside the right handgrip gives your fingers a deep ergonomic handle AND powers 600+ shots per charge!',
        (g, m) => {
          // 4-axis vari-angle rear touchscreen monitor tilted slightly out
          const lcd = new THREE.Group();
          lcd.position.set(0.08, -0.06, -0.47);
          lcd.rotation.x = -0.16;
          g.add(lcd);
          rbox(lcd, 0.86, 0.58, 0.036, 0.018, m.magnesium, [0, 0, 0]);
          box(lcd, 0.78, 0.50, 0.038, screenMat('ios'), [0, 0, -0.002]);
          // High-capacity Li-Ion grip battery cartridge
          rbox(g, 0.24, 0.62, 0.24, 0.025, carPaint(0x1d4ed8), [-0.54, -0.08, 0.02]);
          box(g, 0.16, 0.02, 0.08, m.brass, [-0.54, 0.235, 0.02]);
        },
      ],
    ],
    quiz: [
      {
        q: 'How does 5-axis In-Body Image Stabilization (IBIS) cancel your hand tremors during handheld low-light shots?',
        correctId: 'stacked-fullframe-cmos-ibis',
        distractors: ['zoom-lens-barrel-helicoid', 'magnesium-weathersealed-body', 'articulating-lcd-grip-battery'],
      },
      {
        q: 'Why are all 18 glass elements inside a pro f/2.8 zoom lens coated with microscopic nano-crystal layers?',
        correctId: 'aspherical-fluorite-lens-elements',
        distractors: ['focal-plane-mechanical-shutter', 'linear-autofocus-voice-motors', 'bionz-isp-cfexpress-mainboard'],
      },
      {
        q: 'How does a focal-plane mechanical shutter achieve a 1/8000-second exposure without moving faster than physics allows?',
        correctId: 'focal-plane-mechanical-shutter',
        distractors: ['nine-blade-aperture-iris', 'oled-evf-prism-pentahousing', 'zoom-lens-barrel-helicoid'],
      },
      {
        q: 'Why does a 9-blade iris diaphragm use curved blades instead of straight blades?',
        correctId: 'nine-blade-aperture-iris',
        distractors: ['linear-autofocus-voice-motors', 'stacked-fullframe-cmos-ibis', 'articulating-lcd-grip-battery'],
      },
      {
        q: 'Which contactless magnetic actuators glide the internal focusing glass along steel rods like a miniature maglev train?',
        correctId: 'linear-autofocus-voice-motors',
        distractors: ['magnesium-weathersealed-body', 'oled-evf-prism-pentahousing', 'bionz-isp-cfexpress-mainboard'],
      },
    ],
  }),

  // ==========================================================================
  // 2. RETRO INSTANT FILM CAMERA
  // ==========================================================================
  buildOpticsModel({
    id: 'instant-film-camera',
    name: 'Retro Instant Film Camera',
    brand: 'Polaroid OneStep / Fujifilm Instax Classic',
    badge: '45° Folding-Path Mirror • Stainless Reagent Rollers • Xenon Strobe',
    desc: 'Beloved retro rainbow-stripe instant camera revealing how a single press exposes silver-halide film via a 45° internal mirror, pops an electronic xenon flash capacitor, and squeezes the print through precision stainless-steel rollers to burst chemical reagent pods in broad daylight!',
    primaryHex: 0xfef3c7,
    accentHex: 0xef4444,
    cameraPos: [3.45, 2.05, 3.65],
    partsSpec: [
      [
        'retro-rainbow-step-shell',
        'Cream Two-Step Retro Housing, Red Shutter Button & Iconic 5-Stripe Rainbow',
        'Iconic Outer Shell',
        true,
        [0, 0.85, -0.55],
        'Two-tier vintage cream polycarbonate shell accented by the iconic 5-color rainbow stripe, bright red front shutter release button, and optical viewfinder tunnel.',
        'Edwin Land designed the original instant camera after his 3-year-old daughter asked on vacation why she couldn’t see the photo he had just taken right away!',
        (g, m) => {
          rbox(g, 1.24, 0.68, 0.92, 0.065, m.cream, [0, 0.18, -0.10]);
          rbox(g, 1.28, 0.36, 1.26, 0.055, m.matteBlack, [0, -0.32, 0.06]);
          // 5-color vertical/front rainbow stripe down the center face
          const rainbow = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6];
          rainbow.forEach((hex, i) => {
            box(g, 0.042, 0.24, 0.34, carPaint(hex), [-0.084 + i * 0.042, -0.11, 0.50]);
          });
          // Iconic bright-red front shutter button + lighten/darken exposure wheel
          cyl(g, 0.075, 0.075, 0.055, 22, carPaint(0xdc2626), [-0.42, -0.02, 0.40], [Math.PI / 2, 0, 0]);
          torus(g, 0.082, 0.010, m.chrome, [-0.42, -0.02, 0.38]);
        },
      ],
      [
        'triplet-taking-lens-shutter',
        'Multi-Coated 103mm Triplet Taking Lens, Rotary Shutter & CdS Light Meter',
        'Optics & Auto-Exposure',
        true,
        [0, 0.25, 1.25],
        'Three-element optical taking lens paired with an electromagnetic two-blade program shutter and a front phototransistor light-meter eye that measures scene brightness.',
        'Beside the main lens sits a tiny electric-eye light sensor that times the shutter down to 1/2000th of a second automatically as the picture is taken!',
        (g, m) => {
          cyl(g, 0.24, 0.26, 0.28, 28, m.matteBlack, [0, 0.20, 0.42], [Math.PI / 2, 0, 0]);
          torus(g, 0.22, 0.016, m.chrome, [0, 0.20, 0.55]);
          sphere(g, 0.175, 24, 16, m.lensGlass, [0, 0.20, 0.52], [0, 0, 0], [1, 1, 0.28]);
          // Adjacent electric-eye CdS light meter window
          cyl(g, 0.048, 0.048, 0.04, 18, m.matteBlack, [0.34, 0.18, 0.36], [Math.PI / 2, 0, 0]);
          sphere(g, 0.032, 14, 10, m.magentaCoat, [0.34, 0.18, 0.375]);
        },
      ],
      [
        'xenon-flash-tube-capacitor',
        'High-Voltage Xenon Strobe Tube, Parabolic Reflector & 330V Electrolytic Capacitor',
        'Electronic Strobe',
        false,
        [-0.95, 0.95, 0.55],
        'Upper flash housing holding a quartz xenon-gas arc tube inside a mirror-chrome trough reflector powered by a massive 330-volt cylindrical energy-storage capacitor.',
        'That classic high-pitched rising whine of a vintage flash camera is a tiny flyback transformer pumping battery voltage from 3.7V up to 330 volts inside the capacitor!',
        (g, m) => {
          rbox(g, 0.44, 0.22, 0.18, 0.025, m.matteBlack, [-0.34, 0.40, 0.32]);
          rbox(g, 0.38, 0.15, 0.06, 0.01, m.chrome, [-0.34, 0.40, 0.36]);
          cyl(g, 0.018, 0.018, 0.30, 14, emissiveMat(0xe0f2fe, 1.3), [-0.34, 0.40, 0.38], [0, 0, Math.PI / 2]);
          rbox(g, 0.40, 0.17, 0.02, 0.008, m.lensGlass, [-0.34, 0.40, 0.415]);
          // Internal 330V blue/gold photoflash electrolytic capacitor
          cyl(g, 0.068, 0.068, 0.32, 20, carPaint(0x1d4ed8), [-0.42, 0.12, -0.18]);
        },
      ],
      [
        'optical-viewfinder-tunnel',
        'Reverse-Galilean Optical Viewfinder Tunnel & Framing Reticle',
        'Direct Framing Optics',
        false,
        [0.95, 0.95, 0.25],
        'Dedicated right-side optical telescope tunnel running front-to-back with parallax framing lines and rear rubberized eyepiece.',
        'Because the viewfinder sits slightly up and to the right of the main lens, etched framing marks help you compensate for "parallax" on close-up portraits!',
        (g, m) => {
          rbox(g, 0.20, 0.18, 0.88, 0.025, m.darkSteel, [0.42, 0.38, -0.10]);
          sphere(g, 0.065, 16, 12, m.lensGlass, [0.42, 0.38, 0.34], [0, 0, 0], [1, 1, 0.3]);
          sphere(g, 0.055, 16, 12, m.lensGlass, [0.42, 0.38, -0.54], [0, 0, 0], [1, 1, 0.3]);
        },
      ],
      [
        'angled-45deg-reflex-mirror',
        'Internal 45° First-Surface Trapezoidal Folding Mirror',
        'Folded Light Cone',
        false,
        [0, 0.75, -1.15],
        'Front-silvered trapezoidal glass mirror mounted at 45° along the rear inner slope to bounce the lens image straight down onto the flat film cassette—and flip left-to-right correctly!',
        'Without this mirror, integral instant film exposed from the front would develop into a backward mirror-image of every sign and T-shirt!',
        (g, m) => {
          const mirPts = [
            [-0.42, -0.34],
            [0.42, -0.34],
            [0.32, 0.34],
            [-0.32, 0.34],
          ];
          const grp = new THREE.Group();
          grp.position.set(0, 0.14, -0.18);
          grp.rotation.x = Math.PI / 4;
          g.add(grp);
          extrudeProfile(grp, mirPts, 0.018, m.chrome, [0, 0, 0], [0, 0, 0], 0.004);
          rbox(grp, 0.88, 0.72, 0.016, 0.01, m.darkSteel, [0, 0, -0.016]);
        },
      ],
      [
        'integral-film-cassette-spring',
        '8-Shot Integral Film Pack Cassette & Flat Leaf-Spring Platen',
        'Film Cassette',
        false,
        [0, -1.25, -0.25],
        'Light-tight black plastic cartridge holding 8 stacked multi-layer chemical photo sheets pushed upward to the exact focal plane by a stamped steel W-spring.',
        'Every single sheet of integral instant film is a miniature 14-layer chemistry lab containing cyan, magenta, and yellow dye developers plus white titanium-dioxide pigment!',
        (g, m) => {
          rbox(g, 0.86, 0.16, 0.94, 0.02, m.matteBlack, [0, -0.32, -0.02]);
          box(g, 0.72, 0.02, 0.76, m.magentaCoat, [0, -0.235, -0.02]);
          // Stamped brass/steel W-leaf spring beneath the film stack
          tube(g, [[-0.32, -0.38, -0.25], [0, -0.28, 0], [0.32, -0.38, 0.25]], 0.010, m.brass, false, 16);
        },
      ],
      [
        'pick-arm-geartrain-motor',
        'DC Ejection Motor, Reduction Gear Train & Reciprocating Film Pick-Arm Claw',
        'Film Transport Drive',
        false,
        [1.15, -0.45, -0.15],
        'Side-mounted high-torque DC motor and Delrin spur-gear train driving a sliding metal claw at the back of the cartridge that hooks one exposed frame forward into the rollers.',
        'A tiny steel hook just half a millimeter thick grabs only the top photo sheet out of the stack and feeds its leading edge into the rollers!',
        (g, m) => {
          const gt = new THREE.Group();
          gt.position.set(0.52, -0.24, 0.04);
          g.add(gt);
          cyl(gt, 0.068, 0.068, 0.24, 18, m.alu, [0, 0.06, -0.16], [Math.PI / 2, 0, 0]);
          for (const [gz, gr, col] of [[0.04, 0.11, m.white], [0.20, 0.085, m.brass], [0.34, 0.095, m.white]]) {
            const gear = new THREE.Group();
            gear.position.set(0.02, -0.02, gz);
            gear.userData.driveAnim = 'fan';
            gear.userData.spinAxis = 'x';
            gt.add(gear);
            cyl(gear, gr, gr, 0.026, 22, col, [0, 0, 0], [0, 0, Math.PI / 2]);
          }
          // Sliding steel pick-arm bar along side
          box(gt, 0.018, 0.032, 0.68, m.chrome, [-0.04, -0.06, -0.04]);
        },
      ],
      [
        'stainless-developer-rollers',
        'Twin Spring-Loaded Precision Stainless-Steel Developer Spread Rollers',
        'Chemical Pod Rollers',
        false,
        [0, -0.55, 1.35],
        'Hinged front cassette door carrying two mirror-polished stainless-steel rollers clamped together by heavy torsion springs with a precision 0.2mm gap.',
        'As the photo squeezes out between these two steel rollers, a hidden reagent pod inside the wide white bottom border bursts and spreads a uniform 60-micron chemical layer between the sheets!',
        (g, m) => {
          const rlr = new THREE.Group();
          rlr.position.set(0, -0.28, 0.56);
          g.add(rlr);
          rbox(rlr, 0.96, 0.16, 0.12, 0.018, m.darkSteel, [0, 0, 0]);
          for (const ry of [-0.032, 0.032]) {
            const rSpin = new THREE.Group();
            rSpin.position.set(0, ry, 0.02);
            rSpin.userData.driveAnim = 'fan';
            rSpin.userData.spinAxis = 'x';
            rlr.add(rSpin);
            cyl(rSpin, 0.028, 0.028, 0.84, 22, m.chrome, [0, 0, 0], [0, 0, Math.PI / 2]);
          }
          for (const sx of [-0.44, 0.44]) {
            buildCoilSpring(rlr, [sx, 0, 0.02], 0.09, 0.018, 0.004, 5, m.brass);
          }
        },
      ],
      [
        'ejected-instant-print-frog-tongue',
        'Retractable Opacifier Film-Shield ("Frog Tongue") & Developing White-Border Print',
        'Daylight Development',
        true,
        [0, -0.85, 1.55],
        'Coiled black Mylar shade film ("frog tongue") that unrolls automatically over the emerging white-bordered square print for its critical first second in bright sunlight.',
        'Why is the bottom white border of a Polaroid thicker than the sides? That wide chin is actually the crushed foil pouch that held the wet developer paste before the rollers squeezed it!',
        (g, m) => {
          // Emerging iconic white-bordered instant print + curled black opacifier frog-tongue shield
          const prt = new THREE.Group();
          prt.position.set(0, -0.30, 0.92);
          prt.rotation.x = 0.08;
          prt.userData.isInstantPrint = true;
          g.add(prt);
          rbox(prt, 0.74, 0.012, 0.88, 0.004, m.white, [0, 0, 0]);
          box(prt, 0.64, 0.014, 0.64, screenMat('ios'), [0, 0.002, -0.06]);
          // Black spring-coiled frog tongue lip at slot exit
          cyl(g, 0.022, 0.022, 0.78, 16, m.matteBlack, [0, -0.24, 0.65], [0, 0, Math.PI / 2]);
        },
      ],
      [
        'usbc-battery-shot-counter-pcb',
        'USB-C Rechargeable Li-Ion Cell, Exposure Control PCB & 8-LED Shot Counter',
        'Electronics & Counter',
        false,
        [-1.05, -0.55, -0.65],
        'Modern USB-C lithium-ion power module replacing disposable pack batteries, paired with an 8-LED top shot-countdown bar and self-timer microcontroller.',
        'Classic 1970s Polaroid film packs threw away a flat chemical battery with every 8-shot cartridge—modern instant cameras use a rechargeable USB-C cell instead!',
        (g, m) => {
          rbox(g, 0.56, 0.022, 0.42, 0.008, pcbMat('#0b5d3b'), [-0.22, -0.44, -0.14]);
          rbox(g, 0.34, 0.075, 0.24, 0.015, carPaint(0x2563eb), [-0.26, -0.40, 0.20]);
          // 8 glowing amber shot-counter LEDs on top rear deck
          for (let i = 0; i < 8; i++) {
            sphere(g, 0.011, 10, 8, emissiveMat(0xfacc15, i < 6 ? 1.3 : 0.2), [-0.14 + i * 0.038, 0.53, -0.38]);
          }
        },
      ],
    ],
    quiz: [
      {
        q: 'Why does an instant film camera bounce light off a 45° internal mirror before hitting the film pack?',
        correctId: 'angled-45deg-reflex-mirror',
        distractors: ['optical-viewfinder-tunnel', 'xenon-flash-tube-capacitor', 'retro-rainbow-step-shell'],
      },
      {
        q: 'What actually creates the photo right after the print squeezes out between the two spring-loaded stainless rollers?',
        correctId: 'stainless-developer-rollers',
        distractors: ['triplet-taking-lens-shutter', 'optical-viewfinder-tunnel', 'usbc-battery-shot-counter-pcb'],
      },
      {
        q: 'Why is the white bottom border on an instant photo much wider than the top and side borders?',
        correctId: 'ejected-instant-print-frog-tongue',
        distractors: ['retro-rainbow-step-shell', 'pick-arm-geartrain-motor', 'triplet-taking-lens-shutter'],
      },
      {
        q: 'Which component produces the classic rising electronic whine while charging up to 330 volts for the flash?',
        correctId: 'xenon-flash-tube-capacitor',
        distractors: ['pick-arm-geartrain-motor', 'integral-film-cassette-spring', 'stainless-developer-rollers'],
      },
      {
        q: 'Which tiny motorized metal claw hooks just the top exposed photo sheet and feeds it into the rollers?',
        correctId: 'pick-arm-geartrain-motor',
        distractors: ['angled-45deg-reflex-mirror', 'optical-viewfinder-tunnel', 'xenon-flash-tube-capacitor'],
      },
    ],
  }),

  // ==========================================================================
  // 3. IMAX 70MM 15-PERF CINEMA CAMERA
  // ==========================================================================
  buildOpticsModel({
    id: 'imax-70mm-cinema-camera',
    name: 'IMAX 70mm 15-Perf Cinema Camera',
    brand: 'IMAX MSM 9802 / Panavision System 65 Class',
    badge: '65mm Horizontal 15-Perf • Rolling-Loop Vacuum Gate • 336 ft/min',
    desc: 'Hollywood blockbuster large-format film camera running 65mm Kodak motion-picture stock horizontally across 15 perforations per frame—featuring twin coaxial 1,000-foot magnesium film magazines, the patented Rolling-Loop vacuum registration movement, spinning mirror reflex shutter, and Panavision prime cinema optics.',
    primaryHex: 0x1e293b,
    accentHex: 0xd97706,
    cameraPos: [3.95, 2.25, 4.15],
    partsSpec: [
      [
        'cnc-milled-cinema-body-handles',
        'CNC-Milled Acoustic Magnesium Body, Top Carry Handle & 19mm Studio Bridgeplate',
        'Acoustic Camera Body',
        true,
        [-0.45, -0.85, -0.75],
        'ribbed acoustic-damped aerospace magnesium-aluminum body mounted on twin 19mm studio iris rods with an ergonomic top carry handle and Panavision/IMAX gold badges.',
        'At 24 frames per second, 15-perf IMAX film rips through the camera at nearly 6 feet EVERY SECOND—making the mechanical roar so loud that dialogue scenes often need acoustic blimps or ADR!',
        (g, m) => {
          rbox(g, 1.08, 0.88, 0.78, 0.045, m.magnesium, [-0.12, -0.06, 0]);
          // Top machined cheeseplate carry handle + twin 19mm stainless studio support rods below
          tube(g, [[-0.48, 0.38, 0], [-0.44, 0.58, 0], [0.16, 0.58, 0], [0.20, 0.38, 0]], 0.032, m.darkSteel, false, 20);
          rbox(g, 1.48, 0.08, 0.52, 0.015, m.darkSteel, [0.12, -0.56, 0]);
          for (const rz of [-0.18, 0.18]) {
            cyl(g, 0.022, 0.022, 1.88, 16, m.chrome, [0.24, -0.62, rz], [0, 0, Math.PI / 2]);
          }
          box(g, 0.28, 0.09, 0.80, m.brass, [-0.14, 0.18, 0]);
        },
      ],
      [
        'twin-1000ft-film-magazines',
        'Twin 1,000-Foot Coaxial 65mm Supply & Take-Up Film Magazines',
        '65mm Film Magazines',
        true,
        [-1.35, 1.05, 0],
        'Massive rear-mounted 1,000-foot light-tight magnesium film drum magazines holding unexposed 65mm Kodak Vision3 negative and driven take-up spools.',
        'Even a giant platter-sized 1,000-foot reel of 65mm film lasts less than THREE MINUTES at 24 frames per second because each 15-perf frame is nearly 3 inches wide!',
        (g, m) => {
          const mag = new THREE.Group();
          mag.position.set(-0.92, 0.38, 0);
          g.add(mag);
          // Twin side-by-side / coaxial circular magnesium magazine drums + gold latches + film footage dial
          for (const mz of [-0.19, 0.19]) {
            cyl(mag, 0.52, 0.52, 0.17, 36, m.magnesium, [0, 0, mz], [Math.PI / 2, 0, 0]);
            torus(mag, 0.52, 0.016, m.darkSteel, [0, 0, mz + (mz > 0 ? 0.08 : -0.08)]);
            // Internal amber/brown 65mm celluloid film roll visible on hub
            const spool = new THREE.Group();
            spool.position.set(0, 0, mz + (mz > 0 ? 0.09 : -0.09));
            spool.userData.driveAnim = 'fan';
            spool.userData.spinAxis = 'z';
            mag.add(spool);
            cyl(spool, 0.16, 0.16, 0.02, 20, m.alu, [0, 0, 0], [Math.PI / 2, 0, 0]);
            for (let s = 0; s < 3; s++) {
              const a = (s / 3) * Math.PI * 2;
              box(spool, 0.025, 0.28, 0.022, m.brass, [Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0], [0, 0, a]);
            }
          }
        },
      ],
      [
        'horizontal-65mm-15perf-film-strip',
        'Horizontal 65mm 15-Perforation Kodak Celluloid Film Loop (70mm × 48.5mm Frame)',
        '15-Perf Film Format',
        false,
        [-0.85, 0.25, 1.15],
        '65mm-wide motion picture negative threaded horizontally across sprockets so each single frame spans 15 perforations wide—nearly 10× the area of standard 35mm cinema film!',
        'Standard 70mm movies run vertically (5 perforations tall); IMAX turns the 65mm film sideways so each frame is 70mm wide—equivalent to ~18K digital resolution!',
        (g, m) => {
          const filmAmber = mat(0x92400e, { roughness: 0.22, metalness: 0.15, clearcoat: 0.9, doubleSide: true });
          // Continuous serpentine 65mm horizontal film ribbon path + brass sprocket guide rollers
          tube(
            g,
            [
              [-0.72, 0.26, -0.14],
              [-0.38, 0.16, -0.10],
              [0.18, 0.02, 0],
              [-0.38, -0.18, 0.10],
              [-0.72, 0.08, 0.14],
            ],
            0.032,
            filmAmber,
            false,
            32,
          );
          // Hero flat 15-perf exposed gate frame rectangle with top/bottom perforation ticks
          box(g, 0.012, 0.28, 0.42, filmAmber, [0.22, -0.02, 0]);
          for (let p = -7; p <= 7; p++) {
            box(g, 0.016, 0.018, 0.014, m.white, [0.222, 0.11, p * 0.026]);
            box(g, 0.016, 0.018, 0.014, m.white, [0.222, -0.15, p * 0.026]);
          }
        },
      ],
      [
        'rolling-loop-vacuum-gate',
        'Patented Rolling-Loop Cam Rotor, Registration Pins & Vacuum Aperture Gate',
        'Rolling-Loop Movement',
        false,
        [0, 0.95, 0.85],
        'Australian-invented Rolling-Loop rotor that ripples waves of 65mm film gently onto hardened registration pins while a vacuum pump sucks each frame rock-flat against the glass gate.',
        'Conventional claw pull-downs would shred heavy 65mm film moving at 336 feet per minute—the Rolling-Loop cam passes caterpillar-like waves of film with almost zero sprocket tear!',
        (g, m) => {
          const rl = new THREE.Group();
          rl.position.set(0.06, -0.02, 0);
          g.add(rl);
          // Slotted brass Rolling-Loop rotor drum + precision steel registration pins + vacuum manifold hose
          const rotor = new THREE.Group();
          rotor.userData.driveAnim = 'fan';
          rotor.userData.spinAxis = 'y';
          rl.add(rotor);
          cyl(rotor, 0.22, 0.22, 0.34, 28, m.brass, [0, 0, 0]);
          for (let gIdx = 0; gIdx < 4; gIdx++) {
            const a = (gIdx / 4) * Math.PI * 2;
            box(rotor, 0.045, 0.32, 0.055, m.chrome, [Math.cos(a) * 0.20, 0, Math.sin(a) * 0.20], [0, -a, 0]);
          }
          rbox(rl, 0.06, 0.34, 0.46, 0.01, m.alu, [0.18, 0, 0]);
          tube(rl, [[0.18, -0.18, 0.16], [0.02, -0.32, 0.24], [-0.24, -0.34, 0.24]], 0.014, carPaint(0x0284c7), false, 16);
        },
      ],
      [
        'spinning-mirror-reflex-shutter',
        '45° Spinning Butterfly Mirror Reflex Shutter (180° Exposure Blade)',
        'Rotary Mirror Shutter',
        false,
        [0.45, 0.85, -0.85],
        'Balanced semi-circular front-silvered mirror disc spinning at 1,440 RPM at 45° between the lens and film gate: open half exposes film; mirrored half bounces the image up into the operator’s optical viewfinder!',
        'Cinema operators literally watch real light bouncing off a spinning mirror 24 times a second—in the split-instant the film advances, the mirror hides the motion blur!',
        (g, m) => {
          const sh = new THREE.Group();
          sh.position.set(0.34, -0.02, 0);
          sh.rotation.z = Math.PI / 4;
          g.add(sh);
          const butterfly = new THREE.Group();
          butterfly.userData.driveAnim = 'fan';
          butterfly.userData.spinAxis = 'y';
          sh.add(butterfly);
          cyl(butterfly, 0.045, 0.045, 0.04, 18, m.brass, [0, 0, 0]);
          // Two counter-balanced bow-tie mirror blades
          box(butterfly, 0.38, 0.010, 0.14, m.chrome, [0, 0, 0]);
          torus(butterfly, 0.19, 0.008, m.darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
        },
      ],
      [
        'panavision-prime-cinema-lens',
        'Large-Format 50mm T2.0 Cinema Prime Lens & Geared 0.8-Mod Focus/Iris Rings',
        '65mm Cinema Optics',
        true,
        [1.45, 0.05, 0],
        'Oversized medium-format cinema prime lens projecting an 85mm image circle, machined with industry-standard 0.8-pitch brass/anodized follow-focus gear teeth and luminous T-stop markings.',
        'Cinema lenses are rated in "T-stops" (actual measured light Transmission) rather than f-stops so switching lenses mid-scene never changes actor skin brightness by even a tenth of a stop!',
        (g, m) => {
          const lns = new THREE.Group();
          lns.position.set(0.76, -0.02, 0);
          g.add(lns);
          cyl(lns, 0.34, 0.32, 0.68, 36, m.matteBlack, [0, 0, 0], [0, 0, Math.PI / 2]);
          // Machined 0.8-Mod geared focus & iris rings
          for (const [gx, col] of [[-0.12, m.brass], [0.14, m.alu]]) {
            cyl(lns, 0.362, 0.362, 0.075, 42, col, [gx, 0, 0], [0, 0, Math.PI / 2]);
          }
          sphere(lns, 0.29, 28, 18, m.lensGlass, [0.30, 0, 0], [0, 0, 0], [0.28, 1, 1]);
          sphere(lns, 0.25, 24, 16, m.magentaCoat, [-0.26, 0, 0], [0, 0, 0], [0.24, 1, 1]);
        },
      ],
      [
        'carbon-mattebox-french-flag',
        'Swing-Away Carbon-Fiber 6×6 Matte Box, ND Filter Trays & Top French Flag',
        'Flare Control & ND Filters',
        true,
        [1.95, 0.35, 0.45],
        'Carbon-fiber cinema lens hood holding two 6.6 × 6.6-inch glass Neutral Density (ND) filter stages and a hinged aluminum top eyebrow ("French flag") blocking stray studio lights.',
        'Because movie cameras stay locked near 1/48s shutter speed for natural motion blur, cinematographers slide dark glass "sunglasses" (ND filters) into the matte box in bright sun!',
        (g, m) => {
          const mb = new THREE.Group();
          mb.position.set(1.24, -0.02, 0);
          g.add(mb);
          // Flared carbon-fiber rectangular shade + 2 vertical glass filter trays + hinged top French flag visor
          rbox(mb, 0.28, 0.78, 0.96, 0.025, m.carbon, [0.06, 0, 0]);
          rbox(mb, 0.24, 0.68, 0.86, 0.015, m.matteBlack, [0.08, 0, 0]);
          box(mb, 0.018, 0.76, 0.72, m.magentaCoat, [-0.08, 0.04, 0]);
          rbox(mb, 0.42, 0.018, 0.98, 0.008, m.matteBlack, [0.28, 0.44, 0], [0, 0, -0.35]);
        },
      ],
      [
        'wireless-fiz-follow-focus-motors',
        'Dual Wireless Follow-Focus (FIZ) Torque Motors & Handwheel Gear Box',
        'Precision Focus Pulling',
        false,
        [0.95, -0.65, 1.05],
        '1st Assistant Camera (1st AC) mechanical handwheel and dual rod-mounted brushless wireless motors meshed with the lens’s 0.8-mod focus and iris gears.',
        'On 70mm IMAX close-ups, depth of field can be thinner than an eyelash—a dedicated Focus Puller tracks the actor’s eyes remotely to the millimeter!',
        (g, m) => {
          // Rod-clamped FIZ brushless servo motors engaging lens gear rings + classic white marking-disc handwheel
          for (const [mx, mz] of [[0.64, 0.36], [0.90, -0.36]]) {
            cyl(g, 0.055, 0.055, 0.22, 18, m.darkSteel, [mx, -0.22, mz]);
            cyl(g, 0.065, 0.065, 0.04, 24, m.brass, [mx, -0.06, mz * 0.88], [0, 0, Math.PI / 2]);
          }
          cyl(g, 0.14, 0.14, 0.04, 24, m.white, [0.58, -0.28, 0.48], [Math.PI / 2, 0, 0]);
          cyl(g, 0.065, 0.085, 0.08, 20, m.matteBlack, [0.58, -0.28, 0.53], [Math.PI / 2, 0, 0]);
        },
      ],
      [
        'orientable-optical-viewfinder-tap',
        'Orientable Optical Periscope Viewfinder & HD-SDI Video Assist Tap',
        'Operator Monitoring',
        true,
        [-0.25, 0.95, 1.15],
        'Swiveling optical periscope tube with heated anti-fog eyepiece for the camera operator plus a beamsplitter HD-SDI digital video-assist tap streaming live framing to the director’s monitor.',
        'A 20/80 optical beamsplitter sends 80% of viewfinder light to the operator’s eye and 20% to a tiny digital sensor so Christopher Nolan can check framing on a handheld monitor!',
        (g, m) => {
          tube(g, [[0.28, 0.22, 0.28], [0.08, 0.36, 0.48], [-0.32, 0.36, 0.52]], 0.052, m.darkSteel, false, 18);
          cyl(g, 0.078, 0.065, 0.09, 20, m.matteBlack, [-0.38, 0.36, 0.52], [0, 0, Math.PI / 2]);
          // Top HD-SDI video tap box + BNC coax connector + OLED timecode/FPS side readout
          rbox(g, 0.28, 0.18, 0.18, 0.018, m.alu, [0.22, 0.44, 0.18]);
          box(g, 0.32, 0.16, 0.016, screenMat('ios'), [-0.14, -0.08, 0.40]);
        },
      ],
      [
        'crystal-sync-motor-24v-block',
        'Quartz Crystal-Sync Brushless Drive Motor, Vacuum Pump & 24V Cine Power Block',
        'Crystal-Sync Powertrain',
        false,
        [-0.95, -0.95, 0.65],
        'Quartz-locked 24.000-fps brushless servo drive motor, miniature gate vacuum pump, and high-current 24-volt cinema battery/XLR power distribution block.',
        'Before quartz "crystal-sync" motors, a physical cable had to tether the camera to the sound tape recorder—crystal oscillators keep film and digital audio locked within 1 frame over an entire reel!',
        (g, m) => {
          cyl(g, 0.14, 0.14, 0.36, 24, m.darkSteel, [-0.18, -0.24, -0.22], [0, 0, Math.PI / 2]);
          torus(g, 0.11, 0.018, m.copper, [-0.18, -0.24, -0.22], [0, Math.PI / 2, 0]);
          // Rear-bottom 24V V-Mount/Gold-Mount cinema battery pack + red braided 24V XLR power cable
          rbox(g, 0.24, 0.38, 0.28, 0.025, m.matteBlack, [-0.74, -0.26, 0]);
          tube(g, [[-0.62, -0.34, 0.12], [-0.46, -0.40, 0.22], [-0.28, -0.32, 0.22]], 0.014, carPaint(0xdc2626), false, 16);
        },
      ],
    ],
    quiz: [
      {
        q: 'How does 15-perf IMAX achieve nearly 10 times the frame area of standard 35mm film using 65mm stock?',
        correctId: 'horizontal-65mm-15perf-film-strip',
        distractors: ['carbon-mattebox-french-flag', 'orientable-optical-viewfinder-tap', 'cnc-milled-cinema-body-handles'],
      },
      {
        q: 'Which mechanism advances 65mm film at 336 feet per minute without tearing perforations and sucks each frame flat?',
        correctId: 'rolling-loop-vacuum-gate',
        distractors: ['panavision-prime-cinema-lens', 'twin-1000ft-film-magazines', 'wireless-fiz-follow-focus-motors'],
      },
      {
        q: 'How long does an entire giant 1,000-foot magazine of 65mm IMAX film last at 24 frames per second?',
        correctId: 'twin-1000ft-film-magazines',
        distractors: ['crystal-sync-motor-24v-block', 'carbon-mattebox-french-flag', 'spinning-mirror-reflex-shutter'],
      },
      {
        q: 'How does the camera operator look straight through the actual cinema lens between film exposures?',
        correctId: 'spinning-mirror-reflex-shutter',
        distractors: ['wireless-fiz-follow-focus-motors', 'crystal-sync-motor-24v-block', 'twin-1000ft-film-magazines'],
      },
      {
        q: 'Why are Hollywood cinema lenses marked in T-stops (Transmission) rather than photographic f-stops?',
        correctId: 'panavision-prime-cinema-lens',
        distractors: ['cnc-milled-cinema-body-handles', 'rolling-loop-vacuum-gate', 'orientable-optical-viewfinder-tap'],
      },
    ],
  }),
];

export const CAMERAS_CATEGORY = {
  id: 'cameras',
  name: 'Cameras & Optics',
  fullName: 'Full-Frame Mirrorless, Instant Film & IMAX 70mm Cameras',
  emoji: '📷',
  icon: '📷',
  tagline: 'Full-Frame Mirrorless Camera & f/2.8 Zoom • Retro Instant Film Camera • IMAX 70mm 15-Perf Cinema Camera',
  models: CAMERAS_MODELS,
};
