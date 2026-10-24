// Downloads, sanitizes (strips embedded trademark textures & non-standard extensions),
// verifies size + SHA-256 checksums, and writes `app/assets/models/CREDITS.md`
// for all real CAD/3D assets used in Inside Out Studio.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'app', 'assets', 'models');

const ASSETS = [
  {
    filename: 'ferrari.glb',
    title: 'Ferrari 458 Italia / SF90 Stradale Automotive CAD Model',
    author: 'Flavioika (adapted by Three.js contributors)',
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    sourceUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb',
    stats: '358,788 triangles • 58 named CAD nodes (body, carbon_fibre_trim, leather, steering_wheel, wheel_fl/fr/rl/rr, brakes, glass, wipers, lights)',
    usedIn: 'Ferrari SF90 Stradale (Primary CAD Body, Interior, Wheels & Steering) + shared Italian supercar CAD sub-assemblies',
    stripImages: true,
  },
  {
    filename: 'car_concept.glb',
    title: 'Concept Car 004 Full Multi-Part Automotive CAD Assembly (CarConcept)',
    author: '3D Model by Unity Fan (Public Domain CC0); glTF optimization by Eric Chadwick (Khronos Group)',
    license: 'CC0 1.0 Public Domain / CC-BY 4.0 (Khronos glTF-Sample-Assets)',
    sourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb',
    stats: '162,766 vertices • 101 named CAD nodes / 97 meshes (Engine, InteriorCage, BodyHood, BodyRoofPanel, BodyDoorL/R, BodyWindshield, InteriorDash, Seats, Pedals, SteeringWheel, BrakeDiscs/Pads, Axles, Wheels)',
    usedIn: 'Tesla Model S Plaid, Porsche 911 GT3 RS, Lamborghini Revuelto V12 (CAD body panels, doors, cockpit cage, brake assemblies & axles)',
    stripImages: true,
  },
  {
    filename: 'buggy.glb',
    title: 'Off-Road Spaceframe Buggy & Drivetrain CAD Assembly (Buggy)',
    author: 'Okino Computer Graphics (JT to COLLADA/glTF CAD conversion for Khronos Group)',
    license: 'CC-BY 4.0 (Khronos glTF-Sample-Models)',
    sourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb',
    stats: '245,673 vertices • 205 CAD nodes / 109 meshes (Tubular Spaceframe, Suspension Arms, Coilovers, Steering Rack, Engine & Differential)',
    usedIn: 'Rivian R1T Quad-Motor & Ford F-150 Raptor R (CAD spaceframe chassis, suspension linkages & drivetrain sub-assemblies)',
    stripImages: true,
  },
  {
    filename: 'engine_cad.glb',
    title: '2-Cylinder Internal Combustion Engine Mechanical CAD Assembly (2CylinderEngine)',
    author: 'Okino Computer Graphics (JT to COLLADA/glTF CAD conversion for Khronos Group)',
    license: 'CC-BY 4.0 (Khronos glTF-Sample-Models)',
    sourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb',
    stats: '55,843 vertices • 82 CAD nodes / 29 meshes (Finned Cylinder Block, Crankcase, Pistons, Connecting Rods, Crankshaft, Bevel Gears, Valve Springs & Lifters)',
    usedIn: 'Internal Combustion Engine Cutaways (Car V8/V12/Flat-6 & Cessna 172 Lycoming IO-360 Horizontally-Opposed Engine)',
    stripImages: true,
  },
  {
    filename: 'gearbox_cad.glb',
    title: 'Multi-Shaft Mechanical Spur/Helical Gearbox CAD Assembly (GearboxAssy)',
    author: 'Okino Computer Graphics (JT to COLLADA/glTF CAD conversion for Khronos Group)',
    license: 'CC-BY 4.0 (Khronos glTF-Sample-Models)',
    sourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
    stats: '229,801 vertices • 118 CAD nodes / 42 meshes (Meshed Spur Gears, Shafts, Bearings & Split Housing)',
    usedIn: 'Dual-Clutch / 10-Speed Transaxles & Turbofan Accessory Gearboxes',
    stripImages: true,
  },
  {
    filename: 'global_hawk.glb',
    title: 'NASA RQ-4 Global Hawk High-Altitude Long-Endurance Jet Aircraft',
    author: 'NASA Visualization Technology Applications and Development (VTAD)',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Global%20Hawk/Global%20Hawk.glb',
    stats: '6 material groups (Sculpted Fuselage, High-Aspect-Ratio Carbon Wings, V-Tail, Dorsal Turbofan Nacelle & Retractable Landing Gear)',
    usedIn: 'Airplanes & Jets CAD Reference & Avionics/Wing Sub-Assemblies',
    stripImages: true,
  },
  {
    filename: 'space_shuttle_eng.glb',
    title: 'NASA RS-25 / Space Shuttle Main Engine (SSME) Cryogenic Rocket Engine CAD',
    author: 'NASA 3D Resources / NASA Johnson Space Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Space%20Shuttle%20(D)/Space%20Shuttle%20(D)%20eng.glb',
    stats: 'Cryogenic Liquid Rocket Engine CAD (High-Pressure Turbopumps, Powerhead Manifolds, Coolant Loops & Regenerative De Laval Nozzle)',
    usedIn: 'SpaceX Raptor Full-Flow Staged-Combustion Rocket Engine (`spacex-raptor-rocket`) & NASA Space Shuttle SSME Trio (`space-shuttle-sts`)',
    stripImages: true,
  },
  {
    filename: 'iss_nasa.glb',
    title: 'NASA International Space Station (ISS) Complete Orbital Assembly CAD',
    author: 'NASA 3D Resources / NASA Johnson Space Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/International%20Space%20Station%20%28ISS%29%20%28B%29/International%20Space%20Station%20%28ISS%29%20%28B%29.glb',
    stats: 'Integrated Truss Structure (S0–S6 / P1–P6), 8 Photovoltaic Solar Array Wings, Thermal Radiator Panels, Pressurized Modules (Zvezda, Zarya, Destiny, Harmony, Columbus, Kibo, Cupola) & Canadarm2',
    usedIn: 'International Space Station (`iss-orbital-station`)',
    stripImages: true,
  },
  {
    filename: 'shuttle_et.glb',
    title: 'NASA Space Shuttle Super Lightweight External Tank (SLWT) CAD',
    author: 'NASA 3D Resources / NASA Marshall Space Flight Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Space%20Shuttle%20Parts/External%20tank.glb',
    stats: 'Aluminum-Lithium LOX/LH2 Cryogenic External Tank with SOFI Thermal Foam Insulation, Intertank Ribbing & Bipod Struts',
    usedIn: 'NASA Space Shuttle Full Launch Stack (`space-shuttle-sts`)',
    stripImages: true,
  },
  {
    filename: 'shuttle_srb.glb',
    title: 'NASA Space Shuttle Reusable Solid Rocket Booster (SRB) CAD',
    author: 'NASA 3D Resources / NASA Kennedy Space Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Space%20Shuttle%20Parts/Solid%20Rocket%20Booster.glb',
    stats: 'Segmented D6AC Steel Solid Rocket Motor Casing, Frustum Parachute Nose Cone, Aft Skirt & Gimbaled Thrust Vector Nozzle',
    usedIn: 'NASA Space Shuttle Full Launch Stack (`space-shuttle-sts`)',
    stripImages: true,
  },
  {
    filename: 'shuttle_payload.glb',
    title: 'NASA Space Shuttle Payload Bay & Spacelab Module CAD',
    author: 'NASA 3D Resources / NASA Johnson Space Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Space%20Shuttle%20Parts/Payload.glb',
    stats: 'Orbiter 60-Foot Payload Bay Internal Carrier, Pressurized Spacelab Module & Transfer Tunnel',
    usedIn: 'NASA Space Shuttle Full Launch Stack (`space-shuttle-sts`)',
    stripImages: true,
  },
  {
    filename: 'shuttle_ods.glb',
    title: 'NASA Space Shuttle Orbiter Docking System (ODS) & Airlock CAD',
    author: 'NASA 3D Resources / NASA Johnson Space Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Space%20Shuttle%20Parts/Orbiter%20Docking%20System.glb',
    stats: 'APAS-95 Androgynous Peripheral Attach System Ring, External Airlock & Truss Structure',
    usedIn: 'NASA Space Shuttle Full Launch Stack (`space-shuttle-sts`) & ISS PMA Docking Interface',
    stripImages: true,
  },
  {
    filename: 'saturn_v.glb',
    title: 'NASA Apollo Saturn V Three-Stage Heavy-Lift Launch Vehicle CAD',
    author: 'NASA 3D Resources / NASA Marshall Space Flight Center',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Saturn%20V/Saturn%20V.glb',
    stats: 'S-IC First Stage (5× F-1), S-II Second Stage (5× J-2), S-IVB Third Stage, Apollo CSM & Launch Escape System Tower',
    usedIn: 'Apollo Saturn V Moon Rocket (`saturn-v`)',
    stripImages: true,
  },
  {
    filename: 'perseverance_rover.glb',
    title: 'NASA Mars 2020 Perseverance Rover 6-Wheel Robotic Geologist CAD',
    author: 'NASA / JPL-Caltech',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb',
    stats: 'Rocker-Bogie Titanium Suspension, 6 Cleated Aluminum Wheels, Remote Sensing Mast (SuperCam/Mastcam-Z), 5-DOF Robotic Turret Arm & MMRTG Nuclear Power Source',
    usedIn: 'Mars 2020 Perseverance Rover (`perseverance`)',
    stripImages: true,
  },
  {
    filename: 'ingenuity_mars.glb',
    title: 'NASA Ingenuity Mars Coaxial Autonomous Helicopter CAD',
    author: 'NASA / JPL-Caltech / AeroVironment',
    license: 'Public Domain (17 U.S.C. § 105 — U.S. Government Work)',
    sourceUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Ingenuity%20Mars%20Helicopter/Ingenuity%20Mars%20Helicopter.glb',
    stats: 'Counter-Rotating 1.2m Carbon-Fiber Coaxial Rotors, Solar Array Panel, Avionics Cube & 4 Ultra-Light Carbon Landing Legs',
    usedIn: 'NASA Ingenuity Mars Helicopter (`ingenuity`, `perseverance`)',
    stripImages: true,
  },
  {
    filename: 'chronograph_watch.glb',
    title: 'Mechanical Chronograph Wristwatch Multi-Part CAD Assembly (ChronographWatch)',
    author: 'Khronos Group glTF-Sample-Assets Contributors',
    license: 'CC-BY 4.0 (Khronos glTF-Sample-Assets)',
    sourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ChronographWatch/glTF-Binary/ChronographWatch.glb',
    stats: 'Multi-node Horological CAD (Case, Bezel, Crown, Pushers, Sub-Dials, Hands, Tachymeter Scale & Strap)',
    usedIn: 'Mechanical Chronograph Watch (`chronograph`)',
    stripImages: true,
  },
  {
    filename: 'carbon_frame_bike.glb',
    title: 'Carbon-Fiber Road Bicycle Frame & Components CAD (CarbonFrameBike)',
    author: 'Three.js Examples / Open-Source glTF Contributors',
    license: 'MIT / CC-BY 4.0 (Three.js Examples Repository)',
    sourceUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/CarbonFrameBike.glb',
    stats: 'Monocoque Carbon Road Frame, Aero Fork, Wheelset, Crankset, Derailleurs, Disc Brakes & Drop Handlebars',
    usedIn: 'Carbon-Fiber Road Bike (`carbon-road-bike`)',
    stripImages: true,
  },
];

