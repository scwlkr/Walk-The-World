import { getArg, getNumberArg, output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { applyWalletAction } from '../src/devtools/devActions';

try {
  const amount = getNumberArg('amount', 0);
  const accountId = getArg('account');
  output(await runDevStateAction((suite) => applyWalletAction(suite, 'dev:set-wb', { amount, accountId })));
} catch (error) {
  outputError('dev:set-wb', error);
}
