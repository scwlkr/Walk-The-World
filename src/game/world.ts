import {
  AUTO_SAVE_INTERVAL_MS,
  CANONICAL_MOON_DISTANCE_MILES,
  EARTH_CIRCUMFERENCE_MILES,
  EARTH_PRESTIGE_MOON_ACCELERATION_BONUS,
  EARTH_PRESTIGE_SPEED_BONUS,
  EARTH_PRESTIGE_WB_BONUS,
  MOON_CIRCUMFERENCE_MILES
} from './constants';
import { milesFromFeet } from './distance';
import type {
  GameState,
  JourneyUpgradeDefinition,
  PrestigeState,
  WorldDefinition,
  WorldId,
  WorldProgressState
} from './types';

export const WORLD_IDS: WorldId[] = ['earth', 'moon', 'mars', 'solar_system'];

export const WORLDS: Record<WorldId, WorldDefinition> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    shortName: 'Earth',
    description: 'The home loop. Complete a full Earth circuit to prestige and open lunar travel.',
    loopDistanceMiles: EARTH_CIRCUMFERENCE_MILES,
    defaultUnlocked: true,
    status: 'playable',
    sceneId: 'walkertown',
    lockedSummary: 'Always available'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    shortName: 'Moon',
    description: `A playable lunar route unlocked by Earth prestige. Walker World canon uses ${CANONICAL_MOON_DISTANCE_MILES.toLocaleString()} miles as the Earth-to-Moon distance.`,
    loopDistanceMiles: MOON_CIRCUMFERENCE_MILES,
    defaultUnlocked: false,
    status: 'playable',
    sceneId: 'moon_surface',
    unlockRequirement: { earthPrestiges: 1 },
    lockedSummary: 'Prestige Earth once to unlock Moon'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    shortName: 'Mars',
    description: 'Prototype red-planet route unlocked after a Moon loop.',
    loopDistanceMiles: 13263,
    defaultUnlocked: false,
    status: 'playable',
    sceneId: 'desert',
    unlockRequirement: { moonLoopsCompleted: 1 },
    lockedSummary: 'Complete one Moon loop to unlock Mars prototype'
  },
  solar_system: {
    id: 'solar_system',
    name: 'Solar System',
    shortName: 'Solar',
    description: 'Future interplanetary scaffold for long-term Walker World expansion.',
    loopDistanceMiles: CANONICAL_MOON_DISTANCE_MILES * 10,
    defaultUnlocked: false,
    status: 'future',
    sceneId: 'moon_surface',
    unlockRequirement: { moonLoopsCompleted: 3 },
    lockedSummary: 'Future tier after deeper space progression'
  }
};

export const JOURNEY_UPGRADES: JourneyUpgradeDefinition[] = [
  {
    id: 'better_shoes',
    name: 'Better Shoes',
    description: 'Permanent walking know-how. Raises idle distance and tap distance every journey.',
    baseCost: 1,
    costMultiplier: 1.9,
    maxLevel: 8,
    effectType: 'permanent_speed_bonus',
    effectValue: EARTH_PRESTIGE_SPEED_BONUS
  },
  {
    id: 'route_memory',
    name: 'Route Memory',
    description: 'Start new Earth journeys with Leave the Couch already complete.',
    baseCost: 2,
    costMultiplier: 1,
    maxLevel: 1,
    effectType: 'route_memory',
    effectValue: milesFromFeet(100)
  },
  {
    id: 'friendly_aura',
    name: 'Friendly Aura',
    description: 'A permanent crew vibe that lowers follower leave pressure.',
    baseCost: 2,
    costMultiplier: 2,
    maxLevel: 5,
    effectType: 'follower_stability_bonus',
    effectValue: 0.04
  },
  {
    id: 'bigger_backpack',
    name: 'Bigger Backpack',
    description: 'Permanent packing habits increase the capped offline progress window.',
    baseCost: 2,
    costMultiplier: 2,
    maxLevel: 5,
    effectType: 'offline_cap_bonus',
    effectValue: 0.15
  },
  {
    id: 'moon_map',
    name: 'Moon Map',
    description: 'Permanent lunar notes make Moon routes faster after Journey Reset unlocks them.',
    baseCost: 3,
    costMultiplier: 2,
    maxLevel: 5,
    effectType: 'moon_acceleration_bonus',
    effectValue: EARTH_PRESTIGE_MOON_ACCELERATION_BONUS
  },
  {
    id: 'ledger_sense',
    name: 'Ledger Sense',
    description: 'Permanent economy instincts slightly improve WB queued per mile.',
    baseCost: 3,
    costMultiplier: 2.2,
    maxLevel: 5,
    effectType: 'permanent_wb_bonus',
    effectValue: EARTH_PRESTIGE_WB_BONUS
  }
];

