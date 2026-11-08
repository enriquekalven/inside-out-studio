// Action Simulation Dispatcher — maps categoryId / modelId to its interactive 3D simulation class.
import { DriveSim } from './drive.js';
import { FlightSim } from './flight.js';
import { HeliSim } from './heli.js';
import { DiveSim } from './dive.js';
import { EngineSim, RocketLaunchSim } from './engine.js';
import {
  PhoneSim,
  LaptopSim,
  HouseSim,
  TvSim,
  TrainSim,
  SpaceSim,
  ToiletFlushSim,
  EspressoBrewSim,
  ElevatorSim,
  LockSim,
  HorologySim,
  SurfaceShipSim,
  ExcavatorCraneSim,
  RoboticsSim,
} from './tech_sims.js';
import {
  DysonVacuumSim,
  FridgeHeatPumpSim,
  EscalatorSim,
  GamingConsoleSim,
  SpatialAudioXrSim,
  CameraOpticsSim,
} from './everyday_consumer_sims.js';

const SIM_BY_CATEGORY = {
  car: DriveSim,
  cars: DriveSim,
  airplane: FlightSim,
  airplanes: FlightSim,
  submarine: DiveSim,
  submarines: DiveSim,
  jet: EngineSim,
  jets: EngineSim,
  engine: EngineSim,
  iphone: PhoneSim,
  phone: PhoneSim,
  phones: PhoneSim,
  laptop: LaptopSim,
  laptops: LaptopSim,
  house: HouseSim,
  houses: HouseSim,
  tv: TvSim,
  tvs: TvSim,
  train: TrainSim,
  trains: TrainSim,
  space: SpaceSim,
  spacecraft: SpaceSim,
  rocket: RocketLaunchSim,
  rockets: RocketLaunchSim,
  heli: HeliSim,
  helicopters: HeliSim,
  ship: SurfaceShipSim,
  ships: SurfaceShipSim,
  robot: RoboticsSim,
  robots: RoboticsSim,
  construction: ExcavatorCraneSim,
  watch: HorologySim,
  watches: HorologySim,
  bike: DriveSim,
  bikes: DriveSim,
  everyday: ToiletFlushSim,
  gaming: GamingConsoleSim,
  console: GamingConsoleSim,
  ps5: GamingConsoleSim,
  'audio-xr': SpatialAudioXrSim,
  vision: SpatialAudioXrSim,
  headphones: SpatialAudioXrSim,
  airpods: SpatialAudioXrSim,
  cameras: CameraOpticsSim,
  camera: CameraOpticsSim,
};

export function createActionSim(categoryId, modelId, ctx) {
  const viewer = ctx && typeof ctx === 'object' ? ctx : (typeof modelId === 'object' ? modelId : null);
  const key = String(categoryId || 'car').toLowerCase();
  const mid = typeof modelId === 'string' ? modelId.toLowerCase() : '';
  if (key === 'everyday') {
    if (mid.includes('dyson') || mid.includes('vacuum')) return new DysonVacuumSim(viewer);
    if (mid.includes('fridge') || mid.includes('refrigerator')) return new FridgeHeatPumpSim(viewer);
    if (mid.includes('escalator')) return new EscalatorSim(viewer);
    if (mid.includes('espresso') || mid.includes('coffee')) return new EspressoBrewSim(viewer);
    if (mid.includes('elevator')) return new ElevatorSim(viewer);
    if (mid.includes('lock')) return new LockSim(viewer);
    return new ToiletFlushSim(viewer);
  }
  if ((key === 'robots' || key === 'robot') && mid.includes('iron-man')) {
    return new FlightSim(viewer);
  }
  const SimClass = SIM_BY_CATEGORY[key] || DriveSim;
  return new SimClass(viewer);
}

export {
  DriveSim,
  FlightSim,
  HeliSim,
  DiveSim,
  EngineSim,
  RocketLaunchSim,
  PhoneSim,
  LaptopSim,
  HouseSim,
  TvSim,
  TrainSim,
  SpaceSim,
  ToiletFlushSim,
  EspressoBrewSim,
  ElevatorSim,
  LockSim,
  HorologySim,
  SurfaceShipSim,
  ExcavatorCraneSim,
  RoboticsSim,
};

