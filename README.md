# 🔧 Inside Out Studio

> **Explode & explore how the world works from the inside out!**
>
> 🌐 **Live Web App**: [https://inside-out-explorer.web.app](https://inside-out-explorer.web.app)

**Inside Out Studio** is an offline-first, hyper-realistic 3D engineering & deconstruction studio designed for kids and curious minds to blow apart **61 iconic real-world machines, helicopters, high-speed bullet trains, spacecraft, vehicles, aircraft, submarines, smartphones, and buildings** across **18 categories** into their real internal components, discover what every piece does, and play hands-on engineering simulations and games.

---

## ✨ Features

### 1. Studio PBR Lighting & Procedural Material Engine (`app/js/viewer.js` & `app/js/materials.js`)
- **Studio HDR Environment & Tone Mapping**: Uses `THREE.ACESFilmicToneMapping`, `THREE.PCFSoftShadowMap`, and `PMREMGenerator` + `RoomEnvironment` image-based lighting (`scene.environment`) so metallic clearcoats, glass canopies, brushed titanium, and chrome parts reflect crisp studio highlights.
- **Procedural Canvas Textures & PBR Shaders**: Automotive clearcoat paint (`carPaint`), carbon-fiber twill weave (`carbonFiberMat`), brushed titanium/aluminum (`brushedMetal`), optical glass (`glassMat`), perforated brake discs, radial tire treads, gold-trace PCBs (`pcbMat`), OLED displays (`screenMat`), and solar grids—100% procedural and offline-first.

### 2. Eight Categories & 31 Hyper-Detailed 3D Models (330+ Total Parts, 155 Quiz Questions)
Switch seamlessly between multiple iconic real-world models inside every category using the **Model Variant Selector Bar**:

1. **🏎️ Cars & Trucks (7 Models — 12 Parts Each)**:
   - **Tesla Model S Plaid**: Structural 4680 battery skateboard, tri-motor carbon-sleeved rotors, heat-pump octovalve, yoke cockpit, autopilot cameras.
   - **Tesla Cybertruck**: Cold-rolled 30X stainless steel exoskeleton, 800V Cybercell structural battery, steer-by-wire rack, adaptive air suspension, motorized tonneau vault.
   - **Rivian R1T Quad-Motor**: Quad-motor independent drive units, Adventure Gear Tunnel, stadium front lightbar & frunk, long-travel air suspension.
   - **Ferrari SF90 Stradale**: 4.0L Twin-Turbo V8 (`F154`), trio of axial-flux hybrid e-motors, carbon-fiber tub, active shut-off Gurney flap, Brembo carbon-ceramic brakes.
   - **Lamborghini Revuelto V12**: 6.5L Naturally Aspirated V12 (`L545`), Y-signature LED lights, carbon-fiber monofuselage, scissor doors, hexagonal titanium exhaust.
   - **Ford F-150 Raptor R**: 5.2L Supercharged Predator V8, FOX Live Valve internal-bypass shocks, boxed high-strength steel ladder frame, beadlock 37" off-road tires.
   - **Porsche 911 GT3 RS**: 4.0L Flat-6 Boxer (`9,000 RPM`), swan-neck DRS active rear wing, front center radiators, center-lock forged magnesium wheels.

2. **✈️ Airplanes (4 Models — 11 Parts Each)**:
   - **Boeing 737 MAX 9**: CFM LEAP-1B high-bypass engines with chevrons, split-tip scimitar winglets, 6-screen glass flight deck, pressurized fuselage & wing spars.
   - **Airbus A350-1000 XWB**: Carbon-fiber fuselage, Rolls-Royce Trent XWB turbofans, curved raccoon mask cockpit window, swept sharklet wingtips, 6-wheel main bogies.
   - **F-22 Raptor Stealth Fighter**: Internal weapons bays, 2D thrust-vectoring Pratt & Whitney F119 afterburners, gold-tinted stealth canopy, APG-77 AESA radar.
   - **Cessna 172 Skyhawk**: High-wing strut-braced airframe, Lycoming IO-360 flat-4 piston engine, 2-blade tractor propeller, Garmin G1000 glass cockpit, tricycle gear.

3. **🌊 Submarines (3 Models — 10 Parts Each)**:
   - **Virginia-Class SSN Submarine**: HY-100 steel pressure hull, S9G pressurized-water nuclear reactor, pump-jet propulsor, 12 VLS tomahawk tubes, photonics masts, sonar sphere.
   - **Deep-Sea Research Submersible (DSV)**: 90mm thick machined titanium personnel sphere, syntactic foam buoyancy block, 7-function robotic manipulator arms, drop-weights.
   - **Nautilus Luxury Panoramic Sub**: 360-degree cast acrylic spherical viewport, lithium-iron-phosphate battery pods, 6 vectored electric thrusters, VIP lounge deck.

4. **📱 Smartphones (5 Models — 10 Parts Each)**:
   - **iPhone 16 Pro Max**: Grade-5 Titanium frame, A18 Pro 3nm SoC, 5x Tetraprism periscope telephoto camera, MagSafe charging coil, Taptic Engine, Super Retina XDR OLED.
   - **iPhone 16 (Ultramarine)**: Color-infused glass back, vertical dual-camera fusion module, Action Button & Camera Control capacitive sapphire switch, A18 chip.
   - **Google Pixel 9 Pro XL**: Iconic horizontal aluminum Camera Bar visor, Google Tensor G4 AI chip, vapor chamber cooling, Super Actua LTPO OLED.
   - **Samsung Galaxy S24 Ultra**: Built-in S-Pen stylus & digitizer silo, 200MP quad-telephoto camera array, Snapdragon 8 Gen 3, Gorilla Armor flat display.
   - **Samsung Galaxy Z Fold 6**: Dual-rail FlexHinge gear mechanism, 7.6" foldable Ultra-Thin Glass (UTG) inner OLED, 6.3" cover screen, dual split batteries.

5. **🚀 Jet & Rocket Engines (3 Models — 10 Parts Each)**:
   - **GE9X Commercial Turbofan**: Carbon-fiber composite fan blades, 27:1 high-pressure compressor, twin-annular combustor, CMC turbines, chevrons.
   - **Pratt & Whitney F135 Afterburner**: 3-stage Titanium Blisk fan, augmentor spray rings & flameholders, variable convergent-divergent iris nozzle, glowing Mach diamonds.
   - **SpaceX Raptor Vacuum Rocket**: Full-flow staged-combustion oxygen/methane turbopumps, regeneratively cooled copper chamber, gimbal actuators, giant metallic bell nozzle.

6. **💻 Laptops (3 Models — 10 Parts Each)**:
   - **MacBook Pro 16" (M3 Max)**, **MacBook Air 15" (M3 Fanless)**, and **ROG Zephyrus RTX Gaming Laptop**.

7. **🏠 Architecture & Homes (3 Models — 10 Parts Each)**:
   - **Modern Solar Eco-Home**, **Luxury Glass Pavilion Villa**, and **Geodesic Eco-Dome Cabin**.

8. **📺 Display Tech & TVs (3 Models — 10 Parts Each)**:
   - **85" 8K Mini-LED Smart TV**, **Transparent OLED Concept TV**, and **IMAX Dual-Laser Home Cinema**.

9. **🚁 Helicopters & Rotorcraft (4 Models — 10 Parts Each + Vertical Hover Simulation)**:
   - **Sikorsky UH-60M Black Hawk (`uh60-black-hawk`)**: 1:4 scale lofted military airframe (`app/js/models/uh60_black_hawk.js`), 4 swept-tip composite main rotor blades (`16.36 m` rotor disc), forged titanium elastomer rotor hub + articulated swashplate & pitch links, twin GE T700-GE-701D turboshafts with HIRSS infrared-suppressed exhaust nacelles, 20°-canted 4-blade tail rotor on inclined pylon + stabilator, External Stores Support System (ESSS) stub wings + 230-gal crashworthy external tanks, armored cockpit + sliding troop cabin doors, and full 3D **Hover Flight Simulator (`app/js/sims/heli.js`)** with vertical lift-off, collective/cyclic pitch, yaw pedals, and rotor downwash rings.
   - **Airbus H145M Rescue Helicopter**, **DJI Mavic 3 Pro Quadcopter**, and **NASA Ingenuity Mars Helicopter**.

10. **🚄 High-Speed & Bullet Trains (3 Multi-Car Trainsets — 10 Parts Each + High-Speed Rail & Maglev Sim)**:
   - **JR Central / JR West Shinkansen N700S Supreme (`shinkansen-n700s`)**: 4-car articulated trainset (`app/js/models/bullet_trains.js`) with Dual Supreme Wing aero nose loft, Tokaido twin royal-blue livery, SiC VVVF underfloor traction packs, bolsterless WDT209 bogies, single-arm TPS301 pantograph, and CRTS slab track.
   - **China Railway CR400AF Fuxing Hao (`cr400af-fuxing`)**: 4-car 350–400 km/h Chinese bullet trainset with sculpted 12-meter aero-streamlined nose cone, crimson/silver "Flying Dragon" wraparound ribbon livery & 复兴号 markings, roof aerodynamic shroud, CW350 high-speed bogies, and ballastless slab track.
   - **JR Central L0 Series SCMaglev (`scmaglev-l0`)**: 4-car 603 km/h world-record Japanese superconducting magnetic levitation trainset with 15-meter aero-wedge nose, cryogenic liquid-helium NbTi superconducting bogie magnets, and U-shaped concrete guideway lined with figure-8 levitation & linear-motor propulsion coils.

---

## 🚀 Quick Start

```bash
cd /Users/enriq/.gemini/jetski/scratch/inside-out-studio
npm start
```
Then open **http://127.0.0.1:8137** in your browser.

## 🧪 Automated E2E Tests & Screenshots

```bash
npm test
```
Runs `tests/e2e.mjs` against headless Chrome over raw CDP, verifying all **8 categories**, all **31 3D models**, all **4 game modes**, desktop (`1440x900`) and mobile (`393x852`) layouts, and asserting **0 console errors, 0 page exceptions, and 0 CSP violations**.
