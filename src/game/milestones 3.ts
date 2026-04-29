import { grantRewardToState } from './inventory';
import type { GameState, MilestoneDefinition, MilestoneProgress, MilestoneState } from './types';

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'first_30_seconds',
    name: 'First 30 Seconds',
    description: 'Tap the route once and start the loop.',
    condition: { type: 'clicks', target: 1 },
    reward: {
      walkerBucks: 20,
      items: [{ itemId: 'trail_mix', quantity: 1 }]
    },
    actionHint: 'Tap the route or WALK.'
  },
  {
    id: 'first_route_stop',
    name: 'First Route Stop',
    description: 'Reach the Walkertown corner marker.',
    condition: { type: 'distance_walked', target: 0.04 },
    reward: {
      walkerBucks: 15,
      items: [{ itemId: 'walkertown_postcard', quantity: 1 }]
    },
    actionHint: 'Keep walking to the next marker.'
  },
  {
    id: 'first_upgrade',
    name: 'First Upgrade',
    description: 'Buy any local upgrade.',
    condition: { type: 'upgrades_purchased', target: 1 },
    reward: {
      walkerBucks: 45,
      items: [{ itemId: 'starter_step_counter', quantity: 1 }]
    },
    actionHint: 'Open Shop and buy an upgrade.'
  },
  {
    id: 'first_item_moment',
    name: 'Backpack Started',
    description: 'Own three different items.',
    condition: { type: 'distinct_items_owned', target: 3 },
    reward: {
      walkerBucks: 60,
      items: [{ itemId: 'route_marker', quantity: 1 }]
    },
    actionHint: 'Claim rewards or buy catalog items.'
  },
  {
    id: 'first_follower',
    name: 'Crew Online',
    description: 'Hire a follower for the route.',
    condition: { type: 'followers_hired', target: 1 },
    reward: {
      walkerBucks: 75,
      items: [{ itemId: 'lucky_laces_item', quantity: 1 }]
    },
    actionHint: 'Hire the first follower.'
  },
  {
    id: 'first_event',
    name: 'Trail Happened',
    description: 'Claim any event or route encounter.',
    condition: { type: 'route_encounters_claimed', target: 1 },
    reward: {
      walkerBucks: 50,
      items: [{ itemId: 'detour_token', quantity: 1 }]
    },
    actionHint: 'Tap a route encounter.'
  },
  {
    id: 'first_collection_set',
    name: 'Tiny Collection Flex',
    description: 'Own six different local items.',
    condition: { type: 'distinct_items_owned', target: 6 },
    reward: {
      walkerBucks: 120,
      items: [{ itemId: 'mile_badge', quantity: 1 }],
      titleIds: ['tiny_collection_flex']
    },
    actionHint: 'Fill the backpack with route finds.'
  }
];

const createEmptyProgress = (): MilestoneProgress => ({
  progress: 0,
  completedAt: null,
  claimedAt: null
});

export const createInitialMilestoneState = (): MilestoneState => ({
  progress: MILESTONE_DEFINITIONS.reduce<Record<string, MilestoneProgress>>((progress, milestone) => {
    progress[milestone.id] = createEmptyProgress();
    return progress;
  }, {})
});

const getMilestoneProgressValue = (state: GameState, milestone: MilestoneDefinition): number => {
  switch (milestone.condition.type) {
    case 'clicks':
      return state.stats.totalClicks;
    case 'distance_walked':
      return state.stats.totalDistanceWalked;
    case 'upgrades_purchased':
      return state.stats.upgradesPurchased;
    case 'followers_hired':
      return state.stats.followersHired;
    case 'items_owned':
      return Object.values(state.inventory.items).reduce((sum, quantity) => sum + quantity, 0);
    case 'random_events_claimed':
      return state.stats.randomEventsClaimed;
    case 'route_encounters_claimed':
      return state.stats.routeEncountersClaimed + state.stats.randomEventsClaimed;
    case 'distinct_items_owned':
      return Object.values(state.inventory.items).filter((quantity) => quantity > 0).length;
  }
};

export const syncMilestones = (state: GameState, now = Date.now()): GameState => {
  let progress = state.milestones.progress;
  let changed = false;
  const newlyReady: string[] = [];

  for (const milestone of MILESTONE_DEFINITIONS) {
    const current = progress[milestone.id] ?? createEmptyProgress();
    const value = Math.min(milestone.condition.target, getMilestoneProgressValue(state, milestone));
    const completedAt = current.completedAt ?? (value >= milestone.condition.target ? now : null);

    if (current.progress !== value || current.completedAt !== completedAt || !progress[milestone.id]) {
      if (!changed) progress = { ...progress };
      progress[milestone.id] = {
        ...current,
        progress: value,
        completedAt
      };
      changed = true;
    }

    if (!current.completedAt && completedAt) {
      newlyReady.push(milestone.name);
    }
  }

  const next = changed ? { ...state, milestones: { progress } } : state;
  if (!newlyReady.length || next.ui.toast) return next;

  return {
    ...next,
    ui: {
      ...next.ui,
      toast: `${newlyReady[0]} milestone ready.`
    }
  };
};

export const claimMilestoneReward = (state: GameState, milestoneId: string, now = Date.now()): GameState => {
  const synced = syncMilestones(state, now);
  const milestone = MILESTONE_DEFINITIONS.find((entry) => entry.id === milestoneId);
  const progress = milestone ? synced.milestones.progress[milestone.id] : null;
  if (!milestone || !progress?.completedAt || progress.claimedAt) return state;

  const rewarded = grantRewardToState(synced, milestone.reward);
  return {
    ...rewarded,
    milestones: {
      progress: {
        ...rewarded.milestones.progress,
        [milestone.id]: {
          ...progress,
          claimedAt: now
        }
      }
    },
    stats: {
      ...rewarded.stats,
      milestonesClaimed: rewarded.stats.milestonesClaimed + 1
    },
    ui: {
      ...rewarded.ui,
      toast: `${milestone.name} reward claimed.`
    }
  };
};

export const getMilestoneProgressText = (milestone: MilestoneDefinition, progress: MilestoneProgress): string => {
  if (milestone.condition.target < 1) {
    return `${progress.progress.toFixed(2)} / ${milestone.condition.target.toFixed(2)}`;
  }
  return `${Math.floor(progress.progress).toLocaleString()} / ${milestone.condition.target.toLocaleString()}`;
};

export const getJourneyMilestones = (state: GameState, limit = 3): MilestoneDefinition[] => {
  const claimable = MILESTONE_DEFINITIONS.filter((milestone) => {
    const progress = state.milestones.progress[milestone.id];
    return progress?.completedAt && !progress.claimedAt;
  });
  const active = MILESTONE_DEFINITIONS.filter((milestone) => {
    const progress = state.milestones.progress[milestone.id];
    return !progress?.completedAt;
  });
  return [...claimable, ...active].slice(0, limit);
};
