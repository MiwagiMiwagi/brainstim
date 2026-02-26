import { ModeSelector } from './components/ModeSelector';
import { TransportControls } from './components/TransportControls';
import { LayerMixer } from './components/LayerMixer';
import { Visualizer } from './components/Visualizer';
import { BrainwaveIndicator } from './components/BrainwaveIndicator';
import { useStore } from './store/useStore';
import type { EntrainmentMode } from './audio/types';

const MODE_ACCENT: Record<EntrainmentMode, string> = {
  focus: '#6366f1',
  relax: '#10b981',
  meditate: '#f59e0b',
  sleep: '#8b5cf6',
};

function App() {
  const mode = useStore((s) => s.mode);
  const accent = MODE_ACCENT[mode];

  return (
    <div className="h-full flex flex-col bg-surface-0 overflow-y-auto">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <span style={{ color: accent }} className="transition-colors duration-500">Brain</span>
              <span className="text-text-secondary">Stim</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Neural Entrainment Audio Generator</p>
          </div>
          <div className="text-[10px] text-text-muted font-mono bg-surface-2 px-2 py-1 rounded">
            Amplitude Modulation
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-6 space-y-5 overflow-y-auto">
        {/* Mode selector */}
        <ModeSelector />

        {/* Visualizer */}
        <div className="bg-surface-1 rounded-xl p-3">
          <Visualizer />
        </div>

        {/* Brainwave indicator */}
        <BrainwaveIndicator />

        {/* Transport */}
        <div className="bg-surface-1 rounded-xl p-4">
          <TransportControls />
        </div>

        {/* Layer mixer */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Sound Layers</div>
          <LayerMixer />
        </div>

        {/* Info footer */}
        <div className="text-[10px] text-text-muted leading-relaxed bg-surface-1 rounded-xl p-4 space-y-1">
          <p>
            Based on neural phase-locking research. Amplitude modulation at brainwave frequencies is applied
            to the 200Hz-1kHz band of each sound layer, producing entrainment effects stronger than binaural beats.
          </p>
          <p>
            For best results: use for 6+ minutes, keep volume at a comfortable level (60-70 dB), headphones recommended for binaural layer.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
