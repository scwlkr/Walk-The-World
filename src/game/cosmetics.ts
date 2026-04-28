import type { CosmeticDefinition, CosmeticEffectType, CosmeticSlot, GameState } from './types';

export const COSMETICS: CosmeticDefinition[] = [
  {
    id: 'retro_sweatband',
    itemId: 'retro_sweatband_item',
    name: 'Retro Sweatband',
    description: 'A bright headband that turns effort into slightly better WB gains.',
    slot: 'head',
    rarity: 'common',
    effect: {
      type: 'wb_multiplier',
      value: 0.05
    }
  },
  {
    id: 'lucky_laces',
    itemId: 'lucky_laces_item',
    name: 'Lucky Laces',
    description: 'Shoelaces that make every manual tap feel a little stronger.',
    slot: 'shoes',
    rarity: 'uncommon',
    effect: {
      type: 'click_power_multiplier',
      value: 0.08
    }
  },
  {
    id: 'golden_wayfarers',
    itemId: 'golden_wayfarers_item',
    name: 'Golden Wayfarers',
    description: 'Too shiny for jogging, perfect for spotting better random-event rewards.',
    slot: 'face',
    rarity: 'rare',
    effect: {
      type: 'event_reward_multiplier',
      value: 0.1
    }
  }
];

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
    case 'idle_speed_multiplier':
      return `${bonus} idle speed`;
    case 'click_power_multiplier':
      return `${bonus} tap distance`;
    case 'wb_multiplier':
      return `${bonus} WB per mile`;
    case 'event_reward_multiplier':
      return `${bonus} random-event rewards`;
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
  }
};
