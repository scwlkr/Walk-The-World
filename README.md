# Walk The World (Walker World)

**Walk The World** is a mobile-first incremental / idle PWA game in the **Walker World** universe.
You begin in **Walkertown**, crawl forward one tiny step at a time, and eventually loop the Earth while stacking **WalkerBucks (WB)**.

> Core vibe: open app → tap walk → number goes up → buy goofy upgrade → speed improves → chase next upgrade.

## Tech Stack

- Vite
- React 18
- TypeScript (strict)
- Canvas API for game scene rendering
- localStorage guest save system
- Optional Supabase account/cloud save
- Basic PWA manifest

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Core Gameplay Loop

```text
tap the scene or WALK → gain distance → hit quick Journey milestones → earn WB/items
→ resolve route encounters → buy upgrades/followers/catalog items → walk faster
→ hit landmarks → prestige Earth → unlock Moon and Mars prototype progression
```

- Manual walking via the **WALK** button or by tapping the scene.
- Idle walking via automatic game tick.
- WB earned from distance.
- Earth loop bonus grants **10,000 WB**.
- Earth prestige unlocks playable Moon progression.

## Current MVP Features

- Idle + click walking loop
- Visible WALK control plus tappable scene walking
- Pixel/block-inspired animated canvas scene
- Landmark route across a full Earth loop
- Random clickable events (rewarding, no brutal negatives)
- Route encounters with short choices, pickups, WalkerBucks grant queue rewards, item drops, and temporary boosts
- Journey milestone strip for early first-session goals and claimable rewards
- Upgrade shop (data-driven)
- Follower shop (data-driven)
- Generated item catalog adapter for local item drops and catalog shop offers
- Local achievements with claimable WB/item/cosmetic/title rewards
- Local inventory with consumable, collectible, equipment, cosmetic, title, and safe inert collectible item types
- Gameplay-affecting cosmetics and equipment
- Prestige, world expansion, playable Moon progression, and local Mars prototype after Moon loop completion
- Local daily quests and seasonal event framework
- Offline progress with cap + summary banner
- localStorage autosave + import/export/reset
- Optional Supabase email/password, Google auth, and manual cloud save upload/load
- Optional WalkerBucks bridge surfaces for shared balance, first server-backed reward, shared leaderboard, marketplace purchase proof, and read-only shared inventory entitlements
- Stats panel + settings panel
- Dev-only scene/vibe lab behind `?dev=1` during Vite development
- Mobile-first bottom nav + desktop-friendly layout
- PWA-ready web manifest

## Data Model Overview

Core state includes:

- `distanceMiles`
- `walkerBucks`
- `totalWalkerBucksEarned`
- `baseIdleMilesPerSecond`
- `baseClickMiles`
- `currentWorldId`
- `worlds`
- `prestige`
- `earthLoopsCompleted`
- `upgrades`
- `followers`
- `achievements`
- `inventory`
- `cosmetics`
- `profile`
- `milestones`
- `quests`
- `dailyPlay`
- `account`
- `walkerBucksBridge`
- `activeBoosts`
- `nextRouteEncounterAt`
- `spawnedRouteEncounter`
- `stats`
- `lastSavedAt`

Game math is centralized in `src/game/formulas.ts` (pure helper functions).

## File Structure

```text
Walk-The-World/
  public/
    manifest.webmanifest
  src/
    main.tsx
    App.tsx
    styles/
      global.css
    game/
      constants.ts
      types.ts
      initialState.ts
      formulas.ts
      upgrades.ts
      followers.ts
      landmarks.ts
      randomEvents.ts
      save.ts
      tick.ts
      world.ts
      economy.ts
      items.ts
      milestones.ts
      progression.ts
      routeEncounters.ts
      devPresets.ts
    components/
      AccountPanel.tsx
      BottomControls.tsx
      GameSceneCanvas.tsx
      TopStatsBar.tsx
      WalkButton.tsx
      ProgressPanel.tsx
      QuestPanel.tsx
      ShopModal.tsx
      CatalogShopPanel.tsx
      JourneyPanel.tsx
      RouteEncounterOverlay.tsx
      SharedInventoryPanel.tsx
      DevLabPanel.tsx
      MarketplacePanel.tsx
      UpgradeList.tsx
      FollowerList.tsx
      RandomEventOverlay.tsx
      StatsPanel.tsx
      LeaderboardPanel.tsx
      SettingsPanel.tsx
      WalkerBucksPanel.tsx
      SocialBridgePanel.tsx
    services/
      authClient.ts
      cloudSaveClient.ts
      walkerbucksClient.ts
  supabase/
    functions/
      walkerbucks-bridge/
```

