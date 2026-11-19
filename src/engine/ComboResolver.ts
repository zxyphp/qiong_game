import { SpecialType, TileColor } from '../types/game';
import { GridCoord, MatchableTile } from './Matcher';

export type ComboKind =
  | 'line_line'
  | 'line_bomb'
  | 'bomb_bomb'
  | 'butterfly_single'
  | 'butterfly_line'
  | 'butterfly_bomb'
  | 'butterfly_butterfly';

export interface BeamVisualHint {
  orientation: 'h' | 'v';
  index: number;
  color: string;
  widthScale?: number;
}

export interface ShockwaveVisualHint {
  row: number;
  col: number;
  radiusCells: number;
  color: string;
  delayedMs?: number;
}

export interface ComboResolution {
  kind: ComboKind;
  clearCells: GridCoord[];
  /** 琉璃蝶 + 直线/爆炸 时，需要先发射流星转化再连环引爆的目标格 */
  transformTargets?: {
    coord: GridCoord;
    toSpecial: 'line_h' | 'line_v' | 'bomb';
  }[];
  /** 流星起点（琉璃蝶所在格） */
  meteorOrigin?: GridCoord;
  /** 琉璃蝶 + 普通花朵时的流星终点 */
  meteorTargets?: GridCoord[];
  beams: BeamVisualHint[];
  shockwaves: ShockwaveVisualHint[];
  aurora: boolean;
  shakeMs: number;
  soundKind: 'line' | 'bomb' | 'mega' | 'aurora';
}

function keyOf(r: number, c: number): string {
  return `${r},${c}`;
}

export class ComboResolver {
  classifyPair(a: SpecialType, b: SpecialType): ComboKind | null {
    const isLine = (s: SpecialType) => s === 'line_h' || s === 'line_v';
    if (a === 'butterfly' && b === 'butterfly') return 'butterfly_butterfly';
    if ((a === 'butterfly' && isLine(b)) || (b === 'butterfly' && isLine(a))) {
      return 'butterfly_line';
    }
    if ((a === 'butterfly' && b === 'bomb') || (b === 'butterfly' && a === 'bomb')) {
      return 'butterfly_bomb';
    }
    if (a === 'butterfly' || b === 'butterfly') return 'butterfly_single';
    if (isLine(a) && isLine(b)) return 'line_line';
    if ((isLine(a) && b === 'bomb') || (a === 'bomb' && isLine(b))) return 'line_bomb';
    if (a === 'bomb' && b === 'bomb') return 'bomb_bomb';
    return null;
  }

