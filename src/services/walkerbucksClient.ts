import type {
  ServerRewardSourceType,
  WalkerBucksBalanceSnapshot,
  WalkerBucksInventoryItem,
  WalkerBucksLeaderboardSnapshot,
  WalkerBucksMarketplaceOffer
} from '../game/types';

const bridgeUrl = import.meta.env.VITE_WALKERBUCKS_BRIDGE_URL?.trim().replace(/\/+$/, '') ?? '';

export const isWalkerBucksBridgeConfigured = bridgeUrl.length > 0;

type BridgeErrorBody = {
  detail?: string;
  error?: string;
  message?: string;
};

export type WalkerBucksRewardGrantRequest = {
  sourceType: ServerRewardSourceType;
  sourceId: string;
  idempotencyKey: string;
};

export type WalkerBucksRewardGrantResponse = {
  status: 'granted';
  accountId: string;
  transactionId: string;
  sourceType: ServerRewardSourceType;
  sourceId: string;
  amount: number;
  idempotencyKey: string;
  balance: WalkerBucksBalanceSnapshot;
};

export type WalkerBucksMarketplaceSnapshot = {
  accountId: string;
  balance: WalkerBucksBalanceSnapshot;
  offers: WalkerBucksMarketplaceOffer[];
  inventory: WalkerBucksInventoryItem[];
  updatedAt: number;
};

export type WalkerBucksMarketplacePurchaseRequest = {
  shopOfferId: number;
  idempotencyKey: string;
};

export type WalkerBucksMarketplacePurchaseResponse = {
  status: 'purchased';
  accountId: string;
  shopOfferId: number;
  itemInstanceId: string;
  itemDefinitionId: number;
  priceWb: number;
  idempotencyKey: string;
  balance: WalkerBucksBalanceSnapshot;
  inventory: WalkerBucksInventoryItem[];
};

export type WalkerBucksBankLinkResponse = {
  status: 'linked';
  accountId: string;
  legacyAccountId: string | null;
  platform: 'wtw';
  platformUserId: string;
  migrationTransactionId: string | null;
  inventory: WalkerBucksInventoryItem[];
  balance: WalkerBucksBalanceSnapshot;
  updatedAt: number;
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as BridgeErrorBody;
    return body.detail ?? body.error ?? body.message ?? `WalkerBucks bridge request failed with ${response.status}.`;
  } catch {
    return `WalkerBucks bridge request failed with ${response.status}.`;
  }
};

const requestBridge = async <T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> => {
  if (!isWalkerBucksBridgeConfigured) {
    throw new Error('WalkerBucks bridge is not configured.');
  }

  const response = await fetch(`${bridgeUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const loadWalkerBucksBalance = async (
  accessToken: string
): Promise<WalkerBucksBalanceSnapshot & { accountId: string; inventory: WalkerBucksInventoryItem[] }> =>
  requestBridge<WalkerBucksBalanceSnapshot & { accountId: string; inventory: WalkerBucksInventoryItem[] }>('/balance', accessToken, {
    method: 'GET'
  });

export const loadWalkerBucksLeaderboard = async (accessToken: string): Promise<WalkerBucksLeaderboardSnapshot> =>
  requestBridge<WalkerBucksLeaderboardSnapshot>('/leaderboards/walkerbucks', accessToken, {
    method: 'GET'
  });

export const loadWalkerBucksMarketplace = async (accessToken: string): Promise<WalkerBucksMarketplaceSnapshot> =>
  requestBridge<WalkerBucksMarketplaceSnapshot>('/marketplace/offers', accessToken, {
    method: 'GET'
  });

export const grantWalkerBucksReward = async (
  accessToken: string,
  grant: WalkerBucksRewardGrantRequest
): Promise<WalkerBucksRewardGrantResponse> =>
  requestBridge<WalkerBucksRewardGrantResponse>('/rewards/grants', accessToken, {
    method: 'POST',
    body: JSON.stringify(grant)
  });

export const completeWalkerBucksBankLink = async (
  accessToken: string,
  linkCode: string
): Promise<WalkerBucksBankLinkResponse> =>
  requestBridge<WalkerBucksBankLinkResponse>('/bank/link', accessToken, {
    method: 'POST',
    body: JSON.stringify({ linkCode })
  });

export const purchaseWalkerBucksMarketplaceOffer = async (
  accessToken: string,
  purchase: WalkerBucksMarketplacePurchaseRequest
): Promise<WalkerBucksMarketplacePurchaseResponse> =>
  requestBridge<WalkerBucksMarketplacePurchaseResponse>('/marketplace/purchases', accessToken, {
    method: 'POST',
    body: JSON.stringify(purchase)
  });
