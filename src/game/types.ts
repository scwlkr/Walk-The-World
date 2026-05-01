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
  recruitChancePerMinute: number;
  leaveChancePerMinute: number;
  moraleSensitivity: number;
  rarity: 'common' | 'uncommon' | 'rare';
  personalityFlavor: string;
  regionIds?: string[];
  unlockRequirement?: {
    distanceMiles?: number;
    earthLoopsCompleted?: number;
    regionIds?: string[];
  };
};

export type FollowerMoraleState = {
  value: number;
  recentStory: string | null;
  lastStoryAt: number | null;
};

export type RandomEventEffectType =
  | 'instant_wb'
  | 'instant_distance'
  | 'temporary_speed_multiplier'
  | 'temporary_click_multiplier'
  | 'temporary_follower_multiplier'
  | 'temporary_follower_stability'
  | 'temporary_recruit_multiplier'
  | 'item_drop'
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
  itemId?: string;
  quantity?: number;
  regionIds?: string[];
  weatherTag?: 'perfect' | 'rain' | 'heat' | 'crowd' | 'weekend';
};

export type ActiveBoost = {
  id: string;
  sourceEventId: string;
  effectType:
    | 'speed_multiplier'
    | 'click_multiplier'
    | 'follower_multiplier'
    | 'follower_stability_multiplier'
    | 'follower_recruit_multiplier'
    | 'event_reward_multiplier'
    | 'drop_rate_multiplier';
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

export type RouteEncounterChoiceEffectType = 'walkerbucks_grant' | 'distance' | 'item_drop' | 'temporary_boost';

export type RouteEncounterChoiceEffect = {
  type: RouteEncounterChoiceEffectType;
  value?: number;
  itemId?: string;
  quantity?: number;
  boostType?: ActiveBoost['effectType'];
  multiplier?: number;
  durationMs?: number;
};

export type RouteEncounterChoice = {
  id: string;
  label: string;
  description: string;
  effects: RouteEncounterChoiceEffect[];
};

export type RouteEncounterDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  weight: number;
  regionIds?: string[];
  choices: RouteEncounterChoice[];
};

export type SpawnedRouteEncounter = {
  id: string;
  encounterDefId: string;
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
  routeEncountersClaimed: number;
  totalDistanceWalked: number;
  upgradesPurchased: number;
  followersHired: number;
  itemsUsed: number;
  achievementsClaimed: number;
  cosmeticsEquipped: number;
  milestonesClaimed: number;
  perfectSteps: number;
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
  titleIds?: string[];
};

export type QuestProgressType =
  | 'distance_walked'
  | 'clicks'
  | 'upgrade_purchases'
  | 'follower_hires'
  | 'event_claims'
  | 'route_encounters'
  | 'achievement_claims'
  | 'world_progress'
  | 'perfect_steps';

export type QuestDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'seasonal';
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
  routeEncountersClaimed: number;
  achievementsClaimed: number;
  totalWorldDistance: number;
  perfectSteps: number;
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
  | 'total_wb_earned'
  | 'items_used'
  | 'cosmetics_equipped'
  | 'route_encounters'
  | 'regions_reached'
  | 'perfect_steps';

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

export type InventoryEffectType =
  | 'none'
  | 'instant_wb'
  | 'currency_grant'
  | 'wb_multiplier'
  | 'tap_multiplier_temp'
  | 'event_reward_multiplier'
  | 'drop_rate_boost_temp'
  | 'souvenir_collectible'
  | 'cosmetic_equip'
  | 'title_unlock'
  | 'travel_theme_unlock'
  | 'daily_streak_freeze'
  | 'step_reward_bonus_temp';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type InventoryItemDefinition = {
  id: string;
  slug?: string;
  name: string;
  image?: string;
  description: string;
  type: InventoryItemType;
  category?: string;
  rarity: ItemRarity;
  flavorText?: string;
  assetPath?: string;
  asset_path?: string;
  assetFilename?: string;
  asset_filename?: string;
  icon?: string;
  emoji?: string;
  effect?: {
    type: InventoryEffectType;
    value: number;
    durationSeconds?: number | null;
    cooldownSeconds?: number | null;
  };
  cosmeticId?: string;
  titleId?: string;
  implementationStatus?: 'existing' | 'planned' | string;
};

