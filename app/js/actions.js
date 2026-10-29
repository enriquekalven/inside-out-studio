// Inside Out Studio — Per-Category Action Mode Descriptors.
// Each category gets its own "action" (Drive It!, Take It for a Flight!, ...). The descriptor drives the
// button label, mode tab, stage hint, HUD gauges, on-screen controls, key bindings, 3-star checklist and
// celebration copy. The physics/animation lives in `./sims/*.js`.

const KEYS_WASD = {
  w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
  shift: 'boost', b: 'boost', ' ': 'space',
};
const KEYS_PITCH = { ...KEYS_WASD, arrowup: 'pitchUp', arrowdown: 'pitchDown' };

const hold = (id, label, title, input, primary = false) => ({ id, label, title, input, primary });
const tap = (id, label, title, trigger) => ({ id, label, title, trigger });

export const ACTIONS = {
  car: {
    id: 'drive', verb: 'Drive It!', stopVerb: 'Stop Driving', emoji: '🏎️', tab: 'Drive It!',
    hint: 'to test-drive', keys: KEYS_WASD, taps: { l: 'lights', h: 'horn' },
    hud: [
      { id: 'speed', label: 'MPH', big: true },
      { id: 'gear', label: 'Gear' },
      { id: 'rpm', label: 'RPM', bar: true, max: 9000 },
    ],
    controls: [
      hold('left', '⬅️ Steer L', 'Steer Left (A / ←)', 'left'),
      hold('right', '➡️ Steer R', 'Steer Right (D / →)', 'right'),
      hold('up', '🟢 Gas', 'Accelerate (W / ↑)', 'up', true),
      hold('down', '🔴 Brake', 'Brake / Reverse (S / ↓)', 'down'),
      hold('boost', '🔥 Nitro', 'Nitro Boost (Shift / B)', 'boost'),
      tap('lights', '💡 Lights', 'Toggle Headlights (L)', 'lights'),
      tap('horn', '📯 Horn', 'Sound Horn (H)', 'horn'),
    ],
    checklist: [
      { id: 'fast', label: 'Hit 100 MPH' },
      { id: 'boost', label: 'Fire the Nitro boost' },
      { id: 'stop', label: 'Brake to a full stop' },
    ],
    celebrate: { title: 'Test-Drive Complete!', text: 'You drove it like a pro racing driver!' },
  },
  airplane: {
    id: 'flight', verb: 'Take It for a Flight!', stopVerb: 'Land & Stop', emoji: '✈️', tab: 'Take It for a Flight!',
    hint: 'to spool up the turbofans, rotate, retract gear & cruise at Mach 0.8', keys: KEYS_PITCH, taps: { l: 'lights', g: 'gear' },
    hud: [
      { id: 'airspeed', label: 'KT', big: true }, { id: 'mach', label: 'Mach' },
      { id: 'altitude', label: 'Alt ft' }, { id: 'vs', label: 'V/S fpm' },
      { id: 'throttle', label: 'N1 Thrust %', bar: true, max: 100 },
    ],
    controls: [
      hold('left', '↶ Bank L', 'Bank & Yaw Left (A / ←)', 'left'),
      hold('right', '↷ Bank R', 'Bank & Yaw Right (D / →)', 'right'),
      hold('up', '🟢 Throttle', 'Throttle Up (W)', 'up', true),
      hold('down', '🔴 Brake', 'Idle / Wheel Brakes (S)', 'down'),
      hold('pitchUp', '⬆️ Climb', 'Pitch Up (↑)', 'pitchUp'),
      hold('pitchDown', '⬇️ Descend', 'Pitch Down (↓)', 'pitchDown'),
      tap('gear', '🛞 Gear', 'Landing Gear Up/Down (G)', 'gear'),
      tap('lights', '💡 Lights', 'Nav / Landing Lights (L)', 'lights'),
    ],
    checklist: [
      { id: 'takeoff', label: 'Take off from the runway' },
      { id: 'gearup', label: 'Retract the landing gear' },
      { id: 'land', label: 'Land back on the runway' },
    ],
    celebrate: { title: 'Perfect Flight!', text: 'Take-off, cruise and a smooth landing. Captain material!' },
  },
  submarine: {
    id: 'dive', verb: 'Take It for a Dive!', stopVerb: 'Surface & Stop', emoji: '🌊', tab: 'Take It for a Dive!',
    hint: 'to dive deep', keys: KEYS_PITCH, taps: { l: 'lights', p: 'periscope' },
    hud: [
      { id: 'depth', label: 'M DEEP', big: true }, { id: 'speed', label: 'Speed kt' },
      { id: 'heading', label: 'HDG' }, { id: 'ballast', label: 'Ballast %', bar: true, max: 100 },
      { id: 'stress', label: 'Hull Stress %' },
    ],
    controls: [
      hold('left', '↶ Rudder L', 'Rudder Left (A / ←)', 'left'),
      hold('right', '↷ Rudder R', 'Rudder Right (D / →)', 'right'),
      hold('up', '🟢 Throttle', 'Pump-Jet Throttle (W)', 'up', true),
      hold('down', '🌊 Flood Ballast', 'Flood Ballast Tanks & Dive (S)', 'down'),
      hold('space', '💨 Blow Ballast', 'Blow Ballast & Surface (Space)', 'space'),
      hold('pitchUp', '⬆️ Planes Up', 'Dive Planes Up (↑)', 'pitchUp'),
      hold('pitchDown', '⬇️ Planes Down', 'Dive Planes Down (↓)', 'pitchDown'),
      tap('lights', '🔦 Lights', 'Floodlights (L)', 'lights'),
    ],
    checklist: [
      { id: 'dive', label: 'Dive below 50 m' },
      { id: 'testdepth', label: 'Reach test depth (240 m)' },
      { id: 'surface', label: 'Blow ballast and surface' },
    ],
    celebrate: { title: 'Dive Complete!', text: 'Down to test depth and safely back up. Welcome aboard, Skipper!' },
  },
  jet: {
    id: 'engine', verb: 'Spin It Up!', stopVerb: 'Shut Down', emoji: '🔥', tab: 'Spin It Up!',
    hint: 'to run the engine test cell', keys: KEYS_WASD, taps: {},
    hud: [
      { id: 'n1', label: '% N1', big: true }, { id: 'n2', label: 'N2 %' },
      { id: 'egt', label: 'EGT °C' }, { id: 'thrust', label: 'Thrust kN' },
      { id: 'fuel', label: 'Fuel kg/s', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '🟢 Throttle Up', 'Raise N1 / Chamber Pressure (W / ↑)', 'up', true),
      hold('down', '🔴 Throttle Down', 'Lower Power (S / ↓)', 'down'),
      hold('space', '🔥 Afterburner', 'Afterburner / Full Rocket Thrust (Space)', 'space'),
    ],
    checklist: [
      { id: 'idle', label: 'Light off and reach idle' },
      { id: 'full', label: 'Push to 100% power' },
      { id: 'burner', label: 'Fire the afterburner / Mach diamonds' },
    ],
    celebrate: { title: 'Full Power Run Complete!', text: 'You ran the test cell like a real propulsion engineer!' },
  },
  iphone: {
    id: 'phone', verb: 'Power It On!', stopVerb: 'Power Off', emoji: '📱', tab: 'Power It On!',
    hint: 'to boot the phone', keys: KEYS_WASD, taps: { l: 'flashlight', c: 'camera', h: 'haptic', ' ': 'haptic' },
    hud: [
      { id: 'battery', label: '% BATTERY', big: true }, { id: 'cpu', label: 'CPU °C' },
      { id: 'signal', label: 'Signal' }, { id: 'load', label: 'CPU Load', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '⚡ Run App', 'Run a heavy app: CPU load up (W / ↑)', 'up', true),
      tap('haptic', '📳 Haptic', 'Taptic Engine buzz (Space / H)', 'haptic'),
      tap('flashlight', '🔦 Flashlight', 'Toggle LED Flashlight (L)', 'flashlight'),
      tap('camera', '📸 Camera', 'Camera shutter (C)', 'camera'),
    ],
    checklist: [
      { id: 'boot', label: 'Boot to the lock screen' },
      { id: 'haptic', label: 'Feel the haptic buzz' },
      { id: 'photo', label: 'Take a photo with the flash on' },
    ],
    celebrate: { title: 'Phone Fully Powered!', text: 'Booted, buzzed and snapped a photo. Tech genius!' },
  },
  laptop: {
    id: 'laptop', verb: 'Boot It Up!', stopVerb: 'Shut Down', emoji: '💻', tab: 'Boot It Up!',
    hint: 'to boot the laptop', keys: KEYS_WASD, taps: { ' ': 'keypress' },
    hud: [
      { id: 'cpu', label: '% CPU', big: true }, { id: 'temp', label: 'Temp °C' },
      { id: 'fan', label: 'Fan RPM' }, { id: 'battery', label: 'Battery %', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '🧮 CPU Load', 'Render a 3D movie: CPU load up (W / ↑)', 'up', true),
      hold('down', '😴 Idle', 'Let it cool down (S / ↓)', 'down'),
      tap('keypress', '⌨️ Type', 'Press the keyboard (Space)', 'keypress'),
    ],
    checklist: [
      { id: 'boot', label: 'Open the lid and boot the desktop' },
      { id: 'load', label: 'Push CPU above 90%' },
      { id: 'cool', label: 'Let the fans cool it below 60 °C' },
    ],
    celebrate: { title: 'Laptop Booted!', text: 'Lid open, fans spinning, desktop ready. You are the IT hero!' },
  },
  house: {
    id: 'house', verb: 'Move In!', stopVerb: 'Move Out', emoji: '🏡', tab: 'Move In!',
    hint: 'to live in the house', keys: KEYS_WASD, taps: { ' ': 'daynight', l: 'lights', h: 'hvac' },
    hud: [{ id: 'kwh', label: 'kWh SOLAR', big: true }, { id: 'temp', label: 'Indoor °C' }, { id: 'time', label: 'Time' }, { id: 'power', label: 'Solar Output', bar: true, max: 100 }],
    controls: [
      hold('up', '☀️ Sunshine', 'Bright sun: solar feeds the meter (W / ↑)', 'up', true),
      tap('daynight', '🌙 Day / Night', 'Toggle day and night (Space)', 'daynight'),
      tap('lights', '💡 Room Lights', 'Light rooms one by one (L)', 'lights'),
      tap('hvac', '❄️ HVAC', 'Start heating / cooling flow (H)', 'hvac'),
    ],
    checklist: [{ id: 'night', label: 'Switch to night time' }, { id: 'lights', label: 'Light up every room' }, { id: 'solar', label: 'Generate 5 kWh of solar energy' }],
    celebrate: { title: 'Welcome Home!', text: 'Lights on, HVAC humming and solar power flowing. Home sweet home!' },
  },
  tv: {
    id: 'tv', verb: 'Turn It On!', stopVerb: 'Turn Off', emoji: '📺', tab: 'Turn It On!',
    hint: 'to switch on the screen', keys: KEYS_WASD, taps: { i: 'input', ' ': 'input' },
    hud: [{ id: 'nits', label: 'NITS', big: true }, { id: 'hz', label: 'Hz' }, { id: 'input', label: 'Input' }, { id: 'volume', label: 'Volume', bar: true, max: 100 }],
    controls: [
      hold('up', '🔆 Brighter', 'Ramp backlight zones (W / ↑)', 'up', true),
      hold('down', '🔅 Dimmer', 'Dim the backlight (S / ↓)', 'down'),
      hold('right', '🔊 Vol +', 'Volume up (D / →)', 'right'),
      hold('left', '🔉 Vol −', 'Volume down (A / ←)', 'left'),
      tap('input', '🔁 Input', 'Cycle HDMI / Streaming / Game (Space / I)', 'input'),
    ],
    checklist: [{ id: 'bright', label: 'Reach 1,000 nits peak brightness' }, { id: 'input', label: 'Cycle through every input' }, { id: 'loud', label: 'Pump the speakers past 80% volume' }],
    celebrate: { title: 'Showtime!', text: 'Peak brightness, every input and booming speakers. Movie night is ON!' },
  },
  train: {
    id: 'train', verb: 'Take It for a Ride!', stopVerb: 'Stop Train', emoji: '🚄', tab: 'Take It for a Ride!',
    hint: 'to ride the high-speed rail', keys: KEYS_WASD, taps: { ' ': 'pantograph', h: 'horn' },
    hud: [{ id: 'speed', label: 'KM/H', big: true }, { id: 'notch', label: 'Notch' }, { id: 'kv', label: 'Line kV' }, { id: 'power', label: 'Traction MW', bar: true, max: 100 }],
    controls: [hold('up', '🟢 Traction +', 'Accelerate (W / ↑)', 'up', true), hold('down', '🔴 Regen Brake', 'Regen Brake (S / ↓)', 'down'), hold('boost', '⚡ Maglev 500', '500 km/h Boost (Shift / B)', 'boost'), tap('pantograph', '⚡ Pantograph', 'Raise / Lower Pantograph (Space)', 'pantograph'), tap('horn', '📯 Horn', 'Train Horn (H)', 'horn')],
    checklist: [{ id: 'depart', label: 'Raise pantograph and depart' }, { id: 'highspeed', label: 'Hit 300 km/h high-speed cruise' }, { id: 'stop', label: 'Regen-brake smoothly to a stop' }],
    celebrate: { title: 'On Time Arrival!', text: 'High-speed cruise and a smooth station stop, Conductor!' },
  },
  space: {
    id: 'space', verb: 'Take It to Orbit!', stopVerb: 'De-Orbit', emoji: '🛰️', tab: 'Take It to Orbit!',
    hint: 'to fly in orbit', keys: KEYS_PITCH, taps: { ' ': 'rcs', l: 'solar' },
    hud: [{ id: 'velocity', label: 'KM/S', big: true }, { id: 'altitude', label: 'Alt km' }, { id: 'attitude', label: 'Attitude' }, { id: 'solar', label: 'Solar kW', bar: true, max: 100 }],
    controls: [hold('up', '🔥 Prograde', 'Orbital Thruster (W)', 'up', true), hold('down', '🔄 Retro', 'Retro Burn (S)', 'down'), hold('left', '↶ Yaw L', 'RCS Yaw Left (A / ←)', 'left'), hold('right', '↷ Yaw R', 'RCS Yaw Right (D / →)', 'right'), hold('pitchUp', '⬆️ Pitch Up', 'RCS Pitch Up (↑)', 'pitchUp'), hold('pitchDown', '⬇️ Pitch Down', 'RCS Pitch Down (↓)', 'pitchDown'), tap('rcs', '💨 RCS Puff', 'Fire Attitude Thrusters (Space)', 'rcs'), tap('solar', '☀️ Track Sun', 'Lock Solar Arrays (L)', 'solar')],
    checklist: [{ id: 'orbit', label: 'Reach orbital velocity (7.8 km/s)' }, { id: 'solar', label: 'Lock solar arrays onto the sun' }, { id: 'rcs', label: 'Fire the RCS attitude thrusters' }],
    celebrate: { title: 'Orbital Insertion Confirmed!', text: 'Solar arrays locked, RCS nominal and cruising at 28,000 km/h!' },
  },
  toilet: {
    id: 'everyday', verb: 'Flush It!', stopVerb: 'Stop Flush', emoji: '🚽', tab: 'Flush It!',
    hint: 'to pull the lever, swirl the bowl vortex & siphon water down the drain',
    keys: KEYS_WASD, taps: { ' ': 'flush', l: 'lid' },
    hud: [
      { id: 'flow', label: 'GPM Flow', big: true },
      { id: 'stage', label: 'Siphon Stage' },
      { id: 'trap', label: 'S-Trap Seal' },
      { id: 'level', label: 'Cistern Level %', bar: true, max: 100 },
    ],
    controls: [
      tap('flush', '🚽 Push Lever (Flush!)', 'Pull Chrome Trip Lever & Open Flapper (Space)', 'flush', true),
      hold('up', '🌊 Hold Flapper Open', 'Hold Flush Valve Open for Full Cistern Dump (W / ↑)', 'up'),
      hold('boost', '🌀 Rim-Jet Vortex Boost', 'High-Velocity Siphon Jet Swirl Down Drain (Shift / B)', 'boost'),
      hold('down', '💧 Fast Fill Valve', 'Refill Cistern & Bowl Water Seal Quickly (S / ↓)', 'down'),
      tap('lid', '🪑 Flip Seat Lid', 'Open / Close Soft-Close Toilet Lid (L)', 'lid'),
    ],
    checklist: [
      { id: 'flush', label: 'Press the trip lever to lift the flapper and flush' },
      { id: 'siphon', label: 'Trigger a full vortex siphon pulling water down the S-trap' },
      { id: 'refill', label: 'Refill the cistern tank and restore the water seal' },
    ],
    celebrate: { title: 'Master Plumber!', text: 'Flapper lifted, swirling bowl vortex pulled down the S-trap siphon, and cistern refilled!' },
  },
  espresso: {
    id: 'everyday', verb: 'Brew Espresso!', stopVerb: 'Stop Brew', emoji: '☕', tab: 'Brew Espresso!',
    hint: 'to build 9-bar pump pressure, pour golden crema & steam velvety microfoam',
    keys: KEYS_WASD, taps: { ' ': 'shot', l: 'steam' },
    hud: [
      { id: 'pressure', label: 'BAR', big: true },
      { id: 'temp', label: 'Brew °C' },
      { id: 'shot', label: 'Shot ml' },
      { id: 'crema', label: 'Extraction %', bar: true, max: 100 },
    ],
    controls: [
      tap('shot', '☕ Pull Double Shot', 'Start 9-Bar Espresso Extraction (Space)', 'shot', true),
      hold('up', '🔥 Brew Pump (9 BAR)', 'Hold Rotary Pump Pressure at 9.0 Bar (W / ↑)', 'up'),
      hold('boost', '💨 Steam Microfoam', 'Open Steam Wand Valve for Milk Microfoam (Shift / B)', 'boost'),
      hold('down', '💧 Pre-Infuse / Flush', 'Low-Pressure 3-Bar Pre-Infusion & Group Flush (S / ↓)', 'down'),
      tap('steam', '🥛 Purge Steam Wand', 'Purge Steam Wand Jet (L)', 'steam'),
    ],
    checklist: [
      { id: 'pressure', label: 'Build 9.0 BAR extraction pressure on the rotary pump' },
      { id: 'shot', label: 'Pour a 36 ml double espresso with tiger-stripe golden crema' },
      { id: 'steam', label: 'Froth velvety milk microfoam with the steam wand' },
    ],
    celebrate: { title: 'Master Barista!', text: '9.0 bar extraction at 93°C, rich golden crema in the cup, and silky steamed microfoam!' },
  },
  elevator: {
    id: 'everyday', verb: 'Ride Elevator!', stopVerb: 'Park Cab', emoji: '🛗', tab: 'Ride Elevator!',
    hint: 'to hoist the glass cab up the steel guide rails & balance the counterweight',
    keys: KEYS_WASD, taps: { ' ': 'doors', l: 'express' },
    hud: [
      { id: 'floor', label: 'FLOOR', big: true },
      { id: 'speed', label: 'm/s' },
      { id: 'cwt', label: 'Counterweight' },
      { id: 'cable', label: 'Hoist Height %', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '⬆️ Ascend Floors', 'Hoist Cab Up Steel Guide Rails (W / ↑)', 'up', true),
      hold('down', '⬇️ Descend Floors', 'Lower Cab Toward Lobby (S / ↓)', 'down'),
      hold('boost', '⚡ Express Penthouse', 'High-Speed 10 m/s Express Run (Shift / B)', 'boost'),
      tap('doors', '🚪 Open / Close Doors', 'Actuate Center-Parting Sliding Doors (Space)', 'doors'),
      tap('express', '🔔 Floor Chime & Call', 'Call Next Landmark Floor (L)', 'express'),
    ],
    checklist: [
      { id: 'ascend', label: 'Hoist the elevator cab up to the Penthouse (PH)' },
      { id: 'doors', label: 'Open the center-parting glass doors at a floor landing' },
      { id: 'descend', label: 'Descend smoothly while the counterweight rises' },
    ],
    celebrate: { title: 'Penthouse Express!', text: 'Traction sheave, wire ropes, and counterweight balanced every floor landing!' },
  },
  lock: {
    id: 'everyday', verb: 'Unlock It!', stopVerb: 'Reset Lock', emoji: '🔑', tab: 'Unlock It!',
    hint: 'to slide the notched brass key in, align all 5 pins at the shear line & throw the deadbolt',
    keys: KEYS_WASD, taps: { ' ': 'key', l: 'bolt' },
    hud: [
      { id: 'pins', label: 'PINS ALIGNED', big: true },
      { id: 'angle', label: 'Plug Deg' },
      { id: 'state', label: 'Shear Line' },
      { id: 'bolt', label: 'Bolt Throw %', bar: true, max: 100 },
    ],
    controls: [
      tap('key', '🔑 Insert / Pull Key', 'Slide Notched Brass Key into Keyway (Space)', 'key', true),
      hold('up', '↷ Turn Plug to Unlock', 'Rotate Cylinder Plug & Retract Deadbolt (W / ↑)', 'up'),
      hold('down', '↶ Lock Deadbolt', 'Rotate Plug Back & Extend Deadbolt (S / ↓)', 'down'),
      hold('boost', '🕵️ Test Pin Bitting', 'Cycle Individual Pin Stacks Against Springs (Shift / B)', 'boost'),
      tap('bolt', '🔓 Snap Deadbolt Cam', 'Toggle Rear Tailpiece Cam (L)', 'bolt'),
    ],
    checklist: [
      { id: 'insert', label: 'Insert the brass key to lift all 5 pin stacks to the shear line' },
      { id: 'turn', label: 'Rotate the cylinder plug 90° across the shear line' },
      { id: 'unlock', label: 'Throw the rear cam to retract the hardened deadbolt' },
    ],
    celebrate: { title: 'Master Locksmith!', text: 'All 5 key pins met the shear line and the brass plug rotated smoothly!' },
  },
  watches: {
    id: 'watches', verb: 'Wind & Tick!', stopVerb: 'Stop Movement', emoji: '⌚', tab: 'Wind & Tick!',
    hint: 'to wind the mainspring, oscillate the escapement & trigger the chronograph or chimes',
    keys: KEYS_WASD, taps: { ' ': 'chrono', l: 'chime' },
    hud: [
      { id: 'rate', label: 'BPH / Hz', big: true },
      { id: 'chrono', label: 'Chrono Sec' },
      { id: 'escapement', label: 'Escapement' },
      { id: 'reserve', label: 'Power Reserve %', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '⚙️ Wind Crown / Weights', 'Wind Mainspring Barrel or Hoist Brass Weights (W / ↑)', 'up', true),
      tap('chrono', '⏱️ Start / Stop Chrono', 'Engage Column-Wheel Chronograph Clutch (Space)', 'chrono'),
      hold('boost', '⏩ High-Beat Time-Lapse', 'Accelerate Gear Train & Hands Sweep (Shift / B)', 'boost'),
      hold('down', '🔄 Flyback Reset', 'Reset Chronograph Sweep Hands to Zero (S / ↓)', 'down'),
      tap('chime', '🔔 Strike Westminster Chime', 'Trip Chime Hammers Against Brass Tubes (L)', 'chime'),
    ],
    checklist: [
      { id: 'wind', label: 'Wind the mainspring barrel / hoist the clock weights to 90%+ reserve' },
      { id: 'chrono', label: 'Engage the column-wheel chronograph or pendulum escapement' },
      { id: 'chime', label: 'Trigger the high-beat time-lapse or Westminster chime strike' },
    ],
    celebrate: { title: 'Master Watchmaker!', text: 'Swiss lever escapement and gear train ticking with chronometer precision!' },
  },
  ships: {
    id: 'ships', verb: 'Set Sail!', stopVerb: 'Drop Anchor', emoji: '🚢', tab: 'Set Sail!',
    hint: 'to cruise across ocean swells, carve a foamy bow wake & spin the twin screws',
    keys: KEYS_WASD, taps: { ' ': 'horn', l: 'lights' },
    hud: [
      { id: 'speed', label: 'KNOTS', big: true },
      { id: 'heading', label: 'Heading' },
      { id: 'rpm', label: 'Shaft RPM' },
      { id: 'power', label: 'Propulsion %', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '🟢 Ahead Full', 'Increase Engine Order Telegraph (W / ↑)', 'up', true),
      hold('down', '🔴 Astern / Slow', 'Reverse Propellers / Slow Astern (S / ↓)', 'down'),
      hold('left', '↰ Port Helm', 'Turn Rudder / Azimuth Pods to Port (A / ←)', 'left'),
      hold('right', '↱ Starboard Helm', 'Turn Rudder / Azimuth Pods to Starboard (D / →)', 'right'),
      hold('boost', '🌊 Flank Speed (30 kt)', 'Full Gas-Turbine / Nuclear Flank Speed (Shift / B)', 'boost'),
      tap('horn', '📯 Ship Typhoon Horn', 'Sound Deep Foghorn Blast (Space)', 'horn'),
      tap('lights', '💡 Deck & Nav Lights', 'Toggle Masthead & Promenade Floodlights (L)', 'lights'),
    ],
    checklist: [
      { id: 'sail', label: 'Get underway and carve a foamy ocean bow wake at 20+ knots' },
      { id: 'helm', label: 'Steer port and starboard with the rudder / azimuth pods' },
      { id: 'horn', label: 'Sound the ship typhoon foghorn and light the decks' },
    ],
    celebrate: { title: 'Captain on the Bridge!', text: 'Cutting cleanly through the ocean swells at full sea speed!' },
  },
  construction: {
    id: 'construction', verb: 'Operate Rig!', stopVerb: 'Park Rig', emoji: '🏗️', tab: 'Operate Rig!',
    hint: 'to slew the cab, articulate the hydraulic boom & hoist heavy loads',
    keys: KEYS_WASD, taps: { ' ': 'bucket', l: 'lights' },
    hud: [
      { id: 'pressure', label: 'BAR HYD', big: true },
      { id: 'slew', label: 'Slew Deg' },
      { id: 'load', label: 'Hook / Bucket t' },
      { id: 'cycle', label: 'Work Cycle %', bar: true, max: 100 },
    ],
    controls: [
      hold('up', '⬆️ Boom / Hoist Up', 'Extend Main Hydraulic Cylinders / Hoist Load (W / ↑)', 'up', true),
      hold('down', '⬇️ Crowd / Lower', 'Lower Boom into Trench / Lower Hook Block (S / ↓)', 'down'),
      hold('left', '↶ Slew Left', 'Rotate Upper House / Jib Counter-Clockwise (A / ←)', 'left'),
      hold('right', '↷ Slew Right', 'Rotate Upper House / Jib Clockwise (D / →)', 'right'),
      hold('boost', '🪣 Curl Bucket / Trolley', 'Curl Rock Bucket Teeth / Run Jib Trolley Out (Shift / B)', 'boost'),
      tap('bucket', '🪨 Dump / Auto-Dig Cycle', 'Run Full Hydraulic Trenching / Hoist Cycle (Space)', 'bucket'),
      tap('lights', '💡 Work Floodlights', 'Toggle Boom & Cab LED Floodlights (L)', 'lights'),
    ],
    checklist: [
      { id: 'boom', label: 'Articulate the hydraulic boom or hoist the crane hook' },
      { id: 'slew', label: 'Slew the upper turret or tower crane jib across the site' },
      { id: 'dig', label: 'Complete a full trench dig or heavy lift cycle' },
    ],
    celebrate: { title: 'Master Heavy Operator!', text: '350-bar hydraulics, smooth slewing, and a full trench/hoist cycle complete!' },
  },
};

