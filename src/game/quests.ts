import { getLocalDateKey } from './achievements';
import { getSpendableWalkerBucks } from './economy';
import { grantRewardToState } from './inventory';
import {
  getActiveSeasonalEvent,
  getSeasonalQuestDefinitions
} from './seasonalEvents';
import type {
  GameState,
  QuestBaseline,
  QuestDefinition,
  QuestProgress,
  QuestProgressType,
  QuestState,
  RewardDefinition
} from './types';
import { WORLD_IDS } from './world';

const QUEST_SET_SIZE = 4;

const EMPTY_BASELINE: QuestBaseline = {
  totalDistanceWalked: 0,
  totalClicks: 0,
  upgradesPurchased: 0,
  followersHired: 0,
  randomEventsClaimed: 0,
  routeEncountersClaimed: 0,
  achievementsClaimed: 0,
  totalWorldDistance: 0,
  perfectSteps: 0
};

export const DAILY_QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'daily_warmup_walk',
    name: 'Warm-Up Walk',
    description: 'Walk a short local stretch.',
    category: 'daily',
    progress: { type: 'distance_walked', target: 0.03 },
    reward: {
      walkerBucks: 20,
      items: [{ itemId: 'trail_mix', quantity: 1 }]
    },
    localOnly: false
  },
  {
    id: 'daily_tap_pace',
    name: 'Tap Pace',
    description: 'Tap the route to push the walker forward.',
    category: 'daily',
    progress: { type: 'clicks', target: 12 },
    reward: { walkerBucks: 18 },
    localOnly: false
  },
  {
    id: 'daily_shop_stop',
    name: 'Shop Stop',
    description: 'Buy one upgrade with WalkerBucks.',
    category: 'daily',
    progress: { type: 'upgrade_purchases', target: 1 },
    reward: { walkerBucks: 35 },
    localOnly: false
  },
  {
    id: 'daily_crew_check',
    name: 'Crew Check',
    description: 'Hire one follower for the trail.',
    category: 'daily',
    progress: { type: 'follower_hires', target: 1 },
    reward: { walkerBucks: 45 },
    localOnly: false
  },
  {
    id: 'daily_event_chaser',
    name: 'Trail Event Chaser',
    description: 'Claim one random trail event.',
    category: 'daily',
    progress: { type: 'event_claims', target: 1 },
    reward: { walkerBucks: 40 },
    localOnly: false
  },
  {
    id: 'daily_badge_claim',
    name: 'Badge Claim',
    description: 'Claim one unlocked achievement reward.',
    category: 'daily',
    progress: { type: 'achievement_claims', target: 1 },
    reward: { walkerBucks: 30 },
    localOnly: false
  },
  {
    id: 'daily_route_push',
    name: 'Route Push',
    description: 'Make progress on any unlocked world route.',
    category: 'daily',
    progress: { type: 'world_progress', target: 0.05 },
    reward: { walkerBucks: 25 },
    localOnly: false
  },
  {
    id: 'daily_perfect_steps',
    name: 'Perfect Step Set',
    description: 'Keep tapping in rhythm and land a perfect step combo.',
    category: 'daily',
    progress: { type: 'perfect_steps', target: 1 },
    reward: {
      walkerBucks: 45,
      items: [{ itemId: 'aura_battery', quantity: 1 }]
    },
    localOnly: false
  },
  {
    id: 'weekly_double_step_route',
    name: 'Double Step Route',
    description: 'A weekly route challenge for active walkers.',
    category: 'weekly',
    progress: { type: 'route_encounters', target: 2 },
    reward: {
      walkerBucks: 90,
      items: [{ itemId: 'detour_token', quantity: 1 }]
    },
    localOnly: false
  }
];

const FIXED_DAILY_QUEST_IDS = ['daily_warmup_walk', 'daily_tap_pace'];
const FIXED_WEEKLY_QUEST_IDS = ['weekly_double_step_route'];

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const createEmptyProgress = (): QuestProgress => ({
  progress: 0,
  completedAt: null,
  claimedAt: null
});

const getTotalWorldDistance = (state: GameState): number =>
  WORLD_IDS.reduce((sum, worldId) => sum + (state.worlds[worldId]?.distanceMiles ?? 0), 0);

const createQuestBaseline = (state?: GameState): QuestBaseline => {
  if (!state) return EMPTY_BASELINE;

  return {
    totalDistanceWalked: state.stats.totalDistanceWalked,
    totalClicks: state.stats.totalClicks,
    upgradesPurchased: state.stats.upgradesPurchased,
    followersHired: state.stats.followersHired,
    randomEventsClaimed: state.stats.randomEventsClaimed,
    routeEncountersClaimed: state.stats.routeEncountersClaimed,
    achievementsClaimed: state.stats.achievementsClaimed,
    totalWorldDistance: getTotalWorldDistance(state),
    perfectSteps: state.stats.perfectSteps
  };
};

