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
      </section>
    </header>
  );
};
