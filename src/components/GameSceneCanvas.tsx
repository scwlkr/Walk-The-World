import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { getCurrentLandmark, getCurrentWorldProgressPercent, getIdleMilesPerSecond } from '../game/formulas';
import { getBackgroundScene } from '../game/backgroundScenes';
import {
  WALKER_ANIMATION_ASSETS,
  type WalkerAnimationState,
  type WalkerSpriteSheet
} from '../game/assets';
import { getActiveSeasonalEventForState } from '../game/seasonalEvents';
import { getCurrentWorldDefinition } from '../game/world';

type GameSceneCanvasProps = {
  state: GameState;
  onEventClaim: () => void;
  tapPulse: number;
  onSceneTap: (x: number, y: number) => void;
};

type LoadedWalkerSprite = {
  asset: WalkerSpriteSheet;
  image: HTMLImageElement;
};

const WALKER_ANIMATION_STATES: WalkerAnimationState[] = ['walk', 'idle', 'click', 'reward', 'celebration'];

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
  },
  lunar: {
    skyTop: '#111827',
    skyBottom: '#475569',
    farHill: '#64748b',
    nearHill: '#334155',
    groundTop: '#94a3b8',
    groundBottom: '#475569',
    path: '#cbd5e1'
  },
  space: {
    skyTop: '#020617',
    skyBottom: '#1e1b4b',
    farHill: '#334155',
    nearHill: '#1e293b',
    groundTop: '#64748b',
    groundBottom: '#0f172a',
    path: '#cbd5e1'
  }
};

