import type {
  GameState,
  ServerRewardSourceType,
  ServerSpendSourceType,
  WalkerBucksBalanceSnapshot,
  WalkerBucksInventoryItem,
  WalkerBucksMarketplaceOffer,
  WalkerBucksMarketplacePurchase,
  WalkerBucksRewardGrant,
  WalkerBucksSpend
} from './types';

type ServerBackedWalkerBucksReward = {
  sourceType: ServerRewardSourceType;
  sourceId: string;
  label: string;
  amount: number;
  reasonCode: string;
};

const SERVER_BACKED_ACHIEVEMENT_REWARDS: Record<string, ServerBackedWalkerBucksReward> = {
  day_one_check_in: {
    sourceType: 'achievement',
    sourceId: 'day_one_check_in',
    label: 'Day One Walker',
    amount: 20,
    reasonCode: 'webgame.achievement.day_one_check_in'
  }
};

export const getServerBackedAchievementReward = (
  achievementId: string
): ServerBackedWalkerBucksReward | undefined => SERVER_BACKED_ACHIEVEMENT_REWARDS[achievementId];

export const getSpendableWalkerBucks = (state: GameState): number =>
  state.walkerBucksBridge.balance?.availableBalance ?? 0;

export const queueWalkerBucksGrantAmount = (
  state: GameState,
  amount: number,
  now = Date.now()
): GameState => {
  const grantAmount = Math.floor(amount);
  if (grantAmount <= 0) return state;

  return {
    ...state,
    totalWalkerBucksEarned: state.totalWalkerBucksEarned + grantAmount,
    walkerBucksBridge: {
      ...state.walkerBucksBridge,
      pendingGrantAmount: state.walkerBucksBridge.pendingGrantAmount + grantAmount
    },
    ui: {
      ...state.ui,
      recentRewards: [
        {
          id: `wb_pending_${now}_${state.ui.recentRewards.length}`,
          label: `+${grantAmount.toLocaleString()} WB queued`,
          createdAt: now
        },
        ...state.ui.recentRewards
      ].slice(0, 4)
    }
  };
};

export const getRewardGrantStateId = (sourceType: ServerRewardSourceType, sourceId: string): string =>
  `${sourceType}:${sourceId}`;

export const deriveWalkerBucksIdempotencyKey = (
  supabaseUserId: string,
  sourceType: ServerRewardSourceType,
  sourceId: string
): string => `wtw:supabase:${supabaseUserId}:${sourceType}:${sourceId}`;

export const createPendingWalkerBucksGrant = (
  supabaseUserId: string,
  reward: ServerBackedWalkerBucksReward,
  now = Date.now()
): WalkerBucksRewardGrant => ({
  id: getRewardGrantStateId(reward.sourceType, reward.sourceId),
  sourceType: reward.sourceType,
  sourceId: reward.sourceId,
  label: reward.label,
  amount: reward.amount,
  idempotencyKey: deriveWalkerBucksIdempotencyKey(supabaseUserId, reward.sourceType, reward.sourceId),
  reasonCode: reward.reasonCode,
  status: 'pending',
  attempts: 0,
  transactionId: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  settledAt: null
});

export const createPendingWalkerBucksBatchGrant = (
  supabaseUserId: string,
  amount: number,
  sequence: number,
  now = Date.now()
): WalkerBucksRewardGrant =>
  createPendingWalkerBucksGrant(
    supabaseUserId,
    {
      sourceType: 'walking',
      sourceId: `batch_${sequence}`,
      label: 'Walk The World earnings',
      amount,
      reasonCode: 'webgame.reward.walking'
    },
    now
  );

export const createPendingLegacyWalkerBucksMigration = (
  supabaseUserId: string,
  amount: number,
  now = Date.now()
): WalkerBucksRewardGrant =>
  createPendingWalkerBucksGrant(
    supabaseUserId,
    {
      sourceType: 'legacy_migration',
      sourceId: 'local_save_balance_v8',
      label: 'Legacy WTW balance migration',
      amount,
      reasonCode: 'webgame.reward.legacy_migration'
    },
    now
  );

