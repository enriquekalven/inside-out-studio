// Hyper-Detailed 3D Laptops, Houses/Architecture & 4K/8K TV Models for Inside Out Studio:
// Laptops: 1. MacBook Pro 16" (M4 Max)  2. MacBook Air 15" (M3 Fanless)  3. ROG / Razer RTX Vapor-Chamber Gaming Laptop
// Houses: 1. Modern Eco Smart Home  2. Mid-Century Glass & Steel Pavilion Villa  3. Geodesic Dome Off-Grid Cabin
// TVs: 1. 85" QD-OLED & Mini-LED 8K TV  2. LG Signature Transparent OLED TV  3. IMAX Dual-Laser Cinema System
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
  solarGridTexture,
  brickWallTexture,
  box,
  rbox,
  cyl,
  sphere,
  torus,
  cone,
  tube,
  extrudeProfile,
  buildHexBoltArray,
  buildWiringHarness,
} from '../materials.js';

function addLaptopBoardFasteners(g, y = -0.25, z = -0.36) {
  buildHexBoltArray(
    g,
    [
      [-0.95, y, z - 0.28],
      [0.95, y, z - 0.28],
      [-0.95, y, z + 0.28],
      [0.95, y, z + 0.28],
      [-0.32, y, z - 0.28],
      [0.32, y, z - 0.28],
    ],
    { radius: 0.018, height: 0.016, finish: 'chrome' },
  );
  buildWiringHarness(g, [
    {
      points: [
        [-0.45, y + 0.01, z + 0.22],
        [-0.65, y + 0.01, z + 0.55],
        [-0.65, y, z + 0.85],
      ],
      radius: 0.012,
      color: 0xd97706,
    },
    {
      points: [
        [0.45, y + 0.01, z + 0.22],
        [0.65, y + 0.01, z + 0.55],
        [0.65, y, z + 0.85],
      ],
      radius: 0.012,
      color: 0x1e293b,
      braided: true,
    },
  ]);
}

function buildLaptopFanImpeller(g, x, y, z, radius = 0.26, housingMat) {
  // Outer scroll housing ring
  torus(g, radius, 0.024, housingMat, [x, y, z], [Math.PI / 2, 0, 0]);
  const fanSpin = new THREE.Group();
  fanSpin.userData.driveAnim = 'fan';
  fanSpin.userData.spinAxis = 'y';
  fanSpin.position.set(x, y, z);
  cyl(fanSpin, radius * 0.34, radius * 0.34, 0.045, 18, chromeMat(), [0, 0, 0]);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    box(
      fanSpin,
      radius * 0.55,
      0.032,
      0.014,
      housingMat,
      [Math.cos(a) * radius * 0.58, 0, Math.sin(a) * radius * 0.58],
      [0.25, -a, 0],
    );
  }
  g.add(fanSpin);
}

// ============================================================================
// LAPTOPS (3 Models)
// ============================================================================
function buildMacBookPro16() {
  const spaceBlack = brushedMetal(0x2d323b, { metalness: 0.88, roughness: 0.22 });
  const silverAlu = brushedMetal(0xcbd5e1);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });
  const pcb = pcbMat('#111827');

  const parts = [
    {
      id: 'cnc-unibody-chassis',
      name: 'CNC-Milled Space Black Unibody Aluminum Enclosure',
      category: 'Structure',
      isOuter: true,
      explodeOffset: [0, -1.35, 0],
      desc: 'Carved from a single solid block of 100% recycled aluminum with an anodized seal that repels fingerprints.',
      funFact: 'Machining the body from one solid slab of metal ("unibody") makes it stiffer and thinner than screwing separate plastic sheets together!',
      build(g) {
        rbox(g, 3.05, 0.14, 2.08, 0.05, spaceBlack, [0, -0.32, 0.12]);
      },
    },
    {
      id: 'mini-led-xdr-lid',
      name: '16.2" Liquid Retina XDR Mini-LED Display Lid',
      category: 'Display',
      isOuter: true,
      explodeOffset: [0, 1.35, -1.15],
      desc: '10,000 tiny Mini-LEDs grouped into 2,500 local dimming zones behind a 3456×2234 ProMotion screen.',
      funFact: 'The screen lid is only 4 millimeters thick yet holds 7 optical diffuser films and a 1080p FaceTime camera in the top notch!',
      build(g) {
        rbox(g, 3.05, 1.98, 0.07, 0.05, spaceBlack, [0, 0.65, -0.92], [-0.24, 0, 0]);
        rbox(g, 2.92, 1.84, 0.02, 0.03, screenMat('ios'), [0, 0.65, -0.88], [-0.24, 0, 0]);
      },
    },
    {
      id: 'magic-keyboard-touchid',
      name: 'Backlit Scissor-Switch Magic Keyboard & Touch ID Ring',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.95, 0.35],
      desc: '78 backlit keys with 1mm scissor-mechanism travel and a sapphire-crystal Touch ID fingerprint ring in the top-right corner.',
      funFact: 'Underneath every single keycap is a tiny X-shaped scissor hinge that keeps the key level even if you press its very edge!',
      build(g) {
        rbox(g, 2.52, 0.03, 1.04, 0.02, mat(0x111827), [0, -0.25, -0.14]);
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 14; c++) {
            box(g, 0.15, 0.02, 0.16, mat(0x1e242b), [-1.14 + c * 0.175, -0.23, -0.54 + r * 0.19]);
          }
        }
      },
    },
    {
      id: 'force-touch-trackpad',
      name: 'Glass Force Touch Haptic Trackpad',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.65, 1.45],
      desc: 'This glass touchpad doesn’t actually hinge downward—four strain-gauge pressure sensors feel your press and an electromagnet clicks sideways!',
      funFact: 'Turn the laptop completely off and press the trackpad: you’ll discover it doesn’t move at all—the "click" is a magnetic illusion!',
      build(g) {
        rbox(g, 1.15, 0.025, 0.72, 0.03, silverAlu, [0, -0.245, 0.74]);
      },
    },
    {
      id: 'm4-max-logic-board',
      name: 'Main Logic Board & Apple M4 Max SoC + Unified Memory',
      category: 'Processor & Memory',
      isOuter: false,
      explodeOffset: [0, 0.45, -0.35],
      desc: 'Houses the 16-core CPU, 40-core GPU, and up to 128GB of Unified Memory soldered millimeters from the processor die!',
      funFact: '"Unified Memory" means the CPU, GPU, and AI Neural Engine all read the exact same super-fast RAM pool without copying files back and forth!',
      build(g) {
        rbox(g, 2.25, 0.035, 0.78, 0.02, pcb, [0, -0.32, -0.36]);
        rbox(g, 0.44, 0.025, 0.44, 0.02, silverAlu, [0, -0.295, -0.36]);
        addLaptopBoardFasteners(g, -0.295, -0.36);
      },
    },
    {
      id: 'dual-impeller-heatpipes',
      name: 'Dual Impeller Blowers & Wide Copper Heatpipes',
      category: 'Thermal Cooling',
      isOuter: false,
      explodeOffset: [0, 0.85, -1.15],
      desc: 'Flat copper heatpipes carry warmth from the M4 Max chip to twin asymmetrical-blade fans that stay whisper-quiet.',
      funFact: 'The fan blades are spaced unevenly on purpose so they never make a single annoying whistle pitch!',
      build(g) {
        rbox(g, 1.48, 0.03, 0.14, 0.01, copper, [0, -0.29, -0.45]);
        for (const x of [-0.72, 0.72]) {
          buildLaptopFanImpeller(g, x, -0.3, -0.48, 0.27, spaceBlack);
        }
      },
    },
    {
      id: 'six-cell-100wh-battery',
      name: '6-Cell 100-Watt-Hour Lithium-Polymer Battery Pack',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.35],
      desc: 'Six black pouch cells arranged under the palm rests deliver up to 24 hours of battery life.',
      funFact: '100 Watt-hours is the exact maximum battery size allowed in carry-on luggage by international airline safety rules (FAA)!',
      build(g) {
        for (let i = -2.5; i <= 2.5; i += 1) {
          rbox(g, 0.42, 0.06, 0.76, 0.02, mat(0x181c22), [i * 0.46, -0.32, 0.66]);
        }
      },
    },
    {
      id: 'force-cancelling-woofers',
      name: '6-Speaker Sound System with Force-Cancelling Woofers',
      category: 'Spatial Audio',
      isOuter: false,
      explodeOffset: [1.85, 0.15, 0.25],
      desc: 'Each side has two bass woofers mounted back-to-back pushing in opposite directions so big bass never rattles the keyboard!',
      funFact: 'When one speaker cone pushes up, its twin pushes down with equal force—canceling out cabinet vibration!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 0.22, 0.055, 1.28, 0.02, spaceBlack, [side * 1.36, -0.31, 0.12]);
        }
      },
    },
    {
      id: 'magsafe-thunderbolt-io',
      name: 'MagSafe 3, 3× Thunderbolt 5, HDMI 2.1 & SDXC Card Ports',
      category: 'Connectivity & I/O',
      isOuter: false,
      explodeOffset: [-1.85, 0.15, -0.25],
      desc: 'Breakaway magnetic MagSafe power port plus 120Gbps Thunderbolt 5 USB-C ports, full-size HDMI, and SD card reader.',
      funFact: 'If someone trips over your charging cord, MagSafe pops off harmlessly instead of yanking your laptop off the desk!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 0.14, 0.05, 0.78, 0.02, copper, [side * 1.44, -0.31, -0.35]);
        }
      },
    },
    {
      id: 'display-clutch-wifi',
      name: 'Display Clutch Hinge & Wi-Fi 6E / Bluetooth Antenna Bar',
      category: 'Wireless & Mechanics',
      isOuter: false,
      explodeOffset: [0, 0.25, -1.65],
      desc: 'Precision torsion spring hinge calibrated so you can lift the screen lid with one single finger without the base lifting up!',
      funFact: 'Because radio waves can’t pass through solid aluminum, the Wi-Fi and Bluetooth antennas hide inside the black plastic hinge vent!',
      build(g) {
        cyl(g, 0.055, 0.055, 2.25, 20, mat(0x111827), [0, -0.25, -0.86], [0, 0, Math.PI / 2]);
      },
    },
  ];

  return {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16" (M4 Max)',
    brand: 'Apple',
    badge: 'M4 Max 40-Core GPU • 100Wh',
    desc: 'Pro workstation laptop milled from Space Black aluminum with a 10,000-Mini-LED XDR screen, M4 Max Unified Memory, and 6-speaker audio.',
    cameraPos: [3.8, 2.5, 3.9],
    parts,
    quiz: [
      {
        q: 'Why can you press anywhere on a MacBook’s glass Force Touch trackpad and feel a click—even though it has no hinge?',
        correctId: 'force-touch-trackpad',
        distractors: ['mini-led-xdr-lid', 'six-cell-100wh-battery', 'cnc-unibody-chassis'],
      },
      {
        q: 'Why is the MacBook Pro’s battery built to hold exactly 100 Watt-hours of energy?',
        correctId: 'six-cell-100wh-battery',
        distractors: ['m4-max-logic-board', 'dual-impeller-heatpipes', 'display-clutch-wifi'],
      },
      {
        q: 'What does "Unified Memory" on the M4 Max Logic Board mean?',
        correctId: 'm4-max-logic-board',
        distractors: ['magic-keyboard-touchid', 'force-cancelling-woofers', 'magsafe-thunderbolt-io'],
      },
      {
        q: 'How do the Force-Cancelling Woofers play deep bass notes without rattling the laptop keyboard?',
        correctId: 'force-cancelling-woofers',
        distractors: ['display-clutch-wifi', 'mini-led-xdr-lid', 'dual-impeller-heatpipes'],
      },
      {
        q: 'What happens if someone accidentally trips over the MagSafe 3 charging cable?',
        correctId: 'magsafe-thunderbolt-io',
        distractors: ['cnc-unibody-chassis', 'magic-keyboard-touchid', 'six-cell-100wh-battery'],
      },
    ],
  };
}

function buildMacBookAir15() {
  const starlightAlu = brushedMetal(0xe5dec9, { metalness: 0.86, roughness: 0.2 });
  const midnightAlu = brushedMetal(0x1e293b);
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });

  const parts = [
    {
      id: 'ultra-thin-unibody',
      name: '11.5mm Ultra-Thin Recycled Aluminum Enclosure',
      category: 'Structure',
      isOuter: true,
      explodeOffset: [0, -1.3, 0],
      desc: 'Razor-thin 11.5-millimeter Starlight aluminum chassis weighing just 3.3 pounds.',
      funFact: 'At less than half an inch thick, MacBook Air is barely thicker than a standard #2 pencil!',
      build(g) {
        rbox(g, 2.95, 0.11, 2.02, 0.04, starlightAlu, [0, -0.3, 0.12]);
      },
    },
    {
      id: 'liquid-retina-lid',
      name: '15.3" Liquid Retina Display & 1080p Camera Notch',
      category: 'Display',
      isOuter: true,
      explodeOffset: [0, 1.3, -1.1],
      desc: '500-nit IPS LCD panel supporting 1 billion colors with microscopic prism light-guide films.',
      funFact: 'Mirrored polarizer sheets inside the screen recycle light so the display stays bright while sipping tiny amounts of battery!',
      build(g) {
        rbox(g, 2.95, 1.9, 0.055, 0.04, starlightAlu, [0, 0.62, -0.88], [-0.24, 0, 0]);
        rbox(g, 2.82, 1.78, 0.02, 0.03, screenMat('ios'), [0, 0.62, -0.85], [-0.24, 0, 0]);
      },
    },
    {
      id: 'fanless-heat-spreader',
      name: 'Silent Fanless Aluminum & Graphite Thermal Spreader',
      category: 'Zero-Noise Cooling',
      isOuter: false,
      explodeOffset: [0, 0.9, -0.95],
      desc: 'MacBook Air has ZERO moving fans! Instead, a wide aluminum and graphite shield spreads heat silently across the metal body.',
      funFact: 'Because there is no fan inside, MacBook Air makes 0.0 decibels of noise and never sucks dust bunnies inside its case!',
      build(g) {
        rbox(g, 1.75, 0.025, 0.56, 0.02, brushedMetal(0x94a3b8), [0, -0.28, -0.36]);
      },
    },
    {
      id: 'm3-compact-logic-board',
      name: 'Compact M3 3nm SoC Logic Board (No Fan Needed)',
      category: 'Processor & Brain',
      isOuter: false,
      explodeOffset: [0, 0.45, -0.35],
      desc: 'Ultra-efficient 3-nanometer M3 chip with 25 billion transistors on a circuit board smaller than a candy bar!',
      funFact: 'The M3 chip uses less electricity than a household LED nightlight during everyday web browsing!',
      build(g) {
        rbox(g, 1.65, 0.03, 0.52, 0.02, pcbMat('#064e3b'), [0, -0.31, -0.36]);
        rbox(g, 0.34, 0.025, 0.34, 0.01, midnightAlu, [0, -0.29, -0.36]);
        addLaptopBoardFasteners(g, -0.29, -0.36);
      },
    },
    {
      id: 'magic-keyboard-air',
      name: 'Full-Height Function Row Magic Keyboard & Touch ID',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.95, 0.35],
      desc: 'Backlit keyboard with ambient light sensors that automatically turn on key illumination in dim rooms.',
      funFact: 'Pressing the Touch ID button locks or unlocks the computer using a secure cryptographic enclave inside the M3 chip!',
      build(g) {
        rbox(g, 2.45, 0.025, 1.0, 0.02, midnightAlu, [0, -0.24, -0.12]);
      },
    },
    {
      id: 'haptic-trackpad-air',
      name: 'Oversized Force Touch Trackpad',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.65, 1.4],
      desc: 'Multi-touch glass surface with Taptic Engine feedback.',
      funFact: 'You can even weigh small objects like an orange on a Force Touch trackpad using pressure-sensor apps!',
      build(g) {
        rbox(g, 1.1, 0.025, 0.68, 0.02, starlightAlu, [0, -0.24, 0.72]);
      },
    },
    {
      id: 'twin-lithium-battery',
      name: '66.5Wh Twin-Pack Lithium-Polymer Battery',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.3],
      desc: 'Fills over 60% of the interior volume to deliver 18 hours of video playback.',
      funFact: 'Because the M3 logic board is so tiny, almost the entire inside of a MacBook Air is pure battery!',
      build(g) {
        for (const x of [-0.68, 0, 0.68]) {
          rbox(g, 0.62, 0.05, 0.78, 0.02, midnightAlu, [x, -0.31, 0.64]);
        }
      },
    },
    {
      id: 'hinge-bounced-speakers',
      name: '6-Speaker Hidden Hinge-Bounce Audio Array',
      category: 'Audio',
      isOuter: false,
      explodeOffset: [1.75, 0.15, 0],
      desc: 'Look at the top of a MacBook Air: there are NO speaker holes next to the keyboard! Sound fires out of the hinge and bounces off the glass screen toward your ears!',
      funFact: 'Hiding the speaker grilles inside the display hinge keeps crumbs out and makes the aluminum palm rest completely seamless!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 0.24, 0.045, 0.95, 0.02, midnightAlu, [side * 1.25, -0.3, -0.1]);
        }
      },
    },
    {
      id: 'magsafe-thunderbolt-air',
      name: 'MagSafe 3, Dual Thunderbolt / USB4 & High-Impedance Audio Jack',
      category: 'Connectivity & I/O',
      isOuter: false,
      explodeOffset: [-1.75, 0.15, -0.2],
      desc: 'Modular daughterboards for MagSafe 3 charging and two 40Gbps Thunderbolt ports.',
      funFact: ' Apple puts the charging ports on tiny replaceable circuit cards so if a port wears out, you don’t have to replace the main logic board!',
      build(g) {
        rbox(g, 0.14, 0.045, 0.56, 0.02, copper, [-1.38, -0.3, -0.35]);
        rbox(g, 0.14, 0.045, 0.32, 0.02, copper, [1.38, -0.3, -0.35]);
      },
    },
    {
      id: 'lid-angle-sensor-magnets',
      name: 'Hall-Effect Lid Angle Sensor & Sleep Magnets',
      category: 'Sensors',
      isOuter: false,
      explodeOffset: [0, 0.25, -1.6],
      desc: 'Measures the exact angle of the screen lid so the laptop wakes up the instant you lift the cover!',
      funFact: 'A tiny magnetic sensor detects when the lid closes and immediately disconnects the microphone in hardware so nobody can eavesdrop!',
      build(g) {
        cyl(g, 0.045, 0.045, 2.1, 16, midnightAlu, [0, -0.24, -0.82], [0, 0, Math.PI / 2]);
      },
    },
  ];

  return {
    id: 'macbook-air-15',
    name: 'MacBook Air 15" (M3 Fanless)',
    brand: 'Apple',
    badge: '11.5mm Thin • 0 dB Fanless Cooling',
    desc: 'Ultra-thin 15-inch laptop with a 100% silent fanless aluminum heat spreader, hidden hinge-bounced 6-speaker audio, and 18-hour battery.',
    cameraPos: [3.8, 2.5, 3.9],
    parts,
    quiz: [
      {
        q: 'How does the MacBook Air stay cool without making any fan noise at all?',
        correctId: 'fanless-heat-spreader',
        distractors: ['liquid-retina-lid', 'haptic-trackpad-air', 'twin-lithium-battery'],
      },
      {
        q: 'Since there are no speaker holes next to the keyboard on MacBook Air, how does sound reach your ears?',
        correctId: 'hinge-bounced-speakers',
        distractors: ['magsafe-thunderbolt-air', 'ultra-thin-unibody', 'm3-compact-logic-board'],
      },
      {
        q: 'What security feature happens automatically in hardware the moment the Hall-Effect sensor detects the laptop lid closing?',
        correctId: 'lid-angle-sensor-magnets',
        distractors: ['magic-keyboard-air', 'twin-lithium-battery', 'fanless-heat-spreader'],
      },
      {
        q: 'Why are the MagSafe and USB-C ports mounted on their own tiny modular circuit cards?',
        correctId: 'magsafe-thunderbolt-air',
        distractors: ['liquid-retina-lid', 'haptic-trackpad-air', 'hinge-bounced-speakers'],
      },
      {
        q: 'Which part takes up over 60% of the inside of the MacBook Air to give it 18 hours of runtime?',
        correctId: 'twin-lithium-battery',
        distractors: ['m3-compact-logic-board', 'magic-keyboard-air', 'lid-angle-sensor-magnets'],
      },
    ],
  };
}