export const createInitialWorldProgress = (now = Date.now()): Record<WorldId, WorldProgressState> => ({
  earth: {
    distanceMiles: 0,
    loopsCompleted: 0,
    unlockedAt: now
  },
  moon: {
    distanceMiles: 0,
    loopsCompleted: 0,
    unlockedAt: null
  },
  mars: {
    distanceMiles: 0,
    loopsCompleted: 0,
    unlockedAt: null
  },
  solar_system: {
    distanceMiles: 0,
    loopsCompleted: 0,
    unlockedAt: null
  }
});

const clampUpgradeLevel = (upgrade: JourneyUpgradeDefinition, level: number): number =>
  Math.min(upgrade.maxLevel, Math.max(0, Math.floor(level)));

export const getJourneyUpgradeById = (upgradeId: string): JourneyUpgradeDefinition | undefined =>
  JOURNEY_UPGRADES.find((upgrade) => upgrade.id === upgradeId);

export const getJourneyUpgradeLevelFromPrestige = (
  prestige: PrestigeState,
  upgradeId: string
): number => {
  const upgrade = getJourneyUpgradeById(upgradeId);
  if (!upgrade) return 0;
  return clampUpgradeLevel(upgrade, prestige.upgrades?.[upgradeId] ?? 0);
};

export const getJourneyUpgradeLevel = (state: GameState, upgradeId: string): number =>
  getJourneyUpgradeLevelFromPrestige(state.prestige, upgradeId);

export const getJourneyUpgradeCost = (upgrade: JourneyUpgradeDefinition, currentLevel: number): number =>
  Math.max(1, Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel)));

export const applyJourneyUpgradeBonuses = (prestige: PrestigeState): PrestigeState => {
  const upgrades = JOURNEY_UPGRADES.reduce<Record<string, number>>((levels, upgrade) => {
    const level = clampUpgradeLevel(upgrade, prestige.upgrades?.[upgrade.id] ?? 0);
    if (level > 0) levels[upgrade.id] = level;
    return levels;
  }, {});

  const bonuses = JOURNEY_UPGRADES.reduce(
    (totals, upgrade) => {
      const level = upgrades[upgrade.id] ?? 0;
      if (level <= 0) return totals;

      switch (upgrade.effectType) {
        case 'permanent_speed_bonus':
          totals.permanentSpeedBonus += upgrade.effectValue * level;
          break;
        case 'permanent_wb_bonus':
          totals.permanentWbBonus += upgrade.effectValue * level;
          break;
        case 'follower_stability_bonus':
          totals.followerStabilityBonus += upgrade.effectValue * level;
          break;
        case 'offline_cap_bonus':
          totals.offlineCapBonus += upgrade.effectValue * level;
          break;
        case 'moon_acceleration_bonus':
          totals.moonAccelerationBonus += upgrade.effectValue * level;
          break;
        case 'route_memory':
          break;
      }

      return totals;
    },
    {
      permanentSpeedBonus: 0,
      permanentWbBonus: 0,
      followerStabilityBonus: 0,
      offlineCapBonus: 0,
      moonAccelerationBonus: 0
    }
  );

  return {
    ...prestige,
    upgrades,
    permanentSpeedBonus: bonuses.permanentSpeedBonus,
    permanentWbBonus: bonuses.permanentWbBonus,
    followerStabilityBonus: bonuses.followerStabilityBonus,
    offlineCapBonus: bonuses.offlineCapBonus,
    moonAccelerationBonus: bonuses.moonAccelerationBonus
  };
};

export const createInitialPrestigeState = (): PrestigeState => applyJourneyUpgradeBonuses({
  earthPrestigeCount: 0,
  journeyTokens: 0,
  totalJourneyTokensEarned: 0,
  upgrades: {},
  permanentSpeedBonus: 0,
  permanentWbBonus: 0,
  followerStabilityBonus: 0,
  offlineCapBonus: 0,
  moonAccelerationBonus: 0,
  lastPrestigedAt: null
});

export const normalizeWorldId = (worldId: unknown): WorldId => {
  if (worldId === 'moon_locked') return 'earth';
  return WORLD_IDS.includes(worldId as WorldId) ? (worldId as WorldId) : 'earth';
};

export const getWorldDefinition = (worldId: WorldId): WorldDefinition => WORLDS[worldId];

export const getWorldProgress = (state: GameState, worldId = state.currentWorldId): WorldProgressState =>
  state.worlds[worldId] ?? createInitialWorldProgress()[worldId];

export const isWorldUnlocked = (state: GameState, worldId: WorldId): boolean => {
  const definition = getWorldDefinition(worldId);
  if (definition.defaultUnlocked) return true;
  if (definition.status !== 'playable') return false;
  if (worldId === 'mars' && getWorldProgress(state, 'moon').loopsCompleted >= (definition.unlockRequirement?.moonLoopsCompleted ?? 1)) {
    return true;
  }
  return Boolean(getWorldProgress(state, worldId).unlockedAt);
};

export const canEnterWorld = (state: GameState, worldId: WorldId): boolean => {
  const definition = getWorldDefinition(worldId);
  return definition.status === 'playable' && isWorldUnlocked(state, worldId);
};

export const getCurrentWorldDefinition = (state: GameState): WorldDefinition => getWorldDefinition(state.currentWorldId);

