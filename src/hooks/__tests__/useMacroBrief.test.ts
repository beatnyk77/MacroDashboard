import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import type { BriefContent, DailyMacroBrief } from '@/hooks/useMacroBrief';

describe('BriefContent type', () => {
  it('satisfies the expected shape', () => {
    const content: BriefContent = {
      what_changed: ['◆ US 10Y +8bps → Real yield positive'],
      regime_status: 'Fiscal dominance deepening.',
      focus_observations: ['India FX reserves under pressure'],
      watch_today: ['US CPI print at 14:30 ET'],
    };
    expect(content.what_changed).toHaveLength(1);
    expect(content.focus_observations).toHaveLength(1);
  });
});

describe('getFocusAreasKey', () => {
  it('sorts and joins focus areas into a canonical key', async () => {
    const { getFocusAreasKey } = await import('@/hooks/useMacroBrief');
    expect(getFocusAreasKey(['gold', 'us', 'india'])).toBe('gold,india,us');
    expect(getFocusAreasKey(['us', 'india', 'gold'])).toBe('gold,india,us');
  });

  it('handles a single area', async () => {
    const { getFocusAreasKey } = await import('@/hooks/useMacroBrief');
    expect(getFocusAreasKey(['us'])).toBe('us');
  });
});

describe('DEFAULT_FOCUS_AREAS', () => {
  it('contains us, india, and gold', async () => {
    const { DEFAULT_FOCUS_AREAS } = await import('@/hooks/useMacroBrief');
    expect(DEFAULT_FOCUS_AREAS).toEqual(expect.arrayContaining(['us', 'india', 'gold']));
    expect(DEFAULT_FOCUS_AREAS).toHaveLength(3);
  });
});
