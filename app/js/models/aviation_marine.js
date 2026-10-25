// CAD-Fidelity 3D Airplane & Submarine Models for Inside Out Studio:
// Airplanes: 1. Boeing 737 MAX 9  2. Airbus A350-1000  3. Lockheed F-22 Raptor Stealth Jet  4. Cessna 172 Skyhawk
// Submarines: 1. Virginia-Class SSN Nuclear Submarine  2. DSV Limiting Factor Deep-Sea Sub  3. Nautilus Panoramic Explorer Sub
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
  lathe,
  airlinerFuselageTexture,
  submarineHullTexture,
  buildHexBoltArray,
  buildWiringHarness,
  buildDetailedWheel,
} from '../materials.js';
import {
  addEngineCadSubassembly,
  addGearboxCadSubassembly,
} from '../cad_loader.js';

// ============================================================================
// SHARED AEROSPACE & NAVAL CAD SUB-ASSEMBLY BUILDERS
// ============================================================================

/**
 * Builds a high-bypass Turbofan Nacelle with:
 * - Sculpted aerodynamic cowling (`lathe`) + polished chrome heated intake lip (`torus`)
 * - Aerodynamic wing pylon with 6 titanium mounting bolts & fuel/FADEC lines
 * - Conical spinner with white spiral stripe + 18 twisted titanium/carbon fan blades (`driveAnim = 'fan'`)
 * - Bypass stator guide vanes + core turbine exhaust cone + optional sawtooth chevron nozzle
 */
function buildDetailedTurbofanPair(
  g,
  {
    x = 0.35,
    y = -0.34,
    zSpan = 1.08,
    radius = 0.27,
    length = 0.86,
    cowlMaterial,
    chevron = true,
  } = {},
) {
  const alu = brushedMetal(0xd8dee9);
  const darkTi = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.22 });
  const inconel = brushedMetal(0x94a3b8, { metalness: 0.92, roughness: 0.16 });
  const chrome = chromeMat();

  for (const side of [-1, 1]) {
    const z = side * zSpan;
    const xBack = x - length * 0.5;
    const xFront = x + length * 0.5;

    // 1. Sculpted barrel nacelle via LatheGeometry (tapered intake -> barrel -> tapered exhaust)
    lathe(
      g,
      [
        [xBack, radius * 0.78],
        [xBack + length * 0.22, radius * 0.95],
        [x, radius * 1.02],
        [xFront - length * 0.14, radius * 0.99],
        [xFront, radius * 0.89],
      ],
      32,
      cowlMaterial,
      [0, y, z],
    );

    // 2. Chrome heated anti-ice intake lip ring + dark acoustic inner liner
    torus(g, radius * 0.89, radius * 0.09, chrome, [xFront, y, z], [0, Math.PI / 2, 0]);
    cyl(g, radius * 0.84, radius * 0.82, length * 0.88, 28, darkTi, [x, y, z], [0, 0, Math.PI / 2]);

    // 3. Spinning 18-Blade Wide-Chord Fan Assembly + Conical Spinner (`driveAnim = 'fan'`)
    const fanGroup = new THREE.Group();
    fanGroup.position.set(xFront - 0.1, y, z);
    fanGroup.userData.driveAnim = 'fan';
    g.add(fanGroup);

    cone(fanGroup, radius * 0.28, 0.24, 24, darkTi, [0.08, 0, 0], [0, 0, -Math.PI / 2]);
    torus(fanGroup, radius * 0.14, 0.012, chrome, [0.1, 0, 0], [0, Math.PI / 2, 0]);
    const bladeCount = 18;
    for (let b = 0; b < bladeCount; b++) {
      const a = (b / bladeCount) * Math.PI * 2;
      const rMid = radius * 0.52;
      box(
        fanGroup,
        0.045,
        radius * 0.68,
        0.016,
        alu,
        [0, Math.sin(a) * rMid, Math.cos(a) * rMid],
        [a, 0.42, 0],
      );
      // Titanium leading-edge sheath on each fan blade
      box(
        fanGroup,
        0.012,
        radius * 0.68,
        0.018,
        chrome,
        [0.02, Math.sin(a) * rMid, Math.cos(a) * rMid],
        [a, 0.42, 0],
      );
    }

    // 4. Bypass Outlet Guide Vanes (OGVs) + Core Exhaust Nozzle & Central Plug Cone
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      box(
        g,
        0.06,
        radius * 0.65,
        0.012,
        inconel,
        [x - 0.06, y + Math.sin(a) * (radius * 0.5), z + Math.cos(a) * (radius * 0.5)],
        [a, 0, 0],
      );
    }
    cyl(
      g,
      radius * 0.58,
      radius * 0.44,
      0.26,
      chevron ? 14 : 24,
      inconel,
      [xBack - 0.08, y, z],
      [0, 0, Math.PI / 2],
    );
    cone(g, radius * 0.28, 0.34, 20, darkTi, [xBack - 0.22, y, z], [0, 0, Math.PI / 2]);

    // 5. Swept Aerodynamic Wing Pylon Strut + 6 Titanium Shear Bolts + FADEC Loom (tucked cleanly under wing leading edge)
    box(
      g,
      length * 0.68,
      0.11,
      0.058,
      alu,
      [x - 0.08, y + radius + 0.015, z],
      [0, 0, -0.1],
    );
    buildHexBoltArray(
      g,
      [
        [x + 0.12, y + radius + 0.045, z + side * 0.036],
        [x - 0.06, y + radius + 0.045, z + side * 0.036],
        [x - 0.24, y + radius + 0.045, z + side * 0.036],
      ],
      { radius: 0.009, height: 0.012, finish: 'gold', rot: [Math.PI / 2, 0, 0] },
    );
  }
}

/**
 * Builds a swept supercritical airfoil wing pair with:
 * - Sculpted wing-to-body belly fairing (`rbox`)
 * - Swept tapered airfoil wings (`extrudeProfile`) with upward dihedral
 * - Exposed internal front/rear wing spars & ribs visible when exploded
 * - 4 under-wing canoe flap-track fairings per wing
 * - Red (port) and Green (starboard) wingtip LED navigation strobes
 */
function buildSweptAirlinerWings(
  g,
  {
    span = 2.22,
    zStartAbs = 0.22,
    rootChord = 0.68,
    tipChord = 0.19,
    sweep = 0.64,
    yRoot = -0.05,
    thickness = 0.028,
    bevel = 0.007,
    bellyWidth = 0.54,
    bellyHeight = 0.11,
    wingMat,
    sparMat,
  } = {},
) {
  // Sculpted wing-to-body belly fairing + center wing box titanium bolts
  rbox(g, rootChord * 1.42, bellyHeight, bellyWidth, 0.04, wingMat, [-0.04, yRoot - 0.02, 0]);
  const rootBolts = [];
  for (let x = -0.32; x <= 0.24; x += 0.18) {
    rootBolts.push([x, yRoot + 0.03, bellyWidth * 0.46], [x, yRoot + 0.03, -bellyWidth * 0.46]);
  }
  buildHexBoltArray(g, rootBolts, { radius: 0.008, height: 0.01, finish: 'gold' });

  for (const side of [-1, 1]) {
    const zStart = side * zStartAbs;
    const zEnd = side * span;
    const wingGroup = new THREE.Group();
    wingGroup.rotation.x = side * -0.055; // realistic 6° upward dihedral
    g.add(wingGroup);

    const xLeadRoot = 0.34;
    const pts = [
      [xLeadRoot, zStart],
      [xLeadRoot - sweep, zEnd],
      [xLeadRoot - sweep - tipChord, zEnd],
      [xLeadRoot - rootChord, zStart],
    ];
    extrudeProfile(wingGroup, pts, thickness, wingMat, [0, yRoot, 0], [Math.PI / 2, 0, 0], bevel);

    // Internal Front & Rear Aluminum/Carbon I-Beam Wing Spars (completely inside airfoil thickness)
    const sparSpan = span - zStartAbs - 0.08;
    const zMid = side * (zStartAbs + sparSpan * 0.5);
    const sweepAngle = Math.atan2(sweep, span - zStartAbs);
    box(
      wingGroup,
      0.022,
      thickness * 0.82,
      sparSpan,
      sparMat,
      [xLeadRoot - sweep * 0.48 - 0.06, yRoot - thickness * 0.45, zMid],
      [0, side * -sweepAngle, 0],
    );
    box(
      wingGroup,
      0.018,
      thickness * 0.72,
      sparSpan * 0.92,
      sparMat,
      [xLeadRoot - sweep * 0.48 - 0.22, yRoot - thickness * 0.45, zMid],
      [0, side * -(sweepAngle * 0.86), 0],
    );

    // 4 Streamlined Flap-Track Canoe Fairings under trailing edge of each wing
    for (let f = 0; f < 4; f++) {
      const t = 0.24 + f * 0.19;
      const localChord = rootChord * (1 - t) + tipChord * t;
      const fx = xLeadRoot - t * sweep - localChord * 0.82;
      const fz = side * (zStartAbs + t * (span - zStartAbs));
      rbox(wingGroup, 0.24, 0.036, 0.032, 0.012, wingMat, [fx, yRoot - thickness - 0.016, fz]);
    }

    // Port (Red, Z > 0) and Starboard (Green, Z < 0) LED Wingtip Navigation Lights
    const navColor = side > 0 ? 0xef4444 : 0x22c55e;
    sphere(
      wingGroup,
      0.018,
      12,
      emissiveMat(navColor, 1.8),
      [xLeadRoot - sweep - 0.03, yRoot - thickness * 0.4, zEnd],
    );
  }
}

/**
 * Builds retractable tricycle landing gear scaled to true airliner proportions
 */
function buildAirlinerLandingGear(
  g,
  {
    noseX = 1.92,
    mainX = -0.14,
    mainZ = 0.34,
    bellyY = -0.16,
    groundY = -0.44,
    noseTireRadius = 0.064,
    mainTireRadius = 0.088,
    pairsPerBogie = 1,
  } = {},
) {
  const alu = brushedMetal(0xd8dee9);
  const chrome = chromeMat();
  const doorMat = carPaint(0xf8fafc);

  const noseAxleY = groundY + noseTireRadius;
  const mainAxleY = groundY + mainTireRadius;
  const strutLen = Math.max(0.14, bellyY - noseAxleY);

  // 1. Nose Landing Gear (oleo strut + chrome piston + torque scissors + twin wheels + taxi lights + bay doors)
  cyl(g, 0.026, 0.026, strutLen * 0.62, 14, alu, [noseX, bellyY - strutLen * 0.31, 0]);
  cyl(g, 0.02, 0.02, strutLen * 0.48, 14, chrome, [noseX, noseAxleY + strutLen * 0.24, 0]);
  box(g, 0.055, 0.016, 0.02, alu, [noseX - 0.03, noseAxleY + 0.08, 0], [0, 0, 0.45]);
  box(g, 0.055, 0.016, 0.02, alu, [noseX - 0.03, noseAxleY + 0.04, 0], [0, 0, -0.45]);
  for (const side of [-1, 1]) {
    buildDetailedWheel(g, [noseX, noseAxleY, side * 0.052], {
      tireRadius: noseTireRadius,
      tireWidth: 0.036,
      rimColor: 0xe2e8f0,
      caliperColor: 0x475569,
      spokes: 6,
      lugCount: 5,
      includeBrake: false,
      steerable: false,
    });
    // Open nose gear bay doors
    box(g, 0.24, 0.09, 0.014, doorMat, [noseX, bellyY - 0.03, side * 0.095], [side * 0.22, 0, 0]);
    sphere(g, 0.015, 10, emissiveMat(0xffffff, 1.8), [noseX + 0.03, bellyY - strutLen * 0.45, side * 0.026]);
  }

  // 2. Left & Right Main Landing Gear Bogies
  const mainStrutLen = Math.max(0.14, bellyY - mainAxleY);
  for (const side of [-1, 1]) {
    const gz = side * mainZ;
    cyl(g, 0.034, 0.034, mainStrutLen * 0.62, 16, alu, [mainX, bellyY - mainStrutLen * 0.31, gz]);
    cyl(g, 0.026, 0.026, mainStrutLen * 0.48, 16, chrome, [mainX, mainAxleY + mainStrutLen * 0.24, gz]);
    // Diagonal side brace strut
    cyl(g, 0.016, 0.016, mainStrutLen * 0.85, 10, alu, [mainX, bellyY - mainStrutLen * 0.35, gz * 0.74], [side * -0.58, 0, 0]);
    // Bogie beam for multi-axle main gear
    if (pairsPerBogie > 1) {
      rbox(g, pairsPerBogie * 0.145, 0.034, 0.048, 0.01, alu, [mainX, mainAxleY, gz]);
    }
    for (let p = 0; p < pairsPerBogie; p++) {
      const axX = mainX + (p - (pairsPerBogie - 1) * 0.5) * 0.155;
      for (const wSide of [-1, 1]) {
        buildDetailedWheel(g, [axX, mainAxleY, gz + wSide * 0.068], {
          tireRadius: mainTireRadius,
          tireWidth: 0.046,
          rimColor: 0xcbd5e1,
          caliperColor: 0x334155,
          spokes: 8,
          lugCount: 6,
          includeBrake: true,
          steerable: false,
        });
      }
    }
    // Outer main gear strut door
    box(g, 0.26, 0.14, 0.015, doorMat, [mainX, bellyY - 0.04, gz + side * 0.12], [side * 0.15, 0, 0]);
  }
}

