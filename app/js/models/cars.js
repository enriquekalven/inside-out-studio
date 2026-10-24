// Ultra-Realistic CAD & Micro-Mechanical 3D Car Models for Inside Out Studio:
// 1. Tesla Model S Plaid  2. Tesla Cybertruck  3. Rivian R1T Quad-Motor
// 4. Ferrari SF90 Stradale (with real 358k-triangle ferrari.glb CAD + internal V8/Turbos/Wires/Bolts)
// 5. Lamborghini Revuelto V12  6. Ford F-150 Raptor R  7. Porsche 911 GT3 RS
import * as THREE from '../../vendor/three.module.js';
import {
  mat,
  carPaint,
  brushedMetal,
  chromeMat,
  carbonFiberMat,
  glassMat,
  emissiveMat,
  screenMat,
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
  buildDetailedEngineBlock,
  buildDetailedEVDriveUnit,
  buildCoiloverSuspension,
  buildDetailedWheel,
  buildSculptedCarBody,
} from '../materials.js';
import {
  preloadCadAssets,
  addFerrariCadNodes,
  addCarConceptCadNodes,
  addEngineCadSubassembly,
  addGearboxCadSubassembly,
  addBuggyCadSubassembly,
} from '../cad_loader.js';

// Kick off background loading of all CAD GLB assets immediately on module import
preloadCadAssets();

function makeCarQuiz(p, customQ1, customQ2) {
  const ids = p.map((x) => x.id);
  return [
    customQ1,
    customQ2,
    {
      q: `Which part squeezes spinning perforated discs to bring this high-powered vehicle to a safe stop?`,
      correctId: ids[6],
      distractors: [ids[0], ids[8], ids[11]],
    },
    {
      q: `Which crystal-clear aerodynamic part lets the driver see the road while blocking roaring wind?`,
      correctId: ids[10],
      distractors: [ids[1], ids[5], ids[7]],
    },
    {
      q: `Which four parts grip the asphalt with grooved radial rubber tread and 3D hex lug nuts?`,
      correctId: ids[11],
      distractors: [ids[2], ids[6], ids[9]],
    },
  ];
}

// Helper to build a detailed 8/10-speed gearbox with real Khronos GearboxAssy CAD gears + perimeter hex bolts
function buildDetailedGearbox(g, pos = [-1.38, -0.18, 0], { transverse = false, halfShaftLen = 1.48 } = {}) {
  const [gx, gy, gz] = pos;
  const alu = brushedMetal(0xd1d5db, { metalness: 0.88, roughness: 0.22 });
  const darkSteel = brushedMetal(0x334155, { metalness: 0.9, roughness: 0.2 });
  const gold = brushedMetal(0xfbbf24, { metalness: 0.9, roughness: 0.16 });
  const w = transverse ? 0.38 : 0.48;
  const d = transverse ? 0.62 : 0.38;
  const unitY = gy + 0.05;

  // Compact Khronos GearboxAssy CAD gear train tucked inside the transaxle case
  addGearboxCadSubassembly(g, {
    pos: [gx, unitY + 0.02, gz],
    scale: 0.0055,
    rot: transverse ? [0, Math.PI / 2, 0] : [0, 0, 0],
  });

  // Finned cast-aluminum transaxle housing
  rbox(g, w, 0.15, d, 0.028, alu, [gx, unitY, gz]);
  for (let i = -2; i <= 2; i++) {
    box(g, w * 0.92, 0.16, 0.012, alu, [gx, unitY, gz + i * (d * 0.18)]);
  }

  // Internal helical gear stack & dual-clutch basket
  for (let s = -1; s <= 1; s++) {
    const gearX = gx + s * 0.1;
    cyl(g, 0.055, 0.055, 0.03, 18, darkSteel, [gearX, unitY + 0.04, gz + 0.04], [0, 0, Math.PI / 2]);
    cyl(g, 0.045, 0.045, 0.03, 16, gold, [gearX, unitY + 0.04, gz - 0.04], [0, 0, Math.PI / 2]);
  }

  // Chrome CV axle half-shafts + rubber CV boots
  cyl(g, 0.032, 0.032, halfShaftLen, 16, chromeMat(), [gx + 0.04, gy, gz], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    cyl(g, 0.052, 0.04, 0.1, 14, mat(0x111827, { roughness: 0.7 }), [gx + 0.04, gy, gz + side * 0.32], [Math.PI / 2, 0, 0]);
  }
}

// ============================================================================
// 1. TESLA MODEL S PLAID (1,020 HP Tri-Motor EV)
// ============================================================================
function buildTeslaPlaid() {
  const paintRed = carPaint(0xc8102e); // Ultra Red multi-coat
  const darkMetal = brushedMetal(0x2b3440);
  const alu = brushedMetal(0xcfd6df);
  const carbon = carbonFiberMat([4, 4]);

  const parts = [
    {
      id: 'skateboard-chassis',
      name: 'Aero Aluminum Skateboard & Gigacastings',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Aerospace-grade aluminum front and rear single-piece Gigacastings bolted to the structural floor with 32 titanium hex fasteners.',
      funFact: 'Gigapress machines stamp the front and rear underbody out of molten aluminum in a single giant piece!',
      build(g) {
        addCarConceptCadNodes(g, ['BodyUnderside', 'BodyWheelwells']);
        rbox(g, 3.45, 0.08, 1.52, 0.02, alu, [0, -0.32, 0]);
        box(g, 3.55, 0.08, 0.12, darkMetal, [0, -0.3, 0.72]);
        box(g, 3.55, 0.08, 0.12, darkMetal, [0, -0.3, -0.72]);
        // Ribbed front & rear Gigacastings with structural webs tucked cleanly inside wheelwells
        for (const xEnd of [-1.42, 1.42]) {
          rbox(g, 0.56, 0.14, 1.36, 0.025, alu, [xEnd, -0.26, 0]);
          for (let z = -0.48; z <= 0.48; z += 0.24) {
            box(g, 0.52, 0.16, 0.022, darkMetal, [xEnd, -0.25, z]);
          }
        }
      },
    },
    {
      id: 'battery-pack-4680',
      name: '800V Structural Battery Pack & HV Busbars',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.05, 0],
      desc: 'Thousands of lithium-ion battery cells sealed inside an armored aluminum enclosure with copper busbars, an orange 800V high-voltage harness, and liquid cooling ribbons.',
      funFact: 'Because the heavy battery is flat on the bottom like a skateboard, it is almost impossible for a Tesla to tip over!',
      build(g) {
        // Enclosed extruded aluminum structural battery pack case
        rbox(g, 2.28, 0.13, 1.44, 0.025, darkMetal, [0, -0.26, 0]);
        // 5 sealed high-density battery module bays with machined liquid-cooling plates & copper busbars
        const moduleMat = brushedMetal(0x38bdf8, { metalness: 0.85, roughness: 0.18 });
        const busbarCopper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.15 });
        for (let m = -2; m <= 2; m++) {
          rbox(g, 0.39, 0.04, 1.32, 0.01, moduleMat, [m * 0.43, -0.19, 0]);
          box(g, 0.36, 0.015, 0.06, busbarCopper, [m * 0.43, -0.168, 0]);
        }

        // High-voltage orange 800V wiring harness + blue CAN-bus + braided coolant lines
        buildWiringHarness(g, [
          {
            points: [
              [-1.12, -0.17, 0.62],
              [0, -0.16, 0.62],
              [1.12, -0.17, 0.62],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [-1.12, -0.17, -0.62],
              [0, -0.16, -0.62],
              [1.12, -0.17, -0.62],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'rear-tri-motors',
      name: 'Twin Rear Carbon-Sleeved Motors & Hairpin Stators',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.85, 0.95, 0],
      desc: 'Two independent electric motors on the rear axle with exposed copper hairpin stator windings and carbon-sleeved rotors spinning to 20,000 RPM.',
      funFact: 'The rotors spin so fast that Tesla wraps them in tight carbon-fiber thread so the magnets don’t fly apart!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.28, -0.18, 0], twin: true, width: 0.68, radius: 0.21 });
      },
    },
    {
      id: 'front-motor-inverter',
      name: 'Front Drive Unit, SiC Inverter & HV Loom',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [1.75, 1.05, 0],
      desc: 'Third electric motor between the front wheels plus a silicon-carbide inverter with copper busbars that feeds 1,020 horsepower of electricity.',
      funFact: 'All three motors working together can launch Model S Plaid from 0 to 60 mph in under 2 seconds—faster than a skydiver falls!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [1.25, -0.16, 0], twin: false, width: 0.64, radius: 0.2 });
      },
    },
    {
      id: 'octovalve-heatpump',
      name: 'Octovalve, Heat Pump & Braided Coolant Hoses',
      category: 'Cooling & HVAC',
      isOuter: false,
      explodeOffset: [2.45, 0.65, 0.85],
      desc: 'An 8-way smart Octovalve, finned aluminum radiator, dual cooling fans, and braided stainless coolant hoses with anodized AN fittings.',
      funFact: 'Tesla engineers named the valve the "Octovalve" because it has 8 coolant passages like an octopus!',
      build(g) {
        rbox(g, 0.14, 0.34, 0.88, 0.02, alu, [1.56, -0.08, 0], [0, 0, 0.22]);
        // Dual radiator electric fans
        for (const z of [-0.24, 0.24]) {
          torus(g, 0.14, 0.016, darkMetal, [1.5, -0.08, z], [0, Math.PI / 2, 0]);
        }
        sphere(g, 0.11, 18, darkMetal, [1.38, 0.02, 0.28]);
        buildWiringHarness(g, [
          {
            points: [
              [1.38, 0.02, 0.28],
              [1.48, -0.02, 0.12],
              [1.54, -0.08, -0.18],
            ],
            radius: 0.014,
            color: 0x0284c7,
            companionColor: 0xe2e8f0,
            braided: true,
          },
          {
            points: [
              [1.38, 0.02, 0.28],
              [1.3, -0.06, 0.32],
              [1.25, -0.12, 0.18],
            ],
            radius: 0.014,
            color: 0xe11d48,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'frunk-cargo',
      name: 'Front Trunk ("Frunk") Basin & 12V Li-Ion Auxiliary',
      category: 'Storage',
      isOuter: false,
      explodeOffset: [2.1, 1.55, 0],
      desc: 'Molded front cargo tub plus the compact 16V lithium-ion low-voltage battery and red/blue main fuse junction box.',
      funFact: 'Every front trunk has a glow-in-the-dark release button inside just in case someone gets locked in.',
      build(g) {
        const tubMat = mat(0x1f242d, { roughness: 0.6, metalness: 0.1 });
        rbox(g, 0.62, 0.22, 1.04, 0.04, tubMat, [1.28, 0.02, 0]);
        // 16V auxiliary battery + red positive cable
        rbox(g, 0.2, 0.12, 0.26, 0.02, brushedMetal(0x2563eb), [1.02, 0.08, -0.34]);
      },
    },
    {
      id: 'air-suspension-brakes',
      name: 'Adaptive Helical Coilover Struts, CAD Brake Discs & Wishbone Arms',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.65],
      desc: 'Four 3D helical spring struts, tubular upper and lower A-arm wishbones with ball joints, CAD brake discs & calipers, and braided stainless brake lines.',
      funFact: 'Electric cars also use "regenerative braking"—turning the motors into generators to slow down and put energy back in the battery!',
      build(g) {
        addCarConceptCadNodes(
          g,
          [
            'Axles',
            'WheelFrontLBrakeDisc',
            'WheelFrontLBrakePad',
            'WheelFrontRBrakeDisc',
            'WheelFrontRBrakePad',
            'WheelRearLBrakeDisc',
            'WheelRearLBrakePad',
            'WheelRearRBrakeDisc',
            'WheelRearRBrakePad',
          ],
          { caliper: carPaint(0xc8102e) },
        );
        buildCoiloverSuspension(
          g,
          [
            [1.25, -0.26, 0.66],
            [1.25, -0.26, -0.66],
            [-1.28, -0.26, 0.66],
            [-1.28, -0.26, -0.66],
          ],
          { springColor: 0x0ea5e9, damperColor: 0xcbd5e1, height: 0.26 },
        );
      },
    },
    {
      id: 'yoke-touchscreen',
      name: 'CAD Cockpit Dash, Yoke Steering, Pedals & 17" FSD Display',
      category: 'Cockpit & FSD Computer',
      isOuter: false,
      explodeOffset: [0.55, 1.35, 1.2],
      desc: 'Sculpted CAD dashboard (`InteriorDashMid`, `InteriorDashSides`), billet accelerator/brake pedal assemblies (`InteriorPedalAccel`, `InteriorPedalBrake`), steering yoke, and 17-inch theater screen.',
      funFact: 'The dashboard computer has as much graphics power as a modern video game console!',
      build(g) {
        addCarConceptCadNodes(g, [
          'InteriorDashMid',
          'InteriorDashSides',
          'InteriorPedalAccel',
          'InteriorPedalAccelArm',
          'InteriorPedalBrake',
          'InteriorPedalBrakeArm',
          'InteriorSteeringBase',
          'InteriorSteeringDash',
          'InteriorSteeringDashColumn',
        ]);
        // Yoke steering on rotatable pivot group for Drive It! mode
        const yokeG = new THREE.Group();
        yokeG.position.set(0.38, 0.32, 0.38);
        yokeG.userData.steerRole = 'steering-wheel';
        g.add(yokeG);
        rbox(yokeG, 0.05, 0.16, 0.32, 0.02, carbon, [0, 0, 0], [0, 0, -0.35]);
        cyl(yokeG, 0.03, 0.03, 0.22, 14, alu, [0.1, -0.05, 0], [0, 0, Math.PI / 2 - 0.35]);
        // 17-inch landscape screen
        rbox(g, 0.04, 0.24, 0.38, 0.02, screenMat('dashboard'), [0.46, 0.34, 0], [0, -0.1, -0.2]);
      },
    },
    {
      id: 'cabin-seats',
      name: 'CAD Sculpted Vegan Leather Seats, Frames & Roll Structure',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.15, 1.25, -1.65],
      desc: 'Authentic CAD contoured bucket seats, seat frames, floor mats, and safety cage (`InteriorSeatsColor1/2`, `InteriorSeatsFrame1/2`, `InteriorCage`).',
      funFact: 'Tiny fans hidden inside the seat cushions blow cool air through microscopic pinholes on hot summer days!',
      build(g) {
        const creamLeather = mat(0xf1f5f9, { roughness: 0.38, metalness: 0.05 });
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'InteriorSeatsColor1',
            'InteriorSeatsColor2',
            'InteriorSeatsFrame1',
            'InteriorSeatsFrame2',
            'InteriorCage',
            'InteriorFloor',
            'InteriorFloormats',
          ],
          { leather: creamLeather },
        );
        if (!hasCad) {
          for (const z of [-0.38, 0.38]) {
            rbox(g, 0.46, 0.11, 0.44, 0.04, creamLeather, [0.05, -0.14, z]);
            rbox(g, 0.11, 0.62, 0.42, 0.04, creamLeather, [-0.16, 0.2, z], [0, 0, 0.2]);
          }
        }
      },
    },
    {
      id: 'aero-body-doors',
      name: 'CAD Sculpted Ultra-Red Fastback Bodywork, Hood & Doors',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [-0.35, 1.85, -1.95],
      desc: '97-mesh CAD sculpted fastback body (`BodyHood`, `BodyRearPanelsColor1`, `BodyPanelsColor2`, `BodyDoorL/R`, `BodyHeadlights`, `BodyTaillights`) with inner flange hex bolts.',
      funFact: 'With a drag coefficient of 0.208, Model S slices through the air smoother than almost any production car ever built!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyHood',
            'BodyHoodInterior01',
            'BodyHoodInterior02',
            'BodyHoodTopgrill',
            'BodyHoodUnder',
            'BodyRearPanelsColor1',
            'BodyPanelsColor2',
            'BodyDoorRColor1',
            'BodyDoorRColor2',
            'BodyDoorRHandle01',
            'BodyDoorRHandle02',
            'BodyDoorRMirror',
            'BodyDoorRMirrorColor1',
            'BodyDoorRMirrorColor2',
            'InteriorDoorR01',
            'InteriorDoorR02',
            'BodyDoorLColor1',
            'BodyDoorLColor2',
            'BodyDoorLHandle01',
            'BodyDoorLHandle02',
            'BodyDoorLMirror',
            'BodyDoorLMirrorColor1',
            'BodyDoorLMirrorColor2',
            'InteriorDoorL01',
            'InteriorDoorL02',
            'BodyHeadlights',
            'BodyTaillights',
            'BodyTaillightsPanels',
            'BodyTurnsignalsRear',
          ],
          { body: paintRed },
        );
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-2.05, -0.14],
              [-1.95, 0.26],
              [-1.25, 0.34],
              [-0.45, 0.3],
              [0.85, 0.24],
              [1.85, 0.12],
              [2.08, -0.1],
              [1.65, -0.22],
              [-1.65, -0.22],
            ],
            bodyColor: paintRed,
          });
        }
      },
    },
    {
      id: 'panoramic-glass-lights',
      name: 'CAD All-Glass UV Canopy, Wipers, Pillars & Rear Hatch',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.45, 2.25, -1.15],
      desc: 'Continuous CAD UV-tinted windshield, roof panel, side windows, gasket seals, and articulated windshield wipers (`BodyWindshield`, `BodyWindshieldWipers`, `BodyRoofPanel`, `BodyPillars`).',
      funFact: 'The glass roof blocks 99% of ultraviolet rays so passengers get a sky view without getting sunburned!',
      build(g) {
        const glass = glassMat(0x64b5f6, 0.38);
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyWindshield',
            'BodyWindshieldGasket',
            'BodyWindshieldWipers',
            'BodyWindshieldWipersBase',
            'BodyRoofPanel',
            'BodyRearwindow',
            'BodyWindowsRearSides',
            'BodyPillars',
            'BodyDoorRWindow',
            'BodyDoorRWindowGasket',
            'BodyDoorLWindow',
            'BodyDoorLWindowGasket',
          ],
          { body: paintRed, glass },
        );
        if (!hasCad) {
          rbox(g, 0.94, 0.05, 1.48, 0.02, glass, [0.58, 0.54, 0], [0, 0, -0.5]);
          rbox(g, 1.38, 0.05, 1.46, 0.02, glass, [-0.25, 0.76, 0]);
        }
      },
    },
    {
      id: 'arachnid-wheels',
      name: '21" Forged Arachnid Wheels, 3D Hex Lug Nuts & Michelin Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.35, -1.85],
      desc: 'Staggered forged aluminum wheels with 5 chrome hex lug nuts, brass valve stems, 12 rotor bobbins, and crimson Brembo calipers.',
      funFact: 'Because electric motors are nearly silent, EV tires have a ring of soft sponge foam glued inside them to hush highway hum!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'], {
          rim: brushedMetal(0x374151, { metalness: 0.9, roughness: 0.18 }),
          caliper: carPaint(0xd90429),
          excludeBrakes: true,
        });
        if (!hasCad) {
          const corners = [
            [1.287, -0.2, 0.898],
            [1.287, -0.2, -0.898],
            [-1.289, -0.2, 0.903],
            [-1.289, -0.2, -0.903],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: 0.36,
              tireWidth: 0.25,
              rimColor: 0x374151,
              caliperColor: 0xd90429,
              spokes: 10,
              lugCount: 5,
              includeBrake: false,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'tesla-plaid',
    name: 'Tesla Model S Plaid',
    brand: 'Tesla',
    badge: '1,020 HP • Tri-Motor EV',
    desc: 'Tri-motor electric super-sedan with a structural 800V battery skateboard, exposed copper hairpin stators, Octovalve heat pump, and yoke cockpit.',
    cameraPos: [4.1, 2.3, 4.3],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'Which flat underfloor part holds thousands of lithium cells and keeps the Tesla from tipping over?',
        correctId: 'battery-pack-4680',
        distractors: ['frunk-cargo', 'yoke-touchscreen', 'panoramic-glass-lights'],
      },
      {
        q: 'Why is there a deep "Frunk" storage basin under the front hood of the Tesla?',
        correctId: 'frunk-cargo',
        distractors: ['rear-tri-motors', 'arachnid-wheels', 'cabin-seats'],
      },
    ),
  };
}

