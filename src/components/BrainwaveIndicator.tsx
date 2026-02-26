import { useStore } from '../store/useStore';
import { BRAINWAVE_RANGES } from '../audio/types';
import { MODE_ACCENT } from '../audio/constants';

const BAND_ENTRIES = Object.entries(BRAINWAVE_RANGES);

export function BrainwaveIndicator() {
  const entrainmentHz = useStore((s) => s.entrainmentHz);
  const mode = useStore((s) => s.mode);
  const isPlaying = useStore((s) => s.isPlaying);
  const accent = MODE_ACCENT[mode];

  const activeBand = BAND_ENTRIES.find(
    ([, range]) => entrainmentHz >= range.min && entrainmentHz <= range.max
  );

  return (
    <div className="glass rounded-xl" style={{ padding: '16px 16px 14px' }}>
      {/* Spectrum bars */}
      <div className="flex items-end" style={{ gap: '8px', height: '68px' }}>
        {BAND_ENTRIES.map(([key, range]) => {
          const isActive = activeBand?.[0] === key;
          const fillPct = isActive
            ? ((entrainmentHz - range.min) / (range.max - range.min)) * 100
            : 0;

          return (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.7s ease-out',
                  height: isActive ? '42px' : '14px',
                  background: isActive ? `${accent.color}15` : 'rgba(255,255,255,0.03)',
                  border: isActive ? `1px solid ${accent.color}20` : '1px solid transparent',
                }}
              >
                {/* Fill bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    borderRadius: '6px',
                    transition: 'all 0.5s',
                    height: isActive ? `${Math.max(25, fillPct)}%` : '0%',
                    background: isActive
                      ? `linear-gradient(to top, ${accent.color}, ${accent.color}80)`
                      : 'transparent',
                    boxShadow: isActive && isPlaying ? `0 0 12px ${accent.color}40` : 'none',
                    animation: isActive && isPlaying ? 'breathe 2.5s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: '9px',
                  lineHeight: 1,
                  transition: 'color 0.5s',
                  color: isActive ? accent.color : 'var(--color-text-muted)',
                }}
              >
                {range.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active band label */}
      {activeBand && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            textAlign: 'center',
            transition: 'all 0.5s',
            borderTop: `1px solid ${accent.color}10`,
          }}
        >
          <span className="font-mono" style={{ fontSize: '11px', color: accent.color }}>
            {activeBand[1].label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {activeBand[1].description}
          </span>
        </div>
      )}
    </div>
  );
}
