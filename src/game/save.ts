import { SAVE_KEY, SAVE_VERSION } from './constants';
import { evaluateAchievements, markDailyPlay } from './achievements';
import { createInitialGameState } from './initialState';
import type { GameState } from './types';

type SavePayload = GameState;

const canUseLocalStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadGameState = (): GameState => {
  if (!canUseLocalStorage()) {
    return prepareLoadedState(createInitialGameState());
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return prepareLoadedState(createInitialGameState());

    const parsed = JSON.parse(raw) as Partial<SavePayload>;
    if (parsed.saveVersion !== SAVE_VERSION) {
      return prepareLoadedState(migrateSave(parsed));
    }

    return prepareLoadedState(mergeGameState(parsed));
  } catch {
    return prepareLoadedState(createInitialGameState());
  }
};

const prepareLoadedState = (state: GameState): GameState => evaluateAchievements(markDailyPlay(state));

const mergeGameState = (rawSave: Partial<SavePayload>): GameState => {
  const base = createInitialGameState();
  return {
    ...base,
    ...rawSave,
    settings: {
      ...base.settings,
      ...rawSave.settings
    },
    stats: {
      ...base.stats,
      ...rawSave.stats
    },
    achievements: {
      ...base.achievements,
      ...rawSave.achievements
    },
    inventory: {
      ...base.inventory,
      ...rawSave.inventory,
      items: {
        ...base.inventory.items,
        ...rawSave.inventory?.items
      },
      usedConsumables: {
        ...base.inventory.usedConsumables,
        ...rawSave.inventory?.usedConsumables
      }
    },
    cosmetics: {
      ...base.cosmetics,
      ...rawSave.cosmetics,
      owned: {
        ...base.cosmetics.owned,
        ...rawSave.cosmetics?.owned
      },
      equippedBySlot: {
        ...base.cosmetics.equippedBySlot,
        ...rawSave.cosmetics?.equippedBySlot
      }
    },
    dailyPlay: {
      ...base.dailyPlay,
      ...rawSave.dailyPlay
    },
    ui: {
      ...base.ui,
      ...rawSave.ui
    },
    saveVersion: SAVE_VERSION
  } as GameState;
};

const migrateSave = (rawSave: Partial<SavePayload>): GameState => mergeGameState(rawSave);

export const saveGameState = (state: GameState): void => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...state,
        lastSavedAt: Date.now()
      })
    );
  } catch {
    // ignore write failures
  }
};

export const resetGameState = (): GameState => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(SAVE_KEY);
  }
  return prepareLoadedState(createInitialGameState());
};

export const exportSave = (state: GameState): string => JSON.stringify(state, null, 2);

export const importSave = (raw: string): GameState => {
  const parsed = JSON.parse(raw) as Partial<GameState>;
  return prepareLoadedState(migrateSave(parsed));
};