// ============================================================================
// 2. TESLA CYBERTRUCK (845 HP Stainless Steel Exoskeleton Pickup)
// ============================================================================
function buildCybertruck() {
  const steelExo = brushedMetal(0xcbd5e1, { metalness: 0.92, roughness: 0.22, clearcoat: 0.28 });
  const steelCantrail = brushedMetal(0xd8dee9, { metalness: 0.94, roughness: 0.18, clearcoat: 0.35 });
  const darkFrame = brushedMetal(0x1e242b, { metalness: 0.75, roughness: 0.36 });
  const matteFlare = mat(0x111827, { roughness: 0.68, metalness: 0.18 });

  const parts = [
    {
      id: 'gigacast-subframe',
      name: '9,000-Ton Gigacast Aluminum Chassis & Tow Hooks',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Massive die-cast aluminum front and rear subframes with ribbed structural crossmembers supporting the stainless steel exoskeleton.',
      funFact: 'Cybertruck’s casting machine clamps with 9,000 tons of force—about the weight of 60 blue whales!',
      build(g) {
        const castAlu = brushedMetal(0x64748b, { metalness: 0.84, roughness: 0.28 });
        // Full-width armored structural underbody belly pan between wheels
        rbox(g, 1.72, 0.1, 1.58, 0.02, darkFrame, [0, -0.2, 0]);
        // Ribbed 9,000-ton front and rear die-cast aluminum subframes
        for (const xEnd of [-1.42, 1.42]) {
          rbox(g, 0.74, 0.14, 1.24, 0.025, castAlu, [xEnd, -0.18, 0]);
          for (let z = -0.44; z <= 0.44; z += 0.22) {
            box(g, 0.68, 0.16, 0.024, darkFrame, [xEnd, -0.17, z]);
          }
        }
        // Longitudinal hydroformed chassis rails
        for (const zRail of [-0.52, 0.52]) {
          box(g, 3.88, 0.12, 0.12, darkFrame, [0, -0.18, zRail]);
        }
      },
    },
    {
      id: 'cybercell-battery',
      name: '800V 4680 Cybercell Structural Battery Pack & HV Loom',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: '800-volt structural battery enclosure housing four high-density 4680 Cybercell arrays, liquid-cooled busbar plates, and heavy orange HV cables.',
      funFact: 'With Powershare outlets in the bed, Cybertruck’s battery can power an entire house during a blackout for 3 days!',
      build(g) {
        // Armored structural battery enclosure
        rbox(g, 1.72, 0.14, 1.48, 0.025, darkFrame, [0, -0.13, 0]);
        // 4 sealed 4680 Cybercell structural arrays with laser-welded stainless cooling plates & copper busbars
        const arrayMat = brushedMetal(0x94a3b8, { metalness: 0.88, roughness: 0.2 });
        const busbarCopper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.15 });
        for (let m = -1.5; m <= 1.5; m += 1) {
          rbox(g, 0.36, 0.04, 1.34, 0.01, arrayMat, [m * 0.4, -0.055, 0]);
          box(g, 0.32, 0.015, 0.06, busbarCopper, [m * 0.4, -0.032, 0]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-0.82, -0.04, 0.64],
              [0, -0.03, 0.64],
              [0.82, -0.04, 0.64],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [-0.82, -0.04, -0.64],
              [0, -0.03, -0.64],
              [0.82, -0.04, -0.64],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'cyberbeast-motors',
      name: 'Cyberbeast Tri-Motor Drive Units & Inverters',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.75, 0.85, 0],
      desc: 'Dual rear induction motors plus a front permanent-magnet motor with exposed copper stator coils and 800V SiC inverters.',
      funFact: 'Even though Cybertruck weighs nearly 7,000 pounds, its electric motors launch it faster than many sports cars!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.35, -0.16, 0], twin: true, width: 0.68, radius: 0.2 });
        buildDetailedEVDriveUnit(g, { pos: [1.35, -0.16, 0], twin: false, width: 0.62, radius: 0.18 });
      },
    },
    {
      id: 'steer-by-wire',
      name: '4-Wheel Steer-by-Wire Actuators & 48V Harness',
      category: 'Controls & Steering',
      isOuter: false,
      explodeOffset: [1.85, -0.65, 1.35],
      desc: 'High-torque 48-volt electronic motors turn both the front AND rear wheels via ball-screw tie rods with zero mechanical steering column!',
      funFact: 'Because the back wheels also turn up to 10 degrees, this giant pickup has a tighter turning circle than a compact car!',
      build(g) {
        const actMat = brushedMetal(0x0ea5e9, { metalness: 0.8, roughness: 0.2 });
        for (const x of [-1.35, 1.35]) {
          cyl(g, 0.042, 0.042, 1.36, 16, actMat, [x, -0.18, 0], [Math.PI / 2, 0, 0]);
          rbox(g, 0.2, 0.1, 0.2, 0.02, brushedMetal(0xff6600), [x, -0.18, 0]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [1.35, -0.16, 0.12],
              [0.35, -0.17, 0.22],
              [-1.35, -0.16, 0.12],
            ],
            radius: 0.014,
            color: 0x0284c7,
            companionColor: 0xeab308,
          },
        ]);
      },
    },
    {
      id: 'powered-frunk',
      name: 'Power-Opening Stainless Frunk Hood, Cargo Tub & 48V Hub',
      category: 'Storage',
      isOuter: true,
      explodeOffset: [2.25, 1.25, 0],
      desc: 'Planar 30X stainless-steel sloped front hood that lifts together with the front fascia to reveal a deep front cargo tub with a fold-out tailgate bench.',
      funFact: 'The front hood lifts together with the upper fascia so you can slide heavy coolers straight in without lifting them over a high lip!',
      build(g) {
        // Internal molded composite frunk tub + 48V hub tucked cleanly inside nose
        rbox(g, 0.62, 0.2, 1.32, 0.025, darkFrame, [1.58, 0.08, 0]);
        // Planar sloped 30X stainless-steel frunk hood spanning cleanly from nose crease (2.18, 0.18) to cowl (1.22, 0.50)
        box(g, 1.02, 0.036, 1.72, steelExo, [1.7, 0.34, 0], [0, 0, -0.322]);
        // Subtle center longitudinal origami hood crease
        box(g, 0.98, 0.014, 0.03, steelCantrail, [1.7, 0.355, 0], [0, 0, -0.322]);
      },
    },
    {
      id: 'vault-tonneau',
      name: '6-Foot Composite Vault Bed & Motorized Slatted Tonneau Cover',
      category: 'Cargo Vault',
      isOuter: true,
      explodeOffset: [-1.85, 1.55, 0],
      desc: '6-foot composite pickup bed with LED side strip lighting, L-track tie-down cleats, and a motorized roll-up metal shutter flush with the fastback roof slope.',
      funFact: 'When the motorized Vault cover rolls shut along the C-pillar tracks, it turns the open pickup bed into a giant aerodynamic locked safe!',
      build(g) {
        const bedMat = mat(0x181c22, { roughness: 0.65 });
        box(g, 1.48, 0.06, 1.56, bedMat, [-1.32, 0.14, 0]);
        // Motorized dark metallic slatted tonneau cover sloping along fastback spine from (-0.48, 0.80) to (-2.14, 0.47)
        const slatMat = brushedMetal(0x334155, { metalness: 0.68, roughness: 0.32 });
        const numSlats = 14;
        for (let i = 0; i < numSlats; i++) {
          const t = i / (numSlats - 1);
          const x = -0.52 - t * 1.58;
          const y = 0.79 - t * 0.315;
          box(g, 0.112, 0.026, 1.56, slatMat, [x, y, 0], [0, 0, 0.196]);
        }
      },
    },
    {
      id: 'air-suspension-links',
      name: '12" Travel Helical Air-Coil Struts & Billet Wishbones',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Tall billet-aluminum upper and lower wishbones, 3D helical spring struts, and braided brake hoses raise clearance to 16 inches.',
      funFact: 'In Extract Mode, the air suspension pumps itself up a full foot off the ground to climb over boulders!',
      build(g) {
        buildCoiloverSuspension(
          g,
          [
            [1.35, -0.18, 0.68],
            [1.35, -0.18, -0.68],
            [-1.35, -0.18, 0.68],
            [-1.35, -0.18, -0.68],
          ],
          { springColor: 0xf59e0b, damperColor: 0x94a3b8, height: 0.32 },
        );
      },
    },
    {
      id: 'squircle-cockpit',
      name: 'Squircle Steer-by-Wire Wheel & 18.5" Display',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.55, 1.4, 1.15],
      desc: 'Angular dashboard with an octagonal "squircle" steer-by-wire wheel, billet pedals, and an 18.5-inch touchscreen.',
      funFact: 'The 3D user interface shows a live miniature Cybertruck on screen that opens its doors and tonneau when you touch it!',
      build(g) {
        box(g, 0.32, 0.18, 1.52, darkFrame, [0.62, 0.36, 0]);
        const sqGroup = new THREE.Group();
        sqGroup.position.set(0.42, 0.42, 0.38);
        sqGroup.userData.steerRole = 'steering-wheel';
        g.add(sqGroup);
        rbox(sqGroup, 0.045, 0.18, 0.26, 0.025, darkFrame, [0, 0, 0], [0, 0, -0.3]);
        rbox(g, 0.035, 0.22, 0.38, 0.018, screenMat('dashboard'), [0.5, 0.44, 0], [0, 0, -0.2]);
      },
    },
    {
      id: 'angular-seats',
      name: 'Origami Geometric Cabin Bucket Seats',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [-0.1, 1.6, 0],
      desc: 'Five angular bucket seats with perforated cushions, bolsters, and folding rear bench.',
      funFact: 'Even the seat headrests and armrests are shaped like sharp polygons to match the outside of the truck!',
      build(g) {
        const seatMat = mat(0x334155, { roughness: 0.45 });
        for (const z of [-0.4, 0.4]) {
          box(g, 0.42, 0.1, 0.42, seatMat, [0.18, 0.04, z]);
          box(g, 0.1, 0.54, 0.4, seatMat, [-0.02, 0.34, z], [0, 0, 0.18]);
        }
        box(g, 0.4, 0.1, 1.36, seatMat, [-0.52, 0.06, 0]);
        box(g, 0.1, 0.5, 1.36, seatMat, [-0.68, 0.34, 0], [0, 0, 0.15]);
      },
    },
    {
      id: 'stainless-exoskeleton',
      name: 'Ultra-Hard 30X Cold-Rolled Stainless Steel Exoskeleton & Trapezoidal Fenders',
      category: 'Exterior Exoskeleton',
      isOuter: true,
      explodeOffset: [0, 0.55, -2.25],
      desc: 'Unpainted 1.8mm cold-rolled 30X stainless-steel origami wedge side panels with sharp trapezoidal wheel-arch cutouts, C-pillar sail panels, planar front fascia, vertical stainless tailgate, and 1-piece contoured matte-black fender flares.',
      funFact: 'Because the 30X stainless steel panels are so hard, traditional stamping presses would break—so Tesla air-bends the flat steel sheets along laser-scored origami creases!',
      build(g) {
        // Lower origami side exoskeleton polygon from nose (2.18, 0.18) to tailgate (-2.16, 0.48)
        // Includes solid front fender upper cheek (2.18, 0.18 -> 1.22, 0.50) and stepped-down window sill (1.06, 0.26 -> -0.88, 0.40)
        const lowerSideExoskeleton = [
          [-2.16, -0.02],
          [-1.84, -0.04],
          [-1.72, 0.22],
          [-1.54, 0.34],
          [-1.16, 0.34],
          [-0.98, 0.22],
          [-0.86, -0.12],
          [0.86, -0.12],
          [0.98, 0.22],
          [1.16, 0.34],
          [1.54, 0.34],
          [1.72, 0.22],
          [1.84, -0.04],
          [2.16, 0.0],
          [2.18, 0.18],
          [1.22, 0.50],
          [1.06, 0.26],
          [-0.88, 0.40],
          [-2.16, 0.48],
        ];
        // Upper stainless A-pillar + roof cantrail arch framing the cabin glass from cowl (1.22, 0.50) to roof peak (0.05, 0.93)
        const cantrailArch = [
          [1.22, 0.50],
          [0.05, 0.93],
          [-0.88, 0.74],
          [-0.88, 0.67],
          [0.05, 0.85],
          [1.06, 0.26],
        ];
        // Solid triangular C-pillar sail panel flanking the Vault tonneau bed from (-0.88, 0.74) to (-2.16, 0.48)
        const sailPanel = [
          [-0.88, 0.74],
          [-2.16, 0.48],
          [-2.16, 0.38],
          [-0.88, 0.40],
        ];
        // Contoured 1-piece trapezoidal wheel-arch flare profile matching the wheel cutout
        const trapFlareProfile = [
          [-0.49, -0.12],
          [-0.37, 0.22],
          [-0.19, 0.34],
          [0.19, 0.34],
          [0.37, 0.22],
          [0.49, -0.12],
          [0.55, -0.12],
          [0.42, 0.26],
          [0.22, 0.39],
          [-0.22, 0.39],
          [-0.42, 0.26],
          [-0.55, -0.12],
        ];
        for (const side of [-1, 1]) {
          const zPanel = side * 0.825;
          extrudeProfile(g, lowerSideExoskeleton, 0.064, steelExo, [0, 0, zPanel], [0, 0, 0], 0.008);
          extrudeProfile(g, cantrailArch, 0.068, steelCantrail, [0, 0, zPanel], [0, 0, 0], 0.006);
          extrudeProfile(g, sailPanel, 0.068, steelCantrail, [0, 0, zPanel], [0, 0, 0], 0.006);

          // Razor-sharp longitudinal "tornado" beltline crease from nose (2.18, 0.18) up to taillight (-2.16, 0.48) -> slope = -0.069 rad
          box(g, 4.35, 0.022, 0.022, steelCantrail, [0.01, 0.33, side * 0.862], [0, 0, -0.069]);

          // Vertical stainless door-seam panel lines at x = 0.96, 0.06, -0.86
          for (const dx of [0.96, 0.06, -0.86]) {
            box(g, 0.012, 0.38, 0.016, darkFrame, [dx, 0.12, side * 0.86]);
          }

          // Matte-black lower rocker panel skirt between wheels
          box(g, 1.72, 0.085, 0.075, matteFlare, [0, -0.12, side * 0.855]);

          // 1-piece contoured matte-black trapezoidal wheel arch fender flares + deep dark wheelwell tubs
          for (const wx of [1.35, -1.35]) {
            extrudeProfile(g, trapFlareProfile, 0.095, matteFlare, [wx, 0, side * 0.855], [0, 0, 0], 0.005);
            box(g, 0.78, 0.04, 0.34, darkFrame, [wx, 0.32, side * 0.68]);
          }

          // Triangular origami stainless side mirror at base of A-pillar
          cone(g, 0.055, 0.15, 3, steelCantrail, [0.96, 0.36, side * 0.93], [0, 0, side * Math.PI * 0.5]);
        }

        // Enclosed cabin floor & front/rear angled stainless skid plates
        box(g, 1.76, 0.05, 1.66, darkFrame, [0, -0.12, 0]);
        box(g, 0.38, 0.04, 1.68, steelExo, [1.98, -0.11, 0], [0, 0, 0.24]);
        box(g, 0.38, 0.04, 1.68, darkFrame, [-1.98, -0.1, 0], [0, 0, -0.22]);

        // Planar V-creased 30X Stainless Front Fascia below the lightbar + Matte-Black Heavy Duty Front Bumper & Tow Hooks
        for (const side of [-1, 1]) {
          box(g, 0.06, 0.17, 0.87, steelExo, [2.17, 0.07, side * 0.425], [0, side * -0.06, 0.12]);
        }
        rbox(g, 0.16, 0.12, 1.76, 0.02, matteFlare, [2.14, -0.06, 0]);
        for (const z of [-0.46, 0.46]) {
          torus(g, 0.038, 0.012, darkFrame, [2.22, -0.06, z], [0, Math.PI / 2, 0]);
        }

        // Planar Vertical 30X Stainless Tailgate at x = -2.16 + Matte-Black Rear Step Bumper
        box(g, 0.06, 0.46, 1.72, steelExo, [-2.16, 0.21, 0]);
        rbox(g, 0.16, 0.11, 1.76, 0.02, matteFlare, [-2.17, -0.05, 0]);
      },
    },
    {
      id: 'armor-glass-lightbar',
      name: 'Flush Polygonal Armor Glass Cabin, 4-Foot Giga-Wiper & Full-Width Lightbars',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.35, 2.05, 0],
      desc: 'Flush-mounted borosilicate acoustic Armor Glass windshield, polygonal side cabin windows, tinted glass roof canopy, 4-foot vertical Giga-Wiper, and full-width front/rear laser-etched LED lightbars.',
      funFact: 'Cybertruck’s single giant windshield wiper blade is 4 feet long and parks vertically along the driver’s A-pillar to cut aerodynamic drag!',
      build(g) {
        const glass = glassMat(0x0f172a, 0.62);
        const roofGlass = glassMat(0x090d16, 0.78);

        // Continuous sloped Armor Glass Windshield from cowl (1.22, 0.50) to roof apex peak (0.05, 0.92)
        box(g, 1.25, 0.032, 1.62, glass, [0.635, 0.71, 0], [0, 0, -0.344]);
        // 4-foot Vertical Giga-Wiper parked along driver-side A-pillar
        box(g, 1.18, 0.028, 0.038, matteFlare, [0.64, 0.73, 0.72], [0, 0, -0.344]);

        // Tinted Glass Roof Canopy from roof apex (0.05, 0.92) to rear cabin header (-0.88, 0.74)
        box(g, 0.95, 0.03, 1.58, roofGlass, [-0.415, 0.83, 0], [0, 0, 0.191]);
        // Sharp roof apex stainless crossbar
        box(g, 0.06, 0.036, 1.68, steelCantrail, [0.05, 0.92, 0]);

        // Flush-mounted angular polygonal side cabin windows (front + rear doors + quarter glass) + angled B-pillar
        const sideWindowPoly = [
          [1.06, 0.26],
          [0.05, 0.85],
          [-0.88, 0.67],
          [-0.88, 0.40],
        ];
        for (const side of [-1, 1]) {
          extrudeProfile(g, sideWindowPoly, 0.018, glass, [0, 0, side * 0.835], [0, 0, 0], 0.002);
          // Angled black B-pillar & C-pillar window dividers
          box(g, 0.055, 0.52, 0.024, matteFlare, [0.06, 0.59, side * 0.842], [0, 0, 0.12]);
          box(g, 0.045, 0.34, 0.024, matteFlare, [-0.56, 0.54, side * 0.842], [0, 0, 0.14]);
        }

        // Full-width Front Horizon LED DRL Lightbar across the nose razor edge (x = 2.19, y = 0.18)
        box(g, 0.05, 0.038, 1.74, emissiveMat(0xf8fafc, 2.2), [2.19, 0.18, 0]);
        // Low-mounted recessed bi-LED projector headlights above front bumper
        for (const z of [-0.62, 0.62]) {
          box(g, 0.05, 0.042, 0.24, emissiveMat(0xe0f2fe, 1.8), [2.18, 0.01, z]);
        }

        // Full-width Rear Red LED Lightbar across top of tailgate (x = -2.17, y = 0.45)
        box(g, 0.05, 0.045, 1.72, emissiveMat(0xef4444, 2.2), [-2.17, 0.45, 0]);
      },
    },
    {
      id: 'all-terrain-wheels',
      name: '35" Goodyear Territory Mud-Terrain Tires & 7-Spoke Octagonal Aero Covers',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.2],
      desc: 'Massive 35-inch (890 mm) Goodyear Wrangler Territory RT tires with interlocking sidewall lugs and matte-black 7-spoke heptagonal aero wheel covers.',
      funFact: 'The rubber ridges on the custom Goodyear tire sidewall line up with the 7 points of the wheel cover like puzzle pieces!',
      build(g) {
        const corners = [
          [1.35, -0.18, 0.82],
          [1.35, -0.18, -0.82],
          [-1.35, -0.18, 0.82],
          [-1.35, -0.18, -0.82],
        ];
        for (const pos of corners) {
          buildDetailedWheel(g, pos, {
            tireRadius: 0.38,
            tireWidth: 0.25,
            rimColor: 0x181c22,
            caliperColor: 0xef4444,
            spokes: 7,
            lugCount: 6,
            includeBrake: true,
          });
        }
      },
    },
  ];

  return {
    id: 'cybertruck',
    name: 'Tesla Cybertruck',
    brand: 'Tesla',
    badge: '845 HP • 30X Stainless Exo',
    desc: 'Unpainted 30X cold-rolled stainless-steel origami exoskeleton pickup with trapezoidal wheel arches, continuous 31° hood-to-roof apex wedge, 800V 4680 Cybercells, 4-wheel steer-by-wire, and motorized Vault tonneau.',
    cameraPos: [4.3, 2.2, 4.4],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'Why is the Cybertruck body folded into sharp flat triangles instead of curvy panels?',
        correctId: 'stainless-exoskeleton',
        distractors: ['angular-seats', 'all-terrain-wheels', 'squircle-cockpit'],
      },
      {
        q: 'Which part lets this giant truck turn tightly by steering both the front AND back wheels electronically?',
        correctId: 'steer-by-wire',
        distractors: ['powered-frunk', 'vault-tonneau', 'armor-glass-lightbar'],
      },
    ),
  };
}

