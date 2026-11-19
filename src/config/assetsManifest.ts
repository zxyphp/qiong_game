import { FoxMood, ObstacleType, PropType, SpecialType, TileColor } from '../types/game';

/**
 * 统一资产清单：所有外部美术与音频路径均由此管理。
 * 当对应图片尚未放入 `public/assets/...` 或加载失败时，
 * AssetManager 与 Fallback Renderer 会自动无缝降级为精致矢量发光花朵/插画。
 */
export const ASSETS_MANIFEST = {
  tiles: {
    rose: '/assets/tiles/tile_rose.png',
    sun: '/assets/tiles/tile_sun.png',
    cyan: '/assets/tiles/tile_cyan.png',
    violet: '/assets/tiles/tile_violet.png',
    coral: '/assets/tiles/tile_coral.png',
    emerald: '/assets/tiles/tile_emerald.png',
  } as Record<TileColor, string>,

  specials: {
    line_h: '/assets/tiles/special_line_h.png',
    line_v: '/assets/tiles/special_line_v.png',
    bomb: '/assets/tiles/special_bomb.png',
    butterfly: '/assets/tiles/special_butterfly.png',
  } as Record<Exclude<SpecialType, 'none'>, string>,

  obstacles: {
    ice_1: '/assets/obstacles/ice_1.png',
    ice_2: '/assets/obstacles/ice_2.png',
    vine: '/assets/obstacles/vine.png',
    drop_item: '/assets/obstacles/drop_item.png',
    honey: '/assets/obstacles/honey.png',
  } as Record<ObstacleType, string>,

  bg: {
    splash: '/assets/bg/splash.jpg',
    day: '/assets/bg/bg_day.jpg',
    night: '/assets/bg/bg_night.jpg',
    map: '/assets/bg/map_bg.jpg',
  },

  ui: {
    props: {
      hammer: '/assets/ui/prop_hammer.png',
      swap: '/assets/ui/prop_swap.png',
      shuffle: '/assets/ui/prop_shuffle.png',
      undo: '/assets/ui/prop_undo.png',
    } as Record<PropType, string>,
    fox: {
      idle: '/assets/ui/fox_idle.png',
      cheer: '/assets/ui/fox_cheer.png',
      yawn: '/assets/ui/fox_yawn.png',
    } as Record<FoxMood, string>,
    postcards: {
      1: '/assets/ui/postcard_1.jpg',
      2: '/assets/ui/postcard_2.jpg',
      3: '/assets/ui/postcard_3.jpg',
      4: '/assets/ui/postcard_4.jpg',
      5: '/assets/ui/postcard_5.jpg',
    } as Record<number, string>,
  },

  audio: {
    bgmMain: '/assets/audio/bgm_main.mp3',
    bgmGame: '/assets/audio/bgm_game.mp3',
    voiceWelcome: '/assets/audio/voice_welcome.mp3',
  },
} as const;

export interface TileVisualMeta {
  color: TileColor;
  name: string;
  petalLight: string;
  petalMain: string;
  petalDeep: string;
  coreColor: string;
  glow: string;
  petals: number;
}

export const TILE_VISUAL_META: Record<TileColor, TileVisualMeta> = {
  rose: {
    color: 'rose',
    name: '琼樱粉花',
    petalLight: '#fff0f6',
    petalMain: '#ff85c0',
    petalDeep: '#eb2f96',
    coreColor: '#ffe58f',
    glow: 'rgba(255, 133, 192, 0.72)',
    petals: 5,
  },
  sun: {
    color: 'sun',
    name: '晨曦金花',
    petalLight: '#fffbe6',
    petalMain: '#ffd666',
    petalDeep: '#fa8c16',
    coreColor: '#fff1b8',
    glow: 'rgba(255, 214, 102, 0.72)',
    petals: 8,
  },
  cyan: {
    color: 'cyan',
    name: '碧落青莲',
    petalLight: '#e6fffb',
    petalMain: '#5cdbd3',
    petalDeep: '#13c2c2',
    coreColor: '#ffffff',
    glow: 'rgba(92, 219, 211, 0.72)',
    petals: 6,
  },
  violet: {
    color: 'violet',
    name: '紫藤幻花',
    petalLight: '#f9f0ff',
    petalMain: '#b37feb',
    petalDeep: '#722ed1',
    coreColor: '#ffd6e7',
    glow: 'rgba(179, 127, 235, 0.72)',
    petals: 4,
  },
  coral: {
    color: 'coral',
    name: '珊瑚绯花',
    petalLight: '#fff1f0',
    petalMain: '#ff7875',
    petalDeep: '#cf1322',
    coreColor: '#ffd666',
    glow: 'rgba(255, 120, 117, 0.72)',
    petals: 5,
  },
  emerald: {
    color: 'emerald',
    name: '翠羽灵叶',
    petalLight: '#f6ffed',
    petalMain: '#73d13d',
    petalDeep: '#237804',
    coreColor: '#d9f7be',
    glow: 'rgba(115, 209, 61, 0.7)',
    petals: 4,
  },
};

