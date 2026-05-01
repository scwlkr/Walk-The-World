# Walk The World Dev Suite

This suite adds deterministic dev accounts and short Codex-friendly commands for economy and onboarding testing.

- `dev_wtw_player`: existing user testing (buy/refund/sync/optimistic checks).
- `dev_new_user`: clean onboarding flow validation.

Dev route protection is centralized in `src/devtools/devAuth.ts` and blocks tools in production unless explicit flags are set.

Use `npm run test:smoke` and `npm run test:smoke -- --mode=new-user` for quick PASS/FAIL loops.
