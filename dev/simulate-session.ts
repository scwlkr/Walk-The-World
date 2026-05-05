import { getArg, output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { getDevSnapshot } from '../src/devtools/devActions';

try {
  const accountId = getArg('account', 'dev_wtw_player');
  const route = getArg('route', '/dev') ?? '/dev';
  const isMobile = getArg('device', 'mobile') !== 'desktop';
  output(await runDevStateAction((suite) => getDevSnapshot(suite, accountId, route, isMobile)));
} catch (error) {
  outputError('dev:session', error);
}
