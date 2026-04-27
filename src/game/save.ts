import { SAVE_KEY, SAVE_VERSION } from './constants';
import { createInitialGameState } from './initialState';
import type { GameState } from './types';

type SavePayload = GameState;

const canUseLocalStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadGameState = (): GameState => {
  if (!canUseLocalStorage()) {
    return createInitialGameState();
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState();

    const parsed = JSON.parse(raw) as Partial<SavePayload>;
    if (parsed.saveVersion !== SAVE_VERSION) {
      return migrateSave(parsed);
    }

    return { ...createInitialGameState(), ...parsed } as GameState;
  } catch {
    return createInitialGameState();
  }
};

const migrateSave = (rawSave: Partial<SavePayload>): GameState => {
  const base = createInitialGameState();
  return {
    ...base,
    ...rawSave,
    saveVersion: SAVE_VERSION
  } as GameState;
};

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
  return createInitialGameState();
};

export const exportSave = (state: GameState): string => JSON.stringify(state, null, 2);

export const importSave = (raw: string): GameState => {
  const parsed = JSON.parse(raw) as Partial<GameState>;
  return migrateSave(parsed);
};
