import { evaluateAchievements, getLocalDateKey } from '../game/achievements';
import { milesFromFeet } from '../game/distance';
import {
  buyOfferFastOptimistic,
  markWtwPurchaseSettled,
  rollbackOptimisticPurchase
} from '../game/economy';
import { getClickMiles, getIdleMilesPerSecond } from '../game/formulas';
import { createInitialGameState } from '../game/initialState';
import { applyDistanceAndWb } from '../game/progression';
import { syncDailyQuests } from '../game/quests';
import type { GameState, WtwPurchase } from '../game/types';
import { syncMilestones } from '../game/milestones';
import { UPGRADES } from '../game/upgrades';
import { buildDebugSnapshot } from './devSnapshots';
import {
  DEFAULT_DEV_ACCOUNT_ID,
  DEV_NEW_USER_ACCOUNT,
  DEV_PLAYER_ACCOUNT,
  getDevAccount,
  type DevAccountId
} from './devAccounts';
import { DEFAULT_DEV_FAILURE_MODE, type DevFailureMode } from './devFailureMode';
import {
  clearTutorialFlags,
  completeCurrentOnboardingStep,
  createCleanTutorialFlags,
  createCompletedOnboarding,
  createCompletedTutorialFlags,
  createNotStartedOnboarding,
  replayOnboarding,
  skipOnboarding,
  startOnboarding
} from './devOnboarding';

export type DevLedgerTransactionKind = 'grant' | 'take' | 'set' | 'spend' | 'refund' | 'reset';

export type DevLedgerTransaction = {
  transactionId: string;
  accountId: string;
  amount: number;
  kind: DevLedgerTransactionKind;
  idempotencyKey: string;
  reasonCode: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type DevLedgerAccount = {
  accountId: DevAccountId;
  displayName: string;
  platformIdentity: string;
  balance: number;
  transactions: DevLedgerTransaction[];
  idempotency: Record<string, string>;
};

export type DevSuiteState = {
  version: 1;
  accounts: Partial<Record<DevAccountId, GameState>>;
  ledger: Partial<Record<DevAccountId, DevLedgerAccount>>;
  failureMode: DevFailureMode;
  shopSeededAt: string | null;
  updatedAt: string;
};

export type DevActionResult = {
  ok: boolean;
  action: string;
  accountId?: DevAccountId;
  before?: unknown;
  after?: unknown;
  transactionId?: string;
  reasonCode?: string;
  idempotencyKey?: string;
  error?: string;
  details?: unknown;
  [key: string]: unknown;
};

type DevShopItemKind = 'upgrade' | 'cosmetic' | 'boost';

export type DevShopItem = {
  commandId: string;
  aliases: string[];
  offerId: string;
  itemId: string;
  label: string;
  priceWb: number;
  kind: DevShopItemKind;
  dpsDelta: number;
  tapDelta: number;
};

const starterShoesUpgrade = UPGRADES.find((upgrade) => upgrade.id === 'starter_shoes');

export const DEV_SHOP_ITEMS: DevShopItem[] = [
  {
    commandId: 'starter-shoes',
    aliases: ['starter_shoes', 'starter shoes', 'starter-shoes'],
    offerId: 'starter-shoes',
    itemId: 'starter_shoes',
    label: 'Starter Shoes',
    priceWb: 500,
    kind: 'upgrade',
    dpsDelta: starterShoesUpgrade?.effectValue ?? milesFromFeet(1),
    tapDelta: 0
  },
  {
    commandId: 'test-cosmetic-hat',
    aliases: ['test_cosmetic_hat', 'test hat', 'test-cosmetic-hat'],
    offerId: 'test-cosmetic-hat',
    itemId: 'test_cosmetic_hat',
    label: 'Test Cosmetic Hat',
    priceWb: 100,
    kind: 'cosmetic',
    dpsDelta: 0,
    tapDelta: 0
  },
  {
    commandId: 'test-boost',
    aliases: ['test_boost', 'test boost'],
    offerId: 'test-boost',
    itemId: 'test_boost',
    label: 'Test Boost',
    priceWb: 200,
    kind: 'boost',
    dpsDelta: milesFromFeet(2),
    tapDelta: 0
  }
];

export class DevActionError extends Error {
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'DevActionError';
    this.details = details;
  }
}

const nowIso = (): string => new Date().toISOString();

