import { COSMETICS, formatPercentBonus } from './cosmetics';
import { queueWalkerBucksGrantAmount } from './economy';
import { INVENTORY_CATALOG_ITEMS } from './items';
import type { GameState, InventoryEffectType, InventoryItemDefinition, RewardDefinition } from './types';

export const INVENTORY_ITEMS: InventoryItemDefinition[] = INVENTORY_CATALOG_ITEMS;

export const getInventoryItemById = (itemId: string): InventoryItemDefinition | undefined =>
  INVENTORY_ITEMS.find((item) => item.id === itemId);

export const getInventoryQuantity = (state: GameState, itemId: string): number => state.inventory.items[itemId] ?? 0;

export const isInventoryItemUsable = (item: InventoryItemDefinition): boolean =>
  item.type === 'consumable' &&
  Boolean(item.effect) &&
  [
    'instant_wb',
    'currency_grant',
    'speed_multiplier_temp',
    'tap_multiplier_temp',
    'event_reward_multiplier',
    'drop_rate_boost_temp',
    'follower_stability_temp',
    'follower_recruit_temp'
  ].includes(item.effect?.type ?? 'none');

const normalizeQuantity = (quantity: number): number => Math.max(1, Math.floor(quantity));

const appendRecentReward = (state: GameState, label: string, now = Date.now()): GameState => ({
  ...state,
  ui: {
    ...state.ui,
    recentRewards: [
      { id: `reward_${now}_${state.ui.recentRewards.length}`, label, createdAt: now },
      ...state.ui.recentRewards
    ].slice(0, 4)
  }
});

export const grantRewardToState = (state: GameState, reward: RewardDefinition): GameState => {
  let next: GameState = state;
  const rewardLabels: string[] = [];

  if (reward.walkerBucks && reward.walkerBucks > 0) {
    const gain = Math.floor(reward.walkerBucks);
    next = queueWalkerBucksGrantAmount(next, gain);
    rewardLabels.push(`+${gain.toLocaleString()} WB`);
  }

  const itemRewards = reward.items ?? [];
  const cosmeticRewards = reward.cosmetics ?? [];
  const titleRewards = reward.titleIds ?? [];
  if (itemRewards.length === 0 && cosmeticRewards.length === 0 && titleRewards.length === 0) {
    return rewardLabels.length ? appendRecentReward(next, rewardLabels.join(', ')) : next;
  }

  const items = { ...next.inventory.items };
  const ownedCosmetics = { ...next.cosmetics.owned };
  const unlockedTitles = { ...next.profile.unlockedTitles };

  for (const itemReward of itemRewards) {
    const quantity = normalizeQuantity(itemReward.quantity);
    items[itemReward.itemId] = (items[itemReward.itemId] ?? 0) + quantity;
    rewardLabels.push(`${quantity} item`);

    const item = getInventoryItemById(itemReward.itemId);
    if (item?.type === 'cosmetic' && item.cosmeticId) {
      ownedCosmetics[item.cosmeticId] = true;
    }
    if (item?.titleId) {
      unlockedTitles[item.titleId] = true;
    }
  }

  for (const cosmeticId of cosmeticRewards) {
    const cosmetic = COSMETICS.find((entry) => entry.id === cosmeticId);
    if (!cosmetic) continue;
    ownedCosmetics[cosmetic.id] = true;
    items[cosmetic.itemId] = Math.max(1, items[cosmetic.itemId] ?? 0);
    rewardLabels.push(cosmetic.name);
  }

  for (const titleId of titleRewards) {
    unlockedTitles[titleId] = true;
    rewardLabels.push(`${titleId.replace(/_/g, ' ')} title`);
  }

  return appendRecentReward({
    ...next,
    inventory: {
      ...next.inventory,
      items
    },
    cosmetics: {
      ...next.cosmetics,
      owned: ownedCosmetics
    },
    profile: {
      ...next.profile,
      unlockedTitles,
      activeTitleId: next.profile.activeTitleId ?? titleRewards[0] ?? null
    }
  }, rewardLabels.join(', '));
};

export const useInventoryItem = (state: GameState, itemId: string): GameState => {
  const item = getInventoryItemById(itemId);
  const quantity = getInventoryQuantity(state, itemId);
  if (!item || !isInventoryItemUsable(item) || quantity <= 0 || !item.effect) return state;

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

  if (item.effect.type === 'instant_wb' || item.effect.type === 'currency_grant') {
    const gain = Math.floor(item.effect.value);
    const withGrant = queueWalkerBucksGrantAmount(next, gain);
    next = {
      ...withGrant,
      ui: {
        ...withGrant.ui,
        toast: `${item.name} used. +${gain} WB. WalkerBucks updating.`
      }
    };
  }

  if (
    item.effect.type === 'speed_multiplier_temp' ||
    item.effect.type === 'tap_multiplier_temp' ||
    item.effect.type === 'event_reward_multiplier' ||
    item.effect.type === 'drop_rate_boost_temp' ||
    item.effect.type === 'follower_stability_temp' ||
    item.effect.type === 'follower_recruit_temp'
  ) {
    const durationMs = Math.max(10, item.effect.durationSeconds ?? 900) * 1000;
    const effectType =
      item.effect.type === 'speed_multiplier_temp'
        ? 'speed_multiplier'
        : item.effect.type === 'tap_multiplier_temp'
        ? 'click_multiplier'
        : item.effect.type === 'drop_rate_boost_temp'
          ? 'drop_rate_multiplier'
          : item.effect.type === 'follower_stability_temp'
            ? 'follower_stability_multiplier'
            : item.effect.type === 'follower_recruit_temp'
              ? 'follower_recruit_multiplier'
          : 'event_reward_multiplier';
    next = {
      ...next,
      activeBoosts: [
        ...next.activeBoosts,
        {
          id: `item_${item.id}_${Date.now()}`,
          sourceEventId: item.id,
          effectType,
          multiplier: 1 + item.effect.value,
          expiresAt: Date.now() + durationMs
        }
      ],
      ui: {
        ...next.ui,
        toast: `${item.name} boost active.`
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
    case 'none':
    case 'souvenir_collectible':
      return item.type;
    case 'instant_wb':
    case 'currency_grant':
      return `Use: +${Math.floor(item.effect.value)} WB`;
    case 'wb_multiplier':
      return `${formatPercentBonus(item.effect.value)} WB per mile`;
    case 'speed_multiplier_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} DPS boost`;
    case 'tap_multiplier_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} tap boost`;
    case 'event_reward_multiplier':
      return `Use: ${formatPercentBonus(item.effect.value)} event rewards`;
    case 'drop_rate_boost_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} drop luck`;
    case 'follower_stability_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} follower stability`;
    case 'follower_recruit_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} recruit chance`;
    case 'cosmetic_equip':
      return 'Cosmetic equip';
    case 'title_unlock':
      return 'Unlocks a profile title';
    case 'travel_theme_unlock':
      return 'Unlocks a route vibe';
    case 'daily_streak_freeze':
      return 'Protects a daily streak';
    case 'step_reward_bonus_temp':
      return `Use: ${formatPercentBonus(item.effect.value)} step reward boost`;
  }
};
