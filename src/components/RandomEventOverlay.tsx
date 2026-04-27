import { RANDOM_EVENTS } from '../game/randomEvents';
import type { SpawnedRandomEvent } from '../game/types';

type RandomEventOverlayProps = {
  spawnedEvent: SpawnedRandomEvent | null;
  onClaim: () => void;
};

export const RandomEventOverlay = ({ spawnedEvent, onClaim }: RandomEventOverlayProps) => {
  if (!spawnedEvent) return null;
  const def = RANDOM_EVENTS.find((event) => event.id === spawnedEvent.eventDefId);
  return (
    <button type="button" className="event-overlay" onClick={onClaim}>
      <span>⚡ {spawnedEvent.label}</span>
      <small>{def?.description}</small>
    </button>
  );
};
