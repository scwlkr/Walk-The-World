import { output, outputError } from './helpers/devApiClient';
import { runDevStateAction } from './helpers/devState';
import { seedDevSuite } from '../src/devtools/devActions';

try {
  output(await runDevStateAction((suite) => seedDevSuite(suite)));
} catch (error) {
  outputError('dev:seed', error);
}
