// CAD-Fidelity 3D Helicopters & Drones (`helicopters`), Mechanical Watch & Clock (`watches`),
// and Bikes & Motorcycles (`bikes`) Models for Inside Out Studio (Batch 2).
import * as THREE from '../../vendor/three.module.js';
import {
  mat, carPaint, brushedMetal, chromeMat, carbonFiberMat, glassMat, emissiveMat, screenMat, solarGridTexture,
  box, rbox, cyl, sphere, torus, cone, tube, extrudeProfile, buildHexBoltArray, buildFinArray, buildWiringHarness,
} from '../materials.js';
import {
  populateIngenuityCad, populateWatchCad, populateBikeCad, populateEngineCad, populateGearboxCad,
} from '../cad_loader.js';
import { buildBlackHawkModel } from './uh60_black_hawk.js';

function addSpinHub(g, pos, blades, radius, chord, bladeMat, hubMat, axis = 'y') {
  const spin = new THREE.Group();
  spin.position.set(pos[0], pos[1], pos[2]);
  spin.userData.driveAnim = 'fan';
  spin.userData.spinAxis = axis;
  g.add(spin);
  // Central machined titanium/aluminum rotor head spider + blade damper arms
  cyl(spin, 0.085, 0.105, 0.095, 24, hubMat, [0, 0, 0], axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]);
  sphere(spin, 0.068, 16, 12, hubMat, [0, axis === 'z' ? 0 : 0.045, axis === 'z' ? 0.045 : 0]);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    const b = new THREE.Group();
    if (axis === 'z') b.rotation.z = a;
    else b.rotation.y = a;
    spin.add(b);
    // Elastomeric lead-lag damper + pitch-housing cuff + dual bolt clevis
    cyl(b, 0.024, 0.028, 0.16, 14, hubMat, [0.11, 0, 0], [0, 0, Math.PI / 2]);
    rbox(b, 0.09, 0.032, chord * 0.65, 0.006, hubMat, [0.16, 0, 0]);
    // Main composite airfoil blade + nickel leading-edge erosion strip + 20° swept yellow high-vis tip
    rbox(b, radius * 0.84, 0.015, chord, 0.005, bladeMat, [radius * 0.48, 0, 0], [0.09, 0, 0]);
    box(b, radius * 0.82, 0.008, chord * 0.16, chromeMat(), [radius * 0.48, 0.002, -chord * 0.42], [0.09, 0, 0]);
    rbox(b, radius * 0.16, 0.015, chord * 0.94, 0.005, carPaint(0xfacc15), [radius * 0.93, 0, chord * 0.16], [0.09, -0.32, 0]);
  }
  return spin;
}

function addToothedGear(g, pos, radius, thickness, teeth, gearMat, holeMat = chromeMat(), spin = true) {
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  if (spin) {
    grp.userData.driveAnim = 'fan';
    grp.userData.spinAxis = 'y';
  }
  g.add(grp);
  // Outer rim + 5 spokes + central pinion arbor + individual gear teeth around circumference
  torus(grp, radius * 0.88, thickness * 0.55, gearMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  cyl(grp, radius * 0.24, radius * 0.24, thickness * 1.35, 16, holeMat, [0, 0, 0]);
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    box(grp, radius * 1.68, thickness * 0.65, radius * 0.12, gearMat, [0, 0, 0], [0, a, 0]);
  }
  for (let t = 0; t < teeth; t++) {
    const a = (t / teeth) * Math.PI * 2;
    box(grp, radius * 0.14, thickness * 0.85, radius * 0.09, gearMat, [Math.cos(a) * radius * 0.96, 0, Math.sin(a) * radius * 0.96], [0, -a, 0]);
  }
  return grp;
}

function buildH145Model() {
  const rescueRed = carPaint(0xdc2626);
  const rescueYellow = carPaint(0xfacc15);
  const rescueWhite = carPaint(0xf8fafc);
  const darkCarbon = carbonFiberMat([5, 5]);
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });
  const canopyGlass = glassMat(0x0c192c, 0.74);
  const skyGlass = glassMat(0x0284c7, 0.58);

  const parts = [
    { id: 'h145-bearingless-5blade-rotor', name: 'Hingeless 5-Blade Bearingless Carbon-Flexbeam Main Rotor', category: 'Rotor System', isOuter: true, explodeOffset: [0, 1.55, 0],
      desc: 'H145 D3 bearingless 5-blade composite flexbeam rotor hub with aerodynamic spherical mast cap, integrated pitch-control cuffs, swashplate, and swept parabolic noise-reducing blades.',
      funFact: 'Eliminating mechanical hinges and bearings cuts cabin vibration in half—vital for critically injured patients in a flying ICU!',
      build(g) {
        addSpinHub(g, [0.16, 0.74, 0], 5, 1.46, 0.102, darkCarbon, alu, 'y');
        sphere(g, 0.088, 18, 12, darkCarbon, [0.16, 0.77, 0]);
        cyl(g, 0.05, 0.065, 0.24, 20, alu, [0.16, 0.58, 0]);
        torus(g, 0.12, 0.018, chromeMat(), [0.16, 0.54, 0], [Math.PI / 2, 0, 0]);
      } },
    { id: 'fenestron-shrouded-tail-rotor', name: '10-Blade Uneven-Spaced Fenestron Shrouded Tail Rotor & Stabilizers', category: 'Anti-Torque & Safety', isOuter: true, explodeOffset: [-1.85, 0.35, 0],
      desc: 'High-clearance composite tailboom, horizontal stabilizer with twin endplate fins, and vertical tail shroud enclosing a 10-blade ducted anti-torque fan with stator guide vanes.',
      funFact: 'Enclosing the tail rotor inside a shroud protects ground paramedics walking behind the helicopter during mountain rescues!',
      build(g) {
        cyl(g, 0.072, 0.145, 1.28, 22, rescueRed, [-0.95, 0.24, 0], [0, 0, -Math.PI / 2 + 0.03]);
        rbox(g, 0.22, 0.028, 0.78, 0.008, rescueYellow, [-1.18, 0.26, 0]);
        for (const s of [-1, 1]) rbox(g, 0.24, 0.20, 0.024, 0.008, rescueRed, [-1.18, 0.28, s * 0.39]);
        cyl(g, 0.28, 0.28, 0.12, 28, rescueYellow, [-1.66, 0.30, 0], [Math.PI / 2, 0, 0]);
        torus(g, 0.24, 0.038, rescueRed, [-1.66, 0.30, 0]);
        const finPts = [[-1.52, 0.48], [-1.80, 0.48], [-1.92, 0.84], [-1.68, 0.84]];
        extrudeProfile(g, finPts, 0.07, rescueRed, [0, 0, 0], [0, 0, 0], 0.015);
        addSpinHub(g, [-1.66, 0.30, 0], 10, 0.21, 0.032, darkCarbon, alu, 'z');
      } },
    { id: 'twin-arriel-2e-turboshafts', name: 'Twin Safran Arriel 2E FADEC Turboshafts & Splayed Exhausts', category: 'Propulsion', isOuter: false, explodeOffset: [0, 1.15, -1.35],
      desc: 'Dual-channel FADEC turboshafts delivering 894 shp each with side mesh air intakes, titanium fireproof deck, main bevel gearbox, and splayed heat-shielded exhaust ejectors.',
      funFact: 'If one engine fails during a mountain rescue hover, the surviving engine automatically boosts above 100% power in under a second!',
      build(g) {
        populateGearboxCad(g, { pos: [0.16, 0.38, 0], scale: 0.011 });
        const cowlPts = [[-0.45, 0.26], [0.55, 0.26], [0.68, 0.38], [0.42, 0.50], [-0.36, 0.50], [-0.52, 0.36]];
        extrudeProfile(g, cowlPts, 0.40, rescueWhite, [0, 0, 0], [0, 0, 0], 0.035);
        for (const z of [-0.16, 0.16]) {
          cyl(g, 0.088, 0.10, 0.54, 18, alu, [0.02, 0.40, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.068, 0.078, 0.20, 16, brushedMetal(0x334155), [-0.36, 0.40, z * 1.18], [0, -0.22 * Math.sign(z), Math.PI / 2]);
        }
      } },
    { id: 'helionix-cockpit-clamshell-bay', name: 'Lofted Composite Medevac Fuselage, Sliding Doors & Rear Clamshell Bay', category: 'Airframe & Cabin Shell', isOuter: true, explodeOffset: [0, 0.15, 1.35],
      desc: 'Contoured composite red/white/yellow HEMS air-ambulance fuselage with flush conformal livery stripes, wide sliding side doors, and rear clamshell cargo doors.',
      funFact: 'The rear clamshell doors open wide right under the high tailboom so paramedics can slide a wheeled stretcher straight into the cabin!',
      build(g) {
        // Lofted teardrop H145 fuselage with flush conformal livery bands (no protruding boxes!)
        const bodyPts = [
          [-0.44, -0.20], [0.82, -0.22], [1.20, -0.16], [1.34, -0.03],
          [1.14, 0.14], [0.76, 0.28], [-0.34, 0.28], [-0.48, 0.14],
        ];
        extrudeProfile(g, bodyPts, 0.56, rescueRed, [0, 0, 0], [0, 0, 0], 0.075);
        for (const s of [-1, 1]) {
          // Conformal yellow & white side livery bands + Red Cross medical emblem + sliding cabin doors with 3 framed windows
          rbox(g, 1.18, 0.065, 0.018, 0.008, rescueYellow, [0.18, -0.06, s * 0.312]);
          rbox(g, 0.92, 0.16, 0.016, 0.008, rescueWhite, [0.08, 0.10, s * 0.310]);
          box(g, 0.09, 0.028, 0.022, rescueRed, [-0.18, 0.10, s * 0.315]);
          box(g, 0.028, 0.09, 0.022, rescueRed, [-0.18, 0.10, s * 0.315]);
          for (const wx of [0.46, 0.14, -0.18]) {
            rbox(g, 0.20, 0.15, 0.024, 0.01, canopyGlass, [wx, 0.09, s * 0.315]);
          }
        }
        // Rear clamshell loading doors seam & handles
        rbox(g, 0.16, 0.24, 0.44, 0.03, rescueYellow, [-0.44, 0.02, 0], [0, 0, -0.45]);
      } },
    { id: 'panoramic-bubble-windshield-helionix', name: 'Framed Panoramic Bubble Canopy, Skylights & 3-Screen Helionix Cockpit', category: 'Cockpit & Avionics', isOuter: true, explodeOffset: [1.45, 0.35, 0],
      desc: 'Framed two-piece curved polycarbonate bubble windshield with center post, twin wipers, overhead blue-tinted skylights, lower chin windows, 3-screen Helionix glass dash, and dual cyclic/collective controls.',
      funFact: 'The H145’s 4-axis Helionix autopilot can automatically bring the helicopter to a stable hover in zero-visibility mountain clouds!',
      build(g) {
        // Framed left & right bubble windshield panes + center post + overhead skylights + chin windows
        box(g, 0.46, 0.022, 0.022, rescueRed, [1.02, 0.11, 0], [0, 0, -0.48]);
        for (const s of [-1, 1]) {
          rbox(g, 0.44, 0.23, 0.24, 0.035, canopyGlass, [0.98, 0.09, s * 0.135], [s * 0.08, s * -0.18, -0.46]);
          rbox(g, 0.26, 0.02, 0.18, 0.006, skyGlass, [0.80, 0.275, s * 0.13], [0, 0, -0.14]);
          rbox(g, 0.22, 0.09, 0.022, 0.008, canopyGlass, [1.12, -0.11, s * 0.24]);
          box(g, 0.15, 0.01, 0.01, darkCarbon, [1.06, 0.04, s * 0.12], [0, 0, -0.46]);
          rbox(g, 0.13, 0.21, 0.13, 0.014, darkCarbon, [0.74, -0.02, s * 0.14]);
        }
        rbox(g, 0.14, 0.12, 0.44, 0.018, screenMat('dashboard'), [0.94, 0.02, 0]);
        sphere(g, 0.095, 18, 14, rescueRed, [1.34, -0.05, 0]);
      } },
    { id: 'hems-icu-stretcher-life-support', name: 'Roll-In Stryker ICU Medical Stretcher, Ventilator & Paramedic Seats', category: 'Flying ICU Interior', isOuter: false, explodeOffset: [-0.95, 0.15, -1.35],
      desc: 'Roll-in aluminum ambulance stretcher with yellow high-vis mattress, overhead medical oxygen/defibrillator/ventilator rack, and two swiveling flight-doctor seats.',
      funFact: 'Every H145 air ambulance carries the same ventilator, defibrillator, blood warmer, and ultrasound gear as a hospital trauma bay!',
      build(g) {
        rbox(g, 0.72, 0.045, 0.20, 0.015, rescueYellow, [0.02, -0.04, -0.08]);
        rbox(g, 0.74, 0.025, 0.22, 0.008, alu, [0.02, -0.08, -0.08]);
        rbox(g, 0.42, 0.22, 0.12, 0.015, alu, [-0.04, 0.06, 0.16]);
        rbox(g, 0.14, 0.10, 0.02, 0.005, screenMat('ios'), [-0.04, 0.10, 0.095]);
      } },
    { id: 'rescue-winch-searchlight-flir', name: 'Goodrich 90m Hydraulic Rescue Hoist, Hook & TrakkaBeam Searchlight', category: 'Search & Rescue Gear', isOuter: true, explodeOffset: [0.65, 0.55, 1.45],
      desc: 'Roof-mounted Goodrich 90-meter hydraulic rescue winch boom with cable & rescue hook, belly TrakkaBeam A800 searchlight, and nose FLIR thermal camera.',
      funFact: 'The external rescue winch can hoist two people (272 kg) simultaneously up from a cliff face or sinking ship while hovering!',
      build(g) {
        cyl(g, 0.038, 0.038, 0.18, 16, rescueYellow, [0.28, 0.34, 0.36], [0, 0, Math.PI / 2]);
        cyl(g, 0.014, 0.014, 0.22, 10, alu, [0.28, 0.30, 0.26], [Math.PI / 2, 0, 0]);
        cyl(g, 0.004, 0.004, 0.28, 8, chromeMat(), [0.28, 0.18, 0.38]);
        torus(g, 0.022, 0.006, rescueYellow, [0.28, 0.03, 0.38]);
        cyl(g, 0.048, 0.055, 0.09, 16, darkCarbon, [0.62, -0.28, -0.22], [0, 0, Math.PI / 2]);
      } },
    { id: 'tubular-aluminum-skid-gear', name: 'Energy-Absorbing Tubular Aluminum Skids, Snow Pads & Wire Cutters', category: 'Landing Gear', isOuter: false, explodeOffset: [0, -1.35, 0],
      desc: 'Cross-tube aluminum landing skids with bear-paw snow settling protectors, long paramedic boarding steps, and upper/lower wire-strike protection cutters.',
      funFact: 'The curved cross-tubes bend like giant leaf springs to absorb hard emergency landings on rocky alpine ledges!',
      build(g) {
        for (const s of [-1, 1]) {
          cyl(g, 0.025, 0.025, 1.62, 16, alu, [0.26, -0.44, s * 0.42], [0, 0, Math.PI / 2]);
          tube(g, [[1.06, -0.44, s * 0.42], [1.16, -0.41, s * 0.42], [1.22, -0.35, s * 0.42]], 0.024, alu);
          rbox(g, 0.24, 0.016, 0.12, 0.005, rescueYellow, [-0.36, -0.45, s * 0.42]);
          rbox(g, 0.56, 0.016, 0.06, 0.005, alu, [0.28, -0.34, s * 0.38]);
          for (const x of [-0.14, 0.68]) {
            cyl(g, 0.024, 0.024, 0.30, 14, alu, [x, -0.32, s * 0.35], [s * 0.36, 0, 0]);
          }
        }
        box(g, 0.022, 0.16, 0.01, darkCarbon, [0.96, 0.34, 0], [0, 0, -0.35]);
      } },
  ];
  return {
    id: 'airbus-h145-rescue', name: 'Airbus H145 D3 Medevac Helicopter', brand: 'Airbus Helicopters', badge: '5-Blade Hingeless • Fenestron Tail • 8 Subsystems',
    desc: 'World-leading air-ambulance rescue helicopter with a 5-blade bearingless main rotor, shrouded Fenestron tail fan, framed panoramic bubble cockpit, roll-in ICU stretcher bay, Goodrich rescue hoist, and twin Arriel 2E turboshafts.',
    cameraPos: [3.8, 2.0, 3.8], parts,
    quiz: [
      { q: 'What is the shrouded 10-blade tail fan on the Airbus H145 called?', correctId: 'fenestron-shrouded-tail-rotor', distractors: ['h145-bearingless-5blade-rotor', 'tubular-aluminum-skid-gear', 'twin-arriel-2e-turboshafts'] },
      { q: 'Why does the H145 use a 5-blade bearingless flexbeam rotor instead of hinged blades?', correctId: 'h145-bearingless-5blade-rotor', distractors: ['tubular-aluminum-skid-gear', 'helionix-cockpit-clamshell-bay', 'fenestron-shrouded-tail-rotor'] },
      { q: 'Which feature lets paramedics load a stretcher straight into the back of the H145?', correctId: 'helionix-cockpit-clamshell-bay', distractors: ['twin-arriel-2e-turboshafts', 'tubular-aluminum-skid-gear', 'h145-bearingless-5blade-rotor'] },
    ],
  };
}

