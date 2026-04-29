import { getSharedInventoryEntitlements } from '../game/items';
import type { GameState } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type SharedInventoryPanelProps = {
  state: GameState;
};

export const SharedInventoryPanel = ({ state }: SharedInventoryPanelProps) => {
  const entitlements = getSharedInventoryEntitlements(state);

  return (
    <section className="collection-panel" aria-label="Shared WalkerBucks inventory">
      <div className="section-head">
        <h4>Shared Inventory</h4>
        <span>{entitlements.length} items</span>
      </div>
      {entitlements.length === 0 && (
        <p className="coming-soon">Shared marketplace purchases will appear here as read-only entitlements.</p>
      )}
      <div className="shop-list">
        {entitlements.map((item) => (
          <article key={item.itemInstanceId} className="panel shop-card">
            <div className="item-card-layout">
              <ItemArtwork
                item={{
                  itemId: item.itemId ?? undefined,
                  assetPath: item.assetPath,
                  assetFilename: item.assetFilename,
                  type: item.knownLocalItem ? 'collectible' : 'shared'
                }}
              />
              <div className="item-card-body">
                <div className="card-row">
                  <h4>{item.name}</h4>
                  <span className="pill">{item.knownLocalItem ? 'Mapped' : 'Shared-only'}</span>
                </div>
                <p>{item.description}</p>
                <p className="muted">Instance: {item.itemInstanceId}</p>
                <p className="muted">Status: {item.status}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
