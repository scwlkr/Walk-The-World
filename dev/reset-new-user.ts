import { output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { resetDevAccount } from '../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT } from '../src/devtools/devAccounts';

try {
  output(await runDevStateAction((suite) => resetDevAccount(suite, DEV_NEW_USER_ACCOUNT.accountId)));
} catch (error) {
  outputError('dev:reset-new-user', error);
}