export type InventoryState = {
  items: Record<string, number>;
  equippedEquipmentItemId: string | null;
  usedConsumables: Record<string, number>;
};

export type CosmeticSlot = 'head' | 'face' | 'shoes' | 'body' | 'flair';

export type CosmeticEffectType =
  | 'style_only'
  | 'idle_speed_multiplier'
  | 'click_power_multiplier'
  | 'wb_multiplier'
  | 'event_reward_multiplier'
  | 'follower_morale_bonus'
  | 'follower_leave_chance_reduction';

export type CosmeticDefinition = {
  id: string;
  itemId: string;
  slug?: string;
  name: string;
  image?: string;
  description: string;
  slot: CosmeticSlot;
  rarity: ItemRarity;
  assetPath?: string;
  asset_path?: string;
  assetFilename?: string;
  asset_filename?: string;
  icon?: string;
  emoji?: string;
  effect: {
    type: CosmeticEffectType;
    value: number;
  };
};

export type CosmeticState = {
  owned: Record<string, boolean>;
  equippedBySlot: Partial<Record<CosmeticSlot, string>>;
};

export type ProfileState = {
  unlockedTitles: Record<string, boolean>;
  activeTitleId: string | null;
};

export type MilestoneConditionType =
  | 'clicks'
  | 'distance_walked'
  | 'upgrades_purchased'
  | 'followers_hired'
  | 'items_owned'
  | 'random_events_claimed'
  | 'route_encounters_claimed'
  | 'distinct_items_owned';

export type MilestoneDefinition = {
  id: string;
  name: string;
  description: string;
  condition: {
    type: MilestoneConditionType;
    target: number;
  };
  reward: RewardDefinition;
  actionHint: string;
};

export type MilestoneProgress = {
  progress: number;
  completedAt: number | null;
  claimedAt: number | null;
};

export type MilestoneState = {
  progress: Record<string, MilestoneProgress>;
};

export type DailyPlayState = {
  lastPlayedDate: string;
  daysPlayed: number;
};

export type AccountSyncState = {
  provider: 'guest' | 'supabase';
  userId: string | null;
  email: string | null;
  cloudSaveUpdatedAt: number | null;
  lastSyncedAt: number | null;
  status: 'guest' | 'signed_in' | 'synced' | 'conflict' | 'error' | 'disabled';
  lastSyncError: string | null;
};

export type WalkerBucksBridgeStatus = 'unavailable' | 'guest' | 'ready' | 'checking' | 'error';

export type WalkerBucksBalanceSnapshot = {
  assetCode: 'WB';
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  updatedAt: number;
};

export type ServerRewardSourceType =
  | 'achievement'
  | 'quest'
  | 'milestone'
  | 'random_event'
  | 'route_encounter'
  | 'walking'
  | 'inventory'
  | 'legacy_migration';

export type ServerSpendSourceType = 'upgrade' | 'follower' | 'catalog_offer';

export type WtwPurchaseStatus =
  | 'optimistic_applied'
  | 'settling'
  | 'settled'
  | 'settlement_failed'
  | 'rolled_back';

export type WtwPurchase = {
  purchaseId: string;
  idempotencyKey: string;
  accountId: string;
  sourceType: ServerSpendSourceType;
  sourceId: string;
  offerId: string;
  itemDefId: string;
  itemName: string;
  price: number;
  quantity: number;
  dpsDelta: number;
  status: WtwPurchaseStatus;
  walkerBucksTransactionId?: string;
  createdAt: number;
  updatedAt: number;
  errorCode?: string;
  errorMessage?: string;
};

export type WtwWalletState = {
  syncedWbBalance: number;
  pendingSpend: number;
  displayedWbBalance: number;
  spendableWb: number;
  lastSyncedAt: number | null;
};

export type WalkerBucksRewardGrantStatus = 'pending' | 'granted' | 'failed';

