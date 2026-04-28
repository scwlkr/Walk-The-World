import type { GameState, QuestDefinition, SeasonalEventDefinition } from './types';

export const SEASONAL_EVENTS: SeasonalEventDefinition[] = [
  {
    id: 'spring_stride_festival',
    name: 'Spring Stride Festival',
    shortName: 'Spring Stride',
    description: 'A local-first route festival that adds brighter trail visuals and a seasonal daily quest.',
    startsOn: { month: 3, day: 20 },
    endsOn: { month: 5, day: 31 },
    visualTreatment: {
      bannerLabel: 'Spring route active',
      accentColor: '#f9a8d4',
      overlayColor: 'rgba(249, 168, 212, 0.10)',
      particleColor: 'rgba(253, 224, 71, 0.74)'
    },
    reward: {
      walkerBucks: 60,
      items: [{ itemId: 'spring_stride_ticket', quantity: 1 }]
    },
    localOnly: true
  }
];

export const SEASONAL_QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'spring_stride_route_push',
    name: 'Spring Route Push',
    description: 'Make progress on any active world route during Spring Stride.',
    category: 'seasonal',
    seasonalEventId: 'spring_stride_festival',
    progress: {
      type: 'world_progress',
      target: 0.04
    },
    reward: {
      walkerBucks: 60,
      items: [{ itemId: 'spring_stride_ticket', quantity: 1 }]
    },
    localOnly: true
  }
];

const getMonthDayNumber = (date: Date): number => (date.getMonth() + 1) * 100 + date.getDate();

const isDateInWindow = (date: Date, event: SeasonalEventDefinition): boolean => {
  const current = getMonthDayNumber(date);
  const starts = event.startsOn.month * 100 + event.startsOn.day;
  const ends = event.endsOn.month * 100 + event.endsOn.day;

  if (starts <= ends) return current >= starts && current <= ends;
  return current >= starts || current <= ends;
};

export const getActiveSeasonalEvent = (now = Date.now()): SeasonalEventDefinition | null => {
  const date = new Date(now);
  return SEASONAL_EVENTS.find((event) => isDateInWindow(date, event)) ?? null;
};

export const getSeasonalEventById = (eventId: string | null | undefined): SeasonalEventDefinition | undefined =>
  eventId ? SEASONAL_EVENTS.find((event) => event.id === eventId) : undefined;

export const getSeasonalQuestDefinitions = (eventId: string | null | undefined): QuestDefinition[] =>
  eventId ? SEASONAL_QUEST_DEFINITIONS.filter((quest) => quest.seasonalEventId === eventId) : [];

export const getActiveSeasonalEventForState = (state: GameState): SeasonalEventDefinition | null =>
  getSeasonalEventById(state.quests.seasonalEventId) ?? null;
