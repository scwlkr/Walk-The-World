# Walk The World C Version Social Bridge

Last updated: 2026-04-30

## Status

Accepted for Phase 7 implementation.

## Decision Boundary

This document defines the Phase 7 bridge contract for leaderboards, marketplace proof, Discord identity linking, and Telegram scope.

It does not ship live Discord OAuth, Telegram auth, cross-platform reward grants, shared inventory sync into the game save, or any privileged WalkerBucks or Discord secret in the browser.

## Source Evidence

WalkerBucks was inspected from `/Users/shanewalker/Desktop/dev/WalkerBucks` at commit `0d14d280a579`.

Relevant WalkerBucks ledger facts:

- `GET /v1/leaderboards/walkerbucks` returns ranked wallet balance rows shaped as `account_id` and `balance`.
- `POST /v1/transfers/walkerbucks` is the supported WB movement path for app purchase settlement.
- WalkerBucks core is the source of truth for accounts, wallets, ledger transactions, transfers, rewards, and audit history.
- WalkerBucks core does not expose item, shop, inventory, or marketplace routes.
- Retained live item/shop rows are app-layer compatibility data and must be accessed only through the trusted bridge.
- `/v1/accounts/me` requires trusted account context, so the game bridge still resolves WTW users server-side instead of trusting browser-supplied account IDs.

Discord evidence was inspected from `/Users/shanewalker/Desktop/dev/walker-world-discord`.

Relevant Discord repo facts:

- The target Discord runtime is a Cloudflare Worker plus D1 implementation.
- It has D1-backed wallet, inventory, achievements, titles, daily, shop, buy, marketplace posting, and leaderboard commands.
- `CMD_LEADERBOARD` is guild-scoped and ranks Discord users by Discord D1 wallet balance.
- `CMD_SHOP`, `CMD_BUY`, and `CMD_INVENTORY` are catalog-driven and use generated economy metadata.
- The Discord economy catalog is rich enough to inform future item naming and category ideas, but it is not currently the same canonical inventory system as the WalkerBucks API.

Telegram evidence:

- No Telegram implementation evidence exists in this repo or the inspected Discord repo.

## Phase 7 Decisions

### First Leaderboard Category

Ship one account-backed leaderboard first: shared WalkerBucks balance.

Reason:

- WalkerBucks already exposes `GET /v1/leaderboards/walkerbucks`.
- The category is server-owned and does not trust local game progress.
- It proves account-backed shared economy reads without inventing extra leaderboard storage in the game repo.

### Marketplace Proof Scope

Ship a WalkerBucks-backed purchase proof using bridge-served app-layer offers and WalkerBucks ledger settlement.

Rules:

- The game browser reads marketplace offers only through the trusted bridge.
- The browser sends only `shopOfferId` and an idempotency key for purchases.
- The bridge resolves the authenticated Supabase user to a WalkerBucks account.
- The bridge validates app-layer offer data server-side, then settles WB through WalkerBucks.
- Client-side pending WB can never be used as spendable WB.
- Purchased shared inventory remains a read-only bridge entitlement for Phase 7; it is not merged into local game inventory yet.

### Discord Identity-Linking Contract

Discord is the first social bridge target, but Phase 7 does not ship cross-platform Discord rewards until identity linking is implemented through a trusted server path.

Future Discord link contract:

```text
game browser -> trusted game/social bridge -> Discord OAuth or bot-owned link flow -> WalkerBucks platform identity
```

Required link fields:

```text
supabase_user_id
walkerbucks_account_id
discord_user_id
discord_guild_id
linked_at
link_method
```

Rules:

- Discord bot tokens, client secrets, signing secrets, and privileged Worker secrets stay server-side.
- The browser may hold a short-lived link URL or display a link status, but never a Discord privileged secret.
- Cross-platform rewards require a verified `discord_user_id` linked to the same WalkerBucks account as the signed-in game user.
- Discord D1 wallet state is not silently merged into WalkerBucks wallet state.
- If a future migration needs Discord balances or inventory to become shared WalkerBucks state, write a migration plan before any copy, mint, burn, or merge.

### Discord Catalog Decision

The Discord economy catalog does not seed game inventory in Phase 7.

Reason:

- The game already has local inventory and cosmetics.
- WalkerBucks no longer treats item definitions, shop offers, inventory, or marketplace routes as core ledger APIs.
- Discord catalog IDs, D1 state, and command presentation are not a confirmed canonical source for web-game inventory.

Allowed Phase 7 use:

- Reference Discord catalog categories and naming as design evidence.
- Keep marketplace proof tied to bridge-served app-layer offers and WalkerBucks ledger settlement.
- Defer any catalog-to-game inventory mapping until shared inventory ownership is explicit.

### Telegram Decision

Telegram is future-planned and blocked until Discord identity linking is live and stable.

Required future evidence before Telegram work:

- chosen Telegram auth or bot-link flow
- shared WalkerBucks platform identity mapping
- abuse controls for link ownership
- clear policy for whether Telegram and Discord leaderboards are platform-specific or shared

## Endpoint Mapping

Browser-safe variable:

```text
VITE_WALKERBUCKS_BRIDGE_URL=
```

Server-only bridge secrets:

```text
WALKERBUCKS_API_URL=
WALKERBUCKS_SERVICE_TOKEN=
```

No new browser-visible Discord or WalkerBucks secret is required for Phase 7.

