import { useStore } from '../store/useStore';
import { MODE_CONFIGS, type EntrainmentMode } from '../audio/types';
import { MODE_ACCENT } from '../audio/constants';

const MODES = Object.keys(MODE_CONFIGS) as EntrainmentMode[];

export function ModeSelector() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const isInitialized = useStore((s) => s.isInitialized);
  const isPlaying = useStore((s) => s.isPlaying);

  return (
    <div className="relative">
      <div className="flex gap-2 p-2 rounded-2xl bg-surface-1 border border-white/[0.05]">
        {MODES.map((m) => {
          const config = MODE_CONFIGS[m];
          const a = MODE_ACCENT[m];
          const active = mode === m;

          return (
            <button
              key={m}
              onClick={() => isInitialized && setMode(m)}
              disabled={!isInitialized}
              className={`
                relative flex-1 rounded-xl transition-all duration-500 ease-out
                disabled:opacity-30 disabled:cursor-not-allowed
                ${active ? 'z-10' : 'hover:bg-white/[0.03]'}
              `}
              style={{ padding: '14px 8px' }}
            >
              {/* Active background glow */}
              {active && (
                <div
                  className="absolute inset-0 rounded-xl transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${a.color}15, ${a.color}08)`,
                    boxShadow: isPlaying
                      ? `0 0 24px ${a.glow}, inset 0 1px 0 ${a.color}20`
                      : `inset 0 1px 0 ${a.color}15`,
                    animation: isPlaying ? 'breathe-subtle 3s ease-in-out infinite' : 'none',
                  }}
                />
              )}

              <div className="relative flex flex-col items-center" style={{ gap: '4px' }}>
                <span
                  className="text-[10px] font-mono tabular-nums transition-colors duration-300"
                  style={{ color: active ? a.color : undefined }}
                >
                  {config.entrainmentHz} Hz
                </span>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    active ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {config.label}
                </span>
                {/* Active dot */}
                <div
                  className="w-1 h-1 rounded-full transition-all duration-500"
                  style={{
                    marginTop: '2px',
                    background: active ? a.color : 'transparent',
                    boxShadow: active && isPlaying ? `0 0 6px ${a.color}` : 'none',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
