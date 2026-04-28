import { grantRewardToState } from './inventory';
import type { AchievementDefinition, AchievementProgress, GameState } from './types';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'day_one_check_in',
    name: 'Day One Walker',
    description: 'Open the game for a local daily check-in.',
    condition: { type: 'daily_play', target: 1 },
    reward: { walkerBucks: 20 }
  },
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Walk 0.01 total miles.',
    condition: { type: 'distance_walked', target: 0.01 },
    reward: {
      walkerBucks: 25,
      items: [{ itemId: 'trail_mix', quantity: 1 }]
    }
  },
  {
    id: 'tap_ten',
    name: 'Tap Ten',
    description: 'Tap to walk 10 times.',
    condition: { type: 'clicks', target: 10 },
    reward: {
      items: [{ itemId: 'retro_sweatband_item', quantity: 1 }]
    }
  },
  {
    id: 'first_upgrade',
    name: 'Gear Buyer',
    description: 'Buy your first upgrade.',
    condition: { type: 'upgrade_purchases', target: 1 },
    reward: {
      walkerBucks: 75,
      items: [{ itemId: 'starter_step_counter', quantity: 1 }]
    }
  },
  {
    id: 'first_follower',
    name: 'Crew Starter',
    description: 'Hire your first follower.',
    condition: { type: 'follower_hires', target: 1 },
    reward: {
      items: [{ itemId: 'lucky_laces_item', quantity: 1 }]
    }
  },
  {
    id: 'event_chaser',
    name: 'Event Chaser',
    description: 'Claim one random trail event.',
    condition: { type: 'event_claims', target: 1 },
    reward: {
      walkerBucks: 125,
      items: [{ itemId: 'walkertown_postcard', quantity: 1 }]
    }
  },
  {
    id: 'local_wallet',
    name: 'Local Wallet',
    description: 'Earn 100 total local WB.',
    condition: { type: 'total_wb_earned', target: 100 },
    reward: {
      walkerBucks: 50
    }
  },
  {
    id: 'earth_loop_one',
    name: 'Around The World',
    description: 'Complete one Earth loop.',
    condition: { type: 'earth_loops', target: 1 },
    reward: {
      walkerBucks: 1000,
      items: [{ itemId: 'golden_wayfarers_item', quantity: 1 }]
    },
    hidden: true
  }
];

export const getLocalDateKey = (now = Date.now()): string => {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createInitialAchievementState = (): Record<string, AchievementProgress> =>
  ACHIEVEMENT_DEFINITIONS.reduce<Record<string, AchievementProgress>>((state, achievement) => {
    state[achievement.id] = {
      progress: 0,
      unlockedAt: null,
      claimedAt: null
    };
    return state;
  }, {});

export const getAchievementById = (achievementId: string): AchievementDefinition | undefined =>
  ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.id === achievementId);

export const getAchievementProgressValue = (state: GameState, achievement: AchievementDefinition): number => {
  switch (achievement.condition.type) {
    case 'distance_walked':
      return state.stats.totalDistanceWalked;
    case 'earth_loops':
      return state.earthLoopsCompleted;
    case 'upgrade_purchases':
      return state.stats.upgradesPurchased;
    case 'follower_hires':
      return state.stats.followersHired;
    case 'event_claims':
      return state.stats.randomEventsClaimed;
    case 'daily_play':
      return state.dailyPlay.daysPlayed;
    case 'clicks':
      return state.stats.totalClicks;
    case 'total_wb_earned':
      return state.totalWalkerBucksEarned;
  }
};

export const markDailyPlay = (state: GameState, now = Date.now()): GameState => {
  const today = getLocalDateKey(now);
  if (state.dailyPlay.lastPlayedDate === today) return state;

  return {
    ...state,
    dailyPlay: {
      lastPlayedDate: today,
      daysPlayed: Math.max(1, state.dailyPlay.daysPlayed + 1)
    }
  };
};

export const evaluateAchievements = (state: GameState, now = Date.now()): GameState => {
  let achievements = state.achievements;
  let changed = false;
  const newlyUnlocked: string[] = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const current = achievements[definition.id] ?? {
      progress: 0,
      unlockedAt: null,
      claimedAt: null
    };
    const progress = getAchievementProgressValue(state, definition);
    const unlockedAt = current.unlockedAt ?? (progress >= definition.condition.target ? now : null);

    if (current.progress !== progress || current.unlockedAt !== unlockedAt || !achievements[definition.id]) {
      if (!changed) achievements = { ...achievements };
      achievements[definition.id] = {
        ...current,
        progress,
        unlockedAt
      };
      changed = true;
    }

    if (!current.unlockedAt && unlockedAt) {
      newlyUnlocked.push(definition.name);
    }
  }

  if (!changed && newlyUnlocked.length === 0) return state;

  const next: GameState = changed ? { ...state, achievements } : state;
  if (newlyUnlocked.length === 0 || state.ui.toast) return next;

  return {
    ...next,
    ui: {
      ...next.ui,
      toast: `Achievement unlocked: ${newlyUnlocked[0]}`
    }
  };
};

export const claimAchievementReward = (state: GameState, achievementId: string, now = Date.now()): GameState => {
  const definition = getAchievementById(achievementId);
  const progress = state.achievements[achievementId];
  if (!definition || !progress?.unlockedAt || progress.claimedAt) return state;

  const rewarded = grantRewardToState(state, definition.reward);
  return {
    ...rewarded,
    achievements: {
      ...rewarded.achievements,
      [achievementId]: {
        ...progress,
        claimedAt: now
      }
    },
    stats: {
      ...rewarded.stats,
      achievementsClaimed: rewarded.stats.achievementsClaimed + 1
    },
    ui: {
      ...rewarded.ui,
      toast: `${definition.name} reward claimed.`
    }
  };
};

export const getRewardSummary = (achievement: AchievementDefinition): string => {
  const parts: string[] = [];
  if (achievement.reward.walkerBucks) {
    parts.push(`${achievement.reward.walkerBucks.toLocaleString()} WB`);
  }

  for (const item of achievement.reward.items ?? []) {
    parts.push(`${item.quantity} item`);
  }

  for (const cosmetic of achievement.reward.cosmetics ?? []) {
    parts.push(cosmetic);
  }

  return parts.join(', ') || 'Badge only';
};
