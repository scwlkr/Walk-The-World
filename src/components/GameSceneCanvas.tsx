import { useEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { getCurrentLandmark, getEarthProgressPercent, getIdleMilesPerSecond } from '../game/formulas';

type GameSceneCanvasProps = {
  state: GameState;
  onEventClaim: () => void;
};

const biomePalette: Record<
  string,
  {
    skyTop: string;
    skyBottom: string;
    farHill: string;
    nearHill: string;
    groundTop: string;
    groundBottom: string;
    path: string;
  }
> = {
  plains: {
    skyTop: '#60a5fa',
    skyBottom: '#dbeafe',
    farHill: '#65a30d',
    nearHill: '#4d7c0f',
    groundTop: '#65a30d',
    groundBottom: '#365314',
    path: '#a16207'
  },
  desert: {
    skyTop: '#f59e0b',
    skyBottom: '#ffedd5',
    farHill: '#d97706',
    nearHill: '#c2410c',
    groundTop: '#d97706',
    groundBottom: '#9a3412',
    path: '#fbbf24'
  },
  city: {
    skyTop: '#3b82f6',
    skyBottom: '#dbeafe',
    farHill: '#64748b',
    nearHill: '#334155',
    groundTop: '#64748b',
    groundBottom: '#1e293b',
    path: '#94a3b8'
  },
  ocean: {
    skyTop: '#0ea5e9',
    skyBottom: '#e0f2fe',
    farHill: '#0f766e',
    nearHill: '#115e59',
    groundTop: '#0d9488',
    groundBottom: '#134e4a',
    path: '#06b6d4'
  },
  mountain: {
    skyTop: '#64748b',
    skyBottom: '#e2e8f0',
    farHill: '#475569',
    nearHill: '#334155',
    groundTop: '#64748b',
    groundBottom: '#1e293b',
    path: '#94a3b8'
  },
  snow: {
    skyTop: '#7dd3fc',
    skyBottom: '#f8fafc',
    farHill: '#cbd5e1',
    nearHill: '#94a3b8',
    groundTop: '#e2e8f0',
    groundBottom: '#cbd5e1',
    path: '#f1f5f9'
  }
};

export const GameSceneCanvas = ({ state, onEventClaim }: GameSceneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    resize();
    window.addEventListener('resize', resize);

    const drawLayeredHills = (width: number, height: number, elapsed: number, speed: number, color: string, yBase: number) => {
      const scroll = (elapsed * speed) % 80;
      ctx.fillStyle = color;
      for (let x = -90; x < width + 90; x += 80) {
        const px = x - scroll;
        ctx.fillRect(px, yBase, 80, height - yBase);
        ctx.clearRect(px + 10, yBase - 18, 20, 18);
        ctx.clearRect(px + 44, yBase - 26, 24, 26);
      }
    };

    const draw = (time: number) => {
      const elapsed = time / 1000;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const landmark = getCurrentLandmark(state);
      const palette = biomePalette[landmark.biome] ?? biomePalette.plains;
      const speed = getIdleMilesPerSecond(state);
      const progress = getEarthProgressPercent(state);

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(1, palette.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 7; i += 1) {
        const cloudX = (i * 120 - elapsed * (8 + i)) % (width + 140);
        const cloudY = 26 + (i % 3) * 24;
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(width - cloudX, cloudY, 42, 10);
        ctx.fillRect(width - cloudX + 8, cloudY - 8, 22, 8);
        ctx.fillRect(width - cloudX + 18, cloudY + 8, 16, 6);
      }

      drawLayeredHills(width, height, elapsed, 8, palette.farHill, Math.floor(height * 0.53));
      drawLayeredHills(width, height, elapsed, 15, palette.nearHill, Math.floor(height * 0.62));

      const groundY = Math.floor(height * 0.74);
      ctx.fillStyle = palette.groundTop;
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = palette.groundBottom;
      ctx.fillRect(0, groundY + 24, width, height - (groundY + 24));

      const pathY = groundY + 22;
      ctx.fillStyle = palette.path;
      ctx.fillRect(0, pathY, width, 28);
      const scroll = elapsed * (34 + speed * 100);
      for (let x = -20; x < width + 20; x += 22) {
        const markX = ((x - scroll) % (width + 22)) - 11;
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(markX, pathY + 12, 12, 3);
      }

      for (let i = 0; i < 12; i += 1) {
        const grassX = (i * 62 - elapsed * 16) % (width + 40);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(grassX, groundY + 8, 4, 10);
        ctx.fillRect(grassX + 5, groundY + 10, 3, 8);
      }

      for (let i = 0; i < 5; i += 1) {
        const propX = ((i * 170 - elapsed * 26) % (width + 80)) - 30;
        ctx.fillStyle = '#3f6212';
        ctx.fillRect(propX, groundY - 16, 7, 16);
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(propX - 4, groundY - 24, 16, 8);
      }

      const bob = Math.sin(elapsed * 8.5) * 3;
      const playerX = width * 0.28;
      const playerY = pathY - 40 + bob;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(playerX, playerY, 16, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(playerX + 3, playerY + 4, 3, 3);
      ctx.fillRect(playerX + 10, playerY + 4, 3, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(playerX - 1, playerY + 18, 7, 6);
      ctx.fillRect(playerX + 10, playerY + 18, 7, 6);

      if (state.spawnedEvent) {
        const pulse = 1 + Math.sin(elapsed * 8) * 0.15;
        const eventX = width * 0.74;
        const eventY = pathY - 42;
        ctx.save();
        ctx.translate(eventX, eventY);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(2,6,23,0.55)';
      ctx.fillRect(10, height - 40, 200, 24);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${landmark.name} · Earth ${progress.toFixed(2)}%`, 16, height - 24);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, onEventClaim]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onClick={(event) => {
        if (!state.spawnedEvent) return;
        const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x > rect.width * 0.67 && x < rect.width * 0.82 && y > rect.height * 0.6 && y < rect.height * 0.86) {
          onEventClaim();
        }
      }}
    />
  );
};