function buildDjiMavicModel() {
  const carbon = carbonFiberMat([6, 6]);
  const magGrey = brushedMetal(0x475569, { metalness: 0.78, roughness: 0.28 });
  const darkSlate = mat(0x1e293b, { roughness: 0.42, metalness: 0.35 });
  const copper = brushedMetal(0xd97706, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });

  const parts = [
    { id: 'folding-carbon-arms-outrunners', name: '4× Folding Carbon Arms, Hinges & Front Antenna Landing Legs', category: 'Airframe Booms', isOuter: true, explodeOffset: [0, 0.45, 1.45],
      desc: 'Four sculpted carbon-composite folding swing arms with spring-cam pivot hinges, internal coaxial motor wiring, and front vertical landing legs.',
      funFact: 'The front arms swing forward while the rear arms fold downward and twist 180 degrees so the whole quadcopter fits in a jacket pocket!',
      build(g) {
        for (const [x, z, isFront] of [[0.82, -0.82, true], [0.82, 0.82, true], [-0.78, -0.78, false], [-0.78, 0.78, false]]) {
          cyl(g, 0.045, 0.045, 0.09, 16, alu, [x * 0.28, isFront ? 0.02 : -0.02, z * 0.26]);
          tube(g, [[x * 0.28, isFront ? 0.02 : -0.03, z * 0.26], [x * 0.65, 0.03, z * 0.62], [x, 0.05, z]], 0.032, carbon);
          cyl(g, 0.092, 0.078, 0.055, 22, magGrey, [x, 0.035, z]);
          sphere(g, 0.018, 12, 10, emissiveMat(isFront ? 0xef4444 : 0x22c55e, 1.8), [x, 0.01, z]);
          if (isFront) cyl(g, 0.016, 0.012, 0.22, 12, darkSlate, [x, -0.09, z]);
        }
      } },
    { id: 'brushless-outrunner-motors-props', name: '4× Copper-Wound Brushless Outrunner Motors & Folding Low-Noise Props', category: 'Propulsion', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'Four high-torque 3-phase brushless outrunner motors with visible copper stator windings, neodymium rotor bells, and 8 aerodynamic folding low-noise propellers.',
      funFact: 'Unlike a helicopter with tilting blades, a quadcopter steers entirely by speeding up or slowing down pairs of motors thousands of times per second!',
      build(g) {
        for (const [x, z] of [[0.82, -0.82], [0.82, 0.82], [-0.78, -0.78], [-0.78, 0.78]]) {
          cyl(g, 0.078, 0.078, 0.045, 20, copper, [x, 0.075, z]);
          cyl(g, 0.088, 0.088, 0.038, 22, darkSlate, [x, 0.105, z]);
          addSpinHub(g, [x, 0.135, z], 2, 0.56, 0.062, carbon, alu, 'y');
        }
      } },
    { id: 'hasselblad-3axis-gimbal', name: '3-Axis Brushless Gimbal & Hasselblad Triple-Camera Array', category: 'Imaging Payload', isOuter: true, explodeOffset: [1.45, -0.35, 0],
      desc: 'Vibration-isolated 3-axis brushless gimbal stabilizing a 4/3" CMOS 20MP Hasselblad main camera, 70mm medium tele, and 166mm periscope tele.',
      funFact: 'The gimbal’s brushless torque motors cancel out wind gusts to within 0.005 degrees so aerial video looks rock-steady!',
      build(g) {
        rbox(g, 0.18, 0.05, 0.24, 0.015, magGrey, [0.58, 0.06, 0]);
        rbox(g, 0.05, 0.18, 0.04, 0.012, magGrey, [0.64, -0.02, 0.12]);
        rbox(g, 0.24, 0.24, 0.22, 0.045, darkSlate, [0.72, -0.06, 0]);
        for (const [dy, dz, r] of [[0.045, 0, 0.058], [-0.05, -0.052, 0.040], [-0.05, 0.052, 0.040]]) {
          torus(g, r + 0.005, 0.008, copper, [0.84, -0.06 + dy, dz], [0, Math.PI / 2, 0]);
          cyl(g, r, r, 0.035, 22, glassMat(0x38bdf8, 0.55), [0.84, -0.06 + dy, dz], [0, 0, Math.PI / 2]);
        }
      } },
    { id: 'lipo-4s-flight-battery', name: '4S 5,000 mAh LiPo Intelligent Flight Battery & BMS', category: 'Electrical Power', isOuter: false, explodeOffset: [-1.35, 0.35, 0],
      desc: 'Slide-in 77 Wh high-discharge lithium-polymer battery pack with smart cell-balancing BMS and 4 LED charge indicators.',
      funFact: 'Smart drone batteries automatically discharge themselves to 60% if left unused for a week so the lithium cells don’t swell!',
      build(g) {
        rbox(g, 0.62, 0.20, 0.36, 0.035, darkSlate, [-0.18, 0.03, 0]);
        torus(g, 0.032, 0.006, alu, [-0.495, 0.03, 0], [0, Math.PI / 2, 0]);
        for (let i = 0; i < 4; i++) {
          sphere(g, 0.014, 12, 12, emissiveMat(0x22c55e, 1.8), [-0.495, 0.03, -0.06 + i * 0.04]);
        }
      } },
    { id: 'omnidirectional-vision-gps', name: 'Omnidirectional 8-Camera Binocular Vision & ToF Obstacle Sensors', category: 'Autonomy Sensors', isOuter: false, explodeOffset: [0.85, 0.95, 0],
      desc: 'Eight wide-angle fisheye stereo vision cameras (front, rear, top, bottom) plus a downward Time-of-Flight infrared laser altimeter.',
      funFact: 'Eight stereo camera eyes build a live 3D voxel map around the drone so it can weave around tree branches automatically!',
      build(g) {
        for (const z of [-0.15, 0.15]) {
          sphere(g, 0.042, 16, 16, glassMat(0x0f172a, 0.78), [0.58, 0.09, z]);
          sphere(g, 0.036, 16, 16, glassMat(0x0f172a, 0.78), [-0.46, 0.09, z]);
          sphere(g, 0.030, 14, 14, glassMat(0x0f172a, 0.78), [0.12, -0.12, z * 0.65]);
        }
        rbox(g, 0.08, 0.025, 0.08, 0.006, emissiveMat(0xef4444, 1.2), [-0.08, -0.125, 0]);
      } },
    { id: 'flight-controller-esc-gnss-stack', name: 'Dual-IMU Flight Controller PCB, 4-in-1 50A ESC & GNSS Receiver', category: 'Avionics & ESC Stack', isOuter: false, explodeOffset: [0, 0.85, -1.25],
      desc: 'Multi-layer green flight controller board with vibration-damped dual IMUs, barometric altimeter, 4-in-1 sinusoidal ESC power stage, and ceramic GPS/Galileo patch antenna.',
      funFact: 'The flight controller reads gyroscope and accelerometer data 2,000 times per second to hold the drone within 10 cm in gusty winds!',
      build(g) {
        rbox(g, 0.52, 0.032, 0.34, 0.01, mat(0x065f46, { roughness: 0.35 }), [0.08, 0.12, 0]);
        rbox(g, 0.44, 0.028, 0.30, 0.008, mat(0x0f172a, { roughness: 0.3 }), [0.06, 0.07, 0]);
        rbox(g, 0.14, 0.022, 0.14, 0.005, copper, [0.18, 0.145, 0]);
      } },
    { id: 'o3-plus-sdr-video-transceiver', name: 'O3+ 15km 1080p/60fps SDR Video Transceiver & Diversity Antennas', category: 'Radio & Telemetry', isOuter: false, explodeOffset: [-0.95, -0.45, -1.25],
      desc: 'Software-Defined Radio (SDR) H.265 video encoder, RF power amplifiers, and 2T4R dual-band 2.4/5.8 GHz phased-array antenna feeds.',
      funFact: 'The O3+ radio hops across frequencies in milliseconds to beam crystal-clear 1080p live video from up to 15 kilometers away!',
      build(g) {
        rbox(g, 0.28, 0.035, 0.24, 0.008, alu, [-0.08, -0.04, 0]);
        buildWiringHarness(g, [[-0.08, -0.04, 0.10], [0.45, 0.02, 0.45], [0.80, -0.02, 0.80]], { radius: 0.008, color: 0x38bdf8 });
        buildWiringHarness(g, [[-0.08, -0.04, -0.10], [0.45, 0.02, -0.45], [0.80, -0.02, -0.80]], { radius: 0.008, color: 0x38bdf8 });
      } },
    { id: 'magnesium-core-cooling-chassis', name: 'Sculpted Aerodynamic Body Shell & Finned Magnesium Heatsink Belly', category: 'Structure & Thermal', isOuter: true, explodeOffset: [0, -1.25, 0],
      desc: 'Aerodynamic matte-slate fuselage shell with cooling intake gills and a die-cast magnesium finned bottom heatsink plate cooled by propeller downwash.',
      funFact: 'The drone places its 4K video processor heatsink on its belly so the hurricane-force air from the propellers cools it for free!',
      build(g) {
        const bodyPts = [
          [-0.52, -0.10], [0.46, -0.12], [0.64, -0.02],
          [0.56, 0.14], [0.12, 0.18], [-0.48, 0.14],
        ];
        extrudeProfile(g, bodyPts, 0.42, magGrey, [0, 0, 0], [0, 0, 0], 0.045);
        for (let i = -3; i <= 3; i++) box(g, 0.55, 0.025, 0.016, alu, [0.02, -0.13, i * 0.045]);
      } },
  ];
  return {
    id: 'dji-mavic-3-pro', name: 'Pro Triple-Camera Folding Quadcopter', brand: 'DJI / Hasselblad', badge: '43-Min Flight • 3-Axis Gimbal • 8 Subsystems',
    desc: 'Foldable professional aerial photography quadcopter with 4 folding carbon arms, copper-wound brushless outrunner motors, 3-axis Hasselblad triple-camera gimbal, 4S LiPo smart battery, 8-camera vision suite, and O3+ SDR downlink.',
    cameraPos: [3.4, 2.1, 3.4], parts,
    quiz: [
      { q: 'How does a quadcopter pitch, roll, and yaw without a tail rotor or mechanical swashplate?', correctId: 'brushless-outrunner-motors-props', distractors: ['hasselblad-3axis-gimbal', 'lipo-4s-flight-battery', 'magnesium-core-cooling-chassis'] },
      { q: 'Which 3-axis motorized mechanism keeps the drone camera level even when the drone tilts into the wind?', correctId: 'hasselblad-3axis-gimbal', distractors: ['omnidirectional-vision-gps', 'folding-carbon-arms-outrunners', 'lipo-4s-flight-battery'] },
      { q: 'Which sensor suite lets the quadcopter detect and fly around tree branches in all directions?', correctId: 'omnidirectional-vision-gps', distractors: ['magnesium-core-cooling-chassis', 'lipo-4s-flight-battery', 'hasselblad-3axis-gimbal'] },
    ],
  };
}

function buildIngenuityModel() {
  const carbon = carbonFiberMat([5, 5]);
  const kapton = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const alu = brushedMetal(0xe2e8f0, { metalness: 0.88, roughness: 0.2 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: solarGridTexture(), metalness: 0.72, roughness: 0.18 });

  const parts = [
    { id: 'coaxial-carbon-rotors', name: 'Counter-Rotating 1.2m Carbon-Foam Coaxial Rotors (NASA CAD)', category: 'Mars Rotor System', isOuter: true, explodeOffset: [0, 1.35, 0],
      desc: 'Real NASA Ingenuity CAD twin counter-rotating 1.2-meter molded carbon-fiber foam-core rotors spinning at 2,537 RPM in Mars’s 1%-density CO2 atmosphere.',
      funFact: 'Mars’s air is 99% thinner than Earth’s—so Ingenuity’s blades had to spin 5 times faster than an Earth helicopter just to lift 1.8 kg!',
      build(g) {
        populateIngenuityCad(g, { zone: 'rotors' });
        addSpinHub(g, [0, 0.45, 0], 2, 1.15, 0.14, carbon, kapton, 'y');
        addSpinHub(g, [0, 0.62, 0], 2, 1.15, 0.14, carbon, kapton, 'y');
      } },
    { id: 'dual-swashplate-pitch-servos', name: 'Dual Titanium Swashplates, Coaxial Mast & 6 Micro-Servos', category: 'Rotor Flight Controls', isOuter: false, explodeOffset: [0, 0.95, 1.25],
      desc: 'Concentric inner/outer titanium drive shafts, upper and lower articulated titanium swashplates, pitch-change links, and 6 heated micro-servos.',
      funFact: 'Beneath Ingenuity’s upper swashplate, NASA engineers taped a tiny postage-stamp piece of muslin fabric from the Wright Brothers’ 1903 Flyer!',
      build(g) {
        cyl(g, 0.032, 0.036, 0.62, 16, carbon, [0, 0.42, 0]);
        for (const y of [0.38, 0.56]) {
          torus(g, 0.085, 0.014, kapton, [0, y, 0], [Math.PI / 2, 0, 0]);
          torus(g, 0.072, 0.011, alu, [0, y + 0.025, 0], [Math.PI / 2, 0, 0]);
        }
        for (const a of [0, 2.09, 4.18]) {
          cyl(g, 0.008, 0.008, 0.24, 8, alu, [Math.cos(a) * 0.07, 0.34, Math.sin(a) * 0.07]);
        }
      } },
    { id: 'top-solar-array-panel', name: 'Mast-Top GaAs Solar Array & 900 MHz Rover Radio Antenna (NASA CAD)', category: 'Power & Radio', isOuter: true, explodeOffset: [0, 1.95, 0],
      desc: 'Real NASA Ingenuity CAD high-efficiency gallium-arsenide solar cell array mounted above the coaxial rotors with a central 900 MHz monopole antenna.',
      funFact: 'Over 70% of Ingenuity’s solar battery power wasn’t used for flying—it was used just to run survival heaters through -90°C Martian nights!',
      build(g) {
        populateIngenuityCad(g, { zone: 'solar-panel' });
        box(g, 0.82, 0.02, 0.32, solarMat, [0, 0.82, 0]);
        cyl(g, 0.006, 0.006, 0.18, 8, kapton, [0.12, 0.91, 0]);
      } },
    { id: 'kapton-avionics-fuselage', name: 'Gold Kapton-Foil CO2-Gap Thermal Fuselage Box (NASA CAD)', category: 'Thermal Enclosure', isOuter: true, explodeOffset: [1.35, 0, 0],
      desc: 'Real NASA Ingenuity CAD ultra-lightweight carbon-composite outer box wrapped in gold Kapton foil, trapping a stagnant CO2 gas layer for thermal insulation.',
      funFact: 'Solid foam insulation was too heavy for Mars—so JPL used Mars’s own thin carbon-dioxide air trapped between foil layers as weightless insulation!',
      build(g) {
        populateIngenuityCad(g, { zone: 'fuselage-bus' });
        rbox(g, 0.36, 0.32, 0.36, 0.02, kapton, [0, -0.05, 0]);
      } },
    { id: 'six-cell-sony-li-ion-battery', name: '6× Sony VTC4 18650 Li-Ion Battery Pack (35.7 Wh) & Foil Heaters', category: 'Energy Storage', isOuter: false, explodeOffset: [-1.25, 0.25, 0],
      desc: 'Six cylindrical high-discharge 2 Ah lithium-ion 18650 cells arranged around the central mast tube with Kapton resistance heater blankets.',
      funFact: 'Ingenuity’s 6 battery cells weighed just 273 grams total yet delivered over 350 watts of burst power during takeoff on Mars!',
      build(g) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          cyl(g, 0.028, 0.028, 0.18, 14, carPaint(0x16a34a), [Math.cos(a) * 0.085, -0.04, Math.sin(a) * 0.085]);
        }
        torus(g, 0.09, 0.012, kapton, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
      } },
    { id: 'snapdragon-flight-computer-imu', name: 'Qualcomm Snapdragon 801 Flight Processor, Dual FPGA & MEMS IMU', category: 'Avionics & GNC', isOuter: false, explodeOffset: [0, -0.25, -1.35],
      desc: 'Cube-shaped avionics card cage inside the fuselage box housing a 2.26 GHz Snapdragon 801 Linux processor, radiation-tolerant Actel FPGAs, and Bosch BMI160 IMU.',
      funFact: 'Ingenuity’s Snapdragon 801 smartphone chip had 100 times more computing power than the Perseverance Mars rover it rode to Mars with!',
      build(g) {
        for (const d of [-0.11, 0.11]) {
          box(g, 0.22, 0.20, 0.012, mat(0x065f46), [0, -0.05, d]);
          box(g, 0.012, 0.20, 0.22, mat(0x065f46), [d, -0.05, 0]);
        }
        rbox(g, 0.07, 0.07, 0.018, 0.004, mat(0x0f172a), [0, -0.05, 0.12]);
      } },
    { id: 'garmin-lidar-navcam-downward', name: 'Garmin Lidar-Lite Laser Altimeter, 30-Hz NavCam & 13MP RTE Camera', category: 'Vision & Altimetry', isOuter: false, explodeOffset: [-1.35, -0.55, 0],
      desc: 'Nadir-pointing Garmin Lidar-Lite v3 laser rangefinder, 0.5MP global-shutter B&W navigation camera, and forward-angled 13MP color Return-to-Earth camera.',
      funFact: 'Because Mars has no GPS satellites and a weak magnetic field, Ingenuity navigated by tracking rocks and sand ripples 30 times per second!',
      build(g) {
        cyl(g, 0.06, 0.06, 0.08, 16, chromeMat(), [-0.06, -0.24, 0.04]);
        cyl(g, 0.045, 0.045, 0.07, 16, glassMat(0x38bdf8, 0.45), [0.06, -0.24, -0.04]);
        cyl(g, 0.032, 0.032, 0.05, 16, alu, [0.16, -0.14, 0], [0, 0, Math.PI / 2 - 0.35]);
      } },
    { id: 'carbon-mars-landing-legs', name: '4× Ultra-Light Tapered Carbon-Tube Landing Legs (NASA CAD)', category: 'Landing Gear', isOuter: false, explodeOffset: [0, -1.35, 0],
      desc: 'Real NASA Ingenuity CAD four flexible titanium-and-carbon legs with spring-loaded deployment hinges and compliant Martian regolith footpads.',
      funFact: 'Planned for just 5 test flights over 30 days, Ingenuity flew 72 times over nearly 3 years on Mars!',
      build(g) {
        populateIngenuityCad(g, { zone: 'landing-legs' });
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          cyl(g, 0.012, 0.016, 0.72, 10, carbon, [sx * 0.34, -0.34, sz * 0.34], [sz * 0.55, 0, -sx * 0.55]);
        }
      } },
  ];
  return {
    id: 'nasa-ingenuity-mars-heli', name: 'NASA Ingenuity Mars Coaxial Helicopter', brand: 'NASA JPL / AeroVironment', badge: '2,537 RPM • 1.8 kg • 8 Subsystems • Real NASA CAD',
    desc: 'First aircraft to achieve powered, controlled flight on another planet, built from official NASA JPL 3D CAD with counter-rotating coaxial carbon rotors, dual swashplates, solar array, 6-cell Li-ion pack, and Snapdragon flight computer.',
    cameraPos: [3.4, 2.0, 3.4], parts,
    quiz: [
      { q: 'Why does NASA Ingenuity use two counter-rotating coaxial rotors instead of a tail rotor?', correctId: 'coaxial-carbon-rotors', distractors: ['top-solar-array-panel', 'carbon-mars-landing-legs', 'kapton-avionics-fuselage'] },
      { q: 'What did most of Ingenuity’s solar-charged battery energy do during the -90°C Martian night?', correctId: 'top-solar-array-panel', distractors: ['carbon-mars-landing-legs', 'coaxial-carbon-rotors', 'kapton-avionics-fuselage'] },
      { q: 'Which gold-foiled central cube houses Ingenuity’s batteries, heaters, and Snapdragon flight computer?', correctId: 'kapton-avionics-fuselage', distractors: ['coaxial-carbon-rotors', 'carbon-mars-landing-legs', 'top-solar-array-panel'] },
    ],
  };
}