// ============================================================================
// 3. RIVIAN R1T QUAD-MOTOR ADVENTURE TRUCK
// ============================================================================
function buildRivianR1T() {
  const launchGreen = carPaint(0x4b6043);
  const yellowAccent = carPaint(0xf59e0b);
  const bashPlate = brushedMetal(0x94a3b8);
  const darkTrim = mat(0x1f2937, { roughness: 0.5 });

  const parts = [
    {
      id: 'underbody-shield',
      name: 'Carbon-Kevlar Underbody Bash Shield & Tow Hooks',
      category: 'Structure & Off-Road',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Reinforced high-strength steel and composite skid plate with Compass Yellow front recovery tow hooks.',
      funFact: 'The underbody shield is strong enough for the entire 7,000-pound truck to slide across a sharp boulder without denting the battery!',
      build(g) {
        rbox(g, 3.82, 0.08, 1.56, 0.025, bashPlate, [0, -0.26, 0]);
        for (let x = -1.5; x <= 1.5; x += 0.6) {
          box(g, 0.08, 0.09, 1.52, darkTrim, [x, -0.24, 0]);
        }
        torus(g, 0.065, 0.02, yellowAccent, [2.02, -0.2, 0.45], [0, Math.PI / 2, 0]);
        torus(g, 0.065, 0.02, yellowAccent, [2.02, -0.2, -0.45], [0, Math.PI / 2, 0]);
      },
    },
    {
      id: 'max-pack-battery',
      name: '149 kWh Waterproof Max Battery Pack & HV Busbars',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: 'Double-stacked module battery sealed with 24 perimeter bolts and high-voltage orange harnesses inside a waterproof enclosure.',
      funFact: 'Because an electric truck doesn’t need an air intake snorkel or exhaust pipe, R1T can ford deep rivers up to 43 inches!',
      build(g) {
        rbox(g, 2.35, 0.16, 1.48, 0.025, darkTrim, [0, -0.14, 0]);
        for (let i = -4; i <= 4; i++) {
          rbox(g, 0.22, 0.07, 1.38, 0.015, brushedMetal(0x38bdf8), [i * 0.25, -0.05, 0]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-1.15, -0.04, 0.66],
              [0, -0.03, 0.66],
              [1.15, -0.04, 0.66],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [-1.15, -0.04, -0.66],
              [0, -0.03, -0.66],
              [1.15, -0.04, -0.66],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x10b981,
          },
        ]);
      },
    },
    {
      id: 'quad-motors',
      name: 'Independent Quad-Motor Drive Units & HV Inverters',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.6, 0.95, 0],
      desc: 'Four separate electric motors—one for every single wheel—with copper hairpin windings, 32 flange bolts, and torque-vectoring gearboxes.',
      funFact: 'Because each wheel has its own motor, a Quad-Motor truck can spin the left wheels forward and right wheels backward to pivot like a tank!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.32, -0.14, 0], twin: true, width: 0.62, radius: 0.15 });
        buildDetailedEVDriveUnit(g, { pos: [1.32, -0.14, 0], twin: true, width: 0.62, radius: 0.15 });
      },
    },
    {
      id: 'gear-tunnel',
      name: 'Pass-Through Gear Tunnel & Slide-Out Camp Kitchen',
      category: 'Adventure Storage',
      isOuter: false,
      explodeOffset: [-0.55, 0.4, 2.1],
      desc: 'A 65-inch pass-through tunnel behind the cab with fold-down step doors and a dual-burner induction camp stove!',
      funFact: 'The Gear Tunnel doors fold down into sturdy steps so you can reach the roof tent or slide out an electric camp stove!',
      build(g) {
        rbox(g, 0.48, 0.42, 1.84, 0.05, bashPlate, [-0.58, 0.04, 0]);
        rbox(g, 0.42, 0.36, 0.12, 0.03, yellowAccent, [-0.58, 0.04, 0.92]);
        rbox(g, 0.42, 0.36, 0.12, 0.03, yellowAccent, [-0.58, 0.04, -0.92]);
      },
    },
    {
      id: 'stadium-lightbar',
      name: 'Stadium Oval Headlights, Grille & Charging Lightbar',
      category: 'Lighting & Face',
      isOuter: true,
      explodeOffset: [2.45, 0.35, 0],
      desc: 'Rivian’s vertical stadium-oval headlights with internal projector lenses connected by a glowing green-charging lightbar.',
      funFact: 'When you plug in a Rivian to charge, the front and rear lightbars pulse softly in bright green like a battery meter!',
      build(g) {
        const ledWhite = emissiveMat(0xffffff, 1.35);
        const ledGreen = emissiveMat(0x22c55e, 1.15);
        rbox(g, 0.18, 0.38, 1.78, 0.04, launchGreen, [1.96, 0.1, 0]);
        box(g, 0.06, 0.06, 1.68, ledWhite, [2.04, 0.12, 0]);
        box(g, 0.07, 0.03, 0.95, ledGreen, [2.05, 0.12, 0]);
        for (const z of [-0.56, 0.56]) {
          rbox(g, 0.08, 0.28, 0.15, 0.06, ledWhite, [2.05, 0.12, z]);
        }
      },
    },
    {
      id: 'hydraulic-suspension',
      name: 'Kinetic Roll-Control Hydraulic & Helical Suspension',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Four 3D helical spring struts, tubular wishbones, and cross-linked braided hydraulic roll-control lines with AN fittings.',
      funFact: 'At the press of a button, Camp Courtesy Mode levels all four corners automatically so you sleep flat in a rooftop tent!',
      build(g) {
        buildCoiloverSuspension(
          g,
          [
            [1.32, -0.18, 0.72],
            [1.32, -0.18, -0.72],
            [-1.32, -0.18, 0.72],
            [-1.32, -0.18, -0.72],
          ],
          { springColor: 0xf59e0b, damperColor: 0x94a3b8, height: 0.3 },
        );
      },
    },
    {
      id: 'adventure-bed-tent',
      name: 'Pickup Bed, 150 PSI Air Compressor & Crossbars',
      category: 'Cargo & Adventure',
      isOuter: true,
      explodeOffset: [-1.85, 1.35, 0],
      desc: 'Truck bed with a built-in 150 PSI air compressor, braided air chuck hose, and telescoping aluminum cargo crossbars.',
      funFact: 'Underneath the pickup bed floor is a hidden waterproof trunk big enough for a full-size spare off-road tire!',
      build(g) {
        box(g, 1.25, 0.08, 1.62, darkTrim, [-1.38, 0.02, 0]);
        for (const side of [-1, 1]) {
          rbox(g, 1.28, 0.42, 0.12, 0.03, launchGreen, [-1.38, 0.22, side * 0.84]);
        }
        for (const x of [-1.05, -1.68]) {
          rbox(g, 0.08, 0.06, 1.66, 0.02, bashPlate, [x, 0.48, 0]);
        }
        rbox(g, 0.12, 0.4, 1.68, 0.03, launchGreen, [-2.0, 0.22, 0]);
        box(g, 0.04, 0.06, 1.64, emissiveMat(0xff1e27, 1.2), [-2.06, 0.3, 0]);
      },
    },
    {
      id: 'ash-wood-dash',
      name: 'Natural Ash Wood Dash, Steering & Dual Screens',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.65, 1.35, 1.15],
      desc: 'Warm open-pore ash wood dashboard with a rotatable steering wheel, 15.6" center screen, and removable Bluetooth camp speaker!',
      funFact: 'A rechargeable lantern and camp speaker docks right inside the center console and locks automatically when you drive!',
      build(g) {
        const wood = mat(0x8d6e63, { roughness: 0.5 });
        rbox(g, 0.32, 0.2, 1.54, 0.04, wood, [0.62, 0.32, 0]);
        const sw = new THREE.Group();
        sw.position.set(0.42, 0.38, 0.38);
        sw.userData.steerRole = 'steering-wheel';
        g.add(sw);
        torus(sw, 0.18, 0.03, darkTrim, [0, 0, 0], [0, Math.PI / 2, -0.3]);
        rbox(g, 0.04, 0.24, 0.38, 0.02, screenMat('pixel'), [0.5, 0.4, 0]);
      },
    },
    {
      id: 'crew-cab-seats',
      name: '5-Passenger Adventure Crew Seats & Door Flashlight',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.05, 1.6, 0],
      desc: 'Water-resistant forest-edge seats with yellow accents and a 1,000-lumen battery-cell flashlight inside the driver door.',
      funFact: 'Inside the driver door is a pop-out 1,000-lumen LED flashlight powered by one of the exact same battery cells used under the truck!',
      build(g) {
        const mossMat = mat(0x475546, { roughness: 0.48 });
        for (const z of [-0.4, 0.4]) {
          rbox(g, 0.44, 0.12, 0.44, 0.03, mossMat, [0.22, -0.04, z]);
          rbox(g, 0.12, 0.58, 0.42, 0.03, mossMat, [0.02, 0.28, z], [0, 0, 0.16]);
        }
        rbox(g, 0.42, 0.12, 1.36, 0.03, mossMat, [-0.36, 0.0, 0]);
        rbox(g, 0.12, 0.54, 1.36, 0.03, mossMat, [-0.52, 0.28, 0], [0, 0, 0.12]);
      },
    },
    {
      id: 'cab-doors-hood',
      name: 'Sculpted Crew Cab Body, Flared Arches & Power Hood',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [0, 0.55, -2.15],
      desc: 'Sculpted crew cab doors, 3D flared off-road wheel arches, side mirrors, wipers, and power Frunk hood with inner hinge bolts.',
      funFact: 'The front trunk has a drain plug at the bottom so you can fill it with ice and cold drinks for a picnic!',
      build(g) {
        buildSculptedCarBody(g, {
          profile: [
            [-0.58, -0.18],
            [-0.58, 0.46],
            [0.75, 0.46],
            [1.92, 0.28],
            [1.98, -0.18],
          ],
          bodyColor: launchGreen,
          accentColor: yellowAccent,
          wheelPositions: [
            [1.32, -0.22],
            [-1.32, -0.22],
          ],
          archRadius: 0.44,
          halfWidth: 0.86,
          hoodPos: [1.45, 0.34],
          hoodLen: 0.96,
          hoodSlope: -0.06,
          includeHeadlights: false,
          includeGrille: false,
        });
      },
    },
    {
      id: 'panoramic-canopy',
      name: 'Electrochromic Glass Roof & Framed Windshield',
      category: 'Glass & Roof',
      isOuter: true,
      explodeOffset: [0.15, 1.95, 0],
      desc: 'Dynamic glass roof that turns opaque frosted white at the tap of a button plus sculpted cab roof pillars.',
      funFact: 'Liquid crystals inside the glass roof rearrange themselves with electricity to switch from clear to shaded in 1 second!',
      build(g) {
        const glass = glassMat(0x7dd3fc, 0.4);
        const sideGlass = glassMat(0x38bdf8, 0.36);
        rbox(g, 0.72, 0.05, 1.54, 0.02, glass, [0.76, 0.64, 0], [0, 0, -0.62]);
        rbox(g, 1.15, 0.06, 1.54, 0.02, glass, [0.02, 0.88, 0]);
        rbox(g, 0.06, 0.44, 1.52, 0.02, glass, [-0.56, 0.66, 0]);
        // Sculpted Launch Green cab roof cantrails, A/B/C pillars, and tinted crew-cab side windows
        for (const side of [-1, 1]) {
          const z = side * 0.77;
          // Roof cantrail bar
          rbox(g, 1.18, 0.065, 0.07, 0.02, launchGreen, [0.02, 0.87, z]);
          // Sloped A-pillar framing windshield edge flush
          rbox(g, 0.72, 0.065, 0.07, 0.02, launchGreen, [0.76, 0.64, z], [0, 0, -0.62]);
          // Satin-black B-pillar between front & rear crew doors
          rbox(g, 0.08, 0.44, 0.055, 0.015, darkTrim, [0.08, 0.66, z * 1.01]);
          // Thick body-colored C-pillar at rear of cab
          rbox(g, 0.16, 0.45, 0.08, 0.025, launchGreen, [-0.52, 0.66, z]);
          // Front & rear crew-cab side door glass
          rbox(g, 0.56, 0.38, 0.025, 0.01, sideGlass, [0.38, 0.65, z * 0.99]);
          rbox(g, 0.5, 0.38, 0.025, 0.01, sideGlass, [-0.2, 0.65, z * 0.99]);
        }
      },
    },
    {
      id: 'offroad-wheels',
      name: '20" Forged Off-Road Wheels, 3D Hex Lugs & Yellow Calipers',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.15],
      desc: 'Pirelli Scorpion All-Terrain tires on forged rims with 5 chrome hex lug nuts, valve stems, 12 rotor bobbins, and yellow Brembo calipers.',
      funFact: 'You can air down the tires on soft sand and use the truck’s built-in air hose in the bed to pump them back up for the highway!',
      build(g) {
        const corners = [
          [1.32, -0.22, 0.9],
          [1.32, -0.22, -0.9],
          [-1.32, -0.22, 0.9],
          [-1.32, -0.22, -0.9],
        ];
        for (const pos of corners) {
          buildDetailedWheel(g, pos, {
            tireRadius: 0.4,
            tireWidth: 0.26,
            rimColor: 0x334155,
            caliperColor: 0xf59e0b,
            spokes: 8,
            lugCount: 5,
            includeBrake: true,
          });
        }
      },
    },
  ];

  return {
    id: 'rivian-r1t',
    name: 'Rivian R1T Quad-Motor',
    brand: 'Rivian',
    badge: '1,025 HP • Quad-Motor 4x4',
    desc: 'Electric adventure truck with four independent motors, a pass-through Gear Tunnel, stadium oval lightbars, and hydraulic suspension.',
    cameraPos: [4.2, 2.5, 4.4],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'What is the special storage pass-through behind the cab of the Rivian R1T called?',
        correctId: 'gear-tunnel',
        distractors: ['max-pack-battery', 'ash-wood-dash', 'panoramic-canopy'],
      },
      {
        q: 'How many electric motors does the Quad-Motor Rivian R1T use so every wheel has its own motor?',
        correctId: 'quad-motors',
        distractors: ['underbody-shield', 'stadium-lightbar', 'crew-cab-seats'],
      },
    ),
  };
}

