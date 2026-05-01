import { getWorldLoopDistanceWalked } from './world';
import type { GameState } from './types';

export type RegionEffect = {
  idleMultiplier?: number;
  clickMultiplier?: number;
  eventRewardMultiplier?: number;
  followerRecruitMultiplier?: number;
  followerStabilityMultiplier?: number;
};

export type RegionDefinition = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  unlockDistanceMiles: number;
  sceneId: string;
  shopOfferIds: string[];
  followerIds: string[];
  cosmeticItemIds: string[];
  eventIds: string[];
  effect: RegionEffect;
};

export const EARTH_REGIONS: RegionDefinition[] = [
  {
    id: 'walkertown',
    name: 'Walkertown Start',
    shortName: 'Start',
    description: 'Bedroom-to-sidewalk starter route with cheap supplies.',
    unlockDistanceMiles: 0,
    sceneId: 'walkertown',
    shopOfferIds: ['offer_trail_mix_main', 'offer_walkertown_postcard_main'],
    followerIds: [],
    cosmeticItemIds: ['retro_sweatband_item'],
    eventIds: ['speed_breeze', 'snack_cache'],
    effect: { clickMultiplier: 0.03 }
  },
  {
    id: 'suburb',
    name: 'Suburb Sidewalk',
    shortName: 'Suburb',
    description: 'Steady neighborhood walking with reliable crew growth.',
    unlockDistanceMiles: 100 / 5280,
    sceneId: 'suburb',
    shopOfferIds: ['offer_gas_station_sunglasses_main', 'offer_lucky_shoelaces_main'],
    followerIds: ['neighborhood_walker'],
    cosmeticItemIds: ['gas_station_sunglasses'],
    eventIds: ['parade_recruit_surge'],
    effect: { followerRecruitMultiplier: 0.06 }
  },
  {
    id: 'downtown',
    name: 'Downtown Loop',
    shortName: 'Downtown',
    description: 'Crowded blocks, better gear, and faster tap pacing.',
    unlockDistanceMiles: 1,
    sceneId: 'skyline',
    shopOfferIds: ['offer_starter_step_counter_main', 'offer_nyc_metro_card_main'],
    followerIds: ['mall_walker', 'city_power_walker'],
    cosmeticItemIds: ['starter_step_counter'],
    eventIds: ['parade_recruit_surge', 'rush_hour_sprint'],
    effect: { clickMultiplier: 0.07, eventRewardMultiplier: 0.04 }
  },
  {
    id: 'night_city',
    name: 'Night City',
    shortName: 'Night',
    description: 'Late-route lights with stronger event payouts.',
    unlockDistanceMiles: 10,
    sceneId: 'night_city',
    shopOfferIds: ['offer_aura_battery_main', 'offer_detour_token_main'],
    followerIds: ['hydration_bro'],
    cosmeticItemIds: ['lucky_laces_item'],
    eventIds: ['walking_playlist'],
    effect: { eventRewardMultiplier: 0.08 }
  },
  {
    id: 'forest',
    name: 'Forest Road',
    shortName: 'Forest',
    description: 'Cool shade and snack luck for route collectors.',
    unlockDistanceMiles: 100,
    sceneId: 'forest_illusion',
    shopOfferIds: ['offer_route_marker_main', 'offer_mile_badge_main'],
    followerIds: ['trail_grandma'],
    cosmeticItemIds: ['lucky_laces_item'],
    eventIds: ['perfect_weather', 'snack_cache'],
    effect: { idleMultiplier: 0.05, followerStabilityMultiplier: 0.06 }
  },
  {
    id: 'desert',
    name: 'Desert Highway',
    shortName: 'Desert',
    description: 'High heat, bigger boosts, and riskier route pacing.',
    unlockDistanceMiles: 500,
    sceneId: 'desert',
    shopOfferIds: ['offer_trail_socks_main', 'offer_detour_token_main'],
    followerIds: ['lost_tourist'],
    cosmeticItemIds: ['trail_socks'],
    eventIds: ['blister_incident', 'perfect_weather'],
    effect: { idleMultiplier: 0.08 }
  },
  {
    id: 'grand_canyon',
    name: 'Grand Canyon Rim',
    shortName: 'Canyon',
    description: 'Scenic detours with souvenir drops.',
    unlockDistanceMiles: 750,
    sceneId: 'grand_canyon',
    shopOfferIds: ['offer_grand_canyon_pebble_main', 'offer_souvenir_magnet_main'],
    followerIds: ['lost_tourist'],
    cosmeticItemIds: ['gas_station_sunglasses'],
    eventIds: ['perfect_weather', 'route_marker_found'],
    effect: { eventRewardMultiplier: 0.1 }
  },
  {
    id: 'mountains',
    name: 'Mountain Pass',
    shortName: 'Mountain',
    description: 'Hard climbs reward idle distance and stable followers.',
    unlockDistanceMiles: 1000,
    sceneId: 'mountains',
    shopOfferIds: ['offer_big_dawg_license_main', 'offer_trail_socks_main'],
    followerIds: ['trail_grandma', 'trekking_pole_guy'],
    cosmeticItemIds: ['trail_socks'],
    eventIds: ['perfect_weather', 'trail_dog_zoomies'],
    effect: { idleMultiplier: 0.12, followerStabilityMultiplier: 0.08 }
  },
  {
    id: 'niagara',
    name: 'Niagara Walk',
    shortName: 'Niagara',
    description: 'Mist and crowds make followers calmer.',
    unlockDistanceMiles: 1800,
    sceneId: 'niagara_falls',
    shopOfferIds: ['offer_souvenir_magnet_main', 'offer_detour_token_main'],
    followerIds: ['lost_tourist'],
    cosmeticItemIds: ['golden_wayfarers_item'],
    eventIds: ['rainy_day', 'parade_recruit_surge'],
    effect: { followerStabilityMultiplier: 0.12 }
  },
  {
    id: 'london',
    name: 'London-Inspired Rain',
    shortName: 'London',
    description: 'Rainy streets lower crew churn and unlock city souvenirs.',
    unlockDistanceMiles: 2200,
    sceneId: 'london',
    shopOfferIds: ['offer_souvenir_magnet_main', 'offer_golden_wayfarers_main'],
    followerIds: ['umbrella_walker'],
    cosmeticItemIds: ['golden_wayfarers_item'],
    eventIds: ['rainy_day'],
    effect: { followerStabilityMultiplier: 0.16 }
  },
  {
    id: 'old_europe',
    name: 'Old European City',
    shortName: 'Old City',
    description: 'Historic blocks with stronger route-event rewards.',
    unlockDistanceMiles: 2600,
    sceneId: 'rome',
    shopOfferIds: ['offer_walker_passport_main', 'offer_souvenir_magnet_main'],
    followerIds: ['lost_tourist'],
    cosmeticItemIds: ['golden_wayfarers_item'],
    eventIds: ['walking_playlist', 'route_marker_found'],
    effect: { eventRewardMultiplier: 0.12 }
  },
  {
    id: 'new_york',
    name: 'New York-Inspired Sprint',
    shortName: 'New York',
    description: 'Fast lights, fast taps, and transit souvenirs.',
    unlockDistanceMiles: 3000,
    sceneId: 'skyline',
    shopOfferIds: ['offer_nyc_metro_card_main', 'offer_aura_battery_main'],
    followerIds: ['city_power_walker'],
    cosmeticItemIds: ['gas_station_sunglasses'],
    eventIds: ['rush_hour_sprint', 'parade_recruit_surge'],
    effect: { clickMultiplier: 0.15 }
  },
  {
    id: 'tokyo',
    name: 'Tokyo-Inspired Neon',
    shortName: 'Tokyo',
    description: 'Neon pace with stronger active-play bonuses.',
    unlockDistanceMiles: 6000,
    sceneId: 'tokyo',
    shopOfferIds: ['offer_tokyo_transit_pass_main', 'offer_aura_battery_main'],
    followerIds: ['neon_stride_fan'],
    cosmeticItemIds: ['lucky_laces_item'],
    eventIds: ['walking_playlist', 'rush_hour_sprint'],
    effect: { clickMultiplier: 0.18, eventRewardMultiplier: 0.08 }
  },
  {
    id: 'paris',
    name: 'Paris-Inspired Tour',
    shortName: 'Paris',
    description: 'World-tour souvenirs and high-value route events.',
    unlockDistanceMiles: 10000,
    sceneId: 'paris',
    shopOfferIds: ['offer_paris_keychain_main', 'offer_golden_wayfarers_main'],
    followerIds: ['lost_tourist'],
    cosmeticItemIds: ['golden_wayfarers_item'],
    eventIds: ['perfect_weather', 'walking_playlist'],
    effect: { eventRewardMultiplier: 0.16, followerRecruitMultiplier: 0.08 }
  },
  {
    id: 'around_world',
    name: 'Around The World',
    shortName: 'World',
    description: 'Completion layer preview before Journey Reset work.',
    unlockDistanceMiles: 24901,
    sceneId: 'great_wall_china',
    shopOfferIds: ['offer_walker_passport_main', 'offer_certified_ledger_receipt_main'],
    followerIds: ['trekking_pole_guy', 'neon_stride_fan'],
    cosmeticItemIds: ['industrial_farmer_overalls'],
    eventIds: ['double_step_weekend', 'golden_shoe'],
    effect: { idleMultiplier: 0.2, clickMultiplier: 0.1, eventRewardMultiplier: 0.15 }
  }
];

