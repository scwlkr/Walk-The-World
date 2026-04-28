import type { GameState } from '../game/types';

type LeaderboardPanelProps = {
  state: GameState;
  isBridgeConfigured: boolean;
  isSignedIn: boolean;
  isBusy: boolean;
  onRefreshLeaderboard: () => void;
};

const formatDateTime = (timestamp: number | null): string => {
  if (!timestamp) return 'never';
  return new Date(timestamp).toLocaleString();
};

const getStatusLabel = (state: GameState, isBridgeConfigured: boolean, isSignedIn: boolean): string => {
  if (!isBridgeConfigured) return 'Unavailable';
  if (!isSignedIn) return 'Sign in required';
  if (state.walkerBucksBridge.status === 'checking') return 'Checking';
  if (state.walkerBucksBridge.status === 'error') return 'Needs retry';
  return state.walkerBucksBridge.leaderboard ? 'Loaded' : 'Ready';
};

export const LeaderboardPanel = ({
  state,
  isBridgeConfigured,
  isSignedIn,
  isBusy,
  onRefreshLeaderboard
}: LeaderboardPanelProps) => {
  const leaderboard = state.walkerBucksBridge.leaderboard;
  const canUseBridge = isBridgeConfigured && isSignedIn && !isBusy;

  return (
    <section className="collection-panel" aria-label="WalkerBucks leaderboard">
      <div className="section-head">
        <h4>Leaderboard</h4>
        <span>{getStatusLabel(state, isBridgeConfigured, isSignedIn)}</span>
      </div>

      <article className="panel shop-card">
        <div className="card-row">
          <h4>Shared WB Balance</h4>
          <span className="pill">{leaderboard ? `${leaderboard.entries.length} rows` : 'Not loaded'}</span>
        </div>
        <p className="muted">Server-owned WalkerBucks balances only. Local guest WB is excluded.</p>
        <p className="muted">Last checked: {formatDateTime(leaderboard?.updatedAt ?? null)}</p>
        {state.walkerBucksBridge.lastError && <p className="muted">Last error: {state.walkerBucksBridge.lastError}</p>}
        <button type="button" className="mini-btn" disabled={!canUseBridge} onClick={onRefreshLeaderboard}>
          {isBusy ? 'Checking' : 'Refresh leaderboard'}
        </button>
      </article>

      {leaderboard && (
        <div className="leaderboard-list">
          {leaderboard.entries.length === 0 && <p className="muted">No shared WalkerBucks leaders yet.</p>}
          {leaderboard.entries.map((entry) => (
            <article
              key={`${entry.rank}-${entry.accountId}`}
              className={`panel leaderboard-row ${entry.isCurrentAccount ? 'is-current' : ''}`}
            >
              <strong>#{entry.rank}</strong>
              <span>{entry.isCurrentAccount ? 'You' : entry.accountId}</span>
              <b>{entry.balance.toLocaleString()} WB</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
