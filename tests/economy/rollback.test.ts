import { describe, expect, it } from 'vitest';
import { applyWalletAction, buyDevItem, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount, setFailureModeForSuite } from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

describe('dev purchase rollback', () => {
  it('failed purchases do not grant items or permanently increase stats', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    const before = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result as {
      snapshot: { gameState: { dps: number; tapPower: number; dt: number }; inventory: string[] };
    };
    suite = setFailureModeForSuite(suite, { nextPurchaseFails: true }).suite;
    const failed = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    const after = getDevSnapshot(failed.suite, DEV_PLAYER_ACCOUNT.accountId).result as {
      snapshot: { gameState: { dps: number; tapPower: number; dt: number }; inventory: string[] };
    };

    expect(after.snapshot.inventory).toEqual(before.snapshot.inventory);
    expect(after.snapshot.gameState.dps).toBe(before.snapshot.gameState.dps);
    expect(after.snapshot.gameState.tapPower).toBe(before.snapshot.gameState.tapPower);
    expect(after.snapshot.gameState.dt).toBe(before.snapshot.gameState.dt);
  });
});
