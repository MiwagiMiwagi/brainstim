import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getEngine } from '../audio/engine';
import { MODE_ACCENT } from '../audio/constants';

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isPlaying = useStore((s) => s.isPlaying);
  const mode = useStore((s) => s.mode);
  const accent = MODE_ACCENT[mode];

  // History buffer for trailing ghost waveforms
  const historyRef = useRef<Float32Array[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const engine = getEngine();

    const render = () => {
      const data = engine.getAnalyserData();
      ctx.clearRect(0, 0, w, h);

      // Push current data into history (keep last 4 frames)
      historyRef.current.push(new Float32Array(data));
      if (historyRef.current.length > 4) historyRef.current.shift();

      // Ambient radial glow in center
      const radGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      radGrad.addColorStop(0, accent.color + '0a');
      radGrad.addColorStop(0.5, accent.color + '04');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw ghost trails (older = fainter)
      const history = historyRef.current;
      for (let g = 0; g < history.length - 1; g++) {
        const ghostData = history[g];
        const alpha = Math.floor((g + 1) * 12).toString(16).padStart(2, '0');
        ctx.lineWidth = 1;
        ctx.strokeStyle = accent.color + alpha;
        ctx.beginPath();

        const sliceW = w / ghostData.length;
        const yOffset = (history.length - 1 - g) * 2;
        for (let i = 0; i < ghostData.length; i++) {
          const x = i * sliceW;
          const v = (ghostData[i] + 1) / 2;
          const y = v * h + yOffset;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const px = (i - 1) * sliceW;
            const pv = (ghostData[i - 1] + 1) / 2;
            const py = pv * h + yOffset;
            ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
          }
        }
        ctx.stroke();
      }

      // Main waveform — bright, glowing
      ctx.lineWidth = 2;
      ctx.strokeStyle = accent.color;
      ctx.shadowBlur = 16;
      ctx.shadowColor = accent.color;
      ctx.beginPath();

      const sliceWidth = w / data.length;
      for (let i = 0; i < data.length; i++) {
        const x = i * sliceWidth;
        const v = (data[i] + 1) / 2;
        const y = v * h;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const px = (i - 1) * sliceWidth;
          const pv = (data[i - 1] + 1) / 2;
          const py = pv * h;
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        }
      }
      ctx.stroke();

      // Inner bright core line
      ctx.lineWidth = 1;
      ctx.strokeStyle = accent.color + 'cc';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff40';
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = i * sliceWidth;
        const v = (data[i] + 1) / 2;
        const y = v * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    render();
  }, [accent.color]);

  useEffect(() => {
    if (isPlaying) {
      historyRef.current = [];
      draw();
    } else {
      cancelAnimationFrame(animRef.current);

      // Draw idle state — faint horizontal line with soft gradient
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Subtle center glow even when stopped
          const radGrad = ctx.createRadialGradient(
            rect.width / 2, rect.height / 2, 0,
            rect.width / 2, rect.height / 2, rect.width * 0.4
          );
          radGrad.addColorStop(0, accent.color + '06');
          radGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = radGrad;
          ctx.fillRect(0, 0, rect.width, rect.height);

          // Dashed center line
          const lineGrad = ctx.createLinearGradient(0, 0, rect.width, 0);
          lineGrad.addColorStop(0, 'transparent');
          lineGrad.addColorStop(0.2, accent.color + '25');
          lineGrad.addColorStop(0.8, accent.color + '25');
          lineGrad.addColorStop(1, 'transparent');
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.moveTo(0, rect.height / 2);
          ctx.lineTo(rect.width, rect.height / 2);
          ctx.stroke();
        }
      }
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, draw, accent.color]);

  return (
    <div className="relative glass rounded-2xl overflow-hidden">
      {/* Ambient glow behind canvas */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 blur-xl"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${accent.color}0c, transparent 70%)`,
          opacity: isPlaying ? 1 : 0.3,
        }}
      />
      <canvas
        ref={canvasRef}
        className="relative w-full rounded-2xl"
        style={{ height: isPlaying ? '160px' : '100px', transition: 'height 0.8s ease' }}
      />
    </div>
  );
}
