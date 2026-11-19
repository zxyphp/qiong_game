import React, { useEffect, useRef, useState } from 'react';
import {
  ASSETS_MANIFEST,
  assetManager,
  drawObstacleOnCanvas,
  drawTileOnCanvas,
} from '../config/assetsManifest';
import { PostcardConfig } from '../config/qiongConfig';
import { FoxMood, ObstacleType, PropType, SpecialType, TileColor } from '../types/game';

interface TileCanvasPreviewProps {
  color?: TileColor;
  special?: SpecialType;
  obstacle?: ObstacleType;
  size?: number;
  animated?: boolean;
  className?: string;
}

/**
 * 复用与棋盘引擎完全一致的 Canvas 2D 降级渲染器（自动适配 devicePixelRatio）
 */
export const TileCanvasPreview: React.FC<TileCanvasPreviewProps> = ({
  color = 'rose',
  special = 'none',
  obstacle,
  size = 52,
  animated = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId = 0;

    const paint = (time: number) => {
      ctx.clearRect(0, 0, size, size);
      if (obstacle) {
        if (obstacle === 'vine' || obstacle === 'ice_1' || obstacle === 'ice_2') {
          drawTileOnCanvas(ctx, size / 2, size / 2, size * 0.38, color, 'none', time);
        }
        drawObstacleOnCanvas(ctx, size / 2, size / 2, size * 0.9, obstacle);
      } else {
        drawTileOnCanvas(ctx, size / 2, size / 2, size * 0.4, color, special, time);
      }

      if (animated) {
        rafId = requestAnimationFrame(paint);
      }
    };

    paint(0);
    let cancelled = false;
    const pathsToPreload: string[] = [];
    if (special === 'butterfly') {
      pathsToPreload.push(ASSETS_MANIFEST.specials.butterfly);
    } else {
      pathsToPreload.push(ASSETS_MANIFEST.tiles[color]);
    }
    if (obstacle) {
      pathsToPreload.push(ASSETS_MANIFEST.obstacles[obstacle]);
    }

    if (animated) {
      rafId = requestAnimationFrame(paint);
    } else {
      void Promise.all(pathsToPreload.map((p) => assetManager.preload(p))).then(() => {
        if (!cancelled) paint(0);
      });
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [color, special, obstacle, size, animated]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`block shrink-0 ${className}`}
    />
  );
};

interface FlowerFoxMascotProps {
  mood?: FoxMood;
  size?: number;
  className?: string;
}

/**
 * 陪伴小宠物「小花狐」：优先加载 `/assets/ui/fox_*.png`，未放入时自动绘制星光矢量立绘
 */
