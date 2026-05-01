import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../src/game/initialState';
import { resolveSaveSyncDecision } from '../src/game/saveSync';

describe('authenticated save sync resolution', () => {
  it('loads the cloud save when the cloud row is newer', () => {
    const local = { ...createInitialGameState(1000), lastSavedAt: 1000 };
    const cloud = {
      ...createInitialGameState(1000),
      lastSavedAt: 5000,
      stats: { ...local.stats, totalDistanceWalked: 2 },
      distanceMiles: 2,
      worlds: {
        ...local.worlds,
        earth: { ...local.worlds.earth, distanceMiles: 2 }
      }
    };

    const decision = resolveSaveSyncDecision(local, cloud, { cloudUpdatedAt: 5000 });

    expect(decision).toMatchObject({
      winner: 'cloud',
      reason: 'cloud_newer_timestamp'
    });
  });

  it('requires a manual upload when local progress is clearly newer than cloud', () => {
    const cloud = { ...createInitialGameState(1000), lastSavedAt: 1000 };
    const local = {
      ...createInitialGameState(1000),
      lastSavedAt: 8000,
      upgrades: { starter_shoes: 2 },
      followers: { neighborhood_walker: 1 },
      stats: { ...cloud.stats, totalDistanceWalked: 5, upgradesPurchased: 2, followersHired: 1 },
      distanceMiles: 5,
      worlds: {
        ...cloud.worlds,
        earth: { ...cloud.worlds.earth, distanceMiles: 5 }
      }
    };

    const decision = resolveSaveSyncDecision(local, cloud, { cloudUpdatedAt: 1000 });

    expect(decision).toMatchObject({
      winner: 'conflict',
      reason: 'local_newer_needs_manual_upload'
    });
  });

  it('keeps cloud authoritative when only the local timestamp is newer', () => {
    const cloud = {
      ...createInitialGameState(1000),
      lastSavedAt: 1000,
      stats: { ...createInitialGameState(1000).stats, totalDistanceWalked: 10 },
      distanceMiles: 10,
      worlds: {
        ...createInitialGameState(1000).worlds,
        earth: { ...createInitialGameState(1000).worlds.earth, distanceMiles: 10 }
      }
    };
    const local = { ...createInitialGameState(1000), lastSavedAt: 9000 };

    const decision = resolveSaveSyncDecision(local, cloud, { cloudUpdatedAt: 1000 });

    expect(decision).toMatchObject({
      winner: 'cloud',
      reason: 'cloud_authoritative_tie'
    });
  });
});
