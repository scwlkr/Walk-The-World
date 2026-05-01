import { milesFromFeet, formatDistanceProgress } from './distance';
import { grantRewardToState } from './inventory';
import type { GameState, MilestoneDefinition, MilestoneProgress, MilestoneState } from './types';

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'leave_the_couch',
    name: 'Leave the Couch',
    description: 'Reach the first 100 feet.',
    condition: { type: 'distance_walked', target: milesFromFeet(100) },
    reward: { walkerBucks: 10 },
    actionHint: 'Tap WALK to get moving.'
  },
  {
    id: 'end_of_the_street',
    name: 'End of the Street',
    description: 'Walk 1,000 feet and unlock the first real generator tier.',
    condition: { type: 'distance_walked', target: milesFromFeet(1000) },
    reward: { walkerBucks: 20 },
    actionHint: 'Buy Starter Shoes when your WB settles.'
  },
  {
    id: 'around_the_block',
    name: 'Around the Block',
    description: 'Reach a quarter mile.',
    condition: { type: 'distance_walked', target: 0.25 },
    reward: { walkerBucks: 35 },
    actionHint: 'Balance tapping and generators.'
  },
  {
    id: 'neighborhood_loop',
    name: 'Neighborhood Loop',
    description: 'Finish the first full mile.',
    condition: { type: 'distance_walked', target: 1 },
    reward: { walkerBucks: 60 },
    actionHint: 'Use WB upgrades to raise DPS.'
  },
  {
    id: 'across_town',
    name: 'Across Town',
    description: 'Reach 10 miles and open the mid-route generator tier.',
    condition: { type: 'distance_walked', target: 10 },
    reward: { walkerBucks: 150 },
    actionHint: 'Watch the scenery change.'
  },
  {
    id: 'state_line',
    name: 'State Line',
    description: 'Reach 100 miles.',
    condition: { type: 'distance_walked', target: 100 },
    reward: { walkerBucks: 500 },
    actionHint: 'Keep the walking machine running.'
  },
  {
    id: 'across_america',
    name: 'Across America',
    description: 'Reach 3,000 miles. This is the v0.1 long target.',
    condition: { type: 'distance_walked', target: 3000 },
    reward: { walkerBucks: 3000 },
    actionHint: 'Stack generator levels.'
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
  if (milestone.condition.type === 'distance_walked') {
    return formatDistanceProgress(progress.progress, milestone.condition.target);
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
