# Walk The World Dev Suite

The dev suite is a local-only testing surface for WalkerBucks, purchases, gameplay state, sync snapshots, failure simulation, and first-run onboarding.

It has three entry points:

- CLI scripts in `dev/`
- dev-only API routes under `/api/dev/*`
- the hidden local page at `/dev`

## Protection

Dev tools are guarded by `src/devtools/devAuth.ts`.

They are enabled when `NODE_ENV !== "production"` or an explicit local flag is set:

```bash
VITE_ENABLE_DEVTOOLS=true
ENABLE_DEVTOOLS=true
```

Production mode without those flags must block dev routes.

## Accounts

`dev_wtw_player`

Existing-player account for regular economy and gameplay testing.

`dev_new_user`

Brand-new account for onboarding. It resets to:

- 0 DT and 0 lifetime DT
- 0 WB
- no inventory, upgrades, boosts, followers, cosmetics, purchases, daily streak, or tutorial flags
- onboarding status `not_started`

## WalkerBucks Boundary

The suite uses an approved non-production dev ledger helper. Commands do not mutate wallet balance fields directly. They create idempotent dev ledger transactions and then hydrate the normal `GameState.walkerBucksBridge.balance` snapshot used by the app.

Purchases use the same WTW optimistic purchase helpers used by the app, then settle against the dev ledger.

## Common Commands

```bash
npm run dev:seed
npm run dev:reset
npm run dev:reset-new-user
npm run dev:grant -- --amount 10000
npm run dev:take -- --amount 500
npm run dev:set-wb -- --amount 0
npm run dev:buy -- --item starter-shoes
npm run dev:onboarding -- --action start
npm run dev:onboarding -- --action complete-step
npm run test:smoke
npm run test:smoke -- --mode=new-user
npm run test:economy
npm run test:mobile
```

## Known Test Items

- `starter-shoes`: 500 WB, adds the deterministic Starter Shoes inventory item and +1 ft/sec upgrade effect.
- `test-cosmetic-hat`: 100 WB, cosmetic only, no DPS change.
- `test-boost`: 200 WB, adds an active speed boost.

## `/dev` Panel

Start the app:

```bash
npm run dev
```

Open:

```bash
http://localhost:5173/dev
```

Use the panel buttons to reset accounts, grant/take/set WB, buy items, refund, adjust DT/DPS/tap power, simulate offline progress, run onboarding actions, set API latency, force failures, and copy the current debug snapshot.

## Failure Simulation

Use `/dev` or:

```bash
curl -X POST http://localhost:5173/api/dev/failure-mode \
  -H 'Content-Type: application/json' \
  -d '{"latencyMs":1000,"nextPurchaseFails":true}'
```

Clear it:

```bash
curl -X POST http://localhost:5173/api/dev/failure-mode \
  -H 'Content-Type: application/json' \
  -d '{"clear":true}'
```

## Debug Snapshot

The snapshot includes account id, wallet, DT, lifetime DT, DPS, tap power, inventory, active boosts, onboarding, tutorial flags, last purchase, route, mobile indicator, and timestamp.

Copy it from `/dev` with `Copy Debug Snapshot`, or run:

```bash
npm run dev:session
```

## Smoke Tests

Default:

```bash
npm run test:smoke
```

New user:

```bash
npm run test:smoke -- --mode=new-user
```

Both commands print a clear `PASS` or `FAIL` block with the failed step and likely area.
