// High-Speed Trains (`train`) & Space Station / Spacecraft (`space`) Models for Inside Out Studio.
// The multi-car Japanese & Chinese bullet trains (N700S, CR400AF Fuxing, SCMaglev L0) live in
// ./bullet_trains.js and are re-exported here so catalog.js keeps a single import.
import * as THREE from '../../vendor/three.module.js';
import {
  mat, brushedMetal, chromeMat, glassMat, screenMat, solarGridTexture,
  box, rbox, cyl, sphere, torus, cone, lathe, extrudeProfile,
} from '../materials.js';
import { populateIssCad, populateShuttleStackCad } from '../cad_loader.js';
import { TRAIN_MODELS } from './bullet_trains.js';

export { TRAIN_MODELS };

function buildIssModel() {
  const alu = brushedMetal(0xd8dee9, { metalness: 0.85, roughness: 0.22 });
  const kapton = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const whiteMod = mat(0xf8fafc, { roughness: 0.28, metalness: 0.16 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: solarGridTexture(), metalness: 0.72, roughness: 0.18 });
  const parts = [
    { id: 'integrated-truss-backbone', name: '109-Meter Integrated Truss Structure (S0–S6 / P1–P6)', category: 'Structural Backbone', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'NASA CAD girder backbone supporting solar alpha rotary joints, utility cable trays, and Mobile Transporter rails.',
      funFact: 'The ISS truss backbone is 109 meters (357 feet) long—literally as wide as an entire American football field including the end zones!',
      build(g) { populateIssCad(g, { zone: 'truss' }); box(g, 0.22, 0.22, 3.8, alu, [0, 0.28, 0]); for (let z = -1.7; z <= 1.7; z += 0.34) torus(g, 0.16, 0.015, kapton, [0, 0.28, z], [0, 0, 0]); } },
    { id: 'solar-array-wings', name: '8 Photovoltaic Solar Array Wings (SAW) & iROSA Blankets', category: 'Electrical Power', isOuter: true, explodeOffset: [0, 0.45, 2.25],
      desc: 'NASA CAD sun-tracking double-wing solar blankets generating up to 240 kW of orbital DC power.',
      funFact: 'Over a quarter-million silicon solar cells track the Sun through a 360-degree Alpha Rotary Joint on every 90-minute orbit!',
      build(g) { populateIssCad(g, { zone: 'solar-wings' }); for (const z of [-1.65, -1.25, 1.25, 1.65]) for (const x of [-0.95, 0.95]) box(g, 1.35, 0.02, 0.32, solarMat, [x, 0.28, z]); } },
    { id: 'eatcs-thermal-radiators', name: 'Ammonia Thermal Control Radiators (EATCS)', category: 'Thermal Control', isOuter: true, explodeOffset: [-1.35, -0.85, 0],
      desc: 'NASA CAD accordion-folding white radiator panels that reject waste cabin and electronics heat into deep space.',
      funFact: 'Without air in space to carry heat away, the ISS circulates liquid ammonia through giant white wings to radiate heat as infrared light!',
      build(g) { populateIssCad(g, { zone: 'radiators' }); for (const z of [-0.75, 0.75]) box(g, 0.85, 0.025, 0.28, whiteMod, [-0.55, 0.12, z], [0.35, 0, 0]); } },
    { id: 'us-destiny-harmony-modules', name: 'US Orbital Segment (Destiny Lab, Harmony & Unity Nodes)', category: 'Pressurized Habitation', isOuter: true, explodeOffset: [1.55, 0.15, 0],
      desc: 'NASA CAD pressurized cylindrical microgravity laboratory modules shielded by Whipple micrometeoroid bumpers.',
      funFact: 'Destiny’s aluminum walls are wrapped in Kevlar fabric—the same material used in bulletproof vests—to stop tiny space debris!',
      build(g) { populateIssCad(g, { zone: 'us-modules' }); cyl(g, 0.22, 0.22, 1.25, 24, whiteMod, [0.55, 0, 0], [0, 0, Math.PI / 2]); } },
    { id: 'zvezda-zarya-russian-segment', name: 'Russian Orbital Segment (Zvezda Service & Zarya FGB)', category: 'Propulsion & Life Support', isOuter: true, explodeOffset: [-1.65, 0.15, 0],
      desc: 'NASA CAD aft propulsion, attitude thrusters, Elektron oxygen generator, and crew quarters modules.',
      funFact: 'Zarya ("Sunrise") was the very first piece of the ISS launched into orbit in November 1998!',
      build(g) { populateIssCad(g, { zone: 'russian-modules' }); cyl(g, 0.2, 0.24, 1.15, 24, mat(0xd6d3d1), [-0.65, 0, 0], [0, 0, Math.PI / 2]); } },
    { id: 'columbus-kibo-labs', name: 'ESA Columbus & JAXA Kibo Pressurized Lab + Exposed Porch', category: 'International Labs', isOuter: false, explodeOffset: [0.85, -0.75, 1.45],
      desc: 'European and Japanese science modules with Kibo’s external vacuum experiment terrace and airlock.',
      funFact: 'JAXA’s Kibo module has its own "back porch" exposed to the vacuum of space and its own miniature robotic arm!',
      build(g) { for (const s of [-1, 1]) cyl(g, 0.19, 0.19, 0.68, 22, whiteMod, [0.75, 0, s * 0.48], [Math.PI / 2, 0, 0]); box(g, 0.36, 0.06, 0.42, kapton, [0.75, -0.08, 0.92]); } },
    { id: 'cupola-observatory-dome', name: '7-Window Cupola 360° Earth Observatory Dome', category: 'Observatory', isOuter: false, explodeOffset: [0.45, -1.35, 0],
      desc: 'Forged aluminum 7-pane fused-silica glass observation dome mounted on Node 3 Tranquility facing Earth.',
      funFact: 'Every famous photograph astronauts take of Earth and aurora borealis is shot through the Cupola’s 80-cm center window!',
      build(g) { cyl(g, 0.18, 0.24, 0.14, 18, alu, [0.25, -0.28, 0]); sphere(g, 0.17, 18, 12, glassMat(0x38bdf8, 0.48), [0.25, -0.34, 0]); } },
    { id: 'canadarm2-dextre-robotics', name: 'Canadarm2 (SSRMS) 7-Joint Robotic Arm & Dextre', category: 'Robotics', isOuter: false, explodeOffset: [0.35, 1.55, 0.85],
      desc: '17-meter Latching End Effector robotic crane that inches End-over-End across the station exterior.',
      funFact: 'Canadarm2 isn’t bolted to one spot—both ends have hands so it can "inchworm" across grapple fixtures all over the station!',
      build(g) { cyl(g, 0.028, 0.028, 0.72, 14, whiteMod, [0.2, 0.56, 0.18], [0, 0, 0.55]); cyl(g, 0.028, 0.028, 0.68, 14, whiteMod, [0.55, 0.72, 0.32], [0, 0.4, -0.45]); sphere(g, 0.045, 14, 14, kapton, [0.38, 0.82, 0.24]); } },
    { id: 'pma-ida-soyuz-docking', name: 'PMA/IDA Docking Adapters & Docked Soyuz/Crew Spacecraft', category: 'Docking Systems', isOuter: false, explodeOffset: [1.85, -0.85, 0],
      desc: 'NASA CAD Pressurized Mating Adapters (PMA), International Docking Adapter ring, and docked crew capsules.',
      funFact: 'Docking happens at 28,000 km/h in orbit, yet the two spacecraft touch at less than 10 centimeters per second!',
      build(g) { populateIssCad(g, { zone: 'soyuz-docking' }); cyl(g, 0.14, 0.18, 0.34, 20, brushedMetal(0x334155), [1.28, 0, 0], [0, 0, Math.PI / 2]); } },
    { id: 'microgravity-science-racks', name: 'Internal Express Science Racks, ECLSS & CMG Gyroscopes', category: 'Internal Systems', isOuter: false, explodeOffset: [0, -1.45, -1.15],
      desc: 'Cutaway interior showing 4 double-gimbal Control Moment Gyroscopes, water recovery racks, and glovebox labs.',
      funFact: 'Four spinning 220-lb steel flywheels (CMGs) turn the entire 420-ton space station without burning a drop of rocket fuel!',
      build(g) { rbox(g, 0.68, 0.18, 0.2, 0.02, screenMat('dashboard'), [0.45, 0, 0]); for (const x of [-0.15, 0.05, 0.25, 0.45]) sphere(g, 0.055, 16, 16, kapton, [x, 0.12, 0]); } },
  ];
  return {
    id: 'iss-orbital-station', name: 'International Space Station (ISS)', brand: 'NASA / Roscosmos / ESA / JAXA / CSA', badge: '28,000 km/h • 420 Tons • Real NASA CAD',
    desc: 'Humanity’s orbital laboratory 400 km above Earth, built from official NASA 3D CAD geometry with 8 solar wings, 109m truss, pressurized labs, Cupola, and Canadarm2.',
    cameraPos: [4.1, 2.5, 4.3], parts,
    quiz: [
      { q: 'Which 7-window observation dome gives astronauts a 360-degree view of Earth and visiting spacecraft?', correctId: 'cupola-observatory-dome', distractors: ['solar-array-wings', 'eatcs-thermal-radiators', 'integrated-truss-backbone'] },
      { q: 'Which white accordion panels reject waste heat from the ISS into the vacuum of space using liquid ammonia?', correctId: 'eatcs-thermal-radiators', distractors: ['solar-array-wings', 'canadarm2-dextre-robotics', 'us-destiny-harmony-modules'] },
      { q: 'Which 17-meter robotic arm can "inchworm" end-over-end across grapple fixtures on the station?', correctId: 'canadarm2-dextre-robotics', distractors: ['pma-ida-soyuz-docking', 'zvezda-zarya-russian-segment', 'microgravity-science-racks'] },
    ],
  };
}

