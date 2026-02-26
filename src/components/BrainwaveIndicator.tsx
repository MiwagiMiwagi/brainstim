import { useStore } from '../store/useStore';
import { BRAINWAVE_RANGES, type EntrainmentMode } from '../audio/types';

const MODE_ACCENT: Record<EntrainmentMode, string> = {
  focus: '#6366f1',
  relax: '#10b981',
  meditate: '#f59e0b',
  sleep: '#8b5cf6',
};

export function BrainwaveIndicator() {
  const entrainmentHz = useStore((s) => s.entrainmentHz);
  const mode = useStore((s) => s.mode);
  const isPlaying = useStore((s) => s.isPlaying);
  const accent = MODE_ACCENT[mode];

  // Determine which brainwave band the current Hz falls in
  const activeBand = Object.entries(BRAINWAVE_RANGES).find(
    ([_, range]) => entrainmentHz >= range.min && entrainmentHz <= range.max
  );

  return (
    <div className="bg-surface-1 rounded-xl p-4">
      <div className="text-xs text-text-muted mb-3 uppercase tracking-wider">Brainwave Spectrum</div>

      <div className="flex gap-1 h-8 items-end">
        {Object.entries(BRAINWAVE_RANGES).map(([key, range]) => {
          const isActive = activeBand?.[0] === key;
          // Normalized position of entrainmentHz within this band
          const fillPct = isActive
            ? ((entrainmentHz - range.min) / (range.max - range.min)) * 100
            : 0;

          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all duration-500 relative overflow-hidden"
                style={{
                  height: isActive ? '32px' : '16px',
                  background: isActive ? accent + '30' : '#232333',
                }}
              >
                {isActive && isPlaying && (
                  <div
                    className="absolute bottom-0 left-0 w-full rounded-sm transition-all duration-300"
                    style={{
                      height: `${Math.max(20, fillPct)}%`,
                      background: accent,
                      animation: 'pulse-glow 2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
              <span className={`text-[9px] font-mono ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                {range.label}
              </span>
            </div>
          );
        })}
      </div>

      {activeBand && (
        <div className="mt-2 text-center">
          <span className="text-xs font-mono" style={{ color: accent }}>
            {activeBand[1].label} — {activeBand[1].description}
          </span>
        </div>
      )}
    </div>
  );
}
