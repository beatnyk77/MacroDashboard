/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

interface ObservationRow {
  metric_id: string;
  as_of_date: string;
  value: number;
}

interface ComponentSeries {
  cs: Map<string, number>;      // Credit spread (HY OAS)
  r10y: Map<string, number>;    // Real 10Y TIPS
  slope: Map<string, number>;   // 10Y-2Y slope
  fx: Map<string, number>;      // Broad USD
  sp500: Map<string, number>;   // S&P 500
  commodity: Map<string, number>; // Commodity index
}

// ── Math helpers ─────────────────────────────────────────────────────────────

export function calculateZScore(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 1 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length || 1);
  const std = Math.sqrt(variance) || 1;
  return { mean, std };
}

export function computeRollingStats(values: number[], window = 756) {
  // 756 trading days ~ 3 years
  const results: Array<{ mean: number; std: number }> = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    results.push(calculateZScore(slice));
  }
  return results;
}

export async function doComputeFinancialConditions(supabase: any): Promise<IngestResult> {
  const metricIds = [
    'US_HY_OAS',
    'US_10Y_TIPS_YIELD',
    'US_YIELD_CURVE_10Y2Y',
    'US_BROAD_DOLLAR',
    'US_SP500_INDEX',
    'GLOBAL_COMMODITIES_INDEX',
  ];

  // Fetch observations ordered chronologically
  const { data: rawObs, error: fetchErr } = await supabase
    .from('metric_observations')
    .select('metric_id, as_of_date, value')
    .in('metric_id', metricIds)
    .order('as_of_date', { ascending: true });

  if (fetchErr) {
    throw new Error(`Failed to fetch input observations: ${fetchErr.message}`);
  }

  const seriesByMetric: Record<string, Map<string, number>> = {
    US_HY_OAS: new Map(),
    US_10Y_TIPS_YIELD: new Map(),
    US_YIELD_CURVE_10Y2Y: new Map(),
    US_BROAD_DOLLAR: new Map(),
    US_SP500_INDEX: new Map(),
    GLOBAL_COMMODITIES_INDEX: new Map(),
  };

  const datesSet = new Set<string>();

  for (const row of (rawObs || [])) {
    const val = Number(row.value);
    if (!isNaN(val)) {
      seriesByMetric[row.metric_id]?.set(row.as_of_date, val);
      datesSet.add(row.as_of_date);
    }
  }

  const sortedDates = Array.from(datesSet).sort();
  if (sortedDates.length < 50) {
    return {
      ok: true,
      meta: { message: `Insufficient historical observations (${sortedDates.length} dates)` },
    };
  }

  // Sample weekly (e.g. Fridays or every 5 trading days) to ensure clean aligned multi-decade series
  const weeklyDates: string[] = [];
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]);
    // Take Fridays (day 5) or end of sequence
    if (d.getUTCDay() === 5 || i === sortedDates.length - 1) {
      weeklyDates.push(sortedDates[i]);
    }
  }

  // Compute 1-year changes (approx 52 weeks back)
  const LOOKBACK_WEEKS = 52;
  const fciRows: Array<{
    as_of_date: string;
    fci: number;
    commodity_cycle: number;
    z_cs: number;
    z_r10y: number;
    z_slope: number;
    z_fx: number;
    z_sp500: number;
  }> = [];

  // Temporary arrays for collecting YoY deltas
  const deltasCs: number[] = [];
  const deltasR10y: number[] = [];
  const deltasSlope: number[] = [];
  const pctFx: number[] = [];
  const pctSp500: number[] = [];
  const pctComm: number[] = [];

  // Helper for forward-filling metric value
  const getLatestVal = (metric: string, dateIdx: number): number | null => {
    const map = seriesByMetric[metric];
    if (!map) return null;
    for (let i = dateIdx; i >= 0; i--) {
      const v = map.get(sortedDates[i]);
      if (v !== undefined) return v;
    }
    return null;
  };

  const alignedPoints: Array<{
    date: string;
    dCs: number;
    dR10y: number;
    dSlope: number;
    pFx: number;
    pSp500: number;
    pComm: number;
  }> = [];

  for (let w = LOOKBACK_WEEKS; w < weeklyDates.length; w++) {
    const currDate = weeklyDates[w];
    const prevDate = weeklyDates[w - LOOKBACK_WEEKS];
    const currIdx = sortedDates.indexOf(currDate);
    const prevIdx = sortedDates.indexOf(prevDate);

    const csNow = getLatestVal('US_HY_OAS', currIdx);
    const csPrev = getLatestVal('US_HY_OAS', prevIdx);

    const r10yNow = getLatestVal('US_10Y_TIPS_YIELD', currIdx);
    const r10yPrev = getLatestVal('US_10Y_TIPS_YIELD', prevIdx);

    const slopeNow = getLatestVal('US_YIELD_CURVE_10Y2Y', currIdx);
    const slopePrev = getLatestVal('US_YIELD_CURVE_10Y2Y', prevIdx);

    const fxNow = getLatestVal('US_BROAD_DOLLAR', currIdx);
    const fxPrev = getLatestVal('US_BROAD_DOLLAR', prevIdx);

    const spNow = getLatestVal('US_SP500_INDEX', currIdx);
    const spPrev = getLatestVal('US_SP500_INDEX', prevIdx);

    const commNow = getLatestVal('GLOBAL_COMMODITIES_INDEX', currIdx);
    const commPrev = getLatestVal('GLOBAL_COMMODITIES_INDEX', prevIdx);

    if (csNow != null && csPrev != null &&
        r10yNow != null && r10yPrev != null &&
        slopeNow != null && slopePrev != null &&
        fxNow != null && fxPrev != null && fxPrev > 0 &&
        spNow != null && spPrev != null && spPrev > 0 &&
        commNow != null && commPrev != null && commPrev > 0) {

      alignedPoints.push({
        date: currDate,
        dCs: csNow - csPrev,
        dR10y: r10yNow - r10yPrev,
        dSlope: slopeNow - slopePrev,
        pFx: ((fxNow - fxPrev) / fxPrev) * 100,
        pSp500: ((spNow - spPrev) / spPrev) * 100,
        pComm: ((commNow - commPrev) / commPrev) * 100,
      });
    }
  }

  if (alignedPoints.length < 20) {
    return {
      ok: true,
      meta: { message: `Aligned weekly history too short (${alignedPoints.length} points)` },
    };
  }

  // Compute multi-year rolling Z-scores
  const ROLLING_WINDOW = 156; // 3 years of weekly observations

  const upsertRows: Array<{
    metric_id: string;
    as_of_date: string;
    value: number;
    z_score: number;
    staleness_flag: string;
  }> = [];

  for (let i = 0; i < alignedPoints.length; i++) {
    const startIdx = Math.max(0, i - ROLLING_WINDOW + 1);
    const windowSlice = alignedPoints.slice(startIdx, i + 1);

    const statCs = calculateZScore(windowSlice.map(p => p.dCs));
    const statR10y = calculateZScore(windowSlice.map(p => p.dR10y));
    const statSlope = calculateZScore(windowSlice.map(p => p.dSlope));
    const statFx = calculateZScore(windowSlice.map(p => p.pFx));
    const statSp = calculateZScore(windowSlice.map(p => p.pSp500));
    const statComm = calculateZScore(windowSlice.map(p => p.pComm));

    const pt = alignedPoints[i];

    // Standardized scores
    const zCs = (pt.dCs - statCs.mean) / statCs.std;
    const zR10y = (pt.dR10y - statR10y.mean) / statR10y.std;
    const zSlope = (pt.dSlope - statSlope.mean) / statSlope.std;
    const zFx = (pt.pFx - statFx.mean) / statFx.std;
    const zSp = (pt.pSp500 - statSp.mean) / statSp.std;
    const zComm = (pt.pComm - statComm.mean) / statComm.std;

    // Barclays FCI Sign convention: + = Tighter
    // + Credit Spreads
    // + Real 10Y Rate
    // - Yield curve slope (flattening = tighter)
    // + Dollar FX strength
    // - Stock market returns (declines = tighter)
    const fciComposite = (zCs + zR10y - zSlope + zFx - zSp) / 5;

    // Smoothed commodity cycle (12-week moving average of zComm)
    const commStart = Math.max(0, i - 12 + 1);
    const commAvg = alignedPoints.slice(commStart, i + 1)
      .map(p => (p.pComm - statComm.mean) / statComm.std)
      .reduce((sum, v) => sum + v, 0) / (i - commStart + 1);

    const round2 = (num: number) => Math.round(num * 100) / 100;

    upsertRows.push(
      { metric_id: 'BARCLAYS_GLOBAL_FCI', as_of_date: pt.date, value: round2(fciComposite), z_score: round2(fciComposite), staleness_flag: 'fresh' },
      { metric_id: 'COMMODITIES_CYCLE_ZSCORE', as_of_date: pt.date, value: round2(commAvg), z_score: round2(commAvg), staleness_flag: 'fresh' },
      { metric_id: 'FCI_CS_ZSCORE', as_of_date: pt.date, value: round2(zCs), z_score: round2(zCs), staleness_flag: 'fresh' },
      { metric_id: 'FCI_R10Y_ZSCORE', as_of_date: pt.date, value: round2(zR10y), z_score: round2(zR10y), staleness_flag: 'fresh' },
      { metric_id: 'FCI_SLOPE_ZSCORE', as_of_date: pt.date, value: round2(-zSlope), z_score: round2(-zSlope), staleness_flag: 'fresh' },
      { metric_id: 'FCI_FX_ZSCORE', as_of_date: pt.date, value: round2(zFx), z_score: round2(zFx), staleness_flag: 'fresh' },
      { metric_id: 'FCI_EQUITY_ZSCORE', as_of_date: pt.date, value: round2(-zSp), z_score: round2(-zSp), staleness_flag: 'fresh' },
    );
  }

  // Batch upsert to metric_observations
  const BATCH_SIZE = 500;
  let totalUpserted = 0;
  for (let b = 0; b < upsertRows.length; b += BATCH_SIZE) {
    const chunk = upsertRows.slice(b, b + BATCH_SIZE);
    const { error: upsertErr } = await supabase
      .from('metric_observations')
      .upsert(chunk, { onConflict: 'metric_id, as_of_date' });

    if (upsertErr) {
      throw new Error(`Upsert error at chunk ${b}: ${upsertErr.message}`);
    }
    totalUpserted += chunk.length;
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { pointsCalculated: alignedPoints.length },
  };
}

// ── Serve HTTP Handler ───────────────────────────────────────────────────────
if (import.meta.main) {
  serveIngest('compute-financial-conditions', async (_req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    return await doComputeFinancialConditions(supabase);
  });
}