  resolvePair(
    grid: (MatchableTile | null)[][],
    mask: number[][],
    posA: GridCoord,
    posB: GridCoord
  ): ComboResolution | null {
    const tileA = grid[posA.row]?.[posA.col];
    const tileB = grid[posB.row]?.[posB.col];
    if (!tileA || !tileB) return null;

    const kind = this.classifyPair(tileA.special, tileB.special);
    if (!kind) return null;

    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const cellMap = new Map<string, GridCoord>();
    const addCell = (r: number, c: number) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols && mask[r][c] === 1) {
        cellMap.set(keyOf(r, c), { row: r, col: c });
      }
    };

    // Always include both swapped tiles
    addCell(posA.row, posA.col);
    addCell(posB.row, posB.col);

    const beams: BeamVisualHint[] = [];
    const shockwaves: ShockwaveVisualHint[] = [];
    let aurora = false;
    let shakeMs = 0;
    let soundKind: ComboResolution['soundKind'] = 'line';
    let meteorOrigin: GridCoord | undefined;
    let meteorTargets: GridCoord[] | undefined;
    let transformTargets: ComboResolution['transformTargets'];

    const center = posB;

    if (kind === 'line_line') {
      // 1. 直线 + 直线：十字全清，发射金色/粉色双道星光束
      for (let c = 0; c < cols; c++) addCell(center.row, c);
      for (let r = 0; r < rows; r++) addCell(r, center.col);
      beams.push(
        { orientation: 'h', index: center.row, color: '#ffd666', widthScale: 1.25 },
        { orientation: 'v', index: center.col, color: '#ff85c0', widthScale: 1.25 }
      );
      shakeMs = 90;
      soundKind = 'line';
    } else if (kind === 'line_bomb') {
      // 2. 直线 + 爆炸：3 行 3 列巨型十字光柱清屏，附带 150ms 轻微屏幕震动
      for (let dr = -1; dr <= 1; dr++) {
        const rr = center.row + dr;
        if (rr >= 0 && rr < rows) {
          for (let c = 0; c < cols; c++) addCell(rr, c);
          beams.push({
            orientation: 'h',
            index: rr,
            color: dr === 0 ? '#ffd666' : '#ff85c0',
            widthScale: dr === 0 ? 1.55 : 1.05,
          });
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        const cc = center.col + dc;
        if (cc >= 0 && cc < cols) {
          for (let r = 0; r < rows; r++) addCell(r, cc);
          beams.push({
            orientation: 'v',
            index: cc,
            color: dc === 0 ? '#5cdbd3' : '#b37feb',
            widthScale: dc === 0 ? 1.55 : 1.05,
          });
        }
      }
      shockwaves.push({ row: center.row, col: center.col, radiusCells: 2.2, color: '#ffd666' });
      shakeMs = 150;
      soundKind = 'mega';
    } else if (kind === 'bomb_bomb') {
      // 3. 爆炸 + 爆炸：5×5 范围二次连环花瓣星爆
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          addCell(center.row + dr, center.col + dc);
        }
      }
      shockwaves.push(
        { row: center.row, col: center.col, radiusCells: 2.6, color: '#ff85c0', delayedMs: 0 },
        { row: center.row, col: center.col, radiusCells: 3.1, color: '#ffd666', delayedMs: 130 }
      );
      shakeMs = 180;
      soundKind = 'mega';
    } else if (kind === 'butterfly_single') {
      // 4. 琉璃蝶 + 普通花朵：消除全屏同色
      const butterflyPos = tileA.special === 'butterfly' ? posA : posB;
      const targetColor: TileColor =
        tileA.special === 'butterfly' ? tileB.color : tileA.color;
      meteorOrigin = butterflyPos;
      meteorTargets = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = mask[r][c] === 1 ? grid[r][c] : null;
          if (t && t.special !== 'butterfly' && t.color === targetColor) {
            addCell(r, c);
            meteorTargets.push({ row: r, col: c });
          }
        }
      }
      shakeMs = 110;
      soundKind = 'bomb';
    } else if (kind === 'butterfly_line' || kind === 'butterfly_bomb') {
      // 5. 琉璃蝶 + 直线/爆炸：发射拖尾流星转化为对应特效后依次连环引爆
      const butterflyPos = tileA.special === 'butterfly' ? posA : posB;
      const partnerTile = tileA.special === 'butterfly' ? tileB : tileA;
      const targetColor = partnerTile.color;
      meteorOrigin = butterflyPos;
      transformTargets = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r === posA.row && c === posA.col) || (r === posB.row && c === posB.col)) {
            continue;
          }
          const t = mask[r][c] === 1 ? grid[r][c] : null;
          if (t && t.special !== 'butterfly' && t.color === targetColor) {
            const toSpecial =
              kind === 'butterfly_bomb'
                ? 'bomb'
                : (r + c) % 2 === 0
                  ? 'line_h'
                  : 'line_v';
            transformTargets.push({ coord: { row: r, col: c }, toSpecial });
          }
        }
      }
      shakeMs = 150;
      soundKind = 'mega';
    } else if (kind === 'butterfly_butterfly') {
      // 6. 琉璃蝶 + 琉璃蝶：全屏星海大爆发（极光扫屏 + 全图清除）
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          addCell(r, c);
        }
      }
      aurora = true;
      shakeMs = 220;
      soundKind = 'aurora';
    }

    return {
      kind,
      clearCells: Array.from(cellMap.values()),
      transformTargets,
      meteorOrigin,
      meteorTargets,
      beams,
      shockwaves,
      aurora,
      shakeMs,
      soundKind,
    };
  }

  /**
   * 展开单个或多个被波及的特效棋子，自动处理连环引爆（避免无限递归）
   */
  expandChainReactions(
    grid: (MatchableTile | null)[][],
    mask: number[][],
    initialCells: GridCoord[]
  ): {
    allCells: GridCoord[];
    beams: BeamVisualHint[];
    shockwaves: ShockwaveVisualHint[];
    triggeredSpecialCount: number;
  } {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const visited = new Map<string, GridCoord>();
    const triggeredSpecials = new Set<string>();
    const queue: GridCoord[] = [];
    const beams: BeamVisualHint[] = [];
    const shockwaves: ShockwaveVisualHint[] = [];

    const enqueue = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || mask[r][c] !== 1) return;
      const k = keyOf(r, c);
      if (!visited.has(k)) {
        const coord = { row: r, col: c };
        visited.set(k, coord);
        queue.push(coord);
      }
    };

    for (const cell of initialCells) {
      enqueue(cell.row, cell.col);
    }

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const k = keyOf(cur.row, cur.col);
      if (triggeredSpecials.has(k)) continue;
      const tile = grid[cur.row]?.[cur.col];
      if (!tile || tile.special === 'none') continue;

      triggeredSpecials.add(k);

      if (tile.special === 'line_h') {
        beams.push({ orientation: 'h', index: cur.row, color: '#ffd666' });
        for (let c = 0; c < cols; c++) enqueue(cur.row, c);
      } else if (tile.special === 'line_v') {
        beams.push({ orientation: 'v', index: cur.col, color: '#ff85c0' });
        for (let r = 0; r < rows; r++) enqueue(r, cur.col);
      } else if (tile.special === 'bomb') {
        shockwaves.push({ row: cur.row, col: cur.col, radiusCells: 1.75, color: '#ffd666' });
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            enqueue(cur.row + dr, cur.col + dc);
          }
        }
      } else if (tile.special === 'butterfly') {
        // 被连锁引爆的琉璃蝶：随机选中当前场上数量最多的花色全清
        const counts = new Map<TileColor, number>();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const t = mask[r][c] === 1 ? grid[r][c] : null;
            if (t && t.special !== 'butterfly') {
              counts.set(t.color, (counts.get(t.color) ?? 0) + 1);
            }
          }
        }
        let bestColor: TileColor | null = null;
        let bestCount = 0;
        counts.forEach((cnt, color) => {
          if (cnt > bestCount) {
            bestCount = cnt;
            bestColor = color;
          }
        });
        if (bestColor) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const t = mask[r][c] === 1 ? grid[r][c] : null;
              if (t && t.color === bestColor) enqueue(r, c);
            }
          }
        }
      }
    }

    return {
      allCells: Array.from(visited.values()),
      beams,
      shockwaves,
      triggeredSpecialCount: triggeredSpecials.size,
    };
  }
}
