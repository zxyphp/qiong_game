import React, { useEffect, useRef } from 'react';
import { ASSETS_MANIFEST, assetManager } from '../config/assetsManifest';
import { ThemeMode } from '../types/game';

interface StarfieldCanvasProps {
  theme: ThemeMode;
  variant?: 'home' | 'map' | 'game';
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: string;
}

interface FloatingPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  alpha: number;
}

const STAR_COLORS = ['#ffffff', '#ffd666', '#f5d0fe', '#5cdbd3', '#ff85c0'];
const PETAL_COLORS_NIGHT = ['#ff85c0', '#d8b4fe', '#ffd666', '#5cdbd3'];
const PETAL_COLORS_DAY = ['#ff9cc8', '#ffe58f', '#d3adf7', '#87e8de'];

export const StarfieldCanvas: React.FC<StarfieldCanvasProps> = ({ theme, variant = 'home' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgPath =
      variant === 'home'
        ? ASSETS_MANIFEST.bg.splash
        : variant === 'map'
          ? ASSETS_MANIFEST.bg.map
          : theme === 'night'
            ? ASSETS_MANIFEST.bg.night
            : ASSETS_MANIFEST.bg.day;
    void assetManager.preload(bgPath);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: Star[] = Array.from({ length: 72 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.9,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0012 + Math.random() * 0.0024,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    const palette = theme === 'night' ? PETAL_COLORS_NIGHT : PETAL_COLORS_DAY;
    const petals: FloatingPetal[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -0.18 + Math.random() * 0.45,
      vy: 0.22 + Math.random() * 0.42,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      vRot: -0.015 + Math.random() * 0.03,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 0.24 + Math.random() * 0.42,
    }));

    let rafId = 0;

    const render = (time: number) => {
      const customBg = assetManager.getImage(bgPath);
      if (customBg) {
        // Cover-fit external background image
        const scale = Math.max(width / customBg.naturalWidth, height / customBg.naturalHeight);
        const drawW = customBg.naturalWidth * scale;
        const drawH = customBg.naturalHeight * scale;
        ctx.drawImage(customBg, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
        ctx.fillStyle = theme === 'night' ? 'rgba(11, 8, 32, 0.42)' : 'rgba(26, 16, 56, 0.22)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Dreamy starlight flower-sea fallback gradient
        const grad = ctx.createLinearGradient(0, 0, width * 0.4, height);
        if (theme === 'night') {
          grad.addColorStop(0, '#0a071f');
          grad.addColorStop(0.45, '#19103c');
          grad.addColorStop(0.8, '#2b164e');
          grad.addColorStop(1, '#120b2c');
        } else {
          grad.addColorStop(0, '#2a1f62');
          grad.addColorStop(0.42, '#4d2c7a');
          grad.addColorStop(0.76, '#7a3f84');
          grad.addColorStop(1, '#2b1b59');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Soft glowing nebula clouds
        const nebula1 = ctx.createRadialGradient(
          width * 0.2,
          height * 0.22,
          10,
          width * 0.2,
          height * 0.22,
          width * 0.72
        );
        nebula1.addColorStop(0, theme === 'night' ? 'rgba(179, 127, 235, 0.2)' : 'rgba(255, 163, 212, 0.28)');
        nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, width, height);

        const nebula2 = ctx.createRadialGradient(
          width * 0.85,
          height * 0.76,
          10,
          width * 0.85,
          height * 0.76,
          width * 0.7
        );
        nebula2.addColorStop(0, theme === 'night' ? 'rgba(92, 219, 211, 0.14)' : 'rgba(255, 214, 102, 0.2)');
        nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, width, height);
      }

      // Twinkling stars
      for (const star of stars) {
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
        ctx.globalAlpha = twinkle * (theme === 'night' ? 0.92 : 0.75);
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (star.r > 1.8) {
          ctx.globalAlpha = twinkle * 0.35;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Drifting glowing flower petals
      for (const p of petals) {
        p.x += p.vx + Math.sin(time * 0.001 + p.rotation) * 0.18;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y > height + 20) {
          p.y = -16;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -16;
        if (p.x < -20) p.x = width + 16;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [theme, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none z-0"
    />
  );
};
