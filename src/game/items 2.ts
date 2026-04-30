import generatedItems from '../data/generated/items.generated.json';
import generatedShopOffers from '../data/generated/shop_offers.generated.json';
import type {
  GameState,
  InventoryEffectType,
  InventoryItemDefinition,
  InventoryItemType,
  ItemRarity,
  SharedInventoryEntitlement
} from './types';

type GeneratedItem = {
  itemId: string;
  slug?: string;
  name: string;
  category: string;
  itemType: string;
  rarity: string;
  description: string;
  flavorText?: string;
  effectType: string;
  effect_value: number | null;
  effect_duration_seconds: number | null;
  cooldown_seconds: number | null;
  assetFilename: string;
  assetPath: string;
  icon?: string;
  emoji?: string;
  implementationStatus: string;
  price_wb: number;
};

export type CatalogShopOffer = {
  offerId: string;
  shopId: string;
  itemId: string;
  priceWb: number;
  currency: 'WB';
  purchaseLimitPerAccount: number | null;
  unlockType: string;
  unlockValue: string;
  active: boolean;
  sortOrder: number;
};

export type LocalCatalogShopOffer = CatalogShopOffer & {
  item: InventoryItemDefinition;
  unlocked: boolean;
  ownedQuantity: number;
  lockedReason: string | null;
};

const CATALOG_ITEMS = generatedItems as GeneratedItem[];
const CATALOG_SHOP_OFFERS = generatedShopOffers as CatalogShopOffer[];

const ITEM_TYPES = new Set<InventoryItemType>(['consumable', 'collectible', 'equipment', 'cosmetic']);
const RARITIES = new Set<ItemRarity>(['common', 'uncommon', 'rare', 'epic', 'legendary']);
const EFFECT_TYPES = new Set<InventoryEffectType>([
  'none',
  'instant_wb',
  'currency_grant',
  'wb_multiplier',
  'tap_multiplier_temp',
  'event_reward_multiplier',
  'drop_rate_boost_temp',
  'souvenir_collectible',
  'cosmetic_equip',
  'title_unlock',
  'travel_theme_unlock',
  'daily_streak_freeze',
  'step_reward_bonus_temp'
]);

const normalizeItemType = (itemType: string): InventoryItemType =>
  ITEM_TYPES.has(itemType as InventoryItemType) ? (itemType as InventoryItemType) : 'collectible';

const normalizeRarity = (rarity: string): ItemRarity =>
  RARITIES.has(rarity as ItemRarity) ? (rarity as ItemRarity) : 'common';

const normalizeEffectType = (effectType: string): InventoryEffectType =>
  EFFECT_TYPES.has(effectType as InventoryEffectType) ? (effectType as InventoryEffectType) : 'none';

export const getCosmeticIdForItemId = (itemId: string): string => itemId.replace(/_item$/, '');

export const getTitleIdForItemId = (itemId: string): string => itemId.replace(/_item$/, '').replace(/_stamp$/, '');

export const mapCatalogItemToInventoryItem = (item: GeneratedItem): InventoryItemDefinition => {
  const effectType = normalizeEffectType(item.effectType);
  const effectValue = item.effect_value ?? (effectType === 'none' || effectType === 'cosmetic_equip' ? 0 : 1);

  return {
    id: item.itemId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    type: normalizeItemType(item.itemType),
    category: item.category,
    rarity: normalizeRarity(item.rarity),
    flavorText: item.flavorText,
    assetPath: item.assetPath,
    assetFilename: item.assetFilename,
    effect:
      effectType === 'none' || effectType === 'souvenir_collectible'
        ? undefined
        : {
            type: effectType,
            value: effectValue,
            durationSeconds: item.effect_duration_seconds,
            cooldownSeconds: item.cooldown_seconds
          },
    cosmeticId: item.itemType === 'cosmetic' ? getCosmeticIdForItemId(item.itemId) : undefined,
    titleId: effectType === 'title_unlock' ? getTitleIdForItemId(item.itemId) : undefined,
    implementationStatus: item.implementationStatus
  };
};

export const INVENTORY_CATALOG_ITEMS: InventoryItemDefinition[] = CATALOG_ITEMS.map(mapCatalogItemToInventoryItem);

export const getCatalogInventoryItemById = (itemId: string): InventoryItemDefinition | undefined =>
  INVENTORY_CATALOG_ITEMS.find((item) => item.id === itemId);

export const getCatalogInventoryItemByName = (name: string): InventoryItemDefinition | undefined =>
  INVENTORY_CATALOG_ITEMS.find((item) => item.name === name);

const getLocalPurchaseCount = (state: GameState, offer: CatalogShopOffer): number =>
  state.inventory.usedConsumables[`purchase:${offer.offerId}`] ?? 0;