export const getCurrentWorldDistance = (state: GameState): number => getWorldProgress(state).distanceMiles;

export const getWorldLoopDistance = (state: GameState, worldId = state.currentWorldId): number =>
  getWorldDefinition(worldId).loopDistanceMiles;

export const getWorldLoopDistanceWalked = (state: GameState, worldId = state.currentWorldId): number => {
  const distance = getWorldProgress(state, worldId).distanceMiles;
  return distance % getWorldLoopDistance(state, worldId);
};

export const getWorldProgressPercent = (state: GameState, worldId = state.currentWorldId): number =>
  (getWorldLoopDistanceWalked(state, worldId) / getWorldLoopDistance(state, worldId)) * 100;

export const getWorldUnlockSummary = (state: GameState, worldId: WorldId): string => {
  const definition = getWorldDefinition(worldId);
  if (canEnterWorld(state, worldId)) return 'Unlocked';
  return definition.lockedSummary;
};

export const canPrestigeEarth = (state: GameState): boolean => getWorldProgress(state, 'earth').loopsCompleted >= 1;

export const getJourneyResetTokenReward = (state: GameState): number =>
  canPrestigeEarth(state) ? Math.max(1, getWorldProgress(state, 'earth').loopsCompleted) : 0;

export const getJourneyStartDistanceMiles = (state: GameState): number =>
  getJourneyUpgradeLevel(state, 'route_memory') > 0 ? milesFromFeet(100) : 0;

export const getEarthPrestigeRequirementSummary = (state: GameState): string => {
  if (canPrestigeEarth(state)) {
    const tokens = getJourneyResetTokenReward(state);
    return `Ready: reset for ${tokens.toLocaleString()} Journey Token${tokens === 1 ? '' : 's'}.`;
  }
  const progress = getWorldProgressPercent(state, 'earth');
  return `Complete one Earth loop to unlock Journey Reset. Current Earth loop: ${progress.toFixed(2)}%.`;
};

export const applyEarthPrestige = (state: GameState, now = Date.now()): GameState => {
  if (!canPrestigeEarth(state)) return state;

  const tokenReward = getJourneyResetTokenReward(state);
  const nextPrestigeCount = state.prestige.earthPrestigeCount + 1;
  const startDistanceMiles = getJourneyStartDistanceMiles(state);
  const nextWorlds = {
    ...state.worlds,
    earth: {
      ...state.worlds.earth,
      distanceMiles: startDistanceMiles,
      loopsCompleted: 0
    },
    moon: {
      ...state.worlds.moon,
      unlockedAt: state.worlds.moon.unlockedAt ?? now
    }
  };

  return {
    ...state,
    currentWorldId: 'earth',
    distanceMiles: startDistanceMiles,
    worlds: nextWorlds,
    prestige: applyJourneyUpgradeBonuses({
      ...state.prestige,
      earthPrestigeCount: nextPrestigeCount,
      journeyTokens: state.prestige.journeyTokens + tokenReward,
      totalJourneyTokensEarned: state.prestige.totalJourneyTokensEarned + tokenReward,
      lastPrestigedAt: now
    }),
    upgrades: {},
    followers: {},
    followerMorale: {
      value: 72,
      recentStory: 'A new journey begins. The crew will gather again.',
      lastStoryAt: now
    },
    activeBoosts: [],
    activePlay: {
      tapCombo: 0,
      lastTapAt: null,
      bestTapCombo: state.activePlay.bestTapCombo,
      perfectSteps: 0
    },
    wbBankedRemainder: 0,
    nextRandomEventAt: now + AUTO_SAVE_INTERVAL_MS,
    spawnedEvent: null,
    nextRouteEncounterAt: now + AUTO_SAVE_INTERVAL_MS * 2,
    spawnedRouteEncounter: null,
    ui: {
      ...state.ui,
      moonTeaseUnlocked: true,
      toast: `Journey Reset ${nextPrestigeCount} complete. +${tokenReward} Journey Token${tokenReward === 1 ? '' : 's'}.`
    }
  };
};

export const buyJourneyUpgrade = (state: GameState, upgradeId: string): GameState => {
  const upgrade = getJourneyUpgradeById(upgradeId);
  if (!upgrade) return state;

  const currentLevel = getJourneyUpgradeLevel(state, upgrade.id);
  if (currentLevel >= upgrade.maxLevel) return state;

  const cost = getJourneyUpgradeCost(upgrade, currentLevel);
  if (state.prestige.journeyTokens < cost) {
    return {
      ...state,
      ui: {
        ...state.ui,
        toast: 'Not enough Journey Tokens'
      }
    };
  }

  return {
    ...state,
    prestige: applyJourneyUpgradeBonuses({
      ...state.prestige,
      journeyTokens: state.prestige.journeyTokens - cost,
      upgrades: {
        ...state.prestige.upgrades,
        [upgrade.id]: currentLevel + 1
      }
    }),
    ui: {
      ...state.ui,
      toast: `${upgrade.name} upgraded.`
    }
  };
};
