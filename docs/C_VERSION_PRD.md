# Walk The World C Version PRD

Last updated: 2026-04-30

## Source Inputs

- `README.md` roadmap to C Version.
- `docs/questions_from_codex.md` stakeholder answers.
- `docs/WALKER_WORLD_DEPENDENCIES.md` WalkerBucks ledger boundary.
- Current game repo files under `src/`, `public/assets/`, and `assets/source/`.
- WalkerBucks repo inspected from `/Users/shanewalker/Desktop/dev/WalkerBucks` at `0d14d280a579`.
- Local Discord repo inspected at `/Users/shanewalker/Desktop/dev/walker-world-discord`.

## Product Definition

C Version is the first private-beta online Walker World game with account persistence, more exciting minute-to-minute idle/clicker play, and a credible path into the shared WalkerBucks economy.

The game should still be easy to understand:

```text
open app -> walk -> earn -> collect -> upgrade -> unlock worlds -> flex progress
```

The C Version should not become a full MMO, financial product, or marketplace-first app. It remains a mobile-first idle clicker with collectible progression and Walker World flavor.

## Primary Player

- Friends/private beta players.
- Likely Discord-community adjacent.
- Expected to tolerate rough edges if the core game loop is fun and their progress persists.

## Goals

- Make the game more fun minute to minute with strict pixel art, better animation, track selection, achievements, inventory, cosmetics, daily quests, and events.
- Add persistent account identity so players can return on another session/device without losing progress.
- Prepare WalkerBucks integration through the dedicated WalkerBucks API instead of inventing a separate economy inside this repo.
- Ship or explicitly document the blocker for every item in the README C Version roadmap.

## Non-Goals

- No real-money value, crypto, cash-out, or paid loot-box systems.
- No public launch requirement for this C milestone.
- No full anti-cheat program unless it is needed to protect the WalkerBucks bridge.
- No Telegram bridge until Discord and WalkerBucks account-linking contracts are clear.
- No broad Mars/Solar System implementation in C; C should plan future world tiers without building every future world.

## Evidence And Current State

The game already has the MVP B loop and several early C assets:

- Walker sprite sheet exists at `public/assets/characters/walker/walker_walk_right_sheet.png`.
- Background composites exist for many scenes under `public/assets/backgrounds/`.
- Music files exist under `public/assets/audio/music/`.
- Generated Web Audio sound effects exist in `src/game/audio.ts`.
- Item and cosmetic shop tabs exist as local guest-save collection panels.
- `currentWorldId` now supports `earth`, playable `moon`, and locked future `mars` / `solar_system` definitions.

WalkerBucks is the only source of truth for spendable WB and is not safe for direct browser use:

- It is a FastAPI monolith with PostgreSQL and a double-entry ledger.
- It owns account identity links, wallet balances, reward grants, transfers, ledger entries, and audit history.
- It exposes account, wallet, reward, transfer, and leaderboard routes used by the trusted bridge.
- It does not expose item, shop, inventory, or marketplace routes as WalkerBucks core APIs.
- Retained item/shop rows are app-layer compatibility data and must not become a second WalkerBucks ledger.
- `/v1/accounts/me` exists but still requires the trusted bridge/account-mapping path for WTW.
- Privileged API access needs an authenticated server-side caller before public/shared-economy use.

The Discord repo already contains a WalkerBucks-themed economy and inventory direction:

- Discord bot earns WalkerBucks through chat, voice, daily streaks, drops, social commands, and weekly awards.
- Its generated economy catalog includes shops, items, perks, titles, and achievements.
- The current Discord economy is not yet a clean shared account service contract for this web game.

## C Version Roadmap Policy

Every README roadmap item must land in exactly one status:

- `Ship in C`: implemented and verified in this repo.
- `Gate in C`: implemented far enough to prove the path, with a documented blocker and next action.
- `Plan for Future`: intentionally deferred with an architecture note so C does not paint future work into a corner.

No roadmap item should remain an unchecked vague promise.

## Requirements

### Pixel Art And Game Feel

- Runtime art must move toward strict pixel art, not generic blocky placeholder art.
- Existing first-pass backgrounds can be used, but must be refined so scrolling does not visibly break.
- The walker needs richer animation coverage: walk, idle, click/tap feedback, event/reward, and celebration where practical.
- The scene should remain mobile-first and readable on small screens.

### Audio

- All available music tracks should become reachable through a track picker.
- Sound settings should continue to respect browser autoplay constraints.
- Generated SFX are acceptable for C if they fit the game feel.
- Third-party file-based audio must have source/licensing notes before public use. For private beta this is a quality guard, not a blocker.

### Achievements

- Achievements should be both passive badges and reward-bearing milestones.
- Rewards may include queued WB requests, items, cosmetics, titles, or gameplay modifiers.
- Achievement definitions should be data-driven and persist in the save/account model.

### Inventory Items

- Inventory should support a small initial mix:
  - consumables that trigger one-time effects
  - collectibles that track progress and flex value
  - equipment/cosmetics that modify gameplay
  - quest/event items if needed by daily or seasonal systems
- Avoid marketplace-owned asset complexity until the WalkerBucks account bridge is stable.

### Cosmetics

- Cosmetics should affect gameplay, not only visuals.
- Effects must be small enough that cosmetics do not replace upgrades/followers as the main progression system.
- Cosmetic effects should be explicit in item definitions and visible to players.

### Prestige And World Expansion

