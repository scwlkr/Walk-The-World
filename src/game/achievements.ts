import { INVENTORY_ITEMS, grantRewardToState } from './inventory';
import { getUnlockedRegions } from './regions';
import type { AchievementDefinition, AchievementProgress, GameState, RewardDefinition } from './types';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'day_one_check_in',
    name: 'Day One Walker',
    description: 'Open the game for a daily check-in.',
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
    id: 'first_boost',
    name: 'Boost Taste Test',
    description: 'Use one boost or consumable item.',
    condition: { type: 'items_used', target: 1 },
    reward: {
      walkerBucks: 50,
      items: [{ itemId: 'detour_token', quantity: 1 }]
    }
  },
  {
    id: 'first_fit',
    name: 'Crew Looks Legit',
    description: 'Equip one cosmetic.',
    condition: { type: 'cosmetics_equipped', target: 1 },
    reward: {
      items: [{ itemId: 'aura_battery', quantity: 1 }]
    }
  },
  {
    id: 'local_wallet',
    name: 'WalkerBucks Earner',
    description: 'Earn 100 WB through Walk The World.',
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
  },
  {
    id: 'region_hopper',
    name: 'Region Hopper',
    description: 'Reach five Earth regions.',
    condition: { type: 'regions_reached', target: 5 },
    reward: {
      walkerBucks: 180,
      items: [{ itemId: 'souvenir_magnet', quantity: 1 }]
    }
  },
  {
    id: 'world_tourist',
    name: 'World Tourist',
    description: 'Reach ten Earth regions.',
    condition: { type: 'regions_reached', target: 10 },
    reward: {
      walkerBucks: 500,
      items: [{ itemId: 'walker_passport', quantity: 1 }]
    }
  },
  {
    id: 'route_story_collector',
    name: 'Route Story Collector',
    description: 'Resolve three route encounters.',
    condition: { type: 'route_encounters', target: 3 },
    reward: {
      walkerBucks: 140,
      items: [{ itemId: 'route_marker', quantity: 1 }]
    }
  },
  {
    id: 'combo_walker',
    name: 'Combo Walker',
    description: 'Land three perfect step combos.',
    condition: { type: 'perfect_steps', target: 3 },
    reward: {
      walkerBucks: 120,
      items: [{ itemId: 'aura_battery', quantity: 1 }]
    }
  },
  {
    id: 'weather_chaser',
    name: 'Weather Chaser',
    description: 'Claim five route events.',
    condition: { type: 'event_claims', target: 5 },
    reward: {
      walkerBucks: 250,
      items: [{ itemId: 'detour_token', quantity: 1 }]
    }
  },
  {
    id: 'starter_backpack_set',
    name: 'Starter Backpack Set',
    description: 'Own six different items.',
    condition: { type: 'distinct_items_owned', target: 6 },
    reward: {
      walkerBucks: 180,
      items: [{ itemId: 'fresh_socks', quantity: 1 }],
      titleIds: ['tiny_collection_flex']
    }
  },
  {
    id: 'rare_case',
    name: 'Rare Case',
    description: 'Own three rare, epic, or legendary items.',
    condition: { type: 'rare_items_owned', target: 3 },
    reward: {
      walkerBucks: 350,
      items: [{ itemId: 'world_tour_pin', quantity: 1 }],
      titleIds: ['rare_route_flex']
    }
  },
  {
    id: 'fit_check_captain',
    name: 'Fit Check Captain',
    description: 'Own three cosmetics.',
    condition: { type: 'cosmetics_owned', target: 3 },
    reward: {
      items: [{ itemId: 'peace_offering_granola', quantity: 1 }],
      titleIds: ['fit_check_captain']
    }
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
    case 'items_used':
      return state.stats.itemsUsed;
    case 'cosmetics_equipped':
      return state.stats.cosmeticsEquipped;
    case 'route_encounters':
      return state.stats.routeEncountersClaimed;
    case 'regions_reached':
      return getUnlockedRegions(state).length;
    case 'distinct_items_owned':
      return Object.values(state.inventory.items).filter((quantity) => quantity > 0).length;
    case 'rare_items_owned':
      return INVENTORY_ITEMS.filter((item) => {
        const rarityScore = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(item.rarity);
        return rarityScore >= 2 && (state.inventory.items[item.id] ?? 0) > 0;
      }).length;
    case 'cosmetics_owned':
      return Object.values(state.cosmetics.owned).filter(Boolean).length;
    case 'perfect_steps':
      return state.stats.perfectSteps;
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

type ClaimAchievementRewardOptions = {
  includeWalkerBucks?: boolean;
  toast?: string;
};

const maybeRemoveWalkerBucksReward = (reward: RewardDefinition, includeWalkerBucks: boolean): RewardDefinition => {
  if (includeWalkerBucks) return reward;
  return {
    ...reward,
    walkerBucks: undefined
  };
};

export const claimAchievementReward = (
  state: GameState,
  achievementId: string,
  now = Date.now(),
  options: ClaimAchievementRewardOptions = {}
): GameState => {
  const definition = getAchievementById(achievementId);
  const progress = state.achievements[achievementId];
  if (!definition || !progress?.unlockedAt || progress.claimedAt) return state;

  const includeWalkerBucks = options.includeWalkerBucks ?? true;
  const rewarded = grantRewardToState(state, maybeRemoveWalkerBucksReward(definition.reward, includeWalkerBucks));
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
      toast: options.toast ?? `${definition.name} reward claimed.`
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

  for (const titleId of achievement.reward.titleIds ?? []) {
    parts.push(`${titleId.replace(/_/g, ' ')} title`);
  }

  return parts.join(', ') || 'Badge only';
};
