# Walk The World

Walk The World is a mobile-first incremental walking game in the Walker World ecosystem.

v0.5 keeps the verified walking, crew, regions, events, Journey Reset, and WalkerBucks-settled shop loop, then adds the first content-depth layer: more catalog items, rare cosmetics, more followers, more scenery beats, collection goals, limited-time rewards, and profile titles.

```text
tap WALK -> gain distance -> reach milestone -> queue WB reward
-> settle WB through WalkerBucks -> buy upgrades, followers, cosmetics, boosts
-> raise DPT/DPS or stabilize the crew -> reach the next place
```

## Current v0.5 Scope

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
- Journey Reset after a completed Earth loop
- Journey Tokens earned from reset progress
- Permanent Journey Upgrades for distance power, WB queued per mile, follower stability, offline cap, Moon acceleration, and route memory
- Reset rules that clear normal run power while preserving account, WalkerBucks bridge state, achievements, cosmetics, inventory, profile, settings, and lifetime stats
- Moon route unlock after the first Journey Reset
- Runtime v0.5 catalog overlay with additional boosts, rare cosmetics, limited-time items, and title collectibles
- Temporary DPS, follower-stability, and follower-recruit boost items
- New rare cosmetics for follower morale and follower stability
- Collection goals for item, souvenir, rare-item, cosmetic, and region progress
- Profile title selection from collection goals and title-bearing items
- Expanded follower roster with boardwalk, world-tour, and post-reset helpers
- Expanded Earth route with Boardwalk and Great Wall scenery beats using existing licensed/runtime assets
- Expanded random-event and route-encounter rewards tied to v0.5 items
- Local guest play with optional account and WalkerBucks bridge setup

Delayed beyond v0.5:

- Marketplace and shared inventory depth
- Discord and Telegram reward linking
- Full v1.0 balance/polish pass

Some older prototype systems still exist in the codebase for reference and dev testing, but marketplace depth, leaderboard depth, Mars/Solar route depth, and social bridge gameplay are not part of the default v0.5 player path.

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

- [v0.5 Game Design](docs/V0_5_GAME_DESIGN.md)
- [v0.5 Handoff](docs/V0_5_HANDOFF.md)
- [v0.4 Game Design](docs/V0_4_GAME_DESIGN.md)
- [v0.4 Handoff](docs/V0_4_HANDOFF.md)
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
src/game/world.ts
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
- Current save version: `14`
- Guest play works without Supabase or WalkerBucks bridge configuration.
- WB earned while walking is queued for bridge settlement; it is not spendable local currency.
- Upgrade, follower, and item purchases reserve bridge-reported spendable WB and roll back if settlement fails.
