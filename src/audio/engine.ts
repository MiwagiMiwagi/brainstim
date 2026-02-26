import * as Tone from 'tone';
import type { EntrainmentMode, LayerId, NoiseType, MODE_CONFIGS } from './types';

/**
 * BrainStim Audio Engine
 *
 * Architecture (per Brain.fm patent US 7,674,224):
 * - Multiple sound layers (drone, pad, noise, binaural)
 * - Each layer is bandpass-filtered to 200Hz–1kHz for modulation
 * - A shared LFO modulates amplitude at the target brainwave frequency
 * - Unmodulated low/high frequencies pass through for musical quality
 * - Sine-wave LFO for strongest neural phase-locking (per ASSR research)
 */

interface LayerNodes {
  source: Tone.ToneAudioNode;
  filter: Tone.Filter;
  modGain: Tone.Gain;        // AM envelope — LFO modulates this
  depthGain: Tone.Gain;      // scales LFO depth per-layer
  volumeGain: Tone.Gain;     // layer volume control
  extras?: Record<string, Tone.ToneAudioNode>;
}

export class BrainStimEngine {
  private layers: Map<LayerId, LayerNodes> = new Map();
  private lfo!: Tone.LFO;
  private masterGain!: Tone.Gain;
  private limiter!: Tone.Limiter;
  private reverb!: Tone.Reverb;
  private analyser!: Tone.Analyser;
  private isStarted = false;
  private currentMode: EntrainmentMode = 'focus';

  constructor() {
    // Engine initialized — call init() to start audio context
  }

