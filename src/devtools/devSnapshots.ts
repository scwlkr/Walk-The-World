import type { GameState } from '../game/types';

export const buildDebugSnapshot = (state: GameState, route: string, isMobile: boolean) => ({
  accountId: state.account.userId ?? 'anonymous',
  wallet: { WB: state.walkerBucksBridge.cachedBalance ?? 0 },
  gameState: { dt: Math.floor(state.distanceMiles), lifetimeDt: Math.floor(state.stats.totalDistanceMiles), dps: state.baseIdleMilesPerSecond, tapPower: state.baseClickMiles },
  inventory: Object.keys(state.inventory.items).filter((key) => (state.inventory.items[key] ?? 0) > 0),
  activeBoosts: state.activeBoosts.map((boost) => boost.id),
  onboarding: (state as any).onboarding ?? null,
  tutorialFlags: (state as any).tutorialFlags ?? null,
  lastPurchase: (state as any).walkerBucksBridge?.lastPurchase ?? null,
  client: { isMobile, route, timestamp: new Date().toISOString() }
});
