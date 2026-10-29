// CAD-Fidelity 3D Rockets (`rockets`), Robots & Rovers (`robots`), and Construction & Farm (`construction`) Models.
import * as THREE from '../../vendor/three.module.js';
import {
  mat, carPaint, brushedMetal, chromeMat, carbonFiberMat, glassMat, emissiveMat, screenMat,
  box, rbox, cyl, sphere, torus, cone, tube, lathe, extrudeProfile, buildHexBoltArray, buildWiringHarness,
} from '../materials.js';
import {
  addRocketEngineCad, populateGearboxCad, populateEngineCad,
  populateSaturnVCad, populatePerseveranceCad, populateIngenuityCad,
} from '../cad_loader.js';
import { buildIronManMark85Model } from './iron_man_mark85.js';

// Builds a vertical downward-firing multi-nozzle engine cluster at y = baseY (pointing toward -Y)
function buildMultiNozzleCluster(g, { count = 9, ringR = 0.19, nozzleR = 0.055, y = -1.78, includeCadCenter = true } = {}) {
  const inconel = brushedMetal(0x475569, { metalness: 0.9, roughness: 0.22 });
  const copper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const glow = emissiveMat(0xf97316, 1.4);
  if (includeCadCenter) {
    const centerGroup = new THREE.Group();
    g.add(centerGroup);
    addRocketEngineCad(centerGroup, { pos: [0, y + 0.06, 0], scale: 0.0022, rot: [0, 0, Math.PI / 2], replaceFallback: false });
  }
  // Center gimbaled engine bell (apex at top +Y, open mouth at bottom -Y)
  cone(g, nozzleR * 1.15, 0.24, 24, inconel, [0, y, 0], [0, 0, 0]);
  cyl(g, nozzleR * 0.45, nozzleR * 0.95, 0.18, 20, copper, [0, y + 0.02, 0]);
  cyl(g, nozzleR * 0.72, nozzleR * 0.42, 0.04, 18, glow, [0, y - 0.1, 0]);
  // Outer ring of engines
  for (let i = 0; i < count - 1; i++) {
    const a = (i / (count - 1)) * Math.PI * 2;
    const x = Math.cos(a) * ringR;
    const z = Math.sin(a) * ringR;
    cone(g, nozzleR, 0.22, 20, inconel, [x, y, z], [0, 0, 0]);
    cyl(g, nozzleR * 0.42, nozzleR * 0.88, 0.16, 18, copper, [x, y + 0.02, z]);
    cyl(g, nozzleR * 0.65, nozzleR * 0.4, 0.04, 16, glow, [x, y - 0.09, z]);
  }
}

function buildRocketModel(cfg) {
  const whiteHull = mat(0xf8fafc, { roughness: 0.26, metalness: 0.14 });
  const steelHull = brushedMetal(0xcbd5e1, { metalness: 0.92, roughness: 0.15 });
  const blackCarbon = carbonFiberMat([5, 5]);
  const blackTile = mat(0x0f172a, { roughness: 0.38, metalness: 0.2 });
  const cryoBlue = brushedMetal(0x38bdf8, { metalness: 0.85, roughness: 0.22 });
  const rp1Gold = brushedMetal(0xf59e0b, { metalness: 0.88, roughness: 0.2 });
  const inconel = brushedMetal(0x475569, { metalness: 0.9, roughness: 0.22 });
  const isStarship = cfg.id === 'spacex-starship-superheavy';
  const isSaturn = cfg.id === 'nasa-saturn-v-apollo';
  const hullMat = isStarship ? steelHull : whiteHull;
  const r = cfg.radius;

  const parts = [
    {
      id: 'first-stage-engines',
      name: cfg.engName,
      category: 'First-Stage Propulsion',
      isOuter: false,
      explodeOffset: [0, -1.85, 0],
      desc: cfg.engDesc,
      funFact: cfg.engFact,
      build(g) {
        if (isSaturn) populateSaturnVCad(g, { zone: 'f1-engines' });
        buildMultiNozzleCluster(g, {
          count: cfg.nozzleCount,
          ringR: r * 0.68,
          nozzleR: cfg.nozzleR,
          y: -1.82,
          includeCadCenter: !isSaturn,
        });
        // Thrust Octaweb / Engine Skirt & Hold-Down Lugs at base of rocket
        cyl(g, r, r * 1.04, 0.28, 36, isSaturn ? whiteHull : blackCarbon, [0, -1.62, 0]);
        torus(g, r * 1.02, 0.018, inconel, [0, -1.74, 0], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          rbox(g, 0.07, 0.12, 0.07, 0.012, inconel, [Math.cos(a) * (r * 1.05), -1.72, Math.sin(a) * (r * 1.05)]);
        }
      },
    },
    {
      id: 'booster-airframe-hull',
      name: cfg.boosterName,
      category: 'First-Stage Structure',
      isOuter: true,
      explodeOffset: [-1.45, -0.35, 0],
      desc: cfg.boosterDesc,
      funFact: cfg.boosterFact,
      build(g) {
        if (isSaturn) populateSaturnVCad(g, { zone: 's-ic' });
        // Vertical first-stage booster tank cylinder along +Y
        cyl(g, r, r, 1.56, 40, hullMat, [0, -0.78, 0]);
        // Circumferential weld seams / Saturn V black roll-pattern bands
        for (const ry of [-1.42, -1.12, -0.82, -0.52, -0.22]) {
          torus(g, r * 1.005, 0.008, isStarship ? inconel : blackTile, [0, ry, 0], [Math.PI / 2, 0, 0]);
        }
        if (isSaturn) {
          // Saturn V iconic black-and-white vertical roll stripes & LOX feedline fairings
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            box(g, 0.08, 0.45, 0.03, blackTile, [Math.cos(a) * (r * 0.99), -1.25, Math.sin(a) * (r * 0.99)], [0, -a, 0]);
            cyl(g, 0.025, 0.03, 1.48, 12, whiteHull, [Math.cos(a + 0.4) * (r * 1.02), -0.82, Math.sin(a + 0.4) * (r * 1.02)]);
          }
        } else {
          // External COPV avionics & propellant raceway tunnels along booster spine
          for (const side of [-1, 1]) {
            rbox(g, 0.045, 1.48, 0.055, 0.012, isStarship ? steelHull : blackCarbon, [0, -0.78, side * (r + 0.015)]);
          }
        }
      },
    },
    {
      id: 'cryo-lox-fuel-tanks',
      name: 'Internal Cutaway Liquid Oxygen (LOX) & Fuel Cryotanks + Downcomer',
      category: 'Cryogenic Propellant',
      isOuter: false,
      explodeOffset: [1.55, -0.55, 0],
      desc: 'Pressurized internal domes separating -183°C Liquid Oxygen from fuel, connected by a central transfer downcomer pipe and anti-slosh baffles.',
      funFact: 'Over 90% of an orbital rocket’s liftoff weight is ultra-cold liquid propellant that burns away in just a few minutes!',
      build(g) {
        const tr = isSaturn ? 0.18 : r * 0.82;
        // Upper LOX tank + hemispherical domes
        cyl(g, tr, tr, 0.56, 28, cryoBlue, [0, -0.42, 0]);
        sphere(g, tr, 20, cryoBlue, [0, -0.14, 0], [0, 0, 0], [1, 0.55, 1]);
        sphere(g, tr, 20, cryoBlue, [0, -0.7, 0], [0, 0, 0], [1, 0.55, 1]);
        // Lower RP-1 / Methane fuel tank + domes
        cyl(g, tr, tr, 0.54, 28, rp1Gold, [0, -1.16, 0]);
        sphere(g, tr, 20, rp1Gold, [0, -0.89, 0], [0, 0, 0], [1, 0.55, 1]);
        sphere(g, tr, 20, rp1Gold, [0, -1.43, 0], [0, 0, 0], [1, 0.55, 1]);
        // Central insulated LOX transfer downcomer pipe & anti-slosh ring baffles
        cyl(g, 0.034, 0.034, 1.38, 16, chromeMat(), [0, -0.82, 0]);
        for (const by of [-0.32, -0.52, -1.06, -1.26]) {
          torus(g, tr * 0.94, 0.012, chromeMat(), [0, by, 0], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'grid-fins-landing-legs',
      name: cfg.finLegName,
      category: 'Aerodynamics & Recovery',
      isOuter: true,
      explodeOffset: [1.35, -0.95, 1.35],
      desc: cfg.finLegDesc,
      funFact: cfg.finLegFact,
      build(g) {
        if (isSaturn) populateSaturnVCad(g, { zone: 'fins' });
        for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
          const x = Math.cos(a) * (r + 0.07);
          const z = Math.sin(a) * (r + 0.07);
          if (!isSaturn) {
            // Hypersonic waffle grid fins near top of booster (y = -0.06)
            box(g, 0.14, 0.028, 0.14, isStarship ? inconel : blackCarbon, [x, -0.06, z], [0, -a, 0]);
            for (const gOff of [-0.04, 0, 0.04]) {
              box(g, 0.13, 0.024, 0.008, inconel, [x, -0.06, z + gOff * Math.cos(a)], [0, -a, 0]);
            }
          }
          // Base stabilizer fins (Saturn V), carbon landing legs (Falcon 9), or chine fairings (Starship)
          const bx = Math.cos(a) * (r * 1.04);
          const bz = Math.sin(a) * (r * 1.04);
          if (isSaturn) {
            box(g, 0.18, 0.32, 0.028, whiteHull, [bx * 1.12, -1.58, bz * 1.12], [0, -a, -0.28]);
          } else if (isStarship) {
            // Starship aft & forward body aero flaps
            if (a === 0 || a === Math.PI) {
              box(g, 0.16, 0.36, 0.026, blackTile, [bx * 1.06, 0.62, bz * 1.06], [0, -a, 0]);
              box(g, 0.12, 0.24, 0.022, blackTile, [bx * 0.85, 1.62, bz * 0.85], [0, -a, 0.18]);
            }
          } else {
            // Falcon 9 stowed carbon-fiber landing leg fairings & pneumatic struts
            rbox(g, 0.055, 0.46, 0.08, 0.015, blackCarbon, [bx, -1.32, bz], [0, -a, -0.12]);
          }
        }
      },
    },
    {
      id: 'interstage-stage-sep',
      name: cfg.interstageName,
      category: isSaturn ? 'Second Stage (S-II)' : 'Stage Separation',
      isOuter: true,
      explodeOffset: [-1.35, 0.25, 1.15],
      desc: cfg.interstageDesc || 'Composite/steel interstage collar housing pneumatic pushers or hot-stage vents and cold-gas Nitrogen RCS thrusters.',
      funFact: cfg.interstageFact || 'Falcon 9 uses compressed helium pneumatic pushers instead of explosive bolts so every stage separation can be tested before launch!',
      build(g) {
        if (isSaturn) {
          populateSaturnVCad(g, { zone: 's-ii' });
          // S-II Second Stage hull + 5× Rocketdyne J-2 LH2/LOX engine bells at base of S-II + ullage fairings
          cyl(g, r * 0.99, r * 0.99, 0.44, 36, whiteHull, [0, 0.16, 0]);
          buildMultiNozzleCluster(g, {
            count: 5,
            ringR: r * 0.56,
            nozzleR: 0.045,
            y: -0.06,
            includeCadCenter: false,
          });
        } else {
          cyl(g, r * 1.01, r * 1.01, 0.36, 36, isStarship ? inconel : blackCarbon, [0, 0.16, 0]);
        }
        torus(g, r * 1.02, 0.018, chromeMat(), [0, 0.32, 0], [Math.PI / 2, 0, 0]);
        torus(g, r * 1.02, 0.018, chromeMat(), [0, 0.0, 0], [Math.PI / 2, 0, 0]);
        if (isStarship) {
          // Vented hot-staging ring slots & dome blast shield
          cone(g, r * 0.96, 0.12, 28, inconel, [0, 0.06, 0]);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            box(g, 0.025, 0.12, 0.04, blackTile, [Math.cos(a) * (r * 1.01), 0.16, Math.sin(a) * (r * 1.01)], [0, -a, 0]);
          }
        }
      },
    },
    {
      id: 'upper-stage-vacuum-engine',
      name: cfg.vacEngName,
      category: isSaturn ? 'Third Stage (S-IVB)' : 'Upper-Stage Propulsion',
      isOuter: false,
      explodeOffset: [1.45, 0.42, 0],
      desc: cfg.vacEngDesc || 'Huge radiatively-cooled Niobium/Inconel vacuum nozzle optimized to expand exhaust gases to maximum speed in the vacuum of space.',
      funFact: cfg.vacEngFact || 'Vacuum rocket nozzles have giant bells up to 5× wider than sea-level nozzles because there is zero atmospheric pressure pushing back in space!',
      build(g) {
        // Saturn V: the single J-2 hangs inside the conical S-IVB aft interstage (studio y ≈ 0.85–1.05) below the S-IVB tank.
        const ey = isSaturn ? 0.56 : 0;
        addRocketEngineCad(g, { pos: [0, 0.48 + ey, 0], scale: isSaturn ? 0.0018 : 0.0022, rot: [0, 0, Math.PI / 2], replaceFallback: false });
        if (isStarship) {
          // Starship 6-Raptor Aft Propulsion Bay: 3× outer giant Raptor Vacuum (RVac) bells + 3× center gimbaled Sea-Level Raptors
          for (let i = 0; i < 3; i++) {
            const aVac = (i / 3) * Math.PI * 2;
            const vx = Math.cos(aVac) * (r * 0.56);
            const vz = Math.sin(aVac) * (r * 0.56);
            cone(g, 0.095, 0.28, 24, inconel, [vx, 0.44, vz]);
            torus(g, 0.088, 0.009, rp1Gold, [vx, 0.34, vz], [Math.PI / 2, 0, 0]);
            const aSl = aVac + Math.PI / 3;
            const sx = Math.cos(aSl) * (r * 0.24);
            const sz = Math.sin(aSl) * (r * 0.24);
            cone(g, 0.052, 0.18, 20, chromeMat(), [sx, 0.46, sz]);
          }
        } else {
          cone(g, isSaturn ? 0.15 : r * 0.72, 0.32, 28, inconel, [0, 0.42 + ey, 0], [0, 0, 0]);
          torus(g, isSaturn ? 0.14 : r * 0.68, 0.014, rp1Gold, [0, 0.32 + ey, 0], [Math.PI / 2, 0, 0]);
        }
      },
    },
    {
      id: 'upper-stage-ship-hull',
      name: cfg.upperHullName,
      category: 'Upper Stage / Spacecraft',
      isOuter: true,
      explodeOffset: [-1.45, 0.88, -0.95],
      desc: cfg.upperHullDesc || (isStarship ? 'Stainless-steel Starship spacecraft hull clad with 18,000 hexagonal black silica thermal protection tiles on the windward belly.' : 'Upper-stage propellant tank hull, avionics ring, and inertial guidance lasers.'),
      funFact: cfg.upperHullFact || (isStarship ? 'Starship’s 18,000 hexagonal heat-shield tiles are pinned mechanically so robotic arms can inspect them between orbital flights!' : 'The Saturn V Instrument Unit computer had less memory than a modern musical greeting card yet guided astronauts to the Moon!'),
      build(g) {
        if (isSaturn) populateSaturnVCad(g, { zone: 's-ivb' });
        cyl(g, r * 0.98, r * 0.98, 0.94, 36, hullMat, [0, 0.82, 0]);
        for (const ry of [0.48, 0.82, 1.16]) {
          torus(g, r * 0.99, 0.009, isStarship ? inconel : blackTile, [0, ry, 0], [Math.PI / 2, 0, 0]);
        }
        if (isSaturn) {
          // S-IVB Auxiliary Propulsion System (APS) pods + IBM Instrument Unit black-and-gold guidance collar at y = 1.24
          for (const side of [-1, 1]) {
            rbox(g, 0.05, 0.14, 0.06, 0.01, whiteHull, [side * (r * 0.98), 0.56, 0]);
          }
          cyl(g, r * 0.99, r * 0.99, 0.08, 36, blackTile, [0, 1.25, 0]);
          torus(g, r * 0.995, 0.01, rp1Gold, [0, 1.25, 0], [Math.PI / 2, 0, 0]);
        }
        if (isStarship) {
          // Black silica hexagonal heat-shield belly cladding on windward side (+Z)
          const bellyGeo = new THREE.CylinderGeometry(r * 0.995, r * 0.995, 0.92, 28, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
          const bellyM = new THREE.Mesh(bellyGeo, blackTile);
          bellyM.position.set(0, 0.82, 0);
          g.add(bellyM);
        }
      },
    },
    {
      id: 'payload-stack-module',
      name: cfg.payloadName,
      category: 'Orbital Payload',
      isOuter: false,
      explodeOffset: [1.45, 1.42, 0],
      desc: cfg.payloadDesc,
      funFact: cfg.payloadFact,
      build(g) {
        const ps = isSaturn ? 0.14 : 0.22;
        if (isSaturn) {
          // Apollo LM folded inside the SLA cone (studio y 1.75–2.05): S-IVB forward skirt / SLA base ring, octagonal
          // gold-Kapton Descent Stage + 4 folded landing legs & footpads, Ascent Stage cabin + RCS thruster quads.
          cyl(g, 0.095, 0.158, 0.05, 24, chromeMat(), [0, 1.765, 0]);
          cone(g, 0.04, 0.07, 16, inconel, [0, 1.80, 0]);
          cyl(g, 0.105, 0.105, 0.1, 8, rp1Gold, [0, 1.87, 0]);
          sphere(g, 0.08, 16, whiteHull, [0, 1.985, 0]);
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            cyl(g, 0.007, 0.007, 0.15, 8, rp1Gold, [Math.cos(a) * 0.105, 1.87, Math.sin(a) * 0.105], [0, 0, 0]);
            cyl(g, 0.022, 0.022, 0.008, 12, rp1Gold, [Math.cos(a) * 0.105, 1.795, Math.sin(a) * 0.105]);
            rbox(g, 0.024, 0.024, 0.024, 0.004, chromeMat(), [Math.cos(a) * 0.082, 1.99, Math.sin(a) * 0.082]);
          }
        } else {
          // Payload adapter cone + Starlink flat-pack stack
          cyl(g, r * 0.56, r * 0.72, 0.14, 24, chromeMat(), [0, 1.32, 0]);
          for (let i = 0; i < 5; i++) {
            rbox(g, ps, 0.055, ps, 0.01, rp1Gold, [0, 1.44 + i * 0.075, 0]);
          }
          if (isStarship) {
            // Starship Nosecone Landing Propellant Header Tanks (LOX tip sphere + CH4 header dome & downcomer)
            sphere(g, 0.095, 20, cryoBlue, [0, 2.08, 0]);
            sphere(g, 0.12, 20, rp1Gold, [0, 1.86, 0]);
            cyl(g, 0.018, 0.018, 0.75, 12, chromeMat(), [0, 1.72, 0.14]);
          }
        }
      },
    },
    {
      id: 'payload-fairing-nosecone',
      name: cfg.fairingName,
      category: isSaturn ? 'Apollo CSM & Launch Escape' : 'Payload Fairing & Nose',
      isOuter: true,
      explodeOffset: [0, 1.95, 0],
      desc: cfg.fairingDesc || 'Sculpted aerodynamic nose cone / clamshell payload fairing halves lined with acoustic absorbers.',
      funFact: cfg.fairingFact || 'SpaceX catches falling $6 million carbon-fiber payload fairing halves in the ocean using GPS-steered parafoils!',
      build(g) {
        if (isSaturn) populateSaturnVCad(g, { zone: 'csm-les' });
        // Vertical revolved ogive nosecone along +Y (rot = [0, 0, 0])
        lathe(
          g,
          [
            [1.28, r * 0.98],
            [1.58, r * 0.88],
            [1.88, r * 0.58],
            [2.14, r * 0.22],
            [2.26, 0.015],
          ],
          36,
          hullMat,
          [0, 0, 0],
          [0, 0, 0],
        );
        if (isStarship) {
          const noseTile = new THREE.ConeGeometry(r * 0.96, 0.94, 28, 1, true, -Math.PI * 0.42, Math.PI * 0.84);
          const nm = new THREE.Mesh(noseTile, blackTile);
          nm.position.set(0, 1.76, 0);
          g.add(nm);
        }
        if (isSaturn) {
          // Apollo Service Module (silver cylinder + SPS nozzle) + Command Module cone + Launch Escape System (LES) tower
          cyl(g, 0.14, 0.14, 0.28, 28, steelHull, [0, 1.92, 0]);
          cone(g, 0.075, 0.14, 20, inconel, [0, 1.74, 0]);
          cone(g, 0.14, 0.18, 28, whiteHull, [0, 2.15, 0]);
          cyl(g, 0.022, 0.038, 0.44, 14, whiteHull, [0, 2.42, 0]);
          cone(g, 0.042, 0.12, 14, carPaint(0xdc2626), [0, 2.66, 0]);
        }
      },
    },
  ];
  return {
    id: cfg.id,
    name: cfg.name,
    brand: cfg.brand,
    badge: cfg.badge,
    desc: cfg.desc,
    cameraPos: isSaturn ? [5.2, 2.35, 5.6] : [4.95, 2.2, 5.3],
    cameraTarget: isSaturn ? [0, 0.38, 0] : [0, 0.24, 0],
    parts,
    quiz: [
      { q: `Which part at the base of ${cfg.name} gimbals to steer the rocket during liftoff?`, correctId: 'first-stage-engines', distractors: ['payload-fairing-nosecone', 'cryo-lox-fuel-tanks', 'payload-stack-module'] },
      { q: cfg.quizUpperEngineQ || 'Which upper-stage propulsion unit features an oversized bell nozzle optimized for the vacuum of space?', correctId: 'upper-stage-vacuum-engine', distractors: ['grid-fins-landing-legs', 'booster-airframe-hull', 'first-stage-engines'] },
      { q: cfg.quizNoseQ || 'Which nose assembly protects the spacecraft or satellites from supersonic aerodynamic pressure during ascent?', correctId: 'payload-fairing-nosecone', distractors: ['interstage-stage-sep', 'cryo-lox-fuel-tanks', 'first-stage-engines'] },
      { q: 'Which internal cutaway tanks keep -183°C liquid oxygen and fuel apart with domed bulkheads, a downcomer pipe and anti-slosh baffles?', correctId: 'cryo-lox-fuel-tanks', distractors: ['upper-stage-ship-hull', 'interstage-stage-sep', 'payload-stack-module'] },
      { q: cfg.quizPayloadQ || 'Which stack of satellites or spacecraft rides on top of the upper stage as the rocket’s actual cargo?', correctId: 'payload-stack-module', distractors: ['payload-fairing-nosecone', 'booster-airframe-hull', 'grid-fins-landing-legs'] },
    ],
  };
}

