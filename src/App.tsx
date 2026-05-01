import { useEffect, useMemo, useRef, useState } from 'react';
import { AccountPanel, type AccountBusyState } from './components/AccountPanel';
import { AchievementsPanel } from './components/AchievementsPanel';
import { BottomControls } from './components/BottomControls';
import { CollectionGoalsPanel } from './components/CollectionGoalsPanel';
import { DevLabPanel, type DevLabOverrides } from './components/DevLabPanel';
import { GameHUD } from './components/GameHUD';
import { GameOverlaySheet } from './components/GameOverlaySheet';
import { GameSceneCanvas } from './components/GameSceneCanvas';
import { JourneyPanel } from './components/JourneyPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { MarketplacePanel } from './components/MarketplacePanel';
import { NotificationCenter } from './components/NotificationCenter';
import { ProgressPanel } from './components/ProgressPanel';
import { QuestPanel } from './components/QuestPanel';
import { RegionPanel } from './components/RegionPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SharedInventoryPanel } from './components/SharedInventoryPanel';
import { ShopModal } from './components/ShopModal';
import { SocialBridgePanel } from './components/SocialBridgePanel';
import { StatsPanel } from './components/StatsPanel';
import { WalkButton } from './components/WalkButton';
import { WalkerBucksPanel } from './components/WalkerBucksPanel';
import {
  MUSIC_TRACKS,
  getMusicTrackById,
  getMusicTrackIndex,
  playSoundEffect,
  resumeGameAudio,
  type MusicTrackId
} from './game/audio';
import { applyActiveTap, getActiveTapMultiplier } from './game/activePlay';
import { claimAchievementReward, evaluateAchievements } from './game/achievements';
import { selectProfileTitle } from './game/collections';
import { equipCosmetic } from './game/cosmetics';
import { createDevPresetState } from './game/devPresets';
import { LOGIC_TICK_RATE_MS } from './game/constants';
import {
  createPendingLegacyWalkerBucksMigration,
  createPendingWalkerBucksBatchGrant,
  createPendingWalkerBucksGrant,
  createPendingMarketplacePurchase,
  buyOfferFastOptimistic,
  createWtwPurchaseId,
  getPendingWalkerBucksGrants,
  getServerBackedAchievementReward,
  getUnsettledWtwPurchases,
  markWtwPurchaseSettled,
  markWtwPurchaseSettlementFailed,
  markWtwPurchaseSettling,
  markMarketplacePurchaseAttempt,
  markMarketplacePurchaseFailed,
  markMarketplacePurchasePurchased,
  markWalkerBucksGrantAttempt,
  markWalkerBucksGrantFailed,
  markWalkerBucksGrantGranted,
  rollbackOptimisticPurchase,
  rollbackSettlementFailedWtwPurchases,
  upsertMarketplacePurchase,
  upsertWalkerBucksGrant
} from './game/economy';
import { calculateOfflineProgress, getClickMiles, getFollowerCost, getUpgradeCost } from './game/formulas';
import { applyCatalogOfferPurchase, getLocalCatalogShopOffers, type LocalCatalogShopOffer } from './game/items';
import { equipEquipmentItem, useInventoryItem } from './game/inventory';
import { claimMilestoneReward, createInitialMilestoneState, syncMilestones } from './game/milestones';
import { claimQuestReward, createQuestStateForGameState, syncDailyQuests } from './game/quests';
import { RANDOM_EVENTS } from './game/randomEvents';
import {
  getRealtimeMilesPerSecond,
  pruneRealtimeTapSamples,
  type RecentTapDistance
} from './game/realtimeDps';
import { isInRequiredRegion } from './game/regions';
import { getRouteEncounterById, resolveRouteEncounterChoice } from './game/routeEncounters';
import { exportSave, importSave, loadGameState, resetGameState, saveGameState } from './game/save';
import { applyDistanceAndWb, clearToast, resolveRandomEvent, runGameTick, shouldAutoSave } from './game/tick';
import type {
  AchievementDefinition,
  CosmeticDefinition,
  Follower,
  GameState,
  InventoryItemDefinition,
  JourneyUpgradeDefinition,
  MilestoneDefinition,
  QuestDefinition,
  RouteEncounterChoice,
  Upgrade,
  WalkerBucksMarketplaceOffer,
  WalkerBucksMarketplacePurchase,
  WalkerBucksRewardGrant,
  WtwPurchase,
  WorldId
} from './game/types';
import { applyEarthPrestige, buyJourneyUpgrade, canEnterWorld } from './game/world';
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
  completeWalkerBucksBankLink,
  grantWalkerBucksReward,
  isWalkerBucksBridgeConfigured,
  loadWalkerBucksBalance,
  loadWalkerBucksLeaderboard,
  loadWalkerBucksMarketplace,
  purchaseWalkerBucksMarketplaceOffer,
  spendWalkerBucksForGame,
  WalkerBucksBridgeRequestError
} from './services/walkerbucksClient';