function buildGamingLaptopRTX() {
  const anodizedBlack = brushedMetal(0x181b22, { metalness: 0.85, roughness: 0.25 });
  const copper = mat(0xd97724, { metalness: 0.9, roughness: 0.16 });
  const rgbNeon = emissiveMat(0x00f5d4, 1.35);
  const rgbMagenta = emissiveMat(0xf72585, 1.35);

  const parts = [
    {
      id: 'cnc-gaming-chassis',
      name: 'Anodized Aluminum Gaming Chassis & RGB Underglow Bar',
      category: 'Structure & RGB',
      isOuter: true,
      explodeOffset: [0, -1.4, 0],
      desc: 'Vented aluminum base with rear jet-inspired exhaust diffusers and a customizable Aura/Chroma RGB front lightbar.',
      funFact: 'Gaming laptops draw up to 330 watts of power—so the bottom plate has laser-cut intake grilles directly under the fans!',
      build(g) {
        rbox(g, 3.12, 0.17, 2.16, 0.04, anodizedBlack, [0, -0.33, 0.12]);
        box(g, 2.85, 0.04, 0.05, rgbNeon, [0, -0.34, 1.2]);
      },
    },
    {
      id: '240hz-oled-lid',
      name: '240Hz G-Sync OLED Gaming Display & Slash-LED Lid',
      category: 'High-Refresh Display',
      isOuter: true,
      explodeOffset: [0, 1.4, -1.15],
      desc: '240-frames-per-second OLED panel with a 0.2-millisecond response time so fast-moving esports games look crystal sharp.',
      funFact: '240Hz means the screen redraws the entire picture 240 times every single second—four times faster than a standard TV!',
      build(g) {
        rbox(g, 3.12, 2.02, 0.075, 0.04, anodizedBlack, [0, 0.66, -0.94], [-0.24, 0, 0]);
        rbox(g, 2.98, 1.88, 0.02, 0.02, screenMat('samsung'), [0, 0.66, -0.9], [-0.24, 0, 0]);
        box(g, 1.85, 0.04, 0.02, rgbMagenta, [0, 0.66, -0.98], [-0.24, 0, 0.55]);
      },
    },
    {
      id: 'full-vapor-chamber-quad-fins',
      name: 'Full-Coverage Copper Vapor Chamber, Liquid Metal & 4 Fin Stacks',
      category: 'Extreme Thermal Cooling',
      isOuter: false,
      explodeOffset: [0, 1.05, -0.85],
      desc: 'Massive copper vapor chamber painted with liquid-metal thermal compound (gallium-indium) and 4 copper radiator fin stacks on the back and sides.',
      funFact: 'Instead of ordinary thermal paste, liquid metal conducts heat 10 times faster from the GPU die into the copper chamber!',
      build(g) {
        rbox(g, 2.35, 0.035, 0.78, 0.02, copper, [0, -0.29, -0.38]);
        for (const x of [-1.05, -0.45, 0.45, 1.05]) {
          box(g, 0.42, 0.07, 0.16, copper, [x, -0.3, -0.84]);
        }
      },
    },
    {
      id: 'tri-fan-arc-flow',
      name: '84-Blade Arc-Flow Dual/Tri-Fan Blowers',
      category: 'Active Airflow',
      isOuter: false,
      explodeOffset: [0, 0.75, -1.35],
      desc: 'Ultra-thin liquid-crystal-polymer fan blades (0.1mm thick!) pump high-velocity air through 316 ultra-thin copper fins.',
      funFact: 'Built-in anti-dust tunnels use centrifugal force to fling dust particles out the side vents before they can clog the radiator fins!',
      build(g) {
        for (const x of [-0.88, 0, 0.88]) {
          buildLaptopFanImpeller(g, x, -0.3, -0.42, 0.27, anodizedBlack);
          torus(g, 0.26, 0.02, rgbNeon, [x, -0.3, -0.42], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'rtx-gpu-cpu-motherboard',
      name: 'Discrete NVIDIA GeForce RTX 4090 GPU + Core i9 Motherboard',
      category: 'Graphics & CPU',
      isOuter: false,
      explodeOffset: [0, 0.45, -0.35],
      desc: 'Houses both a 24-core processor AND a dedicated GeForce RTX graphics processor surrounded by 16GB of GDDR6X video memory chips!',
      funFact: 'A hardware "MUX Switch" chip lets the RTX GPU wire itself directly to the display, bypassing the CPU to boost frame rates!',
      build(g) {
        rbox(g, 2.55, 0.035, 0.92, 0.02, pcbMat('#111827'), [0, -0.33, -0.36]);
        rbox(g, 0.42, 0.025, 0.42, 0.01, chromeMat(), [-0.42, -0.305, -0.36]);
        rbox(g, 0.36, 0.025, 0.36, 0.01, chromeMat(), [0.42, -0.305, -0.36]);
        addLaptopBoardFasteners(g, -0.305, -0.36);
      },
    },
    {
      id: 'upgradeable-nvme-ram',
      name: 'Dual Upgradeable PCIe Gen5 NVMe SSDs & DDR5 SO-DIMM RAM Slots',
      category: 'Upgradeable Storage & RAM',
      isOuter: false,
      explodeOffset: [1.65, 0.35, 0.25],
      desc: 'Two M.2 solid-state drive sticks (reading 14,000 MB/s in RAID 0!) plus two snap-in DDR5 memory sticks you can upgrade yourself with a screwdriver!',
      funFact: 'Unlike soldered phones, gaming laptops let you pop open the bottom and snap in bigger SSD storage sticks whenever you want!',
      build(g) {
        const greenPcb = pcbMat('#0b5d3b');
        // 2 M.2 2280 NVMe SSD sticks
        rbox(g, 0.22, 0.025, 0.72, 0.01, greenPcb, [-0.95, -0.31, 0.22]);
        rbox(g, 0.22, 0.025, 0.72, 0.01, greenPcb, [0.95, -0.31, 0.22]);
        // 2 DDR5 SO-DIMM sticks
        rbox(g, 0.62, 0.03, 0.28, 0.01, greenPcb, [0, -0.31, 0.12]);
        rbox(g, 0.62, 0.03, 0.28, 0.01, greenPcb, [0, -0.31, 0.44]);
      },
    },
    {
      id: 'per-key-rgb-keyboard',
      name: 'Per-Key RGB Optical-Mechanical Gaming Keyboard',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.95, 0.45],
      desc: 'Each key has its own individual RGB LED and uses an infrared light beam switch to register keystrokes in 0.2 milliseconds!',
      funFact: 'Highlighted WASD keys have clear caps so gamers can find their movement keys in the dark by peripheral vision!',
      build(g) {
        rbox(g, 2.65, 0.03, 1.04, 0.02, anodizedBlack, [0, -0.24, -0.1]);
        box(g, 2.58, 0.015, 0.98, rgbMagenta, [0, -0.245, -0.1]);
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 14; c++) {
            const isWASD = r === 2 && c >= 1 && c <= 3;
            box(g, 0.15, 0.025, 0.16, isWASD ? rgbNeon : anodizedBlack, [-1.18 + c * 0.18, -0.22, -0.5 + r * 0.19]);
          }
        }
      },
    },
    {
      id: '90wh-battery-pack',
      name: '90Wh 4-Cell Fast-Charge Gaming Battery',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.35],
      desc: '4-cell lithium battery along the front edge.',
      funFact: 'Smart battery software caps charging at 80% when plugged into a desk monitor all week so the battery stays healthy for years!',
      build(g) {
        rbox(g, 2.38, 0.065, 0.58, 0.02, anodizedBlack, [0, -0.33, 0.76]);
      },
    },
    {
      id: 'glass-numpad-trackpad',
      name: 'Precision Glass Trackpad with LED NumberPad',
      category: 'Input Controls',
      isOuter: false,
      explodeOffset: [0, 0.65, 1.45],
      desc: 'Tap the corner icon and a glowing LED calculator number-pad lights up right inside the glass touchpad!',
      funFact: 'Capacitive palm-rejection ignores your wrists while you type on the WASD keys!',
      build(g) {
        rbox(g, 1.05, 0.025, 0.65, 0.02, anodizedBlack, [0, -0.24, 0.76]);
      },
    },
    {
      id: 'rj45-ethernet-io',
      name: '2.5G LAN Ethernet, HDMI 2.1, USB-A & 330W Power Ports',
      category: 'Connectivity & I/O',
      isOuter: false,
      explodeOffset: [-1.85, 0.15, -0.25],
      desc: 'Includes a physical RJ-45 Ethernet jack for zero-lag wired gaming plus high-current DC power input.',
      funFact: 'Competitive esports pros use wired Ethernet cables because radio Wi-Fi packets can get delayed by microwave ovens or neighbors!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 0.16, 0.06, 0.85, 0.02, copper, [side * 1.44, -0.32, -0.25]);
        }
      },
    },
  ];

  return {
    id: 'gaming-laptop-rtx',
    name: 'RTX 4090 Vapor-Chamber Gaming Laptop',
    brand: 'ROG / Razer',
    badge: 'RTX 4090 GPU • 240Hz OLED • Per-Key RGB',
    desc: 'High-refresh 240Hz OLED gaming powerhouse with discrete RTX 4090 graphics, full-coverage copper vapor chamber, and upgradeable NVMe SSDs.',
    cameraPos: [3.8, 2.5, 3.9],
    parts,
    quiz: [
      {
        q: 'Why does a high-end gaming laptop use a giant Copper Vapor Chamber, liquid metal, and 4 fin stacks?',
        correctId: 'full-vapor-chamber-quad-fins',
        distractors: ['glass-numpad-trackpad', '90wh-battery-pack', '240hz-oled-lid'],
      },
      {
        q: 'Which snap-in parts inside a gaming laptop can you easily upgrade yourself with a screwdriver when you want more game storage or memory?',
        correctId: 'upgradeable-nvme-ram',
        distractors: ['cnc-gaming-chassis', 'per-key-rgb-keyboard', 'tri-fan-arc-flow'],
      },
      {
        q: 'What does "240Hz" mean on the gaming laptop’s OLED display lid?',
        correctId: '240hz-oled-lid',
        distractors: ['rj45-ethernet-io', '90wh-battery-pack', 'glass-numpad-trackpad'],
      },
      {
        q: 'How do the Arc-Flow cooling fans keep dust bunnies from clogging the copper radiator fins?',
        correctId: 'tri-fan-arc-flow',
        distractors: ['per-key-rgb-keyboard', 'upgradeable-nvme-ram', 'glass-numpad-trackpad'],
      },
      {
        q: 'Which chip on the motherboard is dedicated specifically to rendering 3D polygons, lighting, and ray-tracing in video games?',
        correctId: 'rtx-gpu-cpu-motherboard',
        distractors: ['90wh-battery-pack', 'cnc-gaming-chassis', 'rj45-ethernet-io'],
      },
    ],
  };
}

export const LAPTOP_MODELS = [
  buildMacBookPro16(),
  buildMacBookAir15(),
  buildGamingLaptopRTX(),
];

