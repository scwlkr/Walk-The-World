# WalkerWorld Supabase Architecture

Last updated: 2026-04-28

## Status

Accepted for the shared Walker World free-tier Supabase project.

## Context

The Supabase free plan limits the number of projects available. Walk The World cannot consume a dedicated Supabase project if the wider Walker World ecosystem also needs Supabase-backed identity, persistence, and future integration surfaces.

The shared project is:

```text
Project name: WalkerWorld
Project ref: qiqssyqofbbjoqnydjrm
Production app: https://walk-the-world.vercel.app/
```

## Decision

Use one shared Supabase project named `WalkerWorld`, with domain boundaries enforced by schemas, RLS, and server-side Edge Function secrets.

Initial schema layout:

```text
core                  shared account/profile/linking tables later
walk_the_world        Walk The World game-owned tables
walkerbucks           future WalkerBucks mapping or mirror tables
walker_world_discord  future Discord identity/link tables
```

Only `walk_the_world` is currently exposed through PostgREST for browser cloud-save reads and writes. Future schemas should stay unexposed until a browser client actually needs them.

## Current Live Setup

Configured:

- Supabase project linked to this repo.
- `walk_the_world.game_saves` created with owner-only RLS.
- Supabase Auth email/password enabled.
- Email confirmations disabled for private beta.
- Supabase API exposed schemas include `walk_the_world`.
- `walkerbucks-bridge` Edge Function deployed.
- Vercel Production, Preview, and Development have browser-safe Supabase URL/key variables.
- Production deployed to `https://walk-the-world.vercel.app/`.

Not configured:

- No current shared inventory merge into the local Walk The World inventory model.

Configured after WalkerBucks deployment:

- `WALKERBUCKS_API_URL=https://walkerbucks.vercel.app` is set as a Supabase Edge Function secret.
- `WALKERBUCKS_SERVICE_TOKEN` is set as a Supabase Edge Function secret.
- `VITE_WALKERBUCKS_BRIDGE_URL` is set in Vercel Production, Preview, and Development.
- WalkerBucks reward, leaderboard, marketplace offer, and marketplace purchase smokes pass through the bridge.
- Production was redeployed after the bridge URL was configured.

## Security Rules

- Browser code may use only browser-safe Supabase project URL/key values.
- Supabase service-role keys must never be placed in `VITE_*`, `.env.example`, committed files, or browser code.
- WalkerBucks API URL and service token belong only in Supabase Edge Function secrets.
- Discord bot/client/signing secrets belong only in server-side runtime configuration.
- Every browser-accessible table must have RLS before it is exposed through PostgREST.

## Walk The World Cloud Save

Live table:

```text
walk_the_world.game_saves
```

RLS model:

- Authenticated users can select their own row.
- Authenticated users can insert their own row.
- Authenticated users can update their own row.
- No anonymous table privileges.
- No browser delete policy.

## Version C State

Version C can now prove live Supabase auth, cloud-save recovery, shared WalkerBucks balance, idempotent reward grant, leaderboard, marketplace offer loading, and marketplace purchase proof.

## Revisit Triggers

Revisit this architecture when:

- WalkerBucks replaces the beta service-token bridge path with production AuthN/AuthZ.
- Discord identity linking needs a live table.
- More than one app needs shared profile fields.
- Supabase free-tier quotas become a real beta blocker.
