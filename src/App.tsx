import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomControls } from './components/BottomControls';
import { GameHUD } from './components/GameHUD';
import { GameOverlaySheet } from './components/GameOverlaySheet';
import { GameSceneCanvas } from './components/GameSceneCanvas';
import { RandomEventOverlay } from './components/RandomEventOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { ShopModal } from './components/ShopModal';
import { StatsPanel } from './components/StatsPanel';
import { LOGIC_TICK_RATE_MS } from './game/constants';
import { getClickMiles, calculateOfflineProgress } from './game/formulas';
import { RANDOM_EVENTS } from './game/randomEvents';
import { exportSave, importSave, loadGameState, resetGameState, saveGameState } from './game/save';
import { applyDistanceAndWb, clearToast, resolveRandomEvent, runGameTick, shouldAutoSave } from './game/tick';
import type { Follower, GameState, Upgrade } from './game/types';

const App = () => {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const lastFrameRef = useRef<number>(performance.now());

  useEffect(() => {
    const loaded = loadGameState();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - loaded.lastSavedAt) / 1000);
    const offline = calculateOfflineProgress(loaded, elapsedSeconds);

    if (offline.secondsApplied > 0) {
      const withOffline = applyDistanceAndWb(
        {
          ...loaded,
          walkerBucks: loaded.walkerBucks + offline.wb,
          totalWalkerBucksEarned: loaded.totalWalkerBucksEarned + offline.wb,
          ui: {
            ...loaded.ui,
            offlineSummary: {
              distance: offline.distance,
              wb: offline.wb
            }
          }
        },
        offline.distance
      );
      setState(withOffline);
    } else {
      setState(loaded);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const nowPerf = performance.now();
      const deltaSeconds = Math.min(0.5, (nowPerf - lastFrameRef.current) / 1000);
      lastFrameRef.current = nowPerf;
      const now = Date.now();

      setState((prev) => {
        let next = runGameTick(prev, deltaSeconds, now);
        if (shouldAutoSave(prev.lastSavedAt, now)) {
          next = { ...next, lastSavedAt: now };
          saveGameState(next);
        }
        return next;
      });
    };

    const interval = window.setInterval(tick, LOGIC_TICK_RATE_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onUnload = () => saveGameState(state);
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [state]);

  useEffect(() => {
    if (!state.ui.toast) return;
    const timer = window.setTimeout(() => setState((prev) => clearToast(prev)), 2500);
    return () => window.clearTimeout(timer);
  }, [state.ui.toast]);

  const canUnlock = useMemo(
    () =>
      (requirement?: {
        distanceMiles?: number;
        earthLoopsCompleted?: number;
        upgradeId?: string;
        upgradeLevel?: number;
      }) => {
        if (!requirement) return true;
        if (requirement.distanceMiles && state.distanceMiles < requirement.distanceMiles) return false;
        if (requirement.earthLoopsCompleted && state.earthLoopsCompleted < requirement.earthLoopsCompleted) return false;
        if (requirement.upgradeId && (state.upgrades[requirement.upgradeId] ?? 0) < (requirement.upgradeLevel ?? 1)) {
          return false;
        }
        return true;
      },
    [state]
  );

  const onWalk = () => {
    const distance = getClickMiles(state);
    setState((prev) => {
      const next = applyDistanceAndWb(
        {
          ...prev,
          stats: {
            ...prev.stats,
            totalClicks: prev.stats.totalClicks + 1
          }
        },
        distance
      );
      saveGameState(next);
      return next;
    });
  };

  const onBuyUpgrade = (upgrade: Upgrade) => {
    setState((prev) => {
      if (!canUnlock(upgrade.unlockRequirement)) return prev;
      const level = prev.upgrades[upgrade.id] ?? 0;
      if (level >= upgrade.maxLevel) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
      if (prev.walkerBucks < cost) return prev;

      const next: GameState = {
        ...prev,
        walkerBucks: prev.walkerBucks - cost,
        upgrades: {
          ...prev.upgrades,
          [upgrade.id]: level + 1
        }
      };
      saveGameState(next);
      return next;
    });
  };

  const onBuyFollower = (follower: Follower) => {
    setState((prev) => {
      if (!canUnlock(follower.unlockRequirement)) return prev;
      const count = prev.followers[follower.id] ?? 0;
      if (count >= follower.maxCount) return prev;
      const cost = Math.floor(follower.baseCost * Math.pow(follower.costMultiplier, count));
      if (prev.walkerBucks < cost) return prev;

      const next: GameState = {
        ...prev,
        walkerBucks: prev.walkerBucks - cost,
        followers: {
          ...prev.followers,
          [follower.id]: count + 1
        }
      };
      saveGameState(next);
      return next;
    });
  };

  const onClaimEvent = () => {
    setState((prev) => {
      if (!prev.spawnedEvent) return prev;
      const def = RANDOM_EVENTS.find((event) => event.id === prev.spawnedEvent?.eventDefId);
      if (!def) return { ...prev, spawnedEvent: null };
      const next = resolveRandomEvent(prev, def, Date.now());
      saveGameState(next);
      return next;
    });
  };

  const onReset = () => {
    if (!window.confirm('Reset your Walk The World save?')) return;
    const fresh = resetGameState();
    setState(fresh);
  };

  const onExport = () => {
    const raw = exportSave(state);
    navigator.clipboard.writeText(raw).catch(() => undefined);
    window.alert('Save copied to clipboard as JSON.');
  };

  const onImport = (raw: string) => {
    try {
      const imported = importSave(raw);
      setState(imported);
      saveGameState(imported);
    } catch {
      window.alert('Import failed. Check your JSON.');
    }
  };

  const closeOverlay = () => {
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        showShop: false,
        activeTab: 'walk'
      }
    }));
  };

  const openTab = (tab: GameState['ui']['activeTab']) => {
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeTab: tab,
        showShop: tab === 'shop'
      }
    }));
  };

  return (
    <div className="game-shell">
      <GameSceneCanvas state={state} onEventClaim={onClaimEvent} />
      <GameHUD state={state} />
      <RandomEventOverlay spawnedEvent={state.spawnedEvent} onClaim={onClaimEvent} />

      {state.ui.offlineSummary && (
        <aside className="panel offline-banner">
          You walked {state.ui.offlineSummary.distance.toFixed(2)} mi and earned{' '}
          {Math.floor(state.ui.offlineSummary.wb).toLocaleString()} WB while away.
          <button
            type="button"
            className="mini-btn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                ui: { ...prev.ui, offlineSummary: null }
              }))
            }
          >
            Nice
          </button>
        </aside>
      )}

      {state.ui.toast && <aside className="panel toast">{state.ui.toast}</aside>}

      <BottomControls active={state.ui.activeTab} onWalk={onWalk} onSelect={openTab} />

      <GameOverlaySheet open={state.ui.activeTab === 'shop' || state.ui.showShop} title="Shop" onClose={closeOverlay}>
        <ShopModal
          state={state}
          onTab={(tab) => setState((prev) => ({ ...prev, ui: { ...prev.ui, shopTab: tab } }))}
          onBuyUpgrade={onBuyUpgrade}
          onBuyFollower={onBuyFollower}
          isUpgradeUnlocked={canUnlock}
          isFollowerUnlocked={canUnlock}
        />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'stats'} title="Stats" onClose={closeOverlay}>
        <StatsPanel state={state} />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'settings'} title="Settings" onClose={closeOverlay}>
        <SettingsPanel
          soundEnabled={state.settings.soundEnabled}
          reducedMotion={state.settings.reducedMotion}
          onReset={onReset}
          onExport={onExport}
          onImport={onImport}
          onToggleSound={() =>
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled }
            }))
          }
          onToggleReducedMotion={() =>
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, reducedMotion: !prev.settings.reducedMotion }
            }))
          }
        />
      </GameOverlaySheet>
    </div>
  );
};

export default App;
