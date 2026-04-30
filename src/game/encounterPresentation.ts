import type { ItemImageCandidate } from './itemImages';
import { getCatalogInventoryItemById } from './items';
import type { RandomEventDefinition, RouteEncounterChoice, RouteEncounterDefinition } from './types';

export type EncounterSprite = {
  sheet: string;
  col: number;
  row: number;
  label: string;
};

export type EncounterPresentation = {
  accent: string;
  item?: ItemImageCandidate;
  sprite?: EncounterSprite;
  kicker: string;
};

const roguelikeCharacterSheet = '/assets/characters/encounters/roguelikeChar_transparent.png';

const sprite = (col: number, row: number, label: string): EncounterSprite => ({
  sheet: roguelikeCharacterSheet,
  col,
  row,
  label
});

const looseWalkerBuck: ItemImageCandidate = {
  id: 'loose_walkerbuck',
  name: 'Loose WalkerBuck',
  assetFilename: 'loose_walkerbuck.png',
  itemType: 'collectible'
};

const eventOnlyItems: Record<string, ItemImageCandidate> = {
  energy_drink: {
    id: 'energy_drink',
    name: 'Energy Drink',
    assetFilename: 'energy_drink.png',
    itemType: 'consumable'
  },
  loose_walkerbuck: looseWalkerBuck,
  mystery_backpack: {
    id: 'mystery_backpack',
    name: 'Mystery Backpack',
    assetFilename: 'mystery_backpack.png',
    itemType: 'collectible'
  }
};

export const getItemPresentation = (itemId: string): ItemImageCandidate =>
  getCatalogInventoryItemById(itemId) ?? eventOnlyItems[itemId] ?? {
    id: itemId,
    name: itemId.replace(/_/g, ' '),
    assetFilename: `${itemId}.png`,
    itemType: 'collectible'
  };

const randomEventPresentation: Record<string, EncounterPresentation> = {
  speed_breeze: {
    accent: '#38bdf8',
    item: getItemPresentation('lucky_laces_item'),
    kicker: 'Boost'
  },
  loose_walkerbuck: {
    accent: '#facc15',
    item: looseWalkerBuck,
    kicker: 'Found'
  },
  snack_cache: {
    accent: '#f97316',
    item: getItemPresentation('trail_mix'),
    kicker: 'Item'
  },
  lost_postcard: {
    accent: '#fb7185',
    item: getItemPresentation('walkertown_postcard'),
    kicker: 'Item'
  },
  big_lunge: {
    accent: '#22c55e',
    item: getItemPresentation('lucky_laces_item'),
    kicker: 'Stride'
  },
  energy_drink: {
    accent: '#34d399',
    item: eventOnlyItems.energy_drink,
    kicker: 'Boost'
  },
  trail_dog_zoomies: {
    accent: '#a78bfa',
    sprite: sprite(0, 7, 'Trail friend'),
    kicker: 'Crew'
  },
  mystery_backpack: {
    accent: '#f59e0b',
    item: eventOnlyItems.mystery_backpack,
    sprite: sprite(1, 7, 'Pack scout'),
    kicker: 'Mystery'
  },
  route_marker_found: {
    accent: '#60a5fa',
    item: getItemPresentation('route_marker'),
    kicker: 'Item'
  },
  fake_shortcut: {
    accent: '#94a3b8',
    item: getItemPresentation('route_marker'),
    kicker: 'Route'
  },
  golden_shoe: {
    accent: '#facc15',
    item: getItemPresentation('golden_wayfarers_item'),
    kicker: 'Legendary'
  }
};

const routeEncounterPresentation: Record<string, EncounterPresentation> = {
  route_pickup: {
    accent: '#f97316',
    item: getItemPresentation('trail_mix'),
    sprite: sprite(0, 8, 'Trail scout'),
    kicker: 'Pickup'
  },
  split_path: {
    accent: '#60a5fa',
    item: getItemPresentation('route_marker'),
    sprite: sprite(1, 8, 'Route guide'),
    kicker: 'Choice'
  },
  street_boost: {
    accent: '#34d399',
    item: getItemPresentation('energy_drink'),
    sprite: sprite(0, 9, 'Street coach'),
    kicker: 'Boost'
  },
  tiny_stash: {
    accent: '#facc15',
    item: looseWalkerBuck,
    sprite: sprite(1, 9, 'Stash keeper'),
    kicker: 'Stash'
  }
};

export const getRandomEventPresentation = (event: RandomEventDefinition): EncounterPresentation =>
  randomEventPresentation[event.id] ?? {
    accent: '#facc15',
    item: event.itemId ? getItemPresentation(event.itemId) : undefined,
    kicker: event.rarity
  };

export const getRouteEncounterPresentation = (encounter: RouteEncounterDefinition): EncounterPresentation =>
  routeEncounterPresentation[encounter.id] ?? {
    accent: '#facc15',
    kicker: encounter.rarity
  };

export const getRouteChoiceItems = (choice: RouteEncounterChoice): ItemImageCandidate[] =>
  choice.effects.flatMap((effect) => {
    if (effect.type === 'item_drop' && effect.itemId) return [getItemPresentation(effect.itemId)];
    if (effect.type === 'local_wb') return [looseWalkerBuck];
    if (effect.type === 'distance') return [getItemPresentation('route_marker')];
    if (effect.type === 'temporary_boost') {
      if (effect.boostType === 'event_reward_multiplier') return [getItemPresentation('detour_token')];
      return [eventOnlyItems.energy_drink];
    }
    return [];
  });
