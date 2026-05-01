# Walk The World v0.1 Handoff

Last updated: 2026-04-30

## Current Scope

The active plan is v0.1 Core Walking Loop.

Goal:

```text
I tap.
I gain distance.
I buy generators with settled WalkerBucks.
The number goes up.
The scenery changes.
I understand what I am doing.
```

## Implemented In This Pass

- Package/game version reset to `0.1.0`.
- Save version advanced to `10`.
- Added distance formatting helpers for feet, miles, DPS, and DPT.
- Updated the HUD to show WB, DT, DPS, and DPT.
- Replaced early milestones with distance-first v0.1 milestones.
- Reworked Earth landmarks into early scenery progression:
  - starting room
  - suburb
  - city
  - forest
  - desert
  - mountain
- Replaced the active upgrade catalog with v0.1 generator, tap, and offline-cap upgrades.
- Increased the base offline cap to 4 hours.
- Disabled advanced random-event and route-encounter spawning by default.
- Hid older follower, item, cosmetic, marketplace, leaderboard, achievement, world, and prestige surfaces from the default v0.1 path.
- Kept those older surfaces available in dev mode where useful for inspection and regression testing.
- Archived C-version/private-beta docs under `docs/archive/c-version/`.

## Runtime Boundaries To Preserve

- Guest play must keep working without Supabase or WalkerBucks bridge configuration.
- Spendable WB must come from WalkerBucks, not local state.
- Walking may queue pending WB grants for bridge settlement.
- Upgrade purchases must apply only after a trusted WalkerBucks spend settles.
- v0.1 should not surface followers, cosmetics, marketplace, prestige, or region events as normal player systems.

## Important Files

- `src/game/constants.ts`
- `src/game/distance.ts`
- `src/game/upgrades.ts`
- `src/game/milestones.ts`
- `src/game/landmarks.ts`
- `src/game/tick.ts`
- `src/components/GameHUD.tsx`
- `src/components/ShopModal.tsx`
- `src/components/ProgressPanel.tsx`
- `src/components/StatsPanel.tsx`
- `scripts/local-dev-smoke.mjs`
- `tests/game-retention.test.ts`

## Verification Checklist

Run after changes:

```bash
npm run build
npm test
npm run smoke:local
```

Manual check:

- Fresh save renders the game scene and WALK button.
- HUD shows WB, DT, DPS, and DPT.
- Six taps can make `Leave the Couch` claimable.
- Claiming the milestone queues WB instead of creating a local spendable balance.
- Shop shows v0.1 upgrades first.
- Guest player cannot spend WB without a settled WalkerBucks balance.
- Settings still exposes account and WalkerBucks bridge controls.

## Next Session Prompt

```text
Continue in /Users/shanewalker/Desktop/dev/Walk-The-World from docs/V0_1_GAME_DESIGN.md and docs/V0_1_HANDOFF.md. Keep v0.1 scoped to the core walking loop: DT, DPS, DPT, generators, basic shop, WalkerBucks-settled purchases, scenery, milestones, and capped offline progress. Do not surface followers, cosmetics, marketplace, prestige, or events in the default player path. Run npm run build, npm test, and npm run smoke:local before calling the pass complete.
```
