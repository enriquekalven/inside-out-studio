// CAD-Fidelity 3D Ships & Ocean Liners (`ships`) and Everyday Machines (`everyday`) Models for Inside Out Studio.
import * as THREE from '../../vendor/three.module.js';
import {
  mat, carPaint, brushedMetal, chromeMat, glassMat, emissiveMat,
  box, rbox, cyl, sphere, torus, cone, tube, lathe, extrudeProfile, buildCoilSpring,
} from '../materials.js';
import { populateEngineCad, populateGearboxCad } from '../cad_loader.js';

function buildNavalHull(g, {
  length = 4.2,
  beam = 0.82,
  upperDraft = 0.34,
  lowerDraft = 0.22,
  upperMat,
  lowerMat,
  sheerMat = null,
  deckMat = null,
  bulbousBow = true,
  forecastle = false,
  rakedYachtBow = false,
  portholeRows = 2,
} = {}) {
  const hl = length * 0.5;
  const hb = beam * 0.5;

  const makeWaterlinePts = (lenScale, beamScale, sternPinch = 0.44, bowTipScale = 1.0) => [
    [-hl * lenScale, -hb * beamScale * sternPinch],
    [-hl * lenScale * 0.90, -hb * beamScale * 0.84],
    [-hl * lenScale * 0.58, -hb * beamScale],
    [hl * lenScale * 0.34, -hb * beamScale],
    [hl * lenScale * 0.68, -hb * beamScale * 0.72],
    [hl * lenScale * 0.90, -hb * beamScale * 0.28],
    [hl * lenScale * bowTipScale, 0],
    [hl * lenScale * 0.90, hb * beamScale * 0.28],
    [hl * lenScale * 0.68, hb * beamScale * 0.72],
    [hl * lenScale * 0.34, hb * beamScale],
    [-hl * lenScale * 0.58, hb * beamScale],
    [-hl * lenScale * 0.90, hb * beamScale * 0.84],
    [-hl * lenScale, hb * beamScale * sternPinch],
  ];

  // Smooth 6-layer multi-waterline stepped/beveled marine topsides & anti-fouling lower hull
  const upperTopPts = makeWaterlinePts(1.0, 1.0, 0.48, rakedYachtBow ? 1.035 : 1.01);
  const upperMidPts = makeWaterlinePts(0.992, 0.985, 0.46, rakedYachtBow ? 1.015 : 0.995);
  const upperLowPts = makeWaterlinePts(0.982, 0.96, 0.43, 0.98);
  const bootTopPts = makeWaterlinePts(0.974, 0.935, 0.40, 0.97);
  const lowerMidPts = makeWaterlinePts(0.962, 0.89, 0.35, bulbousBow ? 0.995 : 0.95);
  const keelPts = makeWaterlinePts(0.935, 0.78, 0.26, bulbousBow ? 0.985 : 0.92);

  extrudeProfile(g, upperTopPts, upperDraft * 0.42, upperMat, [0, 0.04, 0], [Math.PI / 2, 0, 0], 0.018);
  extrudeProfile(g, upperMidPts, upperDraft * 0.42, upperMat, [-0.008, -upperDraft * 0.24, 0], [Math.PI / 2, 0, 0], 0.018);
  extrudeProfile(g, upperLowPts, upperDraft * 0.40, upperMat, [-0.016, -upperDraft * 0.52, 0], [Math.PI / 2, 0, 0], 0.018);

  // Crisp white/brass boot-top waterline stripe separating upper topsides and anti-fouling lower hull
  const bootMat = sheerMat || mat(0xf8fafc, { roughness: 0.22, metalness: 0.12 });
  extrudeProfile(g, bootTopPts, 0.028, bootMat, [-0.022, -upperDraft * 0.78, 0], [Math.PI / 2, 0, 0], 0.005);

  // Lower anti-fouling hull + flat keel bottom + bilge keels
  extrudeProfile(g, lowerMidPts, lowerDraft * 0.65, lowerMat, [-0.030, -upperDraft * 0.84 - lowerDraft * 0.22, 0], [Math.PI / 2, 0, 0], 0.018);
  extrudeProfile(g, keelPts, lowerDraft * 0.52, lowerMat, [-0.045, -upperDraft * 0.84 - lowerDraft * 0.66, 0], [Math.PI / 2, 0, 0], 0.016);

  // Hydrodynamic bilge keels along port & starboard turn of the bilge
  for (const s of [-1, 1]) {
    box(g, length * 0.44, 0.016, 0.042, lowerMat, [-0.05, -upperDraft * 0.85 - lowerDraft * 0.45, s * hb * 0.84], [s * 0.35, 0, 0]);
  }

  if (sheerMat) {
    const sheerPts = makeWaterlinePts(1.003, 1.008, 0.49, rakedYachtBow ? 1.038 : 1.012);
    extrudeProfile(g, sheerPts, 0.022, sheerMat, [0, 0.095, 0], [Math.PI / 2, 0, 0], 0.005);
  }
  if (deckMat) {
    const deckPts = makeWaterlinePts(0.988, 0.965, 0.46, rakedYachtBow ? 1.02 : 0.995);
    extrudeProfile(g, deckPts, 0.022, deckMat, [0, 0.116, 0], [Math.PI / 2, 0, 0], 0.004);
  }
  if (forecastle) {
    const fPts = [
      [hl * 0.42, -hb * 0.95],
      [hl * 0.68, -hb * 0.72],
      [hl * 0.90, -hb * 0.29],
      [hl * 1.015, 0],
      [hl * 0.90, hb * 0.29],
      [hl * 0.68, hb * 0.72],
      [hl * 0.42, hb * 0.95],
    ];
    extrudeProfile(g, fPts, 0.088, upperMat, [0, 0.145, 0], [Math.PI / 2, 0, 0], 0.012);
    if (deckMat) {
      extrudeProfile(g, fPts.map(([x, z]) => [x * 0.992, z * 0.95]), 0.016, deckMat, [0, 0.192, 0], [Math.PI / 2, 0, 0], 0.004);
    }
    // Foredeck windlass, anchor chains & mooring bollards
    const darkIron = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.28 });
    for (const s of [-1, 1]) {
      cyl(g, 0.022, 0.026, 0.036, 12, darkIron, [hl * 0.76, 0.21, s * hb * 0.22]);
      cyl(g, 0.012, 0.012, 0.028, 10, darkIron, [hl * 0.62, 0.205, s * hb * 0.48]);
      cyl(g, 0.012, 0.012, 0.028, 10, darkIron, [hl * 0.66, 0.205, s * hb * 0.44]);
    }
  }
  // Port & Starboard Recessed Anchor Pockets, Stockless Bower Anchors & White Draft Marks
  const anchorMat = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.28 });
  const whiteMark = mat(0xf8fafc, { roughness: 0.3 });
  for (const s of [-1, 1]) {
    rbox(g, 0.075, 0.058, 0.020, 0.006, anchorMat, [hl * 0.83, 0.015, s * (hb * 0.44)], [0, s * 0.42, 0]);
    cyl(g, 0.010, 0.010, 0.075, 10, anchorMat, [hl * 0.83, -0.005, s * (hb * 0.46)], [0, 0, 0.3]);
    // White naval draft mark ticks at bow & stern waterline
    for (let dm = 0; dm < 5; dm++) {
      box(g, 0.024, 0.006, 0.006, whiteMark, [hl * 0.90 - dm * 0.012, -upperDraft * 0.92 + dm * 0.028, s * (hb * 0.28)]);
      box(g, 0.024, 0.006, 0.006, whiteMark, [-hl * 0.88, -upperDraft * 0.92 + dm * 0.028, s * (hb * 0.72)]);
    }
  }
  // Illuminated hull porthole rows along port and starboard topsides
  if (portholeRows > 0) {
    const portholeGlow = emissiveMat(0xfef08a, 0.75);
    for (let i = -12; i <= 12; i++) {
      const px = i * (length * 0.032);
      const frac = Math.abs(px) / hl;
      const hz = hb * (frac > 0.36 ? Math.max(0.28, 1.0 - (frac - 0.36) * 0.95) : 0.99);
      for (const s of [-1, 1]) {
        cyl(g, 0.009, 0.009, 0.008, 10, portholeGlow, [px, 0.025, s * hz], [Math.PI / 2, 0, 0]);
        if (portholeRows > 1 && i % 2 === 0) {
          cyl(g, 0.008, 0.008, 0.008, 10, portholeGlow, [px, -0.035, s * (hz * 0.97)], [Math.PI / 2, 0, 0]);
        }
      }
    }
  }
  if (bulbousBow) {
    // Integrated hydrodynamic teardrop bulbous bow faired smoothly into lower stem (no protruding red hotdog!)
    const bulbY = -upperDraft * 0.82 - lowerDraft * 0.45;
    lathe(
      g,
      [
        [-0.22, 0.01],
        [-0.12, 0.072],
        [0.02, 0.082],
        [0.12, 0.068],
        [0.18, 0.002],
      ],
      20,
      lowerMat,
      [hl * 0.86, bulbY, 0],
      [0, 0, -Math.PI / 2],
      [1, 1.05, 0.78],
    );
    // Bow thruster tunnels with protective cross-grilles
    const darkHole = mat(0x0f172a, { roughness: 0.85 });
    for (const dx of [hl * 0.68, hl * 0.75, hl * 0.82]) {
      cyl(g, 0.032, 0.032, hb * 0.82, 16, darkHole, [dx, bulbY + 0.02, 0], [Math.PI / 2, 0, 0]);
    }
  }
}

function buildMarinePropeller(g, { x = -2.05, y = -0.34, z = 0, r = 0.16, blades = 5 } = {}) {
  const bronze = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const spin = new THREE.Group();
  spin.position.set(x, y, z);
  spin.userData.driveAnim = 'fan';
  g.add(spin);
  cyl(spin, r * 0.28, r * 0.22, 0.12, 18, bronze, [0, 0, 0], [0, 0, Math.PI / 2]);
  sphere(spin, r * 0.22, 14, 12, bronze, [-0.06, 0, 0]);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    box(spin, 0.022, r * 0.92, r * 0.38, bronze, [0, Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52], [a + 0.45, 0.28, 0]);
  }
}

function buildAzipodThruster(g, { x = -1.92, y = -0.36, z = 0, r = 0.12, podMat } = {}) {
  const pMat = podMat || brushedMetal(0x1e3a8a, { metalness: 0.75, roughness: 0.25 });
  // Vertical steering strut + streamlined underwater electric motor nacelle
  rbox(g, 0.16, 0.16, 0.045, 0.015, pMat, [x, y + 0.10, z]);
  cyl(g, r * 0.58, r * 0.52, 0.32, 20, pMat, [x, y, z], [0, 0, Math.PI / 2]);
  sphere(g, r * 0.52, 16, 12, pMat, [x - 0.16, y, z]);
  buildMarinePropeller(g, { x: x + 0.17, y, z, r, blades: 5 });
}

function buildSpecModel(cfg) {
  const primary = carPaint(cfg.primaryHex);
  const accent = carPaint(cfg.accentHex || 0xdc2626);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const brass = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const copper = brushedMetal(0xb45309, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.22 });
  const silver = brushedMetal(0xe2e8f0, { metalness: 0.82, roughness: 0.18 });
  const chrome = chromeMat();
  const white = mat(0xf8fafc, { roughness: 0.22, metalness: 0.1 });
  const teak = mat(0xb45309, { roughness: 0.58, metalness: 0.06 });
  const glass = glassMat(0x38bdf8, 0.42);
  const darkGlass = glassMat(0x0f172a, 0.62);
  const poolWater = emissiveMat(0x06b6d4, 0.35);
  const parts = cfg.partsSpec.map(([id, name, category, isOuter, explodeOffset, desc, funFact, fn]) => ({
    id, name, category, isOuter, explodeOffset, desc, funFact,
    build(g) { fn(g, { primary, accent, darkSteel, brass, copper, alu, silver, chrome, white, teak, glass, darkGlass, poolWater }); },
  }));
  return { id: cfg.id, name: cfg.name, brand: cfg.brand, badge: cfg.badge, desc: cfg.desc, cameraPos: cfg.cameraPos || [4.1, 2.3, 4.2], parts, quiz: cfg.quiz };
}

