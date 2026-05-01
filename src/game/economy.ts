import type {
  GameState,
  ServerRewardSourceType,
  ServerSpendSourceType,
  WalkerBucksBalanceSnapshot,
  WalkerBucksInventoryItem,
  WalkerBucksMarketplaceOffer,
  WalkerBucksMarketplacePurchase,
  WalkerBucksRewardGrant,
  WalkerBucksSpend,
  WtwPurchase,
  WtwPurchaseStatus,
  WtwWalletState
} from './types';
import { getCatalogInventoryItemById } from './items';

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

const OPTIMISTIC_PENDING_PURCHASE_STATUSES = new Set<WtwPurchaseStatus>([
  'optimistic_applied',
  'settling',
  'settlement_failed'
]);

const normalizeWbAmount = (amount: number): number => Math.max(0, Math.floor(amount));

export const getPendingWalkerBucksSpend = (state: GameState): number =>
  Object.values(state.walkerBucksBridge.purchases).reduce((total, purchase) => {
    if (!OPTIMISTIC_PENDING_PURCHASE_STATUSES.has(purchase.status)) return total;
    return total + normalizeWbAmount(purchase.price) * Math.max(1, Math.floor(purchase.quantity));
  }, 0);

export const getWtwWalletState = (state: GameState): WtwWalletState => {
  const syncedWbBalance = normalizeWbAmount(state.walkerBucksBridge.balance?.availableBalance ?? 0);
  const pendingSpend = getPendingWalkerBucksSpend(state);
  const displayedWbBalance = Math.max(0, syncedWbBalance - pendingSpend);

  return {
    syncedWbBalance,
    pendingSpend,
    displayedWbBalance,
    spendableWb: displayedWbBalance,
    lastSyncedAt: state.walkerBucksBridge.lastCheckedAt
  };
};

export const getSpendableWalkerBucks = (state: GameState): number => getWtwWalletState(state).spendableWb;

export type FastOptimisticPurchaseInput = {
  supabaseUserId: string;
  accountId: string;
  purchaseId: string;
  offerId: string;
  itemDefId: string;
  itemName: string;
  price: number;
  sourceType: ServerSpendSourceType;
  sourceId: string;
  dpsDelta: number;
  quantity?: number;
  applyPurchase: (state: GameState) => GameState;
  now?: number;
};

export type FastOptimisticPurchaseResult =
  | {
      ok: true;
      state: GameState;
      purchase: WtwPurchase;
    }
  | {
      ok: false;
      state: GameState;
      reason: 'not_enough_wb' | 'invalid_price' | 'purchase_exists';
    };

export const createWtwPurchaseId = (now = Date.now()): string => {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `purchase_${now}_${random}`;
};

export const deriveWtwPurchaseIdempotencyKey = (
  supabaseUserId: string,
  offerId: string,
  purchaseId: string
): string => `wtw:supabase:${supabaseUserId}:shop:${offerId}:${purchaseId}`;

export const upsertWtwPurchase = (state: GameState, purchase: WtwPurchase): GameState => ({
  ...state,
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    purchases: {
      ...state.walkerBucksBridge.purchases,
      [purchase.purchaseId]: purchase
    }
  }
});

export const buyOfferFastOptimistic = (
  state: GameState,
  input: FastOptimisticPurchaseInput
): FastOptimisticPurchaseResult => {
  const price = normalizeWbAmount(input.price);
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const now = input.now ?? Date.now();

  if (price <= 0) {
    return { ok: false, state, reason: 'invalid_price' };
  }
  if (state.walkerBucksBridge.purchases[input.purchaseId]) {
    return { ok: false, state, reason: 'purchase_exists' };
  }
  if (price * quantity > getSpendableWalkerBucks(state)) {
    return {
      ok: false,
      state: {
        ...state,
        ui: {
          ...state.ui,
          toast: 'Not enough WalkerBucks'
        }
      },
      reason: 'not_enough_wb'
    };
  }

  const purchase: WtwPurchase = {
    purchaseId: input.purchaseId,
    idempotencyKey: deriveWtwPurchaseIdempotencyKey(input.supabaseUserId, input.offerId, input.purchaseId),
    accountId: input.accountId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    offerId: input.offerId,
    itemDefId: input.itemDefId,
    itemName: input.itemName,
    price,
    quantity,
    dpsDelta: input.dpsDelta,
    status: 'optimistic_applied',
    createdAt: now,
    updatedAt: now
  };

  const withPurchase = upsertWtwPurchase(state, purchase);
  const applied = input.applyPurchase(withPurchase);

  return {
    ok: true,
    state: {
      ...applied,
      walkerBucksBridge: {
        ...applied.walkerBucksBridge,
        purchases: {
          ...applied.walkerBucksBridge.purchases,
          [purchase.purchaseId]: purchase
        }
      }
    },
    purchase
  };
};

export const markWtwPurchaseSettling = (
  state: GameState,
  purchaseId: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.purchases[purchaseId];
  if (!purchase || purchase.status === 'settled' || purchase.status === 'rolled_back') return state;

  return upsertWtwPurchase(state, {
    ...purchase,
    status: 'settling',
    errorCode: undefined,
    errorMessage: undefined,
    updatedAt: now
  });
};

