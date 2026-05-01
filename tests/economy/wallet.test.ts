import { describe, expect, it } from 'vitest';
import { isDevToolsEnabled } from '../../src/devtools/devAuth';

describe('dev route protection', () => {
  it('blocks when NODE_ENV is production and no override', () => {
    expect(isDevToolsEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('allows with explicit flag in production', () => {
    expect(isDevToolsEnabled({ NODE_ENV: 'production', VITE_ENABLE_DEVTOOLS: 'true' })).toBe(true);
  });
});