export const ROCKET_MODELS = [
  buildRocketModel({
    id: 'spacex-falcon-9', name: 'SpaceX Falcon 9 Block 5', brand: 'SpaceX', badge: 'Reusable Orbital Class • 9× Merlin 1D',
    desc: 'World’s first orbital-class reusable two-stage rocket standing vertically on the launchpad with a 9-engine Merlin 1D Octaweb, titanium hypersonic grid fins, and carbon-fiber landing legs.',
    radius: 0.25, nozzleCount: 9, nozzleR: 0.048,
    engName: '9× Merlin 1D Engines in Thrust Octaweb Structure', engDesc: 'Eight outer Merlin 1D engines in an aluminum-lithium Octaweb ring surrounding a center engine that throttles for propulsive landings.', engFact: 'The Octaweb layout protects each Merlin engine in its own thermal armor bay so one engine failure can never stop a mission!',
    boosterName: 'Al-Li 2195 First-Stage Booster Hull & Raceways', boosterDesc: 'Cryogenic Aluminum-Lithium tank walls with external avionics/propellant raceway tunnels and black thermal protection.', boosterFact: 'Single Falcon 9 Block 5 boosters have launched to space and landed back on Autonomous Spaceport Drone Ships over 20 times!',
    finLegName: '4× Cast Titanium Hypersonic Grid Fins & Carbon Landing Legs', finLegDesc: 'Waffle-shaped cast titanium aerodynamic fins at the top and telescopic pneumatic carbon-fiber legs at the base.', finLegFact: 'Each Falcon 9 grid fin is carved from a single glowing block of solid titanium so it won’t melt during Mach 8 re-entry!',
    interstageName: 'Carbon-Fiber Composite Interstage & Pneumatic Pusher',
    interstageDesc: 'Carbon-aluminum honeycomb interstage housing the MVac nozzle, helium pneumatic stage-separation pusher rods, and cold-gas nitrogen RCS thrusters.',
    interstageFact: 'Falcon 9 uses compressed helium pneumatic pushers instead of explosive bolts so every stage separation can be tested before launch!',
    vacEngName: 'Merlin 1D Vacuum (MVac) Niobium Bell Engine (981 kN)',
    vacEngDesc: 'Single gimbaled Merlin 1D Vacuum engine with a huge radiatively-cooled niobium-alloy nozzle extension generating 220,500 lbf in space.',
    vacEngFact: 'The thin niobium nozzle glows bright orange at 1,400°C in orbit, radiating heat directly into the blackness of space!',
    upperHullName: 'Second-Stage Al-Li LOX/RP-1 Tank & Flight Computers',
    upperHullDesc: 'Expendable upper stage storing liquid oxygen and RP-1 rocket-grade kerosene with triple-redundant fault-tolerant flight computers.',
    upperHullFact: 'The second stage accelerates payloads from Mach 6 up to orbital velocity of 17,500 mph (28,000 km/h) in just 6 minutes!',
    payloadName: 'Flat-Pack Starlink V2 Mini Satellite Stack & Dispenser', payloadDesc: 'Tension-rod satellite stack that releases dozens of flat-pack broadband satellites with krypton Hall-effect ion thrusters.', payloadFact: 'Instead of heavy springs, the Starlink stack spins gently and releases a single tension rod so all satellites drift apart like a deck of cards!',
    fairingName: 'Two-Piece Carbon Honeycomb Clamshell Payload Fairing',
    fairingDesc: '5.2-meter diameter carbon-fiber clamshell nose fairing lined with acoustic suppression panels, cold-gas thrusters, and parafoil recovery hardware.',
    fairingFact: 'SpaceX catches falling $6 million carbon-fiber payload fairing halves in the ocean using GPS-steered parafoils!',
    quizPayloadQ: 'Which flat-pack stack of broadband satellites rides inside the fairing and drifts apart like a deck of cards once in orbit?',
  }),
  buildRocketModel({
    id: 'spacex-starship-superheavy', name: 'SpaceX Starship & Super Heavy', brand: 'SpaceX', badge: '121m Fully Reusable • 33× + 6× Raptor',
    desc: 'Tallest and most powerful vertical launch vehicle ever flown: a 33-Raptor Super Heavy stainless-steel booster paired with a 6-Raptor heat-shielded Starship spacecraft.',
    radius: 0.34, nozzleCount: 13, nozzleR: 0.052,
    engName: '33× Raptor Full-Flow Staged-Combustion Booster Cluster', engDesc: 'Concentric rings of subcooled liquid methane/oxygen Raptor engines producing over 16.7 million pounds of liftoff thrust.', engFact: 'Super Heavy’s 33 Raptor engines produce more than double the thrust of the historic Apollo Saturn V Moon rocket!',
    boosterName: '304L Stainless-Steel Super Heavy Booster & Chine Strakes', boosterDesc: 'Cryo-formed 4mm 304L stainless-steel rings with aerodynamic COPV chine fairings and Mechazilla catch pins.', boosterFact: 'Instead of landing legs, Super Heavy is caught mid-air by giant robotic "chopstick" arms on the launch tower!',
    finLegName: '4× Electric-Drive Steel Grid Fins & Ship Aero Flaps', finLegDesc: 'Always-deployed welded steel booster grid fins plus Starship’s 2 forward and 2 aft body flaps for belly-flop skydiving control.', finLegFact: 'Starship re-enters belly-first like a skydiver, using its 4 flaps to steer before flipping vertical at the last second to land!',
    interstageName: 'Vented Stainless-Steel Hot-Staging Ring & Dome Blast Shield',
    interstageDesc: 'Slotted stainless-steel hot-staging interstage collar and domed blast shield that lets Starship’s 6 upper-stage Raptors ignite before booster separation.',
    interstageFact: 'Hot-staging—firing the upper stage engines while still attached to the booster—boosts Starship’s payload to orbit by 10%!',
    vacEngName: '6-Engine Ship Bay: 3× Raptor Vacuum (RVac) + 3× Gimbaled SL Raptors',
    vacEngDesc: 'Three massive outer Raptor Vacuum (RVac) regeneratively cooled bells for orbital insertion surrounding three gimbaled center Sea-Level Raptors for landing flips.',
    vacEngFact: 'Each Raptor uses a Full-Flow Staged Combustion cycle where 100% of both oxygen and methane pass through dual turbines before entering the chamber!',
    upperHullName: 'Starship 304L Steel Hull & 18,000 Hex Silica Heat Tiles',
    payloadName: 'Pez-Dispenser Satellite Slot Bay & Nose Landing Header Tanks', payloadDesc: 'Motorized satellite dispenser rack plus spherical LOX and Methane landing propellant header tanks tucked into the tip of the nosecone.', payloadFact: 'Small header tanks are tucked right inside the nose cone to balance Starship’s weight during its hypersonic belly-flop descent!',
    fairingName: 'Welded Stainless-Steel Ogive Nose Cone & Forward Flaps',
    fairingDesc: 'Cold-rolled 304L stainless-steel ogive nosecone clad on the windward side with black silica TPS tiles and actuated forward aero flaps.',
    fairingFact: 'Stainless steel stays strong at both cryogenic -196°C liquid nitrogen temperatures and glowing +800°C atmospheric re-entry heat!',
    quizUpperEngineQ: 'Which 6-engine bay under the Starship spacecraft pairs three giant vacuum bells with three gimbaling sea-level Raptors for landing flips?',
    quizNoseQ: 'Which welded stainless-steel nose at the very tip is clad with black heat-shield tiles and carries the forward aero flaps?',
    quizPayloadQ: 'Which bay tucked inside the nose holds the satellite "Pez dispenser" slot and the spherical landing header tanks?',
  }),
  buildRocketModel({
    id: 'nasa-saturn-v-apollo', name: 'NASA Apollo Saturn V Moon Rocket', brand: 'NASA / Boeing / North American / Douglas', badge: '110.6m • 5× F-1 + 5× J-2 + 1× J-2 • Real NASA CAD',
    desc: 'Three-stage human-rated Heavy Lift Launch Vehicle that sent 24 Apollo astronauts to the Moon, featuring real upright NASA Saturn V 3D CAD stages (S-IC, S-II, S-IVB, IU, LM & CSM).',
    radius: 0.31, nozzleCount: 5, nozzleR: 0.075,
    engName: '5× Rocketdyne F-1 Kerolox Engines (7.5 Million lbf)', engDesc: 'Five gigantic gas-generator kerosene/LOX F-1 engines burning 15 tons of propellant every single second.', engFact: 'The F-1 remains the most powerful single-chamber liquid-propellant rocket engine ever flown in history!',
    boosterName: 'S-IC First Stage (Boeing) & External LOX Feedline Fairings', boosterDesc: 'Real NASA CAD S-IC stage with iconic black-and-white roll-pattern stripes and 5 external LOX tunnels passing through the RP-1 tank.', boosterFact: 'The black-and-white checkerboard paint pattern helped ground cameras track whether the rocket was rolling during liftoff!',
    finLegName: '4× S-IC Supersonic Stabilizer Fins & Retro-Rocket Fairings', finLegDesc: 'Four Delta airfoils around the F-1 engine skirt that stabilized the 3,000-ton vehicle against high-altitude wind shear.', finLegFact: 'Eight solid retro-rockets hidden inside the S-IC engine fairings fired backward to pull the empty first stage away cleanly!',
    interstageName: 'S-II Second Stage (North American) & 5× Rocketdyne J-2 LH2 Engines',
    interstageDesc: 'Cryogenic liquid-hydrogen/liquid-oxygen second stage powered by five Rocketdyne J-2 engines with a weight-saving insulated common bulkhead.',
    interstageFact: 'The S-II stage used a single shared "common bulkhead" wall between -253°C liquid hydrogen and -183°C liquid oxygen—saving 3.6 tons of metal!',
    vacEngName: 'S-IVB Third Stage Restartable J-2 Engine (Trans-Lunar Injection)',
    vacEngDesc: 'Single gimbaled Rocketdyne J-2 LH2/LOX engine on the Douglas S-IVB third stage that fired once to reach Earth orbit and restarted to blast Apollo to the Moon.',
    vacEngFact: 'Restarting a cryogenic liquid-hydrogen engine in zero gravity required firing small "ullage" thrusters first to settle the floating liquid fuel at the bottom of the tank!',
    upperHullName: 'S-IVB Stage Hull, APS Thrusters & IBM Instrument Unit Ring',
    upperHullDesc: 'Douglas S-IVB third-stage tank topped by the 3-foot-tall IBM Instrument Unit ring containing the ST-124M inertial platform and LVDC flight computer.',
    upperHullFact: 'The Saturn V Instrument Unit computer had less memory than a modern musical greeting card yet guided astronauts to the Moon!',
    payloadName: 'Apollo Lunar Module ("Eagle") Folded Inside the SLA Adapter', payloadDesc: 'Two-stage gold-Kapton Apollo Lunar Module (octagonal Descent Stage with 4 folded landing legs and footpads + Ascent Stage cabin with RCS quads) seated on the S-IVB forward skirt inside the SLA cone.', payloadFact: 'The Lunar Module was the first true spacecraft in history designed to fly exclusively in the vacuum of space—it had zero aerodynamics!',
    fairingName: 'Apollo Spacecraft Stack: SLA Petals, Service & Command Modules & LES Tower',
    fairingDesc: 'Real NASA CAD nose section: the 4-petal Spacecraft-LM Adapter cone, cylindrical Service Module with SPS nozzle, conical 3-astronaut Command Module, and the 10-meter solid-fuel Launch Escape System tower at the tip.',
    fairingFact: 'If an emergency happened on the launchpad, the red Launch Escape Tower at the very tip could yank the astronaut capsule 1.5 miles high in seconds!',
    quizUpperEngineQ: 'Which restartable third-stage engine fired a second time in Earth orbit to blast Apollo toward the Moon (Trans-Lunar Injection)?',
    quizNoseQ: 'Which assembly at the very tip carried the 3 Apollo astronauts and had a solid-rocket escape tower to pull them to safety in an emergency?',
    quizPayloadQ: 'Which gold-foil two-stage spacecraft folded inside the adapter petals actually landed astronauts on the Moon?',
  }),
];

