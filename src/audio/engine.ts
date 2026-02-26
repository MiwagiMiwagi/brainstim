import * as Tone from 'tone';
import type { EntrainmentMode, LayerId, NoiseTexture, MODE_CONFIGS } from './types';
import { NOISE_TEXTURE_CONFIGS, PAD_CHORDS } from './types';

/**
 * BrainStim Audio Engine
 *
 * - Shared LFO modulates amplitude at target brainwave frequency
 * - Sine-wave LFO for strongest neural phase-locking
 * - Noise layer shaped into nature textures (rain, ocean, wind, creek)
 * - Pad layer drifts between two chord voicings on a slow cycle
 * - Reverb properly awaited before routing
 */

interface LayerNodes {
  source: Tone.ToneAudioNode;
  filter: Tone.Filter;
  modGain: Tone.Gain;
  depthGain: Tone.Gain;
  volumeGain: Tone.Gain;
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
  private isPlaying = false;
  private currentMode: EntrainmentMode = 'focus';

  // Noise texture
  private noiseFilterLfo: Tone.LFO | null = null;
  private currentTexture: NoiseTexture = 'pink';

  // Chord drift
  private chordDriftInterval: ReturnType<typeof setInterval> | null = null;
  private chordDriftPhase = 0;

  async init(): Promise<void> {
    if (this.isStarted) return;

    await Tone.start();

    this.analyser = new Tone.Analyser('waveform', 256);
    this.limiter = new Tone.Limiter(-3);
    this.masterGain = new Tone.Gain(0.8);

    // Reverb — MUST await .ready for impulse response generation
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25, preDelay: 0.1 });
    await this.reverb.ready;

    this.masterGain.chain(this.reverb, this.limiter, this.analyser, Tone.getDestination());

    this.lfo = new Tone.LFO({ frequency: 16, min: 0, max: 1, type: 'sine' });
    this.lfo.start();

    this._createDroneLayer();
    this._createPadLayer();
    this._createNoiseLayer();
    this._createBinauralLayer();

    this.isStarted = true;
  }

  private _createDroneLayer(): void {
    const osc = new Tone.FatOscillator({ frequency: 110, type: 'sine', spread: 10, count: 3 });
    const filter = new Tone.Filter({ frequency: 500, type: 'bandpass', Q: 0.7 });
    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.35);
    const volumeGain = new Tone.Gain(0.5);

    osc.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);
    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('drone', { source: osc, filter, modGain, depthGain, volumeGain });
  }

  private _createPadLayer(): void {
    const chords = PAD_CHORDS[this.currentMode];

    // Chord A — 3 oscillators at fixed frequencies
    const oscA1 = new Tone.Oscillator({ frequency: chords.a[0], type: 'triangle' });
    const oscA2 = new Tone.Oscillator({ frequency: chords.a[1], type: 'triangle' });
    const oscA3 = new Tone.Oscillator({ frequency: chords.a[2], type: 'sine' });
    const gainA = new Tone.Gain(1);  // starts full
    oscA1.connect(gainA); oscA2.connect(gainA); oscA3.connect(gainA);

    // Chord B — 3 oscillators at fixed frequencies
    const oscB1 = new Tone.Oscillator({ frequency: chords.b[0], type: 'triangle' });
    const oscB2 = new Tone.Oscillator({ frequency: chords.b[1], type: 'triangle' });
    const oscB3 = new Tone.Oscillator({ frequency: chords.b[2], type: 'sine' });
    const gainB = new Tone.Gain(0);  // starts silent
    oscB1.connect(gainB); oscB2.connect(gainB); oscB3.connect(gainB);

    // Both chord groups merge → shared signal chain
    const merge = new Tone.Gain(0.2);
    const filter = new Tone.Filter({ frequency: 600, type: 'bandpass', Q: 0.5 });
    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.25);
    const volumeGain = new Tone.Gain(0.35);

    gainA.connect(merge);
    gainB.connect(merge);
    merge.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);
    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    this.layers.set('pad', {
      source: merge, filter, modGain, depthGain, volumeGain,
      extras: { oscA1, oscA2, oscA3, oscB1, oscB2, oscB3, gainA, gainB },
    });
  }

  private _createNoiseLayer(): void {
    const cfg = NOISE_TEXTURE_CONFIGS[this.currentTexture];
    const noise = new Tone.Noise(cfg.noiseType);
    const filter = new Tone.Filter({ frequency: cfg.filterFreq, type: cfg.filterType, Q: cfg.filterQ });
    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0.3);
    const volumeGain = new Tone.Gain(0.25);

    noise.connect(filter);
    filter.connect(modGain);
    modGain.connect(volumeGain);
    volumeGain.connect(this.masterGain);
    this.lfo.connect(depthGain);
    depthGain.connect(modGain.gain);

    if (cfg.modRate && cfg.modRange) {
      this.noiseFilterLfo = new Tone.LFO({
        frequency: cfg.modRate,
        min: Math.max(100, cfg.filterFreq - cfg.modRange),
        max: cfg.filterFreq + cfg.modRange,
        type: 'sine',
      });
      this.noiseFilterLfo.connect(filter.frequency);
      this.noiseFilterLfo.start();
    }

    this.layers.set('noise', { source: noise, filter, modGain, depthGain, volumeGain });
  }

  private _createBinauralLayer(): void {
    const baseFreq = 200;
    const beatFreq = 16;
    const oscL = new Tone.Oscillator({ frequency: baseFreq, type: 'sine' });
    const oscR = new Tone.Oscillator({ frequency: baseFreq + beatFreq, type: 'sine' });
    const panL = new Tone.Panner(-1);
    const panR = new Tone.Panner(1);
    const filter = new Tone.Filter({ frequency: 500, type: 'bandpass', Q: 0.3 });
    const modGain = new Tone.Gain(1);
    const depthGain = new Tone.Gain(0);
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
      source: oscL, filter, modGain, depthGain, volumeGain,
      extras: { oscL, oscR, panL, panR },
    });
  }

  // === CHORD DRIFT ===
  // Crossfades volume between chord A and chord B on a slow triangle wave
  private _startChordDrift(): void {
    this._stopChordDrift();
    const chords = PAD_CHORDS[this.currentMode];
    const stepMs = 200;
    const totalSteps = (chords.driftSeconds * 1000) / stepMs;
    let step = 0;

    this.chordDriftInterval = setInterval(() => {
      const layer = this.layers.get('pad');
      if (!layer?.extras) return;

      // Triangle wave: 0→1→0 over driftSeconds
      const phase = step / totalSteps;
      const t = phase <= 0.5 ? phase * 2 : 2 - phase * 2;

      // Crossfade: t=0 → chord A full, t=1 → chord B full
      const gA = layer.extras.gainA as Tone.Gain;
      const gB = layer.extras.gainB as Tone.Gain;
      gA.gain.rampTo(1 - t, stepMs / 1000);
      gB.gain.rampTo(t, stepMs / 1000);

      step = (step + 1) % totalSteps;
      this.chordDriftPhase = t;
    }, stepMs);
  }

  private _stopChordDrift(): void {
    if (this.chordDriftInterval) {
      clearInterval(this.chordDriftInterval);
      this.chordDriftInterval = null;
    }
  }

  // === PUBLIC API ===

  play(): void {
    this.layers.forEach((layer, id) => {
      if (id === 'pad') {
        const e = layer.extras as Record<string, Tone.Oscillator>;
        e.oscA1.start(); e.oscA2.start(); e.oscA3.start();
        e.oscB1.start(); e.oscB2.start(); e.oscB3.start();
      } else if (id === 'binaural') {
        const { oscL, oscR } = layer.extras as Record<string, Tone.Oscillator>;
        oscL.start(); oscR.start();
      } else {
        (layer.source as Tone.FatOscillator | Tone.Noise).start();
      }
    });
    this._startChordDrift();
    this.isPlaying = true;
  }

  stop(): void {
    this._stopChordDrift();
    this.layers.forEach((layer, id) => {
      if (id === 'pad') {
        const e = layer.extras as Record<string, Tone.Oscillator>;
        e.oscA1.stop(); e.oscA2.stop(); e.oscA3.stop();
        e.oscB1.stop(); e.oscB2.stop(); e.oscB3.stop();
      } else if (id === 'binaural') {
        const { oscL, oscR } = layer.extras as Record<string, Tone.Oscillator>;
        oscL.stop(); oscR.stop();
      } else {
        (layer.source as Tone.FatOscillator | Tone.Noise).stop();
      }
    });
    this.isPlaying = false;
  }

  setMode(mode: EntrainmentMode, config: typeof MODE_CONFIGS[EntrainmentMode]): void {
    this.currentMode = mode;
    const now = Tone.now();
    this.lfo.frequency.rampTo(config.entrainmentHz, config.rampSeconds, now);

    const binauralLayer = this.layers.get('binaural');
    if (binauralLayer?.extras) {
      const oscR = binauralLayer.extras.oscR as Tone.Oscillator;
      const oscL = binauralLayer.extras.oscL as Tone.Oscillator;
      oscR.frequency.rampTo(Number(oscL.frequency.value) + config.entrainmentHz, config.rampSeconds, now);
    }

    // Update pad chord voicings for new mode
    const padLayer = this.layers.get('pad');
    if (padLayer?.extras) {
      const chords = PAD_CHORDS[mode];
      const ramp = 2; // smooth transition over 2s
      (padLayer.extras.oscA1 as Tone.Oscillator).frequency.rampTo(chords.a[0], ramp);
      (padLayer.extras.oscA2 as Tone.Oscillator).frequency.rampTo(chords.a[1], ramp);
      (padLayer.extras.oscA3 as Tone.Oscillator).frequency.rampTo(chords.a[2], ramp);
      (padLayer.extras.oscB1 as Tone.Oscillator).frequency.rampTo(chords.b[0], ramp);
      (padLayer.extras.oscB2 as Tone.Oscillator).frequency.rampTo(chords.b[1], ramp);
      (padLayer.extras.oscB3 as Tone.Oscillator).frequency.rampTo(chords.b[2], ramp);
    }

    for (const [layerId, params] of Object.entries(config.defaultLayers)) {
      this.setLayerVolume(layerId as LayerId, params.volume ?? 0.5);
      this.setLayerModDepth(layerId as LayerId, params.modDepth ?? 0.5);
    }

    if (this.isPlaying) this._startChordDrift();
  }

  setEntrainmentHz(hz: number): void {
    this.lfo.frequency.rampTo(hz, 2);
    const binauralLayer = this.layers.get('binaural');
    if (binauralLayer?.extras) {
      const oscR = binauralLayer.extras.oscR as Tone.Oscillator;
      const oscL = binauralLayer.extras.oscL as Tone.Oscillator;
      oscR.frequency.rampTo(Number(oscL.frequency.value) + hz, 2);
    }
  }

  setLayerVolume(layerId: LayerId, volume: number): void {
    const layer = this.layers.get(layerId);
    if (layer) layer.volumeGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
  }

  setLayerModDepth(layerId: LayerId, depth: number): void {
    const layer = this.layers.get(layerId);
    if (layer) layer.depthGain.gain.rampTo(Math.max(0, Math.min(1, depth)) * 0.5, 0.1);
  }

  setLayerEnabled(layerId: LayerId, enabled: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) layer.volumeGain.gain.rampTo(enabled ? 0.5 : 0, 0.3);
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
  }

  setReverbWet(wet: number): void {
    this.reverb.wet.rampTo(Math.max(0, Math.min(1, wet)), 0.5);
  }

  setNoiseTexture(texture: NoiseTexture): void {
    const layer = this.layers.get('noise');
    if (!layer) return;

    const cfg = NOISE_TEXTURE_CONFIGS[texture];
    this.currentTexture = texture;

    (layer.source as Tone.Noise).type = cfg.noiseType;
    layer.filter.type = cfg.filterType;
    layer.filter.frequency.rampTo(cfg.filterFreq, 1);
    layer.filter.Q.rampTo(cfg.filterQ, 1);

    if (this.noiseFilterLfo) {
      this.noiseFilterLfo.stop();
      this.noiseFilterLfo.disconnect();
      this.noiseFilterLfo.dispose();
      this.noiseFilterLfo = null;
    }

    if (cfg.modRate && cfg.modRange) {
      this.noiseFilterLfo = new Tone.LFO({
        frequency: cfg.modRate,
        min: Math.max(100, cfg.filterFreq - cfg.modRange),
        max: cfg.filterFreq + cfg.modRange,
        type: 'sine',
      });
      this.noiseFilterLfo.connect(layer.filter.frequency);
      this.noiseFilterLfo.start();
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

  getChordDriftPhase(): number {
    return this.chordDriftPhase;
  }

  dispose(): void {
    this._stopChordDrift();
    if (this.noiseFilterLfo) {
      this.noiseFilterLfo.stop();
      this.noiseFilterLfo.dispose();
    }
    this.layers.forEach((layer) => {
      layer.source.dispose();
      layer.filter.dispose();
      layer.modGain.dispose();
      layer.depthGain.dispose();
      layer.volumeGain.dispose();
      if (layer.extras) Object.values(layer.extras).forEach(n => n.dispose());
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

let engine: BrainStimEngine | null = null;

export function getEngine(): BrainStimEngine {
  if (!engine) engine = new BrainStimEngine();
  return engine;
}
