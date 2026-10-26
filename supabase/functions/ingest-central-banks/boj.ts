// Bank of Japan balance-sheet series, stored in trillion JPY.
// Both sources publish in units of 100 million JPY: 1 trillion = 10,000 x 100 million.
export const HUNDRED_MILLION_PER_TRILLION = 10_000;

// BoJ Time-Series Data Search API, monetary base (average amounts outstanding, monthly).
// FRED has no Japanese monetary base series (JPNBASE does not exist).
export const BOJ_MONETARY_BASE_URL =
  'https://www.stat-search.boj.or.jp/api/v1/getDataCode?format=json&lang=en&db=MD01&code=MABS1AN11&startDate=199801';

export interface BojObservation {
  metric_id: string;
  as_of_date: string;
  value: number;
  provenance: 'api_live';
  source_ref: string;
}

/** FRED JPNASSETS observations (100 million JPY) -> BOJ_TOTAL_ASSETS_TRJPY rows. */
export function fromFredJpnAssets(observations: { date: string; value: string }[]): BojObservation[] {
  return observations
    .map((obs) => ({ date: obs.date, raw: parseFloat(obs.value) }))
    .filter((obs) => Number.isFinite(obs.raw))
    .map((obs) => ({
      metric_id: 'BOJ_TOTAL_ASSETS_TRJPY',
      as_of_date: obs.date,
      value: Math.round((obs.raw / HUNDRED_MILLION_PER_TRILLION) * 10_000) / 10_000,
      provenance: 'api_live',
      source_ref: 'live_api:fred:JPNASSETS',
    }));
}

/** BoJ API getDataCode response for MABS1AN11 -> BOJ_MONETARY_BASE_TRJPY rows (dated the 1st). */
export function fromBojMonetaryBase(body: any): BojObservation[] {
  const series = body?.RESULTSET?.find((s: any) => s?.SERIES_CODE === 'MABS1AN11');
  if (series?.UNIT !== '100 million yen') {
    throw new Error(`BoJ MABS1AN11 unit changed or missing: ${series?.UNIT ?? 'no series'}`);
  }
  const dates: number[] = series.VALUES?.SURVEY_DATES ?? [];
  const values: (number | null)[] = series.VALUES?.VALUES ?? [];
  return dates.flatMap((yyyymm, i) => {
    const raw = values[i];
    if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) return [];
    const s = String(yyyymm);
    return [{
      metric_id: 'BOJ_MONETARY_BASE_TRJPY',
      as_of_date: `${s.slice(0, 4)}-${s.slice(4, 6)}-01`,
      value: Math.round((Number(raw) / HUNDRED_MILLION_PER_TRILLION) * 10_000) / 10_000,
      provenance: 'api_live',
      source_ref: 'live_api:boj:MABS1AN11',
    }];
  });
}
