# Walker World Dependencies

Last updated: 2026-04-30

This project is part of Walker World. Its economy integration boundary is intentionally narrow.

## WalkerBucks Ledger Rule

WalkerBucks must never be local to Walk The World.

The WalkerBucks ledger is the only source of truth for:

- balances
- rewards
- spending
- transfers
- account-linked WB ownership
- audit history

WTW may calculate gameplay progress, show bridge state, and queue pending reward or spend requests. No client save, browser state, localStorage value, Supabase `game_saves` payload, or WTW-owned table can create spendable WB.

All spendable WB behavior must settle through:

https://github.com/scwlkr/WalkerBucks

## Required Integration Pattern

Correct runtime path:

```text
WTW browser -> trusted WalkerBucks bridge/API -> WalkerBucks ledger
```

The browser may call only the trusted WTW bridge URL. WalkerBucks API URLs, service tokens, database URLs, service-role keys, and Discord or bot secrets stay server-side.

## WTW May Do

- calculate distance, milestones, quests, route encounters, and other gameplay progress
- queue pending reward requests with stable idempotency keys
- keep pending, failed, granted, spent, or purchased bridge-request status for retry visibility
- display the canonical WalkerBucks balance returned by the bridge
- reserve locally spendable WB for optimistic WTW shop purchases as `syncedWbBalance - pendingSpend`
- request bridge-settled rewards, spends, transfers, and marketplace purchases
- show app-layer item, inventory, upgrade, and DPS changes optimistically after a local spendable-WB reservation, then reconcile or roll back after bridge settlement
- preserve guest/local play when the bridge is unavailable, with WB unavailable or pending for settlement

## WTW Must Not Do

- directly mutate WalkerBucks balances
- keep a local spendable WB wallet
- use localStorage, cloud saves, or app tables as WalkerBucks balance truth
- treat client-calculated rewards as final WalkerBucks grants
- spend pending, reserved, or unsynced WB again
- create a parallel ledger, rewards table, transfer system, audit log, marketplace economy, or wallet model
- silently copy or merge Discord, browser, or app-specific economy state into WalkerBucks
- bypass WalkerBucks account identity, idempotency, or ledger records

## Item, Shop, And Inventory Boundary

WalkerBucks core owns WB movement and ledger history. WTW can own gameplay item presentation only when it remains an app layer.

If a purchase uses WB:

1. The bridge verifies the signed-in account.
2. WTW may reserve locally spendable WB and apply WTW-owned gameplay effects immediately.
3. The bridge validates the purchase idempotency key and forwards only currency-settlement metadata.
4. WalkerBucks records the ledger movement.
5. WTW marks the local purchase settled after confirmation, or rolls back the optimistic item/DPS/balance effects after a non-retriable settlement failure.

If item or shop data needs to become ecosystem-wide, design the ownership in WalkerBucks first instead of expanding WTW tables.

## Before Building Economy Features

Check:

1. Does the canonical behavior already belong in `scwlkr/WalkerBucks`?
2. Is this only gameplay progress, or does it affect spendable WB?
3. Does every reward, spend, transfer, or purchase have an idempotency key?
4. Does the bridge derive account identity server-side instead of trusting browser input?
5. Will the action produce a WalkerBucks ledger record and audit trail?
6. Can this be abused across web, Discord, or future clients if it stays local?

If the feature affects shared WB, implement or extend the WalkerBucks API/bridge first.
