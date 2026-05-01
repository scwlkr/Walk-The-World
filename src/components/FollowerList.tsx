import { getFollowerCost } from '../game/formulas';
import {
  FOLLOWERS,
  getFollowerLeaveChanceReduction,
  getFollowerMoraleBonus,
  getFollowerMoraleLabel,
  getTotalFollowerCount
} from '../game/followers';
import { getSpendableWalkerBucks } from '../game/economy';
import type { Follower, GameState } from '../game/types';

type FollowerListProps = {
  state: GameState;
  onBuyFollower: (follower: Follower) => void;
  isUnlocked: (requirement: Follower['unlockRequirement']) => boolean;
};

export const FollowerList = ({ state, onBuyFollower, isUnlocked }: FollowerListProps) => {
  const morale = Math.round(state.followerMorale.value);
  const moraleLabel = getFollowerMoraleLabel(state.followerMorale.value);
  const totalFollowers = getTotalFollowerCount(state);
  const stability = Math.round(getFollowerLeaveChanceReduction(state) * 100);
  const moraleBonus = Math.round(getFollowerMoraleBonus(state) * 100);

  return (
    <div className="shop-list">
      <section className="panel shop-card crew-status-card">
        <div className="card-row">
          <h4>Crew Status</h4>
          <span className="pill">{moraleLabel}</span>
        </div>
        <p className="muted">
          {totalFollowers.toLocaleString()} walkers · Morale {morale}/100 · Stability +{stability}%
        </p>
        {moraleBonus > 0 && <p className="muted">Cosmetics add +{moraleBonus}% morale.</p>}
        {state.followerMorale.recentStory && <p>{state.followerMorale.recentStory}</p>}
      </section>

      {FOLLOWERS.map((follower) => {
        const count = state.followers[follower.id] ?? 0;
        const maxed = count >= follower.maxCount;
        const unlocked = isUnlocked(follower.unlockRequirement);
        const cost = getFollowerCost(follower, count);
        const affordable = getSpendableWalkerBucks(state) >= cost;

        return (
          <article key={follower.id} className="panel shop-card">
            <div className="card-row">
              <h4>{follower.name}</h4>
              <span className="pill">{follower.rarity}</span>
            </div>
            <p>{follower.description}</p>
            <p className="muted">{follower.personalityFlavor}</p>
            <p className="muted">Owned {count}/{follower.maxCount}</p>
            <p className="muted">+{follower.milesPerSecond.toFixed(4)} mi/sec each before morale</p>
            <p className="muted">
              Recruit {Math.round(follower.recruitChancePerMinute * 100)}%/min · Leave{' '}
              {Math.round(follower.leaveChancePerMinute * 100)}%/min
            </p>
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
};
