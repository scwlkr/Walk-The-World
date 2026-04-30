# Walk The World C Version WalkerBucks Bridge

Last updated: 2026-04-30

## Status

Accepted for Phase 6 implementation.

## Decision Boundary

This document defines the C-version bridge between the web game and the WalkerBucks economy. It covers balance reads, WalkerBucks Bank linking, the first server-authoritative reward source, idempotency, retry behavior, failure behavior, and auth assumptions.

It does not move WalkerBucks wallet, ledger, bank, or account-linking ownership into the game. The game remains a browser client plus trusted bridge.

## Source Evidence

WalkerBucks was inspected from `/Users/shanewalker/Desktop/dev/WalkerBucks` at `origin/main` commit `66f25a5be41a6652f407ea1303e013aa6ced0622`.

Current WalkerBucks facts:

- FastAPI API under `/v1`.
- PostgreSQL-backed double-entry ledger.
- WB amounts are integer values.
- Ledger transactions have unique `idempotency_key` values.
- Repeated reward grants with the same idempotency key return the existing transaction.
- `/v1` endpoints use service-token auth when `WALKERBUCKS_REQUIRE_SERVICE_TOKEN=true`.
- `GET /v1/accounts/me` reads the trusted current account from `X-WalkerBucks-Account-Id`.
- `POST /v1/accounts/link-intent` and `POST /v1/accounts/link-complete` are the current bank-code linking contract.
- `GET /v1/accounts/by-platform/{platform}/{platform_user_id}` is the bridge-safe account lookup added for linked app identity resolution.

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

The bridge resolves a WalkerBucks account from the authenticated Supabase user without trusting browser-supplied account IDs.

Mapping:

```text
WTW platform identity = platform "wtw", platform_user_id {supabase_user_id}
legacy deterministic username = wtw:{supabase_user_id}
```

Bridge steps:

1. Verify the Supabase access token.
2. Resolve an existing bank-linked account through `GET /v1/accounts/by-platform/wtw/{supabase_user_id}`.
3. If no WTW platform identity exists yet, use the legacy deterministic account `wtw:{supabase_user_id}` for pre-link balance and reward behavior.
4. When the player enters a WalkerBucks Bank WTW code, complete it through `POST /v1/accounts/link-complete`.
5. If a legacy deterministic account has available WB, move it to the linked bank account with an idempotent `POST /v1/transfers/walkerbucks`.
6. Use the bank-linked WalkerBucks `account_id` for future wallet reads and reward grants.

The bridge stores no privileged account mapping in browser state. WalkerBucks platform identity is the source of truth after link completion.

## Endpoint Mapping

### Balance Read

Browser:

```http
GET {VITE_WALKERBUCKS_BRIDGE_URL}/balance
Authorization: Bearer {supabase_access_token}
```

Bridge:

```text
GET /v1/accounts/by-platform/wtw/{supabase_user_id}
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

### WalkerBucks Bank Link

Browser:

```http
POST {VITE_WALKERBUCKS_BRIDGE_URL}/bank/link
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

```json
{
  "linkCode": "LINK-1234"
}
```

Bridge:

```text
POST /v1/accounts
POST /v1/accounts/link-complete
GET /v1/wallets/{legacy_account_id}
POST /v1/transfers/walkerbucks
GET /v1/wallets/{linked_account_id}
```

`POST /v1/transfers/walkerbucks` runs only when the legacy deterministic WTW account has available WB and differs from the bank-linked account.

Bridge response:

```json
{
  "status": "linked",
  "accountId": "uuid",
  "platform": "wtw",
  "platformUserId": "supabase-user-id",
  "migrationTransactionId": "uuid-or-null",
  "balance": {
    "assetCode": "WB",
    "balance": 20,
    "lockedBalance": 0,
    "availableBalance": 20,
    "updatedAt": 1710000000000
  },
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
GET /v1/accounts/by-platform/wtw/{supabase_user_id}
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

Bank link fails:

- Invalid, expired, consumed, or wrong-platform link codes return a bridge error.
- The local game save is not replaced or reset.
- The player can generate a fresh WTW link code in WalkerBucks Bank and retry.

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
- The browser sends only the bank link code; the bridge derives the WTW platform user from the verified Supabase user.

## Phase 6 Acceptance Mapping

- Browser never stores privileged WalkerBucks admin/reward secrets: use only `VITE_WALKERBUCKS_BRIDGE_URL` in browser.
- Reward grants use stable idempotency keys: derive `wtw:supabase:{user_id}:achievement:day_one_check_in`.
- Bank linking uses WalkerBucks Bank link intents and completes them only through the trusted bridge.
- Failed bridge calls are visible and retryable: persist pending/failed grant state in local save.
- Guest/local mode works if WalkerBucks is unavailable: fall back to local reward behavior when bridge or session is missing.
- `npm run build` passes after code changes.

## Deferred

- Public-launch auth hardening beyond the current scoped service-token model.
- Server validation for distance, quest, prestige, seasonal, and random-event rewards.
- Discord and Telegram identity linking.
