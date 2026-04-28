export type BackgroundScene = {
  id: string;
  name: string;
  src: string;
  pathTint: string;
  pathLine: string;
  pathYRatio: number;
};

export const BACKGROUND_SCENES: Record<string, BackgroundScene> = {
  walkertown: {
    id: 'walkertown',
    name: 'Walkertown',
    src: '/assets/backgrounds/walkertown/composite.png',
    pathTint: 'rgba(126, 83, 35, 0.82)',
    pathLine: 'rgba(255, 237, 175, 0.34)',
    pathYRatio: 0.82
  },
  suburb: {
    id: 'suburb',
    name: 'Suburb',
    src: '/assets/backgrounds/suburb/composite.png',
    pathTint: 'rgba(117, 80, 43, 0.78)',
    pathLine: 'rgba(255, 237, 175, 0.34)',
    pathYRatio: 0.82
  },
  dallas: {
    id: 'dallas',
    name: 'Dallas',
    src: '/assets/backgrounds/dallas/composite.png',
    pathTint: 'rgba(55, 65, 81, 0.78)',
    pathLine: 'rgba(226, 232, 240, 0.32)',
    pathYRatio: 0.82
  },
  skyline: {
    id: 'skyline',
    name: 'Skyline',
    src: '/assets/backgrounds/skyline/composite.png',
    pathTint: 'rgba(55, 65, 81, 0.78)',
    pathLine: 'rgba(226, 232, 240, 0.32)',
    pathYRatio: 0.82
  },
  grand_canyon: {
    id: 'grand_canyon',
    name: 'Grand Canyon',
    src: '/assets/backgrounds/grand_canyon/composite.png',
    pathTint: 'rgba(146, 64, 14, 0.72)',
    pathLine: 'rgba(254, 215, 170, 0.35)',
    pathYRatio: 0.82
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    src: '/assets/backgrounds/desert/composite.png',
    pathTint: 'rgba(154, 52, 18, 0.72)',
    pathLine: 'rgba(254, 215, 170, 0.35)',
    pathYRatio: 0.82
  },
  niagara_falls: {
    id: 'niagara_falls',
    name: 'Niagara Falls',
    src: '/assets/backgrounds/niagara_falls/composite.png',
    pathTint: 'rgba(15, 118, 110, 0.7)',
    pathLine: 'rgba(207, 250, 254, 0.34)',
    pathYRatio: 0.82
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo',
    src: '/assets/backgrounds/tokyo/composite.png',
    pathTint: 'rgba(49, 46, 129, 0.76)',
    pathLine: 'rgba(221, 214, 254, 0.35)',
    pathYRatio: 0.82
  },
  great_wall_china: {
    id: 'great_wall_china',
    name: 'Great Wall',
    src: '/assets/backgrounds/great_wall_china/composite.png',
    pathTint: 'rgba(120, 83, 45, 0.74)',
    pathLine: 'rgba(254, 240, 138, 0.28)',
    pathYRatio: 0.82
  },
  rome: {
    id: 'rome',
    name: 'Rome',
    src: '/assets/backgrounds/rome/composite.png',
    pathTint: 'rgba(120, 83, 45, 0.72)',
    pathLine: 'rgba(254, 240, 138, 0.3)',
    pathYRatio: 0.82
  },
  paris: {
    id: 'paris',
    name: 'Paris',
    src: '/assets/backgrounds/paris/composite.png',
    pathTint: 'rgba(100, 75, 55, 0.7)',
    pathLine: 'rgba(254, 240, 138, 0.3)',
    pathYRatio: 0.82
  },
  london: {
    id: 'london',
    name: 'London',
    src: '/assets/backgrounds/london/composite.png',
    pathTint: 'rgba(55, 65, 81, 0.76)',
    pathLine: 'rgba(226, 232, 240, 0.3)',
    pathYRatio: 0.82
  },
  moon_surface: {
    id: 'moon_surface',
    name: 'Moon Surface',
    src: '/assets/backgrounds/moon_surface/composite.png',
    pathTint: 'rgba(71, 85, 105, 0.72)',
    pathLine: 'rgba(226, 232, 240, 0.28)',
    pathYRatio: 0.82
  }
};

export const getBackgroundScene = (sceneId: string): BackgroundScene =>
  BACKGROUND_SCENES[sceneId] ?? BACKGROUND_SCENES.walkertown;