// ============================================================================
// 4. FERRARI SF90 STRADALE (Real 358,000-Triangle CAD + V8 Pistons/Turbos/Wires/Bolts)
// ============================================================================
function buildFerrariSF90() {
  const rossoCorsa = carPaint(0xd40000);
  const giallaModena = carPaint(0xffd100);
  const carbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xd8dee9);

  const parts = [
    {
      id: 'carbon-monocoque',
      name: 'Carbon-Fiber Tub, Venturi Floor & Diffuser Strakes',
      category: 'Structure & Aero',
      isOuter: false,
      explodeOffset: [0, -1.35, 0],
      desc: 'Woven carbon-fiber survival cell (`carbon_fibre_trim` CAD) with sculpted ground-effect venturi floor and rear diffuser strakes.',
      funFact: 'Instead of heavy steel, Ferrari bakes sheets of carbon cloth in a giant autoclave oven to make a chassis lighter than aluminum!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['carbon_fibre_trim', 'carbon fibre', 'carpet', 'plastic_gray', 'metal']);
        if (!hasCad) {
          rbox(g, 3.65, 0.08, 1.64, 0.03, carbon, [0, -0.34, 0]);
        }
        for (let z = -0.56; z <= 0.56; z += 0.28) {
          box(g, 0.42, 0.11, 0.02, carbon, [-1.72, -0.25, z], [0, 0, 0.18]);
        }
      },
    },
    {
      id: 'v8-twinturbo',
      name: 'Mid-Mounted 4.0L Twin-Turbo V8 (Pistons, Con-Rods & Coils)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [0.15, 0.68, 0.55],
      desc: 'Full mechanical F154 V8 behind the cockpit featuring 8 reciprocating aluminum pistons, forged H-beam con-rods, billet crank, crinkle-red DOHC valve covers with 16 hex bolts, ignition coil packs, and serpentine belt drive!',
      funFact: 'Putting the heavy V8 engine in the middle of the car—like a Formula 1 race car—helps it pivot around corners lightning fast!',
      build(g) {
        addEngineCadSubassembly(g, [-0.55, -0.04, 0], 0.0011);
        buildDetailedEngineBlock(g, {
          pos: [-0.55, -0.06, 0],
          cylinders: 8,
          layout: 'v',
          valveCoverColor: 0xd40000,
          coilColor: 0xffd100,
          hasTwinTurbos: true,
          scale: 0.96,
        });
      },
    },
    {
      id: 'hot-v-turbos-exhaust',
      name: 'Twin Scroll Turbos & High-Mount Inconel Exhaust Headers',
      category: 'Forced Induction & Exhaust',
      isOuter: false,
      explodeOffset: [-1.55, 0.92, 0.25],
      desc: 'Twin IHI turbochargers, 8 tubular Inconel exhaust runners, wastegate actuators, braided oil lines, and high-mounted titanium tailpipes.',
      funFact: 'The exhaust pipes are made of Inconel—a nickel superalloy also used inside rocket nozzles and jet engines!',
      build(g) {
        addFerrariCadNodes(g, ['chrome']);
        const inconel = brushedMetal(0xc4b5fd, { metalness: 0.92, roughness: 0.16 });
        torus(g, 0.095, 0.036, inconel, [-1.14, 0.06, 0.2], [0, Math.PI / 2, 0]);
        torus(g, 0.095, 0.036, inconel, [-1.14, 0.06, -0.2], [0, Math.PI / 2, 0]);
        for (const side of [-1, 1]) {
          tube(
            g,
            [
              [-1.14, 0.06, side * 0.2],
              [-1.44, 0.1, side * 0.24],
              [-1.78, 0.06, side * 0.2],
            ],
            0.036,
            inconel,
          );
          cyl(g, 0.062, 0.062, 0.28, 20, inconel, [-1.8, 0.06, side * 0.2], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'hybrid-mgu-k',
      name: '3 Axial-Flux Hybrid Motors (RAC-e) & 800V Orange Wiring Loom',
      category: 'Hybrid Electrification',
      isOuter: false,
      explodeOffset: [1.05, 0.38, 0.52],
      desc: 'Two front torque-vectoring electric motors + rear F1 MGU-K motor wired with high-voltage orange 800V cables, Deutsch plugs, and P-clamps.',
      funFact: 'When leaving home early in the morning, the Ferrari can drive 15 miles in 100% silent electric "eDrive" mode without waking the neighbors!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [1.26, -0.18, 0], twin: true, width: 0.56, radius: 0.17 });
        cyl(g, 0.19, 0.19, 0.14, 24, mat(0xff6600, { roughness: 0.25 }), [-1.08, -0.12, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.22, 0.28, 1.04, 0.03, carbon, [-0.18, -0.1, 0]);
        // Full chassis-length 800V Orange + Red 12V + Blue CAN-Bus Wiring Harness with P-clamps
        buildWiringHarness(g, [
          {
            points: [
              [1.26, -0.14, 0.22],
              [0.55, -0.18, 0.26],
              [-0.18, -0.08, 0.24],
              [-1.08, -0.1, 0.16],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [1.26, -0.14, -0.22],
              [0.55, -0.18, -0.26],
              [-0.18, -0.08, -0.24],
              [-1.08, -0.1, -0.16],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'dct-transaxle',
      name: '8-Speed F1 Dual-Clutch Transaxle & Helical Gears',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.45, -0.62, 0.35],
      desc: 'Finned rear paddle-shift gearbox with exposed helical gear pairs, concentric dual-clutch pack, 12 perimeter hex bolts, and CV half-shafts.',
      funFact: 'To save weight, this gearbox has no reverse gear at all—the front electric motors spin backward to reverse the car!',
      build(g) {
        buildDetailedGearbox(g, [-1.38, -0.18, 0]);
      },
    },
    {
      id: 'side-radiators',
      name: 'Twin Front & Side Radiators & Braided AN-10 Coolant Hoses',
      category: 'Cooling & Aero',
      isOuter: false,
      explodeOffset: [1.85, 0.22, 1.25],
      desc: 'Angled aluminum heat exchangers behind the front nose and side scoops plumbed with braided stainless hoses and red/blue anodized AN fittings.',
      funFact: 'Every scoop and vent on a Ferrari is sculpted in a wind tunnel to feed cold air to the radiators without creating drag!',
      build(g) {
        for (const z of [-0.48, 0.48]) {
          rbox(g, 0.22, 0.22, 0.32, 0.02, alu, [1.58, -0.14, z], [0, z > 0 ? -0.35 : 0.35, 0]);
          torus(g, 0.085, 0.014, carbon, [1.52, -0.14, z], [0, Math.PI / 2, 0]);
          rbox(g, 0.26, 0.24, 0.18, 0.02, alu, [-0.45, 0.02, z * 1.28]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [1.56, -0.12, 0.44],
              [0.6, -0.22, 0.52],
              [-0.45, 0.0, 0.58],
            ],
            radius: 0.014,
            color: 0xe2e8f0,
            braided: true,
          },
          {
            points: [
              [1.56, -0.12, -0.44],
              [0.6, -0.22, -0.52],
              [-0.45, 0.0, -0.58],
            ],
            radius: 0.014,
            color: 0xe2e8f0,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'carbon-ceramic-brakes',
      name: 'Brembo Carbon-Ceramic Brakes & Helical Multimatic Shocks',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.48, 1.48],
      desc: 'Real 3D yellow helical coilover springs around Multimatic dampers, tubular A-arm wishbones with hex bolts, and braided brake lines.',
      funFact: 'Carbon-ceramic brake discs weigh half as much as iron discs and never fade even at 1,800°F on a racetrack!',
      build(g) {
        addFerrariCadNodes(g, ['brakes']);
        buildCoiloverSuspension(
          g,
          [
            [1.31, -0.26, 0.66],
            [1.31, -0.26, -0.66],
            [-1.34, -0.26, 0.66],
            [-1.34, -0.26, -0.66],
          ],
          { springColor: 0xffd100, damperColor: 0x94a3b8, height: 0.26 },
        );
      },
    },
    {
      id: 'manettino-cockpit',
      name: 'CAD F1 Steering Wheel with LED Shift Lights & eManettino',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.85, 1.25, 1.15],
      desc: 'Multi-part CAD carbon-fiber steering wheel (`steering_wheel` with shift LEDs, leather grips, column, and paddle shifters) plus digital cluster.',
      funFact: 'Just like a Formula 1 car, a row of bright LEDs on top of the steering wheel rim flashes red when it is time to click the upshift paddle!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['steering_wheel']);
        if (!hasCad) {
          const sw = new THREE.Group();
          sw.position.set(0.36, 0.24, 0.36);
          sw.userData.steerRole = 'steering-wheel';
          g.add(sw);
          torus(sw, 0.17, 0.028, carbon, [0, 0, 0], [0, Math.PI / 2, -0.35]);
        }
        rbox(g, 0.04, 0.18, 0.34, 0.02, screenMat('ios'), [0.58, 0.28, -0.35], [0, 0, -0.25]);
      },
    },
    {
      id: 'daytona-bucket-seats',
      name: 'CAD Cuoio Leather Daytona Racing Bucket Seats & Interior',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.25, 1.15, -1.65],
      desc: 'Authentic sculpted Italian leather bucket seats and cockpit tub (`leather`, `interior_dark`, `interior_light` CAD meshes).',
      funFact: 'The side bolsters hug your ribs so tightly that you stay planted in the seat at 1.5 Gs of cornering force!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['leather', 'interior_dark', 'interior_light']);
        if (!hasCad) {
          const cuoio = mat(0xb45309, { roughness: 0.4 });
          for (const z of [-0.36, 0.36]) {
            rbox(g, 0.44, 0.1, 0.42, 0.03, cuoio, [0.12, -0.18, z]);
            rbox(g, 0.1, 0.56, 0.4, 0.03, cuoio, [-0.08, 0.12, z], [0, 0, 0.25]);
          }
        }
      },
    },
    {
      id: 'sculpted-rosso-body',
      name: 'Rosso Corsa Sculpted CAD Bodywork, S-Duct & Grilles',
      category: 'Exterior & Active Aero',
      isOuter: true,
      explodeOffset: [-0.35, 1.85, -1.95],
      desc: '80,566-triangle wind-tunnel-sculpted Ferrari Rosso Corsa bodywork (`body`, `grills`, `trim`, `yellow_trim` CAD meshes).',
      funFact: 'At 155 mph, the rear active wing drops down to generate 860 pounds of downforce pushing the tires into the track!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['body', 'grills', 'trim', 'yellow_trim', 'blue'], {
          body: rossoCorsa,
        });
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-2.02, -0.12],
              [-1.92, 0.24],
              [-1.05, 0.3],
              [-0.25, 0.18],
              [0.75, 0.16],
              [1.65, 0.08],
              [2.06, -0.14],
              [1.68, -0.24],
              [-1.68, -0.24],
            ],
            bodyColor: rossoCorsa,
            accentColor: giallaModena,
          });
        }
      },
    },
    {
      id: 'canopy-engine-glass',
      name: 'CAD Wraparound Glass Canopy, Wipers & Louvered V8 Showcase',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.45, 2.25, -1.15],
      desc: 'Curved CAD windshield, side windows, clear V8 engine showcase cover, articulated wipers, and LED headlights/taillights (`glass`, `wipers`, `lights`, `lights_red`, `leds`).',
      funFact: 'Ferrari puts a clear glass showcase window over the engine bay so everyone can admire the twin-turbo V8 from outside!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['glass', 'wipers', 'lights', 'lights_red', 'leds']);
        if (!hasCad) {
          const glass = glassMat(0x64b5f6, 0.4);
          rbox(g, 0.92, 0.05, 1.42, 0.02, glass, [0.68, 0.38, 0], [0, 0, -0.46]);
          rbox(g, 0.95, 0.05, 1.12, 0.02, glass, [-0.88, 0.42, 0], [0, 0, 0.32]);
        }
      },
    },
    {
      id: 'forged-star-wheels',
      name: 'CAD 5-Spoke Forged Wheels, 3D Hex Lug Nuts & Pirelli Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.35, -1.85],
      desc: 'Authentic CAD 5-spoke star wheels (`wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr`) with radial tires, yellow Brembo calipers, center caps, and 5 hex lug nuts per wheel.',
      funFact: 'The rear tires are 315 millimeters wide—over a foot across—to put all 986 horsepower down onto the pavement!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']);
        if (!hasCad) {
          const corners = [
            [1.31, -0.2, 0.88],
            [1.31, -0.2, -0.88],
            [-1.34, -0.2, 0.9],
            [-1.34, -0.2, -0.9],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: 0.36,
              tireWidth: 0.27,
              rimColor: 0xe2e8f0,
              caliperColor: 0xffd100,
              spokes: 5,
              lugCount: 5,
              includeBrake: true,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'ferrari-sf90',
    name: 'Ferrari SF90 Stradale',
    brand: 'Ferrari',
    badge: '986 HP • V8 Hybrid Supercar',
    desc: 'Maranello’s flagship hybrid supercar featuring 358,000-triangle CAD bodywork, a mid-mounted 4.0L V8 with moving pistons/turbos/headers, 800V orange wiring harness, and helical coilovers.',
    cameraPos: [4.0, 2.2, 4.2],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'Where is the 4.0L Twin-Turbo V8 engine mounted in the Ferrari SF90 Stradale?',
        correctId: 'v8-twinturbo',
        distractors: ['manettino-cockpit', 'forged-star-wheels', 'canopy-engine-glass'],
      },
      {
        q: 'How does the Ferrari SF90 back up into a parking spot without a heavy mechanical reverse gear?',
        correctId: 'hybrid-mgu-k',
        distractors: ['hot-v-turbos-exhaust', 'daytona-bucket-seats', 'sculpted-rosso-body'],
      },
    ),
  };
}

// ============================================================================
// 5. LAMBORGHINI REVUELTO (1,001 HP V12 Hybrid Scissor-Door Hypercar)
// ============================================================================
function buildLamborghiniRevuelto() {
  const verdeMantis = carPaint(0x65d610);
  const arancio = carPaint(0xff5500);
  const carbon = carbonFiberMat([6, 6]);
  const alu = brushedMetal(0xd1d5db);

  const parts = [
    {
      id: 'monofuselage-tub',
      name: 'Forged Carbon "Monofuselage" Tub & Rear Diffuser',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Aeronautics-inspired 100% carbon-fiber tub and rear ground-effect diffuser strakes.',
      funFact: 'Lamborghini calls the chassis a "Monofuselage" because it is built like a stealth fighter jet’s airframe!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['carbon_fibre_trim', 'carbon fibre', 'plastic_gray', 'metal']);
        if (!hasCad) {
          rbox(g, 3.65, 0.1, 1.66, 0.02, carbon, [0, -0.34, 0]);
        }
        for (let z = -0.56; z <= 0.56; z += 0.28) {
          box(g, 0.44, 0.12, 0.022, carbon, [-1.74, -0.24, z], [0, 0, 0.22]);
        }
      },
    },
    {
      id: 'v12-engine',
      name: 'Naturally Aspirated 6.5L V12 (12 Pistons, Con-Rods & Headers)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-0.85, 1.5, 0],
      desc: 'Twelve cylinders with reciprocating aluminum pistons, forged connecting rods, billet crank, 24 valve-cover hex bolts, 12 ignition coils, and 12 tubular exhaust runners!',
      funFact: 'Lamborghini rotated the V12 engine 180 degrees compared to older models so the gearbox could sit sideways at the back!',
      build(g) {
        addEngineCadSubassembly(g, [-0.65, -0.04, 0], 0.0011);
        buildDetailedEngineBlock(g, {
          pos: [-0.65, -0.06, 0],
          cylinders: 12,
          layout: 'v',
          valveCoverColor: 0x1e242b,
          coilColor: 0xff5500,
          hasTwinTurbos: false,
          scale: 0.88,
        });
        // Gold X-brace strut bar bolted across the V12 engine bay
        box(g, 0.84, 0.028, 0.045, brushedMetal(0xd4af37), [-0.65, 0.22, 0], [0, 0.55, 0]);
        box(g, 0.84, 0.028, 0.045, brushedMetal(0xd4af37), [-0.65, 0.22, 0], [0, -0.55, 0]);
      },
    },
    {
      id: 'hex-exhaust',
      name: 'Twin-Hexagonal High-Mount Titanium Exhaust & Collector Pipes',
      category: 'Exhaust & Sound',
      isOuter: false,
      explodeOffset: [-1.95, 1.1, 0],
      desc: 'Two hexagonal titanium exhaust outlets fed by curved 6-into-1 tubular header collectors.',
      funFact: 'Hexagons and Y-shapes have been Lamborghini’s secret geometric signature since the 1960s!',
      build(g) {
        const tiMat = brushedMetal(0x94a3b8, { metalness: 0.92, roughness: 0.15 });
        cyl(g, 0.095, 0.095, 0.34, 6, tiMat, [-1.8, 0.12, 0.18], [0, 0, Math.PI / 2]);
        cyl(g, 0.095, 0.095, 0.34, 6, tiMat, [-1.8, 0.12, -0.18], [0, 0, Math.PI / 2]);
        for (const side of [-1, 1]) {
          tube(
            g,
            [
              [-1.15, 0.04, side * 0.22],
              [-1.48, 0.09, side * 0.2],
              [-1.78, 0.12, side * 0.18],
            ],
            0.042,
            tiMat,
          );
        }
      },
    },
    {
      id: 'hybrid-tri-motors',
      name: 'Front Axial-Flux E-Axle, Tunnel Battery & 800V Orange Loom',
      category: 'Hybrid Powertrain',
      isOuter: false,
      explodeOffset: [1.4, 0.9, 0],
      desc: 'Two oil-cooled axial-flux front motors + central spine lithium battery wired with orange 800V HV looms, Deutsch connectors, and braided coolant lines.',
      funFact: 'Putting the lithium battery pack inside the center tunnel between the two seats keeps the car balanced like a tightrope walker!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [1.26, -0.18, 0], twin: true, width: 0.6, radius: 0.18 });
        rbox(g, 1.35, 0.18, 0.24, 0.03, arancio, [0.15, -0.16, 0]);
        buildWiringHarness(g, [
          {
            points: [
              [1.26, -0.1, 0.16],
              [0.65, -0.06, 0.14],
              [-0.45, -0.06, 0.14],
              [-1.35, -0.12, 0.16],
            ],
            radius: 0.02,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [1.26, -0.1, -0.16],
              [0.65, -0.06, -0.14],
              [-0.45, -0.06, -0.14],
              [-1.35, -0.12, -0.16],
            ],
            radius: 0.02,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'transverse-gearbox',
      name: 'Transverse 8-Speed Dual-Clutch Gearbox & Helical Gears',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.75, -0.85, 0],
      desc: 'Sideways-mounted 8-speed gearbox behind the V12 with exposed helical gears, dual-clutch pack, and 12 flange hex bolts.',
      funFact: 'Only one other Lamborghini V12 in history—the legendary 1966 Miura—mounted its gearbox sideways!',
      build(g) {
        buildDetailedGearbox(g, [-1.45, -0.16, 0], { transverse: true });
      },
    },
    {
      id: 'pushrod-suspension',
      name: 'Horizontal Pushrod Helical Coilovers & Ceramic Brakes',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Four 3D helical orange coilover springs, tubular A-arm wishbones with hex bolts, pushrod bellcranks, and braided stainless brake lines.',
      funFact: '10-piston front brake calipers—more pistons than most car engines!—bite onto 410mm carbon-ceramic discs.',
      build(g) {
        addFerrariCadNodes(g, ['brakes']);
        buildCoiloverSuspension(
          g,
          [
            [1.26, -0.26, 0.66],
            [1.26, -0.26, -0.66],
            [-1.3, -0.26, 0.66],
            [-1.3, -0.26, -0.66],
          ],
          { springColor: 0xff5500, damperColor: 0xd1d5db, height: 0.26 },
        );
      },
    },
    {
      id: 'scissor-doors',
      name: 'Iconic Vertical Scissor Doors & Y-Intake Blades',
      category: 'Exterior & Access',
      isOuter: true,
      explodeOffset: [0.35, 1.55, -2.05],
      desc: 'Upward-swinging scissor doors with sculpted side mirrors, Y-shaped carbon air intakes, and heavy gas-strut hinge assemblies.',
      funFact: 'Scissor doors aren’t just for show—because V12 Lamborghinis are so wide, swinging the doors upward lets you get out in tight parking spaces!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 1.18, 0.36, 0.08, 0.02, verdeMantis, [0.15, 0.02, side * 0.84], [0, 0, 0.14]);
          box(g, 0.48, 0.22, 0.1, carbon, [-0.46, 0.02, side * 0.85], [0, 0, -0.22]);
        }
      },
    },
    {
      id: 'fighter-cockpit',
      name: '"Feel Like a Pilot" Cockpit, Steering & Red Starter Flip-Cover',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.65, 1.3, 1.15],
      desc: 'Three screens, rotatable carbon steering wheel, billet pedals, and a fighter-jet red flip-up cover over the V12 start button.',
      funFact: 'You can swipe navigation maps with two fingers from the center screen straight onto the passenger’s dashboard display!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['steering_wheel']);
        if (!hasCad) {
          rbox(g, 0.34, 0.18, 1.42, 0.03, carbon, [0.62, 0.16, 0]);
        }
        rbox(g, 0.04, 0.18, 0.28, 0.02, screenMat('samsung'), [0.46, 0.22, 0], [0, 0, -0.25]);
        box(g, 0.08, 0.03, 0.06, arancio, [0.22, 0.02, 0]);
      },
    },
    {
      id: 'hex-sport-seats',
      name: 'Hexagon-Stitched Alcantara Racing Seats',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.05, 1.55, 0],
      desc: 'Low-mounted carbon shell seats with Verde Mantis Y-stripes, side bolsters, and hexagonal laser perforations.',
      funFact: 'Alcantara suede grips your clothes better than slippery leather so you don’t slide around on the racetrack!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['leather', 'interior_dark', 'interior_light']);
        if (!hasCad) {
          const darkSuede = mat(0x1e242b, { roughness: 0.65 });
          for (const z of [-0.38, 0.38]) {
            rbox(g, 0.44, 0.1, 0.42, 0.03, darkSuede, [0.1, -0.18, z]);
            rbox(g, 0.1, 0.56, 0.4, 0.03, darkSuede, [-0.1, 0.12, z], [0, 0, 0.26]);
            box(g, 0.03, 0.35, 0.08, verdeMantis, [-0.07, 0.14, z], [0, 0, 0.26]);
          }
        }
      },
    },
    {
      id: 'wedge-bodywork',
      name: 'Verde Mantis Sculpted Wedge Body, Arches & Exposed Engine Deck',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [0, 0.5, 2.2],
      desc: 'Gandini wedge bodywork with 3D flared wheel arches, flying buttresses, side mirrors, wipers, projector lights, and open-air V12 deck!',
      funFact: 'Unlike most cars, Revuelto has NO rear glass over the engine—the V12 sits right out in the open air between two carbon buttresses!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['body', 'grills', 'trim'], {
          body: verdeMantis,
        });
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-2.06, -0.1],
              [-1.96, 0.28],
              [-0.95, 0.32],
              [0.45, 0.2],
              [1.65, 0.06],
              [2.1, -0.15],
              [1.75, -0.24],
              [-1.75, -0.24],
            ],
            bodyColor: verdeMantis,
            accentColor: carbon,
            wheelPositions: [
              [1.26, -0.21],
              [-1.3, -0.19],
            ],
            archRadius: 0.42,
            halfWidth: 0.86,
            hoodPos: [1.48, 0.04],
            hoodLen: 1.05,
            hoodSlope: -0.2,
            includeWing: true,
            wingHeight: 0.32,
          });
        }
      },
    },
    {
      id: 'y-led-canopy',
      name: 'Stealth Double-Bubble Canopy & Iconic Y-Shaped LEDs',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.2, 1.95, 0],
      desc: 'Steeply raked windshield, double-bubble carbon roof, and glowing Y-shaped front DRLs and rear taillights.',
      funFact: 'The double-bubble roof has two sculpted domes so a tall driver and passenger can wear racing helmets inside!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['glass', 'wipers', 'lights', 'lights_red', 'leds']);
        if (!hasCad) {
          const ledWhite = emissiveMat(0xffffff, 1.45);
          const ledRed = emissiveMat(0xff1e00, 1.35);
          for (const side of [-1, 1]) {
            box(g, 0.32, 0.04, 0.05, ledWhite, [1.92, -0.04, side * 0.68], [0, side * 0.35, -0.2]);
            box(g, 0.06, 0.05, 0.42, ledRed, [-2.02, 0.2, side * 0.58]);
          }
        }
      },
    },
    {
      id: 'alione-wheels',
      name: '21"/22" Forged Alione Wheels, 3D Hex Lugs & Bridgestone Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.15],
      desc: 'Staggered forged titanium-finish wheels with 5 hex lug nuts, brass valve stems, 12 rotor bobbins, and Verde Mantis calipers.',
      funFact: 'Using taller wheels in the back than the front gives a Lamborghini its aggressive nose-down pouncing stance!',
      build(g) {
        const hasCad = addFerrariCadNodes(g, ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'], {
          rim: brushedMetal(0x1e293b, { metalness: 0.9, roughness: 0.18 }),
          caliper: verdeMantis,
        });
        if (!hasCad) {
          const corners = [
            [1.26, -0.21, 0.9],
            [1.26, -0.21, -0.9],
            [-1.3, -0.19, 0.92],
            [-1.3, -0.19, -0.92],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: pos[0] < 0 ? 0.39 : 0.36,
              tireWidth: 0.28,
              rimColor: 0x1e293b,
              caliperColor: 0x65d610,
              spokes: 6,
              lugCount: 5,
              includeBrake: true,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'lamborghini-revuelto',
    name: 'Lamborghini Revuelto V12',
    brand: 'Lamborghini',
    badge: '1,001 HP • V12 + 3 E-Motors',
    desc: 'Sant’Agata’s V12 hybrid flagship featuring scissor doors, a carbon Monofuselage, exposed 6.5L V12 with 12 moving pistons & headers, and twin hexagonal exhausts.',
    cameraPos: [4.0, 2.2, 4.2],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'How do the famous scissor doors on the V12 Lamborghini open?',
        correctId: 'scissor-doors',
        distractors: ['wedge-bodywork', 'hex-exhaust', 'alione-wheels'],
      },
      {
        q: 'How many cylinders are inside the naturally aspirated engine visible in the back of the Revuelto?',
        correctId: 'v12-engine',
        distractors: ['hybrid-tri-motors', 'fighter-cockpit', 'monofuselage-tub'],
      },
    ),
  };
}

