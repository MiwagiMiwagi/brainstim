import { ModeSelector } from './components/ModeSelector';
import { TransportControls } from './components/TransportControls';
import { LayerMixer } from './components/LayerMixer';
import { Visualizer } from './components/Visualizer';
import { BrainwaveIndicator } from './components/BrainwaveIndicator';
import { useStore } from './store/useStore';
import { MODE_ACCENT } from './audio/constants';

function App() {
  const mode = useStore((s) => s.mode);
  const isPlaying = useStore((s) => s.isPlaying);
  const accent = MODE_ACCENT[mode];

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: 'var(--color-surface-0)' }}
    >
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-[2s] ease-out"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, ${accent.color}0a, transparent),
            radial-gradient(circle at 30% 70%, ${accent.color}05, transparent 50%)
          `,
          opacity: isPlaying ? 1 : 0.5,
        }}
      />

      {/* Centered content column */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          padding: '24px 20px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="transition-colors duration-[1.5s]" style={{ color: accent.color }}>
              Brain
            </span>
            <span className="text-text-muted font-light">Stim</span>
          </h1>
          <span
            className="text-[9px] font-mono tracking-widest uppercase transition-colors duration-1000"
            style={{ color: isPlaying ? `${accent.color}80` : 'var(--color-text-muted)' }}
          >
            Neural Entrainment
          </span>
        </header>

        {/* Mode selector */}
        <div style={{ marginBottom: '20px' }}>
          <ModeSelector />
        </div>

        {/* Visualizer */}
        <div style={{ marginBottom: '20px' }}>
          <Visualizer />
        </div>

        {/* Transport controls */}
        <div className="glass rounded-2xl" style={{ padding: '24px', marginBottom: '20px' }}>
          <TransportControls />
        </div>

        {/* Brainwave indicator */}
        <div style={{ marginBottom: '20px' }}>
          <BrainwaveIndicator />
        </div>

        {/* Sound Layers */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 className="text-[11px] text-text-muted uppercase tracking-widest font-medium">
              Sound Layers
            </h2>
            <span className="text-[9px] text-text-muted font-mono">
              AM @ 200Hz–1kHz
            </span>
          </div>
          <LayerMixer />
        </div>

        {/* Footer */}
        <footer style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] text-text-muted leading-relaxed">
            Based on neural phase-locking research. Sine-wave amplitude modulation
            at brainwave frequencies produces stronger entrainment than binaural beats.
            Use 6+ min sessions at comfortable volume. Headphones recommended.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
