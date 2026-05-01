import { describe, expect, it } from 'vitest';
import {
  buyOfferFastOptimistic,
  getSpendableWalkerBucks,
  getWtwWalletState,
  markWtwPurchaseSettled,
  rollbackOptimisticPurchase
} from '../src/game/economy';
import { getIdleMilesPerSecond } from '../src/game/formulas';
import { createInitialGameState } from '../src/game/initialState';
import { applyCatalogOfferPurchase } from '../src/game/items';
import { UPGRADES } from '../src/game/upgrades';
import type { GameState } from '../src/game/types';

const withWalkerBucksBalance = (state: GameState, balance: number): GameState => ({
  ...state,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    status: 'ready',
    accountId: 'acct_test',
    balance: {
      assetCode: 'WB',
      balance,
      lockedBalance: 0,
      availableBalance: balance,
      updatedAt: 1000
    },
    lastCheckedAt: 1000
  }
});

describe('fast optimistic purchases', () => {
  it('reserves local spendable WalkerBucks before settlement so the same cached balance cannot be spent twice', () => {
    const state = withWalkerBucksBalance(createInitialGameState(1000), 100);
    const first = buyOfferFastOptimistic(state, {
      supabaseUserId: 'user_1',
      accountId: 'acct_test',
      purchaseId: 'purchase_1',
      offerId: 'starter_shoes',
      itemDefId: 'starter_shoes',
      itemName: 'Starter Shoes',
      price: 80,
      sourceType: 'upgrade',
      sourceId: 'starter_shoes:level_1',
      dpsDelta: 1,
      applyPurchase: (prev) => ({
        ...prev,
        upgrades: { ...prev.upgrades, starter_shoes: 1 }
      }),
      now: 2000
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(getWtwWalletState(first.state)).toMatchObject({
      syncedWbBalance: 100,
      pendingSpend: 80,
      displayedWbBalance: 20,
      spendableWb: 20
    });

    const second = buyOfferFastOptimistic(first.state, {
      supabaseUserId: 'user_1',
      accountId: 'acct_test',
      purchaseId: 'purchase_2',
      offerId: 'walking_stick',
      itemDefId: 'walking_stick',
      itemName: 'Walking Stick',
      price: 50,
      sourceType: 'upgrade',
      sourceId: 'walking_stick:level_1',
      dpsDelta: 1,
      applyPurchase: (prev) => ({
        ...prev,
        upgrades: { ...prev.upgrades, walking_stick: 1 }
      }),
      now: 2001
    });

    expect(second.ok).toBe(false);
    expect(second.reason).toBe('not_enough_wb');
    expect(getSpendableWalkerBucks(second.state)).toBe(20);
    expect(second.state.upgrades.walking_stick).toBeUndefined();
  });

  it('applies upgrade DPS immediately and removes it if settlement rolls back', () => {
    const state = withWalkerBucksBalance(createInitialGameState(1000), 100);
    const upgrade = UPGRADES.find((entry) => entry.id === 'starter_shoes');
    if (!upgrade) throw new Error('starter_shoes upgrade is missing');

    const beforeDps = getIdleMilesPerSecond(state);
    const bought = buyOfferFastOptimistic(state, {
      supabaseUserId: 'user_1',
      accountId: 'acct_test',
      purchaseId: 'purchase_dps',
      offerId: upgrade.id,
      itemDefId: upgrade.id,
      itemName: upgrade.name,
      price: 15,
      sourceType: 'upgrade',
      sourceId: `${upgrade.id}:level_1`,
      dpsDelta: upgrade.effectValue,
      applyPurchase: (prev) => ({
        ...prev,
        upgrades: { ...prev.upgrades, [upgrade.id]: 1 }
      }),
      now: 2000
    });

    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(getIdleMilesPerSecond(bought.state)).toBeGreaterThan(beforeDps);
    expect(bought.state.upgrades[upgrade.id]).toBe(1);

    const rolledBack = rollbackOptimisticPurchase(bought.state, 'purchase_dps', 3000);
    expect(rolledBack.upgrades[upgrade.id]).toBeUndefined();
    expect(getIdleMilesPerSecond(rolledBack)).toBe(beforeDps);
    expect(getWtwWalletState(rolledBack).pendingSpend).toBe(0);
    expect(rolledBack.walkerBucksBridge.purchases.purchase_dps.status).toBe('rolled_back');
  });

  it('keeps settled purchase records without counting them as pending spend', () => {
    const state = withWalkerBucksBalance(createInitialGameState(1000), 100);
    const bought = buyOfferFastOptimistic(state, {
      supabaseUserId: 'user_1',
      accountId: 'acct_test',
      purchaseId: 'purchase_settled',
      offerId: 'offer_trail_mix_main',
      itemDefId: 'trail_mix',
      itemName: 'Trail Mix',
      price: 40,
      sourceType: 'catalog_offer',
      sourceId: 'offer_trail_mix_main:purchase_1',
      dpsDelta: 0,
      applyPurchase: (prev) => applyCatalogOfferPurchase(prev, 'offer_trail_mix_main'),
      now: 2000
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.purchase.idempotencyKey).toBe('wtw:supabase:user_1:shop:offer_trail_mix_main:purchase_settled');
    expect(bought.state.inventory.items.trail_mix).toBe(1);

    const settled = markWtwPurchaseSettled(
      {
        ...bought.state,
        walkerBucksBridge: {
          ...bought.state.walkerBucksBridge,
          balance: {
            assetCode: 'WB',
            balance: 60,
            lockedBalance: 0,
            availableBalance: 60,
            updatedAt: 2500
          }
        }
      },
      'purchase_settled',
      'txn_123',
      3000
    );

    expect(settled.walkerBucksBridge.purchases.purchase_settled.status).toBe('settled');
    expect(settled.walkerBucksBridge.purchases.purchase_settled.idempotencyKey).toBe(
      'wtw:supabase:user_1:shop:offer_trail_mix_main:purchase_settled'
    );
    expect(getWtwWalletState(settled)).toMatchObject({
      syncedWbBalance: 60,
      pendingSpend: 0,
      displayedWbBalance: 60,
      spendableWb: 60
    });
  });
});
