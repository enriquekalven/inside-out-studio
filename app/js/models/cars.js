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
  const nameOf = (x) => x.name || '';
  const catOf = (x) => x.category || '';
  const isWheelsCategory = (x) => /wheels?\s*&\s*tires?|tires?\s*&\s*wheels?/i.test(catOf(x));
  // Resolve a part by walking prioritized predicate tiers (first tier with a match wins).
  const resolve = (tiers) => {
    for (const tier of tiers) {
      const found = p.find((x) => tier(x));
      if (found) return found.id;
    }
    return null;
  };
  const makeDistractors = (correctId, preferredIndices, exclude = () => false) => {
    const out = [];
    const ok = (id) => {
      const part = p.find((x) => x.id === id);
      return part && id !== correctId && !out.includes(id) && !exclude(part);
    };
    for (const idx of preferredIndices) {
      if (ids[idx] && ok(ids[idx])) out.push(ids[idx]);
    }
    for (const id of ids) {
      if (out.length >= 3) break;
      if (ok(id)) out.push(id);
    }
    for (const id of ids) {
      if (out.length >= 3) break;
      if (id !== correctId && !out.includes(id)) out.push(id);
    }
    return out.slice(0, 3);
  };

  // Brakes: dedicated brake part id > part explicitly named with brakes/calipers (not the wheel assembly).
  const brakeId = resolve([
    (x) => /brake/i.test(x.id),
    (x) => /brake|caliper|pccb|ccm/i.test(nameOf(x)) && !isWheelsCategory(x),
  ]);
  // Suspension: used for Q3 on vehicles whose brake discs live inside the wheel assembly (e.g., trucks).
  const suspensionId = resolve([
    (x) => /suspension|coilover|pushrod|shock|magneride/i.test(x.id),
    (x) => /suspension|coilover|strut|shock/i.test(nameOf(x)),
  ]);
  // Glass: match on part id first so "Steering Wheel" / "Rear-Wheel Steering" style names can never hijack it.
  const glassId =
    resolve([
      (x) => /glass|windshield|windscreen|canopy|moonroof|targa|roof/i.test(x.id),
      (x) => /glass|windshield|windscreen|canopy|moonroof|targa/i.test(nameOf(x)),
    ]) || ids[10] || ids[0];
  // Wheels: the "Wheels & Tires" category is authoritative; never match steering wheels or wheel-torque names.
  const wheelId =
    resolve([
      (x) => isWheelsCategory(x),
      (x) => /(^|-)(wheels?|tires?|tyres?|rims?)(-|$)/i.test(x.id) && !/steer/i.test(x.id),
      (x) => /\b(wheels|tires|tyres)\b/i.test(nameOf(x)) && !/steer/i.test(nameOf(x)),
    ]) || ids[11] || ids[0];

  const brakeQuestion = brakeId
    ? {
        q: `Which part squeezes spinning perforated discs to bring this high-powered vehicle to a safe stop?`,
        correctId: brakeId,
        distractors: makeDistractors(brakeId, [0, 8, 9], (x) => /brake|caliper|rotor|pccb|disc/i.test(nameOf(x))),
      }
    : {
        q: `Which part uses springs, dampers and wishbones to soak up bumps and keep all four tires planted on rough ground?`,
        correctId: suspensionId || ids[6] || ids[0],
        distractors: makeDistractors(suspensionId || ids[6] || ids[0], [0, 8, 9], (x) =>
          /suspension|coilover|strut|shock|spring/i.test(nameOf(x)),
        ),
      };

  return [
    customQ1,
    customQ2,
    brakeQuestion,
    {
      q: `Which crystal-clear aerodynamic part lets the driver see the road while blocking roaring wind?`,
      correctId: glassId,
      distractors: makeDistractors(glassId, [1, 5, 7], (x) => /glass|windshield|canopy|moonroof|targa/i.test(nameOf(x))),
    },
    {
      q: `Which four parts grip the asphalt with grooved radial rubber tread and 3D hex lug nuts?`,
      correctId: wheelId,
      distractors: makeDistractors(wheelId, [2, 6, 9], (x) => isWheelsCategory(x) || /\b(tires|tyres)\b/i.test(nameOf(x))),
    },
  ];
}

// Helper: Electric Power-Assisted Steering (EPAS) Rack, Tie-Rods, Bellows Boots & Intermediate Steering Column
function buildSteeringRackAndColumn(
  g,
  {
    rackX = 1.26,
    rackY = -0.22,
    rackWidth = 1.26,
    colStart = [0.38, 0.28, 0.36],
    epasColor = 0x2563eb,
    rearSteerX = null,
  } = {},
) {
  const alu = brushedMetal(0xcbd5e1, { metalness: 0.88, roughness: 0.2 });
  const darkBoot = mat(0x111827, { roughness: 0.72 });
  const chrome = chromeMat();
  const epasMat = brushedMetal(epasColor, { metalness: 0.85, roughness: 0.22 });

  // Cast-aluminum steering rack housing + ribbed pinion tower
  cyl(g, 0.028, 0.028, rackWidth * 0.62, 16, alu, [rackX, rackY, 0], [Math.PI / 2, 0, 0]);
  rbox(g, 0.085, 0.075, 0.18, 0.015, alu, [rackX - 0.03, rackY + 0.02, 0.22]);
  // Brushless EPAS electric assist motor + orange/blue sensor pigtail
  cyl(g, 0.038, 0.038, 0.14, 16, epasMat, [rackX - 0.05, rackY + 0.04, 0.06], [Math.PI / 2, 0, 0]);
  // Ribbed rubber inner tie-rod bellows boots + chrome outer tie-rod links + ball-joint knuckles
  for (const side of [-1, 1]) {
    cyl(g, 0.034, 0.024, 0.14, 14, darkBoot, [rackX, rackY, side * (rackWidth * 0.34)], [Math.PI / 2, 0, 0]);
    cyl(g, 0.012, 0.012, rackWidth * 0.22, 12, chrome, [rackX, rackY, side * (rackWidth * 0.48)], [Math.PI / 2, 0, 0]);
    sphere(g, 0.022, 12, 10, alu, [rackX, rackY, side * (rackWidth * 0.58)]);
  }
  // Articulated intermediate steering shaft with U-joints connecting cockpit column to rack pinion
  tube(
    g,
    [
      colStart,
      [(colStart[0] + rackX) * 0.52, (colStart[1] + rackY) * 0.45, colStart[2] * 0.78],
      [rackX - 0.03, rackY + 0.03, 0.24],
    ],
    0.013,
    chrome,
  );
  if (rearSteerX !== null) {
    // Active rear-wheel steering actuator & rear tie rods
    cyl(g, 0.024, 0.024, rackWidth * 0.56, 14, alu, [rearSteerX, rackY, 0], [Math.PI / 2, 0, 0]);
    rbox(g, 0.09, 0.07, 0.18, 0.014, epasMat, [rearSteerX, rackY + 0.02, 0]);
    for (const side of [-1, 1]) {
      cyl(g, 0.011, 0.011, rackWidth * 0.24, 10, chrome, [rearSteerX, rackY, side * (rackWidth * 0.44)], [Math.PI / 2, 0, 0]);
    }
  }
}

// Helper: Front & Rear Tubular Anti-Roll (Sway) Bars, Polyurethane Bushings & Billet Drop Links
function buildFrontRearSwayBars(g, { frontX = 1.26, rearX = -1.28, y = -0.25, span = 1.24, color = 0xe11d48 } = {}) {
  const swayMat = carPaint(color);
  const alu = brushedMetal(0xcbd5e1, { metalness: 0.88, roughness: 0.2 });
  for (const ax of [frontX, rearX]) {
    const xOff = ax > 0 ? -0.11 : 0.11;
    tube(
      g,
      [
        [ax, y, -span * 0.5],
        [ax + xOff, y - 0.02, -span * 0.38],
        [ax + xOff, y - 0.02, span * 0.38],
        [ax, y, span * 0.5],
      ],
      0.014,
      swayMat,
    );
    for (const side of [-1, 1]) {
      cyl(g, 0.009, 0.009, 0.11, 10, alu, [ax, y + 0.055, side * span * 0.5]);
    }
  }
}

// Helper: Combustion / Hybrid Fuel Tank(s), Submerged High-Pressure Fuel Pumps, Braided Lines & Filler Neck
function buildFuelSystemAndTank(
  g,
  {
    tankPos = [-0.22, -0.22, 0],
    tankSize = [0.36, 0.2, 0.34],
    enginePos = [-0.55, 0.02, 0],
    fillerPos = [-0.62, 0.24, 0.76],
    saddle = true,
    tankColor = 0xd97706,
  } = {},
) {
  const tankMat = brushedMetal(tankColor, { metalness: 0.78, roughness: 0.26 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.9, roughness: 0.18 });
  const redAnodized = carPaint(0xdc2626);
  const [tx, ty, tz] = tankPos;
  const [tw, th, td] = tankSize;

  if (saddle) {
    for (const side of [-1, 1]) {
      rbox(g, tw, th, td, 0.028, tankMat, [tx, ty, side * 0.42]);
      // Top submerged brushless fuel-pump hat + AN pressure regulator
      cyl(g, 0.048, 0.048, 0.025, 16, alu, [tx, ty + th * 0.55, side * 0.42]);
      cyl(g, 0.018, 0.018, 0.032, 12, redAnodized, [tx + 0.03, ty + th * 0.62, side * 0.42]);
    }
    // Crossover balance tube between left & right saddle tanks
    cyl(g, 0.018, 0.018, 0.84, 12, alu, [tx, ty - th * 0.3, 0], [Math.PI / 2, 0, 0]);
  } else {
    rbox(g, tw, th, td, 0.03, tankMat, [tx, ty, tz]);
    cyl(g, 0.055, 0.055, 0.028, 16, alu, [tx, ty + th * 0.55, tz]);
    cyl(g, 0.02, 0.02, 0.035, 12, redAnodized, [tx + 0.04, ty + th * 0.62, tz]);
  }
  // Braided stainless AN-8 fuel supply & return lines to engine fuel rails + filler neck
  tube(
    g,
    [
      [tx, ty + th * 0.5, saddle ? 0.42 : tz],
      [(tx + enginePos[0]) * 0.5, Math.max(ty, enginePos[1]) + 0.04, 0.22],
      [enginePos[0], enginePos[1] + 0.08, 0.14],
    ],
    0.011,
    alu,
  );
  tube(
    g,
    [
      [tx, ty + th * 0.4, saddle ? 0.42 : tz],
      [fillerPos[0], fillerPos[1], fillerPos[2]],
    ],
    0.016,
    alu,
  );
  cyl(g, 0.032, 0.032, 0.018, 16, redAnodized, fillerPos, [Math.PI / 2, 0, 0]);
}

// Helper: EV NACS/CCS Fast-Charge Port Inlet, 11.5 kW On-Board Charger (PCS) & Pyrotechnic HV Disconnect
function buildEVChargePortAndOBC(g, { portPos = [-1.62, 0.12, 0.74], obcPos = [-0.88, -0.14, 0] } = {}) {
  const alu = brushedMetal(0xcbd5e1, { metalness: 0.88, roughness: 0.2 });
  const darkCase = brushedMetal(0x1e293b, { metalness: 0.82, roughness: 0.28 });
  const statusGlow = emissiveMat(0x22c55e, 1.8);
  const [px, py, pz] = portPos;
  const [ox, oy, oz] = obcPos;

  // Finned aluminum On-Board Charger / Power Conversion System (PCS) + Pyrotechnic HV safety disconnect fuse
  rbox(g, 0.32, 0.085, 0.44, 0.018, alu, [ox, oy, oz]);
  rbox(g, 0.11, 0.055, 0.09, 0.01, carPaint(0xdc2626), [ox + 0.14, oy + 0.05, oz + 0.12]);
  // NACS / CCS charge port housing + glowing green charge-status LED ring + motorized charge flap
  rbox(g, 0.11, 0.09, 0.06, 0.014, darkCase, [px, py, pz]);
  torus(g, 0.028, 0.006, statusGlow, [px, py, pz + Math.sign(pz) * 0.032]);
  rbox(g, 0.12, 0.08, 0.012, 0.004, darkCase, [px + 0.05, py + 0.06, pz + Math.sign(pz) * 0.04], [0.45 * Math.sign(pz), 0, 0]);
  // Heavy orange DC fast-charge HV cables linking charge port -> OBC -> battery pack
  buildWiringHarness(g, [
    {
      points: [
        [px, py - 0.02, pz * 0.92],
        [ox + 0.08, oy + 0.02, pz * 0.55],
        [ox, oy, oz],
      ],
      radius: 0.015,
      color: 0xff6600,
      companionColor: 0x22c55e,
    },
  ]);
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
      name: '800V Structural Battery Pack, NACS Charge Port & HV Busbars',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.05, 0],
      desc: 'Thousands of lithium-ion battery cells sealed inside an armored aluminum enclosure with copper busbars, an 11.5 kW On-Board Charger (PCS), NACS 250 kW Supercharger port, and liquid cooling ribbons.',
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
        // NACS Supercharger port + 11.5 kW On-Board Charger (PCS) + HV junction
        buildEVChargePortAndOBC(g, { portPos: [-1.68, 0.14, 0.76], obcPos: [-0.92, -0.14, 0] });

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
      name: 'Adaptive Air Struts, EPAS Steering Rack, Sway Bars & CAD Brakes',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.65],
      desc: 'Four 3D helical spring struts, EPAS rack-and-pinion steering with tie rods, front/rear anti-roll sway bars, tubular wishbones, and CAD brake discs & calipers.',
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
        buildSteeringRackAndColumn(g, { rackX: 1.25, rackY: -0.22, colStart: [0.38, 0.3, 0.38] });
        buildFrontRearSwayBars(g, { frontX: 1.25, rearX: -1.28, y: -0.25, color: 0xc8102e });
      },
    },
    {
      id: 'yoke-touchscreen',
      name: 'CAD Cockpit Dash, Yoke Steering, Pedals & 17" FSD Display',
      category: 'Cockpit & FSD Computer',
      isOuter: false,
      explodeOffset: [0.55, 1.35, 1.2],
      desc: 'Sculpted CAD dashboard, billet accelerator/brake pedal assemblies, steering yoke, and 17-inch theater screen.',
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
      desc: 'Authentic CAD contoured bucket seats, seat frames, floor mats, and safety cage.',
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
      desc: '97-mesh CAD sculpted fastback body with inner flange hex bolts.',
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
      desc: 'Continuous CAD UV-tinted windshield, roof panel, side windows, gasket seals, and articulated windshield wipers.',
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
      name: '9,000-Ton Gigacast Chassis, Octovalve Thermal Stack & Class IV Hitch',
      category: 'Structure & Thermal',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Massive die-cast aluminum front and rear subframes, front Octovalve heat-pump radiator stack, and a Class IV 11,000-lb rear tow hitch receiver.',
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
        // Front Octovalve heat-pump radiator core & dual cooling fans
        rbox(g, 0.14, 0.32, 0.96, 0.02, castAlu, [1.84, -0.06, 0], [0, 0, 0.22]);
        for (const z of [-0.26, 0.26]) {
          torus(g, 0.13, 0.016, darkFrame, [1.78, -0.06, z], [0, Math.PI / 2, 0]);
        }
        sphere(g, 0.095, 16, darkFrame, [1.68, 0.0, 0.26]);
        // Class IV 11,000-lb rear tow hitch receiver & trailer 7-pin connector
        rbox(g, 0.24, 0.1, 0.12, 0.015, darkFrame, [-2.06, -0.2, 0]);
      },
    },
    {
      id: 'cybercell-battery',
      name: '800V 4680 Cybercell Battery, Powershare Bi-Directional OBC & NACS Port',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: '800-volt structural battery enclosure housing four 4680 Cybercell arrays, 11.5 kW Powershare bi-directional On-Board Charger, NACS Supercharger port, and HV cables.',
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
        buildEVChargePortAndOBC(g, { portPos: [-1.52, 0.18, 0.84], obcPos: [-0.78, -0.05, 0] });
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
      name: '12" Travel Air-Coil Struts, Billet Wishbones & Anti-Roll Sway Bars',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Tall billet-aluminum upper and lower wishbones, 3D helical spring struts, front/rear anti-roll sway bars, and braided brake hoses raise clearance to 16 inches.',
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
        buildFrontRearSwayBars(g, { frontX: 1.35, rearX: -1.35, y: -0.2, color: 0xf59e0b });
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
// Multi-Station 3D Lofting, Off-Road Beadlock Wheels & CAD Material Sanitizers
// ============================================================================

function sanitizeCadMaterials(group, { clearMapsOnPaint = true } = {}) {
  group.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      m.vertexColors = false;
      if (clearMapsOnPaint && m.clearcoat && m.clearcoat > 0.5 && !m.transparent) {
        // Ensure carPaint body panels never inherit broken UV textures or blotchy maps
        if (m.map && m.color && m.color.r + m.color.g + m.color.b < 2.9) {
          m.map = null;
        }
      }
      m.needsUpdate = true;
    }
  });
}

