import type { ReactNode } from 'react';

type GameOverlaySheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export const GameOverlaySheet = ({ open, title, onClose, children }: GameOverlaySheetProps) => {
  if (!open) return null;

  return (
    <div className="overlay-backdrop" role="presentation" onClick={onClose}>
      <section
        className="overlay-sheet panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="mini-btn" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="overlay-content">{children}</div>
      </section>
    </div>
  );
};