export const FlowerFoxMascot: React.FC<FlowerFoxMascotProps> = ({
  mood = 'idle',
  size = 128,
  className = '',
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const src = ASSETS_MANIFEST.ui.fox[mood];

  useEffect(() => {
    setUseFallback(false);
  }, [src]);

  if (!useFallback) {
    return (
      <img
        src={src}
        alt={`小花狐-${mood}`}
        width={size}
        height={size}
        onError={() => setUseFallback(true)}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`drop-shadow-[0_10px_22px_rgba(255,133,192,0.38)] ${className}`}
      role="img"
      aria-label="陪伴小花狐"
    >
      <defs>
        <radialGradient id="foxGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd6e7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#b37feb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="foxFur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7e6" />
          <stop offset="55%" stopColor="#ffd8bf" />
          <stop offset="100%" stopColor="#ffadd2" />
        </linearGradient>
        <linearGradient id="foxTail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffadd2" />
          <stop offset="60%" stopColor="#d3adf7" />
          <stop offset="100%" stopColor="#fffbe6" />
        </linearGradient>
      </defs>

      {/* Soft Aura */}
      <circle cx="80" cy="84" r="68" fill="url(#foxGlow)" />

      {/* Fluffy Starry Tail */}
      <path
        d="M 105 112 C 142 108, 150 72, 128 60 C 115 54, 108 72, 112 86 C 102 92, 98 104, 105 112 Z"
        fill="url(#foxTail)"
      />
      <circle cx="131" cy="69" r="3" fill="#fffbe6" />
      <circle cx="122" cy="84" r="2" fill="#ffd666" />

      {/* Body */}
      <ellipse cx="78" cy="116" rx="28" ry="24" fill="url(#foxFur)" />
      <ellipse cx="78" cy="120" rx="16" ry="15" fill="#fff9f2" opacity="0.92" />

      {/* Ears */}
      <path d="M 48 64 L 38 26 L 72 48 Z" fill="#ffb8d1" />
      <path d="M 50 58 L 44 35 L 65 49 Z" fill="#fff0f6" />
      <path d="M 108 64 L 118 26 L 84 48 Z" fill="#ffb8d1" />
      <path d="M 106 58 L 112 35 L 91 49 Z" fill="#fff0f6" />

      {/* Head */}
      <ellipse cx="78" cy="74" rx="34" ry="29" fill="url(#foxFur)" />
      {/* Cheeks */}
      <ellipse cx="56" cy="82" rx="7" ry="4" fill="#ff85c0" opacity="0.45" />
      <ellipse cx="100" cy="82" rx="7" ry="4" fill="#ff85c0" opacity="0.45" />

      {/* Glowing Flower Ornament on Right Ear */}
      <g transform="translate(103 45)">
        <circle cx="0" cy="-6" r="5" fill="#ff85c0" />
        <circle cx="6" cy="-1" r="5" fill="#ff85c0" />
        <circle cx="3" cy="5" r="5" fill="#ff85c0" />
        <circle cx="-4" cy="5" r="5" fill="#ff85c0" />
        <circle cx="-6" cy="-1" r="5" fill="#ff85c0" />
        <circle cx="0" cy="0" r="3.6" fill="#ffd666" />
      </g>

      {/* Eyes by mood */}
      {mood === 'yawn' ? (
        <>
          <path d="M 58 72 Q 64 76 70 72" stroke="#391085" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 86 72 Q 92 76 98 72" stroke="#391085" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="78" cy="86" rx="5" ry="6.5" fill="#ff85c0" stroke="#391085" strokeWidth="1.6" />
          <text x="116" y="42" fontSize="14" fill="#ffd666" fontWeight="bold">Z</text>
          <text x="128" y="30" fontSize="11" fill="#d8b4fe" fontWeight="bold">z</text>
        </>
      ) : mood === 'cheer' ? (
        <>
          <path d="M 58 74 Q 64 67 70 74" stroke="#391085" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 86 74 Q 92 67 98 74" stroke="#391085" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 73 82 Q 78 88 83 82" stroke="#391085" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {/* Holding a glowing star flower */}
          <g transform="translate(46 108)">
            <line x1="0" y1="0" x2="10" y2="16" stroke="#73d13d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="-5" r="5" fill="#ffd666" />
            <circle cx="5" cy="0" r="5" fill="#ff85c0" />
            <circle cx="0" cy="5" r="5" fill="#5cdbd3" />
            <circle cx="-5" cy="0" r="5" fill="#b37feb" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
          </g>
        </>
      ) : (
        <>
          <circle cx="64" cy="73" r="4.8" fill="#2b1457" />
          <circle cx="62.5" cy="71.2" r="1.8" fill="#ffffff" />
          <circle cx="92" cy="73" r="4.8" fill="#2b1457" />
          <circle cx="90.5" cy="71.2" r="1.8" fill="#ffffff" />
          <path d="M 74 82 Q 78 86 82 82" stroke="#391085" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Little nose */}
      <polygon points="75,78 81,78 78,81.5" fill="#eb2f96" />

      {/* Paws */}
      <ellipse cx="64" cy="134" rx="7" ry="5" fill="#fff0f6" />
      <ellipse cx="92" cy="134" rx="7" ry="5" fill="#fff0f6" />
    </svg>
  );
};

interface PropIconArtProps {
  prop: PropType;
  size?: number;
}

export const PropIconArt: React.FC<PropIconArtProps> = ({ prop, size = 32 }) => {
  const [useFallback, setUseFallback] = useState(false);
  const src = ASSETS_MANIFEST.ui.props[prop];

  if (!useFallback) {
    return (
      <img
        src={src}
        alt={prop}
        width={size}
        height={size}
        onError={() => setUseFallback(true)}
        className="object-contain"
      />
    );
  }

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      {prop === 'hammer' && (
        <g>
          <rect x="18" y="18" width="5" height="17" rx="2.5" fill="#ffd666" transform="rotate(-35 20 26)" />
          <rect x="9" y="8" width="18" height="10" rx="4" fill="#ff85c0" stroke="#fff0f6" strokeWidth="1.5" transform="rotate(-35 18 13)" />
        </g>
      )}
      {prop === 'swap' && (
        <g fill="none" stroke="#5cdbd3" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 15 H 29 L 24 10" />
          <path d="M 30 25 H 11 L 16 30" />
        </g>
      )}
      {prop === 'shuffle' && (
        <g fill="none" stroke="#d8b4fe" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 10 20 A 10 10 0 1 1 26 28" />
          <path d="M 27 23 L 26 29 L 20 28" />
          <circle cx="20" cy="20" r="3" fill="#ffd666" stroke="none" />
        </g>
      )}
      {prop === 'undo' && (
        <g fill="none" stroke="#ffd666" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 14 14 L 8 20 L 14 26" />
          <path d="M 9 20 H 23 A 7 7 0 1 1 23 34 H 18" />
        </g>
      )}
    </svg>
  );
};

interface PostcardArtProps {
  postcard: PostcardConfig;
  locked?: boolean;
}

export const PostcardArt: React.FC<PostcardArtProps> = ({ postcard, locked = false }) => {
  const [useFallback, setUseFallback] = useState(false);
  const src = ASSETS_MANIFEST.ui.postcards[postcard.id];

  if (!useFallback && !locked) {
    return (
      <img
        src={src}
        alt={postcard.title}
        onError={() => setUseFallback(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  const [c1, c2, c3] = postcard.palette;

  return (
    <svg viewBox="0 0 320 200" className="w-full h-full block" aria-hidden="true">
      <defs>
        <linearGradient id={`pc-bg-${postcard.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c3} />
          <stop offset="55%" stopColor={c2} stopOpacity="0.82" />
          <stop offset="100%" stopColor={c1} stopOpacity="0.88" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#pc-bg-${postcard.id})`} />
      {/* Crescent moon & starlight hills */}
      <circle cx="258" cy="48" r="24" fill="#fffbe6" opacity="0.85" />
      <circle cx="268" cy="42" r="21" fill={c3} opacity="0.82" />
      <path d="M 0 148 Q 95 108 185 144 T 320 132 L 320 200 L 0 200 Z" fill={c3} opacity="0.65" />
      <path d="M 0 166 Q 120 136 225 162 T 320 156 L 320 200 L 0 200 Z" fill="#0b0820" opacity="0.52" />
      {/* Glowing blossoms */}
      {[
        [48, 152, 8],
        [98, 166, 6],
        [156, 158, 9],
        [222, 168, 7],
        [278, 154, 8],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 1.9} fill={c1} opacity="0.28" />
          <circle cx={x} cy={y} r={r * 0.65} fill="#fffbe6" opacity="0.92" />
        </g>
      ))}
      {/* Stars */}
      {[
        [40, 36, 2],
        [92, 54, 1.8],
        [145, 28, 2.5],
        [192, 66, 1.5],
        [118, 92, 2],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity="0.88" />
      ))}
    </svg>
  );
};
