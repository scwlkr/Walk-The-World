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

  return (
    <article className="event-overlay route-encounter-overlay">
      <span>{spawnedEncounter.label}</span>
      <small>{encounter.description}</small>
      <div className="encounter-choice-row">
        {encounter.choices.map((choice) => (
          <button key={choice.id} type="button" className="mini-btn" onClick={() => onChoose(choice)}>
            {choice.label}
          </button>
        ))}
      </div>
    </article>
  );
};