- Prestige should both reset some Earth progress for permanent bonuses and unlock new world progression.
- The Moon should become playable after Earth progression/prestige.
- The Moon distance must use a documented canonical miles-to-Moon value. Decision needed: average distance, minimum distance, or another chosen Walker World canon value.
- Mars/Solar System tiers should be planned as future world definitions, not fully implemented in C unless earlier phases finish cleanly.

### Accounts And Save Sync

- C needs account persistence.
- Desired auth options are Google, simple email/password, and Discord if it stays reasonable.
- Decision needed: whether Supabase owns game auth/profile/save state while WalkerBucks owns economy ledger, or whether WalkerBucks should grow into the primary account system first.
- Local saves must remain usable as guest/offline progress until account linking exists.

### WalkerBucks Economy

- WalkerBucks integration must route through the WalkerBucks repo/API, not a new local economy service.
- Client code must not directly call privileged reward/admin endpoints.
- The web game needs a server-side adapter or trusted function to grant rewards, purchase items, and sync balances.
- Rewards should become server-authoritative before shared economy launch.
- For C private beta, route progress can remain playable while the bridge is unavailable, but spendable WB must always come from WalkerBucks.
- No client save, browser state, Supabase `game_saves` payload, or WTW-owned table can create spendable WB.
- Every earned or spent WalkerBuck must settle through WalkerBucks with idempotency, account identity, and ledger records.

### Leaderboards

- Leaderboards can rank multiple dimensions if practical:
  - distance
  - WB earned or WB balance
  - Earth loops
  - daily progress
  - events claimed
  - prestige tier
- C should ship at least one working leaderboard once account persistence exists.
- Additional leaderboard categories can be gated behind the account/economy model.

### Daily Quests

- Daily quests should be generated locally for the first C implementation.
- Quest definitions should be data-driven and deterministic enough that saves can persist progress for the day.
- If quests grant shared WalkerBucks, the grant must go through the server bridge.

### Seasonal Events

- Seasonal events should affect visuals, quests, and rewards.
- C should ship the event framework and one small example event, or document the blocker if assets/backend are not ready.

### Marketplace And Inventory Integration

- Marketplace/inventory integration depends on WalkerBucks ledger settlement, account identity, and bridge-verified app-layer entitlements.
- C should start with game-local inventory and a WalkerBucks-ledger purchase proof only after the account bridge exists.
- Do not build peer-to-peer trading in C.

### Discord And Telegram Reward Bridge

- Discord is the first bridge target because a local repo already exists.
- Telegram is future-facing unless the Discord/WalkerBucks bridge is already stable.
- C should document identity linking between game account, WalkerBucks account, and Discord user before granting cross-platform rewards.

## Recommended Architecture Direction

Use a layered progression model:

- `src/game/*` keeps pure game definitions, formulas, tick logic, world data, achievements, inventory, quests, and event definitions.
- React components render state and dispatch actions.
- Local save remains the guest/offline fallback.
- Account sync is introduced behind a service boundary, not scattered through components.
- WalkerBucks is accessed through a server-side adapter, not directly from the browser.

Recommended service ownership, pending approval:

- Supabase or equivalent app backend owns game auth, profile, and cloud save for C.
- WalkerBucks owns the canonical WB ledger, account platform identities, ledger-backed purchases/transfers, and public WB leaderboards.
- Discord bot remains a separate integration client until a shared account-linking contract exists.

## Major Risks

- WalkerBucks browser-safe account auth is not the WTW integration path yet, so shared economy integration cannot be treated as a simple frontend API call.
- Cosmetic gameplay effects can destabilize progression if they duplicate upgrade/follower math without limits.
- "All leaderboards" can expand quickly; C needs one verified leaderboard before adding categories.
- Strict pixel art requires either asset production time or acceptance of first-pass reference quality.
- Daily quests generated locally can be exploited if dynamic WB grants are not capped and audited through the bridge.
- Private beta still needs basic account recovery and reset behavior.

## Open Decisions

- Account owner: Supabase app account first, WalkerBucks account first, or another backend.
- Auth scope: Google plus email/password only, or include Discord OAuth in C.
- Moon canonical distance value.
- Which inventory item types ship first.
- Which leaderboard category ships first.
- Which future WTW reward categories need stronger server validation before public launch.
- Whether existing Discord economy catalog should stay design evidence only or move through a formal WalkerBucks/WTW ownership plan later.

## Launch Intent

C launches to friends/private beta only.

Launch gates:

- `npm run build` passes.
- A fresh local save can start, walk, buy, claim events, and persist.
- A returning account can recover progress when Supabase is configured; without live Supabase setup, this remains a documented private-beta gate.
- C roadmap checklist shows every item as shipped, gated, or future-planned.
- Any WalkerBucks-backed reward path uses idempotency and a server-side caller.
- If shared economy is not fully live, the blocker doc names exact missing API/auth pieces.

Rollback behavior:

- Local guest play must keep working if account sync or WalkerBucks integration is unavailable.
- Economy grants must be idempotent and reversible in the WalkerBucks ledger when possible.
- Beta users should never lose local progress silently during account linking.

## Recommendation

Build C in staged gates:

1. Make the game feel meaningfully better first.
2. Add data-driven achievements, inventory, cosmetics, quests, prestige, and playable Moon locally.
3. Add account sync.
4. Add WalkerBucks bridge through a server-side adapter.
5. Add leaderboards, marketplace proof, and Discord bridge only after identity and economy ownership are clear.

This gives C visible playable progress early while keeping the public economy path honest.
