import { getArg, output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { buyDevItem } from '../src/devtools/devActions';

try {
  const itemId = getArg('item', 'starter-shoes') ?? 'starter-shoes';
  const accountId = getArg('account');
  const idempotencyKey = getArg('idempotency-key');
  output(await runDevStateAction((suite) => buyDevItem(suite, { itemId, accountId, idempotencyKey })));
} catch (error) {
  outputError('dev:buy', error);
}
