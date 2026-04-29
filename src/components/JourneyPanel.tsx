import { claimMilestoneReward, getJourneyMilestones, getMilestoneProgressText } from '../game/milestones';
import type { GameState, MilestoneDefinition } from '../game/types';

type JourneyPanelProps = {
  state: GameState;
  onClaim: (milestone: MilestoneDefinition) => void;
};

export const JourneyPanel = ({ state, onClaim }: JourneyPanelProps) => {
  const milestones = getJourneyMilestones(state, 7);

  return (
    <section className="collection-panel" aria-label="Journey milestones">
      <div className="section-head">
        <h4>Journey</h4>
        <span>{state.stats.milestonesClaimed} claimed</span>
      </div>
      <div className="shop-list">
        {milestones.map((milestone) => {
          const progress = state.milestones.progress[milestone.id] ?? {
            progress: 0,
            completedAt: null,
            claimedAt: null
          };
          const ready = Boolean(progress.completedAt && !progress.claimedAt);
          const claimed = Boolean(progress.claimedAt);
          const progressPercent = Math.min(100, (progress.progress / milestone.condition.target) * 100);

          return (
            <article key={milestone.id} className={`panel shop-card milestone-card ${ready ? 'is-ready' : ''}`}>
              <div className="card-row">
                <h4>{milestone.name}</h4>
                <span className="pill">{claimed ? 'Claimed' : ready ? 'Ready' : 'Next'}</span>
              </div>
              <p>{milestone.description}</p>
              <div className="mini-progress" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="muted">{milestone.actionHint}</p>
              <p className="muted">Progress: {getMilestoneProgressText(milestone, progress)}</p>
              <button type="button" className="mini-btn" disabled={!ready || claimed} onClick={() => onClaim(milestone)}>
                {claimed ? 'Claimed' : ready ? 'Claim reward' : 'In progress'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export const claimJourneyMilestone = claimMilestoneReward;
