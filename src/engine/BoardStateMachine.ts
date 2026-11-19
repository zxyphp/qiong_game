import { LevelConfig, SpecialType, TileColor } from '../types/game';

export type BoardPhase =
  | 'IDLE'
  | 'SWAPPING'
  | 'REVERTING'
  | 'RESOLVING'
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
}

/**
 * 棋盘状态机（纯 TypeScript，与 React UI 完全解耦）
 * 完整三消物理、动画帧与交互将在 Phase 2 实装。
 */
export class BoardStateMachine {
  public readonly level: LevelConfig;
  public phase: BoardPhase = 'IDLE';

  constructor(level: LevelConfig) {
    this.level = level;
  }
}
