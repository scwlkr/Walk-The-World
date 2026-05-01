import { describe, expect, it } from 'vitest';
import {
  createPendingWalkerBucksBatchGrant,
  getPendingWalkerBucksGrants,
  getWtwWalletState,
  markWalkerBucksGrantAttempt,
  markWalkerBucksGrantGranted,
  queueWalkerBucksGrantAmount,
  upsertWalkerBucksGrant
} from '../src/game/economy';
import { createInitialGameState } from '../src/game/initialState';

describe('WalkerBucks grant reconciliation', () => {
  it('shows queued earned WB immediately without making it spendable before settlement', () => {
    const state = {
      ...createInitialGameState(1000),
      walkerBucksBridge: {
        ...createInitialGameState(1000).walkerBucksBridge,
        balance: {
          assetCode: 'WB' as const,
          balance: 100,
          lockedBalance: 0,
          availableBalance: 100,
          updatedAt: 1000
        },
        lastCheckedAt: 1000
      }
    };
    const queued = queueWalkerBucksGrantAmount(state, 25, 2000);

    expect(getWtwWalletState(queued)).toMatchObject({
      syncedWbBalance: 100,
      optimisticEarnedWb: 25,
      displayedWbBalance: 125,
      spendableWb: 100,
      isSyncing: true
    });
  });

  it('keeps drained queued earnings eligible for bridge submission until granted', () => {
    const state = createInitialGameState(1000);
    const grant = createPendingWalkerBucksBatchGrant('user_1', 70, 18, 2000);
    const withGrant = upsertWalkerBucksGrant(state, grant);
    const drainedQueue = {
      ...withGrant,
      walkerBucksBridge: {
        ...withGrant.walkerBucksBridge,
        pendingGrantAmount: 0,
        pendingGrantSequence: 18
      }
    };

    expect(getPendingWalkerBucksGrants(drainedQueue).map((entry) => entry.id)).toEqual(['walking:batch_18']);

    const attempted = markWalkerBucksGrantAttempt(drainedQueue, grant.id, 3000);
    expect(getPendingWalkerBucksGrants(attempted).map((entry) => entry.attempts)).toEqual([1]);

    const granted = markWalkerBucksGrantGranted(
      attempted,
      grant.id,
      'txn_123',
      'acct_123',
      {
        assetCode: 'WB',
        balance: 77,
        lockedBalance: 0,
        availableBalance: 77,
        updatedAt: 4000
      },
      4000
    );

    expect(getPendingWalkerBucksGrants(granted)).toEqual([]);
  });
});
