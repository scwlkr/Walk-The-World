import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from 'https://deno.land/x/postgres@v0.19.3/mod.ts';

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

type LegacyInventoryRow = {
  id: string;
  account_id: string;
  item_definition_id: number;
  status: string;
};

type LegacyItemHistoryRow = {
  item_instance_id: string;
};

type RewardGrantRequest = {
  sourceType?: string;
  sourceId?: string;
  amount?: number;
  idempotencyKey?: string;
  reasonCode?: string;
};

type BankLinkRequest = {
  linkCode?: string;
};

type MarketplacePurchaseRequest = {
  shopOfferId?: number;
  idempotencyKey?: string;
};

type GameSpendRequest = {
  sourceType?: string;
  sourceId?: string;
  amount?: number;
  idempotencyKey?: string;
  reasonCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type RewardDefinition = {
  sourceType: string;
  sourceId: string;
  amount: number;
  reasonCode: string;
  description: string;
};

const WTW_PLATFORM = 'wtw';
const WTW_SOURCE_APP = 'walk-the-world';
const MAX_DYNAMIC_GRANT_WB = 50000;
const MAX_GAME_SPEND_WB = 1000000;
const dynamicRewardSourceTypes = new Set([
  'achievement',
  'quest',
  'milestone',
  'random_event',
  'route_encounter',
  'walking',
  'inventory',
  'legacy_migration'
]);
const gameSpendSourceTypes = new Set(['upgrade', 'follower', 'catalog_offer']);

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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const getLegacyDbUrl = (): string => {
  const value = Deno.env.get('SUPABASE_DB_URL')?.trim();
  if (!value) throw new BridgeError(500, 'SUPABASE_DB_URL is not configured for WalkerBucks app-layer data.');
  return value;
};

const isMissingLegacyTable = (error: unknown): boolean => {
  const candidate = error as { code?: string; fields?: { code?: string }; message?: string };
  const code = candidate.code ?? candidate.fields?.code;
  return code === '42P01' || candidate.message?.includes('does not exist') === true;
};

const withLegacyDb = async <T>(query: (client: Client) => Promise<T>): Promise<T> => {
  const client = new Client(getLegacyDbUrl());
  await client.connect();
  try {
    return await query(client);
  } finally {
    await client.end();
  }
};

const loadLegacyRows = async <T>(query: (client: Client) => Promise<T[]>): Promise<T[]> => {
  try {
    return await withLegacyDb(query);
  } catch (error) {
    if (error instanceof BridgeError) throw error;
    if (isMissingLegacyTable(error)) return [];
    throw new BridgeError(502, `WalkerBucks legacy app-layer data failed: ${getErrorMessage(error)}`);
  }
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

const deriveSpendIdempotencyKey = (userId: string, sourceType: string, sourceId: string): string =>
  `wtw:supabase:${userId}:spend:${sourceType}:${sourceId}`;

const deriveShopPurchaseIdempotencyKey = (userId: string, offerId: string, purchaseId: string): string =>
  `wtw:supabase:${userId}:shop:${offerId}:${purchaseId}`;

const requireSafeSource = (value: string | undefined, field: string): string => {
  const source = value?.trim();
  if (!source || !/^[a-z0-9_.:-]{1,80}$/.test(source)) {
    throw new BridgeError(400, `${field} is invalid.`);
  }
  return source;
};

const getMetadataString = (
  metadata: Record<string, string | number | boolean | null> | undefined,
  field: string
): string | null => {
  const value = metadata?.[field];
  return typeof value === 'string' ? value : null;
};

const requirePositiveInteger = (value: number | undefined, field: string, max: number): number => {
  if (!Number.isInteger(value) || !value || value <= 0 || value > max) {
    throw new BridgeError(400, `${field} must be a positive integer no greater than ${max}.`);
  }
  return value;
};

const resolveRewardDefinition = (payload: RewardGrantRequest): RewardDefinition => {
  const sourceType = requireSafeSource(payload.sourceType, 'sourceType');
  const sourceId = requireSafeSource(payload.sourceId, 'sourceId');
  const catalogReward = rewardCatalog[rewardKey(sourceType, sourceId)];
  if (catalogReward) return catalogReward;

  if (!dynamicRewardSourceTypes.has(sourceType)) {
    throw new BridgeError(400, 'Unknown WalkerBucks reward source.');
  }

  const amount = requirePositiveInteger(payload.amount, 'amount', MAX_DYNAMIC_GRANT_WB);
  return {
    sourceType,
    sourceId,
    amount,
    reasonCode: `webgame.reward.${sourceType}`,
    description: `Walk The World ${sourceType.replace(/_/g, ' ')} reward`
  };
};

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

const delay = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const resolveAccount = async (user: SupabaseUser): Promise<AccountOut> => {
  const linkedAccount = await loadAccountByPlatform(WTW_PLATFORM, user.id);
  if (linkedAccount) return linkedAccount;

  const legacyAccount = await loadAccountByPlatform('supabase', user.id);
  if (legacyAccount) return legacyAccount;

  let account: AccountOut;
  try {
    account = await walkerBucksFetch<AccountOut>('/v1/accounts', {
      method: 'POST',
      body: JSON.stringify({
        username: `wtw:${user.id}`
      })
    });
  } catch (error) {
    await delay(250);
    const racedAccount = await loadAccountByPlatform('supabase', user.id);
    if (racedAccount) return racedAccount;
    account = await walkerBucksFetch<AccountOut>('/v1/accounts', {
      method: 'POST',
      body: JSON.stringify({
        username: `wtw:${user.id}`
      })
    });
  }

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
    const racedAccount = await loadAccountByPlatform('supabase', user.id);
    if (racedAccount) return racedAccount;
    // Duplicate legacy Supabase links are harmless when they resolve back to
    // the same deterministic WTW account. The canonical WTW platform identity
    // is still created by WalkerBucks Bank link completion.
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

const loadShopOffers = async (): Promise<ShopOfferOut[]> =>
  loadLegacyRows<ShopOfferOut>(async (client) => {
    const result = await client.queryObject<ShopOfferOut>(
      'select id, shop_id, item_definition_id, price_wb from walkerbucks.shop_offers where active = true order by id'
    );
    return result.rows;
  });

const loadItemDefinitions = async (): Promise<ItemDefinitionOut[]> =>
  loadLegacyRows<ItemDefinitionOut>(async (client) => {
    const result = await client.queryObject<ItemDefinitionOut>(
      'select id, name, description, consumable from walkerbucks.item_definitions order by id'
    );
    return result.rows;
  });

const loadInventory = async (accountIds: string[]): Promise<InventoryItemOut[]> => {
  const ids = Array.from(new Set(accountIds.filter(Boolean)));
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, index) => `$${index + 1}::uuid`).join(', ');
  const rows = await loadLegacyRows<LegacyInventoryRow>(async (client) => {
    const result = await client.queryObject<LegacyInventoryRow>({
      text: `select id::text as id, account_id::text as account_id, item_definition_id, status from walkerbucks.item_instances where account_id in (${placeholders}) order by created_at`,
      args: ids
    });
    return result.rows;
  });
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (seen.has(row.id)) return [];
    seen.add(row.id);
    return {
      item_instance_id: row.id,
      item_definition_id: row.item_definition_id,
      status: row.status
    };
  });
};

