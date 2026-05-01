import { getSpendableWalkerBucks } from '../game/economy';
import { getLocalCatalogShopOffers, type LocalCatalogShopOffer } from '../game/items';
import { getCurrentRegion, getDailyRegionalOfferIds } from '../game/regions';
import type { GameState } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type CatalogShopPanelProps = {
  state: GameState;
  onBuyOffer: (offer: LocalCatalogShopOffer) => void;
};

const V02_FEATURED_OFFER_IDS = new Set([
  'offer_trail_mix_main',
  'offer_touch_grass_token_main',
  'offer_aura_battery_main',
  'offer_lucky_shoelaces_main',
  'offer_detour_token_main',
  'offer_retro_sweatband_main',
  'offer_lucky_laces_main',
  'offer_gas_station_sunglasses_main',
  'offer_trail_socks_main',
  'offer_starter_step_counter_main',
  'offer_fresh_socks_main',
  'offer_walking_playlist_main',
  'offer_peace_offering_granola_main',
  'offer_group_chat_invite_main',
  'offer_spring_stride_crown_limited'
]);

export const CatalogShopPanel = ({ state, onBuyOffer }: CatalogShopPanelProps) => {
  const region = getCurrentRegion(state);
  const regionalOfferIds = new Set(getDailyRegionalOfferIds(state));
  const offers = getLocalCatalogShopOffers(state).filter(
    (offer) => V02_FEATURED_OFFER_IDS.has(offer.offerId) || regionalOfferIds.has(offer.offerId)
  );

  return (
    <section className="collection-panel" aria-label="WalkerBucks item catalog shop">
      <div className="section-head">
        <h4>Boosts & Regional Gear</h4>
        <span>{region.shortName} refresh · {offers.length} offers</span>
      </div>
      <div className="shop-list">
        {offers.map((offer) => {
          const limitReached = Boolean(
            offer.purchaseLimitPerAccount && offer.ownedQuantity >= offer.purchaseLimitPerAccount
          );
          const affordable = getSpendableWalkerBucks(state) >= offer.priceWb;
          const disabled = !offer.unlocked || !affordable || limitReached;
          const soldOutLabel = offer.purchaseLimitPerAccount === 1 ? 'Owned' : 'Purchased';
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
                  {regionalOfferIds.has(offer.offerId) && <p className="muted">Regional shop: {region.name}</p>}
                  {offer.lockedReason && <p className="muted">{offer.lockedReason}</p>}
                  <button type="button" className="mini-btn" disabled={disabled} onClick={() => onBuyOffer(offer)}>
                    {limitReached
                      ? soldOutLabel
                      : offer.unlocked
                        ? affordable
                          ? 'Buy item'
                          : 'Not enough WB'
                        : 'Locked'}
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
