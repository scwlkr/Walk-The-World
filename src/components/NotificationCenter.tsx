import { useEffect, useState } from 'react';
import type { GameState, RouteEncounterChoice } from '../game/types';
import { RandomEventOverlay } from './RandomEventOverlay';
import { RouteEncounterOverlay } from './RouteEncounterOverlay';

const MAX_VISIBLE_TOASTS = 2;
const RECENT_REWARD_TOAST_MS = 4000;

type NotificationCenterProps = {
  state: GameState;
  onClaimEvent: () => void;
  onChooseRouteEncounter: (choice: RouteEncounterChoice) => void;
  onDismissOfflineSummary: () => void;
};

export const NotificationCenter = ({
  state,
  onClaimEvent,
  onChooseRouteEncounter,
  onDismissOfflineSummary
}: NotificationCenterProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.ui.recentRewards.length === 0) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [state.ui.recentRewards.length]);

  const largeNotification = state.spawnedRouteEncounter ? (
    <RouteEncounterOverlay spawnedEncounter={state.spawnedRouteEncounter} onChoose={onChooseRouteEncounter} />
  ) : state.spawnedEvent ? (
    <RandomEventOverlay spawnedEvent={state.spawnedEvent} onClaim={onClaimEvent} />
  ) : state.ui.offlineSummary ? (
    <aside className="panel notification-card notification-card-large offline-banner">
      You walked {state.ui.offlineSummary.distance.toFixed(2)} mi and earned{' '}
      {Math.floor(state.ui.offlineSummary.wb).toLocaleString()} WB while away.
      <button type="button" className="mini-btn" onClick={onDismissOfflineSummary}>
        Nice
      </button>
    </aside>
  ) : null;

  const recentRewardToasts = state.ui.recentRewards
    .filter((reward) => now - reward.createdAt < RECENT_REWARD_TOAST_MS)
    .map((reward) => ({ id: reward.id, label: reward.label }));

  const toastMessages = [
    ...(state.ui.toast ? [{ id: `toast_${state.ui.toast}`, label: state.ui.toast }] : []),
    ...recentRewardToasts
  ].slice(0, MAX_VISIBLE_TOASTS);

  if (!largeNotification && toastMessages.length === 0) return null;

  return (
    <section className="notification-zone" aria-label="Notifications" aria-live="polite">
      {largeNotification && <div className="notification-large-slot">{largeNotification}</div>}

      {toastMessages.length > 0 && (
        <div className="notification-toast-stack">
          {toastMessages.map((toast) => (
            <aside key={toast.id} className="panel notification-card notification-toast">
              {toast.label}
            </aside>
          ))}
        </div>
      )}
    </section>
  );
};