const getUnlockStatus = (state: GameState, offer: CatalogShopOffer): { unlocked: boolean; reason: string | null } => {
  if (!offer.active) return { unlocked: false, reason: 'Inactive offer' };
  if (!offer.unlockType || offer.unlockType === 'none') return { unlocked: true, reason: null };

  const numericValue = Number(offer.unlockValue || 0);
  switch (offer.unlockType) {
    case 'distance_miles':
      return state.stats.totalDistanceWalked >= numericValue
        ? { unlocked: true, reason: null }
        : { unlocked: false, reason: `${numericValue.toLocaleString()} mi required` };
    case 'earth_loops_completed':
      return state.earthLoopsCompleted >= numericValue
        ? { unlocked: true, reason: null }
        : { unlocked: false, reason: `${numericValue} Earth loop required` };
    case 'daily_streak':
      return state.dailyPlay.daysPlayed >= numericValue
        ? { unlocked: true, reason: null }
        : { unlocked: false, reason: `${numericValue} play days required` };
    case 'event':
      return state.quests.seasonalEventId === offer.unlockValue
        ? { unlocked: true, reason: null }
        : { unlocked: false, reason: 'Seasonal offer' };
    case 'destination':
      return { unlocked: true, reason: null };
    case 'achievement':
      return Object.values(state.achievements).some((progress) => progress.claimedAt)
        ? { unlocked: true, reason: null }
        : { unlocked: false, reason: 'Claim an achievement first' };
    default:
      return { unlocked: false, reason: 'Future unlock' };
  }
};

export const getLocalCatalogShopOffers = (state: GameState): LocalCatalogShopOffer[] =>
  CATALOG_SHOP_OFFERS
    .filter((offer) => offer.currency === 'WB' && offer.active)
    .map((offer) => {
      const item = getCatalogInventoryItemById(offer.itemId);
      if (!item) return null;
      const status = getUnlockStatus(state, offer);
      return {
        ...offer,
        item,
        unlocked: status.unlocked,
        lockedReason: status.reason,
        ownedQuantity: state.inventory.items[offer.itemId] ?? 0
      };
    })
    .filter((offer): offer is LocalCatalogShopOffer => Boolean(offer))
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const applyCatalogOfferPurchase = (state: GameState, offerId: string): GameState => {
  const offer = getLocalCatalogShopOffers(state).find((entry) => entry.offerId === offerId);
  if (!offer || !offer.unlocked) return state;

  const purchases = getLocalPurchaseCount(state, offer);
  if (offer.purchaseLimitPerAccount && purchases >= offer.purchaseLimitPerAccount) return state;

  return {
    ...state,
    inventory: {
      ...state.inventory,
      items: {
        ...state.inventory.items,
        [offer.itemId]: (state.inventory.items[offer.itemId] ?? 0) + 1
      },
      usedConsumables: {
        ...state.inventory.usedConsumables,
        [`purchase:${offer.offerId}`]: purchases + 1
      }
    },
    cosmetics:
      offer.item.type === 'cosmetic' && offer.item.cosmeticId
        ? {
            ...state.cosmetics,
            owned: {
              ...state.cosmetics.owned,
              [offer.item.cosmeticId]: true
            }
          }
        : state.cosmetics,
    ui: {
      ...state.ui,
      toast: `${offer.item.name} added to backpack.`
    }
  };
};

export const purchaseLocalCatalogOffer = applyCatalogOfferPurchase;

export const getSharedInventoryEntitlements = (state: GameState): SharedInventoryEntitlement[] =>
  state.walkerBucksBridge.inventory.map((entry) => {
    const purchasedOffer = Object.values(state.walkerBucksBridge.marketplacePurchases).find(
      (purchase) => purchase.itemDefinitionId === entry.itemDefinitionId
    );
    const offer = state.walkerBucksBridge.marketplaceOffers.find(
      (marketplaceOffer) => marketplaceOffer.itemDefinitionId === entry.itemDefinitionId
    );
    const catalogItem =
      (offer?.itemId ? getCatalogInventoryItemById(offer.itemId) : undefined) ??
      (offer?.item_id ? getCatalogInventoryItemById(offer.item_id) : undefined) ??
      (offer?.name ? getCatalogInventoryItemByName(offer.name) : undefined);
    const fallbackName = offer?.name ?? purchasedOffer?.label ?? `Shared item #${entry.itemDefinitionId}`;

    return {
      itemInstanceId: entry.itemInstanceId,
      itemDefinitionId: entry.itemDefinitionId,
      status: entry.status,
      itemId: catalogItem?.id ?? null,
      slug: catalogItem?.slug ?? null,
      name: catalogItem?.name ?? fallbackName,
      description: catalogItem?.description ?? 'Shared WalkerBucks inventory item.',
      assetPath: catalogItem?.assetPath ?? offer?.assetPath ?? offer?.asset_path,
      assetFilename: catalogItem?.assetFilename ?? offer?.assetFilename ?? offer?.asset_filename,
      knownLocalItem: Boolean(catalogItem)
    };
  });
