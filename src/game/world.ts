import { EARTH_CIRCUMFERENCE_MILES } from './constants';

export const WORLDS = {
  earth: {
    id: 'earth',
    name: 'Earth',
    loopDistance: EARTH_CIRCUMFERENCE_MILES,
    isUnlocked: true
  },
  moon_locked: {
    id: 'moon_locked',
    name: 'Moonwalk Mode',
    loopDistance: 6779,
    isUnlocked: false
  }
} as const;
