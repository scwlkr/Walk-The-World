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
- Item/cosmetic tabs exist in UI but are placeholders.

## Phase Checklist

- [x] Phase 0: C scope and planning artifacts.
- [x] Phase 1: Playable feel, art, animation, and audio pass.
- [x] Phase 2: Achievements, inventory, cosmetics, and reward definitions.
- [ ] Phase 3: Prestige, world model, playable Moon, and future world scaffolding.
- [ ] Phase 4: Daily quests and seasonal event framework.
- [ ] Phase 5: Account persistence and cloud save decision.
- [ ] Phase 6: WalkerBucks bridge and server-authoritative rewards.
- [ ] Phase 7: Leaderboards, marketplace proof, Discord bridge, and Telegram decision.
- [ ] Phase 8: Private beta hardening and release gate.

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

- [ ] Add local daily quest definitions.
- [ ] Generate the daily quest set from the local date and save progress.
- [ ] Add quest progress hooks for walking, clicking, purchases, events, achievements, and world progress.
- [ ] Add a quest panel or HUD affordance.
- [ ] Add one seasonal event definition with visual treatment, quest variation, and rewards.
- [ ] Mark all quest rewards as local-only until the WalkerBucks bridge exists.

Acceptance criteria:

- [ ] A fresh day generates a playable quest set.
- [ ] Quest progress persists through reload.
- [ ] Completing a quest grants a visible local reward.
- [ ] Seasonal event state can alter visuals and quest/reward definitions.
- [ ] `npm run build` passes.

## Phase 5: Account Persistence And Cloud Save Decision

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

- [ ] Decide whether Supabase owns game auth/profile/save for C.
- [ ] Decide whether Discord OAuth ships in C or follows after Google/email auth.
- [ ] Decide account-linking behavior for existing local saves.

Recommended direction:

- Use Supabase for game auth/profile/save in C if speed matters.
- Keep WalkerBucks as the economy ledger, not the game save database.
- Sync local guest save into cloud only after the user confirms linking.

Tasks after decision:

- [ ] Write `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md`.
- [ ] Add environment variable documentation.
- [ ] Add auth UI for Google and email/password.
- [ ] Add cloud save read/write with conflict handling.
- [ ] Add local-to-cloud migration path.
- [ ] Keep export/import/reset available.

Acceptance criteria:

- [ ] Guest save still works without login.
- [ ] Logged-in user can recover progress after reload.
- [ ] Account linking does not silently overwrite newer local progress.
- [ ] `npm run build` passes.

## Phase 6: WalkerBucks Bridge And Server-Authoritative Rewards

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

- [ ] Write `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` with endpoint mapping, idempotency keys, failure behavior, and auth assumptions.
- [ ] Create a local abstraction for economy balance and reward status.
- [ ] Implement read-only WB balance display first.
- [ ] Implement one server-authoritative reward source with idempotency.
- [ ] Mark local-only rewards separately from server-backed rewards in UI/state.
- [ ] Add retry and "pending reward" behavior so failed grants do not disappear.

Acceptance criteria:

- [ ] Browser never stores a privileged WalkerBucks admin/reward secret.
- [ ] Reward grants use stable idempotency keys.
- [ ] Failed bridge calls are visible and retryable.
- [ ] Guest/local mode still works if WalkerBucks is unavailable.
- [ ] `npm run build` passes.

Blockers:

- WalkerBucks `/v1/accounts/me` is not implemented.
- AuthN/authZ for privileged endpoints must be designed before public/shared economy use.

## Phase 7: Leaderboards, Marketplace Proof, Discord Bridge, And Telegram Decision

Goal: prove the cross-platform loop after account and economy ownership are clear.

Primary files:

- new `docs/C_VERSION_SOCIAL_BRIDGE.md`
- `src/components/StatsPanel.tsx`
- new `src/components/LeaderboardPanel.tsx`
- new `src/components/MarketplacePanel.tsx`
- WalkerBucks bridge files from Phase 6

Tasks:

- [ ] Ship one account-backed leaderboard first.
- [ ] Add extra leaderboard categories only after the first category works.
- [ ] Add marketplace proof using WalkerBucks shop offers or game-local item definitions mapped to WalkerBucks items.
- [ ] Define Discord identity linking with the local `walker-world-discord` repo.
- [ ] Document Telegram as future unless Discord bridge is complete.
- [ ] Decide whether Discord economy catalog seeds game inventory.

Acceptance criteria:

