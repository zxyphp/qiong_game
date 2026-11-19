import { drawTileOnCanvas, TILE_VISUAL_META } from '../config/assetsManifest';
import { LevelConfig, LevelGoal, SpecialType, TileColor } from '../types/game';
import { audioEngine } from './AudioEngine';
import { ComboResolution, ComboResolver } from './ComboResolver';
import { GridCoord, Matcher, MatchGroup, SwapContext } from './Matcher';
import { ParticleSystem } from './ParticleSystem';

export type BoardPhase =
  | 'IDLE'
  | 'SWAPPING'
  | 'REVERTING'
  | 'RESOLVING'
  | 'METEOR_TRANSFORM'
  | 'FALLING'
  | 'SHUFFLING'
  | 'VICTORY'
  | 'OUT_OF_MOVES';

export interface TileEntity {
  id: number;
  row: number;
  col: number;
  color: TileColor;
  special: SpecialType;
  /** Visual coordinates in grid-cell units (col, row) for 60fps interpolation */
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
  spawnBounce: number;
}

export interface GoalProgress {
  goal: LevelGoal;
  current: number;
}

export interface BoardHudSnapshot {
  phase: BoardPhase;
  score: number;
  movesLeft: number;
  stars: number;
  combo: number;
  goals: GoalProgress[];
}

export interface BoardCallbacks {
  onSnapshot?: (snapshot: BoardHudSnapshot) => void;
  onCombo?: (combo: number, specialLabel?: string) => void;
  onShuffle?: () => void;
}

interface SwapAnimState {
  a: GridCoord;
  b: GridCoord;
  elapsed: number;
  duration: number;
}

interface MeteorTransformStage {
  elapsed: number;
  flightDuration: number;
  transformed: boolean;
  detonateDelay: number;
  targets: { coord: GridCoord; toSpecial: 'line_h' | 'line_v' | 'bomb' }[];
}

interface BoardLayout {
  cellSize: number;
  originX: number;
  originY: number;
  boardW: number;
  boardH: number;
}

const SWAP_DURATION_MS = 145;
const REVERT_DURATION_MS = 170;
const RESOLVE_POP_MS = 195;
const SHUFFLE_DURATION_MS = 740;
const HINT_DELAY_MS = 4800;

export class BoardStateMachine {
  public readonly level: LevelConfig;
  public readonly rows: number;
  public readonly cols: number;
  public readonly mask: number[][];

  public phase: BoardPhase = 'IDLE';
  public grid: (TileEntity | null)[][] = [];
  public selected: GridCoord | null = null;
  public score = 0;
  public movesLeft: number;
  public combo = 0;

  private nextTileId = 1;
  private matcher = new Matcher();
  private comboResolver = new ComboResolver();
  private particles = new ParticleSystem();
  private callbacks: BoardCallbacks;
  private goalProgress: GoalProgress[];

  private swapAnim: SwapAnimState | null = null;
  private lastSwapCtx: SwapContext | undefined;
  private pendingResolveTimer = 0;
  private meteorStage: MeteorTransformStage | null = null;
  private shuffleTimer = 0;
  private shuffleApplied = false;

  private idleTimer = 0;
  private hintPair: { a: GridCoord; b: GridCoord } | null = null;

  private shakeTimer = 0;
  private shakeMagnitude = 0;

  private layout: BoardLayout = {
    cellSize: 44,
    originX: 0,
    originY: 0,
    boardW: 0,
    boardH: 0,
  };

