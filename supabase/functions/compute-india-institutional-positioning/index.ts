import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import {
  computeIndiaInstitutionalSignals,
  hasSufficientDailyHistory,
  MIN_ACCEPTED_DAILY_OBSERVATIONS,
  type DailySignalPoint,
  type PositioningRegime,
  type SectorReport,
} from '../_shared/indiaInstitutionalSignals.ts';

const METRIC_IDS = [
  'IN_FII_CASH_NET', 'IN_DII_CASH_NET', 'IN_NIFTY_RETURN', 'IN_MARKET_BREADTH',
  'IN_INDIA_VIX', 'IN_USD_INR_RETURN', 'IN_RBI_LIQUIDITY_IMPULSE', 'IN_BANK_CREDIT_GROWTH_YOY',
];

type RawMetricRow = { metric_id: string; as_of_date: string; value: number | string | null };
type ValuePoint = { value: number; date: string };

function asFinite(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function latestAtOrBefore(series: ValuePoint[], date: string, maxAgeDays: number): ValuePoint | null {
  const candidate = [...series].reverse().find((point) => point.date <= date);
  if (!candidate) return null;
  const age = (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${candidate.date}T00:00:00Z`).getTime()) / 86_400_000;
  return age >= 0 && age <= maxAgeDays ? candidate : null;
}

function buildDailyPoints(rows: RawMetricRow[]): DailySignalPoint[] {
  const byMetric = new Map<string, ValuePoint[]>();
  for (const row of rows) {
    const value = asFinite(row.value);
    if (value === null) continue;
    const series = byMetric.get(row.metric_id) ?? [];
    series.push({ value, date: row.as_of_date });
    byMetric.set(row.metric_id, series);
  }
  for (const series of byMetric.values()) series.sort((a, b) => a.date.localeCompare(b.date));
  const fiiSeries = byMetric.get('IN_FII_CASH_NET') ?? [];
  const diiSeries = byMetric.get('IN_DII_CASH_NET') ?? [];
  const dates = [...new Set(fiiSeries.map((point) => point.date).filter((date) => diiSeries.some((point) => point.date === date)))].sort();
  const exact = (metricId: string, date: string) => byMetric.get(metricId)?.find((point) => point.date === date)?.value ?? null;
  return dates.map((date) => {
    const liquidity = latestAtOrBefore(byMetric.get('IN_RBI_LIQUIDITY_IMPULSE') ?? [], date, 21);
    const credit = latestAtOrBefore(byMetric.get('IN_BANK_CREDIT_GROWTH_YOY') ?? [], date, 90);
    return {
      date,
      fii: exact('IN_FII_CASH_NET', date) as number,
      dii: exact('IN_DII_CASH_NET', date) as number,
      nifty: exact('IN_NIFTY_RETURN', date),
      breadth: exact('IN_MARKET_BREADTH', date),
      vix: exact('IN_INDIA_VIX', date),
      usdInr: exact('IN_USD_INR_RETURN', date),
      liquidity: liquidity?.value ?? null,
      liquidityDate: liquidity?.date ?? null,
      credit: credit?.value ?? null,
      creditDate: credit?.date ?? null,
    };
  });
}

function buildSectorReports(rows: Array<Record<string, unknown>>): SectorReport[] {
  const reports = new Map<string, SectorReport>();
  for (const row of rows) {
    const date = String(row.report_period_end ?? '');
    const flow = asFinite(row.equity_flow_inr_crore);
    const aum = asFinite(row.equity_aum_inr_crore);
    if (!date || flow === null || aum === null || aum <= 0) continue;
    const report = reports.get(date) ?? { date, sectors: [] };
    report.sectors.push({ sectorKey: String(row.sector_key ?? ''), flow, aum });
    reports.set(date, report);
  }
  return [...reports.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function computeIndiaPositioning(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
  const { data: rows, error } = await supabase
    .from('metric_observations')
    .select('metric_id, as_of_date, value')
    .in('metric_id', METRIC_IDS)
    .order('as_of_date', { ascending: true });
  if (error) throw error;

  const points = buildDailyPoints((rows ?? []) as RawMetricRow[]);
  if (!hasSufficientDailyHistory(points)) {
    return {
      ok: true,
      counts: { upserted: 0 },
      meta: { coverage: 'insufficient_history', accepted_daily_observations: points.length, required_daily_observations: MIN_ACCEPTED_DAILY_OBSERVATIONS },
    };
  }

  const { data: sectorRows, error: sectorError } = await supabase
    .from('india_institutional_sector_observations')
    .select('sector_key, report_period_end, equity_flow_inr_crore, equity_aum_inr_crore')
    .order('report_period_end', { ascending: true });
  if (sectorError) throw sectorError;
  const sectors = buildSectorReports((sectorRows ?? []) as Array<Record<string, unknown>>);

  const latestDate = points.at(-1)?.date;
  const { data: previousRows, error: previousError } = await supabase
    .from('india_institutional_positioning_snapshots')
    .select('regime, components')
    .lt('as_of_date', latestDate ?? '')
    .order('as_of_date', { ascending: false })
    .limit(1);
  if (previousError) throw previousError;
  const previous = previousRows?.[0] as { regime?: PositioningRegime; components?: { candidate_regime?: PositioningRegime } } | undefined;
  const snapshot = computeIndiaInstitutionalSignals(points, sectors, previous?.regime ?? null, previous?.components?.candidate_regime ?? null);
  if (!snapshot.asOf) throw new Error('No dated institutional observations available');

  const input_dates = {
    metric_ids: METRIC_IDS,
    daily: points.map((point) => point.date),
    sector: sectors.map((report) => report.date),
    weights: { foreign_exit: 0.25, absorption: 0.2, flow_price: 0.15, sector_rotation: 0.15, market_confirmation: 0.25 },
    normalization_window: { daily_sessions: 1260, tactical_sessions: 20, sector_reports: 12, sector_reference_reports: 9 },
    freshness_days: { daily: 2, weekly: 21, monthly: 90 },
  };
  const components = {
    foreign_exit: snapshot.foreignExit,
    absorption: snapshot.absorption,
    flow_price: snapshot.flowPrice,
    sector_rotation: snapshot.sectorRotation,
    market_confirmation: snapshot.marketConfirmation,
    candidate_regime: snapshot.candidateRegime,
  };
  const { error: upsertError } = await supabase.from('india_institutional_positioning_snapshots').upsert({
    as_of_date: snapshot.asOf,
    score: snapshot.score,
    regime: snapshot.regime,
    confidence: snapshot.confidence,
    coverage_mask: snapshot.coverageMask,
    components,
    input_dates,
    calculation_version: snapshot.calculationVersion,
  }, { onConflict: 'as_of_date' });
  if (upsertError) throw upsertError;
  return { ok: true, counts: { upserted: 1 }, meta: { as_of_date: snapshot.asOf, regime: snapshot.regime, confidence: snapshot.confidence, accepted_daily_observations: points.length } };
}

serveIngest('compute-india-institutional-positioning', async () => computeIndiaPositioning(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')), { timeoutMs: 20 * 60 * 1000, retries: 2 });
