import { milesFromFeet } from './distance';
import type { Landmark, WorldId } from './types';

export const EARTH_LANDMARKS: Landmark[] = [
  { name: 'Starting Room', distanceMiles: 0, biome: 'plains', sceneId: 'walkertown' },
  { name: 'Suburb Sidewalk', distanceMiles: milesFromFeet(100), biome: 'plains', sceneId: 'suburb' },
  { name: 'End of the Street', distanceMiles: milesFromFeet(1000), biome: 'plains', sceneId: 'suburb' },
  { name: 'Around the Block', distanceMiles: 0.25, biome: 'city', sceneId: 'dallas' },
  { name: 'Neighborhood Loop', distanceMiles: 1, biome: 'city', sceneId: 'skyline' },
  { name: 'Across Town', distanceMiles: 10, biome: 'city', sceneId: 'skyline' },
  { name: 'Forest Road', distanceMiles: 100, biome: 'plains', sceneId: 'forest_illusion' },
  { name: 'Desert Highway', distanceMiles: 500, biome: 'desert', sceneId: 'desert' },
  { name: 'Mountain Pass', distanceMiles: 1000, biome: 'mountain', sceneId: 'mountains' },
  { name: 'Across America', distanceMiles: 3000, biome: 'city', sceneId: 'skyline' },
  { name: 'World Tour', distanceMiles: 10000, biome: 'city', sceneId: 'paris' },
  { name: 'Around the World', distanceMiles: 24901, biome: 'plains', sceneId: 'suburb' }
];

export const MOON_LANDMARKS: Landmark[] = [
  { name: 'Tranquility Base', distanceMiles: 0, biome: 'lunar', sceneId: 'moon_surface' },
  { name: 'Sea of Serenity', distanceMiles: 900, biome: 'lunar', sceneId: 'moon_surface' },
  { name: 'Copernicus Crater', distanceMiles: 2200, biome: 'lunar', sceneId: 'moon_surface' },
  { name: 'Tycho Rim', distanceMiles: 3900, biome: 'lunar', sceneId: 'moon_surface' },
  { name: 'Far Side Relay', distanceMiles: 5400, biome: 'space', sceneId: 'moon_surface' },
  { name: 'Tranquility Return', distanceMiles: 6786, biome: 'lunar', sceneId: 'moon_surface' }
];

export const WORLD_LANDMARKS: Record<WorldId, Landmark[]> = {
  earth: EARTH_LANDMARKS,
  moon: MOON_LANDMARKS,
  mars: [
    { name: 'Mars Base Camp', distanceMiles: 0, biome: 'desert', sceneId: 'desert' },
    { name: 'Dust Ridge', distanceMiles: 40, biome: 'desert', sceneId: 'grand_canyon' },
    { name: 'Red Crater Relay', distanceMiles: 120, biome: 'space', sceneId: 'moon_surface' },
    { name: 'Prototype Return', distanceMiles: 13263, biome: 'desert', sceneId: 'desert' }
  ],
  solar_system: [{ name: 'Orbital Gate', distanceMiles: 0, biome: 'space', sceneId: 'moon_surface' }]
};

export const getLandmarksForWorld = (worldId: WorldId): Landmark[] => WORLD_LANDMARKS[worldId] ?? EARTH_LANDMARKS;
