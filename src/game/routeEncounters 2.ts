import {
  ROUTE_ENCOUNTER_LIFE_MS,
  ROUTE_ENCOUNTER_MAX_INTERVAL_MS,
  ROUTE_ENCOUNTER_MIN_INTERVAL_MS
} from './constants';
import { grantRewardToState } from './inventory';
import { applyDistanceAndWb } from './progression';
import type { GameState, RouteEncounterDefinition, RouteEncounterChoice } from './types';

export const ROUTE_ENCOUNTERS: RouteEncounterDefinition[] = [
  {
    id: 'route_pickup',
    name: 'Route Pickup',
    description: 'Something useful is sitting right on the walking line.',
    rarity: 'common',
    weight: 30,
    choices: [
      {
        id: 'grab_snack',
        label: 'Grab it',
        description: 'Pocket a small item and keep moving.',
        effects: [{ type: 'item_drop', itemId: 'trail_mix', quantity: 1 }]
      }
    ]
  },
  {
    id: 'split_path',
    name: 'Split Path',
    description: 'A short detour appears before the next route marker.',
    rarity: 'common',
    weight: 22,
    choices: [
      {
        id: 'sprint_line',
        label: 'Sprint line',
        description: 'Take the direct path for quick distance.',
        effects: [{ type: 'distance', value: 0.08 }]
      },
      {
        id: 'souvenir_line',
        label: 'Souvenir line',
        description: 'Take the scenic turn and find a small collectible.',
        effects: [{ type: 'item_drop', itemId: 'mile_badge', quantity: 1 }]
      }
    ]
  },
  {
    id: 'street_boost',
    name: 'Street Boost',
    description: 'The route opens up for a short burst.',
    rarity: 'uncommon',
    weight: 16,
    choices: [
      {
        id: 'tap_burst',
        label: 'Tap burst',
        description: 'Manual taps hit harder for a little while.',
        effects: [
          {
            type: 'temporary_boost',
            boostType: 'click_multiplier',
            multiplier: 1.5,
            durationMs: 18000
          }
        ]
      },
      {
        id: 'event_burst',
        label: 'Scout rewards',
        description: 'Trail rewards pay out better for a little while.',
        effects: [
          {
            type: 'temporary_boost',
            boostType: 'event_reward_multiplier',
            multiplier: 1.25,
            durationMs: 18000
          }
        ]
      }
    ]
  },
  {
    id: 'tiny_stash',
    name: 'Tiny Stash',
    description: 'A small WalkerBucks stash appears beside the route.',
    rarity: 'rare',
    weight: 8,
    choices: [
      {
        id: 'claim_stash',
        label: 'Claim stash',
        description: 'Gain local WalkerBucks now.',
        effects: [{ type: 'local_wb', value: 90 }]
      },
      {
        id: 'trade_for_token',
        label: 'Take token',
        description: 'Grab a route item for later.',
        effects: [{ type: 'item_drop', itemId: 'detour_token', quantity: 1 }]
      }
    ]
  }
];

const weightedPick = <T extends { weight: number }>(entries: T[]): T => {
  const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[0];
};

const scheduleNextRouteEncounterAt = (from: number): number =>
  from + ROUTE_ENCOUNTER_MIN_INTERVAL_MS + Math.random() * (ROUTE_ENCOUNTER_MAX_INTERVAL_MS - ROUTE_ENCOUNTER_MIN_INTERVAL_MS);

export const getRouteEncounterById = (encounterId: string): RouteEncounterDefinition | undefined =>
  ROUTE_ENCOUNTERS.find((encounter) => encounter.id === encounterId);

export const syncRouteEncounterSpawn = (state: GameState, now = Date.now()): GameState => {
  if (state.spawnedRouteEncounter && state.spawnedRouteEncounter.expiresAt <= now) {
    return {
      ...state,
      spawnedRouteEncounter: null,
      nextRouteEncounterAt: scheduleNextRouteEncounterAt(now)
    };
  }

  if (state.spawnedRouteEncounter || now < state.nextRouteEncounterAt) return state;

  const encounter = weightedPick(ROUTE_ENCOUNTERS);
  return {
    ...state,
    spawnedRouteEncounter: {
      id: `route_${now}`,
      encounterDefId: encounter.id,
      spawnedAt: now,
      expiresAt: now + ROUTE_ENCOUNTER_LIFE_MS,
      label: encounter.name
    },
    nextRouteEncounterAt: scheduleNextRouteEncounterAt(now)
  };
};

export const resolveRouteEncounterChoice = (
  state: GameState,
  choice: RouteEncounterChoice,
  now = Date.now()
): GameState => {
  let next: GameState = state;
  const rewardItems: Array<{ itemId: string; quantity: number }> = [];
  let localWb = 0;
  const labels: string[] = [];

  for (const effect of choice.effects) {
    if (effect.type === 'local_wb') {
      localWb += Math.floor(effect.value ?? 0);
      labels.push(`+${Math.floor(effect.value ?? 0)} WB`);
    }

    if (effect.type === 'distance') {
      const distance = effect.value ?? 0;
      next = applyDistanceAndWb(next, distance);
      labels.push(`+${distance.toFixed(2)} mi`);
    }

    if (effect.type === 'item_drop' && effect.itemId) {
      rewardItems.push({ itemId: effect.itemId, quantity: effect.quantity ?? 1 });
      labels.push('item found');
    }

    if (effect.type === 'temporary_boost' && effect.boostType) {
      next = {
        ...next,
        activeBoosts: [
          ...next.activeBoosts,
          {
            id: `route_${choice.id}_${now}`,
            sourceEventId: choice.id,
            effectType: effect.boostType,
            multiplier: effect.multiplier ?? 1.2,
            expiresAt: now + (effect.durationMs ?? 15000)
          }
        ]
      };
      labels.push('boost active');
    }
  }

  next = grantRewardToState(next, {
    walkerBucks: localWb || undefined,
    items: rewardItems.length ? rewardItems : undefined
  });

  return {
    ...next,
    spawnedRouteEncounter: null,
    nextRouteEncounterAt: scheduleNextRouteEncounterAt(now),
    stats: {
      ...next.stats,
      routeEncountersClaimed: next.stats.routeEncountersClaimed + 1
    },
    ui: {
      ...next.ui,
      toast: `${choice.label}: ${labels.join(', ')}.`
    }
  };
};