  async init(): Promise<void> {
    if (this.isStarted) return;

    await Tone.start();

    // Master chain: reverb -> limiter -> analyser -> destination
    this.analyser = new Tone.Analyser('waveform', 256);
    this.limiter = new Tone.Limiter(-3);
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 });
    this.masterGain = new Tone.Gain(0.8);

    this.masterGain.chain(this.reverb, this.limiter, this.analyser, Tone.getDestination());

    // Entrainment LFO — the core: sine wave at target brainwave frequency
    // Output range 0–1, connected to each layer's modGain
    this.lfo = new Tone.LFO({
      frequency: 16,  // default: focus mode (beta)
      min: 0,
      max: 1,
      type: 'sine',   // sine = strongest neural phase-locking
    });
    this.lfo.start();

    this._createDroneLayer();
    this._createPadLayer();
    this._createNoiseLayer();
    this._createBinauralLayer();

    this.isStarted = true;
  }

  // === DRONE LAYER ===
  // Warm fundamental tone with slight detune for richness
  private _createDroneLayer(): void {
    const osc = new Tone.FatOscillator({
      frequency: 110,    // A2
      type: 'sine',
      spread: 10,        // slight detune for warmth
      count: 3,
    });

    // Bandpass 200Hz–1kHz for entrainment modulation zone
    const filter = new Tone.Filter({
      frequency: 500,
      type: 'bandpass',
      Q: 0.7,
    });

    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.35); // LFO depth for this layer
    const volumeGain = new Tone.Gain(0.5);

    osc.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);

    // Connect LFO through depth control to modulation gain
    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('drone', {
      source: osc,
      filter,
      modGain,
      depthGain,
      volumeGain,
    });
  }

  // === PAD LAYER ===
  // Ambient chord pad using AM synthesis
  private _createPadLayer(): void {
    // Two detuned oscillators for a lush pad sound
    const osc1 = new Tone.Oscillator({ frequency: 220, type: 'triangle' });
    const osc2 = new Tone.Oscillator({ frequency: 330, type: 'triangle' }); // perfect 5th
    const osc3 = new Tone.Oscillator({ frequency: 277.18, type: 'sine' });  // C#4 for color

    const merge = new Tone.Gain(0.33); // mix the three oscillators

    const filter = new Tone.Filter({
      frequency: 600,
      type: 'bandpass',
      Q: 0.5,
    });

    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.25);
    const volumeGain = new Tone.Gain(0.35);

    osc1.connect(merge);
    osc2.connect(merge);
    osc3.connect(merge);
    merge.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);

    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('pad', {
      source: merge,
      filter,
      modGain,
      depthGain,
      volumeGain,
      extras: { osc1, osc2, osc3 },
    });
  }

  // === NOISE LAYER ===
  // Pink noise for masking and fullness
  private _createNoiseLayer(): void {
    const noise = new Tone.Noise('pink');

    const filter = new Tone.Filter({
      frequency: 500,
      type: 'bandpass',
      Q: 0.5,
    });

    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.3);
    const volumeGain = new Tone.Gain(0.25);

    noise.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);

    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('noise', {
      source: noise,
      filter,
      modGain,
      depthGain,
      volumeGain,
    });
  }

  // === BINAURAL LAYER ===
  // Two oscillators panned L/R with slight frequency offset
  // Creates a perceived beat at the difference frequency
  private _createBinauralLayer(): void {
    const baseFreq = 200;
    const beatFreq = 16; // matches entrainment Hz

    const oscL = new Tone.Oscillator({ frequency: baseFreq, type: 'sine' });
    const oscR = new Tone.Oscillator({ frequency: baseFreq + beatFreq, type: 'sine' });

    const panL = new Tone.Panner(-1);
    const panR = new Tone.Panner(1);

    const filter = new Tone.Filter({ frequency: 500, type: 'bandpass', Q: 0.3 });
    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0); // binaural doesn't need AM — it IS the entrainment
    const volumeGain = new Tone.Gain(0.2);

    oscL.connect(panL);
    oscR.connect(panR);
    panL.connect(filter);
    panR.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);

    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('binaural', {
      source: oscL,
      filter,
      modGain,
      depthGain,
      volumeGain,
      extras: { oscL, oscR, panL, panR },
    });
  }

  // === PUBLIC API ===

  play(): void {
    this.layers.forEach((layer, id) => {
      if (id === 'pad') {
        // Start the individual oscillators
        const { osc1, osc2, osc3 } = layer.extras as Record<string, Tone.Oscillator>;
        osc1.start();
        osc2.start();
        osc3.start();
      } else if (id === 'binaural') {
        const { oscL, oscR } = layer.extras as Record<string, Tone.Oscillator>;
        oscL.start();
        oscR.start();
      } else {
        (layer.source as Tone.FatOscillator | Tone.Noise).start();
      }
    });
  }

  stop(): void {
    this.layers.forEach((layer, id) => {
      if (id === 'pad') {
        const { osc1, osc2, osc3 } = layer.extras as Record<string, Tone.Oscillator>;
        osc1.stop();
        osc2.stop();
        osc3.stop();
      } else if (id === 'binaural') {
        const { oscL, oscR } = layer.extras as Record<string, Tone.Oscillator>;
        oscL.stop();
        oscR.stop();
      } else {
        (layer.source as Tone.FatOscillator | Tone.Noise).stop();
      }
    });
  }

  setMode(mode: EntrainmentMode, config: typeof MODE_CONFIGS[EntrainmentMode]): void {
    this.currentMode = mode;
    const now = Tone.now();

    // Ramp the LFO to the new entrainment frequency
    this.lfo.frequency.rampTo(config.entrainmentHz, config.rampSeconds, now);

    // Update binaural beat frequency to match
    const binauralLayer = this.layers.get('binaural');
    if (binauralLayer?.extras) {
      const oscR = binauralLayer.extras.oscR as Tone.Oscillator;
      const oscL = binauralLayer.extras.oscL as Tone.Oscillator;
      oscR.frequency.rampTo(Number(oscL.frequency.value) + config.entrainmentHz, config.rampSeconds, now);
    }

    // Apply default layer settings
    for (const [layerId, params] of Object.entries(config.defaultLayers)) {
      this.setLayerVolume(layerId as LayerId, params.volume ?? 0.5);
      this.setLayerModDepth(layerId as LayerId, params.modDepth ?? 0.5);
    }
  }

  setEntrainmentHz(hz: number): void {
    this.lfo.frequency.rampTo(hz, 2);

    // Update binaural beat
    const binauralLayer = this.layers.get('binaural');
    if (binauralLayer?.extras) {
      const oscR = binauralLayer.extras.oscR as Tone.Oscillator;
      const oscL = binauralLayer.extras.oscL as Tone.Oscillator;
      oscR.frequency.rampTo(Number(oscL.frequency.value) + hz, 2);
    }
  }

  setLayerVolume(layerId: LayerId, volume: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.volumeGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
    }
  }

  setLayerModDepth(layerId: LayerId, depth: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.depthGain.gain.rampTo(Math.max(0, Math.min(1, depth)) * 0.5, 0.1);
    }
  }

  setLayerEnabled(layerId: LayerId, enabled: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.volumeGain.gain.rampTo(enabled ? 0.5 : 0, 0.3);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
  }

  setReverbWet(wet: number): void {
    this.reverb.wet.rampTo(Math.max(0, Math.min(1, wet)), 0.5);
  }

  setNoiseType(type: NoiseType): void {
    const layer = this.layers.get('noise');
    if (layer) {
      (layer.source as Tone.Noise).type = type;
    }
  }

  setDroneFrequency(freq: number): void {
    const layer = this.layers.get('drone');
    if (layer) {
      (layer.source as Tone.FatOscillator).frequency.rampTo(freq, 1);
    }
  }

  setPadChord(frequencies: [number, number, number]): void {
    const layer = this.layers.get('pad');
    if (layer?.extras) {
      const oscs = [layer.extras.osc1, layer.extras.osc2, layer.extras.osc3] as Tone.Oscillator[];
      oscs.forEach((osc, i) => {
        osc.frequency.rampTo(frequencies[i], 1);
      });
    }
  }

  getAnalyserData(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  getEntrainmentHz(): number {
    return this.lfo.frequency.value as number;
  }

  getCurrentMode(): EntrainmentMode {
    return this.currentMode;
  }

  dispose(): void {
    this.layers.forEach((layer) => {
      layer.source.dispose();
      layer.filter.dispose();
      layer.modGain.dispose();
      layer.depthGain.dispose();
      layer.volumeGain.dispose();
      if (layer.extras) {
        Object.values(layer.extras).forEach(n => n.dispose());
      }
    });
    this.lfo.dispose();
    this.masterGain.dispose();
    this.limiter.dispose();
    this.reverb.dispose();
    this.analyser.dispose();
    this.layers.clear();
    this.isStarted = false;
  }
}

// Singleton
let engine: BrainStimEngine | null = null;

export function getEngine(): BrainStimEngine {
  if (!engine) {
    engine = new BrainStimEngine();
  }
  return engine;
}
