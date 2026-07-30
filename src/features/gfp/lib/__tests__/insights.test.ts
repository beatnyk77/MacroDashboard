import { describe, it, expect } from 'vitest';
import { buildGfpInsights } from '../insights';

describe('buildGfpInsights', () => {
  it('emits top5 share and net position delta when data present', () => {
    const lines = buildGfpInsights({
      latest_fy: 2024,
      top5_share: 0.72,
      top10_share: 0.85,
      hhi: 0.18,
      total_net_cost: 7400,
      total_assets_bil: 5600,
      total_liabilities_bil: 45000,
      net_position_bil: -39000,
      net_position_yoy_bil: -1200,
    });
    expect(lines.some((l) => l.includes('Top 5') && l.includes('72%'))).toBe(true);
    expect(lines.some((l) => l.includes('net position') || l.includes('Net position'))).toBe(true);
  });

  it('returns empty array when latest_fy missing', () => {
    expect(buildGfpInsights({ latest_fy: null } as any)).toEqual([]);
  });
});
