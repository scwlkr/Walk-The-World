import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseUser = {
  id: string;
};

type AccountOut = {
  id: string;
  username: string;
  frozen: boolean;
};

type WalletOut = {
  account_id: string;
  asset_code: 'WB';
  balance: number;
  locked_balance: number;
  available_balance: number;
};

type RewardGrantRequest = {
  sourceType?: string;
  sourceId?: string;
  idempotencyKey?: string;
};

type RewardDefinition = {
  sourceType: 'achievement';
  sourceId: string;
  amount: number;
  reasonCode: string;
  description: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const rewardCatalog: Record<string, RewardDefinition> = {
  'achievement:day_one_check_in': {
    sourceType: 'achievement',
    sourceId: 'day_one_check_in',
    amount: 20,
    reasonCode: 'webgame.achievement.day_one_check_in',
    description: 'Walk The World Day One Walker achievement'
  }
};

class BridgeError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new BridgeError(500, `${name} is not configured.`);
  return value;
};

const getSupabaseUser = async (request: Request): Promise<SupabaseUser> => {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new BridgeError(401, 'Missing Supabase bearer token.');
  }

  const supabase = createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_ANON_KEY'), {
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new BridgeError(401, error?.message ?? 'Supabase user not authenticated.');
  }

  return { id: data.user.id };
};

const walkerBucksFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const apiUrl = getRequiredEnv('WALKERBUCKS_API_URL').replace(/\/+$/, '');
  const serviceToken = Deno.env.get('WALKERBUCKS_SERVICE_TOKEN')?.trim();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    let detail = `WalkerBucks API request failed with ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      // keep the generic message
    }
    throw new BridgeError(response.status >= 500 ? 502 : response.status, detail);
  }

  return (await response.json()) as T;
};

const rewardKey = (sourceType: string, sourceId: string): string => `${sourceType}:${sourceId}`;

const deriveIdempotencyKey = (userId: string, reward: RewardDefinition): string =>
  `wtw:supabase:${userId}:${reward.sourceType}:${reward.sourceId}`;

const resolveAccount = async (user: SupabaseUser): Promise<AccountOut> => {
  const account = await walkerBucksFetch<AccountOut>('/v1/accounts', {
    method: 'POST',
    body: JSON.stringify({
      username: `wtw:${user.id}`
    })
  });

  try {
    await walkerBucksFetch('/v1/accounts/link-platform', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.id,
        platform: 'supabase',
        external_id: user.id
      })
    });
  } catch {
    // The current WalkerBucks API has no platform lookup endpoint, so duplicate
    // link attempts are ignored while deterministic username mapping remains.
  }

  return account;
};

const loadWallet = async (accountId: string): Promise<WalletOut> =>
  walkerBucksFetch<WalletOut>(`/v1/wallets/${accountId}`);

const toBalanceResponse = (wallet: WalletOut, updatedAt: number) => ({
  assetCode: wallet.asset_code,
  balance: wallet.balance,
  lockedBalance: wallet.locked_balance,
  availableBalance: wallet.available_balance,
  updatedAt
});

const handleBalance = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const account = await resolveAccount(user);
  const wallet = await loadWallet(account.id);
  return jsonResponse({
    accountId: account.id,
    ...toBalanceResponse(wallet, Date.now())
  });
};

const handleGrant = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const payload = (await request.json()) as RewardGrantRequest;
  if (!payload.sourceType || !payload.sourceId || !payload.idempotencyKey) {
    throw new BridgeError(400, 'sourceType, sourceId, and idempotencyKey are required.');
  }

  const reward = rewardCatalog[rewardKey(payload.sourceType, payload.sourceId)];
  if (!reward) {
    throw new BridgeError(400, 'Unknown WalkerBucks reward source.');
  }

  const expectedKey = deriveIdempotencyKey(user.id, reward);
  if (payload.idempotencyKey !== expectedKey) {
    throw new BridgeError(400, 'Idempotency key does not match the authenticated user and reward source.');
  }

  const account = await resolveAccount(user);
  const grant = await walkerBucksFetch<{ transaction_id: string }>('/v1/rewards/grants', {
    method: 'POST',
    body: JSON.stringify({
      account_id: account.id,
      amount: reward.amount,
      idempotency_key: expectedKey,
      reason_code: reward.reasonCode,
      description: reward.description
    })
  });
  const wallet = await loadWallet(account.id);

  return jsonResponse({
    status: 'granted',
    accountId: account.id,
    transactionId: grant.transaction_id,
    sourceType: reward.sourceType,
    sourceId: reward.sourceId,
    amount: reward.amount,
    idempotencyKey: expectedKey,
    balance: toBalanceResponse(wallet, Date.now())
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const path = new URL(request.url).pathname.replace(/\/+$/, '');

    if (request.method === 'GET' && path.endsWith('/balance')) {
      return await handleBalance(request);
    }

    if (request.method === 'POST' && path.endsWith('/rewards/grants')) {
      return await handleGrant(request);
    }

    return jsonResponse({ detail: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof BridgeError) {
      return jsonResponse({ detail: error.message }, error.status);
    }

    return jsonResponse({ detail: 'WalkerBucks bridge failed.' }, 500);
  }
});
