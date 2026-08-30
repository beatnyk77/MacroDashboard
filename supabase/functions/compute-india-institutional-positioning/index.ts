import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { computeIndiaInstitutionalSignals, type DailySignalPoint, type SectorReport } from '../_shared/indiaInstitutionalSignals.ts';

const METRIC_IDS = ['IN_FII_CASH_NET', 'IN_DII_CASH_NET', 'IN_NIFTY_RETURN', 'IN_MARKET_BREADTH', 'IN_INDIA_VIX', 'IN_USD_INR_RETURN', 'IN_RBI_LIQUIDITY_IMPULSE', 'IN_BANK_CREDIT_GROWTH_YOY'];

export async function computeIndiaPositioning(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
  const { data: rows, error } = await supabase.from('metric_observations').select('metric_id, as_of_date, value').in('metric_id', METRIC_IDS).order('as_of_date', { ascending: true });
  if (error) throw error;
  const byDate = new Map<string, Record<string, number>>();
  for (const row of rows ?? []) { const entry = byDate.get(row.as_of_date) ?? {}; entry[row.metric_id] = Number(row.value); byDate.set(row.as_of_date, entry); }
  const points: DailySignalPoint[] = [...byDate.entries()]
    .filter(([, values]) => Number.isFinite(values.IN_FII_CASH_NET) && Number.isFinite(values.IN_DII_CASH_NET))
    .map(([date, values]) => ({ date, fii: values.IN_FII_CASH_NET, dii: values.IN_DII_CASH_NET, nifty: values.IN_NIFTY_RETURN ?? null, breadth: values.IN_MARKET_BREADTH ?? null, vix: values.IN_INDIA_VIX ?? null, usdInr: values.IN_USD_INR_RETURN ?? null, liquidity: values.IN_RBI_LIQUIDITY_IMPULSE ?? null, credit: values.IN_BANK_CREDIT_GROWTH_YOY ?? null }));
  const { data: sectorRows, error: sectorError } = await supabase.from('india_institutional_sector_observations').select('sector_key, report_period_end, equity_flow_inr_crore, equity_aum_inr_crore').order('report_period_end', { ascending: true });
  if (sectorError) throw sectorError;
  const sectorMap = new Map<string, SectorReport>();
  for (const row of sectorRows ?? []) { const report = sectorMap.get(row.report_period_end) ?? { date: row.report_period_end, sectors: [] }; report.sectors.push({ sectorKey: row.sector_key, flow: Number(row.equity_flow_inr_crore ?? 0), aum: Number(row.equity_aum_inr_crore ?? 0) }); sectorMap.set(row.report_period_end, report); }
  const snapshot = computeIndiaInstitutionalSignals(points, [...sectorMap.values()]);
  if (!snapshot.asOf) throw new Error('No dated institutional observations available');
  const { error: upsertError } = await supabase.from('india_institutional_positioning_snapshots').upsert({ as_of_date: snapshot.asOf, score: snapshot.score, regime: snapshot.regime, confidence: snapshot.confidence, coverage_mask: snapshot.coverageMask, components: { foreign_exit: snapshot.foreignExit, absorption: snapshot.absorption, flow_price: snapshot.flowPrice, sector_rotation: snapshot.sectorRotation, market_confirmation: snapshot.marketConfirmation }, input_dates: { daily: points.map((point) => point.date), sector: [...sectorMap.keys()] }, calculation_version: snapshot.calculationVersion }, { onConflict: 'as_of_date' });
  if (upsertError) throw upsertError;
  return { ok: true, counts: { upserted: 1 }, meta: { as_of_date: snapshot.asOf, regime: snapshot.regime, confidence: snapshot.confidence } };
}

serveIngest('compute-india-institutional-positioning', async () => computeIndiaPositioning(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')), { timeoutMs: 20 * 60 * 1000, retries: 2 });
