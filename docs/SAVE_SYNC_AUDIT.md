# Account Save Sync Audit

Last updated: 2026-05-01

## Old Failure

Authenticated startup fetched the Supabase cloud row but only stored it in `cloudSave` panel state. It did not resolve that row into the active `GameState`. The active game kept using the local `walk_the_world_save_v1` localStorage payload, so desktop and mobile could advance separate DT, DPS, upgrades, followers, inventory, cosmetics, and route state while signed into the same Supabase account.

Cloud upload was also mostly manual. A device could keep autosaving localStorage every few seconds without publishing the current canonical game state to `walk_the_world.game_saves`.

## Storage Surfaces

- Local fallback: browser `localStorage` key `walk_the_world_save_v1`.
- IndexedDB: not used by the current game save path.
- Auth identity: Supabase Auth user id from `auth.getSession()` / `onAuthStateChange`.
- Cloud table: `walk_the_world.game_saves`.
- Cloud row key: `user_id` primary key, so one authenticated user has one cloud save row.
- Cloud payload: full `GameState` JSON in `save_payload`.
- Cloud metadata: `save_version` and `updated_at`.

## New Startup Resolution

On sign-in, WTW now loads the cloud row and compares it against the local save using:

- local `lastSavedAt`
- cloud `updated_at`
- local and cloud `saveVersion`
- core progress fields: current world, route state, DT, total walked distance, DPS, upgrade levels, followers, inventory, cosmetics, milestones, achievements

Resolution rules:

1. If no cloud row exists, the signed-in local save creates the first cloud row.
2. If cloud is newer, cloud loads into active `GameState` and localStorage.
3. If timestamps tie, cloud remains authoritative unless local clearly has more core progress.
4. If local is clearly newer and has more progress, WTW marks an account conflict and stops automatic cloud writes.
5. Conflict actions are explicit: `Load Cloud` or `Upload Local`.

## Ongoing Sync

After startup resolves, the active signed-in device uploads changed game state to Supabase on a short interval and on focus/online events. Automatic upload is guarded by `expectedCloudUpdatedAt`; if another device has written a newer cloud row since this device last loaded/synced, the upload is blocked and the account moves to conflict state.

This prevents stale mobile localStorage from silently overwriting newer desktop progress.

## Development Logging

In development mode, save sync logs `[WTW save sync]` with:

- auth user id
- loaded source
- local updated timestamp
- cloud updated timestamp
- chosen winner
- save versions
- core progress comparison

## Manual Overrides

- `Load Cloud`: replaces local state with the current cloud row and resumes automatic sync.
- `Upload Local`: intentionally overwrites cloud with the local state and resumes automatic sync.

These are override actions, not the normal sync path.
