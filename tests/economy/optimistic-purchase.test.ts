import { describe, expect, it } from 'vitest';
import { applyWalletAction, buyDevItem, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount, setFailureModeForSuite } from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

const state = (result: unknown) =>
  (result as { snapshot: { wallet: { WB: number }; inventory: string[]; gameState: { dps: number } } }).snapshot;

describe('dev optimistic purchase scenarios', () => {
  it('settles a valid optimistic purchase without leaving the UI pending', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    const bought = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    const purchase = Object.values(bought.suite.accounts[DEV_PLAYER_ACCOUNT.accountId]?.walkerBucksBridge.purchases ?? {})[0];

    expect(bought.result.ok).toBe(true);
    expect(purchase?.status).toBe('settled');
  });

  it('rolls back wallet, inventory, and DPS after forced server rejection', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    const before = state(getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result);
    suite = setFailureModeForSuite(suite, { nextPurchaseFails: true }).suite;
    const bought = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    const after = state(getDevSnapshot(bought.suite, DEV_PLAYER_ACCOUNT.accountId).result);

    expect(bought.result.ok).toBe(false);
    expect(after.wallet.WB).toBe(before.wallet.WB);
    expect(after.inventory).not.toContain('starter_shoes');
    expect(after.gameState.dps).toBe(before.gameState.dps);
  });
});
