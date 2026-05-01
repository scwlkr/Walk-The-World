import { describe, expect, it } from 'vitest';
import { equipCosmetic } from '../src/game/cosmetics';
import { milesFromFeet } from '../src/game/distance';
import { FOLLOWERS, getFollowerLeaveChanceReduction, runFollowerDynamics } from '../src/game/followers';
import { createInitialGameState } from '../src/game/initialState';
import { getLocalCatalogShopOffers, getSharedInventoryEntitlements, purchaseLocalCatalogOffer } from '../src/game/items';
import { grantRewardToState, useInventoryItem } from '../src/game/inventory';
import { claimMilestoneReward, syncMilestones } from '../src/game/milestones';
import { resolveRouteEncounterChoice } from '../src/game/routeEncounters';
import { importSave } from '../src/game/save';
import { resolveRandomEvent } from '../src/game/tick';
import { canEnterWorld } from '../src/game/world';
import type { RandomEventDefinition, RouteEncounterChoice, WalkerBucksMarketplaceOffer } from '../src/game/types';

describe('retention milestones', () => {
  it('turns early distance into a claimable v0.1 milestone reward', () => {
    const state = createInitialGameState(1000);
    const synced = syncMilestones({
      ...state,
      stats: {
        ...state.stats,
        totalDistanceWalked: milesFromFeet(100)
      }
    }, 2000);
    const first = synced.milestones.progress.leave_the_couch;

    expect(first.completedAt).toBe(2000);

    const claimed = claimMilestoneReward(synced, 'leave_the_couch', 3000);
    expect(claimed.walkerBucksBridge.pendingGrantAmount).toBeGreaterThanOrEqual(10);
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

  it('uses v0.2 boost items through active boost state', () => {
    const state = {
      ...createInitialGameState(1000),
      inventory: {
        ...createInitialGameState(1000).inventory,
        items: {
          aura_battery: 1
        }
      }
    };
    const used = useInventoryItem(state, 'aura_battery');

    expect(used.inventory.items.aura_battery).toBeUndefined();
    expect(used.activeBoosts[0]?.effectType).toBe('click_multiplier');
    expect(used.stats.itemsUsed).toBe(1);
  });
});

describe('v0.2 followers and cosmetics', () => {
  it('lets followers recruit and leave through morale-gated dynamics', () => {
    const follower = FOLLOWERS.find((entry) => entry.id === 'neighborhood_walker');
    if (!follower) throw new Error('neighborhood_walker missing');

    const recruited = runFollowerDynamics(
      {
        ...createInitialGameState(1000),
        followers: { [follower.id]: 1 },
        followerMorale: { value: 86, recentStory: null, lastStoryAt: null }
      },
      60,
      2000,
      () => 0
    );

    expect(recruited.followers[follower.id]).toBe(2);
    expect(recruited.followerMorale.recentStory).toContain('recruited');

    const left = runFollowerDynamics(
      {
        ...createInitialGameState(1000),
        followers: { [follower.id]: follower.maxCount },
        followerMorale: { value: 18, recentStory: null, lastStoryAt: null }
      },
      60,
      3000,
      () => 0
    );

    expect(left.followers[follower.id]).toBe(follower.maxCount - 1);
    expect(left.followerMorale.recentStory).toContain('left');
  });

  it('equipped cosmetics reduce follower instability instead of minting local WalkerBucks', () => {
    const state = createInitialGameState(1000);
    const withCosmetic = grantRewardToState(state, {
      items: [{ itemId: 'lucky_laces_item', quantity: 1 }]
    });
    const equipped = equipCosmetic(withCosmetic, 'lucky_laces');

    expect(equipped.walkerBucks).toBe(0);
    expect(equipped.cosmetics.equippedBySlot.shoes).toBe('lucky_laces');
    expect(getFollowerLeaveChanceReduction(equipped)).toBeGreaterThan(0);
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

  it('migrates legacy saves into save version 11 v0.2 state', () => {
    const migrated = importSave(
      JSON.stringify({
        saveVersion: 1,
        currentWorldId: 'moon_locked',
        distanceMiles: 1.2,
        walkerBucks: 42
      })
    );

    expect(migrated.saveVersion).toBe(11);
    expect(migrated.currentWorldId).toBe('earth');
    expect(migrated.profile).toBeDefined();
    expect(migrated.followerMorale.value).toBeGreaterThan(0);
    expect(migrated.milestones.progress.leave_the_couch).toBeDefined();
    expect(migrated.spawnedRouteEncounter).toBeNull();
  });
});
