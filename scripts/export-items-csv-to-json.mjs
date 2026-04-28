import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv } from './items-csv-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const itemsCsvPath = path.join(rootDir, 'content/items/item_definitions.csv');
const offersCsvPath = path.join(rootDir, 'content/items/shop_offers.csv');
const itemsOutPath = path.join(rootDir, 'src/data/generated/items.generated.json');
const offersOutPath = path.join(rootDir, 'src/data/generated/shop_offers.generated.json');

const REQUIRED_ITEM_FIELDS = ['item_id', 'name', 'category', 'rarity', 'price_wb', 'asset_filename'];

const BOOLEAN_FIELDS = ['stackable', 'tradable', 'soulbound', 'consumable', 'equippable'];
const NUMBER_FIELDS = ['tier', 'effect_value', 'effect_duration_seconds', 'cooldown_seconds', 'max_stack', 'price_wb'];

const toNumberOrNull = (value) => {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBooleanOrNull = (value) => {
  if (value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const { rows: itemRows } = readCsv(itemsCsvPath);
for (const row of itemRows) {
  for (const field of REQUIRED_ITEM_FIELDS) {
    if (!row[field] || row[field].trim() === '') {
      fail(`Missing required field ${field} for item_id=${row.item_id || '<blank>'}`);
    }
  }
}

const items = itemRows.map((row) => {
  const output = {
    itemId: row.item_id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    itemType: row.item_type,
    rarity: row.rarity,
    description: row.description,
    flavorText: row.flavor_text,
    effectKey: row.effect_key,
    effectType: row.effect_type,
    unlockType: row.unlock_type,
    unlockValue: row.unlock_value,
    shopId: row.shop_id,
    lifecycleState: row.lifecycle_state,
    assetFilename: row.asset_filename,
    assetPath: row.asset_path,
    visualSubject: row.visual_subject,
    visualKeywords: row.visual_keywords,
    artPrompt: row.art_prompt,
    artStatus: row.art_status,
    implementationStatus: row.implementation_status,
    notes: row.notes
  };

  for (const field of BOOLEAN_FIELDS) {
    output[field] = toBooleanOrNull(row[field]);
  }

  for (const field of NUMBER_FIELDS) {
    output[field] = toNumberOrNull(row[field]);
  }

  return output;
});

const { rows: offerRows } = readCsv(offersCsvPath);
const offers = offerRows.map((row) => ({
  offerId: row.offer_id,
  shopId: row.shop_id,
  itemId: row.item_id,
  priceWb: toNumberOrNull(row.price_wb),
  currency: row.currency,
  stockTotal: toNumberOrNull(row.stock_total),
  stockRemaining: toNumberOrNull(row.stock_remaining),
  purchaseLimitPerAccount: toNumberOrNull(row.purchase_limit_per_account),
  startsAt: row.starts_at || null,
  expiresAt: row.expires_at || null,
  unlockType: row.unlock_type,
  unlockValue: row.unlock_value,
  active: toBooleanOrNull(row.active),
  sortOrder: toNumberOrNull(row.sort_order),
  notes: row.notes
}));

fs.mkdirSync(path.dirname(itemsOutPath), { recursive: true });
fs.writeFileSync(itemsOutPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
fs.writeFileSync(offersOutPath, `${JSON.stringify(offers, null, 2)}\n`, 'utf8');

console.log(`Exported ${items.length} items -> ${path.relative(rootDir, itemsOutPath)}`);
console.log(`Exported ${offers.length} shop offers -> ${path.relative(rootDir, offersOutPath)}`);
