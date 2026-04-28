import type {
  GameState,
  ServerRewardSourceType,
  WalkerBucksBalanceSnapshot,
  WalkerBucksRewardGrant
} from './types';

type ServerBackedAchievementReward = {
  sourceType: 'achievement';
  sourceId: string;
  label: string;
  amount: number;
  reasonCode: string;
};

const SERVER_BACKED_ACHIEVEMENT_REWARDS: Record<string, ServerBackedAchievementReward> = {
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
): ServerBackedAchievementReward | undefined => SERVER_BACKED_ACHIEVEMENT_REWARDS[achievementId];

export const getRewardGrantStateId = (sourceType: ServerRewardSourceType, sourceId: string): string =>
  `${sourceType}:${sourceId}`;

export const deriveWalkerBucksIdempotencyKey = (
  supabaseUserId: string,
  sourceType: ServerRewardSourceType,
  sourceId: string
): string => `wtw:supabase:${supabaseUserId}:${sourceType}:${sourceId}`;

export const createPendingWalkerBucksGrant = (
  supabaseUserId: string,
  reward: ServerBackedAchievementReward,
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
