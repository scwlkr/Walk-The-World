import { describe, expect, it } from 'vitest';
import { applyWalletAction, buyDevItem, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount } from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

const game = (result: unknown) => (result as { snapshot: { gameState: { dps: number }; inventory: string[]; activeBoosts: string[] } }).snapshot;

describe('dev inventory purchase effects', () => {
  it('cosmetic purchases do not affect DPS', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { amount: 1000, accountId: DEV_PLAYER_ACCOUNT.accountId }).suite;
    const before = game(getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result);
    suite = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'test-cosmetic-hat' }).suite;
    const after = game(getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result);

    expect(after.inventory).toContain('test_cosmetic_hat');
    expect(after.gameState.dps).toBe(before.gameState.dps);
  });

  it('boost purchases apply an active effect and persist in snapshot state', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { amount: 1000, accountId: DEV_PLAYER_ACCOUNT.accountId }).suite;
    suite = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'test-boost' }).suite;
    const after = game(getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result);

    expect(after.inventory).toContain('test_boost');
    expect(after.activeBoosts.length).toBeGreaterThan(0);
  });
});