type TapFeedback = {
  id: number;
  x: number;
  y: number;
  distance: number;
};

const App = () => {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const [devLabOverrides, setDevLabOverrides] = useState<DevLabOverrides>({
    sceneId: null,
    seasonalEventId: null,
    speedMultiplier: 1
  });
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(!isAuthConfigured);
  const [cloudSave, setCloudSave] = useState<CloudSaveSnapshot | null>(null);
  const [accountBusy, setAccountBusy] = useState<AccountBusyState>('idle');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [walkerBucksBusy, setWalkerBucksBusy] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<TapFeedback[]>([]);
  const [recentTapDistances, setRecentTapDistances] = useState<RecentTapDistance[]>([]);
  const [tapPulse, setTapPulse] = useState(0);
  const lastFrameRef = useRef<number>(performance.now());
  const stateRef = useRef(state);
  const authSessionRef = useRef<AuthSession | null>(null);
  const settlingPurchasesRef = useRef<Set<string>>(new Set());
  const pendingWalkerBucksGrantIdsRef = useRef<Set<string>>(new Set());
  const clickLockedOfferIdsRef = useRef<Set<string>>(new Set());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicTrackIndexRef = useRef(getMusicTrackIndex(state.settings.selectedMusicTrackId));
  const soundEnabledRef = useRef(state.settings.soundEnabled);
  const tapFeedbackIdRef = useRef(0);
  const devLabEnabled =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('dev') === '1';
  const realtimeMilesPerSecond = getRealtimeMilesPerSecond(state, recentTapDistances);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    authSessionRef.current = authSession;
  }, [authSession]);

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
      const { accountId, inventory, ...balance } = await loadWalkerBucksBalance(accessToken);
      updateWalkerBucksBridgeState({
        status: 'ready',
        accountId,
        balance,
        inventory,
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

  const refreshWalkerBucksLeaderboard = async () => {
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
      const leaderboard = await loadWalkerBucksLeaderboard(accessToken);
      updateWalkerBucksBridgeState({
        status: 'ready',
        accountId: leaderboard.accountId,
        leaderboard,
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

  const refreshWalkerBucksMarketplace = async () => {
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
      const marketplace = await loadWalkerBucksMarketplace(accessToken);
      updateWalkerBucksBridgeState({
        status: 'ready',
        accountId: marketplace.accountId,
        balance: marketplace.balance,
        marketplaceOffers: marketplace.offers,
        inventory: marketplace.inventory,
        lastCheckedAt: marketplace.updatedAt,
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

  const completeBankLink = async (linkCode: string) => {
    if (!isWalkerBucksBridgeConfigured) {
      updateWalkerBucksBridgeState({ status: 'unavailable', lastError: null });
      throw new Error('WalkerBucks bridge is not configured.');
    }

    const accessToken = authSession?.access_token;
    if (!authSession?.user || !accessToken) {
      updateWalkerBucksBridgeState({ status: 'guest', lastError: null });
      throw new Error('Sign in before linking WalkerBucks Bank.');
    }

    setWalkerBucksBusy(true);
    updateWalkerBucksBridgeState({ status: 'checking', lastError: null });
    try {
      const result = await completeWalkerBucksBankLink(accessToken, linkCode);
      updateWalkerBucksBridgeState({
        status: 'ready',
        accountId: result.accountId,
        balance: result.balance,
        inventory: result.inventory,
        lastCheckedAt: result.updatedAt,
        lastError: null
      });
    } catch (error) {
      const message = toErrorMessage(error);
      updateWalkerBucksBridgeState({
        status: 'error',
        lastError: message
      });
      throw new Error(message);
    } finally {
      setWalkerBucksBusy(false);
    }
  };

  const submitWalkerBucksGrant = async (grant: WalkerBucksRewardGrant) => {
    const accessToken = authSession?.access_token;
    if (!isWalkerBucksBridgeConfigured || !accessToken) return;
    if (pendingWalkerBucksGrantIdsRef.current.has(grant.id)) return;

    pendingWalkerBucksGrantIdsRef.current.add(grant.id);
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
        amount: grant.amount,
        reasonCode: grant.reasonCode,
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
      pendingWalkerBucksGrantIdsRef.current.delete(grant.id);
      if (pendingWalkerBucksGrantIdsRef.current.size === 0) {
        setWalkerBucksBusy(false);
      }
    }
  };

  useEffect(() => {
    if (!authSession?.user || !authSession.access_token || !isWalkerBucksBridgeConfigured) return;

    for (const grant of getPendingWalkerBucksGrants(state)) {
      if (!pendingWalkerBucksGrantIdsRef.current.has(grant.id)) {
        void submitWalkerBucksGrant(grant);
      }
    }
  }, [authSession?.user?.id, authSession?.access_token, state.walkerBucksBridge.rewardGrants]);

  const submitMarketplacePurchase = async (purchase: WalkerBucksMarketplacePurchase) => {
    const accessToken = authSession?.access_token;
    if (!isWalkerBucksBridgeConfigured || !accessToken) return;

    setWalkerBucksBusy(true);
    setState((prev) => {
      const existing = prev.walkerBucksBridge.marketplacePurchases[purchase.id] ?? purchase;
      const next = markMarketplacePurchaseAttempt(upsertMarketplacePurchase(prev, existing), purchase.id);
      saveGameState(next);
      return next;
    });

    try {
      const result = await purchaseWalkerBucksMarketplaceOffer(accessToken, {
        shopOfferId: purchase.shopOfferId,
        idempotencyKey: purchase.idempotencyKey
      });
      setState((prev) => {
        const next = markMarketplacePurchasePurchased(
          prev,
          purchase.id,
          result.itemInstanceId,
          result.itemDefinitionId,
          result.priceWb,
          result.accountId,
          result.balance,
          result.inventory
        );
        const withToast: GameState = {
          ...next,
          ui: {
            ...next.ui,
            toast: `${purchase.label} purchased with WalkerBucks.`
          }
        };
        saveGameState(withToast);
        return withToast;
      });
    } catch (error) {
      const message = toErrorMessage(error);
      setState((prev) => {
        const next = markMarketplacePurchaseFailed(prev, purchase.id, message);
        const withToast: GameState = {
          ...next,
          ui: {
            ...next.ui,
            toast: `${purchase.label} purchase failed.`
          }
        };
        saveGameState(withToast);
        return withToast;
      });
    } finally {
      setWalkerBucksBusy(false);
    }
  };

  const isRetriablePurchaseSettlementError = (error: unknown): boolean =>
    error instanceof WalkerBucksBridgeRequestError &&
    (error.isNetworkError || error.status === null || error.status === 408 || error.status === 429 || error.status >= 500);

  const settlePurchaseWithWalkerBucksInBackground = async (purchase: WtwPurchase) => {
    const accessToken = authSessionRef.current?.access_token;
    if (!isWalkerBucksBridgeConfigured || !accessToken) return;
    if (settlingPurchasesRef.current.has(purchase.purchaseId)) return;

    settlingPurchasesRef.current.add(purchase.purchaseId);
    setState((prev) => {
      const current = prev.walkerBucksBridge.purchases[purchase.purchaseId];
      if (!current || current.status === 'settled' || current.status === 'rolled_back') return prev;
      const next = markWtwPurchaseSettling(prev, purchase.purchaseId);
      saveGameState(next);
      return next;
    });

    try {
      const result = await spendWalkerBucksForGame(accessToken, {
        sourceType: purchase.sourceType,
        sourceId: purchase.sourceId,
        amount: purchase.price * purchase.quantity,
        idempotencyKey: purchase.idempotencyKey,
        reasonCode: 'wtw.shop.purchase',
        metadata: {
          app: 'walk_the_world',
          purchase_id: purchase.purchaseId,
          offer_id: purchase.offerId,
          item_def_id: purchase.itemDefId,
          item_name: purchase.itemName,
          quantity: purchase.quantity,
          price: purchase.price
        }
      });

      setState((prev) => {
        const withWallet: GameState = {
          ...prev,
          walkerBucksBridge: {
            ...prev.walkerBucksBridge,
            status: 'ready',
            accountId: result.accountId,
            balance: result.balance,
            lastCheckedAt: Date.now(),
            lastError: null
          }
        };
        const settled = markWtwPurchaseSettled(withWallet, purchase.purchaseId, result.transactionId);
        const next = syncMilestones(syncDailyQuests(evaluateAchievements(settled)));
        saveGameState(next);
        return next;
      });
      await refreshWalkerBucksBalance();
    } catch (error) {
      const message = toErrorMessage(error);
      if (isRetriablePurchaseSettlementError(error)) {
        setState((prev) => {
          const current = prev.walkerBucksBridge.purchases[purchase.purchaseId];
          if (!current || current.status === 'settled' || current.status === 'rolled_back') return prev;
          const next = {
            ...prev,
            walkerBucksBridge: {
              ...prev.walkerBucksBridge,
              lastError: message,
              purchases: {
                ...prev.walkerBucksBridge.purchases,
                [purchase.purchaseId]: {
                  ...current,
                  status: 'optimistic_applied' as const,
                  errorMessage: message,
                  updatedAt: Date.now()
                }
              }
            }
          };
          saveGameState(next);
          return next;
        });
      } else {
        setState((prev) => {
          const failed = markWtwPurchaseSettlementFailed(prev, purchase.purchaseId, message);
          const next = rollbackOptimisticPurchase(failed, purchase.purchaseId);
          saveGameState(next);
          return next;
        });
        await refreshWalkerBucksBalance();
      }
    } finally {
      settlingPurchasesRef.current.delete(purchase.purchaseId);
    }
  };

  const reconcileWtwPurchases = async () => {
    if (!isWalkerBucksBridgeConfigured || !authSessionRef.current?.access_token) return;
    await refreshWalkerBucksBalance();
    setState((prev) => {
      const next = rollbackSettlementFailedWtwPurchases(prev);
      if (next === prev) return prev;
      saveGameState(next);
      return next;
    });
    for (const purchase of getUnsettledWtwPurchases(stateRef.current)) {
      void settlePurchaseWithWalkerBucksInBackground(purchase);
    }
  };

  useEffect(() => {
    if (!authSession?.access_token || !isWalkerBucksBridgeConfigured) return;

    for (const purchase of Object.values(state.walkerBucksBridge.purchases)) {
      if (purchase.status !== 'optimistic_applied' || purchase.errorMessage) continue;
      void settlePurchaseWithWalkerBucksInBackground(purchase);
    }
  }, [authSession?.access_token, state.walkerBucksBridge.purchases]);

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
    if (!authSession?.user || !authSession.access_token || !isWalkerBucksBridgeConfigured) return undefined;

    const reconcile = () => {
      void reconcileWtwPurchases();
    };

    reconcile();
    const interval = window.setInterval(reconcile, 45000);
    window.addEventListener('focus', reconcile);
    window.addEventListener('online', reconcile);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', reconcile);
      window.removeEventListener('online', reconcile);
    };
  }, [authSession?.user?.id, authSession?.access_token]);

  useEffect(() => {
    const user = authSession?.user;
    const accessToken = authSession?.access_token;
    if (!user || !accessToken || !isWalkerBucksBridgeConfigured) return;

    setState((prev) => {
      const amount = Math.floor(prev.walkerBucks);
      if (amount <= 0) return prev;

      const pendingGrant = createPendingLegacyWalkerBucksMigration(user.id, amount);
      const existing = prev.walkerBucksBridge.rewardGrants[pendingGrant.id];
      if (existing) return prev;

      const next = upsertWalkerBucksGrant(prev, pendingGrant);
      saveGameState(next);
      return next;
    });
  }, [authSession?.user?.id, authSession?.access_token, state.walkerBucks]);

  useEffect(() => {
    const user = authSession?.user;
    const accessToken = authSession?.access_token;
    if (!user || !accessToken || !isWalkerBucksBridgeConfigured) return undefined;

    const flushPendingGrant = () => {
      setState((prev) => {
        const amount = Math.floor(prev.walkerBucksBridge.pendingGrantAmount);
        if (amount <= 0) return prev;

        const sequence = prev.walkerBucksBridge.pendingGrantSequence + 1;
        const pendingGrant = createPendingWalkerBucksBatchGrant(user.id, amount, sequence);
        const withGrant = upsertWalkerBucksGrant(prev, pendingGrant);
        const next: GameState = {
          ...withGrant,
          walkerBucksBridge: {
            ...withGrant.walkerBucksBridge,
            pendingGrantAmount: Math.max(0, withGrant.walkerBucksBridge.pendingGrantAmount - amount),
            pendingGrantSequence: sequence
          }
        };
        saveGameState(next);
        return next;
      });
    };

    const interval = window.setInterval(flushPendingGrant, 5000);
    flushPendingGrant();
    return () => window.clearInterval(interval);
  }, [authSession?.user?.id, authSession?.access_token]);

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
      const deltaSeconds = Math.min(0.5, (nowPerf - lastFrameRef.current) / 1000) * (devLabEnabled ? devLabOverrides.speedMultiplier : 1);
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
  }, [devLabEnabled, devLabOverrides.speedMultiplier]);

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

  const canUnlockRequirement = (
    gameState: GameState,
    requirement?: {
      distanceMiles?: number;
      earthLoopsCompleted?: number;
      upgradeId?: string;
      upgradeLevel?: number;
      regionIds?: string[];
    }
  ): boolean => {
    if (!requirement) return true;
    if (requirement.distanceMiles && gameState.stats.totalDistanceWalked < requirement.distanceMiles) return false;
    if (requirement.earthLoopsCompleted && gameState.earthLoopsCompleted < requirement.earthLoopsCompleted) return false;
    if (
      requirement.upgradeId &&
      (gameState.upgrades[requirement.upgradeId] ?? 0) < (requirement.upgradeLevel ?? 1)
    ) {
      return false;
    }
    if (!isInRequiredRegion(gameState, requirement.regionIds)) return false;
    return true;
  };

  const canUnlock = useMemo(
    () => (requirement?: Upgrade['unlockRequirement'] | Follower['unlockRequirement']) => canUnlockRequirement(state, requirement),
    [state]
  );

  const lockOfferClickBriefly = (offerKey: string): boolean => {
    if (clickLockedOfferIdsRef.current.has(offerKey)) return false;
    clickLockedOfferIdsRef.current.add(offerKey);
    window.setTimeout(() => {
      clickLockedOfferIdsRef.current.delete(offerKey);
    }, 350);
    return true;
  };

  const onWalk = (tapPosition?: { x: number; y: number }) => {
    const now = Date.now();
    const previewTap = applyActiveTap(state, now);
    const distance = getClickMiles(previewTap) * getActiveTapMultiplier(previewTap);
    playSoundEffect('walk', state.settings.soundEnabled);

    setState((prev) => {
      const tapped = applyActiveTap(prev, now);
      const boostedDistance = getClickMiles(tapped) * getActiveTapMultiplier(tapped);
      const next = evaluateAchievements(
        applyDistanceAndWb(
          {
            ...tapped,
            stats: {
              ...tapped.stats,
              totalClicks: tapped.stats.totalClicks + 1
            }
          },
          boostedDistance
        )
      );
      const synced = syncMilestones(syncDailyQuests(next));
      saveGameState(synced);
      return synced;
    });
    setRecentTapDistances((prev) =>
      pruneRealtimeTapSamples([...prev, { distanceMiles: distance, occurredAt: now }], now)
    );

    if (tapPosition) {
      tapFeedbackIdRef.current += 1;
      const id = tapFeedbackIdRef.current;
      setTapFeedback((prev) => [...prev.slice(-3), { id, x: tapPosition.x, y: tapPosition.y, distance }]);
      window.setTimeout(() => {
        setTapFeedback((prev) => prev.filter((item) => item.id !== id));
      }, 700);
    }

    setTapPulse(1);
  };

  const onBuyUpgrade = (upgrade: Upgrade) => {
    if (!lockOfferClickBriefly(`upgrade:${upgrade.id}`)) return;
    if (!authSession?.user || !isWalkerBucksBridgeConfigured) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, toast: 'Sign in to spend WalkerBucks.' } }));
      return;
    }
    let purchaseToSettle: WtwPurchase | null = null;
    const purchaseId = createWtwPurchaseId();

    setState((prev) => {
      if (!canUnlockRequirement(prev, upgrade.unlockRequirement)) return prev;
      const level = prev.upgrades[upgrade.id] ?? 0;
      if (level >= upgrade.maxLevel) return prev;
      if (!prev.walkerBucksBridge.accountId) {
        const next = { ...prev, ui: { ...prev.ui, toast: 'Could not sync. Balance refreshed.' } };
        saveGameState(next);
        return next;
      }

      const targetLevel = level + 1;
      const result = buyOfferFastOptimistic(prev, {
        supabaseUserId: authSession.user.id,
        accountId: prev.walkerBucksBridge.accountId,
        purchaseId,
        offerId: upgrade.id,
        itemDefId: upgrade.id,
        itemName: upgrade.name,
        price: getUpgradeCost(upgrade, level),
        quantity: 1,
        sourceType: 'upgrade',
        sourceId: `${upgrade.id}:level_${targetLevel}`,
        dpsDelta: upgrade.effectType === 'idle_speed_flat' ? upgrade.effectValue : 0,
        applyPurchase: (current) => ({
          ...current,
          upgrades: {
            ...current.upgrades,
            [upgrade.id]: targetLevel
          },
          stats: {
            ...current.stats,
            upgradesPurchased: current.stats.upgradesPurchased + 1
          }
        })
      });

      if (!result.ok) {
        saveGameState(result.state);
        return result.state;
      }

      purchaseToSettle = result.purchase;
      const next = syncMilestones(syncDailyQuests(evaluateAchievements(result.state)));
      saveGameState(next);
      return next;
    });

    if (purchaseToSettle) {
      playSoundEffect('purchase', state.settings.soundEnabled);
      void settlePurchaseWithWalkerBucksInBackground(purchaseToSettle);
    } else if (state.walkerBucksBridge.accountId === null) {
      void refreshWalkerBucksBalance();
    }
  };

  const onBuyFollower = (follower: Follower) => {
    if (!lockOfferClickBriefly(`follower:${follower.id}`)) return;
    if (!authSession?.user || !isWalkerBucksBridgeConfigured) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, toast: 'Sign in to spend WalkerBucks.' } }));
      return;
    }
    let purchaseToSettle: WtwPurchase | null = null;
    const purchaseId = createWtwPurchaseId();

    setState((prev) => {
      if (!canUnlockRequirement(prev, follower.unlockRequirement)) return prev;
      const count = prev.followers[follower.id] ?? 0;
      if (count >= follower.maxCount) return prev;
      if (!prev.walkerBucksBridge.accountId) {
        const next = { ...prev, ui: { ...prev.ui, toast: 'Could not sync. Balance refreshed.' } };
        saveGameState(next);
        return next;
      }

      const targetCount = count + 1;
      const result = buyOfferFastOptimistic(prev, {
        supabaseUserId: authSession.user.id,
        accountId: prev.walkerBucksBridge.accountId,
        purchaseId,
        offerId: follower.id,
        itemDefId: follower.id,
        itemName: follower.name,
        price: getFollowerCost(follower, count),
        quantity: 1,
        sourceType: 'follower',
        sourceId: `${follower.id}:count_${targetCount}`,
        dpsDelta: follower.milesPerSecond,
        applyPurchase: (current) => ({
          ...current,
          followers: {
            ...current.followers,
            [follower.id]: targetCount
          },
          stats: {
            ...current.stats,
            followersHired: current.stats.followersHired + 1
          }
        })
      });

      if (!result.ok) {
        saveGameState(result.state);
        return result.state;
      }

      purchaseToSettle = result.purchase;
      const next = syncMilestones(syncDailyQuests(evaluateAchievements(result.state)));
      saveGameState(next);
      return next;
    });

    if (purchaseToSettle) {
      playSoundEffect('purchase', state.settings.soundEnabled);
      void settlePurchaseWithWalkerBucksInBackground(purchaseToSettle);
    } else if (state.walkerBucksBridge.accountId === null) {
      void refreshWalkerBucksBalance();
    }
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
      const synced = syncMilestones(next);
      saveGameState(synced);
      return synced;
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
              toast: `${achievement.name} claimed. WalkerBucks updating.`
            }
          : undefined
      );
      if (pendingGrant) {
        next = upsertWalkerBucksGrant(next, prev.walkerBucksBridge.rewardGrants[pendingGrant.id] ?? pendingGrant);
      }
      next = syncMilestones(syncDailyQuests(next));
      saveGameState(next);
      return next;
    });

    if (pendingGrant) {
      void submitWalkerBucksGrant(pendingGrant);
    }
  };

  const onPurchaseMarketplaceOffer = (offer: WalkerBucksMarketplaceOffer) => {
    if (!authSession?.user || !isWalkerBucksBridgeConfigured) return;
    const pendingPurchase = createPendingMarketplacePurchase(authSession.user.id, offer);

    playSoundEffect('purchase', state.settings.soundEnabled);
    setState((prev) => {
      const next = upsertMarketplacePurchase(
        prev,
        prev.walkerBucksBridge.marketplacePurchases[pendingPurchase.id] ?? pendingPurchase
      );
      saveGameState(next);
      return next;
    });

    void submitMarketplacePurchase(pendingPurchase);
  };

  const onBuyCatalogOffer = (offer: LocalCatalogShopOffer) => {
    if (!lockOfferClickBriefly(`catalog:${offer.offerId}`)) return;
    if (!authSession?.user || !isWalkerBucksBridgeConfigured) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, toast: 'Sign in to spend WalkerBucks.' } }));
      return;
    }
    let purchaseToSettle: WtwPurchase | null = null;
    const purchaseId = createWtwPurchaseId();

    setState((prev) => {
      const currentOffers = getLocalCatalogShopOffers(prev);
      const currentOffer = currentOffers.find((entry) => entry.offerId === offer.offerId);
      if (!currentOffer?.unlocked) return prev;
      const purchases = prev.inventory.usedConsumables[`purchase:${currentOffer.offerId}`] ?? 0;
      if (currentOffer.purchaseLimitPerAccount && purchases >= currentOffer.purchaseLimitPerAccount) return prev;
      if (!prev.walkerBucksBridge.accountId) {
        const next = { ...prev, ui: { ...prev.ui, toast: 'Could not sync. Balance refreshed.' } };
        saveGameState(next);
        return next;
      }

      const result = buyOfferFastOptimistic(prev, {
        supabaseUserId: authSession.user.id,
        accountId: prev.walkerBucksBridge.accountId,
        purchaseId,
        offerId: currentOffer.offerId,
        itemDefId: currentOffer.item.id,
        itemName: currentOffer.item.name,
        price: currentOffer.priceWb,
        quantity: 1,
        sourceType: 'catalog_offer',
        sourceId: `${currentOffer.offerId}:purchase_${purchases + 1}`,
        dpsDelta: 0,
        applyPurchase: (current) => applyCatalogOfferPurchase(current, currentOffer.offerId)
      });

      if (!result.ok) {
        saveGameState(result.state);
        return result.state;
      }

      purchaseToSettle = result.purchase;
      const next = syncMilestones(syncDailyQuests(evaluateAchievements(result.state)));
      saveGameState(next);
      return next;
    });

    if (purchaseToSettle) {
      playSoundEffect('purchase', state.settings.soundEnabled);
      void settlePurchaseWithWalkerBucksInBackground(purchaseToSettle);
    } else if (state.walkerBucksBridge.accountId === null) {
      void refreshWalkerBucksBalance();
    }
  };

  const onClaimQuest = (quest: QuestDefinition) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncMilestones(claimQuestReward(prev, quest.id));
      saveGameState(next);
      return next;
    });
  };

  const onClaimMilestone = (milestone: MilestoneDefinition) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncMilestones(evaluateAchievements(claimMilestoneReward(prev, milestone.id)));
      saveGameState(next);
      return next;
    });
  };

  const onChooseRouteEncounter = (choice: RouteEncounterChoice) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncMilestones(evaluateAchievements(syncDailyQuests(resolveRouteEncounterChoice(prev, choice))));
      saveGameState(next);
      return next;
    });
  };

  const onClaimDefaultRouteEncounter = () => {
    const spawned = state.spawnedRouteEncounter;
    if (!spawned) return;
    const choice = getRouteEncounterById(spawned.encounterDefId)?.choices[0];
    if (choice) onChooseRouteEncounter(choice);
  };

  const dismissOfflineSummary = () => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, offlineSummary: null }
    }));
  };

  const onUseInventoryItem = (item: InventoryItemDefinition) => {
    playSoundEffect('event', state.settings.soundEnabled);
    setState((prev) => {
      const next = syncMilestones(syncDailyQuests(evaluateAchievements(useInventoryItem(prev, item.id))));
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
      const next = syncMilestones(evaluateAchievements(equipCosmetic(prev, cosmetic.id)));
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
        worlds: {
          ...prev.worlds,
          [worldId]: {
            ...prev.worlds[worldId],
            unlockedAt: prev.worlds[worldId].unlockedAt ?? Date.now()
          }
        },
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
      const now = Date.now();
      const reset = applyEarthPrestige(prev, now);
      if (reset === prev) return prev;
      const withFreshQuests: GameState = {
        ...reset,
        milestones: createInitialMilestoneState(),
        quests: createQuestStateForGameState(reset, now)
      };
      const next = syncMilestones(evaluateAchievements(withFreshQuests, now), now);
      saveGameState(next);
      return next;
    });
  };

  const onBuyJourneyUpgrade = (upgrade: JourneyUpgradeDefinition) => {
    playSoundEffect('purchase', state.settings.soundEnabled);
    setState((prev) => {
      const next = buyJourneyUpgrade(prev, upgrade.id);
      saveGameState(next);
      return next;
    });
  };

  const onSelectTitle = (titleId: string | null) => {
    playSoundEffect('ui', state.settings.soundEnabled);
    setState((prev) => {
      const next = selectProfileTitle(prev, titleId);
      saveGameState(next);
      return next;
    });
  };

  const onApplyDevPreset = (presetId: Parameters<typeof createDevPresetState>[0]) => {
    const preset = createDevPresetState(presetId);
    setState(preset);
    saveGameState(preset);
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
      <GameSceneCanvas
        state={state}
        onEventClaim={onClaimEvent}
        onRouteEncounterClaim={onClaimDefaultRouteEncounter}
        tapPulse={tapPulse}
        onSceneTap={(x, y) => onWalk({ x, y })}
        sceneOverrideId={devLabEnabled ? devLabOverrides.sceneId : null}
        seasonalEventOverrideId={devLabEnabled ? devLabOverrides.seasonalEventId : null}
      />
      <GameHUD
        state={state}
        seasonalEventOverrideId={devLabEnabled ? devLabOverrides.seasonalEventId : null}
        realtimeMilesPerSecond={realtimeMilesPerSecond}
      />

      <NotificationCenter
        state={state}
        onClaimEvent={onClaimEvent}
        onChooseRouteEncounter={onChooseRouteEncounter}
        onDismissOfflineSummary={dismissOfflineSummary}
      />

      <div className="tap-feedback-layer" aria-hidden="true">
        {tapFeedback.map((item) => (
          <div key={item.id} className="tap-feedback" style={{ left: item.x, top: item.y }}>
            +step
          </div>
        ))}
      </div>

      <div className="walk-button-wrap">
        <WalkButton onWalk={() => onWalk()} />
      </div>

      <BottomControls active={state.ui.activeTab} onSelect={openTab} />

      <GameOverlaySheet open={state.ui.activeTab === 'shop' || state.ui.showShop} title="Shop" onClose={closeOverlay}>
        <ShopModal
          state={state}
          onTab={(tab) => setState((prev) => ({ ...prev, ui: { ...prev.ui, shopTab: tab } }))}
          onBuyUpgrade={onBuyUpgrade}
          onBuyFollower={onBuyFollower}
          onBuyCatalogOffer={onBuyCatalogOffer}
          onUseInventoryItem={onUseInventoryItem}
          onEquipEquipment={onEquipEquipment}
          onEquipCosmetic={onEquipCosmetic}
          isUpgradeUnlocked={canUnlock}
          isFollowerUnlocked={canUnlock}
          showAdvanced
        />
        {devLabEnabled && (
          <>
            <MarketplacePanel
              state={state}
              isBridgeConfigured={isWalkerBucksBridgeConfigured}
              isSignedIn={Boolean(authSession?.user)}
              isBusy={walkerBucksBusy}
              onRefreshMarketplace={refreshWalkerBucksMarketplace}
              onPurchaseOffer={onPurchaseMarketplaceOffer}
            />
            <SharedInventoryPanel state={state} />
          </>
        )}
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'quests'} title="Milestones" onClose={closeOverlay}>
        <JourneyPanel state={state} onClaim={onClaimMilestone} />
        <QuestPanel state={state} onClaim={onClaimQuest} />
      </GameOverlaySheet>

      <GameOverlaySheet open={state.ui.activeTab === 'stats'} title="Stats" onClose={closeOverlay}>
        <RegionPanel state={state} />
        <ProgressPanel
          state={state}
          onPrestigeEarth={onPrestigeEarth}
          onBuyJourneyUpgrade={onBuyJourneyUpgrade}
          onSelectWorld={onSelectWorld}
          showAdvancedWorlds={devLabEnabled}
        />
        <CollectionGoalsPanel state={state} onSelectTitle={onSelectTitle} />
        <StatsPanel state={state} />
        <AchievementsPanel state={state} onClaim={onClaimAchievement} />
        {devLabEnabled && (
          <>
            <LeaderboardPanel
              state={state}
              isBridgeConfigured={isWalkerBucksBridgeConfigured}
              isSignedIn={Boolean(authSession?.user)}
              isBusy={walkerBucksBusy}
              onRefreshLeaderboard={refreshWalkerBucksLeaderboard}
            />
          </>
        )}
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
          onCompleteBankLink={completeBankLink}
          onRetryGrant={(grant) => void submitWalkerBucksGrant(grant)}
        />
        <SocialBridgePanel
          isSignedIn={Boolean(authSession?.user)}
          isWalkerBucksBridgeConfigured={isWalkerBucksBridgeConfigured}
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
        {devLabEnabled && (
          <DevLabPanel
            overrides={devLabOverrides}
            musicTracks={MUSIC_TRACKS}
            onChange={setDevLabOverrides}
            onApplyPreset={onApplyDevPreset}
            onSelectMusicTrack={setMusicTrack}
          />
        )}
      </GameOverlaySheet>
    </div>
  );
};

export default App;
