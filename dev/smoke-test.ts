import {
  applyOnboardingAction,
  applyWalletAction,
  buyDevItem,
  getDevSnapshot,
  resetDevAccount,
  seedDevSuite
} from '../src/devtools/devActions';
import { DEV_NEW_USER_ACCOUNT, DEV_PLAYER_ACCOUNT } from '../src/devtools/devAccounts';
import { getArg } from './helpers/devApiClient';
import { loadDevSuiteState, saveDevSuiteState } from './helpers/devState';

type SmokeStep = {
  name: string;
  run: () => void | Promise<void>;
};

const fail = (title: string, details: Record<string, unknown>): never => {
  const lines = [
    `${title}: FAIL`,
    '',
    ...Object.entries(details).map(([key, value]) => `${key}: ${Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value}`)
  ];
  console.log(lines.join('\n'));
  process.exitCode = 1;
  throw new Error(String(details['Step failed'] ?? 'smoke failed'));
};

const runSteps = async (steps: SmokeStep[]) => {
  for (const step of steps) {
    try {
      await step.run();
    } catch (error) {
      throw new Error(`${step.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

const inventoryList = (snapshot: unknown): string[] =>
  (snapshot as { snapshot?: { inventory?: string[] } }).snapshot?.inventory ?? [];

const wallet = (snapshot: unknown): number =>
  (snapshot as { snapshot?: { wallet?: { WB?: number } } }).snapshot?.wallet?.WB ?? 0;

const dps = (snapshot: unknown): number =>
  (snapshot as { snapshot?: { gameState?: { dps?: number } } }).snapshot?.gameState?.dps ?? 0;

const onboardingStatus = (snapshot: unknown): string | null =>
  (snapshot as { snapshot?: { onboarding?: { status?: string } } }).snapshot?.onboarding?.status ?? null;

const mode = getArg('mode', 'default');
let suite = seedDevSuite(await loadDevSuiteState()).suite;

if (mode === 'new-user') {
  let firstSnapshot: unknown;
  let purchaseResult: unknown;

  try {
    await runSteps([
      {
        name: 'reset dev_new_user',
        run: () => {
          const next = resetDevAccount(suite, DEV_NEW_USER_ACCOUNT.accountId);
          suite = next.suite;
        }
      },
      {
        name: 'load clean onboarding state',
        run: () => {
          firstSnapshot = getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId).result;
          if (onboardingStatus(firstSnapshot) !== 'not_started') {
            fail('WTW NEW-USER SMOKE TEST', {
              'Step failed': 'onboarding status is not_started',
              Expected: 'not_started',
              Actual: onboardingStatus(firstSnapshot)
            });
          }
        }
      },
      {
        name: 'start onboarding',
        run: () => {
          const next = applyOnboardingAction(suite, 'start', DEV_NEW_USER_ACCOUNT.accountId);
          suite = next.suite;
        }
      },
      {
        name: 'complete first onboarding step',
        run: () => {
          const next = applyOnboardingAction(suite, 'complete-step', DEV_NEW_USER_ACCOUNT.accountId);
          suite = next.suite;
        }
      },
      {
        name: 'grant starter pack',
        run: () => {
          const next = applyOnboardingAction(suite, 'grant-starter-pack', DEV_NEW_USER_ACCOUNT.accountId);
          suite = next.suite;
        }
      },
      {
        name: 'simulate first purchase',
        run: () => {
          const next = applyOnboardingAction(suite, 'simulate-first-purchase', DEV_NEW_USER_ACCOUNT.accountId);
          suite = next.suite;
          purchaseResult = next.result;
        }
      },
      {
        name: 'reload persistence',
        run: async () => {
          await saveDevSuiteState(suite);
          suite = seedDevSuite(await loadDevSuiteState()).suite;
          const reloaded = getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId).result;
          if (onboardingStatus(reloaded) === 'not_started') {
            fail('WTW NEW-USER SMOKE TEST', {
              'Step failed': 'onboarding state persisted after reload',
              Expected: 'started or progressed',
              Actual: onboardingStatus(reloaded)
            });
          }
        }
      }
    ]);

    await saveDevSuiteState(suite);
    const finalSnapshot = getDevSnapshot(suite, DEV_NEW_USER_ACCOUNT.accountId).result;
    console.log(
      [
        'WTW NEW-USER SMOKE TEST: PASS',
        '',
        `Account: ${DEV_NEW_USER_ACCOUNT.accountId}`,
        `Onboarding: ${onboardingStatus(finalSnapshot)}`,
        `WB after starter flow: ${wallet(finalSnapshot)}`,
        `Purchased: ${(purchaseResult as { itemId?: string }).itemId ?? 'starter-shoes'}`,
        `Inventory: ${inventoryList(finalSnapshot).join(', ') || 'empty'}`,
        'Reload persistence: PASS'
      ].join('\n')
    );
  } catch (error) {
    if (process.exitCode) process.exit();
    fail('WTW NEW-USER SMOKE TEST', {
      'Step failed': error instanceof Error ? error.message : String(error),
      'Likely area': 'onboarding dev state or smoke flow'
    });
  }
} else {
  let wbBefore = 0;
  let wbAfter = 0;
  let dpsBefore = 0;
  let dpsAfter = 0;

  try {
    await runSteps([
      {
        name: 'reset dev_wtw_player',
        run: () => {
          const next = resetDevAccount(suite, DEV_PLAYER_ACCOUNT.accountId);
          suite = next.suite;
        }
      },
      {
        name: 'set WB to 10000',
        run: () => {
          const next = applyWalletAction(suite, 'dev:set-wb', {
            accountId: DEV_PLAYER_ACCOUNT.accountId,
            amount: 10000
          });
          suite = next.suite;
          const result = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
          wbBefore = wallet(result);
          dpsBefore = dps(result);
        }
      },
      {
        name: 'buy starter-shoes',
        run: () => {
          const next = buyDevItem(suite, {
            accountId: DEV_PLAYER_ACCOUNT.accountId,
            itemId: 'starter-shoes'
          });
          suite = next.suite;
          if (!next.result.ok) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'starter-shoes purchase',
              Details: next.result
            });
          }
        }
      },
      {
        name: 'confirm wallet inventory and DPS changed',
        run: () => {
          const result = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
          wbAfter = wallet(result);
          dpsAfter = dps(result);
          if (wbAfter !== 9500) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'wallet decreased after purchase',
              Expected: 9500,
              Actual: wbAfter
            });
          }
          if (!inventoryList(result).includes('starter_shoes')) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'inventory contains starter-shoes',
              Expected: 'starter_shoes',
              Inventory: inventoryList(result)
            });
          }
          if (dpsAfter <= dpsBefore) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'DPS changed after purchase',
              'DPS before': dpsBefore,
              'DPS after': dpsAfter
            });
          }
        }
      },
      {
        name: 'reload account state',
        run: async () => {
          await saveDevSuiteState(suite);
          suite = seedDevSuite(await loadDevSuiteState()).suite;
          const result = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
          if (!inventoryList(result).includes('starter_shoes')) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'inventory persistence after reload',
              'Expected item': 'starter_shoes',
              'After reload inventory': inventoryList(result),
              'Likely area': 'purchase settlement or inventory hydration'
            });
          }
        }
      },
      {
        name: 'idempotency replay',
        run: () => {
          const idempotencyKey = 'dev:smoke:starter-shoes:idempotency';
          const first = buyDevItem(suite, {
            accountId: DEV_PLAYER_ACCOUNT.accountId,
            itemId: 'starter-shoes',
            idempotencyKey
          });
          suite = first.suite;
          const second = buyDevItem(suite, {
            accountId: DEV_PLAYER_ACCOUNT.accountId,
            itemId: 'starter-shoes',
            idempotencyKey
          });
          suite = second.suite;
          const result = getDevSnapshot(suite, DEV_PLAYER_ACCOUNT.accountId).result;
          const count = (suite.accounts[DEV_PLAYER_ACCOUNT.accountId]?.inventory.items.starter_shoes ?? 0);
          if (count !== 2 || wallet(result) !== 9000) {
            fail('WTW SMOKE TEST', {
              'Step failed': 'idempotency replay does not double buy',
              'Starter shoes count': count,
              'Wallet after replay': wallet(result)
            });
          }
        }
      }
    ]);

    await saveDevSuiteState(suite);
    console.log(
      [
        'WTW SMOKE TEST: PASS',
        '',
        `Account: ${DEV_PLAYER_ACCOUNT.accountId}`,
        `WB before: ${wbBefore}`,
        'Purchased: starter-shoes',
        `WB after: ${wbAfter}`,
        'Inventory: starter-shoes found',
        `DPS before: ${dpsBefore}`,
        `DPS after: ${dpsAfter}`,
        'Reload persistence: PASS',
        'Idempotency: PASS'
      ].join('\n')
    );
  } catch (error) {
    if (process.exitCode) process.exit();
    fail('WTW SMOKE TEST', {
      'Step failed': error instanceof Error ? error.message : String(error),
      'Likely area': 'purchase settlement or inventory hydration'
    });
  }
}
