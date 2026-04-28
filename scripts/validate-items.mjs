import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv } from './items-csv-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const itemsPath = path.join(rootDir, 'content/items/item_definitions.csv');
const effectsPath = path.join(rootDir, 'content/items/item_effect_types.csv');
const offersPath = path.join(rootDir, 'content/items/shop_offers.csv');

const { rows: items } = readCsv(itemsPath);
const { rows: effects } = readCsv(effectsPath);
const { rows: offers } = readCsv(offersPath);

const errors = [];
const itemIds = new Set();
const effectKeys = new Set(effects.map((effect) => effect.effect_key));

for (const item of items) {
  if (itemIds.has(item.item_id)) errors.push(`Duplicate item_id: ${item.item_id}`);
  itemIds.add(item.item_id);

  if (!item.name) errors.push(`Missing name for item_id=${item.item_id}`);
  if (!item.category) errors.push(`Missing category for item_id=${item.item_id}`);
  if (!item.rarity) errors.push(`Missing rarity for item_id=${item.item_id}`);
  if (!item.asset_filename) errors.push(`Missing asset_filename for item_id=${item.item_id}`);

  const price = Number(item.price_wb);
  if (!Number.isFinite(price) || price < 0) {
    errors.push(`Invalid price_wb for item_id=${item.item_id}: ${item.price_wb}`);
  }

  for (const field of ['stackable', 'tradable', 'soulbound', 'consumable', 'equippable']) {
    if (!['true', 'false', ''].includes(item[field])) {
      errors.push(`Invalid boolean ${field} for item_id=${item.item_id}: ${item[field]}`);
    }
  }

  if (item.effect_key && !effectKeys.has(item.effect_key)) {
    errors.push(`Unknown effect_key for item_id=${item.item_id}: ${item.effect_key}`);
  }
}

for (const offer of offers) {
  if (!itemIds.has(offer.item_id)) {
    errors.push(`shop_offers.csv references missing item_id=${offer.item_id} in offer_id=${offer.offer_id}`);
  }

  const price = Number(offer.price_wb);
  if (!Number.isFinite(price) || price < 0) {
    errors.push(`Invalid shop offer price_wb for offer_id=${offer.offer_id}: ${offer.price_wb}`);
  }
}

if (errors.length > 0) {
  console.error('Item pipeline validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validation passed for ${items.length} items, ${effects.length} effect rows, and ${offers.length} offers.`);
