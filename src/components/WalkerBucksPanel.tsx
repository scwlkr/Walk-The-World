import type { GameState, WalkerBucksRewardGrant } from '../game/types';

type WalkerBucksPanelProps = {
  state: GameState;
  isBridgeConfigured: boolean;
  isSignedIn: boolean;
  isBusy: boolean;
  onRefreshBalance: () => void;
  onRetryGrant: (grant: WalkerBucksRewardGrant) => void;
};

const formatDateTime = (timestamp: number | null): string => {
  if (!timestamp) return 'never';
  return new Date(timestamp).toLocaleString();
};

const getBridgeLabel = (state: GameState, isBridgeConfigured: boolean, isSignedIn: boolean): string => {
  if (!isBridgeConfigured) return 'Unavailable';
  if (!isSignedIn) return 'Sign in required';
  if (state.walkerBucksBridge.status === 'checking') return 'Checking';
  if (state.walkerBucksBridge.status === 'error') return 'Needs retry';
  return 'Ready';
};

export const WalkerBucksPanel = ({
  state,
  isBridgeConfigured,
  isSignedIn,
  isBusy,
  onRefreshBalance,
  onRetryGrant
}: WalkerBucksPanelProps) => {
  const balance = state.walkerBucksBridge.balance;
  const grants = Object.values(state.walkerBucksBridge.rewardGrants).sort((a, b) => b.updatedAt - a.updatedAt);
  const canUseBridge = isBridgeConfigured && isSignedIn && !isBusy;

  return (
    <section className="collection-panel" aria-label="WalkerBucks bridge">
      <div className="section-head">
        <h4>WalkerBucks</h4>
        <span>{getBridgeLabel(state, isBridgeConfigured, isSignedIn)}</span>
      </div>

      <article className="panel shop-card">
        <div className="card-row">
          <h4>Shared Balance</h4>
          <span className="pill">{balance ? `${balance.availableBalance.toLocaleString()} WB` : 'Not loaded'}</span>
        </div>
        <p className="muted">
          Account: {state.walkerBucksBridge.accountId ?? 'none'} · Last checked:{' '}
          {formatDateTime(state.walkerBucksBridge.lastCheckedAt)}
        </p>
        {state.walkerBucksBridge.lastError && <p className="muted">Last error: {state.walkerBucksBridge.lastError}</p>}
        <button type="button" className="mini-btn" disabled={!canUseBridge} onClick={onRefreshBalance}>
          {isBusy ? 'Checking' : 'Refresh balance'}
        </button>
      </article>

      {grants.length > 0 && (
        <div className="shop-list">
          {grants.map((grant) => (
            <article key={grant.id} className="panel shop-card">
              <div className="card-row">
                <h4>{grant.label}</h4>
                <span className="pill">{grant.status}</span>
              </div>
              <p className="muted">
                {grant.amount.toLocaleString()} shared WB · Attempts {grant.attempts}
              </p>
              <p className="muted">Idempotency: {grant.idempotencyKey}</p>
              {grant.transactionId && <p className="muted">Transaction: {grant.transactionId}</p>}
              {grant.lastError && <p className="muted">Last error: {grant.lastError}</p>}
              <button
                type="button"
                className="mini-btn"
                disabled={!canUseBridge || grant.status === 'pending'}
                onClick={() => onRetryGrant(grant)}
              >
                {grant.status === 'granted' ? 'Granted' : grant.status === 'pending' ? 'Pending' : 'Retry grant'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
