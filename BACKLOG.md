# Inside Out Studio — Category Backlog (approved by user 2026-10-22 22:31)

Owner: parent agent 79eea474. Execute in batches AFTER the current queue
(Phase 2 realism pass → Trains → Space Station → per-category action modes) is green.
Each batch: fetch assets via `scripts/fetch-assets.mjs` (+ `CREDITS.md`), models at CAD
fidelity (no bare primitives as whole parts), per-category action mode with HUD + 3-star
checklist, e2e smoke, assembled/exploded/action screenshots inspected with `view_file`,
`PROGRESS.md` updated, 0 console/CSP errors. Update MAX_STARS = categories × 4 × 3.

## Verified free assets (checked 22:32)
NASA-3D-Resources (public domain, 17 U.S.C. §105), repo `nasa/NASA-3D-Resources`, branch `master`,
path prefix `3D Models/` (URL-encode spaces/parentheses):
- `Saturn V/Saturn V.glb` (905 KB)
- `Apollo Lunar Module/Apollo Lunar Module.glb` (700 KB)
- `Apollo Soyuz/Apollo Soyuz.glb` (930 KB)
- `Mars 2020 Perseverance Rover/Mars 2020 Perseverance Rover.glb` (4.9 MB)
- `Ingenuity Mars Helicopter/Ingenuity Mars Helicopter.glb` (2.0 MB)
- `Hubble Space Telescope (B)/Hubble Space Telescope (B).glb` (5.0 MB) / (A) 1.7 MB
- `Mark III Spacesuit/Mark III Spacesuit.glb` (873 KB), `Gemini Spacesuit/Gemini Spacesuit.glb` (2.8 MB)
- (Curiosity and SLS are .blend/.7z only — skip or build procedurally)
Khronos glTF-Sample-Assets (CC-BY 4.0 / per README):
- `Models/ChronographWatch/glTF-Binary/ChronographWatch.glb`
- `Models/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb` (power tool, CAD)
three.js examples (check LICENSE in repo): `examples/models/gltf/CarbonFrameBike.glb`

## Batch 1 (highest kid-appeal, best assets)
1. 🚀 **Rockets** (`rocket`) — action **Launch It!** (countdown, ignition, max-Q shake, stage
   separation, fairing jettison, booster boost-back + landing legs/grid fins, HUD: altitude,
   velocity, g-force, stage, fuel %).
   - `falcon-9` Falcon 9 Block 5 (procedural: 9 Merlin octaweb, grid fins, landing legs,
     interstage, MVac, fairing halves, Crew Dragon or Starlink stack)
   - `starship` Starship + Super Heavy (procedural: 33 Raptors, hot-stage ring, flaps, header tanks,
     heat-shield tiles, chopstick catch tower in action mode)
   - `saturn-v` Saturn V (NASA CAD) + Apollo LM (NASA CAD): F-1 ×5, J-2 ×5 + 1, S-IC/S-II/S-IVB,
     LES tower, CSM, LM in adapter
2. 🤖 **Robots & Rovers** (`robot`) — action **Drive the Rover! / Power It Up!** (Mars terrain,
   rocker-bogie over rocks, mast cam pan, drill, Ingenuity takes off alongside; arm: pick-and-place)
   - `perseverance` Perseverance (NASA CAD) + Ingenuity (NASA CAD)
   - `robot-arm-6axis` 6-axis industrial arm (procedural: servos, harmonic drives, gripper,
     cable chain, controller cabinet)
   - `quadruped` Spot-style quadruped (procedural: 12 actuators, battery, lidar/cameras, payload rail)
3. 🏗️ **Construction & Farm** (`construction`) — action **Dig It! / Harvest It!** (boom/stick/bucket
   on keys, hydraulic rams extend, tracks turn, dirt pile; crane: slew/trolley/hoist)
   - `excavator` 30-ton tracked excavator (hydraulic cylinders, slew ring, undercarriage, counterweight,
     diesel engine, cab)
   - `tower-crane` tower crane (mast sections, slewing unit, jib, counter-jib + ballast, trolley, hook block)
   - `combine` combine harvester (header reel, auger, threshing drum, sieves, grain tank, unloading auger)
   - `tractor` John-Deere-class tractor (diesel, PTO, 3-point hitch, dual rear tires)

## Batch 2
4. 🚁 **Helicopters & Drones** (`heli`) — action **Take It for a Hover!** (collective/cyclic/pedals,
   ground effect dust, HUD: torque, rotor RPM, altitude)
   - `blackhawk` UH-60 (4-blade main rotor, swashplate, tail rotor, twin T700 turboshafts, gearbox)
   - `h145` Airbus H145 (Fenestron, bearingless rotor)
   - `dji-mavic` DJI Mavic (4 brushless motors + ESCs, folding arms, 3-axis gimbal, battery, obstacle sensors)
   - `ingenuity` NASA Ingenuity (coaxial rotors, solar panel, battery, avionics) — shared asset
5. ⌚ **Mechanical Watch & Clock** (`watch`) — action **Wind It Up!** (crown turns, mainspring
   tightens, gear train runs, balance wheel oscillates 4 Hz, chronograph start/stop; HUD: power
   reserve, beats/hour, seconds)
   - `chronograph` Khronos ChronographWatch (CAD) + procedural movement (mainspring barrel, gear
     train, escapement, balance, column wheel)
   - `grandfather-clock` pendulum clock (weights, pendulum, escapement, chime train)
6. 🚲 **Bikes & Motorcycles** (`bike`) — action **Take It for a Ride!** (pedal/throttle, gears shift,
   chain moves, suspension bobs, lean into turns)
   - `carbon-road-bike` three.js CarbonFrameBike + procedural drivetrain (derailleurs, cassette,
     chain, disc brakes, bottom bracket)
   - `e-bike` mid-drive e-bike (motor, battery, torque sensor, display)
   - `superbike` Ducati-class superbike (desmo V4, trellis/monocoque, USD forks, single-sided swingarm)

## Batch 3
7. 🚢 **Ships** (`ship`) — action **Set Sail!** (waves, wake, rudder, bow thruster, HUD: knots,
   heading, draft; Titanic: watertight doors demo)
   - `container-ship` 24,000 TEU (2-stroke diesel, shaft, prop, rudder, bulbous bow, holds, bridge)
   - `aircraft-carrier` Ford-class (EMALS catapults, arresting gear, island, elevators, reactors)
   - `titanic` RMS Titanic (triple-expansion engines, boilers, 16 compartments, lifeboats)
8. 🏠 **Everyday Machines** (`everyday`) — action per model:
   - `toilet` **Flush It!** (float valve, flapper, siphon jet — water sim)
   - `elevator` **Ride It!** (traction sheave, counterweight, governor, safety brakes, doors)
   - `pin-tumbler-lock` **Unlock It!** (key lifts pins to shear line, plug rotates)
   - `washing-machine` **Run a Cycle!** (drum, motor belt, pump, counterweight, suspension)
   - `espresso-machine` **Pull a Shot!** (boiler, pump 9 bar, group head, portafilter, steam wand)

## Not selected (keep for later): 🔭 Telescopes & Satellites (JWST/Hubble — assets available),
⚡ Power Generation, roller coaster, piano action, 3D printer, F1 car (could join Cars).
