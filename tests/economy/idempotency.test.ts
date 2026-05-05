import { describe, expect, it } from 'vitest';
import { applyWalletAction, buyDevItem, createEmptyDevSuiteState, resetDevAccount, setFailureModeForSuite } from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

describe('dev purchase idempotency', () => {
  it('duplicate idempotency keys do not double charge or double buy', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    const key = 'test:duplicate:starter-shoes';
    const first = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes', idempotencyKey: key });
    const second = buyDevItem(first.suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes', idempotencyKey: key });
    const state = second.suite.accounts[DEV_PLAYER_ACCOUNT.accountId];

    expect(first.result.ok).toBe(true);
    expect(second.result.replayed).toBe(true);
    expect(state?.walkerBucksBridge.balance?.availableBalance).toBe(500);
    expect(state?.inventory.items.starter_shoes).toBe(1);
  });

  it('forced duplicate purchase requests replay the same ledger transaction', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    suite = setFailureModeForSuite(suite, { duplicateNextPurchase: true }).suite;
    const bought = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    const state = bought.suite.accounts[DEV_PLAYER_ACCOUNT.accountId];

    expect(bought.result.ok).toBe(true);
    expect(state?.walkerBucksBridge.balance?.availableBalance).toBe(500);
    expect(state?.inventory.items.starter_shoes).toBe(1);
  });
});