export const upsertWalkerBucksGrant = (state: GameState, grant: WalkerBucksRewardGrant): GameState => ({
  ...state,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    rewardGrants: {
      ...state.walkerBucksBridge.rewardGrants,
      [grant.id]: grant
    }
  }
});

export const markWalkerBucksGrantAttempt = (
  state: GameState,
  grantId: string,
  now = Date.now()
): GameState => {
  const grant = state.walkerBucksBridge.rewardGrants[grantId];
  if (!grant) return state;

  return upsertWalkerBucksGrant(state, {
    ...grant,
    status: 'pending',
    attempts: grant.attempts + 1,
    lastError: null,
    updatedAt: now
  });
};

export const markWalkerBucksGrantFailed = (
  state: GameState,
  grantId: string,
  message: string,
  now = Date.now()
): GameState => {
  const grant = state.walkerBucksBridge.rewardGrants[grantId];
  if (!grant) return state;

  return upsertWalkerBucksGrant(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'error',
        lastError: message
      }
    },
    {
      ...grant,
      status: 'failed',
      lastError: message,
      updatedAt: now
    }
  );
};

export const markWalkerBucksGrantGranted = (
  state: GameState,
  grantId: string,
  transactionId: string,
  accountId: string,
  balance: WalkerBucksBalanceSnapshot,
  now = Date.now()
): GameState => {
  const grant = state.walkerBucksBridge.rewardGrants[grantId];
  if (!grant) return state;

  return upsertWalkerBucksGrant(
    {
      ...state,
      walkerBucks: grant.sourceType === 'legacy_migration' ? 0 : state.walkerBucks,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'ready',
        accountId,
        balance,
        lastCheckedAt: now,
        lastError: null
      }
    },
    {
      ...grant,
      status: 'granted',
      transactionId,
      lastError: null,
      updatedAt: now,
      settledAt: now
    }
  );
};

export const getOpenWalkerBucksGrants = (state: GameState): WalkerBucksRewardGrant[] =>
  Object.values(state.walkerBucksBridge.rewardGrants).filter((grant) => grant.status !== 'granted');

export const getWalkerBucksSpendStateId = (sourceType: ServerSpendSourceType, sourceId: string): string =>
  `${sourceType}:${sourceId}`;

export const deriveWalkerBucksSpendIdempotencyKey = (
  supabaseUserId: string,
  sourceType: ServerSpendSourceType,
  sourceId: string
): string => `wtw:supabase:${supabaseUserId}:spend:${sourceType}:${sourceId}`;

export const createPendingWalkerBucksSpend = (
  supabaseUserId: string,
  sourceType: ServerSpendSourceType,
  sourceId: string,
  label: string,
  amount: number,
  now = Date.now()
): WalkerBucksSpend => ({
  id: getWalkerBucksSpendStateId(sourceType, sourceId),
  sourceType,
  sourceId,
  label,
  amount,
  idempotencyKey: deriveWalkerBucksSpendIdempotencyKey(supabaseUserId, sourceType, sourceId),
  status: 'pending',
  attempts: 0,
  transactionId: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  settledAt: null
});

export const upsertWalkerBucksSpend = (state: GameState, spend: WalkerBucksSpend): GameState => ({
  ...state,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    spends: {
      ...state.walkerBucksBridge.spends,
      [spend.id]: spend
    }
  }
});

export const markWalkerBucksSpendAttempt = (
  state: GameState,
  spendId: string,
  now = Date.now()
): GameState => {
  const spend = state.walkerBucksBridge.spends[spendId];
  if (!spend) return state;

  return upsertWalkerBucksSpend(state, {
    ...spend,
    status: 'pending',
    attempts: spend.attempts + 1,
    lastError: null,
    updatedAt: now
  });
};

