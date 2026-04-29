import {
  COSMETICS,
  formatCosmeticEffect,
  getCosmeticSlotLabel
} from '../game/cosmetics';
import type { CosmeticDefinition, GameState } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type CosmeticsListProps = {
  state: GameState;
  onEquipCosmetic: (cosmetic: CosmeticDefinition) => void;
};

export const CosmeticsList = ({ state, onEquipCosmetic }: CosmeticsListProps) => {
  const ownedCosmetics = COSMETICS.filter((cosmetic) => state.cosmetics.owned[cosmetic.id]);

  if (ownedCosmetics.length === 0) {
    return (
      <p className="coming-soon">
        No cosmetics yet. Achievement rewards unlock gameplay-affecting cosmetics.
      </p>
    );
  }

  return (
    <div className="shop-list">
      {ownedCosmetics.map((cosmetic) => {
        const equipped = state.cosmetics.equippedBySlot[cosmetic.slot] === cosmetic.id;

        return (
          <article key={cosmetic.id} className="panel shop-card">
            <div className="item-card-layout">
              <ItemArtwork item={cosmetic} />
              <div className="item-card-body">
                <div className="card-row">
                  <h4>{cosmetic.name}</h4>
                  <span className="pill">{getCosmeticSlotLabel(cosmetic.slot)}</span>
                </div>
                <p>{cosmetic.description}</p>
                <p className="muted">Effect: {formatCosmeticEffect(cosmetic)}</p>
                <button type="button" className="mini-btn" disabled={equipped} onClick={() => onEquipCosmetic(cosmetic)}>
                  {equipped ? 'Equipped' : 'Equip'}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
