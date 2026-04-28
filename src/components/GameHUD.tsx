import type { GameState } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getCurrentWorldLoopDistance,
  getCurrentWorldProgressPercent,
  getCurrentLandmark,
  getIdleMilesPerSecond,
  getNextLandmark
} from '../game/formulas';
import { getCurrentWorldDefinition, getWorldProgress } from '../game/world';

type GameHUDProps = {
  state: GameState;
};

export const GameHUD = ({ state }: GameHUDProps) => {
  const currentWorld = getCurrentWorldDefinition(state);
  const currentLoopDistance = getCurrentWorldLoopDistance(state);
  const speed = getIdleMilesPerSecond(state);
  const worldPercent = getCurrentWorldProgressPercent(state);
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const milesToNext = calculateDistanceToNextLandmark(state);
  const worldProgress = getWorldProgress(state);

  return (
    <header className="game-hud" aria-label="Game HUD">
      <section className="hud-strip hud-main-strip">
        <div className="hud-chip">
          <small>WB</small>
          <strong>{Math.floor(state.walkerBucks).toLocaleString()}</strong>
        </div>
        <div className="hud-chip">
          <small>Distance</small>
          <strong>{currentLoopDistance.toFixed(1)} mi</strong>
        </div>
        <div className="hud-chip">
          <small>Speed</small>
          <strong>{speed.toFixed(3)} mi/s</strong>
        </div>
      </section>

      <section className="hud-strip hud-route-strip">
        <div className="hud-progress-head">
          <span>
            {currentWorld.shortName} {worldPercent.toFixed(2)}%
          </span>
          <span>Loop {worldProgress.loopsCompleted}</span>
        </div>
        <div className="hud-progress-track">
          <div className="hud-progress-fill" style={{ width: `${worldPercent}%` }} />
        </div>
        <p className="hud-landmark">
          {current.name} → {next.name}
          {next.name !== current.name ? ` · ${milesToNext.toFixed(1)} mi` : ''}
        </p>
      </section>
    </header>
  );
};
