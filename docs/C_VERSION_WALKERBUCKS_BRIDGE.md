# Walk The World C Version WalkerBucks Bridge

Last updated: 2026-04-28

## Status

Accepted for Phase 6 implementation.

## Decision Boundary

This document defines the C-version bridge between the web game and the WalkerBucks economy. It covers balance reads, the first server-authoritative reward source, idempotency, retry behavior, failure behavior, and auth assumptions.

It does not ship leaderboards, marketplace spending, Discord linking, Telegram linking, shared inventory purchases, or a full anti-cheat program.

## Source Evidence

WalkerBucks was inspected from `git@github-scwlkr:scwlkr/WalkerBucks.git` at commit `2090e62a1854f4724e5ea56e08d1e577932464d1`.

Current WalkerBucks facts:

- FastAPI API under `/v1`.
- PostgreSQL-backed double-entry ledger.
- WB amounts are integer values.
- Ledger transactions have unique `idempotency_key` values.
- Repeated reward grants with the same idempotency key return the existing transaction.
- `GET /v1/accounts/me` returns `501 Auth not implemented yet`.
- Admin/reward endpoints exist but do not yet have production auth middleware.

## Bridge Shape

Required path:

```text
game browser -> trusted game backend -> WalkerBucks API
```

Chosen C-version trusted backend:

```text
Supabase Edge Function: walkerbucks-bridge
```

Rationale:

- Phase 5 already uses Supabase Auth for game identity and cloud save.
- The browser can send a Supabase user access token to the bridge.
- The bridge can verify the Supabase user before touching WalkerBucks.
- WalkerBucks API URL and privileged credentials stay in server-side function secrets, not Vite env vars.

## Environment Variables

Browser-safe Vite variable:

```text
VITE_WALKERBUCKS_BRIDGE_URL=
```

Server-only bridge secrets:

```text
WALKERBUCKS_API_URL=
WALKERBUCKS_SERVICE_TOKEN=
```

`WALKERBUCKS_SERVICE_TOKEN` is reserved for the future WalkerBucks auth middleware. If WalkerBucks is running in the current unauthenticated local/beta shape, the bridge can omit that header, but the browser must still never call WalkerBucks directly.

## Identity Mapping

Until WalkerBucks implements `/v1/accounts/me`, the bridge creates or resolves a WalkerBucks account from the authenticated Supabase user.

Mapping:

```text
WalkerBucks username = wtw:{supabase_user_id}
platform identity = platform "supabase", external_id {supabase_user_id}
```

Bridge steps:

1. Verify the Supabase access token.
2. Resolve or create the WalkerBucks account with `POST /v1/accounts`.
3. Best-effort link the platform identity with `POST /v1/accounts/link-platform`.
4. Use the returned WalkerBucks `account_id` for wallet reads and reward grants.

The platform-link call is best-effort because the current WalkerBucks implementation does not expose a lookup-by-platform endpoint and duplicate platform links can fail. The deterministic username is the C-version source of truth until WalkerBucks auth matures.

## Endpoint Mapping

### Balance Read

Browser:

```http
GET {VITE_WALKERBUCKS_BRIDGE_URL}/balance
Authorization: Bearer {supabase_access_token}
```

Bridge:

```text
POST /v1/accounts
GET /v1/wallets/{account_id}
```

Bridge response:

```json
{
  "accountId": "uuid",
  "assetCode": "WB",
  "balance": 0,
  "lockedBalance": 0,
  "availableBalance": 0,
  "updatedAt": 1710000000000
}
```

### Server-Authoritative Reward Grant

First C-version reward source:

```text
achievement:day_one_check_in
```

Reason:

- It is one-time.
- It is already a local achievement.
- It has a small WB reward.
- The server can authorize it from authenticated account identity without trusting browser-supplied progress totals.

Browser:

