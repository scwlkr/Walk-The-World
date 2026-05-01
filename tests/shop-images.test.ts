import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../src/game/initialState';
import { getItemImageSrc } from '../src/game/itemImages';
import { getLocalCatalogShopOffers } from '../src/game/items';
import { FOLLOWERS } from '../src/game/followers';
import { UPGRADES } from '../src/game/upgrades';

const publicAssetExists = (src: string): boolean => {
  if (!src.startsWith('/assets/')) return true;
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\/+/, '')));
};

describe('shop item artwork', () => {
  it('has a valid image for every upgrade, follower, and local catalog shop offer', () => {
    const state = createInitialGameState(1000);
    const candidates = [
      ...UPGRADES.map((upgrade) => ({ id: upgrade.id, item: { ...upgrade, itemType: 'upgrade' } })),
      ...FOLLOWERS.map((follower) => ({ id: follower.id, item: { ...follower, itemType: 'follower' } })),
      ...getLocalCatalogShopOffers(state).map((offer) => ({ id: offer.offerId, item: offer.item }))
    ];

    const missing = candidates
      .map((candidate) => ({ ...candidate, src: getItemImageSrc(candidate.item) }))
      .filter((candidate) => !candidate.src || !publicAssetExists(candidate.src));

    expect(missing).toEqual([]);
  });
});
