export interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'petal' | 'stardust';
}

interface BeamEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

interface ShockwaveEffect {
  x: number;
  y: number;
  maxRadius: number;
  color: string;
  delay: number;
  life: number;
  maxLife: number;
}

interface MeteorEffect {
  fromX: number;
  fromY: number;
  ctrlX: number;
  ctrlY: number;
  toX: number;
  toY: number;
  color: string;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
}

interface AuroraEffect {
  width: number;
  height: number;
  life: number;
  maxLife: number;
}

interface VortexEffect {
  cx: number;
  cy: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface ScorePop {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public particles: StarParticle[] = [];
  private beams: BeamEffect[] = [];
  private shockwaves: ShockwaveEffect[] = [];
  private meteors: MeteorEffect[] = [];
  private auroras: AuroraEffect[] = [];
  private vortexes: VortexEffect[] = [];
  private scorePops: ScorePop[] = [];

  clear(): void {
    this.particles.length = 0;
    this.beams.length = 0;
    this.shockwaves.length = 0;
    this.meteors.length = 0;
    this.auroras.length = 0;
    this.vortexes.length = 0;
    this.scorePops.length = 0;
  }

  /** 花瓣 + 星尘双粒子飞溅 */
  emitClearBurst(x: number, y: number, mainColor: string, intensity = 1): void {
    const petalCount = Math.round(7 * intensity);
    const dustCount = Math.round(9 * intensity);

    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount + (Math.random() - 0.5) * 0.5;
      const speed = (65 + Math.random() * 110) * Math.min(1.5, intensity);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        size: 4.5 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 9,
        alpha: 1,
        color: mainColor,
        life: 0,
        maxLife: 460 + Math.random() * 240,
        kind: 'petal',
      });
    }

    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (35 + Math.random() * 130) * Math.min(1.6, intensity);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        size: 2.2 + Math.random() * 3.2,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 6,
        alpha: 1,
        color: i % 2 === 0 ? '#fffbe6' : mainColor,
        life: 0,
        maxLife: 380 + Math.random() * 280,
        kind: 'stardust',
      });
    }
  }

  emitBeam(x1: number, y1: number, x2: number, y2: number, color: string, width = 18): void {
    this.beams.push({
      x1,
      y1,
      x2,
      y2,
      color,
      width,
      life: 0,
      maxLife: 340,
    });
  }

  emitShockwave(x: number, y: number, maxRadius: number, color: string, delay = 0): void {
    this.shockwaves.push({
      x,
      y,
      maxRadius,
      color,
      delay,
      life: 0,
      maxLife: 420,
    });
  }

  emitMeteor(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    durationMs = 300
  ): void {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const perpScale = (Math.random() > 0.5 ? 1 : -1) * (0.22 + Math.random() * 0.18);
    this.meteors.push({
      fromX,
      fromY,
      ctrlX: midX - dy * perpScale,
      ctrlY: midY + dx * perpScale,
      toX,
      toY,
      color,
      life: 0,
      maxLife: durationMs,
      trail: [],
    });
  }

  emitAurora(width: number, height: number): void {
    this.auroras.push({
      width,
      height,
      life: 0,
      maxLife: 820,
    });
  }

  emitShuffleVortex(cx: number, cy: number, radius: number): void {
    this.vortexes.push({
      cx,
      cy,
      radius,
      life: 0,
      maxLife: 760,
    });
  }

  emitScorePop(x: number, y: number, text: string, color = '#fffbe6'): void {
    this.scorePops.push({
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 620,
    });
  }

  update(dtMs: number): void {
    const dtSec = dtMs / 1000;

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtMs;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += (p.kind === 'petal' ? 190 : 85) * dtSec;
      p.vx *= 0.985;
      p.rotation += p.vRot * dtSec;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    // Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life += dtMs;
      if (this.beams[i].life >= this.beams[i].maxLife) {
        this.beams.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      if (sw.delay > 0) {
        sw.delay -= dtMs;
        continue;
      }
      sw.life += dtMs;
      if (sw.life >= sw.maxLife) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.life += dtMs;
      const t = Math.min(1, m.life / m.maxLife);
      const omt = 1 - t;
      const x = omt * omt * m.fromX + 2 * omt * t * m.ctrlX + t * t * m.toX;
      const y = omt * omt * m.fromY + 2 * omt * t * m.ctrlY + t * t * m.toY;
      m.trail.push({ x, y });
      if (m.trail.length > 10) m.trail.shift();

      if (Math.random() < 0.6) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          size: 2 + Math.random() * 2,
          rotation: 0,
          vRot: 2,
          alpha: 0.9,
          color: m.color,
          life: 0,
          maxLife: 240,
          kind: 'stardust',
        });
      }

      if (m.life >= m.maxLife) {
        this.emitClearBurst(m.toX, m.toY, m.color, 0.7);
        this.meteors.splice(i, 1);
      }
    }

    // Auroras
    for (let i = this.auroras.length - 1; i >= 0; i--) {
      this.auroras[i].life += dtMs;
      if (this.auroras[i].life >= this.auroras[i].maxLife) {
        this.auroras.splice(i, 1);
      }
    }

    // Vortexes
    for (let i = this.vortexes.length - 1; i >= 0; i--) {
      this.vortexes[i].life += dtMs;
      if (this.vortexes[i].life >= this.vortexes[i].maxLife) {
        this.vortexes.splice(i, 1);
      }
    }

    // Score pops
    for (let i = this.scorePops.length - 1; i >= 0; i--) {
      const sp = this.scorePops[i];
      sp.life += dtMs;
      sp.y -= 36 * dtSec;
      if (sp.life >= sp.maxLife) {
        this.scorePops.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Aurora sweep (full-screen butterfly + butterfly)
    for (const au of this.auroras) {
      const t = au.life / au.maxLife;
      const sweepX = -au.width * 0.4 + t * au.width * 1.8;
      const alpha = Math.sin(t * Math.PI) * 0.72;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, au.height * 0.5);
      grad.addColorStop(0, 'rgba(92, 219, 211, 0)');
      grad.addColorStop(0.28, 'rgba(92, 219, 211, 0.75)');
      grad.addColorStop(0.5, 'rgba(255, 251, 230, 0.95)');
      grad.addColorStop(0.72, 'rgba(255, 133, 192, 0.75)');
      grad.addColorStop(1, 'rgba(179, 127, 235, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, au.width, au.height);
      ctx.restore();
    }

    // 2. Shuffle Vortex
    for (const v of this.vortexes) {
      const t = v.life / v.maxLife;
      const alpha = Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(v.cx, v.cy);
      ctx.rotate(t * Math.PI * 3.5);
      ctx.globalAlpha = alpha * 0.8;
      for (let ring = 0; ring < 3; ring++) {
        const r = v.radius * (0.35 + ring * 0.25) * (0.6 + 0.4 * Math.sin(t * Math.PI));
        ctx.strokeStyle = ring === 0 ? '#ffd666' : ring === 1 ? '#ff85c0' : '#5cdbd3';
        ctx.lineWidth = 3 - ring * 0.6;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Beams
    for (const b of this.beams) {
      const t = b.life / b.maxLife;
      const alpha = Math.max(0, 1 - t);
      const w = b.width * (1.15 - t * 0.55);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.globalAlpha = alpha * 0.65;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = w * 1.9;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, w * 0.5);
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Shockwaves
    for (const sw of this.shockwaves) {
      if (sw.delay > 0) continue;
      const t = sw.life / sw.maxLife;
      const r = sw.maxRadius * (0.15 + 0.85 * (1 - Math.pow(1 - t, 3)));
      const alpha = Math.max(0, 1 - t);

      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(2, 10 * (1 - t));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = sw.color;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Meteors
    for (const m of this.meteors) {
      if (m.trail.length < 2) continue;
      ctx.save();
      for (let i = 1; i < m.trail.length; i++) {
        const ratio = i / m.trail.length;
        ctx.strokeStyle = m.color;
        ctx.globalAlpha = ratio * 0.85;
        ctx.lineWidth = ratio * 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.trail[i - 1].x, m.trail[i - 1].y);
        ctx.lineTo(m.trail[i].x, m.trail[i].y);
        ctx.stroke();
      }
      const head = m.trail[m.trail.length - 1];
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Dual Particles (Petal + Stardust)
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.kind === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.54, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 4-point star sparkle
        ctx.beginPath();
        const outer = p.size * 1.4;
        const inner = p.size * 0.38;
        for (let k = 0; k < 8; k++) {
          const r = k % 2 === 0 ? outer : inner;
          const a = (k * Math.PI) / 4;
          if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Floating Score Pops
    for (const sp of this.scorePops) {
      const t = sp.life / sp.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(t, 1.6));
      ctx.font = 'bold 14px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = sp.color;
      ctx.shadowColor = 'rgba(255, 133, 192, 0.7)';
      ctx.shadowBlur = 8;
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
