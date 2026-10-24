// Inside Out Studio — Multi-Model 3D Engineering Catalog (8 Categories × 31 Iconic Models = 320+ 3D Parts).
// Each category has a `models` array and an `activeModelId` getter/setter so switching models
// updates `.parts`, `.quiz`, `.cameraPos`, and `.activeModel` seamlessly.
import { CAR_MODELS } from './models/cars.js';
import { AIRPLANE_MODELS, SUBMARINE_MODELS } from './models/aviation_marine.js';
import { PHONE_MODELS, JET_MODELS } from './models/phones_propulsion.js';
import { LAPTOP_MODELS, HOUSE_MODELS, TV_MODELS } from './models/tech_architecture.js';
import { TRAINS_CATEGORY, SPACE_CATEGORY } from './models/trains_space.js';
import { ROCKETS_CATEGORY, ROBOTS_CATEGORY, CONSTRUCTION_CATEGORY } from './models/rockets_robots_heavy.js';
import { HELICOPTERS_CATEGORY, WATCHES_CATEGORY, BIKES_CATEGORY } from './models/rotors_horology_bikes.js';
import { SHIPS_CATEGORY, EVERYDAY_CATEGORY } from './models/ships_everyday.js';

function createCategory({ id, name, fullName, emoji, icon, tagline, models }) {
  let activeModelId = models[0].id;
  return {
    id,
    name,
    fullName: fullName || name,
    emoji: emoji || icon,
    icon: icon || emoji,
    tagline,
    models,
    get activeModelId() {
      return activeModelId;
    },
    set activeModelId(nextId) {
      if (models.some((m) => m.id === nextId)) {
        activeModelId = nextId;
      }
    },
    get activeModel() {
      return models.find((m) => m.id === activeModelId) || models[0];
    },
    get cameraPos() {
      return this.activeModel.cameraPos;
    },
    get parts() {
      return this.activeModel.parts;
    },
    get quiz() {
      return this.activeModel.quiz;
    },
  };
}

export const OBJECTS = [
  createCategory({
    id: 'car',
    name: 'Cars & Supercars',
    fullName: 'Cars, EVs, Supercars & Trucks',
    emoji: '🏎️',
    tagline: 'Tesla Plaid • Cybertruck • Rivian R1T • Ferrari SF90 • Lamborghini V12 • Ford F-150 Raptor • Porsche 911 GT3 RS',
    models: CAR_MODELS,
  }),
  createCategory({
    id: 'airplane',
    name: 'Airplanes & Jets',
    fullName: 'Airliners, Stealth Jets & Bush Planes',
    emoji: '✈️',
    tagline: 'Boeing 737 MAX 9 • Airbus A350-1000 • Lockheed F-22 Raptor • Cessna 172 Skyhawk',
    models: AIRPLANE_MODELS,
  }),
  createCategory({
    id: 'submarine',
    name: 'Submarines',
    fullName: 'Deep-Sea & Nuclear Submarines',
    emoji: '🌊',
    tagline: 'Virginia-Class SSN Nuclear Sub • DSV Limiting Factor (36,000 ft) • Nautilus 360° Acrylic Sub',
    models: SUBMARINE_MODELS,
  }),
  createCategory({
    id: 'iphone',
    name: 'Smartphones',
    fullName: 'iPhone, Pixel & Galaxy Smartphones',
    emoji: '📱',
    tagline: 'iPhone 16 Pro Max • iPhone 16 • Google Pixel 9 Pro XL • Samsung Galaxy S24 Ultra • Galaxy Z Fold 6',
    models: PHONE_MODELS,
  }),
  createCategory({
    id: 'jet',
    name: 'Jet & Rocket Engines',
    fullName: 'Turbofan, Afterburner & Rocket Engines',
    emoji: '🚀',
    tagline: 'GE9X Commercial Turbofan • Pratt & Whitney F135 Afterburner • SpaceX Raptor Methalox Rocket',
    models: JET_MODELS,
  }),
  createCategory({
    id: 'laptop',
    name: 'Mac & Pro Laptops',
    fullName: 'MacBook Pro, MacBook Air & Gaming Laptops',
    emoji: '💻',
    tagline: 'MacBook Pro 16" (M4 Max) • MacBook Air 15" (M3 Fanless) • RTX 4090 Vapor-Chamber Gaming Laptop',
    models: LAPTOP_MODELS,
  }),
  createCategory({
    id: 'house',
    name: 'Houses & Architecture',
    fullName: 'Smart Homes, Glass Pavilions & Eco Domes',
    emoji: '🏠',
    tagline: 'Modern Two-Story Eco Smart Home • Mid-Century Glass & Steel Villa • Geodesic Dome Off-Grid Cabin',
    models: HOUSE_MODELS,
  }),
  createCategory({
    id: 'tv',
    name: '8K TVs & IMAX',
    fullName: '8K Mini-LED, Transparent OLED & IMAX Laser',
    emoji: '📺',
    tagline: '85" QD-OLED & Mini-LED 8K TV • LG 77" Transparent OLED TV • IMAX Dual-4K Laser Cinema',
    models: TV_MODELS,
  }),
  createCategory(TRAINS_CATEGORY),
  createCategory(SPACE_CATEGORY),
  createCategory(ROCKETS_CATEGORY),
  createCategory(ROBOTS_CATEGORY),
  createCategory(CONSTRUCTION_CATEGORY),
  createCategory(HELICOPTERS_CATEGORY),
  createCategory(WATCHES_CATEGORY),
  createCategory(BIKES_CATEGORY),
  createCategory(SHIPS_CATEGORY),
  createCategory(EVERYDAY_CATEGORY),
];

const ID_ALIASES = {
  rocket: 'rockets',
  robot: 'robots',
  trains: 'train',
  helicopter: 'helicopters',
  watch: 'watches',
  bike: 'bikes',
  ship: 'ships',
};

export function getObjectById(id) {
  const norm = ID_ALIASES[id] || id;
  return OBJECTS.find((o) => o.id === norm) || OBJECTS[0];
}

export function setCategoryModel(categoryId, modelId) {
  const cat = getObjectById(categoryId);
  if (cat && modelId) {
    cat.activeModelId = modelId;
  }
  return cat;
}
