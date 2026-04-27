import { GAME_VERSION } from '../game/constants';

type SettingsPanelProps = {
  soundEnabled: boolean;
  reducedMotion: boolean;
  onReset: () => void;
  onExport: () => void;
  onImport: (raw: string) => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
};

export const SettingsPanel = ({
  soundEnabled,
  reducedMotion,
  onReset,
  onExport,
  onImport,
  onToggleSound,
  onToggleReducedMotion
}: SettingsPanelProps) => {
  const importPrompt = () => {
    const raw = window.prompt('Paste save JSON');
    if (raw) onImport(raw);
  };

  return (
    <section className="panel settings-panel">
      <h3>Settings</h3>
      <div className="settings-actions">
        <button type="button" className="mini-btn" onClick={onToggleSound}>
          Sound: {soundEnabled ? 'On' : 'Off'} (placeholder)
        </button>
        <button type="button" className="mini-btn" onClick={onToggleReducedMotion}>
          Reduced motion: {reducedMotion ? 'On' : 'Off'}
        </button>
        <button type="button" className="mini-btn" onClick={onExport}>Export Save</button>
        <button type="button" className="mini-btn" onClick={importPrompt}>Import Save</button>
        <button type="button" className="mini-btn danger" onClick={onReset}>Reset Save</button>
      </div>
      <p className="muted">Version: {GAME_VERSION}</p>
    </section>
  );
};