function buildSwissChronographModel() {
  const brass = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.16 });
  const steel = chromeMat();
  const rhodium = brushedMetal(0xe2e8f0, { metalness: 0.9, roughness: 0.18 });
  const ruby = carPaint(0xe11d48);
  const bluedSteel = carPaint(0x1d4ed8);
  const blackCeramic = mat(0x0f172a, { roughness: 0.12, metalness: 0.45 });

  // 10 Horological Subsystems arranged in a multi-tier vertical & radial exploded stack!
  const parts = [
    { id: 'ceramic-tachymeter-bezel-sapphire', name: 'Cerachrom Tachymeter Bezel & Anti-Reflective Domed Sapphire Crystal', category: 'Bezel & Crystal', isOuter: true, explodeOffset: [0, 1.85, 0],
      desc: 'Scratchproof black ceramic tachymeter bezel graduated from 400 to 60 units per hour, paired with a synthetic corundum sapphire front crystal and red waterproof gasket.',
      funFact: 'A tachymeter scale on the bezel lets a racing driver measure speed in MPH over a 1-mile track using only the central stopwatch hand!',
      build(g) {
        torus(g, 0.72, 0.075, blackCeramic, [0, 0.16, 0], [Math.PI / 2, 0, 0]);
        torus(g, 0.64, 0.016, carPaint(0xef4444), [0, 0.15, 0], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          box(g, 0.04, 0.015, 0.012, rhodium, [Math.cos(a) * 0.72, 0.22, Math.sin(a) * 0.72], [0, -a, 0]);
        }
        cyl(g, 0.64, 0.64, 0.032, 36, glassMat(0xe0f2fe, 0.24), [0, 0.19, 0]);
      } },
    { id: 'lumed-hands-red-chrono-sweep', name: 'Super-LumiNova Baton Hands, Red Flyback Chrono Sweep & Sub-Hands', category: 'Indications & Hands', isOuter: false, explodeOffset: [0, 1.45, 0.65],
      desc: 'Diamond-cut 18k white-gold hour and minute hands filled with Super-LumiNova, central red chronograph seconds sweep hand, and 3 sub-register hands.',
      funFact: 'The central red chronograph hand starts, stops, and snaps back to 12 o’clock in under 1/100th of a second when the reset heart-cam is struck!',
      build(g) {
        const sweep = new THREE.Group();
        sweep.position.set(0, 0.135, 0);
        sweep.userData.driveAnim = 'fan';
        sweep.userData.spinAxis = 'y';
        g.add(sweep);
        cyl(sweep, 0.038, 0.038, 0.035, 16, brass, [0, 0, 0]);
        rbox(sweep, 0.36, 0.014, 0.038, 0.004, rhodium, [0.14, -0.008, 0.04], [0, -0.45, 0]);
        rbox(sweep, 0.50, 0.014, 0.028, 0.004, rhodium, [-0.12, 0, -0.16], [0, 0.85, 0]);
        rbox(sweep, 0.62, 0.012, 0.014, 0.003, carPaint(0xef4444), [0.16, 0.01, 0], [0, 0, 0]);
        for (const [sx, sz] of [[0, 0.30], [-0.30, 0], [0, -0.30]]) {
          cyl(g, 0.022, 0.022, 0.025, 12, brass, [sx, 0.128, sz]);
          box(g, 0.13, 0.01, 0.012, carPaint(0xef4444), [sx + 0.04, 0.132, sz], [0, 0.5, 0]);
        }
      } },
    { id: 'chronograph-dial-hands-case', name: 'Sunburst "Panda" Tri-Compax Dial, Guilloché Sub-Registers & Applied Indices', category: 'Dial Plate', isOuter: false, explodeOffset: [0, 1.05, -0.65],
      desc: 'Sunburst silver-white "Panda" dial plate with 3 recessed snailed black sub-registers (30-min counter, 12-hr counter, running seconds), minute track, and applied 18k gold baton hour markers.',
      funFact: 'High-contrast white dials with three black sub-dials were nicknamed "Panda dials" by 1960s racing drivers who needed instant legibility at 180 mph!',
      build(g) {
        cyl(g, 0.62, 0.62, 0.024, 40, rhodium, [0, 0.095, 0]);
        torus(g, 0.59, 0.012, blackCeramic, [0, 0.108, 0], [Math.PI / 2, 0, 0]);
        for (const [sx, sz] of [[0, 0.30], [-0.30, 0], [0, -0.30]]) {
          cyl(g, 0.16, 0.16, 0.028, 28, blackCeramic, [sx, 0.098, sz]);
          torus(g, 0.16, 0.008, brass, [sx, 0.112, sz], [Math.PI / 2, 0, 0]);
          torus(g, 0.10, 0.004, rhodium, [sx, 0.113, sz], [Math.PI / 2, 0, 0]);
        }
        for (let h = 0; h < 12; h++) {
          const a = (h / 12) * Math.PI * 2;
          rbox(g, 0.085, 0.018, 0.028, 0.004, brass, [Math.cos(a) * 0.51, 0.112, Math.sin(a) * 0.51], [0, -a, 0]);
        }
      } },
    { id: 'oyster-316l-case-strap', name: '904L Oyster Middle Case, Sculpted Lugs, Crown Guards & 3-Link Bracelet', category: 'Case & Strap', isOuter: true, explodeOffset: [-1.45, 0.35, 0],
      desc: 'CNC-machined 904L stainless-steel Oyster middle case, bevel-polished lugs, twin crown guards, and articulated 3-link Oyster bracelet with folding Oysterlock safety clasp.',
      funFact: 'The middle case is milled from a solid block of corrosion-proof 904L superalloy steel using 15 separate CNC operations!',
      build(g) {
        // Middle case barrel & satin-brushed outer caseband
        torus(g, 0.70, 0.092, steel, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.74, 0.72, 0.16, 40, steel, [0, 0.03, 0]);
        cyl(g, 0.61, 0.61, 0.17, 36, brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.28 }), [0, 0.035, 0]);
        // 4 Sculpted bevel-polished Oyster lugs (along +Z / -Z 12 o'clock & 6 o'clock)
        for (const sx of [-0.42, 0.42]) {
          for (const sz of [-0.78, 0.78]) {
            rbox(g, 0.16, 0.13, 0.34, 0.025, steel, [sx, 0.025, sz], [sz > 0 ? 0.14 : -0.14, sx * (sz > 0 ? -0.18 : 0.18), 0]);
          }
        }
        // Twin Crown Guards on +X side
        for (const z of [-0.14, 0.14]) {
          rbox(g, 0.16, 0.10, 0.08, 0.02, steel, [0.74, 0.04, z], [0, z * 0.4, 0]);
        }
        // Solid end-links & articulated 3-row Oyster Bracelet along +Z and -Z
        for (const dir of [-1, 1]) {
          for (let link = 0; link < 6; link++) {
            const lz = dir * (0.82 + link * 0.21);
            const ly = 0.02 - link * link * 0.018;
            const pitch = dir * link * 0.085;
            const w = 0.66 - link * 0.022;
            // Outer satin links + polished center link
            rbox(g, w * 0.31, 0.055, 0.18, 0.012, rhodium, [-w * 0.34, ly, lz], [pitch, 0, 0]);
            rbox(g, w * 0.32, 0.058, 0.18, 0.012, steel, [0, ly, lz], [pitch, 0, 0]);
            rbox(g, w * 0.31, 0.055, 0.18, 0.012, rhodium, [w * 0.34, ly, lz], [pitch, 0, 0]);
          }
        }
        // Folding Oysterlock deployant clasp bridge at the bottom of the bracelet arc
        rbox(g, 0.56, 0.048, 0.52, 0.014, steel, [0, -0.58, 0]);
      } },
    { id: 'mainspring-barrel-crown', name: 'Triplock Winding Crown, Stem, Keyless Works & Chrono Pump Pushers', category: 'Winding & Setting', isOuter: true, explodeOffset: [1.55, 0.25, 0],
      desc: 'Knurled screw-down Triplock winding crown with triple O-ring gaskets, square winding stem, sliding clutch pinion, setting lever jumper, and twin start/stop/reset chronograph pushers.',
      funFact: 'Pulling the crown out one click shifts a tiny sliding pinion gear from winding the mainspring to setting the hands!',
      build(g) {
        // Knurled Triplock winding crown at 3 o'clock (+X)
        cyl(g, 0.095, 0.095, 0.13, 24, brass, [0.86, 0.04, 0], [0, 0, Math.PI / 2]);
        for (let k = 0; k < 12; k++) {
          const ka = (k / 12) * Math.PI * 2;
          box(g, 0.12, 0.014, 0.014, steel, [0.86, 0.04 + Math.cos(ka) * 0.095, Math.sin(ka) * 0.095]);
        }
        // Square winding stem, sliding pinion & keyless works setting lever
        cyl(g, 0.024, 0.024, 0.52, 12, steel, [0.56, 0.04, 0], [0, 0, Math.PI / 2]);
        cyl(g, 0.055, 0.055, 0.06, 16, brass, [0.46, 0.04, 0], [0, 0, Math.PI / 2]);
        rbox(g, 0.22, 0.018, 0.06, 0.006, bluedSteel, [0.44, 0.055, 0.09], [0, 0.35, 0]);
        // Twin Start/Stop (2 o'clock) & Flyback Reset (4 o'clock) Pump Pushers
        for (const z of [-0.38, 0.38]) {
          cyl(g, 0.065, 0.065, 0.12, 20, steel, [0.79, 0.04, z], [0, z * 0.55, Math.PI / 2]);
          cyl(g, 0.038, 0.038, 0.18, 16, brass, [0.69, 0.04, z * 0.88], [0, z * 0.55, Math.PI / 2]);
        }
      } },
    { id: 'coiled-nivaflex-mainspring-barrel', name: 'Toothed Brass Mainspring Barrel, Coiled Nivaflex Ribbon & Ratchet Wheel', category: 'Energy Barrel', isOuter: false, explodeOffset: [-1.15, -0.15, 1.15],
      desc: 'Large toothed brass barrel drum housing a coiled 60-cm blue Nivaflex cobalt-alloy mainspring ribbon, central barrel arbor, steel ratchet wheel, and recoil click.',
      funFact: 'Inside a mechanical watch there is no battery at all—just a tightly coiled 24-inch superalloy ribbon unwinding smoothly over 72 hours!',
      build(g) {
        addToothedGear(g, [-0.22, 0.03, -0.18], 0.26, 0.055, 24, brass, steel, true);
        for (const r of [0.08, 0.12, 0.16, 0.20]) {
          torus(g, r, 0.011, bluedSteel, [-0.22, 0.04, -0.18], [Math.PI / 2, 0, 0]);
        }
        addToothedGear(g, [-0.22, 0.075, -0.18], 0.19, 0.022, 18, steel, ruby, true);
      } },
    { id: 'going-train-gear-wheels', name: '4-Wheel Brass Going Train, Pinions & Synthetic Ruby Jewel Bearings', category: 'Gear Train', isOuter: false, explodeOffset: [-1.15, 0.55, -1.15],
      desc: 'Spoked brass Center Wheel (1 rev/hr), Third Wheel, Fourth Wheel (1 rev/min), and Escape Pinion multiplying torque speed by 4,800× inside synthetic ruby bearings.',
      funFact: 'Watchmakers use real synthetic rubies as bearings because diamond-hard ruby against polished steel has almost zero friction for decades!',
      build(g) {
        addToothedGear(g, [0, 0.035, 0], 0.24, 0.026, 24, brass, ruby, true);
        addToothedGear(g, [0.22, 0.042, -0.16], 0.19, 0.024, 20, brass, ruby, true);
        addToothedGear(g, [0, 0.048, -0.30], 0.17, 0.024, 18, brass, ruby, true);
        addToothedGear(g, [-0.22, 0.038, 0.18], 0.16, 0.024, 16, brass, ruby, true);
        // Steel pinions & arbors linking the going train
        for (const [gx, gz] of [[0, 0], [0.22, -0.16], [0, -0.30], [-0.22, 0.18]]) {
          cyl(g, 0.032, 0.032, 0.08, 12, steel, [gx, 0.04, gz]);
          cyl(g, 0.018, 0.018, 0.095, 12, ruby, [gx, 0.04, gz]);
        }
      } },
    { id: 'column-wheel-chrono-clutch', name: '8-Pillar Blued-Steel Column Wheel, Horizontal Clutch & Reset Hammers', category: 'Chronograph Complication', isOuter: false, explodeOffset: [1.15, 0.55, 1.15],
      desc: 'Castellated 8-pillar blued-steel column wheel (roue à colonnes) coordinating the chronograph start/stop coupling yoke, intermediate driving wheel, and zero-reset heart hammers.',
      funFact: 'Machining a single tiny 8-pillar column wheel from hardened steel takes hours of micro-milling and is the hallmark of a true luxury chronograph!',
      build(g) {
        cyl(g, 0.095, 0.095, 0.035, 20, bluedSteel, [0.26, 0.05, -0.16]);
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          box(g, 0.022, 0.055, 0.022, bluedSteel, [0.26 + Math.cos(a) * 0.072, 0.08, -0.16 + Math.sin(a) * 0.072]);
        }
        rbox(g, 0.42, 0.018, 0.045, 0.006, steel, [0.12, 0.065, 0.04], [0, 0.48, 0]);
        rbox(g, 0.34, 0.018, 0.040, 0.006, steel, [-0.04, 0.072, 0.14], [0, -0.35, 0]);
      } },
    { id: 'rhodium-mainplate-cotes-de-geneve', name: 'Perlage Mainplate, Côtes de Genève Bridges, Ruby Chatons & Blued Screws', category: 'Mainplate & Bridges', isOuter: false, explodeOffset: [0.95, -0.45, -1.15],
      desc: 'Circular-grained brass mainplate and 4 rhodium-plated bridges decorated with Geneva stripes, bevelled anglage edges, pressed ruby jewel bearings, and thermally blued screws.',
      funFact: 'The parallel "Côtes de Genève" stripes on the bridges aren’t just beautiful—their microscopic grooves trap tiny dust particles before they reach the gears!',
      build(g) {
        cyl(g, 0.58, 0.58, 0.022, 36, brass, [0, -0.015, 0]);
        rbox(g, 0.44, 0.026, 0.28, 0.008, rhodium, [-0.18, 0.02, -0.14]);
        rbox(g, 0.36, 0.026, 0.22, 0.008, rhodium, [0.18, 0.02, -0.16]);
        rbox(g, 0.38, 0.026, 0.18, 0.008, rhodium, [0.20, 0.02, 0.16]);
        for (const [jx, jz] of [[0, 0], [-0.22, -0.18], [0.22, -0.16], [0.22, 0.14], [-0.22, 0.18], [0, -0.30]]) {
          cyl(g, 0.028, 0.028, 0.036, 14, ruby, [jx, 0.022, jz]);
          cyl(g, 0.016, 0.016, 0.038, 12, bluedSteel, [jx + 0.055, 0.022, jz + 0.035]);
        }
      } },
    { id: 'swiss-lever-escapement-balance-rotor', name: 'Swiss Lever Escapement, 4 Hz Balance Wheel, Hairspring & Tungsten Rotor', category: 'Escapement & Automatic Rotor', isOuter: true, explodeOffset: [0, -1.55, 0],
      desc: '28,800 vph (4 Hz) Glucydur balance wheel with gold timing weights, blue Parachrom Breguet hairspring, ruby pallet fork, club-tooth escape wheel, and guilloché tungsten automatic rotor.',
      funFact: 'The tiny balance wheel ticks 8 times every single second—691,200 beats per day—while the half-moon rotor winds the watch from your wrist motion!',
      build(g) {
        addSpinHub(g, [0.22, 0.04, 0.16], 4, 0.22, 0.024, brass, ruby, 'y');
        torus(g, 0.22, 0.020, brass, [0.22, 0.04, 0.16], [Math.PI / 2, 0, 0]);
        for (const r of [0.06, 0.09, 0.12]) {
          torus(g, r, 0.005, bluedSteel, [0.22, 0.065, 0.16], [Math.PI / 2, 0, 0]);
        }
        addToothedGear(g, [0.04, 0.035, 0.24], 0.11, 0.018, 15, steel, ruby, true);
        // Half-moon skeletonized tungsten automatic rotor + sapphire exhibition caseback ring
        const rotor = new THREE.Group();
        rotor.position.set(0, -0.075, 0);
        rotor.userData.driveAnim = 'fan';
        rotor.userData.spinAxis = 'y';
        g.add(rotor);
        cyl(rotor, 0.11, 0.11, 0.03, 20, steel, [0, 0, 0]);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.065, 12, 28, Math.PI), brass);
        arc.rotation.x = Math.PI / 2;
        rotor.add(arc);
        for (const a of [0.4, 1.57, 2.74]) {
          box(rotor, 0.44, 0.022, 0.045, rhodium, [Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], [0, -a, 0]);
        }
        cyl(g, 0.62, 0.62, 0.026, 36, glassMat(0xe0f2fe, 0.24), [0, -0.14, 0]);
      } },
  ];
  return {
    id: 'swiss-chronograph-watch', name: 'Swiss Automatic Mechanical Chronograph', brand: 'Haute Horlogerie / Khronos CAD', badge: '28,800 vph • Column Wheel • 10 Horological Layers',
    desc: 'High-complication self-winding mechanical chronograph exploding into 10 authentic horological layers: Cerachrom tachymeter bezel & sapphire crystal, lumed hands, Panda tri-compax dial, Oyster case, Triplock crown & pushers, coiled mainspring barrel, 4-wheel going train, 8-pillar column wheel, Côtes de Genève bridges, and Swiss lever escapement.',
    cameraPos: [2.8, 2.2, 2.8], parts,
    quiz: [
      { q: 'Which oscillating wheel and hairspring divide time into 8 exact beats per second (28,800 vph)?', correctId: 'swiss-lever-escapement-balance-rotor', distractors: ['mainspring-barrel-crown', 'oyster-316l-case-strap', 'chronograph-dial-hands-case'] },
      { q: 'Where is mechanical energy stored inside a battery-free automatic watch?', correctId: 'coiled-nivaflex-mainspring-barrel', distractors: ['going-train-gear-wheels', 'swiss-lever-escapement-balance-rotor', 'chronograph-dial-hands-case'] },
      { q: 'Why are synthetic rubies ("jewels") pressed into the movement bridges?', correctId: 'going-train-gear-wheels', distractors: ['oyster-316l-case-strap', 'mainspring-barrel-crown', 'chronograph-dial-hands-case'] },
    ],
  };
}

