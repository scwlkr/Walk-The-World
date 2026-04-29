import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const readCurrentSaveVersion = async () => {
  const source = await readFile(new URL('../src/game/constants.ts', import.meta.url), 'utf8');
  const match = source.match(/export const SAVE_VERSION = (\d+);/);
  if (!match) throw new Error('Could not read SAVE_VERSION from src/game/constants.ts.');
  return Number(match[1]);
};

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'WTW_BETA_SMOKE_EMAIL',
  'WTW_BETA_SMOKE_PASSWORD'
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  console.error(`Missing required live smoke env vars: ${missingEnv.join(', ')}`);
  process.exit(2);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();
const bridgeUrl = process.env.VITE_WALKERBUCKS_BRIDGE_URL?.trim().replace(/\/+$/, '') ?? '';
const smokeEmail = process.env.WTW_BETA_SMOKE_EMAIL.trim();
const smokePassword = process.env.WTW_BETA_SMOKE_PASSWORD;
const allowPurchase = process.env.WTW_BETA_SMOKE_ALLOW_PURCHASE === 'true';
const requireBridge = process.env.WTW_BETA_SMOKE_REQUIRE_BRIDGE === 'true';
const requestedOfferId = process.env.WTW_BETA_SMOKE_PURCHASE_OFFER_ID
  ? Number(process.env.WTW_BETA_SMOKE_PURCHASE_OFFER_ID)
  : null;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const gameSaveTable = () => supabase.schema('walk_the_world').from('game_saves');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const logStep = (message) => {
  console.log(`[live-smoke] ${message}`);
};

const signInOrSignUp = async () => {
  const signIn = await supabase.auth.signInWithPassword({
    email: smokeEmail,
    password: smokePassword
  });

  if (!signIn.error && signIn.data.session) return signIn.data.session;

  const signUp = await supabase.auth.signUp({
    email: smokeEmail,
    password: smokePassword
  });

  if (signUp.error) {
    throw new Error(`Supabase sign-in/sign-up failed: ${signIn.error?.message}; ${signUp.error.message}`);
  }

  if (!signUp.data.session) {
    throw new Error('Supabase did not return a session. Disable email confirmations for the beta smoke account or pre-confirm the account.');
  }

  return signUp.data.session;
};

const bridgeRequest = async (path, accessToken, init = {}) => {
  const response = await fetch(`${bridgeUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bridge ${path} failed with ${response.status}: ${body}`);
  }

  return response.json();
};

const runCloudSaveSmoke = async (userId) => {
  const runId = randomUUID();
  const now = Date.now();
  const saveVersion = await readCurrentSaveVersion();
  const payload = {
    saveVersion,
    lastSavedAt: now,
    smoke: {
      runId,
      checkedAt: new Date(now).toISOString()
    }
  };

  const upsert = await gameSaveTable()
    .upsert(
      {
        user_id: userId,
        save_version: saveVersion,
        save_payload: payload,
        updated_at: new Date(now).toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select('save_version, save_payload, updated_at')
    .single();

  if (upsert.error) throw new Error(`Cloud save upload failed: ${upsert.error.message}`);
  assert(upsert.data.save_version === saveVersion, 'Cloud save upload returned the wrong save_version.');

  const load = await gameSaveTable()
    .select('save_version, save_payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (load.error) throw new Error(`Cloud save load failed: ${load.error.message}`);
  assert(load.data, 'Cloud save load returned no row.');
  assert(load.data.save_payload?.smoke?.runId === runId, 'Cloud save load did not return the uploaded smoke payload.');

  return runId;
};

const runBridgeSmoke = async (session) => {
  if (!bridgeUrl) {
    if (requireBridge) throw new Error('VITE_WALKERBUCKS_BRIDGE_URL is required when WTW_BETA_SMOKE_REQUIRE_BRIDGE=true.');
    return {
      status: 'skipped',
      reason: 'VITE_WALKERBUCKS_BRIDGE_URL is not configured.'
    };
  }

  const accessToken = session.access_token;
  const userId = session.user.id;

  const balance = await bridgeRequest('/balance', accessToken);
  assert(balance.accountId, 'Balance response did not include accountId.');
  assert(typeof balance.balance === 'number', 'Balance response did not include a numeric balance.');

  const rewardKey = `wtw:supabase:${userId}:achievement:day_one_check_in`;
  const grant = await bridgeRequest('/rewards/grants', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      sourceType: 'achievement',
      sourceId: 'day_one_check_in',
      idempotencyKey: rewardKey
    })
  });
  assert(grant.status === 'granted', 'Reward grant did not return granted status.');
  assert(grant.idempotencyKey === rewardKey, 'Reward grant returned the wrong idempotency key.');

  const leaderboard = await bridgeRequest('/leaderboards/walkerbucks', accessToken);
  assert(Array.isArray(leaderboard.entries), 'Leaderboard response did not include entries.');

  const marketplace = await bridgeRequest('/marketplace/offers', accessToken);
  assert(Array.isArray(marketplace.offers), 'Marketplace response did not include offers.');
  assert(marketplace.offers.length > 0, 'Marketplace smoke requires at least one seeded WalkerBucks shop offer.');

  let purchase = null;
  if (allowPurchase) {
    const offer =
      requestedOfferId == null
        ? marketplace.offers[0]
        : marketplace.offers.find((candidate) => candidate.id === requestedOfferId);
    assert(offer, `Marketplace offer ${requestedOfferId} was not found.`);

    const purchaseKey = `wtw:supabase:${userId}:marketplace:offer:${offer.id}`;
    purchase = await bridgeRequest('/marketplace/purchases', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        shopOfferId: offer.id,
        idempotencyKey: purchaseKey
      })
    });

    assert(purchase.status === 'purchased', 'Marketplace purchase did not return purchased status.');
    assert(purchase.idempotencyKey === purchaseKey, 'Marketplace purchase returned the wrong idempotency key.');
  }

  return {
    status: 'checked',
    accountId: balance.accountId,
    rewardTransactionId: grant.transactionId,
    leaderboardEntries: leaderboard.entries.length,
    marketplaceOffers: marketplace.offers.length,
    purchaseStatus: purchase?.status ?? 'skipped'
  };
};

try {
  logStep('signing in beta smoke user');
  const session = await signInOrSignUp();
  assert(session.user?.id, 'Supabase session did not include a user id.');

  logStep('uploading and loading Supabase cloud save');
  const cloudSaveRunId = await runCloudSaveSmoke(session.user.id);

  logStep('checking WalkerBucks bridge balance, reward, leaderboard, and marketplace');
  const bridge = await runBridgeSmoke(session);

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: session.user.id,
        cloudSaveRunId,
        bridge
      },
      null,
      2
    )
  );

  if (!allowPurchase) {
    console.log('[live-smoke] marketplace purchase was skipped; set WTW_BETA_SMOKE_ALLOW_PURCHASE=true for the mutating purchase proof.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
