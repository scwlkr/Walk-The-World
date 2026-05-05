import { useEffect, useMemo, useState } from 'react';
import { DEV_NEW_USER_ACCOUNT, DEV_PLAYER_ACCOUNT } from '../devtools/devAccounts';
import type { DevFailureMode } from '../devtools/devFailureMode';
import type { DevShopItem } from '../devtools/devActions';

type DevSnapshotResult = {
  ok: boolean;
  action: string;
  accountId: string;
  snapshot: Record<string, unknown>;
  failureMode: DevFailureMode;
  shopItems: DevShopItem[];
  error?: string;
};

const apiGet = async (path: string): Promise<DevSnapshotResult> => {
  const response = await fetch(path);
  const body = (await response.json()) as DevSnapshotResult;
  if (!response.ok || body.ok === false) throw new Error(body.error ?? `Dev API failed: ${response.status}`);
  return body;
};

const apiPost = async (path: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok || body.ok === false) throw new Error(String(body.error ?? `Dev API failed: ${response.status}`));
  return body;
};

type DevButton = {
  label: string;
  run: () => Promise<unknown>;
};

export const DevSuitePage = () => {
  const [accountId, setAccountId] = useState<string>(DEV_PLAYER_ACCOUNT.accountId);
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [shopItems, setShopItems] = useState<DevShopItem[]>([]);
  const [selectedItem, setSelectedItem] = useState('starter-shoes');
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (surface?: 'wallet' | 'inventory') => {
    const result = await apiGet(
      `/api/dev/snapshot?accountId=${encodeURIComponent(accountId)}&route=/dev&isMobile=${
        window.innerWidth < 720 ? 'true' : 'false'
      }${surface ? `&surface=${surface}` : ''}`
    );
    setSnapshot(result.snapshot);
    setShopItems(result.shopItems);
    return result;
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const result = (await action()) as Record<string, unknown>;
      setLastResult(result);
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void runAction(() => refresh());
  }, [accountId]);

  const accountControls: DevButton[] = useMemo(
    () => [
      {
        label: 'Load Dev Walker',
        run: async () => {
          setAccountId(DEV_PLAYER_ACCOUNT.accountId);
          return refresh();
        }
      },
      {
        label: 'Reset Dev Walker',
        run: () => apiPost('/api/dev/reset-account')
      },
      {
        label: 'Load Brand-New User',
        run: async () => {
          setAccountId(DEV_NEW_USER_ACCOUNT.accountId);
          return refresh();
        }
      },
      {
        label: 'Reset Brand-New User',
        run: () => apiPost('/api/dev/reset-new-user')
      },
      {
        label: 'Copy Debug Snapshot',
        run: async () => {
          const result = await refresh();
          await navigator.clipboard.writeText(JSON.stringify(result.snapshot, null, 2));
          return { ok: true, action: 'dev:copy-snapshot', accountId };
        }
      },
      {
        label: 'Run Smoke Test',
        run: async () => {
          await apiPost('/api/dev/reset-account');
          await apiPost('/api/dev/set-wb', { accountId: DEV_PLAYER_ACCOUNT.accountId, amount: 10000 });
          return apiPost('/api/dev/buy-item', { accountId: DEV_PLAYER_ACCOUNT.accountId, item: 'starter-shoes' });
        }
      },
      {
        label: 'Run New-User Smoke Test',
        run: async () => {
          await apiPost('/api/dev/reset-new-user');
          await apiPost('/api/dev/start-onboarding', { accountId: DEV_NEW_USER_ACCOUNT.accountId });
          await apiPost('/api/dev/complete-onboarding-step', { accountId: DEV_NEW_USER_ACCOUNT.accountId });
          await apiPost('/api/dev/grant-starter-pack', { accountId: DEV_NEW_USER_ACCOUNT.accountId });
          return apiPost('/api/dev/simulate-first-purchase', { accountId: DEV_NEW_USER_ACCOUNT.accountId });
        }
      }
    ],
    [accountId]
  );

  const walletControls: DevButton[] = [
    { label: 'Grant +100 WB', run: () => apiPost('/api/dev/grant-wb', { accountId, amount: 100 }) },
    { label: 'Grant +1,000 WB', run: () => apiPost('/api/dev/grant-wb', { accountId, amount: 1000 }) },
    { label: 'Grant +100,000 WB', run: () => apiPost('/api/dev/grant-wb', { accountId, amount: 100000 }) },
    { label: 'Take -100 WB', run: () => apiPost('/api/dev/take-wb', { accountId, amount: 100 }) },
    { label: 'Take -1,000 WB', run: () => apiPost('/api/dev/take-wb', { accountId, amount: 1000 }) },
    { label: 'Set WB to 0', run: () => apiPost('/api/dev/set-wb', { accountId, amount: 0 }) },
    { label: 'Set WB to 1,000', run: () => apiPost('/api/dev/set-wb', { accountId, amount: 1000 }) },
    { label: 'Set WB to 10,000', run: () => apiPost('/api/dev/set-wb', { accountId, amount: 10000 }) },
    { label: 'Force Wallet Refresh', run: () => refresh('wallet') }
  ];

  const gameplayControls: DevButton[] = [
    { label: 'Reset DT', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'reset-dt' }) },
    { label: 'Set DT', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'set-dt', amount: 1000 }) },
    { label: 'Set DPS', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'set-dps', amount: 0.01 }) },
    { label: 'Set Tap Power', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'set-tap-power', amount: 0.02 }) },
    { label: 'Simulate Offline Progress', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'simulate-offline-progress', amount: 1 }) },
    { label: 'Clear Offline Progress', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'clear-offline-progress' }) },
    { label: 'Force Gameplay Refresh', run: () => refresh() }
  ];

  const shopControls: DevButton[] = [
    { label: 'Seed Shop', run: () => apiPost('/api/dev/seed-shop') },
    { label: 'Unlock All Shop Items', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'unlock-all-shop-items' }) },
    { label: 'Buy Selected Item', run: () => apiPost('/api/dev/buy-item', { accountId, item: selectedItem }) },
    { label: 'Refund Last Purchase', run: () => apiPost('/api/dev/refund-last-purchase', { accountId }) },
    { label: 'Clear Inventory', run: () => apiPost('/api/dev/gameplay', { accountId, action: 'clear-inventory' }) },
    { label: 'Force Inventory Refresh', run: () => refresh('inventory') }
  ];

  const onboardingControls: DevButton[] = [
    { label: 'Start Onboarding', run: () => apiPost('/api/dev/start-onboarding', { accountId }) },
    { label: 'Complete Current Onboarding Step', run: () => apiPost('/api/dev/complete-onboarding-step', { accountId }) },
    { label: 'Skip Onboarding', run: () => apiPost('/api/dev/skip-onboarding', { accountId }) },
    { label: 'Replay Onboarding', run: () => apiPost('/api/dev/replay-onboarding', { accountId }) },
    { label: 'Clear Tutorial Flags', run: () => apiPost('/api/dev/clear-tutorial-flags', { accountId }) },
    { label: 'Grant Starter Pack', run: () => apiPost('/api/dev/grant-starter-pack', { accountId }) },
    { label: 'Simulate First Purchase', run: () => apiPost('/api/dev/simulate-first-purchase', { accountId }) },
    { label: 'Simulate First Offline Return', run: () => apiPost('/api/dev/simulate-first-offline-return', { accountId }) },
    { label: 'Simulate First WB Sync', run: () => apiPost('/api/dev/simulate-first-wb-sync', { accountId }) }
  ];

  const failureControls: DevButton[] = [
    { label: 'API Latency: 0ms', run: () => apiPost('/api/dev/failure-mode', { latencyMs: 0 }) },
    { label: 'API Latency: 250ms', run: () => apiPost('/api/dev/failure-mode', { latencyMs: 250 }) },
    { label: 'API Latency: 1000ms', run: () => apiPost('/api/dev/failure-mode', { latencyMs: 1000 }) },
    { label: 'API Latency: 5000ms', run: () => apiPost('/api/dev/failure-mode', { latencyMs: 5000 }) },
    { label: 'Force Next Purchase Failure', run: () => apiPost('/api/dev/failure-mode', { nextPurchaseFails: true }) },
    { label: 'Force Next Wallet Refresh Failure', run: () => apiPost('/api/dev/failure-mode', { nextWalletRefreshFails: true }) },
    { label: 'Force Next Inventory Refresh Failure', run: () => apiPost('/api/dev/failure-mode', { nextInventoryRefreshFails: true }) },
    { label: 'Force Duplicate Purchase Request', run: () => apiPost('/api/dev/failure-mode', { duplicateNextPurchase: true }) },
    { label: 'Clear Failure Mode', run: () => apiPost('/api/dev/failure-mode', { clear: true }) }
  ];

  const renderGroup = (title: string, controls: DevButton[]) => (
    <section className="dev-suite-section">
      <h2>{title}</h2>
      <div className="dev-suite-grid">
        {controls.map((control) => (
          <button key={control.label} type="button" disabled={busy} onClick={() => void runAction(control.run)}>
            {control.label}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <main className="dev-suite-page">
      <header className="dev-suite-header">
        <h1>WTW Dev Suite</h1>
        <span>{accountId}</span>
      </header>

      {renderGroup('Account Controls', accountControls)}
      {renderGroup('Wallet Controls', walletControls)}
      {renderGroup('Gameplay Controls', gameplayControls)}

      <section className="dev-suite-section">
        <h2>Shop / Inventory Controls</h2>
        <label className="dev-suite-select">
          <span>Selected item</span>
          <select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
            {shopItems.map((item) => (
              <option key={item.commandId} value={item.commandId}>
                {item.commandId}
              </option>
            ))}
          </select>
        </label>
        <div className="dev-suite-grid">
          {shopControls.map((control) => (
            <button key={control.label} type="button" disabled={busy} onClick={() => void runAction(control.run)}>
              {control.label}
            </button>
          ))}
        </div>
      </section>

      {renderGroup('Onboarding Controls', onboardingControls)}
      {renderGroup('Failure Simulation Controls', failureControls)}

      <section className="dev-suite-section dev-suite-snapshot">
        <h2>Current Snapshot</h2>
        {error && <pre className="dev-suite-error">{error}</pre>}
        <pre>{JSON.stringify(snapshot ?? lastResult ?? { ok: false, status: 'loading' }, null, 2)}</pre>
      </section>
    </main>
  );
};
