import { describe, expect, it } from 'vitest';
import { applyRegimeHysteresis, computeIndiaInstitutionalSignals, hasSufficientDailyHistory, percentileRank, toSignedScore, winsorizedPercentile } from '../indiaInstitutionalSignals.ts';

describe('India institutional signals', () => {
  it('uses average-rank ties and signed percentile conversion', () => {
    expect(percentileRank(2, [1, 2, 2, 3])).toBe(0.5);
    expect(toSignedScore(0.75)).toBe(0.5);
    expect(winsorizedPercentile(1000, [1, 2, 3, 4, 5])).toBe(0.9);
  });

  it('requires a repeated candidate before ordinary regime transitions', () => {
    expect(applyRegimeHysteresis('Distribution', 'Foreign Accumulation', null)).toBe('Foreign Accumulation');
    expect(applyRegimeHysteresis('Distribution', 'Foreign Accumulation', 'Distribution')).toBe('Distribution');
    expect(applyRegimeHysteresis('Synchronized Risk', 'Foreign Accumulation', null)).toBe('Synchronized Risk');
  });

  it('returns insufficient coverage for short history', () => {
    const result = computeIndiaInstitutionalSignals([{ date: '2026-08-29', fii: -100, dii: 80 }]);
    expect(result.regime).toBe('Mixed / Insufficient Coverage');
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
    expect(hasSufficientDailyHistory([{ date: '2026-08-29', fii: -100, dii: 80 }])).toBe(false);
  });

  it('opens the publication gate at exactly 252 accepted FII/DII sessions', () => {
    const points = Array.from({ length: 252 }, (_, i) => ({
      date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
      fii: 100 + i,
      dii: 80 + i,
      nifty: 0.2,
      breadth: 100,
      vix: 12,
      usdInr: -0.05,
      liquidity: 0.4,
      liquidityDate: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
      credit: 12,
      creditDate: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
    }));

    expect(hasSufficientDailyHistory(points.slice(0, 251))).toBe(false);
    expect(hasSufficientDailyHistory(points)).toBe(true);
    const snapshot = computeIndiaInstitutionalSignals(points);
    expect(snapshot.asOf).toBe(points[251].date);
    expect(snapshot.score).not.toBeNull();
    expect(snapshot.coverageMask).toEqual(expect.arrayContaining(['foreign_exit', 'absorption', 'flow_price', 'market_confirmation']));
  });

  it('produces a reproducible snapshot with explicit component coverage', () => {
    const points = Array.from({ length: 30 }, (_, i) => ({ date: `2026-07-${String(i + 1).padStart(2, '0')}`, fii: i < 20 ? -100 : 200, dii: 150, nifty: i * 0.2, breadth: 10, vix: 12, usdInr: -0.1, liquidity: 0.2, credit: 14 }));
    const result = computeIndiaInstitutionalSignals(points);
    expect(result.calculationVersion).toBe('india-positioning-v2');
    expect(result.coverageMask).toContain('foreign_exit');
    expect(result.foreignExit.inputs).toEqual(['fii_20d', 'fii_5d', 'fii_sell_streak']);
  });
});