function buildPerseveranceRover() {
  const whiteDeck = mat(0xf8fafc, { roughness: 0.3, metalness: 0.16 });
  const darkTi = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const goldFoil = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.22 });
  const blackCarbon = carbonFiberMat([4, 4]);
  const parts = [
    { id: 'rover-warm-electronics-chassis', name: 'Warm Electronics Box (WEB) Insulated Rover Body (NASA CAD)', category: 'Core Chassis', isOuter: true, explodeOffset: [0, 0.95, 0],
      desc: 'Real NASA CAD gold-and-white composite chassis housing dual RAD750 flight computers and thermal loop tubing.',
      funFact: 'Gold-plated walls inside the rover’s belly trap heat so its computers stay cozy even when Mars drops to -90°C at night!',
      build(g) { populatePerseveranceCad(g, { zone: 'chassis' }); rbox(g, 1.35, 0.44, 0.96, 0.04, whiteDeck, [0, 0.02, 0]); } },
    { id: 'rocker-bogie-titanium-wheels', name: '6-Wheel Rocker-Bogie Suspension & Cleated Aluminum Wheels', category: 'Mobility', isOuter: true, explodeOffset: [0, -1.35, 0],
      desc: 'Real NASA CAD differential titanium suspension linkage and 6 independent motorized 52.5-cm wheels with wavy traction cleats.',
      funFact: 'The Rocker-Bogie suspension has no springs at all—it lets Perseverance climb over boulders twice as tall as its wheels without tipping!',
      build(g) {
        populatePerseveranceCad(g, { zone: 'wheels-suspension' });
        for (const x of [-0.75, 0, 0.75]) for (const z of [-0.68, 0.68]) {
          const spin = new THREE.Group(); spin.position.set(x, -0.38, z); spin.userData.driveRole = 'wheel'; g.add(spin);
          cyl(spin, 0.2, 0.2, 0.18, 22, darkTi, [0, 0, 0], [Math.PI / 2, 0, 0]);
          torus(spin, 0.14, 0.018, goldFoil, [0, 0, Math.sign(z) * 0.08], [0, 0, 0]);
        }
      } },
    { id: 'remote-sensing-supercam-mast', name: 'Remote Sensing Mast (SuperCam Laser, Mastcam-Z & Navcams)', category: 'Vision & Spectroscopy', isOuter: true, explodeOffset: [0.85, 1.55, 0.45],
      desc: 'Real NASA CAD pop-up camera mast carrying zoom stereo cameras, MEDA weather sensors, and a rock-vaporizing pulsed laser.',
      funFact: 'SuperCam shoots a mega-watt laser beam up to 7 meters away to vaporize tiny spots of Martian rock and read their chemistry from the flash!',
      build(g) { populatePerseveranceCad(g, { zone: 'mast' }); cyl(g, 0.045, 0.05, 0.72, 16, whiteDeck, [0.52, 0.56, 0.28]); rbox(g, 0.24, 0.18, 0.28, 0.03, whiteDeck, [0.56, 0.96, 0.28]); cyl(g, 0.055, 0.055, 0.08, 18, glassMat(0x38bdf8, 0.5), [0.66, 0.98, 0.28], [0, 0, Math.PI / 2]); } },
    { id: 'robotic-arm-corer-turret', name: '2.1-Meter 5-DOF Robotic Arm & Rotary Percussive Drill Turret', category: 'Geology & Sampling', isOuter: true, explodeOffset: [1.75, 0.25, 0],
      desc: 'Real NASA CAD articulated 5-joint robotic arm carrying a 45-kg science turret with coring drill, PIXL X-ray, and SHERLOC UV spectrometer.',
      funFact: 'The turret at the end of Perseverance’s arm weighs as much as a full-grown human and carries its own microscopic camera named WATSON!',
      build(g) { populatePerseveranceCad(g, { zone: 'turret-arm' }); box(g, 0.65, 0.07, 0.07, whiteDeck, [0.95, 0.08, -0.18], [0, 0.2, 0.2]); cyl(g, 0.16, 0.16, 0.22, 18, darkTi, [1.28, 0.04, 0], [0, 0, Math.PI / 2]); } },
    { id: 'mmrtg-plutonium-battery', name: 'MMRTG Plutonium-238 Radioisotope Thermoelectric Generator', category: 'Nuclear Power', isOuter: true, explodeOffset: [-1.65, 0.35, 0],
      desc: 'Real NASA CAD finned white nuclear heat source converting the natural decay heat of 4.8 kg of Plutonium-238 dioxide into 110W of continuous power.',
      funFact: 'Unlike solar panels that get covered in Martian dust storms, Perseverance’s plutonium battery works day and night for 14+ years!',
      build(g) { populatePerseveranceCad(g, { zone: 'rtg' }); cyl(g, 0.18, 0.2, 0.58, 18, whiteDeck, [-0.88, 0.18, 0], [0, 0, 0.55]); } },
    { id: 'sample-caching-carousel', name: 'Adaptive Caching Assembly & 43 Titanium Sample Tubes', category: 'Sample Return', isOuter: false, explodeOffset: [0.55, -0.95, 1.25],
      desc: 'Rotating bit carousel, internal belly robotic arm, and 43 ultra-sterile gold-coated titanium rock sample tubes.',
      funFact: 'Inside Perseverance’s belly is a second smaller robot arm whose only job is to seal rock cores inside titanium tubes!',
      build(g) { populatePerseveranceCad(g, { zone: 'caching' }); cyl(g, 0.18, 0.18, 0.1, 24, goldFoil, [0.32, 0.06, 0]); for (let i = 0; i < 8; i++) cyl(g, 0.014, 0.014, 0.09, 10, alu, [0.32 + Math.cos(i * 0.78) * 0.12, 0.06, Math.sin(i * 0.78) * 0.12]); } },
    { id: 'moxie-oxygen-generator', name: 'MOXIE Martian CO₂-to-Oxygen Solid-Oxide Electrolyzer', category: 'ISRU Life Support', isOuter: false, explodeOffset: [-0.25, 0.85, -1.35],
      desc: 'Gold-plated 800°C solid-oxide electrolysis reactor that splits Martian carbon dioxide air into breathable oxygen.',
      funFact: 'MOXIE made history by manufacturing breathable oxygen on another planet for the very first time—enough for a small dog to breathe!',
      build(g) { rbox(g, 0.22, 0.18, 0.18, 0.02, goldFoil, [-0.12, 0.08, -0.18]); } },
    { id: 'uhf-xband-high-gain-antennas', name: 'Hexagonal X-Band High-Gain & UHF Orbiter Relay Antennas', category: 'Deep-Space Comms', isOuter: true, explodeOffset: [-0.75, 1.45, -0.85],
      desc: 'Steerable hexagonal phased-array X-Band antenna for direct-to-Earth links plus a black cylindrical UHF monopole.',
      funFact: 'Radio signals traveling at the speed of light still take between 4 and 22 minutes to travel between Mars and Earth!',
      build(g) { populatePerseveranceCad(g, { zone: 'antennas' }); cyl(g, 0.16, 0.16, 0.03, 6, goldFoil, [-0.42, 0.36, -0.28], [0.3, 0, 0]); cyl(g, 0.035, 0.035, 0.34, 14, darkTi, [-0.52, 0.42, 0.32]); } },
    { id: 'ingenuity-mars-helicopter', name: 'Deployed NASA Ingenuity Coaxial Mars Helicopter (NASA CAD)', category: 'Aerial Scout', isOuter: false, explodeOffset: [0, -1.55, -1.45],
      desc: 'Real NASA CAD 1.8-kg coaxial carbon-fiber rotorcraft stowed under the rover belly and deployed onto Jezero Crater.',
      funFact: 'Designed for just 5 test flights in Mars’s paper-thin 1% atmosphere, Ingenuity flew an incredible 72 times!',
      build(g) { populateIngenuityCad(g, { zone: 'all', pos: [0, -0.58, 0], scale: 0.45 }); cyl(g, 0.38, 0.38, 0.015, 16, blackCarbon, [0, -0.45, 0]); } },
  ];
  return {
    id: 'mars-perseverance-rover', name: 'NASA Perseverance Mars Rover', brand: 'NASA / JPL-Caltech', badge: 'Jezero Crater • 1,025 kg • Real NASA CAD',
    desc: 'Car-sized nuclear-powered robotic astrobiologist built from official NASA JPL 3D CAD with 6 Rocker-Bogie wheels, SuperCam laser mast, coring arm, MOXIE, and Ingenuity.',
    cameraPos: [3.6, 2.2, 3.8], parts,
    quiz: [
      { q: 'Which instrument on Perseverance’s mast shoots a pulsed laser to vaporize rock and read its chemistry?', correctId: 'remote-sensing-supercam-mast', distractors: ['mmrtg-plutonium-battery', 'rocker-bogie-titanium-wheels', 'moxie-oxygen-generator'] },
      { q: 'Which golden internal reactor splits Martian CO₂ atmosphere into breathable oxygen?', correctId: 'moxie-oxygen-generator', distractors: ['sample-caching-carousel', 'uhf-xband-high-gain-antennas', 'ingenuity-mars-helicopter'] },
      { q: 'Which finned tail unit uses Plutonium-238 heat to power the rover day and night for 14 years?', correctId: 'mmrtg-plutonium-battery', distractors: ['rover-warm-electronics-chassis', 'robotic-arm-corer-turret', 'rocker-bogie-titanium-wheels'] },
      { q: 'Which 6-wheel linkage keeps all wheels pressed evenly onto jagged Martian boulders without metal springs?', correctId: 'rocker-bogie-titanium-wheels', distractors: ['uhf-xband-high-gain-antennas', 'sample-caching-carousel', 'rover-warm-electronics-chassis'] },
      { q: 'Which 1.8-kg coaxial carbon-fiber scout stowed under the rover belly flew 72 times in Mars’s 1% thin air?', correctId: 'ingenuity-mars-helicopter', distractors: ['robotic-arm-corer-turret', 'mmrtg-plutonium-battery', 'remote-sensing-supercam-mast'] },
    ],
  };
}

function buildRobotOrHeavyModel(cfg) {
  const primary = carPaint(cfg.primaryHex);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const chrome = chromeMat();
  const alu = brushedMetal(0xd8dee9, { metalness: 0.86, roughness: 0.22 });
  const glass = glassMat(0x38bdf8, 0.42);
  const carbon = carbonFiberMat([4, 4]);
  const parts = cfg.partsSpec.map(([id, name, category, isOuter, explodeOffset, desc, funFact, fn]) => ({
    id, name, category, isOuter, explodeOffset, desc, funFact,
    build(g) { fn(g, { primary, darkSteel, chrome, alu, glass, carbon }); },
  }));
  return { id: cfg.id, name: cfg.name, brand: cfg.brand, badge: cfg.badge, desc: cfg.desc, cameraPos: [3.9, 2.3, 4.0], parts, quiz: cfg.quiz };
}

