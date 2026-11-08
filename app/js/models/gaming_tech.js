// Wave 3A: Gaming Consoles & Controllers (`gaming`) — 3 Flagship 10-Part 3D Models
// 1. `ps5-pro-console` — PlayStation 5 Pro Console
// 2. `dualsense-controller` — DualSense Wireless Adaptive Controller
// 3. `handheld-hybrid-console` — Handheld Hybrid OLED Console

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

function buildTechSpecModel(cfg) {
  const primary = carPaint(cfg.primaryHex, { metalness: 0.25, roughness: 0.16 });
  const accent = carPaint(cfg.accentHex || 0x2563eb);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const gunmetal = brushedMetal(0x334155, { metalness: 0.85, roughness: 0.22 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.88, roughness: 0.2 });
  const copper = brushedMetal(0xc25e1a, { metalness: 0.94, roughness: 0.14 });
  const gold = brushedMetal(0xfbbf24, { metalness: 0.92, roughness: 0.16 });
  const chrome = chromeMat();
  const white = mat(0xf8fafc, { roughness: 0.22, metalness: 0.06, clearcoat: 0.5 });
  const matteBlack = mat(0x111827, { roughness: 0.62, metalness: 0.12 });
  const carbon = carbonFiberMat([5, 5]);
  const glass = glassMat(0x93c5fd, 0.36);
  const parts = cfg.partsSpec.map(([id, name, category, isOuter, explodeOffset, desc, funFact, fn]) => ({
    id,
    name,
    category,
    isOuter,
    explodeOffset,
    desc,
    funFact,
    build(g) {
      fn(g, { primary, accent, darkSteel, gunmetal, alu, copper, gold, chrome, white, matteBlack, carbon, glass });
    },
  }));
  return {
    id: cfg.id,
    name: cfg.name,
    brand: cfg.brand,
    badge: cfg.badge,
    desc: cfg.desc,
    cameraPos: cfg.cameraPos || [3.5, 2.0, 3.7],
    parts,
    quiz: cfg.quiz,
  };
}

