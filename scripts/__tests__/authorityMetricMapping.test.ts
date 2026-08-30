import { describe, expect, it } from 'vitest';
import { EXPECTED_AUTHORITY_METRICS } from '../../authorityMetricMapping';
import { METRIC_IDS } from '../../src/constants/metricIds';

const flagshipSlugs = [
  'net-liquidity',
  'fiscal-dominance-meter',
  'sovereign-stress-index',
  'm2-gold-ratio',
  'global-usd-reserve-share',
  'CB_GOLD_NET',
  'india-credit-cycle',
  'china-iceberg-ratio',
];

const knownMetricIds = new Set(Object.values(METRIC_IDS));
const sentinelFragments = ['UNRESOLVED', 'SENTINEL', 'TODO', 'UNKNOWN', 'PLACEHOLDER'];

describe('authority metric mapping', () => {
  it('maps every flagship metric to a database id, producer, storage path, and unit', () => {
    expect(EXPECTED_AUTHORITY_METRICS).toHaveLength(8);

    for (const metric of EXPECTED_AUTHORITY_METRICS) {
      expect(metric.publicSlug).toBeTruthy();
      expect(metric.metricId).toBeTruthy();
      expect(metric.producer).toBeTruthy();
      expect(metric.storagePath).toBeTruthy();
      expect(metric.unit).toBeTruthy();
      expect(flagshipSlugs).toContain(metric.publicSlug);
      expect(metric.storagePath.startsWith('public.')).toBe(true);
      expect(knownMetricIds.has(metric.metricId)).toBe(true);
      expect(
        sentinelFragments.some((fragment) =>
          metric.producer.toUpperCase().includes(fragment)
          || metric.calculationPath.toUpperCase().includes(fragment),
        ),
      ).toBe(false);
    }

    expect(
      new Set(EXPECTED_AUTHORITY_METRICS.map((metric) => metric.publicSlug)).size,
    ).toBe(8);
    expect(flagshipSlugs).toEqual(
      expect.arrayContaining(
        EXPECTED_AUTHORITY_METRICS.map((metric) => metric.publicSlug),
      ),
    );
  });
});
