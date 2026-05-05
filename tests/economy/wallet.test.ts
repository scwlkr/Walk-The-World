import { describe, expect, it } from 'vitest';
import { applyWalletAction, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount } from '../../src/devtools/devActions';
import { isDevToolsEnabled } from '../../src/devtools/devAuth';
import { DEV_NEW_USER_ACCOUNT, DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

const wallet = (result: unknown): number =>
  (result as { snapshot: { wallet: { WB: number } } }).snapshot.wallet.WB;

describe('dev route protection', () => {
  it('blocks when NODE_ENV is production and no override', () => {
    expect(isDevToolsEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('allows with explicit flag in production', () => {
    expect(isDevToolsEnabled({ NODE_ENV: 'production', VITE_ENABLE_DEVTOOLS: 'true' })).toBe(true);
  });
});

describe('dev WalkerBucks ledger helpers', () => {
  it('grants, takes, and sets WB through idempotent dev ledger transactions', () => {
    let suite = createEmptyDevSuiteState();
    let next = applyWalletAction(suite, 'dev:grant', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 10000,
      idempotencyKey: 'test:grant:10000'
    });
    suite = next.suite;
    expect(next.result).toMatchObject({ ok: true, walletBefore: 0, walletAfter: 10000 });

    next = applyWalletAction(suite, 'dev:grant', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 10000,
      idempotencyKey: 'test:grant:10000'
    });
    suite = next.suite;
    expect(next.result).toMatchObject({ replayed: true, walletAfter: 10000 });

    next = applyWalletAction(suite, 'dev:take', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 500,
      idempotencyKey: 'test:take:500'
    });
    suite = next.suite;
    expect(next.result).toMatchObject({ walletBefore: 10000, walletAfter: 9500 });

    next = applyWalletAction(suite, 'dev:set-wb', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 0,
      idempotencyKey: 'test:set:0'
    });
    suite = next.suite;
    expect(next.result).toMatchObject({ walletAfter: 0 });
    expect(wallet(getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result)).toBe(0);
  });

  it('resets the brand-new user to clean account, game, wallet, inventory, daily, and onboarding state', () => {
    const reset = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId);
    const state = reset.suite.accounts[DEV_NEW_USER_ACCOUNT.accountId];
    expect(state?.distanceMiles).toBe(0);
    expect(state?.stats.totalDistanceWalked).toBe(0);
    expect(state?.walkerBucksBridge.balance?.availableBalance).toBe(0);
    expect(state?.inventory.items).toEqual({});
    expect(state?.upgrades).toEqual({});
    expect(state?.followers).toEqual({});
    expect(state?.activeBoosts).toEqual([]);
    expect(state?.dailyClaim).toEqual({ lastClaimAt: null, streak: 0 });
    expect(state?.onboarding).toMatchObject({ status: 'not_started', currentStep: null, completedSteps: [] });
    expect(state?.tutorialFlags.hasSeenWelcome).toBe(false);
  });
});