export type WalkerBucksRewardGrant = {
  id: string;
  sourceType: ServerRewardSourceType;
  sourceId: string;
  label: string;
  amount: number;
  idempotencyKey: string;
  reasonCode: string;
  status: WalkerBucksRewardGrantStatus;
  attempts: number;
  transactionId: string | null;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
  settledAt: number | null;
};

export type WalkerBucksSpendStatus = 'pending' | 'spent' | 'failed';

export type WalkerBucksSpend = {
  id: string;
  sourceType: ServerSpendSourceType;
  sourceId: string;
  label: string;
  amount: number;
  idempotencyKey: string;
  status: WalkerBucksSpendStatus;
  attempts: number;
  transactionId: string | null;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
  settledAt: number | null;
};

export type WalkerBucksLeaderboardEntry = {
  rank: number;
  accountId: string;
  balance: number;
  isCurrentAccount: boolean;
};

export type WalkerBucksLeaderboardSnapshot = {
  category: 'walkerbucks_balance';
  accountId: string;
  entries: WalkerBucksLeaderboardEntry[];
  updatedAt: number;
};

export type WalkerBucksMarketplaceOffer = {
  id: number;
  shopId: number;
  itemDefinitionId: number;
  slug?: string;
  name: string;
  image?: string;
  description: string;
  priceWb: number;
  itemId?: string;
  item_id?: string;
  assetPath?: string;
  asset_path?: string;
  assetFilename?: string;
  asset_filename?: string;
  icon?: string;
  emoji?: string;
};

export type WalkerBucksInventoryItem = {
  itemInstanceId: string;
  itemDefinitionId: number;
  status: string;
};

export type SharedInventoryEntitlement = {
  itemInstanceId: string;
  itemDefinitionId: number;
  status: string;
  itemId: string | null;
  slug?: string | null;
  image?: string | null;
  name: string;
  description: string;
  assetPath?: string | null;
  assetFilename?: string | null;
  knownLocalItem: boolean;
};

export type WalkerBucksMarketplacePurchaseStatus = 'pending' | 'purchased' | 'failed';

export type WalkerBucksMarketplacePurchase = {
  id: string;
  shopOfferId: number;
  itemDefinitionId: number | null;
  label: string;
  priceWb: number | null;
  idempotencyKey: string;
  status: WalkerBucksMarketplacePurchaseStatus;
  attempts: number;
  itemInstanceId: string | null;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
  settledAt: number | null;
};

export type WalkerBucksBridgeState = {
  status: WalkerBucksBridgeStatus;
  accountId: string | null;
  balance: WalkerBucksBalanceSnapshot | null;
  purchases: Record<string, WtwPurchase>;
  rewardGrants: Record<string, WalkerBucksRewardGrant>;
  pendingGrantAmount: number;
  pendingGrantSequence: number;
  leaderboard: WalkerBucksLeaderboardSnapshot | null;
  marketplaceOffers: WalkerBucksMarketplaceOffer[];
  marketplacePurchases: Record<string, WalkerBucksMarketplacePurchase>;
  spends: Record<string, WalkerBucksSpend>;
  inventory: WalkerBucksInventoryItem[];
  lastCheckedAt: number | null;
  lastError: string | null;
};

export type ActivePlayState = {
  tapCombo: number;
  lastTapAt: number | null;
  bestTapCombo: number;
  perfectSteps: number;
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
  followerMorale: FollowerMoraleState;
  achievements: Record<string, AchievementProgress>;
  inventory: InventoryState;
  cosmetics: CosmeticState;
  profile: ProfileState;
  milestones: MilestoneState;
  quests: QuestState;
  dailyPlay: DailyPlayState;
  account: AccountSyncState;
  walkerBucksBridge: WalkerBucksBridgeState;
  activeBoosts: ActiveBoost[];
  activePlay: ActivePlayState;
  stats: GameStats;
  wbBankedRemainder: number;
  nextRandomEventAt: number;
  spawnedEvent: SpawnedRandomEvent | null;
  nextRouteEncounterAt: number;
  spawnedRouteEncounter: SpawnedRouteEncounter | null;
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
    recentRewards: Array<{
      id: string;
      label: string;
      createdAt: number;
    }>;
    moonTeaseUnlocked: boolean;
  };
};
