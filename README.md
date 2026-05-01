# Walk The World

Walk The World is a mobile-first incremental walking game in the Walker World ecosystem.

v0.3 keeps the verified walking and crew loop, then makes the world feel larger: regions now drive visible bonuses, regional shop offers, regional followers, weather/events, daily and weekly event goals, active tap combos, and expanded achievements.

```text
tap WALK -> gain distance -> reach milestone -> queue WB reward
-> settle WB through WalkerBucks -> buy upgrades, followers, cosmetics, boosts
-> raise DPT/DPS or stabilize the crew -> reach the next place
```

## Current v0.3 Scope

Shipped in the active player path:

- Distance Traveled (DT)
- Distance Per Second (DPS)
- Distance Per Tap (DPT)
- Tappable scene and WALK button
- Basic generator, tap, and offline-cap upgrades
- Followers with recruit chance, leave chance, and morale
- Cosmetics that improve follower morale or stability
- Early boost/consumable item shop
- First achievement panel and claim flow
- Region tour panel with 15 Earth regions
- Region-specific shop refreshes using existing catalog offers
- Region-specific followers and cosmetic/gear highlights
- Weather and route events in the default player path
- Daily and weekly walking event board
- Active tap combo and perfect-step bonuses
- Expanded region/event achievements
- WalkerBucks bridge spending for upgrades
- WalkerBucks bridge spending for followers and item offers
- Ledger-safe queued WalkerBucks rewards
- 4-hour base offline progress cap
- Early distance milestones
- Expanded route progression from starter zones through city, forest, desert, canyon, mountain, waterfront, rainy city, old town, and neon city beats
- Local guest play with optional account and WalkerBucks bridge setup

Delayed beyond v0.3:

- Journey Reset / prestige
- Marketplace and shared inventory depth
- Discord and Telegram reward linking

Some older prototype systems still exist in the codebase for reference and dev testing, but marketplace depth, leaderboard depth, Journey Reset, and social bridge gameplay are not part of the default v0.3 player path.

## Run Locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
npm run smoke:local
```

The dev-only lab is available at:

```text
http://127.0.0.1:5173/?dev=1
```

## WalkerBucks Boundary

WalkerBucks is not local to this repo.

WTW can calculate walking progress and queue reward/spend requests, but no local save, browser state, Supabase game-save row, or WTW-owned table can create spendable WB. Spendable balances, rewards, purchases, transfers, and audit history settle through the trusted WalkerBucks bridge/API.

Browser-safe env:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WALKERBUCKS_BRIDGE_URL=
```

Server-only WalkerBucks secrets belong in the trusted bridge, never in Vite env vars.

## Active Docs

- [v0.3 Game Design](docs/V0_3_GAME_DESIGN.md)
- [v0.3 Handoff](docs/V0_3_HANDOFF.md)
- [v0.2 Game Design](docs/V0_2_GAME_DESIGN.md)
- [v0.2 Handoff](docs/V0_2_HANDOFF.md)
- [v0.1 Game Design](docs/V0_1_GAME_DESIGN.md)
- [v0.1 Handoff](docs/V0_1_HANDOFF.md)
- [WalkerBucks Bridge](docs/WALKERBUCKS_BRIDGE.md)
- [Walker World Dependencies](docs/WALKER_WORLD_DEPENDENCIES.md)
- [Asset Pipeline](docs/ASSET_PIPELINE.md)

Older C-version/private-beta docs were moved to `docs/archive/c-version/` because they describe an overbuilt roadmap that no longer matches the active lightweight version plan.

## Key Files

```text
src/App.tsx
src/game/constants.ts
src/game/distance.ts
src/game/formulas.ts
src/game/followers.ts
src/game/landmarks.ts
src/game/milestones.ts
src/game/regions.ts
src/game/activePlay.ts
src/game/progression.ts
src/game/tick.ts
src/game/upgrades.ts
src/game/cosmetics.ts
src/components/GameHUD.tsx
src/components/FollowerList.tsx
src/components/JourneyPanel.tsx
src/components/ProgressPanel.tsx
src/components/ShopModal.tsx
src/services/walkerbucksClient.ts
supabase/functions/walkerbucks-bridge/index.ts
```

## Save Notes

- Save key: `walk_the_world_save_v1`
- Current save version: `12`
- Guest play works without Supabase or WalkerBucks bridge configuration.
- WB earned while walking is queued for bridge settlement; it is not spendable local currency.
- Upgrade, follower, and item purchases reserve bridge-reported spendable WB and roll back if settlement fails.
