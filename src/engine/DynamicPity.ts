/**
 * 动态怜悯机制（Phase 4 接入结算与棋盘掉落权重）
 * 连败 2 次后，第 3 局隐形提升目标色块与容易凑 4 消的掉落权重。
 */
export class DynamicPity {
  getBoostFactor(consecutiveFails: number): number {
    if (consecutiveFails >= 2) {
      return Math.min(0.45, 0.25 + (consecutiveFails - 2) * 0.08);
    }
    return 0;
  }
}
