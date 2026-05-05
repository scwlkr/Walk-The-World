import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import {
  applyOnboardingAction,
  applyWalletAction,
  buyDevItem,
  clearFailureModeForSuite,
  getDevSnapshot,
  refundLastPurchase,
  resetDevAccount,
  seedDevSuite,
  seedShop,
  setFailureModeForSuite,
  updateGameplay,
  type DevSuiteState
} from '../../src/devtools/devActions';
import { isDevToolsEnabled } from '../../src/devtools/devAuth';
import { DEV_NEW_USER_ACCOUNT, DEV_PLAYER_ACCOUNT } from '../../src/devtools/devAccounts';
import { loadDevSuiteState, saveDevSuiteState } from './devState';

const readJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
  });

const sendJson = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
};

const accountIdFrom = (url: URL, body: Record<string, unknown>, fallback: string = DEV_PLAYER_ACCOUNT.accountId): string =>
  String(body.accountId ?? url.searchParams.get('accountId') ?? fallback);

const amountFrom = (body: Record<string, unknown>, fallback = 0): number =>
  Number.isFinite(Number(body.amount)) ? Number(body.amount) : fallback;

const latency = async (suite: DevSuiteState): Promise<void> => {
  if (suite.failureMode.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, suite.failureMode.latencyMs));
  }
};

export const handleDevApiRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> => {
  if (!req.url) return false;
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/dev')) return false;

  if (!isDevToolsEnabled({ NODE_ENV: process.env.NODE_ENV, VITE_ENABLE_DEVTOOLS: process.env.VITE_ENABLE_DEVTOOLS })) {
    sendJson(res, 404, { ok: false, error: 'Dev tools are disabled.' });
    return true;
  }

  try {
    const body = req.method === 'GET' ? {} : await readJsonBody(req);
    let suite = await loadDevSuiteState();
    await latency(suite);
    let next: { suite: DevSuiteState; result: unknown };

    switch (`${req.method ?? 'GET'} ${url.pathname}`) {
      case 'GET /api/dev/snapshot':
        if (url.searchParams.get('surface') === 'wallet' && suite.failureMode.nextWalletRefreshFails) {
          next = setFailureModeForSuite(suite, { nextWalletRefreshFails: false });
          await saveDevSuiteState(next.suite);
          sendJson(res, 503, { ok: false, action: 'dev:snapshot', error: 'Forced next wallet refresh failure.' });
          return true;
        }
        if (url.searchParams.get('surface') === 'inventory' && suite.failureMode.nextInventoryRefreshFails) {
          next = setFailureModeForSuite(suite, { nextInventoryRefreshFails: false });
          await saveDevSuiteState(next.suite);
          sendJson(res, 503, { ok: false, action: 'dev:snapshot', error: 'Forced next inventory refresh failure.' });
          return true;
        }
        next = getDevSnapshot(
          suite,
          String(url.searchParams.get('accountId') ?? body.accountId ?? DEV_PLAYER_ACCOUNT.accountId),
          String(url.searchParams.get('route') ?? '/dev'),
          url.searchParams.get('isMobile') === 'true'
        );
        break;
      case 'POST /api/dev/grant-wb':
        next = applyWalletAction(suite, 'dev:grant', { accountId: accountIdFrom(url, body), amount: amountFrom(body) });
        break;
      case 'POST /api/dev/take-wb':
        next = applyWalletAction(suite, 'dev:take', { accountId: accountIdFrom(url, body), amount: amountFrom(body) });
        break;
      case 'POST /api/dev/set-wb':
        next = applyWalletAction(suite, 'dev:set-wb', { accountId: accountIdFrom(url, body), amount: amountFrom(body) });
        break;
      case 'POST /api/dev/reset-account':
        next = resetDevAccount(suite, DEV_PLAYER_ACCOUNT.accountId);
        break;
      case 'POST /api/dev/reset-new-user':
        next = resetDevAccount(suite, DEV_NEW_USER_ACCOUNT.accountId);
        break;
      case 'POST /api/dev/buy-item':
        next = buyDevItem(suite, {
          accountId: accountIdFrom(url, body),
          itemId: String(body.item ?? body.itemId ?? 'starter-shoes'),
          idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined
        });
        break;
      case 'POST /api/dev/refund-last-purchase':
        next = refundLastPurchase(suite, accountIdFrom(url, body));
        break;
      case 'POST /api/dev/seed-shop':
        next = seedShop(suite);
        break;
      case 'POST /api/dev/failure-mode':
        next =
          body.clear === true
            ? clearFailureModeForSuite(suite)
            : setFailureModeForSuite(suite, {
                latencyMs: body.latencyMs as 0 | 250 | 1000 | 5000 | undefined,
                nextPurchaseFails: body.nextPurchaseFails as boolean | undefined,
                nextWalletRefreshFails: body.nextWalletRefreshFails as boolean | undefined,
                nextInventoryRefreshFails: body.nextInventoryRefreshFails as boolean | undefined,
                duplicateNextPurchase: body.duplicateNextPurchase as boolean | undefined
              });
        break;
      case 'POST /api/dev/gameplay':
        next = updateGameplay(suite, String(body.action ?? 'set-dt') as Parameters<typeof updateGameplay>[1], {
          accountId: accountIdFrom(url, body),
          value: amountFrom(body, 0)
        });
        break;
      case 'POST /api/dev/start-onboarding':
        next = applyOnboardingAction(suite, 'start', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/complete-onboarding-step':
        next = applyOnboardingAction(suite, 'complete-step', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/skip-onboarding':
        next = applyOnboardingAction(suite, 'skip', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/replay-onboarding':
        next = applyOnboardingAction(suite, 'replay', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/clear-tutorial-flags':
        next = applyOnboardingAction(suite, 'clear-tutorial-flags', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/grant-starter-pack':
        next = applyOnboardingAction(suite, 'grant-starter-pack', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/simulate-first-purchase':
        next = applyOnboardingAction(suite, 'simulate-first-purchase', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/simulate-first-offline-return':
        next = applyOnboardingAction(suite, 'simulate-first-offline-return', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/simulate-first-wb-sync':
        next = applyOnboardingAction(suite, 'simulate-first-wb-sync', accountIdFrom(url, body, DEV_NEW_USER_ACCOUNT.accountId));
        break;
      case 'POST /api/dev/run-smoke-test':
        next = seedDevSuite(suite);
        break;
      default:
        sendJson(res, 404, { ok: false, error: 'Unknown dev route.', path: url.pathname });
        return true;
    }

    suite = next.suite;
    await saveDevSuiteState(suite);
    sendJson(res, 200, next.result);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      details: error && typeof error === 'object' && 'details' in error ? (error as { details: unknown }).details : undefined
    });
  }

  return true;
};
