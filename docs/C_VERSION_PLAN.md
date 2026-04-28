# Walk The World C Version Plan

Last updated: 2026-04-28

## Execution Mode

This is the persistent implementation plan for the README C Version roadmap. Keep this file updated as phases advance.

Rules:

- Work from playable improvements toward online economy integration.
- Do not mark a README roadmap item done unless it is implemented and verified.
- If a roadmap item cannot ship in C, add the blocker and next action under "Blocked Or Deferred Items."
- Keep local guest play working through every phase.
- Run `npm run build` before closing implementation phases that touch code.
- Every chat or phase closeout for this C-version plan must end with a copy-ready prompt that kicks off the next session or next phase.

## Current Baseline

Current stack:

- Vite
- React 18
- TypeScript strict
- Canvas API
- localStorage save system
- Basic PWA manifest

Current C-adjacent assets:

- Walker sprite sheet: `public/assets/characters/walker/walker_walk_right_sheet.png`
- Background composites: `public/assets/backgrounds/*/composite.png`
- Music files: `public/assets/audio/music/*.mp3`
- Generated sound effects: `src/game/audio.ts`

Known repo gaps:

- No tests are configured beyond `npm run build`.
- No backend/auth package exists in this repo.
- WalkerBucks API exists in a separate repo, but `/v1/accounts/me` auth is stubbed and privileged endpoints need a trusted caller.
- Local item/cosmetic panels exist; shared WalkerBucks inventory is not merged into local game inventory yet.

## Phase Checklist

- [x] Phase 0: C scope and planning artifacts.
- [x] Phase 1: Playable feel, art, animation, and audio pass.
- [x] Phase 2: Achievements, inventory, cosmetics, and reward definitions.
- [x] Phase 3: Prestige, world model, playable Moon, and future world scaffolding.
- [x] Phase 4: Daily quests and seasonal event framework.
- [x] Phase 5: Account persistence and cloud save decision.
- [x] Phase 6: WalkerBucks bridge and server-authoritative rewards.
- [x] Phase 7: Leaderboards, marketplace proof, Discord bridge, and Telegram decision.
- [x] Phase 8: Private beta hardening and release gate.

## Phase 0: Scope And Planning Artifacts

Status: complete.

Files:

- `docs/questions_from_codex.md`
- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `README.md`

Acceptance criteria:

- [x] Stakeholder answers captured.
- [x] WalkerBucks and Discord dependencies inspected.
- [x] C Version definition written.
- [x] Persistent checklist created.
- [x] User approves this plan or requests edits.

Verification:

```bash
npm run build
```

Build is not required for docs-only Phase 0 unless README/doc link changes are suspect, but it is safe to run after the docs pass.

## Phase 1: Playable Feel, Art, Animation, And Audio

Goal: make the game immediately feel more like a polished pixel idle game before backend work begins.

Primary files:

- `src/components/GameSceneCanvas.tsx`
- `src/components/SettingsPanel.tsx`
- `src/game/audio.ts`
- `src/game/backgroundScenes.ts`
- `src/game/types.ts`
- `src/game/initialState.ts`
- `src/styles/global.css`
- `docs/ASSET_PIPELINE.md`
- `public/assets/characters/walker/`
- `public/assets/backgrounds/`
- `public/assets/audio/music/`

Tasks:

- [x] Add a runtime asset manifest for walker animation states:
  - walk
  - idle
  - click/tap
  - reward/event
  - celebration
- [x] Keep the existing walk sheet as the fallback if new animation sheets are missing.
- [x] Refine canvas drawing so backgrounds scroll or frame without visible hard breaks.
- [x] Add click/tap animation on the walker or path, separate from floating text.
- [x] Add a music track picker that can select every track in `public/assets/audio/music/`.
- [x] Persist selected track and sound settings in the save model.
- [x] Update `docs/ASSET_PIPELINE.md` with the required file names and dimensions for all C animation states.
- [x] Run a mobile and desktop visual pass.
  - [x] Current in-app browser viewport checked.
  - [x] Separate mobile-sized viewport checked.

Acceptance criteria:

- [x] The first screen reads as strict pixel art, not generic placeholder blocks.
- [x] A player sees feedback when tapping the scene or WALK control.
- [x] The music picker can play all shipped tracks after user interaction.
- [x] Missing optional animation assets do not crash the game.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
npm run dev
```

Use the live game preview for this phase before marking it done.

Mobile QA evidence:

- Checked through a same-origin 390 x 844 live-preview harness on 2026-04-28.
- Verified strict pixel art rendering, tap feedback, offline-summary dismissal, and no new mobile-console errors for the emulated mobile viewport.

## Phase 2: Achievements, Inventory, Cosmetics, And Reward Definitions

Goal: add collection-driven progression without touching backend identity yet.

Primary files:

- `src/game/types.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/formulas.ts`
- `src/game/tick.ts`
- `src/game/upgrades.ts`
- `src/game/followers.ts`
- `src/components/ShopModal.tsx`
- new `src/game/achievements.ts`
- new `src/game/inventory.ts`
- new `src/game/cosmetics.ts`
- new `src/components/AchievementsPanel.tsx`
- new `src/components/InventoryList.tsx`
- new `src/components/CosmeticsList.tsx`

Tasks:

- [x] Define achievement data with stable IDs, names, descriptions, trigger conditions, rewards, and hidden/visible status.
- [x] Extend `GameState` with achievement progress and claimed achievement rewards.
- [x] Add save migration from version 1 to the new version without losing existing saves.
- [x] Define initial inventory item types:
  - consumable
  - collectible
  - equipment
  - cosmetic
- [x] Define cosmetic gameplay effects as small modifiers wired through `formulas.ts`.
- [x] Replace item/cosmetic "coming soon" placeholders with working panels.
- [x] Add reward claiming that grants local WB/items/cosmetics in the guest-save model.
- [x] Keep the initial item set small enough to balance manually.

Acceptance criteria:

- [x] Achievements can unlock passively from walking, loops, purchases, event claims, and daily play.
- [x] At least one achievement grants WB and at least one grants an item/cosmetic.
- [x] Inventory persists through reload.
- [x] Cosmetic effects are visible in stats or item details.
- [x] Existing saves migrate without reset.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual checks:

- [x] Start fresh save on a separate local preview origin.
- [x] Trigger or simulate one achievement.
- [x] Claim the reward.
- [x] Equip or activate one cosmetic/equipment item.
- [x] Reload and confirm persistence.

Implemented:

- `src/game/achievements.ts` defines local achievements for walking, loops, purchases, event claims, daily play, clicks, and total WB.
- `src/game/inventory.ts` defines the first consumable, collectible, equipment, and cosmetic inventory items.
- `src/game/cosmetics.ts` defines gameplay-affecting cosmetics with small modifiers applied through `src/game/formulas.ts`.
- `src/components/AchievementsPanel.tsx`, `src/components/InventoryList.tsx`, and `src/components/CosmeticsList.tsx` replace placeholder collection surfaces.

## Phase 3: Prestige, World Model, Playable Moon, And Future World Scaffolding

Goal: make world expansion real while keeping Mars/Solar System as future-ready data.

Canonical Moon distance decision:

- Use NASA's average Earth-Moon distance: `238,855` miles (`384,400` km).
- Rationale: the Moon's orbit varies, so the average distance is the stable gameplay canon for Earth-to-Moon progression.
- Code constant: `CANONICAL_MOON_DISTANCE_MILES`.
- Source: NASA Moon Facts / NASA Space Place average distance.

Primary files:

- `src/game/world.ts`
- `src/game/landmarks.ts`
- `src/game/types.ts`
- `src/game/formulas.ts`
- `src/game/tick.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/components/ProgressPanel.tsx`
- `src/components/StatsPanel.tsx`
- `src/components/GameSceneCanvas.tsx`
- `src/game/backgroundScenes.ts`

Tasks:

- [x] Replace `moon_locked` with a real world model that supports locked and unlocked worlds.
- [x] Add world definitions for Earth and Moon with independent loop/progression distances.
- [x] Add a documented constant for the chosen canonical miles-to-Moon value.
- [x] Add a prestige model:
  - reset selected Earth progress
  - preserve selected collection/account progress
  - grant permanent bonus
  - unlock or accelerate Moon progression
- [x] Add Moon landmarks/scenes using existing `moon_surface` assets first.
- [x] Add future world placeholders for Mars/Solar System as data-only definitions with locked status.
- [x] Update progress UI to show current world, next landmark, prestige status, and locked-world requirements.

Acceptance criteria:

- [x] Earth prestige can be triggered only when requirements are met.
- [x] Prestige grants a visible permanent bonus.
- [x] Moon can be entered and progressed.
- [x] Mars/Solar System are visible as future locked tiers or documented future definitions.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual checks:

- [x] Live preview opened on `http://127.0.0.1:5175/`.
- [x] Existing local guest save loaded after migration without reset.
- [x] Default/early guest state shows Earth active, Moon locked, Mars/Solar System future-locked, and Prestige Earth disabled.
- [x] Local bundled verification harness confirmed Earth-loop prestige unlocks Moon, resets Earth route progress, preserves cumulative Earth loop progress, grants permanent bonuses, and lets Moon progress independently.
- [x] Local bundled verification harness confirmed legacy `moon_locked` saves normalize to Earth and migrate to save version 3.