// ============================================================================
// AIRPLANES (4 Iconic Aircraft — Lofted CAD Fuselages & Internal Framing)
// ============================================================================
function buildBoeing737Max() {
  const liveryMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: airlinerFuselageTexture('#0284c7', '#38bdf8', '#f8fafc'),
    metalness: 0.22,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
  });
  const liveryWhite = carPaint(0xf8fafc, { metalness: 0.25, roughness: 0.14 });
  const boeingBlue = carPaint(0x0284c7, { metalness: 0.45, roughness: 0.16 });
  const alu = brushedMetal(0xd1d5db);

  const parts = [
    {
      id: 'fuselage-hull',
      name: 'Lofted Pressurized Fuselage, 48 Side Windows & Boarding Doors',
      category: 'Airframe',
      isOuter: true,
      explodeOffset: [0, 1.45, 0],
      desc: 'True-scale narrowbody aluminum semi-monocoque fuselage (10.2:1 slenderness ratio) with 48 side passenger windows, port & starboard boarding doors, livery cheatlines, and 11 internal circumferential rib frames!',
      funFact: 'Every commercial airliner has a tiny "bleed hole" in the inner window pane so the outer pane takes the cabin pressure load!',
      build(g) {
        // Continuous true-scale narrowbody lofted fuselage (ends at forward cockpit bulkhead x = 1.66 so cockpit windshield is 100% unobstructed!)
        lathe(
          g,
          [
            [-2.56, 0.032],
            [-2.32, 0.095],
            [-1.95, 0.175],
            [-1.48, 0.238],
            [-1.05, 0.255],
            [1.25, 0.255],
            [1.66, 0.244],
          ],
          44,
          liveryMat,
          [0, 0.08, 0],
        );
        // 3D Recessed Port & Starboard Side Boarding Doors (L1/R1 Forward, L2/R2 Aft) + Overwing Exit Frames on the SIDES (never on the roof!)
        const doorFrameMat = brushedMetal(0x94a3b8);
        const doorSkinMat = carPaint(0xf1f5f9, { roughness: 0.16 });
        const winDark = mat(0x091326, { roughness: 0.1, metalness: 0.4 });
        for (const side of [-1, 1]) {
          for (const dx of [-1.22, 1.36]) {
            const dz = side * 0.248;
            rbox(g, 0.13, 0.21, 0.016, 0.015, doorFrameMat, [dx, 0.11, dz]);
            rbox(g, 0.108, 0.188, 0.018, 0.012, doorSkinMat, [dx, 0.11, dz + side * 0.002]);
            // Small viewing window & red emergency handle on the side door
            rbox(g, 0.034, 0.044, 0.02, 0.006, winDark, [dx, 0.155, dz + side * 0.003]);
            box(g, 0.032, 0.01, 0.022, mat(0xef4444), [dx + 0.015, 0.10, dz + side * 0.004]);
          }
          // Dual Overwing Emergency Exit hatches on port & starboard flanks
          for (const ex of [-0.08, 0.12]) {
            const ez = side * 0.252;
            rbox(g, 0.082, 0.135, 0.014, 0.01, doorFrameMat, [ex, 0.125, ez]);
            rbox(g, 0.032, 0.042, 0.018, 0.006, winDark, [ex, 0.145, ez + side * 0.002]);
          }
        }
        // 11 Internal Aluminum Circumferential Rib Frames revealed on Explode
        for (let x = -1.35; x <= 1.35; x += 0.27) {
          torus(g, 0.236, 0.01, alu, [x, 0.08, 0], [0, Math.PI / 2, 0]);
        }
        // Sleek Dorsal SATCOM Wi-Fi antenna fairing + red anti-collision beacon
        rbox(g, 0.34, 0.034, 0.095, 0.015, liveryWhite, [0.25, 0.345, 0]);
        sphere(g, 0.018, 12, emissiveMat(0xef4444, 1.8), [0.68, 0.35, 0]);
      },
    },
    {
      id: 'flight-deck-cockpit',
      name: '2-Pilot Flight Deck, 6-Pane V-Windshield & Hinged Weather Radar Nose',
      category: 'Avionics',
      isOuter: false,
      explodeOffset: [2.25, 0.45, 0],
      desc: 'Forward flight deck section with stepped windshield cab, 6-pane dark-tinted Boeing V-windshield with silver frames and wipers, pointed ogive weather radar radome, 2 pilot seats, yokes, and 4 MAX displays.',
      funFact: 'The Boeing 737 nose cone and 6-pane V-windshield geometry traces back to the Boeing 707 because its pointed V-visor slices through high-speed air with minimal cockpit noise!',
      build(g) {
        // Forward lower nose & flight deck fuselage section (x = 1.66 to 2.18) + pointed ogive radome (x = 2.18 to 2.62)
        lathe(
          g,
          [
            [1.66, 0.244],
            [1.82, 0.228],
            [1.98, 0.195],
            [2.16, 0.148],
          ],
          40,
          liveryWhite,
          [0, 0.065, 0],
        );
        // Pointed Boeing 737 ogive nose radome cone (x = 2.16 to 2.62) with black anti-glare/radome tip
        lathe(
          g,
          [
            [2.16, 0.148],
            [2.32, 0.108],
            [2.46, 0.064],
            [2.56, 0.025],
            [2.62, 0.004],
          ],
          36,
          liveryWhite,
          [0, 0.055, 0],
        );
        // Radome hinge seam ring at x = 2.16
        torus(g, 0.149, 0.005, brushedMetal(0x475569), [2.16, 0.058, 0], [0, Math.PI / 2, 0]);

        // Raised cockpit crown roof fairing blending into main fuselage crown (y = 0.324 at x = 1.66)
        rbox(g, 0.34, 0.095, 0.33, 0.04, liveryWhite, [1.80, 0.255, 0], [0, 0, -0.18]);

        // Iconic 6-Pane Boeing 737 V-Windshield Assembly sitting PROUD of the forward nose contour!
        const winGlass = mat(0x06101f, { metalness: 0.65, roughness: 0.06 });
        const winFrame = brushedMetal(0xcbd5e1);
        const blackTrim = mat(0x0f172a, { roughness: 0.25 });

        // Center windshield divider post (V-prow)
        box(g, 0.15, 0.016, 0.018, winFrame, [2.03, 0.22, 0], [0, 0, -0.58]);
        for (const side of [-1, 1]) {
          // Pane 1 (Front V-windshield main pane — angled back from center post)
          rbox(g, 0.155, 0.092, 0.125, 0.01, winFrame, [1.99, 0.215, side * 0.062], [side * 0.18, side * -0.42, -0.52]);
          rbox(g, 0.138, 0.076, 0.112, 0.008, winGlass, [1.995, 0.217, side * 0.064], [side * 0.18, side * -0.42, -0.52]);
          // Pane 2 (Middle sliding cockpit window)
          rbox(g, 0.145, 0.088, 0.032, 0.008, winFrame, [1.86, 0.222, side * 0.158], [0, side * -0.22, -0.12]);
          rbox(g, 0.128, 0.072, 0.034, 0.006, winGlass, [1.86, 0.222, side * 0.161], [0, side * -0.22, -0.12]);
          // Pane 3 (Aft cockpit trapezoidal cheek window with upward Boeing kink)
          rbox(g, 0.135, 0.082, 0.028, 0.008, winFrame, [1.73, 0.232, side * 0.192], [0, side * -0.12, 0.08]);
          rbox(g, 0.118, 0.066, 0.030, 0.006, winGlass, [1.73, 0.232, side * 0.195], [0, side * -0.12, 0.08]);
          // Twin aerodynamic windshield wipers at base of Pane 1
          box(g, 0.09, 0.008, 0.008, blackTrim, [2.04, 0.182, side * 0.055], [0, side * -0.38, -0.45]);
          // Pitot-static & AOA sensor probes on lower nose cheeks
          cyl(g, 0.004, 0.004, 0.055, 8, alu, [2.08, 0.05, side * 0.175], [0, 0, Math.PI / 2]);
        }

        // Internal flat-plate Doppler weather radar dish on gimbal inside radome
        cyl(g, 0.105, 0.105, 0.025, 24, brushedMetal(0xd4af37), [2.22, 0.06, 0], [0, 0, Math.PI / 2]);
        // 2 Pilot Seats + Control Yokes + 4 Glowing MAX 15-inch Displays
        rbox(g, 0.1, 0.085, 0.24, 0.01, screenMat('dashboard'), [1.92, 0.13, 0], [0, 0, -0.25]);
        for (const z of [-0.075, 0.075]) {
          rbox(g, 0.11, 0.13, 0.09, 0.012, mat(0x1e293b), [1.76, 0.08, z]);
          torus(g, 0.032, 0.006, mat(0x0f172a), [1.85, 0.11, z], [0, Math.PI / 2, 0]);
        }
        buildHexBoltArray(
          g,
          [
            [2.16, 0.15, 0.10],
            [2.16, 0.15, -0.10],
            [2.16, -0.02, 0.10],
            [2.16, -0.02, -0.10],
          ],
          { radius: 0.006, height: 0.008, finish: 'chrome', rot: [0, 0, Math.PI / 2] },
        );
      },
    },
    {
      id: 'passenger-cabin-seats',
      name: 'Sky Interior 12-Row Passenger Cabin, Galleys & Overhead Bins',
      category: 'Cabin Interior',
      isOuter: false,
      explodeOffset: [0, 0.72, -1.65],
      desc: 'Aluminum floor beams supporting 14 rows of 3+3 economy and first-class seats, forward/aft galleys, and sculpted Boeing Sky Interior pivot bins.',
      funFact: 'Every passenger seat and floor track is engineered and crash-tested to withstand 16 Gs of deceleration force!',
      build(g) {
        box(g, 2.85, 0.024, 0.42, alu, [-0.05, 0.02, 0]);
        const seatBlue = mat(0x1d4ed8, { roughness: 0.45 });
        const firstClass = mat(0x0f172a, { roughness: 0.38 });
        for (let r = 0; r < 14; r++) {
          const x = -1.35 + r * 0.21;
          const isFirst = r >= 11;
          for (const z of [-0.125, 0.125]) {
            rbox(g, 0.065, 0.11, 0.135, 0.012, isFirst ? firstClass : seatBlue, [x, 0.085, z]);
            rbox(g, 0.085, 0.025, 0.135, 0.008, isFirst ? firstClass : seatBlue, [x + 0.02, 0.04, z]);
          }
        }
        // Overhead Pivot Bins along port & starboard cabin crown (strictly inside r = 0.255)
        for (const side of [-1, 1]) {
          rbox(g, 2.65, 0.045, 0.085, 0.014, liveryWhite, [-0.05, 0.22, side * 0.135]);
        }
      },
    },
    {
      id: 'swept-wings-spars',
      name: 'Supercritical Swept Wings, Wing-Box Spars & Flap Fairings',
      category: 'Aerodynamics',
      isOuter: false,
      explodeOffset: [0, -0.55, 1.95],
      desc: 'Tapered 25-degree swept supercritical airfoil wings (35.9 m wingspan scale) with aluminum I-beam spars, wing-to-body belly fairing, and 8 aerodynamic flap-track canoes.',
      funFact: 'Boeing wings are so strong and flexible they can bend upward almost 12 feet in severe turbulence without cracking!',
      build(g) {
        buildSweptAirlinerWings(g, {
          span: 2.22,
          zStartAbs: 0.22,
          rootChord: 0.68,
          tipChord: 0.18,
          sweep: 0.64,
          yRoot: -0.05,
          thickness: 0.028,
          bevel: 0.007,
          bellyWidth: 0.52,
          bellyHeight: 0.11,
          wingMat: liveryWhite,
          sparMat: alu,
        });
      },
    },
    {
      id: 'split-scimitar-winglets',
      name: 'AT Split-Scimitar Dual Winglets & Strobe Lights',
      category: 'Fuel Efficiency',
      isOuter: false,
      explodeOffset: [-0.65, 0.55, 2.45],
      desc: 'Signature 737 MAX Advanced Technology (AT) dual-feather wingtips with a swept upward raked blade AND a ventral scimitar strake that slice wingtip vortices.',
      funFact: 'You can spot a Boeing 737 MAX from the ground by its split V-shaped wingtips, which save 1.8% more jet fuel on every flight!',
      build(g) {
        for (const side of [-1, 1]) {
          const zTip = side * 2.21;
          const yTip = 0.05; // matches 6° dihedral rise at z = 2.22
          // Upper raked AT winglet fin + lower ventral scimitar strake
          box(g, 0.22, 0.28, 0.018, boeingBlue, [-0.41, yTip + 0.12, zTip], [side * -0.22, side * -0.18, -0.28]);
          box(g, 0.16, 0.14, 0.015, boeingBlue, [-0.42, yTip - 0.07, zTip - side * 0.01], [side * 0.38, side * -0.18, 0.35]);
        }
      },
    },
    {
      id: 'wing-fuel-tanks',
      name: 'Integral Wing Fuel Bladder Cells & Boost Pumps (6,800 Gal)',
      category: 'Fuel System',
      isOuter: false,
      explodeOffset: [0, -1.15, -1.65],
      desc: 'Three baffled Jet-A fuel tanks inside the wings and center wing box plumbed with braided crossfeed manifolds and boost pumps.',
      funFact: 'Storing heavy fuel inside the wings counteracts upward aerodynamic lift and reduces bending stress on the wing roots!',
      build(g) {
        const fuelMat = mat(0xf59e0b, { opacity: 0.86, roughness: 0.2 });
        rbox(g, 0.42, 0.065, 0.44, 0.015, fuelMat, [-0.04, -0.08, 0]);
        for (const side of [-1, 1]) {
          const wg = new THREE.Group();
          wg.rotation.x = side * -0.055;
          g.add(wg);
          rbox(wg, 0.22, 0.018, 1.38, 0.006, fuelMat, [-0.06, -0.062, side * 1.02], [0, side * -0.31, 0]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-0.08, -0.08, -1.05],
              [-0.04, -0.1, 0],
              [-0.08, -0.08, 1.05],
            ],
            radius: 0.009,
            color: 0xe2e8f0,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'leap-1b-turbofans',
      name: 'Twin CFM LEAP-1B Turbofans (18 Spinning Fan Blades & Chevrons)',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [0.95, -1.35, 1.45],
      desc: 'Forward-slung high-bypass nacelles with 69-inch 3D-woven carbon fan blades (`Take It for a Flight!`), chrome anti-ice inlet lips, stator vanes, and sawtooth acoustic chevrons.',
      funFact: 'Look closely at the back of a 737 MAX engine: the wavy zig-zag "chevrons" mix hot exhaust and cold air quietly to hush cabin noise!',
      build(g) {
        buildDetailedTurbofanPair(g, {
          x: 0.34,
          y: -0.17,
          zSpan: 0.68,
          radius: 0.148,
          length: 0.54,
          cowlMaterial: boeingBlue,
          chevron: true,
        });
      },
    },
    {
      id: 'flaps-slats-spoilers',
      name: 'Double-Slotted Fowler Flaps, Leading-Edge Slats & Spoilers',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-1.15, -0.35, -1.85],
      desc: 'Hydraulic trailing-edge Fowler flaps, leading-edge Krueger/variable-camber slats, and pop-up flight spoilers.',
      funFact: 'The second the wheels touch the runway, flat spoiler boards pop straight up on top of the wings to push Weight-On-Wheels onto the brakes!',
      build(g) {
        const flapMat = carPaint(0xe11d48);
        for (const side of [-1, 1]) {
          const wg = new THREE.Group();
          wg.rotation.x = side * -0.055;
          g.add(wg);
          // Trailing-edge Fowler flaps aligned with wing trailing edge
          box(wg, 0.11, 0.016, 1.45, flapMat, [-0.28, -0.062, side * 1.08], [0, side * -0.24, 0]);
          // Leading-edge slats aligned with wing leading edge
          box(wg, 0.055, 0.014, 1.38, alu, [0.06, -0.058, side * 1.12], [0, side * -0.31, 0]);
        }
      },
    },
    {
      id: 'tail-empennage-apu',
      name: 'Swept Vertical Fin, Dorsal Fillet, Elevators & Tailcone APU Turbine',
      category: 'Flight Controls & Power',
      isOuter: false,
      explodeOffset: [-2.25, 0.95, 0],
      desc: 'Signature Boeing 737 swept vertical tail fin with long forward dorsal fillet, hinged rudder, trimmable horizontal stabilizers, and tailcone Auxiliary Power Unit (APU) gas turbine.',
      funFact: 'That little exhaust hole at the very tip of the tail is the APU—a baby jet turbine that runs cabin AC and starts the main engines!',
      build(g) {
        // Signature Boeing 737 dorsal fillet + swept vertical stabilizer
        const finPts = [
          [-1.18, 0.24],
          [-1.72, 0.34],
          [-2.28, 1.02],
          [-2.54, 1.02],
          [-2.42, 0.14],
        ];
        extrudeProfile(g, finPts, 0.038, boeingBlue, [0, 0, -0.019], [0, 0, 0], 0.009);
        // Swept horizontal stabilizers & elevators
        for (const side of [-1, 1]) {
          const hPts = [
            [-2.02, side * 0.12],
            [-2.38, side * 0.84],
            [-2.54, side * 0.84],
            [-2.42, side * 0.12],
          ];
          extrudeProfile(g, hPts, 0.024, liveryWhite, [0, 0.14, 0], [Math.PI / 2, 0, 0], 0.006);
        }
        // Internal Honeywell 131-9B APU gas turbine & tailpipe nozzle inside tailcone
        cyl(g, 0.065, 0.052, 0.32, 18, alu, [-2.34, 0.08, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.032, 0.032, 0.12, 16, chromeMat(), [-2.56, 0.08, 0], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'tricycle-landing-gear',
      name: 'Retractable Oleo-Strut Nose & Main Landing Gear',
      category: 'Landing Gear',
      isOuter: false,
      explodeOffset: [0, -1.65, 0],
      desc: 'Extended MAX 9 shock-absorbing nitrogen/oil oleo struts, telescoping tail-skid cartridge, torque scissor links, multi-disc carbon brakes, and radial tires.',
      funFact: '737 main wheels don’t even have outer doors covering their hubs in flight—aerodynamic rubber seals around the tires form a flush belly!',
      build(g) {
        buildAirlinerLandingGear(g, {
          noseX: 1.92,
          mainX: -0.14,
          mainZ: 0.34,
          bellyY: -0.15,
          groundY: -0.44,
          noseTireRadius: 0.062,
          mainTireRadius: 0.086,
          pairsPerBogie: 1,
        });
      },
    },
    {
      id: 'cargo-belly-hold',
      name: 'Lower Belly Baggage Hold & Roller Floor System',
      category: 'Cargo',
      isOuter: false,
      explodeOffset: [0.25, -1.25, 0],
      desc: 'Forward and aft pressurized lower cargo bays with ball-mat roller tracks and 6 contoured luggage containers.',
      funFact: 'Ball-bearing roller mats in the belly floor let baggage handlers glide heavy luggage stacks all the way to the back with one hand!',
      build(g) {
        box(g, 2.35, 0.02, 0.34, alu, [0, -0.12, 0]);
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          rbox(g, 0.36, 0.11, 0.3, 0.018, alu, [i * 0.46, -0.055, 0]);
        }
      },
    },
  ];

  return {
    id: 'boeing-737-max',
    name: 'Boeing 737 MAX 9',
    brand: 'Boeing',
    badge: 'Mach 0.79 • CFM LEAP-1B',
    desc: 'True-scale narrowbody airliner (42.2 m length, 35.9 m wingspan) with a slender 48-window fuselage, conformal 6-pane Boeing V-cockpit, AT split-scimitar winglets, and 18-blade spinning LEAP-1B turbofans.',
    cameraPos: [4.2, 2.1, 4.2],
    parts,
    quiz: [
      {
        q: 'Which distinctive double-bladed wingtip part helps you recognize a Boeing 737 MAX and saves fuel?',
        correctId: 'split-scimitar-winglets',
        distractors: ['flight-deck-cockpit', 'tricycle-landing-gear', 'cargo-belly-hold'],
      },
      {
        q: 'Why do the CFM LEAP-1B engines on the 737 MAX have wavy zig-zag "chevrons" on the back of their nacelles?',
        correctId: 'leap-1b-turbofans',
        distractors: ['passenger-cabin-seats', 'wing-fuel-tanks', 'fuselage-hull'],
      },
      {
        q: 'Where does an airliner store thousands of gallons of Jet-A fuel so the wings don’t bend too far upward?',
        correctId: 'wing-fuel-tanks',
        distractors: ['tail-empennage-apu', 'flaps-slats-spoilers', 'flight-deck-cockpit'],
      },
      {
        q: 'What is hidden inside the nose cone right in front of the pilots to spot thunderstorms ahead?',
        correctId: 'flight-deck-cockpit',
        distractors: ['cargo-belly-hold', 'tricycle-landing-gear', 'swept-wings-spars'],
      },
      {
        q: 'Which part at the very back of the airplane contains a miniature turbine engine (APU) to make power at the airport gate?',
        correctId: 'tail-empennage-apu',
        distractors: ['split-scimitar-winglets', 'leap-1b-turbofans', 'passenger-cabin-seats'],
      },
    ],
  };
}

function buildAirbusA350() {
  const liveryMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: airlinerFuselageTexture('#0d9488', '#2dd4bf', '#ffffff'),
    metalness: 0.22,
    roughness: 0.14,
    clearcoat: 0.92,
    clearcoatRoughness: 0.05,
  });
  const airbusWhite = carPaint(0xffffff, { metalness: 0.22, roughness: 0.12 });
  const airbusTeal = carPaint(0x0d9488, { metalness: 0.45, roughness: 0.16 });
  const carbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xd1d5db);

  const parts = [
    {
      id: 'carbon-xwb-fuselage',
      name: 'Lofted Extra-Widebody Carbon-Fiber Fuselage (XWB) & Side Doors',
      category: 'Airframe',
      isOuter: true,
      explodeOffset: [0, 1.48, 0],
      desc: '53% carbon-fiber widebody fuselage lofted from nose to tail with 48 side windows, 8 port & starboard Type-A boarding doors, and 10 internal carbon circumferential frames.',
      funFact: 'Because carbon fiber never corrodes, the A350 cabin maintains 20% humidity and a 6,000-foot cabin altitude so passengers arrive refreshed!',
      build(g) {
        lathe(
          g,
          [
            [-2.62, 0.04],
            [-2.32, 0.12],
            [-1.88, 0.23],
            [-1.42, 0.31],
            [-0.85, 0.325],
            [1.25, 0.325],
            [1.68, 0.312],
          ],
          44,
          liveryMat,
          [0, 0.1, 0],
        );
        // 4 Pairs of 3D Recessed Type-A Side Boarding Doors on Port & Starboard Flanks (z = ±0.318)
        const doorFrameMat = brushedMetal(0x94a3b8);
        const doorSkinMat = carPaint(0xf8fafc, { roughness: 0.14 });
        const winDark = mat(0x091326, { roughness: 0.08, metalness: 0.5 });
        for (const side of [-1, 1]) {
          for (const dx of [-1.28, -0.35, 0.42, 1.38]) {
            const dz = side * 0.316;
            rbox(g, 0.14, 0.23, 0.018, 0.016, doorFrameMat, [dx, 0.135, dz]);
            rbox(g, 0.118, 0.205, 0.020, 0.012, doorSkinMat, [dx, 0.135, dz + side * 0.002]);
            rbox(g, 0.036, 0.048, 0.022, 0.007, winDark, [dx, 0.185, dz + side * 0.003]);
            box(g, 0.034, 0.01, 0.024, mat(0xef4444), [dx + 0.016, 0.125, dz + side * 0.004]);
          }
        }
        for (let x = -1.35; x <= 1.35; x += 0.3) {
          torus(g, 0.305, 0.014, carbon, [x, 0.1, 0], [0, Math.PI / 2, 0]);
        }
        rbox(g, 0.38, 0.042, 0.12, 0.018, airbusWhite, [0.3, 0.44, 0]);
      },
    },
    {
      id: 'raccoon-mask-cockpit',
      name: '"Raccoon Mask" Curved 6-Pane Cockpit, Sidesticks & Radar Radome',
      category: 'Avionics',
      isOuter: false,
      explodeOffset: [2.35, 0.45, 0],
      desc: 'Streamlined Airbus A350 nose section with signature gloss-black "Raccoon Mask" surround, 6 curved panoramic cockpit windows, 6 large LCD displays, fly-by-wire sidesticks, and weather radar dish.',
      funFact: 'Instead of a big steering yoke between the pilot’s knees, Airbus pilots fly with a side joystick—leaving room for a pull-out laptop table!',
      build(g) {
        // Forward cockpit lower fuselage & streamlined A350 nose cone (x = 1.68 to 2.68)
        lathe(
          g,
          [
            [1.68, 0.312],
            [1.86, 0.288],
            [2.06, 0.242],
            [2.24, 0.182],
          ],
          40,
          airbusWhite,
          [0, 0.085, 0],
        );
        lathe(
          g,
          [
            [2.24, 0.182],
            [2.4, 0.132],
            [2.54, 0.074],
            [2.64, 0.025],
            [2.68, 0.004],
          ],
          36,
          airbusWhite,
          [0, 0.072, 0],
        );
        // Upper cockpit crown fairing blending into XWB fuselage roof
        rbox(g, 0.42, 0.115, 0.42, 0.05, airbusWhite, [1.84, 0.32, 0], [0, 0, -0.18]);

        // Iconic Airbus A350 Gloss-Black "Bandit / Raccoon Mask" + 6 Curved Panoramic Windshield Panes sitting PROUD of the nose!
        const maskBlack = mat(0x090d16, { roughness: 0.10, metalness: 0.25 });
        const glassPane = mat(0x0c192c, { metalness: 0.72, roughness: 0.05 });
        const mullion = mat(0x1e293b, { roughness: 0.2 });

        // Center windshield pillar & front wraparound mask bridge
        rbox(g, 0.16, 0.105, 0.28, 0.022, maskBlack, [2.06, 0.265, 0], [0, 0, -0.46]);
        box(g, 0.165, 0.018, 0.022, mullion, [2.09, 0.272, 0], [0, 0, -0.46]);
        for (const side of [-1, 1]) {
          // Outer black raccoon mask surround wrapping back along cockpit cheeks
          rbox(g, 0.38, 0.115, 0.065, 0.024, maskBlack, [1.91, 0.268, side * 0.205], [side * 0.18, side * -0.26, -0.14]);
          // Front curved windshield pane
          rbox(g, 0.145, 0.082, 0.115, 0.012, glassPane, [2.075, 0.268, side * 0.068], [side * 0.16, side * -0.38, -0.46]);
          // Middle cockpit window pane
          rbox(g, 0.155, 0.082, 0.042, 0.01, glassPane, [1.93, 0.268, side * 0.198], [0, side * -0.24, -0.14]);
          // Aft cockpit window pane
          rbox(g, 0.14, 0.078, 0.038, 0.01, glassPane, [1.77, 0.272, side * 0.245], [0, side * -0.12, -0.04]);
          // Windshield wipers
          box(g, 0.095, 0.008, 0.009, mullion, [2.11, 0.232, side * 0.058], [0, side * -0.35, -0.42]);
        }

        cyl(g, 0.135, 0.135, 0.03, 24, brushedMetal(0xd4af37), [2.3, 0.08, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.11, 0.095, 0.28, 0.012, screenMat('ios'), [1.96, 0.16, 0], [0, 0, -0.22]);
        for (const z of [-0.095, 0.095]) {
          rbox(g, 0.13, 0.16, 0.11, 0.015, mat(0x1e293b), [1.78, 0.1, z]);
        }
      },
    },
    {
      id: 'twin-aisle-cabin',
      name: 'Twin-Aisle 9-Abreast Cabin, Business Suites & Crew Rest Bunks',
      category: 'Cabin Interior',
      isOuter: false,
      explodeOffset: [0, 0.72, -1.75],
      desc: 'Wide twin-aisle carbon floor beams with 3-3-3 economy seating, lie-flat business pods, and overhead crew rest bunks in the crown.',
      funFact: 'On ultra-long 19-hour flights, off-duty pilots and flight attendants climb a hidden staircase into soundproof bunk beds above the ceiling!',
      build(g) {
        box(g, 3.0, 0.028, 0.54, carbon, [-0.05, 0.03, 0]);
        for (let r = 0; r < 12; r++) {
          const x = -1.35 + r * 0.24;
          for (const z of [-0.18, 0, 0.18]) {
            rbox(g, 0.075, 0.12, 0.12, 0.014, airbusTeal, [x, 0.1, z]);
          }
        }
        for (const side of [-1, 1]) {
          rbox(g, 2.75, 0.055, 0.1, 0.018, airbusWhite, [-0.05, 0.28, side * 0.175]);
        }
      },
    },
    {
      id: 'morphing-carbon-wings',
      name: 'Aero-Elastic Carbon Wings, Spars & Curved Sharklets',
      category: 'Aerodynamics',
      isOuter: false,
      explodeOffset: [0, -0.5, 2.05],
      desc: '105-foot carbon-fiber wings with internal carbon spars, flap-track fairings, and graceful upward-curving Sharklet wingtips.',
      funFact: 'Each single carbon wing skin is 105 feet long—the largest single-piece carbon-fiber structures ever manufactured in aviation!',
      build(g) {
        buildSweptAirlinerWings(g, {
          span: 2.54,
          zStartAbs: 0.28,
          rootChord: 0.82,
          tipChord: 0.22,
          sweep: 0.74,
          yRoot: -0.05,
          thickness: 0.034,
          bevel: 0.008,
          bellyWidth: 0.64,
          bellyHeight: 0.13,
          wingMat: airbusWhite,
          sparMat: carbon,
        });
        for (const side of [-1, 1]) {
          // Smoothly blended curved A350 Sharklet wingtip
          tube(
            g,
            [
              [-0.44, 0.05, side * 2.48],
              [-0.56, 0.18, side * 2.56],
              [-0.68, 0.38, side * 2.6],
            ],
            0.032,
            airbusTeal,
          );
        }
      },
    },
    {
      id: 'trent-xwb-engines',
      name: 'Rolls-Royce Trent XWB-97 Turbofans (97,000 lbf • Spinning Fan)',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [0.95, -1.4, 1.55],
      desc: 'Massive 118-inch diameter 3-shaft turbofan engines with 18 spinning fan blades, chrome inlet rings, and stator vanes.',
      funFact: 'The intake of a single Rolls-Royce Trent XWB engine is 10 feet across—wide enough for a Boeing 737 cabin to fit inside!',
      build(g) {
        buildDetailedTurbofanPair(g, {
          x: 0.36,
          y: -0.21,
          zSpan: 0.82,
          radius: 0.195,
          length: 0.66,
          cowlMaterial: airbusTeal,
          chevron: false,
        });
      },
    },
    {
      id: 'six-wheel-bogie-gear',
      name: '6-Wheel Triple-Axle Main Landing Gear Bogies (A350-1000)',
      category: 'Landing Gear',
      isOuter: false,
      explodeOffset: [0, -1.75, 0],
      desc: 'Two 6-wheel main gear trucks (12 main tires + 2 nose tires) with oleo struts, hydraulic brake manifolds, and open gear doors.',
      funFact: 'You can tell the stretched A350-1000 apart from the smaller A350-900 by counting 3 pairs of wheels on each main gear truck!',
      build(g) {
        buildAirlinerLandingGear(g, {
          noseX: 2.02,
          mainX: -0.16,
          mainZ: 0.42,
          bellyY: -0.18,
          groundY: -0.48,
          noseTireRadius: 0.068,
          mainTireRadius: 0.092,
          pairsPerBogie: 3,
        });
      },
    },
    {
      id: 'center-wing-fuel',
      name: '3-Tank 41,000-Gallon Ultra-Long-Range Fuel System',
      category: 'Fuel System',
      isOuter: false,
      explodeOffset: [0, -1.1, -1.75],
      desc: 'Stores enough jet fuel inside the wings and center box to fly 9,700 miles nonstop—nearly halfway around Earth!',
      funFact: 'On ultra-long-range flights, computers pump fuel slightly backward to trim the plane’s center of gravity and cut drag!',
      build(g) {
        const fuel = mat(0xf59e0b, { opacity: 0.85 });
        rbox(g, 0.5, 0.08, 0.54, 0.015, fuel, [-0.06, -0.09, 0]);
        for (const side of [-1, 1]) {
          const wg = new THREE.Group();
          wg.rotation.x = side * -0.055;
          g.add(wg);
          rbox(wg, 0.26, 0.02, 1.58, 0.008, fuel, [-0.1, -0.065, side * 1.18], [0, side * -0.32, 0]);
        }
      },
    },
    {
      id: 'adaptive-dropped-hinge-flaps',
      name: 'Adaptive Dropped-Hinge Flaps & Differential Ailerons',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-1.15, -0.4, -1.9],
      desc: 'Computer-controlled trailing-edge flaps that droop slightly even at cruise speed to optimize wing camber as fuel burns off.',
      funFact: 'The flight computers make tiny 2-degree adjustments to the flaps every few minutes so the wing stays at peak efficiency!',
      build(g) {
        for (const side of [-1, 1]) {
          const wg = new THREE.Group();
          wg.rotation.x = side * -0.055;
          g.add(wg);
          box(wg, 0.13, 0.018, 1.65, carPaint(0xe11d48), [-0.34, -0.065, side * 1.22], [0, side * -0.25, 0]);
        }
      },
    },
    {
      id: 'uld-cargo-containers',
      name: 'LD3 Aluminum Unit Load Device (ULD) Cargo Containers',
      category: 'Cargo',
      isOuter: false,
      explodeOffset: [0.25, -1.3, 0],
      desc: 'Pre-packed angled aluminum containers that roll into the widebody lower deck on motorized rollers.',
      funFact: 'Instead of loading bags one by one, widebody jets swallow whole pre-packed aluminum rooms of luggage and air freight!',
      build(g) {
        box(g, 2.55, 0.022, 0.44, alu, [0, -0.14, 0]);
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          rbox(g, 0.38, 0.13, 0.4, 0.02, alu, [i * 0.48, -0.065, 0]);
        }
      },
    },
    {
      id: 'carbon-empennage',
      name: 'Swept Carbon Tail Fin, HD Tail Camera & Stabilizers',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-2.35, 0.95, 0],
      desc: 'Towering carbon vertical stabilizer with a top-mounted HD camera pod so pilots and passengers can watch a live external view!',
      funFact: 'The HD camera mounted near the top of the tail fin lets pilots steer the 242-foot-long jet around tight airport taxiways!',
      build(g) {
        const finPts = [
          [-1.42, 0.32],
          [-2.28, 1.18],
          [-2.58, 1.18],
          [-2.46, 0.16],
        ];
        extrudeProfile(g, finPts, 0.044, airbusTeal, [0, 0, -0.022], [0, 0, 0], 0.01);
        // Top-of-tail HD camera pod
        rbox(g, 0.14, 0.036, 0.044, 0.014, airbusWhite, [-2.22, 1.2, 0]);
        for (const side of [-1, 1]) {
          const hPts = [
            [-2.06, side * 0.15],
            [-2.44, side * 0.96],
            [-2.6, side * 0.96],
            [-2.48, side * 0.15],
          ];
          extrudeProfile(g, hPts, 0.026, airbusWhite, [0, 0.16, 0], [Math.PI / 2, 0, 0], 0.007);
        }
      },
    },
  ];

  return {
    id: 'airbus-a350',
    name: 'Airbus A350-1000 XWB',
    brand: 'Airbus',
    badge: 'Mach 0.85 • Carbon Widebody',
    desc: 'Ultra-long-range widebody airliner crafted from 53% carbon fiber with lofted fuselage, "raccoon mask" cockpit, Sharklets, and 6-wheel bogies.',
    cameraPos: [4.4, 2.5, 4.5],
    parts,
    quiz: [
      {
        q: 'Why is the Airbus A350-1000 fuselage lighter and able to hold higher cabin humidity than older metal jets?',
        correctId: 'carbon-xwb-fuselage',
        distractors: ['six-wheel-bogie-gear', 'uld-cargo-containers', 'trent-xwb-engines'],
      },
      {
        q: 'What nickname do aviation fans give the black-framed wraparound cockpit windows on the Airbus A350?',
        correctId: 'raccoon-mask-cockpit',
        distractors: ['carbon-empennage', 'twin-aisle-cabin', 'center-wing-fuel'],
      },
      {
        q: 'How many wheels are on each main landing gear truck of the stretched Airbus A350-1000?',
        correctId: 'six-wheel-bogie-gear',
        distractors: ['morphing-carbon-wings', 'adaptive-dropped-hinge-flaps', 'raccoon-mask-cockpit'],
      },
      {
        q: 'Where is the external HD camera mounted that lets passengers watch the flight live on their seatback screens?',
        correctId: 'carbon-empennage',
        distractors: ['uld-cargo-containers', 'center-wing-fuel', 'twin-aisle-cabin'],
      },
      {
        q: 'Which gigantic Rolls-Royce parts under the wings have intakes as wide as an entire Boeing 737 cabin?',
        correctId: 'trent-xwb-engines',
        distractors: ['six-wheel-bogie-gear', 'raccoon-mask-cockpit', 'adaptive-dropped-hinge-flaps'],
      },
    ],
  };
}

