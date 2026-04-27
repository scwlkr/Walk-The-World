import { FollowerList } from './FollowerList';
import { UpgradeList } from './UpgradeList';
import type { Follower, GameState, Upgrade } from '../game/types';

type ShopModalProps = {
  state: GameState;
  onTab: (tab: GameState['ui']['shopTab']) => void;
  onBuyUpgrade: (upgrade: Upgrade) => void;
  onBuyFollower: (follower: Follower) => void;
  isUpgradeUnlocked: (requirement: Upgrade['unlockRequirement']) => boolean;
  isFollowerUnlocked: (requirement: Follower['unlockRequirement']) => boolean;
};

export const ShopModal = ({
  state,
  onTab,
  onBuyUpgrade,
  onBuyFollower,
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
    {(state.ui.shopTab === 'items' || state.ui.shopTab === 'cosmetics') && (
      <p className="coming-soon">Coming soon in Walker World C-version.</p>
    )}
  </>
);
