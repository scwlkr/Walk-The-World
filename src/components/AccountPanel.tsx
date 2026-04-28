import { useMemo, useState } from 'react';
import type { AuthSession } from '../services/authClient';
import type { CloudSaveSnapshot } from '../services/cloudSaveClient';

export type AccountBusyState = 'idle' | 'checking' | 'authenticating' | 'uploading' | 'loading' | 'signing-out';

type AccountPanelProps = {
  isConfigured: boolean;
  isReady: boolean;
  session: AuthSession | null;
  cloudSave: CloudSaveSnapshot | null;
  busy: AccountBusyState;
  message: string | null;
  localLastSavedAt: number;
  localSaveVersion: number;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onRefreshCloud: () => Promise<void>;
  onUploadLocal: () => Promise<void>;
  onLoadCloud: () => Promise<void>;
};

const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return 'None';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const getCloudComparison = (
  localLastSavedAt: number,
  localSaveVersion: number,
  cloudSave: CloudSaveSnapshot | null
): string => {
  if (!cloudSave) return 'No cloud save';
  if (cloudSave.updatedAt > localLastSavedAt + 1000) return 'Cloud newer';
  if (localLastSavedAt > cloudSave.updatedAt + 1000) return 'Local newer';
  if (cloudSave.saveVersion > localSaveVersion) return 'Cloud newer';
  if (localSaveVersion > cloudSave.saveVersion) return 'Local newer';
  return 'Same timestamp';
};

export const AccountPanel = ({
  isConfigured,
  isReady,
  session,
  cloudSave,
  busy,
  message,
  localLastSavedAt,
  localSaveVersion,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn,
  onSignOut,
  onRefreshCloud,
  onUploadLocal,
  onLoadCloud
}: AccountPanelProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isBusy = busy !== 'idle';
  const canSubmitEmail = email.trim().length > 0 && password.length >= 6 && !isBusy;
  const cloudComparison = useMemo(
    () => getCloudComparison(localLastSavedAt, localSaveVersion, cloudSave),
    [cloudSave, localLastSavedAt, localSaveVersion]
  );

  const submitEmail = (action: 'sign-in' | 'sign-up') => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) return;
    if (action === 'sign-in') {
      void onEmailSignIn(trimmedEmail, password);
    } else {
      void onEmailSignUp(trimmedEmail, password);
    }
  };

  return (
    <section className="account-panel panel">
      <div className="section-head">
        <h4>Account</h4>
        <span>{isConfigured ? 'Supabase' : 'Guest only'}</span>
      </div>

      {!isConfigured && (
        <div className="account-card">
          <p className="muted">Guest play is active. Add Supabase env vars to enable account sync.</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
      )}

      {isConfigured && !isReady && <p className="muted">Checking account...</p>}

      {isConfigured && isReady && !session && (
        <form className="account-card" onSubmit={(event) => event.preventDefault()}>
          <label className="settings-field">
            <span>Email</span>
            <input
              className="text-control"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label className="settings-field">
            <span>Password</span>
            <input
              className="text-control"
              type="password"
              value={password}
              minLength={6}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
          </label>
          <div className="account-actions">
            <button type="button" className="mini-btn" disabled={!canSubmitEmail} onClick={() => submitEmail('sign-in')}>
              Sign In
            </button>
            <button type="button" className="mini-btn" disabled={!canSubmitEmail} onClick={() => submitEmail('sign-up')}>
              Create Account
            </button>
            <button type="button" className="mini-btn" disabled={isBusy} onClick={() => void onGoogleSignIn()}>
              Google
            </button>
          </div>
        </form>
      )}

      {isConfigured && isReady && session && (
        <div className="account-card">
          <div className="account-status-grid">
            <span>Email</span>
            <strong>{session.user.email ?? 'Signed in'}</strong>
            <span>Local save</span>
            <strong>{formatTimestamp(localLastSavedAt)}</strong>
            <span>Cloud save</span>
            <strong>{formatTimestamp(cloudSave?.updatedAt ?? null)}</strong>
            <span>Status</span>
            <strong>{cloudComparison}</strong>
            <span>Save version</span>
            <strong>v{localSaveVersion}</strong>
          </div>
          <div className="account-actions">
            <button type="button" className="mini-btn" disabled={isBusy} onClick={() => void onRefreshCloud()}>
              Refresh
            </button>
            <button type="button" className="mini-btn" disabled={isBusy} onClick={() => void onUploadLocal()}>
              Upload Local
            </button>
            <button type="button" className="mini-btn" disabled={isBusy || !cloudSave} onClick={() => void onLoadCloud()}>
              Load Cloud
            </button>
            <button type="button" className="mini-btn" disabled={isBusy} onClick={() => void onSignOut()}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {message && <p className="muted account-message">{message}</p>}
    </section>
  );
};