Implemented:

- `src/game/world.ts` defines Earth, playable Moon, future Mars, and future Solar System route data.
- `src/game/landmarks.ts` defines Moon route landmarks using `moon_surface`.
- `src/game/save.ts` migrates old guest saves into the version 3 world/prestige model while keeping the existing localStorage key.
- `src/components/ProgressPanel.tsx`, `src/components/GameHUD.tsx`, `src/components/StatsPanel.tsx`, and `src/components/GameSceneCanvas.tsx` read from the active world model.

Resolved decision:

- Canonical Moon distance is the average Earth-Moon distance: `238,855` miles.

## Phase 4: Daily Quests And Seasonal Event Framework

Status: complete.

Goal: create repeatable reasons to return without waiting for backend integration.

Primary files:

- `src/game/types.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/tick.ts`
- new `src/game/quests.ts`
- new `src/game/seasonalEvents.ts`
- new `src/components/QuestPanel.tsx`
- `src/components/GameHUD.tsx`
- `src/components/BottomControls.tsx`

Tasks:

- [x] Add local daily quest definitions.
- [x] Generate the daily quest set from the local date and save progress.
- [x] Add quest progress hooks for walking, clicking, purchases, events, achievements, and world progress.
- [x] Add a quest panel or HUD affordance.
- [x] Add one seasonal event definition with visual treatment, quest variation, and rewards.
- [x] Mark all quest rewards as local-only until the WalkerBucks bridge exists.

Acceptance criteria:

- [x] A fresh day generates a playable quest set.
- [x] Quest progress persists through reload.
- [x] Completing a quest grants a visible local reward.
- [x] Seasonal event state can alter visuals and quest/reward definitions.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual checks:

- [x] Live preview opened on `http://127.0.0.1:5174/`.
- [x] Existing local guest save migrated to save version 4 without reset.
- [x] Quests overlay showed the active daily set, local-only reward labels, and the Spring Stride seasonal event card.
- [x] Gameplay tapping advanced the Tap Pace quest from in progress to ready.
- [x] Claimed daily and seasonal quest rewards and saw local WB increase plus reward toast feedback.
- [x] Reload confirmed quest completion and claimed reward state persisted.
- [x] Fresh guest save checked on separate `http://localhost:5174/` origin generated Warm-Up Walk, Tap Pace, and Spring Route Push at 0/3 complete.
- [x] Browser console warning/error check returned no new warnings or errors.

Implemented:

- `src/game/quests.ts` defines local daily quests, date/save-progress generation, progress syncing, reward claiming, and local-only reward summaries.
- `src/game/seasonalEvents.ts` defines Spring Stride Festival with visual treatment, seasonal quest variation, and local-only rewards.
- `src/game/save.ts` migrates guest saves to save version 4 while keeping the existing `walk_the_world_save_v1` localStorage key.
- `src/components/QuestPanel.tsx` adds the daily quest and seasonal event UI.
- `src/components/GameHUD.tsx` and `src/components/GameSceneCanvas.tsx` surface active seasonal state in the HUD and canvas visuals.

## Phase 5: Account Persistence And Cloud Save Decision

Status: complete.

Goal: let beta players persist progress beyond localStorage.

Primary files:

- new `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`
- new `src/services/authClient.ts`
- new `src/services/cloudSaveClient.ts`
- `src/game/save.ts`
- `src/game/types.ts`
- `src/components/SettingsPanel.tsx`
- new `src/components/AccountPanel.tsx`

Decision gate:

- [x] Decide whether Supabase owns game auth/profile/save for C.
- [x] Decide whether Discord OAuth ships in C or follows after Google/email auth.
- [x] Decide account-linking behavior for existing local saves.

Recommended direction:

- Use Supabase for game auth/profile/save in C if speed matters.
- Keep WalkerBucks as the economy ledger, not the game save database.
- Sync local guest save into cloud only after the user confirms linking.

Tasks after decision:

- [x] Write `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`.
- [x] Add environment variable documentation.
- [x] Add auth UI for Google and email/password.
- [x] Add cloud save read/write with conflict handling.
- [x] Add local-to-cloud migration path.
- [x] Keep export/import/reset available.

Acceptance criteria:

- [x] Guest save still works without login.
- [x] Logged-in user can recover progress after reload through the cloud load path when Supabase is configured.
- [x] Account linking does not silently overwrite newer local progress.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual/config checks:

- [x] Confirmed no local Supabase env vars are configured in the current shell; guest mode remains the default path.
- [x] Account panel disables sync cleanly when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing.
- [x] Export/import/reset controls remain in Settings next to the account panel.
- [ ] Live Supabase sign-in/upload/load smoke test is pending a configured Supabase project, env vars, and `game_saves` table.

Resolved decisions:

- Supabase owns game auth/profile/cloud save for C.
- Discord OAuth is deferred until Phase 7, after account save and WalkerBucks bridge work are stable.
- Existing local saves upload to cloud only after explicit player action.

Implemented:

- `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md` records the ADR, conflict rules, environment variables, and Supabase table/RLS SQL.
- `src/services/authClient.ts` wraps optional Supabase Auth setup for email/password, Google OAuth, session restore, and sign-out.
- `src/services/cloudSaveClient.ts` wraps `game_saves` read/write with whole-save payload migration through the existing save importer.
- `src/components/AccountPanel.tsx` adds sign-in, sign-up, Google OAuth, refresh, upload local, load cloud, and sign-out controls.
- `src/game/save.ts` migrates guest saves to save version 5 while keeping the existing `walk_the_world_save_v1` localStorage key.
- `.env.example`, `.gitignore`, and `README.md` document Supabase env configuration without requiring it for local guest play.

## Phase 6: WalkerBucks Bridge And Server-Authoritative Rewards

Status: complete.

Goal: connect the game to the WalkerBucks economy without exposing privileged API calls to the browser.

Primary files:

- new `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- new `src/services/walkerbucksClient.ts`
- new server function/API route files after backend target is chosen
- `src/game/types.ts`
- `src/game/save.ts`
- reward emitters in achievements, quests, prestige, events, and purchases

Known WalkerBucks endpoints from inspected repo:

- `POST /v1/accounts`
- `GET /v1/accounts/{account_id}`
- `POST /v1/accounts/link-platform`
- `GET /v1/wallets/{account_id}`
- `POST /v1/rewards/grants`
- `GET /v1/inventory/{account_id}`
- `POST /v1/shop/purchases`
- `GET /v1/leaderboards/walkerbucks`

Required bridge contract:

```text
game client -> trusted game backend -> WalkerBucks API
```

Tasks:

- [x] Write `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` with endpoint mapping, idempotency keys, failure behavior, and auth assumptions.
- [x] Create a local abstraction for economy balance and reward status.
- [x] Implement read-only WB balance display first.
- [x] Implement one server-authoritative reward source with idempotency.
- [x] Mark local-only rewards separately from server-backed rewards in UI/state.
- [x] Add retry and "pending reward" behavior so failed grants do not disappear.

Acceptance criteria:

- [x] Browser never stores a privileged WalkerBucks admin/reward secret.
- [x] Reward grants use stable idempotency keys.
- [x] Failed bridge calls are visible and retryable.
- [x] Guest/local mode still works if WalkerBucks is unavailable.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual/config checks:

- [x] Confirmed `git ls-remote git@github-scwlkr:scwlkr/WalkerBucks.git HEAD` still resolves to `2090e62a1854f4724e5ea56e08d1e577932464d1`.
- [x] Confirmed browser config only adds `VITE_WALKERBUCKS_BRIDGE_URL`; WalkerBucks API URL/service token are server-only bridge secrets documented in `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`.
- [x] Confirmed missing bridge URL leaves the app in guest/local mode.
- [x] Confirmed save migration advances to version 6 with persisted WalkerBucks bridge reward state.
- [ ] Live WalkerBucks grant smoke test is pending a deployed Supabase Edge Function, `WALKERBUCKS_API_URL`, optional `WALKERBUCKS_SERVICE_TOKEN`, Supabase auth env vars, and a reachable WalkerBucks API.

Implemented:

- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` records the bridge contract, endpoint mapping, idempotency rules, failure behavior, and auth assumptions.
- `src/services/walkerbucksClient.ts` calls only the trusted bridge URL with a Supabase access token.
- `supabase/functions/walkerbucks-bridge/index.ts` verifies the Supabase user, resolves a deterministic WalkerBucks account, reads balance, and grants the first server-owned reward source.
- `src/game/economy.ts` defines the local bridge abstraction, stable idempotency key derivation, and pending/failed/granted reward state helpers.
- `src/components/WalkerBucksPanel.tsx` displays read-only shared WB balance and retryable grant status.
- `src/components/AchievementsPanel.tsx` labels server-backed versus local-only reward scope.
- The first server-backed reward source is `achievement:day_one_check_in`; guest/unconfigured play continues to receive the local fallback reward.

