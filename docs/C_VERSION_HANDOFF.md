# Walk The World C Version Handoff

Last updated: 2026-04-28

## Current State

Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, and Phase 7 are complete. The remaining work should start at Phase 8 from `docs/C_VERSION_PLAN.md`.

Artifacts created:

- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `src/game/assets.ts`
- `src/game/achievements.ts`
- `src/game/inventory.ts`
- `src/game/cosmetics.ts`
- `src/game/world.ts`
- `src/game/quests.ts`
- `src/game/seasonalEvents.ts`
- `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`
- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- `src/components/AccountPanel.tsx`
- `src/components/WalkerBucksPanel.tsx`
- `src/services/authClient.ts`
- `src/services/cloudSaveClient.ts`
- `src/services/walkerbucksClient.ts`
- `src/game/economy.ts`
- `supabase/functions/walkerbucks-bridge/index.ts`
- `docs/C_VERSION_SOCIAL_BRIDGE.md`
- `src/components/LeaderboardPanel.tsx`
- `src/components/MarketplacePanel.tsx`
- `src/components/SocialBridgePanel.tsx`

Input artifact:

- `docs/questions_from_codex.md`

README pointer:

- `README.md`

## Active Scope

C Version means:

- private-beta online Walker World game
- account persistence
- improved minute-to-minute idle/clicker play
- path to the shared WalkerBucks economy
- every README roadmap item shipped, gated with blocker doc, or future-planned

## Constraints To Preserve

- Playable improvements come before backend/economy work.
- Keep local guest/offline play working through every phase.
- Do not call privileged WalkerBucks reward/admin endpoints directly from the browser.
- Do not silently overwrite local saves during account linking.
- Strict pixel art is the target style.
- WalkerBucks must route through the separate WalkerBucks API/repo.
- Discord is the first social bridge target; Telegram waits unless Discord/economy linking is already stable.

## External Evidence

WalkerBucks:

- Repo reachable through `git@github-scwlkr:scwlkr/WalkerBucks.git`.
- Inspected commit: `2090e62`.
- FastAPI/PostgreSQL service.
- Double-entry ledger.
- Integer WB amounts only.
- `/v1/accounts/me` is currently a stub.
- Privileged rewards/admin routes need auth before production/shared-economy use.

Discord:

- Local repo: `/Users/shanewalker/Desktop/dev/walker-world-discord`.
- Has existing WalkerBucks-themed Discord economy, inventory, achievements, titles, daily, leaderboard, and generated catalog docs.
- Not yet a direct shared-account bridge for this web game.

## Completed Phase Results

Phase 1 from `docs/C_VERSION_PLAN.md` has been implemented.

Implemented:

- Walker animation manifest with optional idle, click, reward, and celebration states.
- Walk sheet fallback when optional state sheets are absent.
- Canvas background framing drift instead of hard tiling.
- Tap burst feedback on the path/player area.
- Persisted music track picker in Settings.
- Asset pipeline documentation for optional C-version animation sheets.

Touched files:

- `src/components/GameSceneCanvas.tsx`
- `src/components/SettingsPanel.tsx`
- `src/game/assets.ts`
- `src/game/audio.ts`
- `src/game/types.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/styles/global.css`
- `docs/ASSET_PIPELINE.md`

Verification completed:

- The first screen reads as strict pixel art, not generic placeholder blocks.
- A player sees feedback when tapping the scene or WALK control.
- The music picker can play all shipped tracks after user interaction.
- Missing optional animation assets do not crash the game.
- Separate 390 x 844 mobile viewport QA passed through a same-origin live-preview harness.
- `npm run build` passes.

Phase 2 from `docs/C_VERSION_PLAN.md` has been implemented.

Implemented:

- Stable achievement definitions with visible and hidden milestones.
- Achievement progress, unlock, and claimed-reward state in `GameState`.
- Save migration from version 1 to version 2 while keeping the existing `walk_the_world_save_v1` localStorage key.
- Initial local inventory definitions for consumable, collectible, equipment, and cosmetic item types.
- Gameplay-affecting cosmetics wired through `formulas.ts`.
- Working achievements, inventory, and cosmetics panels.
- Local guest-save reward claiming for WB, items, equipment, and cosmetics.

Touched files:

- `src/App.tsx`
- `src/components/AchievementsPanel.tsx`
- `src/components/CosmeticsList.tsx`
- `src/components/InventoryList.tsx`
- `src/components/ShopModal.tsx`
- `src/components/StatsPanel.tsx`
- `src/game/achievements.ts`
- `src/game/cosmetics.ts`
- `src/game/inventory.ts`
- `src/game/constants.ts`
- `src/game/formulas.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/tick.ts`
- `src/game/types.ts`
- `src/styles/global.css`
- `README.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`

