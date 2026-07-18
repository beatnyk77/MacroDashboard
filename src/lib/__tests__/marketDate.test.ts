import { describe, expect, it } from 'vitest';
import { marketDateISO, marketDateMinusDays } from '@/lib/marketDate';

describe('marketDateISO', () => {
  it('returns YYYY-MM-DD shape', () => {
    expect(marketDateISO(new Date('2026-07-19T15:00:00.000Z'))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });

  it('uses America/New_York calendar day (late UTC still previous ET evening)', () => {
    // 2026-07-19 03:00 UTC = 2026-07-18 23:00 ET (EDT)
    expect(marketDateISO(new Date('2026-07-19T03:00:00.000Z'))).toBe('2026-07-18');
  });

  it('rolls to next ET day after midnight ET', () => {
    // 2026-07-19 05:00 UTC = 2026-07-19 01:00 ET
    expect(marketDateISO(new Date('2026-07-19T05:00:00.000Z'))).toBe('2026-07-19');
  });
});

describe('marketDateMinusDays', () => {
  it('subtracts calendar days without timezone drift', () => {
    expect(marketDateMinusDays('2026-07-19', 1)).toBe('2026-07-18');
    expect(marketDateMinusDays('2026-07-01', 1)).toBe('2026-06-30');
    expect(marketDateMinusDays('2026-03-01', 3)).toBe('2026-02-26');
  });
});
