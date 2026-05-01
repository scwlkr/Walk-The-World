import {
  COLLECTION_GOALS,
  getCollectionGoalProgress,
  getCollectionSummary,
  getProfileTitleById,
  getUnlockedProfileTitles
} from '../game/collections';
import type { GameState } from '../game/types';

type CollectionGoalsPanelProps = {
  state: GameState;
  onSelectTitle: (titleId: string | null) => void;
};

export const CollectionGoalsPanel = ({ state, onSelectTitle }: CollectionGoalsPanelProps) => {
  const summary = getCollectionSummary(state);
  const unlockedTitles = getUnlockedProfileTitles(state);
  const activeTitle = getProfileTitleById(state.profile.activeTitleId);

  return (
    <section className="collection-panel collection-depth-panel" aria-label="Collection goals and titles">
      <div className="section-head">
        <h4>Collection Goals</h4>
        <span>
          {summary.ownedItems}/{summary.totalItems} items
        </span>
      </div>

      <div className="collection-summary-grid">
        <span>
          <b>{summary.rareItems}</b>
          Rare+
        </span>
        <span>
          <b>{summary.cosmeticsOwned}</b>
          Cosmetics
        </span>
        <span>
          <b>{summary.titlesUnlocked}</b>
          Titles
        </span>
      </div>

      <div className="shop-list">
        {COLLECTION_GOALS.map((goal) => {
          const progress = getCollectionGoalProgress(state, goal);
          const percent = Math.min(100, (progress.progress / goal.target) * 100);
          const title = getProfileTitleById(goal.titleId);

          return (
            <article key={goal.id} className={`panel shop-card collection-goal-card ${progress.completed ? 'is-complete' : ''}`}>
              <div className="card-row">
                <h4>{goal.name}</h4>
                <span className="pill">{progress.completed ? 'Complete' : `${progress.progress}/${goal.target}`}</span>
              </div>
              <p>{goal.description}</p>
              <div className="mini-progress" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p className="muted">Title: {title?.name ?? goal.titleId.replace(/_/g, ' ')}</p>
            </article>
          );
        })}
      </div>

      <section className="collection-panel title-panel" aria-label="Titles">
        <div className="section-head">
          <h4>Titles</h4>
          <span>{activeTitle?.name ?? 'No title'}</span>
        </div>

        {unlockedTitles.length === 0 ? (
          <p className="coming-soon">No titles unlocked yet.</p>
        ) : (
          <div className="title-grid">
            {unlockedTitles.map((title) => {
              const active = state.profile.activeTitleId === title.id;
              return (
                <button
                  key={title.id}
                  type="button"
                  className={`title-card ${active ? 'active' : ''}`}
                  disabled={active}
                  onClick={() => onSelectTitle(title.id)}
                >
                  <strong>{title.name}</strong>
                  <span>{title.rarity}</span>
                  <small>{title.description}</small>
                </button>
              );
            })}
          </div>
        )}

        {state.profile.activeTitleId && (
          <button type="button" className="mini-btn" onClick={() => onSelectTitle(null)}>
            Clear title
          </button>
        )}
      </section>
    </section>
  );
};
