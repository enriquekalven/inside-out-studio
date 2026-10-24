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
    hint: 'to take off', keys: KEYS_PITCH, taps: { l: 'lights', g: 'gear' },
    hud: [
      { id: 'airspeed', label: 'KT', big: true }, { id: 'altitude', label: 'Alt ft' },
      { id: 'vs', label: 'V/S fpm' }, { id: 'heading', label: 'HDG' },
      { id: 'throttle', label: 'Throttle', bar: true, max: 100 },
    ],
    controls: [
      hold('left', '↶ Bank L', 'Bank & Yaw Left (A / ←)', 'left'),
      hold('right', '↷ Bank R', 'Bank & Yaw Right (D / →)', 'right'),
      hold('up', '🟢 Throttle', 'Throttle Up (W)', 'up', true),
      hold('down', '🔴 Brake', 'Idle / Brakes (S)', 'down'),
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
ACTIONS.rockets = ACTIONS.rocket = { ...ACTIONS.jet, id: 'rockets', verb: 'Launch It!', stopVerb: 'Abort Launch', emoji: '🚀', tab: 'Launch It!' };
ACTIONS.robots = ACTIONS.robot = { ...ACTIONS.car, id: 'robots', verb: 'Power Up & Move!', stopVerb: 'Stand Down', emoji: '🤖', tab: 'Power Up & Move!' };
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
  if (key === 'robots' || key === 'robot') {
    if (mid.includes('iron-man')) {
      return { ...ACTIONS.airplane, id: 'robots', verb: 'Repulsor Flight!', stopVerb: 'Land Armor', emoji: '🦾', tab: 'Repulsor Flight!' };
    }
  }
  const base = ACTIONS[key] || ACTIONS.car;
  if (key === 'jet' && /raptor|rocket/i.test(mid)) return { ...base, verb: 'Spin It Up!', emoji: '🔥' };
  return base;
}

