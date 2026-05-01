import type { GameState } from '../game/types';
import { formatDistance, formatDistanceRate } from '../game/distance';
import {
  getClickMiles,
  getCurrentLandmark,
  getIdleMilesPerSecond,
  getNextLandmark,
  getOfflineCapSeconds,
  getWbPerMile
} from '../game/formulas';

type StatsPanelProps = { state: GameState };

export const StatsPanel = ({ state }: StatsPanelProps) => (
  <section className="stats-panel">
    <ul>
      <li>Distance Traveled: {formatDistance(state.stats.totalDistanceWalked)}</li>
      <li>DPS: {formatDistanceRate(getIdleMilesPerSecond(state))}</li>
      <li>DPT: {formatDistance(getClickMiles(state))}</li>
      <li>WB per mile queued: {getWbPerMile(state).toFixed(2)}</li>
      <li>WalkerBucks queued for bridge sync: {Math.floor(state.walkerBucksBridge.pendingGrantAmount).toLocaleString()}</li>
      <li>Total WB earned or queued: {Math.floor(state.totalWalkerBucksEarned).toLocaleString()}</li>
      <li>Offline cap: {Math.floor(getOfflineCapSeconds(state) / 3600)} hours</li>
      <li>Total taps: {state.stats.totalClicks}</li>
      <li>Generator/tap upgrades purchased: {state.stats.upgradesPurchased}</li>
      <li>Milestones claimed: {state.stats.milestonesClaimed}</li>
      <li>Current place: {getCurrentLandmark(state).name}</li>
      <li>Next place: {getNextLandmark(state).name}</li>
    </ul>
  </section>
);
