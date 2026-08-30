import { describe, expect, it } from 'vitest';
import { EXPECTED_AUTHORITY_METRICS } from '../../authorityMetricMapping';
import { METRIC_IDS } from '../../src/constants/metricIds';
import { METRICS_CATALOG } from '../../src/features/metrics/metricsCatalog';

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
const knownCatalogEntries = new Set([
  ...METRICS_CATALOG.map((metric) => metric.id),
  'CB_GOLD_NET',
]);
const knownMetricIdExceptions = new Set(['CB_GOLD_NET']);

describe('authority metric mapping', () => {
  it('maps every flagship metric to a database id, producer, storage path, and unit', () => {
    expect(EXPECTED_AUTHORITY_METRICS).toHaveLength(8);

    for (const metric of EXPECTED_AUTHORITY_METRICS) {
      expect(metric.publicSlug).toBeTruthy();
      expect(metric.metricId).toBeTruthy();
      expect(metric.producer).toBeTruthy();
      expect(metric.storagePath).toBeTruthy();
      expect(metric.unit).toBeTruthy();
      expect(knownCatalogEntries.has(metric.publicSlug)).toBe(true);
      expect(
        knownMetricIds.has(metric.metricId)
          || knownMetricIdExceptions.has(metric.metricId),
      ).toBe(true);
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
