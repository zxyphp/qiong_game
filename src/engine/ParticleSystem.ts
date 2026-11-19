export interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'petal' | 'stardust';
}

/**
 * 花瓣 + 星尘双粒子系统（Canvas 2D 高分屏渲染）
 * 将在 Phase 2 扩展消除飞溅、光束与极光扫屏特效。
 */
export class ParticleSystem {
  public particles: StarParticle[] = [];

  clear(): void {
    this.particles.length = 0;
  }
}
