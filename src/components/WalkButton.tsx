type WalkButtonProps = {
  onWalk: () => void;
};

export const WalkButton = ({ onWalk }: WalkButtonProps) => (
  <button type="button" className="walk-btn" onClick={onWalk}>
    <strong>WALK</strong>
  </button>
);