Blockers:

- WalkerBucks `/v1/accounts/me` is not implemented, so the Phase 6 bridge uses deterministic `wtw:{supabase_user_id}` account mapping.
- WalkerBucks production AuthN/AuthZ middleware is still needed before public/shared economy launch; Phase 6 keeps any future WalkerBucks service token server-side.

## Phase 7: Leaderboards, Marketplace Proof, Discord Bridge, And Telegram Decision

Status: complete.

Goal: prove the cross-platform loop after account and economy ownership are clear.

Primary files:

- new `docs/C_VERSION_SOCIAL_BRIDGE.md`
- `src/components/StatsPanel.tsx`
- new `src/components/LeaderboardPanel.tsx`
- new `src/components/MarketplacePanel.tsx`
- WalkerBucks bridge files from Phase 6

Tasks:

- [x] Ship one account-backed leaderboard first.
- [x] Add extra leaderboard categories only after the first category works.
  - Phase 7 intentionally ships only shared WalkerBucks balance.
- [x] Add marketplace proof using WalkerBucks shop offers or game-local item definitions mapped to WalkerBucks items.
- [x] Define Discord identity linking with the local `walker-world-discord` repo.
- [x] Document Telegram as future unless Discord bridge is complete.
- [x] Decide whether Discord economy catalog seeds game inventory.

Acceptance criteria:

- [x] Logged-in beta player can see at least one leaderboard when Supabase auth and the WalkerBucks bridge are configured.
- [x] Marketplace proof cannot spend local-only WB as shared WB.
- [x] Discord bridge has an explicit identity-linking contract before any cross-platform rewards ship.
- [x] Telegram has a clear future plan or blocker note.
- [x] `npm run build` passes.

Verification:

```bash
npm run build
```

Manual/config checks:

- [x] Confirmed WalkerBucks `2090e62a1854f4724e5ea56e08d1e577932464d1` endpoint shapes for leaderboards, shop offers, shop purchases, and inventory.
- [x] Confirmed missing bridge URL or missing signed-in session leaves leaderboard and marketplace controls disabled while local guest play remains available.
- [x] Confirmed browser code only calls `VITE_WALKERBUCKS_BRIDGE_URL`; WalkerBucks API URL/service token and future Discord secrets remain server-side.
- [x] Confirmed marketplace purchase requests send only offer ID and idempotency key; price, item definition, account ID, balance, and inventory are resolved through the trusted bridge.
- [ ] Live WalkerBucks leaderboard and marketplace purchase smoke test is pending a deployed Supabase Edge Function, `VITE_WALKERBUCKS_BRIDGE_URL`, `WALKERBUCKS_API_URL`, optional `WALKERBUCKS_SERVICE_TOKEN`, Supabase auth env vars, and seeded WalkerBucks shop offers.

Implemented:

- `docs/C_VERSION_SOCIAL_BRIDGE.md` records the Phase 7 bridge contract, first leaderboard category, marketplace proof scope, Discord identity-linking contract, Telegram deferral, and Discord catalog decision.
- `src/components/LeaderboardPanel.tsx` adds the first account-backed leaderboard UI for shared WalkerBucks balance.
- `src/components/MarketplacePanel.tsx` adds shared WalkerBucks offer loading and purchase proof UI without spending local WB.
- `src/components/SocialBridgePanel.tsx` surfaces the Discord-first and Telegram-future bridge status without exposing secrets.
- `src/services/walkerbucksClient.ts` adds trusted bridge calls for leaderboard, marketplace offers, and marketplace purchases.
- `supabase/functions/walkerbucks-bridge/index.ts` adds server-side leaderboard, marketplace offer, and marketplace purchase endpoints.
- `src/game/economy.ts`, `src/game/types.ts`, `src/game/initialState.ts`, and `src/game/save.ts` add save version 7 state for leaderboards, marketplace purchases, shared inventory snapshots, and stable marketplace idempotency keys.