const getMetricValue = (state: GameState, type: QuestProgressType): number => {
  switch (type) {
    case 'distance_walked':
      return state.stats.totalDistanceWalked;
    case 'clicks':
      return state.stats.totalClicks;
    case 'upgrade_purchases':
      return state.stats.upgradesPurchased;
    case 'follower_hires':
      return state.stats.followersHired;
    case 'event_claims':
      return state.stats.randomEventsClaimed;
    case 'route_encounters':
      return state.stats.routeEncountersClaimed;
    case 'achievement_claims':
      return state.stats.achievementsClaimed;
    case 'world_progress':
      return getTotalWorldDistance(state);
    case 'perfect_steps':
      return state.stats.perfectSteps;
  }
};

const getBaselineValue = (baseline: QuestBaseline, type: QuestProgressType): number => {
  switch (type) {
    case 'distance_walked':
      return baseline.totalDistanceWalked;
    case 'clicks':
      return baseline.totalClicks;
    case 'upgrade_purchases':
      return baseline.upgradesPurchased;
    case 'follower_hires':
      return baseline.followersHired;
    case 'event_claims':
      return baseline.randomEventsClaimed;
    case 'route_encounters':
      return baseline.routeEncountersClaimed;
    case 'achievement_claims':
      return baseline.achievementsClaimed;
    case 'world_progress':
      return baseline.totalWorldDistance;
    case 'perfect_steps':
      return baseline.perfectSteps;
  }
};

const isQuestEligible = (state: GameState | undefined, quest: QuestDefinition): boolean => {
  if (!state) return true;

  if (quest.progress.type === 'follower_hires') {
    return getSpendableWalkerBucks(state) >= 50 || Object.values(state.followers).some((count) => count > 0);
  }

  if (quest.progress.type === 'achievement_claims') {
    return Object.values(state.achievements).some((progress) => progress.unlockedAt && !progress.claimedAt);
  }

  return true;
};

const getAllQuestDefinitions = (): QuestDefinition[] => [
  ...DAILY_QUEST_DEFINITIONS,
  ...getSeasonalQuestDefinitions('spring_stride_festival')
];

export const getQuestDefinitionById = (questId: string): QuestDefinition | undefined =>
  getAllQuestDefinitions().find((quest) => quest.id === questId);

const getQuestDefinitionsForState = (state: QuestState): QuestDefinition[] =>
  state.questIds
    .map((questId) => getQuestDefinitionById(questId))
    .filter((quest): quest is QuestDefinition => Boolean(quest));

const selectQuestIds = (dateKey: string, state?: GameState, seasonalEventId?: string | null): string[] => {
  const questIds = [...FIXED_DAILY_QUEST_IDS];
  const seasonalQuest = getSeasonalQuestDefinitions(seasonalEventId)[0];

  if (seasonalQuest) {
    questIds.push(seasonalQuest.id);
    questIds.push(...FIXED_WEEKLY_QUEST_IDS);
    return questIds.slice(0, QUEST_SET_SIZE);
  }

  const rotatingPool = DAILY_QUEST_DEFINITIONS.filter(
    (quest) => !questIds.includes(quest.id) && !FIXED_WEEKLY_QUEST_IDS.includes(quest.id) && isQuestEligible(state, quest)
  );
  const rotationIndex = hashString(`${dateKey}:${state?.currentWorldId ?? 'earth'}`) % rotatingPool.length;
  questIds.push(rotatingPool[rotationIndex].id);
  questIds.push(...FIXED_WEEKLY_QUEST_IDS);

  return questIds.slice(0, QUEST_SET_SIZE);
};

export const createInitialQuestState = (now = Date.now()): QuestState => {
  const activeDate = getLocalDateKey(now);
  const seasonalEvent = getActiveSeasonalEvent(now);
  const questIds = selectQuestIds(activeDate, undefined, seasonalEvent?.id);

  return {
    activeDate,
    questIds,
    progress: questIds.reduce<Record<string, QuestProgress>>((progress, questId) => {
      progress[questId] = createEmptyProgress();
      return progress;
    }, {}),
    baseline: EMPTY_BASELINE,
    lastGeneratedAt: now,
    seasonalEventId: seasonalEvent?.id ?? null
  };
};

