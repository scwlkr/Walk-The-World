# Walk The World

Walk The World is a mobile-first incremental walking game in the Walker World ecosystem.

v0.1 is intentionally narrow: tap to gain Distance Traveled, earn passive Distance Per Second, buy WalkerBucks-settled generator and tap upgrades, hit milestones, and watch the scenery change as the route grows.

```text
tap WALK -> gain distance -> reach milestone -> queue WB reward
-> settle WB through WalkerBucks -> buy generator/tap/offline upgrades
-> raise DPS/DPT -> reach the next place
```

## v0.1 Scope

Shipped in the active player path:

- Distance Traveled (DT)
- Distance Per Second (DPS)
- Distance Per Tap (DPT)
- Tappable scene and WALK button
- Basic generator, tap, and offline-cap upgrades
- WalkerBucks bridge spending for upgrades
- Ledger-safe queued WalkerBucks rewards
- 4-hour base offline progress cap
- Early distance milestones
- Suburb, city, forest, desert, and mountain route progression
- Local guest play with optional account and WalkerBucks bridge setup

Delayed beyond v0.1:

- Followers and morale
- Cosmetics as follower-stability tools
- Boost catalog
- Region-specific events
- Journey Reset / prestige
- Marketplace and shared inventory depth
- Discord and Telegram reward linking

Some older prototype systems still exist in the codebase for reference and dev testing, but they are not part of the default v0.1 player path.

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

- [v0.1 Game Design](docs/V0_1_GAME_DESIGN.md)
- [v0.1 Handoff](docs/V0_1_HANDOFF.md)
- [WalkerBucks Bridge](docs/WALKERBUCKS_BRIDGE.md)
- [Walker World Dependencies](docs/WALKER_WORLD_DEPENDENCIES.md)
- [Asset Pipeline](docs/ASSET_PIPELINE.md)

Older C-version/private-beta docs were moved to `docs/archive/c-version/` because they describe an overbuilt roadmap that no longer matches the active v0.1 plan.

## Key Files

```text
src/App.tsx
src/game/constants.ts
src/game/distance.ts
src/game/formulas.ts
src/game/landmarks.ts
src/game/milestones.ts
src/game/progression.ts
src/game/tick.ts
src/game/upgrades.ts
src/components/GameHUD.tsx
src/components/JourneyPanel.tsx
src/components/ProgressPanel.tsx
src/components/ShopModal.tsx
src/services/walkerbucksClient.ts
supabase/functions/walkerbucks-bridge/index.ts
```

## Save Notes

- Save key: `walk_the_world_save_v1`
- Current save version: `10`
- Guest play works without Supabase or WalkerBucks bridge configuration.
- WB earned while walking is queued for bridge settlement; it is not spendable local currency.
- Upgrade purchases are applied only after the WalkerBucks spend request settles.