## Save System Notes

- Save key: `walk_the_world_save_v1`
- Includes `saveVersion: 8` with migration from earlier local saves
- Autosaves every 5s and on important actions (walk, purchases, events)
- Save before unload
- Import/export as JSON text in settings
- Guest play works without Supabase or WalkerBucks bridge configuration
- Signed-in players can manually upload local saves or load cloud saves
- WalkerBucks bridge reward state stores pending/failed grants for retry

## Account Sync Environment

Optional account sync uses Supabase Auth and a `game_saves` table. Optional WalkerBucks bridge reads and grants use a trusted server function.

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WALKERBUCKS_BRIDGE_URL=
```

See `.env.example`, `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`, and `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` for setup details. Without these variables, the app stays in guest/local mode.

Repo-controlled Supabase setup now lives in:

- `supabase/config.toml`
- `supabase/migrations/20260428063000_create_game_saves.sql`
- `supabase/functions/walkerbucks-bridge/index.ts`
- `docs/WALKERWORLD_SUPABASE_ARCHITECTURE.md`

Live private-beta smoke command:

```bash
npm run smoke:private-beta-live
```

Local dev/browser smoke command:

```bash
npm run smoke:local
```

`smoke:local` starts Vite, launches a Chrome-compatible browser through the debugging protocol, verifies a mobile fresh-save path, claims a Journey milestone, uses and buys an item, resolves a route encounter, opens the dev lab, and reloads without losing local state.

Production browser smoke command:

```bash
npm run smoke:production-browser
```

`smoke:production-browser` opens `https://walk-the-world.vercel.app/` in a clean mobile browser profile, verifies guest play, Journey milestones, route encounters, catalog spend gating, account creation, cloud upload, WalkerBucks balance, leaderboard, marketplace offers, shared inventory, Mars prototype entry, sign-out fallback, and screenshot capture under ignored `qa-artifacts/`.

