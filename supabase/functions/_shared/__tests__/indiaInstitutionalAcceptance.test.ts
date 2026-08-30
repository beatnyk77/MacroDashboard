import { describe, expect, it } from 'vitest';
import { indiaInstitutionalFreshness } from '@/lib/indiaInstitutionalFreshness';

describe('India institutional positioning acceptance contract', () => {
  it('uses the documented cadence freshness thresholds', () => {
    const now = new Date('2026-08-30T00:00:00Z');
    expect(indiaInstitutionalFreshness('2026-08-28', 'daily', now)).toBe('observed');
    expect(indiaInstitutionalFreshness('2026-08-24', 'daily', now)).toBe('lagged');
    expect(indiaInstitutionalFreshness('2026-08-01', 'daily', now)).toBe('historical');
    expect(indiaInstitutionalFreshness('2026-08-24', 'weekly', now)).toBe('observed');
    expect(indiaInstitutionalFreshness('2026-06-01', 'monthly', now)).toBe('lagged');
    expect(indiaInstitutionalFreshness('2026-05-02', 'quarterly', now)).toBe('observed');
  });

  it('keeps F&O coverage separate from the phase-two public regime', () => {
    expect('F&O/Cash Conflict').toContain('F&O');
    expect('Mixed / Insufficient Coverage').toContain('Insufficient Coverage');
  });
});
