import { describe, expect, it } from 'vitest';
import {
  applyWalletAction,
  buyDevItem,
  createEmptyDevSuiteState,
  getDevSnapshot,
  refundLastPurchase,
  resetDevAccount
} from '../../src/devtools/devActions';
import { DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';

const snapshot = (result: unknown) => (result as { snapshot: Record<string, unknown> }).snapshot;
const wallet = (result: unknown): number => ((snapshot(result).wallet as { WB: number }).WB);
const inventory = (result: unknown): string[] => snapshot(result).inventory as string[];
const dps = (result: unknown): number => ((snapshot(result).gameState as { dps: number }).dps);

describe('regular dev account purchase scenarios', () => {
  it('blocks a broke player from buying without keeping the item or DPS gain', () => {
    const reset = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId);
    const before = getDevSnapshot(reset.suite, DEV_PLAYER_ACCOUNT.accountId).result;
    const bought = buyDevItem(reset.suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    const after = getDevSnapshot(bought.suite, DEV_PLAYER_ACCOUNT.accountId).result;

    expect(bought.result.ok).toBe(false);
    expect(wallet(after)).toBe(0);
    expect(inventory(after)).not.toContain('starter_shoes');
    expect(dps(after)).toBe(dps(before));
  });

  it('lets a rich player buy starter-shoes and verifies wallet, inventory, DPS, and reload persistence', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 10000,
      idempotencyKey: 'test:set:rich'
    }).suite;
    const before = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
    const bought = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' });
    suite = bought.suite;
    const after = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
    const reloaded = JSON.parse(JSON.stringify(suite));
    const afterReload = getDevSnapshot(reloaded, DEV_PLAYER_ACCOUNT.accountId).result;

    expect(bought.result.ok).toBe(true);
    expect(wallet(before)).toBe(10000);
    expect(wallet(after)).toBe(9500);
    expect(inventory(after)).toContain('starter_shoes');
    expect(dps(after)).toBeGreaterThan(dps(before));
    expect(inventory(afterReload)).toContain('starter_shoes');
  });

  it('refunds the last purchase by reversing inventory, DPS, purchase state, and wallet', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_PLAYER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', {
      accountId: DEV_PLAYER_ACCOUNT.accountId,
      amount: 1000,
      idempotencyKey: 'test:set:refund'
    }).suite;
    const before = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
    suite = buyDevItem(suite, { accountId: DEV_PLAYER_ACCOUNT.accountId, itemId: 'starter-shoes' }).suite;
    const refund = refundLastPurchase(suite, DEV_PLAYER_ACCOUNT.accountId);
    const after = getDevSnapshot(refund.suite, DEV_PLAYER_ACCOUNT.accountId).result;

    expect(refund.result.ok).toBe(true);
    expect(wallet(after)).toBe(wallet(before));
    expect(inventory(after)).not.toContain('starter_shoes');
    expect(dps(after)).toBe(dps(before));
  });
});
