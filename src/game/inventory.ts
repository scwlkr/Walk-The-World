import { COSMETICS, formatPercentBonus } from './cosmetics';
import type { GameState, InventoryEffectType, InventoryItemDefinition, RewardDefinition } from './types';

export const INVENTORY_ITEMS: InventoryItemDefinition[] = [
  {
    id: 'trail_mix',
    name: 'Questionable Trail Mix',
    description: 'A pocket snack that converts instantly into a small local WB bump.',
    type: 'consumable',
    rarity: 'common',
    effect: {
      type: 'instant_wb',
      value: 35
    }
  },
  {
    id: 'walkertown_postcard',
    name: 'Walkertown Postcard',
    description: 'A collectible proof that the first route still matters.',
    type: 'collectible',
    rarity: 'common'
  },
  {
    id: 'starter_step_counter',
    name: 'Starter Step Counter',
    description: 'Entry-level equipment that squeezes a little more WB out of each mile.',
    type: 'equipment',
    rarity: 'uncommon',
    effect: {
      type: 'wb_multiplier',
      value: 0.03
    }
  },
  {
    id: 'retro_sweatband_item',
    name: 'Retro Sweatband',
    description: 'Cosmetic headwear with a small WB-per-mile bonus.',
    type: 'cosmetic',
    rarity: 'common',
    cosmeticId: 'retro_sweatband'
  },
  {
    id: 'lucky_laces_item',
    name: 'Lucky Laces',
    description: 'Cosmetic shoes that improve manual tap distance.',
    type: 'cosmetic',
    rarity: 'uncommon',
    cosmeticId: 'lucky_laces'
  },
  {
    id: 'golden_wayfarers_item',
    name: 'Golden Wayfarers',
    description: 'Cosmetic eyewear that improves random-event rewards.',
    type: 'cosmetic',
    rarity: 'rare',
    cosmeticId: 'golden_wayfarers'
  }
];

export const getInventoryItemById = (itemId: string): InventoryItemDefinition | undefined =>
  INVENTORY_ITEMS.find((item) => item.id === itemId);

export const getInventoryQuantity = (state: GameState, itemId: string): number => state.inventory.items[itemId] ?? 0;

const normalizeQuantity = (quantity: number): number => Math.max(1, Math.floor(quantity));

export const grantRewardToState = (state: GameState, reward: RewardDefinition): GameState => {
  let next: GameState = state;

  if (reward.walkerBucks && reward.walkerBucks > 0) {
    const gain = Math.floor(reward.walkerBucks);
    next = {
      ...next,
      walkerBucks: next.walkerBucks + gain,
      totalWalkerBucksEarned: next.totalWalkerBucksEarned + gain
    };
  }

  const itemRewards = reward.items ?? [];
  const cosmeticRewards = reward.cosmetics ?? [];
  if (itemRewards.length === 0 && cosmeticRewards.length === 0) return next;

  const items = { ...next.inventory.items };
  const ownedCosmetics = { ...next.cosmetics.owned };

  for (const itemReward of itemRewards) {
    const quantity = normalizeQuantity(itemReward.quantity);
    items[itemReward.itemId] = (items[itemReward.itemId] ?? 0) + quantity;

    const item = getInventoryItemById(itemReward.itemId);
    if (item?.type === 'cosmetic' && item.cosmeticId) {
      ownedCosmetics[item.cosmeticId] = true;
    }
  }

  for (const cosmeticId of cosmeticRewards) {
    const cosmetic = COSMETICS.find((entry) => entry.id === cosmeticId);
    if (!cosmetic) continue;
    ownedCosmetics[cosmetic.id] = true;
    items[cosmetic.itemId] = Math.max(1, items[cosmetic.itemId] ?? 0);
  }

  return {
    ...next,
    inventory: {
      ...next.inventory,
      items
    },
    cosmetics: {
      ...next.cosmetics,
      owned: ownedCosmetics
    }
  };
};

export const useInventoryItem = (state: GameState, itemId: string): GameState => {
  const item = getInventoryItemById(itemId);
  const quantity = getInventoryQuantity(state, itemId);
  if (!item || item.type !== 'consumable' || quantity <= 0 || !item.effect) return state;

  const items = { ...state.inventory.items, [itemId]: quantity - 1 };
  if (items[itemId] <= 0) delete items[itemId];

  let next: GameState = {
    ...state,
    inventory: {
      ...state.inventory,
      items,
      usedConsumables: {
        ...state.inventory.usedConsumables,
        [itemId]: (state.inventory.usedConsumables[itemId] ?? 0) + 1
      }
    },
    stats: {
      ...state.stats,
      itemsUsed: state.stats.itemsUsed + 1
    }
  };

  if (item.effect.type === 'instant_wb') {
    const gain = Math.floor(item.effect.value);
    next = {
      ...next,
      walkerBucks: next.walkerBucks + gain,
      totalWalkerBucksEarned: next.totalWalkerBucksEarned + gain,
      ui: {
        ...next.ui,
        toast: `${item.name} used. +${gain} WB.`
      }
    };
  }

  return next;
};

export const equipEquipmentItem = (state: GameState, itemId: string): GameState => {
  const item = getInventoryItemById(itemId);
  if (!item || item.type !== 'equipment' || getInventoryQuantity(state, itemId) <= 0) return state;
  if (state.inventory.equippedEquipmentItemId === item.id) return state;

  return {
    ...state,
    inventory: {
      ...state.inventory,
      equippedEquipmentItemId: item.id
    },
    ui: {
      ...state.ui,
      toast: `${item.name} equipped.`
    }
  };
};

export const getEquipmentEffectBonus = (state: GameState, effectType: InventoryEffectType): number => {
  const equipped = state.inventory.equippedEquipmentItemId
    ? getInventoryItemById(state.inventory.equippedEquipmentItemId)
    : undefined;

  if (!equipped?.effect || equipped.effect.type !== effectType) return 0;
  return equipped.effect.value;
};

export const formatInventoryEffect = (item: InventoryItemDefinition): string => {
  if (!item.effect) return item.type;

  switch (item.effect.type) {
    case 'instant_wb':
      return `Use: +${Math.floor(item.effect.value)} WB`;
    case 'wb_multiplier':
      return `${formatPercentBonus(item.effect.value)} WB per mile`;
  }
};
