import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const itemDataPath = path.join(rootDir, 'src/data/generated/items.generated.json');
const manifestPath = path.join(rootDir, 'src/data/generatedItemImages.ts');
const generatedAssetsDir = path.join(rootDir, 'public/assets/items/generated');

const defaultOptions = {
  dryRun: false,
  force: false,
  limit: null,
  routerUrl: 'http://127.0.0.1:3030'
};

const parsePositiveInteger = (value, flagName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }
  return parsed;
};

const parseArgs = (argv) => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--limit') {
      options.limit = parsePositiveInteger(argv[index + 1], '--limit');
      index += 1;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      options.limit = parsePositiveInteger(arg.slice('--limit='.length), '--limit');
      continue;
    }

    if (arg === '--router-url') {
      options.routerUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--router-url=')) {
      options.routerUrl = arg.slice('--router-url='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.routerUrl?.trim()) {
    throw new Error('--router-url must not be empty.');
  }

  return options;
};

const relativePath = (filePath) => path.relative(rootDir, filePath);

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/_item$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const unique = (values) => [...new Set(values.filter((value) => Boolean(value?.trim())))];

const getStableSlug = (item) => {
  const slug = item.slug?.trim() || slugify(item.name || item.itemId || item.id || '');
  if (!slug) throw new Error(`Unable to derive stable slug for item_id=${item.itemId || item.id || '<unknown>'}`);
  return slug;
};

const getManifestKeys = (item) => {
  const slug = (() => {
    try {
      return getStableSlug(item);
    } catch {
      return null;
    }
  })();

  return unique([
    item.slug,
    item.id,
    item.itemId,
    item.item_id,
    slug,
    item.name ? slugify(item.name) : null,
    item.id ? slugify(item.id) : null,
    item.itemId ? slugify(item.itemId) : null,
    item.item_id ? slugify(item.item_id) : null
  ]);
};

const normalizeItemAssetPath = (assetPath) => {
  if (!assetPath?.trim()) return null;
  const trimmed = assetPath.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/assets/items/${trimmed.replace(/^\/+/, '')}`;
};

const publicPathToFilePath = (publicPath) => {
  if (!publicPath || /^https?:\/\//i.test(publicPath)) return null;
  const normalized = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  return path.join(rootDir, 'public', normalized);
};

const publicFileExists = (publicPath) => {
  const filePath = publicPathToFilePath(publicPath);
  return Boolean(filePath && fs.existsSync(filePath));
};

const readItemData = () => {
  const raw = fs.readFileSync(itemDataPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${relativePath(itemDataPath)} must contain an item array.`);
  }
  return parsed;
};

const readGeneratedImageManifest = () => {
  if (!fs.existsSync(manifestPath)) return {};

  const content = fs.readFileSync(manifestPath, 'utf8');
  const match = content.match(/export const generatedItemImages:\s*Record<string,\s*string>\s*=\s*(\{[\s\S]*?\});?\s*$/m);
  if (!match) {
    throw new Error(`${relativePath(manifestPath)} has an unsupported format.`);
  }

  return JSON.parse(match[1]);
};

const writeGeneratedImageManifest = async (manifest) => {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)));
  const content = `export const generatedItemImages: Record<string, string> = ${JSON.stringify(sorted, null, 2)};\n`;
  await fsp.writeFile(manifestPath, content, 'utf8');
};

let backupPath = null;

const backupManifestBeforeWrite = async () => {
  if (backupPath || !fs.existsSync(manifestPath)) return backupPath;

  const backupDir = path.join(rootDir, 'qa-artifacts/backups');
  await fsp.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  backupPath = path.join(backupDir, `generatedItemImages.${stamp}.ts`);
  await fsp.copyFile(manifestPath, backupPath);
  return backupPath;
};

const getExistingManifestImage = (item, manifest) => {
  for (const key of getManifestKeys(item)) {
    const publicPath = manifest[key];
    if (publicPath && publicFileExists(publicPath)) {
      return { key, publicPath };
    }
  }
  return null;
};