export const markWalkerBucksSpendFailed = (
  state: GameState,
  spendId: string,
  message: string,
  now = Date.now()
): GameState => {
  const spend = state.walkerBucksBridge.spends[spendId];
  if (!spend) return state;

  return upsertWalkerBucksSpend(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'error',
        lastError: message
      }
    },
    {
      ...spend,
      status: 'failed',
      lastError: message,
      updatedAt: now
    }
  );
};

export const markWalkerBucksSpendSpent = (
  state: GameState,
  spendId: string,
  transactionId: string,
  accountId: string,
  balance: WalkerBucksBalanceSnapshot,
  now = Date.now()
): GameState => {
  const spend = state.walkerBucksBridge.spends[spendId];
  if (!spend) return state;

  return upsertWalkerBucksSpend(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'ready',
        accountId,
        balance,
        lastCheckedAt: now,
        lastError: null
      }
    },
    {
      ...spend,
      status: 'spent',
      transactionId,
      lastError: null,
      updatedAt: now,
      settledAt: now
    }
  );
};

export const getMarketplacePurchaseStateId = (shopOfferId: number): string => `marketplace:offer:${shopOfferId}`;

export const deriveMarketplaceIdempotencyKey = (supabaseUserId: string, shopOfferId: number): string =>
  `wtw:supabase:${supabaseUserId}:marketplace:offer:${shopOfferId}`;

export const createPendingMarketplacePurchase = (
  supabaseUserId: string,
  offer: WalkerBucksMarketplaceOffer,
  now = Date.now()
): WalkerBucksMarketplacePurchase => ({
  id: getMarketplacePurchaseStateId(offer.id),
  shopOfferId: offer.id,
  itemDefinitionId: offer.itemDefinitionId,
  label: offer.name,
  priceWb: offer.priceWb,
  idempotencyKey: deriveMarketplaceIdempotencyKey(supabaseUserId, offer.id),
  status: 'pending',
  attempts: 0,
  itemInstanceId: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  settledAt: null
});

export const upsertMarketplacePurchase = (
  state: GameState,
  purchase: WalkerBucksMarketplacePurchase
): GameState => ({
  ...state,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    marketplacePurchases: {
      ...state.walkerBucksBridge.marketplacePurchases,
      [purchase.id]: purchase
    }
  }
});

export const markMarketplacePurchaseAttempt = (
  state: GameState,
  purchaseId: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.marketplacePurchases[purchaseId];
  if (!purchase) return state;

  return upsertMarketplacePurchase(state, {
    ...purchase,
    status: 'pending',
    attempts: purchase.attempts + 1,
    lastError: null,
    updatedAt: now
  });
};

export const markMarketplacePurchaseFailed = (
  state: GameState,
  purchaseId: string,
  message: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.marketplacePurchases[purchaseId];
  if (!purchase) return state;

  return upsertMarketplacePurchase(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'error',
        lastError: message
      }
    },
    {
      ...purchase,
      status: 'failed',
      lastError: message,
      updatedAt: now
    }
  );
};

export const markMarketplacePurchasePurchased = (
  state: GameState,
  purchaseId: string,
  itemInstanceId: string,
  itemDefinitionId: number,
  priceWb: number,
  accountId: string,
  balance: WalkerBucksBalanceSnapshot,
  inventory: WalkerBucksInventoryItem[],
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.marketplacePurchases[purchaseId];
  if (!purchase) return state;

  return upsertMarketplacePurchase(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'ready',
        accountId,
        balance,
        inventory,
        lastCheckedAt: now,
        lastError: null
      }
    },
    {
      ...purchase,
      itemInstanceId,
      itemDefinitionId,
      priceWb,
      status: 'purchased',
      lastError: null,
      updatedAt: now,
      settledAt: now
    }
  );
};
