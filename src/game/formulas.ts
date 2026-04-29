import {
  BASE_WB_PER_MILE,
  DEFAULT_OFFLINE_CAP_SECONDS,
  STARTING_CLICK_MILES,
  STARTING_IDLE_MILES_PER_SECOND
} from './constants';
import { getCosmeticEffectBonus } from './cosmetics';
import { FOLLOWERS } from './followers';
import { getEquipmentEffectBonus } from './inventory';
import { getLandmarksForWorld } from './landmarks';
import { UPGRADES } from './upgrades';
import {
  getCurrentWorldDistance,
  getWorldDefinition,
  getWorldLoopDistanceWalked,
  getWorldProgressPercent
} from './world';
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

  multiplier += getCosmeticEffectBonus(state, 'idle_speed_multiplier');

  const prestigeMultiplier = 1 + state.prestige.permanentSpeedBonus;
  const worldMultiplier = state.currentWorldId === 'moon' ? 1 + state.prestige.moonAccelerationBonus : 1;

  return (idle * multiplier + followerBoost) * speedBoost * prestigeMultiplier * worldMultiplier;
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

  multiplier += getCosmeticEffectBonus(state, 'click_power_multiplier');

  const prestigeMultiplier = 1 + state.prestige.permanentSpeedBonus;
  const worldMultiplier = state.currentWorldId === 'moon' ? 1 + state.prestige.moonAccelerationBonus : 1;

  return clickMiles * multiplier * clickBoost * prestigeMultiplier * worldMultiplier;
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

  multiplier += getCosmeticEffectBonus(state, 'wb_multiplier');
  multiplier += getEquipmentEffectBonus(state, 'wb_multiplier');
  multiplier += state.prestige.permanentWbBonus;

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

  multiplier += getCosmeticEffectBonus(state, 'event_reward_multiplier');
  multiplier *= state.activeBoosts
    .filter((boost) => boost.effectType === 'event_reward_multiplier')
    .reduce((acc, boost) => acc * boost.multiplier, 1);

  return multiplier;
};

export const getOfflineCapSeconds = (state: GameState): number => {
  const backpack = UPGRADES.find((upgrade) => upgrade.id === 'snack_backpack');
  const level = backpack ? getUpgradeLevel(state, backpack.id) : 0;
  const multiplier = backpack ? 1 + backpack.effectValue * level : 1;
  return Math.floor(DEFAULT_OFFLINE_CAP_SECONDS * multiplier);
};

export const getEarthProgressPercent = (state: GameState): number => getWorldProgressPercent(state, 'earth');

export const getCurrentWorldProgressPercent = (state: GameState): number => getWorldProgressPercent(state);

export const getCurrentWorldLoopDistance = (state: GameState): number => getWorldLoopDistanceWalked(state);

export const getCurrentWorldTotalDistance = (state: GameState): number => getCurrentWorldDistance(state);

export const getCurrentLandmark = (state: GameState): Landmark => {
  const loopDistance = getWorldLoopDistanceWalked(state);
  const landmarks = getLandmarksForWorld(state.currentWorldId);
  let current = landmarks[0];

  for (const landmark of landmarks) {
    if (landmark.distanceMiles <= loopDistance) {
      current = landmark;
    }
  }

  return current;
};

export const getNextLandmark = (state: GameState): Landmark => {
  const loopDistance = getWorldLoopDistanceWalked(state);
  const landmarks = getLandmarksForWorld(state.currentWorldId);
  return (
    landmarks.find((landmark) => landmark.distanceMiles > loopDistance) ?? landmarks[landmarks.length - 1]
  );
};

export const calculateDistanceToNextLandmark = (state: GameState): number => {
  const loopDistance = getWorldLoopDistanceWalked(state);
  return Math.max(0, getNextLandmark(state).distanceMiles - loopDistance);
};

export const getCurrentWorldLoopLabel = (state: GameState): string => {
  const definition = getWorldDefinition(state.currentWorldId);
  const progress = getCurrentWorldProgressPercent(state);
  return `${definition.shortName} ${progress.toFixed(2)}%`;
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