function buildGrandfatherClockModel() {
  const brass = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.15 });
  const mahogany = mat(0x451a03, { roughness: 0.34, metalness: 0.08 });
  const burlWalnut = mat(0x78350f, { roughness: 0.38, metalness: 0.06 });
  const steel = chromeMat();
  const silverDial = brushedMetal(0xe2e8f0, { metalness: 0.85, roughness: 0.2 });

  // 10 Separate Cabinet & Horological Subsystems so the entire Grandfather Clock explodes apart into every mechanical & architectural piece!
  const parts = [
    { id: 'swan-neck-hood-bonnet-finials', name: 'Removable Swan-Neck Pediment Hood Bonnet, Columns & 3 Brass Finials', category: 'Upper Clock Hood', isOuter: true, explodeOffset: [0, 1.65, 0],
      desc: 'Slide-off Chippendale mahogany upper hood bonnet with turned Corinthian columns, brass capitals, acoustic side sound frets, carved swan-neck pediment scrolls, and 3 brass ball-and-spire finials.',
      funFact: 'The entire top hood of a grandfather clock slides forward off wooden rails so the clockmaker can oil the gears from all four sides!',
      build(g) {
        rbox(g, 0.84, 0.06, 0.52, 0.015, mahogany, [0, 0.38, 0]);
        rbox(g, 0.78, 0.56, 0.06, 0.02, mahogany, [0, 0.66, -0.22]);
        for (const s of [-1, 1]) {
          rbox(g, 0.06, 0.56, 0.44, 0.015, mahogany, [s * 0.36, 0.66, 0]);
          cyl(g, 0.032, 0.036, 0.52, 18, burlWalnut, [s * 0.37, 0.66, 0.22]);
          cyl(g, 0.042, 0.042, 0.04, 18, brass, [s * 0.37, 0.92, 0.22]);
          cyl(g, 0.042, 0.042, 0.04, 18, brass, [s * 0.37, 0.41, 0.22]);
        }
        rbox(g, 0.86, 0.10, 0.52, 0.02, mahogany, [0, 0.96, 0]);
        cyl(g, 0.26, 0.26, 0.46, 24, mahogany, [0, 0.96, -0.02], [Math.PI / 2, 0, 0]);
        for (const [fx, fy] of [[-0.36, 1.06], [0, 1.24], [0.36, 1.06]]) {
          cyl(g, 0.018, 0.028, 0.06, 14, brass, [fx, fy, 0.18]);
          sphere(g, 0.032, 16, 14, brass, [fx, fy + 0.05, 0.18]);
          cone(g, 0.014, 0.09, 12, brass, [fx, fy + 0.12, 0.18]);
        }
      } },
    { id: 'moon-phase-dial-mahogany-case', name: 'Arched Brass Dial, Silvered Roman Chapter Ring, Spandrels & Serpentine Hands', category: 'Dial & Hands', isOuter: true, explodeOffset: [0, 0.75, 1.55],
      desc: 'Engraved solid-brass break-arch dial plate with 4 cast gilded cherub-head corner spandrels, silvered Roman numeral chapter ring, subsidiary seconds dial, and blued-steel serpentine hands.',
      funFact: 'Before house lighting existed, the contrast of black-waxed Roman numerals etched into a silvered ring let people read the time by candlelight!',
      build(g) {
        rbox(g, 0.48, 0.48, 0.024, 0.01, brass, [0, 0.62, 0.18]);
        // 4 Ornate cast-brass corner spandrels + silvered chapter ring + subsidiary seconds ring
        for (const [sx, sy] of [[-0.17, 0.45], [0.17, 0.45], [-0.17, 0.79], [0.17, 0.79]]) {
          torus(g, 0.042, 0.012, brass, [sx, sy, 0.195]);
        }
        torus(g, 0.175, 0.032, silverDial, [0, 0.62, 0.196]);
        torus(g, 0.052, 0.008, silverDial, [0, 0.70, 0.198]);
        for (let h = 0; h < 12; h++) {
          const a = (h / 12) * Math.PI * 2;
          box(g, 0.028, 0.008, 0.008, mat(0x0f172a), [Math.cos(a) * 0.175, 0.62 + Math.sin(a) * 0.175, 0.205], [0, 0, a]);
        }
        box(g, 0.018, 0.13, 0.01, mat(0x0f172a), [0, 0.67, 0.208], [0, 0, -0.35]);
        box(g, 0.013, 0.175, 0.01, mat(0x0f172a), [0.05, 0.64, 0.212], [0, 0, -1.25]);
      } },
    { id: 'rolling-moon-phase-calendar-disc', name: 'Hand-Painted Rotating Moon-Phase Hemisphere Disc & 29½-Day Lunar Gear', category: 'Astronomical Complication', isOuter: false, explodeOffset: [0.85, 1.15, 1.15],
      desc: '59-tooth brass lunar disc painted with two golden moon faces and starry skies that advances one tooth every 12 hours to track the 29.5-day synodic lunar cycle.',
      funFact: 'Eighteenth-century farmers and travellers relied on the clock’s moon-phase dial to know which nights would have bright full-moon light for night travel!',
      build(g) {
        cyl(g, 0.17, 0.17, 0.022, 28, brass, [0, 0.84, 0.16], [Math.PI / 2, 0, 0]);
        cyl(g, 0.14, 0.14, 0.026, 28, carPaint(0x1e3a8a), [0, 0.84, 0.165], [Math.PI / 2, 0, 0]);
        sphere(g, 0.048, 16, 12, brass, [-0.045, 0.85, 0.175]);
        sphere(g, 0.048, 16, 12, brass, [0.045, 0.83, 0.175]);
      } },
    { id: 'going-striking-gear-train', name: 'Twin Solid-Brass Movement Plates, 10 Spoked Gears & Rack-and-Snail Strike', category: 'Movement & Gear Train', isOuter: false, explodeOffset: [-0.95, 0.65, 0.95],
      desc: 'Two heavy brushed-brass movement plates joined by 4 turned pillars, housing the timekeeping going train, quarter-chime train, and hour-counting rack-and-snail striking gears.',
      funFact: 'A stepped 12-notch "snail cam" tells the hammer mechanism whether to strike 1 o’clock or 12 o’clock without ever losing count!',
      build(g) {
        populateGearboxCad(g, { pos: [0, 0.62, 0], scale: 0.007 });
        for (const z of [-0.09, 0.09]) box(g, 0.48, 0.44, 0.018, brass, [0, 0.62, z]);
        for (const [px, py] of [[-0.20, 0.44], [0.20, 0.44], [-0.20, 0.80], [0.20, 0.80]]) {
          cyl(g, 0.014, 0.014, 0.20, 12, brass, [px, py, 0], [Math.PI / 2, 0, 0]);
        }
        for (const [gx, gy, r] of [[-0.14, 0.52, 0.095], [0, 0.52, 0.095], [0.14, 0.52, 0.095], [-0.12, 0.68, 0.08], [0.12, 0.68, 0.08]]) {
          torus(g, r, 0.012, brass, [gx, gy, 0.02]);
          cyl(g, 0.02, 0.02, 0.18, 12, steel, [gx, gy, 0], [Math.PI / 2, 0, 0]);
        }
      } },
    { id: 'deadbeat-anchor-escapement-crutch', name: 'Deadbeat Anchor Escapement Wheel, Steel Pallets, Crutch Fork & Suspension Spring', category: 'Escapement Mechanism', isOuter: false, explodeOffset: [1.15, 0.55, 0.35],
      desc: 'Graham deadbeat anchor escapement wheel with 30 pointed brass teeth, hardened steel entry/exit pallets, brass crutch fork, and thin steel pendulum suspension spring.',
      funFact: 'George Graham invented the "deadbeat" anchor escapement in 1715 so the seconds hand locks dead-still between ticks instead of recoiling backward!',
      build(g) {
        addSpinHub(g, [0, 0.68, 0.05], 8, 0.12, 0.018, brass, steel, 'z');
        torus(g, 0.11, 0.01, brass, [0, 0.68, 0.05]);
        // Anchor pallet arch above escape wheel + vertical crutch fork down to pendulum rod
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 10, 20, Math.PI * 0.85), steel);
        arch.position.set(0, 0.72, 0.05);
        g.add(arch);
        cyl(g, 0.008, 0.008, 0.32, 10, brass, [0, 0.58, 0.06]);
      } },
    { id: 'westminster-chime-tubes-hammers', name: '9 Tuned Nickel-Brass Westminster Chime Tubes, Pinned Drum & Hammers', category: 'Acoustic Chime Array', isOuter: false, explodeOffset: [0, 0.25, -1.55],
      desc: 'Nine graduated acoustic nickel-plated brass resonator tubes suspended from a cast soundboard rack, struck by 9 leather-faced brass hammers lifted by a pinned chime cylinder.',
      funFact: 'Every 15 minutes, the pinned brass drum plays the famous 4-note melody of Big Ben’s Westminster Quarters on the tuned tubes!',
      build(g) {
        rbox(g, 0.56, 0.038, 0.07, 0.008, brass, [0, 0.56, -0.14]);
        cyl(g, 0.036, 0.036, 0.28, 18, brass, [0.12, 0.58, -0.06], [0, 0, Math.PI / 2]);
        for (let i = -4; i <= 4; i++) {
          const len = 1.02 + i * 0.045;
          cyl(g, 0.015, 0.015, len, 14, steel, [i * 0.058, 0.54 - len * 0.5, -0.14]);
          rbox(g, 0.022, 0.024, 0.045, 0.005, brass, [i * 0.058, 0.49, -0.095]);
        }
      } },
    { id: 'cable-driven-brass-weights', name: 'Triple Brass-Sheathed Cast-Iron Driving Weights & Compounded Pulleys', category: 'Gravity Power', isOuter: false, explodeOffset: [-1.45, -0.15, 0],
      desc: 'Three heavy cast-iron weights inside polished brass cylinders (left: hour strike, center: time, right: Westminster chimes) hanging from braided steel cables and brass pulleys.',
      funFact: 'Grandfather clocks are powered by pure gravity—cranking the three weights up stores potential energy that drives all 10 gears and 9 chimes for 8 days!',
      build(g) {
        for (const [x, yOff] of [[-0.19, -0.14], [0, -0.24], [0.19, -0.08]]) {
          cyl(g, 0.068, 0.068, 0.38, 24, brass, [x, yOff, -0.02]);
          torus(g, 0.069, 0.006, steel, [x, yOff + 0.16, -0.02], [Math.PI / 2, 0, 0]);
          torus(g, 0.069, 0.006, steel, [x, yOff - 0.16, -0.02], [Math.PI / 2, 0, 0]);
          cyl(g, 0.030, 0.030, 0.020, 16, brass, [x, yOff + 0.22, -0.02], [Math.PI / 2, 0, 0]);
          cyl(g, 0.005, 0.005, 0.68, 8, steel, [x, yOff + 0.54, -0.02]);
        }
      } },
    { id: 'deadbeat-escapement-pendulum', name: '9-Rod Gridiron Lyre Pendulum, 220mm Brass Lenticular Bob & Beat Scale', category: 'Regulating Pendulum', isOuter: false, explodeOffset: [1.45, -0.25, 0],
      desc: '99.4-cm temperature-compensated 9-rod alternating brass-and-steel lyre gridiron pendulum with a 22-cm mirror-polished brass lenticular bob, rating nut, and silvered beat scale.',
      funFact: 'Metal expands when a room gets warm, which would make a normal pendulum swing slower—so alternating brass and steel rods cancel out thermal expansion automatically!',
      build(g) {
        for (let i = -4; i <= 4; i++) {
          cyl(g, 0.0055, 0.0055, 1.24, 10, i % 2 === 0 ? brass : steel, [i * 0.011, 0.0, 0.04]);
        }
        rbox(g, 0.12, 0.022, 0.02, 0.005, brass, [0, 0.38, 0.04]);
        rbox(g, 0.12, 0.022, 0.02, 0.005, brass, [0, -0.32, 0.04]);
        cyl(g, 0.21, 0.21, 0.048, 32, brass, [0, -0.64, 0.04], [Math.PI / 2, 0, 0]);
        sphere(g, 0.095, 20, 16, brass, [0, -0.64, 0.055]);
        cone(g, 0.018, 0.08, 12, brass, [0, -0.89, 0.04], [Math.PI, 0, 0]);
      } },
    { id: 'waisted-mahogany-trunk-glass-door', name: 'Waisted Mahogany Trunk Cabinet, Fluted Quarter Columns & Beveled Glass Door', category: 'Trunk Cabinet & Door', isOuter: true, explodeOffset: [0, -0.15, 1.45],
      desc: 'Tall mahogany trunk enclosure with acoustic backboard, quarter-fluted burl-walnut Corinthian pilasters, solid brass hinges, lockable keyhole escutcheon, and beveled crystal pendulum door.',
      funFact: 'The tall wooden trunk was invented in London in 1670 to shield the 1-meter pendulum and hanging weights from drafts, pets, and household dust!',
      build(g) {
        rbox(g, 0.70, 1.02, 0.05, 0.015, mahogany, [0, -0.14, -0.21]);
        for (const s of [-1, 1]) {
          rbox(g, 0.09, 1.02, 0.42, 0.015, mahogany, [s * 0.31, -0.14, -0.02]);
          cyl(g, 0.026, 0.026, 0.94, 16, burlWalnut, [s * 0.34, -0.14, 0.19]);
          cyl(g, 0.034, 0.034, 0.04, 16, brass, [s * 0.34, 0.34, 0.19]);
          cyl(g, 0.034, 0.034, 0.04, 16, brass, [s * 0.34, -0.62, 0.19]);
        }
        rbox(g, 0.50, 0.92, 0.022, 0.01, glassMat(0xe0f2fe, 0.24), [0, -0.14, 0.19]);
        rbox(g, 0.025, 0.06, 0.015, 0.005, brass, [0.24, -0.14, 0.205]);
      } },
    { id: 'carved-base-plinth-bracket-feet', name: 'Carved Mahogany Base Pedestal, Burl-Walnut Panel & Brass Ogee Feet', category: 'Base Pedestal', isOuter: true, explodeOffset: [0, -1.55, 0],
      desc: 'Heavy lower mahogany pedestal base with book-matched burl-walnut raised panel, stepped plinth molding, and 4 cast-brass leveling bracket feet keeping the clock plumb.',
      funFact: 'If a grandfather clock leans even 1 degree out of plumb, the anchor escapement goes "out of beat" (tick...tock-tick) and stops—so the base has micro-leveling feet!',
      build(g) {
        rbox(g, 0.90, 0.08, 0.56, 0.02, mahogany, [0, -1.08, 0]);
        rbox(g, 0.82, 0.42, 0.48, 0.025, mahogany, [0, -0.85, 0]);
        rbox(g, 0.62, 0.28, 0.03, 0.01, burlWalnut, [0, -0.85, 0.235]);
        for (const [fx, fz] of [[-0.40, -0.24], [0.40, -0.24], [-0.40, 0.24], [0.40, 0.24]]) {
          rbox(g, 0.10, 0.06, 0.10, 0.015, brass, [fx, -1.14, fz]);
        }
      } },
  ];
  return {
    id: 'grandfather-pendulum-clock', name: 'Longcase Westminster Pendulum Clock', brand: 'Classical Horology', badge: '1.000 Hz Pendulum • Gravity Driven • 10 Subsystems',
    desc: 'Heirloom mechanical longcase clock exploding into 10 horological and cabinet assemblies: removable swan-neck hood, arched brass dial, rotating moon-phase disc, twin brass movement plates & 10 gears, deadbeat anchor escapement, 9 Westminster chime tubes, 3 cable-driven brass weights, 9-rod gridiron lyre pendulum, beveled glass trunk, and burl-walnut base plinth.',
    cameraPos: [3.2, 1.8, 3.4], parts,
    quiz: [
      { q: 'What powers the gears of a traditional grandfather clock for 8 days without electricity?', correctId: 'cable-driven-brass-weights', distractors: ['deadbeat-escapement-pendulum', 'westminster-chime-tubes-hammers', 'moon-phase-dial-mahogany-case'] },
      { q: 'How long does it take a ~1-meter grandfather clock pendulum to swing from one side to the other?', correctId: 'deadbeat-escapement-pendulum', distractors: ['going-striking-gear-train', 'cable-driven-brass-weights', 'westminster-chime-tubes-hammers'] },
      { q: 'Which mechanism counts out the exact number of strikes at the top of each hour?', correctId: 'going-striking-gear-train', distractors: ['moon-phase-dial-mahogany-case', 'deadbeat-escapement-pendulum', 'cable-driven-brass-weights'] },
    ],
  };
}

