import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv, writeCsv } from './items-csv-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const itemDefinitionsPath = path.join(rootDir, 'content/items/item_definitions.csv');
const templatesPath = path.join(rootDir, 'content/items/item_prompt_templates.csv');
const styleGuidePath = path.join(rootDir, 'content/items/item_art_style_guide.csv');

const force = process.argv.includes('--force');

const { rows: templates } = readCsv(templatesPath);
const { rows: styleRows } = readCsv(styleGuidePath);
const style = styleRows[0] ?? {};

const defaultTemplate = templates.find((template) => template.template_id === 'default_item_icon');
if (!defaultTemplate) {
  throw new Error('default_item_icon template not found in content/items/item_prompt_templates.csv');
}

const { headers, rows } = readCsv(itemDefinitionsPath);

const applyTemplate = (templateText, row) => {
  const replacementMap = {
    name: row.name,
    rarity: row.rarity,
    category: row.category,
    visual_subject: row.visual_subject,
    visual_keywords: row.visual_keywords,
    background_rule: style.background_rule || 'transparent background',
    effect_key: row.effect_key
  };

  return templateText.replace(/\{([a-z_]+)\}/g, (_match, key) => replacementMap[key] ?? '');
};

let updatedCount = 0;
const nextRows = rows.map((row) => {
  const hasManualPrompt = Boolean(row.art_prompt && row.art_prompt.trim().length > 0);
  if (hasManualPrompt && !force) return row;

  updatedCount += 1;
  return {
    ...row,
    art_prompt: applyTemplate(defaultTemplate.template_text, row),
    art_status: row.art_status === 'not_started' ? 'prompt_ready' : row.art_status
  };
});

writeCsv(itemDefinitionsPath, headers, nextRows);
console.log(`Updated art prompts for ${updatedCount} items in ${path.relative(rootDir, itemDefinitionsPath)}.`);
