import { useEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { getCurrentLandmark, getEarthProgressPercent, getIdleMilesPerSecond } from '../game/formulas';

type GameSceneCanvasProps = {
  state: GameState;
  onEventClaim: () => void;
};

const biomePalette: Record<string, { sky1: string; sky2: string; ground: string }> = {
  plains: { sky1: '#38bdf8', sky2: '#c7f9ff', ground: '#22c55e' },
  desert: { sky1: '#f59e0b', sky2: '#fde68a', ground: '#d97706' },
  city: { sky1: '#60a5fa', sky2: '#bfdbfe', ground: '#64748b' },
  ocean: { sky1: '#0ea5e9', sky2: '#7dd3fc', ground: '#2563eb' },
  mountain: { sky1: '#94a3b8', sky2: '#e2e8f0', ground: '#64748b' },
  snow: { sky1: '#bae6fd', sky2: '#f8fafc', ground: '#cbd5e1' }
};

export const GameSceneCanvas = ({ state, onEventClaim }: GameSceneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startedAt = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(160, Math.floor(rect.height * window.devicePixelRatio));
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (time: number) => {
      const elapsed = (time - startedAt) / 1000;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const landmark = getCurrentLandmark(state);
      const palette = biomePalette[landmark.biome] ?? biomePalette.plains;
      const speed = getIdleMilesPerSecond(state);
      const progress = getEarthProgressPercent(state) / 100;

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, palette.sky1);
      sky.addColorStop(1, palette.sky2);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 4; i += 1) {
        const cloudX = (i * 90 + elapsed * (8 + i * 2)) % (width + 100) - 50;
        const cloudY = 20 + i * 18;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(cloudX, cloudY, 36, 12);
        ctx.fillRect(cloudX + 8, cloudY - 8, 20, 8);
      }

      const groundY = height - 60;
      ctx.fillStyle = palette.ground;
      ctx.fillRect(0, groundY, width, 60);

      const scroll = elapsed * (18 + speed * 120);
      for (let x = -40; x < width + 40; x += 20) {
        const blockX = ((x - scroll) % (width + 40)) - 20;
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.fillRect(blockX, groundY + 30, 16, 8);
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, groundY - 18, width, 8);

      const bob = Math.sin(elapsed * 7) * 2;
      const playerX = width * 0.25;
      const playerY = groundY - 24 + bob;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(playerX, playerY, 10, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(playerX - 2, playerY + 12, 5, 4);
      ctx.fillRect(playerX + 7, playerY + 12, 5, 4);

      if (state.spawnedEvent) {
        const pulse = 1 + Math.sin(elapsed * 10) * 0.1;
        const eventX = width * 0.75;
        const eventY = groundY - 45;
        ctx.save();
        ctx.translate(eventX, eventY);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`Biome: ${landmark.name}`, 10, 16);
      ctx.fillText(`Earth loop ${(progress * 100).toFixed(2)}%`, 10, 32);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startedAt = 0;
    };
  }, [state]);

  return (
    <div className="scene-wrap">
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        onClick={(event) => {
          if (!state.spawnedEvent) return;
          const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          if (x > rect.width * 0.67 && x < rect.width * 0.83 && y > rect.height * 0.5 && y < rect.height * 0.82) {
            onEventClaim();
          }
        }}
      />
    </div>
  );
};
