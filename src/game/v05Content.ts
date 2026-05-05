import type { InventoryItemDefinition } from './types';

export type RuntimeCatalogShopOffer = {
  offerId: string;
  shopId: string;
  itemId: string;
  priceWb: number;
  currency: 'WB';
  purchaseLimitPerAccount: number | null;
  unlockType: string;
  unlockValue: string;
  active: boolean;
  sortOrder: number;
};

export const V05_RUNTIME_CATALOG_ITEMS: InventoryItemDefinition[] = [
  {
    id: 'starter_shoes',
    slug: 'starter-shoes',
    name: 'Starter Shoes',
    description: 'Deterministic dev-suite upgrade item used to prove purchase, inventory, and DPS state together.',
    type: 'equipment',
    category: 'dev',
    rarity: 'common',
    flavorText: 'Only appears in local dev and tests.',
    icon: 'SHOE',
    effect: {
      type: 'none',
      value: 0
    },
    implementationStatus: 'dev-test'
  },
  {
    id: 'test_cosmetic_hat',
    slug: 'test-cosmetic-hat',
    name: 'Test Cosmetic Hat',
    description: 'Deterministic dev-suite cosmetic used to prove purchases that do not affect DPS.',
    type: 'cosmetic',
    category: 'dev',
    rarity: 'common',
    flavorText: 'A test item with no stat pressure.',
    icon: 'HAT',
    effect: {
      type: 'cosmetic_equip',
      value: 0
    },
    cosmeticId: 'test_cosmetic_hat',
    implementationStatus: 'dev-test'
  },
  {
    id: 'test_boost',
    slug: 'test-boost',
    name: 'Test Boost',
    description: 'Deterministic dev-suite boost used to prove active effects and rollback behavior.',
    type: 'consumable',
    category: 'dev',
    rarity: 'common',
    flavorText: 'Short label, loud test signal.',
    icon: 'BOOST',
    effect: {
      type: 'speed_multiplier_temp',
      value: 0.1,
      durationSeconds: 900,
      cooldownSeconds: 0
    },
    implementationStatus: 'dev-test'
  },
  {
    id: 'fresh_socks',
    slug: 'fresh-socks',
    name: 'Fresh Socks',
    description: 'A temporary DPS boost for long stretches where the route starts fighting back.',
    type: 'consumable',
    category: 'boost',
    rarity: 'uncommon',
    flavorText: 'Not glamorous. Extremely effective.',
    icon: 'SOCK',
    effect: {
      type: 'speed_multiplier_temp',
      value: 0.25,
      durationSeconds: 600,
      cooldownSeconds: 900
    },
    implementationStatus: 'v0.5'
  },
  {
    id: 'walking_playlist_item',
    slug: 'walking-playlist',
    name: 'Walking Playlist',
    description: 'A route mix that makes event rewards hit harder for a while.',
    type: 'consumable',
    category: 'boost',
    rarity: 'uncommon',
    flavorText: 'Every step lands on beat.',
    icon: 'MIX',
    effect: {
      type: 'event_reward_multiplier',
      value: 0.1,
      durationSeconds: 1800,
      cooldownSeconds: 1800
    },
    implementationStatus: 'v0.5'
  },
  {
    id: 'peace_offering_granola',
    slug: 'peace-offering-granola',
    name: 'Peace Offering Granola',
    description: 'Temporarily lowers crew churn when the walking empire gets tense.',
    type: 'consumable',
    category: 'boost',
    rarity: 'uncommon',
    flavorText: 'Somehow always slightly crushed.',
    icon: 'GRAN',
    effect: {
      type: 'follower_stability_temp',
      value: 0.18,
      durationSeconds: 900,
      cooldownSeconds: 1200
    },
    implementationStatus: 'v0.5'
  },
  {
    id: 'group_chat_invite',
    slug: 'group-chat-invite',
    name: 'Group Chat Invite',
    description: 'Temporarily improves follower recruiting without making the swarm infinite.',
    type: 'consumable',
    category: 'boost',
    rarity: 'rare',
    flavorText: 'Muted within six minutes.',
    icon: 'CHAT',
    effect: {
      type: 'follower_recruit_temp',
      value: 0.3,
      durationSeconds: 600,
      cooldownSeconds: 1200
    },
    implementationStatus: 'v0.5'
  },
  {
    id: 'matching_tracksuits_item',
    slug: 'matching-tracksuits',
    name: 'Matching Tracksuits',
    description: 'Rare crew-fit cosmetic that makes followers feel like they joined a real movement.',
    type: 'cosmetic',
    category: 'cosmetic',
    rarity: 'rare',
    flavorText: 'The morale bonus is mostly from commitment.',
    icon: 'FIT',
    effect: {
      type: 'cosmetic_equip',
      value: 0
    },
    cosmeticId: 'matching_tracksuits',
    implementationStatus: 'v0.5'
  },
  {
    id: 'golden_sneakers_item',
    slug: 'golden-sneakers',
    name: 'Golden Sneakers',
    description: 'Legendary walking status that convinces volatile followers to stick around.',
    type: 'cosmetic',
    category: 'cosmetic',
    rarity: 'legendary',
    flavorText: 'They are not practical. That is the point.',
    icon: 'GOLD',
    effect: {
      type: 'cosmetic_equip',
      value: 0
    },
    cosmeticId: 'golden_sneakers',
    implementationStatus: 'v0.5'
  },
  {
    id: 'spring_stride_crown_item',
    slug: 'spring-stride-crown',
    name: 'Spring Stride Crown',
    description: 'Limited-time route cosmetic from the Spring Stride event window.',
    type: 'cosmetic',
    category: 'limited',
    rarity: 'epic',
    flavorText: 'A seasonal flex, not a permanent power spike.',
    icon: 'CROWN',
    effect: {
      type: 'cosmetic_equip',
      value: 0
    },
    cosmeticId: 'spring_stride_crown',
    implementationStatus: 'v0.5'
  },
  {
    id: 'boardwalk_shell',
    slug: 'boardwalk-shell',
    name: 'Boardwalk Shell',
    description: 'A small souvenir from the waterfront route set.',
    type: 'collectible',
    category: 'souvenir',
    rarity: 'uncommon',
    flavorText: 'Still has sand in it.',
    icon: 'SHELL',
    effect: {
      type: 'souvenir_collectible',
      value: 0
    },
    implementationStatus: 'v0.5'
  },
  {
    id: 'world_tour_pin',
    slug: 'world-tour-pin',
    name: 'World Tour Pin',
    description: 'A rare flex collectible that unlocks a profile title.',
    type: 'collectible',
    category: 'title',
    rarity: 'rare',
    flavorText: 'Tiny pin. Loud message.',
    icon: 'PIN',
    effect: {
      type: 'title_unlock',
      value: 0
    },
    titleId: 'world_tour_pin',
    implementationStatus: 'v0.5'
  },
  {
    id: 'moon_rock_souvenir',
    slug: 'moon-rock-souvenir',
    name: 'Moon Rock Souvenir',
    description: 'A post-reset collectible for players who made the journey weird.',
    type: 'collectible',
    category: 'souvenir',
    rarity: 'epic',
    flavorText: 'Probably legal.',
    icon: 'MOON',
    effect: {
      type: 'souvenir_collectible',
      value: 0
    },
    implementationStatus: 'v0.5'
  }
];

