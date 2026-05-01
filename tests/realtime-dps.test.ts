import { describe, expect, it } from 'vitest';
import { getIdleMilesPerSecond } from '../src/game/formulas';
import { createInitialGameState } from '../src/game/initialState';
import {
  getRealtimeMilesPerSecond,
  getRecentTapMilesPerSecond,
  pruneRealtimeTapSamples
} from '../src/game/realtimeDps';

describe('realtime DPS', () => {
  it('adds recent tap distance to passive DPS', () => {
    const state = createInitialGameState(1000);
    const passive = getIdleMilesPerSecond(state);
    const realtime = getRealtimeMilesPerSecond(
      state,
      [
        { distanceMiles: 0.01, occurredAt: 1000 },
        { distanceMiles: 0.03, occurredAt: 1500 }
      ],
      2000
    );

    expect(realtime).toBeCloseTo(passive + 0.02);
  });

  it('drops tap contribution after the realtime window expires', () => {
    const samples = [
      { distanceMiles: 0.01, occurredAt: 1000 },
      { distanceMiles: 0.03, occurredAt: 1500 },
      { distanceMiles: 0.05, occurredAt: 3500 }
    ];

    expect(getRecentTapMilesPerSecond(samples, 3500)).toBeCloseTo(0.04);
    expect(pruneRealtimeTapSamples(samples, 3600)).toEqual([
      { distanceMiles: 0.05, occurredAt: 3500 }
    ]);
  });
});