// ============================================================================
// HOUSES & ARCHITECTURE (3 Homes)
// ============================================================================
function buildModernEcoSmartHome() {
  const concrete = mat(0x94a3b8, { roughness: 0.82, metalness: 0.06 });
  const darkSlate = mat(0x334155, { roughness: 0.48, metalness: 0.22 });
  const pineWood = mat(0xd99b52, { roughness: 0.62, metalness: 0.05 });
  const cedarSiding = mat(0xb45309, { roughness: 0.55, metalness: 0.06 });
  const warmStucco = mat(0xf8fafc, { roughness: 0.52 });
  const matteBlackAlu = brushedMetal(0x1e293b, { metalness: 0.82, roughness: 0.28 });
  const pinkBatt = mat(0xf472b6, { roughness: 0.88 });
  const lawnGreen = mat(0x15803d, { roughness: 0.85 });
  const solarMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: solarGridTexture(),
    metalness: 0.45,
    roughness: 0.14,
    clearcoat: 0.92,
  });
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: brickWallTexture(),
    roughness: 0.72,
  });

  const parts = [
    {
      id: 'concrete-slab-footings',
      name: 'Reinforced Concrete Foundation Plinth, Driveway Apron & Rebar Footings',
      category: 'Foundation',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Steel-rebar-reinforced concrete slab with perimeter frost footings, gravel French-drain perimeter, paved EV driveway apron, and landscaped stone entry terrace.',
      funFact: 'Concrete is super strong when squished ("compression"), and steel rebar rods inside give it strength when stretched ("tension")!',
      build(g) {
        // Landscaped site plinth + main concrete foundation slab + EV garage driveway apron & entry stone steps
        rbox(g, 4.35, 0.14, 3.15, 0.03, lawnGreen, [0.15, -0.96, 0.08]);
        rbox(g, 3.95, 0.22, 2.55, 0.03, concrete, [0.18, -0.86, 0]);
        rbox(g, 2.85, 0.06, 2.25, 0.015, mat(0x64748b), [-0.25, -0.74, 0]);
        // Garage concrete floor & front paved driveway apron + front entry flagstone steps
        rbox(g, 1.15, 0.06, 2.05, 0.015, mat(0x64748b), [1.45, -0.74, -0.05]);
        rbox(g, 1.08, 0.04, 0.75, 0.01, mat(0xcbd5e1), [1.45, -0.88, 1.25]);
        for (let st = 0; st < 3; st++) {
          rbox(g, 0.78, 0.05, 0.24, 0.01, mat(0xe2e8f0), [-0.15, -0.86 + st * 0.04, 1.42 - st * 0.18]);
        }
        // Exposed steel rebar grid & zinc sill-plate anchor bolts
        for (let rx = -1.4; rx <= 0.8; rx += 0.44) {
          cyl(g, 0.010, 0.010, 2.1, 8, brushedMetal(0x78350f), [rx, -0.72, 0], [Math.PI / 2, 0, 0]);
        }
        buildHexBoltArray(
          g,
          [
            [-1.55, -0.71, 1.06],
            [-0.25, -0.71, 1.06],
            [0.82, -0.71, 1.06],
            [1.92, -0.71, 0.92],
            [-1.55, -0.71, -1.06],
            [0.82, -0.71, -1.06],
          ],
          { radius: 0.022, height: 0.038, finish: 'zinc' },
        );
      },
    },
    {
      id: 'timber-stud-framing',
      name: '2×6 Dimensional Lumber Wall Studs, Floor Joists & Roof A-Trusses',
      category: 'Structural Skeleton',
      isOuter: false,
      explodeOffset: [-1.45, 0.15, 0],
      desc: 'Kiln-dried 2×6 Douglas fir vertical studs spaced 16 inches on center with double top plates, window headers, 2nd-story I-joist floor deck, and engineered triangular roof trusses.',
      funFact: 'Why are house studs always spaced 16 inches apart? So 4-foot-wide (48-inch) sheets of drywall and plywood land squarely on every third stud!',
      build(g) {
        // 1st-floor & 2nd-floor subfloor rim joists and 16"-on-center floor joists
        box(g, 2.52, 0.07, 2.12, pineWood, [-0.25, -0.02, 0]);
        for (let x = -1.45; x <= 0.85; x += 0.23) {
          box(g, 0.036, 0.11, 2.08, pineWood, [x, -0.04, 0]);
          // Back wall & side wall vertical 2x6 studs
          box(g, 0.036, 1.48, 0.065, pineWood, [x, 0.02, -1.03]);
        }
        for (let z = -0.95; z <= 0.95; z += 0.24) {
          box(g, 0.065, 1.48, 0.036, pineWood, [-1.48, 0.02, z]);
          box(g, 0.065, 1.48, 0.036, pineWood, [0.98, 0.02, z]);
        }
        // Top & bottom wall plates + 6 triangular engineered roof trusses in the attic
        box(g, 2.52, 0.045, 0.08, pineWood, [-0.25, 0.75, -1.03]);
        box(g, 2.52, 0.045, 0.08, pineWood, [-0.25, 0.75, 1.03]);
        for (let tx = -1.38; tx <= 0.88; tx += 0.45) {
          tube(g, [[tx, 0.76, -1.06], [tx, 1.42, 0], [tx, 0.76, 1.06]], 0.022, pineWood);
          box(g, 0.03, 0.04, 2.10, pineWood, [tx, 0.77, 0]);
        }
      },
    },
    {
      id: 'exterior-walls-insulation',
      name: 'Architectural Brick, Cedar Rain-Screen Siding, Closed Gable Ends & Insulation',
      category: 'Building Envelope',
      isOuter: true,
      explodeOffset: [0, 0, -2.05],
      desc: 'Masonry brick first-floor walls, warm western red cedar upper siding, closed triangular gable end walls, attached EV garage wing, and R-21 fiberglass thermal insulation batts.',
      funFact: 'Pink fiberglass insulation works just like a puffy winter jacket—trapping millions of tiny still air pockets inside spun glass fibers!',
      build(g) {
        // Main 2-story rear wall & left/right end walls (brick lower level + cedar/stucco upper level)
        box(g, 2.62, 0.74, 0.10, brickMat, [-0.25, -0.35, -1.10]);
        box(g, 2.62, 0.76, 0.10, cedarSiding, [-0.25, 0.39, -1.10]);
        box(g, 0.10, 0.74, 2.22, brickMat, [-1.52, -0.35, 0]);
        box(g, 0.10, 0.76, 2.22, warmStucco, [-1.52, 0.39, 0]);
        box(g, 0.10, 0.76, 2.22, warmStucco, [1.02, 0.39, 0]);
        // Closed Triangular Gable End Walls (Left x = -1.52 & Right x = +1.02) so the attic is completely enclosed!
        const gableTriPts = [[-1.12, 0.76], [0, 1.45], [1.12, 0.76]];
        extrudeProfile(g, gableTriPts, 0.09, cedarSiding, [-1.52, 0, 0], [0, Math.PI / 2, 0], 0.008);
        extrudeProfile(g, gableTriPts, 0.09, cedarSiding, [1.02, 0, 0], [0, Math.PI / 2, 0], 0.008);
        // Pink R-21 fiberglass insulation batts visible on interior side of rear wall
        for (let ix = -1.30; ix <= 0.80; ix += 0.35) {
          rbox(g, 0.26, 0.62, 0.04, 0.008, pinkBatt, [ix, 0.38, -1.03]);
        }
        // Attached Single-Story Side EV Garage Wing (x = 1.02..2.02) with rooftop wooden deck terrace & glass railing
        box(g, 1.02, 0.78, 0.09, brickMat, [1.52, -0.33, -1.02]);
        box(g, 0.09, 0.78, 2.02, brickMat, [2.00, -0.33, -0.02]);
        rbox(g, 1.06, 0.06, 2.08, 0.01, cedarSiding, [1.52, 0.08, -0.02]);
        // Rooftop terrace glass balustrade around garage roof deck
        box(g, 1.02, 0.22, 0.02, glassMat(0x7dd3fc, 0.45), [1.52, 0.21, 0.98]);
        box(g, 0.02, 0.22, 2.00, glassMat(0x7dd3fc, 0.45), [2.00, 0.21, -0.02]);
      },
    },
    {
      id: 'front-facade-windows',
      name: 'Low-E Argon Casement Windows, Covered Entry Porch & EV Garage Door',
      category: 'Windows & Doors',
      isOuter: true,
      explodeOffset: [0, 0, 2.05],
      desc: 'Architectural front facade featuring black-anodized mullion casement windows filled with Argon gas, a timber-canopy front porch with smart lock oak door, 2nd-story Juliet balcony, and sectional frosted-glass EV garage door.',
      funFact: 'Argon gas is denser than air, so sealing it between two Low-E glass window panes slows down heat transfer by 30%!',
      build(g) {
        // Main 2-story front facade wall + cedar accent band between floors
        box(g, 2.62, 0.74, 0.09, warmStucco, [-0.25, -0.35, 1.10]);
        box(g, 2.62, 0.76, 0.09, warmStucco, [-0.25, 0.39, 1.10]);
        box(g, 2.66, 0.10, 0.12, cedarSiding, [-0.25, 0.02, 1.11]);
        // Covered Front Entry Porch Canopy, Timber Columns, Smart Entry Door & Warm Porch Sconces
        rbox(g, 0.86, 0.06, 0.46, 0.01, matteBlackAlu, [-0.15, -0.02, 1.32]);
        for (const px of [-0.52, 0.22]) {
          box(g, 0.055, 0.72, 0.055, cedarSiding, [px, -0.38, 1.50]);
        }
        rbox(g, 0.36, 0.66, 0.12, 0.01, cedarSiding, [-0.15, -0.39, 1.12]);
        box(g, 0.08, 0.52, 0.13, glassMat(0xbae6fd, 0.6), [-0.24, -0.39, 1.13]);
        sphere(g, 0.032, 10, 10, emissiveMat(0xfef08a, 2.0), [0.12, -0.22, 1.16]);

        // Framed Multi-Pane Black-Mullion Casement Windows (Left & Right Bays, 1st & 2nd Floors)
        for (const wx of [-0.98, 0.54]) {
          for (const wy of [-0.34, 0.40]) {
            rbox(g, 0.64, 0.44, 0.13, 0.01, matteBlackAlu, [wx, wy, 1.11]);
            box(g, 0.58, 0.38, 0.14, glassMat(0x38bdf8, 0.55), [wx, wy, 1.115]);
            // Window center mullion + horizontal transom bar + stone sill
            box(g, 0.022, 0.38, 0.15, matteBlackAlu, [wx, wy, 1.12]);
            box(g, 0.58, 0.018, 0.15, matteBlackAlu, [wx, wy + 0.08, 1.12]);
            box(g, 0.68, 0.028, 0.16, concrete, [wx, wy - 0.22, 1.13]);
          }
        }
        // 2nd-Floor Center French Window & Glass Juliet Balcony above front porch
        rbox(g, 0.48, 0.54, 0.12, 0.01, matteBlackAlu, [-0.15, 0.36, 1.11]);
        box(g, 0.42, 0.48, 0.13, glassMat(0x38bdf8, 0.55), [-0.15, 0.36, 1.115]);
        rbox(g, 0.68, 0.04, 0.26, 0.008, matteBlackAlu, [-0.15, 0.08, 1.24]);
        box(g, 0.66, 0.20, 0.018, glassMat(0xbae6fd, 0.45), [-0.15, 0.20, 1.35]);

        // Side EV Garage Front Facade & 4-Panel Sectional Aluminum/Frosted-Glass Garage Door
        box(g, 1.02, 0.78, 0.09, warmStucco, [1.52, -0.33, 0.98]);
        rbox(g, 0.82, 0.62, 0.11, 0.01, matteBlackAlu, [1.52, -0.40, 0.99]);
        for (let p = 0; p < 4; p++) {
          const py = -0.62 + p * 0.145;
          for (let c = -1; c <= 1; c++) {
            box(g, 0.23, 0.11, 0.12, glassMat(0xe0f2fe, 0.68), [1.52 + c * 0.25, py, 1.00]);
          }
        }
      },
    },
    {
      id: 'gable-roof-trusses',
      name: 'Standing-Seam Architectural Slate Gable Roof, Gutters & Chimney',
      category: 'Roofing',
      isOuter: true,
      explodeOffset: [0, 1.85, 0],
      desc: '30-degree pitched standing-seam slate roof with ridge ventilation cap, overhanging eaves, aluminum rain gutters with downspouts, tempered glass attic skylight, and stone chimney stack.',
      funFact: 'Shingles and standing seams are laid from the bottom up so rainwater always runs downhill into the gutters without sneaking under a seam!',
      build(g) {
        // Front & rear pitched roof slopes meeting cleanly at the ridge cap (y = 1.46, z = 0)
        box(g, 2.84, 0.08, 1.42, darkSlate, [-0.25, 1.09, 0.58], [0.54, 0, 0]);
        box(g, 2.84, 0.08, 1.42, darkSlate, [-0.25, 1.09, -0.58], [-0.54, 0, 0]);
        // Standing seam ribs along both roof slopes + vented ridge cap
        rbox(g, 2.86, 0.055, 0.12, 0.015, matteBlackAlu, [-0.25, 1.46, 0]);
        for (let sx = -1.55; sx <= 1.05; sx += 0.26) {
          box(g, 0.018, 0.025, 1.38, matteBlackAlu, [sx, 1.13, 0.58], [0.54, 0, 0]);
          box(g, 0.018, 0.025, 1.38, matteBlackAlu, [sx, 1.13, -0.58], [-0.54, 0, 0]);
        }
        // Horizontal rain gutters at front & rear eaves + corner vertical downspouts + stone chimney stack
        for (const sz of [-1.18, 1.18]) {
          box(g, 2.86, 0.035, 0.035, matteBlackAlu, [-0.25, 0.72, sz]);
          cyl(g, 0.016, 0.016, 1.45, 10, matteBlackAlu, [-1.56, 0.0, sz * 0.94]);
        }
        rbox(g, 0.28, 0.62, 0.28, 0.01, brickMat, [-1.18, 1.38, -0.52]);
        rbox(g, 0.32, 0.04, 0.32, 0.008, concrete, [-1.18, 1.70, -0.52]);
      },
    },
    {
      id: 'solar-array-powerwall',
      name: '12-Panel Monocrystalline Solar PV Array, Dual Powerwalls & EV Charger',
      category: 'Clean Energy',
      isOuter: false,
      explodeOffset: [1.35, 2.15, 0.95],
      desc: 'Twelve framed monocrystalline silicon solar panels mounted on the south roof slope, feeding dual 13.5-kWh garage Powerwall home batteries and a 48-Amp Level-2 EV Wall Connector.',
      funFact: 'When photons of sunlight hit silicon crystals on the roof, they knock electrons loose to create silent, zero-pollution electricity!',
      build(g) {
        // 12 individual aluminum-framed solar panels (2 rows x 6 columns) on front roof slope
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 6; c++) {
            const px = -1.28 + c * 0.41;
            const py = 1.26 - r * 0.27;
            const pz = 0.36 + r * 0.44;
            rbox(g, 0.38, 0.028, 0.40, 0.006, matteBlackAlu, [px, py, pz], [0.54, 0, 0]);
            rbox(g, 0.35, 0.032, 0.37, 0.004, solarMat, [px, py + 0.004, pz], [0.54, 0, 0]);
          }
        }
        // Dual Garage Powerwall Home Batteries + Solar Inverter + Level-2 EV Wall Charger with glowing status bars
        for (const bz of [-0.42, 0.02]) {
          rbox(g, 0.09, 0.44, 0.28, 0.015, carPaint(0xf8fafc), [1.92, -0.36, bz]);
          box(g, 0.10, 0.36, 0.02, emissiveMat(0x22c55e, 1.5), [1.91, -0.36, bz + 0.11]);
        }
        rbox(g, 0.08, 0.22, 0.16, 0.015, carPaint(0x0f172a), [1.92, -0.34, 0.42]);
        torus(g, 0.075, 0.012, mat(0x1e293b), [1.90, -0.42, 0.42], [0, Math.PI / 2, 0]);
      },
    },
    {
      id: 'pex-plumbing-waterheater',
      name: 'Hot/Cold PEX Manifold Plumbing, Heat-Pump Water Heater & Upstairs Bath',
      category: 'Plumbing & Water',
      isOuter: false,
      explodeOffset: [-1.65, -0.25, -1.25],
      desc: 'Color-coded red (hot) and blue (cold) PEX water lines, hybrid heat-pump water heater tank, white PVC drain-waste-vent stack, and upstairs bathroom fixtures (tub, vanity sink & siphon toilet).',
      funFact: 'Every sink has a curved U-shaped pipe underneath called a "P-trap" that holds a plug of water to block sewer smells!',
      build(g) {
        // Heat-pump water heater cylinder + expansion tank in utility room
        cyl(g, 0.16, 0.16, 0.58, 20, carPaint(0xf8fafc), [-1.18, -0.44, -0.72]);
        cyl(g, 0.07, 0.07, 0.18, 14, carPaint(0x2563eb), [-1.18, -0.06, -0.72]);
        // Red hot-water & Blue cold-water PEX risers + White PVC vertical vent stack
        cyl(g, 0.022, 0.022, 1.42, 12, mat(0xef4444), [-0.95, 0.0, -0.82]);
        cyl(g, 0.022, 0.022, 1.42, 12, mat(0x2563eb), [-0.86, 0.0, -0.82]);
        cyl(g, 0.036, 0.036, 1.85, 14, warmStucco, [-0.74, 0.18, -0.86]);
        // 2nd-Floor Bathroom Fixtures: Freestanding Porcelain Soaking Tub, Vanity Sink & Toilet
        rbox(g, 0.56, 0.22, 0.30, 0.04, carPaint(0xffffff), [-1.05, 0.14, -0.58]);
        rbox(g, 0.48, 0.16, 0.22, 0.03, glassMat(0x38bdf8, 0.65), [-1.05, 0.19, -0.58]);
        rbox(g, 0.18, 0.24, 0.22, 0.02, carPaint(0xffffff), [-0.52, 0.14, -0.68]);
      },
    },
    {
      id: 'electrical-breaker-wiring',
      name: '200-Amp Smart Breaker Panel, Romex Copper Wiring & Recessed LEDs',
      category: 'Electrical Grid',
      isOuter: false,
      explodeOffset: [1.75, 0.25, -1.15],
      desc: '200-Amp main service panel with whole-home surge protection, yellow 12-AWG Romex and orange 10-AWG 240V copper wiring harnesses, and glowing recessed ceiling downlights.',
      funFact: 'Circuit breakers are safety superheroes: they cut power in a fraction of a second before an overloaded wire can get hot!',
      build(g) {
        rbox(g, 0.09, 0.42, 0.30, 0.015, brushedMetal(0x475569), [0.94, -0.32, -0.65]);
        buildWiringHarness(g, [
          {
            points: [
              [0.94, -0.32, -0.65],
              [0.94, 0.68, -0.65],
              [-1.25, 0.68, -0.65],
            ],
            radius: 0.016,
            color: 0xfacc15,
          },
          {
            points: [
              [0.94, -0.40, -0.55],
              [1.88, -0.40, -0.22],
              [1.88, -0.36, 0.40],
            ],
            radius: 0.018,
            color: 0xf97316,
            braided: true,
          },
        ]);
        // Warm recessed LED ceiling lights across 1st and 2nd stories
        for (const lx of [-1.0, -0.25, 0.45]) {
          for (const ly of [-0.06, 0.72]) {
            cyl(g, 0.055, 0.055, 0.015, 14, emissiveMat(0xfef08a, 1.6), [lx, ly, 0.15]);
          }
        }
      },
    },
    {
      id: 'hvac-heatpump-ducts',
      name: 'Inverter Heat-Pump Condenser, Air Handler & Galvanized Supply Ducts',
      category: 'Climate Control',
      isOuter: false,
      explodeOffset: [1.65, -0.55, 1.25],
      desc: 'Outdoor dual-impeller heat-pump condenser unit, indoor HEPA air handler, and insulated galvanized sheet-metal supply and return ducts with room registers.',
      funFact: 'A modern heat pump is simply an air conditioner that can run in reverse—moving heat *into* the house even from chilly outdoor air!',
      build(g) {
        const galv = brushedMetal(0xcbd5e1);
        // Outdoor side-yard Heat Pump Condenser with spinning top fan impeller
        rbox(g, 0.38, 0.46, 0.38, 0.02, galv, [-1.78, -0.50, -0.45]);
        buildLaptopFanImpeller(g, -1.78, -0.26, -0.45, 0.15, matteBlackAlu);
        // Indoor vertical supply plenum & horizontal ceiling trunk ducts
        box(g, 0.16, 1.32, 0.16, galv, [0.68, 0.04, -0.45]);
        box(g, 1.95, 0.13, 0.16, galv, [-0.22, 0.64, -0.45]);
        box(g, 1.65, 0.12, 0.15, galv, [-0.15, -0.10, -0.45]);
      },
    },
    {
      id: 'stairs-kitchen-interior',
      name: 'Oak Staircase, Waterfall Kitchen Island, Living Room & Master Suite',
      category: 'Interior Living',
      isOuter: false,
      explodeOffset: [0, 0.65, 1.45],
      desc: 'Open-concept first floor with a waterfall-quartz kitchen island, barstools, stainless appliances, L-shaped living room sofa & media wall, plus an oak-and-glass staircase leading to the upstairs master bedroom.',
      funFact: 'Building codes require every single stair step in a staircase to be the exact same height within 3/8 of an inch so your feet never trip!',
      build(g) {
        // 1. Oak Staircase with glass balustrade rising from 1st floor (-0.70) to 2nd floor (+0.02)
        for (let i = 0; i < 8; i++) {
          box(g, 0.32, 0.04, 0.13, pineWood, [0.05, -0.66 + i * 0.088, -0.45 + i * 0.11]);
        }
        box(g, 0.02, 0.34, 0.88, glassMat(0xbae6fd, 0.42), [-0.11, -0.22, -0.05], [0.66, 0, 0]);
        // 2. Gourmet Kitchen: Teal cabinets, white quartz waterfall island, 3 barstools & stainless refrigerator
        rbox(g, 0.78, 0.26, 0.36, 0.015, carPaint(0x0d9488), [-0.88, -0.58, 0.38]);
        rbox(g, 0.82, 0.035, 0.40, 0.008, warmStucco, [-0.88, -0.44, 0.38]);
        rbox(g, 0.34, 0.56, 0.28, 0.015, brushedMetal(0xd8dee9), [-1.25, -0.43, -0.25]);
        for (const sx of [-1.08, -0.88, -0.68]) {
          cyl(g, 0.05, 0.05, 0.025, 12, cedarSiding, [sx, -0.52, 0.66]);
          cyl(g, 0.012, 0.012, 0.18, 8, matteBlackAlu, [sx, -0.62, 0.66]);
        }
        // 3. Living Room: L-shaped sectional sofa, oak coffee table & wall-mounted OLED TV
        rbox(g, 0.72, 0.16, 0.28, 0.02, mat(0x475569), [0.52, -0.63, 0.48]);
        rbox(g, 0.26, 0.16, 0.54, 0.02, mat(0x475569), [0.76, -0.63, 0.28]);
        rbox(g, 0.36, 0.08, 0.22, 0.01, pineWood, [0.46, -0.66, 0.14]);
        // 4. Upstairs Master Bedroom: Queen platform bed, headboard, white mattress & pillows
        rbox(g, 0.68, 0.12, 0.58, 0.015, pineWood, [0.42, 0.08, 0.12]);
        rbox(g, 0.62, 0.09, 0.52, 0.02, warmStucco, [0.42, 0.16, 0.12]);
        rbox(g, 0.68, 0.32, 0.05, 0.01, cedarSiding, [0.42, 0.20, -0.18]);
      },
    },
  ];

  return {
    id: 'modern-eco-home',
    name: 'Modern Two-Story Eco Smart Home & EV Garage',
    brand: 'Smart Architecture',
    badge: 'Solar + Powerwall • EV Garage • Full Cutaway',
    desc: 'Elaborate two-story family smart home with attached EV garage & rooftop terrace, revealing its concrete foundation, 2×6 stud framing & roof trusses, closed gable walls, PEX plumbing, breaker panel, HVAC ducts, and multi-room interior.',
    cameraPos: [4.4, 2.65, 4.4],
    parts,
    quiz: [
      {
        q: 'Which heavy steel-reinforced part at the very bottom keeps the 100-ton house from sinking into the ground?',
        correctId: 'concrete-slab-footings',
        distractors: ['gable-roof-trusses', 'front-facade-windows', 'solar-array-powerwall'],
      },
      {
        q: 'Which safety box on the wall flips a switch off automatically if too many appliances overload a wire?',
        correctId: 'electrical-breaker-wiring',
        distractors: ['pex-plumbing-waterheater', 'timber-stud-framing', 'stairs-kitchen-interior'],
      },
      {
        q: 'Why are the red and blue PEX water pipes inside the walls color-coded?',
        correctId: 'pex-plumbing-waterheater',
        distractors: ['hvac-heatpump-ducts', 'exterior-walls-insulation', 'gable-roof-trusses'],
      },
      {
        q: 'Why are double-pane windows filled with invisible Argon gas between the two sheets of glass?',
        correctId: 'front-facade-windows',
        distractors: ['concrete-slab-footings', 'stairs-kitchen-interior', 'timber-stud-framing'],
      },
      {
        q: 'Where does the Rooftop Solar Array store extra daytime electricity so the house and EV charger can run at night?',
        correctId: 'solar-array-powerwall',
        distractors: ['pex-plumbing-waterheater', 'gable-roof-trusses', 'exterior-walls-insulation'],
      },
    ],
  };
}