function buildTernGsdModel() {
  const ternYellow = carPaint(0xf59e0b, { roughness: 0.18, metalness: 0.35, clearcoat: 1.0 });
  const matteBlack = mat(0x111827, { roughness: 0.55, metalness: 0.25 });
  const anodizedBlack = brushedMetal(0x1e293b, { roughness: 0.28, metalness: 0.82 });
  const alu = brushedMetal(0xd8dee9, { roughness: 0.22, metalness: 0.88 });
  const tireMat = mat(0x0f172a, { roughness: 0.85, metalness: 0.05 });
  const pannierCloth = mat(0x1f2937, { roughness: 0.78, metalness: 0.08 });
  const maguraYellow = carPaint(0xfacc15);

  const parts = [
    {
      id: 'updeck-lowstep-cargo-frame',
      name: 'Hydroformed 6061-AL UpDeck Low-Step Truss Frame & Integrated Longtail Atlas Rack',
      category: 'Cargo Frame & Chassis',
      isOuter: true,
      explodeOffset: [0, 0.85, 0],
      desc: 'Patented Tern GSD hydroformed aluminum spaceframe truss with an ultra-low 49 cm step-through height, welded rear longtail Atlas cargo deck (rated for 100 kg), rear vertical-parking feet, and frame-mounted Front Transporteur Rack.',
      funFact: 'Even though the Tern GSD can carry 200 kg (440 lbs)—including two kids or a full-grown adult passenger—it is the exact same length (180 cm) as a regular city bicycle and stands vertically on its tail to fit inside small apartment elevators!',
      build(g) {
        // Head tube at front (x=0.72, y=0.14)
        cyl(g, 0.036, 0.038, 0.28, 20, ternYellow, [0.72, 0.14, 0], [0, 0, -0.22]);
        // Low-step upper hydroformed downtube from headtube to low step-over cradle
        cyl(g, 0.032, 0.036, 0.64, 18, ternYellow, [0.46, -0.04, 0], [0, 0, 0.86]);
        // Lower heavy-duty spine tube from lower headtube to bottom bracket
        cyl(g, 0.036, 0.04, 0.82, 18, ternYellow, [0.39, -0.15, 0], [0, 0, 0.96]);
        // Internal UpDeck truss web gussets between upper and lower tubes
        for (const [gx, gy, ang] of [[0.54, -0.02, -0.55], [0.38, -0.11, 0.45], [0.24, -0.2, -0.5]]) {
          cyl(g, 0.016, 0.016, 0.16, 12, ternYellow, [gx, gy, 0], [0, 0, ang]);
        }
        // Step-through horizontal cradle bridge into bottom bracket
        rbox(g, 0.34, 0.075, 0.085, 0.022, ternYellow, [0.14, -0.28, 0], [0, 0, 0.22]);
        // Seat tube rising from bottom bracket (0.04, -0.34) to (-0.09, 0.26)
        cyl(g, 0.032, 0.036, 0.64, 18, ternYellow, [-0.02, -0.04, 0], [0, 0, 0.21]);
        // 2-stage telescopic Easy-Step seatpost + ergonomic saddle with rear lift handle
        cyl(g, 0.024, 0.027, 0.28, 16, anodizedBlack, [-0.08, 0.34, 0], [0, 0, 0.21]);
        rbox(g, 0.28, 0.055, 0.19, 0.022, matteBlack, [-0.13, 0.49, 0], [0, 0, 0.05]);
        torus(g, 0.045, 0.01, anodizedBlack, [-0.25, 0.47, 0], [Math.PI / 2, 0, 0]);

        // Integrated Longtail Rear Atlas Cargo Deck (welded frame truss from x=-0.06 to -1.26 at y=0.09)
        for (const z of [-0.11, 0.11]) {
          // Upper deck rails
          cyl(g, 0.02, 0.02, 1.22, 14, ternYellow, [-0.66, 0.09, z], [0, 0, Math.PI / 2]);
          // Lower chainstays from BB (0.04, -0.34) to rear axle (-0.92, -0.36) and rear vertical-stand bumper (-1.26, -0.24)
          cyl(g, 0.022, 0.024, 0.98, 14, ternYellow, [-0.44, -0.35, z * 0.95], [0, 0, 1.55]);
          cyl(g, 0.018, 0.02, 0.38, 12, ternYellow, [-1.09, -0.3, z], [0, 0, 1.24]);
          // Triangulated diagonal truss stays supporting the 100-kg rear cargo deck
          cyl(g, 0.018, 0.018, 0.56, 12, ternYellow, [-0.32, -0.12, z], [0, 0, -0.78]);
          cyl(g, 0.018, 0.018, 0.52, 12, ternYellow, [-0.72, -0.13, z], [0, 0, 0.62]);
          cyl(g, 0.018, 0.018, 0.48, 12, ternYellow, [-1.08, -0.09, z], [0, 0, -0.68]);
          // Vertical parking feet at x=-1.27 (allows standing bike upright on its tail)
          cyl(g, 0.022, 0.022, 0.06, 12, matteBlack, [-1.27, 0.09, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.022, 0.022, 0.06, 12, matteBlack, [-1.27, -0.24, z], [0, 0, Math.PI / 2]);
        }
        // Crossbars on the rear Atlas cargo deck
        for (const x of [-0.12, -0.36, -0.62, -0.88, -1.12, -1.25]) {
          cyl(g, 0.016, 0.016, 0.24, 12, ternYellow, [x, 0.09, 0], [Math.PI / 2, 0, 0]);
        }

        // Frame-mounted Front Transporteur Rack bolted to Head Tube Combo Mount
        rbox(g, 0.14, 0.08, 0.09, 0.015, anodizedBlack, [0.79, 0.12, 0]);
        rbox(g, 0.32, 0.03, 0.34, 0.01, anodizedBlack, [0.96, 0.08, 0]);
        for (const z of [-0.15, 0.15]) {
          cyl(g, 0.012, 0.012, 0.3, 10, anodizedBlack, [0.96, 0.18, z], [0, 0, Math.PI / 2]);
          cyl(g, 0.012, 0.012, 0.12, 10, anodizedBlack, [1.1, 0.13, z]);
          cyl(g, 0.012, 0.012, 0.12, 10, anodizedBlack, [0.83, 0.13, z]);
        }
        // Integrated Tern Valo Direct 190-lumen front LED headlight & Rear Brake Light
        cyl(g, 0.028, 0.028, 0.055, 16, anodizedBlack, [1.13, 0.09, 0], [0, 0, Math.PI / 2]);
        sphere(g, 0.024, 14, 14, emissiveMat(0xf8fafc, 2.4), [1.15, 0.09, 0]);
        rbox(g, 0.025, 0.04, 0.12, 0.008, emissiveMat(0xef4444, 2.2), [-1.27, 0.05, 0]);
      },
    },
    {
      id: 'twenty-inch-moto-x-wheels',
      name: '20-Inch Tern Atlas Cargo Wheels, Schwalbe Super Moto-X Tires & Full Mudguards',
      category: 'Wheels & Tires',
      isOuter: true,
      explodeOffset: [0, -1.25, 0],
      desc: 'Compact, ultra-strong 20-inch double-wall Tern Atlas wheels with 36 custom-forged stainless spokes, puncture-protected Schwalbe Super Moto-X 20×2.40" balloon tires, and SKS Chromoplastic full wraparound fenders.',
      funFact: 'Small 20-inch wheels are inherently stronger against heavy side-loads than full-size 26" or 29" wheels, while keeping the center of gravity of heavy cargo super low to the ground!',
      build(g) {
        for (const [wx, isRear] of [[0.90, false], [-0.92, true]]) {
          const w = new THREE.Group();
          w.position.set(wx, -0.36, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          // Beefy 20x2.4" Schwalbe Super Moto-X balloon tire (outer radius ~0.335m)
          torus(w, 0.268, 0.066, tireMat, [0, 0, 0], [0, 0, 0]);
          // Reflective safety sidewall stripe on Schwalbe tire
          torus(w, 0.255, 0.006, emissiveMat(0xe2e8f0, 0.6), [0, 0, 0.058], [0, 0, 0]);
          torus(w, 0.255, 0.006, emissiveMat(0xe2e8f0, 0.6), [0, 0, -0.058], [0, 0, 0]);
          // Double-wall black anodized 20" Tern Atlas rim
          torus(w, 0.212, 0.02, anodizedBlack, [0, 0, 0], [0, 0, 0]);
          // Heavy-duty thru-axle hub
          cyl(w, 0.042, 0.042, 0.13, 20, isRear ? anodizedBlack : alu, [0, 0, 0], [Math.PI / 2, 0, 0]);
          // 18 paired heavy-gauge spokes
          for (let i = 0; i < 18; i++) {
            const ang = (i / 18) * Math.PI * 2;
            const zOff = (i % 2 === 0 ? 1 : -1) * 0.028;
            cyl(w, 0.0038, 0.0038, 0.4, 8, alu, [Math.cos(ang) * 0.11, Math.sin(ang) * 0.11, zOff], [0, 0, ang + Math.PI / 2]);
          }
          // Full wraparound SKS Chromoplastic matte-black fender + mudflap
          const fenderArc = new THREE.Mesh(
            new THREE.TorusGeometry(0.352, 0.042, 12, 28, isRear ? Math.PI * 1.15 : Math.PI * 0.95),
            matteBlack
          );
          fenderArc.position.set(wx, -0.36, 0);
          fenderArc.rotation.z = isRear ? -0.15 : 0.22;
          g.add(fenderArc);
        }
      },
    },
    {
      id: 'bosch-cargo-line-mid-drive',
      name: 'Bosch Cargo Line 85Nm Smart Mid-Drive Motor & Gates CDX Carbon Belt Drive',
      category: 'Electric Powertrain',
      isOuter: false,
      explodeOffset: [0, -0.75, 1.35],
      desc: 'Mid-mounted Bosch Cargo Line electric motor delivering 85 Nm of torque and up to 400% pedal assist, driving the rear wheel through a grease-free Gates Carbon Drive CDX synchronous belt and heavy-duty internal gear hub.',
      funFact: 'The Bosch Cargo Line motor measures your pedal torque, cadence, and bike speed 1,000 times per second—giving you up to 4× your own leg strength even when starting from a dead stop on a steep hill with two kids on the back!',
      build(g) {
        // Bosch Cargo Line motor housing at bottom bracket (x=0.05, y=-0.34, z=0)
        rbox(g, 0.24, 0.17, 0.15, 0.045, anodizedBlack, [0.05, -0.34, 0], [0, 0, -0.18]);
        cyl(g, 0.078, 0.078, 0.16, 22, matteBlack, [0.04, -0.34, 0], [Math.PI / 2, 0, 0]);
        // Bosch silver cooling fins & red/silver motor badge
        cyl(g, 0.052, 0.052, 0.168, 20, alu, [0.04, -0.34, 0], [Math.PI / 2, 0, 0]);
        // Crankarms + platform pedals
        rbox(g, 0.18, 0.028, 0.018, 0.006, anodizedBlack, [0.11, -0.34, 0.1], [0, 0, -0.35]);
        rbox(g, 0.18, 0.028, 0.018, 0.006, anodizedBlack, [-0.03, -0.34, -0.1], [0, 0, -0.35]);
        rbox(g, 0.09, 0.02, 0.08, 0.005, matteBlack, [0.18, -0.39, 0.15]);
        rbox(g, 0.09, 0.02, 0.08, 0.005, matteBlack, [-0.1, -0.29, -0.15]);
        // Gates CDX front belt sprocket & rear hub sprocket (z = 0.082)
        torus(g, 0.092, 0.012, alu, [0.04, -0.34, 0.082], [0, 0, 0]);
        torus(g, 0.068, 0.012, alu, [-0.92, -0.36, 0.082], [0, 0, 0]);
        // Upper and lower Gates Carbon Drive belt runs + protective Chainblade cover
        box(g, 0.96, 0.012, 0.016, matteBlack, [-0.44, -0.26, 0.082], [0, 0, 0.025]);
        box(g, 0.96, 0.012, 0.016, matteBlack, [-0.44, -0.43, 0.082], [0, 0, -0.015]);
        rbox(g, 1.04, 0.12, 0.035, 0.02, matteBlack, [-0.42, -0.31, 0.096], [0, 0, 0.02]);
      },
    },
    {
      id: 'bosch-dual-battery-1000wh',
      name: 'Bosch DualBattery 1,000 Wh Frame-Mounted Lithium-Ion Packs & Smart BMS',
      category: 'Battery & Range',
      isOuter: false,
      explodeOffset: [-0.65, 0.45, -1.35],
      desc: 'Dual Bosch PowerPack 500 Wh batteries (1,000 Wh combined capacity) tucked securely into the space between the seat tube and rear 20" wheel, alternating discharge automatically for up to 206 km (128 mi) of range.',
      funFact: 'Bosch’s DualBattery computer switches back and forth between the two batteries in tiny increments as you ride so both packs age evenly and never overheat!',
      build(g) {
        // Pack 1 tucked directly behind the seat tube
        rbox(g, 0.11, 0.34, 0.1, 0.022, matteBlack, [-0.14, -0.11, 0], [0, 0, 0.21]);
        rbox(g, 0.115, 0.06, 0.104, 0.01, ternYellow, [-0.11, 0.02, 0], [0, 0, 0.21]);
        // Pack 2 mounted right behind Pack 1 in the dual-battery cradle
        rbox(g, 0.11, 0.34, 0.1, 0.022, matteBlack, [-0.27, -0.14, 0], [0, 0, 0.21]);
        rbox(g, 0.115, 0.06, 0.104, 0.01, anodizedBlack, [-0.24, -0.01, 0], [0, 0, 0.21]);
        // 5 LED charge-level indicators on both packs
        for (let i = 0; i < 5; i++) {
          sphere(g, 0.008, 10, 10, emissiveMat(0x22c55e, 1.8), [-0.12, -0.05 + i * 0.022, 0.055]);
          sphere(g, 0.008, 10, 10, emissiveMat(0x22c55e, 1.8), [-0.25, -0.08 + i * 0.022, 0.055]);
        }
        // High-current orange/black harness down to Bosch motor
        buildWiringHarness(g, [[-0.27, -0.28, 0.04], [-0.14, -0.31, 0.05], [0.02, -0.34, 0.04]], { radius: 0.01, color: 0xf97316 });
      },
    },
    {
      id: 'physis-3d-folding-cockpit',
      name: 'Tern Physis 3D Folding Handlepost, Andros Twin-Stem & Bosch Kiox Cockpit',
      category: 'Folding Cockpit & Controls',
      isOuter: true,
      explodeOffset: [1.15, 1.05, 0],
      desc: '3D-forged single-piece aluminum Physis 3D folding handlepost with patented OCL+ locking hinge, tool-free Andros adjustable twin-stem, swept riser handlebars, Ergon grips, and Bosch Kiox color display.',
      funFact: 'The Physis 3D handlepost folds flat in 5 seconds so the bike fits inside a minivan or SUV, and the tool-free Andros stem adjusts in seconds to fit riders from 4\'11" (150 cm) to 6\'5" (195 cm)!',
      build(g) {
        // OCL+ heavy-duty folding hinge clamp right above headtube (0.68, 0.28)
        cyl(g, 0.042, 0.042, 0.08, 20, anodizedBlack, [0.68, 0.29, 0], [0, 0, -0.2]);
        rbox(g, 0.06, 0.05, 0.095, 0.012, ternYellow, [0.69, 0.29, 0.02], [0, 0, -0.2]);
        // Tall tapered 3D-forged vertical Physis handlepost rising to y=0.72
        cyl(g, 0.026, 0.034, 0.46, 18, anodizedBlack, [0.61, 0.51, 0], [0, 0, -0.18]);
        // Tern Andros adjustable twin-stem extending forward/up to handlebar
        for (const z of [-0.032, 0.032]) {
          rbox(g, 0.14, 0.032, 0.018, 0.008, alu, [0.62, 0.75, z], [0, 0, 0.35]);
        }
        // Swept-back comfort handlebar + Ergon wing grips
        cyl(g, 0.014, 0.014, 0.64, 14, anodizedBlack, [0.66, 0.78, 0], [Math.PI / 2, 0, 0]);
        for (const z of [-0.3, 0.3]) {
          cyl(g, 0.02, 0.018, 0.13, 14, matteBlack, [0.63, 0.78, z], [Math.PI / 2, 0.22 * Math.sign(z), 0]);
          // Magura brake levers
          rbox(g, 0.08, 0.016, 0.02, 0.005, anodizedBlack, [0.69, 0.77, z * 0.78], [0, -0.25 * Math.sign(z), 0]);
        }
        // Center Bosch Kiox 300 color cockpit display
        rbox(g, 0.055, 0.075, 0.048, 0.008, screenMat('dashboard'), [0.68, 0.82, 0], [0, 0, -0.45]);
      },
    },
    {
      id: 'suntour-cargo-suspension-fork',
      name: 'SR Suntour Custom 20" Cargo Coil Suspension Fork & Thru-Axle Crown',
      category: 'Front Suspension',
      isOuter: false,
      explodeOffset: [1.35, -0.25, 0],
      desc: 'Custom-tuned SR Suntour XCM32-Cargo 20-inch suspension fork with 70 mm travel, forged aluminum crown, 32 mm steel stanchions, and 15 mm thru-axle lowers rated for 200 kg gross vehicle weight.',
      funFact: 'Standard bicycle suspension forks flex under heavy cargo braking—so Tern and SR Suntour engineered a custom 20-inch motorcycle-grade fork crown and 32 mm stanchions specifically for the GSD!',
      build(g) {
        // Forged fork crown at (0.76, -0.02)
        rbox(g, 0.085, 0.045, 0.19, 0.015, anodizedBlack, [0.76, -0.01, 0], [0, 0, -0.22]);
        // Fork steerer + upper stanchions + lower magnesium sliders down to front axle (0.90, -0.36)
        for (const z of [-0.075, 0.075]) {
          cyl(g, 0.017, 0.017, 0.18, 14, chromeMat(), [0.8, -0.1, z], [0, 0, -0.38]);
          cyl(g, 0.023, 0.021, 0.24, 16, matteBlack, [0.86, -0.26, z], [0, 0, -0.38]);
        }
        // Lower fork arch brace over the 20" front tire
        torus(g, 0.082, 0.015, matteBlack, [0.83, -0.16, 0], [0, Math.PI / 2, -0.38]);
      },
    },
    {
      id: 'clubhouse-plus-passenger-cage',
      name: 'Tern Clubhouse+ Passenger Safety Bars, Dual Seat Pads & Sidekick Wide Decks',
      category: 'Passenger & Kid System',
      isOuter: true,
      explodeOffset: [-1.25, 0.95, 0],
      desc: 'Modular aluminum Clubhouse+ wraparound safety rail system ("Kid Cage") supporting two Thule Yepp child seats or two padded Clubhouse seat cushions with backrest, paired with lower Sidekick Wide Decks footrests.',
      funFact: 'In 30 seconds without tools, the Clubhouse+ rails convert from carrying two kids to holding four standard 600×400 mm Eurocrates of groceries or deliveries!',
      build(g) {
        // Upper Clubhouse+ safety rail loop around rear deck (x = -0.30 to -1.24, y = 0.34, z = ±0.22)
        for (const z of [-0.22, 0.22]) {
          cyl(g, 0.015, 0.015, 0.94, 12, anodizedBlack, [-0.77, 0.34, z], [0, 0, Math.PI / 2]);
          // Vertical posts down to rear Atlas deck (y = 0.09 to 0.34)
          cyl(g, 0.015, 0.015, 0.26, 12, anodizedBlack, [-0.36, 0.21, z]);
          cyl(g, 0.015, 0.015, 0.26, 12, anodizedBlack, [-1.16, 0.21, z]);
        }
        // Front & rear crossbars + extended child-hand Protection Bar wings
        cyl(g, 0.015, 0.015, 0.44, 12, anodizedBlack, [-0.3, 0.34, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.015, 0.015, 0.44, 12, anodizedBlack, [-1.24, 0.34, 0], [Math.PI / 2, 0, 0]);
        // Inner passenger grab handle bar behind front rider saddle
        cyl(g, 0.014, 0.014, 0.34, 12, matteBlack, [-0.34, 0.39, 0], [Math.PI / 2, 0, 0]);
        // Two plush Clubhouse+ passenger seat cushions + rear backrest pad
        rbox(g, 0.34, 0.055, 0.22, 0.018, matteBlack, [-0.56, 0.13, 0]);
        rbox(g, 0.34, 0.055, 0.22, 0.018, matteBlack, [-0.96, 0.13, 0]);
        rbox(g, 0.06, 0.18, 0.26, 0.018, matteBlack, [-1.2, 0.26, 0]);
        // Lower Sidekick Wide Decks (running board footrests at y = -0.37, z = ±0.21)
        for (const z of [-0.21, 0.21]) {
          rbox(g, 0.72, 0.024, 0.11, 0.008, anodizedBlack, [-0.82, -0.37, z]);
        }
      },
    },
    {
      id: 'cargo-hold-52-panniers',
      name: 'Tern Cargo Hold 52L Weatherproof Pannier Bags & Rear Wheel-Guard Skirts',
      category: 'Cargo & Weather Gear',
      isOuter: true,
      explodeOffset: [-1.15, -0.15, 1.45],
      desc: 'Pair of oversized 52-liter waterproof roll-top Cargo Hold panniers (104 L combined trunk capacity) with Fidlock magnetic buckles and protective mesh wheel-guard skirts keeping passenger feet away from spokes.',
      funFact: 'The two Cargo Hold 52 panniers hold as much as the trunk of a compact hatchback car—and fold completely flat against the frame when empty!',
      build(g) {
        for (const side of [-1, 1]) {
          // Protective mesh wheel skirt over upper rear wheel quadrant
          rbox(g, 0.56, 0.28, 0.012, 0.005, matteBlack, [-0.82, -0.12, side * 0.115]);
          // 52L Cargo Hold pannier bag slung along the rear rack above the Sidekick Wide Deck
          rbox(g, 0.62, 0.36, 0.13, 0.032, pannierCloth, [-0.82, -0.11, side * 0.2]);
          // Fold-over roll-top flap + Tern high-vis yellow reflective stripe
          rbox(g, 0.64, 0.07, 0.14, 0.02, anodizedBlack, [-0.82, 0.05, side * 0.202]);
          rbox(g, 0.54, 0.032, 0.01, 0.004, maguraYellow, [-0.82, -0.12, side * 0.268]);
          // Twin Fidlock vertical strap buckles
          for (const bx of [-0.66, -0.98]) {
            rbox(g, 0.035, 0.26, 0.012, 0.003, anodizedBlack, [bx, -0.08, side * 0.268]);
          }
        }
      },
    },
    {
      id: 'atlas-lockstand-kickstand',
      name: 'Patented Atlas Lockstand Dual-Leg Auto-Locking Center Kickstand',
      category: 'Parking & Stability',
      isOuter: false,
      explodeOffset: [0, -1.35, -0.95],
      desc: 'Heavy-duty hydroformed dual-leg center stand rated for 80 kg (176 lbs) that automatically locks into place when deployed and unlocks via a remote lever on the handlebar.',
      funFact: 'Unlike a normal side kickstand that leans the bike over, the Atlas Lockstand lifts the rear wheel upright on two wide legs and locks with steel pins so children can climb aboard safely!',
      build(g) {
        rbox(g, 0.12, 0.06, 0.16, 0.015, anodizedBlack, [-0.14, -0.39, 0]);
        for (const z of [-0.17, 0.17]) {
          cyl(g, 0.018, 0.016, 0.34, 12, anodizedBlack, [-0.18, -0.52, z * 0.78], [-0.35 * Math.sign(z), 0, -0.15]);
          // Wide composite Lockstand foot pads sitting right on the ground plane
          rbox(g, 0.11, 0.028, 0.065, 0.008, matteBlack, [-0.21, -0.66, z]);
        }
      },
    },
    {
      id: 'magura-mt5-quad-piston-brakes',
      name: 'Magura MT5 eSTOP 4-Piston Hydraulic Cargo Disc Calipers & 180mm Rotors',
      category: 'Braking System',
      isOuter: false,
      explodeOffset: [0.45, -0.65, -1.35],
      desc: 'Motorcycle-derived Magura MT5 eSTOP 4-piston forged monobloc hydraulic disc calipers clamping 180 mm MDR-C heavy-duty stainless rotors front and rear.',
      funFact: 'Stopping a 200-kg loaded cargo bike down a steep San Francisco hill requires 4-piston hydraulic calipers originally developed for racing motorcycles!',
      build(g) {
        for (const [wx, cy] of [[0.90, -0.26], [-0.92, -0.26]]) {
          // 180mm vented stainless disc rotor on left side of hub (z = -0.072)
          cyl(g, 0.11, 0.11, 0.008, 28, chromeMat(), [wx, -0.36, -0.072], [Math.PI / 2, 0, 0]);
          torus(g, 0.095, 0.012, alu, [wx, -0.36, -0.072], [0, 0, 0]);
          // Magura MT5 4-piston caliper body + iconic Magura yellow piston rings
          rbox(g, 0.085, 0.052, 0.045, 0.012, anodizedBlack, [wx - 0.07, cy, -0.072], [0, 0, 0.45]);
          torus(g, 0.014, 0.004, maguraYellow, [wx - 0.08, cy, -0.096], [0, 0, 0]);
          torus(g, 0.014, 0.004, maguraYellow, [wx - 0.055, cy - 0.01, -0.096], [0, 0, 0]);
        }
      },
    },
  ];

  return {
    id: 'tern-gsd-cargo-ebike',
    name: 'Tern GSD S10 Electric Cargo Bike',
    brand: 'Tern Bicycles / Bosch eBike Systems',
    badge: '200 kg Gross Load • Bosch Cargo Line 85Nm • DualBattery 1000Wh',
    desc: 'Flagship compact utility longtail electric cargo bicycle engineered to replace a family car—featuring 20" Atlas wheels, a hydroformed UpDeck low-step truss frame, Bosch Cargo Line 85Nm mid-drive motor, 1,000 Wh DualBattery system, Physis 3D folding cockpit, Clubhouse+ passenger safety cage, Cargo Hold 52L panniers, and Atlas Lockstand.',
    cameraPos: [3.1, 1.65, 3.1],
    parts,
    quiz: [
      { q: 'Why does the Tern GSD use compact 20-inch wheels instead of full-size 26" or 29" wheels?', correctId: 'twenty-inch-moto-x-wheels', distractors: ['physis-3d-folding-cockpit', 'magura-mt5-quad-piston-brakes', 'suntour-cargo-suspension-fork'] },
      { q: 'Which mid-mounted electric motor delivers 85 Nm of torque and up to 400% pedal assist?', correctId: 'bosch-cargo-line-mid-drive', distractors: ['bosch-dual-battery-1000wh', 'atlas-lockstand-kickstand', 'updeck-lowstep-cargo-frame'] },
      { q: 'Which auto-locking dual-leg mechanism keeps the Tern GSD stable while loading two kids onto the rear rack?', correctId: 'atlas-lockstand-kickstand', distractors: ['clubhouse-plus-passenger-cage', 'cargo-hold-52-panniers', 'suntour-cargo-suspension-fork'] },
      { q: 'Which rear safety rail system converts between carrying two child passengers and holding four Eurocrates?', correctId: 'clubhouse-plus-passenger-cage', distractors: ['physis-3d-folding-cockpit', 'updeck-lowstep-cargo-frame', 'cargo-hold-52-panniers'] },
    ],
  };
}

function buildCarbonRoadBikeModel() {
  const carbon = carbonFiberMat([6, 6]);
  const red = carPaint(0xdc2626);
  const steel = chromeMat();
  const alu = brushedMetal(0xd8dee9, { metalness: 0.9, roughness: 0.16 });
  const goldTi = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.14 });
  const matteBlack = mat(0x111827, { roughness: 0.65 });

  const parts = [
    {
      id: 'monocoque-carbon-frame-fork',
      name: 'Toray T1100 Monocoque Carbon Aero Frame & Internal Cable Routing (CAD)',
      category: 'Frame & Aero',
      isOuter: true,
      explodeOffset: [0, 1.25, 0],
      desc: 'Real Three.js CarbonFrameBike CAD Kamm-tail carbon main triangle, dropped aero seatstays, bottom bracket shell, and internal Di2/hydraulic routing.',
      funFact: 'High-modulus carbon-fiber road frames weigh under 700 grams—less than a full water bottle—yet survive 100+ km/h mountain descents!',
      build(g) {
        populateBikeCad(g, { zone: 'frame' });
        cyl(g, 0.032, 0.038, 1.15, 16, carbon, [0, 0.28, 0], [0, 0, 1.42]);
      },
    },
    {
      id: 'bladed-aero-carbon-fork',
      name: 'Bladed Carbon Aero Fork, Tapered Ceramic Headset & Thru-Axle Dropouts',
      category: 'Front Suspension & Steering',
      isOuter: true,
      explodeOffset: [1.15, 0.35, 0],
      desc: 'Wind-tunnel-sculpted deep-section carbon fork blades, 1-1/8" to 1-1/2" tapered ceramic headset bearings, internal front brake hose channel, and 12×100mm thru-axle.',
      funFact: 'Aero fork blades are spaced slightly wider apart so turbulent air spinning off the front wheel flows smoothly past the frame without stalling!',
      build(g) {
        for (const z of [-0.048, 0.048]) {
          rbox(g, 0.065, 0.48, 0.018, 0.006, carbon, [0.68, 0.04, z], [0, 0, -0.34]);
        }
        cyl(g, 0.024, 0.028, 0.18, 16, carbon, [0.58, 0.36, 0], [0, 0, -0.34]);
        torus(g, 0.028, 0.006, goldTi, [0.55, 0.44, 0], [Math.PI / 2, 0, -0.34]);
        cyl(g, 0.008, 0.008, 0.13, 12, alu, [0.78, -0.2, 0], [Math.PI / 2, 0, 0]);
      },
    },
    {
      id: 'aero-cockpit-saddle-seatpost',
      name: 'Integrated One-Piece Carbon Aero Bar-Stem, STI Shifters & Out-Front GPS (CAD)',
      category: 'Cockpit & Controls',
      isOuter: true,
      explodeOffset: [0.95, 1.15, 0],
      desc: 'Real CAD one-piece aerodynamic carbon drop handlebar, wireless dual-control shift/brake levers, perforated bar tape, and out-front GPS computer mount.',
      funFact: 'Routing brake hoses completely inside the handlebar and stem saves up to 8 watts of aerodynamic drag at 45 km/h!',
      build(g) {
        populateBikeCad(g, { zone: 'cockpit-fork' });
        rbox(g, 0.16, 0.04, 0.42, 0.015, carbon, [0.56, 0.56, 0]);
        // Out-front aero cycling GPS computer displaying live watts, cadence & heart rate
        rbox(g, 0.085, 0.016, 0.052, 0.005, screenMat('dashboard'), [0.68, 0.58, 0], [0, 0, -0.15]);
        for (const z of [-0.19, 0.19]) {
          rbox(g, 0.09, 0.12, 0.028, 0.008, matteBlack, [0.64, 0.54, z], [0, 0, -0.25]);
        }
      },
    },
    {
      id: 'd-profile-seatpost-3d-saddle',
      name: 'D-Shaped Aero Carbon Seatpost, Internal Di2 Battery & 3D-Printed Lattice Saddle',
      category: 'Saddle & Electronics',
      isOuter: true,
      explodeOffset: [-0.85, 1.25, 0],
      desc: 'Truncated-airfoil D-profile carbon seatpost housing the cylindrical 7.4V lithium-ion Di2 battery pack, topped by a carbon-rail 3D-printed elastomeric lattice saddle.',
      funFact: 'Instead of foam, pro saddles use a 3D-printed honeycomb polymer lattice tuned with softer zones under sit-bones and firmer support at the nose!',
      build(g) {
        rbox(g, 0.052, 0.34, 0.028, 0.008, carbon, [-0.32, 0.46, 0], [0, 0, 0.28]);
        // Cylindrical internal Di2 lithium battery inside seatpost
        cyl(g, 0.01, 0.01, 0.16, 12, carPaint(0x2563eb), [-0.28, 0.36, 0], [0, 0, 0.28]);
        // Carbon-rail 3D-printed saddle
        rbox(g, 0.28, 0.036, 0.14, 0.014, matteBlack, [-0.38, 0.62, 0]);
        for (const z of [-0.022, 0.022]) {
          cyl(g, 0.004, 0.004, 0.18, 8, carbon, [-0.37, 0.59, z], [0, 0, Math.PI / 2]);
        }
      },
    },
    {
      id: 'hollow-crankset-power-meter',
      name: 'Hollow-Forged 54/40T Crankset, Dual-Sided Power Meter Spider & Ceramic BB',
      category: 'Crankset & Power Meter',
      isOuter: false,
      explodeOffset: [0.25, -0.65, 1.35],
      desc: 'Hollow-bonded 172.5mm crankarms, CNC-machined 54/40T aero outer/inner chainrings, strain-gauge power meter spider accurate to ±1%, and ceramic-bearing bottom bracket.',
      funFact: 'Microscopic strain gauges inside the crank spider measure how much the metal flexes 200 times per second to calculate exact rider power in Watts!',
      build(g) {
        // Bottom bracket shell + ceramic bearing cups + 24mm titanium spindle
        cyl(g, 0.028, 0.028, 0.095, 20, red, [-0.08, -0.22, 0], [Math.PI / 2, 0, 0]);
        cyl(g, 0.014, 0.014, 0.13, 16, goldTi, [-0.08, -0.22, 0], [Math.PI / 2, 0, 0]);
        // 54T outer & 40T inner chainrings + strain-gauge spider LED pod
        torus(g, 0.115, 0.012, carbon, [-0.08, -0.22, 0.055], [0, 0, 0]);
        torus(g, 0.085, 0.009, alu, [-0.08, -0.22, 0.048], [0, 0, 0]);
        rbox(g, 0.18, 0.034, 0.016, 0.006, carbon, [-0.01, -0.22, 0.068], [0, 0, -0.35]);
        rbox(g, 0.18, 0.034, 0.016, 0.006, carbon, [-0.15, -0.22, -0.068], [0, 0, -0.35]);
      },
    },
    {
      id: 'clipless-carbon-pedals',
      name: 'Carbon-Body SPD-SL Clipless Road Pedals & Hollow Titanium Spindles',
      category: 'Pedals & Contact Points',
      isOuter: false,
      explodeOffset: [0.55, -0.95, 1.45],
      desc: 'Wide-platform injection-molded carbon clipless pedals with stainless-steel cleat wear plates, adjustable spring-loaded retention jaws, and hollow titanium axles.',
      funFact: 'Clipping carbon-soled cycling shoes directly into spring-loaded pedal jaws lets a sprinter pull UP as well as push DOWN at 1,800 watts!',
      build(g) {
        for (const [px, py, pz] of [[0.06, -0.25, 0.105], [-0.22, -0.19, -0.105]]) {
          cyl(g, 0.006, 0.006, 0.055, 10, goldTi, [px, py, pz], [Math.PI / 2, 0, 0]);
          rbox(g, 0.075, 0.018, 0.065, 0.005, carbon, [px, py, pz + Math.sign(pz) * 0.02]);
          rbox(g, 0.035, 0.02, 0.05, 0.003, steel, [px, py + 0.004, pz + Math.sign(pz) * 0.02]);
        }
      },
    },
    {
      id: 'electronic-derailleur-crankset',
      name: '12-Speed Wireless Electronic Derailleurs, 11-30T Titanium Cassette & Chain (CAD)',
      category: 'Electronic Drivetrain',
      isOuter: false,
      explodeOffset: [-0.55, -0.65, 1.35],
      desc: 'Real CAD 12-speed roller chain, 11-30T hyperglide cassette, front braze-on electronic yaw derailleur, and rear servo derailleur with oversized ceramic pulley cage.',
      funFact: 'A modern waxed bicycle chain transfers 98.6% of the rider’s leg power directly to the rear tire—more efficient than almost any car transmission!',
      build(g) {
        populateBikeCad(g, { zone: 'drivetrain' });
        torus(g, 0.16, 0.016, steel, [-0.08, -0.22, 0.09], [0, 0, 0]);
        // Oversized ceramic pulley wheel cage on rear derailleur
        for (const py of [-0.28, -0.35]) {
          torus(g, 0.024, 0.005, red, [-0.78, py, 0.085], [0, 0, 0]);
        }
      },
    },
    {
      id: 'hydraulic-disc-brakes',
      name: 'Flat-Mount Hydraulic Disc Calipers & 160mm Ice-Tech Centerlock Rotors (CAD)',
      category: 'Braking System',
      isOuter: false,
      explodeOffset: [0, 0.45, -1.35],
      desc: 'Real CAD mineral-oil hydraulic brake levers, internal hoses, 2-piston monobloc magnesium calipers, finned cooling pads, and 160mm stainless-aluminum-stainless sandwich rotors.',
      funFact: 'Disc brakes moved stopping power from the fragile carbon wheel rim to a hub rotor with aluminum cooling fins that works equally well in pouring rain!',
      build(g) {
        populateBikeCad(g, { zone: 'brakes' });
        for (const x of [-0.78, 0.78]) {
          torus(g, 0.14, 0.012, steel, [x, -0.2, -0.06], [0, 0, 0]);
          rbox(g, 0.065, 0.042, 0.036, 0.008, matteBlack, [x - 0.08, -0.12, -0.06]);
        }
      },
    },
    {
      id: 'deep-section-carbon-wheelset',
      name: '50mm Deep-Section Carbon Tubeless Wheelset, Bladed Spokes & 28c Tires (CAD)',
      category: 'Wheels & Tires',
      isOuter: true,
      explodeOffset: [0, -1.25, 0],
      desc: 'Real CAD front and rear spoked wheels with 50mm toroidal carbon rims, 24 bladed straight-pull aero spokes, 54T star-ratchet freehub, and 28mm tubeless silica slick tires.',
      funFact: 'Every bicycle wheel is a pre-tensioned suspension bridge—the rim hangs from the top spokes rather than resting on the bottom ones!',
      build(g) {
        populateBikeCad(g, { zone: ['front-wheel', 'rear-wheel'] });
        for (const x of [-0.78, 0.78]) {
          const w = new THREE.Group();
          w.position.set(x, -0.2, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          torus(w, 0.36, 0.038, mat(0x0f172a), [0, 0, 0], [0, 0, 0]);
          torus(w, 0.31, 0.022, red, [0, 0, 0], [0, 0, 0]);
        }
      },
    },
    {
      id: 'aero-carbon-bottle-cages-bidons',
      name: 'Wind-Tunnel Aero Carbon Water Bottle Cages & Dual 550ml Pro Bidons',
      category: 'Hydration & Frame Aero',
      isOuter: false,
      explodeOffset: [0.15, 0.55, -1.15],
      desc: 'Twin 18-gram injection-molded carbon cages bolted to the downtube and seattube bosses, holding aerodynamic dimpled 550ml pro team hydration bidons.',
      funFact: 'In wind-tunnel tests, a modern aero road bike is actually FASTER with water bottles installed because they fill the air gap inside the frame triangle!',
      build(g) {
        // Downtube & seattube carbon bottle cages + red/white team bidons
        const positions = [
          { pos: [0.14, 0.04, 0], rot: [0, 0, -0.78] },
          { pos: [-0.14, 0.06, 0], rot: [0, 0, 0.32] },
        ];
        for (const { pos, rot } of positions) {
          rbox(g, 0.055, 0.16, 0.055, 0.015, carbon, pos, rot);
          cyl(g, 0.034, 0.032, 0.18, 18, mat(0xf8fafc, { roughness: 0.3 }), pos, rot);
          cyl(g, 0.026, 0.034, 0.035, 16, red, [pos[0] + 0.02, pos[1] + 0.09, pos[2]], rot);
        }
      },
    },
  ];
  return {
    id: 'carbon-aero-road-bike',
    name: 'Tour-Grade Carbon Aero Bike',
    brand: 'Pro Peloton / Three.js CAD',
    badge: '6.8 kg UCI Limit • 12-Speed Di2 • Power Meter • Real CAD',
    desc: 'Ultra-lightweight 10-part carbon-fiber WorldTour racing bicycle built from the Three.js CarbonFrameBike CAD with bladed aero fork, integrated bar-stem cockpit, 3D-printed lattice saddle, dual-sided power meter crankset, clipless carbon pedals, 12-speed electronic drivetrain, flat-mount hydraulic disc brakes, 50mm wheelset, and aero bidons.',
    cameraPos: [3.2, 1.8, 3.2],
    parts,
    quiz: [
      { q: 'Why are carbon-fiber bicycle frames both feather-light and stiff under pedaling loads?', correctId: 'monocoque-carbon-frame-fork', distractors: ['hydraulic-disc-brakes', 'deep-section-carbon-wheelset', 'electronic-derailleur-crankset'] },
      { q: 'Which subsystem transfers 98.6% of the rider’s pedal torque to the rear wheel?', correctId: 'electronic-derailleur-crankset', distractors: ['monocoque-carbon-frame-fork', 'hydraulic-disc-brakes', 'deep-section-carbon-wheelset'] },
      { q: 'How does the crankset measure a cyclist’s exact pedaling output in Watts?', correctId: 'hollow-crankset-power-meter', distractors: ['clipless-carbon-pedals', 'd-profile-seatpost-3d-saddle', 'aero-carbon-bottle-cages-bidons'] },
      { q: 'Why did pro road bikes switch from rim brakes to hub-mounted hydraulic rotors?', correctId: 'hydraulic-disc-brakes', distractors: ['deep-section-carbon-wheelset', 'monocoque-carbon-frame-fork', 'electronic-derailleur-crankset'] },
    ],
  };
}

function buildDucatiPanigaleModel() {
  const ducatiRed = carPaint(0xd40000);
  const corseWhite = carPaint(0xf8fafc);
  const ohlinsGold = brushedMetal(0xf59e0b, { metalness: 0.92, roughness: 0.14 });
  const magnesiumBronze = brushedMetal(0x926c44, { metalness: 0.86, roughness: 0.24 });
  const alu = brushedMetal(0xd8dee9, { metalness: 0.90, roughness: 0.18 });
  const darkMetal = brushedMetal(0x1e293b, { metalness: 0.85, roughness: 0.26 });
  const titanium = brushedMetal(0x94a3b8, { metalness: 0.92, roughness: 0.20 });
  const heatBlueTi = brushedMetal(0x60a5fa, { metalness: 0.92, roughness: 0.18 });
  const carbon = carbonFiberMat([6, 6]);
  const tireRubber = mat(0x0f172a, { roughness: 0.78 });
  const alcantara = mat(0x111827, { roughness: 0.88 });

  const parts = [
    { id: 'desmosedici-v4-engine', name: '998cc 90° Desmosedici Stradale R V4 Engine & Open STM Dry Clutch (CAD)', category: 'Powertrain', isOuter: false, explodeOffset: [0, -0.45, 1.35],
      desc: '90° V4 stressed-member engine block with 42° rearward-tilted cylinder banks, magnesium cam covers, STM EVO-SBK open dry clutch with exposed red springs, and dual curved radiator/oil cooler cores.',
      funFact: 'At 16,500 RPM in 6th gear, steel valve springs would float—so Ducati uses a second "Desmodromic" cam lobe to mechanically pull every titanium valve shut!',
      build(g) {
        populateEngineCad(g, { pos: [0.12, -0.06, 0], scale: 0.00052, accentColor: 0xd40000 });
        // Crankcase & 90° V4 front/rear cylinder banks tilted 42° rearward
        rbox(g, 0.34, 0.24, 0.24, 0.03, darkMetal, [0.08, -0.11, 0]);
        // Front cylinder bank (tilted forward) & Rear cylinder bank (tilted rearward) with bronze magnesium Desmo cam covers
        rbox(g, 0.18, 0.22, 0.23, 0.02, alu, [0.24, 0.02, 0], [0, 0, -0.58]);
        rbox(g, 0.19, 0.045, 0.24, 0.01, magnesiumBronze, [0.31, 0.09, 0], [0, 0, -0.58]);
        rbox(g, 0.18, 0.22, 0.23, 0.02, alu, [0.02, 0.08, 0], [0, 0, 0.72]);
        rbox(g, 0.19, 0.045, 0.24, 0.01, magnesiumBronze, [-0.05, 0.15, 0], [0, 0, 0.72]);
        // Right-side STM EVO-SBK open dry clutch with slotted carbon housing, red anodized pressure plate & 6 coil springs
        cyl(g, 0.11, 0.11, 0.045, 24, magnesiumBronze, [0.02, -0.13, 0.135], [Math.PI / 2, 0, 0]);
        torus(g, 0.088, 0.014, carbon, [0.02, -0.13, 0.162]);
        cyl(g, 0.068, 0.068, 0.018, 20, ducatiRed, [0.02, -0.13, 0.158], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          cyl(g, 0.012, 0.012, 0.024, 10, ohlinsGold, [0.02 + Math.cos(a) * 0.044, -0.13 + Math.sin(a) * 0.044, 0.165], [Math.PI / 2, 0, 0]);
        }
        // Left-side magnesium alternator cover & water pump + Samco red silicone coolant hoses
        cyl(g, 0.095, 0.095, 0.038, 22, magnesiumBronze, [0.08, -0.12, -0.135], [Math.PI / 2, 0, 0]);
        tube(g, [[0.14, -0.08, -0.14], [0.28, -0.02, -0.15], [0.42, 0.04, -0.13]], 0.013, ducatiRed);
        // Curved dual-stage aluminum water radiator (upper) & oil cooler (lower) behind front wheel
        rbox(g, 0.055, 0.24, 0.30, 0.01, darkMetal, [0.44, 0.02, 0], [0, 0, -0.36]);
        rbox(g, 0.048, 0.15, 0.24, 0.008, alu, [0.39, -0.17, 0], [0, 0, -0.24]);
        buildFinArray(g, [0.45, 0.02, 0], 14, [0.003, 0.20, 0.27], [0.004, 0, 0], alu);
        buildWiringHarness(g, [[-0.08, 0.08, 0.13], [0.12, -0.02, 0.15], [0.32, 0.12, 0.13]], { radius: 0.009, color: 0xf97316 });
      } },
    { id: 'akrapovic-titanium-exhaust', name: 'Akrapovič Full-Race Hydroformed Titanium 4-2-1-2 Exhaust System', category: 'Exhaust & Aero Thermal', isOuter: false, explodeOffset: [0, -0.95, 0.85],
      desc: 'Thin-wall hydroformed titanium primary headers with heat-blued weld seams, underbelly twin catalytic collectors, and dual carbon-capped undertail/belly exit silencers.',
      funFact: 'The full-race Akrapovič titanium exhaust shaves 5 kg off the bike and boosts output to 237 horsepower with racing oil!',
      build(g) {
        // Front bank primary titanium headers curving down under engine sump
        for (const s of [-1, 1]) {
          tube(g, [
            [0.32, -0.02, s * 0.07],
            [0.37, -0.16, s * 0.09],
            [0.24, -0.28, s * 0.09],
            [-0.06, -0.30, s * 0.085],
            [-0.26, -0.27, s * 0.095],
          ], 0.021, titanium);
          // Rear bank primary headers looping under seat & down to collector
          tube(g, [
            [-0.06, 0.12, s * 0.065],
            [-0.22, 0.16, s * 0.08],
            [-0.28, 0.02, s * 0.095],
            [-0.18, -0.22, s * 0.09],
          ], 0.020, heatBlueTi);
          // Underbelly twin titanium race silencers with angled carbon-fiber slash-cut end caps & mesh outlets
          cyl(g, 0.042, 0.048, 0.28, 18, titanium, [-0.18, -0.28, s * 0.105], [0, 0, Math.PI / 2 - 0.12]);
          cyl(g, 0.040, 0.034, 0.06, 16, carbon, [-0.33, -0.26, s * 0.105], [0, 0, Math.PI / 2 - 0.12]);
          // High-mount WSBK-style undertail titanium dual mufflers tucked beneath tail cowling
          cyl(g, 0.034, 0.038, 0.22, 16, titanium, [-0.66, 0.34, s * 0.075], [0, 0, Math.PI / 2 + 0.38]);
          cyl(g, 0.032, 0.026, 0.045, 14, carbon, [-0.77, 0.38, s * 0.075], [0, 0, Math.PI / 2 + 0.38]);
        }
        // Carbon-fiber rear exhaust heat shield on right flank
        rbox(g, 0.22, 0.11, 0.012, 0.004, carbon, [-0.22, 0.08, 0.115], [0, 0, 0.45]);
      } },
    { id: 'aluminum-front-frame-swingarm', name: 'Cast-Aluminum Stressed-Member "Front Frame" & Rear Subframe', category: 'Chassis', isOuter: false, explodeOffset: [-0.95, 0.55, 0],
      desc: '4.2-kg hollow cast-aluminum Front Frame with machined weight-saving pockets bolted directly to the front & rear V4 cylinder heads, plus cast rear trellis subframe.',
      funFact: 'There is no traditional perimeter frame—the Desmosedici V4 engine block IS the motorcycle’s load-bearing chassis!',
      build(g) {
        // Steering head casting + twin sculpted front frame spars with CNC weight-relief pockets
        cyl(g, 0.044, 0.044, 0.19, 20, alu, [0.54, 0.31, 0], [0, 0, -0.40]);
        for (const s of [-1, 1]) {
          const z = s * 0.135;
          rbox(g, 0.48, 0.082, 0.028, 0.012, alu, [0.31, 0.21, z], [0, s * -0.06, 0.40]);
          // Recessed dark CNC pockets in frame spar
          rbox(g, 0.16, 0.038, 0.032, 0.006, darkMetal, [0.36, 0.23, z], [0, s * -0.06, 0.40]);
          rbox(g, 0.14, 0.034, 0.032, 0.006, darkMetal, [0.18, 0.15, z], [0, s * -0.06, 0.40]);
          // Rear cast-aluminum seat subframe rails bolted to rear cylinder bank
          tube(g, [[0.02, 0.16, s * 0.11], [-0.28, 0.22, s * 0.10], [-0.68, 0.36, s * 0.07]], 0.015, darkMetal);
          tube(g, [[-0.06, 0.02, s * 0.12], [-0.34, 0.19, s * 0.10]], 0.012, darkMetal);
        }
        buildHexBoltArray(g, [[0.12, 0.12, 0.15], [0.12, 0.12, -0.15], [0.46, 0.28, 0.14], [0.46, 0.28, -0.14]], { radius: 0.009, height: 0.016 });
      } },
    { id: 'single-sided-swingarm-chain', name: 'Hollow Cast-Aluminum Single-Sided Swingarm, Gold 520 Chain & Rearsets', category: 'Drivetrain & Swingarm', isOuter: false, explodeOffset: [-1.35, -0.15, -0.65],
      desc: '600mm hollow cast-aluminum single-sided left swingarm with adjustable pivot height, eccentric rear hub carrier, DID Gold 520 drive chain, carbon chain guard, and CNC billet rearset footpegs.',
      funFact: 'Because the entire swingarm wraps only around the left side of the rear wheel, pit crews can swap a slick tire in seconds using a single central titanium axle nut!',
      build(g) {
        // Sculpted curved left-side single-sided swingarm casting with central truss window
        const swingOuter = [
          [-0.04, -0.08], [-0.36, -0.09], [-0.80, -0.18], [-0.80, -0.27],
          [-0.44, -0.28], [-0.04, -0.22],
        ];
        extrudeProfile(g, swingOuter, 0.075, alu, [0, 0, -0.115], [0, 0, 0], 0.014);
        // Dark recessed structural truss window & carbon-fiber lower swingarm protector + upper chain hugger
        rbox(g, 0.28, 0.055, 0.082, 0.01, darkMetal, [-0.38, -0.18, -0.115], [0, 0, 0.12]);
        const huggerPts = [[-0.36, -0.06], [-0.74, -0.01], [-0.88, -0.08], [-0.62, 0.05], [-0.34, -0.02]];
        extrudeProfile(g, huggerPts, 0.19, carbon, [0, 0, 0], [0, 0, 0], 0.012);
        // Gold DID 520 racing chain upper & lower runs + rear anodized aluminum sprocket carrier
        rbox(g, 0.68, 0.016, 0.018, 0.003, ohlinsGold, [-0.44, -0.12, -0.105], [0, 0, 0.14]);
        rbox(g, 0.68, 0.016, 0.018, 0.003, ohlinsGold, [-0.44, -0.26, -0.105], [0, 0, -0.04]);
        torus(g, 0.095, 0.014, ohlinsGold, [-0.78, -0.22, -0.105]);
        // CNC billet aluminum rider rearsets, heel guards, folding knurled footpegs & Ducati Quick Shift (DQS) rod
        for (const s of [-1, 1]) {
          rbox(g, 0.14, 0.09, 0.014, 0.004, alu, [-0.14, -0.12, s * 0.155], [0, 0, 0.35]);
          rbox(g, 0.09, 0.075, 0.008, 0.003, carbon, [-0.18, -0.07, s * 0.162], [0, 0, 0.45]);
          cyl(g, 0.011, 0.011, 0.085, 12, alu, [-0.14, -0.16, s * 0.195], [Math.PI / 2, 0, 0]);
        }
        cyl(g, 0.005, 0.005, 0.22, 8, titanium, [-0.02, -0.15, -0.155], [0, 0, Math.PI / 2 - 0.12]);
      } },
    { id: 'ohlins-npx-forks-monoshock', name: 'Öhlins NPX 25/30 Gold TiN Inverted Forks, Billet Clamps & Cockpit', category: 'Front Suspension & Controls', isOuter: false, explodeOffset: [1.25, 0.45, 0],
      desc: '43mm Öhlins NPX pressurized inverted forks with gold Titanium-Nitride inner tubes, CNC machined billet triple clamps with engraved serial badge, Öhlins steering damper, clip-on bars, and 5" TFT dash.',
      funFact: 'The bright gold color on superbike forks is an ultra-hard Titanium Nitride ceramic coating that makes the tubes slide with almost zero friction!',
      build(g) {
        // Upper gullwing CNC billet triple clamp & lower triple clamp (rake angle ~24.5° = 0.42 rad)
        rbox(g, 0.095, 0.024, 0.27, 0.008, alu, [0.51, 0.36, 0], [0, 0, -0.40]);
        rbox(g, 0.10, 0.032, 0.28, 0.008, alu, [0.58, 0.20, 0], [0, 0, -0.40]);
        // Transverse Öhlins steering damper mounted behind upper triple clamp
        cyl(g, 0.014, 0.014, 0.20, 12, ohlinsGold, [0.47, 0.38, 0], [Math.PI / 2, 0, 0]);
        for (const s of [-1, 1]) {
          const z = s * 0.115;
          // Gold anodized outer fork stanchions + blue/red compression/rebound top caps
          cyl(g, 0.027, 0.025, 0.40, 20, ohlinsGold, [0.60, 0.16, z], [0, 0, 0.40]);
          cyl(g, 0.028, 0.028, 0.018, 16, brushedMetal(s < 0 ? 0x2563eb : 0xdc2626), [0.52, 0.34, z], [0, 0, 0.40]);
          // TiN gold-coated lower inner sliders + CNC radial brake caliper axle bottoms + pressurized gas reservoirs
          cyl(g, 0.021, 0.021, 0.28, 18, ohlinsGold, [0.72, -0.09, z], [0, 0, 0.40]);
          rbox(g, 0.075, 0.085, 0.044, 0.01, alu, [0.78, -0.21, z], [0, 0, 0.40]);
          cyl(g, 0.016, 0.016, 0.09, 14, ohlinsGold, [0.74, -0.19, z + s * 0.022], [0, 0, 0.40]);
          // Clip-on handlebars, Domino race grips, Brembo radial master cylinders, fluid reservoirs & lever guards
          cyl(g, 0.012, 0.012, 0.21, 12, darkMetal, [0.49, 0.35, s * 0.20], [Math.PI / 2, s * 0.28, -0.15]);
          cyl(g, 0.015, 0.015, 0.11, 12, alcantara, [0.46, 0.34, s * 0.25], [Math.PI / 2, s * 0.28, -0.15]);
          cyl(g, 0.016, 0.016, 0.032, 12, glassMat(0xfef3c7, 0.7), [0.53, 0.40, s * 0.17], [0, 0, 0]);
          rbox(g, 0.09, 0.012, 0.018, 0.003, carbon, [0.51, 0.34, s * 0.31], [0, s * -0.25, 0]);
        }
        // Full-color 5-inch Ducati Corse TFT instrument display + magnesium fairing stay bracket
        rbox(g, 0.022, 0.085, 0.145, 0.008, screenMat('dashboard'), [0.59, 0.41, 0], [0, 0, -0.58]);
        rbox(g, 0.14, 0.045, 0.08, 0.008, darkMetal, [0.62, 0.35, 0], [0, 0, -0.30]);
      } },
    { id: 'ohlins-ttx36-monoshock-linkage', name: 'Öhlins TTX36 Piggyback Rear Monoshock & Forged Rocker Linkage', category: 'Rear Suspension', isOuter: false, explodeOffset: [-0.45, 0.65, -0.95],
      desc: 'Twin-tube Öhlins TTX36 rear shock absorber with yellow titanium coil spring, gold piggyback nitrogen reservoir, and forged aluminum adjustable progressive rocker arm.',
      funFact: 'The TTX36 separates compression and rebound oil chambers completely so the shock never cavitates over 280 km/h curbing!',
      build(g) {
        // Forged aluminum progressive triangular rocker linkage + tie rod on left side
        rbox(g, 0.13, 0.065, 0.045, 0.01, alu, [-0.14, 0.05, -0.06], [0, 0, 0.25]);
        // Öhlins TTX36 shock body, piggyback gold gas cylinder & yellow coil spring
        cyl(g, 0.022, 0.022, 0.26, 16, alu, [-0.22, 0.01, -0.06], [0, 0, -0.68]);
        cyl(g, 0.018, 0.018, 0.11, 14, ohlinsGold, [-0.16, 0.08, -0.095], [0, 0, -0.68]);
        for (let c = 0; c < 7; c++) {
          const t = (c - 3) * 0.024;
          torus(g, 0.034, 0.007, ohlinsGold, [-0.22 - t * 0.78, 0.01 + t * 0.62, -0.06], [0, 0, -0.68 + Math.PI / 2]);
        }
      } },
    { id: 'brembo-stylema-marchesini-wheels', name: '17" Marchesini Forged Magnesium Wheels, Pirelli Slicks & Brembo Stylema R Brakes', category: 'Brakes & Wheels', isOuter: true, explodeOffset: [0, -1.20, 0],
      desc: '3-split-Y-spoke forged Marchesini wheels wrapped in wide Pirelli Diablo Supercorsa SP slicks (120/70 ZR17 front, 200/60 ZR17 rear) with dual 330mm floating discs and Brembo Stylema R 4-piston radial calipers.',
      funFact: 'The Desmosedici V4 crankshaft spins backward against the wheels to cancel gyroscopic inertia so the bike flicks from side to side faster!',
      build(g) {
        for (const [x, isFront] of [[-0.78, false], [0.80, true]]) {
          const w = new THREE.Group();
          w.position.set(x, -0.22, 0);
          w.userData.driveRole = 'wheel';
          g.add(w);
          const tireWidthTube = isFront ? 0.072 : 0.096;
          const rimWidth = isFront ? 0.12 : 0.18;
          // Pirelli Diablo Supercorsa rounded sportbike slick tire profile + Ducati Corse red/white wheel rim stripes
          torus(w, 0.285, tireWidthTube, tireRubber, [0, 0, 0]);
          cyl(w, 0.224, 0.224, rimWidth, 32, darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (const side of [-1, 1]) {
            torus(w, 0.226, 0.0055, ducatiRed, [0, 0, side * (rimWidth * 0.48)]);
            torus(w, 0.218, 0.0035, corseWhite, [0, 0, side * (rimWidth * 0.48)]);
          }
          // Central wheel hub + 10 thin Y-shaped Marchesini forged spokes
          cyl(w, 0.056, 0.056, rimWidth + 0.02, 22, darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
          cyl(w, 0.028, 0.028, rimWidth + 0.05, 16, titanium, [0, 0, 0], [Math.PI / 2, 0, 0]);
          for (let s = 0; s < 10; s++) {
            const a = (s / 10) * Math.PI * 2 + (s % 2 === 0 ? 0.09 : -0.09);
            rbox(w, 0.175, 0.015, 0.020, 0.004, darkMetal, [Math.cos(a) * 0.132, Math.sin(a) * 0.132, 0], [0, 0, a + (s % 2 === 0 ? 0.18 : -0.18)]);
          }
          if (isFront) {
            // Dual 330mm Brembo T-Drive floating steel brake rotors + gold anodized carriers + radial Stylema R calipers + carbon cooling ducts
            for (const s of [-1, 1]) {
              const z = s * 0.072;
              torus(w, 0.168, 0.022, chromeMat(), [0, 0, z]);
              torus(w, 0.122, 0.012, ohlinsGold, [0, 0, z]);
              for (let b = 0; b < 10; b++) {
                const ba = (b / 10) * Math.PI * 2;
                cyl(w, 0.005, 0.005, 0.012, 8, darkMetal, [Math.cos(ba) * 0.142, Math.sin(ba) * 0.142, z], [Math.PI / 2, 0, 0]);
              }
              // Radial Brembo Stylema R monobloc caliper + GP4 carbon brake cooling scoop
              rbox(g, 0.092, 0.058, 0.044, 0.012, alu, [x - 0.145, -0.15, z], [0, 0, 0.52]);
              rbox(g, 0.045, 0.018, 0.046, 0.004, ducatiRed, [x - 0.15, -0.15, z], [0, 0, 0.52]);
              rbox(g, 0.11, 0.065, 0.036, 0.008, carbon, [x - 0.11, -0.19, z * 1.15], [0, 0, 0.42]);
            }
          } else {
            // Single-sided exposed right wheel face with central titanium cone nut & left-side 245mm rear brake disc
            cyl(w, 0.042, 0.032, 0.035, 18, ohlinsGold, [0, 0, 0.095], [Math.PI / 2, 0, 0]);
            torus(w, 0.122, 0.016, chromeMat(), [0, 0, -0.088]);
            rbox(g, 0.068, 0.045, 0.038, 0.008, alu, [x + 0.10, -0.12, -0.088], [0, 0, -0.45]);
          }
        }
      } },
    { id: 'sculpted-tank-monoposto-tail', name: 'Brushed-Aluminum 17L Fuel Tank, Race Saddle & Flying-Buttress Monoposto Tail', category: 'Ergonomics & Tail Aero', isOuter: true, explodeOffset: [-0.55, 1.15, 0],
      desc: 'Hand-brushed 17-liter aluminum fuel tank extending under the rider seat, two-tone Ducati Red/exposed aluminum knee recesses, Alcantara race saddle, and twin open-tunnel aerodynamic tail cowling.',
      funFact: 'Just like a MotoGP prototype, part of the Panigale V4 R’s 17-liter aluminum fuel tank sits underneath the rider’s seat to centralize mass!',
      build(g) {
        // 1. Sculpted Muscular 17L Fuel Tank (tapered multi-layered profile + exposed brushed aluminum knee recesses)
        const tankCenterPts = [[-0.16, 0.18], [0.36, 0.24], [0.45, 0.39], [0.18, 0.49], [-0.14, 0.35]];
        extrudeProfile(g, tankCenterPts, 0.18, ducatiRed, [0, 0, 0], [0, 0, 0], 0.038);
        for (const s of [-1, 1]) {
          // Sculpted flared tank shoulders + exposed brushed-aluminum knee grip pockets
          const tankSidePts = [[-0.12, 0.20], [0.32, 0.25], [0.38, 0.38], [0.16, 0.46], [-0.10, 0.33]];
          extrudeProfile(g, tankSidePts, 0.08, ducatiRed, [0, 0, s * 0.095], [s * -0.08, 0, 0], 0.028);
          const aluKneePts = [[-0.12, 0.21], [0.14, 0.25], [0.12, 0.38], [-0.10, 0.33]];
          extrudeProfile(g, aluKneePts, 0.025, alu, [0, 0, s * 0.138], [s * -0.08, 0, 0], 0.008);
        }
        // CNC billet quick-release racing fuel cap + tank breather hose
        cyl(g, 0.034, 0.034, 0.016, 18, alu, [0.24, 0.475, 0], [0, 0, -0.22]);
        cyl(g, 0.022, 0.022, 0.020, 12, darkMetal, [0.24, 0.478, 0], [0, 0, -0.22]);
        // 2. Contoured Non-Slip Alcantara Racing Saddle + Corse Red Rear Bum Stop
        rbox(g, 0.33, 0.048, 0.21, 0.018, alcantara, [-0.26, 0.215, 0], [0, 0, 0.14]);
        rbox(g, 0.09, 0.065, 0.18, 0.02, ducatiRed, [-0.41, 0.265, 0], [0, 0, 0.38]);
        // 3. Signature Panigale V4 Split "Flying Buttress" Aerodynamic Tail Cowling with Open Air Channels
        const tailSpinePts = [[-0.38, 0.23], [-0.84, 0.41], [-0.92, 0.45], [-0.66, 0.37], [-0.36, 0.30]];
        extrudeProfile(g, tailSpinePts, 0.10, ducatiRed, [0, 0, 0], [0, 0, 0], 0.02);
        // White MotoGP number board graphic on tail spine
        rbox(g, 0.22, 0.015, 0.11, 0.004, corseWhite, [-0.64, 0.39, 0], [0, 0, -0.36]);
        for (const s of [-1, 1]) {
          const wingTailPts = [[-0.40, 0.22], [-0.88, 0.41], [-0.95, 0.46], [-0.72, 0.41], [-0.42, 0.29]];
          extrudeProfile(g, wingTailPts, 0.045, ducatiRed, [0, 0, s * 0.095], [s * 0.16, s * -0.06, 0], 0.014);
          // Twin boomerang-shaped glowing crimson LED taillight blades under tail arch
          rbox(g, 0.14, 0.022, 0.055, 0.006, emissiveMat(0xef4444, 2.4), [-0.87, 0.415, s * 0.065], [0, s * 0.18, -0.36]);
        }
      } },
    { id: 'motogp-biplane-winglets-fairing', name: 'Sculpted Nose Fairing, Double-Bubble Screen, Shark-Gill Panels & Biplane Winglets', category: 'Aerodynamics & Body', isOuter: true, explodeOffset: [0.65, 1.10, 0],
      desc: 'Multi-piece wind-tunnel sculpted front nose fairing with dual ram-air nostrils, squinting V-shaped LED DRL headlights, polycarbonate double-bubble racing windscreen, twin-extractor shark-gill side fairings, carbon belly pan, and MotoGP biplane carbon downforce winglets.',
      funFact: 'At 300 km/h (186 mph), the sculpted carbon biplane winglets press the front tire into the asphalt with 37 kg (82 lbs) of aerodynamic downforce!',
      build(g) {
        // 1. Sculpted Tapered Nose Cone (narrower at tip, flaring outward to handlebars) + White Corse Nose Number Plate
        const noseCenterPts = [[0.58, 0.24], [0.95, 0.23], [0.88, 0.34], [0.64, 0.44], [0.54, 0.36]];
        extrudeProfile(g, noseCenterPts, 0.17, ducatiRed, [0, 0, 0], [0, 0, 0], 0.028);
        rbox(g, 0.18, 0.016, 0.13, 0.004, corseWhite, [0.78, 0.36, 0], [0, 0, -0.46]);
        for (const s of [-1, 1]) {
          // Angled left/right nose cheeks swept back at 22° so the nose is sharp and wedge-shaped (never a flat block!)
          const noseCheekPts = [[0.52, 0.20], [0.91, 0.22], [0.82, 0.33], [0.58, 0.41], [0.46, 0.32]];
          extrudeProfile(g, noseCheekPts, 0.065, ducatiRed, [0.02, 0, s * 0.105], [s * -0.14, s * -0.24, 0], 0.022);
          // Deep recessed black ram-air intake nostrils + aggressive squinting LED DRL headlight brow + micro-projector lenses
          rbox(g, 0.09, 0.042, 0.068, 0.008, mat(0x090d16, { roughness: 0.9 }), [0.88, 0.24, s * 0.075], [0, s * -0.26, -0.25]);
          rbox(g, 0.15, 0.018, 0.075, 0.005, emissiveMat(0xf8fafc, 2.5), [0.86, 0.275, s * 0.095], [s * 0.15, s * -0.28, -0.34]);
          rbox(g, 0.06, 0.024, 0.048, 0.006, emissiveMat(0xe0f2fe, 2.0), [0.84, 0.255, s * 0.105], [0, s * -0.28, -0.34]);
          // Aero stealth winglet rear-view mirrors with integrated amber LED turn signals on upper nose ears
          rbox(g, 0.09, 0.014, 0.11, 0.004, darkMetal, [0.64, 0.45, s * 0.19], [s * 0.28, s * -0.22, -0.25]);
          rbox(g, 0.05, 0.008, 0.07, 0.002, emissiveMat(0xf59e0b, 1.8), [0.66, 0.452, s * 0.21], [s * 0.28, s * -0.22, -0.25]);
        }

        // 2. Curved Polycarbonate Double-Bubble Racing Windscreen (transparent with dark smoke lower border)
        const screenPts = [[0.58, 0.39], [0.82, 0.32], [0.68, 0.47], [0.47, 0.55], [0.44, 0.48]];
        extrudeProfile(g, screenPts, 0.21, glassMat(0xbae6fd, 0.34), [0, 0, 0], [0, 0, 0], 0.025);

        // 3. Left & Right Sculpted Side Fairings with Dual Shark-Gill Hot-Air Extractor Louvers & Lower Belly Pan
        for (const s of [-1, 1]) {
          const z = s * 0.155;
          // Upper/mid side fairing panel wrapping around radiator and V4 cylinder head
          const sideFairingPts = [
            [0.14, 0.12], [0.54, -0.10], [0.68, 0.08], [0.66, 0.28],
            [0.44, 0.34], [0.16, 0.22],
          ];
          extrudeProfile(g, sideFairingPts, 0.048, ducatiRed, [0, 0, z], [s * -0.07, s * -0.04, 0], 0.016);
          // White Ducati Corse racing stripe + dark shark-gill hot-air extractor cutouts (upper & lower gills)
          rbox(g, 0.28, 0.032, 0.052, 0.004, corseWhite, [0.42, 0.18, z + s * 0.004], [s * -0.07, 0, 0.32]);
          for (let gill = 0; gill < 3; gill++) {
            const gx = 0.32 + gill * 0.075;
            const gy = 0.06 + gill * 0.025;
            rbox(g, 0.045, 0.12, 0.054, 0.005, mat(0x090d16, { roughness: 0.9 }), [gx, gy, z], [s * -0.07, 0, -0.38]);
          }
          // Lower aerodynamic belly pan (silver/carbon Ducati Corse sponsor chin spoiler with lower cooling louvers)
          const bellyPts = [[-0.22, -0.26], [0.42, -0.26], [0.56, -0.10], [0.18, -0.02], [-0.14, -0.14]];
          extrudeProfile(g, bellyPts, 0.044, alu, [0, 0, s * 0.135], [s * 0.10, 0, 0], 0.012);
          rbox(g, 0.24, 0.045, 0.048, 0.004, carbon, [0.06, -0.22, s * 0.138], [s * 0.10, 0, 0.06]);

          // 4. MotoGP Carbon-Fiber Biplane Box Winglets (upper & lower curved airfoil blades + sculpted endplate)
          box(g, 0.21, 0.014, 0.13, carbon, [0.66, 0.24, s * 0.23], [s * 0.18, s * -0.12, -0.26]);
          box(g, 0.17, 0.012, 0.11, carbon, [0.62, 0.185, s * 0.22], [s * 0.18, s * -0.12, -0.26]);
          rbox(g, 0.19, 0.082, 0.012, 0.004, carbon, [0.64, 0.21, s * 0.29], [0, s * -0.12, -0.26]);
          rbox(g, 0.14, 0.016, 0.014, 0.003, ducatiRed, [0.64, 0.245, s * 0.295], [0, s * -0.12, -0.26]);
        }

        // 5. Sculpted Front Mudguard (Ducati Red top arch + carbon-fiber fork guard wings)
        const fenderPts = [[0.66, -0.05], [0.91, -0.01], [0.85, 0.065], [0.68, 0.045]];
        extrudeProfile(g, fenderPts, 0.145, ducatiRed, [0, 0, 0], [0, 0, 0], 0.018);
        for (const s of [-1, 1]) {
          rbox(g, 0.11, 0.13, 0.014, 0.004, carbon, [0.74, -0.09, s * 0.082], [0, 0, 0.38]);
        }
        buildHexBoltArray(g, [[0.38, 0.24, 0.185], [0.38, 0.24, -0.185], [0.54, 0.02, 0.185], [0.54, 0.02, -0.185]], { radius: 0.008, height: 0.014 });
      } },
  ];
  return {
    id: 'ducati-panigale-v4', name: 'Ducati Panigale V4 R Superbike', brand: 'Ducati Corse', badge: '237 hp • 16,500 RPM Desmo V4 R',
    desc: 'WorldSBK homologation 998cc V4 R superbike with Desmodromic titanium valves, open STM EVO-SBK dry clutch, full-race Akrapovič titanium exhaust, Öhlins NPX/TTX36 suspension, Brembo Stylema R brakes, and MotoGP biplane carbon winglets.',
    cameraPos: [3.1, 1.65, 3.1], parts,
    quiz: [
      { q: 'How does Ducati’s Desmodromic system close engine valves at 16,500 RPM without steel springs?', correctId: 'desmosedici-v4-engine', distractors: ['ohlins-npx-forks-monoshock', 'motogp-biplane-winglets-fairing', 'aluminum-front-frame-swingarm'] },
      { q: 'What do the carbon-fiber biplane winglets on the front fairing do at 300 km/h?', correctId: 'motogp-biplane-winglets-fairing', distractors: ['brembo-stylema-marchesini-wheels', 'aluminum-front-frame-swingarm', 'ohlins-npx-forks-monoshock'] },
      { q: 'Why are the Öhlins NPX inverted front fork tubes coated in bright gold Titanium Nitride?', correctId: 'ohlins-npx-forks-monoshock', distractors: ['desmosedici-v4-engine', 'brembo-stylema-marchesini-wheels', 'motogp-biplane-winglets-fairing'] },
    ],
  };
}

export const HELICOPTER_MODELS = [buildBlackHawkModel(), buildH145Model(), buildDjiMavicModel(), buildIngenuityModel()];
export const WATCH_MODELS = [buildSwissChronographModel(), buildGrandfatherClockModel()];
export const BIKE_MODELS = [buildTernGsdModel(), buildCarbonRoadBikeModel(), buildDucatiPanigaleModel()];

export const HELICOPTERS_CATEGORY = {
  id: 'helicopters', name: 'Helicopters & Drones', fullName: 'Military, Rescue, Mars & Quadcopter Rotorcraft', emoji: '🚁', icon: '🚁',
  tagline: 'Sikorsky UH-60M Black Hawk • Airbus H145 Medevac • DJI Mavic 3 Pro • NASA Ingenuity Mars Helicopter (CAD)',
  models: HELICOPTER_MODELS,
};

export const WATCHES_CATEGORY = {
  id: 'watches', name: 'Mechanical Watch & Clock', fullName: 'Haute Horlogerie Chronographs & Longcase Clocks', emoji: '⌚', icon: '⌚',
  tagline: 'Swiss Automatic Mechanical Chronograph (Khronos CAD) • Longcase Westminster Pendulum Clock',
  models: WATCH_MODELS,
};

export const BIKES_CATEGORY = {
  id: 'bikes', name: 'Bikes & Motorcycles', fullName: 'Tern GSD E-Cargo Bike, Carbon Road Bikes & MotoGP Superbikes', emoji: '🚲', icon: '🚲',
  tagline: 'Tern GSD S10 Electric Cargo Bike • Tour-Grade Carbon Aero Road Bike (CAD) • Ducati Panigale V4 R Superbike',
  models: BIKE_MODELS,
};
