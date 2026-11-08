// Wave 2: Popular Everyday Home & Public Infrastructure Machines (`everyday` expansion)
// Models:
// 1. `dyson-v15-vacuum` — Dyson V15 Detect Cordless Cyclone Vacuum (10 parts, 5 quiz questions)
// 2. `french-door-refrigerator` — Stainless French-Door Heat-Pump Refrigerator (10 parts, 5 quiz questions)
// 3. `commercial-escalator` — Heavy-Duty Commercial Escalator (10 parts, 5 quiz questions)

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
  buildCoilSpring,
  buildFinArray,
} from '../materials.js';

function buildApplianceSpecModel(cfg) {
  const primary = carPaint(cfg.primaryHex);
  const accent = carPaint(cfg.accentHex || 0xd97706);
  const darkSteel = brushedMetal(0x1e293b, { metalness: 0.88, roughness: 0.24 });
  const gunmetal = brushedMetal(0x334155, { metalness: 0.86, roughness: 0.22 });
  const stainless = brushedMetal(0xdbe2ea, { metalness: 0.9, roughness: 0.19 });
  const alu = brushedMetal(0xcbd5e1, { metalness: 0.86, roughness: 0.22 });
  const copper = brushedMetal(0xc25e1a, { metalness: 0.93, roughness: 0.16 });
  const brass = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const gold = brushedMetal(0xeab308, { metalness: 0.9, roughness: 0.18 });
  const chrome = chromeMat();
  const white = mat(0xf8fafc, { roughness: 0.2, metalness: 0.08 });
  const matteBlack = mat(0x111827, { roughness: 0.65, metalness: 0.12 });
  const glass = glassMat(0xbae6fd, 0.34);
  const clearPoly = glassMat(0xe2e8f0, 0.28);
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
        gunmetal,
        stainless,
        alu,
        copper,
        brass,
        gold,
        chrome,
        white,
        matteBlack,
        glass,
        clearPoly,
      });
    },
  }));
  return {
    id: cfg.id,
    name: cfg.name,
    brand: cfg.brand,
    badge: cfg.badge,
    desc: cfg.desc,
    cameraPos: cfg.cameraPos || [3.8, 2.2, 4.0],
    parts,
    quiz: cfg.quiz,
  };
}