/**
 * Builds a smooth multi-station lofted BufferGeometry from an array of 3D cross-section stations.
 * Each station is an array of M points `[x, y, z]`.
 */
function buildMultiSectionLoft(
  group,
  stations,
  material,
  { closedRing = false, capEnds = false, reverseWinding = false } = {},
) {
  if (!stations || stations.length < 2) return null;
  const numStations = stations.length;
  const ringLen = stations[0].length;
  if (ringLen < 2) return null;

  const positions = [];
  const uvs = [];
  const indices = [];
  const ringCentroids = [];

  for (let i = 0; i < numStations; i++) {
    const u = i / (numStations - 1);
    const ring = stations[i];
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let j = 0; j < ringLen; j++) {
      const v = j / (closedRing ? ringLen : Math.max(1, ringLen - 1));
      const pt = ring[j];
      positions.push(pt[0], pt[1], pt[2]);
      uvs.push(u, v);
      cx += pt[0];
      cy += pt[1];
      cz += pt[2];
    }
    ringCentroids.push([cx / ringLen, cy / ringLen, cz / ringLen]);
  }

  const segCount = closedRing ? ringLen : ringLen - 1;
  let orient = 0;
  for (let i = 0; i < numStations - 1; i++) {
    const row0 = i * ringLen;
    const row1 = (i + 1) * ringLen;
    const cent = ringCentroids[i];
    for (let j = 0; j < segCount; j++) {
      const j1 = (j + 1) % ringLen;
      const a = row0 + j;
      const b = row1 + j;
      const c = row1 + j1;
      const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
      const bx = positions[b * 3] - ax, by = positions[b * 3 + 1] - ay, bz = positions[b * 3 + 2] - az;
      const cx = positions[c * 3] - ax, cy = positions[c * 3 + 1] - ay, cz = positions[c * 3 + 2] - az;
      // Normal of triangle (a, b, c) is (b - a) x (c - a)
      const fnx = by * cz - bz * cy;
      const fny = bz * cx - bx * cz;
      const fnz = bx * cy - by * cx;
      const ox = closedRing ? ax - cent[0] : 0;
      const oy = closedRing ? ay - cent[1] : ay - -0.15;
      const oz = closedRing ? az - cent[2] : az;
      orient += fnx * ox + fny * oy + fnz * oz;
    }
  }
  const effectiveReverse = Math.abs(orient) > 1e-9 ? orient < 0 : reverseWinding;

  for (let i = 0; i < numStations - 1; i++) {
    const row0 = i * ringLen;
    const row1 = (i + 1) * ringLen;
    for (let j = 0; j < segCount; j++) {
      const j1 = (j + 1) % ringLen;
      const a = row0 + j;
      const b = row1 + j;
      const c = row1 + j1;
      const d = row0 + j1;
      if (effectiveReverse) {
        indices.push(a, c, b, a, d, c);
      } else {
        indices.push(a, b, c, a, c, d);
      }
    }
  }

  if (closedRing && capEnds) {
    for (const [stationIdx, flip] of [
      [0, !effectiveReverse],
      [numStations - 1, effectiveReverse],
    ]) {
      const [cx, cy, cz] = ringCentroids[stationIdx];
      const centerIdx = positions.length / 3;
      positions.push(cx, cy, cz);
      uvs.push(0.5, 0.5);
      const base = stationIdx * ringLen;
      for (let j = 0; j < ringLen; j++) {
        const j1 = (j + 1) % ringLen;
        if (flip) {
          indices.push(centerIdx, base + j1, base + j);
        } else {
          indices.push(centerIdx, base + j, base + j1);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

/**
 * Helper: Builds a sculpted tumblehome truck cab & front fender side skin with wheel-well arch cutout,
 * flared off-road wheel arch molding, inner wheelhouse liner, rocker cladding, and door shutlines.
 */
function buildSculptedTruckCabAndFenders(
  g,
  {
    cabRearX = -0.56,
    cowlX = 0.88,
    noseX = 2.0,
    wheelX = 1.32,
    wheelY = -0.22,
    archRadius = 0.45,
    halfWidth = 0.86,
    beltlineY = 0.45,
    noseTopY = 0.35,
    rockerY = -0.18,
    bodyMat,
    flareMat,
    darkMat,
    hoodHeight = 0.08,
    hoodDomeWidth = 0.44,
    steppedWindowNotch = false,
  } = {},
) {
  const numX = 30;
  const numY = 9;
  for (const side of [-1, 1]) {
    const stations = [];
    for (let ix = 0; ix < numX; ix++) {
      const u = ix / (numX - 1);
      const x = cabRearX + u * (noseX - cabRearX);

      // Compute lower boundary yBot(x): arches smoothly over the front wheel opening
      let yBot = rockerY;
      const dxWheel = x - wheelX;
      if (Math.abs(dxWheel) < archRadius) {
        const archLift = Math.sqrt(Math.max(0, archRadius * archRadius - dxWheel * dxWheel));
        yBot = Math.max(rockerY, wheelY + archLift * 0.96);
      } else if (x > wheelX + archRadius) {
        yBot = rockerY + 0.05;
      }

      // Compute upper boundary yTop(x): flat along cab beltline, sloping smoothly down the front fender to the nose
      let yTop = beltlineY;
      if (x > cowlX) {
        const tFront = (x - cowlX) / (noseX - cowlX);
        yTop = beltlineY - Math.pow(tFront, 1.35) * (beltlineY - noseTopY);
      } else if (steppedWindowNotch && x > 0.48 && x <= cowlX) {
        // Ford F-150 signature front-door beltline drop notch
        const tNotch = (x - 0.48) / (cowlX - 0.48);
        yTop = beltlineY - Math.sin(tNotch * Math.PI) * 0.045;
      }

      // Compute widebody fender flare lateral bulge near the front wheel
      const flareEnv = Math.exp(-Math.pow(dxWheel / (archRadius * 0.92), 2)) * 0.055;
      const noseTaper = x > noseX - 0.22 ? Math.pow((x - (noseX - 0.22)) / 0.22, 1.6) * 0.055 : 0;

      const col = [];
      for (let iy = 0; iy < numY; iy++) {
        const v = iy / (numY - 1);
        const y = yBot + v * (yTop - yBot);
        // Tumblehome & mid-body shoulder contour: tucked at rocker (v=0), widest at mid-flank (v=0.45), slight inward tuck at beltline (v=1)
        const bodyCurve = Math.sin(v * Math.PI * 0.82) * 0.052 - (1 - v) * 0.028;
        const archLipOut = Math.abs(dxWheel) < archRadius && v < 0.35 ? (1 - v / 0.35) * 0.032 : 0;
        const z = side * (halfWidth + bodyCurve + flareEnv + archLipOut - noseTaper);
        col.push([x, y, z]);
      }
      stations.push(col);
    }
    buildMultiSectionLoft(g, stations, bodyMat, { closedRing: false, reverseWinding: side < 0 });

    // Top fender shoulder return flange connecting outer fender skin seamlessly inward to hood & cabin sill
    const shoulderStations = stations.map((col) => {
      const topPt = col[col.length - 1];
      const uFront = topPt[0] > cowlX ? (topPt[0] - cowlX) / Math.max(1e-5, noseX - cowlX) : 0;
      const zInner = side * halfWidth * (0.91 - uFront * 0.06);
      return [topPt, [topPt[0], topPt[1] + 0.008, zInner]];
    });
    buildMultiSectionLoft(g, shoulderStations, bodyMat, { closedRing: false, reverseWinding: side < 0 });

    // Contoured 3D Off-Road Fender Flare Arch over front wheel + dark inner wheelhouse tub
    const flarePts = [];
    const flareSteps = 22;
    for (let s = 0; s <= flareSteps; s++) {
      const ang = -0.12 + (s / flareSteps) * (Math.PI + 0.24);
      const ax = wheelX - Math.cos(ang) * archRadius;
      const ay = wheelY + Math.sin(ang) * archRadius * 0.96;
      const azOuter = side * (halfWidth + 0.095);
      const azInner = side * (halfWidth - 0.02);
      flarePts.push([
        [ax, ay - 0.015, azInner],
        [ax, ay - 0.01, azOuter],
        [ax - Math.cos(ang) * 0.055, ay + Math.sin(ang) * 0.055, azOuter],
        [ax - Math.cos(ang) * 0.06, ay + Math.sin(ang) * 0.058, azInner],
      ]);
    }
    buildMultiSectionLoft(g, flarePts, flareMat, { closedRing: true, capEnds: true, reverseWinding: side < 0 });

    // Dark concave wheelwell splash liner inside front fender
    const linerStations = [];
    for (let s = 0; s <= 16; s++) {
      const ang = (s / 16) * Math.PI;
      const ax = wheelX - Math.cos(ang) * (archRadius * 0.94);
      const ay = wheelY + Math.sin(ang) * (archRadius * 0.92);
      linerStations.push([
        [ax, ay, side * (halfWidth + 0.01)],
        [ax, ay, side * (halfWidth - 0.32)],
      ]);
    }
    buildMultiSectionLoft(g, linerStations, darkMat, { closedRing: false, reverseWinding: side > 0 });

    // Lower matte-black rocker cladding panel along cab bottom + recessed front/rear crew door shutlines
    rbox(g, cowlX - cabRearX - 0.04, 0.075, 0.06, 0.015, flareMat, [(cowlX + cabRearX) * 0.5, rockerY + 0.03, side * (halfWidth + 0.015)]);
    for (const doorSeamX of [cowlX - 0.06, 0.14, cabRearX + 0.05]) {
      box(g, 0.012, beltlineY - rockerY - 0.06, 0.018, darkMat, [doorSeamX, (beltlineY + rockerY) * 0.5, side * (halfWidth + 0.052)]);
    }
  }

  // Solid cab floor pan, front firewall bulkhead & rear cab panel
  box(g, cowlX - cabRearX, 0.05, halfWidth * 1.92, darkMat, [(cowlX + cabRearX) * 0.5, rockerY + 0.02, 0]);
  box(g, 0.05, beltlineY - rockerY, halfWidth * 1.88, bodyMat, [cabRearX + 0.02, (beltlineY + rockerY) * 0.5, 0]);
  box(g, 0.05, beltlineY - rockerY, halfWidth * 1.86, darkMat, [cowlX - 0.02, (beltlineY + rockerY) * 0.5, 0]);

  // Multi-station lofted compound-curved Power-Dome Hood from cowlX to noseX
  const hoodStations = [];
  const hoodXSteps = 14;
  const hoodZSteps = 17;
  for (let ix = 0; ix < hoodXSteps; ix++) {
    const u = ix / (hoodXSteps - 1);
    const x = cowlX + u * (noseX - 0.02 - cowlX);
    const baseY = beltlineY - Math.pow(u, 1.35) * (beltlineY - noseTopY);
    const domeEnv = Math.sin(u * Math.PI * 0.92);
    const zMax = halfWidth * (0.95 - u * 0.06);
    const row = [];
    for (let iz = 0; iz < hoodZSteps; iz++) {
      const v = (iz / (hoodZSteps - 1)) * 2 - 1; // -1 .. +1
      const z = v * zMax;
      const absV = Math.abs(v);
      // Outer fender crown + raised central power-dome plateau
      const crown = 0.008 + (1 - v * v) * 0.028;
      const dome = absV < hoodDomeWidth ? Math.cos((absV / hoodDomeWidth) * Math.PI * 0.5) * hoodHeight * domeEnv : 0;
      row.push([x, baseY + crown + dome, z]);
    }
    hoodStations.push(row);
  }
  buildMultiSectionLoft(g, hoodStations, bodyMat, { closedRing: false, reverseWinding: true });
}

/**
 * Helper: Builds a sculpted tumblehome truck cabin greenhouse (sloped A-pillars, raked windshield with black frit,
 * crowned roof with panoramic glass, B-pillars, C-pillar sail panels, and angled tumblehome side windows).
 */
function buildSculptedTruckGreenhouse(
  g,
  {
    cabRearX = -0.56,
    cowlX = 0.86,
    roofFrontX = 0.32,
    beltlineY = 0.45,
    roofY = 0.88,
    beltHalfW = 0.84,
    roofHalfW = 0.71,
    bodyMat,
    pillarBlackMat,
    windshieldGlassMat,
    roofGlassMat,
    sideGlassMat,
    steppedFrontWindow = false,
  } = {},
) {
  const fritMat = mat(0x0b0f17, { roughness: 0.28, metalness: 0.2, doubleSide: true });
  const tumbleAngle = Math.atan2(beltHalfW - roofHalfW, roofY - beltlineY);
  const midZ = (beltHalfW + roofHalfW) * 0.5;
  const ghHeight = (roofY - beltlineY) / Math.cos(tumbleAngle);

  // 1. Compound-curved raked windshield with black ceramic frit border & ADAS mirror camera pod
  const wsStations = [];
  const wsFritTop = [];
  const wsFritBot = [];
  const wsSteps = 15;
  for (let iz = 0; iz < wsSteps; iz++) {
    const v = (iz / (wsSteps - 1)) * 2 - 1; // -1 .. +1
    const bowX = (1 - v * v) * 0.055;
    const bowY = (1 - v * v) * 0.018;
    const zBot = v * (beltHalfW - 0.04);
    const zTop = v * (roofHalfW - 0.04);
    wsStations.push([
      [cowlX + bowX, beltlineY + 0.01, zBot],
      [(cowlX + roofFrontX) * 0.5 + bowX * 0.85, (beltlineY + roofY) * 0.5 + bowY, (zBot + zTop) * 0.5],
      [roofFrontX + bowX * 0.65, roofY - 0.01, zTop],
    ]);
    wsFritBot.push([
      [cowlX + bowX + 0.004, beltlineY + 0.005, zBot],
      [cowlX + bowX - 0.05, beltlineY + 0.05, zBot * 0.98],
    ]);
    wsFritTop.push([
      [roofFrontX + bowX * 0.65 + 0.05, roofY - 0.045, zTop * 0.98],
      [roofFrontX + bowX * 0.65, roofY - 0.005, zTop],
    ]);
  }
  buildMultiSectionLoft(g, wsStations, windshieldGlassMat, { closedRing: false, reverseWinding: true });
  buildMultiSectionLoft(g, wsFritBot, fritMat, { closedRing: false, reverseWinding: true });
  buildMultiSectionLoft(g, wsFritTop, fritMat, { closedRing: false, reverseWinding: true });
  // Interior rearview mirror & ADAS camera housing behind upper windshield
  rbox(g, 0.12, 0.055, 0.18, 0.012, fritMat, [roofFrontX + 0.06, roofY - 0.06, 0]);

  // 2. Crowned Roof Header, Panoramic Glass Roof Canopy, Rear Roof Spoiler & Third Brake Light
  const roofStations = [];
  for (let ix = 0; ix <= 10; ix++) {
    const u = ix / 10;
    const x = cabRearX + 0.04 + u * (roofFrontX - cabRearX - 0.06);
    const row = [];
    for (let iz = 0; iz <= 12; iz++) {
      const v = (iz / 12) * 2 - 1;
      const z = v * (roofHalfW - 0.05);
      const crownY = roofY + (1 - v * v) * 0.025;
      row.push([x, crownY, z]);
    }
    roofStations.push(row);
  }
  buildMultiSectionLoft(g, roofStations, roofGlassMat, { closedRing: false, reverseWinding: false });
  // Front & rear painted roof headers + rooftop shark-fin antenna + high-mount third brake light
  rbox(g, 0.09, 0.042, roofHalfW * 1.98, 0.016, bodyMat, [roofFrontX + 0.01, roofY + 0.005, 0]);
  rbox(g, 0.11, 0.045, roofHalfW * 1.98, 0.016, bodyMat, [cabRearX + 0.04, roofY + 0.005, 0]);
  box(g, 0.025, 0.022, 0.42, emissiveMat(0xff1e27, 1.5), [cabRearX - 0.01, roofY + 0.008, 0]);
  cone(g, 0.028, 0.085, 4, fritMat, [cabRearX + 0.18, roofY + 0.045, 0], [0, 0, 0.35]);

  // 3. Left & Right Tumblehome A-Pillars, Roof Cantrails, B-Pillars, C-Pillar Sail Panels & Side Door Windows
  for (const side of [-1, 1]) {
    // Lofted A-Pillar + Roof Cantrail + C-Pillar continuous frame with inward tumblehome
    const cantrailPts = [
      [cowlX, beltlineY, side * beltHalfW],
      [(cowlX + roofFrontX) * 0.5 + 0.02, (beltlineY + roofY) * 0.52, side * ((beltHalfW + roofHalfW) * 0.5)],
      [roofFrontX, roofY, side * roofHalfW],
      [(roofFrontX + cabRearX) * 0.5, roofY + 0.008, side * roofHalfW],
      [cabRearX + 0.03, roofY, side * roofHalfW],
    ];
    tube(g, cantrailPts, 0.038, bodyMat, false, 24);

    // Sculpted C-pillar sail panel tapering from beltline (beltHalfW) up to roof (roofHalfW)
    const cPillarStations = [
      [
        [cabRearX, beltlineY, side * (beltHalfW + 0.01)],
        [cabRearX + 0.17, beltlineY, side * (beltHalfW + 0.01)],
        [cabRearX + 0.17, beltlineY, side * (beltHalfW - 0.05)],
        [cabRearX, beltlineY, side * (beltHalfW - 0.05)],
      ],
      [
        [cabRearX, roofY, side * (roofHalfW + 0.01)],
        [cabRearX + 0.13, roofY, side * (roofHalfW + 0.01)],
        [cabRearX + 0.13, roofY, side * (roofHalfW - 0.05)],
        [cabRearX, roofY, side * (roofHalfW - 0.05)],
      ],
    ];
    buildMultiSectionLoft(g, cPillarStations, bodyMat, { closedRing: true, capEnds: true });

    // Angled tumblehome B-pillar (gloss black) + window sill weatherstrip
    rbox(
      g,
      0.085,
      ghHeight * 0.96,
      0.032,
      0.008,
      pillarBlackMat,
      [0.12, (beltlineY + roofY) * 0.5, side * midZ],
      [side * tumbleAngle, 0, 0],
    );
    box(g, cowlX - cabRearX - 0.06, 0.022, 0.036, pillarBlackMat, [(cowlX + cabRearX) * 0.5, beltlineY + 0.005, side * beltHalfW]);

    // Tumblehome crew-cab side window glass (polygonal loft matching A-pillar slope & tumblehome angle)
    const winFrontBotX = cowlX - 0.06;
    const winFrontTopX = roofFrontX - 0.02;
    const winRearX = cabRearX + 0.14;
    const winBotY = steppedFrontWindow ? beltlineY - 0.02 : beltlineY + 0.01;
    const sideWinStations = [
      [
        [winRearX, beltlineY + 0.01, side * (beltHalfW - 0.01)],
        [winRearX, roofY - 0.02, side * (roofHalfW - 0.01)],
      ],
      [
        [0.12, beltlineY + 0.01, side * (beltHalfW - 0.01)],
        [0.12, roofY - 0.015, side * (roofHalfW - 0.01)],
      ],
      [
        [winFrontTopX, winBotY, side * (beltHalfW - 0.01)],
        [winFrontTopX, roofY - 0.02, side * (roofHalfW - 0.01)],
      ],
      [
        [winFrontBotX, winBotY, side * (beltHalfW - 0.01)],
        [winFrontBotX - 0.08, winBotY + 0.08, side * (beltHalfW - 0.025)],
      ],
    ];
    buildMultiSectionLoft(g, sideWinStations, sideGlassMat, { closedRing: false, reverseWinding: side < 0 });
  }

  // 4. Vertical Rear Cab Window with Ceramic Frit Surround & Power-Sliding Center Pane
  rbox(g, 0.028, roofY - beltlineY - 0.05, roofHalfW * 1.88, 0.012, sideGlassMat, [cabRearX + 0.02, (beltlineY + roofY) * 0.5, 0]);
  for (const zBar of [-0.22, 0.22]) {
    box(g, 0.036, roofY - beltlineY - 0.04, 0.028, fritMat, [cabRearX + 0.015, (beltlineY + roofY) * 0.5, zBar]);
  }
}

/**
 * Helper: Builds a sculpted pickup truck cargo box with lofted tumblehome outer bedsides,
 * rear wheel-arch cutouts, widebody fender flares, ribbed spray-in bedliner floor, and inner wheel tubs.
 */
function buildSculptedTruckBed(
  g,
  {
    bedFrontX = -0.6,
    bedRearX = -2.04,
    wheelX = -1.32,
    wheelY = -0.22,
    archRadius = 0.45,
    halfWidth = 0.86,
    beltlineY = 0.45,
    rockerY = -0.16,
    floorY = 0.02,
    bodyMat,
    flareMat,
    bedlinerMat,
  } = {},
) {
  const bedLen = bedFrontX - bedRearX;
  const bedMidX = (bedFrontX + bedRearX) * 0.5;

  // Bed floor pan + 11 longitudinal stamped bedliner ribs + front bed bulkhead
  box(g, bedLen, 0.055, halfWidth * 1.86, bedlinerMat, [bedMidX, floorY, 0]);
  for (let z = -halfWidth * 0.76; z <= halfWidth * 0.76; z += (halfWidth * 1.52) / 10) {
    box(g, bedLen - 0.08, 0.018, 0.036, flareMat, [bedMidX, floorY + 0.032, z]);
  }
  box(g, 0.045, beltlineY - floorY, halfWidth * 1.86, bedlinerMat, [bedFrontX - 0.02, (beltlineY + floorY) * 0.5, 0]);

  // Left & Right Lofted Outer Bedsides with Rear Wheel-Arch Cutout + Wide Fender Flare + Inner Bed Wall & Wheel Tub
  const numX = 24;
  const numY = 8;
  for (const side of [-1, 1]) {
    const stations = [];
    for (let ix = 0; ix < numX; ix++) {
      const u = ix / (numX - 1);
      const x = bedRearX + u * (bedFrontX - bedRearX);
      const dxWheel = x - wheelX;

      let yBot = rockerY;
      if (Math.abs(dxWheel) < archRadius) {
        const archLift = Math.sqrt(Math.max(0, archRadius * archRadius - dxWheel * dxWheel));
        yBot = Math.max(rockerY, wheelY + archLift * 0.96);
      } else if (x < wheelX - archRadius) {
        yBot = rockerY + 0.04;
      }

      const flareEnv = Math.exp(-Math.pow(dxWheel / (archRadius * 0.92), 2)) * 0.055;
      const col = [];
      for (let iy = 0; iy < numY; iy++) {
        const v = iy / (numY - 1);
        const y = yBot + v * (beltlineY - yBot);
        const bodyCurve = Math.sin(v * Math.PI * 0.82) * 0.05 - (1 - v) * 0.025;
        const archLipOut = Math.abs(dxWheel) < archRadius && v < 0.35 ? (1 - v / 0.35) * 0.032 : 0;
        const z = side * (halfWidth + bodyCurve + flareEnv + archLipOut);
        col.push([x, y, z]);
      }
      stations.push(col);
    }
    buildMultiSectionLoft(g, stations, bodyMat, { closedRing: false, reverseWinding: side < 0 });

    // Molded protective bed-rail cap along top of bedside + inner vertical bed wall + inner wheelhouse tub
    rbox(g, bedLen, 0.038, 0.13, 0.012, flareMat, [bedMidX, beltlineY + 0.01, side * (halfWidth - 0.03)]);
    box(g, bedLen - 0.04, beltlineY - floorY, 0.035, bedlinerMat, [bedMidX, (beltlineY + floorY) * 0.5, side * (halfWidth - 0.09)]);
    cyl(g, archRadius * 0.72, archRadius * 0.72, 0.22, 20, bedlinerMat, [wheelX, floorY + 0.04, side * (halfWidth - 0.2)], [Math.PI / 2, 0, 0]);

    // Contoured 3D Off-Road Fender Flare Arch over rear wheel
    const flarePts = [];
    const flareSteps = 22;
    for (let s = 0; s <= flareSteps; s++) {
      const ang = -0.12 + (s / flareSteps) * (Math.PI + 0.24);
      const ax = wheelX - Math.cos(ang) * archRadius;
      const ay = wheelY + Math.sin(ang) * archRadius * 0.96;
      const azOuter = side * (halfWidth + 0.095);
      const azInner = side * (halfWidth - 0.02);
      flarePts.push([
        [ax, ay - 0.015, azInner],
        [ax, ay - 0.01, azOuter],
        [ax - Math.cos(ang) * 0.055, ay + Math.sin(ang) * 0.055, azOuter],
        [ax - Math.cos(ang) * 0.06, ay + Math.sin(ang) * 0.058, azInner],
      ]);
    }
    buildMultiSectionLoft(g, flarePts, flareMat, { closedRing: true, capEnds: true, reverseWinding: side < 0 });
  }
}

/**
 * Helper: Builds a beefy Off-Road All-Terrain Tire with 3D Shoulder Tread Lugs & Forged Beadlock Ring
 * attached directly onto the rotating wheel `spinGroup`.
 */
function buildOffRoadWheel(
  g,
  pos,
  {
    tireRadius = 0.42,
    tireWidth = 0.28,
    rimColor = 0x334155,
    beadlockColor = 0x94a3b8,
    caliperColor = 0xf59e0b,
    spokes = 8,
    lugCount = 6,
  } = {},
) {
  const beforeLen = g.children.length;
  buildDetailedWheel(g, pos, {
    tireRadius,
    tireWidth,
    rimColor,
    caliperColor,
    spokes,
    lugCount,
    includeBrake: true,
  });
  const steerGroup = g.children[beforeLen];
  if (!steerGroup) return;
  const spinGroup = steerGroup.children.find((ch) => ch.userData?.driveRole === 'wheel');
  if (!spinGroup) return;

  const sideSign = pos[2] >= 0 ? 1 : -1;
  const lugMat = mat(0x12151b, { roughness: 0.78, metalness: 0.06 });
  const beadMat = brushedMetal(beadlockColor, { metalness: 0.88, roughness: 0.22 });
  const rimR = tireRadius * 0.65;

  // 22 aggressive 3D off-road mud/all-terrain shoulder tread lugs around both outer and inner tire shoulders
  const numLugs = 22;
  for (let i = 0; i < numLugs; i++) {
    const a = (i / numLugs) * Math.PI * 2;
    const lx = Math.cos(a) * (tireRadius * 0.975);
    const ly = Math.sin(a) * (tireRadius * 0.975);
    for (const sSide of [-1, 1]) {
      box(
        spinGroup,
        tireRadius * 0.11,
        0.042,
        tireWidth * 0.26,
        lugMat,
        [lx, ly, sSide * (tireWidth * 0.36)],
        [0, 0, a],
      );
    }
    // Alternating center-tread chevron block
    box(
      spinGroup,
      tireRadius * 0.075,
      0.046,
      tireWidth * 0.36,
      lugMat,
      [Math.cos(a + 0.07) * (tireRadius * 0.99), Math.sin(a + 0.07) * (tireRadius * 0.99), 0],
      [0, (i % 2 ? 1 : -1) * 0.25, a + 0.07],
    );
  }

  // Forged Beadlock Ring + 16 Perimeter Beadlock Hex Bolts on outer wheel face
  const beadZ = sideSign * (tireWidth * 0.45);
  torus(spinGroup, rimR * 0.96, 0.022, beadMat, [0, 0, beadZ], [0, 0, 0]);
  const beadBolts = [];
  for (let b = 0; b < 16; b++) {
    const a = (b / 16) * Math.PI * 2;
    beadBolts.push([Math.cos(a) * (rimR * 0.96), Math.sin(a) * (rimR * 0.96), beadZ + sideSign * 0.018]);
  }
  buildHexBoltArray(spinGroup, beadBolts, {
    radius: 0.0085,
    height: 0.012,
    finish: 'titanium',
    rot: [Math.PI / 2, 0, 0],
    includeWasher: false,
    includeStud: false,
  });
}

// ============================================================================
// 3. RIVIAN R1T QUAD-MOTOR ADVENTURE TRUCK
// ============================================================================
function buildRivianR1T() {
  const launchGreen = carPaint(0x4b6043, { metalness: 0.58, roughness: 0.15, clearcoat: 1.0, doubleSide: true });
  const yellowAccent = carPaint(0xf59e0b);
  const bashPlate = brushedMetal(0x94a3b8);
  const darkTrim = mat(0x1f2937, { roughness: 0.5, doubleSide: true });
  const flareCladding = mat(0x141921, { roughness: 0.58, metalness: 0.16, doubleSide: true });

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
        for (let x = -1.5; x <= 1.5; x += 0.5) {
          box(g, 0.07, 0.09, 1.52, darkTrim, [x, -0.24, 0]);
        }
        // Angled front aluminum approach bash plate with stamped cooling slots + rear departure plate
        rbox(g, 0.34, 0.045, 1.44, 0.015, bashPlate, [1.94, -0.19, 0], [0, 0, 0.36]);
        rbox(g, 0.28, 0.04, 1.44, 0.015, bashPlate, [-1.96, -0.2, 0], [0, 0, -0.28]);
        // Heavy-duty off-road rock sliders along both cab/bed sills
        for (const side of [-1, 1]) {
          cyl(g, 0.026, 0.026, 1.62, 14, darkTrim, [0.15, -0.21, side * 0.88], [0, 0, Math.PI / 2]);
        }
        // Signature Compass Yellow forged front recovery tow hooks
        torus(g, 0.058, 0.018, yellowAccent, [2.08, -0.15, 0.44], [0, Math.PI / 2, 0]);
        torus(g, 0.058, 0.018, yellowAccent, [2.08, -0.15, -0.44], [0, Math.PI / 2, 0]);
      },
    },
    {
      id: 'max-pack-battery',
      name: '149 kWh Waterproof Max Battery Pack, Adventure Charge Port & HV Busbars',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: 'Double-stacked module battery sealed with 24 perimeter bolts, front-left motorized CCS/NACS charge port, 11.5 kW On-Board Charger, and high-voltage orange harnesses inside a waterproof enclosure.',
      funFact: 'Because an electric truck doesn’t need an air intake snorkel or exhaust pipe, R1T can ford deep rivers up to 43 inches!',
      build(g) {
        rbox(g, 2.35, 0.16, 1.48, 0.025, darkTrim, [0, -0.14, 0]);
        for (let i = -4; i <= 4; i++) {
          rbox(g, 0.22, 0.07, 1.38, 0.015, brushedMetal(0x38bdf8), [i * 0.25, -0.05, 0]);
        }
        buildEVChargePortAndOBC(g, { portPos: [1.62, 0.16, 0.82], obcPos: [-0.85, -0.04, 0] });
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
      name: 'Independent Quad-Motor Drive Units, Inverters & Thermal Cooling Stack',
      category: 'Powertrain & Thermal',
      isOuter: false,
      explodeOffset: [-1.6, 0.95, 0],
      desc: 'Four separate electric motors—one for every single wheel—with copper hairpin windings, torque-vectoring gearboxes, and a front high-capacity radiator & battery chiller stack.',
      funFact: 'Because each wheel has its own motor, a Quad-Motor truck can spin the left wheels forward and right wheels backward to pivot like a tank!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [-1.32, -0.14, 0], twin: true, width: 0.62, radius: 0.15 });
        buildDetailedEVDriveUnit(g, { pos: [1.32, -0.14, 0], twin: true, width: 0.62, radius: 0.15 });
        // Front Quad-Motor Cooling Radiator, Battery Chiller & Heat Pump Stack
        rbox(g, 0.14, 0.32, 0.96, 0.02, bashPlate, [1.68, -0.04, 0], [0, 0, 0.18]);
        for (const z of [-0.26, 0.26]) {
          torus(g, 0.13, 0.016, darkTrim, [1.62, -0.04, z], [0, Math.PI / 2, 0]);
        }
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
        rbox(g, 0.36, 0.38, 1.72, 0.04, bashPlate, [-0.58, 0.06, 0]);
        for (const side of [-1, 1]) {
          rbox(g, 0.3, 0.32, 0.06, 0.02, launchGreen, [-0.58, 0.06, side * 0.88]);
          rbox(g, 0.24, 0.04, 0.065, 0.01, yellowAccent, [-0.58, 0.18, side * 0.885]);
        }
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
        const ledWhite = emissiveMat(0xf8fafc, 1.85);
        const ledGreen = emissiveMat(0x22c55e, 1.6);
        const smokedLens = glassMat(0x1e293b, 0.62);

        // Contoured wrap-around Launch Green upper & lower front fascia + satin-black lower off-road valence
        rbox(g, 0.18, 0.34, 1.68, 0.055, launchGreen, [1.96, 0.15, 0]);
        rbox(g, 0.22, 0.14, 1.72, 0.035, flareCladding, [1.98, -0.09, 0]);

        // Smoked full-width stadium lightbar housing + glowing horizontal LED bar + emerald green charge-pulse center strip
        rbox(g, 0.08, 0.11, 1.64, 0.03, smokedLens, [2.03, 0.16, 0]);
        rbox(g, 0.05, 0.048, 1.62, 0.018, ledWhite, [2.055, 0.16, 0]);
        box(g, 0.055, 0.02, 0.88, ledGreen, [2.062, 0.16, 0]);

        // Iconic Rivian vertical Stadium-Oval Headlight Capsules with internal stacked projector lenses
        for (const z of [-0.54, 0.54]) {
          rbox(g, 0.085, 0.28, 0.16, 0.068, flareCladding, [2.035, 0.16, z]);
          rbox(g, 0.075, 0.25, 0.135, 0.058, ledWhite, [2.05, 0.16, z]);
          rbox(g, 0.08, 0.19, 0.082, 0.035, flareCladding, [2.056, 0.16, z]);
          // Upper & lower optical projector lenses inside each stadium oval
          sphere(g, 0.03, 14, ledWhite, [2.068, 0.205, z]);
          sphere(g, 0.03, 14, ledWhite, [2.068, 0.115, z]);
        }

        // Lower bumper LED fog lights & radar sensor module
        for (const z of [-0.62, 0.62]) {
          rbox(g, 0.05, 0.042, 0.14, 0.012, ledWhite, [2.08, -0.08, z]);
        }
        rbox(g, 0.04, 0.07, 0.28, 0.01, darkTrim, [2.085, -0.09, 0]);
      },
    },
    {
      id: 'hydraulic-suspension',
      name: 'Kinetic Roll-Control Hydraulic Suspension & EPAS Steering Rack',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Four 3D helical spring struts, tubular wishbones, heavy-duty off-road EPAS rack-and-pinion steering with tie rods, and cross-linked hydraulic roll-control lines.',
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
        buildSteeringRackAndColumn(g, { rackX: 1.32, rackY: -0.18, colStart: [0.42, 0.36, 0.38], epasColor: 0xf59e0b });
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
        buildSculptedTruckBed(g, {
          bedFrontX: -0.62,
          bedRearX: -2.02,
          wheelX: -1.32,
          wheelY: -0.22,
          archRadius: 0.45,
          halfWidth: 0.85,
          beltlineY: 0.44,
          rockerY: -0.16,
          floorY: 0.02,
          bodyMat: launchGreen,
          flareMat: flareCladding,
          bedlinerMat: darkTrim,
        });

        // Telescoping aluminum Adventure Cargo Crossbars & Compass Yellow tie-down latches
        for (const x of [-0.98, -1.68]) {
          rbox(g, 0.085, 0.042, 1.66, 0.015, bashPlate, [x, 0.49, 0]);
          for (const side of [-1, 1]) {
            rbox(g, 0.12, 0.055, 0.06, 0.012, flareCladding, [x, 0.47, side * 0.82]);
            box(g, 0.04, 0.02, 0.02, yellowAccent, [x, 0.48, side * 0.852]);
          }
        }

        // Sculpted Tailgate + Full-Width Crimson LED Stadium Taillight Bar + Rear Off-Road Step Bumper
        rbox(g, 0.09, 0.42, 1.68, 0.028, launchGreen, [-2.02, 0.22, 0]);
        rbox(g, 0.05, 0.058, 1.68, 0.018, emissiveMat(0xff1e27, 1.75), [-2.06, 0.34, 0]);
        rbox(g, 0.16, 0.13, 1.74, 0.03, flareCladding, [-2.06, -0.1, 0]);
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
        buildSculptedTruckCabAndFenders(g, {
          cabRearX: -0.56,
          cowlX: 0.88,
          noseX: 1.98,
          wheelX: 1.32,
          wheelY: -0.22,
          archRadius: 0.45,
          halfWidth: 0.85,
          beltlineY: 0.44,
          noseTopY: 0.34,
          rockerY: -0.18,
          bodyMat: launchGreen,
          flareMat: flareCladding,
          darkMat: darkTrim,
          hoodHeight: 0.068,
          hoodDomeWidth: 0.46,
          steppedWindowNotch: false,
        });

        // Flush pop-out Launch Green door handles, Compass Yellow door badging & sculpted aero mirrors
        for (const side of [-1, 1]) {
          for (const hx of [0.28, -0.34]) {
            rbox(g, 0.16, 0.028, 0.024, 0.008, launchGreen, [hx, 0.31, side * 0.905]);
          }
          box(g, 0.14, 0.022, 0.015, yellowAccent, [0.58, 0.18, side * 0.905]);
          // Sculpted side mirror on angled stalk
          rbox(g, 0.08, 0.035, 0.11, 0.01, flareCladding, [0.68, 0.45, side * 0.89], [side * 0.25, 0, 0]);
          rbox(g, 0.14, 0.1, 0.14, 0.028, launchGreen, [0.66, 0.49, side * 0.96], [0, side * -0.15, 0]);
        }
        // Dual articulated windshield wipers at hood cowl
        for (const zw of [-0.32, 0.24]) {
          box(g, 0.035, 0.022, 0.52, flareCladding, [0.85, 0.46, zw], [0, 0.1, 0]);
        }
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
        buildSculptedTruckGreenhouse(g, {
          cabRearX: -0.56,
          cowlX: 0.86,
          roofFrontX: 0.3,
          beltlineY: 0.44,
          roofY: 0.88,
          beltHalfW: 0.84,
          roofHalfW: 0.7,
          bodyMat: launchGreen,
          pillarBlackMat: flareCladding,
          windshieldGlassMat: glassMat(0x7dd3fc, 0.42),
          roofGlassMat: glassMat(0x0f172a, 0.72),
          sideGlassMat: glassMat(0x38bdf8, 0.44),
          steppedFrontWindow: false,
        });
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
          buildOffRoadWheel(g, pos, {
            tireRadius: 0.4,
            tireWidth: 0.26,
            rimColor: 0x334155,
            beadlockColor: 0x94a3b8,
            caliperColor: 0xf59e0b,
            spokes: 8,
            lugCount: 5,
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
      desc: 'Woven carbon-fiber survival cell with sculpted ground-effect venturi floor and rear diffuser strakes.',
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
      name: 'Mid-Mounted 4.0L Twin-Turbo V8, Saddle Fuel Tanks & 350-Bar Direct Injection',
      category: 'Powertrain & Fuel',
      isOuter: false,
      explodeOffset: [0.15, 0.68, 0.55],
      desc: 'Full mechanical F154 V8 behind the cockpit with 8 reciprocating aluminum pistons, forged con-rods, dual 68L saddle fuel tanks, 350-bar high-pressure fuel rails, and crinkle-red DOHC valve covers!',
      funFact: 'Putting the heavy V8 engine and dual saddle fuel tanks right behind the seats—like a Formula 1 race car—helps it pivot around corners lightning fast!',
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
        buildFuelSystemAndTank(g, {
          tankPos: [-0.22, -0.18, 0],
          tankSize: [0.34, 0.22, 0.32],
          enginePos: [-0.55, 0.02, 0],
          fillerPos: [-0.72, 0.28, 0.78],
          saddle: true,
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
      name: '3 Axial-Flux Motors (RAC-e), 7.9 kWh PHEV Battery Pack & 800V Loom',
      category: 'Hybrid Electrification',
      isOuter: false,
      explodeOffset: [1.05, 0.38, 0.52],
      desc: 'Two front torque-vectoring electric motors, rear F1 MGU-K motor, and a vertical behind-seat 7.9 kWh high-voltage lithium-ion PHEV battery pack with plug-in charge port and 800V orange looms.',
      funFact: 'When leaving home early in the morning, the 7.9 kWh battery lets the Ferrari drive 15 miles in 100% silent electric "eDrive" mode without waking the neighbors!',
      build(g) {
        buildDetailedEVDriveUnit(g, { pos: [1.26, -0.18, 0], twin: true, width: 0.56, radius: 0.17 });
        cyl(g, 0.19, 0.19, 0.14, 24, mat(0xff6600, { roughness: 0.25 }), [-1.08, -0.12, 0], [0, 0, Math.PI / 2]);
        // Behind-seat 7.9 kWh High-Voltage Li-Ion PHEV Battery Pack with 12 laser-welded cell modules & copper busbars
        rbox(g, 0.24, 0.3, 1.06, 0.03, carbon, [-0.18, -0.08, 0]);
        const cellMod = brushedMetal(0x38bdf8, { metalness: 0.86, roughness: 0.18 });
        const busCopper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.15 });
        for (let m = -2; m <= 2; m++) {
          rbox(g, 0.18, 0.24, 0.16, 0.012, cellMod, [-0.18, -0.08, m * 0.19]);
        }
        box(g, 0.12, 0.02, 0.96, busCopper, [-0.18, 0.06, 0]);
        buildEVChargePortAndOBC(g, { portPos: [-0.82, 0.26, -0.78], obcPos: [-0.18, -0.22, 0] });
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
      name: 'Brembo Carbon-Ceramic Brakes, Multimatic Shocks, EPAS Rack & Sway Bars',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.48, 1.48],
      desc: 'Real 3D yellow helical coilover springs around Multimatic dampers, EPAS steering rack with tie rods, front/rear anti-roll sway bars, and carbon-ceramic brakes.',
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
        buildSteeringRackAndColumn(g, { rackX: 1.31, rackY: -0.24, colStart: [0.36, 0.22, 0.36], epasColor: 0xd40000 });
        buildFrontRearSwayBars(g, { frontX: 1.31, rearX: -1.34, y: -0.26, color: 0xffd100 });
      },
    },
    {
      id: 'manettino-cockpit',
      name: 'CAD F1 Steering Wheel with LED Shift Lights & eManettino',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.85, 1.25, 1.15],
      desc: 'Multi-part carbon-fiber F1 steering wheel with RPM shift LEDs, perforated leather grips, eManettino hybrid mode switch, column-mounted paddle shifters, and curved 16-inch digital instrument cluster.',
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
      desc: 'Authentic sculpted Italian Cuoio saddle-leather Daytona racing bucket seats, carbon-fiber side bolsters, and Alcantara cockpit tub.',
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
      desc: '80,566-triangle wind-tunnel-sculpted Ferrari Rosso Corsa bodywork with front S-Duct nose channel, side intercooler intakes, Scuderia shields, and active shut-off Gurney flap.',
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
      name: 'Berlinetta Coupe Roof, Flying Buttresses, Windshield & Louvered V8 Showcase',
      category: 'Glass & Lighting',
      isOuter: true,
      explodeOffset: [0.45, 2.25, -1.15],
      desc: 'Sculpted Rosso Corsa Berlinetta coupe roof canopy with flying buttresses, wraparound windshield, side coupe glazing, articulated wipers, LED headlamps, and louvered transparent V8 engine bay showcase window.',
      funFact: 'Ferrari puts a clear louvered showcase window over the rear deck so everyone can admire the twin-turbo V8 from outside!',
      build(g) {
        const windshieldGlass = glassMat(0x1e293b, 0.58);
        windshieldGlass.side = THREE.DoubleSide;
        const hasCad = addFerrariCadNodes(g, ['glass', 'wipers', 'lights', 'lights_red', 'leds'], {
          glass: windshieldGlass,
        });
        const darkCoupeGlass = glassMat(0x0f172a, 0.78);
        darkCoupeGlass.side = THREE.DoubleSide;
        const darkRoofLiner = mat(0x111827, { roughness: 0.22, metalness: 0.45, clearcoat: 0.9 });
        darkRoofLiner.side = THREE.DoubleSide;
        const rossoCorsaRoof = rossoCorsa.clone();
        rossoCorsaRoof.side = THREE.DoubleSide;
        if (!hasCad) {
          const glass = glassMat(0x64b5f6, 0.4);
          rbox(g, 0.92, 0.05, 1.42, 0.02, glass, [0.68, 0.38, 0], [0, 0, -0.46]);
          rbox(g, 0.95, 0.05, 1.12, 0.02, glass, [-0.88, 0.42, 0], [0, 0, 0.32]);
        }
        // Sculpted SF90 Stradale Berlinetta closed coupe roof arch from upper windshield header (x=0.52) over (x=0.34) to B-pillar hoops (x=-0.54)
        const coupeRoofStations = [
          [
            [0.52, 0.552, -0.610],
            [0.52, 0.618, -0.34],
            [0.52, 0.638, 0],
            [0.52, 0.618, 0.34],
            [0.52, 0.552, 0.610],
          ],
          [
            [0.34, 0.625, -0.560],
            [0.34, 0.675, -0.32],
            [0.34, 0.692, 0],
            [0.34, 0.675, 0.32],
            [0.34, 0.625, 0.560],
          ],
          [
            [-0.08, 0.630, -0.555],
            [-0.08, 0.680, -0.32],
            [-0.08, 0.696, 0],
            [-0.08, 0.680, 0.32],
            [-0.08, 0.630, 0.555],
          ],
          [
            [-0.54, 0.610, -0.520],
            [-0.54, 0.650, -0.30],
            [-0.54, 0.665, 0],
            [-0.54, 0.650, 0.30],
            [-0.54, 0.610, 0.520],
          ],
        ];
        buildMultiSectionLoft(g, coupeRoofStations, rossoCorsaRoof, { closedRing: false });
        const coupeLinerStations = coupeRoofStations.map((ring) =>
          ring.map(([x, y, z]) => [x, y - 0.014, z * 0.97]),
        );
        buildMultiSectionLoft(g, coupeLinerStations, darkRoofLiner, { closedRing: false });
        // Rear B-pillar cockpit bulkhead & continuous sculpted A-pillar + roof cantrail arches
        rbox(g, 0.08, 0.16, 0.96, 0.02, darkRoofLiner, [-0.50, 0.53, 0]);
        for (const side of [-1, 1]) {
          const s = side;
          tube(
            g,
            [
              [0.90, 0.308, s * 0.768],
              [0.70, 0.445, s * 0.686],
              [0.50, 0.552, s * 0.614],
              [0.34, 0.625, s * 0.560],
              [0.00, 0.630, s * 0.555],
              [-0.25, 0.625, s * 0.545],
              [-0.52, 0.610, s * 0.520],
            ],
            0.022,
            rossoCorsaRoof,
          );
          // Contoured 7-station side coupe windows hugging the exact ferrari.glb door sill (y=0.29, z=0.80) and A-pillar (x=0.90..0.34)
          const sideWinStations = [
            [
              [0.90, 0.295, s * 0.775],
              [0.90, 0.310, s * 0.768],
            ],
            [
              [0.70, 0.290, s * 0.795],
              [0.70, 0.445, s * 0.686],
            ],
            [
              [0.50, 0.290, s * 0.800],
              [0.50, 0.552, s * 0.614],
            ],
            [
              [0.34, 0.295, s * 0.800],
              [0.34, 0.625, s * 0.560],
            ],
            [
              [0.00, 0.310, s * 0.795],
              [0.00, 0.630, s * 0.555],
            ],
            [
              [-0.25, 0.355, s * 0.775],
              [-0.25, 0.625, s * 0.545],
            ],
            [
              [-0.50, 0.485, s * 0.665],
              [-0.50, 0.610, s * 0.520],
            ],
          ];
          buildMultiSectionLoft(g, sideWinStations, darkCoupeGlass, {
            closedRing: false,
            reverseWinding: s < 0,
          });
          // Sculpted Rosso Corsa flying buttresses sweeping from the B-pillar roof arch (x=-0.48) into the rear engine haunches (x=-1.52)
          const buttressStations = [
            [
              [-0.48, 0.58, s * 0.38],
              [-0.48, 0.625, s * 0.48],
              [-0.48, 0.585, s * 0.56],
              [-0.48, 0.49, s * 0.60],
            ],
            [
              [-1.00, 0.48, s * 0.35],
              [-1.00, 0.52, s * 0.46],
              [-1.00, 0.485, s * 0.54],
              [-1.00, 0.41, s * 0.58],
            ],
            [
              [-1.52, 0.39, s * 0.32],
              [-1.52, 0.42, s * 0.43],
              [-1.52, 0.39, s * 0.51],
              [-1.52, 0.33, s * 0.55],
            ],
          ];
          buildMultiSectionLoft(g, buttressStations, rossoCorsa, {
            closedRing: true,
            capEnds: true,
            reverseWinding: s < 0,
          });
        }
        // Louvered polycarbonate V8 engine bay showcase window nestled between the flying buttresses
        rbox(g, 0.98, 0.022, 0.68, 0.008, darkCoupeGlass, [-1.00, 0.49, 0], [0, 0, 0.17]);
        for (let i = 0; i < 5; i++) {
          const lx = -0.60 - i * 0.19;
          const ly = 0.565 - i * 0.033;
          box(g, 0.045, 0.014, 0.64, carbon, [lx, ly, 0], [0, 0, 0.22]);
        }
      },
    },
    {
      id: 'forged-star-wheels',
      name: 'CAD 5-Spoke Forged Wheels, 3D Hex Lug Nuts & Pirelli Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.35, -1.85],
      desc: 'Authentic 5-spoke star forged alloy wheels with radial Pirelli P Zero tires, Giallo Modena Brembo calipers, Scuderia center caps, and 5 titanium hex lug nuts per wheel.',
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
  const verdeMantis = carPaint(0x65d610, { metalness: 0.58, roughness: 0.12, clearcoat: 1.0, doubleSide: true });
  const arancio = carPaint(0xff5500);
  const carbon = carbonFiberMat([6, 6]);
  const satinBlack = mat(0x11161f, { roughness: 0.32, metalness: 0.28, doubleSide: true });
  const alu = brushedMetal(0xd1d5db);

  // Aggressive wide, low-slung Sant'Agata wedge proportion transform for CAD base
  const lamboMatrix = new THREE.Matrix4();
  {
    const o = new THREE.Object3D();
    o.scale.set(1.03, 0.94, 1.06);
    o.position.set(0, -0.02, 0);
    o.updateMatrix();
    lamboMatrix.copy(o.matrix);
  }

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
        const hasCad = addFerrariCadNodes(g, ['carbon_fibre_trim', 'carbon fibre', 'plastic_gray', 'metal'], {}, lamboMatrix);
        if (!hasCad) {
          rbox(g, 3.65, 0.1, 1.66, 0.02, carbon, [0, -0.34, 0]);
        }
        // Aggressive front carbon shark-nose splitter & rear ground-effect Venturi diffuser strakes
        rbox(g, 0.38, 0.032, 1.78, 0.012, carbon, [1.9, -0.31, 0]);
        for (let z = -0.6; z <= 0.6; z += 0.24) {
          box(g, 0.48, 0.14, 0.024, carbon, [-1.76, -0.24, z], [0, 0, 0.22]);
        }
      },
    },
    {
      id: 'v12-engine',
      name: '6.5L V12 (12 Pistons & Con-Rods), Side-Pod Radiators & Saddle Fuel Tanks',
      category: 'Powertrain, Fuel & Cooling',
      isOuter: false,
      explodeOffset: [-0.85, 1.5, 0],
      desc: 'Twelve cylinders with reciprocating aluminum pistons, forged connecting rods, dual side-pod aluminum V12 water/oil radiators with puller fans, and saddle fuel tanks with 350-bar rails!',
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
        // Gold X-brace strut bar bolted across the open-air V12 engine bay
        box(g, 0.84, 0.028, 0.045, brushedMetal(0xd4af37), [-0.65, 0.22, 0], [0, 0.55, 0]);
        box(g, 0.84, 0.028, 0.045, brushedMetal(0xd4af37), [-0.65, 0.22, 0], [0, -0.55, 0]);
        // Dual side-pod aluminum V12 water/oil radiators & puller fans fed by the Y-intake ducts
        for (const side of [-1, 1]) {
          rbox(g, 0.28, 0.24, 0.14, 0.02, alu, [-0.42, 0.02, side * 0.64], [0, side * 0.25, 0]);
          torus(g, 0.085, 0.014, carbon, [-0.42, 0.02, side * 0.56], [0, Math.PI / 2, 0]);
        }
        buildFuelSystemAndTank(g, {
          tankPos: [-0.24, -0.18, 0],
          tankSize: [0.34, 0.22, 0.34],
          enginePos: [-0.65, 0.02, 0],
          fillerPos: [-0.78, 0.26, 0.8],
          saddle: true,
        });
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
        const innerGlow = emissiveMat(0xff5500, 1.4);
        // High-mounted twin hexagonal titanium exhaust outlets between the rear wing profiles
        for (const side of [-1, 1]) {
          const ez = side * 0.19;
          cyl(g, 0.105, 0.105, 0.18, 6, carbon, [-1.9, 0.22, ez], [0, 0, Math.PI / 2]);
          cyl(g, 0.092, 0.092, 0.32, 6, tiMat, [-1.88, 0.22, ez], [0, 0, Math.PI / 2]);
          cyl(g, 0.068, 0.068, 0.34, 6, innerGlow, [-1.89, 0.22, ez], [0, 0, Math.PI / 2]);
          tube(
            g,
            [
              [-1.15, 0.04, side * 0.22],
              [-1.48, 0.14, side * 0.21],
              [-1.82, 0.22, ez],
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
      name: 'Pushrod Coilovers, Rear-Wheel Steering, EPAS Rack & Ceramic Brakes',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.85],
      desc: 'Four 3D helical orange coilover springs, front EPAS steering rack, rear-axle steering actuator, anti-roll sway bars, and carbon-ceramic brakes.',
      funFact: '10-piston front brake calipers—more pistons than most car engines!—bite onto 410mm carbon-ceramic discs.',
      build(g) {
        addFerrariCadNodes(g, ['brakes'], { caliper: verdeMantis }, lamboMatrix);
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
        buildSteeringRackAndColumn(g, {
          rackX: 1.26,
          rackY: -0.24,
          colStart: [0.36, 0.22, 0.36],
          epasColor: 0xff5500,
          rearSteerX: -1.3,
        });
        buildFrontRearSwayBars(g, { frontX: 1.26, rearX: -1.3, y: -0.26, color: 0x65d610 });
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
          // Sculpted Verde Mantis door crease & deep carbon flying-buttress side air intake scoop behind door
          rbox(g, 0.92, 0.22, 0.045, 0.015, verdeMantis, [0.16, 0.05, side * 0.88], [0, 0, 0.1]);
          rbox(g, 0.56, 0.3, 0.11, 0.02, carbon, [-0.46, 0.1, side * 0.89], [0, side * 0.12, -0.18]);
          // Signature Lamborghini Y-shaped side intake splitter blade in Verde Mantis
          box(g, 0.38, 0.032, 0.04, verdeMantis, [-0.42, 0.12, side * 0.93], [0, 0, -0.12]);
          box(g, 0.22, 0.028, 0.04, verdeMantis, [-0.26, 0.2, side * 0.93], [0, 0, 0.42]);
          box(g, 0.22, 0.028, 0.04, verdeMantis, [-0.26, 0.04, side * 0.93], [0, 0, -0.58]);
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
        const hasCad = addFerrariCadNodes(g, ['steering_wheel'], {}, lamboMatrix);
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
        const darkSuede = mat(0x181e26, { roughness: 0.55 });
        const hasCad = addFerrariCadNodes(g, ['leather', 'interior_dark', 'interior_light'], { leather: darkSuede }, lamboMatrix);
        if (!hasCad) {
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
        const hasCad = addFerrariCadNodes(
          g,
          ['body', 'grills', 'trim'],
          { body: verdeMantis, trim: carbon, accent: arancio },
          lamboMatrix,
        );
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

        // Sculpted Gandini Wedge Front Hood Power-Creases + Twin NACA Hood Nostrils + Gold Bull Nose Shield
        for (const side of [-1, 1]) {
          rbox(g, 0.78, 0.026, 0.08, 0.01, verdeMantis, [1.35, 0.09, side * 0.34], [0, side * -0.12, -0.26]);
          rbox(g, 0.22, 0.032, 0.18, 0.008, carbon, [1.68, -0.02, side * 0.32], [0, 0, -0.28]);
        }
        cyl(g, 0.028, 0.028, 0.01, 5, brushedMetal(0xfacc15), [1.94, -0.06, 0], [0, 0, -1.1]);

        // Sculpted Flying Buttress Rear Arches framing the open-air V12 engine bay + Hexagonal Carbon Bay Framing
        for (const side of [-1, 1]) {
          const buttressPts = [
            [-0.28, 0.53, side * 0.54],
            [-0.78, 0.44, side * 0.58],
            [-1.32, 0.35, side * 0.61],
            [-1.78, 0.27, side * 0.58],
          ];
          tube(g, buttressPts, 0.048, verdeMantis, false, 20);
          // Flying buttress air-channel under-vane in exposed carbon fiber
          rbox(g, 1.38, 0.042, 0.11, 0.014, carbon, [-1.02, 0.36, side * 0.57], [0, side * -0.04, 0.19]);
          // Open-air V12 engine deck stepped carbon louver slats flanking the exposed V12
          for (let i = 0; i < 4; i++) {
            box(g, 0.09, 0.018, 0.22, carbon, [-0.52 - i * 0.22, 0.28 - i * 0.01, side * 0.34], [0, side * 0.22, 0.12]);
          }
        }

        // Active Verde Mantis & Carbon Rear Aero Wing bridging the high-mount hexagonal exhausts
        rbox(g, 0.22, 0.034, 1.66, 0.012, carbon, [-1.88, 0.34, 0], [0, 0, 0.18]);
        rbox(g, 0.16, 0.028, 1.62, 0.01, verdeMantis, [-1.92, 0.36, 0], [0, 0, 0.22]);
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
        addFerrariCadNodes(g, ['glass', 'wipers', 'lights', 'lights_red', 'leds'], {}, lamboMatrix);

        // 1. Sculpted Carbon-Fiber Double-Bubble Coupe Roof with Central Valley & Hexagonal Roof Scoop
        const roofStations = [];
        for (let ix = 0; ix <= 12; ix++) {
          const u = ix / 12;
          const x = -0.32 + u * 0.72; // -0.32 (rear bulkhead) to +0.40 (windshield header)
          const archEnv = Math.sin(u * Math.PI);
          const row = [];
          for (let iz = 0; iz <= 16; iz++) {
            const v = (iz / 16) * 2 - 1; // -1 .. +1
            const z = v * (0.54 - u * 0.02);
            // Twin raised helmet domes at v = ±0.48 with a recessed central channel at v = 0
            const doubleBubble = Math.sin(Math.abs(v) * Math.PI) * 0.052 * (0.65 + 0.35 * archEnv);
            const edgeDrop = Math.pow(Math.abs(v), 3) * 0.035;
            const y = 0.51 + archEnv * 0.025 + doubleBubble - edgeDrop;
            row.push([x, y, z]);
          }
          roofStations.push(row);
        }
        buildMultiSectionLoft(g, roofStations, carbon, { closedRing: false, reverseWinding: false });

        // Verde Mantis roof cantrail accent strips + sculpted Hexagonal Roof Air Scoop at rear center of roof
        for (const side of [-1, 1]) {
          rbox(g, 0.7, 0.028, 0.045, 0.01, verdeMantis, [0.04, 0.52, side * 0.52], [0, 0, -0.03]);
        }
        cyl(g, 0.068, 0.082, 0.24, 6, carbon, [-0.14, 0.565, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.052, 0.052, 0.25, 6, satinBlack, [-0.13, 0.565, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.04, 0.022, 0.14, 0.006, verdeMantis, [-0.02, 0.59, 0]);

        // 2. Signature Lamborghini Y-Shaped LED Daytime Running Light Blades at Front Nose & Rear Tail
        const ledWhite = emissiveMat(0xf8fafc, 2.2);
        const ledRed = emissiveMat(0xff1e00, 2.0);
        for (const side of [-1, 1]) {
          // Front shark-nose carbon intake pod + 3-branch Y-shaped white LED DRL blades
          rbox(g, 0.26, 0.11, 0.24, 0.02, satinBlack, [1.88, -0.05, side * 0.66], [0, side * -0.22, -0.2]);
          // Stem of front Y-LED
          box(g, 0.22, 0.024, 0.028, ledWhite, [1.96, -0.06, side * 0.62], [0, side * -0.18, -0.22]);
          // Upper inner branch of front Y-LED
          box(g, 0.2, 0.022, 0.026, ledWhite, [1.82, 0.0, side * 0.56], [0.22 * side, side * 0.25, -0.35]);
          // Lower outer branch of front Y-LED
          box(g, 0.2, 0.022, 0.026, ledWhite, [1.82, -0.07, side * 0.72], [-0.18 * side, side * -0.35, -0.1]);

          // Rear high-mounted Y-shaped crimson LED taillight blades flanking the hex exhausts
          box(g, 0.045, 0.024, 0.26, ledRed, [-1.96, 0.22, side * 0.52]);
          box(g, 0.045, 0.022, 0.18, ledRed, [-1.94, 0.25, side * 0.68], [side * 0.38, 0, 0]);
          box(g, 0.045, 0.022, 0.18, ledRed, [-1.94, 0.19, side * 0.68], [side * -0.38, 0, 0]);
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
        const hasCad = addFerrariCadNodes(
          g,
          ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'],
          {
            rim: brushedMetal(0x1e293b, { metalness: 0.9, roughness: 0.18 }),
            caliper: verdeMantis,
            accent: verdeMantis,
          },
          lamboMatrix,
        );
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
  const fordBlue = carPaint(0x0046ad, { metalness: 0.62, roughness: 0.14, clearcoat: 1.0, doubleSide: true });
  const foxOrange = carPaint(0xff5a00);
  const frameSteel = brushedMetal(0x262d36, { metalness: 0.78, roughness: 0.32, doubleSide: true });
  const flareCharcoal = mat(0x181d26, { roughness: 0.52, metalness: 0.22, doubleSide: true });
  const skidAlu = brushedMetal(0xcbd5e1);

  const parts = [
    {
      id: 'boxed-ladder-frame',
      name: 'Boxed High-Strength Steel Ladder Frame, 36-Gal Fuel Tank & Skid Plate',
      category: 'Structure & Fuel',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Two massive rectangular steel rails connected by welded crossmembers, a thick silver front bash plate, and a frame-mounted 36-gallon extended-range fuel tank with braided fuel lines.',
      funFact: 'Pickup trucks use a "ladder frame" shaped like a giant steel ladder so they can tow heavy boats and trailers without bending!',
      build(g) {
        box(g, 3.96, 0.11, 0.12, frameSteel, [0, -0.25, 0.48]);
        box(g, 3.96, 0.11, 0.12, frameSteel, [0, -0.25, -0.48]);
        for (let x = -1.75; x <= 1.75; x += 0.58) {
          box(g, 0.1, 0.1, 1.08, frameSteel, [x, -0.25, 0]);
        }
        // Angled heavy-gauge silver aluminum FORD Performance front bash skid plate + Code Orange tow hooks
        rbox(g, 0.44, 0.18, 1.32, 0.03, skidAlu, [1.92, -0.19, 0], [0, 0, 0.42]);
        for (const z of [-0.46, 0.46]) {
          torus(g, 0.062, 0.02, foxOrange, [2.12, -0.14, z], [0, Math.PI / 2, 0]);
        }
        buildFuelSystemAndTank(g, {
          tankPos: [-0.48, -0.2, -0.26],
          tankSize: [0.88, 0.18, 0.34],
          enginePos: [1.32, 0.06, 0],
          fillerPos: [-1.15, 0.32, -0.86],
          saddle: false,
          tankColor: 0x334155,
        });
      },
    },
    {
      id: 'ecoboost-v6-v8',
      name: '5.2L Supercharged Predator V8, Desert Radiator & Intercooler Stack',
      category: 'Powertrain & Cooling',
      isOuter: false,
      explodeOffset: [1.55, 1.35, 0],
      desc: 'Front-mounted 720-HP V8 with 2.65L Roots supercharger, air-to-water intercooler, heavy-duty desert radiator stack with dual cooling fans, reciprocating pistons, and dual Baja exhaust!',
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
        // Finned 2.65L Roots Supercharger housing + Front Heavy-Duty Desert Radiator & Intercooler Stack
        rbox(g, 0.42, 0.1, 0.3, 0.02, frameSteel, [1.32, 0.24, 0]);
        rbox(g, 0.14, 0.38, 1.12, 0.02, skidAlu, [1.76, 0.08, 0]);
        for (const fz of [-0.3, 0.3]) {
          cyl(g, 0.15, 0.15, 0.03, 18, frameSteel, [1.68, 0.08, fz], [0, 0, Math.PI / 2]);
        }
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
        const amber = emissiveMat(0xff9900, 1.85);
        const ledWhite = emissiveMat(0xf8fafc, 1.75);
        const letterMat = brushedMetal(0x475569, { metalness: 0.75, roughness: 0.28 });

        // Contoured widebody charcoal honeycomb grille surround & high-clearance modular steel desert bumper
        rbox(g, 0.18, 0.38, 1.76, 0.04, flareCharcoal, [2.01, 0.19, 0]);
        rbox(g, 0.2, 0.13, 1.84, 0.03, frameSteel, [2.06, -0.07, 0]);

        // Carved 3D block-letter F - O - R - D across grille face + horizontal crossbar
        box(g, 0.04, 0.055, 1.38, flareCharcoal, [2.09, 0.19, 0]);
        for (const lz of [0.46, 0.15, -0.15, -0.46]) {
          rbox(g, 0.055, 0.21, 0.22, 0.022, letterMat, [2.1, 0.19, lz]);
          rbox(g, 0.06, 0.11, 0.11, 0.012, flareCharcoal, [2.11, 0.19, lz]);
        }
        // Code Orange "R" Raptor R grille accent badge on lower left grille
        box(g, 0.06, 0.042, 0.055, foxOrange, [2.11, 0.08, -0.58]);

        // Signature Amber C-Clamp DRL Headlight Surrounds + Twin Stacked Bi-LED Projectors
        for (const side of [-1, 1]) {
          const hz = side * 0.76;
          rbox(g, 0.12, 0.34, 0.22, 0.028, flareCharcoal, [2.03, 0.19, hz]);
          // Outer vertical + top/bottom horizontal C-clamp amber LED bars
          box(g, 0.06, 0.32, 0.032, amber, [2.08, 0.19, side * 0.85]);
          box(g, 0.06, 0.032, 0.19, amber, [2.08, 0.34, hz]);
          box(g, 0.06, 0.032, 0.19, amber, [2.08, 0.04, hz]);
          // Upper & lower optical LED projector cubes
          rbox(g, 0.06, 0.095, 0.13, 0.018, ledWhite, [2.085, 0.25, hz - side * 0.02]);
          rbox(g, 0.06, 0.095, 0.13, 0.018, ledWhite, [2.085, 0.13, hz - side * 0.02]);
          // Rigid LED off-road fog pods in bumper wings
          rbox(g, 0.05, 0.05, 0.14, 0.012, ledWhite, [2.14, -0.07, side * 0.68]);
        }

        // 3 mandatory DOT amber clearance marker LEDs across upper grille bar
        for (const z of [-0.32, 0, 0.32]) {
          box(g, 0.05, 0.028, 0.085, amber, [2.11, 0.35, z]);
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
        buildSculptedTruckBed(g, {
          bedFrontX: -0.6,
          bedRearX: -2.04,
          wheelX: -1.35,
          wheelY: -0.22,
          archRadius: 0.49,
          halfWidth: 0.89,
          beltlineY: 0.48,
          rockerY: -0.15,
          floorY: 0.04,
          bodyMat: fordBlue,
          flareMat: flareCharcoal,
          bedlinerMat: frameSteel,
        });

        // Sculpted Tailgate + Satin-Black FORD Raptor Appliqué Panel + Vertical LED Taillights + Rear Steel Bumper
        rbox(g, 0.1, 0.44, 1.76, 0.028, fordBlue, [-2.04, 0.26, 0]);
        rbox(g, 0.045, 0.22, 1.56, 0.018, flareCharcoal, [-2.085, 0.26, 0]);
        box(g, 0.05, 0.04, 0.14, foxOrange, [-2.1, 0.19, -0.58]);
        for (const side of [-1, 1]) {
          rbox(g, 0.08, 0.32, 0.09, 0.018, emissiveMat(0xff1e27, 1.65), [-2.05, 0.27, side * 0.85]);
        }
        rbox(g, 0.16, 0.12, 1.84, 0.025, frameSteel, [-2.08, -0.09, 0]);
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
        buildSculptedTruckCabAndFenders(g, {
          cabRearX: -0.56,
          cowlX: 0.88,
          noseX: 2.0,
          wheelX: 1.38,
          wheelY: -0.22,
          archRadius: 0.49,
          halfWidth: 0.89,
          beltlineY: 0.48,
          noseTopY: 0.38,
          rockerY: -0.16,
          bodyMat: fordBlue,
          flareMat: flareCharcoal,
          darkMat: frameSteel,
          hoodHeight: 0.082,
          hoodDomeWidth: 0.48,
          steppedWindowNotch: true,
        });

        // Sculpted Raptor R Power-Dome Heat-Extractor Hood Cowl Vent with 6 Angled Louver Slats & Code Orange Badge
        rbox(g, 0.52, 0.042, 0.62, 0.016, flareCharcoal, [1.42, 0.535, 0], [0, 0, -0.06]);
        for (let i = 0; i < 6; i++) {
          box(g, 0.036, 0.022, 0.52, frameSteel, [1.22 + i * 0.075, 0.552 - i * 0.004, 0], [0, 0, 0.28]);
        }
        box(g, 0.16, 0.014, 0.045, foxOrange, [1.32, 0.56, 0.24], [0, 0, -0.06]);
        box(g, 0.16, 0.014, 0.045, foxOrange, [1.32, 0.56, -0.24], [0, 0, -0.06]);

        // Cast-Aluminum Running Boards, Fender Air Extractor Vents, Door Handles & Dual-Arm Tow Mirrors
        for (const side of [-1, 1]) {
          rbox(g, 1.32, 0.035, 0.14, 0.01, frameSteel, [0.14, -0.18, side * 0.94]);
          rbox(g, 0.16, 0.12, 0.03, 0.008, flareCharcoal, [0.96, 0.34, side * 0.94]);
          for (const hx of [0.32, -0.32]) {
            rbox(g, 0.16, 0.032, 0.028, 0.008, flareCharcoal, [hx, 0.33, side * 0.945]);
          }
          // Dual-arm off-road mirror with amber LED spotter light
          box(g, 0.05, 0.022, 0.14, flareCharcoal, [0.68, 0.49, side * 0.92]);
          box(g, 0.05, 0.022, 0.14, flareCharcoal, [0.68, 0.44, side * 0.92]);
          rbox(g, 0.12, 0.16, 0.14, 0.022, flareCharcoal, [0.66, 0.48, side * 1.0]);
          box(g, 0.025, 0.09, 0.018, emissiveMat(0xff9900, 1.5), [0.71, 0.48, side * 1.06]);
        }
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
        buildSculptedTruckGreenhouse(g, {
          cabRearX: -0.56,
          cowlX: 0.88,
          roofFrontX: 0.32,
          beltlineY: 0.48,
          roofY: 0.96,
          beltHalfW: 0.88,
          roofHalfW: 0.74,
          bodyMat: fordBlue,
          pillarBlackMat: flareCharcoal,
          windshieldGlassMat: glassMat(0x7dd3fc, 0.42),
          roofGlassMat: glassMat(0x0f172a, 0.72),
          sideGlassMat: glassMat(0x38bdf8, 0.44),
          steppedFrontWindow: true,
        });
      },
    },
    {
      id: 'heavy-brakes-hubs',
      name: 'Vented Disc Brakes, 4x4 Locking Hubs, EPAS Steering Rack & Sway Bars',
      category: 'Brakes, Steering & Safety',
      isOuter: false,
      explodeOffset: [0, -0.5, 1.75],
      desc: 'Oversized vented iron brake rotors, vacuum-actuated 4x4 front wheel hubs, heavy-duty off-road electric power steering (EPAS) rack & tie rods, and front/rear stabilizer bars.',
      funFact: 'Trailer Brake Control lets the truck’s brake pedal also control the electric brakes on a heavy camper trailer behind you!',
      build(g) {
        for (const x of [-1.35, 1.38]) {
          for (const z of [-0.88, 0.88]) {
            cyl(g, 0.16, 0.16, 0.03, 24, skidAlu, [x, -0.22, z], [Math.PI / 2, 0, 0]);
            rbox(g, 0.08, 0.11, 0.065, 0.015, foxOrange, [x + (x > 0 ? -0.1 : 0.1), -0.18, z]);
          }
        }
        buildSteeringRackAndColumn(g, {
          rackX: 1.38,
          rackY: -0.2,
          rackWidth: 1.38,
          colStart: [0.46, 0.4, 0.42],
          epasColor: 0xff5a00,
        });
        buildFrontRearSwayBars(g, {
          frontX: 1.38,
          rearX: -1.35,
          y: -0.22,
          span: 1.34,
          color: 0x0046ad,
        });
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
          buildOffRoadWheel(g, pos, {
            tireRadius: 0.45,
            tireWidth: 0.3,
            rimColor: 0x374151,
            beadlockColor: 0x94a3b8,
            caliperColor: 0xff5a00,
            spokes: 8,
            lugCount: 6,
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
  const pythonGreen = carPaint(0x1eb854, { roughness: 0.14, metalness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.04 });
  pythonGreen.vertexColors = false;
  pythonGreen.map = null;
  const pyroRed = carPaint(0xe11d48, { roughness: 0.16, metalness: 0.45, clearcoat: 1.0 });
  pyroRed.vertexColors = false;
  pyroRed.map = null;
  const satinCarbonTrim = mat(0x141820, { roughness: 0.24, metalness: 0.35, clearcoat: 0.82 });
  satinCarbonTrim.vertexColors = false;
  satinCarbonTrim.map = null;
  const carbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xd8dee9);

  const parts = [
    {
      id: 'lightweight-chassis',
      name: 'Aluminum-Carbon Composite Chassis & Underbody Diffuser',
      category: 'Structure',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Wide track chassis with aluminum-steel floorpan and full underbody aerodynamic diffuser vanes.',
      funFact: 'Even the Porsche crest sticker on the front hood is a thin decal instead of metal to save every gram of weight!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          ['BodyUnderside', 'BodyWheelwells'],
          { trim: satinCarbonTrim },
        );
        sanitizeCadMaterials(g);
        if (!hasCad) {
          rbox(g, 3.55, 0.1, 1.62, 0.03, carbon, [0, -0.32, 0]);
        }
        rbox(g, 0.38, 0.04, 1.72, 0.015, carbon, [1.84, -0.28, 0]);
        // Rear underbody Venturi diffuser strakes
        for (let z = -0.56; z <= 0.56; z += 0.28) {
          box(g, 0.44, 0.11, 0.02, carbon, [-1.74, -0.25, z], [0, 0, 0.18]);
        }
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
          // Sculpted CNC swan-neck upright pylon + top gooseneck hook + hydraulic DRS actuator cylinder
          box(g, 0.28, 0.56, 0.032, satinCarbonTrim, [-1.52, 0.56, z], [0, 0, -0.26]);
          box(g, 0.22, 0.09, 0.034, satinCarbonTrim, [-1.64, 0.84, z], [0, 0, 0.12]);
          cyl(g, 0.014, 0.014, 0.22, 12, alu, [-1.62, 0.76, z * 0.92], [0, 0, -0.35]);
        }
        // Main fixed lower carbon wing plane + upper hydraulic DRS active flap in Python Green & Carbon
        rbox(g, 0.3, 0.036, 1.74, 0.014, carbon, [-1.68, 0.82, 0], [0, 0, 0.12]);
        rbox(g, 0.2, 0.032, 1.72, 0.01, carbon, [-1.82, 0.91, 0], [0, 0, 0.26]);
        box(g, 0.04, 0.012, 1.7, pythonGreen, [-1.9, 0.94, 0], [0, 0, 0.26]);
        for (const side of [-1, 1]) {
          box(g, 0.46, 0.34, 0.026, carbon, [-1.74, 0.82, side * 0.87], [0, 0, 0.08]);
          box(g, 0.38, 0.04, 0.03, pythonGreen, [-1.74, 0.96, side * 0.875], [0, 0, 0.08]);
        }
      },
    },
    {
      id: 'center-radiator-nostrils',
      name: 'Motorsport Center Radiator, 90L Front Fuel Tank & Hood Nostrils',
      category: 'Cooling, Fuel & Aero',
      isOuter: false,
      explodeOffset: [1.95, 1.15, 0],
      desc: 'Angled race-car radiator filling the nose, a 90-liter front-trunk FT3 fuel bladder with center-hood quick-fill cap, braided stainless AN coolant/fuel lines, and twin carbon hood nostrils.',
      funFact: 'Roof fins above the windshield push that hot radiator air sideways so the rear engine only breathes icy-cold air!',
      build(g) {
        rbox(g, 0.48, 0.26, 0.96, 0.02, alu, [1.28, -0.06, 0], [0, 0, -0.45]);
        for (const z of [-0.28, 0.28]) {
          rbox(g, 0.32, 0.06, 0.28, 0.015, carbon, [1.28, 0.16, z], [0, 0, -0.22]);
        }
        buildFuelSystemAndTank(g, {
          tankPos: [0.84, -0.14, 0],
          tankSize: [0.38, 0.22, 0.68],
          enginePos: [-1.38, -0.06, 0],
          fillerPos: [0.96, 0.2, 0],
          saddle: false,
          tankColor: 0xe11d48,
        });
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
      desc: 'Tubular safety roll cage bolted behind the CAD carbon full-bucket seats with Pyro Red 6-point racing harnesses.',
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
          { leather: darkAlcantara, trim: satinCarbonTrim },
        );
        sanitizeCadMaterials(g);
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
      name: 'Aero-Wishbone Coilovers, PCCB Brakes, Rear-Axle Steer & Carbon Sway Bars',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.85, 1.8],
      desc: 'Four 3D yellow helical coilover springs, teardrop aero wishbones, CAD PCCB brake discs & calipers, front/rear-axle steering racks, and Weissach carbon-fiber anti-roll sway bars.',
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
        sanitizeCadMaterials(g);
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
        buildSteeringRackAndColumn(g, {
          rackX: 1.24,
          rackY: -0.24,
          colStart: [0.36, 0.26, 0.36],
          epasColor: 0xfacc15,
          rearSteerX: -1.24,
        });
        buildFrontRearSwayBars(g, {
          frontX: 1.24,
          rearX: -1.24,
          y: -0.26,
          color: 0x1eb854,
        });
      },
    },
    {
      id: 'track-steering-dials',
      name: '4-Dial Track Steering Wheel, Pedals & 10,000 RPM Tachometer',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.65, 1.35, 1.15],
      desc: 'CAD cockpit dashboard, billet pedals, and yellow central 10,000 RPM tachometer.',
      funFact: 'Right in the middle of the gauge cluster is a real physical needle tachometer that counts up to 10,000 RPM!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          [
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
          ],
          { trim: satinCarbonTrim },
        );
        sanitizeCadMaterials(g);
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
      desc: 'Sculpted 911 CAD bodywork in uniform Porsche Python Green with a central Weissach carbon hood stripe, dual S-duct hood nostrils, dive-plane canards, and carbon shark-gill fender louvers.',
      funFact: 'If trapped air builds up inside spinning wheel wells, it lifts the front of a car—the fender louvers let that air escape!',
      build(g) {
        // Apply uniform Python Green to BodyHood and all exterior body panels so the front clip matches the rear quarters seamlessly
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
          {
            body: pythonGreen,
            BodyHood: pythonGreen,
            BodyHoodTopgrill: satinCarbonTrim,
            trim: satinCarbonTrim,
          },
        );
        sanitizeCadMaterials(g);
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
            accentColor: satinCarbonTrim,
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
        // Deliberate, crisp Weissach central carbon-fiber hood stripe following the front hood contour
        const stripeStations = [
          [
            [0.82, 0.275, -0.34],
            [0.82, 0.282, 0],
            [0.82, 0.275, 0.34],
          ],
          [
            [1.26, 0.215, -0.31],
            [1.26, 0.222, 0],
            [1.26, 0.215, 0.31],
          ],
          [
            [1.72, 0.115, -0.26],
            [1.72, 0.122, 0],
            [1.72, 0.115, 0.26],
          ],
        ];
        buildMultiSectionLoft(g, stripeStations, carbon, { closedRing: false });

        // Twin GT3 RS S-duct carbon hood nostrils + Porsche nose crest
        for (const side of [-1, 1]) {
          rbox(g, 0.26, 0.025, 0.19, 0.008, satinCarbonTrim, [1.32, 0.215, side * 0.21], [0, 0, -0.21]);
          box(g, 0.2, 0.028, 0.14, mat(0x090d14, { roughness: 0.85 }), [1.32, 0.218, side * 0.21], [0, 0, -0.21]);
        }
        cyl(g, 0.024, 0.024, 0.008, 12, carPaint(0xfacc15), [1.78, 0.11, 0], [0, 0, -0.24]);

        // Front GT3 RS carbon aero splitter + side dive-plane canards + side carbon skirts + rear Turbo-style side intakes
        rbox(g, 0.28, 0.03, 1.72, 0.01, satinCarbonTrim, [1.9, -0.26, 0]);
        for (const side of [-1, 1]) {
          // Front bumper dive-plane canards
          box(g, 0.18, 0.016, 0.08, satinCarbonTrim, [1.82, -0.08, side * 0.82], [side * 0.35, side * 0.25, -0.18]);
          // Side carbon rocker aero blade
          rbox(g, 1.62, 0.038, 0.06, 0.01, satinCarbonTrim, [0.0, -0.25, side * 0.86]);
          // Rear quarter panel side intake scoop
          rbox(g, 0.26, 0.16, 0.05, 0.012, satinCarbonTrim, [-0.68, 0.06, side * 0.85]);
          // Front & rear wheel-arch shark-gill carbon louvers
          for (let i = 0; i < 4; i++) {
            box(g, 0.036, 0.024, 0.14, satinCarbonTrim, [1.18 + i * 0.075, 0.21, side * 0.77], [0, 0, 0.24]);
            box(g, 0.034, 0.022, 0.13, satinCarbonTrim, [-1.14 - i * 0.07, 0.24, side * 0.78], [0, 0, -0.2]);
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
      desc: 'Thin smartphone-style Gorilla Glass windows and a Weissach carbon/magnesium roof with two vertical aerodynamic fins.',
      funFact: 'Using ultra-thin acoustic Gorilla Glass for the windows saves weight right at the top of the car where it matters most!',
      build(g) {
        const glass = glassMat(0x7dd3fc, 0.42);
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
          { body: pythonGreen, BodyRoofPanel: pythonGreen, trim: satinCarbonTrim, glass },
        );
        sanitizeCadMaterials(g);
        if (!hasCad) {
          rbox(g, 0.78, 0.05, 1.38, 0.02, glass, [0.58, 0.48, 0], [0, 0, -0.52]);
          rbox(g, 0.92, 0.06, 1.36, 0.02, pythonGreen, [-0.08, 0.7, 0]);
          rbox(g, 0.78, 0.05, 1.34, 0.02, glass, [-0.88, 0.5, 0], [0, 0, 0.48]);
        }
        // Central Weissach exposed carbon roof panel framed by the two Python Green aero roof fins
        rbox(g, 0.64, 0.018, 0.64, 0.006, carbon, [-0.12, 0.535, 0], [0, 0, 0.03]);
        box(g, 0.66, 0.038, 0.024, pythonGreen, [-0.12, 0.55, 0.35]);
        box(g, 0.66, 0.038, 0.024, pythonGreen, [-0.12, 0.55, -0.35]);
      },
    },
    {
      id: 'four-point-headlights',
      name: 'Oval 4-Point Matrix LED Headlights & Rear PORSCHE Lightbar',
      category: 'Lighting',
      isOuter: true,
      explodeOffset: [2.2, 0.65, 0],
      desc: 'CAD projector headlamps, rear light strip, and 4-point LED DRLs.',
      funFact: 'Every Porsche 911 since 1963 has kept the same iconic round headlights and sloping roofline!',
      build(g) {
        const hasCad = addCarConceptCadNodes(
          g,
          [
            'BodyHeadlights',
            'BodyTaillights',
            'BodyTaillightsPanels',
            'BodyTurnsignalsRear',
          ],
          { trim: satinCarbonTrim },
        );
        sanitizeCadMaterials(g);
        const ledWhite = emissiveMat(0xffffff, 1.8);
        if (!hasCad) {
          for (const z of [-0.62, 0.62]) {
            cyl(g, 0.16, 0.16, 0.08, 24, ledWhite, [1.72, 0.14, z], [0, 0, -1.1]);
            torus(g, 0.165, 0.018, satinCarbonTrim, [1.74, 0.15, z], [0, Math.PI / 2, -0.45]);
          }
          rbox(g, 0.08, 0.07, 1.58, 0.02, emissiveMat(0xff1e27, 1.25), [-1.92, 0.14, 0]);
        }
        // Signature Porsche 4-point LED DRL dots inside each oval headlamp housing
        for (const side of [-1, 1]) {
          for (const [dx, dz] of [
            [-0.04, -0.04],
            [-0.04, 0.04],
            [0.04, -0.04],
            [0.04, 0.04],
          ]) {
            sphere(g, 0.016, 10, ledWhite, [1.74 + dx, 0.14, side * 0.64 + dz]);
          }
        }
      },
    },
    {
      id: 'centerlock-magnesium-wheels',
      name: 'Center-Lock Forged Magnesium Wheels (Pyro Red) & PCCB Rotors',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.45, -2.15],
      desc: 'Pyro Red forged magnesium CAD wheels with central anodized hex lock nuts and yellow PCCB calipers!',
      funFact: 'Forged magnesium wheels save 19 pounds of spinning mass so the steering feels telepathic!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'], {
          rim: pyroRed,
          caliper: carPaint(0xfacc15),
          excludeBrakes: true,
        });
        sanitizeCadMaterials(g);
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
  const pearlWhite = carPaint(0xdde3ec, { roughness: 0.18, metalness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.05 });
  pearlWhite.vertexColors = false;
  pearlWhite.map = null;
  const satinBlack = mat(0x111827, { roughness: 0.34, metalness: 0.28 });
  satinBlack.vertexColors = false;
  satinBlack.map = null;
  const darkMetal = brushedMetal(0x2b3440);
  const alu = brushedMetal(0xcfd6df);
  const carbon = carbonFiberMat([4, 4]);
  const crimsonCaliper = carPaint(0xd90429);
  const darkRoofGlass = glassMat(0x0f172a, 0.72);
  const sideCabinGlass = glassMat(0x1e293b, 0.56);

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
        sanitizeCadMaterials(g);
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
      name: '100 kWh 800V Structural Battery Pack, Charge Port & Orange HV Loom',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.1, 0],
      desc: 'Armored underfloor lithium-ion battery pack with 5 liquid-cooled module bays, copper busbars, on-board charger (OBC), NACS Supercharger inlet, and dual orange high-voltage harnesses.',
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
        buildEVChargePortAndOBC(g, { portPos: [-1.72, 0.18, 0.78], obcPos: [-0.92, -0.12, 0] });
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
        // Central roof spine housing the dual electro-hydraulic Falcon Wing hinges + contrasting black weatherstrip seams
        rbox(g, 0.84, 0.044, 0.34, 0.014, satinBlack, [-0.36, 0.675, 0]);
        rbox(g, 0.78, 0.046, 0.26, 0.012, pearlWhite, [-0.36, 0.68, 0]);
        for (const side of [-1, 1]) {
          // Exposed forged aluminum roof hinge knuckles along the spine
          for (const hx of [-0.66, -0.06]) {
            rbox(g, 0.09, 0.048, 0.08, 0.01, alu, [hx, 0.685, side * 0.17]);
          }
          const wingGroup = new THREE.Group();
          wingGroup.position.set(-0.36, 0.66, side * 0.18);
          // Partially elevated Falcon Wing posture (+12° gullwing lift) connected directly to the SUV roof spine
          wingGroup.rotation.x = side * -0.18;
          g.add(wingGroup);

          // Upper roof-hinged gullwing section framed in satinBlack + dark solar-tinted upper falcon glass
          rbox(wingGroup, 0.8, 0.04, 0.54, 0.015, satinBlack, [0, 0, side * 0.26]);
          rbox(wingGroup, 0.75, 0.042, 0.48, 0.014, pearlWhite, [0, 0.002, side * 0.26]);
          rbox(wingGroup, 0.66, 0.046, 0.4, 0.012, darkRoofGlass, [0, 0.006, side * 0.26]);

          // Outer double-hinge knuckle + contoured lower door skin & side window
          for (const hx of [-0.3, 0.3]) {
            rbox(wingGroup, 0.08, 0.045, 0.06, 0.01, alu, [hx, -0.01, side * 0.51]);
          }
          const lowerDoor = new THREE.Group();
          lowerDoor.position.set(0, -0.02, side * 0.52);
          lowerDoor.rotation.x = side * 0.16;
          wingGroup.add(lowerDoor);

          // Black B/C pillar window frame + dark tinted side window
          rbox(lowerDoor, 0.78, 0.28, 0.044, 0.014, satinBlack, [0, -0.13, 0], [side * -0.14, 0, 0]);
          rbox(lowerDoor, 0.72, 0.24, 0.05, 0.012, sideCabinGlass, [0, -0.13, 0], [side * -0.14, 0, 0]);
          // Sculpted Pearl White lower door panel with contrasting dark perimeter seam & lower rocker molding
          rbox(lowerDoor, 0.82, 0.4, 0.054, 0.018, satinBlack, [0, -0.42, side * 0.026]);
          rbox(lowerDoor, 0.78, 0.36, 0.06, 0.018, pearlWhite, [0, -0.41, side * 0.03]);
          rbox(lowerDoor, 0.8, 0.085, 0.066, 0.014, satinBlack, [0, -0.61, side * 0.035]);
          // Satin black character crease + chrome flush capacitive door handle
          box(lowerDoor, 0.74, 0.012, 0.064, darkMetal, [0, -0.34, side * 0.033]);
          box(lowerDoor, 0.14, 0.022, 0.068, chromeMat(), [0.24, -0.27, side * 0.035]);

          // Twin motorized inductive gas struts connecting B/C roof headers to Falcon Wing
          for (const sx of [-0.68, -0.04]) {
            cyl(g, 0.015, 0.013, 0.28, 12, chromeMat(), [sx, 0.54, side * 0.56], [side * 0.38, 0, 0]);
          }
        }
      },
    },
    {
      id: 'modelx-air-suspension-brakes',
      name: 'Adaptive Air Suspension, CAD Brakes, EPAS Steering Rack & Sway Bars',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.75],
      desc: 'Height-adjustable air suspension struts, forged control arms, ventilated CAD brake rotors with crimson 6-piston Brembo calipers, EPAS steering rack & column, and front/rear sway bars.',
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
        sanitizeCadMaterials(g);
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
        buildSteeringRackAndColumn(g, {
          rackX: 1.287,
          rackY: -0.2,
          colStart: [0.38, 0.4, 0.38],
          epasColor: 0xd90429,
        });
        buildFrontRearSwayBars(g, {
          frontX: 1.287,
          rearX: -1.289,
          y: -0.23,
          color: 0xd90429,
        });
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
          { dash: satinBlack, trim: satinBlack },
          suvMatrix,
        );
        sanitizeCadMaterials(g);
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
        const whiteLeather = mat(0xeef2f6, { roughness: 0.34, metalness: 0.05 });
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
      name: 'Pearl-White Sculpted Crossover Body, Self-Presenting Doors & Active Wing',
      category: 'Exterior',
      isOuter: true,
      explodeOffset: [0, 1.75, -1.95],
      desc: 'Sculpted SUV crossover bodywork in multi-coat Pearl Silver-White with contrasting black SUV rocker/arch cladding, Falcon Wing door seam channels, motorized front door actuators, and an active rear spoiler.',
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
          {
            body: pearlWhite,
            BodyHood: pearlWhite,
            BodyHoodTopgrill: pearlWhite,
            trim: satinBlack,
          },
          suvMatrix,
        );
        sanitizeCadMaterials(g);
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
        // Signature Tesla Model X sleek black nose cone V-bar + chrome "T" emblem + lower aero intake valence
        rbox(g, 0.08, 0.042, 0.96, 0.012, satinBlack, [1.94, 0.08, 0]);
        box(g, 0.05, 0.05, 0.055, chromeMat(), [1.98, 0.085, 0]);
        rbox(g, 0.22, 0.07, 1.48, 0.018, satinBlack, [1.9, -0.22, 0]);

        // Contrasting SUV satin-black lower rocker cladding, wheel-arch eyebrows & Falcon Wing rear door shutline seams
        for (const s of [-1, 1]) {
          rbox(g, 1.72, 0.075, 0.055, 0.014, satinBlack, [0.0, -0.21, s * 0.87]);
          // Vertical B-pillar and C-pillar door seam channels so the Falcon Wing doors read clearly against the body
          box(g, 0.016, 0.48, 0.025, satinBlack, [0.04, 0.24, s * 0.86]);
          box(g, 0.016, 0.46, 0.025, satinBlack, [-0.76, 0.26, s * 0.86]);
          // Self-Presenting Front Door Motorized Strut Actuators at front A-pillar hinges
          cyl(g, 0.016, 0.016, 0.24, 12, chromeMat(), [0.68, 0.14, s * 0.76], [0, 0, Math.PI / 2]);
          rbox(g, 0.08, 0.06, 0.05, 0.01, darkMetal, [0.8, 0.14, s * 0.74]);
        }
        // Sculpted Active Rear Spoiler bridge across the fastback tailgate + Plaid Rear Badge
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
      desc: '31-square-foot continuous solar-tinted panoramic windshield stretching seamlessly from the front hood right over the front seats with Pearl-White A-pillars and acoustic solar glazing.',
      funFact: 'Model X has the largest all-glass windshield in production—almost 31 square feet of curved acoustic glass with magnetic sunvisors!',
      build(g) {
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
          {
            body: pearlWhite,
            BodyRoofPanel: darkRoofGlass,
            BodyPillars: pearlWhite,
            glass: darkRoofGlass,
            trim: satinBlack,
          },
          suvMatrix,
        );
        sanitizeCadMaterials(g);
        if (!hasCad) {
          rbox(g, 1.25, 0.05, 1.52, 0.02, darkRoofGlass, [0.52, 0.68, 0], [0, 0, -0.48]);
        }
      },
    },
    {
      id: 'modelx-22-turbine-wheels',
      name: '22" Machined Turbine Forged Wheels & Pirelli Scorpion EV Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.4, -1.95],
      desc: '22-inch Onyx Black machined turbine alloy wheels with acoustic-foam Pirelli Scorpion tires and crimson Brembo calipers.',
      funFact: 'Twisted turbine wheel blades pump hot air outward away from the brakes while smoothing airflow along the sides of the SUV!',
      build(g) {
        const hasCad = addCarConceptCadNodes(g, ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'], {
          rim: brushedMetal(0x1f2937, { metalness: 0.92, roughness: 0.16 }),
          caliper: crimsonCaliper,
          excludeBrakes: true,
        });
        sanitizeCadMaterials(g);
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
  const liquidCherry = carPaint(0xb91c1c, { metalness: 0.58, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.03 });
  liquidCherry.vertexColors = false;
  liquidCherry.map = null;
  const satinCarbonTrim = mat(0x141820, { roughness: 0.24, metalness: 0.35, clearcoat: 0.85 });
  satinCarbonTrim.vertexColors = false;
  satinCarbonTrim.map = null;
  const satinCarbon = carbonFiberMat([6, 6]);
  const titanium = brushedMetal(0xd8dee9, { metalness: 0.92, roughness: 0.16 });
  const darkTi = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.2 });
  const copper = brushedMetal(0xd97706, { metalness: 0.94, roughness: 0.14 });
  const thrusterGlow = emissiveMat(0x38bdf8, 2.4);

  // Sleek low-slung widebody hypercar proportion transform for the 358k-triangle CAD shell
  const roadsterMatrix = new THREE.Matrix4();
  {
    const o = new THREE.Object3D();
    o.scale.set(1.03, 0.95, 1.05);
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
      desc: 'Autoclave-cured woven carbon-fiber survival cell with a front carbon aero splitter and deep rear ground-effect Venturi diffuser strakes.',
      funFact: 'Air rushing through the twin underbody Venturi tunnels sucks the Roadster down onto the asphalt at over 250 mph!',
      build(g) {
        const hasCad = addFerrariCadNodes(
          g,
          ['carbon_fibre_trim', 'carbon fibre', 'carpet', 'plastic_gray', 'metal'],
          { trim: satinCarbonTrim },
          roadsterMatrix,
        );
        sanitizeCadMaterials(g);
        if (!hasCad) {
          rbox(g, 3.72, 0.08, 1.7, 0.025, satinCarbon, [0, -0.34, 0]);
        }
        // Aggressive protruding front carbon aero splitter + 6 rear ground-effect diffuser strake blades
        rbox(g, 0.42, 0.034, 1.82, 0.012, satinCarbon, [1.94, -0.31, 0]);
        for (let z = -0.6; z <= 0.6; z += 0.24) {
          box(g, 0.52, 0.14, 0.024, satinCarbon, [-1.78, -0.25, z], [0, 0, 0.2]);
        }
      },
    },
    {
      id: 'roadster-200kwh-battery',
      name: '200 kWh Double-Stacked Structural Battery Pack, Charge Port & OBC',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [0, -1.05, 0],
      desc: 'Double-layer structural 4680 lithium-silicon battery pack storing 200 kilowatt-hours—twice the energy of a standard EV—with liquid-cooled copper busbars, NACS charge port, and 800V orange looms.',
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
        buildEVChargePortAndOBC(g, { portPos: [-1.66, 0.14, 0.78], obcPos: [-0.88, -0.14, 0] });
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
      desc: 'Filament-wound Falcon 9 Carbon-Overwrapped Pressure Vessel (COPV) storing 10,000 PSI compressed air behind the seats, feeding 10 supersonic cold-gas rocket nozzles deployed behind the flip-down rear license plate!',
      funFact: 'Firing the rear SpaceX cold-gas rocket thrusters blasts the Roadster from 0 to 60 mph in 1.1 seconds—pulling 2.5 Gs like a fighter jet catapult!',
      build(g) {
        // Falcon 9 carbon-overwrapped COPV high-pressure tank mounted horizontally inside the rear bay
        cyl(g, 0.15, 0.15, 0.72, 28, satinCarbon, [-0.62, 0.02, 0], [Math.PI / 2, 0, 0]);
        sphere(g, 0.15, 24, satinCarbon, [-0.62, 0.02, 0.36]);
        sphere(g, 0.15, 24, satinCarbon, [-0.62, 0.02, -0.36]);
        // Gold anodized aluminum mounting straps & 10,000 PSI pressure regulator manifold
        for (const z of [-0.2, 0, 0.2]) {
          torus(g, 0.158, 0.014, copper, [-0.62, 0.02, z], [0, 0, 0]);
        }
        rbox(g, 0.18, 0.11, 0.28, 0.02, titanium, [-0.92, 0.04, 0]);

        // High-pressure braided titanium feed tubes from COPV to rear & lateral thruster banks
        for (const side of [-1, 1]) {
          tube(
            g,
            [
              [-0.82, 0.04, side * 0.16],
              [-1.35, 0.06, side * 0.2],
              [-1.88, 0.08, side * 0.16],
            ],
            0.022,
            titanium,
          );
        }

        // Exterior-visible armored titanium thruster bay bezel at the rear fascia + flip-down license plate door
        rbox(g, 0.08, 0.15, 0.92, 0.018, darkTi, [-1.96, 0.08, 0]);
        rbox(g, 0.025, 0.11, 0.48, 0.01, darkTi, [-2.01, -0.03, 0], [0, 0, 0.72]);

        // Twin primary de Laval supersonic rocket bells + glowing blue-white cold-gas throats & shock-diamond plumes
        for (const z of [-0.15, 0.15]) {
          cone(g, 0.078, 0.24, 24, titanium, [-1.94, 0.08, z], [0, 0, -Math.PI / 2]);
          torus(g, 0.068, 0.01, copper, [-2.02, 0.08, z], [0, Math.PI / 2, 0]);
          cyl(g, 0.054, 0.034, 0.09, 20, thrusterGlow, [-2.04, 0.08, z], [0, 0, Math.PI / 2]);
          cone(
            g,
            0.072,
            0.38,
            20,
            glassMat(0x7dd3fc, 0.58),
            [-2.22, 0.08, z],
            [0, 0, Math.PI / 2],
          );
        }
        // 8 lateral & directional attitude-control cold-gas nozzles
        for (const z of [-0.38, -0.29, 0.29, 0.38]) {
          cone(g, 0.038, 0.14, 16, titanium, [-1.96, 0.08, z], [0, 0, -Math.PI / 2]);
          cyl(g, 0.024, 0.016, 0.05, 14, thrusterGlow, [-2.02, 0.08, z], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'roadster-thermal-radiators',
      name: 'Dual Tilted Nose Heat Exchangers, 10,000 PSI Air Compressors & AN Lines',
      category: 'Thermal & Compressor System',
      isOuter: false,
      explodeOffset: [1.95, 0.35, 1.25],
      desc: 'High-capacity nose and side radiators cooling the 200 kWh battery, tri-motors, AND twin multi-stage 10,000 PSI electric air recharge compressors with finned intercooler heads.',
      funFact: 'Between rocket bursts, electric air compressors refill the carbon SpaceX tank back up to 10,000 PSI using battery power!',
      build(g) {
        for (const z of [-0.46, 0.46]) {
          rbox(g, 0.24, 0.2, 0.34, 0.02, titanium, [1.56, -0.14, z], [0, z > 0 ? -0.32 : 0.32, 0]);
          // Twin Multi-Stage 10,000 PSI Electric Air Recharge Compressor Pumps + finned intercooler heads
          cyl(g, 0.068, 0.068, 0.26, 18, copper, [-0.28, 0.04, z * 1.1], [0, 0, Math.PI / 2]);
          rbox(g, 0.14, 0.09, 0.14, 0.015, titanium, [-0.28, 0.13, z * 1.1]);
          tube(
            g,
            [
              [-0.28, 0.13, z * 1.05],
              [-0.46, 0.08, z * 0.72],
              [-0.62, 0.02, z * 0.5],
            ],
            0.014,
            titanium,
          );
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
      name: 'Active Track Pushrod Coilovers, Carbon Brakes, Steer-by-Wire & Sway Bars',
      category: 'Chassis & Safety',
      isOuter: false,
      explodeOffset: [0, -0.55, 1.65],
      desc: 'Four 3D helical coilover dampers, billet double-wishbone control arms, 420mm carbon-ceramic brake discs, front/rear steer-by-wire racks, and active anti-roll sway bars.',
      funFact: 'When braking from 250 mph, upward-pointing cold-gas thrusters in the nose also push the front tires down to shorten stopping distance!',
      build(g) {
        addFerrariCadNodes(g, ['brakes'], { caliper: liquidCherry }, roadsterMatrix);
        sanitizeCadMaterials(g);
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
        buildSteeringRackAndColumn(g, {
          rackX: 1.33,
          rackY: -0.24,
          colStart: [0.38, 0.2, 0.36],
          epasColor: 0x38bdf8,
          rearSteerX: -1.36,
        });
        buildFrontRearSwayBars(g, {
          frontX: 1.33,
          rearX: -1.36,
          y: -0.26,
          color: 0xb91c1c,
        });
      },
    },
    {
      id: 'roadster-jet-yoke-ribbon-oled',
      name: 'Fighter-Jet Carbon Steering Yoke & Sweeping Ribbon OLED Arc',
      category: 'Cockpit',
      isOuter: false,
      explodeOffset: [0.85, 1.3, 1.15],
      desc: 'Minimalist carbon-fiber fighter-jet yoke and an ultra-thin curved OLED glass ribbon spanning from the windshield down to the center tunnel.',
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
      desc: 'Deep contoured carbon-fiber racing shells finished in lunar white & charcoal Alcantara.',
      funFact: 'In cars without the SpaceX rocket tank, two compact rear jump seats fit behind the driver; with the SpaceX package, the COPV rocket tank takes center stage!',
      build(g) {
        const lunarWhite = mat(0xf1f5f9, { roughness: 0.35, metalness: 0.06 });
        const hasCad = addFerrariCadNodes(
          g,
          ['leather', 'interior_dark', 'interior_light'],
          { leather: lunarWhite, trim: satinCarbonTrim },
          roadsterMatrix,
        );
        sanitizeCadMaterials(g);
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
      desc: '80,566-triangle wind-tunnel-sculpted Liquid Cherry Metallic bodywork with a smooth EV bullet nose cone, multi-plane carbon front splitter, dive-plane canards, and carbon rocker blades.',
      funFact: 'Because an electric hypercar doesn’t need a giant front radiator grille, the Roadster’s nose slices into the wind like a supersonic bullet!',
      build(g) {
        const hasCad = addFerrariCadNodes(
          g,
          ['body', 'grills', 'trim'],
          { body: liquidCherry, trim: satinCarbonTrim, accent: titanium },
          roadsterMatrix,
        );
        sanitizeCadMaterials(g);
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
            accentColor: satinCarbonTrim,
          });
        }
        // Sculpted smooth EV nose cone fairing + protruding carbon front aero splitter + corner dive-plane canards
        const noseStations = [
          [
            [1.68, 0.07, -0.54],
            [1.68, 0.09, 0],
            [1.68, 0.07, 0.54],
          ],
          [
            [1.92, -0.02, -0.48],
            [1.92, 0.0, 0],
            [1.92, -0.02, 0.48],
          ],
          [
            [2.06, -0.12, -0.36],
            [2.06, -0.1, 0],
            [2.06, -0.12, 0.36],
          ],
        ];
        buildMultiSectionLoft(g, noseStations, liquidCherry, { closedRing: false });
        // Silver Tesla "T" nose emblem flush on hood
        box(g, 0.045, 0.01, 0.06, titanium, [1.88, 0.015, 0], [0, 0, -0.32]);
        // Protruding front carbon aero splitter blade & vertical splitter struts
        rbox(g, 0.34, 0.028, 1.78, 0.01, satinCarbon, [1.96, -0.26, 0]);
        for (const z of [-0.36, 0.36]) {
          box(g, 0.08, 0.09, 0.018, titanium, [1.98, -0.2, z]);
        }
        // Carbon front dive-plane canards, side aero rocker skirts & fender louvers
        for (const side of [-1, 1]) {
          box(g, 0.22, 0.018, 0.09, satinCarbon, [1.86, -0.12, side * 0.84], [side * 0.32, side * 0.22, -0.18]);
          rbox(g, 1.56, 0.036, 0.07, 0.01, satinCarbon, [0.02, -0.26, side * 0.88]);
          for (let i = 0; i < 4; i++) {
            box(g, 0.034, 0.02, 0.15, satinCarbonTrim, [1.24 + i * 0.07, 0.16, side * 0.78], [0, 0, 0.22]);
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
      desc: 'Curved CAD windshield, tinted panoramic Targa coupe glass roof canopy bridging the windshield header to a structural carbon B-pillar roll hoop, sculpted fastback flying buttresses with rear fastback glass, and laser LED headlamps.',
      funFact: 'You can unlatch the lightweight tinted glass roof panel in 30 seconds and stow it in the trunk for open-air convertible driving!',
      build(g) {
        const glass = glassMat(0x1e293b, 0.60);
        glass.side = THREE.DoubleSide;
        const darkTargaGlass = glassMat(0x0f172a, 0.80);
        darkTargaGlass.side = THREE.DoubleSide;
        const liquidCherryRoof = liquidCherry.clone();
        liquidCherryRoof.side = THREE.DoubleSide;
        addFerrariCadNodes(
          g,
          ['glass', 'wipers', 'lights', 'lights_red', 'leds'],
          { glass },
          roadsterMatrix,
        );
        sanitizeCadMaterials(g);

        // 3D arched panoramic Targa coupe roof canopy bridging upper windshield header (x=0.54) over (x=0.35) to B-pillar hoop (x=-0.44)
        const solidTargaLiner = mat(0x0f172a, { roughness: 0.14, metalness: 0.55, clearcoat: 1.0, clearcoatRoughness: 0.05 });
        solidTargaLiner.side = THREE.DoubleSide;
        const targaRoofStations = [
          [
            [0.54, 0.520, -0.640],
            [0.54, 0.581, -0.357],
            [0.54, 0.600, 0],
            [0.54, 0.581, 0.357],
            [0.54, 0.520, 0.640],
          ],
          [
            [0.35, 0.588, -0.588],
            [0.35, 0.635, -0.336],
            [0.35, 0.651, 0],
            [0.35, 0.635, 0.336],
            [0.35, 0.588, 0.588],
          ],
          [
            [-0.08, 0.592, -0.583],
            [-0.08, 0.639, -0.336],
            [-0.08, 0.655, 0],
            [-0.08, 0.639, 0.336],
            [-0.08, 0.592, 0.583],
          ],
          [
            [-0.44, 0.580, -0.560],
            [-0.44, 0.620, -0.320],
            [-0.44, 0.634, 0],
            [-0.44, 0.620, 0.320],
            [-0.44, 0.580, 0.560],
          ],
        ];
        buildMultiSectionLoft(g, targaRoofStations, solidTargaLiner, { closedRing: false });
        const targaGlassTop = targaRoofStations.map((ring) =>
          ring.map(([x, y, z]) => [x, y + 0.008, z]),
        );
        buildMultiSectionLoft(g, targaGlassTop, darkTargaGlass, { closedRing: false });

        // Structural Carbon-Fiber & Liquid Cherry B-Pillar Roll Hoop Arch (x=-0.42 to x=-0.58)
        const hoopStations = [
          [
            [-0.42, 0.582, -0.565],
            [-0.42, 0.624, -0.32],
            [-0.42, 0.638, 0],
            [-0.42, 0.624, 0.32],
            [-0.42, 0.582, 0.565],
          ],
          [
            [-0.58, 0.574, -0.546],
            [-0.58, 0.611, -0.315],
            [-0.58, 0.625, 0],
            [-0.58, 0.611, 0.315],
            [-0.58, 0.574, 0.546],
          ],
        ];
        buildMultiSectionLoft(g, hoopStations, liquidCherryRoof, { closedRing: false });
        rbox(g, 0.08, 0.15, 0.98, 0.02, satinCarbonTrim, [-0.52, 0.49, 0]);

        for (const side of [-1, 1]) {
          const s = side;
          tube(
            g,
            [
              [0.93, 0.290, s * 0.806],
              [0.72, 0.418, s * 0.720],
              [0.52, 0.519, s * 0.645],
              [0.35, 0.588, s * 0.588],
              [0.00, 0.592, s * 0.583],
              [-0.26, 0.588, s * 0.572],
              [-0.54, 0.574, s * 0.546],
            ],
            0.022,
            liquidCherryRoof,
          );
          // Contoured 7-station side coupe windows hugging the exact roadsterMatrix-scaled door sill (y=0.273, z=0.84) and A-pillar (x=0.93..0.35)
          const sideWinStations = [
            [
              [0.93, 0.278, s * 0.814],
              [0.93, 0.292, s * 0.806],
            ],
            [
              [0.72, 0.273, s * 0.835],
              [0.72, 0.418, s * 0.720],
            ],
            [
              [0.52, 0.273, s * 0.840],
              [0.52, 0.519, s * 0.645],
            ],
            [
              [0.35, 0.278, s * 0.840],
              [0.35, 0.588, s * 0.588],
            ],
            [
              [0.00, 0.292, s * 0.835],
              [0.00, 0.592, s * 0.583],
            ],
            [
              [-0.26, 0.334, s * 0.814],
              [-0.26, 0.588, s * 0.572],
            ],
            [
              [-0.52, 0.456, s * 0.698],
              [-0.52, 0.574, s * 0.546],
            ],
          ];
          buildMultiSectionLoft(g, sideWinStations, darkTargaGlass, {
            closedRing: false,
            reverseWinding: s < 0,
          });

          // Sculpted 3D Fastback Flying Buttresses sweeping from the B-pillar arch (x=-0.50) to the rear deck haunches (x=-1.60)
          const buttressStations = [
            [
              [-0.50, 0.54, s * 0.40],
              [-0.50, 0.585, s * 0.50],
              [-0.50, 0.548, s * 0.58],
              [-0.50, 0.46, s * 0.63],
            ],
            [
              [-1.05, 0.45, s * 0.37],
              [-1.05, 0.49, s * 0.48],
              [-1.05, 0.455, s * 0.56],
              [-1.05, 0.38, s * 0.60],
            ],
            [
              [-1.60, 0.36, s * 0.34],
              [-1.60, 0.395, s * 0.45],
              [-1.60, 0.36, s * 0.53],
              [-1.60, 0.30, s * 0.57],
            ],
          ];
          buildMultiSectionLoft(g, buttressStations, liquidCherry, {
            closedRing: true,
            capEnds: true,
            reverseWinding: s < 0,
          });
          // Carbon aero channel blade underneath each flying buttress
          box(g, 1.08, 0.024, 0.065, satinCarbonTrim, [-1.05, 0.46, s * 0.46], [0, s * -0.06, 0.16]);

          // Signature Roadster thin laser-blade LED headlight strip at front fenders
          box(
            g,
            0.26,
            0.024,
            0.22,
            emissiveMat(0xf8fafc, 2.2),
            [1.76, 0.06, s * 0.64],
            [0, s * -0.32, -0.22],
          );
        }

        // Fastback sloped rear glass deck window nestled between the two flying buttresses
        const rearGlassStations = [
          [
            [-0.54, 0.56, -0.38],
            [-0.54, 0.57, 0],
            [-0.54, 0.56, 0.38],
          ],
          [
            [-1.05, 0.46, -0.35],
            [-1.05, 0.47, 0],
            [-1.05, 0.46, 0.35],
          ],
          [
            [-1.58, 0.37, -0.32],
            [-1.58, 0.38, 0],
            [-1.58, 0.37, 0.32],
          ],
        ];
        buildMultiSectionLoft(g, rearGlassStations, darkTargaGlass, { closedRing: false });
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
        rbox(g, 0.26, 0.032, 1.58, 0.012, satinCarbon, [-1.82, 0.36, 0], [0, 0, 0.18]);
        for (const z of [-0.46, 0.46]) {
          cyl(g, 0.018, 0.018, 0.14, 12, titanium, [-1.8, 0.28, z], [0, 0, -0.15]);
        }
        // Razor-thin full-width rear LED tail blade
        box(g, 0.04, 0.028, 1.6, emissiveMat(0xff1818, 2.2), [-1.95, 0.2, 0]);
      },
    },
    {
      id: 'roadster-centerlock-aero-wheels',
      name: '21"/22" Forged Aero-Blade Center-Lock Wheels & Cup 2 R Tires',
      category: 'Wheels & Tires',
      isOuter: false,
      explodeOffset: [0, -0.35, -1.95],
      desc: 'Ultra-wide forged gunmetal aero wheels with anodized crimson calipers and Michelin Pilot Sport Cup 2 R track tires.',
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
        sanitizeCadMaterials(g);
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
