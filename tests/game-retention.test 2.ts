import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../src/game/initialState';
import { getLocalCatalogShopOffers, getSharedInventoryEntitlements, purchaseLocalCatalogOffer } from '../src/game/items';
import { useInventoryItem } from '../src/game/inventory';
import { claimMilestoneReward, syncMilestones } from '../src/game/milestones';
import { resolveRouteEncounterChoice } from '../src/game/routeEncounters';
import { importSave } from '../src/game/save';
import { resolveRandomEvent } from '../src/game/tick';
import { canEnterWorld } from '../src/game/world';
import type { RandomEventDefinition, RouteEncounterChoice, WalkerBucksMarketplaceOffer } from '../src/game/types';

describe('retention milestones', () => {
  it('turns the first tap into a claimable milestone reward', () => {
    const state = createInitialGameState(1000);
    const synced = syncMilestones({
      ...state,
      stats: {
        ...state.stats,
        totalClicks: 1
      }
    }, 2000);
    const first = synced.milestones.progress.first_30_seconds;

    expect(first.completedAt).toBe(2000);

    const claimed = claimMilestoneReward(synced, 'first_30_seconds', 3000);
    expect(claimed.walkerBucksBridge.pendingGrantAmount).toBeGreaterThanOrEqual(20);
    expect(claimed.inventory.items.trail_mix).toBe(1);
    expect(claimed.stats.milestonesClaimed).toBe(1);
  });
});

describe('catalog runtime adapter', () => {
  it('loads the generated catalog into catalog offers', () => {
    const state = createInitialGameState(1000);
    const offers = getLocalCatalogShopOffers({ ...state, walkerBucks: 500 });

    expect(offers.length).toBeGreaterThanOrEqual(12);
    expect(offers.some((offer) => offer.item.id === 'trail_mix')).toBe(true);
  });

  it('applies a generated catalog item after a WalkerBucks spend settles', () => {
    const state = createInitialGameState(1000);
    const bought = purchaseLocalCatalogOffer(state, 'offer_trail_mix_main');

    expect(bought.walkerBucks).toBe(0);
    expect(bought.inventory.items.trail_mix).toBe(1);
  });

  it('keeps future-only consumable effects inert instead of consuming them', () => {
    const state = {
      ...createInitialGameState(1000),
      inventory: {
        ...createInitialGameState(1000).inventory,
        items: {
          streak_insurance_policy: 1
        }
      }
    };
    const used = useInventoryItem(state, 'streak_insurance_policy');

    expect(used.inventory.items.streak_insurance_policy).toBe(1);
    expect(used.stats.itemsUsed).toBe(0);
  });
});

describe('route encounters', () => {
  it('resolves route encounter choices through the existing reward and boost model', () => {
    const state = createInitialGameState(1000);
    const choice: RouteEncounterChoice = {
      id: 'test_boost',
      label: 'Test boost',
      description: 'Test boost choice.',
      effects: [
        { type: 'walkerbucks_grant', value: 50 },
        { type: 'item_drop', itemId: 'detour_token', quantity: 1 },
        { type: 'temporary_boost', boostType: 'click_multiplier', multiplier: 1.5, durationMs: 10000 }
      ]
    };
    const resolved = resolveRouteEncounterChoice(state, choice, 2000);

    expect(resolved.walkerBucksBridge.pendingGrantAmount).toBe(50);
    expect(resolved.inventory.items.detour_token).toBe(1);
    expect(resolved.activeBoosts[0]?.effectType).toBe('click_multiplier');
    expect(resolved.stats.routeEncountersClaimed).toBe(1);
  });
});

describe('random item events', () => {
  it('grants catalog items through the existing inventory reward path', () => {
    const state = createInitialGameState(1000);
    const event: RandomEventDefinition = {
      id: 'test_item_drop',
      name: 'Test Item Drop',
      description: 'Drops an item.',
      rarity: 'common',
      durationMs: 0,
      weight: 1,
      effectType: 'item_drop',
      itemId: 'route_marker',
      quantity: 1
    };
    const resolved = resolveRandomEvent(state, event, 2000);

    expect(resolved.inventory.items.route_marker).toBe(1);
    expect(resolved.stats.randomEventsClaimed).toBe(1);
    expect(resolved.ui.toast).toContain('Route Marker');
  });
});

describe('shared inventory mapping', () => {
  it('maps WalkerBucks inventory instances to known catalog items when offer metadata exists', () => {
    const state = createInitialGameState(1000);
    const offer: WalkerBucksMarketplaceOffer = {
      id: 10,
      shopId: 1,
      itemDefinitionId: 77,
      name: 'Questionable Trail Mix',
      description: 'Shared test offer.',
      priceWb: 40,
      itemId: 'trail_mix'
    };
    const entitlements = getSharedInventoryEntitlements({
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        marketplaceOffers: [offer],
        inventory: [{ itemInstanceId: 'inst_1', itemDefinitionId: 77, status: 'owned' }]
      }
    });

    expect(entitlements[0]).toMatchObject({
      itemId: 'trail_mix',
      knownLocalItem: true,
      name: 'Questionable Trail Mix'
    });
  });
});

describe('worlds and save migration', () => {
  it('unlocks Mars prototype after one Moon loop', () => {
    const state = createInitialGameState(1000);
    const moonLooped = {
      ...state,
      worlds: {
        ...state.worlds,
        moon: {
          ...state.worlds.moon,
          loopsCompleted: 1,
          unlockedAt: 1000
        }
      }
    };

    expect(canEnterWorld(moonLooped, 'mars')).toBe(true);
  });

  it('migrates legacy saves into save version 9 retention state', () => {
    const migrated = importSave(
      JSON.stringify({
        saveVersion: 1,
        currentWorldId: 'moon_locked',
        distanceMiles: 1.2,
        walkerBucks: 42
      })
    );

    expect(migrated.saveVersion).toBe(9);
    expect(migrated.currentWorldId).toBe('earth');
    expect(migrated.profile).toBeDefined();
    expect(migrated.milestones.progress.first_30_seconds).toBeDefined();
    expect(migrated.spawnedRouteEncounter).toBeNull();
  });
});
