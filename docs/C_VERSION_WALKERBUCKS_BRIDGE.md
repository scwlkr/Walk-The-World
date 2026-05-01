# Walk The World C Version WalkerBucks Bridge

Last updated: 2026-04-30

## Status

Accepted for Phase 6 implementation.

## Decision Boundary

This document defines the C-version bridge between the web game and the WalkerBucks economy. It covers balance reads, WalkerBucks Bank linking, the first server-authoritative reward source, idempotency, retry behavior, failure behavior, and auth assumptions.

It does not move WalkerBucks wallet, ledger, bank, or account-linking ownership into the game. The game remains a browser client plus trusted bridge.

Hard invariant: WalkerBucks must never be local to WTW. WTW may calculate gameplay progress and queue pending reward or spend requests, but no client save, browser state, Supabase game-save row, or app-specific table can create spendable WB. Every earned or spent WalkerBuck settles through the trusted WalkerBucks bridge/API with idempotency, account identity, and ledger records.

## Source Evidence

WalkerBucks was inspected from `/Users/shanewalker/Desktop/dev/WalkerBucks` at commit `0d14d280a579`.

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
- `POST /v1/transfers/walkerbucks` is the supported currency movement endpoint for app purchase settlement.
- WalkerBucks core does not expose item, shop, inventory, or marketplace routes.
- Live production retains old item/shop rows, but WalkerBucks treats them as application-layer data outside core behavior.

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
SUPABASE_DB_URL=
WALKERBUCKS_API_URL=
WALKERBUCKS_SERVICE_TOKEN=
```

`WALKERBUCKS_SERVICE_TOKEN` is the scoped service token used when WalkerBucks has service-token auth enabled. If a local-only WalkerBucks instance is running without that auth layer, the bridge can omit that header, but the browser must still never call WalkerBucks directly.

`SUPABASE_DB_URL` is needed only for the transitional app-layer compatibility path that reads retained legacy WalkerBucks item/shop rows and writes legacy item instances after marketplace purchases. It must never be exposed to the browser. The bridge uses the database connection instead of Supabase REST because the `walkerbucks` schema is intentionally not exposed through the public project API.

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
7. For shared inventory display, read retained legacy item instances from both the linked bank account and the old Supabase-linked WTW account.

The bridge stores no privileged account mapping in browser state. WalkerBucks platform identity is the source of truth after link completion.

## App-Layer Inventory Compatibility

WalkerBucks core is the source of truth for accounts, wallets, ledger transactions, transfers, rewards, and bank linking.

The old item, shop, inventory, and marketplace tables are not WalkerBucks core APIs anymore. While those retained rows still exist in the live WalkerBucks Supabase schema, WTW treats them as app-layer compatibility data:

- The bridge reads active `shop_offers` and `item_definitions` directly through the server-side database connection.
- The bridge reads `item_instances` from the linked bank account and the old WTW/Supabase account, then returns one combined inventory list to the browser.
- Bank linking migrates old WB balance only. It does not rewrite old item ownership rows or ledger history.
- Marketplace purchases settle money through `POST /v1/transfers/walkerbucks`, then the bridge writes the retained legacy `item_instances` and `item_history` rows.
- Repeated marketplace purchase retries reuse the WalkerBucks transfer idempotency key and return the existing legacy item instance when the history row already records that transaction.

This keeps WalkerBucks from re-owning marketplace logic while making already-purchased WTW items visible after the bank account link.

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
Server-side database read of retained item_instances for linked and legacy account IDs
```

Bridge response:

```json
{
  "accountId": "uuid",
  "assetCode": "WB",
  "balance": 0,
  "lockedBalance": 0,
  "availableBalance": 0,
  "inventory": [
    {
      "itemInstanceId": "uuid",
      "itemDefinitionId": 13,
      "status": "owned"
    }
  ],
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
Server-side database read of retained item_instances for linked and legacy account IDs
```

`POST /v1/transfers/walkerbucks` runs only when the legacy deterministic WTW account has available WB and differs from the bank-linked account.

Bridge response:

```json
{
  "status": "linked",
  "accountId": "uuid",
  "legacyAccountId": "uuid-or-null",
  "platform": "wtw",
  "platformUserId": "supabase-user-id",
  "migrationTransactionId": "uuid-or-null",
  "inventory": [
    {
      "itemInstanceId": "uuid",
      "itemDefinitionId": 13,
      "status": "owned"
    }
  ],
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

### Marketplace Offers And Purchases

Browser:

```http
GET {VITE_WALKERBUCKS_BRIDGE_URL}/marketplace/offers
Authorization: Bearer {supabase_access_token}
```

Bridge:

```text
GET /v1/accounts/by-platform/wtw/{supabase_user_id}
GET /v1/wallets/{account_id}
Server-side database read of retained shop_offers, item_definitions, and item_instances
```

Purchase browser call:

```http
POST {VITE_WALKERBUCKS_BRIDGE_URL}/marketplace/purchases
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

```json
{
  "shopOfferId": 13,
  "idempotencyKey": "wtw:supabase:{user_id}:marketplace:offer:13"
}
```

Purchase bridge flow:

