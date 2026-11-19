import { SpecialType, TileColor } from '../types/game';

export interface GridCoord {
  row: number;
  col: number;
}

export interface MatchableTile {
  color: TileColor;
  special: SpecialType;
}

export interface SwapContext {
  a: GridCoord;
  b: GridCoord;
  direction: 'h' | 'v';
}

export interface MatchGroup {
  cells: GridCoord[];
  color: TileColor;
  spawnSpecial: SpecialType;
  pivot: GridCoord;
}

interface LineRun {
  orientation: 'h' | 'v';
  color: TileColor;
  cells: GridCoord[];
}

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

export class Matcher {
  /**
   * 扫描棋盘中所有 3+ 连消，合并相交的横纵连线，严格按 PRD 生成特效：
   * - 一字 5+ 连消 -> 星穹琉璃蝶 (butterfly)
   * - T / L / + 型交叉 5+ 连消 -> 花爆星核 (bomb)
   * - 4 连消 -> 星流花 (line_h / line_v，优先依据玩家交换方向)
   */
  findMatches(
    grid: (MatchableTile | null)[][],
    mask: number[][],
    swapCtx?: SwapContext
  ): MatchGroup[] {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const runs: LineRun[] = [];

    // 1. Horizontal runs
    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const tile = mask[r][c] === 1 ? grid[r][c] : null;
        if (!tile || tile.special === 'butterfly') {
          c++;
          continue;
        }
        const color = tile.color;
        const cells: GridCoord[] = [{ row: r, col: c }];
        let k = c + 1;
        while (k < cols) {
          const next = mask[r][k] === 1 ? grid[r][k] : null;
          if (!next || next.special === 'butterfly' || next.color !== color) break;
          cells.push({ row: r, col: k });
          k++;
        }
        if (cells.length >= 3) {
          runs.push({ orientation: 'h', color, cells });
        }
        c = k;
      }
    }

    // 2. Vertical runs
    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const tile = mask[r][c] === 1 ? grid[r][c] : null;
        if (!tile || tile.special === 'butterfly') {
          r++;
          continue;
        }
        const color = tile.color;
        const cells: GridCoord[] = [{ row: r, col: c }];
        let k = r + 1;
        while (k < rows) {
          const next = mask[k][c] === 1 ? grid[k][c] : null;
          if (!next || next.special === 'butterfly' || next.color !== color) break;
          cells.push({ row: k, col: c });
          k++;
        }
        if (cells.length >= 3) {
          runs.push({ orientation: 'v', color, cells });
        }
        r = k;
      }
    }

    if (runs.length === 0) return [];

    // 3. Merge intersecting runs of the same color via BFS
    const visited = new Array<boolean>(runs.length).fill(false);
    const groups: MatchGroup[] = [];

    for (let i = 0; i < runs.length; i++) {
      if (visited[i]) continue;
      visited[i] = true;
      const queue = [i];
      const componentRuns: LineRun[] = [];
      const cellMap = new Map<string, GridCoord>();

      while (queue.length > 0) {
        const idx = queue.shift()!;
        const run = runs[idx];
        componentRuns.push(run);
        for (const cell of run.cells) {
          cellMap.set(cellKey(cell.row, cell.col), cell);
        }

        for (let j = 0; j < runs.length; j++) {
          if (visited[j] || runs[j].color !== run.color) continue;
          const overlaps = runs[j].cells.some((c) => cellMap.has(cellKey(c.row, c.col)));
          if (overlaps) {
            visited[j] = true;
            queue.push(j);
          }
        }
      }

      const cells = Array.from(cellMap.values());
      const hasH = componentRuns.some((r) => r.orientation === 'h');
      const hasV = componentRuns.some((r) => r.orientation === 'v');
      const maxStraight = Math.max(...componentRuns.map((r) => r.cells.length));

      let spawnSpecial: SpecialType = 'none';
      if (maxStraight >= 5) {
        spawnSpecial = 'butterfly';
      } else if (hasH && hasV && cells.length >= 5) {
        spawnSpecial = 'bomb';
      } else if (maxStraight === 4) {
        // 4 连消：优先根据交换方向生成横/竖星流花；若为自动下落连消则跟随连线方向
        const isSwapInGroup =
          swapCtx &&
          (cellMap.has(cellKey(swapCtx.a.row, swapCtx.a.col)) ||
            cellMap.has(cellKey(swapCtx.b.row, swapCtx.b.col)));
        const dir = isSwapInGroup ? swapCtx.direction : componentRuns[0].orientation;
        spawnSpecial = dir === 'h' ? 'line_h' : 'line_v';
      }

      // Choose pivot: prefer player's swapped cell -> intersection cell -> middle cell
      let pivot: GridCoord = cells[Math.floor(cells.length / 2)];
      if (swapCtx) {
        if (cellMap.has(cellKey(swapCtx.b.row, swapCtx.b.col))) {
          pivot = swapCtx.b;
        } else if (cellMap.has(cellKey(swapCtx.a.row, swapCtx.a.col))) {
          pivot = swapCtx.a;
        }
      } else if (hasH && hasV) {
        const hSet = new Set(
          componentRuns
            .filter((r) => r.orientation === 'h')
            .flatMap((r) => r.cells.map((c) => cellKey(c.row, c.col)))
        );
        const cross = componentRuns
          .filter((r) => r.orientation === 'v')
          .flatMap((r) => r.cells)
          .find((c) => hSet.has(cellKey(c.row, c.col)));
        if (cross) pivot = cross;
      }

      groups.push({
        cells,
        color: componentRuns[0].color,
        spawnSpecial,
        pivot,
      });
    }

    return groups;
  }

  /**
   * 死局检测：返回任意一个可消除（或双特效/琉璃蝶）的有效交换，若无解则返回 null
   */
  findHintMove(
    grid: (MatchableTile | null)[][],
    mask: number[][]
  ): { a: GridCoord; b: GridCoord } | null {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;

    const tryPair = (r1: number, c1: number, r2: number, c2: number): boolean => {
      if (mask[r1][c1] !== 1 || mask[r2][c2] !== 1) return false;
      const t1 = grid[r1][c1];
      const t2 = grid[r2][c2];
      if (!t1 || !t2) return false;

      // 琉璃蝶与任意棋子交换、或任意双特效组合均有效
      if (t1.special === 'butterfly' || t2.special === 'butterfly') return true;
      if (t1.special !== 'none' && t2.special !== 'none') return true;
      if (t1.color === t2.color) return false;

      // Temporarily swap and test local 3-in-a-row
      grid[r1][c1] = t2;
      grid[r2][c2] = t1;
      const valid = this.formsLineAt(grid, mask, r1, c1) || this.formsLineAt(grid, mask, r2, c2);
      grid[r1][c1] = t1;
      grid[r2][c2] = t2;
      return valid;
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c + 1 < cols && tryPair(r, c, r, c + 1)) {
          return { a: { row: r, col: c }, b: { row: r, col: c + 1 } };
        }
        if (r + 1 < rows && tryPair(r, c, r + 1, c)) {
          return { a: { row: r, col: c }, b: { row: r + 1, col: c } };
        }
      }
    }
    return null;
  }

  private formsLineAt(
    grid: (MatchableTile | null)[][],
    mask: number[][],
    row: number,
    col: number
  ): boolean {
    const tile = grid[row][col];
    if (!tile || tile.special === 'butterfly') return false;
    const color = tile.color;
    const rows = grid.length;
    const cols = grid[0].length;

    let countH = 1;
    for (let c = col - 1; c >= 0 && mask[row][c] === 1; c--) {
      const t = grid[row][c];
      if (!t || t.special === 'butterfly' || t.color !== color) break;
      countH++;
    }
    for (let c = col + 1; c < cols && mask[row][c] === 1; c++) {
      const t = grid[row][c];
      if (!t || t.special === 'butterfly' || t.color !== color) break;
      countH++;
    }
    if (countH >= 3) return true;

    let countV = 1;
    for (let r = row - 1; r >= 0 && mask[r][col] === 1; r--) {
      const t = grid[r][col];
      if (!t || t.special === 'butterfly' || t.color !== color) break;
      countV++;
    }
    for (let r = row + 1; r < rows && mask[r][col] === 1; r++) {
      const t = grid[r][col];
      if (!t || t.special === 'butterfly' || t.color !== color) break;
      countV++;
    }
    return countV >= 3;
  }
}
