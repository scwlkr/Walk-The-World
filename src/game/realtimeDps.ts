import { getIdleMilesPerSecond } from './formulas';
import type { GameState } from './types';

export const REALTIME_DPS_WINDOW_MS = 2000;

export type RecentTapDistance = {
  distanceMiles: number;
  occurredAt: number;
};

export const pruneRealtimeTapSamples = (
  samples: RecentTapDistance[],
  now = Date.now(),
  windowMs = REALTIME_DPS_WINDOW_MS
): RecentTapDistance[] =>
  samples.filter((sample) => sample.occurredAt >= now - windowMs && sample.occurredAt <= now);

export const getRecentTapMilesPerSecond = (
  samples: RecentTapDistance[],
  now = Date.now(),
  windowMs = REALTIME_DPS_WINDOW_MS
): number => {
  const activeSamples = pruneRealtimeTapSamples(samples, now, windowMs);
  const distance = activeSamples.reduce((total, sample) => total + Math.max(0, sample.distanceMiles), 0);
  return distance / (windowMs / 1000);
};

export const getRealtimeMilesPerSecond = (
  state: GameState,
  samples: RecentTapDistance[],
  now = Date.now(),
  windowMs = REALTIME_DPS_WINDOW_MS
): number => getIdleMilesPerSecond(state) + getRecentTapMilesPerSecond(samples, now, windowMs);
