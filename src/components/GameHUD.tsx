import type { GameState } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getCurrentWorldLoopDistance,
  getCurrentWorldProgressPercent,
  getCurrentLandmark,
  getIdleMilesPerSecond,
  getNextLandmark
} from '../game/formulas';
import { getQuestCompletionSummary } from '../game/quests';
import { getActiveSeasonalEventForState } from '../game/seasonalEvents';
import { getCurrentWorldDefinition, getWorldProgress } from '../game/world';
import type { CSSProperties } from 'react';

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
  const questSummary = getQuestCompletionSummary(state);
  const activeEvent = getActiveSeasonalEventForState(state);
  const routeDistance = Math.max(0, next.distanceMiles - current.distanceMiles);
  const routeWalked = Math.max(0, currentLoopDistance - current.distanceMiles);
  const routePercent = routeDistance > 0 ? Math.min(100, (routeWalked / routeDistance) * 100) : 100;
  const routeRemainingLabel = next.name !== current.name ? `${milesToNext.toFixed(1)} mi remaining` : 'Route complete';
  const seasonalLabel =
    activeEvent?.visualTreatment.bannerLabel.replace(' active', '').replace('route', 'Route') ?? 'Local Route';

  return (
    <header className="game-hud" aria-label="Game HUD">
      <section
        className="hud-strip hud-travel-panel"
        style={{ '--event-accent': activeEvent?.visualTreatment.accentColor ?? '#facc15' } as CSSProperties}
      >
        <div className="hud-meter-row" aria-label="Wallet, distance, and speed">
          <span>
            WB <strong>{Math.floor(state.walkerBucks).toLocaleString()}</strong>
          </span>
          <span>
            <strong>{currentLoopDistance.toFixed(1)}</strong> mi
          </span>
          <span>
            <strong>{speed.toFixed(3)}</strong> mi/s
          </span>
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

        <div className="hud-sub-row">
          <span>
            {currentWorld.shortName} {worldPercent.toFixed(2)}%
            {' · '}Loop {worldProgress.loopsCompleted}
          </span>
          <span>
            {seasonalLabel}
            {' · '}
            Quests {questSummary.completed}/{questSummary.total}
          </span>
        </div>
      </section>
    </header>
  );
};
