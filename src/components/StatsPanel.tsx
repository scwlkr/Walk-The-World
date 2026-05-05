import type { GameState } from '../game/types';
import { formatDistance, formatDistanceRate } from '../game/distance';
import {
  getCurrentWorldLoopDistance,
  getClickMiles,
  getCurrentLandmark,
  getIdleMilesPerSecond,
  getNextLandmark,
  getOfflineCapSeconds,
  getWbPerMile
} from '../game/formulas';
import { getJourneyMilestones, getMilestoneProgressText } from '../game/milestones';
import { getCurrentRegion, getNextRegion, getRegionEffectSummary } from '../game/regions';
import { getWorldProgress } from '../game/world';

type StatsPanelProps = { state: GameState };

export const StatsPanel = ({ state }: StatsPanelProps) => {
  const currentLoopDistance = getCurrentWorldLoopDistance(state);
  const region = getCurrentRegion(state);
  const nextRegion = getNextRegion(state);
  const worldProgress = getWorldProgress(state);
  const journeyMilestones = getJourneyMilestones(state, 2);
  const focusedMilestone = journeyMilestones.find((milestone) => {
    const progress = state.milestones.progress[milestone.id];
    return Boolean(progress?.completedAt && !progress.claimedAt);
  }) ?? journeyMilestones[0];
  const focusedMilestoneProgress = focusedMilestone
    ? state.milestones.progress[focusedMilestone.id] ?? {
        progress: 0,
        completedAt: null,
        claimedAt: null
      }
    : null;

  return (
    <section className="stats-panel">
      <ul>
        <li>Distance Traveled: {formatDistance(state.stats.totalDistanceWalked)}</li>
        <li>DPS: {formatDistanceRate(getIdleMilesPerSecond(state))}</li>
        <li>DPT: {formatDistance(getClickMiles(state))}</li>
        <li>WB earned per mile: {getWbPerMile(state).toFixed(2)}</li>
        <li>WalkerBucks waiting for sync: {Math.floor(state.walkerBucksBridge.pendingGrantAmount).toLocaleString()}</li>
        <li>Total WB earned: {Math.floor(state.totalWalkerBucksEarned).toLocaleString()}</li>
        <li>Offline cap: {Math.floor(getOfflineCapSeconds(state) / 3600)} hours</li>
        <li>Current region: {region.name} ({getRegionEffectSummary(region)})</li>
        {nextRegion && (
          <li>
            Next region: {nextRegion.name} in {formatDistance(Math.max(0, nextRegion.unlockDistanceMiles - currentLoopDistance))}
          </li>
        )}
        <li>Current world loop: {worldProgress.loopsCompleted.toLocaleString()}</li>
        <li>Tap combo: x{state.activePlay.tapCombo.toLocaleString()}</li>
        <li>Journey resets: {state.prestige.earthPrestigeCount}</li>
        <li>Journey Tokens: {state.prestige.journeyTokens.toLocaleString()}</li>
        <li>Permanent distance bonus: +{Math.round(state.prestige.permanentSpeedBonus * 100)}%</li>
        {focusedMilestone && focusedMilestoneProgress && (
          <li>
            Focus milestone: {focusedMilestone.name} ({getMilestoneProgressText(focusedMilestone, focusedMilestoneProgress)})
          </li>
        )}
        <li>Total taps: {state.stats.totalClicks}</li>
        <li>Generator/tap upgrades purchased: {state.stats.upgradesPurchased}</li>
        <li>Milestones claimed: {state.stats.milestonesClaimed}</li>
        <li>Current place: {getCurrentLandmark(state).name}</li>
        <li>Next place: {getNextLandmark(state).name}</li>
      </ul>
    </section>
  );
};
