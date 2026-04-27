import {
  AUTO_SAVE_INTERVAL_MS,
  SAVE_VERSION,
  STARTING_CLICK_MILES,
  STARTING_IDLE_MILES_PER_SECOND,
  STARTING_WALKERBUCKS
} from './constants';
import type { GameState } from './types';

export const createInitialGameState = (now = Date.now()): GameState => ({
  saveVersion: SAVE_VERSION,
  distanceMiles: 0,
  walkerBucks: STARTING_WALKERBUCKS,
  totalWalkerBucksEarned: 0,
  baseIdleMilesPerSecond: STARTING_IDLE_MILES_PER_SECOND,
  baseClickMiles: STARTING_CLICK_MILES,
  currentWorldId: 'earth',
  earthLoopsCompleted: 0,
  lastSavedAt: now,
  upgrades: {},
  followers: {},
  activeBoosts: [],
  stats: {
    totalClicks: 0,
    randomEventsClaimed: 0,
    totalDistanceWalked: 0
  },
  wbBankedRemainder: 0,
  nextRandomEventAt: now + AUTO_SAVE_INTERVAL_MS,
  spawnedEvent: null,
  settings: {
    soundEnabled: false,
    reducedMotion: false
  },
  ui: {
    activeTab: 'walk',
    shopTab: 'upgrades',
    showShop: false,
    offlineSummary: null,
    toast: null,
    moonTeaseUnlocked: false
  }
});
