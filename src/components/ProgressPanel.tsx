import type { GameState } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getCurrentLandmark,
  getEarthProgressPercent,
  getNextLandmark
} from '../game/formulas';

type ProgressPanelProps = { state: GameState };

export const ProgressPanel = ({ state }: ProgressPanelProps) => {
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const progressPercent = getEarthProgressPercent(state);
  const milesToNext = calculateDistanceToNextLandmark(state);

  return (
    <section className="panel progress-panel">
      <div className="progress-row">
        <span>Earth Loop: {progressPercent.toFixed(2)}%</span>
        <span>Loops: {state.earthLoopsCompleted}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <p>Now passing: {current.name}</p>
      <p>Next: {next.name + (next.name === current.name ? '' : ` in ${milesToNext.toFixed(1)} mi`)}</p>
      {state.ui.moonTeaseUnlocked && <p className="tease">🌕 Moonwalk Mode unlocked soon.</p>}
    </section>
  );
};
