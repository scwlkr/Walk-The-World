import { getBackgroundSceneList } from '../game/backgroundScenes';
import { DEV_PRESETS, type DevPresetId } from '../game/devPresets';
import { SEASONAL_EVENTS } from '../game/seasonalEvents';
import type { MusicTrackId } from '../game/audio';

export type DevLabOverrides = {
  sceneId: string | null;
  seasonalEventId: string | null;
  speedMultiplier: number;
};

type DevMusicTrack = {
  id: MusicTrackId;
  title: string;
};

type DevLabPanelProps = {
  overrides: DevLabOverrides;
  musicTracks: readonly DevMusicTrack[];
  onChange: (overrides: DevLabOverrides) => void;
  onApplyPreset: (presetId: DevPresetId) => void;
  onSelectMusicTrack: (trackId: MusicTrackId) => void;
};

export const DevLabPanel = ({
  overrides,
  musicTracks,
  onChange,
  onApplyPreset,
  onSelectMusicTrack
}: DevLabPanelProps) => (
  <section className="account-panel dev-lab-panel" aria-label="Development scene lab">
    <div className="section-head">
      <h4>Dev Lab</h4>
      <span>?dev=1</span>
    </div>

    <div className="panel account-card">
      <label className="settings-field">
        <span>Preset</span>
        <select className="select-control" defaultValue="" onChange={(event) => event.target.value && onApplyPreset(event.target.value as DevPresetId)}>
          <option value="">Choose preset</option>
          {DEV_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <label className="settings-field">
        <span>Background</span>
        <select
          className="select-control"
          value={overrides.sceneId ?? ''}
          onChange={(event) => onChange({ ...overrides, sceneId: event.target.value || null })}
        >
          <option value="">Current route</option>
          {getBackgroundSceneList().map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name} ({scene.vibeTags.join(', ')})
            </option>
          ))}
        </select>
      </label>

      <label className="settings-field">
        <span>Seasonal vibe</span>
        <select
          className="select-control"
          value={overrides.seasonalEventId ?? ''}
          onChange={(event) => onChange({ ...overrides, seasonalEventId: event.target.value || null })}
        >
          <option value="">Save state</option>
          {SEASONAL_EVENTS.map((event) => (
            <option key={event.id} value={event.id}>
              {event.shortName}
            </option>
          ))}
        </select>
      </label>

      <label className="settings-field">
        <span>Speed multiplier</span>
        <input
          className="text-control"
          type="number"
          min="0.25"
          max="20"
          step="0.25"
          value={overrides.speedMultiplier}
          onChange={(event) =>
            onChange({ ...overrides, speedMultiplier: Math.max(0.25, Math.min(20, Number(event.target.value) || 1)) })
          }
        />
      </label>

      <label className="settings-field">
        <span>Music</span>
        <select className="select-control" onChange={(event) => onSelectMusicTrack(event.target.value as MusicTrackId)}>
          {musicTracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  </section>
);