const getInventoryAccountIds = async (user: SupabaseUser, accountId: string): Promise<string[]> => {
  const legacyAccount = await loadAccountByPlatform('supabase', user.id);
  return legacyAccount?.id && legacyAccount.id !== accountId ? [accountId, legacyAccount.id] : [accountId];
};

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
  const [wallet, inventoryAccountIds] = await Promise.all([loadWallet(account.id), getInventoryAccountIds(user, account.id)]);
  const inventory = await loadInventory(inventoryAccountIds);
  return jsonResponse({
    accountId: account.id,
    inventory: toInventoryResponse(inventory),
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
  const inventoryAccountIds = await getInventoryAccountIds(user, account.id);
  const [wallet, offers, definitions, inventory] = await Promise.all([
    loadWallet(account.id),
    loadShopOffers(),
    loadItemDefinitions(),
    loadInventory(inventoryAccountIds)
  ]);
  const updatedAt = Date.now();

  return jsonResponse({
    accountId: account.id,
    balance: toBalanceResponse(wallet, updatedAt),
    offers: toMarketplaceOfferResponse(offers, definitions),
    inventory: toInventoryResponse(inventory),
    updatedAt
  });
};

const handleGrant = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const payload = (await request.json()) as RewardGrantRequest;
  if (!payload.sourceType || !payload.sourceId || !payload.idempotencyKey) {
    throw new BridgeError(400, 'sourceType, sourceId, amount, and idempotencyKey are required.');
  }

  const reward = resolveRewardDefinition(payload);
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
  const [wallet, inventory] = await Promise.all([
    loadWallet(linked.account_id),
    loadInventory([legacyAccount.id, linked.account_id])
  ]);
  const updatedAt = Date.now();

  return jsonResponse({
    status: 'linked',
    accountId: linked.account_id,
    legacyAccountId: legacyAccount.id === linked.account_id ? null : legacyAccount.id,
    platform: WTW_PLATFORM,
    platformUserId: user.id,
    migrationTransactionId,
    inventory: toInventoryResponse(inventory),
    balance: toBalanceResponse(wallet, updatedAt),
    updatedAt
  });
};

