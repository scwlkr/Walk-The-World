import type { Follower } from './types';

export const FOLLOWERS: Follower[] = [
  {
    id: 'loyal_trail_dog',
    name: 'Loyal Trail Dog',
    description: 'A good dog. 10/10 pacing companion.',
    baseCost: 50,
    costMultiplier: 1.6,
    maxCount: 20,
    milesPerSecond: 0.0008
  },
  {
    id: 'trail_intern',
    name: 'Trail Intern',
    description: 'Works for exposure and granola bars.',
    baseCost: 140,
    costMultiplier: 1.7,
    maxCount: 20,
    milesPerSecond: 0.0018,
    unlockRequirement: { distanceMiles: 120 }
  },
  {
    id: 'motivational_hype_man',
    name: 'Motivational Hype Man',
    description: 'Yells “YOU GOT THIS” every 4.2 seconds.',
    baseCost: 380,
    costMultiplier: 1.75,
    maxCount: 15,
    milesPerSecond: 0.004,
    unlockRequirement: { distanceMiles: 400 }
  },
  {
    id: 'mall_walker_mentor',
    name: 'Mall Walker Mentor',
    description: 'Power laps with elite posture.',
    baseCost: 1100,
    costMultiplier: 1.85,
    maxCount: 12,
    milesPerSecond: 0.012,
    unlockRequirement: { distanceMiles: 1000 }
  },
  {
    id: 'bike_guy_it_counts',
    name: 'Guy on a Bike Who Says It Still Counts',
    description: 'Debatable ethics, undeniable pace.',
    baseCost: 4000,
    costMultiplier: 2,
    maxCount: 10,
    milesPerSecond: 0.03,
    unlockRequirement: { distanceMiles: 3000 }
  }
];
