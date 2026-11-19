import { ASSETS_MANIFEST } from '../config/assetsManifest';
import { UserSettings } from '../types/game';

/** C 大调五声音阶（C5 -> A6），连击逐级升调 */
const PENTATONIC_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.0, // A6
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private bgmEnabled = true;
  private vibrateEnabled = true;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmFailed = false;

  syncSettings(settings: UserSettings): void {
    this.sfxEnabled = settings.sfxEnabled;
    this.bgmEnabled = settings.bgmEnabled;
    this.vibrateEnabled = settings.vibrateEnabled;

    if (this.bgmAudio) {
      if (this.bgmEnabled) {
        void this.bgmAudio.play().catch(() => {});
      } else {
        this.bgmAudio.pause();
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tryStartCustomBgm(): void {
    if (!this.bgmEnabled || this.bgmFailed || this.bgmAudio) return;
    if (typeof Audio === 'undefined') return;
    const audio = new Audio(ASSETS_MANIFEST.audio.bgmGame);
    audio.loop = true;
    audio.volume = 0.35;
    audio.onerror = () => {
      this.bgmFailed = true;
      this.bgmAudio = null;
    };
    this.bgmAudio = audio;
    void audio.play().catch(() => {
      // Autoplay blocked or file absent; ignore silently
    });
  }

  vibrate(pattern: number | number[]): void {
    if (!this.vibrateEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported devices
    }
  }

  /** 柔和点击音 */
  playSelect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** 轻盈交换音 */
  playSwap(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(590, now + 0.09);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** 无效交换弹性回弹音 */
  playInvalidSwap(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 280 : 210, start);
      osc.frequency.exponentialRampToValueAtTime(160, start + 0.07);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.085);
    }
    this.vibrate(14);
  }

  /** 连击消除：C 大调五声音阶逐级升调叮咚声 */
  playMatch(combo: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const idx = Math.min(Math.max(0, combo - 1), PENTATONIC_FREQS.length - 1);
    const baseFreq = PENTATONIC_FREQS[idx];

    // Primary crystal bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.14, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Shimmering fifth / octave harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.025);
    gain2.gain.setValueAtTime(0.001, now + 0.025);
    gain2.gain.linearRampToValueAtTime(0.065, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.025);
    osc2.stop(now + 0.32);

    if (combo >= 2) {
      this.vibrate(12);
    }
  }

  /** 生成特效时的流光琶音 */
  playSpecialCreate(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
    this.vibrate(18);
  }

  /** 星光爆发和弦（直线/爆炸/巨型十字/极光扫屏） */
  playSpecialBurst(kind: 'line' | 'bomb' | 'mega' | 'aurora'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord =
      kind === 'aurora'
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
        : kind === 'mega'
          ? [392.0, 523.25, 659.25, 987.77, 1318.51]
          : kind === 'bomb'
            ? [329.63, 440.0, 659.25, 880.0]
            : [523.25, 783.99, 1046.5];

    chord.forEach((freq, i) => {
      const t = now + i * (kind === 'aurora' ? 0.045 : 0.02);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, t + 0.42);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'aurora' ? 0.72 : 0.46));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + (kind === 'aurora' ? 0.75 : 0.48));
    });

    if (kind === 'aurora') this.vibrate([25, 35, 45]);
    else if (kind === 'mega') this.vibrate([22, 25, 28]);
    else if (kind === 'bomb') this.vibrate(24);
    else this.vibrate(16);
  }

  /** 清脆破冰声（Phase 3 障碍物直接复用） */
  playIceCrack(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1950, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.07);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  /** 死局自动洗牌竖琴滑音 */
  playShuffle(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    PENTATONIC_FREQS.slice(0, 7).forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  /** 过关庆典和弦 */
  playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1174.66, 1567.98];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.58);
    });
    this.vibrate([20, 40, 30, 40, 40]);
  }
}

export const audioEngine = new AudioEngine();