const ensurePurchaseSettlementAccount = async (): Promise<AccountOut> =>
  walkerBucksFetch<AccountOut>('/v1/accounts', {
    method: 'POST',
    body: JSON.stringify({
      username: 'system:treasury',
      display_name: 'System Treasury'
    })
  });

const findLegacyInventoryItemByTransaction = async (transactionId: string): Promise<string | null> => {
  const rows = await loadLegacyRows<LegacyItemHistoryRow>(async (client) => {
    const result = await client.queryObject<LegacyItemHistoryRow>({
      text: "select item_instance_id::text as item_instance_id from walkerbucks.item_history where action = 'purchase' and note = $1 limit 1",
      args: [transactionId]
    });
    return result.rows;
  });

  return rows[0]?.item_instance_id ?? null;
};

const createLegacyInventoryItem = async (accountId: string, itemDefinitionId: number, transactionId: string): Promise<string> => {
  const existingItemInstanceId = await findLegacyInventoryItemByTransaction(transactionId);
  if (existingItemInstanceId) return existingItemInstanceId;

  try {
    return await withLegacyDb(async (client) => {
      const now = new Date().toISOString();
      const itemInstanceId = crypto.randomUUID();

      await client.queryArray('begin');
      try {
        const item = await client.queryObject<{ id: string }>({
          text: `
            insert into walkerbucks.item_instances (id, account_id, item_definition_id, status, created_at, updated_at)
            values ($1::uuid, $2::uuid, $3, 'owned', $4, $4)
            returning id::text as id
          `,
          args: [itemInstanceId, accountId, itemDefinitionId, now]
        });

        const createdItemInstanceId = item.rows[0]?.id;
        if (!createdItemInstanceId) {
          throw new BridgeError(502, 'WalkerBucks legacy inventory insert returned no item id.');
        }

        await client.queryObject({
          text: `
            insert into walkerbucks.item_history (item_instance_id, action, note, created_at)
            values ($1::uuid, 'purchase', $2, $3)
          `,
          args: [createdItemInstanceId, transactionId, now]
        });
        await client.queryArray('commit');
        return createdItemInstanceId;
      } catch (error) {
        await client.queryArray('rollback');
        throw error;
      }
    });
  } catch (error) {
    if (error instanceof BridgeError) throw error;
    throw new BridgeError(502, `WalkerBucks legacy inventory purchase write failed: ${getErrorMessage(error)}`);
  }
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

  const settlementAccount = await ensurePurchaseSettlementAccount();
  const purchase = await walkerBucksFetch<{ transaction_id: string }>('/v1/transfers/walkerbucks', {
    method: 'POST',
    body: JSON.stringify({
      from_account_id: account.id,
      to_account_id: settlementAccount.id,
      amount: offer.price_wb,
      idempotency_key: expectedKey,
      reason_code: 'transfer.walk_the_world_marketplace_purchase',
      description: `Walk The World marketplace offer ${shopOfferId}`,
      actor_account_id: account.id,
      source_app: WTW_SOURCE_APP,
      platform: WTW_PLATFORM,
      platform_event_id: String(shopOfferId),
      metadata_json: {
        supabase_user_id: user.id,
        shop_offer_id: shopOfferId,
        item_definition_id: offer.item_definition_id
      }
    })
  });
  const itemInstanceId = await createLegacyInventoryItem(account.id, offer.item_definition_id, purchase.transaction_id);
  const [wallet, inventoryAccountIds] = await Promise.all([loadWallet(account.id), getInventoryAccountIds(user, account.id)]);
  const inventory = await loadInventory(inventoryAccountIds);

  return jsonResponse({
    status: 'purchased',
    accountId: account.id,
    shopOfferId,
    itemInstanceId,
    itemDefinitionId: offer.item_definition_id,
    priceWb: offer.price_wb,
    idempotencyKey: expectedKey,
    balance: toBalanceResponse(wallet, Date.now()),
    inventory: toInventoryResponse(inventory)
  });
};