export const SHIP_MODELS = [
  buildSpecModel({
    id: 'quantum-of-the-seas',
    name: 'Royal Caribbean Quantum of the Seas',
    brand: 'Royal Caribbean International • Meyer Werft',
    badge: '348m • 168,666 GT • North Star Capsule • Twin Azipods',
    desc: '16-deck smart mega-cruise liner featuring the North Star 300-foot glass observation capsule crane, Two70° aft floor-to-ceiling glass lounge, RipCord by iFLY skydiving wind tunnel, FlowRider surf simulator, and twin 20.5-MW ABB Azipod thrusters.',
    primaryHex: 0x1d4ed8,
    accentHex: 0x991b1b,
    cameraPos: [4.25, 2.25, 4.35],
    partsSpec: [
      ['hydrodynamic-cruise-hull', '348-Meter Hydrodynamic Cruise Hull, Bulbous Bow & 3× Bow Thrusters', 'Hull Architecture', true, [0, -1.45, 0], 'High-tensile steel cruise hull in Royal Caribbean blue-and-white livery with an air-lubrication microbubble keel, faired bulbous bow, and 3 transverse bow thrusters.', 'Quantum of the Seas pumps millions of microscopic air bubbles under her flat bottom so the ship glides on a friction-reducing carpet of air!', (g, m) => {
        buildNavalHull(g, {
          length: 4.38, beam: 0.82, upperDraft: 0.34, lowerDraft: 0.22,
          upperMat: m.white, lowerMat: m.accent, sheerMat: m.primary, deckMat: m.teak,
          bulbousBow: true, forecastle: true, portholeRows: 2,
        });
        // Contour-following Royal Caribbean blue hull sheer accent & bow helipad marking (no protruding rectangular slabs!)
        cyl(g, 0.16, 0.16, 0.012, 24, m.darkSteel, [1.72, 0.205, 0]);
        torus(g, 0.13, 0.005, carPaint(0xfacc15), [1.72, 0.212, 0], [Math.PI / 2, 0, 0]);
      }],
      ['balcony-stateroom-superstructure', '14-Deck Tiered Balcony Stateroom Superstructure & Flying Bridge', 'Passenger Decks', true, [0, 0.95, -1.35], 'Multi-tier white passenger superstructure containing 2,090 staterooms with private blue-glass verandas, raked forward observation bow, and an aerodynamic enclosed flying bridge.', 'Even the interior staterooms with no outside window have floor-to-ceiling 4K LED "Virtual Balconies" streaming live ocean views in real time!', (g, m) => {
        // 8 stacked architectural stateroom deck tiers with raked forward bow front & recessed blue-glass balcony ribbons
        for (let d = 0; d < 8; d++) {
          const y = 0.16 + d * 0.056;
          const foreX = 1.28 - d * 0.045;
          const aftX = -1.62 + (d > 4 ? (d - 4) * 0.05 : 0);
          const hb = 0.38 - (d > 4 ? (d - 4) * 0.012 : 0);
          const tierPts = [
            [aftX, -hb * 0.92],
            [aftX + 0.16, -hb],
            [foreX - 0.28, -hb],
            [foreX, -hb * 0.58],
            [foreX + 0.12, 0],
            [foreX, hb * 0.58],
            [foreX - 0.28, hb],
            [aftX + 0.16, hb],
            [aftX, hb * 0.92],
          ];
          extrudeProfile(g, tierPts, 0.032, m.white, [0, y, 0], [Math.PI / 2, 0, 0], 0.008);
          extrudeProfile(g, tierPts.map(([x, z]) => [x * 0.992, z * 1.015]), 0.022, m.glass, [0, y + 0.018, 0], [Math.PI / 2, 0, 0], 0.005);
          // Vertical white cabin balcony dividers along port & starboard flanks
          for (let b = -12; b <= 10; b++) {
            const bx = b * 0.11;
            if (bx > aftX + 0.18 && bx < foreX - 0.25) {
              box(g, 0.007, 0.050, hb * 2.04, m.white, [bx, y + 0.01, 0]);
            }
          }
        }
        // Aerodynamic Enclosed Navigation Bridge with wide port/starboard glass-floor wing lookouts & radar mast
        rbox(g, 0.28, 0.075, 1.02, 0.022, m.white, [1.14, 0.52, 0]);
        rbox(g, 0.24, 0.045, 0.99, 0.014, m.darkGlass, [1.18, 0.525, 0]);
        for (const s of [-1, 1]) {
          sphere(g, 0.014, 10, 10, emissiveMat(s > 0 ? 0xef4444 : 0x22c55e, 1.6), [1.16, 0.53, s * 0.52]);
        }
        // Forward bridge radar mast + 3 white Satcom radomes + X-band/S-band radar bars
        cyl(g, 0.016, 0.032, 0.28, 14, m.white, [0.98, 0.74, 0], [0, 0, 0.25]);
        for (const z of [-0.18, 0, 0.18]) {
          sphere(g, 0.042, 16, 12, m.white, [1.04, 0.66, z]);
        }
      }],
      ['north-star-observation-capsule', 'North Star Articulated Crane Arm & Jewel-Shaped Glass Observation Pod', 'Signature Attraction', true, [0.55, 1.85, 0], '41-meter hydraulic articulated steel boom mounted forward on Deck 15 that lifts a 14-passenger faceted glass capsule 300 feet above the ocean.', 'The North Star glass pod swings out over the side of the ship and rises 300 feet above sea level—winning the Guinness World Record for highest viewing deck on a cruise ship!', (g, m) => {
        // Turntable pedestal & hydraulic slew ring on Deck 15
        cyl(g, 0.10, 0.13, 0.11, 22, m.white, [0.64, 0.65, 0]);
        cyl(g, 0.08, 0.08, 0.04, 18, m.primary, [0.64, 0.71, 0]);
        // Sculpted tapered box-section hydraulic boom arm + dual chrome lift rams
        tube(g, [[0.64, 0.72, 0], [0.88, 1.04, 0.06], [1.08, 1.26, 0.12]], 0.028, m.white);
        cyl(g, 0.015, 0.015, 0.34, 12, m.chrome, [0.76, 0.86, 0.03], [0, 0, -0.58]);
        // Faceted jewel-like glass observation capsule with white structural meridians & passenger viewing ring
        sphere(g, 0.11, 20, 16, m.glass, [1.11, 1.30, 0.13]);
        torus(g, 0.112, 0.010, m.white, [1.11, 1.30, 0.13], [Math.PI / 2, 0, 0]);
        torus(g, 0.112, 0.010, m.white, [1.11, 1.30, 0.13], [0, 0, 0]);
        torus(g, 0.075, 0.008, m.brass, [1.11, 1.26, 0.13], [Math.PI / 2, 0, 0]);
      }],
      ['two70-aft-glass-lounge', 'Two70° Three-Deck Aft Panoramic Glass Lounge, SeaPlex & Bionic Bar', 'Entertainment Venues', false, [-1.45, 0.95, 1.15], 'Three-story stern amphitheater wrapped in 270-degree structural glass walls with 6 robotic RoboScreens, plus the midship SeaPlex bumper-car arena.', 'At night, the giant 270-degree glass windows at the stern transform into a 100-foot-wide digital projection screen called Vistarama while 6 KUKA robot arms dance with LED screens!', (g, m) => {
        // Aft Two70 panoramic wrap-around structural glass wall & white mullions
        cyl(g, 0.35, 0.37, 0.24, 28, m.glass, [-1.62, 0.30, 0]);
        for (let r = 0; r < 4; r++) {
          torus(g, 0.365, 0.008, m.white, [-1.62, 0.19 + r * 0.072, 0], [Math.PI / 2, 0, 0]);
        }
        // SeaPlex indoor sports court & Bionic Bar upper deckhouse
        rbox(g, 0.62, 0.12, 0.56, 0.02, m.white, [-0.62, 0.64, 0]);
        rbox(g, 0.56, 0.075, 0.58, 0.012, m.glass, [-0.62, 0.645, 0]);
      }],
      ['ripcord-ifly-skydiving-solarium', 'RipCord by iFLY Skydiving Tunnel, FlowRider Surf Wave & Glass Solarium', 'Resort Deck & SkyDiving', true, [0.15, 1.65, 1.15], 'Vertical recirculation skydiving wind tunnel at the stern, FlowRider surf simulator, twin resort pools with outdoor cinema screen, and stepped forward glass Solarium conservatory.', 'A 1,000-horsepower vertical wind fan at the stern blows a 120-mph column of air straight up a glass tube so passengers can skydive in mid-air at sea!', (g, m) => {
        // Forward stepped glass Solarium conservatory domes with white spaceframe ribs
        for (let i = 0; i < 4; i++) {
          rbox(g, 0.24, 0.055, 0.64 - i * 0.06, 0.022, m.glass, [0.88 + i * 0.13, 0.63 - i * 0.015, 0]);
          rbox(g, 0.015, 0.058, 0.65 - i * 0.06, 0.005, m.white, [0.88 + i * 0.13, 0.63 - i * 0.015, 0]);
        }
        // Midship open resort pool deck with 2 glowing turquoise swimming pools, 4 whirlpools, sunbeds & outdoor LED Movie Screen
        rbox(g, 1.15, 0.024, 0.72, 0.008, m.teak, [0.08, 0.60, 0]);
        for (const px of [-0.16, 0.28]) {
          rbox(g, 0.28, 0.028, 0.24, 0.01, m.poolWater, [px, 0.612, 0]);
          for (const sz of [-0.22, 0.22]) {
            cyl(g, 0.045, 0.045, 0.026, 14, m.poolWater, [px, 0.612, sz]);
          }
        }
        rbox(g, 0.025, 0.11, 0.22, 0.006, emissiveMat(0x38bdf8, 1.4), [0.06, 0.68, 0]);
        // Aft RipCord by iFLY glass vertical skydiving wind tunnel + FlowRider wave ramp
        cyl(g, 0.082, 0.082, 0.32, 20, m.glass, [-1.35, 0.74, 0]);
        cyl(g, 0.092, 0.092, 0.055, 20, m.primary, [-1.35, 0.90, 0]);
        rbox(g, 0.28, 0.055, 0.24, 0.014, m.poolWater, [-1.58, 0.63, 0], [0, 0, -0.22]);
      }],
      ['tender-lifeboats-muster-deck', '18× High-Capacity Yellow Catamaran Lifeboats & Gravity Davits', 'Safety & Evacuation', true, [0, 0.25, 1.55], 'Eighteen unsinkable 370-person enclosed yellow lifeboat tenders tucked into the Deck 5 promenade recesses on hydraulic davits.', 'Unlike traditional small lifeboats, each of Quantum’s giant yellow catamaran rescue boats has twin diesel engines and seats 370 people—more than a Boeing 777!', (g, m) => {
        const yellow = carPaint(0xfacc15);
        for (let i = 0; i < 9; i++) {
          const x = -1.24 + i * 0.27;
          for (const s of [-1, 1]) {
            rbox(g, 0.21, 0.052, 0.062, 0.018, yellow, [x, 0.185, s * 0.385]);
            rbox(g, 0.15, 0.024, 0.046, 0.008, m.white, [x, 0.212, s * 0.385]);
            box(g, 0.012, 0.065, 0.04, m.white, [x - 0.08, 0.20, s * 0.37]);
            box(g, 0.012, 0.065, 0.04, m.white, [x + 0.08, 0.20, s * 0.37]);
          }
        }
      }],
      ['royal-esplanade-atrium', 'Royal Esplanade Multi-Deck Shopping Boulevard & Dining Cutaway', 'Interior Cutaway', false, [0, -0.45, 1.55], 'Internal multi-deck indoor boulevard spanning the length of Decks 4 and 5 with boutiques, cafés, Royal Theater stage, and glass elevators.', 'Inside the hull runs an indoor city street three stories tall with cobblestone walkways, patisseries, and a 1,300-seat Broadway theater in the bow!', (g, m) => {
        rbox(g, 2.75, 0.18, 0.56, 0.02, m.brass, [-0.05, 0.04, 0]);
        for (let i = -4; i <= 4; i++) {
          cyl(g, 0.020, 0.020, 0.18, 12, m.chrome, [i * 0.28, 0.04, -0.22]);
          cyl(g, 0.020, 0.020, 0.18, 12, m.chrome, [i * 0.28, 0.04, 0.22]);
        }
      }],
      ['diesel-electric-azipod-plant', '4× Wärtsilä Diesel-Electric Generators (CAD), Scrubber Funnel & Twin 20.5-MW Azipods', 'Propulsion & Power', false, [-1.85, -0.85, 0], 'Four Wärtsilä marine diesel generators (`populateEngineCad`), swept royal-blue exhaust funnel with Crown & Anchor emblem, and twin 360°-steerable ABB Azipod electric thruster pods.', 'Quantum of the Seas has no rudder and no long propeller shafts—instead, two giant 28,000-hp electric motors hang in 360-degree rotating pods underneath the stern!', (g, m) => {
        populateEngineCad(g, { pos: [-0.85, -0.14, 0], scale: 0.002, primaryColor: 0x1d4ed8 });
        // Swept Royal Blue Funnel with white aerodynamic cowling, Crown & Anchor gold medallion, and quad silver exhaust pipes
        rbox(g, 0.38, 0.34, 0.22, 0.045, m.primary, [-1.02, 0.78, 0], [0, 0, 0.26]);
        rbox(g, 0.42, 0.06, 0.24, 0.02, m.white, [-1.00, 0.65, 0], [0, 0, 0.12]);
        for (const s of [-1, 1]) {
          torus(g, 0.055, 0.008, m.brass, [-1.02, 0.78, s * 0.115]);
        }
        for (const z of [-0.05, 0.05]) cyl(g, 0.028, 0.028, 0.15, 14, m.silver, [-1.06, 0.96, z], [0, 0, 0.26]);
        // Twin 360° steerable ABB Azipods under the stern
        for (const z of [-0.20, 0.20]) {
          buildAzipodThruster(g, { x: -1.88, y: -0.38, z, r: 0.125, podMat: m.primary });
        }
      }],
    ],
    quiz: [
      { q: 'Which signature attraction on Quantum of the Seas lifts a jewel-shaped glass capsule 300 feet above the ocean on a hydraulic crane arm?', correctId: 'north-star-observation-capsule', distractors: ['two70-aft-glass-lounge', 'ripcord-ifly-skydiving-solarium', 'balcony-stateroom-superstructure'] },
      { q: 'How does Quantum of the Seas steer and propel herself without a traditional rudder or long propeller shafts?', correctId: 'diesel-electric-azipod-plant', distractors: ['hydrodynamic-cruise-hull', 'tender-lifeboats-muster-deck', 'royal-esplanade-atrium'] },
      { q: 'Which vertical glass tube at the stern lets passengers skydive in mid-air over the ocean?', correctId: 'ripcord-ifly-skydiving-solarium', distractors: ['north-star-observation-capsule', 'two70-aft-glass-lounge', 'balcony-stateroom-superstructure'] },
    ],
  }),
  buildSpecModel({
    id: 'launchpad-mega-yacht',
    name: '118m Feadship Superyacht "Launchpad"',
    brand: 'Feadship Royal Dutch Shipyards • Espen Øino Design',
    badge: '118m (387 Ft) • Flag-Blue Hull • Foredeck Helipad • 24 Knots',
    desc: 'Mark Zuckerberg’s 118-meter (387-foot) flagship Dutch custom superyacht built by Feadship (Project 1010), featuring a Flag-Blue steel displacement hull, metallic-silver and white multi-tier superstructure with swept fashion plates, certified bow helipad with VIP helicopter, aft mosaic infinity pool, fold-down sea-level beach club terraces, and quad MTU 20-cylinder engines.',
    primaryHex: 0x0f2942,
    accentHex: 0xb91c1c,
    cameraPos: [4.0, 2.1, 4.15],
    partsSpec: [
      ['flag-blue-steel-displacement-hull', '118-Meter Flag-Blue Steel Displacement Hull, Knife Bow & Underwater Lounge Ports', 'Hull Architecture', true, [0, -1.35, 0], 'Flared raked-stem Flag-Blue steel hull with a crisp white boot-top waterline stripe, red anti-fouling bottom, stainless steel rubrails, and rectangular underwater glass observation ports.', 'Measuring 387 feet (118 meters) long, Launchpad is one of the largest Dutch superyachts ever built, crossing the Atlantic on her maiden voyage from Amsterdam!', (g, m) => {
        buildNavalHull(g, {
          length: 4.32, beam: 0.72, upperDraft: 0.30, lowerDraft: 0.20,
          upperMat: m.primary, lowerMat: m.accent, sheerMat: m.white, deckMat: m.teak,
          bulbousBow: true, forecastle: false, rakedYachtBow: true, portholeRows: 1,
        });
        // Illuminated underwater hull glazing & side shell tender garage doors with silver trim
        for (let i = -4; i <= 3; i++) {
          for (const s of [-1, 1]) {
            rbox(g, 0.12, 0.038, 0.015, 0.004, m.glass, [i * 0.26, -0.015, s * 0.352]);
          }
        }
      }],
      ['sculpted-silver-superstructure', '4-Deck Espen Øino Sculpted Metallic-Silver & Pearl-White Superstructure', 'Superstructure & Decks', true, [0, 1.05, -1.25], 'Aerodynamic marine-grade aluminum superstructure with curved forward bow visors, sweeping silver-metallic wing overhangs, diagonal aft fashion plates, wrap-around floor-to-ceiling tinted glass, and Burmese teak promenade decks.', 'While the hull is welded from high-tensile steel for ocean strength, the upper 4 decks are crafted from lightweight aircraft-grade aluminum to keep the center of gravity low!', (g, m) => {
        // Curved multi-tier yacht deck builder with tapered rounded bow front & teak promenade walkarounds
        const deckConfigs = [
          { y: 0.14, fore: 0.88, aft: -1.35, hb: 0.29, h: 0.095, mat: m.white },
          { y: 0.24, fore: 0.68, aft: -1.18, hb: 0.265, h: 0.090, mat: m.silver },
          { y: 0.335, fore: 0.44, aft: -0.92, hb: 0.235, h: 0.085, mat: m.white },
          { y: 0.425, fore: 0.18, aft: -0.68, hb: 0.195, h: 0.045, mat: m.silver },
        ];
        for (let idx = 0; idx < deckConfigs.length; idx++) {
          const d = deckConfigs[idx];
          const pts = [
            [d.aft, -d.hb * 0.88],
            [d.aft + 0.15, -d.hb],
            [d.fore - 0.25, -d.hb],
            [d.fore, -d.hb * 0.52],
            [d.fore + 0.14, 0],
            [d.fore, d.hb * 0.52],
            [d.fore - 0.25, d.hb],
            [d.aft + 0.15, d.hb],
            [d.aft, d.hb * 0.88],
          ];
          // Teak deck floor + white/silver coaming overhang + recessed dark floor-to-ceiling salon glazing
          extrudeProfile(g, pts.map(([x, z]) => [x * 1.03, z * 1.06]), 0.014, m.teak, [0, d.y, 0], [Math.PI / 2, 0, 0], 0.004);
          extrudeProfile(g, pts.map(([x, z]) => [x * 1.04, z * 1.08]), 0.022, d.mat, [0, d.y + d.h, 0], [Math.PI / 2, 0, 0], 0.006);
          if (idx < 3) {
            extrudeProfile(g, pts, d.h - 0.018, m.darkGlass, [0, d.y + d.h - 0.012, 0], [Math.PI / 2, 0, 0], 0.012);
          }
          // Swept diagonal silver aft fashion plates connecting decks
          for (const s of [-1, 1]) {
            rbox(g, 0.22, d.h + 0.02, 0.016, 0.005, m.silver, [d.aft + 0.12, d.y + d.h * 0.5, s * d.hb * 0.96], [0, 0, 0.42]);
          }
        }
        // Sculpted raked aluminum radar mast arch + twin Satcom / Starlink radome spheres + spinning X-band radar scanner
        rbox(g, 0.28, 0.22, 0.16, 0.032, m.silver, [-0.12, 0.55, 0], [0, 0, 0.34]);
        rbox(g, 0.42, 0.026, 0.38, 0.01, m.white, [-0.16, 0.65, 0]);
        for (const z of [-0.13, 0.13]) {
          sphere(g, 0.048, 18, 14, m.white, [-0.14, 0.71, z]);
          cyl(g, 0.024, 0.034, 0.035, 12, m.silver, [-0.14, 0.665, z]);
        }
        cyl(g, 0.008, 0.018, 0.28, 10, m.chrome, [-0.04, 0.79, 0], [0, 0, 0.22]);
      }],
      ['foredeck-helipad-helicopter', 'Certified Foredeck Helipad & Airbus ACH160 VIP Twin-Engine Helicopter', 'Aviation Deck', true, [1.35, 1.35, 0], 'Reinforced circular teak-and-steel bow helipad with perimeter night landing lights, fold-out safety netting, and a parked Airbus ACH160 VIP helicopter (`driveAnim="fan"`).', 'Launchpad’s extended bow deck houses a commercial-grade helipad and below-deck aviation fuel system so a twin-engine helicopter can land while the yacht is cruising at sea!', (g, m) => {
        // Circular bow helipad deck with yellow touch-down ring & white H marking
        cyl(g, 0.29, 0.31, 0.022, 32, m.darkSteel, [1.42, 0.145, 0]);
        torus(g, 0.25, 0.008, carPaint(0xfacc15), [1.42, 0.158, 0], [Math.PI / 2, 0, 0]);
        box(g, 0.14, 0.006, 0.022, m.white, [1.42, 0.159, -0.045]);
        box(g, 0.14, 0.006, 0.022, m.white, [1.42, 0.159, 0.045]);
        box(g, 0.022, 0.006, 0.09, m.white, [1.42, 0.159, 0]);
        // Sculpted Airbus ACH160 VIP Helicopter parked on the bow helipad
        const hx = 1.42;
        const hy = 0.235;
        rbox(g, 0.26, 0.085, 0.095, 0.032, m.silver, [hx + 0.03, hy, 0]);
        sphere(g, 0.052, 16, 12, m.darkGlass, [hx + 0.13, hy + 0.005, 0]);
        cyl(g, 0.016, 0.028, 0.22, 12, m.primary, [hx - 0.16, hy + 0.015, 0], [0, 0, Math.PI / 2]);
        torus(g, 0.034, 0.009, m.primary, [hx - 0.27, hy + 0.035, 0]);
        for (const sz of [-0.048, 0.048]) {
          cyl(g, 0.005, 0.005, 0.20, 8, m.chrome, [hx + 0.03, hy - 0.062, sz], [0, 0, Math.PI / 2]);
        }
        const rotor = new THREE.Group();
        rotor.position.set(hx + 0.03, hy + 0.062, 0);
        rotor.userData.driveAnim = 'fan';
        rotor.userData.spinAxis = 'y';
        g.add(rotor);
        cyl(rotor, 0.018, 0.018, 0.03, 12, m.chrome, [0, 0, 0]);
        for (let b = 0; b < 5; b++) {
          const a = (b / 5) * Math.PI * 2;
          box(rotor, 0.22, 0.004, 0.016, m.darkSteel, [Math.cos(a) * 0.11, 0.01, Math.sin(a) * 0.11], [0, -a, 0]);
        }
      }],
      ['aft-infinity-pool-sky-lounge', 'Aft Glass-Transom Mosaic Infinity Pool, Sun Deck Jacuzzi & Lounges', 'Outdoor Living', true, [-1.35, 1.15, 0], 'Main-deck aft glass-walled swimming pool with movable floor, teak sun pads, al-fresco dining tables, and top-deck Jacuzzi spa.', 'The bottom of the aft swimming pool is mounted on hydraulic jacks—at the push of a button, the pool floor rises flush with the teak deck to become an outdoor dance floor!', (g, m) => {
        // Aft Main Deck Infinity Pool with glass stern wall & turquoise glowing water
        rbox(g, 0.46, 0.048, 0.28, 0.012, m.white, [-1.62, 0.155, 0]);
        rbox(g, 0.40, 0.034, 0.24, 0.008, m.poolWater, [-1.62, 0.168, 0]);
        rbox(g, 0.015, 0.048, 0.26, 0.004, m.glass, [-1.84, 0.158, 0]);
        // Upper Deck Al-Fresco Teak Dining Table, Sun Loungers & Sun Deck Jacuzzi
        rbox(g, 0.16, 0.025, 0.22, 0.006, m.teak, [-1.05, 0.265, 0]);
        cyl(g, 0.095, 0.085, 0.038, 20, m.white, [-0.54, 0.45, 0]);
        cyl(g, 0.078, 0.078, 0.025, 18, m.poolWater, [-0.54, 0.462, 0]);
        for (const z of [-0.18, -0.06, 0.06, 0.18]) {
          rbox(g, 0.14, 0.022, 0.055, 0.006, m.white, [-1.25, 0.15, z]);
        }
      }],
      ['beach-club-tender-garage', 'Waterline Beach Club, Fold-Down Sea Terraces & Limousine Tender Garage', 'Beach Club & Tenders', true, [-1.25, -0.35, 1.45], 'Aft transom teak swim platform with twin sweeping staircases, fold-down port and starboard sea terraces, and dual custom 10-meter tenders.', 'At anchor, massive sections of the blue steel hull fold down flat onto the water on both sides, creating a private sea-level beach club and dive center!', (g, m) => {
        rbox(g, 0.28, 0.032, 0.54, 0.012, m.teak, [-2.02, -0.02, 0]);
        for (const s of [-1, 1]) {
          rbox(g, 0.36, 0.022, 0.18, 0.008, m.teak, [-1.48, -0.02, s * 0.41]);
          rbox(g, 0.42, 0.065, 0.13, 0.02, m.primary, [0.58, 0.02, s * 0.22]);
          rbox(g, 0.36, 0.018, 0.11, 0.006, m.teak, [0.58, 0.055, s * 0.22]);
        }
      }],
      ['owners-suite-glass-atrium', 'Central Cylindrical Glass Elevator Atrium, Cinema & Owner’s Suite Cutaway', 'Interior Luxury', false, [0.15, 0.55, 1.55], 'Five-deck cylindrical glass elevator surrounded by a floating spiral staircase, IMAX-grade private cinema, wellness spa, and panoramic Owner’s Suite.', 'A crystal-clear cylindrical glass elevator runs straight through all 5 decks from the underwater Nemo lounge up to the sky deck!', (g, m) => {
        cyl(g, 0.11, 0.11, 0.52, 22, m.glass, [-0.08, 0.18, 0]);
        for (let i = 0; i < 5; i++) {
          torus(g, 0.12, 0.01, m.brass, [-0.08, -0.02 + i * 0.11, 0], [Math.PI / 2, 0, 0]);
        }
        rbox(g, 0.95, 0.14, 0.46, 0.02, m.brass, [-0.12, 0.04, 0]);
      }],
      ['quad-mtu-diesel-stabilizers', '4× MTU 20V 4000 M93L Diesels (20,000 HP, CAD) & Zero-Speed Fin Stabilizers', 'Engine Room & Stabilizers', false, [-0.85, -0.75, -1.45], 'Four 20-cylinder turbocharged MTU marine diesel engines (`populateEngineCad`), hybrid battery bank, and active carbon-fiber gyroscopic fin stabilizers.', 'Four 20-cylinder MTU engines generate over 20,000 horsepower—driving this 5,000-gross-ton floating palace at an astonishing 24 knots!', (g, m) => {
        populateEngineCad(g, { pos: [-0.72, -0.14, -0.11], scale: 0.0018, primaryColor: 0x1d4ed8 });
        populateEngineCad(g, { pos: [-0.72, -0.14, 0.11], scale: 0.0018, primaryColor: 0x1d4ed8 });
        for (const s of [-1, 1]) {
          box(g, 0.24, 0.02, 0.16, m.darkSteel, [-0.15, -0.24, s * 0.39], [s * 0.25, 0, 0]);
        }
      }],
      ['twin-bronze-screws-rudders', 'Twin 5-Blade Skewed Bronze Propellers, Shaft Struts & Twin Rudders', 'Stern Propulsion', false, [-2.15, -0.85, 0], 'Two whisper-quiet 5-blade skewed Nickel-Aluminum-Bronze propellers (`driveAnim="fan"`) on V-bracket shaft struts plus twin high-aspect spade rudders.', 'Each 5-blade bronze propeller is computer-milled with swept "scimitar" blades so zero cavitation vibration ever reaches the guest cabins above!', (g, m) => {
        for (const z of [-0.16, 0.16]) {
          cyl(g, 0.022, 0.022, 0.65, 14, m.chrome, [-1.52, -0.28, z], [0, 0, Math.PI / 2]);
          buildMarinePropeller(g, { x: -1.86, y: -0.30, z, r: 0.125, blades: 5 });
          box(g, 0.13, 0.22, 0.025, m.accent, [-1.98, -0.30, z]);
        }
      }],
    ],
    quiz: [
      { q: 'What aviation facility is built directly into the prolonged bow deck of the 118m superyacht Launchpad?', correctId: 'foredeck-helipad-helicopter', distractors: ['aft-infinity-pool-sky-lounge', 'beach-club-tender-garage', 'quad-mtu-diesel-stabilizers'] },
      { q: 'How does Launchpad create a sea-level "Beach Club" when anchored in a calm bay?', correctId: 'beach-club-tender-garage', distractors: ['flag-blue-steel-displacement-hull', 'sculpted-silver-superstructure', 'twin-bronze-screws-rudders'] },
      { q: 'Which underwater fins extend from both sides of the yacht’s hull to stop ocean waves from rolling the ship?', correctId: 'quad-mtu-diesel-stabilizers', distractors: ['twin-bronze-screws-rudders', 'owners-suite-glass-atrium', 'aft-infinity-pool-sky-lounge'] },
    ],
  }),
  buildSpecModel({
    id: 'ultra-large-container-ship', name: '24,000-TEU Ultra-Large Container Ship', brand: 'Evergreen / Maersk Triple-E Class', badge: '400m Length • 109,000 HP 2-Stroke Diesel',
    desc: 'Four-football-field-long intermodal megaship with Twin-Island architecture, 24 container bays stacked 11 tiers high on deck, elevated steel lashing bridges, and a house-sized 11-cylinder two-stroke crosshead diesel engine driving a 10-meter bronze propeller.',
    primaryHex: 0x0f766e, accentHex: 0x991b1b,
    cameraPos: [4.25, 2.25, 4.35],
    partsSpec: [
      ['bulbous-bow-double-hull', 'Hydrodynamic Bulbous Bow, Double-Bottom Ballast Hull & Bow Wave Breakwater', 'Hull Architecture', true, [0, -1.35, 0], 'Welded high-tensile steel double hull in Evergreen marine green with white sheer coaming, red anti-fouling lower hull, faired bulbous bow, and angled bow wave breakwater shield.', 'The underwater bulbous nose creates its own wave that cancels out the ship’s bow wave, saving 12% on fuel across the ocean!', (g, m) => {
        buildNavalHull(g, {
          length: 4.38, beam: 0.90, upperDraft: 0.34, lowerDraft: 0.22,
          upperMat: m.primary, lowerMat: m.accent, sheerMat: m.white, deckMat: m.darkSteel,
          bulbousBow: true, forecastle: true, portholeRows: 0,
        });
        // Angled white steel bow breakwater shield protecting forward container stacks from green water
        rbox(g, 0.04, 0.095, 0.56, 0.008, m.white, [1.66, 0.23, 0]);
      }],
      ['watertight-holds-cell-guides', '8× Cellular Cargo Holds, Vertical Cell Guides & Ballast Tanks', 'Internal Structure', false, [0, -0.65, 1.55], 'Transverse watertight bulkheads and vertical steel angle-iron cell guides that lock containers without chains below deck.', 'Vertical steel tracks inside the hull guide containers straight down 11 stories deep with less than an inch of wiggle room!', (g, m) => {
        for (let x = -1.65; x <= 1.35; x += 0.38) box(g, 0.028, 0.48, 0.78, m.darkSteel, [x, -0.08, 0]);
        rbox(g, 3.35, 0.08, 0.74, 0.01, m.alu, [-0.1, -0.32, 0]);
      }],
      ['intermodal-container-stacks', '24-Row Intermodal 40-Ft Shipping Container Bay Stacks (8 Bays)', 'Deck Cargo', true, [0.35, 1.55, 0], 'Eight tightly packed bays of color-coded corrugated steel 40-foot shipping containers (Evergreen, Maersk, ONE, Hapag-Lloyd) stacked up to 6 tiers high above the hatch covers.', 'One 24,000-TEU container ship can carry 120 million pairs of sneakers or 700 million bananas in a single voyage!', (g) => {
        const cols = [0x0f766e, 0xdc2626, 0x0284c7, 0xd97706, 0x16a34a, 0xdb2777, 0x1e3a8a];
        // 8 dense container bays spanning stern, midship, and forward of the Twin-Island bridge
        const baySpecs = [
          { x: -1.82, tiers: 4, rows: 5 },
          { x: -1.16, tiers: 5, rows: 5 },
          { x: -0.78, tiers: 6, rows: 5 },
          { x: -0.40, tiers: 6, rows: 5 },
          { x: -0.02, tiers: 6, rows: 5 },
          { x: 0.36, tiers: 6, rows: 5 },
          { x: 1.12, tiers: 5, rows: 5 },
          { x: 1.48, tiers: 4, rows: 3 },
        ];
        for (let bi = 0; bi < baySpecs.length; bi++) {
          const { x: bx, tiers, rows } = baySpecs[bi];
          const halfR = Math.floor(rows / 2);
          for (let row = -halfR; row <= halfR; row++) {
            for (let t = 0; t < tiers; t++) {
              const cMat = carPaint(cols[(bi * 3 + row * 2 + t + 10) % cols.length]);
              const cy = 0.165 + t * 0.074;
              const cz = row * 0.152;
              rbox(g, 0.33, 0.068, 0.142, 0.006, cMat, [bx, cy, cz]);
              // White corner twistlock castings / container end-door vertical locking bars
              box(g, 0.336, 0.056, 0.012, brushedMetal(0xe2e8f0), [bx, cy, cz + 0.055]);
            }
          }
        }
      }],
      ['lashing-bridges-hatch-covers', '8× Elevated Steel Lashing Bridges & Hydraulic Pontoon Hatch Covers', 'Cargo Securing', false, [0.25, 0.95, -1.45], 'Two-tier white steel lashing bridges between every container bay where crew attach turnbuckle lashing rods to secure upper tiers against 40-foot ocean swells.', 'Forged steel twistlocks at every container corner lock automatically when a crane sets one box on top of another!', (g, m) => {
        for (const lx of [-1.62, -0.97, -0.59, -0.21, 0.17, 0.55, 0.94, 1.30]) {
          // Pontoon hatch cover coaming + 2-tier white steel lashing bridge truss between bays
          box(g, 0.32, 0.024, 0.80, m.accent, [lx - 0.18, 0.125, 0]);
          box(g, 0.028, 0.24, 0.84, m.white, [lx, 0.24, 0]);
          box(g, 0.042, 0.014, 0.86, m.alu, [lx, 0.25, 0]);
          box(g, 0.042, 0.014, 0.86, m.alu, [lx, 0.36, 0]);
        }
      }],
      ['twin-island-bridge-tower', 'Twin-Island Forward Navigation Bridge & Crew Accommodation Tower', 'Command Bridge', true, [0.85, 1.75, 0], '9-story forward accommodation superstructure with full-beam overhanging enclosed bridge wings, ARPA marine radars, ECDIS charts, and twin orange free-fall lifeboats.', 'Container ships place the bridge tower two-thirds forward so the captain can see over the towering 6-story wall of containers ahead!', (g, m) => {
        // 8-deck white accommodation block with individual deck windows & exterior safety stairways
        rbox(g, 0.28, 0.58, 0.72, 0.02, m.white, [0.75, 0.42, 0]);
        for (let f = 0; f < 6; f++) {
          rbox(g, 0.29, 0.020, 0.68, 0.004, m.darkGlass, [0.75, 0.18 + f * 0.088, 0]);
          box(g, 0.30, 0.008, 0.74, m.white, [0.75, 0.15 + f * 0.088, 0]);
        }
        // Full-beam enclosed navigation bridge wings extending beyond hull beam with red/green nav lights
        rbox(g, 0.22, 0.095, 1.06, 0.018, m.white, [0.78, 0.73, 0]);
        rbox(g, 0.23, 0.052, 1.04, 0.01, m.darkGlass, [0.79, 0.735, 0]);
        for (const s of [-1, 1]) {
          sphere(g, 0.014, 10, 10, emissiveMat(s > 0 ? 0xef4444 : 0x22c55e, 1.6), [0.80, 0.74, s * 0.53]);
        }
        // Radar mast with X/S-band scanners & orange free-fall lifeboats on angled launch skids
        cyl(g, 0.014, 0.026, 0.28, 12, m.white, [0.76, 0.91, 0]);
        box(g, 0.02, 0.015, 0.22, m.white, [0.76, 0.96, 0]);
        for (const s of [-1, 1]) {
          cone(g, 0.045, 0.18, 14, carPaint(0xf97316), [0.70, 0.30, s * 0.42], [0, 0, s * 0.48]);
          box(g, 0.08, 0.16, 0.02, m.alu, [0.70, 0.24, s * 0.42], [-s * 0.45, 0, 0]);
        }
      }],
      ['two-stroke-crosshead-diesel', '11-Cylinder WinGD/MAN Two-Stroke Crosshead Diesel Engine (CAD)', 'Main Propulsion', false, [-1.15, 0.45, 1.45], 'Four-story-tall turbo-charged slow-speed marine diesel engine (with real CAD cylinders & rods) spinning at 80 RPM.', 'At 109,000 horsepower and 2,300 tons, this cathedral-sized engine has cylinders wide enough for a person to stand inside!', (g, m) => {
        populateEngineCad(g, { pos: [-1.12, -0.1, 0], scale: 0.0022, primaryColor: 0x16a34a });
        rbox(g, 0.68, 0.34, 0.32, 0.025, m.darkSteel, [-1.12, -0.14, 0]);
        for (let c = 0; c < 8; c++) {
          cyl(g, 0.032, 0.032, 0.12, 12, m.primary, [-1.38 + c * 0.075, 0.08, 0]);
        }
      }],
      ['propeller-shaft-stern-tube', 'Intermediate Propeller Shaft, Thrust Bearing & 10m 5-Blade Screw', 'Drivetrain', false, [-2.15, -0.75, 0], '100-meter forged steel drive shaft coupling the crankshaft directly to a 130-ton Nickel-Aluminum-Bronze propeller.', 'Because the giant engine turns at just 80 RPM, it connects straight to the propeller shaft with zero reduction gears needed!', (g, m) => {
        cyl(g, 0.035, 0.035, 0.95, 16, m.chrome, [-1.52, -0.34, 0], [0, 0, Math.PI / 2]);
        buildMarinePropeller(g, { x: -1.98, y: -0.34, z: 0, r: 0.18, blades: 5 });
      }],
      ['spade-rudder-bow-thrusters', 'Semi-Balanced Twisted Spade Rudder & Aft Twin-Uptake SOx Scrubber Funnel', 'Steering & Exhaust', true, [-1.95, 0.85, -1.15], 'Electro-hydraulic rotary-vane steering gear, twisted-leading-edge spade rudder, and the aft Twin-Island engine room & SOx exhaust gas scrubber tower.', 'Splitting the bridge forward and the exhaust funnel aft ("Twin-Island" design) lets the ship pack an extra 1,900 containers onboard!', (g, m) => {
        box(g, 0.18, 0.32, 0.04, m.accent, [-2.10, -0.32, 0]);
        // Aft Twin-Island Scrubber & Uptake Casing between Bays 1 & 2
        rbox(g, 0.24, 0.48, 0.36, 0.025, m.white, [-1.48, 0.36, 0]);
        rbox(g, 0.20, 0.16, 0.28, 0.02, m.primary, [-1.48, 0.64, 0]);
        for (const z of [-0.06, 0.06]) cyl(g, 0.034, 0.034, 0.15, 14, m.darkSteel, [-1.48, 0.76, z]);
      }],
    ],
    quiz: [
      { q: 'Why does a container ship have a rounded "bulbous bow" underwater at the front of the hull?', correctId: 'bulbous-bow-double-hull', distractors: ['spade-rudder-bow-thrusters', 'twin-island-bridge-tower', 'lashing-bridges-hatch-covers'] },
      { q: 'Which 4-story-tall internal engine powers a 24,000-TEU container ship across the Pacific?', correctId: 'two-stroke-crosshead-diesel', distractors: ['propeller-shaft-stern-tube', 'watertight-holds-cell-guides', 'intermodal-container-stacks'] },
      { q: 'Which vertical steel tracks inside the cargo holds guide containers 11 stories deep without shifting?', correctId: 'watertight-holds-cell-guides', distractors: ['lashing-bridges-hatch-covers', 'bulbous-bow-double-hull', 'twin-island-bridge-tower'] },
    ],
  }),
  buildSpecModel({
    id: 'nimitz-aircraft-carrier', name: 'Nuclear Supercarrier (CVN-78)', brand: 'USS Gerald R. Ford / Nimitz Class', badge: '100,000 Tons • Twin Nuclear Reactors • EMALS',
    desc: '100,000-ton sovereign floating airbase powered by twin A1B pressurized-water nuclear reactors, launching a full Carrier Air Wing (F-35C, F/A-18E/F, E-2D Hawkeye, MH-60S) via 4 EMALS electromagnetic catapults.',
    primaryHex: 0x475569, accentHex: 0x991b1b,
    cameraPos: [4.25, 2.35, 4.35],
    partsSpec: [
      ['angled-flight-deck-nonskid', '4.5-Acre Armored Flight Deck, Jet Blast Deflectors & Carrier Air Wing (8 Aircraft)', 'Flight Operations', true, [0, 1.55, 0], 'HY-100 armored steel flight deck with an 11° angled landing runway, red/yellow foul lines, 4 pop-up Jet Blast Deflectors (JBDs), CIWS/SeaRAM defensive sponsons, and 8 detailed carrier aircraft (F/A-18E, F-35C, E-2D Hawkeye AWACS & MH-60S Seahawk).', 'Angling the landing runway 11 degrees off centerline lets jets land at the stern at 150 mph while other jets launch from the bow catapults!', (g, m) => {
        const deckPts = [
          [-2.08, -0.38], [-1.38, -0.60], [0.88, -0.60], [2.02, -0.28],
          [2.08, 0.28], [1.18, 0.50], [-0.25, 0.74], [-1.68, 0.58], [-2.08, 0.36],
        ];
        // Under-deck flared steel sponsons + armored dark non-skid flight deck
        extrudeProfile(g, deckPts.map(([x, z]) => [x * 0.95, z * 0.88]), 0.14, m.primary, [0, 0.13, 0], [Math.PI / 2, 0, 0], 0.015);
        extrudeProfile(g, deckPts, 0.048, m.darkSteel, [0, 0.24, 0], [Math.PI / 2, 0, 0], 0.010);
        // Angled landing runway threshold markings, white boundary stripes & yellow centerline
        box(g, 2.55, 0.012, 0.30, m.white, [-0.42, 0.270, 0.16], [0, 0.18, 0]);
        box(g, 2.50, 0.014, 0.24, m.darkSteel, [-0.42, 0.272, 0.16], [0, 0.18, 0]);
        box(g, 2.48, 0.016, 0.024, carPaint(0xfacc15), [-0.42, 0.274, 0.16], [0, 0.18, 0]);
        // Red & yellow foul line stripe separating landing area from starboard parking "Six-Pack"
        box(g, 2.45, 0.015, 0.018, carPaint(0xef4444), [-0.25, 0.273, -0.04], [0, 0.16, 0]);
        // 4 Raised Angled Jet Blast Deflector (JBD) cooling panels behind bow & waist catapults
        for (const [bx, bz] of [[0.32, -0.22], [0.32, 0.12], [-0.78, 0.28]]) {
          rbox(g, 0.016, 0.065, 0.13, 0.003, m.primary, [bx, 0.295, bz], [0, 0, -0.55]);
        }
        // Port-side Optical Landing System ("Meatball" FLOLS) + Perimeter Phalanx CIWS & SeaRAM missile sponsons
        rbox(g, 0.04, 0.045, 0.06, 0.005, emissiveMat(0x22c55e, 1.8), [-0.65, 0.285, 0.68]);
        for (const [sx, sz] of [[1.65, -0.45], [-1.85, 0.45], [-1.85, -0.46]]) {
          rbox(g, 0.12, 0.025, 0.12, 0.005, m.primary, [sx, 0.22, sz]);
          cyl(g, 0.022, 0.026, 0.045, 12, m.white, [sx, 0.255, sz]);
          sphere(g, 0.022, 10, 10, m.white, [sx, 0.285, sz]);
        }

        // Helper for detailed F/A-18E/F & F-35C strike fighters on flight deck
        const jetGray = mat(0x94a3b8, { roughness: 0.35, metalness: 0.45 });
        const stealthGray = mat(0x475569, { roughness: 0.40, metalness: 0.50 });
        const addStrikeFighter = (jx, jz, jyRot, isF35 = false) => {
          const jg = new THREE.Group();
          jg.position.set(jx, 0.292, jz);
          jg.rotation.y = jyRot;
          g.add(jg);
          const fMat = isF35 ? stealthGray : jetGray;
          // Fuselage + radome nose cone + bubble canopy + twin intakes + swept delta wings + canted twin vertical tails + exhaust nozzles
          rbox(jg, 0.22, 0.028, 0.052, 0.008, fMat, [-0.02, 0.01, 0]);
          cone(jg, 0.022, 0.09, 12, fMat, [0.12, 0.008, 0], [0, 0, -Math.PI / 2]);
          sphere(jg, 0.018, 12, 10, m.darkGlass, [0.04, 0.024, 0], [0, 0, 0], [1.6, 0.75, 0.85]);
          box(jg, 0.11, 0.007, 0.24, fMat, [-0.03, 0.012, 0]);
          box(jg, 0.055, 0.006, 0.12, fMat, [-0.11, 0.010, 0]);
          for (const s of [-1, 1]) {
            box(jg, 0.055, 0.045, 0.006, fMat, [-0.095, 0.032, s * 0.026], [s * 0.28, 0, -0.18]);
            cyl(jg, 0.010, 0.012, 0.03, 10, m.darkSteel, [-0.13, 0.008, s * 0.014], [0, 0, Math.PI / 2]);
          }
        };
        // 2 jets ready on Bow Catapults 1 & 2 + 4 parked along starboard & port quarters
        addStrikeFighter(1.15, -0.22, 0, false);
        addStrikeFighter(1.10, 0.12, 0, true);
        addStrikeFighter(0.55, -0.44, 0.52, false);
        addStrikeFighter(0.20, -0.44, 0.52, true);
        addStrikeFighter(-0.15, -0.44, 0.52, false);
        addStrikeFighter(-1.42, 0.38, -0.35, false);

        // E-2D Advanced Hawkeye AWACS aircraft with 24-ft Rotating Radar Rotodome Dish!
        const e2 = new THREE.Group();
        e2.position.set(-1.05, 0.295, -0.42);
        e2.rotation.y = 0.45;
        g.add(e2);
        rbox(e2, 0.24, 0.032, 0.048, 0.01, m.white, [0, 0.012, 0]);
        box(e2, 0.065, 0.008, 0.34, m.white, [0.01, 0.026, 0]);
        for (const s of [-1, 1]) {
          cyl(e2, 0.012, 0.012, 0.08, 10, m.white, [0.03, 0.02, s * 0.075], [0, 0, Math.PI / 2]);
        }
        const rotodome = new THREE.Group();
        rotodome.position.set(-0.01, 0.056, 0);
        rotodome.userData.driveAnim = 'fan';
        rotodome.userData.spinAxis = 'y';
        e2.add(rotodome);
        cyl(rotodome, 0.095, 0.095, 0.012, 24, m.white, [0, 0, 0]);
        torus(rotodome, 0.065, 0.004, m.darkSteel, [0, 0.007, 0], [Math.PI / 2, 0, 0]);
      }],
      ['emals-catapults-arresting-gear', '4× EMALS Linear Induction Catapults & Mk 7 Arresting Gear Wires', 'Launch & Recovery', false, [1.25, 1.15, 1.25], 'Four 300-foot electromagnetic linear synchronous motor launch tracks plus 3 hydraulic/turbo-electric arresting cables.', 'EMALS catapults accelerate a 30-ton fighter jet from 0 to 165 mph in just 2 seconds using linear magnetic waves!', (g, m) => {
        for (const [x, z] of [[1.05, -0.22], [1.05, 0.12], [-0.15, 0.28], [-0.35, 0.42]]) {
          box(g, 1.35, 0.026, 0.032, m.brass, [x, 0.272, z]);
        }
        for (let i = 0; i < 3; i++) box(g, 0.012, 0.02, 0.72, m.chrome, [-1.35 - i * 0.18, 0.278, 0.1]);
      }],
      ['island-tower-spy-radar', 'Starboard Island Superstructure, Pri-Fly & Dual-Band Phased-Array Radar', 'Command & Radar', true, [-0.45, 1.85, -1.15], 'Stealth-faceted starboard command island housing Flag Bridge, Navigation Bridge, Primary Flight Control ("Pri-Fly"), flat-panel AN/SPY-6 3D radar faces, and TACAN mast.', 'Fixed solid-state radar panels on the island scan 360 degrees simultaneously with zero spinning antennas needed!', (g, m) => {
        // Multi-tier chined stealth island base + Flag Bridge + Navigation Bridge + Pri-Fly cantilevered gallery
        rbox(g, 0.42, 0.48, 0.22, 0.022, m.primary, [-0.62, 0.50, -0.44]);
        rbox(g, 0.46, 0.052, 0.25, 0.01, m.darkGlass, [-0.62, 0.56, -0.44]);
        rbox(g, 0.48, 0.052, 0.26, 0.01, m.darkGlass, [-0.62, 0.65, -0.44]);
        rbox(g, 0.50, 0.022, 0.28, 0.006, m.primary, [-0.62, 0.69, -0.44]);
        // Octagonal AN/SPY-6 Dual-Band Phased-Array Radar Tower with 4 light-gray octagonal array faces
        rbox(g, 0.26, 0.28, 0.24, 0.02, m.primary, [-0.62, 0.85, -0.44]);
        for (const [rx, rz] of [[-0.485, -0.44], [-0.755, -0.44], [-0.62, -0.315], [-0.62, -0.565]]) {
          rbox(g, rx === -0.62 ? 0.14 : 0.014, 0.16, rz === -0.44 ? 0.14 : 0.014, 0.004, m.silver, [rx, 0.85, rz]);
        }
        // Lattice mast, Satcom spheres & yardarms
        cyl(g, 0.016, 0.036, 0.38, 12, m.alu, [-0.62, 1.14, -0.44]);
        box(g, 0.018, 0.018, 0.28, m.alu, [-0.62, 1.18, -0.44]);
        sphere(g, 0.035, 14, 12, m.white, [-0.46, 0.74, -0.44]);
      }],
      ['hangar-bay-deck-elevators', 'Below-Deck Aircraft Hangar Bay & 3× Deck-Edge Aircraft Elevators', 'Aircraft Hangar', false, [0, 0.45, 1.65], 'Three-bay internal maintenance hangar spanning two decks tall, served by three giant 45-ton deck-edge aircraft elevators.', 'Each deck-edge elevator platform is big enough to lift two fighter jets from the hangar to the flight deck in 15 seconds!', (g, m) => {
        rbox(g, 2.85, 0.20, 0.72, 0.02, m.alu, [-0.1, 0.06, 0]);
        for (const [ex, ez] of [[0.25, -0.62], [-0.95, -0.62], [-0.85, 0.62]]) {
          box(g, 0.38, 0.032, 0.22, m.primary, [ex, 0.18, ez]);
          box(g, 0.36, 0.008, 0.20, carPaint(0xfacc15), [ex, 0.198, ez]);
        }
      }],
      ['twin-a1b-nuclear-reactors', 'Twin A1B Pressurized-Water Nuclear Reactors & Radiation Shielding', 'Nuclear Power', false, [0, -0.85, -1.55], 'Two heavily shielded nuclear reactor pressure vessels generating 700 MW of thermal energy and 25 years of steaming without refueling.', 'Two uranium cores the size of pickup trucks let a 100,000-ton carrier sail for 25 years without ever stopping for fuel!', (g, m) => {
        for (const x of [-0.55, 0.45]) {
          cyl(g, 0.18, 0.18, 0.36, 24, m.brass, [x, -0.14, 0]);
          torus(g, 0.21, 0.025, m.chrome, [x, -0.05, 0], [Math.PI / 2, 0, 0]);
        }
      }],
      ['geared-steam-turbines', '4× Main Geared Steam Turbines (280,000 SHP) & Reduction Gearboxes (CAD)', 'Propulsion Plant', false, [-1.15, -0.75, 1.35], 'High- and low-pressure steam turbines coupled to real mechanical CAD double-helical reduction gearboxes.', 'Superheated steam from the nuclear heat exchangers spins 4 giant turbines producing 280,000 shaft horsepower!', (g, m) => {
        populateGearboxCad(g, { pos: [-0.95, -0.18, 0], scale: 0.012 });
        for (const z of [-0.22, 0.22]) cyl(g, 0.12, 0.15, 0.48, 20, m.alu, [-1.05, -0.18, z], [0, 0, Math.PI / 2]);
      }],
      ['armored-hull-torpedo-defense', 'Multi-Layer Armored Double Hull & Bulbous Sonar Bow', 'Hull Protection', true, [0, -1.45, 0], 'Compartmented steel hull with Kevlar spall liners, side torpedo defense voids, and bulbous bow sonar dome.', 'Over 2,000 watertight compartments inside the hull keep the ship afloat and level even after heavy battle damage!', (g, m) => {
        buildNavalHull(g, { length: 4.18, beam: 0.86, upperDraft: 0.32, lowerDraft: 0.22, upperMat: m.primary, lowerMat: m.accent, sheerMat: m.darkSteel, bulbousBow: true, portholeRows: 0 });
      }],
      ['quad-shafts-bronze-screws', '4× 21-Ft 5-Blade Bronze Propellers & Twin Balanced Rudders', 'Stern Propulsion', false, [-2.15, -0.95, 0], 'Four 30-ton bronze propellers (`driveAnim="fan"`) on underwater shaft struts plus twin hydraulic rudders pushing the carrier past 30 knots.', 'Four 21-foot bronze propellers push the 1,100-foot warship fast enough to outrun escorting destroyers in heavy seas!', (g, m) => {
        for (const z of [-0.28, -0.1, 0.1, 0.28]) buildMarinePropeller(g, { x: -1.92, y: -0.36, z, r: 0.11, blades: 5 });
        for (const z of [-0.18, 0.18]) box(g, 0.16, 0.24, 0.03, m.accent, [-2.04, -0.36, z]);
      }],
    ],
    quiz: [
      { q: 'Which electromagnetic launch system on the flight deck accelerates fighter jets to 165 mph in 2 seconds?', correctId: 'emals-catapults-arresting-gear', distractors: ['twin-a1b-nuclear-reactors', 'island-tower-spy-radar', 'quad-shafts-bronze-screws'] },
      { q: 'Which twin power sources inside the hull allow a supercarrier to sail for 25 years without refueling?', correctId: 'twin-a1b-nuclear-reactors', distractors: ['geared-steam-turbines', 'hangar-bay-deck-elevators', 'armored-hull-torpedo-defense'] },
      { q: 'Why is the landing runway on a modern aircraft carrier angled 11 degrees off centerline?', correctId: 'angled-flight-deck-nonskid', distractors: ['island-tower-spy-radar', 'hangar-bay-deck-elevators', 'armored-hull-torpedo-defense'] },
    ],
  }),
  buildSpecModel({
    id: 'rms-titanic-ocean-liner',
    name: 'RMS Titanic Olympic-Class Ocean Liner',
    brand: 'White Star Line / Harland & Wolff (1912)',
    badge: '882 Ft • 29 Boilers • Triple-Expansion + Turbine',
    desc: 'Museum-grade engineering reconstruction of the 1912 Royal Mail Steamer Titanic featuring her sleek 9.2:1 riveted hull, raked stem bow, forward/aft well decks, windowed A/B/C promenade decks, 20 Welin-davit lifeboats, 4 guy-wired White Star Buff funnels, 29 coal boilers, and triple-screw steam plant.',
    primaryHex: 0x0f172a,
    accentHex: 0x881313,
    cameraPos: [4.25, 2.15, 4.35],
    partsSpec: [
      ['riveted-hull-double-bottom', '3-Million-Rivet Steel Hull, Knife-Edge Stem Bow, Well Decks & Poop Deck', 'Hull Structure', true, [0, -1.45, 0], 'Sleek 882-foot riveted steel hull with a knife-sharp vertical stem bow, anti-fouling red lower hull, gold sheer stripe, raised Forecastle, Forward & Aft Well Decks with electric cargo cranes, and stern Poop Deck.', 'Titanic’s hull had a 7-foot-thick cellular "double bottom" tank floor fastened by 3 million wrought-iron and steel rivets!', (g, m) => {
        const hl = 2.32;
        const hb = 0.255;
        // Custom 1912 Ocean-Liner Waterline Helper (knife-sharp raked stem bow + elliptical counter stern)
        const linerWaterline = (lenScale, beamScale, sternRound = 0.42) => [
          [-hl * lenScale, -hb * beamScale * sternRound],
          [-hl * lenScale * 0.92, -hb * beamScale * 0.78],
          [-hl * lenScale * 0.62, -hb * beamScale],
          [hl * lenScale * 0.42, -hb * beamScale],
          [hl * lenScale * 0.72, -hb * beamScale * 0.68],
          [hl * lenScale * 0.91, -hb * beamScale * 0.26],
          [hl * lenScale, 0],
          [hl * lenScale * 0.91, hb * beamScale * 0.26],
          [hl * lenScale * 0.72, hb * beamScale * 0.68],
          [hl * lenScale * 0.42, hb * beamScale],
          [-hl * lenScale * 0.62, hb * beamScale],
          [-hl * lenScale * 0.92, hb * beamScale * 0.78],
          [-hl * lenScale, hb * beamScale * sternRound],
        ];

        // 1. Multi-waterline riveted black topsides & deep oxide-red lower hull (no modern bulbous bow!)
        extrudeProfile(g, linerWaterline(1.0, 1.0, 0.44), 0.16, m.primary, [0, 0.01, 0], [Math.PI / 2, 0, 0], 0.016);
        extrudeProfile(g, linerWaterline(0.992, 0.97, 0.38), 0.15, m.primary, [-0.01, -0.12, 0], [Math.PI / 2, 0, 0], 0.016);
        // Gold-leaf White Star sheer stripe near the upper gunwale + crisp white waterline boot-top
        extrudeProfile(g, linerWaterline(1.003, 1.012, 0.45), 0.016, m.brass, [0, 0.082, 0], [Math.PI / 2, 0, 0], 0.004);
        extrudeProfile(g, linerWaterline(0.982, 0.94, 0.32), 0.022, m.white, [-0.015, -0.24, 0], [Math.PI / 2, 0, 0], 0.004);
        // Oxide-red anti-fouling lower hull + flat double-bottom keel + bilge keels
        extrudeProfile(g, linerWaterline(0.968, 0.89, 0.24), 0.13, m.accent, [-0.025, -0.30, 0], [Math.PI / 2, 0, 0], 0.015);
        extrudeProfile(g, linerWaterline(0.94, 0.74, 0.14), 0.10, m.accent, [-0.04, -0.40, 0], [Math.PI / 2, 0, 0], 0.012);
        for (const s of [-1, 1]) {
          box(g, 1.95, 0.014, 0.035, m.accent, [-0.05, -0.36, s * 0.22], [s * 0.35, 0, 0]);
        }
        // Main hull teak deck spanning the full length
        extrudeProfile(g, linerWaterline(0.99, 0.96, 0.42), 0.018, m.teak, [0, 0.102, 0], [Math.PI / 2, 0, 0], 0.004);

        // 2. Raised Forecastle Deck at Bow (x = 1.24 to 2.32) with anchor chains, capstans & white breakwater
        const fPts = [
          [1.24, -hb * 0.92],
          [1.68, -hb * 0.66],
          [2.08, -hb * 0.26],
          [2.32, 0],
          [2.08, hb * 0.26],
          [1.68, hb * 0.66],
          [1.24, hb * 0.92],
        ];
        extrudeProfile(g, fPts, 0.075, m.primary, [0, 0.135, 0], [Math.PI / 2, 0, 0], 0.01);
        extrudeProfile(g, fPts.map(([x, z]) => [x * 0.995, z * 0.94]), 0.014, m.teak, [0, 0.178, 0], [Math.PI / 2, 0, 0], 0.003);
        // Centerline 15-ton Hall anchor well, steam windlass & brass bell at forecastle
        rbox(g, 0.16, 0.035, 0.12, 0.008, m.darkSteel, [1.82, 0.19, 0]);
        for (const s of [-1, 1]) {
          cyl(g, 0.018, 0.022, 0.035, 12, m.darkSteel, [1.66, 0.19, s * 0.08]);
          rbox(g, 0.07, 0.05, 0.02, 0.006, m.darkSteel, [2.04, 0.04, s * 0.11], [0, s * 0.38, 0]);
        }

        // 3. Forward Well Deck (x = 0.96..1.24) & Aft Well Deck (x = -1.52..-1.14) with No. 1/2/5/6 Cargo Hatches & 6 Electric Cranes
        for (const hx of [1.10, -1.28, -1.42]) {
          rbox(g, 0.12, 0.028, 0.14, 0.005, m.darkSteel, [hx, 0.115, 0]);
        }
        for (const [cx, cz, dir] of [[1.16, -0.16, 1], [1.16, 0.16, 1], [-1.24, -0.16, -1], [-1.24, 0.16, -1], [-1.48, -0.15, 1], [-1.48, 0.15, 1]]) {
          cyl(g, 0.014, 0.018, 0.11, 10, m.white, [cx, 0.15, cz]);
          tube(g, [[cx, 0.19, cz], [cx + dir * 0.11, 0.28, cz * 0.6]], 0.006, m.brass);
        }

        // 4. Raised Stern Poop Deck (x = -2.28 to -1.52) with White Bulwarks, Teak Deck & Aft Docking Bridge
        const pPts = [
          [-2.28, -hb * 0.42],
          [-2.08, -hb * 0.78],
          [-1.52, -hb * 0.94],
          [-1.52, hb * 0.94],
          [-2.08, hb * 0.78],
          [-2.28, hb * 0.42],
        ];
        extrudeProfile(g, pPts, 0.068, m.white, [0, 0.132, 0], [Math.PI / 2, 0, 0], 0.01);
        extrudeProfile(g, pPts.map(([x, z]) => [x * 0.995, z * 0.93]), 0.014, m.teak, [0, 0.172, 0], [Math.PI / 2, 0, 0], 0.003);
        rbox(g, 0.045, 0.04, 0.38, 0.006, m.white, [-1.72, 0.20, 0]);

        // 5. Two Rows of Illuminated Brass-Ringed Portholes Along the Black Hull Topsides
        const portholeGlow = emissiveMat(0xfef08a, 0.95);
        for (let i = -18; i <= 18; i++) {
          const px = i * 0.095;
          const hullZ = hb * (Math.abs(px) > 1.1 ? 0.92 - (Math.abs(px) - 1.1) * 0.36 : 0.99);
          for (const s of [-1, 1]) {
            cyl(g, 0.009, 0.009, 0.008, 10, portholeGlow, [px, 0.045, s * hullZ], [Math.PI / 2, 0, 0]);
            if (i % 2 === 0) {
              cyl(g, 0.008, 0.008, 0.008, 10, portholeGlow, [px, -0.015, s * (hullZ * 0.98)], [Math.PI / 2, 0, 0]);
            }
          }
        }
      }],
      ['sixteen-watertight-bulkheads', '15 Transverse Steel Bulkheads, 16 Compartments & Electric Drop Doors', 'Safety & Subdivision', false, [0, -0.55, 1.55], 'Fifteen transverse steel walls dividing the lower hull into 16 compartments with float-triggered electric drop doors.', 'Titanic was designed to stay afloat with any 2 compartments flooded—or even her first 4 forward compartments filled with sea water!', (g, m) => {
        for (let i = -7; i <= 7; i++) {
          const w = 0.44 * (1 - Math.abs(i) * 0.045);
          box(g, 0.018, 0.30, w, m.alu, [i * 0.24, -0.14, 0]);
        }
      }],
      ['scotch-marine-coal-boilers', '6 Boiler Rooms & 29 Multi-Furnace Scotch Marine Coal Boilers', 'Steam Generation', false, [0.35, -0.75, -1.45], 'Twenty-four double-ended and 5 single-ended cylindrical fire-tube boilers burning 600 tons of Welsh coal per day.', 'Over 170 firemen and trimmers worked around the clock shoveling coal into 159 glowing furnaces deep below the waterline!', (g, m) => {
        for (let i = 0; i < 6; i++) {
          for (const z of [-0.11, 0, 0.11]) {
            cyl(g, 0.068, 0.068, 0.16, 18, m.copper, [-0.24 + i * 0.21, -0.19, z], [0, 0, Math.PI / 2]);
          }
        }
      }],
      ['triple-expansion-steam-engines', 'Twin 4-Cylinder Triple-Expansion Steam Engines (CAD) & Parsons Turbine', 'Main Propulsion', false, [-1.05, -0.65, 1.45], 'Two 30-foot-tall reciprocating piston steam engines (CAD) for the wing propellers plus a low-pressure exhaust turbine for the center screw.', 'Exhaust steam leaving the two giant piston engines still had enough pressure to spin a third 16,000-hp turbine in the middle!', (g, m) => {
        populateEngineCad(g, { pos: [-0.88, -0.14, -0.10], scale: 0.0015, primaryColor: 0xd97706 });
        populateEngineCad(g, { pos: [-0.88, -0.14, 0.10], scale: 0.0015, primaryColor: 0xd97706 });
        cyl(g, 0.085, 0.085, 0.28, 18, m.darkSteel, [-1.24, -0.22, 0], [0, 0, Math.PI / 2]);
      }],
      ['four-buff-black-funnels', '4× White Star Buff-and-Black Elliptical Funnels, Steam Pipes, Raked Masts & Marconi Aerial', 'Uptakes & Rigging', true, [-0.15, 1.75, 0], 'Four 62-foot raked elliptical smokestacks in authentic White Star Buff with black tops, external brass steam whistle pipes, 24 wire stays, cowl ventilators, and raked masts with Marconi wireless aerial.', 'Only the first 3 funnels actually exhausted boiler smoke—the 4th funnel was a dummy added for symmetry that ventilated the galleys and First-Class smoking room fireplace!', (g, m) => {
        const whiteStarBuff = carPaint(0xe59842, { roughness: 0.30, metalness: 0.15 });
        const sootBlack = mat(0x090d16, { roughness: 0.85 });
        const funnelXs = [0.58, 0.11, -0.36, -0.83];

        for (let i = 0; i < 4; i++) {
          const x = funnelXs[i];
          // Raised white boiler casing fidley base & iron grating on Boat Deck
          rbox(g, 0.24, 0.036, 0.22, 0.008, m.white, [x + 0.02, 0.43, 0]);
          // Elliptical raked funnel assembly (10° aft rake = +0.175 rad around Z)
          const fg = new THREE.Group();
          fg.position.set(x, 0.65, 0);
          fg.rotation.z = 0.175;
          fg.scale.set(1, 1, 0.74);
          g.add(fg);

          // Main White Star Buff lower casing + Jet-Black top band + dark open soot throat
          cyl(fg, 0.092, 0.096, 0.41, 28, whiteStarBuff, [0, -0.04, 0]);
          cyl(fg, 0.093, 0.092, 0.15, 28, m.primary, [0, 0.23, 0]);
          cyl(fg, 0.082, 0.082, 0.02, 24, sootBlack, [0, 0.302, 0]);
          // Thin structural riveted band rings around the funnel casing
          for (const ry of [-0.14, 0.02, 0.155]) {
            torus(fg, 0.094, 0.004, whiteStarBuff, [0, ry, 0], [Math.PI / 2, 0, 0]);
          }
          // Forward triple-bell brass steam whistle & escape steam pipes + aft water pipe
          cyl(fg, 0.010, 0.010, 0.48, 10, m.brass, [0.098, 0.0, 0]);
          cyl(fg, 0.016, 0.014, 0.045, 10, m.brass, [0.106, 0.18, 0]);
          cyl(fg, 0.007, 0.007, 0.44, 8, m.darkSteel, [-0.096, -0.02, 0]);

          // 6 Diagonal Steel Guy-Wire Stays anchoring each funnel to the Boat Deck railings
          for (const s of [-1, 1]) {
            for (const dx of [-0.12, 0.0, 0.12]) {
              tube(
                g,
                [
                  [x - 0.02, 0.78, s * 0.065],
                  [x + dx, 0.42, s * 0.21],
                ],
                0.0025,
                m.darkSteel,
              );
            }
          }
        }

        // Tall Raked Foremast (with White Crow's Nest Lookout Basket) & Mainmast + 4-Wire Marconi T-Aerial
        cyl(g, 0.010, 0.022, 1.24, 14, m.teak, [1.34, 0.74, 0], [0, 0, 0.175]);
        cyl(g, 0.024, 0.020, 0.055, 14, m.white, [1.28, 0.88, 0]);
        // Foremast cargo derrick boom over the forward well deck
        tube(g, [[1.39, 0.32, 0], [1.14, 0.54, 0]], 0.009, m.white);

        cyl(g, 0.010, 0.022, 1.22, 14, m.teak, [-1.36, 0.73, 0], [0, 0, 0.175]);
        tube(g, [[-1.31, 0.32, 0], [-1.14, 0.52, 0]], 0.009, m.white);

        // Horizontal spreader yardarms + 4 parallel Marconi wireless aerial cables + lead-in down to Marconi house
        box(g, 0.012, 0.012, 0.16, m.darkSteel, [1.24, 1.31, 0]);
        box(g, 0.012, 0.012, 0.16, m.darkSteel, [-1.46, 1.29, 0]);
        for (const z of [-0.055, -0.018, 0.018, 0.055]) {
          tube(g, [[1.24, 1.31, z], [-0.10, 1.23, z], [-1.46, 1.29, z]], 0.003, m.darkSteel);
        }
        tube(g, [[-0.12, 1.23, 0], [-0.14, 0.46, 0]], 0.003, m.brass);
      }],
      ['promenade-superstructure-bridge', 'Windowed Promenade Decks (A–C), Navigation Bridge & 20 Welin-Davit Lifeboats', 'Superstructure', true, [0.25, 1.25, -1.25], 'Multi-tier white steel superstructure with 60+ individual stateroom windows, A-Deck forward storm screen and open aft colonnade, overhanging bridge wing cabs, cowl vents, and 20 clinker-built wooden lifeboats on curved swan-neck Welin davits.', 'In 1912, Titanic’s forward A-Deck promenade was enclosed with glass screens at the last minute to shield First-Class passengers from North Atlantic spray—the easiest way to tell Titanic apart from her sister ship Olympic!', (g, m) => {
        const winDark = mat(0x0f172a, { roughness: 0.2, metalness: 0.6 });

        // 1. C-Deck & B-Deck Central Island Superstructure (x = -1.12 to +0.94, width = 0.48)
        rbox(g, 2.08, 0.072, 0.485, 0.012, m.white, [-0.09, 0.148, 0]);
        rbox(g, 2.10, 0.014, 0.495, 0.004, m.teak, [-0.09, 0.188, 0]);
        rbox(g, 2.02, 0.072, 0.47, 0.012, m.white, [-0.09, 0.232, 0]);
        rbox(g, 2.04, 0.014, 0.48, 0.004, m.teak, [-0.09, 0.272, 0]);

        // Individual B-Deck & C-Deck Stateroom & Promenade Windows (instead of a solid black stripe!)
        for (let w = -15; w <= 13; w++) {
          const wx = w * 0.064;
          for (const s of [-1, 1]) {
            box(g, 0.036, 0.028, 0.008, winDark, [wx, 0.152, s * 0.242]);
            box(g, 0.038, 0.032, 0.008, winDark, [wx, 0.236, s * 0.234]);
          }
        }

        // 2. A-Deck First-Class Promenade: Enclosed Forward Screen (x = 0.02..0.88) + Open Aft Colonnade (x = -1.06..0.02)
        rbox(g, 1.94, 0.072, 0.41, 0.01, m.white, [-0.09, 0.315, 0]);
        // Forward enclosed white storm screen wall with closely-spaced glass windows
        for (const s of [-1, 1]) {
          box(g, 0.86, 0.068, 0.012, m.white, [0.45, 0.315, s * 0.232]);
          for (let fw = 0; fw < 13; fw++) {
            box(g, 0.042, 0.034, 0.015, m.glass, [0.06 + fw * 0.064, 0.322, s * 0.232]);
          }
          // Aft open promenade bulwark + vertical white steel stanchion pillars
          box(g, 1.08, 0.026, 0.012, m.white, [-0.52, 0.292, s * 0.232]);
          for (let p = 0; p < 12; p++) {
            box(g, 0.012, 0.068, 0.012, m.white, [-1.04 + p * 0.092, 0.315, s * 0.232]);
          }
        }

        // 3. Boat Deck Roof, Teak Promenade Planking & Centerline Deckhouses (Officers' Quarters, Gymnasium, Lounge)
        rbox(g, 1.98, 0.018, 0.475, 0.005, m.white, [-0.08, 0.358, 0]);
        rbox(g, 1.96, 0.012, 0.465, 0.004, m.teak, [-0.08, 0.370, 0]);
        rbox(g, 1.78, 0.052, 0.28, 0.01, m.white, [-0.06, 0.398, 0]);
        rbox(g, 1.76, 0.010, 0.27, 0.004, m.teak, [-0.06, 0.426, 0]);

        // 16 White & Red-Throated Cowl Ventilators along Boat Deck
        for (const [vx, vz] of [
          [0.72, -0.11], [0.72, 0.11], [0.46, -0.12], [0.46, 0.12],
          [0.24, -0.11], [0.24, 0.11], [-0.22, -0.12], [-0.22, 0.12],
          [-0.48, -0.11], [-0.48, 0.11], [-0.72, -0.12], [-0.72, 0.12],
        ]) {
          cyl(g, 0.010, 0.010, 0.048, 10, m.white, [vx, 0.44, vz]);
          sphere(g, 0.016, 10, 10, m.accent, [vx + 0.006, 0.465, vz]);
        }

        // 4. Forward Navigation Bridge, Wheelhouse & Overhanging Port/Starboard Wing Cabs (x = 0.88)
        rbox(g, 0.16, 0.065, 0.54, 0.01, m.white, [0.87, 0.402, 0]);
        rbox(g, 0.17, 0.012, 0.55, 0.004, m.white, [0.87, 0.438, 0]);
        // 9 individual forward wheelhouse & bridge windows + red/green wing navigation lights
        for (let bw = -4; bw <= 4; bw++) {
          box(g, 0.012, 0.028, 0.036, m.glass, [0.952, 0.408, bw * 0.052]);
        }
        for (const s of [-1, 1]) {
          rbox(g, 0.09, 0.062, 0.05, 0.008, m.white, [0.88, 0.402, s * 0.255]);
          sphere(g, 0.012, 10, 10, emissiveMat(s > 0 ? 0xef4444 : 0x22c55e, 1.5), [0.91, 0.405, s * 0.282]);
        }

        // 5. 20 Clinker-Built Wooden Lifeboats on Curved Swan-Neck Welin Quadrant Davits (4 Forward + 4 Aft per side + 4 Collapsibles)
        const boatXs = [0.76, 0.57, 0.38, 0.19, -0.34, -0.53, -0.72, -0.91];
        for (const x of boatXs) {
          for (const s of [-1, 1]) {
            const bz = s * 0.215;
            // Sculpted white double-ended lifeboat hull + brown teak gunwale & canvas cover
            lathe(
              g,
              [
                [-0.075, 0.002],
                [-0.048, 0.022],
                [0.0, 0.026],
                [0.048, 0.022],
                [0.075, 0.002],
              ],
              14,
              m.white,
              [x, 0.404, bz],
              undefined,
              [0.72, 1, 0.85],
            );
            rbox(g, 0.125, 0.010, 0.036, 0.004, m.teak, [x, 0.418, bz]);
            // Pair of curved white swan-neck Welin quadrant davit arms at bow & stern of each lifeboat
            for (const dx of [-0.068, 0.068]) {
              tube(
                g,
                [
                  [x + dx, 0.372, s * 0.195],
                  [x + dx, 0.435, s * 0.205],
                  [x + dx, 0.442, bz],
                ],
                0.0045,
                m.white,
              );
            }
          }
        }
        // 4 Englehardt Collapsible Lifeboats (A, B, C, D) near the forward bridge wings & officer roof
        for (const s of [-1, 1]) {
          rbox(g, 0.11, 0.018, 0.034, 0.005, m.teak, [0.74, 0.435, s * 0.095]);
        }
      }],
      ['grand-staircase-saloon-cutaway', 'First-Class Grand Staircase Wrought-Iron Crystal Dome & Dining Saloon Cutaway', 'Interior Cutaway', false, [0.45, 0.65, 1.45], 'Cutaway of the 6-deck English oak Grand Staircase crowned by a wrought-iron and crystal glass dome inside its white Boat Deck skylight housing.', 'Natural sunlight poured into the First-Class Grand Staircase through a 19-foot wrought-iron glass dome protected by a raised white skylight box on the Boat Deck!', (g, m) => {
        // Raised white skylight cover on Boat Deck + crystal glass dome between Funnels 1 & 2 (and aft dome between 3 & 4)
        for (const dx of [0.35, -0.60]) {
          rbox(g, 0.18, 0.024, 0.18, 0.006, m.white, [dx, 0.435, 0]);
          sphere(g, 0.068, 16, 12, m.glass, [dx, 0.442, 0], [0, 0, 0], [1.1, 0.55, 1.1]);
        }
        // Internal English oak Grand Staircase landings & crystal chandelier glow
        rbox(g, 0.58, 0.18, 0.36, 0.02, m.brass, [0.35, 0.22, 0]);
      }],
      ['triple-screws-rudder-casting', '3× Bronze Propellers (Wing 3-Blade + Center 4-Blade) & 101-Ton Rudder', 'Stern & Steering', false, [-2.15, -0.85, 0], 'Two 23.5-foot 3-blade outboard propellers on bossed shaft fairings, one 17-foot center turbine propeller, and a 78-foot hinged steel rudder.', 'The two outer 3-blade propellers could reverse to stop the ship, while the steam-turbine center propeller could only spin forward!', (g, m) => {
        // Wing propeller shaft bossings protruding from the aft lower hull
        for (const s of [-1, 1]) {
          cyl(g, 0.024, 0.032, 0.48, 14, m.accent, [-1.82, -0.31, s * 0.145], [0, s * -0.12, Math.PI / 2]);
        }
        for (const z of [-0.17, 0, 0.17]) {
          buildMarinePropeller(g, { x: -2.06, y: -0.32, z, r: z === 0 ? 0.095 : 0.135, blades: z === 0 ? 4 : 3 });
        }
        // Sculpted 101-ton hinged steel rudder blade under the counter stern
        const rudderPts = [
          [-2.14, -0.42],
          [-2.25, -0.40],
          [-2.26, -0.14],
          [-2.14, -0.06],
        ];
        extrudeProfile(g, rudderPts, 0.022, m.primary, [0, 0, -0.011], [0, 0, 0], 0.004);
      }],
    ],
    quiz: [
      { q: 'Which of RMS Titanic’s 4 iconic funnels did NOT vent boiler smoke and instead ventilated the galleys and engine room?', correctId: 'four-buff-black-funnels', distractors: ['scotch-marine-coal-boilers', 'promenade-superstructure-bridge', 'triple-expansion-steam-engines'] },
      { q: 'How did Titanic reuse the low-pressure exhaust steam leaving her two giant reciprocating piston engines?', correctId: 'triple-expansion-steam-engines', distractors: ['scotch-marine-coal-boilers', 'sixteen-watertight-bulkheads', 'triple-screws-rudder-casting'] },
      { q: 'Which 15 transverse steel walls divided Titanic’s lower hull into 16 compartments?', correctId: 'sixteen-watertight-bulkheads', distractors: ['riveted-hull-double-bottom', 'grand-staircase-saloon-cutaway', 'four-buff-black-funnels'] },
    ],
  }),
];

