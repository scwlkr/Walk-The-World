import { describe, expect, it } from 'vitest';
import { applyOnboardingAction, createEmptyDevSuiteState, resetDevAccount } from '../../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../../src/devtools/devAccounts';

describe('onboarding tutorial flow', () => {
  it('requires WalkerBucks intro before first WB purchase and inventory intro after first item acquisition', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    const state = suite.accounts[DEV_NEW_USER_ACCOUNT.accountId];

    expect(state?.tutorialFlags.hasSeenWalkerBucksIntro).toBe(true);
    expect(state?.onboarding.currentStep).toBe('shop');

    suite = applyOnboardingAction(suite, 'grant-starter-pack', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'simulate-first-purchase', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.onboarding.currentStep).toBe('inventory');
  });

  it('offline progress intro only becomes relevant after simulated offline progress exists', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.ui.offlineSummary).toBe(null);
    suite = applyOnboardingAction(suite, 'simulate-first-offline-return', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(suite.accounts[DEV_NEW_USER_ACCOUNT.accountId]?.ui.offlineSummary).not.toBe(null);
  });
});
