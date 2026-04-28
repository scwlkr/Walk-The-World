import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementProgressValue,
  getRewardSummary
} from '../game/achievements';
import type { AchievementDefinition, GameState } from '../game/types';

type AchievementsPanelProps = {
  state: GameState;
  onClaim: (achievement: AchievementDefinition) => void;
};

const formatProgress = (value: number, target: number): string => {
  if (target < 1) return `${value.toFixed(2)} / ${target.toFixed(2)}`;
  return `${Math.floor(value).toLocaleString()} / ${target.toLocaleString()}`;
};

export const AchievementsPanel = ({ state, onClaim }: AchievementsPanelProps) => (
  <section className="collection-panel" aria-label="Achievements">
    <div className="section-head">
      <h4>Achievements</h4>
      <span>{state.stats.achievementsClaimed} claimed</span>
    </div>

    <div className="shop-list">
      {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
        const progress = state.achievements[achievement.id];
        const currentProgress = progress?.progress ?? getAchievementProgressValue(state, achievement);
        const unlocked = Boolean(progress?.unlockedAt);
        const claimed = Boolean(progress?.claimedAt);
        const hidden = achievement.hidden && !unlocked;
        const progressPercent = Math.min(100, (currentProgress / achievement.condition.target) * 100);

        return (
          <article key={achievement.id} className={`panel shop-card achievement-card ${unlocked ? 'is-unlocked' : ''}`}>
            <div className="card-row">
              <h4>{hidden ? 'Hidden achievement' : achievement.name}</h4>
              <span className="pill">{claimed ? 'Claimed' : unlocked ? 'Unlocked' : 'Locked'}</span>
            </div>
            <p>{hidden ? 'Keep walking to reveal this one.' : achievement.description}</p>
            <div className="mini-progress" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="muted">Progress: {formatProgress(currentProgress, achievement.condition.target)}</p>
            {!hidden && <p className="muted">Reward: {getRewardSummary(achievement)}</p>}
            <button type="button" className="mini-btn" disabled={!unlocked || claimed} onClick={() => onClaim(achievement)}>
              {claimed ? 'Claimed' : unlocked ? 'Claim reward' : 'Locked'}
            </button>
          </article>
        );
      })}
    </div>
  </section>
);
