import { RANDOM_EVENT_LIFE_MS } from './constants';
import type { RandomEventDefinition } from './types';

export const RANDOM_EVENTS: RandomEventDefinition[] = [
  {
    id: 'speed_breeze',
    name: 'Speed Breeze',
    description: 'A perfect tailwind! Idle speed doubled.',
    rarity: 'common',
    durationMs: 20000,
    weight: 22,
    effectType: 'temporary_speed_multiplier',
    value: 2
  },
  {
    id: 'loose_walkerbuck',
    name: 'Loose WalkerBuck',
    description: 'Found cash on the trail.',
    rarity: 'common',
    durationMs: 0,
    weight: 20,
    effectType: 'instant_wb',
    value: 120
  },
  {
    id: 'snack_cache',
    name: 'Snack Cache',
    description: 'A trail snack is tucked behind the next marker.',
    rarity: 'common',
    durationMs: 0,
    weight: 12,
    effectType: 'item_drop',
    itemId: 'trail_mix',
    quantity: 1
  },
  {
    id: 'lost_postcard',
    name: 'Lost Postcard',
    description: 'A Walkertown souvenir flutters onto the route.',
    rarity: 'common',
    durationMs: 0,
    weight: 8,
    effectType: 'item_drop',
    itemId: 'walkertown_postcard',
    quantity: 1
  },
  {
    id: 'big_lunge',
    name: 'Big Lunge',
    description: 'Huge stride unlocked.',
    rarity: 'uncommon',
    durationMs: 0,
    weight: 14,
    effectType: 'instant_distance',
    value: 0.8
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    description: 'Click power boost for 15 seconds.',
    rarity: 'uncommon',
    durationMs: 15000,
    weight: 13,
    effectType: 'temporary_click_multiplier',
    value: 2.3
  },
  {
    id: 'trail_dog_zoomies',
    name: 'Trail Dog Zoomies',
    description: 'Followers get turbo mode.',
    rarity: 'uncommon',
    durationMs: 20000,
    weight: 11,
    effectType: 'temporary_follower_multiplier',
    value: 2.2
  },
  {
    id: 'mystery_backpack',
    name: 'Mystery Backpack',
    description: 'Could be snacks. Could be treasure.',
    rarity: 'rare',
    durationMs: 0,
    weight: 8,
    effectType: 'mystery',
    value: 1
  },
  {
    id: 'route_marker_found',
    name: 'Route Marker',
    description: 'A fresh marker drops near the walking line.',
    rarity: 'rare',
    durationMs: 0,
    weight: 6,
    effectType: 'item_drop',
    itemId: 'route_marker',
    quantity: 1
  },
  {
    id: 'fake_shortcut',
    name: 'Fake Shortcut',
    description: 'Oops, not a shortcut. Still kinda useful.',
    rarity: 'common',
    durationMs: 0,
    weight: 10,
    effectType: 'fake',
    value: 1
  },
  {
    id: 'golden_shoe',
    name: 'Golden Shoe',
    description: 'Legendary speed buff!',
    rarity: 'legendary',
    durationMs: 12000,
    weight: 2,
    effectType: 'temporary_speed_multiplier',
    value: 4
  }
];

export const getRandomEventLifetime = (): number => RANDOM_EVENT_LIFE_MS;
