import { GAME_VERSION } from '../game/constants';
import type { MusicTrackId } from '../game/audio';

type SettingsPanelProps = {
  soundEnabled: boolean;
  reducedMotion: boolean;
  selectedMusicTrackId: MusicTrackId;
  musicTracks: ReadonlyArray<{
    id: MusicTrackId;
    title: string;
  }>;
  onReset: () => void;
  onExport: () => void;
  onImport: (raw: string) => void;
  onSelectMusicTrack: (trackId: MusicTrackId) => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
};

export const SettingsPanel = ({
  soundEnabled,
  reducedMotion,
  selectedMusicTrackId,
  musicTracks,
  onReset,
  onExport,
  onImport,
  onSelectMusicTrack,
  onToggleSound,
  onToggleReducedMotion
}: SettingsPanelProps) => {
  const importPrompt = () => {
    const raw = window.prompt('Paste save JSON');
    if (raw) onImport(raw);
  };

  const selectTrack = (trackId: string) => {
    const track = musicTracks.find((candidate) => candidate.id === trackId);
    if (track) onSelectMusicTrack(track.id);
  };

  return (
    <section className="settings-panel">
      <label className="settings-field">
        <span>Music track</span>
        <select
          className="select-control"
          value={selectedMusicTrackId}
          onChange={(event) => selectTrack(event.currentTarget.value)}
        >
          {musicTracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      </label>
      <div className="settings-actions">
        <button type="button" className="mini-btn" onClick={onToggleSound}>
          Sound: {soundEnabled ? 'On' : 'Off'}
        </button>
        <button type="button" className="mini-btn" onClick={onToggleReducedMotion}>
          Reduced motion: {reducedMotion ? 'On' : 'Off'}
        </button>
        <button type="button" className="mini-btn" onClick={onExport}>
          Export Save
        </button>
        <button type="button" className="mini-btn" onClick={importPrompt}>
          Import Save
        </button>
        <button type="button" className="mini-btn danger" onClick={onReset}>
          Reset Save
        </button>
      </div>
      <p className="muted">Version: {GAME_VERSION}</p>
    </section>
  );
};
