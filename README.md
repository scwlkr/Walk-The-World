# Walk The World (Walker World)

**Walk The World** is a mobile-first incremental / idle PWA game in the **Walker World** universe.
You begin in **Walkertown**, crawl forward one tiny step at a time, and eventually loop the Earth while stacking **WalkerBucks (WB)**.

> Core vibe: open app → tap walk → number goes up → buy goofy upgrade → speed improves → chase next upgrade.

## Tech Stack

- Vite
- React 18
- TypeScript (strict)
- Canvas API for game scene rendering
- localStorage save system
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

## Current MVP Features

- Idle + click walking loop
- Pixel/block-inspired animated canvas scene
- Landmark route across a full Earth loop
- Random clickable events (rewarding, no brutal negatives)
- Upgrade shop (data-driven)
- Follower shop (data-driven)
- Offline progress with cap + summary banner
- localStorage autosave + import/export/reset
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
- `earthLoopsCompleted`
- `upgrades`
- `followers`
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
    components/
      GameSceneCanvas.tsx
      TopStatsBar.tsx
      WalkButton.tsx
      ProgressPanel.tsx
      ShopModal.tsx
      UpgradeList.tsx
      FollowerList.tsx
      RandomEventOverlay.tsx
      StatsPanel.tsx
      SettingsPanel.tsx
      BottomNav.tsx
```

## Save System Notes

- Save key: `walk_the_world_save_v1`
- Includes `saveVersion: 1` for migration readiness
- Autosaves every 5s and on important actions (walk, purchases, events)
- Save before unload
- Import/export as JSON text in settings

## WalkerBucks API Readiness

Current WB is local-only game currency.

```ts
// TODO: Future WalkerBucks API integration.
// Local WB is currently client-side only.
// Server-authoritative rewards should replace this before shared economy launch.
```

No real-money value, no crypto, no paid loot boxes.

## Known Limitations (Intentional for MVP B)

- No backend/auth/cloud sync yet
- No service worker yet (manifest-only PWA readiness)
- Moon world is teased/locked, not fully playable
- Placeholder pixel/block art built with canvas primitives
- No sound implementation yet (settings toggle placeholder)

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

- [ ] Real pixel art asset pack
- [ ] Sound effects/music
- [ ] Achievements
- [ ] Inventory items
- [ ] Cosmetics
- [ ] Prestige / world expansion
- [ ] Moon fully playable
- [ ] Mars/Solar System tiers
- [ ] Supabase account sync
- [ ] Shared WalkerBucks economy API
- [ ] Server-authoritative rewards
- [ ] Leaderboards
- [ ] Daily quests
- [ ] Seasonal events
- [ ] Marketplace/inventory integration
- [ ] Discord/Telegram reward bridge
