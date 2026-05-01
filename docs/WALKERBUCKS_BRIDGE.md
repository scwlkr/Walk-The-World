# Walk The World WalkerBucks Bridge

Last updated: 2026-04-30

## Rule

WalkerBucks must never be local to WTW.

The game may calculate progress and queue pending reward or spend requests, but spendable WB balances, rewards, purchases, transfers, and audit history belong to the WalkerBucks ledger.

## v0.1 Bridge Role

v0.1 needs the bridge for:

- reading spendable WB balance
- settling queued walking/milestone rewards
- spending WB on generator, tap, and offline upgrades
- storing retryable pending/failed request metadata in the local save

v0.1 does not need the bridge for:

- marketplace browsing
- peer trading
- item ownership depth
- follower contracts
- prestige purchases
- social reward linking

Those are later-version systems.

## Required Shape

```text
browser -> trusted WTW backend/Edge Function -> WalkerBucks API
```

The browser uses only:

```text
VITE_WALKERBUCKS_BRIDGE_URL
```

Server-only values stay out of Vite:

```text
WALKERBUCKS_API_URL
WALKERBUCKS_SERVICE_TOKEN
SUPABASE_DB_URL
```

## Local Save State

Allowed local bridge state:

- bridge status
- latest bridge balance snapshot
- pending grant amount
- pending grant attempts
- pending spend attempts
- optimistic WTW purchase records with pending spend reservation
- failed request error messages
- settled transaction IDs returned by the bridge

Not allowed:

- local spendable wallet balance
- local ledger
- local transfer records that act as canonical money movement
- local shop or marketplace ownership as WalkerBucks core truth

## v0.1 Purchase Flow

```text
player clicks Buy
-> browser calculates spendableWb = latest bridge balance snapshot - unsettled optimistic spend
-> if spendableWb is too low, reject immediately
-> browser creates a local purchase record with a stable idempotency key
-> browser reserves the spend locally and applies WTW-owned gameplay state immediately
-> bridge verifies identity and spends WB through WalkerBucks in the background
-> WalkerBucks returns settled transaction/balance
-> browser marks the local purchase settled and refreshes the wallet snapshot
```

If a non-retriable settlement failure occurs, WTW rolls back the optimistic item, upgrade, follower, DPS, and local displayed-balance effects, refreshes the wallet snapshot, and shows: "Could not sync. Balance refreshed."

## v0.1 Reward Flow

```text
player gains distance or claims milestone
-> browser queues reward amount
-> signed-in bridge loop submits reward batch
-> WalkerBucks settles idempotent grant
-> browser stores settled transaction metadata
```

Queued reward metadata is not spendable WB.

## Future Work

Before v0.2+ economy depth, define separate contracts for:

- follower contracts
- cosmetics as morale/stability items
- boost purchases
- Journey Reset purchases
- region/event rewards
- marketplace and shared inventory
- Discord identity linking