```http
POST {VITE_WALKERBUCKS_BRIDGE_URL}/rewards/grants
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

```json
{
  "sourceType": "achievement",
  "sourceId": "day_one_check_in",
  "idempotencyKey": "wtw:supabase:{user_id}:achievement:day_one_check_in"
}
```

Bridge:

```text
POST /v1/accounts
POST /v1/rewards/grants
GET /v1/wallets/{account_id}
```

WalkerBucks grant payload:

```json
{
  "account_id": "uuid",
  "amount": 20,
  "idempotency_key": "wtw:supabase:{user_id}:achievement:day_one_check_in",
  "reason_code": "webgame.achievement.day_one_check_in",
  "description": "Walk The World Day One Walker achievement"
}
```

Bridge response:

```json
{
  "status": "granted",
  "accountId": "uuid",
  "transactionId": "uuid",
  "sourceType": "achievement",
  "sourceId": "day_one_check_in",
  "amount": 20,
  "idempotencyKey": "wtw:supabase:{user_id}:achievement:day_one_check_in",
  "balance": {
    "assetCode": "WB",
    "balance": 20,
    "lockedBalance": 0,
    "availableBalance": 20,
    "updatedAt": 1710000000000
  }
}
```

## Idempotency Rules

Stable key format:

```text
wtw:supabase:{supabase_user_id}:{source_type}:{source_id}
```

For Phase 6:

```text
wtw:supabase:{supabase_user_id}:achievement:day_one_check_in
```

Rules:

- The bridge derives the expected idempotency key from the verified Supabase user and source.
- If the browser sends a different key, the bridge rejects the request.
- The browser stores the same key in local pending-grant state for retry visibility.
- A retry uses the exact same idempotency key.
- A WalkerBucks duplicate response is treated as success because the ledger returns the original transaction.

## Local Versus Server-Backed Rewards

C-version state must distinguish:

- local-only WB: existing guest/local game currency used for upgrades and local play
- shared WalkerBucks: canonical balance read from WalkerBucks through the bridge
- pending server grant: a bridge-backed reward request that has not settled yet
- failed server grant: a bridge-backed reward request that can be retried with the same idempotency key

Behavior:

- Guest mode and missing bridge config keep using local-only rewards.
- Signed-in bridge mode skips local WB for the first server-backed achievement and records a pending WalkerBucks grant instead.
- Items/cosmetics remain local unless a later phase maps them to WalkerBucks inventory.
- Local WB remains available for game upgrades even when shared WalkerBucks exists.

## Failure Behavior

Missing `VITE_WALKERBUCKS_BRIDGE_URL`:

- Bridge UI reports unavailable.
- Guest/local play and local rewards continue.

Missing Supabase session:

- Bridge UI reports sign-in required.
- Guest/local rewards continue.

Bridge request fails:

- The reward is recorded as failed with the stable idempotency key.
- The player sees the failed grant in the WalkerBucks panel.
- Retry sends the same idempotency key.
- The local save is not reset or overwritten.

WalkerBucks request fails:

- The bridge returns a retryable error for 5xx or network failures.
- The bridge returns a non-retryable error for unknown reward source or idempotency mismatch.
- The browser keeps the failed grant visible either way.

## Security Rules

- No WalkerBucks privileged secret goes in `VITE_*` env vars.
- Browser code never calls WalkerBucks API endpoints directly.
- Browser reward requests never include an amount trusted by the server.
- The bridge maps reward source IDs to server-owned reward definitions.
- The bridge verifies the Supabase token before resolving a WalkerBucks account.
- The bridge rejects idempotency keys that do not match the authenticated user and reward source.

## Phase 6 Acceptance Mapping

- Browser never stores privileged WalkerBucks admin/reward secrets: use only `VITE_WALKERBUCKS_BRIDGE_URL` in browser.
- Reward grants use stable idempotency keys: derive `wtw:supabase:{user_id}:achievement:day_one_check_in`.
- Failed bridge calls are visible and retryable: persist pending/failed grant state in local save.
- Guest/local mode works if WalkerBucks is unavailable: fall back to local reward behavior when bridge or session is missing.
- `npm run build` passes after code changes.

## Deferred

- WalkerBucks `/v1/accounts/me` replacement for deterministic username mapping.
- Production WalkerBucks auth middleware.
- Server validation for distance, quest, prestige, seasonal, and random-event rewards.
- Marketplace purchases.
- Shared inventory grants.
- Leaderboards.
- Discord and Telegram identity linking.
