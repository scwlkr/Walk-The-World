import { getArg, output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { applyOnboardingAction } from '../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../src/devtools/devAccounts';

try {
  const action = getArg('action', 'start') ?? 'start';
  const accountId = getArg('account', DEV_NEW_USER_ACCOUNT.accountId);
  const normalized =
    action === 'complete-onboarding-step'
      ? 'complete-step'
      : action === 'clear'
        ? 'clear-tutorial-flags'
        : action;
  output(
    await runDevStateAction((suite) =>
      applyOnboardingAction(suite, normalized as Parameters<typeof applyOnboardingAction>[1], accountId)
    )
  );
} catch (error) {
  outputError('dev:onboarding', error);
}
