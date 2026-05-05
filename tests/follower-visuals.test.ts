import { describe, expect, it } from 'vitest';
import { getVisibleFollowerCompanions, getVisualFollowerCount } from '../src/components/GameSceneCanvas';

describe('follower visual crowd', () => {
  it('scales visible followers through the requested crowd points', () => {
    expect(getVisualFollowerCount(1)).toBe(1);
    expect(getVisualFollowerCount(2)).toBe(2);
    expect(getVisualFollowerCount(5)).toBe(5);
    expect(getVisualFollowerCount(10)).toBe(5);
    expect(getVisualFollowerCount(20)).toBe(10);
    expect(getVisualFollowerCount(50)).toBe(30);
    expect(getVisualFollowerCount(100)).toBe(60);
  });

  it('keeps purchased follower types visible with their shop artwork', () => {
    const companions = getVisibleFollowerCompanions({
      followers: {
        neighborhood_walker: 40,
        hydration_bro: 1,
        lost_tourist: 1
      }
    });
    const imageSources = new Set(companions.map((companion) => companion.imageSrc));

    expect(companions.length).toBeGreaterThan(5);
    expect(imageSources).toContain('/assets/items/shop_follower_common.svg');
    expect(imageSources).toContain('/assets/items/shop_follower_uncommon.svg');
    expect(imageSources).toContain('/assets/items/shop_follower_rare.svg');
  });
});