function buildGlassPavilionVilla() {
  const iBeamSteel = brushedMetal(0x1e293b, { metalness: 0.86, roughness: 0.24 });
  const travertine = mat(0xe7e5e4, { roughness: 0.48 });
  const warmStone = mat(0xd6d3d1, { roughness: 0.55 });
  const teakWood = mat(0x9a5b32, { roughness: 0.46 });
  const cognacLeather = mat(0x92400e, { roughness: 0.42 });

  const parts = [
    {
      id: 'radiant-concrete-plinth',
      name: 'Multi-Tier Cantilevered Travertine Plinth & Hydronic Radiant Floor Loops',
      category: 'Foundation & Heating',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Floating Roman travertine stone podium with cantilevered entry steps, L-shaped pool sun terrace, and embedded serpentine loops of warm PEX hydronic radiant floor heating tubes.',
      funFact: 'Ancient Romans invented underfloor heating ("hypocausts") 2,000 years ago; modern luxury villas pump warm water through flexible floor loops!',
      build(g) {
        // Lower site terrace + floating travertine pavilion slab + cantilevered entry floating stairs
        rbox(g, 4.35, 0.14, 3.25, 0.03, warmStone, [0.12, -0.88, 0.10]);
        rbox(g, 3.85, 0.20, 2.65, 0.025, travertine, [-0.08, -0.74, -0.05]);
        for (let st = 0; st < 3; st++) {
          rbox(g, 1.15, 0.045, 0.28, 0.008, travertine, [-0.55, -0.84 + st * 0.055, 1.48 - st * 0.20]);
        }
        // Serpentine red/orange hydronic radiant floor heating loops embedded in the floor slab
        for (let z = -0.95; z <= 0.85; z += 0.22) {
          box(g, 3.15, 0.024, 0.024, mat(0xef4444), [-0.15, -0.63, z]);
        }
      },
    },
    {
      id: 'cantilever-steel-ibeams',
      name: 'Structural Wide-Flange Steel H-Columns & Cantilevered Spandrel Girders',
      category: 'Structural Steel',
      isOuter: false,
      explodeOffset: [0, 0.45, -1.65],
      desc: 'Eight exposed wide-flange steel H-columns and deep cantilevered roof/floor I-beam spandrel girders with bolted gusset plates that carry 100% of the roof load so the outer walls can be pure glass.',
      funFact: 'Steel beams are shaped like the capital letter "I" because putting most of the metal at the top and bottom flanges resists bending without wasted weight!',
      build(g) {
        const colPositions = [
          [-1.65, 1.08],
          [-0.55, 1.08],
          [0.55, 1.08],
          [1.55, 1.08],
          [-1.65, -1.12],
          [-0.55, -1.12],
          [0.55, -1.12],
          [1.55, -1.12],
        ];
        for (const [x, z] of colPositions) {
          // True wide-flange H-column profile (web + 2 flanges)
          box(g, 0.04, 1.40, 0.11, iBeamSteel, [x, 0.0, z]);
          box(g, 0.12, 1.40, 0.025, iBeamSteel, [x, 0.0, z - 0.045]);
          box(g, 0.12, 1.40, 0.025, iBeamSteel, [x, 0.0, z + 0.045]);
        }
        // Primary longitudinal roof I-beam girders + transverse roof cross-girders
        for (const z of [-1.12, 0, 1.08]) {
          box(g, 3.78, 0.13, 0.11, iBeamSteel, [-0.05, 0.68, z]);
        }
        for (const x of [-1.65, -0.55, 0.55, 1.55]) {
          box(g, 0.10, 0.12, 2.38, iBeamSteel, [x, 0.68, -0.02]);
        }
      },
    },
    {
      id: 'curtain-wall-glass',
      name: 'Floor-to-Ceiling Low-E Curtain Wall Glazing & Sliding Pocket Glass Doors',
      category: 'Architectural Glass',
      isOuter: true,
      explodeOffset: [0, 0, 1.95],
      desc: 'Triple-glazed Low-E structural curtain walls divided by slim black-anodized mullions, with motorized multi-track glass doors that slide open to merge the living room with the pool terrace.',
      funFact: 'Motorized glass wall panels slide into hidden pockets so the indoor living room merges seamlessly with the outdoor patio!',
      build(g) {
        const glass = glassMat(0x7dd3fc, 0.36);
        // Front, rear, and side curtain wall glass bays + vertical black anodized mullions & transom bars
        box(g, 3.52, 1.32, 0.035, glass, [-0.05, 0.0, 1.08]);
        box(g, 3.52, 1.32, 0.035, glass, [-0.05, 0.0, -1.12]);
        box(g, 0.035, 1.32, 2.20, glass, [1.68, 0.0, -0.02]);
        box(g, 0.035, 1.32, 2.20, glass, [-1.78, 0.0, -0.02]);
        for (let mx = -1.78; mx <= 1.68; mx += 0.575) {
          box(g, 0.028, 1.34, 0.055, iBeamSteel, [mx, 0.0, 1.08]);
          box(g, 0.028, 1.34, 0.055, iBeamSteel, [mx, 0.0, -1.12]);
        }
        box(g, 3.56, 0.028, 0.055, iBeamSteel, [-0.05, 0.36, 1.08]);
        box(g, 3.56, 0.028, 0.055, iBeamSteel, [-0.05, 0.36, -1.12]);
      },
    },
    {
      id: 'flat-green-sedum-roof',
      name: 'Cantilevered Fascia Roof, Living Sedum Botanical Garden & 3 Skylights',
      category: 'Living Roof',
      isOuter: true,
      explodeOffset: [0, 1.75, 0],
      desc: 'Deep overhanging travertine-and-steel roof slab with warm cedar soffits, river-pebble ballast border, multi-bed drought-resistant green sedum rooftop garden, and 3 framed architectural skylights.',
      funFact: 'A "green roof" covered in living soil and plants can stay 40°F cooler in summer than a black tar roof!',
      build(g) {
        // Cantilevered travertine roof slab + warm teak underside soffit + dark steel perimeter fascia trim
        rbox(g, 4.05, 0.14, 2.92, 0.025, travertine, [-0.05, 0.78, -0.02]);
        rbox(g, 4.08, 0.04, 2.95, 0.01, iBeamSteel, [-0.05, 0.83, -0.02]);
        rbox(g, 3.92, 0.02, 2.80, 0.01, teakWood, [-0.05, 0.70, -0.02]);
        // Multi-zone living green sedum beds + 3 raised aluminum-framed glass skylights
        for (const [gx, gz, gw, gd] of [
          [-1.18, -0.02, 1.15, 2.25],
          [0.12, -0.52, 1.15, 1.15],
          [1.22, -0.02, 0.95, 2.25],
        ]) {
          rbox(g, gw, 0.055, gd, 0.015, mat(0x15803d, { roughness: 0.82 }), [gx, 0.87, gz]);
        }
        for (const sx of [-1.15, 0.05, 1.15]) {
          rbox(g, 0.58, 0.075, 0.62, 0.01, iBeamSteel, [sx, 0.89, 0.42]);
          rbox(g, 0.52, 0.085, 0.56, 0.01, glassMat(0x38bdf8, 0.62), [sx, 0.90, 0.42]);
        }
      },
    },
    {
      id: 'central-hearth-core',
      name: 'Book-Matched Slate Service Core, Glass Fireplace & Wine Gallery',
      category: 'Interior Core',
      isOuter: false,
      explodeOffset: [-0.45, 0.85, 0],
      desc: 'Central architectural stone core housing the double-sided glass hearth fireplace, suspended black steel chimney flue, concealed powder room, and backlit wine & espresso bar.',
      funFact: 'Architect Ludwig Mies van der Rohe pioneered the "central service core" so nothing blocks the 360-degree view through the outer glass!',
      build(g) {
        rbox(g, 1.05, 1.30, 0.72, 0.02, mat(0x334155, { roughness: 0.6 }), [-0.55, 0.0, -0.18]);
        // Pass-through glass fireplace opening with glowing ember logs + teak kitchen/bar millwork wall
        rbox(g, 0.52, 0.34, 0.76, 0.01, mat(0x0f172a), [-0.55, -0.36, -0.18]);
        rbox(g, 0.42, 0.22, 0.78, 0.01, emissiveMat(0xff6b00, 1.6), [-0.55, -0.38, -0.18]);
        rbox(g, 0.95, 0.32, 0.38, 0.015, teakWood, [-0.55, -0.48, 0.52]);
        rbox(g, 0.98, 0.035, 0.42, 0.008, travertine, [-0.55, -0.31, 0.52]);
      },
    },
    {
      id: 'sunken-conversation-pit',
      name: 'Teak Conversation Lounge, Cognac Leather Sofa & Dining Pavilion',
      category: 'Interior Design',
      isOuter: false,
      explodeOffset: [0.85, 0.55, 1.25],
      desc: 'Mid-century modern interior featuring a Burmese teak platform lounge, cognac leather L-sectional sofa, travertine coffee table, 6-seat dining table, and master suite platform bed.',
      funFact: 'Perforated wooden ceiling slats backed with felt absorb echo so a glass-and-stone room still sounds warm and quiet!',
      build(g) {
        // Teak lounge rug platform + Cognac leather L-sofa + low travertine coffee table
        rbox(g, 1.38, 0.04, 1.15, 0.01, teakWood, [0.68, -0.62, 0.22]);
        rbox(g, 0.95, 0.16, 0.30, 0.02, cognacLeather, [0.68, -0.52, 0.58]);
        rbox(g, 0.30, 0.16, 0.85, 0.02, cognacLeather, [1.08, -0.52, 0.28]);
        rbox(g, 0.48, 0.07, 0.32, 0.01, travertine, [0.58, -0.56, 0.18]);
        // Dining table with 4 chairs in rear bay + Master bed in west wing (-1.35)
        rbox(g, 0.72, 0.04, 0.38, 0.01, teakWood, [0.68, -0.44, -0.62]);
        rbox(g, 0.68, 0.14, 0.58, 0.015, teakWood, [-1.35, -0.55, 0.18]);
        rbox(g, 0.62, 0.09, 0.52, 0.02, travertine, [-1.35, -0.46, 0.18]);
      },
    },
    {
      id: 'infinity-reflecting-pool',
      name: 'Wrap-Around L-Shaped Infinity Swimming Pool, Sun Loungers & Firepit',
      category: 'Microclimate Cooling',
      isOuter: false,
      explodeOffset: [1.85, -0.95, 1.15],
      desc: 'Zero-edge turquoise infinity pool wrapping the eastern and southern terraces with underwater LED lighting, teak sunbeds, and a sunken outdoor firepit lounge.',
      funFact: 'Evaporative cooling over water was used in ancient Alhambra palaces to air-condition courtyards without electricity!',
      build(g) {
        // L-shaped infinity pool basin + glowing turquoise water surface + 3 teak poolside sun loungers
        rbox(g, 1.15, 0.16, 2.45, 0.02, travertine, [1.58, -0.78, 0.12]);
        rbox(g, 1.02, 0.12, 2.32, 0.015, emissiveMat(0x06b6d4, 0.55), [1.58, -0.73, 0.12]);
        for (const lz of [-0.55, 0.0, 0.55]) {
          rbox(g, 0.38, 0.045, 0.18, 0.008, teakWood, [0.85, -0.60, lz]);
          rbox(g, 0.34, 0.025, 0.16, 0.006, travertine, [0.85, -0.57, lz]);
        }
      },
    },
    {
      id: 'geothermal-ground-loop',
      name: 'Deep Geothermal Earth-Loop Heat Pump & Hydronic Manifold',
      category: 'Renewable Thermal',
      isOuter: false,
      explodeOffset: [-1.65, -1.25, -1.15],
      desc: 'Closed-loop geothermal heat pump connected to deep vertical earth boreholes where the ground stays a steady 55°F year-round.',
      funFact: 'Just 10 feet below your backyard grass, the ground temperature barely changes between a July heatwave and a January blizzard!',
      build(g) {
        rbox(g, 0.38, 0.48, 0.36, 0.02, brushedMetal(0x0ea5e9), [-1.35, -0.42, -0.72]);
        for (const gx of [-1.45, -1.25]) {
          cyl(g, 0.022, 0.022, 0.55, 10, mat(0x0284c7), [gx, -0.95, -0.72]);
        }
      },
    },
    {
      id: 'motorized-louver-shades',
      name: 'Automated Sun-Tracking Teak & Aluminum Brise-Soleil Louvers',
      category: 'Solar Shading',
      isOuter: false,
      explodeOffset: [1.95, 0.25, 0],
      desc: 'Architectural Burmese teak and bronze-anodized vertical and horizontal sun-shading louvers along the east and west facades that pivot automatically with the sun.',
      funFact: 'Overhangs are angled so the high summer sun is blocked completely, while the low winter sun shines right underneath to warm the floor!',
      build(g) {
        for (let y = -0.52; y <= 0.52; y += 0.17) {
          box(g, 0.045, 0.065, 2.18, teakWood, [1.74, y, -0.02], [0, 0, 0.35]);
        }
        for (let z = -0.95; z <= 0.95; z += 0.21) {
          box(g, 0.08, 1.28, 0.028, teakWood, [-1.84, 0.0, z], [0, 0.42, 0]);
        }
      },
    },
    {
      id: 'hidden-linear-diffusers',
      name: 'Frameless Architectural Linear Air Diffusers & Perimeter Cove Lighting',
      category: 'MEP Integration',
      isOuter: false,
      explodeOffset: [0, 1.25, -1.25],
      desc: 'Recessed shadow-gap ceiling slots housing whisper-quiet Coanda-effect air conditioning diffusers and warm 2700K architectural LED cove strips.',
      funFact: 'The Coanda effect makes air blown along a flat ceiling cling to the surface and travel all the way across the room before gently settling!',
      build(g) {
        for (const z of [-0.72, 0.0, 0.68]) {
          box(g, 3.35, 0.035, 0.065, emissiveMat(0xfef08a, 1.35), [-0.05, 0.66, z]);
        }
      },
    },
  ];

  return {
    id: 'glass-pavilion-villa',
    name: 'Mid-Century Glass & Steel Pavilion Villa',
    brand: 'Modernist Architecture',
    badge: 'Steel H-Columns • Infinity Pool • Green Roof',
    desc: 'Cantilevered Miesian steel-and-glass luxury pavilion with wide-flange H-columns, Low-E curtain walls, radiant travertine plinth, L-shaped infinity pool, and living sedum green roof.',
    cameraPos: [4.35, 2.55, 4.35],
    parts,
    quiz: [
      {
        q: 'How can the Mid-Century Pavilion have 100% floor-to-ceiling glass walls all the way around without collapsing?',
        correctId: 'cantilever-steel-ibeams',
        distractors: ['sunken-conversation-pit', 'infinity-reflecting-pool', 'hidden-linear-diffusers'],
      },
      {
        q: 'How does the stone floor keep your feet warm in winter without noisy hot-air vents?',
        correctId: 'radiant-concrete-plinth',
        distractors: ['curtain-wall-glass', 'flat-green-sedum-roof', 'motorized-louver-shades'],
      },
      {
        q: 'Why is the flat roof covered in living green sedum plants and soil?',
        correctId: 'flat-green-sedum-roof',
        distractors: ['central-hearth-core', 'geothermal-ground-loop', 'sunken-conversation-pit'],
      },
      {
        q: 'Where are the bathrooms, plumbing pipes, and fireplace hidden so they don’t block the outer glass walls?',
        correctId: 'central-hearth-core',
        distractors: ['infinity-reflecting-pool', 'motorized-louver-shades', 'curtain-wall-glass'],
      },
      {
        q: 'How does a Geothermal Heat Pump take advantage of the earth 10 feet underground?',
        correctId: 'geothermal-ground-loop',
        distractors: ['hidden-linear-diffusers', 'flat-green-sedum-roof', 'radiant-concrete-plinth'],
      },
    ],
  };
}

function buildGeodesicDomeCabin() {
  const cedarDeck = mat(0xb45309, { roughness: 0.56 });
  const warmTimber = mat(0xd99b52, { roughness: 0.58 });
  const darkBronze = brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.25 });
  const strutSteel = brushedMetal(0xe2e8f0, { metalness: 0.85, roughness: 0.22 });
  const domePanel = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.42,
    metalness: 0.08,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  // Precompute upper-hemisphere vertices and edges of a 2-frequency icosahedral geodesic dome sitting cleanly at yBase = -0.68
  const domeRadius = 1.48;
  const domeBaseY = -0.68;
  const ico = new THREE.IcosahedronGeometry(domeRadius, 2);
  const posAttr = ico.getAttribute('position');
  const vMap = new Map();
  const verts = [];
  const getVertIdx = (i) => {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const key = `${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}`;
    if (!vMap.has(key)) {
      // Flatten near-equator vertices to sit cleanly on the deck ring
      const yAdj = vy < -0.15 ? -0.18 : vy;
      vMap.set(key, verts.length);
      verts.push([vx, domeBaseY + (yAdj + 0.18) * 0.92, vz]);
    }
    return vMap.get(key);
  };
  const edgeSet = new Set();
  const domeEdges = [];
  const domeHubs = new Set();
  for (let i = 0; i < posAttr.count; i += 3) {
    const y0 = posAttr.getY(i);
    const y1 = posAttr.getY(i + 1);
    const y2 = posAttr.getY(i + 2);
    if (y0 < -0.22 && y1 < -0.22 && y2 < -0.22) continue;
    const i0 = getVertIdx(i);
    const i1 = getVertIdx(i + 1);
    const i2 = getVertIdx(i + 2);
    for (const [a, b] of [[i0, i1], [i1, i2], [i2, i0]]) {
      if (verts[a][1] < domeBaseY - 0.05 || verts[b][1] < domeBaseY - 0.05) continue;
      const ek = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edgeSet.has(ek)) {
        edgeSet.add(ek);
        domeEdges.push([verts[a], verts[b]]);
        domeHubs.add(a);
        domeHubs.add(b);
      }
    }
  }

  const parts = [
    {
      id: 'octagonal-pier-deck',
      name: 'Elevated Helical-Pile Foundation, Wrap-Around Cedar Deck & Barrel Hot Tub',
      category: 'Foundation & Deck',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Raised 12-sided cedar wrap-around observation deck on galvanized helical screw-piles with cable safety railings, entry staircase, and a wood-fired cedar barrel hot tub.',
      funFact: 'Raising a cabin on helical screw-piles lets snowmelt and wildlife pass freely underneath without pouring concrete or disturbing tree roots!',
      build(g) {
        // 12-sided wrap-around cedar deck platform + dark bronze rim beam + 12 galvanized helical screw-piles
        cyl(g, 2.05, 2.05, 0.12, 12, cedarDeck, [0, -0.74, 0]);
        cyl(g, 2.08, 2.08, 0.04, 12, darkBronze, [0, -0.79, 0]);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const px = Math.cos(a) * 1.82;
          const pz = Math.sin(a) * 1.82;
          cyl(g, 0.055, 0.045, 0.42, 10, strutSteel, [px, -0.98, pz]);
          // Perimeter deck railing posts & stainless cable guardrails (skipping front stair opening)
          if (Math.abs(px) > 0.38 || pz < 0) {
            box(g, 0.04, 0.34, 0.04, darkBronze, [px * 1.05, -0.52, pz * 1.05]);
          }
        }
        torus(g, 1.92, 0.015, cedarDeck, [0, -0.36, 0], [Math.PI / 2, 0, 0]);
        // Front entry timber staircase + Outdoor Cedar Barrel Hot Tub with glowing warm water on west deck
        for (let st = 0; st < 4; st++) {
          rbox(g, 0.62, 0.045, 0.18, 0.008, cedarDeck, [0, -0.78 - st * 0.08, 2.08 + st * 0.16]);
        }
        cyl(g, 0.34, 0.32, 0.32, 20, cedarDeck, [-1.52, -0.52, 0.65]);
        cyl(g, 0.29, 0.29, 0.04, 18, emissiveMat(0x06b6d4, 0.65), [-1.52, -0.37, 0.65]);
        torus(g, 0.335, 0.010, strutSteel, [-1.52, -0.44, 0.65], [Math.PI / 2, 0, 0]);
        torus(g, 0.330, 0.010, strutSteel, [-1.52, -0.58, 0.65], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'geodesic-strut-lattice',
      name: '3D Triangulated Geodesic Strut Lattice, Star Hubs & Entry Airlock Vestibule',
      category: 'Geodesic Structure',
      isOuter: true,
      explodeOffset: [0, 1.65, 0],
      desc: 'True 3D cylindrical steel-and-timber geodesic struts bolted to machined 6-way star hubs across the entire hemisphere, plus a framed timber entry airlock mudroom.',
      funFact: 'Invented by Buckminster Fuller, a geodesic dome encloses the maximum indoor volume with the minimum surface area—and gets stronger as it scales up!',
      build(g) {
        // True 3D cylindrical struts for every geodesic triangle edge + machined star hubs at every vertex!
        for (const [p1, p2] of domeEdges) {
          tube(g, [p1, p2], 0.018, darkBronze, 6, 2);
        }
        for (const idx of domeHubs) {
          sphere(g, 0.032, 10, 8, strutSteel, verts[idx]);
        }
        // Framed Cedar & Glass Entry Airlock Vestibule projecting from south-east bay
        rbox(g, 0.62, 0.68, 0.48, 0.02, cedarDeck, [0.0, -0.34, 1.48]);
        rbox(g, 0.42, 0.56, 0.52, 0.01, glassMat(0x38bdf8, 0.55), [0.0, -0.36, 1.49]);
      },
    },
    {
      id: 'insulated-hex-panels',
      name: 'Faceted Insulated Structural Triangle Cladding Panels (SIPs)',
      category: 'Thermal Shell',
      isOuter: true,
      explodeOffset: [-1.45, 0.85, -1.25],
      desc: 'Faceted geometric Structural Insulated Panels (SIPs) with exterior weatherproof composite skins and warm birch interior acoustic cladding bolted into the northern 2/3 of the dome.',
      funFact: 'Because a dome has no flat walls or roof edges for wind to push against, 130-mph mountain hurricane winds glide smoothly around it!',
      build(g) {
        // Faceted geodesic shell aligned with the 3D strut lattice (domeBaseY = -0.68)
        const shellGeo = new THREE.SphereGeometry(1.44, 14, 7, 0, Math.PI * 1.32, 0, Math.PI * 0.48);
        const m = new THREE.Mesh(shellGeo, domePanel);
        m.position.set(0, -0.52, 0);
        m.rotation.y = 0.92;
        g.add(m);
        // Base insulated kneewall ring around the dome perimeter
        cyl(g, 1.42, 1.45, 0.24, 14, cedarDeck, [0, -0.56, 0]);
      },
    },
    {
      id: 'stargazing-skylight-bay',
      name: 'Faceted Panoramic Stargazing Triangle Window Wall',
      category: 'Daylighting & Views',
      isOuter: true,
      explodeOffset: [1.45, 0.85, 1.25],
      desc: 'South-facing tessellated triple-pane Low-E glass triangles that flood the cabin with passive solar winter warmth and frame the Milky Way from the sleeping loft at night.',
      funFact: 'Angling the triangle windows toward the southern winter sun captures free solar heat all day long!',
      build(g) {
        const glassFacetMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.42,
          roughness: 0.08,
          metalness: 0.15,
          flatShading: true,
          side: THREE.DoubleSide,
        });
        const glassGeo = new THREE.SphereGeometry(1.45, 12, 7, 0, Math.PI * 0.68, 0, Math.PI * 0.48);
        const m = new THREE.Mesh(glassGeo, glassFacetMat);
        m.position.set(0, -0.52, 0);
        m.rotation.y = -0.45;
        g.add(m);
      },
    },
    {
      id: 'wood-stove-chimney',
      name: 'Central Cast-Iron Wood Stove, Stone Hearth & Double-Wall Chimney Flue',
      category: 'Heating',
      isOuter: false,
      explodeOffset: [0, 1.95, 0],
      desc: 'Scandinavian catalytic cast-iron wood-burning stove on a slate hearth pad with firewood log storage and a double-wall insulated chimney flue rising straight through the dome apex.',
      funFact: 'In a round dome, there are no cold corners—warm air from the center stove rises to the apex and loops smoothly down the curved walls!',
      build(g) {
        const castIron = mat(0x1e242b, { roughness: 0.38, metalness: 0.65 });
        cyl(g, 0.38, 0.38, 0.04, 16, mat(0x334155), [-0.08, -0.66, -0.08]);
        cyl(g, 0.22, 0.22, 0.38, 20, castIron, [-0.08, -0.44, -0.08]);
        rbox(g, 0.24, 0.18, 0.12, 0.02, emissiveMat(0xff5a00, 1.6), [-0.08, -0.42, 0.06]);
        cyl(g, 0.055, 0.055, 1.52, 16, castIron, [-0.08, 0.32, -0.08]);
      },
    },
    {
      id: 'sleeping-loft-ladder',
      name: 'Crescent Timber Mezzanine Sleeping Loft, Queen Bed & Ship’s Ladder',
      category: 'Interior Living',
      isOuter: false,
      explodeOffset: [-0.85, 0.65, 0],
      desc: 'Freestanding half-moon timber second-story sleeping loft with wooden guardrail, queen bed & pillows, downstairs living room sofa, and angled oak ship’s ladder.',
      funFact: 'Freestanding loft posts support the bedroom floor without putting any sideways push on the geodesic shell!',
      build(g) {
        // Crescent loft deck + support posts + loft guardrail + Queen mattress & pillows
        rbox(g, 1.15, 0.07, 1.68, 0.02, warmTimber, [-0.46, 0.02, -0.05]);
        for (const [px, pz] of [[-0.85, -0.58], [-0.85, 0.52], [-0.05, -0.62], [-0.05, 0.52]]) {
          cyl(g, 0.045, 0.045, 0.68, 10, cedarDeck, [px, -0.34, pz]);
        }
        rbox(g, 0.04, 0.22, 1.56, 0.01, cedarDeck, [0.08, 0.15, -0.05]);
        rbox(g, 0.62, 0.10, 0.72, 0.02, mat(0xf8fafc), [-0.52, 0.10, -0.05]);
        rbox(g, 0.56, 0.06, 0.48, 0.015, mat(0x0284c7), [-0.46, 0.14, -0.05]);
        // Ship's ladder with steps + Downstairs curved sofa & coffee table
        for (let s = 0; s < 6; s++) {
          box(g, 0.12, 0.025, 0.28, warmTimber, [0.12 + s * 0.06, -0.58 + s * 0.11, 0.48]);
        }
        rbox(g, 0.34, 0.16, 0.78, 0.03, mat(0x0d9488), [0.68, -0.58, 0.22]);
      },
    },
    {
      id: 'rainwater-cistern-filter',
      name: '1,500-Gallon Corrugated Rainwater Cistern & 3-Stage UV Drinking Filter',
      category: 'Off-Grid Water',
      isOuter: false,
      explodeOffset: [-1.65, -0.85, 1.15],
      desc: 'Collects mountain rain and snowmelt off the dome gutter apron into an insulated corrugated tank and purifies it through sediment, activated carbon, and UV-C light.',
      funFact: '1 inch of rain falling on a 600-square-foot dome roof provides 370 gallons of fresh water!',
      build(g) {
        cyl(g, 0.28, 0.28, 0.62, 22, mat(0x0284c7, { metalness: 0.35, roughness: 0.4 }), [-1.18, -0.36, -0.82]);
        for (let c = -2; c <= 2; c++) {
          torus(g, 0.284, 0.008, strutSteel, [-1.18, -0.36 + c * 0.11, -0.82], [Math.PI / 2, 0, 0]);
        }
        // 3-stage blue/white UV water filter canisters
        for (let f = 0; f < 3; f++) {
          cyl(g, 0.035, 0.035, 0.18, 12, mat(0x1d4ed8), [-0.82, -0.32, -0.82 + f * 0.09]);
        }
      },
    },
    {
      id: 'offgrid-solar-battery-bank',
      name: 'Off-Grid Ground Solar Array, 48V LiFePO4 Battery Rack & Starlink',
      category: 'Off-Grid Power',
      isOuter: false,
      explodeOffset: [1.65, -0.65, -1.15],
      desc: 'Deck-mounted bifacial solar panels, 48-volt lithium-iron-phosphate server-rack batteries, MPPT charge controller, and phased-array Starlink satellite internet dish.',
      funFact: 'MPPT solar controllers track the sun’s voltage curve continuously to squeeze up to 30% more power out of cloudy mountain skies!',
      build(g) {
        rbox(g, 0.38, 0.52, 0.30, 0.02, darkBronze, [0.95, -0.42, -0.78]);
        for (const by of [-0.52, -0.38, -0.24]) {
          box(g, 0.39, 0.08, 0.24, emissiveMat(0x22c55e, 1.3), [0.95, by, -0.78]);
        }
        // Deck-edge tilted solar panels + Starlink phased-array rectangular dish on mast
        rbox(g, 0.72, 0.03, 0.44, 0.008, darkBronze, [1.45, -0.45, -0.78], [0.48, 0.35, 0]);
        cyl(g, 0.016, 0.016, 0.36, 10, strutSteel, [1.58, -0.32, 0.72]);
        rbox(g, 0.18, 0.015, 0.24, 0.004, mat(0xf8fafc), [1.58, -0.14, 0.72], [0.35, 0, 0]);
      },
    },
    {
      id: 'solar-cupola-vent',
      name: 'Pentagonal Apex Solar Chimney Cupola & Motorized Vent Skylight',
      category: 'Natural Ventilation',
      isOuter: false,
      explodeOffset: [0, 2.25, 0],
      desc: 'Pentagonal cupola crown at the very top of the dome with motorized louver hatches that open to vent rising warm air and pull cool forest breezes through the cabin.',
      funFact: 'Because hot air rises, cracking open a vent at the top apex pulls cool forest air in through the lower windows automatically ("stack effect")!',
      build(g) {
        cyl(g, 0.44, 0.52, 0.11, 5, darkBronze, [0, 0.88, 0]);
        cyl(g, 0.40, 0.46, 0.13, 5, glassMat(0x38bdf8, 0.65), [0, 0.90, 0]);
      },
    },
    {
      id: 'kitchenette-compost-bath',
      name: 'Curved Birch Galley Kitchenette, Copper Sink & Greywater Planter Bed',
      category: 'Eco Utilities',
      isOuter: false,
      explodeOffset: [0.65, 0.25, -1.45],
      desc: 'Curved butcher-block galley counter with hammered copper sink, induction cooktop, enclosed compost bath module, and biological greywater indoor herb planter.',
      funFact: 'Nothing goes to waste in an earthship/dome cabin: sink water is filtered through sand and gravel to water indoor plants!',
      build(g) {
        rbox(g, 0.52, 0.30, 0.78, 0.02, carPaint(0x0d9488), [0.58, -0.52, -0.32]);
        rbox(g, 0.55, 0.035, 0.82, 0.01, warmTimber, [0.58, -0.36, -0.32]);
        cyl(g, 0.09, 0.08, 0.06, 16, brushedMetal(0xb45309), [0.56, -0.35, -0.18]);
        // Biological indoor green planter bed along south window base
        rbox(g, 0.88, 0.14, 0.24, 0.02, cedarDeck, [0.22, -0.60, 0.96]);
        rbox(g, 0.82, 0.08, 0.18, 0.015, mat(0x15803d, { roughness: 0.85 }), [0.22, -0.52, 0.96]);
      },
    },
  ];

  return {
    id: 'geodesic-dome-cabin',
    name: 'Geodesic Dome Off-Grid Eco Cabin',
    brand: 'Buckminster Architecture',
    badge: '3D Strut Lattice • Cedar Hot Tub • 100% Off-Grid',
    desc: 'Self-sustaining mountain geodesic eco-dome built from 3D tubular struts and star hubs on a wrap-around cedar deck with barrel hot tub, sleeping loft, wood stove, rainwater harvesting, and solar/Starlink off-grid power.',
    cameraPos: [4.25, 2.45, 4.35],
    parts,
    quiz: [
      {
        q: 'Which geometric shape makes a Geodesic Dome the strongest, lightest building structure against hurricane winds and heavy snow?',
        correctId: 'geodesic-strut-lattice',
        distractors: ['octagonal-pier-deck', 'sleeping-loft-ladder', 'kitchenette-compost-bath'],
      },
      {
        q: 'Why does a single central wood-burning stove heat a round geodesic dome so evenly with zero cold corners?',
        correctId: 'wood-stove-chimney',
        distractors: ['rainwater-cistern-filter', 'offgrid-solar-battery-bank', 'octagonal-pier-deck'],
      },
      {
        q: 'How does opening the top pentagon hatch ("Apex Cupola") cool the dome cabin on a summer day without air conditioning?',
        correctId: 'solar-cupola-vent',
        distractors: ['sleeping-loft-ladder', 'kitchenette-compost-bath', 'insulated-hex-panels'],
      },
      {
        q: 'How does an off-grid mountain cabin get fresh clean drinking water without city water pipes?',
        correctId: 'rainwater-cistern-filter',
        distractors: ['stargazing-skylight-bay', 'wood-stove-chimney', 'geodesic-strut-lattice'],
      },
      {
        q: 'Why are the stargazing glass triangle windows angled toward the south?',
        correctId: 'stargazing-skylight-bay',
        distractors: ['octagonal-pier-deck', 'offgrid-solar-battery-bank', 'kitchenette-compost-bath'],
      },
    ],
  };
}