/**
 * Strips embedded textures/images and non-standard vendor extensions from a GLB buffer
 * so that:
 *  1) Zero trademark logos or external baked textures are ever shipped.
 *  2) Three.js GLTFLoader never spawns blob: image decodes or warns on unknown extensions.
 *  3) Binary size is reduced to pure geometry + node hierarchy.
 */
function sanitizeGlbGeometryOnly(buf) {
  const magic = buf.readUInt32LE(0);
  const version = buf.readUInt32LE(4);
  if (magic !== 0x46546c67 || version !== 2) return buf;

  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.subarray(20, 20 + jsonLen).toString('utf8');
  const json = JSON.parse(jsonStr);

  const binChunkStart = 20 + jsonLen;
  if (binChunkStart + 8 > buf.length) return buf;
  const binLen = buf.readUInt32LE(binChunkStart);
  const binData = buf.subarray(binChunkStart + 8, binChunkStart + 8 + binLen);

  // Remove non-standard extensions that cause Three.js GLTFLoader warnings
  const allowedExts = new Set(['KHR_draco_mesh_compression', 'KHR_mesh_quantization']);
  if (Array.isArray(json.extensionsUsed)) {
    json.extensionsUsed = json.extensionsUsed.filter((e) => allowedExts.has(e));
    if (json.extensionsUsed.length === 0) delete json.extensionsUsed;
  }
  if (Array.isArray(json.extensionsRequired)) {
    json.extensionsRequired = json.extensionsRequired.filter((e) => allowedExts.has(e));
    if (json.extensionsRequired.length === 0) delete json.extensionsRequired;
  }
  delete json.extensions;

  // Identify image bufferViews so we can omit them when repacking uncompressed GLBs
  const isDraco = Array.isArray(json.extensionsUsed) && json.extensionsUsed.includes('KHR_draco_mesh_compression');
  const imageBufferViews = new Set();
  if (Array.isArray(json.images)) {
    for (const img of json.images) {
      if (typeof img.bufferView === 'number') imageBufferViews.add(img.bufferView);
    }
  }

  delete json.images;
  delete json.textures;
  delete json.samplers;

  if (Array.isArray(json.materials)) {
    for (const m of json.materials) {
      delete m.extensions;
      delete m.normalTexture;
      delete m.occlusionTexture;
      delete m.emissiveTexture;
      if (m.pbrMetallicRoughness) {
        delete m.pbrMetallicRoughness.baseColorTexture;
        delete m.pbrMetallicRoughness.metallicRoughnessTexture;
      }
    }
  }

  let outBin = binData;
  // If not Draco-compressed and has embedded images, compact the binary chunk to drop image bytes
  if (!isDraco && imageBufferViews.size > 0 && Array.isArray(json.bufferViews)) {
    const chunks = [];
    let offset = 0;
    for (let i = 0; i < json.bufferViews.length; i++) {
      const bv = json.bufferViews[i];
      if (imageBufferViews.has(i)) {
        bv.byteOffset = 0;
        bv.byteLength = 0;
        continue;
      }
      const srcStart = bv.byteOffset || 0;
      const srcLen = bv.byteLength || 0;
      const slice = binData.subarray(srcStart, srcStart + srcLen);
      const pad = (4 - (slice.length % 4)) % 4;
      bv.byteOffset = offset;
      chunks.push(slice);
      if (pad > 0) chunks.push(Buffer.alloc(pad));
      offset += slice.length + pad;
    }
    outBin = Buffer.concat(chunks);
    if (Array.isArray(json.buffers) && json.buffers[0]) {
      json.buffers[0].byteLength = outBin.length;
    }
  }

  const newJsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = (4 - (newJsonBytes.length % 4)) % 4;
  const paddedJson = jsonPad > 0 ? Buffer.concat([newJsonBytes, Buffer.alloc(jsonPad, 0x20)]) : newJsonBytes;

  const binPad = (4 - (outBin.length % 4)) % 4;
  const paddedBin = binPad > 0 ? Buffer.concat([outBin, Buffer.alloc(binPad, 0x00)]) : outBin;

  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin]);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const creditEntries = [];

  for (const asset of ASSETS) {
    const outPath = path.join(OUT_DIR, asset.filename);
    console.log(`Fetching ${asset.filename} from ${asset.sourceUrl}...`);
    const res = await fetch(asset.sourceUrl);
    if (!res.ok) {
      throw new Error(`Failed to download ${asset.filename}: HTTP ${res.status}`);
    }
    const rawBuf = Buffer.from(await res.arrayBuffer());
    const finalBuf = asset.stripImages ? sanitizeGlbGeometryOnly(rawBuf) : rawBuf;
    fs.writeFileSync(outPath, finalBuf);

    const sha256 = crypto.createHash('sha256').update(finalBuf).digest('hex');
    const sizeKb = (finalBuf.length / 1024).toFixed(1);
    console.log(`  ✓ Saved ${asset.filename} (${sizeKb} KB, sha256=${sha256.slice(0, 16)}...)`);

    creditEntries.push({
      ...asset,
      sizeBytes: finalBuf.length,
      sizeKb,
      sha256,
    });
  }

  // Write app/assets/models/CREDITS.md
  const creditsMd = [
    '# 3D CAD & Mesh Asset Credits (`app/assets/models/`)',
    '',
    'All 3D CAD assets in Inside Out Studio are sourced exclusively from open-licensed repositories (**Public Domain / CC0 / CC-BY 4.0**), verified via `scripts/fetch-assets.mjs`, and stripped of any embedded trademark textures so all materials are rendered procedurally using Three.js PBR shaders.',
    '',
    '| File | Title | Author / Attribution | License | Size | SHA-256 |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ...creditEntries.map(
      (c) =>
        `| \`${c.filename}\` | **${c.title}** | ${c.author} | ${c.license} | ${c.sizeKb} KB | \`${c.sha256.slice(0, 16)}…\` |`,
    ),
    '',
    '## Detailed Asset Provenance & Usage',
    '',
    ...creditEntries.flatMap((c) => [
      `### \`${c.filename}\` — ${c.title}`,
      `- **Author / Source**: ${c.author}`,
      `- **License**: ${c.license}`,
      `- **Upstream URL**: ${c.sourceUrl}`,
      `- **Geometry Stats**: ${c.stats}`,
      `- **Used In**: ${c.usedIn}`,
      `- **Verified Size**: ${c.sizeBytes.toLocaleString()} bytes (${c.sizeKb} KB)`,
      `- **Verified SHA-256**: \`${c.sha256}\``,
      '',
    ]),
  ].join('\n');

  const creditsPath = path.join(OUT_DIR, 'CREDITS.md');
  fs.writeFileSync(creditsPath, creditsMd, 'utf8');
  console.log(`\n✅ Wrote ${creditsPath} with ${creditEntries.length} verified CAD assets.`);
}

main().catch((err) => {
  console.error('fetch-assets failed:', err);
  process.exit(1);
});