Resolved decisions:

- First leaderboard category is shared WalkerBucks balance.
- Marketplace proof uses live WalkerBucks shop offers and `POST /v1/shop/purchases`.
- Discord identity linking is contract-defined, but no cross-platform rewards ship until linking is implemented server-side.
- Telegram is future-planned after Discord linking stability.
- Discord economy catalog does not seed game inventory in Phase 7.

## Phase 8: Private Beta Hardening And Release Gate

Status: complete.

Goal: make C safe enough for friends/private beta.

Primary files:

- `README.md`
- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- any account/economy decision docs created in earlier phases

Tasks:

- [x] Run full roadmap checklist review.
- [x] Confirm every README roadmap item is shipped, gated, or future-planned.
- [x] Run a fresh save smoke test.
- [x] Run an existing save migration test.
- [x] Run the local account save recovery gate check.
  - Live Supabase upload/load remains blocked by missing local Supabase env vars and `game_saves` setup.
- [x] Run the local WalkerBucks reward gate check.
  - Live shared-WB grant remains blocked by missing deployed bridge, Supabase auth, WalkerBucks API URL, and optional service token setup.
- [x] Document known limitations for beta users.
- [x] Update README current feature list and limitations.

Acceptance criteria:

- [x] `npm run build` passes.
- [x] No roadmap item remains ambiguous.
- [x] Private beta limitations are documented in user-facing language.
- [x] Handoff file names the next exact implementation target.

Verification:

```bash
npm run dev -- --host 127.0.0.1 --port 5180
node --input-type=commonjs <<'NODE'
# Headless Chrome/CDP smoke harness.
NODE
```

Local smoke result on 2026-04-28:

- Fresh save: pass.
  - Mounted the `WALK` control.
  - Wrote `walk_the_world_save_v1`.
  - Migrated/saved as `saveVersion: 7`.
  - Advanced Earth distance and total click count.
  - Preserved guest/local mode with account status `disabled` and WalkerBucks bridge status `unavailable`.
- Existing legacy save: pass.
  - Seeded a version-1 local save with `currentWorldId: "moon_locked"`, 1,234 miles, 456 WB, and reduced motion enabled.
  - Loaded and migrated to `saveVersion: 7`.
  - Normalized the world to `earth`.
  - Preserved distance, WB, and reduced-motion setting.
  - WALK advanced total clicks from 5 to 6.
  - Preserved guest/local mode with account status `disabled` and WalkerBucks bridge status `unavailable`.
- Runtime errors: none in either smoke run.
- Local environment check: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WALKERBUCKS_BRIDGE_URL`, `WALKERBUCKS_API_URL`, `WALKERBUCKS_SERVICE_TOKEN`, `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_SECRET`, and `DISCORD_SIGNING_SECRET` are unset in the current shell.
- Secret-boundary check: browser code reads only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_WALKERBUCKS_BRIDGE_URL`; WalkerBucks API URL/service-token usage is confined to `supabase/functions/walkerbucks-bridge/index.ts`.
- `npm run build` passes.

Implemented:

- Restored the visible `WALK` control while preserving scene-tap walking.
- Updated README current behavior, save version, private beta limitations, and C-version roadmap statuses.
- Updated this checklist and handoff with release-gate evidence and live-service blockers.

## README Roadmap Mapping

