import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { MODE_CONFIGS, type EntrainmentMode } from '../audio/types';

const MODE_ACCENT: Record<EntrainmentMode, string> = {
  focus: '#6366f1',
  relax: '#10b981',
  meditate: '#f59e0b',
  sleep: '#8b5cf6',
};

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

  // Timer
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
    <div className="space-y-4">
      {/* Play button + timer */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: isPlaying ? accent : accent + '20',
            boxShadow: isPlaying ? `0 0 30px ${accent}40` : 'none',
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <rect x="4" y="3" width="4" height="14" rx="1" />
              <rect x="12" y="3" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill={accent}>
              <polygon points="5,2 18,10 5,18" />
            </svg>
          )}
        </button>

        <div>
          <div className="text-2xl font-mono font-light tracking-wider" style={{ color: accent }}>
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-xs text-text-muted">
            {config.description}
          </div>
        </div>
      </div>

      {/* Entrainment frequency */}
      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Entrainment Frequency</span>
          <span className="font-mono" style={{ color: accent }}>{entrainmentHz.toFixed(1)} Hz</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={40}
          step={0.5}
          value={entrainmentHz}
          onChange={(e) => setEntrainmentHz(parseFloat(e.target.value))}
          disabled={!isInitialized}
          className="w-full"
          style={{ accentColor: accent }}
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-0.5 font-mono">
          <span>0.5 Hz (Delta)</span>
          <span>8 Hz (Alpha)</span>
          <span>16 Hz (Beta)</span>
          <span>40 Hz (Gamma)</span>
        </div>
      </div>

      {/* Master controls row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Master Volume</span>
            <span className="font-mono">{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            disabled={!isInitialized}
            className="w-full"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Reverb</span>
            <span className="font-mono">{Math.round(reverbWet * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={reverbWet}
            onChange={(e) => setReverbWet(parseFloat(e.target.value))}
            disabled={!isInitialized}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
