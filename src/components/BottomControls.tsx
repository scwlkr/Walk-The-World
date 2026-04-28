import type { GameState } from '../game/types';

type BottomControlsProps = {
  active: GameState['ui']['activeTab'];
  onSelect: (tab: GameState['ui']['activeTab']) => void;
};

const CONTROL_ITEMS: Array<{ tab: Extract<GameState['ui']['activeTab'], 'shop' | 'quests' | 'stats' | 'settings'>; icon: string; label: string }> = [
  { tab: 'shop', icon: '👜', label: 'Shop' },
  { tab: 'quests', icon: '🎯', label: 'Quests' },
  { tab: 'stats', icon: '📊', label: 'Stats' },
  { tab: 'settings', icon: '⚙️', label: 'Settings' }
];

export const BottomControls = ({ active, onSelect }: BottomControlsProps) => (
  <footer className="bottom-controls" role="navigation" aria-label="Game menu">
    {CONTROL_ITEMS.map((item) => (
      <button
        key={item.tab}
        type="button"
        className={`icon-control ${active === item.tab ? 'active' : ''}`}
        onClick={() => onSelect(item.tab)}
        aria-label={item.label}
      >
        <span aria-hidden="true">{item.icon}</span>
      </button>
    ))}
  </footer>
);
