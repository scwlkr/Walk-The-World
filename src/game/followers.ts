import { getCosmeticEffectBonus } from './cosmetics';
import { milesFromFeet } from './distance';
import { getCurrentRegionEffect } from './regions';
import type { Follower, FollowerMoraleState, GameState } from './types';

export const FOLLOWERS: Follower[] = [
  {
    id: 'neighborhood_walker',
    name: 'Neighborhood Walker',
    image: '/assets/items/shop_follower_common.svg',
    description: 'A steady local who knows every shortcut and every porch light by name.',
    baseCost: 120,
    costMultiplier: 1.55,
    maxCount: 40,
    milesPerSecond: milesFromFeet(5),
    recruitChancePerMinute: 0.045,
    leaveChancePerMinute: 0.014,
    moraleSensitivity: 0.9,
    rarity: 'common',
    personalityFlavor: 'Reliable, chatty, easily impressed.',
    unlockRequirement: { distanceMiles: 0.25 }
  },
  {
    id: 'mall_walker',
    name: 'Mall Walker',
    image: '/assets/items/shop_follower_common.svg',
    description: 'Power laps with elite posture and zero patience for weak pacing.',
    baseCost: 360,
    costMultiplier: 1.65,
    maxCount: 32,
    milesPerSecond: milesFromFeet(15),
    recruitChancePerMinute: 0.035,
    leaveChancePerMinute: 0.018,
    moraleSensitivity: 1,
    rarity: 'common',
    personalityFlavor: 'Strong rhythm, strong opinions.',
    unlockRequirement: { distanceMiles: 1 }
  },
  {
    id: 'hydration_bro',
    name: 'Hydration Bro',
    image: '/assets/items/shop_follower_uncommon.svg',
    description: 'Carries three bottles and says electrolyte balance like it is a prophecy.',
    baseCost: 1100,
    costMultiplier: 1.75,
    maxCount: 24,
    milesPerSecond: milesFromFeet(40),
    recruitChancePerMinute: 0.026,
    leaveChancePerMinute: 0.022,
    moraleSensitivity: 1.05,
    rarity: 'uncommon',
    personalityFlavor: 'Loud, loyal, water-forward.',
    unlockRequirement: { distanceMiles: 10 }
  },
  {
    id: 'trail_grandma',
    name: 'Trail Grandma',
    image: '/assets/items/shop_follower_uncommon.svg',
    description: 'Somehow faster uphill and carrying emergency snacks for everyone.',
    baseCost: 3200,
    costMultiplier: 1.82,
    maxCount: 16,
    milesPerSecond: milesFromFeet(120),
    recruitChancePerMinute: 0.018,
    leaveChancePerMinute: 0.026,
    moraleSensitivity: 1.15,
    rarity: 'uncommon',
    personalityFlavor: 'Kind, ruthless, snack-backed.',
    unlockRequirement: { distanceMiles: 100 }
  },
  {
    id: 'lost_tourist',
    name: 'Lost Tourist',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'Absolutely no idea where this walk is going, but somehow still moving.',
    baseCost: 8800,
    costMultiplier: 1.95,
    maxCount: 10,
    milesPerSecond: milesFromFeet(260),
    recruitChancePerMinute: 0.012,
    leaveChancePerMinute: 0.032,
    moraleSensitivity: 1.3,
    rarity: 'rare',
    personalityFlavor: 'High upside, deeply confused.',
    unlockRequirement: { distanceMiles: 500 }
  },
  {
    id: 'city_power_walker',
    name: 'City Power Walker',
    image: '/assets/items/shop_follower_uncommon.svg',
    description: 'Crosswalk timing, commuter pace, and no tolerance for scenic delays.',
    baseCost: 5200,
    costMultiplier: 1.88,
    maxCount: 14,
    milesPerSecond: milesFromFeet(180),
    recruitChancePerMinute: 0.016,
    leaveChancePerMinute: 0.024,
    moraleSensitivity: 1.2,
    rarity: 'uncommon',
    personalityFlavor: 'Fast, direct, vaguely late.',
    regionIds: ['downtown', 'new_york'],
    unlockRequirement: { distanceMiles: 1, regionIds: ['downtown', 'new_york'] }
  },
  {
    id: 'umbrella_walker',
    name: 'Umbrella Walker',
    image: '/assets/items/shop_follower_uncommon.svg',
    description: 'Turns bad weather into a group activity.',
    baseCost: 6200,
    costMultiplier: 1.86,
    maxCount: 12,
    milesPerSecond: milesFromFeet(150),
    recruitChancePerMinute: 0.014,
    leaveChancePerMinute: 0.018,
    moraleSensitivity: 0.85,
    rarity: 'uncommon',
    personalityFlavor: 'Dry socks, calm vibes.',
    regionIds: ['niagara', 'london'],
    unlockRequirement: { distanceMiles: 1800, regionIds: ['niagara', 'london'] }
  },
  {
    id: 'trekking_pole_guy',
    name: 'Guy Who Bought Trekking Poles',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'Shows up over-prepared and somehow improves the whole crew pace.',
    baseCost: 14000,
    costMultiplier: 2.02,
    maxCount: 8,
    milesPerSecond: milesFromFeet(420),
    recruitChancePerMinute: 0.01,
    leaveChancePerMinute: 0.03,
    moraleSensitivity: 1.25,
    rarity: 'rare',
    personalityFlavor: 'Clacky poles, huge confidence.',
    regionIds: ['mountains', 'around_world'],
    unlockRequirement: { distanceMiles: 1000, regionIds: ['mountains', 'around_world'] }
  },
  {
    id: 'neon_stride_fan',
    name: 'Neon Stride Fan',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'Keeps pace by syncing every step to the brightest sign on the block.',
    baseCost: 22000,
    costMultiplier: 2.08,
    maxCount: 6,
    milesPerSecond: milesFromFeet(620),
    recruitChancePerMinute: 0.008,
    leaveChancePerMinute: 0.034,
    moraleSensitivity: 1.35,
    rarity: 'rare',
    personalityFlavor: 'Flashy, fast, expensive to impress.',
    regionIds: ['tokyo', 'around_world'],
    unlockRequirement: { distanceMiles: 6000, regionIds: ['tokyo', 'around_world'] }
  },
  {
    id: 'boardwalk_busker',
    name: 'Boardwalk Busker',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'Keeps everyone walking in rhythm as long as the crowd keeps clapping.',
    baseCost: 18000,
    costMultiplier: 2,
    maxCount: 9,
    milesPerSecond: milesFromFeet(500),
    recruitChancePerMinute: 0.011,
    leaveChancePerMinute: 0.028,
    moraleSensitivity: 1.12,
    rarity: 'rare',
    personalityFlavor: 'High morale when the route has a beat.',
    regionIds: ['boardwalk'],
    unlockRequirement: { distanceMiles: 900, regionIds: ['boardwalk'] }
  },
  {
    id: 'passport_stamper',
    name: 'Passport Stamper',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'Turns every landmark into paperwork and somehow increases momentum.',
    baseCost: 36000,
    costMultiplier: 2.12,
    maxCount: 5,
    milesPerSecond: milesFromFeet(900),
    recruitChancePerMinute: 0.007,
    leaveChancePerMinute: 0.036,
    moraleSensitivity: 1.4,
    rarity: 'rare',
    personalityFlavor: 'Official stamp energy, unofficial route authority.',
    regionIds: ['paris', 'great_wall', 'around_world'],
    unlockRequirement: { distanceMiles: 10000, regionIds: ['paris', 'great_wall', 'around_world'] }
  },
  {
    id: 'moon_boot_intern',
    name: 'Moon Boot Intern',
    image: '/assets/items/shop_follower_rare.svg',
    description: 'A post-reset recruit who insists lunar walking belongs on the resume.',
    baseCost: 52000,
    costMultiplier: 2.18,
    maxCount: 4,
    milesPerSecond: milesFromFeet(1200),
    recruitChancePerMinute: 0.006,
    leaveChancePerMinute: 0.04,
    moraleSensitivity: 1.45,
    rarity: 'rare',
    personalityFlavor: 'Ambitious, undertrained, weirdly aerodynamic.',
    unlockRequirement: { earthLoopsCompleted: 1 }
  }
];

