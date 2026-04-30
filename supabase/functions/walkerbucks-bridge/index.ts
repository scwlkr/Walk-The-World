import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseUser = {
  id: string;
  email: string | null;
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

type LeaderboardRowOut = {
  account_id: string;
  balance: number;
};

type ItemDefinitionOut = {
  id: number;
  name: string;
  description: string;
  consumable: boolean;
};

type ShopOfferOut = {
  id: number;
  shop_id: number;
  item_definition_id: number;
  price_wb: number;
};

type InventoryItemOut = {
  item_instance_id: string;
  item_definition_id: number;
  status: string;
};

type RewardGrantRequest = {
  sourceType?: string;
  sourceId?: string;
  idempotencyKey?: string;
};

type BankLinkRequest = {
  linkCode?: string;
};

type MarketplacePurchaseRequest = {
  shopOfferId?: number;
  idempotencyKey?: string;
};

type RewardDefinition = {
  sourceType: 'achievement';
  sourceId: string;
  amount: number;
  reasonCode: string;
  description: string;
};

const WTW_PLATFORM = 'wtw';
const WTW_SOURCE_APP = 'walk-the-world';

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

  return { id: data.user.id, email: data.user.email ?? null };
};

const walkerBucksResponse = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const apiUrl = getRequiredEnv('WALKERBUCKS_API_URL').replace(/\/+$/, '');
  const serviceToken = Deno.env.get('WALKERBUCKS_SERVICE_TOKEN')?.trim();
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
      ...init.headers
    }
  });
};

const throwWalkerBucksError = async (response: Response): Promise<never> => {
  let detail = `WalkerBucks API request failed with ${response.status}.`;
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') detail = body.detail;
  } catch {
    // keep the generic message
  }
  throw new BridgeError(response.status >= 500 ? 502 : response.status, detail);
};

const walkerBucksFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await walkerBucksResponse(path, init);
  if (!response.ok) {
    await throwWalkerBucksError(response);
  }

  return (await response.json()) as T;
};

const rewardKey = (sourceType: string, sourceId: string): string => `${sourceType}:${sourceId}`;

const deriveIdempotencyKey = (userId: string, reward: RewardDefinition): string =>
  `wtw:supabase:${userId}:${reward.sourceType}:${reward.sourceId}`;

const deriveMarketplaceIdempotencyKey = (userId: string, shopOfferId: number): string =>
  `wtw:supabase:${userId}:marketplace:offer:${shopOfferId}`;

const loadAccountByPlatform = async (platform: string, platformUserId: string): Promise<AccountOut | null> => {
  const response = await walkerBucksResponse(
    `/v1/accounts/by-platform/${encodeURIComponent(platform)}/${encodeURIComponent(platformUserId)}`
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    await throwWalkerBucksError(response);
  }
  return (await response.json()) as AccountOut;
};

const resolveAccount = async (user: SupabaseUser): Promise<AccountOut> => {
  const linkedAccount = await loadAccountByPlatform(WTW_PLATFORM, user.id);
  if (linkedAccount) return linkedAccount;

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
        platform_user_id: user.id,
        platform_username: user.email ?? undefined,
        external_id: user.id
      })
    });
  } catch {
    // Duplicate legacy Supabase links are harmless; the canonical WTW platform
    // identity is created by WalkerBucks Bank link completion.
  }

  return account;
};

const transferLegacyBalance = async (
  fromAccountId: string,
  toAccountId: string,
  user: SupabaseUser
): Promise<string | null> => {
  if (fromAccountId === toAccountId) return null;
  const legacyWallet = await loadWallet(fromAccountId);
  if (legacyWallet.available_balance <= 0) return null;

  const transfer = await walkerBucksFetch<{ transaction_id: string }>('/v1/transfers/walkerbucks', {
    method: 'POST',
    body: JSON.stringify({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: legacyWallet.available_balance,
      idempotency_key: `wtw:bank-link:migrate:${user.id}:${toAccountId}`,
      reason_code: 'account.link.legacy_wtw_migration',
      description: 'Move legacy Walk The World WalkerBucks into linked bank account',
      actor_account_id: toAccountId,
      source_app: WTW_SOURCE_APP,
      platform: WTW_PLATFORM,
      platform_event_id: user.id,
      metadata_json: {
        supabase_user_id: user.id,
        legacy_account_id: fromAccountId,
        target_account_id: toAccountId
      }
    })
  });

  return transfer.transaction_id;
};

const loadWallet = async (accountId: string): Promise<WalletOut> =>
  walkerBucksFetch<WalletOut>(`/v1/wallets/${accountId}`);

const loadShopOffers = async (): Promise<ShopOfferOut[]> => walkerBucksFetch<ShopOfferOut[]>('/v1/shop/offers');

const loadItemDefinitions = async (): Promise<ItemDefinitionOut[]> =>
  walkerBucksFetch<ItemDefinitionOut[]>('/v1/items/definitions');

const loadInventory = async (accountId: string): Promise<InventoryItemOut[]> =>
  walkerBucksFetch<InventoryItemOut[]>(`/v1/inventory/${accountId}`);

const toBalanceResponse = (wallet: WalletOut, updatedAt: number) => ({
  assetCode: wallet.asset_code,
  balance: wallet.balance,
  lockedBalance: wallet.locked_balance,
  availableBalance: wallet.available_balance,
  updatedAt
});

const toInventoryResponse = (inventory: InventoryItemOut[]) =>
  inventory.map((item) => ({
    itemInstanceId: item.item_instance_id,
    itemDefinitionId: item.item_definition_id,
    status: item.status
  }));

