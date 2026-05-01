import { getUpgradeCost } from '../game/formulas';
import { getSpendableWalkerBucks } from '../game/economy';
import { UPGRADES } from '../game/upgrades';
import type { GameState, Upgrade } from '../game/types';
import { ItemArtwork } from './ItemArtwork';

type UpgradeListProps = {
  state: GameState;
  onBuyUpgrade: (upgrade: Upgrade) => void;
  isUnlocked: (requirement: Upgrade['unlockRequirement']) => boolean;
};

export const UpgradeList = ({ state, onBuyUpgrade, isUnlocked }: UpgradeListProps) => (
  <div className="shop-list">
    {UPGRADES.map((upgrade) => {
      const level = state.upgrades[upgrade.id] ?? 0;
      const maxed = level >= upgrade.maxLevel;
      const unlocked = isUnlocked(upgrade.unlockRequirement);
      const cost = getUpgradeCost(upgrade, level);
      const affordable = getSpendableWalkerBucks(state) >= cost;

      return (
        <article key={upgrade.id} className="panel shop-card">
          <div className="item-card-layout">
            <ItemArtwork item={{ ...upgrade, itemType: 'upgrade' }} />
            <div className="item-card-body">
              <h4>{upgrade.name}</h4>
              <p>{upgrade.description}</p>
              <p className="muted">Level {level}/{upgrade.maxLevel}</p>
              <p className="muted">Cost: {cost.toLocaleString()} WB</p>
              <button
                type="button"
                className="mini-btn"
                disabled={!unlocked || !affordable || maxed}
                onClick={() => onBuyUpgrade(upgrade)}
              >
                {maxed ? 'Maxed' : unlocked ? (affordable ? 'Buy' : 'Not enough WB') : 'Locked'}
              </button>
            </div>
          </div>
        </article>
      );
    })}
  </div>
);
