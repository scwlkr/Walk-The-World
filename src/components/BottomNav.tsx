import type { GameState } from '../game/types';

type BottomNavProps = {
  active: GameState['ui']['activeTab'];
  onSelect: (tab: GameState['ui']['activeTab']) => void;
};

export const BottomNav = ({ active, onSelect }: BottomNavProps) => (
  <nav className="panel bottom-nav">
    {(['walk', 'shop', 'stats', 'settings'] as const).map((tab) => (
      <button
        key={tab}
        type="button"
        className={`mini-btn ${active === tab ? 'active' : ''}`}
        onClick={() => onSelect(tab)}
      >
        {tab}
      </button>
    ))}
  </nav>
);