```text
GET /v1/accounts/by-platform/wtw/{supabase_user_id}
Server-side database read of retained shop_offers
POST /v1/accounts for the settlement account
POST /v1/transfers/walkerbucks
Server-side database write to retained item_instances and item_history
GET /v1/wallets/{account_id}
Server-side database read of retained item_instances for linked and legacy account IDs
```

The transfer reason code is `transfer.walk_the_world_marketplace_purchase`. App-layer reason prefixes such as `shop.` and `marketplace.` are intentionally not used for WalkerBucks core ledger writes.

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

Reward stable key format:

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
- Marketplace purchases use `wtw:supabase:{supabase_user_id}:marketplace:offer:{shop_offer_id}`.
- Marketplace purchase retries must not create duplicate retained legacy item rows when the WalkerBucks transfer idempotency key returns the existing transaction.

## WalkerBucks-Ledger Rewards

C-version state must distinguish:

- spendable WalkerBucks: canonical balance read from WalkerBucks through the bridge
- pending WalkerBucks grant amount: unsubmitted WTW earnings that are not spendable until the bridge settles them
- pending server grant: a bridge-backed reward request that has not settled yet
- failed server grant: a bridge-backed reward request that can be retried with the same idempotency key
- legacy WTW save balance: old client-side WB that must migrate once through the bridge, then be zeroed locally

Behavior:

- Guest mode and missing bridge config may continue route progress, items, and pending grant accrual, but WB is not spendable without a WalkerBucks bridge balance.
- Signed-in bridge mode sends WTW earnings and legacy save migration through WalkerBucks reward grants.
- Upgrade, follower, catalog, marketplace, and item purchases settle WB through WalkerBucks before local game state changes.
- Route items and equipment remain WTW app-layer content, but WB movement remains WalkerBucks-ledger-owned.
- Shared WalkerBucks inventory is read-only app-layer entitlement data returned by the bridge.
- Marketplace purchases settle WB through WalkerBucks core and record the item in retained legacy app-layer rows.

## Failure Behavior

Missing `VITE_WALKERBUCKS_BRIDGE_URL`:

- Bridge UI reports unavailable.
- Route progress and item-only rewards can continue, but WB remains pending or unavailable for spend.

Missing Supabase session:

- Bridge UI reports sign-in required.
- WB grants and spends wait for sign-in; the browser must not maintain a separate spendable WB balance.

Bridge request fails:

- The reward is recorded as failed with the stable idempotency key.
- The player sees the failed grant in the WalkerBucks panel.
- Retry sends the same idempotency key.
- The local save is not reset or overwritten.

Bank link fails:

- Invalid, expired, consumed, or wrong-platform link codes return a bridge error.
- The local game save is not replaced or reset.
- The player can generate a fresh WTW link code in WalkerBucks Bank and retry.

Legacy app-layer inventory read fails:

- The bridge returns a bridge error for unexpected Supabase errors.
- If the retained legacy tables are absent in a future environment, inventory and marketplace rows fall back to empty arrays instead of failing wallet reads.
- Balance reads still come from WalkerBucks core.

WalkerBucks request fails:

- The bridge returns a retryable error for 5xx or network failures.
- The bridge returns a non-retryable error for unknown reward source or idempotency mismatch.
- The browser keeps the failed grant visible either way.

## Security Rules

- No WalkerBucks privileged secret goes in `VITE_*` env vars.
- Browser code never calls WalkerBucks API endpoints directly.
- Browser code never calls retained legacy Supabase item/shop tables directly.
- Browser reward requests may include WTW-earned amounts for bridge settlement; the bridge verifies auth, source type, idempotency key, and per-request caps before calling WalkerBucks.
- The bridge maps fixed reward source IDs to server-owned reward definitions and accepts dynamic WTW grant categories only through the trusted bridge.
- The bridge verifies the Supabase token before resolving a WalkerBucks account.
- The bridge rejects idempotency keys that do not match the authenticated user and reward source.
- The browser sends only the bank link code; the bridge derives the WTW platform user from the verified Supabase user.

## Phase 6 Acceptance Mapping

- Browser never stores privileged WalkerBucks admin/reward secrets: use only `VITE_WALKERBUCKS_BRIDGE_URL` in browser.
- Reward grants use stable idempotency keys: derive `wtw:supabase:{user_id}:achievement:day_one_check_in`.
- Bank linking uses WalkerBucks Bank link intents and completes them only through the trusted bridge.
- Linked accounts show retained legacy WTW inventory by reading both linked and old WTW account item rows.
- Marketplace purchases use WalkerBucks core transfers for WB movement and app-layer retained rows for item ownership.
- Failed bridge calls are visible and retryable: persist pending/failed grant state in local save.
- Guest/local mode works if WalkerBucks is unavailable: route progress continues, but WB is not separately spendable.
- `npm run build` passes after code changes.

## Deferred

- Public-launch auth hardening beyond the current scoped service-token model.
- Server validation for distance, quest, prestige, seasonal, and random-event rewards.
- A permanent WTW-owned item/shop/inventory service after retained legacy rows are exported or moved out of the WalkerBucks schema.
- Discord and Telegram identity linking.