export const createQuestStateForGameState = (state: GameState, now = Date.now()): QuestState => {
  const activeDate = getLocalDateKey(now);
  const seasonalEvent = getActiveSeasonalEvent(now);
  const questIds = selectQuestIds(activeDate, state, seasonalEvent?.id);

  return {
    activeDate,
    questIds,
    progress: questIds.reduce<Record<string, QuestProgress>>((progress, questId) => {
      progress[questId] = createEmptyProgress();
      return progress;
    }, {}),
    baseline: createQuestBaseline(state),
    lastGeneratedAt: now,
    seasonalEventId: seasonalEvent?.id ?? null
  };
};

export const mergeQuestState = (base: QuestState, rawQuestState?: Partial<QuestState>): QuestState => ({
  ...base,
  ...rawQuestState,
  questIds: rawQuestState?.questIds?.length ? rawQuestState.questIds : base.questIds,
  progress: {
    ...base.progress,
    ...rawQuestState?.progress
  },
  baseline: {
    ...base.baseline,
    ...rawQuestState?.baseline
  },
  seasonalEventId: rawQuestState?.seasonalEventId ?? base.seasonalEventId
});

export const syncDailyQuests = (state: GameState, now = Date.now()): GameState => {
  const activeDate = getLocalDateKey(now);
  const seasonalEvent = getActiveSeasonalEvent(now);

  if (
    state.quests.activeDate !== activeDate ||
    state.quests.seasonalEventId !== (seasonalEvent?.id ?? null) ||
    state.quests.questIds.length === 0
  ) {
    return {
      ...state,
      quests: createQuestStateForGameState(state, now)
    };
  }

  let progress = state.quests.progress;
  let changed = false;

  for (const quest of getQuestDefinitionsForState(state.quests)) {
    const current = progress[quest.id] ?? createEmptyProgress();
    const value = Math.min(
      quest.progress.target,
      Math.max(0, getMetricValue(state, quest.progress.type) - getBaselineValue(state.quests.baseline, quest.progress.type))
    );
    const completedAt = current.completedAt ?? (value >= quest.progress.target ? now : null);

    if (current.progress !== value || current.completedAt !== completedAt || !progress[quest.id]) {
      if (!changed) progress = { ...progress };
      progress[quest.id] = {
        ...current,
        progress: value,
        completedAt
      };
      changed = true;
    }
  }

  return changed
    ? {
        ...state,
        quests: {
          ...state.quests,
          progress
        }
      }
    : state;
};

export const claimQuestReward = (state: GameState, questId: string, now = Date.now()): GameState => {
  const synced = syncDailyQuests(state, now);
  const quest = getQuestDefinitionById(questId);
  const progress = synced.quests.progress[questId];

  if (!quest || !progress?.completedAt || progress.claimedAt) return state;

  const rewarded = grantRewardToState(synced, quest.reward);

  return {
    ...rewarded,
    quests: {
      ...rewarded.quests,
      progress: {
        ...rewarded.quests.progress,
        [questId]: {
          ...progress,
          claimedAt: now
        }
      }
    },
    ui: {
      ...rewarded.ui,
      toast: `${quest.name} reward queued for WalkerBucks sync.`
    }
  };
};

export const getQuestRewardSummary = (reward: RewardDefinition): string => {
  const parts: string[] = [];

  if (reward.walkerBucks) {
    parts.push(`${reward.walkerBucks.toLocaleString()} WB`);
  }

  for (const item of reward.items ?? []) {
    parts.push(`${item.quantity} item`);
  }

  for (const cosmetic of reward.cosmetics ?? []) {
    parts.push(cosmetic);
  }

  return parts.join(', ') || 'Badge only';
};

export const getQuestProgressText = (quest: QuestDefinition, progress: QuestProgress): string => {
  if (quest.progress.target < 1) {
    return `${progress.progress.toFixed(2)} / ${quest.progress.target.toFixed(2)}`;
  }

  return `${Math.floor(progress.progress).toLocaleString()} / ${quest.progress.target.toLocaleString()}`;
};

export const getQuestCompletionSummary = (state: GameState): { completed: number; claimable: number; total: number } => {
  const quests = getQuestDefinitionsForState(state.quests);
  const completed = quests.filter((quest) => state.quests.progress[quest.id]?.completedAt).length;
  const claimable = quests.filter((quest) => {
    const progress = state.quests.progress[quest.id];
    return progress?.completedAt && !progress.claimedAt;
  }).length;

  return {
    completed,
    claimable,
    total: quests.length
  };
};

export const getActiveQuestDefinitions = (state: GameState): QuestDefinition[] => getQuestDefinitionsForState(state.quests);