export const getRegionById = (regionId: string | null | undefined): RegionDefinition | undefined =>
  regionId ? EARTH_REGIONS.find((region) => region.id === regionId) : undefined;

export const getCurrentRegion = (state: GameState): RegionDefinition => {
  if (state.currentWorldId !== 'earth') {
    return EARTH_REGIONS[EARTH_REGIONS.length - 1];
  }

  const distance = getWorldLoopDistanceWalked(state);
  let current = EARTH_REGIONS[0];
  for (const region of EARTH_REGIONS) {
    if (region.unlockDistanceMiles <= distance) {
      current = region;
    }
  }
  return current;
};

export const getNextRegion = (state: GameState): RegionDefinition | null => {
  if (state.currentWorldId !== 'earth') return null;
  const distance = getWorldLoopDistanceWalked(state);
  return EARTH_REGIONS.find((region) => region.unlockDistanceMiles > distance) ?? null;
};

export const getUnlockedRegions = (state: GameState): RegionDefinition[] => {
  const distance = state.worlds.earth.distanceMiles;
  return EARTH_REGIONS.filter((region) => region.unlockDistanceMiles <= distance);
};

export const getCurrentRegionEffect = (state: GameState): RegionEffect => getCurrentRegion(state).effect;

export const isRegionUnlocked = (state: GameState, regionId: string): boolean => {
  const region = getRegionById(regionId);
  return Boolean(region && getUnlockedRegions(state).some((unlocked) => unlocked.id === region.id));
};

