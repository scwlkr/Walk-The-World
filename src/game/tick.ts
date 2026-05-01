import {
  AUTO_SAVE_INTERVAL_MS,
  ENABLE_ADVANCED_EVENT_SYSTEMS,
  RANDOM_EVENT_MAX_INTERVAL_MS,
  RANDOM_EVENT_MIN_INTERVAL_MS
} from './constants';
import { queueWalkerBucksGrantAmount } from './economy';
import {
  getEventRewardMultiplier,
  getIdleMilesPerSecond
} from './formulas';
import { evaluateAchievements, markDailyPlay } from './achievements';
import { getInventoryItemById, grantRewardToState } from './inventory';
import { syncMilestones } from './milestones';
import { applyDistanceAndWb } from './progression';
import { syncDailyQuests } from './quests';
import { syncRouteEncounterSpawn } from './routeEncounters';
import { RANDOM_EVENTS, getRandomEventLifetime } from './randomEvents';
import type { GameState, RandomEventDefinition } from './types';

export { applyDistanceAndWb } from './progression';

const weightedPick = <T extends { weight: number }>(entries: T[]): T => {
  const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[0];
};

const scheduleNextEventAt = (from: number): number =>
  from + RANDOM_EVENT_MIN_INTERVAL_MS + Math.random() * (RANDOM_EVENT_MAX_INTERVAL_MS - RANDOM_EVENT_MIN_INTERVAL_MS);

export const reduceBoostDurations = (state: GameState, now: number): GameState => ({
  ...state,
  activeBoosts: state.activeBoosts.filter((boost) => boost.expiresAt > now)
});

const maybeSpawnRandomEvent = (state: GameState, now: number): GameState => {
  if (state.spawnedEvent && state.spawnedEvent.expiresAt <= now) {
    return { ...state, spawnedEvent: null };
  }

  if (state.spawnedEvent || now < state.nextRandomEventAt) {
    return state;
  }

  const event = weightedPick(RANDOM_EVENTS);
  return {
    ...state,
    spawnedEvent: {
      id: `event_${now}`,
      eventDefId: event.id,
      spawnedAt: now,
      expiresAt: now + getRandomEventLifetime(),
      label: event.name
    },
    nextRandomEventAt: scheduleNextEventAt(now)
  };
};

export const runGameTick = (state: GameState, deltaSeconds: number, now: number): GameState => {
  const idleDistance = getIdleMilesPerSecond(state) * deltaSeconds;

  let next = applyDistanceAndWb(state, idleDistance);
  next = markDailyPlay(next, now);
  next = syncDailyQuests(next, now);
  next = reduceBoostDurations(next, now);
  if (ENABLE_ADVANCED_EVENT_SYSTEMS) {
    next = maybeSpawnRandomEvent(next, now);
    next = syncRouteEncounterSpawn(next, now);
  }
  next = evaluateAchievements(next, now);
  next = syncMilestones(next, now);

  return next;
};

export const shouldAutoSave = (lastSavedAt: number, now: number): boolean => now - lastSavedAt >= AUTO_SAVE_INTERVAL_MS;

export const resolveRandomEvent = (state: GameState, eventDef: RandomEventDefinition, now: number): GameState => {
  let next = { ...state };
  const multiplier = getEventRewardMultiplier(state);

  switch (eventDef.effectType) {
    case 'instant_wb': {
      const gain = Math.floor((eventDef.value ?? 100) * multiplier);
      next = queueWalkerBucksGrantAmount(next, gain);
      next.ui.toast = `+${gain} WB from ${eventDef.name} queued for WalkerBucks sync.`;
      break;
    }
    case 'instant_distance': {
      const distance = (eventDef.value ?? 0.4) * multiplier;
      next = applyDistanceAndWb(next, distance);
      next.ui.toast = `Big lunge! +${distance.toFixed(2)} mi.`;
      break;
    }
    case 'temporary_speed_multiplier':
      next.activeBoosts = [
        ...next.activeBoosts,
        {
          id: `boost_${now}_speed`,
          sourceEventId: eventDef.id,
          effectType: 'speed_multiplier',
          multiplier: eventDef.value ?? 2,
          expiresAt: now + eventDef.durationMs
        }
      ];
      next.ui.toast = `${eventDef.name} active!`;
      break;
    case 'temporary_click_multiplier':
      next.activeBoosts = [
        ...next.activeBoosts,
        {
          id: `boost_${now}_click`,
          sourceEventId: eventDef.id,
          effectType: 'click_multiplier',
          multiplier: eventDef.value ?? 2,
          expiresAt: now + eventDef.durationMs
        }
      ];
      next.ui.toast = `Clicks boosted by ${eventDef.name}!`;
      break;
    case 'temporary_follower_multiplier':
      next.activeBoosts = [
        ...next.activeBoosts,
        {
          id: `boost_${now}_follower`,
          sourceEventId: eventDef.id,
          effectType: 'follower_multiplier',
          multiplier: eventDef.value ?? 2,
          expiresAt: now + eventDef.durationMs
        }
      ];
      next.ui.toast = `${eventDef.name} fired up your crew!`;
      break;
    case 'item_drop': {
      const itemId = eventDef.itemId ?? 'trail_mix';
      const quantity = Math.max(1, Math.floor((eventDef.quantity ?? 1) * multiplier));
      const itemName = getInventoryItemById(itemId)?.name ?? itemId.replace(/_/g, ' ');
      next = grantRewardToState(next, { items: [{ itemId, quantity }] });
      next = {
        ...next,
        ui: {
          ...next.ui,
          toast: `${eventDef.name}: found ${quantity > 1 ? `${quantity} ` : ''}${itemName}.`
        }
      };
      break;
    }
    case 'mystery': {
      if (Math.random() < 0.5) {
        const gain = Math.floor(180 * multiplier);
        next = queueWalkerBucksGrantAmount(next, gain);
        next.ui.toast = `Mystery stash! +${gain} WB queued.`;
      } else {
        next = applyDistanceAndWb(next, 1.2 * multiplier);
        next.ui.toast = 'Mystery rocket shoes! +distance.';
      }
      break;
    }
    case 'fake': {
      const consolation = Math.floor(20 * multiplier);
      next = queueWalkerBucksGrantAmount(next, consolation);
      next.ui.toast = `Fake shortcut. ${consolation} real WB queued.`;
      break;
    }
  }

  next = {
    ...next,
    spawnedEvent: null,
    stats: {
      ...next.stats,
      randomEventsClaimed: next.stats.randomEventsClaimed + 1
    }
  };
  return syncMilestones(evaluateAchievements(syncDailyQuests(next, now), now), now);
};

export const clearToast = (state: GameState): GameState => ({
  ...state,
  ui: {
    ...state.ui,
    toast: null
  }
});
