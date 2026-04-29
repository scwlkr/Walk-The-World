import { formatInventoryEffect, getInventoryQuantity, INVENTORY_ITEMS, isInventoryItemUsable } from '../game/inventory';
import type { GameState, InventoryItemDefinition } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type InventoryListProps = {
  state: GameState;
  onUseItem: (item: InventoryItemDefinition) => void;
  onEquipEquipment: (item: InventoryItemDefinition) => void;
};

export const InventoryList = ({ state, onUseItem, onEquipEquipment }: InventoryListProps) => {
  const ownedItems = INVENTORY_ITEMS.filter((item) => getInventoryQuantity(state, item.id) > 0);

  if (ownedItems.length === 0) {
    return (
      <p className="coming-soon">
        No items yet. Claim achievement rewards to start filling the backpack.
      </p>
    );
  }

  return (
    <div className="shop-list">
      {ownedItems.map((item) => {
        const quantity = getInventoryQuantity(state, item.id);
        const equipped = state.inventory.equippedEquipmentItemId === item.id;

        return (
          <article key={item.id} className="panel shop-card">
            <div className="item-card-layout">
              <ItemArtwork item={item} />
              <div className="item-card-body">
                <div className="card-row">
                  <h4>{item.name}</h4>
                  <span className="pill">{item.type}</span>
                </div>
                <p>{item.description}</p>
                <p className="muted">Owned: {quantity.toLocaleString()}</p>
                <p className="muted">Effect: {formatInventoryEffect(item)}</p>
                {isInventoryItemUsable(item) && (
                  <button type="button" className="mini-btn" onClick={() => onUseItem(item)}>
                    Use
                  </button>
                )}
                {item.type === 'consumable' && !isInventoryItemUsable(item) && (
                  <p className="muted">Planned effect</p>
                )}
                {item.type === 'equipment' && (
                  <button type="button" className="mini-btn" disabled={equipped} onClick={() => onEquipEquipment(item)}>
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                )}
                {item.type === 'cosmetic' && <p className="muted">Equip this from the cosmetics tab.</p>}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
