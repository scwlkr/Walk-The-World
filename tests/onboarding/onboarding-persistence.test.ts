import { describe, expect, it } from 'vitest';
import { applyOnboardingAction, applyWalletAction, createEmptyDevSuiteState, resetDevAccount } from '../../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../../src/devtools/devAccounts';

describe('onboarding persistence and replay', () => {
  it('onboarding state persists after reload-shaped serialization', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    const reloaded = JSON.parse(JSON.stringify(suite));

    expect(reloaded.accounts[DEV_NEW_USER_ACCOUNT.accountId].onboarding.status).toBe('in_progress');
    expect(reloaded.accounts[DEV_NEW_USER_ACCOUNT.accountId].onboarding.completedSteps).toEqual(['welcome']);
  });

  it('skipped onboarding does not reappear unless replayed', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'skip', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.onboarding.status).toBe('skipped');
    suite = applyOnboardingAction(suite, 'replay', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.onboarding.status).toBe('in_progress');
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.onboarding.currentStep).toBe('welcome');
  });

  it('replay resets tutorial flags but preserves wallet and inventory unless explicitly reset', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_NEW_USER_ACCOUNT.accountId, amount: 1000 }).suite;
    suite = applyOnboardingAction(suite, 'simulate-first-purchase', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'replay', DEV_NEW_USER_ACCOUNT.accountId).suite;
    const state = suite.accounts[DEV_NEW_USER_ACCOUNT.accountId];

    expect(state?.walkerBucksBridge.balance?.availableBalance).toBe(500);
    expect(state?.inventory.items.starter_shoes).toBe(1);
    expect(Object.values(state?.tutorialFlags ?? {}).every((value) => value === false)).toBe(true);
  });
});
