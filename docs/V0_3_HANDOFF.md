# Walk The World v0.3 Handoff

Last updated: 2026-05-01

## Current Scope

The active plan is v0.3 Regions and Events.

Goal:

```text
Different places feel different.
The shop changes.
Events interrupt the normal loop.
Active play has a rhythm.
The player wants to see the next region.
```

## Implemented In v0.3

- Package/game version advanced to `0.3.0`.
- Save version advanced to `12`.
- Added `src/game/regions.ts` with 15 Earth regions.
- Regions now add small local bonuses for DPS, DPT, event rewards, follower recruiting, or follower stability.
- Added a visible Regions panel in the Stats sheet.
- HUD now shows the current region, next region, region effect summary, and tap combo.
- Local catalog shop now includes regional daily refresh offers using existing generated catalog data.
- Destination-locked catalog offers now unlock when the matching region has been reached.
- Added regional followers: City Power Walker, Umbrella Walker, Guy Who Bought Trekking Poles, and Neon Stride Fan.
- Weather/random events and route encounters are enabled in the default player path.
- Added region-filtered events for Perfect Weather, Rainy Day, Blister Incident, Parade, Walking Playlist, Rush-Hour Sprint, and Double Step Weekend.
- Added active tap combo state and perfect-step tracking.
- Daily/weekly walking events are visible from Milestones in the normal player path.
- Expanded achievements for regions, route encounters, weather/event chasing, and perfect steps.

## Runtime Boundaries To Preserve

- Guest play must keep working without Supabase or WalkerBucks bridge configuration.
- Spendable WB must come from WalkerBucks, not local state.
- Walking, milestones, achievements, quests, random events, route encounters, and consumables may queue pending WB grants for bridge settlement.
- Upgrade, follower, and item purchases may reserve bridge-reported spendable WB optimistically, but must settle through WalkerBucks or roll back.
- Regions, weather events, tap combo, followers, morale, cosmetics, and boosts are WTW gameplay state only.
- Do not regenerate CSV item sources or generated catalog JSON for normal v0.3 iteration.

## Important Files

- `src/game/constants.ts`
- `src/game/types.ts`
- `src/game/regions.ts`
- `src/game/activePlay.ts`
- `src/game/randomEvents.ts`
- `src/game/routeEncounters.ts`
- `src/game/followers.ts`
- `src/game/items.ts`
- `src/game/quests.ts`
- `src/game/achievements.ts`
- `src/game/save.ts`
- `src/components/GameHUD.tsx`
- `src/components/RegionPanel.tsx`
- `src/components/CatalogShopPanel.tsx`
- `src/components/FollowerList.tsx`
- `src/components/QuestPanel.tsx`
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
- HUD shows WB, DT, DPS, DPT, current region, next region, crew, morale, offline cap, and tap combo after active taps.
- Shop opens with upgrades, followers, boosts/regional gear, and cosmetics tabs.
- Regional shop offer copy appears in the Boosts tab.
- Regional followers show their region labels and lock outside their regions.
- Milestones sheet shows daily and weekly events.
- Stats sheet shows the Regions panel and expanded achievements.
- Guest player cannot spend WB without a settled WalkerBucks balance.
- Earned WB stays queued for bridge settlement and does not become local spendable WB.

## Next Session Prompt

```text
Continue in /Users/shanewalker/Desktop/dev/Walk-The-World from docs/V0_3_GAME_DESIGN.md and docs/V0_3_HANDOFF.md. Proceed with v0.4 only: Journey Reset / prestige in the normal player path. Preserve the WalkerBucks ledger boundary: WTW can queue pending reward/spend metadata and reserve bridge-reported spendable WB, but no local/browser/app-specific state creates spendable WB. Keep guest/local mode working, do not regenerate CSV/generated catalog data unless explicitly asked, and run npm run build, npm test, npm run smoke:local, and git diff --check before calling the pass complete.
```
