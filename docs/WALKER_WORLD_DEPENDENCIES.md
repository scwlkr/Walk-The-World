# Walker World Dependencies

This project is part of Walker World.

## Economy Rule

This project must not implement its own WalkerBucks balance, wallet, inventory, shop, reward, or marketplace logic.

All economy behavior must rely on:

https://github.com/scwlkr/WalkerBucks

## Required Integration Pattern

This project may:
- display WalkerBucks balances
- trigger reward events
- show shop/inventory UI
- request purchases/transfers
- display leaderboard data

This project may not:
- directly mutate balances
- create separate local WalkerBucks tables as the source of truth
- invent incompatible item schemas
- calculate final economy rewards client-side
- bypass the WalkerBucks ledger

## Correct Architecture

Client/project → WalkerBucks API → Supabase/Postgres ledger

## Before Building Economy Features

Check:
1. Does this already exist in `scwlkr/WalkerBucks`?
2. Should this be an API call instead of local logic?
3. Will this affect the shared WalkerBucks supply?
4. Can this be abused across Discord, web, or future clients?

If yes, implement it in WalkerBucks first.