export const ROBOT_MODELS = [
  buildIronManMark85Model(),
  buildPerseveranceRover(),
  buildRobotOrHeavyModel({
    id: 'kuka-6axis-industrial-arm', name: '6-Axis Industrial Articulated Robot Arm', brand: 'KUKA / FANUC Class', badge: '6-DOF • ±0.03mm Repeatability • CAD Gearbox',
    desc: 'Heavy-duty 6-axis factory automation robot featuring zero-backlash harmonic/cycloidal CAD gear reducers, hollow-wrist dress pack, and laser-guided gripper.',
    primaryHex: 0xf97316,
    partsSpec: [
      ['pedestal-slew-base-j1', 'Anchored Cast-Iron Floor Pedestal & J1 Carousel Turntable', 'Axis 1 Base', true, [0, -1.45, 0], 'Floor-bolted cast-iron base housing the Axis-1 crossed-roller bearing and cycloidal ring gear.', 'Industrial robot bases are torqued into reinforced factory concrete so the arm can swing 200 kg loads without vibrating!', (g, m) => {
        cyl(g, 0.56, 0.62, 0.12, 32, m.darkSteel, [0, -0.74, 0]);
        cyl(g, 0.42, 0.48, 0.24, 32, m.darkSteel, [0, -0.58, 0]);
        cyl(g, 0.38, 0.42, 0.34, 32, m.primary, [0, -0.34, 0]);
        torus(g, 0.41, 0.022, m.chrome, [0, -0.48, 0], [Math.PI / 2, 0, 0]);
        const bolts = [];
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          bolts.push([Math.cos(a) * 0.54, -0.68, Math.sin(a) * 0.54]);
        }
        buildHexBoltArray(g, bolts, { radius: 0.018 });
      }],
      ['cycloidal-harmonic-gearboxes', 'Zero-Backlash Cycloidal & Strain-Wave Harmonic Reducers (CAD)', 'Precision Transmission', false, [-1.35, -0.35, 1.25], 'Real mechanical CAD multi-stage gear trains and strain-wave flexsplines delivering 160:1 torque multiplication.', 'Strain-wave harmonic gears flex an elliptical steel cup so there is literally zero gear slop ("backlash")!', (g, m) => {
        populateGearboxCad(g, { pos: [0, -0.25, 0], scale: 0.0085 });
        populateGearboxCad(g, { pos: [-0.08, 0.46, 0], scale: 0.0075 });
        cyl(g, 0.18, 0.18, 0.24, 28, m.chrome, [0, -0.18, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.15, 0.15, 0.22, 28, m.alu, [-0.08, 0.46, 0], [Math.PI / 2, 0, 0]);
      }],
      ['ac-brushless-servo-motors', '6× High-Torque Brushless AC Servo Motors & Optical Encoders', 'Actuation', false, [-1.35, 0.45, -1.15], 'Permanent-magnet synchronous servo motors with 24-bit absolute optical glass encoders on every joint.', 'Optical encoders read 16 million positions per revolution so the robot hand returns to the exact same hair-width spot every time!', (g, m) => {
        for (const [x, y, z] of [[-0.24, -0.18, 0.28], [-0.12, 0.46, -0.26], [0.28, 0.54, -0.22]]) {
          cyl(g, 0.11, 0.11, 0.28, 24, m.darkSteel, [x, y, z], [Math.PI / 2, 0, 0]);
          cyl(g, 0.09, 0.09, 0.08, 20, m.alu, [x, y, z + (z >= 0 ? 0.16 : -0.16)], [Math.PI / 2, 0, 0]);
        }
      }],
      ['lower-link-boom-j2', 'J2 Shoulder Casting & Hydropneumatic Counterbalance Cylinder', 'Axis 2 Lower Arm', true, [-0.85, 0.85, 0], 'Sculpted twin-yoke ductile cast-iron lower arm boom plus a pressurized nitrogen counterbalance cylinder supporting gravity loads.', 'The pressurized nitrogen cylinder works like a giant mechanical bicep tendon to balance the heavy weight of the arm!', (g, m) => {
        for (const z of [-0.14, 0.14]) {
          extrudeProfile(g, [[-0.14, -0.28], [0.14, -0.28], [0.06, 0.52], [-0.22, 0.52]], 0.08, m.primary, [0, 0, z], [0, 0, 0], 0.02);
        }
        cyl(g, 0.19, 0.19, 0.36, 28, m.primary, [0, -0.18, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.085, 0.085, 0.56, 20, m.darkSteel, [-0.32, -0.06, 0], [0, 0, -0.42]);
        cyl(g, 0.045, 0.045, 0.42, 16, m.chrome, [-0.22, 0.18, 0], [0, 0, -0.42]);
      }],
      ['upper-cantilever-arm-j3', 'J3 Elbow Housing & Tapered Cast-Aluminum Cantilever Forearm', 'Axis 3 Upper Arm', true, [0.45, 1.35, 0], 'Lightened tapered aluminum-alloy upper arm casting routing internal power and air lines to the wrist.', 'Whereas the lower base is heavy cast iron for stiffness, the upper forearm is cast aluminum to cut moving inertia!', (g, m) => {
        cyl(g, 0.17, 0.17, 0.34, 28, m.primary, [-0.08, 0.46, 0], [Math.PI / 2, 0, 0]);
        rbox(g, 0.34, 0.28, 0.28, 0.05, m.primary, [-0.02, 0.52, 0]);
        cyl(g, 0.095, 0.135, 0.82, 28, m.primary, [0.48, 0.46, 0], [0, 0, Math.PI / 2]);
      }],
      ['hollow-wrist-triad-j456', '3-Roll Hollow-Shaft In-Line Robotic Wrist (Axes J4 / J5 / J6)', '3-DOF Wrist', true, [1.55, 0.75, 0], 'Compact 3-axis spherical wrist allowing continuous 360-degree tool rotation.', 'Three intersecting rotation axes in the wrist let the robot twist a welding torch around tight corners just like a human wrist!', (g, m) => {
        cyl(g, 0.095, 0.105, 0.24, 24, m.alu, [0.92, 0.46, 0], [0, 0, Math.PI / 2]);
        sphere(g, 0.105, 20, m.darkSteel, [1.06, 0.46, 0]);
        cyl(g, 0.08, 0.09, 0.14, 24, m.darkSteel, [1.15, 0.42, 0], [0, 0, Math.PI / 2 - 0.35]);
      }],
      ['end-effector-gripper-laser', 'Pneumatic Parallel Gripper, Load Cell & Laser Seam Scanner', 'End-of-Arm Tooling', true, [2.05, 0.35, 0], 'ISO 9409 tool flange carrying a dual-jaw parallel gripper, 6-axis force/torque load cell, and structured-light laser scanner.', 'A 6-axis force sensor in the wrist lets the robot "feel" when a part clicks into place with sub-newton sensitivity!', (g, m) => {
        cyl(g, 0.085, 0.085, 0.05, 24, m.chrome, [1.22, 0.38, 0], [0, 0, Math.PI / 2 - 0.35]);
        rbox(g, 0.12, 0.16, 0.26, 0.02, m.darkSteel, [1.28, 0.35, 0], [0, 0, -0.35]);
        for (const z of [-0.08, 0.08]) {
          rbox(g, 0.18, 0.045, 0.032, 0.008, m.chrome, [1.39, 0.31, z], [0, 0, -0.35]);
        }
        rbox(g, 0.09, 0.07, 0.12, 0.015, emissiveMat(0xef4444, 1.5), [1.28, 0.46, 0], [0, 0, -0.35]);
      }],
      ['corrugated-umbilical-dresspack', 'Corrugated Flex Dress-Pack Loom & KRC5 PLC Safety Controller Cabinet', 'Control & Cabling', false, [0, -0.95, -1.45], 'Torsion-resistant corrugated umbilical conduit and dual-channel safety PLC servo drive cabinet with teach pendant.', 'Every wire inside a robot’s umbilical hose is braided around Kevlar cores to survive 10 million twists without snapping!', (g, m) => {
        tube(g, [[0, -0.45, 0.2], [-0.16, 0.12, 0.22], [-0.06, 0.62, 0.16], [0.48, 0.6, 0.12], [0.92, 0.54, 0.06]], 0.036, mat(0x0f172a, { roughness: 0.45 }), false, 32);
        rbox(g, 0.46, 0.68, 0.4, 0.025, m.primary, [-0.92, -0.46, -0.48]);
        rbox(g, 0.42, 0.58, 0.02, 0.01, m.darkSteel, [-0.92, -0.46, -0.27]);
        rbox(g, 0.16, 0.12, 0.03, 0.01, screenMat('dashboard'), [-0.82, -0.32, -0.25]);
      }],
    ],
    quiz: [
      { q: 'Which precision gear reducers inside a 6-axis robot arm eliminate gear slop ("backlash")?', correctId: 'cycloidal-harmonic-gearboxes', distractors: ['pedestal-slew-base-j1', 'corrugated-umbilical-dresspack', 'lower-link-boom-j2'] },
      { q: 'Which 3-joint spherical assembly at the tip of the forearm rotates the tool through 360 degrees?', correctId: 'hollow-wrist-triad-j456', distractors: ['ac-brushless-servo-motors', 'upper-cantilever-arm-j3', 'pedestal-slew-base-j1'] },
      { q: 'Which end-of-arm attachment grips parts and scans weld seams with a structured laser?', correctId: 'end-effector-gripper-laser', distractors: ['lower-link-boom-j2', 'corrugated-umbilical-dresspack', 'cycloidal-harmonic-gearboxes'] },
      { q: 'Which heavy bolted Axis-1 rotary turntable spins the entire robot arm left and right?', correctId: 'pedestal-slew-base-j1', distractors: ['hollow-wrist-triad-j456', 'end-effector-gripper-laser', 'upper-cantilever-arm-j3'] },
      { q: 'Which flexible armored conduit routes power, air, and data cables along the arm without tangling?', correctId: 'corrugated-umbilical-dresspack', distractors: ['pedestal-slew-base-j1', 'ac-brushless-servo-motors', 'lower-link-boom-j2'] },
    ],
  }),
  buildRobotOrHeavyModel({
    id: 'boston-quadruped-robot', name: 'Agile Quadruped Robot Dog', brand: 'Boston Dynamics Spot Class', badge: '12-DOF • 360° Stereo Vision • LiDAR',
    desc: 'Bio-inspired 4-legged autonomous inspection robot with 12 brushless planetary joint actuators, 5 stereo depth camera pairs, hot-swappable battery, and 3D LiDAR.',
    primaryHex: 0xeab308,
    partsSpec: [
      ['exoskeleton-torso-shell', 'Impact-Resistant Molded Torso Shell & Crash Roll-Bars', 'Torso Structure', true, [0, 1.25, 0], 'High-visibility yellow polymer clamshell armor protecting the aluminum spine and roll cages.', 'When a quadruped slips on ice, its curved torso roll-bars let it roll over and push itself right back onto its feet!', (g, m) => {
        const bumperBlack = mat(0x111827, { roughness: 0.72, metalness: 0.18 });
        const hazardMat = emissiveMat(0xf59e0b, 0.9);
        // Internal CNC-machined structural aluminum spine chassis
        rbox(g, 1.26, 0.16, 0.34, 0.03, m.alu, [0, 0.17, 0]);
        // Sculpted chamfered Spot-yellow upper dorsal armor shell (extruded side profile)
        const dorsalPts = [
          [-0.64, 0.21], [-0.52, 0.29], [-0.18, 0.305], [0.24, 0.305],
          [0.54, 0.285], [0.68, 0.21], [0.58, 0.16], [-0.58, 0.16],
        ];
        extrudeProfile(g, dorsalPts, 0.39, m.primary, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.018, bevelSize: 0.016 });
        // Sculpted lateral yellow clamshell flank plates with ventilation louvers and actuator cutouts
        const flankPts = [
          [-0.60, 0.11], [-0.36, 0.09], [-0.24, 0.14], [0.24, 0.14],
          [0.36, 0.09], [0.62, 0.11], [0.66, 0.21], [0.46, 0.26],
          [-0.46, 0.26], [-0.64, 0.21],
        ];
        for (const side of [-1, 1]) {
          extrudeProfile(g, flankPts, 0.032, m.primary, [0, 0, side * 0.205], [0, 0, 0], { bevel: true, bevelThickness: 0.008, bevelSize: 0.008 });
          // Black rubberized side rub-rails and vertical crash ribs
          rbox(g, 0.92, 0.042, 0.024, 0.01, bumperBlack, [0, 0.19, side * 0.228]);
          for (let rx = -0.34; rx <= 0.34; rx += 0.085) {
            box(g, 0.022, 0.09, 0.018, bumperBlack, [rx, 0.19, side * 0.226]);
          }
          // Front and rear tubular steel roll-over crash hoops & lift handles
          tube(g, [[0.58, 0.13, side * 0.17], [0.73, 0.17, side * 0.12], [0.73, 0.23, side * 0.12], [0.56, 0.27, side * 0.17]], 0.016, bumperBlack);
          tube(g, [[-0.56, 0.13, side * 0.17], [-0.71, 0.17, side * 0.12], [-0.71, 0.23, side * 0.12], [-0.54, 0.27, side * 0.17]], 0.016, bumperBlack);
          // Self-righting dorsal roll-cage skids
          tube(g, [[-0.42, 0.29, side * 0.17], [0, 0.315, side * 0.18], [0.44, 0.29, side * 0.17]], 0.013, bumperBlack);
        }
        // Front/rear bumper crossbars & glowing status LED lightbars
        rbox(g, 0.06, 0.05, 0.28, 0.015, bumperBlack, [0.72, 0.23, 0]);
        rbox(g, 0.06, 0.05, 0.28, 0.015, bumperBlack, [-0.70, 0.23, 0]);
        box(g, 0.018, 0.016, 0.22, emissiveMat(0x22c55e, 1.4), [0.69, 0.255, 0]);
        box(g, 0.018, 0.016, 0.20, hazardMat, [-0.67, 0.255, 0]);
        // Rear emergency E-stop mushroom button
        cyl(g, 0.026, 0.026, 0.018, 16, mat(0xdc2626, { roughness: 0.35 }), [-0.50, 0.31, 0]);
      }],
      ['planetary-actuator-hips', '8× Coaxial Brushless Hip Abduction/Flexion Planetary Actuators', 'Hip Actuation', true, [0, 0.35, 1.55], 'Low-ratio backdrivable planetary gear motors at all 4 shoulders/hips for compliant dynamic trotting.', 'Unlike stiff factory robots, quadruped hip actuators act like virtual springs that absorb landing impacts electronically!', (g, m) => {
        const bumperBlack = mat(0x111827, { roughness: 0.68, metalness: 0.25 });
        for (const x of [-0.50, 0.50]) for (const z of [-0.22, 0.22]) {
          const s = Math.sign(z);
          // Abduction (roll) actuator housing integrated along the longitudinal axis
          cyl(g, 0.105, 0.105, 0.18, 28, m.primary, [x - Math.sign(x) * 0.04, 0.16, z * 0.88], [0, 0, Math.PI / 2]);
          cyl(g, 0.092, 0.092, 0.19, 24, m.darkSteel, [x - Math.sign(x) * 0.04, 0.16, z * 0.88], [0, 0, Math.PI / 2]);
          // Outer cylindrical harmonic-drive hip flexion drum with black protective bumper ring
          cyl(g, 0.128, 0.128, 0.115, 32, m.primary, [x, 0.16, z + s * 0.045], [Math.PI / 2, 0, 0]);
          torus(g, 0.126, 0.016, bumperBlack, [x, 0.16, z + s * 0.095], [0, 0, 0]);
          cyl(g, 0.098, 0.098, 0.135, 28, m.darkSteel, [x, 0.16, z + s * 0.055], [Math.PI / 2, 0, 0]);
          cyl(g, 0.058, 0.058, 0.148, 22, m.alu, [x, 0.16, z + s * 0.06], [Math.PI / 2, 0, 0]);
          // Machined cooling fins & perimeter titanium hex bolts on the actuator face
          for (let r = 0; r < 12; r++) {
            const a = (r / 12) * Math.PI * 2;
            const bx = x + Math.cos(a) * 0.082;
            const by = 0.16 + Math.sin(a) * 0.082;
            cyl(g, 0.006, 0.006, 0.014, 6, m.chrome, [bx, by, z + s * 0.122], [Math.PI / 2, 0, 0]);
          }
        }
      }],
      ['articulated-legs-paws', '4× Carbon-Fiber Femur/Tibia Legs & High-Grip Spherical Rubber Paws', 'Quadruped Limbs', true, [0, -1.35, 0], 'Four 3-DOF articulated legs with belt-driven knee joints and replaceable spherical rubber foot pads.', 'Routing the knee motor up near the hip and driving the lower leg with a toothed belt keeps the ankles super light and fast!', (g, m) => {
        const rubberMat = mat(0x0f172a, { roughness: 0.86, metalness: 0.08 });
        // Sculpted curved upper leg (femur) profile with Spot-style structural cutout pocket
        const femurPts = [
          [-0.055, 0.04], [0.055, 0.04], [0.048, -0.14],
          [0.012, -0.34], [-0.042, -0.38], [-0.062, -0.18],
        ];
        // Sculpted curved reverse-knee lower leg (tibia) profile tapering cleanly to the ankle
        const tibiaPts = [
          [-0.036, 0.02], [0.038, 0.02], [0.032, -0.18],
          [0.018, -0.38], [-0.018, -0.38], [-0.042, -0.16],
        ];
        for (const x of [-0.50, 0.50]) for (const z of [-0.305, 0.305]) {
          const legGroup = new THREE.Group();
          legGroup.position.set(x, 0.16, z);
          g.add(legGroup);
          // Upper femur swung backward at agile trotting angle
          const femur = new THREE.Group();
          femur.rotation.z = -0.46;
          legGroup.add(femur);
          extrudeProfile(femur, femurPts, 0.048, m.primary, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.007, bevelSize: 0.006 });
          // Recessed carbon-fiber inlay & internal belt tensioner pocket inside the femur
          rbox(femur, 0.042, 0.22, 0.054, 0.01, m.carbon, [-0.006, -0.16, 0]);
          // Internal hydraulic/spring damper strut alongside the femur
          cyl(femur, 0.012, 0.012, 0.24, 12, m.chrome, [0.038, -0.17, 0], [0, 0, -0.08]);
          for (let sc = -0.22; sc <= -0.10; sc += 0.022) {
            torus(femur, 0.017, 0.004, m.darkSteel, [0.038, sc, 0], [Math.PI / 2, 0, 0]);
          }
          // Knee joint pivot housing (at bottom of femur: local [0, -0.36, 0] -> world offset [-0.16, -0.32, 0])
          const kx = -0.16, ky = -0.32;
          cyl(legGroup, 0.056, 0.056, 0.068, 24, m.darkSteel, [kx, ky, 0], [Math.PI / 2, 0, 0]);
          cyl(legGroup, 0.036, 0.036, 0.076, 18, m.alu, [kx, ky, 0], [Math.PI / 2, 0, 0]);
          torus(legGroup, 0.054, 0.01, rubberMat, [kx, ky, 0], [0, 0, 0]);
          // Lower tibia angled forward from knee back under hip center of gravity
          const tibia = new THREE.Group();
          tibia.position.set(kx, ky, 0);
          tibia.rotation.z = 0.40;
          legGroup.add(tibia);
          extrudeProfile(tibia, tibiaPts, 0.038, m.darkSteel, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.005, bevelSize: 0.005 });
          // Protective yellow shin guard & flexible umbilical sensor cable along tibia
          rbox(tibia, 0.016, 0.24, 0.042, 0.005, m.primary, [0.026, -0.17, 0]);
          tube(legGroup, [[0, -0.05, 0], [kx - 0.03, ky + 0.04, 0], [kx + 0.05, ky - 0.16, 0]], 0.007, rubberMat);
          // Spherical vulcanized rubber paw foot with tread grooves & ankle strain gauge collar
          const fx = -0.01, fy = -0.68;
          cyl(legGroup, 0.026, 0.032, 0.045, 16, m.alu, [fx, fy + 0.038, 0]);
          sphere(legGroup, 0.054, 22, rubberMat, [fx, fy, 0]);
          for (const tz of [-0.02, 0, 0.02]) {
            torus(legGroup, 0.051, 0.005, mat(0x1e293b, { roughness: 0.9 }), [fx, fy, tz], [0, Math.PI / 2, 0]);
          }
        }
      }],
      ['hot-swap-lithium-battery', '605 Wh Hot-Swappable Belly Lithium-Ion Battery Pack', 'Power System', false, [0, -1.15, -1.15], 'Bottom-latching IP65 sealed lithium-ion battery pack with active BMS and wireless charging pads.', 'The robot automatically walks back to its floor dock and squats onto charging pads when its battery drops below 15%!', (g, m) => {
        rbox(g, 0.78, 0.11, 0.34, 0.024, m.darkSteel, [0, 0.065, 0]);
        rbox(g, 0.72, 0.025, 0.30, 0.01, m.primary, [0, 0.012, 0]);
        // Machined belly heatsink fins & quarter-turn cam latch handles
        for (let fx = -0.30; fx <= 0.30; fx += 0.05) {
          box(g, 0.018, 0.016, 0.28, m.alu, [fx, 0.002, 0]);
        }
        for (const lx of [-0.28, 0.28]) {
          cyl(g, 0.024, 0.024, 0.018, 16, m.chrome, [lx, 0.002, 0]);
        }
        // Copper dock charging contact pads at front belly
        for (const cz of [-0.06, 0.06]) {
          box(g, 0.045, 0.008, 0.028, mat(0xd97706, { metalness: 0.88, roughness: 0.2 }), [0.34, 0.002, cz]);
        }
      }],
      ['stereo-depth-camera-array', '5× 360° Stereo Depth & Time-of-Flight Obstacle Camera Modules', 'Perception', false, [1.55, 0.25, 0], 'Front, left, right, and rear infrared stereo depth cameras building a real-time 3D terrain heightmap.', 'Five stereo camera pairs compute 3D depth maps 30 times per second so the robot never steps into a hole on stairs!', (g, m) => {
        const lensGlass = mat(0x0284c7, { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 });
        const irProjector = emissiveMat(0xef4444, 0.8);
        // Front nose dual-angled stereo depth & ToF optical bay
        rbox(g, 0.15, 0.125, 0.33, 0.025, m.darkSteel, [0.64, 0.18, 0], [0, 0, -0.18]);
        for (const z of [-0.105, -0.042, 0.042, 0.105]) {
          cyl(g, 0.022, 0.022, 0.028, 18, m.chrome, [0.71, 0.175, z], [0, 0, Math.PI / 2]);
          sphere(g, 0.018, 16, lensGlass, [0.722, 0.175, z]);
        }
        cyl(g, 0.012, 0.012, 0.025, 14, irProjector, [0.712, 0.195, 0], [0, 0, Math.PI / 2]);
        // Rear tail stereo depth camera module
        rbox(g, 0.11, 0.10, 0.26, 0.02, m.darkSteel, [-0.62, 0.18, 0]);
        for (const z of [-0.075, 0.075]) {
          cyl(g, 0.020, 0.020, 0.024, 16, m.chrome, [-0.675, 0.18, z], [0, 0, Math.PI / 2]);
          sphere(g, 0.016, 14, lensGlass, [-0.686, 0.18, z]);
        }
        // Left & right side-looking stereo camera pods recessed into torso flanks
        for (const side of [-1, 1]) {
          rbox(g, 0.28, 0.075, 0.035, 0.012, m.darkSteel, [0, 0.185, side * 0.212]);
          for (const cx of [-0.08, 0.08]) {
            cyl(g, 0.018, 0.018, 0.022, 16, m.chrome, [cx, 0.185, side * 0.228], [Math.PI / 2, 0, 0]);
            sphere(g, 0.014, 14, lensGlass, [cx, 0.185, side * 0.236]);
          }
        }
      }],
      ['spinning-3d-lidar-payload', 'Dorsal 16-Channel 3D Spinning LiDAR & Edge AI GPU Computer', 'Autonomous SLAM', true, [-0.35, 1.55, 0], 'Top payload rail carrying a 360° laser LiDAR puck, thermal camera, and Jetson Orin AI module.', 'The spinning LiDAR shoots 300,000 laser pulses per second to build a millimeter-accurate digital twin of factories and caves!', (g, m) => {
        // Anodized extruded aluminum T-slot dorsal payload mounting rails
        for (const rz of [-0.13, 0.13]) {
          box(g, 0.92, 0.022, 0.032, m.alu, [-0.02, 0.312, rz]);
        }
        // Ruggedized Spot CORE AI GPU payload enclosure with machined cooling fins
        rbox(g, 0.44, 0.085, 0.28, 0.018, m.darkSteel, [-0.18, 0.355, 0]);
        for (let fx = -0.34; fx <= -0.02; fx += 0.035) {
          box(g, 0.014, 0.018, 0.26, m.alu, [fx, 0.402, 0]);
        }
        // Elevated shock-isolated Velodyne/Ouster 3D LiDAR pedestal tower & protective cage
        cyl(g, 0.068, 0.082, 0.065, 22, m.darkSteel, [-0.26, 0.425, 0]);
        const puck = new THREE.Group(); puck.position.set(-0.26, 0.485, 0); puck.userData.driveAnim = 'fan'; puck.userData.spinAxis = 'y'; g.add(puck);
        cyl(puck, 0.082, 0.082, 0.085, 28, m.chrome, [0, 0, 0]);
        cyl(puck, 0.085, 0.085, 0.042, 28, mat(0x0f172a, { roughness: 0.12, metalness: 0.8 }), [0, 0, 0]);
        cyl(puck, 0.083, 0.083, 0.02, 24, m.alu, [0, 0.042, 0]);
        // Roll-over protective arch over the LiDAR puck + Dual MIMO Wi-Fi/5G antennas
        for (const az of [-0.095, 0.095]) {
          tube(g, [[-0.36, 0.40, az], [-0.36, 0.555, az], [-0.16, 0.555, az], [-0.16, 0.40, az]], 0.008, m.darkSteel);
          cyl(g, 0.009, 0.012, 0.18, 12, m.darkSteel, [-0.42, 0.46, az * 1.25], [-0.18 * Math.sign(az), 0, 0.22]);
        }
        // Braided rugged DB25/M12 power-and-data umbilical cable into the dorsal port
        tube(g, [[-0.38, 0.35, 0.08], [-0.46, 0.33, 0.08], [-0.46, 0.29, 0.04]], 0.011, m.darkSteel);
      }],
      ['dorsal-manipulator-arm', '6-DOF Dorsal Robotic Manipulator Arm & Jaw Camera Gripper', 'Mobile Manipulation', true, [0.85, 1.45, 0], 'Top-mounted 6-DOF articulated arm with a camera-equipped jaw that opens doors and turns industrial valves.', 'When the robot grasps a heavy door handle, its 4 legs lean back automatically so the whole body helps pull the door open!', (g, m) => {
        // J1 Turret base & J2 Shoulder pitch harmonic drive drum
        cyl(g, 0.115, 0.128, 0.09, 26, m.darkSteel, [0.24, 0.345, 0]);
        cyl(g, 0.088, 0.088, 0.13, 24, m.primary, [0.24, 0.41, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.062, 0.062, 0.145, 20, m.darkSteel, [0.24, 0.41, 0], [Math.PI / 2, 0, 0]);
        // Sculpted upper arm boom with yellow truss shroud
        rbox(g, 0.48, 0.072, 0.078, 0.018, m.primary, [0.43, 0.54, 0], [0, 0, 0.48]);
        rbox(g, 0.38, 0.036, 0.084, 0.008, m.darkSteel, [0.43, 0.54, 0], [0, 0, 0.48]);
        // J3 Elbow actuator drum
        cyl(g, 0.062, 0.062, 0.105, 22, m.darkSteel, [0.64, 0.65, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.042, 0.042, 0.115, 18, m.alu, [0.64, 0.65, 0], [Math.PI / 2, 0, 0]);
        // Forearm tube & J4/J5/J6 spherical wrist joints
        rbox(g, 0.42, 0.056, 0.056, 0.014, m.darkSteel, [0.83, 0.57, 0], [0, 0, -0.36]);
        cyl(g, 0.032, 0.032, 0.38, 18, m.carbon, [0.83, 0.57, 0], [0, 0, Math.PI / 2 - 0.36]);
        sphere(g, 0.046, 18, m.alu, [1.02, 0.495, 0]);
        // Claw gripper housing with integrated 4K optical inspection camera + LED ring inside the jaw
        rbox(g, 0.085, 0.068, 0.088, 0.014, m.primary, [1.08, 0.485, 0]);
        cyl(g, 0.018, 0.018, 0.025, 16, m.glass, [1.125, 0.485, 0], [0, 0, Math.PI / 2]);
        // Articulated upper & lower serrated gripper jaws
        rbox(g, 0.135, 0.022, 0.062, 0.006, m.darkSteel, [1.17, 0.515, 0], [0, 0, 0.12]);
        rbox(g, 0.135, 0.022, 0.062, 0.006, m.darkSteel, [1.17, 0.455, 0], [0, 0, -0.12]);
        for (const jx of [1.14, 1.17, 1.20]) {
          box(g, 0.012, 0.008, 0.056, m.chrome, [jx, 0.502, 0]);
          box(g, 0.012, 0.008, 0.056, m.chrome, [jx, 0.468, 0]);
        }
        // External high-flex umbilical harness along the arm
        tube(g, [[0.24, 0.46, 0.055], [0.45, 0.59, 0.055], [0.64, 0.69, 0.048], [0.92, 0.55, 0.038]], 0.009, m.darkSteel);
      }],
      ['locomotion-imu-motherboard', '6-Axis Tactical IMU Gyroscope, Locomotion Computer & Cooling Blower', 'Flight Control', false, [0, 0.65, -1.45], 'Internal vibration-isolated Inertial Measurement Unit (IMU), real-time reflex controller, and sealed heat-pipe blower.', 'Even if you kick the robot sideways on gravel, its IMU gyroscope fires reflex commands to the legs in 2 milliseconds!', (g, m) => {
        rbox(g, 0.72, 0.045, 0.28, 0.012, screenMat('dashboard'), [0, 0.175, 0]);
        // Gold-anodized tactical 6-axis MEMS IMU module at the exact center of mass
        rbox(g, 0.11, 0.042, 0.11, 0.008, mat(0xd97706, { metalness: 0.85, roughness: 0.22 }), [0, 0.21, 0]);
        // Copper heat-pipes & twin centrifugal cooling blowers
        for (const bx of [-0.24, 0.24]) {
          cyl(g, 0.065, 0.065, 0.032, 20, m.darkSteel, [bx, 0.205, 0]);
          cyl(g, 0.042, 0.042, 0.036, 16, m.alu, [bx, 0.205, 0]);
        }
        buildWiringHarness(g, [[-0.32, 0.20, -0.09], [0, 0.205, -0.09], [0.32, 0.20, -0.09]], 4, 0.005);
      }],
    ],
    quiz: [
      { q: 'Which 5 sensor modules around the quadruped’s body build a 3D heightmap so it can climb stairs?', correctId: 'stereo-depth-camera-array', distractors: ['hot-swap-lithium-battery', 'exoskeleton-torso-shell', 'dorsal-manipulator-arm'] },
      { q: 'Which top-mounted attachment lets the robot dog turn valves and pull open doors?', correctId: 'dorsal-manipulator-arm', distractors: ['planetary-actuator-hips', 'articulated-legs-paws', 'hot-swap-lithium-battery'] },
      { q: 'Which spinning laser sensor on the robot’s back maps tunnels and factories with 300,000 pulses per second?', correctId: 'spinning-3d-lidar-payload', distractors: ['locomotion-imu-motherboard', 'articulated-legs-paws', 'exoskeleton-torso-shell'] },
      { q: 'Which low-ratio brushless hip motors act like electronic springs to absorb impacts when trotting?', correctId: 'planetary-actuator-hips', distractors: ['stereo-depth-camera-array', 'hot-swap-lithium-battery', 'spinning-3d-lidar-payload'] },
      { q: 'Which internal 6-axis gyroscope and reflex computer fires balance corrections in 2 milliseconds if the robot slips?', correctId: 'locomotion-imu-motherboard', distractors: ['exoskeleton-torso-shell', 'dorsal-manipulator-arm', 'hot-swap-lithium-battery'] },
    ],
  }),
];

