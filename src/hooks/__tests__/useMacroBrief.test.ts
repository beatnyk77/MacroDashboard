import { describe, it, expect } from 'vitest';
import type { MacroBrief } from '@/types/brief';

describe('MacroBrief type', () => {
  it('satisfies the expected shape', () => {
    const brief: Partial<MacroBrief> = {
      brief_date: '2026-06-07',
      focus_areas: ['us_macro', 'india', 'gold_dedollarization'],
      content: {
        what_changed: ['US 10Y +8bps → Real yield positive'],
        regime_status: 'Fiscal dominance deepening.',
        focus_observations: ['India FX reserves under pressure'],
        watch_today: ['US CPI print at 14:30 ET'],
      },
    };
    expect(brief.content?.what_changed).toHaveLength(1);
    expect(brief.content?.focus_observations).toHaveLength(1);
  });
});
