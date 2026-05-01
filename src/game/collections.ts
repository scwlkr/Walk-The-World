import { COSMETICS } from './cosmetics';
import { getUnlockedRegions } from './regions';
import type { GameState, InventoryItemDefinition, ItemRarity } from './types';
import { INVENTORY_ITEMS, getInventoryQuantity } from './inventory';

export type ProfileTitleDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
};

export type CollectionGoalDefinition = {
  id: string;
  name: string;
  description: string;
  target: number;
  titleId: string;
  getProgress: (state: GameState) => number;
};

const RARE_RARITIES = new Set<ItemRarity>(['rare', 'epic', 'legendary']);

export const PROFILE_TITLES: ProfileTitleDefinition[] = [
  {
    id: 'tiny_collection_flex',
    name: 'Tiny Collection Flex',
    description: 'Own a small but real backpack set.',
    rarity: 'uncommon'
  },
  {
    id: 'route_souvenir_hunter',
    name: 'Route Souvenir Hunter',
    description: 'Collect keepsakes across the route.',
    rarity: 'uncommon'
  },
  {
    id: 'rare_route_flex',
    name: 'Rare Route Flex',
    description: 'Own enough rare finds to make the backpack interesting.',
    rarity: 'rare'
  },
  {
    id: 'fit_check_captain',
    name: 'Fit Check Captain',
    description: 'Build a cosmetic closet with actual crew impact.',
    rarity: 'rare'
  },
  {
    id: 'world_tour_cartographer',
    name: 'World Tour Cartographer',
    description: 'Reach enough places to make the map feel earned.',
    rarity: 'epic'
  },
  {
    id: 'skill_issue',
    name: 'Skill Issue Survivor',
    description: 'Unlocked from the Skill Issue Stamp.',
    rarity: 'common'
  },
  {
    id: 'certified_ledger_receipt',
    name: 'Certified Ledger Walker',
    description: 'Unlocked from a rare ledger collectible.',
    rarity: 'rare'
  },
  {
    id: 'server_pension_bond',
    name: 'Server Pensioner',
    description: 'Unlocked from the long-horizon pension collectible.',
    rarity: 'legendary'
  },
  {
    id: 'world_tour_pin',
    name: 'World Tour Pin',
    description: 'Unlocked from a rare world-tour collectible.',
    rarity: 'rare'
  }
];

const getOwnedInventoryItems = (state: GameState): InventoryItemDefinition[] =>
  INVENTORY_ITEMS.filter((item) => getInventoryQuantity(state, item.id) > 0);

const getOwnedCollectibles = (state: GameState): InventoryItemDefinition[] =>
  getOwnedInventoryItems(state).filter((item) => item.type === 'collectible');

const getRareOwnedItems = (state: GameState): InventoryItemDefinition[] =>
  getOwnedInventoryItems(state).filter((item) => RARE_RARITIES.has(item.rarity));

export const COLLECTION_GOALS: CollectionGoalDefinition[] = [
  {
    id: 'starter_backpack_set',
    name: 'Starter Backpack Set',
    description: 'Own six different items.',
    target: 6,
    titleId: 'tiny_collection_flex',
    getProgress: (state) => getOwnedInventoryItems(state).length
  },
  {
    id: 'souvenir_shelf',
    name: 'Souvenir Shelf',
    description: 'Own five collectibles.',
    target: 5,
    titleId: 'route_souvenir_hunter',
    getProgress: (state) => getOwnedCollectibles(state).length
  },
  {
    id: 'rare_case',
    name: 'Rare Case',
    description: 'Own three rare, epic, or legendary items.',
    target: 3,
    titleId: 'rare_route_flex',
    getProgress: (state) => getRareOwnedItems(state).length
  },
  {
    id: 'fit_check',
    name: 'Fit Check',
    description: 'Own three cosmetics.',
    target: 3,
    titleId: 'fit_check_captain',
    getProgress: (state) => COSMETICS.filter((cosmetic) => state.cosmetics.owned[cosmetic.id]).length
  },
  {
    id: 'world_tour_map',
    name: 'World Tour Map',
    description: 'Reach twelve Earth regions.',
    target: 12,
    titleId: 'world_tour_cartographer',
    getProgress: (state) => getUnlockedRegions(state).length
  }
];

export const getProfileTitleById = (titleId: string | null | undefined): ProfileTitleDefinition | undefined =>
  titleId ? PROFILE_TITLES.find((title) => title.id === titleId) : undefined;

export const getCollectionGoalProgress = (
  state: GameState,
  goal: CollectionGoalDefinition
): { progress: number; completed: boolean } => {
  const progress = Math.min(goal.target, goal.getProgress(state));
  return {
    progress,
    completed: progress >= goal.target
  };
};

export const getUnlockedProfileTitles = (state: GameState): ProfileTitleDefinition[] => {
  const unlocked = new Set(
    Object.entries(state.profile.unlockedTitles)
      .filter(([, value]) => value)
      .map(([titleId]) => titleId)
  );

  for (const goal of COLLECTION_GOALS) {
    if (getCollectionGoalProgress(state, goal).completed) {
      unlocked.add(goal.titleId);
    }
  }

  return PROFILE_TITLES.filter((title) => unlocked.has(title.id));
};

export const canUseProfileTitle = (state: GameState, titleId: string): boolean =>
  getUnlockedProfileTitles(state).some((title) => title.id === titleId);

export const selectProfileTitle = (state: GameState, titleId: string | null): GameState => {
  if (!titleId) {
    return {
      ...state,
      profile: {
        ...state.profile,
        activeTitleId: null
      },
      ui: {
        ...state.ui,
        toast: 'Title cleared.'
      }
    };
  }

  const title = getProfileTitleById(titleId);
  if (!title || !canUseProfileTitle(state, title.id)) return state;

  return {
    ...state,
    profile: {
      ...state.profile,
      unlockedTitles: {
        ...state.profile.unlockedTitles,
        [title.id]: true
      },
      activeTitleId: title.id
    },
    ui: {
      ...state.ui,
      toast: `${title.name} equipped.`
    }
  };
};

export const getCollectionSummary = (state: GameState) => ({
  ownedItems: getOwnedInventoryItems(state).length,
  totalItems: INVENTORY_ITEMS.length,
  rareItems: getRareOwnedItems(state).length,
  cosmeticsOwned: COSMETICS.filter((cosmetic) => state.cosmetics.owned[cosmetic.id]).length,
  titlesUnlocked: getUnlockedProfileTitles(state).length
});
