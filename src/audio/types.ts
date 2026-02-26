export type EntrainmentMode = 'focus' | 'relax' | 'meditate' | 'sleep';

export type NoiseTexture = 'pink' | 'brown' | 'white' | 'rain' | 'ocean' | 'wind' | 'creek';

export type LayerId = 'drone' | 'pad' | 'noise' | 'binaural';

export interface LayerParams {
  enabled: boolean;
  volume: number;       // 0–1
  modDepth: number;     // 0–1 (how much the entrainment LFO modulates this layer)
}

export interface ModeConfig {
  label: string;
  entrainmentHz: number;
  rampSeconds: number;
  description: string;
  defaultLayers: Record<LayerId, Partial<LayerParams>>;
}

export const MODE_CONFIGS: Record<EntrainmentMode, ModeConfig> = {
  focus: {
    label: 'Focus',
    entrainmentHz: 16,
    rampSeconds: 10,
    description: 'Beta waves (16 Hz) for sustained attention and deep work',
    defaultLayers: {
      drone: { enabled: true, volume: 0.5, modDepth: 0.7 },
      pad: { enabled: true, volume: 0.35, modDepth: 0.5 },
      noise: { enabled: true, volume: 0.25, modDepth: 0.6 },
      binaural: { enabled: true, volume: 0.2, modDepth: 0 },
    },
  },
  relax: {
    label: 'Relax',
    entrainmentHz: 8,
    rampSeconds: 15,
    description: 'Alpha waves (8 Hz) for calm relaxation and light creativity',
    defaultLayers: {
      drone: { enabled: true, volume: 0.6, modDepth: 0.4 },
      pad: { enabled: true, volume: 0.5, modDepth: 0.3 },
      noise: { enabled: true, volume: 0.35, modDepth: 0.3 },
      binaural: { enabled: true, volume: 0.15, modDepth: 0 },
    },
  },
  meditate: {
    label: 'Meditate',
    entrainmentHz: 6,
    rampSeconds: 20,
    description: 'Theta waves (6 Hz) for meditation and deep introspection',
    defaultLayers: {
      drone: { enabled: true, volume: 0.55, modDepth: 0.5 },
      pad: { enabled: true, volume: 0.4, modDepth: 0.4 },
      noise: { enabled: true, volume: 0.3, modDepth: 0.35 },
      binaural: { enabled: true, volume: 0.2, modDepth: 0 },
    },
  },
  sleep: {
    label: 'Sleep',
    entrainmentHz: 0.5,
    rampSeconds: 60,
    description: 'Delta waves (0.5 Hz) for deep restorative sleep',
    defaultLayers: {
      drone: { enabled: true, volume: 0.4, modDepth: 0.6 },
      pad: { enabled: true, volume: 0.45, modDepth: 0.5 },
      noise: { enabled: true, volume: 0.4, modDepth: 0.4 },
      binaural: { enabled: false, volume: 0.1, modDepth: 0 },
    },
  },
};

// Noise texture filter configs — shape noise to approximate nature sounds
export const NOISE_TEXTURE_CONFIGS: Record<NoiseTexture, {
  label: string;
  noiseType: 'pink' | 'brown' | 'white';
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  // Slow modulation on filter frequency to create movement
  modRate?: number;   // Hz — how fast the filter sweeps
  modRange?: number;  // Hz — how far it sweeps
}> = {
  pink:  { label: 'Pink',  noiseType: 'pink',  filterType: 'lowpass',  filterFreq: 2000, filterQ: 0.5 },
  brown: { label: 'Brown', noiseType: 'brown', filterType: 'lowpass',  filterFreq: 800,  filterQ: 0.7 },
  white: { label: 'White', noiseType: 'white', filterType: 'lowpass',  filterFreq: 4000, filterQ: 0.3 },
  rain:  { label: 'Rain',  noiseType: 'white', filterType: 'bandpass', filterFreq: 3000, filterQ: 0.8, modRate: 0.15, modRange: 1500 },
  ocean: { label: 'Ocean', noiseType: 'brown', filterType: 'lowpass',  filterFreq: 600,  filterQ: 0.6, modRate: 0.06, modRange: 400 },
  wind:  { label: 'Wind',  noiseType: 'pink',  filterType: 'bandpass', filterFreq: 800,  filterQ: 1.2, modRate: 0.08, modRange: 600 },
  creek: { label: 'Creek', noiseType: 'white', filterType: 'bandpass', filterFreq: 4000, filterQ: 2.0, modRate: 0.25, modRange: 2000 },
};

// Chord voicings for pad drift — two states that crossfade slowly
// Using suspended/open voicings for ambient quality
export const PAD_CHORDS: Record<EntrainmentMode, { a: [number, number, number]; b: [number, number, number]; driftSeconds: number }> = {
  focus:    { a: [220.00, 329.63, 440.00], b: [246.94, 369.99, 493.88], driftSeconds: 45 },  // A minor → B minor
  relax:    { a: [196.00, 293.66, 392.00], b: [174.61, 261.63, 349.23], driftSeconds: 60 },  // G major → F major
  meditate: { a: [164.81, 246.94, 329.63], b: [146.83, 220.00, 293.66], driftSeconds: 80 },  // E minor → D minor
  sleep:    { a: [130.81, 196.00, 261.63], b: [123.47, 185.00, 246.94], driftSeconds: 120 }, // C major → B major (lullaby drift)
};

export const BRAINWAVE_RANGES = {
  delta: { min: 0.5, max: 4, label: 'Delta', description: 'Deep sleep' },
  theta: { min: 4, max: 8, label: 'Theta', description: 'Meditation' },
  alpha: { min: 8, max: 13, label: 'Alpha', description: 'Relaxation' },
  beta: { min: 13, max: 30, label: 'Beta', description: 'Focus' },
  gamma: { min: 30, max: 100, label: 'Gamma', description: 'Peak cognition' },
} as const;