### Shared WB Leaderboard

Browser:

```http
GET {VITE_WALKERBUCKS_BRIDGE_URL}/leaderboards/walkerbucks
Authorization: Bearer {supabase_access_token}
```

Bridge:

```text
POST /v1/accounts
GET /v1/leaderboards/walkerbucks
```

Bridge response:

```json
{
  "category": "walkerbucks_balance",
  "accountId": "uuid",
  "entries": [
    {
      "rank": 1,
      "accountId": "uuid",
      "balance": 1200,
      "isCurrentAccount": true
    }
  ],
  "updatedAt": 1710000000000
}
```

### Marketplace Offers

Browser:

```http
GET {VITE_WALKERBUCKS_BRIDGE_URL}/marketplace/offers
Authorization: Bearer {supabase_access_token}
```

Bridge:

```text
POST /v1/accounts
GET /v1/wallets/{account_id}
Server-side database read of retained shop_offers, item_definitions, and item_instances
```

Bridge response:

```json
{
  "accountId": "uuid",
  "balance": {
    "assetCode": "WB",
    "balance": 1000,
    "lockedBalance": 0,
    "availableBalance": 1000,
    "updatedAt": 1710000000000
  },
  "offers": [
    {
      "id": 1,
      "shopId": 1,
      "itemDefinitionId": 1,
      "name": "WalkerBucks Item #1",
      "description": "Shared WalkerBucks marketplace item.",
      "priceWb": 300
    }
  ],
  "updatedAt": 1710000000000
}
```

### Marketplace Purchase Proof

Browser:

```http
POST {VITE_WALKERBUCKS_BRIDGE_URL}/marketplace/purchases
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

```json
{
  "shopOfferId": 1,
  "idempotencyKey": "wtw:supabase:{user_id}:marketplace:offer:1"
}
```

Bridge:

```text
POST /v1/accounts
Server-side database read of retained shop_offers
POST /v1/transfers/walkerbucks
GET /v1/wallets/{account_id}
Server-side database write/read of retained item_instances and item_history
```

Bridge response:

```json
{
  "status": "purchased",
  "accountId": "uuid",
  "shopOfferId": 1,
  "itemInstanceId": "uuid",
  "itemDefinitionId": 1,
  "priceWb": 300,
  "idempotencyKey": "wtw:supabase:{user_id}:marketplace:offer:1",
  "balance": {
    "assetCode": "WB",
    "balance": 700,
    "lockedBalance": 0,
    "availableBalance": 700,
    "updatedAt": 1710000000000
  },
  "inventory": [
    {
      "itemInstanceId": "uuid",
      "itemDefinitionId": 1,
      "status": "owned"
    }
  ]
}
```

## Idempotency Rules

Marketplace purchase key format:

```text
wtw:supabase:{supabase_user_id}:marketplace:offer:{shop_offer_id}
```

Rules:

- The bridge derives the expected idempotency key from the verified Supabase user and offer ID.
- If the browser sends a different key, the bridge rejects the request.
- Retrying the same purchase proof uses the same idempotency key.
- The current proof intentionally makes one durable purchase attempt per offer and user.

## Failure Behavior

Missing `VITE_WALKERBUCKS_BRIDGE_URL`:

- Leaderboard and marketplace UI reports unavailable.
- Guest route progress and app-layer inventory continue, but spendable WB still requires WalkerBucks bridge settlement.

Missing Supabase session:

- Leaderboard and marketplace UI report sign-in required.
- Local guest play continues.

WalkerBucks leaderboard failure:

- The leaderboard panel shows the error and keeps the rest of the stats screen usable.

WalkerBucks offer or purchase failure:

- Marketplace panel shows the error.
- No client-side WB balance is spent.
- No local inventory is granted.
- Existing local save remains intact.

Discord unavailable:

- Discord bridge status remains documentation-gated.
- No cross-platform Discord rewards are emitted.
- The game remains playable.

Telegram unavailable:

- Telegram remains a future blocker note only.

## Security Rules

- Browser code never calls WalkerBucks directly.
- Browser code never stores WalkerBucks service tokens, Discord bot tokens, Discord client secrets, or Discord signing secrets.
- Marketplace prices and app-layer item ownership are verified server-side by the trusted bridge; WB movement is verified by the WalkerBucks ledger.
- Browser purchase requests do not include trusted price, account ID, item definition ID, or balance fields.
- Discord identity must be verified server-side before any cross-platform reward or inventory bridge ships.
- Discord D1 state and WalkerBucks state must not be merged without an explicit migration plan.

## Phase 7 Acceptance Mapping

- Logged-in beta player can see at least one leaderboard: shared WalkerBucks balance leaderboard through the trusted bridge.
- Marketplace proof cannot spend client-side WB: purchases route through the bridge and only use WalkerBucks ledger balance.
- Discord bridge has an explicit identity-linking contract before cross-platform rewards ship: this document defines it and defers rewards.
- Telegram has a clear future plan or blocker note: Telegram is future-planned after Discord linking stability.
- `npm run build` passes after code changes.

## Deferred

- Live Discord OAuth/link implementation.
- Discord D1 to WalkerBucks migration.
- Discord-linked cross-platform rewards.
- Telegram bot or auth implementation.
- Shared inventory mapping into local game inventory.
- More leaderboard categories beyond shared WalkerBucks balance.
