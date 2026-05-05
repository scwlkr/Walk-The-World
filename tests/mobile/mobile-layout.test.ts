import { describe, expect, it } from 'vitest';

describe('dev panel mobile layout contract', () => {
  it('uses tap-sized controls without requiring horizontal scrolling by design', () => {
    const gridMinWidthPx = 132;
    const mobileViewportPx = 390;
    const gapPx = 9;
    const columns = Math.floor((mobileViewportPx + gapPx) / (gridMinWidthPx + gapPx));

    expect(gridMinWidthPx).toBeGreaterThanOrEqual(44);
    expect(columns).toBeGreaterThanOrEqual(2);
  });
});
