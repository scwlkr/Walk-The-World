import type { GameState } from '../game/types';
import { getSpendableWalkerBucks } from '../game/economy';
import { formatDistance, formatDistanceRate } from '../game/distance';
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
        <strong>{getSpendableWalkerBucks(state).toLocaleString()}</strong>
      </div>
      <div>
        <p className="label">Distance</p>
        <strong>
          {formatDistance(currentLoopDistance)} / {formatDistance(currentWorld.loopDistanceMiles)}
        </strong>
      </div>
      <div>
        <p className="label">DPS</p>
        <strong>{formatDistanceRate(getIdleMilesPerSecond(state))}</strong>
      </div>
    </header>
  );
};