Required smoke env vars:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
WTW_BETA_SMOKE_EMAIL=
WTW_BETA_SMOKE_PASSWORD=
```

Set `WTW_BETA_SMOKE_REQUIRE_BRIDGE=true` and `WTW_BETA_SMOKE_ALLOW_PURCHASE=true` for the full live WalkerBucks bridge smoke. Use `WTW_BETA_SMOKE_PURCHASE_OFFER_ID=13` when you need the idempotent 20 WB private-beta purchase proof.

## WalkerBucks API Readiness

WalkerBucks is ledger-owned. WTW can queue earned WB while offline or unsigned, but spendable WB comes from the trusted bridge balance, and upgrades, followers, catalog items, marketplace offers, and migration grants settle through WalkerBucks.

- Browser code only uses `VITE_WALKERBUCKS_BRIDGE_URL`.
- WalkerBucks API URL and service token belong in server-side function secrets.
- Fixed and dynamic WTW reward sources settle through the bridge with stable idempotency keys.
- Failed WalkerBucks grants and spends persist in the save and can be retried with the same idempotency key.
- Live shared-economy QA passes through the deployed Supabase bridge and hosted WalkerBucks API.
- WalkerBucks marketplace inventory is mapped into read-only app-layer entitlements when the offer matches a generated catalog item.
- Unknown shared inventory remains visible as shared-only and does not mint WB or gameplay items.

No real-money value, no crypto, no paid loot boxes.

## Known Limitations

- This is private beta software, not a public launch build.
- Guest/local play works without Supabase, WalkerBucks, Discord, or Telegram configuration.
- Account sync is implemented and live recovery has passed against `walk_the_world.game_saves` in the shared `WalkerWorld` Supabase project.
- Shared WalkerBucks balance, Day One Walker shared reward, leaderboard, offer loading, and the beta marketplace purchase proof pass through the trusted bridge.
- Local WB remains the upgrade/play currency; shared WalkerBucks is read and spent only through the trusted bridge.
- Shared WalkerBucks item instances are visible as read-only shared inventory entitlements; only known generated catalog mappings receive local item context.
- Discord reward linking is contract-defined only. Telegram remains deferred until Discord linking and shared WalkerBucks flows are stable.
- No service worker yet (manifest-only PWA readiness).
- Mars has a local playable prototype after the Moon loop. Solar System remains future data scaffolding.
- Version C private beta is tagged as `v0.2.0-beta.1` after production browser QA and live bridge smoke passed.

## C Version Asset Intake

The first C-version work is asset intake, not final art polish. Drop original/editable files under `assets/source/` and game-ready files under `public/assets/`, because Vite serves `public/` from the web root.

Full instructions and naming rules live in `docs/ASSET_PIPELINE.md`.

Initial game-ready targets:

```text
public/assets/characters/walker/walker_walk_right_sheet.png
public/assets/backgrounds/walkertown/composite.png
public/assets/audio/music/main_theme.ogg
public/assets/audio/sfx/button_tap.ogg
public/assets/audio/sfx/purchase.ogg
public/assets/audio/sfx/random_event.ogg
```

## MVP B Checklist

- [x] Vite React TypeScript app created
- [x] Mobile-first layout
- [x] Canvas walking scene
- [x] Distance progression
- [x] WalkerBucks earning
- [x] Manual WALK button
- [x] Idle progress
- [x] Upgrade shop
- [x] Follower shop
- [x] Random events
- [x] Landmark progression
- [x] Earth loop completion
- [x] Offline progress
- [x] localStorage save
- [x] Settings/reset
- [x] Basic PWA manifest

## Roadmap to C Version

| Roadmap item | C status | Evidence / next action |
| --- | --- | --- |
| Real pixel art asset pack | Shipped | Runtime asset manifest, walker sheet fallback, background composites, and asset pipeline docs are in place. |
| Sound effects/music | Shipped | Generated SFX plus persisted music track picker for shipped tracks. |
| Achievements | Shipped | Data-driven local achievements with claimable rewards. |
| Inventory items | Shipped | Generated catalog items are adapted into local drops/shop/inventory with safe inert behavior for unimplemented effects. |
| Cosmetics | Shipped | Cosmetic and equipment effects are visible in gameplay stats/details. |
| Prestige / world expansion | Shipped | Earth prestige grants permanent bonuses and unlocks Moon progression. |
| Moon fully playable | Shipped | Moon world, route progress, landmarks, and scene assets are playable after prestige. |
| Mars/Solar System tiers | Partial | Mars prototype is playable after Moon loop completion; Solar System remains future data scaffolding. |
| Supabase account sync | Shipped | Client UI, cloud-save code, Supabase config, `walk_the_world.game_saves`, RLS, and live upload/load smoke are implemented. |
| Shared WalkerBucks economy API | Shipped | Hosted WalkerBucks API, server-only bridge secrets, and bridge live smoke are complete. |
| Server-authoritative rewards | Shipped | WTW reward grants queue locally, then settle through the WalkerBucks bridge before becoming spendable. |
| Leaderboards | Shipped | Shared WalkerBucks balance leaderboard is implemented through the bridge and live smoke passes. |
| Daily quests | Shipped | Local daily quest generation, progress, rewards, and persistence are in place. |
| Seasonal events | Shipped | Spring Stride Festival framework, visual treatment, quest variation, and rewards are in place. |
| Marketplace/inventory integration | Shipped | Shared WalkerBucks offer loading, beta purchase proof, and read-only shared inventory entitlement mapping are in place. |
| Discord/Telegram reward bridge | Gated | Discord identity-linking contract is documented server-side; Telegram is deferred until Discord linking is stable. |

Persistent C-version planning lives in:

- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- `docs/C_VERSION_SOCIAL_BRIDGE.md`

Every roadmap item should either ship in C, be gated by a blocker doc, or be explicitly planned for a future release.
