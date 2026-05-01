import { getTotalFollowerCount } from './followers';
import { getIdleMilesPerSecond } from './formulas';
import type { GameState, WorldId } from './types';

export type SaveSyncSource = 'local' | 'cloud';
export type SaveSyncWinner = SaveSyncSource | 'conflict';

export type SaveCoreProgress = {
  saveVersion: number;
  updatedAt: number;
  currentWorldId: WorldId;
  currentWorldDistance: number;
  totalDistanceWalked: number;
  idleMilesPerSecond: number;
  upgradeLevels: number;
  followerCount: number;
  inventoryCount: number;
  cosmeticsOwned: number;
  milestonesClaimed: number;
  routeState: string;
  score: number;
};

export type SaveSyncDecision = {
  winner: SaveSyncWinner;
  reason:
    | 'no_cloud_save'
    | 'cloud_newer_timestamp'
    | 'cloud_newer_version'
    | 'cloud_has_more_progress'
    | 'cloud_authoritative_tie'
    | 'local_newer_needs_manual_upload';
  local: SaveCoreProgress;
  cloud: SaveCoreProgress | null;
};

const TIMESTAMP_SKEW_MS = 1000;
const SCORE_EPSILON = 0.000001;

const sumRecordValues = (record: Record<string, number>): number =>
  Object.values(record).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);

const countTruthyRecordValues = (record: Record<string, boolean>): number =>
  Object.values(record).filter(Boolean).length;

export const getSaveCoreProgress = (state: GameState, updatedAt = state.lastSavedAt): SaveCoreProgress => {
  const currentWorldDistance = state.worlds[state.currentWorldId]?.distanceMiles ?? state.distanceMiles;
  const totalWorldDistance = Object.values(state.worlds).reduce(
    (sum, world) => sum + Math.max(0, world.distanceMiles) + Math.max(0, world.loopsCompleted) * 1000000,
    0
  );
  const upgradeLevels = sumRecordValues(state.upgrades);
  const followerCount = getTotalFollowerCount(state);
  const inventoryCount = sumRecordValues(state.inventory.items);
  const cosmeticsOwned = countTruthyRecordValues(state.cosmetics.owned);
  const idleMilesPerSecond = getIdleMilesPerSecond(state);
  const routeState = [
    state.currentWorldId,
    state.nextRouteEncounterAt,
    state.spawnedRouteEncounter?.encounterDefId ?? 'none',
    state.spawnedRouteEncounter?.expiresAt ?? 0
  ].join(':');
  const totalDistanceWalked = Math.max(0, state.stats.totalDistanceWalked);
  const score =
    totalDistanceWalked * 1000 +
    totalWorldDistance * 1000 +
    idleMilesPerSecond * 100000 +
    upgradeLevels * 10000 +
    followerCount * 8000 +
    inventoryCount * 1200 +
    cosmeticsOwned * 1200 +
    state.stats.milestonesClaimed * 600 +
    state.stats.achievementsClaimed * 500 +
    state.stats.followersHired * 250 +
    state.stats.upgradesPurchased * 250;

  return {
    saveVersion: state.saveVersion,
    updatedAt,
    currentWorldId: state.currentWorldId,
    currentWorldDistance,
    totalDistanceWalked,
    idleMilesPerSecond,
    upgradeLevels,
    followerCount,
    inventoryCount,
    cosmeticsOwned,
    milestonesClaimed: state.stats.milestonesClaimed,
    routeState,
    score
  };
};

export const compareSaveCoreProgress = (
  local: SaveCoreProgress,
  cloud: SaveCoreProgress
): SaveSyncSource | 'same' => {
  if (local.score > cloud.score + SCORE_EPSILON) return 'local';
  if (cloud.score > local.score + SCORE_EPSILON) return 'cloud';

  const localRouteAhead = local.routeState !== cloud.routeState && local.totalDistanceWalked > cloud.totalDistanceWalked;
  if (localRouteAhead) return 'local';

  const cloudRouteAhead = local.routeState !== cloud.routeState && cloud.totalDistanceWalked > local.totalDistanceWalked;
  if (cloudRouteAhead) return 'cloud';

  return 'same';
};

