import type { GameState, OnboardingState, OnboardingStepId, TutorialFlags } from '../game/types';

export const ONBOARDING_STEPS: OnboardingStepId[] = [
  'welcome',
  'tap',
  'dps',
  'walkerbucks',
  'shop',
  'inventory',
  'offline_progress'
];

export const createCleanTutorialFlags = (): TutorialFlags => ({
  hasSeenWelcome: false,
  hasSeenTapPrompt: false,
  hasSeenDpsExplanation: false,
  hasSeenShopIntro: false,
  hasSeenWalkerBucksIntro: false,
  hasSeenOfflineProgressIntro: false,
  hasSeenInventoryIntro: false
});

export const createCompletedTutorialFlags = (): TutorialFlags => ({
  hasSeenWelcome: true,
  hasSeenTapPrompt: true,
  hasSeenDpsExplanation: true,
  hasSeenShopIntro: true,
  hasSeenWalkerBucksIntro: true,
  hasSeenOfflineProgressIntro: true,
  hasSeenInventoryIntro: true
});

export const createNotStartedOnboarding = (): OnboardingState => ({
  status: 'not_started',
  currentStep: null,
  completedSteps: [],
  skipped: false,
  startedAt: null,
  completedAt: null
});

export const createCompletedOnboarding = (nowIso = new Date().toISOString()): OnboardingState => ({
  status: 'completed',
  currentStep: null,
  completedSteps: [...ONBOARDING_STEPS],
  skipped: false,
  startedAt: nowIso,
  completedAt: nowIso
});

const flagForStep = (step: OnboardingStepId): keyof TutorialFlags => {
  switch (step) {
    case 'welcome':
      return 'hasSeenWelcome';
    case 'tap':
      return 'hasSeenTapPrompt';
    case 'dps':
      return 'hasSeenDpsExplanation';
    case 'walkerbucks':
      return 'hasSeenWalkerBucksIntro';
    case 'shop':
      return 'hasSeenShopIntro';
    case 'inventory':
      return 'hasSeenInventoryIntro';
    case 'offline_progress':
      return 'hasSeenOfflineProgressIntro';
  }
};

export const startOnboarding = (state: GameState, nowIso = new Date().toISOString()): GameState => ({
  ...state,
  onboarding: {
    ...state.onboarding,
    status: 'in_progress',
    currentStep: state.onboarding.currentStep ?? 'welcome',
    skipped: false,
    startedAt: state.onboarding.startedAt ?? nowIso,
    completedAt: null
  }
});

export const completeCurrentOnboardingStep = (
  state: GameState,
  nowIso = new Date().toISOString()
): GameState => {
  const active = state.onboarding.currentStep ?? 'welcome';
  const completedSteps = state.onboarding.completedSteps.includes(active)
    ? state.onboarding.completedSteps
    : [...state.onboarding.completedSteps, active];
  const currentIndex = ONBOARDING_STEPS.indexOf(active);
  const nextStep = ONBOARDING_STEPS[currentIndex + 1] ?? null;
  const completed = nextStep === null;

  return {
    ...state,
    tutorialFlags: {
      ...state.tutorialFlags,
      [flagForStep(active)]: true
    },
    onboarding: {
      ...state.onboarding,
      status: completed ? 'completed' : 'in_progress',
      currentStep: nextStep,
      completedSteps,
      skipped: false,
      startedAt: state.onboarding.startedAt ?? nowIso,
      completedAt: completed ? nowIso : null
    }
  };
};

export const skipOnboarding = (state: GameState, nowIso = new Date().toISOString()): GameState => ({
  ...state,
  onboarding: {
    ...state.onboarding,
    status: 'skipped',
    currentStep: null,
    skipped: true,
    startedAt: state.onboarding.startedAt ?? nowIso,
    completedAt: null
  }
});

export const replayOnboarding = (state: GameState, nowIso = new Date().toISOString()): GameState => ({
  ...state,
  onboarding: {
    status: 'in_progress',
    currentStep: 'welcome',
    completedSteps: [],
    skipped: false,
    startedAt: nowIso,
    completedAt: null
  },
  tutorialFlags: createCleanTutorialFlags()
});

export const clearTutorialFlags = (state: GameState): GameState => ({
  ...state,
  tutorialFlags: createCleanTutorialFlags()
});