function buildF22RaptorStealth() {
  const stealthGrey = brushedMetal(0x64748b, { metalness: 0.62, roughness: 0.34 });
  const stealthEdge = brushedMetal(0x94a3b8, { metalness: 0.55, roughness: 0.28 });
  const stealthDark = mat(0x1e293b, { metalness: 0.48, roughness: 0.38 });
  const goldCanopy = glassMat(0xfbbf24, 0.46);
  const tiBulkhead = brushedMetal(0x94a3b8, { metalness: 0.85, roughness: 0.24 });

  const parts = [
    {
      id: 'stealth-chined-fuselage',
      name: 'Chined Stealth Airframe, Caret S-Duct Intakes & Blended Twin Engine Nacelles',
      category: 'Stealth Airframe',
      isOuter: true,
      explodeOffset: [0, 1.35, 0],
      desc: 'Planform-aligned diamond-chined radar-absorbent fuselage with swept Caret supersonic intakes, serpentine S-duct tunnels, blended twin F119 engine tunnels, and 6 forged Ti-6Al-4V wing-carry-through bulkheads.',
      funFact: 'On radar screens, a 62-foot F-22 Raptor has the radar cross-section of a tiny metal marble!',
      build(g) {
        // 1. Sculpted dorsal/ventral central fuselage spine (lofted multi-station profile)
        const spineSideProfile = [
          [-1.82, -0.02],
          [-1.62, 0.14],
          [-0.55, 0.24],
          [0.25, 0.27],
          [0.95, 0.23],
          [1.48, 0.12],
          [1.48, -0.10],
          [0.85, -0.14],
          [-1.58, -0.12],
        ];
        extrudeProfile(g, spineSideProfile, 0.54, stealthGrey, [0, 0, 0], [0, 0, 0], 0.04);

        // 2. Full-length horizontal knife-edge stealth chine & LERX strake planform (XZ plane)
        const chinePlanform = [
          [-1.78, -0.44],
          [-1.52, -0.56],
          [-0.25, -0.68],
          [0.62, -0.66],
          [1.12, -0.48],
          [1.48, -0.32],
          [1.48, 0.32],
          [1.12, 0.48],
          [0.62, 0.66],
          [-0.25, 0.68],
          [-1.52, 0.56],
          [-1.78, 0.44],
        ];
        extrudeProfile(g, chinePlanform, 0.065, stealthGrey, [0, 0.04, 0], [Math.PI / 2, 0, 0], 0.018);
        // Lighter radar-absorbent RAM edge tape along the outer chine perimeter
        const ramEdgePlanform = chinePlanform.map(([x, z]) => [x * 1.003, z * 1.018]);
        extrudeProfile(g, ramEdgePlanform, 0.024, stealthEdge, [0, 0.028, 0], [Math.PI / 2, 0, 0], 0.006);

        // 3. Blended Twin Dorsal F119 Engine Nacelles & Beaver-Tail Sting
        for (const side of [-1, 1]) {
          lathe(
            g,
            [
              [-1.68, 0.14],
              [-1.25, 0.19],
              [-0.45, 0.21],
              [0.35, 0.18],
              [0.72, 0.11],
            ],
            20,
            stealthGrey,
            [0, 0.06, side * 0.24],
            undefined,
            [0.72, 1, 1.05],
          );
        }
        // Central aft beaver-tail boom between the vectoring nozzles
        const beaverPts = [
          [-1.45, -0.09],
          [-1.96, -0.04],
          [-1.96, 0.04],
          [-1.45, 0.09],
        ];
        extrudeProfile(g, beaverPts, 0.06, stealthEdge, [0, 0.03, 0], [Math.PI / 2, 0, 0], 0.01);

        // 4. Angled Caret Supersonic Intakes + Boundary-Layer Splitter + Serpentine S-Duct Tunnels
        for (const side of [-1, 1]) {
          const z = side * 0.42;
          // Outer swept Caret cowl wall
          rbox(g, 1.32, 0.22, 0.24, 0.03, stealthGrey, [0.42, -0.03, z], [side * 0.18, side * 0.10, 0]);
          // Forward swept Caret lip & dark radar-blocker intake mouth
          box(g, 0.08, 0.21, 0.22, stealthEdge, [1.08, -0.03, z + side * 0.02], [side * 0.24, side * 0.32, 0.22]);
          box(g, 0.16, 0.17, 0.18, mat(0x090d16, { roughness: 0.9 }), [1.02, -0.03, z], [side * 0.18, side * 0.16, 0]);
          // Serpentine S-duct composite tunnel curving inward to hide the spinning fan face
          tube(
            g,
            [
              [1.02, -0.03, z],
              [0.52, -0.01, side * 0.34],
              [-0.08, 0.04, side * 0.25],
            ],
            0.105,
            stealthDark,
          );
        }

        // 5. Dorsal UARRSI In-Flight Refueling Receptacle Slipway Markings + 6 Titanium Bulkheads
        box(g, 0.42, 0.012, 0.14, stealthEdge, [0.05, 0.265, 0]);
        box(g, 0.22, 0.014, 0.08, stealthDark, [-0.08, 0.267, 0]);
        for (let i = 0; i < 6; i++) {
          const bx = -1.18 + i * 0.42;
          box(g, 0.028, 0.22, 0.84 - Math.abs(i - 2.5) * 0.08, tiBulkhead, [bx, 0.03, 0]);
        }
      },
    },
    {
      id: 'aesa-radar-nose',
      name: 'AN/APG-77 AESA Active Phased-Array Radar & Sculpted Chined Radome',
      category: 'Avionics & Sensors',
      isOuter: false,
      explodeOffset: [2.25, 0.35, 0],
      desc: '1,956 solid-state transmit/receive radar modules tilted inside a sculpted diamond-chine radome with RAM edge band and liquid-cooling manifolds.',
      funFact: 'The radar hops across frequencies more than 1,000 times every second so enemy receivers never know they are being scanned!',
      build(g) {
        // Sculpted multi-station stealth radome (compressed vertically with sharp horizontal chine ridge)
        lathe(
          g,
          [
            [1.46, 0.33],
            [1.68, 0.28],
            [1.92, 0.21],
            [2.16, 0.13],
            [2.38, 0.05],
            [2.52, 0.008],
          ],
          16,
          stealthDark,
          [0, 0.06, 0],
          undefined,
          [0.64, 1, 0.98],
        );
        // Sharp horizontal stealth chine flange running from cheek to nose tip
        const noseChinePts = [
          [1.46, -0.33],
          [1.88, -0.22],
          [2.25, -0.10],
          [2.53, 0],
          [2.25, 0.10],
          [1.88, 0.22],
          [1.46, 0.33],
        ];
        extrudeProfile(g, noseChinePts, 0.022, stealthEdge, [0, 0.05, 0], [Math.PI / 2, 0, 0], 0.006);

        // Internal AN/APG-77 AESA Active Phased-Array Radar bulkhead & 1,956-element gold array face
        cyl(g, 0.22, 0.24, 0.06, 28, tiBulkhead, [1.50, 0.06, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.20, 0.20, 0.04, 28, brushedMetal(0xd4af37, { metalness: 0.92, roughness: 0.18 }), [1.56, 0.06, 0], [0, 0, 1.22]);
        buildHexBoltArray(
          g,
          [
            [1.48, 0.16, 0.20],
            [1.48, 0.16, -0.20],
            [1.48, -0.04, 0.20],
            [1.48, -0.04, -0.20],
          ],
          { radius: 0.01, height: 0.014, finish: 'gold', rot: [0, 0, Math.PI / 2] },
        );
      },
    },
    {
      id: 'gold-bubble-canopy',
      name: 'Frameless Indium-Tin-Oxide Gold-Tinted Teardrop Bubble Canopy',
      category: 'Cockpit',
      isOuter: true,
      explodeOffset: [0.85, 1.85, 0],
      desc: '3/4-inch-thick frameless polycarbonate teardrop canopy vapor-deposited with microscopic gold to reflect radar waves away from the cockpit.',
      funFact: 'Unlike most jets, the F-22 canopy has zero metal bow frames so the pilot has an unbroken 360-degree view!',
      build(g) {
        // Sleek teardrop fighter canopy faired into the dorsal spine
        lathe(
          g,
          [
            [0.18, 0.04],
            [0.38, 0.16],
            [0.68, 0.25],
            [0.98, 0.26],
            [1.24, 0.18],
            [1.44, 0.03],
          ],
          28,
          goldCanopy,
          [0, 0.20, 0],
          undefined,
          [0.92, 1, 0.78],
        );
        // Sawtooth composite canopy sill skirt & dual hydraulic lift struts
        const sillPts = [
          [0.18, -0.17],
          [0.82, -0.21],
          [1.44, -0.12],
          [1.44, 0.12],
          [0.82, 0.21],
          [0.18, 0.17],
        ];
        extrudeProfile(g, sillPts, 0.032, stealthDark, [0, 0.20, 0], [Math.PI / 2, 0, 0], 0.008);
      },
    },
    {
      id: 'aces-ejection-cockpit',
      name: 'ACES II Zero-Zero Rocket Ejection Seat, HUD & Sidestick',
      category: 'Pilot Life Support',
      isOuter: false,
      explodeOffset: [0.85, 1.15, 1.25],
      desc: 'Inclined rocket-catapult ejection seat, green holographic Head-Up Display (HUD), 6 MFD screens, and force-sensing sidestick.',
      funFact: '"Zero-Zero" means the rocket seat can safely eject the pilot and open a parachute even at zero altitude and zero speed on the tarmac!',
      build(g) {
        // Inclined ACES II Seat bucket, twin rocket rails, headbox & pitot sensors
        rbox(g, 0.24, 0.42, 0.24, 0.02, stealthDark, [0.76, 0.17, 0], [0, 0, 0.28]);
        rbox(g, 0.24, 0.09, 0.22, 0.02, mat(0x334155), [0.85, 0.04, 0]);
        rbox(g, 0.12, 0.14, 0.16, 0.02, stealthDark, [0.69, 0.38, 0], [0, 0, 0.28]);
        // Panoramic instrument glare shield + 4 MFD glass screens + green holographic HUD combiner
        rbox(g, 0.24, 0.16, 0.36, 0.02, stealthDark, [1.08, 0.19, 0], [0, 0, -0.22]);
        rbox(g, 0.04, 0.13, 0.32, 0.01, screenMat('ios'), [1.00, 0.20, 0], [0, 0, -0.22]);
        box(g, 0.11, 0.14, 0.14, glassMat(0x22c55e, 0.65), [1.12, 0.32, 0], [0, 0, -0.38]);
        // Right-hand force-sensing sidestick & left-hand dual throttle
        cyl(g, 0.012, 0.016, 0.11, 10, stealthDark, [0.92, 0.16, 0.15], [-0.15, 0, 0]);
        rbox(g, 0.08, 0.05, 0.06, 0.01, stealthDark, [0.92, 0.15, -0.15]);
      },
    },
    {
      id: 'internal-weapons-bay',
      name: 'Pneumatic Belly Payload Bays & Sawtooth Doors',
      category: 'Stealth Payload',
      isOuter: false,
      explodeOffset: [0.15, -1.35, 0],
      desc: 'Internal fuselage bays with pneumatic trapeze launchers, high-pressure lines, and sawtooth-edged stealth bay doors.',
      funFact: 'The pneumatic bay doors snap open, extend the trapeze cradle into the airstream, and slam shut in less than one second!',
      build(g) {
        rbox(g, 1.32, 0.09, 0.68, 0.015, tiBulkhead, [0.15, -0.11, 0]);
        for (const z of [-0.22, -0.07, 0.07, 0.22]) {
          cyl(g, 0.028, 0.028, 1.08, 14, carPaint(0xf8fafc), [0.15, -0.10, z], [0, 0, Math.PI / 2]);
          cone(g, 0.028, 0.12, 14, stealthDark, [0.74, -0.10, z], [0, 0, -Math.PI / 2]);
        }
        for (const side of [-1, 1]) {
          box(g, 1.30, 0.018, 0.30, stealthGrey, [0.15, -0.18, side * 0.34], [side * 0.38, 0, 0]);
          box(g, 1.30, 0.012, 0.04, stealthEdge, [0.15, -0.22, side * 0.46], [side * 0.38, 0, 0]);
        }
      },
    },
    {
      id: 'diamond-delta-wings',
      name: 'Clipped Diamond-Delta Titanium-Carbon Wings, Leading-Edge Flaps & Flaperons',
      category: 'Aerodynamics',
      isOuter: false,
      explodeOffset: [0, -0.35, 2.05],
      desc: 'Planform-aligned 42-degree swept clipped-delta wings where every leading and trailing edge shares the exact same radar deflection angle.',
      funFact: 'This rule is called "planform alignment"—even the tiny sawtooth edges on the inspection panels follow the exact same angle!',
      build(g) {
        for (const side of [-1, 1]) {
          const wingPts = [
            [0.62, side * 0.56],
            [-0.78, side * 1.96],
            [-1.34, side * 1.96],
            [-1.12, side * 0.56],
          ];
          extrudeProfile(g, wingPts, 0.046, stealthGrey, [0, 0.04, 0], [Math.PI / 2, 0, 0], 0.01);
          // Lighter RAM radar-absorbent leading-edge & wingtip perimeter trim
          const lePts = [
            [0.64, side * 0.56],
            [-0.77, side * 1.97],
            [-0.86, side * 1.97],
            [0.48, side * 0.56],
          ];
          extrudeProfile(g, lePts, 0.048, stealthEdge, [0, 0.041, 0], [Math.PI / 2, 0, 0], 0.006);
          // Trailing-edge flaperon & aileron control surfaces + under-wing actuator fairings
          const flapPts = [
            [-0.98, side * 0.62],
            [-1.18, side * 1.88],
            [-1.33, side * 1.88],
            [-1.12, side * 0.62],
          ];
          extrudeProfile(g, flapPts, 0.036, stealthEdge, [0, 0.035, 0], [Math.PI / 2, 0, 0], 0.005);
          for (const fz of [0.88, 1.38]) {
            rbox(g, 0.28, 0.035, 0.04, 0.01, stealthDark, [-1.05, 0.0, side * fz]);
          }
          // Wingtip stealth formation LED strip
          box(g, 0.36, 0.02, 0.025, emissiveMat(side > 0 ? 0xef4444 : 0x22c55e, 1.5), [-1.06, 0.03, side * 1.965]);
        }
      },
    },
    {
      id: 'twin-f119-afterburners',
      name: 'Twin Pratt & Whitney F119 Turbofans (Spinning Blisks & Supercruise)',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [-1.45, 0.65, 0],
      desc: 'Two 35,000-lbf afterburning turbofans with counter-rotating titanium blisks (`Drive It!`), FADEC fuel lines, and accessory gearboxes.',
      funFact: 'Most fighter jets can only break the sound barrier for a few minutes with afterburners on, but F-22 supercruises at Mach 1.8 dry!',
      build(g) {
        addGearboxCadSubassembly(g, [-0.65, 0.08, 0], 0.01);
        for (const z of [-0.24, 0.24]) {
          cyl(g, 0.17, 0.19, 1.42, 24, tiBulkhead, [-0.82, 0.05, z], [0, 0, Math.PI / 2]);
          const fanGroup = new THREE.Group();
          fanGroup.position.set(-0.12, 0.05, z);
          fanGroup.userData.driveAnim = 'fan';
          g.add(fanGroup);
          cone(fanGroup, 0.06, 0.14, 18, stealthDark, [0.06, 0, 0], [0, 0, -Math.PI / 2]);
          for (let b = 0; b < 16; b++) {
            const a = (b / 16) * Math.PI * 2;
            box(fanGroup, 0.028, 0.31, 0.014, chromeMat(), [0, Math.sin(a) * 0.075, Math.cos(a) * 0.075], [a, 0.38, 0]);
          }
        }
        buildWiringHarness(g, [
          {
            points: [
              [-0.25, 0.18, 0.24],
              [-0.85, 0.21, 0.27],
              [-1.42, 0.15, 0.24],
            ],
            radius: 0.013,
            color: 0xe2e8f0,
            braided: true,
          },
          {
            points: [
              [-0.25, 0.18, -0.24],
              [-0.85, 0.21, -0.27],
              [-1.42, 0.15, -0.24],
            ],
            radius: 0.013,
            color: 0xe2e8f0,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'thrust-vectoring-nozzles',
      name: '2D Pitch Thrust-Vectoring Rectangular Titanium Nozzles & Afterburner Plumes',
      category: 'Agility & Propulsion',
      isOuter: false,
      explodeOffset: [-2.35, 0.15, 0],
      desc: 'Flat rectangular ceramic-matrix nozzles with upper and lower articulated turkey-feather petals that vector ±20 degrees in pitch.',
      funFact: 'Flat rectangular nozzles also flatten and cool the exhaust plume to hide the jet from infrared heat-seeking sensors!',
      build(g) {
        const afterburnerGlow = emissiveMat(0xff6b00, 1.65);
        const coreBlue = emissiveMat(0x38bdf8, 1.35);
        for (const z of [-0.24, 0.24]) {
          // Outer stealth nozzle shroud cheek fairings
          for (const cz of [-0.16, 0.16]) {
            const cheekPts = [
              [-1.52, -0.10],
              [-1.98, -0.05],
              [-1.88, 0.0],
              [-1.98, 0.05],
              [-1.52, 0.10],
            ];
            extrudeProfile(g, cheekPts, 0.022, stealthGrey, [0, 0.05, z + cz], [0, 0, 0], 0.004);
          }
          // Upper & lower articulated 2D vectoring nozzle flaps with 6 ribbed titanium petals each
          for (const vSide of [-1, 1]) {
            rbox(g, 0.38, 0.028, 0.30, 0.006, stealthDark, [-1.74, 0.05 + vSide * 0.075, z], [0, 0, vSide * -0.14]);
            for (let p = -2; p <= 2; p++) {
              box(g, 0.36, 0.012, 0.042, tiBulkhead, [-1.74, 0.05 + vSide * 0.088, z + p * 0.052], [0, 0, vSide * -0.14]);
            }
          }
          // Glowing variable-geometry afterburner flameholder ring & shock-diamond plume
          rbox(g, 0.18, 0.095, 0.26, 0.02, afterburnerGlow, [-1.86, 0.05, z]);
          rbox(g, 0.12, 0.055, 0.20, 0.015, coreBlue, [-1.96, 0.05, z]);
        }
      },
    },
    {
      id: 'canted-twin-tails',
      name: '28° Outward-Canted Twin Vertical Tails & All-Moving Horizontal Stabilators',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-1.95, 1.35, 0],
      desc: 'Planform-aligned trapezoidal vertical stabilizers canted outward 28 degrees plus pivoting diamond-planform horizontal stabilators.',
      funFact: 'When the pilot wants to slow down fast, the two rudders toe inward while the horizontal tails flare to act as airbrakes!',
      build(g) {
        const tailShape = [
          [-0.95, 0],
          [-1.42, 0.82],
          [-1.82, 0.82],
          [-1.68, 0],
        ];
        for (const side of [-1, 1]) {
          // 28° outward-canted trapezoidal vertical stabilizer with RAM leading/trailing edge trim
          extrudeProfile(g, tailShape, 0.036, stealthGrey, [0, 0.12, side * 0.42], [side * -0.48, 0, 0], 0.008);
          const rudderShape = [
            [-1.48, 0.08],
            [-1.66, 0.76],
            [-1.81, 0.76],
            [-1.67, 0.08],
          ];
          extrudeProfile(g, rudderShape, 0.04, stealthEdge, [0, 0.12, side * 0.42], [side * -0.48, 0, 0], 0.005);

          // Clipped-diamond all-moving horizontal stabilators (XZ plane)
          const stabPts = [
            [-1.24, side * 0.50],
            [-1.68, side * 1.34],
            [-1.96, side * 1.34],
            [-1.84, side * 0.46],
          ];
          extrudeProfile(g, stabPts, 0.034, stealthGrey, [0, 0.035, 0], [Math.PI / 2, 0, 0], 0.008);
          const stabEdgePts = stabPts.map(([x, z]) => [x * 1.004, z * 1.01]);
          extrudeProfile(g, stabEdgePts, 0.018, stealthEdge, [0, 0.035, 0], [Math.PI / 2, 0, 0], 0.004);
        }
      },
    },
    {
      id: 'fighter-landing-gear',
      name: 'High-Impact Retractable Tricycle Gear & Sawtooth Doors',
      category: 'Landing Gear',
      isOuter: false,
      explodeOffset: [0, -1.55, 0],
      desc: 'Forged titanium oleo struts, radial aircraft tires, carbon disc brakes, and sawtooth-edged stealth gear doors.',
      funFact: 'Every single landing gear door has jagged zig-zag edges so it never creates a straight radar reflection when open!',
      build(g) {
        buildAirlinerLandingGear(g, { noseX: 1.18, mainX: -0.35, mainZ: 0.45, pairsPerBogie: 1 });
      },
    },
  ];

  return {
    id: 'f22-raptor-jet',
    name: 'Lockheed F-22 Raptor Stealth Jet',
    brand: 'Lockheed Martin',
    badge: 'Mach 2.25 • 2D Thrust Vectoring',
    desc: 'Fifth-generation stealth fighter with chined fuselage, internal payload bays, gold-tinted bubble canopy, spinning F119 blisks, and 2D vectoring nozzles.',
    cameraPos: [4.1, 2.5, 4.2],
    parts,
    quiz: [
      {
        q: 'Why does the F-22 Raptor hide its equipment inside belly bays instead of hanging it under the wings?',
        correctId: 'internal-weapons-bay',
        distractors: ['gold-bubble-canopy', 'fighter-landing-gear', 'aces-ejection-cockpit'],
      },
      {
        q: 'Which rectangular parts at the back of the F-22 tilt up and down to flip the jet through mid-air somersaults?',
        correctId: 'thrust-vectoring-nozzles',
        distractors: ['aesa-radar-nose', 'diamond-delta-wings', 'stealth-chined-fuselage'],
      },
      {
        q: 'Why is the F-22’s frameless bubble canopy tinted with a microscopic layer of real gold?',
        correctId: 'gold-bubble-canopy',
        distractors: ['canted-twin-tails', 'twin-f119-afterburners', 'fighter-landing-gear'],
      },
      {
        q: 'What is it called when the F-22’s twin F119 engines fly faster than the speed of sound WITHOUT using thirsty afterburners?',
        correctId: 'twin-f119-afterburners',
        distractors: ['aces-ejection-cockpit', 'aesa-radar-nose', 'internal-weapons-bay'],
      },
      {
        q: 'Why do the two vertical tails on the F-22 lean outward at a 28-degree V-angle instead of standing straight up?',
        correctId: 'canted-twin-tails',
        distractors: ['fighter-landing-gear', 'gold-bubble-canopy', 'aces-ejection-cockpit'],
      },
    ],
  };
}

function buildLockheedSR71Blackbird() {
  const srBlack = mat(0x111827, { metalness: 0.45, roughness: 0.36 });
  const srCharcoal = brushedMetal(0x1e293b, { metalness: 0.62, roughness: 0.30 });
  const betaTitanium = brushedMetal(0x94a3b8, { metalness: 0.88, roughness: 0.22 });
  const redWalkway = carPaint(0xdc2626);
  const quartzGlass = glassMat(0x38bdf8, 0.52);

  const parts = [
    {
      id: 'titanium-chined-fuselage',
      name: '85% Beta-Titanium B-120VCA Needle Fuselage & Knife-Edge Forward Chines',
      category: 'Mach 3.3 Airframe',
      isOuter: true,
      explodeOffset: [0, 1.45, 0],
      desc: 'All-titanium cobra-hooded forward and center fuselage with razor-sharp lateral chines that generate vortex lift and scatter radar waves at 85,000 feet.',
      funFact: 'At Mach 3.3, air friction heats the SR-71’s nose and leading edges to 600–900°F—hot enough to melt aluminum, so Skunk Works built 85% of the jet out of titanium!',
      build(g) {
        // 1. Sleek needle-nosed cobra fuselage via LatheGeometry (x = -1.95 to +2.58)
        lathe(
          g,
          [
            [-1.96, 0.04],
            [-1.65, 0.15],
            [-0.95, 0.22],
            [0.25, 0.24],
            [1.15, 0.22],
            [1.75, 0.16],
            [2.22, 0.08],
            [2.58, 0.008],
          ],
          28,
          srBlack,
          [0, 0.06, 0],
          undefined,
          [0.72, 1, 0.96],
        );
        // 2. Signature Cobra-Hooded Forward & Center Lateral Chines (XZ plane)
        const cobraChinePts = [
          [-1.92, -0.32],
          [-0.45, -0.48],
          [0.65, -0.44],
          [1.45, -0.36],
          [2.05, -0.22],
          [2.58, 0],
          [2.05, 0.22],
          [1.45, 0.36],
          [0.65, 0.44],
          [-0.45, 0.48],
          [-1.92, 0.32],
        ];
        extrudeProfile(g, cobraChinePts, 0.036, srCharcoal, [0, 0.04, 0], [Math.PI / 2, 0, 0], 0.01);
        // Red "NO STEP" titanium expansion joint outlines on upper fuselage spine
        for (const s of [-1, 1]) {
          box(g, 2.25, 0.008, 0.018, redWalkway, [-0.15, 0.225, s * 0.16]);
        }
        // Internal corrugated Beta-Titanium structural ring frames
        for (let x = -1.2; x <= 1.2; x += 0.48) {
          torus(g, 0.17, 0.014, betaTitanium, [x, 0.06, 0], [0, Math.PI / 2, 0], [1, 0.72, 1]);
        }
      },
    },
    {
      id: 'tandem-cockpit-astro-inertial',
      name: 'Tandem Pressurized Cockpits, Quartz Windshields & ANS-111 Star Tracker',
      category: 'Cockpit & Navigation',
      isOuter: true,
      explodeOffset: [1.05, 1.55, 0],
      desc: 'Pilot and Reconnaissance Systems Officer (RSO) tandem clamshell canopies with 600°F fused-quartz V-windshields and the "R2-D2" daylight star tracker.',
      funFact: 'Before GPS existed, the SR-71 navigated at 2,200 mph using a telescope behind the rear cockpit ("R2-D2") that locked onto 61 stars—even in bright daylight!',
      build(g) {
        // Dorsal spine fairing spanning pilot & RSO cockpits
        lathe(
          g,
          [
            [0.15, 0.05],
            [0.55, 0.15],
            [1.15, 0.17],
            [1.58, 0.15],
            [1.92, 0.03],
          ],
          22,
          srCharcoal,
          [0, 0.16, 0],
          undefined,
          [0.88, 1, 0.72],
        );
        // Pilot V-shaped fused-quartz windshield & RSO side observation windows
        for (const s of [-1, 1]) {
          box(g, 0.34, 0.11, 0.018, quartzGlass, [1.62, 0.24, s * 0.075], [s * -0.42, s * 0.28, -0.35]);
          box(g, 0.24, 0.09, 0.018, quartzGlass, [1.02, 0.25, s * 0.095], [s * -0.45, 0, 0]);
        }
        // Tandem Full-Pressure-Suit Ejection Seats + ANS-111 Daylight Star Tracker quartz window
        for (const cx of [1.42, 0.96]) {
          rbox(g, 0.18, 0.28, 0.18, 0.02, betaTitanium, [cx, 0.15, 0], [0, 0, 0.22]);
        }
        cyl(g, 0.065, 0.065, 0.03, 18, quartzGlass, [0.58, 0.28, 0]);
      },
    },
    {
      id: 'blended-delta-wing-nacelles',
      name: 'Corrugated Titanium Delta Wings & Wing-Mounted J58 Nacelle Shells',
      category: 'Aerodynamics & Thermal',
      isOuter: false,
      explodeOffset: [0, 0.85, 1.85],
      desc: 'Inboard and outboard delta wings with chordwise thermal-expansion corrugations cradling two 5.5-foot-diameter cylindrical engine nacelles.',
      funFact: 'The wing skins are corrugated like a washboard so the titanium can expand several inches at 600°F without buckling or warping in flight!',
      build(g) {
        for (const side of [-1, 1]) {
          // Inboard delta wing connecting central fuselage to J58 nacelle (z = ±0.35 to ±0.92)
          const inboardPts = [
            [0.35, side * 0.36],
            [-0.45, side * 0.92],
            [-1.86, side * 0.92],
            [-1.88, side * 0.32],
          ];
          extrudeProfile(g, inboardPts, 0.042, srBlack, [0, 0.02, 0], [Math.PI / 2, 0, 0], 0.008);

          // Outboard conical-camber delta wing outside the J58 nacelle (z = ±0.92 to ±1.76)
          const outboardPts = [
            [-0.38, side * 0.92],
            [-1.32, side * 1.76],
            [-1.82, side * 1.76],
            [-1.86, side * 0.92],
          ];
          extrudeProfile(g, outboardPts, 0.036, srBlack, [0, 0.02, 0], [Math.PI / 2, 0, 0], 0.008);

          // Chordwise thermal-expansion corrugations + red NO STEP walkways
          for (let c = 0; c < 6; c++) {
            const zc = side * (0.48 + c * 0.07);
            box(g, 1.35 - c * 0.08, 0.008, 0.012, srCharcoal, [-0.95, 0.048, zc]);
          }
          box(g, 1.45, 0.01, 0.02, redWalkway, [-0.95, 0.05, side * 0.62]);

          // Cylindrical J58 Outer Titanium Nacelle Barrel & Aft Tertiary Blow-In Door Ejector Shroud
          const nz = side * 0.92;
          lathe(
            g,
            [
              [-1.92, 0.21],
              [-1.55, 0.24],
              [-0.45, 0.25],
              [0.32, 0.23],
              [0.48, 0.21],
            ],
            28,
            srBlack,
            [0, 0.04, nz],
          );
          torus(g, 0.21, 0.018, srCharcoal, [0.48, 0.04, nz], [0, Math.PI / 2, 0]);
        }
      },
    },
    {
      id: 'j58-inlet-spike-cones',
      name: 'Translating Supersonic Inlet Spike Cones & 12× External Bypass Bleed Tubes',
      category: 'Supersonic Inlets',
      isOuter: false,
      explodeOffset: [1.95, 0.25, 0],
      desc: 'Computer-controlled conical inlet spikes that retract 26 inches rearward above Mach 1.6 to trap the supersonic shockwave inside the inlet throat, plus 6 external bypass pipes per engine.',
      funFact: 'At Mach 3.2, over 80% of the SR-71’s total thrust actually comes from the supersonic air pressure pushing on the inside of the inlet cones—not the jet turbines!',
      build(g) {
        for (const side of [-1, 1]) {
          const nz = side * 0.92;
          // Razor-sharp translating axisymmetric supersonic inlet spike cone
          cone(g, 0.145, 0.72, 24, srCharcoal, [0.58, 0.04, nz], [0, 0, -Math.PI / 2]);
          cyl(g, 0.08, 0.145, 0.45, 20, betaTitanium, [0.02, 0.04, nz], [0, 0, Math.PI / 2]);
          // 6 External Continuous-Bleed Bypass Tubes routing compressor air around the turbine into the afterburner
          for (let t = 0; t < 6; t++) {
            const a = (t / 6) * Math.PI * 2 + 0.26;
            const ty = 0.04 + Math.sin(a) * 0.195;
            const tz = nz + Math.cos(a) * 0.195;
            tube(
              g,
              [
                [0.05, 0.04 + Math.sin(a) * 0.18, nz + Math.cos(a) * 0.18],
                [-0.25, ty, tz],
                [-1.15, ty, tz],
                [-1.48, 0.04 + Math.sin(a) * 0.18, nz + Math.cos(a) * 0.18],
              ],
              0.018,
              betaTitanium,
            );
          }
        }
      },
    },
    {
      id: 'twin-j58-turboramjets',
      name: 'Twin Pratt & Whitney J58 Continuous-Bleed Turbo-Ramjets & TEB Afterburners',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [-1.85, 0.55, 0],
      desc: 'Two 34,000-lbf J58-P4 turbo-ramjet engines with spinning titanium compressor stages (`Drive It!`), Triethylborane (TEB) green-flash igniters, and glowing Mach shock diamonds.',
      funFact: 'JP-7 fuel is so hard to light that you can drop a lit match into a bucket of it and it goes out—so the SR-71 injects pyrophoric Triethylborane (TEB) that bursts into bright green flame on contact with air!',
      build(g) {
        const shockGlow = emissiveMat(0xff6b00, 1.75);
        const shockCore = emissiveMat(0x38bdf8, 1.55);
        for (const side of [-1, 1]) {
          const nz = side * 0.92;
          cyl(g, 0.175, 0.185, 1.58, 24, betaTitanium, [-0.88, 0.04, nz], [0, 0, Math.PI / 2]);
          // Spinning J58 Compressor Rotor (`driveAnim = 'fan'`)
          const fanGroup = new THREE.Group();
          fanGroup.position.set(-0.08, 0.04, nz);
          fanGroup.userData.driveAnim = 'fan';
          g.add(fanGroup);
          for (let b = 0; b < 16; b++) {
            const a = (b / 16) * Math.PI * 2;
            box(fanGroup, 0.026, 0.32, 0.014, chromeMat(), [0, Math.sin(a) * 0.08, Math.cos(a) * 0.08], [a, 0.38, 0]);
          }
          // Aft Ejector Nozzle Petals + Supersonic Shock-Diamond Plume
          for (let p = 0; p < 16; p++) {
            const a = (p / 16) * Math.PI * 2;
            box(
              g,
              0.24,
              0.014,
              0.052,
              srCharcoal,
              [-1.82, 0.04 + Math.sin(a) * 0.195, nz + Math.cos(a) * 0.195],
              [a, 0, 0],
            );
          }
          cyl(g, 0.16, 0.18, 0.18, 22, shockGlow, [-1.88, 0.04, nz], [0, 0, Math.PI / 2]);
          cone(g, 0.13, 0.42, 20, shockCore, [-2.12, 0.04, nz], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'inward-canted-rudders',
      name: 'Twin 15° Inward-Canted All-Moving Vertical Rudders & Elevons',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-1.95, 1.45, 0],
      desc: 'Two all-moving vertical stabilizers mounted directly atop the twin J58 nacelles and canted 15 degrees inward toward the fuselage centerline, plus inboard/outboard elevons.',
      funFact: 'Because the entire vertical fin above each engine nacelle pivots as a single piece, the SR-71 has massive directional authority to counter an engine "unstart" at Mach 3!',
      build(g) {
        const rudderShape = [
          [-0.95, 0],
          [-1.38, 0.72],
          [-1.84, 0.72],
          [-1.88, 0],
        ];
        for (const side of [-1, 1]) {
          const nz = side * 0.92;
          // 15° Inward-canted vertical rudder mounted atop each J58 nacelle + Skunk Works red tail flash
          extrudeProfile(g, rudderShape, 0.034, srBlack, [0, 0.25, nz], [side * 0.26, 0, 0], 0.008);
          box(g, 0.44, 0.032, 0.040, redWalkway, [-1.60, 0.85, nz - side * 0.16], [side * 0.26, 0, 0]);
          // Trailing-edge inboard & outboard elevons
          box(g, 0.14, 0.028, 0.48, srCharcoal, [-1.92, 0.02, side * 0.58]);
          box(g, 0.14, 0.026, 0.56, srCharcoal, [-1.88, 0.02, side * 1.38]);
        }
      },
    },
    {
      id: 'sr71-obc-slr-recon-bays',
      name: 'Nose & Chine Optical Bar Camera (OBC) & Side-Looking Radar (SLR) Bays',
      category: 'Reconnaissance Payload',
      isOuter: false,
      explodeOffset: [1.75, -0.95, 0],
      desc: 'Interchangeable detach-nose Technical Objective Camera (TEOC), rotating Itek Optical Bar Camera (OBC) with 10,500 feet of 5-inch film behind fused-quartz belly windows, and synthetic-aperture Side-Looking Radar (ASARS-1) arrays in the forward chines.',
      funFact: 'From 85,000 feet up (16 miles high!), the SR-71’s panoramic Optical Bar Camera could photograph 100,000 square miles per hour and read a license plate or golf ball on a green!',
      build(g) {
        const goldFoil = brushedMetal(0xf59e0b, { metalness: 0.9, roughness: 0.2 });
        const sensorGreen = brushedMetal(0x065f46, { metalness: 0.65, roughness: 0.35 });
        // Forward Nose ASARS-1 Synthetic-Aperture Radar phased-array transceiver rack
        rbox(g, 0.42, 0.11, 0.22, 0.02, goldFoil, [2.02, 0.04, 0]);
        box(g, 0.36, 0.02, 0.28, sensorGreen, [2.02, -0.02, 0]);
        // Rotating Itek 30-inch focal-length Optical Bar Camera (OBC) drum & twin film supply/take-up spools
        cyl(g, 0.075, 0.075, 0.32, 20, betaTitanium, [1.56, 0.01, 0], [0, 0, Math.PI / 2]);
        for (const fx of [1.42, 1.7]) {
          cyl(g, 0.055, 0.055, 0.18, 18, goldFoil, [fx, 0.07, 0], [Math.PI / 2, 0, 0]);
        }
        // Twin ventral fused-quartz optical camera windows on the lower chine belly
        for (const side of [-1, 1]) {
          box(g, 0.28, 0.014, 0.11, quartzGlass, [1.56, -0.06, side * 0.11], [side * 0.18, 0, 0]);
          // Forward Chine Side-Looking Radar (SLR) waveguide arrays + ELINT receivers
          rbox(g, 0.68, 0.055, 0.12, 0.015, sensorGreen, [1.15, 0.03, side * 0.28]);
          cyl(g, 0.022, 0.022, 0.56, 12, goldFoil, [1.15, 0.065, side * 0.28], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'jp7-fuel-tanks-landing-gear',
      name: '6× Integral JP-7 Fuel Heat-Sink Tanks & Liquid-Nitrogen Dewar System',
      category: 'Cryo & Fuel Thermal Sink',
      isOuter: false,
      explodeOffset: [0, -1.25, 0],
      desc: 'Six fuselage fuel tanks holding 80,000 lbs of low-volatility JP-7 fuel—which circulates through heat exchangers to cool the cockpit, hydraulics, and avionics before burning in the J58 engines—inerted by green Liquid-Nitrogen (LN2) dewar spheres.',
      funFact: 'At Mach 3.3 the outside air is 600°F, so there is no cool air to chill the cockpit! Instead, the SR-71 uses its own JP-7 fuel as giant liquid coolant before pumping the hot fuel into the afterburners!',
      build(g) {
        const ln2Green = carPaint(0x16a34a);
        const fuelManifold = brushedMetal(0xd97706, { metalness: 0.9, roughness: 0.18 });
        // 6 integral fuselage JP-7 fuel tank cells + central titanium transfer & heat-exchanger spine
        for (let i = 0; i < 6; i++) {
          rbox(g, 0.34, 0.15, 0.28, 0.03, betaTitanium, [-0.95 + i * 0.38, 0.04, 0]);
        }
        cyl(g, 0.024, 0.024, 2.2, 16, fuelManifold, [-0.02, 0.13, 0.08], [0, 0, Math.PI / 2]);
        cyl(g, 0.024, 0.024, 2.2, 16, betaTitanium, [-0.02, 0.13, -0.08], [0, 0, Math.PI / 2]);
        // Spherical cryogenic Liquid-Nitrogen (LN2) fuel-tank pressurization & environmental cooling dewars
        for (const z of [-0.18, 0, 0.18]) {
          sphere(g, 0.065, 18, ln2Green, [0.95, 0.04, z]);
        }
      },
    },
    {
      id: 'sr71-titanium-landing-gear',
      name: '6-Wheel Aluminum-Impregnated Nitrogen Tire Bogies & Titanium Struts',
      category: 'Landing Gear',
      isOuter: false,
      explodeOffset: [0, -1.75, 0],
      desc: 'Forged titanium retractable tricycle landing gear featuring 3-wheel main bogies with BFGoodrich aluminum-powder-impregnated tires inflated with 415 PSI dry nitrogen and multi-disc brakes.',
      funFact: 'The SR-71’s tires are infused with powdered aluminum to reflect heat and inflated with pure nitrogen to 415 PSI so they don’t explode inside the 500°F wheel wells!',
      build(g) {
        buildAirlinerLandingGear(g, { noseX: 1.35, mainX: -0.68, mainZ: 0.62, pairsPerBogie: 2 });
      },
    },
    {
      id: 'sr71-drag-chute-def-ecm',
      name: 'Aft Tailcone Drag Parachute Canister & DEF A2C2S Electronic Countermeasures',
      category: 'Recovery & Electronic Warfare',
      isOuter: false,
      explodeOffset: [-2.15, 0.85, 0],
      desc: 'Dorsal aft-fuselage drag-chute compartment housing a 40-foot ribbon braking parachute for 200-knot landings, paired with the tailcone DEF radar warning receiver and high-power ECM jammer suite.',
      funFact: 'Over 4,000 surface-to-air missiles were fired at SR-71 Blackbirds during their career—and zero ever hit! The Blackbird simply jammed the radar and accelerated above Mach 3.2 to outrun every missile!',
      build(g) {
        const chuteOrange = carPaint(0xf97316);
        // Dorsal drag-chute bay housing, open clamshell doors & packed 40-ft ribbon parachute canister
        rbox(g, 0.34, 0.09, 0.22, 0.02, betaTitanium, [-1.52, 0.16, 0]);
        cyl(g, 0.068, 0.068, 0.26, 18, chuteOrange, [-1.52, 0.2, 0], [0, 0, Math.PI / 2]);
        for (const s of [-1, 1]) {
          box(g, 0.32, 0.012, 0.11, srCharcoal, [-1.52, 0.24, s * 0.12], [s * 0.75, 0, 0]);
        }
        // Aft tailcone DEF / A2C2S Electronic Warfare ECM jammer radome & aerial refueling dorsal receptacle
        cone(g, 0.08, 0.32, 18, srCharcoal, [-2.06, 0.06, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.22, 0.03, 0.08, 0.01, redWalkway, [0.18, 0.23, 0]);
      },
    },
  ];

  return {
    id: 'lockheed-sr71-blackbird',
    name: 'Lockheed SR-71 Blackbird (Mach 3.3)',
    brand: 'Lockheed Skunk Works',
    badge: 'Mach 3.3 • 85,000 Ft • J58 Turbo-Ramjet',
    desc: 'Legendary Kelly Johnson Skunk Works strategic reconnaissance jet featuring an 85% Beta-Titanium chined airframe, translating supersonic inlet spikes, 12 external bypass bleed tubes, and twin J58 turbo-ramjets.',
    cameraPos: [4.25, 2.45, 4.35],
    parts,
    quiz: [
      {
        q: 'Why did Lockheed Skunk Works build 85% of the SR-71 Blackbird out of titanium instead of aluminum?',
        correctId: 'titanium-chined-fuselage',
        distractors: ['jp7-fuel-tanks-landing-gear', 'inward-canted-rudders', 'tandem-cockpit-astro-inertial'],
      },
      {
        q: 'Which pointed cones at the front of the SR-71’s engine nacelles slide backward 26 inches at Mach 3.2 to trap the supersonic shockwave?',
        correctId: 'j58-inlet-spike-cones',
        distractors: ['twin-j58-turboramjets', 'blended-delta-wing-nacelles', 'inward-canted-rudders'],
      },
      {
        q: 'How did the SR-71 Blackbird navigate with pinpoint accuracy at 85,000 feet before GPS satellites existed?',
        correctId: 'tandem-cockpit-astro-inertial',
        distractors: ['titanium-chined-fuselage', 'sr71-obc-slr-recon-bays', 'j58-inlet-spike-cones'],
      },
      {
        q: 'Which reconnaissance bay in the SR-71 nose and chines could photograph 100,000 square miles per hour through quartz windows?',
        correctId: 'sr71-obc-slr-recon-bays',
        distractors: ['sr71-drag-chute-def-ecm', 'sr71-titanium-landing-gear', 'inward-canted-rudders'],
      },
    ],
  };
}

function buildCessna172Skyhawk() {
  const skyWhite = carPaint(0xf8fafc);
  const crimson = carPaint(0xdc2626);
  const goldStripe = carPaint(0xf59e0b);
  const navyAccent = carPaint(0x1e3a8a);
  const alu = brushedMetal(0xd1d5db);

  // Authentic NACA 2412 cambered high-wing airfoil cross-section (chord ~ 0.68m, thickness ~ 0.088m)
  const wingAirfoil = [
    [-0.36, 0.0],
    [-0.18, 0.048],
    [0.06, 0.064],
    [0.22, 0.056],
    [0.32, 0.026],
    [0.35, 0.0],
    [0.32, -0.018],
    [0.12, -0.020],
    [-0.15, -0.010],
  ];

  const parts = [
    {
      id: 'high-wing-airframe',
      name: 'Contoured NACA 2412 Strut-Braced High Wing, Integral Fuel Tanks & Hoerner Wingtips',
      category: 'Aerodynamics',
      isOuter: true,
      explodeOffset: [0, 1.55, 0],
      desc: 'Cambered NACA 2412 airfoil high wing with internal aluminum spars, 56-gallon integral wing tanks, drooped Hoerner wingtips, pitot tube, LED nav/landing lights, and streamlined V-lift struts.',
      funFact: 'More pilots have learned to fly in a Cessna 172 than in any other airplane in human history—over 44,000 have been built!',
      build(g) {
        // 1. Cambered NACA 2412 High Wing Center & Outer Span (centered at z = 0, span = 3.88)
        extrudeProfile(g, wingAirfoil, 3.88, skyWhite, [0.12, 0.53, 0], [0, 0, 0], 0.015);
        // Crimson & Gold leading-edge livery wrap across the wing span
        const leCuffProfile = [
          [0.16, 0.06],
          [0.33, 0.028],
          [0.355, 0.0],
          [0.32, -0.019],
          [0.16, -0.02],
        ];
        extrudeProfile(g, leCuffProfile, 3.90, crimson, [0.12, 0.53, 0], [0, 0, 0], 0.008);
        box(g, 0.045, 0.012, 3.89, goldStripe, [0.26, 0.59, 0]);

        // 2. Sculpted Drooped Hoerner Wingtips, Strobe/Nav Lights, Fuel Filler Caps & Pitot Tube
        for (const side of [-1, 1]) {
          rbox(g, 0.68, 0.048, 0.14, 0.02, crimson, [0.10, 0.515, side * 1.97], [side * 0.24, 0, 0]);
          sphere(g, 0.026, 14, emissiveMat(side > 0 ? 0xef4444 : 0x22c55e, 1.6), [0.38, 0.52, side * 2.02]);
          // Chrome wing-top fuel tank filler caps
          cyl(g, 0.028, 0.028, 0.014, 14, chromeMat(), [0.22, 0.598, side * 0.74]);
          // Streamlined Airfoil-Section Diagonal Lift Strut + Upper/Lower Fairing Cuffs
          tube(
            g,
            [
              [0.20, -0.10, side * 0.37],
              [0.18, 0.22, side * 0.74],
              [0.16, 0.52, side * 1.12],
            ],
            0.022,
            skyWhite,
          );
          rbox(g, 0.14, 0.05, 0.06, 0.015, crimson, [0.20, -0.09, side * 0.38]);
          rbox(g, 0.14, 0.05, 0.06, 0.015, skyWhite, [0.16, 0.51, side * 1.12]);
        }
        // Under-wing L-shaped Pitot Tube & Stall Warning Horn on left wing
        tube(
          g,
          [
            [0.34, 0.51, -0.82],
            [0.34, 0.45, -0.82],
            [0.46, 0.45, -0.82],
          ],
          0.008,
          chromeMat(),
        );
      },
    },
    {
      id: 'lycoming-boxer-engine',
      name: 'Lycoming IO-360-L2A 4-Cylinder Boxer Engine (CAD Cylinders & Exhaust Stacks)',
      category: 'Powertrain',
      isOuter: false,
      explodeOffset: [1.85, 0.55, 0],
      desc: '180-HP air-cooled 360-cubic-inch horizontally opposed 4-cylinder fuel-injected engine (`engine_cad.glb`) with finned cylinder heads, tubular steel dynafocal mount, and dual stainless exhaust pipes.',
      funFact: 'Unlike a car engine, this airplane engine has NO water radiator—rushing sky air enters the twin nose intakes and cools the metal fins on the cylinders directly!',
      build(g) {
        addEngineCadSubassembly(g, [1.22, 0.08, 0], 0.00105);
        rbox(g, 0.42, 0.24, 0.38, 0.03, alu, [1.22, 0.08, 0]);
        for (const z of [-0.22, 0.22]) {
          cyl(g, 0.068, 0.068, 0.14, 16, crimson, [1.14, 0.10, z], [Math.PI / 2, 0, 0]);
          cyl(g, 0.068, 0.068, 0.14, 16, crimson, [1.30, 0.10, z], [Math.PI / 2, 0, 0]);
          // Stainless steel exhaust pipe stacks exiting underneath the cowling
          tube(
            g,
            [
              [1.22, 0.02, z],
              [1.12, -0.14, z * 0.65],
              [0.98, -0.24, z * 0.45],
            ],
            0.016,
            chromeMat(),
          );
        }
      },
    },
    {
      id: 'two-blade-propeller',
      name: 'McCauley 2-Blade Metal Propeller & Polished Chrome Spinner',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [2.45, 0.1, 0],
      desc: '76-inch twisted aluminum airfoil propeller blades and polished chrome parabolic spinner cone that spin at up to 2,700 RPM in `Drive It!` mode!',
      funFact: 'A propeller blade is twisted from root to tip because the outer tip travels much faster in a circle than the center hub!',
      build(g) {
        const propGroup = new THREE.Group();
        propGroup.position.set(1.56, 0.08, 0);
        propGroup.userData.driveAnim = 'fan';
        g.add(propGroup);

        // Sculpted parabolic chrome spinner via LatheGeometry
        lathe(
          propGroup,
          [
            [-0.02, 0.145],
            [0.08, 0.125],
            [0.18, 0.085],
            [0.26, 0.035],
            [0.30, 0.005],
          ],
          24,
          chromeMat(),
          [0, 0, 0],
        );
        // Twisted tapered aluminum propeller blades with white/red safety tip stripes
        for (const dir of [-1, 1]) {
          box(propGroup, 0.024, 0.68, 0.095, mat(0x1e293b, { metalness: 0.5, roughness: 0.3 }), [0.02, dir * 0.36, 0], [dir * 0.24, 0, 0]);
          box(propGroup, 0.026, 0.08, 0.096, skyWhite, [0.02, dir * 0.64, 0], [dir * 0.24, 0, 0]);
          box(propGroup, 0.027, 0.04, 0.097, crimson, [0.02, dir * 0.66, 0], [dir * 0.24, 0, 0]);
        }
      },
    },
    {
      id: 'monocoque-cabin-fuselage',
      name: 'Sculpted Semi-Monocoque Aluminum Fuselage, Twin-Inlet Nose Cowling & Tailcone',
      category: 'Airframe',
      isOuter: true,
      explodeOffset: [0, 0.25, -1.85],
      desc: 'Continuous sculpted aluminum semi-monocoque fuselage with aerodynamic twin-inlet nose cowling, cabin doors, step-down rear Omni-Vision deck, and tapered tailcone with sweeping crimson/gold livery.',
      funFact: 'Thousands of flush metal rivets hold the thin aluminum skin tightly to the internal bulkheads, longerons, and stringers!',
      build(g) {
        // 1. Sculpted side-profile Cabin & Nose Cowling (x = -0.58 to +1.54, centered at z = 0)
        const cabinProfile = [
          [-0.58, -0.10],
          [-0.58, 0.28],
          [-0.36, 0.52],
          [0.44, 0.52],
          [0.92, 0.22],
          [1.46, 0.16],
          [1.54, 0.08],
          [1.52, -0.06],
          [1.36, -0.14],
          [0.88, -0.16],
          [-0.22, -0.16],
        ];
        extrudeProfile(g, cabinProfile, 0.66, skyWhite, [0, 0, 0], [0, 0, 0], 0.055);

        // Twin cooling air intakes on front of engine cowling + LED landing light lens
        for (const z of [-0.14, 0.14]) {
          rbox(g, 0.06, 0.065, 0.14, 0.015, mat(0x0f172a), [1.53, 0.10, z]);
        }
        cyl(g, 0.036, 0.036, 0.02, 16, emissiveMat(0xfef08a, 1.8), [1.53, -0.01, 0], [0, 0, Math.PI / 2]);

        // 2. Smoothly Lofted Tapered Tailcone (x = -2.02 to -0.36)
        lathe(
          g,
          [
            [-2.02, 0.055],
            [-1.65, 0.11],
            [-1.20, 0.18],
            [-0.75, 0.25],
            [-0.36, 0.31],
          ],
          28,
          skyWhite,
          [0, 0.11, 0],
          undefined,
          [0.88, 1, 1.02],
        );

        // 3. Conformal Crimson, Gold & Navy Speed-Stripe Livery Hugging the Cabin & Tapered Tailcone
        for (const side of [-1, 1]) {
          // Cabin door outlines & chrome latch handles
          rbox(g, 0.58, 0.44, 0.012, 0.01, alu, [0.18, 0.11, side * 0.382]);
          box(g, 0.06, 0.018, 0.02, chromeMat(), [-0.04, 0.14, side * 0.39]);
          // Conformal crimson & gold swooping stripes that follow the narrowing tailcone
          tube(
            g,
            [
              [1.48, 0.06, side * 0.34],
              [0.85, 0.05, side * 0.38],
              [-0.35, 0.07, side * 0.37],
              [-1.15, 0.11, side * 0.19],
              [-1.92, 0.15, side * 0.07],
            ],
            0.026,
            crimson,
          );
          tube(
            g,
            [
              [1.46, 0.11, side * 0.33],
              [0.85, 0.10, side * 0.38],
              [-0.35, 0.12, side * 0.36],
              [-1.15, 0.15, side * 0.18],
              [-1.92, 0.18, side * 0.065],
            ],
            0.014,
            goldStripe,
          );
          tube(
            g,
            [
              [0.82, 0.01, side * 0.38],
              [-0.35, 0.03, side * 0.36],
              [-1.25, 0.08, side * 0.17],
            ],
            0.012,
            navyAccent,
          );
        }
      },
    },
    {
      id: 'garmin-g1000-cockpit',
      name: 'Garmin G1000 NXi Glass Cockpit, Dual Yokes & Vernier Throttle',
      category: 'Avionics & Controls',
      isOuter: false,
      explodeOffset: [0.65, 0.95, 1.35],
      desc: 'Two 10.4-inch LCD displays (Primary Flight Display & Multi-Function Map), dual control yokes, magnetic compass, and push-pull throttle/mixture controls.',
      funFact: 'Flight instructors sit in the right seat with their own steering yoke and rudder pedals to teach student pilots safely!',
      build(g) {
        rbox(g, 0.20, 0.20, 0.62, 0.02, mat(0x1f2937), [0.64, 0.20, 0]);
        rbox(g, 0.03, 0.14, 0.48, 0.01, screenMat('ios'), [0.53, 0.21, 0]);
        for (const z of [-0.16, 0.16]) {
          cyl(g, 0.012, 0.012, 0.12, 10, chromeMat(), [0.47, 0.18, z], [0, 0, Math.PI / 2]);
          rbox(g, 0.03, 0.09, 0.15, 0.015, mat(0x0f172a), [0.41, 0.18, z]);
        }
      },
    },
    {
      id: 'four-seat-interior',
      name: '4-Place Leather Pilot & Passenger Seats & Baggage Bay',
      category: 'Interior',
      isOuter: false,
      explodeOffset: [0, 1.05, 0],
      desc: 'Two front pilot seats on adjustable tracks with inertia-reel harnesses plus a rear bench seat.',
      funFact: 'Even though it is a 4-seat airplane, bush pilots often pack camping gear in the back and fly to remote backcountry grass strips!',
      build(g) {
        const tan = mat(0xd97706, { roughness: 0.52 });
        for (const z of [-0.16, 0.16]) {
          rbox(g, 0.24, 0.30, 0.22, 0.025, tan, [0.22, 0.04, z]);
        }
        rbox(g, 0.24, 0.30, 0.52, 0.025, tan, [-0.18, 0.06, 0]);
      },
    },
    {
      id: 'wraparound-windshield',
      name: 'Free-Blown Acrylic Wraparound Windshield, Cabin & Rear Omni-Vision Windows',
      category: 'Glass',
      isOuter: true,
      explodeOffset: [0.65, 1.45, 0],
      desc: 'Sloped one-piece free-blown acrylic windshield, pilot & passenger side windows, and rear 360° Omni-Vision wraparound window.',
      funFact: 'Cessna introduced the rear wraparound window in 1963 and called it "Omni-Vision" so pilots could see traffic in every direction!',
      build(g) {
        const tintGlass = glassMat(0x38bdf8, 0.44);
        // Sloped conformal front windshield (centered at z = 0)
        const wsProfile = [
          [0.44, 0.51],
          [0.88, 0.22],
          [0.82, 0.19],
          [0.40, 0.46],
        ];
        extrudeProfile(g, wsProfile, 0.64, tintGlass, [0, 0, 0], [0, 0, 0], 0.025);
        // Side front door windows + rear passenger windows (flush on port & starboard cabin walls)
        for (const side of [-1, 1]) {
          rbox(g, 0.44, 0.21, 0.018, 0.02, tintGlass, [0.20, 0.35, side * 0.38]);
          rbox(g, 0.36, 0.18, 0.018, 0.02, tintGlass, [-0.24, 0.34, side * 0.375]);
        }
        // Rear sloped "Omni-Vision" wraparound window behind the cabin roof
        const rearWinProfile = [
          [-0.60, 0.26],
          [-0.36, 0.50],
          [-0.40, 0.45],
          [-0.62, 0.24],
        ];
        extrudeProfile(g, rearWinProfile, 0.54, tintGlass, [0, 0, 0], [0, 0, 0], 0.02);
      },
    },
    {
      id: 'tubular-spring-gear',
      name: 'Tubular Spring-Steel Tricycle Landing Gear & Sculpted Teardrop Wheel Pants',
      category: 'Landing Gear',
      isOuter: false,
      explodeOffset: [0, -1.45, 0],
      desc: 'Fixed bowed spring-steel main gear legs with sculpted teardrop fiberglass wheel fairings ("wheel pants"), spinning tires, and steerable oleo nosewheel.',
      funFact: 'The streamlined fiberglass covers over the tires are nicknamed "wheel pants" and add 5 mph of cruising speed!',
      build(g) {
        const renderWheelPant = (px, py, pz, pantMat, stripeMat) => {
          lathe(
            g,
            [
              [-0.22, 0.012],
              [-0.12, 0.068],
              [0.02, 0.092],
              [0.14, 0.078],
              [0.20, 0.018],
            ],
            20,
            pantMat,
            [px, py, pz],
            undefined,
            [1.0, 1, 0.72],
          );
          box(g, 0.32, 0.016, 0.14, stripeMat, [px - 0.01, py + 0.01, pz]);
        };

        // Steerable Oleo Nose Gear Strut + Torque Scissor Links + Wheel + Sculpted Nose Wheel Pant
        cyl(g, 0.022, 0.022, 0.38, 12, chromeMat(), [1.18, -0.28, 0], [0, 0, 0.14]);
        buildDetailedWheel(g, [1.22, -0.49, 0], {
          tireRadius: 0.105,
          tireWidth: 0.06,
          rimColor: 0xe2e8f0,
          caliperColor: 0xdc2626,
          spokes: 5,
          lugCount: 4,
          includeBrake: false,
          steerable: true,
        });
        renderWheelPant(1.22, -0.46, 0, skyWhite, crimson);

        // Bowed Tubular Spring-Steel Main Gear Legs + Boarding Steps + Main Wheels + Teardrop Wheel Pants
        for (const side of [-1, 1]) {
          tube(
            g,
            [
              [0.06, -0.12, side * 0.24],
              [0.05, -0.28, side * 0.46],
              [0.04, -0.46, side * 0.64],
            ],
            0.022,
            skyWhite,
          );
          // Crew boarding step on forward gear strut
          box(g, 0.06, 0.012, 0.08, chromeMat(), [0.16, -0.26, side * 0.42]);
          buildDetailedWheel(g, [0.04, -0.49, side * 0.66], {
            tireRadius: 0.12,
            tireWidth: 0.07,
            rimColor: 0xe2e8f0,
            caliperColor: 0xdc2626,
            spokes: 6,
            lugCount: 4,
            includeBrake: true,
            steerable: false,
          });
          renderWheelPant(0.04, -0.46, side * 0.66, skyWhite, crimson);
        }
      },
    },
    {
      id: 'fowler-flaps-ailerons',
      name: 'Slotted Para-Lift Fowler Flaps & Frise Ailerons',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-0.65, 1.35, 1.65],
      desc: 'Hinged slotted Fowler flaps and Frise ailerons on the trailing edge of the high wing that roll the plane and slow it down for short runways.',
      funFact: 'Cessna calls its big flaps "Para-Lift" flaps because lowering them 30 degrees makes the plane float down steeply like a parachute!',
      build(g) {
        for (const side of [-1, 1]) {
          // Inboard Slotted Fowler Flap + Outboard Frise Aileron
          rbox(g, 0.14, 0.026, 0.72, 0.006, skyWhite, [-0.18, 0.52, side * 0.74], [0, 0, 0.12]);
          rbox(g, 0.13, 0.024, 0.76, 0.006, crimson, [-0.18, 0.53, side * 1.52]);
        }
      },
    },
    {
      id: 'dorsal-tail-rudder',
      name: 'Swept Dorsal Fin, Tapered Vertical Stabilizer, Rudder & Counterbalanced Elevator',
      category: 'Flight Controls',
      isOuter: false,
      explodeOffset: [-2.15, 0.85, 0],
      desc: 'Classic Cessna swept vertical fin with long dorsal fillet, horn-balanced rudder, red LED beacon, and tapered horizontal stabilizer with elevators.',
      funFact: 'On the ground and in the sky, pilots steer left and right with their feet on the rudder pedals—not with the hand yoke!',
      build(g) {
        // 1. Sculpted Cessna Swept Vertical Stabilizer & Long Dorsal Fillet
        const vTailProfile = [
          [-0.95, 0.21],
          [-1.42, 0.30],
          [-1.88, 0.94],
          [-2.08, 0.94],
          [-2.14, 0.14],
          [-1.92, 0.14],
        ];
        extrudeProfile(g, vTailProfile, 0.044, skyWhite, [0, 0, 0], [0, 0, 0], 0.01);
        // Crimson & Gold diagonal livery bands across the vertical tail fin
        const vStripeProfile = [
          [-1.56, 0.48],
          [-1.84, 0.88],
          [-2.07, 0.88],
          [-2.09, 0.56],
        ];
        extrudeProfile(g, vStripeProfile, 0.048, crimson, [0, 0, 0], [0, 0, 0], 0.006);
        box(g, 0.42, 0.032, 0.05, goldStripe, [-1.84, 0.52, 0], [0, 0, 0.32]);
        // Flashing red anti-collision LED beacon at tip of vertical stabilizer
        rbox(g, 0.22, 0.045, 0.052, 0.015, emissiveMat(0xef4444, 1.6), [-1.98, 0.96, 0]);

        // 2. Tapered Horizontal Stabilizer & Horn-Balanced Elevators (XZ plane)
        const hTailPts = [
          [-1.68, -0.06],
          [-1.86, -0.74],
          [-2.12, -0.74],
          [-2.14, 0],
          [-2.12, 0.74],
          [-1.86, 0.74],
          [-1.68, 0.06],
        ];
        extrudeProfile(g, hTailPts, 0.034, skyWhite, [0, 0.16, 0], [Math.PI / 2, 0, 0], 0.008);
        const hTipPts = [
          [-1.85, -0.75],
          [-2.12, -0.75],
          [-2.12, -0.64],
          [-1.82, -0.64],
        ];
        extrudeProfile(g, hTipPts, 0.036, crimson, [0, 0.16, 0], [Math.PI / 2, 0, 0], 0.005);
        const hTipPtsR = hTipPts.map(([x, z]) => [x, -z]);
        extrudeProfile(g, hTipPtsR, 0.036, crimson, [0, 0.16, 0], [Math.PI / 2, 0, 0], 0.005);
      },
    },
  ];

  return {
    id: 'cessna-172',
    name: 'Cessna 172 Skyhawk',
    brand: 'Cessna',
    badge: '180 HP • High-Wing Trainer',
    desc: 'The world’s most popular training airplane with a cambered NACA 2412 strut-braced high wing, Lycoming 4-cylinder boxer engine CAD, spinning prop, Omni-Vision cabin, and Garmin G1000 cockpit.',
    cameraPos: [4.0, 2.3, 4.1],
    parts,
    quiz: [
      {
        q: 'Why does the Cessna 172 mount its wings on top of the cabin roof?',
        correctId: 'high-wing-airframe',
        distractors: ['tubular-spring-gear', 'four-seat-interior', 'two-blade-propeller'],
      },
      {
        q: 'How is the 4-cylinder Lycoming engine in the nose of a Cessna 172 cooled without a water radiator?',
        correctId: 'lycoming-boxer-engine',
        distractors: ['garmin-g1000-cockpit', 'wraparound-windshield', 'dorsal-tail-rudder'],
      },
      {
        q: 'What are the streamlined fiberglass covers over the Cessna’s fixed tires nicknamed?',
        correctId: 'tubular-spring-gear',
        distractors: ['fowler-flaps-ailerons', 'monocoque-cabin-fuselage', 'four-seat-interior'],
      },
      {
        q: 'Why does a training airplane have two steering yokes side-by-side in the Garmin G1000 cockpit?',
        correctId: 'garmin-g1000-cockpit',
        distractors: ['two-blade-propeller', 'dorsal-tail-rudder', 'high-wing-airframe'],
      },
      {
        q: 'Which part at the very front of the Cessna has twisted airfoil blades that pull the plane through the sky?',
        correctId: 'two-blade-propeller',
        distractors: ['wraparound-windshield', 'fowler-flaps-ailerons', 'four-seat-interior'],
      },
    ],
  };
}

export const AIRPLANE_MODELS = [
  buildBoeing737Max(),
  buildAirbusA350(),
  buildF22RaptorStealth(),
  buildLockheedSR71Blackbird(),
  buildCessna172Skyhawk(),
];

// ============================================================================
// SUBMARINES (3 Deep-Sea & Naval Submersibles — Lofted Teardrop Hulls & Reactors)
// ============================================================================
function buildVirginiaClassSub() {
  const hullAnechoicMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: submarineHullTexture('#151c26'),
    roughness: 0.55,
    metalness: 0.28,
  });
  const antiFoulingRed = carPaint(0x991b1b, { roughness: 0.32, metalness: 0.25 });
  const hy100Steel = brushedMetal(0x94a3b8);
  const brass = brushedMetal(0xd4af37, { metalness: 0.9, roughness: 0.18 });
  const reactorGlow = emissiveMat(0x0ea5e9, 1.45);

  const parts = [
    {
      id: 'hy100-pressure-hull',
      name: 'Teardrop HY-100 Steel Upper Hull, Anechoic Tiles & Escape Trunks',
      category: 'Pressure Hull',
      isOuter: true,
      explodeOffset: [0, 1.5, 0],
      desc: 'Lofted Albacore/teardrop upper hull clad in rubber anechoic acoustic tiles with white DSRV rescue hatch rings and sonar flank arrays.',
      funFact: 'The outer hull is covered in thousands of rubber tiles filled with tiny air voids so enemy sonar pings are absorbed without echoing back!',
      build(g) {
        // Lofted teardrop upper pressure hull via LatheGeometry
        lathe(
          g,
          [
            [-2.25, 0.14],
            [-1.85, 0.34],
            [-1.35, 0.49],
            [-0.8, 0.52],
            [0.95, 0.52],
            [1.45, 0.49],
            [1.75, 0.42],
          ],
          40,
          hullAnechoicMat,
          [0, 0.06, 0],
        );
        // Forward & Aft DSRV Escape Hatch Coamings + Brass Rim Bolts
        for (const xHatch of [0.82, -1.05]) {
          cyl(g, 0.13, 0.13, 0.05, 20, hy100Steel, [xHatch, 0.57, 0]);
          torus(g, 0.13, 0.015, brass, [xHatch, 0.59, 0], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'lower-keel-ballast',
      name: 'Anti-Fouling Red Lower Keel, 9 Ring Stiffeners & Ballast Flood Grates',
      category: 'Buoyancy & Diving',
      isOuter: true,
      explodeOffset: [0, -1.5, 0],
      desc: 'Lower hydro-keel with main ballast flood grates, sacrificial zinc anodes, and 9 internal HY-100 steel ring-frame stiffeners & watertight bulkheads!',
      funFact: 'When a submarine captain yells "Emergency Blow!", high-pressure air blasts the ballast tanks empty so the sub rockets to the surface!',
      build(g) {
        lathe(
          g,
          [
            [-2.22, 0.13],
            [-1.82, 0.32],
            [-1.32, 0.47],
            [-0.8, 0.5],
            [0.95, 0.5],
            [1.45, 0.47],
            [1.72, 0.4],
          ],
          36,
          antiFoulingRed,
          [0, -0.04, 0],
        );
        // 9 Internal HY-100 Steel Ring Stiffeners + 3 Bolted Watertight Compartment Bulkheads
        for (let x = -1.4; x <= 1.4; x += 0.35) {
          torus(g, 0.47, 0.024, hy100Steel, [x, 0.03, 0], [0, Math.PI / 2, 0]);
        }
        for (const bx of [-0.95, -0.15, 0.72]) {
          cyl(g, 0.46, 0.46, 0.03, 28, hy100Steel, [bx, 0.03, 0], [0, 0, Math.PI / 2]);
          torus(g, 0.16, 0.02, brass, [bx, 0.03, 0], [0, Math.PI / 2, 0]);
        }
      },
    },
    {
      id: 'bow-sonar-sphere',
      name: 'Translucent Bow Sonar Dome, Hydrophone Sphere & 4 Torpedo Tubes',
      category: 'Sensors & Payload',
      isOuter: false,
      explodeOffset: [2.35, 0.2, 0],
      desc: 'Translucent composite nose dome over a 3D geodesic brass hydrophone sphere plus 4 brass 533mm torpedo tubes loaded with Mk-48 ADCAP torpedoes!',
      funFact: 'Submarine sonar is so sensitive it can tell the difference between a whale, a rainstorm, and a ship’s propeller 100 miles away!',
      build(g) {
        // Translucent composite bow dome so the internal sonar sphere is visible even when assembled!
        lathe(
          g,
          [
            [1.72, 0.42],
            [1.92, 0.36],
            [2.1, 0.26],
            [2.24, 0.12],
            [2.28, 0.01],
          ],
          32,
          glassMat(0x38bdf8, 0.38),
          [0, 0.03, 0],
        );
        // Geodesic Spherical Hydrophone Array with 36 individual brass transducer nodes
        sphere(g, 0.28, 24, brass, [1.92, 0.04, 0]);
        for (let lat = -1; lat <= 1; lat++) {
          for (let lon = 0; lon < 10; lon++) {
            const a = (lon / 10) * Math.PI * 2;
            const r = Math.cos(lat * 0.55) * 0.29;
            sphere(
              g,
              0.018,
              8,
              chromeMat(),
              [1.92 + Math.cos(a) * r, 0.04 + Math.sin(lat * 0.55) * 0.29, Math.sin(a) * r],
            );
          }
        }
        // 4 Forward 533mm Torpedo Tubes + Green/Gold Mk-48 Torpedoes
        for (const [dy, dz] of [
          [0.14, 0.22],
          [0.14, -0.22],
          [-0.08, 0.22],
          [-0.08, -0.22],
        ]) {
          cyl(g, 0.065, 0.065, 0.56, 16, brass, [1.56, dy, dz], [0, 0, Math.PI / 2]);
          cyl(g, 0.052, 0.052, 0.48, 16, carPaint(0x16a34a), [1.66, dy, dz], [0, 0, Math.PI / 2]);
          cone(g, 0.052, 0.1, 16, brass, [1.92, dy, dz], [0, 0, -Math.PI / 2]);
        }
      },
    },
    {
      id: 'vls-payload-tubes',
      name: 'Virginia Payload Module (VPM) Vertical Launch Tubes & Hatches',
      category: 'Payload Bay',
      isOuter: false,
      explodeOffset: [1.15, 1.45, 0],
      desc: 'Two 87-inch diameter multi-tube vertical payload cylinders with hinged pressure hatches, hydraulic actuators, and 16 flange bolts.',
      funFact: 'The circular deck hatches lock flush with the hull so seawater flows over them silently without a single whistle!',
      build(g) {
        for (const x of [0.95, 1.34]) {
          cyl(g, 0.16, 0.16, 0.72, 24, hy100Steel, [x, 0.18, 0]);
          // Openable top pressure hatch tilted open + red missile canister caps inside
          cyl(g, 0.165, 0.165, 0.035, 24, hullAnechoicMat, [x - 0.1, 0.62, 0], [0, 0, 0.55]);
          for (const [mx, mz] of [
            [0.06, 0.06],
            [-0.06, 0.06],
            [0.06, -0.06],
            [-0.06, -0.06],
          ]) {
            cyl(g, 0.045, 0.045, 0.68, 14, carPaint(0xef4444), [x + mx, 0.21, mz]);
          }
          const hatchBolts = [];
          for (let b = 0; b < 8; b++) {
            const a = (b / 8) * Math.PI * 2;
            hatchBolts.push([x + Math.cos(a) * 0.15, 0.55, Math.sin(a) * 0.15]);
          }
          buildHexBoltArray(g, hatchBolts, { radius: 0.01, height: 0.012, finish: 'gold' });
        }
      },
    },
    {
      id: 'conning-sail-photonics',
      name: 'Hydrodynamic Sail, Fairwater Planes & Telescoping Photonics Masts',
      category: 'Command & Periscopes',
      isOuter: false,
      explodeOffset: [0.42, 1.85, 0],
      desc: 'Sculpted dorsal sail with base fillet, diving planes, open bridge cockpit, and 4 telescoping AN/BVS-1 fiber-optic photonics & radar masts.',
      funFact: 'Instead of peeking through an old brass tube, sailors watch giant HD screens fed by infrared, low-light, and laser cameras on the mast!',
      build(g) {
        // Sculpted hydrodynamic sail airfoil + blended root fillet
        rbox(g, 0.82, 0.66, 0.22, 0.06, hullAnechoicMat, [0.42, 0.68, 0]);
        rbox(g, 0.96, 0.14, 0.34, 0.05, hullAnechoicMat, [0.4, 0.44, 0]);
        // Fairwater diving planes
        box(g, 0.26, 0.035, 0.88, hullAnechoicMat, [0.45, 0.64, 0]);
        // 4 Telescoping Masts: 2 AN/BVS-1 Photonics Masts, ESM Mast, High-Data-Rate SATCOM Mast
        cyl(g, 0.028, 0.028, 0.58, 14, hy100Steel, [0.28, 1.18, 0.04]);
        rbox(g, 0.09, 0.08, 0.08, 0.02, reactorGlow, [0.28, 1.48, 0.04]);
        cyl(g, 0.025, 0.025, 0.5, 14, hy100Steel, [0.44, 1.14, -0.04]);
        sphere(g, 0.048, 14, carPaint(0xf8fafc), [0.44, 1.4, -0.04]);
        cyl(g, 0.022, 0.022, 0.42, 12, brass, [0.58, 1.1, 0.03]);
        cyl(g, 0.02, 0.02, 0.36, 12, hy100Steel, [0.14, 1.08, -0.03]);
      },
    },
    {
      id: 'control-room-quarters',
      name: '3-Deck Command & Control Room, Sonar Consoles & Crew Quarters',
      category: 'Crew Habitation',
      isOuter: false,
      explodeOffset: [0.15, 0.5, 1.85],
      desc: 'Three interior decks with fly-by-wire helm seats, glowing sonar waterfall screens, digital chart table, mess decks, and oxygen generators.',
      funFact: 'Using electricity to split H2O seawater into Hydrogen and Oxygen, a nuclear submarine manufactures its own breathable air for months!',
      build(g) {
        // 3 internal deck floors + vertical ladder + command consoles
        for (const dy of [-0.2, 0.02, 0.24]) {
          rbox(g, 0.92, 0.03, 0.64, 0.01, hy100Steel, [0.2, dy, 0]);
        }
        rbox(g, 0.08, 0.2, 0.52, 0.02, screenMat('dashboard'), [0.52, 0.14, 0]);
        rbox(g, 0.08, 0.18, 0.48, 0.02, screenMat('ios'), [0.05, 0.14, -0.24], [0, Math.PI / 2, 0]);
        // Digital navigation plot table in center of Control Room
        rbox(g, 0.24, 0.12, 0.22, 0.02, reactorGlow, [0.22, 0.1, 0.06]);
      },
    },
    {
      id: 's9g-nuclear-reactor',
      name: 'S9G Pressurized-Water Nuclear Reactor Vessel & Coolant Loops',
      category: 'Nuclear Powerplant',
      isOuter: false,
      explodeOffset: [-0.68, 1.35, -1.45],
      desc: 'Forged reactor pressure vessel with 24 closure-head hex bolts, glowing blue Cherenkov core, control rod drives, and twin steam generators!',
      funFact: 'The S9G reactor core is built with enough nuclear fuel to power the submarine for its entire 33-year service life without ever refueling!',
      build(g) {
        // Reactor Pressure Vessel + Cherenkov Core + 16 Closure Stud Bolts + Control Rod Drive Mechanisms
        cyl(g, 0.28, 0.28, 0.62, 28, hy100Steel, [-0.68, 0.02, 0]);
        cyl(g, 0.22, 0.22, 0.66, 24, reactorGlow, [-0.68, 0.02, 0]);
        torus(g, 0.29, 0.035, brass, [-0.68, 0.22, 0], [Math.PI / 2, 0, 0]);
        const headBolts = [];
        for (let b = 0; b < 16; b++) {
          const a = (b / 16) * Math.PI * 2;
          headBolts.push([-0.68 + Math.cos(a) * 0.26, 0.26, Math.sin(a) * 0.26]);
        }
        buildHexBoltArray(g, headBolts, { radius: 0.011, height: 0.022, finish: 'gold' });
        // Twin vertical Steam Generators + braided primary coolant loop pipes
        for (const side of [-1, 1]) {
          cyl(g, 0.12, 0.12, 0.54, 18, brass, [-0.45, 0.06, side * 0.26]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-0.68, 0.14, 0.22],
              [-0.45, 0.18, 0.26],
              [-1.18, 0.1, 0.22],
            ],
            radius: 0.018,
            color: 0xe2e8f0,
            braided: true,
          },
          {
            points: [
              [-0.68, 0.14, -0.22],
              [-0.45, 0.18, -0.26],
              [-1.18, 0.1, -0.22],
            ],
            radius: 0.018,
            color: 0xe2e8f0,
            braided: true,
          },
        ]);
      },
    },
    {
      id: 'steam-turbines-shaft',
      name: 'Main Steam Turbines, CAD Reduction Gearbox & Propulsion Shaft',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [-1.35, -0.95, 1.45],
      desc: 'High/low-pressure steam turbines coupled to a multi-mesh helical reduction gearbox (`gearbox_cad.glb`) on a sound-isolated raft.',
      funFact: 'The entire turbine room floats on giant rubber shock mounts ("the raft") so mechanical vibrations never leak out into the ocean!',
      build(g) {
        addGearboxCadSubassembly(g, [-1.32, 0.05, 0], 0.015);
        cyl(g, 0.24, 0.32, 0.68, 28, hy100Steel, [-1.32, 0.03, 0], [0, 0, Math.PI / 2]);
        const shaftGroup = new THREE.Group();
        shaftGroup.position.set(-1.68, 0.03, 0);
        shaftGroup.userData.driveAnim = 'crank';
        g.add(shaftGroup);
        cyl(shaftGroup, 0.065, 0.065, 1.1, 18, brass, [0, 0, 0], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'stern-planes-rudder',
      name: 'Cruciform Stern Diving Planes, Rudders & Towed-Array Tube',
      category: 'Flight Controls Underwater',
      isOuter: false,
      explodeOffset: [-2.05, 0.95, 0],
      desc: 'Four cruciform tail fins with movable control surfaces and a starboard towed-sonar-array fairing tube.',
      funFact: 'Underwater, a submarine banks and "flies" through the ocean using the exact same physics of lift and pitch as an aircraft!',
      build(g) {
        box(g, 0.46, 1.16, 0.055, hullAnechoicMat, [-2.02, 0.03, 0]);
        box(g, 0.46, 0.055, 1.18, antiFoulingRed, [-2.02, 0.03, 0]);
        // Towed sonar array dispenser tube along starboard stabilizer tip
        cyl(g, 0.035, 0.035, 0.56, 12, brass, [-2.02, 0.03, 0.59], [0, 0, Math.PI / 2]);
      },
    },
    {
      id: 'pump-jet-propulsor',
      name: 'Shrouded Ducted Pump-Jet Propulsor (Stators + 7 Spinning Rotor Blades)',
      category: 'Silent Propulsion',
      isOuter: false,
      explodeOffset: [-2.55, 0, 0],
      desc: 'Annular hydrodynamic shroud supported by 8 stator vanes around a 7-blade skewed bronze rotor that spins in `Drive It!` mode!',
      funFact: 'When an ordinary propeller spins too fast, low pressure makes tiny boiling bubbles that pop loudly—a pump-jet stops cavitation bubbles!',
      build(g) {
        // Annular Kort nozzle shroud + brass inlet ring + 8 fixed stator guide vanes
        cyl(g, 0.3, 0.26, 0.36, 28, hullAnechoicMat, [-2.46, 0.03, 0], [0, 0, Math.PI / 2]);
        torus(g, 0.29, 0.032, brass, [-2.29, 0.03, 0], [0, Math.PI / 2, 0]);
        for (let s = 0; s < 8; s++) {
          const a = (s / 8) * Math.PI * 2;
          box(g, 0.1, 0.26, 0.02, hy100Steel, [-2.36, 0.03 + Math.sin(a) * 0.14, Math.cos(a) * 0.14], [a, 0, 0]);
        }
        // Spinning 7-blade skewed bronze rotor (`driveAnim = 'fan'`)
        const rotorGroup = new THREE.Group();
        rotorGroup.position.set(-2.5, 0.03, 0);
        rotorGroup.userData.driveAnim = 'fan';
        g.add(rotorGroup);
        cone(rotorGroup, 0.1, 0.26, 20, brass, [-0.06, 0, 0], [0, 0, Math.PI / 2]);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          box(rotorGroup, 0.075, 0.24, 0.032, brass, [0, Math.sin(a) * 0.12, Math.cos(a) * 0.12], [a, 0.48, 0]);
        }
      },
    },
  ];

  return {
    id: 'virginia-ssn-sub',
    name: 'Virginia-Class Nuclear Submarine',
    brand: 'U.S. Navy SSN',
    badge: '800+ Ft Depth • S9G Nuclear Reactor',
    desc: 'Stealth fast-attack submarine with a teardrop anechoic hull, translucent bow sonar dome, Mk-48 torpedo tubes, S9G nuclear reactor, and spinning pump-jet.',
    cameraPos: [4.2, 2.3, 4.3],
    parts,
    quiz: [
      {
        q: 'How does a submarine sink down into the ocean depths and rise back up to the surface?',
        correctId: 'lower-keel-ballast',
        distractors: ['s9g-nuclear-reactor', 'conning-sail-photonics', 'vls-payload-tubes'],
      },
      {
        q: 'Since a military submarine has no windows, how does it "see" and navigate underwater?',
        correctId: 'bow-sonar-sphere',
        distractors: ['pump-jet-propulsor', 'stern-planes-rudder', 'steam-turbines-shaft'],
      },
      {
        q: 'Which part powers the submarine for 33 years without ever needing air or refueling?',
        correctId: 's9g-nuclear-reactor',
        distractors: ['control-room-quarters', 'vls-payload-tubes', 'hy100-pressure-hull'],
      },
      {
        q: 'Why is the rear propeller wrapped inside a cylindrical shroud called a Pump-Jet Propulsor?',
        correctId: 'pump-jet-propulsor',
        distractors: ['bow-sonar-sphere', 'conning-sail-photonics', 'lower-keel-ballast'],
      },
      {
        q: 'What replaced the old-fashioned brass optical periscope inside the Virginia-class submarine’s sail?',
        correctId: 'conning-sail-photonics',
        distractors: ['steam-turbines-shaft', 'stern-planes-rudder', 'hy100-pressure-hull'],
      },
    ],
  };
}

function buildDeepSeaSubmersible() {
  const syntacticWhite = carPaint(0xf8fafc, { roughness: 0.2 });
  const safetyOrange = carPaint(0xff5a00);
  const titaniumMat = brushedMetal(0x94a3b8, { metalness: 0.9, roughness: 0.22 });
  const brass = brushedMetal(0xd4af37);

  const parts = [
    {
      id: 'titanium-personnel-sphere',
      name: '90mm-Thick Grade-5 Titanium Crew Sphere & Conning Hatch',
      category: 'Full-Ocean-Depth Hull',
      isOuter: false,
      explodeOffset: [0.35, 1.35, 0],
      desc: 'Electron-beam-welded 3.5-inch-thick titanium sphere with bolted top entry hatch, 2 crew seats, and life-support scrubbers.',
      funFact: 'At 36,000 feet deep in Challenger Deep, the water pressure is 16,000 PSI—like having 2,500 elephants standing on top of the sub!',
      build(g) {
        sphere(g, 0.66, 36, titaniumMat, [0.35, 0.08, 0]);
        torus(g, 0.28, 0.045, safetyOrange, [0.35, 0.72, 0], [Math.PI / 2, 0, 0]);
        const hatchBolts = [];
        for (let b = 0; b < 12; b++) {
          const a = (b / 12) * Math.PI * 2;
          hatchBolts.push([0.35 + Math.cos(a) * 0.28, 0.76, Math.sin(a) * 0.28]);
        }
        buildHexBoltArray(g, hatchBolts, { radius: 0.011, height: 0.015, finish: 'gold' });
      },
    },
    {
      id: 'syntactic-foam-fairing',
      name: 'Hydrodynamic Syntactic Foam Buoyancy Hull (Glass Microspheres)',
      category: 'Buoyancy & Structure',
      isOuter: true,
      explodeOffset: [-0.45, 1.45, 0],
      desc: 'Streamlined fairing sculpted from epoxy filled with billions of microscopic hollow glass spheres plus titanium structural ribs.',
      funFact: 'Syntactic foam feels as hard as solid rock, yet it floats in water because 50% of its volume is microscopic glass bubbles!',
      build(g) {
        rbox(g, 2.25, 0.96, 1.38, 0.24, syntacticWhite, [-0.15, 0.12, 0]);
        rbox(g, 1.35, 0.34, 0.96, 0.1, safetyOrange, [-0.15, 0.66, 0]);
      },
    },
    {
      id: 'acrylic-conical-viewports',
      name: '3 Conical Acrylic Deep-Sea Viewports & Titanium Bezels',
      category: 'Observation',
      isOuter: false,
      explodeOffset: [1.85, 0.25, 0],
      desc: 'Three thick frustum-cone windows bolted with 12 titanium flange bolts each that wedge tighter into their seats as pressure rises!',
      funFact: 'The outer glass surface is much wider than the inner peek-hole so ocean pressure wedges the window tighter like a bathtub plug!',
      build(g) {
        for (const [dy, dz] of [
          [0.05, 0],
          [-0.12, 0.32],
          [-0.12, -0.32],
        ]) {
          cyl(g, 0.16, 0.09, 0.18, 24, titaniumMat, [0.98, dy, dz], [0, 0, Math.PI / 2]);
          cyl(g, 0.12, 0.07, 0.2, 24, glassMat(0x38bdf8, 0.75), [1.0, dy, dz], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'hydraulic-manipulator-arms',
      name: 'Dual 7-Function Titanium Robotic Claws & Hydraulic Lines',
      category: 'Science & Sampling',
      isOuter: false,
      explodeOffset: [1.95, -0.65, 1.25],
      desc: 'Articulated titanium manipulator arms with braided hydraulic hoses that pick up hydrothermal vent rocks and sediment cores.',
      funFact: 'Scientists also use a gentle underwater vacuum tube called a "slurp gun" to catch fragile deep-sea creatures without hurting them!',
      build(g) {
        for (const side of [-1, 1]) {
          const z = side * 0.56;
          tube(
            g,
            [
              [0.85, -0.26, z],
              [1.38, -0.36, z * 0.9],
              [1.72, -0.22, z * 0.65],
            ],
            0.038,
            titaniumMat,
          );
          box(g, 0.18, 0.03, 0.08, safetyOrange, [1.82, -0.2, z * 0.65], [0, 0, 0.3]);
          box(g, 0.18, 0.03, 0.08, safetyOrange, [1.82, -0.26, z * 0.65], [0, 0, -0.3]);
        }
      },
    },
    {
      id: 'science-sample-basket',
      name: 'Forward Benthic Science Basket & Push-Core Samplers',
      category: 'Science Payload',
      isOuter: false,
      explodeOffset: [1.85, -1.15, 0],
      desc: 'Slide-out titanium tray on the front bumper holding 4 sediment push-core tubes, Niskin water bottles, and temperature probes.',
      funFact: 'More people have walked on the Moon than have visited the deepest Hadal trenches at the bottom of Earth’s oceans!',
      build(g) {
        rbox(g, 0.52, 0.14, 0.96, 0.02, titaniumMat, [1.32, -0.42, 0]);
        for (let z = -0.3; z <= 0.3; z += 0.2) {
          cyl(g, 0.045, 0.045, 0.28, 16, glassMat(0x34d399, 0.72), [1.32, -0.26, z]);
          cyl(g, 0.05, 0.05, 0.04, 16, safetyOrange, [1.32, -0.1, z]);
        }
      },
    },
    {
      id: 'led-floodlight-boom',
      name: '40,000-Lumen Deep-Abyss LED Light Bar & Pan-Tilt 4K Cameras',
      category: 'Lighting & Imaging',
      isOuter: false,
      explodeOffset: [1.65, 1.35, 0],
      desc: 'Zero sunlight reaches deeper than 3,300 feet (the Midnight Zone), so 5 high-output LED floodlights illuminate the pitch-black abyss!',
      funFact: 'Water absorbs red light first, so many deep-sea shrimp and squid are bright red—making them invisible in the dark!',
      build(g) {
        rbox(g, 0.18, 0.12, 1.18, 0.03, titaniumMat, [0.95, 0.62, 0]);
        for (let z = -0.45; z <= 0.45; z += 0.225) {
          cyl(g, 0.06, 0.05, 0.08, 16, emissiveMat(0xffffff, 1.5), [1.05, 0.62, z], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'vectored-electric-thrusters',
      name: '10 Pressure-Tolerant Rim Thrusters with Spinning Propellers',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [-1.75, 0.35, 1.45],
      desc: 'Oil-filled brushless electric thrusters in orange Kort nozzles with spinning 5-blade propellers (`Drive It!`) for 360-degree hovering.',
      funFact: 'The electric motors are filled with non-conductive oil at the exact same pressure as the surrounding ocean so they never crush!',
      build(g) {
        for (const side of [-1, 1]) {
          cyl(g, 0.2, 0.2, 0.26, 24, safetyOrange, [-1.25, 0.1, side * 0.76], [0, 0, Math.PI / 2]);
          const prop = new THREE.Group();
          prop.position.set(-1.25, 0.1, side * 0.76);
          prop.userData.driveAnim = 'fan';
          g.add(prop);
          for (let b = 0; b < 5; b++) {
            const a = (b / 5) * Math.PI * 2;
            box(prop, 0.04, 0.32, 0.025, brass, [0, Math.sin(a) * 0.06, Math.cos(a) * 0.06], [a, 0.35, 0]);
          }
          cyl(g, 0.16, 0.16, 0.2, 20, safetyOrange, [-0.55, 0.52, side * 0.72]);
        }
      },
    },
    {
      id: 'drop-weight-ballast',
      name: 'Fail-Safe Magnetic Drop-Weight Ascent Ballast Plates & Skids',
      category: 'Safety & Ascent',
      isOuter: false,
      explodeOffset: [0, -1.6, 0],
      desc: 'Heavy steel ballast plates held underneath by electromagnets—releasing them makes the sub float effortlessly back to the surface!',
      funFact: 'If the batteries ever lose power, the electromagnets automatically let go of the iron weights so the sub always floats safely home!',
      build(g) {
        rbox(g, 1.65, 0.08, 1.24, 0.02, titaniumMat, [-0.1, -0.48, 0]);
        for (const z of [-0.42, 0.42]) {
          box(g, 0.85, 0.1, 0.22, mat(0x334155), [-0.1, -0.42, z]);
        }
      },
    },
    {
      id: 'silver-zinc-batteries',
      name: 'Oil-Compensated Lithium Battery Pods & HV Orange Harnesses',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-0.45, -1.1, -1.55],
      desc: 'Twin side battery pods wired with pressure-balanced orange SubConn cables provide 65 kWh for 16 hours of deep-trench diving.',
      funFact: 'Every circuit inside the sub is triple-redundant and certified by submarine safety inspectors before every single dive!',
      build(g) {
        for (const side of [-1, 1]) {
          cyl(g, 0.18, 0.18, 1.25, 24, brushedMetal(0x0284c7), [-0.35, -0.22, side * 0.56], [0, 0, Math.PI / 2]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [-0.85, -0.18, 0.56],
              [-0.1, -0.16, 0.48],
              [0.35, -0.05, 0.35],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
          {
            points: [
              [-0.85, -0.18, -0.56],
              [-0.1, -0.16, -0.48],
              [0.35, -0.05, -0.35],
            ],
            radius: 0.018,
            color: 0xff6600,
            companionColor: 0x10b981,
          },
        ]);
      },
    },
    {
      id: 'sonar-usbl-beacon',
      name: 'Multibeam Mapping Sonar, Xenon Strobe & USBL Acoustic Modem',
      category: 'Communications & Mapping',
      isOuter: false,
      explodeOffset: [-1.85, 1.25, 0],
      desc: 'Dorsal stabilizer fin housing an acoustic modem transducer and recovery strobe light.',
      funFact: 'At the bottom of the Mariana Trench (7 miles down), it takes over 7 seconds for a sound message from the sub to reach the ship above!',
      build(g) {
        rbox(g, 0.42, 0.52, 0.08, 0.02, safetyOrange, [-1.22, 0.65, 0]);
        cyl(g, 0.06, 0.06, 0.28, 14, emissiveMat(0xfbbf24, 1.4), [-1.22, 1.02, 0]);
      },
    },
  ];

  return {
    id: 'deep-sea-submersible',
    name: 'DSV Limiting Factor / Alvin Sub',
    brand: 'Triton / WHOI',
    badge: '36,000 Ft • Mariana Trench Grade',
    desc: 'Full-ocean-depth research submersible with a 90mm Grade-5 titanium sphere, syntactic foam hull, robotic claws, and spinning rim thrusters.',
    cameraPos: [3.9, 2.3, 4.0],
    parts,
    quiz: [
      {
        q: 'Which ultra-strong 90mm-thick part protects the crew from 16,000 PSI of crushing pressure in the Mariana Trench?',
        correctId: 'titanium-personnel-sphere',
        distractors: ['science-sample-basket', 'led-floodlight-boom', 'sonar-usbl-beacon'],
      },
      {
        q: 'Why is the white buoyancy hull filled with billions of microscopic glass bubbles ("syntactic foam") instead of hollow air tanks?',
        correctId: 'syntactic-foam-fairing',
        distractors: ['hydraulic-manipulator-arms', 'vectored-electric-thrusters', 'acrylic-conical-viewports'],
      },
      {
        q: 'What happens automatically if the deep-sea submersible’s batteries ever run out of power at the bottom of the ocean?',
        correctId: 'drop-weight-ballast',
        distractors: ['led-floodlight-boom', 'science-sample-basket', 'sonar-usbl-beacon'],
      },
      {
        q: 'Which parts on the front of the submersible let scientists gently pick up hydrothermal vent rocks and sea creatures?',
        correctId: 'hydraulic-manipulator-arms',
        distractors: ['silver-zinc-batteries', 'syntactic-foam-fairing', 'drop-weight-ballast'],
      },
      {
        q: 'Since radio and Wi-Fi waves cannot travel through 7 miles of seawater, how does the sub talk to the surface ship?',
        correctId: 'sonar-usbl-beacon',
        distractors: ['acrylic-conical-viewports', 'science-sample-basket', 'titanium-personnel-sphere'],
      },
    ],
  };
}

function buildNautilusPanoramicSub() {
  const pearlYellow = carPaint(0xfacc15);
  const carbon = carbonFiberMat([4, 4]);
  const alu = brushedMetal(0xe2e8f0);
  const brass = brushedMetal(0xd4af37);

  const parts = [
    {
      id: 'twin-acrylic-spheres',
      name: '360° Transparent Cast-Acrylic Pressure Spheres & Retaining Rings',
      category: 'Panoramic Hull',
      isOuter: true,
      explodeOffset: [0.45, 1.35, 0],
      desc: 'Crystal-clear 6-inch-thick optically cast acrylic spheres with stainless equator clamping rings for a 360-degree coral reef view!',
      funFact: 'Acrylic has almost the exact same refractive index as seawater, so once you dive, the glass dome seems to vanish completely!',
      build(g) {
        const dome = glassMat(0x7dd3fc, 0.38);
        for (const z of [-0.48, 0.48]) {
          sphere(g, 0.64, 36, dome, [0.45, 0.16, z]);
          torus(g, 0.64, 0.018, alu, [0.45, -0.12, z], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'catamaran-pontoons',
      name: 'Twin Catamaran Stability Pontoons, Skids & Titanium Bolts',
      category: 'Structure & Landing',
      isOuter: false,
      explodeOffset: [0, -1.45, 0],
      desc: 'Twin lower sled runners and crossbeams bolted with 16 titanium fasteners protect the acrylic spheres when landing on sandy seabeds.',
      funFact: 'Wide catamaran skids let the sub sit level on the seabed like a lunar lander while filming sharks and shipwrecks!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 2.55, 0.22, 0.34, 0.06, pearlYellow, [0, -0.46, side * 0.78]);
        }
        box(g, 0.18, 0.12, 1.65, alu, [0.55, -0.42, 0]);
        box(g, 0.18, 0.12, 1.65, alu, [-0.65, -0.42, 0]);
        buildHexBoltArray(
          g,
          [
            [0.55, -0.34, 0.78],
            [0.55, -0.34, -0.78],
            [-0.65, -0.34, 0.78],
            [-0.65, -0.34, -0.78],
          ],
          { radius: 0.014, height: 0.018, finish: 'gold' },
        );
      },
    },
    {
      id: 'center-boarding-conning',
      name: 'Central Boarding Bridge & Bolted Watertight Entry Hatches',
      category: 'Access & Safety',
      isOuter: true,
      explodeOffset: [0.25, 1.85, 0],
      desc: 'Non-slip yellow upper deck with twin stainless-steel watertight hatches and handwheels so passengers step inside dry.',
      funFact: 'Inside the acrylic spheres, the air stays at normal 1-atmosphere surface pressure—so your ears never even pop when diving!',
      build(g) {
        rbox(g, 1.45, 0.24, 1.78, 0.06, pearlYellow, [0.1, 0.68, 0]);
        for (const z of [-0.48, 0.48]) {
          cyl(g, 0.24, 0.24, 0.16, 24, alu, [0.45, 0.82, z]);
          torus(g, 0.12, 0.016, brass, [0.45, 0.92, z], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'lounge-swivel-seats',
      name: '6-Passenger Leather Swivel Lounge Seats & Pilot Joystick',
      category: 'Cabin Interior',
      isOuter: false,
      explodeOffset: [0.45, 0.65, 1.65],
      desc: 'Rotating club chairs in each transparent sphere plus pilot joystick console and reef species touchscreens.',
      funFact: 'Because you don’t wear scuba tanks or wetsuits inside, marine biologists can take notes and sip hot cocoa at 1,000 meters deep!',
      build(g) {
        const leather = mat(0x1e293b, { roughness: 0.45 });
        for (const z of [-0.48, 0.48]) {
          cyl(g, 0.46, 0.46, 0.06, 24, carbon, [0.45, -0.18, z]);
          rbox(g, 0.28, 0.34, 0.32, 0.03, leather, [0.38, 0.02, z]);
          rbox(g, 0.06, 0.14, 0.22, 0.015, screenMat('ios'), [0.68, 0.08, z], [0, 0, -0.25]);
        }
      },
    },
    {
      id: 'rim-driven-thrusters',
      name: 'Whisper-Quiet Rim-Driven Electric Thrusters (Spinning Rotors)',
      category: 'Propulsion',
      isOuter: false,
      explodeOffset: [-1.65, 0.25, 1.55],
      desc: 'Four electric thrusters with spinning multi-blade rotors (`Drive It!`) where the magnets are built into the outer shroud.',
      funFact: 'Because the motor magnets are inside the outer ring, the thrusters are whisper-quiet and never scare shy reef sharks away!',
      build(g) {
        for (const side of [-1, 1]) {
          torus(g, 0.22, 0.055, pearlYellow, [-1.05, 0.12, side * 0.88], [0, Math.PI / 2, 0]);
          const prop = new THREE.Group();
          prop.position.set(-1.05, 0.12, side * 0.88);
          prop.userData.driveAnim = 'fan';
          g.add(prop);
          for (let b = 0; b < 6; b++) {
            const a = (b / 6) * Math.PI * 2;
            box(prop, 0.035, 0.36, 0.025, brass, [0, Math.sin(a) * 0.08, Math.cos(a) * 0.08], [a, 0.38, 0]);
          }
          torus(g, 0.18, 0.045, alu, [-0.35, 0.42, side * 0.92], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'hp-air-oxygen-banks',
      name: 'High-Pressure Air & Oxygen Life-Support Cylinders & Manifolds',
      category: 'Life Support & Buoyancy',
      isOuter: false,
      explodeOffset: [-0.95, 0.85, 0],
      desc: '4,500-PSI compressed air bottles for blowing the ballast tanks and CO2 scrubbers plumbed with braided stainless manifolds.',
      funFact: 'Soda-lime chemical crystals inside the scrubber fans absorb the carbon dioxide you breathe out!',
      build(g) {
        const greenBottle = carPaint(0x16a34a);
        for (let z = -0.5; z <= 0.5; z += 0.25) {
          cyl(g, 0.075, 0.075, 0.85, 16, greenBottle, [-0.55, 0.12, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.03, 0.03, 0.08, 12, brass, [-0.1, 0.12, z], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'lithium-phosphate-bank',
      name: 'LiFePO4 Submarine Battery Modules & HV Harnesses',
      category: 'Energy Storage',
      isOuter: false,
      explodeOffset: [-0.45, -1.05, -1.55],
      desc: 'Non-flammable lithium-iron-phosphate battery packs housed inside the lower pontoons with orange high-voltage harnesses.',
      funFact: 'Putting the heavy battery banks inside the bottom skids acts like a sailboat keel so the sub always stays right-side up!',
      build(g) {
        for (const side of [-1, 1]) {
          rbox(g, 1.45, 0.14, 0.24, 0.02, mat(0x0284c7), [-0.1, -0.44, side * 0.78]);
        }
        buildWiringHarness(g, [
          {
            points: [
              [0.45, -0.38, 0.78],
              [-0.35, -0.38, 0.78],
              [-1.05, 0.08, 0.82],
            ],
            radius: 0.016,
            color: 0xff6600,
            companionColor: 0x0284c7,
          },
        ]);
      },
    },
    {
      id: 'reef-matrix-lights',
      name: 'True-Color CRI-95 Reef LED Array & Dual Laser Scalers',
      category: 'Science & Cinema',
      isOuter: false,
      explodeOffset: [1.75, -0.65, 0],
      desc: 'Cinema-grade daylight LEDs restore the vibrant reds and oranges of deep coral reefs, while twin green lasers measure fish sizes!',
      funFact: 'Scientists shine two parallel green laser dots 10 centimeters apart onto a giant shark or squid to measure its exact length on video!',
      build(g) {
        rbox(g, 0.16, 0.1, 1.38, 0.02, alu, [1.08, -0.24, 0]);
        for (let z = -0.55; z <= 0.55; z += 0.22) {
          sphere(g, 0.055, 14, emissiveMat(0xffffff, 1.4), [1.15, -0.24, z]);
        }
      },
    },
    {
      id: 'aft-hydrodynamic-tail',
      name: 'Aft Hydrodynamic Fairing & Twin Stabilizer Fins',
      category: 'Hydrodynamics',
      isOuter: true,
      explodeOffset: [-1.85, 0.45, 0],
      desc: 'Streamlined yellow tail fairing and vertical stabilizer fins keep the panoramic sub tracking straight in ocean currents.',
      funFact: 'Bright yellow is the easiest color for surface recovery divers and helicopters to spot against deep blue ocean water!',
      build(g) {
        rbox(g, 0.95, 0.54, 1.56, 0.1, pearlYellow, [-0.95, 0.14, 0]);
        for (const side of [-1, 1]) {
          box(g, 0.52, 0.62, 0.05, pearlYellow, [-1.35, 0.42, side * 0.68]);
        }
      },
    },
    {
      id: 'surface-buoy-winch',
      name: 'Emergency Release Surface Buoy & Forward Sonar Pod',
      category: 'Safety & Navigation',
      isOuter: false,
      explodeOffset: [-1.15, 1.55, 0],
      desc: 'Forward-looking obstacle-avoidance sonar plus a pop-up Kevlar-tethered radio beacon buoy.',
      funFact: 'Before ascending, the pilot checks upward-looking sonar to make sure no boats or whales are swimming right above!',
      build(g) {
        cyl(g, 0.16, 0.16, 0.22, 20, carPaint(0xef4444), [-0.75, 0.56, 0]);
      },
    },
  ];

  return {
    id: 'nautilus-panoramic-sub',
    name: 'Nautilus Panoramic Explorer Sub',
    brand: 'Triton / U-Boat Worx',
    badge: '3,300 Ft • 360° Acrylic Spheres',
    desc: 'Marine-biology panoramic submersible featuring twin 360-degree transparent acrylic spheres, swivel lounge seats, and spinning rim thrusters.',
    cameraPos: [3.9, 2.3, 4.0],
    parts,
    quiz: [
      {
        q: 'Why do the 6-inch-thick transparent acrylic spheres seem to disappear completely once the submarine is underwater?',
        correctId: 'twin-acrylic-spheres',
        distractors: ['catamaran-pontoons', 'aft-hydrodynamic-tail', 'hp-air-oxygen-banks'],
      },
      {
        q: 'Why do marine biologists shine two parallel green laser dots from the front light bar onto deep-sea sharks?',
        correctId: 'reef-matrix-lights',
        distractors: ['lounge-swivel-seats', 'center-boarding-conning', 'lithium-phosphate-bank'],
      },
      {
        q: 'What makes the hubless Rim-Driven Electric Thrusters so great for filming shy ocean wildlife?',
        correctId: 'rim-driven-thrusters',
        distractors: ['surface-buoy-winch', 'catamaran-pontoons', 'hp-air-oxygen-banks'],
      },
      {
        q: 'Where are the heavy LiFePO4 batteries placed so the submarine always stays right-side up like a sailboat keel?',
        correctId: 'lithium-phosphate-bank',
        distractors: ['center-boarding-conning', 'twin-acrylic-spheres', 'surface-buoy-winch'],
      },
      {
        q: 'Why do passengers’ ears never pop inside the Nautilus Panoramic Sub even at 3,300 feet deep?',
        correctId: 'center-boarding-conning',
        distractors: ['aft-hydrodynamic-tail', 'reef-matrix-lights', 'catamaran-pontoons'],
      },
    ],
  };
}

export const SUBMARINE_MODELS = [
  buildVirginiaClassSub(),
  buildDeepSeaSubmersible(),
  buildNautilusPanoramicSub(),
];
