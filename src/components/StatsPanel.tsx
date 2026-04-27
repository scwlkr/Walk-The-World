import type { GameState } from '../game/types';
import {
  getClickMiles,
  getCurrentLandmark,
  getEarthProgressPercent,
  getIdleMilesPerSecond,
  getNextLandmark,
  getOfflineCapSeconds,
  getWbPerMile
} from '../game/formulas';

type StatsPanelProps = { state: GameState };

export const StatsPanel = ({ state }: StatsPanelProps) => (
  <section className="stats-panel">
    <ul>
      <li>Current speed: {getIdleMilesPerSecond(state).toFixed(4)} mi/sec</li>
      <li>Click distance: {getClickMiles(state).toFixed(4)} mi</li>
      <li>WB per mile: {getWbPerMile(state).toFixed(2)}</li>
      <li>Total distance walked: {state.stats.totalDistanceWalked.toFixed(2)} mi</li>
      <li>Total WB earned: {Math.floor(state.totalWalkerBucksEarned).toLocaleString()}</li>
      <li>Earth loop percent: {getEarthProgressPercent(state).toFixed(2)}%</li>
      <li>Earth loops completed: {state.earthLoopsCompleted}</li>
      <li>Current landmark: {getCurrentLandmark(state).name}</li>
      <li>Next landmark: {getNextLandmark(state).name}</li>
      <li>Offline cap: {Math.floor(getOfflineCapSeconds(state) / 60)} minutes</li>
      <li>Total clicks/taps: {state.stats.totalClicks}</li>
      <li>Random events claimed: {state.stats.randomEventsClaimed}</li>
    </ul>
  </section>
);
