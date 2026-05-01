import type { GameState } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getClickMiles,
  getCurrentWorldLoopDistance,
  getCurrentWorldProgressPercent,
  getCurrentLandmark,
  getIdleMilesPerSecond,
  getNextLandmark,
  getOfflineCapSeconds
} from '../game/formulas';
import { formatDistance, formatDistanceRate } from '../game/distance';
import { getSpendableWalkerBucks } from '../game/economy';
import { getFollowerMoraleLabel, getTotalFollowerCount } from '../game/followers';
import { getCurrentRegion, getNextRegion, getRegionEffectSummary } from '../game/regions';
import { getActiveSeasonalEventForState, getSeasonalEventById } from '../game/seasonalEvents';
import { getCurrentWorldDefinition, getWorldProgress } from '../game/world';
import type { CSSProperties } from 'react';
import { getJourneyMilestones, getMilestoneProgressText } from '../game/milestones';

type GameHUDProps = {
  state: GameState;
  seasonalEventOverrideId?: string | null;
  realtimeMilesPerSecond?: number;
};

export const GameHUD = ({ state, seasonalEventOverrideId, realtimeMilesPerSecond }: GameHUDProps) => {
  const currentWorld = getCurrentWorldDefinition(state);
  const currentLoopDistance = getCurrentWorldLoopDistance(state);
  const speed = realtimeMilesPerSecond ?? getIdleMilesPerSecond(state);
  const clickDistance = getClickMiles(state);
  const worldPercent = getCurrentWorldProgressPercent(state);
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const milesToNext = calculateDistanceToNextLandmark(state);
  const worldProgress = getWorldProgress(state);
  const activeEvent = getSeasonalEventById(seasonalEventOverrideId) ?? getActiveSeasonalEventForState(state);
  const journeyMilestones = getJourneyMilestones(state, 2);
  const activeBoosts = state.activeBoosts.filter((boost) => boost.expiresAt > Date.now()).slice(0, 3);
  const walletBalance = getSpendableWalkerBucks(state);
  const followerCount = getTotalFollowerCount(state);
  const moraleLabel = getFollowerMoraleLabel(state.followerMorale.value);
  const region = getCurrentRegion(state);
  const nextRegion = getNextRegion(state);
  const routeDistance = Math.max(0, next.distanceMiles - current.distanceMiles);
  const routeWalked = Math.max(0, currentLoopDistance - current.distanceMiles);
  const routePercent = routeDistance > 0 ? Math.min(100, (routeWalked / routeDistance) * 100) : 100;
  const routeRemainingLabel = next.name !== current.name ? `${formatDistance(milesToNext)} remaining` : 'Route complete';
  const routeLabel =
    activeEvent?.visualTreatment.bannerLabel.replace(' active', '').replace('route', 'Route') ?? 'v0.3 Route';
  const offlineHours = Math.floor(getOfflineCapSeconds(state) / 3600);
  const comboLabel = state.activePlay.tapCombo > 1 ? ` · Combo x${state.activePlay.tapCombo}` : '';
  const journeyTokens = state.prestige?.journeyTokens ?? 0;
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
    <header className="game-hud" aria-label="Game HUD">
      <section
        className="hud-strip hud-travel-panel"
        style={{ '--event-accent': activeEvent?.visualTreatment.accentColor ?? '#facc15' } as CSSProperties}
      >
        <div className="hud-meter-row" aria-label="Wallet, distance, and speed">
          <span className="hud-stat-card">
            <span className="hud-stat-label">WB</span>
            <strong>
              <span aria-hidden="true">⭐</span>
              {walletBalance.toLocaleString()}
            </strong>
          </span>
          <span className="hud-stat-card">
            <span className="hud-stat-label">DT</span>
            <strong>
              <span aria-hidden="true">🚶</span>
              {formatDistance(currentLoopDistance)}
            </strong>
          </span>
          <span className="hud-stat-card">
            <span className="hud-stat-label">DPS</span>
            <strong>
              <span aria-hidden="true">⚡</span>
              {formatDistanceRate(speed)}
            </strong>
          </span>
        </div>

        <div className="hud-detail-row">
          <span>DPT</span>
          <strong>{formatDistance(clickDistance)}</strong>
        </div>

        <div className="hud-route-line">
          <strong>
            {current.name} → {next.name}
          </strong>
          <span>{routeRemainingLabel}</span>
        </div>

        <div className="hud-progress-track" aria-label={`${routePercent.toFixed(0)} percent of current route complete`}>
          <span className="hud-progress-fill" style={{ width: `${routePercent}%` }} />
          <span className="hud-route-marker" style={{ left: `${routePercent}%` }} />
        </div>

        <div className="hud-sub-row" aria-label="World, route, crew, and offline cap">
          <span>
            <span aria-hidden="true">🌎</span>
            {currentWorld.shortName} {worldPercent.toFixed(2)}%
          </span>
          <span>
            <span aria-hidden="true">🌿</span>
            {routeLabel}
          </span>
          <span>
            <span aria-hidden="true">🙂</span>
            Crew {followerCount.toLocaleString()} {followerCount > 0 ? moraleLabel : 'Solo'}
          </span>
          <span>
            <span aria-hidden="true">⏱️</span>
            Offline {offlineHours}h
          </span>
        </div>

        <div className="hud-journey-row">
          <span>
            Region: {region.shortName} <b>{getRegionEffectSummary(region)}</b>
          </span>
          {nextRegion && (
            <span>
              Next: {nextRegion.shortName} <b>{formatDistance(Math.max(0, nextRegion.unlockDistanceMiles - currentLoopDistance))}</b>
            </span>
          )}
          <span>Loop {worldProgress.loopsCompleted}{comboLabel}</span>
          <span>JT {journeyTokens.toLocaleString()}</span>
          {focusedMilestone && focusedMilestoneProgress && (
            <span className={focusedMilestoneProgress.completedAt && !focusedMilestoneProgress.claimedAt ? 'is-ready' : ''}>
              {focusedMilestoneProgress.completedAt && !focusedMilestoneProgress.claimedAt ? 'Ready' : focusedMilestone.actionHint}:{' '}
              {focusedMilestone.name} <b>{getMilestoneProgressText(focusedMilestone, focusedMilestoneProgress)}</b>
            </span>
          )}
        </div>

        {activeBoosts.length > 0 && (
          <div className="hud-boost-row">
            {activeBoosts.map((boost) => (
              <span key={boost.id}>
                {boost.effectType.replace(/_/g, ' ')} {Math.max(0, Math.ceil((boost.expiresAt - Date.now()) / 1000))}s
              </span>
            ))}
          </div>
        )}
      </section>
    </header>
  );
};
