import type { GameState } from '../game/types';
import { getCurrentWorldLoopDistance, getIdleMilesPerSecond } from '../game/formulas';
import { getCurrentWorldDefinition } from '../game/world';

type TopStatsBarProps = { state: GameState };

export const TopStatsBar = ({ state }: TopStatsBarProps) => {
  const currentLoopDistance = getCurrentWorldLoopDistance(state);
  const currentWorld = getCurrentWorldDefinition(state);
  return (
    <header className="panel top-stats">
      <div>
        <p className="label">WB</p>
        <strong>{Math.floor(state.walkerBucks).toLocaleString()}</strong>
      </div>
      <div>
        <p className="label">Distance</p>
        <strong>
          {currentLoopDistance.toFixed(1)} / {currentWorld.loopDistanceMiles.toLocaleString()} mi
        </strong>
      </div>
      <div>
        <p className="label">Speed</p>
        <strong>{getIdleMilesPerSecond(state).toFixed(3)} mi/sec</strong>
      </div>
    </header>
  );
};
