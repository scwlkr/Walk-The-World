import { useEffect, useMemo, useRef, useState } from 'react';
import { AccountPanel, type AccountBusyState } from './components/AccountPanel';
import { AchievementsPanel } from './components/AchievementsPanel';
import { BottomControls } from './components/BottomControls';
import { GameHUD } from './components/GameHUD';
import { GameOverlaySheet } from './components/GameOverlaySheet';
import { GameSceneCanvas } from './components/GameSceneCanvas';
import { ProgressPanel } from './components/ProgressPanel';
import { QuestPanel } from './components/QuestPanel';
import { RandomEventOverlay } from './components/RandomEventOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { ShopModal } from './components/ShopModal';
import { StatsPanel } from './components/StatsPanel';
import { WalkerBucksPanel } from './components/WalkerBucksPanel';
import {
  MUSIC_TRACKS,
  getMusicTrackById,
  getMusicTrackIndex,
  playSoundEffect,
  resumeGameAudio,
  type MusicTrackId
} from './game/audio';
import { claimAchievementReward, evaluateAchievements } from './game/achievements';
import { equipCosmetic } from './game/cosmetics';
import { LOGIC_TICK_RATE_MS } from './game/constants';
import {
  createPendingWalkerBucksGrant,
  getServerBackedAchievementReward,
  markWalkerBucksGrantAttempt,
  markWalkerBucksGrantFailed,
  markWalkerBucksGrantGranted,
  upsertWalkerBucksGrant
} from './game/economy';
import { calculateOfflineProgress, getClickMiles, getFollowerCost, getUpgradeCost } from './game/formulas';
import { equipEquipmentItem, useInventoryItem } from './game/inventory';
import { claimQuestReward, syncDailyQuests } from './game/quests';
import { RANDOM_EVENTS } from './game/randomEvents';
import { exportSave, importSave, loadGameState, resetGameState, saveGameState } from './game/save';
import { applyDistanceAndWb, clearToast, resolveRandomEvent, runGameTick, shouldAutoSave } from './game/tick';
import type {
  AchievementDefinition,
  CosmeticDefinition,
  Follower,
  GameState,
  InventoryItemDefinition,
  QuestDefinition,
  Upgrade,
  WalkerBucksRewardGrant,
  WorldId
} from './game/types';
import { applyEarthPrestige, canEnterWorld } from './game/world';
import {
  getAuthSession,
  isAuthConfigured,
  onAuthSessionChange,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  type AuthSession
} from './services/authClient';
import { loadCloudSave, uploadCloudSave, type CloudSaveSnapshot } from './services/cloudSaveClient';
import {
  grantWalkerBucksReward,
  isWalkerBucksBridgeConfigured,
  loadWalkerBucksBalance
} from './services/walkerbucksClient';

type TapFeedback = {
  id: number;
  x: number;
  y: number;
  distance: number;
};