export const CONSTRUCTION_MODELS = [
  buildRobotOrHeavyModel({
    id: 'cat-hydraulic-excavator', name: '36-Ton Hydraulic Crawler Excavator', brand: 'Caterpillar / Komatsu Class', badge: '36 Tons • 350 Bar Hydraulics • CAD Engine',
    desc: 'Heavy earthmoving tracked excavator with a 360° slewing upper structure, twin-cylinder monoboom/stick/bucket linkage, CAD diesel engine, and ROPS cab.',
    primaryHex: 0xf59e0b,
    partsSpec: [
      ['crawler-track-undercarriage', 'Triple-Grouser Steel Track Undercarriage & Planetary Travel Motors', 'Undercarriage', true, [0, -1.45, 0], 'H-frame welded undercarriage with 38 articulated triple-grouser steel track shoes per side, carrier rollers, recoil springs, and dual hydraulic travel drives.', 'Each steel track has its own independent hydraulic motor so the 36-ton excavator can spin 360° on a dime!', (g, m) => {
        const trackPadMat = brushedMetal(0x334155, { roughness: 0.38, metalness: 0.82 });
        const hubRed = carPaint(0xdc2626);
        // Welded X-box center carbody frame + angled track frame outriggers
        rbox(g, 0.96, 0.18, 0.92, 0.03, m.darkSteel, [-0.25, -0.42, 0]);
        for (const z of [-0.66, 0.66]) {
          // Track side frame beam + hydraulic grease track tensioner cylinder + side access step
          rbox(g, 1.72, 0.18, 0.24, 0.035, m.darkSteel, [-0.25, -0.46, z]);
          rbox(g, 1.38, 0.11, 0.26, 0.02, m.primary, [-0.25, -0.46, z]);
          rbox(g, 0.24, 0.05, 0.08, 0.01, m.alu, [-0.25, -0.48, z + Math.sign(z) * 0.14]);
          // Rear planetary final-drive sprocket (x = -1.06) + Front recoil idler wheel (x = 0.56)
          for (const [wx, isDrive] of [[-1.06, true], [0.56, false]]) {
            const w = new THREE.Group(); w.position.set(wx, -0.46, z); w.userData.driveRole = 'wheel'; g.add(w);
            cyl(w, 0.155, 0.155, 0.26, 22, m.darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
            if (isDrive) {
              cyl(w, 0.095, 0.095, 0.29, 18, hubRed, [0, 0, 0], [Math.PI / 2, 0, 0]);
              for (let t = 0; t < 12; t++) {
                const a = (t / 12) * Math.PI * 2;
                box(w, 0.035, 0.035, 0.27, m.chrome, [Math.cos(a) * 0.155, Math.sin(a) * 0.155, 0], [0, 0, a]);
              }
            } else {
              cyl(w, 0.11, 0.11, 0.28, 18, m.primary, [0, 0, 0], [Math.PI / 2, 0, 0]);
            }
          }
          // 7 bottom load rollers + 2 top carrier rollers
          for (let rx = -0.82; rx <= 0.34; rx += 0.19) {
            cyl(g, 0.052, 0.052, 0.28, 14, m.darkSteel, [rx, -0.58, z], [Math.PI / 2, 0, 0]);
          }
          for (const cx of [-0.58, 0.08]) {
            cyl(g, 0.045, 0.045, 0.26, 14, m.darkSteel, [cx, -0.32, z], [Math.PI / 2, 0, 0]);
          }
          // Continuous articulated triple-grouser steel track shoes wrapping around top, bottom, idler & sprocket
          for (let px = -1.06; px <= 0.56; px += 0.09) {
            for (const py of [-0.295, -0.625]) {
              rbox(g, 0.082, 0.024, 0.36, 0.004, trackPadMat, [px, py, z]);
              box(g, 0.016, 0.036, 0.36, m.chrome, [px - 0.02, py + Math.sign(py + 0.46) * 0.01, z]);
              box(g, 0.016, 0.036, 0.36, m.chrome, [px + 0.02, py + Math.sign(py + 0.46) * 0.01, z]);
            }
          }
          for (let a = -Math.PI * 0.48; a <= Math.PI * 0.48; a += 0.32) {
            const fx = 0.56 + Math.cos(a) * 0.168;
            const fy = -0.46 + Math.sin(a) * 0.168;
            box(g, 0.028, 0.08, 0.36, trackPadMat, [fx, fy, z], [0, 0, a]);
            const rx = -1.06 - Math.cos(a) * 0.168;
            const ry = -0.46 + Math.sin(a) * 0.168;
            box(g, 0.028, 0.08, 0.36, trackPadMat, [rx, ry, z], [0, 0, -a]);
          }
        }
      }],
      ['slew-ring-turntable-swivel', 'Internal-Gear 360° Slewing Bearing & Central Hydraulic Swivel Joint', 'Rotation Drive', false, [0, -0.75, 1.45], 'Hardened ring gear, dual planetary hydraulic swing motors (CAD), and multi-port rotary hydraulic swivel union.', 'A central rotary fluid union lets high-pressure oil flow to the tracks even while the upper cab spins endlessly in circles!', (g, m) => {
        cyl(g, 0.52, 0.52, 0.14, 36, m.darkSteel, [-0.25, -0.26, 0]);
        torus(g, 0.53, 0.022, m.chrome, [-0.25, -0.26, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.09, 0.09, 0.32, 20, m.chrome, [-0.25, -0.14, 0]);
        populateGearboxCad(g, { pos: [-0.12, -0.14, -0.18], scale: 0.008 });
      }],
      ['rops-operator-cab', 'Pressurized ROPS/FOPS Panoramic Operator Cab, Seat & Joysticks', 'Operator Station', true, [0.35, 1.35, 1.15], 'Framed ROPS/FOPS protective steel cage with floor-to-ceiling safety glass, front rock guard bars, air-suspension seat, LCD monitor, and dual joysticks.', 'Just two 2-axis joysticks in the cab control all 4 movements of the boom, stick, bucket, and 360° swing!', (g, m) => {
        const cabZ = 0.42;
        // Cab floor deck + roof canopy + thin structural ROPS pillars (open glass view!)
        rbox(g, 0.78, 0.05, 0.48, 0.015, m.darkSteel, [0.02, -0.04, cabZ]);
        rbox(g, 0.80, 0.055, 0.48, 0.02, m.primary, [0.02, 0.62, cabZ]);
        rbox(g, 0.74, 0.04, 0.44, 0.015, m.darkSteel, [0.02, 0.59, cabZ]);
        for (const [px, pz, tilt] of [[0.36, 0.20, -0.12], [0.36, 0.64, -0.12], [-0.04, 0.20, 0], [-0.04, 0.64, 0], [-0.34, 0.20, 0], [-0.34, 0.64, 0]]) {
          rbox(g, 0.042, 0.64, 0.042, 0.01, m.darkSteel, [px, 0.28, pz], [0, 0, tilt]);
        }
        // Crystal-clear front, side, rear & roof skylight glass panes + front wiper + rock guard grille bars
        rbox(g, 0.018, 0.58, 0.42, 0.006, m.glass, [0.36, 0.28, cabZ], [0, 0, -0.12]);
        for (const sz of [0.205, 0.635]) {
          rbox(g, 0.68, 0.56, 0.014, 0.006, m.glass, [0.0, 0.28, sz]);
        }
        for (let gy = 0.06; gy <= 0.52; gy += 0.09) {
          box(g, 0.008, 0.008, 0.42, m.darkSteel, [0.39 - (gy - 0.28) * 0.12, gy, cabZ]);
        }
        // Roof LED floodlights + exterior grab handrail + side mirror
        for (const lz of [0.26, 0.58]) {
          rbox(g, 0.04, 0.035, 0.055, 0.008, emissiveMat(0xfef08a, 2.2), [0.41, 0.62, lz]);
        }
        tube(g, [[0.34, 0.02, 0.66], [0.38, 0.26, 0.66], [0.35, 0.48, 0.66]], 0.01, m.chrome);
        // Interior high-back air-suspension operator seat, yellow safety armrests, dual pilot joysticks, travel levers & LCD display
        rbox(g, 0.22, 0.28, 0.22, 0.025, m.darkSteel, [-0.06, 0.16, cabZ]);
        rbox(g, 0.06, 0.34, 0.20, 0.02, m.darkSteel, [-0.14, 0.28, cabZ], [0, 0, 0.12]);
        for (const jz of [0.29, 0.55]) {
          rbox(g, 0.16, 0.04, 0.045, 0.01, m.primary, [0.02, 0.22, jz]);
          cyl(g, 0.012, 0.012, 0.14, 10, m.chrome, [0.10, 0.28, jz], [0, 0, -0.22]);
        }
        for (const tz of [0.39, 0.45]) {
          cyl(g, 0.008, 0.008, 0.26, 8, m.darkSteel, [0.24, 0.12, tz], [0, 0, -0.18]);
        }
        rbox(g, 0.03, 0.11, 0.14, 0.008, screenMat('dashboard'), [0.28, 0.24, 0.27], [0, 0.35, -0.15]);
      }],
      ['monoboom-lift-cylinders', 'Heavy Box-Section Gooseneck Monoboom & Twin Lift Cylinders', 'Front Linkage', true, [0.95, 1.45, 0], 'Ultrasonically inspected curved welded steel gooseneck boom with forged pin bosses, twin 350-bar lift cylinders, and clamped steel hydraulic hardlines.', 'Two hydraulic cylinders no wider than a dinner plate can lift 15+ tons of rock straight out of a trench!', (g, m) => {
        // True sculpted curved gooseneck monoboom profile (x = -0.05 to 1.48)
        const boomPts = [
          [-0.08, 0.04],
          [0.32, 0.48],
          [0.74, 0.78],
          [1.48, 0.68],
          [1.48, 0.52],
          [0.72, 0.52],
          [0.32, 0.24],
          [0.02, -0.08],
        ];
        extrudeProfile(g, boomPts, 0.22, m.primary, [0, 0, -0.16], [0, 0, 0], 0.022);
        // Forged steel pivot pin bosses at boom foot, mid-cylinder ear, and boom nose
        for (const [bx, by, br] of [[-0.02, 0.0, 0.095], [0.68, 0.64, 0.11], [1.46, 0.60, 0.095]]) {
          cyl(g, br, br, 0.28, 22, m.darkSteel, [bx, by, -0.05], [Math.PI / 2, 0, 0]);
          cyl(g, br * 0.55, br * 0.55, 0.31, 18, m.chrome, [bx, by, -0.05], [Math.PI / 2, 0, 0]);
        }
        // Twin main boom lift cylinders (barrels + chrome rods) flanking the boom
        for (const z of [-0.22, 0.12]) {
          cyl(g, 0.056, 0.056, 0.58, 20, m.darkSteel, [0.28, 0.16, z], [0, 0, -0.68]);
          cyl(g, 0.038, 0.038, 0.54, 18, m.chrome, [0.50, 0.42, z], [0, 0, -0.68]);
          rbox(g, 0.04, 0.035, 0.05, 0.008, emissiveMat(0xfef08a, 2.0), [0.82, 0.62, z]);
        }
        // Clamped steel hydraulic hardlines & flexible jumper hoses along both sides of the boom
        for (const hy of [0.0, 0.035]) {
          tube(g, [[0.06, 0.06 + hy, -0.18], [0.68, 0.68 + hy, -0.18], [1.42, 0.62 + hy, -0.18]], 0.011, m.chrome);
          tube(g, [[0.06, 0.06 + hy, 0.08], [0.68, 0.68 + hy, 0.08], [1.42, 0.62 + hy, 0.08]], 0.011, m.darkSteel);
        }
      }],
      ['dipper-stick-crowd-cylinder', 'Dipper Arm Stick, Crowd/Curl Cylinders & H-Link Power Linkage', 'Front Linkage', false, [1.85, 0.85, 0], 'Tapered welded box-section dipper stick driven by the dorsal crowd cylinder, stick-mounted bucket curl cylinder, and forged H-link / dog-bone linkage.', 'Internal baffle plates welded inside the stick stop the steel box beam from twisting when prying up bedrock!', (g, m) => {
        // Tapered dipper stick profile articulating from boom nose (1.46, 0.60) down to bucket pin (1.84, -0.12)
        const stickPts = [
          [1.34, 0.82],
          [1.58, 0.66],
          [1.90, -0.14],
          [1.76, -0.18],
          [1.38, 0.54],
          [1.26, 0.74],
        ];
        extrudeProfile(g, stickPts, 0.16, m.primary, [0, 0, -0.13], [0, 0, 0], 0.018);
        for (const [sx, sy, sr] of [[1.31, 0.78, 0.07], [1.46, 0.60, 0.085], [1.82, -0.14, 0.075]]) {
          cyl(g, sr, sr, 0.22, 18, m.darkSteel, [sx, sy, -0.05], [Math.PI / 2, 0, 0]);
          cyl(g, sr * 0.5, sr * 0.5, 0.25, 16, m.chrome, [sx, sy, -0.05], [Math.PI / 2, 0, 0]);
        }
        // Dorsal crowd cylinder (top of boom to top of stick) + Bucket curl cylinder (along back of stick)
        cyl(g, 0.054, 0.054, 0.50, 18, m.darkSteel, [0.90, 0.82, -0.05], [0, 0, -Math.PI / 2 + 0.08]);
        cyl(g, 0.036, 0.036, 0.44, 18, m.chrome, [1.14, 0.80, -0.05], [0, 0, -Math.PI / 2 + 0.08]);
        cyl(g, 0.050, 0.050, 0.46, 18, m.darkSteel, [1.56, 0.54, -0.05], [0, 0, 0.42]);
        cyl(g, 0.034, 0.034, 0.42, 18, m.chrome, [1.70, 0.22, -0.05], [0, 0, 0.42]);
        // Forged H-Link & Dog-Bone bucket power linkage at stick tip
        for (const lz of [-0.14, 0.04]) {
          rbox(g, 0.05, 0.24, 0.025, 0.008, m.darkSteel, [1.74, -0.02, lz], [0, 0, -0.35]);
          rbox(g, 0.045, 0.22, 0.025, 0.008, m.primary, [1.88, -0.02, lz], [0, 0, 0.45]);
        }
      }],
      ['toothed-rock-bucket', '5-Tooth Hardox Steel Rock Bucket, Side Cutters & Wear Shrouds', 'Earthmoving Tool', false, [2.25, -0.45, 0], 'Abrasion-resistant curved Hardox 500 trenching bucket with 5 replaceable forged Tiger rock teeth, serrated side cutters, and top pin brackets.', 'Excavator bucket teeth are held on by locking pins so worn-out teeth can be hammered off and replaced in 10 minutes!', (g, m) => {
        extrudeProfile(
          g,
          [[-0.24, 0.24], [0.22, 0.24], [0.30, -0.10], [0.06, -0.28], [-0.26, -0.20]],
          0.52,
          m.darkSteel,
          [1.82, -0.24, -0.31],
          [0, 0, 0.22],
          0.02,
        );
        // Twin top pin-ear mounting brackets + side wear cutter plates
        for (const bz of [-0.18, 0.08]) {
          rbox(g, 0.26, 0.14, 0.035, 0.01, m.primary, [1.80, -0.02, bz]);
        }
        for (const sz of [-0.315, 0.215]) {
          rbox(g, 0.12, 0.26, 0.022, 0.006, m.primary, [2.02, -0.20, sz], [0, 0, 0.25]);
        }
        // 5 Forged replaceable Tiger rock teeth + adapter shanks along the cutting lip
        for (let i = 0; i < 5; i++) {
          const tz = -0.25 + i * 0.10;
          rbox(g, 0.09, 0.042, 0.042, 0.008, m.primary, [2.04, -0.34, tz], [0, 0, -0.32]);
          cone(g, 0.026, 0.15, 6, m.chrome, [2.13, -0.37, tz], [0, 0, -1.28]);
        }
      }],
      ['turbodiesel-hydraulic-pump', 'Cat C9.3B Turbo-Diesel Engine (CAD), Swashplate Pumps & Service Deck', 'Powertrain & Hydraulics', false, [-0.95, 1.15, -1.15], 'Sculpted upper house enclosure with louvered service doors, catwalk handrails, vertical exhaust stack, cooling fan, CAD diesel engine, and twin 350-bar pumps.', 'Instead of a mechanical transmission, the diesel engine drives twin swashplate oil pumps at 5,000 PSI to power every motion!', (g, m) => {
        populateEngineCad(g, { pos: [-0.62, 0.22, -0.12], scale: 0.0016, primaryColor: 0xf59e0b });
        // Sculpted upper house chassis platform + starboard hydraulic tank + engine hood cowling
        rbox(g, 1.48, 0.10, 1.34, 0.025, m.darkSteel, [-0.38, -0.14, 0]);
        rbox(g, 1.08, 0.44, 0.78, 0.04, m.primary, [-0.58, 0.14, -0.24]);
        rbox(g, 0.56, 0.14, 0.54, 0.035, m.darkSteel, [-0.68, 0.42, -0.18]);
        // Louvered side engine intake grille + hydraulic oil sight glass + vertical exhaust muffler stack + air pre-cleaner
        rbox(g, 0.48, 0.28, 0.02, 0.008, m.darkSteel, [-0.68, 0.16, -0.635]);
        cyl(g, 0.042, 0.042, 0.36, 16, m.darkSteel, [-0.74, 0.58, -0.28]);
        cyl(g, 0.068, 0.068, 0.10, 16, m.darkSteel, [-0.54, 0.52, -0.34]);
        // Yellow tubular upper-deck safety handrails & service steps
        tube(g, [[-0.08, 0.36, -0.60], [-0.08, 0.58, -0.60], [-0.98, 0.58, -0.60], [-0.98, 0.36, -0.60]], 0.014, m.primary);
      }],
      ['cast-iron-counterweight', '7-Ton Curved Cast-Iron Rear Counterweight & Service Walkways', 'Balance & Stability', true, [-1.85, 0.15, 0], 'Solid 7,000-kg curved two-tone cast-iron rear ballast block with hazard chevrons, lifting eyes, and rearview camera.', 'Without the 7-ton cast-iron counterweight on the tail, the excavator would tip forward on its nose the moment it dug a full bucket!', (g, m) => {
        rbox(g, 0.44, 0.54, 1.38, 0.12, m.darkSteel, [-1.18, 0.16, 0]);
        rbox(g, 0.46, 0.18, 1.40, 0.045, m.primary, [-1.18, 0.16, 0]);
        for (const sz of [-0.52, 0.52]) {
          rbox(g, 0.03, 0.06, 0.14, 0.008, emissiveMat(0xef4444, 1.8), [-1.40, 0.32, sz]);
        }
      }],
    ],
    quiz: [
      { q: 'Which heavy rear block keeps the 36-ton excavator from tipping forward when the boom reaches out?', correctId: 'cast-iron-counterweight', distractors: ['rops-operator-cab', 'toothed-rock-bucket', 'crawler-track-undercarriage'] },
      { q: 'Which central bearing and rotary fluid union lets the excavator cab spin 360° continuously?', correctId: 'slew-ring-turntable-swivel', distractors: ['monoboom-lift-cylinders', 'dipper-stick-crowd-cylinder', 'cast-iron-counterweight'] },
      { q: 'Which attachment at the tip of the stick uses replaceable forged steel teeth to rip through rock?', correctId: 'toothed-rock-bucket', distractors: ['turbodiesel-hydraulic-pump', 'rops-operator-cab', 'slew-ring-turntable-swivel'] },
      { q: 'Which curved box-section main boom and twin 350-bar cylinders lift 15+ tons straight out of a trench?', correctId: 'monoboom-lift-cylinders', distractors: ['rops-operator-cab', 'cast-iron-counterweight', 'crawler-track-undercarriage'] },
      { q: 'Which triple-grouser steel tracks let the 36-ton excavator counter-rotate and spin on the spot?', correctId: 'crawler-track-undercarriage', distractors: ['toothed-rock-bucket', 'rops-operator-cab', 'dipper-stick-crowd-cylinder'] },
    ],
  }),
  buildRobotOrHeavyModel({
    id: 'john-deere-combine-harvester', name: 'Rotary Combine Harvester', brand: 'John Deere X9 / Axial-Flow Class', badge: '40-Ft Header • 3-In-1 Reap/Thresh/Winnow',
    desc: 'Giant agricultural harvesting factory on wheels that cuts crops, threshes grain in an axial-flow rotor, winnows chaff over reciprocating sieves, and unloads on the go.',
    primaryHex: 0x15803d,
    partsSpec: [
      ['draper-header-spinning-reel', '40-Foot Cutterbar Header, 6-Bat Pickup Reel & Cross Auger', 'Crop Cutting', true, [2.15, -0.35, 0], 'Reciprocating sickle-bar knives, 6-bat spinning pickup reel, and spiral cross-auger feeding stalks to the center.', 'The combine gets its name because it "combines" 3 separate farm jobs—reaping, threshing, and winnowing—into one machine!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        const beltMat = mat(0x1e293b, { roughness: 0.85, metalness: 0.1 });
        // Sculpted curved header backsheet & cutterbar floor trough (extruded L-trough profile)
        const headerPts = [
          [1.38, -0.14], [1.46, -0.14], [1.44, -0.42],
          [1.82, -0.44], [1.84, -0.48], [1.36, -0.48],
        ];
        extrudeProfile(g, headerPts, 2.44, m.primary, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.01, bevelSize: 0.01 });
        // Left & right rubber draper conveyor belts with vulcanized cleats feeding crop to center
        for (const side of [-1, 1]) {
          box(g, 0.32, 0.025, 0.96, beltMat, [1.62, -0.43, side * 0.64]);
          for (let cz = 0.18; cz <= 1.10; cz += 0.13) {
            box(g, 0.30, 0.012, 0.012, jdYellow, [1.62, -0.415, side * cz]);
          }
          // Sculpted header end-wall plates + Hydraulic reel lift/fore-aft support arms
          rbox(g, 0.52, 0.38, 0.045, 0.015, m.primary, [1.60, -0.28, side * 1.22]);
          rbox(g, 0.56, 0.06, 0.035, 0.01, jdYellow, [1.62, -0.08, side * 1.21], [0, 0, -0.18]);
          cyl(g, 0.018, 0.018, 0.38, 12, m.chrome, [1.54, -0.16, side * 1.18], [0, 0, -0.45]);
          // Pointed yellow aerodynamic crop dividers & outer crop lifters at both ends of header
          cone(g, 0.085, 0.44, 14, jdYellow, [1.96, -0.40, side * 1.22], [0, 0, -Math.PI / 2 + 0.12]);
          sphere(g, 0.082, 14, m.primary, [1.76, -0.39, side * 1.22]);
        }
        // Reciprocating chrome sickle cutterbar guard teeth along the entire 40-ft leading edge
        box(g, 0.06, 0.018, 2.42, m.darkSteel, [1.83, -0.455, 0]);
        for (let kz = -1.16; kz <= 1.16; kz += 0.065) {
          cone(g, 0.018, 0.065, 4, m.chrome, [1.88, -0.455, kz], [0, Math.PI / 4, -Math.PI / 2]);
        }
        // Center stainless feed drum + Full-width cross-auger tube with opposing left/right spiral flighting
        cyl(g, 0.115, 0.115, 2.36, 24, m.alu, [1.53, -0.30, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.135, 0.135, 0.42, 20, m.chrome, [1.53, -0.30, 0], [Math.PI / 2, 0, 0]);
        for (let z = -1.12; z <= 1.12; z += 0.085) {
          if (Math.abs(z) < 0.18) continue;
          const tilt = z < 0 ? 0.28 : -0.28;
          torus(g, 0.155, 0.011, jdYellow, [1.53, -0.30, z], [tilt, 0, 0]);
        }
        // 6-bat hexagonal spinning pickup reel with eccentric spider rings & crop tines
        const reel = new THREE.Group(); reel.position.set(1.78, -0.10, 0); reel.userData.driveAnim = 'fan'; reel.userData.spinAxis = 'z'; g.add(reel);
        cyl(reel, 0.036, 0.036, 2.38, 18, m.darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
        for (const sz of [-1.16, -0.58, 0, 0.58, 1.16]) {
          torus(reel, 0.22, 0.012, jdYellow, [0, 0, sz], [0, 0, 0]);
          for (let s = 0; s < 6; s++) {
            const sa = (s / 6) * Math.PI * 2;
            box(reel, 0.014, 0.22, 0.014, jdYellow, [Math.cos(sa) * 0.11, Math.sin(sa) * 0.11, sz], [0, 0, sa + Math.PI / 2]);
          }
        }
        for (let b = 0; b < 6; b++) {
          const a = (b / 6) * Math.PI * 2;
          const bx = Math.cos(a) * 0.22;
          const by = Math.sin(a) * 0.22;
          cyl(reel, 0.014, 0.014, 2.36, 10, jdYellow, [bx, by, 0], [Math.PI / 2, 0, 0]);
          // Curved spring-steel pickup fingers/tines along each reel bat
          for (let tz = -1.12; tz <= 1.12; tz += 0.11) {
            box(reel, 0.006, 0.068, 0.006, m.darkSteel, [bx + Math.cos(a - 0.4) * 0.03, by + Math.sin(a - 0.4) * 0.03, tz], [0, 0, a - 0.4]);
          }
        }
      }],
      ['feederhouse-chain-conveyor', 'Pivoting Feederhouse Elevator & Stone Trap Drum', 'Crop Intake', true, [1.35, -0.65, 0], 'Slatted chain conveyor throat lifting cut crop stalks from the header up into the threshing rotor.', 'An acoustic stone-trap door in the feederhouse hears rocks clanking and dumps them onto the ground before they hit the rotor!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        //Heavy welded rectangular feederhouse housing angled down to header
        rbox(g, 0.86, 0.30, 0.56, 0.025, m.primary, [1.02, -0.18, 0], [0, 0, -0.34]);
        rbox(g, 0.78, 0.22, 0.60, 0.018, m.darkSteel, [1.02, -0.18, 0], [0, 0, -0.34]);
        // Internal slatted chain conveyor bars + acoustic stone-trap drum at throat base
        cyl(g, 0.09, 0.09, 0.62, 18, jdYellow, [0.68, -0.06, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.08, 0.08, 0.62, 18, m.alu, [1.34, -0.30, 0], [Math.PI / 2, 0, 0]);
        // Twin hydraulic header-lift cylinders + yellow PTO telescoping driveline shafts
        for (const side of [-1, 1]) {
          cyl(g, 0.042, 0.042, 0.48, 16, m.darkSteel, [0.82, -0.34, side * 0.24], [0, 0, -1.18]);
          cyl(g, 0.028, 0.028, 0.44, 14, m.chrome, [1.08, -0.26, side * 0.24], [0, 0, -1.18]);
          cyl(g, 0.026, 0.026, 0.68, 12, jdYellow, [1.02, -0.14, side * 0.33], [0, 0, Math.PI / 2 - 0.34]);
        }
      }],
      ['axial-flow-threshing-rotor', 'Dual Axial-Flow Threshing & Separating Rotor Cages (Cutaway)', 'Internal Threshing', false, [0.15, 0.55, 1.55], 'Spinning rasp-bar cylinders and concave grates that rub grain kernels out of the heads via gentle centrifugal force.', 'Instead of smashing kernels, the spinning rotor rubs crop against crop in a spiral path to save 99% of the grain intact!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        // Twin counter-rotating X9 axial-flow rotors with spiral threshing rasp bars & separating tines
        for (const z of [-0.19, 0.19]) {
          cyl(g, 0.145, 0.145, 1.36, 24, jdYellow, [-0.06, 0.10, z], [0, 0, Math.PI / 2]);
          cone(g, 0.145, 0.24, 24, m.chrome, [0.74, 0.10, z], [0, 0, -Math.PI / 2]);
          // Spiral helical threshing rasp elements along the rotor drum
          for (let rx = -0.64; rx <= 0.54; rx += 0.12) {
            torus(g, 0.158, 0.014, m.darkSteel, [rx, 0.10, z], [0.22, Math.PI / 2, 0]);
          }
          // Bottom perforated concave grates wrapping underneath each rotor
          for (let cx = -0.58; cx <= 0.48; cx += 0.18) {
            torus(g, 0.185, 0.010, m.alu, [cx, 0.08, z], [0, Math.PI / 2, 0]);
          }
        }
        populateGearboxCad(g, { pos: [-0.74, 0.10, 0], scale: 0.008 });
      }],
      ['cleaning-shoe-sieves-fan', 'Reciprocating Chaffer/Sieve Cleaning Shoe & Cross-Flow Blower', 'Winnowing & Cleaning', false, [-0.35, -0.85, -1.45], 'Shaking louvered sieves and a high-volume air fan that blows light chaff out the back while heavy clean grain falls through.', 'Just like tossing wheat in the wind, a giant fan underneath blows away light straw while heavy grain drops into the clean elevator!', (g, m) => {
        // Upper chaffer & lower clean-grain reciprocating sieve frames with adjustable louvers
        rbox(g, 1.18, 0.14, 0.72, 0.018, m.darkSteel, [-0.16, -0.18, 0]);
        for (let lx = -0.66; lx <= 0.34; lx += 0.075) {
          box(g, 0.04, 0.012, 0.66, m.alu, [lx, -0.105, 0], [0, 0, 0.25]);
          box(g, 0.04, 0.012, 0.66, m.chrome, [lx, -0.165, 0], [0, 0, 0.25]);
        }
        // Quadruple cross-flow turbine cleaning fan housing at the front of the shoe
        cyl(g, 0.135, 0.135, 0.68, 22, carPaint(0xfacc15), [0.38, -0.22, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.095, 0.095, 0.72, 18, m.darkSteel, [0.38, -0.22, 0], [Math.PI / 2, 0, 0]);
        // Clean grain cross-augers & vertical clean grain bucket elevator leg on starboard side
        cyl(g, 0.055, 0.055, 0.74, 16, m.alu, [-0.08, -0.28, 0], [Math.PI / 2, 0, 0]);
        rbox(g, 0.14, 0.78, 0.12, 0.015, m.primary, [0.05, 0.14, 0.42]);
      }],
      ['grain-tank-unloading-auger', '420-Bushel Folding Grain Hopper & 27-Ft Unloading Auger Boom', 'Grain Storage', true, [-0.25, 1.55, -1.15], 'Top-mounted 14,800-liter grain hopper and swing-out turret auger that unloads 4.5 bushels per second into a tractor cart.', 'A modern combine can fill an entire semi-truck trailer with golden wheat in less than 2 minutes without even stopping!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        const wheatMat = mat(0xeab308, { roughness: 0.78, metalness: 0.05 });
        // Main grain tank hopper bin sitting behind cab
        rbox(g, 1.18, 0.36, 0.94, 0.035, m.primary, [-0.04, 0.42, 0]);
        // Flared folding upper hopper extensions (trapezoidal outward-flaring covers)
        for (const side of [-1, 1]) {
          rbox(g, 1.14, 0.20, 0.04, 0.012, jdYellow, [-0.04, 0.66, side * 0.49], [-side * 0.24, 0, 0]);
        }
        for (const [fx, tilt] of [[0.52, -0.22], [-0.60, 0.22]]) {
          rbox(g, 0.04, 0.20, 0.96, 0.012, m.primary, [fx, 0.66, 0], [0, 0, tilt]);
        }
        // Golden harvested wheat grain mounded inside the open top hopper + cross-tank bubble-up auger
        rbox(g, 1.06, 0.12, 0.88, 0.05, wheatMat, [-0.04, 0.62, 0]);
        sphere(g, 0.44, 20, wheatMat, [-0.04, 0.46, 0]);
        cyl(g, 0.042, 0.042, 0.92, 14, m.alu, [-0.04, 0.70, 0], [Math.PI / 2, 0, 0]);
        // Heavy vertical turret sump column on port side + high-arc 27-ft swing-out unloading auger boom
        cyl(g, 0.115, 0.125, 0.54, 22, m.primary, [-0.24, 0.52, -0.38]);
        sphere(g, 0.125, 18, jdYellow, [-0.24, 0.78, -0.38]);
        tube(g, [[-0.24, 0.78, -0.38], [-0.58, 0.90, -0.88], [-0.96, 0.98, -1.42]], 0.086, m.primary);
        // Top structural suspension truss rod & hydraulic swing cylinder along the auger boom
        tube(g, [[-0.24, 0.90, -0.38], [-0.60, 0.99, -0.88], [-0.92, 1.04, -1.36]], 0.016, m.darkSteel);
        // Pivoting yellow grain discharge boot spout at tip of auger
        cyl(g, 0.092, 0.068, 0.28, 18, jdYellow, [-0.96, 0.86, -1.43], [0.18, 0, 0]);
      }],
      ['gps-autosteer-harvest-cab', 'Glass Panoramic Cab, StarFire GPS Dome & Harvest Monitor', 'Operator & Autonomy', true, [0.85, 1.35, 0], 'Sound-insulated glass cab with RTK centimeter-accurate GPS dome and real-time optical yield/moisture sensors.', 'The yellow GPS dome on the cab roof steers the 25-ton combine down crop rows Hands-Free within 2 centimeters!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        const lightMat = emissiveMat(0xfef9c3, 2.5);
        // Cab floor platform & cantilevered operator deck
        rbox(g, 0.74, 0.06, 0.92, 0.018, m.darkSteel, [0.70, 0.08, 0]);
        // Forward-raked panoramic curved glass greenhouse with angled thin ROPS A/B pillars
        const cabGlassPts = [
          [0.38, 0.10], [0.94, 0.10], [1.06, 0.68], [0.42, 0.68],
        ];
        extrudeProfile(g, cabGlassPts, 0.74, m.glass, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.015, bevelSize: 0.012 });
        // Forward-raked structural A-pillars & B-pillars + front windshield wiper arm
        for (const sz of [-0.37, 0.37]) {
          tube(g, [[0.93, 0.11, sz], [1.05, 0.68, sz]], 0.018, m.darkSteel);
          tube(g, [[0.40, 0.11, sz], [0.43, 0.68, sz]], 0.022, m.darkSteel);
          // Telescoping wide-angle heated exterior mirrors + amber warning beacons
          tube(g, [[0.96, 0.56, sz], [0.98, 0.56, sz * 1.42], [0.98, 0.40, sz * 1.42]], 0.010, m.darkSteel);
          rbox(g, 0.03, 0.16, 0.07, 0.008, m.darkSteel, [0.98, 0.46, sz * 1.44]);
          cyl(g, 0.022, 0.026, 0.045, 14, emissiveMat(0xf59e0b, 2.0), [0.88, 0.75, sz * 1.05]);
        }
        // Sculpted overhanging green & dark-charcoal cab roof canopy with 8 stadium LED worklights
        rbox(g, 0.76, 0.065, 0.86, 0.022, m.primary, [0.74, 0.70, 0]);
        rbox(g, 0.70, 0.035, 0.80, 0.015, m.darkSteel, [0.74, 0.67, 0]);
        for (let lz = -0.32; lz <= 0.32; lz += 0.09) {
          rbox(g, 0.03, 0.028, 0.055, 0.006, lightMat, [1.11, 0.695, lz]);
        }
        // Iconic yellow John Deere StarFire RTK GPS receiver dome mounted front-center on cab roof
        rbox(g, 0.16, 0.03, 0.18, 0.01, m.darkSteel, [0.98, 0.735, 0]);
        sphere(g, 0.088, 20, jdYellow, [0.98, 0.765, 0]);
        // Interior leather air-suspension seat, steering column, CommandARM hydrostat lever & dual Gen-4 touchscreens
        rbox(g, 0.22, 0.24, 0.24, 0.025, mat(0x78350f, { roughness: 0.6 }), [0.64, 0.24, 0]);
        rbox(g, 0.07, 0.30, 0.22, 0.02, mat(0x78350f, { roughness: 0.6 }), [0.54, 0.36, 0], [0, 0, 0.14]);
        cyl(g, 0.022, 0.028, 0.26, 12, m.darkSteel, [0.86, 0.24, 0], [0, 0, -0.38]);
        torus(g, 0.075, 0.012, m.darkSteel, [0.81, 0.36, 0], [0, Math.PI / 2, -0.38]);
        rbox(g, 0.025, 0.12, 0.15, 0.006, screenMat('dashboard'), [0.82, 0.34, 0.22], [0, -0.35, -0.15]);
        // Port-side catwalk landing platform + 6-rung boarding ladder with yellow tubular safety handrails
        rbox(g, 0.46, 0.035, 0.24, 0.01, m.alu, [0.68, 0.08, -0.56]);
        for (const lx of [0.54, 0.78]) {
          tube(g, [[lx, 0.08, -0.66], [lx, -0.50, -0.78]], 0.012, jdYellow);
          tube(g, [[lx, 0.08, -0.66], [lx, 0.44, -0.66], [lx, 0.44, -0.44]], 0.012, jdYellow);
        }
        for (let r = 0; r < 6; r++) {
          const ry = 0.04 - r * 0.10;
          const rz = -0.67 - r * 0.02;
          box(g, 0.24, 0.014, 0.035, m.alu, [0.66, ry, rz]);
        }
      }],
      ['turbodiesel-residue-chopper', '13.6L Twin-Turbo Diesel Engine (CAD) & High-Speed Straw Chopper', 'Powertrain & Residue', true, [-1.65, 0.45, 0], '700-hp rear diesel engine (CAD) plus a 3,000-RPM flail chopper and dual-disc spreader at the tail.', 'Spinning knives at the tail chop leftover stalks into fine mulch and spread it 40 feet wide to fertilize next year’s soil!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        populateEngineCad(g, { pos: [-0.88, 0.26, 0], scale: 0.0016, primaryColor: 0x15803d });
        // Sculpted tapered John Deere X9 body side-panels (extruded profile tapering sleekly to the tail)
        const bodySidePts = [
          [-1.56, -0.02], [-1.38, -0.22], [0.34, -0.22],
          [0.42, 0.32], [-1.18, 0.38], [-1.52, 0.24],
        ];
        extrudeProfile(g, bodySidePts, 0.92, m.primary, [0, 0, 0], [0, 0, 0], { bevel: true, bevelThickness: 0.025, bevelSize: 0.02 });
        // Iconic John Deere leaping-gold X9 diagonal side-stripe decals & gullwing door seams on both flanks
        const stripePts = [
          [-1.44, 0.08], [-0.82, 0.08], [-0.46, 0.22], [0.32, 0.22],
          [0.32, 0.28], [-0.50, 0.28], [-0.86, 0.15], [-1.48, 0.15],
        ];
        for (const side of [-1, 1]) {
          extrudeProfile(g, stripePts, 0.012, jdYellow, [0, 0, side * 0.478], [0, 0, 0], { bevel: false });
          // Side radiator rotary air-screen intake drum & service louvers
          rbox(g, 0.42, 0.24, 0.02, 0.008, m.darkSteel, [-0.96, 0.18, side * 0.475]);
          // Rear safety tail-lights & hazard markers
          rbox(g, 0.03, 0.055, 0.12, 0.008, emissiveMat(0xef4444, 1.8), [-1.54, 0.14, side * 0.36]);
        }
        // Upper rear engine deck cowling, air pre-cleaner intake & chrome/black vertical exhaust stack
        rbox(g, 0.78, 0.14, 0.84, 0.03, m.darkSteel, [-0.94, 0.42, 0]);
        cyl(g, 0.048, 0.048, 0.46, 18, m.darkSteel, [-0.72, 0.66, 0.32]);
        tube(g, [[-0.72, 0.88, 0.32], [-0.78, 0.96, 0.34]], 0.044, m.chrome);
        cyl(g, 0.085, 0.085, 0.14, 20, m.darkSteel, [-0.98, 0.54, -0.26]);
        // Tail residue hood deflector & twin horizontal spinning straw-spreader discs
        rbox(g, 0.38, 0.24, 0.82, 0.025, jdYellow, [-1.42, -0.06, 0], [0, 0, 0.28]);
        for (const z of [-0.24, 0.24]) {
          cyl(g, 0.20, 0.20, 0.035, 22, jdYellow, [-1.54, -0.14, z]);
          for (let b = 0; b < 6; b++) {
            const ba = (b / 6) * Math.PI * 2;
            box(g, 0.08, 0.025, 0.014, m.darkSteel, [-1.54 + Math.cos(ba) * 0.13, -0.155, z + Math.sin(ba) * 0.13], [0, ba, 0]);
          }
        }
      }],
      ['high-flotation-drive-wheels', 'Front Rubber Crawler Tracks / Duals & Steerable Rear Axle', 'Running Gear', true, [0, -1.45, 0], 'Massive front agricultural traction wheels/tracks and wide-angle steerable rear wheels.', 'Giant front flotation tires spread the combine’s weight over a huge footprint so it doesn’t compact the farm soil!', (g, m) => {
        const jdYellow = carPaint(0xfacc15);
        const tireRubber = mat(0x111827, { roughness: 0.88, metalness: 0.06 });
        // Heavy front planetary final-drive transaxle beam + rear oscillating steering axle beam
        cyl(g, 0.085, 0.085, 1.32, 20, m.darkSteel, [0.46, -0.34, 0], [Math.PI / 2, 0, 0]);
        rbox(g, 0.16, 0.14, 1.18, 0.02, m.darkSteel, [-0.98, -0.44, 0]);
        for (const z of [-0.66, 0.66]) {
          const s = Math.sign(z);
          // Massive front high-flotation R1W deep-lug agricultural drive wheel (`driveRole="wheel"`)
          const fw = new THREE.Group(); fw.position.set(0.46, -0.34, z); fw.userData.driveRole = 'wheel'; g.add(fw);
          cyl(fw, 0.35, 0.35, 0.32, 32, tireRubber, [0, 0, 0], [Math.PI / 2, 0, 0]);
          torus(fw, 0.30, 0.065, tireRubber, [0, 0, s * 0.11], [0, 0, 0]);
          torus(fw, 0.30, 0.065, tireRubber, [0, 0, -s * 0.11], [0, 0, 0]);
          // Deep-dish John Deere yellow steel rim, planetary hub cap & 12 lug bolts
          cyl(fw, 0.20, 0.20, 0.33, 24, jdYellow, [0, 0, 0], [Math.PI / 2, 0, 0]);
          cyl(fw, 0.15, 0.18, 0.06, 24, m.darkSteel, [0, 0, s * 0.145], [Math.PI / 2, 0, 0]);
          cyl(fw, 0.085, 0.085, 0.36, 18, jdYellow, [0, 0, 0], [Math.PI / 2, 0, 0]);
          // 18 Angled chevron agricultural traction tread lugs around the front tire
          for (let l = 0; l < 18; l++) {
            const a = (l / 18) * Math.PI * 2;
            const lx = Math.cos(a) * 0.355;
            const ly = Math.sin(a) * 0.355;
            box(fw, 0.026, 0.042, 0.16, tireRubber, [lx, ly, -0.06], [0.35, 0, a]);
            box(fw, 0.026, 0.042, 0.16, tireRubber, [lx, ly, 0.06], [-0.35, 0, a]);
          }
          // Steerable rear agricultural wheel (`driveRole="wheel"`) with chevron lugs & yellow rim
          const rw = new THREE.Group(); rw.position.set(-0.98, -0.44, z * 0.88); rw.userData.driveRole = 'wheel'; g.add(rw);
          cyl(rw, 0.23, 0.23, 0.22, 28, tireRubber, [0, 0, 0], [Math.PI / 2, 0, 0]);
          torus(rw, 0.19, 0.048, tireRubber, [0, 0, s * 0.075], [0, 0, 0]);
          torus(rw, 0.19, 0.048, tireRubber, [0, 0, -s * 0.075], [0, 0, 0]);
          cyl(rw, 0.125, 0.125, 0.235, 22, jdYellow, [0, 0, 0], [Math.PI / 2, 0, 0]);
          cyl(rw, 0.058, 0.058, 0.255, 16, m.darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let l = 0; l < 14; l++) {
            const a = (l / 14) * Math.PI * 2;
            box(rw, 0.022, 0.032, 0.21, tireRubber, [Math.cos(a) * 0.234, Math.sin(a) * 0.234, 0], [0, 0, a]);
          }
        }
      }],
    ],
    quiz: [
      { q: 'Which spinning internal cylinder rubs grain kernels out of crop heads using centrifugal force?', correctId: 'axial-flow-threshing-rotor', distractors: ['high-flotation-drive-wheels', 'gps-autosteer-harvest-cab', 'grain-tank-unloading-auger'] },
      { q: 'Which shaking sieve and blower assembly separates clean grain from light chaff?', correctId: 'cleaning-shoe-sieves-fan', distractors: ['feederhouse-chain-conveyor', 'draper-header-spinning-reel', 'turbodiesel-residue-chopper'] },
      { q: 'Which swing-out boom empties 420 bushels of harvested grain into a truck while driving?', correctId: 'grain-tank-unloading-auger', distractors: ['axial-flow-threshing-rotor', 'draper-header-spinning-reel', 'high-flotation-drive-wheels'] },
      { q: 'Which 40-foot front cutterbar and 6-bat spinning reel slices standing wheat and feeds it inward?', correctId: 'draper-header-spinning-reel', distractors: ['gps-autosteer-harvest-cab', 'cleaning-shoe-sieves-fan', 'turbodiesel-residue-chopper'] },
      { q: 'Which panoramic glass cab uses a roof-mounted StarFire RTK GPS dome to steer hands-free within 2 cm?', correctId: 'gps-autosteer-harvest-cab', distractors: ['feederhouse-chain-conveyor', 'high-flotation-drive-wheels', 'axial-flow-threshing-rotor'] },
    ],
  }),
  buildRobotOrHeavyModel({
    id: 'liebherr-tower-crane', name: 'Hammerhead Tower Crane', brand: 'Liebherr / Potain Class', badge: '70m Jib • Self-Climbing Mast • CAD Hoist',
    desc: 'Skyscraper construction hammerhead tower crane featuring a modular steel lattice mast, hydraulic self-climbing jacking cage, slewing turntable, and trolley hook.',
    primaryHex: 0xeab308,
    partsSpec: [
      ['cruciform-base-ballast', 'Cruciform Steel Foundation Base, Knee Braces & Concrete Ballast', 'Foundation', true, [0, -1.65, 0], 'Cross-shaped heavy box-girder base frame with diagonal knee braces, 4 rail-bogie anchor jacks, and 12 interlocking precast concrete ballast blocks.', 'Before a tower crane climbs 600 feet into the sky, its base is anchored with over 100 tons of concrete ballast blocks!', (g, m) => {
        const concreteMat = mat(0x94a3b8, { roughness: 0.78, metalness: 0.08 });
        // Cruciform heavy box girders + center mast collar + 4 diagonal corner knee braces
        rbox(g, 1.56, 0.12, 0.32, 0.02, m.primary, [-0.35, -0.92, 0]);
        rbox(g, 0.32, 0.12, 1.56, 0.02, m.primary, [-0.35, -0.92, 0]);
        rbox(g, 0.42, 0.16, 0.42, 0.02, m.darkSteel, [-0.35, -0.88, 0]);
        for (const [ox, oz] of [[-0.68, 0], [0.68, 0], [0, -0.68], [0, 0.68]]) {
          cyl(g, 0.09, 0.12, 0.08, 18, m.darkSteel, [-0.35 + ox, -0.98, oz]);
        }
        // 12 Stacked precast concrete ballast slabs with steel lifting eyes
        for (const dx of [-0.32, 0.32]) for (const dz of [-0.32, 0.32]) {
          for (const dy of [-0.80, -0.68, -0.56]) {
            rbox(g, 0.32, 0.10, 0.32, 0.012, concreteMat, [-0.35 + dx, dy, dz]);
          }
          torus(g, 0.025, 0.005, m.chrome, [-0.35 + dx, -0.50, dz]);
        }
      }],
      ['lattice-tower-mast-sections', 'Modular Pin-Connected Steel Lattice Tower Mast, Ladder & Platforms', 'Vertical Mast', true, [-0.95, -0.35, 0], '7-bay square trussed steel mast with K-bracing, splice pin lugs, internal galvanized climbing ladder with safety hoops, and perforated rest platforms.', 'Tower cranes grow taller by themselves—the climbing frame jacks up the top of the crane so it can slide a new mast section into its own neck!', (g, m) => {
        // 4 heavy corner chords + splice joint collars
        for (const dx of [-0.15, 0.15]) for (const dz of [-0.15, 0.15]) {
          cyl(g, 0.022, 0.022, 1.64, 12, m.primary, [-0.35 + dx, -0.10, dz]);
          for (const sy of [-0.52, -0.02, 0.48]) {
            cyl(g, 0.028, 0.028, 0.05, 12, m.darkSteel, [-0.35 + dx, sy, dz]);
          }
        }
        // 7 Lattice bays with horizontal girts & alternating diagonal X/K bracing on all 4 faces
        for (let i = 0; i < 7; i++) {
          const y0 = -0.84 + i * 0.22;
          const ym = y0 + 0.11;
          const dir = i % 2 === 0 ? 1 : -1;
          for (const fz of [-0.15, 0.15]) {
            box(g, 0.32, 0.018, 0.018, m.primary, [-0.35, y0, fz]);
            box(g, 0.37, 0.014, 0.014, m.primary, [-0.35, ym, fz], [0, 0, dir * 0.64]);
          }
          for (const fx of [-0.50, -0.20]) {
            box(g, 0.018, 0.018, 0.32, m.primary, [fx, y0, 0]);
            box(g, 0.014, 0.014, 0.37, m.primary, [fx, ym, 0], [dir * 0.64, 0, 0]);
          }
        }
        // Internal galvanized climbing ladder + safety hoop cages + 3 rest platforms
        for (const lx of [-0.38, -0.32]) cyl(g, 0.006, 0.006, 1.56, 8, m.alu, [lx, -0.10, -0.06]);
        for (let ry = -0.82; ry <= 0.62; ry += 0.07) {
          box(g, 0.065, 0.005, 0.005, m.alu, [-0.35, ry, -0.06]);
          if (Math.round((ry + 0.82) * 100) % 21 === 0) {
            torus(g, 0.055, 0.004, m.alu, [-0.35, ry, -0.01], [Math.PI / 2, 0, 0]);
          }
        }
        for (const py of [-0.52, -0.04, 0.44]) {
          rbox(g, 0.26, 0.012, 0.26, 0.004, m.darkSteel, [-0.35, py, 0]);
        }
      }],
      ['hydraulic-climbing-cage', 'Telescopic Hydraulic Self-Climbing Jacking Cage & Catwalks', 'Self-Erection', true, [-1.35, 0.25, 1.15], 'External wrap-around steel climbing collar with guide rollers, 2 perimeter catwalk decks with handrails, and 160-ton hydraulic jacking ram.', 'One single hydraulic ram on the climbing collar lifts the entire 80-ton upper crane 20 feet at a time as the skyscraper grows!', (g, m) => {
        for (const dy of [-0.02, 0.44]) {
          rbox(g, 0.48, 0.036, 0.48, 0.01, m.primary, [-0.35, dy, 0]);
          rbox(g, 0.62, 0.014, 0.62, 0.006, m.darkSteel, [-0.35, dy - 0.01, 0]);
          // Perimeter tubular safety handrails around both climbing catwalk decks
          tube(g, [[-0.64, dy + 0.09, -0.29], [-0.06, dy + 0.09, -0.29], [-0.06, dy + 0.09, 0.29], [-0.64, dy + 0.09, 0.29], [-0.64, dy + 0.09, -0.29]], 0.007, m.primary);
        }
        for (const dx of [-0.21, 0.21]) for (const dz of [-0.21, 0.21]) {
          cyl(g, 0.022, 0.022, 0.48, 12, m.primary, [-0.35 + dx, 0.21, dz]);
          box(g, 0.44, 0.014, 0.014, m.primary, [-0.35, 0.21, dz], [0, 0, 0.78]);
        }
        // Front telescopic hydraulic jacking cylinder + chrome piston rod
        cyl(g, 0.038, 0.038, 0.30, 16, m.darkSteel, [-0.35, 0.14, 0.26]);
        cyl(g, 0.026, 0.026, 0.28, 16, m.chrome, [-0.35, 0.32, 0.26]);
      }],
      ['slewing-turntable-cab', '360° Slewing Ring Gear, Framed LiCAB Operator Cabin & Anemometer', 'Slewing & Control', false, [-0.35, 1.15, 1.25], 'Triple-roller slewing ring bearing, dual planetary swing drives, machinery walkway, and glass-floor panoramic Liebherr operator cab.', 'The crane operator sits 500 feet in the air looking straight down through a thick glass window between their feet!', (g, m) => {
        cyl(g, 0.24, 0.24, 0.12, 32, m.darkSteel, [-0.35, 0.68, 0]);
        torus(g, 0.245, 0.016, m.chrome, [-0.35, 0.68, 0], [Math.PI / 2, 0, 0]);
        for (const sz of [-0.18, 0.18]) cyl(g, 0.045, 0.045, 0.14, 14, m.primary, [-0.35, 0.76, sz]);
        // Cantilevered LiCAB operator cabin with thin dark-steel mullions, clear glass, seat, dual joysticks & wiper
        const cx = -0.14, cy = 0.72, cz = 0.30;
        rbox(g, 0.40, 0.03, 0.28, 0.01, m.darkSteel, [cx, cy - 0.16, cz]);
        rbox(g, 0.42, 0.04, 0.30, 0.012, m.primary, [cx, cy + 0.17, cz]);
        rbox(g, 0.38, 0.30, 0.26, 0.02, m.glass, [cx + 0.01, cy, cz]);
        for (const px of [cx - 0.17, cx + 0.18]) for (const pz of [cz - 0.12, cz + 0.12]) {
          box(g, 0.022, 0.32, 0.022, m.darkSteel, [px, cy, pz]);
        }
        rbox(g, 0.12, 0.16, 0.12, 0.015, m.darkSteel, [cx - 0.04, cy - 0.04, cz]);
        rbox(g, 0.02, 0.07, 0.09, 0.005, screenMat('dashboard'), [cx + 0.12, cy - 0.02, cz - 0.05], [0, 0.3, 0]);
        // Spinning 3-cup wind anemometer on cab roof
        const anem = new THREE.Group(); anem.position.set(cx + 0.10, cy + 0.24, cz + 0.08); anem.userData.driveAnim = 'fan'; anem.userData.spinAxis = 'y'; g.add(anem);
        cyl(anem, 0.005, 0.005, 0.08, 8, m.chrome, [0, -0.02, 0]);
        for (let a = 0; a < 3; a++) {
          const ang = (a / 3) * Math.PI * 2;
          sphere(anem, 0.016, 10, m.primary, [Math.cos(ang) * 0.04, 0.02, Math.sin(ang) * 0.04]);
        }
      }],
      ['apex-cathead-pendants', 'Pyramidal 4-Chord A-Frame Tower Head (Apex) & Pendant Tie-Rods', 'Tension Suspension', false, [-0.35, 1.75, 0], 'Towering 4-chord lattice A-frame cathead pinnacle with aviation beacon and 4 solid steel tension pendant rods.', 'Just like the towers of a suspension bridge, the A-frame apex transfers the weight of the long boom into steel tension rods!', (g, m) => {
        for (const dx of [-0.12, 0.12]) for (const dz of [-0.12, 0.12]) {
          tube(g, [[-0.35 + dx, 0.74, dz], [-0.35 + dx * 0.28, 1.32, dz * 0.28]], 0.016, m.primary);
        }
        for (const py of [0.90, 1.08, 1.24]) {
          const w = 0.24 * (1 - (py - 0.74) / 0.72);
          box(g, w, 0.014, w, m.primary, [-0.35, py, 0]);
        }
        cyl(g, 0.045, 0.045, 0.24, 16, m.darkSteel, [-0.35, 1.32, 0], [Math.PI / 2, 0, 0]);
        sphere(g, 0.026, 14, 12, emissiveMat(0xef4444, 2.6), [-0.35, 1.40, 0]);
        // Dual forward pendant tension rods (inner & outer jib pick points) + dual rear counter-jib pendant rods
        for (const pz of [-0.07, 0.07]) {
          tube(g, [[-0.35, 1.32, pz], [0.55, 0.96, pz]], 0.009, m.darkSteel);
          tube(g, [[-0.35, 1.32, pz], [1.55, 0.94, pz]], 0.009, m.darkSteel);
          tube(g, [[-0.35, 1.32, pz], [-1.32, 0.80, pz]], 0.011, m.darkSteel);
        }
      }],
      ['horizontal-saddle-jib', '70-Meter 10-Bay Triangular Lattice Saddle Jib Boom', 'Main Boom', true, [1.45, 1.25, 0], '10-bay triangular cross-section lattice boom with twin bottom trolley chords, top compression chord, dense diagonal lacing, and Liebherr sign board.', 'The triangular lattice boom is mostly open air so hurricane-force high-altitude winds blow right through it!', (g, m) => {
        // Twin bottom trolley-rail chords + top apex chord (x = -0.26 to 2.08, length = 2.34)
        for (const dz of [-0.14, 0.14]) cyl(g, 0.018, 0.018, 2.34, 12, m.primary, [0.91, 0.74, dz], [0, 0, Math.PI / 2]);
        cyl(g, 0.020, 0.020, 2.34, 12, m.primary, [0.91, 0.96, 0], [0, 0, Math.PI / 2]);
        // 10 Triangular lattice bays with vertical/inclined struts, diagonal side lacing & bottom cross-ties
        for (let b = 0; b < 10; b++) {
          const x0 = -0.22 + b * 0.225;
          const x1 = x0 + 0.225;
          box(g, 0.014, 0.014, 0.28, m.primary, [x0, 0.74, 0]);
          for (const s of [-1, 1]) {
            tube(g, [[x0, 0.74, s * 0.14], [x0 + 0.112, 0.96, 0], [x1, 0.74, s * 0.14]], 0.009, m.primary);
          }
        }
        // Yellow Liebherr brand sign plate on jib flank + red jib-tip aviation light
        rbox(g, 0.56, 0.09, 0.012, 0.004, m.primary, [0.22, 0.84, 0.105], [-0.52, 0, 0]);
        sphere(g, 0.022, 12, 12, emissiveMat(0xef4444, 2.4), [2.08, 0.98, 0]);
      }],
      ['counter-jib-ballast-blocks', 'Trussed Counter-Jib Deck, Walkways & 7 Concrete Counterweight Slabs', 'Counterbalance', false, [-1.85, 1.15, 0], 'Rear structural lattice counter-jib deck with safety handrails, electrical cabinet, and 7 suspended precast concrete counterweight slabs.', 'The rear counterweights are sized so that when the crane lifts a half-maximum load, the mast experiences zero bending moment!', (g, m) => {
        const concreteMat = mat(0x94a3b8, { roughness: 0.78, metalness: 0.08 });
        for (const dz of [-0.16, 0.16]) {
          box(g, 1.24, 0.042, 0.036, m.primary, [-0.95, 0.74, dz]);
          tube(g, [[-0.40, 0.86, dz], [-1.52, 0.86, dz]], 0.007, m.primary);
        }
        rbox(g, 1.18, 0.014, 0.30, 0.004, m.darkSteel, [-0.95, 0.75, 0]);
        for (let i = 0; i < 7; i++) {
          rbox(g, 0.072, 0.42, 0.28, 0.01, concreteMat, [-0.96 - i * 0.085, 0.72, 0]);
        }
        rbox(g, 0.62, 0.04, 0.32, 0.008, m.primary, [-1.22, 0.93, 0]);
      }],
      ['hoist-winch-trolley-hook', 'Lebus Hoist Winch (CAD), Trolley, 4-Part Hook Block & Steel I-Beam Load', 'Hoisting System', false, [1.75, -0.35, 0], 'Real mechanical CAD hoist gearbox, wire-rope winch drum, traveling saddle trolley, 4-fall sheave hook block, and a rigged structural steel I-beam load.', 'Threading the steel wire rope 4 times between the trolley pulleys and hook block ("4-part reeving") quadruples lifting power!', (g, m) => {
        populateGearboxCad(g, { pos: [-0.68, 0.82, 0], scale: 0.008 });
        cyl(g, 0.065, 0.065, 0.22, 20, m.darkSteel, [-0.68, 0.82, 0], [Math.PI / 2, 0, 0]);
        // Traveling saddle trolley carriage at x = 1.38 + 4-fall vertical wire ropes
        const tx = 1.38;
        rbox(g, 0.28, 0.09, 0.32, 0.018, m.darkSteel, [tx, 0.71, 0]);
        for (const dx of [-0.09, 0.09]) for (const dz of [-0.14, 0.14]) {
          cyl(g, 0.028, 0.028, 0.024, 14, m.chrome, [tx + dx, 0.75, dz], [Math.PI / 2, 0, 0]);
        }
        for (const rx of [-0.04, 0.04]) for (const rz of [-0.035, 0.035]) {
          cyl(g, 0.005, 0.005, 0.92, 8, m.chrome, [tx + rx, 0.23, rz]);
        }
        // 4-Sheave yellow/black hook block + forged double hook + rigged structural red-oxide steel I-Beam load!
        rbox(g, 0.16, 0.20, 0.12, 0.02, m.primary, [tx, -0.24, 0]);
        rbox(g, 0.165, 0.06, 0.125, 0.01, m.darkSteel, [tx, -0.24, 0]);
        torus(g, 0.052, 0.014, m.darkSteel, [tx, -0.38, 0]);
        // Rigging wire slings + wide-flange structural steel I-beam suspended below hook
        const iBeamMat = carPaint(0x991b1b, { roughness: 0.35, metalness: 0.45 });
        for (const sx of [-0.38, 0.38]) {
          tube(g, [[tx, -0.42, 0], [tx + sx, -0.64, 0]], 0.006, m.chrome);
        }
        box(g, 1.12, 0.12, 0.018, iBeamMat, [tx, -0.70, 0]);
        box(g, 1.12, 0.022, 0.14, iBeamMat, [tx, -0.64, 0]);
        box(g, 1.12, 0.022, 0.14, iBeamMat, [tx, -0.76, 0]);
      }],
    ],
    quiz: [
      { q: 'Which hydraulic collar allows a skyscraper tower crane to jack itself up and insert new mast sections?', correctId: 'hydraulic-climbing-cage', distractors: ['cruciform-base-ballast', 'counter-jib-ballast-blocks', 'horizontal-saddle-jib'] },
      { q: 'Which rear deck holds hanging concrete blocks to balance the weight of the long front boom?', correctId: 'counter-jib-ballast-blocks', distractors: ['apex-cathead-pendants', 'slewing-turntable-cab', 'lattice-tower-mast-sections'] },
      { q: 'Which traveling carriage and 4-pulley pulley block rolls out along the boom to lift steel beams?', correctId: 'hoist-winch-trolley-hook', distractors: ['hydraulic-climbing-cage', 'cruciform-base-ballast', 'slewing-turntable-cab'] },
      { q: 'Which 70-meter open triangular lattice main boom lets high-altitude winds blow right through it?', correctId: 'horizontal-saddle-jib', distractors: ['cruciform-base-ballast', 'hydraulic-climbing-cage', 'slewing-turntable-cab'] },
      { q: 'Which cross-shaped ground foundation uses over 100 tons of concrete ballast blocks to anchor the tower crane?', correctId: 'cruciform-base-ballast', distractors: ['apex-cathead-pendants', 'hoist-winch-trolley-hook', 'slewing-turntable-cab'] },
    ],
  }),
];