function buildSpaceShuttleModel() {
  const whiteTile = mat(0xf8fafc, { roughness: 0.28, metalness: 0.1 });
  const blackTile = mat(0x0f172a, { roughness: 0.42, metalness: 0.18 });
  const rccGrey = brushedMetal(0x475569, { roughness: 0.35, metalness: 0.55 });
  const sofiOrange = mat(0xd95f18, { roughness: 0.58, metalness: 0.08 });
  const sofiDark = mat(0xb4460b, { roughness: 0.65, metalness: 0.1 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.85, roughness: 0.22 });
  const goldFoil = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const glass = glassMat(0x090d16, 0.88);
  const parts = [
    { id: 'slwt-external-tank', name: 'Super Lightweight External Tank (SLWT — NASA CAD)', category: 'Cryogenic Propellant', isOuter: true, explodeOffset: [0, -1.65, 0],
      desc: 'Real NASA CAD orange SOFI-insulated Aluminum-Lithium tank holding 535,000 gallons of liquid hydrogen and liquid oxygen, with ribbed intertank collar and external LOX feedline.',
      funFact: 'The External Tank’s bright orange color isn’t paint—it’s the natural color of sprayed-on polyisocyanurate thermal foam!',
      build(g) {
        populateShuttleStackCad(g, { partType: 'et', pos: [0, -0.36, 0] });
        // Main LH2 tank cylinder + ribbed Intertank structural collar + ogive LOX nose cone + aft dome
        cyl(g, 0.34, 0.34, 2.72, 36, sofiOrange, [-0.18, -0.36, 0], [0, 0, Math.PI / 2]);
        sphere(g, 0.338, 28, 20, sofiDark, [-1.54, -0.36, 0], [0, 0, 0], [0.55, 1, 1]);
        // Ribbed darker-orange Intertank collar (x = 0.56 to 1.06)
        cyl(g, 0.344, 0.344, 0.48, 36, sofiDark, [0.80, -0.36, 0], [0, 0, Math.PI / 2]);
        for (const rx of [-1.18, -0.68, -0.18, 0.32, 0.56, 1.04]) {
          torus(g, 0.345, 0.008, sofiDark, [rx, -0.36, 0], [0, Math.PI / 2, 0]);
        }
        // Sculpted ogive LOX nose cone + nose lightning rod tip
        lathe(
          g,
          [
            [1.18, 0.34],
            [1.46, 0.29],
            [1.76, 0.19],
            [2.02, 0.08],
            [2.18, 0.014],
            [2.26, 0.004],
          ],
          36,
          sofiOrange,
          [0, -0.36, 0],
        );
        // External 17-inch LOX feedline running along starboard side from Intertank back to Orbiter aft umbilical
        cyl(g, 0.026, 0.026, 2.05, 16, sofiOrange, [-0.18, -0.11, 0.24], [0, 0, Math.PI / 2]);
        // Forward bipod V-struts & aft tri-struts connecting ET to Orbiter belly
        for (const z of [-0.18, 0.18]) {
          cyl(g, 0.018, 0.018, 0.24, 12, alu, [-0.96, -0.04, z]);
          cyl(g, 0.014, 0.014, 0.24, 12, alu, [0.68, -0.04, z * 0.55], [z * 0.45, 0, 0]);
        }
      } },
    { id: 'twin-solid-rocket-boosters', name: 'Twin Reusable Solid Rocket Boosters (SRBs — NASA CAD)', category: 'First-Stage Boosters', isOuter: true, explodeOffset: [0, -0.95, 1.95],
      desc: 'Real NASA CAD twin segmented solid rocket motors with 8 field-joint stiffener rings, forward parachute frustums, flared aft skirts with hold-down posts, and gimbaled nozzles.',
      funFact: 'Each SRB produced more thrust than 14 four-engine Boeing 747 jumbo jets combined, then parachuted into the ocean for reuse!',
      build(g) {
        populateShuttleStackCad(g, { partType: 'srb-pair', pos: [-0.08, -0.36, 0] });
        for (const z of [-0.56, 0.56]) {
          // Segmented white motor case
          cyl(g, 0.165, 0.165, 2.68, 28, whiteTile, [-0.12, -0.36, z], [0, 0, Math.PI / 2]);
          // Field-joint circumferential stiffener rings + black IEA/ET attachment rings
          for (const rx of [-1.22, -0.82, -0.42, -0.02, 0.38, 0.78, 1.12]) {
            torus(g, 0.169, 0.008, rx === -0.82 || rx === 0.78 ? blackTile : alu, [rx, -0.36, z], [0, Math.PI / 2, 0]);
          }
          // Forward recovery parachute frustum + nose cap (x = 1.22 to 1.78)
          lathe(
            g,
            [
              [1.22, 0.165],
              [1.48, 0.105],
              [1.68, 0.038],
              [1.76, 0.005],
            ],
            28,
            whiteTile,
            [0, -0.36, z],
          );
          // Flared aft skirt + 4 pad hold-down posts + gimbaled submerged SRB nozzle
          cyl(g, 0.215, 0.165, 0.28, 28, whiteTile, [-1.60, -0.36, z], [0, 0, Math.PI / 2]);
          cone(g, 0.155, 0.28, 24, blackTile, [-1.84, -0.36, z], [0, 0, Math.PI / 2]);
          for (const hz of [-0.14, 0.14]) {
            rbox(g, 0.12, 0.06, 0.04, 0.008, rccGrey, [-1.66, -0.36, z + hz]);
          }
        }
      } },
    { id: 'rs25-ssme-engine-trio', name: '3× RS-25 Space Shuttle Main Engines (SSME — NASA CAD)', category: 'Main Propulsion', isOuter: true, explodeOffset: [-1.95, 0.35, 0],
      desc: 'Real NASA CAD trio of gimbaled staged-combustion LH2/LOX engines with regenerative cooling tubes, dome heat shields, and external cooling manifolds.',
      funFact: 'Liquid hydrogen enters the RS-25 nozzle walls at -253°C right next to a 3,300°C rocket flame hotter than boiling iron!',
      build(g) {
        populateShuttleStackCad(g, { partType: 'ssme-trio', pos: [0, 0, 0] });
        for (const [ox, oy, oz, cant] of [[-1.38, 0.38, 0, 0.18], [-1.44, 0.16, -0.155, 0.12], [-1.44, 0.16, 0.155, 0.12]]) {
          // Black thermal dome shield at base of nozzle
          sphere(g, 0.095, 18, 14, blackTile, [ox + 0.16, oy, oz], [0, 0, 0], [0.5, 1, 1]);
          // Tapered regenerative nozzle bell + stainless coolant manifold rings
          cone(g, 0.135, 0.34, 24, rccGrey, [ox, oy, oz], [0, 0, Math.PI / 2 - cant]);
          for (const mr of [0.085, 0.11, 0.13]) {
            torus(g, mr, 0.007, alu, [ox - (mr - 0.08) * 1.4, oy, oz], [0, Math.PI / 2, 0]);
          }
        }
      } },
    { id: 'orbiter-fuselage-tiles', name: 'Orbiter Mid/Aft Fuselage, Clamshell Doors & 24,000 Silica Tiles', category: 'Orbiter Structure', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'D-section aluminum Orbiter mid-fuselage with clamshell payload-bay doors, aft engine thrust structure, body flap, and black LI-900 high-temperature silica heat-shield belly & chine tiles.',
      funFact: 'Silica heat-shield tiles shed heat so slowly you can hold a glowing-red-hot tile by its corners with bare fingers!',
      build(g) {
        // Sculpted Orbiter mid-fuselage (x = -1.20 to +0.72) + aft engine boat-tail + black HRSI belly/chine tile wrap
        rbox(g, 1.92, 0.36, 0.46, 0.095, whiteTile, [-0.24, 0.22, 0]);
        rbox(g, 0.46, 0.40, 0.48, 0.065, whiteTile, [-1.06, 0.24, 0]);
        // Black HRSI belly heat-shield + lower chine tile wrap + aft base heat shield
        rbox(g, 2.04, 0.095, 0.50, 0.032, blackTile, [-0.20, 0.048, 0]);
        rbox(g, 0.08, 0.38, 0.46, 0.03, blackTile, [-1.26, 0.24, 0]);
        // Aft lower body flap protecting SSME nozzles during re-entry
        rbox(g, 0.22, 0.028, 0.48, 0.008, blackTile, [-1.36, 0.035, 0], [0, 0, 0.08]);
        // Payload bay centerline latch seam & black thermal hinge lines along upper fuselage
        box(g, 1.46, 0.008, 0.012, blackTile, [-0.12, 0.402, 0]);
        for (const side of [-1, 1]) {
          box(g, 1.46, 0.012, 0.008, blackTile, [-0.12, 0.24, side * 0.232]);
        }
      } },
    { id: 'double-delta-wings-rcc', name: '81°/45° Double-Delta Wings & Reinforced Carbon-Carbon Leading Edges', category: 'Aerodynamics & Re-Entry', isOuter: true, explodeOffset: [0, 0.25, -1.85],
      desc: 'True 81° inner-strake / 45° outer-sweep double-delta hypersonic glider wings with 22 gray Reinforced Carbon-Carbon (RCC) leading-edge panels, black lower HRSI tiles, and split elevons.',
      funFact: 'During Mach 25 re-entry, the wing leading edges endure 1,650°C plasma before gliding the Orbiter to a 220-mph runway landing!',
      build(g) {
        for (const s of [-1, 1]) {
          const deltaPts = [
            [0.52, s * 0.22],
            [-0.20, s * 0.44],
            [-0.98, s * 1.20],
            [-1.24, s * 1.20],
            [-1.22, s * 0.22],
          ];
          const rccPts = [
            [0.54, s * 0.22],
            [-0.18, s * 0.45],
            [-0.97, s * 1.21],
            [-1.05, s * 1.21],
            [-0.25, s * 0.42],
            [0.44, s * 0.22],
          ];
          extrudeProfile(g, deltaPts, 0.034, whiteTile, [0, 0.082, 0], [Math.PI / 2, 0, 0], 0.008);
          extrudeProfile(g, deltaPts, 0.024, blackTile, [0, 0.052, 0], [Math.PI / 2, 0, 0], 0.006);
          extrudeProfile(g, rccPts, 0.040, rccGrey, [0, 0.084, 0], [Math.PI / 2, 0, 0], 0.006);
          // Inboard & outboard trailing-edge elevon control surfaces with black cove seals
          box(g, 0.15, 0.03, 0.44, whiteTile, [-1.26, 0.066, s * 0.46], [0, s * -0.02, 0]);
          box(g, 0.15, 0.03, 0.44, whiteTile, [-1.26, 0.066, s * 0.94], [0, s * -0.02, 0]);
          box(g, 0.03, 0.034, 0.94, blackTile, [-1.18, 0.068, s * 0.70]);
        }
      } },
    { id: 'payload-bay-spacelab', name: '60-Foot Payload Bay, Silver Radiators, Canadarm & Spacelab (NASA CAD)', category: 'Payload & Science', isOuter: false, explodeOffset: [0, 1.65, 0.95],
      desc: 'Real NASA CAD payload carrier, pressurized Spacelab module, 15-meter Canadarm robotic boom, and curved Freon thermal radiator panels.',
      funFact: 'The Shuttle’s 60×15-foot cargo bay carried the Hubble Space Telescope, Chandra X-Ray Observatory, and most of the ISS!',
      build(g) {
        populateShuttleStackCad(g, { partType: 'payload', pos: [-0.1, 0.06, 0] });
        cyl(g, 0.16, 0.16, 0.92, 24, alu, [-0.18, 0.19, 0], [0, 0, Math.PI / 2]);
        // Canadarm (SRMS) robotic arm along port longeron sill + Ku-band radar dish
        cyl(g, 0.016, 0.016, 1.18, 12, whiteTile, [-0.12, 0.34, 0.19], [0, 0, Math.PI / 2]);
        sphere(g, 0.024, 12, 12, goldFoil, [0.46, 0.34, 0.19]);
        // Curved silver Freon radiator panels inside upper payload bay envelope
        for (const side of [-1, 1]) {
          rbox(g, 1.28, 0.012, 0.14, 0.004, chromeMat(), [-0.14, 0.38, side * 0.14], [side * 0.35, 0, 0]);
        }
      } },
    { id: 'orbiter-docking-system-ods', name: 'Orbiter Docking System (ODS) & External Airlock (NASA CAD)', category: 'Docking & EVA', isOuter: false, explodeOffset: [0.55, 1.45, -0.95],
      desc: 'Real NASA CAD APAS-95 androgynous docking mechanism and EVA spacewalk airlock mounted in the forward payload bay.',
      funFact: 'The ODS ring pushes out on shock-absorbing struts to capture the 420-ton Space Station without jarring either craft!',
      build(g) {
        populateShuttleStackCad(g, { partType: 'ods', pos: [-0.18, 0.04, 0] });
        cyl(g, 0.11, 0.11, 0.22, 20, goldFoil, [0.42, 0.18, 0]);
        torus(g, 0.105, 0.012, alu, [0.42, 0.29, 0], [Math.PI / 2, 0, 0]);
      } },
    { id: 'crew-flight-deck-middeck', name: 'Forward Fuselage, 6-Pane Cockpit Windshield & RCC Nose Cap', category: 'Crew Systems', isOuter: true, explodeOffset: [1.75, 0.75, 0],
      desc: 'Sculpted forward Orbiter fuselage with raised flight-deck canopy, framed 6-pane aluminosilicate windshield, forward RCS thruster ports, crew hatch, and RCC carbon nose cap.',
      funFact: 'The Shuttle cockpit had over 2,000 switches and circuit breakers—more than any other spacecraft ever flown!',
      build(g) {
        // Sculpted forward Orbiter fuselage (x = 0.68 to 1.56) that fairs seamlessly from the D-section mid-fuselage
        const noseUpper = new THREE.Group();
        noseUpper.scale.set(1, 0.82, 1.0);
        g.add(noseUpper);
        lathe(
          noseUpper,
          [
            [0.66, 0.228],
            [0.86, 0.212],
            [1.08, 0.172],
            [1.28, 0.112],
            [1.42, 0.058],
          ],
          36,
          whiteTile,
          [0, 0.21, 0],
        );
        // Raised Flight Deck canopy crown so the 6-pane cockpit windshield sits proud and realistic
        rbox(g, 0.42, 0.11, 0.34, 0.045, whiteTile, [0.80, 0.32, 0], [0, 0, -0.24]);
        // Black thermal tile windshield surround mask + 6-pane cockpit windows with white center/side mullions
        rbox(g, 0.32, 0.085, 0.35, 0.032, blackTile, [0.90, 0.315, 0], [0, 0, -0.32]);
        for (const side of [-1, 1]) {
          // Forward V-windshield panes
          rbox(g, 0.18, 0.062, 0.085, 0.008, glass, [0.95, 0.328, side * 0.052], [side * 0.18, side * -0.32, -0.34]);
          // Middle & aft side cockpit windows
          rbox(g, 0.16, 0.058, 0.072, 0.008, glass, [0.84, 0.318, side * 0.135], [side * 0.32, side * -0.18, -0.20]);
          rbox(g, 0.13, 0.052, 0.055, 0.008, glass, [0.73, 0.312, side * 0.172], [side * 0.42, side * -0.08, -0.08]);
        }
        // Overhead crew rendezvous docking windows on cockpit roof
        for (const side of [-1, 1]) {
          rbox(g, 0.11, 0.012, 0.055, 0.004, glass, [0.72, 0.382, side * 0.055]);
        }
        // Black HRSI lower nose chine tile blanket wrapping under the forward fuselage
        const noseLower = new THREE.Group();
        noseLower.scale.set(1, 0.56, 1.04);
        g.add(noseLower);
        lathe(
          noseLower,
          [
            [0.66, 0.236],
            [0.92, 0.205],
            [1.18, 0.145],
            [1.38, 0.072],
          ],
          36,
          blackTile,
          [0, 0.14, 0],
        );
        // Dark metallic gray Reinforced Carbon-Carbon (RCC) nose cap (x = 1.36 to 1.56)
        lathe(
          g,
          [
            [1.36, 0.074],
            [1.46, 0.046],
            [1.53, 0.018],
            [1.56, 0.003],
          ],
          32,
          rccGrey,
          [0, 0.165, 0],
        );
        // Forward RCS orbital thruster ports on the nose cone + Port round crew hatch
        for (const side of [-1, 1]) {
          for (const rx of [1.18, 1.24, 1.30]) {
            cyl(g, 0.012, 0.012, 0.02, 10, blackTile, [rx, 0.22, side * 0.125], [Math.PI / 2, 0, 0]);
          }
        }
        cyl(g, 0.048, 0.048, 0.015, 20, blackTile, [0.76, 0.20, 0.225], [Math.PI / 2, 0, 0]);
        cyl(g, 0.018, 0.018, 0.018, 16, glass, [0.76, 0.20, 0.227], [Math.PI / 2, 0, 0]);
      } },
    { id: 'oms-rcs-tail-pods', name: 'Twin OMS Orbital Maneuvering Pods & 45°-Swept Vertical Tail Fin', category: 'Orbital Attitude', isOuter: true, explodeOffset: [-1.65, 1.15, 0],
      desc: '45°-swept vertical tail fin with split clamshell rudder/speedbrake, Ku-band/drag-chute housing, and twin hypergolic OMS/RCS orbital thruster pods.',
      funFact: 'The vertical tail rudder splits open like a giant book during landing to act as a supersonic speedbrake!',
      build(g) {
        const finPts = [
          [-0.76, 0.38],
          [-1.28, 1.10],
          [-1.48, 1.10],
          [-1.26, 0.36],
        ];
        extrudeProfile(g, finPts, 0.044, whiteTile, [0, 0, -0.022], [0, 0, 0], 0.01);
        // Black RCC/HRSI leading edge on vertical tail fin + base drag-chute fairing pod
        box(g, 0.052, 0.80, 0.048, blackTile, [-1.01, 0.74, 0], [0, 0, 0.58]);
        rbox(g, 0.24, 0.09, 0.08, 0.02, blackTile, [-1.28, 0.42, 0]);
        // Twin teardrop OMS/RCS pods flanking the aft fuselage + black forward RCS tile grids + OMS nozzles
        for (const z of [-0.18, 0.18]) {
          rbox(g, 0.50, 0.18, 0.15, 0.048, whiteTile, [-1.06, 0.38, z]);
          rbox(g, 0.15, 0.14, 0.156, 0.03, blackTile, [-0.84, 0.38, z]);
          cone(g, 0.058, 0.16, 18, rccGrey, [-1.35, 0.38, z], [0, 0, Math.PI / 2]);
        }
      } },
    { id: 'lox-lh2-internal-cryotanks', name: 'Internal Cutaway LOX Forward Ogive Tank & LH2 Aft Tank', category: 'Cryogenic Cutaway', isOuter: false, explodeOffset: [0.45, -1.25, 1.45],
      desc: 'Internal cutaway of the top-mounted heavy Liquid Oxygen tank, ribbed intertank electronics bay, and massive aft Liquid Hydrogen tank.',
      funFact: 'Even though Liquid Hydrogen takes up 3 times more volume in the bottom tank, the smaller top Oxygen tank weighs 6 times more!',
      build(g) { cyl(g, 0.27, 0.27, 1.55, 24, alu, [-0.45, -0.36, 0], [0, 0, Math.PI / 2]); sphere(g, 0.26, 22, 16, brushedMetal(0x38bdf8), [0.95, -0.36, 0]); } },
  ];
  return {
    id: 'space-shuttle-sts', name: 'NASA Space Shuttle Full Launch Stack', brand: 'NASA / Rockwell / Thiokol / Martin Marietta', badge: 'Mach 25 • 7.8M lbf • Real NASA CAD',
    desc: 'Full Space Transportation System (STS) launch stack combining 5 official NASA 3D CAD assets: External Tank, Twin SRBs, 3× RS-25 SSMEs, Payload Bay, and Orbiter Docking System.',
    cameraPos: [4.2, 2.2, 4.3], parts,
    quiz: [
      { q: 'Why is the Space Shuttle External Tank bright orange?', correctId: 'slwt-external-tank', distractors: ['twin-solid-rocket-boosters', 'orbiter-fuselage-tiles', 'lox-lh2-internal-cryotanks'] },
      { q: 'Which two boosters provide 83% of the Space Shuttle’s liftoff thrust for the first 2 minutes of flight?', correctId: 'twin-solid-rocket-boosters', distractors: ['rs25-ssme-engine-trio', 'oms-rcs-tail-pods', 'double-delta-wings-rcc'] },
      { q: 'Which forward mechanism allows the Space Shuttle Orbiter to dock with the International Space Station?', correctId: 'orbiter-docking-system-ods', distractors: ['crew-flight-deck-middeck', 'payload-bay-spacelab', 'rs25-ssme-engine-trio'] },
    ],
  };
}

export const SPACE_MODELS = [buildIssModel(), buildSpaceShuttleModel()];
export const TRAINS_CATEGORY = {
  id: 'train', name: 'High-Speed Trains', fullName: 'High-Speed & Bullet Trains', emoji: '🚄', icon: '🚄',
  tagline: 'JR Shinkansen N700S Supreme • China CR400AF Fuxing Hao • JR SCMaglev L0 (603 km/h)', models: TRAIN_MODELS,
};
export const SPACE_CATEGORY = {
  id: 'space', name: 'Space Station & Spacecraft', fullName: 'International Space Station & NASA Space Shuttle', emoji: '🛰️', icon: '🛰️',
  tagline: 'International Space Station (ISS NASA CAD) • NASA Space Shuttle Full Launch Stack (STS CAD)', models: SPACE_MODELS,
};