export const HOUSE_MODELS = [
  buildModernEcoSmartHome(),
  buildGlassPavilionVilla(),
  buildGeodesicDomeCabin(),
];

// ============================================================================
// 4K / 8K TVs & CINEMA DISPLAYS (3 Display Technologies)
// ============================================================================
function make8kHdrDisplayTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext('2d');

  // Deep HDR cosmic night sky to horizon glow
  const sky = ctx.createLinearGradient(0, 0, 0, 288);
  sky.addColorStop(0.0, '#030712');
  sky.addColorStop(0.28, '#0f172a');
  sky.addColorStop(0.55, '#1e1b4b');
  sky.addColorStop(0.75, '#be185d');
  sky.addColorStop(0.92, '#f97316');
  sky.addColorStop(1.0, '#fde047');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 288);

  // Vivid emerald/cyan aurora borealis ribbons across upper sky
  for (let band = 0; band < 3; band++) {
    const ag = ctx.createLinearGradient(0, 30 + band * 28, 512, 90 + band * 28);
    ag.addColorStop(0, 'rgba(16, 185, 129, 0.0)');
    ag.addColorStop(0.3, band === 1 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(16, 185, 129, 0.6)');
    ag.addColorStop(0.7, 'rgba(168, 85, 247, 0.5)');
    ag.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(0, 80 + band * 24);
    for (let x = 0; x <= 512; x += 16) {
      const y = 55 + band * 22 + Math.sin(x * 0.018 + band * 1.4) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(512, 135 + band * 24);
    ctx.lineTo(0, 135 + band * 24);
    ctx.closePath();
    ctx.fill();
  }

  // Starfield (local dimming precision highlight stars)
  for (let i = 0; i < 120; i++) {
    const sx = (i * 97) % 512;
    const sy = (i * 53) % 165;
    const r = (i % 5 === 0) ? 1.8 : 0.9;
    ctx.fillStyle = i % 7 === 0 ? '#7dd3fc' : '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing 4,000-nit HDR solar/planetary orb on horizon
  const sun = ctx.createRadialGradient(256, 185, 4, 256, 185, 95);
  sun.addColorStop(0, '#ffffff');
  sun.addColorStop(0.22, '#fef08a');
  sun.addColorStop(0.55, 'rgba(249, 115, 22, 0.65)');
  sun.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(256, 185, 95, 0, Math.PI * 2);
  ctx.fill();

  // Sharp alpine mountain range silhouette
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(0, 225);
  const peaks = [
    [0, 210], [45, 168], [88, 195], [142, 138], [195, 186],
    [248, 152], [295, 192], [352, 128], [412, 178], [462, 148], [512, 202],
  ];
  for (const [px, py] of peaks) ctx.lineTo(px, py);
  ctx.lineTo(512, 225);
  ctx.closePath();
  ctx.fill();

  // Foreground glacial lake reflection
  const lake = ctx.createLinearGradient(0, 220, 0, 288);
  lake.addColorStop(0, '#0f172a');
  lake.addColorStop(0.4, '#1e3a8a');
  lake.addColorStop(1, '#020617');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 220, 512, 68);

  // Shimmering water reflection lines
  for (let y = 224; y < 284; y += 4) {
    const w = 140 - (y - 224) * 1.4;
    ctx.fillStyle = y % 8 === 0 ? 'rgba(253, 224, 71, 0.55)' : 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(256 - w * 0.5 + Math.sin(y) * 8, y, w, 1.8);
  }

  // Subtle 8K UHD HUD badge in top-right corner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(392, 14, 104, 26);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(392, 14, 104, 26);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('8K HDR10+ 144Hz', 399, 31);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTransparentOledHudTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 288);

  // Subtle transparent Indium-Tin-Oxide (ITO) micro-pixel grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 288);
    ctx.stroke();
  }
  for (let y = 0; y <= 288; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Glowing holographic aurora waves across the glass
  const waveGrad = ctx.createLinearGradient(40, 60, 472, 220);
  waveGrad.addColorStop(0, 'rgba(0, 245, 212, 0.85)');
  waveGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.75)');
  waveGrad.addColorStop(1, 'rgba(247, 37, 133, 0.85)');
  ctx.strokeStyle = waveGrad;
  for (let w = 0; w < 5; w++) {
    ctx.lineWidth = 2.5 - w * 0.3;
    ctx.beginPath();
    for (let x = 24; x <= 488; x += 8) {
      const y = 148 + Math.sin(x * 0.022 + w * 0.55) * (36 + w * 8);
      if (x === 24) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Holographic Smart Home / Spatial Clock HUD in upper left
  ctx.fillStyle = 'rgba(0, 245, 212, 0.9)';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('09:42', 32, 48);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.font = '12px sans-serif';
  ctx.fillText('TRANSPARENT OLED • 60GHz ZERO-CONNECT', 32, 68);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeImaxScreenTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 360;
  const ctx = c.getContext('2d');

  // Deep IMAX 1.43:1 orbital planet & nebula frame
  const bg = ctx.createRadialGradient(256, 210, 20, 256, 180, 280);
  bg.addColorStop(0, '#38bdf8');
  bg.addColorStop(0.25, '#1d4ed8');
  bg.addColorStop(0.55, '#0f172a');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 360);

  // Curved planetary limb glowing across center
  const limb = ctx.createRadialGradient(256, 460, 250, 256, 460, 315);
  limb.addColorStop(0, '#020617');
  limb.addColorStop(0.84, '#090d16');
  limb.addColorStop(0.91, '#38bdf8');
  limb.addColorStop(0.95, '#fef08a');
  limb.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = limb;
  ctx.beginPath();
  ctx.arc(256, 460, 315, 0, Math.PI * 2);
  ctx.fill();

  // Subtle acoustic micro-perforation dot pattern
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  for (let x = 8; x < 512; x += 12) {
    for (let y = 8; y < 360; y += 12) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Subtle IMAX 1.43:1 Dual-Laser calibration watermark
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 476, 324);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function build85InchMiniLed8KTv() {
  const titaniumBezel = brushedMetal(0x334155, { metalness: 0.9, roughness: 0.2 });
  const darkGraphite = brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.28 });
  const aluPlate = brushedMetal(0xd8dee9, { metalness: 0.88, roughness: 0.18 });
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });
  const goldMat = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.15 });
  const hdrTex = make8kHdrDisplayTexture();
  const hdrScreenMat = hdrTex
    ? new THREE.MeshStandardMaterial({
        map: hdrTex,
        emissiveMap: hdrTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.72,
        roughness: 0.12,
        metalness: 0.08,
      })
    : screenMat('samsung');

  const parts = [
    {
      id: 'infinity-titanium-bezel',
      name: 'Zero-Bezel Titanium Frame & Moth-Eye Anti-Reflective Film',
      category: 'Front Optical Layer',
      isOuter: true,
      explodeOffset: [0, 0, 1.85],
      desc: '99% screen-to-body ratio titanium frame with a microscopic "moth-eye" nanostructured film that swallows room reflections.',
      funFact: 'Scientists copied the microscopic bumps on a night moth’s eye so room lamps don’t reflect off the TV glass!',
      build(g) {
        // Hollow ultra-thin brushed titanium perimeter micro-bezel rails (leaves the 8K HDR canvas unobstructed!)
        const W = 3.36;
        const H = 1.92;
        const rim = 0.036;
        const depth = 0.034;
        const zCenter = 0.045;
        // Top & bottom titanium rails
        rbox(g, W, rim, depth, 0.008, titaniumBezel, [0, 0.15 + (H - rim) / 2, zCenter]);
        rbox(g, W, rim * 1.15, depth, 0.008, titaniumBezel, [0, 0.15 - (H - rim * 1.15) / 2, zCenter]);
        // Left & right titanium rails
        rbox(g, rim, H - rim * 2, depth, 0.008, titaniumBezel, [-(W - rim) / 2, 0.15, zCenter]);
        rbox(g, rim, H - rim * 2, depth, 0.008, titaniumBezel, [(W - rim) / 2, 0.15, zCenter]);
        // Chamfered chrome corner reinforcement L-brackets
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            rbox(g, 0.12, 0.018, depth + 0.006, 0.004, chromeMat(), [sx * (W / 2 - 0.06), 0.15 + sy * (H / 2 - 0.01), zCenter]);
            rbox(g, 0.018, 0.12, depth + 0.006, 0.004, chromeMat(), [sx * (W / 2 - 0.01), 0.15 + sy * (H / 2 - 0.06), zCenter]);
          }
        }
        // Bottom-center IR / ambient light sensor & far-field microphone chin pod + glowing cyan standby LED
        rbox(g, 0.34, 0.035, 0.042, 0.008, darkGraphite, [0, -0.825, 0.048]);
        sphere(g, 0.009, 10, 10, emissiveMat(0x38bdf8, 2.2), [0.12, -0.825, 0.07]);
        // Ultra-clear Moth-Eye anti-reflective nanostructured optical layer (subtle 12% opacity so 8K display shines vividly)
        const mothEyeMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.11,
          roughness: 0.05,
          metalness: 0.05,
          clearcoat: 1.0,
          depthWrite: false,
        });
        box(g, 3.28, 1.84, 0.006, mothEyeMat, [0, 0.15, 0.056]);
        // Subtle diagonal optical anti-glare sheen strips visible when exploded
        box(g, 0.04, 1.65, 0.007, glassMat(0x7dd3fc, 0.22), [-1.15, 0.15, 0.058], [0, 0, -0.35]);
        box(g, 0.025, 1.45, 0.007, glassMat(0x7dd3fc, 0.18), [-1.02, 0.15, 0.058], [0, 0, -0.35]);
      },
    },
    {
      id: 'rgb-8k-pixel-matrix',
      name: '8K (7680×4320) Liquid-Crystal / OLED Active Pixel Matrix',
      category: 'Pixel Layer',
      isOuter: false,
      explodeOffset: [0, 0, 1.25],
      desc: 'Over 33 million individual Red, Green, and Blue sub-pixels—four times sharper than 4K UHD!',
      funFact: 'Every single second, 33 million microscopic liquid-crystal shutters twist open and closed up to 144 times!',
      build(g) {
        // Dark TFT silicon backplane substrate + vivid 8K HDR Cosmic & Alpine Aurora active pixel canvas on front face
        rbox(g, 3.28, 1.84, 0.014, 0.008, darkGraphite, [0, 0.15, 0.026]);
        box(g, 3.26, 1.82, 0.008, hdrScreenMat, [0, 0.15, 0.034]);
        // Gold peripheral gate-driver bus traces along left/right edges of the TFT glass
        for (const sx of [-1, 1]) {
          box(g, 0.018, 1.78, 0.016, goldMat, [sx * 1.63, 0.15, 0.028]);
          for (let i = -3; i <= 3; i++) {
            rbox(g, 0.028, 0.12, 0.02, 0.003, copper, [sx * 1.635, 0.15 + i * 0.24, 0.028]);
          }
        }
      },
    },
    {
      id: 'quantum-dot-nanocrystal-sheet',
      name: 'Quantum Dot (QD) Nanocrystal Color Enhancement Film',
      category: 'Nanotech Color',
      isOuter: false,
      explodeOffset: [0, 0, 0.7],
      desc: 'Billions of半导体 semiconductor nanocrystals that glow pure laser-like Red and Green when hit by blue backlight photons!',
      funFact: 'Quantum Dots change their color based purely on their size: 2-nanometer dots glow bright green, while 6-nanometer dots glow deep crimson red! (This discovery won the 2023 Nobel Prize in Chemistry!)',
      build(g) {
        // Multi-layer Quantum Dot optical film stack: green 2nm QD sheet, red 6nm QD phosphor bands, and Dual Brightness Enhancement Film (DBEF) frame
        rbox(g, 3.22, 1.79, 0.012, 0.008, emissiveMat(0x10b981, 0.85), [0, 0.15, 0.014]);
        // Alternating Red (6nm) and Green (2nm) nanocrystal wavelength conversion bands + optical diffuser frame
        for (let i = -3; i <= 3; i++) {
          const bandMat = i % 2 === 0 ? emissiveMat(0xf43f5e, 0.95) : emissiveMat(0x34d399, 0.95);
          box(g, 0.36, 1.68, 0.014, bandMat, [i * 0.44, 0.15, 0.015]);
        }
        // Optical diffuser tension frame around perimeter
        rbox(g, 3.24, 0.028, 0.018, 0.004, aluPlate, [0, 1.04, 0.014]);
        rbox(g, 3.24, 0.028, 0.018, 0.004, aluPlate, [0, -0.74, 0.014]);
      },
    },
    {
      id: 'mini-led-backlight-matrix',
      name: '5,000-Zone Mini-LED Local Dimming Backlight Array',
      category: 'Illumination',
      isOuter: false,
      explodeOffset: [0, 0, 0.15],
      desc: 'Tens of thousands of grain-of-sand-sized blue Mini-LEDs that dim dark starry skies to 0.0001 nits right next to a 4,000-nit sun!',
      funFact: 'Each Mini-LED is 40 times smaller than a regular LED, allowing thousands of independent dimming zones!',
      build(g) {
        // High-reflectivity white MCPCB aluminum substrate + 8x5 local-dimming zone matrix with glowing blue/white Mini-LEDs & driver ICs
        rbox(g, 3.24, 1.81, 0.022, 0.01, aluPlate, [0, 0.15, -0.005]);
        box(g, 3.16, 1.73, 0.016, mat(0xf8fafc, { roughness: 0.25 }), [0, 0.15, 0.0]);
        const blueLedMat = emissiveMat(0x38bdf8, 1.65);
        const brightZoneMat = emissiveMat(0xfef08a, 1.85);
        const icMat = mat(0x0f172a, { roughness: 0.3 });
        // Zone grid divider ribs
        for (let gx = -1.4; gx <= 1.4; gx += 0.35) {
          box(g, 0.008, 1.70, 0.022, aluPlate, [gx, 0.15, 0.002]);
        }
        for (let gy = -0.55; gy <= 0.85; gy += 0.35) {
          box(g, 3.14, 0.008, 0.022, aluPlate, [0, gy, 0.002]);
        }
        // 9 x 5 = 45 local dimming zone clusters (each with 4 Mini-LED emitters + 1 micro-IC)
        for (let ix = -4; ix <= 4; ix++) {
          for (let iy = -2; iy <= 2; iy++) {
            const cx = ix * 0.34;
            const cy = 0.15 + iy * 0.33;
            const isPeakHdr = Math.abs(ix) <= 1 && Math.abs(iy) <= 1;
            const emitMat = isPeakHdr ? brightZoneMat : blueLedMat;
            for (const [dx, dy] of [[-0.07, -0.06], [0.07, -0.06], [-0.07, 0.06], [0.07, 0.06]]) {
              box(g, 0.042, 0.042, 0.012, emitMat, [cx + dx, cy + dy, 0.008]);
            }
            box(g, 0.036, 0.024, 0.012, icMat, [cx, cy, 0.008]);
          }
        }
      },
    },
    {
      id: 'neural-8k-ai-board',
      name: 'Neural Quantum 8K AI Processor & HDMI 2.1 Mainboard',
      category: 'Brain & Video Processing',
      isOuter: false,
      explodeOffset: [0.95, 0.25, -0.65],
      desc: 'Uses 512 neural networks to upscale older 1080p/4K videos to crisp 8K resolution in real time.',
      funFact: 'The AI processor recognizes faces, text, and stadium grass separately to sharpen edges without adding noise!',
      build(g) {
        const pcb = pcbMat('#064e3b');
        const darkChip = mat(0x111827, { roughness: 0.3 });
        rbox(g, 0.92, 0.72, 0.028, 0.015, pcb, [0.78, 0.12, -0.032]);
        // Skived copper heatsink over Neural Quantum 8K Processor + 12 cooling fins
        rbox(g, 0.28, 0.28, 0.024, 0.008, copper, [0.74, 0.16, -0.05]);
        for (let f = -5; f <= 5; f++) {
          box(g, 0.26, 0.012, 0.036, copper, [0.74, 0.16 + f * 0.022, -0.058]);
        }
        // 4 LPDDR5 high-bandwidth memory chips around the AI SoC
        for (const [mx, my] of [[0.52, 0.24], [0.52, 0.08], [0.96, 0.24], [0.96, 0.08]]) {
          rbox(g, 0.08, 0.11, 0.018, 0.003, darkChip, [mx, my, -0.045]);
        }
        // 4x HDMI 2.1 (48Gbps 8K/120Hz) shielded port housings + USB + Optical + RJ45 LAN along right edge
        for (let p = 0; p < 4; p++) {
          rbox(g, 0.09, 0.065, 0.042, 0.004, goldMat, [1.18, 0.34 - p * 0.11, -0.048]);
        }
        rbox(g, 0.11, 0.085, 0.052, 0.004, aluPlate, [1.18, -0.12, -0.05]);
        buildHexBoltArray(
          g,
          [
            [0.38, 0.42, -0.048],
            [1.18, 0.42, -0.048],
            [0.38, -0.18, -0.048],
            [1.18, -0.18, -0.048],
          ],
          { radius: 0.016, height: 0.016, finish: 'chrome', rot: [Math.PI / 2, 0, 0] },
        );
      },
    },
    {
      id: 'tcon-timing-board',
      name: 'High-Speed T-Con (Timing Controller) & Ribbon Buses',
      category: 'Display Synchronization',
      isOuter: false,
      explodeOffset: [0, -0.55, -0.55],
      desc: 'Acts like an orchestra conductor: translates video data into exact row-and-column voltage pulses for all 33 million pixels.',
      funFact: 'Gold flex ribbons at the bottom of the glass carry gigabits of pixel data every second!',
      build(g) {
        const bluePcb = pcbMat('#1e3a8a');
        // Central T-Con controller board + aluminum ASIC heat spreader
        rbox(g, 0.76, 0.38, 0.025, 0.01, bluePcb, [0, -0.32, -0.032]);
        rbox(g, 0.24, 0.18, 0.024, 0.006, aluPlate, [0, -0.30, -0.048]);
        // Lower left & right Source-Driver PCB bars + 12 gold Chip-on-Film (COF) flex ribbons curving into panel bottom
        for (const sx of [-1, 1]) {
          rbox(g, 1.28, 0.075, 0.02, 0.005, bluePcb, [sx * 0.78, -0.68, -0.025]);
          // Flat gold FFC ribbon cable from T-Con to Source-Driver bar
          box(g, 0.42, 0.08, 0.008, goldMat, [sx * 0.36, -0.50, -0.036], [0, 0, sx * 0.52]);
          for (let c = -2; c <= 2; c++) {
            const fx = sx * 0.78 + c * 0.22;
            rbox(g, 0.09, 0.09, 0.018, 0.003, goldMat, [fx, -0.73, 0.0]);
            box(g, 0.038, 0.022, 0.022, mat(0x0f172a), [fx, -0.73, -0.006]);
          }
        }
        buildWiringHarness(g, [
          {
            points: [
              [0.36, -0.28, -0.038],
              [0.58, -0.10, -0.038],
              [0.75, 0.05, -0.038],
            ],
            radius: 0.012,
            color: 0xd97706,
          },
          {
            points: [
              [-0.36, -0.28, -0.038],
              [-0.58, -0.10, -0.038],
              [-0.78, 0.05, -0.038],
            ],
            radius: 0.012,
            color: 0x38bdf8,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'ga-nitride-power-supply',
      name: 'GaN Switching Power Supply & Heat Sink Board',
      category: 'Power Delivery',
      isOuter: false,
      explodeOffset: [-0.95, 0.25, -0.65],
      desc: 'Converts 120V AC wall power into clean low-voltage DC for the Mini-LED matrix and audio amplifiers.',
      funFact: 'Big yellow transformers and cylindrical capacitors store energy bursts when a bright explosion flashes on screen!',
      build(g) {
        const psuPcb = pcbMat('#78350f');
        const yellowTape = mat(0xfacc15, { roughness: 0.35 });
        const capMat = brushedMetal(0x1e293b, { metalness: 0.75, roughness: 0.25 });
        rbox(g, 0.90, 0.72, 0.028, 0.015, psuPcb, [-0.78, 0.12, -0.032]);
        // Twin yellow high-frequency Planar Switching Transformers
        for (const ty of [-0.04, 0.22]) {
          rbox(g, 0.22, 0.18, 0.055, 0.008, yellowTape, [-0.76, ty, -0.055]);
          rbox(g, 0.26, 0.10, 0.035, 0.004, darkGraphite, [-0.76, ty, -0.05]);
        }
        // 6 High-voltage electrolytic bulk capacitors (horizontal cylinders)
        for (let c = 0; c < 4; c++) {
          cyl(g, 0.046, 0.046, 0.14, 16, capMat, [-1.04, -0.10 + c * 0.15, -0.058], [0, 0, Math.PI / 2]);
          cyl(g, 0.038, 0.038, 0.145, 12, aluPlate, [-1.04, -0.10 + c * 0.15, -0.058], [0, 0, Math.PI / 2]);
        }
        // Extruded aluminum GaN MOSFET heatsink combs + toroidal copper inductor coils
        for (let f = 0; f < 5; f++) {
          box(g, 0.014, 0.56, 0.048, aluPlate, [-0.46 - f * 0.026, 0.12, -0.055]);
        }
        torus(g, 0.055, 0.02, copper, [-0.78, -0.18, -0.055]);
      },
    },
    {
      id: 'dolby-atmos-surface-audio',
      name: '6.2.4ch Dolby Atmos Acoustic Surface Woofers & Up-Firing Drivers',
      category: '3D Spatial Audio',
      isOuter: false,
      explodeOffset: [1.55, -0.35, -0.85],
      desc: '8 rear subwoofers plus top-mounted drivers that bounce sound off your ceiling so helicopters sound like they are flying right overhead!',
      funFact: 'Object-Tracking Sound follows cars or actors across the screen so the voice comes from the exact spot where the person is standing!',
      build(g) {
        const rubberSurround = mat(0x0f172a, { roughness: 0.75 });
        for (const side of [-1, 1]) {
          // Vertical acoustic chamber enclosure housing 4 rear OTS Pro bass woofers per side (8 total)
          rbox(g, 0.42, 1.38, 0.045, 0.015, darkGraphite, [side * 1.34, 0.14, -0.038]);
          for (const dy of [-0.36, -0.04, 0.28, 0.60]) {
            cyl(g, 0.135, 0.12, 0.048, 22, titaniumBezel, [side * 1.34, dy, -0.052], [Math.PI / 2, 0, 0]);
            torus(g, 0.12, 0.018, rubberSurround, [side * 1.34, dy, -0.072]);
            cone(g, 0.105, 0.035, 20, aluPlate, [side * 1.34, dy, -0.062], [-Math.PI / 2, 0, 0]);
            sphere(g, 0.038, 12, 12, copper, [side * 1.34, dy, -0.075]);
          }
          // 2 Top-Edge Angled Up-Firing Dolby Atmos Sky-Channel Drivers per side (4 total)
          for (const tx of [0.58, 1.15]) {
            rbox(g, 0.28, 0.09, 0.06, 0.01, darkGraphite, [side * tx, 0.98, -0.038], [-0.45, 0, 0]);
            cyl(g, 0.065, 0.055, 0.03, 16, copper, [side * tx, 1.02, -0.048], [-0.45, 0, 0]);
          }
        }
      },
    },
    {
      id: 'rear-shell-pedestal',
      name: 'Brushed Metal Rear Enclosure & Weighted Pedestal Stand',
      category: 'Enclosure & Stand',
      isOuter: true,
      explodeOffset: [0, -0.85, -1.55],
      desc: 'Ultra-slim vented back shell with VESA wall-mount threads and a heavy cast-aluminum center pedestal.',
      funFact: 'Cable-management channels hidden inside the pedestal neck make power and HDMI cords vanish from sight!',
      build(g) {
        // Slim sculpted brushed-titanium rear backplate (z = -0.055 so it sits behind the internal layers without clipping front glass)
        rbox(g, 3.34, 1.90, 0.042, 0.018, darkGraphite, [0, 0.15, -0.065]);
        // Horizontal architectural micro-louvered rear pattern & recessed circular woofer acoustic grilles
        for (let ly = -0.62; ly <= 0.92; ly += 0.14) {
          box(g, 2.15, 0.012, 0.048, titaniumBezel, [0, ly, -0.068]);
        }
        // 4 VESA 600x400 mounting bolts on rear shell
        buildHexBoltArray(
          g,
          [
            [-0.55, 0.45, -0.09],
            [0.55, 0.45, -0.09],
            [-0.55, -0.15, -0.09],
            [0.55, -0.15, -0.09],
          ],
          { radius: 0.022, height: 0.02, finish: 'chrome', rot: [Math.PI / 2, 0, 0] },
        );
        // Sculpted twin-pillar angled cast-aluminum neck + bevel-chamfered V-pedestal baseplate
        for (const sx of [-0.18, 0.18]) {
          rbox(g, 0.12, 0.52, 0.09, 0.015, aluPlate, [sx, -0.86, -0.05], [0.12, 0, 0]);
        }
        rbox(g, 0.48, 0.36, 0.07, 0.015, titaniumBezel, [0, -0.84, -0.06]);
        // Weighted brushed-aluminum pedestal baseplate with chamfered V-wings
        rbox(g, 1.48, 0.048, 0.68, 0.016, aluPlate, [0, -1.09, 0.02]);
        rbox(g, 1.36, 0.025, 0.56, 0.01, titaniumBezel, [0, -1.06, 0.02]);
      },
    },
    {
      id: 'solarcell-voice-remote',
      name: 'SolarCell USB-C Voice Remote Control (No Disposable Batteries!)',
      category: 'Wireless Control',
      isOuter: false,
      explodeOffset: [1.85, -1.05, 1.25],
      desc: 'Charges its internal lithium capacitor from indoor room lamps AND by harvesting stray 2.4GHz Wi-Fi radio waves in the air!',
      funFact: 'An RF-harvesting antenna inside the remote turns unused Wi-Fi radio waves in your living room into trickle electricity!',
      build(g) {
        const remGroup = new THREE.Group();
        remGroup.position.set(1.48, -0.76, 0.48);
        remGroup.rotation.set(-0.35, -0.28, 0);
        // Brushed dark-titanium remote body
        rbox(remGroup, 0.22, 0.72, 0.042, 0.02, darkGraphite, [0, 0, 0]);
        // Red power button + voice microphone LED
        cyl(remGroup, 0.022, 0.022, 0.016, 14, carPaint(0xef4444), [-0.055, 0.28, 0.022], [Math.PI / 2, 0, 0]);
        sphere(remGroup, 0.008, 10, 10, emissiveMat(0x22c55e, 1.8), [0.0, 0.29, 0.022]);
        // Circular 5-way directional navigation wheel + center select button
        torus(remGroup, 0.058, 0.014, aluPlate, [0, 0.14, 0.022]);
        cyl(remGroup, 0.032, 0.032, 0.014, 16, titaniumBezel, [0, 0.14, 0.022], [Math.PI / 2, 0, 0]);
        // Volume & Channel metal rocker toggles
        rbox(remGroup, 0.032, 0.095, 0.018, 0.005, aluPlate, [-0.052, -0.02, 0.022]);
        rbox(remGroup, 0.032, 0.095, 0.018, 0.005, aluPlate, [0.052, -0.02, 0.022]);
        // 4 Streaming Shortcut Buttons (Netflix Red, Prime Blue, Disney+ Cyan, YouTube White)
        const btnColors = [0xef4444, 0x38bdf8, 0x1d4ed8, 0xf8fafc];
        for (let b = 0; b < 4; b++) {
          const bx = (b % 2 === 0 ? -0.045 : 0.045);
          const by = -0.12 - Math.floor(b / 2) * 0.055;
          rbox(remGroup, 0.068, 0.034, 0.014, 0.004, mat(btnColors[b]), [bx, by, 0.022]);
        }
        // Lower/Rear Photovoltaic SolarCell Charging Panel with gold cell grid lines + bottom USB-C port
        rbox(remGroup, 0.16, 0.12, 0.012, 0.004, mat(0x0f172a, { metalness: 0.6, roughness: 0.15 }), [0, -0.26, 0.02]);
        for (let sg = -0.05; sg <= 0.05; sg += 0.05) {
          box(remGroup, 0.15, 0.004, 0.014, goldMat, [0, -0.26 + sg * 0.6, 0.021]);
        }
        rbox(remGroup, 0.048, 0.014, 0.018, 0.004, chromeMat(), [0, -0.36, 0]);
        g.add(remGroup);
      },
    },
  ];

  return {
    id: 'mini-led-8k-tv',
    name: '85" QD-OLED / Mini-LED 8K Smart TV',
    brand: 'Samsung / Sony',
    badge: '33M 8K Pixels • Quantum Dot + Mini-LED',
    desc: 'Flagship 85-inch 8K theater display combining 5,000-zone Mini-LED backlighting, Nobel-Prize Quantum Dot nanocrystals, and Dolby Atmos.',
    cameraPos: [3.9, 2.2, 4.3],
    parts,
    quiz: [
      {
        q: 'Which Nobel-Prize-winning nanocrystal sheet inside the TV glows pure red and green depending on the size of each tiny crystal?',
        correctId: 'quantum-dot-nanocrystal-sheet',
        distractors: ['rear-shell-pedestal', 'solarcell-voice-remote', 'ga-nitride-power-supply'],
      },
      {
        q: 'How does the SolarCell TV remote stay charged without ever needing disposable AA or AAA batteries?',
        correctId: 'solarcell-voice-remote',
        distractors: ['tcon-timing-board', 'infinity-titanium-bezel', 'rgb-8k-pixel-matrix'],
      },
      {
        q: 'Why does a Mini-LED backlight use 5,000 independent dimming zones behind the screen?',
        correctId: 'mini-led-backlight-matrix',
        distractors: ['dolby-atmos-surface-audio', 'rear-shell-pedestal', 'neural-8k-ai-board'],
      },
      {
        q: 'Which circuit board acts like an orchestra conductor to time the voltage pulses for all 33 million 8K pixels?',
        correctId: 'tcon-timing-board',
        distractors: ['infinity-titanium-bezel', 'solarcell-voice-remote', 'dolby-atmos-surface-audio'],
      },
      {
        q: 'What nature-inspired nanostructure on the front glass stops living-room lamps from reflecting in the screen?',
        correctId: 'infinity-titanium-bezel',
        distractors: ['ga-nitride-power-supply', 'tcon-timing-board', 'rear-shell-pedestal'],
      },
    ],
  };
}

function buildTransparentOledTv() {
  const champagneAlu = brushedMetal(0xd6d3d1, { metalness: 0.9, roughness: 0.18 });
  const darkBase = brushedMetal(0x1e242b, { metalness: 0.85, roughness: 0.24 });
  const walnutWood = mat(0x78350f, { roughness: 0.55, metalness: 0.05 });
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });
  const goldMat = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.14 });
  const toledHudTex = makeTransparentOledHudTexture();

  const parts = [
    {
      id: 'transparent-oled-glass',
      name: '77" Self-Lit Transparent OLED Pixel Glass Panel',
      category: 'Transparent Display',
      isOuter: true,
      explodeOffset: [0, 0.35, 1.65],
      desc: 'Self-lit organic LEDs printed onto crystal-clear tempered glass with transparent Indium-Tin-Oxide wires so you can see right through the TV!',
      funFact: 'Because OLED pixels need no backlight, when a pixel is turned off it is 45% see-through like a window—making fish or holograms appear to float in mid-air!',
      build(g) {
        // 77" Crystal-Clear Tempered Glass Panel (45% see-through) with chamfered top & bottom champagne trim
        rbox(g, 3.24, 1.85, 0.026, 0.015, glassMat(0x38bdf8, 0.28), [0, 0.22, 0.12]);
        rbox(g, 3.26, 0.028, 0.036, 0.006, champagneAlu, [0, 1.145, 0.12]);
        // Transparent ITO micro-pixel grid & spatial HUD overlay plane
        if (toledHudTex) {
          const hudMat = new THREE.MeshStandardMaterial({
            map: toledHudTex,
            emissive: 0x38bdf8,
            emissiveMap: toledHudTex,
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.92,
            roughness: 0.2,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          box(g, 3.16, 1.78, 0.004, hudMat, [0, 0.22, 0.135]);
        }
        // Sculptural Holographic Neon Jellyfish & Bioluminescent Coral Rings floating inside the transparent OLED plane
        const neonCyan = emissiveMat(0x00f5d4, 1.65);
        const neonMagenta = emissiveMat(0xf72585, 1.65);
        const neonViolet = emissiveMat(0xa855f7, 1.55);
        const neonGold = emissiveMat(0xfef08a, 1.6);
        // Left Holographic Bioluminescent Jellyfish (dome bell + concentric pulsing rings + 7 flowing tentacles)
        const jBellGeo = new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
        const jBell = new THREE.Mesh(jBellGeo, neonCyan);
        jBell.position.set(-0.58, 0.38, 0.135);
        jBell.scale.set(1.1, 0.78, 0.22);
        jBell.rotation.z = 0.22;
        g.add(jBell);
        torus(g, 0.34, 0.022, neonMagenta, [-0.58, 0.36, 0.138], [1.1, -0.22, 0]);
        torus(g, 0.22, 0.016, neonGold, [-0.56, 0.42, 0.14], [1.1, -0.22, 0]);
        for (let t = -3; t <= 3; t++) {
          const tx = -0.58 + t * 0.075;
          tube(
            g,
            [
              [tx, 0.32, 0.138],
              [tx - 0.05 + Math.sin(t) * 0.04, 0.08, 0.14],
              [tx - 0.12 - Math.cos(t) * 0.04, -0.18, 0.138],
              [tx - 0.18, -0.40 + Math.abs(t) * 0.03, 0.136],
            ],
            0.011,
            t % 2 === 0 ? neonMagenta : neonCyan,
          );
        }
        // Right Holographic Spatial Weather / Orbital Ring Widget
        torus(g, 0.38, 0.026, neonCyan, [0.68, 0.28, 0.138]);
        torus(g, 0.28, 0.02, neonViolet, [0.68, 0.28, 0.14], [0.45, 0.55, 0]);
        sphere(g, 0.11, 16, 16, neonGold, [0.68, 0.28, 0.138]);
        for (let d = 0; d < 8; d++) {
          const a = (d / 8) * Math.PI * 2;
          sphere(g, 0.022, 10, 10, neonMagenta, [0.68 + Math.cos(a) * 0.38, 0.28 + Math.sin(a) * 0.38, 0.142]);
        }
      },
    },
    {
      id: 'motorized-contrast-shade',
      name: 'Motorized Black Contrast Film Roller Shade',
      category: 'Dual-Mode Contrast',
      isOuter: false,
      explodeOffset: [0, 0.85, -1.15],
      desc: 'Want to watch a dark movie with infinite contrast? Press a button and a motorized black shade rolls up from the base behind the clear glass!',
      funFact: 'This gives you two TVs in one: Transparent Hologram Mode by day, and Cinema Black OLED Mode at night!',
      build(g) {
        // Half-raised matte-black light-blocking contrast film sheet + upper anodized aluminum tension bar
        rbox(g, 3.16, 0.96, 0.018, 0.008, mat(0x090d16, { roughness: 0.28, metalness: 0.15 }), [0, -0.20, -0.05]);
        rbox(g, 3.22, 0.042, 0.036, 0.008, champagneAlu, [0, 0.29, -0.05]);
        // Motorized lower roller drum with helical torsion grooves & dual brass end-bearings
        cyl(g, 0.062, 0.062, 3.22, 24, champagneAlu, [0, -0.68, -0.05], [0, 0, Math.PI / 2]);
        for (let r = -1.4; r <= 1.4; r += 0.35) {
          torus(g, 0.065, 0.006, darkBase, [r, -0.68, -0.05], [0, Math.PI / 2, 0]);
        }
        for (const sx of [-1.58, 1.58]) {
          cyl(g, 0.072, 0.072, 0.08, 18, goldMat, [sx, -0.68, -0.05], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'structural-aluminum-pillars',
      name: 'Slim Anodized Aluminum Side Channels & Lift Motors',
      category: 'Mechanics',
      isOuter: true,
      explodeOffset: [1.85, 0.25, 0],
      desc: 'Guides the motorized black contrast screen up and down smoothly along hidden toothed belts.',
      funFact: 'Precision stepper motors keep the left and right edges of the rising shade synchronized to a fraction of a millimeter!',
      build(g) {
        for (const side of [-1, 1]) {
          const px = side * 1.63;
          // Extruded champagne-aluminum vertical pillar channel + dark inner belt guide track
          rbox(g, 0.068, 1.92, 0.14, 0.016, champagneAlu, [px, 0.22, 0.03]);
          box(g, 0.025, 1.84, 0.04, darkBase, [px - side * 0.02, 0.22, -0.02]);
          // Top idler pulley + bottom precision stepper lift motor & brass worm-gear box
          cyl(g, 0.028, 0.028, 0.04, 16, goldMat, [px, 1.12, -0.03], [Math.PI / 2, 0, 0]);
          cyl(g, 0.048, 0.048, 0.14, 18, darkBase, [px, -0.64, -0.05]);
          cyl(g, 0.036, 0.036, 0.06, 16, copper, [px, -0.54, -0.05]);
          // Tensioned toothed belt rungs inside pillar channel
          for (let by = -0.45; by <= 1.05; by += 0.15) {
            box(g, 0.03, 0.012, 0.025, goldMat, [px - side * 0.015, by, -0.03]);
          }
        }
      },
    },
    {
      id: 'base-console-housing',
      name: 'Architectural Base Console (Houses All Electronics!)',
      category: 'Base Console',
      isOuter: true,
      explodeOffset: [0, -1.45, 0],
      desc: 'Since you can see right through the glass screen, ZERO circuit boards can sit behind it—every chip, speaker, and power supply lives inside this sleek bottom bar!',
      funFact: 'Moving all the electronics into the bottom console bar leaves the glass panel above just 5 millimeters thick!',
      build(g) {
        // Main architectural base console chassis with top glass-slot gasket & walnut wood trim accent
        rbox(g, 3.38, 0.26, 0.46, 0.03, darkBase, [0, -0.82, 0.02]);
        rbox(g, 3.40, 0.032, 0.48, 0.01, champagneAlu, [0, -0.68, 0.02]);
        rbox(g, 3.32, 0.04, 0.44, 0.01, walnutWood, [0, -0.94, 0.02]);
        // Front perforated acoustic metallic grille slats across the base console
        for (let gx = -1.52; gx <= 1.52; gx += 0.08) {
          box(g, 0.018, 0.16, 0.02, champagneAlu, [gx, -0.82, 0.245]);
        }
        // Center front ambient LED status bar
        box(g, 0.36, 0.016, 0.024, emissiveMat(0x00f5d4, 1.8), [0, -0.68, 0.255]);
      },
    },
    {
      id: 'zero-connect-wireless-rx',
      name: '60GHz Wireless "Zero Connect" 4K/120Hz Video Receiver',
      category: 'Wireless Video',
      isOuter: false,
      explodeOffset: [-1.15, -0.95, 1.15],
      desc: 'Receives uncompressed 4K 120Hz video wirelessly across the room so no HDMI cables ever clutter the transparent glass!',
      funFact: 'Using 60GHz millimeter-wave radio beams, it transmits 30 gigabits per second—10 times faster than home Wi-Fi!',
      build(g) {
        const rfPcb = pcbMat('#1e3a8a');
        rbox(g, 0.72, 0.045, 0.32, 0.01, rfPcb, [-0.92, -0.82, 0.02]);
        // 16-Element Gold Millimeter-Wave Phased-Array Patch Antenna Matrix (8x2 grid)
        for (let ax = -3.5; ax <= 3.5; ax += 1) {
          for (const az of [-0.06, 0.06]) {
            box(g, 0.052, 0.012, 0.052, goldMat, [-0.92 + ax * 0.075, -0.79, 0.02 + az]);
          }
        }
        // EMI RF shield cans & coaxial pigtail feeds
        rbox(g, 0.18, 0.038, 0.12, 0.005, champagneAlu, [-0.68, -0.79, 0.02]);
        cyl(g, 0.016, 0.016, 0.06, 12, goldMat, [-0.56, -0.79, 0.08], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'zero-connect-transmitter-box',
      name: 'External Wireless Zero-Connect Media Cube',
      category: 'Wireless Transmitter',
      isOuter: false,
      explodeOffset: [-1.85, -0.85, 1.55],
      desc: 'Sits on a bookshelf across the room where you plug in your PlayStation, Xbox, and Apple TV—then beams the picture wirelessly to the TV!',
      funFact: 'A motorized antenna inside the cube rotates automatically to bounce the 60GHz beam around people walking through the room!',
      build(g) {
        const cx = -1.68;
        const cy = -0.76;
        const cz = 0.68;
        // Matte-black Wireless Zero-Connect Media Cube with vertical ventilation louvers
        rbox(g, 0.50, 0.46, 0.50, 0.035, darkBase, [cx, cy, cz]);
        for (let v = -0.18; v <= 0.18; v += 0.045) {
          box(g, 0.51, 0.32, 0.012, champagneAlu, [cx, cy, cz + v]);
        }
        // Top motorized rotating 60GHz directional beam-steering turret & signal-lock LED bar
        cyl(g, 0.18, 0.21, 0.05, 24, champagneAlu, [cx, cy + 0.24, cz]);
        rbox(g, 0.28, 0.035, 0.14, 0.01, darkBase, [cx, cy + 0.27, cz], [0.18, 0.42, 0]);
        box(g, 0.34, 0.024, 0.024, emissiveMat(0x00f5d4, 1.8), [cx, cy + 0.14, cz + 0.25]);
        // Rear / Side HDMI 2.1 (4x gold ports), USB, LAN Ethernet & AC Power I/O panel
        rbox(g, 0.38, 0.32, 0.02, 0.005, champagneAlu, [cx, cy - 0.02, cz - 0.25]);
        for (let h = 0; h < 3; h++) {
          rbox(g, 0.065, 0.032, 0.028, 0.003, goldMat, [cx - 0.11 + h * 0.09, cy + 0.06, cz - 0.26]);
        }
        rbox(g, 0.075, 0.055, 0.028, 0.004, copper, [cx + 0.11, cy - 0.06, cz - 0.26]);
      },
    },
    {
      id: 'alpha-11-ai-processor',
      name: 'Alpha 11 AI Processor & Transparent UI Engine',
      category: 'Processor',
      isOuter: false,
      explodeOffset: [0, -0.85, -1.15],
      desc: 'Renders special spatial depth shaders so 3D widgets, weather clouds, and aquarium art look like real objects inside the glass.',
      funFact: 'Ambient light sensors adjust pixel brightness so the floating holograms look vivid against both bright walls and windows!',
      build(g) {
        const pcb = pcbMat('#064e3b');
        rbox(g, 0.84, 0.045, 0.32, 0.012, pcb, [0, -0.82, 0.02]);
        // Alpha 11 AI SoC with skived copper heatsink fins + 4 DDR5 RAM modules + VRM chokes
        rbox(g, 0.24, 0.045, 0.22, 0.008, copper, [0, -0.78, 0.02]);
        for (let f = -4; f <= 4; f++) {
          box(g, 0.22, 0.025, 0.01, copper, [0, -0.75, 0.02 + f * 0.022]);
        }
        for (const mx of [-0.24, 0.24]) {
          for (const mz of [-0.06, 0.06]) {
            rbox(g, 0.09, 0.022, 0.07, 0.003, darkBase, [mx, -0.79, 0.02 + mz]);
          }
        }
        for (let c = -2; c <= 2; c++) {
          cyl(g, 0.022, 0.022, 0.035, 12, champagneAlu, [-0.36, -0.78, 0.02 + c * 0.055]);
        }
      },
    },
    {
      id: 'concealed-tcon-cof',
      name: 'Bottom-Edge Chip-on-Film (COF) Gate Drivers',
      category: 'Display Drivers',
      isOuter: false,
      explodeOffset: [0, -0.55, 0.95],
      desc: 'Fires signals upward from the bottom edge of the glass into microscopic transparent pixel lines.',
      funFact: 'Each pixel contains its own microscopic Thin-Film Transistor (TFT) switch invisible to the naked eye!',
      build(g) {
        // Full-width lower source-driver PCB bar + 16 gold-plated Chip-on-Film (COF) flex ribbon cables feeding up into glass bottom
        rbox(g, 3.08, 0.055, 0.07, 0.01, pcbMat('#064e3b'), [0, -0.70, 0.09]);
        for (let i = -7.5; i <= 7.5; i += 1) {
          const fx = i * 0.195;
          rbox(g, 0.11, 0.085, 0.028, 0.004, goldMat, [fx, -0.66, 0.115], [-0.25, 0, 0]);
          // Silicon source-driver flip-chip die bonded onto the center of each gold COF ribbon
          box(g, 0.055, 0.022, 0.032, darkBase, [fx, -0.66, 0.12], [-0.25, 0, 0]);
        }
      },
    },
    {
      id: 'front-firing-soundbar',
      name: '4.2ch Down/Front-Firing Console Soundbar Array',
      category: 'Audio',
      isOuter: false,
      explodeOffset: [1.15, -0.95, 1.15],
      desc: 'Neodymium racetrack speakers and twin bass radiators built into the base console.',
      funFact: 'Acoustic waveguides angle the sound upward so voices seem to come from the center of the glass above!',
      build(g) {
        // Acoustic enclosure bar + 4 racetrack neodymium drivers + 2 copper silk-dome tweeters + 2 bass reflex ports
        rbox(g, 0.92, 0.15, 0.30, 0.02, champagneAlu, [0.96, -0.82, 0.02]);
        for (const dx of [-0.30, -0.10, 0.10, 0.30]) {
          rbox(g, 0.14, 0.085, 0.04, 0.03, darkBase, [0.96 + dx, -0.82, 0.165]);
          rbox(g, 0.10, 0.048, 0.045, 0.018, copper, [0.96 + dx, -0.82, 0.168]);
        }
        for (const tx of [-0.41, 0.41]) {
          cyl(g, 0.038, 0.032, 0.04, 16, goldMat, [0.96 + tx, -0.82, 0.165], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'modular-credenza-legs',
      name: 'Modular Champagne Aluminum Floor Stand Frame',
      category: 'Stand',
      isOuter: false,
      explodeOffset: [0, -1.85, 0],
      desc: 'Allows the transparent TV to stand right in the middle of a room or in front of a window instead of against a blank wall!',
      funFact: 'Because you can see right through the screen, interior designers place it in front of sunny windows without blocking the view!',
      build(g) {
        // Architectural extruded champagne-aluminum & warm American walnut modular credenza stand frame
        for (const side of [-1, 1]) {
          const sx = side * 1.54;
          // Front & rear vertical tubular aluminum legs + bottom sled runner
          rbox(g, 0.055, 0.46, 0.055, 0.01, champagneAlu, [sx, -1.14, 0.22]);
          rbox(g, 0.055, 0.46, 0.055, 0.01, champagneAlu, [sx, -1.14, -0.18]);
          rbox(g, 0.065, 0.04, 0.52, 0.01, champagneAlu, [sx, -1.36, 0.02]);
          // Adjustable chrome floor leveling feet
          cyl(g, 0.032, 0.038, 0.025, 14, chromeMat(), [sx, -1.39, 0.22]);
          cyl(g, 0.032, 0.038, 0.025, 14, chromeMat(), [sx, -1.39, -0.18]);
        }
        // Lower open walnut & champagne-aluminum floating media credenza shelf
        rbox(g, 3.16, 0.042, 0.44, 0.012, walnutWood, [0, -1.22, 0.02]);
        rbox(g, 3.20, 0.024, 0.46, 0.008, champagneAlu, [0, -1.245, 0.02]);
        // Rear structural cross-bracing tension rods
        cyl(g, 0.012, 0.012, 3.12, 12, champagneAlu, [0, -1.06, -0.18], [0, 0, Math.PI / 2]);
      },
    },
  ];

  return {
    id: 'transparent-oled-tv',
    name: 'LG Signature 77" Transparent OLED TV',
    brand: 'LG Signature',
    badge: '45% See-Through OLED • Wireless 60GHz',
    desc: 'World’s first wireless transparent OLED television with a see-through self-lit glass panel, motorized black contrast shade, and 60GHz Zero-Connect box.',
    cameraPos: [3.9, 2.2, 4.3],
    parts,
    quiz: [
      {
        q: 'Why can you see right through a Transparent OLED TV when a regular LCD TV is solid black?',
        correctId: 'transparent-oled-glass',
        distractors: ['modular-credenza-legs', 'front-firing-soundbar', 'zero-connect-transmitter-box'],
      },
      {
        q: 'What rolls up behind the clear glass when you want to switch from Transparent Mode to high-contrast Movie Night Mode?',
        correctId: 'motorized-contrast-shade',
        distractors: ['alpha-11-ai-processor', 'concealed-tcon-cof', 'zero-connect-wireless-rx'],
      },
      {
        q: 'Where are all the circuit boards, power supply, and speakers hidden so they don’t block the clear glass screen?',
        correctId: 'base-console-housing',
        distractors: ['structural-aluminum-pillars', 'transparent-oled-glass', 'modular-credenza-legs'],
      },
      {
        q: 'How do video game consoles connect to this TV without HDMI cords dangling down the wall?',
        correctId: 'zero-connect-transmitter-box',
        distractors: ['motorized-contrast-shade', 'concealed-tcon-cof', 'front-firing-soundbar'],
      },
      {
        q: 'Why can you place a Transparent OLED TV right in front of a living-room window?',
        correctId: 'modular-credenza-legs',
        distractors: ['alpha-11-ai-processor', 'concealed-tcon-cof', 'zero-connect-wireless-rx'],
      },
    ],
  };
}

function buildImaxLaserCinema() {
  const darkCinema = mat(0x111827, { roughness: 0.45, metalness: 0.25 });
  const gunmetal = brushedMetal(0x334155, { metalness: 0.82, roughness: 0.26 });
  const velvetBlack = mat(0x090d16, { roughness: 0.92 });
  const plushRed = mat(0xb91c1c, { roughness: 0.65 });
  const copper = mat(0xd97724, { metalness: 0.88, roughness: 0.18 });
  const goldMat = brushedMetal(0xf59e0b, { metalness: 0.9, roughness: 0.16 });
  const imaxTex = makeImaxScreenTexture();
  const silverScreenMat = imaxTex
    ? new THREE.MeshStandardMaterial({
        map: imaxTex,
        emissiveMap: imaxTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.55,
        metalness: 0.35,
        roughness: 0.22,
        side: THREE.DoubleSide,
      })
    : mat(0xf8fafc, { metalness: 0.35, roughness: 0.22, side: THREE.DoubleSide });

  const parts = [
    {
      id: 'curved-perforated-screen',
      name: 'Giant Curved Perforated 1.43:1 Silver Screen',
      category: 'Projection Screen',
      isOuter: true,
      explodeOffset: [0, 0.25, 1.55],
      desc: 'Six-story-tall curved vinyl screen coated in real metallic silver paint and punched with millions of tiny 1mm holes so sound can pass straight through!',
      funFact: 'Why is an IMAX screen punched with millions of tiny holes? Because the giant center speakers sit *behind* the screen right where the actors’ mouths are!',
      build(g) {
        // Curved 1.43:1 silver perforated screen (center of curvature at z = 3.65, apex at z = -0.15)
        const geo = new THREE.CylinderGeometry(3.8, 3.8, 2.08, 44, 1, true, -0.46, 0.92);
        const m = new THREE.Mesh(geo, silverScreenMat);
        m.position.set(0, 0.22, 3.65);
        m.rotation.y = Math.PI;
        g.add(m);
        // Top & bottom curved acoustic black velvet masking borders
        for (const my of [1.28, -0.84]) {
          const maskGeo = new THREE.CylinderGeometry(3.79, 3.79, 0.08, 36, 1, true, -0.47, 0.94);
          const maskMesh = new THREE.Mesh(maskGeo, velvetBlack);
          maskMesh.position.set(0, my, 3.65);
          maskMesh.rotation.y = Math.PI;
          g.add(maskMesh);
        }
        // Left & right acoustic velvet masking wings + stage front safety balustrade rail with blue LED floor strip
        for (const sx of [-1, 1]) {
          rbox(g, 0.12, 2.18, 0.14, 0.01, velvetBlack, [sx * 1.71, 0.22, 0.24], [0, -sx * 0.38, 0]);
        }
        rbox(g, 3.52, 0.10, 0.28, 0.02, velvetBlack, [0, -0.92, 0.12]);
        box(g, 3.38, 0.018, 0.025, emissiveMat(0x38bdf8, 1.8), [0, -0.87, 0.26]);
      },
    },
    {
      id: 'screen-truss-frame',
      name: 'Tubular Steel Curved Screen Truss & Tension Springs',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, 0.25, 0.85],
      desc: 'Heavy steel space-frame behind the screen with ratusan of tension springs that stretch the screen drum-tight with zero wrinkles.',
      funFact: 'The screen sheet weighs over 800 pounds and arrives rolled up on a 75-foot pole!',
      build(g) {
        // 3D Tubular Steel Curved Space-Frame Truss behind the screen (chords, verticals, diagonals, and speaker catwalk)
        for (const ty of [-0.82, -0.12, 0.56, 1.24]) {
          const pts = [];
          for (let i = -4; i <= 4; i++) {
            const ang = (i / 4) * 0.45;
            pts.push([Math.sin(ang) * 3.88, ty, 3.65 - Math.cos(ang) * 3.88]);
          }
          tube(g, pts, 0.024, gunmetal);
        }
        // Vertical & diagonal steel space-frame truss columns + perimeter screen-tension springs
        for (let i = -4; i <= 4; i++) {
          const ang = (i / 4) * 0.45;
          const tx = Math.sin(ang) * 3.88;
          const tz = 3.65 - Math.cos(ang) * 3.88;
          cyl(g, 0.024, 0.024, 2.10, 10, gunmetal, [tx, 0.21, tz]);
          cyl(g, 0.022, 0.022, 2.10, 10, gunmetal, [tx, 0.21, tz - 0.18]);
          // Horizontal depth struts & diagonal truss webbing
          for (const by of [-0.78, -0.10, 0.58, 1.22]) {
            box(g, 0.025, 0.025, 0.18, gunmetal, [tx, by, tz - 0.09]);
            // Tension spring connecting truss to screen grommet
            cyl(g, 0.01, 0.01, 0.08, 8, goldMat, [tx * 0.98, by, tz + 0.04], [Math.PI / 2, 0, 0]);
          }
        }
        // Steep Stadium-Seating Auditorium Riser Tiers & Plush Red Cinema Seats in front of the projection booth (shows human scale!)
        for (let row = 0; row < 3; row++) {
          const ry = -0.96 + row * 0.16;
          const rz = 0.52 + row * 0.34;
          rbox(g, 2.85, 0.14, 0.32, 0.015, darkCinema, [0, ry, rz]);
          // Illuminated amber aisle safety step lights on left/right stairs
          for (const ax of [-1.32, 1.32]) {
            box(g, 0.12, 0.02, 0.04, emissiveMat(0xf59e0b, 1.6), [ax, ry + 0.07, rz + 0.14]);
          }
          // 8 Plush Red IMAX Stadium Seats per row with headrests & armrests
          for (let s = -3.5; s <= 3.5; s += 1) {
            const sx = s * 0.31;
            rbox(g, 0.22, 0.18, 0.06, 0.015, plushRed, [sx, ry + 0.16, rz + 0.06], [-0.15, 0, 0]);
            rbox(g, 0.22, 0.05, 0.16, 0.012, plushRed, [sx, ry + 0.08, rz - 0.02]);
          }
        }
      },
    },
    {
      id: 'behind-screen-horn-speakers',
      name: '5 Behind-the-Screen Proportional Point-Source Horn Speakers',
      category: '12-Channel Sound',
      isOuter: false,
      explodeOffset: [0, 0.45, -0.65],
      desc: 'Five towering concert-grade horn speaker stacks standing on scaffolding directly behind the perforated screen!',
      funFact: 'Because the speakers are hidden right behind the perforated screen, when a dinosaur roars on the left side of the frame, the sound comes from that exact spot!',
      build(g) {
        // Rear acoustic steel scaffolding platform supporting the 5 behind-screen horn stacks
        rbox(g, 3.15, 0.04, 0.42, 0.01, gunmetal, [0, -0.12, -0.42]);
        for (const x of [-1.26, -0.63, 0, 0.63, 1.26]) {
          const yaw = -x * 0.18; // Angled inward toward center of auditorium
          const spk = new THREE.Group();
          spk.position.set(x, 0.26, -0.42);
          spk.rotation.y = yaw;
          // 3-Way Proportional Point-Source Tower Cabinet
          rbox(spk, 0.36, 0.72, 0.34, 0.02, darkCinema, [0, 0, 0]);
          // Upper Bi-Radial High/Mid-Frequency Constant-Directivity Horn Flare + Copper Compression Throat
          rbox(spk, 0.30, 0.18, 0.06, 0.01, gunmetal, [0, 0.22, 0.16]);
          cone(spk, 0.11, 0.16, 16, copper, [0, 0.22, 0.12], [Math.PI / 2, 0, 0]);
          // Dual 15-inch Mid-Bass Woofer Cones (Middle & Lower) with anodized blue baskets & copper phase plugs
          for (const wy of [-0.02, -0.22]) {
            cyl(spk, 0.105, 0.09, 0.05, 18, brushedMetal(0x38bdf8), [0, wy, 0.16], [Math.PI / 2, 0, 0]);
            sphere(spk, 0.032, 12, 12, copper, [0, wy, 0.18]);
          }
          g.add(spk);
        }
      },
    },
    {
      id: 'sub-bass-array',
      name: '8× 18-Inch Sub-Bass Woofer Wall (12,000 Watts)',
      category: 'Earth-Shaking Bass',
      isOuter: false,
      explodeOffset: [0, -1.25, -0.65],
      desc: 'Produces 20Hz infrasonic bass waves so low you feel rocket launches and earthquakes in your chest!',
      funFact: 'A microphone in the theater checks the speakers before every morning show and calibrates all 12 channels automatically!',
      build(g) {
        // Massive 8 x 18-inch Sub-Bass Woofer Wall (2 rows x 4 columns = 8 drivers) in ported enclosures
        rbox(g, 2.38, 0.56, 0.42, 0.025, darkCinema, [0, -0.56, -0.42]);
        rbox(g, 2.44, 0.04, 0.46, 0.01, gunmetal, [0, -0.85, -0.42]);
        for (const wx of [-0.84, -0.28, 0.28, 0.84]) {
          for (const wy of [-0.43, -0.68]) {
            torus(g, 0.11, 0.018, gunmetal, [wx, wy, -0.21]);
            cyl(g, 0.105, 0.085, 0.06, 20, copper, [wx, wy, -0.22], [Math.PI / 2, 0, 0]);
            sphere(g, 0.036, 12, 12, darkCinema, [wx, wy, -0.19]);
          }
          // Rectangular bass-reflex slot ports between cabinets
          box(g, 0.18, 0.035, 0.04, velvetBlack, [wx, -0.555, -0.205]);
        }
      },
    },
    {
      id: 'screen-shaker-transducers',
      name: 'Motorized Screen-Shaker Laser Speckle Reducers',
      category: 'Laser Optics',
      isOuter: false,
      explodeOffset: [1.75, 0.85, 0.25],
      desc: 'Pure laser light creates a glittery interference pattern called "laser speckle"—so tiny motors vibrate the screen imperceptibly 100 times a second to make the image silky smooth!',
      funFact: 'You can’t see the screen vibrating at all, but that microscopic shimmy erases laser sparkle completely!',
      build(g) {
        for (const side of [-1, 1]) {
          const sx = side * 1.54;
          // Red anodized dual-coil voice-coil linear shaker actuator + mounting bracket + spring-loaded screen damper pad
          rbox(g, 0.22, 0.28, 0.22, 0.02, carPaint(0xef4444), [sx, 0.88, -0.02]);
          cyl(g, 0.065, 0.065, 0.32, 16, gunmetal, [sx, 0.88, -0.02]);
          cyl(g, 0.028, 0.028, 0.24, 14, chromeMat(), [sx, 0.88, 0.12], [Math.PI / 2, 0, 0]);
          cyl(g, 0.06, 0.06, 0.03, 16, copper, [sx, 0.88, 0.22], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'dual-4k-laser-projectors',
      name: 'Twin Side-by-Side 4K RGB Laser Projection Engines',
      category: 'Projection Booth',
      isOuter: false,
      explodeOffset: [0, -0.35, 2.25],
      desc: 'Two giant 1,200-pound laser projectors shine two overlapping 4K images (offset by half a pixel!) onto the screen for 3D and super-resolution.',
      funFact: 'Overlapping two 4K projectors by half a pixel ("sub-pixel alignment") makes the curved screen 50% sharper and twice as bright!',
      build(g) {
        // Heavy motorized dual-projector alignment pedestal table + projection booth porthole window frame
        rbox(g, 1.56, 0.06, 0.88, 0.015, gunmetal, [0, -0.58, 1.48]);
        for (const lx of [-0.68, 0.68]) {
          for (const lz of [1.14, 1.82]) {
            cyl(g, 0.038, 0.045, 0.36, 12, gunmetal, [lx, -0.78, lz]);
            cyl(g, 0.055, 0.055, 0.04, 12, goldMat, [lx, -0.60, lz]);
          }
        }
        for (const x of [-0.40, 0.40]) {
          const toeIn = -x * 0.14; // Converged onto the center of the curved screen
          const proj = new THREE.Group();
          proj.position.set(x, -0.34, 1.48);
          proj.rotation.y = toeIn;
          // Main Barco/IMAX 4K RGB Laser Projector Chassis + ribbed side cooling louvers + top exhaust blower turret
          rbox(proj, 0.58, 0.40, 0.78, 0.03, darkCinema, [0, 0, 0]);
          rbox(proj, 0.60, 0.12, 0.68, 0.015, gunmetal, [0, -0.12, 0.02]);
          cyl(proj, 0.14, 0.15, 0.08, 20, gunmetal, [0, 0.22, -0.12]);
          // Side operator telemetry LCD touchscreen + status LEDs
          rbox(proj, 0.02, 0.14, 0.22, 0.005, emissiveMat(0x38bdf8, 1.3), [x < 0 ? -0.295 : 0.295, 0.04, 0.08]);
          // Multi-element Anamorphic 4K Projection Lens Barrel with gold focus/zoom rings & front glass element
          cyl(proj, 0.135, 0.155, 0.16, 24, gunmetal, [0, 0.02, -0.44], [Math.PI / 2, 0, 0]);
          cyl(proj, 0.115, 0.135, 0.18, 24, chromeMat(), [0, 0.02, -0.58], [Math.PI / 2, 0, 0]);
          torus(proj, 0.128, 0.014, goldMat, [0, 0.02, -0.52]);
          torus(proj, 0.118, 0.012, goldMat, [0, 0.02, -0.62]);
          cyl(proj, 0.108, 0.108, 0.02, 20, glassMat(0x38bdf8, 0.65), [0, 0.02, -0.67], [Math.PI / 2, 0, 0]);
          // Twin overlapping volumetric RGB laser light beams projecting toward the screen
          cone(proj, 0.44, 0.92, 20, glassMat(0x38bdf8, 0.20), [0, 0.14, -1.14], [-Math.PI / 2 + 0.12, 0, 0]);
          g.add(proj);
        }
      },
    },
    {
      id: 'invar-dmd-prism-core',
      name: 'Invar-Alloy Prism & 3× DLP Digital Micromirror Chips',
      category: 'Optical Core',
      isOuter: false,
      explodeOffset: [1.35, -0.35, 2.15],
      desc: 'Inside each projector, 3 chips covered in 8.8 million microscopic tilting mirrors bounce Red, Green, and Blue laser beams through an Invar prism!',
      funFact: 'The prism frame is made of "Invar"—a special nickel-iron alloy that refuses to expand or shrink when heated, keeping the pixels aligned to 1/10th of a hair!',
      build(g) {
        // Precision Invar-alloy optical cores inside both Left & Right projectors with trichroic RGB prisms & 3x liquid-cooled DMD chips
        for (const x of [-0.40, 0.40]) {
          const core = new THREE.Group();
          core.position.set(x, -0.31, 1.42);
          // Invar low-expansion structural cage + central dichromatic RGB glass prism block
          rbox(core, 0.28, 0.24, 0.28, 0.015, gunmetal, [0, 0, 0]);
          box(core, 0.15, 0.15, 0.15, glassMat(0x38bdf8, 0.65), [0, 0.02, 0]);
          // 3x DLP Digital Micromirror (DMD) boards (Red on left, Green on rear, Blue on right) with copper liquid cold-plates
          rbox(core, 0.04, 0.14, 0.14, 0.005, emissiveMat(0xef4444, 1.5), [-0.13, 0.02, 0]);
          rbox(core, 0.035, 0.16, 0.16, 0.005, copper, [-0.165, 0.02, 0]);
          rbox(core, 0.14, 0.14, 0.04, 0.005, emissiveMat(0x22c55e, 1.5), [0, 0.02, 0.13]);
          rbox(core, 0.16, 0.16, 0.035, 0.005, copper, [0, 0.02, 0.165]);
          rbox(core, 0.04, 0.14, 0.14, 0.005, emissiveMat(0x3b82f6, 1.5), [0.13, 0.02, 0]);
          rbox(core, 0.035, 0.16, 0.16, 0.005, copper, [0.165, 0.02, 0]);
          g.add(core);
        }
      },
    },
    {
      id: 'fiber-optic-laser-racks',
      name: 'External 60,000-Lumen RGB Laser Light Racks & Chillers',
      category: 'Laser Light Source',
      isOuter: false,
      explodeOffset: [-1.45, -0.45, 2.15],
      desc: 'Armored fiber-optic cables pipe pure Red (638nm), Green (532nm), and Blue (465nm) laser light from liquid-cooled laser racks into the projectors.',
      funFact: 'At 60,000 lumens, the laser beam is so intense you could see the movie clearly even if someone turned all the theater ceiling lights on!',
      build(g) {
        // External 60,000-Lumen RGB Laser Server Rack + Liquid-Cooling Chiller Tower
        rbox(g, 0.48, 0.78, 0.48, 0.02, darkCinema, [-1.22, -0.42, 1.48]);
        rbox(g, 0.36, 0.68, 0.44, 0.02, gunmetal, [-1.66, -0.47, 1.48]);
        // Red (638nm), Green (532nm), and Blue (465nm) rack-mount laser diode modules with illuminated status bars
        const laserModules = [
          [-0.14, 0xef4444],
          [-0.28, 0x22c55e],
          [-0.42, 0x3b82f6],
          [-0.56, 0xef4444],
          [-0.70, 0x3b82f6],
        ];
        for (const [ly, col] of laserModules) {
          rbox(g, 0.44, 0.09, 0.49, 0.008, gunmetal, [-1.22, ly, 1.48]);
          box(g, 0.36, 0.045, 0.50, emissiveMat(col, 1.6), [-1.22, ly, 1.48]);
        }
        // Chiller dual heat-exchanger fans + coolant distribution manifold
        for (const fy of [-0.30, -0.62]) {
          torus(g, 0.11, 0.015, darkCinema, [-1.66, fy, 1.71]);
          cyl(g, 0.09, 0.09, 0.02, 16, copper, [-1.66, fy, 1.71], [Math.PI / 2, 0, 0]);
        }
        // Armored fiber-optic umbilical cables (gold/orange) & liquid-cooling hoses (blue/red) snaking into both projectors
        buildWiringHarness(g, [
          {
            points: [
              [-0.98, -0.22, 1.55],
              [-0.72, -0.26, 1.75],
              [-0.40, -0.28, 1.84],
            ],
            radius: 0.018,
            color: 0xf59e0b,
            braided: true,
          },
          {
            points: [
              [-0.98, -0.36, 1.62],
              [-0.25, -0.42, 1.92],
              [0.40, -0.28, 1.84],
            ],
            radius: 0.018,
            color: 0xf59e0b,
            braided: true,
          },
          {
            points: [
              [-1.48, -0.52, 1.62],
              [-0.85, -0.54, 1.82],
              [-0.40, -0.44, 1.82],
            ],
            radius: 0.015,
            color: 0x0284c7,
          },
          {
            points: [
              [-1.48, -0.62, 1.62],
              [-0.20, -0.56, 1.94],
              [0.40, -0.44, 1.82],
            ],
            radius: 0.015,
            color: 0xdc2626,
          },
        ]);
      },
    },
    {
      id: '3d-dichroic-filters',
      name: 'Dolby/IMAX Laser Wavelength 3D Dichroic Lenses',
      category: '3D Stereoscopic Optics',
      isOuter: false,
      explodeOffset: [0, 0.55, 2.15],
      desc: 'Left projector shines one exact shade of Red/Green/Blue for your Left eye; Right projector shines a slightly shifted shade for your Right eye!',
      funFact: 'Unlike dark polarized 3D glasses, wavelength-filter 3D glasses stay bright even if you tilt your head sideways!',
      build(g) {
        // Motorized linear slide-in 3D dichroic wavelength filter frames in front of Left (640/532/465nm) & Right (615/515/445nm) lenses
        for (const [x, col] of [[-0.40, 0xf43f5e], [0.40, 0x06b6d4]]) {
          rbox(g, 0.34, 0.035, 0.08, 0.008, gunmetal, [x, -0.14, 0.76]);
          torus(g, 0.145, 0.018, goldMat, [x, -0.32, 0.76]);
          cyl(g, 0.135, 0.135, 0.035, 24, glassMat(col, 0.68), [x, -0.32, 0.76], [Math.PI / 2, 0, 0]);
          // Stepper actuator motor for sliding filter in/out for 3D vs 2D features
          cyl(g, 0.028, 0.028, 0.09, 14, copper, [x + 0.16, -0.14, 0.76], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'ceiling-surround-arrays',
      name: 'Overhead & Side Wall 12-Channel Surround Speakers',
      category: 'Immersive Sound',
      isOuter: false,
      explodeOffset: [0, 1.65, 0.95],
      desc: 'Four ceiling-mounted overhead speakers and side arrays wrap the audience in a 3D hemisphere of sound.',
      funFact: 'Uncompressed digital theater audio has 10 times the dynamic range of home streaming!',
      build(g) {
        // Overhead ceiling steel truss bar + 4 overhead point-source surround cabinets with exposed woofers & horns
        cyl(g, 0.022, 0.022, 3.35, 12, gunmetal, [0, 1.32, 0.88], [0, 0, Math.PI / 2]);
        for (const x of [-1.35, -0.45, 0.45, 1.35]) {
          rbox(g, 0.28, 0.24, 0.26, 0.02, darkCinema, [x, 1.16, 0.88], [0.48, 0, 0]);
          cyl(g, 0.075, 0.065, 0.04, 16, copper, [x, 1.12, 0.77], [Math.PI / 2 + 0.48, 0, 0]);
          box(g, 0.04, 0.14, 0.04, gunmetal, [x, 1.26, 0.88]);
        }
        // Left & Right Side-Wall & Rear-Corner 12-Channel Surround Speaker Arrays with dual drivers
        for (const sx of [-1, 1]) {
          for (const [sz, sy] of [[0.65, 0.35], [1.45, 0.55]]) {
            const sideSpk = new THREE.Group();
            sideSpk.position.set(sx * 1.78, sy, sz);
            sideSpk.rotation.y = -sx * 1.15;
            rbox(sideSpk, 0.24, 0.38, 0.22, 0.02, darkCinema, [0, 0, 0]);
            cyl(sideSpk, 0.075, 0.065, 0.04, 16, brushedMetal(0x38bdf8), [0, -0.07, 0.10], [Math.PI / 2, 0, 0]);
            cone(sideSpk, 0.065, 0.08, 14, copper, [0, 0.09, 0.09], [Math.PI / 2, 0, 0]);
            g.add(sideSpk);
          }
        }
      },
    },
  ];

  return {
    id: 'imax-laser-cinema',
    name: 'IMAX Dual-4K Laser Cinema System',
    brand: 'IMAX Laser',
    badge: '60,000 Lumens • Perforated Screen + 12ch Horn Audio',
    desc: 'Giant-screen theater engineering featuring twin 4K RGB laser projectors, a curved perforated silver screen, and 5 giant horn speaker stacks behind the screen.',
    cameraPos: [4.2, 2.3, 4.6],
    parts,
    quiz: [
      {
        q: 'Why is a giant IMAX theater screen punched with millions of tiny 1-millimeter holes?',
        correctId: 'curved-perforated-screen',
        distractors: ['dual-4k-laser-projectors', 'fiber-optic-laser-racks', 'invar-dmd-prism-core'],
      },
      {
        q: 'Where are the 5 main dialog and sound-effect horn speakers located in an IMAX theater?',
        correctId: 'behind-screen-horn-speakers',
        distractors: ['screen-shaker-transducers', '3d-dichroic-filters', 'fiber-optic-laser-racks'],
      },
      {
        q: 'Why do tiny "Screen Shaker" motors vibrate the giant screen 100 times a second during a laser movie?',
        correctId: 'screen-shaker-transducers',
        distractors: ['sub-bass-array', 'screen-truss-frame', 'ceiling-surround-arrays'],
      },
      {
        q: 'Why does an IMAX Laser booth shine TWO 4K projectors onto the screen at the exact same time?',
        correctId: 'dual-4k-laser-projectors',
        distractors: ['behind-screen-horn-speakers', 'screen-truss-frame', 'sub-bass-array'],
      },
      {
        q: 'Which metal alloy inside the optical core refuses to expand when hot so all 8.8 million micromirrors stay aligned?',
        correctId: 'invar-dmd-prism-core',
        distractors: ['curved-perforated-screen', 'ceiling-surround-arrays', 'sub-bass-array'],
      },
    ],
  };
}

export const TV_MODELS = [
  build85InchMiniLed8KTv(),
  buildTransparentOledTv(),
  buildImaxLaserCinema(),
];
