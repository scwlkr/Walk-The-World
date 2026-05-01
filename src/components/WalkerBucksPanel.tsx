import { useState, type FormEvent } from 'react';
import { getWtwWalletState } from '../game/economy';
import type { GameState, WalkerBucksRewardGrant } from '../game/types';

type WalkerBucksPanelProps = {
  state: GameState;
  isBridgeConfigured: boolean;
  isSignedIn: boolean;
  isBusy: boolean;
  onRefreshBalance: () => void;
  onCompleteBankLink: (linkCode: string) => Promise<void>;
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
  onCompleteBankLink,
  onRetryGrant
}: WalkerBucksPanelProps) => {
  const [bankLinkCode, setBankLinkCode] = useState('');
  const [bankLinkMessage, setBankLinkMessage] = useState<string | null>(null);
  const balance = state.walkerBucksBridge.balance;
  const wallet = getWtwWalletState(state);
  const grants = Object.values(state.walkerBucksBridge.rewardGrants).sort((a, b) => b.updatedAt - a.updatedAt);
  const spends = Object.values(state.walkerBucksBridge.spends).sort((a, b) => b.updatedAt - a.updatedAt);
  const pendingGrantAmount = Math.floor(state.walkerBucksBridge.pendingGrantAmount);
  const legacyLocalBalance = Math.floor(state.walkerBucks);
  const canUseBridge = isBridgeConfigured && isSignedIn && !isBusy;
  const normalizedBankLinkCode = bankLinkCode.trim().toUpperCase();

  const submitBankLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedBankLinkCode || !canUseBridge) return;

    setBankLinkMessage(null);
    try {
      await onCompleteBankLink(normalizedBankLinkCode);
      setBankLinkCode('');
      setBankLinkMessage('WalkerBucks Bank linked.');
    } catch (error) {
      setBankLinkMessage(error instanceof Error ? error.message : 'WalkerBucks Bank link failed.');
    }
  };

  return (
    <section className="collection-panel" aria-label="WalkerBucks bridge">
      <div className="section-head">
        <h4>WalkerBucks</h4>
        <span>{getBridgeLabel(state, isBridgeConfigured, isSignedIn)}</span>
      </div>

      <article className="panel shop-card">
        <div className="card-row">
          <h4>Shared Balance</h4>
          <span className="pill">{balance ? `${wallet.displayedWbBalance.toLocaleString()} WB` : 'Not loaded'}</span>
        </div>
        <p className="muted">
          Account: {state.walkerBucksBridge.accountId ?? 'none'} · Last checked:{' '}
          {formatDateTime(state.walkerBucksBridge.lastCheckedAt)}
        </p>
        {pendingGrantAmount > 0 && (
          <p className="muted">{pendingGrantAmount.toLocaleString()} WB earned in WTW is waiting for WalkerBucks sync.</p>
        )}
        {legacyLocalBalance > 0 && (
          <p className="muted">{legacyLocalBalance.toLocaleString()} legacy WTW WB will migrate to WalkerBucks after sign-in.</p>
        )}
        {state.walkerBucksBridge.lastError && <p className="muted">Last error: {state.walkerBucksBridge.lastError}</p>}
        <button type="button" className="mini-btn" disabled={!canUseBridge} onClick={onRefreshBalance}>
          {isBusy ? 'Checking' : 'Refresh balance'}
        </button>
      </article>

      <article className="panel shop-card">
        <div className="card-row">
          <h4>Bank Link</h4>
          <span className="pill">WTW</span>
        </div>
        <form className="account-card" onSubmit={(event) => void submitBankLink(event)}>
          <label className="settings-field">
            <span>Link Code</span>
            <input
              className="text-control"
              value={bankLinkCode}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="LINK-0000"
              onChange={(event) => setBankLinkCode(event.currentTarget.value)}
            />
          </label>
          <button type="submit" className="mini-btn" disabled={!canUseBridge || !normalizedBankLinkCode}>
            {isBusy ? 'Linking' : 'Link Bank'}
          </button>
        </form>
        <p className="muted">Generate a WTW code in WalkerBucks Bank. Codes expire in 15 minutes.</p>
        {bankLinkMessage && <p className="muted">{bankLinkMessage}</p>}
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
                {grant.amount.toLocaleString()} ledger WB · Attempts {grant.attempts}
              </p>
              <p className="muted">Idempotency: {grant.idempotencyKey}</p>
              {grant.transactionId && <p className="muted">Transaction: {grant.transactionId}</p>}
              {grant.lastError && <p className="muted">Last error: {grant.lastError}</p>}
              <button
                type="button"
                className="mini-btn"
                disabled={!canUseBridge || grant.status !== 'failed'}
                onClick={() => onRetryGrant(grant)}
              >
                {grant.status === 'granted' ? 'Granted' : grant.status === 'pending' ? 'Pending' : 'Retry grant'}
              </button>
            </article>
          ))}
        </div>
      )}

      {spends.length > 0 && (
        <div className="shop-list">
          {spends.slice(0, 5).map((spend) => (
            <article key={spend.id} className="panel shop-card">
              <div className="card-row">
                <h4>{spend.label}</h4>
                <span className="pill">{spend.status}</span>
              </div>
              <p className="muted">
                {spend.amount.toLocaleString()} WB ledger spend · Attempts {spend.attempts}
              </p>
              {spend.transactionId && <p className="muted">Transaction: {spend.transactionId}</p>}
              {spend.lastError && <p className="muted">Last error: {spend.lastError}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
