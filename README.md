# 🔧 Inside Out Studio

> **Explode & explore how the world works from the inside out!**
>
> 🌐 **Live Web App**: [https://inside-out-explorer.web.app](https://inside-out-explorer.web.app)

**Inside Out Studio** is an offline-first, hyper-realistic 3D engineering & deconstruction studio designed for kids and curious minds to blow apart **79 iconic real-world machines, gaming consoles, spatial XR headsets, cameras, appliances, helicopters, high-speed bullet trains, spacecraft, vehicles, aircraft, submarines, smartphones, and buildings** across **21 categories** into their real internal components, discover what every piece does, and play hands-on engineering simulations and games.

---

## ✨ Features

### 1. Studio PBR Lighting, Blueprint Dark Mode & Discovery UX (`app/js/viewer.js`, `app/js/materials.js`, `app/styles.css`)
- **Studio HDR Environment & Tone Mapping**: Uses `THREE.ACESFilmicToneMapping`, `THREE.PCFSoftShadowMap`, and `PMREMGenerator` + `RoomEnvironment` image-based lighting (`scene.environment`) so metallic clearcoats, glass canopies, brushed titanium, and chrome parts reflect crisp studio highlights.
- **Blueprint Dark Mode & Stitch HUD**: Toggle between warm drafting-paper light mode and **Blueprint Dark Mode (`[data-theme="dark"]`)** with >=4.5:1 WCAG AA contrast, crisp SVG HUD tool icons, URL hash deep-linking (`#<category>/<model>/<mode>`), and keyboard 3D stage orbit/zoom.
- **Instant Catalog Search & Domain Filters**: Filter all **21 categories** and **79 models** in real time by name, component, or engineering domain (**Vehicles**, **Air & Space**, **Consumer Tech**, **Everyday & Infra**), with one-click quick-jump model pills.
- **Procedural Canvas Textures & PBR Shaders**: Automotive clearcoat paint (`carPaint`), carbon-fiber twill weave (`carbonFiberMat`), brushed titanium/aluminum (`brushedMetal`), optical glass (`glassMat`), perforated brake discs, radial tire treads, gold-trace PCBs (`pcbMat`), OLED displays (`screenMat`), and solar grids—100% procedural and offline-first.

### 2. Twenty-One Categories & 79 Hyper-Detailed 3D Models (774+ Total Parts, 395 Quiz Questions, 315 Max Stars)
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

11. **☕ Everyday Engineering & Appliances (7 Models — 10 Parts Each)**:
   - **Dyson V15 Detect Cordless Cyclone Vacuum (`dyson-v15-vacuum`)**: 14 scrolled root-cyclone cones (`100,000 G`), `125,000 RPM` Hyperdymium brushless motor, green `532 nm` laser dust-reveal cleanerhead, acoustic piezo particle sensor, and PTFE HEPA filter.
   - **Stainless French-Door Heat-Pump Refrigerator (`french-door-refrigerator`)**: Variable-speed inverter `R-600a` hermetic compressor, serpentine condenser + capillary expansion valve + finned evaporator coils, Vacuum Insulation Panels (VIP), and through-the-door crushed-ice auger.
   - **Heavy-Duty Commercial Escalator (`commercial-escalator`)**: Structural 30° steel Warren truss, worm-gear machine bay, 16 cleated aluminum steps riding dual endless chains along flat landing transitions, synchronized handrails, and safety comb-plate limit switches.
   - Plus **Siphon-Flush Toilet**, **Skyscraper Gearless Traction Elevator**, **5-Pin Brass Tumbler Lock**, and **9-Bar Dual-Boiler Italian Espresso Machine**.

12. **🎮 Gaming Consoles & Controllers (3 Models — 10 Parts Each)**:
   - **PlayStation 5 Pro Console (`ps5-pro-console`)**: Liquid-metal TIM custom RDNA SoC, copper vapor-chamber fin array, `120 mm` dual-intake centrifugal blower, detachable Ultra-HD Blu-ray drive, and M.2 PCIe Gen4 expansion bay.
   - **DualSense Wireless Adaptive Controller (`dualsense-controller`)**: Worm-gear motorized adaptive `L2`/`R2` triggers, dual voice-coil haptic actuators, potentiometer/Hall thumbstick gimbals, and 6-axis MEMS IMU mainboard.
   - **Handheld Hybrid OLED Console (`handheld-hybrid-console`)**: Laminated `7.4"` vivid OLED touchscreen, snap-rail neon left/right wireless controllers with NFC & IR camera, flattened copper heatpipe + micro-blower, magnesium kickstand, and HDMI 2.1 TV dock.

13. **🎧 Spatial XR & Audio (3 Models — 10 Parts Each)**:
   - **Apple Vision Pro Spatial Computer (`apple-vision-pro`)**: 3D laminated glass + lenticular EyeSight OLED, CNC curved aluminum frame, dual `23M`-pixel micro-OLED + 3-element pancake optics, dual `M2` + `R1` (`12 ms`) spatial silicon, LiDAR + 12-camera array, and Spatial Audio pods.
   - **AirPods Pro 2 & MagSafe Case (`airpods-pro-2`)**: Custom high-excursion neodymium drivers, Apple `H2` SiP (`48,000 Hz` ANC), optical skin-detect sensors, `U1` Ultra-Wideband Find My case PCB, Qi/MagSafe copper coil, and lanyard antenna loop.
   - **Flagship Over-Ear ANC Headphones (`anc-over-ear-headphones`)**: `40 mm` carbon-fiber-composite dome drivers, 8-mic hybrid feedforward/feedback ANC array, viscoelastic memory-foam cushions, right-cup capacitive touch grid, and balanced left-cup battery.

14. **📷 Cameras & Optics (3 Models — 10 Parts Each)**:
   - **Full-Frame Mirrorless Camera & f/2.8 Zoom (`mirrorless-fullframe-camera`)**: `45 MP` stacked CMOS sensor on 5-axis IBIS stage, `1/8000s` carbon-blade focal-plane shutter, multi-element `24-70mm f/2.8` optical glass + 9-blade iris, and `9.44M`-dot OLED EVF.
   - **Retro Instant Film Camera (`instant-film-camera`)**: Rainbow step shell, `45°` reflex mirror, integral 8-shot reagent-pod cassette, precision stainless steel developer rollers, and `330V` Xenon flash capacitor.
   - **IMAX 70mm 15-Perf Cinema Camera (`imax-70mm-cinema-camera`)**: Twin coaxial `1,000-ft` magnesium `65mm` film magazines, horizontal 15-perforation Kodak loop (`336 ft/min`), patented Rolling-Loop vacuum gate, `45°` spinning butterfly mirror shutter, and Panavision `T2.0` cinema prime + carbon matte box.

15. **🛰️ Spacecraft**, **🚀 Orbital Rockets**, **🤖 Robotics & Iron Man Mk 85**, **🏗️ Heavy Construction & Agriculture**, **⌚ Mechanical Horology**, **🏍️ Bikes & Superbikes**, and **🚢 Ocean Liners & Naval Ships** complete the **21-category** engineering atlas!

---

## 🚀 Quick Start

```bash
npm start
```
Then open **http://127.0.0.1:8137** in your browser.

## 🧪 Automated E2E Tests & Screenshots

```bash
npm test
```
Runs `tests/e2e.mjs` against headless Chrome over raw CDP, verifying all **21 categories**, all **79 3D models**, all **5 interactive modes**, Blueprint Dark Mode, live catalog search & domain filters, **13 languages** + Chirp 3 HD Read Aloud, desktop (`1440x900`) and mobile (`393x852`) layouts, and asserting **0 console errors, 0 page exceptions, and 0 CSP violations**.