export const createInitialFollowerMoraleState = (): FollowerMoraleState => ({
  value: 72,
  recentStory: null,
  lastStoryAt: null
});

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getTotalFollowerCount = (state: GameState): number =>
  Object.values(state.followers).reduce((sum, count) => sum + Math.max(0, count), 0);

export const getFollowerMoraleLabel = (value: number): 'Happy' | 'Neutral' | 'Annoyed' | 'Mad' => {
  if (value >= 72) return 'Happy';
  if (value >= 50) return 'Neutral';
  if (value >= 30) return 'Annoyed';
  return 'Mad';
};

export const getFollowerLeaveChanceReduction = (state: GameState): number =>
  clamp(getCosmeticEffectBonus(state, 'follower_leave_chance_reduction') + state.prestige.followerStabilityBonus, 0, 0.6);

export const getFollowerMoraleBonus = (state: GameState): number =>
  clamp(getCosmeticEffectBonus(state, 'follower_morale_bonus'), 0, 0.35);

export const getFollowerMoraleDpsMultiplier = (state: GameState): number => {
  const label = getFollowerMoraleLabel(state.followerMorale.value);
  if (label === 'Happy') return 1.05;
  if (label === 'Neutral') return 1;
  if (label === 'Annoyed') return 0.86;
  return 0.68;
};

