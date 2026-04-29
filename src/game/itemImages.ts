export type ItemImageCandidate = {
  id?: string;
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

const normalizeItemAssetPath = (assetPath: string): string => {
  const trimmed = assetPath.trim();
  if (trimmed.startsWith('/')) return trimmed;
  return `${itemAssetRoot}${trimmed.replace(/^\/+/, '')}`;
};

export const getItemImageSrc = (item: ItemImageCandidate): string | null => {
  const directAssetPath = item.assetPath ?? item.asset_path;
  if (directAssetPath?.trim()) return normalizeItemAssetPath(directAssetPath);

  const assetFilename = item.assetFilename ?? item.asset_filename;
  if (assetFilename?.trim()) return normalizeItemAssetPath(assetFilename);

  const itemId = item.itemId ?? item.item_id ?? item.id;
  if (!itemId?.trim()) return null;

  return `${itemAssetRoot}${itemId}.png`;
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
