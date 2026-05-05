export const DEV_PLAYER_ACCOUNT = {
  accountId: 'dev_wtw_player',
  displayName: 'Dev Walker',
  platformIdentity: 'dev_mobile_test'
} as const;

export const DEV_NEW_USER_ACCOUNT = {
  accountId: 'dev_new_user',
  displayName: 'New Walker',
  platformIdentity: 'dev_new_user_mobile'
} as const;

export const DEV_ACCOUNTS = [DEV_PLAYER_ACCOUNT, DEV_NEW_USER_ACCOUNT] as const;

export type DevAccountId = (typeof DEV_ACCOUNTS)[number]['accountId'];

export const DEFAULT_DEV_ACCOUNT_ID: DevAccountId = DEV_PLAYER_ACCOUNT.accountId;

export const getDevAccount = (accountId: string = DEFAULT_DEV_ACCOUNT_ID) =>
  DEV_ACCOUNTS.find((account) => account.accountId === accountId) ?? DEV_PLAYER_ACCOUNT;
