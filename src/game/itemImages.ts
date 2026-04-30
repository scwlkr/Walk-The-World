import { generatedItemImages } from '../data/generatedItemImages';

export type ItemImageCandidate = {
  id?: string;
  slug?: string;
  name?: string;
  image?: string | null;
  itemId?: string;
  item_id?: string;
  assetPath?: string | null;
  asset_path?: string | null;
  assetFilename?: string | null;
  asset_filename?: string | null;
  icon?: string | null;
  emoji?: string | null;
  type?: string | null;
  itemType?: string | null;
  item_type?: string | null;
  slot?: string | null;
};

const itemAssetRoot = '/assets/items/';
const availableItemAssetFilenames = new Set([
  'retro_sweatband_item.png',
  'detour_token.png',
  'energy_drink.png',
  'loose_walkerbuck.png',
  'mile_badge.png',
  'mystery_backpack.png',
  'route_marker.png',
  'spring_stride_ticket.png',
  'starter_step_counter.png',
  'trail_mix.png',
  'walkertown_postcard.png'
]);

const normalizeItemAssetPath = (assetPath: string): string => {
  const trimmed = assetPath.trim();
  if (trimmed.startsWith('/')) return trimmed;
  return `${itemAssetRoot}${trimmed.replace(/^\/+/, '')}`;
};

const getAvailableItemAssetPath = (assetPath: string): string | null => {
  const normalized = normalizeItemAssetPath(assetPath);
  if (!normalized.startsWith(itemAssetRoot)) return normalized;

  const filename = normalized.slice(itemAssetRoot.length);
  return availableItemAssetFilenames.has(filename) ? normalized : null;
};

const slugifyItemKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/_item$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getGeneratedItemImagePath = (item: ItemImageCandidate): string | null => {
  const keys = [
    item.slug,
    item.id,
    item.itemId,
    item.item_id,
    item.name ? slugifyItemKey(item.name) : null,
    item.id ? slugifyItemKey(item.id) : null,
    item.itemId ? slugifyItemKey(item.itemId) : null,
    item.item_id ? slugifyItemKey(item.item_id) : null
  ].filter((key): key is string => Boolean(key?.trim()));

  for (const key of keys) {
    const generatedPath = generatedItemImages[key];
    if (generatedPath) return generatedPath;
  }

  return null;
};

export const getItemImageSrc = (item: ItemImageCandidate): string | null => {
  if (item.image?.trim()) return normalizeItemAssetPath(item.image);

  const generatedPath = getGeneratedItemImagePath(item);
  if (generatedPath) return generatedPath;

  const directAssetPath = item.assetPath ?? item.asset_path;
  if (directAssetPath?.trim()) return getAvailableItemAssetPath(directAssetPath);

  const assetFilename = item.assetFilename ?? item.asset_filename;
  if (assetFilename?.trim()) return getAvailableItemAssetPath(assetFilename);

  const itemId = item.itemId ?? item.item_id ?? item.id;
  if (!itemId?.trim()) return null;

  return getAvailableItemAssetPath(`${itemId}.png`);
};

export const getItemFallbackIcon = (item: ItemImageCandidate): string => {
  const existingIcon = item.emoji ?? item.icon;
  if (existingIcon?.trim()) return existingIcon;

  const itemType = item.itemType ?? item.item_type ?? item.type ?? item.slot;
  switch (itemType) {
    case 'consumable':
      return 'USE';
    case 'collectible':
      return 'COL';
    case 'equipment':
      return 'EQ';
    case 'cosmetic':
      return 'COS';
    case 'head':
      return 'HEAD';
    case 'face':
      return 'FACE';
    case 'shoes':
      return 'SHOE';
    default:
      return '?';
  }
};
