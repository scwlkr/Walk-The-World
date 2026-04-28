export type SoundEffect = 'walk' | 'purchase' | 'event' | 'ui';

export const MUSIC_TRACKS = [
  { id: 'main_theme', title: 'Walk The World Main Theme', src: '/assets/audio/music/main_theme.mp3' },
  { id: 'wtw_101', title: 'Walk The World 101', src: '/assets/audio/music/wtw_101.mp3' },
  { id: 'wtw_102', title: 'Walk The World 102', src: '/assets/audio/music/wtw_102.mp3' },
  { id: 'wtw_103', title: 'Walk The World 103', src: '/assets/audio/music/wtw_103.mp3' },
  { id: 'wtw_104', title: 'Walk The World 104', src: '/assets/audio/music/wtw_104.mp3' },
  { id: 'wtw_105', title: 'Walk The World 105', src: '/assets/audio/music/wtw_105.mp3' },
  { id: 'wtw_106', title: 'Walk The World 106', src: '/assets/audio/music/wtw_106.mp3' },
  { id: 'wtw_107', title: 'Walk The World 107', src: '/assets/audio/music/wtw_107.mp3' }
] as const;

let audioContext: AudioContext | null = null;

export const resumeGameAudio = (): void => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }
};

export const playSoundEffect = (effect: SoundEffect, enabled: boolean): void => {
  if (!enabled) return;

  resumeGameAudio();
  if (!audioContext) return;

  const settings: Record<SoundEffect, { frequency: number; endFrequency: number; duration: number; volume: number; type: OscillatorType }> = {
    walk: { frequency: 130, endFrequency: 88, duration: 0.055, volume: 0.045, type: 'triangle' },
    purchase: { frequency: 520, endFrequency: 780, duration: 0.16, volume: 0.07, type: 'square' },
    event: { frequency: 760, endFrequency: 1180, duration: 0.22, volume: 0.08, type: 'sine' },
    ui: { frequency: 320, endFrequency: 480, duration: 0.09, volume: 0.055, type: 'triangle' }
  };

  const preset = settings[effect];
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = preset.type;
  oscillator.frequency.setValueAtTime(preset.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(preset.endFrequency, now + preset.duration);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(preset.volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + preset.duration + 0.02);
};