export type AssetStatus = 'idle' | 'loading' | 'loaded' | 'fallback';

interface AssetEntry {
  status: AssetStatus;
  image?: HTMLImageElement;
}

class AssetManager {
  private cache = new Map<string, AssetEntry>();

  getStatus(path: string): AssetStatus {
    return this.cache.get(path)?.status ?? 'idle';
  }

  getImage(path: string): HTMLImageElement | null {
    const entry = this.cache.get(path);
    if (entry?.status === 'loaded' && entry.image) {
      return entry.image;
    }
    if (!entry) {
      void this.preload(path);
    }
    return null;
  }

  preload(path: string): Promise<AssetStatus> {
    const existing = this.cache.get(path);
    if (existing && (existing.status === 'loaded' || existing.status === 'fallback')) {
      return Promise.resolve(existing.status);
    }
    this.cache.set(path, { status: 'loading' });

    return new Promise((resolve) => {
      if (typeof Image === 'undefined') {
        this.cache.set(path, { status: 'fallback' });
        resolve('fallback');
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0) {
          this.cache.set(path, { status: 'loaded', image: img });
          resolve('loaded');
        } else {
          this.cache.set(path, { status: 'fallback' });
          resolve('fallback');
        }
      };
      img.onerror = () => {
        this.cache.set(path, { status: 'fallback' });
        resolve('fallback');
      };
      img.src = path;
    });
  }

  async preloadCoreAssets(): Promise<void> {
    const paths = [
      ...Object.values(ASSETS_MANIFEST.tiles),
      ...Object.values(ASSETS_MANIFEST.specials),
      ...Object.values(ASSETS_MANIFEST.obstacles),
      ...Object.values(ASSETS_MANIFEST.ui.props),
      ...Object.values(ASSETS_MANIFEST.ui.fox),
    ];
    await Promise.all(paths.map((p) => this.preload(p)));
  }
}

export const assetManager = new AssetManager();

/**
 * Canvas 2D 优雅降级渲染器：绘制发光花朵棋子（若有外部图片则优先绘制外部图片）
 */
export function drawTileOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: TileColor,
  special: SpecialType = 'none',
  timeMs = 0
): void {
  ctx.save();
  ctx.translate(cx, cy);

  if (special === 'butterfly') {
    const butterflyImg = assetManager.getImage(ASSETS_MANIFEST.specials.butterfly);
    if (butterflyImg) {
      ctx.drawImage(butterflyImg, -radius, -radius, radius * 2, radius * 2);
    } else {
      drawFallbackButterfly(ctx, radius, timeMs);
    }
    ctx.restore();
    return;
  }

  const customImg = assetManager.getImage(ASSETS_MANIFEST.tiles[color]);
  if (customImg) {
    ctx.drawImage(customImg, -radius, -radius, radius * 2, radius * 2);
  } else {
    drawFallbackFlower(ctx, radius, color, timeMs);
  }

  if (special === 'line_h' || special === 'line_v') {
    const overlayImg = assetManager.getImage(ASSETS_MANIFEST.specials[special]);
    if (overlayImg) {
      ctx.drawImage(overlayImg, -radius * 1.05, -radius * 1.05, radius * 2.1, radius * 2.1);
    } else {
      drawFallbackLineOverlay(ctx, radius, special === 'line_h', timeMs);
    }
  } else if (special === 'bomb') {
    const bombImg = assetManager.getImage(ASSETS_MANIFEST.specials.bomb);
    if (bombImg) {
      ctx.drawImage(bombImg, -radius * 1.08, -radius * 1.08, radius * 2.16, radius * 2.16);
    } else {
      drawFallbackBombOverlay(ctx, radius, timeMs);
    }
  }

  ctx.restore();
}

