import { getMarketplacePurchaseStateId, getSpendableWalkerBucks } from '../game/economy';
import { getInventoryItemById, INVENTORY_ITEMS } from '../game/inventory';
import type { ItemImageCandidate } from '../game/itemImages';
import type { GameState, WalkerBucksMarketplaceOffer } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type MarketplacePanelProps = {
  state: GameState;
  isBridgeConfigured: boolean;
  isSignedIn: boolean;
  isBusy: boolean;
  onRefreshMarketplace: () => void;
  onPurchaseOffer: (offer: WalkerBucksMarketplaceOffer) => void;
};

const getStatusLabel = (state: GameState, isBridgeConfigured: boolean, isSignedIn: boolean): string => {
  if (!isBridgeConfigured) return 'Unavailable';
  if (!isSignedIn) return 'Sign in required';
  if (state.walkerBucksBridge.status === 'checking') return 'Checking';
  if (state.walkerBucksBridge.status === 'error') return 'Needs retry';
  return state.walkerBucksBridge.marketplaceOffers.length > 0 ? 'Loaded' : 'Ready';
};

const getActionLabel = (state: GameState, offer: WalkerBucksMarketplaceOffer): string => {
  const purchase = state.walkerBucksBridge.marketplacePurchases[getMarketplacePurchaseStateId(offer.id)];
  if (!purchase) return 'Buy with WB';
  if (purchase.status === 'pending') return 'Buy with WB';
  if (purchase.status === 'purchased') return 'Purchased';
  return 'Retry purchase';
};

const localItemByName = new Map(INVENTORY_ITEMS.map((item) => [item.name, item]));

const getMarketplaceOfferArtworkSource = (offer: WalkerBucksMarketplaceOffer): ItemImageCandidate => {
  const offerArtwork: ItemImageCandidate = {
    itemId: offer.itemId ?? offer.item_id,
    assetPath: offer.assetPath ?? offer.asset_path,
    assetFilename: offer.assetFilename ?? offer.asset_filename,
    icon: offer.icon,
    emoji: offer.emoji
  };

  if (offerArtwork.assetPath || offerArtwork.assetFilename) return offerArtwork;

  const itemId = offerArtwork.itemId;
  if (itemId) return getInventoryItemById(itemId) ?? offerArtwork;

  return localItemByName.get(offer.name) ?? offerArtwork;
};

export const MarketplacePanel = ({
  state,
  isBridgeConfigured,
  isSignedIn,
  isBusy,
  onRefreshMarketplace,
  onPurchaseOffer
}: MarketplacePanelProps) => {
  const offers = state.walkerBucksBridge.marketplaceOffers;
  const balance = state.walkerBucksBridge.balance;
  const spendableWb = getSpendableWalkerBucks(state);
  const canUseBridge = isBridgeConfigured && isSignedIn && !isBusy;

  return (
    <section className="collection-panel" aria-label="WalkerBucks marketplace">
      <div className="section-head">
        <h4>Marketplace</h4>
        <span>{getStatusLabel(state, isBridgeConfigured, isSignedIn)}</span>
      </div>

      <article className="panel shop-card">
        <div className="card-row">
          <h4>Shared Offers</h4>
          <span className="pill">{balance ? `${spendableWb.toLocaleString()} WB` : 'No balance'}</span>
        </div>
        <p className="muted">Purchases settle through the WalkerBucks bridge.</p>
        {state.walkerBucksBridge.lastError && <p className="muted">Last error: {state.walkerBucksBridge.lastError}</p>}
        <button type="button" className="mini-btn" disabled={!canUseBridge} onClick={onRefreshMarketplace}>
          {isBusy ? 'Checking' : 'Refresh offers'}
        </button>
      </article>

      <div className="shop-list">
        {offers.length === 0 && <p className="muted">No shared WalkerBucks offers loaded.</p>}
        {offers.map((offer) => {
          const purchase = state.walkerBucksBridge.marketplacePurchases[getMarketplacePurchaseStateId(offer.id)];
          const insufficientSharedWb = Boolean(balance && spendableWb < offer.priceWb);
          const disabled = !canUseBridge || purchase?.status === 'pending' || purchase?.status === 'purchased' || insufficientSharedWb;
          return (
            <article key={offer.id} className="panel shop-card">
              <div className="item-card-layout">
                <ItemArtwork item={getMarketplaceOfferArtworkSource(offer)} />
                <div className="item-card-body">
                  <div className="card-row">
                    <h4>{offer.name}</h4>
                    <span className="pill">{offer.priceWb.toLocaleString()} WB</span>
                  </div>
                  <p>{offer.description}</p>
                  <p className="muted">
                    Offer #{offer.id} · Shared item #{offer.itemDefinitionId}
                  </p>
                  {purchase?.itemInstanceId && <p className="muted">Item instance: {purchase.itemInstanceId}</p>}
                  {purchase?.lastError && <p className="muted">Last error: {purchase.lastError}</p>}
                  {insufficientSharedWb && <p className="muted">Shared balance is too low for this proof purchase.</p>}
                  <button type="button" className="mini-btn" disabled={disabled} onClick={() => onPurchaseOffer(offer)}>
                    {getActionLabel(state, offer)}
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