const getExistingDirectImage = (item) => {
  const directCandidates = [
    item.image,
    item.assetPath,
    item.asset_path,
    item.assetFilename,
    item.asset_filename
  ].map(normalizeItemAssetPath);

  for (const publicPath of directCandidates) {
    if (publicPath && publicFileExists(publicPath)) return publicPath;
  }

  return null;
};

const getOutputTarget = (item) => {
  const slug = getStableSlug(item);
  return {
    slug,
    filename: `${slug}.png`,
    publicPath: `/assets/items/generated/${slug}.png`,
    filePath: path.join(generatedAssetsDir, `${slug}.png`)
  };
};

const inferVisualSubject = (item) => {
  if (item.visualSubject?.trim()) return item.visualSubject.trim();
  if (item.visual_subject?.trim()) return item.visual_subject.trim();
  if (item.description?.trim()) return item.description.split(/[.!?]/)[0].trim().toLowerCase();
  return `a ${item.name}`;
};

const inferVisualCues = (item) => {
  const explicit = item.visualKeywords ?? item.visual_keywords;
  if (explicit?.trim()) {
    return explicit
      .split(/[|,]/g)
      .map((cue) => cue.trim())
      .filter(Boolean)
      .join(', ');
  }

  const words = unique(
    [item.name, item.category, item.itemType, item.description]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !['the', 'and', 'item', 'with', 'that', 'into'].includes(word))
      .slice(0, 6)
  );

  return words.length > 0 ? words.join(', ') : 'clean silhouette, bold outline, readable shape';
};

const buildPrompt = (item) => {
  const itemType = item.itemType || item.item_type || item.category || 'inventory';
  const rarity = item.rarity || 'common';
  return `${item.name}, ${rarity} ${itemType} item. Depict ${inferVisualSubject(item)}. Include these visual cues: ${inferVisualCues(item)}. Use the existing Walk The World polished retro pixel art inventory icon style.`;
};

const getRenderUrl = (routerUrl) => new URL('/render', routerUrl.endsWith('/') ? routerUrl : `${routerUrl}/`).toString();

const assertRouterReachable = async (routerUrl) => {
  try {
    await fetch(routerUrl, { method: 'GET' });
  } catch (error) {
    throw new Error(
      `Walker Creative Router is not reachable at ${routerUrl}. Start the local router, then rerun this script. ${error.message}`
    );
  }
};

const renderOneItem = async (item, target, options) => {
  const prompt = buildPrompt(item);
  const renderUrl = getRenderUrl(options.routerUrl);

  const renderResponse = await fetch(renderUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project: 'wtw',
      assetType: 'item_icon',
      styleProfile: 'wtw-item-v1',
      prompt
    })
  });

  if (!renderResponse.ok) {
    const body = await renderResponse.text();
    throw new Error(`Render request failed with HTTP ${renderResponse.status}: ${body.slice(0, 500)}`);
  }

  const payload = await renderResponse.json();
  if (!payload.ok || !payload.imageUrl) {
    throw new Error(`Render response did not include a usable imageUrl: ${JSON.stringify(payload)}`);
  }

  const imageResponse = await fetch(payload.imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Image download failed with HTTP ${imageResponse.status}: ${payload.imageUrl}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  if (imageBuffer.length === 0) {
    throw new Error(`Image download returned an empty file: ${payload.imageUrl}`);
  }

  await fsp.mkdir(path.dirname(target.filePath), { recursive: true });
  if (!options.force && fs.existsSync(target.filePath)) {
    throw new Error(`${relativePath(target.filePath)} already exists. Rerun with --force to overwrite it.`);
  }

  const tempPath = `${target.filePath}.tmp`;
  await fsp.writeFile(tempPath, imageBuffer);
  await fsp.rename(tempPath, target.filePath);

  return {
    assetId: payload.assetId,
    routerFilename: payload.filename,
    imageUrl: payload.imageUrl,
    finalPrompt: payload.finalPrompt,
    bytes: imageBuffer.length
  };
};

