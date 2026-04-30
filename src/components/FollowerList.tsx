import { getFollowerCost } from '../game/formulas';
import { FOLLOWERS } from '../game/followers';
import { getSpendableWalkerBucks } from '../game/economy';
import type { Follower, GameState } from '../game/types';

type FollowerListProps = {
  state: GameState;
  onBuyFollower: (follower: Follower) => void;
  isUnlocked: (requirement: Follower['unlockRequirement']) => boolean;
};

export const FollowerList = ({ state, onBuyFollower, isUnlocked }: FollowerListProps) => (
  <div className="shop-list">
    {FOLLOWERS.map((follower) => {
      const count = state.followers[follower.id] ?? 0;
      const maxed = count >= follower.maxCount;
      const unlocked = isUnlocked(follower.unlockRequirement);
      const cost = getFollowerCost(follower, count);
      const affordable = getSpendableWalkerBucks(state) >= cost;

      return (
        <article key={follower.id} className="panel shop-card">
          <h4>{follower.name}</h4>
          <p>{follower.description}</p>
          <p className="muted">Owned {count}/{follower.maxCount}</p>
          <p className="muted">+{follower.milesPerSecond.toFixed(4)} mi/sec each</p>
          <p className="muted">Cost: {cost.toLocaleString()} WB</p>
          <button
            type="button"
            className="mini-btn"
            disabled={!unlocked || !affordable || maxed}
            onClick={() => onBuyFollower(follower)}
          >
            {maxed ? 'Maxed' : unlocked ? (affordable ? 'Hire' : 'Need WB') : 'Locked'}
          </button>
        </article>
      );
    })}
  </div>
);
