import { createInitialGameState } from './initialState';
import { grantRewardToState } from './inventory';
import { applyDistanceAndWb } from './progression';
import type { GameState, WorldId } from './types';

export type DevPresetId =
  | 'fresh'
  | 'first_purchase'
  | 'item_rich'
  | 'event_heavy'
  | 'prestige_ready'
  | 'moon'
  | 'mars'
  | 'bridge_disabled';

export const DEV_PRESETS: Array<{ id: DevPresetId; label: string }> = [
  { id: 'fresh', label: 'Fresh player' },
  { id: 'first_purchase', label: 'First purchase' },
  { id: 'item_rich', label: 'Item rich' },
  { id: 'event_heavy', label: 'Event heavy' },
  { id: 'prestige_ready', label: 'Prestige ready' },
  { id: 'moon', label: 'Moon' },
  { id: 'mars', label: 'Mars prototype' },
  { id: 'bridge_disabled', label: 'Bridge disabled' }
];

const setWorld = (state: GameState, worldId: WorldId, distanceMiles: number, loopsCompleted = 0): GameState => ({
  ...state,
  currentWorldId: worldId,
  distanceMiles,
  worlds: {
    ...state.worlds,
    [worldId]: {
      ...state.worlds[worldId],
      distanceMiles,
      loopsCompleted,
      unlockedAt: state.worlds[worldId].unlockedAt ?? Date.now()
    }
  }
});

const withDevWallet = (state: GameState, amount: number, now = Date.now()): GameState => ({
  ...state,
  walkerBucks: 0,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    status: 'ready',
    accountId: 'dev:walkerbucks',
    balance: {
      assetCode: 'WB',
      balance: amount,
      lockedBalance: 0,
      availableBalance: amount,
      updatedAt: now
    },
    lastCheckedAt: now
  }
});

export const createDevPresetState = (presetId: DevPresetId, now = Date.now()): GameState => {
  const base = createInitialGameState(now);

  switch (presetId) {
    case 'fresh':
      return base;
    case 'first_purchase':
      return {
        ...grantRewardToState(withDevWallet(base, 90, now), { items: [{ itemId: 'trail_mix', quantity: 1 }] }),
        ui: { ...base.ui, toast: 'Dev preset: first purchase.' }
      };
    case 'item_rich':
      return grantRewardToState(
        withDevWallet(base, 1200, now),
        {
          items: [
            { itemId: 'trail_mix', quantity: 3 },
            { itemId: 'starter_step_counter', quantity: 1 },
            { itemId: 'retro_sweatband_item', quantity: 1 },
            { itemId: 'lucky_laces_item', quantity: 1 },
            { itemId: 'route_marker', quantity: 1 },
            { itemId: 'mile_badge', quantity: 1 }
          ]
        }
      );
    case 'event_heavy':
      return {
        ...withDevWallet(base, 300, now),
        nextRandomEventAt: now,
        nextRouteEncounterAt: now,
        ui: { ...base.ui, toast: 'Dev preset: event-heavy route.' }
      };
    case 'prestige_ready':
      return {
        ...withDevWallet(applyDistanceAndWb(base, 24902), 15000, now),
        ui: { ...base.ui, toast: 'Dev preset: prestige ready.' }
      };
    case 'moon':
      return setWorld(
        {
          ...base,
          prestige: {
            earthPrestigeCount: 1,
            journeyTokens: 0,
            totalJourneyTokensEarned: 1,
            upgrades: {
              better_shoes: 1,
              ledger_sense: 1,
              moon_map: 1
            },
            permanentSpeedBonus: 0.05,
            permanentWbBonus: 0.05,
            followerStabilityBonus: 0,
            offlineCapBonus: 0,
            moonAccelerationBonus: 0.15,
            lastPrestigedAt: now
          },
          worlds: {
            ...base.worlds,
            moon: { ...base.worlds.moon, unlockedAt: now }
          },
          walkerBucksBridge: withDevWallet(base, 16000, now).walkerBucksBridge
        },
        'moon',
        850
      );
    case 'mars':
      return setWorld(
        {
          ...base,
          prestige: {
            earthPrestigeCount: 1,
            journeyTokens: 0,
            totalJourneyTokensEarned: 1,
            upgrades: {
              better_shoes: 1,
              ledger_sense: 1,
              moon_map: 1
            },
            permanentSpeedBonus: 0.05,
            permanentWbBonus: 0.05,
            followerStabilityBonus: 0,
            offlineCapBonus: 0,
            moonAccelerationBonus: 0.15,
            lastPrestigedAt: now
          },
          worlds: {
            ...base.worlds,
            moon: { ...base.worlds.moon, distanceMiles: 7000, loopsCompleted: 1, unlockedAt: now },
            mars: { ...base.worlds.mars, unlockedAt: now }
          },
          walkerBucksBridge: withDevWallet(base, 24000, now).walkerBucksBridge
        },
        'mars',
        80
      );
    case 'bridge_disabled':
      return {
        ...base,
        account: { ...base.account, status: 'disabled' },
        walkerBucksBridge: { ...base.walkerBucksBridge, status: 'unavailable' },
        ui: { ...base.ui, toast: 'Dev preset: bridge disabled.' }
      };
  }
};
