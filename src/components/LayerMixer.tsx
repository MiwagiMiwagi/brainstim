import { useStore } from '../store/useStore';
import type { LayerId, NoiseTexture } from '../audio/types';
import { NOISE_TEXTURE_CONFIGS } from '../audio/types';
import { MODE_ACCENT } from '../audio/constants';

const TEXTURE_OPTIONS: NoiseTexture[] = ['pink', 'brown', 'rain', 'ocean', 'wind', 'creek'];

const LAYER_META: Record<LayerId, { label: string; icon: string; desc: string }> = {
  drone:    { label: 'Drone',    icon: '\u223c',  desc: 'Fundamental tone' },
  pad:      { label: 'Pad',      icon: '\u2248',  desc: 'Chord drift' },
  noise:    { label: 'Noise',    icon: '\u223f',  desc: 'Sound texture' },
  binaural: { label: 'Binaural', icon: '\u2295',  desc: 'Stereo beat' },
};

const LAYER_ORDER: LayerId[] = ['drone', 'pad', 'noise', 'binaural'];

function TextureSelector() {
  const noiseTexture = useStore((s) => s.noiseTexture);
  const setNoiseTexture = useStore((s) => s.setNoiseTexture);
  const mode = useStore((s) => s.mode);
  const isInitialized = useStore((s) => s.isInitialized);
  const noiseEnabled = useStore((s) => s.layers.noise.enabled);
  const accent = MODE_ACCENT[mode];

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        Texture
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {TEXTURE_OPTIONS.map((t) => {
          const cfg = NOISE_TEXTURE_CONFIGS[t];
          const active = noiseTexture === t;
          return (
            <button
              key={t}
              onClick={() => isInitialized && noiseEnabled && setNoiseTexture(t)}
              disabled={!isInitialized || !noiseEnabled}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                cursor: isInitialized && noiseEnabled ? 'pointer' : 'default',
                transition: 'all 0.25s',
                background: active ? `${accent.color}20` : 'rgba(255,255,255,0.04)',
                color: active ? accent.color : 'var(--color-text-muted)',
                opacity: !isInitialized || !noiseEnabled ? 0.3 : 1,
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LayerStrip({ id }: { id: LayerId }) {
  const layer = useStore((s) => s.layers[id]);
  const mode = useStore((s) => s.mode);
  const isPlaying = useStore((s) => s.isPlaying);
  const setLayerVolume = useStore((s) => s.setLayerVolume);
  const setLayerModDepth = useStore((s) => s.setLayerModDepth);
  const setLayerEnabled = useStore((s) => s.setLayerEnabled);
  const isInitialized = useStore((s) => s.isInitialized);

  const meta = LAYER_META[id];
  const accent = MODE_ACCENT[mode];

  return (
    <div
      className="glass rounded-xl transition-all duration-500"
      style={{
        padding: '14px 16px 16px',
        opacity: layer.enabled ? 1 : 0.4,
        borderColor: layer.enabled && isPlaying ? `${accent.color}08` : undefined,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              background: layer.enabled ? `${accent.color}12` : 'rgba(255,255,255,0.03)',
              color: layer.enabled ? accent.color : 'var(--color-text-muted)',
              transition: 'all 0.5s',
            }}
          >
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
              {meta.desc}
            </div>
          </div>
        </div>

        {/* Toggle — small, subtle */}
        <button
          onClick={() => isInitialized && setLayerEnabled(id, !layer.enabled)}
          disabled={!isInitialized}
          style={{
            position: 'relative',
            width: '32px',
            height: '18px',
            borderRadius: '9px',
            border: 'none',
            cursor: isInitialized ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background 0.3s, box-shadow 0.3s',
            background: layer.enabled
              ? accent.color
              : 'var(--color-surface-4)',
            boxShadow: layer.enabled ? `0 0 6px ${accent.color}25` : 'none',
            opacity: isInitialized ? 1 : 0.3,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: layer.enabled ? '17px' : '3px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--color-text-secondary)',
              transition: 'left 0.25s ease, background 0.25s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </button>
      </div>

      {/* Volume */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vol
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s',
              color: layer.enabled ? accent.color : 'var(--color-text-muted)',
            }}
          >
            {Math.round(layer.volume * 100)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.volume}
          onChange={(e) => setLayerVolume(id, parseFloat(e.target.value))}
          disabled={!isInitialized || !layer.enabled}
          style={{ '--slider-glow': layer.enabled ? accent.glow : 'transparent' } as React.CSSProperties}
        />
      </div>

      {/* Modulation depth */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Neural
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s',
              color: layer.enabled ? accent.color : 'var(--color-text-muted)',
            }}
          >
            {Math.round(layer.modDepth * 100)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.modDepth}
          onChange={(e) => setLayerModDepth(id, parseFloat(e.target.value))}
          disabled={!isInitialized || !layer.enabled}
          style={{ '--slider-glow': layer.enabled ? accent.glow : 'transparent' } as React.CSSProperties}
        />
      </div>

      {/* Texture selector — only for noise layer */}
      {id === 'noise' && <TextureSelector />}
    </div>
  );
}

export function LayerMixer() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {LAYER_ORDER.map((id) => (
        <LayerStrip key={id} id={id} />
      ))}
    </div>
  );
}
