import { formatDistance } from '../game/distance';
import {
  EARTH_REGIONS,
  getCurrentRegion,
  getNextRegion,
  getRegionEffectSummary,
  getUnlockedRegions
} from '../game/regions';
import type { GameState } from '../game/types';

type RegionPanelProps = {
  state: GameState;
};

export const RegionPanel = ({ state }: RegionPanelProps) => {
  const current = getCurrentRegion(state);
  const next = getNextRegion(state);
  const unlockedIds = new Set(getUnlockedRegions(state).map((region) => region.id));

  return (
    <section className="collection-panel region-panel" aria-label="Regions">
      <div className="section-head">
        <h4>Regions</h4>
        <span>
          {unlockedIds.size}/{EARTH_REGIONS.length} reached
        </span>
      </div>

      <article className="panel shop-card region-current-card">
        <div className="card-row">
          <h4>{current.name}</h4>
          <span className="pill">Current</span>
        </div>
        <p>{current.description}</p>
        <p className="muted">{getRegionEffectSummary(current)}</p>
        {next && <p className="muted">Next: {next.name} at {formatDistance(next.unlockDistanceMiles)}</p>}
      </article>

      <div className="region-grid">
        {EARTH_REGIONS.map((region) => {
          const unlocked = unlockedIds.has(region.id);
          return (
            <article key={region.id} className={`panel region-card ${current.id === region.id ? 'active' : ''}`}>
              <div className="card-row">
                <h4>{region.shortName}</h4>
                <span className="pill">{unlocked ? 'Reached' : formatDistance(region.unlockDistanceMiles)}</span>
              </div>
              <p>{region.name}</p>
              <p className="muted">{getRegionEffectSummary(region)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
