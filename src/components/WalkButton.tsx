type WalkButtonProps = {
  onWalk: () => void;
};

export const WalkButton = ({ onWalk }: WalkButtonProps) => (
  <button type="button" className="walk-btn" onClick={onWalk}>
    <span aria-hidden="true">←</span>
    <span aria-hidden="true">🚶</span>
    <strong>WALK</strong>
    <span aria-hidden="true">→</span>
  </button>
);