ACTIONS.phone = ACTIONS.iphone;
ACTIONS.trains = ACTIONS.train;
ACTIONS.spacecraft = ACTIONS.space;
ACTIONS.rockets = ACTIONS.rocket = {
  id: 'rockets', verb: 'Launch It!', stopVerb: 'Abort Launch', emoji: '🚀', tab: 'Launch It!',
  hint: 'to ignite the booster & launch to orbit', keys: KEYS_WASD, taps: {},
  hud: [
    { id: 'throttle', label: '% THROTTLE', big: true },
    { id: 'altitude', label: 'Alt km' },
    { id: 'velocity', label: 'Vel km/s' },
    { id: 'thrust', label: 'Thrust kN' },
    { id: 'fuel', label: 'Propellant kg/s', bar: true, max: 100 },
  ],
  controls: [
    hold('up', '🟢 Main Throttle', 'Increase Booster Throttle (W / ↑)', 'up', true),
    hold('down', '🔴 Deep Throttle', 'Throttle Back Engines (S / ↓)', 'down'),
    hold('space', '🔥 Max Orbital Thrust', 'Full Liftoff Thrust & Mach Diamonds (Space)', 'space'),
  ],
  checklist: [
    { id: 'ignite', label: 'Ignite booster engines on the orbital launch mount' },
    { id: 'liftoff', label: 'Lift off & clear the launch umbilical tower' },
    { id: 'maxq', label: 'Push through Max-Q at full orbital thrust' },
  ],
  celebrate: { title: 'Nominal Orbital Liftoff!', text: 'Launch tower cleared, Mach shock diamonds blazing, and ascending toward orbit!' },
};
ACTIONS.robots = ACTIONS.robot = {
  id: 'robots', verb: 'Power Up & Move!', stopVerb: 'Stand Down', emoji: '🤖', tab: 'Power Up & Move!',
  hint: 'to actuate servo joints, sensors & end-effectors', keys: KEYS_WASD, taps: { ' ': 'tool', l: 'lights' },
  hud: [
    { id: 'power', label: '% ACTUATOR', big: true },
    { id: 'pose', label: 'Kinematics' },
    { id: 'torque', label: 'Torque Nm' },
    { id: 'battery', label: 'Core Power %', bar: true, max: 100 },
  ],
  controls: [
    hold('up', '🟢 Actuate / Drive', 'Drive Servos & Locomotion Forward (W / ↑)', 'up', true),
    hold('down', '🔴 Reverse / Crouch', 'Reverse / Lower Stance (S / ↓)', 'down'),
    hold('left', '↶ Slew / Yaw L', 'Rotate Base or Steer Left (A / ←)', 'left'),
    hold('right', '↷ Slew / Yaw R', 'Rotate Base or Steer Right (D / →)', 'right'),
    hold('boost', '⚡ Overdrive Cycle', 'High-Speed Servo Cycle (Shift / B)', 'boost'),
    tap('tool', '🔬 Fire Tool / Scan', 'Trigger Laser Welder / SuperCam LIBS / LiDAR Scan (Space)', 'tool'),
    tap('lights', '💡 Work Lights', 'Toggle Sensor & Work Floodlights (L)', 'lights'),
  ],
  checklist: [
    { id: 'move', label: 'Power up and drive the primary servo actuators' },
    { id: 'slew', label: 'Slew or steer across the operating envelope' },
    { id: 'tool', label: 'Fire the end-effector tool or scientific laser scan' },
  ],
  celebrate: { title: 'Autonomous Mission Complete!', text: 'Precision servo kinematics, active sensor lock, and end-effector task verified!' },
};
ACTIONS.helicopters = ACTIONS.heli = {
  id: 'helicopters', verb: 'Take It for a Hover!', stopVerb: 'Land & Stop', emoji: '🚁', tab: 'Take It for a Hover!',
  hint: 'to take off', keys: KEYS_PITCH, taps: { l: 'lights' },
  hud: [
    { id: 'airspeed', label: 'KT', big: true }, { id: 'phase', label: 'Flight Phase' },
    { id: 'altitude', label: 'Alt ft' }, { id: 'vs', label: 'V/S fpm' }, { id: 'heading', label: 'HDG' },
    { id: 'rotor', label: 'Rotor RPM' },
    { id: 'collective', label: 'Collective', bar: true, max: 100 },
  ],
  controls: [
    hold('up', '⬆️ Lift', 'Raise the collective to climb (W)', 'up', true),
    hold('down', '⬇️ Lower', 'Lower the collective to descend & land (S)', 'down'),
    hold('pitchDown', '⏩ Fly Fwd', 'Cyclic forward: nose down to speed up (↓)', 'pitchDown'),
    hold('pitchUp', '⏪ Slow', 'Cyclic back: nose up to slow down (↑)', 'pitchUp'),
    hold('left', '↶ Turn L', 'Pedal turn / bank left (A / ←)', 'left'),
    hold('right', '↷ Turn R', 'Pedal turn / bank right (D / →)', 'right'),
    hold('boost', '🔥 Max Power', 'Max power (Shift / B)', 'boost'),
    tap('lights', '💡 Lights', 'Nav lights & strobes (L)', 'lights'),
  ],
  checklist: [
    { id: 'liftoff', label: 'Lift off into a hover' },
    { id: 'cruise', label: 'Zoom forward to cruise speed' },
    { id: 'land', label: 'Touch down gently' },
  ],
  celebrate: { title: 'Perfect Hover Flight!', text: 'Spool-up, lift-off, fast cruise and a feather-soft touchdown. Ace helicopter pilot!' },
};
ACTIONS.watch = ACTIONS.watches;
ACTIONS.bikes = ACTIONS.bike = { ...ACTIONS.car, id: 'bikes', verb: 'Take It for a Ride!', stopVerb: 'Stop Riding', emoji: '🏍️', tab: 'Take It for a Ride!' };
ACTIONS.ship = ACTIONS.ships;
ACTIONS.everyday = ACTIONS.toilet;

