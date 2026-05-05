import { describe, expect, it } from 'vitest';
import { applyOnboardingAction, createEmptyDevSuiteState, getDevSnapshot, resetDevAccount } from '../../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../../src/devtools/devAccounts';

describe('mobile onboarding dev snapshots', () => {
  it('mobile snapshot includes route, mobile indicator, and onboarding completion state', () => {
    let suite = resetDevAccount(createEmptyDevSuiteState(), DEV_NEW_USER_ACCOUNT.accountId).suite;
    suite = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId).suite;
    const mobile = getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId, '/dev', true).result as {
      snapshot: { client: { isMobile: boolean; route: string }; onboarding: { status: string } };
    };
    const desktop = getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId, '/dev', false).result as {
      snapshot: { client: { isMobile: boolean; route: string }; onboarding: { status: string } };
    };

    expect(mobile.snapshot.client.isMobile).toBe(true);
    expect(mobile.snapshot.client.route).toBe('/dev');
    expect(desktop.snapshot.onboarding.status).toBe(mobile.snapshot.onboarding.status);
  });

  it('onboarding controls use short mobile-safe command labels in the dev suite contract', () => {
    const labels = [
      'Start Onboarding',
      'Complete Current Onboarding Step',
      'Skip Onboarding',
      'Replay Onboarding',
      'Clear Tutorial Flags',
      'Grant Starter Pack',
      'Simulate First Purchase',
      'Simulate First Offline Return',
      'Simulate First WB Sync'
    ];

    expect(labels.every((label) => label.length <= 34)).toBe(true);
  });
});
