import { describe, expect, it } from 'vitest';
import {
  applyOnboardingAction,
  applyWalletAction,
  createEmptyDevSuiteState,
  getDevSnapshot,
  resetDevAccount
} from '../../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../../src/devtools/devAccounts';

const snap = (suite: ReturnType<typeof createEmptyDevSuiteState>) =>
  getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId).result as {
    snapshot: {
      onboarding: { status: string; currentStep: string | null; completedSteps: string[]; skipped: boolean };
      tutorialFlags: Record<string, boolean>;
      wallet: { WB: number };
      inventory: string[];
      gameState: { dt: number; lifetimeDt: number; dps: number };
      daily: { lastClaimAt: string | null; streak: number };
    };
  };

describe('brand-new user onboarding state', () => {
  it('loads cleanly through the real dev account game state path', () => {
    const reset = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId);
    const state = snap(reset.suite).snapshot;

    expect(state.onboarding.status).toBe('not_started');
    expect(state.onboarding.currentStep).toBe(null);
    expect(state.onboarding.completedSteps).toEqual([]);
    expect(Object.values(state.tutorialFlags).every((value) => value === false)).toBe(true);
    expect(state.wallet.WB).toBe(0);
    expect(state.inventory).toEqual([]);
    expect(state.gameState.dt).toBe(0);
    expect(state.gameState.lifetimeDt).toBe(0);
    expect(state.daily).toEqual({ lastClaimAt: null, streak: 0 });
  });

  it('can start onboarding and progress welcome before tap before shop', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(snap(suite).snapshot.onboarding.currentStep).toBe('welcome');
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(snap(suite).snapshot.onboarding.completedSteps).toEqual(['welcome']);
    expect(snap(suite).snapshot.onboarding.currentStep).toBe('tap');
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(snap(suite).snapshot.onboarding.currentStep).toBe('dps');
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(snap(suite).snapshot.onboarding.currentStep).toBe('walkerbucks');
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    expect(snap(suite).snapshot.onboarding.currentStep).toBe('shop');
  });

  it('reset brand-new user clears wallet, inventory, DT, DPS purchases, daily streak, and tutorial flags', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyWalletAction(suite, 'dev:set-wb', { accountId: DEV_NEW_USER_ACCOUNT.accountId, amount: 1000 }).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'simulate-first-purchase', DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = resetDevAccount(suite, DEV_NEW_USER_ACCOUNT.accountId).suite;
    const state = snap(suite).snapshot;

    expect(state.wallet.WB).toBe(0);
    expect(state.inventory).toEqual([]);
    expect(state.gameState.dt).toBe(0);
    expect(state.gameState.dps).toBeGreaterThanOrEqual(0);
    expect(state.daily.streak).toBe(0);
    expect(Object.values(state.tutorialFlags).every((value) => value === false)).toBe(true);
  });
});
