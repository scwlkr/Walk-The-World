# Walk The World v0.5 Handoff

Last updated: 2026-05-01

## Current Scope

The active plan is v0.5 Content Depth.

Goal:

```text
I have a build.
I have favorite items.
I have rare stuff.
I have goals beyond raw DPS.
```

## Implemented In v0.5

- Package/game version advanced to `0.5.0`.
- Save version advanced to `14`.
- Added runtime v0.5 catalog items without regenerating CSV item sources or generated catalog JSON.
- Added v0.5 WalkerBucks-priced local catalog offers that still settle through the trusted WalkerBucks bridge.
- Added temporary DPS, follower-stability, and follower-recruit boost item effects.
- Added rare cosmetics: Matching Tracksuits, Golden Sneakers, and Spring Stride Crown.
- Added collection goals and title selection to the normal Stats path.
- Added title unlock handling for title-bearing catalog purchases and rewards.
- Added collection achievements for starter backpack, rare item, and cosmetic progress.
- Added Boardwalk and Great Wall Earth regions using existing scenery assets.
- Added Boardwalk Busker, Passport Stamper, and Moon Boot Intern followers.
- Added v0.5 random events and route encounters that drop or boost v0.5 content.
- Local browser smoke now checks save version `14` plus Collection Goals and Titles visibility.

## Runtime Boundaries To Preserve

- Guest play must keep working without Supabase or WalkerBucks bridge configuration.
- Spendable WB must come from WalkerBucks, not local state.
- v0.5 titles and collection goals are local profile/gameplay presentation only.
- Runtime catalog additions are WTW app-layer content; they are not WalkerBucks core item/shop ownership.
- Walking, milestones, achievements, quests, random events, route encounters, and consumables may queue pending WB grants for bridge settlement.
- Upgrade, follower, and item purchases may reserve bridge-reported spendable WB optimistically, but must settle through WalkerBucks or roll back.
- Journey Reset must not delete WalkerBucks bridge state, account state, cosmetics, inventory, achievements, titles, or profile data.
- Do not regenerate CSV item sources or generated catalog JSON unless explicitly asked.
- Mars and Solar System remain dev/prototype surfaces, not normal player-path v0.5 content.

## Important Files

- `src/game/constants.ts`
- `src/game/types.ts`
- `src/game/v05Content.ts`
- `src/game/collections.ts`
- `src/game/items.ts`
- `src/game/inventory.ts`
- `src/game/cosmetics.ts`
- `src/game/followers.ts`
- `src/game/regions.ts`
- `src/game/randomEvents.ts`
- `src/game/routeEncounters.ts`
- `src/components/CollectionGoalsPanel.tsx`
- `src/components/CatalogShopPanel.tsx`
- `src/App.tsx`
- `tests/game-retention.test.ts`
- `scripts/local-dev-smoke.mjs`

## Verification Checklist

Run after changes:

```bash
npm run build
npm test
npm run smoke:local
git diff --check
```

Manual check:

- Fresh save renders the game scene and WALK button.
- Shop shows v0.5 boosts and limited-time items, with WB spend blocked for guest/no-balance play.
- Stats sheet shows Regions, Distance Progress, Journey Reset, Journey Upgrades, Collection Goals, Titles, Stats, and Achievements.
- Collection goals progress from inventory/cosmetics/regions without creating spendable WB.
- Title selection persists in profile state and survives reload.
- Rare cosmetics can be owned/equipped and affect follower morale/stability, not direct best-in-slot DPS.
- Runtime v0.5 offers settle through WalkerBucks before final purchase success.
- Failed optimistic catalog purchases roll back item, cosmetic, title, and displayed-balance effects.
- Earned WB stays queued for bridge settlement and does not become local spendable WB.

## Next Session Prompt

```text
Continue in /Users/shanewalker/Desktop/dev/Walk-The-World from docs/V0_5_GAME_DESIGN.md and docs/V0_5_HANDOFF.md. Proceed toward v1.0 only: polish and balance the complete incremental loop, verify WalkerBucks-settled spending/reward flows, preserve guest/local mode, keep titles/collections local profile presentation unless WalkerBucks ownership is explicitly designed, and produce a v1.0 go/no-go checklist before any public launch claim. Preserve the WalkerBucks ledger boundary: WTW can queue pending reward/spend metadata and reserve bridge-reported spendable WB, but no local/browser/app-specific state creates spendable WB. Run npm run build, npm test, npm run smoke:local, and git diff --check before calling the pass complete.
```
