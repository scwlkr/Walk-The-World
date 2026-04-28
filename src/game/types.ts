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
  biome: 'plains' | 'desert' | 'city' | 'ocean' | 'mountain' | 'snow' | 'lunar' | 'space';
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

export type WorldId = 'earth' | 'moon' | 'mars' | 'solar_system';

export type WorldUnlockRequirement = {
  earthPrestiges?: number;
  moonLoopsCompleted?: number;
};

export type WorldDefinition = {
  id: WorldId;
  name: string;
  shortName: string;
  description: string;
  loopDistanceMiles: number;
  defaultUnlocked: boolean;
  status: 'playable' | 'future';
  sceneId: string;
  unlockRequirement?: WorldUnlockRequirement;
  lockedSummary: string;
};

export type WorldProgressState = {
  distanceMiles: number;
  loopsCompleted: number;
  unlockedAt: number | null;
};

export type PrestigeState = {
  earthPrestigeCount: number;
  permanentSpeedBonus: number;
  permanentWbBonus: number;
  moonAccelerationBonus: number;
  lastPrestigedAt: number | null;
};

export type RewardDefinition = {
  walkerBucks?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
  }>;
  cosmetics?: string[];
};

export type QuestProgressType =
  | 'distance_walked'
  | 'clicks'
  | 'upgrade_purchases'
  | 'follower_hires'
  | 'event_claims'
  | 'achievement_claims'
  | 'world_progress';

export type QuestDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'seasonal';
  progress: {
    type: QuestProgressType;
    target: number;
  };
  reward: RewardDefinition;
  localOnly: boolean;
  seasonalEventId?: string;
};

export type QuestProgress = {
  progress: number;
  completedAt: number | null;
  claimedAt: number | null;
};

export type QuestBaseline = {
  totalDistanceWalked: number;
  totalClicks: number;
  upgradesPurchased: number;
  followersHired: number;
  randomEventsClaimed: number;
  achievementsClaimed: number;
  totalWorldDistance: number;
};

export type QuestState = {
  activeDate: string;
  questIds: string[];
  progress: Record<string, QuestProgress>;
  baseline: QuestBaseline;
  lastGeneratedAt: number;
  seasonalEventId: string | null;
};

export type SeasonalEventVisualTreatment = {
  bannerLabel: string;
  accentColor: string;
  overlayColor: string;
  particleColor: string;
};

export type SeasonalEventDefinition = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  startsOn: {
    month: number;
    day: number;
  };
  endsOn: {
    month: number;
    day: number;
  };
  visualTreatment: SeasonalEventVisualTreatment;
  reward: RewardDefinition;
  localOnly: boolean;
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
  worlds: Record<WorldId, WorldProgressState>;
  prestige: PrestigeState;
  earthLoopsCompleted: number;
  lastSavedAt: number;
  upgrades: Record<string, number>;
  followers: Record<string, number>;
  achievements: Record<string, AchievementProgress>;
  inventory: InventoryState;
  cosmetics: CosmeticState;
  quests: QuestState;
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
    activeTab: 'walk' | 'shop' | 'quests' | 'stats' | 'settings';
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
