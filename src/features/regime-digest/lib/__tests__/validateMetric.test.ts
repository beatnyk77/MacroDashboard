// src/features/regime-digest/lib/__tests__/validateMetric.test.ts
import { describe, it, expect } from 'vitest';
import { validateObservation } from '../validateMetric';
import { DIGEST_METRICS } from '../metricCatalog';

const cpi = DIGEST_METRICS.find((m) => m.id === 'US_CPI_YOY')!;

describe('validateObservation', () => {
  it('accepts a plausible CPI YoY', () => {
    const r = validateObservation(cpi, 2.7, '2026-06-30', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('ok');
    expect(r.level).toBe(2.7);
  });

  it('withholds impossible CPI YoY (double-scaled index)', () => {
    const r = validateObservation(cpi, 332.57, '2026-06-30', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('failed_validation');
    expect(r.level).toBeNull();
  });

  it('marks missing value', () => {
    const r = validateObservation(cpi, null, null, new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('missing');
  });

  it('marks stale daily series older than threshold', () => {
    const dxy = DIGEST_METRICS.find((m) => m.id === 'DXY_INDEX')!;
    const r = validateObservation(dxy, 100.5, '2026-06-01', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('stale');
    expect(r.level).toBe(100.5);
  });
});
