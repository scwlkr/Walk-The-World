import { FollowerList } from './FollowerList';
import { CatalogShopPanel } from './CatalogShopPanel';
import { CosmeticsList } from './CosmeticsList';
import { InventoryList } from './InventoryList';
import { UpgradeList } from './UpgradeList';
import type { LocalCatalogShopOffer } from '../game/items';
import type { CosmeticDefinition, Follower, GameState, InventoryItemDefinition, Upgrade } from '../game/types';

type ShopModalProps = {
  state: GameState;
  onTab: (tab: GameState['ui']['shopTab']) => void;
  onBuyUpgrade: (upgrade: Upgrade) => void;
  onBuyFollower: (follower: Follower) => void;
  onBuyCatalogOffer: (offer: LocalCatalogShopOffer) => void;
  onUseInventoryItem: (item: InventoryItemDefinition) => void;
  onEquipEquipment: (item: InventoryItemDefinition) => void;
  onEquipCosmetic: (cosmetic: CosmeticDefinition) => void;
  isUpgradeUnlocked: (requirement: Upgrade['unlockRequirement']) => boolean;
  isFollowerUnlocked: (requirement: Follower['unlockRequirement']) => boolean;
  showAdvanced?: boolean;
};

export const ShopModal = ({
  state,
  onTab,
  onBuyUpgrade,
  onBuyFollower,
  onBuyCatalogOffer,
  onUseInventoryItem,
  onEquipEquipment,
  onEquipCosmetic,
  isUpgradeUnlocked,
  isFollowerUnlocked,
  showAdvanced = false
}: ShopModalProps) => {
  if (!showAdvanced) {
    return (
      <>
        <section className="panel v01-shop-summary">
          <div className="section-head">
            <h4>v0.1 Shop</h4>
            <span>WB settled by WalkerBucks</span>
          </div>
          <p>
            Buy generators for DPS, tap upgrades for DPT, and offline-cap upgrades for return progress. Purchases use
            spendable WalkerBucks from the trusted bridge.
          </p>
        </section>
        <UpgradeList state={state} onBuyUpgrade={onBuyUpgrade} isUnlocked={isUpgradeUnlocked} />
      </>
    );
  }

  return (
    <>
      <div className="tab-row">
        {(['upgrades', 'followers', 'items', 'cosmetics'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`mini-btn ${state.ui.shopTab === tab ? 'active' : ''}`}
            onClick={() => onTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {state.ui.shopTab === 'upgrades' && (
        <UpgradeList state={state} onBuyUpgrade={onBuyUpgrade} isUnlocked={isUpgradeUnlocked} />
      )}
      {state.ui.shopTab === 'followers' && (
        <FollowerList state={state} onBuyFollower={onBuyFollower} isUnlocked={isFollowerUnlocked} />
      )}
      {state.ui.shopTab === 'items' && (
        <>
          <InventoryList state={state} onUseItem={onUseInventoryItem} onEquipEquipment={onEquipEquipment} />
          <CatalogShopPanel state={state} onBuyOffer={onBuyCatalogOffer} />
        </>
      )}
      {state.ui.shopTab === 'cosmetics' && (
        <CosmeticsList state={state} onEquipCosmetic={onEquipCosmetic} />
      )}
    </>
  );
};
