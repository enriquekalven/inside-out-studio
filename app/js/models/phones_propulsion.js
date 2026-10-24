// Hyper-Detailed 3D Smartphone & Propulsion Models for Inside Out Studio:
// Smartphones: 1. iPhone 16 Pro Max  2. iPhone 16 Ultramarine  3. Google Pixel 9 Pro XL  4. Samsung Galaxy S24 Ultra  5. Samsung Galaxy Z Fold 6
// Propulsion: 1. GE9X High-Bypass Turbofan  2. Pratt & Whitney F135 Afterburning Fighter Jet  3. SpaceX Raptor Vacuum Rocket Engine
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
  buildWiringHarness,
} from '../materials.js';
import { addGearboxCadSubassembly, addRocketEngineCad } from '../cad_loader.js';

function addPhoneMicroFastenersAndRibbons(g, x, y, z) {
  const screwPositions = [
    [x - 0.18, y + 0.62, z + 0.04],
    [x + 0.18, y + 0.62, z + 0.04],
    [x - 0.18, y - 0.05, z + 0.04],
    [x + 0.18, y - 0.05, z + 0.04],
    [x - 0.18, y - 0.62, z + 0.04],
    [x + 0.18, y - 0.62, z + 0.04],
  ];
  buildHexBoltArray(g, screwPositions, {
    radius: 0.016,
    height: 0.015,
    finish: 'chrome',
    rot: [Math.PI / 2, 0, 0],
  });
  buildWiringHarness(g, [
    {
      points: [
        [x - 0.12, y + 0.42, z + 0.04],
        [x - 0.36, y + 0.65, z + 0.04],
        [x - 0.48, y + 0.92, z - 0.04],
      ],
      radius: 0.012,
      color: 0xd97706,
    },
    {
      points: [
        [x - 0.12, y - 0.18, z + 0.04],
        [x - 0.34, y - 0.25, z + 0.03],
      ],
      radius: 0.012,
      color: 0x1e293b,
      braided: true,
    },
    {
      points: [
        [x, y - 0.58, z + 0.04],
        [x - 0.12, y - 1.05, z + 0.02],
        [x, y - 1.45, z + 0.01],
      ],
      radius: 0.012,
      color: 0xf59e0b,
    },
  ]);
}

function makePhoneQuiz(parts, q1, q2) {
  const ids = parts.map((p) => p.id);
  return [
    q1,
    q2,
    {
      q: 'Which flat spiral coil on the back lets the phone charge wirelessly on a magnetic pad without plugging in a cord?',
      correctId: ids[4],
      distractors: [ids[0], ids[2], ids[7]],
    },
    {
      q: 'Which part stores lithium-ion electrical energy so the smartphone can run all day long?',
      correctId: ids[3],
      distractors: [ids[1], ids[5], ids[8]],
    },
    {
      q: 'Which tiny motorized weight creates crisp clicks and buzzes that you feel in your hand?',
      correctId: ids[7],
      distractors: [ids[0], ids[3], ids[9]],
    },
  ];
}