// ============================================================================
// 6. FORD F-150 RAPTOR R (720 HP Supercharged V8 Desert Off-Road Pickup)
// ============================================================================
function buildFordF150Raptor() {
  const fordBlue = carPaint(0x0046ad);
  const foxOrange = carPaint(0xff5a00);
  const frameSteel = brushedMetal(0x262d36, { metalness: 0.78, roughness: 0.32 });
  const skidAlu = brushedMetal(0xcbd5e1);

  const parts = [
    {
      id: 'boxed-ladder-frame',
      name: 'Boxed High-Strength Steel Ladder Frame & Bolted Skid Plate',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Two massive rectangular steel rails connected by welded crossmembers and a thick silver front bash plate.',
      funFact: 'Pickup trucks use a "ladder frame" shaped like a giant steel ladder so they can tow heavy boats and trailers without bending!',
      build(g) {
        box(g, 3.96, 0.11, 0.12, frameSteel, [0, -0.25, 0.48]);
        box(g, 3.96, 0.11, 0.12, frameSteel, [0, -0.25, -0.48]);
        for (let x = -1.75; x <= 1.75; x += 0.58) {
          box(g, 0.1, 0.1, 1.08, frameSteel, [x, -0.25, 0]);
        }
        rbox(g, 0.42, 0.2, 1.24, 0.03, skidAlu, [1.9, -0.2, 0], [0, 0, 0.45]);
      },
    },
    {
      id: 'ecoboost-v6-v8',
      name: '5.2L Supercharged Predator V8 (Pistons, Belt Drive & Headers)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [1.55, 1.35, 0],
      desc: 'Front-mounted 720-HP V8 with reciprocating pistons, forged connecting rods, Ford Performance blue valve covers with 16 hex bolts, serpentine supercharger belt, and dual Baja exhaust!',
      funFact: 'Pressing the "Baja" exhaust button on the steering wheel opens special valves in the tailpipes for a trophy-truck roar!',
      build(g) {
        addEngineCadSubassembly(g, [1.32, 0.04, 0], 0.0011);
        buildDetailedEngineBlock(g, {
          pos: [1.32, 0.02, 0],
          cylinders: 8,
          layout: 'v',
          valveCoverColor: 0x0046ad,
          coilColor: 0xff5a00,
          hasTwinTurbos: true,
          scale: 0.88,
        });
        cyl(g, 0.06, 0.06, 0.32, 16, frameSteel, [-2.02, -0.22, 0.56], [0, 0, Math.PI / 2]);
        cyl(g, 0.06, 0.06, 0.32, 16, frameSteel, [-2.02, -0.22, -0.56], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: '4x4-drivetrain',
      name: '10-Speed Transmission, 4x4 Transfer Case, Live Axle & Harness',
      category: '4x4 Drivetrain',
      isOuter: false,
      explodeOffset: [-0.25, -1.1, 0],
      desc: '10-speed gearbox, chain-driven 4x4 transfer case, spinning driveshaft, and solid rear live axle with 12 differential cover hex bolts and wiring loom.',
      funFact: 'In 4-Wheel-Drive Low ("4L"), the transfer case multiplies engine torque so the truck can crawl up steep rocky cliffs at 2 mph!',
      build(g) {
        buildDetailedGearbox(g, [0.68, -0.14, 0], { halfShaftLen: 1.56 });
        rbox(g, 0.28, 0.16, 0.34, 0.025, frameSteel, [0.28, -0.16, 0.1]);
        // Spinning rear driveshaft + rear live axle tube + bolted differential pumpkin
        const ds = new THREE.Group();
        ds.position.set(-0.55, -0.18, 0);
        ds.userData.driveAnim = 'crank';
        g.add(ds);
        cyl(ds, 0.038, 0.038, 1.56, 16, skidAlu, [0, 0, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.055, 0.055, 1.68, 16, frameSteel, [-1.35, -0.2, 0], [Math.PI / 2, 0, 0]);
        sphere(g, 0.13, 18, frameSteel, [-1.35, -0.2, 0]);
        buildWiringHarness(g, [
          {
            points: [
              [1.2, -0.12, 0.35],
              [0.2, -0.2, 0.42],
              [-1.35, -0.18, 0.35],
            ],
            radius: 0.015,
            color: 0xe11d48,
            companionColor: 0x0284c7,
          },
        ]);
      },
    },
    {
      id: 'fox-live-shocks',
      name: 'FOX Live Valve 3.1" Helical Coilovers & Piggyback Reservoirs',
      category: 'Off-Road Suspension',
      isOuter: false,
      explodeOffset: [0, -0.8, 1.9],
      desc: 'Anodized-orange FOX 3.1" internal-bypass dampers wrapped in 3D helical coil springs with forged aluminum control arms and braided brake lines.',
      funFact: 'When sensors detect all four wheels have left the ground over a desert dune, the FOX shocks stiffen in mid-air for a pillowy landing!',
      build(g) {
        buildCoiloverSuspension(
          g,
          [
            [1.38, -0.18, 0.74],
            [1.38, -0.18, -0.74],
            [-1.35, -0.18, 0.74],
            [-1.35, -0.18, -0.74],
          ],
          { springColor: 0xff5a00, damperColor: 0xcbd5e1, height: 0.32, coils: 7.5 },
        );
      },
    },
    {
      id: 'ford-grille-lights',
      name: 'Block-Letter FORD Grille & Amber C-Clamp Marker LEDs',
      category: 'Front Fascia & Lighting',
      isOuter: true,
      explodeOffset: [2.45, 0.25, 0],
      desc: 'Carved F-O-R-D mesh grille with three mandatory DOT amber marker lights and C-clamp projector headlamps.',
      funFact: 'Because the Raptor is as wide as a commercial semi-truck, US highway law requires those three little orange lights in the grille!',
      build(g) {
        rbox(g, 0.2, 0.44, 1.88, 0.03, frameSteel, [2.02, 0.18, 0]);
        for (let i = -1.5; i <= 1.5; i += 1) {
          rbox(g, 0.06, 0.22, 0.24, 0.02, mat(0x374151), [2.11, 0.18, i * 0.32]);
        }
        const amber = emissiveMat(0xff9900, 1.4);
        for (const side of [-1, 1]) {
          rbox(g, 0.08, 0.38, 0.24, 0.02, amber, [2.06, 0.18, side * 0.8]);
        }
        for (const z of [-0.28, 0, 0.28]) {
          box(g, 0.04, 0.04, 0.08, amber, [2.12, 0.36, z]);
        }
      },
    },
    {
      id: 'aluminum-pickup-bed',
      name: 'Military-Grade Aluminum Pickup Box & Flared Rear Fenders',
      category: 'Cargo Bed & Pro Power',
      isOuter: true,
      explodeOffset: [-1.85, 1.25, 0],
      desc: 'High-strength 6000-series aluminum bed with bolted widebody desert fender flares and Pro Power Onboard outlets.',
      funFact: 'Switching the F-150 body from steel to military-grade aluminum alloy shaved 700 pounds off the truck!',
      build(g) {
        box(g, 1.38, 0.08, 1.72, frameSteel, [-1.35, 0.04, 0]);
        for (const side of [-1, 1]) {
          rbox(g, 1.4, 0.46, 0.14, 0.03, fordBlue, [-1.35, 0.26, side * 0.88]);
          rbox(g, 0.9, 0.14, 0.18, 0.03, frameSteel, [-1.35, 0.14, side * 0.96]);
        }
        rbox(g, 0.12, 0.44, 1.78, 0.03, fordBlue, [-2.04, 0.26, 0]);
        rbox(g, 0.05, 0.22, 1.56, 0.02, frameSteel, [-2.1, 0.26, 0]);
      },
    },
    {
      id: 'supercrew-doors',
      name: 'Sculpted SuperCrew Cab, Flared Arches & Extractor Hood',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [0, 0.55, -2.2],
      desc: 'Four SuperCrew doors with 3D flared wheel arches, cast-aluminum running boards, tow mirrors, wipers, and louvered hood.',
      funFact: 'The black louvers on top of the hood let hot air escape from the engine bay while blasting through desert sand!',
      build(g) {
        buildSculptedCarBody(g, {
          profile: [
            [-0.56, -0.16],
            [-0.56, 0.52],
            [0.82, 0.52],
            [1.96, 0.36],
            [1.98, -0.16],
          ],
          bodyColor: fordBlue,
          accentColor: frameSteel,
          wheelPositions: [
            [1.38, -0.22],
            [-1.35, -0.22],
          ],
          archRadius: 0.48,
          halfWidth: 0.88,
          hoodPos: [1.46, 0.44],
          hoodLen: 1.02,
          hoodSlope: -0.05,
          includeHeadlights: false,
          includeGrille: false,
        });
        rbox(g, 0.48, 0.06, 0.68, 0.02, frameSteel, [1.48, 0.5, 0]);
      },
    },
    {
      id: 'work-surface-console',
      name: 'Fold-Flat Work Surface, Raptor Wheel & 12" SYNC Screen',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.65, 1.35, 1.15],
      desc: 'Leather steering wheel with Code Orange 12-o’clock stripe, paddle shifters, fold-flat console, and 6 auxiliary roof switches.',
      funFact: 'Above the windshield is a row of 6 auxiliary toggle switches wired straight to the battery for roof lightbars and winches!',
      build(g) {
        rbox(g, 0.34, 0.24, 1.58, 0.03, frameSteel, [0.68, 0.36, 0]);
        const sw = new THREE.Group();
        sw.position.set(0.46, 0.42, 0.42);
        sw.userData.steerRole = 'steering-wheel';
        g.add(sw);
        torus(sw, 0.19, 0.032, frameSteel, [0, 0, 0], [0, Math.PI / 2, -0.3]);
        box(sw, 0.04, 0.04, 0.06, foxOrange, [0, 0.17, 0]);
        rbox(g, 0.04, 0.24, 0.38, 0.02, screenMat('dashboard'), [0.54, 0.42, 0]);
      },
    },
    {
      id: 'recaro-seats',
      name: 'Recaro Code-Orange Bolstered Seats & Max Recline',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.05, 1.65, 0],
      desc: 'Deep Recaro front bucket seats with Code Orange accents and a flip-up rear bench with lockable under-seat storage.',
      funFact: 'Available Max Recline seats fold almost 180 degrees flat like an airline business-class bed for highway rest stops!',
      build(g) {
        const leather = mat(0x1f2937, { roughness: 0.48 });
        for (const z of [-0.42, 0.42]) {
          rbox(g, 0.46, 0.12, 0.46, 0.03, leather, [0.28, 0.02, z]);
          rbox(g, 0.12, 0.62, 0.44, 0.03, leather, [0.06, 0.34, z], [0, 0, 0.16]);
          box(g, 0.04, 0.4, 0.12, foxOrange, [0.09, 0.34, z], [0, 0, 0.16]);
        }
        rbox(g, 0.44, 0.12, 1.44, 0.03, leather, [-0.34, 0.04, 0]);
        rbox(g, 0.12, 0.56, 1.44, 0.03, leather, [-0.5, 0.34, 0], [0, 0, 0.12]);
      },
    },
    {
      id: 'twin-panel-moonroof',
      name: 'Twin-Panel Moonroof & Acoustic Cab Glass',
      category: 'Glass & Roof',
      isOuter: true,
      explodeOffset: [0.15, 2.0, 0],
      desc: 'Panoramic glass moonroof, steep truck windshield, and power-sliding rear cab window.',
      funFact: 'The center window in the back of the cab slides open electrically so long lumber can poke through or dogs can get fresh breeze!',
      build(g) {
        const glass = glassMat(0x7dd3fc, 0.42);
        const sideGlass = glassMat(0x38bdf8, 0.38);
        rbox(g, 0.72, 0.05, 1.62, 0.02, glass, [0.82, 0.72, 0], [0, 0, -0.65]);
        rbox(g, 1.22, 0.06, 1.62, 0.02, glass, [0.12, 0.96, 0]);
        rbox(g, 0.06, 0.46, 1.58, 0.02, glass, [-0.52, 0.72, 0]);
        // SuperCrew Ford Blue cab roof cantrails, A/B/C pillars, and tinted side door windows
        for (const side of [-1, 1]) {
          const z = side * 0.81;
          rbox(g, 1.26, 0.07, 0.075, 0.02, fordBlue, [0.12, 0.95, z]);
          rbox(g, 0.72, 0.065, 0.075, 0.02, fordBlue, [0.82, 0.72, z], [0, 0, -0.65]);
          rbox(g, 0.085, 0.48, 0.06, 0.015, frameSteel, [0.16, 0.72, z * 1.01]);
          rbox(g, 0.18, 0.48, 0.08, 0.025, fordBlue, [-0.46, 0.72, z]);
          rbox(g, 0.58, 0.4, 0.025, 0.01, sideGlass, [0.46, 0.71, z * 0.99]);
          rbox(g, 0.5, 0.4, 0.025, 0.01, sideGlass, [-0.14, 0.71, z * 0.99]);
        }
      },
    },
    {
      id: 'heavy-brakes-hubs',
      name: 'Heavy-Duty Vented Disc Brakes & 4x4 Locking Hubs',
      category: 'Brakes & Safety',
      isOuter: false,
      explodeOffset: [0, -0.5, 1.75],
      desc: 'Oversized vented iron brake rotors and vacuum-actuated 4x4 front wheel hubs with perimeter hex bolts.',
      funFact: 'Trailer Brake Control lets the truck’s brake pedal also control the electric brakes on a heavy camper trailer behind you!',
      build(g) {
        for (const x of [-1.35, 1.38]) {
          for (const z of [-0.88, 0.88]) {
            cyl(g, 0.16, 0.16, 0.03, 24, skidAlu, [x, -0.22, z], [Math.PI / 2, 0, 0]);
            rbox(g, 0.08, 0.11, 0.065, 0.015, foxOrange, [x + (x > 0 ? -0.1 : 0.1), -0.18, z]);
          }
        }
      },
    },
    {
      id: 'beadlock-37-tires',
      name: '37" BFGoodrich KO2 Tires, 6-Lug Hubs & Beadlock Bolts',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.25],
      desc: 'Towering 37-inch all-terrain tires bolted onto forged beadlock rims with 6 hex lug nuts, brass valve stems, and orange calipers.',
      funFact: 'Each 37-inch tire and wheel assembly is over 3 feet tall and weighs nearly 100 pounds!',
      build(g) {
        const corners = [
          [1.38, -0.22, 0.96],
          [1.38, -0.22, -0.96],
          [-1.35, -0.22, 0.96],
          [-1.35, -0.22, -0.96],
        ];
        for (const pos of corners) {
          buildDetailedWheel(g, pos, {
            tireRadius: 0.45,
            tireWidth: 0.3,
            rimColor: 0x374151,
            caliperColor: 0xff5a00,
            spokes: 8,
            lugCount: 6,
            includeBrake: true,
          });
        }
      },
    },
  ];

  return {
    id: 'ford-f150-raptor',
    name: 'Ford F-150 Raptor R',
    brand: 'Ford',
    badge: '720 HP • FOX Live Valve 4x4',
    desc: 'High-speed desert off-road pickup built on a boxed steel ladder frame with a 720-HP Supercharged V8, helical FOX 3.1" shocks, and 37" beadlock tires.',
    cameraPos: [4.3, 2.6, 4.5],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'Which bright orange off-road parts sense when the Ford F-150 Raptor jumps into the air to soften the landing?',
        correctId: 'fox-live-shocks',
        distractors: ['ford-grille-lights', 'work-surface-console', 'twin-panel-moonroof'],
      },
      {
        q: 'Why does the F-150 Raptor have three little orange amber marker lights built into its front FORD grille?',
        correctId: 'ford-grille-lights',
        distractors: ['boxed-ladder-frame', 'recaro-seats', 'beadlock-37-tires'],
      },
    ),
  };
}