| README item | C target status | Current plan |
| --- | --- | --- |
| Real pixel art asset pack | Shipped | Phase 1 strict pixel art pass and asset pipeline update. |
| Sound effects/music | Shipped | Phase 1 track picker and persisted audio settings. |
| Achievements | Shipped | Phase 2 data-driven achievements with rewards. |
| Inventory items | Shipped | Phase 2 local inventory model. |
| Cosmetics | Shipped | Phase 2 gameplay-affecting cosmetics. |
| Prestige / world expansion | Shipped | Phase 3 prestige and world model. |
| Moon fully playable | Shipped | Phase 3 playable Moon after distance decision. |
| Mars/Solar System tiers | Future-planned | Phase 3 locked data scaffolding; full tiers remain out of C scope. |
| Supabase account sync | Gated | Phase 5 client/auth/cloud-save code shipped; live recovery QA requires Supabase env vars and `game_saves` setup. |
| Shared WalkerBucks economy API | Gated | Phase 6 bridge contract and browser-safe integration shipped; live QA requires deployed bridge and WalkerBucks API setup. |
| Server-authoritative rewards | Gated | Phase 6 first idempotent reward path shipped; live grant QA requires deployed bridge/account setup. |
| Leaderboards | Gated | Phase 7 shared WalkerBucks balance leaderboard shipped through the trusted bridge; live QA requires account/bridge setup. |
| Daily quests | Shipped | Phase 4 local generation, progress, rewards, and persistence. |
| Seasonal events | Shipped | Phase 4 Spring Stride framework and example event. |
| Marketplace/inventory integration | Gated | Phase 7 WalkerBucks shop offer and purchase proof shipped; shared inventory is not merged into local inventory yet. |
| Discord/Telegram reward bridge | Gated | Phase 7 defines Discord identity linking, keeps Discord secrets server-side, and defers Telegram until Discord is stable. |

## Blocked Or Deferred Items

### Moon Distance

- Status: resolved in Phase 3.
- Decision: use NASA's average Earth-Moon distance: `238,855` miles (`384,400` km).
- Code constant: `CANONICAL_MOON_DISTANCE_MILES`.

### Account Owner

- Status: resolved for C.
- Decision: Supabase owns game auth/profile/cloud save for C.
- Follow-up: configure Supabase env vars and `game_saves` table before live auth/sync QA.

### Supabase Live Configuration

- Status: external setup pending.
- Required setup: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, Google provider credentials if Google OAuth should work, and the `game_saves` table/RLS policies from `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`.
- Current behavior without setup: app remains guest-only and localStorage save/export/import/reset still work.

### WalkerBucks Auth

- Status: external dependency.
- Evidence: WalkerBucks `/v1/accounts/me` is stubbed and privileged endpoints are functional but not production-authenticated.
- C-version decision: use a Supabase Edge Function bridge that verifies Supabase Auth and keeps WalkerBucks API secrets server-side.
- Remaining production action: add real WalkerBucks AuthN/AuthZ middleware and replace deterministic `wtw:{supabase_user_id}` mapping when `/v1/accounts/me` exists.

### WalkerBucks Bridge Live Configuration

- Status: external setup pending.
- Required setup: deploy `supabase/functions/walkerbucks-bridge`, configure `VITE_WALKERBUCKS_BRIDGE_URL`, `WALKERBUCKS_API_URL`, and optional `WALKERBUCKS_SERVICE_TOKEN`.
- Current behavior without setup: guest/local WB and local rewards continue, while shared-WB balance and grants remain unavailable.

### Discord/Telegram Bridge

- Status: resolved for Phase 7.
- Discord decision: identity linking must use a trusted server path and verified Discord identity before cross-platform rewards ship.
- Telegram decision: future-planned after Discord linking and shared WalkerBucks flows are stable.
- Discord catalog decision: use Discord catalog as design evidence only; do not seed game inventory from it in Phase 7.

### WalkerBucks Leaderboard And Marketplace Live Configuration

- Status: external setup pending.
- Required setup: deploy the updated `supabase/functions/walkerbucks-bridge`, configure `VITE_WALKERBUCKS_BRIDGE_URL`, `WALKERBUCKS_API_URL`, optional `WALKERBUCKS_SERVICE_TOKEN`, Supabase auth env vars, and seed WalkerBucks shop offers.
- Current behavior without setup: guest/local play, local shop, local rewards, and local inventory continue; shared leaderboard and marketplace controls stay unavailable or sign-in-gated.

## Verification Commands

Always run:

```bash
npm run build
```

For frontend/game-feel work:

```bash
npm run dev
```

For WalkerBucks integration planning or bridge changes, inspect the external repo before coding:

```bash
git ls-remote git@github-scwlkr:scwlkr/WalkerBucks.git HEAD
```

For Discord bridge planning, inspect the local repo:

```bash
git -C /Users/shanewalker/Desktop/dev/walker-world-discord status --short
```

## Next Implementation Target

Proceed to the live private-beta configuration pass: configure Supabase, deploy the WalkerBucks bridge, and run the live account recovery, shared reward, leaderboard, and marketplace smoke tests that were external blockers during Phase 8.
