import type { MusicTrackId } from './audio';

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
  upgradesPurchased: number;
  followersHired: number;
  itemsUsed: number;
  achievementsClaimed: number;
  cosmeticsEquipped: number;
};

export type WorldId = 'earth' | 'moon_locked';

export type RewardDefinition = {
  walkerBucks?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
  }>;
  cosmetics?: string[];
};

export type AchievementConditionType =
  | 'distance_walked'
  | 'earth_loops'
  | 'upgrade_purchases'
  | 'follower_hires'
  | 'event_claims'
  | 'daily_play'
  | 'clicks'
  | 'total_wb_earned';

export type AchievementCondition = {
  type: AchievementConditionType;
  target: number;
};

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
  reward: RewardDefinition;
  hidden?: boolean;
};

export type AchievementProgress = {
  progress: number;
  unlockedAt: number | null;
  claimedAt: number | null;
};

export type InventoryItemType = 'consumable' | 'collectible' | 'equipment' | 'cosmetic';

export type InventoryEffectType = 'instant_wb' | 'wb_multiplier';

export type InventoryItemDefinition = {
  id: string;
  name: string;
  description: string;
  type: InventoryItemType;
  rarity: 'common' | 'uncommon' | 'rare';
  effect?: {
    type: InventoryEffectType;
    value: number;
  };
  cosmeticId?: string;
};

export type InventoryState = {
  items: Record<string, number>;
  equippedEquipmentItemId: string | null;
  usedConsumables: Record<string, number>;
};

export type CosmeticSlot = 'head' | 'face' | 'shoes';

export type CosmeticEffectType =
  | 'idle_speed_multiplier'
  | 'click_power_multiplier'
  | 'wb_multiplier'
  | 'event_reward_multiplier';

export type CosmeticDefinition = {
  id: string;
  itemId: string;
  name: string;
  description: string;
  slot: CosmeticSlot;
  rarity: 'common' | 'uncommon' | 'rare';
  effect: {
    type: CosmeticEffectType;
    value: number;
  };
};

export type CosmeticState = {
  owned: Record<string, boolean>;
  equippedBySlot: Partial<Record<CosmeticSlot, string>>;
};

export type DailyPlayState = {
  lastPlayedDate: string;
  daysPlayed: number;
};

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
  achievements: Record<string, AchievementProgress>;
  inventory: InventoryState;
  cosmetics: CosmeticState;
  dailyPlay: DailyPlayState;
  activeBoosts: ActiveBoost[];
  stats: GameStats;
  wbBankedRemainder: number;
  nextRandomEventAt: number;
  spawnedEvent: SpawnedRandomEvent | null;
  settings: {
    soundEnabled: boolean;
    selectedMusicTrackId: MusicTrackId;
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
