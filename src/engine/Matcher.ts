import { SpecialType, TileColor } from '../types/game';

export interface MatchCell {
  row: number;
  col: number;
}

export interface MatchGroup {
  cells: MatchCell[];
  color: TileColor;
  spawnSpecial: SpecialType;
  pivot: MatchCell;
}

/**
 * 匹配检测器（4 连直线、T/L 型 5 连爆炸、一字 5 连琉璃蝶、死局检测）
 * 将在 Phase 2 完整实现。
 */
export class Matcher {
  findMatches(): MatchGroup[] {
    return [];
  }
}