function drawFallbackFlower(
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: TileColor,
  timeMs: number
): void {
  const meta = TILE_VISUAL_META[color];
  const breathe = 1 + Math.sin(timeMs * 0.003) * 0.02;
  ctx.scale(breathe, breathe);

  // Soft outer luminescence
  const halo = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.08);
  halo.addColorStop(0, meta.glow);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 2);
  ctx.fill();

  // Petals (distinct shapes per flower color for instant readability)
  const petalCount = meta.petals;
  for (let i = 0; i < petalCount; i++) {
    ctx.save();
    const angle = (i * Math.PI * 2) / petalCount - Math.PI / 2;
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, -radius * 0.92, 0, -radius * 0.1);
    grad.addColorStop(0, meta.petalLight);
    grad.addColorStop(0.45, meta.petalMain);
    grad.addColorStop(1, meta.petalDeep);
    ctx.fillStyle = grad;

    ctx.beginPath();
    if (color === 'emerald') {
      // Heart-clover spirit leaf
      ctx.moveTo(0, -radius * 0.12);
      ctx.bezierCurveTo(
        -radius * 0.56,
        -radius * 0.42,
        -radius * 0.36,
        -radius * 0.98,
        0,
        -radius * 0.78
      );
      ctx.bezierCurveTo(
        radius * 0.36,
        -radius * 0.98,
        radius * 0.56,
        -radius * 0.42,
        0,
        -radius * 0.12
      );
    } else if (color === 'cyan') {
      // Pointed lotus petal
      ctx.moveTo(0, -radius * 0.1);
      ctx.quadraticCurveTo(-radius * 0.36, -radius * 0.48, 0, -radius * 0.94);
      ctx.quadraticCurveTo(radius * 0.36, -radius * 0.48, 0, -radius * 0.1);
    } else if (color === 'violet') {
      // Starry diamond-round petal
      ctx.moveTo(0, -radius * 0.1);
      ctx.bezierCurveTo(
        -radius * 0.48,
        -radius * 0.36,
        -radius * 0.44,
        -radius * 0.86,
        0,
        -radius * 0.94
      );
      ctx.bezierCurveTo(
        radius * 0.44,
        -radius * 0.86,
        radius * 0.48,
        -radius * 0.36,
        0,
        -radius * 0.1
      );
    } else if (color === 'sun') {
      // Radiant sun-petal
      ctx.ellipse(0, -radius * 0.52, radius * 0.22, radius * 0.4, 0, 0, Math.PI * 2);
    } else {
      // Lush sakura / camellia petal
      ctx.ellipse(0, -radius * 0.48, radius * 0.31, radius * 0.42, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // Subtle translucent rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.lineWidth = Math.max(1, radius * 0.04);
    ctx.stroke();
    ctx.restore();
  }

  // Secondary inner petals for violet/coral richness
  if (color === 'violet' || color === 'coral') {
    ctx.save();
    ctx.rotate(Math.PI / petalCount);
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < petalCount; i++) {
      ctx.rotate((Math.PI * 2) / petalCount);
      ctx.fillStyle = meta.petalLight;
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.35, radius * 0.16, radius * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Luminous flower core
  const coreGrad = ctx.createRadialGradient(0, -radius * 0.04, 0, 0, 0, radius * 0.3);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.55, meta.coreColor);
  coreGrad.addColorStop(1, meta.petalDeep);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Tiny specular sparkle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(-radius * 0.09, -radius * 0.09, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawFallbackLineOverlay(
  ctx: CanvasRenderingContext2D,
  radius: number,
  isHorizontal: boolean,
  timeMs: number
): void {
  ctx.save();
  // Rotating starlight ring
  ctx.save();
  ctx.rotate(timeMs * 0.0022);
  ctx.strokeStyle = 'rgba(255, 240, 180, 0.85)';
  ctx.lineWidth = Math.max(1.5, radius * 0.07);
  ctx.setLineDash([radius * 0.35, radius * 0.22]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Directional glowing ribbon & arrows
  if (!isHorizontal) {
    ctx.rotate(Math.PI / 2);
  }
  const beamGrad = ctx.createLinearGradient(-radius, 0, radius, 0);
  beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  beamGrad.addColorStop(0.5, 'rgba(255, 214, 102, 0.35)');
  beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

  ctx.fillStyle = beamGrad;
  ctx.fillRect(-radius * 0.95, -radius * 0.13, radius * 1.9, radius * 0.26);

  // Left & right starlight arrowheads
  ctx.fillStyle = '#fffbe6';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * radius * 1.04, 0);
    ctx.lineTo(dir * radius * 0.68, -radius * 0.28);
    ctx.lineTo(dir * radius * 0.68, radius * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFallbackBombOverlay(
  ctx: CanvasRenderingContext2D,
  radius: number,
  timeMs: number
): void {
  ctx.save();
  const pulse = 0.92 + Math.sin(timeMs * 0.007) * 0.12;
  ctx.scale(pulse, pulse);

  const aura = ctx.createRadialGradient(0, 0, radius * 0.25, 0, 0, radius * 1.12);
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  aura.addColorStop(0.65, 'rgba(255, 214, 102, 0.45)');
  aura.addColorStop(1, 'rgba(255, 133, 192, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.12, 0, Math.PI * 2);
  ctx.fill();

  // 4-point star flare
  ctx.fillStyle = 'rgba(255, 251, 230, 0.92)';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? radius * 0.96 : radius * 0.22;
    const a = (i * Math.PI) / 4;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffd666';
  ctx.lineWidth = Math.max(1.5, radius * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFallbackButterfly(
  ctx: CanvasRenderingContext2D,
  radius: number,
  timeMs: number
): void {
  const flap = 0.86 + Math.sin(timeMs * 0.01) * 0.14;

  // Prismatic rainbow nebula aura
  const aura = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.1);
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  aura.addColorStop(0.45, 'rgba(179, 127, 235, 0.55)');
  aura.addColorStop(0.75, 'rgba(92, 219, 211, 0.35)');
  aura.addColorStop(1, 'rgba(255, 133, 192, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(flap, 1);

  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);

    // Upper iridescent wing
    const upperGrad = ctx.createLinearGradient(0, -radius * 0.8, radius * 0.95, 0);
    upperGrad.addColorStop(0, '#fff0f6');
    upperGrad.addColorStop(0.35, '#ff85c0');
    upperGrad.addColorStop(0.7, '#b37feb');
    upperGrad.addColorStop(1, '#5cdbd3');
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.08);
    ctx.bezierCurveTo(
      radius * 0.45,
      -radius * 1.05,
      radius * 1.12,
      -radius * 0.58,
      radius * 0.84,
      radius * 0.04
    );
    ctx.bezierCurveTo(radius * 0.46, radius * 0.18, radius * 0.14, radius * 0.08, 0, -radius * 0.08);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = Math.max(1, radius * 0.05);
    ctx.stroke();

    // Lower wing
    const lowerGrad = ctx.createLinearGradient(0, 0, radius * 0.72, radius * 0.82);
    lowerGrad.addColorStop(0, '#e6fffb');
    lowerGrad.addColorStop(0.5, '#5cdbd3');
    lowerGrad.addColorStop(1, '#ffd666');
    ctx.fillStyle = lowerGrad;
    ctx.beginPath();
    ctx.moveTo(0, radius * 0.06);
    ctx.bezierCurveTo(
      radius * 0.72,
      radius * 0.12,
      radius * 0.76,
      radius * 0.82,
      radius * 0.24,
      radius * 0.78
    );
    ctx.bezierCurveTo(radius * 0.08, radius * 0.65, 0, radius * 0.32, 0, radius * 0.06);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();

  // Crystal butterfly body
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.11, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Canvas 2D 优雅降级渲染器：绘制障碍物与收集物
 */
export function drawObstacleOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  obstacle: ObstacleType
): void {
  ctx.save();
  ctx.translate(cx, cy);
  const half = size * 0.48;

  const customImg = assetManager.getImage(ASSETS_MANIFEST.obstacles[obstacle]);
  if (customImg) {
    ctx.drawImage(customImg, -half, -half, half * 2, half * 2);
    ctx.restore();
    return;
  }

  if (obstacle === 'ice_1' || obstacle === 'ice_2') {
    const isThick = obstacle === 'ice_2';
    const grad = ctx.createLinearGradient(-half, -half, half, half);
    grad.addColorStop(0, isThick ? 'rgba(210, 246, 255, 0.72)' : 'rgba(200, 240, 255, 0.42)');
    grad.addColorStop(0.5, isThick ? 'rgba(130, 218, 255, 0.56)' : 'rgba(130, 218, 255, 0.24)');
    grad.addColorStop(1, isThick ? 'rgba(235, 252, 255, 0.75)' : 'rgba(220, 246, 255, 0.45)');

    ctx.fillStyle = grad;
    roundRectPath(ctx, -half, -half, half * 2, half * 2, size * 0.16);
    ctx.fill();
    ctx.strokeStyle = isThick ? 'rgba(255, 255, 255, 0.92)' : 'rgba(190, 242, 255, 0.72)';
    ctx.lineWidth = isThick ? 2.4 : 1.4;
    ctx.stroke();

    // Crystal shine lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-half * 0.65, -half * 0.25);
    ctx.lineTo(-half * 0.25, -half * 0.65);
    if (isThick) {
      ctx.moveTo(half * 0.2, half * 0.62);
      ctx.lineTo(half * 0.62, half * 0.2);
    }
    ctx.stroke();
  } else if (obstacle === 'vine') {
    ctx.strokeStyle = '#73d13d';
    ctx.lineWidth = Math.max(2.5, size * 0.08);
    ctx.lineCap = 'round';
    // Intertwining moonlight vines
    ctx.beginPath();
    ctx.moveTo(-half * 0.85, -half * 0.5);
    ctx.bezierCurveTo(-half * 0.2, -half * 0.9, half * 0.2, half * 0.9, half * 0.85, half * 0.5);
    ctx.moveTo(-half * 0.85, half * 0.55);
    ctx.bezierCurveTo(-half * 0.15, half * 0.15, half * 0.15, -half * 0.15, half * 0.85, -half * 0.55);
    ctx.stroke();

    // Small glowing leaf buds
    ctx.fillStyle = '#d9f7be';
    for (const [lx, ly] of [
      [-half * 0.45, -half * 0.55],
      [half * 0.45, half * 0.45],
      [0, 0],
    ]) {
      ctx.beginPath();
      ctx.ellipse(lx, ly, size * 0.09, size * 0.05, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (obstacle === 'drop_item') {
    // Glowing Star-Dew Bottle (星露瓶)
    const r = size * 0.34;
    const bottleGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.15, r * 0.1, 0, r * 0.1, r * 1.15);
    bottleGrad.addColorStop(0, '#fffbe6');
    bottleGrad.addColorStop(0.5, '#5cdbd3');
    bottleGrad.addColorStop(1, '#3b82f6');

    ctx.fillStyle = bottleGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.18, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Bottle neck & cork
    ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.fillRect(-r * 0.34, -r * 1.05, r * 0.68, r * 0.42);
    ctx.fillStyle = '#ffd666';
    ctx.fillRect(-r * 0.28, -r * 1.24, r * 0.56, r * 0.24);

    // Floating star inside bottle
    ctx.fillStyle = '#fffbe6';
    ctx.beginPath();
    ctx.arc(0, r * 0.18, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (obstacle === 'honey') {
    // Spreading Star-Honey (蔓延星蜜)
    const honeyGrad = ctx.createRadialGradient(-half * 0.2, -half * 0.2, size * 0.06, 0, 0, half);
    honeyGrad.addColorStop(0, 'rgba(255, 245, 165, 0.92)');
    honeyGrad.addColorStop(0.55, 'rgba(250, 173, 20, 0.78)');
    honeyGrad.addColorStop(1, 'rgba(212, 107, 8, 0.85)');

    ctx.fillStyle = honeyGrad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      const x = Math.cos(a) * half * 0.94;
      const y = Math.sin(a) * half * 0.94;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 251, 230, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Dew highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-half * 0.26, -half * 0.26, half * 0.22, half * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
