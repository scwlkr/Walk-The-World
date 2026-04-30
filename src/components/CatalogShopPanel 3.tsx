import { getSpendableWalkerBucks } from '../game/economy';
import { getLocalCatalogShopOffers, type LocalCatalogShopOffer } from '../game/items';
import type { GameState } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type CatalogShopPanelProps = {
  state: GameState;
  onBuyOffer: (offer: LocalCatalogShopOffer) => void;
};

export const CatalogShopPanel = ({ state, onBuyOffer }: CatalogShopPanelProps) => {
  const offers = getLocalCatalogShopOffers(state).slice(0, 12);

  return (
    <section className="collection-panel" aria-label="WalkerBucks item catalog shop">
      <div className="section-head">
        <h4>Catalog Shop</h4>
        <span>{offers.length} offers</span>
      </div>
      <div className="shop-list">
        {offers.map((offer) => {
          const limitReached = Boolean(
            offer.purchaseLimitPerAccount && offer.ownedQuantity >= offer.purchaseLimitPerAccount
          );
          const affordable = getSpendableWalkerBucks(state) >= offer.priceWb;
          const disabled = !offer.unlocked || !affordable || limitReached;
          return (
            <article key={offer.offerId} className="panel shop-card">
              <div className="item-card-layout">
                <ItemArtwork item={offer.item} />
                <div className="item-card-body">
                  <div className="card-row">
                    <h4>{offer.item.name}</h4>
                    <span className="pill">{offer.priceWb.toLocaleString()} WB</span>
                  </div>
                  <p>{offer.item.description}</p>
                  <p className="muted">
                    {offer.item.rarity} {offer.item.type} · Owned {offer.ownedQuantity.toLocaleString()}
                  </p>
                  {offer.lockedReason && <p className="muted">{offer.lockedReason}</p>}
                  <button type="button" className="mini-btn" disabled={disabled} onClick={() => onBuyOffer(offer)}>
                    {limitReached ? 'Limit reached' : offer.unlocked ? (affordable ? 'Buy item' : 'Need WB') : 'Locked'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