export const resolveSaveSyncDecision = (
  localState: GameState,
  cloudState: GameState | null,
  options: {
    localUpdatedAt?: number;
    cloudUpdatedAt?: number;
    cloudSaveVersion?: number;
  } = {}
): SaveSyncDecision => {
  const local = getSaveCoreProgress(localState, options.localUpdatedAt ?? localState.lastSavedAt);
  const cloud = cloudState
    ? getSaveCoreProgress(cloudState, options.cloudUpdatedAt ?? cloudState.lastSavedAt)
    : null;

  if (!cloud) {
    return { winner: 'local', reason: 'no_cloud_save', local, cloud: null };
  }

  const cloudSaveVersion = options.cloudSaveVersion ?? cloud.saveVersion;
  const coreWinner = compareSaveCoreProgress(local, cloud);
  const cloudNewer = cloud.updatedAt > local.updatedAt + TIMESTAMP_SKEW_MS;
  const localNewer = local.updatedAt > cloud.updatedAt + TIMESTAMP_SKEW_MS;

  if (cloudNewer) {
    return { winner: 'cloud', reason: 'cloud_newer_timestamp', local, cloud };
  }

  if (localNewer && coreWinner === 'local') {
    return { winner: 'conflict', reason: 'local_newer_needs_manual_upload', local, cloud };
  }

  if (localNewer) {
    return { winner: 'cloud', reason: 'cloud_authoritative_tie', local, cloud };
  }

  if (cloudSaveVersion > local.saveVersion) {
    return { winner: 'cloud', reason: 'cloud_newer_version', local, cloud };
  }

  if (coreWinner === 'cloud') {
    return { winner: 'cloud', reason: 'cloud_has_more_progress', local, cloud };
  }

  if (coreWinner === 'local') {
    return { winner: 'conflict', reason: 'local_newer_needs_manual_upload', local, cloud };
  }

  return { winner: 'cloud', reason: 'cloud_authoritative_tie', local, cloud };
};

export const createSaveSyncFingerprint = (state: GameState): string =>
  JSON.stringify({
    saveVersion: state.saveVersion,
    distanceMiles: state.distanceMiles,
    currentWorldId: state.currentWorldId,
    worlds: state.worlds,
    prestige: state.prestige,
    upgrades: state.upgrades,
    followers: state.followers,
    followerMorale: state.followerMorale,
    achievements: state.achievements,
    inventory: state.inventory,
    cosmetics: state.cosmetics,
    profile: state.profile,
    milestones: state.milestones,
    quests: state.quests,
    dailyPlay: state.dailyPlay,
    walkerBucksBridge: {
      balance: state.walkerBucksBridge.balance,
      purchases: state.walkerBucksBridge.purchases,
      rewardGrants: state.walkerBucksBridge.rewardGrants,
      pendingGrantAmount: state.walkerBucksBridge.pendingGrantAmount,
      pendingGrantSequence: state.walkerBucksBridge.pendingGrantSequence,
      marketplacePurchases: state.walkerBucksBridge.marketplacePurchases,
      spends: state.walkerBucksBridge.spends,
      inventory: state.walkerBucksBridge.inventory
    },
    activeBoosts: state.activeBoosts,
    activePlay: state.activePlay,
    stats: state.stats,
    wbBankedRemainder: state.wbBankedRemainder,
    nextRandomEventAt: state.nextRandomEventAt,
    spawnedEvent: state.spawnedEvent,
    nextRouteEncounterAt: state.nextRouteEncounterAt,
    spawnedRouteEncounter: state.spawnedRouteEncounter,
    settings: state.settings,
    ui: {
      shopTab: state.ui.shopTab,
      moonTeaseUnlocked: state.ui.moonTeaseUnlocked,
      offlineSummary: state.ui.offlineSummary,
      recentRewards: state.ui.recentRewards
    }
  });
