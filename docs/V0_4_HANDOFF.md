# Walk The World v0.4 Handoff

Last updated: 2026-05-01

## Current Scope

The active plan is v0.4 Journey Reset / prestige.

Goal:

```text
I reached a major destination.
I can reset.
Resetting hurts a little, but I come back stronger.
New options open up.
```

## Implemented In v0.4

- Package/game version advanced to `0.4.0`.
- Save version advanced to `13`.
- Journey Reset is visible in the normal Stats path.
- Completing one Earth loop enables Journey Reset.
- Journey Reset grants local Journey Tokens based on completed Earth loops.
- Journey Reset clears normal upgrades, followers, active boosts, Earth route distance, route events, and current combo state.
- Journey Reset preserves account state, WalkerBucks bridge state, achievements, cosmetics, inventory, profile data, settings, and lifetime stats.
- Moon unlocks after the first Journey Reset.
- Journey Upgrades are visible in the normal Stats path.
- Journey Tokens can buy Better Shoes, Route Memory, Friendly Aura, Bigger Backpack, Moon Map, and Ledger Sense.
- Permanent bonuses now affect distance power, WB queued per mile, follower stability, offline cap, and Moon acceleration.
- Route Memory starts future reset journeys with Leave the Couch complete.
- Milestone distance progress now follows the active route distance so Journey Reset can restart milestone progression without deleting lifetime stats.
- Save migration now normalizes v0.4 prestige fields and preserves older hidden prestige bonuses as equivalent Journey Upgrade levels.
- Local browser smoke now checks v0.4 save version and Journey Reset/Journey Upgrades visibility.

## Runtime Boundaries To Preserve

- Guest play must keep working without Supabase or WalkerBucks bridge configuration.
- Spendable WB must come from WalkerBucks, not local state.
- Journey Tokens are local prestige progress only; they are not spendable WalkerBucks, a ledger, or a transferable economy asset.
- Walking, milestones, achievements, quests, random events, route encounters, and consumables may queue pending WB grants for bridge settlement.
- Upgrade, follower, and item purchases may reserve bridge-reported spendable WB optimistically, but must settle through WalkerBucks or roll back.
- Journey Reset must not delete WalkerBucks bridge state, account state, cosmetics, inventory, achievements, or profile data.
- Do not regenerate CSV item sources or generated catalog JSON for normal v0.4 iteration.
- Mars and Solar System remain dev/prototype surfaces, not normal player-path v0.4 content.

## Important Files

- `src/game/constants.ts`
- `src/game/types.ts`
- `src/game/world.ts`
- `src/game/formulas.ts`
- `src/game/followers.ts`
- `src/game/milestones.ts`
- `src/game/save.ts`
- `src/components/GameHUD.tsx`
- `src/components/ProgressPanel.tsx`
- `src/components/StatsPanel.tsx`
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
- HUD shows WB, DT, DPS, DPT, current route, region, crew, offline cap, tap combo when active, and JT.
- Stats sheet shows Regions, Distance Progress, Journey Reset, Journey Upgrades, Stats, and Achievements.
- Journey Reset button is locked before the first Earth loop.
- A prestige-ready save can reset for Journey Tokens.
- Reset returns Earth route distance to the start, clears normal run power, and preserves WalkerBucks bridge state, achievements, cosmetics, inventory, profile, account, and settings.
- Journey Upgrades spend Journey Tokens only.
- Guest player cannot spend WB without a settled WalkerBucks balance.
- Earned WB stays queued for bridge settlement and does not become local spendable WB.

## Next Session Prompt

```text
Continue in /Users/shanewalker/Desktop/dev/Walk-The-World from docs/V0_4_GAME_DESIGN.md and docs/V0_4_HANDOFF.md. Proceed with v0.5 only: content depth, collections, rare cosmetics, more follower/boost/scenery/achievement content, limited-time rewards, titles, and collection goals. Preserve the WalkerBucks ledger boundary: WTW can queue pending reward/spend metadata and reserve bridge-reported spendable WB, but no local/browser/app-specific state creates spendable WB. Keep Journey Tokens local to prestige progress only, keep guest/local mode working, do not regenerate CSV/generated catalog data unless explicitly asked, and run npm run build, npm test, npm run smoke:local, and git diff --check before calling the pass complete.
```
