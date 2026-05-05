type DevEnv = Record<string, string | boolean | undefined>;

const getImportMetaEnv = (): DevEnv =>
  ((import.meta as ImportMeta & { env?: DevEnv }).env ?? {});

const getProcessEnv = (): Record<string, string | undefined> =>
  ((globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {});

const isTrue = (value: string | boolean | undefined): boolean => value === true || value === 'true';

export const isDevToolsEnabled = (env: DevEnv = getImportMetaEnv()): boolean => {
  const processEnv = getProcessEnv();
  const nodeEnv = env.NODE_ENV ?? processEnv.NODE_ENV;
  const viteProd = isTrue(env.PROD);
  const explicitFlag = isTrue(env.VITE_ENABLE_DEVTOOLS) || processEnv.ENABLE_DEVTOOLS === 'true';

  if (explicitFlag) return true;
  if (nodeEnv === 'production' || viteProd) return false;
  return true;
};

export const assertDevToolsEnabled = (env: DevEnv = getImportMetaEnv()): void => {
  if (!isDevToolsEnabled(env)) throw new Error('Dev tools are disabled in production.');
};
