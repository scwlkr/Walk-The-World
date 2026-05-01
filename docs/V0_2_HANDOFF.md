# Walk The World v0.2 Handoff

Last updated: 2026-05-01

## Current Scope

The active plan is v0.2 Followers and Cosmetics.

Goal:

```text
I am no longer walking alone.
Followers help, recruit, and sometimes leave.
Cosmetics stabilize the crew.
Boosts give short-term decisions.
Achievements and scenery make progress more visible.
```

## v0.1 Verification

v0.1 was verified before the v0.2 pass.

Fresh commands run:

```bash
npm run build
npm test
npm run smoke:local
```

Result:

- build passed
- 12 existing tests passed before v0.2 edits
- local browser smoke passed with save version 10

## Implemented In v0.2

- Package/game version advanced to `0.2.0`.
- Save version advanced to `11`.
- Followers are visible in the default shop.
- Added follower definitions with DPS, recruit chance, leave chance, morale sensitivity, rarity, and flavor.
- Added global follower morale state and save migration.
- Added follower recruitment and leave dynamics to the game tick.
- Added crew status, morale label, stability, and recent follower story UI.
- Cosmetics now map to follower morale or follower stability effects.
- The default shop exposes upgrades, followers, boost/item offers, and cosmetics.
- Early achievements are visible in the default stats sheet.
- Added v0.2 achievements for using a boost and equipping a cosmetic.
- Expanded Earth route scenery using existing broad-zone background aliases.
- Added rollback cleanup for exposed cosmetic catalog purchases if WalkerBucks settlement fails.

## Runtime Boundaries To Preserve

- Guest play must keep working without Supabase or WalkerBucks bridge configuration.
- Spendable WB must come from WalkerBucks, not local state.
- Walking, milestones, achievements, and consumables may queue pending WB grants for bridge settlement.
- Upgrade, follower, and item purchases may reserve bridge-reported spendable WB optimistically, but must settle through WalkerBucks or roll back.
- Followers, morale, cosmetics, and boosts are WTW gameplay state only.
- Marketplace, leaderboard, prestige/world switching, and deeper events remain dev-only or future scope.

## Important Files

- `src/game/constants.ts`
- `src/game/types.ts`
- `src/game/followers.ts`
- `src/game/cosmetics.ts`
- `src/game/formulas.ts`
- `src/game/tick.ts`
- `src/game/landmarks.ts`
- `src/components/ShopModal.tsx`
- `src/components/FollowerList.tsx`
- `src/components/CatalogShopPanel.tsx`
- `src/components/AchievementsPanel.tsx`
- `src/components/GameHUD.tsx`
- `tests/game-retention.test.ts`
- `scripts/local-dev-smoke.mjs`

## Verification Checklist

Run after changes:

```bash
npm run build
npm test
npm run smoke:local
```

Manual check:

- Fresh save renders the game scene and WALK button.
- HUD shows WB, DT, DPS, DPT, crew count, morale, and offline cap.
- Shop opens with upgrades, followers, boosts, and cosmetics tabs.
- Guest player cannot spend WB without a settled WalkerBucks balance.
- Followers show recruit/leave chances and crew morale.
- Cosmetics show follower morale/stability effects.
- Using a boost creates an active boost row.
- Achievements are visible from Stats.
- Settings still exposes account and WalkerBucks bridge controls.

## Next Session Prompt

```text
Continue in /Users/shanewalker/Desktop/dev/Walk-The-World from docs/V0_2_GAME_DESIGN.md and docs/V0_2_HANDOFF.md. Keep v0.2 scoped to followers, morale, cosmetics, boosts, achievements, and expanded scenery. Preserve the WalkerBucks ledger boundary: WTW can queue pending reward/spend metadata and reserve bridge-reported spendable WB, but no local/browser/app-specific state creates spendable WB. Do not start region-specific events, Journey Reset, marketplace depth, or social systems unless explicitly asked. Run npm run build, npm test, and npm run smoke:local before calling the pass complete.
```
