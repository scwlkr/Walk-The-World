import type { GameState } from '../game/types';

type BottomControlsProps = {
  active: GameState['ui']['activeTab'];
  onWalk: () => void;
  onSelect: (tab: GameState['ui']['activeTab']) => void;
};

export const BottomControls = ({ active, onWalk, onSelect }: BottomControlsProps) => (
  <footer className="bottom-controls">
    <button type="button" className="walk-btn" onClick={onWalk}>
      WALK
    </button>
    <div className="mini-nav" role="navigation" aria-label="Game menu">
      {(['shop', 'stats', 'settings'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          className={`mini-btn hud-btn ${active === tab ? 'active' : ''}`}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  </footer>
);
