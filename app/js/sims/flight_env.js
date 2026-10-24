// Environment builders for ✈️ Flight mode: gradient sky dome, sun, scrolling ground tiles + runway, clouds.
import * as THREE from '../../vendor/three.module.js';
import { makeCanvasTexture, makeGlowQuad } from './base.js';

const TILE = 6;
const GRID = 9; // 9 x 9 tiles = 54 m square scrolling under the aircraft

export function buildSky(env) {
  const tex = makeCanvasTexture(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e3a8a');
    g.addColorStop(0.45, '#60a5fa');
    g.addColorStop(0.62, '#bae6fd');
    g.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(70, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, toneMapped: false }),
  );
  dome.renderOrder = -10;
  env.add(dome);
  const sun = makeGlowQuad(0xfff7c2, 14, 0.9, true);
  sun.position.set(-30, 26, -40);
  sun.lookAt(0, 0, 0);
  env.add(sun);
  return dome;
}

export function buildGround(env, floorY) {
  const ground = new THREE.Group();
  ground.position.y = floorY;
  const greens = [0x3f7a2f, 0x4c8c37, 0x6b8e23, 0x5b7f2b, 0x8aa84a];
  const tiles = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const mat = new THREE.MeshStandardMaterial({ color: greens[(i * 3 + j * 5) % greens.length], roughness: 1 });
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(TILE - 0.08, TILE - 0.08), mat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set((i - (GRID - 1) / 2) * TILE, -0.02, (j - (GRID - 1) / 2) * TILE);
      ground.add(tile);
      tiles.push(tile);
    }
  }
  // Runway: dark asphalt strip along +X with centerline dashes and threshold stripes
  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID * TILE, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }),
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.y = 0.0;
  ground.add(runway);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const dashes = [];
  for (let k = 0; k < 18; k++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.08), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-26 + k * 3, 0.01, 0);
    ground.add(dash);
    dashes.push(dash);
  }
  for (const z of [-0.55, -0.3, 0.3, 0.55]) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.12), dashMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-2.5, 0.01, z);
    ground.add(stripe);
    dashes.push(stripe);
  }
  env.add(ground);
  return { ground, tiles, dashes, span: GRID * TILE };
}

export function buildClouds(env, count = 14) {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const size = 1.6 + Math.random() * 2.6;
    const puff = makeGlowQuad(0xffffff, size, 0.78);
    puff.position.set(-24 + Math.random() * 48, 2.5 + Math.random() * 7, -14 + Math.random() * 28);
    env.add(puff);
    clouds.push(puff);
  }
  return clouds;
}

// Scroll tiles/dashes toward -X by `dist`, wrapping within the ground span.
export function scrollGround(groundInfo, dist) {
  const half = groundInfo.span / 2;
  for (const t of groundInfo.tiles) {
    t.position.x -= dist;
    if (t.position.x < -half) t.position.x += groundInfo.span;
  }
  for (const d of groundInfo.dashes) {
    d.position.x -= dist;
    if (d.position.x < -half) d.position.x += groundInfo.span;
  }
}

export function scrollClouds(clouds, dist, camera) {
  for (const c of clouds) {
    c.position.x -= dist;
    if (c.position.x < -26) c.position.x += 52;
    c.lookAt(camera.position);
  }
}
