import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const loadDotEnvFile = async (path) => {
  try {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^"|"$/g, '');
    }
  } catch {
    // Env files are optional; real environment variables can provide values.
  }
};

await loadDotEnvFile('../.env.production.local');
await loadDotEnvFile('../.env.local');

const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_WALKERBUCKS_BRIDGE_URL'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  console.error(`Missing required live purchase smoke env vars: ${missingEnv.join(', ')}`);
  process.exit(2);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();
const bridgeUrl = process.env.VITE_WALKERBUCKS_BRIDGE_URL.trim().replace(/\/+$/, '');
const bankUrl = process.env.WALKERBUCKS_BANK_URL?.trim() || 'https://walkerbucks.vercel.app/bank';
const runId = randomUUID().replace(/-/g, '').slice(0, 12);
const smokeEmail = `codex-wtw-smoke-${Date.now()}-${runId}@example.com`;
const smokePassword = `WtwSmoke-${runId}-2026!`;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
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
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Bridge ${path} failed with ${response.status}: ${text}`);
  }
  return body;
};

const signUp = await supabase.auth.signUp({
  email: smokeEmail,
  password: smokePassword
});
if (signUp.error) throw new Error(`Smoke signup failed: ${signUp.error.message}`);
if (!signUp.data.session) {
  throw new Error('Supabase did not return a session for the fake smoke account.');
}

const session = signUp.data.session;
const accessToken = session.access_token;
const userId = session.user.id;

const bankResponse = await fetch(bankUrl, { redirect: 'follow' });
assert(bankResponse.ok, `WalkerBucks Bank did not load: ${bankResponse.status}`);
const bankHtml = await bankResponse.text();
assert(bankHtml.includes('WalkerBucks') || bankHtml.includes('Bank'), 'WalkerBucks Bank response did not look like the bank page.');

const balanceBefore = await bridgeRequest('/balance', accessToken);
assert(balanceBefore.accountId, 'Balance response did not include accountId.');
assert(balanceBefore.availableBalance === 0, 'Fresh smoke account should start with 0 available WB.');

const rewardKey = `wtw:supabase:${userId}:achievement:day_one_check_in`;
const reward = await bridgeRequest('/rewards/grants', accessToken, {
  method: 'POST',
  body: JSON.stringify({
    sourceType: 'achievement',
    sourceId: 'day_one_check_in',
    idempotencyKey: rewardKey
  })
});
assert(reward.status === 'granted', 'Reward grant did not return granted status.');
assert(reward.balance.availableBalance >= 20, 'Reward grant did not make at least 20 WB available.');

const purchaseId = `purchase_smoke_${runId}`;
const spendPayload = {
  sourceType: 'upgrade',
  sourceId: 'starter_shoes:level_1',
  amount: 1,
  idempotencyKey: `wtw:supabase:${userId}:shop:starter_shoes:${purchaseId}`,
  reasonCode: 'wtw.shop.purchase',
  metadata: {
    app: 'walk_the_world',
    purchase_id: purchaseId,
    offer_id: 'starter_shoes',
    item_def_id: 'starter_shoes',
    item_name: 'Starter Shoes',
    quantity: 1,
    price: 1
  }
};
const spend = await bridgeRequest('/spends', accessToken, {
  method: 'POST',
  body: JSON.stringify(spendPayload)
});
assert(spend.status === 'spent', 'Shop-style spend did not return spent status.');
assert(spend.transactionId, 'Shop-style spend did not return a transaction id.');

const replay = await bridgeRequest('/spends', accessToken, {
  method: 'POST',
  body: JSON.stringify(spendPayload)
});
assert(replay.transactionId === spend.transactionId, 'Idempotent spend replay returned a different transaction id.');

const balanceAfter = await bridgeRequest('/balance', accessToken);
assert(
  balanceAfter.availableBalance === reward.balance.availableBalance - spendPayload.amount,
  'Final available WB did not decrease by the purchase amount.'
);

console.log(
  JSON.stringify(
    {
      ok: true,
      fakeUserCreated: true,
      bankReachable: true,
      accountIdPresent: Boolean(balanceBefore.accountId),
      rewardStatus: reward.status,
      rewardBalance: reward.balance.availableBalance,
      spendStatus: spend.status,
      transactionIdPresent: Boolean(spend.transactionId),
      replayTransactionMatches: replay.transactionId === spend.transactionId,
      finalAvailableBalance: balanceAfter.availableBalance
    },
    null,
    2
  )
);