const randomId = (prefix: string): string => {
  const uuid = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 14);
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 20)}`;
};

const normalizeAmount = (amount: number): number => Math.max(0, Math.floor(amount));

const emptySuite = (): DevSuiteState => ({
  version: 1,
  accounts: {},
  ledger: {},
  failureMode: { ...DEFAULT_DEV_FAILURE_MODE },
  shopSeededAt: null,
  updatedAt: nowIso()
});

export const createEmptyDevSuiteState = (): DevSuiteState => seedDevSuite(emptySuite()).suite;

const makeBalanceSnapshot = (balance: number, updatedAt = Date.now()) => ({
  assetCode: 'WB' as const,
  balance,
  lockedBalance: 0,
  availableBalance: balance,
  updatedAt
});

const withLedgerBalance = (state: GameState, ledger: DevLedgerAccount, now = Date.now()): GameState => ({
  ...state,
  walkerBucks: 0,
  account: {
    ...state.account,
    provider: 'supabase',
    userId: ledger.accountId,
    email: null,
    cloudSaveUpdatedAt: now,
    lastSyncedAt: now,
    status: 'synced',
    lastSyncError: null
  },
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    status: 'ready',
    accountId: ledger.accountId,
    balance: makeBalanceSnapshot(ledger.balance, now),
    lastCheckedAt: now,
    lastError: null
  }
});

const createDevGameState = (
  accountId: DevAccountId,
  ledger: DevLedgerAccount,
  mode: 'existing' | 'new-user',
  now = Date.now()
): GameState => {
  const base = createInitialGameState(now);
  const cleanBase: GameState = {
    ...base,
    distanceMiles: 0,
    totalWalkerBucksEarned: 0,
    upgrades: {},
    followers: {},
    inventory: {
      items: {},
      equippedEquipmentItemId: null,
      usedConsumables: {}
    },
    cosmetics: {
      owned: {},
      equippedBySlot: {}
    },
    profile: {
      unlockedTitles: {},
      activeTitleId: null
    },
    dailyPlay: {
      lastPlayedDate: getLocalDateKey(now),
      daysPlayed: mode === 'new-user' ? 0 : 1
    },
    dailyClaim: {
      lastClaimAt: null,
      streak: 0
    },
    onboarding: mode === 'new-user' ? createNotStartedOnboarding() : createCompletedOnboarding(new Date(now).toISOString()),
    tutorialFlags: mode === 'new-user' ? createCleanTutorialFlags() : createCompletedTutorialFlags(),
    stats: {
      ...base.stats,
      totalClicks: 0,
      totalDistanceWalked: 0,
      upgradesPurchased: 0,
      followersHired: 0,
      itemsUsed: 0,
      cosmeticsEquipped: 0
    },
    activeBoosts: [],
    ui: {
      ...base.ui,
      offlineSummary: null,
      toast: mode === 'new-user' ? 'Dev new user reset.' : 'Dev Walker reset.'
    }
  };

  return withLedgerBalance({ ...cleanBase, account: { ...cleanBase.account, userId: accountId } }, ledger, now);
};

const createLedgerAccount = (accountId: DevAccountId): DevLedgerAccount => {
  const account = getDevAccount(accountId);
  return {
    accountId: account.accountId,
    displayName: account.displayName,
    platformIdentity: account.platformIdentity,
    balance: 0,
    transactions: [],
    idempotency: {}
  };
};

const getLedgerAccount = (suite: DevSuiteState, accountId: DevAccountId): DevLedgerAccount =>
  suite.ledger[accountId] ?? createLedgerAccount(accountId);

const putAccount = (suite: DevSuiteState, accountId: DevAccountId, ledger: DevLedgerAccount, state: GameState): DevSuiteState => ({
  ...suite,
  ledger: {
    ...suite.ledger,
    [accountId]: ledger
  },
  accounts: {
    ...suite.accounts,
    [accountId]: withLedgerBalance(state, ledger)
  },
  updatedAt: nowIso()
});

const applyLedgerTransaction = (
  ledger: DevLedgerAccount,
  input: {
    amount: number;
    kind: DevLedgerTransactionKind;
    idempotencyKey: string;
    reasonCode: string;
    metadata?: Record<string, string | number | boolean | null>;
  }
): { ledger: DevLedgerAccount; transaction: DevLedgerTransaction; replayed: boolean } => {
  const existingId = ledger.idempotency[input.idempotencyKey];
  const existing = ledger.transactions.find((transaction) => transaction.transactionId === existingId);
  if (existing) return { ledger, transaction: existing, replayed: true };

  const balanceBefore = normalizeAmount(ledger.balance);
  const balanceAfter = balanceBefore + Math.floor(input.amount);
  if (balanceAfter < 0) {
    throw new DevActionError('Insufficient WalkerBucks for dev ledger transaction.', {
      balanceBefore,
      amount: input.amount,
      reasonCode: input.reasonCode
    });
  }

  const transaction: DevLedgerTransaction = {
    transactionId: randomId('txn'),
    accountId: ledger.accountId,
    amount: Math.floor(input.amount),
    kind: input.kind,
    idempotencyKey: input.idempotencyKey,
    reasonCode: input.reasonCode,
    balanceBefore,
    balanceAfter,
    createdAt: nowIso(),
    metadata: input.metadata
  };

  return {
    ledger: {
      ...ledger,
      balance: balanceAfter,
      transactions: [...ledger.transactions, transaction],
      idempotency: {
        ...ledger.idempotency,
        [input.idempotencyKey]: transaction.transactionId
      }
    },
    transaction,
    replayed: false
  };
};

const resolveAccountId = (accountId?: string): DevAccountId =>
  accountId === DEV_NEW_USER_ACCOUNT.accountId ? DEV_NEW_USER_ACCOUNT.accountId : DEV_PLAYER_ACCOUNT.accountId;

export const getDevSuiteAccountState = (suite: DevSuiteState, accountId: string = DEFAULT_DEV_ACCOUNT_ID): GameState => {
  const resolved = resolveAccountId(accountId);
  const ledger = getLedgerAccount(suite, resolved);
  const mode = resolved === DEV_NEW_USER_ACCOUNT.accountId ? 'new-user' : 'existing';
  return suite.accounts[resolved] ?? createDevGameState(resolved, ledger, mode);
};

export const seedDevSuite = (input?: DevSuiteState): { suite: DevSuiteState; result: DevActionResult } => {
  let suite = input ?? emptySuite();
  for (const account of [DEV_PLAYER_ACCOUNT, DEV_NEW_USER_ACCOUNT]) {
    const accountId = account.accountId;
    const ledger = getLedgerAccount(suite, accountId);
    const mode = accountId === DEV_NEW_USER_ACCOUNT.accountId ? 'new-user' : 'existing';
    const state = suite.accounts[accountId] ?? createDevGameState(accountId, ledger, mode);
    suite = putAccount(suite, accountId, ledger, state);
  }

  suite = {
    ...suite,
    shopSeededAt: suite.shopSeededAt ?? nowIso(),
    failureMode: suite.failureMode ?? { ...DEFAULT_DEV_FAILURE_MODE },
    updatedAt: nowIso()
  };

  return {
    suite,
    result: {
      ok: true,
      action: 'dev:seed',
      accounts: [DEV_PLAYER_ACCOUNT.accountId, DEV_NEW_USER_ACCOUNT.accountId],
      shopItems: DEV_SHOP_ITEMS.map((item) => item.commandId)
    }
  };
};

const snapshot = (state: GameState, route = '/dev', isMobile = false) => buildDebugSnapshot(state, route, isMobile);

export const resetDevAccount = (
  input: DevSuiteState,
  accountId: DevAccountId = DEV_PLAYER_ACCOUNT.accountId
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const ledger = createLedgerAccount(accountId);
  const { ledger: resetLedger, transaction } = applyLedgerTransaction(ledger, {
    amount: 0,
    kind: 'reset',
    idempotencyKey: `dev:reset:${accountId}:${randomId('key')}`,
    reasonCode: accountId === DEV_NEW_USER_ACCOUNT.accountId ? 'dev.reset.new_user' : 'dev.reset.existing_player'
  });
  const mode = accountId === DEV_NEW_USER_ACCOUNT.accountId ? 'new-user' : 'existing';
  const state = createDevGameState(accountId, resetLedger, mode);
  const suite = putAccount(seeded, accountId, resetLedger, state);

  return {
    suite,
    result: {
      ok: true,
      action: accountId === DEV_NEW_USER_ACCOUNT.accountId ? 'dev:reset-new-user' : 'dev:reset',
      accountId,
      after: snapshot(state),
      transactionId: transaction.transactionId,
      reasonCode: transaction.reasonCode,
      idempotencyKey: transaction.idempotencyKey
    }
  };
};

export const applyWalletAction = (
  input: DevSuiteState,
  action: 'dev:grant' | 'dev:take' | 'dev:set-wb',
  options: { accountId?: string; amount: number; idempotencyKey?: string }
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const accountId = resolveAccountId(options.accountId);
  const state = getDevSuiteAccountState(seeded, accountId);
  const ledger = getLedgerAccount(seeded, accountId);
  const amount = normalizeAmount(options.amount);
  const before = snapshot(state);
  const reasonCode =
    action === 'dev:grant' ? 'dev.grant.manual' : action === 'dev:take' ? 'dev.take.manual' : 'dev.set.manual';
  const delta = action === 'dev:grant' ? amount : action === 'dev:take' ? -amount : amount - ledger.balance;
  const kind = action === 'dev:grant' ? 'grant' : action === 'dev:take' ? 'take' : 'set';
  const idempotencyKey = options.idempotencyKey ?? `${action}:${accountId}:${randomId('key')}`;
  const { ledger: nextLedger, transaction, replayed } = applyLedgerTransaction(ledger, {
    amount: delta,
    kind,
    idempotencyKey,
    reasonCode
  });
  const nextState = withLedgerBalance(state, nextLedger);
  const suite = putAccount(seeded, accountId, nextLedger, nextState);

  return {
    suite,
    result: {
      ok: true,
      action,
      accountId,
      amount,
      walletBefore: transaction.balanceBefore,
      walletAfter: transaction.balanceAfter,
      before,
      after: snapshot(nextState),
      transactionId: transaction.transactionId,
      reasonCode,
      idempotencyKey,
      replayed
    }
  };
};

export const resolveDevShopItem = (itemId: string): DevShopItem => {
  const normalized = itemId.trim().toLowerCase();
  const item = DEV_SHOP_ITEMS.find((entry) =>
    [entry.commandId, entry.offerId, entry.itemId, ...entry.aliases].some((alias) => alias.toLowerCase() === normalized)
  );
  if (!item) {
    throw new DevActionError('Unknown dev shop item.', {
      itemId,
      knownItems: DEV_SHOP_ITEMS.map((entry) => entry.commandId)
    });
  }
  return item;
};

const incrementRecord = (record: Record<string, number>, key: string, amount = 1): Record<string, number> => ({
  ...record,
  [key]: (record[key] ?? 0) + amount
});

const decrementRecord = (record: Record<string, number>, key: string, amount = 1): Record<string, number> => {
  const next = { ...record };
  const value = Math.max(0, (next[key] ?? 0) - amount);
  if (value > 0) next[key] = value;
  else delete next[key];
  return next;
};

const applyDevItemPurchase = (state: GameState, item: DevShopItem): GameState => {
  const withInventory: GameState = {
    ...state,
    inventory: {
      ...state.inventory,
      items: incrementRecord(state.inventory.items, item.itemId),
      usedConsumables: incrementRecord(state.inventory.usedConsumables, `purchase:${item.offerId}`)
    }
  };

  if (item.kind === 'upgrade') {
    return {
      ...withInventory,
      upgrades: incrementRecord(withInventory.upgrades, item.itemId),
      stats: {
        ...withInventory.stats,
        upgradesPurchased: withInventory.stats.upgradesPurchased + 1
      }
    };
  }

  if (item.kind === 'cosmetic') {
    return {
      ...withInventory,
      cosmetics: {
        ...withInventory.cosmetics,
        owned: {
          ...withInventory.cosmetics.owned,
          [item.itemId]: true
        }
      }
    };
  }

  return {
    ...withInventory,
    activeBoosts: [
      ...withInventory.activeBoosts,
      {
        id: `dev_boost_${Date.now()}`,
        sourceEventId: item.itemId,
        effectType: 'speed_multiplier',
        multiplier: 1.1,
        expiresAt: Date.now() + 900000
      }
    ]
  };
};

const reverseDevItemPurchase = (state: GameState, item: DevShopItem, purchaseId: string): GameState => ({
  ...state,
  inventory: {
    ...state.inventory,
    items: decrementRecord(state.inventory.items, item.itemId),
    usedConsumables: decrementRecord(state.inventory.usedConsumables, `purchase:${item.offerId}`)
  },
  upgrades:
    item.kind === 'upgrade'
      ? decrementRecord(state.upgrades, item.itemId)
      : state.upgrades,
  cosmetics:
    item.kind === 'cosmetic'
      ? {
          ...state.cosmetics,
          owned: Object.fromEntries(Object.entries(state.cosmetics.owned).filter(([id]) => id !== item.itemId))
        }
      : state.cosmetics,
  activeBoosts:
    item.kind === 'boost'
      ? state.activeBoosts.filter((boost) => boost.sourceEventId !== item.itemId)
      : state.activeBoosts,
  stats: {
    ...state.stats,
    upgradesPurchased:
      item.kind === 'upgrade' ? Math.max(0, state.stats.upgradesPurchased - 1) : state.stats.upgradesPurchased
  },
  walkerBucksBridge: {
    ...state.walkerBucksBridge,
    purchases: {
      ...state.walkerBucksBridge.purchases,
      [purchaseId]: {
        ...state.walkerBucksBridge.purchases[purchaseId],
        status: 'rolled_back',
        updatedAt: Date.now()
      }
    }
  }
});

const findPurchaseByIdempotency = (state: GameState, idempotencyKey: string): WtwPurchase | undefined =>
  Object.values(state.walkerBucksBridge.purchases).find((purchase) => purchase.idempotencyKey === idempotencyKey);

const withPurchaseIdempotency = (state: GameState, purchaseId: string, idempotencyKey: string): GameState => {
  const purchase = state.walkerBucksBridge.purchases[purchaseId];
  if (!purchase) return state;
  return {
    ...state,
    walkerBucksBridge: {
      ...state.walkerBucksBridge,
      purchases: {
        ...state.walkerBucksBridge.purchases,
        [purchaseId]: {
          ...purchase,
          idempotencyKey
        }
      }
    }
  };
};

export const buyDevItem = (
  input: DevSuiteState,
  options: {
    accountId?: string;
    itemId: string;
    idempotencyKey?: string;
    optimistic?: boolean;
  }
): { suite: DevSuiteState; result: DevActionResult } => {
  let seeded = seedDevSuite(input).suite;
  const accountId = resolveAccountId(options.accountId);
  const item = resolveDevShopItem(options.itemId);
  const beforeState = getDevSuiteAccountState(seeded, accountId);
  const before = snapshot(beforeState);
  const beforeDps = getIdleMilesPerSecond(beforeState);
  const beforeTap = getClickMiles(beforeState);
  const ledger = getLedgerAccount(seeded, accountId);
  const idempotencyKey = options.idempotencyKey ?? `dev:buy:${accountId}:${item.commandId}:${randomId('key')}`;
  const existingPurchase = findPurchaseByIdempotency(beforeState, idempotencyKey);

  if (existingPurchase) {
    return {
      suite: seeded,
      result: {
        ok: true,
        action: 'dev:buy',
        accountId,
        itemId: item.commandId,
        before,
        after: before,
        transactionId: existingPurchase.walkerBucksTransactionId,
        reasonCode: 'wtw.shop.purchase',
        idempotencyKey,
        replayed: true
      }
    };
  }

  if (seeded.failureMode.nextPurchaseFails) {
    const purchaseId = randomId('purchase');
    const optimistic = buyOfferFastOptimistic(beforeState, {
      supabaseUserId: accountId,
      accountId,
      purchaseId,
      offerId: item.offerId,
      itemDefId: item.itemId,
      itemName: item.label,
      price: item.priceWb,
      quantity: 1,
      sourceType: 'catalog_offer',
      sourceId: `${item.offerId}:dev_failure`,
      dpsDelta: item.dpsDelta,
      applyPurchase: (state) => applyDevItemPurchase(state, item)
    });
    const optimisticState = optimistic.ok
      ? withPurchaseIdempotency(optimistic.state, purchaseId, idempotencyKey)
      : beforeState;
    const rolledBack = optimistic.ok ? rollbackOptimisticPurchase(optimisticState, purchaseId) : optimisticState;
    const nextSuite = putAccount(
      { ...seeded, failureMode: { ...seeded.failureMode, nextPurchaseFails: false } },
      accountId,
      ledger,
      withLedgerBalance(rolledBack, ledger)
    );

    return {
      suite: nextSuite,
      result: {
        ok: false,
        action: 'dev:buy',
        accountId,
        itemId: item.commandId,
        before,
        after: snapshot(rolledBack),
        reasonCode: 'dev.failure.purchase',
        idempotencyKey,
        error: 'Forced dev purchase failure; optimistic state was rolled back.'
      }
    };
  }

  const purchaseId = randomId('purchase');
  const optimistic = buyOfferFastOptimistic(beforeState, {
    supabaseUserId: accountId,
    accountId,
    purchaseId,
    offerId: item.offerId,
    itemDefId: item.itemId,
    itemName: item.label,
    price: item.priceWb,
    quantity: 1,
    sourceType: 'catalog_offer',
    sourceId: `${item.offerId}:purchase_${(beforeState.inventory.usedConsumables[`purchase:${item.offerId}`] ?? 0) + 1}`,
    dpsDelta: item.dpsDelta,
    applyPurchase: (state) => applyDevItemPurchase(state, item)
  });

  if (!optimistic.ok) {
    const nextSuite = putAccount(seeded, accountId, ledger, optimistic.state);
    return {
      suite: nextSuite,
      result: {
        ok: false,
        action: 'dev:buy',
        accountId,
        itemId: item.commandId,
        before,
        after: snapshot(optimistic.state),
        reasonCode: 'wtw.shop.purchase',
        idempotencyKey,
        error: 'reason' in optimistic ? optimistic.reason : 'purchase_failed'
      }
    };
  }

  const withCustomKey = withPurchaseIdempotency(optimistic.state, purchaseId, idempotencyKey);
  const { ledger: spentLedger, transaction, replayed } = applyLedgerTransaction(ledger, {
    amount: -item.priceWb,
    kind: 'spend',
    idempotencyKey,
    reasonCode: 'wtw.shop.purchase',
    metadata: {
      itemId: item.commandId,
      offerId: item.offerId,
      optimistic: options.optimistic ?? true
    }
  });
  let settled = markWtwPurchaseSettled(withLedgerBalance(withCustomKey, spentLedger), purchaseId, transaction.transactionId);
  settled = syncMilestones(syncDailyQuests(evaluateAchievements(settled)));
  seeded = putAccount(seeded, accountId, spentLedger, settled);

  let duplicateResult: DevLedgerTransaction | null = null;
  if (seeded.failureMode.duplicateNextPurchase) {
    const replay = applyLedgerTransaction(spentLedger, {
      amount: -item.priceWb,
      kind: 'spend',
      idempotencyKey,
      reasonCode: 'wtw.shop.purchase',
      metadata: {
        itemId: item.commandId,
        duplicateRequest: true
      }
    });
    duplicateResult = replay.transaction;
    seeded = {
      ...seeded,
      failureMode: {
        ...seeded.failureMode,
        duplicateNextPurchase: false
      }
    };
  }

  const afterState = getDevSuiteAccountState(seeded, accountId);
  return {
    suite: seeded,
    result: {
      ok: true,
      action: 'dev:buy',
      accountId,
      itemId: item.commandId,
      priceWb: item.priceWb,
      walletBefore: transaction.balanceBefore,
      walletAfter: transaction.balanceAfter,
      inventoryBefore: beforeState.inventory.items,
      inventoryAfter: afterState.inventory.items,
      dpsBefore: beforeDps,
      dpsAfter: getIdleMilesPerSecond(afterState),
      tapBefore: beforeTap,
      tapAfter: getClickMiles(afterState),
      before,
      after: snapshot(afterState),
      transactionId: transaction.transactionId,
      reasonCode: 'wtw.shop.purchase',
      idempotencyKey,
      replayed,
      duplicateTransactionId: duplicateResult?.transactionId
    }
  };
};

export const refundLastPurchase = (
  input: DevSuiteState,
  accountIdInput?: string
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const accountId = resolveAccountId(accountIdInput);
  const state = getDevSuiteAccountState(seeded, accountId);
  const ledger = getLedgerAccount(seeded, accountId);
  const purchase = Object.values(state.walkerBucksBridge.purchases)
    .filter((entry) => entry.status === 'settled')
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (!purchase) {
    return {
      suite: seeded,
      result: {
        ok: false,
        action: 'dev:refund-last-purchase',
        accountId,
        before: snapshot(state),
        after: snapshot(state),
        error: 'No settled purchase exists to refund.'
      }
    };
  }

  const item = resolveDevShopItem(purchase.offerId);
  const { ledger: refundedLedger, transaction } = applyLedgerTransaction(ledger, {
    amount: purchase.price * purchase.quantity,
    kind: 'refund',
    idempotencyKey: `dev:refund:${accountId}:${purchase.purchaseId}`,
    reasonCode: 'dev.refund.purchase',
    metadata: {
      purchaseId: purchase.purchaseId,
      itemId: item.commandId
    }
  });
  const reversed = reverseDevItemPurchase(withLedgerBalance(state, refundedLedger), item, purchase.purchaseId);
  const suite = putAccount(seeded, accountId, refundedLedger, reversed);

  return {
    suite,
    result: {
      ok: true,
      action: 'dev:refund-last-purchase',
      accountId,
      itemId: item.commandId,
      walletBefore: transaction.balanceBefore,
      walletAfter: transaction.balanceAfter,
      before: snapshot(state),
      after: snapshot(reversed),
      transactionId: transaction.transactionId,
      reasonCode: transaction.reasonCode,
      idempotencyKey: transaction.idempotencyKey
    }
  };
};

export const updateGameplay = (
  input: DevSuiteState,
  action:
    | 'reset-dt'
    | 'set-dt'
    | 'set-dps'
    | 'set-tap-power'
    | 'simulate-offline-progress'
    | 'clear-offline-progress'
    | 'clear-inventory'
    | 'unlock-all-shop-items',
  options: { accountId?: string; value?: number } = {}
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const accountId = resolveAccountId(options.accountId);
  const state = getDevSuiteAccountState(seeded, accountId);
  const ledger = getLedgerAccount(seeded, accountId);
  const before = snapshot(state);
  let next = state;

  if (action === 'reset-dt' || action === 'set-dt') {
    const distance = action === 'reset-dt' ? 0 : Math.max(0, options.value ?? 1000);
    next = {
      ...next,
      distanceMiles: distance,
      worlds: {
        ...next.worlds,
        [next.currentWorldId]: {
          ...next.worlds[next.currentWorldId],
          distanceMiles: distance
        }
      },
      stats: {
        ...next.stats,
        totalDistanceWalked: Math.max(next.stats.totalDistanceWalked, distance)
      }
    };
  }

  if (action === 'set-dps') {
    next = {
      ...next,
      baseIdleMilesPerSecond: Math.max(0, options.value ?? milesFromFeet(10))
    };
  }

  if (action === 'set-tap-power') {
    next = {
      ...next,
      baseClickMiles: Math.max(0, options.value ?? milesFromFeet(10))
    };
  }

  if (action === 'simulate-offline-progress') {
    const withDistance = applyDistanceAndWb(next, options.value ?? 1);
    next = {
      ...withDistance,
      ui: {
        ...withDistance.ui,
        offlineSummary: {
          distance: options.value ?? 1,
          wb: 0
        }
      }
    };
  }

  if (action === 'clear-offline-progress') {
    next = {
      ...next,
      ui: {
        ...next.ui,
        offlineSummary: null
      }
    };
  }

  if (action === 'clear-inventory') {
    next = {
      ...next,
      inventory: {
        items: {},
        equippedEquipmentItemId: null,
        usedConsumables: {}
      },
      cosmetics: {
        owned: {},
        equippedBySlot: {}
      },
      activeBoosts: []
    };
  }

  if (action === 'unlock-all-shop-items') {
    next = DEV_SHOP_ITEMS.reduce((current, item) => applyDevItemPurchase(current, item), next);
  }

  const suite = putAccount(seeded, accountId, ledger, next);
  return {
    suite,
    result: {
      ok: true,
      action: `dev:${action}`,
      accountId,
      before,
      after: snapshot(next)
    }
  };
};

export const applyOnboardingAction = (
  input: DevSuiteState,
  action:
    | 'start'
    | 'complete-step'
    | 'skip'
    | 'replay'
    | 'clear-tutorial-flags'
    | 'grant-starter-pack'
    | 'simulate-first-purchase'
    | 'simulate-first-offline-return'
    | 'simulate-first-wb-sync',
  accountIdInput: string = DEV_NEW_USER_ACCOUNT.accountId
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const accountId = resolveAccountId(accountIdInput);
  const state = getDevSuiteAccountState(seeded, accountId);
  const ledger = getLedgerAccount(seeded, accountId);
  const before = snapshot(state);
  let next = state;
  let suite = seeded;
  let transaction: DevLedgerTransaction | null = null;

  if (action === 'start') next = startOnboarding(next);
  if (action === 'complete-step') next = completeCurrentOnboardingStep(startOnboarding(next));
  if (action === 'skip') next = skipOnboarding(next);
  if (action === 'replay') next = replayOnboarding(next);
  if (action === 'clear-tutorial-flags') next = clearTutorialFlags(next);

  if (action === 'grant-starter-pack' || action === 'simulate-first-wb-sync') {
    const grant = applyLedgerTransaction(ledger, {
      amount: action === 'grant-starter-pack' ? 500 : 100,
      kind: 'grant',
      idempotencyKey: `dev:onboarding:${action}:${accountId}:${randomId('key')}`,
      reasonCode: action === 'grant-starter-pack' ? 'dev.onboarding.starter_pack' : 'dev.onboarding.first_wb_sync'
    });
    transaction = grant.transaction;
    next = withLedgerBalance(next, grant.ledger);
    suite = putAccount(seeded, accountId, grant.ledger, next);
  } else if (action === 'simulate-first-purchase') {
    return buyDevItem(seeded, { accountId, itemId: 'starter-shoes' });
  } else if (action === 'simulate-first-offline-return') {
    const withDistance = applyDistanceAndWb(next, 1);
    next = {
      ...withDistance,
      ui: {
        ...withDistance.ui,
        offlineSummary: {
          distance: 1,
          wb: 0
        }
      }
    };
  }

  if (action !== 'grant-starter-pack' && action !== 'simulate-first-wb-sync') {
    suite = putAccount(seeded, accountId, ledger, next);
  }

  return {
    suite,
    result: {
      ok: true,
      action: `dev:onboarding:${action}`,
      accountId,
      before,
      after: snapshot(next),
      transactionId: transaction?.transactionId,
      reasonCode: transaction?.reasonCode,
      idempotencyKey: transaction?.idempotencyKey
    }
  };
};

export const setFailureModeForSuite = (
  input: DevSuiteState,
  mode: Partial<DevFailureMode>
): { suite: DevSuiteState; result: DevActionResult } => {
  const seeded = seedDevSuite(input).suite;
  const nextMode: DevFailureMode = {
    ...seeded.failureMode,
    ...mode,
    latencyMs: (mode.latencyMs ?? seeded.failureMode.latencyMs) as DevFailureMode['latencyMs']
  };
  const suite = {
    ...seeded,
    failureMode: nextMode,
    updatedAt: nowIso()
  };
  return {
    suite,
    result: {
      ok: true,
      action: 'dev:failure-mode',
      after: nextMode
    }
  };
};

export const clearFailureModeForSuite = (input: DevSuiteState): { suite: DevSuiteState; result: DevActionResult } =>
  setFailureModeForSuite(input, { ...DEFAULT_DEV_FAILURE_MODE });

export const getDevSnapshot = (
  input: DevSuiteState,
  accountIdInput: string = DEFAULT_DEV_ACCOUNT_ID,
  route = '/dev',
  isMobile = false
): { suite: DevSuiteState; result: DevActionResult } => {
  const suite = seedDevSuite(input).suite;
  const accountId = resolveAccountId(accountIdInput);
  const state = getDevSuiteAccountState(suite, accountId);
  return {
    suite,
    result: {
      ok: true,
      action: 'dev:snapshot',
      accountId,
      snapshot: snapshot(state, route, isMobile),
      failureMode: suite.failureMode,
      shopItems: DEV_SHOP_ITEMS
    }
  };
};

export const seedShop = (input: DevSuiteState): { suite: DevSuiteState; result: DevActionResult } => {
  const suite = {
    ...seedDevSuite(input).suite,
    shopSeededAt: nowIso()
  };
  return {
    suite,
    result: {
      ok: true,
      action: 'dev:seed-shop',
      shopItems: DEV_SHOP_ITEMS
    }
  };
};