const toMarketplaceOfferResponse = (offers: ShopOfferOut[], definitions: ItemDefinitionOut[]) => {
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  return offers.map((offer) => {
    const definition = definitionsById.get(offer.item_definition_id);
    return {
      id: offer.id,
      shopId: offer.shop_id,
      itemDefinitionId: offer.item_definition_id,
      name: definition?.name ?? `WalkerBucks Item #${offer.item_definition_id}`,
      description: definition?.description || 'Shared WalkerBucks marketplace item.',
      priceWb: offer.price_wb
    };
  });
};

const handleBalance = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const account = await resolveAccount(user);
  const wallet = await loadWallet(account.id);
  return jsonResponse({
    accountId: account.id,
    ...toBalanceResponse(wallet, Date.now())
  });
};

const handleLeaderboard = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const account = await resolveAccount(user);
  const rows = await walkerBucksFetch<LeaderboardRowOut[]>('/v1/leaderboards/walkerbucks');
  const updatedAt = Date.now();

  return jsonResponse({
    category: 'walkerbucks_balance',
    accountId: account.id,
    entries: rows.map((row, index) => ({
      rank: index + 1,
      accountId: row.account_id,
      balance: row.balance,
      isCurrentAccount: row.account_id === account.id
    })),
    updatedAt
  });
};

const handleMarketplaceOffers = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const account = await resolveAccount(user);
  const [wallet, offers, definitions] = await Promise.all([loadWallet(account.id), loadShopOffers(), loadItemDefinitions()]);
  const updatedAt = Date.now();

  return jsonResponse({
    accountId: account.id,
    balance: toBalanceResponse(wallet, updatedAt),
    offers: toMarketplaceOfferResponse(offers, definitions),
    updatedAt
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

const handleBankLink = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const payload = (await request.json()) as BankLinkRequest;
  const linkCode = payload.linkCode?.trim().toUpperCase();
  if (!linkCode) {
    throw new BridgeError(400, 'linkCode is required.');
  }

  const legacyAccount = await walkerBucksFetch<AccountOut>('/v1/accounts', {
    method: 'POST',
    body: JSON.stringify({
      username: `wtw:${user.id}`,
      display_name: user.email ?? `WTW ${user.id.slice(0, 8)}`
    })
  });

  const linked = await walkerBucksFetch<{ id: string; account_id: string }>('/v1/accounts/link-complete', {
    method: 'POST',
    body: JSON.stringify({
      platform: WTW_PLATFORM,
      platform_user_id: user.id,
      platform_username: user.email ?? undefined,
      link_code: linkCode,
      actor_account_id: legacyAccount.id,
      metadata_json: {
        source_app: WTW_SOURCE_APP,
        supabase_user_id: user.id
      }
    })
  });

  const migrationTransactionId = await transferLegacyBalance(legacyAccount.id, linked.account_id, user);
  const wallet = await loadWallet(linked.account_id);
  const updatedAt = Date.now();

  return jsonResponse({
    status: 'linked',
    accountId: linked.account_id,
    platform: WTW_PLATFORM,
    platformUserId: user.id,
    migrationTransactionId,
    balance: toBalanceResponse(wallet, updatedAt),
    updatedAt
  });
};

const handleMarketplacePurchase = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const payload = (await request.json()) as MarketplacePurchaseRequest;
  if (!Number.isInteger(payload.shopOfferId) || !payload.idempotencyKey) {
    throw new BridgeError(400, 'shopOfferId and idempotencyKey are required.');
  }

  const shopOfferId = Number(payload.shopOfferId);
  const expectedKey = deriveMarketplaceIdempotencyKey(user.id, shopOfferId);
  if (payload.idempotencyKey !== expectedKey) {
    throw new BridgeError(400, 'Idempotency key does not match the authenticated user and marketplace offer.');
  }

  const account = await resolveAccount(user);
  const offers = await loadShopOffers();
  const offer = offers.find((candidate) => candidate.id === shopOfferId);
  if (!offer) {
    throw new BridgeError(400, 'Unknown WalkerBucks shop offer.');
  }

  const purchase = await walkerBucksFetch<{ item_instance_id: string }>('/v1/shop/purchases', {
    method: 'POST',
    body: JSON.stringify({
      account_id: account.id,
      shop_offer_id: shopOfferId,
      idempotency_key: expectedKey,
      reason_code: 'shop.purchase.walk_the_world_marketplace'
    })
  });
  const [wallet, inventory] = await Promise.all([loadWallet(account.id), loadInventory(account.id)]);

  return jsonResponse({
    status: 'purchased',
    accountId: account.id,
    shopOfferId,
    itemInstanceId: purchase.item_instance_id,
    itemDefinitionId: offer.item_definition_id,
    priceWb: offer.price_wb,
    idempotencyKey: expectedKey,
    balance: toBalanceResponse(wallet, Date.now()),
    inventory: toInventoryResponse(inventory)
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const path = new URL(request.url).pathname.replace(/\/+$/, '');

    if (request.method === 'GET' && path.endsWith('/balance')) {
      return await handleBalance(request);
    }

    if (request.method === 'GET' && path.endsWith('/leaderboards/walkerbucks')) {
      return await handleLeaderboard(request);
    }

    if (request.method === 'GET' && path.endsWith('/marketplace/offers')) {
      return await handleMarketplaceOffers(request);
    }

    if (request.method === 'POST' && path.endsWith('/rewards/grants')) {
      return await handleGrant(request);
    }

    if (request.method === 'POST' && path.endsWith('/bank/link')) {
      return await handleBankLink(request);
    }

    if (request.method === 'POST' && path.endsWith('/marketplace/purchases')) {
      return await handleMarketplacePurchase(request);
    }

    return jsonResponse({ detail: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof BridgeError) {
      return jsonResponse({ detail: error.message }, error.status);
    }

    return jsonResponse({ detail: 'WalkerBucks bridge failed.' }, 500);
  }
});
