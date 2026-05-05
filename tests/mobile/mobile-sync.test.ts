import { describe, expect, it } from 'vitest';
import { applyWalletAction, buyDevItem, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount } from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

const wallet = (result: unknown): number =>
  (result as { snapshot: { wallet: { WB: number } } }).snapshot.wallet.WB;
const inventory = (result: unknown): string[] =>
  (result as { snapshot: { inventory: string[] } }).snapshot.inventory;

describe('mobile and desktop dev sync scenarios', () => {
  it('mobile and desktop sessions load the same deterministic account', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    const desktop = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId, '/shop', false).result;
    const mobile = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId, '/shop', true).result;

    expect(wallet(desktop)).toBe(1000);
    expect(wallet(mobile)).toBe(1000);
  });

  it('wallet and inventory updates propagate through the shared dev state fallback refresh', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 1000 }).suite;
    suite = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' }).suite;
    const desktop = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId, '/shop', false).result;
    const mobile = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId, '/shop', true).result;

    expect(wallet(desktop)).toBe(wallet(mobile));
    expect(inventory(mobile)).toContain('starter_shoes');
  });
});
