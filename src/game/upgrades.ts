import { milesFromFeet } from './distance';
import type { Upgrade } from './types';

export const UPGRADES: Upgrade[] = [
  {
    id: 'starter_shoes',
    name: 'Starter Shoes',
    description: 'The first reliable generator. Adds 1 ft/sec.',
    category: 'speed',
    baseCost: 15,
    costMultiplier: 1.42,
    maxLevel: 75,
    effectType: 'idle_speed_flat',
    effectValue: milesFromFeet(1)
  },
  {
    id: 'fingerless_walking_gloves',
    name: 'Fingerless Walking Gloves',
    description: 'Makes every tap land harder. Adds 5 ft/tap.',
    category: 'click',
    baseCost: 30,
    costMultiplier: 1.5,
    maxLevel: 40,
    effectType: 'click_power_flat',
    effectValue: milesFromFeet(5)
  },
  {
    id: 'walking_stick',
    name: 'Walking Stick',
    description: 'A stable early generator. Adds 5 ft/sec.',
    category: 'speed',
    baseCost: 85,
    costMultiplier: 1.55,
    maxLevel: 50,
    effectType: 'idle_speed_flat',
    effectValue: milesFromFeet(5),
    unlockRequirement: { distanceMiles: milesFromFeet(1000) }
  },
  {
    id: 'rhythm_shoes',
    name: 'Rhythm Shoes',
    description: 'A clean active-play multiplier for better taps.',
    category: 'click',
    baseCost: 140,
    costMultiplier: 1.62,
    maxLevel: 20,
    effectType: 'click_power_multiplier',
    effectValue: 0.12,
    unlockRequirement: { distanceMiles: 0.25 }
  },
  {
    id: 'mall_walker_crew',
    name: 'Mall Walker Crew',
    description: 'A reliable generator crew. Adds 25 ft/sec.',
    category: 'speed',
    baseCost: 420,
    costMultiplier: 1.7,
    maxLevel: 35,
    effectType: 'idle_speed_flat',
    effectValue: milesFromFeet(25),
    unlockRequirement: { distanceMiles: 1 }
  },
  {
    id: 'snack_backpack',
    name: 'Backpack Upgrade',
    description: 'Raises the capped offline progress window.',
    category: 'offline',
    baseCost: 700,
    costMultiplier: 1.9,
    maxLevel: 8,
    effectType: 'offline_cap_multiplier',
    effectValue: 0.25,
    unlockRequirement: { distanceMiles: 10 }
  },
  {
    id: 'hydration_belt',
    name: 'Hydration Belt',
    description: 'A mid-route generator. Adds 100 ft/sec.',
    category: 'speed',
    baseCost: 1600,
    costMultiplier: 1.85,
    maxLevel: 25,
    effectType: 'idle_speed_flat',
    effectValue: milesFromFeet(100),
    unlockRequirement: { distanceMiles: 10 }
  },
  {
    id: 'treadmill_desk',
    name: 'Treadmill Desk',
    description: 'The absurd late generator. Adds 500 ft/sec.',
    category: 'speed',
    baseCost: 7500,
    costMultiplier: 2,
    maxLevel: 15,
    effectType: 'idle_speed_flat',
    effectValue: milesFromFeet(500),
    unlockRequirement: { distanceMiles: 100 }
  }
];
