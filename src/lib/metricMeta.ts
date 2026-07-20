/**
 * Metric metadata layer — extends the canonical metric ID registry
 * (`src/constants/metricIds.ts`) with display + provenance fields.
 *
 * Rules:
 *  - IDs must exist in METRIC_IDS (or be intentionally omitted until seeded).
 *  - Prefer this for UI labels/surfaces; never invent metric_ids here that
 *    are not written by an ingest path.
 *  - Keep in sync with scripts/audit-metrics.mjs.
 */

import { METRIC_IDS, type MetricId } from '@/constants/metricIds';
import { getMetricLabel } from '@/lib/metricLabels';

export type MetricSurface =
  | 'terminal'
  | 'lab:de-dollarization'
  | 'lab:brics'
  | 'lab:us-macro'
  | 'lab:energy'
  | 'intel:india'
  | 'intel:china'
  | 'tools'
  | 'country';

export interface MetricMeta {
  id: MetricId | string;
  label: string;
  unit?: string;
  source?: string;
  surfaces: MetricSurface[];
  frequency?: string;
}

/** Seed meta for Terminal + core de-dollarization / BRICS surfaces (v1). */
export const METRIC_META: Record<string, MetricMeta> = {
  [METRIC_IDS.GOLD_PRICE_USD]: {
    id: METRIC_IDS.GOLD_PRICE_USD,
    label: getMetricLabel(METRIC_IDS.GOLD_PRICE_USD) || 'Gold Price (USD)',
    unit: 'USD/oz',
    source: 'Market / WGC',
    surfaces: ['terminal', 'lab:de-dollarization'],
    frequency: 'daily',
  },
  [METRIC_IDS.BRICS_GDP_PPP_TN]: {
    id: METRIC_IDS.BRICS_GDP_PPP_TN,
    label: 'BRICS GDP (PPP)',
    unit: 'Tn USD',
    source: 'IMF',
    surfaces: ['lab:brics', 'lab:de-dollarization'],
    frequency: 'annual',
  },
  [METRIC_IDS.BRICS_GOLD_HOLDINGS_TONNES]: {
    id: METRIC_IDS.BRICS_GOLD_HOLDINGS_TONNES,
    label: 'BRICS Gold Holdings',
    unit: 'tonnes',
    source: 'WGC / IMF',
    surfaces: ['lab:brics', 'lab:de-dollarization'],
    frequency: 'monthly',
  },
  [METRIC_IDS.BRICS_GOLD_SHARE_PCT]: {
    id: METRIC_IDS.BRICS_GOLD_SHARE_PCT,
    label: 'BRICS Gold Share of Reserves',
    unit: '%',
    source: 'Derived',
    surfaces: ['lab:brics'],
    frequency: 'monthly',
  },
  [METRIC_IDS.BRICS_USD_RESERVE_SHARE_PCT]: {
    id: METRIC_IDS.BRICS_USD_RESERVE_SHARE_PCT,
    label: 'BRICS USD Reserve Share',
    unit: '%',
    source: 'IMF COFER',
    surfaces: ['lab:brics', 'lab:de-dollarization'],
    frequency: 'quarterly',
  },
  [METRIC_IDS.FED_BALANCE_SHEET]: {
    id: METRIC_IDS.FED_BALANCE_SHEET,
    label: 'Fed Balance Sheet',
    unit: 'USD',
    source: 'FRED',
    surfaces: ['terminal', 'lab:us-macro'],
    frequency: 'weekly',
  },
  [METRIC_IDS.RRP_BALANCE_BN]: {
    id: METRIC_IDS.RRP_BALANCE_BN,
    label: 'Reverse Repo Balance',
    unit: 'Bn USD',
    source: 'NY Fed / FRED',
    surfaces: ['terminal', 'tools'],
    frequency: 'daily',
  },
  [METRIC_IDS.GLOBAL_GOLD_SHARE_PCT]: {
    id: METRIC_IDS.GLOBAL_GOLD_SHARE_PCT,
    label: 'Global Gold Share of Reserves',
    unit: '%',
    source: 'IMF COFER',
    surfaces: ['terminal', 'lab:de-dollarization'],
    frequency: 'quarterly',
  },
};

export function getMetricMeta(metricId: string): MetricMeta | undefined {
  return METRIC_META[metricId];
}

/** Terminal + core lab metric IDs that should have meta entries (v1 coverage set). */
export const CORE_METRIC_META_IDS = Object.keys(METRIC_META);

export function hasMetricMeta(metricId: string): boolean {
  return metricId in METRIC_META;
}
