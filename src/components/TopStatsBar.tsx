import type { GameState } from '../game/types';
import { getIdleMilesPerSecond } from '../game/formulas';

type TopStatsBarProps = { state: GameState };

export const TopStatsBar = ({ state }: TopStatsBarProps) => {
  const currentLoopDistance = state.distanceMiles % 24901;
  return (
    <header className="panel top-stats">
      <div>
        <p className="label">WB</p>
        <strong>{Math.floor(state.walkerBucks).toLocaleString()}</strong>
      </div>
      <div>
        <p className="label">Distance</p>
        <strong>
          {currentLoopDistance.toFixed(1)} / 24,901 mi
        </strong>
      </div>
      <div>
        <p className="label">Speed</p>
        <strong>{getIdleMilesPerSecond(state).toFixed(3)} mi/sec</strong>
      </div>
    </header>
  );
};
