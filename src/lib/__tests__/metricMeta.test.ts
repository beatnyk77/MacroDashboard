import { describe, it, expect } from 'vitest';
import { METRIC_IDS } from '@/constants/metricIds';
import { CORE_METRIC_META_IDS, getMetricMeta, hasMetricMeta } from '@/lib/metricMeta';

describe('metricMeta v1 seed', () => {
  it('covers core Terminal / de-dollarization / BRICS metric set', () => {
    expect(CORE_METRIC_META_IDS.length).toBeGreaterThanOrEqual(6);
    expect(hasMetricMeta(METRIC_IDS.GOLD_PRICE_USD)).toBe(true);
    expect(hasMetricMeta(METRIC_IDS.BRICS_GDP_PPP_TN)).toBe(true);
    expect(hasMetricMeta(METRIC_IDS.FED_BALANCE_SHEET)).toBe(true);
  });

  it('returns surfaces and labels for seeded ids', () => {
    const gold = getMetricMeta(METRIC_IDS.GOLD_PRICE_USD);
    expect(gold?.label).toBeTruthy();
    expect(gold?.surfaces).toContain('lab:de-dollarization');
  });
});
