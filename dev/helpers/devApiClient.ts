export const output = (payload: unknown) => console.log(JSON.stringify(payload, null, 2));

export const getArg = (name: string, fallback?: string): string | undefined => {
  const long = `--${name}`;
  const withEquals = process.argv.find((arg) => arg.startsWith(`${long}=`));
  if (withEquals) return withEquals.slice(long.length + 1);
  const index = process.argv.indexOf(long);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
};

export const getNumberArg = (name: string, fallback: number): number => {
  const raw = getArg(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getBooleanArg = (name: string, fallback = false): boolean => {
  const raw = getArg(name);
  if (!raw) return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes';
};

export const outputError = (action: string, error: unknown): void => {
  output({
    ok: false,
    action,
    error: error instanceof Error ? error.message : String(error),
    details: error && typeof error === 'object' && 'details' in error ? (error as { details: unknown }).details : undefined
  });
  process.exitCode = 1;
};
