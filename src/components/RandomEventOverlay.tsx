import type { CSSProperties } from 'react';
import { EncounterSprite } from './EncounterSprite';
import { ItemArtwork } from './ItemArtwork';
import { getRandomEventPresentation } from '../game/encounterPresentation';
import { RANDOM_EVENTS } from '../game/randomEvents';
import type { SpawnedRandomEvent } from '../game/types';

type RandomEventOverlayProps = {
  spawnedEvent: SpawnedRandomEvent | null;
  onClaim: () => void;
};

export const RandomEventOverlay = ({ spawnedEvent, onClaim }: RandomEventOverlayProps) => {
  if (!spawnedEvent) return null;
  const def = RANDOM_EVENTS.find((event) => event.id === spawnedEvent.eventDefId);
  const presentation = def ? getRandomEventPresentation(def) : null;
  const overlayStyle = presentation ? ({ '--event-accent': presentation.accent } as CSSProperties) : undefined;

  return (
    <button type="button" className="event-overlay event-card" style={overlayStyle} onClick={onClaim}>
      <span className="event-overlay-main">
        <span className="event-visual" aria-hidden={!presentation?.sprite}>
          {presentation?.sprite ? <EncounterSprite sprite={presentation.sprite} /> : null}
          {!presentation?.sprite && presentation?.item ? <ItemArtwork item={presentation.item} className="event-item-art" /> : null}
          {presentation?.sprite && presentation.item ? <ItemArtwork item={presentation.item} className="event-corner-art" /> : null}
          {!presentation?.sprite && !presentation?.item ? <span className="event-glyph">!</span> : null}
        </span>
        <span className="event-copy">
          <span className="event-kicker">{presentation?.kicker ?? 'Event'}</span>
          <strong>{spawnedEvent.label}</strong>
          <small>{def?.description}</small>
        </span>
      </span>
    </button>
  );
};
