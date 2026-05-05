import type { GameState } from '../game/types';
import { getClickMiles, getIdleMilesPerSecond } from '../game/formulas';
import { getWtwWalletState } from '../game/economy';

export const buildDebugSnapshot = (state: GameState, route: string, isMobile: boolean) => ({
  accountId: state.walkerBucksBridge.accountId ?? state.account.userId ?? 'anonymous',
  wallet: { WB: getWtwWalletState(state).displayedWbBalance },
  gameState: {
    dt: state.distanceMiles,
    lifetimeDt: state.stats.totalDistanceWalked,
    dps: getIdleMilesPerSecond(state),
    tapPower: getClickMiles(state),
    offlineProgressAvailable: Boolean(state.ui.offlineSummary)
  },
  inventory: Object.keys(state.inventory.items).filter((key) => (state.inventory.items[key] ?? 0) > 0),
  activeBoosts: state.activeBoosts.map((boost) => boost.id),
  onboarding: state.onboarding,
  tutorialFlags: state.tutorialFlags,
  lastPurchase: Object.values(state.walkerBucksBridge.purchases).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null,
  daily: state.dailyClaim,
  client: { isMobile, route, timestamp: new Date().toISOString() }
});
