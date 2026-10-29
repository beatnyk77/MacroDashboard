/**
 * EIA Weekly Petroleum Status Report series stored by ingest-eia-weekly.
 * Pure helpers only (no Deno or network access) so they can be unit-tested under vitest.
 */

export interface EiaWeeklySeries {
  /** EIA series id, e.g. WCESTUS1. */
  id: string;
  /** EIA API v2 route holding the series. */
  route: string;
  /** metric_observations.metric_id the series is stored under. */
  metricId: string;
  /** Multiplier applied to the EIA value before storing (e.g. thousand barrels to million barrels). */
  scale: number;
  /** Unit of the stored value. */
  unit: string;
  label: string;
}

export const EIA_WEEKLY_SERIES: EiaWeeklySeries[] = [
  { id: 'WCESTUS1', route: 'petroleum/stoc/wstk', metricId: 'EIA_WKLY_CRUDE_STOCKS_KBBL', scale: 1, unit: 'kbbl', label: 'US commercial crude stocks excl. SPR' },
  { id: 'W_EPC0_SAX_YCUOK_MBBL', route: 'petroleum/stoc/wstk', metricId: 'EIA_WKLY_CUSHING_STOCKS_KBBL', scale: 1, unit: 'kbbl', label: 'Cushing, OK crude stocks' },
  { id: 'WGTSTUS1', route: 'petroleum/stoc/wstk', metricId: 'EIA_WKLY_GASOLINE_STOCKS_KBBL', scale: 1, unit: 'kbbl', label: 'US total gasoline stocks' },
  { id: 'WDISTUS1', route: 'petroleum/stoc/wstk', metricId: 'EIA_WKLY_DISTILLATE_STOCKS_KBBL', scale: 1, unit: 'kbbl', label: 'US distillate fuel oil stocks' },
  { id: 'WKJSTUS1', route: 'petroleum/stoc/wstk', metricId: 'EIA_WKLY_JET_STOCKS_KBBL', scale: 1, unit: 'kbbl', label: 'US kerosene-type jet fuel stocks' },
  // Existing registered series, stored in million barrels / percent; same values the lab already read.
  { id: 'WCSSTUS1', route: 'petroleum/stoc/wstk', metricId: 'OIL_SPR_LEVEL_US', scale: 0.001, unit: 'mbbl', label: 'US Strategic Petroleum Reserve' },
  { id: 'WPULEUS3', route: 'petroleum/pnp/wiup', metricId: 'OIL_REFINERY_UTILIZATION_US', scale: 1, unit: 'percent', label: 'US refinery utilization' },
  { id: 'WRPUPUS2', route: 'petroleum/cons/wpsup', metricId: 'EIA_WKLY_PRODUCT_SUPPLIED_KBD', scale: 1, unit: 'kbd', label: 'US total product supplied' },
  // Route petroleum/sum/sndw not yet confirmed against the live API (rate-limited during the build);
  // a wrong route surfaces as a per-series error in the response meta, it does not block the others.
  { id: 'WCRFPUS2', route: 'petroleum/sum/sndw', metricId: 'EIA_WKLY_CRUDE_PRODUCTION_KBD', scale: 1, unit: 'kbd', label: 'US field production of crude' },
  { id: 'WCRNTUS2', route: 'petroleum/sum/sndw', metricId: 'EIA_WKLY_CRUDE_NET_IMPORTS_KBD', scale: 1, unit: 'kbd', label: 'US net imports of crude' },
];

export interface EiaRow {
  period: string;
  value: string | number | null;
}

export interface EiaObservation {
  metric_id: string;
  as_of_date: string;
  value: number;
  last_updated_at: string;
  provenance: 'api_live';
  source_ref: string;
}

export function buildEiaUrl(series: EiaWeeklySeries, apiKey: string, start: string, offset: number, length: number): string {
  const params = new URLSearchParams({
    api_key: apiKey,
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[series][]': series.id,
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    start,
    offset: String(offset),
    length: String(length),
  });
  return `https://api.eia.gov/v2/${series.route}/data/?${params.toString()}`;
}

/** Drops null / non-numeric rows (EIA publishes gaps as null) and applies the series scale. */
export function rowsToObservations(series: EiaWeeklySeries, rows: EiaRow[], nowIso: string): EiaObservation[] {
  const out: EiaObservation[] = [];
  for (const row of rows) {
    if (row.value === null || row.value === '') continue;
    const raw = typeof row.value === 'number' ? row.value : parseFloat(row.value);
    if (!Number.isFinite(raw) || !/^\d{4}-\d{2}-\d{2}$/.test(row.period)) continue;
    out.push({
      metric_id: series.metricId,
      as_of_date: row.period,
      value: Math.round(raw * series.scale * 1e6) / 1e6,
      last_updated_at: nowIso,
      provenance: 'api_live',
      source_ref: `eia:api_v2:${series.route}:${series.id}`,
    });
  }
  return out;
}

/** First period to request: a full backfill, or enough recent weeks to pick up EIA revisions. */
export function startDate(backfill: boolean, now: Date): string {
  if (backfill) return '2015-01-01';
  const d = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