const handleGameSpend = async (request: Request): Promise<Response> => {
  const user = await getSupabaseUser(request);
  const payload = (await request.json()) as GameSpendRequest;
  const sourceType = requireSafeSource(payload.sourceType, 'sourceType');
  const sourceId = requireSafeSource(payload.sourceId, 'sourceId');
  if (!gameSpendSourceTypes.has(sourceType)) {
    throw new BridgeError(400, 'Unknown WalkerBucks spend source.');
  }
  if (!payload.idempotencyKey) {
    throw new BridgeError(400, 'idempotencyKey is required.');
  }

  const amount = requirePositiveInteger(payload.amount, 'amount', MAX_GAME_SPEND_WB);
  const reasonCode = payload.reasonCode === 'wtw.shop.purchase' ? 'wtw.shop.purchase' : `webgame.spend.${sourceType}`;
  const metadata = payload.metadata ?? {};
  const offerId = getMetadataString(metadata, 'offer_id');
  const purchaseId = getMetadataString(metadata, 'purchase_id');
  const expectedKey =
    reasonCode === 'wtw.shop.purchase' && offerId && purchaseId
      ? deriveShopPurchaseIdempotencyKey(
          user.id,
          requireSafeSource(offerId, 'metadata.offer_id'),
          requireSafeSource(purchaseId, 'metadata.purchase_id')
        )
      : deriveSpendIdempotencyKey(user.id, sourceType, sourceId);
  if (payload.idempotencyKey !== expectedKey) {
    throw new BridgeError(400, 'Idempotency key does not match the authenticated user and spend source.');
  }

  const account = await resolveAccount(user);
  const settlementAccount = await ensurePurchaseSettlementAccount();
  const spend = await walkerBucksFetch<{ transaction_id: string }>('/v1/transfers/walkerbucks', {
    method: 'POST',
    body: JSON.stringify({
      from_account_id: account.id,
      to_account_id: settlementAccount.id,
      amount,
      idempotency_key: expectedKey,
      reason_code: reasonCode,
      description: `Walk The World ${sourceType.replace(/_/g, ' ')} spend`,
      actor_account_id: account.id,
      source_app: WTW_SOURCE_APP,
      platform: WTW_PLATFORM,
      platform_event_id: sourceId,
      metadata_json: {
        ...metadata,
        app: 'walk_the_world',
        supabase_user_id: user.id,
        source_type: sourceType,
        source_id: sourceId
      }
    })
  });
  const wallet = await loadWallet(account.id);

  return jsonResponse({
    status: 'spent',
    accountId: account.id,
    transactionId: spend.transaction_id,
    sourceType,
    sourceId,
    amount,
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

    if (request.method === 'POST' && path.endsWith('/spends')) {
      return await handleGameSpend(request);
    }

    return jsonResponse({ detail: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof BridgeError) {
      return jsonResponse({ detail: error.message }, error.status);
    }

    return jsonResponse({ detail: 'WalkerBucks bridge failed.' }, 500);
  }
});
