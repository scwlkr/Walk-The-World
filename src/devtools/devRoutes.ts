export const DEV_API_ROUTE_PREFIX = '/api/dev';

export const DEV_API_ROUTES = {
  'POST /api/dev/grant-wb': 'grant-wb',
  'POST /api/dev/take-wb': 'take-wb',
  'POST /api/dev/set-wb': 'set-wb',
  'POST /api/dev/reset-account': 'reset-account',
  'POST /api/dev/reset-new-user': 'reset-new-user',
  'POST /api/dev/buy-item': 'buy-item',
  'POST /api/dev/refund-last-purchase': 'refund-last-purchase',
  'POST /api/dev/seed-shop': 'seed-shop',
  'POST /api/dev/run-smoke-test': 'run-smoke-test',
  'POST /api/dev/failure-mode': 'failure-mode',
  'POST /api/dev/gameplay': 'gameplay',
  'GET /api/dev/snapshot': 'snapshot',
  'POST /api/dev/start-onboarding': 'start-onboarding',
  'POST /api/dev/complete-onboarding-step': 'complete-onboarding-step',
  'POST /api/dev/skip-onboarding': 'skip-onboarding',
  'POST /api/dev/replay-onboarding': 'replay-onboarding',
  'POST /api/dev/clear-tutorial-flags': 'clear-tutorial-flags',
  'POST /api/dev/grant-starter-pack': 'grant-starter-pack',
  'POST /api/dev/simulate-first-purchase': 'simulate-first-purchase',
  'POST /api/dev/simulate-first-offline-return': 'simulate-first-offline-return',
  'POST /api/dev/simulate-first-wb-sync': 'simulate-first-wb-sync'
} as const;

export type DevRouteAction = (typeof DEV_API_ROUTES)[keyof typeof DEV_API_ROUTES];
