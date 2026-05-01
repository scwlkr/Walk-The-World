import { EARTH_CIRCUMFERENCE_MILES, SAVE_KEY, SAVE_VERSION } from './constants';
import { createInitialActivePlayState } from './activePlay';
import { evaluateAchievements, markDailyPlay } from './achievements';
import { createInitialGameState } from './initialState';
import { createInitialMilestoneState, syncMilestones } from './milestones';
import { createQuestStateForGameState, mergeQuestState, syncDailyQuests } from './quests';
import type { GameState, PrestigeState, WorldId, WorldProgressState } from './types';
import {
  JOURNEY_UPGRADES,
  applyJourneyUpgradeBonuses,
  canEnterWorld,
  createInitialWorldProgress,
  normalizeWorldId,
  WORLD_IDS
} from './world';

type SavePayload = GameState;

const canUseLocalStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadGameState = (): GameState => {
  if (!canUseLocalStorage()) {
    return prepareLoadedState(createInitialGameState());
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return prepareLoadedState(createInitialGameState());

    const parsed = JSON.parse(raw) as Partial<SavePayload>;
    if (parsed.saveVersion !== SAVE_VERSION) {
      return prepareLoadedState(migrateSave(parsed));
    }

    return prepareLoadedState(mergeGameState(parsed));
  } catch {
    return prepareLoadedState(createInitialGameState());
  }
};

const prepareLoadedState = (state: GameState): GameState =>
  syncMilestones(evaluateAchievements(syncDailyQuests(markDailyPlay(state))));

const mergeGameState = (rawSave: Partial<SavePayload>): GameState => {
  const base = createInitialGameState();
  const worlds = mergeWorldProgress(base, rawSave);
  const prestige = mergePrestigeState(base.prestige, rawSave.prestige);
  if (prestige.earthPrestigeCount > 0 && !worlds.moon.unlockedAt) {
    worlds.moon = {
      ...worlds.moon,
      unlockedAt: prestige.lastPrestigedAt ?? Date.now()
    };
  }
  const requestedWorldId = normalizeWorldId(rawSave.currentWorldId);
  const currentWorldId = canEnterWorld({ ...base, ...rawSave, worlds, prestige, currentWorldId: requestedWorldId } as GameState, requestedWorldId)
    ? requestedWorldId
    : 'earth';

  const merged = {
    ...base,
    ...rawSave,
    currentWorldId,
    worlds,
    prestige,
    distanceMiles: worlds[currentWorldId].distanceMiles,
    earthLoopsCompleted: Math.max(rawSave.earthLoopsCompleted ?? 0, worlds.earth.loopsCompleted),
    settings: {
      ...base.settings,
      ...rawSave.settings
    },
    stats: {
      ...base.stats,
      ...rawSave.stats
    },
    followerMorale: {
      ...base.followerMorale,
      ...rawSave.followerMorale,
      value: Math.min(100, Math.max(0, rawSave.followerMorale?.value ?? base.followerMorale.value))
    },
    achievements: {
      ...base.achievements,
      ...rawSave.achievements
    },
    inventory: {
      ...base.inventory,
      ...rawSave.inventory,
      items: {
        ...base.inventory.items,
        ...rawSave.inventory?.items
      },
      usedConsumables: {
        ...base.inventory.usedConsumables,
        ...rawSave.inventory?.usedConsumables
      }
    },
    cosmetics: {
      ...base.cosmetics,
      ...rawSave.cosmetics,
      owned: {
        ...base.cosmetics.owned,
        ...rawSave.cosmetics?.owned
      },
      equippedBySlot: {
        ...base.cosmetics.equippedBySlot,
        ...rawSave.cosmetics?.equippedBySlot
      }
    },
    profile: {
      ...base.profile,
      ...rawSave.profile,
      unlockedTitles: {
        ...base.profile.unlockedTitles,
        ...rawSave.profile?.unlockedTitles
      }
    },
    milestones: {
      progress: {
        ...createInitialMilestoneState().progress,
        ...rawSave.milestones?.progress
      }
    },
    quests: base.quests,
    dailyPlay: {
      ...base.dailyPlay,
      ...rawSave.dailyPlay
    },
    account: {
      ...base.account,
      ...rawSave.account
    },
    walkerBucksBridge: {
      ...base.walkerBucksBridge,
      ...rawSave.walkerBucksBridge,
      balance: rawSave.walkerBucksBridge?.balance ?? base.walkerBucksBridge.balance,
      purchases: {
        ...base.walkerBucksBridge.purchases,
        ...rawSave.walkerBucksBridge?.purchases
      },
      rewardGrants: {
        ...base.walkerBucksBridge.rewardGrants,
        ...rawSave.walkerBucksBridge?.rewardGrants
      },
      pendingGrantAmount: Math.max(0, rawSave.walkerBucksBridge?.pendingGrantAmount ?? base.walkerBucksBridge.pendingGrantAmount),
      pendingGrantSequence: Math.max(0, rawSave.walkerBucksBridge?.pendingGrantSequence ?? base.walkerBucksBridge.pendingGrantSequence),
      leaderboard: rawSave.walkerBucksBridge?.leaderboard ?? base.walkerBucksBridge.leaderboard,
      marketplaceOffers: rawSave.walkerBucksBridge?.marketplaceOffers ?? base.walkerBucksBridge.marketplaceOffers,
      marketplacePurchases: {
        ...base.walkerBucksBridge.marketplacePurchases,
        ...rawSave.walkerBucksBridge?.marketplacePurchases
      },
      spends: {
        ...base.walkerBucksBridge.spends,
        ...rawSave.walkerBucksBridge?.spends
      },
      inventory: rawSave.walkerBucksBridge?.inventory ?? base.walkerBucksBridge.inventory
    },
    activePlay: {
      ...createInitialActivePlayState(),
      ...rawSave.activePlay
    },
    ui: {
      ...base.ui,
      ...rawSave.ui,
      recentRewards: rawSave.ui?.recentRewards ?? base.ui.recentRewards
    },
    nextRouteEncounterAt: rawSave.nextRouteEncounterAt ?? base.nextRouteEncounterAt,
    spawnedRouteEncounter: rawSave.spawnedRouteEncounter ?? base.spawnedRouteEncounter,
    saveVersion: SAVE_VERSION
  } as GameState;

  return {
    ...merged,
    quests: rawSave.quests
      ? mergeQuestState(base.quests, rawSave.quests)
      : createQuestStateForGameState(merged)
  };
};