Verification completed:

- Fresh save opened on a separate local preview origin and claimed the Day One Walker achievement reward.
- Existing version-1 local save migrated without reset on the original local preview origin.
- Claimed WB, item, equipment, and cosmetic rewards.
- Used a consumable inventory item.
- Equipped Starter Step Counter and Lucky Laces.
- Reload confirmed inventory/cosmetic/equipment persistence and visible stat modifiers.
- `npm run build` passes.

Phase 3 from `docs/C_VERSION_PLAN.md` has been implemented.

Resolved decision:

- Canonical Moon distance is NASA's average Earth-Moon distance: `238,855` miles (`384,400` km).

Implemented:

- Replaced `moon_locked` with a typed world model for Earth, Moon, Mars, and Solar System.
- Added `CANONICAL_MOON_DISTANCE_MILES`, Moon circumference, Moon loop reward, and Earth prestige bonus constants.
- Added per-world guest-save progress plus an Earth prestige state in save version 3 while keeping `walk_the_world_save_v1`.
- Added Earth prestige that resets Earth route progress, preserves collection/account progress, grants permanent speed/WB bonuses, unlocks Moon, and accelerates Moon walking.
- Added Moon route landmarks using the existing `moon_surface` background.
- Added Mars and Solar System as future locked data-only world definitions.
- Updated HUD, stats, progress, and canvas labels to use the active world rather than hard-coded Earth progress.
- Updated the C PRD current-state note so it no longer claims only `earth` and `moon_locked` exist.

Touched files:

- `src/App.tsx`
- `src/components/GameHUD.tsx`
- `src/components/GameSceneCanvas.tsx`
- `src/components/ProgressPanel.tsx`
- `src/components/StatsPanel.tsx`
- `src/components/TopStatsBar.tsx`
- `src/game/constants.ts`
- `src/game/formulas.ts`
- `src/game/initialState.ts`
- `src/game/landmarks.ts`
- `src/game/save.ts`
- `src/game/tick.ts`
- `src/game/types.ts`
- `src/game/world.ts`
- `src/styles/global.css`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- `docs/C_VERSION_PRD.md`

Verification completed:

- `npm run build` passes.
- Live preview opened on `http://127.0.0.1:5175/`.
- Existing local guest save loaded after migration without reset.
- Live preview verified the default/early guest state: Earth active, Moon locked, Mars/Solar System future-locked, and Prestige Earth disabled until requirements are met.
- Local bundled verification harness confirmed Earth-loop prestige unlocks Moon, switches into Moon, resets Earth route progress, preserves cumulative Earth loop progress, grants permanent bonuses, and lets Moon progress independently.
- Local bundled verification harness confirmed legacy `moon_locked` saves normalize to Earth and migrate to save version 3.

Phase 4 from `docs/C_VERSION_PLAN.md` has been implemented.

Implemented:

- Added data-driven local daily quests with stable IDs, local-only rewards, and progress targets for walking, clicking, upgrade purchases, follower hires, random event claims, achievement claims, and world route progress.
- Added date-based daily quest generation that uses the local date, active seasonal event, current world, and save progress eligibility.
- Added save version 4 quest state with active date, quest IDs, progress, claimed status, and baseline counters while keeping the existing `walk_the_world_save_v1` localStorage key.
- Added local quest reward claiming through the existing inventory/reward helper.
- Added Spring Stride Festival as the first seasonal event with active date window, HUD/canvas visual treatment, seasonal quest variation, Spring Stride Ticket reward, and local-only reward labels.
- Added a Quests bottom-nav affordance and `QuestPanel` overlay.
- Updated README C-version roadmap status for Daily quests and Seasonal events.

Touched files:

- `README.md`
- `src/App.tsx`
- `src/components/BottomControls.tsx`
- `src/components/GameHUD.tsx`
- `src/components/GameSceneCanvas.tsx`
- `src/components/QuestPanel.tsx`
- `src/game/constants.ts`
- `src/game/initialState.ts`
- `src/game/inventory.ts`
- `src/game/quests.ts`
- `src/game/save.ts`
- `src/game/seasonalEvents.ts`
- `src/game/tick.ts`
- `src/game/types.ts`
- `src/styles/global.css`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`

Verification completed:

- `npm run build` passes.
- Live preview opened on `http://127.0.0.1:5174/`.
- Existing local guest save migrated to save version 4 without reset.
- Quests overlay showed active daily quests, local-only reward labels, and the Spring Stride seasonal event card.
- Gameplay tapping advanced Tap Pace from in progress to ready.
- Claimed Warm-Up Walk, Tap Pace, and Spring Route Push rewards; HUD WB and toast feedback updated.
- Reload confirmed quest progress and claimed reward state persisted.
- Fresh guest save checked on separate `http://localhost:5174/` origin generated a playable 0/3 quest set without deleting the existing `127.0.0.1` save.
- Browser console warning/error check returned no new warnings or errors.

