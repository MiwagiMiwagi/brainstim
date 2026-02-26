import { create } from 'zustand';
import type { EntrainmentMode, LayerId, LayerParams, NoiseTexture } from '../audio/types';
import { MODE_CONFIGS } from '../audio/types';
import { getEngine } from '../audio/engine';

interface BrainStimState {
  isPlaying: boolean;
  isInitialized: boolean;
  mode: EntrainmentMode;
  entrainmentHz: number;
  layers: Record<LayerId, LayerParams>;
  masterVolume: number;
  reverbWet: number;
  noiseTexture: NoiseTexture;
  elapsedSeconds: number;

  init: () => Promise<void>;
  togglePlay: () => void;
  setMode: (mode: EntrainmentMode) => void;
  setEntrainmentHz: (hz: number) => void;
  setLayerVolume: (id: LayerId, volume: number) => void;
  setLayerModDepth: (id: LayerId, depth: number) => void;
  setLayerEnabled: (id: LayerId, enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setReverbWet: (wet: number) => void;
  setNoiseTexture: (texture: NoiseTexture) => void;
  tick: () => void;
}

const defaultLayers = (mode: EntrainmentMode): Record<LayerId, LayerParams> => {
  const config = MODE_CONFIGS[mode];
  const result = {} as Record<LayerId, LayerParams>;
  for (const [id, params] of Object.entries(config.defaultLayers)) {
    result[id as LayerId] = {
      enabled: params.enabled ?? true,
      volume: params.volume ?? 0.5,
      modDepth: params.modDepth ?? 0.5,
    };
  }
  return result;
};

export const useStore = create<BrainStimState>((set, get) => ({
  isPlaying: false,
  isInitialized: false,
  mode: 'focus',
  entrainmentHz: MODE_CONFIGS.focus.entrainmentHz,
  layers: defaultLayers('focus'),
  masterVolume: 0.8,
  reverbWet: 0.25,
  noiseTexture: 'pink',
  elapsedSeconds: 0,

  init: async () => {
    const engine = getEngine();
    await engine.init();
    set({ isInitialized: true });
  },

  togglePlay: () => {
    const { isPlaying, isInitialized } = get();
    if (!isInitialized) return;
    const engine = getEngine();
    if (isPlaying) engine.stop(); else engine.play();
    set({ isPlaying: !isPlaying, elapsedSeconds: 0 });
  },

  setMode: (mode) => {
    const config = MODE_CONFIGS[mode];
    const engine = getEngine();
    engine.setMode(mode, config);
    set({ mode, entrainmentHz: config.entrainmentHz, layers: defaultLayers(mode) });
  },

  setEntrainmentHz: (hz) => {
    getEngine().setEntrainmentHz(hz);
    set({ entrainmentHz: hz });
  },

  setLayerVolume: (id, volume) => {
    getEngine().setLayerVolume(id, volume);
    set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], volume } } }));
  },

  setLayerModDepth: (id, depth) => {
    getEngine().setLayerModDepth(id, depth);
    set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], modDepth: depth } } }));
  },

  setLayerEnabled: (id, enabled) => {
    const engine = getEngine();
    const layer = get().layers[id];
    engine.setLayerVolume(id, enabled ? layer.volume : 0);
    set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], enabled } } }));
  },

  setMasterVolume: (volume) => {
    getEngine().setMasterVolume(volume);
    set({ masterVolume: volume });
  },

  setReverbWet: (wet) => {
    getEngine().setReverbWet(wet);
    set({ reverbWet: wet });
  },

  setNoiseTexture: (texture) => {
    getEngine().setNoiseTexture(texture);
    set({ noiseTexture: texture });
  },

  tick: () => {
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },
}));
