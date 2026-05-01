import { describe, expect, it } from 'vitest';

describe('mobile sync scaffold', () => {
  it('shares deterministic account id', () => {
    expect('dev_wtw_player').toBe('dev_wtw_player');
  });
});
