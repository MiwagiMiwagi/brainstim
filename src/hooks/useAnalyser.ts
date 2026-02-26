import { useRef, useCallback } from 'react';
import { getEngine } from '../audio/engine';

export function useAnalyser() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const startVisualizer = useCallback((accentColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = getEngine();

    const draw = () => {
      const data = engine.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = accentColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = accentColor;
      ctx.beginPath();

      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = (data[i] + 1) / 2; // normalize -1..1 to 0..1
        const y = v * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw center line
      ctx.strokeStyle = accentColor + '20';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  return { canvasRef, startVisualizer, stopVisualizer };
}