export const EVERYDAY_APPLIANCE_MODELS = [
  // ==========================================================================
  // 1. DYSON V15 DETECT CORDLESS CYCLONE VACUUM
  // ==========================================================================
  buildApplianceSpecModel({
    id: 'dyson-v15-vacuum',
    name: 'Dyson V15 Detect Cordless Cyclone Vacuum',
    brand: 'Dyson Engineering • Malmesbury UK',
    badge: '125,000 RPM • 100,000 G Cyclones • Green Laser & Piezo',
    desc: 'High-speed cordless cyclone stick vacuum combining 14 scrolled Root Cyclones generating 100,000 G of centrifugal force, a 125,000-RPM Hyperdymium motor, an acoustic piezo dust counter, and a 532nm Fluffy Optic laser cleaner head.',
    primaryHex: 0x6d28d9,
    accentHex: 0xeab308,
    cameraPos: [3.45, 2.05, 3.65],
    partsSpec: [
      [
        'scrolled-root-cyclones',
        '14 Scrolled Conical Root Cyclones (100,000 G Array)',
        'Cyclone Separation',
        false,
        [-0.65, 1.35, 0],
        'Two-tier radial ring of 14 precision-molded conical cyclones with spiral intake scrolls that accelerate dusty air to supersonic-like swirl speeds.',
        'Spinning air inside these 14 narrow cones generates up to 100,000 G of centrifugal force—flinging microscopic pollen and bacteria straight into the bin without clogging a bag!',
        (g, m) => {
          const cycWrap = new THREE.Group();
          cycWrap.position.set(-0.62, 0.62, 0);
          cycWrap.rotation.z = -0.62;
          g.add(cycWrap);

          const dysonTeal = carPaint(0x0d9488);
          const dysonGold = carPaint(0xd97706);
          // Central cyclone manifold plenum
          cyl(cycWrap, 0.16, 0.14, 0.22, 24, m.primary, [0, 0, 0]);
          // Outer ring of 10 + inner ring of 4 scrolled conical cyclones
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const r = 0.165;
            const cx = Math.cos(a) * r;
            const cz = Math.sin(a) * r;
            cone(
              cycWrap,
              0.044,
              0.24,
              18,
              i % 2 === 0 ? dysonGold : dysonTeal,
              [cx, -0.02, cz],
              [Math.sin(a) * 0.22, 0, Math.PI - Math.cos(a) * 0.22],
            );
            torus(cycWrap, 0.042, 0.008, m.primary, [cx * 1.06, 0.09, cz * 1.06], [Math.PI / 2, 0, 0]);
          }
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + 0.4;
            cone(cycWrap, 0.036, 0.18, 16, dysonGold, [Math.cos(a) * 0.085, 0.08, Math.sin(a) * 0.085], [0, 0, Math.PI]);
          }
        },
      ],
      [
        'hyperdymium-digital-motor',
        '125,000-RPM Hyperdymium Digital Motor & Ceramic Impeller',
        'High-Speed Propulsion',
        false,
        [-1.35, 1.05, 0.55],
        'Compact 240-Air-Watt brushless digital motor with a zirconia-ceramic shaft (3× harder than steel), neodymium rotor, copper windings, and 13-blade PEEK impeller.',
        'At 125,000 RPM, the Hyperdymium rotor spins 9 times faster than a Formula 1 race car engine!',
        (g, m) => {
          const mot = new THREE.Group();
          mot.position.set(-0.82, 0.76, 0);
          mot.rotation.z = -0.62;
          g.add(mot);

          cyl(mot, 0.125, 0.135, 0.20, 26, m.gunmetal, [0, 0, 0]);
          // Exposed copper stator coils
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            rbox(mot, 0.032, 0.11, 0.026, 0.006, m.copper, [Math.cos(a) * 0.095, -0.01, Math.sin(a) * 0.095], [0, -a, 0]);
          }
          // Spinning mixed-flow impeller + ceramic shaft
          const imp = new THREE.Group();
          imp.position.set(0, 0.08, 0);
          imp.userData.driveAnim = 'fan';
          imp.userData.spinAxis = 'y';
          mot.add(imp);
          cyl(imp, 0.016, 0.016, 0.22, 14, m.white, [0, -0.05, 0]);
          cone(imp, 0.095, 0.065, 22, m.alu, [0, 0, 0]);
          for (let b = 0; b < 11; b++) {
            const ba = (b / 11) * Math.PI * 2;
            box(imp, 0.006, 0.048, 0.068, m.chrome, [Math.cos(ba) * 0.052, 0, Math.sin(ba) * 0.052], [0.35, -ba, 0]);
          }
        },
      ],
      [
        'clear-polycarbonate-bin-ejector',
        'Clear Polycarbonate Dust Bin & Hygienic Red Silicone Wiper Collar',
        'Debris Containment',
        true,
        [-0.35, 0.95, 1.15],
        'Impact-resistant clear polycarbonate collection cylinder with a sliding red silicone squeegee collar that scrapes fine dust off the shroud in one push.',
        'Polycarbonate is the same shatterproof polymer used in fighter-jet canopies and riot shields so grit spinning at 120 mph never cracks the bin!',
        (g, m) => {
          const bin = new THREE.Group();
          bin.position.set(-0.36, 0.43, 0);
          bin.rotation.z = -0.62;
          g.add(bin);

          cyl(bin, 0.205, 0.205, 0.42, 32, m.clearPoly, [0, 0, 0]);
          torus(bin, 0.206, 0.012, carPaint(0xdc2626), [0, 0.14, 0], [Math.PI / 2, 0, 0]);
          torus(bin, 0.206, 0.010, m.gunmetal, [0, -0.20, 0], [Math.PI / 2, 0, 0]);
          // Bottom hinged trapdoor lid + red release runner
          cyl(bin, 0.202, 0.202, 0.018, 28, m.clearPoly, [0, -0.21, 0]);
          rbox(bin, 0.032, 0.38, 0.028, 0.006, carPaint(0xdc2626), [-0.215, -0.02, 0]);
        },
      ],
      [
        'stainless-cyclone-mesh-shroud',
        'Chemical-Etched Perforated Stainless Shroud & Vortex Finder',
        'Primary Filtration',
        false,
        [-0.45, 0.25, -1.15],
        'Central stainless-steel cylinder perforated with 19,000 acid-etched 250-micron pores that block hair and lint before air enters the 14 fine cyclones.',
        'Instead of punching holes (which leaves burrs that snag hair), chemical photo-etching dissolves smooth microscopic pores through surgical stainless steel!',
        (g, m) => {
          const sh = new THREE.Group();
          sh.position.set(-0.38, 0.44, 0);
          sh.rotation.z = -0.62;
          g.add(sh);

          cyl(sh, 0.118, 0.118, 0.34, 28, m.stainless, [0, 0, 0]);
          for (let r = -3; r <= 3; r++) {
            torus(sh, 0.12, 0.0035, m.darkSteel, [0, r * 0.04, 0], [Math.PI / 2, 0, 0]);
          }
          // Flared red rubber dust skirt baffle
          cone(sh, 0.185, 0.045, 26, carPaint(0xdc2626), [0, -0.14, 0]);
        },
      ],
      [
        'hepa-pleated-post-filter',
        'Twist-Lock Whole-Machine PTFE Pleated HEPA Post-Motor Filter',
        'HEPA Clean Exhaust',
        true,
        [-1.55, 1.35, 0],
        'Rear twist-on purple/teal post-motor filter housing 1.9 meters of folded PTFE HEPA media capturing 99.99% of particles down to 0.1 microns.',
        'Unfolded flat, the pleated HEPA filter sheet inside this palm-sized cap stretches over 6 feet long!',
        (g, m) => {
          const flt = new THREE.Group();
          flt.position.set(-1.02, 0.90, 0);
          flt.rotation.z = -0.62;
          g.add(flt);

          cyl(flt, 0.132, 0.142, 0.19, 28, carPaint(0x0d9488), [0, 0, 0]);
          // 24 visible white PTFE HEPA pleats around recessed crown
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            box(flt, 0.006, 0.13, 0.028, m.white, [Math.cos(a) * 0.125, -0.005, Math.sin(a) * 0.125], [0, -a, 0]);
          }
          cyl(flt, 0.115, 0.128, 0.045, 26, m.primary, [0, 0.10, 0]);
        },
      ],
      [
        'acoustic-piezo-dust-sensor',
        'Inlet Acoustic Piezo Dust Sensor & Rear Particle-Spectrum LCD',
        'Piezo Sensing & UI',
        false,
        [-1.25, 0.55, -0.95],
        'Piezoelectric vibration transducer inside the intake chute that listens to dust collisions 15,000 times per second and graphs 4 particle sizes live on a circular color LCD.',
        'As microscopic dust hits the intake wall, tiny acoustic vibrations tell the computer whether it is sucking up allergens, skin flakes, dust mites, or sugar-sized grit—and boosts suction automatically!',
        (g, m) => {
          const pz = new THREE.Group();
          pz.position.set(-1.08, 0.94, 0);
          pz.rotation.z = -0.62;
          g.add(pz);

          // Rear circular color LCD screen bezel + glowing particle bars
          cyl(pz, 0.095, 0.095, 0.022, 26, m.matteBlack, [0, 0.05, 0]);
          cyl(pz, 0.082, 0.082, 0.025, 26, screenMat('ios'), [0, 0.052, 0]);
          // Acoustic brass piezo sensor ring & flex cable reaching forward to intake throat
          torus(g, 0.058, 0.010, m.brass, [-0.14, 0.26, 0], [0, Math.PI / 2, 0.62]);
          tube(g, [[-0.14, 0.26, 0.05], [-0.55, 0.52, 0.08], [-1.02, 0.88, 0.04]], 0.006, m.copper);
        },
      ],
      [
        'pistol-grip-trigger-chassis',
        'Ergonomic Pistol-Grip Handle, Red Trigger & Return Spring',
        'Controls & Ergonomics',
        true,
        [-0.95, -0.35, 0.85],
        'Sculpted glass-filled polycarbonate handle placing the heavy motor and battery around the wrist pivot for featherweight balance, with an instant-start red trigger.',
        'Placing the motor above your index finger and the battery below your pinky puts the center of gravity right inside your palm!',
        (g, m) => {
          // Angled ergonomic pistol grip connecting motor housing to lower battery mount
          tube(g, [[-0.84, 0.72, 0], [-0.92, 0.44, 0], [-0.86, 0.20, 0]], 0.048, m.gunmetal);
          rbox(g, 0.26, 0.075, 0.12, 0.02, m.gunmetal, [-0.72, 0.18, 0], [0, 0, -0.18]);
          // Red index-finger trigger + helical return spring
          rbox(g, 0.038, 0.095, 0.036, 0.012, carPaint(0xdc2626), [-0.79, 0.56, 0], [0, 0, 0.25]);
          buildCoilSpring(g, [-0.83, 0.56, 0], 0.055, 0.014, 0.003, 5, m.chrome);
        },
      ],
      [
        'seven-cell-click-in-battery',
        '25.2V 7-Cell 21700 Lithium-Ion Click-In Battery Pack & BMS',
        'Energy Storage',
        true,
        [-1.25, -0.95, 0],
        'Swappable 7-cell nickel-cobalt-aluminum lithium-ion battery pack delivering fade-free 25.2V power for up to 60 minutes with active cell-temperature monitoring.',
        'Seven high-drain 21700 cells wired in series supply over 500 watts of peak burst power in Boost mode!',
        (g, m) => {
          const bat = new THREE.Group();
          bat.position.set(-0.74, 0.08, 0);
          bat.rotation.z = -0.18;
          g.add(bat);

          rbox(bat, 0.34, 0.125, 0.165, 0.025, m.gunmetal, [0, 0, 0]);
          // Cutaway showing 7 anodized blue 21700 cylindrical cells + green BMS PCB
          const cellMat = carPaint(0x2563eb);
          for (let i = -3; i <= 3; i++) {
            cyl(bat, 0.021, 0.021, 0.135, 14, cellMat, [i * 0.042, 0.008, 0], [Math.PI / 2, 0, 0]);
          }
          box(bat, 0.28, 0.012, 0.12, pcbMat('#0b5d3b'), [0, 0.055, 0]);
          // Red quick-release battery button + blue LED charge bars
          rbox(bat, 0.042, 0.035, 0.04, 0.008, carPaint(0xdc2626), [0.17, 0.02, 0]);
          box(bat, 0.04, 0.012, 0.168, emissiveMat(0x38bdf8, 0.9), [-0.12, 0, 0]);
        },
      ],
      [
        'anodized-extension-wand',
        'Satin-Gold Anodized Aluminum Reach Wand & Internal Power Bus',
        'Airway & Power Conduit',
        true,
        [0.45, 0.55, 0.95],
        'Extruded aerospace-grade satin-gold aluminum tube with an integrated twin-conductor electrical busbar inside the top rib to power the motorized cleaner head.',
        'Hidden copper rails running down the spine of the aluminum wand carry motor power and laser telemetry without any dangling external wires!',
        (g, m) => {
          const wand = new THREE.Group();
          wand.position.set(0.38, -0.11, 0);
          wand.rotation.z = -0.62;
          g.add(wand);

          cyl(wand, 0.042, 0.042, 1.38, 24, m.gold, [0, 0, 0]);
          // Internal electrical spine rib + red quick-release wand catches at top & bottom
          rbox(wand, 0.024, 1.32, 0.024, 0.006, m.gunmetal, [0.038, 0, 0]);
          for (const yEnd of [-0.66, 0.66]) {
            cyl(wand, 0.050, 0.050, 0.09, 24, m.gunmetal, [0, yEnd, 0]);
            rbox(wand, 0.026, 0.055, 0.038, 0.008, carPaint(0xdc2626), [0.048, yEnd, 0]);
          }
        },
      ],
      [
        'fluffy-optic-laser-head',
        'Fluffy Optic Cleaner Head, Carbon-Fiber Brushbar & 532nm Green Laser',
        'Laser Floor Optics',
        true,
        [1.45, -0.85, 0],
        'Low-profile motorized cleaner head with soft woven nylon + anti-static black carbon-fiber filaments and a precision glass lens projecting a 1.5° green laser blade 7.3mm off the floor.',
        'Human eyes are far more sensitive to 532nm green light than red or blue—grazing the floor at a 1.5° angle makes invisible dust cast dramatic shadows!',
        (g, m) => {
          const head = new THREE.Group();
          head.position.set(1.06, -0.56, 0);
          g.add(head);

          // Articulated swivel ball-neck coupling to wand
          sphere(head, 0.062, 18, 16, m.gunmetal, [-0.14, 0.09, 0]);
          cyl(head, 0.046, 0.048, 0.16, 18, m.clearPoly, [-0.06, 0.05, 0], [0, 0, -0.62]);
          // Transparent curved brushbar shroud + side endcaps
          rbox(head, 0.24, 0.11, 0.74, 0.035, m.gunmetal, [0.06, 0.02, 0]);
          rbox(head, 0.20, 0.095, 0.68, 0.03, m.clearPoly, [0.09, 0.03, 0]);

          // Spinning Fluffy yellow/purple/carbon-fiber spiral brushbar roller
          const roller = new THREE.Group();
          roller.position.set(0.09, -0.01, 0);
          roller.userData.driveAnim = 'fan';
          roller.userData.spinAxis = 'z';
          head.add(roller);
          cyl(roller, 0.052, 0.052, 0.66, 24, carPaint(0xeab308), [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let s = -4; s <= 4; s++) {
            torus(roller, 0.054, 0.007, s % 2 === 0 ? m.primary : m.matteBlack, [0, 0, s * 0.072], [0, 0, 0.35]);
          }

          // Right-side 532nm Green Laser Optic diode pod + grazing emerald light fan cone
          rbox(head, 0.12, 0.055, 0.048, 0.012, m.alu, [0.12, 0.005, 0.375]);
          cyl(head, 0.014, 0.014, 0.02, 14, emissiveMat(0x22c55e, 1.8), [0.18, -0.005, 0.375], [0, 0, Math.PI / 2]);
          const laserMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const laserCone = cone(head, 0.38, 0.72, 24, laserMat, [0.48, -0.052, 0.16], [0, 0, -Math.PI / 2], [0.04, 1, 1.2]);
          laserCone.userData.isLaserBeam = true;
        },
      ],
    ],
    quiz: [
      {
        q: 'Which component uses 14 spiral-scrolled cones to generate 100,000 G of centrifugal force so dust never clogs a bag?',
        correctId: 'scrolled-root-cyclones',
        distractors: ['hepa-pleated-post-filter', 'anodized-extension-wand', 'seven-cell-click-in-battery'],
      },
      {
        q: 'Why does the Fluffy Optic floor head shine a 532-nanometer green laser at a 1.5° grazing angle?',
        correctId: 'fluffy-optic-laser-head',
        distractors: ['clear-polycarbonate-bin-ejector', 'pistol-grip-trigger-chassis', 'hyperdymium-digital-motor'],
      },
      {
        q: 'Which sensor listens to particle vibrations 15,000 times per second to count dust sizes and auto-boost suction?',
        correctId: 'acoustic-piezo-dust-sensor',
        distractors: ['stainless-cyclone-mesh-shroud', 'anodized-extension-wand', 'seven-cell-click-in-battery'],
      },
      {
        q: 'Which brushless digital motor spins a ceramic shaft at 125,000 RPM—nine times faster than a Formula 1 engine?',
        correctId: 'hyperdymium-digital-motor',
        distractors: ['pistol-grip-trigger-chassis', 'hepa-pleated-post-filter', 'clear-polycarbonate-bin-ejector'],
      },
      {
        q: 'Which rear twist-lock cap houses 1.9 meters of folded PTFE media to trap 99.99% of 0.1-micron particles?',
        correctId: 'hepa-pleated-post-filter',
        distractors: ['stainless-cyclone-mesh-shroud', 'anodized-extension-wand', 'fluffy-optic-laser-head'],
      },
    ],
  }),

  // ==========================================================================
  // 2. STAINLESS FRENCH-DOOR HEAT-PUMP REFRIGERATOR
  // ==========================================================================
  buildApplianceSpecModel({
    id: 'french-door-refrigerator',
    name: 'Stainless French-Door Heat-Pump Refrigerator',
    brand: 'Sub-Zero / Bosch / LG Signature Class',
    badge: 'R-600a Vapor-Compression • Dual Evaporator • Thru-Door Ice',
    desc: '28-cubic-foot architectural stainless-steel refrigerator-freezer powered by a closed-loop thermodynamic heat pump: an inverter compressor, rear condenser coils, copper capillary expansion tube, and dual-zone finned evaporator.',
    primaryHex: 0xcbd5e1,
    accentHex: 0x0284c7,
    cameraPos: [3.95, 2.15, 4.25],
    partsSpec: [
      [
        'stainless-insulated-cabinet',
        'Vacuum-Insulated Brushed Stainless Cabinet & Polyurethane Foam Core',
        'Thermal Envelope',
        true,
        [-1.35, 0.25, -0.55],
        'Double-walled steel cabinet injected with closed-cell cyclopentane foam and ultra-thin silica Vacuum Insulation Panels (VIPs) that keep heat out.',
        'Refrigerators do NOT "make cold"—their foam walls trap a sealed box while the heat pump moves heat energy from your food out into your kitchen!',
        (g, m) => {
          const foamGold = mat(0xfef08a, { roughness: 0.72, metalness: 0.05 });
          // Left, Right, Top, Bottom & Rear insulated walls leaving open front & rear bottom compressor bay
          rbox(g, 1.12, 0.08, 1.38, 0.02, m.stainless, [0, 1.14, 0]);
          rbox(g, 1.12, 0.09, 1.38, 0.02, m.darkSteel, [0, -1.04, 0]);
          rbox(g, 1.10, 2.18, 0.08, 0.02, m.stainless, [0, 0.05, -0.65]);
          rbox(g, 1.10, 2.18, 0.08, 0.02, m.stainless, [0, 0.05, 0.65]);
          rbox(g, 0.09, 1.78, 1.34, 0.02, m.stainless, [-0.51, 0.24, 0]);
          // Cutaway golden polyurethane foam core layer + white antimicrobial ABS inner liner
          box(g, 1.02, 2.04, 0.025, foamGold, [0, 0.05, 0.60]);
          box(g, 1.00, 2.02, 0.02, m.white, [0, 0.05, -0.59]);
          box(g, 1.00, 0.05, 1.24, m.white, [0, -0.34, 0]); // Mullion divider between fridge & freezer
        },
      ],
      [
        'french-doors-magnetic-gaskets',
        'Dual Brushed-Stainless French Doors, Articulated Mullion & Magnetic Gaskets',
        'Door Architecture',
        true,
        [1.55, 0.45, 0.55],
        'Twin counter-depth stainless upper doors with clear gallon door bins, tubular bar handles, a folding center mullion strip, and flexible magnetic accordion gaskets.',
        'Inside the soft rubber seal around every fridge door sits a strip magnet that pulls the door airtight AND lets kids push it open easily from inside!',
        (g, m) => {
          for (const side of [-1, 1]) {
            const zc = side * 0.335;
            rbox(g, 0.095, 1.42, 0.65, 0.022, m.stainless, [0.56, 0.41, zc]);
            // Magnetic perimeter gasket + 3 clear gallon door bins inside each door
            rbox(g, 0.025, 1.36, 0.59, 0.012, m.matteBlack, [0.505, 0.41, zc]);
            for (const by of [0.05, 0.42, 0.78]) {
              rbox(g, 0.14, 0.11, 0.50, 0.015, m.glass, [0.43, by, zc]);
            }
            // Tubular brushed chrome vertical handle
            cyl(g, 0.018, 0.018, 0.92, 16, m.chrome, [0.655, 0.42, side * 0.09], [0, 0, 0]);
            for (const hy of [0.02, 0.82]) {
              cyl(g, 0.014, 0.014, 0.06, 12, m.chrome, [0.625, hy, side * 0.09], [0, 0, Math.PI / 2]);
            }
          }
        },
      ],
      [
        'thru-door-ice-water-dispenser',
        'Thru-Door Chilled Water & Crushed/Cubed Ice Dispenser Chute',
        'Ice & Water Delivery',
        true,
        [1.85, 0.55, -0.55],
        'Recessed architectural dispenser bay in the left French door featuring a solenoid water nozzle, insulated ice chute flapper, touch temperature display, and stainless paddle.',
        'A motorized spring-loaded insulated trapdoor snaps shut seconds after ice drops so warm kitchen air never sneaks up the chute to melt the ice bin!',
        (g, m) => {
          rbox(g, 0.12, 0.46, 0.34, 0.018, m.gunmetal, [0.58, 0.46, -0.34]);
          rbox(g, 0.08, 0.30, 0.28, 0.012, m.matteBlack, [0.60, 0.41, -0.34]);
          // Glowing cyan OLED temperature readout ("37°F / 0°F") + stainless trigger paddle + falling ice cubes
          box(g, 0.015, 0.075, 0.26, screenMat('ios'), [0.638, 0.62, -0.34]);
          rbox(g, 0.016, 0.15, 0.11, 0.006, m.chrome, [0.585, 0.42, -0.34], [0, 0, -0.1]);
          cyl(g, 0.018, 0.024, 0.04, 16, m.chrome, [0.61, 0.53, -0.34]);
          for (let c = 0; c < 3; c++) {
            rbox(g, 0.032, 0.032, 0.032, 0.006, m.glass, [0.61, 0.34 + c * 0.048, -0.34 + (c - 1) * 0.025], [0.3 * c, 0.4, 0.2]);
          }
        },
      ],
      [
        'bottom-freezer-drawer-icemaker',
        'Pull-Out Deep Freezer Drawer, Telescoping Rails & Automatic Icemaker',
        'Sub-Zero Storage',
        true,
        [1.45, -0.95, 0],
        'Full-width lower 0°F (-18°C) freezer drawer on heavy-duty telescoping ball-bearing glides with an automatic heated-mold crescent icemaker.',
        'Cold air is denser and heavier than warm air—putting the freezer in a pull-out drawer at the bottom keeps heavy sub-zero air from spilling onto the floor when opened!',
        (g, m) => {
          // Stainless drawer front + wide horizontal handle bar
          rbox(g, 0.095, 0.66, 1.32, 0.022, m.stainless, [0.56, -0.69, 0]);
          cyl(g, 0.018, 0.018, 1.06, 16, m.chrome, [0.655, -0.46, 0], [Math.PI / 2, 0, 0]);
          for (const hz of [-0.46, 0.46]) {
            cyl(g, 0.014, 0.014, 0.06, 12, m.chrome, [0.625, -0.46, hz], [0, 0, Math.PI / 2]);
          }
          // Slide-out wire/frost basket + telescoping steel side rails + automatic ice bin
          rbox(g, 0.82, 0.42, 1.14, 0.02, m.white, [0.06, -0.74, 0]);
          rbox(g, 0.36, 0.16, 0.42, 0.015, m.glass, [0.12, -0.50, -0.32]);
          for (const rz of [-0.58, 0.58]) {
            box(g, 0.86, 0.035, 0.022, m.chrome, [0.08, -0.68, rz]);
          }
        },
      ],
      [
        'variable-inverter-compressor',
        'Variable-Speed Inverter Hermetic Compressor & Rubber Isolation Springs',
        'Vapor-Compression Heart',
        false,
        [-1.55, -1.05, 0.55],
        'Sealed black steel compressor shell in the rear lower machine bay housing a brushless DC inverter motor and scroll/linear piston pumping R-600a refrigerant.',
        'Instead of slamming ON and OFF all day like old fridges, an inverter compressor gently purrs up and down in speed—cutting electricity use by over 35%!',
        (g, m) => {
          const comp = new THREE.Group();
          comp.position.set(-0.36, -0.84, 0.28);
          g.add(comp);

          // Hermetic black steel dome + copper suction/discharge stubs + internal copper stator glimpse
          lathe(
            comp,
            [
              [-0.14, 0.02],
              [-0.13, 0.13],
              [-0.02, 0.145],
              [0.08, 0.14],
              [0.14, 0.09],
              [0.16, 0.01],
            ],
            28,
            m.matteBlack,
            [0, 0, 0],
            [0, 0, 0],
          );
          torus(comp, 0.146, 0.008, m.darkSteel, [0, 0.02, 0], [Math.PI / 2, 0, 0]);
          torus(comp, 0.095, 0.018, m.copper, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
          // 4 vibration-isolating helical steel mounting springs + copper discharge/suction lines
          for (const [sx, sz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]]) {
            buildCoilSpring(comp, [sx, -0.15, sz], 0.05, 0.016, 0.0035, 4, m.chrome);
          }
          tube(comp, [[0.06, 0.13, 0], [0.12, 0.22, -0.08], [0.02, 0.26, -0.26]], 0.012, m.copper);
          tube(comp, [[-0.06, 0.13, 0.04], [-0.14, 0.22, 0.08], [-0.12, 0.42, 0.02]], 0.014, m.copper);
        },
      ],
      [
        'serpentine-condenser-coil-fan',
        'Rear Serpentine Condenser Heat-Rejection Coils & Axial Cooling Fan',
        'Heat Rejection',
        false,
        [-1.65, -0.85, -0.55],
        'Multi-pass finned copper/steel condenser coil and high-airflow axial fan where hot, high-pressure refrigerant gas dumps its heat into the room air and condenses into a warm liquid.',
        'That warm breeze coming from the bottom grille of your fridge is literally the heat that used to be inside your milk, berries, and leftovers!',
        (g, m) => {
          const cond = new THREE.Group();
          cond.position.set(-0.38, -0.84, -0.24);
          g.add(cond);

          // Multi-pass serpentine condenser tube + dense cooling fins
          const pts = [];
          for (let r = 0; r < 6; r++) {
            const y = -0.12 + r * 0.048;
            pts.push([-0.08, y, -0.24], [-0.08, y, 0.18]);
            if (r < 5) pts.push([-0.08, y + 0.024, r % 2 === 0 ? 0.20 : -0.26]);
          }
          tube(cond, pts, 0.009, m.copper, false, 48);
          buildFinArray(cond, [-0.08, 0, -0.03], 18, [0.09, 0.28, 0.003], [0, 0, 0.024], m.darkSteel);

          // Spinning condenser axial fan in shroud
          const fan = new THREE.Group();
          fan.position.set(0.08, 0, 0.02);
          fan.userData.driveAnim = 'fan';
          fan.userData.spinAxis = 'x';
          cond.add(fan);
          cyl(fan, 0.035, 0.035, 0.04, 16, m.matteBlack, [0, 0, 0], [0, 0, Math.PI / 2]);
          for (let b = 0; b < 5; b++) {
            const a = (b / 5) * Math.PI * 2;
            box(fan, 0.008, 0.095, 0.042, m.accent, [0, Math.cos(a) * 0.065, Math.sin(a) * 0.065], [a + 0.45, 0.25, 0]);
          }
          torus(cond, 0.125, 0.012, m.darkSteel, [0.08, 0, 0.02], [0, Math.PI / 2, 0]);
        },
      ],
      [
        'capillary-expansion-filter-drier',
        'Coiled Copper Capillary Expansion Tube & Molecular-Sieve Filter-Drier',
        'Adiabatic Expansion',
        false,
        [-1.45, -0.25, 0.85],
        'Spun-copper desiccant filter-drier feeding a hair-thin 0.7mm coiled copper capillary tube that causes a dramatic pressure drop—flash-chilling the refrigerant to -25°C (-13°F)!',
        'Just like a spray can gets icy cold when you hold down the nozzle, squeezing liquid refrigerant through this tiny copper straw makes its temperature plummet instantly!',
        (g, m) => {
          const cap = new THREE.Group();
          cap.position.set(-0.42, -0.38, 0.36);
          g.add(cap);

          // Spun-copper cigar-shaped molecular-sieve filter-drier
          lathe(
            cap,
            [
              [-0.11, 0.008],
              [-0.08, 0.032],
              [0.06, 0.032],
              [0.10, 0.008],
            ],
            22,
            m.copper,
            [0, -0.14, 0],
            [0, 0, 0],
          );
          // Precision helical copper capillary expansion coil rising up to the evaporator
          buildCoilSpring(cap, [0, 0.08, 0], 0.28, 0.036, 0.0055, 11, m.copper);
          tube(cap, [[0, 0.22, 0], [0.06, 0.32, -0.18], [0.08, 0.38, -0.34]], 0.007, m.copper);
        },
      ],
      [
        'finned-evaporator-defrost-heater',
        'Multi-Fin Aluminum Evaporator Coil & Calrod Auto-Defrost Heater',
        'Heat Absorption',
        false,
        [-1.15, 0.25, 0],
        'Hidden behind the rear interior wall: icy-cold refrigerant boils inside aluminum-finned tubes to absorb food heat, while a glowing calrod heater melts frost automatically twice a day.',
        'That "frost-free" magic inside modern freezers comes from a small electric heater rod under the evaporator that melts ice crystals into a hidden evaporation pan!',
        (g, m) => {
          const evap = new THREE.Group();
          evap.position.set(-0.36, -0.05, 0);
          g.add(evap);

          // Dense aluminum fin bank + copper return U-bends on both ends + frost-blue sheen
          buildFinArray(evap, [0, 0, 0], 26, [0.08, 0.46, 0.003], [0, 0, 0.034], m.alu);
          for (let y = -0.18; y <= 0.18; y += 0.072) {
            cyl(evap, 0.011, 0.011, 0.92, 12, m.copper, [0, y, 0], [Math.PI / 2, 0, 0]);
            torus(evap, 0.036, 0.010, m.copper, [0, y, 0.46], [0, Math.PI / 2, 0]);
          }
          // Lower Calrod defrost heater U-tube with subtle warm amber glow
          tube(
            evap,
            [
              [0.03, -0.24, -0.44],
              [0.03, -0.26, 0],
              [0.03, -0.24, 0.44],
            ],
            0.008,
            emissiveMat(0xf97316, 0.55),
          );
        },
      ],
      [
        'multi-airflow-damper-tower',
        'Twin-Cooling Evaporator Blower, Multi-Airflow Tower & Carbon Water Filter',
        'Airflow & Filtration',
        false,
        [-0.75, 0.95, -0.85],
        'Variable-speed centrifugal blower fan behind a stainless multi-vent airflow column and a quarter-turn coconut-shell activated-carbon water filter cartridge.',
        'Activated carbon inside the water filter is so porous that a single gram of carbon granules has the surface area of two tennis courts—trapping chlorine and lead!',
        (g, m) => {
          // Brushed stainless interior rear Multi-Airflow vent tower + louvered vents
          rbox(g, 0.06, 1.18, 0.36, 0.015, m.stainless, [-0.26, 0.46, 0]);
          for (let vy = 0.04; vy <= 0.92; vy += 0.17) {
            for (const vz of [-0.10, 0.10]) {
              box(g, 0.066, 0.026, 0.09, m.accent, [-0.26, vy, vz]);
            }
          }
          // Spinning evaporator circulation fan
          const blower = new THREE.Group();
          blower.position.set(-0.30, 0.68, 0);
          blower.userData.driveAnim = 'fan';
          blower.userData.spinAxis = 'x';
          g.add(blower);
          cyl(blower, 0.095, 0.095, 0.028, 22, m.accent, [0, 0, 0], [0, 0, Math.PI / 2]);
          // Upper-right twist-in cylindrical white/blue Water Filter cartridge
          cyl(g, 0.048, 0.048, 0.28, 20, m.white, [0.05, 1.01, 0.48], [0, 0, Math.PI / 2]);
          cyl(g, 0.052, 0.052, 0.05, 20, m.accent, [0.18, 1.01, 0.48], [0, 0, Math.PI / 2]);
        },
      ],
      [
        'tempered-shelves-crisper-pcb',
        'Cantilevered Tempered Glass Shelves, Humidity Crispers & Inverter Control PCB',
        'Interior & Smart Controls',
        false,
        [0.45, 1.25, 0],
        'Spill-proof tempered glass shelves, twin humidity-sealed produce crisper drawers, theatre LED lighting strips, and the top-mounted main Inverter microcontroller PCB.',
        'Produce crisper drawers use microscopic membrane vents: leafy greens stay crisp at 90% humidity, while apples and pears last longer at lower humidity so ethylene gas escapes!',
        (g, m) => {
          // 3 Tempered glass shelves with brushed-chrome front trim
          for (const sy of [0.22, 0.54, 0.84]) {
            rbox(g, 0.72, 0.018, 1.14, 0.005, m.glass, [0.08, sy, 0]);
            box(g, 0.024, 0.024, 1.14, m.chrome, [0.44, sy, 0]);
          }
          // Twin clear Humidity Crisper Drawers above the mullion
          for (const cz of [-0.28, 0.28]) {
            rbox(g, 0.68, 0.22, 0.52, 0.015, m.glass, [0.08, -0.14, cz]);
            box(g, 0.025, 0.04, 0.50, m.stainless, [0.42, -0.05, cz]);
          }
          // Top Inverter Control PCB enclosure + green circuit board + interior LED light bar
          rbox(g, 0.42, 0.04, 0.56, 0.01, m.gunmetal, [-0.18, 1.20, 0]);
          box(g, 0.36, 0.015, 0.48, pcbMat('#0b5d3b'), [-0.18, 1.222, 0]);
          box(g, 0.68, 0.014, 0.06, emissiveMat(0xf8fafc, 0.95), [0.10, 1.09, 0]);
        },
      ],
    ],
    quiz: [
      {
        q: 'Which sealed rear-bottom pump compresses refrigerant gas and varies its speed smoothly instead of slamming on and off?',
        correctId: 'variable-inverter-compressor',
        distractors: ['thru-door-ice-water-dispenser', 'french-doors-magnetic-gaskets', 'tempered-shelves-crisper-pcb'],
      },
      {
        q: 'Which hair-thin coiled copper tube drops the liquid refrigerant pressure so fast that it flash-chills to -25°C?',
        correctId: 'capillary-expansion-filter-drier',
        distractors: ['stainless-insulated-cabinet', 'bottom-freezer-drawer-icemaker', 'multi-airflow-damper-tower'],
      },
      {
        q: 'Where does hot refrigerant gas dump the heat it pulled out of your food back into the kitchen air?',
        correctId: 'serpentine-condenser-coil-fan',
        distractors: ['thru-door-ice-water-dispenser', 'tempered-shelves-crisper-pcb', 'french-doors-magnetic-gaskets'],
      },
      {
        q: 'Which hidden finned heat exchanger carries a glowing defrost rod to prevent frost buildup inside the cabinet?',
        correctId: 'finned-evaporator-defrost-heater',
        distractors: ['bottom-freezer-drawer-icemaker', 'french-doors-magnetic-gaskets', 'thru-door-ice-water-dispenser'],
      },
      {
        q: 'Why do modern French-door refrigerators place the pull-out 0°F freezer drawer at the very bottom?',
        correctId: 'bottom-freezer-drawer-icemaker',
        distractors: ['serpentine-condenser-coil-fan', 'capillary-expansion-filter-drier', 'stainless-insulated-cabinet'],
      },
    ],
  }),

  // ==========================================================================
  // 3. HEAVY-DUTY COMMERCIAL ESCALATOR
  // ==========================================================================
  buildApplianceSpecModel({
    id: 'commercial-escalator',
    name: 'Heavy-Duty Commercial Escalator',
    brand: 'Otis NCE / Schindler 9300 Transit Class',
    badge: '30° Incline • Endless Step-Chain Loop • 9,000 Pax/Hr',
    desc: 'Airport and metro transit heavy-duty 30°-incline escalator revealing the welded steel Warren truss, 100-HP upper bull-gear drive, endless roller step chains, die-cast yellow-bordered aluminum steps, flattening guide tracks, and toothed safety combplates.',
    primaryHex: 0x334155,
    accentHex: 0xfacc15,
    cameraPos: [4.35, 2.35, 4.55],
    partsSpec: [
      [
        'welded-structural-steel-truss',
        '30° Inclined Welded Structural Steel Warren Truss & Landing Pits',
        'Structural Bridge',
        false,
        [0, -1.45, 0],
        'Self-supporting structural steel bridge spanning between building floors with lower tension-pit and upper drive-machine pit bays.',
        'An escalator is literally a hollow steel bridge hung between two floors—all the motors, gears, and return steps hide inside the truss!',
        (g, m) => {
          // Lower horizontal pit, 30° inclined center span, and upper horizontal machine pit chords
          const trussPts = [
            [-2.05, -0.88, -0.52],
            [-1.25, -0.88, -0.52],
            [1.15, 0.50, -0.52],
            [2.05, 0.50, -0.52],
          ];
          for (const z of [-0.52, 0.52]) {
            const lower = trussPts.map(([x, y]) => [x, y, z]);
            const upper = trussPts.map(([x, y]) => [x, y + 0.42, z]);
            tube(g, lower, 0.028, m.darkSteel, false, 24);
            tube(g, upper, 0.028, m.darkSteel, false, 24);
            // Diagonal Warren web struts along incline & pits
            for (let i = 0; i < 8; i++) {
              const t0 = i / 8;
              const t1 = (i + 1) / 8;
              const x0 = -1.95 + t0 * 3.9;
              const x1 = -1.95 + t1 * 3.9;
              const yBase = (x) =>
                x < -1.25 ? -0.88 : x > 1.15 ? 0.50 : -0.88 + ((x + 1.25) / 2.4) * 1.38;
              const y0 = yBase(x0);
              const y1 = yBase(x1);
              tube(
                g,
                [
                  [x0, i % 2 === 0 ? y0 : y0 + 0.42, z],
                  [x1, i % 2 === 0 ? y1 + 0.42 : y1, z],
                ],
                0.016,
                m.gunmetal,
                false,
                6,
              );
            }
          }
          // Cross-tie transoms & oil drip pan floor
          for (const x of [-1.95, -1.25, -0.45, 0.35, 1.15, 1.95]) {
            const yb = x < -1.25 ? -0.88 : x > 1.15 ? 0.50 : -0.88 + ((x + 1.25) / 2.4) * 1.38;
            box(g, 0.05, 0.04, 1.06, m.darkSteel, [x, yb, 0]);
          }
        },
      ],
      [
        'traction-drive-bull-gear',
        '100-HP AC Drive Motor, Helical Gearbox, Brake Drum & Duplex Bull Chain',
        'Upper Pit Drive',
        false,
        [1.75, 1.15, -0.95],
        'Heavy-duty electric motor and right-angle helical speed reducer in the upper landing pit driving the main step-chain shaft via a duplex roller chain.',
        'Transit escalators carry fail-safe electromagnetic pawl brakes on both the motor and main drive shaft so a fully loaded staircase never rolls backward!',
        (g, m) => {
          const drv = new THREE.Group();
          drv.position.set(1.68, 0.68, 0);
          g.add(drv);

          // Finned blue/teal 100-HP AC induction motor + helical cast-iron gearbox + yellow brake caliper
          cyl(drv, 0.14, 0.14, 0.42, 24, carPaint(0x0284c7), [0.12, 0.02, -0.18], [Math.PI / 2, 0, 0]);
          buildFinArray(drv, [0.12, 0.02, -0.18], 10, [0.30, 0.006, 0.32], [0, 0.024, 0], m.alu);
          rbox(drv, 0.28, 0.26, 0.28, 0.025, m.gunmetal, [-0.14, 0.02, -0.18]);
          // Spinning brake drum & flywheel
          const fw = new THREE.Group();
          fw.position.set(0.12, 0.02, 0.10);
          fw.userData.driveAnim = 'fan';
          fw.userData.spinAxis = 'z';
          drv.add(fw);
          cyl(fw, 0.15, 0.15, 0.06, 24, m.stainless, [0, 0, 0], [Math.PI / 2, 0, 0]);
          rbox(drv, 0.09, 0.12, 0.09, 0.012, m.accent, [0.12, 0.15, 0.10]);
          // Duplex roller drive chain connecting gearbox output to main step-axle sprocket
          tube(
            drv,
            [
              [-0.14, 0.11, 0.02],
              [-0.44, 0.14, 0.02],
              [-0.44, -0.04, 0.02],
              [-0.14, -0.07, 0.02],
            ],
            0.018,
            m.brass,
            true,
            24,
          );
        },
      ],
      [
        'turnaround-sprockets-tension-carriage',
        'Toothed Upper Main Drive Sprockets & Lower Spring-Tensioned D-Carriage',
        'Chain Sprockets & Tension',
        false,
        [-1.65, -0.65, -1.05],
        'Twin 32-tooth upper drive sprockets on a solid forged axle and a spring-loaded lower turnaround carriage that keeps the endless chains taut as they warm up.',
        'At the bottom pit, heavy coil springs push the turnaround track outward—if a chain stretches or snaps by even a few millimeters, limit switches cut power instantly!',
        (g, m) => {
          // Upper main sprocket shaft + port/starboard toothed bull sprockets
          const upShaft = new THREE.Group();
          upShaft.position.set(1.22, 0.72, 0);
          upShaft.userData.driveAnim = 'fan';
          upShaft.userData.spinAxis = 'z';
          g.add(upShaft);
          cyl(upShaft, 0.036, 0.036, 0.96, 18, m.stainless, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (const z of [-0.42, 0.42]) {
            cyl(upShaft, 0.21, 0.21, 0.032, 28, m.accent, [0, 0, z], [Math.PI / 2, 0, 0]);
            cyl(upShaft, 0.15, 0.15, 0.042, 20, m.darkSteel, [0, 0, z], [Math.PI / 2, 0, 0]);
          }

          // Lower turnaround sprocket shaft + dual helical tension springs
          const loShaft = new THREE.Group();
          loShaft.position.set(-1.38, -0.66, 0);
          loShaft.userData.driveAnim = 'fan';
          loShaft.userData.spinAxis = 'z';
          g.add(loShaft);
          cyl(loShaft, 0.034, 0.034, 0.94, 18, m.stainless, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (const z of [-0.42, 0.42]) {
            cyl(loShaft, 0.19, 0.19, 0.03, 26, m.accent, [0, 0, z], [Math.PI / 2, 0, 0]);
            buildCoilSpring(g, [-1.68, -0.66, z], 0.34, 0.036, 0.007, 7, m.chrome);
          }
        },
      ],
      [
        'dual-endless-step-chains',
        'Port & Starboard Endless Heavy-Duty Roller Step Chains',
        'Step-Chain Drive',
        false,
        [0, 0.45, -1.25],
        'Two synchronized endless steel roller chains linking every aluminum step axle in a continuous loop up the passenger incline and upside-down back down the return belly.',
        'Metro station escalator step chains have a breaking strength over 60,000 pounds—strong enough to lift five adult elephants!',
        (g, m) => {
          for (const z of [-0.42, 0.42]) {
            const loopPts = [
              [-1.42, -0.48, z],
              [-1.12, -0.48, z],
              [1.06, 0.88, z],
              [1.36, 0.88, z],
              [1.42, 0.68, z],
              [1.12, 0.56, z],
              [-1.08, -0.82, z],
              [-1.42, -0.82, z],
            ];
            tube(g, loopPts, 0.020, m.gunmetal, true, 56);
            // Polyurethane chain guide rollers along upper incline
            for (let r = 0; r < 9; r++) {
              const t = r / 8;
              const rx = -1.05 + t * 2.08;
              const ry = -0.46 + t * 1.32;
              cyl(g, 0.028, 0.028, 0.024, 14, carPaint(0xdc2626), [rx, ry, z], [Math.PI / 2, 0, 0]);
            }
          }
        },
      ],
      [
        'cleated-aluminum-steps-loop',
        'Die-Cast Grooved Aluminum Steps with Safety-Yellow Demarcation Borders',
        'Moving Staircase',
        false,
        [0, 1.35, 0],
        'One-piece pressure die-cast aluminum steps featuring interlocking tread cleats, curved grooved risers, and bright yellow polymer perimeter strips that cue riders away from edges.',
        'Escalator steps flatten into a smooth moving sidewalk for 2 to 3 full step-lengths at both landings so passengers have time to plant their feet securely!',
        (g, m) => {
          const stepCount = 16;
          for (let i = 0; i < stepCount; i++) {
            const u = i / (stepCount - 1);
            const sx = -1.32 + u * 2.58;
            let sy = -0.44;
            if (sx > -1.05 && sx < 0.98) {
              sy = -0.44 + ((sx + 1.05) / 2.03) * 1.32;
            } else if (sx >= 0.98) {
              sy = 0.88;
            }
            const stepGrp = new THREE.Group();
            stepGrp.position.set(sx, sy, 0);
            stepGrp.userData.escalatorStepU = u;
            g.add(stepGrp);

            // Die-cast cleated horizontal tread + curved vertical riser + yellow safety border
            rbox(stepGrp, 0.165, 0.026, 0.74, 0.005, m.alu, [0, 0.02, 0]);
            rbox(stepGrp, 0.024, 0.088, 0.74, 0.004, m.gunmetal, [-0.072, -0.028, 0]);
            // Yellow perimeter demarcation strips along front edge & left/right sides
            box(stepGrp, 0.168, 0.006, 0.024, m.accent, [0, 0.034, -0.358]);
            box(stepGrp, 0.168, 0.006, 0.024, m.accent, [0, 0.034, 0.358]);
            box(stepGrp, 0.018, 0.006, 0.74, m.accent, [-0.075, 0.034, 0]);
          }
          // 5 inverted return steps visible in the lower truss belly cutaway
          for (let r = 0; r < 5; r++) {
            const t = r / 4;
            const rx = -0.85 + t * 1.75;
            const ry = -0.76 + t * 1.12;
            rbox(g, 0.16, 0.022, 0.72, 0.004, m.gunmetal, [rx, ry, 0], [0, 0, 0.56]);
          }
        },
      ],
      [
        'dual-track-guide-rail-system',
        'Dual-Plane Step-Flattening Steel Guide Tracks & Trailer Rollers',
        'Kinematic Cam Tracks',
        false,
        [0, -0.45, 1.25],
        'Separate steel guide rails for each step’s front chain wheels and rear trailer wheels—diverging in height on the incline to raise risers, then converging flat at landings!',
        'No motor tilts the steps! Each step has 4 wheels riding on two offset steel tracks—changing the gap between the two tracks automatically forms or flattens the stairs!',
        (g, m) => {
          const trackCyan = carPaint(0x0284c7);
          for (const z of [-0.39, 0.39]) {
            // Front main wheel track vs offset rear trailer wheel track
            tube(
              g,
              [
                [-1.38, -0.46, z],
                [-1.04, -0.46, z],
                [0.98, 0.86, z],
                [1.36, 0.86, z],
              ],
              0.012,
              m.chrome,
              false,
              28,
            );
            tube(
              g,
              [
                [-1.38, -0.49, z * 0.92],
                [-1.02, -0.54, z * 0.92],
                [0.96, 0.78, z * 0.92],
                [1.36, 0.85, z * 0.92],
              ],
              0.012,
              trackCyan,
              false,
              28,
            );
          }
        },
      ],
      [
        'toothed-combplates-landing-decks',
        'Top & Bottom Toothed Aluminum Combplates & Landing Floor Plates',
        'Landing Safety',
        true,
        [0.65, 1.05, 0.95],
        'Grooved stainless landing floor covers ending in replaceable safety-yellow aluminum comb teeth that mesh into the cleated step grooves within 1.5 millimeters.',
        'Every combplate floats on spring-loaded microswitches—if a shoelace or pebble wedges upward or inward against the yellow teeth, the escalator stops immediately!',
        (g, m) => {
          // Bottom landing deck + yellow toothed combplate
          rbox(g, 0.58, 0.032, 0.88, 0.008, m.stainless, [-1.74, -0.41, 0]);
          box(g, 0.09, 0.022, 0.76, m.accent, [-1.42, -0.402, 0]);
          // Top landing deck + yellow toothed combplate
          rbox(g, 0.64, 0.032, 0.88, 0.008, m.stainless, [1.72, 0.91, 0]);
          box(g, 0.09, 0.022, 0.76, m.accent, [1.38, 0.916, 0]);
          for (let t = -8; t <= 8; t++) {
            box(g, 0.04, 0.01, 0.014, m.darkSteel, [-1.39, -0.39, t * 0.042]);
            box(g, 0.04, 0.01, 0.014, m.darkSteel, [1.35, 0.928, t * 0.042]);
          }
        },
      ],
      [
        'synchronized-moving-handrails',
        'Synchronized Vulcanized Rubber Moving Handrails & Friction Drive Sheaves',
        'Handrail Drive',
        true,
        [0, 1.45, 0.85],
        'Twin continuous steel-cord-reinforced synthetic rubber loops wrapped around curved newel ends and driven by pressurized friction sheaves geared directly to the main step shaft.',
        'Handrails are geared to run 0% to 2% faster than the steps so a rider’s hand never drifts backward behind their body on the way up!',
        (g, m) => {
          for (const z of [-0.47, 0.47]) {
            const hrPts = [
              [-1.78, 0.16, z],
              [-1.12, 0.16, z],
              [1.04, 1.48, z],
              [1.76, 1.48, z],
              [1.92, 1.32, z],
              [1.76, 1.14, z],
              [1.08, 1.10, z],
              [-1.08, -0.22, z],
              [-1.78, -0.22, z],
              [-1.94, -0.03, z],
            ];
            tube(g, hrPts, 0.030, m.matteBlack, true, 64);
            // Internal friction drive pulley wheel
            cyl(g, 0.13, 0.13, 0.035, 20, m.brass, [0.85, 0.88, z], [Math.PI / 2, 0, 0]);
          }
        },
      ],
      [
        'tempered-glass-balustrades-brushes',
        '10mm Tempered Glass Balustrades, LED Decking & Skirt Deflector Brushes',
        'Balustrade & Skirt Safety',
        true,
        [0, 0.95, 1.45],
        'Frameless structural safety-glass side panels, brushed stainless inner/outer decking, continuous cyan LED handrail illumination, and angled nylon skirt brushes.',
        'Those stiff black brushes along the bottom sides aren’t for polishing shoes—they gently nudge soft rubber clogs and coat hems away from the narrow gap beside moving steps!',
        (g, m) => {
          for (const z of [-0.47, 0.47]) {
            // Sloped glass balustrade polygon via extrudeProfile
            const glassPts = [
              [-1.80, -0.36],
              [-1.10, -0.36],
              [1.06, 0.96],
              [1.80, 0.96],
              [1.80, 1.44],
              [1.04, 1.44],
              [-1.12, 0.12],
              [-1.80, 0.12],
            ];
            extrudeProfile(g, glassPts, 0.016, m.glass, [0, 0, z], [0, 0, 0], 0.002);
            // Brushed stainless skirt panel + glowing cyan LED guide strip + black nylon skirt brush
            tube(g, [[-1.78, -0.38, z], [-1.10, -0.38, z], [1.06, 0.94, z], [1.78, 0.94, z]], 0.022, m.stainless, false, 24);
            tube(g, [[-1.74, 0.11, z], [-1.10, 0.11, z], [1.04, 1.43, z], [1.74, 1.43, z]], 0.008, emissiveMat(0x38bdf8, 0.85), false, 24);
            const zIn = z > 0 ? z - 0.045 : z + 0.045;
            tube(g, [[-1.40, -0.36, zIn], [-1.06, -0.36, zIn], [1.02, 0.92, zIn], [1.38, 0.92, zIn]], 0.014, m.matteBlack, false, 24);
          }
        },
      ],
      [
        'vfd-controller-safety-sensors',
        'Regenerative VFD Controller, Infrared Rider Beams & Auto Chain Lubricator',
        'Smart Safety & Regen',
        false,
        [-1.85, -0.25, 0.95],
        'Variable-Frequency Drive (VFD) PLC cabinet that creeps smoothly when empty, wakes via infrared entry bollards, regenerates electricity on crowded Down runs, and oils chains automatically.',
        'When a crowded metro escalator runs DOWNWARD, the weight of passengers spins the motor into a generator—feeding clean electricity back into the station lighting grid!',
        (g, m) => {
          // Lower pit PLC / VFD cabinet with green PCB + red E-stop button bollards at entry
          rbox(g, 0.34, 0.28, 0.32, 0.018, m.gunmetal, [-1.82, -0.68, 0.22]);
          box(g, 0.28, 0.014, 0.24, pcbMat('#0b5d3b'), [-1.82, -0.53, 0.22]);
          // Automatic oil reservoir & copper drip lines to step chains
          cyl(g, 0.055, 0.055, 0.18, 18, m.clearPoly, [1.85, 0.68, 0.28]);
          cyl(g, 0.050, 0.050, 0.11, 18, carPaint(0xeab308), [1.85, 0.65, 0.28]);
          // Entry stainless infrared sensor posts with red Emergency-Stop buttons & green GO arrows
          for (const z of [-0.47, 0.47]) {
            cyl(g, 0.032, 0.036, 0.32, 16, m.stainless, [-1.96, -0.24, z]);
            sphere(g, 0.018, 12, 10, emissiveMat(0x22c55e, 1.1), [-1.99, -0.16, z]);
            cyl(g, 0.016, 0.016, 0.02, 12, carPaint(0xdc2626), [-1.96, -0.07, z]);
          }
        },
      ],
    ],
    quiz: [
      {
        q: 'What makes escalator steps rise into stairs on the incline and flatten into a smooth platform at the top and bottom?',
        correctId: 'dual-track-guide-rail-system',
        distractors: ['tempered-glass-balustrades-brushes', 'synchronized-moving-handrails', 'vfd-controller-safety-sensors'],
      },
      {
        q: 'Which safety-yellow toothed aluminum landing edges immediately cut power if a shoelace or foreign object snags?',
        correctId: 'toothed-combplates-landing-decks',
        distractors: ['welded-structural-steel-truss', 'dual-endless-step-chains', 'traction-drive-bull-gear'],
      },
      {
        q: 'Why do stiff black nylon brushes line the lower inner sides right next to the moving steps?',
        correctId: 'tempered-glass-balustrades-brushes',
        distractors: ['turnaround-sprockets-tension-carriage', 'traction-drive-bull-gear', 'dual-endless-step-chains'],
      },
      {
        q: 'How does a crowded downward-moving escalator actually save electricity inside a subway station?',
        correctId: 'vfd-controller-safety-sensors',
        distractors: ['cleated-aluminum-steps-loop', 'toothed-combplates-landing-decks', 'synchronized-moving-handrails'],
      },
      {
        q: 'Which spring-loaded assembly in the lower pit keeps the twin step chains taut and trips a switch if a chain slacks?',
        correctId: 'turnaround-sprockets-tension-carriage',
        distractors: ['synchronized-moving-handrails', 'tempered-glass-balustrades-brushes', 'toothed-combplates-landing-decks'],
      },
    ],
  }),
];
