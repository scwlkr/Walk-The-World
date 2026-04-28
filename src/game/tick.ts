import {
  AUTO_SAVE_INTERVAL_MS,
  EARTH_LOOP_REWARD_WB,
  MOON_LOOP_REWARD_WB,
  RANDOM_EVENT_MAX_INTERVAL_MS,
  RANDOM_EVENT_MIN_INTERVAL_MS
} from './constants';
import {
  getEventRewardMultiplier,
  getIdleMilesPerSecond,
  getWbPerMile
} from './formulas';
import { evaluateAchievements, markDailyPlay } from './achievements';
import { syncDailyQuests } from './quests';
import { RANDOM_EVENTS, getRandomEventLifetime } from './randomEvents';
import type { GameState, RandomEventDefinition } from './types';
import { getWorldDefinition, getWorldProgress } from './world';

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

export const applyDistanceAndWb = (state: GameState, distanceDelta: number): GameState => {
  if (distanceDelta <= 0) return state;

  const wbGainRaw = distanceDelta * getWbPerMile(state) + state.wbBankedRemainder;
  const wbGain = Math.floor(wbGainRaw);
  const wbRemainder = wbGainRaw - wbGain;

  const currentWorld = getWorldDefinition(state.currentWorldId);
  const currentProgress = getWorldProgress(state);
  const prevLoops = Math.floor(currentProgress.distanceMiles / currentWorld.loopDistanceMiles);
  const nextDistance = currentProgress.distanceMiles + distanceDelta;
  const nextLoops = Math.floor(nextDistance / currentWorld.loopDistanceMiles);
  const loopsCompletedNow = Math.max(0, nextLoops - prevLoops);

  const loopReward = state.currentWorldId === 'moon' ? MOON_LOOP_REWARD_WB : EARTH_LOOP_REWARD_WB;
  const loopBonus = loopsCompletedNow * loopReward;
  const nextWorlds = {
    ...state.worlds,
    [state.currentWorldId]: {
      ...currentProgress,
      distanceMiles: nextDistance,
      loopsCompleted: currentProgress.loopsCompleted + loopsCompletedNow
    }
  };

  return {
    ...state,
    distanceMiles: nextDistance,
    worlds: nextWorlds,
    walkerBucks: state.walkerBucks + wbGain + loopBonus,
    totalWalkerBucksEarned: state.totalWalkerBucksEarned + wbGain + loopBonus,
    earthLoopsCompleted:
      state.currentWorldId === 'earth' ? state.earthLoopsCompleted + loopsCompletedNow : state.earthLoopsCompleted,
    wbBankedRemainder: wbRemainder,
    stats: {
      ...state.stats,
      totalDistanceWalked: state.stats.totalDistanceWalked + distanceDelta
    },
    ui: {
      ...state.ui,
      moonTeaseUnlocked: state.ui.moonTeaseUnlocked || (state.currentWorldId === 'earth' && loopsCompletedNow > 0)
    }
  };
};

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
  next = maybeSpawnRandomEvent(next, now);
  next = evaluateAchievements(next, now);

  return next;
};

export const shouldAutoSave = (lastSavedAt: number, now: number): boolean => now - lastSavedAt >= AUTO_SAVE_INTERVAL_MS;

export const resolveRandomEvent = (state: GameState, eventDef: RandomEventDefinition, now: number): GameState => {
  let next = { ...state };
  const multiplier = getEventRewardMultiplier(state);

  switch (eventDef.effectType) {
    case 'instant_wb': {
      const gain = Math.floor((eventDef.value ?? 100) * multiplier);
      next.walkerBucks += gain;
      next.totalWalkerBucksEarned += gain;
      next.ui.toast = `+${gain} WB from ${eventDef.name}!`;
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
    case 'mystery': {
      if (Math.random() < 0.5) {
        const gain = Math.floor(180 * multiplier);
        next.walkerBucks += gain;
        next.totalWalkerBucksEarned += gain;
        next.ui.toast = `Mystery stash! +${gain} WB.`;
      } else {
        next = applyDistanceAndWb(next, 1.2 * multiplier);
        next.ui.toast = 'Mystery rocket shoes! +distance.';
      }
      break;
    }
    case 'fake': {
      const consolation = Math.floor(20 * multiplier);
      next.walkerBucks += consolation;
      next.totalWalkerBucksEarned += consolation;
      next.ui.toast = `Fake shortcut. Real ${consolation} WB though.`;
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
  return evaluateAchievements(syncDailyQuests(next, now), now);
};

export const clearToast = (state: GameState): GameState => ({
  ...state,
  ui: {
    ...state.ui,
    toast: null
  }
});
