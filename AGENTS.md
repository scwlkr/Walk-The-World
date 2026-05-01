# Agent Instructions

This repo is part of the Walker World ecosystem.

WalkerBucks economy logic is centralized in:

https://github.com/scwlkr/WalkerBucks

Do not create a separate economy system in this repo.

WalkerBucks must never be local. The WalkerBucks ledger is the only source of truth for balances, rewards, spending, transfers, and audit history across the ecosystem. WTW may calculate gameplay progress and queue pending reward requests, but no client save, browser state, localStorage value, Supabase game-save row, or app-specific table can create spendable WB.

If a task involves:
- WalkerBucks
- wallets
- balances
- rewards
- shops
- inventory
- item definitions
- item grants
- purchases
- transfers
- leaderboards
- marketplace
- economy analytics

then assume the correct solution is to integrate with the WalkerBucks repo/API, not duplicate the logic locally.

This repo should act as a client, adapter, or UI layer unless explicitly told otherwise.

Every earned or spent WalkerBuck must settle through the trusted WalkerBucks bridge/API with idempotency, account identity, and ledger records. Local WTW state may keep pending/failed request metadata for retry visibility, but it must not become a parallel wallet, ledger, shop, transfer, reward, or audit system.

Before coding economy features, inspect current project code and propose the integration boundary with WalkerBucks.
