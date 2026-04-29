import type { Landmark, WorldId } from './types';

export const EARTH_LANDMARKS: Landmark[] = [
  { name: 'Walkertown', distanceMiles: 0, biome: 'plains', sceneId: 'walkertown' },
  { name: 'Corner Marker', distanceMiles: 0.04, biome: 'plains', sceneId: 'walkertown' },
  { name: 'Corner Store', distanceMiles: 0.16, biome: 'city', sceneId: 'suburb' },
  { name: 'Trailhead Sign', distanceMiles: 0.42, biome: 'plains', sceneId: 'suburb' },
  { name: 'Dallas', distanceMiles: 250, biome: 'city', sceneId: 'dallas' },
  { name: 'Grand Canyon', distanceMiles: 1100, biome: 'desert', sceneId: 'grand_canyon' },
  { name: 'Las Vegas', distanceMiles: 1500, biome: 'city', sceneId: 'desert' },
  { name: 'Los Angeles', distanceMiles: 1900, biome: 'city', sceneId: 'skyline' },
  { name: 'Pacific Ocean', distanceMiles: 4000, biome: 'ocean', sceneId: 'niagara_falls' },
  { name: 'Tokyo', distanceMiles: 6200, biome: 'city', sceneId: 'tokyo' },
  { name: 'Mount Everest', distanceMiles: 9000, biome: 'mountain', sceneId: 'great_wall_china' },
  { name: 'Dubai', distanceMiles: 11500, biome: 'desert', sceneId: 'desert' },
  { name: 'Rome', distanceMiles: 14000, biome: 'city', sceneId: 'rome' },
  { name: 'Paris', distanceMiles: 15300, biome: 'city', sceneId: 'paris' },
  { name: 'London', distanceMiles: 16000, biome: 'city', sceneId: 'london' },
  { name: 'New York', distanceMiles: 21000, biome: 'city', sceneId: 'skyline' },
  { name: 'Walkertown Return', distanceMiles: 24901, biome: 'plains', sceneId: 'suburb' }
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