// ============================================================================
// 7. PORSCHE 911 GT3 RS (518 HP Rear-Engine Track Weapon with DRS Wing)
// ============================================================================
function buildPorsche911GT3RS() {
  const pythonGreen = carPaint(0x16a34a);
  const pyroRed = carPaint(0xe11d48);
  const carbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xd8dee9);

  const parts = [
    {
      id: 'lightweight-chassis',
      name: 'Aluminum-Carbon Composite Chassis & Underbody Diffuser',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Wide track chassis (`BodyUnderside`, `BodyWheelwells` CAD) with aluminum-steel floorpan and full underbody aerodynamic diffuser vanes.',
      funFact: 'Even the Porsche crest sticker on the front hood is a thin decal instead of metal to save every gram of weight!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['BodyUnderside', 'BodyWheelwells']);
        if (!hasCad) {
          rbox(g, 3.55, 0.1, 1.62, 0.03, carbon, [0, -0.32, 0]);
        }
        rbox(g, 0.36, 0.05, 1.68, 0.02, carbon, [1.82, -0.28, 0]);
      },
    },
    {
      id: 'flat-six-boxer',
      name: 'Rear-Mounted 4.0L Flat-6 Boxer Engine (Opposed Pistons & ITB)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.85, 0.85, 0],
      desc: 'Six horizontally opposed pistons punching outward behind the rear axle, 6 individual throttle bodies, tubular headers, and twin center titanium tailpipes!',
      funFact: 'The Porsche 911 is the only supercar that hangs its engine all the way in the back behind the rear wheels!',
      build(g) {
        addEngineCadSubassembly(g, [-1.38, -0.08, 0], 0.001);
        buildDetailedEngineBlock(g, {
          pos: [-1.38, -0.1, 0],
          cylinders: 6,
          layout: 'flat',
          valveCoverColor: 0xe11d48,
          coilColor: 0xfacc15,
          hasTwinTurbos: false,
          scale: 0.84,
        });
        cyl(g, 0.06, 0.06, 0.32, 18, alu, [-1.84, -0.2, 0.09], [0, 0, Math.PI / 2]);
        cyl(g, 0.06, 0.06, 0.32, 18, alu, [-1.84, -0.2, -0.09], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'pdk-transaxle',
      name: '7-Speed PDK Dual-Clutch Transaxle & Helical Gears',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-0.95, -0.95, 0],
      desc: 'Sits just ahead of the rear Boxer engine with exposed helical gears, dual-clutch basket, 12 hex bolts, and wiring harness.',
      funFact: 'PDK stands for Porsche Doppelkupplungsgetriebe—a German tongue-twister that means "double-clutch gearbox"!',
      build(g) {
        buildDetailedGearbox(g, [-0.88, -0.18, 0]);
        buildWiringHarness(g, [
          {
            points: [
              [0.6, -0.22, 0.22],
              [-0.2, -0.22, 0.24],
              [-0.88, -0.12, 0.2],
              [-1.38, -0.08, 0.18],
            ],
            radius: 0.016,
            color: 0xe11d48,
            companionColor: 0x0284c7,
          },
        ]);
      },
    },
    {
      id: 'swan-neck-drs-wing',
      name: 'Swan-Neck DRS Active Rear Wing & Hydraulic Actuators',
      category: 'Active Aerodynamics',
      isOuter: true,
      explodeOffset: [-1.95, 1.85, 0],
      desc: 'Towering double-element rear wing on CNC-milled swan-neck pylons with hydraulic DRS rams and carbon endplates.',
      funFact: 'At 177 mph, the GT3 RS wings create 1,895 pounds of downforce—more than the weight of a concert grand piano pushing the car onto the road!',
      build(g) {
        for (const z of [-0.42, 0.42]) {
          box(g, 0.36, 0.54, 0.036, carbon, [-1.54, 0.56, z], [0, 0, -0.25]);
        }
        rbox(g, 0.32, 0.04, 1.72, 0.015, carbon, [-1.7, 0.84, 0], [0, 0, 0.14]);
        rbox(g, 0.2, 0.035, 1.68, 0.01, pythonGreen, [-1.8, 0.92, 0], [0, 0, 0.25]);
        for (const side of [-1, 1]) {
          box(g, 0.42, 0.32, 0.028, carbon, [-1.74, 0.82, side * 0.86]);
        }
      },
    },
    {
      id: 'center-radiator-nostrils',
      name: 'Motorsport Center Radiator, Braided Hoses & Hood Nostrils',
      category: 'Cooling & Aero',
      isOuter: false,
      explodeOffset: [1.95, 1.15, 0],
      desc: 'Angled race-car radiator filling the nose, plumbed with braided stainless AN coolant lines and twin carbon hood nostrils.',
      funFact: 'Roof fins above the windshield push that hot radiator air sideways so the rear engine only breathes icy-cold air!',
      build(g) {
        rbox(g, 0.48, 0.26, 0.96, 0.02, alu, [1.28, -0.06, 0], [0, 0, -0.45]);
        for (const z of [-0.28, 0.28]) {
          rbox(g, 0.32, 0.06, 0.28, 0.015, carbon, [1.28, 0.16, z], [0, 0, -0.22]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [1.28, -0.1, 0.38],
              [0.2, -0.22, 0.46],
              [-1.25, -0.14, 0.34],
            ],
            radius: 0.014,
            color: 0xe2e8f0,
            braided: true,
          },
          {
            points: [
              [1.28, -0.1, -0.38],
              [0.2, -0.22, -0.46],
              [-1.25, -0.14, -0.34],
            ],
            radius: 0.014,
            color: 0xe2e8f0,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'roll-cage-buckets',
      name: 'Weissach Carbon Roll Cage & 3D-Printed Bucket Seats',
      category: 'Interior & Safety',
      isOuter: false,
      explodeOffset: [-0.25, 1.6, 0],
      desc: 'Tubular safety roll cage (`InteriorCage`) bolted behind the CAD carbon full-bucket seats (`InteriorSeatsColor1/2`) with Pyro Red 6-point racing harnesses.',
      funFact: 'Inside the doors, you pull a bright red woven fabric strap to open the latch—saving weight just like vintage 1970s Porsche race cars!',
      build(g) {
        const darkAlcantara = mat(0x1e242b, { roughness: 0.55 });
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'InteriorSeatsColor1',
            'InteriorSeatsColor2',
            'InteriorSeatsFrame1',
            'InteriorSeatsFrame2',
            'InteriorCage',
            'InteriorFloor',
            'InteriorFloormats',
          ],
          { leather: darkAlcantara },
        );
        if (!hasCad) {
          for (const z of [-0.36, 0.36]) {
            rbox(g, 0.42, 0.1, 0.4, 0.03, carbon, [0.1, -0.16, z]);
            rbox(g, 0.1, 0.58, 0.38, 0.03, carbon, [-0.08, 0.14, z], [0, 0, 0.2]);
            box(g, 0.03, 0.42, 0.09, pyroRed, [-0.04, 0.16, z], [0, 0, 0.2]);
          }
        }
        tube(
          g,
          [
            [-0.45, -0.12, -0.52],
            [-0.45, 0.52, -0.46],
            [-0.45, 0.52, 0.46],
            [-0.45, -0.12, 0.52],
          ],
          0.028,
          pythonGreen,
        );
      },
    },
    {
      id: 'ball-joint-suspension',
      name: 'Aero-Wishbone Helical Coilover Suspension & PCCB Brakes',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.8],
      desc: 'Four 3D yellow helical coilover springs, teardrop aero wishbones with rose-joint hex bolts, and CAD PCCB brake discs & calipers.',
      funFact: 'Even the metal suspension arms inside the front wheel wells are shaped like little airplane wings!',
      build(g) {
        addCarConceptCadNodes(
          g,
          [
            'Axles',
            'WheelFrontLBrakeDisc',
            'WheelFrontLBrakePad',
            'WheelFrontRBrakeDisc',
            'WheelFrontRBrakePad',
            'WheelRearLBrakeDisc',
            'WheelRearLBrakePad',
            'WheelRearRBrakeDisc',
            'WheelRearRBrakePad',
          ],
          { caliper: carPaint(0xfacc15) },
        );
        buildCoiloverSuspension(
          g,
          [
            [1.24, -0.26, 0.66],
            [1.24, -0.26, -0.66],
            [-1.24, -0.26, 0.66],
            [-1.24, -0.26, -0.66],
          ],
          { springColor: 0xfacc15, damperColor: 0x94a3b8, height: 0.26 },
        );
      },
    },
    {
      id: 'track-steering-dials',
      name: '4-Dial Track Steering Wheel, Pedals & 10,000 RPM Tachometer',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.65, 1.35, 1.15],
      desc: 'CAD cockpit dashboard (`InteriorDashMid`, `InteriorSteeringWheel`), billet pedals (`InteriorPedalAccel`, `InteriorPedalBrake`), and yellow central 10,000 RPM tachometer.',
      funFact: 'Right in the middle of the gauge cluster is a real physical needle tachometer that counts up to 10,000 RPM!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, [
          'InteriorDashMid',
          'InteriorDashSides',
          'InteriorPedalAccel',
          'InteriorPedalAccelArm',
          'InteriorPedalBrake',
          'InteriorPedalBrakeArm',
          'InteriorSteeringBase',
          'InteriorSteeringDash',
          'InteriorSteeringDashColumn',
          'InteriorSteeringWheel',
        ]);
        if (!hasCad) {
          rbox(g, 0.32, 0.2, 1.4, 0.03, carbon, [0.58, 0.24, 0]);
          const sw = new THREE.Group();
          sw.position.set(0.36, 0.28, 0.36);
          sw.userData.steerRole = 'steering-wheel';
          g.add(sw);
          torus(sw, 0.17, 0.028, carbon, [0, 0, 0], [0, Math.PI / 2, -0.32]);
        }
        cyl(g, 0.09, 0.09, 0.04, 20, carPaint(0xfacc15), [0.52, 0.34, 0.36], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'louvered-fenders-doors',
      name: 'Sculpted CFRP Louvered Fenders, Flared Arches & Doors',
      category: 'Exterior & Aero',
      isOuter: true,
      explodeOffset: [0, 0.55, -2.2],
      desc: 'Sculpted 911 CAD bodywork (`BodyHood`, `BodyRearPanelsColor1`, `BodyDoorL/R`) in Python Green with a Weissach carbon hood and carbon shark-gill fender louvers.',
      funFact: 'If trapped air builds up inside spinning wheel wells, it lifts the front of a car—the fender louvers let that air escape!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyHood',
            'BodyHoodInterior01',
            'BodyHoodInterior02',
            'BodyHoodTopgrill',
            'BodyHoodUnder',
            'BodyRearPanelsColor1',
            'BodyPanelsColor2',
            'BodyDoorRColor1',
            'BodyDoorRColor2',
            'BodyDoorRHandle01',
            'BodyDoorRHandle02',
            'BodyDoorRMirror',
            'BodyDoorRMirrorColor1',
            'BodyDoorRMirrorColor2',
            'InteriorDoorR01',
            'InteriorDoorR02',
            'BodyDoorLColor1',
            'BodyDoorLColor2',
            'BodyDoorLHandle01',
            'BodyDoorLHandle02',
            'BodyDoorLMirror',
            'BodyDoorLMirrorColor1',
            'BodyDoorLMirrorColor2',
            'InteriorDoorL01',
            'InteriorDoorL02',
          ],
          { body: pythonGreen, BodyHood: carbon, trim: carbon },
        );
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-1.95, -0.14],
              [-1.82, 0.24],
              [-0.95, 0.42],
              [-0.1, 0.52],
              [0.75, 0.28],
              [1.82, 0.1],
              [1.96, -0.14],
              [1.62, -0.22],
              [-1.62, -0.22],
            ],
            bodyColor: pythonGreen,
            accentColor: carbon,
            wheelPositions: [
              [1.24, -0.21],
              [-1.24, -0.19],
            ],
            archRadius: 0.41,
            halfWidth: 0.85,
            hoodPos: [1.38, 0.14],
            hoodLen: 0.96,
            hoodSlope: -0.18,
            includeHeadlights: false,
          });
        }
        for (const side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            box(g, 0.036, 0.024, 0.14, carbon, [1.18 + i * 0.075, 0.19, side * 0.78], [0, 0, 0.28]);
          }
        }
      },
    },
    {
      id: 'lightweight-glass-roof',
      name: 'Gorilla Glass Windows & Magnesium Roof with Aero Fins',
      category: 'Glass & Roof',
      isOuter: true,
      explodeOffset: [0, 1.95, 0],
      desc: 'Thin smartphone-style Gorilla Glass windows (`BodyWindshield`, `BodyDoorL/RWindow`, `BodyRearwindow`) and a Weissach carbon/magnesium roof (`BodyRoofPanel`) with two vertical aerodynamic fins.',
      funFact: 'Using ultra-thin acoustic Gorilla Glass for the windows saves weight right at the top of the car where it matters most!',
      build(g) {
        const glass = glassMat(0x7dd3fc, 0.4);
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyWindshield',
            'BodyWindshieldGasket',
            'BodyWindshieldWipers',
            'BodyWindshieldWipersBase',
            'BodyRoofPanel',
            'BodyRearwindow',
            'BodyWindowsRearSides',
            'BodyPillars',
            'BodyDoorRWindow',
            'BodyDoorRWindowGasket',
            'BodyDoorLWindow',
            'BodyDoorLWindowGasket',
          ],
          { body: pythonGreen, BodyRoofPanel: carbon, glass },
        );
        if (!hasCad) {
          rbox(g, 0.78, 0.05, 1.38, 0.02, glass, [0.58, 0.48, 0], [0, 0, -0.52]);
          rbox(g, 0.92, 0.06, 1.36, 0.02, carbon, [-0.08, 0.7, 0]);
          rbox(g, 0.78, 0.05, 1.34, 0.02, glass, [-0.88, 0.5, 0], [0, 0, 0.48]);
        }
        box(g, 0.62, 0.032, 0.022, pythonGreen, [-0.14, 0.54, 0.36]);
        box(g, 0.62, 0.032, 0.022, pythonGreen, [-0.14, 0.54, -0.36]);
      },
    },
    {
      id: 'four-point-headlights',
      name: 'Oval 4-Point Matrix LED Headlights & Rear PORSCHE Lightbar',
      category: 'Lighting',
      isOuter: true,
      explodeOffset: [2.2, 0.65, 0],
      desc: 'CAD projector headlamps (`BodyHeadlights`), rear light strip (`BodyTaillights`, `BodyTaillightsPanels`), and 4-point LED DRLs.',
      funFact: 'Every Porsche 911 since 1963 has kept the same iconic round headlights and sloping roofline!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, [
          'BodyHeadlights',
          'BodyTaillights',
          'BodyTaillightsPanels',
          'BodyTurnsignalsRear',
        ]);
        if (!hasCad) {
          const ledWhite = emissiveMat(0xffffff, 1.4);
          for (const z of [-0.62, 0.62]) {
            cyl(g, 0.16, 0.16, 0.08, 24, ledWhite, [1.72, 0.14, z], [0, 0, -1.1]);
            torus(g, 0.165, 0.018, carbon, [1.74, 0.15, z], [0, Math.PI / 2, -0.45]);
          }
          rbox(g, 0.08, 0.07, 1.58, 0.02, emissiveMat(0xff1e27, 1.25), [-1.92, 0.14, 0]);
        }
      },
    },
    {
      id: 'centerlock-magnesium-wheels',
      name: 'Center-Lock Forged Magnesium Wheels (Pyro Red) & PCCB Rotors',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.15],
      desc: 'Pyro Red forged magnesium CAD wheels (`wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr`) with central anodized hex lock nuts and yellow PCCB calipers!',
      funFact: 'Forged magnesium wheels save 19 pounds of spinning mass so the steering feels telepathic!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'], {
          rim: pyroRed,
          caliper: carPaint(0xfacc15),
          excludeBrakes: true,
        });
        if (!hasCad) {
          const corners = [
            [1.287, -0.2, 0.898],
            [1.287, -0.2, -0.898],
            [-1.289, -0.2, 0.903],
            [-1.289, -0.2, -0.903],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: pos[0] < 0 ? 0.38 : 0.36,
              tireWidth: 0.27,
              rimColor: 0xe11d48,
              caliperColor: 0xfacc15,
              spokes: 10,
              lugCount: 5,
              includeBrake: false,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'porsche-911-gt3rs',
    name: 'Porsche 911 GT3 RS',
    brand: 'Porsche',
    badge: '518 HP • 9,000 RPM Flat-6 + DRS',
    desc: 'Rear-engine track icon featuring a 9,000 RPM Flat-6 Boxer engine with moving opposed pistons, swan-neck DRS rear wing, and center-lock magnesium wheels.',
    cameraPos: [4.0, 2.2, 4.2],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'What makes the Porsche 911’s engine location unique among all modern sports cars?',
        correctId: 'flat-six-boxer',
        distractors: ['center-radiator-nostrils', 'track-steering-dials', 'lightweight-glass-roof'],
      },
      {
        q: 'Which giant part on the back of the GT3 RS flattens out on straightaways like a Formula 1 race car?',
        correctId: 'swan-neck-drs-wing',
        distractors: ['pdk-transaxle', 'roll-cage-buckets', 'four-point-headlights'],
      },
    ),
  };
}

