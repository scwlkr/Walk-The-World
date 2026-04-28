import { FollowerList } from './FollowerList';
import { CosmeticsList } from './CosmeticsList';
import { InventoryList } from './InventoryList';
import { UpgradeList } from './UpgradeList';
import type { CosmeticDefinition, Follower, GameState, InventoryItemDefinition, Upgrade } from '../game/types';

type ShopModalProps = {
  state: GameState;
  onTab: (tab: GameState['ui']['shopTab']) => void;
  onBuyUpgrade: (upgrade: Upgrade) => void;
  onBuyFollower: (follower: Follower) => void;
  onUseInventoryItem: (item: InventoryItemDefinition) => void;
  onEquipEquipment: (item: InventoryItemDefinition) => void;
  onEquipCosmetic: (cosmetic: CosmeticDefinition) => void;
  isUpgradeUnlocked: (requirement: Upgrade['unlockRequirement']) => boolean;
  isFollowerUnlocked: (requirement: Follower['unlockRequirement']) => boolean;
};

export const ShopModal = ({
  state,
  onTab,
  onBuyUpgrade,
  onBuyFollower,
  onUseInventoryItem,
  onEquipEquipment,
  onEquipCosmetic,
  isUpgradeUnlocked,
  isFollowerUnlocked
}: ShopModalProps) => (
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
      <InventoryList state={state} onUseItem={onUseInventoryItem} onEquipEquipment={onEquipEquipment} />
    )}
    {state.ui.shopTab === 'cosmetics' && (
      <CosmeticsList state={state} onEquipCosmetic={onEquipCosmetic} />
    )}
  </>
);
