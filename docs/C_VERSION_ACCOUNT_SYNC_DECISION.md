# Walk The World C Version Account Sync Decision

Last updated: 2026-04-28

## Status

Accepted for Phase 5 implementation.

## Decision Boundary

Phase 5 decides who owns game account identity and cloud save persistence for the C version. It does not implement WalkerBucks ledger integration, shared economy reward grants, leaderboards, marketplace spending, Discord linking, Telegram linking, or server-authoritative rewards.

## Context

- The current game is a Vite/React client with a localStorage guest save under `walk_the_world_save_v1`.
- Local guest play must keep working without login, network access, or cloud configuration.
- WalkerBucks exists as a separate economy API and should remain the shared ledger, not the game-save database.
- WalkerBucks `/v1/accounts/me` is currently stubbed, and privileged reward/admin endpoints must not be called directly from the browser.
- C needs beta-friendly account recovery before the shared economy bridge is ready.
- Existing local saves must not be silently overwritten during account linking.

## Options Considered

### Option A: Supabase Owns Game Auth/Profile/Cloud Save For C

Supabase Auth handles Google and email/password sign-in. A game-owned `game_saves` table stores the full `GameState` JSON payload per authenticated user.

Pros:

- Fastest path to beta account persistence.
- Keeps WalkerBucks focused on economy ledger responsibilities.
- Supports Google and email/password without building auth from scratch.
- Keeps the decision reversible because the local save schema remains the source payload.

Cons:

- Adds Supabase environment setup and table policy work.
- Cloud save conflict handling must be handled explicitly in the client.
- Discord identity linking is still a later bridge.

### Option B: WalkerBucks Owns Auth And Save First

WalkerBucks expands from ledger/account API into the game auth and game-save owner.

Pros:

- One future account authority for identity plus economy.
- Could simplify later WalkerBucks reward ownership after auth matures.

Cons:

- Blocks C on WalkerBucks auth work that is not ready.
- Blurs economy ledger and game-save responsibilities.
- Increases risk of exposing privileged economy paths from the browser.

### Option C: Local Export/Import Only For C

Keep C as local-only and rely on JSON export/import for recovery.

Pros:

- No backend configuration.
- Lowest implementation risk.

Cons:

- Fails the C-version account persistence goal.
- Beta players cannot recover progress naturally across devices or browser resets.
- Pushes account problems into later phases where economy work is already harder.

## Decision

Use Supabase for C-version game auth, profile identity, and cloud save persistence.

WalkerBucks remains the economy ledger and is integrated through a trusted backend bridge. Phase 5 stores and recovers the game `GameState` payload for authenticated users, but spendable WB must come from WalkerBucks, not from client save state.

## Auth Scope

Ship these C-version auth surfaces:

- Email/password sign-in.
- Email/password account creation.
- Google OAuth sign-in when Supabase Google provider credentials are configured.
- Sign-out.

Defer these auth surfaces:

- Discord OAuth.
- Telegram auth.
- WalkerBucks account linking.

Discord should be handled in Phase 7 after account save and WalkerBucks bridge decisions are stable.

## Save Ownership

Supabase owns cloud persistence for the C-version game save. The browser keeps localStorage as the guest and offline-first cache.

Cloud save shape in the shared `WalkerWorld` Supabase project:

```text
walk_the_world.game_saves
- user_id uuid primary key references auth.users(id)
- save_version integer not null
- save_payload jsonb not null
- updated_at timestamptz not null
```

The client writes the whole `GameState` payload. Future phases may split analytics, economy grants, or leaderboard summaries into server-owned tables, but Phase 5 should not do that.

## Account Linking Behavior

Existing local saves are never uploaded or replaced automatically when a user signs in.

After sign-in:

- If no cloud save exists, the player can upload the current local guest save.
- If a cloud save exists and the local save is newer, the player must choose whether to upload local or load cloud.
- If a cloud save exists and the cloud save is newer, the player must choose whether to load cloud or keep local.
- If both saves have the same timestamp, prefer keeping the current local state unless the player explicitly loads cloud.

Conflict comparison uses `lastSavedAt` first and `saveVersion` second. This is good enough for C beta recovery and avoids inventing merge semantics for nested game state.

## Failure Behavior

- Missing Supabase env vars disables account features and leaves guest play untouched.
- Auth errors are shown in the account panel without resetting state.
- Cloud load errors do not replace local state.
- Cloud upload errors leave localStorage intact and can be retried.
- Sign-out keeps the current local state available for guest play.

## Environment Variables

Required for account sync:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional Supabase provider configuration:

```text
Google OAuth provider credentials configured in the Supabase dashboard
```

The browser must only use the Supabase anon key. Service-role keys, WalkerBucks secrets, and privileged reward credentials must never be included in Vite env vars.

## Implementation Implications

Phase 5 should add:

- `src/services/authClient.ts` for Supabase auth/session helpers.
- `src/services/cloudSaveClient.ts` for cloud save load/upload helpers.
- `src/components/AccountPanel.tsx` for sign-in, sign-up, Google OAuth, sync status, and conflict choices.
- Save metadata in `GameState` so local UI can describe cloud sync status without breaking old saves.
- Environment documentation for Supabase setup.

Phase 5 must preserve:

- Guest play without env vars.
- Existing localStorage key and migrations.
- Export/import/reset controls.
- No privileged WalkerBucks browser calls.

## Supabase Table Setup

Recommended SQL for the C-version cloud save table:

```sql
create schema if not exists walk_the_world;

grant usage on schema walk_the_world to anon, authenticated;

create table if not exists walk_the_world.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_version integer not null,
  save_payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table walk_the_world.game_saves enable row level security;

grant select, insert, update on walk_the_world.game_saves to authenticated;

create policy "Players can read their own game save"
on walk_the_world.game_saves
for select
using (auth.uid() = user_id);

create policy "Players can insert their own game save"
on walk_the_world.game_saves
for insert
with check (auth.uid() = user_id);

create policy "Players can update their own game save"
on walk_the_world.game_saves
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Revisit Triggers

Revisit this decision if:

- WalkerBucks ships stable user auth and a game-save API.
- Discord identity becomes a hard launch blocker.
- Cloud save conflicts require field-level merges instead of whole-save choice.
- Server-authoritative rewards require queued WTW earnings to settle through WalkerBucks before becoming spendable WB.