// ============================================================================
// 8. TESLA MODEL X PLAID (1,020 HP Tri-Motor Falcon-Wing Luxury SUV)
// ============================================================================
function buildTeslaModelXPlaid() {
  const pearlWhite = carPaint(0xf8fafc, { metalness: 0.32, roughness: 0.12, clearcoat: 1.0 });
  const satinBlack = mat(0x111827, { roughness: 0.38, metalness: 0.25 });
  const darkMetal = brushedMetal(0x2b3440);
  const alu = brushedMetal(0xcfd6df);
  const carbon = carbonFiberMat([4, 4]);
  const crimsonCaliper = carPaint(0xd90429);

  // SUV crossover proportion matrix applied to CarConcept CAD nodes (taller roofline & ground clearance)
  const suvMatrix = new THREE.Matrix4();
  {
    const o = new THREE.Object3D();
    o.scale.set(1.01, 1.18, 1.05);
    o.position.set(0, 0.07, 0);
    o.updateMatrix();
    suvMatrix.copy(o.matrix);
  }

  const parts = [
    {
      id: 'modelx-skateboard-chassis',
      name: 'SUV Aluminum Skateboard Chassis, Tow Hitch & Gigacastings',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.6, 0],
      desc: 'Reinforced SUV structural floorpan with front and rear high-pressure aluminum Gigacastings and a 5,000-lb rated receiver tow hitch.',
      funFact: 'Even with its Falcon Wing doors and 6 seats, Model X can tow a 5,000-pound Airstream travel trailer or boat!',
      build(g) {
        addCarConceptCadNodes(g, ['BodyUnderside'], { trim: darkMetal }, suvMatrix);
        rbox(g, 3.52, 0.09, 1.58, 0.02, alu, [0, -0.3, 0]);
        for (const xEnd of [-1.42, 1.42]) {
          rbox(g, 0.58, 0.16, 1.42, 0.025, alu, [xEnd, -0.24, 0]);
        }
        // Rear 5,000-lb forged steel tow hitch receiver
        rbox(g, 0.22, 0.08, 0.12, 0.015, darkMetal, [-1.96, -0.24, 0]);
      },
    },
    {
      id: 'modelx-structural-battery',
      name: '100 kWh 800V Structural Battery Pack & Orange HV Loom',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: 'Armored underfloor lithium-ion battery pack with 5 liquid-cooled module bays, copper busbars, and dual orange high-voltage harnesses.',
      funFact: 'Placing 1,200 pounds of battery cells flat under the floor gives Model X the lowest rollover risk of any SUV ever tested!',
      build(g) {
        rbox(g, 2.34, 0.15, 1.5, 0.025, darkMetal, [0, -0.22, 0]);
        const moduleMat = brushedMetal(0x38bdf8, { metalness: 0.85, roughness: 0.18 });
        const busbarCopper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.15 });
        for (let m = -2; m <= 2; m++) {
          rbox(g, 0.4, 0.045, 1.38, 0.01, moduleMat, [m * 0.44, -0.14, 0]);
          box(g, 0.36, 0.016, 0.06, busbarCopper, [m * 0.44, -0.115, 0]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-1.16, -0.13, 0.65],
              [0, -0.12, 0.65],
              [1.16, -0.13, 0.65],
            ],
            radius: 0.019,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [-1.16, -0.13, -0.65],
              [0, -0.12, -0.65],
              [1.16, -0.13, -0.65],
            ],
            radius: 0.019,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'modelx-rear-twin-motors',
      name: 'Twin Rear Carbon-Sleeved Plaid Motors (670 HP Rear Axle)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [-1.85, 0.95, 0],
      desc: 'Dual independent rear electric motors with carbon-overwrapped rotors and copper hairpin stators delivering instant torque vectoring.',
      funFact: 'Model X Plaid launches a 5,400-pound family SUV from 0 to 60 mph in 2.5 seconds—quicker than most V10 supercars!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.29, -0.16, 0], twin: true, width: 0.72, radius: 0.22 });
      },
    },
    {
      id: 'modelx-front-motor-inverter',
      name: 'Front Carbon-Sleeved Drive Unit & SiC Inverter (350 HP Front)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [1.75, 1.05, 0],
      desc: 'Front permanent-magnet carbon-sleeved motor and silicon-carbide inverter powering the front axle for all-wheel-drive traction.',
      funFact: 'When cruising on the highway, the front motor can sleep while the rear motors push efficiently to maximize range!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [1.29, -0.15, 0], twin: false, width: 0.66, radius: 0.2 });
      },
    },
    {
      id: 'modelx-octovalve-hepa',
      name: 'Octovalve Heat Pump & Bioweapon Defense Mode HEPA Filter',
      category: 'HVAC & Filtration',
      isOuter: false,
      explodeOffset: [2.25, 1.15, 0],
      desc: 'Hospital-grade pleated HEPA air filtration canister under the front hood paired with the 8-way Octovalve thermal management system.',
      funFact: 'The HEPA filter is 10 times larger than a normal car cabin filter and scrubs 99.97% of smoke, pollen, and bacteria from outside air!',
      build(g) {
        // Deep Frunk tub + wide pleated hospital-grade HEPA filter housing ahead of cowl
        rbox(g, 0.56, 0.24, 1.06, 0.035, satinBlack, [1.34, 0.08, 0]);
        rbox(g, 0.24, 0.12, 0.96, 0.02, brushedMetal(0x38bdf8), [1.02, 0.24, 0], [0, 0, -0.25]);
        for (let z = -0.42; z <= 0.42; z += 0.07) {
          box(g, 0.22, 0.13, 0.012, pearlWhite, [1.02, 0.24, z], [0, 0, -0.25]);
        }
        // Octovalve thermal manifold + braided coolant lines
        sphere(g, 0.1, 16, darkMetal, [1.56, -0.02, 0.28]);
        buildWiringHarness(g, [
          {
            points: [
              [1.56, -0.02, 0.28],
              [1.42, -0.06, 0.1],
              [1.29, -0.12, -0.18],
            ],
            radius: 0.014,
            color: 0x0284c7,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'modelx-falcon-wing-doors',
      name: 'Articulated Double-Hinged Falcon Wing Rear Doors & Inductive Struts',
      category: 'Signature Access',
      isOuter: true,
      explodeOffset: [-0.25, 1.95, 0],
      desc: 'Double-hinged electro-hydraulic gullwing rear doors with ultrasonic roof/side obstacle sensors, dual inductive lift struts, and tinted roof glass.',
      funFact: 'Ultrasonic sensors see how close neighboring cars or garage ceilings are and bend the two door hinges to squeeze open in just 12 inches of side space!',
      build(g) {
        const glass = glassMat(0x38bdf8, 0.44);
        // Central roof spine housing the dual electro-hydraulic Falcon Wing hinges
        rbox(g, 0.82, 0.04, 0.36, 0.015, pearlWhite, [-0.36, 0.67, 0]);
        for (const side of [-1, 1]) {
          const wingGroup = new THREE.Group();
          wingGroup.position.set(-0.36, 0.66, side * 0.18);
          // Partially elevated Falcon Wing posture (+12° gullwing lift) connected directly to the SUV roof spine
          wingGroup.rotation.x = side * -0.18;
          g.add(wingGroup);

          // Upper roof-hinged gullwing section + tinted upper falcon glass
          rbox(wingGroup, 0.78, 0.04, 0.52, 0.016, pearlWhite, [0, 0, side * 0.26]);
          rbox(wingGroup, 0.68, 0.045, 0.42, 0.012, glass, [0, 0.004, side * 0.26]);

          // Outer double-hinge knuckle + contoured lower door skin & side window
          const lowerDoor = new THREE.Group();
          lowerDoor.position.set(0, -0.02, side * 0.52);
          lowerDoor.rotation.x = side * 0.16;
          wingGroup.add(lowerDoor);

          rbox(lowerDoor, 0.76, 0.26, 0.048, 0.016, glass, [0, -0.13, 0], [side * -0.14, 0, 0]);
          rbox(lowerDoor, 0.8, 0.38, 0.06, 0.02, pearlWhite, [0, -0.42, side * 0.03]);
          rbox(lowerDoor, 0.76, 0.07, 0.065, 0.014, satinBlack, [0, -0.61, side * 0.035]);
          // Chrome flush capacitive door handle
          box(lowerDoor, 0.14, 0.022, 0.068, chromeMat(), [0.24, -0.28, side * 0.035]);

          // Twin motorized inductive gas struts connecting B/C roof headers to Falcon Wing
          for (const sx of [-0.68, -0.04]) {
            cyl(g, 0.014, 0.012, 0.28, 12, chromeMat(), [sx, 0.54, side * 0.56], [side * 0.38, 0, 0]);
          }
        }
      },
    },
    {
      id: 'modelx-air-suspension-brakes',
      name: 'Adaptive Air Suspension Coilovers, CAD Brake Discs & Red Calipers',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.75],
      desc: 'Height-adjustable air suspension struts, forged control arms, and ventilated CAD brake rotors with crimson 6-piston Brembo calipers.',
      funFact: 'Model X remembers steep driveways by GPS location and raises its air suspension automatically every time you arrive home!',
      build(g) {
        addCarConceptCadNodes(
          g,
          [
            'Axles',
            'WheelFrontLBrakeDisc',
            'WheelFrontLBrakePad',
            'WheelFrontRBrakeDisc',
            'WheelFrontRBrakePad',
            'WheelRearLBrakeDisc',
            'WheelRearLBrakePad',
            'WheelRearRBrakeDisc',
            'WheelRearRBrakePad',
          ],
          { caliper: crimsonCaliper },
        );
        buildCoiloverSuspension(
          g,
          [
            [1.287, -0.22, 0.7],
            [1.287, -0.22, -0.7],
            [-1.289, -0.22, 0.7],
            [-1.289, -0.22, -0.7],
          ],
          { springColor: 0xd90429, damperColor: 0xcbd5e1, height: 0.3 },
        );
      },
    },
    {
      id: 'modelx-yoke-tilting-cockpit',
      name: 'Carbon Steering Yoke, 17" Tilting Display & Rear Passenger Screen',
      category: 'Cockpit & FSD Computer',
      isOuter: false,
      explodeOffset: [0.55, 1.45, 1.2],
      desc: 'Sculpted SUV dashboard with rotatable carbon steering yoke, motorized 17-inch tilting center display, and rear 9.4-inch entertainment screen.',
      funFact: 'A motorized swivel mount behind the 17-inch touchscreen tilts the screen toward the driver or toward the passenger at a tap!',
      build(g) {
        addCarConceptCadNodes(
          g,
          ['InteriorDashMid', 'InteriorDashSides', 'InteriorPedalAccel', 'InteriorPedalBrake'],
          { dash: satinBlack },
          suvMatrix,
        );
        const yokeG = new THREE.Group();
        yokeG.position.set(0.38, 0.42, 0.38);
        yokeG.userData.steerRole = 'steering-wheel';
        g.add(yokeG);
        rbox(yokeG, 0.05, 0.16, 0.32, 0.02, carbon, [0, 0, 0], [0, 0, -0.32]);
        cyl(yokeG, 0.03, 0.03, 0.22, 14, alu, [0.1, -0.05, 0], [0, 0, Math.PI / 2 - 0.32]);
        // Front 17" motorized tilting display + Rear 2nd-row passenger gaming display
        rbox(g, 0.04, 0.25, 0.39, 0.02, screenMat('dashboard'), [0.46, 0.44, 0], [0, -0.14, -0.18]);
        rbox(g, 0.035, 0.15, 0.24, 0.015, screenMat('ios'), [-0.08, 0.12, 0], [0, 0, 0.25]);
      },
    },
    {
      id: 'modelx-six-seat-interior',
      name: '6-Passenger Monopost Captain’s Chairs (3-Row 2+2+2 Layout)',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0, 1.4, -1.65],
      desc: 'Three rows of Ultra-White vegan leather seating featuring sculpted second-row monopost pedestal Captain’s Chairs and a center walkthrough aisle.',
      funFact: 'The second-row Captain’s Chairs are mounted on single sculpted aluminum pedestals like modern Eames lounge furniture!',
      build(g) {
        const whiteLeather = mat(0xf8fafc, { roughness: 0.34, metalness: 0.05 });
        // Row 1 (Front) + Row 2 (Monopost Captain's Chairs) + Row 3 (Rear 2-Passenger Seats)
        const rows = [
          { x: 0.24, zSpan: 0.4, h: 0.62, monopost: false },
          { x: -0.36, zSpan: 0.38, h: 0.6, monopost: true },
          { x: -0.92, zSpan: 0.32, h: 0.52, monopost: false },
        ];
        for (const row of rows) {
          for (const side of [-1, 1]) {
            const z = side * row.zSpan;
            rbox(g, 0.42, 0.11, 0.38, 0.035, whiteLeather, [row.x, -0.04, z]);
            rbox(g, 0.11, row.h, 0.36, 0.035, whiteLeather, [row.x - 0.18, 0.24, z], [0, 0, 0.18]);
            rbox(g, 0.1, row.h * 0.92, 0.34, 0.03, satinBlack, [row.x - 0.21, 0.24, z], [0, 0, 0.18]);
            if (row.monopost) {
              cyl(g, 0.045, 0.065, 0.22, 16, alu, [row.x - 0.04, -0.18, z], [0, 0, 0.15]);
            }
          }
        }
      },
    },
    {
      id: 'modelx-sculpted-suv-body',
      name: 'Pearl-White Sculpted Crossover Body, Front Doors & Active Rear Wing',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [0, 1.75, -1.95],
      desc: 'Sculpted SUV crossover bodywork (`BodyHood`, `BodyRearPanelsColor1`, `BodyDoorL/R` CAD scaled to SUV proportions) with satin-black wheel-arch cladding and an active rear spoiler.',
      funFact: 'The front driver’s door senses your phone key as you walk up, swings open automatically, and closes itself when you press the brake pedal!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyHood',
            'BodyHoodInterior01',
            'BodyHoodInterior02',
            'BodyHoodTopgrill',
            'BodyHoodUnder',
            'BodyRearPanelsColor1',
            'BodyPanelsColor2',
            'BodyDoorRColor1',
            'BodyDoorRColor2',
            'BodyDoorRHandle01',
            'BodyDoorRMirror',
            'BodyDoorRMirrorColor1',
            'BodyDoorLColor1',
            'BodyDoorLColor2',
            'BodyDoorLHandle01',
            'BodyDoorLMirror',
            'BodyDoorLMirrorColor1',
            'BodyHeadlights',
            'BodyTaillights',
            'BodyTaillightsPanels',
          ],
          { body: pearlWhite, trim: satinBlack },
          suvMatrix,
        );
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-2.05, -0.1],
              [-1.92, 0.42],
              [-0.85, 0.72],
              [0.15, 0.76],
              [1.15, 0.36],
              [2.05, 0.12],
              [2.08, -0.14],
            ],
            bodyColor: pearlWhite,
          });
        }
        // Sculpted Active Rear Spoiler bridge across the fastback tailgate
        rbox(g, 0.24, 0.036, 1.46, 0.014, carbon, [-1.84, 0.52, 0], [0, 0, 0.14]);
        for (const z of [-0.52, 0.52]) {
          box(g, 0.14, 0.08, 0.03, satinBlack, [-1.82, 0.47, z]);
        }
      },
    },
    {
      id: 'modelx-helicopter-sky-canopy',
      name: 'Panoramic "Big Sky" Helicopter Windshield & UV Roof Canopy',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.45, 2.25, 0],
      desc: '31-square-foot continuous solar-tinted panoramic windshield (`BodyWindshield` CAD) stretching seamlessly from the front hood right over the front seats.',
      funFact: 'Model X has the largest all-glass windshield in production—almost 31 square feet of curved acoustic glass with magnetic sunvisors!',
      build(g) {
        const glass = glassMat(0x38bdf8, 0.4);
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyWindshield',
            'BodyWindshieldGasket',
            'BodyWindshieldWipers',
            'BodyWindshieldWipersBase',
            'BodyRoofPanel',
            'BodyRearwindow',
            'BodyWindowsRearSides',
            'BodyPillars',
            'BodyDoorRWindow',
            'BodyDoorLWindow',
          ],
          { body: pearlWhite, glass, trim: satinBlack },
          suvMatrix,
        );
        if (!hasCad) {
          rbox(g, 1.25, 0.05, 1.52, 0.02, glass, [0.52, 0.68, 0], [0, 0, -0.48]);
        }
      },
    },
    {
      id: 'modelx-22-turbine-wheels',
      name: '22" Machined Turbine Forged Wheels & Pirelli Scorpion EV Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.4, -1.95],
      desc: '22-inch Onyx Black machined turbine alloy wheels (`WheelFrontL/R`, `WheelRearL/R` CAD) with acoustic-foam Pirelli Scorpion tires and crimson Brembo calipers.',
      funFact: 'Twisted turbine wheel blades pump hot air outward away from the brakes while smoothing airflow along the sides of the SUV!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'], {
          rim: brushedMetal(0x1f2937, { metalness: 0.92, roughness: 0.16 }),
          caliper: crimsonCaliper,
          excludeBrakes: true,
        });
        if (!hasCad) {
          const corners = [
            [1.287, -0.2, 0.898],
            [1.287, -0.2, -0.898],
            [-1.289, -0.2, 0.903],
            [-1.289, -0.2, -0.903],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: 0.38,
              tireWidth: 0.27,
              rimColor: 0x1f2937,
              caliperColor: 0xd90429,
              spokes: 10,
              lugCount: 5,
              includeBrake: false,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'tesla-model-x-plaid',
    name: 'Tesla Model X Plaid',
    brand: 'Tesla',
    badge: '1,020 HP • Falcon Wing Doors',
    desc: '1,020-HP tri-motor electric luxury SUV featuring articulated double-hinged Falcon Wing rear doors, a panoramic helicopter windshield, 6-seat Captain’s Chair cabin, and Bioweapon Defense HEPA filtration.',
    cameraPos: [4.2, 2.4, 4.4],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'Which double-hinged rear doors on the Tesla Model X use ultrasonic sensors to open upward in tight parking spots?',
        correctId: 'modelx-falcon-wing-doors',
        distractors: ['modelx-helicopter-sky-canopy', 'modelx-six-seat-interior', 'modelx-22-turbine-wheels'],
      },
      {
        q: 'Which oversized hospital-grade part under the front hood scrubs 99.97% of smoke and pollen from cabin air?',
        correctId: 'modelx-octovalve-hepa',
        distractors: ['modelx-structural-battery', 'modelx-rear-twin-motors', 'modelx-skateboard-chassis'],
      },
    ),
  };
}

