import type { GameState } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getCurrentLandmark,
  getEarthProgressPercent,
  getIdleMilesPerSecond,
  getNextLandmark
} from '../game/formulas';

type GameHUDProps = {
  state: GameState;
};

export const GameHUD = ({ state }: GameHUDProps) => {
  const currentLoopDistance = state.distanceMiles % 24901;
  const speed = getIdleMilesPerSecond(state);
  const earthPercent = getEarthProgressPercent(state);
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const milesToNext = calculateDistanceToNextLandmark(state);

  return (
    <header className="game-hud" aria-label="Game HUD">
      <div className="hud-panel hud-top-row">
        <strong>WB {Math.floor(state.walkerBucks).toLocaleString()}</strong>
        <strong>{currentLoopDistance.toFixed(1)} mi</strong>
        <strong>{speed.toFixed(3)} mi/s</strong>
      </div>

      <div className="hud-panel hud-progress-wrap">
        <div className="hud-progress-head">
          <span>Earth {earthPercent.toFixed(2)}%</span>
          <span>Loop {state.earthLoopsCompleted}</span>
        </div>
        <div className="hud-progress-track">
          <div className="hud-progress-fill" style={{ width: `${earthPercent}%` }} />
        </div>
        <p className="hud-landmark">
          {current.name} → {next.name}
          {next.name !== current.name ? ` · ${milesToNext.toFixed(1)} mi` : ''}
        </p>
      </div>
    </header>
  );
};
