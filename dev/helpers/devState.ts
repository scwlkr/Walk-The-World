import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  createEmptyDevSuiteState,
  seedDevSuite,
  type DevSuiteState
} from '../../src/devtools/devActions';

export const DEV_STATE_PATH = join(process.cwd(), 'dev', '.state', 'dev-suite.json');

export const loadDevSuiteState = async (): Promise<DevSuiteState> => {
  try {
    const raw = await readFile(DEV_STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DevSuiteState;
    return seedDevSuite(parsed).suite;
  } catch {
    return createEmptyDevSuiteState();
  }
};

export const saveDevSuiteState = async (suite: DevSuiteState): Promise<void> => {
  await mkdir(dirname(DEV_STATE_PATH), { recursive: true });
  await writeFile(DEV_STATE_PATH, JSON.stringify(suite, null, 2));
};

export const runDevStateAction = async <T extends { suite: DevSuiteState; result: unknown }>(
  action: (suite: DevSuiteState) => T
): Promise<T['result']> => {
  const current = await loadDevSuiteState();
  const next = action(current);
  await saveDevSuiteState(next.suite);
  return next.result;
};
