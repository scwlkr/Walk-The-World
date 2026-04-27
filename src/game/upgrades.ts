import type { Upgrade } from './types';

export const UPGRADES: Upgrade[] = [
  {
    id: 'worn_out_sneakers',
    name: 'Worn-Out Sneakers',
    description: 'Still squeak, still walk. +idle miles/sec.',
    category: 'speed',
    baseCost: 15,
    costMultiplier: 1.45,
    maxLevel: 30,
    effectType: 'idle_speed_flat',
    effectValue: 0.00018
  },
  {
    id: 'motivational_socks',
    name: 'Motivational Socks',
    description: 'Each stripe whispers “one more step.”',
    category: 'click',
    baseCost: 30,
    costMultiplier: 1.5,
    maxLevel: 25,
    effectType: 'click_power_flat',
    effectValue: 0.0015
  },
  {
    id: 'gas_station_coffee',
    name: 'Gas Station Coffee',
    description: 'Questionable flavor, undeniable speed.',
    category: 'speed',
    baseCost: 70,
    costMultiplier: 1.65,
    maxLevel: 20,
    effectType: 'idle_speed_multiplier',
    effectValue: 0.12
  },
  {
    id: 'walking_stick',
    name: 'Walking Stick',
    description: 'Stylish and surprisingly springy.',
    category: 'click',
    baseCost: 90,
    costMultiplier: 1.6,
    maxLevel: 20,
    effectType: 'click_power_multiplier',
    effectValue: 0.1
  },
  {
    id: 'slightly_better_knees',
    name: 'Slightly Better Knees',
    description: 'A medical miracle in two crunchy joints.',
    category: 'speed',
    baseCost: 180,
    costMultiplier: 1.7,
    maxLevel: 20,
    effectType: 'idle_speed_flat',
    effectValue: 0.001
  },
  {
    id: 'map_from_dale',
    name: 'Map From a Guy Named Dale',
    description: 'Hand-drawn map that somehow helps route planning.',
    category: 'event',
    baseCost: 240,
    costMultiplier: 1.75,
    maxLevel: 1,
    effectType: 'event_reward_multiplier',
    effectValue: 0.2
  },
  {
    id: 'snack_backpack',
    name: 'Backpack of Questionable Snacks',
    description: 'Increases offline walking cap. Smells odd.',
    category: 'offline',
    baseCost: 340,
    costMultiplier: 1.9,
    maxLevel: 8,
    effectType: 'offline_cap_multiplier',
    effectValue: 0.25
  },
  {
    id: 'speed_walker_hat',
    name: 'Speed Walker Hat',
    description: 'Aerodynamic brim for extra WB per mile.',
    category: 'earnings',
    baseCost: 500,
    costMultiplier: 1.85,
    maxLevel: 12,
    effectType: 'wb_multiplier',
    effectValue: 0.15
  },
  {
    id: 'tiny_lunge_technique',
    name: 'Tiny Lunge Technique',
    description: 'Makes random events hit harder.',
    category: 'event',
    baseCost: 700,
    costMultiplier: 1.85,
    maxLevel: 8,
    effectType: 'event_reward_multiplier',
    effectValue: 0.2
  },
  {
    id: 'carbon_fiber_shoelaces',
    name: 'Carbon Fiber Shoelaces',
    description: 'Ridiculously overengineered, wonderfully fast.',
    category: 'speed',
    baseCost: 1500,
    costMultiplier: 2,
    maxLevel: 10,
    effectType: 'idle_speed_multiplier',
    effectValue: 0.2,
    unlockRequirement: { distanceMiles: 800 }
  },
  {
    id: 'international_walking_permit',
    name: 'International Walking Permit',
    description: 'Officially licensed to stride globally.',
    category: 'earnings',
    baseCost: 3500,
    costMultiplier: 2,
    maxLevel: 5,
    effectType: 'wb_multiplier',
    effectValue: 0.35,
    unlockRequirement: { distanceMiles: 2500 }
  },
  {
    id: 'walkerbucks_pedometer',
    name: 'WalkerBucks Pedometer',
    description: 'Tracks every step, milks every WB.',
    category: 'earnings',
    baseCost: 5000,
    costMultiplier: 2.1,
    maxLevel: 10,
    effectType: 'wb_multiplier',
    effectValue: 0.2,
    unlockRequirement: { earthLoopsCompleted: 1 }
  }
];
