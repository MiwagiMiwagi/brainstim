import { useStore } from '../store/useStore';
import type { LayerId, EntrainmentMode } from '../audio/types';

const LAYER_META: Record<LayerId, { label: string; icon: string; description: string }> = {
  drone:    { label: 'Drone',    icon: '~',  description: 'Warm fundamental tone' },
  pad:      { label: 'Pad',      icon: '≈',  description: 'Ambient chord texture' },
  noise:    { label: 'Noise',    icon: '∿',  description: 'Pink noise masking' },
  binaural: { label: 'Binaural', icon: '⊕',  description: 'Stereo beat (headphones)' },
};

const MODE_ACCENT: Record<EntrainmentMode, string> = {
  focus: '#6366f1',
  relax: '#10b981',
  meditate: '#f59e0b',
  sleep: '#8b5cf6',
};

function LayerStrip({ id }: { id: LayerId }) {
  const layer = useStore((s) => s.layers[id]);
  const mode = useStore((s) => s.mode);
  const setLayerVolume = useStore((s) => s.setLayerVolume);
  const setLayerModDepth = useStore((s) => s.setLayerModDepth);
  const setLayerEnabled = useStore((s) => s.setLayerEnabled);
  const isInitialized = useStore((s) => s.isInitialized);

  const meta = LAYER_META[id];
  const accent = MODE_ACCENT[mode];

  return (
    <div
      className={`
        rounded-xl p-4 transition-all duration-300
        ${layer.enabled ? 'bg-surface-2' : 'bg-surface-1 opacity-50'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-mono"
            style={{ background: layer.enabled ? accent + '20' : undefined, color: layer.enabled ? accent : undefined }}
          >
            {meta.icon}
          </span>
          <div>
            <div className="text-sm font-medium text-text-primary">{meta.label}</div>
            <div className="text-xs text-text-muted">{meta.description}</div>
          </div>
        </div>
        <button
          onClick={() => isInitialized && setLayerEnabled(id, !layer.enabled)}
          disabled={!isInitialized}
          className={`
            w-10 h-6 rounded-full transition-all duration-200 relative
            ${layer.enabled ? '' : 'bg-surface-4'}
            disabled:opacity-40
          `}
          style={{ background: layer.enabled ? accent : undefined }}
        >
          <span
            className={`
              absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200
              ${layer.enabled ? 'left-5' : 'left-1'}
            `}
          />
        </button>
      </div>

      {/* Volume */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Volume</span>
          <span className="font-mono">{Math.round(layer.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.volume}
          onChange={(e) => setLayerVolume(id, parseFloat(e.target.value))}
          disabled={!isInitialized || !layer.enabled}
          className="w-full disabled:opacity-30"
          style={{
            accentColor: accent,
          }}
        />
      </div>

      {/* Modulation Depth */}
      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Neural Effect</span>
          <span className="font-mono">{Math.round(layer.modDepth * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.modDepth}
          onChange={(e) => setLayerModDepth(id, parseFloat(e.target.value))}
          disabled={!isInitialized || !layer.enabled}
          className="w-full disabled:opacity-30"
          style={{
            accentColor: accent,
          }}
        />
      </div>
    </div>
  );
}

export function LayerMixer() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['drone', 'pad', 'noise', 'binaural'] as LayerId[]).map((id) => (
        <LayerStrip key={id} id={id} />
      ))}
    </div>
  );
}