const getMoraleTarget = (state: GameState): number => {
  const followerCount = getTotalFollowerCount(state);
  if (followerCount === 0) return 72;

  const crowdPressure = Math.max(0, followerCount - 3) * 0.42;
  const moraleBonus = getFollowerMoraleBonus(state) * 100;
  const stabilityBonus = getFollowerLeaveChanceReduction(state) * 45;
  return clamp(74 + moraleBonus + stabilityBonus - crowdPressure, 24, 94);
};

const setFollowerStory = (state: GameState, story: string, now: number): GameState => ({
  ...state,
  followerMorale: {
    ...state.followerMorale,
    recentStory: story,
    lastStoryAt: now
  },
  ui: {
    ...state.ui,
    toast: state.ui.toast ?? story
  }
});

export const runFollowerDynamics = (
  state: GameState,
  deltaSeconds: number,
  now: number,
  random = Math.random
): GameState => {
  const followerCount = getTotalFollowerCount(state);
  const currentMorale = state.followerMorale?.value ?? createInitialFollowerMoraleState().value;
  const targetMorale = getMoraleTarget(state);
  const drift = clamp(deltaSeconds / 75, 0, 0.2);
  let next: GameState = {
    ...state,
    followerMorale: {
      ...(state.followerMorale ?? createInitialFollowerMoraleState()),
      value: clamp(currentMorale + (targetMorale - currentMorale) * drift, 0, 100)
    }
  };

  if (followerCount <= 0 || deltaSeconds <= 0) return next;

  const morale = next.followerMorale.value;
  const moraleRecruitMultiplier = morale >= 72 ? 1.18 : morale >= 50 ? 1 : morale >= 30 ? 0.72 : 0.38;
  const moraleLeaveMultiplier = morale >= 72 ? 0.55 : morale >= 50 ? 1 : morale >= 30 ? 1.75 : 2.7;
  const recruitResistance = 1 / (1 + followerCount / 32);
  const regionEffect = getCurrentRegionEffect(next);
  const activeRecruitMultiplier = next.activeBoosts
    .filter((boost) => boost.effectType === 'follower_recruit_multiplier')
    .reduce((acc, boost) => acc * boost.multiplier, 1);
  const activeStabilityBonus =
    next.activeBoosts
      .filter((boost) => boost.effectType === 'follower_stability_multiplier')
      .reduce((acc, boost) => acc * boost.multiplier, 1) - 1;
  const regionalRecruitMultiplier = 1 + (regionEffect.followerRecruitMultiplier ?? 0);
  const leaveReduction = clamp(
    getFollowerLeaveChanceReduction(next) + (regionEffect.followerStabilityMultiplier ?? 0) + Math.max(0, activeStabilityBonus),
    0,
    0.82
  );
  const crowdLeaveMultiplier = 1 + followerCount / 38;
  const storyAllowed = !next.followerMorale.lastStoryAt || now - next.followerMorale.lastStoryAt > 25000;

  for (const follower of FOLLOWERS) {
    const count = next.followers[follower.id] ?? 0;
    if (count <= 0) continue;

    const recruitsAtCap = count >= follower.maxCount;
    const recruitChance =
      recruitsAtCap
        ? 0
        : 1 -
          Math.pow(
            1 - follower.recruitChancePerMinute * moraleRecruitMultiplier * recruitResistance * regionalRecruitMultiplier * activeRecruitMultiplier,
            (count * deltaSeconds) / 60
          );
    if (recruitChance > 0 && random() < recruitChance) {
      const nextCount = Math.min(follower.maxCount, count + 1);
      next = {
        ...next,
        followers: {
          ...next.followers,
          [follower.id]: nextCount
        },
        stats: {
          ...next.stats,
          followersHired: next.stats.followersHired + (nextCount - count)
        }
      };
      if (storyAllowed) {
        next = setFollowerStory(next, `${follower.name} recruited another walker.`, now);
      }
      break;
    }

    const adjustedLeaveChance =
      follower.leaveChancePerMinute *
      follower.moraleSensitivity *
      moraleLeaveMultiplier *
      crowdLeaveMultiplier *
      (1 - leaveReduction);
    const leaveChance = 1 - Math.pow(1 - adjustedLeaveChance, (count * deltaSeconds) / 60);
    if (leaveChance > 0 && random() < leaveChance) {
      const nextCount = Math.max(0, count - 1);
      const followers = { ...next.followers };
      if (nextCount > 0) {
        followers[follower.id] = nextCount;
      } else {
        delete followers[follower.id];
      }
      next = {
        ...next,
        followers,
        followerMorale: {
          ...next.followerMorale,
          value: clamp(next.followerMorale.value - 4, 0, 100)
        }
      };
      if (storyAllowed) {
        next = setFollowerStory(next, `${follower.name} got annoyed and left the crew.`, now);
      }
      break;
    }
  }

  return next;
};
