# Agent Instructions

This repo is part of the Walker World ecosystem.

WalkerBucks economy logic is centralized in:

https://github.com/scwlkr/WalkerBucks

Do not create a separate economy system in this repo.

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

Before coding economy features, inspect current project code and propose the integration boundary with WalkerBucks.
