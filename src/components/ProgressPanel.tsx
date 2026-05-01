import type { GameState, WorldId } from '../game/types';
import {
  calculateDistanceToNextLandmark,
  getCurrentLandmark,
  getCurrentWorldLoopDistance,
  getCurrentWorldProgressPercent,
  getNextLandmark
} from '../game/formulas';
import { formatDistance } from '../game/distance';
import {
  WORLD_IDS,
  WORLDS,
  canEnterWorld,
  canPrestigeEarth,
  getCurrentWorldDefinition,
  getEarthPrestigeRequirementSummary,
  getWorldProgress,
  getWorldUnlockSummary
} from '../game/world';

type ProgressPanelProps = {
  state: GameState;
  onPrestigeEarth: () => void;
  onSelectWorld: (worldId: WorldId) => void;
  showAdvancedWorlds?: boolean;
};

export const ProgressPanel = ({ state, onPrestigeEarth, onSelectWorld, showAdvancedWorlds = false }: ProgressPanelProps) => {
  const currentWorld = getCurrentWorldDefinition(state);
  const currentProgress = getWorldProgress(state);
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const currentDistance = getCurrentWorldLoopDistance(state);
  const progressPercent = getCurrentWorldProgressPercent(state);
  const milesToNext = calculateDistanceToNextLandmark(state);
  const prestigeReady = canPrestigeEarth(state);

  return (
    <section className="panel progress-panel">
      <div className="section-head">
        <h4>Distance Progress</h4>
        <span>{progressPercent.toFixed(2)}%</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <p>{currentWorld.description}</p>
      <p>Distance Traveled: {formatDistance(currentDistance)}</p>
      <p>Now passing: {current.name}</p>
      <p>Next: {next.name + (next.name === current.name ? '' : ` in ${formatDistance(milesToNext)}`)}</p>
      <p>
        Loop {currentProgress.loopsCompleted} of {formatDistance(currentWorld.loopDistanceMiles)} routes.
      </p>

      {showAdvancedWorlds && (
        <>
          <div className="prestige-card">
            <div>
              <strong>Earth Prestige {state.prestige.earthPrestigeCount}</strong>
              <p>{getEarthPrestigeRequirementSummary(state)}</p>
              <p>
                Permanent bonus: +{Math.round(state.prestige.permanentSpeedBonus * 100)}% speed, +{Math.round(state.prestige.permanentWbBonus * 100)}% WB/mi.
              </p>
              <p>Moon acceleration: +{Math.round(state.prestige.moonAccelerationBonus * 100)}% while walking on Moon.</p>
            </div>
            <button type="button" className="mini-btn" onClick={onPrestigeEarth} disabled={!prestigeReady}>
              Prestige Earth
            </button>
          </div>

          <div className="world-grid" aria-label="World routes">
            {WORLD_IDS.map((worldId) => {
              const world = WORLDS[worldId];
              const worldProgress = getWorldProgress(state, worldId);
              const enterable = canEnterWorld(state, worldId);
              const selected = state.currentWorldId === worldId;

              return (
                <button
                  key={world.id}
                  type="button"
                  className={`world-card ${selected ? 'active' : ''}`}
                  onClick={() => onSelectWorld(worldId)}
                  disabled={!enterable || selected}
                >
                  <span>{world.shortName}</span>
                  <strong>{enterable ? `${worldProgress.loopsCompleted} loops` : world.status === 'future' ? 'Future' : 'Locked'}</strong>
                  <small>{getWorldUnlockSummary(state, worldId)}</small>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