export const GameSceneCanvas = ({ state, onEventClaim, tapPulse, onSceneTap }: GameSceneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [walkerSprites, setWalkerSprites] = useState<Partial<Record<WalkerAnimationState, LoadedWalkerSprite>>>({});
  const [backgroundReady, setBackgroundReady] = useState(false);
  const currentLandmark = getCurrentLandmark(state);
  const backgroundScene = getBackgroundScene(currentLandmark.sceneId);
  const activeSeasonalEvent = getActiveSeasonalEventForState(state);

  useEffect(() => {
    let cancelled = false;

    for (const animationState of WALKER_ANIMATION_STATES) {
      const asset = WALKER_ANIMATION_ASSETS[animationState];
      const sprite = new Image();

      sprite.onload = () => {
        if (cancelled) return;
        setWalkerSprites((prev) => ({
          ...prev,
          [animationState]: {
            asset,
            image: sprite
          }
        }));
      };

      sprite.onerror = () => {
        if (cancelled || animationState === 'walk') return;
        setWalkerSprites((prev) => {
          const next = { ...prev };
          delete next[animationState];
          return next;
        });
      };

      sprite.src = asset.src;
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();

    setBackgroundReady(false);
    image.onload = () => {
      if (cancelled) return;
      backgroundImageRef.current = image;
      setBackgroundReady(true);
    };
    image.onerror = () => {
      if (cancelled) return;
      backgroundImageRef.current = null;
      setBackgroundReady(false);
    };
    image.src = backgroundScene.src;

    return () => {
      cancelled = true;
    };
  }, [backgroundScene.src]);

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

    const drawFramedBackground = (image: HTMLImageElement, width: number, height: number, elapsed: number, speed: number) => {
      const scale = Math.max(height / image.height, width / image.width);
      const drawWidth = Math.ceil(image.width * scale);
      const drawHeight = Math.ceil(image.height * scale);
      const panRangeX = Math.max(0, drawWidth - width);
      const panRangeY = Math.max(0, drawHeight - height);
      const motion = state.settings.reducedMotion ? 0.18 : 1;
      const drift = Math.sin(elapsed * (0.035 + Math.min(speed * 2, 0.22)) * motion);
      const x = -Math.round(((drift + 1) / 2) * panRangeX);
      const y = -Math.round(panRangeY * 0.52);

      ctx.drawImage(image, x, y, drawWidth, drawHeight);
    };

    const getLoadedWalkerSprite = (animationState: WalkerAnimationState): LoadedWalkerSprite | undefined => {
      const direct = walkerSprites[animationState];
      if (direct) return direct;

      const fallbackState = WALKER_ANIMATION_ASSETS[animationState].fallbackState;
      if (fallbackState && walkerSprites[fallbackState]) return walkerSprites[fallbackState];

      return walkerSprites.walk;
    };

    const getActiveAnimationState = (speed: number): WalkerAnimationState => {
      if (state.ui.toast) return 'celebration';
      if (tapPulse > 0.16) return 'click';
      if (state.spawnedEvent) return 'reward';
      if (speed < 0.0012) return 'idle';
      return 'walk';
    };

    const drawTapBurst = (centerX: number, groundY: number, pulse: number) => {
      const alpha = Math.min(1, Math.max(0, pulse));
      const spread = 10 + (1 - alpha) * 34;

      ctx.fillStyle = `rgba(254,240,138,${0.34 * alpha})`;
      ctx.fillRect(centerX - 22 - spread * 0.2, groundY + 8, 44 + spread * 0.4, 5);

      for (let i = 0; i < 10; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const step = Math.floor(i / 2);
        const x = Math.round(centerX + side * (10 + step * 8 + spread * 0.34));
        const y = Math.round(groundY + 17 - step * 2 - (1 - alpha) * 10);
        const size = step % 2 === 0 ? 5 : 4;
        ctx.fillStyle = `rgba(250,204,21,${0.72 * alpha})`;
        ctx.fillRect(x, y, size, size);
      }
    };

    const draw = (time: number) => {
      const elapsed = time / 1000;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const landmark = currentLandmark;
      const palette = biomePalette[landmark.biome] ?? biomePalette.plains;
      const speed = getIdleMilesPerSecond(state);
      const progress = getCurrentWorldProgressPercent(state);
      const world = getCurrentWorldDefinition(state);
      const backgroundImage = backgroundImageRef.current;
      let pathY = Math.floor(height * 0.74);

      if (backgroundReady && backgroundImage) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);
        drawFramedBackground(backgroundImage, width, height, elapsed, speed);
        pathY = Math.floor(height * backgroundScene.pathYRatio);
      } else {
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
      }

      if (activeSeasonalEvent) {
        ctx.fillStyle = activeSeasonalEvent.visualTreatment.overlayColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = activeSeasonalEvent.visualTreatment.particleColor;
        for (let i = 0; i < 18; i += 1) {
          const drift = state.settings.reducedMotion ? 0 : elapsed * (10 + i);
          const x = Math.round((i * 67 + drift) % (width + 24)) - 12;
          const y = Math.round(60 + ((i * 37 + drift * 0.42) % Math.max(80, pathY - 90)));
          const size = i % 3 === 0 ? 4 : 3;
          ctx.fillRect(x, y, size, size);
        }
      }

      ctx.fillStyle = backgroundReady && backgroundImage ? backgroundScene.pathTint : palette.path;
      ctx.fillRect(0, pathY, width, 32);
      const scroll = elapsed * (34 + speed * 100);
      for (let x = -20; x < width + 20; x += 22) {
        const markX = ((x - scroll) % (width + 22)) - 11;
        ctx.fillStyle = backgroundReady && backgroundImage ? backgroundScene.pathLine : 'rgba(255,255,255,0.22)';
        ctx.fillRect(markX, pathY + 12, 12, 3);
      }

      const cadence = 4 + Math.min(12, speed * 22);
      const strideSwing = Math.sin(elapsed * cadence) * 5;
      const bob = state.settings.reducedMotion ? -tapPulse * 5 : Math.sin(elapsed * cadence * 0.9) * (2.5 + Math.min(3, speed * 2)) - tapPulse * 9;
      const playerCenterX = width * 0.25;
      const activeAnimation = getActiveAnimationState(speed);
      const walkerSprite = getLoadedWalkerSprite(activeAnimation);

      ctx.fillStyle = 'rgba(2,6,23,0.24)';
      ctx.fillRect(playerCenterX - 46, pathY + 25, 88, 7);

      if (walkerSprite) {
        const asset = walkerSprite.asset;
        const frameIndex = state.settings.reducedMotion ? 0 : Math.floor(elapsed * asset.fps) % asset.frameCount;
        const spriteSize = Math.min(asset.renderSize, Math.max(142, Math.round(height * 0.34)));
        ctx.drawImage(
          walkerSprite.image,
          frameIndex * asset.frameWidth,
          0,
          asset.frameWidth,
          asset.frameHeight,
          playerCenterX - spriteSize / 2,
          pathY - spriteSize + bob + 6,
          spriteSize,
          spriteSize
        );
      } else {
        const playerX = playerCenterX - 17;
        const playerY = pathY - 78 + bob;

        ctx.fillStyle = '#facc15';
        ctx.fillRect(playerX + 4, playerY, 26, 30);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(playerX + 10, playerY - 10, 14, 10);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(playerX + 10, playerY + 8, 4, 4);
        ctx.fillRect(playerX + 21, playerY + 8, 4, 4);

        const leftLegOffset = strideSwing > 0 ? 6 : 0;
        const rightLegOffset = strideSwing < 0 ? 6 : 0;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(playerX + 7, playerY + 30 + leftLegOffset, 8, 18 - leftLegOffset);
        ctx.fillRect(playerX + 19, playerY + 30 + rightLegOffset, 8, 18 - rightLegOffset);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(playerX + 5, playerY + 47 + leftLegOffset, 12, 5);
        ctx.fillRect(playerX + 17, playerY + 47 + rightLegOffset, 12, 5);
      }

      if (tapPulse > 0.01) {
        drawTapBurst(playerCenterX, pathY, tapPulse);
      }

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
      ctx.fillRect(10, height - 40, 220, 24);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${landmark.name} · ${world.shortName} ${progress.toFixed(2)}%`, 16, height - 24);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, onEventClaim, tapPulse, walkerSprites, backgroundReady, backgroundScene, currentLandmark]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onPointerDown={(event) => {
        const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (state.spawnedEvent && x > rect.width * 0.67 && x < rect.width * 0.82 && y > rect.height * 0.6 && y < rect.height * 0.86) {
          onEventClaim();
          return;
        }

        onSceneTap(x, y);
      }}
    />
  );
};
