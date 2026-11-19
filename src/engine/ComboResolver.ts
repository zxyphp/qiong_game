import { SpecialType } from '../types/game';

export type ComboKind =
  | 'line_line'
  | 'line_bomb'
  | 'bomb_bomb'
  | 'butterfly_single'
  | 'butterfly_special'
  | 'butterfly_butterfly';

/**
 * 6 种双特效组合解析器（纯 TypeScript）
 * 将在 Phase 2 完整实现。
 */
export class ComboResolver {
  classifyPair(a: SpecialType, b: SpecialType): ComboKind | null {
    const isLine = (s: SpecialType) => s === 'line_h' || s === 'line_v';
    if (a === 'butterfly' && b === 'butterfly') return 'butterfly_butterfly';
    if (a === 'butterfly' && (isLine(b) || b === 'bomb')) return 'butterfly_special';
    if (b === 'butterfly' && (isLine(a) || a === 'bomb')) return 'butterfly_special';
    if (a === 'butterfly' || b === 'butterfly') return 'butterfly_single';
    if (isLine(a) && isLine(b)) return 'line_line';
    if ((isLine(a) && b === 'bomb') || (a === 'bomb' && isLine(b))) return 'line_bomb';
    if (a === 'bomb' && b === 'bomb') return 'bomb_bomb';
    return null;
  }
}
