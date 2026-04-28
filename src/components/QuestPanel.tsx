import {
  getActiveQuestDefinitions,
  getQuestCompletionSummary,
  getQuestProgressText,
  getQuestRewardSummary
} from '../game/quests';
import { getActiveSeasonalEventForState } from '../game/seasonalEvents';
import type { CSSProperties } from 'react';
import type { GameState, QuestDefinition } from '../game/types';

type QuestPanelProps = {
  state: GameState;
  onClaim: (quest: QuestDefinition) => void;
};

export const QuestPanel = ({ state, onClaim }: QuestPanelProps) => {
  const quests = getActiveQuestDefinitions(state);
  const summary = getQuestCompletionSummary(state);
  const activeEvent = getActiveSeasonalEventForState(state);

  return (
    <section className="quest-panel" aria-label="Daily quests">
      <div className="section-head">
        <h4>Daily Quests</h4>
        <span>
          {summary.completed}/{summary.total} complete
        </span>
      </div>

      {activeEvent && (
        <article className="panel event-card" style={{ '--event-accent': activeEvent.visualTreatment.accentColor } as CSSProperties}>
          <div className="card-row">
            <h4>{activeEvent.shortName}</h4>
            <span className="pill">Seasonal</span>
          </div>
          <p>{activeEvent.description}</p>
          <p className="muted">Rewards are local-only until the WalkerBucks bridge exists.</p>
        </article>
      )}

      <div className="shop-list">
        {quests.map((quest) => {
          const progress = state.quests.progress[quest.id] ?? {
            progress: 0,
            completedAt: null,
            claimedAt: null
          };
          const complete = Boolean(progress.completedAt);
          const claimed = Boolean(progress.claimedAt);
          const progressPercent = Math.min(100, (progress.progress / quest.progress.target) * 100);

          return (
            <article key={quest.id} className={`panel shop-card quest-card ${complete ? 'is-complete' : ''}`}>
              <div className="card-row">
                <h4>{quest.name}</h4>
                <span className="pill">{claimed ? 'Claimed' : complete ? 'Ready' : quest.category}</span>
              </div>
              <p>{quest.description}</p>
              <div className="mini-progress" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="muted">Progress: {getQuestProgressText(quest, progress)}</p>
              <p className="muted">Reward: {getQuestRewardSummary(quest.reward)}</p>
              <p className="muted">Local-only reward</p>
              <button type="button" className="mini-btn" disabled={!complete || claimed} onClick={() => onClaim(quest)}>
                {claimed ? 'Claimed' : complete ? 'Claim reward' : 'In progress'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
