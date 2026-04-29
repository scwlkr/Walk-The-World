import { EARTH_LOOP_REWARD_WB, MOON_LOOP_REWARD_WB } from './constants';
import { getWbPerMile } from './formulas';
import type { GameState } from './types';
import { getWorldDefinition, getWorldProgress } from './world';

export const applyDistanceAndWb = (state: GameState, distanceDelta: number): GameState => {
  if (distanceDelta <= 0) return state;

  const wbGainRaw = distanceDelta * getWbPerMile(state) + state.wbBankedRemainder;
  const wbGain = Math.floor(wbGainRaw);
  const wbRemainder = wbGainRaw - wbGain;

  const currentWorld = getWorldDefinition(state.currentWorldId);
  const currentProgress = getWorldProgress(state);
  const prevLoops = Math.floor(currentProgress.distanceMiles / currentWorld.loopDistanceMiles);
  const nextDistance = currentProgress.distanceMiles + distanceDelta;
  const nextLoops = Math.floor(nextDistance / currentWorld.loopDistanceMiles);
  const loopsCompletedNow = Math.max(0, nextLoops - prevLoops);

  const loopReward = state.currentWorldId === 'moon' ? MOON_LOOP_REWARD_WB : EARTH_LOOP_REWARD_WB;
  const loopBonus = loopsCompletedNow * loopReward;
  const nextWorlds = {
    ...state.worlds,
    [state.currentWorldId]: {
      ...currentProgress,
      distanceMiles: nextDistance,
      loopsCompleted: currentProgress.loopsCompleted + loopsCompletedNow
    }
  };

  return {
    ...state,
    distanceMiles: nextDistance,
    worlds: nextWorlds,
    walkerBucks: state.walkerBucks + wbGain + loopBonus,
    totalWalkerBucksEarned: state.totalWalkerBucksEarned + wbGain + loopBonus,
    earthLoopsCompleted:
      state.currentWorldId === 'earth' ? state.earthLoopsCompleted + loopsCompletedNow : state.earthLoopsCompleted,
    wbBankedRemainder: wbRemainder,
    stats: {
      ...state.stats,
      totalDistanceWalked: state.stats.totalDistanceWalked + distanceDelta
    },
    ui: {
      ...state.ui,
      moonTeaseUnlocked: state.ui.moonTeaseUnlocked || (state.currentWorldId === 'earth' && loopsCompletedNow > 0)
    }
  };
};