export const GAMING_MODELS = [
  // ==========================================================================
  // 1. PLAYSTATION 5 PRO CONSOLE
  // ==========================================================================
  buildTechSpecModel({
    id: 'ps5-pro-console',
    name: 'PlayStation 5 Pro Console',
    brand: 'Sony Interactive Entertainment',
    badge: '16.7 TFLOPS RDNA • Liquid-Metal TIM • 120mm Blower • PSSR AI',
    desc: 'Towering next-gen living-room console engineered around a custom 4nm AMD APU cooled by gallium-indium liquid metal, a massive copper vapor-chamber heatpipe array, a dual-intake 120mm centrifugal blower fan, and tri-slotted aerodynamic faceplates.',
    primaryHex: 0xf8fafc,
    accentHex: 0x2563eb,
    cameraPos: [3.55, 2.05, 3.75],
    partsSpec: [
      [
        'sculpted-quad-faceplates-fins',
        'Quad Split Matte-White Faceplates & Tri-Blade Aero Gill Vents',
        'Exterior Shell',
        true,
        [0, 0.25, 1.45],
        'Four snap-off sculpted white ABS side covers split across the middle by three angled black aerodynamic intake gills.',
        'Every PS5 Pro side panel snaps onto tool-free ball studs so owners can vacuum dust catchers or upgrade M.2 storage in 60 seconds!',
        (g, m) => {
          for (const side of [-1, 1]) {
            const z = side * 0.245;
            // Upper & lower sculpted flared white plates + 3 black aero gill slats in center waist
            rbox(g, 0.96, 0.94, 0.032, 0.014, m.white, [0, 0.56, z], [side * -0.025, 0, 0]);
            rbox(g, 0.98, 0.96, 0.032, 0.014, m.white, [0, -0.54, z], [side * 0.02, 0, 0]);
            for (const gy of [-0.03, 0.01, 0.05]) {
              box(g, 0.98, 0.018, 0.038, m.matteBlack, [0.01, gy, side * 0.232], [0, 0, -0.18]);
            }
          }
          // Vertical circular chrome/acrylic stand base
          cyl(g, 0.44, 0.48, 0.032, 36, m.chrome, [0, -1.06, 0]);
          cyl(g, 0.36, 0.38, 0.038, 32, m.matteBlack, [0, -1.04, 0]);
        },
      ],
      [
        'gloss-center-spine-led-lightbars',
        'Piano-Black Center Spine, Dual USB-C 10Gbps Ports & RGB Light Blades',
        'Front I/O & Illumination',
        true,
        [1.35, 0.25, 0],
        'Curved high-gloss black central tower chassis flanked by diffused blue/amber PlayStation light-guide strips, power button, and dual front USB-C ports.',
        'The diffused LED light blades use edge-lit acrylic waveguides to signal console state: pulsing blue on boot, crisp white in game, and warm amber in Rest Mode!',
        (g, m) => {
          rbox(g, 0.92, 2.04, 0.39, 0.045, m.matteBlack, [0, 0, 0]);
          for (const z of [-0.205, 0.205]) {
            const strip = box(g, 0.018, 1.88, 0.014, emissiveMat(0x3b82f6, 1.35), [0.455, 0.04, z]);
            strip.userData.isRgbBlade = true;
          }
          // Dual front USB-C ports + tactile power key
          for (const py of [-0.42, -0.52]) {
            rbox(g, 0.018, 0.018, 0.042, 0.005, m.chrome, [0.462, py, 0]);
          }
          box(g, 0.016, 0.065, 0.014, m.gunmetal, [0.462, -0.68, 0]);
        },
      ],
      [
        'custom-rdna-apu-gddr6-board',
        'Custom 4nm RDNA 16.7-TFLOPS APU, 16GB GDDR6 Ring & Multilayer Mainboard',
        'Compute & AI Silicon',
        false,
        [0, 0.15, -1.25],
        'High-density 12-layer mainboard carrying the monolithic AMD Zen 2 + 60-CU RDNA GPU die with PlayStation Spectral Super Resolution (PSSR) AI upscaling hardware and 8 GDDR6 memory chips.',
        'Eight 2GB GDDR6 memory chips surround the APU in a tight U-ring so textures stream across the 256-bit bus at 576 gigabytes per second!',
        (g, m) => {
          rbox(g, 0.72, 1.18, 0.026, 0.01, pcbMat('#0b5d3b'), [-0.04, -0.06, -0.04]);
          // Mirror-polished silicon APU die on substrate + 8 surrounding GDDR6 packages
          rbox(g, 0.22, 0.22, 0.014, 0.004, m.alu, [0, 0.06, -0.018]);
          rbox(g, 0.11, 0.14, 0.018, 0.003, m.chrome, [0, 0.06, -0.012]);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            rbox(g, 0.055, 0.045, 0.012, 0.003, m.matteBlack, [Math.cos(a) * 0.165, 0.06 + Math.sin(a) * 0.165, -0.018]);
          }
          // Rear HDMI 2.1, 2.5GbE Ethernet & USB Type-A shield cans
          for (const ry of [-0.48, -0.34, -0.20]) {
            rbox(g, 0.09, 0.07, 0.055, 0.005, m.alu, [-0.38, ry, -0.02]);
          }
        },
      ],
      [
        'liquid-metal-tim-barrier',
        'Gallium-Indium Liquid-Metal Thermal Interface & Foam Spill Dam',
        'Liquid-Metal Cooling',
        false,
        [0.45, 0.65, -0.95],
        'Micro-grooved silver-plated coldplate contact zone and hermetically sealed sponge-rubber barrier holding electrically conductive liquid gallium-indium alloy.',
        'Liquid metal conducts heat over 8 times better than standard thermal paste—Sony spent two years designing a leak-proof rubber dam so a drop never touches the motherboard!',
        (g, m) => {
          rbox(g, 0.24, 0.24, 0.020, 0.008, m.matteBlack, [0, 0.06, 0.015]);
          rbox(g, 0.15, 0.17, 0.022, 0.004, m.gold, [0, 0.06, 0.016]);
          // Glistening liquid-metal gallium puddle + laser micro-channels
          cyl(g, 0.052, 0.052, 0.025, 24, m.chrome, [0, 0.06, 0.018], [Math.PI / 2, 0, 0]);
          buildHexBoltArray(g, [[-0.10, 0.16, 0.03], [0.10, 0.16, 0.03], [-0.10, -0.04, 0.03], [0.10, -0.04, 0.03]], {
            radius: 0.011,
            height: 0.014,
            finish: 'chrome',
            rot: [Math.PI / 2, 0, 0],
          });
        },
      ],
      [
        'copper-vapor-chamber-heatsink',
        '3D Copper Vapor-Chamber Base, 5 Sintered Heatpipes & Louvered Fin Stack',
        'Phase-Change Heatsink',
        false,
        [-0.85, 0.15, 0.85],
        'Heavy copper vapor chamber and five curved sintered-wick copper heatpipes routing 220W of GPU heat into a dense aluminum fin array matching the performance of a huge vapor chamber.',
        'Inside each sealed copper pipe, pure water boils into steam at the hot chip, races to the cool fins at sonic speed, condenses back to liquid, and wicks back by capillary action!',
        (g, m) => {
          rbox(g, 0.28, 0.28, 0.028, 0.008, m.copper, [0, 0.06, 0.05]);
          buildFinArray(g, [-0.08, -0.18, 0.09], 28, [0.46, 0.004, 0.22], [0, 0.026, 0], m.alu);
          // 5 curved copper heatpipes looping from coldplate through fin stack
          for (let i = -2; i <= 2; i++) {
            tube(
              g,
              [
                [i * 0.038, 0.06, 0.06],
                [i * 0.055 - 0.06, -0.12, 0.14],
                [i * 0.055 - 0.10, -0.46, 0.10],
              ],
              0.012,
              m.copper,
              false,
              24,
            );
          }
        },
      ],
      [
        'centrifugal-120mm-blower-fan',
        'Dual-Sided 120mm 23-Blade Centrifugal Blower Fan',
        'Active Airflow',
        false,
        [0, 1.35, 0],
        'Double-sided 120mm × 45mm centrifugal squirrel-cage fan pulling cool room air in through both side faceplates simultaneously and exhausting out the rear spine.',
        'Backward-curved blades of varying thickness break up acoustic resonance so the fan moves salon-dryer airflow at a whisper!',
        (g, m) => {
          const shroud = new THREE.Group();
          shroud.position.set(0.02, 0.64, 0);
          g.add(shroud);
          torus(shroud, 0.255, 0.028, m.matteBlack, [0, 0, 0]);

          const rotor = new THREE.Group();
          rotor.userData.driveAnim = 'fan';
          rotor.userData.spinAxis = 'z';
          shroud.add(rotor);
          cyl(rotor, 0.085, 0.085, 0.16, 24, m.gunmetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let b = 0; b < 19; b++) {
            const a = (b / 19) * Math.PI * 2;
            box(
              rotor,
              0.008,
              0.13,
              0.14,
              m.alu,
              [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0],
              [0, 0, a + 0.42],
            );
          }
        },
      ],
      [
        'pcie4-ssd-m2-expansion-bay',
        '2TB Custom 12-Channel PCIe 4.0 NVMe SSD & M.2 Expansion Heatsink Slot',
        'Ultra-High-Speed Storage',
        false,
        [0.95, 0.65, -0.65],
        'Onboard 2TB NAND flash array controlled by a custom hardware Kraken decompression I/O co-processor plus a shielded user-accessible M.2 2280 NVMe expansion bay.',
        'Hardware Kraken decompression streams compressed game worlds at up to 9 GB/s—erasing elevator loading corridors from open-world games!',
        (g, m) => {
          // Shielded M.2 2280 aluminum bay + black NVMe SSD stick with copper heatsink & gold M-key pins
          rbox(g, 0.42, 0.14, 0.04, 0.008, m.alu, [0.08, 0.36, 0.11]);
          rbox(g, 0.34, 0.095, 0.022, 0.004, pcbMat('#111827'), [0.08, 0.36, 0.135]);
          buildFinArray(g, [0.06, 0.36, 0.152], 12, [0.004, 0.085, 0.018], [0.022, 0, 0], m.copper);
          box(g, 0.024, 0.075, 0.006, m.gold, [0.245, 0.36, 0.135]);
        },
      ],
      [
        'detachable-uhd-bluray-drive',
        'Modular Snap-In 4K Ultra-HD Blu-ray Optical Disc Drive & Laser Sled',
        'Optical Media Module',
        false,
        [0.85, -0.65, 1.05],
        'Tool-free modular optical drive with vibration-isolating elastomer grommets, dual-wavelength 405nm blue-violet laser pickup sled, and spinning 100GB triple-layer disc.',
        'A 4K Blu-ray laser uses a 405-nanometer violet-blue beam so narrow that microscopic data pits sit just 0.32 microns apart—packing 100 gigabytes onto one plastic disc!',
        (g, m) => {
          const drv = new THREE.Group();
          drv.position.set(0.06, -0.48, 0.16);
          g.add(drv);
          rbox(drv, 0.56, 0.58, 0.085, 0.014, m.gunmetal, [0, 0, 0]);
          // Spinning rainbow-iridescent 120mm Blu-ray disc + violet 405nm laser diode lens
          const disc = new THREE.Group();
          disc.position.set(0, 0, 0.048);
          disc.userData.driveAnim = 'fan';
          disc.userData.spinAxis = 'z';
          drv.add(disc);
          cyl(disc, 0.21, 0.21, 0.006, 32, m.glass, [0, 0, 0], [Math.PI / 2, 0, 0]);
          torus(disc, 0.045, 0.012, m.chrome, [0, 0, 0]);
          sphere(drv, 0.016, 12, 10, emissiveMat(0x8b5cf6, 1.6), [0.11, -0.06, 0.046]);
        },
      ],
      [
        'wifi7-antenna-wireless-module',
        'Wi-Fi 7 (802.11be) Tri-Band Antenna Array & Ultra-Low-Latency Bluetooth Radio',
        'RF & Connectivity',
        false,
        [-0.95, 0.95, 0],
        'Stamped sheet-metal 6 GHz / 5 GHz / 2.4 GHz MIMO diversity antennas mounted along the upper frame connected via micro-coaxial cables to the Wi-Fi 7 RF shield.',
        'Wi-Fi 7 Multi-Link Operation (MLO) bonds 5 GHz and 6 GHz channels simultaneously for cloud streaming and multi-gigabit game downloads!',
        (g, m) => {
          rbox(g, 0.14, 0.12, 0.025, 0.005, m.alu, [-0.26, 0.44, -0.02]);
          for (const [ax, ay, az] of [[-0.36, 0.84, -0.14], [0.34, 0.86, 0.14]]) {
            rbox(g, 0.12, 0.045, 0.018, 0.004, m.gold, [ax, ay, az]);
            tube(g, [[-0.26, 0.44, -0.02], [ax * 0.6, 0.68, az * 0.5], [ax, ay, az]], 0.005, m.matteBlack, false, 18);
          }
        },
      ],
      [
        'internal-390w-psu-wedge',
        'Sculpted Wedge 390W Switching Power Supply Unit (PSU)',
        'Power Delivery',
        false,
        [-0.95, -1.25, 0],
        'Contoured L-wedge internal AC-to-12V DC power supply nestled into the bottom base with perforated airflow honeycomb vents, PFC toroidal inductors, and C8 AC inlet.',
        'Unlike external power bricks that clutter TV cabinets, the sculpted wedge PSU sits right in the exhaust airstream so the main 120mm fan cools it on the way out!',
        (g, m) => {
          rbox(g, 0.78, 0.28, 0.34, 0.024, m.matteBlack, [-0.02, -0.84, 0]);
          // Internal toroidal copper PFC choke + primary bulk capacitors visible through vent window
          torus(g, 0.058, 0.022, m.copper, [-0.14, -0.84, 0.12], [0, Math.PI / 2, 0]);
          for (const cx of [0.06, 0.18]) {
            cyl(g, 0.035, 0.035, 0.12, 16, carPaint(0x1d4ed8), [cx, -0.84, 0.11]);
          }
          rbox(g, 0.04, 0.055, 0.09, 0.008, m.gunmetal, [-0.41, -0.88, 0]);
        },
      ],
    ],
    quiz: [
      {
        q: 'Why did Sony engineer a hermetically sealed sponge-rubber dam around the PS5 Pro’s processor coldplate?',
        correctId: 'liquid-metal-tim-barrier',
        distractors: ['sculpted-quad-faceplates-fins', 'internal-390w-psu-wedge', 'wifi7-antenna-wireless-module'],
      },
      {
        q: 'Which double-sided 120mm component pulls cool air in through both side panels at once?',
        correctId: 'centrifugal-120mm-blower-fan',
        distractors: ['detachable-uhd-bluray-drive', 'pcie4-ssd-m2-expansion-bay', 'gloss-center-spine-led-lightbars'],
      },
      {
        q: 'Which custom 4nm silicon chip runs PlayStation Spectral Super Resolution (PSSR) AI upscaling surrounded by 8 GDDR6 memory packages?',
        correctId: 'custom-rdna-apu-gddr6-board',
        distractors: ['internal-390w-psu-wedge', 'sculpted-quad-faceplates-fins', 'detachable-uhd-bluray-drive'],
      },
      {
        q: 'How does the optical drive pack up to 100 gigabytes onto a single 4K Ultra-HD Blu-ray disc?',
        correctId: 'detachable-uhd-bluray-drive',
        distractors: ['pcie4-ssd-m2-expansion-bay', 'copper-vapor-chamber-heatsink', 'gloss-center-spine-led-lightbars'],
      },
      {
        q: 'Which phase-change copper assembly boils and condenses pure water inside five sintered tubes to carry 220W of heat to the fins?',
        correctId: 'copper-vapor-chamber-heatsink',
        distractors: ['wifi7-antenna-wireless-module', 'pcie4-ssd-m2-expansion-bay', 'sculpted-quad-faceplates-fins'],
      },
    ],
  }),

  // ==========================================================================
  // 2. DUALSENSE WIRELESS ADAPTIVE CONTROLLER
  // ==========================================================================
  buildTechSpecModel({
    id: 'dualsense-controller',
    name: 'DualSense Wireless Adaptive Controller',
    brand: 'Sony Interactive Entertainment',
    badge: 'Worm-Gear Adaptive Triggers • Dual Voice-Coil Haptics • 6-Axis IMU',
    desc: 'Iconic two-tone wireless gamepad dissected to reveal its motorized worm-gear L2/R2 adaptive triggers, dual voice-coil linear haptic actuators in the grips, Alps/Hall-effect dual-axis thumbstick gimbals, capacitive touchpad, and 6-axis MEMS gyroscope.',
    primaryHex: 0xf8fafc,
    accentHex: 0x2563eb,
    cameraPos: [3.25, 2.15, 3.45],
    partsSpec: [
      [
        'two-tone-ergonomic-shell',
        'Two-Tone Micro-Textured White Upper Shell & Black Lower Bridge',
        'Ergonomic Enclosure',
        true,
        [0, 1.15, 0.65],
        'Sculpted matte-white swept grip shells molded with 40,000 microscopic △○✕□ symbols for grip traction over a snap-fit matte-black inner trim.',
        'Look closely under a magnifying glass: the DualSense grip texture is actually tens of thousands of tiny raised PlayStation triangle, circle, cross, and square icons!',
        (g, m) => {
          // Central upper faceplate + left/right swept ergonomic grip horns
          rbox(g, 1.18, 0.24, 0.72, 0.08, m.white, [0, 0.08, 0]);
          for (const sx of [-1, 1]) {
            tube(
              g,
              [
                [sx * 0.48, 0.10, -0.10],
                [sx * 0.68, 0.02, 0.18],
                [sx * 0.76, -0.16, 0.52],
              ],
              0.185,
              m.white,
              false,
              24,
            );
            // Lower black inner grip accent trim
            tube(
              g,
              [
                [sx * 0.36, -0.06, 0.05],
                [sx * 0.52, -0.12, 0.28],
                [sx * 0.60, -0.20, 0.50],
              ],
              0.115,
              m.matteBlack,
              false,
              20,
            );
          }
        },
      ],
      [
        'adaptive-wormgear-triggers',
        'Motorized Worm-Gear L2 & R2 Adaptive Trigger Modules',
        'Force-Feedback Triggers',
        false,
        [0, 0.85, -1.25],
        'Twin independent L2/R2 trigger housings packing a high-torque DC micro-motor, brass helical worm screw, reduction gear sector, and potentiometer angle sensor.',
        'When you draw a bowstring or slam ABS brakes in a racing game, the tiny worm gear physically pushes back against your index finger in real time!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            const mod = new THREE.Group();
            mod.position.set(sx * 0.48, 0.08, -0.38);
            g.add(mod);
            // Curved matte-black L2/R2 trigger paddle + L1/R1 bumper
            rbox(mod, 0.22, 0.15, 0.16, 0.035, m.matteBlack, [0, -0.02, -0.08], [-0.35, 0, 0]);
            rbox(mod, 0.24, 0.065, 0.10, 0.02, m.matteBlack, [0, 0.09, -0.04]);
            // Internal DC motor + spinning brass worm gear + white nylon sector gear + return spring
            cyl(mod, 0.045, 0.045, 0.14, 16, m.alu, [0, 0.02, 0.06], [0, 0, Math.PI / 2]);
            const worm = new THREE.Group();
            worm.position.set(sx * 0.08, 0.02, 0.06);
            worm.userData.driveAnim = 'fan';
            worm.userData.spinAxis = 'x';
            mod.add(worm);
            buildCoilSpring(worm, [0, 0, 0], 0.09, 0.022, 0.005, 5, m.gold);
            cyl(mod, 0.065, 0.065, 0.022, 18, m.white, [0, -0.03, 0.02], [0, Math.PI / 2, 0]);
          }
        },
      ],
      [
        'voice-coil-haptic-actuators',
        'Dual Linear Voice-Coil Haptic Actuators (Left & Right Grips)',
        'Wideband Haptics',
        false,
        [0, -0.85, 1.15],
        'Audio-driven linear resonant voice-coil actuators inside each grip handle suspending a heavy tungsten magnet mass on twin leaf springs.',
        'Instead of old spinning lopsided weights, Voice-Coil Actuators work just like stereo speaker woofers—playing actual sound waveforms through your palms so you feel individual raindrops!',
        (g, m) => {
          for (const sx of [-1, 1]) {
            const vca = new THREE.Group();
            vca.position.set(sx * 0.68, -0.08, 0.36);
            vca.rotation.set(0.32, sx * -0.24, 0);
            g.add(vca);
            cyl(vca, 0.115, 0.115, 0.30, 24, m.darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
            // Cutaway copper voice coil + reciprocating neodymium-tungsten mass
            torus(vca, 0.092, 0.018, m.copper, [0, 0, 0]);
            const slug = new THREE.Group();
            slug.userData.driveAnim = 'piston';
            slug.userData.pistonBaseY = 0;
            slug.userData.pistonBaseZ = 0;
            slug.userData.pistonPhase = sx > 0 ? 0 : Math.PI;
            slug.userData.bankSide = 1;
            slug.userData.bankAngle = 0;
            vca.add(slug);
            cyl(slug, 0.068, 0.068, 0.14, 18, m.chrome, [0, 0, 0], [Math.PI / 2, 0, 0]);
          }
        },
      ],
      [
        'symmetrical-thumbstick-gimbals',
        'Symmetrical Dual-Axis Analog Thumbstick Gimbals & L3/R3 Tactile Domes',
        'Analog Control',
        false,
        [0, 0.95, 0.85],
        'Twin symmetrical X/Y gimbal boxes with centering coil springs, orthogonal angle sensors, clicky L3/R3 switches, and concave rubberized thumb caps.',
        'Two interlocking U-shaped rocker yokes split diagonal thumb circles cleanly into pure X-axis and Y-axis rotations!',
        (g, m) => {
          for (const sx of [-0.28, 0.28]) {
            const jg = new THREE.Group();
            jg.position.set(sx, 0.12, 0.16);
            g.add(jg);
            // Green/metal gimbal cube + turquoise sensor pods + vertical stem + concave rubber cap
            rbox(jg, 0.16, 0.12, 0.16, 0.012, m.alu, [0, -0.04, 0]);
            box(jg, 0.18, 0.09, 0.03, carPaint(0x0d9488), [0, -0.04, 0.085]);
            box(jg, 0.03, 0.09, 0.18, carPaint(0x0d9488), [0.085, -0.04, 0]);
            cyl(jg, 0.032, 0.045, 0.14, 16, m.matteBlack, [0, 0.08, 0]);
            cyl(jg, 0.115, 0.095, 0.036, 24, m.matteBlack, [0, 0.155, 0]);
            torus(jg, 0.105, 0.012, m.gunmetal, [0, 0.172, 0], [Math.PI / 2, 0, 0]);
          }
        },
      ],
      [
        'capacitive-touchpad-lightbar',
        '2-Point Capacitive Touchpad, Click Microswitch & Edge-Lit Light Bar',
        'Touch & Light UI',
        true,
        [0, 1.35, -0.25],
        'Trapezoidal central capacitive touch surface with a mechanical click button underneath, framed by left and right glowing blue LED light-pipe wings.',
        'An electrostatic grid etched under the matte touchpad tracks two simultaneous fingers at 1200 DPI without needing a glass screen!',
        (g, m) => {
          const padPts = [
            [-0.29, -0.16],
            [0.29, -0.16],
            [0.25, 0.16],
            [-0.25, 0.16],
          ];
          extrudeProfile(g, padPts, 0.026, m.white, [0, 0.22, -0.14], [Math.PI / 2, 0, 0], 0.008);
          // Glowing PlayStation blue light-bar frame around left & right edges of touchpad
          for (const sx of [-1, 1]) {
            const lb = box(g, 0.016, 0.014, 0.30, emissiveMat(0x2563eb, 1.5), [sx * 0.285, 0.225, -0.14], [0, sx * -0.12, 0]);
            lb.userData.isRgbBlade = true;
          }
          box(g, 0.38, 0.012, 0.24, pcbMat('#0b5d3b'), [0, 0.195, -0.14]);
        },
      ],
      [
        'sacred-buttons-dpad-membrane',
        'Crystal Acrylic Action Buttons (△○✕□), Precision D-Pad & Silicone Dome Pad',
        'Tactile Inputs',
        true,
        [0.95, 0.85, 0],
        'Double-shot clear acrylic face buttons on the right, single-pivot cross D-Pad on the left, and conductive carbon-pill silicone elastomer membranes.',
        'When you press X, a tiny black carbon puck under the squishy silicone dome bridges two interlocking gold fingers on the flex circuit!',
        (g, m) => {
          // Left D-Pad clear-topped directional keys
          for (const [dx, dz] of [[0, -0.09], [0, 0.09], [-0.09, 0], [0.09, 0]]) {
            rbox(g, 0.068, 0.045, 0.068, 0.012, m.glass, [-0.46 + dx, 0.22, -0.06 + dz]);
          }
          // Right △○✕□ crystal buttons + translucent silicone membrane sheet
          const colors = [0x10b981, 0xef4444, 0x3b82f6, 0xec4899];
          const offsets = [[0, -0.10], [0.10, 0], [0, 0.10], [-0.10, 0]];
          offsets.forEach(([dx, dz], idx) => {
            cyl(g, 0.042, 0.042, 0.042, 20, m.glass, [0.46 + dx, 0.22, -0.06 + dz]);
            torus(g, 0.024, 0.005, carPaint(colors[idx]), [0.46 + dx, 0.242, -0.06 + dz], [Math.PI / 2, 0, 0]);
          });
          rbox(g, 0.26, 0.012, 0.26, 0.01, mat(0xe2e8f0, { roughness: 0.5, opacity: 0.75 }), [0.46, 0.185, -0.06]);
        },
      ],
      [
        'mainboard-imu-bluetooth-soc',
        'Main Logic PCB, 6-Axis MEMS Gyro/Accelerometer & Bluetooth 5.1 Audio DSP',
        'Motion & Wireless Logic',
        false,
        [0, -0.35, -0.95],
        'Contoured multi-layer motherboard integrating the custom haptic/audio DSP, Bluetooth 5.1 transceiver, USB-C charging controller, and 6-axis MEMS inertial measurement unit.',
        'Inside the tiny 3-millimeter MEMS gyroscope chip, microscopic silicon tuning forks vibrate to measure tilt, aim, and flicks 1,000 times per second!',
        (g, m) => {
          rbox(g, 0.92, 0.022, 0.48, 0.01, pcbMat('#0b5d3b'), [0, 0.04, -0.02]);
          // Main custom SoC + 6-axis MEMS IMU chip + top USB-C port
          rbox(g, 0.14, 0.016, 0.14, 0.004, m.matteBlack, [-0.12, 0.056, -0.04]);
          rbox(g, 0.065, 0.016, 0.065, 0.003, m.gold, [0.14, 0.056, -0.02]);
          rbox(g, 0.09, 0.036, 0.06, 0.008, m.chrome, [0, 0.06, -0.35]);
        },
      ],
      [
        'speaker-dual-beamforming-mics',
        'Integrated Micro-Speaker Chamber, Mute LED Button & Dual Beamforming Mics',
        'Controller Audio & Voice',
        false,
        [-0.95, 0.45, 0.45],
        'Sealed acoustic speaker driver mounted above the PS button plus front/bottom MEMS microphones that cancel button-click noise for headset-free voice chat.',
        'Having a second microphone on the bottom lets the DSP subtract background TV sound and thumbstick clicks from your voice!',
        (g, m) => {
          // Elliptical acoustic micro-speaker driver + copper coil + orange Mute LED button + 3.5mm TRRS jack
          cyl(g, 0.085, 0.085, 0.038, 22, m.matteBlack, [0, 0.12, 0.04]);
          torus(g, 0.052, 0.010, m.copper, [0, 0.14, 0.04], [Math.PI / 2, 0, 0]);
          rbox(g, 0.065, 0.025, 0.026, 0.006, emissiveMat(0xf97316, 1.1), [0, 0.18, 0.24]);
          cyl(g, 0.024, 0.024, 0.07, 14, m.gold, [0, 0.01, 0.32], [Math.PI / 2, 0, 0]);
        },
      ],
      [
        'pouch-1560mah-lipo-battery',
        '1,560 mAh Rechargeable Lithium-Polymer Pouch Battery & Cradle',
        'Power Cell',
        false,
        [0, -1.15, 0],
        'High-density 3.65V 1,560 mAh lithium-ion polymer cell in a flame-retardant protective cradle with thermistor protection and 3-pin JST plug.',
        'Adaptive triggers and dual voice-coil haptics draw big current spikes during explosions—requiring a 56% larger battery than the previous generation controller!',
        (g, m) => {
          rbox(g, 0.48, 0.095, 0.34, 0.018, m.gunmetal, [0, -0.06, 0.02]);
          rbox(g, 0.44, 0.075, 0.30, 0.014, m.alu, [0, -0.05, 0.02]);
          // Red/Black/White 3-wire battery harness
          tube(g, [[0.22, -0.04, 0.02], [0.28, 0.01, -0.04], [0.20, 0.04, -0.06]], 0.008, carPaint(0xdc2626), false, 14);
        },
      ],
      [
        'structural-midframe-flex-ribbon',
        'Internal Structural Midframe Chassis & Gold-Plated Conductive Flex Film',
        'Internal Skeleton',
        false,
        [-0.95, -0.45, -0.45],
        'Glass-fiber-reinforced internal subframe carrying all button guide towers and an ultra-thin green/amber polyester printed conductive ribbon circuit.',
        'Instead of soldering 20 separate wires to every button, a single paper-thin flexible circuit sheet folds neatly over the entire internal skeleton!',
        (g, m) => {
          rbox(g, 1.02, 0.08, 0.56, 0.03, m.darkSteel, [0, 0.09, -0.02]);
          // Translucent emerald/gold conductive flex ribbon wings extending to left D-pad & right action buttons
          for (const sx of [-0.44, 0.44]) {
            rbox(g, 0.24, 0.006, 0.24, 0.002, mat(0x10b981, { roughness: 0.3, opacity: 0.8 }), [sx, 0.145, -0.06]);
          }
          buildHexBoltArray(g, [[-0.42, 0.135, 0.18], [0.42, 0.135, 0.18], [-0.42, 0.135, -0.22], [0.42, 0.135, -0.22]], {
            radius: 0.012,
            height: 0.012,
            finish: 'black',
          });
        },
      ],
    ],
    quiz: [
      {
        q: 'Which mechanism inside the L2 and R2 triggers physically pushes back against your finger when drawing a bowstring?',
        correctId: 'adaptive-wormgear-triggers',
        distractors: ['symmetrical-thumbstick-gimbals', 'capacitive-touchpad-lightbar', 'two-tone-ergonomic-shell'],
      },
      {
        q: 'How do the DualSense grips simulate textures like raindrops or ice instead of generic buzzes?',
        correctId: 'voice-coil-haptic-actuators',
        distractors: ['pouch-1560mah-lipo-battery', 'sacred-buttons-dpad-membrane', 'structural-midframe-flex-ribbon'],
      },
      {
        q: 'Which microscopic 3mm chip on the mainboard measures controller tilt, motion aiming, and flicks 1,000 times per second?',
        correctId: 'mainboard-imu-bluetooth-soc',
        distractors: ['two-tone-ergonomic-shell', 'pouch-1560mah-lipo-battery', 'capacitive-touchpad-lightbar'],
      },
      {
        q: 'Why does the DualSense controller carry TWO microphones (front and bottom) instead of just one?',
        correctId: 'speaker-dual-beamforming-mics',
        distractors: ['symmetrical-thumbstick-gimbals', 'adaptive-wormgear-triggers', 'structural-midframe-flex-ribbon'],
      },
      {
        q: 'What hidden detail forms the non-slip micro-texture molded across the white DualSense outer shell?',
        correctId: 'two-tone-ergonomic-shell',
        distractors: ['pouch-1560mah-lipo-battery', 'mainboard-imu-bluetooth-soc', 'speaker-dual-beamforming-mics'],
      },
    ],
  }),

  // ==========================================================================
  // 3. HANDHELD HYBRID OLED CONSOLE
  // ==========================================================================
  buildTechSpecModel({
    id: 'handheld-hybrid-console',
    name: 'Handheld Hybrid OLED Console',
    brand: 'Nintendo Switch OLED / Steam Deck Class',
    badge: '7.4" HDR OLED • Snap-Rail Detachable Controllers • Copper Blower',
    desc: 'Portable-to-TV hybrid gaming console featuring a vivid bezel-less OLED touch display, magnetic/rail detachable left and right wireless controllers, a custom ARM/NVIDIA Tegra SoC, flat copper heatpipe + micro-blower thermal loop, and wide magnesium kickstand.',
    primaryHex: 0x0f172a,
    accentHex: 0xef4444,
    cameraPos: [3.45, 1.95, 3.65],
    partsSpec: [
      [
        'vivid-oled-laminated-display',
        '7.4-Inch Laminated Vivid OLED Multi-Touch Display & Gorilla Glass',
        'Display Stack',
        true,
        [0, 0.25, 1.35],
        'Self-emissive RGB OLED panel optically bonded to capacitive multi-touch glass for infinite contrast, 0.1ms pixel response, and razor-thin bezels.',
        'Unlike LCD screens, OLED pixels emit their own light and switch completely OFF for true black—saving battery power in dark space or dungeon scenes!',
        (g, m) => {
          rbox(g, 1.56, 0.92, 0.022, 0.024, m.matteBlack, [0, 0.04, 0.068]);
          box(g, 1.44, 0.82, 0.024, screenMat('ios'), [0, 0.04, 0.070]);
        },
      ],
      [
        'detachable-left-controller-rail',
        'Detachable Neon-Cyan Left Controller, Steel Slide Rail & HD Rumble',
        'Left Modular Controller',
        true,
        [-1.45, 0.15, 0.25],
        'Snap-off wireless left controller with an anodized steel slide-lock rail, Hall-effect analog stick, directional buttons, Bluetooth radio, and linear resonant HD Rumble.',
        'Detaching both side controllers instantly turns one handheld tablet into a two-player tabletop arcade!',
        (g, m) => {
          const cyan = carPaint(0x06b6d4);
          rbox(g, 0.34, 0.92, 0.13, 0.06, cyan, [-0.96, 0.04, 0.01]);
          // Anodized black metal locking rail + pogo contacts along inner edge
          box(g, 0.032, 0.82, 0.065, m.darkSteel, [-0.785, 0.04, 0.01]);
          // Left analog thumbstick + 4 directional buttons + L/ZL shoulder triggers
          cyl(g, 0.078, 0.065, 0.045, 20, m.matteBlack, [-0.96, 0.24, 0.085], [Math.PI / 2, 0, 0]);
          for (const [dx, dy] of [[0, 0.06], [0, -0.06], [-0.06, 0], [0.06, 0]]) {
            cyl(g, 0.024, 0.024, 0.025, 14, m.matteBlack, [-0.96 + dx, -0.10 + dy, 0.078], [Math.PI / 2, 0, 0]);
          }
          rbox(g, 0.22, 0.06, 0.11, 0.02, m.matteBlack, [-0.96, 0.50, -0.01]);
        },
      ],
      [
        'detachable-right-controller-ir',
        'Detachable Neon-Red Right Controller, IR Motion Camera & NFC Reader',
        'Right Modular Controller',
        true,
        [1.45, 0.15, 0.25],
        'Snap-off wireless right controller housing ABXY buttons, offset right analog stick with under-cap NFC antenna coil, HD Rumble, and bottom infrared depth camera.',
        'Hidden directly beneath the right thumbstick cap sits a circular copper NFC antenna coil that scans smart collectible figurines on contact!',
        (g, m) => {
          const neonRed = carPaint(0xf43f5e);
          rbox(g, 0.34, 0.92, 0.13, 0.06, neonRed, [0.96, 0.04, 0.01]);
          box(g, 0.032, 0.82, 0.065, m.darkSteel, [0.785, 0.04, 0.01]);
          for (const [dx, dy] of [[0, 0.065], [0, -0.065], [-0.065, 0], [0.065, 0]]) {
            cyl(g, 0.026, 0.026, 0.026, 16, m.matteBlack, [0.96 + dx, 0.24 + dy, 0.078], [Math.PI / 2, 0, 0]);
          }
          cyl(g, 0.078, 0.065, 0.045, 20, m.matteBlack, [0.96, -0.10, 0.085], [Math.PI / 2, 0, 0]);
          torus(g, 0.055, 0.005, m.copper, [0.96, -0.10, 0.065]);
          rbox(g, 0.22, 0.06, 0.11, 0.02, m.matteBlack, [0.96, 0.50, -0.01]);
        },
      ],
      [
        'custom-hybrid-soc-lpddr5-board',
        'Custom Hybrid ARM/GPU SoC, Dual LPDDR5X Packages & Main Logic Board',
        'Hybrid Silicon',
        false,
        [0.35, 0.65, -0.85],
        'Compact L-shaped high-density PCB integrating the custom low-power GPU/CPU SoC that scales dynamically from 8W handheld battery mode to full-clocked 4K TV docked mode.',
        'Docking the tablet onto wall power lets the GPU more than double its clock frequency within milliseconds—jumping from 720p/1080p handheld to crisp big-screen TV output!',
        (g, m) => {
          rbox(g, 0.68, 0.72, 0.022, 0.008, pcbMat('#0b5d3b'), [0.22, 0.04, 0.0]);
          // Shiny silicon die + twin LPDDR5X DRAM chips + EMI shield frame
          rbox(g, 0.16, 0.16, 0.014, 0.004, m.alu, [0.14, 0.06, 0.016]);
          rbox(g, 0.095, 0.095, 0.018, 0.003, m.chrome, [0.14, 0.06, 0.02]);
          for (const dy of [0.18, -0.06]) {
            rbox(g, 0.11, 0.055, 0.014, 0.003, m.matteBlack, [0.14, dy, 0.016]);
          }
        },
      ],
      [
        'copper-heatpipe-micro-blower',
        'Flat Sintered Copper Heatpipe, Top Fin Radiator & Ultra-Slim Micro-Blower',
        'Active Pocket Cooling',
        false,
        [0, 1.25, -0.35],
        'Whisper-quiet 7mm-thick centrifugal micro-fan blowing across a top-edge copper fin stack fed by a flattened L-bend phase-change copper heatpipe.',
        'Squeezing active cooling into a 14mm tablet requires flattening a round copper heatpipe to just 2.2mm thick without crushing the capillary wick inside!',
        (g, m) => {
          // Flat copper heatpipe rising from SoCcoldplate to top exhaust fin array
          rbox(g, 0.14, 0.14, 0.012, 0.004, m.copper, [0.14, 0.06, 0.032]);
          tube(g, [[0.14, 0.06, 0.036], [0.12, 0.36, 0.036], [-0.08, 0.44, 0.02]], 0.022, m.copper, false, 18);
          buildFinArray(g, [-0.08, 0.45, 0.02], 16, [0.004, 0.065, 0.08], [0.016, 0, 0], m.copper);

          // Spinning 55mm micro-blower rotor
          const fan = new THREE.Group();
          fan.position.set(-0.08, 0.18, 0.02);
          fan.userData.driveAnim = 'fan';
          fan.userData.spinAxis = 'z';
          g.add(fan);
          cyl(fan, 0.145, 0.145, 0.028, 24, m.matteBlack, [0, 0, 0], [Math.PI / 2, 0, 0]);
          cyl(fan, 0.055, 0.055, 0.034, 18, m.alu, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let b = 0; b < 15; b++) {
            const a = (b / 15) * Math.PI * 2;
            box(fan, 0.006, 0.065, 0.026, m.white, [Math.cos(a) * 0.095, Math.sin(a) * 0.095, 0], [0, 0, a + 0.35]);
          }
        },
      ],
      [
        'lithium-pouch-battery-pack',
        'High-Capacity 16Wh Dual-Cell Lithium-Ion Polymer Battery',
        'Portable Energy',
        false,
        [-0.55, -0.75, -0.65],
        'Large flat black pouch battery occupying nearly half the internal tablet volume to sustain up to 9 hours of untethered 60fps gameplay.',
        'Battery engineers fill every spare millimeter on the left side of the chassis while keeping all hot chips and fans isolated on the right!',
        (g, m) => {
          rbox(g, 0.62, 0.74, 0.055, 0.015, m.matteBlack, [-0.38, 0.02, 0.0]);
          box(g, 0.54, 0.64, 0.058, mat(0x1e293b, { roughness: 0.4 }), [-0.38, 0.02, 0.0]);
          tube(g, [[-0.07, 0.18, 0.01], [0.02, 0.18, 0.01]], 0.009, carPaint(0xef4444), false, 8);
        },
      ],
      [
        'rom-gamecard-microsd-reader',
        'Spring-Loaded Flash Game-Card Slot & MicroSD Express Reader',
        'Removable Media',
        false,
        [0.85, 1.05, 0.25],
        'Top-loading non-volatile flash ROM cartridge socket with gold spring fingers plus a rear under-kickstand MicroSD Express expansion reader.',
        'Game cartridges are coated in denatonium benzoate—the most bitter harmless substance known to science—so toddlers and pets never swallow them!',
        (g, m) => {
          // Shielded cartridge reader cage + inserted red/dark flash game cartridge with gold pins
          rbox(g, 0.22, 0.24, 0.036, 0.006, m.alu, [0.46, 0.34, 0.02]);
          rbox(g, 0.17, 0.22, 0.022, 0.006, m.darkSteel, [0.46, 0.44, 0.02]);
          box(g, 0.14, 0.10, 0.025, carPaint(0xef4444), [0.46, 0.47, 0.02]);
          for (let p = -3; p <= 3; p++) {
            box(g, 0.012, 0.05, 0.024, m.gold, [0.46 + p * 0.018, 0.35, 0.02]);
          }
        },
      ],
      [
        'magnesium-alloy-midframe-speakers',
        'Die-Cast Magnesium Internal Roll-Cage & Stereo Front-Firing Speakers',
        'Structural Chassis & Audio',
        false,
        [0, -1.15, 0.35],
        'Featherweight die-cast AZ91D magnesium-aluminum structural midframe preventing flex while cradling sealed stereo acoustic speaker boxes along the bottom bezel.',
        'Magnesium alloy is 33% lighter than aluminum yet rigid enough to keep the thin glass screen from bending when players grip the controllers!',
        (g, m) => {
          rbox(g, 1.50, 0.86, 0.018, 0.015, m.alu, [0, 0.04, 0.038]);
          // Twin sealed stereo front-firing speaker chambers + USB-C DisplayPort bottom connector
          for (const sx of [-0.46, 0.46]) {
            rbox(g, 0.22, 0.09, 0.042, 0.01, m.matteBlack, [sx, -0.36, 0.02]);
            cyl(g, 0.032, 0.032, 0.045, 16, m.copper, [sx, -0.36, 0.02], [Math.PI / 2, 0, 0]);
          }
          rbox(g, 0.095, 0.032, 0.055, 0.008, m.chrome, [0, -0.42, 0.01]);
        },
      ],
      [
        'freestop-wide-kickstand-backplate',
        'Full-Width Friction-Hinged Magnesium Kickstand & Rear Shell',
        'Tabletop Stand & Shell',
        true,
        [0, -0.35, -1.35],
        'Rear polycarbonate shell paired with a full-width friction-damped metal kickstand that holds any tabletop viewing angle from 15° to 150°.',
        'Miniature friction torque hinges copied from pro laptops pack dozens of tiny stacked steel spring washers into a 5mm hinge barrel!',
        (g, m) => {
          rbox(g, 1.54, 0.44, 0.024, 0.02, m.matteBlack, [0, 0.28, -0.06]);
          // Angled full-width metallic kickstand deployed slightly backward + twin friction torque hinges
          rbox(g, 1.52, 0.44, 0.020, 0.018, m.gunmetal, [0, -0.18, -0.13], [-0.36, 0, 0]);
          for (const hx of [-0.58, 0.58]) {
            cyl(g, 0.022, 0.022, 0.14, 14, m.chrome, [hx, 0.03, -0.06], [0, 0, Math.PI / 2]);
          }
        },
      ],
      [
        'tv-dock-usb-c-hdmi-cradle',
        'TV Dock Cradle with Spring-Guided USB-C Plug, Gigabit LAN & HDMI 2.1 Out',
        'Big-Screen TV Dock',
        true,
        [0, -1.45, -0.25],
        'Weighted living-room dock base with spring-loaded guide pins, USB-C DisplayPort-to-HDMI 2.1 video bridge PCB, and Ethernet/USB hub.',
        'Spring-loaded alignment cones around the bottom USB-C plug let you drop the console in one-handed in the dark without ever scratching the screen!',
        (g, m) => {
          rbox(g, 1.62, 0.42, 0.34, 0.035, m.white, [0, -0.58, 0]);
          rbox(g, 1.56, 0.34, 0.16, 0.015, m.matteBlack, [0, -0.50, 0]);
          // Glowing green TV-output status LED on lower-left corner of dock
          sphere(g, 0.016, 12, 10, emissiveMat(0x22c55e, 1.4), [-0.72, -0.72, 0.172]);
        },
      ],
    ],
    quiz: [
      {
        q: 'Why does an OLED handheld screen save significant battery power during dark space or dungeon scenes?',
        correctId: 'vivid-oled-laminated-display',
        distractors: ['freestop-wide-kickstand-backplate', 'tv-dock-usb-c-hdmi-cradle', 'rom-gamecard-microsd-reader'],
      },
      {
        q: 'What hidden feature sits directly underneath the right controller’s analog thumbstick cap?',
        correctId: 'detachable-right-controller-ir',
        distractors: ['detachable-left-controller-rail', 'lithium-pouch-battery-pack', 'copper-heatpipe-micro-blower'],
      },
      {
        q: 'Why are removable flash game cartridges coated with bitter denatonium benzoate?',
        correctId: 'rom-gamecard-microsd-reader',
        distractors: ['custom-hybrid-soc-lpddr5-board', 'magnesium-alloy-midframe-speakers', 'tv-dock-usb-c-hdmi-cradle'],
      },
      {
        q: 'Which ultra-flat 2.2mm phase-change copper component moves SoC heat up to the top exhaust fin stack?',
        correctId: 'copper-heatpipe-micro-blower',
        distractors: ['lithium-pouch-battery-pack', 'detachable-left-controller-rail', 'freestop-wide-kickstand-backplate'],
      },
      {
        q: 'What happens to the custom hybrid SoC within milliseconds when you drop the console into its powered TV Dock?',
        correctId: 'custom-hybrid-soc-lpddr5-board',
        distractors: ['freestop-wide-kickstand-backplate', 'detachable-left-controller-rail', 'rom-gamecard-microsd-reader'],
      },
    ],
  }),
];

export const GAMING_CATEGORY = {
  id: 'gaming',
  name: 'Gaming Consoles',
  fullName: 'PlayStation 5 Pro, DualSense & Hybrid OLED Consoles',
  emoji: '🎮',
  icon: '🎮',
  tagline: 'PlayStation 5 Pro Console • DualSense Adaptive Controller • Handheld Hybrid OLED Console',
  models: GAMING_MODELS,
};
