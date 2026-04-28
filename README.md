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
walk → gain distance → earn WB → buy upgrades/followers → walk faster
→ hit landmarks → complete Earth loop → tease Moonwalk Mode
```

- Manual walking via **WALK** button.
- Idle walking via automatic game tick.
- WB earned from distance.
- Earth loop bonus grants **10,000 WB**.
- Earth prestige unlocks playable Moon progression.

## Current MVP Features

- Idle + click walking loop
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
      GameSceneCanvas.tsx
      TopStatsBar.tsx
      WalkButton.tsx
      ProgressPanel.tsx
      QuestPanel.tsx
      ShopModal.tsx
      UpgradeList.tsx
      FollowerList.tsx
      RandomEventOverlay.tsx
      StatsPanel.tsx
      SettingsPanel.tsx
      WalkerBucksPanel.tsx
      BottomNav.tsx
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
- Includes `saveVersion: 6` with migration from earlier local saves
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

Local WB remains the guest-play currency for upgrades and offline play. Shared WalkerBucks now has a Phase 6 bridge contract and optional Supabase Edge Function scaffold.

- Browser code only uses `VITE_WALKERBUCKS_BRIDGE_URL`.
- WalkerBucks API URL and service token belong in server-side function secrets.
- The first server-backed reward source is `achievement:day_one_check_in`.
- Failed shared-WB grants persist in the local save and can be retried with the same idempotency key.
- Live shared-economy QA still requires a deployed bridge function and reachable WalkerBucks API.

No real-money value, no crypto, no paid loot boxes.

## Known Limitations

- Account sync requires Supabase env vars and table/RLS setup
- WalkerBucks bridge live QA requires deployed Supabase function secrets and a reachable WalkerBucks API
- No service worker yet (manifest-only PWA readiness)
- Mars and Solar System are data-only future tiers
- Most C-version rewards and WB remain local-first; only Day One Walker is wired as the first optional shared-WB grant source

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

- [x] Real pixel art asset pack
- [x] Sound effects/music
- [x] Achievements
- [x] Inventory items
- [x] Cosmetics
- [x] Prestige / world expansion
- [x] Moon fully playable
- [x] Mars/Solar System tiers
- [x] Supabase account sync
- [ ] Shared WalkerBucks economy API
- [ ] Server-authoritative rewards
- [ ] Leaderboards
- [x] Daily quests
- [x] Seasonal events
- [ ] Marketplace/inventory integration
- [ ] Discord/Telegram reward bridge

Persistent C-version planning lives in:

- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- `docs/C_VERSION_SOCIAL_BRIDGE.md`

Every roadmap item should either ship in C, be gated by a blocker doc, or be explicitly planned for a future release.
