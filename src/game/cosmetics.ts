import generatedItems from '../data/generated/items.generated.json';
import { getCosmeticIdForItemId } from './items';
import type { CosmeticDefinition, CosmeticEffectType, CosmeticSlot, GameState, ItemRarity } from './types';

type GeneratedItem = {
  itemId: string;
  slug?: string;
  name: string;
  itemType: string;
  rarity: string;
  description: string;
  effectType: string;
  effect_value: number | null;
  assetPath: string;
  assetFilename: string;
};

const RARITIES = new Set<ItemRarity>(['common', 'uncommon', 'rare', 'epic', 'legendary']);

const normalizeRarity = (rarity: string): ItemRarity =>
  RARITIES.has(rarity as ItemRarity) ? (rarity as ItemRarity) : 'common';

const getSlotForCosmeticItem = (item: GeneratedItem): CosmeticSlot => {
  const name = item.name.toLowerCase();
  if (name.includes('lace') || name.includes('shoe')) return 'shoes';
  if (name.includes('sunglasses') || name.includes('wayfarer')) return 'face';
  if (name.includes('sweatband') || name.includes('hat')) return 'head';
  if (name.includes('overall')) return 'body';
  return 'flair';
};

const getCosmeticEffect = (item: GeneratedItem): CosmeticDefinition['effect'] => {
  switch (item.itemId) {
    case 'retro_sweatband_item':
      return { type: 'follower_morale_bonus', value: 0.05 };
    case 'lucky_laces_item':
      return { type: 'follower_leave_chance_reduction', value: 0.08 };
    case 'golden_wayfarers_item':
      return { type: 'follower_leave_chance_reduction', value: 0.12 };
    case 'gas_station_sunglasses':
      return { type: 'follower_morale_bonus', value: 0.03 };
    case 'industrial_farmer_overalls':
      return { type: 'follower_morale_bonus', value: 0.1 };
  }

  switch (item.effectType) {
    case 'wb_multiplier':
      return { type: 'wb_multiplier', value: item.effect_value ?? 0.01 };
    case 'click_power_multiplier':
      return { type: 'click_power_multiplier', value: item.effect_value ?? 0.01 };
    case 'event_reward_multiplier':
      return { type: 'event_reward_multiplier', value: item.effect_value ?? 0.01 };
    case 'cosmetic_equip':
      return { type: 'follower_morale_bonus', value: 0.02 };
    default:
      return { type: 'style_only', value: 0 };
  }
};

export const COSMETICS: CosmeticDefinition[] = (generatedItems as GeneratedItem[])
  .filter((item) => item.itemType === 'cosmetic')
  .map((item) => ({
    id: getCosmeticIdForItemId(item.itemId),
    itemId: item.itemId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    slot: getSlotForCosmeticItem(item),
    rarity: normalizeRarity(item.rarity),
    assetPath: item.assetPath,
    assetFilename: item.assetFilename,
    effect: getCosmeticEffect(item)
  }));

export const getCosmeticById = (cosmeticId: string): CosmeticDefinition | undefined =>
  COSMETICS.find((cosmetic) => cosmetic.id === cosmeticId);

export const getEquippedCosmetics = (state: GameState): CosmeticDefinition[] =>
  Object.values(state.cosmetics.equippedBySlot)
    .map((cosmeticId) => (cosmeticId ? getCosmeticById(cosmeticId) : undefined))
    .filter((cosmetic): cosmetic is CosmeticDefinition => Boolean(cosmetic));

export const getCosmeticEffectBonus = (state: GameState, effectType: CosmeticEffectType): number =>
  getEquippedCosmetics(state)
    .filter((cosmetic) => cosmetic.effect.type === effectType)
    .reduce((sum, cosmetic) => sum + cosmetic.effect.value, 0);

export const formatPercentBonus = (value: number): string => `+${Math.round(value * 100)}%`;

export const formatCosmeticEffect = (cosmetic: CosmeticDefinition): string => {
  const bonus = formatPercentBonus(cosmetic.effect.value);

  switch (cosmetic.effect.type) {
    case 'style_only':
      return 'Style unlock';
    case 'idle_speed_multiplier':
      return `${bonus} idle speed`;
    case 'click_power_multiplier':
      return `${bonus} tap distance`;
    case 'wb_multiplier':
      return `${bonus} WB per mile`;
    case 'event_reward_multiplier':
      return `${bonus} random-event rewards`;
    case 'follower_morale_bonus':
      return `${bonus} follower morale`;
    case 'follower_leave_chance_reduction':
      return `${bonus} follower stability`;
  }
};

export const equipCosmetic = (state: GameState, cosmeticId: string): GameState => {
  const cosmetic = getCosmeticById(cosmeticId);
  if (!cosmetic || !state.cosmetics.owned[cosmetic.id]) return state;

  const currentlyEquipped = state.cosmetics.equippedBySlot[cosmetic.slot];
  if (currentlyEquipped === cosmetic.id) return state;

  return {
    ...state,
    cosmetics: {
      ...state.cosmetics,
      equippedBySlot: {
        ...state.cosmetics.equippedBySlot,
        [cosmetic.slot]: cosmetic.id
      }
    },
    stats: {
      ...state.stats,
      cosmeticsEquipped: state.stats.cosmeticsEquipped + 1
    },
    ui: {
      ...state.ui,
      toast: `${cosmetic.name} equipped.`
    }
  };
};

export const getCosmeticSlotLabel = (slot: CosmeticSlot): string => {
  switch (slot) {
    case 'head':
      return 'Head';
    case 'face':
      return 'Face';
    case 'shoes':
      return 'Shoes';
    case 'body':
      return 'Body';
    case 'flair':
      return 'Flair';
  }
};
