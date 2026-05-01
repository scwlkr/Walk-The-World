import { describe, expect, it } from 'vitest';

describe('economy scenarios scaffold', () => {
  it('starter items are deterministic for tests', () => {
    const items = ['starter-shoes', 'test-cosmetic-hat'];
    expect(items).toContain('starter-shoes');
    expect(items).toContain('test-cosmetic-hat');
  });
});