Phase 5 from `docs/C_VERSION_PLAN.md` has been implemented.

Resolved decisions:

- Supabase owns C-version game auth/profile/cloud save.
- WalkerBucks remains the economy ledger and waits for the Phase 6 trusted bridge.
- Discord OAuth is deferred until Phase 7.
- Existing local saves upload to cloud only after explicit player action.

Implemented:

- Added `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md` before account-sync code.
- Added optional Supabase Auth wiring for email/password, Google OAuth, session restore, and sign-out.
- Added optional Supabase cloud save load/upload through a `game_saves` table.
- Added an Account panel inside Settings with refresh, upload local, load cloud, and sign-out controls.
- Added save version 5 account metadata while keeping `walk_the_world_save_v1`.
- Added `.env.example` and README account-sync environment documentation.
- Preserved Settings export/import/reset controls.

Touched files:

- `.env.example`
- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/App.tsx`
- `src/components/AccountPanel.tsx`
- `src/game/constants.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/types.ts`
- `src/services/authClient.ts`
- `src/services/cloudSaveClient.ts`
- `src/styles/global.css`
- `src/vite-env.d.ts`
- `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`

Verification completed:

- `npm run build` passes.
- Current shell has no `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`; guest mode remains the required fallback path.

Verification not completed:

- Live Supabase sign-in/upload/load smoke test was not run because the local shell does not have Supabase env vars and a configured `game_saves` table.

Phase 6 from `docs/C_VERSION_PLAN.md` has been implemented.

Resolved decisions:

- Supabase Edge Function is the C-version trusted WalkerBucks bridge target.
- Browser code only knows `VITE_WALKERBUCKS_BRIDGE_URL`; WalkerBucks API URL/service token are server-side function secrets.
- Until WalkerBucks `/v1/accounts/me` exists, the bridge maps Supabase users to deterministic WalkerBucks usernames shaped as `wtw:{supabase_user_id}`.
- The first server-backed reward source is `achievement:day_one_check_in`.

Implemented:

- Added `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` before bridge code.
- Added `src/services/walkerbucksClient.ts` for optional bridge balance/grant calls through the trusted bridge URL.
- Added `supabase/functions/walkerbucks-bridge/index.ts` to verify Supabase users, resolve WalkerBucks accounts, read balances, and grant the first server-owned reward source.
- Added `src/game/economy.ts` for shared-WB balance state, pending/failed/granted reward grants, and stable idempotency key helpers.
- Added save version 6 WalkerBucks bridge state while keeping `walk_the_world_save_v1`.
- Added `src/components/WalkerBucksPanel.tsx` in Settings for read-only shared balance and retryable grant visibility.
- Updated achievement claiming so signed-in configured bridge mode skips local WB for Day One Walker and records a pending shared-WB grant; guest/unconfigured mode keeps the local fallback reward.
- Updated README and `.env.example` for the bridge URL and server-only secret boundary.

Touched files:

- `.env.example`
- `README.md`
- `src/App.tsx`
- `src/components/AchievementsPanel.tsx`
- `src/components/WalkerBucksPanel.tsx`
- `src/game/achievements.ts`
- `src/game/constants.ts`
- `src/game/economy.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/types.ts`
- `src/services/walkerbucksClient.ts`
- `src/vite-env.d.ts`
- `supabase/functions/walkerbucks-bridge/index.ts`
- `docs/C_VERSION_WALKERBUCKS_BRIDGE.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`

Verification completed:

- `git ls-remote git@github-scwlkr:scwlkr/WalkerBucks.git HEAD` returns `2090e62a1854f4724e5ea56e08d1e577932464d1`.
- `npm run build` passes.

Verification not completed:

- Live WalkerBucks balance/grant smoke test was not run because the bridge function is not deployed in this local shell and no `VITE_WALKERBUCKS_BRIDGE_URL` / `WALKERBUCKS_API_URL` / optional `WALKERBUCKS_SERVICE_TOKEN` configuration is present.

Phase 7 from `docs/C_VERSION_PLAN.md` has been implemented.

Resolved decisions:

- First leaderboard category is shared WalkerBucks balance.
- Marketplace proof uses live WalkerBucks shop offers and `POST /v1/shop/purchases` through the trusted bridge.
- Discord identity linking is documented as the first social bridge target, but cross-platform rewards stay blocked until a trusted server-side link flow exists.
- Telegram is future-planned after Discord linking and shared WalkerBucks flows are stable.
- Discord economy catalog does not seed game inventory in Phase 7.

Implemented:

- Added `docs/C_VERSION_SOCIAL_BRIDGE.md` before social bridge code.
- Extended `supabase/functions/walkerbucks-bridge/index.ts` with trusted leaderboard, marketplace offer, and marketplace purchase endpoints.
- Extended `src/services/walkerbucksClient.ts` with leaderboard, marketplace offer, and purchase calls.
- Added save version 7 state for leaderboard snapshots, marketplace offers, marketplace purchases, shared inventory snapshots, and stable purchase idempotency keys.
- Added `src/components/LeaderboardPanel.tsx` under Stats for the shared WalkerBucks balance leaderboard.
- Added `src/components/MarketplacePanel.tsx` under Shop for shared offers and purchase proof.
- Added `src/components/SocialBridgePanel.tsx` under Settings for Discord-first and Telegram-future bridge status.
- Kept local guest mode and local shop/inventory behavior available when Supabase, WalkerBucks, or Discord social bridge configuration is missing.

Touched files:

- `README.md`
- `src/App.tsx`
- `src/components/LeaderboardPanel.tsx`
- `src/components/MarketplacePanel.tsx`
- `src/components/SocialBridgePanel.tsx`
- `src/game/constants.ts`
- `src/game/economy.ts`
- `src/game/initialState.ts`
- `src/game/save.ts`
- `src/game/types.ts`
- `src/services/walkerbucksClient.ts`
- `src/styles/global.css`
- `supabase/functions/walkerbucks-bridge/index.ts`
- `docs/C_VERSION_SOCIAL_BRIDGE.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`

Verification completed:

- Temporary WalkerBucks clone at commit `2090e62a1854f4724e5ea56e08d1e577932464d1` confirmed endpoint shapes for leaderboards, shop offers, shop purchases, inventory, and item definitions.
- Local `walker-world-discord` repo docs confirmed Discord has D1-backed wallet, leaderboard, shop, buy, inventory, achievements, titles, daily, and generated catalog surfaces, but no direct web-game account link.
- `npm run build` passes.

Verification not completed:

- Live WalkerBucks leaderboard and marketplace purchase smoke test was not run because the updated bridge function is not deployed in this local shell and no live `VITE_WALKERBUCKS_BRIDGE_URL` / `WALKERBUCKS_API_URL` / optional `WALKERBUCKS_SERVICE_TOKEN` / Supabase auth configuration is present.

## Next Phase

Proceed with Phase 8 from `docs/C_VERSION_PLAN.md`: private beta hardening and release gate.

## Next Kickoff Prompt

```text
Please continue in /Users/shanewalker/Desktop/dev/Walk-The-World by reading docs/C_VERSION_PLAN.md, docs/C_VERSION_HANDOFF.md, docs/C_VERSION_ACCOUNT_SYNC_DECISION.md, docs/C_VERSION_WALKERBUCKS_BRIDGE.md, and docs/C_VERSION_SOCIAL_BRIDGE.md first. Proceed with Phase 8 only: private beta hardening and release gate. Review every README C-version roadmap item as shipped, gated, or future-planned; run the fresh-save and existing-save checks that can run locally; keep guest/local mode working if Supabase, WalkerBucks, or Discord is unavailable; never expose privileged WalkerBucks or Discord secrets in the browser; keep the checklist and handoff updated; run npm run build; and end with the next kickoff prompt.
```

## Required Verification

Before closing a code phase:

```bash
npm run build
```

For visual/game-feel phases:

```bash
npm run dev
```

Use a live browser preview for visual/game-feel phases before marking them complete.

## Closeout Rule

Every chat or phase closeout for this C-version plan must end with a copy-ready prompt that starts the next session or next phase. The prompt should include the repo path, the current phase, the relevant plan/handoff files, and the exact next action.

## Open Decisions

- Live WalkerBucks bridge deployment/configuration.
- Live Supabase auth/cloud-save configuration.
- Private beta limitation wording for README.
- Whether Phase 8 should run live Supabase/WalkerBucks smoke tests or document them as external setup blockers.

## Do Not Start Yet

Do not start public/private beta launch promotion before Phase 8 completes the roadmap review, local save QA, build verification, and known-limitation documentation.
