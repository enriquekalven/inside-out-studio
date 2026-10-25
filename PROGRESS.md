# Inside Out Studio — Progress Log

Last updated: 2026-10-22 20:32 PT

## Goal
**Inside Out Studio — Hyper-Realistic Multi-Model 3D Engineering & Deconstruction Studio**
Interactive 3D web app for kids and curious minds to explode/assemble **31 iconic real-world machines, vehicles, aircraft, submarines, smartphones, and buildings** across **8 categories** (**Cars & Trucks**, **Airplanes**, **Submarines**, **Smartphones**, **Jet & Rocket Engines**, **Laptops**, **Architecture & Homes**, **Display Tech & TVs**), inspect **330+ distinct 3D parts** with kid-friendly explanations and fun facts, and play 4 interactive modes (**Explore**, **Find It!**, **Build It!**, **Quiz**) with stars (`96` max), progress tracking, synthesized sound effects, Read Aloud speech, and celebration confetti.

## Architecture & Security Decisions
- **Stack**: Plain ES modules + Three.js `0.186.1` + vendored `RoomEnvironment.js` and `RoundedBoxGeometry.js` in `app/vendor/` via `scripts/vendor.mjs`. Zero bundler and zero transitive dependencies.
- **PBR Studio Rendering (`app/js/viewer.js` & `app/js/materials.js`)**: `THREE.ACESFilmicToneMapping`, `THREE.PCFSoftShadowMap`, `PMREMGenerator` + `RoomEnvironment` image-based lighting (`scene.environment`), soft floor shadow plane, and cached procedural Canvas2D textures (carbon fiber weave, brushed metal, perforated brake rotors, radial tire treads, PCB gold traces, solar cells, OLED screens, brick masonry).
- **Server**: `server.mjs`, a zero-dependency Node static server listening on `127.0.0.1:8137` with strict CSP + security headers (`default-src 'self'`, `connect-src 'none'`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`), allowing only `GET`/`HEAD` and guarding against path traversal and dotfiles.
- **Safe DOM Construction**: `app/js/ui.js` builds all DOM nodes via `document.createElement` and `textContent` (never `innerHTML`).
- **Offline-First Audio & Speech**: `app/js/sound.js` synthesizes sound effects (pop, snap, whoosh, chime, fanfare) with Web Audio API oscillators and reads descriptions aloud via local `window.speechSynthesis` voices.
- **Automated Verification**: `tests/e2e.mjs` drives headless Chrome over raw Chrome DevTools Protocol (CDP) via Node's built-in `WebSocket`, verifying all 8 categories, all 31 3D models via the Model Variant Selector, all 4 modes, desktop (`1440x900`) and mobile (`393x852`) layouts, and asserting 0 console errors, 0 page exceptions, and 0 CSP violations.

## Milestones
- [x] M0 `package.json`, `npm install --ignore-scripts` (`three@0.186.1` only)
- [x] M1 `server.mjs`, `scripts/vendor.mjs` (vendors `three.module.js`, `OrbitControls.js`, `RoomEnvironment.js`, `RoundedBoxGeometry.js`)
- [x] M2 Hyper-Realistic PBR Studio Renderer (`app/js/viewer.js`) + Procedural Materials & Geometry Builders (`app/js/materials.js`)
- [x] M3 All 8 Categories & 31 Hyper-Detailed 3D Models (330+ parts, 155 quiz questions) across `app/js/models/cars.js`, `aviation_marine.js`, `phones_propulsion.js`, `tech_architecture.js`, and `app/js/catalog.js`
- [x] M4 Model Variant Selector Bar (`#model-selector`) + 4 Interactive Modes (**Explore**, **Find It!**, **Build It!**, **Quiz**) + `96` Max Stars in `app/js/main.js`, `app/index.html`, and `app/styles.css`
- [x] M5 Headless Chrome CDP E2E test suite (`tests/e2e.mjs`) verifying all categories & models + desktop & mobile screenshots in `./screenshots/`
- [x] M6 Hyper-Realistic Sikorsky UH-60M Black Hawk (`app/js/models/uh60_black_hawk.js`) + Vertical Hover Simulator (`app/js/sims/heli.js`), Multi-Car Japanese & Chinese High-Speed Bullet Trains (`app/js/models/bullet_trains.js`: Shinkansen N700S Supreme, CR400AF Fuxing Hao, SCMaglev L0), shared parametric loft engine (`app/js/loft.js`), and production deployment to `https://inside-out-explorer.web.app` (`project-maui`)
- [x] M7 Engineering-completeness pass across all 18 categories / 67 models / 654 parts: missing automotive subsystems on all 9 cars (EPAS steering racks & columns, sway bars, ICE/PHEV fuel tanks & pumps, EV charge ports & on-board chargers, SF90 PHEV battery, radiators, superchargers, compressors), `makeCarQuiz` rewritten as a tiered category-aware resolver (27/27 generic car questions verified), Saturn V real 3-stage split via plane-clipped CAD stage bands (`clipGeometryToYBand` in `app/js/cad_loader.js`) + J-2/LM repositioning, Starship 6-engine bay, 10-part Carbon Aero Road Bike, 10-part SR-71 Blackbird, Nimitz EMALS/AAG/elevators, ship stabilizers & reefer racks, enriched everyday machines, 5 vehicle-aware rocket quiz questions, and a full-catalog headless Chrome sweep (every model: CAD-ready part meshes, explode, full quiz flow, action/sim mode, 0 console errors)
- [x] M8 Movie-accurate Iron Man Mark LXXXV (85) rebuild (`app/js/models/iron_man_mark85.js`): lofted superellipse armor shells via `loft.js` (torso front/back, helmet with gold faceplate & slanted HUD eyes, pauldrons, bicep/calf limbs, heel-to-toe boots), MCU red/gold color blocking, triangular-core RT arc reactor, domed gold abs, palm repulsors in a power stance, swept-back nano-lightning refocuser blades, airbrake fins & thrusters, X-ray endoskeleton; 5 quiz questions; back part renamed `dorsal-airbrake-array` to stay clear of the FlightSim flap regex

## How to Run
```bash
cd /Users/enriq/.gemini/jetski/scratch/inside-out-studio
npm start   # vendors three.js addons and serves http://127.0.0.1:8137
npm test    # runs headless Chrome E2E suite across all models and saves screenshots to ./screenshots/
```