// ============================================================================
// 9. NEW TESLA ROADSTER (SpaceX Cold-Gas Thruster Package • 0–60 in 1.1s)
// ============================================================================
function buildTeslaRoadster2() {
  const liquidCherry = carPaint(0xb91c1c, { metalness: 0.65, roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.03 });
  const satinCarbon = carbonFiberMat([6, 6]);
  const titanium = brushedMetal(0xd8dee9, { metalness: 0.92, roughness: 0.16 });
  const darkTi = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.2 });
  const copper = brushedMetal(0xd97706, { metalness: 0.94, roughness: 0.14 });
  const thrusterGlow = emissiveMat(0x38bdf8, 2.2);

  // Sleek low-slung widebody hypercar proportion transform for the 358k-triangle CAD shell
  const roadsterMatrix = new THREE.Matrix4();
  {
    const o = new THREE.Object3D();
    o.scale.set(1.02, 0.96, 1.04);
    o.position.set(0, -0.01, 0);
    o.updateMatrix();
    roadsterMatrix.copy(o.matrix);
  }

  const parts = [
    {
      id: 'roadster-carbon-tub-diffuser',
      name: 'Bonded Carbon-Fiber Monocoque Tub & Ground-Effect Venturi Diffuser',
      category: 'Structure & Aero',
      isOuter: false,
      explodeOffset: [0, -1.5, 0],
      desc: 'Autoclave-cured woven carbon-fiber survival cell (`carbon_fibre_trim` CAD) with a front carbon aero splitter and deep rear ground-effect Venturi diffuser strakes.',
      funFact: 'Air rushing through the twin underbody Venturi tunnels sucks the Roadster down onto the asphalt at over 250 mph!',
      build(g) {
        const hasCad = addFerrariCadNodes(
          g,
          ['carbon_fibre_trim', 'carbon fibre', 'carpet', 'plastic_gray', 'metal'],
          {},
          roadsterMatrix,
        );
        if (!hasCad) {
          rbox(g, 3.72, 0.08, 1.7, 0.025, satinCarbon, [0, -0.34, 0]);
        }
        // Aggressive front carbon aero splitter + 6 rear ground-effect diffuser strake blades
        rbox(g, 0.36, 0.032, 1.76, 0.012, satinCarbon, [1.88, -0.31, 0]);
        for (let z = -0.6; z <= 0.6; z += 0.24) {
          box(g, 0.48, 0.13, 0.022, satinCarbon, [-1.76, -0.25, z], [0, 0, 0.2]);
        }
      },
    },
    {
      id: 'roadster-200kwh-battery',
      name: '200 kWh Double-Stacked Structural Battery Pack (620-Mile Range)',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.05, 0],
      desc: 'Double-layer structural 4680 lithium-silicon battery pack storing 200 kilowatt-hours—twice the energy of a standard EV—with liquid-cooled copper busbars and 800V orange looms.',
      funFact: 'With 200 kWh of energy on board, the new Roadster can drive 620 miles from Los Angeles to San Francisco and back on a single charge!',
      build(g) {
        rbox(g, 1.96, 0.16, 1.42, 0.025, darkTi, [0.05, -0.24, 0]);
        const cellMat = brushedMetal(0x0284c7, { metalness: 0.88, roughness: 0.18 });
        for (let tier = 0; tier < 2; tier++) {
          for (let m = -2; m <= 2; m++) {
            rbox(g, 0.34, 0.042, 1.3, 0.01, cellMat, [0.05 + m * 0.37, -0.21 + tier * 0.055, 0]);
          }
        }
        box(g, 1.84, 0.016, 0.08, copper, [0.05, -0.12, 0]);
        buildWiringHarness(g, [
          {
            points: [
              [1.26, -0.16, 0.36],
              [0.05, -0.14, 0.48],
              [-1.28, -0.16, 0.36],
            ],
            radius: 0.019,
            color: 0xff6600,
            companionColor: 0x38bdf8,
          },
          {
            points: [
              [1.26, -0.16, -0.36],
              [0.05, -0.14, -0.48],
              [-1.28, -0.16, -0.36],
            ],
            radius: 0.019,
            color: 0xff6600,
            companionColor: 0xe11d48,
          },
        ]);
      },
    },
    {
      id: 'roadster-plaid-tri-motors',
      name: 'Tri-Motor Plaid+ All-Wheel-Drive Units (10,000 Nm Wheel Torque)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [1.45, 0.85, 0],
      desc: 'Two high-RPM carbon-sleeved rear motors plus one front motor with exposed copper hairpin stators and silicon-carbide inverters.',
      funFact: '10,000 Newton-meters of wheel torque is enough twisting force to pull a loaded freight locomotive!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.32, -0.18, 0], twin: true, width: 0.68, radius: 0.2 });
        buildDetailedEVDriveUnit(g, { pos: [1.28, -0.18, 0], twin: false, width: 0.58, radius: 0.18 });
      },
    },
    {
      id: 'roadster-spacex-copv-thrusters',
      name: 'SpaceX Cold-Gas COPV Pressure Vessel & 10 Rocket Thruster Nozzles',
      category: 'SpaceX Rocket Package',
      isOuter: false,
      explodeOffset: [-1.65, 1.15, 0],
      desc: 'Filament-wound Falcon 9 Carbon-Overwrapped Pressure Vessel (COPV) storing 10,000 PSI compressed air behind the seats, feeding 10 supersonic cold-gas rocket nozzles hidden behind the flip-down rear license plate!',
      funFact: 'Firing the rear SpaceX cold-gas rocket thrusters blasts the Roadster from 0 to 60 mph in 1.1 seconds—pulling 2.5 Gs like a fighter jet catapult!',
      build(g) {
        // Falcon 9 carbon-overwrapped COPV high-pressure tank mounted horizontally inside the rear bay
        cyl(g, 0.15, 0.15, 0.72, 28, satinCarbon, [-0.62, -0.02, 0], [Math.PI / 2, 0, 0]);
        sphere(g, 0.15, 24, satinCarbon, [-0.62, -0.02, 0.36]);
        sphere(g, 0.15, 24, satinCarbon, [-0.62, -0.02, -0.36]);
        // Gold anodized aluminum mounting straps & 10,000 PSI pressure regulator manifold
        for (const z of [-0.2, 0, 0.2]) {
          torus(g, 0.158, 0.014, copper, [-0.62, -0.02, z], [0, 0, 0]);
        }
        rbox(g, 0.18, 0.11, 0.28, 0.02, titanium, [-0.92, 0.0, 0]);

        // High-pressure braided titanium feed tubes from COPV to rear & lateral thruster banks
        for (const side of [-1, 1]) {
          tube(
            g,
            [
              [-0.82, 0.0, side * 0.16],
              [-1.35, 0.02, side * 0.2],
              [-1.82, 0.04, side * 0.15],
            ],
            0.022,
            titanium,
          );
        }

        // Flip-down motorized rear license plate door + twin primary de Laval rocket bells + 8 lateral attitude nozzles
        rbox(g, 0.025, 0.11, 0.46, 0.01, darkTi, [-1.96, -0.04, 0], [0, 0, 0.65]);
        for (const z of [-0.14, 0.14]) {
          cone(g, 0.075, 0.22, 24, titanium, [-1.88, 0.05, z], [0, 0, -Math.PI / 2]);
          cyl(g, 0.052, 0.032, 0.08, 20, thrusterGlow, [-1.98, 0.05, z], [0, 0, Math.PI / 2]);
          // Supersonic translucent blue-white shock-diamond cold-gas plume cone
          cone(
            g,
            0.068,
            0.34,
            20,
            glassMat(0x7dd3fc, 0.55),
            [-2.14, 0.05, z],
            [0, 0, Math.PI / 2],
          );
        }
        for (const z of [-0.34, -0.26, 0.26, 0.34]) {
          cone(g, 0.036, 0.12, 16, titanium, [-1.9, 0.05, z], [0, 0, -Math.PI / 2]);
        }
      },
    },
    {
      id: 'roadster-thermal-radiators',
      name: 'Dual Tilted Nose Heat Exchangers, Electric Compressors & AN Lines',
      category: 'Thermal & Cooling',
      isOuter: false,
      explodeOffset: [1.95, 0.35, 1.25],
      desc: 'High-capacity nose and side radiators cooling the 200 kWh battery, tri-motors, AND the SpaceX high-pressure air recharge compressors.',
      funFact: 'Between rocket bursts, electric air compressors refill the carbon SpaceX tank back up to 10,000 PSI using battery power!',
      build(g) {
        for (const z of [-0.46, 0.46]) {
          rbox(g, 0.24, 0.2, 0.34, 0.02, titanium, [1.56, -0.14, z], [0, z > 0 ? -0.32 : 0.32, 0]);
          cyl(g, 0.065, 0.065, 0.24, 18, copper, [-0.28, 0.04, z * 1.1], [0, 0, Math.PI / 2]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [1.54, -0.12, 0.44],
              [0.5, -0.2, 0.52],
              [-0.62, -0.02, 0.36],
            ],
            radius: 0.015,
            color: 0x38bdf8,
            braided: true,
          },
          {
            points: [
              [1.54, -0.12, -0.44],
              [0.5, -0.2, -0.52],
              [-0.62, -0.02, -0.36],
            ],
            radius: 0.015,
            color: 0x38bdf8,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'roadster-active-pushrod-suspension',
      name: 'Active Track Pushrod Helical Coilovers & Carbon-Ceramic Brakes',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.55, 1.65],
      desc: 'Four 3D helical coilover dampers, billet double-wishbone control arms, and 420mm carbon-ceramic brake discs (`brakes` CAD).',
      funFact: 'When braking from 250 mph, upward-pointing cold-gas thrusters in the nose also push the front tires down to shorten stopping distance!',
      build(g) {
        addFerrariCadNodes(g, ['brakes'], { caliper: liquidCherry }, roadsterMatrix);
        buildCoiloverSuspension(
          g,
          [
            [1.33, -0.26, 0.68],
            [1.33, -0.26, -0.68],
            [-1.36, -0.26, 0.68],
            [-1.36, -0.26, -0.68],
          ],
          { springColor: 0x38bdf8, damperColor: 0xd8dee9, height: 0.25 },
        );
      },
    },
    {
      id: 'roadster-jet-yoke-ribbon-oled',
      name: 'Fighter-Jet Carbon Steering Yoke & Sweeping Ribbon OLED Arc',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.85, 1.3, 1.15],
      desc: 'Minimalist carbon-fiber fighter-jet yoke (`steering-wheel`) and an ultra-thin curved OLED glass ribbon spanning from the windshield down to the center tunnel.',
      funFact: 'There are zero stalks or buttons on the dashboard—everything is controlled through the sweeping curved glass ribbon and thumb scroll wheels!',
      build(g) {
        const yokeG = new THREE.Group();
        yokeG.position.set(0.38, 0.22, 0.36);
        yokeG.userData.steerRole = 'steering-wheel';
        g.add(yokeG);
        rbox(yokeG, 0.045, 0.15, 0.3, 0.018, satinCarbon, [0, 0, 0], [0, 0, -0.35]);
        for (const z of [-0.13, 0.13]) {
          rbox(yokeG, 0.05, 0.16, 0.045, 0.015, titanium, [0.01, 0.01, z], [0, 0, -0.35]);
        }
        // Sweeping curved OLED ribbon arc from cowl to center console
        rbox(g, 0.42, 0.03, 0.26, 0.012, screenMat('dashboard'), [0.44, 0.18, 0], [0, 0, -0.58]);
      },
    },
    {
      id: 'roadster-carbon-bucket-seats',
      name: 'Sculpted Carbon-Shell Bucket Seats & Alcantara Cockpit Tub',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0.25, 1.2, -1.65],
      desc: 'Deep contoured carbon-fiber racing shells (`leather`, `interior_dark` CAD) finished in lunar white & charcoal Alcantara.',
      funFact: 'In cars without the SpaceX rocket tank, two compact rear jump seats fit behind the driver; with the SpaceX package, the COPV rocket tank takes center stage!',
      build(g) {
        const lunarWhite = mat(0xf1f5f9, { roughness: 0.35, metalness: 0.06 });
        const hasCad = addFerrariCadNodes(
          g,
          ['leather', 'interior_dark', 'interior_light'],
          { leather: lunarWhite },
          roadsterMatrix,
        );
        if (!hasCad) {
          for (const z of [-0.36, 0.36]) {
            rbox(g, 0.44, 0.1, 0.42, 0.03, lunarWhite, [0.12, -0.18, z]);
            rbox(g, 0.1, 0.56, 0.4, 0.03, lunarWhite, [-0.08, 0.12, z], [0, 0, 0.25]);
          }
        }
      },
    },
    {
      id: 'roadster-liquid-red-widebody',
      name: 'Liquid Cherry Red Sculpted CAD Widebody, Aero Nose & Fender Louvers',
      category: 'Exterior & Aero',
      isOuter: true,
      explodeOffset: [-0.35, 1.85, -1.95],
      desc: '80,566-triangle wind-tunnel-sculpted Liquid Cherry Metallic bodywork (`body`, `grills`, `trim` CAD) with seamless EV nose cone, front wheel-arch pressure louvers, and carbon rocker blades.',
      funFact: 'Because an electric hypercar doesn’t need a giant front radiator grille, the Roadster’s nose slices into the wind like a supersonic bullet!',
      build(g) {
        const hasCad = addFerrariCadNodes(
          g,
          ['body', 'grills', 'trim'],
          { body: liquidCherry, trim: satinCarbon, accent: titanium },
          roadsterMatrix,
        );
        if (!hasCad) {
          buildSculptedCarBody(g, {
            profile: [
              [-2.05, -0.12],
              [-1.95, 0.24],
              [-1.05, 0.3],
              [-0.25, 0.18],
              [0.75, 0.16],
              [1.68, 0.08],
              [2.08, -0.14],
            ],
            bodyColor: liquidCherry,
            accentColor: satinCarbon,
          });
        }
        // Silver Tesla "T" nose emblem flush on hood
        box(g, 0.04, 0.008, 0.055, titanium, [1.82, -0.03, 0], [0, 0, -0.32]);
        // Carbon front fender pressure-relief louvers over front wheels
        for (const side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            box(g, 0.034, 0.02, 0.15, satinCarbon, [1.24 + i * 0.07, 0.16, side * 0.78], [0, 0, 0.22]);
          }
        }
      },
    },
    {
      id: 'roadster-targa-glass-buttresses',
      name: 'Removable Targa Glass Roof, Carbon B-Pillar Arch & Laser Headlights',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.45, 2.25, -1.15],
      desc: 'Curved CAD windshield, removable lift-out Targa glass roof panel stowing in the trunk, structural carbon B-pillar roll hoop, and triple-projector laser LED headlamps.',
      funFact: 'You can unlatch the lightweight tinted glass roof panel in 30 seconds and stow it in the trunk for open-air convertible driving!',
      build(g) {
        const glass = glassMat(0x38bdf8, 0.38);
        addFerrariCadNodes(
          g,
          ['glass', 'wipers', 'lights', 'lights_red', 'leds'],
          { glass },
          roadsterMatrix,
        );
        // Removable Targa glass roof panel + sculpted carbon B-pillar roll hoop arch & flying buttresses
        rbox(g, 0.68, 0.032, 1.14, 0.015, glass, [0.18, 0.5, 0], [0, 0, -0.06]);
        rbox(g, 0.14, 0.048, 1.22, 0.02, satinCarbon, [-0.22, 0.5, 0]);
        for (const side of [-1, 1]) {
          box(g, 0.92, 0.045, 0.08, liquidCherry, [-0.66, 0.38, side * 0.56], [0, side * -0.08, 0.24]);
        }
      },
    },
    {
      id: 'roadster-active-aero-wing',
      name: 'Deployable Active Rear Aero Wing & Full-Width LED Tail Blade',
      category: 'Active Aerodynamics',
      isOuter: true,
      explodeOffset: [-1.95, 1.45, 0],
      desc: 'Hydraulic active carbon rear wing that deploys at speed and tilts vertically as an airbrake, paired with a razor-thin full-width crimson LED light strip.',
      funFact: 'Under hard braking from 200+ mph, the active rear wing flips up to a 65-degree angle like an airliner spoiler!',
      build(g) {
        rbox(g, 0.24, 0.032, 1.56, 0.012, satinCarbon, [-1.82, 0.34, 0], [0, 0, 0.18]);
        for (const z of [-0.46, 0.46]) {
          cyl(g, 0.018, 0.018, 0.14, 12, titanium, [-1.8, 0.26, z], [0, 0, -0.15]);
        }
        // Razor-thin full-width rear LED tail blade
        box(g, 0.04, 0.028, 1.58, emissiveMat(0xff1818, 2.0), [-1.94, 0.18, 0]);
      },
    },
    {
      id: 'roadster-centerlock-aero-wheels',
      name: '21"/22" Forged Aero-Blade Center-Lock Wheels & Cup 2 R Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.35, -1.95],
      desc: 'Ultra-wide forged gunmetal aero wheels (`wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr` CAD) with anodized crimson calipers and Michelin Pilot Sport Cup 2 R track tires.',
      funFact: 'The rear tires are 325 millimeters wide with sticky semi-slick rubber compound to harness all 10,000 Nm of torque!',
      build(g) {
        const hasCad = addFerrariCadNodes(
          g,
          ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'],
          {
            rim: brushedMetal(0x1e293b, { metalness: 0.94, roughness: 0.14 }),
            caliper: liquidCherry,
            accent: liquidCherry,
          },
          roadsterMatrix,
        );
        if (!hasCad) {
          const corners = [
            [1.33, -0.2, 0.9],
            [1.33, -0.2, -0.9],
            [-1.36, -0.2, 0.92],
            [-1.36, -0.2, -0.92],
          ];
          for (const pos of corners) {
            buildDetailedWheel(g, pos, {
              tireRadius: 0.36,
              tireWidth: 0.28,
              rimColor: 0x1e293b,
              caliperColor: 0xb91c1c,
              spokes: 10,
              lugCount: 5,
              includeBrake: true,
            });
          }
        }
      },
    },
  ];

  return {
    id: 'tesla-roadster-2',
    name: 'New Tesla Roadster (SpaceX Package)',
    brand: 'Tesla',
    badge: '0–60 in 1.1s • 250+ MPH • 10 Cold-Gas Thrusters',
    desc: 'Next-generation electric hypercar equipped with the SpaceX Cold-Gas Thruster Package (10,000 PSI COPV composite air tank + 10 rear/directional rocket nozzles), a 200 kWh 620-mile battery, tri-motor Plaid+ powertrain, and removable Targa glass roof.',
    cameraPos: [4.0, 2.1, 4.2],
    parts,
    quiz: makeCarQuiz(
      parts,
      {
        q: 'What is stored inside the carbon-fiber SpaceX COPV tank behind the Roadster’s front seats to launch it from 0 to 60 mph in 1.1 seconds?',
        correctId: 'roadster-spacex-copv-thrusters',
        distractors: ['roadster-200kwh-battery', 'roadster-targa-glass-buttresses', 'roadster-jet-yoke-ribbon-oled'],
      },
      {
        q: 'How much energy does the Roadster’s double-stacked structural battery pack hold to achieve a 620-mile highway range?',
        correctId: 'roadster-200kwh-battery',
        distractors: ['roadster-thermal-radiators', 'roadster-active-aero-wing', 'roadster-carbon-bucket-seats'],
      },
    ),
  };
}

export const CAR_MODELS = [
  buildFerrariSF90(),
  buildTeslaPlaid(),
  buildTeslaModelXPlaid(),
  buildTeslaRoadster2(),
  buildCybertruck(),
  buildRivianR1T(),
  buildLamborghiniRevuelto(),
  buildFordF150Raptor(),
  buildPorsche911GT3RS(),
];
