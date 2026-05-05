# CODEX Dev Commands

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

## Useful Extras

```bash
npm run dev:set-wb -- --amount 10000
npm run dev:buy -- --item test-cosmetic-hat
npm run dev:buy -- --item test-boost
npm run dev:session
```

## Local Page

```bash
npm run dev
```

```txt
http://localhost:5173/dev
```

## Non-negotiable rules

- Never mutate wallet balances directly.
- All WB changes must go through WalkerBucks ledger/API.
- Every write needs an idempotency key.
- All purchase tests must check wallet, inventory, and gameplay stats.
- Dev routes must be disabled in production.
- Brand-new onboarding state must use the real app/account/game-state path.