const analyzeItems = (items, manifest, options) =>
  items.map((item) => {
    const target = getOutputTarget(item);
    const existingManifestImage = getExistingManifestImage(item, manifest);
    const existingDirectImage = getExistingDirectImage(item);
    const generatedFileExists = fs.existsSync(target.filePath);
    const hasUsableImage = Boolean(existingManifestImage || existingDirectImage);

    if (!options.force && hasUsableImage) {
      return {
        item,
        target,
        action: 'skip',
        reason: existingManifestImage
          ? `manifest ${existingManifestImage.key} -> ${existingManifestImage.publicPath}`
          : existingDirectImage
      };
    }

    if (!options.force && generatedFileExists) {
      return {
        item,
        target,
        action: 'map-existing',
        reason: `${target.publicPath} already exists`
      };
    }

    return {
      item,
      target,
      action: 'render',
      reason: options.force ? 'force enabled' : 'missing local image'
    };
  });

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const items = readItemData();
  const manifest = readGeneratedImageManifest();
  const analyzedItems = analyzeItems(items, manifest, options);
  const missingUsableImages = analyzedItems.filter((entry) => entry.action !== 'skip').length;
  const selectedItems = analyzedItems
    .filter((entry) => entry.action !== 'skip')
    .slice(0, options.limit ?? Number.POSITIVE_INFINITY);

  console.log(`Item data source: ${relativePath(itemDataPath)} (${items.length} items)`);
  console.log(`Generated image manifest: ${relativePath(manifestPath)} (${Object.keys(manifest).length} entries)`);
  console.log(`Missing usable images found: ${missingUsableImages}`);
  console.log(`Mode: ${options.dryRun ? 'dry run' : 'write'}${options.force ? ', force' : ''}`);
  console.log(`Selected for this run: ${selectedItems.length}${options.limit ? ` (limit ${options.limit})` : ''}`);

  if (selectedItems.length === 0) {
    console.log('No item images need generation.');
    return;
  }

  if (options.dryRun) {
    for (const [index, entry] of selectedItems.entries()) {
      console.log(`[dry-run ${index + 1}/${selectedItems.length}] ${entry.item.name} -> ${entry.target.publicPath}`);
      console.log(`  prompt: ${buildPrompt(entry.item)}`);
    }
    return;
  }

  const renderItems = selectedItems.filter((entry) => entry.action === 'render');
  if (renderItems.length > 0) {
    await assertRouterReachable(options.routerUrl);
  }

  const summary = {
    generated: [],
    mappedExisting: [],
    failures: []
  };

  for (const [index, entry] of selectedItems.entries()) {
    const manifestKey = getStableSlug(entry.item);
    console.log(`[${index + 1}/${selectedItems.length}] ${entry.item.name} -> ${entry.target.publicPath}`);

    try {
      if (entry.action === 'map-existing') {
        manifest[manifestKey] = entry.target.publicPath;
        await backupManifestBeforeWrite();
        await writeGeneratedImageManifest(manifest);
        summary.mappedExisting.push(entry.item.name);
        console.log(`  mapped existing local file: ${entry.reason}`);
        continue;
      }

      const result = await renderOneItem(entry.item, entry.target, options);
      manifest[manifestKey] = entry.target.publicPath;
      await backupManifestBeforeWrite();
      await writeGeneratedImageManifest(manifest);
      summary.generated.push(entry.item.name);
      console.log(`  saved ${relativePath(entry.target.filePath)} (${result.bytes} bytes)`);
      if (result.assetId) console.log(`  router assetId: ${result.assetId}`);
    } catch (error) {
      summary.failures.push({ item: entry.item.name, error: error.message });
      console.error(`  failed: ${error.message}`);
    }
  }

  console.log('');
  console.log('Summary');
  console.log(`- generated: ${summary.generated.length}`);
  console.log(`- mapped existing files: ${summary.mappedExisting.length}`);
  console.log(`- failures: ${summary.failures.length}`);
  if (backupPath) console.log(`- manifest backup: ${relativePath(backupPath)}`);

  if (summary.failures.length > 0) {
    for (const failure of summary.failures) {
      console.log(`  - ${failure.item}: ${failure.error}`);
    }
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
