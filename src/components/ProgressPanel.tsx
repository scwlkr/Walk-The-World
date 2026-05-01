import type { GameState, JourneyUpgradeDefinition, WorldId } from '../game/types';
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
  JOURNEY_UPGRADES,
  canEnterWorld,
  canPrestigeEarth,
  getJourneyResetTokenReward,
  getJourneyUpgradeCost,
  getJourneyUpgradeLevel,
  getCurrentWorldDefinition,
  getEarthPrestigeRequirementSummary,
  getWorldProgress,
  getWorldUnlockSummary
} from '../game/world';

type ProgressPanelProps = {
  state: GameState;
  onPrestigeEarth: () => void;
  onBuyJourneyUpgrade: (upgrade: JourneyUpgradeDefinition) => void;
  onSelectWorld: (worldId: WorldId) => void;
  showAdvancedWorlds?: boolean;
};

const getJourneyUpgradeEffectText = (upgrade: JourneyUpgradeDefinition): string => {
  const percent = Math.round(upgrade.effectValue * 100);
  switch (upgrade.effectType) {
    case 'permanent_speed_bonus':
      return `+${percent}% distance power per level`;
    case 'permanent_wb_bonus':
      return `+${percent}% WB earned per mile per level`;
    case 'follower_stability_bonus':
      return `-${percent}% follower leave pressure per level`;
    case 'offline_cap_bonus':
      return `+${percent}% offline cap per level`;
    case 'moon_acceleration_bonus':
      return `+${percent}% Moon distance power per level`;
    case 'route_memory':
      return 'New journeys start at Leave the Couch';
  }
};

export const ProgressPanel = ({
  state,
  onPrestigeEarth,
  onBuyJourneyUpgrade,
  onSelectWorld,
  showAdvancedWorlds = false
}: ProgressPanelProps) => {
  const currentWorld = getCurrentWorldDefinition(state);
  const currentProgress = getWorldProgress(state);
  const current = getCurrentLandmark(state);
  const next = getNextLandmark(state);
  const currentDistance = getCurrentWorldLoopDistance(state);
  const progressPercent = getCurrentWorldProgressPercent(state);
  const milesToNext = calculateDistanceToNextLandmark(state);
  const prestigeReady = canPrestigeEarth(state);
  const tokenReward = getJourneyResetTokenReward(state);
  const visibleWorldIds = WORLD_IDS.filter((worldId) => worldId === 'earth' || worldId === 'moon');

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

      <>
        <div className="prestige-card">
          <div>
            <strong>Journey Reset {state.prestige.earthPrestigeCount}</strong>
            <p>{getEarthPrestigeRequirementSummary(state)}</p>
            <p>
              Journey Tokens: {state.prestige.journeyTokens.toLocaleString()} available,{' '}
              {state.prestige.totalJourneyTokensEarned.toLocaleString()} earned.
            </p>
            <p>
              Permanent bonus: +{Math.round(state.prestige.permanentSpeedBonus * 100)}% distance, +{Math.round(state.prestige.permanentWbBonus * 100)}% WB/mi, +{Math.round(state.prestige.offlineCapBonus * 100)}% offline cap.
            </p>
          </div>
          <button type="button" className="mini-btn" onClick={onPrestigeEarth} disabled={!prestigeReady}>
            {prestigeReady ? `Reset for ${tokenReward.toLocaleString()} JT` : 'Journey locked'}
          </button>
        </div>

        <section className="collection-panel" aria-label="Journey upgrade shop">
          <div className="section-head">
            <h4>Journey Upgrades</h4>
            <span>{state.prestige.journeyTokens.toLocaleString()} JT</span>
          </div>
          <div className="shop-list">
            {JOURNEY_UPGRADES.map((upgrade) => {
              const level = getJourneyUpgradeLevel(state, upgrade.id);
              const maxed = level >= upgrade.maxLevel;
              const cost = getJourneyUpgradeCost(upgrade, level);
              const affordable = state.prestige.journeyTokens >= cost;
              const progressPercent = (level / upgrade.maxLevel) * 100;

              return (
                <article key={upgrade.id} className={`panel shop-card journey-upgrade-card ${maxed ? 'is-maxed' : ''}`}>
                  <div className="card-row">
                    <h4>{upgrade.name}</h4>
                    <span className="pill">
                      {level}/{upgrade.maxLevel}
                    </span>
                  </div>
                  <p>{upgrade.description}</p>
                  <div className="mini-progress" aria-hidden="true">
                    <span style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="muted">{getJourneyUpgradeEffectText(upgrade)}</p>
                  <button
                    type="button"
                    className="mini-btn"
                    disabled={maxed || !affordable}
                    onClick={() => onBuyJourneyUpgrade(upgrade)}
                  >
                    {maxed ? 'Maxed' : affordable ? `Spend ${cost.toLocaleString()} JT` : `Need ${cost.toLocaleString()} JT`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <div className="world-grid" aria-label="World routes">
          {visibleWorldIds.map((worldId) => {
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

        {showAdvancedWorlds && (
          <div className="world-grid" aria-label="Prototype world routes">
            {WORLD_IDS.filter((worldId) => worldId !== 'earth' && worldId !== 'moon').map((worldId) => {
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
        )}
      </>
    </section>
  );
};
