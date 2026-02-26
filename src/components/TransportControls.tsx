import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { MODE_CONFIGS } from '../audio/types';
import { MODE_ACCENT } from '../audio/constants';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TransportControls() {
  const isPlaying = useStore((s) => s.isPlaying);
  const isInitialized = useStore((s) => s.isInitialized);
  const mode = useStore((s) => s.mode);
  const entrainmentHz = useStore((s) => s.entrainmentHz);
  const elapsedSeconds = useStore((s) => s.elapsedSeconds);
  const masterVolume = useStore((s) => s.masterVolume);
  const reverbWet = useStore((s) => s.reverbWet);
  const init = useStore((s) => s.init);
  const togglePlay = useStore((s) => s.togglePlay);
  const setEntrainmentHz = useStore((s) => s.setEntrainmentHz);
  const setMasterVolume = useStore((s) => s.setMasterVolume);
  const setReverbWet = useStore((s) => s.setReverbWet);
  const tick = useStore((s) => s.tick);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const accent = MODE_ACCENT[mode];
  const config = MODE_CONFIGS[mode];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => tick(), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, tick]);

  const handlePlay = async () => {
    if (!isInitialized) {
      await init();
    }
    togglePlay();
  };

  return (
    <div className="space-y-5">
      {/* Hero play section — centered */}
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Play button with pulse rings */}
        <div className="relative">
          {/* Animated pulse rings when playing */}
          {isPlaying && (
            <>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1.5px solid ${accent.color}30`,
                  animation: 'pulse-ring 2.5s ease-out infinite',
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${accent.color}20`,
                  animation: 'pulse-ring 2.5s ease-out infinite 0.8s',
                }}
              />
            </>
          )}

          <button
            onClick={handlePlay}
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95"
            style={{
              background: isPlaying
                ? `linear-gradient(135deg, ${accent.color}, ${accent.color}cc)`
                : `linear-gradient(135deg, ${accent.color}20, ${accent.color}10)`,
              boxShadow: isPlaying
                ? `0 0 40px ${accent.glow}, 0 4px 20px ${accent.color}30`
                : `0 0 0 1px ${accent.color}15`,
            }}
          >
            {isPlaying ? (
              <svg width="20" height="22" viewBox="0 0 20 22" fill="white">
                <rect x="3" y="2" width="5" height="18" rx="1.5" />
                <rect x="12" y="2" width="5" height="18" rx="1.5" />
              </svg>
            ) : (
              <svg width="20" height="22" viewBox="0 0 20 22" style={{ marginLeft: 2 }}>
                <polygon points="3,1 19,11 3,21" fill={accent.color} />
              </svg>
            )}
          </button>
        </div>

        {/* Timer + mode label */}
        <div className="text-center">
          <div
            className="text-3xl font-mono font-light tracking-[0.2em] tabular-nums transition-colors duration-500"
            style={{ color: accent.color }}
          >
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-xs text-text-muted mt-1 tracking-wide">
            {config.description}
          </div>
        </div>
      </div>

      {/* Entrainment frequency — the key control */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">
            Entrainment
          </span>
          <span
            className="text-lg font-mono font-light tabular-nums transition-colors duration-300"
            style={{ color: accent.color }}
          >
            {entrainmentHz.toFixed(1)}
            <span className="text-xs text-text-muted ml-1">Hz</span>
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={40}
          step={0.5}
          value={entrainmentHz}
          onChange={(e) => setEntrainmentHz(parseFloat(e.target.value))}
          disabled={!isInitialized}
          style={{ '--slider-glow': accent.glow } as React.CSSProperties}
        />
        <div className="flex justify-between text-[9px] text-text-muted font-mono">
          <span>0.5 Delta</span>
          <span>4 Theta</span>
          <span>8 Alpha</span>
          <span>16 Beta</span>
          <span>40 Gamma</span>
        </div>
      </div>

      {/* Master controls */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Vol</span>
            <span className="text-[11px] font-mono text-text-secondary tabular-nums">
              {Math.round(masterVolume * 100)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            disabled={!isInitialized}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Space</span>
            <span className="text-[11px] font-mono text-text-secondary tabular-nums">
              {Math.round(reverbWet * 100)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={reverbWet}
            onChange={(e) => setReverbWet(parseFloat(e.target.value))}
            disabled={!isInitialized}
          />
        </div>
      </div>
    </div>
  );
}