const mergeWorldProgress = (
  base: GameState,
  rawSave: Partial<SavePayload>
): Record<WorldId, WorldProgressState> => {
  const now = Date.now();
  const initial = createInitialWorldProgress(now);
  const rawWorlds = (rawSave.worlds ?? {}) as Partial<Record<WorldId, Partial<WorldProgressState>>>;
  const legacyEarthDistance = typeof rawSave.distanceMiles === 'number' ? rawSave.distanceMiles : base.distanceMiles;
  const legacyEarthLoops = Math.max(0, rawSave.earthLoopsCompleted ?? Math.floor(legacyEarthDistance / EARTH_CIRCUMFERENCE_MILES));

  return WORLD_IDS.reduce<Record<WorldId, WorldProgressState>>((worlds, worldId) => {
    const rawWorld = rawWorlds[worldId];
    const fallback = initial[worldId];
    const distanceMiles =
      worldId === 'earth'
        ? rawWorld?.distanceMiles ?? legacyEarthDistance
        : rawWorld?.distanceMiles ?? fallback.distanceMiles;
    const loopsCompleted =
      worldId === 'earth'
        ? rawWorld?.loopsCompleted ?? legacyEarthLoops
        : rawWorld?.loopsCompleted ?? fallback.loopsCompleted;

    worlds[worldId] = {
      distanceMiles: Math.max(0, distanceMiles),
      loopsCompleted: Math.max(0, loopsCompleted),
      unlockedAt: rawWorld?.unlockedAt ?? fallback.unlockedAt
    };
    return worlds;
  }, initial);
};

const mergePrestigeState = (base: PrestigeState, rawPrestige?: Partial<PrestigeState>): PrestigeState => {
  const earthPrestigeCount = Math.max(0, rawPrestige?.earthPrestigeCount ?? base.earthPrestigeCount);

  const upgrades = { ...(rawPrestige?.upgrades ?? base.upgrades) };
  if (!rawPrestige?.upgrades) {
    const legacyUpgradeIds: Record<string, keyof PrestigeState> = {
      better_shoes: 'permanentSpeedBonus',
      ledger_sense: 'permanentWbBonus',
      moon_map: 'moonAccelerationBonus'
    };

    for (const [upgradeId, bonusKey] of Object.entries(legacyUpgradeIds)) {
      const upgrade = JOURNEY_UPGRADES.find((entry) => entry.id === upgradeId);
      const bonus = Number(rawPrestige?.[bonusKey] ?? 0);
      if (upgrade && bonus > 0) {
        upgrades[upgradeId] = Math.min(upgrade.maxLevel, Math.max(1, Math.round(bonus / upgrade.effectValue)));
      }
    }
  }

  const journeyTokens = Math.max(0, rawPrestige?.journeyTokens ?? base.journeyTokens);
  return applyJourneyUpgradeBonuses({
    earthPrestigeCount,
    journeyTokens,
    totalJourneyTokensEarned: Math.max(
      0,
      rawPrestige?.totalJourneyTokensEarned ?? base.totalJourneyTokensEarned,
      journeyTokens,
      earthPrestigeCount
    ),
    upgrades,
    permanentSpeedBonus: 0,
    permanentWbBonus: 0,
    followerStabilityBonus: 0,
    offlineCapBonus: 0,
    moonAccelerationBonus: 0,
    lastPrestigedAt: rawPrestige?.lastPrestigedAt ?? base.lastPrestigedAt
  });
};

const migrateSave = (rawSave: Partial<SavePayload>): GameState => mergeGameState(rawSave);

export const saveGameState = (state: GameState): void => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...state,
        lastSavedAt: Date.now()
      })
    );
  } catch {
    // ignore write failures
  }
};

export const resetGameState = (): GameState => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(SAVE_KEY);
  }
  return prepareLoadedState(createInitialGameState());
};

export const exportSave = (state: GameState): string => JSON.stringify(state, null, 2);

export const importSave = (raw: string): GameState => {
  const parsed = JSON.parse(raw) as Partial<GameState>;
  return prepareLoadedState(migrateSave(parsed));
};