export const ROCKETS_CATEGORY = {
  id: 'rockets', name: 'Rockets & Launch Vehicles', fullName: 'Orbital Rockets & Moon Launchers', emoji: '🚀', icon: '🚀',
  tagline: 'SpaceX Falcon 9 Block 5 • SpaceX Starship & Super Heavy (33× Raptor) • NASA Apollo Saturn V (Real CAD)',
  models: ROCKET_MODELS,
};
export const ROBOTS_CATEGORY = {
  id: 'robots', name: 'Robots & Mars Rovers', fullName: 'Iron Man Mark 85, Mars Rovers, Industrial Arms & Quadrupeds', emoji: '🤖', icon: '🤖',
  tagline: 'Iron Man Mark LXXXV (85) Nano-Tech Armor • NASA Perseverance Mars Rover (Real CAD) • 6-Axis Industrial Robot Arm • Agile Quadruped Robot Dog',
  models: ROBOT_MODELS,
};
export const CONSTRUCTION_CATEGORY = {
  id: 'construction', name: 'Construction & Farm Machines', fullName: 'Excavators, Combine Harvesters & Tower Cranes', emoji: '🏗️', icon: '🏗️',
  tagline: '36-Ton Hydraulic Crawler Excavator • Rotary Combine Harvester (40-Ft Header) • Hammerhead Self-Climbing Tower Crane',
  models: CONSTRUCTION_MODELS,
};
