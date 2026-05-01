import type { ActivePlayState, GameState } from './types';

const COMBO_WINDOW_MS = 900;

export const createInitialActivePlayState = (): ActivePlayState => ({
  tapCombo: 0,
  lastTapAt: null,
  bestTapCombo: 0,
  perfectSteps: 0
});

export const getActiveTapMultiplier = (state: GameState): number => {
  const combo = state.activePlay.tapCombo;
  if (combo >= 20) return 1.75;
  if (combo >= 10) return 1.35;
  if (combo >= 5) return 1.15;
  return 1;
};

export const applyActiveTap = (state: GameState, now = Date.now()): GameState => {
  const previous = state.activePlay ?? createInitialActivePlayState();
  const stillCombining = previous.lastTapAt !== null && now - previous.lastTapAt <= COMBO_WINDOW_MS;
  const tapCombo = stillCombining ? previous.tapCombo + 1 : 1;
  const perfectStep = tapCombo > 0 && tapCombo % 10 === 0;
  const perfectSteps = previous.perfectSteps + (perfectStep ? 1 : 0);

  return {
    ...state,
    activePlay: {
      tapCombo,
      lastTapAt: now,
      bestTapCombo: Math.max(previous.bestTapCombo, tapCombo),
      perfectSteps
    },
    stats: {
      ...state.stats,
      perfectSteps: state.stats.perfectSteps + (perfectStep ? 1 : 0)
    },
    ui: {
      ...state.ui,
      toast: perfectStep ? `Perfect step combo x${tapCombo}.` : state.ui.toast
    }
  };
};

export const decayActiveTapCombo = (state: GameState, now = Date.now()): GameState => {
  if (!state.activePlay.lastTapAt || state.activePlay.tapCombo === 0) return state;
  if (now - state.activePlay.lastTapAt <= COMBO_WINDOW_MS * 1.4) return state;

  return {
    ...state,
    activePlay: {
      ...state.activePlay,
      tapCombo: 0
    }
  };
};
