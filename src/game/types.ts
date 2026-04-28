export type UpgradeCategory = 'speed' | 'click' | 'earnings' | 'offline' | 'event';

export type UpgradeEffectType =
  | 'idle_speed_flat'
  | 'idle_speed_multiplier'
  | 'click_power_flat'
  | 'click_power_multiplier'
  | 'wb_multiplier'
  | 'offline_cap_multiplier'
  | 'event_reward_multiplier';

export type UnlockRequirement = {
  distanceMiles?: number;
  earthLoopsCompleted?: number;
  upgradeId?: string;
  upgradeLevel?: number;
};

export type Upgrade = {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectType: UpgradeEffectType;
  effectValue: number;
  unlockRequirement?: UnlockRequirement;
};

export type Follower = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxCount: number;
  milesPerSecond: number;
  unlockRequirement?: {
    distanceMiles?: number;
    earthLoopsCompleted?: number;
  };
};

export type RandomEventEffectType =
  | 'instant_wb'
  | 'instant_distance'
  | 'temporary_speed_multiplier'
  | 'temporary_click_multiplier'
  | 'temporary_follower_multiplier'
  | 'mystery'
  | 'fake';

export type RandomEventDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  durationMs: number;
  weight: number;
  effectType: RandomEventEffectType;
  value?: number;
};

export type ActiveBoost = {
  id: string;
  sourceEventId: string;
  effectType: 'speed_multiplier' | 'click_multiplier' | 'follower_multiplier';
  multiplier: number;
  expiresAt: number;
};

export type SpawnedRandomEvent = {
  id: string;
  eventDefId: string;
  spawnedAt: number;
  expiresAt: number;
  label: string;
};

export type Landmark = {
  name: string;
  distanceMiles: number;
  biome: 'plains' | 'desert' | 'city' | 'ocean' | 'mountain' | 'snow';
  sceneId: string;
};

export type GameStats = {
  totalClicks: number;
  randomEventsClaimed: number;
  totalDistanceWalked: number;
};

export type WorldId = 'earth' | 'moon_locked';

export type GameState = {
  saveVersion: number;
  distanceMiles: number;
  walkerBucks: number;
  totalWalkerBucksEarned: number;
  baseIdleMilesPerSecond: number;
  baseClickMiles: number;
  currentWorldId: WorldId;
  earthLoopsCompleted: number;
  lastSavedAt: number;
  upgrades: Record<string, number>;
  followers: Record<string, number>;
  activeBoosts: ActiveBoost[];
  stats: GameStats;
  wbBankedRemainder: number;
  nextRandomEventAt: number;
  spawnedEvent: SpawnedRandomEvent | null;
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
  };
  ui: {
    activeTab: 'walk' | 'shop' | 'stats' | 'settings';
    shopTab: 'upgrades' | 'followers' | 'items' | 'cosmetics';
    showShop: boolean;
    offlineSummary: {
      distance: number;
      wb: number;
    } | null;
    toast: string | null;
    moonTeaseUnlocked: boolean;
  };
};
