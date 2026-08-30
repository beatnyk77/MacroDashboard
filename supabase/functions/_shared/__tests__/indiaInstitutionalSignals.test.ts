import { describe, expect, it } from 'vitest';
import { computeIndiaInstitutionalSignals, percentileRank, toSignedScore } from '../indiaInstitutionalSignals';

describe('India institutional signals', () => {
  it('uses average-rank ties and signed percentile conversion', () => {
    expect(percentileRank(2, [1, 2, 2, 3])).toBe(0.5);
    expect(toSignedScore(0.75)).toBe(0.5);
  });

  it('returns insufficient coverage for short history', () => {
    const result = computeIndiaInstitutionalSignals([{ date: '2026-08-29', fii: -100, dii: 80 }]);
    expect(result.regime).toBe('Mixed / Insufficient Coverage');
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('produces a reproducible snapshot with explicit component coverage', () => {
    const points = Array.from({ length: 30 }, (_, i) => ({ date: `2026-07-${String(i + 1).padStart(2, '0')}`, fii: i < 20 ? -100 : 200, dii: 150, nifty: i * 0.2, breadth: 10, vix: 12, usdInr: -0.1, liquidity: 0.2, credit: 14 }));
    const result = computeIndiaInstitutionalSignals(points);
    expect(result.calculationVersion).toBe('india-positioning-v1');
    expect(result.coverageMask).toContain('foreign_exit');
    expect(result.foreignExit.inputs).toEqual(['fii_20d', 'fii_5d', 'fii_sell_streak']);
  });
});
