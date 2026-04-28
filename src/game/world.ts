import {
  CANONICAL_MOON_DISTANCE_MILES,
  EARTH_CIRCUMFERENCE_MILES,
  EARTH_PRESTIGE_MOON_ACCELERATION_BONUS,
  EARTH_PRESTIGE_SPEED_BONUS,
  EARTH_PRESTIGE_WB_BONUS,
  MOON_CIRCUMFERENCE_MILES
} from './constants';
import type { GameState, PrestigeState, WorldDefinition, WorldId, WorldProgressState } from './types';

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
    description: 'Future red-planet route placeholder. Data-only until later world-expansion phases.',
    loopDistanceMiles: 13263,
    defaultUnlocked: false,
    status: 'future',
    sceneId: 'moon_surface',
    unlockRequirement: { moonLoopsCompleted: 1 },
    lockedSummary: 'Future tier after Moon loops'
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

export const createInitialPrestigeState = (): PrestigeState => ({
  earthPrestigeCount: 0,
  permanentSpeedBonus: 0,
  permanentWbBonus: 0,
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

export const getEarthPrestigeRequirementSummary = (state: GameState): string => {
  if (canPrestigeEarth(state)) return 'Ready: complete prestige to unlock or boost Moon.';
  const progress = getWorldProgressPercent(state, 'earth');
  return `Complete one Earth loop to prestige. Current Earth loop: ${progress.toFixed(2)}%.`;
};

export const applyEarthPrestige = (state: GameState, now = Date.now()): GameState => {
  if (!canPrestigeEarth(state)) return state;

  const nextPrestigeCount = state.prestige.earthPrestigeCount + 1;
  const nextWorlds = {
    ...state.worlds,
    earth: {
      ...state.worlds.earth,
      distanceMiles: 0,
      loopsCompleted: 0
    },
    moon: {
      ...state.worlds.moon,
      unlockedAt: state.worlds.moon.unlockedAt ?? now
    }
  };

  return {
    ...state,
    currentWorldId: 'moon',
    distanceMiles: nextWorlds.moon.distanceMiles,
    worlds: nextWorlds,
    prestige: {
      earthPrestigeCount: nextPrestigeCount,
      permanentSpeedBonus: nextPrestigeCount * EARTH_PRESTIGE_SPEED_BONUS,
      permanentWbBonus: nextPrestigeCount * EARTH_PRESTIGE_WB_BONUS,
      moonAccelerationBonus: nextPrestigeCount * EARTH_PRESTIGE_MOON_ACCELERATION_BONUS,
      lastPrestigedAt: now
    },
    ui: {
      ...state.ui,
      moonTeaseUnlocked: true,
      toast: `Earth prestige ${nextPrestigeCount} complete. Moon unlocked.`
    }
  };
};
