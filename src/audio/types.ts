export type EntrainmentMode = 'focus' | 'relax' | 'meditate' | 'sleep';

export type NoiseType = 'pink' | 'brown' | 'white';

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

export const BRAINWAVE_RANGES = {
  delta: { min: 0.5, max: 4, label: 'Delta', description: 'Deep sleep' },
  theta: { min: 4, max: 8, label: 'Theta', description: 'Meditation' },
  alpha: { min: 8, max: 13, label: 'Alpha', description: 'Relaxation' },
  beta: { min: 13, max: 30, label: 'Beta', description: 'Focus' },
  gamma: { min: 30, max: 100, label: 'Gamma', description: 'Peak cognition' },
} as const;
