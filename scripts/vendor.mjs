// Copies the pinned three.js ES-module build + studio addons + Draco decoder from node_modules into app/vendor
// so the app is served as plain static files (no bundler, no CDN, no runtime network calls).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = path.join(root, 'node_modules', 'three');
const srcDir = path.join(pkgDir, 'build');
const destDir = path.join(root, 'app', 'vendor');
const FILES = ['three.module.js', 'three.core.js'];
const ADDONS = [
  ['examples/jsm/environments/RoomEnvironment.js', 'RoomEnvironment.js'],
  ['examples/jsm/geometries/RoundedBoxGeometry.js', 'RoundedBoxGeometry.js'],
  ['examples/jsm/utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js'],
  ['examples/jsm/utils/SkeletonUtils.js', 'SkeletonUtils.js'],
  ['examples/jsm/loaders/DRACOLoader.js', 'DRACOLoader.js'],
  ['examples/jsm/loaders/GLTFLoader.js', 'GLTFLoader.js'],
];
const DRACO_FILES = [
  'draco_decoder.js',
  'draco_decoder.wasm',
  'draco_wasm_wrapper.js',
];

const haveVendored =
  FILES.every((f) => fs.existsSync(path.join(destDir, f))) &&
  ADDONS.every(([, out]) => fs.existsSync(path.join(destDir, out)));
if (!fs.existsSync(pkgDir)) {
  if (haveVendored) {
    console.log('node_modules/three not found; using the existing app/vendor copy.');
    process.exit(0);
  }
  console.error('three.js is not installed. Run: npm install --ignore-scripts');
  process.exit(1);
}

const expected = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).dependencies.three;
const installed = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;
if (installed !== expected) {
  console.error(`three version mismatch: installed ${installed}, expected ${expected}. Run: npm install --ignore-scripts`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
for (const file of FILES) fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
for (const [relSrc, outName] of ADDONS) {
  const raw = fs.readFileSync(path.join(pkgDir, relSrc), 'utf8');
  const rewritten = raw
    .replace(/from\s+['"]three['"]/g, "from './three.module.js'")
    .replace(/from\s+['"]\.\.\/utils\/BufferGeometryUtils\.js['"]/g, "from './BufferGeometryUtils.js'")
    .replace(/from\s+['"]\.\.\/utils\/SkeletonUtils\.js['"]/g, "from './SkeletonUtils.js'")
    .replace(/\.\.\/libs\/draco\/gltf\//g, './draco/')
    .replace(/\.\.\/libs\/draco\//g, './draco/');
  fs.writeFileSync(path.join(destDir, outName), rewritten, 'utf8');
}

const dracoSrcDir = path.join(pkgDir, 'examples', 'jsm', 'libs', 'draco', 'gltf');
const dracoDestDir = path.join(destDir, 'draco');
fs.mkdirSync(dracoDestDir, { recursive: true });
for (const df of DRACO_FILES) {
  fs.copyFileSync(path.join(dracoSrcDir, df), path.join(dracoDestDir, df));
}

fs.copyFileSync(path.join(pkgDir, 'LICENSE'), path.join(destDir, 'three.LICENSE.txt'));
console.log(`Vendored three@${installed} + RoomEnvironment + RoundedBoxGeometry + GLTFLoader + DRACOLoader into app/vendor`);