// ============================================================================
// SMARTPHONES (5 Flagship Phones: iPhone, Pixel & Samsung)
// ============================================================================
function buildIPhone16ProMax() {
  const desertTitanium = brushedMetal(0xc4b49e, { metalness: 0.88, roughness: 0.22 });
  const darkMetal = brushedMetal(0x1f242d);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });
  const pcb = pcbMat('#111827');

  const parts = [
    {
      id: 'oled-dynamic-island',
      name: '6.9" Super Retina XDR OLED & Ceramic Shield',
      category: 'Display',
      isOuter: true,
      explodeOffset: [0, 0, 1.85],
      desc: 'Ultra-thin-bezel 120Hz ProMotion OLED display infused with microscopic ceramic nanocrystals for drop protection.',
      funFact: 'Unlike older LCD screens, each of the 3.8 million OLED pixels makes its own light and turns 100% off for true black!',
      build(g) {
        rbox(g, 1.62, 3.28, 0.055, 0.16, darkMetal, [0, 0, 0.15]);
        rbox(g, 1.52, 3.16, 0.02, 0.12, screenMat('ios'), [0, 0, 0.175]);
        // Dynamic Island pill cutout
        rbox(g, 0.42, 0.11, 0.025, 0.05, mat(0x050505), [0, 1.38, 0.185]);
      },
    },
    {
      id: 'titanium-chassis-buttons',
      name: 'Grade 5 Titanium Band, Action Button & Camera Control',
      category: 'Enclosure',
      isOuter: true,
      explodeOffset: [0, 0, -1.85],
      desc: 'Aerospace Grade 5 titanium outer band bonded to an internal recycled aluminum frame, with a sapphire-covered Camera Control button.',
      funFact: 'Grade 5 titanium is the exact same super-strong, lightweight metal alloy used on Mars rovers!',
      build(g) {
        rbox(g, 1.68, 3.34, 0.24, 0.18, desertTitanium, [0, 0, -0.02]);
        rbox(g, 1.54, 3.2, 0.18, 0.14, mat(0x2a2f37), [0, 0, 0.02]);
        // Action button + Volume + Sapphire Camera Control capacitive button
        rbox(g, 0.04, 0.16, 0.06, 0.015, desertTitanium, [-0.85, 0.92, 0]);
        rbox(g, 0.04, 0.26, 0.06, 0.015, desertTitanium, [-0.85, 0.56, 0]);
        rbox(g, 0.04, 0.34, 0.07, 0.015, chromeMat(), [0.85, -0.58, 0]);
      },
    },
    {
      id: 'a18-pro-logic-board',
      name: 'Stacked Logic Board & A18 Pro 3nm Chip',
      category: 'Processor & Brain',
      isOuter: false,
      explodeOffset: [1.55, 0.25, 0.45],
      desc: 'Double-decker circuit board holding the A18 Pro chip with 19 billion microscopic transistors and a 16-core Neural Engine.',
      funFact: 'Each transistor inside the 3-nanometer A18 Pro chip is 20,000 times thinner than a single strand of human hair!',
      build(g) {
        rbox(g, 0.52, 1.58, 0.07, 0.03, pcb, [0.36, 0.12, 0.02]);
        rbox(g, 0.36, 0.36, 0.03, 0.02, mat(0x0f172a, { roughness: 0.2 }), [0.36, 0.22, 0.065]);
        rbox(g, 0.32, 0.42, 0.025, 0.01, chromeMat(), [0.36, -0.28, 0.065]);
        addPhoneMicroFastenersAndRibbons(g, 0.36, 0.12, 0.02);
      },
    },
    {
      id: 'l-shaped-steel-battery',
      name: 'L-Shaped Steel-Cased Lithium-Ion Battery',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-1.45, -0.15, 0.35],
      desc: 'Wrapped in a laser-welded stainless-steel shell to pack more battery cells and transfer heat away faster.',
      funFact: 'The battery is shaped like the letter "L" so it wraps right around the logic board without wasting a single millimeter of space!',
      build(g) {
        rbox(g, 0.82, 1.65, 0.11, 0.04, brushedMetal(0xd8dee9), [-0.24, -0.35, 0.01]);
        rbox(g, 0.56, 0.68, 0.11, 0.04, brushedMetal(0xd8dee9), [-0.36, 0.68, 0.01]);
      },
    },
    {
      id: 'magsafe-wireless-coil',
      name: 'MagSafe Qi2 Copper Induction Coil & Magnet Ring',
      category: 'Wireless Charging',
      isOuter: false,
      explodeOffset: [0, -0.1, -1.15],
      desc: 'Flat spiral of copper wire surrounded by 18 rare-earth magnets that snap chargers and wallets into exact alignment.',
      funFact: 'Alternating magnetic fields from a charging pad wiggle electrons inside this copper spiral to create 25 watts of electricity through glass!',
      build(g) {
        torus(g, 0.48, 0.045, copper, [0, -0.12, -0.06]);
        torus(g, 0.34, 0.035, copper, [0, -0.12, -0.06]);
        rbox(g, 0.08, 0.26, 0.03, 0.01, copper, [0, -0.78, -0.06]);
      },
    },
    {
      id: 'tetraprism-pro-cameras',
      name: '48MP Fusion + 5x Tetraprism Telephoto Camera Array',
      category: 'Optics & Imaging',
      isOuter: false,
      explodeOffset: [-1.35, 1.35, -0.85],
      desc: 'Three sapphire-covered lenses plus a folded-glass "Tetraprism" that bounces light 4 times like a submarine periscope for 5x optical zoom!',
      funFact: 'Sensor-shift optical image stabilization moves the camera sensor 5,000 times a second to cancel out shaky hands!',
      build(g) {
        rbox(g, 0.78, 0.82, 0.14, 0.12, desertTitanium, [-0.34, 1.08, -0.12]);
        const lensPositions = [
          [-0.52, 1.26],
          [-0.52, 0.9],
          [-0.16, 1.08],
        ];
        for (const [lx, ly] of lensPositions) {
          cyl(g, 0.15, 0.15, 0.1, 24, desertTitanium, [lx, ly, -0.18], [Math.PI / 2, 0, 0]);
          cyl(g, 0.12, 0.12, 0.11, 24, glassMat(0x1e3a8a, 0.85), [lx, ly, -0.19], [Math.PI / 2, 0, 0]);
        }
        // LiDAR ToF scanner + True Tone flash
        cyl(g, 0.065, 0.065, 0.08, 16, mat(0x1e293b), [-0.16, 0.86, -0.18], [Math.PI / 2, 0, 0]);
        cyl(g, 0.065, 0.065, 0.08, 16, emissiveMat(0xfef08a, 0.9), [-0.16, 1.3, -0.18], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'truedepth-faceid',
      name: 'TrueDepth Face ID Infrared Projector & Selfie Camera',
      category: 'Biometrics & Security',
      isOuter: false,
      explodeOffset: [0, 1.85, 0.65],
      desc: 'Projects 30,000 invisible infrared dots onto your face to map your 3D features even in pitch darkness.',
      funFact: 'Because Face ID reads 3D depth with infrared light, it cannot be fooled by a flat photo!',
      build(g) {
        rbox(g, 0.62, 0.16, 0.09, 0.03, darkMetal, [0, 1.38, 0.05]);
        cyl(g, 0.05, 0.05, 0.06, 16, glassMat(0x38bdf8, 0.8), [-0.15, 1.38, 0.09], [Math.PI / 2, 0, 0]);
        cyl(g, 0.045, 0.045, 0.06, 16, emissiveMat(0xf43f5e, 0.8), [0.15, 1.38, 0.09], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'taptic-engine',
      name: 'Linear Haptic "Taptic Engine" Actuator',
      category: 'Haptics',
      isOuter: false,
      explodeOffset: [-0.85, -1.65, 0.55],
      desc: 'Slides a tungsten metal weight back and forth on springs between electromagnets in 1 millisecond to create crisp clicks.',
      funFact: 'Tungsten is used inside the Taptic Engine because it is nearly twice as dense as lead—packing a heavy punch in a tiny block!',
      build(g) {
        rbox(g, 0.58, 0.22, 0.09, 0.03, darkMetal, [-0.28, -1.32, 0.03]);
        rbox(g, 0.22, 0.16, 0.1, 0.02, copper, [-0.28, -1.32, 0.03]);
      },
    },
    {
      id: 'usbc-stereo-speakers',
      name: '10Gbps USB-C Port & Spatial Audio Stereo Speakers',
      category: 'Audio & I/O',
      isOuter: false,
      explodeOffset: [0.65, -1.85, 0],
      desc: 'Reversible 24-pin USB-C connector for charging and external SSD recording plus waterproof bottom woofer speaker box.',
      funFact: 'Fine acoustic mesh over the speaker holes lets sound waves out while blocking water molecules down to 6 meters deep!',
      build(g) {
        rbox(g, 0.28, 0.18, 0.08, 0.03, chromeMat(), [0, -1.56, 0.01]);
        rbox(g, 0.44, 0.24, 0.09, 0.03, darkMetal, [0.42, -1.36, 0.02]);
      },
    },
    {
      id: 'mmwave-5g-antennas',
      name: '5G mmWave Phased-Array Antenna & Emergency SOS Satellite',
      category: 'Wireless Connectivity',
      isOuter: false,
      explodeOffset: [1.75, -0.45, -0.45],
      desc: 'Beamforming antennas along the frame edges that talk to 5G towers, Wi-Fi 7 routers, and even satellites 800 miles up in space!',
      funFact: 'If you are hiking in the mountains with zero cell bars, the phone shows you where to point it at the sky to text a passing satellite!',
      build(g) {
        rbox(g, 0.08, 0.72, 0.08, 0.02, copper, [0.74, -0.45, 0.02]);
        rbox(g, 0.08, 0.56, 0.08, 0.02, brushedMetal(0x38bdf8), [-0.74, 0.25, 0.02]);
      },
    },
  ];

  return {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    badge: 'A18 Pro 3nm • Grade 5 Titanium',
    desc: 'Apple’s flagship titanium smartphone featuring a 6.9" Super Retina XDR display, 5x Tetraprism zoom camera, A18 Pro chip, and MagSafe.',
    cameraPos: [3.2, 1.8, 3.8],
    parts,
    quiz: makePhoneQuiz(
      parts,
      {
        q: 'Which part uses a folded-glass "Tetraprism" like a submarine periscope to zoom in 5x optically?',
        correctId: 'tetraprism-pro-cameras',
        distractors: ['oled-dynamic-island', 'l-shaped-steel-battery', 'usbc-stereo-speakers'],
      },
      {
        q: 'Which part projects 30,000 invisible infrared dots to recognize your 3D face even in the dark?',
        correctId: 'truedepth-faceid',
        distractors: ['magsafe-wireless-coil', 'taptic-engine', 'mmwave-5g-antennas'],
      },
    ),
  };
}

function buildIPhone16Ultramarine() {
  const ultramarine = carPaint(0x3b5bdb, { roughness: 0.22, metalness: 0.45 });
  const aluBand = brushedMetal(0x4c6ef5);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });

  const parts = [
    {
      id: 'super-retina-oled',
      name: '6.1" Super Retina XDR Display & Dynamic Island',
      category: 'Display',
      isOuter: true,
      explodeOffset: [0, 0, 1.8],
      desc: '2,000-nit outdoor brightness OLED display with Dynamic Island live activity pill.',
      funFact: 'It can dim all the way down to 1 single nit of brightness in a dark bedroom so it doesn’t hurt your eyes!',
      build(g) {
        rbox(g, 1.54, 3.12, 0.055, 0.16, mat(0x111827), [0, 0, 0.15]);
        rbox(g, 1.44, 3.0, 0.02, 0.12, screenMat('ios'), [0, 0, 0.175]);
        rbox(g, 0.4, 0.1, 0.025, 0.05, mat(0x050505), [0, 1.3, 0.185]);
      },
    },
    {
      id: 'ultramarine-aluminum-chassis',
      name: 'Aerospace Aluminum Frame & Color-Infused Glass Back',
      category: 'Enclosure',
      isOuter: true,
      explodeOffset: [0, 0, -1.8],
      desc: '75% recycled aerospace aluminum enclosure with Ultramarine blue metallic ions baked right into the matte back glass.',
      funFact: 'The back glass is polished with nanocrystalline particles to give it a soft frosted texture that resists fingerprints!',
      build(g) {
        rbox(g, 1.6, 3.18, 0.23, 0.18, aluBand, [0, 0, -0.02]);
        rbox(g, 1.52, 3.1, 0.04, 0.15, ultramarine, [0, 0, -0.13]);
      },
    },
    {
      id: 'a18-bionic-board',
      name: 'A18 3nm Logic Board & Thermal Substructure',
      category: 'Processor & Brain',
      isOuter: false,
      explodeOffset: [1.5, 0.25, 0.4],
      desc: 'Compact logic board redesigned to sit centrally next to a graphite-clad aluminum heat shield for 30% higher sustained gaming performance.',
      funFact: 'The A18 chip runs hardware-accelerated ray tracing—calculating how light bounces off water and glass in 3D games!',
      build(g) {
        rbox(g, 0.5, 1.48, 0.07, 0.03, pcbMat('#0b5d3b'), [0.34, 0.1, 0.02]);
        rbox(g, 0.34, 0.34, 0.03, 0.02, mat(0x0f172a), [0.34, 0.18, 0.065]);
        addPhoneMicroFastenersAndRibbons(g, 0.34, 0.1, 0.02);
      },
    },
    {
      id: 'ionic-release-battery',
      name: 'Electrically Released Lithium-Ion Battery Cell',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-1.4, -0.15, 0.35],
      desc: 'High-density battery bonded with special ionic adhesive that lets go cleanly when a Repair Technician applies a harmless 9-volt current!',
      funFact: 'Instead of pulling sticky glue strips, a tiny zap from a 9V battery unglues the battery in 60 seconds for easy recycling!',
      build(g) {
        rbox(g, 0.78, 1.82, 0.11, 0.04, brushedMetal(0x334155), [-0.22, -0.2, 0.01]);
      },
    },
    {
      id: 'magsafe-array',
      name: 'MagSafe Wireless Charging Coil & Alignment Magnet',
      category: 'Wireless Charging',
      isOuter: false,
      explodeOffset: [0, -0.1, -1.1],
      desc: '25W Qi2 wireless power receiver coil and NFC tap-to-pay antenna.',
      funFact: 'The NFC ring at the top of the phone powers itself from the checkout terminal’s radio waves so transit cards work even when the battery is low!',
      build(g) {
        torus(g, 0.46, 0.04, copper, [0, -0.12, -0.05]);
        torus(g, 0.32, 0.03, copper, [0, -0.12, -0.05]);
      },
    },
    {
      id: 'vertical-dual-camera-pill',
      name: 'Vertical 48MP Fusion + 12MP Ultra-Wide Spatial Camera Pill',
      category: 'Optics & Spatial Video',
      isOuter: false,
      explodeOffset: [-1.3, 1.3, -0.8],
      desc: 'Aligned vertically in a slim pill bump so when you hold the phone sideways, the two lenses sit side-by-side like human eyes to record 3D Spatial Video!',
      funFact: 'Apple switched back from diagonal lenses to vertical lenses specifically so the two cameras can record stereoscopic 3D videos!',
      build(g) {
        rbox(g, 0.44, 0.78, 0.14, 0.18, ultramarine, [-0.46, 1.05, -0.12]);
        for (const ly of [1.22, 0.88]) {
          cyl(g, 0.15, 0.15, 0.1, 24, aluBand, [-0.46, ly, -0.18], [Math.PI / 2, 0, 0]);
          cyl(g, 0.12, 0.12, 0.11, 24, glassMat(0x1e3a8a, 0.85), [-0.46, ly, -0.19], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'truedepth-module',
      name: 'TrueDepth Face ID & Autofocus Front Camera',
      category: 'Biometrics',
      isOuter: false,
      explodeOffset: [0, 1.8, 0.6],
      desc: 'Flood illuminator, dot projector, and infrared camera tucked inside the top of the chassis.',
      funFact: 'Face ID learns how your face changes over time—even if you put on glasses, a hat, or grow a beard!',
      build(g) {
        rbox(g, 0.58, 0.15, 0.08, 0.03, mat(0x1f2937), [0, 1.3, 0.05]);
      },
    },
    {
      id: 'taptic-haptic-engine',
      name: 'Taptic Engine Linear Vibrator',
      category: 'Haptics',
      isOuter: false,
      explodeOffset: [-0.8, -1.6, 0.5],
      desc: 'Recycled tungsten linear actuator using 100% recycled rare-earth magnets.',
      funFact: 'When you scroll a picker wheel on screen, the Taptic Engine taps once for every tick so it feels like a mechanical safe dial!',
      build(g) {
        rbox(g, 0.54, 0.2, 0.09, 0.03, copper, [-0.26, -1.26, 0.03]);
      },
    },
    {
      id: 'usbc-acoustic-chamber',
      name: 'USB-C Port & Bottom Stereo Acoustic Module',
      category: 'Audio & I/O',
      isOuter: false,
      explodeOffset: [0.6, -1.8, 0],
      desc: 'Water-sealed USB-C charging port and acoustic foam-filled speaker chamber.',
      funFact: 'Tiny balls of acoustic zeolite inside the speaker box make the air act like the speaker enclosure is twice as big, boosting bass!',
      build(g) {
        rbox(g, 0.26, 0.16, 0.08, 0.03, chromeMat(), [0, -1.48, 0.01]);
        rbox(g, 0.42, 0.22, 0.09, 0.03, mat(0x1f2937), [0.38, -1.3, 0.02]);
      },
    },
    {
      id: 'camera-control-sensor',
      name: 'Capacitive Force-Sensor Camera Control Module',
      category: 'Controls',
      isOuter: false,
      explodeOffset: [1.65, -0.5, -0.4],
      desc: 'Combines a mechanical click switch, a high-precision force sensor for half-press focus, and a capacitive touch slider for zooming!',
      funFact: 'Sliding your finger across the sapphire button zooms the camera lens smoothly without touching the screen!',
      build(g) {
        rbox(g, 0.09, 0.42, 0.08, 0.02, copper, [0.74, -0.5, 0.02]);
      },
    },
  ];

  return {
    id: 'iphone-16-ultramarine',
    name: 'iPhone 16 (Ultramarine)',
    brand: 'Apple',
    badge: 'A18 Chip • Vertical Spatial Cameras',
    desc: 'Color-infused Ultramarine iPhone 16 with a vertical spatial-video dual camera pill, electrically-released battery, and Camera Control.',
    cameraPos: [3.2, 1.8, 3.8],
    parts,
    quiz: makePhoneQuiz(
      parts,
      {
        q: 'Why are the two rear cameras on the iPhone 16 stacked vertically one above the other?',
        correctId: 'vertical-dual-camera-pill',
        distractors: ['super-retina-oled', 'magsafe-array', 'usbc-acoustic-chamber'],
      },
      {
        q: 'How can a repair technician unglue the iPhone 16 battery in 60 seconds without pulling sticky tape?',
        correctId: 'ionic-release-battery',
        distractors: ['ultramarine-aluminum-chassis', 'truedepth-module', 'camera-control-sensor'],
      },
    ),
  };
}

function buildGooglePixel9ProXL() {
  const porcelain = carPaint(0xf1f5f9, { roughness: 0.18, metalness: 0.2 });
  const polishedAlu = chromeMat(0xe2e8f0);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });

  const parts = [
    {
      id: 'super-actua-oled',
      name: '6.8" Super Actua LTPO OLED & Ultrasonic Fingerprint',
      category: 'Display',
      isOuter: true,
      explodeOffset: [0, 0, 1.85],
      desc: '3,000-nit ultra-bright OLED screen with an ultrasonic fingerprint sensor underneath that uses sound waves to read your thumbprint!',
      funFact: 'Because the ultrasonic sensor uses high-frequency sound waves instead of light, it works even when your fingers are wet!',
      build(g) {
        rbox(g, 1.62, 3.28, 0.055, 0.18, mat(0x111827), [0, 0, 0.15]);
        rbox(g, 1.52, 3.16, 0.02, 0.14, screenMat('pixel'), [0, 0, 0.175]);
        cyl(g, 0.055, 0.055, 0.025, 20, mat(0x050505), [0, 1.42, 0.185], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'sculpted-chassis-rails',
      name: '100% Recycled Aluminum Frame & Matte Gorilla Glass Victus 2',
      category: 'Enclosure',
      isOuter: true,
      explodeOffset: [0, 0, -1.85],
      desc: 'Polished flat-edge recycled aluminum rails and silky matte Porcelain back glass.',
      funFact: 'All the aluminum in the Pixel 9 Pro enclosure is 100% recycled!',
      build(g) {
        rbox(g, 1.68, 3.34, 0.23, 0.2, polishedAlu, [0, 0, -0.02]);
        rbox(g, 1.58, 3.24, 0.04, 0.16, porcelain, [0, 0, -0.13]);
      },
    },
    {
      id: 'tensor-g4-titan-m2',
      name: 'Google Tensor G4 AI SoC & Titan M2 Security Chip',
      category: 'AI Processor & Security',
      isOuter: false,
      explodeOffset: [1.55, 0.25, 0.45],
      desc: 'Custom Google Tensor G4 processor built with a dedicated TPU (Tensor Processing Unit) to run Gemini Nano AI right on the phone!',
      funFact: 'The separate Titan M2 security chip guards your PIN and encryption keys against physical laboratory laser attacks!',
      build(g) {
        rbox(g, 0.56, 1.52, 0.07, 0.03, pcbMat('#064e3b'), [0.34, 0.1, 0.02]);
        rbox(g, 0.36, 0.36, 0.03, 0.02, brushedMetal(0xd4af37), [0.34, 0.2, 0.065]);
        addPhoneMicroFastenersAndRibbons(g, 0.34, 0.1, 0.02);
      },
    },
    {
      id: 'high-capacity-5060-battery',
      name: '5,060 mAh Extreme-Saver Lithium Battery',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-1.45, -0.25, 0.35],
      desc: 'Large-capacity battery cell that powers the phone for over 24 hours—or up to 100 hours in Extreme Battery Saver mode!',
      funFact: 'With Battery Share turned on, you can lay wireless earbuds on the back of the Pixel to charge them from the phone’s battery!',
      build(g) {
        rbox(g, 0.84, 1.78, 0.11, 0.04, mat(0x1e293b), [-0.22, -0.32, 0.01]);
      },
    },
    {
      id: 'qi-battery-share-coil',
      name: 'Two-Way Qi Wireless Charging & Reverse Share Coil',
      category: 'Wireless Charging',
      isOuter: false,
      explodeOffset: [0, -0.15, -1.15],
      desc: 'Bidirectional copper induction coil that both receives wireless power and transmits power outward to accessories.',
      funFact: 'A thin black sheet of nanocrystalline ferrite behind the coil shields the battery from magnetic eddy currents!',
      build(g) {
        torus(g, 0.46, 0.042, copper, [0, -0.22, -0.05]);
        torus(g, 0.3, 0.032, copper, [0, -0.22, -0.05]);
      },
    },
    {
      id: 'camera-visor-bar',
      name: 'Iconic Horizontal "Camera Visor" Pill Bar & Thermometer',
      category: 'Optics & IR Sensor',
      isOuter: false,
      explodeOffset: [0, 1.35, -1.05],
      desc: 'Stadium-oval horizontal metal Camera Bar holding a 50MP main lens, 48MP ultra-wide, 48MP 5x periscope, AND an infrared temperature sensor!',
      funFact: 'Because the Camera Bar spans horizontally across the back, a Pixel never wobbles when you type on it flat on a table!',
      build(g) {
        // Horizontal Stadium-Oval Visor Bar
        rbox(g, 1.38, 0.46, 0.16, 0.2, polishedAlu, [0, 1.05, -0.14]);
        rbox(g, 1.12, 0.34, 0.04, 0.15, mat(0x0f172a), [-0.1, 1.05, -0.21]);
        for (const lx of [-0.46, -0.14, 0.18]) {
          cyl(g, 0.12, 0.12, 0.06, 20, glassMat(0x1e3a8a, 0.85), [lx, 1.05, -0.22], [Math.PI / 2, 0, 0]);
        }
        // Flash + Infrared Thermometer sensor on right side of bar
        cyl(g, 0.055, 0.055, 0.05, 16, emissiveMat(0xfef08a, 0.9), [0.52, 1.13, -0.22], [Math.PI / 2, 0, 0]);
        cyl(g, 0.055, 0.055, 0.05, 16, brushedMetal(0x94a3b8), [0.52, 0.96, -0.22], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'copper-vapor-chamber',
      name: 'Ultra-Thin Copper Vapor Chamber Cooler',
      category: 'Thermal Cooling',
      isOuter: false,
      explodeOffset: [1.35, -0.35, -0.55],
      desc: 'Sealed flat copper pouch containing a drop of purified water that boils into vapor over the hot Tensor chip and condenses at the cool bottom!',
      funFact: 'Because water boils at a much lower temperature inside a vacuum, this tiny steam engine inside your phone cools the chip silently!',
      build(g) {
        rbox(g, 0.68, 1.62, 0.03, 0.02, copper, [0.15, -0.1, -0.02]);
      },
    },
    {
      id: 'pixel-haptics',
      name: 'Wideband X-Axis Linear Haptic Motor',
      category: 'Haptics',
      isOuter: false,
      explodeOffset: [-0.85, -1.65, 0.5],
      desc: 'High-definition haptic actuator for keyboard typing feedback and subtle notification rumbles.',
      funFact: 'The motor can vibrate at hundreds of different frequencies so a rain animation feels like tiny raindrops!',
      build(g) {
        rbox(g, 0.52, 0.22, 0.09, 0.03, polishedAlu, [-0.26, -1.32, 0.03]);
      },
    },
    {
      id: '42mp-front-autofocus',
      name: '42MP Wide-Angle Front Camera',
      category: 'Selfie & Video',
      isOuter: false,
      explodeOffset: [0, 1.85, 0.6],
      desc: 'Ultra-wide 103-degree field-of-view front camera so everyone fits into group selfies.',
      funFact: 'Dual-PD autofocus pixels on the sensor lock focus onto your eyes in milliseconds!',
      build(g) {
        rbox(g, 0.34, 0.24, 0.09, 0.03, mat(0x1f2937), [0, 1.4, 0.05]);
      },
    },
    {
      id: 'usbc-stereo-bottom',
      name: 'USB-C 3.2 Port & Bottom Firing Speaker',
      category: 'Audio & I/O',
      isOuter: false,
      explodeOffset: [0.65, -1.85, 0],
      desc: 'Fast-charging USB-C port, SIM tray, and stereo speaker enclosure.',
      funFact: 'Three microphones around the phone use AI Audio Magic Eraser to separate wind noise from human voices!',
      build(g) {
        rbox(g, 0.28, 0.18, 0.08, 0.03, polishedAlu, [0, -1.56, 0.01]);
        rbox(g, 0.44, 0.22, 0.09, 0.03, mat(0x1f2937), [0.4, -1.36, 0.02]);
      },
    },
  ];

  return {
    id: 'pixel-9-pro-xl',
    name: 'Google Pixel 9 Pro XL',
    brand: 'Google',
    badge: 'Tensor G4 AI • Camera Visor Bar',
    desc: 'Google’s flagship AI phone featuring the iconic horizontal Camera Visor bar with infrared thermometer, Tensor G4 chip, and copper vapor chamber.',
    cameraPos: [3.2, 1.8, 3.8],
    parts,
    quiz: makePhoneQuiz(
      parts,
      {
        q: 'Which horizontal part across the back of the Google Pixel 9 Pro holds 3 lenses, a flash, AND an infrared thermometer—and stops the phone from wobbling on a table?',
        correctId: 'camera-visor-bar',
        distractors: ['super-actua-oled', 'high-capacity-5060-battery', 'usbc-stereo-bottom'],
      },
      {
        q: 'How does the flat Copper Vapor Chamber cool down the Tensor G4 AI chip without a spinning fan?',
        correctId: 'copper-vapor-chamber',
        distractors: ['sculpted-chassis-rails', '42mp-front-autofocus', 'pixel-haptics'],
      },
    ),
  };
}

function buildSamsungS24Ultra() {
  const titaniumGray = brushedMetal(0x9ca3af, { metalness: 0.88, roughness: 0.24 });
  const spenYellow = carPaint(0xfacc15);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });

  const parts = [
    {
      id: 'gorilla-armor-amoled',
      name: '6.8" Flat Dynamic AMOLED 2X & Gorilla Armor + Wacom Digitizer',
      category: 'Display & Stylus Sensor',
      isOuter: true,
      explodeOffset: [0, 0, 1.85],
      desc: 'Sharp rectangular anti-reflective Gorilla Armor screen backed by a thin electromagnetic copper grid that senses the S-Pen stylus hovering above the glass!',
      funFact: 'The anti-reflective coating cuts 75% of screen glare in bright sunlight, and the Wacom grid powers the S-Pen wirelessly!',
      build(g) {
        rbox(g, 1.66, 3.34, 0.055, 0.04, mat(0x111827), [0, 0, 0.15]);
        rbox(g, 1.58, 3.24, 0.02, 0.02, screenMat('samsung'), [0, 0, 0.175]);
      },
    },
    {
      id: 'squared-titanium-frame',
      name: 'Squared Titanium Chassis & S-Pen Internal Silo Tunnel',
      category: 'Enclosure',
      isOuter: true,
      explodeOffset: [0, 0, -1.85],
      desc: 'Boxy cornered titanium armor frame with a waterproof cylindrical garage tunnel on the bottom left for the S-Pen.',
      funFact: 'Even though the S-Pen tunnel is open at the bottom, rubber O-ring seals keep the inside of the phone 100% waterproof!',
      build(g) {
        rbox(g, 1.7, 3.38, 0.23, 0.05, titaniumGray, [0, 0, -0.02]);
      },
    },
    {
      id: 'snapdragon-8-gen3-board',
      name: 'Snapdragon 8 Gen 3 for Galaxy PCB',
      category: 'Processor & Brain',
      isOuter: false,
      explodeOffset: [1.55, 0.35, 0.45],
      desc: 'Overclocked 8-core Snapdragon processor, 12GB LPDDR5X RAM, and UFS 4.0 flash storage.',
      funFact: 'Real-time Live Translate on this chip can translate a phone call between two different languages as you speak!',
      build(g) {
        rbox(g, 0.56, 1.56, 0.07, 0.02, pcbMat('#1e1b4b'), [0.36, 0.18, 0.02]);
        rbox(g, 0.36, 0.36, 0.03, 0.01, mat(0x0f172a), [0.36, 0.25, 0.065]);
        addPhoneMicroFastenersAndRibbons(g, 0.36, 0.18, 0.02);
      },
    },
    {
      id: '5000mah-battery',
      name: '5,000 mAh Li-Ion Pouch Battery',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-1.45, -0.15, 0.35],
      desc: 'High-capacity rectangular battery positioned right next to the S-Pen silo.',
      funFact: '45-Watt Super Fast Charging 2.0 can refill the battery from 0% to 65% in just 30 minutes!',
      build(g) {
        rbox(g, 0.78, 1.72, 0.11, 0.03, brushedMetal(0x2563eb), [-0.12, -0.22, 0.01]);
      },
    },
    {
      id: 'fast-wireless-nfc-coil',
      name: 'Fast Wireless Charging 2.0 & MST/NFC Coil',
      category: 'Wireless Charging',
      isOuter: false,
      explodeOffset: [0, -0.1, -1.15],
      desc: 'Multi-layer copper induction coil for 15W wireless charging and Wireless PowerShare.',
      funFact: 'You can charge a Galaxy Watch or Galaxy Buds right on the back of the phone while traveling!',
      build(g) {
        torus(g, 0.46, 0.04, copper, [0, -0.15, -0.05]);
      },
    },
    {
      id: 'quad-200mp-space-zoom',
      name: '200MP Main + Dual Telephoto (3x & 5x/100x Space Zoom) Array',
      category: 'Optics & Space Zoom',
      isOuter: false,
      explodeOffset: [-1.35, 1.35, -0.95],
      desc: 'Five floating camera rings on the back: a 200-megapixel main sensor, ultra-wide, 3x telephoto, folded 5x/10x periscope lens, and laser autofocus!',
      funFact: '200 megapixels means each photo is made of 200 million tiny color dots—sharp enough to zoom in on craters on the Moon!',
      build(g) {
        // 3 large vertical rings + 2 smaller right-column rings
        for (const ly of [1.32, 0.92, 0.52]) {
          cyl(g, 0.155, 0.155, 0.12, 24, titaniumGray, [-0.52, ly, -0.15], [Math.PI / 2, 0, 0]);
          cyl(g, 0.125, 0.125, 0.13, 24, glassMat(0x1e3a8a, 0.85), [-0.52, ly, -0.16], [Math.PI / 2, 0, 0]);
        }
        for (const ly of [1.28, 0.76]) {
          cyl(g, 0.11, 0.11, 0.11, 20, titaniumGray, [-0.14, ly, -0.15], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'spen-stylus',
      name: 'Built-In Bluetooth S-Pen Stylus & Supercapacitor',
      category: 'Stylus & Air Actions',
      isOuter: false,
      explodeOffset: [-1.15, -1.95, 0.45],
      desc: 'Clicks out of the bottom-left corner with a 0.7mm tip (4,096 pressure levels), gyroscope wand sensors, and a supercapacitor that charges in segundos!',
      funFact: 'You can wave the S-Pen in the air like a magic wand to snap group photos or flip presentation slides from across the room!',
      build(g) {
        cyl(g, 0.048, 0.042, 1.52, 16, spenYellow, [-0.66, -0.82, 0.01]);
        cone(g, 0.042, 0.14, 16, mat(0x1f2937), [-0.66, -0.02, 0.01]);
        cyl(g, 0.052, 0.052, 0.12, 16, titaniumGray, [-0.66, -1.62, 0.01]);
      },
    },
    {
      id: 's24-haptic-motor',
      name: 'X-Axis Linear Vibration Motor',
      category: 'Haptics',
      isOuter: false,
      explodeOffset: [0.85, -1.65, 0.5],
      desc: 'Simulates the subtle scratchy feeling of a real pencil on paper while sketching with the S-Pen!',
      funFact: 'Combined with a tiny speaker sound, the haptic motor makes the glass screen feel like textured sketch paper!',
      build(g) {
        rbox(g, 0.48, 0.22, 0.09, 0.02, titaniumGray, [0.28, -1.32, 0.03]);
      },
    },
    {
      id: 'oversized-vapor-chamber',
      name: '1.9x Enlarged Copper Vapor Chamber',
      category: 'Thermal Cooling',
      isOuter: false,
      explodeOffset: [1.35, -0.35, -0.55],
      desc: 'Samsung’s largest smartphone vapor chamber spreads heat across both the processor and the battery.',
      funFact: 'Microscopic copper mesh inside acts like a paper towel wick to pull condensed water droplets back to the hot chip!',
      build(g) {
        rbox(g, 0.76, 1.75, 0.035, 0.02, copper, [0.18, -0.1, -0.02]);
      },
    },
    {
      id: 'usbc-dex-port',
      name: 'USB-C DisplayPort (Samsung DeX) & AKG Speaker',
      category: 'Audio & Desktop I/O',
      isOuter: false,
      explodeOffset: [0.45, -1.85, 0],
      desc: 'Plug this USB-C port into any monitor and the phone transforms into a full desktop computer (Samsung DeX)!',
      funFact: 'With a Bluetooth keyboard and mouse, your pocket phone can run a multi-window desktop operating system on a TV!',
      build(g) {
        rbox(g, 0.28, 0.18, 0.08, 0.02, titaniumGray, [0, -1.58, 0.01]);
      },
    },
  ];

  return {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    badge: '200MP Space Zoom • Built-In S-Pen',
    desc: 'Squared titanium ultra-flagship with a built-in Bluetooth S-Pen stylus, 200MP quad-camera Space Zoom array, and anti-reflective Gorilla Armor.',
    cameraPos: [3.2, 1.8, 3.8],
    parts,
    quiz: makePhoneQuiz(
      parts,
      {
        q: 'Which yellow accessory clicks out of a waterproof silo in the bottom corner of the Galaxy S24 Ultra for drawing and remote camera clicks?',
        correctId: 'spen-stylus',
        distractors: ['gorilla-armor-amoled', '5000mah-battery', 'usbc-dex-port'],
      },
      {
        q: 'How many megapixels (millions of color dots) does the main rear camera sensor on the Galaxy S24 Ultra capture?',
        correctId: 'quad-200mp-space-zoom',
        distractors: ['snapdragon-8-gen3-board', 'oversized-vapor-chamber', 'squared-titanium-frame'],
      },
    ),
  };
}

function buildSamsungZFold6() {
  const craftedBlack = brushedMetal(0x27272a, { metalness: 0.85, roughness: 0.26 });
  const silverShadow = brushedMetal(0xa1a1aa, { metalness: 0.9, roughness: 0.18 });
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });

  const parts = [
    {
      id: 'folding-utg-oled',
      name: '7.6" Folding Ultra-Thin Glass (UTG) Main AMOLED',
      category: 'Folding Display',
      isOuter: true,
      explodeOffset: [0, 0, 1.85],
      desc: 'Real glass shaved thinner than a human hair (30 microns!) so the giant 7.6-inch tablet screen can fold in half 200,000 times without cracking!',
      funFact: 'When folded shut, the flexible screen bends into a smooth "waterdrop" loop inside the hinge so it never gets pinched sharp!',
      build(g) {
        rbox(g, 2.58, 3.12, 0.04, 0.06, mat(0x090d16), [0, 0, 0.14]);
        rbox(g, 2.48, 3.02, 0.02, 0.04, screenMat('samsung'), [0, 0, 0.16]);
        // Subtle center fold crease line
        box(g, 0.02, 3.02, 0.022, mat(0x1e293b), [0, 0, 0.162]);
      },
    },
    {
      id: 'dual-rail-flex-hinge',
      name: 'Dual-Rail Geared "FlexHinge" & Sweeper Bristles',
      category: 'Precision Mechanics',
      isOuter: false,
      explodeOffset: [0, 1.65, -0.45],
      desc: 'Miniature precision clockwork gears, cam springs, and microscopic nylon vacuum-cleaner bristles along the spine that sweep out dust!',
      funFact: 'Samsung Engineers copied vacuum cleaner brushes to line the hinge gap with thousands of tiny elastic fibers that block sand!',
      build(g) {
        rbox(g, 0.22, 3.16, 0.18, 0.04, silverShadow, [0, 0, -0.02]);
        for (let y = -1.2; y <= 1.2; y += 0.48) {
          cyl(g, 0.06, 0.06, 0.18, 14, copper, [0, y, 0.02], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'armor-aluminum-halves',
      name: 'Twin Armor Aluminum Book-Fold Chassis Halves',
      category: 'Enclosure',
      isOuter: true,
      explodeOffset: [0, 0, -1.85],
      desc: 'Left and right ultra-thin 5.6mm aluminum wings that fold together like a hardcover book with magnetic edge latches.',
      funFact: 'Each unfolded half is barely thicker than the USB-C charging port itself!',
      build(g) {
        rbox(g, 1.24, 3.16, 0.15, 0.05, craftedBlack, [-0.66, 0, -0.02]);
        rbox(g, 1.24, 3.16, 0.15, 0.05, craftedBlack, [0.66, 0, -0.02]);
      },
    },
    {
      id: 'split-dual-batteries',
      name: 'Split Dual-Cell 4,400 mAh Batteries (Left & Right)',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-1.55, -0.25, 0.35],
      desc: 'Because a rigid battery cannot bend in half, the Z Fold splits its battery into two matched cells—one in each wing!',
      funFact: 'Both battery cells discharge and charge together in balance so both sides of the phone weigh the exact same in your hands!',
      build(g) {
        rbox(g, 0.86, 1.68, 0.09, 0.03, brushedMetal(0x2563eb), [-0.68, -0.22, 0.01]);
        rbox(g, 0.82, 1.48, 0.09, 0.03, brushedMetal(0x2563eb), [0.68, -0.32, 0.01]);
      },
    },
    {
      id: 'wireless-coil-flex-cables',
      name: 'Wireless Charging Coil & 200,000-Cycle Ribbon Cables',
      category: 'Wireless & Interconnect',
      isOuter: false,
      explodeOffset: [0, -0.2, -1.15],
      desc: 'Ultra-flexible gold-plated polyimide ribbon cables snake right through the hinge to connect the two halves.',
      funFact: 'Robot folding machines in the factory open and slam the phone shut 200,000 times in freezing cold and desert heat to test these ribbons!',
      build(g) {
        torus(g, 0.42, 0.035, copper, [0.68, -0.15, -0.05]);
        rbox(g, 0.65, 0.18, 0.02, 0.01, copper, [0, 0.25, 0.01]);
        rbox(g, 0.65, 0.18, 0.02, 0.01, copper, [0, -0.45, 0.01]);
      },
    },
    {
      id: 'cover-screen-63',
      name: '6.3" Outer Cover AMOLED Display',
      category: 'Outer Display',
      isOuter: true,
      explodeOffset: [-1.45, 0, -1.35],
      desc: 'Full smartphone screen on the outside cover so you can text, call, and take photos while the phone is folded shut!',
      funFact: 'When you unfold the phone mid-app, your map or video automatically expands from the cover screen onto the big 7.6" tablet screen!',
      build(g) {
        rbox(g, 1.14, 3.04, 0.03, 0.04, screenMat('ios'), [-0.66, 0, -0.11]);
      },
    },
    {
      id: 'triple-rear-camera-island',
      name: '50MP Triple Rear Camera Island',
      category: 'Optics & FlexCam',
      isOuter: false,
      explodeOffset: [1.45, 1.35, -0.95],
      desc: '50MP main wide, 12MP ultra-wide, and 10MP 3x optical zoom cameras. Fold the phone to 90 degrees and it becomes its own tripod ("FlexCam")!',
      funFact: 'Because the phone has a screen on the outside too, you can take selfies using the powerful 50MP back cameras!',
      build(g) {
        rbox(g, 0.42, 0.96, 0.14, 0.16, craftedBlack, [0.92, 0.95, -0.12]);
        for (const ly of [1.24, 0.95, 0.66]) {
          cyl(g, 0.13, 0.13, 0.1, 20, silverShadow, [0.92, ly, -0.16], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'zfold-haptic-speakers',
      name: 'Dual Stereo Dolby Atmos Speakers & Haptic Engine',
      category: 'Audio & Haptics',
      isOuter: false,
      explodeOffset: [-0.85, -1.75, 0.45],
      desc: 'Top and bottom stereo speakers plus precision linear vibration motor.',
      funFact: 'The speakers automatically swap left and right audio channels depending on whether you hold the tablet vertically or horizontally!',
      build(g) {
        rbox(g, 0.52, 0.22, 0.08, 0.02, silverShadow, [-0.68, -1.38, 0.02]);
        rbox(g, 0.52, 0.22, 0.08, 0.02, silverShadow, [0.68, 1.38, 0.02]);
      },
    },
    {
      id: 'under-display-camera',
      name: 'Under-Display Camera (UDC) & Snapdragon Logic Board',
      category: 'Processor & Hidden Camera',
      isOuter: false,
      explodeOffset: [1.65, 0.35, 0.45],
      desc: 'The inner selfie camera hides *behind* a sparse grid of glowing OLED pixels so there is no black cutout hole when watching movies!',
      funFact: 'Over the camera lens, the screen uses fewer, wider-spaced pixels like a screen door so light can reach the camera while still showing your movie!',
      build(g) {
        rbox(g, 0.48, 1.48, 0.06, 0.02, pcbMat('#064e3b'), [0.68, 0.45, 0.02]);
        cyl(g, 0.07, 0.07, 0.08, 16, glassMat(0x38bdf8, 0.8), [0.68, 1.28, 0.06], [Math.PI / 2, 0, 0]);
        addPhoneMicroFastenersAndRibbons(g, 0.68, 0.45, 0.02);
      },
    },
    {
      id: 'wing-vapor-chamber',
      name: 'Ultra-Slim Graphite & Copper Thermal Spreader',
      category: 'Thermal Cooling',
      isOuter: false,
      explodeOffset: [1.35, -0.55, -0.55],
      desc: 'Spreads heat across the right wing chassis while multitasking with 3 apps open at once.',
      funFact: 'Flexible pyrolytic graphite sheets conduct heat five times faster than solid copper!',
      build(g) {
        rbox(g, 0.72, 1.56, 0.025, 0.02, copper, [0.66, -0.15, -0.02]);
      },
    },
  ];

  return {
    id: 'samsung-z-fold-6',
    name: 'Samsung Galaxy Z Fold 6',
    brand: 'Samsung',
    badge: '7.6" Folding UTG Glass • FlexHinge',
    desc: 'Book-style foldable smartphone/tablet hybrid with 30-micron folding Ultra-Thin Glass, dual-rail geared FlexHinge, and split dual batteries.',
    cameraPos: [3.5, 1.9, 4.1],
    parts,
    quiz: makePhoneQuiz(
      parts,
      {
        q: 'How can the glass screen on the Galaxy Z Fold 6 bend in half 200,000 times without shattering?',
        correctId: 'folding-utg-oled',
        distractors: ['split-dual-batteries', 'triple-rear-camera-island', 'zfold-haptic-speakers'],
      },
      {
        q: 'Why does the Galaxy Z Fold 6 use TWO separate batteries instead of one big battery across the middle?',
        correctId: 'split-dual-batteries',
        distractors: ['cover-screen-63', 'under-display-camera', 'wing-vapor-chamber'],
      },
    ),
  };
}

export const PHONE_MODELS = [
  buildIPhone16ProMax(),
  buildIPhone16Ultramarine(),
  buildGooglePixel9ProXL(),
  buildSamsungS24Ultra(),
  buildSamsungZFold6(),
];

// ============================================================================
// JET & ROCKET ENGINES (3 Propulsion Systems)
// ============================================================================
function addRadialFlangeBolts(g, x, radius, count = 16) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    positions.push([x, Math.sin(a) * radius, Math.cos(a) * radius]);
  }
  buildHexBoltArray(g, positions, {
    radius: 0.018,
    height: 0.024,
    finish: 'chrome',
    rot: [0, 0, Math.PI / 2],
  });
}

function buildGE9XTurbofan() {
  const nacelleBlue = carPaint(0x1e3a8a, { metalness: 0.48, roughness: 0.16 });
  nacelleBlue.side = THREE.DoubleSide;
  const acousticLiner = brushedMetal(0x334155, { metalness: 0.65, roughness: 0.38 });
  acousticLiner.side = THREE.DoubleSide;
  const tiMat = brushedMetal(0xcbd5e1, { metalness: 0.9, roughness: 0.18 });
  const darkTi = brushedMetal(0x475569, { metalness: 0.88, roughness: 0.22 });
  const carbon = carbonFiberMat([4, 4]);
  const flame = emissiveMat(0xff6b00, 1.4);

  const parts = [
    {
      id: 'chevron-nacelle-upper',
      name: 'Upper Composite Nacelle Cowling, Pylon Mount & Acoustic Chevrons',
      category: 'Outer Cowl',
      isOuter: true,
      explodeOffset: [0, 1.65, 0],
      desc: 'Streamlined Boeing-blue composite outer cowling with acoustic honeycomb inner liner, under-wing titanium pylon mount, and 8 sawtooth noise-reducing trailing chevrons.',
      funFact: 'The GE9X nacelle is 11 feet wide—wider than the entire passenger cabin of a Boeing 737 airliner!',
      build(g) {
        const outerGeo = new THREE.CylinderGeometry(1.04, 0.9, 2.75, 40, 1, true, 0, Math.PI);
        const outerM = new THREE.Mesh(outerGeo, nacelleBlue);
        outerM.rotation.set(0, 0, Math.PI / 2);
        outerM.position.set(0.08, 0, 0);
        outerM.castShadow = true;
        g.add(outerM);

        const innerGeo = new THREE.CylinderGeometry(0.98, 0.85, 2.72, 36, 1, true, 0, Math.PI);
        const innerM = new THREE.Mesh(innerGeo, acousticLiner);
        innerM.rotation.set(0, 0, Math.PI / 2);
        innerM.position.set(0.08, 0, 0);
        g.add(innerM);

        // Upper wing pylon fairing & thrust links
        rbox(g, 1.65, 0.28, 0.34, 0.04, tiMat, [0.15, 1.12, 0], [0, 0, -0.06]);
        rbox(g, 1.95, 0.08, 0.42, 0.02, nacelleBlue, [0.05, 1.26, 0]);

        // Sawtooth trailing-edge acoustic chevrons on upper half
        for (let i = 1; i < 8; i++) {
          const a = (i / 8) * Math.PI;
          const cy = Math.sin(a) * 0.89;
          const cz = Math.cos(a) * 0.89;
          cone(g, 0.09, 0.26, 3, nacelleBlue, [-1.38, cy, cz], [a, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'chevron-nacelle-lower',
      name: 'Lower Thrust-Reverser Cowling, Cascade Vanes & Accessory Gearbox',
      category: 'Outer Cowl & Reverser',
      isOuter: true,
      explodeOffset: [0, -1.65, 0],
      desc: 'Translating lower composite cowling exposing thrust-reverser cascade grates and the under-cowl Khronos CAD Accessory Drive Gearbox (AGB).',
      funFact: 'That roar you hear right after an airplane touches down is the translating cowling sliding aft to redirect bypass air forward!',
      build(g) {
        const outerGeo = new THREE.CylinderGeometry(1.04, 0.9, 2.75, 40, 1, true, Math.PI, Math.PI);
        const outerM = new THREE.Mesh(outerGeo, nacelleBlue);
        outerM.rotation.set(0, 0, Math.PI / 2);
        outerM.position.set(0.08, 0, 0);
        outerM.castShadow = true;
        g.add(outerM);

        const innerGeo = new THREE.CylinderGeometry(0.98, 0.85, 2.72, 36, 1, true, Math.PI, Math.PI);
        const innerM = new THREE.Mesh(innerGeo, acousticLiner);
        innerM.rotation.set(0, 0, Math.PI / 2);
        innerM.position.set(0.08, 0, 0);
        g.add(innerM);

        // Sawtooth trailing chevrons on lower half
        for (let i = 1; i < 8; i++) {
          const a = Math.PI + (i / 8) * Math.PI;
          const cy = Math.sin(a) * 0.89;
          const cz = Math.cos(a) * 0.89;
          cone(g, 0.09, 0.26, 3, nacelleBlue, [-1.38, cy, cz], [a, 0, Math.PI / 2]);
        }

        // Compact Khronos 118-node GearboxAssy CAD mounted cleanly inside lower accessory bay
        rbox(g, 0.56, 0.14, 0.42, 0.03, tiMat, [0.45, -0.88, 0]);
        addGearboxCadSubassembly(g, {
          pos: [0.45, -0.84, 0],
          scale: 0.0085,
          rot: [0, 0, 0],
        });
      },
    },
    {
      id: 'heated-inlet-lip',
      name: 'Heated Titanium Inlet Lip Ring & Acoustic Intake Barrel',
      category: 'Air Intake',
      isOuter: false,
      explodeOffset: [2.15, 0, 0],
      desc: 'Mirror-polished titanium nose lip piped with hot compressor bleed air so ice never forms in freezing clouds.',
      funFact: 'The rounded aerodynamic bellmouth accelerates air smoothly into the fan even in 40-knot crosswinds!',
      build(g) {
        torus(g, 0.99, 0.11, chromeMat(), [1.45, 0, 0], [0, Math.PI / 2, 0]);
        const inletGeo = new THREE.CylinderGeometry(0.98, 0.96, 0.22, 40, 1, true);
        const inletMat = tiMat.clone();
        inletMat.side = THREE.DoubleSide;
        const inletBarrel = new THREE.Mesh(inletGeo, inletMat);
        inletBarrel.position.set(1.34, 0, 0);
        inletBarrel.rotation.z = Math.PI / 2;
        g.add(inletBarrel);
        addRadialFlangeBolts(g, 1.24, 0.97, 24);
      },
    },
    {
      id: 'swept-carbon-fan',
      name: '16 Swept 4th-Gen Carbon-Fiber Fan Blades & Titanium Leading Edges',
      category: 'Low-Pressure Fan',
      isOuter: false,
      explodeOffset: [1.45, 0.35, 0],
      desc: '134-inch 3D-aerodynamic carbon-fiber fan blades with polished titanium leading-edge guards and a conical spinner with safety spiral.',
      funFact: 'Notice the white spiral on the black nose cone? It hypnotically swirls so ground crews immediately see if the silent engine is turning!',
      build(g) {
        const fanRotor = new THREE.Group();
        fanRotor.userData.driveAnim = 'fan';
        cyl(fanRotor, 0.34, 0.34, 0.26, 28, darkTi, [0.95, 0, 0], [0, 0, Math.PI / 2]);
        cone(fanRotor, 0.34, 0.62, 28, mat(0x0f172a, { roughness: 0.25 }), [1.36, 0, 0], [0, 0, -Math.PI / 2]);
        torus(fanRotor, 0.18, 0.016, mat(0xf8fafc), [1.28, 0, 0], [0.25, Math.PI / 2, 0]);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const by = Math.cos(a) * 0.56;
          const bz = Math.sin(a) * 0.56;
          box(fanRotor, 0.09, 0.54, 0.21, carbon, [0.96, by, bz], [a, 0.48, 0]);
          box(fanRotor, 0.022, 0.54, 0.035, chromeMat(), [1.04, by, bz], [a, 0.48, 0]);
        }
        addRadialFlangeBolts(fanRotor, 1.06, 0.28, 16);
        g.add(fanRotor);
      },
    },
    {
      id: 'bypass-guide-vanes',
      name: '10:1 High-Bypass Outlet Guide Vanes (OGVs) & Fan Frame',
      category: 'Bypass Duct',
      isOuter: false,
      explodeOffset: [0.65, 1.25, 1.25],
      desc: 'Structural stator vane ring that straightens out the swirling wall of cool bypass air and supports the front bearing housing.',
      funFact: '10 times more air flows around the cool outside bypass duct than goes through the fiery core in the middle!',
      build(g) {
        cyl(g, 0.56, 0.56, 0.28, 32, darkTi, [0.58, 0, 0], [0, 0, Math.PI / 2]);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          box(g, 0.24, 0.34, 0.024, tiMat, [0.58, Math.cos(a) * 0.72, Math.sin(a) * 0.72], [a, -0.18, 0]);
        }
      },
    },
    {
      id: 'hp-compressor-stages',
      name: '3-Stage LP Booster & 11-Stage High-Pressure Axial Compressor (27:1)',
      category: 'Compression Core',
      isOuter: false,
      explodeOffset: [0.25, 0.95, -1.35],
      desc: 'Rows of spinning titanium and nickel-superalloy bladed disks that squeeze incoming air to 60 times normal atmospheric pressure!',
      funFact: 'Squeezing air that tightly heats it up to 1,000°F before a single drop of jet fuel is even ignited!',
      build(g) {
        const compSpin = new THREE.Group();
        compSpin.userData.driveAnim = 'fan';
        for (let s = 0; s < 6; s++) {
          const r = 0.52 - s * 0.038;
          const sx = 0.36 - s * 0.12;
          cyl(compSpin, r * 0.76, r * 0.76, 0.08, 28, darkTi, [sx, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 20; b++) {
            const a = (b / 20) * Math.PI * 2 + s * 0.15;
            box(compSpin, 0.04, r * 0.32, 0.06, tiMat, [sx, Math.cos(a) * (r * 0.86), Math.sin(a) * (r * 0.86)], [a, 0.35, 0]);
          }
        }
        g.add(compSpin);
        addRadialFlangeBolts(g, 0.4, 0.54, 18);
        addRadialFlangeBolts(g, -0.26, 0.38, 16);
        buildWiringHarness(g, [
          {
            points: [
              [0.36, 0.52, 0.15],
              [0.05, 0.46, 0.28],
              [-0.25, 0.42, 0.18],
            ],
            radius: 0.015,
            color: 0xeab308,
            braided: true,
          },
          {
            points: [
              [0.36, -0.52, -0.15],
              [0.05, -0.46, -0.28],
              [-0.25, -0.42, -0.18],
            ],
            radius: 0.015,
            color: 0xcbd5e1,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'twin-annular-combustor',
      name: 'TAPS III 3D-Printed Low-NOx Annular Combustion Chamber',
      category: 'Combustion',
      isOuter: false,
      explodeOffset: [-0.35, 1.35, 0],
      desc: '28 3D-printed cobalt-chrome fuel swirl nozzles inject jet fuel into compressed air, burning continuously at over 2,700°F.',
      funFact: 'The air inside the combustor moves like a hurricane, so fuel nozzles create tiny sheltered vortexes so the flame never blows out!',
      build(g) {
        cyl(g, 0.44, 0.44, 0.38, 32, flame, [-0.42, 0, 0], [0, 0, Math.PI / 2]);
        torus(g, 0.46, 0.032, brushedMetal(0xd97706), [-0.28, 0, 0], [0, Math.PI / 2, 0]);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          cyl(g, 0.022, 0.022, 0.09, 10, chromeMat(), [-0.32, Math.cos(a) * 0.46, Math.sin(a) * 0.46], [0, 0, Math.PI / 2]);
        }
        addRadialFlangeBolts(g, -0.25, 0.48, 18);
      },
    },
    {
      id: 'cmc-hp-turbine',
      name: '2-Stage Ceramic-Matrix Composite (CMC) High-Pressure Turbine',
      category: 'Turbine Extraction',
      isOuter: false,
      explodeOffset: [-0.85, -1.15, 1.25],
      desc: 'Single-crystal nickel superalloy turbine disks with ceramic-coated airfoils extracting 70,000+ horsepower from the combustor stream.',
      funFact: 'The gas around these blades is hotter than the melting point of the metal itself—laser-drilled cooling holes wrap each blade in a film of cool air!',
      build(g) {
        const turbSpin = new THREE.Group();
        turbSpin.userData.driveAnim = 'fan';
        for (const [tx, tr] of [[-0.72, 0.45], [-0.88, 0.49]]) {
          cyl(turbSpin, tr * 0.78, tr * 0.78, 0.1, 28, brushedMetal(0xd97706), [tx, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 22; b++) {
            const a = (b / 22) * Math.PI * 2;
            box(turbSpin, 0.045, tr * 0.28, 0.055, brushedMetal(0xf59e0b), [tx, Math.cos(a) * (tr * 0.88), Math.sin(a) * (tr * 0.88)], [a, -0.38, 0]);
          }
        }
        g.add(turbSpin);
        addRadialFlangeBolts(g, -0.78, 0.53, 16);
      },
    },
    {
      id: 'concentric-twin-shaft',
      name: 'Concentric Twin-Spool Drive Shafts (N1 LP Shaft & N2 HP Shaft)',
      category: 'Mechanical Spine',
      isOuter: false,
      explodeOffset: [0, -1.25, -1.35],
      desc: 'A forged maraging-steel inner LP shaft running coaxially inside a hollow Inconel HP shaft on roller and ball thrust bearings.',
      funFact: 'Two concentric shafts spinning at different speeds let the giant 11-foot front fan spin smoothly at 2,500 RPM while the core screams at 12,000 RPM!',
      build(g) {
        const shaftSpin = new THREE.Group();
        shaftSpin.userData.driveAnim = 'fan';
        cyl(shaftSpin, 0.085, 0.085, 2.38, 24, chromeMat(), [0, 0, 0], [0, 0, Math.PI / 2]);
        cyl(shaftSpin, 0.145, 0.145, 1.26, 24, brushedMetal(0x94a3b8), [-0.16, 0, 0], [0, 0, Math.PI / 2]);
        torus(shaftSpin, 0.17, 0.025, brushedMetal(0xfbbf24), [0.42, 0, 0], [0, Math.PI / 2, 0]);
        torus(shaftSpin, 0.17, 0.025, brushedMetal(0xfbbf24), [-0.76, 0, 0], [0, Math.PI / 2, 0]);
        g.add(shaftSpin);
      },
    },
    {
      id: 'exhaust-mixer-cone',
      name: '6-Stage Low-Pressure Turbine & Inconel Acoustic Exhaust Cone',
      category: 'Exhaust Nozzle',
      isOuter: false,
      explodeOffset: [-2.15, 0, 0],
      desc: '6-stage Titanium-Aluminide LP turbine driving the front fan, followed by a tapered Inconel core nozzle and center vent plug.',
      funFact: 'GE9X uses lightweight Titanium-Aluminide (TiAl) blades in the low-pressure turbine—half the weight of traditional nickel superalloys!',
      build(g) {
        cyl(g, 0.56, 0.44, 0.54, 32, tiMat, [-1.25, 0, 0], [0, 0, Math.PI / 2]);
        lathe(g, [[-2.05, 0.04], [-1.85, 0.18], [-1.52, 0.38], [-1.25, 0.42]], 32, darkTi);
        addRadialFlangeBolts(g, -1.02, 0.57, 18);
      },
    },
  ];

  return {
    id: 'ge9x-turbofan',
    name: 'GE9X / Trent High-Bypass Turbofan',
    brand: 'GE Aerospace',
    badge: '134,300 lbf Record • 10:1 Bypass',
    desc: 'The Guinness World Record most powerful commercial jet engine with 16 swept carbon-fiber fan blades, 27:1 compressor, and ceramic turbines.',
    cameraPos: [3.9, 2.3, 4.1],
    parts,
    quiz: [
      {
        q: 'Which spinning front part with 16 swept carbon-fiber blades produces 90% of a modern airliner engine’s thrust?',
        correctId: 'swept-carbon-fan',
        distractors: ['twin-annular-combustor', 'concentric-twin-shaft', 'exhaust-mixer-cone'],
      },
      {
        q: 'Why do high-pressure turbine blades have microscopic laser-drilled air holes all over their surfaces?',
        correctId: 'cmc-hp-turbine',
        distractors: ['heated-inlet-lip', 'chevron-nacelle-upper', 'bypass-guide-vanes'],
      },
      {
        q: 'What is the job of the 11-stage High-Pressure Compressor before any fuel is added?',
        correctId: 'hp-compressor-stages',
        distractors: ['chevron-nacelle-lower', 'exhaust-mixer-cone', 'heated-inlet-lip'],
      },
      {
        q: 'Which part slides backward on landing to redirect bypass air forward and help brake the airplane?',
        correctId: 'chevron-nacelle-lower',
        distractors: ['concentric-twin-shaft', 'twin-annular-combustor', 'cmc-hp-turbine'],
      },
      {
        q: 'How do the rear turbine stages spin the giant front fan at the nose of the engine?',
        correctId: 'concentric-twin-shaft',
        distractors: ['heated-inlet-lip', 'bypass-guide-vanes', 'chevron-nacelle-upper'],
      },
    ],
  };
}

function buildF135AfterburnerJet() {
  const darkTi = brushedMetal(0x475569, { metalness: 0.88, roughness: 0.24 });
  darkTi.side = THREE.DoubleSide;
  const inconel = brushedMetal(0x94a3b8, { metalness: 0.92, roughness: 0.16 });
  inconel.side = THREE.DoubleSide;
  const goldAnodized = brushedMetal(0xd97706, { metalness: 0.9, roughness: 0.18 });
  const afterburnerPlasma = emissiveMat(0x38bdf8, 1.45);
  const combustorFire = emissiveMat(0xff5a00, 1.35);

  const parts = [
    {
      id: 'titanium-bypass-case',
      name: 'Machined Titanium Outer Bypass Case, Stiffener Rings & Plumbing',
      category: 'Engine Case',
      isOuter: true,
      explodeOffset: [0, 1.55, 0],
      desc: 'Slim, low-bypass isogrid-machined titanium outer shell wrapped in structural stiffening flanges and braided stainless-steel fuel/hydraulic lines.',
      funFact: 'Fighter jet engines are long and narrow like cigars so they fit inside a stealth supersonic fuselage with minimal radar and aerodynamic drag!',
      build(g) {
        const geo = new THREE.CylinderGeometry(0.62, 0.62, 2.76, 36, 1, true, 0, Math.PI);
        const m = new THREE.Mesh(geo, darkTi);
        m.rotation.set(0, 0, Math.PI / 2);
        g.add(m);
        for (const fx of [1.18, 0.55, -0.05, -0.68, -1.25]) {
          torus(g, 0.63, 0.018, inconel, [fx, 0, 0], [0, Math.PI / 2, 0]);
        }
        addRadialFlangeBolts(g, 0.85, 0.635, 18);
        addRadialFlangeBolts(g, -0.45, 0.635, 18);
        buildWiringHarness(g, [
          {
            points: [
              [1.1, 0.63, 0.12],
              [0.35, 0.64, 0.22],
              [-0.55, 0.63, 0.14],
              [-1.2, 0.62, 0.08],
            ],
            radius: 0.016,
            color: 0xcbd5e1,
            braided: true,
          },
          {
            points: [
              [0.95, 0.56, -0.32],
              [0.15, 0.58, -0.28],
              [-0.85, 0.56, -0.34],
            ],
            radius: 0.016,
            color: 0xfacc15,
          },
        ]);
      },
    },
    {
      id: 'lower-engine-gearbox',
      name: 'Lower Titanium Case & Integrated Power Package (CAD Gearbox)',
      category: 'Engine Case',
      isOuter: true,
      explodeOffset: [0, -1.55, 0],
      desc: 'Lower titanium half-shell housing the starter/generator, hydraulic pumps, and real Khronos 118-node CAD accessory drive gearbox.',
      funFact: 'The F135 is the most powerful fighter jet engine ever built, cranking out 43,000 pounds of thrust!',
      build(g) {
        const geo = new THREE.CylinderGeometry(0.62, 0.62, 2.76, 36, 1, true, Math.PI, Math.PI);
        const m = new THREE.Mesh(geo, darkTi);
        m.rotation.set(0, 0, Math.PI / 2);
        g.add(m);
        rbox(g, 0.58, 0.14, 0.4, 0.025, inconel, [0.45, -0.66, 0]);
        addGearboxCadSubassembly(g, {
          pos: [0.45, -0.64, 0],
          scale: 0.008,
          rot: [0, 0, 0],
        });
      },
    },
    {
      id: 'three-stage-blisk-fan',
      name: '3-Stage Hollow-Titanium "Blisk" Supersonic Fan & Nose Cone',
      category: 'Supersonic Fan',
      isOuter: false,
      explodeOffset: [1.95, 0.25, 0],
      desc: 'Instead of slotting separate blades into a hub, the disk and 18 swept blades per stage are CNC-milled from one solid block of titanium ("Bladed Disk" = Blisk)!',
      funFact: 'Eliminating blade slots cuts weight by 30% and prevents blades from ever loosening under 9-G supersonic fighter turns!',
      build(g) {
        const bliskSpin = new THREE.Group();
        bliskSpin.userData.driveAnim = 'fan';
        cone(bliskSpin, 0.22, 0.42, 24, darkTi, [1.46, 0, 0], [0, 0, -Math.PI / 2]);
        for (let s = 0; s < 3; s++) {
          const sx = 1.25 - s * 0.2;
          const r = 0.56 - s * 0.03;
          cyl(bliskSpin, r * 0.52, r * 0.52, 0.12, 28, inconel, [sx, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 18; b++) {
            const a = (b / 18) * Math.PI * 2 + s * 0.18;
            box(bliskSpin, 0.048, r * 0.42, 0.095, inconel, [sx, Math.cos(a) * (r * 0.72), Math.sin(a) * (r * 0.72)], [a, 0.38, 0]);
          }
        }
        g.add(bliskSpin);
      },
    },
    {
      id: 'six-stage-hp-compressor',
      name: '6-Stage High-Pressure Core Compressor & Variable Stator Vanes',
      category: 'Compression',
      isOuter: false,
      explodeOffset: [0.65, 1.15, 0],
      desc: 'Counter-rotating titanium/nickel compressor stages with variable-pitch stator actuator rings that pack supersonic inlet air into the core.',
      funFact: 'The front fan and the inner core spin in opposite directions ("counter-rotating") to cancel out gyroscopic twist during dogfights!',
      build(g) {
        const compSpin = new THREE.Group();
        compSpin.userData.driveAnim = 'fan';
        for (let s = 0; s < 6; s++) {
          const sx = 0.65 - s * 0.11;
          const r = 0.44 - s * 0.015;
          cyl(compSpin, r * 0.78, r * 0.78, 0.075, 24, inconel, [sx, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 20; b++) {
            const a = (b / 20) * Math.PI * 2 + s * 0.2;
            box(compSpin, 0.035, r * 0.24, 0.05, goldAnodized, [sx, Math.cos(a) * (r * 0.88), Math.sin(a) * (r * 0.88)], [a, 0.32, 0]);
          }
        }
        g.add(compSpin);
        addRadialFlangeBolts(g, 0.68, 0.46, 16);
      },
    },
    {
      id: 'annular-core-combustor',
      name: 'High-Temperature Annular Main Combustor & Fuel Manifold',
      category: 'Core Combustion',
      isOuter: false,
      explodeOffset: [-0.05, 1.35, 1.15],
      desc: 'Primary combustion ring where JP-8 military aviation fuel burns continuously at over 2,900°F.',
      funFact: 'Military JP-8 fuel has such a high flashpoint you can drop a lit match into a bucket of it at room temperature and it won’t ignite!',
      build(g) {
        cyl(g, 0.41, 0.41, 0.34, 28, combustorFire, [-0.15, 0, 0], [0, 0, Math.PI / 2]);
        torus(g, 0.43, 0.024, goldAnodized, [-0.02, 0, 0], [0, Math.PI / 2, 0]);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          cyl(g, 0.018, 0.018, 0.07, 10, chromeMat(), [-0.08, Math.cos(a) * 0.43, Math.sin(a) * 0.43], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'counter-rotating-turbines',
      name: 'Single-Crystal Counter-Rotating HP & LP Turbines',
      category: 'Turbine Section',
      isOuter: false,
      explodeOffset: [-0.45, -1.25, 1.15],
      desc: 'Thermal-barrier-coated single-crystal turbine blades spinning at over 15,000 RPM without inter-stage stator vanes.',
      funFact: 'Each turbine blade experiences centrifugal pull equal to hanging a loaded freight train car from its tip!',
      build(g) {
        const turbSpin = new THREE.Group();
        turbSpin.userData.driveAnim = 'fan';
        for (const [tx, tr] of [[-0.45, 0.43], [-0.62, 0.47]]) {
          cyl(turbSpin, tr * 0.78, tr * 0.78, 0.11, 28, goldAnodized, [tx, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 22; b++) {
            const a = (b / 22) * Math.PI * 2;
            box(turbSpin, 0.04, tr * 0.25, 0.05, inconel, [tx, Math.cos(a) * (tr * 0.88), Math.sin(a) * (tr * 0.88)], [a, -0.35, 0]);
          }
        }
        g.add(turbSpin);
      },
    },
    {
      id: 'afterburner-spray-rings',
      name: 'Augmentor Afterburner Fuel Spray Rings & Radial Flameholders',
      category: 'Afterburner / Reheat',
      isOuter: false,
      explodeOffset: [-1.15, 1.25, -1.15],
      desc: 'Injects raw jet fuel straight into the hot exhaust behind the turbines across radial V-gutter flameholders to boost thrust by 50%!',
      funFact: 'Because jet exhaust still contains plenty of unburned oxygen, the afterburner lights a second supersonic fire in the tailpipe!',
      build(g) {
        for (const dx of [-0.95, -1.22, -1.48]) {
          torus(g, 0.45, 0.028, afterburnerPlasma, [dx, 0, 0], [0, Math.PI / 2, 0]);
        }
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          box(g, 0.08, 0.34, 0.024, darkTi, [-0.88, Math.cos(a) * 0.26, Math.sin(a) * 0.26], [a, 0, 0]);
        }
        cyl(g, 0.4, 0.4, 0.62, 28, afterburnerPlasma, [-1.22, 0, 0], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'screech-liner-duct',
      name: 'Ceramic-Lined Afterburner Screech Suppressor Duct',
      category: 'Thermal Protection',
      isOuter: false,
      explodeOffset: [-1.25, -1.25, -1.15],
      desc: 'Corrugated perforated Inconel liner that absorbs acoustic screech and keeps the 3,500°F afterburner flame from melting the outer tailpipe.',
      funFact: 'Cool bypass air flows between the double walls of the tailpipe like a thermos bottle!',
      build(g) {
        cyl(g, 0.55, 0.55, 0.78, 32, inconel, [-1.22, 0, 0], [0, 0, Math.PI / 2]);
        addRadialFlangeBolts(g, -0.85, 0.57, 16);
      },
    },
    {
      id: 'convergent-divergent-nozzle',
      name: 'Variable-Area Stealth "Turkey Feather" Exhaust Nozzle & Rams',
      category: 'Supersonic Nozzle',
      isOuter: false,
      explodeOffset: [-2.25, 0, 0],
      desc: '18 overlapping radar-absorbent sawtooth titanium petals driven by hydraulic actuator rams that constrict or expand the supersonic throat.',
      funFact: 'Squeezing the throat and flaring the exit ("convergent-divergent") accelerates exhaust gas past Mach 2—creating glowing shock diamonds in the sky!',
      build(g) {
        cyl(g, 0.56, 0.56, 0.14, 32, darkTi, [-1.62, 0, 0], [0, 0, Math.PI / 2]);
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const py = Math.cos(a) * 0.52;
          const pz = Math.sin(a) * 0.52;
          box(g, 0.56, 0.032, 0.16, darkTi, [-1.88, py, pz], [a, 0, -0.14]);
          cyl(g, 0.018, 0.018, 0.34, 10, chromeMat(), [-1.58, Math.cos(a) * 0.58, Math.sin(a) * 0.58], [0, 0, Math.PI / 2]);
        }
        cyl(g, 0.42, 0.48, 0.44, 28, combustorFire, [-1.86, 0, 0], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'fadec-digital-computer',
      name: 'Dual-Redundant FADEC Flight Engine Computers & Fuel Cooled Heat Sink',
      category: 'Digital Control',
      isOuter: false,
      explodeOffset: [0.85, 1.45, 1.15],
      desc: 'Full Authority Digital Engine Control boxes that monitor 200 temperature, rotor-speed, and pressure sensors 100 times a second.',
      funFact: 'Jet fuel actually flows through cooling channels inside the computer casing to keep the microchips cool!',
      build(g) {
        rbox(g, 0.48, 0.14, 0.36, 0.03, brushedMetal(0x0284c7), [0.65, 0.54, 0.25]);
        buildHexBoltArray(
          g,
          [
            [0.45, 0.62, 0.11],
            [0.85, 0.62, 0.11],
            [0.45, 0.62, 0.39],
            [0.85, 0.62, 0.39],
          ],
          { radius: 0.015, height: 0.018, finish: 'chrome' },
        );
      },
    },
  ];

  return {
    id: 'f135-afterburner-jet',
    name: 'Pratt & Whitney F135 Afterburning Jet',
    brand: 'Pratt & Whitney',
    badge: '43,000 lbf • Supersonic Afterburner',
    desc: 'Supersonic fighter jet turbofan featuring a 3-stage titanium Blisk fan, augmentor afterburner spray rings, and variable "turkey-feather" nozzle.',
    cameraPos: [3.9, 2.2, 4.0],
    parts,
    quiz: [
      {
        q: 'Which part at the back of a fighter jet engine sprays extra fuel straight into the hot exhaust for a huge supersonic thrust boost?',
        correctId: 'afterburner-spray-rings',
        distractors: ['three-stage-blisk-fan', 'fadec-digital-computer', 'titanium-bypass-case'],
      },
      {
        q: 'Why do the overlapping titanium petals at the back of the fighter engine open and close ("variable-area nozzle")?',
        correctId: 'convergent-divergent-nozzle',
        distractors: ['six-stage-hp-compressor', 'lower-engine-gearbox', 'annular-core-combustor'],
      },
      {
        q: 'What is a "Blisk" in the front fan of the F135 fighter engine?',
        correctId: 'three-stage-blisk-fan',
        distractors: ['screech-liner-duct', 'counter-rotating-turbines', 'fadec-digital-computer'],
      },
      {
        q: 'How does the FADEC engine computer stay cool while bolted to the side of a roaring jet engine?',
        correctId: 'fadec-digital-computer',
        distractors: ['convergent-divergent-nozzle', 'afterburner-spray-rings', 'annular-core-combustor'],
      },
      {
        q: 'What keeps the 3,500°F afterburner flame from melting the metal tailpipe wall?',
        correctId: 'screech-liner-duct',
        distractors: ['three-stage-blisk-fan', 'six-stage-hp-compressor', 'lower-engine-gearbox'],
      },
    ],
  };
}

function buildSpaceXRaptorRocket() {
  const copperNozzle = brushedMetal(0xb45309, { metalness: 0.88, roughness: 0.2 });
  copperNozzle.side = THREE.DoubleSide;
  const inconel = brushedMetal(0xcbd5e1, { metalness: 0.92, roughness: 0.16 });
  inconel.side = THREE.DoubleSide;
  const cryoSteel = brushedMetal(0x475569, { metalness: 0.86, roughness: 0.24 });
  const methaloxFlame = emissiveMat(0x8b5cf6, 1.5);

  const parts = [
    {
      id: 'de-laval-bell-nozzle',
      name: 'Regeneratively Cooled De Laval Bell Nozzle (NASA Cryo Rocket CAD)',
      category: 'Thrust Expansion',
      isOuter: true,
      explodeOffset: [-1.85, 0, 0],
      desc: 'Parabolic bell nozzle with milled internal copper cooling channels and Inconel stiffening rings: freezing -260°F liquid methane flows through the walls to keep the nozzle from melting!',
      funFact: 'Pumping icy liquid fuel through the hot rocket nozzle walls before burning it is called "regenerative cooling"—it pre-warms the fuel and saves the metal!',
      build(g) {
        // Real NASA RS-25 / Liquid Rocket Engine CAD (`space_shuttle_eng.glb`) at proper Studio scale
        addRocketEngineCad(g, {
          pos: [-0.15, 0, 0],
          scale: 0.0032,
          rot: [0, 0, 0],
          replaceFallback: false,
        });
        // Contoured parabolic De Laval bell nozzle
        lathe(
          g,
          [
            [-1.58, 0.98],
            [-1.25, 0.86],
            [-0.85, 0.68],
            [-0.45, 0.48],
            [-0.05, 0.31],
            [0.2, 0.28],
          ],
          40,
          cryoSteel,
        );
        lathe(
          g,
          [
            [-1.56, 0.95],
            [-1.25, 0.83],
            [-0.85, 0.65],
            [-0.45, 0.45],
            [-0.05, 0.29],
          ],
          36,
          copperNozzle,
        );
        for (const [x, r] of [
          [-1.52, 0.96],
          [-1.22, 0.85],
          [-0.92, 0.72],
          [-0.62, 0.56],
          [-0.32, 0.42],
          [-0.02, 0.32],
        ]) {
          torus(g, r, 0.022, inconel, [x, 0, 0], [0, Math.PI / 2, 0]);
        }
        addRadialFlangeBolts(g, 0.18, 0.34, 16);
      },
    },
    {
      id: 'combustion-chamber-throat',
      name: '350-Bar Main Combustion Chamber & Converging Sonic Throat',
      category: 'Combustion Core',
      isOuter: false,
      explodeOffset: [0.35, 1.35, 0],
      desc: 'Milled copper-alloy chamber jacketed in high-strength Inconel that holds the highest combustion pressure of any orbital rocket engine in history—over 5,000 PSI!',
      funFact: 'A single desk-sized Raptor engine produces up to 617,000 pounds of thrust—more than twice all four engines on a Boeing 747 combined!',
      build(g) {
        lathe(
          g,
          [
            [0.18, 0.28],
            [0.35, 0.38],
            [0.65, 0.43],
            [0.88, 0.43],
          ],
          36,
          copperNozzle,
        );
        cyl(g, 0.36, 0.26, 0.68, 28, methaloxFlame, [0.54, 0, 0], [0, 0, Math.PI / 2]);
        addRadialFlangeBolts(g, 0.88, 0.46, 18);
      },
    },
    {
      id: 'coaxial-swirl-injector',
      name: 'Full-Flow Staged Combustion Coaxial Swirl Injector Dome',
      category: 'Fuel/Oxygen Mixing',
      isOuter: false,
      explodeOffset: [0.95, 1.65, 0],
      desc: 'Hundreds of coaxial swirl elements mix hot oxygen-rich gas and hot methane-rich gas together so both propellants enter already vaporized for 99% efficiency!',
      funFact: 'Unlike kerosene rockets that leave black soot, burning Methane (CH4) and Oxygen (O2) creates clean purple-blue water vapor and CO2—and both can be made on Mars!',
      build(g) {
        cyl(g, 0.46, 0.46, 0.14, 32, inconel, [0.95, 0, 0], [0, 0, Math.PI / 2]);
        addRadialFlangeBolts(g, 0.95, 0.48, 20);
      },
    },
    {
      id: 'methane-turbopump',
      name: 'Fuel-Rich Preburner & Liquid Methane (CH4) Turbopump',
      category: 'Cryogenic Turbopump',
      isOuter: false,
      explodeOffset: [1.55, 1.05, 1.15],
      desc: 'Spins at over 30,000 RPM to pump freezing liquid methane at the rate of emptying a backyard swimming pool in 25 seconds!',
      funFact: 'The methane turbopump turbine alone generates over 70,000 horsepower—more than a nuclear submarine!',
      build(g) {
        const pumpSpin = new THREE.Group();
        pumpSpin.userData.driveAnim = 'fan';
        cyl(pumpSpin, 0.26, 0.26, 0.54, 28, inconel, [1.28, 0.28, 0.26], [0, 0, Math.PI / 2]);
        g.add(pumpSpin);
        torus(g, 0.27, 0.055, cryoSteel, [1.14, 0.28, 0.26], [0, Math.PI / 2, 0]);
      },
    },
    {
      id: 'oxygen-turbopump',
      name: 'Oxygen-Rich Preburner & SX500 Liquid Oxygen (LOX) Turbopump',
      category: 'Cryogenic Turbopump',
      isOuter: false,
      explodeOffset: [1.55, -1.05, -1.15],
      desc: 'Pumps pale-blue liquid oxygen at -297°F using a special single-crystal nickel superalloy "SX500" that won’t catch fire in hot high-pressure oxygen.',
      funFact: 'In pure hot oxygen at 800 bar, ordinary steel burns like a sparkler—SpaceX had to invent a brand-new metal alloy in their foundry!',
      build(g) {
        const loxSpin = new THREE.Group();
        loxSpin.userData.driveAnim = 'fan';
        cyl(loxSpin, 0.28, 0.28, 0.58, 28, brushedMetal(0x38bdf8), [1.3, -0.22, -0.22], [0, 0, Math.PI / 2]);
        g.add(loxSpin);
        torus(g, 0.29, 0.06, inconel, [1.16, -0.22, -0.22], [0, Math.PI / 2, 0]);
      },
    },
    {
      id: 'downcomer-transfer-manifolds',
      name: 'High-Pressure Cryogenic Transfer Tubes & Bellows Manifolds',
      category: 'Plumbing',
      isOuter: false,
      explodeOffset: [0.65, -1.35, 1.35],
      desc: 'Thick hydroformed Inconel pipes with articulated gimbal bellows that carry cryogenic liquid from the pumps to the nozzle skirt and back up.',
      funFact: 'On Raptor 3, engineers hid almost all external secondary pipes inside 3D-printed internal channels so the engine needs no heat shield!',
      build(g) {
        tube(
          g,
          [
            [1.15, 0.3, 0.28],
            [0.45, 0.48, 0.38],
            [-0.38, 0.52, 0.28],
          ],
          0.055,
          inconel,
        );
        tube(
          g,
          [
            [1.18, -0.24, -0.24],
            [0.55, -0.44, -0.36],
            [0.45, -0.32, 0],
          ],
          0.06,
          cryoSteel,
        );
        buildWiringHarness(g, [
          {
            points: [
              [1.35, 0.15, 0.34],
              [0.75, 0.36, 0.44],
              [0.15, 0.4, 0.38],
            ],
            radius: 0.016,
            color: 0xf97316,
            braided: true,
          },
          {
            points: [
              [1.35, -0.15, -0.34],
              [0.75, -0.36, -0.42],
              [0.15, -0.4, -0.34],
            ],
            radius: 0.016,
            color: 0x38bdf8,
          },
        ]);
      },
    },
    {
      id: 'tvc-gimbal-actuators',
      name: 'Dual Electric Thrust-Vector Gimbal Actuators (TVC)',
      category: 'Steering & Landing',
      isOuter: false,
      explodeOffset: [1.35, 1.35, -1.25],
      desc: 'Rockets don’t have wings in space—so two high-speed electric ball-screw jacks tilt the entire rocket engine up to 15 degrees to steer Starship!',
      funFact: 'When Super Heavy flies back to the launch tower to be caught by giant "Mechazilla" chopsticks, 13 gimballing Raptors steer it to within inches!',
      build(g) {
        cyl(g, 0.055, 0.055, 0.82, 16, carPaint(0xef4444), [1.1, 0.48, -0.32], [0.4, 0, 0.65]);
        cyl(g, 0.055, 0.055, 0.82, 16, carPaint(0xef4444), [1.1, -0.48, 0.32], [-0.4, 0, -0.65]);
      },
    },
    {
      id: 'cardan-gimbal-mount',
      name: 'Top Cardan Gimbal Bearing & Thrust Dome Mount',
      category: 'Structural Mount',
      isOuter: false,
      explodeOffset: [2.15, 0, 0],
      desc: 'Universal Cardan joint at the top of the powerhead that transfers 300 tons of upward thrust into the rocket’s stainless-steel tank dome while letting the engine pivot.',
      funFact: 'All 33 Raptor engines on the Super Heavy booster push upward with 16.7 million pounds of force—twice the thrust of the Apollo Saturn V Moon rocket!',
      build(g) {
        cyl(g, 0.34, 0.42, 0.28, 28, cryoSteel, [1.68, 0, 0], [0, 0, Math.PI / 2]);
        sphere(g, 0.26, 22, inconel, [1.82, 0, 0]);
        addRadialFlangeBolts(g, 1.68, 0.4, 14);
      },
    },
    {
      id: 'torch-igniters',
      name: 'Dual Spark-Torch Plasma Igniters (Orbital Relightable)',
      category: 'Ignition',
      isOuter: false,
      explodeOffset: [0.85, -1.45, -0.85],
      desc: 'Built-in coaxial spark-torch plasma igniters let the rocket engine shut off in space and relight multiple times to land back on Earth!',
      funFact: 'Disposable rockets used one-time chemical matches to light on the pad, but Raptor can relight itself in mid-air like a car engine!',
      build(g) {
        cyl(g, 0.06, 0.06, 0.3, 16, brushedMetal(0xfacc15), [0.75, -0.42, 0], [0, 0, 0.4]);
      },
    },
    {
      id: 'mach-diamond-plume',
      name: 'Supersonic Methalox Exhaust Plume & Mach Shock Diamonds',
      category: 'Exhaust Physics',
      isOuter: false,
      explodeOffset: [-2.65, 0, 0],
      desc: 'Violet-blue column of 3,300 m/s exhaust gas featuring standing shockwave intersections called "Mach Diamonds"!',
      funFact: 'Mach diamonds form when supersonic rocket exhaust exits at a slightly different pressure than the surrounding air, bouncing shockwaves back and forth!',
      build(g) {
        const plumeMat = new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        });
        cone(g, 0.88, 1.25, 28, plumeMat, [-2.18, 0, 0], [0, 0, -Math.PI / 2]);
        for (const dx of [-1.76, -2.08, -2.4]) {
          sphere(g, 0.19, 16, emissiveMat(0xe0f2fe, 1.5), [dx, 0, 0], [0, 0, 0], [1.45, 0.58, 0.58]);
        }
      },
    },
  ];

  return {
    id: 'spacex-raptor-rocket',
    name: 'SpaceX Raptor Methalox Rocket Engine',
    brand: 'SpaceX',
    badge: '590,000 lbf • Full-Flow Staged Combustion',
    desc: 'Reusable methane-oxygen rocket engine powering Starship & Super Heavy with dual preburner turbopumps and a regeneratively cooled bell nozzle.',
    cameraPos: [3.9, 2.3, 4.1],
    parts,
    quiz: [
      {
        q: 'How does the SpaceX Raptor rocket engine keep its copper bell nozzle from melting in 6,000°F fire?',
        correctId: 'de-laval-bell-nozzle',
        distractors: ['cardan-gimbal-mount', 'torch-igniters', 'tvc-gimbal-actuators'],
      },
      {
        q: 'Since a rocket has no wings in outer space, which parts tilt the entire Raptor engine to steer Starship?',
        correctId: 'tvc-gimbal-actuators',
        distractors: ['coaxial-swirl-injector', 'downcomer-transfer-manifolds', 'mach-diamond-plume'],
      },
      {
        q: 'Why did SpaceX choose Liquid Methane and Liquid Oxygen ("Methalox") for the Raptor engine?',
        correctId: 'coaxial-swirl-injector',
        distractors: ['cardan-gimbal-mount', 'tvc-gimbal-actuators', 'torch-igniters'],
      },
      {
        q: 'Which parts spin at 30,000 RPM to pump freezing liquid methane and liquid oxygen into the engine?',
        correctId: 'methane-turbopump',
        distractors: ['mach-diamond-plume', 'cardan-gimbal-mount', 'torch-igniters'],
      },
      {
        q: 'What are the bright glowing rings visible inside a supersonic rocket exhaust plume called?',
        correctId: 'mach-diamond-plume',
        distractors: ['downcomer-transfer-manifolds', 'oxygen-turbopump', 'cardan-gimbal-mount'],
      },
    ],
  };
}

export const JET_MODELS = [
  buildGE9XTurbofan(),
  buildF135AfterburnerJet(),
  buildSpaceXRaptorRocket(),
];