const App = () => {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(!isAuthConfigured);
  const [cloudSave, setCloudSave] = useState<CloudSaveSnapshot | null>(null);
  const [accountBusy, setAccountBusy] = useState<AccountBusyState>('idle');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [walkerBucksBusy, setWalkerBucksBusy] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<TapFeedback[]>([]);
  const [tapPulse, setTapPulse] = useState(0);
  const lastFrameRef = useRef<number>(performance.now());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicTrackIndexRef = useRef(getMusicTrackIndex(state.settings.selectedMusicTrackId));
  const soundEnabledRef = useRef(state.settings.soundEnabled);
  const tapFeedbackIdRef = useRef(0);

  const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'Account action failed.';
  };

  const updateAccountState = (patch: Partial<GameState['account']>) => {
    setState((prev) => {
      const next = {
        ...prev,
        account: {
          ...prev.account,
          ...patch
        }
      };
      saveGameState(next);
      return next;
    });
  };

  const updateWalkerBucksBridgeState = (patch: Partial<GameState['walkerBucksBridge']>) => {
    setState((prev) => {
      const next = {
        ...prev,
        walkerBucksBridge: {
          ...prev.walkerBucksBridge,
          ...patch
        }
      };
      saveGameState(next);
      return next;
    });
  };

  const getCloudStatus = (snapshot: CloudSaveSnapshot | null): GameState['account']['status'] => {
    if (!snapshot) return 'signed_in';
    const hasTimestampConflict = Math.abs(snapshot.updatedAt - state.lastSavedAt) > 1000;
    const hasVersionConflict = snapshot.saveVersion !== state.saveVersion;
    return hasTimestampConflict || hasVersionConflict ? 'conflict' : 'synced';
  };

  const refreshCloudForUser = async (userId: string, showMessage = true) => {
    setAccountBusy('checking');
    try {
      const snapshot = await loadCloudSave(userId);
      setCloudSave(snapshot);
      updateAccountState({
        cloudSaveUpdatedAt: snapshot?.updatedAt ?? null,
        status: getCloudStatus(snapshot),
        lastSyncError: null
      });
      if (showMessage) {
        setAccountMessage(snapshot ? 'Cloud save found.' : 'No cloud save yet.');
      }
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const refreshWalkerBucksBalance = async () => {
    if (!isWalkerBucksBridgeConfigured) {
      updateWalkerBucksBridgeState({ status: 'unavailable', lastError: null });
      return;
    }

    const accessToken = authSession?.access_token;
    if (!authSession?.user || !accessToken) {
      updateWalkerBucksBridgeState({ status: 'guest', lastError: null });
      return;
    }

    setWalkerBucksBusy(true);
    updateWalkerBucksBridgeState({ status: 'checking', lastError: null });
    try {
      const { accountId, ...balance } = await loadWalkerBucksBalance(accessToken);
      updateWalkerBucksBridgeState({
        status: 'ready',
        accountId,
        balance,
        lastCheckedAt: Date.now(),
        lastError: null
      });
    } catch (error) {
      updateWalkerBucksBridgeState({
        status: 'error',
        lastError: toErrorMessage(error)
      });
    } finally {
      setWalkerBucksBusy(false);
    }
  };

  const submitWalkerBucksGrant = async (grant: WalkerBucksRewardGrant) => {
    const accessToken = authSession?.access_token;
    if (!isWalkerBucksBridgeConfigured || !accessToken) return;

    setWalkerBucksBusy(true);
    setState((prev) => {
      const existing = prev.walkerBucksBridge.rewardGrants[grant.id] ?? grant;
      const next = markWalkerBucksGrantAttempt(upsertWalkerBucksGrant(prev, existing), grant.id);
      saveGameState(next);
      return next;
    });

    try {
      const result = await grantWalkerBucksReward(accessToken, {
        sourceType: grant.sourceType,
        sourceId: grant.sourceId,
        idempotencyKey: grant.idempotencyKey
      });
      setState((prev) => {
        const next = markWalkerBucksGrantGranted(
          prev,
          grant.id,
          result.transactionId,
          result.accountId,
          result.balance
        );
        const withToast: GameState = {
          ...next,
          ui: {
            ...next.ui,
            toast: `${grant.label} WalkerBucks granted.`
          }
        };
        saveGameState(withToast);
        return withToast;
      });
    } catch (error) {
      const message = toErrorMessage(error);
      setState((prev) => {
        const next = markWalkerBucksGrantFailed(prev, grant.id, message);
        const withToast: GameState = {
          ...next,
          ui: {
            ...next.ui,
            toast: `${grant.label} WalkerBucks grant failed.`
          }
        };
        saveGameState(withToast);
        return withToast;
      });
    } finally {
      setWalkerBucksBusy(false);
    }
  };

  useEffect(() => {
    if (!isAuthConfigured) {
      updateAccountState({
        provider: 'guest',
        userId: null,
        email: null,
        status: 'disabled',
        lastSyncError: null
      });
      return;
    }

    let mounted = true;
    void getAuthSession()
      .then((session) => {
        if (!mounted) return;
        setAuthSession(session);
        setAuthReady(true);
      })
      .catch((error) => {
        if (!mounted) return;
        setAccountMessage(toErrorMessage(error));
        setAuthReady(true);
      });

    const unsubscribe = onAuthSessionChange((session) => {
      setAuthSession(session);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = authSession?.user;
    if (!user) {
      setCloudSave(null);
      updateAccountState({
        provider: 'guest',
        userId: null,
        email: null,
        status: isAuthConfigured ? 'guest' : 'disabled'
      });
      return;
    }

    updateAccountState({
      provider: 'supabase',
      userId: user.id,
      email: user.email ?? null,
      status: 'signed_in',
      lastSyncError: null
    });
    void refreshCloudForUser(user.id, false);
  }, [authSession?.user.id, authSession?.user.email]);

  useEffect(() => {
    if (!isWalkerBucksBridgeConfigured) {
      updateWalkerBucksBridgeState({ status: 'unavailable', lastError: null });
      return;
    }

    if (!authSession?.user) {
      updateWalkerBucksBridgeState({ status: 'guest', lastError: null });
      return;
    }

    void refreshWalkerBucksBalance();
  }, [authSession?.user.id, authSession?.access_token]);

  useEffect(() => {
    soundEnabledRef.current = state.settings.soundEnabled;
  }, [state.settings.soundEnabled]);

  useEffect(() => {
    const audio = new Audio(getMusicTrackById(state.settings.selectedMusicTrackId).src);
    audio.volume = 0.32;
    audio.preload = 'auto';

    const playCurrentTrack = () => {
      audio.play().catch(() => undefined);
    };

    const onEnded = () => {
      musicTrackIndexRef.current = (musicTrackIndexRef.current + 1) % MUSIC_TRACKS.length;
      const nextTrack = MUSIC_TRACKS[musicTrackIndexRef.current];
      audio.src = nextTrack.src;
      setState((prev) => {
        const next = {
          ...prev,
          settings: {
            ...prev.settings,
            selectedMusicTrackId: nextTrack.id
          }
        };
        saveGameState(next);
        return next;
      });
      if (soundEnabledRef.current) playCurrentTrack();
    };

    audio.addEventListener('ended', onEnded);
    musicAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      musicAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;

    const selectedTrack = getMusicTrackById(state.settings.selectedMusicTrackId);
    const selectedIndex = getMusicTrackIndex(selectedTrack.id);
    musicTrackIndexRef.current = selectedIndex;

    if (!audio.src.endsWith(selectedTrack.src)) {
      audio.src = selectedTrack.src;
      audio.load();
    }

    if (state.settings.soundEnabled) {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [state.settings.soundEnabled, state.settings.selectedMusicTrackId]);

  useEffect(() => {
    const loaded = loadGameState();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - loaded.lastSavedAt) / 1000);
    const offline = calculateOfflineProgress(loaded, elapsedSeconds);

    if (offline.secondsApplied > 0) {
      const withOffline = evaluateAchievements(
        syncDailyQuests(
          applyDistanceAndWb(
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
          ),
          now
        ),
        now
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

  useEffect(() => {
    if (tapPulse <= 0) return;
    const timer = window.setTimeout(() => setTapPulse((prev) => Math.max(0, prev - 0.34)), 45);
    return () => window.clearTimeout(timer);
  }, [tapPulse]);

  const canUnlock = useMemo(
    () =>
      (requirement?: {
        distanceMiles?: number;
        earthLoopsCompleted?: number;
        upgradeId?: string;
        upgradeLevel?: number;
      }) => {
        if (!requirement) return true;
        if (requirement.distanceMiles && state.stats.totalDistanceWalked < requirement.distanceMiles) return false;
        if (requirement.earthLoopsCompleted && state.earthLoopsCompleted < requirement.earthLoopsCompleted) return false;
        if (requirement.upgradeId && (state.upgrades[requirement.upgradeId] ?? 0) < (requirement.upgradeLevel ?? 1)) {
          return false;
        }
        return true;
      },
    [state]
  );

  const onWalk = (tapPosition?: { x: number; y: number }) => {
    const distance = getClickMiles(state);
    playSoundEffect('walk', state.settings.soundEnabled);

    setState((prev) => {
      const next = evaluateAchievements(
        applyDistanceAndWb(
          {
            ...prev,
            stats: {
              ...prev.stats,
              totalClicks: prev.stats.totalClicks + 1
            }
          },
          distance
        )
      );
      const synced = syncDailyQuests(next);
      saveGameState(synced);
      return synced;
    });

    if (tapPosition) {
      tapFeedbackIdRef.current += 1;
      const id = tapFeedbackIdRef.current;
      setTapFeedback((prev) => [...prev, { id, x: tapPosition.x, y: tapPosition.y, distance }]);
      window.setTimeout(() => {
        setTapFeedback((prev) => prev.filter((item) => item.id !== id));
      }, 700);
    }

    setTapPulse(1);
  };

  const onBuyUpgrade = (upgrade: Upgrade) => {
    const level = state.upgrades[upgrade.id] ?? 0;
    const cost = getUpgradeCost(upgrade, level);
    const maxed = level >= upgrade.maxLevel;
    const unlocked = canUnlock(upgrade.unlockRequirement);

    if (unlocked && !maxed && state.walkerBucks >= cost) {
      playSoundEffect('purchase', state.settings.soundEnabled);
    }

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
        },
        stats: {
          ...prev.stats,
          upgradesPurchased: prev.stats.upgradesPurchased + 1
        }
      };
      const evaluated = syncDailyQuests(evaluateAchievements(next));
      saveGameState(evaluated);
      return evaluated;
    });
  };

  const onBuyFollower = (follower: Follower) => {
    const count = state.followers[follower.id] ?? 0;
    const cost = getFollowerCost(follower, count);
    const maxed = count >= follower.maxCount;
    const unlocked = canUnlock(follower.unlockRequirement);

    if (unlocked && !maxed && state.walkerBucks >= cost) {
      playSoundEffect('purchase', state.settings.soundEnabled);
    }

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
        },
        stats: {
          ...prev.stats,
          followersHired: prev.stats.followersHired + 1
        }
      };
      const evaluated = syncDailyQuests(evaluateAchievements(next));
      saveGameState(evaluated);
      return evaluated;
    });
  };

  const onClaimEvent = () => {
    if (state.spawnedEvent) {
      playSoundEffect('event', state.settings.soundEnabled);
    }

    setState((prev) => {
      if (!prev.spawnedEvent) return prev;
      const def = RANDOM_EVENTS.find((event) => event.id === prev.spawnedEvent?.eventDefId);
      if (!def) return { ...prev, spawnedEvent: null };
      const next = syncDailyQuests(resolveRandomEvent(prev, def, Date.now()));
      saveGameState(next);
      return next;
    });
  };

  const onClaimAchievement = (achievement: AchievementDefinition) => {
    const serverReward = getServerBackedAchievementReward(achievement.id);
    const shouldUseBridge = Boolean(
      serverReward && isWalkerBucksBridgeConfigured && authSession?.user && authSession.access_token
    );
    const pendingGrant =
      serverReward && shouldUseBridge && authSession?.user
        ? createPendingWalkerBucksGrant(authSession.user.id, serverReward)
        : null;

    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      let next = claimAchievementReward(
        prev,
        achievement.id,
        Date.now(),
        pendingGrant
          ? {
              includeWalkerBucks: false,
              toast: `${achievement.name} local claim saved. WalkerBucks grant pending.`
            }
          : undefined
      );
      if (pendingGrant) {
        next = upsertWalkerBucksGrant(next, prev.walkerBucksBridge.rewardGrants[pendingGrant.id] ?? pendingGrant);
      }
      next = syncDailyQuests(next);
      saveGameState(next);
      return next;
    });

    if (pendingGrant) {
      void submitWalkerBucksGrant(pendingGrant);
    }
  };

  const onClaimQuest = (quest: QuestDefinition) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = claimQuestReward(prev, quest.id);
      saveGameState(next);
      return next;
    });
  };

  const onUseInventoryItem = (item: InventoryItemDefinition) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncDailyQuests(evaluateAchievements(useInventoryItem(prev, item.id)));
      saveGameState(next);
      return next;
    });
  };

  const onEquipEquipment = (item: InventoryItemDefinition) => {
    playSoundEffect('ui', state.settings.soundEnabled);
    setState((prev) => {
      const next = equipEquipmentItem(prev, item.id);
      saveGameState(next);
      return next;
    });
  };

  const onEquipCosmetic = (cosmetic: CosmeticDefinition) => {
    playSoundEffect('ui', state.settings.soundEnabled);
    setState((prev) => {
      const next = equipCosmetic(prev, cosmetic.id);
      saveGameState(next);
      return next;
    });
  };

  const onSelectWorld = (worldId: WorldId) => {
    playSoundEffect('ui', state.settings.soundEnabled);
    setState((prev) => {
      if (!canEnterWorld(prev, worldId)) return prev;
      const next: GameState = {
        ...prev,
        currentWorldId: worldId,
        distanceMiles: prev.worlds[worldId].distanceMiles,
        ui: {
          ...prev.ui,
          toast: `Entered ${worldId === 'solar_system' ? 'Solar System' : worldId.charAt(0).toUpperCase() + worldId.slice(1)}.`
        }
      };
      saveGameState(next);
      return next;
    });
  };

  const onPrestigeEarth = () => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncDailyQuests(evaluateAchievements(applyEarthPrestige(prev, Date.now())));
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

  const setSoundEnabled = (enabled: boolean) => {
    if (enabled) {
      resumeGameAudio();
      playSoundEffect('ui', true);
      musicAudioRef.current?.play().catch(() => undefined);
    } else {
      musicAudioRef.current?.pause();
    }

    setState((prev) => {
      const next = {
        ...prev,
        settings: { ...prev.settings, soundEnabled: enabled }
      };
      saveGameState(next);
      return next;
    });
  };

  const setMusicTrack = (trackId: MusicTrackId) => {
    resumeGameAudio();
    playSoundEffect('ui', state.settings.soundEnabled);

    setState((prev) => {
      const next = {
        ...prev,
        settings: { ...prev.settings, selectedMusicTrackId: trackId }
      };
      saveGameState(next);
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setState((prev) => {
      const next = {
        ...prev,
        settings: { ...prev.settings, reducedMotion: !prev.settings.reducedMotion }
      };
      saveGameState(next);
      return next;
    });
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setAccountBusy('authenticating');
    setAccountMessage(null);
    try {
      await signInWithEmail(email, password);
      setAccountMessage('Signed in.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    setAccountBusy('authenticating');
    setAccountMessage(null);
    try {
      await signUpWithEmail(email, password);
      setAccountMessage('Account created. Confirm email if Supabase requires it.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const handleGoogleSignIn = async () => {
    setAccountBusy('authenticating');
    setAccountMessage(null);
    try {
      await signInWithGoogle();
      setAccountMessage('Opening Google sign in.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const handleSignOut = async () => {
    setAccountBusy('signing-out');
    try {
      await signOut();
      setCloudSave(null);
      updateAccountState({
        provider: 'guest',
        userId: null,
        email: null,
        status: 'guest'
      });
      setAccountMessage('Signed out. Local guest play is still active.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const handleRefreshCloud = async () => {
    const user = authSession?.user;
    if (!user) return;
    await refreshCloudForUser(user.id);
  };

  const handleUploadLocal = async () => {
    const user = authSession?.user;
    if (!user) return;
    if (cloudSave && !window.confirm('Upload this local save to cloud and replace the current cloud save?')) return;

    setAccountBusy('uploading');
    setAccountMessage(null);
    try {
      const now = Date.now();
      const uploadState: GameState = {
        ...state,
        lastSavedAt: now,
        account: {
          ...state.account,
          provider: 'supabase',
          userId: user.id,
          email: user.email ?? null,
          cloudSaveUpdatedAt: now,
          lastSyncedAt: now,
          status: 'synced',
          lastSyncError: null
        }
      };
      const snapshot = await uploadCloudSave(user.id, uploadState);
      const syncedState: GameState = {
        ...uploadState,
        account: {
          ...uploadState.account,
          cloudSaveUpdatedAt: snapshot.updatedAt,
          lastSyncedAt: snapshot.updatedAt,
          status: 'synced'
        }
      };
      setCloudSave({ ...snapshot, state: syncedState });
      setState(syncedState);
      saveGameState(syncedState);
      setAccountMessage('Local save uploaded to cloud.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  const handleLoadCloud = async () => {
    const user = authSession?.user;
    if (!user || !cloudSave) return;
    if (!window.confirm('Load the cloud save and replace this local save?')) return;

    setAccountBusy('loading');
    setAccountMessage(null);
    try {
      const loadedState: GameState = {
        ...cloudSave.state,
        account: {
          ...cloudSave.state.account,
          provider: 'supabase',
          userId: user.id,
          email: user.email ?? null,
          cloudSaveUpdatedAt: cloudSave.updatedAt,
          lastSyncedAt: Date.now(),
          status: 'synced',
          lastSyncError: null
        }
      };
      setState(loadedState);
      saveGameState(loadedState);
      setAccountMessage('Cloud save loaded locally.');
    } catch (error) {
      const message = toErrorMessage(error);
      updateAccountState({ status: 'error', lastSyncError: message });
      setAccountMessage(message);
    } finally {
      setAccountBusy('idle');
    }
  };

  return (
    <div className="game-shell">
      <GameSceneCanvas state={state} onEventClaim={onClaimEvent} tapPulse={tapPulse} onSceneTap={(x, y) => onWalk({ x, y })} />
      <GameHUD state={state} />
      <RandomEventOverlay spawnedEvent={state.spawnedEvent} onClaim={onClaimEvent} />

      <div className="tap-feedback-layer" aria-hidden="true">
        {tapFeedback.map((item) => (
          <div key={item.id} className="tap-feedback" style={{ left: item.x, top: item.y }}>
            +{item.distance.toFixed(3)} mi
          </div>
        ))}
      </div>

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

      <BottomControls active={state.ui.activeTab} onSelect={openTab} />

      <GameOverlaySheet open={state.ui.activeTab === 'shop' || state.ui.showShop} title="Shop" onClose={closeOverlay}>
        <ShopModal
          state={state}
          onTab={(tab) => setState((prev) => ({ ...prev, ui: { ...prev.ui, shopTab: tab } }))}
          onBuyUpgrade={onBuyUpgrade}
          onBuyFollower={onBuyFollower}
          onUseInventoryItem={onUseInventoryItem}
          onEquipEquipment={onEquipEquipment}
          onEquipCosmetic={onEquipCosmetic}
          isUpgradeUnlocked={canUnlock}
          isFollowerUnlocked={canUnlock}
        />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'quests'} title="Quests" onClose={closeOverlay}>
        <QuestPanel state={state} onClaim={onClaimQuest} />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'stats'} title="Stats" onClose={closeOverlay}>
        <ProgressPanel state={state} onPrestigeEarth={onPrestigeEarth} onSelectWorld={onSelectWorld} />
        <StatsPanel state={state} />
        <AchievementsPanel state={state} onClaim={onClaimAchievement} />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'settings'} title="Settings" onClose={closeOverlay}>
        <AccountPanel
          isConfigured={isAuthConfigured}
          isReady={authReady}
          session={authSession}
          cloudSave={cloudSave}
          busy={accountBusy}
          message={accountMessage}
          localLastSavedAt={state.lastSavedAt}
          localSaveVersion={state.saveVersion}
          onEmailSignIn={handleEmailSignIn}
          onEmailSignUp={handleEmailSignUp}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onRefreshCloud={handleRefreshCloud}
          onUploadLocal={handleUploadLocal}
          onLoadCloud={handleLoadCloud}
        />
        <WalkerBucksPanel
          state={state}
          isBridgeConfigured={isWalkerBucksBridgeConfigured}
          isSignedIn={Boolean(authSession?.user)}
          isBusy={walkerBucksBusy}
          onRefreshBalance={refreshWalkerBucksBalance}
          onRetryGrant={(grant) => void submitWalkerBucksGrant(grant)}
        />
        <SettingsPanel
          soundEnabled={state.settings.soundEnabled}
          reducedMotion={state.settings.reducedMotion}
          selectedMusicTrackId={state.settings.selectedMusicTrackId}
          musicTracks={MUSIC_TRACKS}
          onReset={onReset}
          onExport={onExport}
          onImport={onImport}
          onSelectMusicTrack={setMusicTrack}
          onToggleSound={() =>
            setSoundEnabled(!state.settings.soundEnabled)
          }
          onToggleReducedMotion={toggleReducedMotion}
        />
      </GameOverlaySheet>
    </div>
  );
};

export default App;
