# Walker Creative Router Item Images

Walk The World can generate missing item icon PNGs through a local Walker Creative Router running at:

```text
http://127.0.0.1:3030
```

The repo-side workflow is intentionally local and sequential. The generator finds the next missing item image, sends one `POST /render` request, waits for the render response, downloads the returned `imageUrl`, saves the PNG locally, updates the generated image manifest, and only then moves to the next item.

## Start The Router

Start the Walker Creative Router from its own local checkout so it listens on `http://127.0.0.1:3030`.

```bash
cd <walker-creative-router>
npm run dev
```

If that checkout uses a different start command, use its documented command. This Walk The World repo only depends on the router URL and `POST /render` contract.

## Run Generation

From the Walk The World repo root:

```bash
npm run generate:item-images
npm run generate:item-images -- --dry-run
npm run generate:item-images -- --limit 3
npm run generate:item-images -- --force
```

Use a non-default router URL when needed:

```bash
npm run generate:item-images -- --router-url http://127.0.0.1:3030
```

## Data And Output

The script reads the runtime item catalog from:

```text
src/data/generated/items.generated.json
```

Generated images are saved under:

```text
public/assets/items/generated/
```

The renderer manifest is updated at:

```text
src/data/generatedItemImages.ts
```

The script does not change gameplay logic, rarity, prices, balances, WalkerBucks behavior, CSV definitions, or shop logic. Existing item images are skipped by default. Existing generated PNGs are not overwritten unless `--force` is passed. Before the manifest is edited, the previous manifest is copied to `qa-artifacts/backups/`.

## Sequential Contract

The generator uses simple sequential control flow:

```js
for (const item of itemsToGenerate) {
  await generateOneItem(item);
}
```

Do not change this workflow to `Promise.all`, a worker pool, or batched render requests. The local router should receive one image request at a time.