export const markWtwPurchaseSettlementFailed = (
  state: GameState,
  purchaseId: string,
  message: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.purchases[purchaseId];
  if (!purchase || purchase.status === 'settled' || purchase.status === 'rolled_back') return state;

  return upsertWtwPurchase(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        lastError: message
      }
    },
    {
      ...purchase,
      status: 'settlement_failed',
      errorMessage: message,
      updatedAt: now
    }
  );
};

export const markWtwPurchaseSettled = (
  state: GameState,
  purchaseId: string,
  walkerBucksTransactionId: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.purchases[purchaseId];
  if (!purchase) return state;

  return upsertWtwPurchase(
    {
      ...state,
      walkerBucksBridge: {
        ...state.walkerBucksBridge,
        status: 'ready',
        lastCheckedAt: now,
        lastError: null
      }
    },
    {
      ...purchase,
      status: 'settled',
      walkerBucksTransactionId,
      errorCode: undefined,
      errorMessage: undefined,
      updatedAt: now
    }
  );
};

const decrementRecord = (record: Record<string, number>, key: string, amount: number): Record<string, number> => {
  const next = { ...record };
  const value = Math.max(0, (next[key] ?? 0) - amount);
  if (value > 0) {
    next[key] = value;
  } else {
    delete next[key];
  }
  return next;
};

export const rollbackOptimisticPurchase = (
  state: GameState,
  purchaseId: string,
  now = Date.now()
): GameState => {
  const purchase = state.walkerBucksBridge.purchases[purchaseId];
  if (!purchase || purchase.status === 'settled' || purchase.status === 'rolled_back') return state;

  let next: GameState = state;
  if (purchase.sourceType === 'upgrade') {
    next = {
      ...next,
      upgrades: decrementRecord(next.upgrades, purchase.itemDefId, purchase.quantity),
      stats: {
        ...next.stats,
        upgradesPurchased: Math.max(0, next.stats.upgradesPurchased - purchase.quantity)
      }
    };
  }

  if (purchase.sourceType === 'follower') {
    next = {
      ...next,
      followers: decrementRecord(next.followers, purchase.itemDefId, purchase.quantity),
      stats: {
        ...next.stats,
        followersHired: Math.max(0, next.stats.followersHired - purchase.quantity)
      }
    };
  }

  if (purchase.sourceType === 'catalog_offer') {
    const items = decrementRecord(next.inventory.items, purchase.itemDefId, purchase.quantity);
    const catalogItem = getCatalogInventoryItemById(purchase.itemDefId);
    const cosmeticId = catalogItem?.cosmeticId;
    const titleId = catalogItem?.titleId;
    const shouldRemoveCosmetic = catalogItem?.type === 'cosmetic' && cosmeticId && !items[purchase.itemDefId];
    const shouldRemoveTitle = Boolean(titleId && !items[purchase.itemDefId]);
    const ownedCosmetics = shouldRemoveCosmetic
      ? Object.fromEntries(Object.entries(next.cosmetics.owned).filter(([id]) => id !== cosmeticId))
      : next.cosmetics.owned;
    const equippedBySlot = shouldRemoveCosmetic
      ? Object.fromEntries(Object.entries(next.cosmetics.equippedBySlot).filter(([, id]) => id !== cosmeticId))
      : next.cosmetics.equippedBySlot;
    const unlockedTitles = shouldRemoveTitle
      ? Object.fromEntries(Object.entries(next.profile.unlockedTitles).filter(([id]) => id !== titleId))
      : next.profile.unlockedTitles;
    next = {
      ...next,
      inventory: {
        ...next.inventory,
        items,
        equippedEquipmentItemId:
          next.inventory.equippedEquipmentItemId === purchase.itemDefId && !items[purchase.itemDefId]
            ? null
            : next.inventory.equippedEquipmentItemId,
        usedConsumables: decrementRecord(next.inventory.usedConsumables, `purchase:${purchase.offerId}`, purchase.quantity)
      },
      cosmetics: {
        ...next.cosmetics,
        owned: ownedCosmetics,
        equippedBySlot
      },
      profile: {
        ...next.profile,
        unlockedTitles,
        activeTitleId: shouldRemoveTitle && next.profile.activeTitleId === titleId ? null : next.profile.activeTitleId
      }
    };
  }

  return upsertWtwPurchase(
    {
      ...next,
      ui: {
        ...next.ui,
        toast: 'Could not sync. Balance refreshed.'
      }
    },
    {
      ...purchase,
      status: 'rolled_back',
      updatedAt: now
    }
  );
};

export const getSettlementFailedWtwPurchases = (state: GameState): WtwPurchase[] =>
  Object.values(state.walkerBucksBridge.purchases).filter((purchase) => purchase.status === 'settlement_failed');

export const rollbackSettlementFailedWtwPurchases = (
  state: GameState,
  now = Date.now()
): GameState =>
  getSettlementFailedWtwPurchases(state).reduce(
    (next, purchase) => rollbackOptimisticPurchase(next, purchase.purchaseId, now),
    state
  );

export const getUnsettledWtwPurchases = (state: GameState): WtwPurchase[] =>
  Object.values(state.walkerBucksBridge.purchases).filter((purchase) =>
    purchase.status === 'optimistic_applied' || purchase.status === 'settling'
  );

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

export const getPendingWalkerBucksGrants = (state: GameState): WalkerBucksRewardGrant[] =>
  Object.values(state.walkerBucksBridge.rewardGrants).filter((grant) => grant.status === 'pending');

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
