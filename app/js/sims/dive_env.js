// Environment builders for 🌊 Dive mode: wavy water surface, seabed, bubbles, retractable masts.
import * as THREE from '../../vendor/three.module.js';
import { makeGlowQuad } from './base.js';

export function buildWater(env, waterY) {
  const geo = new THREE.PlaneGeometry(70, 70, 36, 36);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterY;
  water.renderOrder = 5;
  env.add(water);
  const base = Float32Array.from(geo.attributes.position.array);
  return { water, geo, base };
}

export function animateWater(info, t, amp = 0.05) {
  const pos = info.geo.attributes.position;
  const arr = pos.array;
  for (let i = 0; i < pos.count; i++) {
    const x = info.base[i * 3];
    const y = info.base[i * 3 + 1];
    arr[i * 3 + 2] = Math.sin(x * 0.55 + t * 1.3) * amp + Math.cos(y * 0.7 + t * 0.9) * amp * 0.7;
  }
  pos.needsUpdate = true;
}

export function buildSeabed(env, y) {
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({ color: 0x5c4a2e, roughness: 1 }),
  );
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = y;
  env.add(bed);
  // A few boulders so the seabed reads as terrain in the fog
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3f3a33, roughness: 0.95 });
  for (let i = 0; i < 10; i++) {
    const r = 0.25 + Math.random() * 0.7;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat);
    rock.position.set(-14 + Math.random() * 28, y + r * 0.4, -14 + Math.random() * 28);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    env.add(rock);
  }
  return bed;
}

export function buildBubbles(env, count = 42) {
  const bubbles = [];
  for (let i = 0; i < count; i++) {
    const b = makeGlowQuad(0xd9f6ff, 0.06 + Math.random() * 0.09, 0.75, true);
    b.visible = false;
    b.userData.vy = 0.5 + Math.random() * 0.6;
    env.add(b);
    bubbles.push(b);
  }
  return bubbles;
}

// Emit `n` bubbles from `origin` (world-space Vector3-like), recycling hidden quads first.
export function emitBubbles(bubbles, origin, n, spread = 0.2) {
  let emitted = 0;
  for (const b of bubbles) {
    if (emitted >= n) break;
    if (b.visible) continue;
    b.visible = true;
    b.position.set(
      origin.x + (Math.random() - 0.5) * spread,
      origin.y + (Math.random() - 0.5) * spread * 0.5,
      origin.z + (Math.random() - 0.5) * spread,
    );
    emitted++;
  }
}

export function updateBubbles(bubbles, dt, waterY, camera, drift) {
  for (const b of bubbles) {
    if (!b.visible) continue;
    b.position.y += b.userData.vy * dt;
    b.position.x -= drift * dt;
    b.lookAt(camera.position);
    if (b.position.y >= waterY - 0.02) b.visible = false;
  }
}

// Two photonics masts on top of the sail; they slide down into the sail as the boat dives.
export function buildMasts(viewer, sailGroups) {
  const box = new THREE.Box3();
  for (const g of sailGroups) box.expandByObject(g);
  if (box.isEmpty()) box.setFromObject(viewer.rootGroup);
  const cx = (box.min.x + box.max.x) / 2;
  const top = box.max.y;
  const mat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.6 });
  const masts = [];
  for (const dx of [-0.08, 0.1]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 10), mat);
    m.position.set(cx + dx, top + 0.25, 0);
    m.userData.topY = top + 0.25;
    viewer.rootGroup.add(m);
    masts.push(m);
  }
  return masts;
}
