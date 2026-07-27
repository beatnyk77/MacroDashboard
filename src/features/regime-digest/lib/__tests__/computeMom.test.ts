import { describe, it, expect } from 'vitest';
import { buildMetricRow, rankMovers } from '../computeMom';
import { DIGEST_METRICS } from '../metricCatalog';
import type { MetricRow } from '../types';

const dxy = DIGEST_METRICS.find((m) => m.id === 'DXY_INDEX')!;

describe('buildMetricRow', () => {
  it('computes delta and deltaPct', () => {
    const row = buildMetricRow(
      dxy,
      { status: 'ok', level: 102, asOf: '2026-06-30' },
      { status: 'ok', level: 100, asOf: '2026-05-30' },
    );
    expect(row.delta).toBeCloseTo(2);
    expect(row.deltaPct).toBeCloseTo(2);
    expect(row.status).toBe('ok');
  });

  it('returns null deltaPct when prior missing', () => {
    const row = buildMetricRow(
      dxy,
      { status: 'ok', level: 102, asOf: '2026-06-30' },
      { status: 'missing', level: null, asOf: null },
    );
    expect(row.deltaPct).toBeNull();
  });
});

describe('rankMovers', () => {
  it('only ranks status ok with finite deltaPct', () => {
    const board: MetricRow[] = [
      {
        id: 'a', name: 'A', section: 'us', level: 2, priorLevel: 1,
        delta: 1, deltaPct: 100, unit: '%', asOf: '2026-06-30',
        sourceFamily: 'x', status: 'ok',
      },
      {
        id: 'b', name: 'B', section: 'us', level: 90, priorLevel: 100,
        delta: -10, deltaPct: -10, unit: 'x', asOf: '2026-06-30',
        sourceFamily: 'x', status: 'ok',
      },
      {
        id: 'c', name: 'C', section: 'us', level: 50, priorLevel: 10,
        delta: 40, deltaPct: 400, unit: 'x', asOf: '2026-01-01',
        sourceFamily: 'x', status: 'stale',
      },
    ];
    const m = rankMovers(board, 5);
    expect(m.up.map((x) => x.id)).toEqual(['a']);
    expect(m.down.map((x) => x.id)).toEqual(['b']);
  });
});
