export type WalkerAnimationState = 'walk' | 'idle' | 'click' | 'reward' | 'celebration';

export type WalkerSpriteSheet = {
  state: WalkerAnimationState;
  src: string;
  fallbackState?: WalkerAnimationState;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  renderSize: number;
};

const WALKER_BASE_SHEET = {
  frameWidth: 192,
  frameHeight: 192,
  frameCount: 9,
  fps: 8,
  renderSize: 192
} as const;

export const WALKER_ANIMATION_ASSETS: Record<WalkerAnimationState, WalkerSpriteSheet> = {
  walk: {
    state: 'walk',
    src: '/assets/characters/walker/walker_walk_right_sheet.png',
    ...WALKER_BASE_SHEET
  },
  idle: {
    state: 'idle',
    src: '/assets/characters/walker/walker_idle_sheet.png',
    fallbackState: 'walk',
    ...WALKER_BASE_SHEET,
    fps: 5
  },
  click: {
    state: 'click',
    src: '/assets/characters/walker/walker_click_sheet.png',
    fallbackState: 'walk',
    ...WALKER_BASE_SHEET,
    fps: 12
  },
  reward: {
    state: 'reward',
    src: '/assets/characters/walker/walker_reward_sheet.png',
    fallbackState: 'walk',
    ...WALKER_BASE_SHEET,
    fps: 10
  },
  celebration: {
    state: 'celebration',
    src: '/assets/characters/walker/walker_celebration_sheet.png',
    fallbackState: 'walk',
    ...WALKER_BASE_SHEET,
    fps: 10
  }
};
