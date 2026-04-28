import {
  AUTO_SAVE_INTERVAL_MS,
  SAVE_VERSION,
  STARTING_CLICK_MILES,
  STARTING_IDLE_MILES_PER_SECOND,
  STARTING_WALKERBUCKS
} from './constants';
import { createInitialAchievementState, getLocalDateKey } from './achievements';
import { DEFAULT_MUSIC_TRACK_ID as DEFAULT_TRACK_ID } from './audio';
import { createInitialQuestState } from './quests';
import type { GameState } from './types';
import { createInitialPrestigeState, createInitialWorldProgress } from './world';

export const createInitialGameState = (now = Date.now()): GameState => ({
  saveVersion: SAVE_VERSION,
  distanceMiles: 0,
  walkerBucks: STARTING_WALKERBUCKS,
  totalWalkerBucksEarned: 0,
  baseIdleMilesPerSecond: STARTING_IDLE_MILES_PER_SECOND,
  baseClickMiles: STARTING_CLICK_MILES,
  currentWorldId: 'earth',
  worlds: createInitialWorldProgress(now),
  prestige: createInitialPrestigeState(),
  earthLoopsCompleted: 0,
  lastSavedAt: now,
  upgrades: {},
  followers: {},
  achievements: createInitialAchievementState(),
  inventory: {
    items: {},
    equippedEquipmentItemId: null,
    usedConsumables: {}
  },
  cosmetics: {
    owned: {},
    equippedBySlot: {}
  },
  quests: createInitialQuestState(now),
  dailyPlay: {
    lastPlayedDate: getLocalDateKey(now),
    daysPlayed: 1
  },
  account: {
    provider: 'guest',
    userId: null,
    email: null,
    cloudSaveUpdatedAt: null,
    lastSyncedAt: null,
    status: 'guest',
    lastSyncError: null
  },
  walkerBucksBridge: {
    status: 'unavailable',
    accountId: null,
    balance: null,
    rewardGrants: {},
    lastCheckedAt: null,
    lastError: null
  },
  activeBoosts: [],
  stats: {
    totalClicks: 0,
    randomEventsClaimed: 0,
    totalDistanceWalked: 0,
    upgradesPurchased: 0,
    followersHired: 0,
    itemsUsed: 0,
    achievementsClaimed: 0,
    cosmeticsEquipped: 0
  },
  wbBankedRemainder: 0,
  nextRandomEventAt: now + AUTO_SAVE_INTERVAL_MS,
  spawnedEvent: null,
  settings: {
    soundEnabled: false,
    selectedMusicTrackId: DEFAULT_TRACK_ID,
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
