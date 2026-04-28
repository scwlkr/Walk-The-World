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
tap the scene or WALK → gain distance → earn WB → buy upgrades/followers → walk faster
→ hit landmarks → prestige Earth → unlock Moon progression
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
- Upgrade shop (data-driven)
- Follower shop (data-driven)
- Local achievements with claimable WB/item/cosmetic rewards
- Local inventory with consumable, collectible, equipment, and cosmetic item types
- Gameplay-affecting cosmetics and equipment
- Prestige, world expansion, and playable Moon progression
- Local daily quests and seasonal event framework
- Offline progress with cap + summary banner
- localStorage autosave + import/export/reset
- Optional Supabase email/password, Google auth, and manual cloud save upload/load
- Optional WalkerBucks bridge surfaces for shared balance, first server-backed reward, shared leaderboard, and marketplace purchase proof
- Stats panel + settings panel
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
- `quests`
- `dailyPlay`
- `account`
- `walkerBucksBridge`
- `activeBoosts`
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
    components/
      AccountPanel.tsx
      BottomControls.tsx
      GameSceneCanvas.tsx
      TopStatsBar.tsx
      WalkButton.tsx
      ProgressPanel.tsx
      QuestPanel.tsx
      ShopModal.tsx
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
- Includes `saveVersion: 7` with migration from earlier local saves
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

## WalkerBucks API Readiness

Local WB remains the guest-play currency for upgrades and offline play. Shared WalkerBucks now has a trusted bridge contract, optional Supabase Edge Function scaffold, shared-balance read, first server-backed reward path, leaderboard read, and marketplace purchase proof.

- Browser code only uses `VITE_WALKERBUCKS_BRIDGE_URL`.
- WalkerBucks API URL and service token belong in server-side function secrets.
- The first server-backed reward source is `achievement:day_one_check_in`.
- Failed shared-WB grants persist in the local save and can be retried with the same idempotency key.
- Live shared-economy QA still requires a deployed bridge function and reachable WalkerBucks API.

No real-money value, no crypto, no paid loot boxes.

## Known Limitations

- This is private beta software, not a public launch build.
- Guest/local play works without Supabase, WalkerBucks, Discord, or Telegram configuration.
- Account sync is implemented but live recovery requires Supabase env vars plus the `game_saves` table/RLS setup.
- Shared WalkerBucks balance, Day One Walker shared reward, leaderboard, and marketplace proof require the deployed bridge function, server-only bridge secrets, Supabase auth, and a reachable WalkerBucks API.
- Local WB remains the upgrade/play currency; shared WalkerBucks is read and spent only through the trusted bridge.
- Marketplace purchases remain shared WalkerBucks item instances; shared inventory is not merged into local game inventory yet.
- Discord reward linking is contract-defined only. Telegram remains deferred until Discord linking and shared WalkerBucks flows are stable.
- No service worker yet (manifest-only PWA readiness).
- Mars and Solar System are locked data scaffolds for future tiers.

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
| Inventory items | Shipped | Consumable, collectible, equipment, and cosmetic item types persist locally. |
| Cosmetics | Shipped | Cosmetic and equipment effects are visible in gameplay stats/details. |
| Prestige / world expansion | Shipped | Earth prestige grants permanent bonuses and unlocks Moon progression. |
| Moon fully playable | Shipped | Moon world, route progress, landmarks, and scene assets are playable after prestige. |
| Mars/Solar System tiers | Future-planned | Locked data scaffolds exist; full tiers are intentionally deferred beyond C. |
| Supabase account sync | Gated | Client UI and cloud-save code are implemented; live recovery requires Supabase env vars and `game_saves` table/RLS setup. |
| Shared WalkerBucks economy API | Gated | Browser calls only the trusted bridge; live QA requires deployed bridge secrets and reachable WalkerBucks API. |
| Server-authoritative rewards | Gated | Day One Walker has the first idempotent shared-WB reward path; live grant QA waits on bridge deployment/configuration. |
| Leaderboards | Gated | Shared WalkerBucks balance leaderboard is implemented through the bridge; live QA waits on account/bridge configuration. |
| Daily quests | Shipped | Local daily quest generation, progress, rewards, and persistence are in place. |
| Seasonal events | Shipped | Spring Stride Festival framework, visual treatment, quest variation, and rewards are in place. |
| Marketplace/inventory integration | Gated | Shared WalkerBucks offer loading and purchase proof are implemented; shared inventory-to-game merge is future work. |
| Discord/Telegram reward bridge | Gated | Discord identity-linking contract is documented server-side; Telegram is deferred until Discord linking is stable. |

Persistent C-version planning lives in:

- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- `docs/C_VERSION_SOCIAL_BRIDGE.md`

Every roadmap item should either ship in C, be gated by a blocker doc, or be explicitly planned for a future release.