  constructor(level: LevelConfig, callbacks: BoardCallbacks = {}) {
    this.level = level;
    this.rows = level.rows;
    this.cols = level.cols;
    this.movesLeft = level.moves;
    this.callbacks = callbacks;

    this.mask =
      level.mask ??
      Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => 1));

    this.goalProgress = level.goals.map((goal) => ({
      goal,
      current: 0,
    }));

    this.initBoard();
    this.emitSnapshot();
  }

  private randomColor(exclude?: Set<TileColor>): TileColor {
    const pool = exclude
      ? this.level.colors.filter((c) => !exclude.has(c))
      : this.level.colors;
    const list = pool.length > 0 ? pool : this.level.colors;
    return list[Math.floor(Math.random() * list.length)];
  }

  private createTile(row: number, col: number, color: TileColor, special: SpecialType = 'none'): TileEntity {
    return {
      id: this.nextTileId++,
      row,
      col,
      color,
      special,
      vx: col,
      vy: row,
      scale: 1,
      alpha: 1,
      spawnBounce: 0,
    };
  }

  private initBoard(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.mask[r][c] !== 1) continue;
        const forbidden = new Set<TileColor>();
        if (
          c >= 2 &&
          this.grid[r][c - 1] &&
          this.grid[r][c - 2] &&
          this.grid[r][c - 1]!.color === this.grid[r][c - 2]!.color
        ) {
          forbidden.add(this.grid[r][c - 1]!.color);
        }
        if (
          r >= 2 &&
          this.grid[r - 1][c] &&
          this.grid[r - 2][c] &&
          this.grid[r - 1][c]!.color === this.grid[r - 2][c]!.color
        ) {
          forbidden.add(this.grid[r - 1][c]!.color);
        }
        this.grid[r][c] = this.createTile(r, c, this.randomColor(forbidden));
      }
    }

    if (!this.matcher.findHintMove(this.grid, this.mask)) {
      this.shuffleColorsDeterministically();
    }
  }

  /** 将像素坐标转为棋盘格坐标 */
  pixelToCell(px: number, py: number): GridCoord | null {
    const { cellSize, originX, originY } = this.layout;
    if (cellSize <= 0) return null;
    const col = Math.floor((px - originX) / cellSize);
    const row = Math.floor((py - originY) / cellSize);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    if (this.mask[row][col] !== 1) return null;
    return { row, col };
  }

  private cellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: this.layout.originX + (col + 0.5) * this.layout.cellSize,
      y: this.layout.originY + (row + 0.5) * this.layout.cellSize,
    };
  }

  /** 点选交互：支持先点选再点相邻格交换 */
  handleTap(coord: GridCoord): void {
    if (this.phase !== 'IDLE') return;
    audioEngine.tryStartCustomBgm();
    this.idleTimer = 0;
    this.hintPair = null;

    if (!this.grid[coord.row]?.[coord.col]) return;

    if (!this.selected) {
      this.selected = coord;
      audioEngine.playSelect();
      return;
    }

    if (this.selected.row === coord.row && this.selected.col === coord.col) {
      this.selected = null;
      return;
    }

    const dr = Math.abs(this.selected.row - coord.row);
    const dc = Math.abs(this.selected.col - coord.col);
    if (dr + dc === 1) {
      const from = this.selected;
      this.selected = null;
      this.startSwap(from, coord);
    } else {
      this.selected = coord;
      audioEngine.playSelect();
    }
  }

  /** 滑动交互：手指划向相邻格立即触发交换 */
  handleSwipe(from: GridCoord, dRow: number, dCol: number): void {
    if (this.phase !== 'IDLE') return;
    audioEngine.tryStartCustomBgm();
    const to: GridCoord = { row: from.row + dRow, col: from.col + dCol };
    if (to.row < 0 || to.row >= this.rows || to.col < 0 || to.col >= this.cols) return;
    if (this.mask[to.row][to.col] !== 1) return;
    if (!this.grid[from.row]?.[from.col] || !this.grid[to.row]?.[to.col]) return;

    this.selected = null;
    this.idleTimer = 0;
    this.hintPair = null;
    this.startSwap(from, to);
  }

  /** 手动触发星光重排（可用于道具或测试） */
  triggerManualShuffle(): void {
    if (this.phase !== 'IDLE') return;
    this.startShuffle();
  }

  private startSwap(a: GridCoord, b: GridCoord): void {
    this.phase = 'SWAPPING';
    this.swapAnim = {
      a,
      b,
      elapsed: 0,
      duration: SWAP_DURATION_MS,
    };
    this.lastSwapCtx = {
      a,
      b,
      direction: a.row === b.row ? 'h' : 'v',
    };
    audioEngine.playSwap();
  }

  private swapTilesInGrid(a: GridCoord, b: GridCoord): void {
    const tA = this.grid[a.row][a.col];
    const tB = this.grid[b.row][b.col];
    this.grid[a.row][a.col] = tB;
    this.grid[b.row][b.col] = tA;
    if (tB) {
      tB.row = a.row;
      tB.col = a.col;
      tB.vx = a.col;
      tB.vy = a.row;
    }
    if (tA) {
      tA.row = b.row;
      tA.col = b.col;
      tA.vx = b.col;
      tA.vy = b.row;
    }
  }

  /** 主循环更新（由 requestAnimationFrame 驱动，dtMs 限幅防切后台跳跃） */
  update(rawDtMs: number): void {
    const dtMs = Math.min(rawDtMs, 48);

    this.particles.update(dtMs);

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dtMs);
    }

    // Update subtle spawn bounce on tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (!t) continue;
        if (t.spawnBounce > 0) {
          t.spawnBounce = Math.max(0, t.spawnBounce - dtMs / 240);
          t.scale = 1 + Math.sin(t.spawnBounce * Math.PI) * 0.24;
        } else if (this.phase !== 'RESOLVING' && this.phase !== 'SHUFFLING') {
          t.scale = 1;
        }
      }
    }

    switch (this.phase) {
      case 'IDLE':
        this.idleTimer += dtMs;
        if (this.idleTimer >= HINT_DELAY_MS && !this.hintPair) {
          this.hintPair = this.matcher.findHintMove(this.grid, this.mask);
        }
        break;

      case 'SWAPPING':
        this.updateSwapping(dtMs);
        break;

      case 'REVERTING':
        this.updateReverting(dtMs);
        break;

      case 'RESOLVING':
        this.pendingResolveTimer -= dtMs;
        if (this.pendingResolveTimer <= 0) {
          this.beginFalling();
        }
        break;

      case 'METEOR_TRANSFORM':
        this.updateMeteorTransform(dtMs);
        break;

      case 'FALLING':
        this.updateFalling(dtMs);
        break;

      case 'SHUFFLING':
        this.updateShuffling(dtMs);
        break;

      default:
        break;
    }
  }

  private updateSwapping(dtMs: number): void {
    const anim = this.swapAnim;
    if (!anim) return;
    anim.elapsed += dtMs;
    const t = Math.min(1, anim.elapsed / anim.duration);
    const ease = 1 - Math.pow(1 - t, 2);

    const tileA = this.grid[anim.a.row][anim.a.col];
    const tileB = this.grid[anim.b.row][anim.b.col];
    if (tileA) {
      tileA.vx = anim.a.col + (anim.b.col - anim.a.col) * ease;
      tileA.vy = anim.a.row + (anim.b.row - anim.a.row) * ease;
    }
    if (tileB) {
      tileB.vx = anim.b.col + (anim.a.col - anim.b.col) * ease;
      tileB.vy = anim.b.row + (anim.a.row - anim.b.row) * ease;
    }

    if (t < 1) return;

    // Commit swap in logical grid
    this.swapTilesInGrid(anim.a, anim.b);

    // 1. Check 6 dual-special / butterfly combos first
    const comboRes = this.comboResolver.resolvePair(this.grid, this.mask, anim.a, anim.b);
    if (comboRes) {
      this.movesLeft = Math.max(0, this.movesLeft - 1);
      this.combo = 1;
      this.swapAnim = null;
      this.executeComboResolution(comboRes);
      return;
    }

    // 2. Check normal 3+/4/5 matches
    const matches = this.matcher.findMatches(this.grid, this.mask, this.lastSwapCtx);
    if (matches.length > 0) {
      this.movesLeft = Math.max(0, this.movesLeft - 1);
      this.combo = 1;
      this.swapAnim = null;
      this.resolveMatches(matches);
      return;
    }

    // 3. Invalid swap -> springy revert without losing a move
    this.swapTilesInGrid(anim.a, anim.b);
    this.phase = 'REVERTING';
    this.swapAnim = {
      a: anim.a,
      b: anim.b,
      elapsed: 0,
      duration: REVERT_DURATION_MS,
    };
    audioEngine.playInvalidSwap();
  }

  private updateReverting(dtMs: number): void {
    const anim = this.swapAnim;
    if (!anim) return;
    anim.elapsed += dtMs;
    const t = Math.min(1, anim.elapsed / anim.duration);
    // Elastic ease-out bounce back from swapped position to original
    const remaining = Math.pow(1 - t, 2) * Math.cos(t * Math.PI * 0.5);

    const tileA = this.grid[anim.a.row][anim.a.col];
    const tileB = this.grid[anim.b.row][anim.b.col];
    if (tileA) {
      tileA.vx = anim.a.col + (anim.b.col - anim.a.col) * remaining;
      tileA.vy = anim.a.row + (anim.b.row - anim.a.row) * remaining;
    }
    if (tileB) {
      tileB.vx = anim.b.col + (anim.a.col - anim.b.col) * remaining;
      tileB.vy = anim.b.row + (anim.a.row - anim.b.row) * remaining;
    }

    if (t >= 1) {
      if (tileA) {
        tileA.vx = anim.a.col;
        tileA.vy = anim.a.row;
      }
      if (tileB) {
        tileB.vx = anim.b.col;
        tileB.vy = anim.b.row;
      }
      this.swapAnim = null;
      this.phase = 'IDLE';
    }
  }

  private executeComboResolution(res: ComboResolution): void {
    audioEngine.playSpecialBurst(res.soundKind);

    if (res.shakeMs > 0) {
      this.triggerShake(res.shakeMs, res.soundKind === 'aurora' ? 7 : 5);
    }

    const comboLabelMap: Record<ComboResolution['kind'], string> = {
      line_line: '星流十字清屏 ✨',
      line_bomb: '巨型星光十字柱 🌟',
      bomb_bomb: '双重花瓣星爆 💥',
      butterfly_single: '琉璃蝶 · 同色绽放 🦋',
      butterfly_line: '琉璃蝶 · 星流连环风暴 🦋✨',
      butterfly_bomb: '琉璃蝶 · 星核连环爆发 🦋💥',
      butterfly_butterfly: '琼华极光 · 星海大爆发 🌌',
    };
    this.callbacks.onCombo?.(Math.max(2, this.combo + 1), comboLabelMap[res.kind]);

    // Special multi-stage flow for butterfly + line / bomb:
    // Stage 1: Emit shooting stars from butterfly to all same-color tiles
    // Stage 2: Convert them to line/bomb specials
    // Stage 3: Detonate all of them in a massive chain reaction!
    if (res.transformTargets && res.transformTargets.length > 0 && res.meteorOrigin) {
      const originPx = this.cellCenter(res.meteorOrigin.row, res.meteorOrigin.col);
      for (const target of res.transformTargets) {
        const destPx = this.cellCenter(target.coord.row, target.coord.col);
        const tile = this.grid[target.coord.row][target.coord.col];
        const colorHex = tile ? TILE_VISUAL_META[tile.color].petalMain : '#ffd666';
        this.particles.emitMeteor(originPx.x, originPx.y, destPx.x, destPx.y, colorHex, 300);
      }

      // Clear the two swapped tiles immediately
      for (const c of res.clearCells) {
        this.clearSingleTile(c.row, c.col, 1.3);
      }

      this.phase = 'METEOR_TRANSFORM';
      this.meteorStage = {
        elapsed: 0,
        flightDuration: 310,
        transformed: false,
        detonateDelay: 220,
        targets: res.transformTargets,
      };
      this.emitSnapshot();
      return;
    }

    // Immediate combos: line+line, line+bomb, bomb+bomb, butterfly+normal, butterfly+butterfly
    if (res.aurora) {
      this.particles.emitAurora(this.layout.boardW + this.layout.originX * 2, this.layout.boardH + this.layout.originY * 2);
    }

    if (res.meteorOrigin && res.meteorTargets) {
      const originPx = this.cellCenter(res.meteorOrigin.row, res.meteorOrigin.col);
      for (const dest of res.meteorTargets) {
        const destPx = this.cellCenter(dest.row, dest.col);
        const tile = this.grid[dest.row][dest.col];
        const colorHex = tile ? TILE_VISUAL_META[tile.color].petalMain : '#5cdbd3';
        this.particles.emitMeteor(originPx.x, originPx.y, destPx.x, destPx.y, colorHex, 240);
      }
    }

    this.emitBeamsAndShockwaves(res.beams, res.shockwaves);

    // Expand chain reactions if any cleared cell contains another special
    const chain = this.comboResolver.expandChainReactions(this.grid, this.mask, res.clearCells);
    this.emitBeamsAndShockwaves(chain.beams, chain.shockwaves);

    for (const cell of chain.allCells) {
      this.clearSingleTile(cell.row, cell.col, res.aurora ? 1.35 : 1.2);
    }

    this.phase = 'RESOLVING';
    this.pendingResolveTimer = res.aurora ? 440 : 280;
    this.emitSnapshot();
  }

  private updateMeteorTransform(dtMs: number): void {
    const stage = this.meteorStage;
    if (!stage) return;
    stage.elapsed += dtMs;

    if (!stage.transformed && stage.elapsed >= stage.flightDuration) {
      stage.transformed = true;
      audioEngine.playSpecialCreate();
      for (const item of stage.targets) {
        const tile = this.grid[item.coord.row][item.coord.col];
        if (tile) {
          tile.special = item.toSpecial;
          tile.spawnBounce = 1;
        }
      }
    }

    if (stage.transformed && stage.elapsed >= stage.flightDuration + stage.detonateDelay) {
      const targetCoords = stage.targets.map((t) => t.coord);
      const chain = this.comboResolver.expandChainReactions(this.grid, this.mask, targetCoords);
      this.emitBeamsAndShockwaves(chain.beams, chain.shockwaves);
      audioEngine.playSpecialBurst('mega');
      this.triggerShake(160, 6);

      for (const cell of chain.allCells) {
        this.clearSingleTile(cell.row, cell.col, 1.25);
      }

      this.meteorStage = null;
      this.phase = 'RESOLVING';
      this.pendingResolveTimer = 280;
      this.emitSnapshot();
    }
  }

  private resolveMatches(groups: MatchGroup[]): void {
    const clearSet = new Map<string, GridCoord>();
    const spawnPlan: { coord: GridCoord; color: TileColor; special: SpecialType }[] = [];

    for (const g of groups) {
      for (const cell of g.cells) {
        clearSet.set(`${cell.row},${cell.col}`, cell);
      }
      if (g.spawnSpecial !== 'none') {
        spawnPlan.push({
          coord: g.pivot,
          color: g.color,
          special: g.spawnSpecial,
        });
      }
    }

    // Expand chain reactions for any existing specials caught in the match
    const chain = this.comboResolver.expandChainReactions(
      this.grid,
      this.mask,
      Array.from(clearSet.values())
    );

    if (chain.beams.length > 0 || chain.shockwaves.length > 0) {
      this.emitBeamsAndShockwaves(chain.beams, chain.shockwaves);
      audioEngine.playSpecialBurst(chain.shockwaves.length > 0 ? 'bomb' : 'line');
      if (chain.triggeredSpecialCount >= 2) {
        this.triggerShake(130, 4.5);
      }
    }

    // Do not erase cells where a new special is about to spawn (unless they themselves were an old special)
    const spawnKeys = new Set(spawnPlan.map((s) => `${s.coord.row},${s.coord.col}`));

    for (const cell of chain.allCells) {
      const k = `${cell.row},${cell.col}`;
      if (spawnKeys.has(k)) continue;
      this.clearSingleTile(cell.row, cell.col, 1);
    }

    // Spawn newly formed specials at pivot cells
    for (const sp of spawnPlan) {
      const existing = this.grid[sp.coord.row][sp.coord.col];
      if (existing) {
        this.recordTileCleared(existing.color);
      }
      const created = this.createTile(sp.coord.row, sp.coord.col, sp.color, sp.special);
      created.spawnBounce = 1;
      this.grid[sp.coord.row][sp.coord.col] = created;
      const px = this.cellCenter(sp.coord.row, sp.coord.col);
      this.particles.emitClearBurst(px.x, px.y, '#fffbe6', 1.15);
    }

    audioEngine.playMatch(this.combo);
    if (spawnPlan.length > 0) {
      audioEngine.playSpecialCreate();
    }
    if (this.combo >= 2) {
      this.callbacks.onCombo?.(this.combo);
    }

    this.phase = 'RESOLVING';
    this.pendingResolveTimer = RESOLVE_POP_MS;
    this.emitSnapshot();
  }

  private clearSingleTile(row: number, col: number, particleIntensity = 1): void {
    const tile = this.grid[row]?.[col];
    if (!tile) return;

    const px = this.cellCenter(row, col);
    const meta = TILE_VISUAL_META[tile.color];
    this.particles.emitClearBurst(px.x, px.y, meta.petalMain, particleIntensity);

    const points = Math.round((30 + (this.combo - 1) * 15) * (tile.special !== 'none' ? 2 : 1));
    this.score += points;
    this.particles.emitScorePop(px.x, px.y - 6, `+${points}`, meta.petalLight);

    this.recordTileCleared(tile.color);
    this.grid[row][col] = null;
  }

  private recordTileCleared(color: TileColor): void {
    for (const gp of this.goalProgress) {
      if (gp.goal.type === 'tile' && (!gp.goal.color || gp.goal.color === color)) {
        gp.current = Math.min(gp.goal.target, gp.current + 1);
      } else if (gp.goal.type === 'score') {
        gp.current = Math.min(gp.goal.target, this.score);
      }
    }
  }

  private syncScoreGoals(): void {
    for (const gp of this.goalProgress) {
      if (gp.goal.type === 'score') {
        gp.current = Math.min(gp.goal.target, this.score);
      }
    }
  }

  private emitBeamsAndShockwaves(
    beams: ComboResolution['beams'],
    shockwaves: ComboResolution['shockwaves']
  ): void {
    const { originX, originY, boardW, boardH, cellSize } = this.layout;
    for (const b of beams) {
      const width = cellSize * 0.42 * (b.widthScale ?? 1);
      if (b.orientation === 'h') {
        const y = originY + (b.index + 0.5) * cellSize;
        this.particles.emitBeam(originX, y, originX + boardW, y, b.color, width);
      } else {
        const x = originX + (b.index + 0.5) * cellSize;
        this.particles.emitBeam(x, originY, x, originY + boardH, b.color, width);
      }
    }
    for (const sw of shockwaves) {
      const center = this.cellCenter(sw.row, sw.col);
      this.particles.emitShockwave(
        center.x,
        center.y,
        sw.radiusCells * cellSize,
        sw.color,
        sw.delayedMs ?? 0
      );
    }
  }

  private beginFalling(): void {
    let movedAny = false;

    for (let c = 0; c < this.cols; c++) {
      // Collect playable rows in this column from bottom to top
      const playableRows: number[] = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.mask[r][c] === 1) playableRows.push(r);
      }

      // Existing tiles in this column from bottom to top
      const existing: TileEntity[] = [];
      for (const r of playableRows) {
        const t = this.grid[r][c];
        if (t) existing.push(t);
        this.grid[r][c] = null;
      }

      let spawnOffset = 1;
      for (let i = 0; i < playableRows.length; i++) {
        const targetRow = playableRows[i];
        let tile: TileEntity;
        if (i < existing.length) {
          tile = existing[i];
          if (tile.row !== targetRow) {
            movedAny = true;
          }
          tile.row = targetRow;
          tile.col = c;
        } else {
          tile = this.createTile(targetRow, c, this.randomColor());
          tile.vy = -spawnOffset - 0.35;
          spawnOffset++;
          movedAny = true;
        }
        this.grid[targetRow][c] = tile;
      }
    }

    if (movedAny) {
      this.phase = 'FALLING';
    } else {
      this.afterBoardSettled();
    }
  }

  private updateFalling(dtMs: number): void {
    const fallSpeed = (dtMs / 1000) * 14.5; // cells per second
    let stillFalling = false;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (!t) continue;
        if (t.vy < t.row) {
          t.vy = Math.min(t.row, t.vy + fallSpeed);
          if (t.vy < t.row) {
            stillFalling = true;
          } else {
            t.spawnBounce = 0.45;
          }
        }
        t.vx = t.col;
      }
    }

    if (!stillFalling) {
      this.afterBoardSettled();
    }
  }

  private afterBoardSettled(): void {
    this.syncScoreGoals();
    this.lastSwapCtx = undefined;

    // Cascade check
    const cascadeMatches = this.matcher.findMatches(this.grid, this.mask);
    if (cascadeMatches.length > 0) {
      this.combo += 1;
      this.resolveMatches(cascadeMatches);
      return;
    }

    // Check victory (for Phase 2 levels whose goals are tile/score; obstacle goals arrive in Phase 3)
    const playableGoals = this.goalProgress.filter(
      (g) => g.goal.type === 'tile' || g.goal.type === 'score'
    );
    const allMet =
      playableGoals.length > 0
        ? playableGoals.every((g) => g.current >= g.goal.target)
        : this.score >= this.level.starThresholds[0];

    if (allMet) {
      this.phase = 'VICTORY';
      audioEngine.playVictory();
      this.emitSnapshot();
      return;
    }

    if (this.movesLeft <= 0) {
      this.phase = 'OUT_OF_MOVES';
      this.emitSnapshot();
      return;
    }

    // Deadlock check -> automatic starlight vortex shuffle!
    if (!this.matcher.findHintMove(this.grid, this.mask)) {
      this.startShuffle();
      return;
    }

    this.combo = 0;
    this.idleTimer = 0;
    this.phase = 'IDLE';
    this.emitSnapshot();
  }

  private startShuffle(): void {
    this.phase = 'SHUFFLING';
    this.shuffleTimer = 0;
    this.shuffleApplied = false;
    this.selected = null;
    this.hintPair = null;
    audioEngine.playShuffle();
    this.callbacks.onShuffle?.();
    this.particles.emitShuffleVortex(
      this.layout.originX + this.layout.boardW / 2,
      this.layout.originY + this.layout.boardH / 2,
      Math.min(this.layout.boardW, this.layout.boardH) * 0.44
    );
    this.emitSnapshot();
  }

  private updateShuffling(dtMs: number): void {
    this.shuffleTimer += dtMs;
    const t = Math.min(1, this.shuffleTimer / SHUFFLE_DURATION_MS);

    const midCol = (this.cols - 1) / 2;
    const midRow = (this.rows - 1) / 2;

    if (!this.shuffleApplied && t >= 0.5) {
      this.shuffleApplied = true;
      this.shuffleColorsDeterministically();
    }

    // Pull tiles gently toward center vortex then bloom back out
    const pull = Math.sin(t * Math.PI) * 0.42;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;
        tile.vx = c + (midCol - c) * pull;
        tile.vy = r + (midRow - r) * pull;
        tile.scale = 1 - pull * 0.38;
      }
    }

    if (t >= 1) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const tile = this.grid[r][c];
          if (!tile) continue;
          tile.vx = c;
          tile.vy = r;
          tile.scale = 1;
        }
      }
      this.phase = 'IDLE';
      this.idleTimer = 0;
      this.emitSnapshot();
    }
  }

  private shuffleColorsDeterministically(): void {
    const tiles: TileEntity[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t && t.special === 'none') {
          tiles.push(t);
        }
      }
    }

    // Attempt up to 24 clean shuffles (no immediate match, at least 1 valid move)
    for (let attempt = 0; attempt < 24; attempt++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = tiles[i].color;
        tiles[i].color = tiles[j].color;
        tiles[j].color = tmp;
      }
      if (
        this.matcher.findMatches(this.grid, this.mask).length === 0 &&
        this.matcher.findHintMove(this.grid, this.mask) !== null
      ) {
        return;
      }
    }

    // Fallback guarantee: craft an L-shaped potential 3-match in 1 swap
    const color = this.level.colors[0];
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        if (
          this.mask[r][c] === 1 &&
          this.mask[r][c + 1] === 1 &&
          this.mask[r + 1][c + 2] === 1 &&
          this.mask[r][c + 2] === 1
        ) {
          if (this.grid[r][c]) this.grid[r][c]!.color = color;
          if (this.grid[r][c + 1]) this.grid[r][c + 1]!.color = color;
          if (this.grid[r + 1][c + 2]) this.grid[r + 1][c + 2]!.color = color;
          return;
        }
      }
    }
  }

  private triggerShake(durationMs: number, magnitude: number): void {
    this.shakeTimer = Math.max(this.shakeTimer, durationMs);
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  getStarCount(): number {
    const [s1, s2, s3] = this.level.starThresholds;
    if (this.score >= s3) return 3;
    if (this.score >= s2) return 2;
    if (this.score >= s1) return 1;
    return 0;
  }

  private emitSnapshot(): void {
    this.callbacks.onSnapshot?.({
      phase: this.phase,
      score: this.score,
      movesLeft: this.movesLeft,
      stars: this.getStarCount(),
      combo: this.combo,
      goals: this.goalProgress.map((g) => ({ ...g })),
    });
  }

  /**
   * 60fps 高分屏 Canvas 2D 棋盘渲染
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, nowMs: number): void {
    const pad = 10;
    const cellSize = Math.floor(
      Math.min((width - pad * 2) / this.cols, (height - pad * 2) / this.rows)
    );
    const boardW = cellSize * this.cols;
    const boardH = cellSize * this.rows;
    const originX = Math.floor((width - boardW) / 2);
    const originY = Math.floor((height - boardH) / 2);
    this.layout = { cellSize, originX, originY, boardW, boardH };

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Subtle 150ms screen shake on mega combos
    if (this.shakeTimer > 0) {
      const intensity = (this.shakeTimer / 180) * this.shakeMagnitude;
      const sx = (Math.random() - 0.5) * 2 * intensity;
      const sy = (Math.random() - 0.5) * 2 * intensity;
      ctx.translate(sx, sy);
    }

    // 1. Frosted dark-glass board cells (PRD: rgba(22, 16, 48, 0.45) + faint starlight border)
    const cellGap = Math.max(2, Math.floor(cellSize * 0.06));
    const cellRadius = Math.max(6, Math.floor(cellSize * 0.2));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.mask[r][c] !== 1) continue;
        const x = originX + c * cellSize + cellGap / 2;
        const y = originY + r * cellSize + cellGap / 2;
        const w = cellSize - cellGap;

        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(22, 16, 48, 0.48)' : 'rgba(28, 20, 58, 0.42)';
        drawRoundedRect(ctx, x, y, w, w, cellRadius);
        ctx.fill();

        ctx.strokeStyle = 'rgba(216, 180, 254, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Subtle hint glow if player has been idle
        if (
          this.hintPair &&
          ((this.hintPair.a.row === r && this.hintPair.a.col === c) ||
            (this.hintPair.b.row === r && this.hintPair.b.col === c))
        ) {
          const pulse = 0.35 + 0.35 * Math.sin(nowMs * 0.008);
          ctx.strokeStyle = `rgba(255, 214, 102, ${pulse + 0.25})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }
    }

    // 2. Selected cell luminous starlight frame
    if (this.selected) {
      const sx = originX + this.selected.col * cellSize + cellGap / 2;
      const sy = originY + this.selected.row * cellSize + cellGap / 2;
      const sw = cellSize - cellGap;
      const pulse = 0.75 + 0.25 * Math.sin(nowMs * 0.01);

      ctx.save();
      ctx.fillStyle = `rgba(255, 133, 192, ${0.18 * pulse})`;
      drawRoundedRect(ctx, sx, sy, sw, sw, cellRadius);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 214, 102, ${0.95 * pulse})`;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Clip falling tiles cleanly to board top edge and draw luminous flowers
    ctx.save();
    ctx.beginPath();
    ctx.rect(originX - 8, originY - 8, boardW + 16, boardH + 16);
    ctx.clip();

    const tileRadius = cellSize * 0.41;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;
        const cx = originX + (tile.vx + 0.5) * cellSize;
        const cy = originY + (tile.vy + 0.5) * cellSize;
        const isSelected =
          this.selected && this.selected.row === r && this.selected.col === c;
        const selScale = isSelected ? 1.1 + Math.sin(nowMs * 0.01) * 0.04 : 1;

        ctx.save();
        ctx.globalAlpha = tile.alpha;
        drawTileOnCanvas(
          ctx,
          cx,
          cy,
          tileRadius * tile.scale * selScale,
          tile.color,
          tile.special,
          nowMs + tile.id * 97
        );
        ctx.restore();
      }
    }
    ctx.restore();

    // 4. Particles, Beams, Shockwaves, Meteors, Aurora, Score Pops
    this.particles.render(ctx);

    ctx.restore();
  }
}

function drawRoundedRect(
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