export const V05_CATALOG_SHOP_OFFERS: RuntimeCatalogShopOffer[] = [
  {
    offerId: 'starter-shoes',
    shopId: 'wtw_dev',
    itemId: 'starter_shoes',
    priceWb: 500,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'none',
    unlockValue: '',
    active: false,
    sortOrder: 1
  },
  {
    offerId: 'test-cosmetic-hat',
    shopId: 'wtw_dev',
    itemId: 'test_cosmetic_hat',
    priceWb: 100,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'none',
    unlockValue: '',
    active: false,
    sortOrder: 2
  },
  {
    offerId: 'test-boost',
    shopId: 'wtw_dev',
    itemId: 'test_boost',
    priceWb: 200,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'none',
    unlockValue: '',
    active: false,
    sortOrder: 3
  },
  {
    offerId: 'offer_fresh_socks_main',
    shopId: 'wtw_main',
    itemId: 'fresh_socks',
    priceWb: 300,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'none',
    unlockValue: '',
    active: true,
    sortOrder: 320
  },
  {
    offerId: 'offer_walking_playlist_main',
    shopId: 'wtw_main',
    itemId: 'walking_playlist_item',
    priceWb: 420,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'distance_miles',
    unlockValue: '10',
    active: true,
    sortOrder: 330
  },
  {
    offerId: 'offer_peace_offering_granola_main',
    shopId: 'wtw_main',
    itemId: 'peace_offering_granola',
    priceWb: 480,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'distance_miles',
    unlockValue: '100',
    active: true,
    sortOrder: 340
  },
  {
    offerId: 'offer_group_chat_invite_main',
    shopId: 'wtw_main',
    itemId: 'group_chat_invite',
    priceWb: 850,
    currency: 'WB',
    purchaseLimitPerAccount: null,
    unlockType: 'distance_miles',
    unlockValue: '500',
    active: true,
    sortOrder: 350
  },
  {
    offerId: 'offer_boardwalk_shell_main',
    shopId: 'wtw_main',
    itemId: 'boardwalk_shell',
    priceWb: 160,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'destination',
    unlockValue: 'boardwalk',
    active: true,
    sortOrder: 360
  },
  {
    offerId: 'offer_matching_tracksuits_main',
    shopId: 'wtw_main',
    itemId: 'matching_tracksuits_item',
    priceWb: 1400,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'distance_miles',
    unlockValue: '1000',
    active: true,
    sortOrder: 370
  },
  {
    offerId: 'offer_golden_sneakers_main',
    shopId: 'wtw_main',
    itemId: 'golden_sneakers_item',
    priceWb: 4200,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'earth_loops_completed',
    unlockValue: '1',
    active: true,
    sortOrder: 380
  },
  {
    offerId: 'offer_world_tour_pin_main',
    shopId: 'wtw_main',
    itemId: 'world_tour_pin',
    priceWb: 1200,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'destination',
    unlockValue: 'paris',
    active: true,
    sortOrder: 390
  },
  {
    offerId: 'offer_spring_stride_crown_limited',
    shopId: 'wtw_limited',
    itemId: 'spring_stride_crown_item',
    priceWb: 1600,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'event',
    unlockValue: 'spring_stride_festival',
    active: true,
    sortOrder: 400
  },
  {
    offerId: 'offer_moon_rock_souvenir_main',
    shopId: 'wtw_main',
    itemId: 'moon_rock_souvenir',
    priceWb: 2200,
    currency: 'WB',
    purchaseLimitPerAccount: 1,
    unlockType: 'earth_loops_completed',
    unlockValue: '1',
    active: true,
    sortOrder: 410
  }
];
