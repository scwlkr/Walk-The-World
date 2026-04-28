# Walk The World Item Content Pipeline

This folder adds a CSV-first content workflow for item definitions, shop offers, and item art prompts without changing existing runtime item logic yet.

## Why this exists

The current game keeps item data in TypeScript arrays (`src/game/inventory.ts` and `src/game/cosmetics.ts`) and marketplace offers come from the WalkerBucks bridge (`src/game/types.ts`, `src/services/walkerbucksClient.ts`). This pipeline provides a scalable place to author 100+ items and export typed JSON for future integration.

## Files in this folder

- `item_definitions.csv`: master item catalog.
- `shop_offers.csv`: shop availability and pricing metadata.
- `item_effect_types.csv`: allowed effect keys and effect semantics.
- `item_art_style_guide.csv`: reusable visual style constraints for icon generation.
- `item_prompt_templates.csv`: prompt templates for AI icon generation.

## Required vs optional fields (`item_definitions.csv`)

Required:
- `item_id`
- `name`
- `category`
- `rarity`
- `price_wb`
- `asset_filename`

Common optional (recommended):
- `effect_key`, `effect_type`, `effect_value`
- `unlock_type`, `unlock_value`
- `visual_subject`, `visual_keywords`
- `art_prompt`, `art_status`
- `implementation_status`, `notes`

## Existing naming conventions preserved

- Item IDs are `snake_case` (`trail_mix`, `golden_wayfarers_item`).
- Local inventory item definitions are stored in `INVENTORY_ITEMS`.
- Cosmetic entries map to inventory via `itemId` and use matching snake_case IDs.
- Currency pricing uses WalkerBucks (`WB` / `price_wb`).

## Google Sheets workflow

1. Import one CSV into Google Sheets (`File` -> `Import` -> `Upload`).
2. Edit rows and keep header names exactly unchanged.
3. Export as CSV (`File` -> `Download` -> `Comma-separated values (.csv)`).
4. Replace the repo file under `content/items/` with the exported CSV.

## Commands

From repo root:

- `npm run items:prompts`
  - Generates `art_prompt` for rows using `default_item_icon` template.
  - Keeps existing manual prompts unless `-- --force` is appended.

- `npm run items:validate`
  - Checks duplicate IDs, required values, booleans, effect keys, and shop item references.

- `npm run items:export`
  - Converts CSV content into generated JSON files:
    - `src/data/generated/items.generated.json`
    - `src/data/generated/shop_offers.generated.json`

## Asset naming convention

Recommended convention (aligned with item ID style):

- `public/assets/items/{item_id}.png`

`asset_filename` should normally equal `{item_id}.png` unless there is an intentional alias.

## Add a new item safely

1. Add a row to `item_definitions.csv` with a unique `item_id` in snake_case.
2. Add or map an `effect_key` present in `item_effect_types.csv`.
3. Add a row in `shop_offers.csv` if the item should be sold.
4. Run `npm run items:prompts` to generate an icon prompt.
5. Run `npm run items:validate` and fix any reported issues.
6. Run `npm run items:export` to refresh generated JSON snapshots.
7. Add the icon file at `public/assets/items/{item_id}.png` when art is available.

## Scope guardrails

This folder is intentionally content-only. It does **not** add marketplace, trading, crafting, Supabase migrations, or runtime economy rewrites.