- [ ] Logged-in beta player can see at least one leaderboard.
- [ ] Marketplace proof cannot spend local-only WB as shared WB.
- [ ] Discord bridge has an explicit identity-linking contract before any cross-platform rewards ship.
- [ ] Telegram has a clear future plan or blocker note.
- [ ] `npm run build` passes.

## Phase 8: Private Beta Hardening And Release Gate

Goal: make C safe enough for friends/private beta.

Primary files:

- `README.md`
- `docs/C_VERSION_PRD.md`
- `docs/C_VERSION_PLAN.md`
- `docs/C_VERSION_HANDOFF.md`
- any account/economy decision docs created in earlier phases

Tasks:

- [ ] Run full roadmap checklist review.
- [ ] Confirm every README roadmap item is shipped, gated, or future-planned.
- [ ] Run a fresh save smoke test.
- [ ] Run an existing save migration test.
- [ ] Run an account save recovery test if account sync shipped.
- [ ] Run a WalkerBucks reward test if the bridge shipped.
- [ ] Document known limitations for beta users.
- [ ] Update README current feature list and limitations.

Acceptance criteria:

- [ ] `npm run build` passes.
- [ ] No roadmap item remains ambiguous.
- [ ] Private beta limitations are documented in user-facing language.
- [ ] Handoff file names the next exact implementation target.

## README Roadmap Mapping

| README item | C target status | Current plan |
| --- | --- | --- |
| Real pixel art asset pack | Ship in C | Phase 1 strict pixel art pass and asset pipeline update. |
| Sound effects/music | Ship in C | Phase 1 track picker and persisted audio settings. |
| Achievements | Ship in C | Phase 2 data-driven achievements with rewards. |
| Inventory items | Ship in C | Phase 2 local inventory model. |
| Cosmetics | Ship in C | Phase 2 gameplay-affecting cosmetics. |
| Prestige / world expansion | Ship in C | Phase 3 prestige and world model. |
| Moon fully playable | Ship in C | Phase 3 playable Moon after distance decision. |
| Mars/Solar System tiers | Plan for Future | Phase 3 locked data scaffolding. |
| Supabase account sync | Gate in C | Phase 5 decision and implementation if approved. |
| Shared WalkerBucks economy API | Gate in C | Phase 6 bridge contract and first integration. |
| Server-authoritative rewards | Gate in C | Phase 6 first idempotent reward path. |
| Leaderboards | Ship or Gate in C | Phase 7 after account persistence. |
| Daily quests | Ship in C | Phase 4 local generation. |
| Seasonal events | Ship in C | Phase 4 framework plus one example if assets allow. |
| Marketplace/inventory integration | Gate in C | Phase 7 marketplace proof after WalkerBucks bridge. |
| Discord/Telegram reward bridge | Gate in C | Phase 7 Discord first, Telegram future. |

## Blocked Or Deferred Items

### Moon Distance

- Status: blocked on canonical value.
- Required decision: use average distance, closest approach, or Walker World canon value.
- Next action: write the chosen value into `src/game/constants.ts` during Phase 3 and explain it in code/docs.

### Account Owner

- Status: blocked on architecture decision.
- Required decision: Supabase owns game account/save for C, WalkerBucks grows auth first, or another backend owns it.
- Recommended next action: write `docs/C_VERSION_ACCOUNT_SYNC_DECISION.md` before Phase 5 code.

### WalkerBucks Auth

- Status: external dependency.
- Evidence: WalkerBucks `/v1/accounts/me` is stubbed and privileged endpoints are functional but not production-authenticated.
- Required decision: trusted game backend/server function shape.
- Recommended next action: write `docs/C_VERSION_WALKERBUCKS_BRIDGE.md` before Phase 6 code.

### Discord/Telegram Bridge

- Status: Discord has local repo evidence; Telegram has no implementation evidence yet.
- Required decision: identity linking contract.
- Recommended next action: handle Discord first, document Telegram future path.

## Verification Commands

Always run:

```bash
npm run build
```

For frontend/game-feel work:

```bash
npm run dev
```

For WalkerBucks integration planning, inspect the external repo before coding:

```bash
git ls-remote git@github-scwlkr:scwlkr/WalkerBucks.git HEAD
```

For Discord bridge planning, inspect the local repo:

```bash
git -C /Users/shanewalker/Desktop/dev/walker-world-discord status --short
```

## Next Implementation Target

Proceed to Phase 3 only: prestige, world model, playable Moon, and future world scaffolding.
