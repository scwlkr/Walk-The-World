import {
  BASE_WB_PER_MILE,
  DEFAULT_OFFLINE_CAP_SECONDS,
  EARTH_CIRCUMFERENCE_MILES,
  STARTING_CLICK_MILES,
  STARTING_IDLE_MILES_PER_SECOND
} from './constants';
import { FOLLOWERS } from './followers';
import { EARTH_LANDMARKS } from './landmarks';
import { UPGRADES } from './upgrades';
import type { Follower, GameState, Landmark, Upgrade } from './types';

export const getUpgradeCost = (upgrade: Upgrade, currentLevel: number): number =>
  Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));

export const getFollowerCost = (follower: Follower, currentCount: number): number =>
  Math.floor(follower.baseCost * Math.pow(follower.costMultiplier, currentCount));

const getUpgradeLevel = (state: GameState, upgradeId: string): number => state.upgrades[upgradeId] ?? 0;

const getFollowerCount = (state: GameState, followerId: string): number => state.followers[followerId] ?? 0;

export const getIdleMilesPerSecond = (state: GameState): number => {
  let idle = STARTING_IDLE_MILES_PER_SECOND + state.baseIdleMilesPerSecond;
  let multiplier = 1;

  for (const upgrade of UPGRADES) {
    const level = getUpgradeLevel(state, upgrade.id);
    if (level === 0) continue;

    if (upgrade.effectType === 'idle_speed_flat') {
      idle += upgrade.effectValue * level;
    }

    if (upgrade.effectType === 'idle_speed_multiplier') {
      multiplier += upgrade.effectValue * level;
    }
  }

  const followerBoost = getFollowerMilesPerSecond(state);
  const speedBoost = state.activeBoosts
    .filter((boost) => boost.effectType === 'speed_multiplier')
    .reduce((acc, boost) => acc * boost.multiplier, 1);

  return (idle * multiplier + followerBoost) * speedBoost;
};

export const getFollowerMilesPerSecond = (state: GameState): number => {
  const base = FOLLOWERS.reduce((sum, follower) => {
    const count = getFollowerCount(state, follower.id);
    return sum + follower.milesPerSecond * count;
  }, 0);

  const boost = state.activeBoosts
    .filter((active) => active.effectType === 'follower_multiplier')
    .reduce((acc, active) => acc * active.multiplier, 1);

  return base * boost;
};

export const getClickMiles = (state: GameState): number => {
  let clickMiles = STARTING_CLICK_MILES + state.baseClickMiles;
  let multiplier = 1;

  for (const upgrade of UPGRADES) {
    const level = getUpgradeLevel(state, upgrade.id);
    if (level === 0) continue;

    if (upgrade.effectType === 'click_power_flat') {
      clickMiles += upgrade.effectValue * level;
    }

    if (upgrade.effectType === 'click_power_multiplier') {
      multiplier += upgrade.effectValue * level;
    }
  }

  const clickBoost = state.activeBoosts
    .filter((boost) => boost.effectType === 'click_multiplier')
    .reduce((acc, boost) => acc * boost.multiplier, 1);

  return clickMiles * multiplier * clickBoost;
};

export const getWbPerMile = (state: GameState): number => {
  let multiplier = 1;
  for (const upgrade of UPGRADES) {
    const level = getUpgradeLevel(state, upgrade.id);
    if (level === 0) continue;
    if (upgrade.effectType === 'wb_multiplier') {
      multiplier += upgrade.effectValue * level;
    }
  }

  return BASE_WB_PER_MILE * multiplier;
};

export const getEventRewardMultiplier = (state: GameState): number => {
  let multiplier = 1;

  for (const upgrade of UPGRADES) {
    const level = getUpgradeLevel(state, upgrade.id);
    if (upgrade.effectType === 'event_reward_multiplier' && level > 0) {
      multiplier += upgrade.effectValue * level;
    }
  }

  return multiplier;
};

export const getOfflineCapSeconds = (state: GameState): number => {
  const backpack = UPGRADES.find((upgrade) => upgrade.id === 'snack_backpack');
  const level = backpack ? getUpgradeLevel(state, backpack.id) : 0;
  const multiplier = backpack ? 1 + backpack.effectValue * level : 1;
  return Math.floor(DEFAULT_OFFLINE_CAP_SECONDS * multiplier);
};

export const getEarthProgressPercent = (state: GameState): number =>
  ((state.distanceMiles % EARTH_CIRCUMFERENCE_MILES) / EARTH_CIRCUMFERENCE_MILES) * 100;

const getLoopDistance = (state: GameState): number => state.distanceMiles % EARTH_CIRCUMFERENCE_MILES;

export const getCurrentLandmark = (state: GameState): Landmark => {
  const loopDistance = getLoopDistance(state);
  let current = EARTH_LANDMARKS[0];

  for (const landmark of EARTH_LANDMARKS) {
    if (landmark.distanceMiles <= loopDistance) {
      current = landmark;
    }
  }

  return current;
};

export const getNextLandmark = (state: GameState): Landmark => {
  const loopDistance = getLoopDistance(state);
  return (
    EARTH_LANDMARKS.find((landmark) => landmark.distanceMiles > loopDistance) ?? EARTH_LANDMARKS[EARTH_LANDMARKS.length - 1]
  );
};

export const calculateDistanceToNextLandmark = (state: GameState): number => {
  const loopDistance = getLoopDistance(state);
  return Math.max(0, getNextLandmark(state).distanceMiles - loopDistance);
};

export const calculateOfflineProgress = (
  state: GameState,
  elapsedSeconds: number
): { distance: number; wb: number; secondsApplied: number } => {
  const secondsApplied = Math.min(Math.max(elapsedSeconds, 0), getOfflineCapSeconds(state));
  const distance = getIdleMilesPerSecond(state) * secondsApplied;
  const wb = Math.floor(distance * getWbPerMile(state));

  return { distance, wb, secondsApplied };
};
