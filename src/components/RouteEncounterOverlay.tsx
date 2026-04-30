import type { CSSProperties } from 'react';
import { EncounterSprite } from './EncounterSprite';
import { ItemArtwork } from './ItemArtwork';
import {
  getRouteChoiceItems,
  getRouteEncounterPresentation
} from '../game/encounterPresentation';
import { getRouteEncounterById } from '../game/routeEncounters';
import type { RouteEncounterChoice, SpawnedRouteEncounter } from '../game/types';

type RouteEncounterOverlayProps = {
  spawnedEncounter: SpawnedRouteEncounter | null;
  onChoose: (choice: RouteEncounterChoice) => void;
};

export const RouteEncounterOverlay = ({ spawnedEncounter, onChoose }: RouteEncounterOverlayProps) => {
  if (!spawnedEncounter) return null;
  const encounter = getRouteEncounterById(spawnedEncounter.encounterDefId);
  if (!encounter) return null;
  const presentation = getRouteEncounterPresentation(encounter);
  const overlayStyle = { '--event-accent': presentation.accent } as CSSProperties;

  return (
    <article className="event-overlay route-encounter-overlay event-card" style={overlayStyle}>
      <div className="event-overlay-main">
        <span className="event-visual" aria-hidden={!presentation.sprite}>
          {presentation.sprite ? <EncounterSprite sprite={presentation.sprite} /> : null}
          {!presentation.sprite && presentation.item ? <ItemArtwork item={presentation.item} className="event-item-art" /> : null}
          {presentation.sprite && presentation.item ? <ItemArtwork item={presentation.item} className="event-corner-art" /> : null}
        </span>
        <span className="event-copy">
          <span className="event-kicker">{presentation.kicker}</span>
          <strong>{spawnedEncounter.label}</strong>
          <small>{encounter.description}</small>
        </span>
      </div>
      <div className="encounter-choice-row">
        {encounter.choices.map((choice) => {
          const previewItems = getRouteChoiceItems(choice).slice(0, 2);
          return (
            <button key={choice.id} type="button" className="mini-btn encounter-choice-btn" onClick={() => onChoose(choice)}>
              <span className="choice-reward-icons" aria-hidden="true">
                {previewItems.map((item) => (
                  <ItemArtwork key={item.id ?? item.name} item={item} className="choice-preview-art" />
                ))}
              </span>
              <span className="choice-copy">
                <strong>{choice.label}</strong>
                <small>{choice.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
};
