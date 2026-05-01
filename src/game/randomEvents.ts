import { RANDOM_EVENT_LIFE_MS } from './constants';
import { getCurrentRegion } from './regions';
import type { GameState, RandomEventDefinition } from './types';

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
  },
  {
    id: 'perfect_weather',
    name: 'Perfect Weather',
    description: 'The route feels effortless. DPS jumps for a short stretch.',
    rarity: 'uncommon',
    durationMs: 45000,
    weight: 16,
    effectType: 'temporary_speed_multiplier',
    value: 1.2,
    weatherTag: 'perfect'
  },
  {
    id: 'rainy_day',
    name: 'Rainy Day',
    description: 'Nobody wants to sprint, but the crew sticks together.',
    rarity: 'common',
    durationMs: 60000,
    weight: 15,
    effectType: 'temporary_follower_stability',
    value: 1.25,
    regionIds: ['niagara', 'london'],
    weatherTag: 'rain'
  },
  {
    id: 'blister_incident',
    name: 'Blister Incident',
    description: 'Taps lose some power until the sting fades.',
    rarity: 'common',
    durationMs: 30000,
    weight: 10,
    effectType: 'temporary_click_multiplier',
    value: 0.72,
    regionIds: ['desert'],
    weatherTag: 'heat'
  },
  {
    id: 'parade_recruit_surge',
    name: 'Parade',
    description: 'A crowd joins the walk and follower recruiting gets easier.',
    rarity: 'uncommon',
    durationMs: 45000,
    weight: 14,
    effectType: 'temporary_recruit_multiplier',
    value: 1.35,
    regionIds: ['suburb', 'downtown', 'niagara', 'new_york'],
    weatherTag: 'crowd'
  },
  {
    id: 'walking_playlist',
    name: 'Walking Playlist',
    description: 'A perfect beat makes every route reward feel a little bigger.',
    rarity: 'uncommon',
    durationMs: 60000,
    weight: 12,
    effectType: 'temporary_click_multiplier',
    value: 1.12,
    regionIds: ['night_city', 'old_europe', 'tokyo', 'paris']
  },
  {
    id: 'rush_hour_sprint',
    name: 'Rush-Hour Sprint',
    description: 'Active taps cut through the crowd.',
    rarity: 'rare',
    durationMs: 30000,
    weight: 9,
    effectType: 'temporary_click_multiplier',
    value: 1.45,
    regionIds: ['downtown', 'new_york', 'tokyo']
  },
  {
    id: 'double_step_weekend',
    name: 'Double Step Weekend',
    description: 'The weekly walking crowd pushes milestone progress faster.',
    rarity: 'rare',
    durationMs: 90000,
    weight: 8,
    effectType: 'temporary_speed_multiplier',
    value: 1.5,
    regionIds: ['around_world'],
    weatherTag: 'weekend'
  }
];

export const getRandomEventLifetime = (): number => RANDOM_EVENT_LIFE_MS;

export const getRandomEventsForState = (state: GameState): RandomEventDefinition[] => {
  const region = getCurrentRegion(state);
  const regionalEventIds = new Set(region.eventIds);
  const events = RANDOM_EVENTS.filter(
    (event) =>
      !event.regionIds?.length ||
      event.regionIds.includes(region.id) ||
      regionalEventIds.has(event.id)
  );
  return events.length ? events : RANDOM_EVENTS.filter((event) => !event.regionIds?.length);
};