export const EVERYDAY_MODELS = [
  buildSpecModel({
    id: 'siphon-flush-toilet', name: 'Gravity Siphon Flush Toilet', brand: 'Fluidmaster / Kohler Class', badge: '1.28 GPF • Atmospheric Siphon Physics',
    desc: 'Everyday hydraulic engineering marvel that uses a buoyant float valve, rubber flapper, rim jets, and an S-curve siphon weir to flush using gravity alone—no electricity required.',
    primaryHex: 0xf8fafc, accentHex: 0x0284c7, cameraPos: [3.4, 2.1, 3.6],
    partsSpec: [
      ['porcelain-gravity-cistern', 'Vitreous China Gravity Water Tank & Sculpted Beveled Lid', 'Gravity Reservoir', true, [-0.85, 1.45, 0], 'Glazed vitreous china upper reservoir storing 1.28 gallons of potential-energy flush water above the bowl.', 'Lifting water just 18 inches above the bowl stores enough gravitational potential energy to trigger a high-speed siphon!', (g, m) => {
        rbox(g, 0.44, 0.66, 0.84, 0.065, m.white, [-0.52, 0.48, 0]);
        rbox(g, 0.48, 0.065, 0.88, 0.03, m.white, [-0.52, 0.84, 0]);
        rbox(g, 0.40, 0.035, 0.80, 0.02, m.white, [-0.52, 0.88, 0]);
        // Translucent stored water level inside the tank
        rbox(g, 0.38, 0.42, 0.78, 0.02, m.glass, [-0.52, 0.42, 0]);
      }],
      ['float-fill-valve-ballcock', 'Buoyant Float Cup Fill Valve, Refill Tube & Overflow Standpipe', 'Automatic Water Level', false, [-1.25, 0.95, -1.15], 'Rising polymer float cup that slides up a vertical supply shaft and pinches off the incoming water valve at the exact fill line.', 'The float valve is a pure mechanical feedback computer—when the water rises to the target line, buoyancy automatically shuts the valve!', (g, m) => {
        cyl(g, 0.032, 0.032, 0.56, 18, m.darkSteel, [-0.52, 0.46, -0.26]);
        cyl(g, 0.088, 0.088, 0.16, 20, m.accent, [-0.52, 0.58, -0.26]);
        cyl(g, 0.055, 0.055, 0.05, 18, m.accent, [-0.52, 0.75, -0.26]);
        // Overflow standpipe + curved bowl-refill tube
        cyl(g, 0.032, 0.032, 0.52, 16, m.white, [-0.48, 0.44, 0.06]);
        tube(g, [[-0.52, 0.74, -0.24], [-0.50, 0.78, -0.08], [-0.48, 0.70, 0.06]], 0.009, m.darkSteel);
      }],
      ['flapper-valve-handle-chain', 'Chrome Trip Lever Handle, Stainless Chain & Buoyant Rubber Flapper', 'Flush Trigger', false, [-0.95, 0.95, 1.25], 'Front chrome handle lever connected by a bead chain to a hollow air-pocket rubber flapper sealing the 3-inch flush seat.', 'An air bubble trapped under the rubber flapper makes it float upright for 3 seconds while the tank rushes out, then drop shut as the tank empties!', (g, m) => {
        // Exterior polished chrome flush handle + internal trip lever arm + bead chain
        rbox(g, 0.05, 0.04, 0.14, 0.015, m.chrome, [-0.28, 0.72, 0.36], [0, 0, -0.2]);
        cyl(g, 0.014, 0.014, 0.34, 12, m.brass, [-0.46, 0.72, 0.22], [Math.PI / 2, 0, 0]);
        tube(g, [[-0.46, 0.72, 0.06], [-0.48, 0.48, 0.06], [-0.52, 0.26, 0.06]], 0.006, m.chrome);
        // Red buoyant rubber flapper dome + hinge ears
        cyl(g, 0.115, 0.085, 0.045, 22, carPaint(0xdc2626), [-0.52, 0.21, 0.06], [0, 0, -0.32]);
      }],
      ['vitreous-bowl-rim-jets', 'Sculpted Vitreous China Bowl, Hollow Rim-Wash Channels & Siphon Jet', 'Bowl Hydraulics', true, [0.85, 0.45, 0], 'Non-porous glazed porcelain bowl with 24 angled rim-wash holes at the top and a high-velocity siphon jet at the bottom.', '70% of the tank water shoots straight out a hidden nozzle at the bottom of the bowl ("siphon jet") to kickstart the siphon in half a second!', (g, m) => {
        // Smooth lathed porcelain bowl profile ([axialY, radius] with rot=[0,0,0] for vertical axis)
        lathe(g, [
          [-0.44, 0.18], [-0.34, 0.24], [-0.18, 0.38], [0.04, 0.46],
          [0.10, 0.48], [0.11, 0.40], [-0.08, 0.34], [-0.28, 0.16],
        ], 32, m.white, [0.24, 0, 0], [0, 0, 0]);
        // Sculpted rear tank-to-bowl porcelain bridge
        rbox(g, 0.56, 0.32, 0.54, 0.06, m.white, [-0.22, -0.04, 0]);
      }],
      ['water-seal-p-trap', 'Standing Water Seal Pool (Sewer-Gas Barrier)', 'Sanitary Seal', false, [0.65, 0.95, 1.15], 'Crystal-clear standing water pool held in the U-bend of the bowl that blocks sewer gases from entering the bathroom.', 'That quiet pool of water in the bowl isn’t just for cleaning—it is an airtight liquid plug that seals off the city sewer line!', (g, m) => {
        cyl(g, 0.35, 0.22, 0.12, 28, m.poolWater, [0.24, -0.11, 0]);
      }],
      ['s-trap-siphon-weir', 'Internal S-Curve Siphon Trapway & Weir Crest (Cutaway)', 'Siphon Physics', false, [0, -0.95, 1.35], 'Up-and-over porcelain S-bend passage: once water crests the top weir and fills the down-leg, atmospheric pressure pushes the whole bowl out.', 'When the S-tube fills completely with water, falling water creates a partial vacuum that pulls everything out until air gulps in with a gurgle!', (g, m) => {
        tube(g, [[0.24, -0.30, 0], [0.02, -0.06, 0], [-0.18, -0.01, 0], [-0.28, -0.22, 0], [-0.30, -0.52, 0]], 0.082, m.accent);
      }],
      ['soft-close-hinged-seat', 'Ergonomic Contoured Seat, Lid & Hydraulic Soft-Close Damper Hinges', 'Seating', true, [0.95, 1.35, 0], 'Hinged seat ring and cover with rotary viscous silicone fluid dampers that prevent slamming.', 'Tiny rotary paddles spinning through thick silicone honey inside the hinge pins let the lid lower itself in complete silence!', (g, m) => {
        torus(g, 0.41, 0.058, m.white, [0.24, 0.13, 0], [Math.PI / 2, 0, 0]);
        // Raised ergonomic porcelain/polymer lid + chrome damper hinges
        cyl(g, 0.44, 0.44, 0.032, 28, m.white, [0.02, 0.46, 0], [0, 0, 1.18]);
        for (const z of [-0.16, 0.16]) cyl(g, 0.024, 0.024, 0.08, 14, m.chrome, [-0.18, 0.14, z], [Math.PI / 2, 0, 0]);
      }],
      ['wax-ring-closet-flange', 'Sculpted Pedestal Foot, Brass Closet Bolts & Golden Wax Ring Flange', 'Floor Drain Seal', false, [0, -1.55, 0], 'Floor-bolted PVC/cast-iron drain flange and compressible golden wax gasket sealing the S-trap to the house soil stack.', 'For over 100 years, plumbers have used a simple ring of golden beeswax/petroleum wax to form a waterproof, gas-tight seal under every toilet!', (g, m) => {
        rbox(g, 0.96, 0.12, 0.58, 0.055, m.white, [-0.04, -0.46, 0]);
        torus(g, 0.15, 0.042, m.brass, [-0.30, -0.55, 0], [Math.PI / 2, 0, 0]);
        for (const z of [-0.22, 0.22]) sphere(g, 0.032, 12, 10, m.white, [-0.28, -0.39, z]);
      }],
    ],
    quiz: [
      { q: 'Which curved internal passage creates a vacuum suction when water spills over its crest?', correctId: 's-trap-siphon-weir', distractors: ['float-fill-valve-ballcock', 'soft-close-hinged-seat', 'wax-ring-closet-flange'] },
      { q: 'Why does a toilet bowl always keep a pool of standing water at the bottom even after flushing?', correctId: 'water-seal-p-trap', distractors: ['porcelain-gravity-cistern', 'flapper-valve-handle-chain', 'soft-close-hinged-seat'] },
      { q: 'Which buoyant part inside the tank floats up with the water level to shut off the fill valve automatically?', correctId: 'float-fill-valve-ballcock', distractors: ['wax-ring-closet-flange', 's-trap-siphon-weir', 'vitreous-bowl-rim-jets'] },
    ],
  }),
  buildSpecModel({
    id: 'traction-passenger-elevator', name: 'High-Rise Gearless Traction Elevator', brand: 'Otis / Kone SkyRise Class', badge: '20 m/s • Counterweight Traction • Wedge Safeties',
    desc: 'Skyscraper vertical transport system with a top permanent-magnet traction sheave, steel hoist ropes, 45% counterweight frame, overspeed governor, and Otis wedge safety brakes.',
    primaryHex: 0x0284c7, accentHex: 0xf59e0b, cameraPos: [3.8, 2.2, 4.0],
    partsSpec: [
      ['gearless-traction-hoist-motor', 'Machine-Room-Less PM Synchronous Traction Motor & Grooved Sheave (CAD)', 'Top Hoist Drive', true, [0, 1.75, 0], 'Permanent-magnet synchronous motor, multi-groove traction sheave (`driveAnim="fan"`), fail-safe spring caliper brakes, and CAD gearbox.', 'Elevator motors don’t wind up the cable like a fishing reel—friction grooves on the sheave pull the cab up on one side while letting the counterweight down on the other!', (g, m) => {
        populateGearboxCad(g, { pos: [-0.08, 0.96, -0.18], scale: 0.011 });
        const sh = new THREE.Group();
        sh.position.set(-0.08, 0.96, 0);
        sh.userData.driveAnim = 'fan';
        sh.userData.spinAxis = 'z';
        g.add(sh);
        cyl(sh, 0.26, 0.26, 0.18, 28, m.accent, [0, 0, 0], [Math.PI / 2, 0, 0]);
        for (let z = -0.06; z <= 0.06; z += 0.03) torus(sh, 0.262, 0.008, m.darkSteel, [0, 0, z]);
        // Structural machine room I-beam bedplate
        rbox(g, 0.96, 0.09, 0.76, 0.02, m.darkSteel, [-0.05, 0.72, 0]);
      }],
      ['steel-hoist-ropes-hitch', '6× Braided High-Tensile Steel Hoist Ropes & Wedge Socket Hitches', 'Suspension Ropes', false, [0, 1.15, 1.35], 'Six independent 8-strand braided steel cables (each strong enough to hold the entire loaded cab by itself).', 'Every skyscraper elevator hangs from 6 to 8 separate steel cables—even a single cable has a 12× safety factor to hold the whole car!', (g, m) => {
        for (let z = -0.075; z <= 0.075; z += 0.03) {
          cyl(g, 0.007, 0.007, 0.62, 8, m.chrome, [0.18, 0.65, z]);
          cyl(g, 0.007, 0.007, 1.12, 8, m.chrome, [-0.34, 0.40, z]);
        }
      }],
      ['counterweight-ballast-frame', 'Stacked Cast-Iron Counterweight Frame & Roller Guides', 'Energy Balance', true, [-1.55, 0.25, 0], 'Heavy steel frame filled with cast-iron weight plates equal to the empty cab plus 45% of its maximum passenger load.', 'Because the counterweight balances the weight of the cab, the top motor often generates electricity on the way up when the car is less than half full!', (g, m) => {
        rbox(g, 0.14, 0.68, 0.44, 0.02, m.darkSteel, [-0.34, -0.22, 0]);
        for (let i = -3; i <= 3; i++) box(g, 0.16, 0.072, 0.38, m.accent, [-0.34, -0.22 + i * 0.088, 0]);
      }],
      ['structural-car-sling-cabin', 'Steel Car Sling, Panoramic Glass Passenger Cabin & Call Panel', 'Passenger Car', true, [1.35, 0.15, 0], 'Structural steel U-sling cradle isolating the brushed-stainless & glass passenger cabin on vibration-damping rubber pads.', 'Passengers actually ride inside a room-within-a-frame: rubber isolation pads between the steel sling and cabin block rail rumble!', (g, m) => {
        // Steel crosshead + vertical stiles + safety plank
        rbox(g, 0.70, 0.06, 0.70, 0.015, m.primary, [0.18, 0.36, 0]);
        rbox(g, 0.70, 0.06, 0.70, 0.015, m.primary, [0.18, -0.44, 0]);
        for (const z of [-0.33, 0.33]) box(g, 0.06, 0.84, 0.06, m.primary, [0.18, -0.04, z]);
        // Architectural glass & brushed stainless cabin walls + handrails + glowing LED ceiling
        rbox(g, 0.62, 0.72, 0.62, 0.02, m.glass, [0.18, -0.04, 0]);
        rbox(g, 0.58, 0.03, 0.58, 0.008, m.white, [0.18, 0.29, 0]);
        rbox(g, 0.60, 0.04, 0.60, 0.01, m.darkSteel, [0.18, -0.38, 0]);
        cyl(g, 0.012, 0.012, 0.52, 10, m.chrome, [-0.08, -0.08, 0], [Math.PI / 2, 0, 0]);
      }],
      ['automatic-sliding-doors', 'Linear Door Operator, Interlock Clutch & Infrared Light Curtain', 'Door Safety', true, [1.85, 0.15, 0.65], 'Top belt-driven door operator, mechanical landing door clutch vane, and 154-beam infrared doorway safety curtain.', 'Elevator car doors carry a mechanical "clutch blade" that physically unlocks the hallway doors only when the car is level with the floor!', (g, m) => {
        for (const z of [-0.15, 0.15]) {
          rbox(g, 0.035, 0.64, 0.27, 0.008, m.chrome, [0.50, -0.06, z]);
          rbox(g, 0.04, 0.42, 0.16, 0.006, m.glass, [0.505, 0.0, z]);
        }
        rbox(g, 0.08, 0.09, 0.64, 0.012, m.darkSteel, [0.50, 0.31, 0]);
      }],
      ['overspeed-governor-safeties', 'Centrifugal Overspeed Governor & Elisha Otis Progressive Wedge Safeties', 'Emergency Braking', false, [0.65, -0.85, 1.45], 'Flyball centrifugal governor at the top and tapered serrated steel wedges under the cab that clamp the guide rails if the car drops too fast.', 'In 1854, Elisha Otis stood inside an elevator and ordered the rope cut with an axe—his spring wedges locked onto the rails in inches!', (g, m) => {
        const red = carPaint(0xdc2626);
        cyl(g, 0.11, 0.11, 0.055, 20, red, [0.34, 0.88, 0.34], [Math.PI / 2, 0, 0]);
        for (const z of [-0.34, 0.34]) rbox(g, 0.14, 0.16, 0.10, 0.02, red, [0.18, -0.46, z]);
      }],
      ['machined-t-guide-rails', 'Precision-Machined T-Section Steel Hoistway Guide Rails & Roller Shoes', 'Vertical Guidance', false, [0, 0, -1.55], 'Vertical T-profile planed steel rails bolted to the shaft walls plus polyurethane 3-wheel roller guide shoes.', 'High-speed elevator rails are aligned with lasers to within half a millimeter so the car glides at 45 mph as smoothly as a bullet train!', (g, m) => {
        for (const z of [-0.36, 0.36]) box(g, 0.045, 1.88, 0.045, m.darkSteel, [0.18, -0.04, z]);
        for (const z of [-0.25, 0.25]) box(g, 0.038, 1.88, 0.038, m.darkSteel, [-0.34, -0.04, z]);
      }],
      ['pit-hydraulic-oil-buffers', 'Hoistway Pit Hydraulic Oil-Spring Energy Buffers & Traveling Cable', 'Bottom Pit Safety', false, [0, -1.65, 0], 'Heavy coil-spring and hydraulic piston shock absorbers mounted in the concrete pit floor below the car and counterweight.', 'At the bottom of every elevator shaft stand giant oil-filled hydraulic shock absorbers patterned after aircraft carrier landing gear!', (g, m) => {
        rbox(g, 1.18, 0.08, 0.88, 0.02, m.darkSteel, [-0.08, -0.92, 0]);
        for (const x of [-0.34, 0.18]) {
          cyl(g, 0.072, 0.085, 0.26, 18, m.accent, [x, -0.76, 0]);
          cyl(g, 0.042, 0.042, 0.18, 16, m.chrome, [x, -0.58, 0]);
          buildCoilSpring(g, [x, -0.74, 0], 0.22, 0.068, 0.01, 5, m.darkSteel);
        }
      }],
    ],
    quiz: [
      { q: 'Why does a traction elevator use a heavy cast-iron counterweight on the other side of the cables?', correctId: 'counterweight-ballast-frame', distractors: ['automatic-sliding-doors', 'pit-hydraulic-oil-buffers', 'structural-car-sling-cabin'] },
      { q: 'Which mechanical safety invention clamps onto the steel guide rails if an elevator ever drops too fast?', correctId: 'overspeed-governor-safeties', distractors: ['gearless-traction-hoist-motor', 'automatic-sliding-doors', 'steel-hoist-ropes-hitch'] },
      { q: 'What stands at the bottom of the elevator shaft pit to cushion the car and counterweight?', correctId: 'pit-hydraulic-oil-buffers', distractors: ['machined-t-guide-rails', 'counterweight-ballast-frame', 'structural-car-sling-cabin'] },
    ],
  }),
  buildSpecModel({
    id: 'pin-tumbler-lock', name: 'Brass Pin-Tumbler Cylinder Lock', brand: 'Linus Yale Jr. / Schlage Cutaway Class', badge: '5-Pin Stack • Shear-Line Mechanical Logic',
    desc: 'Cutaway solid-brass mechanical security cylinder showing how 5 spring-loaded driver pins and 5 variable-length key pins align at the exact mathematical shear line when the matching notched key is inserted.',
    primaryHex: 0xd97706, accentHex: 0x2563eb, cameraPos: [3.2, 2.0, 3.5],
    partsSpec: [
      ['brass-bible-cylinder-housing', 'Extruded Solid-Brass Cylinder Hull & 5-Chamber Pin "Bible" Tower', 'Outer Housing', true, [0, 1.35, -1.15], 'Stationary outer solid-brass cylinder housing with the upper vertical "bible" tower containing 5 precision-reamed pin chambers.', 'Locksmiths call the top rectangular tower of a pin-tumbler lock the "Bible" because it holds the secret code of the lock!', (g, m) => {
        cyl(g, 0.36, 0.36, 1.44, 32, m.brass, [0, -0.14, 0], [0, 0, Math.PI / 2]);
        // Cutaway Pin Bible Tower with individual milled inspection windows showing the 5 pin stacks
        rbox(g, 1.38, 0.56, 0.32, 0.035, m.brass, [0, 0.28, -0.04]);
        for (let i = 0; i < 5; i++) {
          cyl(g, 0.058, 0.058, 0.54, 18, m.darkSteel, [-0.44 + i * 0.22, 0.28, 0]);
        }
      }],
      ['rotating-brass-plug-core', 'Broached Keyway Rotating Brass Plug Core & Shear Line', 'Rotating Core', true, [-1.15, -0.45, 0], 'Inner cylindrical brass plug with a paracentric zig-zag keyway slot; its outer surface forms the 0.05-mm "shear line" gap.', 'A zigzag ("paracentric") keyway profile stops flat metal strips from reaching straight up to lift the pins!', (g, m) => {
        cyl(g, 0.27, 0.27, 1.48, 28, m.alu, [0, -0.14, 0], [0, 0, Math.PI / 2]);
        box(g, 1.50, 0.20, 0.042, m.darkSteel, [0, -0.16, 0]);
      }],
      ['five-bitted-key-pins', '5× Color-Coded Variable-Length Bottom Key Pins (Cuts #1–#5)', 'Mechanical Code', false, [0, -0.85, 1.45], 'Five conical-tip bottom pins of different exact heights matching the V-notches ("bitting") cut into the key blade.', 'With 5 pins and 10 possible height steps per pin, a single lock cylinder has 100,000 different possible key combinations!', (g) => {
        const heights = [0.16, 0.24, 0.14, 0.26, 0.18];
        const cols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
        for (let i = 0; i < 5; i++) {
          const x = -0.44 + i * 0.22;
          const pMat = carPaint(cols[i]);
          cyl(g, 0.046, 0.046, heights[i], 18, pMat, [x, 0.02 - heights[i] * 0.5, 0.08]);
          cone(g, 0.046, 0.04, 18, pMat, [x, 0.02 - heights[i] - 0.02, 0.08], [Math.PI, 0, 0]);
        }
      }],
      ['spool-serrated-driver-pins', '5× Hardened Upper Driver Pins (Anti-Pick Spool & Serrated Pins)', 'Shear-Line Blockers', false, [0, 0.85, 1.45], 'Five upper pins pushed down across the shear line by springs to block the plug from turning until the right key lifts them flush.', 'Spool-shaped driver pins have narrow waists that catch on the edge of the plug to defeat lock-picking tension tools!', (g, m) => {
        for (let i = 0; i < 5; i++) {
          const x = -0.44 + i * 0.22;
          cyl(g, 0.046, 0.046, 0.05, 18, m.copper, [x, 0.19, 0.08]);
          cyl(g, 0.028, 0.028, 0.08, 16, m.copper, [x, 0.13, 0.08]);
          cyl(g, 0.046, 0.046, 0.05, 18, m.copper, [x, 0.07, 0.08]);
        }
      }],
      ['phosphor-bronze-coil-springs', '5× Phosphor-Bronze Compression Springs & Top Brass Retainer Cap', 'Spring Preload', false, [0, 1.65, 0], 'Corrosion-resistant phosphor-bronze helical springs pushing the 5 pin stacks downward plus the sliding brass top cap.', 'Phosphor-bronze springs never rust and keep their bounce after hundreds of thousands of key insertions!', (g, m) => {
        rbox(g, 1.36, 0.055, 0.30, 0.012, m.brass, [0, 0.56, -0.02]);
        for (let i = 0; i < 5; i++) {
          buildCoilSpring(g, [-0.44 + i * 0.22, 0.38, 0.08], 0.24, 0.040, 0.008, 6, m.chrome);
        }
      }],
      ['notched-bitted-brass-key', 'Nickel-Silver Bitted Key Blade, Shoulder Stop & Sculpted Bow Handle', 'Key Input', true, [1.95, -0.15, 0], 'Precision-milled key blade with 5 V-shaped bitting ramps that lift all 5 pin stacks to the exact shear line simultaneously.', 'The flat "shoulder" collar on a key stops it at the exact millimeter so all 5 V-notches line up directly underneath the 5 pins!', (g, m) => {
        box(g, 1.28, 0.16, 0.034, m.chrome, [0.32, -0.18, 0.08]);
        // Sculpted hexagonal Schlage-style key bow handle with keyring hole
        rbox(g, 0.48, 0.44, 0.048, 0.08, m.brass, [1.14, -0.14, 0.08]);
        cyl(g, 0.075, 0.075, 0.056, 20, m.darkSteel, [1.24, -0.14, 0.08], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 5; i++) box(g, 0.08, 0.06, 0.038, m.brass, [-0.44 + i * 0.22, -0.10, 0.08], [0, 0, Math.PI / 4]);
      }],
      ['rotating-tailpiece-cam-bolt', 'Rear Rotating Actuator Cam, Retaining Clip & Deadbolt Throw Bar', 'Deadbolt Actuation', true, [-1.65, -0.15, 0], 'Hardened steel cam pawl screwed to the back of the plug that throws the heavy steel deadbolt when the key turns.', 'Turning the key doesn’t push the door bolt directly—it spins a small crescent-shaped cam on the back that levers the heavy deadbolt out!', (g, m) => {
        cyl(g, 0.22, 0.22, 0.08, 22, m.darkSteel, [-0.80, -0.14, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.11, 0.36, 0.16, 0.03, m.accent, [-0.86, -0.26, 0.12], [0.55, 0, 0]);
      }],
      ['hardened-anti-drill-armor', 'Front Armored Escutcheon Collar & Tungsten-Carbide Anti-Drill Pins', 'Physical Security', true, [1.15, 0.45, 0], 'Beveled front armored trim ring and embedded tungsten-carbide rods forward of Chamber #1 that shatter drill bits.', 'Two tiny rods of diamond-hard tungsten carbide hidden right behind the keyhole spin and shatter burglar drill bits!', (g, m) => {
        torus(g, 0.36, 0.055, m.chrome, [0.74, -0.14, 0], [0, Math.PI / 2, 0]);
        for (const z of [-0.14, 0.14]) cyl(g, 0.022, 0.022, 0.34, 14, m.chrome, [0.66, 0.08, z]);
      }],
    ],
    quiz: [
      { q: 'What must line up precisely with the outer edge of the rotating brass plug ("the shear line") before the key can turn?', correctId: 'five-bitted-key-pins', distractors: ['hardened-anti-drill-armor', 'rotating-tailpiece-cam-bolt', 'phosphor-bronze-coil-springs'] },
      { q: 'Which upper pins are pushed down across the gap by springs to block the lock from turning when no key is inside?', correctId: 'spool-serrated-driver-pins', distractors: ['notched-bitted-brass-key', 'rotating-tailpiece-cam-bolt', 'hardened-anti-drill-armor'] },
      { q: 'Which crescent-shaped lever on the back of the cylinder actually throws the door deadbolt when the plug rotates?', correctId: 'rotating-tailpiece-cam-bolt', distractors: ['brass-bible-cylinder-housing', 'five-bitted-key-pins', 'phosphor-bronze-coil-springs'] },
    ],
  }),
  buildSpecModel({
    id: 'italian-espresso-machine', name: 'Dual-Boiler 9-Bar Espresso Machine', brand: 'La Marzocco / Faema E61 Class', badge: '9 Bar Extraction • PID Dual Copper Boilers',
    desc: 'Commercial-grade Italian espresso machine cutaway revealing the 9-bar brass rotary vane pump, twin insulated copper boilers, thermosyphon E61 grouphead, and 58mm portafilter.',
    primaryHex: 0xdc2626, accentHex: 0xd97706, cameraPos: [3.5, 2.1, 3.7],
    partsSpec: [
      ['stainless-chassis-cup-warmer', 'Mirror-Polished 304 Stainless Chassis, Frame & Top Passive Cup Warmer', 'Exterior Chassis', true, [-0.95, 1.25, 0], 'Folded mirror-chromed stainless body panels, Rosso Corsa side cheeks, and vented top cup-warming rail with porcelain espresso demitasse cups.', 'Pre-warming porcelain espresso cups on top of the machine keeps a 1-ounce shot from losing 10°C the instant it hits the cup!', (g, m) => {
        rbox(g, 1.08, 0.82, 0.92, 0.045, m.primary, [-0.15, 0.05, 0]);
        rbox(g, 0.12, 0.78, 0.88, 0.02, m.chrome, [0.36, 0.05, 0]);
        rbox(g, 1.14, 0.05, 0.96, 0.02, m.chrome, [-0.15, 0.49, 0]);
        // Tubular chrome cup-warmer rail + 4 porcelain demitasse cups on top
        for (const z of [-0.42, 0.42]) cyl(g, 0.012, 0.012, 0.96, 12, m.chrome, [-0.15, 0.55, z], [0, 0, Math.PI / 2]);
        for (const [cx, cz] of [[-0.32, -0.22], [-0.08, -0.22], [-0.32, 0.22], [-0.08, 0.22]]) {
          cyl(g, 0.065, 0.048, 0.09, 18, m.white, [cx, 0.56, cz]);
          torus(g, 0.028, 0.008, m.white, [cx, 0.56, cz + 0.065]);
        }
      }],
      ['rotary-vane-9bar-pump', '9-Bar Brass Positive-Displacement Rotary Vane Pump & Motor', 'Hydraulic Pressure', false, [-1.25, -0.85, 1.15], 'Electric motor coupled to a graphite-chamber brass rotary vane pump pressurizing water to 9 atmospheres (130 PSI).', '9 bars of pressure—9 times Earth’s atmospheric pressure—is required to force hot water through finely ground coffee and emulsify its golden crema oils!', (g, m) => {
        cyl(g, 0.15, 0.15, 0.34, 22, m.darkSteel, [-0.36, -0.22, 0.22], [0, 0, Math.PI / 2]);
        cyl(g, 0.095, 0.095, 0.18, 20, m.brass, [-0.10, -0.22, 0.22], [0, 0, Math.PI / 2]);
      }],
      ['dual-copper-pid-boilers', 'Twin Insulated Copper Boilers (93°C Brew Boiler + 125°C Steam Boiler)', 'Thermal Engineering', false, [-0.35, 0.95, -1.25], 'Two thick-walled copper pressure vessels with immersion heating coils and PID solid-state temperature control.', 'Using two separate copper boilers lets the machine brew coffee at a gentle 93.0°C while simultaneously making dry steam at 125°C!', (g, m) => {
        cyl(g, 0.16, 0.16, 0.36, 24, m.copper, [-0.20, 0.08, -0.18]);
        sphere(g, 0.16, 20, 14, m.copper, [-0.20, 0.26, -0.18]);
        cyl(g, 0.18, 0.18, 0.38, 24, m.copper, [-0.20, 0.08, 0.20]);
        sphere(g, 0.18, 20, 14, m.copper, [-0.20, 0.27, 0.20]);
      }],
      ['e61-thermosyphon-grouphead', '4-kg Chrome-Plated Brass E61 Thermosyphon Grouphead & 3-Way Valve', 'Brew Grouphead', true, [1.25, 0.45, 0], 'Iconic 1961 Faema E61 solid brass brew head heated by a continuous hot-water thermosyphon loop plus a 3-way pressure-release solenoid.', 'After you pull a shot, the 3-way valve vents the 9 bars of leftover water pressure down into the drip tray so the coffee puck doesn’t explode in your face!', (g, m) => {
        cyl(g, 0.16, 0.16, 0.26, 28, m.chrome, [0.52, 0.14, 0]);
        torus(g, 0.165, 0.018, m.brass, [0.52, 0.22, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.042, 0.042, 0.26, 16, m.chrome, [0.52, -0.06, 0]);
        // Manual mechanical E61 cam brew lever with black ball knob on the right side
        cyl(g, 0.012, 0.012, 0.22, 12, m.chrome, [0.56, 0.16, 0.18], [0, 0, -0.5]);
        sphere(g, 0.032, 14, 12, m.darkSteel, [0.62, 0.25, 0.18]);
      }],
      ['portafilter-58mm-basket', '58mm Stainless Portafilter, Precision Shower Screen & Dual Spouts', 'Extraction Filter', true, [1.85, -0.35, 0], 'Bayonet-locking forged brass/stainless portafilter holding a laser-perforated 20-gram filter basket and walnut ergonomic handle.', 'A 58mm espresso basket has over 600 microscopic laser-drilled holes—and at 9 bars, almost 400 pounds of total downward force pushes on that coffee puck!', (g, m) => {
        cyl(g, 0.155, 0.135, 0.095, 26, m.chrome, [0.52, -0.04, 0]);
        // Dual curved espresso pour spouts
        for (const z of [-0.045, 0.045]) cyl(g, 0.016, 0.012, 0.06, 12, m.chrome, [0.52, -0.11, z]);
        // Turned walnut handle + chrome collar
        cyl(g, 0.024, 0.024, 0.10, 14, m.chrome, [0.68, -0.04, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.042, 0.030, 0.44, 20, mat(0x451a03, { roughness: 0.42 }), [0.94, -0.04, 0], [0, 0, Math.PI / 2]);
      }],
      ['articulated-steam-wand-gauges', 'Ball-Joint Cool-Touch Steam Wand, Hot-Water Tap & Dual Bourbon Gauges', 'Barista Controls', true, [1.15, 0.75, 1.25], 'Double-walled stainless milk-frothing steam wand, rotary brass steam valve knob, and dual boiler/pump pressure gauges.', 'Micro-holes in the steam wand tip whip microscopic air bubbles into milk at sonic speed to create velvety latte art microfoam!', (g, m) => {
        tube(g, [[0.42, 0.28, 0.34], [0.56, 0.05, 0.42], [0.52, -0.24, 0.38]], 0.018, m.chrome);
        tube(g, [[0.42, 0.28, -0.34], [0.54, 0.06, -0.38], [0.52, -0.18, -0.36]], 0.016, m.chrome);
        for (const z of [-0.26, 0.26]) {
          cyl(g, 0.075, 0.075, 0.03, 22, m.brass, [0.43, 0.34, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.062, 0.062, 0.034, 20, m.white, [0.432, 0.34, z], [0, 0, Math.PI / 2]);
        }
      }],
      ['copper-manifold-opv-plumbing', 'Braided Copper Heat-Exchanger Tubing, Flowmeter & OPV Relief Valve', 'Internal Plumbing', false, [0, -0.45, -1.45], 'Hand-bent copper high-pressure water lines, Gicar hall-effect paddlewheel flowmeter, and calibrated 9-bar Over-Pressure Valve (OPV).', 'A tiny spinning paddlewheel with a magnet inside the cold-water line counts exact milliliters to stop a double shot automatically!', (g, m) => {
        tube(g, [[-0.36, -0.22, 0.22], [-0.20, 0.18, -0.18], [0.52, 0.14, 0]], 0.02, m.copper);
        cyl(g, 0.055, 0.055, 0.10, 16, m.brass, [0.12, 0.16, -0.08]);
      }],
      ['drip-tray-reservoir-tank', '2.5-Liter BPA-Free Water Reservoir, Level Probe & Stainless Drip Tray', 'Water & Drainage', true, [0.55, -1.35, 0], 'Removable rear water reservoir with low-water capacitive sensor plus a front stainless-steel slotted drip grate and waste basin with twin espresso cups.', 'Because espresso is 90% water, built-in ion-exchange resin filters inside the tank soften the water so limestone scale never clogs the copper tubes!', (g, m) => {
        rbox(g, 0.54, 0.13, 0.90, 0.03, m.chrome, [0.50, -0.34, 0]);
        rbox(g, 0.26, 0.66, 0.74, 0.025, m.glass, [-0.52, 0.06, 0]);
        // Two porcelain espresso cups sitting on the drip tray under the portafilter spouts
        for (const z of [-0.07, 0.07]) {
          cyl(g, 0.055, 0.042, 0.085, 18, m.white, [0.52, -0.23, z]);
          cyl(g, 0.048, 0.048, 0.015, 16, mat(0x78350f, { roughness: 0.3 }), [0.52, -0.19, z]);
        }
      }],
    ],
    quiz: [
      { q: 'Which component pressurizes water to 9 atmospheres (130 PSI) to emulsify coffee oils into golden crema?', correctId: 'rotary-vane-9bar-pump', distractors: ['stainless-chassis-cup-warmer', 'drip-tray-reservoir-tank', 'articulated-steam-wand-gauges'] },
      { q: 'Why does a pro espresso machine use two separate copper boilers instead of just one?', correctId: 'dual-copper-pid-boilers', distractors: ['portafilter-58mm-basket', 'drip-tray-reservoir-tank', 'stainless-chassis-cup-warmer'] },
      { q: 'Which heavy chrome-plated brass assembly on the front holds the 3-way valve that vents pressure after a shot?', correctId: 'e61-thermosyphon-grouphead', distractors: ['rotary-vane-9bar-pump', 'copper-manifold-opv-plumbing', 'drip-tray-reservoir-tank'] },
    ],
  }),
];

export const SHIPS_CATEGORY = {
  id: 'ships', name: 'Ships & Ocean Liners', fullName: 'Cruise Ships, Superyachts, Container Ships & Carriers', emoji: '🚢', icon: '🚢',
  tagline: 'Royal Caribbean Quantum of the Seas • 118m Superyacht Launchpad • 24,000-TEU Container Ship • Nuclear Supercarrier • RMS Titanic',
  models: SHIP_MODELS,
};
export const EVERYDAY_CATEGORY = {
  id: 'everyday', name: 'Everyday Machines', fullName: 'Toilets, Elevators, Locks & Espresso Machines', emoji: '⚙️', icon: '⚙️',
  tagline: 'Gravity Siphon Flush Toilet • High-Rise Gearless Traction Elevator • Brass Pin-Tumbler Lock • 9-Bar Espresso Machine',
  models: EVERYDAY_MODELS,
};
