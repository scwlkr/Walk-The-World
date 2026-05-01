export const isDevToolsEnabled = (env: Record<string, string | undefined> = import.meta.env): boolean => {
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV;
  if (nodeEnv !== 'production') return true;
  return env.VITE_ENABLE_DEVTOOLS === 'true' || process.env.ENABLE_DEVTOOLS === 'true';
};

export const assertDevToolsEnabled = (env: Record<string, string | undefined> = import.meta.env): void => {
  if (!isDevToolsEnabled(env)) throw new Error('Dev tools are disabled in production.');
};
