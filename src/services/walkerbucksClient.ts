import type { ServerRewardSourceType, WalkerBucksBalanceSnapshot } from '../game/types';

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

export const loadWalkerBucksBalance = async (accessToken: string): Promise<WalkerBucksBalanceSnapshot & { accountId: string }> =>
  requestBridge<WalkerBucksBalanceSnapshot & { accountId: string }>('/balance', accessToken, {
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