export const ACTION_CATEGORY_IDS = Object.keys(ACTIONS);

export function getAction(categoryId, modelId) {
  const key = String(categoryId || 'car').toLowerCase();
  const mid = String(modelId || '').toLowerCase();
  if (key === 'everyday') {
    if (mid.includes('espresso') || mid.includes('coffee')) return ACTIONS.espresso;
    if (mid.includes('elevator')) return ACTIONS.elevator;
    if (mid.includes('lock')) return ACTIONS.lock;
    return ACTIONS.toilet;
  }
  if (key === 'watches' || key === 'watch') {
    if (mid.includes('grandfather') || mid.includes('clock')) {
      return { ...ACTIONS.watches, verb: 'Swing & Chime!', emoji: '🕰️', tab: 'Swing & Chime!' };
    }
    return ACTIONS.watches;
  }
  if (key === 'airplane' || key === 'airplanes') {
    if (mid.includes('cessna')) {
      return {
        ...ACTIONS.airplane,
        emoji: '🛩️',
        hint: 'to spin up the 180-HP Lycoming prop, cycle Para-Lift flaps & take off',
        taps: { l: 'lights', f: 'flaps', g: 'flaps' },
        hud: [
          { id: 'airspeed', label: 'KT', big: true },
          { id: 'flapsBadge', label: 'Flaps' },
          { id: 'altitude', label: 'Alt ft' },
          { id: 'vs', label: 'V/S fpm' },
          { id: 'rpm', label: 'Prop RPM', bar: true, max: 2700 },
        ],
        controls: [
          hold('left', '↶ Bank L', 'Rudder & Aileron Left (A / ←)', 'left'),
          hold('right', '↷ Bank R', 'Rudder & Aileron Right (D / →)', 'right'),
          hold('up', '🟢 Throttle', 'Vernier Throttle In (W)', 'up', true),
          hold('down', '🔴 Idle / Brake', 'Throttle Idle & Toe Brakes (S)', 'down'),
          hold('pitchUp', '⬆️ Pull Yoke', 'Elevator Nose Up / Climb (↑)', 'pitchUp'),
          hold('pitchDown', '⬇️ Push Yoke', 'Elevator Nose Down / Glide (↓)', 'pitchDown'),
          tap('flaps', '🪶 Flaps', 'Cycle Para-Lift Flaps 0°/10°/20°/30° (F / G)', 'flaps'),
          tap('lights', '💡 Lights', 'Nav Strobes & Wing Landing LED (L)', 'lights'),
        ],
        checklist: [
          { id: 'takeoff', label: 'Rotate at 55 KT and lift off from the runway' },
          { id: 'flaps', label: 'Lower Para-Lift slotted flaps (10°–30°)' },
          { id: 'land', label: 'Touch down smoothly on the spring-steel gear' },
        ],
        celebrate: { title: 'Solo Checkride Passed!', text: '55-knot rotation, Para-Lift flap approach, and a butter-soft Skyhawk landing!' },
      };
    }
    if (mid.includes('sr71') || mid.includes('blackbird')) {
      return {
        ...ACTIONS.airplane,
        emoji: '🦅',
        hint: 'to light TEB afterburners, retract J58 inlet spikes & streak to Mach 3.3',
        hud: [
          { id: 'airspeed', label: 'KT', big: true },
          { id: 'mach', label: 'Mach' },
          { id: 'altitude', label: 'Alt ft' },
          { id: 'spike', label: 'J58 Spike' },
          { id: 'throttle', label: 'J58 Thrust %', bar: true, max: 100 },
        ],
        controls: [
          hold('left', '↶ Bank L', 'Elevon Roll Left (A / ←)', 'left'),
          hold('right', '↷ Bank R', 'Elevon Roll Right (D / →)', 'right'),
          hold('up', '🟢 J58 Throttle', 'Advance JP-7 Throttle (W)', 'up', true),
          hold('down', '🪂 Brake / Chute', 'Idle & Deploy Drag Chute on Rollout (S)', 'down'),
          hold('pitchUp', '⬆️ Climb', 'Climb Toward 85,000 ft (↑)', 'pitchUp'),
          hold('pitchDown', '⬇️ Descend', 'Let Down from Stratosphere (↓)', 'pitchDown'),
          hold('boost', '🔥 TEB Burner', 'Triethylborane Afterburner to Mach 3.3 (Shift / B)', 'boost'),
          tap('gear', '🛞 Gear', 'Titanium Nitrogen Gear Up/Down (G)', 'gear'),
          tap('lights', '💡 Lights', 'Nav & Beacon Strobes (L)', 'lights'),
        ],
        checklist: [
          { id: 'takeoff', label: 'Rotate at 180 KT & retract nitrogen landing gear' },
          { id: 'mach3', label: 'Break Mach 3.0 with TEB afterburner & translating spikes' },
          { id: 'land', label: 'Touch down and deploy braking drag chute' },
        ],
        celebrate: { title: 'Habu Mission Complete!', text: 'Mach 3.3+ in the deep-indigo stratosphere with translating J58 inlet spikes!' },
      };
    }
    if (mid.includes('f22') || mid.includes('raptor')) {
      return {
        ...ACTIONS.airplane,
        emoji: '🦅',
        hint: 'to supercruise past Mach 1.8, vector 2D nozzles & light twin F119 afterburners',
        hud: [
          { id: 'airspeed', label: 'KT', big: true },
          { id: 'mach', label: 'Mach' },
          { id: 'altitude', label: 'Alt ft' },
          { id: 'vs', label: 'V/S fpm' },
          { id: 'throttle', label: 'F119 Power %', bar: true, max: 100 },
        ],
        controls: [
          hold('left', '↶ Roll L', 'Flaperon Roll Left (A / ←)', 'left'),
          hold('right', '↷ Roll R', 'Flaperon Roll Right (D / →)', 'right'),
          hold('up', '🟢 Supercruise', 'Advance Twin F119 Dry Thrust (W)', 'up', true),
          hold('down', '🔴 Idle / Brake', 'Speedbrake Rudder Flare & Wheel Brakes (S)', 'down'),
          hold('pitchUp', '⬆️ Vector Up', '2D Thrust-Vector Pitch Up (↑)', 'pitchUp'),
          hold('pitchDown', '⬇️ Vector Down', '2D Thrust-Vector Pitch Down (↓)', 'pitchDown'),
          hold('boost', '🔥 Afterburner', 'Full F119 Afterburner to Mach 2.25 (Shift / B)', 'boost'),
          tap('gear', '🛞 Gear', 'Stealth Sawtooth Gear Up/Down (G)', 'gear'),
          tap('lights', '💡 Lights', 'Stealth Formation & Nav Lights (L)', 'lights'),
        ],
        checklist: [
          { id: 'takeoff', label: 'Take off & retract sawtooth stealth landing gear' },
          { id: 'supercruise', label: 'Supercruise past Mach 1.5 (or Mach 2.2 in burner!)' },
          { id: 'land', label: 'Land back on the runway' },
        ],
        celebrate: { title: 'Raptor Air Dominance!', text: 'Supersonic supercruise, 2D thrust-vectoring agility, and a crisp landing!' },
      };
    }
    return ACTIONS.airplane;
  }
  if (key === 'car' || key === 'cars') {
    if (/tesla|cybertruck|rivian/i.test(mid)) {
      return {
        ...ACTIONS.car,
        emoji: '⚡',
        hud: [
          { id: 'speed', label: 'MPH', big: true },
          { id: 'gear', label: 'Drive' },
          { id: 'rpm', label: 'Motor RPM', bar: true, max: 18500 },
        ],
        controls: [
          hold('left', '⬅️ Steer L', 'Steer Left (A / ←)', 'left'),
          hold('right', '➡️ Steer R', 'Steer Right (D / →)', 'right'),
          hold('up', '🟢 Accelerator', 'Instant EV Torque (W / ↑)', 'up', true),
          hold('down', '🔴 Regen Brake', 'Regenerative Brake / Reverse (S / ↓)', 'down'),
          hold('boost', '⚡ Plaid Boost', 'Launch Mode Overboost (Shift / B)', 'boost'),
          tap('lights', '💡 Matrix LEDs', 'Toggle Headlights (L)', 'lights'),
          tap('horn', '📯 Horn', 'Sound Horn (H)', 'horn'),
        ],
        checklist: [
          { id: 'fast', label: 'Launch past 100 MPH with instant electric torque' },
          { id: 'boost', label: 'Engage Plaid / Launch Overboost' },
          { id: 'stop', label: 'Regen-brake smoothly to a full stop' },
        ],
        celebrate: { title: 'EV Launch Complete!', text: 'Instant electric torque, silent 18,500 RPM motors, and regenerative braking!' },
      };
    }
    return ACTIONS.car;
  }
  if (key === 'bikes' || key === 'bike') {
    if (/ducati|panigale|moto/i.test(mid)) {
      return {
        ...ACTIONS.bikes,
        emoji: '🏍️',
        hud: [
          { id: 'speed', label: 'MPH', big: true },
          { id: 'gear', label: 'Gear' },
          { id: 'rpm', label: 'Desmo RPM', bar: true, max: 14500 },
        ],
        controls: [
          hold('left', '⬅️ Lean L', 'Counter-Steer & Lean Left (A / ←)', 'left'),
          hold('right', '➡️ Lean R', 'Counter-Steer & Lean Right (D / →)', 'right'),
          hold('up', '🟢 Throttle', 'Roll On V4 Throttle (W / ↑)', 'up', true),
          hold('down', '🔴 Brembo Brake', 'Brembo Stylema Disc Brakes (S / ↓)', 'down'),
          hold('boost', '🔥 Full Tuck', '14,500 RPM Redline Sprint (Shift / B)', 'boost'),
          tap('lights', '💡 DRL / Beam', 'Toggle LED Headlight (L)', 'lights'),
          tap('horn', '📯 Horn', 'Sound Horn (H)', 'horn'),
        ],
        checklist: [
          { id: 'fast', label: 'Hit 120 MPH on the superbike straight' },
          { id: 'boost', label: 'Tuck in for a 14,500 RPM Desmosedici sprint' },
          { id: 'stop', label: 'Threshold-brake to a clean stop' },
        ],
      };
    }
    const isEbike = /tern|ebike|cargo/i.test(mid);
    const bikeControls = [
      hold('left', '⬅️ Lean L', 'Lean & Steer Left (A / ←)', 'left'),
      hold('right', '➡️ Lean R', 'Lean & Steer Right (D / →)', 'right'),
      hold('up', '🚴 Pedal', 'Spin Crankset & Chainring (W / ↑)', 'up', true),
      hold('down', '🔴 Disc Brakes', 'Squeeze Hydraulic Disc Brakes (S / ↓)', 'down'),
      hold('boost', isEbike ? '⚡ Bosch Turbo' : '⚡ Aero Sprint', isEbike ? '400% Mid-Drive Assist (Shift / B)' : 'Out-of-Saddle Sprint (Shift / B)', 'boost'),
    ];
    if (isEbike) bikeControls.push(tap('lights', '💡 Cargo Beam', 'Toggle Integrated Headlight (L)', 'lights'));
    bikeControls.push(tap('horn', '🔔 Ring Bell', 'Ring Handlebar Bell (H)', 'horn'));
    return {
      ...ACTIONS.bikes,
      emoji: isEbike ? '🚲' : '🚴',
      hint: 'to spin the cranks, shift the cassette & carve turns',
      hud: [
        { id: 'speed', label: 'MPH', big: true },
        { id: 'gear', label: 'Cassette' },
        { id: 'rpm', label: 'Cadence RPM', bar: true, max: 120 },
      ],
      controls: bikeControls,
      checklist: [
        { id: 'fast', label: 'Spin up above 22 MPH cruise speed' },
        { id: 'boost', label: isEbike ? 'Engage Bosch Cargo Line Turbo assist' : 'Drop into an aero sprint past 30 MPH' },
        { id: 'stop', label: 'Modulate hydraulic disc brakes to a full stop' },
      ],
      celebrate: { title: 'Stage Victory!', text: 'Smooth cadence, crisp cassette shifts, and hydraulic disc-brake control!' },
    };
  }
  if (key === 'robots' || key === 'robot') {
    if (mid.includes('iron-man')) {
      return {
        ...ACTIONS.airplane,
        id: 'robots',
        verb: 'Repulsor Flight!',
        stopVerb: 'Land Armor',
        emoji: '🦾',
        tab: 'Repulsor Flight!',
        hint: 'to ignite boot-jet turbines, fly supersonic & fire the Chest Unibeam',
        keys: { ...KEYS_PITCH, shift: 'boost', b: 'boost' },
        taps: { u: 'unibeam', f: 'unibeam', g: 'unibeam', ' ': 'unibeam', l: 'lights' },
        hud: [
          { id: 'mph', label: 'MPH', big: true },
          { id: 'mach', label: 'MACH', pill: true },
          { id: 'altitude', label: 'ALT FT' },
          { id: 'unibeamBadge', label: 'UNIBEAM', pill: true },
          { id: 'throttleBar', label: 'RT CORE OUTPUT %', bar: true, max: 100 },
        ],
        controls: [
          hold('left', '↶ Bank L', 'Bank Left (A / ←)', 'left'),
          hold('right', '↷ Bank R', 'Bank Right (D / →)', 'right'),
          hold('up', '🔥 Boot Jets', 'Ignite Boot Turbines (W)', 'up', true),
          hold('down', '🛑 Airbrakes', 'Deploy Dorsal Airbrakes (S)', 'down'),
          hold('pitchUp', '⬆️ Climb', 'Climb Higher (↑)', 'pitchUp'),
          hold('pitchDown', '⬇️ Dive', 'Dive Lower (↓)', 'pitchDown'),
          hold('boost', '⚡ Overdrive', 'Repulsor Overdrive Mach 2+ (Shift / B)', 'boost'),
          tap('unibeam', '💥 Unibeam', 'Fire Chest Unibeam Blast (U / Space)', 'unibeam'),
        ],
        checklist: [
          { id: 'takeoff', label: 'Ignite boot-jet turbines & lift into repulsor hover' },
          { id: 'supersonic', label: 'Engage Overdrive & break Mach 1 supersonic flight' },
          { id: 'unibeam', label: 'Fire the Multi-Spectrum Chest Unibeam' },
        ],
        celebrate: {
          title: 'Golden Avenger Airborne!',
          text: 'Boot-jet hover, supersonic repulsor flight, and full-power Unibeam blast mastered!',
        },
      };
    }
    if (mid.includes('kuka')) {
      return {
        ...ACTIONS.robots,
        hint: 'to slew all 6 servo axes & fire the laser welding head',
        checklist: [
          { id: 'move', label: 'Articulate the 6-axis shoulder, forearm & wrist servos' },
          { id: 'slew', label: 'Slew the Axis-1 rotary base carousel across the cell' },
          { id: 'tool', label: 'Fire the precision laser/spot-welding end-effector' },
        ],
      };
    }
    if (mid.includes('mars') || mid.includes('perseverance')) {
      return {
        ...ACTIONS.robots,
        hint: 'to roll across Mars on 6 wheels & fire the SuperCam rock laser',
        checklist: [
          { id: 'move', label: 'Drive all 6 cleated aluminum wheels across Martian regolith' },
          { id: 'slew', label: 'Sweep the Remote Sensing Mast & sample turret arm' },
          { id: 'tool', label: 'Zap a Martian rock target with the SuperCam LIBS laser' },
        ],
      };
    }
    return ACTIONS.robots;
  }
  if (key === 'construction' && /combine|harvester/i.test(mid)) {
    return {
      ...ACTIONS.construction,
      emoji: '🌾',
      hint: 'to spin the 45-ft draper header reel, thresh grain & swing the auger',
      hud: [
        { id: 'pressure', label: 'ROTOR RPM', big: true },
        { id: 'slew', label: 'Auger Swing' },
        { id: 'load', label: 'Grain Tank' },
        { id: 'cycle', label: 'Harvest Rate %', bar: true, max: 100 },
      ],
      controls: [
        hold('up', '🌾 Harvest Forward', 'Spin Draper Reel & Threshing Rotor (W / ↑)', 'up', true),
        hold('down', '⬇️ Lower Header', 'Float Cutterbar Close to Crop Stubble (S / ↓)', 'down'),
        hold('left', '↶ Swing Auger Out', 'Extend Unloading Auger Over Grain Cart (A / ←)', 'left'),
        hold('right', '↷ Fold Auger In', 'Stow Unloading Auger Along Side (D / →)', 'right'),
        hold('boost', '⚡ Max Threshing', 'High-Throughput Dual-Rotor Boost (Shift / B)', 'boost'),
        tap('bucket', '🌽 Unload Grain Boost', 'Discharge 4.5 bu/sec Through Auger (Space)', 'bucket'),
        tap('lights', '💡 Field Floodlights', 'Toggle Cab Stadium LEDs (L)', 'lights'),
      ],
      checklist: [
        { id: 'boom', label: 'Spin up the draper header reel & threshing rotor' },
        { id: 'slew', label: 'Swing the unloading auger out to discharge grain' },
        { id: 'dig', label: 'Complete a full high-capacity grain harvest pass' },
      ],
      celebrate: { title: 'Bumper Harvest Complete!', text: 'Draper reel spinning, clean threshing separation, and grain tank unloaded!' },
    };
  }
  const base = ACTIONS[key] || ACTIONS.car;
  if (key === 'jet' && /raptor|rocket/i.test(mid)) return { ...base, verb: 'Spin It Up!', emoji: '🔥' };
  return base;
}