export const isInRequiredRegion = (state: GameState, regionIds: string[] | undefined): boolean =>
  !regionIds?.length || regionIds.includes(getCurrentRegion(state).id);

export const getDailyRegionalOfferIds = (state: GameState): string[] => {
  const unlocked = getUnlockedRegions(state);
  const current = getCurrentRegion(state);
  const pool = Array.from(new Set([...current.shopOfferIds, ...unlocked.flatMap((region) => region.shopOfferIds)]));
  if (pool.length <= 6) return pool;

  const day = Math.floor(Date.now() / 86400000);
  const start = day % pool.length;
  return Array.from({ length: 6 }, (_, index) => pool[(start + index) % pool.length]);
};

export const getRegionEffectSummary = (region: RegionDefinition): string => {
  const entries: string[] = [];
  if (region.effect.idleMultiplier) entries.push(`+${Math.round(region.effect.idleMultiplier * 100)}% DPS`);
  if (region.effect.clickMultiplier) entries.push(`+${Math.round(region.effect.clickMultiplier * 100)}% DPT`);
  if (region.effect.eventRewardMultiplier) entries.push(`+${Math.round(region.effect.eventRewardMultiplier * 100)}% events`);
  if (region.effect.followerRecruitMultiplier) entries.push(`+${Math.round(region.effect.followerRecruitMultiplier * 100)}% recruit`);
  if (region.effect.followerStabilityMultiplier) entries.push(`+${Math.round(region.effect.followerStabilityMultiplier * 100)}% stability`);
  return entries.join(' · ') || 'Flavor region';
};
