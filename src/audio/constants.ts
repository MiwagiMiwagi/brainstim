import type { EntrainmentMode } from './types';

export const MODE_ACCENT: Record<EntrainmentMode, { color: string; dim: string; glow: string }> = {
  focus:    { color: '#818cf8', dim: '#818cf818', glow: '#818cf850' },
  relax:    { color: '#34d399', dim: '#34d39918', glow: '#34d39950' },
  meditate: { color: '#fbbf24', dim: '#fbbf2418', glow: '#fbbf2450' },
  sleep:    { color: '#a78bfa', dim: '#a78bfa18', glow: '#a78bfa50' },
};
